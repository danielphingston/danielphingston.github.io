// Pixel drawing primitives on the story canvas. All coordinates are logical pixels.
import { clamp, motion } from '../lib/util.js';
import { OL } from './config.js';
import { world } from './state.js';

export let ctx = null;
export function setContext(c) { ctx = c; }

/* ---------- Shapes ---------- */

export function R(x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// Filled rectangle with a 1px outline.
export function box(x, y, w, h, c) {
  R(x - 1, y - 1, w + 2, h + 2, OL);
  R(x, y, w, h, c);
}

export function disc(cx, cy, r, c) {
  ctx.fillStyle = c;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.8));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

// Stepped roof: `rows` rows, each 2px narrower than the one below. (x, y) is its bottom-left.
export function roof(x, y, w, rows, c1, c2) {
  for (let i = 0; i < rows; i++) R(x + i, y - i, w - 2 * i, 1, i % 3 ? c1 : c2);
}

export function alpha(a, fn) {
  ctx.globalAlpha = a;
  fn();
  ctx.globalAlpha = 1;
}

/* ---------- Colour and noise ---------- */

// Deterministic 0..1 noise, so scenery stays put between frames.
export function hash(n) {
  n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

/* ---------- World helpers ---------- */

// Is the world-space range [x0, x1] on screen?
export const visible = (x0, x1) => x1 - world.cam > -20 && x0 - world.cam < world.W + 20;
export const isNight = () => world.sky.stars > 0.45;
export const windowColor = () => (isNight() ? '#ffd36e' : '#9fd3f0');
// Time for ambient animation; frozen when the visitor prefers reduced motion.
export const anim = () => (motion.reduced ? 0 : world.T);
export const blinkOn = (hz) => Math.floor(world.T * hz) % 2 === 0;

/* ---------- 3×5 pixel font, for signs ---------- */

const GLYPHS = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100110101010', 7: '111001010010010', 8: '010101010101010',
  9: '010101011001110', '-': '000000111000000', '.': '000000000000010', '!': '010010010000010', '/': '001001010100100',
  "'": '010010000000000', ':': '000010000010000', '+': '000010111010000', '?': '110001010000010', '&': '010101010101011',
  '>': '100010001010100', '<': '001010100010001', ' ': '000000000000000',
};

export const textWidth = (s) => s.length * 4 - 1;

export function pixelText(s, x, y, c) {
  ctx.fillStyle = c;
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of s.toUpperCase()) {
    const g = GLYPHS[ch];
    if (g) for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3), cy + ((i / 3) | 0), 1, 1);
    cx += 4;
  }
}

// A signboard centred on cx.
export function sign(s, cx, y, bg = OL, fg = '#f2cc8f') {
  const w = textWidth(s) + 6;
  box(cx - w / 2, y, w, 9, bg);
  pixelText(s, cx - w / 2 + 3, y + 2, fg);
}

/* ---------- Particles (x in world space, y relative to the ground line) ---------- */

const parts = [];

export function emit(x, y, vx, vy, life, c, size = 1) {
  if (parts.length < 260) parts.push({ x, y, vx, vy, life, max: life, c, size });
}

// True on average `rate` times per second.
export const chance = (rate) => !motion.reduced && Math.random() < world.DT * rate;

export function stepParticles() {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= world.DT;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * world.DT;
    p.y += p.vy * world.DT;
  }
}

export function drawParticles() {
  for (const p of parts) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    R(p.x - world.cam, world.GY + p.y, p.size, p.size, p.c);
  }
  ctx.globalAlpha = 1;
}

/* ---------- Lights: drawn after the night tint so they stay bright ---------- */

let lights = [];
export const queueLight = (fn) => lights.push(fn);
export function flushLights() {
  for (const fn of lights) fn();
  lights = [];
}
