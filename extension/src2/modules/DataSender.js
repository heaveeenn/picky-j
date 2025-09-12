/**
 * DataSender.js
 * 
 * Python FastAPI 서버 통신 전담 모듈
 * - 브라우징 데이터 전송
 * - ML 분석 요청 (임베딩, 카테고리 분류)
 * - 배치 처리 및 큐 관리
 * - 에러 처리 및 재시도 로직
 * 
 * 관심도 측정 및 임베딩 생성은 Python 서버에서 처리
 */

import { API_CONFIG, STORAGE_KEYS, DATA_COLLECTION } from '../config/constants.js';

export class DataSender {
  constructor() {
    // 데이터 큐 및 상태 관리
    this.dataQueue = [];
    this.isProcessing = false;
    this.isTrackingEnabled = true;
    
    console.log("📤 DataSender initialized");
    this.initializePeriodicSync();
  }

  /**
   * 사용자 ID 가져오기
   */
  async getUserId() {
    const userData = await chrome.storage.sync.get([STORAGE_KEYS.USER_ID]);
    return userData[STORAGE_KEYS.USER_ID] || 'anonymous';
  }

  /**
   * 인증 토큰 가져오기
   */
  async getAuthToken() {
    const authData = await chrome.storage.sync.get([STORAGE_KEYS.AUTH_TOKEN]);
    return authData[STORAGE_KEYS.AUTH_TOKEN] ? `Bearer ${authData[STORAGE_KEYS.AUTH_TOKEN]}` : '';
  }

  /**
   * 주기적 동기화 초기화
   */
  initializePeriodicSync() {
    setInterval(async () => {
      if (this.dataQueue.length > 0) {
        console.log('⏰ Periodic sync triggered - queue length:', this.dataQueue.length);
        await this.processBatchData();
      }
    }, DATA_COLLECTION.PERIODIC_SYNC_INTERVAL);
  }

  /**
   * Readability.js 결과를 활용한 콘텐츠 텍스트 준비
   */
  prepareContentForAnalysis(pageContent) {
    if (!pageContent) return [];

    const contentTexts = [];

    // 1. 최우선: Readability.js 정제 결과
    if (pageContent.cleanTitle && pageContent.cleanTitle.trim()) {
      contentTexts.push(pageContent.cleanTitle.trim());
    }

    if (pageContent.cleanContent && pageContent.cleanContent.trim()) {
      // 정제된 본문이 있으면 이것을 주 콘텐츠로 사용
      contentTexts.push(pageContent.cleanContent.trim());
    }

    if (pageContent.excerpt && pageContent.excerpt.trim()) {
      contentTexts.push(pageContent.excerpt.trim());
    }

    // 2. 보조: 기존 방식 결과 (정제 결과가 부족한 경우)
    if (contentTexts.join(' ').length < 200) {
      console.log('📄 Clean content insufficient, using fallback content');
      
      if (pageContent.content && pageContent.content.trim()) {
        contentTexts.push(pageContent.content.trim());
      }

      if (pageContent.visibleContent && pageContent.visibleContent.trim()) {
        contentTexts.push(pageContent.visibleContent.trim());
      }
    }

    // 3. 최후: 메타 정보
    if (contentTexts.join(' ').length < 100) {
      console.log('📄 All content insufficient, using meta descriptions');
      
      if (pageContent.description && pageContent.description.trim()) {
        contentTexts.push(pageContent.description.trim());
      }

      if (pageContent.headings && pageContent.headings.trim()) {
        contentTexts.push(pageContent.headings.trim());
      }
    }

    // 중복 제거 및 정리
    const uniqueTexts = [...new Set(contentTexts)]
      .filter(text => text && text.length > 10)
      .map(text => text.substring(0, 3000)); // 개별 텍스트 길이 제한

    console.log('📝 Content preparation result:', {
      totalTexts: uniqueTexts.length,
      lengths: uniqueTexts.map(t => t.length),
      extractionMethod: pageContent.extractionMethod,
      contentQuality: pageContent.contentQuality
    });

    return uniqueTexts;
  }


