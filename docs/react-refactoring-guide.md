# Reactリファクタリング実装ガイド

このドキュメントは、旧JavaScript版からReact版へ移行した内容を説明するものです。特に、コードを整理しただけの箇所と、旧実装では途中だった機能を今回完成させた箇所を区別して記録しています。

## 1. 今回の変更範囲

変更内容は、次の四種類に分けられます。

| 分類 | 内容 | 代表的なファイル |
| --- | --- | --- |
| 既存機能の維持 | 3D空間、本、机、ドア、WASD移動、3秒ローディング | `src/three/`, `LoadingScreen.jsx` |
| Reactへの置き換え | HTMLで直接作っていた画面をコンポーネント化 | `src/App.jsx`, `src/components/` |
| 途中だった機能の完成 | 本への照準判定、Fキー、曲モーダルの接続 | `createMeloriumScene.js`, `SongModal.jsx` |
| 新しく追加した補助機能 | 操作案内、モーダル中の一時停止、後片付け、アクセシビリティ | `App.jsx`, `Modal.jsx`, `useThreeScene.js` |

曲名以外の説明文、アーティスト名、YouTube・Spotifyの検索URLは、旧画面がサンプル表示だったため今回仮データとして補いました。正式な情報が決まったら `src/data/siteData.js` を修正してください。

## 2. 旧実装との大きな違い

### 2.1 旧実装

旧実装では、HTMLを読み込むと各JavaScriptファイルが直接DOMを探し、イベントを登録し、Three.jsの`canvas`を`document.body`へ追加していました。

```text
index.html
├── loading.js ── ローディング用DOMを直接変更
├── mezzo.js ─── Three.jsのcanvasをbodyへ直接追加
└── interaction.js ── インタラクト対象を配列へ登録
```

この形では、どのファイルが画面のどの部分を変更しているか分かりにくくなります。また、ページを切り替えたときにイベントを解除する処理がなく、Reactへそのまま移すと同じイベントやcanvasが複数作られる可能性があります。

### 2.2 React版

React版は、画面と3D処理の責任を分けています。

```text
App.jsx（画面全体の状態を管理）
├── LoadingScreen（ローディング表示）
├── SongModal（選択中の曲を表示）
├── MenuModal（サイトメニュー）
└── Experience（Three.jsを置く場所）
    └── useThreeScene（ReactとThree.jsの橋渡し）
        └── createMeloriumScene（3D空間を作成・更新）
```

Reactは「現在どの画面を見せるか」を管理し、Three.jsは「3D空間で何を描くか」を管理します。Three.jsが本を見つけたときは、コールバック関数を通してReactへ結果だけを伝えます。

## 3. 旧実装より先まで進めた箇所

### 3.1 本を見てFキーで曲を開く機能

#### 以前の状態

旧`interaction.js`には、対象を配列へ登録する`registerInteraction()`がありました。しかし、Fキーを押したときはコンソールへ文字を出すだけで、カメラが見ている本の判定はありませんでした。

また、旧`mezzo.js`は本を登録するときに`openBookModal(bookId)`を呼ぶ予定でしたが、この関数は定義されていませんでした。そのため「対象の登録」から「モーダルを開く」までがつながっていない状態でした。

#### 今回の実装

1. `createBook.js`で、本を構成する全てのMeshへ`child.userData.songId`を設定します。
2. `createMeloriumScene.js`で、本のMeshを`interactableMeshes`へ登録します。
3. 毎フレーム、画面中央から`Raycaster`という見えない線を飛ばします。
4. 3メートル以内の本に線が当たったら、その本の`songId`を`focusedSongId`へ保存します。
5. Fキーが押されたら`onSelectSong(focusedSongId)`を呼びます。
6. `App.jsx`へ曲IDが渡り、`selectedSongId`が更新されます。
7. Reactが再描画され、対応する`SongModal`が表示されます。

```text
照準が本に当たる
  ↓
RaycasterがsongIdを取得
  ↓
FキーでonSelectSong(songId)を呼ぶ
  ↓
AppのselectedSongIdが変わる
  ↓
SongModalが表示される
```

この処理では、Three.jsからモーダルのDOMを直接操作していません。Three.jsはIDをReactへ渡し、表示の判断はReactに任せています。これが今回の構成で最も重要な役割分担です。

### 3.2 曲モーダルを実際の3D画面へ接続

#### 以前の状態

