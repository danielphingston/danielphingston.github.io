// Switches between story mode and the simple view.
// The initial view is chosen by an inline script in <head> so there is no flash; this handles later switches.
import { $, $$ } from './lib/util.js';

const root = document.documentElement;

export const currentView = () => root.dataset.view;

export function setView(view) {
  root.dataset.view = view;
  try { localStorage.setItem('dp-view', view); } catch { /* storage unavailable */ }
  const url = new URL(location.href);
  if (url.searchParams.has('view')) {
    url.searchParams.delete('view');
    history.replaceState(null, '', url);
  }
  window.scrollTo(0, 0);
  document.dispatchEvent(new CustomEvent('viewchange', { detail: view }));
  if (view === 'simple') $('#simple')?.focus({ preventScroll: true });
}

$$('[data-view-set]').forEach((b) => b.addEventListener('click', (e) => {
  e.preventDefault();
  setView(b.dataset.viewSet);
}));
