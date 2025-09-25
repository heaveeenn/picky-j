/**
 * background.js
 *
 * Chrome Extension 백그라운드 스크립트
 * - content.js에서 온 데이터를 받아서 Python 서버로 전송
 * - 배치 처리 및 에러 처리 담당
 * - [추가] UI 관련 설정(캐릭터, 알림 등) 관리 기능 통합
 */

// --- [추가] UI 설정 관련 ---
// 기본 설정 스키마
const DEFAULT_SETTINGS = {
  isExtensionOn: true,
  isCharacterOn: true,
  notificationInterval: 30,
  // 관심 카테고리는 맵 형태로 저장한다.
  selectedCategories: {
    tech: true,
    news: true,
    education: false,
    design: true,
    business: false,
    entertainment: false,
  },
};

/**
 * [추가] 현재 스토리지 값 중 비어 있는 키만 기본값으로 채운다.
 * - 사용자가 이미 설정한 값은 덮어쓰지 않는다.
 */
async function ensureDefaults() {
  try {
    // 기본값 설정
    const keys = Object.keys(DEFAULT_SETTINGS);
    const current = await chrome.storage.sync.get(keys);

    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      const cur = current[k];
      const isEmpty = cur === undefined || cur === null;
      if (isEmpty) {
        toSet[k] = v;
      }
    }

    if (Object.keys(toSet).length > 0) {
      await chrome.storage.sync.set(toSet);
    }
  } catch (err) {
    // 초기화 실패는 치명적이지 않으므로 로깅만 수행한다.
    // eslint-disable-next-line no-console
    console.warn('[background] ensureDefaults failed:', err);
  }
}
// --- [추가] UI 설정 관련 끝 ---

import { DataSender } from "./modules/DataSender.js";
import { UserSession } from "./modules/UserSession.js";
import { HistoryCollector } from "./modules/HistoryCollector.js";
import { initApi } from "./modules/AuthenticatedApi.js";

console.log("🔧 Background script 시작");

const dataSender = new DataSender();
const userSession = new UserSession();
initApi(userSession); // 인증 API 모듈 초기화
const historyCollector = new HistoryCollector(userSession);

/**
 * 사용자 설정 조회 함수
 */
