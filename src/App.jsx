import { useCallback, useState } from "react";
import Experience from "./components/Experience.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import MenuModal from "./components/MenuModal.jsx";
import SongModal from "./components/SongModal.jsx";
import { songs } from "./data/siteData.js";

export default function App() {
  /*
   * Appは画面全体の親コンポーネントです。
   * 複数の子コンポーネントが必要とするstateをここへ集めています。
   * useStateの更新関数を呼ぶとAppがもう一度実行され、新しいstateに合う表示へ更新されます。
   */

  // 3D素材を全て読み終えたかを保持します。LoadingScreenを閉じる条件に使います。
  const [isSceneReady, setIsSceneReady] = useState(false);

  // nullなら曲モーダルを閉じ、曲IDがあればその曲のモーダルを表示します。
  const [selectedSongId, setSelectedSongId] = useState(null);

  // メニューが開いているかをtrue / falseで管理します。
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Three.jsが「現在見ている本」を見つけたときに表示する操作案内です。
  const [interactionText, setInteractionText] = useState("");

  /*
   * useCallbackは再描画後も同じ関数を再利用します。
   * useThreeSceneはコールバックが変わるとシーンを作り直すため、関数を固定して不要な初期化を防ぎます。
   */
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

  // 曲IDを実際の曲データへ変換します。IDがnullならselectedSongもnullです。
  const selectedSong = selectedSongId ? songs[selectedSongId] : null;

  // どちらかのモーダルが開いている間は、背後の3D移動と視点操作を止めます。
  const isOverlayOpen = Boolean(selectedSong) || isMenuOpen;

  return (
    <main className="app">
      {/* 親のstateと更新関数をpropsとして3D側へ渡します。 */}
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
          Menu
        </button>
      </header>

      <div className="controls-guide" aria-label="操作方法">
        <span>クリック：視点操作</span>
        <span>W A S D：移動</span>
        <span>F：本を開く</span>
      </div>

      {/* &&を使った条件付きレンダリングです。条件が両方trueのときだけ案内を表示します。 */}
      {interactionText && !isOverlayOpen && (
        <p className="interaction-hint">{interactionText}</p>
      )}

      {/* 各モーダルは表示条件をpropsで受け取り、自分自身で表示・非表示を決めます。 */}
      <LoadingScreen isReady={isSceneReady} />
      <SongModal song={selectedSong} onClose={() => setSelectedSongId(null)} />
      <MenuModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </main>
  );
}
