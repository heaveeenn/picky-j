import { useState, useEffect } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ExternalLink, Calendar, TrendingUp, Bookmark } from 'lucide-react';
import Button from '../components/Button';
import api from '../lib/api';



const NewsFeed = () => {
  const [newsData, setNewsData] = useState([]);
  const [sortMode, setSortMode] = useState('MIXED');
  const [scrapedNewsIds, setScrapedNewsIds] = useState(new Set());
  const [newsIdToScrapIdMap, setNewsIdToScrapIdMap] = useState(new Map());
  const [displayCount, setDisplayCount] = useState(3);
  const [newsStats, setNewsStats] = useState(null);

  useEffect(() => {
    const fetchNewsStats = async () => {
      try {
        const response = await api.get('/api/dashboard/news/stats');
        if (response.data && response.data.data) {
          setNewsStats(response.data.data);
        }
      } catch (error) {
        console.error("뉴스 통계를 가져오는 데 실패했습니다.", error);
      }
    };
    fetchNewsStats();
  }, []);

  useEffect(() => {
    const fetchNewsFeed = async () => {
      try {
        const response = await api.get(`/api/recommendations/feed?sort=${sortMode}&size=100`);

        if (response.data && response.data.data && response.data.data.content) {
          setNewsData(response.data.data.content);
          // Fetch initial scrap status
          try {
            const scrapResponse = await api.get(`/api/scraps?type=NEWS`);
            if (scrapResponse.data && scrapResponse.data.data && scrapResponse.data.data.content) {
              const initialScrapedIds = new Set();
              const initialNewsIdToScrapIdMap = new Map();
              scrapResponse.data.data.content.forEach(scrap => {
                if (scrap.contentType === 'NEWS') {
                  initialScrapedIds.add(scrap.contentId);
                  initialNewsIdToScrapIdMap.set(scrap.contentId, scrap.scrapId);
                }
              });
              setScrapedNewsIds(initialScrapedIds);
              setNewsIdToScrapIdMap(initialNewsIdToScrapIdMap);
            }
          } catch (scrapError) {
            console.error("초기 스크랩 상태를 가져오는 데 실패했습니다.", scrapError);
          }
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

  const handleScrapToggle = async (newsId) => {
    try {
      const response = await api.post('/api/scraps/toggle', { contentType: 'NEWS', contentId: newsId });
      const { message, data } = response.data;

      if (message === "스크랩 저장 성공") { // Assuming backend sends this message for successful save
        setScrapedNewsIds(prev => new Set(prev.add(newsId)));
        setNewsIdToScrapIdMap(prev => new Map(prev.set(newsId, data.scrapId))); // Assuming data contains scrapId
      } else if (message === "스크랩 취소 성공") { // Assuming backend sends this message for successful delete
        setScrapedNewsIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(newsId);
          return newSet;
        });
        setNewsIdToScrapIdMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(newsId);
          return newMap;
        });
      }
    } catch (error) {
      console.error(`스크랩 토글 실패: ${newsId}`, error);
    }
  };

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

  const handleViewNews = async (newsId, newsUrl) => {
    try {
      await api.post(`/api/dashboard/news/${newsId}/view`);
      window.open(newsUrl, '_blank');
    } catch (error) {
      console.error(`뉴스 조회 기록에 실패했습니다: ${newsId}`, error);
      window.open(newsUrl, '_blank'); // 에러 발생 시에도 뉴스 링크는 열어줍니다.
    }
  };



  const dayOfWeekMap = {
    MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목', 
    FRIDAY: '금', SATURDAY: '토', SUNDAY: '일'
  };

  const formattedDailyConsumption = newsStats?.dailyConsumption.map(d => ({ ...d, day: dayOfWeekMap[d.dayOfWeek] })) || [];

  return (
    <div className="space-y-6">
      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-blue-600" />이번 주 뉴스 소비량</h3>
        {newsStats ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{newsStats.weeklyNewsConsumption}개</p>
                <p className="text-sm text-gray-600">이번 주에 읽은 뉴스</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">총 읽은 뉴스</p>
                <p className="text-lg font-semibold text-primary">{newsStats.totalNewsViewed}개</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={formattedDailyConsumption}><XAxis dataKey="day" stroke="#64748b" /><Tooltip cursor={{fill: 'rgba(238, 242, 255, 0.5)'}} formatter={(value) => `${value}개`} /><Bar dataKey="count" name="" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="text-center p-8 text-gray-500">통계 정보를 불러오는 중입니다...</div>
        )}
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
            newsData.slice(0, displayCount).map((news) => (
              <Box key={news.newsId} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getCategoryVariant(news.categoryName)}>{news.categoryName}</Badge>
                      <span className="text-xs text-gray-500 flex items-center"><Calendar className="w-3 h-3 mr-1" />{formatDate(news.publishedAt)}</span>
                    </div>
                    <button onClick={() => handleScrapToggle(news.newsId)} className="text-gray-400 hover:text-yellow-500 transition-colors">
                      <Bookmark className={`w-5 h-5 ${scrapedNewsIds.has(news.newsId) ? 'fill-current text-yellow-500' : ''}`} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{news.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{news.summary}</p>
                  <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleViewNews(news.newsId, news.url)}>
                      <ExternalLink className="w-3 h-3 mr-1" />자세히 보기
                    </Button>
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
        {newsData.length > displayCount && (
          <div className="text-center mt-6">
            <Button variant="secondary" onClick={() => setDisplayCount(prev => prev + 3)}>
              더 많은 뉴스 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsFeed;