let timerId = null;
let endAt = 0;

const countdownEl = document.getElementById('countdown');
const button = document.getElementById('timerButton');

let ctx = null;
let alarmBuffer = null;
let alarmBytes = null;   // ArrayBufferを保持
let booting = false;
let needReinit = false;

async function fetchOnce() {
  if (alarmBytes) return;
  const res = await fetch('alarm.mp3'); // GitHub Pagesなら相対パスでOK（index.htmlと同階層）
  if (!res.ok) throw new Error('fetch alarm.mp3 failed');
  alarmBytes = await res.arrayBuffer();
}

// コンテキストを必ず“生きた状態”に
async function ensureContext() {
  if (!ctx || ctx.state === 'closed' || needReinit) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    alarmBuffer = null; // 別Contextなので作り直す
    needReinit = false;
  }
  if (ctx.state !== 'running') {
    try { await ctx.resume(); } catch {}
  }
  return ctx.state === 'running';
}

// デコード（既に済ならスキップ）
async function ensureDecoded() {
  if (alarmBuffer) return;
  if (!alarmBytes) await fetchOnce();
  // iOS対策：decodeAudioDataはContextごとにやり直すのが安全
  alarmBuffer = await ctx.decodeAudioData(alarmBytes.slice(0)); // sliceでコピー渡し
}

// 初回タップや再生前に呼ぶ
async function bootAudioPipeline() {
  if (booting) return;
  booting = true;
  try {
    const ok = await ensureContext();
    if (!ok) throw new Error('AudioContext not running');
    await ensureDecoded();
  } finally {
    booting = false;
  }
}

async function playAlarm() {
  try {
    await bootAudioPipeline();
    // 念のため直前にもresume
    if (ctx.state !== 'running') await ctx.resume();
    const src = ctx.createBufferSource();
    src.buffer = alarmBuffer;
    src.connect(ctx.destination);
    src.start();
  } catch (e) {
    console.warn('play failed, retrying once...', e);
    // 失敗時は再初期化してもう一度だけ試す
    needReinit = true;
    try {
      await bootAudioPipeline();
      const src = ctx.createBufferSource();
      src.buffer = alarmBuffer;
      src.connect(ctx.destination);
      src.start();
    } catch (e2) {
      console.error('play retry failed:', e2);
    }
  }
}

// ===== タイマー =====
function stopTimer() {
  if (timerId) { clearInterval(timerId); timerId = null; }
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
    clearInterval(timerId); timerId = null;
    playAlarm();
    if (navigator.vibrate) navigator.vibrate(200);
  }
}

// 任意のジェスチャでパイプライン起動（解錠）
['pointerdown','touchstart','click'].forEach(evt => {
  document.addEventListener(evt, () => { bootAudioPipeline(); }, { passive:true });
});

// ボタン
button.addEventListener('click', async () => {
  await bootAudioPipeline();
  if (timerId) {
    stopTimer();
    countdownEl.textContent = '0:12';
  } else {
    startTimer(12);
  }
});

// タブ復帰・ページ遷移で再初期化を促す
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timerId) updateDisplay();
  if (document.visibilityState === 'hidden') needReinit = true;
});
window.addEventListener('pagehide', () => { needReinit = true; });
window.addEventListener('freeze', () => { needReinit = true; });