// 캐릭터 썸네일 및 선택 UI에 필요한 데이터입니다.

// 모든 캐릭터가 공유하는 스프라이트 좌표 맵
export const commonSprites = {
    "/shime1.png": { x: 128, y: 0, width: 128, height: 128 },
};

// 'Picky' 캐릭터의 고유 데이터입니다.
const pickyData = {
  id: "picky",
  spritesheet: "/images/characters/picky.png",
  metadata: {
    shimeji: "picky",
    shimejiName: "피키",
  },
};

// 'Blank Guy' 캐릭터의 고유 데이터입니다.
const blankGuyData = {
  id: "blank-guy",
  spritesheet: "/images/characters/blank-guy.png",
  metadata: {
    shimeji: "blank-guy",
    shimejiName: "피키맨",
  },
};

// 'Polar Bear' 캐릭터의 고유 데이터입니다.
const polarBearData = {
  id: "polar-bear",
  spritesheet: "/images/characters/polar-bear.png",
  metadata: {
    shimeji: "polar-bear",
    shimejiName: "피키베어",
  },
};

// 'Ghost' 캐릭터의 고유 데이터입니다.
const ghostData = {
  id: "ghost",
  spritesheet: "/images/characters/ghost.png",
  metadata: {
    shimeji: "ghost",
    shimejiName: "피키부우",
  },
};

// UI에서 사용할 수 있도록 캐릭터 목록을 export 합니다.
export const availableCharacters = {
  'picky': pickyData,
  'polar-bear': polarBearData,
  'ghost': ghostData,
  'blank-guy': blankGuyData,
};
