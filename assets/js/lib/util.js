// Small helpers shared by every page script.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const text = (sel) => $(sel)?.textContent.trim() ?? '';

export function el(tag, cls, content) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (content != null) n.textContent = content;
  return n;
}

// localStorage can be missing or throw (private windows, blocked storage); callers always get a value back.
export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('dp-' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem('dp-' + key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};

// Live view of prefers-reduced-motion.
export const motion = { reduced: false };
const mq = matchMedia('(prefers-reduced-motion: reduce)');
motion.reduced = mq.matches;
mq.addEventListener?.('change', (e) => { motion.reduced = e.matches; });
