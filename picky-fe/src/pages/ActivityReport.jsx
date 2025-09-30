import { useState, useEffect } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Globe, Clock, TrendingUp, Users, AlertCircle, Loader, BarChart3 } from 'lucide-react';
import api from '../lib/api';

const BAR_COLORS = ['#ff914d', '#ffd5ba'];
const RANK_COLORS = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400', 'bg-sky-400', 'bg-indigo-400'];

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

const formatTime = (minutes) => {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}시간 ${mins}분`;
};
const renderActivityReportPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name, fill }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2; // Extend label further out
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill={fill} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
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
  const [userVsAverageStats, setUserVsAverageStats] = useState(null); // New state variable

  const parseTimeToSeconds = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 0;
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 각 API를 개별적으로 호출하여 실패해도 다른 API는 계속 진행
        const fetchUserStats = async () => {
          try {
            const response = await api.get('/api/dashboard/userstats');
            setUserStats(response.data);
          } catch (err) {
            console.error("Failed to fetch user stats:", err);
            setUserStats(null);
          }
        };

        const fetchHourlyStats = async () => {
          try {
            const response = await api.get('/api/dashboard/userstats/hourly');
            const hourlyStatsData = response.data;
            if (hourlyStatsData && hourlyStatsData.length > 0) {
              const processedHourlyStats = hourlyStatsData.map(stat => ({
                ...stat,
                timeSpentMinutes: Math.round(parseTimeToSeconds(stat.timeSpent) / 60)
              }));
              setHourlyStats(processedHourlyStats);
            } else {
              setHourlyStats(mockData.hourlyActivity);
            }
          } catch (err) {
            console.error("Failed to fetch hourly stats:", err);
            setHourlyStats(mockData.hourlyActivity);
          }
        };

        const fetchCategoryStats = async () => {
          try {
            const response = await api.get('/api/dashboard/userstats/categories');
            const categoryStatsData = response.data;
            if (categoryStatsData && categoryStatsData.length > 0) {
              const processedCategories = categoryStatsData.map(cat => ({
                ...cat,
                timeSpentSeconds: parseTimeToSeconds(cat.timeSpent),
                color: getCategoryColorHex(cat.categoryName)
              }));
              const sortedCategories = [...processedCategories].sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds);
              const top5Categories = sortedCategories.slice(0, 5);
              setCategoryStats(top5Categories);

              const longestStayedCat = sortedCategories[0] || { categoryName: '-' };
              setMostActiveCategory(longestStayedCat.categoryName);
            } else {
              setCategoryStats(mockData.categoryData.map(cat => ({ ...cat, color: DEFAULT_CATEGORY_COLOR_HEX })));
              setMostActiveCategory(mockData.todayStats[3].value);
            }
          } catch (err) {
            console.error("Failed to fetch category stats:", err);
            setCategoryStats(mockData.categoryData.map(cat => ({ ...cat, color: DEFAULT_CATEGORY_COLOR_HEX })));
            setMostActiveCategory(mockData.todayStats[3].value);
          }
        };

        const fetchDomainStats = async () => {
          try {
            const response = await api.get('/api/dashboard/userstats/domains');
            const domainStatsData = response.data;
            if (domainStatsData && domainStatsData.length > 0) {
              const sortedDomains = [...domainStatsData].sort((a, b) => b.visitCount - a.visitCount);
              setDomainStats(sortedDomains);
              const mostVisitedDom = sortedDomains[0] || { domain: '-' };
              setMostVisitedSite(mostVisitedDom.domain);
            } else {
              setDomainStats(mockData.domainStats);
              setMostVisitedSite(mockData.todayStats[2].value);
            }
          } catch (err) {
            console.error("Failed to fetch domain stats:", err);
            setDomainStats(mockData.domainStats);
            setMostVisitedSite(mockData.todayStats[2].value);
          }
        };

        const fetchUserVsAverageStats = async () => {
          try {
            const response = await api.get('/api/dashboard/userstats/summary');
            setUserVsAverageStats(response.data);
          } catch (err) {
            console.error("Failed to fetch user vs average stats:", err);
            setUserVsAverageStats(null);
          }
        };

        // 모든 API를 병렬로 호출
        await Promise.all([
          fetchUserStats(),
          fetchHourlyStats(),
          fetchCategoryStats(),
          fetchDomainStats(),
          fetchUserVsAverageStats()
        ]);

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
        <Loader className="w-12 h-12 animate-spin text-primary" />
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


  const todayStats = [
    { title: '방문한 사이트 수', value: userStats?.totalSites || mockData.todayStats[0].value, icon: Globe },
    { title: '총 브라우징 시간', value: userStats?.totalTimeSpent ? formatTime(Math.round(parseTimeToSeconds(userStats.totalTimeSpent) / 60)) : '-', icon: Clock },
    { title: '가장 많이 방문한 사이트', value: mostVisitedSite, icon: Globe },
    { title: '가장 오래 머문 카테고리', value: mostActiveCategory, icon: TrendingUp }
  ];

  const hasHourlyData = hourlyStats.some(stat => stat.timeSpentMinutes > 0);
  const totalBrowsingTimeForMessage = userStats?.totalTimeSpent ? formatTime(Math.round(parseTimeToSeconds(userStats.totalTimeSpent) / 60)) : '데이터 없음';

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
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            시간대별 활동 패턴
          </h3>
          {hasHourlyData ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hourLabel" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}분`} />
                <Bar dataKey="timeSpentMinutes" radius={[4, 4, 0, 0]} name="활동 시간(분)">
                  {hourlyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col justify-center items-center h-60 bg-gray-50 p-4 rounded-lg text-gray-600">
              <Clock className="w-8 h-8 mb-2" />
              <p className="text-center">
                시간대별 활동 패턴은 매시 정각에 갱신됩니다.<br/>
                활동을 시작하면 그래프가 표시됩니다.
              </p>
            </div>
          )}
        </Box>

        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            카테고리별 머문 시간
          </h3>
          {categoryStats.length > 0 && categoryStats[0].categoryName !== '데이터 없음' && categoryStats[0].name !== '데이터 없음' ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="timeSpentSeconds"
                  nameKey="categoryName"
                  labelLine={true}
                  label={renderActivityReportPieLabel}
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatTime(Math.round(value / 60))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col justify-center items-center h-60 bg-gray-50 p-4 rounded-lg text-gray-600">
              <TrendingUp className="w-8 h-8 mb-2" />
              <p className="text-center">
                카테고리별 머문 시간은 매시 정각에 갱신됩니다.<br/>
                활동을 시작하면 분석이 표시됩니다.
              </p>
            </div>
          )}
        </Box>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <Box className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-primary" />
            상위 방문 사이트
          </h3>
          {domainStats.length > 0 && domainStats[0].domain !== '데이터 없음' ? (
            <div className="space-y-3">
              {domainStats.slice(0, 5).map((site, index) => (
                <div key={site.domain} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${RANK_COLORS[index]} text-white rounded-full flex items-center justify-center text-sm flex-shrink-0`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{site.domain}</div>
                      <div className="text-sm text-gray-500">{site.visitCount}회 방문</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center min-h-60 bg-gray-50 p-4 rounded-lg text-gray-600">
              <Globe className="w-8 h-8 mb-2" />
              <p className="text-center">
                상위 방문 사이트는 매시 정각에 갱신됩니다.<br/>
                활동을 시작하면 사이트 순위가 표시됩니다.
              </p>
            </div>
          )}
        </Box>

        <Box className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            평균 대비 내 활동
          </h3>
          {userVsAverageStats ? (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">일일 브라우징 시간</span>
                  <span className="text-gray-600"><span className="text-primary">{userVsAverageStats.browsingTimeDiff}</span></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">일일 방문 사이트</span>
                  <span className="text-gray-600"><span className="text-primary">{userVsAverageStats.visitCountDiff}</span></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-600">스크랩 활동</span>
                  <span className="text-gray-600">평균보다 <span className="text-primary">23% 많음</span></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '73%' }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center flex-1 min-h-60 bg-gray-50 p-4 rounded-lg text-gray-600">
              <BarChart3 className="w-8 h-8 mb-2" />
              <p className="text-center">
                평균 대비 활동 분석은 매일 자정에 갱신됩니다.<br/>
                신규 가입자는 다음날부터 확인 가능합니다.
              </p>
            </div>
          )}
        </Box>
      </div>
    </div>
  );
}

export default ActivityReport;
