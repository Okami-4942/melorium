import { assets } from "../assets.js";
import { menuLinks } from "../data/siteData.js";
import Modal from "./Modal.jsx";

export default function MenuModal({ isOpen, onClose }) {
  /*
   * リンクの文字とURLはmenuLinksへ分離されています。
   * mapを使うと、配列の要素数だけ同じ形のリンクを作れます。
   * リンクを増やすときにJSXをコピーする必要がありません。
   */
  return (
    <Modal
      isOpen={isOpen}
      titleId="menu-title"
      onClose={onClose}
      className="menu-window"
    >
      {/* 見出しは画面には出さず、読み上げソフトへメニュー名を伝えます。 */}
      <h2 id="menu-title" className="visually-hidden">
        メニュー
      </h2>

      <nav className="menu-list" aria-label="サイトメニュー">
        {menuLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
          >
            {/* 画像は装飾で、リンクの意味はspanの文字が伝えます。 */}
            <img src={assets.ui.menuButton} alt="" />
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
    </Modal>
  );
}