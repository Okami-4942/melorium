# ドアで3つの部屋を移動する機能 実装手順書

## この手順書の目的

この手順書では、現在一つだけ表示されている部屋を、次の三つへ増やします。

- `mezzo`: 緑色の部屋
- `forte`: 赤・ピンク色の部屋
- `piano`: 青色の部屋

プレイヤーが行き先の設定されたドアへ近づくと、Reactのstateを更新して別の部屋へ移動します。

この機能はまだコードへ実装されていません。以下の手順は、高校生がReactとThree.jsの関係を学びながら、自分で実装するためのものです。上から順番に進め、一つの手順が終わるたびに動作確認してください。

## 完成条件

実装完了と判断する条件は次のとおりです。

- 最初は緑色の`mezzo`部屋が表示される
- `Piano`のドアへ近づくと青色の`piano`部屋へ移動する
- `Forte`のドアへ近づくと赤色の`forte`部屋へ移動する
- 移動後、背景、床、本、ドアが移動先の設定へ変わる
- 部屋を移動するたびに古いcanvasとイベントが片付けられる
- 画面上にcanvasが二つ以上作られない
- `Largo`のドアは、遷移先が未実装なので移動しない
- 部屋を移動したあともWASD移動、本のFキー操作、モーダルが動く
- `npm run lint`と`npm run build`が成功する

## 実装前に理解すること

### 部屋を切り替える考え方

Three.jsのシーンを三つのファイルへコピーしてはいけません。背景色、本、ドアなどの「部屋ごとに違う値」だけを設定データへまとめ、描画処理は一つを再利用します。

```text
App.jsx
└── currentRoomId = "mezzo"
    ↓ roomConfigをpropsで渡す
Experience.jsx
    ↓ Hookへ渡す
useThreeScene.js
    ↓ Three.jsへ渡す
createMeloriumScene.js
└── roomConfigに合わせて背景・床・本・ドアを作る
```

ドアへ近づいたときは、この流れを反対方向へ進みます。

```text
Three.jsがドアとの距離を測る
    ↓ onChangeRoom("piano")
App.jsxがcurrentRoomIdを"piano"へ変更
    ↓ Reactが再描画
useThreeSceneが古いシーンをdispose
    ↓
pianoのroomConfigで新しいシーンを作る
```

### なぜシーンを作り直すのか

背景、本、ドアを一個ずつ差し替える方法もありますが、最初の実装としては管理が複雑です。この課題では、部屋が変わると古いシーンを丸ごと片付け、新しい設定から作り直します。

現在の`useThreeScene.js`にはcleanup処理があるため、この方法を安全に使えます。また、Reactの「propsが変わるとEffectがやり直される」という仕組みを学べます。

## 3部屋とドアの対応

旧JavaScript版にあった設定を使います。

| 現在の部屋 | ドア画像 | 移動先 |
| --- | --- | --- |
| mezzo | `pdoorm.png` | piano |
| mezzo | `fdoorm.png` | forte |
| mezzo | `ldoorm.png` | 未実装 |
| forte | `mdoorm.png` | mezzo |
| forte | `pdoorm.png` | piano |
| forte | `ldoorm.png` | 未実装 |
| piano | `fdoorm.png` | forte |
| piano | `mdoorm.png` | mezzo |
| piano | `ldoorm.png` | 未実装 |

`ldoor`はLargo用と思われる素材ですが、対応する部屋のコードがありません。今回は`destinationRoomId: null`にし、近づいても移動しないドアとして残します。

## 手順0: 作業ブランチと現在の状態を確認する

ターミナルで次を実行します。

```bash
git status --short --branch
npm run lint
npm run build
```

作業開始前からエラーがある場合は、先に先生または担当者へ相談してください。既存エラーと自分が追加したエラーを混ぜないことが大切です。

新しいブランチを作る場合は次のようにします。

```bash
git switch -c feature/room-transitions
```

すでにこの名前のブランチがある場合は、別の名前にしてください。

