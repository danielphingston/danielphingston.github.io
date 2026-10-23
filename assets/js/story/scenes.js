// The places in the world. Each scene draws itself in world coordinates (subtract world.cam for screen x).
// To add a place: write a draw function and add it to SCENES with the world range it covers.
// Its dialog lives in content.js.
import { motion, clamp } from '../lib/util.js';
import { OL } from './config.js';
import { world, game } from './state.js';
import { shops } from './shops.js';
import {
  R, box, disc, roof, alpha, hash, mix, visible, isNight, windowColor, anim, blinkOn,
  pixelText, textWidth, sign, emit, chance, queueLight,
} from './gfx.js';

function startPost() {
  const { GY, cam } = world;
  const x = 230 - cam;
  R(x, GY - 16, 2, 16, '#5a3a22');
  sign('START >', x + 1, GY - 22, '#8d5a3b', '#f4f1de');
}

/* ---------- Level 1: the spark (Little Fighters 2) ---------- */

function tinyFighter(x, y, c, dir, punch) {
  R(x, y - 8, 2, 2, '#f1c27d');
  R(x, y - 6, 2, 3, c);
  R(x, y - 3, 1, 3, '#2b2b44');
  R(x + 1, y - 3, 1, 3, '#2b2b44');
  if (punch) R(dir > 0 ? x + 2 : x - 3, y - 6, 3, 1, '#f1c27d');
  else R(dir > 0 ? x + 2 : x - 1, y - 5, 1, 2, '#f1c27d');
}

function spark() {
  const { GY, cam } = world;
  const b = 500 - cam;
  box(b, GY - 50, 96, 50, '#c2734f');
  roof(b - 6, GY - 51, 108, 14, '#8c3b2a', '#6e2c1f');
  // Window into the room: a CRT running a two-player brawl.
  box(b + 10, GY - 44, 48, 32, '#1a1a2a');
  box(b + 16, GY - 40, 32, 22, '#d8d0b8');
  R(b + 18, GY - 38, 28, 17, '#16324f');
  R(b + 18, GY - 24, 28, 3, '#3b5d2e');
  const t = anim();
  const swing = Math.floor(t * 2) % 2 === 0;
  tinyFighter(b + 23, GY - 24, '#3d6fb6', 1, swing);
  tinyFighter(b + 39, GY - 24, '#e63946', -1, !swing);
  const p = (t * 0.8) % 1;
  R(b + 26 + p * 11, GY - 30, 2, 2, p < 0.5 ? '#9ff0ff' : '#ffd36e');
  R(b + 28, GY - 16, 8, 3, '#d8d0b8');
  R(b + 12, GY - 13, 44, 2, '#5a3a22');
  box(b + 70, GY - 32, 16, 32, '#5a3a22');
  R(b + 82, GY - 17, 2, 2, '#f2cc8f');
  // Shelf of favourite games
  const s = b + 112;
  box(s, GY - 12, 50, 12, '#8d5a3b');
  [['DS', '#2b2b2b', '#f08a3c'], ['POP', '#d9a441', '#5a2a1a'], ['D2', '#a8322d', '#f4f1de']].forEach(([label, bg, fg], i) => {
    const gx = s + 2 + i * 16;
    box(gx, GY - 31, 14, 18, bg);
    pixelText(label, gx + 7 - textWidth(label) / 2, GY - 25, fg);
  });
  sign('LF2', b + 34, GY - 63);
}

/* ---------- Level 2: college ---------- */

function school() {
  const { GY, cam } = world;
  const b = 905 - cam;
  box(b, GY - 48, 200, 48, '#e8dcc0');
  R(b - 3, GY - 51, 206, 3, '#b5a27e');
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 10; c++) {
      if (c === 4 || c === 5) continue;
      R(b + 8 + c * 19, GY - 42 + r * 18, 10, 11, windowColor());
      R(b + 8 + c * 19, GY - 37 + r * 18, 10, 1, '#b5a27e');
    }
  }
  box(b + 86, GY - 100, 28, 52, '#e8dcc0'); // clock tower
  roof(b + 82, GY - 101, 36, 12, '#3d5a80', '#2c4363');
  disc(b + 100, GY - 84, 6, '#f4f1de');
  R(b + 100, GY - 89, 1, 5, OL);
  R(b + 100, GY - 84, 4, 1, OL);
  R(b + 99, GY - 124, 1, 12, '#555');
  R(b + 100, GY - 124, 9, 3 + Math.round(Math.sin(anim() * 4)), '#e07a5f');
  box(b + 92, GY - 22, 16, 22, '#5a3a22');
  R(b + 84, GY - 3, 32, 3, '#b5a27e');
  sign('SCMS', b + 40, GY - 62, '#3d5a80', '#f4f1de');
  sign('2014-18', b + 160, GY - 62, '#3d5a80', '#f4f1de');
}

