// src/core/sound.js

// 🔒 DEFAULT: sounds OFF until explicitly enabled
let enabled = false;
let unlocked = false;

// WebAudio context (single)
let audioCtx = null;

// Decoded audio buffers (cached)
const buffers = Object.create(null);

// simple rate-limiters (prevents spam)
const lastPlay = Object.create(null);
const MIN_INTERVAL = {
  ball: 0,
  hit: 80,
  count: 40,
  win: 0,
  bigWin: 0,
};

function now() {
  return performance.now();
}

/* ======================================================
   AUDIO CONTEXT
====================================================== */

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function unlockAudio() {
  if (unlocked) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    unlocked = true;
  } catch {
    // ignore
  }
}

/* ======================================================
   PUBLIC API
====================================================== */

// Call ONCE after user gesture (login, first spin, etc)
export function setSoundEnabled(v) {
  enabled = !!v;
  if (enabled) unlockAudio();
}

/* ======================================================
   BUFFER LOADING
====================================================== */

async function loadBuffer(name) {
  if (buffers[name]) return buffers[name];

  const res = await fetch(`/sounds/${name}.mp3`);
  const array = await res.arrayBuffer();
  const ctx = getCtx();
  const buffer = await ctx.decodeAudioData(array);

  buffers[name] = buffer;
  return buffer;
}

/* ======================================================
   PLAY SOUND (WEB AUDIO)
====================================================== */

export async function playSound(name, volume = 0.5) {
  if (!enabled || !unlocked || !name) return;

  const t = now();
  const last = lastPlay[name] || 0;
  const minGap = MIN_INTERVAL[name] ?? 0;

  if (t - last < minGap) return;
  lastPlay[name] = t;

  try {
    const ctx = getCtx();
    const buffer = await loadBuffer(name);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // 🔊 REAL amplification (this is what HTMLAudio cannot do)
    const gain = ctx.createGain();

    const gainValue =
      name === "ball"
        ? volume * 3.5 // 🔥 punchy UI thunk
        : volume;

    gain.gain.setValueAtTime(gainValue, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    // ⏱ short, controlled duration for UI sounds
    if (name === "ball") {
      source.stop(ctx.currentTime + 0.22); // ~220 ms
    }
  } catch {
    // silent by design
  }
}