## 手順1: 三つの部屋で使う画像を登録する

変更するファイル: `src/assets.js`

現在登録されていない、赤・青の本と各部屋の表紙画像をimportします。既存のimportの下へ次を追加してください。

```js
import redBackUrl from "../images/red-ura.jpg";
import blueBackUrl from "../images/blue-ura.jpg";
import hidamariCoverUrl from "../images/陽だまりのセツナ.png";
import hidamariSpineUrl from "../images/陽だまりのセツナ1背.png";
import decCoverUrl from "../images/Dec.png";
import decSpineUrl from "../images/Dec1背.png";
import sleepwalkCoverUrl from "../images/Sleepwalk.png";
import sleepwalkSpineUrl from "../images/Sleepwalk3背.png";
import mezzoDoorUrl from "../images/mdoorm.png";
```

次に、`assets.textures`の中へ追加します。

```js
bookBackRed: redBackUrl,
bookBackBlue: blueBackUrl,
hidamariCover: hidamariCoverUrl,
hidamariSpine: hidamariSpineUrl,
decCover: decCoverUrl,
decSpine: decSpineUrl,
sleepwalkCover: sleepwalkCoverUrl,
sleepwalkSpine: sleepwalkSpineUrl,
mezzoDoor: mezzoDoorUrl,
```

既存の`bookBack`はmezzo用なので、分かりやすくするため次の名前へ変更します。

```js
bookBackGreen: greenBackUrl,
```

この変更後は、現在の`assets.textures.bookBack`参照が一時的にエラーになります。手順3で修正するため、ここでは先へ進んで構いません。

### 確認ポイント

- 同じ変数名を二回宣言していない
- ファイル名の日本語や大文字・小文字が実際の画像と一致している
- `textures`オブジェクトの各行末に`,`がある

## 手順2: 各部屋の曲情報を追加する

変更するファイル: `src/data/siteData.js`

現在の`songs`にはmezzo部屋の二曲だけが登録されています。`songs`オブジェクトへ次の三曲を追加します。

```js
hidamari: {
  id: "hidamari",
  title: "陽だまりのセツナ",
  artist: "正式なアーティスト名を入力",
  description: "正式な曲紹介を入力",
  youtubeUrl: "正式なYouTube URLを入力",
  spotifyUrl: "正式なSpotify URLを入力",
},
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

仮文字列のままでも画面は動きますが、公開前に正式な情報へ置き換えてください。URLが未確定の場合は、リンクを押せないようにする改善が別途必要です。

## 手順3: 部屋設定ファイルを作る

新しく作るファイル: `src/data/roomData.js`

次の内容をそのまま作成します。

```js
import { assets } from "../assets.js";

// 三つのドアを置く場所は全ての部屋で共通です。
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

