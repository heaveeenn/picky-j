import { useState, useEffect } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Globe, Award, ExternalLink, Clock, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import api from '../lib/api';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6366f1', '#ec4899'];

const CommunityTrends = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [allCategoriesTopDomains, setAllCategoriesTopDomains] = useState([]); // Stores API response
  const [displayedTopSites, setDisplayedTopSites] = useState([]); // Top 5 sites to display
  const [categoryDistributionData, setCategoryDistributionData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getChangeColor = (change) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-500';
  };

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      const [
        visitShareRes,
        summaryRes,
        categoriesSummaryRes // New API call
      ] = await Promise.all([
        api.get('/api/dashboard/userstats/categories/visit-share'),
        api.get('/api/dashboard/summary'),
        api.get('/api/dashboard/categories/summary') // New API call
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
        // Initialize displayedTopSites with '전체' (aggregated) data
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

    } catch (err) {
      console.error("Failed to fetch community data:", err);
      setError("커뮤니티 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
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

  const communityInsights = [
    {
      title: '가장 활발한 시간대',
      value: summaryData ? summaryData.activeHour.substring(0, 5) : 'N/A',
      description: '',
      icon: Users,
    },
    {
      title: '평균 브라우징 시간',
      value: summaryData ? summaryData.avgBrowsingTime.substring(0, 5) : 'N/A',
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

  const categoryDistribution = categoryDistributionData.length > 0 ? categoryDistributionData.map((cat, index) => ({
    name: cat.categoryName,
    value: cat.percent,
    color: COLORS[index % COLORS.length]
  })) : [
    { name: '데이터 없음', value: 100, color: '#d1d5db' },
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

      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Award className="w-5 h-5 mr-2 text-purple-600" />카테고리별 인기 사이트 TOP 5</h3>
        <div className="flex justify-end mb-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
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
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-purple-500 font-bold">{index + 1}</div>
                  <div>
                    <h4 className="font-semibold">{site.domain}</h4>
                    <div className="text-sm text-gray-500">{site.visitCount}회 방문</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-purple-600">#{index + 1}</div>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-gray-500">데이터가 없습니다.</div>
          )}
        </div>
      </Box>

      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">카테고리별 관심사 분포</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {categoryDistribution.map((category, index) => (
              <div key={index} className="flex items-center">
                <span style={{ backgroundColor: category.color, color: 'white' }} className="rounded-full px-2 py-1 text-xs text-white">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Box>



      <Box>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">추천 커뮤니티</h3>
        <p className="text-gray-600 mb-6">
          비슷한 관심사를 가진 사용자들이 자주 방문하는 커뮤니티를 확인해보세요
        </p>
        <div className="flex flex-wrap gap-3">
          <Badge variant="default" className="px-3 py-1">Reddit - WebDev</Badge>
          <Badge variant="default" className="px-3 py-1">Discord - Design Community</Badge>
          <Badge variant="default" className="px-3 py-1">Slack - Frontend Developers</Badge>
          <Badge variant="default" className="px-3 py-1">Notion - UX Researchers</Badge>
        </div>
      </Box>
    </div>
  );
}

export default CommunityTrends;
