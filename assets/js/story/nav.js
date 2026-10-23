// Page scroll drives the hero: scrolling down walks right. These convert between the two.
import { $, clamp, motion } from '../lib/util.js';
import { START, END, K } from './config.js';
import { world } from './state.js';

const story = $('#story');

export function readScroll() {
  world.heroTarget = clamp(START + (window.scrollY - story.offsetTop) / K, START, END);
}

export function walkTo(x) {
  window.scrollTo({
    top: story.offsetTop + (clamp(x, START, END) - START) * K,
    behavior: motion.reduced ? 'auto' : 'smooth',
  });
}

export function walkBy(dx) {
  window.scrollBy(0, dx * K);
}
