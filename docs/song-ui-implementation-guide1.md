# 高校生向け：旧デザインの曲UIをReactで実装する手順書

## 1. この課題で作るもの

3D空間で本へ照準を合わせて`F`キーを押したとき、選んだ曲の情報を画面へ表示します。

この課題では、次の流れを自分で完成させます。

```text
Three.jsが照準中の本を見つける
        ↓
Fキーを押す
        ↓
曲IDをpropsの関数でReactへ渡す
        ↓
App.jsxが曲IDをstateへ保存する
        ↓
SongModal.jsxが対応する曲を表示する
```

現在のプロジェクトには、本へ照準が合っているかを調べる処理と曲データはあります。しかし、`F`キーからReactへ曲IDを渡す処理と曲UIは、学習課題として未実装です。

## 2. 旧song画面から引き継ぐデザイン

旧`song.html`、`song.css`、`song.js`では、次のデザインが使われていました。

- 画面全体を半透明の黒い背景で覆う
- 幅700px、高さ420pxの薄いピンク色のウィンドウ
- ウィンドウの角は48pxの角丸
- 右上に薄い赤色の`×`ボタン
- 曲名は40px、説明文は25px
- YouTubeとSpotifyのリンクを横に並べる
- リンクの背景には`images/link-button.svg`を使う

この見た目を保ちながら、jQueryを使わずReactで開閉します。画面が狭いスマートフォンでは、はみ出さないように大きさと並び方だけを調整します。

## 3. この課題で触るファイル

| ファイル | 役割 |
| --- | --- |
| `src/assets.js` | リンクボタン画像を読み込む |
| `src/components/Modal.jsx` | モーダル共通の開閉処理を作る |
| `src/components/SongModal.jsx` | 旧song画面の内容をReactで作る |
| `src/styles/global.css` | 旧song画面の見た目を再現する |
| `src/three/createMeloriumScene.js` | Fキーで曲IDを通知する |
| `src/hooks/useThreeScene.js` | Three.jsへ通知用の関数を渡す |
| `src/components/Experience.jsx` | AppとHookの間でpropsを渡す |
| `src/App.jsx` | 選択中の曲をstateで管理する |

## 4. 作業前の確認

プロジェクトのフォルダで次を実行します。

```bash
npm install
npm run lint
npm run build
```

作業前からエラーがある場合は、自分の変更によるエラーと区別できるよう先生へ伝えてください。

## 5. 手順1：リンクボタン画像を読み込む

`src/assets.js`のimportが並んでいる場所へ、次を追加します。

```js
import linkButtonUrl from "../images/link-button.svg";
```

続いて、`assets.ui`へ`linkButton`を追加します。

```js
ui: {
  loadingNote: loadingNoteUrl,
  // 旧song画面のYouTube・Spotifyボタンに使われていた画像です。
  linkButton: linkButtonUrl,
},
```

Reactでは、画像のパスを文字列で直接書くより、Viteにimportしてもらう方が開発時とbuild後の両方で安全に読み込めます。

## 6. 手順2：共通のModalコンポーネントを作る

`src/components/Modal.jsx`を新しく作り、次を書きます。

```jsx
import { useEffect, useRef } from "react";

export default function Modal({
  isOpen,
  titleId,
  onClose,
  children,
  className = "",
}) {
  /*
   * Modalは、曲画面とメニュー画面で共通する「開く・閉じる」を担当します。
   * 中に何を表示するかはchildrenとして呼び出し元から受け取ります。
   * このように共通部分を分けると、同じイベント処理を何度も書かずに済みます。
   */

  // useRefで閉じるボタンのDOMを覚えます。
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // 閉じているときはキーイベントを登録する必要がありません。
    if (!isOpen) return undefined;

    // 開いた直後に×ボタンへフォーカスし、キーボードでも操作しやすくします。
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      // 旧song.jsと同じく、Escapeキーでも閉じられるようにします。
      if (event.code === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    // cleanupでイベントを解除し、開くたびにイベントが増えることを防ぎます。
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // falseのときは、モーダルのHTMLを画面に作りません。
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal-window ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // ウィンドウ内のクリックが背景へ伝わって閉じるのを防ぎます。
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          className="modal-close"
          type="button"
          aria-label="閉じる"
          onClick={onClose}
        >
          ×
        </button>

        {/* <Modal>と</Modal>の間に書かれたJSXがここへ入ります。 */}
        {children}
      </section>
    </div>
  );
}
```

### 覚えておきたい点

- `props`は親コンポーネントから受け取る値です。
- `children`には開始タグと終了タグの間に書いた内容が入ります。
- `useEffect`は、画面表示以外の処理であるイベント登録に使います。
- `return`で返すcleanupは、登録したイベントを必ず解除します。
- `if (!isOpen) return null`がReactの条件付き表示です。

## 7. 手順3：SongModalコンポーネントを作る

`src/components/SongModal.jsx`を新しく作ります。

