const sounds = {};
let enabled = true;

export function setSoundEnabled(v) {
  enabled = !!v;
}

export function playSound(name, volume = 0.5) {
  if (!enabled) return;

  try {
    if (!sounds[name]) {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.preload = "auto";
      sounds[name] = audio;
    }

    const a = sounds[name].cloneNode();
    a.volume = volume;
    a.play().catch(() => {});
  } catch {
    // silent fail by design
  }
}
