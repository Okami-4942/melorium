import { useEffect, useRef } from "react";
import { createMeloriumScene } from "../three/createMeloriumScene.js";

export default function useThreeScene({
  containerRef,
  roomConfig,
  isPaused,
  onReady,
  onSelectSong,
  onInteractionChange,
  onChangeRoom,
}) {
  const sceneApiRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const sceneApi = createMeloriumScene({
      container: containerRef.current,
      roomConfig,
      onReady,
      onSelectSong,
      onInteractionChange,
      onChangeRoom,
    });
    sceneApiRef.current = sceneApi;

    return () => {
      sceneApi.dispose();
      sceneApiRef.current = null;
    };
  }, [containerRef,roomConfig,onInteractionChange,onReady,onSelectSong,onChangeRoom,]);

  useEffect(() => {
    sceneApiRef.current?.setPaused(isPaused);
  }, [isPaused]);
}
