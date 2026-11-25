// audio.js — every sound in the game is synthesised with WebAudio.
// No audio files are shipped, so the game loads nothing over the network.
// The synth starts on the first user gesture, as browsers require.
let ctx = null;
let muted = false;

function ensureContext() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() {
  ensureContext();
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = 0) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain = 0.08, when = 0, lowpass = 1200) {
  if (muted) return;
  const ac = ensureContext();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  pickup() { tone(520, 0.09, 'triangle', 0.1); },
  drop() { tone(340, 0.08, 'triangle', 0.09); },
  chop() { noiseBurst(0.07, 0.14, 0, 2500); tone(180, 0.05, 'square', 0.05); },
  chopped() { tone(660, 0.1, 'triangle', 0.1); tone(880, 0.14, 'triangle', 0.1, 0.09); },
  sizzle() { noiseBurst(0.35, 0.05, 0, 5000); },
  grilled() { tone(740, 0.12, 'sine', 0.1); tone(988, 0.16, 'sine', 0.1, 0.1); },
  plated() { tone(440, 0.08, 'triangle', 0.09); tone(587, 0.12, 'triangle', 0.09, 0.07); },
  served() { tone(523, 0.12, 'sine', 0.11); tone(659, 0.12, 'sine', 0.11, 0.1); tone(784, 0.22, 'sine', 0.11, 0.2); },
  wrong() { tone(220, 0.18, 'sawtooth', 0.07, 0, 160); },
  expired() { tone(330, 0.25, 'sawtooth', 0.08, 0, 180); tone(220, 0.3, 'sawtooth', 0.07, 0.18, 140); },
  tick() { tone(980, 0.05, 'square', 0.045); },
  start() { tone(392, 0.12, 'triangle', 0.1); tone(523, 0.12, 'triangle', 0.1, 0.1); tone(659, 0.2, 'triangle', 0.1, 0.2); },
  gameover() { tone(523, 0.18, 'triangle', 0.1); tone(440, 0.18, 'triangle', 0.1, 0.16); tone(330, 0.34, 'triangle', 0.1, 0.32); },
};
