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
 * 현재 스토리지 값 중 비어 있는 키만 기본값으로 채운다.
 * - 사용자가 이미 설정한 값은 덮어쓰지 않는다.
 */
async function ensureDefaults() {
  try {
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

/**
 * 설치/업데이트 이벤트
 * - install: 첫 설치 시 기본값 보장
 * - update: 기존 사용자는 값이 있을 수 있으므로 비어 있는 키만 보충
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    await ensureDefaults();
    // eslint-disable-next-line no-console
    console.log('[background] onInstalled:', details?.reason);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[background] onInstalled error:', err);
  }
});

/**
 * 메시지 라우터
 * - GET_SETTINGS: 현재 sync 스토리지의 전체 스냅샷 반환
 * - PING: 헬스 체크용
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message?.type;

  if (type === 'GET_SETTINGS') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ success: true, settings });
    });
    return true; // 비동기 응답
  }

  if (type === 'PING') {
    sendResponse({ success: true, data: 'PONG' });
    return; // 동기 응답
  }

  // 그 외 메시지는 무시한다.
});

// eslint-disable-next-line no-console
console.log('[background] Picky-j service worker active');
