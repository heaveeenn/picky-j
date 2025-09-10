import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Lightbulb, Newspaper, BrainCircuit, Bookmark, ExternalLink } from 'lucide-react';

// -----------------------------------------------------------------------------
// 목업 데이터
// -----------------------------------------------------------------------------
const mockNews = {
  type: 'news',
  category: '기술',
  title: 'AI 기술의 최신 동향과 미래 전망',
  summary:
    '생성형 AI의 등장으로 다양한 산업 분야에 혁신이 발생하고 있습니다. 앞으로 AI는 우리 삶을 어떻게 바꿀까요?',
  source: 'TechNews',
};

const mockQuiz = {
  type: 'quiz',
  category: '웹개발',
  question: "React의 'useState' Hook은 클래스형 컴포넌트에서 사용할 수 있다.",
  answer: 'X',
  explanation: 'useState는 함수형 컴포넌트에서 상태를 관리하기 위한 Hook이다.',
};

const mockFact = {
  type: 'fact',
  category: '재미있는 사실',
  content:
    '문어의 심장은 세 개이다. 두 개는 아가미로 혈액을 보내고, 하나는 몸 전체로 혈액을 보낸다.',
};

const contentData = [mockNews, mockQuiz, mockFact];

// -----------------------------------------------------------------------------
// 유틸: Chrome API가 안전하게 사용 가능한지 확인
// -----------------------------------------------------------------------------
function hasChromeStorage() {
  try {
    return typeof chrome !== 'undefined' && chrome?.storage?.sync;
  } catch (_) {
    return false;
  }
}

