import { useState, useEffect } from "react";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);

  // 메시지 전송 헬퍼 함수
  const sendMessage = (message) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          // "message port closed" 오류는 정상적인 상황이므로 로그 출력 안함
          if (!chrome.runtime.lastError.message.includes("message port closed")) {
            console.warn("메시지 전송 오류:", chrome.runtime.lastError.message);
          }
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  };

  // 세션 상태 확인
  const checkAuthStatus = async () => {
    try {
      const response = await sendMessage({ type: 'GET_USER_SESSION' });

      if (response && response.success && response.isAuthenticated) {
        setIsAuthenticated(true);
        setUserInfo(response.userInfo);
        setLoginError("");
      } else {
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    } catch (error) {
      console.error("세션 확인 실패:", error);
      setIsAuthenticated(false);
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 토글 상태 로드
  const loadToggleState = async () => {
    try {
      const result = await chrome.storage.sync.get(["trackingEnabled"]);
      setIsTrackingEnabled(result.trackingEnabled !== false);
    } catch (error) {
      console.error("토글 상태 로드 실패:", error);
    }
  };

  // 컴포넌트 초기화
  useEffect(() => {
    const init = async () => {
      await checkAuthStatus();
      await loadToggleState();
    };
    init();

    // Chrome Storage 변경사항 실시간 감지
    const handleStorageChange = (changes, area) => {
      if (area === 'local') {
        // 로그인 성공 감지
        if (changes.loginSuccess && changes.loginSuccess.newValue) {
          console.log("🔔 Storage에서 로그인 성공 감지!");
          checkAuthStatus();
          // loginSuccess 플래그 제거
          chrome.storage.local.remove(['loginSuccess']);

          // 로그인 대기 중인 콜백 실행
          if (window.loginSuccessCallback) {
            window.loginSuccessCallback();
            window.loginSuccessCallback = null;
          }
        }

        // 사용자 정보 변경 감지
        if (changes.userInfo) {
          console.log("🔔 사용자 정보 변경 감지");
          checkAuthStatus();
        }

        // 로그아웃 감지
        if (changes.jwt && !changes.jwt.newValue && changes.jwt.oldValue) {
          console.log("🔔 로그아웃 감지");
          setIsAuthenticated(false);
          setUserInfo(null);
          setLoginError("");
        }
      }

      if (area === 'sync') {
        // 토글 상태 변경 감지
        if (changes.trackingEnabled) {
          console.log("🔔 토글 상태 변경 감지:", changes.trackingEnabled.newValue);
          setIsTrackingEnabled(changes.trackingEnabled.newValue !== false);
        }
      }
    };

    // Storage 리스너 등록
    chrome.storage.onChanged.addListener(handleStorageChange);

    // cleanup
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Google 로그인
  const handleLogin = async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setLoginError("");

    try {
      // 백그라운드 로그인 시작
      const response = await sendMessage({ type: 'GOOGLE_LOGIN' });

      // 응답이 있고 성공한 경우
      if (response && response.success) {
        console.log("✅ 즉시 로그인 응답 성공");
        setIsAuthenticated(true);
        setUserInfo(response.user);
        setLoginError("");
        await loadToggleState();
        setIsLoggingIn(false);
        return;
      }

      // 응답이 있지만 실패한 경우 - 즉시 오류 표시
      if (response && response.error) {
        console.log("❌ 즉시 로그인 응답 실패:", response.error);
        setLoginError(response.error);
        setIsLoggingIn(false);
        return;
      }

      // 응답이 없거나 port closed - Storage 이벤트를 기다림
      console.log("ℹ️ 로그인 응답 없음, Storage 이벤트 대기 중...");

      // 10초 동안 Storage 변경사항을 기다림
      const loginTimeout = setTimeout(() => {
        console.log("⏰ 로그인 타임아웃");
        setLoginError("로그인 시간이 초과되었습니다. 다시 시도해주세요.");
        setIsLoggingIn(false);
      }, 10000);

      // Storage 이벤트로 성공 감지되면 타임아웃 해제
      const originalLoginSuccess = window.loginSuccessCallback;
      window.loginSuccessCallback = () => {
        console.log("✅ Storage 이벤트로 로그인 성공 감지");
        clearTimeout(loginTimeout);
        setIsLoggingIn(false);
        if (originalLoginSuccess) originalLoginSuccess();
      };

    } catch (error) {
      // message port closed 오류는 정상적인 상황으로 처리
      if (error?.message?.includes("message port closed")) {
        console.log("ℹ️ Message port closed - Storage 이벤트 대기 중...");

        // Storage 이벤트를 10초간 기다림
        const loginTimeout = setTimeout(() => {
          console.log("⏰ 로그인 타임아웃 (port closed)");
          setLoginError("로그인 시간이 초과되었습니다. 다시 시도해주세요.");
          setIsLoggingIn(false);
        }, 10000);

        // Storage 이벤트로 성공 감지되면 타임아웃 해제
        window.loginSuccessCallback = () => {
          console.log("✅ Storage 이벤트로 로그인 성공 감지 (port closed 후)");
          clearTimeout(loginTimeout);
          setIsLoggingIn(false);
        };

      } else {
        // 진짜 오류인 경우
        console.error("로그인 요청 실패:", error);
        setLoginError("로그인 중 오류가 발생했습니다.");
        setIsLoggingIn(false);
      }
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await sendMessage({ type: 'LOGOUT' });
      setIsAuthenticated(false);
      setUserInfo(null);
      setLoginError("");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // 토글 변경
  const handleToggle = async () => {
    try {
      const newState = !isTrackingEnabled;
      await chrome.storage.sync.set({ trackingEnabled: newState });
      setIsTrackingEnabled(newState);

      // 백그라운드에 상태 변경 알림
      await sendMessage({
        type: 'TOGGLE_TRACKING',
        enabled: newState
      });
    } catch (error) {
      console.error("토글 변경 실패:", error);
    }
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="w-80 h-96 bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 안됨
  if (!isAuthenticated) {
    return (
      <div className="w-80 h-96 bg-white">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 text-center">
          <div className="text-2xl font-bold mb-2">🍎 Picky</div>
          <p className="text-sm opacity-90">맞춤형 뉴스 추천 서비스</p>
        </div>

        {/* 로그인 섹션 */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="text-4xl mb-4">🔐</div>
            <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              Picky 서비스를 사용하려면<br/>
              Google 계정으로 로그인해주세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {loginError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">❌ {loginError}</p>
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>로그인 중...</span>
              </>
            ) : (
              <>
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
        </div>
      </div>
    );
  }

  // 로그인됨 - 메인 대시보드
  return (
    <div className="w-80 h-96 bg-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">🍎 Picky</div>
            <p className="text-xs opacity-90">맞춤형 추천 서비스</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 사용자 정보 */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src={userInfo?.picture || '/images/default-profile.png'}
            alt="프로필"
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzQgMzJDMzQgMjYuNSAyNy41IDIyIDIwIDIyQzEyLjUgMjIgNiAyNi41IDYgMzJIMzQiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
            }}
          />
          <div>
            <div className="font-medium text-gray-800">{userInfo?.name || '사용자'}</div>
            <div className="text-sm text-gray-500">{userInfo?.email}</div>
          </div>
        </div>
      </div>

      {/* 토글 설정 */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">데이터 수집</div>
            <div className="text-sm text-gray-500">웹 활동 추적 및 맞춤 추천</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isTrackingEnabled}
              onChange={handleToggle}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      </div>

      {/* 상태 정보 */}
      <div className="p-4 border-t">
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isTrackingEnabled
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isTrackingEnabled ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            {isTrackingEnabled ? '수집 활성화' : '수집 비활성화'}
          </div>
        </div>
      </div>

      {/* 대시보드 링크 */}
      <div className="p-4">
        <button
          onClick={() => chrome.tabs.create({ url: 'http://localhost:5173' })}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
        >
          📊 대시보드 열기
        </button>
      </div>
    </div>
  );
}

export default App;