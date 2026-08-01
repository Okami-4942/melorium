import Modal from "./Modal.jsx";

export default function SongModal({ song, onClose }) {
  /*
   * songはAppがselectedSongIdから探した曲データです。
   * songがnullならBoolean(song)はfalseになり、共通Modalは何も表示しません。
   */
  return (
    <Modal
      isOpen={Boolean(song)}
      titleId="song-title"
      onClose={onClose}
      className="song-modal"
    >
      {/* songがあるときだけプロパティを読み、曲の内容を表示します。 */}
      {song && (
        <>
          <p className="modal-eyebrow">Music book</p>
          <h2 id="song-title">{song.title}</h2>
          <p className="song-artist">{song.artist}</p>
          <p className="song-description">{song.description}</p>
          <div className="song-links">
            <a href={song.youtubeUrl} target="_blank" rel="noreferrer">
              YouTube
            </a>
            <a href={song.spotifyUrl} target="_blank" rel="noreferrer">
              Spotify
            </a>
          </div>
        </>
      )}
    </Modal>
  );
}
