import { useState } from 'react';
import Box from '../components/Box';
import { User, Bookmark, Palette, Bell, Tag, Shield, Plus, X, Brain } from 'lucide-react';
import Button from '../components/Button';

const mockScrapedNews = [
  { id: 1, title: "AI 기술의 최신 동향과 미래 전망", category: "기술", source: "TechNews", date: "2024-03-10" },
  { id: 2, title: "웹 개발 트렌드 2024: React부터 AI까지", category: "개발", source: "DevWorld", date: "2024-03-09" },
];

const mockScrapedQuizzes = [
  { id: 1, question: "React의 useState Hook은 함수형 컴포넌트에서만 사용할 수 있다.", category: "개발", difficulty: "중급", date: "2024-03-10" },
  { id: 2, question: "CSS Grid는 1차원 레이아웃을 위한 기술이다.", category: "웹디자인", difficulty: "초급", date: "2024-03-09" },
];

const characterOptions = [
  { id: 'robot', emoji: '🤖', name: '로봇 친구' },
  { id: 'cat', emoji: '🐱', name: '고양이' },
  { id: 'owl', emoji: '🦉', name: '부엉이' },
  { id: 'bear', emoji: '🐻', name: '곰돌이' }
];

const initialCategories = [
  { id: 'tech', label: '기술', checked: true },
  { id: 'news', label: '뉴스', checked: true },
  { id: 'education', label: '교육', checked: false },
  { id: 'design', label: '디자인', checked: true },
  { id: 'business', label: '비즈니스', checked: false },
  { id: 'entertainment', label: '엔터테인먼트', checked: false }
];



const MyPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [nickname, setNickname] = useState("사용자");
  const [selectedCharacter, setSelectedCharacter] = useState('robot');
  const [notificationInterval, setNotificationInterval] = useState(30);
  const [categories, setCategories] = useState(initialCategories);
  const [excludedSites, setExcludedSites] = useState(["facebook.com", "instagram.com"]);
  const [newExcludedSite, setNewExcludedSite] = useState("");
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('all'); // New state for news category filter
  const [selectedQuizCategory, setSelectedQuizCategory] = useState('all'); // New state for quiz category filter

  const handleCategoryChange = (categoryId) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, checked: !cat.checked } : cat
      )
    );
  };

  const handleAddExcludedSite = () => {
    if (newExcludedSite.trim() && !excludedSites.includes(newExcludedSite.trim())) {
      setExcludedSites(prev => [...prev, newExcludedSite.trim()]);
      setNewExcludedSite("");
    }
  };

  const handleRemoveExcludedSite = (siteToRemove) => {
    setExcludedSites(prev => prev.filter(site => site !== siteToRemove));
  };

  const filteredNews = mockScrapedNews.filter(news => {
    const matchesSearch = news.title.toLowerCase().includes(newsSearchQuery.toLowerCase()) ||
                          news.category.toLowerCase().includes(newsSearchQuery.toLowerCase()) ||
                          news.source.toLowerCase().includes(newsSearchQuery.toLowerCase());
    const matchesCategory = selectedNewsCategory === 'all' || news.category.toLowerCase() === selectedNewsCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const filteredQuizzes = mockScrapedQuizzes.filter(quiz => {
    const matchesSearch = quiz.question.toLowerCase().includes(quizSearchQuery.toLowerCase()) ||
                          quiz.category.toLowerCase().includes(quizSearchQuery.toLowerCase()) ||
                          quiz.difficulty.toLowerCase().includes(quizSearchQuery.toLowerCase());
    const matchesCategory = selectedQuizCategory === 'all' || quiz.category.toLowerCase() === selectedQuizCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
          <Button onClick={onClose} variant="outline">대시보드로 돌아가기</Button>
        </div>

        <div className="flex space-x-2 border-b mb-6">
          <Button onClick={() => setActiveTab('profile')} variant={activeTab === 'profile' ? 'primary' : 'ghost'}><User className="w-4 h-4 mr-2" />프로필</Button>
          <Button onClick={() => setActiveTab('scraps')} variant={activeTab === 'scraps' ? 'primary' : 'ghost'}><Bookmark className="w-4 h-4 mr-2" />스크랩</Button>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">프로필 정보</h3>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">{nickname.charAt(0)}</div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
            </Box>

            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Palette className="w-5 h-5 mr-2 text-purple-600" />캐릭터 선택</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {characterOptions.map(char => (
                  <div key={char.id} onClick={() => setSelectedCharacter(char.id)} className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${selectedCharacter === char.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}>
                    <div className="text-3xl mb-2">{char.emoji}</div>
                    <div className="text-sm font-medium">{char.name}</div>
                  </div>
                ))}
              </div>
            </Box>

            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Bell className="w-5 h-5 mr-2 text-blue-600" />알림 설정</h3>
              <label className="block text-sm font-medium text-gray-700 mb-2">알림 간격: {notificationInterval}분</label>
              <input type="range" min="10" max="120" step="10" value={notificationInterval} onChange={(e) => setNotificationInterval(e.target.value)} className="w-full" />
            </Box>

            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Tag className="w-5 h-5 mr-2 text-green-600" />관심 카테고리</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center">
                    <input type="checkbox" id={cat.id} checked={cat.checked} onChange={() => handleCategoryChange(cat.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <label htmlFor={cat.id} className="ml-2 block text-sm text-gray-900">{cat.label}</label>
                  </div>
                ))}
              </div>
            </Box>

            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Shield className="w-5 h-5 mr-2 text-orange-600" />수집 제외 사이트 관리</h3>
              <div className="flex space-x-2 mb-4">
                <input type="text" value={newExcludedSite} onChange={(e) => setNewExcludedSite(e.target.value)} placeholder="example.com" className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                <Button onClick={handleAddExcludedSite} variant="secondary"><Plus className="w-4 h-4 mr-1" />추가</Button>
              </div>
              <div className="space-y-2">
                {excludedSites.map(site => (
                  <div key={site} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span>{site}</span>
                    <Button onClick={() => handleRemoveExcludedSite(site)} variant="ghost" size="sm"><X className="w-4 h-4 text-red-500" /></Button>
                  </div>
                ))}
              </div>
            </Box>

            <div className="text-right mt-4">
              <Button variant="primary">전체 설정 저장</Button>
            </div>
          </div>
        )}

        {activeTab === 'scraps' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Bookmark className="w-5 h-5 mr-2 text-purple-600" />스크랩한 뉴스</h3>
              <div className="flex space-x-2 mb-4"> {/* Added a div to contain search and select */}
                <input
                  type="text"
                  placeholder="뉴스 검색..."
                  value={newsSearchQuery}
                  onChange={(e) => setNewsSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md" // flex-1 to take available space
                />
                <select
                  value={selectedNewsCategory}
                  onChange={(e) => setSelectedNewsCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">모든 카테고리</option>
                  {initialCategories.map(cat => (
                    <option key={cat.id} value={cat.label.toLowerCase()}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                {filteredNews.length > 0 ? (
                  filteredNews.map(news => (
                    <div key={news.id} className="p-3 border rounded-lg">
                      <h4 className="font-semibold">{news.title}</h4>
                      <p className="text-sm text-gray-500">{news.source} | {news.date}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                )}
              </div>
            </Box>
            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Brain className="w-5 h-5 mr-2 text-blue-600" />스크랩한 퀴즈</h3>
              <div className="flex space-x-2 mb-4"> {/* Added a div to contain search and select */}
                <input
                  type="text"
                  placeholder="퀴즈 검색..."
                  value={quizSearchQuery}
                  onChange={(e) => setQuizSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md" // flex-1 to take available space
                />
                <select
                  value={selectedQuizCategory}
                  onChange={(e) => setSelectedQuizCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">모든 카테고리</option>
                  {initialCategories.map(cat => (
                    <option key={cat.id} value={cat.label.toLowerCase()}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                {filteredQuizzes.length > 0 ? (
                  filteredQuizzes.map(quiz => (
                    <div key={quiz.id} className="p-3 border rounded-lg">
                      <p className="text-sm">{quiz.question}</p>
                      <div className="text-xs text-gray-500">{quiz.category} | {quiz.difficulty}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                )}
              </div>
            </Box>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;