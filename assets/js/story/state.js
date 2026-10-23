// Shared mutable state for story mode.
//   world: what the renderer needs each frame (canvas size, camera, hero, time).
//   game:  progress that persists between visits (achievements, visited shops, story flags).
import { $, store } from '../lib/util.js';
import { START } from './config.js';
import { toast, sfx } from './feedback.js';

export const world = {
  W: 320, H: 200, GY: 164, // logical canvas size and ground line
  cam: 0, // camera left edge, in world pixels
  T: 0, DT: 0, // seconds since start, and since last frame
  heroX: START, heroTarget: START, face: 1, walkDist: 0, moving: false, still: 0,
  sky: null, // current sky colours, set each frame by backdrop.js
  activeId: null, // id of the stop whose dialog is showing
};

export const ACH = [
  ['spark', 'Found the spark'],
  ['relic', 'Woke the GPT-2 relic'],
  ['boss', 'Defeated the Happy Eyeballs'],
  ['rewind', 'Rewound the sands'],
  ['bug', 'Caught the bug'],
  ['shopper', 'Visited every shop'],
  ['bonfire', 'Lit the bonfire'],
];

const got = new Set(store.get('ach', []));
export const game = {
  got,
  visited: new Set(store.get('shops', [])),
  bossDown: got.has('boss'),
  bugCaught: got.has('bug'),
  lit: got.has('bonfire'),
  bossHit: -9, // world.T of the last hit, for screen shake
  rewindAt: -99, // world.T when the rewind started, for the hourglass
};

export function paintStars() {
  $('#hud-stars').textContent = `★ ${got.size}/${ACH.length}`;
}

export function unlock(id) {
  if (got.has(id)) return;
  got.add(id);
  store.set('ach', [...got]);
  const a = ACH.find(([k]) => k === id);
  toast(`★ ${a ? a[1] : id}`);
  sfx('ach');
  paintStars();
}

export function visitShop(i, total) {
  game.visited.add(i);
  store.set('shops', [...game.visited]);
  if (game.visited.size >= total) unlock('shopper');
}
