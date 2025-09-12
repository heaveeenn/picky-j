/**
 * Content Script - 웹페이지 데이터 수집 및 오버레이 UI 관리
 *
 * 역할:
 * 1. 브라우징 데이터 수집 (DataCollector 모듈 사용)
 * 2. Background Script로 데이터 전송
 * 3. 웹페이지 오버레이 UI 관리
 * 4. 향후 React 오버레이 컴포넌트 마운트
 *
 * 구조:
 * - ContentManager 클래스: 페이지별 데이터 수집과 UI 총괄 관리
 */

import { DataCollector } from "./modules/DataCollector.js";
import {
  STORAGE_KEYS,
  UI_CONFIG,
  DATA_COLLECTION,
} from "./config/constants.js";

console.log("📊 picky content script loaded on:", window.location.href);

class ContentManager {
  constructor() {
    console.log("📊 ContentManager constructor started");

    try {
      // DataCollector 모듈 초기화
      console.log("📊 Initializing DataCollector...");
      this.dataCollector = new DataCollector();
      console.log("📊 DataCollector initialized successfully");

      // UI 관련 상태
      this.overlayInterval = null;

      console.log("📊 ContentManager constructor completed");
      this.initialize();
    } catch (error) {
      console.error("❌ Error in ContentManager constructor:", error);
      throw error;
    }
  }

