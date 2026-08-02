# メイン部屋から3つの部屋へ移動する機能 実装手順書

## この手順書で作るもの

現在のReact版は、旧`main.js`にあったメイン部屋から始まります。この手順書では、高校生の実装課題として次の機能を追加します。

- メイン部屋のForteドアから`forte`部屋へ移動する
- メイン部屋のMezzoドアから`mezzo`部屋へ移動する
- メイン部屋のPianoドアから`piano`部屋へ移動する
- 各サブ部屋のLargoドアからメイン部屋へ戻る
- サブ部屋同士を、元から置かれていたドアで移動する

この機能はまだ実装されていません。コードを上から順番にコピーするだけでなく、各説明を読んで「どの値がどこを通るか」を確認しながら進めてください。

メニュー、近接時の「Fキーで開く」、曲情報画面も学習課題です。この手順書の完成コードはそれらのpropsを残す形で書かれているため、先に[`song-ui-implementation-guide.md`](./song-ui-implementation-guide.md)、続いて[`ui-implementation-guide.md`](./ui-implementation-guide.md)を終えてください。そのあと部屋移動へ進むと、各部屋の本までまとめて確認できます。

## 現在の状態

最初に表示されるメイン部屋は、すでにReact版へ復元されています。

| 項目 | メイン部屋の設定 |
| --- | --- |
| 背景 | 灰色 `0xadadad` |
| 床 | 灰色 `0x7d7d7d` |
| カメラの視野角 | `65` |
| 本 | 陽だまりのセツナ 1冊 |
| テーブル | 非表示。旧`main.js`でもコメントアウトされていた |
| 東側のドア | Forte |
| 左手前のドア | Mezzo |
| 左奥のドア | Piano |

現在はドアへ近づいても部屋は変わりません。三つのサブ部屋もまだReact版へ追加されていません。

## 完成条件

次を全て満たしたら完成です。

- 最初は灰色の`Main Room`が表示される
- Forteドアから赤・ピンク色の`Forte Room`へ移動できる
- Mezzoドアから緑色の`Mezzo Room`へ移動できる
- Pianoドアから青色の`Piano Room`へ移動できる
- 各サブ部屋のLargoドアから`Main Room`へ戻れる
- 部屋ごとに背景、床、本、ドア、テーブルの有無が変わる
- 部屋移動後もWASD移動が使える
- 曲UI課題も完了済みの場合は、部屋移動後も本のFキー操作が使える
- 部屋を何度移動してもcanvasが一つだけである
- `npm run lint`と`npm run build`が成功する

## 実装の全体像

### ReactからThree.jsへ設定を渡す流れ

```text
App.jsx
└── currentRoomId = "main"
    ↓ rooms[currentRoomId]をpropsで渡す
Experience.jsx
    ↓ Hookへ渡す
useThreeScene.js
    ↓ Three.jsへ渡す
createMeloriumScene.js
└── roomConfigから背景・床・本・ドアを作る
```

### ドアからReactへ移動先を返す流れ

```text
Three.jsがカメラとドアの距離を測る
    ↓ onChangeRoom("mezzo")
App.jsxがcurrentRoomIdを"mezzo"へ変更
    ↓ propsが変わる
useThreeSceneが古いシーンをcleanup
    ↓
mezzoの設定で新しいシーンを作る
```

### なぜThree.jsファイルを4個作らないのか

旧版では`main.js`、`mezzo.js`、`forte.js`、`piano.js`に同じ処理が繰り返し書かれていました。その方法では、移動速度を直すだけでも複数ファイルを同じように修正する必要があります。

React版では、共通の描画処理を`createMeloriumScene.js`へ一度だけ書きます。部屋ごとに異なる色、画像、位置だけを`roomData.js`へまとめます。

## 部屋とドアの対応

旧JavaScript版に置かれていたドアを、次の移動先として使います。

| 現在の部屋 | ドア画像 | 移動先 |
| --- | --- | --- |
| main | `fdoorm.png` | forte |
| main | `mdoorm.png` | mezzo |
| main | `pdoorm.png` | piano |
| mezzo | `pdoorm.png` | piano |
| mezzo | `fdoorm.png` | forte |
| mezzo | `ldoorm.png` | main |
| forte | `mdoorm.png` | mezzo |
| forte | `pdoorm.png` | piano |
| forte | `ldoorm.png` | main |
| piano | `fdoorm.png` | forte |
| piano | `mdoorm.png` | mezzo |
| piano | `ldoorm.png` | main |

