/**
 * DataSender.js
 * 
 * Python 서버로 데이터 전송하는 로직
 */

export class DataSender {
  constructor() {
    // 서버 설정
    this.serverUrl = "http://localhost:8000"; // Python FastAPI 서버
    this.dataQueue = []; // 전송 대기 데이터
    
    console.log("📤 DataSender 초기화");
  }

  /**
   * 데이터를 큐에 추가 (사용자 ID 포함)
   */
  addToQueue(data, userId = null) {
    // userId가 없으면 큐에 추가하지 않음
    if (!userId) {
      console.log("⚠️ userId 없음 - 데이터 큐에 추가하지 않음");
      return;
    }

    // 사용자 ID 및 재시도 정보 추가
    const dataWithUser = {
      ...data,
      userId: userId,
      retryCount: 0  // 재시도 횟수 초기화 (전송시 제거됨)
    };

    this.dataQueue.push(dataWithUser);
    console.log("📥 데이터 큐에 추가:", this.dataQueue.length, "개", `(${userId})`);
  }

  /**
   * Python 서버로 데이터 전송
   */
  async sendData(data) {
    try {
      console.log("📤 서버로 데이터 전송 중...");

      // 전송용 데이터 (retryCount 제거)
      const { retryCount, ...sendData } = data;

      // 디버깅: 전송할 데이터 확인
      console.log("📊 전송할 데이터:", {
        url: sendData.url,
        userId: sendData.userId,
        timestamp: sendData.timestamp,
        contentLength: sendData.content?.length || 0,
        hasReadability: !!sendData.readabilityContent
      });
      
      const response = await fetch(`${this.serverUrl}/user-logs/browsing-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ 전송 성공:", result);
        return true;
      } else {
        // 에러 응답 내용 확인
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Unable to read error response';
        }

        console.error("❌ 전송 실패:", response.status, response.statusText);
        console.error("❌ 에러 응답:", errorText);
        return false;
      }
    } catch (error) {
      console.error("❌ 전송 에러:", error);
      return false;
    }
  }

  /**
   * 큐에 있는 모든 데이터 전송
   */
  async sendAllQueuedData() {
    if (this.dataQueue.length === 0) {
      console.log("📭 전송할 데이터가 없습니다");
      return;
    }

    console.log(`📤 ${this.dataQueue.length}개 데이터 전송 시작`);
    
    // 큐에서 모든 데이터를 원자적으로 제거하면서 가져오기
    const dataToProcess = this.dataQueue.splice(0);

    const MAX_RETRIES = 3;
    const failedData = []; // 실패한 데이터만 저장

    // 각 데이터 개별 전송
    for (const data of dataToProcess) {
      const success = await this.sendData(data);
      
      if (!success) {
        // 재시도 횟수 체크
        data.retryCount = (data.retryCount || 0) + 1;
        
        if (data.retryCount <= MAX_RETRIES) {
          failedData.push(data); // 실패한 데이터는 따로 저장
          console.log(`🔄 재시도 ${data.retryCount}/${MAX_RETRIES}: ${data.url || 'unknown'}`);
        } else {
          console.log(`❌ 최대 재시도 초과, 데이터 버림: ${data.url || 'unknown'}`);
        }
      }
      // 성공한 데이터는 그냥 버림 (아무것도 안함)
    }

    // 실패한 데이터만 큐에 다시 추가 (앞에 추가해서 우선 처리)
    this.dataQueue.unshift(...failedData);

    if (this.dataQueue.length > 0) {
      console.log(`⚠️ ${failedData.length}개 데이터 전송 실패 - 큐에 보관`);
    } else {
      console.log("✅ 모든 데이터 전송 완료");
    }
  }

  /**
   * 즉시 전송 (큐 거치지 않고)
   */
  async sendImmediately(data) {
    return await this.sendData(data);
  }

  /**
   * 서버 연결 테스트
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      if (response.ok) {
        console.log("✅ 서버 연결 정상");
        return true;
      }
    } catch (error) {
      console.log("❌ 서버 연결 실패:", error);
    }
    return false;
  }
}