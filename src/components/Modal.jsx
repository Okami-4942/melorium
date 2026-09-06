import { useEffect, useRef } from "react";

export default function Modal({
  isOpen,
  titleId,
  onClose,
  children,
  className = "",
  style,
}) {
  /*
   * Modalは、曲画面とメニュー画面で共通する「開く・閉じる」を担当します。
   * 中に何を表示するかはchildrenとして呼び出し元から受け取ります。
   * このように共通部分を分けると、同じイベント処理を何度も書かずに済みます。
   */

  // useRefで閉じるボタンのDOMを覚えます。
  const closeButtonRef = useRef(null);

  useEffect(() => {
    // 閉じているときはキーイベントを登録する必要がありません。
    if (!isOpen) return undefined;

    // 開いた直後に×ボタンへフォーカスし、キーボードでも操作しやすくします。
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      // 旧song.jsと同じく、Escapeキーでも閉じられるようにします。
      if (event.code === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    // cleanupでイベントを解除し、開くたびにイベントが増えることを防ぎます。
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // falseのときは、モーダルのHTMLを画面に作りません。
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal-window ${className}`}
        style={style}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // ウィンドウ内のクリックが背景へ伝わって閉じるのを防ぎます。
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

        {/* <Modal>と</Modal>の間に書かれたJSXがここへ入ります。 */}
        {children}
      </section>
    </div>
  );
}