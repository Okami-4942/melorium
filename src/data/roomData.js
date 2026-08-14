import { assets } from "../assets.js";

// ドアの三つの設置場所は、全ての部屋で共通です。
const doorPositions = {
  east: {
    position: [5.8, 1.95, 0],
    rotationY: Math.PI,
  },
  frontLeft: {
    position: [-2.9, 1.95, 5.023],
    rotationY: Math.PI / 3,
  },
  backLeft: {
    position: [-2.9, 1.95, -5.023],
    rotationY: -Math.PI / 3,
  },
};

// 旧main.jsと同じ高さへ本を置くための計算です。
const mainBookHeight = 1.05 * (790 / 569);

export const rooms = {
  main: {
    id: "main",
    label: "Main Room",
    cameraFov: 65,
    backgroundColor: 0xadadad,
    floorColor: 0x7d7d7d,
    showTables: false,
    bookBackTextureUrl: assets.textures.mainBookBack,
    bookEdgeColor: 0x7a1f20,
    books: [
      {
        songId: "hidamari",
        coverTextureUrl: assets.textures.hidamariCover,
        spineTextureUrl: assets.textures.hidamariSpine,
        position: [0, mainBookHeight / 2 + 0.16, -2.6],
        rotation: [0, 0, 0],
        scale: 1,
      },
    ],
    doors: [
      {
        name: "forte-door",
        textureUrl: assets.textures.forteDoor,
        destinationRoomId: "forte",
        ...doorPositions.east,
      },
      {
        name: "mezzo-door",
        textureUrl: assets.textures.mezzoDoor,
        destinationRoomId: "mezzo",
        ...doorPositions.frontLeft,
      },
      {
        name: "piano-door",
        textureUrl: assets.textures.pianoDoor,
        destinationRoomId: "piano",
        ...doorPositions.backLeft,
      },
    ],
  },

  mezzo: {
    id: "mezzo",
    label: "Mezzo Room",
    cameraFov: 60,
    backgroundColor: 0xa2b3aa,
    floorColor: 0xa1eda1,
    showTables: true,
    bookBackTextureUrl: assets.textures.bookBack,
    bookEdgeColor: 0x1b2f23,
    books: [
      {
        songId: "planetes",
        coverTextureUrl: assets.textures.planetesCover,
        spineTextureUrl: assets.textures.planetesSpine,
        position: [-1.5, 2, 1.5],
        rotation: [-Math.PI / 2, 0, -Math.PI / 4],
        scale: 0.7,
      },
      {
        songId: "marySue",
        coverTextureUrl: assets.textures.marySueCover,
        spineTextureUrl: assets.textures.marySueSpine,
        position: [1.5, 2, -1.5],
        rotation: [-Math.PI / 2, 0, (Math.PI * 3) / 4],
        scale: 0.7,
      },
    ],
    doors: [
      {
        name: "piano-door",
        textureUrl: assets.textures.pianoDoor,
        destinationRoomId: "piano",
        ...doorPositions.east,
      },
      {
        name: "forte-door",
        textureUrl: assets.textures.forteDoor,
        destinationRoomId: "forte",
        ...doorPositions.frontLeft,
      },
      {
        name: "main-door",
        textureUrl: assets.textures.largoDoor,
        destinationRoomId: "main",
        ...doorPositions.backLeft,
      },
    ],
  },

  forte: {
    id: "forte",
    label: "Forte Room",
    cameraFov: 60,
    backgroundColor: 0xb3a2ac,
    floorColor: 0xc27a89,
    showTables: true,
    bookBackTextureUrl: assets.textures.mainBookBack,
    bookEdgeColor: 0x59171e,
    books: [
      {
        songId: "hidamari",
        coverTextureUrl: assets.textures.hidamariCover,
        spineTextureUrl: assets.textures.hidamariSpine,
        position: [-1.5, 2, 1.5],
        rotation: [-Math.PI / 2, 0, -Math.PI / 4],
        scale: 0.7,
      },
    ],
    doors: [
      {
        name: "mezzo-door",
        textureUrl: assets.textures.mezzoDoor,
        destinationRoomId: "mezzo",
        ...doorPositions.east,
      },
      {
        name: "piano-door",
        textureUrl: assets.textures.pianoDoor,
        destinationRoomId: "piano",
        ...doorPositions.frontLeft,
      },
      {
        name: "main-door",
        textureUrl: assets.textures.largoDoor,
        destinationRoomId: "main",
        ...doorPositions.backLeft,
      },
    ],
  },

  piano: {
    id: "piano",
    label: "Piano Room",
    cameraFov: 60,
    backgroundColor: 0xa2b3b2,
    floorColor: 0xa1d8ed,
    showTables: true,
    bookBackTextureUrl: assets.textures.pianoBookBack,
    bookEdgeColor: 0x173046,
    books: [
      {
        songId: "dec",
        coverTextureUrl: assets.textures.decCover,
        spineTextureUrl: assets.textures.decSpine,
        position: [-1.5, 2, 1.5],
        rotation: [-Math.PI / 2, 0, -Math.PI / 4],
        scale: 0.7,
      },
      {
        songId: "sleepwalk",
        coverTextureUrl: assets.textures.sleepwalkCover,
        spineTextureUrl: assets.textures.sleepwalkSpine,
        position: [1.5, 2, -1.5],
        rotation: [-Math.PI / 2, 0, (Math.PI * 3) / 4],
        scale: 0.7,
      },
    ],
    doors: [
      {
        name: "forte-door",
        textureUrl: assets.textures.forteDoor,
        destinationRoomId: "forte",
        ...doorPositions.east,
      },
      {
        name: "mezzo-door",
        textureUrl: assets.textures.mezzoDoor,
        destinationRoomId: "mezzo",
        ...doorPositions.frontLeft,
      },
      {
        name: "main-door",
        textureUrl: assets.textures.largoDoor,
        destinationRoomId: "main",
        ...doorPositions.backLeft,
      },
    ],
  },
};