サブ部屋の`ldoorm.png`は、今回はメイン部屋へ戻るドアとして使います。

## 手順0: 作業前の状態を確認する

ターミナルで次を実行します。

```bash
git status --short --branch
npm run lint
npm run build
```

作業前からエラーがある場合は、先に先生または担当者へ相談してください。

必要なら作業ブランチを作ります。

```bash
git switch -c feature/room-transitions
```

続いて`npm run dev`で現在の画面を開き、次を確認します。

- 背景と床が灰色
- 中央奥に陽だまりのセツナがある
- Forte、Mezzo、Pianoの三つのドアがある
- ドアへ近づいても、まだ移動しない

この状態が実装前の基準です。

## 手順1: Piano部屋で使う画像を登録する

変更するファイル: `src/assets.js`

main、mezzo、forteで必要な画像はすでに登録されています。Piano部屋で使う次の画像をimportへ追加します。

```js
import blueBackUrl from "../images/blue-ura.jpg";
import decCoverUrl from "../images/Dec.png";
import decSpineUrl from "../images/Dec1背.png";
import sleepwalkCoverUrl from "../images/Sleepwalk.png";
import sleepwalkSpineUrl from "../images/Sleepwalk3背.png";
```

次に`assets.textures`へ追加します。

```js
pianoBookBack: blueBackUrl,
decCover: decCoverUrl,
decSpine: decSpineUrl,
sleepwalkCover: sleepwalkCoverUrl,
sleepwalkSpine: sleepwalkSpineUrl,
```

### 確認ポイント

- importの変数名と`textures`内の名前を混同していない
- 日本語ファイル名や大文字・小文字が実際のファイルと一致している
- オブジェクトの各行末に`,`が付いている

## 手順2: Piano部屋の曲データを追加する

変更するファイル: `src/data/siteData.js`

`hidamari`、`planetes`、`marySue`はすでに登録されています。`songs`オブジェクトへ次を追加します。

```js
dec: {
  id: "dec",
  title: "Dec",
  artist: "正式なアーティスト名を入力",
  description: "正式な曲紹介を入力",
  youtubeUrl: "正式なYouTube URLを入力",
  spotifyUrl: "正式なSpotify URLを入力",
},
sleepwalk: {
  id: "sleepwalk",
  title: "Sleepwalk",
  artist: "正式なアーティスト名を入力",
  description: "正式な曲紹介を入力",
  youtubeUrl: "正式なYouTube URLを入力",
  spotifyUrl: "正式なSpotify URLを入力",
},
```

仮文字列でも画面は動きますが、公開前に正式な情報へ置き換えてください。

## 手順3: 四つの部屋設定を作る

新しく作るファイル: `src/data/roomData.js`

次の内容を作成します。

```js
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
```

### この設定から学べること

- `main`を含む四部屋の違いを一つのオブジェクトで管理する
- `showTables`で部屋ごとの表示有無を切り替える
- `scale`でメイン部屋とサブ部屋の本の大きさを変える
- `destinationRoomId`でドアと移動先を結び付ける
- `...doorPositions.east`で共通の位置を再利用する

## 手順4: Three.jsシーンをroomConfig対応にする

変更するファイル: `src/three/createMeloriumScene.js`

### 4-1. 現在の固定設定を削除する

次の固定値と配列を削除します。

- `MAIN_BACKGROUND_COLOR`
- `MAIN_FLOOR_COLOR`
- `SHOW_TABLES`
- `doorSettings`
- `bookSettings`

これらは全て`roomData.js`へ移動しました。

### 4-2. ドアの反応距離を追加する

他の定数の下へ追加します。

```js
// カメラとドアの中心がこの距離以下になったら移動します。
const DOOR_TRIGGER_DISTANCE = 1.6;
```

ドアの当たり判定に押し戻される前に反応できるよう、少し広めの値にしています。

### 4-3. 床の色を引数へ変更する

`addFloor`を次の形へ変更します。

```js
function addFloor(scene, floorColor) {
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_RADIUS, ROOM_RADIUS, 0.3, 64),
    new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: 1,
      metalness: 0,
    }),
  );

  floor.position.y = 0.009;
  floor.receiveShadow = true;
  scene.add(floor);
}
```