  /**
   * HTTP 요청 헬퍼 (재시도 로직 포함)
   */
  async makeRequest(url, options, attempt = 1) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: API_CONFIG.TIMEOUT
      });
      return response;
      
    } catch (error) {
      if (attempt < DATA_COLLECTION.RETRY_ATTEMPTS) {
        console.log(`🔄 Retrying request (${attempt}/${DATA_COLLECTION.RETRY_ATTEMPTS}) after ${DATA_COLLECTION.RETRY_DELAY}ms`);
        await this.delay(DATA_COLLECTION.RETRY_DELAY);
        return this.makeRequest(url, options, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * sendBeacon을 사용한 즉시 전송 (페이지 unload 시)
   * 브라우저가 백그라운드에서 요청 완료를 보장
   */
  sendBeaconRequest(url, data) {
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { 
          type: 'application/json' 
        });
        
        const success = navigator.sendBeacon(url, blob);
        console.log('📡 SendBeacon sent:', success ? 'Success' : 'Failed');
        return success;
      } else {
        console.warn('⚠️ SendBeacon not supported');
        return false;
      }
    } catch (error) {
      console.error('❌ SendBeacon error:', error);
      return false;
    }
  }

  /**
   * 지연 헬퍼
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 백엔드로 브라우징 데이터 전송
   */
  async sendToBackend(dataArray) {
    console.log('📤 Sending data to backend:', dataArray.length, 'items');
    
    try {
      const userId = await this.getUserId();
      console.log('👤 User ID:', userId);
      
      const payload = {
        userId: userId,
        browsingData: dataArray,
        timestamp: new Date().toISOString(),
        version: "2.0.0" // 리팩토링 버전
      };
      
      console.log('📦 Payload prepared, making request to:', `${API_CONFIG.BASE_URL}/browsing-data`);
      
      const authToken = await this.getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // 인증 토큰이 있는 경우에만 추가
      if (authToken) {
        headers['Authorization'] = authToken;
      }
      
      const response = await this.makeRequest(`${API_CONFIG.BASE_URL}/browsing-data`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      
      console.log('📨 Response received:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ Backend response data:', responseData);
      console.log('✅ Data successfully sent to backend');
      
      return responseData;
      
    } catch (error) {
      console.error('❌ Error sending to backend:', error);
      
      // 실패한 데이터를 로컬 스토리지에 백업
      await this.backupFailedData(dataArray, error.message);
      throw error;
    }
  }

  /**
   * 실패한 데이터 로컬 스토리지 백업
   */
  async backupFailedData(dataArray, errorMessage) {
    try {
      const backupKey = `failed_${Date.now()}`;
      const backupData = {
        data: dataArray,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };
      
      await chrome.storage.local.set({ [backupKey]: backupData });
      console.log('💾 Failed data backed up to storage:', backupKey);
    } catch (backupError) {
      console.error('❌ Failed to backup data:', backupError);
    }
  }

  /**
   * 브라우징 데이터 처리 (ML 분석 + 서버 전송)
   */
  async processBrowsingData(browsingData) {
    console.log('🔄 Processing browsing data:', browsingData);
    
    // 트래킹이 비활성화된 경우 처리하지 않음
    if (!this.isTrackingEnabled) {
      console.log('❌ Tracking disabled at DataSender - skipping processing');
      return;
    }
    
    try {
      // 서버로 원본 데이터만 전송 (서버에서 ML 분석 후 바로 저장)
      const dataToSend = {
        ...browsingData,
        processedAt: new Date().toISOString()
      };
      
      // 큐에 추가
      this.dataQueue.push(dataToSend);
      
      // 큐가 가득 찬 경우 배치 전송
      if (this.dataQueue.length >= DATA_COLLECTION.BATCH_SIZE) {
        console.log('📦 Batch save triggered - queue length:', this.dataQueue.length);
        await this.processBatchData();
      }
      
    } catch (error) {
      console.error('❌ Error processing browsing data:', error);
      
      // 처리 실패한 원본 데이터를 백업
      await this.backupFailedData([browsingData], error.message);
    }
  }

  /**
   * 배치 데이터 처리
   */
  async processBatchData() {
    if (this.isProcessing || this.dataQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    const batchData = [...this.dataQueue];
    this.dataQueue = []; // 큐 비우기
    
    try {
      await this.sendToBackend(batchData);
      console.log(`📦 Batch processed: ${batchData.length} items sent to backend`);
      
    } catch (error) {
      console.error('❌ Error processing batch:', error);
      // 실패한 경우 큐에 다시 추가
      this.dataQueue.unshift(...batchData);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 토글 상태 업데이트
   */
  updateTrackingStatus(enabled) {
    this.isTrackingEnabled = enabled;
    
    if (!enabled) {
      // OFF 시: 현재 큐의 모든 데이터를 전송 후 큐 비우기
      console.log('📤 Flushing queue before disabling - queue length:', this.dataQueue.length);
      if (this.dataQueue.length > 0) {
        this.processBatchData();
      }
      console.log('🧹 Queue will be cleared - tracking disabled');
    } else {
      // ON 시: 새로운 세션 시작
      console.log('✅ DataSender tracking enabled - ready to process data');
    }
  }

  /**
   * 사용자 프로필 데이터 전송 (topSites 등)
   */
  async sendUserProfileData(userId, profileData) {
    try {
      const payload = {
        userId: userId,
        profileData: profileData,
        timestamp: new Date().toISOString()
      };

      const response = await this.makeRequest(`${API_CONFIG.BASE_URL}/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ User profile data sent successfully');
        return await response.json();
      } else {
        throw new Error(`Profile API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error sending user profile:', error);
      throw error;
    }
  }

  /**
   * 큐 상태 조회 (디버깅용)
   */
  getQueueStatus() {
    return {
      queueLength: this.dataQueue.length,
      isProcessing: this.isProcessing,
      isTrackingEnabled: this.isTrackingEnabled,
      lastProcessed: new Date().toISOString()
    };
  }

  /**
   * 수동 동기화 트리거
   */
  async forceSyncData() {
    console.log('🔄 Manual sync triggered');
    return await this.processBatchData();
  }

  /**
   * beforeunload용 즉시 전송 (sendBeacon 사용)
   */
  async sendUnloadData(browsingData) {
    try {
      console.log("🚨 Unload data sending - timeSpent:", browsingData.timeSpent);
      
      const userId = await this.getUserId();
      const payload = {
        userId: userId,
        browsingData: [browsingData],
        timestamp: new Date().toISOString(),
        version: "2.0.0-unload"
      };

      // sendBeacon으로 전송 시도
      const beaconSuccess = this.sendBeaconRequest(`${API_CONFIG.BASE_URL}/browsing-data`, payload);
      
      if (!beaconSuccess) {
        // fallback: 동기적 fetch 시도 (제한적 시간 - 500ms)
        console.log("📡 SendBeacon failed, trying synchronous fetch...");
        await Promise.race([
          this.sendToBackend([browsingData]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 500))
        ]);
      }
      
    } catch (error) {
      console.error("❌ Failed to send unload data:", error);
    }
  }
}