// Simple-view behaviour: email link, project filters, print.
import { $, $$ } from './lib/util.js';

// The address is assembled here so it is not sitting in the HTML for scrapers.
// Optional data-subject pre-fills the subject; data-label replaces the address as the link text.
$$('a.email').forEach((a) => {
  const addr = `${a.dataset.user}@${a.dataset.domain}`;
  const subject = a.dataset.subject ? `?subject=${encodeURIComponent(a.dataset.subject)}` : '';
  a.href = `mailto:${addr}${subject}`;
  a.textContent = a.dataset.label || addr;
});

$$('.filters .chip').forEach((chip) => chip.addEventListener('click', () => {
  const f = chip.dataset.filter;
  $$('.filters .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
  $$('#projects .project').forEach((p) => {
    p.hidden = f !== 'all' && !p.dataset.tags.split(' ').includes(f);
  });
  // Hide a list (and its heading) when the filter leaves it empty.
  for (const list of $$('#projects .projects')) {
    const empty = !$$('.project', list).some((p) => !p.hidden);
    list.hidden = empty;
    const heading = list.previousElementSibling;
    if (heading?.tagName === 'H3') heading.hidden = empty;
  }
}));

$('#print-btn')?.addEventListener('click', () => window.print());
