import { useRef } from "react";
import useThreeScene from "../hooks/useThreeScene.js";

export default function Experience({ roomConfig,isPaused, onReady, onSelectSong, onInteractionChange,onChangeRoom, }) {
  /*
   * ExperienceはReact側に「Three.jsを表示する場所」を用意するコンポーネントです。
   * Three.jsの具体的な処理をここへ直接書かず、useThreeSceneへ任せています。
   */

  /*
   * useRefは、Reactが作ったdivそのものを取得するために使います。
   * sceneContainerRef.currentには、描画後に下のdiv要素が入ります。
   * Three.jsはそのdivの中へcanvasを追加します。
   */
  const sceneContainerRef = useRef(null);

  // 親から受け取ったpropsをHookへそのまま渡し、ReactとThree.jsを接続します。
  useThreeScene({
    containerRef: sceneContainerRef,
    roomConfig,
    isPaused,
    onReady,
    onSelectSong,
    onInteractionChange,
    onChangeRoom,
  });

  return (
    // このdivの中身はReactではなくThree.jsが管理するため、子要素はJSXに書きません。
    <div
      ref={sceneContainerRef}
      className="three-scene"
      aria-label="Meloriumの3Dギャラリー"
    />
  );
}
