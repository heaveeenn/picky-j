/**
 * UserSession.js - 완성된 Google OAuth + JWT 통합 버전
 *
 * Google OAuth + JWT 인증 시스템
 * - 저장된 세션 복원
 * - JWT 유효성 검증 및 자동 갱신
 * - Google OAuth 자동/수동 로그인
 * - 완전한 로그아웃 처리
 */

// const BACKEND_URL = "https://j13c102.p.ssafy.io";
const BACKEND_URL = "http://localhost:8080";

export class UserSession {
  constructor() {
    this.userId = null;
    this.isAuthenticated = false;
    this.userInfo = null;
    this.jwt = null;
    this.refreshToken = null;

    console.log("👤 UserSession 인스턴스 생성");
  }


  /**
   * Chrome Identity API를 사용한 Google 사용자 정보 가져오기
   */
  async getGoogleUserInfo(accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Google 사용자 정보 가져오기 실패:", error);
      throw error;
    }
  }

  /**
   * Chrome Identity API를 사용한 OAuth 토큰 발급
   */
  async getGoogleAccessToken(interactive = false) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(token);
        }
      });
    });
  }

  /**
   * JWT 유효성 검증 (단순히 JWT 존재 여부만 확인)
   */
  async validateJwt() {
    return !!this.jwt;
  }

  /**
   * JWT 토큰 갱신
   */
  async refreshJwtToken() {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();
      if (data.success) {
        this.jwt = data.accessToken;
        await chrome.storage.local.set({ jwt: this.jwt });
        console.log("✅ JWT 갱신 성공");
        return true;
      }
    } catch (error) {
      console.error("JWT 갱신 실패:", error);
    }
    return false;
  }

  /**
   * 저장된 세션 복원
   */
  async restoreSession() {
    try {
      const stored = await chrome.storage.local.get([
        "jwt",
        "userInfo",
        "refreshToken",
      ]);

      if (stored.jwt && stored.userInfo) {
        this.jwt = stored.jwt;
        this.userInfo = stored.userInfo;
        this.refreshToken = stored.refreshToken;
        this.isAuthenticated = true;

        // Google 이메일을 userId로 사용
        this.userId = this.userInfo.email;
        console.log("✅ 저장된 세션 복원 - userId:", this.userId);

        return true;
      }
    } catch (error) {
      console.warn("세션 복원 실패:", error);
    }
    return false;
  }

  /**
   * Chrome 확장프로그램 Access Token을 백엔드로 전달해서 JWT 발급받기
   */
  async exchangeForJwt(accessToken, userInfo) {
    try {
      console.log("🔗 JWT 발급 요청 시작:", `${BACKEND_URL}/api/auth/google/login`);
      console.log("🎫 Google Access Token:", accessToken.substring(0, 20) + "...");

      // 기존 엔드포인트 사용하되, Chrome Extension에서 온 토큰임을 표시
      const requestBody = {
        accessToken: accessToken,  // Access Token으로 변경 (기존 idToken 대신)
        userInfo: userInfo,
        source: "chrome_extension"  // 출처 표시
      };

      const response = await fetch(`${BACKEND_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 응답 상태:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ HTTP 오류 응답:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("📦 응답 데이터:", data);

      if (data.success) {
        this.jwt = data.data.accessToken;      // ApiResponse.data 구조에 맞게 수정
        this.refreshToken = data.data.refreshToken; // ApiResponse.data 구조에 맞게 수정

        // Google 이메일을 userId로 사용
        this.userId = userInfo.email;
        console.log("🔍 Google 이메일을 userId로 사용:", this.userId);

        await chrome.storage.local.set({
          jwt: this.jwt,
          refreshToken: this.refreshToken,
          userInfo: userInfo,
          loginSuccess: true,  // popup 알림용 플래그 추가
        });

        console.log("✅ JWT 발급 성공 - Access Token:", this.jwt?.substring(0, 20) + "...");
        return { success: true };
      }

      return { success: false, error: data.message || "JWT 발급 실패" };
    } catch (error) {
      console.error("JWT 발급 실패:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 개선된 자동 로그인 (저장된 세션 → OAuth → JWT 순서)
   */
  async tryAutoLogin() {
    console.log("🔄 자동 로그인 시도 시작");
    try {
      // 1. 저장된 세션 먼저 확인
      console.log("1️⃣ 저장된 세션 확인 중...");
      const restored = await this.restoreSession();
      if (restored) {
        console.log("✅ 저장된 세션 복원됨:", { userId: this.userId, email: this.userInfo?.email });
        const isValid = await this.validateJwt();

        if (isValid) {
          console.log("✅ JWT 유효 - 로그인 완료");
          this.printUserInfo("저장된 세션");
          return { success: true, source: "stored" };
        } else {
          console.log("⚠️ JWT 만료 - 갱신 시도");
          // JWT 만료 시 갱신 시도
          const refreshed = await this.refreshJwtToken();
          if (refreshed) {
            console.log("✅ JWT 갱신 성공 - 로그인 완료");
            this.printUserInfo("JWT 갱신");
            return { success: true, source: "refreshed" };
          }
        }
      }

      // 2. Google OAuth 자동 시도 (Chrome Identity API 활용)
      console.log("2️⃣ Google OAuth 자동 로그인 시도...");

      try {
        const accessToken = await this.getGoogleAccessToken(false); // non-interactive

        if (accessToken) {
          console.log("✅ Google Access Token 획득:", accessToken.substring(0, 20) + "...");
          const userInfo = await this.getGoogleUserInfo(accessToken);
          console.log("✅ Google 사용자 정보 획득:", userInfo);

          const jwtResult = await this.exchangeForJwt(accessToken, userInfo);

          if (jwtResult.success) {
            this.setGoogleUser(userInfo);
            console.log("✅ 백엔드 JWT 발급 성공 - 로그인 완료");
            this.printUserInfo("Google OAuth");
            return { success: true, source: "oauth" };
          } else {
            console.error("❌ 백엔드 JWT 발급 실패:", jwtResult.error);
          }
        } else {
          console.log("ℹ️ Google Access Token 없음 - 수동 로그인 필요");
        }
      } catch (error) {
        console.log("ℹ️ Google OAuth 자동 로그인 실패:", error.message);
      }

      return { success: false, reason: "자동 로그인 불가" };
    } catch (error) {
      console.log("ℹ️ 자동 로그인 실패 - 수동 로그인 필요:", error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Google 수동 로그인 (팝업에서 호출) - Chrome Identity API 활용
   */
  async loginWithGoogle() {
    try {
      console.log("🔐 Chrome Identity API를 사용한 Google 로그인 시작");

      // 1. Chrome Identity API로 Access Token 획득 (interactive 모드)
      const accessToken = await this.getGoogleAccessToken(true);
      console.log("🎫 Access Token 획득:", accessToken.substring(0, 20) + "...");

      // 2. Access Token으로 사용자 정보 가져오기
      const userInfo = await this.getGoogleUserInfo(accessToken);
      console.log("👤 사용자 정보 획득:", userInfo);

      // 3. 백엔드에 Access Token과 사용자 정보 전송하여 JWT 발급
      const jwtResult = await this.exchangeForJwt(accessToken, userInfo);

      if (jwtResult.success) {
        this.setGoogleUser(userInfo);
        console.log("✅ Google 로그인 성공:", userInfo.email);
        return { success: true, user: userInfo };
      }

      return { success: false, error: "JWT 발급에 실패했습니다. 서버 연결을 확인해주세요." };
    } catch (error) {
      console.error("❌ Google 로그인 실패:", error);

      // 사용자가 로그인을 취소한 경우
      if (error.message.includes("cancelled") || error.message.includes("canceled")) {
        return { success: false, error: "로그인이 취소되었습니다." };
      }

      return { success: false, error: error.message || "로그인 중 오류가 발생했습니다." };
    }
  }

  /**
   * Google API에서 사용자 정보 가져오기
   */
  async fetchUserInfo(token) {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error("사용자 정보 가져오기 실패");
    }

    return await response.json();
  }

  /**
   * Access Token으로 ID Token 변환
   */
  async convertToIdToken(accessToken) {
    try {
      // Google OAuth2 토큰 정보 API 호출
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`);

      if (!response.ok) {
        throw new Error("토큰 정보 조회 실패");
      }

      const tokenInfo = await response.json();
      console.log("🔍 토큰 정보:", tokenInfo);

      // 임시 방법: Access Token을 그대로 사용 (백엔드 수정 대안)
      // 실제로는 이 방법보다는 백엔드에서 Access Token도 처리하는 것이 더 좋습니다.
      return accessToken;

    } catch (error) {
      console.error("❌ ID Token 변환 실패:", error);
      // 실패 시 Access Token 그대로 반환
      return accessToken;
    }
  }

  /**
   * Google 사용자 정보 설정 (userId는 JWT에서 설정됨)
   */
  setGoogleUser(userInfo) {
    this.isAuthenticated = true;
    this.userInfo = userInfo;
    // userId는 exchangeForJwt에서 JWT를 통해 설정됨
  }

  /**
   * 메모리 세션 클리어
   */
  clearSession() {
    this.userId = null;
    this.isAuthenticated = false;
    this.userInfo = null;
    this.jwt = null;
    this.refreshToken = null;
  }

  /**
   * 완전한 로그아웃 (Google + JWT + Storage)
   */
  async logout() {
    try {
      // Chrome Identity API에서 모든 토큰 제거
      await chrome.identity.clearAllCachedAuthTokens();

      // Storage 클리어
      await chrome.storage.local.remove(["jwt", "refreshToken", "userInfo"]);

      // 메모리 세션 클리어
      this.clearSession();

      console.log("👋 완전 로그아웃 완료");
      return { success: true, message: "로그아웃 완료" };
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * 현재 세션 정보 반환
   */
  getSessionInfo() {
    return {
      success: this.isAuthenticated,
      userId: this.userId,
      isAuthenticated: this.isAuthenticated,
      userInfo: this.userInfo,
      needLogin: !this.isAuthenticated,
      hasJwt: !!this.jwt,
    };
  }

  /**
   * 인증된 API 요청용 헤더 반환
   */
  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.jwt}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * 사용자 ID 반환 (이메일)
   */
  getUserId() {
    return this.userId;
  }

  /**
   * 인증 상태 확인
   */
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * 사용자 정보 반환
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * 현재 로그인된 사용자 정보를 콘솔에 예쁘게 출력
   */
  printUserInfo(source = "현재") {
    console.log(`
🎉 ===== ${source} 로그인 정보 =====
👤 사용자 ID: ${this.userId || 'N/A'}
📧 이메일: ${this.userInfo?.email || 'N/A'}
🏷️  이름: ${this.userInfo?.name || 'N/A'}
🖼️  프로필 이미지: ${this.userInfo?.picture || 'N/A'}
🔐 로그인 상태: ${this.isAuthenticated ? '✅ 로그인됨' : '❌ 로그아웃'}
🎫 JWT 토큰: ${this.jwt ? '✅ 있음' : '❌ 없음'}
🔄 Refresh 토큰: ${this.refreshToken ? '✅ 있음' : '❌ 없음'}
==============================
    `);
  }

  /**
   * 글로벌 디버깅 함수 (개발자 콘솔에서 직접 호출 가능)
   */
  static setupGlobalDebug() {
    // background.js에서 전역으로 접근 가능하게 설정
    if (typeof globalThis !== 'undefined') {
      globalThis.checkUserSession = () => {
        console.log("🔍 현재 사용자 세션 상태 확인");
        // background.js의 userSession 인스턴스에 접근해야 함
      };
    }
  }
}

