// Everything behind the scenes: sky (a day that passes as you walk), parallax hills, palms, ground.
import { clamp, motion } from '../lib/util.js';
import { world } from './state.js';
import { R, disc, alpha, hash, mix } from './gfx.js';

// Sky colours at points along the world; the camera centre interpolates between them.
// stars: 0..1 night amount. sun: height above the horizon (negative means set).
const SKY = [
  { x: 0, top: '#2b1e4a', bot: '#f08a5d', stars: 0.3, sun: 0.15 }, // dusk on the backwaters
  { x: 650, top: '#0b0d24', bot: '#2a2b5c', stars: 1, sun: -1 }, // night gaming
  { x: 1150, top: '#3a5ba0', bot: '#f7c59f', stars: 0.1, sun: 0.2 }, // dawn at college
  { x: 1700, top: '#4f9fe0', bot: '#c4e6f5', stars: 0, sun: 0.6 },
  { x: 2450, top: '#3d8fd6', bot: '#a8daf0', stars: 0, sun: 0.85 },
  { x: 2880, top: '#3a2a5a', bot: '#b0505a', stars: 0.25, sun: 0.3 }, // the boss
  { x: 3180, top: '#5a9ad0', bot: '#f2d49b', stars: 0, sun: 0.7 }, // desert
  { x: 3480, top: '#5b4a8a', bot: '#e89a6a', stars: 0.1, sun: 0.35 },
  { x: 4100, top: '#2d2457', bot: '#e3735e', stars: 0.3, sun: 0.12 },
  { x: 4650, top: '#100d26', bot: '#36284e', stars: 1, sun: -1 }, // bonfire night
];

export function skyAt(x) {
  let i = 0;
  while (i < SKY.length - 2 && SKY[i + 1].x < x) i++;
  const a = SKY[i], b = SKY[i + 1];
  const t = clamp((x - a.x) / (b.x - a.x), 0, 1);
  return {
    top: mix(a.top, b.top, t),
    bot: mix(a.bot, b.bot, t),
    stars: a.stars + (b.stars - a.stars) * t,
    sun: a.sun + (b.sun - a.sun) * t,
  };
}

const STARS = Array.from({ length: 80 }, (_, i) => [hash(i * 3 + 1), hash(i * 3 + 2), hash(i * 3 + 3)]);

export function drawSky() {
  const { W, GY, cam, T, sky } = world;
  const bands = 14;
  for (let i = 0; i < bands; i++) {
    const y0 = Math.floor((GY * i) / bands), y1 = Math.floor((GY * (i + 1)) / bands);
    R(0, y0, W, y1 - y0, mix(sky.top, sky.bot, i / (bands - 1)));
  }
  if (sky.stars > 0.02) {
    for (const [a, b, c] of STARS) {
      const x = (((a * 2000 - cam * 0.03) % W) + W) % W;
      const y = b * (GY - 50);
      alpha(sky.stars * (0.5 + 0.5 * Math.sin(T * 2 + c * 20)) * (1 - y / GY), () => R(x, y, 1, 1, c > 0.85 ? '#ffd9a0' : '#ffffff'));
    }
  }
  if (sky.sun > -0.3) {
    const y = GY - 18 - sky.sun * (GY - 70);
    alpha(0.25, () => disc(W * 0.78, y, 13, '#ffe7a8'));
    disc(W * 0.78, y, 9, sky.sun > 0.4 ? '#fff1c1' : '#ffc46b');
  }
  if (sky.stars > 0.5) {
    alpha(clamp((sky.stars - 0.5) * 2, 0, 1), () => {
      disc(W * 0.82, 34, 7, '#f4f1de');
      disc(W * 0.82 + 3, 32, 6, sky.top);
    });
  }
}

export function drawHills() {
  const { W, GY, cam, sky } = world;
  const far = mix(sky.bot, '#262640', 0.45), near = mix(sky.bot, '#1a1f2e', 0.62);
  for (let x = 0; x < W; x++) {
    const u = cam * 0.2 + x;
    const h = 38 + 14 * Math.sin(u * 0.011) + 9 * Math.sin(u * 0.027 + 2) + 4 * Math.sin(u * 0.07);
    R(x, GY - h, 1, h, far);
  }
  for (let x = 0; x < W; x++) {
    const u = cam * 0.4 + x;
    const h = 20 + 8 * Math.sin(u * 0.019 + 1) + 5 * Math.sin(u * 0.05) + 2 * Math.sin(u * 0.13);
    R(x, GY - h, 1, h, near);
  }
}

