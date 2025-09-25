import React from 'react';
import * as ReactDOM from 'react-dom/client';
import Overlay from './Overlay.jsx';

// 고정 컨테이너 ID. 동일 페이지에서 중복 삽입을 막는 키로 쓰인다.
const HOST_ID = 'picky-overlay-host';

// Shadow DOM 사용 여부. 필요 시 false로 바꿔 일반 DOM 렌더로도 동작 가능하게 한다.
const USE_SHADOW = true;

/**
 * DOM 준비 보조.
 * - content_scripts의 run_at 설정에 따라 body가 미리 존재하지 않을 수 있으므로 방어한다.
 */
function onDomReady(cb) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    cb();
  } else {
    document.addEventListener('DOMContentLoaded', cb, { once: true });
  }
}

/**
 * 호스트 엘리먼트를 생성하거나 재사용한다.
 * - 반드시 문서에 하나만 존재해야 한다.
 */
function ensureHost() {
  let host = document.getElementById(HOST_ID);
  if (host) return host;

  host = document.createElement('div');
  host.id = HOST_ID;

  // 페이지 레이아웃 간섭 최소화. 위치는 고정하지 않는다. 실제 위치는 Overlay 내부에서 제어한다.
  host.style.all = 'initial';
  host.style.contain = 'layout style';
  host.style.pointerEvents = 'none'; // Shadow 내부 루트에 다시 활성화한다.

  // body가 없으면 최후 수단으로 documentElement에 삽입한다.
  (document.body || document.documentElement).appendChild(host);
  return host;
}

/**
 * Shadow Root 생성 또는 반환.
 * - 스타일 격리를 위해 open 모드 Shadow Root를 사용한다.
 */
function ensureShadowRoot(host) {
  if (!USE_SHADOW) return null;
  if (host.shadowRoot) return host.shadowRoot;
  const shadow = host.attachShadow({ mode: 'open' });
  return shadow;
}

/**
 * Shadow Root 안에 스타일을 주입한다. (안정적인 <link> 방식)
 * - web_accessible_resources에 등록된 CSS 파일을 직접 링크한다.
 */
function linkStylesToShadow(shadow) {
  if (typeof chrome?.runtime?.getURL !== 'function') {
    return; // chrome API 사용 불가 환경
  }
  const cssUrl = chrome.runtime.getURL('content.css');
  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = cssUrl;
  shadow.appendChild(linkEl);

  // 최소한의 기본 보정.
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    :host { all: initial; }
    .picky-root { pointer-events: auto; }
  `;
  shadow.appendChild(styleEl);
}

/**
 * React 루트 컨테이너를 Shadow Root에 삽입한다.
 * - Shadow를 사용할 때는 Shadow 내부에 실제 마운트 노드를 만든다.
 */
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

/**
 * SPA 라우팅 변화 감지
 */
function setupSpaObservers(container) {
  const onRouteChanged = () => {
    try {
      container.dispatchEvent(new CustomEvent('picky:route-changed', { bubbles: true }));
    } catch { /* empty */ }
  };

  window.addEventListener('popstate', onRouteChanged);
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    onRouteChanged();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    onRouteChanged();
  };

  // 정리 함수 반환
  return () => {
    window.removeEventListener('popstate', onRouteChanged);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}


/**
 * 오버레이를 마운트하거나 언마운트하는 함수
 */
function toggleOverlay(shouldMount) {
  const host = ensureHost();
  if (!host) return;

  if (shouldMount) {
    // 중복 마운트 방지
    if (host.__PICKY_ROOT__) return;

    const shadow = USE_SHADOW ? ensureShadowRoot(host) : null;
    if (shadow) linkStylesToShadow(shadow);

    const container = ensureAppContainer(shadow || host);
    if (!container) return;

    const root = ReactDOM.createRoot(container);
    host.__PICKY_ROOT__ = root;
    
    // 라우팅 감지 시작 및 정리 함수 저장
    host.__TEARDOWN_SPA__ = setupSpaObservers(container);

    root.render(
      <React.StrictMode>
        <Overlay />
      </React.StrictMode>
    );
    console.log('[Picky] Overlay mounted', { shadow: !!shadow });
  } else {
    // 언마운트
    if (host.__PICKY_ROOT__) {
      host.__PICKY_ROOT__.unmount();
      host.__PICKY_ROOT__ = null;
      // 라우팅 감지 정리
      if (host.__TEARDOWN_SPA__) {
        host.__TEARDOWN_SPA__();
        host.__TEARDOWN_SPA__ = null;
      }
      console.log('[Picky] Overlay unmounted');
    }
  }
}

/**
 * 스토리지 상태를 확인하고 오버레이 표시 여부를 결정하는 메인 함수
 */
function initialize() {
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome?.storage?.sync;
  if (!hasChromeStorage) {
    // 개발 환경 등에서는 항상 표시
    toggleOverlay(true);
    return;
  }

  // 초기 상태 확인
  chrome.storage.sync.get(['isExtensionOn', 'isCharacterOn'], (settings) => {
    const shouldShow = settings.isExtensionOn !== false && settings.isCharacterOn !== false;
    toggleOverlay(shouldShow);
  });

  // 스토리지 변경 감지
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      // 현재 상태를 다시 읽어서 결정
      chrome.storage.sync.get(['isExtensionOn', 'isCharacterOn'], (settings) => {
        const shouldShow = settings.isExtensionOn !== false && settings.isCharacterOn !== false;
        toggleOverlay(shouldShow);
      });
    }
  });
}

// 실행
onDomReady(initialize);
