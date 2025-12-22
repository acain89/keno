const sounds = Object.create(null);

// 🔒 DEFAULT: sounds OFF until explicitly enabled
let enabled = false;
let unlocked = false;

// Safari / Chrome autoplay compliance
let audioCtx = null;

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

function unlockAudio() {
  if (unlocked) return;
  try {
    audioCtx =
      audioCtx ||
      new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    unlocked = true;
  } catch {
    // ignore
  }
}

// Call ONCE after user gesture (login, spin, etc)
export function setSoundEnabled(v) {
  enabled = !!v;
  if (enabled) unlockAudio();
}

export function playSound(name, volume = 0.5) {
  if (!enabled || !unlocked || !name) return;

  const t = now();
  const last = lastPlay[name] || 0;
  const minGap = MIN_INTERVAL[name] ?? 0;

  if (t - last < minGap) return;
  lastPlay[name] = t;

  try {
    let base = sounds[name];

    // Lazy-load
    if (!base) {
      base = new Audio(`/sounds/${name}.mp3`);
      base.preload = "auto";
      sounds[name] = base;
    }

    const a = base.cloneNode(true);
    a.volume = Math.max(0, Math.min(1, volume));
    a.play().catch(() => {});
  } catch {
    // silent by design
  }
}
