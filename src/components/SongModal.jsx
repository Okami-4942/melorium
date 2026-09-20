import { assets } from "../assets.js";
import Modal from "./Modal.jsx";

export default function SongModal({ song, onClose,backgroundColor }) {
  return (
    <Modal
      isOpen={Boolean(song)}
      titleId="song-title"
      onClose={onClose}
      className="song-window"
      style={{backgroundColor}}
    >
      {song && (
        <>
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