// -----------------------------------------------------------------------------
// 컴포넌트
// -----------------------------------------------------------------------------
function Overlay() {
  // 표시 관련 상태
  const [isVisible, setIsVisible] = useState(false); // 캐릭터 표시
  const [isOpen, setIsOpen] = useState(false); // 말풍선 열림
  const [currentContent, setCurrentContent] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);

  // 보조 상태
  const [isExtensionOn, setIsExtensionOn] = useState(true); // 전체 확장 켜짐 여부
  const timerRef = useRef(null);

  // 알림 타이머 설정
  const setupTimer = (intervalInMinutes) => {
    // 기존 타이머 제거
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const minutes = Number(intervalInMinutes) || 30;
    const intervalMs = Math.max(1, minutes) * 60 * 1000;
    timerRef.current = setInterval(() => {
      setHasNotification(true);
      // eslint-disable-next-line no-console
      console.log(`[Picky] notification tick: ${minutes}m`);
    }, intervalMs);
  };

  // 최초 설정 로딩
  useEffect(() => {
    if (!hasChromeStorage()) {
      // 개발 환경 또는 비호환 환경에서는 기본값으로 동작
      setIsExtensionOn(true);
      setIsVisible(true);
      setupTimer(30);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }

    chrome.storage.sync.get(
      ['isExtensionOn', 'isCharacterOn', 'notificationInterval'],
      (settings) => {
        const on = settings.isExtensionOn !== false;
        const charOn = settings.isCharacterOn !== false;
        const interval = settings.notificationInterval || 30;

        setIsExtensionOn(on);
        setIsVisible(on && charOn);
        if (on && charOn) setupTimer(interval);
      }
    );

    // storage 변경 리스너
    const storageListener = (changes, area) => {
      if (area !== 'sync') return;

      // 전체 확장 켜짐/꺼짐
      if (changes.isExtensionOn) {
        const on = changes.isExtensionOn.newValue !== false;
        setIsExtensionOn(on);
        if (!on) {
          setIsVisible(false);
          setIsOpen(false);
          setHasNotification(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }

      // 캐릭터 표시
      if (changes.isCharacterOn) {
        const charOn = changes.isCharacterOn.newValue !== false;
        setIsVisible(isExtensionOn && charOn);
        if (!charOn && timerRef.current) {
          clearInterval(timerRef.current);
        } else if (charOn && isExtensionOn) {
          // 현재 간격을 다시 불러와 타이머 재설정
          chrome.storage.sync.get('notificationInterval', (s) => {
            setupTimer(s.notificationInterval || 30);
          });
        }
      }

      // 알림 간격
      if (changes.notificationInterval) {
        const val = changes.notificationInterval.newValue || 30;
        if (isExtensionOn && isVisible) setupTimer(val);
      }
    };
    chrome.storage.onChanged.addListener(storageListener);

    // content.jsx에서 브로드캐스트하는 라우트 변화 이벤트
    const onRouteChanged = () => {
      // 필요 시 라우팅 변화에 맞춘 상태 초기화나 컨텐츠 갱신을 수행한다.
      // 현재는 팝업만 닫고 알림 뱃지는 유지한다.
      setIsOpen(false);
    };
    // 현재 노드 기준 이벤트 수신
    const container = document.getElementById('picky-overlay-app') || document;
    container.addEventListener('picky:route-changed', onRouteChanged);

    // 정리
    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      container.removeEventListener('picky:route-changed', onRouteChanged);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVisible, isExtensionOn]);

  // 클릭 핸들러
  const handleCharacterClick = () => {
    setIsOpen(true);
    setHasNotification(false);
    setShowAnswer(false);

    const idx = Math.floor(Math.random() * contentData.length);
    setCurrentContent(contentData[idx]);
  };

  const handleClosePopup = () => setIsOpen(false);
  const handleShowAnswer = () => setShowAnswer(true);

  // 전역 표시 조건: 확장 켜짐 && 캐릭터 표시
  const shouldRender = useMemo(() => isExtensionOn && isVisible, [isExtensionOn, isVisible]);
  if (!shouldRender) return null;

  // 렌더링
  return (
    <div
      style={{
        zIndex: 2147483647,
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        pointerEvents: 'auto',
      }}
    >
      {/* 팝업 */}
      {isOpen && currentContent && (
        <div className="w-80 bg-white rounded-lg shadow-2xl mb-2 animate-fade-in-up">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border-b">
            <div className="flex items-center space-x-2">
              {currentContent.type === 'news' && <Newspaper className="w-4 h-4 text-blue-500" />}
              {currentContent.type === 'quiz' && <BrainCircuit className="w-4 h-4 text-green-500" />}
              {currentContent.type === 'fact' && <Lightbulb className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm font-semibold text-gray-700">{currentContent.category}</span>
            </div>
            <button onClick={handleClosePopup} className="p-1 hover:bg-gray-200 rounded-full" aria-label="닫기">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* 본문 */}
          <div className="p-4">
            {currentContent.type === 'news' && (
              <div className="space-y-2">
                <h3 className="font-bold text-gray-800">{currentContent.title}</h3>
                <p className="text-sm text-gray-600">{currentContent.summary}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-gray-400">출처: {currentContent.source}</span>
                  <div>
                    <button className="p-1 hover:bg-gray-100 rounded-full" aria-label="북마크">
                      <Bookmark className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded-full" aria-label="원문">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentContent.type === 'quiz' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">{currentContent.question}</p>
                {!showAnswer ? (
                  <button onClick={handleShowAnswer} className="text-xs text-blue-600 hover:underline">
                    정답 확인하기
                  </button>
                ) : (
                  <div className="p-2 bg-blue-50 rounded-md text-sm">
                    <span className="font-bold text-blue-700">정답: {currentContent.answer}</span>
                    <p className="text-blue-600">{currentContent.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {currentContent.type === 'fact' && <p className="text-sm text-gray-700">{currentContent.content}</p>}
          </div>
        </div>
      )}

      {/* 캐릭터 버튼 */}
      <button
        onClick={handleCharacterClick}
        className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform relative"
        aria-label="Picky 캐릭터 열기"
      >
        {hasNotification && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs animate-bounce">
            !
          </span>
        )}
        <span className="text-3xl" aria-hidden="true">
          🤖
        </span>
      </button>
    </div>
  );
}

export default Overlay;
