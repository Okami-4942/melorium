const progressBar = document.querySelector(".progress");
const note = document.querySelector(".note");
const bar = document.querySelector(".progress-bar");
const percentage = document.querySelector(".loading-percentage");
const MINIMUM_LOADING_DURATION_MS = 3000;
const loadingStartedAt = performance.now();
let displayedProgress = 0;
let hideTimer = null;


// ============================
// 外部から進捗を更新する関数
// progress : 0 ～ 1
// ============================
function setLoadingProgress(progress) {
    if (!progressBar || !note || !bar) return;

    progress = Math.max(displayedProgress, Math.min(progress, 1));
    displayedProgress = progress;

    // 金色部分を伸ばす
    progressBar.style.width =
        `${progress * 100}%`;

    // 音符を移動
    note.style.left = `${progress * 100}%`;

    if (percentage) {
        percentage.textContent = `${Math.round(progress * 100)}%`;
    }
}


// ============================
// ローディング画面を消す関数
// ============================
function hideLoadingScreen() {
    const loading = document.getElementById("loading-screen");
    if (!loading || loading.classList.contains("is-hidden")) return;

    // 読み込みが速い場合も、デバッグできるよう最低3秒間は表示する
    const elapsed = performance.now() - loadingStartedAt;
    const remaining = MINIMUM_LOADING_DURATION_MS - elapsed;

    if (remaining > 0) {
        if (!hideTimer) {
            hideTimer = setTimeout(() => {
                hideTimer = null;
                hideLoadingScreen();
            }, remaining);
        }
        return;
    }

    loading.classList.add("is-hidden");
    loading.style.opacity = "0";
    loading.setAttribute("aria-hidden", "true");

    setTimeout(() => {
        loading.remove();
    }, 1000);
}

window.setLoadingProgress = setLoadingProgress;
window.hideLoadingScreen = hideLoadingScreen;
