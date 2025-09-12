import { useState } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { CheckCircle, XCircle, Trophy, Target, Flame, Bookmark } from 'lucide-react';
import Button from '../components/Button';

const mockQuizData = [
  {
    id: 1,
    question: "React의 useState Hook은 함수형 컴포넌트에서만 사용할 수 있다.",
    answer: true,
    explanation: "맞습니다. useState는 React Hooks 중 하나로, 함수형 컴포넌트에서 상태를 관리하기 위해 사용됩니다. 클래스형 컴포넌트에서는 this.state를 사용합니다.",
    category: "개발",
    difficulty: "중급",
    isScraped: false
  },
  {
    id: 2,
    question: "TypeScript에서 interface와 type의 기능은 완전히 동일하다.",
    answer: false,
    explanation: "틀렸습니다. interface와 type은 유사하지만 몇 가지 차이점이 있습니다. interface는 확장이 가능하고 선언 병합이 지원되지만, type은 유니온 타입 등 더 복잡한 타입 정의가 가능합니다.",
    category: "개발",
    difficulty: "고급",
    isScraped: false
  },
  {
    id: 3,
    question: "CSS Grid는 1차원 레이아웃을 위한 기술이다.",
    answer: false,
    explanation: "틀렸습니다. CSS Grid는 2차원 레이아웃을 위한 기술입니다. 1차원 레이아웃을 위해서는 Flexbox를 사용하는 것이 더 적합합니다.",
    category: "웹디자인",
    difficulty: "초급",
    isScraped: true
  }
];

const quizStats = {
  totalQuizzes: 156,
  correctRate: 78,
  currentStreak: 5,
  bestStreak: 12,
  weeklyProgress: [
    { day: '월', correct: 3, total: 4 },
    { day: '화', correct: 2, total: 3 },
    { day: '수', correct: 4, total: 5 },
    { day: '목', correct: 3, total: 3 },
    { day: '금', correct: 5, total: 6 },
    { day: '토', correct: 2, total: 2 },
    { day: '일', correct: 1, total: 2 }
  ]
};



const QuizTab = () => {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizData, setQuizData] = useState(mockQuizData);

  const currentQuiz = quizData[currentQuizIndex];

  const handleAnswer = (answer) => {
    setSelectedAnswer(answer);
    setShowExplanation(true);
  };

  const nextQuiz = () => {
    if (currentQuizIndex < quizData.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const toggleScrap = (id) => {
    setQuizData(prev => prev.map(quiz => quiz.id === id ? { ...quiz, isScraped: !quiz.isScraped } : quiz));
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
          <p className="text-2xl font-bold text-green-700">{quizStats.correctRate}%</p>
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

      {/* 이번 주 퀴즈 진행률 */}
      <Box className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">이번 주 퀴즈 활동</h3>
        <div className="grid grid-cols-7 gap-2">
          {quizStats.weeklyProgress.map((day, index) => (
            <div key={index} className="text-center">
              <p className="text-xs text-gray-600 mb-2">{day.day}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(day.correct / day.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{day.correct}/{day.total}</p>
            </div>
          ))}
        </div>
      </Box>

      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">오늘의 퀴즈</h3>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Badge>{currentQuiz.category}</Badge>
            <Button variant="ghost" size="sm" onClick={() => toggleScrap(currentQuiz.id)} className={currentQuiz.isScraped ? 'text-yellow-500' : 'text-gray-400'}>
              <Bookmark className={`w-4 h-4 ${currentQuiz.isScraped ? 'fill-current' : ''}`} />
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
              <div className={`flex items-center justify-center p-4 rounded-lg ${selectedAnswer === currentQuiz.answer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {selectedAnswer === currentQuiz.answer ? <CheckCircle className="w-6 h-6 mr-2" /> : <XCircle className="w-6 h-6 mr-2" />}
                <span className="font-semibold">{selectedAnswer === currentQuiz.answer ? '정답입니다!' : '오답입니다.'} (정답: {currentQuiz.answer ? 'O' : 'X'})</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">해설</h4>
                <p className="text-blue-800">{currentQuiz.explanation}</p>
              </div>
              {currentQuizIndex < quizData.length - 1 && (
                <div className="text-center">
                  <Button onClick={nextQuiz} variant="primary">다음 문제</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Box>

      {currentQuizIndex === quizData.length - 1 && showExplanation && (
        <Box className="text-center">
          <Trophy className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-purple-900 mb-2">오늘의 퀴즈 완료!</h3>
          <p className="text-purple-700 mb-4">수고하셨습니다. 내일도 새로운 퀴즈로 찾아뵙겠습니다.</p>
          <Button variant="primary">내 퀴즈 기록 보기</Button>
        </Box>
      )}
    </div>
  );
}

export default QuizTab;