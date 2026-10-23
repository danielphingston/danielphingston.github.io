# Homepage redesign plan

Turn `danielphingston.github.io` from a three-link project list into a personal site with two views of the same content:

- **Story mode**: a pixel-art, scroll-driven "game" that walks through the resume as levels, with projects as side quests and skills as inventory.
- **Simple view**: a clean, fast, printable resume and project index for recruiters, search engines and anyone in a hurry.

## Status and decisions (updated)

Built: phases 1 to 4 below (content and simple view, story engine, procedural pixel art, boss fight, rollback puzzle, achievements, sound, Konami easter egg). See the README for the file layout and how to extend it.

Answers to the open questions:

| Question | Decision |
| --- | --- |
| Phone number | Left off the site. Email is assembled by script; LinkedIn and GitHub are linked. No PDF is published, because it contains the phone number; "Print resume" prints the simple view instead. |
| Job-status line | None. |
| Nourish (`ICMR`) | Not listed. |
| Avatar | A generic hero (hoodie, red fighter's headband). |
| Games and inspiration | Little Fighters 2 as the inspiration (Level 1), plus Dark Souls (the bonfire finale), Prince of Persia (the rollback "rewind" puzzle) and Dota 2. |
| Default view | Story mode, with "Simple view" on the title card and in the HUD. `?view=simple` links straight to the simple view. |

### Rendering: Canvas 2D, not three.js

three.js was considered and set aside for now:

- The art is 2D pixel art. Canvas 2D at a low logical resolution, scaled up with `image-rendering: pixelated`, gives crisp pixels for free. three.js would need an orthographic camera, nearest-neighbour textures and pixel snapping to get the same result.
- Size: the whole story engine is about 50 KB unminified with no dependencies; three.js alone is about 150 KB gzipped, plus WebGL setup and context-loss handling.
- Nothing here needs real 3D, lighting or shaders.

Rendering is isolated in `assets/js/story/` (`gfx.js`, `backdrop.js`, `scenes.js`, `hero.js`), so three.js can be added later where it earns its place. A 3D title scene, or a WebGL layer behind the 2D world, would fit without touching the content or UI modules.

### Blog-ready structure

- The JS is split into small native ES modules, and the CSS into `base` (shared tokens and buttons), `simple` and `story`. A blog page can load `base.css` + `simple.css` and look like the rest of the site.
- **When the first post is written**, switch the repo to Jekyll, which GitHub Pages builds natively with no local tooling needed:
  1. Remove `.nojekyll` and add `_config.yml` (with `jekyll-feed` and `jekyll-seo-tag`, both supported by Pages).
  2. Move the shared `<head>` and footer into `_layouts/default.html` / `_includes/`; posts go in `_posts/YYYY-MM-DD-slug.md` with a `post` layout, and the index at `/blog/`.
  3. Add a "Blog" link to the simple view, and a story-mode stop: a notice board scene (one entry in `SCENES`) whose dialog (one entry in `STOPS`) lists the latest posts from `/feed.xml` or a small generated `posts.json`.
- Until then, the site stays a plain static page with no build step.

## 1. Sources

### Resume (`ast_resume.pdf`)

| Section | Content to use |
| --- | --- |
| Headline | Senior Software Engineer, Backend & Distributed Systems, 8+ years, Ernakulam, Kerala |
| Summary | Backend, distributed, network-management, IoT and cloud systems; production troubleshooting and reliability |
| Skills | Backend & Architecture · Data & Messaging · Cloud & Platform · Additional (Go, Python, React, Angular, FFmpeg, networking, security, generative AI) |
| Cambium Networks (08/2022 – 09/2026) | cnMaestro multi-region platform, MarketApps/EasyApps foundations, Node.js + PostgreSQL/MongoDB/Redis + RabbitMQ RPC/SQS + device WebSockets, IPv6/IPv4 Happy Eyeballs root cause, rollback-aware orchestration |
| Gadgeon Systems (02/2020 – 08/2022) | Embedded work with Mavenir, edge IoT (Go, React, MQTT, SingleStore), edge AI and media (FFmpeg, Couchbase, K8s), serverless (Lambda, SAM, DynamoDB), voice + HERE Maps experiences |
| Suyati Technologies (07/2018 – 02/2020) | Solutions/PoC team, **GPT-2 chatbot prototype in 2019** trained on WhatsApp exports, Dialogflow/LUIS/Bot Framework bots, Electron port of a security app, Momentive CMS and a rewards platform |
| Achievements | Production connectivity RCA, distributed job orchestration, reusable platform foundations |
| Security research | HackerOne: validated and rewarded Cleartrip payment-flow vulnerability |
| Education | B.Tech CSE, SCMS School of Engineering and Technology (2014 – 2018) |

### GitHub (public repos, 25 total; `pms5` and `ReVive-Dietetics` are private and stay off the site)

**On GitHub Pages: currently listed**

| Repo | Live path | What it is |
| --- | --- | --- |
| `falcon` | `/falcon/` | FDD Tracker: offline PWA for financial due diligence (React, Dexie, Drive/Calendar sync, Gemini assistant) |
| `clinic-register` | `/clinic-register/` | Offline-first OPD register for a homeopathy clinic: patients, visits, billing, stock, certificates, Drive sync |
| `warzone-sens-calibrator` | `/warzone-sens-calibrator/` | Finds Warzone/Valorant sensitivity from aim drills; Fitts throughput scoring, log-parabola curve fit |

**On GitHub Pages: missing from the homepage (add all four)**

| Repo | Live path | What it is |
| --- | --- | --- |
| `resume-builder` | `/resume-builder/` | **Folio Resume Studio**: buildless browser resume editor with reusable blocks, presets, JSON backup, PDF export, optional Google Drive save, Playwright visual tests |
| `bill-ocr` | `/bill-ocr/` | In-browser bill/receipt OCR to JSON with Falcon-OCR on ONNX Runtime Web + WebGPU; images never leave the device (marked experimental) |
| `ICMR` | `/ICMR/` | **Nourish**: clinical diet-protocol PWA (targets, daily diet prescription, meal reconciliation, print/PDF), no dependencies |
| `dev-bingo` | `/dev-bingo/` | "Dev Env Bingo: Memphis Pop": a playful bingo card of dev-environment pains |

**Not on Pages but worth featuring**

| Repo | Why |
| --- | --- |
| `save-knot` (Go, 2026) | **SaveKnot**: local-first game-save daemon using the Ludusavi manifest, content-addressed zstd snapshots, direct-to-R2 sync, registry backup, tray + localhost UI. The strongest systems project on the profile. |
| `covid-center-watch` + `covid-center-watcher-lambda` (2021) | Vaccine-slot watcher (Vue on Vercel + Lambda email alerts): a good "built it because people needed it" story |
| `couchbase-store`, `debounce-throttle-by-key`, `rabbitmq-email-publisher`, `docker-health-check-node` | Small Node libraries that back up the backend/messaging story |
| `word-similarity-server`, `webrtcPeer`, `Best-First-and-A-Star-python-`, `DashBuilder` | Archive / "early experiments" shelf only |

### Interests the site should highlight (inferred; please confirm)

1. **Local-first, privacy-first software.** Nearly every recent project keeps data on the device, has no backend, and syncs to the user's own Drive or R2 bucket.
2. **Building tools for real people.** Projects for a clinic, a dietitian, a CA doing due diligence, and vaccine-slot hunters.
3. **Gaming.** Sensitivity calibration with real HCI maths, game-save backup.
4. **AI before and after the hype.** A GPT-2 chatbot in 2019, now WebGPU OCR in the browser and an LLM assistant in FDD Tracker.
5. **Security.** HackerOne disclosure, offensive-security tooling at Suyati.
6. **Debugging deep.** The Happy Eyeballs RCA is a perfect "boss fight".

## 2. Information architecture

One page, one source of truth: the simple view in `index.html` is the canonical content (SEO, no-JS, print), and story mode clones text from it, so content is written once. No build step; GitHub Pages serves it as is. The full file layout is in the README.

## 3. Simple view (ship first)

Sections, top to bottom:

1. **Header**: name, title, location, links (GitHub, LinkedIn, email, Download PDF), the view toggle ("▶ Play story" / "≡ Simple").
2. **About**: 2–3 sentences from the summary plus the interests above.
3. **Experience**: three roles with dates and bullets, collapsible on mobile.
4. **Selected achievements**: the three achievements + the HackerOne finding.
5. **Projects**: cards with name, one-liner, tech tags, a **Live** link and a **Source** link. Filter chips: *All · Live apps · Local-first · Gaming · AI · Libraries*. Featured: Folio, SaveKnot, FDD Tracker, Clinic Register, Bill OCR, Warzone Sens.
6. **Skills**: the four resume groups.
7. **Education** and footer.

Requirements: system font stack, light/dark via `prefers-color-scheme`, works at 320px wide, a print stylesheet that reads like the PDF, and Lighthouse ≥ 95 on all four categories.

## 4. Story mode

### Concept: "Daniel's Quest". A side-scrolling pixel world driven by scroll

Scroll (or ←/→, swipe, or on-screen arrows) moves a pixel-art Daniel through a horizontal world. Each area is a level; walking up to an object opens a retro dialogue box with the real resume content. Scroll-driven input keeps it usable on phones and trackpads without game skills.

| Level | Scene | Content | Interaction |
| --- | --- | --- | --- |
| 0. Title screen | Kerala backwaters at dusk, backwater boat, "PRESS START" | Name, title, "8+ years" | Start / "Skip to simple view" |
| 1. SCMS Academy (2014–18) | Campus with a library tower | B.Tech CSE; early repos (A*, Tic-Tac-Toe, `Life`) as books on a shelf | Read the shelf |
| 2. Suyati Lab (2018–20) | Inventor's workshop full of prototypes | PoC team, chatbots, Electron port, CMS | **Rare item: "GPT-2 (2019)"**, a talking robot that replies with lines from the resume |
| 3. Gadgeon Factory (2020–22) | IoT factory: antennas, conveyor belts, a cloud overhead | Edge IoT with MQTT, edge AI/FFmpeg, Lambda | Packets fly along MQTT wires; lightning from a "Lambda" cloud |
| 4. Cambium Citadel (2022–26) | Network castle with towers in several regions | cnMaestro, MarketApps/EasyApps, messaging stack | **Boss fight: "The Happy Eyeballs"**, two eyes (IPv4 / IPv6) racing. Clicking through the RCA steps defeats it. **Puzzle: orchestration**, a chain of steps where one fails and the rollback animates. |
| Side quest. Bug Bounty Cave | Hidden cave | HackerOne Cleartrip disclosure | Find the bug sprite, get a badge |
| 5. Workshop / Arcade | A town square of shops, one per project | Each Pages project is a shop or arcade cabinet that links to the live app | Enter a shop to see the description, then Play/Source buttons |
| 6. Save Point | Glowing save crystal (SaveKnot) | Contact, PDF, links | "Save game" = download resume |

**HUD and meta**

- **Inventory** (`I` key or a bag icon): skills as items grouped like the resume. Node.js sword, PostgreSQL shield, RabbitMQ carrier pigeon, Kubernetes ship's wheel, Go gopher pet.
- **Quest log**: a progress bar of levels visited, and a "Skip to level" menu.
- **Achievements toast**: "Found the GPT-2 relic", "Defeated Happy Eyeballs", "Visited every shop". Stored in `localStorage` (wrapped in try/catch).
- **Easter eggs**: the Konami code opens the dev-bingo card; the arcade cabinet for the sens calibrator shows a crosshair cursor.
- **Sound**: off by default, with a toggle. Use tiny chiptune SFX made with the WebAudio API, so no audio files are needed.

### Technical approach

- **Rendering**: DOM + CSS for the world layers (parallax `transform: translateX`), sprites as PNG sheets with `image-rendering: pixelated`. A canvas is only needed for particles (MQTT packets, boss effects). No game engine. Target under 150 KB JS+CSS and under 300 KB sprites.
- **Input**: `scroll` mapped to world X (a tall spacer element drives a sticky viewport), plus keyboard, swipe and on-screen buttons. Pause animation when the tab is hidden.
- **Fonts**: "Press Start 2P" for headings and the HUD only; dialogue text in a readable pixel-ish font ("VT323" or "Pixelify Sans") at ≥18px.
- **Art**: a limited palette (about 16 colours), 16×16 tiles, a 32×32 character with a 4-frame walk cycle. Options: hand-draw in Aseprite or Piskel, or a commissioned/AI-assisted base cleaned up by hand. Keep sources in `assets/sprites/src/`.

### Accessibility and fallbacks

- `prefers-reduced-motion` → open the simple view by default; story mode is then step-by-step (next/previous buttons, no parallax).
- All dialogue content also exists as real text in the simple view; story mode sets `aria-hidden` on decorative layers, and each dialogue box is an `aria-live` region.
- No JS → simple view.
- Pick the default view by audience:
  - **Desktop** first visit → story title screen with an obvious "Simple view" button.
  - **Mobile** → story mode works, but the title screen offers both options.
  - **Return visitors** → whatever they chose last time.
  - `?view=simple` / `?view=story` deep links, for sending to recruiters.

## 5. SEO and sharing

- `<title>`, meta description, canonical URL, Open Graph/Twitter card with the pixel-art `og.png`.
- JSON-LD `Person` (name, jobTitle, address locality, sameAs GitHub/LinkedIn) and `CreativeWork`/`SoftwareApplication` for each project.
- `sitemap.xml` and `robots.txt` (Search Console verification is already in place).
- Keep `google47b6fb011d505e4c.html` untouched.

## 6. Tie-in with Folio (resume-builder)

The resume PDF on the site should be exported from Folio Resume Studio, which the site itself showcases. A later option: have the site read a Folio JSON backup (`resume.json`) so updating the resume in Folio updates the site. That would add a small renderer from Folio's v2 schema (`src/model.mjs`) to the simple-view HTML. That needs either a build step or client-side rendering, which costs SEO and no-JS support. Recommendation: **phase 2 or later**; start with hand-written HTML.

## 7. Delivery phases

| Phase | Scope | Outcome |
| --- | --- | --- |
| **1. Content + simple view** | New `index.html` with all sections, the four missing Pages projects, SaveKnot and the libraries, project filters, dark mode, print CSS, SEO tags, PDF link | Useful on day one; fixes the missing projects |
| **2. Story engine** | View toggle, scroll-to-world engine, levels as placeholder blocks, dialogue boxes reading from the DOM, HUD, reduced-motion step mode | Playable greybox |
| **3. Pixel art** | Palette, tiles, character, level backdrops, shop fronts, boss sprite, OG image | Looks like the real thing |
| **4. Delight** | Boss fight, orchestration puzzle, achievements, Konami bingo, chiptune SFX | The "story" feel |
| **5. QA** | Playwright screenshots at 375/768/1440, Lighthouse, keyboard-only pass, Safari/Firefox check, link checker over all project URLs | Ready to share |

Each phase is a separate commit or PR, so phase 1 can go live while the art is in progress.

## 8. Open questions

All answered; see **Status and decisions** at the top.
