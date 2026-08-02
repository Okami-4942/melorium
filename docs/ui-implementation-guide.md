# 高校生向け：メニューと「Fキーで開く」表示の実装手順書

## 1. この課題で作るもの

この手順書では、次の三つをReactで実装します。

1. 旧メニューの円形デザインをReactで再現する。
2. メイン画面の「メニュー」ボタンから開けるようにする。
3. 本へ近づいて照準を合わせたときだけ「Fキーで開く」と表示する。

先に[旧デザインの曲UIをReactで実装する手順書](./song-ui-implementation-guide.md)を完了してください。この手順書では、そこで作った`Modal.jsx`と曲選択のpropsを利用します。

## 2. 旧menu.jsは何をしていたのか

旧`menu.js`は次の2行だけでした。

```js
$(function () {
  $(".modal-button").modaal();
});
```

これはjQueryでModaalというライブラリを起動する処理です。実際のデザインは`menu.html`、`menu.css`、`modaal.min.css`にありました。

旧画面の特徴は次の通りです。

- メニュー本体は500px × 500pxの円
- 背景色は`#E9E2D8`
- リンクには`images/menu-button.svg`を使う
- リンク文字は35px、色は`#8E897A`
- 二つのリンクを縦に並べ、間を20px空ける
- 大きな×ボタンで閉じる

React版ではjQueryやModaalを追加しません。開閉状態を`useState`で管理し、旧デザインをCSSで再現します。

## 3. 完成時のデータの流れ

### メニュー

```text
「メニュー」ボタンをクリック
        ↓
setIsMenuOpen(true)
        ↓
isMenuOpenがtrueになる
        ↓
MenuModalが表示される
```

### 「Fキーで開く」表示

```text
Three.jsが照準中の本を判定
        ↓
onInteractionChange("Fキーで開く")
        ↓
App.jsxが文章をstateへ保存
        ↓
文章が空でないときだけ画面に表示
```

## 4. 手順1：旧メニューボタン画像を読み込む

`src/assets.js`へimportを追加します。

```js
import menuButtonUrl from "../images/menu-button.svg";
```

`assets.ui`へ追加します。曲UIで追加した`linkButton`は消さずに残します。

```js
ui: {
  loadingNote: loadingNoteUrl,
  linkButton: linkButtonUrl,
  // 旧menu.htmlで、二つのメニューリンクの背景に使われていた画像です。
  menuButton: menuButtonUrl,
},
```

## 5. 手順2：MenuModalコンポーネントを作る

`src/components/MenuModal.jsx`を新しく作ります。

```jsx
import { assets } from "../assets.js";
import { menuLinks } from "../data/siteData.js";
import Modal from "./Modal.jsx";

export default function MenuModal({ isOpen, onClose }) {
  /*
   * リンクの文字とURLはmenuLinksへ分離されています。
   * mapを使うと、配列の要素数だけ同じ形のリンクを作れます。
   * リンクを増やすときにJSXをコピーする必要がありません。
   */
  return (
    <Modal
      isOpen={isOpen}
      titleId="menu-title"
      onClose={onClose}
      className="menu-window"
    >
      {/* 見出しは画面には出さず、読み上げソフトへメニュー名を伝えます。 */}
      <h2 id="menu-title" className="visually-hidden">
        メニュー
      </h2>

      <nav className="menu-list" aria-label="サイトメニュー">
        {menuLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            {/* 画像は装飾で、リンクの意味はspanの文字が伝えます。 */}
            <img src={assets.ui.menuButton} alt="" />
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
    </Modal>
  );
}
```

### `map`を使う理由

`src/data/siteData.js`の`menuLinks`は、次のような配列です。

```js
[
  { label: "使用曲プレイリスト", href: "..." },
  { label: "製作者のXへ", href: "..." },
]
```

`map`は一つずつ`link`として取り出し、同じ形のJSXへ変換します。`key`はReactが各要素を区別するために必要です。

## 6. 手順3：旧メニューデザインのCSSを書く

曲UI用CSSの下、`@media`より前へ追加します。

