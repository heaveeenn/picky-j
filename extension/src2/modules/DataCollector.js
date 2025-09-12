/**
 * DataCollector.js
 * 
 * 브라우징 데이터 순수 수집 전담 모듈
 * - 사용자 행동 데이터 (스크롤, 클릭, 체류시간)
 * - 페이지 콘텐츠 데이터 (제목, 본문, 메타정보)
 * - 뷰포트 가시성 데이터
 * - Readability.js를 활용한 정제된 콘텐츠 추출
 * 
 * 관심도 측정이나 ML 분석은 Python 서버에서 처리
 */

import { Readability } from '@mozilla/readability';
import { STORAGE_KEYS, DATA_COLLECTION } from '../config/constants.js';

export class DataCollector {
  constructor() {
    this.pageLoadTime = Date.now();
    this.scrollDepth = 0;
    this.maxScrollDepth = 0;
    this.isActive = true;
    this.isTrackingEnabled = true;
    
    console.log("📊 DataCollector initialized for:", window.location.href);
  }

  /**
   * 토글 상태 확인 및 초기화
   */
  async checkTrackingStatus() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get([STORAGE_KEYS.TRACKING_ENABLED]);
        this.isTrackingEnabled = result[STORAGE_KEYS.TRACKING_ENABLED] !== false;
        console.log('📊 Initial tracking status:', this.isTrackingEnabled);
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
      this.isTrackingEnabled = true; // fallback
    }
  }

  /**
   * 이벤트 리스너 초기화
   */
  async initializeEventListeners() {
    await this.checkTrackingStatus();
    
    // 스토리지 변경 감지 - 실시간 토글 반영
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (changes[STORAGE_KEYS.TRACKING_ENABLED] && namespace === 'sync') {
        this.isTrackingEnabled = changes[STORAGE_KEYS.TRACKING_ENABLED].newValue !== false;
        console.log('🔄 Tracking status changed:', this.isTrackingEnabled);
      }
    });

    // 토글이 OFF면 이벤트 리스너 등록하지 않음
    if (!this.isTrackingEnabled) {
      console.log('❌ Tracking disabled - skipping event listeners');
      return;
    }

    // 사용자 행동 추적 이벤트 등록
    this.attachEventListeners();
  }

  /**
   * 실제 이벤트 리스너 등록
   */
  attachEventListeners() {
    window.addEventListener("scroll", this.trackScroll.bind(this));
    window.addEventListener("focus", () => (this.isActive = true));
    window.addEventListener("blur", () => (this.isActive = false));
    window.addEventListener("beforeunload", () => this.collectFinalData());
  }

  /**
   * 스크롤 이벤트 추적
   */
  trackScroll() {
    if (!this.isTrackingEnabled) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    this.scrollDepth = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100
    );
    this.maxScrollDepth = Math.max(this.maxScrollDepth, this.scrollDepth);
  }


  /**
   * 뷰포트 가시성 체크 - 실제로 보이는 요소인지 확인
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= windowWidth &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * 뷰포트에 보이는 텍스트 요소들 수집
   */
  getVisibleTextElements() {
    const selectors = 'p, h1, h2, h3, h4, article, main, .content, [role="main"]';
    const elements = document.querySelectorAll(selectors);
    
    return Array.from(elements).filter(el => {
      // 기본 가시성 체크
      if (!this.isInViewport(el)) return false;
      
      // 텍스트 길이 체크
      const text = el.textContent.trim();
      if (text.length < 10) return false;
      
      // 숨겨진 요소 체크
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Readability.js를 사용한 정제된 페이지 콘텐츠 추출
   */
  extractPageContent() {
    try {
      // Readability.js를 사용한 정제된 콘텐츠 추출
      const readabilityResult = this.extractCleanContent();
      
      // 뷰포트에 보이는 콘텐츠도 함께 수집 (기존 방식 유지)
      const visibleElements = this.getVisibleTextElements();
      const visibleContent = visibleElements
        .map(el => el.textContent.trim())
        .filter(text => text.length > 20)
        .join(' ')
        .substring(0, 1000);

      // 기본 정보 (fallback용)
      const basicInfo = this.extractBasicContent();

      return {
        // Readability.js 정제 결과 (최우선)
        cleanTitle: readabilityResult.cleanTitle || basicInfo.title,
        cleanContent: readabilityResult.cleanContent || basicInfo.content,
        excerpt: readabilityResult.excerpt || this.getMetaDescription(),
        readingTime: readabilityResult.readingTime || 0,
        wordCount: readabilityResult.wordCount || 0,
        
        // 기존 방식 결과 (호환성 및 비교용)
        title: basicInfo.title,
        headings: basicInfo.headings,
        content: basicInfo.content,
        
        // 사용자 가시성 데이터
        visibleContent: visibleContent,
        visibleElementsCount: visibleElements.length,
        
        // 메타 정보
        description: this.getMetaDescription(),
        pageHeight: document.documentElement.scrollHeight,
        pageWidth: document.documentElement.scrollWidth,
        
        // 품질 지표
        extractionMethod: readabilityResult.success ? 'readability' : 'fallback',
        contentQuality: this.assessContentQuality(readabilityResult, basicInfo)
      };
      
    } catch (error) {
      console.error('❌ Error in extractPageContent:', error);
      // 에러 발생시 기본 추출 방식으로 fallback
      return this.extractBasicContentFallback();
    }
  }

  /**
   * Readability.js를 사용한 깨끗한 콘텐츠 추출
   */
  extractCleanContent() {
    try {
      // DOM을 복제하여 원본을 보존
      const documentClone = document.cloneNode(true);
      
      // Readability 객체 생성 및 파싱
      const reader = new Readability(documentClone, {
        // 옵션 설정
        debug: false,
        maxElemsToParse: 0, // 제한 없음
        nbTopCandidates: 5,
        charThreshold: 500,
        classesToPreserve: ['caption', 'credit']
      });
      
      const article = reader.parse();
      
      if (article) {
        // 성공적으로 파싱된 경우
        return {
          success: true,
          cleanTitle: article.title || document.title,
          cleanContent: article.textContent || '',
          excerpt: article.excerpt || '',
          readingTime: this.calculateReadingTime(article.textContent || ''),
          wordCount: this.countWords(article.textContent || ''),
          htmlContent: article.content || '', // HTML 버전 (필요시)
          
          // Readability 메타데이터
          byline: article.byline || '', // 저자
          dir: article.dir || '',       // 텍스트 방향
          lang: article.lang || '',     // 언어
          publishedTime: article.publishedTime || null
        };
      } else {
        console.log('⚠️ Readability failed to parse content');
        return { success: false };
      }
      
    } catch (error) {
      console.error('❌ Readability extraction failed:', error);
      return { success: false };
    }
  }

  /**
   * 기본 콘텐츠 추출 (Readability 실패시 fallback)
   */
  extractBasicContent() {
    const titleElement = document.querySelector("title");
    const h1Elements = document.querySelectorAll("h1");
    const pElements = document.querySelectorAll("p");

    const title = titleElement ? titleElement.textContent.trim() : "";
    const headings = Array.from(h1Elements)
      .map((h) => h.textContent.trim())
      .join(" ");
    const paragraphs = Array.from(pElements)
      .slice(0, 5) // 더 많은 문단 수집 (Readability 대비)
      .map((p) => p.textContent.trim())
      .filter((text) => text.length > 20)
      .join(" ")
      .substring(0, 1500); // 더 긴 텍스트 허용

    return { title, headings, content: paragraphs };
  }

  /**
   * 완전한 fallback 콘텐츠 (에러 발생시)
   */
  extractBasicContentFallback() {
    const basicInfo = this.extractBasicContent();
    
    return {
      cleanTitle: basicInfo.title,
      cleanContent: basicInfo.content,
      excerpt: this.getMetaDescription(),
      readingTime: this.calculateReadingTime(basicInfo.content),
      wordCount: this.countWords(basicInfo.content),
      
      title: basicInfo.title,
      headings: basicInfo.headings,
      content: basicInfo.content,
      
      visibleContent: basicInfo.content.substring(0, 1000),
      visibleElementsCount: 0,
      
      description: this.getMetaDescription(),
      pageHeight: document.documentElement.scrollHeight,
      pageWidth: document.documentElement.scrollWidth,
      
      extractionMethod: 'error_fallback',
      contentQuality: 'low'
    };
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
   * 단어 수 계산
   */
  countWords(text) {
    if (!text) return 0;
    // 한국어+영어 혼합 텍스트 고려
    const koreanWords = (text.match(/[가-힣]+/g) || []).join('').length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return koreanWords + englishWords;
  }

  /**
   * 콘텐츠 품질 평가
   */
  assessContentQuality(readabilityResult, basicResult) {
    if (!readabilityResult.success) return 'low';
    
    const cleanLength = readabilityResult.cleanContent?.length || 0;
    const basicLength = basicResult.content?.length || 0;
    
    if (cleanLength > basicLength * 1.5 && cleanLength > 500) {
      return 'high'; // Readability가 더 많은 콘텐츠 추출 + 충분한 길이
    } else if (cleanLength > 200) {
      return 'medium'; // 적당한 길이
    } else {
      return 'low'; // 너무 짧음
    }
  }

  /**
   * 메타 설명 추출
   */
  getMetaDescription() {
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc ? metaDesc.getAttribute("content") : "";
  }

  /**
   * 도메인 기반 기본 카테고리 분류 (간단한 매핑)
   */
  getDomainCategory() {
    const domain = window.location.hostname;
    const categories = {
      "github.com": "tech",
      "stackoverflow.com": "tech",
      "youtube.com": "entertainment",
      "naver.com": "portal",
      "google.com": "search",
      "news.": "news",
      ".edu": "education",
      wiki: "knowledge",
    };

    for (const [pattern, category] of Object.entries(categories)) {
      if (domain.includes(pattern)) {
        return category;
      }
    }
    return "general";
  }

  /**
   * 최종 브라우징 데이터 수집 및 생성
   */
  collectBrowsingData() {
    if (!this.isTrackingEnabled) {
      console.log('❌ Tracking disabled - skipping data collection');
      return null;
    }

    const timeSpent = Date.now() - this.pageLoadTime;
    const pageContent = this.extractPageContent();

    const browsingData = {
      // 기본 페이지 정보
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title || pageContent.title,
      category: this.getDomainCategory(),
      timestamp: new Date().toISOString(),
      
      // 사용자 행동 데이터 (Python에서 관심도 분석용)
      timeSpent: Math.round(timeSpent / 1000), // 초 단위
      scrollDepth: this.maxScrollDepth,        // 최대 스크롤 깊이 (%)
      isActive: this.isActive,                 // 탭 활성 상태
      
      // 페이지 콘텐츠 데이터 (임베딩 생성용)
      pageContent: pageContent,
      
      // 메타 정보
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      
      // 수집 시점 정보
      collectedAt: new Date().toISOString(),
      collectorVersion: "1.0.0"
    };

    console.log("📊 Browsing data collected:", {
      url: browsingData.url,
      title: browsingData.title.substring(0, 50) + "...",
      timeSpent: browsingData.timeSpent,
      scrollDepth: browsingData.scrollDepth,
      contentLength: browsingData.pageContent.visibleContent.length
    });

    return browsingData;
  }

  /**
   * 페이지 떠날 때 최종 데이터 수집
   */
  collectFinalData() {
    const data = this.collectBrowsingData();
    if (data) {
      // 최소 체류시간 미만은 의미 없는 방문으로 간주 (실수 클릭 등)
      if (data.timeSpent >= DATA_COLLECTION.MIN_TIME_SPENT) {
        return data;
      } else {
        console.log("⏭️ Skipping data - too short visit:", data.timeSpent, "seconds");
      }
    }
    return null;
  }

  /**
   * 중간 데이터 저장 (5분마다 실행)
   */
  collectInterimData() {
    const timeSpent = Date.now() - this.pageLoadTime;
    
    // 5분 이상 체류한 경우 중간 저장
    if (timeSpent > 5 * 60 * 1000) {
      const data = this.collectBrowsingData();
      if (data) {
        this.pageLoadTime = Date.now(); // 타이머 리셋
        return data;
      }
    }
    return null;
  }

  /**
   * 토글 OFF 시 강제 데이터 수집 (현재 상태 보존)
   */
  forceCollectData() {
    console.log("🔄 Force collecting data due to toggle OFF");
    return this.collectBrowsingData();
  }
}