/* ---------- Level 3: Suyati lab and the GPT-2 robot ---------- */

function lab() {
  const { GY, cam } = world;
  const b = 1405 - cam;
  box(b, GY - 58, 150, 58, '#4a6fa5');
  R(b - 2, GY - 61, 154, 3, '#2b3d5c');
  R(b + 6, GY - 50, 138, 16, windowColor());
  for (let i = 0; i < 12; i++) R(b + 6 + i * 12, GY - 50, 1, 16, '#2b3d5c');
  if (!isNight()) for (let i = 0; i < 4; i++) R(b + 20 + i * 34, GY - 48 + (i % 2) * 3, 6, 1, '#e8f6ff');
  R(b + 6, GY - 28, 70, 14, windowColor());
  box(b + 104, GY - 26, 22, 26, '#2b2b44');
  R(b + 114, GY - 26, 1, 26, '#4a4a6a');
  sign('SUYATI LAB', b + 75, GY - 74, '#f2cc8f', OL);
  R(b + 126, GY - 70, 2, 9, '#555'); // dish
  disc(b + 127, GY - 72, 5, '#c5cad8');
  R(b + 127, GY - 80, 1, 3, blinkOn(2) ? '#ff5d5d' : '#802020');
  box(b + 18, GY - 74, 8, 13, '#6c757d'); // chimney with green bubbles
  if (chance(3)) emit(b + 20 + cam + Math.random() * 4, -76, (Math.random() - 0.5) * 4, -10 - Math.random() * 6, 2.2, '#7af0b0', 2);
  R(b + 82, GY - 20, 4, 6, '#9b5de5');
  R(b + 90, GY - 22, 4, 8, '#e07a5f');
  R(b + 98, GY - 19, 3, 5, '#81b29a');
}

function robot() {
  const { GY, cam, T } = world;
  const x = 1655 - cam;
  const bob = Math.round(Math.sin(anim() * 3));
  R(x - 4, GY - 5, 3, 5, '#6b6b80');
  R(x + 1, GY - 5, 3, 5, '#6b6b80');
  box(x - 6, GY - 15 + bob, 12, 10, '#9aa0b5');
  R(x - 3, GY - 12 + bob, 6, 4, '#12202e');
  R(x - 2, GY - 10 + bob, ((T * 6) | 0) % 5, 1, '#5cf2a0');
  box(x - 5, GY - 23 + bob, 10, 7, '#c5cad8');
  const blink = !motion.reduced && T % 3.1 < 0.15;
  R(x - 3, GY - 21 + bob, 2, blink ? 1 : 2, '#5cf2a0');
  R(x + 1, GY - 21 + bob, 2, blink ? 1 : 2, '#5cf2a0');
  R(x, GY - 27 + bob, 1, 4, '#555');
  R(x - 1, GY - 28 + bob, 3, 2, blinkOn(3) ? '#ff5d5d' : '#802020');
  if (!game.got.has('relic')) pixelText('?', x - 1, GY - 36 + bob, '#f4f1de');
  sign('2019', x + 22, GY - 20, '#6b6b80', '#f4f1de');
  R(x + 22, GY - 11, 1, 11, '#555');
}

/* ---------- Level 4: Gadgeon works (IoT, MQTT, Lambda) ---------- */

function radioTower(x, top) {
  const { GY } = world;
  for (let j = 0; j <= GY - top; j++) {
    const spread = (GY - top - j) / 8;
    R(x - spread, GY - j, 1, 1, '#4a4e69');
    R(x + spread, GY - j, 1, 1, '#4a4e69');
    if (j % 7 === 0) R(x - spread, GY - j, spread * 2 + 1, 1, '#4a4e69');
  }
  R(x - 1, top - 3, 3, 3, blinkOn(2) ? '#ff5d5d' : '#7a2020');
}

