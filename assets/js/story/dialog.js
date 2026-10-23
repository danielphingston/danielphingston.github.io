// The RPG dialog box, and small builders that content.js uses to fill it.
import { $, $$, el, motion } from '../lib/util.js';
import { sfx } from './feedback.js';
import { unlock } from './state.js';

const dialog = $('#dialog');
let current = null; // the stop whose dialog is showing
let dismissed = null; // a stop the visitor closed; stays closed until they walk to another

export function showStop(stop) {
  current = stop;
  dismissed = null;
  render(false);
}

// Rebuilds the current dialog, e.g. after a quest step changes what it should say.
export function refreshDialog() {
  render(true);
}

export function dismissDialog() {
  if (!current || dialog.hidden) return false;
  dismissed = current;
  dialog.hidden = true;
  return true;
}

function render(quiet) {
  if (!current || dismissed === current) {
    dialog.hidden = true;
    return;
  }
  if (!quiet) sfx('blip');
  $('#dlg-level').textContent = current.level;
  $('#dlg-title').textContent = current.title;
  const body = $('#dlg-body');
  body.replaceChildren();
  current.build(body);
  dialog.hidden = false;
  dialog.scrollTop = 0;
  if (!quiet && !motion.reduced) {
    dialog.classList.remove('pop');
    void dialog.offsetWidth; // restart the animation
    dialog.classList.add('pop');
  }
  if (current.ach) unlock(current.ach);
}

$('#dlg-close').addEventListener('click', dismissDialog);

/* ---------- Builders ---------- */

// Narration with a typewriter effect. Screen readers get the full line at once.
export function narrate(body, line) {
  const p = el('p', 'narr');
  const typed = el('span');
  typed.setAttribute('aria-hidden', 'true');
  p.append(el('span', 'sr', line), typed);
  body.append(p);
  if (motion.reduced) {
    typed.textContent = line;
    p.classList.add('done');
    return;
  }
  let i = 0;
  const id = setInterval(() => {
    if (!p.isConnected) return clearInterval(id);
    i += 2;
    typed.textContent = line.slice(0, i);
    if (i >= line.length) {
      clearInterval(id);
      p.classList.add('done');
    }
  }, 22);
}

// Copies part of the simple view into the dialog, so the resume text is written once.
export function cloneInto(body, selector) {
  const src = $(selector);
  if (!src) return null;
  const copy = src.cloneNode(true);
  copy.removeAttribute('id');
  $$('[id]', copy).forEach((n) => n.removeAttribute('id'));
  body.append(copy);
  return copy;
}

// A row of pixel buttons: [[label, onClick(button)], ...]
export function actions(body, list) {
  const row = el('div', 'dlg-actions');
  for (const [label, onClick] of list) row.append(button(label, onClick));
  body.append(row);
  return row;
}

export function button(label, onClick) {
  const b = el('button', 'px-btn', label);
  b.type = 'button';
  b.addEventListener('click', () => onClick(b));
  return b;
}

// setTimeout that skips the callback if the dialog has moved on; immediate with reduced motion.
export function later(body, ms, fn) {
  setTimeout(() => { if (body.isConnected) fn(); }, motion.reduced ? 0 : ms);
}
