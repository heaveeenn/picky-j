import { useState, useEffect } from 'react';
import api from './lib/api';
import Header from './components/Header';
import Box from './components/Box';
import Button from './components/Button';
import MyPage from './pages/MyPage';
import ActivityReport from './pages/ActivityReport';
import NewsFeed from './pages/NewsFeed';
import CommunityTrends from './pages/CommunityTrends';
import QuizTab from './pages/QuizTab';
import { IntroPage } from './pages/IntroPage'; // Import IntroPage


const tabs = {
  report: { name: '활동 리포트', component: <ActivityReport /> },
  news: { name: '뉴스 피드', component: <NewsFeed /> },
  quiz: { name: '퀴즈', component: <QuizTab /> },
  community: { name: '커뮤니티 트렌드', component: <CommunityTrends /> },
};

const App = () => {
  const [activeTab, setActiveTab] = useState('report');
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'mypage'
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for login status
  const [nickname, setNickname] = useState("사용자"); // State for user nickname
  const [profileImage, setProfileImage] = useState(null); // State for user profile image

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
      fetchUserData();
    }
  }, []);

  const fetchUserData = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const response = await api.get('/api/users/me');
        const userData = response.data.data;
        setNickname(userData.nickname);
        setProfileImage(userData.profileImage);
      } catch (error) {
        console.error('Failed to fetch user data in App.jsx', error);
      }
    }
  };

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        await api.post('/api/auth/logout', {}, {
          withCredentials: true
        });
      } catch (error) {
        console.error('Logout failed', error);
        // Even if logout API fails, proceed to clear client-side session
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setNickname("사용자"); // Reset nickname on logout
    setProfileImage(null); // Reset profile image on logout
  };

  if (!isLoggedIn) {
    return <IntroPage onLogin={() => { setIsLoggedIn(true); fetchUserData(); }} />;
  }

  if (currentView === 'mypage') {
    return <MyPage onClose={() => setCurrentView('dashboard')} nickname={nickname} profileImage={profileImage} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header 
        nickname={nickname}
        profileImage={profileImage}
        onMyPageClick={() => setCurrentView('mypage')}
        onLogoutClick={handleLogout}
      />

      <main className="container mx-auto p-4">
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            {Object.keys(tabs).map((tabKey) => (
              <Button
                key={tabKey}
                variant="ghost"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tabKey
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tabKey)}
              >
                {tabs[tabKey].name}
              </Button>
            ))}
          </nav>
        </div>

        <Box className="p-6">
          {tabs[activeTab].component}
        </Box>
      </main>
    </div>
  );
};

export default App;
