/**
 * HistoryContentExtractor.js
 * 
 * 히스토리 URL들의 실제 콘텐츠를 추출하는 모듈
 * Offscreen Document 활용
 */

export class HistoryContentExtractor {
  constructor() {
    console.log("📚 HistoryContentExtractor 초기화");
    
    this.config = {
      batchSize: 5,           // 동시 처리 개수
      batchDelay: 3000,       // 배치 간 대기시간 (ms)
      fetchTimeout: 10000,    // fetch 타임아웃 (ms)
      maxRetries: 2,          // 재시도 횟수
      excludePatterns: [      // 제외할 URL 패턴
        'login', 'checkout', 'cart', 'payment',
        'auth', 'signin', 'signup', 'register'
      ]
    };
    
    // 크롬 버전 체크
    this.chromeVersion = this.getChromeVersion();
    this.supportsOffscreen = this.chromeVersion >= 109;
    
    console.log(`📱 Chrome ${this.chromeVersion} - ${this.supportsOffscreen ? 'hybrid' : 'fetch-only'} 모드`);
  }

  /**
   * 크롬 버전 확인
   */
  getChromeVersion() {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 메인 추출 함수 - 히스토리 아이템들의 콘텐츠 추출
   */
  async extractHistoryContent(historyItems) {
    console.log(`🚀 히스토리 콘텐츠 추출 시작: ${historyItems.length}개`);
    
    // 1. 필터링 - 처리 가능한 URL만 선별
    const filteredItems = this.filterProcessableItems(historyItems);
    console.log(`✅ 필터링 후: ${filteredItems.length}개 처리 예정`);
    
    if (filteredItems.length === 0) {
      console.log("⚠️ 처리 가능한 히스토리 아이템 없음");
      return [];
    }
    
    // 2. 배치별로 처리
    const results = [];
    const totalBatches = Math.ceil(filteredItems.length / this.config.batchSize);
    
    for (let i = 0; i < filteredItems.length; i += this.config.batchSize) {
      const batch = filteredItems.slice(i, i + this.config.batchSize);
      const batchNumber = Math.floor(i / this.config.batchSize) + 1;
      
      console.log(`📦 배치 ${batchNumber}/${totalBatches} 처리 중... (${batch.length}개)`);
      
      // 순차 처리 (offscreen document 충돌 방지)
      for (const item of batch) {
        try {
          const result = await this.extractSingleItem(item);
          if (result) {
            results.push(result);
          } else {
            console.warn(`⚠️ 추출 실패: ${item.url}`);
          }
        } catch (error) {
          console.warn(`⚠️ 추출 실패: ${item.url} - ${error.message}`);
        }
      }
      
      // 진행률 로그
      console.log(`📊 진행률: ${i + batch.length}/${filteredItems.length} (성공: ${results.length}개)`);
      
      // 마지막 배치가 아니면 대기
      if (i + this.config.batchSize < filteredItems.length) {
        await this.delay(this.config.batchDelay);
      }
    }
    
    console.log(`✅ 히스토리 콘텐츠 추출 완료: ${results.length}개 성공`);
    return results;
  }

  /**
   * 처리 가능한 아이템 필터링 (최소한의 필터링만)
   */
  filterProcessableItems(historyItems) {
    return historyItems.filter(item => {
      try {
        const url = new URL(item.url);
        
        // 1. HTTP/HTTPS만 처리
        if (!['http:', 'https:'].includes(url.protocol)) {
          return false;
        }
        
        // 2. 제외 패턴 체크
        const urlLower = item.url.toLowerCase();
        if (this.config.excludePatterns.some(pattern => urlLower.includes(pattern))) {
          return false;
        }
        
        // 3. 최소 조건 체크 (제목만)
        if (!item.title || item.title.length < 3) {
          return false;
        }
        
        return true;
      } catch (error) {
        console.warn(`⚠️ URL 파싱 실패: ${item.url}`);
        return false;
      }
    }); // 정렬 제거 - 원본 순서 유지
  }

  /**
   * 단일 아이템 콘텐츠 추출
   */
  async extractSingleItem(historyItem) {
    console.log(`🔍 콘텐츠 추출 시작: ${historyItem.url}`);
    
    let content = null;
    if (this.supportsOffscreen) {
      content = await this.extractWithOffscreen(historyItem.url);
    }
    
    if (content) {
      return {
        ...historyItem,
        extractedContent: content,
        extractedAt: new Date().toISOString(),
        extractMethod: content.method
      };
    }
    
    return null;
  }


  /**
   * Offscreen Document 방식으로 콘텐츠 추출
   */
  async extractWithOffscreen(url) {
    try {
      console.log(`🔧 offscreen 생성 시도: ${url}`);
      
      // Offscreen 문서 생성
      await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL('offscreen.html'),
        reasons: ['DOM_SCRAPING'],
        justification: 'Extract content from history URLs'
      });
      
      console.log(`✅ offscreen 문서 생성 완료: ${url}`);
      
      // Promise로 메시지 응답 대기
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Offscreen timeout'));
        }, 15000);
        
        // 메시지 리스너 등록 (한 번만)
        const messageListener = (message, sender, sendResponse) => {
          if (message.type === 'OFFSCREEN_EXTRACT_RESULT') {
            clearTimeout(timeout);
            chrome.runtime.onMessage.removeListener(messageListener);
            resolve(message);
          }
        };
        
        chrome.runtime.onMessage.addListener(messageListener);
        
        // offscreen에 메시지 전송 (전역 브로드캐스트)
        chrome.runtime.sendMessage({
          type: 'EXTRACT_CONTENT_OFFSCREEN',
          url: url
        }).catch(() => {
          // sendMessage 에러는 무시 (offscreen이 받을 것)
        });
      });
      
      // Offscreen 문서 정리
      await chrome.offscreen.closeDocument();
      
      if (result && result.success) {
        console.log(`✅ offscreen 성공: ${url}`);
        return { ...result.content, method: 'offscreen' };
      }
      
      return null;
      
    } catch (error) {
      console.log(`❌ offscreen 실패: ${url} - ${error.message}`);
      
      // 정리 시도
      try {
        await chrome.offscreen.closeDocument();
      } catch (e) {
        // 무시
      }
      
      return null;
    }
  }

  /**
   * 지연 함수
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 추출된 콘텐츠를 임베딩용 텍스트로 변환
   */
  convertToEmbeddingText(extractedItem) {
    const domain = new URL(extractedItem.url).hostname;
    const content = extractedItem.extractedContent;
    
    if (!content) return null;
    
    return `제목: ${content.title}
도메인: ${domain}
방문횟수: ${extractedItem.visitCount}
가중치: ${extractedItem.weight?.toFixed(3)}
본문: ${content.content}`;
  }
}