### 4-4. 関数の引数を増やす

```js
export function createMeloriumScene({
  container,
  roomConfig,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
}) {
```

関数の先頭に次の変数を追加します。

```js
// 一度移動を始めたあと、次フレームで同じ処理を繰り返さないための印です。
let isTransitioning = false;

// 移動に使うドア本体と移動先を保存します。
const transitionDoors = [];

// 距離計算で同じVector3を再利用します。
const doorWorldPosition = new THREE.Vector3();
```

### 4-5. 背景・カメラ・床へ設定を使う

```js
const scene = new THREE.Scene();
scene.background = new THREE.Color(roomConfig.backgroundColor);

const camera = new THREE.PerspectiveCamera(
  roomConfig.cameraFov,
  1,
  0.1,
  1000,
);
```

床を追加する場所も変更します。

```js
addFloor(scene, roomConfig.floorColor);
```

### 4-6. 設定から本を作る

現在の`bookSettings.forEach(...)`を置き換えます。

```js
roomConfig.books.forEach((setting) => {
  const book = createBook({
    textureLoader,
    renderer,
    backTextureUrl: roomConfig.bookBackTextureUrl,
    coverTextureUrl: setting.coverTextureUrl,
    spineTextureUrl: setting.spineTextureUrl,
    position: new THREE.Vector3(...setting.position),
    rotation: new THREE.Euler(...setting.rotation),
    songId: setting.songId,
    scale: setting.scale,
    edgeColor: roomConfig.bookEdgeColor,
  });

  scene.add(book);
  collisions.add(book);

  book.traverse((child) => {
    if (child.isMesh) interactableMeshes.push(child);
  });
});
```

`createBook.js`はすでに`scale`と`edgeColor`を受け取れるため、この手順では変更不要です。

### 4-7. 設定からドアを作る

ドアのGLB読み込み内にある`doorSettings.forEach(...)`を置き換えます。

```js
roomConfig.doors.forEach((setting) => {
  const door = gltf.scene.clone(true);
  door.name = setting.name;
  door.scale.setScalar(0.5);
  door.position.fromArray(setting.position);
  door.rotation.y = setting.rotationY;
  applyDoorTexture(door, setting.textureUrl);

  scene.add(door);
  collisions.add(door);

  transitionDoors.push({
    object: door,
    destinationRoomId: setting.destinationRoomId,
  });
});
```

### 4-8. テーブル表示を設定で切り替える

現在は次の形になっています。

```js
if (SHOW_TABLES) {
  gltfLoader.load(
    // 既存のテーブル読み込み処理
  );
}
```

これを変更します。

```js
if (roomConfig.showTables) {
  gltfLoader.load(
    // 既存のテーブル読み込み処理
  );
}
```

これにより、mainではテーブルを作らず、三つのサブ部屋では作ります。

### 4-9. ドアとの距離を測る

`renderFrame()`より前へ追加します。

```js
const checkDoorTransition = () => {
  // モーダル中、移動開始後、Pointer Lock前は判定しません。
  if (isPaused || isTransitioning || !controls.isLocked) return;

  for (const door of transitionDoors) {
    // ドアのシーン全体での位置を取得します。
    door.object.getWorldPosition(doorWorldPosition);

    // 高さYを無視し、床と同じXZ平面での距離を計算します。
    const distance = Math.hypot(
      camera.position.x - doorWorldPosition.x,
      camera.position.z - doorWorldPosition.z,
    );

    if (distance <= DOOR_TRIGGER_DISTANCE) {
      // Reactのstate更新より先に印を付け、連続実行を防ぎます。
      isTransitioning = true;
      pressedKeys.clear();
      controls.unlock();
      onChangeRoom(door.destinationRoomId);
      return;
    }
  }
};
```

### 4-10. 毎フレーム確認する

`renderFrame()`内の移動・当たり判定のあとへ追加します。

```js
if (controls.isLocked && !isPaused) {
  // 既存の移動処理
  collisions.resolve(camera.position);
}

checkDoorTransition();
updateFocusedBook();
renderer.render(scene, camera);
```

## 手順5: Experienceでpropsを中継する

変更するファイル: `src/components/Experience.jsx`

引数へ`roomConfig`と`onChangeRoom`を追加します。

```jsx
export default function Experience({
  roomConfig,
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
}) {
```