  /**
   * ContentManager 초기화
   */
  async initialize() {
    // DataCollector 초기화
    await this.dataCollector.initializeEventListeners();

    // 토글 상태 변경 감지
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes[STORAGE_KEYS.TRACKING_ENABLED] && namespace === "sync") {
        const isEnabled =
          changes[STORAGE_KEYS.TRACKING_ENABLED].newValue !== false;
        console.log("🔄 Content tracking status changed:", isEnabled);

        if (!isEnabled) {
          // OFF 시 현재 데이터 강제 전송 (sendBeacon 사용)
          this.sendCurrentDataToBackground(true);
          this.stopOverlayTimer();
        } else {
          // ON 시 오버레이 타이머 시작
          this.startOverlayTimer();
        }
      }
    });

    // 페이지 떠날 때 최종 데이터 전송 (탭 닫기/창 닫기 모두 동일하게 처리)
    window.addEventListener("beforeunload", () => {
      // Chrome Extension API 사용 가능 여부 먼저 확인 (설치 전 탭에서는 정상적으로 undefined)
      if (typeof chrome !== "undefined" && chrome.runtime && chrome.storage) {
        this.sendCurrentDataToBackground(true); // 항상 forceFlush=true로 처리
      }
      // API 없으면 조용히 종료
    });

    // 주기적으로 중간 데이터 저장
    setInterval(() => {
      this.sendInterimDataToBackground();
    }, DATA_COLLECTION.INTERIM_DATA_INTERVAL);

    // 오버레이 UI 초기화
    if (this.dataCollector.isTrackingEnabled) {
      this.startOverlayTimer();
    }
  }

  /**
   * Background Script로 현재 데이터 전송
   */
  async sendCurrentDataToBackground(forceFlush = false) {
    try {
      // DataCollector에서 데이터 수집
      const browsingData = forceFlush
        ? this.dataCollector.forceCollectData()
        : this.dataCollector.collectFinalData();

      if (!browsingData) {
        return; // 수집할 데이터가 없거나 조건 미달
      }

      // Chrome Extension API 사용 가능 체크
      if (typeof chrome === "undefined" || !chrome.storage || !chrome.runtime) {
        return; // 조용히 종료 (설치 전 탭에서는 정상)
      }

      // 로컬 스토리지 저장 시도
      try {
        if (chrome.storage && chrome.storage.local) {
          const storageKey = `browsing_${Date.now()}`;
          await chrome.storage.local.set({
            [storageKey]: browsingData,
          });
          console.log("💾 Data backed up to local storage:", storageKey);
        }
      } catch (storageError) {
        console.warn("⚠️ Failed to save to local storage:", storageError);
        // 로컬 스토리지 실패해도 메시지는 보냄
      }

      try {
        // Background Script로 메시지 전송
        const messageType = forceFlush
          ? "SEND_UNLOAD_DATA"
          : "SEND_BROWSING_DATA";
        console.log(
          `📤 Sending ${messageType} message to background script...`
        );
        chrome.runtime.sendMessage({
          type: messageType,
          data: browsingData,
        });
      } catch (messageError) {
        console.error("❌ Failed to send message to background:", messageError);
        return;
      }

      console.log("✅ Browsing data sent to background:", {
        url: browsingData.url,
        title: browsingData.title.substring(0, 50) + "...",
        timeSpent: browsingData.timeSpent,
        scrollDepth: browsingData.scrollDepth,
        category: browsingData.category,
      });
    } catch (error) {
      console.error("❌ Error in sendCurrentDataToBackground:", error);
    }
  }

  /**
   * 중간 데이터 저장 (5분마다)
   */
  async sendInterimDataToBackground() {
    const interimData = this.dataCollector.collectInterimData();
    if (interimData) {
      console.log("⏱️ Sending interim data to background");
      await this.sendCurrentDataToBackground();
    }
  }

  /**
   * 오버레이 타이머 시작 (30초마다 팝업 표시)
   */
  startOverlayTimer() {
    if (this.overlayInterval) {
      clearInterval(this.overlayInterval);
    }

    this.overlayInterval = setInterval(() => {
      if (this.dataCollector.isTrackingEnabled) {
        this.showCirclePopup();
      }
    }, UI_CONFIG.OVERLAY_INTERVAL);

    console.log("⏰ Overlay timer started (30s interval)");
  }

  /**
   * 오버레이 타이머 중지
   */
  stopOverlayTimer() {
    if (this.overlayInterval) {
      clearInterval(this.overlayInterval);
      this.overlayInterval = null;
      console.log("⏸️ Overlay timer stopped");
    }
  }

  showCirclePopup() {
    // 이미 팝업이 있으면 제거
    const existingPopup = document.getElementById("picky-circle-popup");
    if (existingPopup) {
      existingPopup.remove();
    }

    // 동그라미 팝업 생성
    const popup = document.createElement("div");
    popup.id = "picky-circle-popup";
    popup.innerHTML = "🦞";
    popup.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      z-index: 10000;
      animation: picky-bounce 0.5s ease-out;
      transition: transform 0.2s ease;
    `;

    // CSS 애니메이션 추가
    if (!document.getElementById("picky-styles")) {
      const style = document.createElement("style");
      style.id = "picky-styles";
      style.textContent = `
        @keyframes picky-bounce {
          0% { transform: scale(0) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        #picky-circle-popup:hover {
          transform: scale(1.1) !important;
        }
      `;
      document.head.appendChild(style);
    }

    // 클릭 이벤트 - 팝업 내용 표시
    popup.addEventListener("click", () => {
      this.showMainPopup();
    });

    // 자동 사라짐
    setTimeout(() => {
      if (popup.parentNode) {
        popup.style.animation = "picky-bounce 0.3s ease-in reverse";
        setTimeout(() => popup.remove(), 300);
      }
    }, UI_CONFIG.POPUP_AUTO_HIDE);

    document.body.appendChild(popup);
    console.log("🦞 picky circle popup shown");
  }

  /**
   * 메인 팝업 표시 (임시 구현 - 향후 React 컴포넌트로 교체)
   */
  showMainPopup() {
    console.log("🦞 Main popup clicked - feature coming soon!");

    // 임시로 현재 페이지 정보 표시 (DataCollector 데이터 사용)
    const currentData = this.dataCollector.collectBrowsingData();
    if (currentData) {
      alert(
        `picky 🦞\n\n현재 페이지: ${currentData.title}\n체류 시간: ${currentData.timeSpent}초\n스크롤 깊이: ${currentData.scrollDepth}%`
      );
    } else {
      alert("picky 🦞\n\n데이터 수집이 비활성화되어 있습니다.");
    }
  }
}

// ===== ContentManager 초기화 =====
let contentManager;

/**
 * 페이지 로드 완료 후 ContentManager 초기화
 */
function initializeContentManager() {
  try {
    console.log("🔄 Starting ContentManager initialization...");
    console.log("📊 Current page:", window.location.href);
    console.log("📊 Document ready state:", document.readyState);
    console.log("📊 Chrome API available:", typeof chrome !== "undefined");

    contentManager = new ContentManager();
    console.log("✅ ContentManager successfully initialized");
  } catch (error) {
    console.error("❌ Failed to initialize ContentManager:", error);
    console.error("❌ Error stack:", error.stack);

    // 5초 후 재시도
    setTimeout(() => {
      console.log("🔄 Retrying ContentManager initialization...");
      initializeContentManager();
    }, 5000);
  }
}

// DOM 준비 상태에 따라 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeContentManager);
} else {
  // 이미 DOM이 로드된 경우 즉시 실행
  initializeContentManager();
}

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", () => {
  // Chrome Extension API 사용 가능 여부 확인 (설치 전 탭에서는 정상적으로 undefined)
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.storage) {
    return; // 조용히 종료
  }

  if (contentManager) {
    contentManager.stopOverlayTimer();
  }
});
