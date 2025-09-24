/**
 * content.jsx
 *
 * 각 웹페이지에 주입되는 통합 스크립트
 * - DataCollector로 브라우징 데이터 수집하고 background.js에 전달
 * - React 기반의 Overlay(캐릭터) UI를 페이지에 주입 및 관리
 */

import React from 'react';
import * as ReactDOM from 'react-dom/client';
import Overlay from './Overlay.jsx';
import { DataCollector } from "./modules/DataCollector.js";

// --- [통합] 전역 변수 선언 ---
let dataCollector = null; // 데이터 수집기 인스턴스
const HOST_ID = 'picky-overlay-host'; // 오버레이 UI를 담을 컨테이너 ID
const USE_SHADOW = true; // Shadow DOM 사용 여부

// --- [기존] Service Worker 활성화 로직 ---
let autoLoginTriggered = false;
async function triggerServiceWorkerAndCheckSession() {
  if (autoLoginTriggered) return;
  try {
    autoLoginTriggered = true;
    await chrome.runtime.sendMessage({
      type: 'TRIGGER_AUTO_LOGIN',
      source: 'content_script',
      url: window.location.href
    });
  } catch (error) {
    console.log("ℹ️ Service Worker 통신 실패 (정상일 수 있음):", error.message);
  }
}

// --- [기존] 메시지 전송 함수 ---
function sendMessageToBackground(message) {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.id) {
    return;
  }
  try {
    chrome.runtime.sendMessage(message);
  } catch (sendError) {
    console.warn("⚠️ 메시지 전송 실패:", sendError.message);
  }
}

// --- [추가] 오버레이 UI 주입 관련 함수 (from extension_ui) ---
function onDomReady(cb) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') cb();
  else document.addEventListener('DOMContentLoaded', cb, { once: true });
}

function ensureHost() {
  let host = document.getElementById(HOST_ID);
  if (host) return host;
  host = document.createElement('div');
  host.id = HOST_ID;
  host.style.all = 'initial';
  host.style.contain = 'layout style';
  host.style.pointerEvents = 'none';
  (document.body || document.documentElement).appendChild(host);
  return host;
}

function ensureShadowRoot(host) {
  if (!USE_SHADOW || host.shadowRoot) return host.shadowRoot;
  return host.attachShadow({ mode: 'open' });
}

function linkStylesToShadow(shadow) {
  if (typeof chrome?.runtime?.getURL !== 'function') return;
  const cssUrl = chrome.runtime.getURL('content.css');
  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = cssUrl;
  shadow.appendChild(linkEl);
  const styleEl = document.createElement('style');
  styleEl.textContent = `:host { all: initial; } .picky-root { pointer-events: auto; }`;
  shadow.appendChild(styleEl);
}

function ensureAppContainer(shadowOrHost) {
  const owner = shadowOrHost || document.getElementById(HOST_ID);
  if (!owner) return null;
  let mount = owner.querySelector?.('#picky-overlay-app');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'picky-overlay-app';
    mount.className = 'picky-root';
    owner.appendChild(mount);
  }
  return mount;
}

function setupSpaObservers(container) {
  const onRouteChanged = () => container.dispatchEvent(new CustomEvent('picky:route-changed', { bubbles: true }));
  window.addEventListener('popstate', onRouteChanged);
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onRouteChanged();
  };
  return () => {
    window.removeEventListener('popstate', onRouteChanged);
    history.pushState = originalPushState;
  };
}

function toggleOverlay(shouldMount) {
  const host = ensureHost();
  if (!host) return;
  if (shouldMount) {
    if (host.__PICKY_ROOT__) return;
    const shadow = USE_SHADOW ? ensureShadowRoot(host) : null;
    if (shadow) linkStylesToShadow(shadow);
    const container = ensureAppContainer(shadow || host);
    if (!container) return;
    const root = ReactDOM.createRoot(container);
    host.__PICKY_ROOT__ = root;
    host.__TEARDOWN_SPA__ = setupSpaObservers(container);
    root.render(<React.StrictMode><Overlay /></React.StrictMode>);
  } else {
    if (host.__PICKY_ROOT__) {
      host.__PICKY_ROOT__.unmount();
      host.__PICKY_ROOT__ = null;
      if (host.__TEARDOWN_SPA__) host.__TEARDOWN_SPA__();
      host.__TEARDOWN_SPA__ = null;
    }
  }
}

// --- [통합] 메인 초기화 로직 ---
// [변경] 로그인 상태까지 확인하여 오버레이 표시 여부를 결정하는 로직으로 수정
async function updateOverlayVisibility() {
  try {
    // 1. 로그인 상태 확인
    const session = await chrome.runtime.sendMessage({ type: "GET_USER_SESSION" });
    const isAuthenticated = session?.isAuthenticated || false;

    // 2. UI 설정 확인
    const settings = await chrome.storage.sync.get(['isExtensionOn', 'isCharacterOn']);
    const isExtensionOn = settings.isExtensionOn !== false;
    const isCharacterOn = settings.isCharacterOn !== false;

    // 3. 모든 조건 충족 시에만 오버레이 표시
    const shouldShow = isAuthenticated && isExtensionOn && isCharacterOn;
    toggleOverlay(shouldShow);
    console.log(`[Overlay Visibility] ${shouldShow ? 'Show' : 'Hide'} (Auth: ${isAuthenticated}, Ext: ${isExtensionOn}, Char: ${isCharacterOn})`);

  } catch (error) {
    // background script가 준비되지 않았을 때 오류가 발생할 수 있음
    console.warn("오버레이 상태 업데이트 실패 (background script 로딩 중일 수 있음)", error);
    toggleOverlay(false); // 실패 시 안전하게 숨김
  }
}


function initialize() {
  // 1. Service Worker 활성화 및 세션 체크 (기존 로직)
  triggerServiceWorkerAndCheckSession();

  // 2. 데이터 수집기 생성 및 이벤트 리스너 등록 (기존 로직)
  dataCollector = new DataCollector();
  const waitForInitialization = () => {
    if (dataCollector && dataCollector.isInitialized) {
      window.addEventListener("beforeunload", () => {
        const data = dataCollector.collectData();
        if (data) {
          sendMessageToBackground({ type: "BROWSING_DATA", data: data });
        }
      });
    } else {
      setTimeout(waitForInitialization, 100);
    }
  };
  waitForInitialization();

  // 3. 오버레이 UI 렌더링 로직 (수정된 로직)
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome?.storage;
  if (!hasChromeStorage) {
    // 개발 환경 등에서는 항상 표시
    toggleOverlay(true);
    return;
  }

  // 초기 상태 확인 후 오버레이 표시
  updateOverlayVisibility();

  // 스토리지 변경 감지하여 오버레이 실시간 제어
  chrome.storage.onChanged.addListener((changes, area) => {
    // sync(UI 설정) 또는 local(로그인 정보) 변경 시 모두 상태 재확인
    if ((area === 'sync' && (changes.isExtensionOn || changes.isCharacterOn)) || 
        (area === 'local' && (changes.userInfo || changes.jwt))) {
      console.log(`[Storage Change Detected] Area: ${area}, Changes:`, Object.keys(changes));
      updateOverlayVisibility();
    }
  });
}

// --- 실행 ---
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
  console.log("🚀 통합 Content script 시작:", window.location.href);
  onDomReady(initialize);
} else {
  console.warn("⚠️ Extension context 없음 - Content script 초기화 중단");
}