旧`song.html`と`song.js`には曲モーダルの見た目がありましたが、メインの`index.html`とは別ページでした。`openSongMenu()`を呼ぶ処理もなく、`controls`変数は別ファイルから参照できない状態でした。

#### 今回の実装

- `SongModal.jsx`は、受け取った`song`があるときだけ曲情報を表示します。
- 共通の開閉処理は`Modal.jsx`へまとめました。
- 閉じるボタン、背景クリック、Escapeキーの三つで閉じられます。
- モーダルを開いた直後、キーボード利用者が操作しやすいよう閉じるボタンへフォーカスを移します。
- 外部リンクには`target="_blank"`と`rel="noreferrer"`を設定しています。

Reactでは「DOMへ`active`クラスを付ける」のではなく、「表示に必要なデータが存在するか」で表示を決めます。

```jsx
const selectedSong = selectedSongId ? songs[selectedSongId] : null;
<SongModal song={selectedSong} />
```

### 3.3 メニューをメイン画面へ統合

#### 以前の状態

旧メニューは`menu.html`という別ページで、jQueryとModaalライブラリに依存していました。メインの3D画面にはメニューを開く入口がありませんでした。

#### 今回の実装

- `App.jsx`の右上へMenuボタンを設置しました。
- `isMenuOpen`というstateで開閉を管理します。
- メニューのリンクデータは`siteData.js`へ分けました。
- `menuLinks.map()`を使い、リンクが増えても同じJSXをコピーしない構成にしました。
- 曲モーダルと共通の`Modal`コンポーネントを再利用しています。

### 3.4 モーダル表示中に3D操作を止める機能

モーダルが開いているのにマウス視点操作やWASD移動が続くと、ユーザーは文章を読みにくくなります。そこで、曲モーダルかメニューのどちらかが開いている間は3D操作を停止します。

```text
App.jsx: isOverlayOpenを計算
  ↓ props
Experience.jsx: isPausedを受け取る
  ↓ 引数
useThreeScene.js: Three.jsのAPIへ伝える
  ↓
createMeloriumScene.js: キーを消去しPointer Lockを解除
```

ここではReactのstateをThree.jsが直接読みません。`setPaused()`という小さな公開APIだけを使い、依存関係を単純にしています。

### 3.5 フレームレートに依存しない移動

旧実装は毎フレーム`0.04`ずつ移動していました。この方法では、1秒に60回描画される端末と120回描画される端末で移動速度が変わります。

React版では`THREE.Clock`で前フレームからの経過秒数を取り、`速度 × 経過秒数`で移動距離を求めます。

```js
const deltaSeconds = Math.min(clock.getDelta(), 0.05);
movement.normalize().multiplyScalar(WALK_SPEED * deltaSeconds);
```

タブを長時間離れたあとに急に大きく移動しないよう、経過秒数の上限を`0.05`秒にしています。

### 3.6 Three.jsの後片付け

Reactのコンポーネントは、表示されたり消えたりします。表示のたびにcanvasやイベントを追加し、消えるときに片付けないと、同じ処理が重複し、メモリ使用量も増えます。

`useThreeScene.js`の`useEffect`は、Three.jsのシーンを作ったあと、cleanup関数を返します。cleanupでは次の処理を行います。

- アニメーションループを停止
- Pointer Lockを解除
- `keydown`、`keyup`、`resize`などのイベントを解除
- Geometry、Material、Textureを`dispose()`
- canvasをDOMから削除

これは見た目を増やす機能ではありませんが、ReactのライフサイクルにThree.jsを安全に組み込むために追加した重要な処理です。

### 3.7 ローディング処理のReact化

ローディングは、旧実装の「0〜100%を3秒かけて表示する」という仕様を維持しています。閉じる条件も一つではありません。

1. `LoadingScreen.jsx`が3秒間の見た目上の進捗を管理する
2. `THREE.LoadingManager`が画像とGLBの読み込み完了を管理する
3. 両方が完了したら700ミリ秒かけてフェードアウトする

素材の読み込みが3秒より速くても3秒間は表示され、3秒より遅ければ素材が読み終わるまで表示を続けます。

### 3.8 Viteによる素材管理

旧実装ではimport mapとCDNからThree.jsを読み込み、画像パスを文字列で指定していました。React版ではnpmでReact、Three.js、Viteを管理します。

`assets.js`で画像とGLBをimportすることで、Viteが公開用ファイル名とURLを自動で作ります。ファイル名が変換されても、コードから正しい素材を参照できます。

## 4. 純粋なリファクタリングとして行ったこと

