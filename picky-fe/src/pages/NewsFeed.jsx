import { useState } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { Bookmark, ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import Button from '../components/Button';

const mockNewsData = [
  {
    id: 1,
    title: "AI 기술의 최신 동향과 미래 전망",
    summary: "인공지능 기술이 빠르게 발전하면서 다양한 산업 분야에 혁신을 가져오고 있습니다. 특히 생성형 AI의 등장으로 창작, 교육, 의료 등의 영역에서...",
    category: "기술",
    imageUrl: "https://images.unsplash.com/photo-1697577418970-95d99b5a55cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlfGVufDF8fHx8MTc1NjgxNDgyMHww&ixlib=rb-4.1.0&q=80&w=1080",
    source: "TechNews",
    publishedAt: "2시간 전",
    isScraped: false
  },
  {
    id: 2,
    title: "웹 개발 트렌드 2024: React부터 AI까지",
    summary: "2024년 웹 개발 생태계를 주도할 핵심 기술들을 살펴봅니다. React 19의 새로운 기능, TypeScript의 진화, 그리고 AI 도구들의 활용법까지...",
    category: "개발",
    imageUrl: "https://images.unsplash.com/photo-1457305237443-44c3d5a30b89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudHxlbnwxfHx8fDE3NTY4MTIxNDh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    source: "DevWorld",
    publishedAt: "4시간 전",
    isScraped: true
  },
  {
    id: 3,
    title: "디지털 전환 시대의 UX 디자인 원칙",
    summary: "사용자 경험 디자인이 비즈니스 성공의 핵심 요소로 부상하고 있습니다. 모바일 우선 설계, 접근성 개선, 그리고 사용자 중심 설계의 중요성이...",
    category: "디자인",
    imageUrl: "https://images.unsplash.com/photo-1726566289392-011dc554e604?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwbmV3c3xlbnwxfHx8fDE3NTY4NDA1NTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    source: "DesignDaily",
    publishedAt: "6시간 전",
    isScraped: false
  }
];

const weeklyStats = [
  { day: '월', news: 12 }, { day: '화', news: 8 }, { day: '수', news: 15 }, 
  { day: '목', news: 11 }, { day: '금', news: 18 }, { day: '토', news: 6 }, { day: '일', news: 9 }
];



const NewsFeed = () => {
  const [newsData, setNewsData] = useState(mockNewsData);

  const toggleScrap = (id) => {
    setNewsData(prev => prev.map(news => news.id === id ? { ...news, isScraped: !news.isScraped } : news));
  };

  const getCategoryVariant = (category) => {
    switch (category) {
      case '기술': return 'primary';
      case '개발': return 'success';
      case '디자인': return 'info';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-blue-600" />이번 주 뉴스 소비량</h3>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">79개</p>
            <p className="text-sm text-gray-600">지난주 대비 +12%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">일평균</p>
            <p className="text-lg font-semibold text-purple-700">11.3개</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weeklyStats}><XAxis dataKey="day" stroke="#64748b" /><Bar dataKey="news" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </Box>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">추천 뉴스 피드</h2>
        <div className="space-y-4">
          {newsData.map((news) => (
            <Box key={news.id} className="p-0 hover:shadow-md transition-shadow">
              <div className="flex gap-4 p-6">
                <img src={news.imageUrl} alt={news.title} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getCategoryVariant(news.category)}>{news.category}</Badge>
                      <span className="text-xs text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-1" />{news.publishedAt}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleScrap(news.id)} className={news.isScraped ? 'text-yellow-500' : 'text-gray-400'}>
                      <Bookmark className={`w-4 h-4 ${news.isScraped ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{news.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{news.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">출처: {news.source}</span>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-3 h-3 mr-1" />자세히 보기
                    </Button>
                  </div>
                </div>
              </div>
            </Box>
          ))}
        </div>
        <div className="text-center mt-6">
          <Button variant="secondary">더 많은 뉴스 보기</Button>
        </div>
      </div>
    </div>
  );
}

export default NewsFeed;