export const rooms = {
  mezzo: {
    id: "mezzo",
    label: "Mezzo Room",
    backgroundColor: 0xa2b3aa,
    floorColor: 0xa1eda1,
    bookBackTextureUrl: assets.textures.bookBackGreen,
    bookEdgeColor: 0x1b2f23,
    books: [
      {
        songId: "planetes",
        coverTextureUrl: assets.textures.planetesCover,
        spineTextureUrl: assets.textures.planetesSpine,
        position: [-1.5, 2, 1.5],
        rotation: [-Math.PI / 2, 0, -Math.PI / 4],
      },
      {
        songId: "marySue",
        coverTextureUrl: assets.textures.marySueCover,
        spineTextureUrl: assets.textures.marySueSpine,
        position: [1.5, 2, -1.5],
        rotation: [-Math.PI / 2, 0, (Math.PI * 3) / 4],
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
        name: "largo-door",
        textureUrl: assets.textures.largoDoor,
        destinationRoomId: null,
        ...doorPositions.backLeft,
      },
    ],
  },

  forte: {
    id: "forte",
    label: "Forte Room",
    backgroundColor: 0xb3a2ac,
    floorColor: 0xc27a89,
    bookBackTextureUrl: assets.textures.bookBackRed,
    bookEdgeColor: 0x59171e,
    books: [
      {
        songId: "hidamari",
        coverTextureUrl: assets.textures.hidamariCover,
        spineTextureUrl: assets.textures.hidamariSpine,
        position: [-1.5, 2, 1.5],
        rotation: [-Math.PI / 2, 0, -Math.PI / 4],
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
        name: "largo-door",
        textureUrl: assets.textures.largoDoor,
        destinationRoomId: null,
        ...doorPositions.backLeft,
      },
    ],
  },

  piano: {
    id: "piano",
    label: "Piano Room",
    backgroundColor: 0xa2b3b2,
    floorColor: 0xa1d8ed,
    bookBackTextureUrl: assets.textures.bookBackBlue,
    bookEdgeColor: 0x173046,
    books: [
      {
        songId: "dec",
        coverTextureUrl: assets.textures.decCover,
        spineTextureUrl: assets.textures.decSpine,
        position: [-1.5, 2, 1.5],
        rotation: [-Math.PI / 2, 0, -Math.PI / 4],
      },
      {
        songId: "sleepwalk",
        coverTextureUrl: assets.textures.sleepwalkCover,
        spineTextureUrl: assets.textures.sleepwalkSpine,
        position: [1.5, 2, -1.5],
        rotation: [-Math.PI / 2, 0, (Math.PI * 3) / 4],
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
        name: "largo-door",
        textureUrl: assets.textures.largoDoor,
        destinationRoomId: null,
        ...doorPositions.backLeft,
      },
    ],
  },
};
```

### このファイルで学ぶこと

- 共通処理ではなく、違いだけをデータとして表現する
- 配列を使って本やドアの数を表現する
- `...doorPositions.east`という展開構文で共通の位置設定を再利用する
- 16進数でThree.jsの色を表す
- `null`を「移動先なし」という意味で使う

### 確認ポイント

ファイル末尾で`rooms.mezzo`などを一時的に`console.log()`する必要はありません。まず`npm run lint`を実行し、文法エラーがないことを確認してください。

## 手順4: 本の縁の色を部屋ごとに変えられるようにする

変更するファイル: `src/three/createBook.js`

`createBook()`の引数へ`edgeColor`を追加します。

```js
export function createBook({
  textureLoader,
  renderer,
  backTextureUrl,
  coverTextureUrl,
  spineTextureUrl,
  position,
  rotation,
  songId,
  edgeColor,
}) {
```

次の固定色を探します。

```js
const coverEdgeMaterial = createSolidMaterial(0x1b2f23, 0.82);
```

`edgeColor`を使うように変更します。

```js
const coverEdgeMaterial = createSolidMaterial(edgeColor, 0.82);
```

これで、同じ本作成関数を使いながら、mezzoは緑、forteは赤、pianoは青の縁になります。

## 手順5: Three.jsシーンがroomConfigを受け取れるようにする

変更するファイル: `src/three/createMeloriumScene.js`

### 5-1. 固定設定を削除する

ファイル上部にある次の二つを削除します。

- `const doorSettings = [...]`
- `const bookSettings = [...]`

これらは手順3の`roomConfig.doors`と`roomConfig.books`へ移したためです。

### 5-2. ドアへ近づく距離を定数にする

他の定数の下へ追加します。

```js
// カメラとドアの中心がこの距離以下になったら部屋を移動します。
const DOOR_TRIGGER_DISTANCE = 1.6;
```

`1.6`は、ドアの当たり判定で押し戻される前に反応できるよう少し広めにしています。実際の見た目に合わない場合だけ、最後に調整してください。

### 5-3. 床の色を引数で受け取る

現在の関数を次の形へ変更します。

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

### 5-4. createMeloriumSceneの引数を増やす

関数の引数へ`roomConfig`と`onChangeRoom`を追加します。

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

変数の宣言部分へ次を追加します。

```js
// 一度移動を開始したあと、次のフレームで同じ処理を繰り返さないための印です。
let isTransitioning = false;

// 移動先が設定されたドアだけを保存します。
const transitionDoors = [];

// 距離計算のたびにVector3を作らず、同じものを使い回します。
const doorWorldPosition = new THREE.Vector3();
```

### 5-5. 背景と床へroomConfigを使う

背景色を次のように変更します。

```js
const scene = new THREE.Scene();
scene.background = new THREE.Color(roomConfig.backgroundColor);
```

床を追加している場所を変更します。

```js
addFloor(scene, roomConfig.floorColor);
```

### 5-6. roomConfigから本を作る

現在の`bookSettings.forEach(...)`を、次のコードへ置き換えます。

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
    edgeColor: roomConfig.bookEdgeColor,
  });

  scene.add(book);
  collisions.add(book);

  book.traverse((child) => {
    if (child.isMesh) interactableMeshes.push(child);
  });
});
```

`roomData.js`では位置を普通の配列として保存しました。Three.jsで使う直前に`Vector3`と`Euler`へ変換しています。

### 5-7. roomConfigからドアを作る

ドアのGLB読み込み内にある`doorSettings.forEach(...)`を、次のコードへ置き換えます。

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

  // nullではないドアだけが、別の部屋への入口になります。
  if (setting.destinationRoomId) {
    transitionDoors.push({
      object: door,
      destinationRoomId: setting.destinationRoomId,
    });
  }
});
```

### 5-8. ドアとの距離を測る関数を追加する

`renderFrame()`より前へ、次の関数を追加します。

```js
const checkDoorTransition = () => {
  // モーダル中、移動開始後、Pointer Lock前は判定しません。
  if (isPaused || isTransitioning || !controls.isLocked) return;

  for (const door of transitionDoors) {
    // ドアのローカル座標ではなく、シーン全体での位置を取得します。
    door.object.getWorldPosition(doorWorldPosition);

    // 高さYは無視し、床と同じXZ平面上での距離を求めます。
    const distance = Math.hypot(
      camera.position.x - doorWorldPosition.x,
      camera.position.z - doorWorldPosition.z,
    );

    if (distance <= DOOR_TRIGGER_DISTANCE) {
      // Reactの再描画までに同じ処理が連続しないよう、先にtrueにします。
      isTransitioning = true;
      pressedKeys.clear();
      controls.unlock();
      onChangeRoom(door.destinationRoomId);
      return;
    }
  }
};
```

`for...of`を使う理由は、移動先を見つけたら`return`で関数全体を終了できるからです。

### 5-9. 毎フレーム距離を確認する

`renderFrame()`の中で、移動と当たり判定のあとに一行追加します。

```js
if (controls.isLocked && !isPaused) {
  // 既存の移動処理
  collisions.resolve(camera.position);
}

