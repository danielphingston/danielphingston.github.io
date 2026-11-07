(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Hero: host RAM bar, VM releasing memory on a loop */
  var TOTAL = 31.5, WIN = 15.3, VM_FROM = 12.0, VM_TO = 6.8;
  var segVm = document.getElementById('segVm');
  var segWin = document.getElementById('segWin');
  var vmVal = document.getElementById('vmVal');
  var freeVal = document.getElementById('freeVal');
  var heroState = document.getElementById('heroState');
  segWin.style.width = (WIN / TOTAL * 100) + '%';
  function renderHero(vm) {
    segVm.style.width = (vm / TOTAL * 100) + '%';
    vmVal.textContent = vm.toFixed(1) + ' GB';
    freeVal.textContent = (TOTAL - WIN - vm).toFixed(1) + ' GB';
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  if (reduce) {
    renderHero(VM_TO);
    heroState.textContent = 'After: VM holds 6.8 GB';
  } else {
    var CYCLE = 10000, start = performance.now();
    (function tick(now) {
      var t = (now - start) % CYCLE, vm;
      if (t < 2200) { vm = VM_FROM; heroState.textContent = 'Before: VM holds 12.0 GB'; }
      else if (t < 5000) { vm = VM_FROM - (VM_FROM - VM_TO) * ease((t - 2200) / 2800); heroState.textContent = 'Hyper-V reclaiming'; }
      else if (t < 9000) { vm = VM_TO; heroState.textContent = 'After: VM holds 6.8 GB'; }
      else { vm = VM_TO + (VM_FROM - VM_TO) * ease((t - 9000) / 1000); heroState.textContent = 'Before: VM holds 12.0 GB'; }
      renderHero(vm);
      requestAnimationFrame(tick);
    })(start);
  }

  /* Flow diagram toggle */
  var flow = document.getElementById('flow');
  var MODES = {
    stock: { vmc: '20.1 GB', packet: '20.9 GB', demand: '20.9 GB', assigned: '12.0 GB', meter: 100, pill: 'Warning', pillClass: 'warn', probe: false,
      note: 'Stock driver: demand sits above the maximum, so Hyper-V keeps the VM at 12 GB.' },
    module: { vmc: '4.9 GB', packet: '5.8 GB', demand: '5.8 GB', assigned: '6.8 GB', meter: (6.8 - 4) / (12 - 4) * 100, pill: 'OK', pillClass: 'ok', probe: true,
      note: 'With hv_demand: the report carries real use plus a 1 GB cushion, and Hyper-V shrinks the VM toward demand plus its 20% buffer.' }
  };
  function setMode(name) {
    var m = MODES[name];
    flow.dataset.mode = name;
    document.getElementById('modeStock').setAttribute('aria-pressed', String(name === 'stock'));
    document.getElementById('modeModule').setAttribute('aria-pressed', String(name === 'module'));
    document.getElementById('vmcRet').textContent = m.vmc;
    document.getElementById('packet').textContent = m.packet;
    document.getElementById('hostDemand').textContent = m.demand;
    document.getElementById('hostAssigned').textContent = m.assigned;
    document.getElementById('hostMeter').style.width = m.meter + '%';
    document.getElementById('probeRow').hidden = !m.probe;
    var pill = document.getElementById('statusPill');
    pill.textContent = m.pill;
    pill.className = 'pill ' + m.pillClass;
    document.getElementById('flowNote').textContent = m.note;
  }
  document.getElementById('modeStock').addEventListener('click', function () { setMode('stock'); });
  document.getElementById('modeModule').addEventListener('click', function () { setMode('module'); });
  setMode('stock');

  /* Chart */
  function hms(h, m, s) { return h * 3600 + m * 60 + s; }
  var monitor1 = [5.76, 5.76, 5.76, 5.76, 5.76, 5.76, 5.64, 5.76, 5.76, 5.76, 5.64, 5.76];
  var assigned = [[hms(12, 37, 50), 12.0]], demand = [[hms(12, 37, 50), 19.44], [hms(12, 38, 0), 19.44]];
  monitor1.forEach(function (d, i) { demand.push([hms(12, 38, 10) + i * 10, d]); });
  var m2 = [
    ['12:41:34', 12.00, 5.76], ['12:42:04', 12.00, 5.76], ['12:42:34', 7.83, 5.33], ['12:43:05', 6.84, 5.54],
    ['12:43:35', 6.84, 5.47], ['12:44:05', 6.84, 5.47], ['12:44:36', 6.84, 5.47], ['12:45:06', 6.84, 5.47],
    ['12:45:36', 6.84, 5.47], ['12:46:06', 6.84, 5.47], ['12:46:36', 6.84, 5.47], ['12:47:07', 6.84, 5.47],
    ['12:47:37', 6.70, 5.36], ['12:48:07', 6.61, 5.55], ['12:48:37', 6.61, 5.48], ['12:49:08', 6.73, 5.58],
    ['12:49:38', 6.73, 5.45], ['12:50:08', 6.80, 5.51], ['12:50:38', 6.87, 5.77], ['12:51:09', 6.87, 5.50]
  ];
  m2.forEach(function (r) {
    var p = r[0].split(':').map(Number), t = hms(p[0], p[1], p[2]);
    assigned.push([t, r[1]]);
    demand.push([t, r[2]]);
  });

  function makeChart(svgId, cfg) {
    var svg = document.getElementById(svgId), NS = 'http://www.w3.org/2000/svg';
    var W = 760, H = 330, L = 44, R = 16, T = 18, B = 34;
    function sx(t) { return L + (t - cfg.x0) / (cfg.x1 - cfg.x0) * (W - L - R); }
    function sy(v) { return T + (1 - v / cfg.yMax) * (H - T - B); }
    function el(name, attrs, text) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      svg.appendChild(e);
      return e;
    }
    cfg.yTicks.forEach(function (v) {
      el('line', { x1: L, x2: W - R, y1: sy(v), y2: sy(v), stroke: 'var(--line)', 'stroke-width': 1 });
      el('text', { x: L - 8, y: sy(v) + 4, 'text-anchor': 'end' }, v + ' GB');
    });
    cfg.xTicks.forEach(function (t) {
      el('text', { x: sx(t[0]), y: H - 10, 'text-anchor': 'middle' }, t[1]);
    });
    [[12, 'max 12 GB'], [4, 'min 4 GB']].forEach(function (g) {
      el('line', { x1: L, x2: W - R, y1: sy(g[0]), y2: sy(g[0]), stroke: 'var(--muted)', 'stroke-width': 1, 'stroke-dasharray': '4 5' });
      el('text', { x: W - R - 4, y: sy(g[0]) - 6, 'text-anchor': 'end' }, g[1]);
    });
    (cfg.gaps || []).forEach(function (g) {
      el('rect', { x: sx(g[0]), y: T, width: sx(g[1]) - sx(g[0]), height: H - T - B, fill: 'var(--sunk)' });
      el('text', { x: (sx(g[0]) + sx(g[1])) / 2, y: H - B - 10, 'text-anchor': 'middle' }, g[2]);
    });
    cfg.marks.forEach(function (a, i) {
      el('line', { x1: sx(a[0]), x2: sx(a[0]), y1: T, y2: H - B, stroke: 'var(--ok)', 'stroke-width': 1.5, 'stroke-dasharray': '2 4' });
      el('text', { x: sx(a[0]) + 6, y: T + 12 + i * 18, class: 'ann' }, a[1]);
    });
    /* a null entry breaks the line, so unsampled stretches are not drawn as data */
    function linePath(pts) {
      var d = '', move = true;
      pts.forEach(function (p) {
        if (!p) { move = true; return; }
        d += (move ? ' M' : ' L') + sx(p[0]).toFixed(1) + ' ' + sy(p[1]).toFixed(1);
        move = false;
      });
      return d.trim();
    }
    var pDemand = el('path', { d: linePath(cfg.demand), fill: 'none', stroke: 'var(--demand)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
    var pAssigned = el('path', { d: linePath(cfg.assigned), fill: 'none', stroke: 'var(--assigned)', 'stroke-width': 3, 'stroke-linejoin': 'round' });
    var last = cfg.assigned.filter(Boolean).pop();
    el('circle', { cx: sx(last[0]), cy: sy(last[1]), r: 5, fill: 'var(--assigned)' });
    el('text', { x: sx(last[0]) - 8, y: sy(last[1]) - 12, 'text-anchor': 'end', class: 'ann' }, last[1].toFixed(2) + ' GB');
    return function draw() {
      if (reduce || !pAssigned.animate) return;
      [pDemand, pAssigned].forEach(function (p, i) {
        var len = p.getTotalLength();
        p.style.strokeDasharray = len;
        p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 2200, delay: i * 250, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'backwards' })
          .onfinish = function () { p.style.strokeDasharray = ''; };
      });
    };
  }

  var ticks1 = [];
  for (var m = 38; m <= 50; m += 2) ticks1.push([hms(12, m, 0), '12:' + m]);
  var draw1 = makeChart('chartSvg', {
    x0: hms(12, 37, 30), x1: hms(12, 51, 30), yMax: 20, yTicks: [0, 4, 8, 12, 16, 20], xTicks: ticks1,
    marks: [[hms(12, 38, 0), 'Module loaded (~12:38)'], [hms(12, 42, 34), 'Hyper-V reclaims']],
    assigned: assigned, demand: demand
  });
  document.getElementById('replay').addEventListener('click', draw1);

  /* Growth test: host samples every 5 s */
  var growth = [
    ['13:39:26', 6.44, 4.89], ['13:39:32', 6.88, 6.26], ['13:39:37', 7.51, 7.14], ['13:39:42', 8.43, 7.92],
    ['13:39:47', 8.43, 8.60], ['13:39:52', 8.43, 8.77], ['13:39:58', 9.77, 8.59], ['13:40:03', 10.22, 9.09],
    ['13:40:08', 11.74, 9.27], ['13:40:13', 11.74, 9.62], ['13:40:19', 11.74, 8.80], ['13:40:24', 11.74, 8.80],
    ['13:40:29', 11.74, 8.68], ['13:40:34', 11.74, 8.57], ['13:40:40', 11.74, 8.57], ['13:40:45', 11.74, 8.57],
    ['13:40:50', 11.74, 4.69], ['13:40:55', 11.74, 4.58], ['13:41:00', 11.74, 4.58], ['13:41:06', 11.74, 4.69],
    ['13:41:11', 11.74, 4.69], ['13:41:16', 11.74, 4.69], ['13:41:21', 11.74, 4.58], ['13:41:26', 11.74, 4.69],
    ['13:41:31', 11.74, 4.58], ['13:41:37', 11.74, 4.69], ['13:41:42', 11.74, 5.16], ['13:41:47', 11.74, 5.40],
    ['13:41:52', 11.74, 4.93], ['13:41:57', 11.74, 4.81], ['13:42:02', 11.74, 4.69], ['13:42:08', 11.74, 4.81],
    ['13:42:13', 11.74, 4.69], ['13:42:18', 11.74, 4.69], ['13:42:23', 11.74, 4.58], ['13:42:28', 11.74, 4.58],
    ['13:42:34', 11.74, 4.69], ['13:42:39', 11.74, 4.69], ['13:42:44', 11.74, 4.58], ['13:42:49', 11.74, 4.69],
    null, /* not sampled from 13:42:49 to 13:44:59 */
    ['13:44:59', 8.15, 6.93], ['13:45:05', 8.15, 7.01], ['13:45:10', 8.15, 6.93], ['13:45:15', 8.15, 6.93],
    ['13:45:20', 8.15, 6.93], ['13:45:25', 8.15, 6.93], ['13:45:31', 8.15, 6.93], ['13:45:36', 8.15, 6.93]
  ];
  var gA = [], gD = [];
  growth.forEach(function (r) {
    if (!r) { gA.push(null); gD.push(null); return; }
    var p = r[0].split(':').map(Number), t = hms(p[0], p[1], p[2]);
    gA.push([t, r[1]]);
    gD.push([t, r[2]]);
  });
  var ticks2 = [];
  for (var mn = 40; mn <= 45; mn++) ticks2.push([hms(13, mn, 0), '13:' + mn]);
  var draw2 = makeChart('growthSvg', {
    x0: hms(13, 39, 15), x1: hms(13, 46, 0), yMax: 14, yTicks: [0, 4, 8, 12], xTicks: ticks2,
    gaps: [[hms(13, 42, 49), hms(13, 44, 59), 'not sampled']],
    marks: [[hms(13, 39, 27), 'Test takes 4 GB'], [hms(13, 40, 46), 'Test releases (~13:40:46)'], [hms(13, 44, 55), 'Swap counting on (~13:44:55)']],
    assigned: gA, demand: gD
  });
  document.getElementById('replay2').addEventListener('click', draw2);

  /* Full script: line count and copy */
  var scriptEl = document.getElementById('fullScript');
  document.getElementById('scriptLines').textContent = scriptEl.textContent.replace(/\n$/, '').split('\n').length;
  document.getElementById('copyScript').addEventListener('click', function () {
    var btn = this;
    function reset() { setTimeout(function () { btn.textContent = 'Copy script'; }, 1600); }
    function fallback() {
      var r = document.createRange(); r.selectNodeContents(scriptEl);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      btn.textContent = 'Selected'; reset();
    }
    try {
      navigator.clipboard.writeText(scriptEl.textContent).then(function () { btn.textContent = 'Copied'; reset(); }, fallback);
    } catch (e) { fallback(); }
  });

  /* Copy buttons */
  Array.prototype.forEach.call(document.querySelectorAll('.cmd'), function (row) {
    var btn = row.querySelector('.copy'), code = row.querySelector('code');
    btn.addEventListener('click', function () {
      function reset() { setTimeout(function () { btn.textContent = 'Copy'; }, 1600); }
      function fallback() {
        var r = document.createRange(); r.selectNodeContents(code);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = 'Selected'; reset();
      }
      try {
        navigator.clipboard.writeText(code.textContent).then(function () { btn.textContent = 'Copied'; reset(); }, fallback);
      } catch (e) { fallback(); }
    });
  });

  /* Footprint: step through what install and uninstall touch */
  var fp = document.getElementById('fp');
  var fpRows = fp.querySelectorAll('.fp-row');
  var fpNote = document.getElementById('fpNote');
  var fpPlay = document.getElementById('fpPlay');
  var FP = {
    install: { list: document.getElementById('fpStepsInstall'), btn: document.getElementById('fpInstall'), last: 8,
      done: 'After install: only new files, a loaded module and two probes. No existing file was edited.' },
    uninstall: { list: document.getElementById('fpStepsUninstall'), btn: document.getElementById('fpUninstall'), last: 3,
      done: 'After uninstall: everything is gone except the build tools, which stay installed.' }
  };
  var fpMode = 'install', fpStep = 0, fpTimer = null;
  fp.classList.add('live');

  function fpRender() {
    var m = FP[fpMode], s = fpStep;
    Array.prototype.forEach.call(fpRows, function (r) {
      var add = +r.dataset.add, del = r.dataset.del, kind = r.dataset.kind;
      var cls = { 'is-now': false, 'is-done': false, 'is-gone': false, 'is-kept': false };
      if (fpMode === 'install') {
        if (add === s) cls['is-now'] = true;
        else if (add < s && kind !== 'read') cls['is-done'] = true;
      } else if (del === 'keep') {
        cls['is-kept'] = true;
        if (s === m.last) cls['is-now'] = true;
      } else if (del !== '-') {
        if (+del < s) cls['is-gone'] = true;
        else if (+del === s) { cls['is-gone'] = true; cls['is-now'] = true; }
        else cls['is-done'] = true;
      }
      for (var k in cls) r.classList.toggle(k, cls[k]);
    });
    Array.prototype.forEach.call(m.list.querySelectorAll('button'), function (b) {
      if (+b.dataset.step === s) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    var cur = m.list.querySelector('[data-step="' + s + '"] b');
    fpNote.textContent = s > m.last ? m.done : (cur ? fpMode + ', step ' + s + ': ' + cur.textContent : '');
  }
  function fpStop() { clearInterval(fpTimer); fpTimer = null; fpPlay.hidden = false; }
  function fpStart() {
    fpStop();
    fpPlay.hidden = true;
    fpStep = 1; fpRender();
    fpTimer = setInterval(function () {
      fpStep = fpStep > FP[fpMode].last + 1 ? 1 : fpStep + 1;
      fpRender();
    }, 1700);
  }
  function fpSetMode(name) {
    fpMode = name;
    fp.dataset.mode = name;
    for (var k in FP) { FP[k].list.hidden = k !== name; FP[k].btn.setAttribute('aria-pressed', String(k === name)); }
    if (reduce) { fpStep = FP[name].last + 1; fpRender(); fpPlay.hidden = true; } else fpStart();
  }
  for (var fk in FP) {
    (function (name) {
      FP[name].btn.addEventListener('click', function () { fpSetMode(name); });
      FP[name].list.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-step]');
        if (!b) return;
        fpStop(); fpStep = +b.dataset.step; fpRender();
      });
    })(fk);
  }
  fpPlay.addEventListener('click', fpStart);
  /* Start when the figure scrolls into view, so readers see it from step 1 */
  if (reduce || !('IntersectionObserver' in window)) fpSetMode('install');
  else {
    fpStep = 0; fpRender();
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { obs.disconnect(); fpSetMode('install'); }
    }, { threshold: 0.35 }).observe(fp);
  }

  /* Under the hood: step through insmod, then one status report */
  var pipe = document.getElementById('pipe');
  var pipePlay = document.getElementById('pipePlay');
  var PIPE = {
    load: { box: document.getElementById('pipeModeLoad'), btn: document.getElementById('pipeLoad') },
    report: { box: document.getElementById('pipeModeReport'), btn: document.getElementById('pipeReport') }
  };
  var pMode = 'load', pStep = 1, pTimer = null;
  pipe.classList.add('live');
  function pLast() { return PIPE[pMode].box.querySelectorAll('.pipe-detail').length; }
  function pRender() {
    var box = PIPE[pMode].box, n = pLast();
    Array.prototype.forEach.call(box.querySelectorAll('.pipe-detail'), function (d) { d.classList.toggle('is-on', +d.dataset.step === pStep); });
    Array.prototype.forEach.call(box.querySelectorAll('.pipe-chips button'), function (b) {
      if (+b.dataset.step === pStep) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    box.querySelector('.pipe-track i').style.width = (pStep / n * 100) + '%';
  }
  function pStop() { clearInterval(pTimer); pTimer = null; pipePlay.hidden = false; }
  function pStart() {
    pStop(); pipePlay.hidden = true;
    pStep = 1; pRender();
    pTimer = setInterval(function () { pStep = pStep >= pLast() ? 1 : pStep + 1; pRender(); }, 6000);
  }
  function pSetMode(name) {
    pMode = name; pipe.dataset.mode = name;
    for (var k in PIPE) { PIPE[k].box.hidden = k !== name; PIPE[k].btn.setAttribute('aria-pressed', String(k === name)); }
    if (reduce) { pStep = 1; pRender(); pipePlay.hidden = true; } else pStart();
  }
  for (var pk in PIPE) {
    (function (name) {
      PIPE[name].btn.addEventListener('click', function () { pSetMode(name); });
      PIPE[name].box.querySelector('.pipe-chips').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-step]');
        if (!b) return;
        pStop(); pStep = +b.dataset.step; pRender();
      });
    })(pk);
  }
  pipePlay.addEventListener('click', pStart);
  pRender();
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { obs.disconnect(); if (!pTimer && pipePlay.hidden) pStart(); }
    }, { threshold: 0.35 }).observe(pipe);
  }
})();
