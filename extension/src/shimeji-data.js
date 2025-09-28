import { commonActions, commonBehaviors, commonSprites } from './behaviors.js';
import { blankGuyData } from './characters/blank-guy.js';
import { polarBearData } from './characters/polar-bear.js';
import { ghostData } from './characters/ghost.js';

// 사용 가능한 모든 캐릭터의 데이터를 맵 형태로 관리하고 export합니다.
export const availableCharacters = {
  'blank-guy': blankGuyData,
  'polar-bear': polarBearData,
  'ghost': ghostData,
};

/**
 * 지정된 캐릭터 ID에 해당하는 완전한 shimeji 데이터를 생성합니다.
 * @param {string} characterId - 불러올 캐릭터의 ID
 * @returns {object} 완성된 shimeji 데이터 객체
 */
function createShimejiData(characterId) {
  const characterData = availableCharacters[characterId];

  if (!characterData) {
    console.error(`[shimeji-data] Error: Character "${characterId}" not found.`);
    // 기본 캐릭터 데이터로 대체하여 반환
    return createShimejiData('blank-guy');
  }

  // 캐릭터 고유 데이터와 공통 데이터를 합칩니다.
  return {
    id: characterData.id,
    spritesheet: characterData.spritesheet,
    metadata: characterData.metadata,
    sprites: commonSprites,
    actions: commonActions,
    behaviors: commonBehaviors,
  };
}

// 기본으로 'blank-guy' 캐릭터 데이터를 export 합니다.
// 실제 사용 시에는 getShimejiData 함수를 통해 원하는 캐릭터를 불러와야 합니다.
export const shimejiData = createShimejiData('blank-guy');

/**
 * 특정 캐릭터의 데이터를 가져오는 함수.
 * 향후 캐릭터 선택 기능이 추가되면 이 함수를 사용합니다.
 * @param {string} characterId - 'blank-guy', 'polar-bear', 'ghost' 등
 * @returns {object} 해당 캐릭터의 완성된 데이터
 */
export function getShimejiData(characterId = 'blank-guy') {
  return createShimejiData(characterId);
}
