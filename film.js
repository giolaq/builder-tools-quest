// Film timeline (portrait): chapters, captions, tag, pixel wipes. Chapters: CH[n] = { lo(p, t), hi(c, t) }
(function () {
  const K = window.K;
  const CHAPTERS = [
    { n: 1, title: 'The quest', bars: [1, 6] }, { n: 2, title: 'One command', bars: [7, 12] }, { n: 3, title: 'Any agent', bars: [13, 18] },
    { n: 4, title: 'The library', bars: [19, 25] }, { n: 5, title: 'First app', bars: [26, 32] }, { n: 6, title: 'The slow dungeon', bars: [33, 39] },
    { n: 7, title: 'The crash boss', bars: [40, 46] }, { n: 8, title: 'The bridge', bars: [47, 51] }, { n: 9, title: 'Quest complete', bars: [52, 55] },
  ];
  CHAPTERS.forEach(c => { c.start = K.at(c.bars[0]); c.end = K.at(c.bars[1] + 1); });
  const DURATION = K.at(56);
  const CAPS = [
    [1, 2, 1, "Hi, I'm Gio."], [1, 3, 1, 'This is Byte, my AI coding agent.'], [1, 4, 1, "It codes well, but doesn't know Fire TV yet."], [1, 5, 3, 'Our quest: ship a Vega OS app.'],
    [2, 7, 1, 'One command installs it:'], [2, 9, 1, 'An MCP server, Agent Skills and docs search.'], [2, 10, 3, 'Byte levels up.'], [2, 11, 3, 'And it keeps itself up to date.'],
    [3, 13, 1, 'Works with the agent you already use.'], [3, 16, 1, 'Copilot, Cline and others too.'], [3, 17, 1, 'No new editor to learn.'],
    [4, 19, 1, 'Inside: Vega know-how.'], [4, 20, 1, 'Agent Skills: step-by-step guides.'], [4, 22, 1, 'It searches the official docs.'], [4, 23, 3, 'Answers in your editor, no tab-switching.'],
    [5, 26, 1, 'Describe what you want…'], [5, 27, 3, '…Byte runs the Vega CLI.'], [5, 29, 1, 'Build, install, launch.'], [5, 30, 3, 'Running on the Virtual Device.'], [5, 31, 3, 'You stay in control.'],
    [6, 33, 1, 'Your app starts slowly.'], [6, 34, 3, 'Byte reads the performance traces.'], [6, 36, 1, 'It finds the hot functions…'], [6, 37, 1, '…and needless re-renders.'], [6, 38, 1, 'Faster start, smoother UI.'],
    [7, 40, 1, 'Then the app crashes.'], [7, 41, 3, 'Just ask why.'], [7, 42, 3, 'It decodes the crash report.'], [7, 44, 1, 'It tells you which kind of crash.'], [7, 45, 1, 'Then helps you fix it.'],
    [8, 47, 1, 'Got a Fire OS app?'], [8, 48, 1, 'Ask Byte to port it to Vega.'], [8, 49, 3, 'App porting is in Beta.'], [8, 50, 3, 'Review what it changes.'],
    [9, 52, 1, 'Your agent, now a Fire TV expert.'], [9, 53, 1, 'Install it in one command.'], [9, 54, 1, 'Go build something.'],
  ].map(([ch, bar, beat, text]) => ({ ch, t: K.at(bar, beat), text }));
  CAPS.forEach((c, i) => { const nx = CAPS[i + 1]; c.end = nx && nx.ch === c.ch ? nx.t : CHAPTERS[c.ch - 1].end - 0.3; });
  const CAP_Y = 1590, CAP_W = 960;
  function wrap(c, s, maxW) { const words = s.split(' '); const lines = []; let cur = ''; for (const w of words) { const tryS = cur ? cur + ' ' + w : w; if (c.measureText(tryS).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryS; } lines.push(cur); return lines; }
  function caption(c, t) {
    for (const cp of CAPS) {
      if (t < cp.t || t >= cp.end) continue;
      const fin = K.prog(t, cp.t, 0.15); const cont = CAPS.some(x => x.t === cp.end && x.ch === cp.ch);
      const a = cont ? fin : Math.min(fin, 1 - K.prog(t, cp.end - 0.15, 0.15));
      c.save(); c.globalAlpha = a; c.font = K.F.px(60, 700);
      const lines = wrap(c, cp.text, CAP_W - 80); const lh = 70, h = lines.length * lh + 50;
      const shown = Math.floor((t - cp.t) * 45); // typewriter reveal, dialogue style
      K.box(c, (K.W - CAP_W) / 2, CAP_Y - h / 2, CAP_W, h);
      let used = 0;
      lines.forEach((ln, i) => { const vis = ln.slice(0, Math.max(0, shown - used)); used += ln.length + 1; K.text(c, vis, K.W / 2, CAP_Y - h / 2 + 25 + lh * i + lh / 2 + 2, { font: K.F.px(60, 700), shadow: false }); });
      if (shown > cp.text.length && Math.floor(t * 3) % 2) { c.fillStyle = K.P.gold; const ax = K.W / 2 + CAP_W / 2 - 48, ay = CAP_Y + h / 2 - 34; c.fillRect(ax, ay, 16, 4); c.fillRect(ax + 4, ay + 4, 8, 4); }
      c.restore();
    }
  }
  function tag(c, ch, t) {
    const a = K.prog(t, ch.start + 0.3, 0.3); if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.font = K.F.px(40, 700);
    const s = `${ch.n}/9  ${ch.title}`; const w = c.measureText(s).width + 48;
    K.box(c, 56, 150, w, 64, { fill: K.P.ink, border: K.P.mint });
    K.text(c, s, 56 + w / 2, 184, { font: K.F.px(40, 700), color: K.P.goldL, shadow: false });
    c.restore();
  }
  function wipe(c, u) { // pixel-block diagonal wipe
    const B = 60, cols = Math.ceil(K.W / B), rows = Math.ceil(K.H / B), total = cols + rows;
    c.save();
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const d = (i + j) / total; let s;
      if (u < 0.5) s = K.clamp((u * 2 * 1.3 - d) / 0.3); else s = 1 - K.clamp(((u - 0.5) * 2 * 1.3 - d) / 0.3);
      if (s <= 0) continue; const sz = Math.ceil(B * s / 12) * 12;
      c.fillStyle = (i + j) % 2 ? K.P.forest : K.P.forestD; c.fillRect(i * B + (B - sz) / 2, j * B + (B - sz) / 2, sz, sz);
      if (s > 0.9 && (i * 7 + j * 3) % 11 === 0) { c.fillStyle = K.P.gold; c.fillRect(i * B + 24, j * B + 24, 12, 12); }
    }
    c.restore();
  }
  const WIPE = 0.8;
  window.FILM = { CHAPTERS, CAPS, DURATION, WIPE };
  let lo = null;
  window.renderAt = function (t, { captions = true, only = null } = {}) {
    const cv = document.getElementById('c'); const c = cv.getContext('2d');
    if (!lo) { lo = document.createElement('canvas'); lo.width = K.LW; lo.height = K.LH; }
    const p = lo.getContext('2d'); p.setTransform(1, 0, 0, 1, 0, 0); p.globalAlpha = 1; p.imageSmoothingEnabled = false;
    let ch = CHAPTERS.find(x => t >= x.start && t < x.end) || CHAPTERS[CHAPTERS.length - 1]; if (only) ch = CHAPTERS[only - 1];
    const def = window.CH[ch.n];
    p.fillStyle = K.P.forestD; p.fillRect(0, 0, K.LW, K.LH);
    p.save(); if (def && def.lo) def.lo(p, t); p.restore();
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.imageSmoothingEnabled = false;
    c.drawImage(lo, 0, 0, K.W, K.H);
    c.save(); if (def && def.hi) def.hi(c, t); else if (!def) K.text(c, `Chapter ${ch.n} (not built)`, K.W / 2, K.H / 2, { font: K.F.px(70) }); c.restore();
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
    tag(c, ch, t); if (captions) caption(c, t);
    if (!only) {
      for (const x of CHAPTERS.slice(1)) { const d = t - (x.start - WIPE / 2); if (d >= 0 && d <= WIPE) wipe(c, d / WIPE); }
      if (t < 0.5) { c.fillStyle = `rgba(0,0,0,${1 - K.prog(t, 0, 0.5)})`; c.fillRect(0, 0, K.W, K.H); }
      if (t > DURATION - 0.6) { c.fillStyle = `rgba(0,0,0,${K.prog(t, DURATION - 0.6, 0.6)})`; c.fillRect(0, 0, K.W, K.H); }
    }
  };
})();
