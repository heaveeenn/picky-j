/**
 * DataCollector.js
 * 
 * 브라우징 데이터 수집기
 * - 체류시간 (timeSpent)
 * - 스크롤깊이 (scrollDepth) 
 * - 활성상태 (isActive)
 * - Readability.js 기반 콘텐츠 정제
 * - 한국시간 기반 타임스탬프
 * - 페이지 메타데이터
 */

import { Readability } from '@mozilla/readability';

export class DataCollector {
  constructor() {
    // 초기값 설정
    this.startTime = Date.now();
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
    this.isActive = true;
    this.isTrackingEnabled = true;
    this.isInitialized = false; // 초기화 완료 여부
    
    
    console.log("📊 DataCollector 시작:", window.location.href);
    
    // userId 캐시 및 토글 상태 확인 후 이벤트 리스너 등록
    this.initializeWithToggleCheck();
  }

  /**
   * 토글 상태 확인 후 초기화
   */
  async initializeWithToggleCheck() {
    await this.checkTrackingStatus();

    // 스토리지 변경 감지 - 실시간 토글 반영
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.isExtensionOn && namespace === 'sync') {
          this.isTrackingEnabled = changes.isExtensionOn.newValue !== false;
          console.log('🔄 토글 상태 변경:', this.isTrackingEnabled);
        }
      });
    }

    // 토글이 ON인 경우에만 이벤트 리스너 등록
    if (this.isTrackingEnabled) {
      this.setupEventListeners();
    } else {
      console.log('❌ 데이터 수집 비활성화 - 이벤트 리스너 스킵');
    }

    // 초기화 완료
    this.isInitialized = true;
    console.log('✅ DataCollector 초기화 완료');
  }

  /**
   * 토글 상태 확인
   */
  async checkTrackingStatus() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['isExtensionOn']);
        this.isTrackingEnabled = result.isExtensionOn !== false;
        console.log('📊 토글 상태:', this.isTrackingEnabled);
      }
    } catch (error) {
      console.error('토글 상태 확인 실패:', error);
      this.isTrackingEnabled = true; // fallback
    }
  }



  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 스크롤 추적
    window.addEventListener("scroll", () => {
      this.updateScrollDepth();
    });

    // 활성 상태 추적
    window.addEventListener("focus", () => {
      this.isActive = true;
    });

    window.addEventListener("blur", () => {
      this.isActive = false;
    });

  }

  /**
   * 스크롤 깊이 계산 및 업데이트
   */
  updateScrollDepth() {
    if (!this.isTrackingEnabled) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 현재 스크롤 비율 계산 (0-100%)
    this.scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
    
    // 최대 스크롤 깊이 업데이트
    this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);
  }

  /**
   * 현재까지의 체류시간 계산 (초) - 기존 방식
   */
  getTimeSpent() {
    return Math.round((Date.now() - this.startTime) / 1000);
  }


  /**
   * 한국시간(KST) 타임스탬프 생성
   */
  getKSTTimestamp() {
    const now = new Date();
    // 현재 UTC 시간에 9시간 더해서 KST 생성
    const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return {
      iso: kstTime.toISOString(),
      formatted: now.toLocaleString('ko-KR', {timeZone: 'Asia/Seoul'}), // 원본 시간을 KST로 포맷
      hour: kstTime.getHours(),
      dayOfWeek: kstTime.getDay(), // 0=일요일, 1=월요일...
      timeCategory: this.getTimeCategory(kstTime.getHours())
    };
  }

  /**
   * 시간대 카테고리 분류
   */
  getTimeCategory(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  /**
   * Readability.js 콘텐츠 추출
   */
  extractCleanContent() {
    try {
      // DOM 복제하여 원본 보존
      const documentClone = document.cloneNode(true);
      
      // Readability 객체 생성 및 파싱
      const reader = new Readability(documentClone, {
        debug: false,
        maxElemsToParse: 0,
        nbTopCandidates: 5,
        charThreshold: 500
      });
      
      const article = reader.parse();
      
      if (article) {
        return {
          success: true,
          cleanTitle: article.title || document.title,
          cleanContent: article.textContent || '',
          excerpt: article.excerpt || this.getMetaDescription(),
          readingTime: this.calculateReadingTime(article.textContent || ''),
          wordCount: this.countWords(article.textContent || ''),
          lang: article.lang || document.documentElement.lang || 'ko'
        };
      } else {
        console.log('⚠️ Readability 파싱 실패 - 기본 추출 방식 사용');
        return this.extractBasicContent();
      }
      
    } catch (error) {
      console.error('❌ Readability 추출 실패:', error);
      return this.extractBasicContent();
    }
  }

  /**
   * 기본 콘텐츠 추출 (Readability 실패시 fallback)
   */
  extractBasicContent() {
    const title = document.title || '';
    const pElements = document.querySelectorAll('p');
    
    const paragraphs = Array.from(pElements)
      .slice(0, 5)
      .map(p => p.textContent.trim())
      .filter(text => text.length > 20)
      .join(' ')
      .substring(0, 1000);

    return {
      success: false,
      cleanTitle: title,
      cleanContent: paragraphs,
      excerpt: this.getMetaDescription(),
      readingTime: this.calculateReadingTime(paragraphs),
      wordCount: this.countWords(paragraphs),
      lang: document.documentElement.lang || 'ko'
    };
  }

  /**
   * 메타 설명 추출
   */
  getMetaDescription() {
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc ? metaDesc.getAttribute('content') : '';
  }

  /**
   * 읽기 시간 계산 (분)
   */
  calculateReadingTime(text) {
    if (!text) return 0;
    const wordsPerMinute = 200; // 평균 읽기 속도
    const words = this.countWords(text);
    return Math.ceil(words / wordsPerMinute);
  }

  /**
   * 단어 수 계산 (한국어+영어 혼합)
   */
  countWords(text) {
    if (!text) return 0;
    const koreanWords = (text.match(/[가-힣]+/g) || []).join('').length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return koreanWords + englishWords;
  }

  /**
   * 페이지 메타데이터 수집 (간소화)
   */
  getPageMetadata() {
    return {
      // Open Graph 데이터 (있을 때만)
      ogTitle: this.getMetaProperty('og:title'),
      ogDescription: this.getMetaProperty('og:description'),
      
      // 기본 메타데이터
      description: this.getMetaDescription()
    };
  }

  /**
   * 메타 태그 속성값 가져오기
   */
  getMetaProperty(property) {
    const meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return meta ? meta.getAttribute('content') : '';
  }



  /**
   * 수집된 데이터 반환
   */
  async collectData() {
    if (!this.isTrackingEnabled) {
      console.log('❌ 데이터 수집 비활성화 - 수집 중단');
      return null;
    }


    const kstTime = this.getKSTTimestamp();
    const contentData = this.extractCleanContent();

    // 완전히 빈 콘텐츠만 필터링
    const title = contentData.cleanTitle || '';
    const content = contentData.cleanContent || '';

    if (!title.trim() && !content.trim()) {
      console.log('⚠️ 제목과 내용이 모두 비어있어 수집 중단');
      return null;
    }

    const data = {
      // 기본 페이지 정보
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      
      // 시간 정보 (한국시간)
      timestamp: kstTime.iso,
      timestampFormatted: kstTime.formatted,
      timeCategory: kstTime.timeCategory,
      dayOfWeek: kstTime.dayOfWeek,
      
      // 사용자 행동 데이터  
      timeSpent: this.getTimeSpent(), // 체류 시간
      maxScrollDepth: this.maxScrollDepth,
      
      // 콘텐츠 데이터 (Readability.js 기반)
      content: {
        cleanTitle: contentData.cleanTitle,
        cleanContent: contentData.cleanContent.substring(0, 2000), // 길이 제한
        excerpt: contentData.excerpt,
        wordCount: contentData.wordCount,
        language: contentData.lang,
        extractionMethod: contentData.success ? 'readability' : 'basic'
      }
    };

    console.log("📊 수집된 데이터:", {
      url: data.url,
      title: data.title.substring(0, 50) + '...',
      timeSpent: data.timeSpent,
      scrollDepth: data.maxScrollDepth,
      wordCount: data.content.wordCount
    });
    
    return data;
  }

}