// /**
//  * UserSession.js
//  *
//  * Google OAuth 전용 사용자 세션 관리
//  * - Google 자동 로그인 시도
//  * - 로그인 실패시 Popup에서 수동 로그인 유도
//  */

// export class UserSession {
//   constructor() {
//     this.userId = null;
//     this.isAuthenticated = false;
//     this.userInfo = null;

//     console.log("👤 UserSession 인스턴스 생성");
//   }

//   /**
//    * 사용자 세션 초기화 (개발용 더미 사용자)
//    */
//   async initialize() {
//     try {
//       // 개발용 더미 사용자 사용
//       this.setDummyUser();
//       return this.getSessionInfo();
//     } catch (error) {
//       console.error("❌ 더미 사용자 세션 초기화 실패:", error);
//       return { success: false, needLogin: true };
//     }
//   }

//   /**
//    * Dummy 사용자 정보 설정 (개발용)
//    */
//   setDummyUser() {
//     const dummyUser = {
//       email: 'dummy-user@picky.com',
//       id: '1234567890',
//       name: '더미사용자',
//       picture: 'https://via.placeholder.com/150',
//       given_name: '더미',
//       family_name: '사용자',
//     };
//     this.userId = dummyUser.email;
//     this.isAuthenticated = true;
//     this.userInfo = dummyUser;
//     console.log("✅ Dummy 사용자 로그인 성공:", this.userInfo.email);
//   }

