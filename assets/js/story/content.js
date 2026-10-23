// What each stop in the world says and does. Resume facts are cloned from the simple view;
// only story flavour text lives here. To add a stop: add an entry to STOPS (and a scene in scenes.js).
import { $$, el, text } from '../lib/util.js';
import { START } from './config.js';
import { world, game, unlock, visitShop, ACH } from './state.js';
import { sfx } from './feedback.js';
import { walkTo } from './nav.js';
import { setView } from '../view.js';
import { openPanel } from './panels.js';
import { shops, SHOP_START } from './shops.js';
import { narrate, cloneInto, actions, button, later, refreshDialog } from './dialog.js';

function job(selector, line) {
  return (body) => {
    narrate(body, line);
    cloneInto(body, `${selector} .meta`);
    cloneInto(body, `${selector} ul`);
  };
}

function spark(body) {
  narrate(body, 'Long before the job titles there was Little Fighters 2, a tiny freeware brawler. A big inspiration.');
  body.append(el('p', 'meta', 'On the shelf next to it:'));
  cloneInto(body, '#games');
}

function school(body) {
  narrate(body, 'Four years of computer science. The first side quests were small: A* search in Python, Tic-Tac-Toe in Java.');
  cloneInto(body, '#education .meta');
}

const ROBOT_LINES = [
  'BEEP. I AM A GPT-2 CHATBOT PROTOTYPE, BUILT IN 2019.',
  'I LEARNED TO TALK FROM DIALOGUE IN WHATSAPP CHAT EXPORTS.',
  'THIS WAS BEFORE IT WAS COOL.',
  'MY DESCENDANTS GOT VERY POPULAR. I AM PROUD OF THEM.',
  '...OK.',
];
let robotLine = 0;
function robot(body) {
  narrate(body, 'A dusty robot hums in the corner of the lab. Its plaque says 2019.');
  const speech = el('p', 'speech', '. . .');
  body.append(speech);
  actions(body, [['Talk', () => {
    speech.textContent = ROBOT_LINES[robotLine++ % ROBOT_LINES.length];
    unlock('relic');
    sfx('talk');
  }]]);
}

// The root-cause analysis as a boss fight: the steps must be found in order.
const BOSS_STEPS = [
  ['Trace global routing', 'Routing first: whether it fails depends on where in the world the device is. The eyes flinch.'],
  ['Replay connection attempts', 'Network failures and connection attempts line up: IPv6 and IPv4 are racing, and the race is latency-sensitive.'],
  ['Read Node.js Happy Eyeballs', 'Into the runtime: the Happy Eyeballs implementation details explain who wins the race, and when.'],
  ['Tune app timeouts', 'Application timeouts adjusted to match. A practical mitigation ships. The eyes close.'],
];
const BOSS_BUTTON_ORDER = [2, 0, 3, 1];
function boss(body) {
  if (game.bossDown) {
    narrate(body, 'The Happy Eyeballs sleep. Production is quiet.');
    cloneInto(body, '#ach-rca p');
    actions(body, [['Fight again', () => { game.bossDown = false; refreshDialog(); }]]);
    return;
  }
  narrate(body, 'Devices fail to connect, but only sometimes, and only from some places. Two eyes race each other: IPv6 and IPv4. Find the root cause, in order.');
  const hp = el('div', 'hp');
  const bar = el('span', 'hp-bar');
  const fill = el('span');
  fill.style.width = '100%';
  bar.append(fill);
  hp.append(el('span', null, 'HP'), bar);
  const log = el('p', 'log', 'What do you check first?');
  body.append(hp, log);
  let step = 0;
  actions(body, BOSS_BUTTON_ORDER.map((i) => [BOSS_STEPS[i][0], (btn) => {
    if (i !== step) {
      log.textContent = 'The eyes blink at you. Not yet: what comes before that?';
      sfx('miss');
      return;
    }
    step++;
    btn.disabled = true;
    fill.style.width = `${100 - (step / BOSS_STEPS.length) * 100}%`;
    log.textContent = BOSS_STEPS[i][1];
    game.bossHit = world.T;
    sfx('hit');
    if (step === BOSS_STEPS.length) {
      game.bossDown = true;
      unlock('boss');
      later(body, 1600, refreshDialog);
    }
  }]));
}