```jsx
import { assets } from "../assets.js";
import Modal from "./Modal.jsx";

export default function SongModal({ song, onClose }) {
  /*
   * songには、App.jsxが曲IDから探した一曲分のデータが入ります。
   * songがnullならBoolean(song)はfalseになり、Modalは表示されません。
   */
  return (
    <Modal
      isOpen={Boolean(song)}
      titleId="song-title"
      onClose={onClose}
      className="song-window"
    >
      {/* songが存在するときだけ、曲名・説明・リンクを読み取ります。 */}
      {song && (
        <>
          {/* 旧画面の「曲名/作者」という一行を、選択した曲の実データで表示します。 */}
          <h2 id="song-title">
            {song.title} / {song.artist}
          </h2>

          <p className="song-description">{song.description}</p>

          <div className="song-button-area">
            <a href={song.youtubeUrl} target="_blank" rel="noreferrer">
              <img src={assets.ui.linkButton} alt="" />
              <span>YouTube</span>
            </a>

            <a href={song.spotifyUrl} target="_blank" rel="noreferrer">
              <img src={assets.ui.linkButton} alt="" />
              <span>Spotify</span>
            </a>
          </div>
        </>
      )}
    </Modal>
  );
}
```

`<>...</>`はFragmentです。不要な`div`を増やさず、複数の要素をまとめて返せます。

画像は装飾なので`alt=""`にし、リンクの意味は`span`の文字で伝えます。

## 8. 手順4：旧デザインのCSSを書く

`src/styles/global.css`の`@media`より前へ、次を追加します。

```css
.modal-backdrop {
  /* 旧#song-overlayと同じく、画面全体を半透明の黒で覆います。 */
  position: fixed;
  z-index: 50;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background: rgb(0 0 0 / 35%);
}

.modal-window {
  /* position: relativeにすると、×ボタンの基準がこの枠になります。 */
  position: relative;
  box-sizing: border-box;
}

.song-window {
  /* 旧song.cssの700px × 420px、色、角丸を引き継ぎます。 */
  width: min(700px, 100%);
  height: 420px;
  padding: 55px 65px;
  border-radius: 48px;
  background: #eed1d2;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 25px;
  padding: 0;
  border: 0;
  color: #b98c8f;
  background: none;
  font-family: system-ui, sans-serif;
  font-size: 40px;
  line-height: 1;
  cursor: pointer;
}

.song-window h2 {
  margin: 0;
  color: #2b2320;
  font-size: 40px;
  font-weight: 400;
}

.song-description {
  /* 旧CSSの「margin: top 20px」は文法エラーなので、意図を20pxの上余白として直します。 */
  margin: 20px 0 28px;
  color: #2b2320;
  font-size: 25px;
  line-height: 1.6;
}

.song-button-area {
  display: flex;
  justify-content: center;
  gap: 35px;
}

.song-button-area a {
  position: relative;
  display: block;
  width: 290px;
  max-width: 100%;
  color: #b99a57;
  font-size: 35px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.song-button-area img {
  display: block;
  width: 100%;
}

.song-button-area span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}

.song-button-area a:hover {
  color: #b98c8f;
}
```

既存の`@media (max-width: 640px)`の中へ、次を追加します。

```css
.song-window {
  height: auto;
  padding: 54px 28px 32px;
  border-radius: 32px;
}

.song-window h2 {
  font-size: clamp(28px, 9vw, 40px);
}

.song-description {
  font-size: clamp(17px, 5vw, 25px);
}

.song-button-area {
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.song-button-area a {
  width: min(290px, 100%);
  font-size: clamp(24px, 8vw, 35px);
}
```

PCでは旧デザインの値を使い、スマートフォンだけ縦並びにしています。これはデザイン変更ではなく、画面外へはみ出して操作できなくなる問題を防ぐ調整です。

## 9. 手順5：Three.jsから曲IDを通知する

`src/three/createMeloriumScene.js`の関数の引数へ`onSelectSong`を追加します。

```js
export function createMeloriumScene({
  container,
  onReady,
  // Fキーで選んだ曲IDをReactへ伝えるため、関数を受け取ります。
  onSelectSong,
}) {
```

`handleKeyDown`内にあるTODOを、次へ置き換えます。

```js
if (event.code === "KeyF" && !event.repeat && focusedSongId && !isPaused) {
  /*
   * Pointer Lockを解除するとマウスカーソルが戻り、
   * モーダルのリンクや×ボタンをクリックできるようになります。
   */
  controls.unlock();

  // 例: "hidamari"という曲IDをReact側へ通知します。
  onSelectSong(focusedSongId);
}
```

条件の意味は次の通りです。

- `event.code === "KeyF"`：Fキーだけに反応する
- `!event.repeat`：押し続けたときに何度も実行しない
- `focusedSongId`：本へ照準が合っているときだけ実行する
- `!isPaused`：別のUIを開いている間は実行しない

## 10. 手順6：Hookを通して関数を渡す

`src/hooks/useThreeScene.js`で`onSelectSong`を受け取ります。

