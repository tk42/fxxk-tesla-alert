let timerId = null;
let endAt = 0;

const countdownEl = document.getElementById('countdown');
const button = document.getElementById('timerButton');

// ---- Web Audio 準備 ----
let ctx = null;
let alarmBuffer = null;
let unlocking = false;

async function unlockAndPreload() {
  if (alarmBuffer || unlocking) return;
  unlocking = true;

  try {
    // 1) ユーザー操作内でAudioContextを必ずresume
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state !== 'running') await ctx.resume();

    // 2) 音源をfetch→decode（同一オリジンの alarm.mp3 前提）
    const res = await fetch('alarm.mp3', { cache: 'reload' });
    if (!res.ok) throw new Error('failed to fetch alarm.mp3');
    const arr = await res.arrayBuffer();

    // 3) デコード（ここまで全てユーザー操作直後に行う）
    alarmBuffer = await ctx.decodeAudioData(arr);
    // ここまで来れば“解錠済み”
  } catch (e) {
    console.warn('Audio unlock/preload failed:', e);
  } finally {
    unlocking = false;
  }
}

// iOS/Android 両対応：あらゆる最初のジェスチャで解錠
const unlockEvents = ['pointerdown', 'touchstart', 'click'];
unlockEvents.forEach(evt => {
  document.addEventListener(evt, () => {
    unlockAndPreload(); // 失敗しても次のタップで再試行
  }, { passive: true, once: false });
});

// ---- 再生 ----
function playAlarm() {
  if (!ctx || !alarmBuffer) {
    // 念のため再開＆再プリロードを試す
    unlockAndPreload();
    return;
  }
  if (ctx.state !== 'running') {
    // バックグラウンド復帰直後など
    ctx.resume().catch(()=>{});
  }
  const src = ctx.createBufferSource();
  src.buffer = alarmBuffer;
  src.connect(ctx.destination);
  src.start();
}

// ---- タイマー ----
function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
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
  countdownEl.textContent = `0:${String(s).padStart(2, '0')}`;
  if (ms <= 0) {
    clearInterval(timerId);
    timerId = null;
    playAlarm();
    if (navigator.vibrate) navigator.vibrate(200);
  }
}

// ボタン：トグル開始/停止（クリック自体が解錠イベント）
button.addEventListener('click', async () => {
  await unlockAndPreload();
  if (timerId) {
    stopTimer();
    countdownEl.textContent = '0:12';
  } else {
    startTimer(12);
  }
});

// ページ復帰でズレを補正
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timerId) updateDisplay();
});