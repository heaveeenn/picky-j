/**
 * UserSession.js
 * Google OAuth + JWT 인증 시스템
 */

import { BACKEND_URL } from '../config/env.js';

export class UserSession {
  constructor() {
    this.userId = null;
    this.isAuthenticated = false;
    this.userInfo = null;
    this.jwt = null;
    this.refreshToken = null;
    this.BACKEND_URL = BACKEND_URL; // BACKEND_URL을 인스턴스 변수로 설정

    console.log("👤 UserSession 인스턴스 생성");
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
   * 개선된 자동 로그인 (저장된 세션 → Refresh Token 순서)
   */
  async tryAutoLogin() {
    console.log("🔄 자동 로그인 시도 시작");
    try {
      // 1. 저장된 세션 먼저 확인
      console.log("1️⃣ 저장된 세션 확인 중...");
      const restored = await this.restoreSession();
      if (restored) {
        console.log("✅ 저장된 세션 복원됨:", { userId: this.userId, email: this.userInfo?.email });

        // 2. JWT 유효성 검사
        const isValid = await this.validateJwt();
        if (isValid) {
          console.log("✅ JWT 유효 - 로그인 완료");
          this.printUserInfo("저장된 세션");
          return { success: true, source: "stored" };
        }

        // 3. JWT 만료 시 refresh token으로 갱신 시도
        console.log("⚠️ JWT 만료 - Refresh Token으로 갱신 시도");
        const refreshed = await this.refreshJwtWithBackend();
        if (refreshed.success) {
          console.log("✅ Refresh Token 갱신 성공 - 로그인 완료");
          this.printUserInfo("Refresh Token 갱신");
          return { success: true, source: "refreshed" };
        } else {
          console.log("❌ Refresh Token 갱신 실패:", refreshed.error);
          // Refresh Token도 만료된 경우 세션 초기화
          await this.clearSession();
        }
      }

      // 4. 모든 자동 로그인 방법이 실패한 경우
      console.log("ℹ️ 자동 로그인 불가 - 수동 로그인 필요");
      return { success: false, reason: "자동 로그인 불가 - 수동 로그인 필요" };

    } catch (error) {
      console.log("ℹ️ 자동 로그인 실패 - 수동 로그인 필요:", error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Google 수동 로그인 (팝업에서 호출) - 백엔드 OAuth2 Flow 활용
   */
  async loginWithGoogle() {
    try {
      console.log("🔐 Chrome Identity API를 사용한 Google 로그인 시작");

      // 1. Chrome Identity API로 토큰 받고 백엔드 API 호출
      const authResult = await this.performChromeIdentityLogin();

      if (authResult.success) {
        console.log("🔍 authResult 전체:", authResult);
        console.log("🔍 authResult.userInfo:", authResult.userInfo);

        // 2. JWT 토큰 저장 및 사용자 정보 설정
        await this.saveSession(authResult.accessToken, authResult.refreshToken, authResult.userInfo);
        this.setGoogleUser(authResult.userInfo);

        console.log("✅ Chrome Identity 로그인 성공:", authResult.userInfo?.email || "email 없음");

        // Popup UI 업데이트를 위한 로그인 성공 플래그 설정
        await chrome.storage.local.set({ loginSuccess: true });
        console.log("📢 Popup UI 업데이트를 위한 loginSuccess 플래그 설정");

        return { success: true, user: authResult.userInfo };
      }

      return { success: false, error: "OAuth2 로그인에 실패했습니다." };
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
   * Google 사용자 정보 설정 (userId는 JWT에서 설정됨)
   */
  setGoogleUser(userInfo) {
    this.isAuthenticated = true;
    this.userInfo = userInfo;
    // userId는 exchangeForJwt에서 JWT를 통해 설정됨
  }

  // clearMemorySession 제거됨 - async clearSession()으로 통합

  /**
   * 완전한 로그아웃 (백엔드 API + 로컬 Storage)
   */
  async logout() {
    console.log("🔐 UserSession.logout() 시작");
    try {
      // 1. 백엔드 로그아웃 API 호출 (Refresh Token 블랙리스트 추가)
      try {
        console.log("1️⃣ 백엔드 로그아웃 API 호출 중...");
        // JWT가 있는 경우에만 Authorization 헤더 추가
        const headers = {
          'Content-Type': 'application/json'
        };
        if (this.jwt) {
          headers['Authorization'] = `Bearer ${this.jwt}`;
          console.log("🎫 JWT 토큰으로 인증된 로그아웃");
        } else {
          console.log("⚠️ JWT 토큰 없음 - 쿠키만으로 로그아웃");
        }

        const response = await fetch(`${this.BACKEND_URL}/api/auth/logout`, {
          method: 'POST',
          headers: headers,
          credentials: 'include' // 쿠키 포함
        });

        if (response.ok) {
          console.log("✅ 백엔드 로그아웃 성공 - Refresh Token 무효화됨");
        } else {
          console.warn("⚠️ 백엔드 로그아웃 실패 (계속 진행):", response.status);
        }
      } catch (backendError) {
        console.warn("⚠️ 백엔드 로그아웃 요청 실패 (계속 진행):", backendError);
      }

      // 2. Chrome Identity API 캐시된 토큰 무효화 (계정 선택 강제를 위해)
      console.log("2️⃣ Chrome Identity API 토큰 캐시 무효화 중...");
      try {
        // 현재 캐시된 토큰 가져오기 (interactive: false)
        chrome.identity.getAuthToken({
          interactive: false,
          scopes: ['openid', 'email', 'profile']
        }, (token) => {
          if (chrome.runtime.lastError) {
            console.log("ℹ️ 캐시된 토큰 없음:", chrome.runtime.lastError.message);
          } else if (token) {
            // 캐시된 토큰 무효화
            chrome.identity.removeCachedAuthToken({token: token}, () => {
              if (chrome.runtime.lastError) {
                console.log("⚠️ 토큰 무효화 실패:", chrome.runtime.lastError.message);
              } else {
                console.log("✅ Chrome Identity API 토큰 캐시 무효화 완료");
              }
            });
          } else {
            console.log("ℹ️ 무효화할 캐시된 토큰 없음");
          }
        });
      } catch (identityError) {
        console.log("⚠️ Chrome Identity API 작업 실패:", identityError);
      }

      // 3. 확장프로그램 로컬 Storage 클리어 (히스토리 수집 플래그도 함께 제거)
      console.log("3️⃣ Chrome Storage 클리어 중...");
      await chrome.storage.local.remove(["jwt", "refreshToken", "userInfo", "userId", "historyCollected"]);
      console.log("✅ Chrome Storage 클리어 완료");

      // 4. 메모리 세션 클리어
      console.log("4️⃣ 메모리 세션 클리어 중...");
      this.userId = null;
      this.isAuthenticated = false;
      this.userInfo = null;
      this.jwt = null;
      this.refreshToken = null;
      console.log("✅ 메모리 세션 클리어 완료");

      console.log("👋 완전 로그아웃 완료");
      return { success: true, message: "로그아웃 완료" };
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
      return { success: false, message: error.message || "알 수 없는 오류" };
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


  /**
   * Chrome Identity API를 사용한 Google OAuth2 (Chrome 로그인 계정 자동 사용)
   */
  async performChromeIdentityLogin() {
    return new Promise((resolve, reject) => {
      console.log("🔐 Chrome Identity API - Chrome 로그인 계정으로 자동 로그인 시작");

      // 1단계: Chrome 로그인된 사용자 정보 먼저 확인
      chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' }, (profileInfo) => {
        console.log("👤 Chrome 프로필 정보:", profileInfo);

        if (chrome.runtime.lastError) {
          console.log("ℹ️ Chrome 브라우저에 Google 로그인이 안되어 있음:", chrome.runtime.lastError.message);

          // Chrome 로그인이 안되어도 기본 Chrome Identity API로 시도
          this.performBasicIdentityLogin()
            .then(resolve)
            .catch((error) => {
              console.warn("⚠️ 기본 Identity 로그인 실패:", error);
              resolve({ success: false, error: error?.message || "Chrome Identity 로그인 실패" });
            });
          return;
        }

        if (!profileInfo || !profileInfo.email) {
          console.log("⚠️ Chrome 브라우저에 Google 로그인이 안되어 있음 - 기본 Identity API로 시도");

          // Chrome 로그인이 안되어도 기본 Chrome Identity API로 시도
          this.performBasicIdentityLogin()
            .then(resolve)
            .catch((error) => {
              console.warn("⚠️ 기본 Identity 로그인 실패:", error);
              resolve({ success: false, error: error?.message || "Chrome Identity 로그인 실패" });
            });
          return;
        }

        console.log("✅ Chrome 로그인 계정 확인:", profileInfo.email);

        // 2단계: 캐시된 토큰 먼저 확인 (Chrome 로그인 계정으로)
        chrome.identity.getAuthToken({
          interactive: false,
          scopes: ['openid', 'email', 'profile'],
          account: { id: profileInfo.id }
        }, async (token) => {
          if (token) {
            // 캐시된 토큰이 있으면 바로 사용
            console.log("✅ 캐시된 토큰 사용 (Chrome 계정:", profileInfo.email + "):", token.substring(0, 10) + "...");
            try {
              const result = await this.exchangeAccessTokenForJWT(token);
              resolve(result);
              return;
            } catch (error) {
              console.warn("⚠️ 캐시된 토큰으로 로그인 실패, interactive 모드로 재시도");
            }
          }

          // 3단계: 캐시된 토큰이 없거나 실패하면 Chrome 계정으로 interactive 로그인
          console.log("🔄 Chrome 계정으로 Interactive 모드 토큰 요청:", profileInfo.email);
          chrome.identity.getAuthToken({
            interactive: true,
            scopes: ['openid', 'email', 'profile'],
            account: { id: profileInfo.id }  // Chrome 로그인 계정 강제 사용
          }, async (newToken) => {
            console.log("📥 Chrome Identity API Interactive 응답 (계정:", profileInfo.email + ")");

            if (chrome.runtime.lastError) {
              console.warn("⚠️ getAuthToken Interactive 오류:", chrome.runtime.lastError);
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }

            if (!newToken) {
              console.error("❌ Interactive 모드에서도 토큰을 받지 못함");
              resolve({ success: false, error: "Google 로그인에서 토큰을 받지 못했습니다." });
              return;
            }

            try {
              console.log("✅ Google access token 수신 (Chrome 계정 " + profileInfo.email + "):", newToken.substring(0, 10) + "...");

              // 백엔드에 access token 전달해서 JWT로 교환
              const result = await this.exchangeAccessTokenForJWT(newToken);
              resolve(result);

            } catch (error) {
              console.error("❌ OAuth2 처리 실패:", error);
              resolve({ success: false, error: error?.message || "OAuth2 처리 실패" });
            }
          });
        });
      });
    });
  }

  /**
   * Chrome 로그인이 안된 경우 기본 Chrome Identity API 시도
   */
  async performBasicIdentityLogin() {
    return new Promise((resolve, reject) => {
      console.log("🔐 Chrome 로그인 없이 기본 Identity API로 Google OAuth2 시작");

      // 1단계: 캐시된 토큰 먼저 확인 (사용자 상호작용 없음)
      chrome.identity.getAuthToken({
        interactive: false,
        scopes: ['openid', 'email', 'profile']
      }, async (token) => {
        // runtime.lastError 체크 (Chrome 로그인 안된 상태에서 발생하는 정상적인 오류)
        if (chrome.runtime.lastError) {
          console.log("ℹ️ 캐시된 토큰 없음 (Chrome 로그인 안됨):", chrome.runtime.lastError.message);
          // interactive 모드로 계속 진행
        } else if (token) {
          // 캐시된 토큰이 있으면 바로 사용
          console.log("✅ 캐시된 토큰 사용:", token.substring(0, 10) + "...");
          try {
            const result = await this.exchangeAccessTokenForJWT(token);
            resolve(result);
            return;
          } catch (error) {
            console.warn("⚠️ 캐시된 토큰으로 로그인 실패, interactive 모드로 재시도");
          }
        }

        // 2단계: 캐시된 토큰이 없거나 실패하면 interactive 모드
        console.log("🔄 Interactive 모드로 새 토큰 요청");
        chrome.identity.getAuthToken({
          interactive: true,
          scopes: ['openid', 'email', 'profile']
        }, async (newToken) => {
          console.log("📥 Chrome Identity API Interactive 응답");

          if (chrome.runtime.lastError) {
            console.warn("⚠️ getAuthToken Interactive 오류:", chrome.runtime.lastError);
            resolve({ success: false, error: chrome.runtime.lastError.message });
            return;
          }

          if (!newToken) {
            console.error("❌ Interactive 모드에서도 토큰을 받지 못함");
            resolve({ success: false, error: "Google 로그인에서 토큰을 받지 못했습니다." });
            return;
          }

          try {
            console.log("✅ Google access token 수신 (Interactive):", newToken.substring(0, 10) + "...");

            // 백엔드에 access token 전달해서 JWT로 교환
            const result = await this.exchangeAccessTokenForJWT(newToken);
            resolve(result);

          } catch (error) {
            console.error("❌ OAuth2 처리 실패:", error);
            resolve({ success: false, error: error?.message || "OAuth2 처리 실패" });
          }
        });
      });
    });
  }

  /**
   * Chrome 로그인이 안된 경우 대체 방법: 웹 방식 OAuth2 (새 탭)
   */
  async performWebOAuth2() {
    return new Promise((resolve, reject) => {
      console.log("🔐 Chrome 로그인 안됨 - 웹 방식 OAuth2 시작 (새 탭)");

      // 웹용 백엔드 OAuth2 엔드포인트 사용
      const oauthUrl = `${this.BACKEND_URL}/oauth2/authorization/google`;

      console.log("🔗 웹 OAuth2 URL:", oauthUrl);

      // 새 탭에서 웹 방식 OAuth2 실행
      chrome.tabs.create({ url: oauthUrl }, (tab) => {
        console.log("📱 새 탭에서 웹 OAuth2 실행:", tab.id);

        // 탭 업데이트 리스너로 토큰 수신 대기
        const tabListener = (tabId, changeInfo, updatedTab) => {
          if (tabId !== tab.id) return;

          // 백엔드에서 성공 처리된 URL 감지
          if (changeInfo.url && changeInfo.url.includes('oauth2/success')) {
            console.log("✅ 웹 OAuth2 성공 감지:", changeInfo.url);

            // URL에서 토큰 추출 시도
            try {
              const url = new URL(changeInfo.url);
              const accessToken = url.searchParams.get('access_token') ||
                                url.hash.match(/access_token=([^&]+)/)?.[1];

              if (accessToken) {
                console.log("✅ 웹 OAuth2 access token 수신:", accessToken.substring(0, 10) + "...");

                // 리스너 제거 및 탭 닫기
                chrome.tabs.onUpdated.removeListener(tabListener);
                chrome.tabs.remove(tab.id);

                // JWT 교환
                this.exchangeAccessTokenForJWT(accessToken)
                  .then(resolve)
                  .catch(reject);
              } else {
                console.log("⚠️ 성공 URL에서 토큰을 찾을 수 없음");
                resolve({ success: false, error: "토큰을 찾을 수 없습니다" });
              }
            } catch (error) {
              console.error("❌ 웹 OAuth2 토큰 추출 실패:", error);
              reject(error);
            }
          }
        };

        // 탭 업데이트 리스너 등록
        chrome.tabs.onUpdated.addListener(tabListener);

        // 타임아웃 설정 (2분)
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(tabListener);
          chrome.tabs.remove(tab.id).catch(() => {}); // 이미 닫혔을 수 있음
          reject(new Error("웹 OAuth2 로그인 시간 초과"));
        }, 120000);
      });
    });
  }

  /**
   * Google access token을 백엔드에서 JWT 토큰으로 교환
   */
  async exchangeAccessTokenForJWT(accessToken) {
    console.log("🔄 백엔드에 Google access token 전달하여 JWT로 교환");

    try {
      // 기존 /api/auth/google/login 엔드포인트 사용 (AccessToken 지원)
      const response = await fetch(`${this.BACKEND_URL}/api/auth/google/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: accessToken,
          source: "chrome_extension"
        })
      });

      console.log("📡 access token 교환 응답 상태:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ access token 교환 HTTP 오류:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ access token → JWT 교환 성공:", result);

      // 사용자 정보도 함께 조회
      const userInfo = await this.fetchBackendUserInfo(result.data.accessToken);

      return {
        success: true,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        userInfo: userInfo
      };

    } catch (error) {
      console.error("❌ access token → JWT 교환 실패:", error);
      throw error;
    }
  }


  /**
   * JWT 토큰으로 백엔드에서 사용자 정보 가져오기
   */
  async fetchBackendUserInfo(accessToken) {
    console.log("📤 백엔드에서 사용자 정보 조회 요청");

    const response = await fetch(`${this.BACKEND_URL}/api/users/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 사용자 정보 응답 상태:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ 사용자 정보 조회 오류:", errorText);
      throw new Error(`사용자 정보 조회 실패: HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ 백엔드에서 사용자 정보 조회 성공:", result);

    return result.data; // ApiResponse.data 구조
  }


  /**
   * JWT 토큰으로부터 사용자 정보 조회
   */
  async getUserInfoFromJwt(accessToken) {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }

      throw new Error("사용자 정보 조회 실패");
    } catch (error) {
      console.error("❌ 사용자 정보 조회 중 오류:", error);
      throw error;
    }
  }

  /**
   * Extension 저장된 Refresh Token을 사용한 JWT 갱신
   */
  async refreshJwtWithBackend() {
    try {
      console.log("🔄 Extension Refresh Token으로 JWT 갱신 시도");

      if (!this.refreshToken) {
        console.log("❌ Extension에 저장된 Refresh Token이 없습니다.");
        return { success: false, error: "Extension Refresh Token 없음" };
      }

      // Extension에 저장된 refresh token으로 백엔드 refresh 엔드포인트 호출
      const response = await fetch(`${this.BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
        // credentials: 'include' 제거 - Extension storage의 refresh token 사용
      });

      if (response.ok) {
        const result = await response.json();
        const { accessToken, refreshToken: newRefreshToken } = result.data;

        // 새로운 토큰들로 세션 업데이트
        this.jwt = accessToken;
        this.refreshToken = newRefreshToken;

        // Extension storage에 저장
        await this.saveSession(accessToken, newRefreshToken, this.userInfo);

        console.log("✅ Extension Refresh Token으로 JWT 갱신 성공");
        return { success: true, accessToken, refreshToken: newRefreshToken };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log("❌ JWT 갱신 실패:", response.status, errorData);
        return { success: false, error: `HTTP ${response.status}: ${errorData.message || 'Unknown error'}` };
      }
    } catch (error) {
      console.error("❌ JWT 갱신 중 오류:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 세션 저장
   */
  async saveSession(accessToken, refreshToken, userInfo) {
    try {
      console.log("💾 세션 저장 중...", { userId: userInfo?.email });

      // 메모리에 저장
      this.jwt = accessToken;
      this.refreshToken = refreshToken;
      this.userInfo = userInfo;
      this.userId = userInfo?.email;
      this.isAuthenticated = true;

      // Chrome Storage에 저장
      await chrome.storage.local.set({
        jwt: accessToken,
        refreshToken: refreshToken,
        userInfo: userInfo,
        userId: userInfo?.email
      });

      console.log("✅ 세션 저장 완료");
    } catch (error) {
      console.error("❌ 세션 저장 실패:", error);
      throw error;
    }
  }

  
  /**
   * 세션 완전 초기화
   */
  async clearSession() {
    try {
      console.log("🧹 세션 초기화 중...");

      // 메모리 초기화
      this.userId = null;
      this.isAuthenticated = false;
      this.userInfo = null;
      this.jwt = null;
      this.refreshToken = null;

      // 저장소 초기화
      await chrome.storage.local.remove(['jwt', 'refreshToken', 'userInfo', 'userId', 'loginSuccess']);

      console.log("✅ 세션 초기화 완료");
    } catch (error) {
      console.error("❌ 세션 초기화 실패:", error);
    }
  }

}
