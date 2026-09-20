import { assets } from "../assets.js";
import { menuLinks } from "../data/siteData.js";
import Modal from "./Modal.jsx";

export default function MenuModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      titleId="menu-title"
      onClose={onClose}
      className="menu-window"
    >
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
            <img src={assets.ui.menuButton} alt="" />
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
    </Modal>
  );
}