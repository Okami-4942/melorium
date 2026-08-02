import { assets } from "../assets.js";
import Modal from "./Modal.jsx";

export default function SongModal({ song, onClose }) {
  /*
   * songには、App.jsxが曲IDから探した一曲分のデータが入ります。
   * songがnullならBoolean(song)はfalseになり、Modalは表示されません。
   */
  return (
    <Modal
      isOpen={Boolean(song)}
      titleId="song-title"
      onClose={onClose}
      className="song-window"
    >
      {/* songが存在するときだけ、曲名・説明・リンクを読み取ります。 */}
      {song && (
        <>
          {/* 旧画面の「曲名/作者」という一行を、選択した曲の実データで表示します。 */}
          <h2 id="song-title">
            {song.title} 
          </h2>

          <h3 className="song-artist">
            {song.artist}
          </h3>

          <p className="song-description">{song.description}</p>

          <div className="song-button-area">
            <a href={song.youtubeUrl} target="_blank" rel="noreferrer">
              <img src={assets.ui.linkButton} alt="" />
              <span>YouTube</span>
            </a>

            <a href={song.spotifyUrl} target="_blank" rel="noreferrer">
              <img src={assets.ui.linkButton} alt="" />
              <span>Spotify</span>
            </a>
          </div>
        </>
      )}
    </Modal>
  );
}