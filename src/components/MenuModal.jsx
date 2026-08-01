import { menuLinks } from "../data/siteData.js";
import Modal from "./Modal.jsx";

export default function MenuModal({ isOpen, onClose }) {
  /*
   * 開閉やEscapeキー処理は共通Modalへ任せ、このコンポーネントはメニュー内容だけを担当します。
   * 親のAppからisOpenとonCloseをpropsとして受け取っています。
   */
  return (
    <Modal
      isOpen={isOpen}
      titleId="menu-title"
      onClose={onClose}
      className="menu-modal"
    >
      <p className="modal-eyebrow">Melorium</p>
      <h2 id="menu-title">Menu</h2>
      <nav className="menu-links" aria-label="サイトメニュー">
        {/*
          mapは配列の各データを、一つずつ<a>要素へ変換します。
          keyはReactが各リンクを区別するための一意な値です。
        */}
        {menuLinks.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </nav>
    </Modal>
  );
}
