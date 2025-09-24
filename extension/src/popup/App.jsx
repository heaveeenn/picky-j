import { useState, useEffect } from "react";

function App() {
  // 인증 관련 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 데이터 수집 토글 상태
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);

  // 토글 보호 장치 상태 (1초 쿨다운, 디바운싱 처리)
  const [isToggleProcessing, setIsToggleProcessing] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState(0);
  const [toggleTimeout, setToggleTimeout] = useState(null);

  // Chrome Storage 변화 감지 (로그인 성공 시 자동 UI 업데이트)
  useEffect(() => {
    const handleStorageChange = (changes, area) => {
      if (area === 'local' && changes.loginSuccess && changes.loginSuccess.newValue) {
        console.log("🔔 Storage에서 로그인 성공 감지!");

        // 사용자 정보 가져와서 UI 업데이트
        chrome.storage.local.get(['userInfo'], (result) => {
          if (result.userInfo) {
            setIsAuthenticated(true);
            setUserInfo(result.userInfo);
            setIsLoggingIn(false);

            // 성공 플래그 제거
            chrome.storage.local.remove(['loginSuccess']);

            console.log("✅ 로그인 성공으로 UI 자동 업데이트:", result.userInfo);
          }
        });
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // 컴포넌트 마운트 시 인증 상태 확인 및 초기화
  useEffect(() => {
    // 토글 상태 로드 함수 (Chrome Storage에서 설정값 가져오기)
    const loadToggleState = async () => {
      try {
        const result = await chrome.storage.sync.get(["trackingEnabled"]);
        // 기본값은 true (첫 설치시)
        setIsTrackingEnabled(result.trackingEnabled !== false);
      } catch (error) {
        console.error("토글 상태 로드 실패:", error);
      }
    };

    // 사용자 인증 상태 확인 함수 (Google 로그인 여부 체크)
    const checkAuthStatus = async () => {
      try {
        // background.js에서 사용자 세션 정보 가져오기
        const response = await chrome.runtime.sendMessage({
          type: 'GET_USER_SESSION'
        });

        if (response && response.success && response.isAuthenticated) {
          setIsAuthenticated(true);
          setUserInfo(response.userInfo);
          loadToggleState(); // 인증된 경우에만 토글 상태 로드
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("인증 상태 확인 실패:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false); // 로딩 상태 해제
      }
    };

    checkAuthStatus();
  }, []);

  // 컴포넌트 언마운트 시 타임아웃 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (toggleTimeout) {
        clearTimeout(toggleTimeout);
      }
    };
  }, [toggleTimeout]);

  // 로그인 상태 추가
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginStep, setLoginStep] = useState(""); // 로그인 진행 단계

  // Google 로그인 처리 함수 (상태 메시지 최소화)
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError("");

    try {
      console.log("🔄 popup에서 로그인 요청 시작");

      // 메시지 전송 (응답은 Chrome Storage로 처리)
      chrome.runtime.sendMessage({
        type: 'GOOGLE_LOGIN'
      });

      console.log("📤 로그인 요청 전송 완료 - Chrome Storage 이벤트 대기 중");

    } catch (error) {
      console.error("Google 로그인 요청 실패:", error);
      setLoginError("로그인 요청 중 오류가 발생했습니다.");
      setIsLoggingIn(false);
    }
  };

  // 토글 상태 저장 함수 (Chrome Storage + background.js 알림)
  const saveToggleState = async (enabled) => {
    try {
      // Chrome Storage에 설정값 저장
      await chrome.storage.sync.set({ trackingEnabled: enabled });

      // background.js에 토글 상태 변경 알림 (응답 무시)
      try {
        chrome.runtime.sendMessage({
          type: "TOGGLE_TRACKING",
          enabled: enabled
        });
      } catch (messageError) {
        console.warn("토글 메시지 전송 실패 (무시):", messageError);
      }
    } catch (error) {
      console.error("토글 상태 저장 실패:", error);
      throw error;
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      console.log("🔐 로그아웃 요청 시작");

      // 1. background.js에 로그아웃 요청 (응답 대기하지 않음)
      chrome.runtime.sendMessage({
        type: 'LOGOUT'
      }).catch(error => {
        console.warn("메시지 전송 실패 (무시):", error);
      });

      // 2. 짧은 대기 후 Chrome Storage 직접 확인
      setTimeout(async () => {
        try {
          const result = await chrome.storage.local.get(['jwt', 'userInfo']);

          if (!result.jwt && !result.userInfo) {
            // Storage가 비어있으면 로그아웃 성공
            console.log("✅ 로그아웃 성공 - Storage 확인됨");
            setIsAuthenticated(false);
            setUserInfo(null);
          } else {
            console.warn("⚠️ 로그아웃 불완전 - 수동 UI 업데이트");
            // Storage가 아직 있어도 UI는 업데이트 (사용자 경험)
            setIsAuthenticated(false);
            setUserInfo(null);
          }
        } catch (storageError) {
          console.error("Storage 확인 실패:", storageError);
          // 실패해도 UI는 로그아웃 상태로 변경
          setIsAuthenticated(false);
          setUserInfo(null);
        }
      }, 100); // 100ms 후 확인

    } catch (error) {
      console.error("❌ 로그아웃 처리 실패:", error);
      // 모든 것이 실패해도 UI는 로그아웃 상태로 변경
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  // 토글 클릭 핸들러 (1초 쿨다운 + 디바운싱 보호장치 적용)
  const handleToggle = async () => {
    const now = Date.now();
    const TOGGLE_COOLDOWN = 1000; // 1초 쿨다운 시간

    // 1. 처리 중이면 무시 (중복 클릭 방지)
    if (isToggleProcessing) {
      return;
    }

    // 2. 쿨다운 체크 (1초 이내 재클릭 방지)
    if (now - lastToggleTime < TOGGLE_COOLDOWN) {
      return;
    }

    // 3. 기존 타임아웃 클리어 (디바운싱 처리)
    if (toggleTimeout) {
      clearTimeout(toggleTimeout);
    }

    // 처리 중 상태로 설정
    setIsToggleProcessing(true);

    // 4. 디바운싱된 상태 변경 및 저장 (500ms 후 실행)
    const timeout = setTimeout(async () => {
      const newState = !isTrackingEnabled;

      try {
        setIsTrackingEnabled(newState); // UI 상태 변경
        await saveToggleState(newState); // 저장 및 알림
        setLastToggleTime(Date.now()); // 마지막 토글 시간 기록
      } catch (error) {
        console.error("토글 저장 실패:", error);
        // 실패 시 상태 되돌리기 (롤백)
        setIsTrackingEnabled(!newState);
      } finally {
        setIsToggleProcessing(false); // 처리 완료
      }
    }, 500);

    setToggleTimeout(timeout);
  };

  // 로딩 중 화면 (인증 상태 확인 중)
  if (isLoading) {
    return (
      <div className="w-80 h-96 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 미인증 상태: Google 로그인 유도 화면
  if (!isAuthenticated) {
    return (
      <div className="w-80 h-96 bg-white">
        {/* 헤더 */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center space-x-2">
            <div>
              <h1 className="text-lg font-bold">picky</h1>
              <p className="text-sm opacity-90">지능형 지식 동반자</p>
            </div>
          </div>
        </div>

        {/* 로그인 유도 섹션 */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              picky 서비스를 사용하려면<br/>
              Google 계정으로 로그인해주세요
            </p>
          </div>

          {/* 에러 메시지만 표시 (실제 오류 시에만) */}
          {loginError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">❌ {loginError}</p>
            </div>
          )}

          {/* Google 로그인 버튼 */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={`w-full font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors ${
              isLoggingIn
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-500 hover:bg-red-600 text-white"
            }`}
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span className="text-white">로그인 중...</span>
              </>
            ) : (
              <>
                {/* Google 아이콘 */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google로 로그인</span>
              </>
            )}
          </button>

          {/* 간단한 안내 텍스트 */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Google 권한 허가가 필요합니다</p>
          </div>
        </div>
      </div>
    );
  }

  // 인증된 사용자: 메인 토글 페이지
  return (
    <div className="w-80 p-5 font-sans">
      {/* 헤더 섹션 */}
      <div className="text-center mb-5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex-1"></div>
          <h2 className="text-xl font-bold">picky</h2>
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
              title="로그아웃"
            >
              로그아웃
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-600">안녕하세요, {userInfo?.nickname || '사용자'}님!</p>
      </div>

      {/* 데이터 수집 토글 스위치 */}
      <div className="flex items-center justify-between mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {/* 토글 설명 */}
        <div>
          <div className="font-bold text-sm">데이터 수집</div>
          <div className="text-xs text-gray-600 mt-0.5">
            {isToggleProcessing ? (
              <span className="text-blue-600">처리 중...</span>
            ) : (
              <span
                style={{ color: isTrackingEnabled ? "#28a745" : "#dc3545" }}
              >
                {isTrackingEnabled ? "활성화됨" : "비활성화됨"}
              </span>
            )}
          </div>
        </div>

        {/* 토글 스위치 UI */}
        <div
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
            isToggleProcessing
              ? "cursor-not-allowed opacity-50 pointer-events-none"
              : "cursor-pointer hover:opacity-80"
          } ${isTrackingEnabled ? "bg-green-500" : "bg-gray-400"}`}
          onClick={isToggleProcessing ? null : handleToggle}
        >
          {/* 스위치 동그라미 */}
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
              isTrackingEnabled ? "transform translate-x-6" : ""
            } ${isToggleProcessing ? "animate-pulse" : ""}`}
          />
        </div>
      </div>

      {/* 서비스 설명 섹션 */}
      <div className="text-center text-sm text-gray-600">
        <div className="mb-2">
          <span className="font-semibold">웹 활동 기반</span> 개인화 추천 시스템
        </div>
        <div className="text-xs">
          브라우징 데이터를 수집하여 맞춤형 뉴스와 퀴즈를 제공합니다.
        </div>
      </div>
    </div>
  );
}

export default App;