import { useState, useEffect } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, Clock, TrendingUp, Users, AlertCircle, Loader } from 'lucide-react';
import api from '../lib/api';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6366f1', '#ec4899'];

const mockData = {
  todayStats: [
    { title: '방문한 사이트 수', value: '-', icon: Globe },
    { title: '총 브라우징 시간', value: '-', icon: Clock },
    { title: '가장 오래 머문 사이트', value: '-', icon: Globe },
    { title: '가장 많이 방문한 카테고리', value: '-', icon: TrendingUp }
  ],
  categoryData: [
    { name: '데이터 없음', value: 100, color: '#d1d5db' },
  ],
  hourlyActivity: Array.from({ length: 12 }, (_, i) => ({ hour: `${(i * 2).toString().padStart(2, '0')}`, count: 0 })),
  domainStats: [{ domain: '데이터 없음', count: 0 }],
};

const ActivityReport = () => {
  const [userStats, setUserStats] = useState(null);
  const [hourlyStats, setHourlyStats] = useState(mockData.hourlyActivity);
  const [categoryStats, setCategoryStats] = useState(mockData.categoryData);
  const [domainStats, setDomainStats] = useState(mockData.domainStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostActiveCategory, setMostActiveCategory] = useState(mockData.todayStats[3].value);
  const [mostVisitedSite, setMostVisitedSite] = useState(mockData.todayStats[2].value);

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        const [
          userStatsRes,
          hourlyStatsRes,
          categoryStatsRes,
          domainStatsRes
        ] = await Promise.all([
          api.get('/api/dashboard/userstats'),
          api.get('/api/dashboard/userstats/hourly'),
          api.get('/api/dashboard/userstats/categories'),
          api.get('/api/dashboard/userstats/domains')
        ]);

        console.log("API Responses:", { userStatsRes, hourlyStatsRes, categoryStatsRes, domainStatsRes });

        const userStatsData = userStatsRes.data;
        console.log("userStatsData.totalTimeSpent:", userStatsData.totalTimeSpent);
        const hourlyStatsData = hourlyStatsRes.data;
        const categoryStatsData = categoryStatsRes.data;
        const domainStatsData = domainStatsRes.data;

        console.log("Extracted Data:", { userStatsData, hourlyStatsData, categoryStatsData, domainStatsData });

        setUserStats(userStatsData);
        if (hourlyStatsData && hourlyStatsData.length > 0) setHourlyStats(hourlyStatsData); else setHourlyStats(mockData.hourlyActivity);
        if (categoryStatsData && categoryStatsData.length > 0) {
          setCategoryStats(categoryStatsData);
          const mostVisitedCat = categoryStatsData.reduce((prev, current) => (
            (prev.visitCount || 0) > (current.visitCount || 0) ? prev : current
          ), { categoryName: '-', visitCount: 0 });
          setMostActiveCategory(mostVisitedCat.categoryName);
        } else {
          setCategoryStats(mockData.categoryData);
          setMostActiveCategory(mockData.todayStats[3].value);
        }
        if (domainStatsData && domainStatsData.length > 0) {
          setDomainStats(domainStatsData);
          const mostVisitedDom = domainStatsData.reduce((prev, current) => (
            (prev.visitCount || 0) > (current.visitCount || 0) ? prev : current
          ), { domain: '-', visitCount: 0 });
          setMostVisitedSite(mostVisitedDom.domain);
        } else {
          setDomainStats(mockData.domainStats);
          setMostVisitedSite(mockData.todayStats[2].value);
        }
        
        console.log("Extracted Data:", { userStatsData, hourlyStatsData, categoryStatsData, domainStatsData });

        setError(null);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="w-12 h-12 animate-spin text-purple-600" />
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

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  const parseTimeToSeconds = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0; // Default to 0 if format is unexpected
  };

  const todayStats = [
    { title: '방문한 사이트 수', value: userStats?.totalSites || mockData.todayStats[0].value, icon: Globe },
    { title: '총 브라우징 시간', value: userStats?.totalTimeSpent || mockData.todayStats[1].value, icon: Clock },
    { title: '가장 오래 머문 사이트', value: mostVisitedSite, icon: Globe },
    { title: '가장 많이 방문한 카테고리', value: mostActiveCategory, icon: TrendingUp }
  ];

  const hasHourlyData = hourlyStats.some(stat => parseTimeToSeconds(stat.timeSpent) > 0);
  const totalBrowsingTimeForMessage = userStats?.totalTimeSpent || '데이터 없음';

  return (
    <div className="space-y-8">
      {/* 오늘의 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {todayStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Box key={index}>
              <div className="flex items-center">
                <div className="inline-flex p-3 rounded-lg bg-gray-100 mr-4">
                  <IconComponent className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-gray-800 font-bold text-xl">{stat.value || '-'}</p>
                </div>
              </div>
            </Box>
          );
        })}
      </div>

      {/* 상세 지표들 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">시간대별 활동 패턴</h3>
          {hasHourlyData ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hourLabel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="timeSpent" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="시간" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col justify-center items-center h-48 bg-gray-50 p-4 rounded-lg text-gray-600">
              <Clock className="w-8 h-8 mb-2" />
              <p className="text-center">
                아직 시간대별 활동 데이터가 충분히 수집되지 않았습니다.<br/>
                활동을 시작하면 여기에 패턴이 표시됩니다.<br/>
                현재까지의 총 브라우징 시간은 <span className="font-bold text-purple-600">{totalBrowsingTimeForMessage}</span>입니다.
              </p>
            </div>
          )}
        </Box>

        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">카테고리별 분포</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryStats} cx="50%" cy="50%" outerRadius={80} dataKey="visitCount" nameKey="categoryName" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">상위 방문 사이트</h3>
          <div className="space-y-3">
            {domainStats.slice(0, 5).map((site, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div>
                  <div className="font-semibold">{site.domain}</div>
                  <div className="text-sm text-gray-500">{site.visitCount}회 방문</div>
                </div>
                <div className="text-lg font-bold text-purple-600">#{index + 1}</div>
              </div>
            ))}
          </div>
        </Box>

      </div>

      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-purple-600" />
          평균 대비 내 활동
        </h3>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600">일일 브라우징 시간</span>
              <span className="text-gray-600">평균보다 <span className="text-purple-600">15% 많음</span></span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600">일일 방문 사이트</span>
              <span className="text-gray-600">평균보다 <span className="text-purple-600">12% 많음</span></span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '62%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600">스크랩 활동</span>
              <span className="text-gray-600">평균보다 <span className="text-purple-600">23% 많음</span></span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '73%' }}></div>
            </div>
          </div>
        </div>
      </Box>
    </div>
  );
}

export default ActivityReport;