checkDoorTransition();
updateFocusedBook();
renderer.render(scene, camera);
```

当たり判定後の安全なカメラ位置を使って、ドアまでの距離を測ります。

## 手順6: Experienceから部屋設定を渡す

変更するファイル: `src/components/Experience.jsx`

propsへ`roomConfig`と`onChangeRoom`を追加します。

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

`useThreeScene()`へ渡すオブジェクトにも追加します。

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

`Experience`は値を中継するだけです。ここへ距離計算や部屋選択の処理を書かないでください。

## 手順7: useThreeSceneからThree.jsへ渡す

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

`createMeloriumScene()`の呼び出しへ追加します。

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

最初の`useEffect`の依存配列へ、`roomConfig`と`onChangeRoom`を追加します。

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

ここが部屋切り替えの重要な部分です。`roomConfig`が変わると、Reactは次の順番で処理します。

1. 前回のEffectが返したcleanupを実行する
2. 古いThree.jsシーンを`dispose()`する
3. 新しい`roomConfig`で`createMeloriumScene()`を呼ぶ

依存配列から`roomConfig`を外すと、stateが変わっても3D空間が切り替わりません。

## 手順8: Appで現在の部屋をstate管理する

変更するファイル: `src/App.jsx`

### 8-1. 部屋データをimportする

```js
import { rooms } from "./data/roomData.js";
```

### 8-2. 現在の部屋stateを追加する

他の`useState`の近くへ追加します。

```js
const [currentRoomId, setCurrentRoomId] = useState("mezzo");
const currentRoom = rooms[currentRoomId];
```

最初の値が`"mezzo"`なので、ページを開いた直後は緑色の部屋になります。

### 8-3. 部屋を変更する関数を追加する

`handleSceneReady`の下へ追加します。

```js
const handleChangeRoom = useCallback((nextRoomId) => {
  // 設定にない文字列が渡されたときは、壊れた画面へ移動しません。
  if (!rooms[nextRoomId]) {
    console.error(`存在しない部屋です: ${nextRoomId}`);
    return;
  }

  // 新しい部屋の素材を読み込むため、完了状態と画面上の選択を初期化します。
  setIsSceneReady(false);
  setSelectedSongId(null);
  setInteractionText("");
  setCurrentRoomId(nextRoomId);
}, []);
```

`useCallback`を使わず毎回新しい関数を作ると、`useThreeScene`の依存値が毎回変わり、関係のないstate更新でも3Dシーンを作り直す可能性があります。

### 8-4. Experienceへpropsを渡す

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

### 8-5. 現在の部屋名を表示する

タイトル付近へ部屋名を表示すると、テストしやすくなります。

```jsx
<div>
  <p className="site-title">Melorium</p>
  <p className="room-name">{currentRoom.label}</p>
