/**
 * background.js
 *
 * Chrome Extension 백그라운드 스크립트
 * - content.js에서 온 데이터를 받아서 Python 서버로 전송
 * - 배치 처리 및 에러 처리 담당
 * - [추가] UI 관련 설정(캐릭터, 알림 등) 관리 기능 통합
 */

// --- [추가] UI 설정 관련 ---
// 기본 설정 스키마
const DEFAULT_SETTINGS = {
  isExtensionOn: true,
  isCharacterOn: true,
  notificationInterval: 30,
  // 관심 카테고리는 맵 형태로 저장한다.
  selectedCategories: {
    tech: true,
    news: true,
    education: false,
    design: true,
    business: false,
    entertainment: false,
  },
};

/**
 * [추가] 현재 스토리지 값 중 비어 있는 키만 기본값으로 채운다.
 * - 사용자가 이미 설정한 값은 덮어쓰지 않는다.
 */
async function ensureDefaults() {
  try {
    const keys = Object.keys(DEFAULT_SETTINGS);
    const current = await chrome.storage.sync.get(keys);

    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
      const cur = current[k];
      const isEmpty = cur === undefined || cur === null;
      if (isEmpty) {
        toSet[k] = v;
      }
    }

    if (Object.keys(toSet).length > 0) {
      await chrome.storage.sync.set(toSet);
    }
  } catch (err) {
    // 초기화 실패는 치명적이지 않으므로 로깅만 수행한다.
    // eslint-disable-next-line no-console
    console.warn('[background] ensureDefaults failed:', err);
  }
}
// --- [추가] UI 설정 관련 끝 ---


import { DataSender } from "./modules/DataSender.js";
import { UserSession } from "./modules/UserSession.js";
import { HistoryCollector } from "./modules/HistoryCollector.js";
import { initApi, authFetch } from "./modules/AuthenticatedApi.js";
import { BACKEND_URL } from "./config/env.js";
console.log("🔧 Background script 시작");

const dataSender = new DataSender();
const userSession = new UserSession();
initApi(userSession); // 인증 API 모듈 초기화
const historyCollector = new HistoryCollector(userSession);

// Service Worker 재시작시 세션 자동 복원
(async () => {
  try {
    const sessionInfo = await userSession.tryAutoLogin();
    console.log("👤 사용자 세션 초기화 완료:", sessionInfo);

    // 자동 로그인 성공시 히스토리 수집 체크
    if (sessionInfo.success) {
      await checkAndCollectHistory();
    }
  } catch (error) {
    console.error("❌ 사용자 세션 초기화 실패:", error);
  }
})();

// 히스토리 수집 체크 및 실행 함수
async function checkAndCollectHistory() {
  try {
    const storage = await chrome.storage.local.get(["historyCollected"]);

    // 아직 히스토리를 수집하지 않았다면 수집 시작
    if (!storage.historyCollected) {
      console.log("📚 최초 로그인 - 히스토리 데이터 수집 시작");

      const result = await historyCollector.collectHistoryWithContent();
      if (result) {console.log(
        "✅ 로그인 후 히스토리 수집 완료:",
      );}

      // 수집 완료 플래그 저장
      await chrome.storage.local.set({ historyCollected: true });
      console.log("📝 히스토리 수집 완료 플래그 저장");
    } else {
      console.log("ℹ️ 히스토리 이미 수집됨 - 건너뛰기");
    }
  } catch (error) {
    console.error("❌ 히스토리 수집 실패:", error);
  }
}

