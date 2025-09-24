import { useState, useEffect } from 'react';
import api from '../lib/api';
import Box from '../components/Box';
import { User, Bookmark, Palette, Bell, Tag, Shield, Plus, X, Brain, ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/Button';

const characterOptions = [
  { id: 'robot', emoji: '🤖', name: '로봇 친구' },
  { id: 'cat', emoji: '🐱', name: '고양이' },
  { id: 'owl', emoji: '🦉', name: '부엉이' },
  { id: 'bear', emoji: '🐻', name: '곰돌이' }
];

const MyPage = ({ onClose, nickname, profileImage }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Settings states
  const [selectedCharacter, setSelectedCharacter] = useState('robot');
  const [notificationInterval, setNotificationInterval] = useState(30);
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [popupSettings, setPopupSettings] = useState({ news: true, quiz: true, fact: true });
  const [categories, setCategories] = useState([]);
  const [excludedSites, setExcludedSites] = useState([]);
  const [newExcludedSite, setNewExcludedSite] = useState("");

  // Scraps states
  const [scrapedNews, setScrapedNews] = useState([]);
  const [scrapedQuizzes, setScrapedQuizzes] = useState([]);
  const [scrapsLoading, setScrapsLoading] = useState(false);
  const [scrapsError, setScrapsError] = useState(null);
  const [newsPage, setNewsPage] = useState(0);
  const [quizPage, setQuizPage] = useState(0);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [hasMoreQuizzes, setHasMoreQuizzes] = useState(true);
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('all');
  const [selectedQuizCategory, setSelectedQuizCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, allCategoriesRes, interestsRes] = await Promise.all([
          api.get('/api/users/me/settings'),
          api.get('/api/categories'),
          api.get('/api/users/me/interests')
        ]);

        const settingsData = settingsRes.data.data;
        if (settingsData) {
            setSelectedCharacter(settingsData.avatarCode);
            setNotificationInterval(settingsData.notifyInterval);
            setNotifyEnabled(settingsData.notifyEnabled);
            setPopupSettings({
              news: settingsData.newsEnabled,
              quiz: settingsData.quizEnabled,
              fact: settingsData.factEnabled,
            });
            setExcludedSites(settingsData.blockedDomains || []);
        }

        const allCategoriesData = allCategoriesRes.data.data;
        const userInterestData = interestsRes.data.data;
        
        if (allCategoriesData && userInterestData) {
            const userInterestIds = new Set(userInterestData.map(interest => interest.categoryId));
            const categoryCheckboxes = allCategoriesData.map(cat => ({
              id: cat.id,
              label: cat.name || `Category ${cat.id}`,
              checked: userInterestIds.has(cat.id)
            }));
            setCategories(categoryCheckboxes);
        }

      } catch (error) {
        console.error('Failed to fetch page data', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab !== 'scraps' || newsPage > 0 || quizPage > 0) return; // Only fetch initial data once

    const fetchInitialScraps = async () => {
      setScrapsLoading(true);
      setScrapsError(null);
      try {
        const [newsRes, quizRes] = await Promise.all([
          api.get('/api/scraps', { params: { type: 'NEWS', page: 0, size: 10 } }),
          api.get('/api/scraps', { params: { type: 'QUIZ', page: 0, size: 10 } })
        ]);
        
        const newsData = newsRes.data.data;
        const quizData = quizRes.data.data;

        setScrapedNews(newsData.content);
        setHasMoreNews(!newsData.last);

        setScrapedQuizzes(quizData.content);
        setHasMoreQuizzes(!quizData.last);

      } catch (error) {
        console.error('Failed to fetch scraps', error);
        setScrapsError('스크랩 데이터를 불러오는 데 실패했습니다.');
      } finally {
        setScrapsLoading(false);
      }
    };

    fetchInitialScraps();
  }, [activeTab]);

  const handleSaveSettings = async () => {
    try {
      const settingsToUpdate = {
        avatarCode: selectedCharacter,
        notifyInterval: notificationInterval,
        notifyEnabled: notifyEnabled,
        newsEnabled: popupSettings.news,
        quizEnabled: popupSettings.quiz,
        factEnabled: popupSettings.fact,
        blockedDomains: excludedSites,
      };
      await api.put('/api/users/me/settings', settingsToUpdate);

      const selectedCategoryIds = categories
        .filter(cat => cat.checked)
        .map(cat => cat.id);
      
      await api.post('/api/users/me/interests', { categoryIds: selectedCategoryIds });

      alert('설정이 성공적으로 저장되었습니다.');

    } catch (error) {
      console.error('Failed to save settings', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

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

  const filteredNews = scrapedNews.filter(news => {
    const content = news.content || {};
    const matchesSearch = (content.title && content.title.toLowerCase().includes(newsSearchQuery.toLowerCase())) ||
                          (content.categoryName && content.categoryName.toLowerCase().includes(newsSearchQuery.toLowerCase()));
    const matchesCategory = selectedNewsCategory === 'all' || (content.categoryName && content.categoryName.toLowerCase() === selectedNewsCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const filteredQuizzes = scrapedQuizzes.filter(quiz => {
    const content = quiz.content || {};
    const matchesSearch = (content.question && content.question.toLowerCase().includes(quizSearchQuery.toLowerCase())) ||
                          (content.categoryName && content.categoryName.toLowerCase().includes(quizSearchQuery.toLowerCase()));
    const matchesCategory = selectedQuizCategory === 'all' || (content.categoryName && content.categoryName.toLowerCase() === selectedQuizCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleLoadMore = async (type) => {
    const pageToFetch = type === 'NEWS' ? newsPage + 1 : quizPage + 1;
    try {
      const res = await api.get('/api/scraps', { params: { type, page: pageToFetch, size: 10 } });
      const data = res.data.data;
      if (type === 'NEWS') {
        setScrapedNews(prev => [...prev, ...data.content]);
        setHasMoreNews(!data.last);
        setNewsPage(pageToFetch);
      } else {
        setScrapedQuizzes(prev => [...prev, ...data.content]);
        setHasMoreQuizzes(!data.last);
        setQuizPage(pageToFetch);
      }
    } catch (error) {
      console.error(`Failed to fetch more ${type} scraps`, error);
      setScrapsError('추가 데이터를 불러오는 데 실패했습니다.');
    }
  };

  const handleDeleteScrap = async (scrapId, type) => {
    if (!window.confirm("정말로 이 스크랩을 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/api/scraps/${scrapId}`);
      if (type === 'NEWS') {
        setScrapedNews(prev => prev.filter(item => item.id !== scrapId));
      } else if (type === 'QUIZ') {
        setScrapedQuizzes(prev => prev.filter(item => item.id !== scrapId));
      }
      alert("스크랩이 삭제되었습니다.");
    } catch (error) {
      console.error('Failed to delete scrap', error);
      alert("스크랩 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
          <Button onClick={onClose} variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />대시보드로 돌아가기</Button>
        </div>

        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <Button
              onClick={() => setActiveTab('profile')}
              variant="ghost"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 mr-2" />프로필
            </Button>
            <Button
              onClick={() => setActiveTab('scraps')}
              variant="ghost"
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scraps'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bookmark className="w-4 h-4 mr-2" />스크랩
            </Button>
          </nav>
        </div>

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">프로필 정보</h3>
              <div className="flex items-center space-x-4">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full" />
                ) : (
                  <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">{nickname.charAt(0)}</div>
                )}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                  <input type="text" value={nickname} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100" />
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
              <div className="flex items-center mb-4">
                  <input type="checkbox" id="notifyEnabled" checked={notifyEnabled} onChange={() => setNotifyEnabled(prev => !prev)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <label htmlFor="notifyEnabled" className="ml-2 block text-sm text-gray-900">알림 활성화</label>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">알림 간격: {notificationInterval}분</label>
              <input type="range" min="10" max="120" step="10" value={notificationInterval} onChange={(e) => setNotificationInterval(e.target.value)} className="w-full" disabled={!notifyEnabled} />
            </Box>

            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Bell className="w-5 h-5 mr-2 text-blue-600" />팝업 설정</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input type="checkbox" id="popupNews" checked={popupSettings.news} onChange={() => setPopupSettings(prev => ({ ...prev, news: !prev.news }))} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <label htmlFor="popupNews" className="ml-2 block text-sm text-gray-900">뉴스</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="popupQuiz" checked={popupSettings.quiz} onChange={() => setPopupSettings(prev => ({ ...prev, quiz: !prev.quiz }))} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <label htmlFor="popupQuiz" className="ml-2 block text-sm text-gray-900">퀴즈</label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" id="popupKnowledge" checked={popupSettings.fact} onChange={() => setPopupSettings(prev => ({ ...prev, fact: !prev.fact }))} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                  <label htmlFor="popupKnowledge" className="ml-2 block text-sm text-gray-900">지식</label>
                </div>
              </div>
            </Box>

            <Box>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Tag className="w-5 h-5 mr-2 text-green-600" />관심 카테고리</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center">
                    <input type="checkbox" id={`cat-${cat.id}`} checked={cat.checked} onChange={() => handleCategoryChange(cat.id)} className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                    <label htmlFor={`cat-${cat.id}`} className="ml-2 block text-sm text-gray-900">{cat.label}</label>
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
              <Button variant="primary" onClick={handleSaveSettings}>전체 설정 저장</Button>
            </div>
          </div>
        )}

        {activeTab === 'scraps' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scrapsLoading && (newsPage === 0 && quizPage === 0) ? (
              <div className="col-span-2 flex justify-center items-center h-64">
                <Loader className="w-12 h-12 animate-spin text-purple-600" />
              </div>
            ) : scrapsError ? (
              <div className="col-span-2 flex flex-col justify-center items-center h-64 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-red-700">오류 발생</h3>
                <p className="text-red-600">{scrapsError}</p>
              </div>
            ) : (
              <>
                <Box>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Bookmark className="w-5 h-5 mr-2 text-purple-600" />스크랩한 뉴스</h3>
                  <div className="flex space-x-2 mb-4">
                    <input
                      type="text"
                      placeholder="뉴스 검색..."
                      value={newsSearchQuery}
                      onChange={(e) => setNewsSearchQuery(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-3">
                    {filteredNews.length > 0 ? (
                      filteredNews.map(news => (
                        <div key={news.id} className="p-3 border rounded-lg flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{news.content.title}</h4>
                            <p className="text-sm text-gray-500">{news.content.categoryName}</p>
                          </div>
                          <Button onClick={() => handleDeleteScrap(news.id, 'NEWS')} variant="ghost" size="sm"><X className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">스크랩한 뉴스가 없습니다.</p>
                    )}
                  </div>
                  {hasMoreNews && (
                    <div className="text-center mt-4">
                      <Button onClick={() => handleLoadMore('NEWS')} variant="secondary">더 보기</Button>
                    </div>
                  )}
                </Box>
                <Box>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Brain className="w-5 h-5 mr-2 text-blue-600" />스크랩한 퀴즈</h3>
                  <div className="flex space-x-2 mb-4">
                    <input
                      type="text"
                      placeholder="퀴즈 검색..."
                      value={quizSearchQuery}
                      onChange={(e) => setQuizSearchQuery(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="space-y-3">
                    {filteredQuizzes.length > 0 ? (
                      filteredQuizzes.map(quiz => (
                        <div key={quiz.id} className="p-3 border rounded-lg flex justify-between items-start">
                          <div>
                            <p className="text-sm">{quiz.content.question}</p>
                            <p className="text-xs text-gray-500">{quiz.content.categoryName}</p>
                          </div>
                          <Button onClick={() => handleDeleteScrap(quiz.id, 'QUIZ')} variant="ghost" size="sm"><X className="w-4 h-4 text-red-500" /></Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">스크랩한 퀴즈가 없습니다.</p>
                    )}
                  </div>
                  {hasMoreQuizzes && (
                    <div className="text-center mt-4">
                      <Button onClick={() => handleLoadMore('QUIZ')} variant="secondary">더 보기</Button>
                    </div>
                  )}
                </Box>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;