</div>
```

見た目は最後に`global.css`で調整します。最初は装飾されていなくても、文字が切り替われば成功です。

## 手順9: 部屋ごとにローディング画面を作り直す

変更するファイル: `src/App.jsx`

現在の`LoadingScreen`へ`key`を追加します。

```jsx
<LoadingScreen key={currentRoomId} isReady={isSceneReady} />
```

Reactでは`key`が変わると、同じ種類のコンポーネントでも別のものとして作り直されます。これにより`LoadingScreen`内の`progress`と`isVisible`が初期値へ戻ります。

このままでは、部屋を移動するたびに3秒ローディングが表示されます。これは既存の3秒仕様を優先した最初の実装です。部屋移動だけ短くしたい場合は、基本機能の完成後に別課題として調整してください。

## 手順10: 部屋名のCSSを追加する

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

このCSSは機能に必須ではありません。部屋の切り替えを確認しやすくする補助表示です。

## 手順11: 静的検査をする

```bash
npm run lint
npm run build
git diff --check
```

エラーが出たら、最初のエラーから一つずつ直します。複数のエラーが同じカンマ抜けや変数名の間違いから発生している場合があります。

### よくあるLintエラー

#### `roomConfig is not defined`

関数の引数へ`roomConfig`を追加し忘れています。`Experience`、`useThreeScene`、`createMeloriumScene`の三箇所を順番に確認してください。

#### `onChangeRoom is not defined`

同じくpropsまたは関数引数の中継漏れです。AppからThree.jsまで、同じ名前で渡してください。

#### `bookBack is undefined`

手順1で`bookBack`を`bookBackGreen`へ変更したあと、古い参照が残っています。検索してください。

```bash
rg "bookBack" src
```

## 手順12: ブラウザで動作確認する

```bash
npm run dev
```

表示されたURLをブラウザで開き、次の順番で確認します。

### 基本確認

1. 最初に`Mezzo Room`と表示される
2. 背景と床が緑色である
3. プラネテスとメアリー・スーの憂鬱がある
4. 画面をクリックしてWASDで移動できる
5. 本へ照準を合わせ、Fキーでモーダルを開ける

### 部屋移動確認

1. mezzoのPianoドアへ近づく
2. ローディング画面が表示される
3. `Piano Room`へ変わる
4. 背景と床が青色になる
5. DecとSleepwalkが表示される
6. pianoのForteドアへ近づく
7. `Forte Room`へ変わる
8. 背景と床が赤・ピンク色になる
9. 陽だまりのセツナが表示される
10. forteのMezzoドアへ近づく
11. 最初の`Mezzo Room`へ戻る

### 未実装ドア確認

1. Largoドアへ近づく
2. 部屋が切り替わらないことを確認する
3. JavaScriptエラーが出ないことを確認する

### cleanup確認

ブラウザの開発者ツールを開き、Consoleで次を実行します。

```js
document.querySelectorAll("canvas").length
```

何度部屋を移動しても`1`になれば、古いcanvasが正しく削除されています。`2`以上になる場合は、`useThreeScene`のcleanupと依存配列を確認してください。

## うまく動かないとき

### ドアへ近づいても移動しない

次の順番で確認します。

1. ドア設定の`destinationRoomId`が`null`ではないか
2. `destinationRoomId`の文字列が`rooms`のキーと一致しているか
3. `transitionDoors.push(...)`がGLB読み込み完了処理の中にあるか
4. `checkDoorTransition()`を`renderFrame()`から呼んでいるか
5. canvasをクリックし、Pointer Lock状態になっているか
6. `DOOR_TRIGGER_DISTANCE`を一時的に`2.0`へ広げると反応するか

### 一度の接近で何度も部屋が切り替わる

`isTransitioning = true`を、`onChangeRoom()`より前に設定しているか確認します。Reactのstate更新は即座ではないため、先にローカルな印を付ける必要があります。

### 部屋名だけ変わって3D空間が変わらない

`useThreeScene`の最初の`useEffect`の依存配列に`roomConfig`があるか確認します。依存配列に無い場合、ReactはThree.jsシーンを作り直しません。

### 部屋移動後にローディング画面が出ない

`LoadingScreen`へ`key={currentRoomId}`が付いているか確認します。また、`handleChangeRoom`で`setIsSceneReady(false)`を呼んでください。

### 部屋移動後に画面が真っ暗になる

ブラウザのConsoleで最初のエラーを確認します。画像importの名前、`roomConfig.backgroundColor`、`roomConfig.books`、`roomConfig.doors`のタイプミスがないか調べてください。

### ドアの前まで行けない

現在のドアには当たり判定があります。まず`DOOR_TRIGGER_DISTANCE`を`1.8`へ変更して確認します。むやみに当たり判定を削除するとドアを通り抜けて床の端へ行けるため、最初は距離側を調整してください。

## 最終チェックリスト

- [ ] `assets.js`へ全ての画像を登録した
- [ ] `siteData.js`へ三曲を追加した
- [ ] `roomData.js`へ三部屋を定義した
- [ ] `createBook`が`edgeColor`を受け取る
- [ ] `createMeloriumScene`が`roomConfig`と`onChangeRoom`を受け取る
- [ ] ドアの距離判定にY座標を使っていない
- [ ] `isTransitioning`で連続移動を防いでいる
- [ ] `Experience`が二つの新しいpropsを中継している
- [ ] `useThreeScene`の依存配列に`roomConfig`がある
- [ ] `App`が`currentRoomId`をstate管理している
- [ ] `LoadingScreen`に`key={currentRoomId}`がある
- [ ] Largoドアは移動しない
- [ ] 部屋移動後も本をFキーで開ける
- [ ] canvasの数が常に一つ
- [ ] `npm run lint`が成功する
- [ ] `npm run build`が成功する
- [ ] 実ブラウザで三部屋を往復した

## 発展課題

基本実装が完成してから挑戦してください。

1. ドアへ近づいたら即移動せず、「Fキーで入る」と表示する
2. 移動前後に画面を暗くするトランジションを追加する
3. 前の部屋へ戻ったとき、対応するドアの前から開始する
4. Largo部屋を追加する
5. URLへ現在の部屋を含め、再読み込み後も同じ部屋を表示する
6. 部屋を移動するたびに3秒待たず、最初の一回だけ長いローディングを表示する

発展課題は一度に複数実装せず、一つ追加するたびにLint、build、ブラウザ確認を行ってください。