`useThreeScene()`にも追加します。

```js
useThreeScene({
  containerRef: sceneContainerRef,
  roomConfig,
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
});
```

`Experience`は値を中継するだけです。ここへ距離計算を書かないでください。

## 手順6: useThreeSceneでシーンを作り直す

変更するファイル: `src/hooks/useThreeScene.js`

引数へ追加します。

```js
export default function useThreeScene({
  containerRef,
  roomConfig,
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
}) {
```

`createMeloriumScene()`へ渡します。

```js
const sceneApi = createMeloriumScene({
  container: containerRef.current,
  roomConfig,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
});
```

最初の`useEffect`の依存配列へ追加します。

```js
}, [
  containerRef,
  roomConfig,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
]);
```

`roomConfig`が変わると、Reactは古いEffectのcleanupを実行してから、新しい設定でEffectを実行します。依存配列へ`roomConfig`を入れ忘れると、部屋名だけ変わって3D空間が変わりません。

## 手順7: Appで現在の部屋を管理する

変更するファイル: `src/App.jsx`

### 7-1. 部屋データをimportする

```js
import { rooms } from "./data/roomData.js";
```

### 7-2. stateを追加する

```js
const [currentRoomId, setCurrentRoomId] = useState("main");
const currentRoom = rooms[currentRoomId];
```

最初の値を必ず`"main"`にします。`"mezzo"`にすると、メイン部屋ではなく緑色の部屋から始まります。

### 7-3. 部屋変更関数を追加する

```js
const handleChangeRoom = useCallback((nextRoomId) => {
  // 設定に無い部屋へ移動しないための安全確認です。
  if (!rooms[nextRoomId]) {
    console.error(`存在しない部屋です: ${nextRoomId}`);
    return;
  }

  // 新しい部屋の読み込みに備え、画面上の状態を初期化します。
  setIsSceneReady(false);
  setSelectedSongId(null);
  setInteractionText("");
  setCurrentRoomId(nextRoomId);
}, []);
```

`useCallback`で関数を固定しないと、別のstate更新でもThree.jsシーンを作り直す可能性があります。

### 7-4. Experienceへ渡す

```jsx
<Experience
  roomConfig={currentRoom}
  isPaused={isOverlayOpen}
  onReady={handleSceneReady}
  onSelectSong={setSelectedSongId}
  onInteractionChange={setInteractionText}
  onChangeRoom={handleChangeRoom}
/>
```

### 7-5. 現在の部屋名を表示する

```jsx
<div>
  <p className="site-title">Melorium</p>
  <p className="room-name">{currentRoom.label}</p>
</div>
```

### 7-6. ローディング画面を部屋ごとに作り直す

```jsx
<LoadingScreen key={currentRoomId} isReady={isSceneReady} />
```

`key`が変わると、Reactは`LoadingScreen`を新しいコンポーネントとして作り直します。これにより進捗が0%へ戻ります。

既存仕様を維持するため、部屋移動のたびに3秒ローディングが表示されます。短縮は基本機能完成後の発展課題にしてください。

## 手順8: 部屋名のCSSを追加する

変更するファイル: `src/styles/global.css`

```css
.room-name {
  margin: 6px 0 0;
  color: rgb(247 243 233 / 80%);
  font-family: system-ui, sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  text-shadow: 0 2px 14px rgb(27 42 35 / 35%);
}
```

部屋名は機能そのものには不要ですが、どの部屋にいるか確認しやすくなります。

## 手順9: 静的検査をする

```bash
npm run lint
npm run build
git diff --check
```

エラーは表示された一番上から、一つずつ直してください。

### `roomConfig is not defined`

`Experience`、`useThreeScene`、`createMeloriumScene`の引数を順番に確認します。

### `onChangeRoom is not defined`

AppからThree.jsまで、同じ名前で関数を渡しているか確認します。

### `pianoBookBack is undefined`

手順1のimportと`assets.textures`への追加を確認します。

### `MAIN_BACKGROUND_COLOR is not defined`

削除した固定値の参照が残っています。次で検索します。

```bash
rg "MAIN_BACKGROUND_COLOR|MAIN_FLOOR_COLOR|SHOW_TABLES|doorSettings|bookSettings" src
```

検索結果が、説明コメント以外に残っていない状態にします。

## 手順10: ブラウザで動作確認する

