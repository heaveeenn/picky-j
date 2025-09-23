/**
 * background.js
 *
 * Chrome Extension 백그라운드 스크립트
 * - content.js에서 온 데이터를 받아서 Python 서버로 전송
 * - 배치 처리 및 에러 처리 담당
 */

import { DataSender } from "./modules/DataSender.js";
import { UserSession } from "./modules/UserSession.js";
import { HistoryCollector } from "./modules/HistoryCollector.js";

console.log("🔧 Background script 시작");

// 모듈 초기화
const dataSender = new DataSender();
const userSession = new UserSession();
const historyCollector = new HistoryCollector(userSession);

// 사용자 세션 즉시 초기화 (Service Worker 재시작시에도 실행)
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
    const storage = await chrome.storage.local.get(['historyCollected']);

    // 아직 히스토리를 수집하지 않았다면 수집 시작
    if (!storage.historyCollected) {
      console.log("📚 최초 로그인 - 히스토리 데이터 수집 시작");

      const result = await historyCollector.collectHistoryWithContent();
      console.log("✅ 로그인 후 히스토리 수집 완료:", result.contentExtractionSummary);

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
    const trackingStatus = await chrome.storage.sync.get(["trackingEnabled"]);
    const isTrackingEnabled = trackingStatus.trackingEnabled !== false;

    if (!isTrackingEnabled) {
      console.log("⚠️ 데이터 수집 비활성화 - 큐에 추가하지 않음");
      sendResponse({ success: false, reason: "Tracking disabled" });
      return;
    }

    // 3. 사용자 ID와 함께 데이터를 큐에 추가
    dataSender.addToQueue(message.data, userId);
    console.log("✅ 데이터 큐에 추가 완료 - userId:", userId);

    sendResponse({ success: true });
    return;
  }

  // 사용자 세션 정보 조회 (popup에서)
  if (message.type === "GET_USER_SESSION") {
    // 세션 초기화가 안 되어 있으면 즉시 초기화
    if (!userSession.isUserAuthenticated()) {
      console.log("⚠️ 세션 미초기화 감지 - 즉시 초기화 실행");
      try {
        await userSession.tryAutoLogin();
      } catch (error) {
        console.error("❌ 긴급 세션 초기화 실패:", error);
      }
    }

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

  // Google 로그인 처리 (popup에서)
  if (message.type === "GOOGLE_LOGIN") {
    console.log("🔐 Google 로그인 요청 받음");

    // 비동기 함수로 처리하되 sendResponse 호출을 보장
    userSession.loginWithGoogle()
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
});

// 30초마다 큐에 있는 데이터들을 서버로 전송
setInterval(async () => {
  console.log("🔄 큐 데이터 일괄 전송 시도");
  await dataSender.sendAllQueuedData();
}, 30000);

// 확장프로그램 설치시 초기화만 수행 (히스토리 수집은 로그인 후)
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("🎉 확장프로그램 최초 설치 완료");
    // 설치 완료 플래그 저장 (히스토리 수집은 로그인 후 진행)
    await chrome.storage.local.set({
      installed: true,
      historyCollected: false
    });
    console.log("📝 설치 상태 저장 완료 - 로그인 후 히스토리 수집 예정");
  }
});