/**
 * 익스텐션 전역 상수 및 설정값
 */

export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    ML_SERVICE_URL: 'http://localhost:8000',
    TIMEOUT: 10000 // 10초
};

export const STORAGE_KEYS = {
    TRACKING_ENABLED: 'trackingEnabled'
};

export const DATA_COLLECTION = {
    MIN_TIME_SPENT: 5, // 최소 체류시간 (초)
};

export const UI_CONFIG = {
    OVERLAY_INTERVAL: 30 * 1000, // 오버레이 표시 간격 (30초)
    POPUP_AUTO_HIDE: 3000, // 팝업 자동 숨김 (3초)
    TOGGLE_COOLDOWN: 1000, // 토글 쿨다운 (1초)
    TOGGLE_DEBOUNCE: 500 // 토글 디바운스 (0.5초)
};

export const CHROME_PAGES = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:'
];

export const SENSITIVE_DOMAINS = [
    'accounts.google.com',
    'login.',
    'auth.',
    'signin.',
    'banking.',
    'paypal.com',
    'secure.'
];