import { useEffect, useRef } from "react";
import { createMeloriumScene } from "../three/createMeloriumScene.js";

export default function useThreeScene({
  containerRef,
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
}) {
  /*
   * このカスタムHookは、ReactのライフサイクルとThree.jsのライフサイクルをつなぎます。
   * Reactは画面の部品を宣言的に描画しますが、Three.jsはscene.add()やrender()を順番に呼ぶ命令形です。
   * 異なる二つの仕組みを混ぜず、このHookを境界にすることで役割を分かりやすくしています。
   */

  // createMeloriumSceneが返す公開APIを、再描画されても失わないようuseRefへ保存します。
  const sceneApiRef = useRef(null);

  useEffect(() => {
    /*
     * Reactが最初の描画を終えるまではcontainerRef.currentがnullです。
     * divを取得できたあとで初めてWebGLRendererを作ります。
     */
    if (!containerRef.current) return undefined;

    // ReactからThree.jsへはDOMとコールバックだけを渡します。Three.js側はReactのstateを直接変更しません。
    const sceneApi = createMeloriumScene({
      container: containerRef.current,
      onReady,
      onSelectSong,
      onInteractionChange,
    });
    sceneApiRef.current = sceneApi;

    /*
     * useEffectが返す関数はcleanupと呼ばれます。
     * コンポーネントが消えるときや依存値が変わる直前に実行され、イベントやGPUメモリを片付けます。
     */
    return () => {
      sceneApi.dispose();
      sceneApiRef.current = null;
    };
  }, [containerRef, onInteractionChange, onReady, onSelectSong]);

  useEffect(() => {
    /*
     * isPausedだけが変わった場合、重い3Dシーンを作り直す必要はありません。
     * すでに作成済みのAPIへ新しい値だけを伝え、移動とPointer Lockを切り替えます。
     */
    sceneApiRef.current?.setPaused(isPaused);
  }, [isPaused]);
}
