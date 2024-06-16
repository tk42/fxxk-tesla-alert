let countdown;
const timerDisplay = document.getElementById('timerDisplay');
const countdownButton = document.getElementById('countdownButton');

// オーディオの再生
function playSound() {
    var source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

// オーディオ停止
function stopSound() {
    var source = audioContext.createBufferSource();
    source.stop();
}

function timer(seconds) {
    // 再生中の音声があれば停止
    stopSound();
    // audio.currentTime = 0; // 再生位置を音声の開始位置にリセット

    clearInterval(countdown);
    const now = Date.now();
    const then = now + seconds * 1000;
    displayTimeLeft(seconds);

    countdown = setInterval(() => {
        const secondsLeft = Math.round((then - Date.now()) / 1000);
        if (secondsLeft < 0) {
            clearInterval(countdown);
            playSound();
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

// AudioContextの設定
var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var audioBuffer;

// オーディオファイルのロード
function loadAudio() {
    var request = new XMLHttpRequest();
    request.open('GET', 'alarm.mp3', true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer) {
            audioBuffer = buffer;
        }, function(e) {
            console.log('Audio error! ', e);
        });
    }
    request.send();
}

// イベントリスナー
countdownButton.addEventListener('click', function() {
    timer(14);
});

// オーディオファイルのプリロード
loadAudio();