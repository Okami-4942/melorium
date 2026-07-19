const songOverlay = document.getElementById("song-overlay");

const closeButton = document.getElementById("close-button");

function openSongMenu() {

    songOverlay.classList.add("active");

    // PointerLockControlsを使うなら
    if (typeof controls !== "undefined") {
        controls.unlock();
    }

}

function closeSongMenu() {

    songOverlay.classList.remove("active");

    if (typeof controls !== "undefined") {
        controls.lock();
    }

}

// Fキーで開く
window.addEventListener("keydown", (e) => {

    if (e.code === "KeyF") {

        openSongMenu();

    }

    if (e.code === "Escape") {

        closeSongMenu();

    }

});

// ×ボタン
closeButton.addEventListener("click", closeSongMenu);