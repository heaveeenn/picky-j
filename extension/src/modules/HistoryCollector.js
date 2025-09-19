/**
 * HistoryCollector.js
 * 
 * Chrome History API를 사용해서 사용자의 브라우징 히스토리를 수집하고 분석
 * 사용자 벡터 생성을 위한 기초 데이터 제공
 */

import { HistoryContentExtractor } from './HistoryContentExtractor.js';

export class HistoryCollector {
  constructor(userSession = null) {
    this.userSession = userSession;
    console.log("📚 HistoryCollector 초기화");
    
    // 수집 설정
    this.config = {
      maxResults: 500,           // 최대 수집 개수
      daysBack: 30,              // 최근 N일
      excludeDomains: [          // 제외할 도메인들
        'chrome://',
        'chrome-extension://',
        'localhost',
        'chrome-search://',
        'newtab'
      ]
    };
  }

  /**
   * Raw 히스토리 수집 (콘텐츠 추출용)
   */
  async collectRawHistory() {
    console.log("📖 Raw 히스토리 수집 시작");
    
    try {
      // 1. 기본 히스토리 수집
      const historyItems = await this.getRecentHistory();
      console.log(`📊 수집된 히스토리 항목: ${historyItems.length}개`);
      
      // 2. 방문 정보만 추가
      const enrichedHistory = [];
      
      for (const item of historyItems) {
        try {
          const visits = await this.getVisitsForUrl(item.url);
          
          // 방문 방법들만 추출
          const visitMethods = visits.length > 0 ? 
            [...new Set(visits.map(v => v.transition))] : ['unknown'];
          
          enrichedHistory.push({
            ...item,
            visitMethods: visitMethods,
            totalVisits: visits.length,
            directVisits: visits.filter(v => ['typed', 'auto_bookmark', 'keyword'].includes(v.transition)).length
          });
        } catch (error) {
          console.warn(`⚠️ URL 방문 정보 수집 실패: ${item.url}`);
          // 실패해도 기본 정보로 추가
          enrichedHistory.push({
            ...item,
            visitMethods: ['unknown'],
            totalVisits: item.visitCount || 0,
            directVisits: item.typedCount || 0
          });
        }
      }
      
      console.log(`📊 Raw 데이터 수집 완료: ${enrichedHistory.length}개`);
      
      return {
        totalItems: enrichedHistory.length,
        timeRange: {
          start: new Date(Date.now() - this.config.daysBack * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        items: enrichedHistory
      };
      
    } catch (error) {
      console.error("❌ 히스토리 수집 실패:", error);
      throw error;
    }
  }

  /**
   * 최근 히스토리 기본 정보 수집
   */
  async getRecentHistory() {
    const startTime = Date.now() - (this.config.daysBack * 24 * 60 * 60 * 1000);
    
    return new Promise((resolve, reject) => {
      chrome.history.search({
        text: '',
        startTime: startTime,
        maxResults: this.config.maxResults
      }, (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(results || []);
        }
      });
    });
  }


  /**
   * 특정 URL의 방문 기록 상세 조회
   */
  async getVisitsForUrl(url) {
    return new Promise((resolve, reject) => {
      chrome.history.getVisits({ url: url }, (visits) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(visits || []);
        }
      });
    });
  }

  
  /**
   * 히스토리 + 콘텐츠 추출을 위한 통합 수집
   */
  async collectHistoryWithContent() {
    console.log("🔄 히스토리 + 콘텐츠 통합 수집 시작");
    
    try {
      // 1. 기본 히스토리 수집 및 분석
      const historyData = await this.collectRawHistory();
      
      // 2. HistoryContentExtractor 인스턴스 생성
      const contentExtractor = new HistoryContentExtractor();
      
      // 3. 전체 아이템의 실제 콘텐츠 추출 (500개)
      const contentResults = await contentExtractor.extractHistoryContent(historyData.items);
      
      console.log(`✅ 콘텐츠 추출 완료: ${contentResults.length}개`);
      
      // 4. 파이썬 서버로 히스토리 데이터 전송 (전용 API 사용)
      try {
        console.log("📤 히스토리 데이터 서버 전송 중...");
        
        const sendResult = await this.sendHistoryToServer(contentResults, historyData.timeRange);
        
        if (sendResult.success) {
          console.log("✅ 히스토리 데이터 서버 전송 완료:", sendResult.message);
        } else {
          console.error("❌ 히스토리 데이터 서버 전송 실패:", sendResult.error);
        }
        
      } catch (error) {
        console.error("❌ 히스토리 데이터 서버 전송 실패:", error);
        // 전송 실패해도 결과는 반환
      }
      
      return {
        ...historyData,
        contentExtractedItems: contentResults,
        contentExtractionSummary: {
          attempted: historyData.items.length,
          succeeded: contentResults.length,
          successRate: (contentResults.length / historyData.items.length * 100).toFixed(1) + '%',
          extractedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error("❌ 히스토리 + 콘텐츠 수집 실패:", error);
      throw error;
    }
  }

  /**
   * 히스토리 데이터를 파이썬 서버로 전송 (전용 API)
   */
  async sendHistoryToServer(contentResults, timeRange) {
    try {
      const serverUrl = 'http://localhost:8000';
      
      // 완전히 빈 콘텐츠만 필터링
      const filteredResults = contentResults.filter(item => {
        // 1. extractedContent가 없으면 제외
        if (!item.extractedContent) return false;

        // 2. title과 content 모두 비어있으면 제외 (하나라도 있으면 포함)
        const title = item.extractedContent.title || '';
        const content = item.extractedContent.content || '';

        return title.trim() || content.trim();
      });

      console.log(`🔍 콘텐츠 필터링: ${contentResults.length}개 → ${filteredResults.length}개`);

      // 필터링된 결과가 없으면 전송하지 않음
      if (filteredResults.length === 0) {
        console.log("⚠️ 전송할 유효한 콘텐츠가 없습니다.");
        return {
          success: true,
          message: "콘텐츠 추출 완료했으나 유효한 데이터 없음",
          insertedCount: 0,
          filteredCount: contentResults.length
        };
      }

      // 전송할 데이터 준비
      const historyPayload = {
        type: 'HISTORY_DATA',
        totalItems: filteredResults.length,
        collectedAt: new Date().toISOString(),
        timeRange: timeRange,
        userId: this.userSession?.getUserId() || 'dummy-user@picky.com', // UserSession에서 가져오기
        items: filteredResults.map(item => ({
          url: item.url,
          domain: new URL(item.url).hostname,
          title: item.title,
          visitCount: item.visitCount,
          typedCount: item.typedCount || 0,
          lastVisitTime: new Date(Math.floor(item.lastVisitTime / 1000)).toISOString(), // 마이크로초 → ISO 날짜
          visitMethods: item.visitMethods || ['unknown'],
          totalVisits: item.totalVisits || 0,
          directVisits: item.directVisits || 0,
          content: item.extractedContent ? {
            cleanTitle: item.extractedContent.title || '',
            cleanContent: item.extractedContent.content || '',
            excerpt: item.extractedContent.excerpt || '',
            wordCount: item.extractedContent.wordCount || 0,
            language: 'ko',
            extractionMethod: item.extractMethod || 'failed'
          } : null,
          userId: this.userSession?.getUserId() || 'dummy-user@picky.com'
        }))
      };
      
      console.log(`📤 히스토리 전송 시도: ${filteredResults.length}개 아이템 (필터링 후)`);
      
      // 히스토리 전용 API로 전송
      const response = await fetch(`${serverUrl}/user-logs/history-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyPayload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        success: true,
        message: result.message,
        insertedCount: result.insertedCount,
        successRate: result.successRate
      };
      
    } catch (error) {
      console.error("❌ 히스토리 서버 전송 실패:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}