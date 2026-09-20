import { useRef } from "react";
import useThreeScene from "../hooks/useThreeScene.js";

export default function Experience({ roomConfig,isPaused, onReady, onSelectSong, onInteractionChange,onChangeRoom, }) {

  const sceneContainerRef = useRef(null);

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
    <div
      ref={sceneContainerRef}
      className="three-scene"
      aria-label="Meloriumの3Dギャラリー"
    />
  );
}
