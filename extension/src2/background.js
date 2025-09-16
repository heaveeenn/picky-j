/**
 * Background Service Worker - 오케스트레이션 및 상태 관리
 *
 * 역할:
 * 1. Content Script에서 받은 데이터를 DataSender로 전달
 * 2. 확장프로그램 전역 상태 관리 (토글, 사용자 세션)
 * 3. Chrome Extension API 이벤트 처리
 * 4. 웹 네비게이션 및 사용자 프로필 관리
 */

import { DataSender } from "./modules/DataSender.js";
import { STORAGE_KEYS, CHROME_PAGES } from "./config/constants.js";

console.log("📡 picky background service worker loaded");
console.log("Service Worker Registration:", self.registration);

// DataSender 모듈 초기화
const dataSender = new DataSender();

// 전역 상태 관리
let isTrackingEnabled = true;

/**
 * 사용자 세션 초기화 (확장프로그램 설치 시)
 */
async function initializeUserSession() {
  try {
    const userData = await chrome.storage.sync.get([
      STORAGE_KEYS.USER_ID,
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.TRACKING_ENABLED,
    ]);

    // 임시 사용자 ID 생성 (필요시)
    if (!userData[STORAGE_KEYS.USER_ID]) {
      const tempUserId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await chrome.storage.sync.set({ [STORAGE_KEYS.USER_ID]: tempUserId });
      console.log("🆔 Temporary user ID created:", tempUserId);

      // 새 사용자의 경우 topSites 수집하여 프로필 초기화
      const topSites = await getUserTopSites();
      if (topSites.length > 0) {
        await dataSender.sendUserProfileData(tempUserId, { topSites });
      }
    }

    // 트래킹 상태 로드 (기본값: true)
    isTrackingEnabled = userData[STORAGE_KEYS.TRACKING_ENABLED] !== false;
    dataSender.updateTrackingStatus(isTrackingEnabled);

    console.log("✅ User session initialized:", {
      userId: userData[STORAGE_KEYS.USER_ID],
      trackingEnabled: isTrackingEnabled,
    });
  } catch (error) {
    console.error("❌ Failed to initialize user session:", error);
  }
}

// 자주 방문하는 사이트 수집
async function getUserTopSites() {
  try {
    const topSites = await chrome.topSites.get();
    console.log("Top sites collected:", topSites.length);
    return topSites.map((site) => ({
      url: site.url,
      title: site.title,
      domain: new URL(site.url).hostname,
    }));
  } catch (error) {
    console.error("Error getting top sites:", error);
    return [];
  }
}

/**
 * Chrome Extension 메시지 처리
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Background received message:", message.type, message);

  (async () => {
    try {
      switch (message.type) {
        case "SEND_BROWSING_DATA":
          // Content Script에서 받은 브라우징 데이터를 DataSender로 전달
          console.log("📊 Processing browsing data from content script");
          await dataSender.processBrowsingData(message.data);
          // 비동기 처리이므로 응답하지 않음
          break;

        case "SEND_UNLOAD_DATA":
          // beforeunload 시 즉시 전송 (sendBeacon 사용)
          console.log("🚨 Processing unload data from content script");
          await dataSender.sendUnloadData(message.data);
          break;

        case "SYNC_DATA":
          // 수동 동기화 요청
          console.log("🔄 Manual sync requested");
          await dataSender.forceSyncData();
          sendResponse({ success: true });
          break;

        case "TOGGLE_TRACKING":
          // 토글 상태 변경
          console.log("🔄 Toggling tracking:", message.enabled);
          isTrackingEnabled = message.enabled;

          // DataSender에 상태 업데이트
          dataSender.updateTrackingStatus(isTrackingEnabled);

          // Chrome Storage에 저장
          await chrome.storage.sync.set({
            [STORAGE_KEYS.TRACKING_ENABLED]: isTrackingEnabled,
          });

          sendResponse({ success: true, enabled: isTrackingEnabled });
          break;

        case "GET_STATUS": {
          // 현재 상태 조회 (디버깅용)
          const queueStatus = dataSender.getQueueStatus();
          sendResponse({
            success: true,
            status: {
              tracking: isTrackingEnabled,
              queue: queueStatus,
            },
          });
          break;
        }

        default:
          console.log("❓ Unknown message type:", message.type);
          sendResponse({ success: false, error: "Unknown message type" });
      }
    } catch (error) {
      console.error("❌ Error handling message:", error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  return true; // 비동기 응답 유지
});

/**
 * Chrome Extension 이벤트 리스너
 */

// 확장프로그램 설치 시
chrome.runtime.onInstalled.addListener(() => {
  console.log("📦 picky extension installed");
  initializeUserSession();
});

// 서비스 워커 시작 시 (재시작 시)
chrome.runtime.onStartup.addListener(() => {
  console.log("🔄 picky service worker started");
  initializeUserSession();
});

// 탭 업데이트 감지
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !isInternalPage(tab.url)) {
    console.log("🌐 New page loaded:", {
      tabId: tabId,
      url: tab.url,
      title: tab.title?.substring(0, 50) + "...",
    });
  }
});

// 탭 제거 감지 (탭 닫을 때 데이터 수집)
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  try {
    console.log("🗑️ Tab removed:", tabId, removeInfo);

    // 로컬 스토리지에서 해당 탭의 임시 데이터가 있는지 확인
    const result = await chrome.storage.local.get();

    for (const [key, data] of Object.entries(result)) {
      if (key.startsWith("browsing_") && data && data.url) {
        // 최근 5분 내의 데이터만 처리 (탭 닫힘과 관련된 데이터)
        const dataTime = new Date(data.timestamp || data.collectedAt);
        const now = new Date();
        const timeDiff = (now - dataTime) / 1000; // 초 단위

        if (timeDiff <= 300) {
          // 5분 이내
          console.log("🚨 Processing tab close data:", {
            key: key,
            url: data.url,
            timeSpent: data.timeSpent,
            timeDiff: timeDiff,
          });

          // DataSender를 통해 즉시 처리
          await dataSender.sendUnloadData(data);

          // 처리된 데이터 삭제
          await chrome.storage.local.remove(key);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error handling tab removal:", error);
  }
});

// 페이지 탐색 이벤트 수집 (webNavigation API) - 현재 사용하지 않음
/*
chrome.webNavigation.onCommitted.addListener((details) => {
    // 메인 프레임만 수집 (iframe 제외)
    if (details.frameId === 0 && !isInternalPage(details.url)) {
        const navigationData = {
            url: details.url,
            transitionType: details.transitionType,
            transitionQualifiers: details.transitionQualifiers || [],
            timestamp: new Date().toISOString(),
            tabId: details.tabId
        };
        
        console.log('🧭 Navigation detected:', navigationData);
    }
});
*/

// 내부 페이지 체크 헬퍼
function isInternalPage(url) {
  return CHROME_PAGES.some((prefix) => url.startsWith(prefix));
}

/**
 * 서비스 워커 정리
 */
console.log("✅ picky background service worker fully initialized");
