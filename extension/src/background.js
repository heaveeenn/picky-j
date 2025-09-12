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
    const sessionInfo = await userSession.initialize();
    console.log("👤 사용자 세션 초기화 완료:", sessionInfo);
  } catch (error) {
    console.error("❌ 사용자 세션 초기화 실패:", error);
  }
  
})();






// 디버깅용 함수 노출
globalThis.testHistoryCollection = async () => {
  console.log("🔍 수동 히스토리 수집 시작");
  await historyCollector.collectHistoryWithContent();
};

// content.js와 popup에서 온 메시지 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("📨 메시지 받음:", message);

  // 브라우징 데이터 처리 (content.js에서)
  if (message.type === "BROWSING_DATA") {
    // 토글 상태 확인 (Chrome Storage에서)
    const trackingStatus = await chrome.storage.sync.get(["trackingEnabled"]);
    const isTrackingEnabled = trackingStatus.trackingEnabled !== false;

    if (!isTrackingEnabled) {
      console.log("⚠️ 데이터 수집 비활성화 - 큐에 추가하지 않음");
      sendResponse({ success: false, reason: "Tracking disabled" });
      return;
    }

    // 사용자 ID와 함께 데이터를 큐에 추가
    const userId = userSession.getUserId();
    dataSender.addToQueue(message.data, userId);
    console.log("✅ 데이터 큐에 추가 완료");

    sendResponse({ success: true });
    return;
  }

  // 사용자 세션 정보 조회 (popup에서)
  if (message.type === "GET_USER_SESSION") {
    // 세션 초기화가 안 되어 있으면 즉시 초기화
    if (!userSession.isUserAuthenticated()) {
      console.log("⚠️ 세션 미초기화 감지 - 즉시 초기화 실행");
      try {
        await userSession.initialize();
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

    // UserSession의 Google 로그인 시도
    userSession
      .tryGoogleLogin()
      .then((result) => {
        console.log("🔐 Google 로그인 결과:", result);
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

// 확장프로그램 최초 설치시에만 히스토리 데이터 수집
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    console.log("🎉 최초 설치 - 히스토리 데이터 수집 시작");
    try {
      const result = await historyCollector.collectHistoryWithContent();
      console.log(
        "✅ 설치 시 히스토리 수집 완료:",
        result.contentExtractionSummary
      );
    } catch (error) {
      console.error("❌ 설치 시 히스토리 수집 실패:", error);
    }
  }
});