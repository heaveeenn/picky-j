import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink, Bookmark, Lightbulb, X } from 'lucide-react';

// -----------------------------------------------------------------------------
// 목업 데이터
// -----------------------------------------------------------------------------
const mockNotificationsData = [
  {
    id: 1,
    type: 'news',
    title: "AI 혁신이 가져올 미래 변화",
    summary: "생성형 AI 기술이 산업 전반에 미치는 영향과 앞으로의 전망을 분석합니다. 특히 창작, 교육, 의료 분야에서의 활용 사례가 주목받고 있습니다.",
    category: "기술",
    source: "TechDaily",
    isScraped: false
  },
  {
    id: 2,
    type: 'quiz',
    question: "CSS Flexbox에서 justify-content: space-between은 아이템들 사이에 동일한 간격을 만든다.",
    answer: true,
    explanation: "맞습니다. justify-content: space-between은 첫 번째와 마지막 아이템을 컨테이너 끝에 배치하고, 나머지 아이템들 사이에 동일한 간격을 만듭니다.",
    category: "웹개발",
    difficulty: "중급",
    isScraped: false
  },
  {
    id: 3,
    type: 'fact',
    fact: "펭귄은 무릎이 있습니다",
    description: "펭귄의 다리는 몸 안쪽에 숨겨져 있어서 보이지 않지만, 실제로는 인간과 마찬가지로 허벅지, 무릎, 정강이를 모두 가지고 있습니다. 짧은 다리처럼 보이는 것은 발목부터 발가락까지만 보이기 때문입니다.",
    source: "동물학 백과사전"
  },
  {
    id: 4,
    type: 'fact',
    fact: "문어는 심장이 세 개입니다",
    description: "문어는 두 개의 아가미 심장과 하나의 전신 심장을 가지고 있습니다. 아가미 심장은 아가미로 피를 보내고, 전신 심장은 몸 전체로 피를 순환시킵니다.",
    source: "해양생물학 연구소"
  },
  {
    id: 5,
    type: 'fact',
    fact: "꿀벌은 춤으로 의사소통합니다",
    description: "꿀벌은 '왜글 댄스'라는 특별한 춤을 통해 동료들에게 꽃의 위치와 거리를 알려줍니다. 춤의 각도는 태양을 기준으로 한 방향을, 춤의 지속시간은 거리를 나타냅니다.",
    source: "곤충학 연구"
  },
  {
    id: 6,
    type: 'fact',
    fact: "바나나는 베리류입니다",
    description: "식물학적으로 바나나는 베리(장과)에 속합니다. 반면 딸기는 베리가 아니라 '가짜 열매'입니다. 베리의 정의는 하나의 꽃에서 나온 과육으로 둘러싸인 씨를 가진 과일이기 때문입니다.",
    source: "식물학 연구소"
  },
  {
    id: 7,
    type: 'fact',
    fact: "새우의 심장은 머리에 있습니다",
    description: "새우의 심장은 머리 부분에 위치해 있습니다. 또한 새우는 혈액이 파란색인데, 이는 헤모글로빈 대신 구리를 포함한 헤모시아닌이라는 단백질 때문입니다.",
    source: "해양생물학 연구"
  },
  {
    id: 8,
    type: 'fact',
    fact: "코알라는 하루에 22시간을 잡니다",
    description: "코알라는 포유동물 중에서 가장 많이 자는 동물입니다. 유칼립투스 잎만 먹는데 이 잎은 독성이 있고 영양가가 낮아서 소화하는데 많은 에너지가 필요하기 때문입니다.",
    source: "동물행동학 연구소"
  }
];


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
  const [isPopupOpen, setIsPopupOpen] = useState(false); // 말풍선 열림
  const [hasNotification, setHasNotification] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [notifications, setNotifications] = useState(mockNotificationsData);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // 보조 상태
  const [isExtensionOn, setIsExtensionOn] = useState(true); // 전체 확장 켜짐 여부
  const timerRef = useRef(null);

  // 알림 타이머 설정
  const setupTimer = (intervalInMinutes) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const minutes = Number(intervalInMinutes) || 30;
    // const intervalMs = Math.max(1, minutes) * 60 * 1000;
    const intervalMs = 5000; // 개발 테스트용 5초

    timerRef.current = setInterval(() => {
      setHasNotification(true);
      console.log(`[Picky] notification tick: ${minutes}m`);
    }, intervalMs);
  };

  // 최초 설정 로딩 및 리스너 설정
  useEffect(() => {
    if (!hasChromeStorage()) {
      setIsExtensionOn(true);
      setIsVisible(true);
      setupTimer(0.5); // 개발용 30초
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

    const storageListener = (changes, area) => {
      if (area !== 'sync') return;

      // 전체 확장 켜짐/꺼짐
      if (changes.isExtensionOn) {
        const on = changes.isExtensionOn.newValue !== false;
        setIsExtensionOn(on);
        if (!on) {
          setIsVisible(false);
          setIsPopupOpen(false);
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

    const onRouteChanged = () => setIsPopupOpen(false);
    const container = document.getElementById('picky-overlay-app') || document;
    container.addEventListener('picky:route-changed', onRouteChanged);

    return () => {
      chrome.storage.onChanged.removeListener(storageListener);
      container.removeEventListener('picky:route-changed', onRouteChanged);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleCharacterClick = () => {
    const randomIndex = Math.floor(Math.random() * notifications.length);
    setCurrentContent(notifications[randomIndex]);
    setIsPopupOpen(true);
    setHasNotification(false);
    setQuizAnswer(null);
    setShowQuizResult(false);
  };

  const handleScrap = (id) => {
    const newNotifications = notifications.map(notif =>
      notif.id === id ? { ...notif, isScraped: !notif.isScraped } : notif
    );
    setNotifications(newNotifications);
    if (currentContent && currentContent.id === id) {
      setCurrentContent(prev => ({ ...prev, isScraped: !prev.isScraped }));
    }
  };

  const handleQuizAnswer = (answer) => {
    setQuizAnswer(answer);
    setShowQuizResult(true);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case '기술': return 'bg-purple-100 text-purple-700';
      case '웹개발': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case '초급': return 'bg-green-100 text-green-700';
      case '중급': return 'bg-yellow-100 text-yellow-700';
      case '고급': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const shouldRender = useMemo(() => isExtensionOn && isVisible, [isExtensionOn, isVisible]);
  if (!shouldRender) return null;

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
      {/* 캐릭터 아이콘 */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <div
            className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
            onClick={handleCharacterClick}
          >
            <div className="text-white text-2xl">🤖</div>
          </div>

          {hasNotification && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
        </div>
      </div>

      {/* 말풍선 팝업 */}
      {isPopupOpen && currentContent && (
        <div className="fixed bottom-24 right-6 z-50 w-80">
          <div className="border-0 shadow-xl bg-white rounded-lg">
            <div className="p-0">
              {/* 헤더 */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <div className="flex items-center space-x-2">
                  <div className="text-lg">🤖</div>
                  <span className="font-medium">Picky가 추천해요!</span>
                </div>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="text-white hover:bg-white/20 p-1 h-auto rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 콘텐츠 */}
              <div className="p-4">
                {currentContent.type === 'news' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getCategoryColor(currentContent.category)}`}>
                        {currentContent.category}
                      </div>
                      <span className="text-xs text-gray-500">{currentContent.source}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{currentContent.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{currentContent.summary}</p>
                    <div className="flex space-x-2">
                      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 flex-1 bg-purple-600 text-white hover:bg-purple-700">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        자세히 보기
                      </button>
                      <button
                        onClick={() => handleScrap(currentContent.id)}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9 ${currentContent.isScraped ? 'text-amber-600 border-amber-200' : ''}`}
                      >
                        <Bookmark className={`w-3 h-3 ${currentContent.isScraped ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}

                {currentContent.type === 'quiz' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getCategoryColor(currentContent.category)}`}>
                        {currentContent.category}
                      </div>
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${getDifficultyColor(currentContent.difficulty)}`}>
                        {currentContent.difficulty}
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900">{currentContent.question}</h3>
                    {!showQuizResult ? (
                      <div className="flex justify-center space-x-4">
                        <button onClick={() => handleQuizAnswer(true)} className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-16 h-16 rounded-full bg-green-100 hover:bg-green-200 text-green-700 text-xl font-bold">O</button>
                        <button onClick={() => handleQuizAnswer(false)} className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-16 h-16 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xl font-bold">X</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className={`flex items-center justify-center space-x-2 p-2 rounded-lg ${quizAnswer === currentContent.answer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {quizAnswer === currentContent.answer ? (<><CheckCircle className="w-5 h-5" /><span>정답!</span></>) : (<><XCircle className="w-5 h-5" /><span>오답</span></>)}
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">{currentContent.explanation}</p>
                        </div>
                        <button onClick={() => handleScrap(currentContent.id)} className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full ${currentContent.isScraped ? 'text-amber-600 border-amber-200' : ''}`}>
                          <Bookmark className={`w-3 h-3 mr-1 ${currentContent.isScraped ? 'fill-current' : ''}`} />
                          스크랩
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentContent.type === 'fact' && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-700">오늘의 재미있는 사실</span>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="font-semibold text-yellow-900 mb-2">💡 {currentContent.fact}</p>
                      <p className="text-yellow-800 text-sm">{currentContent.description}</p>
                    </div>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 w-full">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      출처 보기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 말풍선 꼬리 */}
          <div className="absolute bottom-0 right-8 transform translate-y-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overlay;