```css
.visually-hidden {
  /* 読み上げソフトには残し、目で見る画面の外へ移動します。 */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.menu-window {
  /* 旧menu.cssの500pxの円と背景色を引き継ぎます。 */
  display: flex;
  width: min(500px, 100%);
  aspect-ratio: 1;
  justify-content: center;
  align-items: center;
  padding: 25px;
  border-radius: 50%;
  background: #e9e2d8;
}

.menu-list {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.menu-list a {
  position: relative;
  display: block;
  width: min(450px, 100%);
  color: #8e897a;
  text-decoration: none;
}

.menu-list img {
  display: block;
  width: 100%;
}

.menu-list span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 35px;
  white-space: nowrap;
}

.menu-list a:hover {
  color: #b98c8f;
}

.menu-window .modal-close {
  /* 旧Modaalの大きな×を、円の左側へ配置します。 */
  top: 50%;
  right: auto;
  left: -105px;
  width: 90px;
  height: 90px;
  transform: translateY(-50%);
  color: #8e897a;
  font-size: 80px;
}
```

`@media (max-width: 640px)`の中へ追加します。

```css
.menu-window {
  width: min(500px, calc(100vw - 32px));
  padding: 18px;
}

.menu-list span {
  font-size: clamp(18px, 7vw, 35px);
}

.menu-window .modal-close {
  top: 12px;
  right: 12px;
  left: auto;
  width: 52px;
  height: 52px;
  transform: none;
  font-size: 46px;
}
```

スマートフォンでは円の左に×を置く余白がないため、円の右上へ移動します。色、円、リンク画像は旧デザインのままです。

## 7. 手順4：メイン画面にメニューボタンを置く

`src/App.jsx`へimportを追加します。

```jsx
import MenuModal from "./components/MenuModal.jsx";
```

`selectedSongId`のstateの近くへ追加します。

```jsx
// falseなら閉じている、trueなら開いている状態です。
const [isMenuOpen, setIsMenuOpen] = useState(false);
```

`isOverlayOpen`を次へ変更します。

```jsx
// 曲画面かメニューのどちらかが開いていれば、背後の3D操作を止めます。
const isOverlayOpen = Boolean(selectedSong) || isMenuOpen;
```

`site-header`内のタイトルのあとへボタンを追加します。

```jsx
<button
  className="menu-trigger"
  type="button"
  aria-label="メニューを開く"
  onClick={() => setIsMenuOpen(true)}
>
  メニュー
</button>
```

`SongModal`の下へ追加します。

```jsx
<MenuModal
  isOpen={isMenuOpen}
  onClose={() => setIsMenuOpen(false)}
/>
```

旧`menu.html`には「メニュー」という文字はありましたが、メインのThree.js画面へ固定する位置のCSSはありませんでした。そのため、入口のボタンはサイトタイトルの右側へ読みやすく配置し、開いたあとの円形画面は旧デザインをそのまま使います。

ボタン用CSSを追加します。

```css
.menu-trigger {
  padding: 6px 4px;
  border: 0;
  color: #f7f3e9;
  background: transparent;
  font: inherit;
  font-family: system-ui, sans-serif;
  font-size: 1rem;
  cursor: pointer;
  pointer-events: auto;
  text-shadow: 0 2px 14px rgb(27 42 35 / 35%);
}

.menu-trigger:hover {
  text-decoration: underline;
  text-underline-offset: 5px;
}
```

`.site-header`には`pointer-events: none`が指定されています。ボタンへ`pointer-events: auto`を書くことで、ボタンだけクリックを受け取れます。

## 8. 手順5：照準の変化をReactへ知らせる

`src/three/createMeloriumScene.js`の引数へ追加します。曲UIで追加した`onSelectSong`も残します。

```js
export function createMeloriumScene({
  container,
  onReady,
  onSelectSong,
  // 本へ照準が合った・外れた変化をReactへ伝える関数です。
  onInteractionChange,
}) {
```

`updateFocusedBook`の最後は、現在次の形です。

```js
if (focusedSongId === nextSongId) return;
focusedSongId = nextSongId;
```

直後へ通知を追加します。

