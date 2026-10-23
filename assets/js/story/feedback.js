// Toast messages and chiptune sound effects (WebAudio, off by default).
import { $, el, store } from '../lib/util.js';

let toastTimer = 0;
export function toast(msg, link) {
  const t = $('#toast');
  t.replaceChildren(msg);
  if (link) {
    const a = el('a', null, link[0]);
    a.href = link[1];
    t.append(' ', a);
  }
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), link ? 7000 : 2600);
}

// Each effect is a list of [frequency Hz, duration s] square-wave notes.
const SFX = {
  blip: [[660, 0.05]],
  talk: [[520, 0.04], [700, 0.05]],
  hit: [[220, 0.06], [150, 0.09]],
  miss: [[140, 0.14]],
  ach: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.14]],
};

let ac = null;
let soundOn = store.get('sound', false);

export function sfx(kind) {
  if (!soundOn) return;
  try { ac ??= new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  let t = ac.currentTime;
  for (const [f, d] of SFX[kind] || []) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'square';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + d);
    t += d;
  }
}

export function initSound(button) {
  const paint = () => {
    button.textContent = soundOn ? '♪ On' : '♪ Off';
    button.setAttribute('aria-pressed', String(soundOn));
  };
  paint();
  button.addEventListener('click', () => {
    soundOn = !soundOn;
    store.set('sound', soundOn);
    paint();
    sfx('ach');
  });
}
