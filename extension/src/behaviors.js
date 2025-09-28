// 이 파일은 모든 캐릭터가 공유하는 행동(actions)과 AI(behaviors) 로직을 정의합니다.

export const commonSprites = {
    "/shime30.png": { x: 0, y: 0, width: 128, height: 128 },
    "/shime1.png": { x: 128, y: 0, width: 128, height: 128 },
    "/shime11.png": { x: 0, y: 128, width: 128, height: 128 },
    "/shime12.png": { x: 128, y: 128, width: 128, height: 128 },
    "/shime13.png": { x: 256, y: 0, width: 128, height: 128 },
    "/shime14.png": { x: 256, y: 128, width: 128, height: 128 },
    "/shime15.png": { x: 0, y: 256, width: 128, height: 128 },
    "/shime16.png": { x: 128, y: 256, width: 128, height: 128 },
    "/shime17.png": { x: 256, y: 256, width: 128, height: 128 },
    "/shime18.png": { x: 384, y: 0, width: 128, height: 128 },
    "/shime19.png": { x: 384, y: 128, width: 128, height: 128 },
    "/shime2.png": { x: 384, y: 256, width: 128, height: 128 },
    "/shime20.png": { x: 0, y: 384, width: 128, height: 128 },
    "/shime21.png": { x: 128, y: 384, width: 128, height: 128 },
    "/shime22.png": { x: 256, y: 384, width: 128, height: 128 },
    "/shime23.png": { x: 384, y: 384, width: 128, height: 128 },
    "/shime24.png": { x: 512, y: 0, width: 128, height: 128 },
    "/shime25.png": { x: 512, y: 128, width: 128, height: 128 },
    "/shime26.png": { x: 512, y: 256, width: 128, height: 128 },
    "/shime27.png": { x: 512, y: 384, width: 128, height: 128 },
    "/shime28.png": { x: 0, y: 512, width: 128, height: 128 },
    "/shime29.png": { x: 128, y: 512, width: 128, height: 128 },
    "/shime3.png": { x: 256, y: 512, width: 128, height: 128 },
    "/shime10.png": { x: 384, y: 512, width: 128, height: 128 },
    "/shime31.png": { x: 512, y: 512, width: 128, height: 128 },
    "/shime32.png": { x: 640, y: 0, width: 128, height: 128 },
    "/shime33.png": { x: 640, y: 128, width: 128, height: 128 },
    "/shime34.png": { x: 640, y: 256, width: 128, height: 128 },
    "/shime35.png": { x: 640, y: 384, width: 128, height: 128 },
    "/shime36.png": { x: 640, y: 512, width: 128, height: 128 },
    "/shime37.png": { x: 0, y: 640, width: 128, height: 128 },
    "/shime38.png": { x: 128, y: 640, width: 128, height: 128 },
    "/shime39.png": { x: 256, y: 640, width: 128, height: 128 },
    "/shime4.png": { x: 384, y: 640, width: 128, height: 128 },
    "/shime40.png": { x: 512, y: 640, width: 128, height: 128 },
    "/shime41.png": { x: 640, y: 640, width: 128, height: 128 },
    "/shime42.png": { x: 768, y: 0, width: 128, height: 128 },
    "/shime43.png": { x: 768, y: 128, width: 128, height: 128 },
    "/shime44.png": { x: 768, y: 256, width: 128, height: 128 },
    "/shime45.png": { x: 768, y: 384, width: 128, height: 128 },
    "/shime46.png": { x: 768, y: 512, width: 128, height: 128 },
    "/shime5.png": { x: 768, y: 640, width: 128, height: 128 },
    "/shime6.png": { x: 0, y: 768, width: 128, height: 128 },
    "/shime7.png": { x: 128, y: 768, width: 128, height: 128 },
    "/shime8.png": { x: 256, y: 768, width: 128, height: 128 },
    "/shime9.png": { x: 384, y: 768, width: 128, height: 128 },
};