```js
export default function useThreeScene({
  containerRef,
  isPaused,
  onReady,
  onSelectSong,
}) {
```

`createMeloriumScene`へ渡します。

```js
const sceneApi = createMeloriumScene({
  container: containerRef.current,
  onReady,
  onSelectSong,
});
```

最初の`useEffect`の依存配列にも追加します。

```js
}, [containerRef, onReady, onSelectSong]);
```

依存配列へ書かないと、Hookが古い関数を使い続ける可能性があります。

## 11. 手順7：Experienceを通して関数を渡す

`src/components/Experience.jsx`でpropsを受け取ります。

```jsx
export default function Experience({ isPaused, onReady, onSelectSong }) {
```

`useThreeScene`へ追加します。

```js
useThreeScene({
  containerRef: sceneContainerRef,
  isPaused,
  onReady,
  onSelectSong,
});
```

`App → Experience → useThreeScene → createMeloriumScene`と、上から順番に同じ関数を渡しています。途中で一つでも書き忘れると、Fキーの結果はReactへ届きません。

## 12. 手順8：Appで選択中の曲を管理する

`src/App.jsx`の上部へimportを追加します。

```jsx
import SongModal from "./components/SongModal.jsx";
import { songs } from "./data/siteData.js";
```

`isSceneReady`のstateの下へ追加します。

```jsx
// nullは「曲を選んでいない」、文字列は「そのIDの曲を選んでいる」という意味です。
const [selectedSongId, setSelectedSongId] = useState(null);

// 曲IDを表示に必要な曲名・説明・URLへ変換します。
const selectedSong = selectedSongId ? songs[selectedSongId] : null;

// 曲画面が開いている間は、背後の3D操作を止めます。
const isOverlayOpen = Boolean(selectedSong);
```

`Experience`を次のように変更します。

```jsx
<Experience
  isPaused={isOverlayOpen}
  onReady={handleSceneReady}
  // setState関数を渡すと、Three.jsから届いた曲IDをそのまま保存できます。
  onSelectSong={setSelectedSongId}
/>
```

`LoadingScreen`の下へ曲画面を追加します。

```jsx
<SongModal
  song={selectedSong}
  // nullへ戻すとsongもnullになり、条件付き表示によって閉じます。
  onClose={() => setSelectedSongId(null)}
/>
```

ここで大切なのは、`document.getElementById`で要素を探して直接表示を変えていないことです。Reactではstateを変更し、そのstateに合う画面をJSXで表します。

## 13. 動作確認

開発サーバーを起動します。

```bash
npm run dev
```

次を順番に確認します。

1. 画面をクリックし、WASDで本へ近づける。
2. 画面中央の照準を本へ合わせる。
3. 3メートル以内で`F`キーを一度押す。
4. 選んだ本の曲名、作者、説明が表示される。
5. YouTubeとSpotifyのリンクが新しいタブで開く。
6. `×`、背景、Escapeキーのどれでも閉じられる。
7. 曲画面を開いている間はWASDで移動しない。
8. 閉じたあと、3D画面をもう一度クリックすると移動を再開できる。

最後に静的な検査を行います。

```bash
npm run lint
npm run build
git diff --check
```

## 14. よくあるエラー

### `onSelectSong is not a function`

`App → Experience → useThreeScene → createMeloriumScene`のどこかで、propsを書き忘れています。同じ名前になっているか一段ずつ確認します。

### Fキーを押しても何も起きない

- 本から3メートル以内か
- 画面中央の照準が本へ重なっているか
- `handleKeyDown`のTODOを置き換えたか
- `onSelectSong(focusedSongId)`を書いたか

を確認します。

### リンクボタン画像が出ない

`assets.ui.linkButton`の名前がimport側と利用側で一致しているか確認します。`link-button.svg`は`images`フォルダにあります。

### 閉じた直後に視点操作が始まらない

ブラウザのPointer Lockは、利用者が画面をクリックしたときだけ再開できます。これはブラウザの安全上の決まりなので、閉じたあと3D画面を一度クリックします。

## 15. 完成チェックリスト

- [ ] 旧song画面と同じピンク、角丸、文字色、リンク画像を使った
- [ ] 曲名と作者を旧画面と同じ見出し位置へ表示した
- [ ] スマートフォンでも画面外へはみ出さない
- [ ] 曲IDをpropsでThree.jsからReactへ渡した
- [ ] `selectedSongId`を`useState`で管理した
- [ ] Fキーを押し続けても一度だけ開く
- [ ] ×、背景、Escapeキーで閉じられる
- [ ] 曲画面を開いている間は3D操作が止まる
- [ ] `npm run lint`が成功する
- [ ] `npm run build`が成功する

## 16. 次の課題

曲UIが完成したら、[メニューと「Fキーで開く」表示の実装手順書](./ui-implementation-guide.md)へ進みます。そこで、旧メニューデザイン、メイン画面への配置、近づいた本の操作案内を実装します。
