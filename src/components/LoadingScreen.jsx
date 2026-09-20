import { useEffect, useState } from "react";
import { assets } from "../assets.js";

const LOADING_DURATION_MS = 3000;

export default function LoadingScreen({ isReady }) {
  const [progress, setProgress] = useState(0);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const startedAt = performance.now();
    let animationFrameId;

    const updateProgress = (now) => {
      const nextProgress = Math.min(
        (now - startedAt) / LOADING_DURATION_MS,
        1,
      );
      setProgress(nextProgress);

      if (nextProgress < 1) {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    if (!isReady || progress < 1) return undefined;

    const timerId = window.setTimeout(() => setIsVisible(false), 700);
    return () => window.clearTimeout(timerId);
  }, [isReady, progress]);

  if (!isVisible) return null;

  const percentage = Math.round(progress * 100);

  return (
    <div
      className={`loading-screen ${isReady && progress === 1 ? "is-leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="コンテンツを読み込んでいます"
    >
      <div className="loading-container">
        <p className="loading-text">now loading</p>
        <div className="progress-bar" aria-hidden="true">
          <div className="progress" style={{ width: `${percentage}%` }} />
          <img
            className="loading-note"
            style={{ left: `${percentage}%` }}
            src={assets.ui.loadingNote}
            alt=""
          />
        </div>
        <p className="loading-percentage">{percentage}%</p>
      </div>
    </div>
  );
}
