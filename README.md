# danielphingston.github.io

Personal site and resume for Daniel Phingston, served by GitHub Pages at <https://danielphingston.github.io/>.

It has two views of the same content:

- **Story mode** (the default): *Daniel's Quest*, a pixel-art side-scroller. Scrolling walks a hero through the resume: the spark (Little Fighters 2), college, each job, a boss fight, a bug-bounty cave, a row of project shops, and a bonfire at the end.
- **Simple view**: a plain, printable resume and project list. It is also what search engines and visitors without JavaScript get.

The project apps (`/falcon/`, `/clinic-register/`, `/resume-builder/`, …) are separate repositories, published under this domain by GitHub Pages.

## Run locally

There is no build step, but the scripts are ES modules, so serve the folder over HTTP rather than opening the file:

```sh
python3 -m http.server 8000
# open http://localhost:8000/ (add ?view=simple or ?view=story to force a view)
```

## Layout

```
index.html                 All content. The simple view is the source of truth; story mode reads from it.
assets/css/base.css        Colour tokens, reset, pixel buttons, view switching
assets/css/simple.css      Simple view and print styles
assets/css/story.css       Story mode: HUD, dialogs, panels
assets/js/main.js          Entry point
assets/js/view.js          Story/simple switch (emits a `viewchange` event)
assets/js/simple.js        Email link, project filters, print button
assets/js/lib/util.js      DOM helpers, safe localStorage, reduced-motion flag
assets/js/story/
  config.js                World size, scroll speed, stop range
  state.js                 Shared frame state and saved progress (achievements)
  index.js                 Engine: canvas sizing, frame loop, input, active stop, HUD
  gfx.js                   Pixel primitives, 3×5 sign font, particles, lights
  backdrop.js              Sky (day/night along the walk), parallax hills, palms, ground
  hero.js                  The hero sprite and its walk cycle
  scenes.js                One draw function per place, listed in SCENES
  content.js               What each stop says and does, listed in STOPS
  shops.js                 Workshop Row: one shop per featured project
  dialog.js                Dialog box and builders (narrate, cloneInto, actions)
  panels.js                Map/achievements and inventory (skills) panels
  feedback.js              Toasts and chiptune sound effects
  nav.js                   Converts between page scroll and the hero's position
```

## Common changes

**Update the resume.** Edit the simple view in `index.html`. Story dialogs clone the job bullets, achievements, education and skills from it, so there is nothing to change in the JavaScript.

**Freelance details.** Edit the `#freelance` section near the top of the simple view. The quest board on Workshop Row and the bonfire reuse its list and its email button. Email links take `data-subject` (pre-filled subject) and `data-label` (link text).

**Add a project.** Add an `<li class="project">` to `#project-list` with `data-tags` (for the filters), `data-shop` (a short uppercase sign name) and `data-color`. It gets its own shop on Workshop Row automatically. If the row grows past about eight shops, move the bonfire further right (`END` and `WORLD` in `config.js`, the bonfire stop in `content.js` and its scene in `scenes.js`).

**Add a place to story mode.**
1. Draw it: write a function in `scenes.js` and add `[firstX, lastX, fn]` to `SCENES`.
2. Give it a dialog: add `{ id, x, level, title, build }` to `STOPS` in `content.js`. Use `narrate`, `cloneInto` and `actions` from `dialog.js` to build it.
3. Optionally, add it to `LEVELS` (the HUD and map) and an achievement to `ACH` in `state.js`.

## Accessibility

- Reduced motion freezes ambient animation, snaps the hero instead of walking, and skips the typewriter effect.
- Dialog text is real HTML in an `aria-live` region. The typewriter text is hidden from screen readers, which get the full line at once.
- Keyboard: `←`/`→` (or `A`/`D`) walk, `M` opens the map, `I` the inventory, `Esc` closes things.
- Browsers without module support fall back to the simple view.
