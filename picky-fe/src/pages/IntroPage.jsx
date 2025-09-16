import Button from '../components/Button';
// Card component might need to be created or replaced with Box
// import { Card } from './ui/card'; // Assuming Card is not directly available or needs to be adapted
// import { Chrome, Newspaper, Brain, Users, BarChart3, LogIn, MessageCircle } from 'lucide-react'; // Assuming lucide-react is not used

export function IntroPage({ onLogin }) {
  const handleGoogleLogin = () => {
    window.open(
      'http://localhost:8080/oauth2/authorization/google',
      'google-login',
      'width=500,height=600'
    );

    // 토큰 받기
    const messageListener = (event) => {
      if (event.data.type === 'OAUTH2_SUCCESS') {
        const { accessToken, refreshToken } = event.data;

        // 토큰을 localStorage에 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // 로그인 성공 처리
        onLogin();

        // 이벤트 리스너 제거
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);
  };
  const features = [
    {
      // icon: Chrome,
      title: 'Chrome Extension',
      description: '브라우징 활동을 자동으로 추적하고 분석합니다'
    },
    {
      // icon: BarChart3,
      title: '활동 리포트',
      description: '상세한 브라우징 패턴과 통계를 제공합니다'
    },
    {
      // icon: Newspaper,
      title: '개인화 뉴스',
      description: '관심사 기반 맞춤형 뉴스를 추천합니다'
    },
    {
      // icon: Brain,
      title: '지식 퀴즈',
      description: '재미있는 O/X 퀴즈로 지식을 늘려보세요'
    },
    {
      // icon: MessageCircle,
      title: '캐릭터 상호작용',
      description: '친근한 캐릭터가 브라우징 중 유용한 정보를 알려드려요'
    },
    {
      // icon: Users,
      title: '커뮤니티',
      description: '다른 사용자들과 트렌드를 공유합니다'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">P</span>
              </div>
              <h1 className="text-purple-600">Picky-J</h1>
            </div>
            <Button onClick={handleGoogleLogin} className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>구글로 로그인</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="container mx-auto px-4 py-16 max-w-7xl">
        {/* 히어로 섹션 */}
        <div className="text-center mb-20">
          <div className="mb-8">
            <div className="w-20 h-20 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">피키</span>
            </div>
            <h1 className="text-4xl mb-4 text-gray-800">
              똑똑한 브라우징, 
              <br className="sm:hidden" />
              <span className="text-purple-600"> 개인화된 학습</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              웹 활동 로그를 기반으로 개인화된 뉴스와 지식 퀴즈를 제공하는
              <br className="hidden sm:block" />
              스마트한 브라우징 도우미입니다
            </p>
          </div>
        </div>

        {/* 기능 소개 */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl mb-4 text-gray-800">주요 기능</h2>
            <p className="text-lg text-gray-600">
              LogLe이 제공하는 다양한 기능들을 만나보세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 border border-gray-200 rounded-lg bg-white"> {/* Replaced Card with a div */}
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {/* <feature.icon className="w-6 h-6 text-purple-600" /> */}
                  <span className="text-purple-600">Icon</span> {/* Placeholder for icon */}
                </div>
                <h3 className="text-lg mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-gray-200 bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Picky-J. 똑똑한 브라우징의 시작</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
