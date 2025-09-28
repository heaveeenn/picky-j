/**
 * 환경 변수에서 설정 가져오기
 */

// Vite 환경 변수에서 가져오기 (빌드 시 자동 주입)
export const DATA_ENGINE_URL = import.meta.env.VITE_DATA_ENGINE_URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
export const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL

// 전체 환경 설정 객체
export const ENV = {
  DATA_ENGINE_URL,
  BACKEND_URL,
  GOOGLE_CLIENT_ID,
  DASHBOARD_URL,
  isDevelopment: import.meta.env.DEV || false
};

// 디버그 로그 (개발 환경에서만)
if (ENV.isDevelopment) {
  console.log("🔧 Extension 환경 설정:", ENV);
}