function factory() {
  const { GY, cam, T } = world;
  const b = 1960 - cam;
  radioTower(1915 - cam, GY - 52);
  radioTower(2165 - cam, GY - 52);
  box(b, GY - 44, 160, 44, '#8d99ae');
  for (let k = 0; k < 5; k++) { // sawtooth roof with north lights
    for (let j = 0; j < 11; j++) R(b + k * 32 + j * 3, GY - 45 - j, 32 - j * 3, 1, j % 3 ? '#5c677d' : '#4a5468');
    R(b + k * 32 + 29, GY - 56, 3, 11, windowColor());
  }
  for (let i = 0; i < 5; i++) R(b + 8 + i * 20, GY - 34, 12, 8, windowColor());
  box(b + 118, GY - 24, 28, 24, '#5c677d');
  for (let i = 0; i < 7; i++) R(b + 118 + i * 4, GY - 24, 2, 2, i % 2 ? '#f2cc8f' : OL);
  box(b + 20, GY - 80, 10, 36, '#6c757d');
  R(b + 20, GY - 76, 10, 2, '#e07a5f');
  if (chance(4)) emit(b + 25 + cam, -84, 4 + Math.random() * 3, -8 - Math.random() * 5, 3.5, '#c9ccd6', 2 + ((Math.random() * 2) | 0));
  sign('GADGEON', b + 60, GY - 18, OL, '#f2cc8f');
  // A Lambda cloud that sparks now and then
  const cx = 2060 - cam, cy = GY - 112;
  disc(cx - 10, cy, 7, '#eef2f7');
  disc(cx + 2, cy - 4, 9, '#eef2f7');
  disc(cx + 14, cy, 6, '#eef2f7');
  R(cx - 17, cy + 1, 37, 6, '#eef2f7');
  if (!motion.reduced && T % 3 < 0.18) {
    R(cx + 1, cy + 7, 2, 4, '#ffd36e');
    R(cx - 1, cy + 10, 2, 4, '#ffd36e');
    R(cx + 1, cy + 13, 2, 3, '#ffd36e');
  }
  // MQTT packets arcing between the towers and the cloud
  if (!motion.reduced) {
    const ends = [[1915 - cam, GY - 55], [2165 - cam, GY - 55]];
    for (let k = 0; k < 6; k++) {
      const p = (T * 0.35 + k / 6) % 1;
      const [ax, ay] = ends[k % 2];
      const up = k % 3 !== 0;
      const q = up ? p : 1 - p;
      R(ax + (cx - ax) * q, ay + (cy + 6 - ay) * q - Math.sin(q * Math.PI) * 18, 2, 2, up ? '#f2cc8f' : '#5cf2a0');
    }
  }
}

/* ---------- Level 5: Cambium citadel, the boss, the sands ---------- */

function castle() {
  const { GY, cam, T } = world;
  const b = 2470 - cam;
  const stone = '#7d8597', dark = '#5f6675';
  box(b, GY - 44, 220, 44, stone);
  for (let r = 0; r < 7; r++) {
    R(b, GY - 44 + r * 6, 220, 1, dark);
    for (let c = 0; c < 22; c++) R(b + c * 10 + (r % 2) * 5, GY - 44 + r * 6, 1, 6, dark);
  }
  for (let i = 0; i < 22; i++) R(b + i * 10, GY - 49, 6, 5, stone);
  // Three towers, three regions
  for (const [tx, tw, th, banner] of [[b + 6, 26, 78, '#3d5a80'], [b + 95, 30, 100, '#e07a5f'], [b + 188, 26, 78, '#81b29a']]) {
    box(tx, GY - th, tw, th, stone);
    for (let r = 0; r < th / 6; r++) R(tx, GY - th + r * 6, tw, 1, dark);
    roof(tx - 3, GY - th - 1, tw + 6, Math.ceil(tw / 2) + 2, banner, mix(banner, '#000000', 0.25));
    R(tx + tw / 2 - 1, GY - th + 10, 2, 7, OL);
    R(tx + 4, GY - th + 24, tw - 8, 18, banner);
    R(tx + tw / 2 - 1, GY - th + 28, 2, 8, '#f4f1de');
    if (!motion.reduced) {
      const cx = tx + tw / 2, cy = GY - th - Math.ceil(tw / 2) - 4;
      for (let k = 0; k < 2; k++) {
        const r = ((T * 12 + k * 10) % 20) + 4;
        alpha(1 - r / 24, () => {
          for (let a = -1; a <= 1; a += 0.25) R(cx + Math.sin(a) * r, cy - Math.cos(a) * r, 1, 1, '#f2cc8f');
        });
      }
    }
  }
  box(b + 98, GY - 28, 24, 28, '#3b2f2f'); // portcullis
  for (let i = 0; i < 5; i++) R(b + 100 + i * 5, GY - 28, 1, 28, '#6b5b4b');
  for (let i = 0; i < 4; i++) R(b + 98, GY - 24 + i * 6, 24, 1, '#6b5b4b');
  sign('CAMBIUM', b + 110, GY - 40, OL, '#f2cc8f');
}

