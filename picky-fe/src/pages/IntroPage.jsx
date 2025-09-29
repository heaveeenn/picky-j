import { useState, useEffect } from 'react';
import Button from '../components/Button';

const phrases = [
  "과도한 뉴스 정보 속,",
  "당신에게 꼭 필요한 뉴스만",
  "방문 기록으로 맞춤형 추천",
  "스마트 뉴스 큐레이션, PICKY",
];

export function IntroPage({ onLogin }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    const typingSpeed = 100;
    const deletingSpeed = 25;
    const pauseDuration = 1500;

    const handleTyping = () => {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        // Deleting logic
        if (typedText.length > 0) {
          setTypedText(prev => prev.substring(0, prev.length - 1));
        } else {
          // Finished deleting
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      } else {
        // Typing logic
        if (typedText.length < currentPhrase.length) {
          setTypedText(currentPhrase.substring(0, typedText.length + 1));
        }
        else {
          // Finished typing, pause and then start deleting
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      }
    };

    const timeoutId = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeoutId);
  }, [typedText, isDeleting, phraseIndex]);

  const handleGoogleLogin = () => {
    const oauthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`;
    window.open(oauthUrl, 'google-login', 'width=500,height=600');

    const messageListener = (event) => {
      const backendOrigin = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      if (event.origin !== backendOrigin) {
        return;
      }
      if (event.data.type === 'OAUTH2_SUCCESS') {
        const { accessToken } = event.data;
        localStorage.setItem('accessToken', accessToken);
        onLogin();
        window.removeEventListener('message', messageListener);
      }
    };
    window.addEventListener('message', messageListener);
  };

  const features = [
    {
      icon: '📊',
      title: '활동 리포트',
      description: '상세한 브라우징 패턴과 통계를 제공합니다.',
    },
    {
      icon: '📰',
      title: '개인화 뉴스',
      description: '관심사 기반 맞춤형 뉴스를 추천합니다.',
    },
    {
      icon: '🧠',
      title: '지식 퀴즈',
      description: '재미있는 O/X 퀴즈로 지식을 늘려보세요.',
    },
    {
      icon: '🤖',
      title: '캐릭터 상호작용',
      description: '친근한 캐릭터가 유용한 정보를 알려드려요.',
    },
    {
      icon: '🌐',
      title: '커뮤니티',
      description: '다른 사용자들과 트렌드를 공유합니다.',
    },
    {
      icon: '🔌',
      title: 'Chrome Extension',
      description: '브라우징 활동을 자동으로 추적하고 분석합니다.',
    },
  ];

  const handleScrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <style>{`
        .typed-cursor {
          opacity: 1;
          animation: blink 0.7s infinite;
        }
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
      <div className="bg-white text-slate-800">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                P
              </div>
              <h1 className="text-2xl font-bold text-slate-900">PICKY</h1>
            </div>
            <Button
              onClick={handleGoogleLogin}
              className="flex items-center space-x-2 bg-white text-gray-800 font-semibold px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>구글로 시작하기</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {/* Hero Section */}
          <section className="relative flex flex-col items-center justify-start min-h-screen px-6 bg-white overflow-hidden">
            <div className="relative z-10 text-center mt-[-32] pt-20">
              <h1 className={`text-4xl md:text-6xl font-extrabold mb-20 bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-500 transition-all duration-700 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} leading-relaxed`}>
                쏟아지는 정보 속<br />
                당신만의 뉴스를 찾다<br />
              </h1>
              <p className="text-4xl md:text-5xl text-gray-600 max-w-4xl mx-auto mb-10 min-h-[80px]">
                {typedText}
                <span className="typed-cursor">|</span>
              </p>
            </div>
            <div
              onClick={handleScrollToFeatures}
              className={`absolute bottom-20 left-1/2 -translate-x-1/2 transition-opacity duration-1000 delay-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} cursor-pointer`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-400 animate-bounce opacity-20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5" />
                </svg>
            </div>
          </section>

          <section id="features-section" className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">PICKY의 핵심 기능</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  당신의 웹 서핑을 한 단계 업그레이드할 강력한 기능들을 만나보세요.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Extension Download Section */}
          <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">PICKY 크롬 확장 프로그램 설치</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  아래 버튼을 통해 확장 프로그램을 다운로드하고, 안내에 따라 수동으로 설치하여 PICKY의 모든 기능을 활성화하세요.
                </p>
              </div>
              <div className="max-w-4xl mx-auto bg-gray-50 p-8 rounded-xl border border-gray-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">PICKY</h3>
                    <p className="text-gray-600 mb-4">클릭하여 확장 프로그램 파일을 다운로드하세요.</p>
                    <a
                      href="https://github.com/user-attachments/files/22587736/Picky_ver.0.1.0.zip"
                      download
                      className="inline-block bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      다운로드
                    </a>
                  </div>
                  <div className="w-full md:w-px bg-gray-300 h-px md:h-32"></div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-3 text-center md:text-left">수동 설치 방법</h4>
                    <ol className="list-decimal list-inside text-gray-700 space-y-2">
                      <li>다운로드한 ZIP 파일의 압축을 풉니다.</li>
                      <li>Chrome 브라우저에서 <code className="bg-gray-200 text-sm px-1.5 py-1 rounded">chrome://extensions</code> 주소로 이동합니다.</li>
                      <li>우측 상단의 '개발자 모드'를 활성화합니다.</li>
                      <li>'압축 해제된 확장 프로그램을 로드합니다' 버튼을 클릭합니다.</li>
                      <li>압축 해제한 폴더를 선택하여 설치를 완료합니다.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* Final CTA Section */}
          <section className="py-20 bg-gray-50">
              <div className="container mx-auto px-6 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                      새로운 정보의 세계가 당신을 기다립니다
                  </h2>
                  <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                      지금 바로 PICKY와 함께 더 스마트한 웹 브라우징을 경험해보세요.
                  </p>
                  <Button
                      onClick={handleGoogleLogin}
                      className="bg-gradient-to-r from-primary to-pink-600 text-white font-bold text-xl px-10 py-5 rounded-full hover:opacity-90 transition-opacity"
                  >
                      무료로 시작하기
                  </Button>
              </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white">
          <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-3 mb-6 md:mb-0">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  P
                </div>
                <h1 className="text-2xl font-bold text-slate-900">PICKY</h1>
              </div>
              <div className="text-center md:text-right text-gray-500">
                <p className="mb-2">© 2025 PICKY. All Rights Reserved.</p>
                <p>똑똑한 브라우징의 시작</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
