import { useEffect, useState } from "react";
import { assets } from "../assets.js";

// 「0%から100%まで3秒」は既存仕様のため、変更しやすい定数として名前を付けています。
const LOADING_DURATION_MS = 3000;

export default function LoadingScreen({ isReady }) {
  // progressは0〜1の小数です。表示時だけ0〜100の整数へ変換します。
  const [progress, setProgress] = useState(0);

  // フェードアウト後にDOM自体を取り除くためのstateです。
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    /*
     * 空の依存配列[]なので、表示開始時に一度だけアニメーションを開始します。
     * setIntervalではなくrequestAnimationFrameを使うと、ブラウザの描画タイミングに合わせて滑らかに更新できます。
     */
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
    // 途中でコンポーネントが消えた場合は、予約済みの次フレームを取り消します。
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    /*
     * このEffectはisReadyまたはprogressが変化するたびに条件を確認します。
     * 「3秒経過」と「3D素材の読み込み完了」の両方がそろうまでは何もしません。
     */
    if (!isReady || progress < 1) return undefined;

    // CSSのフェード時間700msを待ってから、ローディング要素をDOMから削除します。
    const timerId = window.setTimeout(() => setIsVisible(false), 700);
    return () => window.clearTimeout(timerId);
  }, [isReady, progress]);

  // Reactコンポーネントがnullを返すと、そのコンポーネントは何も表示しません。
  if (!isVisible) return null;

  // 人が読みやすいパーセント表示にするため、小数を四捨五入します。
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