function boss() {
  const { GY, cam, T, heroX } = world;
  const x = 2895 - cam;
  const shake = !motion.reduced && T - game.bossHit < 0.35 ? Math.round(Math.sin(T * 90) * 2) : 0;
  const cy = GY - 60 + Math.round(Math.sin(anim() * 1.5) * 3);
  alpha(0.3, () => R(x - 30, GY, 60, 2, OL));
  for (const [ex, label, iris] of [[x - 16 + shake, 'V4', '#e63946'], [x + 16 + shake, 'V6', '#3d6fb6']]) {
    if (game.bossDown) {
      R(ex - 8, cy, 17, 2, '#f4f1de');
      R(ex - 9, cy - 1, 2, 1, '#f4f1de');
      R(ex + 8, cy - 1, 2, 1, '#f4f1de');
      continue;
    }
    disc(ex, cy, 12, OL);
    disc(ex, cy, 11, '#f4f1de');
    R(ex - 8, cy - 3, 4, 1, '#e88a8a');
    R(ex + 5, cy + 4, 4, 1, '#e88a8a');
    R(ex - 6, cy + 6, 3, 1, '#e88a8a');
    // Pupils follow the hero.
    const lx = clamp((heroX - cam - ex) / 12, -4, 4), ly = clamp((GY - 12 - cy) / 20, -2, 3);
    disc(ex + lx, cy + ly, 5, iris);
    disc(ex + lx, cy + ly, 2, OL);
    R(ex + lx - 2, cy + ly - 3, 2, 2, '#ffffff');
    if (!motion.reduced && (T + (label === 'V6' ? 0.4 : 0)) % 3.2 < 0.12) disc(ex, cy, 11, '#b0505a');
    pixelText(label, ex - 3, cy + 16, '#f4f1de');
  }
  if (game.bossDown) {
    if (!motion.reduced) pixelText('Z', x + 22 + Math.sin(T * 2) * 2, cy - 14 - ((T * 6) % 10), '#f4f1de');
  } else if (chance(10)) {
    emit(x + cam - 30 + Math.random() * 60, -Math.random() * 6, (Math.random() - 0.5) * 6, -12 - Math.random() * 10, 1.4, '#9b5de5', 1);
  }
}

let sandFlow = 0;
function sands() {
  const { GY, cam, T, DT } = world;
  const b = 3130 - cam; // the hourglass sits just right of the stop
  box(b, GY - 60, 10, 60, '#e9c46a');
  box(b + 80, GY - 60, 10, 60, '#e9c46a');
  for (let k = 0; k < 10; k++) {
    R(b, GY - 60 + k * 6, 10, 1, '#d4a24c');
    R(b + 80, GY - 60 + k * 6, 10, 1, '#d4a24c');
  }
  box(b - 4, GY - 67, 98, 7, '#d4a24c');
  for (let r = 0; r < 18; r++) { // onion dome
    const w = Math.round(Math.sin(((r + 1) / 19) * Math.PI) * 16 + (r > 9 ? 0 : (9 - r) * 0.3));
    R(b + 45 - w, GY - 85 + r, w * 2, 1, r % 4 ? '#2a9d8f' : '#21867a');
  }
  R(b + 44, GY - 93, 2, 8, '#f2cc8f');
  // Hourglass: sand runs down, and runs back up while a rewind plays.
  const rewinding = T - game.rewindAt < 2.5;
  if (!motion.reduced) sandFlow += (rewinding ? -0.6 : 0.06) * DT;
  const p = ((sandFlow % 1) + 1) % 1;
  const hx = b + 45;
  box(hx - 8, GY - 14, 16, 14, '#b08b4f');
  R(hx - 9, GY - 40, 18, 2, '#5a3a22');
  R(hx - 9, GY - 17, 18, 2, '#5a3a22');
  for (let r = 0; r < 10; r++) {
    const w = 7 - Math.floor(r * 0.7);
    R(hx - w, GY - 38 + r, w * 2, 1, r < 10 * p ? '#cfe8ff' : '#e9c46a');
    R(hx - w, GY - 18 - r, w * 2, 1, r < 10 * p ? '#e9c46a' : '#cfe8ff');
  }
  if (!motion.reduced) R(hx, GY - 28, 1, 10, '#e9c46a');
  if (rewinding && chance(30)) emit(hx + cam + (Math.random() - 0.5) * 30, -20 - Math.random() * 30, (Math.random() - 0.5) * 20, -20, 0.8, '#f2cc8f', 1);
  sign('SANDS', hx, GY - 112, OL, '#f2cc8f');
}