//   /**
//    * Google 자동 로그인 시도
//    */
//   async tryAutoLogin() {
//     try {
//       // Chrome Identity API로 자동 로그인 시도
//       const token = await chrome.identity.getAuthToken({
//         interactive: false  // 팝업 없이 자동
//       });

//       if (token) {
//         // 토큰으로 사용자 정보 가져오기
//         const userInfo = await this.fetchUserInfo(token);
//         this.setGoogleUser(userInfo);

//         console.log("✅ Google 자동 로그인 성공:", userInfo.email);
//         return { success: true, user: userInfo };
//       }

//       return { success: false, reason: "No token" };
//     } catch (error) {
//       console.log("ℹ️ Google 자동 로그인 실패 - 수동 로그인 필요:", error.message);
//       return { success: false, reason: error.message };
//     }
//   }

//   /**
//    * Google 수동 로그인 (Popup에서 호출)
//    */
//   async loginWithGoogle() {
//     try {
//       // Chrome Identity API로 수동 로그인
//       const token = await chrome.identity.getAuthToken({
//         interactive: true  // 사용자 상호작용 허용
//       });

//       if (token) {
//         const userInfo = await this.fetchUserInfo(token);
//         this.setGoogleUser(userInfo);

//         console.log("✅ Google 수동 로그인 성공:", userInfo.email);
//         return { success: true, user: userInfo };
//       }