```js
if (focusedSongId === nextSongId) return;
focusedSongId = nextSongId;

/*
 * 本が見つかったときは案内文、見失ったときは空文字を送ります。
 * 毎フレームではなく値が変化したときだけ送るため、不要な再描画を防げます。
 */
onInteractionChange(nextSongId ? "Fキーで開く" : "");
```

さらに、Fキーの処理で曲画面を開く直前にも案内を消します。

```js
if (event.code === "KeyF" && !event.repeat && focusedSongId && !isPaused) {
  // 曲画面と操作案内が重ならないよう、先に空文字へ戻します。
  onInteractionChange("");
  controls.unlock();
  onSelectSong(focusedSongId);
}
```

### 「近づいたら」の正確な条件

現在の判定は、単に本の近くへ立つだけではありません。

- 3D画面をクリックして視点操作中である
- 画面中央の白い照準が本へ重なっている
- カメラから本までが3メートル以内である

この三条件がそろったときに表示します。目の前に複数の本がある場合でも「どの本を開くのか」が明確になるためです。

## 9. 手順6：HookとExperienceへpropsを追加する

`src/hooks/useThreeScene.js`で受け取ります。

```js
export default function useThreeScene({
  containerRef,
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
}) {
```

`createMeloriumScene`へ渡します。

```js
const sceneApi = createMeloriumScene({
  container: containerRef.current,
  onReady,
  onSelectSong,
  onInteractionChange,
});
```

依存配列も更新します。

```js
}, [containerRef, onInteractionChange, onReady, onSelectSong]);
```

`src/components/Experience.jsx`でも受け取ります。

```jsx
export default function Experience({
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
}) {
```

`useThreeScene`へ渡します。

```js
useThreeScene({
  containerRef: sceneContainerRef,
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
});
```

## 10. 手順7：Appで案内文を表示する

`src/App.jsx`のstateへ追加します。

```jsx
// 空文字なら非表示、文章があれば照準の下へ表示します。
const [interactionText, setInteractionText] = useState("");
```

`Experience`へ渡します。

```jsx
<Experience
  isPaused={isOverlayOpen}
  onReady={handleSceneReady}
  onSelectSong={setSelectedSongId}
  onInteractionChange={setInteractionText}
/>
```

`controls-guide`の下へ、条件付き表示を追加します。

```jsx
{/*
 * &&の左側がtrueのときだけ、右側のJSXが表示されます。
 * モーダルが開いている間は案内を隠し、画面同士が重なるのを防ぎます。
 */}
{interactionText && !isOverlayOpen && (
  <p className="interaction-hint" role="status">
    {interactionText}
  </p>
)}
```

CSSを追加します。

```css
.interaction-hint {
  position: fixed;
  z-index: 20;
  left: 50%;
  bottom: 13%;
  margin: 0;
  padding: 12px 22px;
  transform: translateX(-50%);
  border-radius: 999px;
  color: #f7f3e9;
  background: rgb(43 35 32 / 72%);
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  white-space: nowrap;
  pointer-events: none;
}
```

## 11. 統合後のApp.jsxの形

最後に、`src/App.jsx`が次の構造になっているか確認します。コメントも含め、自分のコードと一行ずつ比べてください。

