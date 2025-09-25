import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { CheckCircle, XCircle, Trophy, Target, Flame, Bookmark, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import api from '../lib/api';

const QuizTab = () => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizData, setQuizData] = useState([]); // Initialize with empty array
  const COOLDOWN_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  const [lastQuizFetchTime, setLastQuizFetchTime] = useState(() => {
    const storedTime = localStorage.getItem('lastQuizFetchTime');
    return storedTime ? parseInt(storedTime, 10) : 0;
  });
  const [isQuizCooldown, setIsQuizCooldown] = useState(() => {
    const storedTime = localStorage.getItem('lastQuizFetchTime');
    if (storedTime) {
      const now = Date.now();
      return (now - parseInt(storedTime, 10)) < COOLDOWN_DURATION;
    }
    return false;
  });
  const [remainingTime, setRemainingTime] = useState(0); // New state for countdown
  const lastQuizFetchTimeRef = useRef(lastQuizFetchTime);

  useEffect(() => {
    lastQuizFetchTimeRef.current = lastQuizFetchTime;
  }, [lastQuizFetchTime]);

  useEffect(() => {
    let timer;
    if (isQuizCooldown) {
      const storedTime = parseInt(localStorage.getItem('lastQuizFetchTime') || '0', 10);
      const endTime = storedTime + COOLDOWN_DURATION;

      const updateRemainingTime = () => {
        const now = Date.now();
        const newRemaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setRemainingTime(newRemaining);

        if (newRemaining === 0) {
          setIsQuizCooldown(false);
          localStorage.removeItem('lastQuizFetchTime');
          clearInterval(timer);
        }
      };

      updateRemainingTime(); // Initial call
      timer = setInterval(updateRemainingTime, 1000);
    } else {
      setRemainingTime(0);
    }

    return () => clearInterval(timer);
  }, [isQuizCooldown, lastQuizFetchTime, COOLDOWN_DURATION]);

  const fetchNewQuizzes = useCallback(async () => {
    const now = Date.now();
    const storedLastFetchTime = parseInt(localStorage.getItem('lastQuizFetchTime') || '0', 10);

    if (now - storedLastFetchTime < COOLDOWN_DURATION) {
      setIsQuizCooldown(true);
      setTimeout(() => {
        setIsQuizCooldown(false);
        localStorage.removeItem('lastQuizFetchTime'); // Clear cooldown from storage
      }, COOLDOWN_DURATION - (now - storedLastFetchTime));
      return;
    }

    try {
      setLoading(true);
      const quizResponse = await api.get('/api/quizzes/recommended');
      const fetchedQuizzes = quizResponse.data.data.content;
      if (fetchedQuizzes && fetchedQuizzes.length > 0) {
        setQuizData(fetchedQuizzes);
        setLastQuizFetchTime(now);
        localStorage.setItem('lastQuizFetchTime', now.toString()); // Save to localStorage
        setIsQuizCooldown(true);
        setTimeout(() => {
          setIsQuizCooldown(false);
          localStorage.removeItem('lastQuizFetchTime'); // Clear cooldown from storage
        }, COOLDOWN_DURATION);
      } else {
        setQuizData([]);
        // If no quizzes are fetched, still start cooldown to prevent hammering the API
        setLastQuizFetchTime(now);
        localStorage.setItem('lastQuizFetchTime', now.toString()); // Save to localStorage
        setIsQuizCooldown(true);
        setTimeout(() => {
          setIsQuizCooldown(false);
          localStorage.removeItem('lastQuizFetchTime'); // Clear cooldown from storage
        }, COOLDOWN_DURATION);
      }
    } catch (err) {
      console.error("퀴즈를 가져오는 데 실패했습니다.", err);
      setError("퀴즈를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);
  const [scrapedQuizIds, setScrapedQuizIds] = useState(new Set());
  const [quizIdToScrapIdMap, setQuizIdToScrapIdMap] = useState(new Map());
  const [quizStarted, setQuizStarted] = useState(false); // New state for quiz start status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizStats, setQuizStats] = useState({
    totalQuizzes: 0,
    correctRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    weeklyProgress: []
  });

  useEffect(() => {
    const fetchQuizStats = async () => {
      try {
        const response = await api.get('/api/dashboard/quiz/stats');
        if (response.data && response.data.data) {
          const stats = response.data.data;
          setQuizStats({
            totalQuizzes: stats.totalQuizAttempts,
            correctRate: stats.accuracyRate,
            currentStreak: stats.currentStreak,
            bestStreak: stats.maxStreak,
            weeklyProgress: response.data.data.weeklyProgress || []
          });
        }
      } catch (err) {
        console.error("퀴즈 통계를 가져오는 데 실패했습니다.", err);
      }
    };
    fetchQuizStats();
  }, []);

  useEffect(() => {
    if (!quizStarted) return; // Only fetch if quiz has started

    const fetchQuizAndScrapStatus = async () => {
      setLoading(true);
      try {
        await fetchNewQuizzes();

        // Fetch initial scrap status
        const scrapResponse = await api.get(`/api/scraps?type=QUIZ`);
        if (scrapResponse.data && scrapResponse.data.data && scrapResponse.data.data.content) {
          const initialScrapedIds = new Set();
          const initialQuizIdToScrapIdMap = new Map();
          scrapResponse.data.data.content.forEach(scrap => {
            if (scrap.contentType === 'QUIZ') {
              initialScrapedIds.add(scrap.contentId);
              initialQuizIdToScrapIdMap.set(scrap.contentId, scrap.scrapId);
            }
          });
          setScrapedQuizIds(initialScrapedIds);
          setQuizIdToScrapIdMap(initialQuizIdToScrapIdMap);
        }
      } catch (err) {
        console.error("퀴즈 및 스크랩 상태를 가져오는 데 실패했습니다.", err);
        setError("퀴즈를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndScrapStatus();
  }, [fetchNewQuizzes, quizStarted]); // Add quizStarted to dependencies

  const currentQuiz = quizData[currentQuizIndex];

  const handleAnswer = async (answer) => {
    if (!currentQuiz) {
      console.warn("No current quiz to answer.");
      return;
    }
    setSelectedAnswer(answer);
    
    try {
      const response = await api.post(`/api/quizzes/${currentQuiz.quizId}/answer`, { userAnswer: answer });
      setQuizResult(response.data.data);
      setShowExplanation(true);
    } catch (error) {
      console.error("퀴즈 답변 제출에 실패했습니다.", error);
    }
  };

  const nextQuiz = useCallback(() => {
    if (currentQuizIndex < quizData.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // All quizzes in the current batch are completed. Try to fetch new quizzes.
      fetchNewQuizzes();
    }
  }, [currentQuizIndex, quizData, setCurrentQuizIndex, setSelectedAnswer, setShowExplanation, fetchNewQuizzes]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };


  const handleScrapToggle = async (quizId) => {
    if (!quizId) {
      console.error("handleScrapToggle called with invalid quizId:", quizId);
      return;
    }
    try {
      const response = await api.post('/api/scraps/toggle', { contentType: 'QUIZ', contentId: quizId });
      const { message, data } = response.data;

      if (message === "스크랩 저장 성공") { // Assuming backend sends this message for successful save
        setScrapedQuizIds(prev => new Set(prev.add(quizId)));
        setQuizIdToScrapIdMap(prev => new Map(prev.set(quizId, data.scrapId))); // Assuming data contains scrapId
      } else if (message === "스크랩 취소 성공") { // Assuming backend sends this message for successful delete
        setScrapedQuizIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(quizId);
          return newSet;
        });
        setQuizIdToScrapIdMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(quizId);
          return newMap;
        });
      }
    } catch (error) {
      console.error(`스크랩 토글 실패: ${quizId}`, error);
    }
  };

  const formatRemainingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}분 ${secs}초`;
  };

  return (
    <div className="space-y-6">
      {/* 퀴즈 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Box className="text-center p-4">
          <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-700">{quizStats.totalQuizzes}</p>
          <p className="text-sm text-purple-600">총 참여 퀴즈</p>
        </Box>
        
        <Box className="text-center p-4">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-700">{Math.floor(quizStats.correctRate)}%</p>
          <p className="text-sm text-green-600">정답률</p>
        </Box>
        
        <Box className="text-center p-4">
          <Flame className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-orange-700">{quizStats.currentStreak}</p>
          <p className="text-sm text-orange-600">연속 정답</p>
        </Box>
        
        <Box className="text-center p-4">
          <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-700">{quizStats.bestStreak}</p>
          <p className="text-sm text-blue-600">최고 연속 정답</p>
        </Box>
      </div>

      {!quizStarted ? (
        <Box className="p-6 text-center text-gray-500">
          <p className="mb-4 text-lg font-semibold">새로운 퀴즈를 시작해 보세요!</p>
          <Button variant="primary" onClick={handleStartQuiz} disabled={isQuizCooldown}>
            {isQuizCooldown ? '쿨다운 중...' : '퀴즈 시작하기'}
          </Button>
          {isQuizCooldown && (
            <p className="mt-2 text-sm text-gray-600">다음 퀴즈는 잠시 후에 준비됩니다. ({formatRemainingTime(remainingTime)})</p>
          )}
        </Box>
      ) : loading ? (
        <Box className="p-6 text-center text-gray-500">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>퀴즈를 불러오는 중...</p>
        </Box>
      ) : error ? (
        <Box className="p-6 text-center text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>퀴즈를 불러오는 데 실패했습니다.</p>
        </Box>
      ) : currentQuiz ? (
        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">오늘의 퀴즈</h3>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Badge>{currentQuiz.title}</Badge>
              <Button variant="ghost" size="sm" onClick={() => handleScrapToggle(currentQuiz.quizId)} className={scrapedQuizIds.has(currentQuiz.quizId) ? 'text-yellow-500' : 'text-gray-400'}>
                <Bookmark className={`w-4 h-4 ${scrapedQuizIds.has(currentQuiz.quizId) ? 'fill-current' : ''}`} />
              </Button>
            </div>
            <span>문제 {currentQuizIndex + 1} / {quizData.length}</span>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentQuiz.question}</h3>
            {!showExplanation ? (
              <div className="flex justify-center space-x-4">
                <Button onClick={() => handleAnswer(true)} className="w-24 h-24 rounded-full bg-green-100 hover:bg-green-200 text-green-700 text-4xl font-bold">O</Button>
                <Button onClick={() => handleAnswer(false)} className="w-24 h-24 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-4xl font-bold">X</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {quizResult && (
                  <>
                    <div className={`flex items-center justify-center p-4 rounded-lg ${quizResult.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {quizResult.isCorrect ? <CheckCircle className="w-6 h-6 mr-2" /> : <XCircle className="w-6 h-6 mr-2" />}
                      <span className="font-semibold">{quizResult.isCorrect ? '정답입니다!' : '오답입니다.'} (정답: {quizResult.correctAnswer ? 'O' : 'X'})</span>
                    </div>
                    {quizResult.correctAnswer === false && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">해설</h4>
                        <p className="text-blue-800">{quizResult.explanation}</p>
                      </div>
                    )}
                  </>
                )}
                {currentQuizIndex < quizData.length - 1 && (
                  <div className="text-center">
                    <Button onClick={nextQuiz} variant="primary">다음 문제</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Box>
      ) : (
        <Box className="p-6 text-center text-gray-500">
          <p>퀴즈가 준비 중입니다.</p>
        </Box>
      )}

      {currentQuizIndex === quizData.length - 1 && showExplanation && (
        <Box className="text-center">
          <Trophy className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-purple-900 mb-2">오늘의 퀴즈 완료!</h3>
          <p className="text-purple-700 mb-4">수고하셨습니다. 내일도 새로운 퀴즈로 찾아뵙겠습니다.</p>
        </Box>
      )}
    </div>
  );
}

export default QuizTab;