//       return { success: false, message: "로그인 취소됨" };
//     } catch (error) {
//       console.error("❌ Google 로그인 실패:", error);
//       return { success: false, message: error.message };
//     }
//   }

//   /**
//    * Google API에서 사용자 정보 가져오기
//    */
//   async fetchUserInfo(token) {
//     const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
//       headers: { Authorization: `Bearer ${token}` }
//     });

//     if (!response.ok) {
//       throw new Error('사용자 정보 가져오기 실패');
//     }

//     return await response.json();
//   }

//   /**
//    * Google 사용자 정보 설정 (메모리에만)
//    */
//   setGoogleUser(userInfo) {
//     this.userId = userInfo.email;  // 이메일을 userId로 사용
//     this.isAuthenticated = true;
//     this.userInfo = userInfo;
//   }

//   /**
//    * 세션 클리어 (메모리에만)
//    */
//   clearSession() {
//     this.userId = null;
//     this.isAuthenticated = false;
//     this.userInfo = null;
//   }

//   /**
//    * Google 로그아웃
//    */
//   async logout() {
//     try {
//       // Chrome Identity API에서 모든 토큰 제거
//       await chrome.identity.clearAllCachedAuthTokens();

//       // 메모리 세션 클리어
//       this.clearSession();

//       console.log("👋 Google 로그아웃 완료");
//       return { success: true, message: "로그아웃 완료" };
//     } catch (error) {
//       console.error("❌ 로그아웃 실패:", error);
//       return { success: false, message: error.message };
//     }
//   }

//   /**
//    * 현재 세션 정보 반환
//    */
//   getSessionInfo() {
//     return {
//       success: this.isAuthenticated,
//       userId: this.userId,
//       isAuthenticated: this.isAuthenticated,
//       userInfo: this.userInfo,
//       needLogin: !this.isAuthenticated
//     };
//   }

//   /**
//    * 사용자 ID 반환 (이메일)
//    */
//   getUserId() {
//     return this.userId;
//   }

//   /**
//    * 인증 상태 확인
//    */
//   isUserAuthenticated() {
//     return this.isAuthenticated;
//   }

//   /**
//    * 사용자 정보 반환
//    */
//   getUserInfo() {
//     return this.userInfo;
//   }
// }
