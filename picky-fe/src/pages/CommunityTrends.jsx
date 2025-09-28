import { useState, useEffect } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Globe, Award, ExternalLink, Clock, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import api from '../lib/api';

const CATEGORY_COLOR_MAP_HEX = {
  '정치': '#dc2626', // red-600
  '사회': '#2563eb', // blue-600
  '경제': '#16a34a', // green-600
  '기술': '#9333ea', // purple-600
  '과학': '#4f46e5', // indigo-600
  '건강': '#db2777', // pink-600
  '교육': '#eab308', // yellow-600
  '문화': '#0d9488', // teal-600
  '엔터테인먼트': '#ea580c', // orange-600
  '스포츠': '#84cc16', // lime-600
  '역사': '#d97706', // amber-600
  '환경': '#059669', // emerald-600
  '여행': '#06b6d4', // cyan-600
  '생활': '#c026d3', // fuchsia-600
  '가정': '#e11d48', // rose-600
  '종교': '#7c3aed', // violet-600
  '철학': '#4b5563', // gray-600
};
const DEFAULT_CATEGORY_COLOR_HEX = '#6b7280'; // gray-500

const getCategoryColorHex = (categoryName) => {
  return CATEGORY_COLOR_MAP_HEX[categoryName] || DEFAULT_CATEGORY_COLOR_HEX;
};

const CATEGORY_COLOR_MAP = {
  '정치': 'bg-red-600 text-white',
  '사회': 'bg-blue-600 text-white',
  '경제': 'bg-green-600 text-white',
  '기술': 'bg-purple-600 text-white',
  '과학': 'bg-indigo-600 text-white',
  '건강': 'bg-pink-600 text-white',
  '교육': 'bg-yellow-600 text-white',
  '문화': 'bg-teal-600 text-white',
  '엔터테인먼트': 'bg-orange-600 text-white',
  '스포츠': 'bg-lime-600 text-white',
  '역사': 'bg-amber-600 text-white',
  '환경': 'bg-emerald-600 text-white',
  '여행': 'bg-cyan-600 text-white',
  '생활': 'bg-fuchsia-600 text-white',
  '가정': 'bg-rose-600 text-white',
  '종교': 'bg-violet-600 text-white',
  '철학': 'bg-gray-600 text-white',
};
const DEFAULT_CATEGORY_COLOR = 'bg-gray-500 text-white';
const RANK_COLORS = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400', 'bg-sky-400', 'bg-indigo-400']; // Fallback for unknown categories

const getCategoryColorClass = (categoryName) => {
  return CATEGORY_COLOR_MAP[categoryName] || DEFAULT_CATEGORY_COLOR;
};

const renderCommunityTrendsPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name, fill }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2; // Extend label further out
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="16px">
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CommunityTrends = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [allCategoriesTopDomains, setAllCategoriesTopDomains] = useState([]); // Stores API response
  const [displayedTopSites, setDisplayedTopSites] = useState([]); // Top 5 sites to display
  const [categoryDistributionData, setCategoryDistributionData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [trendingNews, setTrendingNews] = useState([]); // New state for trending news
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false); // 데이터 수집 중 상태

  const handleViewNews = async (newsId, newsUrl) => {
    try {
      await api.post(`/api/dashboard/news/${newsId}/view`);
      window.open(newsUrl, '_blank');
    } catch (error) {
      console.error(`뉴스 조회 기록에 실패했습니다: ${newsId}`, error);
      window.open(newsUrl, '_blank'); // 에러 발생 시에도 뉴스 링크는 열어줍니다.
    }
  };

  const parseTimeToSeconds = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  const formatActiveHourRange = (activeHourString) => {
    if (!activeHourString || typeof activeHourString !== 'string') return 'N/A';
    const hour = parseInt(activeHourString.substring(0, 2), 10);
    const startHour = (hour === 0) ? 23 : hour - 1;
    const endHour = hour;
    return `${startHour}시~${endHour}시`;
  };

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsCollecting(false);
      
      const [
        visitShareRes,
        summaryRes,
        categoriesSummaryRes,
        trendingNewsRes
      ] = await Promise.all([
        api.get('/api/dashboard/userstats/categories/visit-share'),
        api.get('/api/dashboard/summary'),
        api.get('/api/dashboard/categories/summary'),
        api.get('/api/dashboard/news/trending')
      ]);
      
      // Process category distribution data
      const visitShareData = visitShareRes.data;
      if (visitShareData && visitShareData.length > 0) {
        const sortedData = [...visitShareData].sort((a, b) => b.percent - a.percent);
        const top5Data = sortedData.slice(0, 5);
        setCategoryDistributionData(top5Data);
      } else {
        setCategoryDistributionData([]);
      }
      
      // Process aggregate summary data
      if (summaryRes.data) {
        setSummaryData(summaryRes.data);
      } else {
        setSummaryData(null);
      }
      
      // Process categories summary data
      const categoriesSummaryData = categoriesSummaryRes.data;
      if (categoriesSummaryData && categoriesSummaryData.length > 0) {
        setAllCategoriesTopDomains(categoriesSummaryData);
        const allDomainsMap = new Map();
        categoriesSummaryData.forEach(category => {
          category.topDomains.forEach(domain => {
            allDomainsMap.set(domain.domain, (allDomainsMap.get(domain.domain) || 0) + domain.visitCount);
          });
        });
        const aggregatedTop5 = Array.from(allDomainsMap.entries())
          .map(([domain, visitCount]) => ({ domain, visitCount }))
          .sort((a, b) => b.visitCount - a.visitCount)
          .slice(0, 5);
        setDisplayedTopSites(aggregatedTop5);
      } else {
        setAllCategoriesTopDomains([]);
        setDisplayedTopSites([]);
      }
      
      // Process trending news data
      if (trendingNewsRes.data && trendingNewsRes.data.data) {
        setTrendingNews(trendingNewsRes.data.data);
      } else {
        setTrendingNews([]);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setIsCollecting(true);
      } else {
        console.error("Failed to fetch community data:", err);
        setError("커뮤니티 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStats();
  }, []);

  useEffect(() => {
    if (!allCategoriesTopDomains.length) return;

    if (selectedCategory === '전체') {
      const allDomainsMap = new Map();
      allCategoriesTopDomains.forEach(category => {
        category.topDomains.forEach(domain => {
          allDomainsMap.set(domain.domain, (allDomainsMap.get(domain.domain) || 0) + domain.visitCount);
        });
      });
      const aggregatedTop5 = Array.from(allDomainsMap.entries())
        .map(([domain, visitCount]) => ({ domain, visitCount }))
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 5);
      setDisplayedTopSites(aggregatedTop5);
    } else {
      const selectedCatData = allCategoriesTopDomains.find(cat => cat.categoryName === selectedCategory);
      setDisplayedTopSites(selectedCatData ? selectedCatData.topDomains : []);
    }
  }, [selectedCategory, allCategoriesTopDomains]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isCollecting) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-blue-50 p-4 rounded-lg">
        <Clock className="w-12 h-12 text-blue-500 mb-4" />
        <h3 className="text-xl font-semibold text-blue-700">데이터 집계 중</h3>
        <p className="text-blue-600">오늘의 커뮤니티 트렌드를 열심히 분석하고 있습니다. 잠시 후 다시 확인해주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-red-50 p-4 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold text-red-700">오류 발생</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const communityInsights = [
    {
      title: '가장 활발한 시간대',
      value: summaryData ? formatActiveHourRange(summaryData.activeHour) : 'N/A',
      description: '',
      icon: Users,
    },
    {
      title: '평균 브라우징 시간',
      value: summaryData ? formatTime(Math.round(parseTimeToSeconds(summaryData.avgBrowsingTime) / 60)) : 'N/A',
      description: '',
      icon: TrendingUp,
    },
    {
      title: '평균 방문한 사이트',
      value: summaryData ? `${Math.round(Number(summaryData.avgVisitCount))}개` : 'N/A',
      description: '',
      icon: Globe,
    }
  ];

  const categoryDistribution = categoryDistributionData.length > 0 ? categoryDistributionData.map((cat) => ({
    name: cat.categoryName,
    value: cat.percent,
    color: getCategoryColorHex(cat.categoryName) // Add color property
  })) : [
    { name: '데이터 없음', value: 100, color: DEFAULT_CATEGORY_COLOR_HEX },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {communityInsights.map((insight, index) => {
          const IconComponent = insight.icon;
          return (
            <Box key={index}>
              <div className="flex items-center">
                <div className="inline-flex p-3 rounded-lg bg-gray-100 mr-4">
                  <IconComponent className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{insight.title}</p>
                  <p className="text-gray-800 font-bold text-xl">{insight.value}</p>
                  <p className="text-gray-500 text-xs">{insight.description}</p>
                </div>
              </div>
            </Box>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-primary" />카테고리별 인기 사이트 TOP 5</h3>
          <div className="flex justify-end mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="전체">전체</option>
              {allCategoriesTopDomains.map(cat => (
                <option key={cat.categoryName} value={cat.categoryName}>{cat.categoryName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {displayedTopSites.length > 0 ? (
              displayedTopSites.map((site, index) => (
                <div key={site.domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${RANK_COLORS[index]} font-bold`}>{index + 1}</div>
                    <div>
                      <h4 className="font-semibold text-base">{site.domain}</h4>
                      <div className="text-base text-gray-500">{site.visitCount}회 방문</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-gray-500">데이터를 수집 중 입니다. 잠시만 기다려 주세요</div>
            )}
          </div>
        </Box>
        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">카테고리별 관심사 분포</h3>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  dataKey="value"
                  nameKey="name"
                  labelLine={true}
                  label={renderCommunityTrendsPieLabel}
                >
                  {categoryDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 pt-20">
              {categoryDistribution.map((category, index) => (
                <div key={index} className="flex items-center">
                  <span style={{ backgroundColor: category.color }} className="rounded-full px-4 py-2 text-base text-white">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Box>
      </div>

      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary" />
          이번 주 트렌딩 토픽
        </h3>
        <div className="space-y-3">
          {trendingNews.length > 0 ? (
            trendingNews.map((news, index) => (
              <div key={news.newsId} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900 text-base">{news.title}</h4>
                    <Badge className={getCategoryColorClass(news.categoryName)}>{news.categoryName}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{news.summary}</p>
                  <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleViewNews(news.newsId, news.url)}>
                      <ExternalLink className="w-3 h-3 mr-1" />자세히 보기
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-gray-500">트렌딩 뉴스를 불러오는 중이거나, 데이터가 없습니다.</div>
          )}
        </div>
      </Box>
    </div>
  );
}

export default CommunityTrends;
