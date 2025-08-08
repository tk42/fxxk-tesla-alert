let countdownId = null;
let endAt = null;
let audioUnlocked = false;

const countdownElement = document.getElementById('countdown');
const button = document.getElementById('timerButton');

const alarm = document.getElementById('alarm') || new Audio('alarm.mp3');
const silence = document.getElementById('silence') || new Audio('250-milliseconds-of-silence.mp3');

async function unlockAudio() {
  if (audioUnlocked) return;
  try {
    // 最初のユーザー操作内で無音→即停止してオーディオを解錠
    await silence.play();
    silence.pause();
    silence.currentTime = 0;

    // アラームも一度だけ“鳴らして→即停止”でデコードを確実に
    await alarm.play();
    alarm.pause();
    alarm.currentTime = 0;

    audioUnlocked = true;
  } catch (e) {
    // 失敗しても次のタップで再挑戦
    console.debug('Audio unlock failed:', e);
  }
}

// iOSは mousedown より pointerdown/touchstart の方が安定
document.addEventListener('pointerdown', unlockAudio, { once: false });

function stopTimer() {
  if (countdownId) {
    clearInterval(countdownId);
    countdownId = null;
  }
  alarm.pause();
  alarm.currentTime = 0;
}

function startTimer(seconds = 12) {
  stopTimer();
  endAt = Date.now() + seconds * 1000;

  // すぐに表示更新
  updateDisplay();

  countdownId = setInterval(() => {
    updateDisplay();
  }, 250); // 1秒より細かく更新してズレを抑制
}

function updateDisplay() {
  const msLeft = Math.max(0, endAt - Date.now());
  const secLeft = Math.ceil(msLeft / 1000); // 見た目のズレを抑える
  countdownElement.textContent = `0:${String(secLeft).padStart(2, '0')}`;

  if (msLeft <= 0) {
    clearInterval(countdownId);
    countdownId = null;
    // 再生（解錠済みなら確実に鳴る）
    alarm.play().catch(e => console.error('再生エラー:', e));
    // 可能なら振動
    if (navigator.vibrate) navigator.vibrate(200);
  }
}

button.addEventListener('click', async () => {
  // クリック時に解錠を試みる（未解錠でもOK）
  await unlockAudio();

  // ボタンのトグル動作：実行中なら停止、停止中なら開始
  if (countdownId) {
    stopTimer();
    countdownElement.textContent = '0:12';
  } else {
    startTimer(12);
  }
});