// Rollback-aware orchestration, played as a Prince of Persia rewind.
function sands(body) {
  narrate(body, 'A multi-step configuration job fails halfway. Prince of Persia would rewind time. Production needs transaction IDs and compensating actions.');
  body.append(el('p', 'meta', 'Job TXN-7F3A'));
  const list = el('ul', 'steps');
  const log = el('p', 'log', '');
  body.append(list, log);
  const row = (label, cls, mark) => {
    const li = el('li', cls);
    li.append(el('span', 'st', mark), el('span', null, label));
    list.append(li);
  };
  const row1 = actions(body, [['Run job', (run) => {
    run.disabled = true;
    list.replaceChildren();
    later(body, 300, () => { row('Validate config', 'ok', 'OK'); sfx('blip'); });
    later(body, 800, () => { row('Apply to region A', 'ok', 'OK'); sfx('blip'); });
    later(body, 1300, () => {
      row('Apply to region B', 'bad', 'XX');
      row('Notify devices', '', '..');
      log.textContent = 'Region B failed. Region A is half-applied.';
      sfx('miss');
      const rewind = button('<< Rewind', () => {
        rewind.disabled = true;
        game.rewindAt = world.T;
        log.textContent = 'Running compensating actions for TXN-7F3A, newest first...';
        later(body, 500, () => row('Undo: region A', 'undo', '<<'));
        later(body, 1000, () => row('Undo: validation (nothing to undo)', 'undo', '<<'));
        later(body, 1500, () => {
          log.textContent = 'Recovered. No half-applied config left behind.';
          cloneInto(body, '#ach-orch p');
          unlock('rewind');
        });
      });
      row1.append(rewind);
      rewind.focus({ preventScroll: true });
    });
  }]]);
}

function cave(body) {
  if (!game.bugCaught) {
    narrate(body, 'Something glitters deep in the cave, right in the middle of a payment flow.');
    actions(body, [['Report it responsibly', () => { game.bugCaught = true; unlock('bug'); refreshDialog(); }]]);
    return;
  }
  narrate(body, 'Reported, validated and rewarded. The bug now lives on a plaque.');
  cloneInto(body, '#security p');
}

const GREETINGS = [
  'Welcome in, traveller.',
  'Fresh from GitHub Pages.',
  'Built at night, tested by day.',
  'Everything here stays on your device.',
  'Mind the tests on your way in.',
  'Pick a tool, any tool.',
  'Last shop before the bonfire.',
];
function shop(s) {
  return (body) => {
    narrate(body, GREETINGS[s.i % GREETINGS.length]);
    for (const p of $$('p', s.node)) body.append(p.cloneNode(true));
    visitShop(s.i, shops.length);
  };
}

function bonfire(body) {
  game.lit = true;
  narrate(body, 'Rest a while. Thanks for playing.');
  body.append(el('p', 'meta', `Achievements: ${game.got.size} of ${ACH.length}`), el('p', null, 'Say hello:'));
  cloneInto(body, '#simple .links')?.classList.add('plinks');
  actions(body, [
    ['Open the bag (skills)', () => openPanel('bag')],
    ['Read the simple view', () => setView('simple')],
    ['Back to the start', () => walkTo(START)],
  ]);
}

// Every place the hero stops. x is the world position; the dialog opens within RANGE of it.
export const STOPS = [
  { id: 'spark', x: 560, level: 'Level 1 · The Spark', title: 'Little Fighters 2', ach: 'spark', build: spark },
  { id: 'school', x: 1005, level: 'Level 2 · SCMS Academy', title: text('#education h3'), build: school },
  {
    id: 'suyati', x: 1480, level: 'Level 3 · Suyati Lab · 2018–2020', title: text('#job-suyati h3'),
    build: job('#job-suyati', 'A solutions team: turn new technology and client ideas into working software, fast.'),
  },
  { id: 'robot', x: 1655, level: 'Level 3 · Suyati Lab', title: 'A dusty robot', build: robot },
  {
    id: 'gadgeon', x: 2040, level: 'Level 4 · Gadgeon Works · 2020–2022', title: text('#job-gadgeon h3'),
    build: job('#job-gadgeon', 'Edge devices, message brokers, media pipelines and serverless backends, across several product teams.'),
  },
  {
    id: 'cambium', x: 2580, level: 'Level 5 · Cambium Citadel · 2022–2026', title: text('#job-cambium h3'),
    build: job('#job-cambium', 'cnMaestro: a multi-region platform where managed devices talk to the cloud over long-lived WebSockets.'),
  },
  { id: 'boss', x: 2895, level: 'Level 5 · Boss fight', title: 'The Happy Eyeballs', build: boss },
  { id: 'sands', x: 3150, level: 'Level 5 · Sands of Rollback', title: 'Rewind the job', build: sands },
  { id: 'cave', x: 3450, level: 'Side quest · Bug Bounty Cave', title: 'Security research', build: cave },
  ...shops.map((s) => ({
    id: `shop-${s.i}`, x: s.x, level: `Level 6 · Workshop Row · ${s.i + 1}/${shops.length}`, title: s.title, build: shop(s),
  })),
  { id: 'bonfire', x: 4660, level: 'Final · Bonfire', title: 'Bonfire lit', ach: 'bonfire', build: bonfire },
];

// Named areas for the HUD and the map: [name, world x where it starts].
export const LEVELS = [
  ['Kerala Backwaters', START],
  ['The Spark', 560],
  ['SCMS Academy', 1005],
  ['Suyati Lab', 1480],
  ['Gadgeon Works', 2040],
  ['Cambium Citadel', 2580],
  ['Bug Bounty Cave', 3450],
  ['Workshop Row', SHOP_START],
  ['Bonfire', 4660],
];
