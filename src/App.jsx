import { useCallback, useState } from "react";
import Experience from "./components/Experience.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import MenuModal from "./components/MenuModal.jsx";
import SongModal from "./components/SongModal.jsx";
import { songs } from "./data/siteData.js";
import { rooms } from "./data/roomData.js";

export default function App() {
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [interactionText, setInteractionText] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("main");
  const currentRoom = rooms[currentRoomId];
  const handleSceneReady = useCallback(() => setIsSceneReady(true), []);
  const selectedSong = selectedSongId ? songs[selectedSongId] : null;
  const isOverlayOpen = Boolean(selectedSong) || isMenuOpen;

  const handleChangeRoom = useCallback((nextRoomId) => {
    if (!rooms[nextRoomId]) {
      console.error(`存在しない部屋です: ${nextRoomId}`);
      return;
    }
    setIsSceneReady(false);
    setSelectedSongId(null);
    setInteractionText("");
    setCurrentRoomId(nextRoomId);
  }, []);

  return (
    <main className="app">
      <Experience
        roomConfig={currentRoom}
        isPaused={isOverlayOpen}
        onReady={handleSceneReady}
        onSelectSong={setSelectedSongId}
        onInteractionChange={setInteractionText}
        onChangeRoom={handleChangeRoom}
      />

      <header className="site-header">
        <div>
          <p className="site-title">Melorium</p>
          <p className="room-name">{currentRoom.label}</p>
        </div>
        <button
          className="menu-trigger"
          type="button"
          aria-label="メニューを開く"
          onClick={() => setIsMenuOpen(true)}
        >
          メニュー
        </button>
      </header>

      <div className="controls-guide" aria-label="操作方法">
        <span>マウス：視点操作</span>
        <span>W A S D：移動</span>
      </div>
      {interactionText && !isOverlayOpen && (
        <p className="interaction-hint" role="status">
          {interactionText}
        </p>
      )}
      <LoadingScreen key={currentRoomId} isReady={isSceneReady} />
      <SongModal
        song={selectedSong}
        backgroundColor={currentRoom.modalbgColor}
        onClose={() => setSelectedSongId(null)}
      />
      <MenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </main>
  );
}
