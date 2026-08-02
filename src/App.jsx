import { useCallback, useState } from "react";
import Experience from "./components/Experience.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

export default function App() {
  /*
   * Appは画面全体の親コンポーネントです。
   * 複数の子コンポーネントが必要とするstateをここへ集めています。
   * useStateの更新関数を呼ぶとAppがもう一度実行され、新しいstateに合う表示へ更新されます。
   */

  // 3D素材を全て読み終えたかを保持します。LoadingScreenを閉じる条件に使います。
  const [isSceneReady, setIsSceneReady] = useState(false);

  /*
   * useCallbackは再描画後も同じ関数を再利用します。
   * useThreeSceneはコールバックが変わるとシーンを作り直すため、関数を固定して不要な初期化を防ぎます。
   */
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

  return (
    <main className="app">
      {/* UI課題を実装するまでは3D操作を一時停止しないため、falseを渡します。 */}
      <Experience isPaused={false} onReady={handleSceneReady} />

      <header className="site-header">
        <p className="site-title">Melorium</p>
      </header>

      <div className="controls-guide" aria-label="操作方法">
        <span>クリック：視点操作</span>
        <span>W A S D：移動</span>
      </div>

      {/* 読み込み完了までは、3D画面の手前にローディング画面を表示します。 */}
      <LoadingScreen isReady={isSceneReady} />
    </main>
  );
}
