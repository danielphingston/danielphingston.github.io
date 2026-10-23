// Workshop Row: one shop per featured project, read from the simple view's project list.
// Add a project there (with data-shop and data-color) and it gets a shop automatically.
import { $, $$ } from '../lib/util.js';

export const SHOP_START = 3790;
export const SHOP_GAP = 105;

export const shops = $$('#project-list .project').map((node, i) => ({
  node,
  i,
  x: SHOP_START + i * SHOP_GAP,
  name: node.dataset.shop || `SHOP ${i + 1}`,
  color: node.dataset.color || '#e07a5f',
  title: $('h3', node).textContent,
}));
