const countdownEl = document.getElementById('countdown');
const button = document.getElementById('timerButton');

let ctx;
let alarmBuffer = null;
let timerId = null;
let endAt = 0;
let gainNode = null;

// 初回タップ時にAudioContextと音源を準備
async function initAudio() {
  if (alarmBuffer) return; // 既に準備済み
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  await ctx.resume(); // iOSのためresume

  const res = await fetch('alarm.mp3');
  if (!res.ok) throw new Error('alarm.mp3 not found');
  const arrayBuf = await res.arrayBuffer();
  alarmBuffer = await ctx.decodeAudioData(arrayBuf);
}

// アラーム再生
function playAlarm() {
  if (!ctx || !alarmBuffer) return;
  gainNode = ctx.createGain();
  gainNode.gain.value = 1;

  const src = ctx.createBufferSource();
  src.buffer = alarmBuffer;
  src.connect(gainNode).connect(ctx.destination);
  src.start();

  // 再生停止用に保持
  gainNode.src = src;
}

// アラーム停止（フェードアウト）
function stopAlarm() {
  if (gainNode) {
    try {
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      if (gainNode.src) {
        gainNode.src.stop(ctx.currentTime + 0.25);
      }
    } catch {}
    gainNode = null;
  }
}

// タイマー開始
function startTimer(sec = 12) {
  clearInterval(timerId);
  stopAlarm(); // 鳴っていたら止める

  endAt = Date.now() + sec * 1000;
  updateDisplay();

  timerId = setInterval(() => {
    updateDisplay();
  }, 200);
}

// タイマー表示更新
function updateDisplay() {
  const ms = Math.max(0, endAt - Date.now());
  const s = Math.ceil(ms / 1000);
  countdownEl.textContent = `0:${String(s).padStart(2, '0')}`;

  if (ms <= 0) {
    clearInterval(timerId);
    timerId = null;
    playAlarm();
    if (navigator.vibrate) navigator.vibrate(200);
  }
}

// ボタンイベント
button.addEventListener('click', async () => {
  await initAudio();
  startTimer(12); // カウント中でも即リセット＆再スタート
});