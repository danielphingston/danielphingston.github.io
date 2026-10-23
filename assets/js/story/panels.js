// Modal panels: the map (with achievements) and the inventory (skills).
import { $, $$, el } from '../lib/util.js';
import { OL } from './config.js';
import { ACH, game } from './state.js';

let opts = { levels: [], walkTo: () => {}, currentLevel: () => '' };
let lastFocus = null;

export function initPanels(options) {
  opts = options;
  $$('[data-panel]').forEach((b) => b.addEventListener('click', () => openPanel(b.dataset.panel)));
  $$('.panel').forEach((p) => p.addEventListener('click', (e) => {
    if (e.target === p || e.target.closest('[data-close]')) closePanel();
  }));
}

export const panelOpen = () => $$('.panel').some((p) => !p.hidden);

export function openPanel(name) {
  closePanel(false);
  lastFocus = document.activeElement;
  const panel = $(`#panel-${name}`);
  if (name === 'map') fillMap();
  else fillBag();
  panel.hidden = false;
  $('[data-close]', panel).focus();
}

export function closePanel(restoreFocus = true) {
  $$('.panel').forEach((p) => { p.hidden = true; });
  if (restoreFocus && lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
}

function fillMap() {
  const here = opts.currentLevel();
  $('#map-list').replaceChildren(...opts.levels.map(([name, x]) => {
    const b = el('button');
    b.type = 'button';
    b.append(el('span', name === here ? 'here' : null, name), el('span', 'meta', name === here ? '◀ you are here' : ''));
    b.addEventListener('click', () => { closePanel(false); opts.walkTo(x); });
    const li = el('li');
    li.append(b);
    return li;
  }));
  $('#ach-list').replaceChildren(...ACH.map(([id, label]) => {
    const has = game.got.has(id);
    return el('li', has ? 'got' : null, `${has ? '★' : '☆'} ${label}`);
  }));
}

/* ---------- Inventory: the simple view's skill groups as items ---------- */

// 12×12 item sprites, one per skill group (data-icon on .skill-group).
const ICONS = {
  sword: ['..........kk', '.........kwk', '........kwk.', '.......kwk..', '......kwk...', '..k..kwk....', '...kkwk.....', '....kgk.....', '...kgkk.....', '..kbk..k....', '.kbk........', '.kk.........'],
  potion: ['....kkkk....', '....kbbk....', '.....kk.....', '....kwwk....', '...kwwwwk...', '..kwwwwwwk..', '..krrrrrrk..', '..krrwrrrk..', '..krrrrrrk..', '...krrrrk...', '....kkkk....', '............'],
  shield: ['.kkkkkkkkkk.', '.kuuuuguuuk.', '.kuuuuguuuk.', '.kuuuuguuuk.', '.kggggggggk.', '.kuuuuguuuk.', '..kuuuguuk..', '..kuuuguuk..', '...kuuguk...', '....kuuk....', '.....kk.....', '............'],
  scroll: ['............', '.kkkkkkkkk..', 'kwwwwwwwwwk.', '.kwwwwwwwk..', '.kwkkkkkwk..', '.kwwwwwwwk..', '.kwkkkkwwk..', '.kwwwwwwwk..', 'kwwwwwwwwwk.', '.kkkkkkkkk..', '............', '............'],
};
const PALETTE = { k: OL, w: '#e6e6f0', g: '#f2cc8f', b: '#8d5a3b', r: '#e63946', u: '#3d6fb6' };
const iconCache = {};

function icon(name) {
  if (iconCache[name]) return iconCache[name];
  const c = document.createElement('canvas');
  c.width = c.height = 12;
  const g = c.getContext('2d');
  (ICONS[name] || ICONS.scroll).forEach((row, y) => [...row].forEach((ch, x) => {
    if (PALETTE[ch]) {
      g.fillStyle = PALETTE[ch];
      g.fillRect(x, y, 1, 1);
    }
  }));
  return (iconCache[name] = c.toDataURL());
}

function fillBag() {
  $('#bag-body').replaceChildren(...$$('#skills .skill-group').map((group) => {
    const section = el('section', 'bag-group');
    const grid = el('ul', 'bag-grid');
    for (const skill of $$('li', group)) {
      const img = el('img');
      img.src = icon(group.dataset.icon);
      img.alt = '';
      const item = el('li');
      item.append(img, el('span', null, skill.textContent));
      grid.append(item);
    }
    section.append(el('h3', null, $('h3', group).textContent), grid);
    return section;
  }));
}