次の変更は新機能ではなく、同じ処理を読みやすくするための整理です。

- `mezzo.js`、`forte.js`、`piano.js`に重複していた処理をThree.js用モジュールへ分割
- 本の形状生成を`createBook.js`へ分離
- 当たり判定を`CollisionSystem.js`へ分離
- 曲やリンクを`siteData.js`へ分離
- UIの見た目を`global.css`へ統合
- jQueryとModaalへの依存を削除
- ESLintを追加し、未定義変数や未使用コードを検出可能に変更

旧説明書は比較用として`docs/legacy/`へ移動しています。旧JavaScriptコードは実行対象から削除していますが、Gitの変更履歴から確認できます。どちらも現在のアプリからは読み込まれません。

## 5. 現在の制約と注意点

### 当たり判定

旧実装には回転を考慮した詳細な当たり判定がありました。現在の`CollisionSystem`は、初心者が追いやすいよう`THREE.Box3`による軸に沿った箱で判定しています。

そのため、斜めに置かれた本やドアでは、見た目より少し広い範囲でぶつかることがあります。これは機能追加ではなく簡略化による制約です。見た目に合わせた精密な判定が必要になったら、OBBまたはローカル座標での判定を追加してください。

### ドア

三つのドアは表示と当たり判定のみ実装されています。別の部屋へ移動する機能はまだありません。ドア名は将来の実装に備えて付けていますが、クリックやFキーによる画面遷移は行いません。

### 曲データ

曲説明、アーティスト名、外部URLは仮データを含みます。公開前に内容とリンク先を確認してください。

### 実機確認

Lint、本番ビルド、ローカル配信までは確認しています。画面の見た目、Pointer Lock、WASD移動、本への照準、Fキー、モーダルの一連の操作は、実ブラウザで最終確認してください。

## 6. 曲を追加する方法

### 手順1: 素材をimportする

`src/assets.js`へ表紙と背表紙を追加します。

```js
import newCoverUrl from "../images/new-cover.png";
import newSpineUrl from "../images/new-spine.png";
```

次に`assets.textures`へ名前を追加します。

### 手順2: 曲情報を追加する

`src/data/siteData.js`の`songs`へ、同じ曲IDをキーとして情報を追加します。

```js
newSong: {
  id: "newSong",
  title: "曲名",
  artist: "アーティスト名",
  description: "曲の説明",
  youtubeUrl: "https://...",
  spotifyUrl: "https://...",
}
```

### 手順3: 3D空間へ本を追加する

`createMeloriumScene.js`の`bookSettings`へ本を追加します。`songId`は手順2のキーと必ず一致させます。

```js
{
  songId: "newSong",
  coverTextureUrl: assets.textures.newCover,
  spineTextureUrl: assets.textures.newSpine,
  position: new THREE.Vector3(0, 2, 2),
  rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
}
```

一致していれば、Raycasterが本を見つけたときにReactが正しい曲情報を表示します。

## 7. React初心者向け用語

- **コンポーネント**: 画面を構成する再利用可能な部品です。JavaScriptの関数として書き、JSXを返します。
- **props**: 親コンポーネントから子コンポーネントへ渡す値や関数です。
- **state**: コンポーネントが覚えている、表示に関係する値です。更新するとReactが再描画します。
- **useEffect**: Reactの描画だけでは扱えない外部処理を実行します。このプロジェクトではThree.jsやブラウザイベントに使います。
- **useRef**: 再描画しても同じ値を保持します。DOM要素やThree.jsのAPIを保存する用途に使います。
- **cleanup**: `useEffect`が返す後片付け関数です。イベントやThree.jsの資源を解放します。
- **コールバック**: 処理が終わったときやイベント発生時に呼んでもらう関数です。
- **条件付きレンダリング**: stateなどの条件によって、コンポーネントを表示したり非表示にしたりする書き方です。

## 8. 学習するときの確認課題

1. `siteData.js`の曲名を変え、モーダルへ反映されることを確認する。
2. `MenuModal.jsx`で`map()`が一つのリンクデータを一つの`a`要素へ変換する流れを追う。
3. `App.jsx`の`isMenuOpen`を手動で`true`にし、条件付き表示を確認する。
4. `INTERACTION_DISTANCE`を変え、本を開ける距離がどう変わるか確認する。
5. `WALK_SPEED`を変え、経過時間を使った移動速度を確認する。

変更後は`npm run lint`と`npm run build`を実行し、文法エラーと公開用ビルドを確認してください。
