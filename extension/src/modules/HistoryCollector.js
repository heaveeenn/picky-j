/**
 * HistoryCollector.js
 * 
 * Chrome History API를 사용해서 사용자의 브라우징 히스토리를 수집하고 분석
 * 사용자 벡터 생성을 위한 기초 데이터 제공
 */

import { HistoryContentExtractor } from './HistoryContentExtractor.js';
import { DATA_ENGINE_URL, BACKEND_URL } from '../config/env.js';

export class HistoryCollector {
  constructor(userSession = null) {
    this.userSession = userSession;
    console.log("📚 HistoryCollector 초기화");

    // 수집 설정
    this.config = {
      maxResults: 500,           // 최대 수집 개수
      daysBack: 30,              // 최근 N일
      excludeDomains: this.getBaseExcludeDomains() // manifest + 기본 도메인 합치기
    };
  }

  /**
   * manifest.js의 exclude_matches와 기본 도메인들을 합친 리스트 생성
   */
  getBaseExcludeDomains() {
    // 기본 제외 도메인들 (히스토리 전용)
    const basicExcludes = [
      'chrome://',
      'chrome-extension://',
      'localhost',
      'chrome-search://',
      'newtab',
      'chat.openai.com',
      'chatgpt.com',
      'j13c102.p.ssafy.io'  // picky 대시보드 제외
    ];

    // manifest.js exclude_matches에서 추출한 도메인들 (하드코딩)
    const manifestExcludes = [
      // OAuth/로그인
      'accounts.google.com',
      'oauth.googleusercontent.com',

      // 이메일/메신저/협업
      'mail.google.com',
      'mail.naver.com',
      'outlook.live.com',
      'outlook.office.com',
      'outlook.com',
      'web.telegram.org',
      'web.whatsapp.com',
      'slack.com',
      'teams.microsoft.com',
      'discord.com',
      'zoom.us',
      'meet.google.com',

      // 클라우드/저장소
      'drive.google.com',
      'dropbox.com',
      'onedrive.live.com',
      'sharepoint.com',
      'box.com',
      'mega.nz',
      'pcloud.com',

      // 결제/PG/간편결제
      'kakaopay.com',
      'pay.naver.com',
      'paypal.com',
      'toss.im',
      'tosspayments.com',
      'iamport.kr',
      'kcp.co.kr',
      'nicepay.co.kr',
      'kgmobilians.com',
      'danal.co.kr',
      'payco.com',
      'smilepay.com',
      'pay.google.com',
      'pay.apple.com',
      'alipay.com',
      'pay.weixin.qq.com',

      // 은행/증권/카드
      'kbstar.com',
      'hanafn.com',
      'shinhan.com',
      'wooribank.com',
      'nhbank.com',
      'ibk.co.kr',
      'kakaobank.com',
      'tossbank.com',
      'sc.co.kr',
      'citibank.co.kr',
      'kbanknow.com',
      'busanbank.co.kr',
      'kyongnambank.co.kr',
      'dgb.co.kr',
      'jbbank.co.kr',
      'suhyup-bank.com',
      'kdb.co.kr',
      'kbsec.com',
      'nhqv.com',
      'shinhansec.com',
      'miraeasset.com',
      'samsungsecurities.co.kr',
      'kiwoom.com',
      'truefriend.com',
      'daishin.com',
      'ebestsec.co.kr',
      'hanaw.com',
      'kbcard.com',
      'hyundaicard.com',
      'shinhancard.com',
      'samsungcard.com',
      'bccard.com',
      'lottecard.co.kr',
      'nhcard.co.kr',
      'wooricard.com',
      'hanacard.co.kr',

      // 정부/공공
      'go.kr',
      'gov.kr',
      'assembly.go.kr',
      'president.go.kr',
      'police.go.kr',
      'court.go.kr',
      'korea.kr',

      // picky 대시보드
      'j13c102.p.ssafy.io'
    ];

    // 중복 제거 후 합치기
    const allDomains = [...new Set([...basicExcludes, ...manifestExcludes])];
    console.log(`📋 기본 제외 도메인: ${allDomains.length}개 (기본: ${basicExcludes.length}, manifest: ${manifestExcludes.length})`);

    return allDomains;
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
   * 최근 히스토리 기본 정보 수집 (제외 도메인 필터링 적용)
   */
  async getRecentHistory() {
    const startTime = Date.now() - (this.config.daysBack * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      chrome.history.search({
        text: '',
        startTime: startTime,
        maxResults: this.config.maxResults * 2 // 필터링으로 인한 감소 고려하여 2배로 가져오기
      }, (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          // excludeDomains 필터링 적용
          const filteredResults = (results || []).filter(item => {
            try {
              const url = new URL(item.url);
              const hostname = url.hostname;

              // 제외 도메인 체크
              return !this.config.excludeDomains.some(excludeDomain => {
                if (excludeDomain.includes('://')) {
                  // 프로토콜 포함된 경우 (chrome://, localhost:8080 등)
                  return item.url.startsWith(excludeDomain);
                } else {
                  // 도메인명만 있는 경우 정확한 매칭
                  return hostname === excludeDomain || hostname.endsWith('.' + excludeDomain);
                }
              });
            } catch (error) {
              console.warn(`⚠️ URL 파싱 실패: ${item.url}`);
              return false; // 파싱 실패 시 제외
            }
          }).slice(0, this.config.maxResults); // 최대 개수로 제한

          console.log(`📋 히스토리 필터링: ${(results || []).length}개 → ${filteredResults.length}개`);
          resolve(filteredResults);
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
   * 중립적 더미 데이터 생성 (빈 히스토리 상황용)
   */
  createNeutralDummyData() {
    const now = new Date();

    return {
      url: "https://www.wikipedia.org/",
      title: "Wikipedia - 자유 백과사전",
      visitCount: 1,
      typedCount: 1,
      lastVisitTime: now.getTime(), // 숫자 timestamp로 저장
      visitMethods: ['typed'],
      totalVisits: 1,
      directVisits: 1,
      extractedContent: {
        title: "Wikipedia - 자유 백과사전",
        content: "위키백과는 전 세계 언어로 제공되는 인터넷 자유 백과사전입니다. 모든 분야에 대한 중립적이고 객관적인 정보를 제공하여 지식의 공유를 목표로 합니다. 과학, 역사, 기술, 예술, 문화 등 다양한 주제를 다루며 모든 사용자가 편집할 수 있는 열린 플랫폼입니다.",
        excerpt: "전 세계 언어로 제공되는 인터넷 자유 백과사전으로, 모든 분야에 대한 중립적이고 객관적인 정보를 제공합니다.",
        wordCount: 67
      },
      extractedAt: now.toISOString(),
      extractMethod: 'dummy',
      userId: this.userSession?.getUserId() || 'anonymous-user'
    };
  }

  /**
   * lastVisitTime을 KST ISO 문자열로 변환 (안전 처리)
   */
  convertToKSTISOString(lastVisitTime) {
    try {
      // 숫자 timestamp인 경우 KST로 변환
      if (typeof lastVisitTime === 'number' && lastVisitTime > 0) {
        return new Date(lastVisitTime + 9 * 60 * 60 * 1000).toISOString();
      }

      // 이미 ISO 문자열인 경우 그대로 반환
      if (typeof lastVisitTime === 'string') {
        return lastVisitTime;
      }

      // 잘못된 값인 경우 현재 시간 반환
      return new Date().toISOString();
    } catch (error) {
      console.warn(`⚠️ lastVisitTime 변환 실패: ${lastVisitTime}`, error);
      return new Date().toISOString();
    }
  }

  /**
   * 백엔드에서 사용자 제외 도메인 목록 가져오기
   */
  async fetchUserBlockedDomains() {
    try {
      const userId = this.userSession?.getUserId();
      if (!userId) {
        console.log("⚠️ 사용자 ID가 없어 제외 도메인 조회 불가");
        return [];
      }

      const response = await fetch(`${BACKEND_URL}/api/users/me/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.userSession.jwt}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        console.log("❌ 사용자 설정 API 호출 실패:", response.status);
        return [];
      }

      const result = await response.json();
      console.log("✅ 사용자 설정 조회 결과:", result);

      // API 응답 구조: { success: boolean, message: string, data: UserSettingsResponseDto }
      if (result.success && result.data && result.data.blockedDomains) {
        console.log(`📋 사용자 제외 도메인: ${result.data.blockedDomains.length}개`);
        return result.data.blockedDomains;
      }

      return [];

    } catch (error) {
      console.error("❌ 사용자 제외 도메인 조회 실패:", error);
      return []; // 에러 시 빈 배열 반환
    }
  }

  /**
   * 사용자 프로필 존재 여부 체크
   */
  async checkUserProfileExists() {
    try {
      const userId = this.userSession?.getUserId();
      if (!userId) {
        console.log("⚠️ 사용자 ID가 없어 프로필 체크 불가");
        return false;
      }

      const response = await fetch(`${DATA_ENGINE_URL}/user-logs/users/${encodeURIComponent(userId)}/profile-exists`);

      if (!response.ok) {
        console.log("❌ 프로필 체크 API 호출 실패:", response.status);
        return false;
      }

      const result = await response.json();
      console.log("✅ 프로필 체크 결과:", result);

      return result.exists;

    } catch (error) {
      console.error("❌ 프로필 체크 실패:", error);
      return false; // 에러 시 히스토리 수집 진행
    }
  }

  /**
   * 히스토리 + 콘텐츠 추출을 위한 통합 수집
   */
  async collectHistoryWithContent() {
    console.log("🔄 히스토리 + 콘텐츠 통합 수집 시작");

    // 1. 사용자 프로필 존재 여부 체크
    console.log("🔍 사용자 프로필 존재 여부 확인 중...");
    const profileExists = await this.checkUserProfileExists();

    if (profileExists) {
      console.log("⏭️ 사용자 프로필이 이미 존재하여 히스토리 수집을 건너뜁니다.");
      return {
        skipped: true,
        reason: "profile_already_exists",
        message: "사용자 프로필이 이미 존재하여 히스토리 수집을 건너뛰었습니다.",
        userId: this.userSession?.getUserId()
      };
    }

    console.log("✅ 프로필이 없어 히스토리 수집을 진행합니다.");

    // 2. 사용자 제외 도메인 목록 가져오기
    console.log("📋 사용자 제외 도메인 목록 조회 중...");
    const userBlockedDomains = await this.fetchUserBlockedDomains();

    // 기본 제외 도메인과 합치기
    const allExcludeDomains = [...this.config.excludeDomains, ...userBlockedDomains];
    console.log(`🚫 전체 제외 도메인: ${allExcludeDomains.length}개 (기본: ${this.config.excludeDomains.length}개, 사용자: ${userBlockedDomains.length}개)`);

    // 제외 도메인 임시 업데이트
    const originalExcludeDomains = this.config.excludeDomains;
    this.config.excludeDomains = allExcludeDomains;

    try {
      // 3. 기본 히스토리 수집 및 분석
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
    } finally {
      // 제외 도메인 원래대로 복원
      this.config.excludeDomains = originalExcludeDomains;
      console.log("🔄 제외 도메인 설정 원래대로 복원");
    }
  }

  /**
   * 히스토리 데이터를 파이썬 서버로 전송 (전용 API)
   */
  async sendHistoryToServer(contentResults, timeRange) {
    try {
      
      // 완전히 빈 콘텐츠만 필터링
      let filteredResults = contentResults.filter(item => {
        // 1. extractedContent가 없으면 제외
        if (!item.extractedContent) return false;

        // 2. title과 content 모두 비어있으면 제외 (하나라도 있으면 포함)
        const title = item.extractedContent.title || '';
        const content = item.extractedContent.content || '';

        return title.trim() || content.trim();
      });

      console.log(`🔍 콘텐츠 필터링: ${contentResults.length}개 → ${filteredResults.length}개`);

      // 필터링된 결과가 없으면 중립적 더미 데이터 생성
      if (filteredResults.length === 0) {
        console.log("⚠️ 전송할 유효한 콘텐츠가 없음 - 중립적 더미 데이터 생성 중...");

        // 중립적 더미 데이터 생성
        const neutralDummyItem = this.createNeutralDummyData();
        filteredResults = [neutralDummyItem];

        console.log("✅ 중립적 더미 데이터 생성 완료 - 기본 프로필 벡터 생성용");
      }

      // 전송할 데이터 준비
      const historyPayload = {
        type: 'HISTORY_DATA',
        totalItems: filteredResults.length,
        collectedAt: new Date().toISOString(),
        timeRange: timeRange,
        userId: this.userSession?.getUserId() || 'anonymous-user', // UserSession에서 가져오기
        items: filteredResults.map(item => ({
          url: item.url,
          domain: new URL(item.url).hostname,
          title: item.title,
          visitCount: item.visitCount,
          typedCount: item.typedCount || 0,
          lastVisitTime: this.convertToKSTISOString(item.lastVisitTime), // 로컬 시간을 KST로 변환
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
          userId: this.userSession?.getUserId() || 'anonymous-user'
        }))
      };
      
      console.log(`📤 히스토리 전송 시도: ${filteredResults.length}개 아이템 (필터링 후)`);
      
      // 히스토리 전용 API로 전송
      const response = await fetch(`${DATA_ENGINE_URL}/user-logs/history-data`, {
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