export const commonActions = [
    { type: "Embedded", name: "Look", embedType: "Look" },
    { type: "Embedded", name: "Offset", embedType: "Offset" },
    {
      type: "Stay",
      name: "Stand",
      animations: [
        {
          poses: [
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Move",
      name: "Walk",
      animations: [
        {
          poses: [
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
            {
              sprite: "/shime2.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
            {
              sprite: "/shime3.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Move",
      name: "Run",
      animations: [
        {
          poses: [
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -4, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime2.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -4, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -4, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime3.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -4, y: 0 },
              duration: 2,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Move",
      name: "Dash",
      animations: [
        {
          poses: [
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime2.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime3.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Stay",
      name: "Sit",
      animations: [
        {
          poses: [
            {
              sprite: "/shime11.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Stay",
      name: "SitAndLookAtMouse",
      animations: [
        {
          poses: [
            {
              sprite: "/shime26.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
          condition: (mascot) => mascot.environment.cursor.y < mascot.environment.screen.height / 2,
        },
        {
          poses: [
            {
              sprite: "/shime11.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Stay",
      name: "Sprawl",
      animations: [
        {
          poses: [
            {
              sprite: "/shime21.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Move",
      name: "Creep",
      animations: [
        {
          poses: [
            {
              sprite: "/shime20.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 28,
            },
            {
              sprite: "/shime20.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime21.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime21.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -1, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime21.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 24,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Stay",
      name: "GrabCeiling",
      animations: [
        {
          poses: [
            {
              sprite: "/shime23.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      borderType: "Ceiling",
    },
    {
      type: "Move",
      name: "ClimbCeiling",
      animations: [
        {
          poses: [
            {
              sprite: "/shime25.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: 0, y: 0 },
              duration: 16,
            },
            {
              sprite: "/shime25.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: -1, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime23.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: -1, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime24.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: -1, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime24.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: 0, y: 0 },
              duration: 16,
            },
            {
              sprite: "/shime24.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: -2, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime23.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: -2, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime25.png",
              anchor: { x: 64, y: 48 },
              velocity: { x: -2, y: 0 },
              duration: 4,
            },
          ],
        },
      ],
      borderType: "Ceiling",
    },
    {
      type: "Stay",
      name: "GrabWall",
      animations: [
        {
          poses: [
            {
              sprite: "/shime13.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      borderType: "Wall",
    },
    {
      type: "Move",
      name: "ClimbWall",
      animations: [
        {
          poses: [
            {
              sprite: "/shime14.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 16,
            },
            {
              sprite: "/shime14.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: -1 },
              duration: 4,
            },
            {
              sprite: "/shime12.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: -1 },
              duration: 4,
            },
            {
              sprite: "/shime13.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: -1 },
              duration: 4,
            },
            {
              sprite: "/shime13.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 16,
            },
            {
              sprite: "/shime13.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: -2 },
              duration: 4,
            },
            {
              sprite: "/shime12.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: -2 },
              duration: 4,
            },
            {
              sprite: "/shime14.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: -2 },
              duration: 4,
            },
          ],
          condition: (mascot) => mascot.targetY < mascot.anchor.y,
        },
        {
          poses: [
            {
              sprite: "/shime14.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 16,
            },
            {
              sprite: "/shime14.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 2 },
              duration: 4,
            },
            {
              sprite: "/shime12.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 2 },
              duration: 4,
            },
            {
              sprite: "/shime13.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 2 },
              duration: 4,
            },
            {
              sprite: "/shime13.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 16,
            },
            {
              sprite: "/shime13.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 1 },
              duration: 4,
            },
            {
              sprite: "/shime12.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 1 },
              duration: 4,
            },
            {
              sprite: "/shime14.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 1 },
              duration: 4,
            },
          ],
          condition: (mascot) => mascot.targetY >= mascot.anchor.y,
        },
      ],
      borderType: "Wall",
    },
    {
      type: "Embedded",
      name: "FallWithIe",
      animations: [
        {
          poses: [
            {
              sprite: "/shime36.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      embedType: "FallWithIE",
      ieOffsetX: "0",
      ieOffsetY: "-64",
    },
    {
      type: "Embedded",
      name: "WalkWithIe",
      animations: [
        {
          poses: [
            {
              sprite: "/shime34.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
            {
              sprite: "/shime35.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
            {
              sprite: "/shime34.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
            {
              sprite: "/shime36.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 6,
            },
          ],
        },
      ],
      borderType: "Floor",
      embedType: "WalkWithIE",
      ieOffsetX: "0",
      ieOffsetY: "-64",
    },
    {
      type: "Embedded",
      name: "RunWithIe",
      animations: [
        {
          poses: [
            {
              sprite: "/shime34.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime35.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime34.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime36.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 2,
            },
          ],
        },
      ],
      borderType: "Floor",
      embedType: "WalkWithIE",
      ieOffsetX: "0",
      ieOffsetY: "-64",
    },
    {
      type: "Embedded",
      name: "ThrowIe",
      animations: [
        {
          poses: [
            {
              sprite: "/shime37.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 40,
            },
          ],
        },
      ],
      borderType: "Floor",
      embedType: "ThrowIE",
      initialVx: "32",
      initialVy: "-10",
      gravity: "0.5",
    },
    {
      type: "Embedded",
      name: "Jumping",
      animations: [
        {
          poses: [
            {
              sprite: "/shime22.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      embedType: "Jump",
      velocity: "20",
    },
    {
      type: "Embedded",
      name: "Falling",
      animations: [
        {
          poses: [
            {
              sprite: "/shime4.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 250,
            },
          ],
        },
      ],
      embedType: "Fall",
      resistanceX: "0.05",
      resistanceY: "0.1",
      gravity: "2",
    },
    {
      type: "Animate",
      name: "Bouncing",
      animations: [
        {
          poses: [
            {
              sprite: "/shime18.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime19.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 4,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Animate",
      name: "Tripping",
      animations: [
        {
          poses: [
            {
              sprite: "/shime19.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -8, y: 0 },
              duration: 8,
            },
            {
              sprite: "/shime18.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -4, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime20.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: -2, y: 0 },
              duration: 4,
            },
            {
              sprite: "/shime20.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 10,
            },
            {
              sprite: "/shime19.png",
              anchor: { x: 64, y: 104 },
              velocity: { x: -4, y: 0 },
              duration: 4,
            },
          ],
        },
      ],
      borderType: "Floor",
    },
    {
      type: "Embedded",
      name: "Pinched",
      animations: [
        {
          poses: [
            {
              sprite: "/shime9.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
          ],
          condition: (mascot) => mascot.footX < mascot.environment.cursor.x - 50,
        },
        {
          poses: [
            {
              sprite: "/shime7.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
          ],
          condition: (mascot) => mascot.footX < mascot.environment.cursor.x - 30,
        },
        {
          poses: [
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
          ],
          condition: (mascot) => mascot.footX < mascot.environment.cursor.x + 30,
        },
        {
          poses: [
            {
              sprite: "/shime8.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
          ],
          condition: (mascot) => mascot.footX < mascot.environment.cursor.x + 50,
        },
        {
          poses: [
            {
              sprite: "/shime10.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
          ],
          condition: (mascot) => mascot.footX >= mascot.environment.cursor.x + 30,
        },
      ],
      embedType: "Dragged",
    },
    {
      type: "Embedded",
      name: "Resisting",
      animations: [
        {
          poses: [
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 50,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime1.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 100,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 5,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime5.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
            {
              sprite: "/shime6.png",
              anchor: { x: 64, y: 128 },
              velocity: { x: 0, y: 0 },
              duration: 2,
            },
          ],
        },
      ],
      embedType: "Regist",
    },
    {
      type: "Sequence",
      name: "Fall",
      actions: [
        { type: "Reference", name: "Falling" },
        {
          type: "Select",
          actions: [
            {
              type: "Sequence",
              actions: [
                { type: "Reference", name: "Bouncing" },
                {
                  type: "Reference",
                  name: "Stand",
                  duration: (mascot, Math) => 100 + Math.random() * 100,
                },
              ],
              condition: (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
            },
            { type: "Reference", name: "GrabWall", duration: "100" },
          ],
        },
      ],
    },
    {
      type: "Sequence",
      name: "Dragged",
      actions: [
        { type: "Reference", name: "Pinched" },
        { type: "Reference", name: "Resisting" },
      ],
    },
    {
      type: "Sequence",
      name: "Thrown",
      actions: [
        {
          type: "Reference",
          name: "Falling",
          initialVx: (mascot) => mascot.environment.cursor.dx,
          initialVy: (mascot) => mascot.environment.cursor.dy,
        },
        {
          type: "Select",
          actions: [
            {
              type: "Sequence",
              actions: [
                { type: "Reference", name: "Bouncing" },
                {
                  type: "Reference",
                  name: "Stand",
                  duration: (mascot, Math) => 100 + Math.random() * 100,
                },
              ],
              condition: (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
            },
            { type: "Reference", name: "GrabWall", duration: "100" },
          ],
        },
      ],
    },
    {
      type: "Sequence",
      name: "StandUp",
      actions: [
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "SitDown",
      actions: [
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "LieDown",
      actions: [
        {
          type: "Reference",
          name: "Sprawl",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "HoldOntoWall",
      actions: [
        {
          type: "Reference",
          name: "GrabWall",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "FallFromWall",
      actions: [
        {
          type: "Reference",
          name: "Offset",
          x: (mascot) => mascot.lookRight ? -1 : 1,
        },
        { type: "Reference", name: "Stand" },
      ],
    },
    {
      type: "Sequence",
      name: "HoldOntoCeiling",
      actions: [
        {
          type: "Reference",
          name: "GrabCeiling",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "FallFromCeiling",
      actions: [
        { type: "Reference", name: "Offset", y: "1" },
        { type: "Reference", name: "Stand" },
      ],
    },
    {
      type: "Sequence",
      name: "WalkAlongWorkAreaFloor",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.workArea.left + 64 + Math.random() * (mascot.environment.workArea.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "RunAlongWorkAreaFloor",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.workArea.left + 64 + Math.random() * (mascot.environment.workArea.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "CrawlAlongWorkAreaFloor",
      actions: [
        {
          type: "Reference",
          name: "Creep",
          targetX: (mascot, Math) => mascot.environment.workArea.left + 64 + Math.random() * (mascot.environment.workArea.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkLeftAlongFloorAndSit",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.workArea.left + 100 + Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        { type: "Reference", name: "Look", lookRight: "true" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkRightAlongFloorAndSit",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.workArea.right - 100 - Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        { type: "Reference", name: "Look", lookRight: "false" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "GrabWorkAreaBottomLeftWall",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot) => mascot.environment.workArea.left,
        },
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.workArea.bottom - 64,
        },
      ],
    },
    {
      type: "Sequence",
      name: "GrabWorkAreaBottomRightWall",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot) => mascot.environment.workArea.right,
        },
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.workArea.bottom - 64,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkLeftAndSit",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.workArea.left + 100 + Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        { type: "Reference", name: "Look", lookRight: "true" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkRightAndSit",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.workArea.right - 100 - Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        { type: "Reference", name: "Look", lookRight: "false" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 20 + Math.random() * 20,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkAndGrabBottomLeftWall",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot) => mascot.environment.workArea.left,
        },
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.workArea.bottom - 64,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkAndGrabBottomRightWall",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot) => mascot.environment.workArea.right,
        },
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.workArea.bottom - 64,
        },
      ],
    },
    {
      type: "Sequence",
      name: "JumpFromBottomOfIE",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot, Math) => (mascot.anchor.x * 3 + mascot.environment.activeIE.left + Math.random() * mascot.environment.activeIE.width) / 4,
          targetY: (mascot) => mascot.environment.activeIE.bottom,
        },
        {
          type: "Reference",
          name: "GrabCeiling",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "ClimbHalfwayAlongWall",
      actions: [
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot, Math) => mascot.environment.workArea.top + 64 + Math.random() * (mascot.environment.workArea.height - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "ClimbAlongWall",
      actions: [
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.workArea.top + 64,
        },
        { type: "Reference", name: "Offset", y: "-64" },
        { type: "Reference", name: "Look" },
        {
          type: "Reference",
          name: "ClimbCeiling",
          targetX: (mascot, Math) => mascot.lookRight ? mascot.environment.workArea.left + Math.random() * 100 : mascot.environment.workArea.right - Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "ClimbAlongCeiling",
      actions: [
        {
          type: "Reference",
          name: "ClimbCeiling",
          targetX: (mascot, Math) => mascot.environment.workArea.left + 64 + Math.random() * (mascot.environment.workArea.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkAlongIECeiling",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + 64 + Math.random() * (mascot.environment.activeIE.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "RunAlongIECeiling",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + 64 + Math.random() * (mascot.environment.activeIE.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "CrawlAlongIECeiling",
      actions: [
        {
          type: "Reference",
          name: "Creep",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + 64 + Math.random() * (mascot.environment.activeIE.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "SitOnTheLeftEdgeOfIE",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + 100 + Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "SitOnTheRightEdgeOfIE",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.activeIE.right - 100 - Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "JumpFromLeftEdgeOfIE",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + Math.random() * 50,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
        {
          type: "Reference",
          name: "Falling",
          initialVx: (mascot, Math) => -15 - Math.random() * 5,
          initialVy: (mascot, Math) => -20 - Math.random() * 5,
        },
        { type: "Reference", name: "Bouncing" },
      ],
    },
    {
      type: "Sequence",
      name: "JumpFromRightEdgeOfIE",
      actions: [
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.environment.activeIE.right - Math.random() * 50,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
        {
          type: "Reference",
          name: "Falling",
          initialVx: (mascot, Math) => 15 + Math.random() * 5,
          initialVy: (mascot, Math) => -20 - Math.random() * 5,
        },
        { type: "Reference", name: "Bouncing" },
      ],
    },
    {
      type: "Sequence",
      name: "WalkLeftAlongIEAndSit",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + 100 + Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkRightAlongIEAndSit",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.activeIE.right - 100 - Math.random() * 300,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
        {
          type: "Reference",
          name: "Sit",
          duration: (mascot, Math) => 500 + Math.random() * 1000,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkLeftAlongIEAndJump",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + Math.random() * 50,
        },
        {
          type: "Reference",
          name: "Falling",
          initialVx: (mascot, Math) => -15 - Math.random() * 5,
          initialVy: (mascot, Math) => -20 - Math.random() * 5,
        },
        { type: "Reference", name: "Bouncing" },
      ],
    },
    {
      type: "Sequence",
      name: "WalkRightAlongIEAndJump",
      actions: [
        {
          type: "Reference",
          name: "Run",
          targetX: (mascot, Math) => mascot.environment.activeIE.right - Math.random() * 50,
        },
        {
          type: "Reference",
          name: "Falling",
          initialVx: (mascot, Math) => 15 + Math.random() * 5,
          initialVy: (mascot, Math) => -20 - Math.random() * 5,
        },
        { type: "Reference", name: "Bouncing" },
      ],
    },
    {
      type: "Sequence",
      name: "DashIeCeilingLeftEdgeFromJump",
      actions: [
        {
          type: "Reference",
          name: "Dash",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + Math.random() * 20 + 20,
        },
        {
          type: "Reference",
          name: "Falling",
          initialVx: (mascot, Math) => -5 - Math.random() * 2,
          initialVy: (mascot, Math) => -20 - Math.random() * 5,
        },
        { type: "Reference", name: "Bouncing" },
      ],
    },
    {
      type: "Sequence",
      name: "DashIeCeilingRightEdgeFromJump",
      actions: [
        {
          type: "Reference",
          name: "Dash",
          targetX: (mascot, Math) => mascot.environment.activeIE.right - Math.random() * 20 - 20,
        },
        {
          type: "Reference",
          name: "Falling",
          initialVx: (mascot, Math) => 5 + Math.random() * 2,
          initialVy: (mascot, Math) => -20 - Math.random() * 5,
        },
        { type: "Reference", name: "Bouncing" },
      ],
    },
    {
      type: "Sequence",
      name: "HoldOntoIEWall",
      actions: [
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot, Math) => mascot.environment.activeIE.top + 64 + Math.random() * (mascot.environment.activeIE.height - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "ClimbIEWall",
      actions: [
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.activeIE.top + 64,
        },
        { type: "Reference", name: "Offset", y: "-64" },
        { type: "Reference", name: "Sit", duration: "5" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Walk",
          targetX: (mascot, Math) => mascot.lookRight ? mascot.environment.activeIE.left + Math.random() * 100 : mascot.environment.activeIE.right - Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "ClimbIEBottom",
      actions: [
        {
          type: "Reference",
          name: "ClimbCeiling",
          targetX: (mascot, Math) => mascot.environment.activeIE.left + 64 + (Math.random() * mascot.environment.activeIE.width - 128),
        },
      ],
    },
    {
      type: "Sequence",
      name: "GrabIEBottomLeftWall",
      actions: [
        {
          type: "Reference",
          name: "ClimbCeiling",
          targetX: (mascot) => mascot.environment.activeIE.left,
        },
        { type: "Reference", name: "Look" },
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.activeIE.bottom - 64,
        },
      ],
    },
    {
      type: "Sequence",
      name: "GrabIEBottomRightWall",
      actions: [
        {
          type: "Reference",
          name: "ClimbCeiling",
          targetX: (mascot) => mascot.environment.activeIE.right,
        },
        { type: "Reference", name: "Look" },
        {
          type: "Reference",
          name: "ClimbWall",
          targetY: (mascot) => mascot.environment.activeIE.bottom - 64,
        },
      ],
    },
    {
      type: "Sequence",
      name: "JumpFromLeftWall",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.workArea.left,
          targetY: (mascot, Math) => mascot.environment.workArea.bottom - Math.random() * mascot.environment.workArea.height / 4,
        },
        {
          type: "Reference",
          name: "GrabWall",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "JumpFromRightWall",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.workArea.right,
          targetY: (mascot, Math) => mascot.environment.workArea.bottom - Math.random() * mascot.environment.workArea.height / 4,
        },
        {
          type: "Reference",
          name: "GrabWall",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "JumpOnIELeftWall",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.activeIE.left,
          targetY: (mascot, Math) => mascot.environment.activeIE.bottom - Math.random() * mascot.environment.activeIE.height / 4,
        },
        {
          type: "Reference",
          name: "GrabWall",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "JumpOnIERightWall",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.activeIE.right,
          targetY: (mascot, Math) => mascot.environment.activeIE.bottom - Math.random() * mascot.environment.activeIE.height / 4,
        },
        {
          type: "Reference",
          name: "GrabWall",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "JumpToElementTop",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.activeIE.left + mascot.environment.activeIE.width / 2,
          targetY: (mascot) => mascot.environment.activeIE.top - 128,
        },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 100 + Math.random() * 100,
        },
      ],
    },
    {
      type: "Sequence",
      name: "ThrowIEFromLeft",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.activeIE.left,
          targetY: (mascot) => mascot.environment.activeIE.bottom + 64,
        },
        { type: "Reference", name: "FallWithIe" },
        {
          type: "Reference",
          name: "WalkWithIe",
          targetX: (mascot) => mascot.environment.workArea.right - 400,
        },
        { type: "Reference", name: "ThrowIe" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
        { type: "Reference", name: "Look" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
      ],
    },
    {
      type: "Sequence",
      name: "ThrowIEFromRight",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.activeIE.right,
          targetY: (mascot) => mascot.environment.activeIE.bottom + 64,
        },
        { type: "Reference", name: "FallWithIe" },
        {
          type: "Reference",
          name: "WalkWithIe",
          targetX: (mascot) => mascot.environment.workArea.left + 400,
        },
        { type: "Reference", name: "ThrowIe" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
        { type: "Reference", name: "Look" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkAndThrowIEFromRight",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.activeIE.left,
          targetY: (mascot) => mascot.environment.activeIE.bottom + 64,
        },
        { type: "Reference", name: "FallWithIe" },
        {
          type: "Reference",
          name: "RunWithIe",
          targetX: (mascot) => mascot.environment.workArea.right - 400,
        },
        { type: "Reference", name: "ThrowIe" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
        { type: "Reference", name: "Look" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
      ],
    },
    {
      type: "Sequence",
      name: "WalkAndThrowIEFromLeft",
      actions: [
        {
          type: "Reference",
          name: "Jumping",
          targetX: (mascot) => mascot.environment.activeIE.right,
          targetY: (mascot) => mascot.environment.activeIE.bottom + 64,
        },
        { type: "Reference", name: "FallWithIe" },
        {
          type: "Reference",
          name: "RunWithIe",
          targetX: (mascot) => mascot.environment.workArea.left + 400,
        },
        { type: "Reference", name: "ThrowIe" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
        { type: "Reference", name: "Look" },
        {
          type: "Reference",
          name: "Stand",
          duration: (mascot, Math) => 50 + Math.random() * 50,
        },
      ],
    },
    {
      // [신규] 스크린샷 분석을 통해 새로 정의된 '요소 들고 걷기' 액션입니다.
      type: "Embedded",
      name: "WalkAndHold",
      animations: [
        {
          poses: [
            { sprite: "/shime34.png", anchor: { x: 64, y: 128 }, velocity: { x: -2, y: 0 }, duration: 6 }, // 걸어가는 중2
            { sprite: "/shime35.png", anchor: { x: 64, y: 128 }, velocity: { x: -2, y: 0 }, duration: 6 }, // 걸어가는 중1
            { sprite: "/shime34.png", anchor: { x: 64, y: 128 }, velocity: { x: -2, y: 0 }, duration: 6 }, // 걸어가는 중2
            { sprite: "/shime36.png", anchor: { x: 64, y: 128 }, velocity: { x: -2, y: 0 }, duration: 6 }, // 걸어가는 중3            
          ],
        },
      ],
      borderType: "Floor",
      embedType: "WalkWithIE",
      ieOffsetX: "(mascot.lookRight ? 48 : -mascot.environment.activeIE.width - 48)",
      ieOffsetY: "-100",
    },
    {
      // [신규] 스크린샷 분석을 통해 새로 정의된 '왼쪽에서 던지기' 전체 시퀀스입니다.
      type: "Sequence",
      name: "ThrowElementFromLeft_New",
      actions: [
        { type: "Reference", name: "Jumping", targetX: (mascot) => mascot.environment.activeIE.left, targetY: (mascot) => mascot.environment.activeIE.bottom },
        { type: "Reference", name: "FallWithIe" },
        { type: "Reference", name: "WalkAndHold", targetX: (mascot) => mascot.anchor.x + 300 },
        { type: "Reference", name: "ThrowIe" },
        { type: "Reference", name: "Stand", duration: "100" },
      ],
    },
    {
      // [신규] 스크린샷 분석을 통해 새로 정의된 '오른쪽에서 던지기' 전체 시퀀스입니다.
      type: "Sequence",
      name: "ThrowElementFromRight_New",
      actions: [
        { type: "Reference", name: "Jumping", targetX: (mascot) => mascot.environment.activeIE.right, targetY: (mascot) => mascot.environment.activeIE.bottom },
        { type: "Reference", name: "FallWithIe" },
        { type: "Reference", name: "WalkAndHold", targetX: (mascot) => mascot.anchor.x - 300 },
        { type: "Reference", name: "ThrowIe" },
        { type: "Reference", name: "Stand", duration: "100" },
      ],
    },
    {
      type: "Sequence",
      name: "ChaseMouse",
      actions: [
        {
          type: "Sequence",
          actions: [
            { type: "Reference", name: "Offset", y: "1" },
            { type: "Reference", name: "Falling" },
            { type: "Reference", name: "Bouncing" },
          ],
          condition: (mascot) => mascot.environment.ceiling.isOn(mascot.anchor) || mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor),
        },
        {
          type: "Sequence",
          actions: [
            { type: "Reference", name: "Offset", x: "1" },
            { type: "Reference", name: "Falling" },
            { type: "Reference", name: "Bouncing" },
          ],
          condition: (mascot) => mascot.environment.workArea.leftBorder.isOn(mascot.anchor) || mascot.environment.activeIE.rightBorder.isOn(mascot.anchor),
        },
        {
          type: "Sequence",
          actions: [
            { type: "Reference", name: "Offset", x: "-1" },
            { type: "Reference", name: "Falling" },
            { type: "Reference", name: "Bouncing" },
          ],
          condition: (mascot) => mascot.environment.workArea.rightBorder.isOn(mascot.anchor) || mascot.environment.activeIE.leftBorder.isOn(mascot.anchor),
        },
        {
          type: "Select",
          actions: [
            {
              type: "Reference",
              name: "DashIeCeilingLeftEdgeFromJump",
              condition: (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor) && mascot.anchor.x < (mascot.environment.activeIE.left + mascot.environment.activeIE.right) / 2,
            },
            {
              type: "Reference",
              name: "DashIeCeilingRightEdgeFromJump",
              condition: (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor) && mascot.anchor.x >= (mascot.environment.activeIE.left + mascot.environment.activeIE.right) / 2,
            },
          ],
        },
        {
          type: "Reference",
          name: "Dash",
          targetX: (mascot, Math) => mascot.anchor.x + (mascot.environment.cursor.x - mascot.anchor.x) * Math.random() / 2,
        },
        {
          type: "Reference",
          name: "Tripping",
          condition: (mascot, Math) => Math.random() < 0.05,
        },
        {
          type: "Reference",
          name: "Dash",
          targetX: (mascot, Math) => mascot.anchor.x + (mascot.environment.cursor.x - mascot.anchor.x) * Math.random(),
        },
        {
          type: "Reference",
          name: "Tripping",
          condition: (mascot, Math) => Math.random() < 0.05,
        },
        {
          type: "Reference",
          name: "Dash",
          targetX: (mascot) => mascot.environment.cursor.x + mascot.gap,
          gap: (mascot, Math) => mascot.anchor.x < mascot.environment.cursor.x ? -Math.min(mascot.environment.cursor.x - mascot.anchor.x, Math.random() * 200) : Math.min(mascot.anchor.x - mascot.environment.cursor.x, Math.random() * 200),
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
      ],
    },
    {
      type: "Sequence",
      name: "SitAndFaceMouse",
      actions: [
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
        {
          type: "Reference",
          name: "SitAndLookAtMouse",
          duration: (mascot, Math) => 10 + Math.random() * 10,
        },
        {
          type: "Reference",
          name: "Look",
          lookRight: (mascot) => mascot.anchor.x < mascot.environment.cursor.x,
        },
      ],
    },
    {
      // [신규] 'jump to...' 메뉴 클릭 시, '모서리 선택 모드'로 진입시키는 역할을 하는 특수 액션입니다.
      type: "Embedded",
      name: "SelectEdge",
      embedType: "SelectEdge", // Overlay.jsx에서 이 타입을 보고 선택 모드로 전환합니다.
      animations: [{ poses: [{ sprite: "/shime1.png", duration: 1 }] }], // 애니메이션은 의미 없지만 형식상 필요
    },
    {
      // [신규] 'throw element...' 메뉴 클릭 시, '요소 선택 모드'로 진입시키는 역할을 하는 특수 액션입니다.
      type: "Embedded",
      name: "SelectIE",
      embedType: "SelectIE", // Overlay.jsx에서 이 타입을 보고 선택 모드로 전환합니다.
      animations: [{ poses: [{ sprite: "/shime1.png", duration: 1 }] }],
    },
];

export const commonBehaviors = [
    {
      type: "Behavior",
      name: "ChaseMouse",
      frequency: 0,
      nextBehaviors: [
        {
          type: "Reference",
          name: "SitAndFaceMouse",
          frequency: 1,
          nextBehaviors: [],
          conditions: [],
          groupIndex: 0,
          hidden: !1,
        },
      ],
      conditions: [],
      groupIndex: 0,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "SitAndFaceMouse",
      frequency: 0,
      nextBehaviors: [
        {
          type: "Reference",
          name: "SitAndFaceMouse",
          frequency: 100,
          nextBehaviors: [],
          conditions: [],
          groupIndex: 0,
          hidden: !1,
        },
        {
          type: "Reference",
          name: "SitAndSpinHead",
          frequency: 1,
          nextBehaviors: [],
          conditions: [],
          groupIndex: 0,
          hidden: !1,
        },
        {
          type: "Reference",
          name: "SitWhileDanglingLegs",
          frequency: 1,
          nextBehaviors: [],
          conditions: [],
          groupIndex: 0,
          hidden: !1,
        },
      ],
      conditions: [],
      groupIndex: 0,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "Fall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) =>
          !mascot.environment.floor.isOn(mascot.anchor) &&
          (!mascot.environment.activeIE.visible || !mascot.environment.activeIE.topBorder.isOn(mascot.anchor)),
      ],
      groupIndex: 0,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "Dragged",
      frequency: 0,
      nextBehaviors: [],
      conditions: [],
      groupIndex: 0,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "Thrown",
      frequency: 0,
      nextBehaviors: [],
      conditions: [],
      groupIndex: 0,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "StandUp",
      frequency: 200,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 1,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "SitDown",
      frequency: 100,
      nextBehaviors: [
        {
          type: "Reference",
          name: "LieDown",
          frequency: 100,
          nextBehaviors: [],
          conditions: [
            (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
          ],
          groupIndex: 0,
          hidden: !1,
        },
      ],
      conditions: [
        (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 1,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "LieDown",
      frequency: 0,
      nextBehaviors: [
        {
          type: "Reference",
          name: "SitDown",
          frequency: 100,
          nextBehaviors: [],
          conditions: [
            (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
          ],
          groupIndex: 0,
          hidden: !1,
        },
        {
          type: "Reference",
          name: "CrawlAlongIECeiling",
          frequency: 100,
          nextBehaviors: [],
          conditions: [
            (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
            (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
          ],
          groupIndex: 0,
          hidden: !1,
        },
        {
          type: "Reference",
          name: "CrawlAlongWorkAreaFloor",
          frequency: 100,
          nextBehaviors: [],
          conditions: [
            (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
            (mascot) => mascot.environment.floor.isOn(mascot.anchor),
          ],
          groupIndex: 0,
          hidden: !1,
        },
      ],
      conditions: [
        (mascot) => mascot.environment.floor.isOn(mascot.anchor) || mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 1,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "HoldOntoWall",
      frequency: 100,
      nextBehaviors: [
        {
          type: "Reference",
          name: "ClimbWall",
          frequency: 100,
          nextBehaviors: [],
        },
        {
          type: "Reference",
          name: "FallFromWall",
          frequency: 100,
          nextBehaviors: [],
        },
      ],
      conditions: [
        (mascot) => mascot.lookRight ? (mascot.environment.workArea.rightBorder.isOn(mascot.anchor) || mascot.environment.activeIE.leftBorder.isOn(mascot.anchor)) : (mascot.environment.workArea.leftBorder.isOn(mascot.anchor) || mascot.environment.activeIE.rightBorder.isOn(mascot.anchor)),
      ],
      groupIndex: 2,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "FallFromWall",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.lookRight ? (mascot.environment.workArea.rightBorder.isOn(mascot.anchor) || mascot.environment.activeIE.leftBorder.isOn(mascot.anchor)) : (mascot.environment.workArea.leftBorder.isOn(mascot.anchor) || mascot.environment.activeIE.rightBorder.isOn(mascot.anchor)),
        (mascot) => !mascot.environment.floor.isOn(mascot.anchor),
      ],
      groupIndex: 2,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "HoldOntoCeiling",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.ceiling.isOn(mascot.anchor) || mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor),
      ],
      groupIndex: 3,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "FallFromCeiling",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.ceiling.isOn(mascot.anchor) || mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor),
      ],
      groupIndex: 3,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkAlongWorkAreaFloor",
      frequency: 200,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "RunAlongWorkAreaFloor",
      frequency: 0,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "CrawlAlongWorkAreaFloor",
      frequency: 10,
      nextBehaviors: [
        {
          type: "Reference",
          name: "LieDown",
          frequency: 1,
          nextBehaviors: [],
          conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
          groupIndex: 0,
          hidden: !1,
        },
      ],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkLeftAlongFloorAndSit",
      frequency: 60,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkRightAlongFloorAndSit",
      frequency: 60,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "GrabWorkAreaBottomLeftWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "GrabWorkAreaBottomRightWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkLeftAndSit",
      frequency: 0,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkRightAndSit",
      frequency: 0,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkAndGrabBottomLeftWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkAndGrabBottomRightWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.floor.isOn(mascot.anchor)],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "JumpFromBottomOfIE",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.floor.isOn(mascot.anchor),
        (mascot) => mascot.anchor.x >= mascot.environment.activeIE.left && mascot.anchor.x < mascot.environment.activeIE.right,
      ],
      groupIndex: 4,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "ClimbHalfwayAlongWall",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.lookRight ? mascot.environment.workArea.rightBorder.isOn(mascot.anchor) : mascot.environment.workArea.leftBorder.isOn(mascot.anchor),
      ],
      groupIndex: 5,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "ClimbAlongWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.lookRight ? mascot.environment.workArea.rightBorder.isOn(mascot.anchor) : mascot.environment.workArea.leftBorder.isOn(mascot.anchor),
      ],
      groupIndex: 5,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "ClimbAlongCeiling",
      frequency: 100,
      nextBehaviors: [],
      conditions: [(mascot) => mascot.environment.ceiling.isOn(mascot.anchor)],
      groupIndex: 6,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkAlongIECeiling",
      frequency: 200,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "RunAlongIECeiling",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "CrawlAlongIECeiling",
      frequency: 10,
      nextBehaviors: [
        {
          type: "Reference",
          name: "LieDown",
          frequency: 1,
          nextBehaviors: [],
          conditions: [
            (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
          ],
          groupIndex: 0,
          hidden: !1,
        },
      ],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "SitOnTheLeftEdgeOfIE",
      frequency: 50,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "SitOnTheRightEdgeOfIE",
      frequency: 50,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "JumpFromLeftEdgeOfIE",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "JumpFromRightEdgeOfIE",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkLeftAlongIEAndSit",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkRightAlongIEAndSit",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkLeftAlongIEAndJump",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkRightAlongIEAndJump",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.topBorder.isOn(mascot.anchor),
      ],
      groupIndex: 7,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "HoldOntoIEWall",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.lookRight ? mascot.environment.activeIE.leftBorder.isOn(mascot.anchor) : mascot.environment.activeIE.rightBorder.isOn(mascot.anchor),
      ],
      groupIndex: 8,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "ClimbIEWall",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.lookRight ? mascot.environment.activeIE.leftBorder.isOn(mascot.anchor) : mascot.environment.activeIE.rightBorder.isOn(mascot.anchor),
      ],
      groupIndex: 8,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "ClimbIEBottom",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor),
      ],
      groupIndex: 9,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "GrabIEBottomLeftWall",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor),
      ],
      groupIndex: 9,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "GrabIEBottomRightWall",
      frequency: 100,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.bottomBorder.isOn(mascot.anchor),
      ],
      groupIndex: 9,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "JumpFromLeftWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot, Math) => !mascot.environment.workArea.leftBorder.isOn(mascot.anchor) && mascot.anchor.x < mascot.environment.workArea.left + 400 && Math.abs(mascot.environment.workArea.bottom - mascot.anchor.y) < mascot.environment.workArea.height / 4,
      ],
      groupIndex: 0,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "JumpFromRightWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot, Math) => !mascot.environment.workArea.rightBorder.isOn(mascot.anchor) && mascot.anchor.x >= mascot.environment.workArea.right - 400 && Math.abs(mascot.environment.workArea.bottom - mascot.anchor.y) < mascot.environment.workArea.height / 4,
      ],
      groupIndex: 0,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "JumpOnIELeftWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.visible,
        (mascot, Math) => mascot.anchor.x < mascot.environment.activeIE.left && Math.abs(mascot.environment.activeIE.bottom - mascot.anchor.y) < mascot.environment.activeIE.height / 4,
      ],
      groupIndex: 10,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "JumpOnIERightWall",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.visible,
        (mascot, Math) => mascot.anchor.x > mascot.environment.activeIE.right && Math.abs(mascot.environment.activeIE.bottom - mascot.anchor.y) < mascot.environment.activeIE.height / 4,
      ],
      groupIndex: 10,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "ThrowIEFromLeft",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.visible,
        (mascot) => mascot.environment.activeIE.bottom < mascot.anchor.y - 64 && mascot.anchor.x < mascot.environment.activeIE.left,
      ],
      groupIndex: 10,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "ThrowIEFromRight",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.visible,
        (mascot) => mascot.environment.activeIE.bottom < mascot.anchor.y - 64 && mascot.anchor.x > mascot.environment.activeIE.right,
      ],
      groupIndex: 10,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkAndThrowIEFromRight",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.visible,
        (mascot) => mascot.environment.activeIE.bottom < mascot.anchor.y - 64 && mascot.anchor.x < mascot.environment.activeIE.left,
      ],
      groupIndex: 10,
      hidden: !1,
    },
    {
      type: "Behavior",
      name: "WalkAndThrowIEFromLeft",
      frequency: 0,
      nextBehaviors: [],
      conditions: [
        (mascot) => mascot.environment.activeIE.visible,
        (mascot) => mascot.environment.activeIE.bottom < mascot.anchor.y - 64 && mascot.anchor.x > mascot.environment.activeIE.right,
      ],
      groupIndex: 10,
      hidden: !1,
    },
];
