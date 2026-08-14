import { useCallback, useState } from "react";
import Experience from "./components/Experience.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import MenuModal from "./components/MenuModal.jsx";
import SongModal from "./components/SongModal.jsx";
import { songs } from "./data/siteData.js";
import { rooms } from "./data/roomData.js";

export default function App() {
  /*
   * Appは画面全体の親コンポーネントです。
   * 複数の子コンポーネントが必要とするstateをここへ集めています。
   * useStateの更新関数を呼ぶとAppがもう一度実行され、新しいstateに合う表示へ更新されます。
   */

  // 3D素材を全て読み終えたかを保持します。LoadingScreenを閉じる条件に使います。
  const [isSceneReady, setIsSceneReady] = useState(false);

  // nullは「曲を選んでいない」、文字列は「そのIDの曲を選んでいる」という意味です。
  const [selectedSongId, setSelectedSongId] = useState(null);

  // falseなら閉じている、trueなら開いている状態です。
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 空文字なら非表示、文章があれば照準の下へ表示します。
  const [interactionText, setInteractionText] = useState("");

  const [currentRoomId, setCurrentRoomId] = useState("main");
  const currentRoom = rooms[currentRoomId];


  // Hookのシーン再作成を防ぐため、同じ関数を再利用します。
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

  // 曲IDを表示に必要な曲名・説明・URLへ変換します。
  const selectedSong = selectedSongId ? songs[selectedSongId] : null;

  // 曲画面かメニューのどちらかが開いていれば、背後の3D操作を止めます。
  const isOverlayOpen = Boolean(selectedSong) || isMenuOpen;

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

  return (
    <main className="app">
      {/* UI課題を実装するまでは3D操作を一時停止しないため、falseを渡します。 */}
      <Experience
        roomConfig={currentRoom}
        isPaused={isOverlayOpen}
        onReady={handleSceneReady}
        // setState関数を渡すと、Three.jsから届いた曲IDをそのまま保存できます。
        onSelectSong={setSelectedSongId}
        onInteractionChange={setInteractionText}
        onChangeRoom={handleChangeRoom}
      />

      <header className="site-header">
        <div>
          <p className="site-title">Melorium</p>
          <p className="room-name">{currentRoom.label}</p>
        </div>
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

      {/*
 * &&の左側がtrueのときだけ、右側のJSXが表示されます。
 * モーダルが開いている間は案内を隠し、画面同士が重なるのを防ぎます。
 */}
      {interactionText && !isOverlayOpen && (
        <p className="interaction-hint" role="status">
          {interactionText}
        </p>
      )}

      {/* 読み込み完了までは、3D画面の手前にローディング画面を表示します。 */}
      <LoadingScreen key={currentRoomId} isReady={isSceneReady} />
      <SongModal
        song={selectedSong}
        // nullへ戻すとsongもnullになり、条件付き表示によって閉じます。
        onClose={() => setSelectedSongId(null)}
      />
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </main>
  );
}
