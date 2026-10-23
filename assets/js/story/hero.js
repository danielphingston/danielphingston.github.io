// The generic hero: hoodie, red fighter's headband, 4-frame walk, and a sitting pose for the bonfire.
// Built from rectangles so poses are easy to tweak; every part gets a 1px outline.
import { motion } from '../lib/util.js';
import { OL } from './config.js';
import { world } from './state.js';
import { R, alpha } from './gfx.js';

const SKIN = '#d9a066', HAIR = '#3b2a20', HOOD = '#3d6fb6', HOOD_DARK = '#2c5490';
const PANTS = '#2d2d44', PANTS_BACK = '#22223a', BOOTS = '#5a3a22', BAND = '#e63946';

// Leg x positions per walk frame: [leg A, leg B, is a leg lifted]
const LEGS = [[-4, 2, 0], [-2, 0, 1], [2, -4, 0], [0, -2, 1]];

// frame: -1 idle, 0..3 walking. Coordinates are relative to the feet (0 = ground line).
function parts(frame, sitting) {
  const out = [];
  const P = (x, y, w, h, c) => out.push([x, y, w, h, c]);
  const flutter = motion.reduced ? 0 : Math.floor(world.T * 6) % 2;

  if (sitting) {
    P(-4, -3, 8, 3, PANTS); P(4, -3, 2, 3, BOOTS);
    P(-4, -10, 7, 7, HOOD); P(2, -8, 2, 5, HOOD_DARK);
    P(-3, -16, 7, 6, SKIN); P(-3, -17, 7, 2, HAIR); P(-4, -16, 2, 4, HAIR);
    P(2, -14, 1, 2, OL);
    P(-3, -15, 7, 1, BAND); P(-6, -15, 2, 1, BAND); P(-7, -14 + flutter, 2, 1, BAND);
    return out;
  }

  const [a, b, lift] = frame < 0 ? [-3, 1, 0] : LEGS[frame];
  const swapped = frame === 2 || frame === 3; // the far leg is now in front
  const liftA = lift && !swapped ? 1 : 0, liftB = lift && swapped ? 1 : 0;
  const bob = lift ? -1 : 0;
  const arm = frame === 0 ? -1 : frame === 2 ? 1 : 0;

  P(a, -6 - liftA, 2, 4, swapped ? PANTS : PANTS_BACK); P(a, -2 - liftA, 3, 2, BOOTS);
  P(b, -6 - liftB, 2, 4, swapped ? PANTS_BACK : PANTS); P(b, -2 - liftB, 3, 2, BOOTS);
  P(-5 - arm, -12 + bob, 2, 5, HOOD_DARK); // back arm
  P(-4, -13 + bob, 8, 7, HOOD); P(-2, -9 + bob, 4, 1, HOOD_DARK); // body and pocket
  P(3 + arm, -12 + bob, 2, 5, HOOD); P(3 + arm, -8 + bob, 2, 1, SKIN); // front arm and hand
  P(-3, -19 + bob, 7, 6, SKIN); P(-3, -20 + bob, 7, 2, HAIR); P(-4, -19 + bob, 2, 4, HAIR);
  P(2, -17 + bob, 1, 2, OL); // eye
  P(-3, -18 + bob, 7, 1, BAND); P(-6, -18 + bob, 2, 1, BAND);
  P(-8, -17 + bob + (world.moving ? flutter : 0), 2, 1, BAND);
  return out;
}

export function drawHero(x, frame, sitting) {
  const { GY, face } = world;
  const rects = parts(frame, sitting);
  const mx = (rx, w) => (face > 0 ? rx : -rx - w + 1);
  alpha(0.3, () => R(x - 5, GY, 11, 1, OL));
  for (const [rx, ry, w, h] of rects) R(x + mx(rx, w) - 1, GY + ry - 1, w + 2, h + 2, OL);
  for (const [rx, ry, w, h, c] of rects) R(x + mx(rx, w), GY + ry, w, h, c);
}