/* ---------- Side quest: the bug bounty cave ---------- */

function cave() {
  const { GY, cam, T } = world;
  const c = 3472 - cam; // the cave mouth sits just right of the stop
  for (let j = 0; j < 52; j++) {
    const w = Math.round(128 * Math.sqrt(j / 52));
    R(c - w / 2, GY - 52 + j, w, 1, j % 5 ? '#5a5668' : '#4e4a5c');
  }
  for (let i = 0; i < 18; i++) R(c - 50 + hash(i) * 100, GY - 40 + hash(i + 50) * 38, 2, 1, '#77738a');
  for (let j = 0; j < 28; j++) {
    const w = Math.round(38 * Math.sqrt(j / 28));
    R(c - w / 2, GY - 28 + j, w, 1, '#0d0b14');
  }
  R(c - 40, GY - 8, 3, 8, '#9b5de5');
  R(c - 37, GY - 5, 2, 5, '#c39bff');
  R(c + 36, GY - 6, 3, 6, '#9b5de5');
  if (!game.bugCaught) {
    const by = GY - 6;
    R(c - 3, by - 3, 7, 4, '#4ade80');
    R(c - 2, by - 4, 5, 1, '#4ade80');
    R(c, by - 3, 1, 4, '#1f7a44');
    R(c + 4, by - 2, 2, 2, '#1f3d2a');
    const leg = Math.floor(T * 8) % 2;
    for (let k = 0; k < 3; k++) R(c - 2 + k * 2, by + 1, 1, 1 + ((k + leg) % 2), '#1f3d2a');
    if (!motion.reduced) {
      for (let k = 0; k < 3; k++) {
        const a = T * 2 + k * 2.1;
        if (Math.sin(a * 3) > 0.4) R(c + Math.cos(a) * 9, by - 4 + Math.sin(a) * 5, 1, 1, '#ffd36e');
      }
    }
  } else {
    sign('H1', c, GY - 42, '#f2cc8f', OL);
  }
  sign('BUG BOUNTY', c, GY - 66, OL, '#4ade80');
}

/* ---------- Level 6: Workshop Row ---------- */

function shop(s) {
  const { GY, cam } = world;
  const b = s.x - 42 - cam;
  const dark = mix(s.color, '#000000', 0.35);
  box(b, GY - 46, 84, 46, '#efe6d2');
  roof(b - 4, GY - 47, 92, 12, dark, mix(dark, '#000000', 0.3));
  for (let k = 0; k < 8; k++) R(b - 2 + k * 11, GY - 35, 11, 7, k % 2 ? s.color : '#f4f1de'); // awning
  for (let k = 0; k < 8; k++) R(b + 1 + k * 11, GY - 28, 5, 2, k % 2 ? s.color : '#f4f1de');
  box(b + 8, GY - 22, 32, 16, windowColor());
  R(b + 12, GY - 12, 6, 6, dark);
  R(b + 22, GY - 15, 5, 9, s.color);
  R(b + 31, GY - 11, 5, 5, dark);
  box(b + 52, GY - 24, 18, 24, dark);
  R(b + 66, GY - 13, 2, 2, '#f2cc8f');
  sign(s.name, b + 42, GY - 61, OL, game.visited.has(s.i) ? '#f2cc8f' : '#f4f1de');
  R(b + 78, GY - 27, 3, 4, '#ffd36e');
  if (isNight()) alpha(0.25, () => disc(b + 79, GY - 25, 5, '#ffd36e'));
}

