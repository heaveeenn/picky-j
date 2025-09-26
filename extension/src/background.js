ngs; // 팝업에서 보낸 부분적인 변경사항
      
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