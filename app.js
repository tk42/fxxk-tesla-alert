let countdown;
const timerDisplay = document.getElementById('timerDisplay');
const countdownButton = document.getElementById('countdownButton');
const audio = new Audio('alarm.mp3');  // サウンドファイルのパス

function timer(seconds) {
    // 再生中の音声があれば停止
    audio.pause();
    audio.currentTime = 0; // 再生位置を音声の開始位置にリセット

    clearInterval(countdown);
    const now = Date.now();
    const then = now + seconds * 1000;
    displayTimeLeft(seconds);

    countdown = setInterval(() => {
        const secondsLeft = Math.round((then - Date.now()) / 1000);
        if (secondsLeft < 0) {
            clearInterval(countdown);
            audio.play();  // サウンドを再生
            return;
        }
        displayTimeLeft(secondsLeft);
    }, 1000);
}

function displayTimeLeft(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = seconds % 60;
    const display = `${minutes}:${remainderSeconds < 10 ? '0' : ''}${remainderSeconds}`;
    timerDisplay.textContent = display;
}

countdownButton.addEventListener('click', () => {
    timer(14);
});