let timerId = null;
let endAt = 0;
const countdownEl = document.getElementById('countdown');
const button = document.getElementById('timerButton');

let ctx, alarmBuffer, alarmBytes, booting=false, needReinit=false;

async function fetchOnce(path='alarm.mp3') {
  if (alarmBytes) return;
  const res = await fetch(path, { cache: 'reload' });
  if (!res.ok) throw new Error('fetch failed: ' + path);
  alarmBytes = await res.arrayBuffer();
}

async function ensureContext() {
  if (!ctx || ctx.state === 'closed' || needReinit) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    alarmBuffer = null;
    needReinit = false;
  }
  if (ctx.state !== 'running') { try { await ctx.resume(); } catch {} }
  return ctx.state === 'running';
}

async function ensureDecoded() {
  if (alarmBuffer) return;
  if (!alarmBytes) await fetchOnce();
  // iOS対策：毎Contextでデコードし直す
  alarmBuffer = await ctx.decodeAudioData(alarmBytes.slice(0));
}

async function bootAudio() {
  if (booting) return;
  booting = true;
  try {
    const ok = await ensureContext();
    if (!ok) throw new Error('ctx not running');
    await ensureDecoded();
  } finally {
    booting = false;
  }
}

function playOscFallback() { // MP3失敗時の最終手段
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = 880;
  g.gain.value = 0.1;
  o.connect(g).connect(ctx.destination);
  o.start();
  setTimeout(() => o.stop(), 500);
}

async function playAlarm() {
  try {
    await bootAudio();
    if (ctx.state !== 'running') await ctx.resume();
    if (alarmBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = alarmBuffer;
      src.connect(ctx.destination);
      src.start();
    } else {
      playOscFallback();
    }
  } catch (e) {
    console.warn('play failed, retrying...', e);
    needReinit = true;
    try {
      await bootAudio();
      const src = ctx.createBufferSource();
      src.buffer = alarmBuffer;
      src.connect(ctx.destination);
      src.start();
    } catch {
      playOscFallback();
    }
  }
}

// ===== timer =====
function stopTimer() { if (timerId){ clearInterval(timerId); timerId=null; } }
function startTimer(sec=12){
  stopTimer();
  endAt = Date.now() + sec*1000;
  updateDisplay();
  timerId = setInterval(updateDisplay, 200);
}
function updateDisplay(){
  const ms = Math.max(0, endAt - Date.now());
  const s  = Math.ceil(ms/1000);
  countdownEl.textContent = `0:${String(s).padStart(2,'0')}`;
  if (ms<=0){
    clearInterval(timerId); timerId=null;
    playAlarm();
    if (navigator.vibrate) navigator.vibrate(200);
  }
}

['pointerdown','touchstart','click'].forEach(evt=>{
  document.addEventListener(evt, () => { bootAudio(); }, { passive:true });
});

button.addEventListener('click', async ()=>{
  await bootAudio();
  if (timerId){ stopTimer(); countdownEl.textContent='0:12'; }
  else { startTimer(12); }
});

document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState === 'visible' && timerId) updateDisplay();
  if (document.visibilityState === 'hidden') needReinit = true;
});
window.addEventListener('pagehide', ()=>{ needReinit = true; });
window.addEventListener('freeze',   ()=>{ needReinit = true; });