```bash
npm run dev
```

### メイン部屋

1. `Main Room`と表示される
2. 背景と床が灰色
3. 陽だまりのセツナが中央奥にある
4. テーブルが表示されない
5. WASDで移動できる
6. 曲UI課題も終えている場合は、本へ照準を合わせ、Fキーで曲画面を開ける

### Mainから各部屋

1. Forteドアへ近づき、赤・ピンク色の`Forte Room`へ移動する
2. ページを再読み込みしてMainへ戻る
3. Mezzoドアへ近づき、緑色の`Mezzo Room`へ移動する
4. ページを再読み込みしてMainへ戻る
5. Pianoドアへ近づき、青色の`Piano Room`へ移動する

### サブ部屋からMainへ戻る

1. 各サブ部屋でLargoドアへ近づく
2. 灰色の`Main Room`へ戻る
3. Mainの三つのドアが再び表示される

### 本の確認

- Main: 陽だまりのセツナ
- Mezzo: プラネテス、メアリー・スーの憂鬱
- Forte: 陽だまりのセツナ
- Piano: Dec、Sleepwalk

### cleanupの確認

ブラウザの開発者ツールのConsoleで実行します。

```js
document.querySelectorAll("canvas").length
```

何度移動しても`1`なら成功です。`2`以上なら、`useThreeScene`のcleanupまたは依存配列を確認してください。

## うまく動かないとき

### ドアへ近づいても移動しない

次の順番で確認します。

1. `destinationRoomId`が`rooms`のキーと一致している
2. `transitionDoors.push(...)`がドア読み込み処理の中にある
3. `checkDoorTransition()`を毎フレーム呼んでいる
4. canvasをクリックしてPointer Lock状態になっている
5. `DOOR_TRIGGER_DISTANCE`を一時的に`2.0`へ変えると反応する

### 一度の接近で何度も移動する

`isTransitioning = true`を`onChangeRoom()`より前へ書いてください。Reactのstate更新は即座ではないため、先にThree.js側で連続実行を止めます。

### 部屋名だけ変わり3D空間が変わらない

`useThreeScene`の依存配列に`roomConfig`があるか確認します。

### 移動後にローディングが表示されない

次の二点を確認します。

- `handleChangeRoom`で`setIsSceneReady(false)`を呼ぶ
- `LoadingScreen`へ`key={currentRoomId}`を付ける

### 移動後にcanvasが増える

`useThreeScene`のcleanupで`sceneApi.dispose()`を呼んでいるか確認します。`createMeloriumScene`の`dispose()`から、イベント解除と`renderer.domElement.remove()`を消してはいけません。

### ドアの前まで行けない

ドアには当たり判定があります。最初は当たり判定を削除せず、`DOOR_TRIGGER_DISTANCE`を`1.8`へ広げて確認してください。

## 最終チェックリスト

- [ ] Piano用の画像を`assets.js`へ追加した
- [ ] DecとSleepwalkを`siteData.js`へ追加した
- [ ] `roomData.js`にmainを含む四部屋がある
- [ ] 初期stateが`"main"`になっている
- [ ] Mainの三つのドアが正しい部屋へつながる
- [ ] サブ部屋のLargoドアからMainへ戻れる
- [ ] `roomConfig`がAppからThree.jsまで渡る
- [ ] `useThreeScene`の依存配列に`roomConfig`がある
- [ ] `isTransitioning`で連続移動を防いでいる
- [ ] Mainではテーブルがなく、サブ部屋ではテーブルがある
- [ ] 部屋ごとに本と色が変わる
- [ ] 曲UI課題も完了済みの場合、部屋移動後もFキーで本を開ける
- [ ] canvasの数が常に一つ
- [ ] `npm run lint`が成功する
- [ ] `npm run build`が成功する
- [ ] 実ブラウザでMainから三部屋を往復した

## 発展課題

基本機能が完成してから、一つずつ挑戦してください。

1. ドアへ近づいたら即移動せず、「Fキーで入る」と表示する
2. 部屋移動前後に画面を暗くする
3. 戻ったときに、移動元へ対応するドアの前から開始する
4. URLへ現在の部屋IDを含める
5. 部屋移動時だけローディング時間を短くする
6. 訪れた部屋を記録し、メニューから移動できるようにする

一つ追加するたびに、Lint、build、ブラウザ確認を行ってください。
