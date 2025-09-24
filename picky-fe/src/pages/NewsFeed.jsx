import { useState, useEffect } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts';
import { ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import Button from '../components/Button';
import api from '../lib/api';

const weeklyStats = [
  { day: '월', news: 12 }, { day: '화', news: 8 }, { day: '수', news: 15 }, 
  { day: '목', news: 11 }, { day: '금', news: 18 }, { day: '토', news: 6 }, { day: '일', news: 9 }
];

const NewsFeed = () => {
  const [newsData, setNewsData] = useState([]);
  const [sortMode, setSortMode] = useState('MIXED');

  useEffect(() => {
    const fetchNewsFeed = async () => {
      try {
        console.log(`Fetching news feed with sort: ${sortMode}...`);
        const response = await api.get(`/api/recommendations/feed?sort=${sortMode}`);
        console.log("API Response:", response);

        if (response.data && response.data.data && response.data.data.content) {
          setNewsData(response.data.data.content);
        } else {
          setNewsData([]);
          console.warn("API response structure is not as expected. Data might be empty.", response.data);
        }
      } catch (error) {
        console.error("뉴스 피드를 가져오는 데 실패했습니다.", error);
        if (error.response) {
          console.error("Detailed Error Response:", error.response);
        }
      }
    };

    fetchNewsFeed();
  }, [sortMode]);

  const getCategoryVariant = (category) => {
    switch (category) {
      case 'IT/과학': return 'primary';
      case '개발': return 'success';
      case '디자인': return 'info';
      case '정치/사회': return 'warning';
      case '여행/레저': return 'danger';
      default: return 'default';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ko-KR', options);
  };

  console.log("Current newsData state:", newsData);

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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">추천 뉴스 피드</h2>
          <div className="flex space-x-2">
            <Button
              variant={sortMode === 'LATEST' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortMode('LATEST')}
            >
              최신순
            </Button>
            <Button
              variant={sortMode === 'PRIORITY' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortMode('PRIORITY')}
            >
              중요도순
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {newsData && newsData.length > 0 ? (
            newsData.map((news) => (
              <Box key={news.newsId} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getCategoryVariant(news.categoryName)}>{news.categoryName}</Badge>
                      <span className="text-xs text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-1" />{formatDate(news.publishedAt)}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{news.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{news.summary}</p>
                  <div className="flex items-center justify-end">
                    <a href={news.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 mr-1" />자세히 보기
                      </Button>
                    </a>
                  </div>
                </div>
              </Box>
            ))
          ) : (
            <Box className="p-6 text-center text-gray-500">
              <p>추천 뉴스 피드를 불러오는 중이거나, 표시할 뉴스가 없습니다.</p>
            </Box>
          )}
        </div>
        <div className="text-center mt-6">
          <Button variant="secondary">더 많은 뉴스 보기</Button>
        </div>
      </div>
    </div>
  );
}

export default NewsFeed;