function workshopRow() {
  const { GY, cam } = world;
  const x = 3700 - cam;
  box(x, GY - 52, 4, 52, '#8d5a3b');
  box(x + 54, GY - 52, 4, 52, '#8d5a3b');
  sign('WORKSHOP ROW', x + 29, GY - 60, '#8d5a3b', '#f4f1de');
  for (const s of shops) if (visible(s.x - 50, s.x + 50)) shop(s);
  for (let i = 0; i < shops.length - 1; i++) { // string lights
    const a = shops[i].x + 40 - cam, bx = shops[i + 1].x - 40 - cam;
    for (let k = 0; k <= 6; k++) {
      const x2 = a + ((bx - a) * k) / 6, y2 = GY - 44 + Math.sin((k / 6) * Math.PI) * 6;
      R(x2, y2, 1, 1, OL);
      if (k % 2) R(x2, y2 + 1, 1, 1, ['#e63946', '#f2cc8f', '#5cf2a0'][(k + i) % 3]);
    }
  }
}

/* ---------- Finale: the bonfire and the save crystal ---------- */

function bonfire() {
  const { GY, cam } = world;
  const x = 4684 - cam; // the fire sits just right of the stop, so the hero can sit beside it
  for (let k = 0; k < 6; k++) R(x - 11 + k * 4, GY - 2, 3, 2, '#6c6a7a');
  R(x - 8, GY - 4, 16, 2, '#4a3a2a');
  R(x - 7, GY - 6, 3, 2, '#6b4a2a');
  R(x + 4, GY - 6, 3, 2, '#6b4a2a');
  queueLight(() => {
    const { T } = world;
    if (game.lit) {
      alpha(0.18 + (motion.reduced ? 0 : 0.04 * Math.sin(T * 9)), () => disc(x, GY - 10, 26, '#ffb347'));
      const f = motion.reduced ? 0 : Math.floor(T * 12);
      for (let c = -6; c <= 6; c++) {
        const h = Math.round((7 + 7 * hash(c * 31 + f)) * (1 - Math.abs(c) / 7.5));
        R(x + c, GY - 5 - h, 1, h, '#e63946');
        if (h > 3) R(x + c, GY - 5 - h + 2, 1, h - 2, '#f08a3c');
        if (h > 6) R(x + c, GY - 5 - h + 5, 1, h - 5, '#ffd36e');
      }
      if (chance(8)) emit(x + cam + (Math.random() - 0.5) * 8, -12, (Math.random() - 0.5) * 6, -16 - Math.random() * 10, 1.6, '#ffd36e', 1);
    } else {
      for (let c = -3; c <= 3; c += 2) R(x + c, GY - 6, 1, 1, Math.floor(T * 3 + c) % 2 ? '#e63946' : '#7a2020');
    }
    // Coiled sword
    R(x, GY - 28, 2, 23, '#c0c6d4');
    for (let k = 0; k < 6; k++) R(x - 1 + (k % 2) * 3, GY - 24 + k * 3, 1, 2, '#8a8f9c');
    R(x - 3, GY - 29, 8, 2, '#8d6e3f');
    R(x, GY - 34, 2, 5, '#5a3a22');
    R(x - 1, GY - 35, 4, 2, '#8d6e3f');
    // Save crystal (a nod to SaveKnot)
    const cx = x + 44, cy = GY - 30 + Math.round(Math.sin(anim() * 2) * 3);
    const half = motion.reduced ? 6 : Math.max(2, Math.round(Math.abs(Math.cos(T * 1.5)) * 7));
    alpha(0.2, () => disc(cx, cy, 14, '#5cf2e8'));
    for (let r = -10; r <= 10; r++) {
      const w = Math.round(half * (1 - Math.abs(r) / 11));
      R(cx - w, cy + r, w * 2 + 1, 1, r < 0 ? '#9ff6f0' : '#3cc6d0');
    }
    R(cx - 1, cy - 6, 1, 3, '#ffffff');
    pixelText('SAVE', cx - 7, GY - 8, '#9ff6f0');
  });
}

// [first world x, last world x, draw]
export const SCENES = [
  [200, 280, startPost],
  [480, 680, spark],
  [880, 1120, school],
  [1390, 1580, lab],
  [1620, 1700, robot],
  [1890, 2190, factory],
  [2440, 2720, castle],
  [2840, 2950, boss],
  [3100, 3240, sands],
  [3400, 3540, cave],
  [3690, 4480, workshopRow],
  [4640, 4760, bonfire],
];
