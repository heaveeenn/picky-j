import React, { useState, forwardRef, useEffect, useCallback, Fragment } from 'react';
import { BookOpen, Settings, Bell, BarChart3, X, LogIn, Check } from 'lucide-react';
import { BACKEND_URL } from '../config/env.js';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as SliderPrimitives from '@radix-ui/react-slider';
import * as CheckboxPrimitives from '@radix-ui/react-checkbox';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* -----------------------------------------------------------------------------
 * 유틸: clsx + tailwind-merge (기존 UI 코드)
 * ---------------------------------------------------------------------------*/
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* -----------------------------------------------------------------------------
 * UI 컴포넌트 (Checkbox, Slider, Switch, Button, Badge) (기존 UI 코드, 변경 없음)
 * ---------------------------------------------------------------------------*/
const Checkbox = forwardRef(({ className, ...props }, ref) => (
  <CheckboxPrimitives.Root
    ref={ref}
    className={cn('peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', className)}
    {...props}
  >
    <CheckboxPrimitives.Indicator className="flex items-center justify-center text-current">
      <Check className="h-4 w-4" />
    </CheckboxPrimitives.Indicator>
  </CheckboxPrimitives.Root>
));
Checkbox.displayName = CheckboxPrimitives.Root.displayName;

const Slider = forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitives.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitives.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitives.Range className="absolute h-full bg-primary" />
    </SliderPrimitives.Track>
    <SliderPrimitives.Thumb
      className={cn('block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50')}
    />
  </SliderPrimitives.Root>
));
Slider.displayName = SliderPrimitives.Root.displayName;

const Switch = forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn('peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input', className)}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn('pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0')}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  const variants = { default: 'bg-primary text-primary-foreground hover:bg-primary/90', destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90', outline: 'border border-input hover:bg-accent hover:text-accent-foreground', secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', ghost: 'hover:bg-accent hover:text-accent-foreground', link: 'underline-offset-4 hover:underline text-primary' };
  const sizes = { default: 'h-10 py-2 px-4', sm: 'h-9 px-3 rounded-md', lg: 'h-11 px-8 rounded-md', icon: 'h-10 w-10' };
  return (<button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>);
};

const Badge = ({ children, variant = 'default', className = '' }) => {
  const base = 'inline-flex items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  const variants = { default: 'bg-primary hover:bg-primary/80 border-transparent text-primary-foreground', secondary: 'bg-secondary hover:bg-secondary/80 border-transparent text-secondary-foreground', destructive: 'bg-destructive hover:bg-destructive/80 border-transparent text-destructive-foreground', outline: 'text-foreground' };
  return <div className={cn(base, variants[variant], className)}>{children}</div>;
};


/* -----------------------------------------------------------------------------
 * App (Popup Root) - [통합됨]
 * ---------------------------------------------------------------------------*/
