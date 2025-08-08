let timerId = null;
let endAt = 0;
let unlocked = false;

const countdownEl = document.getElementById('countdown');
const button = document.getElementById('timerButton');
const alarm = document.getElementById('alarm');
const silence = document.getElementById('silence');

// デバッグ：読み込み/エラー確認
alarm.addEventListener('canplaythrough', () => console.log('alarm ready'));
alarm.addEventListener('error', (e) => console.error('alarm load error', alarm.error));
silence.addEventListener('canplaythrough', () => console.log('silence ready'));
silence.addEventListener('error', (e) => console.error('silence load error', silence.error));

// 初回タップでオーディオ権限を“解錠”
async function unlockAudio() {
  if (unlocked) return;
  try {
    await silence.play(); // 無音を再生
    silence.pause(); silence.currentTime = 0;

    // デコードを早める（鳴らしてすぐ止める）
    await alarm.play();
    alarm.pause(); alarm.currentTime = 0;

    unlocked = true;
    console.log('audio unlocked');
  } catch (e) {
    console.warn('unlock failed, try again on next tap', e);
  }
}

// iOS/Android両対応のユーザー操作フック
document.addEventListener('pointerdown', unlockAudio, { passive: true });

// タイマー制御
function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; }
  alarm.pause(); alarm.currentTime = 0;
}

function startTimer(sec = 12) {
  stopTimer();
  endAt = Date.now() + sec * 1000;
  updateDisplay();
  timerId = setInterval(updateDisplay, 200);
}

function updateDisplay() {
  const ms = Math.max(0, endAt - Date.now());
  const s = Math.ceil(ms / 1000);
  countdownEl.textContent = `0:${String(s).padStart(2,'0')}`;
  if (ms <= 0) {
    clearInterval(timerId); timerId = null;
    alarm.play().catch(e => console.error('play error:', e));
    if (navigator.vibrate) navigator.vibrate(200);
  }
}

button.addEventListener('click', async () => {
  await unlockAudio();
  if (timerId) {
    stopTimer();
    countdownEl.textContent = '0:12';
  } else {
    startTimer(12);
  }
});