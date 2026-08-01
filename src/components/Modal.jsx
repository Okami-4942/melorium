import { useEffect, useRef } from "react";

export default function Modal({ isOpen, titleId, onClose, children, className = "" }) {
  /*
   * Modalは曲画面とメニューで共通する「開く・閉じる」の仕組みを担当します。
   * childrenには、呼び出し元が<Modal>と</Modal>の間に書いた内容が入ります。
   * classNameには、曲用・メニュー用の見た目を追加するCSSクラスが入ります。
   */

  // 閉じるボタンのDOMを覚え、モーダルが開いた直後にフォーカスを移すために使います。
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // 閉じている間はイベント登録もフォーカス移動も必要ありません。
    if (!isOpen) return undefined;

    // optional chainingの?.により、ボタンがまだ無い場合は何もせず安全に終了します。
    closeButtonRef.current?.focus();

    // モーダルが開いている間だけEscapeキーを監視します。
    const closeWithEscape = (event) => {
      if (event.code === "Escape") onClose();
    };

    window.addEventListener("keydown", closeWithEscape);

    // モーダルを閉じたとき、またはコンポーネントが消えたときにイベントを解除します。
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [isOpen, onClose]);

  // isOpenがfalseなら、モーダル用のDOMを一切作りません。
  if (!isOpen) return null;

  return (
    // 背景部分を押したときはモーダルを閉じます。
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      {/* 中身を押したクリックが背景まで伝わり、閉じてしまうのを防ぎます。 */}
      <section
        className={`modal-window ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
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
        {/* 曲情報やメニューリンクなど、呼び出し元から渡された内容をここへ表示します。 */}
        {children}
      </section>
    </div>
  );
}
