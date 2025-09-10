import Button from '../components/Button';
// Card component might need to be created or replaced with Box
// import { Card } from './ui/card'; // Assuming Card is not directly available or needs to be adapted
// import { Chrome, Newspaper, Brain, Users, BarChart3, LogIn, MessageCircle } from 'lucide-react'; // Assuming lucide-react is not used

export function IntroPage({ onLogin }) {
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
            <Button onClick={onLogin} className="flex items-center space-x-2">
              {/* <LogIn className="w-4 h-4" /> */}
              <span>로그인</span>
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
