import { useState, useEffect } from 'react';
import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Globe, Award, ExternalLink, Clock, Loader, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import api from '../lib/api';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6366f1', '#ec4899'];

const categoryWiseSites = {
  '전체': [
    { name: 'GitHub', visits: 2340, category: '개발', change: '+12%' },
    { name: 'Stack Overflow', visits: 1890, category: '개발', change: '+8%' },
    { name: 'Medium', visits: 1560, category: '뉴스', change: '+15%' },
    { name: 'YouTube', visits: 1100, category: '교육', change: '+22%' },
    { name: 'LinkedIn', visits: 980, category: '비즈니스', change: '-3%' },
  ],
  '개발': [
    { name: 'GitHub', visits: 2340, category: '개발', change: '+12%' },
    { name: 'Stack Overflow', visits: 1890, category: '개발', change: '+8%' },
    { name: 'Dev.to', visits: 1650, category: '개발', change: '+18%' },
    { name: 'LeetCode', visits: 1420, category: '개발', change: '+25%' },
    { name: 'CodePen', visits: 1180, category: '개발', change: '+14%' }
  ],
  '디자인': [
    { name: 'Figma', visits: 1230, category: '디자인', change: '+5%' },
    { name: 'Dribbble', visits: 1150, category: '디자인', change: '+7%' },
    { name: 'Behance', visits: 980, category: '디자인', change: '+12%' },
    { name: 'Adobe Creative Cloud', visits: 890, category: '디자인', change: '+9%' },
    { name: 'Sketch', visits: 720, category: '디자인', change: '+3%' }
  ],
  '뉴스': [
    { name: 'Medium', visits: 1560, category: '뉴스', change: '+15%' },
    { name: 'TechCrunch', visits: 1340, category: '뉴스', change: '+11%' },
    { name: 'Hacker News', visits: 1200, category: '뉴스', change: '+20%' },
    { name: 'The Verge', visits: 980, category: '뉴스', change: '+8%' },
    { name: 'Wired', visits: 850, category: '뉴스', change: '+6%' }
  ],
  '교육': [
    { name: 'YouTube', visits: 1100, category: '교육', change: '+22%' },
    { name: 'Coursera', visits: 980, category: '교육', change: '+16%' },
    { name: 'Udemy', visits: 920, category: '교육', change: '+19%' },
    { name: 'Khan Academy', visits: 780, category: '교육', change: '+12%' },
    { name: 'edX', visits: 650, category: '교육', change: '+14%' }
  ],
  '비즈니스': [
    { name: 'LinkedIn', visits: 980, category: '비즈니스', change: '-3%' },
    { name: 'Notion', visits: 890, category: '비즈니스', change: '+18%' },
    { name: 'Slack', visits: 820, category: '비즈니스', change: '+12%' },
    { name: 'Trello', visits: 750, category: '+8%' },
    { name: 'Asana', visits: 680, category: '+15%' }
  ]
};

const trendingTopics = [
  { rank: 1, topic: 'AI 및 머신러닝', growth: '+45%', category: '기술' },
  { rank: 2, topic: 'React 19 업데이트', growth: '+38%', category: '개발' },
  { rank: 3, topic: 'UI/UX 트렌드 2024', growth: '+32%', category: '디자인' },
  { rank: 4, topic: 'TypeScript 베스트 프랙티스', growth: '+28%', category: '개발' },
  { rank: 5, topic: '웹 접근성 가이드라인', growth: '+25%', category: '웹표준' }
];

const CommunityTrends = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [categoryDistributionData, setCategoryDistributionData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getChangeColor = (change) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-500';
  };

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        const [
          visitShareRes,
          summaryRes
        ] = await Promise.all([
          api.get('/api/dashboard/userstats/categories/visit-share'),
          api.get('/api/dashboard/summary')
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

      } catch (err) {
        console.error("Failed to fetch community data:", err);
        setError("커뮤니티 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };
    fetchCommunityData();
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
      value: summaryData ? `${Number(summaryData.avgVisitCount).toFixed(1)}개` : 'N/A',
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

  const currentSites = categoryWiseSites[selectedCategory] || categoryWiseSites['전체'];

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
        <div className="flex space-x-2 border-b mb-4">
          {Object.keys(categoryWiseSites).map(category => (
            <Button 
              key={category} 
              variant={selectedCategory === category ? 'primary' : 'ghost'}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
        <div className="space-y-3">
          {currentSites.map((site, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white bg-purple-500 font-bold">{index + 1}</div>
                <div>
                  <h4 className="font-semibold">{site.name}</h4>
                  <span className="text-sm text-gray-500">{site.visits.toLocaleString()} 방문</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-semibold ${getChangeColor(site.change)}`}>{site.change}</span>
                <Button variant="outline" size="xs"><ExternalLink className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
          이번 주 트렌딩 토픽
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {trendingTopics.map((topic, index) => (
            <div key={index} className="text-center p-5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mx-auto mb-4">
                {topic.rank}
              </div>
              <h4 className="text-gray-800 mb-3 text-sm leading-tight">
                {topic.topic}
              </h4>
              <Badge variant="default" className="mb-3"> {/* Using default badge for now */}
                {topic.category}
              </Badge>
              <p className="text-sm text-purple-600">{topic.growth}</p>
            </div>
          ))}
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
