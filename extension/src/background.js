/**
 * background.js
 * 
 * Chrome Extension 백그라운드 스크립트
 * - content.js에서 온 데이터를 받아서 Python 서버로 전송
 * - 배치 처리 및 에러 처리 담당
 */

import { DataSender } from './modules/DataSender.js';
import { UserSession } from './modules/UserSession.js';

console.log("🔧 Background script 시작");

// 모듈 초기화
const dataSender = new DataSender();
const userSession = new UserSession();

// content.js와 popup에서 온 메시지 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("📨 메시지 받음:", message);

  // 브라우징 데이터 처리 (content.js에서)
  if (message.type === 'BROWSING_DATA') {
    // 사용자 인증 상태 확인
    if (!userSession.isUserAuthenticated()) {
      console.log("⚠️ 사용자 미인증 - 데이터 수집 중단");
      sendResponse({ success: false, reason: "Not authenticated" });
      return;
    }

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
  if (message.type === 'GET_USER_SESSION') {
    const isAuthenticated = userSession.isUserAuthenticated();
    const userInfo = isAuthenticated ? userSession.getUserInfo() : null;
    
    console.log("👤 세션 정보 요청 응답:", { isAuthenticated, userInfo });
    sendResponse({ 
      success: true, 
      isAuthenticated: isAuthenticated,
      userInfo: userInfo 
    });
    return;
  }

  // Google 로그인 처리 (popup에서)
  if (message.type === 'GOOGLE_LOGIN') {
    console.log("🔐 Google 로그인 요청 받음");
    
    // UserSession의 Google 로그인 시도
    userSession.tryGoogleLogin()
      .then(result => {
        console.log("🔐 Google 로그인 결과:", result);
        sendResponse({
          success: result.success,
          user: result.user || null
        });
      })
      .catch(error => {
        console.error("❌ Google 로그인 실패:", error);
        sendResponse({
          success: false,
          error: error.message
        });
      });
    
    // 비동기 응답을 위해 true 반환
    return true;
  }

  // 토글 상태 변경 (popup에서)
  if (message.type === 'TOGGLE_TRACKING') {
    console.log("🔄 토글 상태 변경:", message.enabled);
    // 필요시 추가 로직 (예: content.js들에게 알림)
    sendResponse({ success: true });
    return;
  }
});

// 30초마다 큐에 있는 데이터들을 서버로 전송
setInterval(async () => {
  console.log("🔄 큐 데이터 일괄 전송 시도");
  await dataSender.sendAllQueuedData();
}, 30000);

// 확장프로그램 설치시 초기화
chrome.runtime.onInstalled.addListener(async () => {
  console.log("🎉 Extension 설치 완료");
  
  // 사용자 세션 초기화
  const sessionInfo = await userSession.initialize();
  console.log("👤 사용자 세션 초기화 완료:", sessionInfo);
});

// 확장프로그램 시작시 초기화
chrome.runtime.onStartup.addListener(async () => {
  console.log("🚀 Extension 시작");
  
  // 사용자 세션 초기화
  const sessionInfo = await userSession.initialize();
  console.log("👤 사용자 세션 로드 완료:", sessionInfo);
});