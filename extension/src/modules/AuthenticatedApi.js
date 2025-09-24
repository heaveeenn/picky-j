/**
 * AuthenticatedApi.js
 * JWT 토큰 만료를 자동으로 처리하는 fetch 래퍼
 */

let userSession = null;

/**
 * API 모듈을 초기화하고 UserSession 인스턴스를 주입합니다.
 * background.js에서 한 번만 호출되어야 합니다.
 * @param {UserSession} session - 현재 사용자 세션 인스턴스
 */
export function initApi(session) {
  if (!session) {
    throw new Error("UserSession 인스턴스가 필요합니다.");
  }
  userSession = session;
  console.log("✅ Authenticated API 모듈 초기화 완료");
}

/**
 * 인증 헤더를 포함하고, 401 에러 시 자동으로 토큰 갱신 및 재시도를 수행하는 fetch 함수
 * @param {string} url - 요청할 URL
 * @param {object} options - fetch에 전달할 옵션
 * @returns {Promise<Response>} - fetch의 응답 Promise
 */
export async function authFetch(url, options = {}) {
  if (!userSession) {
    throw new Error("API가 초기화되지 않았습니다. initApi()를 먼저 호출하세요.");
  }

  // 1. 현재 JWT로 인증 헤더 추가
  const authHeaders = userSession.getAuthHeaders();
  const enrichedOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...authHeaders,
    },
  };

  // 2. 첫 번째 API 요청 시도
  let response = await fetch(url, enrichedOptions);

  // 3. 401 에러 발생 시 토큰 갱신 및 재시도
  if (response.status === 401) {
    console.log("⚠️ API 요청 401 Unauthorized. JWT 갱신을 시도합니다.");

    try {
      const refreshResult = await userSession.refreshJwtWithBackend();

      if (refreshResult.success) {
        console.log("✅ JWT 갱신 성공. 원래 요청을 재시도합니다.");
        
        // 갱신된 토큰으로 헤더 다시 설정
        const newAuthHeaders = userSession.getAuthHeaders();
        const retriedOptions = {
          ...options,
          headers: {
            ...options.headers,
            ...newAuthHeaders,
          },
        };
        
        // 원래 요청 재시도
        response = await fetch(url, retriedOptions);
      } else {
        // refreshResult.success가 false인 경우는 refreshJwtWithBackend 내부에서 처리됨
        // 여기서는 에러를 전파하여 호출 측에서 처리하도록 함
        console.error("❌ JWT 갱신에 최종 실패했습니다. 로그아웃이 필요합니다.");
        await userSession.clearSession(); // 세션 정리
        throw new Error("Authentication failed: Unable to refresh token.");
      }
    } catch (error) {
      console.error("❌ 토큰 갱신 프로세스 중 심각한 오류 발생:", error);
      await userSession.clearSession(); // 확실하게 세션 정리
      throw error; // 에러 전파
    }
  }

  return response;
}