function App() {
  // --- [통합] 상태 관리: 기존 UI 상태 + 실제 인증 상태 ---
  const [isExtensionOn, setIsExtensionOn] = useState(true);
  const [isCharacterOn, setIsCharacterOn] = useState(true);
  const [notificationInterval, setNotificationInterval] = useState(30);
  
  // --- [추가] 인증 관련 상태 (from extension) ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  // --- [추가] 메시지 전송 헬퍼 (from extension) ---
  const sendMessage = (message) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  };

  // --- [추가] 인증 상태 확인 함수 (from extension) ---
  const checkAuthStatus = async () => {
    const response = await sendMessage({ type: "GET_USER_SESSION" });
    if (response && response.success && response.isAuthenticated) {
      setIsAuthenticated(true);
      setUserInfo(response.userInfo);
    } else {
      setIsAuthenticated(false);
      setUserInfo(null);
    }
  };

  /* ---------------------------------------------------------------------------
   * [통합] 초기 로드: chrome.storage.sync → UI 상태 + 인증 상태
   * -------------------------------------------------------------------------*/
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      // 1. 인증 상태 확인
      await checkAuthStatus();

      // 2. UI 설정 로드
      const settings = await chrome.storage.sync.get(['isExtensionOn', 'isCharacterOn', 'notificationInterval']);
      if (settings) {
        if (typeof settings.isExtensionOn === 'boolean') setIsExtensionOn(settings.isExtensionOn);
        if (typeof settings.isCharacterOn === 'boolean') setIsCharacterOn(settings.isCharacterOn);
        if (typeof settings.notificationInterval === 'number') setNotificationInterval(settings.notificationInterval);
      }
      setIsLoading(false);
    };
    init();

    // Storage 변경사항 실시간 감지
    const handleStorageChange = (changes, area) => {
      if (area === "local" && changes.userInfo) {
        checkAuthStatus();
      }
      if (area === "sync") {
        if (changes.isExtensionOn) setIsExtensionOn(changes.isExtensionOn.newValue);
        if (changes.isCharacterOn) setIsCharacterOn(changes.isCharacterOn.newValue);
        if (changes.notificationInterval) setNotificationInterval(changes.notificationInterval.newValue);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  /* ---------------------------------------------------------------------------
   * [통합] 이벤트 핸들러: 상태 변경 → storage 반영
   * -------------------------------------------------------------------------*/
  const setSync = useCallback((obj) => {
    if (chrome?.storage?.sync) chrome.storage.sync.set(obj);
  }, []);

  const handleToggleExtension = useCallback((checked) => {
    setIsExtensionOn(checked);
    setSync({ isExtensionOn: checked });
  }, [setSync]);

  const handleToggleCharacter = useCallback((checked) => {
    setIsCharacterOn(checked);
    setSync({ isCharacterOn: checked });
  }, [setSync]);

  const handleIntervalChange = useCallback((value) => {
    const clamped = Math.min(120, Math.max(10, Array.isArray(value) ? value[0] : Number(value)));
    setNotificationInterval(clamped);
    setSync({ notificationInterval: clamped });
  }, [setSync]);

  // --- [추가] Google 로그인 핸들러 (from extension) ---
  const handleGoogleLogin = useCallback(async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError("");
    const response = await sendMessage({ type: "GOOGLE_LOGIN" });
    if (response && response.success) {
      await checkAuthStatus(); // 로그인 성공 후 상태 즉시 갱신
    } else {
      setLoginError(response?.error || "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
    setIsLoggingIn(false);
  }, [isLoggingIn]);

  const handleGoToDashboard = useCallback(() => {
    if (chrome?.tabs) chrome.tabs.create({ url: 'http://localhost:5173/' });
  }, []);

  // --- [추가] 프로필 이미지 경로 처리 ---
  const getProfileImageUrl = (path) => {
    if (!path) return ''; // 경로가 없으면 빈 문자열 반환
    if (path.startsWith('http')) return path; // 이미 절대 경로이면 그대로 반환
    return `${BACKEND_URL}${path}`; // 상대 경로이면 BACKEND_URL과 조합
  };

  /* ---------------------------------------------------------------------------
   * [통합] 렌더링
   * -------------------------------------------------------------------------*/
  if (isLoading) {
    return <div className="w-80 h-96 flex items-center justify-center"><p>로딩 중...</p></div>;
  }

  return (
    <div className="w-80 max-w-sm font-sans rounded-lg shadow-lg bg-white">
      {/* 헤더 */}
      <div className="p-4 pb-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span className="font-semibold">Picky 확장프로그램</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1 h-auto" onClick={() => window.close()}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4 space-y-4">
        {/* [변경] 실제 인증 상태에 따라 UI 분기 */}
        {isAuthenticated ? (
          <Fragment>
            {/* 로그인됨 UI */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <img src={getProfileImageUrl(userInfo?.profileImage)} alt="profile" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium">{userInfo?.nickname}님</span>
              </div>
              <Badge className="bg-green-100 text-green-700">로그인됨</Badge>
            </div>

            {/* 확장프로그램 토글 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-medium">확장프로그램 활성화</label>
              </div>
              <Switch checked={isExtensionOn} onCheckedChange={handleToggleExtension} />
            </div>

            {isExtensionOn && (
              <Fragment>
                {/* 캐릭터 표시 토글 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full" />
                    <label className="text-sm font-medium">캐릭터 표시</label>
                  </div>
                  <Switch checked={isCharacterOn} onCheckedChange={handleToggleCharacter} />
                </div>

                {/* 알림 간격 슬라이더 */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <label className="text-sm font-medium">알림 간격</label>
                  </div>
                  <div className="px-2">
                    <Slider value={[notificationInterval]} onValueChange={handleIntervalChange} max={120} min={10} step={10} />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>10분</span>
                      <span className="font-medium text-purple-600">{notificationInterval}분</span>
                      <span>2시간</span>
                    </div>
                  </div>
                </div>
              </Fragment>
            )}

            {/* 대시보드 이동 버튼 */}
            <Button onClick={handleGoToDashboard} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              대시보드 이동
            </Button>
          </Fragment>
        ) : (
          <Fragment>
            {/* 로그인 필요 UI */}
            <div className="text-center w-full">
              <div className="mb-4">
                <div className="text-3xl mb-3">🔐</div>
                <h2 className="text-lg font-bold mb-1">로그인이 필요합니다</h2>
                <p className="text-xs text-gray-500">Picky의 모든 기능을 사용하려면<br/>Google 계정으로 로그인해주세요.</p>
              </div>
              {loginError && <p className="text-red-500 text-xs mb-2">{loginError}</p>}
              <Button size="sm" onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full bg-red-500 hover:bg-red-600 text-white">
                {isLoggingIn ? '로그인 중...' : (
                  <Fragment>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google로 로그인
                  </Fragment>
                )}
              </Button>
            </div>
          </Fragment>
        )}
      </div>
    </div>
  );
}

export default App;
