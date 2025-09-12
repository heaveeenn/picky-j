import { useState, useEffect } from "react";

function App() {
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);

  // 토글 보호 장치 상태
  const [isToggleProcessing, setIsToggleProcessing] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState(0);
  const [toggleTimeout, setToggleTimeout] = useState(null);

  // 토글 상태 로드
  const loadToggleState = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.sync.get(["trackingEnabled"]);
        setIsTrackingEnabled(result.trackingEnabled !== false);
      }
    } catch (error) {
      console.error("토글 상태 로드 실패:", error);
    }
  };

  // 토글 상태 저장
  const saveToggleState = async (enabled) => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.sync.set({ trackingEnabled: enabled });
        if (chrome.runtime) {
          chrome.runtime.sendMessage({
            type: "TOGGLE_TRACKING",
            enabled: enabled,
          });
        }
      }
    } catch (error) {
      console.error("토글 상태 저장 실패:", error);
    }
  };

  // 토글 핸들러 (보호 장치 적용)
  const handleToggle = async () => {
    const now = Date.now();
    const TOGGLE_COOLDOWN = 1000; // 1초 쿨다운

    // 1. 처리 중이면 무시
    if (isToggleProcessing) {
      return;
    }

    // 2. 쿨다운 체크
    if (now - lastToggleTime < TOGGLE_COOLDOWN) {
      return;
    }

    // 3. 기존 타임아웃 클리어 (디바운싱)
    if (toggleTimeout) {
      clearTimeout(toggleTimeout);
    }

    setIsToggleProcessing(true);

    // 4. 디바운싱된 상태 변경 및 저장 (500ms 후 실행)
    const timeout = setTimeout(async () => {
      const newState = !isTrackingEnabled;

      try {
        setIsTrackingEnabled(newState); // 디바운싱 후 상태 변경
        await saveToggleState(newState);
        setLastToggleTime(Date.now());

        // 성공 시 별도 메시지 없음 (상태 변화로 충분)
      } catch (error) {
        console.error("토글 저장 실패:", error);
        // 실패 시 상태 되돌리기 (조용히)
        setIsTrackingEnabled(!newState);
      } finally {
        setIsToggleProcessing(false);
      }
    }, 500);

    setToggleTimeout(timeout);
  };

  // 초기화
  useEffect(() => {
    const initialize = async () => {
      await loadToggleState();
    };
    initialize();
  }, []);

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (toggleTimeout) {
        clearTimeout(toggleTimeout);
      }
    };
  }, [toggleTimeout]);

  return (
    <div className="w-80 p-5 font-sans">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold mb-3">picky 🦞</h2>
      </div>

      {/* Toggle Switch */}
      <div className="flex items-center justify-between mb-5 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <div className="font-bold text-sm">데이터 수집</div>
          <div className="text-xs text-gray-600 mt-0.5">
            {isToggleProcessing ? (
              <span className="text-blue-600">처리 중...</span>
            ) : (
              <span
                style={{ color: isTrackingEnabled ? "#28a745" : "#dc3545" }}
              >
                {isTrackingEnabled ? "활성화됨" : "비활성화됨"}
              </span>
            )}
          </div>
        </div>

        <div
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
            isToggleProcessing
              ? "cursor-not-allowed opacity-50 pointer-events-none"
              : "cursor-pointer hover:opacity-80"
          } ${isTrackingEnabled ? "bg-green-500" : "bg-gray-400"}`}
          onClick={isToggleProcessing ? null : handleToggle}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
              isTrackingEnabled ? "transform translate-x-6" : ""
            } ${isToggleProcessing ? "animate-pulse" : ""}`}
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="text-center text-sm text-gray-600">
        <div className="mb-2">
          <span className="font-semibold">웹 활동 기반</span> 개인화 추천 시스템
        </div>
        <div className="text-xs">
          브라우징 데이터를 수집하여 맞춤형 뉴스와 퀴즈를 제공합니다.
        </div>
      </div>
    </div>
  );
}

export default App;
