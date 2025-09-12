/**
 * content.js
 *
 * 각 웹페이지에 주입되는 스크립트
 * DataCollector로 브라우징 데이터 수집하고 background.js에 전달
 */

import { DataCollector } from "./modules/DataCollector.js";

// 전역 변수로 dataCollector 선언
let dataCollector = null;

// Extension context 검증 후 초기화
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
  console.log("🚀 Content script 시작:", window.location.href);

  // 이 페이지 전용 데이터 수집기 생성
  dataCollector = new DataCollector();

  // DataCollector 초기화 완료까지 대기 후 이벤트 등록
  const waitForInitialization = () => {
    if (dataCollector && dataCollector.isInitialized) {
      console.log("✅ DataCollector 완전 초기화 완료");
      initializeEventListeners();
    } else {
      setTimeout(waitForInitialization, 100); // 100ms 후 재시도
    }
  };
  
  waitForInitialization();
  
} else {
  console.warn("⚠️ Extension context 없음 - Content script 초기화 중단");
}

// 메시지 전송 함수 (Extension context 안전성 체크 포함)
function sendMessageToBackground(message) {
  try {
    // Extension context가 없는 경우(ex: 비활성화, 업데이트 전 탭)는 정상적인 상황일 수 있으므로,
    // 경고(warn) 대신 정보(log) 수준으로 메시지를 표시합니다.

    // 1. chrome 객체, runtime, id 존재 체크를 한 번에 수행
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.id
    ) {
      console.log("ℹ️ Extension context가 없어 메시지 전송을 건너뜁니다.");
      return;
    }

    // 2. 메시지 전송 (Fire-and-forget 패턴)
    try {
      chrome.runtime.sendMessage(message);
    } catch (sendError) {
      // 연결이 끊어진 경우 등의 전송 오류 처리
      console.warn("⚠️ 메시지 전송 실패:", sendError.message);
      return;
    }
    console.log("✅ Message sent to background successfully");
  } catch (error) {
    // 예기치 못한 예외는 에러로 표시
    console.error("❌ 메시지 전송 중 예외 발생:", error);
  }
}

// 이벤트 리스너와 인터벌 초기화 함수
function initializeEventListeners() {
  if (!dataCollector) {
    console.warn("⚠️ DataCollector 없음 - 이벤트 리스너 초기화 중단");
    return;
  }

  // 페이지를 떠날 때 데이터 수집하고 background.js에 전송
  window.addEventListener("beforeunload", () => {
    const data = dataCollector.collectData();
    if (data) {
      console.log("📤 페이지 떠나기 전 background에 데이터 전송");
      sendMessageToBackground({
        type: "BROWSING_DATA",
        data: data,
      });
    }
  });

}
