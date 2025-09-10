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
 * Shadow Root 안에 스타일을 주입한다.
 * - Vite 빌드된 스타일이 document.head에 이미 삽입되어 있을 수 있으므로,
 *   확장 프로그램 출처의 스타일시트만 뽑아와 Shadow로 복제한다.
 * - 이 방식은 Tailwind 유틸리티가 번들된 경우에도 Shadow 내부에서 정상 동작하게 해준다.
 * - 확실한 방법은 web_accessible_resources에 CSS를 노출하고, <link>를 Shadow에 삽입하는 것이다.
 *   현재 코드는 규칙 복제 방식으로 구현한다.
 */
function copyExtensionStylesToShadow(shadow) {
  try {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-picky-shadow-styles', 'true');

    // 확장 프로그램에서 삽입한 스타일시트만 대상으로 한다.
    const extOrigin = chrome?.runtime?.id
      ? `chrome-extension://${chrome.runtime.id}`
      : location.origin; // 개발 환경 대비

    let cssText = '';
    for (const sheet of Array.from(document.styleSheets)) {
      const href = sheet.href || '';
      // href가 없고 inline style일 수도 있다(ownerNode.tagName === 'STYLE').
      const isFromExtension =
        href.startsWith(extOrigin) ||
        (sheet.ownerNode &&
          sheet.ownerNode.tagName === 'STYLE' &&
          sheet.ownerNode.textContent &&
          sheet.ownerNode.textContent.includes('tailwind'));

      if (!isFromExtension) continue;

      // CSSRuleList 접근은 CORS에 막힐 수 있다. 실패하면 해당 시트는 건너뛴다.
      try {
        const rules = sheet.cssRules || [];
        for (const rule of Array.from(rules)) {
          cssText += rule.cssText + '\n';
        }
      } catch (_) {
        // 접근 불가한 시트는 무시한다.
      }
    }

    // 최소한의 기본 보정. host에 걸어둔 pointer-events 해제.
    cssText += `
      :host { all: initial; }
      .picky-root { pointer-events: auto; }
    `;

    styleEl.textContent = cssText;
    shadow.appendChild(styleEl);
  } catch (_) {
    // 스타일 주입 실패 시에도 기능은 진행한다.
  }
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
 * - popstate: 뒤로가기/앞으로가기
 * - pushState/replaceState: 프레임워크 라우팅
 * - MutationObserver: 극단적 상황 보조
 */
function setupSpaObservers(onRouteChanged) {
  // popstate
  window.addEventListener('popstate', onRouteChanged);

  // pushState/replaceState 래핑
  const wrap = (type) => {
    const orig = history[type];
    if (typeof orig !== 'function') return;
    history[type] = function wrappedState() {
      const ret = orig.apply(this, arguments);
      try { onRouteChanged(); } catch (_) {}
      return ret;
    };
  };
  wrap('pushState');
  wrap('replaceState');

  // DOM 대규모 변경 보조 감시자
  const mo = new MutationObserver(() => {
    // 라우팅에 따라 최상단 컨테이너가 사라지는 경우 재보정 포인트로 사용 가능
    // 필요 시 onRouteChanged 내부에서 상태 싱크를 수행한다.
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  return () => {
    window.removeEventListener('popstate', onRouteChanged);
    mo.disconnect();
  };
}

/**
 * 오버레이 마운트
 */
function mountOverlay() {
  const host = ensureHost();

  // 중복 마운트 방지: 이미 루트가 있으면 재마운트하지 않는다.
  if (host.__PICKY_ROOT__) return;

  const shadow = USE_SHADOW ? ensureShadowRoot(host) : null;
  if (shadow) copyExtensionStylesToShadow(shadow);

  const container = ensureAppContainer(shadow || host);
  if (!container) return;

  const root = ReactDOM.createRoot(container);
  host.__PICKY_ROOT__ = root;

  root.render(
    <React.StrictMode>
      <Overlay />
    </React.StrictMode>
  );

  // 라우팅 변화 시 오버레이가 자체적으로 상태를 갱신할 수 있도록 커스텀 이벤트를 보낸다.
  const teardownSpa = setupSpaObservers(() => {
    try {
      container.dispatchEvent(new CustomEvent('picky:route-changed', { bubbles: true }));
    } catch (_) {}
  });

  // 확장 리로드 또는 탭 종료 시 정리
  const cleanup = () => {
    try {
      teardownSpa?.();
      root.unmount();
      host.__PICKY_ROOT__ = null;
    } catch (_) {}
  };
  window.addEventListener('beforeunload', cleanup);

  // 디버그 로그
  // eslint-disable-next-line no-console
  console.log('[Picky] Overlay mounted', { shadow: !!shadow });
}

// 실행
onDomReady(mountOverlay);
