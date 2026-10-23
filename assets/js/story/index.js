// Story mode engine: canvas sizing, the frame loop, input, and which stop is active.
import { $, clamp, motion } from '../lib/util.js';
import { currentView } from '../view.js';
import { WORLD, START, END, K, RANGE } from './config.js';
import { world, paintStars } from './state.js';
import { setContext, stepParticles, drawParticles, flushLights, visible } from './gfx.js';
import { skyAt, drawSky, drawHills, drawMidground, drawGround, drawNightTint } from './backdrop.js';
import { SCENES } from './scenes.js';
import { drawHero } from './hero.js';
import { STOPS, LEVELS } from './content.js';
import { showStop, dismissDialog } from './dialog.js';
import { initPanels, openPanel, closePanel, panelOpen } from './panels.js';
import { toast, sfx, initSound } from './feedback.js';
import { readScroll, walkTo, walkBy } from './nav.js';

const story = $('#story');
const stage = $('.stage', story);
const canvas = $('#world');

let raf = 0, last = 0;
let active = null;
let levelName = '';

/* ---------- Layout ---------- */

// The canvas is drawn at a low "logical" resolution and scaled up by CSS, so pixels stay chunky.
// Roughly 240×200 logical pixels fit on landscape screens. Tall phones zoom in further (down to
// 180px of world width) so the hero isn't tiny under a huge sky.
function layout() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  const fit = Math.min(w / 240, h / 200);
  const scale = Math.max(1, Math.min(w / 180, Math.max(fit, h / 360)));
  world.W = Math.round(w / scale);
  world.H = Math.round(h / scale);
  if (canvas.width !== world.W || canvas.height !== world.H) {
    canvas.width = world.W;
    canvas.height = world.H;
  }
  world.GY = world.H - 36;
  story.style.height = `${(END - START) * K + h}px`;
}

/* ---------- Frame ---------- */

function moveHero() {
  const d = world.heroTarget - world.heroX;
  const prev = world.heroX;
  if (motion.reduced || Math.abs(d) < 0.4) world.heroX = world.heroTarget;
  else world.heroX += Math.sign(d) * Math.min(Math.abs(d) * Math.min(1, world.DT * 9), 1400 * world.DT);
  const moved = world.heroX - prev;
  world.moving = Math.abs(moved) > 0.05;
  if (world.moving) {
    world.face = Math.sign(moved);
    world.walkDist += Math.abs(moved);
    world.still = 0;
  } else {
    world.still += world.DT;
  }
  world.cam = clamp(world.heroX - world.W * 0.36, 0, WORLD - world.W);
}

function draw() {
  world.sky = skyAt(world.cam + world.W / 2);
  drawSky();
  drawHills();
  drawMidground();
  for (const [x0, x1, scene] of SCENES) if (visible(x0, x1)) scene();
  drawGround();
  drawNightTint();
  flushLights();
  const sitting = active?.id === 'bonfire' && world.still > 1.2;
  drawHero(Math.round(world.heroX - world.cam), world.moving ? Math.floor(world.walkDist / 5) % 4 : -1, sitting);
  drawParticles();
}

function updateUi() {
  let nearest = null, best = RANGE;
  // While running a long way (map jump, Press start), don't pop open every stop on the way past.
  const passingThrough = Math.abs(world.heroTarget - world.heroX) > 80;
  if (!passingThrough) for (const stop of STOPS) {
    const d = Math.abs(stop.x - world.heroX);
    if (d < best) { best = d; nearest = stop; }
  }
  if (nearest !== active) {
    active = nearest;
    world.activeId = active?.id ?? null;
    showStop(active);
  }
  const lvl = LEVELS.filter(([, x]) => x - 150 <= world.heroX).pop()[0];
  if (lvl !== levelName) {
    levelName = lvl;
    $('#hud-level').textContent = lvl;
  }
  $('#hud-progress').style.width = `${((world.heroX - START) / (END - START)) * 100}%`;
  $('#title-card').classList.toggle('is-hidden', world.heroX > 300);
}

function frame(now) {
  raf = 0;
  if (currentView() !== 'story' || document.hidden) return;
  world.DT = Math.min(0.05, (now - last) / 1000 || 0);
  world.T += world.DT;
  last = now;
  moveHero();
  stepParticles();
  draw();
  updateUi();
  raf = requestAnimationFrame(frame);
}

function wake() {
  if (raf || currentView() !== 'story' || document.hidden) return;
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

// Jump straight to wherever the page is scrolled (on load, or when switching views).
function enter() {
  layout();
  readScroll();
  world.heroX = world.heroTarget;
  wake();
}

/* ---------- Input ---------- */

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konami = 0;

function onKey(e) {
  if (currentView() !== 'story' || e.ctrlKey || e.metaKey || e.altKey) return;
  konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
  if (konami === KONAMI.length) {
    konami = 0;
    toast('Secret found:', ['Dev Env Bingo', '/dev-bingo/']);
    sfx('ach');
  }
  if (panelOpen()) {
    if (e.key === 'Escape') closePanel();
    return;
  }
  if (e.key === 'Escape') { dismissDialog(); return; }
  if (e.target.closest?.('input, textarea, select')) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === 'ArrowRight' || key === 'd') { e.preventDefault(); walkBy(24); }
  else if (key === 'ArrowLeft' || key === 'a') { e.preventDefault(); walkBy(-24); }
  else if (key === 'i') openPanel('bag');
  else if (key === 'm') openPanel('map');
}

export function boot() {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  setContext(ctx);
  paintStars();
  initSound($('#sound-btn'));
  initPanels({ levels: LEVELS, walkTo, currentLevel: () => levelName });

  const stopXs = [START, ...STOPS.map((s) => s.x)];
  $('#start-btn').addEventListener('click', () => walkTo(STOPS[0].x));
  $('#next-btn').addEventListener('click', () => walkTo(stopXs.find((x) => x > world.heroTarget + 5) ?? END));
  $('#prev-btn').addEventListener('click', () => walkTo([...stopXs].reverse().find((x) => x < world.heroTarget - 5) ?? START));
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    walkTo(world.cam + ((e.clientX - r.left) / r.width) * world.W);
  });

  addEventListener('keydown', onKey);
  addEventListener('scroll', () => { if (currentView() === 'story') readScroll(); }, { passive: true });
  addEventListener('resize', () => { if (currentView() === 'story') { layout(); readScroll(); } });
  document.addEventListener('visibilitychange', wake);
  document.addEventListener('viewchange', (e) => {
    if (e.detail !== 'story') return;
    enter();
    $('#start-btn').focus({ preventScroll: true });
  });

  if (currentView() === 'story') enter();
}