// content.js와 popup에서 온 메시지 처리
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("📨 메시지 받음:", message);

  // 브라우징 데이터 처리 (content.js에서)
  if (message.type === "BROWSING_DATA") {
    // 1. 로그인 상태 확인
    const userId = userSession.getUserId();
    if (!userId || !userSession.isUserAuthenticated()) {
      console.log("⚠️ 로그인되지 않음 - 데이터 수집 건너뛰기");
      sendResponse({ success: false, reason: "User not authenticated" });
      return;
    }

    // 2. 토글 상태 확인 (Chrome Storage에서)
    // [변경] trackingEnabled 대신 isExtensionOn을 사용하도록 통합
    const settings = await chrome.storage.sync.get(["isExtensionOn"]);
    const isTrackingEnabled = settings.isExtensionOn !== false;

    if (!isTrackingEnabled) {
      console.log("⚠️ 데이터 수집 비활성화 - 큐에 추가하지 않음");
      sendResponse({ success: false, reason: "Tracking disabled" });
      return;
    }

    // 3. 도메인 차단 상태 확인
    const userSettings = await fetchUserSettings();
    if (userSettings && userSettings.settings && userSettings.settings.blockedDomains) {
      const currentDomain = new URL(message.data.url).hostname;
      const isBlocked = userSettings.settings.blockedDomains.some(blockedDomain => {
        return currentDomain.includes(blockedDomain) || blockedDomain.includes(currentDomain);
      });

      if (isBlocked) {
        console.log("🚫 차단된 도메인 - 큐에 추가하지 않음:", currentDomain);
        sendResponse({ success: false, reason: "Domain blocked" });
        return;
      }
    }

    // 4. 사용자 ID와 함께 데이터를 큐에 추가
    dataSender.addToQueue(message.data, userId);
    console.log("✅ 데이터 큐에 추가 완료 - userId:", userId);

    sendResponse({ success: true });
    return;
  }

  // 사용자 세션 정보 조회 (popup에서)
  if (message.type === "GET_USER_SESSION") {
    const isAuthenticated = userSession.isUserAuthenticated();
    const userInfo = isAuthenticated ? userSession.getUserInfo() : null;

    console.log("👤 세션 정보 요청 응답:", { isAuthenticated, userInfo });
    sendResponse({
      success: true,
      isAuthenticated: isAuthenticated,
      userInfo: userInfo,
    });
    return;
  }

  // 사용자 ID 조회 (content script에서)
  if (message.type === "GET_USER_ID") {
    const userId = userSession.getUserId();
    console.log("👤 userId 요청 응답:", userId);
    sendResponse({ userId: userId });
    return;
  }

  // Content Script에서 Service Worker 활성화 및 자동 로그인 트리거
  if (message.type === "TRIGGER_AUTO_LOGIN") {
    console.log("🔄 Content Script에서 자동 로그인 트리거 요청:", message.url);

    // 이미 로그인되어 있는지 확인
    if (userSession.isUserAuthenticated()) {
      console.log("✅ 이미 로그인된 상태");
      sendResponse({ success: true, alreadyAuthenticated: true });
      return;
    }

    // 자동 로그인 시도 (이미 인증된 상태라면 건너뛰기)
    (async () => {
      try {
        // 현재 인증 상태 또는 로그인 진행 상태 확인
        if (userSession.isAuthenticated) {
          console.log("🎯 이미 인증된 상태 - 자동 로그인 건너뛰기");
          sendResponse({ success: true, sessionInfo: { success: true, source: "existing" } });
          return;
        }

        if (userSession.isLoginInProgress) {
          console.log("🎯 로그인 진행 중 - 자동 로그인 건너뛰기");
          sendResponse({ success: false, reason: "login_in_progress" });
          return;
        }

        const sessionInfo = await userSession.tryAutoLogin();
        console.log("🎯 Content Script 트리거 자동 로그인 결과:", sessionInfo);

        if (sessionInfo.success) {
          // 자동 로그인 성공시 히스토리 수집 체크
          await checkAndCollectHistory();
          sendResponse({ success: true, sessionInfo });
        } else {
          sendResponse({ success: false, reason: sessionInfo.reason });
        }
      } catch (error) {
        console.error("❌ Content Script 트리거 자동 로그인 실패:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // 비동기 응답을 위해 true 반환
  }

  // Google 로그인 처리 (popup에서)
  if (message.type === "GOOGLE_LOGIN") {
    console.log("🔐 Google 로그인 요청 받음");

    // 비동기 함수로 처리하되 sendResponse 호출을 보장
    userSession
      .loginWithGoogle()
      .then(async (result) => {
        console.log("🔐 Google 로그인 결과:", result);

        // 로그인 성공시 히스토리 수집 체크
        if (result.success) {
          try {
            await checkAndCollectHistory();
          } catch (historyError) {
            console.error("히스토리 수집 실패:", historyError);
          }
        }

        // Chrome Storage 이벤트를 통해 popup이 알아서 업데이트되므로
        // 간단한 응답만 보냄
        sendResponse({
          success: result.success,
          user: result.user || null,
        });
      })
      .catch((error) => {
        console.error("❌ Google 로그인 실패:", error);
        sendResponse({
          success: false,
          error: error.message,
        });
      });

    // 비동기 응답을 위해 true 반환
    return true;
  }

  // 토글 상태 변경 (popup에서)
  if (message.type === "TOGGLE_TRACKING") {
    console.log("🔄 토글 상태 변경:", message.enabled);
    // 필요시 추가 로직 (예: content.js들에게 알림)
    sendResponse({ success: true });
    return;
  }


  // Offscreen 콘텐츠 추출 요청 (HistoryContentExtractor에서 사용)
  if (message.type === "EXTRACT_CONTENT_OFFSCREEN") {
    // 이 메시지는 offscreen.js에서 처리됨
    // background.js에서는 단순히 전달만
    return false;
  }

// --- [추가] 추천 콘텐츠 관련 메시지 핸들러 ---
  if (message.type === 'ACKNOWLEDGE_RECOMMENDATION') {
    (async () => {
      const { slotId, eventType } = message.payload;
      const result = await acknowledgeRecommendation(slotId, eventType);
      sendResponse(result);
    })();
    return true; // 비동기 응답
  }

// --- [추가] UI 관련 메시지 핸들러 ---
  if (message.type === 'GET_USER_SETTINGS') {
    (async () => {
      const result = await fetchUserSettings();
      if (result.success) {
        // 백엔드 DTO를 chrome.storage 구조에 맞게 변환
        const settingsToStore = {
          isCharacterOn: result.settings.avatarCode !== 'disabled', // 'disabled' 코드가 캐릭터 off를 의미한다고 가정
          isNotificationsOn: result.settings.notifyEnabled,
          notificationItems: {
            news: result.settings.newsEnabled,
            quiz: result.settings.quizEnabled,
            fact: result.settings.factEnabled,
          },
          notificationInterval: result.settings.notifyInterval,
        };
        await chrome.storage.sync.set(settingsToStore);
        sendResponse({ success: true, settings: settingsToStore });
      } else {
        // 실패 시 기존 storage 값이라도 보내주기
        const localSettings = await chrome.storage.sync.get(null);
        sendResponse({ success: false, error: result.error, settings: localSettings });
      }
    })();
    return true; // 비동기 응답
  }

  if (message.type === 'UPDATE_USER_SETTINGS') {
    (async () => {
      // (주석) 팝업 UI는 변경된 일부 설정만 보내므로,
      //       백엔드에 저장하기 전에 먼저 현재 전체 설정을 불러와야 합니다.
      // 1. 백엔드에서 현재 전체 설정을 가져옵니다.
      const currentStateResult = await fetchUserSettings();
      if (!currentStateResult.success) {
        console.error("업데이트 전 현재 설정을 가져오는 데 실패했습니다.");
        sendResponse({ success: false, error: "현재 설정을 가져올 수 없습니다." });
        return;
      }
      
      // 2. 가져온 전체 설정에 팝업에서 변경된 내용을 병합하여 완전한 요청 DTO를 만듭니다.
      const fullSettings = currentStateResult.settings;
      const changes = message.settings; // 팝업에서 보낸 부분적인 변경사항
      
      // (주석) 백엔드의 UserSettingsUpdateRequestDto 형식에 맞춰 페이로드(전송 데이터)를 구성합니다.
      //       팝업에서 보내지 않은 값은 기존 값(fullSettings)을 그대로 사용합니다.
      const payload = {
        avatarCode: fullSettings.avatarCode, // (주석) 캐릭터 종류는 팝업에서 변경하지 않으므로 기존 값 사용
        blockedDomains: fullSettings.blockedDomains, // (주석) 수집 제외 사이트도 팝업에서 변경하지 않으므로 기존 값 사용
        notifyEnabled: changes.isNotificationsOn ?? fullSettings.notifyEnabled,
        newsEnabled: changes.notificationItems?.news ?? fullSettings.newsEnabled,
        quizEnabled: changes.notificationItems?.quiz ?? fullSettings.quizEnabled,
        factEnabled: changes.notificationItems?.fact ?? fullSettings.factEnabled,
        notifyInterval: changes.notificationInterval ?? fullSettings.notifyInterval,
      };

      // (주석) '캐릭터 표시' 토글은 백엔드의 'avatarCode' 필드와 연결됩니다.
      //       '캐릭터 표시'를 끄면 avatarCode를 'disabled'로 설정하여 비활성화를 알립니다.
      //       다시 켤 때는 기본값('default')으로 설정합니다. (백엔드는 'default' 코드를 알고 있어야 함)
      if (changes.isCharacterOn !== undefined) {
        payload.avatarCode = changes.isCharacterOn ? (fullSettings.avatarCode !== 'disabled' ? fullSettings.avatarCode : 'default') : 'disabled';
      }

      // 3. 완성된 페이로드로 백엔드에 업데이트를 요청합니다.
      const updateResult = await updateUserSettings(payload);

      // 4. 백엔드 업데이트가 성공하면, 로컬 스토리지 캐시도 업데이트합니다.
      if (updateResult.success) {
        const currentLocalSettings = await chrome.storage.sync.get(null);
        const newLocalSettings = {...currentLocalSettings, ...changes};
        await chrome.storage.sync.set(newLocalSettings);
      }

      sendResponse(updateResult);
    })();
    return true; // 비동기 응답
  }

  if (message.type === 'PING') {
    sendResponse({ success: true, data: 'PONG' });
    return; // 동기 응답
  }

  // 차단된 도메인 확인 (DataCollector에서)
  if (message.type === "CHECK_BLOCKED_DOMAIN") {
    try {
      // 사용자 설정 조회
      const userSettings = await fetchUserSettings();
      if (!userSettings || !userSettings.settings || !userSettings.settings.blockedDomains) {
        sendResponse({ success: true, blocked: false });
        return;
      }

      // 도메인 체크
      const currentDomain = new URL(message.url).hostname;
      const isBlocked = userSettings.settings.blockedDomains.some(blockedDomain => {
        return currentDomain.includes(blockedDomain) || blockedDomain.includes(currentDomain);
      });

      console.log(`🔍 도메인 체크: ${currentDomain} -> ${isBlocked ? '차단됨' : '허용됨'}`);
      sendResponse({ success: true, blocked: isBlocked });

    } catch (error) {
      console.error("❌ 도메인 체크 실패:", error);
      sendResponse({ success: false, blocked: false, error: error.message });
    }
    return true; // async 처리를 위해 true 반환
  }
});

// --- API 연동 함수 ---
async function fetchUserSettings() {
  if (!userSession.isUserAuthenticated()) {
    return { success: false, reason: "unauthenticated" };
  }
  try {
    const response = await authFetch(`${BACKEND_URL}/api/users/me/settings`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    return { success: true, settings: result.data };
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return { success: false, error: error.message };
  }
}

async function updateUserSettings(settings) {
  if (!userSession.isUserAuthenticated()) {
    return { success: false, reason: "unauthenticated" };
  }
  try {
    const response = await authFetch(`${BACKEND_URL}/api/users/me/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    return { success: true, settings: result.data };
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return { success: false, error: error.message };
  }
}

// --- [추가] 추천 콘텐츠 API 연동 함수 ---
async function getNextRecommendation(contentType) {
  if (!userSession.isUserAuthenticated()) {
    return { success: false, reason: "unauthenticated" };
  }
  try {
    // API URL에 contentType을 쿼리 파라미터로 추가
    const response = await authFetch(`${BACKEND_URL}/api/recommendations/next?type=${contentType}`);
    if (response.status === 204) { // No Content
      return { success: true, data: null }; // 추천할 내용이 없음
    }
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    console.error(`Failed to fetch ${contentType} recommendation:`, error);
    return { success: false, error: error.message };
  }
}

async function acknowledgeRecommendation(slotId, eventType) {
  if (!userSession.isUserAuthenticated()) {
    return { success: false, reason: "unauthenticated" };
  }
  try {
    const response = await authFetch(`${BACKEND_URL}/api/recommendations/slots/${slotId}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType }),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to acknowledge recommendation:", error);
    return { success: false, error: error.message };
  }
}

// --- [추가] 알림 스케줄러 로직 ---
const ALARM_NAME = 'picky-recommendation-alarm';

// 알람이 울릴 때 실행될 로직
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('⏰ 알람 발생! 다음 추천 콘텐츠를 가져옵니다.');
    
    // 1. 로그인 및 모든 설정값 확인
    const settings = await chrome.storage.sync.get(['isExtensionOn', 'isCharacterOn', 'isNotificationsOn', 'notificationItems']);
    if (!userSession.isUserAuthenticated() || !settings.isExtensionOn || !settings.isCharacterOn || !settings.isNotificationsOn) {
      console.log('🚫 추천 비활성화 상태. (로그아웃 또는 설정 OFF)');
      return;
    }

    // 2. 추천 가능한 콘텐츠 타입 목록 생성
    const enabledTypes = Object.entries(settings.notificationItems || {})
      .filter(([, isEnabled]) => isEnabled)
      .map(([type]) => type.toUpperCase());

    if (enabledTypes.length === 0) {
      console.log('🚫 모든 추천 항목이 비활성화되어 있습니다.');
      return;
    }

    // 3. 랜덤으로 콘텐츠 타입 선택 및 API 호출
    const randomType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
    const result = await getNextRecommendation(randomType);

    // 4. 성공 시 모든 탭의 content script로 추천 내용 브로드캐스트
    if (result.success && result.data) {
      console.log(`📢 [${randomType}] 추천 콘텐츠를 모든 탭에 전송합니다:`, result.data);
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_RECOMMENDATION',
            payload: result.data,
          });
        } catch {
          // content script가 주입되지 않은 탭(예: chrome://)에서는 에러 발생. 정상임.
        }
      }
    } else {
      console.log(`ℹ️ [${randomType}] 추천할 콘텐츠가 없거나 가져오지 못했습니다.`);
    }
  }
});

