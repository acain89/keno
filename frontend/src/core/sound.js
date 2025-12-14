const sounds = {};

export function playSound(name, volume = 0.6) {
  try {
    if (!sounds[name]) {
      sounds[name] = new Audio(`/sounds/${name}.mp3`);
    }

    const s = sounds[name];
    s.currentTime = 0;
    s.volume = volume;
    s.play();
  } catch {
    // fail silently (important for autoplay restrictions)
  }
}
