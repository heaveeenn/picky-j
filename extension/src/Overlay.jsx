import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink, Bookmark, X, Pin, PinOff } from 'lucide-react';
import { shimejiData } from './shimeji-data.js';
import { evaluateCondition, evaluateValue } from './condition-parser.js';


/**
 * @dev 자동 위치 조정 기능이 추가된 컨텍스트 메뉴
 */
function CustomContextMenu({ x, y, onSelect, isPinned, onTogglePin }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: y, left: x, opacity: 0 });

  useEffect(() => {
    if (menuRef.current) {
      const { offsetHeight: menuHeight } = menuRef.current;
      setPosition({ top: y - menuHeight, left: x, opacity: 1 });
    }
  }, [x, y]);

  const userActions = useMemo(() => {
    const meaningfulActionMap = new Map([
      ['Stand', '서기'],
      ['Sit', '앉기'],
      ['LieDown', '눕기'],
      ['Walk', '걷기'],
      ['Run', '달리기'],
      ['Creep', '기어가기'],
      ['SelectIE', '던지기...'],
      ['SelectEdge', '점프...'],
    ]);

    const actionMap = new Map(shimejiData.actions.map((action) => [action.name, action]));

    const actions = [];
    meaningfulActionMap.forEach((displayName, actionName) => {
      const action = actionMap.get(actionName);
      if (action) {
        actions.push({ ...action, displayName });
      }
    });
    return actions;
  }, []);

  return (
    <div
      ref={menuRef}
      className="absolute z-10 w-56 bg-white rounded-md shadow-2xl border border-gray-200 text-sm font-sans"
      style={{ ...position, transition: 'opacity 0.1s ease-in-out' }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2 flex items-center justify-between text-xs border-b">
        <span className="font-semibold text-gray-500">캐릭터 행동 제어</span>
        <button onClick={onTogglePin} className="p-1 rounded-full hover:bg-gray-100" title={isPinned ? '고정 해제' : '움직임 고정'}>
          {isPinned ? <PinOff size={14} className="text-red-500" /> : <Pin size={14} className="text-gray-500" />}
        </button>
      </div>
      <ul className="py-1 max-h-80 overflow-y-auto">
        {userActions.map(action => (
            <li key={action.name}>
              <button
                onClick={() => onSelect(action.name)}
                className="text-left w-full px-3 py-1.5 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
              >
                {action.displayName}
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

/**
 * @dev [신규] '요소 선택 모드'에서 마우스 아래의 요소를 시각적으로 표시하는 컴포넌트
 * @param {object} elementRect - 하이라이트할 요소의 getBoundingClientRect() 결과
 * @param {string} selectionMode - 'jump' 또는 'throw' 모드
 * @param {object} mousePosition - 현재 마우스의 x, y 좌표
 */
function HighlightComponent({ elementRect, selectionMode, mousePosition }) {
  if (!elementRect) return null;

  const baseStyle = {
    position: 'fixed',
    zIndex: 2147483646,
    pointerEvents: 'none',
    boxShadow: '0 0 8px 2px rgba(255, 165, 0, 0.8)',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 165, 0, 0.9)',
  };

  if (selectionMode === 'throw') {
    // 'throw' 모드에서는 요소 전체에 테두리를 표시합니다.
    const style = {
      ...baseStyle,
      left: `${elementRect.left}px`,
      top: `${elementRect.top}px`,
      width: `${elementRect.width}px`,
      height: `${elementRect.height}px`,
      borderWidth: '2px',
    };
    return <div style={style} />;
  }

  if (selectionMode === 'jump') {
    // 'jump' 모드에서는 마우스 위치에 가장 가까운 모서리에만 테두리를 표시합니다.
    const { x, y } = mousePosition;
    const { left, right, top, bottom } = elementRect;
    const distTop = Math.abs(y - top);
    const distBottom = Math.abs(y - bottom);
    const distLeft = Math.abs(x - left);
    const distRight = Math.abs(x - right);
    const min = Math.min(distTop, distBottom, distLeft, distRight);

    let edgeStyle = {};
    switch (min) {
      case distTop:
        edgeStyle = { borderWidth: '2px 0 0 0' };
        break;
      case distBottom:
        edgeStyle = { borderWidth: '0 0 2px 0' };
        break;
      case distLeft:
        edgeStyle = { borderWidth: '0 0 0 2px' };
        break;
      case distRight:
        edgeStyle = { borderWidth: '0 2px 0 0' };
        break;
    }
    
    const style = {
      ...baseStyle,
      left: `${elementRect.left}px`,
      top: `${elementRect.top}px`,
      width: `${elementRect.width}px`,
      height: `${elementRect.height}px`,
      ...edgeStyle,
    };
    return <div style={style} />;
  }

  return null;
}


// 메인 오버레이 컴포넌트
function Overlay() {
  // 상태 정의
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [recommendation, setRecommendation] = useState(null); // [신규] 추천 데이터 상태
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizResult, setQuizResult] = useState(null); // 퀴즈 채점 결과
  const [isScrapped, setIsScrapped] = useState(false); // [추가] 현재 콘텐츠 스크랩 여부
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeIE, setActiveIE] = useState(null); // 현재 선택된 웹페이지 요소를 저장합니다.
  const [thrownIEs, setThrownIEs] = useState([]); // [2025-09-16 Cline] 던져진 요소들을 관리합니다.
  const carriedIERef = useRef({
    element: null,
    originalStyles: { position: '', zIndex: '', top: '', left: '' },
  }); // [신규] 실제 DOM 요소를 참조하기 위한 ref
  // [신규] '요소 선택 모드'를 관리하는 상태. 'jump', 'throw', 또는 null.
  const [selectionMode, setSelectionMode] = useState(null);
  // [신규] '요소 선택 모드'에서 하이라이트된 요소의 정보를 저장합니다.
  const [highlightedElement, setHighlightedElement] = useState(null);
  // 캐릭터의 모든 상태를 포함하는 객체. 행동 AI와 물리 엔진의 핵심입니다.
  const [characterState, setCharacterState] = useState({
    x: window.innerWidth / 2, // x 좌표
    y: window.innerHeight - 128, // y 좌표
    vx: 0, // x축 속도
    vy: 0, // y축 속도
    lookRight: false, // 바라보는 방향 (true: 오른쪽)
    actionName: 'Falling', // 현재 수행 중인 개별 행동(action)의 이름
    behaviorName: 'Fall', // 현재 수행 중인 행동 패턴(behavior)의 이름
    actionFrame: 0, // 현재 행동의 프레임 카운터
    sequenceFrame: 0, // 현재 행동 순서(sequence)의 인덱스
    sprite: '/shime4.png', // 현재 표시할 스프라이트 이미지
    actionContext: {}, // [2025-09-16 Cline] 현재 액션의 동적 속성을 저장합니다.
    carriedIE: null, // [2025-09-16 Cline] 캐릭터가 들고 있는 요소를 저장합니다.
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef({ lastX: 0, lastY: 0, vx: 0, vy: 0 });
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const [isPinned, setIsPinned] = useState(false);
  const animationFrameRef = useRef(null);
  const contextMenuWrapperRef = useRef(null);
  const animationSpeedCounter = useRef(0);

  /**
   * @dev 사용자가 컨텍스트 메뉴를 통해 특정 행동을 강제로 실행시키는 함수
   * @param {string} actionName - 실행할 행동의 이름
   */
  const forceCharacterAction = (actionName) => {
    // [수정됨] 'SelectIE'나 'SelectEdge'가 호출되면, 실제 행동 대신 '요소 선택 모드'로 진입합니다.
    if (actionName === 'SelectIE') {
      setSelectionMode('throw');
      return;
    }
    if (actionName === 'SelectEdge') {
      setSelectionMode('jump');
      return;
    }

    const action = shimejiData.actions.find(a => a.name === actionName);
    if (action) {
      // 캐릭터의 상태를 새로운 행동으로 즉시 변경합니다.
      // behaviorName을 actionName으로 설정하여 AI가 다음 행동을 선택할 때 현재 행동을 기반으로 하도록 합니다.
      setCharacterState(prev => {
        const newActionContext = {};
        // [개선] '걷기', '달리기', '기어가기'에 임의의 목표 지점을 설정하여 더 자연스럽게 만듭니다.
        if (actionName === 'Walk' || actionName === 'Run' || actionName === 'Creep') {
          const distance = 200 + Math.random() * 300;
          const direction = Math.random() < 0.5 ? 1 : -1; // 1: right, -1: left
          let targetX = prev.x + distance * direction;
          // 화면 경계 내로 목표 지점 조정
          targetX = Math.max(0, Math.min(window.innerWidth - 128, targetX));
          newActionContext.evaluatedTargetX = targetX;
        }

        return {
          ...prev,
          behaviorName: actionName,
          actionName,
          actionFrame: 0,
          sequenceFrame: 0,
          actionContext: newActionContext,
        };
      });
    } else {
      console.warn(`[Picky] Action "${actionName}" not found.`);
    }
  };

  /**
   * @dev 캐릭터의 다음 행동 패턴(Behavior)을 결정하는 AI 로직
   * - shimeji-data.js의 behaviors 배열을 기반으로, 현재 캐릭터 상태에서 수행 가능한 모든 행동을 찾고,
   *   각 행동의 frequency(빈도)에 따라 다음 행동을 확률적으로 선택합니다.
   * @param {object} currentState - 현재 캐릭터의 상태 객체
   * @returns {string} 다음에 수행할 행동 패턴의 이름
   */
  const selectNextBehavior = useMemo(() => {
    // [2025-09-16 Cline] AI 로직 개선: 고급 조건 파서를 사용하도록 수정합니다.
    // 더 이상 미리 조건을 함수로 변환하지 않고, 런타임에 전체 컨텍스트를 사용하여 평가합니다.
    return (currentState, context) => {
      // 현재 상태에서 실행 가능한 모든 행동 패턴을 필터링합니다.
      const possibleBehaviors = shimejiData.behaviors.filter(behavior =>
        behavior.conditions.every(cond => evaluateCondition(cond, context))
      );

      // 실행 가능한 행동이 없는 경우, 콘솔에 경고를 출력하고 안전한 기본값('Fall')을 반환합니다.
      if (possibleBehaviors.length === 0) {
        console.warn(`[Picky] No possible behaviors found for state:`, currentState, `Defaulting to 'Fall'.`);
        return 'Fall';
      }

      // 각 행동의 frequency(빈도)를 합산하여 가중치 총합을 구합니다.
      const totalFrequency = possibleBehaviors.reduce((sum, b) => sum + b.frequency, 0);
      let randomRoll = Math.random() * totalFrequency;

      // 가중치 기반 랜덤 선택: 룰렛을 돌리듯 다음 행동을 선택합니다.
      for (const behavior of possibleBehaviors) {
        if (randomRoll < behavior.frequency) return behavior.name;
        randomRoll -= behavior.frequency;
      }

      return 'Fall'; // 예외 상황에 대한 기본값
    };
  }, []);

  /**
   * @dev 메인 애니메이션 루프. 캐릭터의 모든 움직임을 담당합니다.
   */
  const animate = () => {
    const SPEED_DIVIDER = 3; // 숫자가 클수록 느려집니다. (3프레임당 1번 업데이트)
    animationSpeedCounter.current = (animationSpeedCounter.current + 1) % SPEED_DIVIDER;
    if (animationSpeedCounter.current !== 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    if (isDragging || isPinned) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    setCharacterState(prevState => {
      let { x, y, vx, vy, lookRight, actionName, behaviorName, actionFrame, sequenceFrame, actionContext, carriedIE } = prevState;

      // 1. 현재 행동(Action)을 데이터에서 찾습니다.
      let currentAction = shimejiData.actions.find(a => a.name === actionName);

      // 2. 현재 행동이 끝났는지 확인하고, 끝났다면 다음 행동으로 전환합니다.
      const totalDuration = actionContext.evaluatedDuration ?? (currentAction?.animations?.[0]?.poses.reduce((sum, p) => sum + p.duration, 0) || 1);
      if (actionFrame >= totalDuration) {
        actionFrame = 0;

        // [재수정된 로직] 목표 지점이 있고 아직 도달하지 않았다면, AI 개입 없이 현재 행동을 반복합니다.
        const targetX = actionContext.evaluatedTargetX;
        if (targetX !== null && targetX !== undefined && Math.abs(x - targetX) > 1) {
          // 목표가 있으므로 현재 행동을 계속 유지합니다.
          // actionFrame만 0으로 리셋되어 애니메이션이 반복됩니다.
        } else {
          // 목표 지점에 도달했거나 목표가 없는 경우에만 다음 행동으로 전환합니다.
          if (targetX !== null && targetX !== undefined) {
            actionContext.evaluatedTargetX = null; // 목표를 달성했으므로 초기화합니다.
          }

          let nextActionRef = null;
          const governingAction = shimejiData.actions.find(a => a.name === behaviorName);
          if (governingAction?.type === 'Sequence' && sequenceFrame < governingAction.actions.length) {
            nextActionRef = governingAction.actions[sequenceFrame];
            actionName = nextActionRef.name;
            sequenceFrame += 1;
          } else {
          // `selectNextBehavior`에 전달할 context 객체를 생성합니다.
          // 여기서 `isOn`은 boolean 값이 아닌, anchor 객체를 인자로 받아 boolean을 반환하는 함수여야 합니다.
          // 이렇게 해야 shimeji-data.js에 정의된 조건 함수들이 `mascot.environment.floor.isOn(mascot.anchor)`와 같은 형태로 올바르게 호출될 수 있습니다.
          // activeIE가 DOMRect일 수 있으므로 안전하게 일반 객체로 변환합니다.
            const plainActiveIE = activeIE ? { top: activeIE.top, left: activeIE.left, right: activeIE.right, bottom: activeIE.bottom, width: activeIE.width, height: activeIE.height } : null;
            const context = {
              mascot: {
                anchor: { x, y },
                footX: x,
                totalCount: 1,
                lookRight,
                environment: {
                  screen: { width: window.innerWidth, height: window.innerHeight },
                  floor: { isOn: (anchor) => anchor.y >= window.innerHeight - 128 },
                  workArea: {
                    left: 0,
                    right: window.innerWidth,
                    top: 0,
                    bottom: window.innerHeight,
                    width: window.innerWidth,
                    height: window.innerHeight,
                    leftBorder: { isOn: (anchor) => anchor.x <= 0 },
                    rightBorder: { isOn: (anchor) => anchor.x >= window.innerWidth - 128 },
                  },
                  ceiling: { isOn: (anchor) => anchor.y <= 0 },
                  cursor: { x: mousePosition.x, y: mousePosition.y, dx: 0, dy: 0 },
                  activeIE: plainActiveIE
                    ? {
                        ...plainActiveIE,
                        visible: true,
                        topBorder: { isOn: (anchor) => anchor.y === plainActiveIE.top },
                        bottomBorder: { isOn: (anchor) => anchor.y === plainActiveIE.bottom },
                        leftBorder: { isOn: (anchor) => anchor.x === plainActiveIE.left },
                        rightBorder: { isOn: (anchor) => anchor.x === plainActiveIE.right },
                      }
                    : {
                        visible: false,
                        topBorder: { isOn: () => false },
                        bottomBorder: { isOn: () => false },
                        leftBorder: { isOn: () => false },
                        rightBorder: { isOn: () => false },
                      },
                },
              },
            };
            behaviorName = selectNextBehavior(prevState, context);
            const newGoverningAction = shimejiData.actions.find(a => a.name === behaviorName);
            if (newGoverningAction?.type === 'Sequence' && newGoverningAction.actions.length > 0) {
              nextActionRef = newGoverningAction.actions[0];
              actionName = nextActionRef.name;
              sequenceFrame = 1;
            } else {
              actionName = behaviorName;
              sequenceFrame = 0;
            }
          }
          
          currentAction = shimejiData.actions.find(a => a.name === actionName);
          
        // [수정됨] 새로운 액션의 동적 속성을 평가하고 저장합니다. (targetX, targetY 포함)
        // activeIE가 DOMRect일 수 있으므로 안전하게 일반 객체로 변환합니다.
          const plainActiveIEForValue = activeIE ? { top: activeIE.top, left: activeIE.left, right: activeIE.right, bottom: activeIE.bottom, width: activeIE.width, height: activeIE.height } : null;
          const valueContext = { mascot: { anchor: { x, y }, lookRight, environment: { cursor: mousePosition, workArea: { width: window.innerWidth, height: window.innerHeight, left: 0, right: window.innerWidth, bottom: window.innerHeight }, activeIE: plainActiveIEForValue } } };
          actionContext = {
            evaluatedDuration: nextActionRef?.duration ? evaluateValue(nextActionRef.duration, valueContext) : null,
            evaluatedTargetX: nextActionRef?.targetX ? evaluateValue(nextActionRef.targetX, valueContext) : null,
            evaluatedTargetY: nextActionRef?.targetY ? evaluateValue(nextActionRef.targetY, valueContext) : null,
          };

        // [미끄러짐 버그 수정] 새로운 액션이 'Stand'일 경우, 이전 속도를 제거하여 미끄러짐을 방지합니다.
          if (actionName === 'Stand') {
            vx = 0;
          }
        }
      }

      // [수정됨] 아이템 관련 로직을 액션 전환 시점이 아닌, 액션의 첫 프레임에서 실행하도록 변경합니다.
      if (actionFrame === 0) {
        const valueContext = { mascot: { anchor: { x, y }, lookRight, environment: { cursor: mousePosition, workArea: { width: window.innerWidth, height: window.innerHeight, left: 0, right: window.innerWidth, bottom: window.innerHeight }, activeIE } } };
        if ((currentAction?.embedType === 'WalkWithIE' || currentAction?.embedType === 'FallWithIE') && activeIE) {
          const ieOffsetX = evaluateValue(currentAction.ieOffsetX || '0', valueContext);
          const ieOffsetY = evaluateValue(currentAction.ieOffsetY || '0', valueContext);
          const mutableRect = { x: activeIE.x, y: activeIE.y, width: activeIE.width, height: activeIE.height, top: activeIE.top, left: activeIE.left, right: activeIE.right, bottom: activeIE.bottom };
          
          if (carriedIERef.current.element) {
            const elem = carriedIERef.current.element;
            carriedIERef.current.originalStyles = {
              position: elem.style.position,
              zIndex: elem.style.zIndex,
              top: elem.style.top,
              left: elem.style.left,
            };
            elem.style.position = 'fixed';
            elem.style.zIndex = '2147483646';
          }
          
          carriedIE = { rect: mutableRect, offsetX: ieOffsetX, offsetY: ieOffsetY };
          setActiveIE(null);
        }
        if (currentAction?.embedType === 'ThrowIE' && carriedIE) {
          const initialVx = evaluateValue(currentAction.initialVx || '0', valueContext);
          const initialVy = evaluateValue(currentAction.initialVy || '0', valueContext);
          const gravity = evaluateValue(currentAction.gravity || '0.5', valueContext);
          
          if (carriedIERef.current.element) {
            const elem = carriedIERef.current.element;
            const { position, zIndex, top, left } = carriedIERef.current.originalStyles;
            elem.style.position = position;
            elem.style.zIndex = zIndex;
            elem.style.top = top;
            elem.style.left = left;
            carriedIERef.current.element = null;
          }

          setThrownIEs(prev => [...prev, {
            id: Date.now(), ...carriedIE,
            rect: {
              ...carriedIE.rect,
              x: x + (carriedIE.offsetX ?? 0),
              y: y + (carriedIE.offsetY ?? 0),
            },
            vx: initialVx * (lookRight ? 1 : -1), vy: initialVy, gravity,
          }]);
          carriedIE = null;
        }
      }

      // 3. 유효한 행동(Action)을 찾고, 없으면 'Falling'으로 대체합니다.
      // 이 단계에서 currentAction이 유효하지 않으면 다음 단계에서 오류가 발생할 수 있습니다.
      if (!currentAction || !currentAction.animations || currentAction.animations.length === 0) {
        actionName = 'Falling';
        currentAction = shimejiData.actions.find(a => a.name === 'Falling');

        // 'Falling' 액션조차 유효하지 않은 치명적인 경우를 대비합니다.
        if (!currentAction || !currentAction.animations || currentAction.animations.length === 0) {
          console.error(`[Picky] Critical Error: Action "${actionName}" is not valid. Check shimeji-data.js.`);
          // 앱이 멈추지 않도록 최소한의 상태만 업데이트하고 루프를 계속합니다.
          return { ...prevState, actionFrame: actionFrame + 1 };
        }
      }

      // 4. 현재 상태에 맞는 애니메이션을 선택합니다.
      // 컨텍스트를 매 프레임 다시 계산하여 SitAndLookAtMouse처럼 조건에 따라 애니메이션이 바뀌는 액션을 지원합니다.
      const plainActiveIEForAnim = activeIE ? { top: activeIE.top, left: activeIE.left, right: activeIE.right, bottom: activeIE.bottom, width: activeIE.width, height: activeIE.height } : null;
      const animContext = {
        mascot: {
          anchor: { x, y },
          footX: x,
          totalCount: 1,
          lookRight,
          environment: {
            screen: { width: window.innerWidth, height: window.innerHeight },
            floor: { isOn: (anchor) => anchor.y >= window.innerHeight - 128 },
            workArea: {
              left: 0,
              right: window.innerWidth,
              top: 0,
              bottom: window.innerHeight,
              width: window.innerWidth,
              height: window.innerHeight,
              leftBorder: { isOn: (anchor) => anchor.x <= 0 },
              rightBorder: { isOn: (anchor) => anchor.x >= window.innerWidth - 128 },
            },
            ceiling: { isOn: (anchor) => anchor.y <= 0 },
            cursor: { x: mousePosition.x, y: mousePosition.y, dx: 0, dy: 0 },
            activeIE: plainActiveIEForAnim
              ? {
                  ...plainActiveIEForAnim,
                  visible: true,
                  topBorder: { isOn: (anchor) => anchor.y === plainActiveIEForAnim.top },
                  bottomBorder: { isOn: (anchor) => anchor.y === plainActiveIEForAnim.bottom },
                  leftBorder: { isOn: (anchor) => anchor.x === plainActiveIEForAnim.left },
                  rightBorder: { isOn: (anchor) => anchor.x === plainActiveIEForAnim.right },
                }
              : {
                  visible: false,
                  topBorder: { isOn: () => false },
                  bottomBorder: { isOn: () => false },
                  leftBorder: { isOn: () => false },
                  rightBorder: { isOn: () => false },
                },
          },
        },
      };
      const animation = currentAction.animations.find(anim => !anim.condition || evaluateCondition(anim.condition, animContext)) || currentAction.animations[0];

      // 5. 현재 프레임에 맞는 포즈(pose)를 계산합니다.
      const currentTick = totalDuration > 0 ? actionFrame % totalDuration : 0;
      
      // poses 배열이 비어있는 경우를 대비한 추가 안전장치
      if (!animation.poses || animation.poses.length === 0) {
        console.error(`[Picky] Critical Error: Action "${actionName}" has no poses. Check shimeji-data.js.`);
        return { ...prevState, actionFrame: actionFrame + 1 };
      }
      
      let pose = animation.poses[0];
      let accumulatedDuration = 0;
      for (const p of animation.poses) {
        if (currentTick < accumulatedDuration + p.duration) {
          pose = p;
          break;
        }
        accumulatedDuration += p.duration;
      }

      // 6. 물리 엔진: 속도, 중력, 위치를 업데이트합니다.
      const { evaluatedTargetX } = actionContext;

      if (currentAction.embedType === 'Fall') {
        const gravity = Number(currentAction.gravity) || 0.5;
        const resistanceX = Number(currentAction.resistanceX) || 0.05;
        const resistanceY = Number(currentAction.resistanceY) || 0.01;
        vx = prevState.vx * (1 - resistanceX);
        vy = prevState.vy * (1 - resistanceY) + gravity;
      } else if (currentAction.embedType === 'Jump') {
        // [수정됨] 점프 시작(actionFrame === 0)과 진행을 분리하여 물리 로직 충돌을 해결합니다.
        if (actionFrame === 0) { // 점프 시작 프레임
          if (actionContext.evaluatedTargetX !== null && actionContext.evaluatedTargetY !== null) {
            const targetX = actionContext.evaluatedTargetX;
            const targetY = actionContext.evaluatedTargetY;
            const dx = targetX - x;
            const dy = targetY - y;
            const gravity = 0.5;
            const timeToTarget = 30;
            vx = dx / timeToTarget;
            vy = (dy - 0.5 * gravity * timeToTarget * timeToTarget) / timeToTarget;
          } else { // 일반 점프
            vx = prevState.vx;
            vy = -Number(currentAction.velocity) || -20;
          }
        } else { // 점프 진행 중
          vx = prevState.vx;
          vy = prevState.vy + 0.5;
        }
        // [신규] 목표 지점에 도달했는지 확인하고, 도달했다면 액션을 종료합니다.
        if (actionContext.evaluatedTargetX !== null && actionContext.evaluatedTargetY !== null) {
          if ((vx > 0 && x >= actionContext.evaluatedTargetX) || (vx < 0 && x <= actionContext.evaluatedTargetX)) {
            x = actionContext.evaluatedTargetX;
            y = actionContext.evaluatedTargetY;
            vx = 0;
            vy = 0;
            actionFrame = totalDuration;
          }
        }
      } else {
        // 걷기, 달리기 등 다른 모든 지상/공중 행동에 대한 물리 로직입니다.
        let newVx = pose.velocity.x * (lookRight ? -1 : 1);

        if (evaluatedTargetX !== null && evaluatedTargetX !== undefined) {
          // [2025-09-16 Cline] 목표 지점(targetX)이 있는 경우, 해당 지점으로 이동합니다.
          if (Math.abs(x - evaluatedTargetX) < Math.abs(newVx) * 2) {
            x = evaluatedTargetX;
            newVx = 0;
            actionFrame = totalDuration; // 목표 도달 시 액션 종료
          } else {
            lookRight = x < evaluatedTargetX;
            newVx = pose.velocity.x * (lookRight ? -1 : 1);
          }
        }

        if (prevState.y >= window.innerHeight - 128) {
          vy = 0;
          // [미끄러짐 버그 수정] '서기', '앉기' 등 정지 상태일 때는 수평 속도를 강제로 0으로 만듭니다.
          if (['Stand', 'Sit', 'Sprawl', 'SitAndLookUp', 'SitAndLookAtMouse'].includes(actionName)) {
            vx = 0;
          } else if (newVx !== 0) {
            vx = newVx;
          } else {
            // 마찰력 적용 (예: 넘어지는 동작)
            const fallAction = shimejiData.actions.find(a => a.name === 'Falling');
            const resistanceX = Number(fallAction?.resistanceX) || 0.1;
            vx = prevState.vx * (1 - resistanceX);
          }
        } else {
          vx = newVx !== 0 ? newVx : prevState.vx;
          vy = prevState.vy + 0.5;
        }
      }
      
      x += vx;
      y += vy;

      // 7. 화면 경계 및 플랫폼 충돌 처리
      // [수정됨] 이제 화면 바닥뿐만 아니라, 선택된 웹페이지 요소(activeIE)의 윗면도 바닥으로 인식합니다.
      const groundY = window.innerHeight - 128; // 화면 바닥의 Y좌표
      let isOnPlatform = false; // 캐릭터가 플랫폼(activeIE) 위에 있는지 여부를 나타내는 플래그

      // activeIE가 존재하고, 캐릭터가 떨어지는 중이며(vy >= 0), 캐릭터의 발이 activeIE의 윗면 경계 내에 있는지 확인합니다.
      if (activeIE && vy >= 0 && x + 64 > activeIE.left && x + 64 < activeIE.right && y + 128 >= activeIE.top && y + 128 <= activeIE.top + vy) {
        y = activeIE.top - 128; // 캐릭터의 위치를 플랫폼 위로 보정합니다.
        vy = 0; // 수직 속도를 0으로 만들어 멈춥니다.
        isOnPlatform = true; // 플랫폼 위에 있음을 표시합니다.
      } else if (y >= groundY) { // 화면 바닥 충돌 처리
        y = groundY;
        vy = 0;
      }

      // 캐릭터가 바닥 또는 플랫폼에 닿았고, 'Falling' 또는 'Jumping' 상태였다면,
      // 즉시 다음 행동으로 전환하도록 actionFrame을 강제로 종료시킵니다.
      if ((isOnPlatform || y === groundY) && ['Falling', 'Jumping'].includes(actionName)) {
        actionFrame = totalDuration;
      }
      if (x <= 0) { // 왼쪽 벽 충돌
        x = 0;
        lookRight = false; // 방향 전환
      }
      if (x >= window.innerWidth - 128) { // 오른쪽 벽 충돌
        x = window.innerWidth - 128;
        lookRight = true; // 방향 전환
      }
      if (y <= 0) { // 천장 충돌
        y = 0;
        vy = 0;
      }

      // 8. 다음 상태를 반환합니다.
      let nextState = { ...prevState, x, y, vx, vy, lookRight, sprite: pose.sprite, actionName, actionFrame: actionFrame + 1, behaviorName, sequenceFrame, actionContext, carriedIE };
      
      // [신규] 캐릭터가 아이템을 들고 있다면, 아이템의 위치를 캐릭터에 맞춰 업데이트합니다.
      if (nextState.carriedIE && typeof nextState.carriedIE === 'object' && carriedIERef.current.element) {
        const offsetX = nextState.carriedIE.offsetX ?? 0;
        const offsetY = nextState.carriedIE.offsetY ?? 0;
        const newLeft = nextState.x + offsetX;
        const newTop = nextState.y + offsetY;

        carriedIERef.current.element.style.left = `${newLeft}px`;
        carriedIERef.current.element.style.top = `${newTop}px`;

        nextState = {
          ...nextState,
          carriedIE: {
            ...nextState.carriedIE,
            rect: {
              ...nextState.carriedIE.rect,
              x: newLeft,
              y: newTop,
            }
          }
        };
      }
      
      return nextState;
    });

    // [2025-09-16 Cline] 던져진 아이템들의 물리 상태를 업데이트합니다.
    setThrownIEs(prev => 
      prev.map(item => ({
        ...item,
        rect: { ...item.rect, x: item.rect.x + item.vx, y: item.rect.y + item.vy },
        vy: item.vy + item.gravity,
      })).filter(item => item.rect.y < window.innerHeight + item.rect.height) // 화면 밖으로 나간 아이템 제거
    );

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // 컨텍스트 메뉴 핸들러 (변경 없음)
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ isOpen: true, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  // 메뉴 외부 클릭 시 닫기 로직 (변경 없음)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuWrapperRef.current && !contextMenuWrapperRef.current.contains(e.target)) {
        setContextMenu({ isOpen: false, x: 0, y: 0 });
      }
    };
    if (contextMenu.isOpen) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.isOpen]);

  // 드래그 및 마우스 위치 핸들러
  const handleMouseDown = (e) => {
    // [제거됨] 'Shift' + 클릭 로직을 제거하고, '요소 선택 모드'에서 클릭 시 최종 행동을 실행하는 로직으로 대체합니다.
    if (e.button !== 2) { 
      setIsDragging(true); 
      setCharacterState(prev => ({ ...prev, vx: 0, vy: 0 })); 
      dragInfo.current = { lastX: e.clientX, lastY: e.clientY, vx: 0, vy: 0 }; 
      e.preventDefault(); 
    } 
  };
  const handleMouseMove = (e) => { 
    setMousePosition({ x: e.clientX, y: e.clientY });
    if (isDragging) { 
      const dx = e.clientX - dragInfo.current.lastX; 
      const dy = e.clientY - dragInfo.current.lastY; 
      setCharacterState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy })); 
      dragInfo.current = { lastX: e.clientX, lastY: e.clientY, vx: dx, vy: dy }; 
    } 
    // [신규] '요소 선택 모드'일 때 마우스 아래 요소를 하이라이트합니다.
    if (selectionMode) {
      const elem = document.elementFromPoint(e.clientX, e.clientY);
      if (elem && elem.closest('.relative, .notification-popup, #picky-highlight-component') === null) {
        setHighlightedElement(elem.getBoundingClientRect());
      } else {
        setHighlightedElement(null);
      }
    }
  };
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setCharacterState(prev => ({ ...prev, vx: dragInfo.current.vx, vy: dragInfo.current.vy }));
    }
    // [신규] '요소 선택 모드'에서 클릭(mouseup) 시 최종 행동을 실행합니다.
    if (selectionMode && highlightedElement) {
      const elem = document.elementFromPoint(highlightedElement.left + highlightedElement.width / 2, highlightedElement.top + highlightedElement.height / 2);
      if (elem) {
        carriedIERef.current.element = elem;
      }
      setActiveIE(highlightedElement);
      
      if (selectionMode === 'throw') {
        // [수정됨] 캐릭터의 위치를 판단하여 올바른 '..._New' 시퀀스를 직접 호출합니다.
        const centerX = highlightedElement.left + highlightedElement.width / 2;
        const actionName = characterState.x < centerX ? 'ThrowElementFromLeft_New' : 'ThrowElementFromRight_New';
        forceCharacterAction(actionName);
      } else if (selectionMode === 'jump') {
        // 마우스 위치에 가장 가까운 모서리를 계산하여 해당 방향으로 점프합니다.
        const { x, y } = mousePosition;
        const { left, right, top, bottom } = highlightedElement;
        const distTop = Math.abs(y - top);
        const distBottom = Math.abs(y - bottom);
        const distLeft = Math.abs(x - left);
        const distRight = Math.abs(x - right);
        const min = Math.min(distTop, distBottom, distLeft, distRight);

        let actionName = 'JumpFromBottomOfIE'; // 기본값
        if (min === distLeft) actionName = 'JumpFromLeftEdgeOfIE';
        else if (min === distRight) actionName = 'JumpFromRightEdgeOfIE';
        // 'JumpFromBottomOfIE'는 위에서 점프하는 로직이 없으므로, top일 때도 bottom을 사용합니다.
        
        forceCharacterAction(actionName);
      }

      // 모드 종료
      setSelectionMode(null);
      setHighlightedElement(null);
    } else if (selectionMode) {
      // 유효하지 않은 곳을 클릭하면 모드를 취소합니다.
      setSelectionMode(null);
      setHighlightedElement(null);
    }
  };
  useEffect(() => { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [isDragging, selectionMode, highlightedElement, characterState.x]);
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, activeIE]);

  // [신규] background.js로부터 추천 메시지를 수신하는 리스너
  useEffect(() => {
    const messageListener = (message, _sender, _sendResponse) => {
      if (message.type === 'SHOW_RECOMMENDATION') {
        console.log('📢 추천 수신:', message.payload);
        setRecommendation(message.payload);
        setIsScrapped(message.payload.isScrapped || false); // 스크랩 상태 초기화
        setHasNotification(true);
        setIsPopupOpen(false); // 새 추천이 오면 기존 팝업은 닫음
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  // [신규] 백그라운드에 메시지를 보내는 헬퍼 함수
  const sendMessageToBackground = (message) => {
    return new Promise((resolve, reject) => {
      if (chrome.runtime?.id) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message || "Extension context invalidated."));
          }
          resolve(response);
        });
      } else {
        reject(new Error("Extension context invalidated."));
      }
    });
  };

  // [수정] 캐릭터 클릭 핸들러
  const handleCharacterClick = () => {
    if (!hasNotification || !recommendation) return;
    setIsPopupOpen(true);
    setHasNotification(false);
    setShowQuizResult(false);
    setQuizResult(null); // 팝업 열 때 결과 초기화
    // 팝업을 열었음을 백그라운드에 알림 (피드백)
    sendMessageToBackground({
      type: 'ACKNOWLEDGE_RECOMMENDATION',
      payload: { slotId: recommendation.slotId, eventType: 'OPENED' },
    });
  };

  // [수정] 팝업 닫기 핸들러
  const handleClosePopup = () => {
    setIsPopupOpen(false);
    // 팝업을 사용자가 직접 닫았음을 백그라운드에 알림 (피드백)
    if (recommendation) {
      sendMessageToBackground({
        type: 'ACKNOWLEDGE_RECOMMENDATION',
        payload: { slotId: recommendation.slotId, eventType: 'DISMISS' },
      });
    }
  };

  // [신규] 퀴즈 답변 핸들러 (background script 경유)
  const handleQuizAnswer = async (answer) => {
    if (!recommendation || recommendation.contentType !== 'QUIZ') return;
    setShowQuizResult(true); // 먼저 UI를 결과 화면으로 전환

    try {
      const result = await sendMessageToBackground({
        type: 'SUBMIT_QUIZ_ANSWER',
        payload: {
          quizId: recommendation.contentId,
          userAnswer: answer,
          slotId: recommendation.slotId,
        },
      });

      if (result && result.success) {
        setQuizResult(result.data); // API 결과를 상태에 저장
      } else {
        throw new Error(result?.error || '백그라운드 스크립트에서 알 수 없는 오류 발생');
      }
    } catch (error) {
      console.error("퀴즈 답변 제출 실패:", error);
      // 에러 발생 시 간단한 결과 객체 생성
      setQuizResult({ isCorrect: false, explanation: "오류가 발생했습니다. 잠시 후 다시 시도해주세요." });
    }
  };
  
  // [수정] 스크랩 토글 핸들러
  const handleScrapToggle = async () => {
    if (!recommendation) return;
    try {
      const result = await sendMessageToBackground({
        type: 'TOGGLE_SCRAP',
        payload: {
          contentType: recommendation.contentType,
          contentId: recommendation.contentId,
        },
      });

      if (result && result.success) {
        setIsScrapped(result.isScrapped); // UI 상태 업데이트
      } else {
        console.error("스크랩 토글 실패:", result?.error);
      }
    } catch (error) {
      console.error("스크랩 토글 메시지 전송 실패:", error);
    }
  };

  const [spritesheetUrl, setSpritesheetUrl] = useState('');

  useEffect(() => {
    if (chrome?.runtime?.getURL) {
      setSpritesheetUrl(chrome.runtime.getURL(shimejiData.spritesheet.substring(1))); // Remove leading '/'
    } else {
      // Fallback for development environments where chrome API is not available
      setSpritesheetUrl(shimejiData.spritesheet);
    }
  }, []);

  // JSX 렌더링
  return (
    <>
      <div style={{ zIndex: 2147483647, position: 'fixed', top: 0, left: 0, pointerEvents: 'none', transform: `translate(${characterState.x}px, ${characterState.y}px)` }}>
        <div ref={contextMenuWrapperRef} className="relative" style={{ pointerEvents: 'auto' }} onMouseDown={handleMouseDown} onContextMenu={handleContextMenu}>
          <div
            onClick={handleCharacterClick}
            style={{
              width: '128px', height: '128px',
              backgroundImage: `url(${spritesheetUrl})`,
              backgroundPosition: `-${shimejiData.sprites[characterState.sprite]?.x || 0}px -${shimejiData.sprites[characterState.sprite]?.y || 0}px`,
              transform: `scaleX(${characterState.lookRight ? -1 : 1})`,
              cursor: isDragging ? 'grabbing' : (selectionMode ? 'crosshair' : 'pointer'),
            }}
          />
          {hasNotification && <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">!</span></div>}
          {/* [수정] 이제 실제 DOM을 움직이므로, 파란색 박스는 렌더링하지 않습니다. */}
          {/* {characterState.carriedIE && characterState.carriedIE.rect && (
            <div style={{ position: 'fixed', top: characterState.carriedIE.rect.y, left: characterState.carriedIE.rect.x, width: characterState.carriedIE.rect.width, height: characterState.carriedIE.rect.height, border: '2px dashed blue', background: 'rgba(0,0,255,0.1)', zIndex: 2147483645, pointerEvents: 'none' }} />
          )} */}
          {contextMenu.isOpen && (
            <CustomContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              isPinned={isPinned}
              onTogglePin={() => setIsPinned((prev) => !prev)}
              onSelect={(actionName) => {
                forceCharacterAction(actionName);
                setContextMenu({ isOpen: false, x: 0, y: 0 });
              }}
            />
          )}
        </div>

      {isPopupOpen && recommendation && (
        <div className="absolute bottom-full mb-2 z-50 w-80" style={{ left: '-80px', pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200 font-sans text-sm text-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                {recommendation.contentType === 'NEWS' && <div className="font-bold text-purple-700">{recommendation.title}</div>}
                {recommendation.contentType === 'QUIZ' && <div className="font-bold text-blue-700">퀴즈 타임!</div>}
                {recommendation.contentType === 'FACT' && <div className="font-bold text-green-700">알고 계셨나요?</div>}
              </div>
              <button onClick={handleClosePopup} className="p-1 hover:bg-gray-100 rounded-full"><X size={16} /></button>
            </div>

            {/* News Content */}
            {recommendation.contentType === 'NEWS' && (
              <div>
                <p className="mb-2">{recommendation.extras.summary}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{recommendation.extras.categoryName}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => window.open(recommendation.url, '_blank')} className="flex items-center gap-1 hover:text-purple-600"><ExternalLink size={12} /> 전문 보기</button>
                    <button onClick={handleScrapToggle} className="flex items-center gap-1 hover:text-purple-600">
                      <Bookmark size={12} className={isScrapped ? 'fill-current text-yellow-500' : ''} /> 스크랩
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quiz Content */}
            {recommendation.contentType === 'QUIZ' && (
              <div>
                <div className="text-xs text-gray-500 mb-2 font-semibold bg-gray-100 px-2 py-1 rounded-md inline-block">{recommendation.extras.title}</div>
                <p className="mb-3">{recommendation.question}</p>
                {!showQuizResult ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleQuizAnswer(true)} className="flex-1 bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-md">O (맞음)</button>
                    <button onClick={() => handleQuizAnswer(false)} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-md">X (틀림)</button>
                  </div>
                ) : (
                  quizResult ? (
                    <div className={`p-2 rounded-md ${quizResult.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {quizResult.isCorrect ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                        <span className="font-bold">{quizResult.isCorrect ? '정답입니다!' : '오답입니다!'}</span>
                      </div>
                      {!quizResult.isCorrect && (
                        <p className="text-xs text-gray-600 mb-2">{quizResult.explanation}</p>
                      )}
                      <div className="flex justify-end items-center text-xs text-gray-500">
                        <button onClick={handleScrapToggle} className="flex items-center gap-1 hover:text-purple-600">
                          <Bookmark size={12} className={isScrapped ? 'fill-current text-yellow-500' : ''} /> 스크랩
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-md bg-gray-100 text-center">
                      <p className="text-xs text-gray-600">채점 중...</p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Fact Content */}
            {recommendation.contentType === 'FACT' && (
              <div>
                <p className="font-semibold mb-1">{recommendation.title}</p>
                <p className="text-xs text-gray-600">{recommendation.extras.content}</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      {thrownIEs.map(item => (
        <div key={item.id} style={{ position: 'fixed', left: item.rect.x, top: item.rect.y, width: item.rect.width, height: item.rect.height, border: '2px dashed green', zIndex: 2147483646, pointerEvents: 'none', background: 'rgba(0,255,0,0.1)' }} />
      ))}
      {/* [신규] 하이라이트 컴포넌트를 렌더링합니다. */}
      <HighlightComponent elementRect={highlightedElement} selectionMode={selectionMode} mousePosition={mousePosition} />
    </>
  );
}

export default Overlay;