// 설정값이 변경될 때 알람을 재설정하는 함수
async function resetAlarm() {
  const settings = await chrome.storage.sync.get(['notificationInterval', 'isNotificationsOn']);
  const interval = settings.notificationInterval || 30;
  const isOn = settings.isNotificationsOn !== false;

  await chrome.alarms.clear(ALARM_NAME);
  console.log('🗑️ 기존 알람 삭제 완료.');

  if (isOn) {
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: 1, // 처음엔 1분 뒤에 시작
      periodInMinutes: interval
    });
    console.log(`✨ ${interval}분 간격으로 새 알람 설정 완료.`);
  } else {
    console.log('🚫 알림이 비활성화되어 알람을 설정하지 않습니다.');
  }
}

// 스토리지 변경 감지하여 알람 재설정
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.notificationInterval || changes.isNotificationsOn)) {
    console.log('🔄 알림 설정 변경 감지. 알람을 재설정합니다.');
    resetAlarm();
  }
});


// 30초마다 큐에 있는 데이터들을 서버로 전송
setInterval(async () => {
  console.log("🔄 큐 데이터 일괄 전송 시도");
  await dataSender.sendAllQueuedData();
}, 30000);

// 확장프로그램 설치시 초기화 수행 (기존 인증 데이터 포함)
chrome.runtime.onInstalled.addListener(async (details) => {
  // [추가] UI 기본 설정 보장
  await ensureDefaults();

  if (details.reason === "install") {
    console.log("🎉 확장프로그램 최초 설치 완료");

    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    console.log("🧹 기존 Chrome Storage 데이터 모두 초기화 완료");
    
    // [추가] sync 스토리지를 초기화했으므로 UI 기본 설정을 다시 저장
    await ensureDefaults();

    await chrome.storage.local.set({
      installed: true,
      historyCollected: false,
    });
    console.log("📝 새로운 설치 상태 저장 완료 - 로그인 후 히스토리 수집 예정");
  }
  // [추가] 설치 또는 업데이트 시 항상 알람 재설정
  resetAlarm();
});