function palm(x, base, h, c) {
  const { T } = world;
  let tx = x;
  const ty = base - h;
  for (let k = 0; k < h; k++) {
    tx = x + Math.round(Math.sin((k / h) * 1.3) * 5);
    R(tx, base - k, 2, 1, c);
  }
  const sway = motion.reduced ? 0 : Math.round(Math.sin(T * 1.2 + x * 0.05));
  for (const dir of [-1, 1]) {
    for (let j = 0; j < 13; j++) R(tx + dir * j, ty + Math.floor((j * j) / 16) + (j > 8 ? sway : 0), 2, 1, c);
    for (let j = 0; j < 9; j++) R(tx + dir * j, ty - 3 + Math.floor((j * j) / 7), 2, 1, c);
  }
  R(tx - 1, ty - 1, 4, 3, c);
}

function bush(x, base, c) {
  disc(x, base - 4, 6, c);
  disc(x + 7, base - 3, 5, c);
}

// Mid layer: the backwater with a houseboat near the start, then palms and bushes.
export function drawMidground() {
  const { W, GY, cam, T, sky } = world;
  const off = cam * 0.6;
  const col = mix(sky.bot, '#10141c', 0.72);
  if (off < 560) {
    const water = mix(sky.bot, '#1d3557', 0.5), shine = mix(sky.bot, '#ffffff', 0.35);
    for (let x = 0; x < W; x++) {
      const u = off + x;
      if (u > 520) break;
      R(x, GY - 7, 1, 7, water);
      if (hash((u | 0) * 7 + ((T * 3) | 0)) > 0.93) R(x, GY - 5 + ((u | 0) % 3), 2, 1, shine);
    }
    // Kettuvallam (Kerala houseboat)
    const bx = 250 - off + (motion.reduced ? 0 : Math.sin(T * 0.6) * 2), by = GY - 6;
    R(bx, by, 50, 3, '#4a2c1a');
    R(bx + 2, by + 3, 46, 1, '#3a2214');
    R(bx - 2, by - 1, 4, 2, '#4a2c1a');
    R(bx + 48, by - 1, 4, 2, '#4a2c1a');
    R(bx + 8, by - 8, 36, 8, '#c9a46b');
    R(bx + 10, by - 9, 32, 1, '#c9a46b');
    for (let k = 0; k < 6; k++) R(bx + 10 + k * 6, by - 8, 1, 8, '#9c7a45');
    R(bx + 14, by - 4, 24, 3, '#2b1d14');
  }
  const i0 = Math.floor((off - 60) / 70), i1 = Math.ceil((off + W + 60) / 70);
  for (let i = i0; i <= i1; i++) {
    const u = i * 70 + hash(i) * 34;
    const x = u - off;
    if (hash(i + 7) < 0.7) palm(x, GY - (u < 520 ? 7 : 0), 26 + hash(i + 99) * 18, col);
    else bush(x, GY, col);
  }
}

const GROUND = {
  grass: ['#5a9e4b', '#7cc461', '#7a4e2d', '#5e3b22'],
  sand: ['#e2c48a', '#f0d9a8', '#c9a56a', '#b08b4f'],
  rock: ['#6c6a7a', '#8a889a', '#4a4656', '#3a3644'],
};
function biome(wx) {
  if (wx > 3040 && wx < 3330) return 'sand';
  if (wx > 3370 && wx < 3540) return 'rock';
  return 'grass';
}

export function drawGround() {
  const { W, H, GY, cam, sky } = world;
  const dim = sky.stars * 0.45;
  for (let i = Math.floor(cam / 8); i * 8 < cam + W + 8; i++) {
    const wx = i * 8, x = wx - cam;
    const [top, hi, dirt, speck] = GROUND[biome(wx)].map((c) => mix(c, '#101020', dim));
    R(x, GY, 8, 3, top);
    R(x, GY + 3, 8, H - GY - 3, dirt);
    if (hash(i) > 0.5) R(x + ((hash(i + 1) * 7) | 0), GY - 1, 1, 1, hi);
    R(x + ((hash(i + 2) * 7) | 0), GY + 6 + ((hash(i + 3) * 12) | 0), 2, 1, speck);
    R(x + ((hash(i + 4) * 7) | 0), GY + 14 + ((hash(i + 5) * 14) | 0), 1, 1, speck);
  }
}

// Darkens the whole frame at night; lights drawn afterwards stay bright.
export function drawNightTint() {
  const { W, H, sky } = world;
  if (sky.stars > 0.05) alpha(sky.stars * 0.28, () => R(0, 0, W, H, '#0a0a28'));
}