async function fetchUserSettings() {
  try {
    const response = await fetch('http://localhost:8080/api/users/me/settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSession.jwt}`
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();

    // ApiResponse 형태: { success: boolean, message: string, data: UserSettingsResponseDto }
    if (apiResponse.success && apiResponse.data) {
      return apiResponse.data;
    } else {
      throw new Error(apiResponse.message || 'Invalid response format');
    }
  } catch (error) {
    console.error('사용자 설정 조회 실패:', error);
    return null;
  }
}

// Service Worker 재시작시 세션 자동 복원
(async () => {
  try {
    const sessionInfo = await userSession.tryAutoLogin();
    console.log("👤 사용자 세션 초기화 완료:", sessionInfo);

    // 자동 로그인 성공시 히스토리 수집 체크
    if (sessionInfo.success) {
      await checkAndCollectHistory();
    }
  } catch (error) {
    console.error("❌ 사용자 세션 초기화 실패:", error);
  }
})();

// 히스토리 수집 체크 및 실행 함수
async function checkAndCollectHistory() {
  try {
    const storage = await chrome.storage.local.get(["historyCollected"]);

    // 아직 히스토리를 수집하지 않았다면 수집 시작
    if (!storage.historyCollected) {
      console.log("📚 최초 로그인 - 히스토리 데이터 수집 시작");

      const result = await historyCollector.collectHistoryWithContent();
      console.log(
        "✅ 로그인 후 히스토리 수집 완료:",
        result.contentExtractionSummary
      );

      // 수집 완료 플래그 저장
      await chrome.storage.local.set({ historyCollected: true });
      console.log("📝 히스토리 수집 완료 플래그 저장");
    } else {
      console.log("ℹ️ 히스토리 이미 수집됨 - 건너뛰기");
    }
  } catch (error) {
    console.error("❌ 히스토리 수집 실패:", error);
  }
}

// content.js와 popup에서 온 메시지 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("📨 메시지 받음:", message);

  // 브라우징 데이터 처리 (content.js에서)
  if (message.type === "BROWSING_DATA") {
    // 1. 로그인 상태 확인
    const userId = userSession.getUserId();
    if (!userId || !userSession.isUserAuthenticated()) {
      console.log("⚠️ 로그인되지 않음 - 데이터 수집 건너뛰기");
      sendResponse({ success: false, reason: "User not authenticated" });
      return;
    }

    // 2. 토글 상태 확인 (Chrome Storage에서)
    const settings = await chrome.storage.sync.get(["isExtensionOn"]);
    const isTrackingEnabled = settings.isExtensionOn !== false;

    if (!isTrackingEnabled) {
      console.log("⚠️ 데이터 수집 비활성화 - 큐에 추가하지 않음");
      sendResponse({ success: false, reason: "Tracking disabled" });
      return;
    }

    // 3. 도메인 차단 상태 확인
    const userSettings = await fetchUserSettings();
    if (userSettings && userSettings.blockedDomains) {
      const currentDomain = new URL(message.data.url).hostname;
      const isBlocked = userSettings.blockedDomains.some(blockedDomain => {
        return currentDomain.includes(blockedDomain) || blockedDomain.includes(currentDomain);
      });

      if (isBlocked) {
        console.log("🚫 차단된 도메인 - 큐에 추가하지 않음:", currentDomain);
        sendResponse({ success: false, reason: "Domain blocked" });
        return;
      }
    }

    // 4. 사용자 ID와 함께 데이터를 큐에 추가
    dataSender.addToQueue(message.data, userId);
    console.log("✅ 데이터 큐에 추가 완료 - userId:", userId);

    sendResponse({ success: true });
    return;
  }

  // 사용자 세션 정보 조회 (popup에서)
  if (message.type === "GET_USER_SESSION") {
    const isAuthenticated = userSession.isUserAuthenticated();
    const userInfo = isAuthenticated ? userSession.getUserInfo() : null;

    console.log("👤 세션 정보 요청 응답:", { isAuthenticated, userInfo });
    sendResponse({
      success: true,
      isAuthenticated: isAuthenticated,
      userInfo: userInfo,
    });
    return;
  }

  // 사용자 ID 조회 (content script에서)
  if (message.type === "GET_USER_ID") {
    const userId = userSession.getUserId();
    console.log("👤 userId 요청 응답:", userId);
    sendResponse({ userId: userId });
    return;
  }

  // Content Script에서 Service Worker 활성화 및 자동 로그인 트리거
  if (message.type === "TRIGGER_AUTO_LOGIN") {
    console.log("🔄 Content Script에서 자동 로그인 트리거 요청:", message.url);

    // 이미 로그인되어 있는지 확인
    if (userSession.isUserAuthenticated()) {
      console.log("✅ 이미 로그인된 상태");
      sendResponse({ success: true, alreadyAuthenticated: true });
      return;
    }

    // 자동 로그인 시도 (이미 인증된 상태라면 건너뛰기)
    (async () => {
      try {
        // 현재 인증 상태 또는 로그인 진행 상태 확인
        if (userSession.isAuthenticated) {
          console.log("🎯 이미 인증된 상태 - 자동 로그인 건너뛰기");
          sendResponse({ success: true, sessionInfo: { success: true, source: "existing" } });
          return;
        }

        if (userSession.isLoginInProgress) {
          console.log("🎯 로그인 진행 중 - 자동 로그인 건너뛰기");
          sendResponse({ success: false, reason: "login_in_progress" });
          return;
        }

        const sessionInfo = await userSession.tryAutoLogin();
        console.log("🎯 Content Script 트리거 자동 로그인 결과:", sessionInfo);

        if (sessionInfo.success) {
          // 자동 로그인 성공시 히스토리 수집 체크
          await checkAndCollectHistory();
          sendResponse({ success: true, sessionInfo });
        } else {
          sendResponse({ success: false, reason: sessionInfo.reason });
        }
      } catch (error) {
        console.error("❌ Content Script 트리거 자동 로그인 실패:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // 비동기 응답을 위해 true 반환
  }

  // Google 로그인 처리 (popup에서)
  if (message.type === "GOOGLE_LOGIN") {
    console.log("🔐 Google 로그인 요청 받음");

    // 비동기 함수로 처리하되 sendResponse 호출을 보장
    userSession
      .loginWithGoogle()
      .then(async (result) => {
        console.log("🔐 Google 로그인 결과:", result);

        // 로그인 성공시 히스토리 수집 체크
        if (result.success) {
          try {
            await checkAndCollectHistory();
          } catch (historyError) {
            console.error("히스토리 수집 실패:", historyError);
          }
        }

        // Chrome Storage 이벤트를 통해 popup이 알아서 업데이트되므로
        // 간단한 응답만 보냄
        sendResponse({
          success: result.success,
          user: result.user || null,
        });
      })
      .catch((error) => {
        console.error("❌ Google 로그인 실패:", error);
        sendResponse({
          success: false,
          error: error.message,
        });
      });

    // 비동기 응답을 위해 true 반환
    return true;
  }

  // 토글 상태 변경 (popup에서)
  if (message.type === "TOGGLE_TRACKING") {
    console.log("🔄 토글 상태 변경:", message.enabled);
    // 필요시 추가 로직 (예: content.js들에게 알림)
    sendResponse({ success: true });
    return;
  }


  // Offscreen 콘텐츠 추출 요청 (HistoryContentExtractor에서 사용)
  if (message.type === "EXTRACT_CONTENT_OFFSCREEN") {
    // 이 메시지는 offscreen.js에서 처리됨
    // background.js에서는 단순히 전달만
    return false;
  }

  // 차단된 도메인 확인 (DataCollector에서)
  if (message.type === "CHECK_BLOCKED_DOMAIN") {
    try {
      // 사용자 설정 조회
      const userSettings = await fetchUserSettings();
      if (!userSettings || !userSettings.blockedDomains) {
        sendResponse({ success: true, blocked: false });
        return;
      }

      // 도메인 체크
      const currentDomain = new URL(message.url).hostname;
      const isBlocked = userSettings.blockedDomains.some(blockedDomain => {
        return currentDomain.includes(blockedDomain) || blockedDomain.includes(currentDomain);
      });

      console.log(`🔍 도메인 체크: ${currentDomain} -> ${isBlocked ? '차단됨' : '허용됨'}`);
      sendResponse({ success: true, blocked: isBlocked });

    } catch (error) {
      console.error("❌ 도메인 체크 실패:", error);
      sendResponse({ success: false, blocked: false, error: error.message });
    }
    return true; // async 처리를 위해 true 반환
  }

  // --- [추가] UI 관련 메시지 핸들러 ---
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ success: true, settings });
    });
    return true; // 비동기 응답
  }

  if (message.type === 'PING') {
    sendResponse({ success: true, data: 'PONG' });
    return; // 동기 응답
  }
});

// 30초마다 큐에 있는 데이터들을 서버로 전송
setInterval(async () => {
  console.log("🔄 큐 데이터 일괄 전송 시도");
  await dataSender.sendAllQueuedData();
}, 30000);

// 확장프로그램 설치시 초기화 수행 (기존 인증 데이터 포함)
chrome.runtime.onInstalled.addListener(async (details) => {
  // [추가] UI 기본 설정 보장
  await ensureDefaults();

  if (details.reason === "install") {
    console.log("🎉 확장프로그램 최초 설치 완료");

    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    console.log("🧹 기존 Chrome Storage 데이터 모두 초기화 완료");
    
    // [추가] sync 스토리지를 초기화했으므로 UI 기본 설정을 다시 저장
    await ensureDefaults();

    await chrome.storage.local.set({
      installed: true,
      historyCollected: false,
    });
    console.log("📝 새로운 설치 상태 저장 완료 - 로그인 후 히스토리 수집 예정");
  }
});
