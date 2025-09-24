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
      console.log("🔐 백엔드 OAuth2 Flow를 사용한 Google 로그인 시작");

      // 1. 백엔드 OAuth2 엔드포인트로 새 탭에서 로그인 진행
      const authResult = await this.performBackendOAuth2Login();

      if (authResult.success) {
        // 2. JWT 토큰 저장 및 사용자 정보 설정
        await this.saveSession(authResult.accessToken, authResult.refreshToken, authResult.userInfo);
        this.setGoogleUser(authResult.userInfo);

        console.log("✅ 백엔드 OAuth2 로그인 성공:", authResult.userInfo.email);
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

      // 2. 확장프로그램 로컬 Storage 클리어 (히스토리 수집 플래그도 함께 제거)
      console.log("2️⃣ Chrome Storage 클리어 중...");
      await chrome.storage.local.remove(["jwt", "refreshToken", "userInfo", "userId", "historyCollected"]);
      console.log("✅ Chrome Storage 클리어 완료");

      // 3. 메모리 세션 클리어
      console.log("3️⃣ 메모리 세션 클리어 중...");
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
   * 백엔드 OAuth2 Flow를 통한 로그인 (새 탭 사용)
   */
  async performBackendOAuth2Login() {
    return new Promise((resolve, reject) => {
      console.log("🌐 새 탭에서 백엔드 OAuth2 로그인 시작");

      // 1. 백엔드 OAuth2 엔드포인트 URL 생성 (매번 계정 선택 강제)
      const timestamp = Date.now();
      const backendOAuthUrl = `${this.BACKEND_URL}/oauth2/authorization/google?prompt=select_account&state=${timestamp}`;
      console.log("🔗 OAuth2 URL:", backendOAuthUrl);

      let isCompleted = false;

      // 2. Content Script와의 통신을 위한 메시지 리스너 등록
      const messageListener = (message, sender, sendResponse) => {
        if (message.type === 'OAUTH2_SUCCESS' && !isCompleted) {
          console.log("✅ OAuth2 성공 메시지 수신:", message);
          isCompleted = true;

          // 리스너 제거
          chrome.runtime.onMessage.removeListener(messageListener);

          // 토큰으로 사용자 정보 조회 후 resolve
          this.getUserInfoFromJwt(message.accessToken)
            .then(userInfo => {
              resolve({
                success: true,
                accessToken: message.accessToken,
                refreshToken: message.refreshToken,
                userInfo: userInfo
              });
            })
            .catch(error => {
              console.error("❌ 사용자 정보 조회 실패:", error);
              reject(error);
            });
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      // 3. 새 탭에서 OAuth2 로그인 진행
      chrome.tabs.create({ url: backendOAuthUrl }, (tab) => {
        const tabId = tab.id;

        // 4. 탭 닫힘 리스너 등록 - 사용자가 탭을 닫은 경우
        const tabRemovedListener = (removedTabId) => {
          if (removedTabId === tabId && !isCompleted) {
            console.log("⚠️ 사용자가 OAuth2 탭을 닫음");
            isCompleted = true;
            chrome.runtime.onMessage.removeListener(messageListener);
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            reject(new Error("사용자가 로그인을 취소했습니다."));
          }
        };

        chrome.tabs.onRemoved.addListener(tabRemovedListener);

        // 5. 탭 업데이트 리스너로 OAuth2 완료 감지
        const tabUpdateListener = (updatedTabId, changeInfo, updatedTab) => {
          if (updatedTabId === tabId && changeInfo.url && !isCompleted) {
            console.log("🔄 탭 URL 변경:", changeInfo.url);

            // OAuth2 성공 페이지로 이동했는지 확인 (백엔드 성공 핸들러의 Extension 전용 페이지)
            if (changeInfo.url.includes('/login/oauth2/code/google') &&
                !changeInfo.url.includes('localhost:5173')) {
              console.log("✅ OAuth2 성공 페이지 감지");
              isCompleted = true;

              // 리스너 정리
              chrome.tabs.onUpdated.removeListener(tabUpdateListener);
              chrome.tabs.onRemoved.removeListener(tabRemovedListener);
              chrome.runtime.onMessage.removeListener(messageListener);

              // 백엔드에서 토큰 조회
              this.getTokensFromBackend()
                .then(result => {
                  chrome.tabs.remove(tabId);
                  resolve(result);
                })
                .catch(error => {
                  console.error("❌ 백엔드 토큰 조회 실패:", error);
                  chrome.tabs.remove(tabId);
                  reject(error);
                });
            }
          }
        };

        chrome.tabs.onUpdated.addListener(tabUpdateListener);

        // 6. 타임아웃 설정 (2분)
        setTimeout(() => {
          if (!isCompleted) {
            console.log("⏰ OAuth2 로그인 타임아웃");
            isCompleted = true;
            chrome.runtime.onMessage.removeListener(messageListener);
            chrome.tabs.remove(tabId);
            chrome.tabs.onRemoved.removeListener(tabRemovedListener);
            reject(new Error("로그인 타임아웃이 발생했습니다."));
          }
        }, 120000); // 2분
      });
    });
  }

  /**
   * OAuth2 성공 URL인지 확인
   */
  isOAuth2SuccessUrl(url) {
    // 백엔드에서 OAuth2 성공 후 리디렉션되는 URL 패턴들
    const successPatterns = [
      '/auth/oauth2/success',
      '/login/oauth2/code/google',
      // 백엔드에서 설정한 성공 페이지 패턴 추가
    ];

    return successPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * OAuth2 성공 페이지에서 postMessage로 토큰 수신
   */
  async extractTokensFromSuccessUrl(url) {
    return new Promise((resolve, reject) => {
      console.log("🎫 OAuth2 성공 페이지에서 postMessage 대기 중:", url);

      // postMessage 리스너 등록
      const messageListener = async (event) => {
        // 보안: 백엔드 도메인에서 온 메시지만 처리
        if (!event.origin.includes(this.BACKEND_URL.replace('http://localhost:8080', 'localhost'))) {
          console.log("⚠️ 신뢰할 수 없는 origin에서 온 메시지:", event.origin);
          return;
        }

        if (event.data && event.data.type === 'OAUTH2_SUCCESS') {
          console.log("✅ OAuth2 성공 메시지 수신:", event.data);

          try {
            // 사용자 정보 조회
            const userInfo = await this.getUserInfoFromJwt(event.data.accessToken);

            // 리스너 제거
            window.removeEventListener('message', messageListener);

            resolve({
              success: true,
              accessToken: event.data.accessToken,
              refreshToken: event.data.refreshToken,
              userInfo: userInfo
            });
          } catch (error) {
            console.error("❌ 사용자 정보 조회 실패:", error);
            window.removeEventListener('message', messageListener);
            reject(error);
          }
        }
      };

      // 메시지 리스너 등록
      window.addEventListener('message', messageListener);

      // 타임아웃 설정 (30초)
      setTimeout(() => {
        window.removeEventListener('message', messageListener);
        reject(new Error("OAuth2 메시지 수신 타임아웃"));
      }, 30000);
    });
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
      await chrome.storage.local.remove(['jwt', 'refreshToken', 'userInfo', 'userId']);

      console.log("✅ 세션 초기화 완료");
    } catch (error) {
      console.error("❌ 세션 초기화 실패:", error);
    }
  }

  /**
   * 백엔드에서 OAuth2 완료 후 쿠키로 토큰 조회
   */
  async getTokensFromBackend() {
    try {
      console.log("🔍 백엔드 쿠키에서 refresh token으로 JWT 조회 중...");

      // 백엔드의 쿠키에 저장된 refresh token으로 새 JWT 발급
      const response = await fetch(`${this.BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // 쿠키 포함 (refresh token이 쿠키에 있음)
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const { accessToken, refreshToken } = result.data;

        // 사용자 정보 조회
        const userInfo = await this.getUserInfoFromJwt(accessToken);

        console.log("✅ 쿠키 refresh token으로 JWT 조회 성공");
        return {
          success: true,
          accessToken: accessToken,
          refreshToken: refreshToken,
          userInfo: userInfo
        };
      } else {
        throw new Error(`HTTP ${response.status}: 쿠키 refresh token 조회 실패`);
      }
    } catch (error) {
      console.error("❌ 백엔드 쿠키 토큰 조회 실패:", error);
      throw error;
    }
  }
}