```jsx
import { useCallback, useState } from "react";
import Experience from "./components/Experience.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import MenuModal from "./components/MenuModal.jsx";
import SongModal from "./components/SongModal.jsx";
import { songs } from "./data/siteData.js";

export default function App() {
  // 3D素材を読み終えたらtrueになり、ローディング画面を閉じます。
  const [isSceneReady, setIsSceneReady] = useState(false);

  // 選択した曲IDです。nullなら曲画面は閉じています。
  const [selectedSongId, setSelectedSongId] = useState(null);

  // メニューの開閉をtrue / falseで表します。
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 本へ照準が合っているときだけ文章が入ります。
  const [interactionText, setInteractionText] = useState("");

  // Hookのシーン再作成を防ぐため、同じ関数を再利用します。
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

  // 曲IDを一曲分の表示データへ変換します。
  const selectedSong = selectedSongId ? songs[selectedSongId] : null;

  // UIが開いている間は3D操作を一時停止します。
  const isOverlayOpen = Boolean(selectedSong) || isMenuOpen;

  return (
    <main className="app">
      <Experience
        isPaused={isOverlayOpen}
        onReady={handleSceneReady}
        onSelectSong={setSelectedSongId}
        onInteractionChange={setInteractionText}
      />

      <header className="site-header">
        <p className="site-title">Melorium</p>
        <button
          className="menu-trigger"
          type="button"
          aria-label="メニューを開く"
          onClick={() => setIsMenuOpen(true)}
        >
          メニュー
        </button>
      </header>

      <div className="controls-guide" aria-label="操作方法">
        <span>クリック：視点操作</span>
        <span>W A S D：移動</span>
      </div>

      {interactionText && !isOverlayOpen && (
        <p className="interaction-hint" role="status">
          {interactionText}
        </p>
      )}

      <LoadingScreen isReady={isSceneReady} />

      <SongModal
        song={selectedSong}
        onClose={() => setSelectedSongId(null)}
      />

      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </main>
  );
}
```

## 12. 動作確認

```bash
npm run dev
```

### メニュー

1. メイン画面に「メニュー」が表示される。
2. 押すと500pxの円形メニューが開く。
3. 旧デザインの画像、色、文字サイズになっている。
4. プレイリストとXのリンクが新しいタブで開く。
5. ×、背景、Escapeキーで閉じられる。
6. メニューを開いている間はWASDで移動しない。

### 「Fキーで開く」表示

1. 本から離れていると表示されない。
2. 本へ近づき、中央の照準を合わせると「Fキーで開く」と表示される。
3. 本から離れる、または視線を外すと消える。
4. Fキーを押すと案内が消え、旧デザインの曲画面が開く。
5. 曲画面やメニューの上に案内が重ならない。

最後に次を実行します。

```bash
npm run lint
npm run build
git diff --check
```

## 13. よくあるエラー

### メニューボタンを押せない

`.site-header`の`pointer-events: none`に対して、`.menu-trigger`へ`pointer-events: auto`が書かれているか確認します。

### メニューの×が円の後ろへ隠れる

`.menu-window`や親要素へ`overflow: hidden`を追加していないか確認します。旧メニューの円形背景は`border-radius`で作り、×を円の外へ出すため、内容を切り取らないようにします。

### 案内がずっと表示されたままになる

`onInteractionChange(nextSongId ? "Fキーで開く" : "")`の空文字部分を確認します。本を見失ったとき、空文字をReactへ送る必要があります。

### 案内が何度もちらつく

通知が次の行より後にあるか確認します。

```js
if (focusedSongId === nextSongId) return;
```

同じ状態の間は通知せず、状態が変化した一回だけ通知します。

### メニューを開いても移動できてしまう

`isOverlayOpen`へ`isMenuOpen`を含めたか、`Experience`の`isPaused`へ渡したか確認します。

## 14. 完成チェックリスト

- [ ] 旧メニューと同じ円、色、リンク画像を使った
- [ ] メイン画面からメニューを開ける
- [ ] `menuLinks.map()`でリンクを表示した
- [ ] メニュー中は3D操作が止まる
- [ ] 3メートル以内で本へ照準を合わせたときだけ案内が出る
- [ ] 表示文が正確に「Fキーで開く」になっている
- [ ] 視線を外したとき案内が消える
- [ ] Fキーで案内が消えて曲画面が開く
- [ ] PCとスマートフォンの両方で操作できる
- [ ] `npm run lint`が成功する
- [ ] `npm run build`が成功する

## 15. 部屋移動課題と組み合わせるとき

[ドアから別の部屋へ移動する実装手順書](./door-room-transition-guide.md)を先に実装していても、このUI課題は追加できます。

その場合は、`createMeloriumScene`の`roomConfig`や`onChangeRoom`を消さず、今回の`onSelectSong`と`onInteractionChange`を追加してください。`App.jsx`でも`currentRoomId`を残したまま、曲・メニュー・案内用のstateを追加します。

複数の手順書の完成例を丸ごと上書きするのではなく、「新しく追加するpropsとstate」を見つけて統合することが大切です。
