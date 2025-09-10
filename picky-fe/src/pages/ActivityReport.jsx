import Box from '../components/Box';
import Badge from '../components/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Globe, Clock, TrendingUp, Users } from 'lucide-react';

const mockData = {
  todayStats: [
    { title: '방문한 사이트 수', value: '24', icon: Globe },
    { title: '총 브라우징 시간', value: '3시간 42분', icon: Clock },
    { title: '가장 오래 머문 사이트', value: 'GitHub', icon: Globe },
    { title: '가장 많이 방문한 카테고리', value: '개발/기술', icon: TrendingUp }
  ],
  categoryData: [
    { name: '개발/기술', value: 35, color: '#8b5cf6' },
    { name: '뉴스', value: 25, color: '#10b981' },
    { name: '교육', value: 20, color: '#f59e0b' },
    { name: '엔터테인먼트', value: 15, color: '#ef4444' },
    { name: '기타', value: 5, color: '#3b82f6' }
  ],
  hourlyActivity: [
    { hour: '06', activity: 2 },
    { hour: '09', activity: 15 },
    { hour: '12', activity: 8 },
    { hour: '15', activity: 12 },
    { hour: '18', activity: 20 },
    { hour: '21', activity: 10 }
  ],
  topKeywords: ['React', 'TypeScript', '머신러닝', 'UI/UX', '프론트엔드', 'JavaScript', 'AI', 'Design', 'GitHub', '개발']
};



const ActivityReport = () => {
  return (
    <div className="space-y-8">
      {/* 오늘의 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockData.todayStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Box key={index}>
              <div className="flex items-center">
                <div className="inline-flex p-3 rounded-lg bg-gray-100 mr-4">
                  <IconComponent className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="text-gray-800 font-bold text-xl">{stat.value}</p>
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
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mockData.hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Bar dataKey="activity" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">카테고리별 분포</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={mockData.categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {mockData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">상위 검색 키워드</h3>
          <div className="flex flex-wrap gap-2">
            {mockData.topKeywords.map((keyword, index) => (
              <Badge key={index} variant="default">
                {keyword}
              </Badge>
            ))}
          </div>
        </Box>

        <Box>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">상위 방문 사이트</h3>
          <div className="space-y-3">
            {[
              { name: 'GitHub', visits: 15, time: '2시간 30분' },
              { name: 'Stack Overflow', visits: 8, time: '45분' },
              { name: 'MDN Web Docs', visits: 6, time: '1시간 15분' },
            ].map((site, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div>
                  <div className="font-semibold">{site.name}</div>
                  <div className="text-sm text-gray-500">{site.visits}회 방문 · {site.time}</div>
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