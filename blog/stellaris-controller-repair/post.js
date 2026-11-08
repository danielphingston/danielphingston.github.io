(() => {
'use strict';
/* Exploded view and cross-section figures for the Stellaris repair post. Geometry traced from teardown photos; approximate, not to scale. */
/* ---------- geometry helpers (mm, controller seen from the BACK, bumpers at -y) ---------- */
const f = n => (+n).toFixed(2);
const SEGS = [[25,-48,45,-52,60,-46],[74,-40,80,-28,80,-12],[80,10,78,34,72,48],[67,58,52,60,47,50],[40,36,30,24,0,24]];
function silhouette(sx = 1, sy = 1, dy = 0) {
  const P = (x, y) => `${f(x * sx)} ${f(y * sy + dy)}`;
  const pts = [[0, -46], ...SEGS.map(s => [s[4], s[5]])];
  let d = `M ${P(0, -46)}`;
  for (const s of SEGS) d += ` C ${P(s[0], s[1])} ${P(s[2], s[3])} ${P(s[4], s[5])}`;
  for (let i = SEGS.length - 1; i >= 0; i--) { const s = SEGS[i], p = pts[i]; d += ` C ${P(-s[2], s[3])} ${P(-s[0], s[1])} ${P(-p[0], p[1])}`; }
  return d + ' Z';
}
const circ = (x, y, r) => `M ${f(x - r)} ${f(y)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const rrect = (x, y, w, h, r) => `M ${f(x + r)} ${f(y)} H ${f(x + w - r)} Q ${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V ${f(y + h - r)} Q ${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H ${f(x + r)} Q ${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)} V ${f(y + r)} Q ${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
function clover(cx, cy, off = 9, r = 7, core = 9) {
  const lobes = [[0, -off], [off, 0], [0, off], [-off, 0]];
  let d = '';
  for (let i = 0; i <= 96; i++) {
    const t = i / 96 * Math.PI * 2, ux = Math.cos(t), uy = Math.sin(t);
    let best = core;
    for (const [lx, ly] of lobes) {
      const b = lx * ux + ly * uy, c = lx * lx + ly * ly - r * r, disc = b * b - c;
      if (disc >= 0) best = Math.max(best, b + Math.sqrt(disc));
    }
    d += (i ? ' L ' : 'M ') + f(cx + ux * best) + ' ' + f(cy + uy * best);
  }
  return d + ' Z';
}
function plus(cx, cy, len = 10, w = 3.6) {
  return `M ${f(cx - w)} ${f(cy - len)} H ${f(cx + w)} V ${f(cy - w)} H ${f(cx + len)} V ${f(cy + w)} H ${f(cx + w)} V ${f(cy + len)} H ${f(cx - w)} V ${f(cy + w)} H ${f(cx - len)} V ${f(cy - w)} H ${f(cx - w)} Z`;
}
function spiral(cx, cy, r = 2.4, turns = 3.2) {
  let d = '';
  for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * turns * Math.PI * 2, rr = .3 + t * r; d += (i ? ' L ' : 'M ') + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr); }
  return d;
}

/* layout, back-view coordinates (front-right appears on the left). Positions traced from the teardown photos. */
const ABXY = [-46, -20], LSTICK = [31, -23], RSTICK = [-21, -1], DPAD = [21, -1];
const LOBE = { Y: [0, -9], X: [9, 0], A: [0, 9], B: [-9, 0] };
const SCREWS = [[-64, 46], [64, 46], [-57, -9], [57, -9], [-24, 20], [24, 20]];
const TSCREWS = [[-47, -35], [47, -35]];
const MSCREWS = [[-33, -32], [-17, -18], [10, -17]];
const RSCREWS = [[48, 15], [-35, 15.5], [-3.5, 2]];
const POWER = [6.5, -42.5], USBC = [-3.5, -42.5];
const poly = pts => 'M ' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L ') + ' Z';
const MAINBOARD = poly([[-47, -36.4], [-29.6, -36.4], [-24.4, -45], [24.4, -45], [29, -40], [52, -40], [56, -27], [62.6, -18], [62.6, 9], [50, 15], [-40, 15], [-50, 9], [-59, 1], [-59, -30]])
  + ' ' + circ(LSTICK[0], LSTICK[1], 10) + ' ' + circ(RSTICK[0], RSTICK[1], 10);
const REARBOARD = poly([[53.8, 19.6], [37.1, 23.7], [12.9, 23], [9.9, 18.8], [5.3, 23], [-9.9, 21.5], [-39.4, 21.1], [-45.9, 14.3], [-46.2, -16], [-39.4, -19], [-25, -19.8], [-24.3, -22.1], [26.5, -22.1], [27.3, -19], [32.6, -22.1], [44, -20.6], [45.5, -16.8], [52.3, -16], [53.8, -2.4]]);
const BUMPER_R = 'M 26 -47.5 C 44 -53 62 -51 77 -40 L 79 -33 C 65 -42 46 -44 26 -41.5 Z';
const BUMPER_L = BUMPER_R.replace(/(-?\d+(\.\d+)?) (-?\d+(\.\d+)?)/g, (m, x, _a, y) => `${-x} ${y}`);
const TRIG = s => { const k = s; return `M ${30 * k} -45 C ${32 * k} -54 ${44 * k} -59 ${58 * k} -58 C ${68 * k} -57 ${72 * k} -52 ${70 * k} -46 L ${66 * k} -42 L ${32 * k} -42 Z`; };
const MONO = 'JetBrains Mono,monospace';

/* gradients give the plastics, boards and metal a lit, satin look */
document.getElementById('scene').insertAdjacentHTML('afterbegin', `<defs>
  <linearGradient id="gShell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--shell-hi)"/><stop offset=".5" style="stop-color:var(--shell)"/><stop offset="1" style="stop-color:var(--shell-lo)"/></linearGradient>
  <linearGradient id="gPcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--pcb-hi)"/><stop offset="1" style="stop-color:var(--pcb)"/></linearGradient>
  <linearGradient id="gMetal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--metal-side)"/><stop offset=".45" style="stop-color:var(--metal)"/><stop offset=".6" style="stop-color:#eef1f4"/><stop offset="1" style="stop-color:var(--metal-side)"/></linearGradient>
  <radialGradient id="gCap" cx=".35" cy=".3" r=".8"><stop offset="0" style="stop-color:var(--shell-hi)"/><stop offset="1" style="stop-color:var(--cap)"/></radialGradient>
  <linearGradient id="gRgb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".3" stop-color="#ffd25a"/><stop offset=".55" stop-color="#5affb0"/><stop offset=".8" stop-color="#5ab4ff"/><stop offset="1" stop-color="#c45aff"/></linearGradient>
  <linearGradient id="gMem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" style="stop-color:var(--mem-side)"/></linearGradient>
</defs>`);

/* ---------- artwork ---------- */
const screwHead = (x, y, r = 2.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gMetal)" stroke="var(--edge)" stroke-width=".25"/><path d="M ${x - r * .6} ${y} H ${x + r * .6} M ${x} ${y - r * .6} V ${y + r * .6}" stroke="var(--edge)" stroke-width=".5"/>`;
const screwMark = (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="var(--edge)"/><circle cx="${x}" cy="${y}" r="3.6" fill="none" stroke="#e8e8e8" stroke-width=".35" opacity=".8"/><path d="M ${x + 4.2} ${y - 1.6} h 2.4 l -.7 1 v 2 h -1 v -2 z" fill="#e8e8e8" opacity=".8"/>`;
const A = {
  backOuter() {
    let s = '';
    for (const sx of [-1, 1]) s += `<ellipse cx="${sx * 60}" cy="38" rx="13" ry="16" fill="var(--shell-hi)" opacity=".18"/>`;
    s += `<rect x="-24" y="-36" width="48" height="27" rx="2" fill="#1a1c1f" stroke="var(--edge)" stroke-width=".4"/>`;
    s += `<rect x="-24" y="-36" width="48" height="27" rx="2" fill="none" stroke="#d29a3a" stroke-width=".3" stroke-dasharray="1 1.4" opacity=".55"/>`;
    s += `<text x="-21" y="-30.5" font-size="2.6" fill="#c8ccd0" font-family="${MONO}">Stellaris Controller</text>`;
    for (let i = 0; i < 3; i++) s += `<rect x="-21" y="${-27 + i * 4}" width="${[26, 20, 30][i]}" height="1.3" fill="#7d848c"/>`;
    s += `<rect x="-21" y="-16" width="20" height="3" fill="#e8eaec"/>`;
    for (const sx of [-1, 1]) s += `<path d="M ${sx * 17} 0 L ${sx * 31} 0 Q ${sx * 33} 0 ${sx * 33} 2 L ${sx * 32} 13 Q ${sx * 31.6} 15 ${sx * 29.6} 15 L ${sx * 18} 15 Q ${sx * 16} 15 ${sx * 16} 13 L ${sx * 16} 2 Q ${sx * 16} 0 ${sx * 17} 0 Z" fill="var(--shell-lo)" stroke="var(--edge)" stroke-width=".4"/>`;
    s += `<text x="24" y="11" font-size="3.4" text-anchor="middle" fill="#9aa1a8" font-family="${MONO}">M1</text><text x="-24" y="11" font-size="3.4" text-anchor="middle" fill="#9aa1a8" font-family="${MONO}">M2</text>`;
    s += `<rect x="-4" y="3" width="8" height="12" rx="1.2" fill="var(--edge)"/><rect x="-2.6" y="4.2" width="2.6" height="4.4" rx=".5" fill="#2b2f34"/>`;
    for (let i = 0; i < 3; i++) s += `<circle cx="2" cy="${5.6 + i * 3.2}" r=".7" fill="#e8c46a"/>`;
    s += `<circle cx="-9" cy="4" r="1.6" fill="var(--edge)"/><circle cx="-9" cy="11" r="2.3" fill="#e9eaec"/>`;
    for (const [x, y] of SCREWS) s += `<circle cx="${x}" cy="${y}" r="2.7" fill="var(--edge)"/>`;
    return s;
  },
  backInner() {
    let s = '';
    for (const [x, y] of SCREWS) s += `<circle cx="${x}" cy="${y}" r="3.6" fill="none" stroke="var(--shell-side)" stroke-width="1.2"/>`;
    s += `<path d="${silhouette(.9, .88, -2)}" fill="none" stroke="var(--shell-side)" stroke-width="1"/>`;
    return s;
  },
  frontInner() {
    let s = `<path d="${silhouette(.92, .9, -2)}" fill="var(--shell-in)"/>`;
    for (const k in LOBE) s += `<circle cx="${ABXY[0] + LOBE[k][0]}" cy="${ABXY[1] + LOBE[k][1]}" r="4.8" fill="var(--edge)"/>`;
    for (const p of [LSTICK, RSTICK]) s += `<circle cx="${p[0]}" cy="${p[1]}" r="11" fill="rgba(235,240,244,.55)" stroke="var(--mem-side)" stroke-width=".6"/><circle cx="${p[0]}" cy="${p[1]}" r="7" fill="#c9bfae"/>`;
    s += `<path d="${plus(DPAD[0], DPAD[1], 10.5, 4.2)}" fill="var(--edge)"/>`;
    for (const [x, y] of [...SCREWS, ...MSCREWS]) s += `<circle cx="${x}" cy="${y}" r="2.6" fill="var(--shell-side)"/>`;
    return s;
  },
  frontOuter() {
    let s = '';
    for (const sx of [-1, 1]) s += `<ellipse cx="${sx * 60}" cy="38" rx="13" ry="16" fill="var(--shell-hi)" opacity=".15"/>`;
    for (const k in LOBE) s += `<circle cx="${ABXY[0] + LOBE[k][0]}" cy="${ABXY[1] + LOBE[k][1]}" r="4.9" fill="var(--edge)"/>`;
    for (const p of [LSTICK, RSTICK]) s += `<circle cx="${p[0]}" cy="${p[1]}" r="12.6" fill="none" stroke="url(#gRgb)" stroke-width="1.6"/><circle cx="${p[0]}" cy="${p[1]}" r="11.5" fill="var(--edge)"/>`;
    s += `<path d="${plus(DPAD[0], DPAD[1], 10.5, 4.2)}" fill="var(--edge)"/>`;
    s += `<circle cx="0" cy="-30" r="4" fill="var(--edge)"/>`;
    for (const x of [-10, 10]) s += `<rect x="${x - 2.4}" y="-19" width="4.8" height="3" rx="1.5" fill="var(--edge)"/>`;
    for (const x of [-10, 10]) s += `<rect x="${x - 2.4}" y="-11" width="4.8" height="3" rx="1.5" fill="var(--edge)"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="${-4 + i * 2.4}" y="-3" width=".9" height="3" fill="#9aa1a8"/>`;
    return s;
  },
  mainTop() {
    let s = `<rect x="-16" y="-26" width="11" height="11" fill="#141618"/><text x="-10.5" y="-20" font-size="2" text-anchor="middle" fill="#7d848c" font-family="${MONO}">MCU</text>`;
    s += `<rect x="-6" y="5" width="12" height="7" fill="#141618"/><text x="0" y="9.3" font-size="1.7" text-anchor="middle" fill="#7d848c" font-family="${MONO}">74HC165</text>`;
    s += `<rect x="-52" y="-12" width="7" height="7" fill="#141618"/>`;
    s += `<path d="M -36 -38 h 2 v 3 h 2 v -3 h 2 v 3 h 2 v -3 h 2 v 3 h 2 v -3 h 2 v 3" fill="none" stroke="var(--gold)" stroke-width=".9"/>`;
    for (let i = 0; i < 14; i++) s += `<circle cx="${-48 + (i * 37) % 100}" cy="${-30 + (i * 13) % 42}" r=".9" fill="var(--gold)" opacity=".9"/>`;
    s += `<text x="-55" y="7" font-size="2" fill="#c8ccd0" font-family="${MONO}">GG06AZX02_1_V02</text>`;
    s += `<rect x="${USBC[0] - 4.5}" y="${USBC[1] - 2.5}" width="9" height="5" rx="1.5" fill="url(#gMetal)" stroke="var(--edge)" stroke-width=".3"/>`;
    s += `<rect x="${POWER[0] - 2}" y="${POWER[1] - 1.6}" width="4" height="3.2" fill="url(#gMetal)" stroke="var(--edge)" stroke-width=".3"/><circle cx="${POWER[0]}" cy="${POWER[1]}" r=".9" fill="var(--edge)"/>`;
    for (let i = 0; i < 10; i++) s += `<rect x="36" y="${-10 + i * 2}" width="1.2" height="1.2" fill="var(--gold)"/><rect x="38.4" y="${-10 + i * 2}" width="1.2" height="1.2" fill="var(--gold)"/>`;
    for (const x of [-54, 54]) s += `<rect x="${x - 3}" y="-39" width="6" height="6" fill="var(--metal)"/><circle cx="${x}" cy="-36" r="1.8" fill="var(--blue)"/><g class="fixed"><path d="${spiral(x, -36, 1.3, 2.5)}" fill="none" stroke="var(--accent)" stroke-width=".5"/></g>`;
    for (const [x, y] of MSCREWS) s += screwMark(x, y);
    s += `<circle cx="${-8}" cy="${2}" r="2.4" fill="var(--edge)"/><circle cx="${-1.7}" cy="${11.4}" r="2" fill="#141618"/>`;
    return s;
  },
  mainBottom() {
    let s = '';
    for (const k in LOBE) {
      const x = ABXY[0] + LOBE[k][0], y = ABXY[1] + LOBE[k][1];
      s += `<circle cx="${x}" cy="${y}" r="4.6" fill="var(--gold)"/>`;
      for (let i = -2; i <= 2; i++) s += `<rect x="${x - 3.4}" y="${y + i * 1.6 - .3}" width="6.8" height=".6" fill="var(--pcb)"/>`;
    }
    for (const [dx, dy] of [[0, -7], [7, 0], [0, 7], [-7, 0]]) s += `<circle cx="${DPAD[0] + dx}" cy="${DPAD[1] + dy}" r="3" fill="var(--gold)"/>`;
    return s;
  },
  rearTop() {
    let s = '';
    for (const x of [-21, 21]) s += `<rect x="${x - 3}" y="8" width="6" height="6" fill="var(--metal)"/><circle cx="${x}" cy="11" r="1.8" fill="var(--blue)"/>`;
    s += `<rect x="-6" y="9" width="12" height="5" fill="url(#gMetal)" stroke="var(--edge)" stroke-width=".3"/><rect x="-1" y="9.6" width="2.6" height="3.8" fill="var(--edge)"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="${-2.6 + i * 2.2}" y="15" width="1.1" height="3.6" rx=".5" fill="#e8c46a"/>`;
    for (let i = 0; i < 10; i++) s += `<rect x="38.6" y="${1 + i * 2}" width="1.2" height="1.2" fill="#0d0f12"/><rect x="41" y="${1 + i * 2}" width="1.2" height="1.2" fill="#0d0f12"/>`;
    s += `<rect x="38" y="0.4" width="4.8" height="20.2" fill="none" stroke="#3a3f46" stroke-width=".4"/>`;
    for (const [x, y] of RSCREWS) s += screwMark(x, y);
    s += `<rect x="-44" y="-14" width="14" height="10" fill="url(#gMetal)" opacity=".75"/>`;
    return s;
  },
  battTop() {
    return `<text x="0" y="-15" font-size="3.2" text-anchor="middle" fill="#d9dde1" font-family="${MONO}">XLW 102050 1000mAh</text><text x="0" y="-10" font-size="3" text-anchor="middle" fill="#d9dde1" font-family="${MONO}">3.7V 3.7Wh</text><text x="0" y="-5" font-size="3.4" text-anchor="middle" fill="#d9dde1" font-family="${MONO}">⊠  ♲  CE</text>`;
  },
  weightTop(x) {
    return `<rect x="${x - 5}" y="32" width="10" height="3.5" fill="var(--foam)"/><rect x="${x - 5}" y="49" width="10" height="3.5" fill="var(--foam)"/>`;
  },
  motorTop(x, y) {
    return `<circle cx="${x}" cy="${y}" r="6.4" fill="#d9dde1"/><circle cx="${x}" cy="${y}" r="2" fill="var(--metal-side)"/><path d="M ${x - 4} ${y - 1.5} a 4.2 4.2 0 0 1 2.5 -2.5 M ${x + 4} ${y + 1.5} a 4.2 4.2 0 0 1 -2.5 2.5" stroke="var(--metal-side)" stroke-width=".7" fill="none"/>`;
  },
  stickTop(x, y) { return `<circle cx="${x}" cy="${y}" r="6.5" fill="var(--edge)"/><circle cx="${x}" cy="${y}" r="3" fill="#2b2f34"/>`; },
  memTop() {
    let s = '';
    for (const k in LOBE) {
      const x = ABXY[0] + LOBE[k][0], y = ABXY[1] + LOBE[k][1], bad = k === 'A' || k === 'B';
      s += `<circle cx="${x}" cy="${y}" r="5.2" fill="none" stroke="var(--mem-side)" stroke-width=".7"/>`;
      const pads = [[-1.9, 0], [1.9, 0]].map(([dx, dy]) => [x + dx, y + dy]);
      if (!bad) { for (const [px, py] of pads) s += `<circle cx="${px}" cy="${py}" r="1.5" fill="#1a1c1f"/>`; continue; }
      s += `<g class="worn">`;
      for (const [px, py] of pads) s += `<circle cx="${px + .2}" cy="${py - .3}" r=".35" fill="#555"/><circle cx="${px - .4}" cy="${py + .4}" r=".25" fill="#555"/>`;
      s += `<circle cx="${x}" cy="${y}" r="5.2" fill="none" stroke="var(--alert)" stroke-width="1"/></g>`;
      s += `<g class="fixed">`;
      for (const [px, py] of pads) s += `<path d="${spiral(px, py, 1.5, 3)}" fill="none" stroke="var(--accent)" stroke-width=".55"/>`;
      s += `</g>`;
    }
    s += `<circle cx="${ABXY[0]}" cy="${ABXY[1]}" r="1.8" fill="var(--edge)"/>`;
    return s;
  },
  bumperTop(s) {
    const x = s * 52, y = -45.5;
    return `<g class="worn"><rect x="${x - 3}" y="${y - 1.4}" width="6" height="2.8" fill="none" stroke="var(--alert)" stroke-width=".8" stroke-dasharray="1 .8"/><circle cx="${x - 1}" cy="${y}" r=".4" fill="var(--foam)"/><circle cx="${x + 1.3}" cy="${y + .5}" r=".3" fill="var(--foam)"/></g>`
         + `<g class="fixed"><rect x="${x - 3}" y="${y - 1.4}" width="6" height="2.8" fill="var(--foam)" stroke="var(--accent)" stroke-width=".7"/></g>`;
  },
  trimTop() {
    return `<rect x="-6" y="-49" width="12" height="3" rx="1" fill="var(--edge)"/><path d="M -24 -46 q -8 -2 -14 2" fill="none" stroke="var(--metal)" stroke-width=".6"/><path d="M 24 -46 q 8 -2 14 2" fill="none" stroke="var(--metal)" stroke-width=".6"/>`;
  },
  trigTop(s) { return `<path d="M ${36 * s} -46 C ${40 * s} -53 ${50 * s} -56 ${60 * s} -55" fill="none" stroke="var(--shell-hi)" stroke-width=".8" opacity=".7"/>`; },
  capBottom(letter, x, y) {
    return `<circle cx="${x}" cy="${y}" r="3.4" fill="none" stroke="var(--cap-side)" stroke-width=".5"/><text transform="translate(${x} ${y + 1.6}) scale(-1 1)" font-size="4.6" font-weight="700" text-anchor="middle" fill="#eef1f4" font-family="Archivo,sans-serif">${letter}</text>`;
  },
  stickCap(x, y) {
    let s = `<circle cx="${x}" cy="${y}" r="7" fill="var(--cap-side)"/><circle cx="${x}" cy="${y}" r="6" fill="url(#gCap)"/>`;
    s += `<circle cx="${x}" cy="${y}" r="8.3" fill="none" stroke="var(--cap-side)" stroke-width="1.2" stroke-dasharray=".7 .7"/>`;
    return s;
  },
};

/* ---------- parts: h0/h1 = height of top face (mm, +h toward the back), assembled / exploded ---------- */
const P = [];
const add = o => P.push(Object.assign({ dx1: 0, dy1: 0, top: '', bottom: '', fill: 'url(#gShell)', side: 'var(--shell-side)' }, o));
const screwPart = (id, group, stage, x, y, h0, h1, T, extra = {}) => add(Object.assign({ id, group, stage, h0, h1, T, d: circ(x, y, 1.6), fill: 'var(--metal)', side: 'var(--metal-side)', top: screwHead(x, y), head: [x, y] }, extra));
SCREWS.forEach(([x, y], i) => screwPart('screw' + i, 'screws', 1, x, y, 29.5, 262, 13));
add({ id: 'backshell', group: 'backshell', stage: 2, h0: 28, h1: 215, T: 18, d: silhouette(), top: A.backOuter(), bottom: A.backInner(), bottomFill: 'var(--shell-in)' });
TSCREWS.forEach(([x, y], i) => screwPart('tscrew' + i, 'tscrews', 3, x, y, 27, 200, 8, { dy1: -34 }));
for (const s of [1, -1]) {
  add({ id: 'trig' + s, group: 'triggers', stage: 3, h0: 31, h1: 186, T: 11, d: TRIG(s), dy1: -40, dx1: s * 8, top: A.trigTop(s) });
  add({ id: 'bump' + s, group: 'bumpers', stage: 3, h0: 22, h1: 166, T: 6, d: s > 0 ? BUMPER_R : BUMPER_L, dy1: -30, dx1: s * 10, top: A.bumperTop(s), fault: true });
}
add({ id: 'trim', group: 'trim', stage: 3, h0: 25, h1: 176, T: 5, d: rrect(-26, -51, 52, 7, 2.5), dy1: -26, top: A.trimTop() });
RSCREWS.forEach(([x, y], i) => screwPart('rscrew' + i, 'rscrews', 4, x, y, 25.5, 150, 7));
add({ id: 'rear', group: 'rearboard', stage: 4, h0: 19.6, h1: 124, T: 1.6, d: REARBOARD, fill: 'url(#gPcb)', side: 'var(--pcb-side)', top: A.rearTop() });
add({ id: 'batt', group: 'battery', stage: 4, h0: 25.2, h1: 129.6, T: 5.6, d: rrect(-25, -21.5, 50, 20, 2), fill: '#1b1d20', side: '#0d0e10', top: A.battTop() });
for (const p of [LSTICK, RSTICK]) add({ id: 'stick' + p[0], group: 'sticks', stage: 4, h0: 18, h1: 122.4, T: 9, d: rrect(p[0] - 9, p[1] - 9, 18, 18, 2), fill: '#2b2f34', side: '#16181b', top: A.stickTop(p[0], p[1]) });
for (const s of [1, -1]) {
  add({ id: 'weight' + s, group: 'weights', stage: 4, h0: 23, h1: 112, T: 10, d: rrect(s * 64 - 5, 32, 10, 21, 4.5), fill: 'url(#gMetal)', side: 'var(--metal-side)', top: A.weightTop(s * 64), dx1: s * 6 });
  add({ id: 'motor' + s, group: 'motors', stage: 4, h0: 22, h1: 118, T: 6, d: circ(s * 58, 18, 9), fill: 'var(--foam)', side: '#3b3e42', top: A.motorTop(s * 58, 18), dx1: s * 4 });
}
MSCREWS.forEach(([x, y], i) => screwPart('mscrew' + i, 'mscrews', 5, x, y, 17.5, 100, 7));
add({ id: 'main', group: 'mainboard', stage: 5, h0: 14, h1: 82, T: 1.6, d: MAINBOARD, evenodd: true, fill: 'url(#gPcb)', side: 'var(--pcb-side)', top: A.mainTop(), bottom: A.mainBottom() });
add({ id: 'power', group: 'power', stage: 5, h0: 15.8, h1: 83.8, T: .4, d: circ(POWER[0], POWER[1], .9), fill: 'var(--edge)', side: 'var(--edge)' });
add({ id: 'mem', group: 'membrane', stage: 6, h0: 12, h1: 44, T: 1.4, d: clover(ABXY[0], ABXY[1]), fill: 'url(#gMem)', side: 'var(--mem-side)', top: A.memTop(), fault: true });
add({ id: 'dmem', group: 'dpadmem', stage: 6, h0: 12, h1: 44, T: 1.4, d: circ(DPAD[0], DPAD[1], 11), fill: 'url(#gMem)', side: 'var(--mem-side)' });
add({ id: 'front', group: 'frontshell', stage: 6, h0: 10, h1: 10, T: 10, d: silhouette(), top: A.frontInner(), bottom: A.frontOuter() });
for (const k in LOBE) { const x = ABXY[0] + LOBE[k][0], y = ABXY[1] + LOBE[k][1]; add({ id: 'cap' + k, group: 'caps', stage: 6, h0: 5, h1: -38, T: 7, d: circ(x, y, 4.3), fill: 'url(#gCap)', side: 'var(--cap-side)', bottom: A.capBottom(k, x, y) }); }
add({ id: 'dpad', group: 'caps', stage: 6, h0: 5, h1: -38, T: 5, d: plus(DPAD[0], DPAD[1], 10, 3.8), fill: 'url(#gCap)', side: 'var(--cap-side)', bottom: `<circle cx="${DPAD[0]}" cy="${DPAD[1]}" r="2" fill="var(--cap-side)"/>` });
for (const p of [LSTICK, RSTICK]) add({ id: 'scap' + p[0], group: 'caps', stage: 6, h0: 3.5, h1: -44, T: 11, d: circ(p[0], p[1], 9), fill: 'url(#gCap)', side: 'var(--cap-side)', bottom: A.stickCap(p[0], p[1]) });

/* label groups: n, name, anchor part + local point, side */
const G = [
  { g: 'screws', n: 1, name: 'Shell screws ×6', part: 'screw2', at: SCREWS[2], side: 'r' },
  { g: 'backshell', n: 2, name: 'Back shell', part: 'backshell', at: [-60, 20], side: 'r' },
  { g: 'tscrews', n: 3, name: 'Trigger screws ×2', part: 'tscrew1', at: TSCREWS[1], side: 'l' },
  { g: 'triggers', n: 4, name: 'Triggers LT / RT', part: 'trig-1', at: [-52, -52], side: 'r' },
  { g: 'bumpers', n: 5, name: 'Bumpers: pad worn', part: 'bump-1', at: [-52, -45], side: 'r', fault: true },
  { g: 'trim', n: 6, name: 'Top trim + bumper springs', part: 'trim', at: [-20, -48], side: 'l' },
  { g: 'rscrews', n: 7, name: 'Battery-board screws ×3', part: 'rscrew0', at: RSCREWS[0], side: 'l' },
  { g: 'battery', n: 8, name: 'Battery 1000 mAh', part: 'batt', at: [20, -12], side: 'l' },
  { g: 'rearboard', n: 9, name: 'Battery board (M1/M2, mode)', part: 'rear', at: [-40, 10], side: 'r' },
  { g: 'sticks', n: 10, name: 'Stick modules', part: 'stick-21', at: [-21, -1], side: 'r' },
  { g: 'weights', n: 11, name: 'Grip weights, foam ends', part: 'weight1', at: [64, 42], side: 'l' },
  { g: 'motors', n: 12, name: 'Rumble motors', part: 'motor-1', at: [-58, 18], side: 'r' },
  { g: 'mscrews', n: 13, name: 'Main-board screws ×3', part: 'mscrew0', at: MSCREWS[0], side: 'r' },
  { g: 'power', n: 14, name: 'Power button', part: 'power', at: POWER, side: 'l' },
  { g: 'mainboard', n: 15, name: 'Main board', part: 'main', at: [50, 5], side: 'l' },
  { g: 'membrane', n: 16, name: 'ABXY membrane: pads worn', part: 'mem', at: [-46, -11], side: 'r', fault: true },
  { g: 'dpadmem', n: 17, name: 'D-pad membrane', part: 'dmem', at: [21, -1], side: 'l' },
  { g: 'frontshell', n: 18, name: 'Front shell', part: 'front', at: [60, 30], side: 'l' },
  { g: 'caps', n: 19, name: 'Buttons + stick caps', part: 'scap31', at: [31, -23], side: 'l' },
];
const STAGES = ['Closed', 'Remove 6 shell screws', 'Lift back shell', '2 trigger screws, trim, bumpers, triggers', 'Battery board (3 screws), sticks, weights', 'Main board (3 screws)', 'Membranes, caps, front shell'];

/* ---------- scene build ---------- */
const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('scene'), world = document.getElementById('world'), labels = document.getElementById('labels');
const slices = [];
for (const p of P) {
  p.el = [];
  const n = Math.max(2, Math.ceil(p.T / 1.2));
  for (let i = 0; i <= n; i++) {
    const off = p.T * (1 - i / n); // distance below top face
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'slice');
    g.dataset.group = p.group;
    let inner;
    if (i === 0) inner = `<path d="${p.d}" fill="${p.bottomFill || p.side}"${p.evenodd ? ' fill-rule="evenodd"' : ''} stroke="var(--edge)" stroke-width=".5" vector-effect="non-scaling-stroke"/>${p.bottom}`;
    else if (i === n) inner = `<path d="${p.d}" fill="${p.fill}"${p.evenodd ? ' fill-rule="evenodd"' : ''} stroke="var(--edge)" stroke-width=".7" vector-effect="non-scaling-stroke"/>${p.top}`;
    else inner = `<path d="${p.d}" fill="${p.side}"${p.evenodd ? ' fill-rule="evenodd"' : ''} stroke="var(--edge)" stroke-width=".35" vector-effect="non-scaling-stroke"/>`;
    g.innerHTML = inner;
    const s = { p, off, g, top: i === n, bot: i === 0 };
    p.el.push(s); slices.push(s);
    world.appendChild(g);
  }
}

/* ---------- state ---------- */
const VIEWS = { back: [-28, 34], front: [206, -30], side: [-90, 14], top: [0, 89] };
const st = { S: 6, target: 6, yaw: -28, elev: 34, sel: null, dirty: true, last: 0 };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function pose(p) {
  const t = ease(clamp(st.S - (p.stage - 1), 0, 1));
  return { h: p.h0 + (p.h1 - p.h0) * t, dx: p.dx1 * t, dy: p.dy1 * t, t };
}

function render() {
  const yr = st.yaw * Math.PI / 180, er = st.elev * Math.PI / 180;
  const cY = Math.cos(yr), sY = Math.sin(yr), sE = Math.sin(er), cE = Math.cos(er);
  const prog = ease(st.S / 6);
  const z = 1.75 - .75 * prog;
  const hmid = 16 + (112 - 16) * prog;
  const sign = sE >= 0 ? 1 : -1;
  for (const p of P) p.pose = pose(p);
  const proj = (x, y, h) => [z * (x * cY - y * sY), z * ((x * sY + y * cY) * sE - (h - hmid) * cE)];
  for (const s of slices) {
    const { h, dx, dy } = s.p.pose, hs = h - s.off;
    s.key = hs * sign + (s.top ? .001 : 0) * sign;
    const a = z * cY, b = z * sY * sE, c = -z * sY, d = z * cY * sE;
    const e = z * (dx * cY - dy * sY), F = z * ((dx * sY + dy * cY) * sE - (hs - hmid) * cE);
    s.g.setAttribute('transform', `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${e.toFixed(2)} ${F.toFixed(2)})`);
    s.g.classList.toggle('sel', !!st.sel && s.p.group === st.sel);
  }
  slices.sort((u, v) => u.key - v.key);
  for (const s of slices) world.appendChild(s.g);
  svg.classList.toggle('has-sel', !!st.sel);

  /* labels */
  const items = [];
  for (const L of G) {
    const p = P.find(q => q.id === L.part), ps = p.pose;
    const visible = st.sel ? st.sel === L.g : (ps.t > .55 && st.S > .3 && (p.stage === 6 ? st.S > 5.5 : true));
    if (!visible) continue;
    const h = sign > 0 ? ps.h : ps.h - p.T;
    const [x, y] = proj(L.at[0] + ps.dx, L.at[1] + ps.dy, h);
    items.push({ L, x, y });
  }
  let html = '';
  for (const side of ['l', 'r']) {
    const col = items.filter(i => i.L.side === side).sort((a, b) => a.y - b.y);
    let prev = -1e9;
    for (const it of col) { it.ly = Math.max(it.y, prev + 14); prev = it.ly; }
    const over = col.length ? col[col.length - 1].ly - 160 : 0;
    if (over > 0) for (const it of col) it.ly -= over;
    for (const it of col) {
      const cx = side === 'r' ? 140 : -140;
      const col1 = it.L.fault ? 'var(--alert)' : 'var(--ink)';
      html += `<line x1="${f(it.x)}" y1="${f(it.y)}" x2="${f(cx + (side === 'r' ? -8 : 8))}" y2="${f(it.ly)}"/><circle cx="${f(it.x)}" cy="${f(it.y)}" r="1.4" fill="${col1}"/>`;
      html += `<circle cx="${cx}" cy="${f(it.ly)}" r="6" fill="${col1}"/><text class="num" x="${cx}" y="${f(it.ly + 2.6)}" text-anchor="middle">${it.L.n}</text>`;
      html += `<text x="${cx + (side === 'r' ? 9 : -9)}" y="${f(it.ly + 3.2)}" text-anchor="${side === 'r' ? 'start' : 'end'}"${it.L.fault ? ' style="fill:var(--alert)"' : ''}>${it.L.name}</text>`;
    }
  }
  labels.innerHTML = html;
  syncUI();
}

/* ---------- UI ---------- */
const stagelist = document.getElementById('stagelist');
STAGES.forEach((name, i) => { const li = document.createElement('li'); li.innerHTML = `<button data-stage="${i}"><span>${i}</span><span>${name}</span></button>`; stagelist.appendChild(li); });
const index = document.getElementById('partindex');
for (const L of G) { const b = document.createElement('button'); b.dataset.g = L.g; if (L.fault) b.className = 'fault'; b.setAttribute('aria-pressed', 'false'); b.innerHTML = `<b>${String(L.n).padStart(2, '0')}</b><span>${L.name}</span>`; index.appendChild(b); }
const slider = document.getElementById('explode');

function syncUI() {
  if (document.activeElement !== slider) slider.value = st.S.toFixed(2);
  const cur = Math.round(st.S);
  stagelist.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.stage === cur));
  index.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === st.sel)));
}
function kick() { if (!st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(tick); } }
function tick(now) {
  st.raf = 0;
  const dt = Math.min(.05, (now - st.last) / 1000); st.last = now;
  let moving = false;
  if (Math.abs(st.target - st.S) > .001) {
    const sp = reduced ? 99 : 1.25;
    st.S += Math.sign(st.target - st.S) * Math.min(Math.abs(st.target - st.S), sp * dt);
    moving = true;
  }
  if (st.anim) {
    const k = reduced ? 1 : Math.min(1, dt * 6);
    st.yaw += (st.anim[0] - st.yaw) * k; st.elev += (st.anim[1] - st.elev) * k;
    if (Math.abs(st.anim[0] - st.yaw) < .1 && Math.abs(st.anim[1] - st.elev) < .1) { st.yaw = st.anim[0]; st.elev = st.anim[1]; st.anim = null; }
    moving = true;
  }
  render();
  if (moving) kick();
}
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
function goStage(n) { st.target = clamp(n, 0, 6); kick(); }
function setView(v) {
  let [y, e] = VIEWS[v];
  while (y - st.yaw > 180) y -= 360; while (st.yaw - y > 180) y += 360;
  st.anim = [y, e];
  document.querySelectorAll('#views button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  kick();
}
function setPad(m) {
  svg.classList.toggle('repaired', m === 'fixed');
  document.querySelectorAll('#padmode button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pad === m)));
}
function select(g) { st.sel = st.sel === g ? null : g; render(); }

document.getElementById('playOpen').onclick = () => { if (st.S > 5.9) st.S = 0; goStage(6); };
document.getElementById('playClose').onclick = () => goStage(0);
slider.addEventListener('input', () => { st.S = st.target = +slider.value; render(); });
stagelist.addEventListener('click', e => { const b = e.target.closest('button'); if (b) goStage(+b.dataset.stage); });
document.getElementById('views').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
document.getElementById('padmode').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setPad(b.dataset.pad); });
index.addEventListener('click', e => { const b = e.target.closest('button'); if (b) select(b.dataset.g); });
document.querySelectorAll('.show3d').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.view) setView(b.dataset.view);
  if (b.dataset.pad) setPad(b.dataset.pad);
  st.sel = b.dataset.sel || null;
  goStage(+b.dataset.go); render();
  svg.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
}));

/* orbit + pick */
let drag = null;
svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: false, target: e.target }; svg.setPointerCapture(e.pointerId); });
svg.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 4) return;
  drag.moved = true; svg.classList.add('dragging'); st.anim = null;
  st.yaw -= dx * .45; let el = st.elev + dy * .45; el = clamp(el, -89, 89);
  if (Math.abs(el) < 6) el = el < st.elev ? -6 : 6;
  st.elev = el; drag.x = e.clientX; drag.y = e.clientY;
  document.querySelectorAll('#views button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  render();
});
svg.addEventListener('pointerup', e => {
  if (drag && !drag.moved) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const g = el && el.closest && el.closest('.slice');
    select(g ? g.dataset.group : null);
  }
  drag = null; svg.classList.remove('dragging');
});

/* ---------- static figures ---------- */
(function screwmap() {
  const s = document.getElementById('screwmap');
  let h = `<path d="${silhouette()}" fill="var(--shell)" stroke="var(--edge)" stroke-width=".6"/>` + A.backOuter();
  const notes = ['Grip end', 'Grip end', 'Shoulder', 'Shoulder', 'Below M2', 'Below M1'];
  SCREWS.forEach(([x, y], i) => {
    h += `<circle cx="${x}" cy="${y}" r="4.2" fill="none" stroke="var(--accent)" stroke-width="1.1"/>`;
    const lx = x === 0 ? 0 : x + (x > 0 ? 10 : -10), ly = x === 0 ? -50 : y + (y > 0 ? 14 : -14);
    h += `<line x1="${x}" y1="${y}" x2="${lx}" y2="${ly + (x === 0 ? 4 : 0)}" stroke="var(--accent)" stroke-width=".5"/>`;
    h += `<text x="${lx}" y="${x === 0 ? ly : ly + (y > 0 ? 5 : -1)}" font-size="5.5" text-anchor="middle" fill="var(--ink)" font-family="Archivo,sans-serif"><tspan font-weight="700" fill="var(--accent)">${i + 1}</tspan> ${notes[i]}</text>`;
  });
  h += `<text x="0" y="66" font-size="4.5" text-anchor="middle" fill="var(--muted)" font-family="JetBrains Mono,monospace">BUMPERS ↑ · VIEWED FROM BACK</text>`;
  s.innerHTML = h;
})();

(function bumperFigs() {
  const draw = fixed => {
    let s = '';
    s += `<rect x="20" y="130" width="220" height="10" fill="var(--pcb)"/><text x="24" y="156" font-size="10" fill="var(--muted)" font-family="JetBrains Mono,monospace">BOARD</text>`;
    s += `<rect x="150" y="104" width="34" height="26" fill="var(--metal)" stroke="var(--edge)"/><rect x="160" y="104" width="14" height="5" fill="var(--blue)" stroke="var(--edge)" stroke-width=".6"/><text x="190" y="124" font-size="10" fill="var(--ink)" font-family="Archivo,sans-serif">tact switch</text>`;
    s += `<path d="M 20 40 L 200 40 L 200 54 L 186 54 L 186 66 L 148 66 L 148 54 L 20 54 Z" fill="var(--shell)" stroke="var(--edge)"/><circle cx="34" cy="47" r="4" fill="var(--surface)" stroke="var(--edge)"/><text x="26" y="34" font-size="10" fill="var(--ink)" font-family="Archivo,sans-serif">bumper arm (pivot left)</text>`;
    if (fixed) {
      s += `<rect x="152" y="66" width="30" height="26" fill="var(--foam)" stroke="var(--accent)" stroke-width="1.2"/>`;
      s += `<path d="M 160 104 C 160 94 174 94 174 104 Z" fill="var(--accent)" stroke="var(--edge)" stroke-width=".6"/><path d="M 162 101 h 10 M 163.5 98 h 7" stroke="#f3c79d" stroke-width=".9"/>`;
      s += `<text x="26" y="80" font-size="10" fill="var(--accent)" font-family="Archivo,sans-serif" font-weight="700">foam tape on the arm</text><text x="26" y="94" font-size="10" fill="var(--accent)" font-family="Archivo,sans-serif" font-weight="700">wire bump glued on</text><text x="26" y="106" font-size="10" fill="var(--accent)" font-family="Archivo,sans-serif" font-weight="700">the flat switch</text>`;
      s += `<text x="26" y="120" font-size="10" fill="var(--ink)" font-family="Archivo,sans-serif">press reaches switch</text>`;
    } else {
      s += `<rect x="152" y="66" width="30" height="24" fill="none" stroke="var(--alert)" stroke-dasharray="3 2"/>`;
      for (const [x, y] of [[158, 72], [170, 80], [176, 70], [162, 86]]) s += `<circle cx="${x}" cy="${y}" r="1.6" fill="var(--foam)"/>`;
      s += `<rect x="161" y="96" width="12" height="8" rx="1.5" fill="none" stroke="var(--alert)" stroke-dasharray="2 1.5"/>`;
      s += `<text x="26" y="80" font-size="10" fill="var(--alert)" font-family="Archivo,sans-serif" font-weight="700">foam pad crumbled</text><text x="26" y="94" font-size="10" fill="var(--alert)" font-family="Archivo,sans-serif" font-weight="700">switch nub worn flat</text>`;
      s += `<text x="26" y="108" font-size="10" fill="var(--ink)" font-family="Archivo,sans-serif">press stops short</text>`;
    }
    return s;
  };
  document.getElementById('bumpA').innerHTML = draw(false);
  document.getElementById('bumpB').innerHTML = draw(true);
})();

(function domeFigs() {
  const draw = fixed => {
    let s = `<rect x="20" y="140" width="220" height="12" fill="var(--pcb)"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="${70 + i * 13}" y="134" width="8" height="6" fill="var(--gold)"/>`;
    s += `<text x="24" y="170" font-size="10" fill="var(--muted)" font-family="JetBrains Mono,monospace">MAIN BOARD · INTERLEAVED GOLD CONTACTS</text>`;
    s += `<path d="M 20 70 L 60 70 C 66 70 66 64 70 58 C 90 30 170 30 190 58 C 194 64 194 70 200 70 L 240 70 L 240 78 L 200 78 C 192 78 190 72 186 66 C 168 42 92 42 74 66 C 70 72 68 78 60 78 L 20 78 Z" fill="var(--mem)" stroke="var(--mem-side)" stroke-width="1.5"/>`;
    s += `<rect x="96" y="44" width="68" height="22" rx="4" fill="var(--mem)" stroke="var(--mem-side)"/>`;
    s += `<text x="24" y="60" font-size="10" fill="var(--ink)" font-family="Archivo,sans-serif">silicone dome</text>`;
    s += `<path d="M 130 14 V 40" stroke="var(--muted)" stroke-width="1.2" marker-end="url(#arr)"/><text x="138" y="26" font-size="10" fill="var(--muted)" font-family="Archivo,sans-serif">press</text>`;
    if (fixed) {
      for (const cx of [113, 147]) s += `<path d="${spiral(cx, 71, 9, 3.4)}" fill="none" stroke="var(--accent)" stroke-width="1.6" transform="translate(${cx} 71) scale(1 .35) translate(${-cx} -71)"/>`;
      s += `<text x="102" y="110" font-size="10" fill="var(--accent)" font-family="Archivo,sans-serif" font-weight="700">copper spirals, glued</text><text x="102" y="123" font-size="10" fill="var(--ink)" font-family="Archivo,sans-serif">bridge the contacts</text>`;
    } else {
      for (const cx of [113, 147]) s += `<rect x="${cx - 12}" y="66" width="24" height="6" fill="none" stroke="var(--alert)" stroke-dasharray="3 2"/>`;
      s += `<text x="96" y="110" font-size="10" fill="var(--alert)" font-family="Archivo,sans-serif" font-weight="700">carbon pads worn off</text><text x="96" y="123" font-size="10" fill="var(--ink)" font-family="Archivo,sans-serif">no bridge, no input</text>`;
    }
    return s;
  };
  document.getElementById('domeA').innerHTML = draw(false);
  document.getElementById('domeB').innerHTML = draw(true);
  const svgEl = document.getElementById('domeA').ownerSVGElement;
  svgEl.insertAdjacentHTML('afterbegin', '<defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="var(--muted)"/></marker></defs>');
})();

render();
})();
