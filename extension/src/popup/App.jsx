import React, { useState, forwardRef, useEffect, useCallback, Fragment } from 'react';
import { Lightbulb, Settings, Bell, BarChart3, X, LogIn, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { availableCharacters } from '../shimeji-data.js';
import { commonSprites } from '../behaviors.js';
import { DASHBOARD_URL } from '../config/env.js';
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

const OnOffToggleButton = ({ checked, onCheckedChange }) => {
  const handleClick = () => {
    if (onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleClick}
      className={cn(
        'relative inline-flex h-7 w-[70px] flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-1 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        checked ? 'bg-primary/70' : 'bg-gray-200'
      )}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute h-full w-full rounded-full transition-all duration-300'
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute left-1 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out',
          checked ? 'translate-x-[38px]' : 'translate-x-0'
        )}
      />
      <div className="relative z-20 flex w-full justify-around">
        <span className={cn("text-xs font-bold", checked ? "text-white" : "text-transparent")}>ON</span>
        <span className={cn("text-xs font-bold", !checked ? "text-gray-500" : "text-transparent")}>OFF</span>
      </div>
    </button>
  );
};

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
  // 썸네일 이미지 스타일 계산
  const shime1SpritePosition = commonSprites['/shime1.png'];
  const SPRITESHEET_WIDTH = 896; // 스프라이트 시트 전체 너비
  const SPRITESHEET_HEIGHT = 896; // 스프라이트 시트 전체 높이
  const FRAME_SIZE = 128; // 각 프레임(이미지)의 크기
  const DISPLAY_SIZE = 48; // 팝업에 표시될 썸네일 크기
  const SCALE = DISPLAY_SIZE / FRAME_SIZE; // 축소 비율
  const bgSize = `${SPRITESHEET_WIDTH * SCALE}px ${SPRITESHEET_HEIGHT * SCALE}px`;
  const bgPosX = `-${shime1SpritePosition.x * SCALE}px`;
  const bgPosY = `-${shime1SpritePosition.y * SCALE}px`;

  const SMALL_DISPLAY_SIZE = 40;
  const SMALL_SCALE = SMALL_DISPLAY_SIZE / FRAME_SIZE;
  const smallBgSize = `${SPRITESHEET_WIDTH * SMALL_SCALE}px ${SPRITESHEET_HEIGHT * SMALL_SCALE}px`;
  const smallBgPosX = `-${shime1SpritePosition.x * SMALL_SCALE}px`;
  const smallBgPosY = `-${shime1SpritePosition.y * SMALL_SCALE}px`;

  const [isExtensionOn, setIsExtensionOn] = useState(true);
  const [isCharacterOn, setIsCharacterOn] = useState(true);
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState('blank-guy');
  const [notificationItems, setNotificationItems] = useState({
    news: true,
    quiz: true,
    fact: true,
  });
  const [notificationInterval, setNotificationInterval] = useState(30);
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0);
  const characterList = Object.values(availableCharacters);
  
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
      // 1. 인증 상태를 먼저 확인합니다.
      await checkAuthStatus();

      // 2. chrome.storage.sync에서 직접 값을 읽어와 UI를 즉시 초기화합니다.
      const localSettings = await chrome.storage.sync.get([
        'isExtensionOn',
        'isCharacterOn',
        'isNotificationsOn',
        'notificationItems',
        'notificationInterval',
        'selectedCharacter'
      ]);

      if (localSettings) {
        if (typeof localSettings.isExtensionOn === 'boolean') setIsExtensionOn(localSettings.isExtensionOn);
        if (typeof localSettings.isCharacterOn === 'boolean') setIsCharacterOn(localSettings.isCharacterOn);
        if (typeof localSettings.isNotificationsOn === 'boolean') setIsNotificationsOn(localSettings.isNotificationsOn);
        if (localSettings.notificationItems) setNotificationItems(localSettings.notificationItems);
        if (typeof localSettings.notificationInterval === 'number') setNotificationInterval(localSettings.notificationInterval);
        if (localSettings.selectedCharacter) setSelectedCharacter(localSettings.selectedCharacter);
      }

      // 3. 백그라운드에서 백엔드와 동기화를 시도합니다. (UI는 이미 로드됨)
      // 이 결과는 onChanged 리스너에 의해 처리되어 UI가 최신 상태로 유지됩니다.
      sendMessage({ type: "GET_USER_SETTINGS" });

      setIsLoading(false);
    };
    init();

    // background.js가 백엔드 통신 후 chrome.storage.sync를 업데이트하면,
    // 이 리스너가 변경을 감지하여 UI를 실시간으로 다시 렌더링합니다.
    // 이를 통해 UI와 데이터의 일관성을 유지합니다.
    const handleStorageChange = (changes, area) => {
      if (area === "local") {
        // 로그인 성공 감지
        if (changes.loginSuccess && changes.loginSuccess.newValue) {
          console.log("🔔 Storage에서 로그인 성공 감지!");
          checkAuthStatus();
          // [FIX] 로그인 직후 최신 설정을 불러와 UI에 반영
          sendMessage({ type: "GET_USER_SETTINGS" });
          // loginSuccess 플래그 제거
          chrome.storage.local.remove(["loginSuccess"]);

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
      }
      if (area === "sync") {
        if (changes.isExtensionOn) setIsExtensionOn(changes.isExtensionOn.newValue);
        if (changes.isCharacterOn) setIsCharacterOn(changes.isCharacterOn.newValue);
        if (changes.isNotificationsOn) setIsNotificationsOn(changes.isNotificationsOn.newValue);
        if (changes.notificationItems) setNotificationItems(changes.notificationItems.newValue);
        if (changes.notificationInterval) setNotificationInterval(changes.notificationInterval.newValue);
        if (changes.selectedCharacter) setSelectedCharacter(changes.selectedCharacter.newValue);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    const currentIndex = characterList.findIndex(c => c.id === selectedCharacter);
    if (currentIndex !== -1) {
      setCurrentCharacterIndex(currentIndex);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCharacter]);

  /* ---------------------------------------------------------------------------
   * [통합] 이벤트 핸들러: 상태 변경 → storage 반영
   * -------------------------------------------------------------------------*/
  // [수정] 설정 변경 시 background.js에 메시지를 보내는 동시에 chrome.storage.sync에도 직접 저장합니다.
  const handleSettingChange = (setting) => {
    // 1. UI의 즉각적인 반응을 위해 chrome.storage.sync에 직접 저장
    chrome.storage.sync.set(setting);
    // 2. 백엔드 동기화를 위해 background.js에 메시지 전송
    sendMessage({ type: "UPDATE_USER_SETTINGS", settings: setting });
  };

  const handleToggleExtension = useCallback((checked) => {
    // 확장 프로그램 전체 활성화/비활성화는 클라이언트(chrome.storage)에만 저장되는 설정입니다.
    setIsExtensionOn(checked);
    if (chrome?.storage?.sync) chrome.storage.sync.set({ isExtensionOn: checked });
  }, []);

  const handleToggleCharacter = useCallback((checked) => {
    // UI 상태를 즉시 업데이트하여 사용자에게 빠른 피드백을 제공합니다.
    setIsCharacterOn(checked);
    // background.js에 변경된 'isCharacterOn' 값만 전달합니다.
    handleSettingChange({ isCharacterOn: checked });
  }, []);

  const handleCharacterChange = useCallback((characterId) => {
    setSelectedCharacter(characterId);
    handleSettingChange({ selectedCharacter: characterId });
  }, []);

  const handlePrevCharacter = useCallback(() => {
    const newIndex = (currentCharacterIndex - 1 + characterList.length) % characterList.length;
    handleCharacterChange(characterList[newIndex].id);
  }, [currentCharacterIndex, characterList, handleCharacterChange]);

  const handleNextCharacter = useCallback(() => {
    const newIndex = (currentCharacterIndex + 1) % characterList.length;
    handleCharacterChange(characterList[newIndex].id);
  }, [currentCharacterIndex, characterList, handleCharacterChange]);

  const handleToggleNotifications = useCallback((checked) => {
    setIsNotificationsOn(checked);
    handleSettingChange({ isNotificationsOn: checked });
  }, []);

  const handleToggleNotificationItem = useCallback((item) => {
    const newItems = { ...notificationItems, [item]: !notificationItems[item] };
    setNotificationItems(newItems);
    handleSettingChange({ notificationItems: newItems });
  }, [notificationItems]);

  const handleIntervalChange = useCallback((value) => {
    const clamped = Math.min(120, Math.max(10, Array.isArray(value) ? value[0] : Number(value)));
    setNotificationInterval(clamped);
    // [수정] 슬라이더 값을 변경할 때 즉시 저장하도록 변경
    handleSettingChange({ notificationInterval: clamped });
  }, []);

  // --- [추가] Google 로그인 핸들러 (from extension) ---
  const handleGoogleLogin = useCallback(async () => {
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await sendMessage({ type: "GOOGLE_LOGIN" });

      if (response && response.success) {
        console.log("✅ 즉시 로그인 응답 성공");
        setIsAuthenticated(true);
        setUserInfo(response.user);
        setLoginError("");
        // [FIX] 로그인 직후 최신 설정을 불러와 UI에 반영
        await sendMessage({ type: "GET_USER_SETTINGS" });
        setIsLoggingIn(false);
        return;
      }

      if (response && response.error) {
        console.log("❌ 즉시 로그인 응답 실패:", response.error);
        setLoginError(response.error);
        setIsLoggingIn(false);
        return;
      }

      console.log("ℹ️ 로그인 응답 없음, Storage 이벤트 대기 중...");

      const loginTimeout = setTimeout(() => {
        console.log("⏰ 로그인 타임아웃");
        setLoginError("로그인 시간이 초과되었습니다. 다시 시도해주세요.");
        setIsLoggingIn(false);
      }, 10000);

      const originalLoginSuccess = window.loginSuccessCallback;
      window.loginSuccessCallback = () => {
        console.log("✅ Storage 이벤트로 로그인 성공 감지");
        clearTimeout(loginTimeout);
        setIsLoggingIn(false);
        if (originalLoginSuccess) originalLoginSuccess();
      };
    } catch (error) {
      if (error?.message?.includes("message port closed")) {
        console.log("ℹ️ Message port closed - Storage 이벤트 대기 중...");

        const loginTimeout = setTimeout(() => {
          console.log("⏰ 로그인 타임아웃 (port closed)");
          setLoginError("로그인 시간이 초과되었습니다. 다시 시도해주세요.");
          setIsLoggingIn(false);
        }, 10000);

        window.loginSuccessCallback = () => {
          console.log("✅ Storage 이벤트로 로그인 성공 감지 (port closed 후)");
          clearTimeout(loginTimeout);
          setIsLoggingIn(false);
        };
      } else {
        console.error("로그인 요청 실패:", error);
        setLoginError("로그인 중 오류가 발생했습니다.");
        setIsLoggingIn(false);
      }
    }
  }, [isLoggingIn, sendMessage, checkAuthStatus]);

  const handleGoToDashboard = useCallback(() => {
    if (chrome?.tabs) chrome.tabs.create({ url: DASHBOARD_URL });
  }, []);

  /* ---------------------------------------------------------------------------
   * [통합] 렌더링
   * -------------------------------------------------------------------------*/
  if (isLoading) {
    return <div className="w-80 h-96 flex items-center justify-center"><p>로딩 중...</p></div>;
  }

  const prevIndex = (currentCharacterIndex - 1 + characterList.length) % characterList.length;
  const nextIndex = (currentCharacterIndex + 1) % characterList.length;
  const prevChar = characterList[prevIndex];
  const currentChar = characterList[currentCharacterIndex];
  const nextChar = characterList[nextIndex];

  return (
    <div className="w-80 max-w-sm font-sans rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-primary text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-lg">PICKY</span>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1 h-auto" onClick={() => window.close()}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4 space-y-4 bg-white">
        {/* [변경] 실제 인증 상태에 따라 UI 분기 */}
        {isAuthenticated ? (
          <Fragment>
            {/* 로그인됨 UI */}
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <img src={userInfo?.profileImage} alt="profile" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium">{userInfo?.nickname}님</span>
              </div>
            </div>

            {/* 확장프로그램 토글 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium">확장프로그램</label>
              </div>
              <OnOffToggleButton checked={isExtensionOn} onCheckedChange={handleToggleExtension} />
            </div>

            {isExtensionOn && (
              <Fragment>
                {/* 캐릭터 표시 토글 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-primary rounded-full" />
                    <label className="text-sm font-medium">캐릭터</label>
                  </div>
                  <OnOffToggleButton checked={isCharacterOn} onCheckedChange={handleToggleCharacter} />
                </div>

                {isCharacterOn && (
                  <div className="pl-6 space-y-2 border-l-2 border-gray-100">
                    <div className="flex items-center justify-between">
                      <Button onClick={handlePrevCharacter} variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      
                      <div className="flex items-center justify-around flex-grow px-1">
                        {/* Prev */}
                        <button
                          onClick={() => handleCharacterChange(prevChar.id)}
                          className="flex flex-col items-center p-1 rounded-md transition-all opacity-60 hover:opacity-100"
                        >
                          <div
                            className="w-10 h-10 bg-no-repeat"
                            style={{
                              backgroundImage: `url(${chrome.runtime.getURL(prevChar.spritesheet.replace(/^\//, ''))})`,
                              backgroundSize: smallBgSize,
                              backgroundPosition: `${smallBgPosX} ${smallBgPosY}`,
                            }}
                          />
                        </button>

                        {/* Current */}
                        <div className="flex flex-col items-center p-2 rounded-md border-2 border-primary bg-primary/10">
                          <div
                            className="w-12 h-12 bg-no-repeat"
                            style={{
                              backgroundImage: `url(${chrome.runtime.getURL(currentChar.spritesheet.replace(/^\//, ''))})`,
                              backgroundSize: bgSize,
                              backgroundPosition: `${bgPosX} ${bgPosY}`,
                            }}
                          />
                          <span className="text-xs mt-1">{currentChar.metadata.shimejiName}</span>
                        </div>

                        {/* Next */}
                        <button
                          onClick={() => handleCharacterChange(nextChar.id)}
                          className="flex flex-col items-center p-1 rounded-md transition-all opacity-60 hover:opacity-100"
                        >
                          <div
                            className="w-10 h-10 bg-no-repeat"
                            style={{
                              backgroundImage: `url(${chrome.runtime.getURL(nextChar.spritesheet.replace(/^\//, ''))})`,
                              backgroundSize: smallBgSize,
                              backgroundPosition: `${smallBgPosX} ${smallBgPosY}`,
                            }}
                          />
                        </button>
                      </div>

                      <Button onClick={handleNextCharacter} variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* 알림 토글 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium">알림</label>
                  </div>
                  <OnOffToggleButton checked={isNotificationsOn} onCheckedChange={handleToggleNotifications} />
                </div>

                {/* 알림 항목 및 간격 */}
                {isNotificationsOn && (
                  <div className="pl-6 space-y-4 border-l-2 border-gray-100">
                    <div className="flex rounded-md border border-gray-300">
                      <Button
                        onClick={() => handleToggleNotificationItem('news')}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1 h-8 rounded-none rounded-l-md focus:ring-0",
                          "border-r border-gray-300",
                          notificationItems.news ? "bg-primary/20 text-[#0083b0]" : "bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        뉴스
                      </Button>
                      <Button
                        onClick={() => handleToggleNotificationItem('quiz')}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1 h-8 rounded-none focus:ring-0",
                          "border-r border-gray-300",
                          notificationItems.quiz ? "bg-primary/20 text-[#0083b0]" : "bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        퀴즈
                      </Button>
                      <Button
                        onClick={() => handleToggleNotificationItem('fact')}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex-1 h-8 rounded-none rounded-r-md focus:ring-0",
                          notificationItems.fact ? "bg-primary/20 text-[#0083b0]" : "bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        상식
                      </Button>
                    </div>
                    
                    <div>
                      <div className="px-1 pt-2">
                        <Slider value={[notificationInterval]} onValueChange={handleIntervalChange} max={120} min={10} step={10} />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>10분</span>
                          <span className="font-medium text-primary">{notificationInterval}분</span>
                          <span>2시간</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            )}

            {/* 대시보드 이동 버튼 */}
            <Button onClick={handleGoToDashboard} className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              대시보드
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
              <Button size="sm" onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full">
                {isLoggingIn ? '로그인 중...' : (
                  <Fragment>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><g fill="none" fillRule="evenodd"><path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7777 2.7218v2.2591h2.9087c1.7018-1.5668 2.6836-3.8736 2.6836-6.6218z" fill="#4285F4"></path><path d="M9 18c2.43 0 4.4718-.7964 5.9636-2.1818l-2.9087-2.2591c-.8059.54-1.8368.8618-3.0549.8618-2.345 0-4.3286-1.5818-5.0359-3.7118H.9573v2.3318C2.7459 16.2882 5.62 18 9 18z" fill="#34A853"></path><path d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1736 0 7.5477 0 9c0 1.4523.3477 2.8264.9573 4.0418L3.9641 10.71z" fill="#FBBC05"></path><path d="M9 3.5727c1.3214 0 2.5077.4545 3.4405 1.3455l2.5818-2.5818C13.4636.8918 11.43 0 9 0 5.62 0 2.7459 1.7118.9573 4.29L3.9641 6.6218c.7073-2.13 2.6909-3.7118 5.0359-3.7118z" fill="#EA4335"></path></g></svg>
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
