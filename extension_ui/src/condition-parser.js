/**
 * @file shimeji-data.js에 정의된 조건부 함수를 평가하는 파서입니다.
 * CSP 'unsafe-eval' 제약으로 인해 new Function()을 사용하지 않고,
 * 데이터 파일에 미리 정의된 함수를 직접 실행합니다.
 */

/**
 * shimeji-data.js의 조건부 함수를 평가하여 boolean 값을 반환합니다.
 * @param {string | Function} condition - 평가할 조건부 함수 또는 문자열
 * @param {object} context - 캐릭터와 환경의 현재 상태를 담은 객체
 * @returns {boolean} 조건 평가 결과
 */
export function evaluateCondition(condition, context) {
  if (typeof condition !== 'function') {
    // 함수가 아닌 경우, 비어있지 않은 모든 값을 true로 간주합니다.
    return !!condition;
  }
  try {
    // context 객체는 { mascot: ... } 형태이므로, mascot 객체를 인자로 전달합니다.
    // [수정] Math, Number 객체도 전달하여 abs() 같은 함수를 사용할 수 있도록 합니다.
    return !!condition(context.mascot, Math, Number);
  } catch (error) {
    console.warn(`[Picky Parser] Error evaluating condition function:`, error);
    return false; // 오류 발생 시 false를 반환하여 조건이 실패한 것으로 간주합니다.
  }
}

/**
 * shimeji-data.js의 표현식 함수를 평가하여 숫자나 다른 값을 반환합니다.
 * @param {string | Function} expression - 평가할 표현식 함수 또는 값
 * @param {object} context - 캐릭터와 환경의 현재 상태를 담은 객체
 * @returns {*} 표현식 평가 결과
 */
export function evaluateValue(expression, context) {
  if (typeof expression !== 'function') {
    // 함수가 아니면, 값을 그대로 반환하거나 숫자로 변환 시도
    const num = Number(expression);
    return isNaN(num) ? expression : num;
  }
  try {
    // 값 표현식은 Math, Number 객체에도 접근할 수 있습니다.
    return expression(context.mascot, Math, Number);
  } catch (error) {
    console.warn(`[Picky Parser] Error evaluating value function:`, error);
    return null; // 오류 발생 시 null 반환
  }
}
