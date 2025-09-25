import React from "react"; // JSX 변환 시 일부 경로에서 필요한 심볼을 보장하기 위한 명시적 임포트
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

/**
 * 부트스트랩 함수
 * - 팝업 문서 내 #root를 찾고, React 18 방식으로 마운트한다.
 * - 컨테이너가 없으면 에러 로그를 남기고 조기 종료한다.
 * - StrictMode는 개발 중 렌더 이슈 탐지에 유용하나, 필요 없으면 주석 처리해도 된다.
 */
function bootstrap() {
  const container = document.getElementById("root");

  // 방어: 팝업 HTML에 #root가 없을 경우 즉시 알림
  if (!container) {
    // 확장 팝업 HTML 구조가 바뀌었거나 빌드/경로 설정 문제일 가능성
    console.error("[popup/main] #root element not found. Check src/popup/index.html structure.");
    return;
  }

  const root = createRoot(container);

  // 개발 시 StrictMode로 감싸면 사이드 이펙트 감지가 쉬움
  // root.render(
  //   <React.StrictMode>
  //     <App />
  //   </React.StrictMode>
  // );

  // 운영/간단 확인용 렌더
  root.render(<App />);
}

// 팝업은 매 열람 시 신규 문서 컨텍스트이므로 즉시 부트스트랩
bootstrap();
