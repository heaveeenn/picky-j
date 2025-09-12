/**
 * UserSession.js
 * 
 * Google OAuth 전용 사용자 세션 관리
 * - Google 자동 로그인 시도
 * - 로그인 실패시 Popup에서 수동 로그인 유도
 */

export class UserSession {
  constructor() {
    this.userId = null;
    this.isAuthenticated = false;
    this.userInfo = null;
    
    console.log("👤 UserSession 인스턴스 생성");
  }

  /**
   * 사용자 세션 초기화 (개발용 더미 사용자)
   */
  async initialize() {
    try {
      // 개발용 더미 사용자 사용
      this.setDummyUser();
      return this.getSessionInfo();
    } catch (error) {
      console.error("❌ 더미 사용자 세션 초기화 실패:", error);
      return { success: false, needLogin: true };
    }
  }

  /**
   * Dummy 사용자 정보 설정 (개발용)
   */
  setDummyUser() {
    const dummyUser = {
      email: 'dummy-user@picky.com',
      id: '1234567890',
      name: '더미사용자',
      picture: 'https://via.placeholder.com/150',
      given_name: '더미',
      family_name: '사용자',
    };
    this.userId = dummyUser.email;
    this.isAuthenticated = true;
    this.userInfo = dummyUser;
    console.log("✅ Dummy 사용자 로그인 성공:", this.userInfo.email);
  }

  /**
   * Google 자동 로그인 시도
   */
  async tryAutoLogin() {
    try {
      // Chrome Identity API로 자동 로그인 시도
      const token = await chrome.identity.getAuthToken({
        interactive: false  // 팝업 없이 자동
      });

      if (token) {
        // 토큰으로 사용자 정보 가져오기
        const userInfo = await this.fetchUserInfo(token);
        this.setGoogleUser(userInfo);
        
        console.log("✅ Google 자동 로그인 성공:", userInfo.email);
        return { success: true, user: userInfo };
      }
      
      return { success: false, reason: "No token" };
    } catch (error) {
      console.log("ℹ️ Google 자동 로그인 실패 - 수동 로그인 필요:", error.message);
      return { success: false, reason: error.message };
    }
  }

  /**
   * Google 수동 로그인 (Popup에서 호출)
   */
  async loginWithGoogle() {
    try {
      // Chrome Identity API로 수동 로그인
      const token = await chrome.identity.getAuthToken({
        interactive: true  // 사용자 상호작용 허용
      });

      if (token) {
        const userInfo = await this.fetchUserInfo(token);
        this.setGoogleUser(userInfo);
        
        console.log("✅ Google 수동 로그인 성공:", userInfo.email);
        return { success: true, user: userInfo };
      }

      return { success: false, message: "로그인 취소됨" };
    } catch (error) {
      console.error("❌ Google 로그인 실패:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Google API에서 사용자 정보 가져오기
   */
  async fetchUserInfo(token) {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('사용자 정보 가져오기 실패');
    }
    
    return await response.json();
  }

  /**
   * Google 사용자 정보 설정 (메모리에만)
   */
  setGoogleUser(userInfo) {
    this.userId = userInfo.email;  // 이메일을 userId로 사용
    this.isAuthenticated = true;
    this.userInfo = userInfo;
  }

  /**
   * 세션 클리어 (메모리에만)
   */
  clearSession() {
    this.userId = null;
    this.isAuthenticated = false;
    this.userInfo = null;
  }

  /**
   * Google 로그아웃
   */
  async logout() {
    try {
      // Chrome Identity API에서 모든 토큰 제거
      await chrome.identity.clearAllCachedAuthTokens();
      
      // 메모리 세션 클리어
      this.clearSession();
      
      console.log("👋 Google 로그아웃 완료");
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
      needLogin: !this.isAuthenticated
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
}