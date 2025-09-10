/**
 * HistoryCollector.js
 * 
 * Chrome History API를 사용해서 사용자의 브라우징 히스토리를 수집하고 분석
 * 사용자 벡터 생성을 위한 기초 데이터 제공
 */

export class HistoryCollector {
  constructor() {
    console.log("📚 HistoryCollector 초기화");
    
    // 수집 설정
    this.config = {
      maxResults: 1000,           // 최대 수집 개수
      daysBack: 30,              // 최근 N일
      minVisitCount: 2,          // 최소 방문 횟수
      minTimeSpent: 30,          // 최소 체류시간(초) - 추정값
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
   * 전체 히스토리 수집 및 분석
   */
  async collectUserHistory() {
    console.log("📖 사용자 히스토리 수집 시작");
    
    try {
      // 1. 기본 히스토리 수집
      const historyItems = await this.getRecentHistory();
      console.log(`📊 수집된 히스토리 항목: ${historyItems.length}개`);
      
      // 2. 상세 방문 정보 수집
      const detailedHistory = await this.enrichHistoryWithVisits(historyItems);
      console.log(`📊 상세 정보 수집 완료: ${detailedHistory.length}개`);
      
      // 3. 필터링 및 정제
      const filteredHistory = this.filterRelevantHistory(detailedHistory);
      console.log(`📊 필터링 후: ${filteredHistory.length}개`);
      
      // 4. 가중치 계산
      const weightedHistory = this.calculateWeights(filteredHistory);
      console.log(`📊 가중치 계산 완료`);
      
      // 5. 최종 요약 정보
      const summary = this.generateSummary(weightedHistory);
      
      return {
        totalItems: weightedHistory.length,
        timeRange: {
          start: new Date(Date.now() - this.config.daysBack * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        items: weightedHistory,
        summary: summary
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
   * 각 히스토리 항목에 상세 방문 정보 추가
   */
  async enrichHistoryWithVisits(historyItems) {
    const enrichedItems = [];
    
    for (const item of historyItems) {
      try {
        const visits = await this.getVisitsForUrl(item.url);
        
        // 방문 정보 분석
        const visitAnalysis = this.analyzeVisits(visits);
        
        enrichedItems.push({
          ...item,
          visits: visits,
          analysis: visitAnalysis
        });
        
      } catch (error) {
        console.warn(`⚠️ URL 방문 정보 수집 실패: ${item.url}`, error);
        // 기본 정보만으로도 추가
        enrichedItems.push({
          ...item,
          visits: [],
          analysis: {
            totalVisits: item.visitCount || 0,
            directVisits: item.typedCount || 0,
            estimatedTimeSpent: 60, // 기본값
            visitMethods: ['unknown']
          }
        });
      }
    }
    
    return enrichedItems;
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
   * 방문 기록 분석
   */
  analyzeVisits(visits) {
    if (!visits.length) {
      return {
        totalVisits: 0,
        directVisits: 0,
        estimatedTimeSpent: 0,
        visitMethods: []
      };
    }

    const methods = visits.map(v => v.transition);
    const directMethods = ['typed', 'auto_bookmark', 'keyword'];
    const directVisits = methods.filter(m => directMethods.includes(m)).length;
    
    // 체류시간 추정 (연속 방문 간의 시간차 기반)
    let estimatedTimeSpent = 0;
    for (let i = 0; i < visits.length - 1; i++) {
      const timeDiff = visits[i].visitTime - visits[i + 1].visitTime;
      if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { // 30분 이내
        estimatedTimeSpent += timeDiff / 1000;
      }
    }
    
    // 마지막 방문은 평균 추정 (2분)
    estimatedTimeSpent += 120;

    return {
      totalVisits: visits.length,
      directVisits: directVisits,
      estimatedTimeSpent: Math.round(estimatedTimeSpent),
      visitMethods: [...new Set(methods)]
    };
  }

  /**
   * 관련성 있는 히스토리 필터링
   */
  filterRelevantHistory(historyItems) {
    return historyItems.filter(item => {
      // 1. 제외 도메인 체크
      const domain = new URL(item.url).hostname;
      if (this.config.excludeDomains.some(excluded => 
        item.url.includes(excluded) || domain.includes(excluded))) {
        return false;
      }

      // 2. 최소 방문 횟수 체크
      if (item.visitCount < this.config.minVisitCount) {
        return false;
      }

      // 3. 최소 체류시간 체크
      if (item.analysis.estimatedTimeSpent < this.config.minTimeSpent) {
        return false;
      }

      // 4. 제목이 있어야 함
      if (!item.title || item.title.trim().length < 3) {
        return false;
      }

      return true;
    });
  }

  /**
   * 가중치 계산
   */
  calculateWeights(historyItems) {
    const now = Date.now();
    
    return historyItems.map(item => {
      // 1. 방문 횟수 가중치 (0-1)
      const visitWeight = Math.min(item.visitCount / 10, 1) * 0.3;
      
      // 2. 최근성 가중치 (0-1)
      const daysAgo = (now - item.lastVisitTime) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.max(0, (30 - daysAgo) / 30) * 0.4;
      
      // 3. 방문 방법 가중치 (0-1)
      const directRatio = item.analysis.directVisits / item.analysis.totalVisits;
      const methodWeight = directRatio * 0.2;
      
      // 4. 체류시간 가중치 (0-1)
      const timeWeight = Math.min(item.analysis.estimatedTimeSpent / 300, 1) * 0.1;
      
      // 총 가중치
      const totalWeight = visitWeight + recencyWeight + methodWeight + timeWeight;
      
      return {
        ...item,
        weight: totalWeight,
        weightBreakdown: {
          visit: visitWeight,
          recency: recencyWeight,
          method: methodWeight,
          time: timeWeight
        }
      };
    }).sort((a, b) => b.weight - a.weight); // 가중치 순으로 정렬
  }

  /**
   * 요약 정보 생성
   */
  generateSummary(weightedHistory) {
    const domains = {};
    let totalWeight = 0;

    weightedHistory.forEach(item => {
      const domain = new URL(item.url).hostname;
      
      // 도메인별 집계
      if (!domains[domain]) {
        domains[domain] = { count: 0, weight: 0 };
      }
      domains[domain].count++;
      domains[domain].weight += item.weight;
      
      totalWeight += item.weight;
    });

    return {
      totalItems: weightedHistory.length,
      totalWeight: totalWeight,
      averageWeight: totalWeight / weightedHistory.length,
      topDomains: Object.entries(domains)
        .sort(([,a], [,b]) => b.weight - a.weight)
        .slice(0, 10)
        .map(([domain, data]) => ({
          domain,
          count: data.count,
          weight: data.weight,
          percentage: (data.weight / totalWeight * 100).toFixed(1)
        })),
      weightDistribution: {
        high: weightedHistory.filter(item => item.weight > 0.7).length,
        medium: weightedHistory.filter(item => item.weight > 0.4 && item.weight <= 0.7).length,
        low: weightedHistory.filter(item => item.weight <= 0.4).length
      }
    };
  }

  /**
   * 히스토리 데이터를 텍스트로 변환 (임베딩용)
   */
  convertToEmbeddingText(historyItem) {
    const domain = new URL(historyItem.url).hostname;
    const methods = historyItem.analysis.visitMethods.join(', ');
    
    return `제목: ${historyItem.title}\n도메인: ${domain}\n방문횟수: ${historyItem.visitCount}\n방문방법: ${methods}\n체류시간: ${historyItem.analysis.estimatedTimeSpent}초`;
  }
}