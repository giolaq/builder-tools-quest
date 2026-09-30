// Live mode (16:9): type a prompt, watch Byte ask Claude + ADBT, see each MCP call, what ADBT returned, and the answer.
// Low-res world 480x270 scaled x4 under a crisp 1920x1080 overlay, same kit and rules as the film.
(function () {
  const P = K.P, W = 1920, H = 1080, LW = 480, LH = 270;
  const cv = document.getElementById('c'), c = cv.getContext('2d');
  const lo = document.createElement('canvas'); lo.width = LW; lo.height = LH; const p = lo.getContext('2d');
  const now = () => performance.now() / 1000;

  // ---------- layout (hi-res) ----------
  const BOX_PROMPT = { x: 40, y: 40, w: 600, h: 420 };
  const BOX_ADBT = { x: 700, y: 40, w: 1180, h: 520 };
  const BOX_ANS = { x: 700, y: 610, w: 1180, h: 430 };
  const GIO = [52, 252], BYTE = [124, 252];                 // low-res feet
  const TV = { x: 66, y: 134, w: 44, h: 32 };               // wall-mounted TV between Gio and Byte (low-res)
  const BEAM_TO = [BOX_ADBT.x / 4 - 2, 100];                // low-res point on the ADBT panel edge

  // ---------- state ----------
  let S = fresh(null);
  function fresh(prompt) { return { prompt, t0: now(), calls: [], answer: '', shown: 0, done: null, error: null, scroll: null, rowFirst: null, pick: null }; }
  const visibleCalls = () => S.calls.filter(x => x.name !== 'set_project_context');
  const pending = () => S.calls.find(x => !x.tRes);
  function apply(ev) {
    const t = now();
    if (ev.type === 'tool') {
      S.calls.push({ id: ev.id, name: ev.name, input: ev.input || {}, t }); S.answer = ''; S.shown = 0;
      SFX.play(ev.name === 'set_project_context' ? 'chirp' : ev.name === 'read_document' ? 'scroll' : 'beam');
    } else if (ev.type === 'result') { const k = S.calls.find(x => x.id === ev.id); if (k) Object.assign(k, { result: ev.text, isError: ev.isError, tRes: t }); SFX.play(ev.isError ? 'err' : 'got'); }
    else if (ev.type === 'delta') { if (!S.answer) SFX.play('write'); S.answer += ev.text; }
    else if (ev.type === 'done') { if (ev.text) S.answer = ev.text; S.done = Object.assign({ t }, ev); SFX.play('fanfare'); }
    else if (ev.type === 'error') { S.error = Object.assign({ t }, ev); SFX.play('sad'); }
    if (ev.type === 'done' || ev.type === 'error') finish();
  }

  // ---------- rich text: tiny markdown -> styled, wrapped lines ----------
  function layout(md, width, size) {
    const lines = []; let code = false;
    const F = { txt: K.F.px(size, 600), code: K.F.mono(size - 4), bold: K.F.px(size, 700) };
    for (let raw of md.replace(/\r/g, '').split('\n')) {
      if (/^\s*```/.test(raw)) { code = !code; continue; }
      if (!raw.trim()) { lines.push({ runs: [], h: 0.5 }); continue; }
      if (code) { lines.push({ runs: [{ s: raw.slice(0, 90), f: F.code, col: P.goldL, x: 24 }], h: 1 }); continue; }
      let indent = 0, lead = null, head = false;
      const b = raw.match(/^\s*[-*•]\s+(.*)/), n = raw.match(/^\s*(\d+[.)])\s+(.*)/), hd = raw.match(/^#+\s+(.*)/);
      if (b) { lead = '•'; raw = b[1]; indent = 34; } else if (n) { lead = n[1]; raw = n[2]; indent = 44; } else if (hd) { raw = hd[1]; head = true; }
      const words = [];
      raw.replace(/\*\*|__/g, '').split('`').forEach((seg, i) => seg.split(/(\s+)/).forEach(w => {
        if (w && !/^\s+$/.test(w)) words.push({ s: w, f: i % 2 ? F.code : head ? F.bold : F.txt, col: i % 2 ? P.goldL : head ? P.gold : P.paper });
      }));
      let cur = { runs: lead ? [{ s: lead, f: F.bold, col: P.mint, x: 4 }] : [], h: 1 }, x = indent;
      c.save(); const sp = (c.font = F.txt, c.measureText(' ').width);
      for (const w of words) {
        c.font = w.f; const ww = c.measureText(w.s).width;
        if (x + ww > width && x > indent) { lines.push(cur); cur = { runs: [], h: 1 }; x = indent; }
        cur.runs.push(Object.assign({ x }, w)); x += ww + sp;
      }
      c.restore(); lines.push(cur);
    }
    return lines;
  }
  function drawLines(lines, box, size, lh, offset) { // offset in px from the top of the text
    c.save(); c.beginPath(); c.rect(box.x, box.y, box.w, box.h); c.clip();
    let y = box.y - offset;
    for (const ln of lines) {
      if (y >= box.y - 2 && y + lh <= box.y + box.h + 2) for (const r of ln.runs) K.text(c, r.s, box.x + r.x, y + lh / 2, { font: r.f, color: r.col, align: 'left', shadow: false });
      y += ln.h * lh;
    }
    c.restore(); return lines.reduce((a, l) => a + l.h * lh, 0);
  }
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const ROWS = 3, HIT = {}; // hit areas of the scrollable regions, refreshed every frame
  const pickedCall = calls => calls.find(k => k.id === S.pick && k.tRes) || [...calls].reverse().find(k => k.tRes);
  function micIcon(cx, cy, t, live) { // pixel microphone, 6px grid, sound waves while listening
    const u = 6, R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(cx + x * u, cy + y * u, w * u, h * u); };
    const col = live ? P.gold : P.mintL;
    R(-2, -4, 4, 1, P.ink); R(-2, -4, 4, 5, col); R(-2, -4, 1, 5, live ? P.goldL : P.paper);   // capsule
    R(-1, -3, 2, 1, P.ink); R(-1, -1, 2, 1, P.ink);                                             // grille
    R(-3, 0, 1, 2, col); R(2, 0, 1, 2, col); R(-2, 2, 4, 1, col); R(0, 3, 1, 1, col); R(-1, 4, 3, 1, col); // cradle + stand
    if (live) for (let i = 1; i <= 2; i++) if (Math.floor(t * 4) % 3 >= i - 1) {
      R(-3 - i * 2, -3, 1, 4, P.mint); R(3 + i * 2 - 1, -3, 1, 4, P.mint);
    }
  }
  function scrollBar(x, y, h, off, room, frac) {
    const bh = Math.max(32, Math.round(h * Math.min(1, frac))), by = y + Math.round((h - bh) * (off / room));
    c.fillStyle = P.stoneD; c.fillRect(x, y, 8, h); c.fillStyle = P.mint; c.fillRect(x, by, 8, bh);
  }

  // ---------- low-res world ----------
  function torch(x, y, t, seed) {
    K.OR(p, x - 1, y, 3, 8, P.brown); K.OR(p, x - 2, y - 2, 5, 2, P.stoneD);
    const f = Math.floor(t * 8 + seed) % 3;
    K.R(p, x - 1, y - 6 + (f === 1 ? 1 : 0), 3, 4, P.gold); K.R(p, x, y - 7 - (f === 2 ? 1 : 0), 1, 3, P.goldL);
    if (f) K.dither(p, x - 8, y - 12, 17, 14, 'rgba(235,231,154,0.16)', 1);
  }
  function wallTv(t) { // flat TV on a wall bracket; the screen text is drawn crisp in tvLabel()
    const { x, y, w, h } = TV, cx = x + w / 2;
    K.R(p, cx - 6, y + 8, 12, h - 16, P.ink); K.R(p, cx - 5, y + 9, 10, h - 18, P.stoneD);       // bracket plate
    [[x + 4, y + 4], [x + w - 5, y + 4], [x + 4, y + h - 5], [x + w - 5, y + h - 5]].forEach(([bx, by]) => K.R(p, bx, by, 1, 1, P.stoneL));
    K.dither(p, x + 2, y + h + 1, w, 2, 'rgba(8,20,14,0.5)');                                       // shadow on the wall
    K.R(p, x - 1, y - 1, w + 2, h + 2, P.ink); K.R(p, x, y, w, h, P.stoneD); K.R(p, x, y, w, 1, P.stoneL);
    K.R(p, x + 2, y + 2, w - 4, h - 4, P.ink);
    const sx = x + 3, sy = y + 3, sw = w - 6, sh = h - 6, busy = S.prompt && !S.done && !S.error;
    K.R(p, sx, sy, sw, sh, P.forestD); K.dither(p, sx, sy, sw, sh, P.forest, 1);
    const scan = sy + Math.floor(K.step(t, 8) * (busy ? 24 : 6)) % sh;                              // rolling scanline
    K.R(p, sx, scan, sw, 1, busy ? P.mint : P.emerald);
    K.R(p, x + w - 5, y + h - 2, 2, 1, busy && Math.floor(t * 4) % 2 ? P.gold : P.mint);           // power LED
    if (S.done && t - S.done.t < 1.5 && Math.floor(t * 6) % 2) K.OR(p, sx, sy, sw, 1, P.goldL, P.goldL);
  }
  function world(t) {
    K.wall(p, 0, 0, LW, 200); K.R(p, 0, 199, LW, 1, P.ink); K.stoneFloor(p, 0, 200, LW, LH - 200);
    K.dither(p, 0, 200, LW, 3, P.stoneD);
    torch(20, 150, t, 0); torch(152, 150, t, 2); wallTv(t);
    const r = K.rng(5); for (let i = 0; i < 6; i++) K.flower(p, 8 + r() * 150, 258 + r() * 8, i % 2 ? P.gold : P.mintL);
    const st = K.step(t, 8), pend = pending(), busy = S.prompt && !S.done && !S.error;
    // beam from Byte's antenna to the ADBT panel while a tool call is out
    if (pend) {
      const [ax, ay] = [BYTE[0], BYTE[1] - 44], [bx, by] = BEAM_TO, N = 14;
      for (let i = 0; i < N; i++) {
        const u = ((i / N) + st * 0.8) % 1; const x = K.lerp(ax, bx, u), y = K.lerp(ay, by, u) - Math.sin(u * Math.PI) * 18;
        K.R(p, x - 1, y - 1, 2, 2, i % 3 ? P.mint : P.goldL);
      }
    }
    for (const k of S.calls) if (k.tRes) K.sparkle(p, BEAM_TO[0], BEAM_TO[1], t, k.tRes, k.isError ? P.red : P.goldL);
    // Gio
    const since = t - S.t0, doneAgo = S.done ? t - S.done.t : -1;
    let pose = 'idle', expr = 'happy';
    if (VOICE && !VOICE.error) { pose = 'wave'; expr = 'wow'; }
    else if (S.prompt && since < 1.4) { pose = 'point'; expr = 'grin'; }
    else if (S.error) expr = 'worried';
    else if (doneAgo >= 0 && doneAgo < 1.6) { pose = 'cheer'; expr = 'grin'; }
    else if (busy && pend) expr = 'wow';
    const hop = doneAgo >= 0 ? K.hop(t, S.done.t, 0.4, 6) + K.hop(t, S.done.t + 0.45, 0.4, 4) : 0;
    K.gio(p, GIO[0], GIO[1] - K.r(hop), { t, pose, expr, look: 1 });
    // Byte
    let face = 'eyes';
    if (S.error) face = '?'; else if (S.done) face = 'happy'; else if (pend) face = 'scroll'; else if (busy && S.answer) face = '!'; else if (busy) face = '?';
    K.byte(p, BYTE[0], BYTE[1], { t, face, level: 1, u: 2 });
  }

  // ---------- hi-res overlay ----------
  function header(box, title, right) {
    K.text(c, title, box.x + 30, box.y + 44, { font: K.F.arcade(22), color: P.goldL, align: 'left' });
    if (right) K.text(c, right, box.x + box.w - 30, box.y + 44, { font: K.F.px(30), color: P.mintL, align: 'right', shadow: false });
    c.fillStyle = P.mint; for (let x = box.x + 24; x < box.x + box.w - 24; x += 16) c.fillRect(x, box.y + 76, 8, 4);
  }
  function promptPanel(t) {
    const b = BOX_PROMPT; K.box(c, b.x, b.y, b.w, b.h, { fill: P.forestD });
    const inner = { x: b.x + 30, y: b.y + 96, w: b.w - 60, h: b.h - 170 };
    if (VOICE) { // live transcript while an attendee speaks
      header(b, 'YOU', VOICE.error ? 'mic error' : 'listening…');
      const said = (VOICE.final + ' ' + VOICE.interim).trim();
      const msg = VOICE.error || said || 'Ask your Fire TV question out loud…';
      const lines = layout(msg, inner.w, 34), hgt = lines.reduce((a, l) => a + l.h * 46, 0);
      c.save(); if (!said) c.globalAlpha = 0.6; drawLines(lines, inner, 34, 46, Math.max(0, hgt - inner.h)); c.restore();
      micIcon(b.x + 76, b.y + b.h - 52, t, !VOICE.error);
      K.text(c, VOICE.error ? 'Tap the mic to retry' : 'Pause to send · Esc to cancel', b.x + 136, b.y + b.h - 44, { font: K.F.px(28), color: VOICE.error ? P.red : P.mintL, align: 'left', shadow: false });
      return;
    }
    header(b, 'YOU', S.prompt ? 'to Claude' : '');
    if (!S.prompt) {
      drawLines(layout('Type a Fire TV question below, or press the **mic** and ask it out loud. Claude answers with the Amazon Devices Builder Tools MCP.', inner.w, 32), inner, 32, 44, 0);
      if (VOICE_OK) micIcon(b.x + 76, b.y + b.h - 52, t, false);
      return;
    }
    const vis = K.type(S.prompt, t, S.t0, 70);
    const lines = layout(vis, inner.w, 34), hgt = lines.reduce((a, l) => a + l.h * 46, 0);
    drawLines(lines, inner, 34, 46, Math.max(0, hgt - inner.h));
    if (vis.length < S.prompt.length && Math.floor(t * 4) % 2) { c.fillStyle = P.gold; c.fillRect(inner.x + inner.w - 20, inner.y + inner.h - 20, 14, 14); }
    // run stats
    const n = visibleCalls().length, secs = ((S.done || S.error) ? (S.done || S.error).t : t) - S.t0;
    let s = `${n} ADBT call${n === 1 ? '' : 's'} · ${secs.toFixed(0)} s`;
    K.text(c, s, b.x + 30, b.y + b.h - 36, { font: K.F.px(30), color: S.error ? P.red : P.mintL, align: 'left', shadow: false });
  }
  function argSummary(k) {
    const i = k.input; const v = i.query || i.document_uri || i.uri || i.documentType || Object.values(i).find(x => typeof x === 'string') || '';
    return String(v);
  }
  function resultText(k) { // turn an ADBT result into readable preview lines
    let j = null; try { j = JSON.parse(k.result); } catch { /* plain document */ }
    if (Array.isArray(j) && j.length && j[0].uri) return j.slice(0, 6).map(r => `- \`${r.uri}\`` + (r.snippet ? ' ' + r.snippet.replace(/[\s#*`>|]+/g, ' ').trim().slice(0, 110) : '')).join('\n');
    if (j && j.error) return `**${j.error}** ${j.message || ''}`;
    return k.result.replace(/\n{3,}/g, '\n\n').trim();
  }
  function adbtPanel(t) {
    const b = BOX_ADBT, calls = visibleCalls(); K.box(c, b.x, b.y, b.w, b.h, { fill: P.ink, border: P.mint });
    header(b, 'ADBT MCP', calls.length ? `${calls.length} tool call${calls.length === 1 ? '' : 's'}` : '');
    if (!calls.length) {
      const msg = !S.prompt ? 'Tool calls and what ADBT sends back show up here.' : S.error ? '' : 'Connecting to ADBT' + '.'.repeat(1 + Math.floor(t * 3) % 3);
      K.text(c, msg, b.x + 30, b.y + 130, { font: K.F.px(32, 600), color: P.stoneL, align: 'left', shadow: false }); return;
    }
    // a window of three calls: follows the newest unless the user scrolled the list
    const maxFirst = Math.max(0, calls.length - ROWS), first = S.rowFirst == null ? maxFirst : Math.min(S.rowFirst, maxFirst);
    const rows = calls.slice(first, first + ROWS), y0 = b.y + 120, shown = pickedCall(calls);
    HIT.rows = { x: b.x + 16, y: y0 - 28, w: b.w - 32, h: ROWS * 56 }; HIT.rowIds = rows.map(k => k.id);
    if (maxFirst > 0) scrollBar(b.x + b.w - 20, y0 - 26, ROWS * 56 - 4, first, maxFirst, ROWS / calls.length);
    rows.forEach((k, i) => {
      const y = y0 + i * 56, live = !k.tRes, a = K.prog(t, k.t, 0.25);
      c.save(); c.globalAlpha = a;
      if (live) { c.fillStyle = P.forest; c.fillRect(b.x + 16, y - 26, b.w - 44, 52); }
      if (k === shown && calls.length > 1) { c.fillStyle = P.gold; c.fillRect(b.x + 16, y - 26, 6, 52); }
      const ix = b.x + 42;
      if (live) { c.fillStyle = Math.floor(t * 4) % 2 ? P.gold : P.goldD; c.fillRect(ix - 8, y - 8, 16, 16); }
      else if (k.isError) { c.fillStyle = P.red; for (let d = -8; d <= 4; d += 4) { c.fillRect(ix + d, y + d, 4, 4); c.fillRect(ix + d, y - d - 4, 4, 4); } }
      else { c.fillStyle = P.mint; c.fillRect(ix - 10, y, 6, 6); c.fillRect(ix - 4, y + 6, 6, 6); c.fillRect(ix + 2, y, 6, 6); c.fillRect(ix + 8, y - 6, 6, 6); }
      c.font = K.F.mono(30); const nw = c.measureText(k.name).width;
      K.text(c, k.name, ix + 36, y + 2, { font: K.F.mono(30), color: live ? P.goldL : P.gold, align: 'left', shadow: false });
      K.text(c, trunc(argSummary(k), 60), ix + 60 + nw, y + 2, { font: K.F.px(30, 600), color: P.paper, align: 'left', shadow: false });
      c.restore();
    });
    // what ADBT returned for the picked call (default: the latest answered one)
    const last = shown;
    const py = y0 + 3 * 56 - 6; c.fillStyle = P.stoneD; c.fillRect(b.x + 24, py - 18, b.w - 48, 4);
    const box = { x: b.x + 30, y: py, w: b.w - 60, h: b.y + b.h - py - 20 };
    if (!last) { K.text(c, 'Waiting for ADBT' + '.'.repeat(1 + Math.floor(t * 3) % 3), box.x, box.y + 30, { font: K.F.px(28, 600), color: P.stoneL, align: 'left', shadow: false }); return; }
    if (last._src !== last.result) { last._src = last.result; last._lines = layout(resultText(last), box.w, 26); }
    const idx = calls.indexOf(last) + 1;
    K.text(c, `ADBT returned${calls.length > 1 ? ` (call ${idx} of ${calls.length})` : ''}:`, box.x, box.y + 18, { font: K.F.px(26), color: P.mintL, align: 'left', shadow: false });
    const inner = { x: box.x, y: box.y + 38, w: box.w - 24, h: box.h - 38 };
    const total = last._lines.reduce((a, l) => a + l.h * 32, 0), room = Math.max(0, total - inner.h);
    const off = last.scroll != null ? K.clamp(last.scroll, 0, room) : Math.min(room, Math.max(0, (t - last.tRes - 1.2) * 40)); // Byte skims until you scroll
    last._off = off; last._room = room; HIT.preview = inner; HIT.previewCall = last;
    drawLines(last._lines, inner, 26, 32, K.r(off / 4) * 4);
    if (room > 0) scrollBar(b.x + b.w - 20, inner.y, inner.h, off, room, inner.h / total);
  }
  function answerPanel(t, dt) {
    const b = BOX_ANS; K.box(c, b.x, b.y, b.w, b.h, { fill: P.forestD });
    header(b, 'CLAUDE + ADBT', S.done ? 'answer' : S.answer ? 'writing…' : '');
    const inner = { x: b.x + 30, y: b.y + 96, w: b.w - 60, h: b.h - 116 };
    if (S.error) { drawLines(layout(`**Something went wrong.** ${S.error.text}`, inner.w, 30), inner, 30, 40, 0); return; }
    const back = S.answer.length - S.shown; S.shown = Math.min(S.answer.length, S.shown + Math.max(60, back * 2) * dt);
    if (!S.answer) {
      if (S.prompt && !S.done) K.text(c, 'Byte is asking ADBT' + '.'.repeat(1 + Math.floor(t * 3) % 3), inner.x, inner.y + 24, { font: K.F.px(32, 600), color: P.stoneL, align: 'left', shadow: false });
      return;
    }
    const vis = S.answer.slice(0, Math.floor(S.shown));
    if (S._vis !== vis) { S._vis = vis; S._lines = layout(vis, inner.w, 32); }
    const total = S._lines.reduce((a, l) => a + l.h * 42, 0), room = Math.max(0, total - inner.h);
    const off = S.scroll == null ? room : K.clamp(S.scroll, 0, room);
    S._off = off; S._room = room; HIT.answer = inner;
    drawLines(S._lines, inner, 32, 42, off);
    if (room > 0) scrollBar(b.x + b.w - 20, inner.y, inner.h, off, room, inner.h / total);
  }
  function tvLabel(t) {
    const cx = (TV.x + TV.w / 2) * 4, cy = (TV.y + TV.h / 2) * 4, done = S.done && t - S.done.t < 1.5;
    K.text(c, 'VEGA OS', cx + 2, cy + 3, { font: K.F.arcade(18), color: done ? P.goldL : P.mintL, shadow: false });
  }
  function byteBubble(t) {
    if (!S.prompt) return;
    const pend = pending();
    let s = null;
    if (S.error) s = 'Oops'; else if (S.done) s = t - S.done.t < 4 ? 'Done!' : null;
    else if (pend) s = { search_documentation: 'Searching docs', read_document: 'Reading a doc', list_documents: 'Listing docs', set_project_context: 'Opening ADBT', read_asset: 'Reading an asset' }[pend.name] || pend.name;
    else if (S.answer) s = 'Writing…'; else if (t - S.t0 > 1.2) s = 'Hmm…';
    if (s) K.bubble(c, s, BYTE[0] * 4, (BYTE[1] - 50) * 4, { size: 32 });
  }

  // ---------- frame loop ----------
  let lastKey = 0;
  function typingTicks(t) { // typewriter ticks while the prompt or the answer is being revealed
    if (!S.prompt || t - lastKey < 0.06) return;
    const typingPrompt = K.type(S.prompt, t, S.t0, 70).length < S.prompt.length, typingAnswer = !S.error && S.shown < S.answer.length;
    if (typingPrompt || typingAnswer) { lastKey = t; SFX.play('key', { g: typingPrompt ? 1 : 0.7, pan: (SFX.rnd() - 0.5) * 0.5 }); }
  }
  let last = now();
  function frame() {
    const t = now(), dt = Math.min(0.1, t - last); last = t;
    for (const k in HIT) delete HIT[k];
    p.setTransform(1, 0, 0, 1, 0, 0); p.imageSmoothingEnabled = false; world(t);
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(lo, 0, 0, W, H);
    promptPanel(t); adbtPanel(t); answerPanel(t, dt); tvLabel(t); byteBubble(t);
    typingTicks(t);
    requestAnimationFrame(frame);
  }
  // ---------- scrolling: wheel / trackpad, drag (mouse or touch), click a call to see its result ----------
  const inside = (r, x, y) => r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
  const toCanvas = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  const regionAt = (x, y) => ['rows', 'preview', 'answer'].find(k => inside(HIT[k], x, y));
  let rowAcc = 0;
  function scrollRegion(region, dy) {
    if (region === 'answer') { if (S._room) S.scroll = K.clamp((S.scroll == null ? S._off : S.scroll) + dy, 0, S._room); if (S.scroll >= S._room) S.scroll = null; }
    else if (region === 'preview') { const k = HIT.previewCall; if (k && k._room) k.scroll = K.clamp((k.scroll == null ? k._off : k.scroll) + dy, 0, k._room); }
    else if (region === 'rows') {
      const n = visibleCalls().length, maxFirst = Math.max(0, n - ROWS); rowAcc += dy;
      const steps = Math.trunc(rowAcc / 56); if (!steps) return; rowAcc -= steps * 56;
      const f = K.clamp((S.rowFirst == null ? maxFirst : S.rowFirst) + steps, 0, maxFirst); S.rowFirst = f >= maxFirst ? null : f;
    }
  }
  cv.addEventListener('wheel', e => {
    const region = regionAt(...toCanvas(e)); if (!region) return; e.preventDefault();
    scrollRegion(region, e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY);
  }, { passive: false });
  let drag = null;
  cv.addEventListener('pointerdown', e => {
    const [x, y] = toCanvas(e), region = regionAt(x, y); if (!region) return;
    drag = { region, y, y0: y, x0: x }; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return; const [, y] = toCanvas(e); scrollRegion(drag.region, drag.y - y); drag.y = y;
  });
  cv.addEventListener('pointerup', e => {
    if (!drag) return; const [x, y] = toCanvas(e);
    if (drag.region === 'rows' && Math.abs(y - drag.y0) < 8 && Math.abs(x - drag.x0) < 8) { // a click, not a drag
      const id = HIT.rowIds[Math.floor((y - HIT.rows.y) / 56)]; if (id) { S.pick = id; SFX.play('key', { g: 3 }); }
    }
    drag = null;
  });
  cv.addEventListener('pointermove', e => { if (!drag) { const [x, y] = toCanvas(e), r = regionAt(x, y); cv.style.cursor = r === 'rows' ? 'pointer' : r ? 'grab' : ''; } });

  // ---------- recording ----------
  let rec = null, stopTimer = null;
  function startRec(name) {
    if (!document.getElementById('rec').checked || rec) return;
    const type = ['video/webm;codecs=vp9,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
    const audio = SFX.stream(), tracks = [...cv.captureStream(30).getVideoTracks(), ...(audio ? audio.getAudioTracks() : [])];
    const chunks = []; rec = new MediaRecorder(new MediaStream(tracks), { mimeType: type, videoBitsPerSecond: 8e6 });
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(chunks, { type })); a.download = `ask-byte-${name}.webm`; a.click(); rec = null; };
    rec.start();
  }
  function finish() { busy(false); if (rec) { clearTimeout(stopTimer); stopTimer = setTimeout(() => rec && rec.stop(), 4000); } }

  // ---------- asking + replay ----------
  const $ = id => document.getElementById(id);

  // ---------- voice: Web Speech API -> text -> ask ----------
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition, VOICE_OK = !!Speech;
  let VOICE = null, speech = null;
  function listen() {
    if (!VOICE_OK) return;
    if (speech) { speech.stop(); return; }              // second tap: send what we have
    SFX.init(); SFX.play('chirp');
    VOICE = { final: '', interim: '', error: null, cancel: false, before: $('prompt').value };
    speech = new Speech(); speech.lang = $('lang').value; speech.interimResults = true; speech.continuous = false;
    speech.onresult = e => {
      let fin = '', mid = '';
      for (const r of e.results) (r.isFinal ? (fin += r[0].transcript) : (mid += r[0].transcript));
      VOICE.final = fin.trim(); VOICE.interim = mid.trim(); $('prompt').value = (VOICE.final + ' ' + VOICE.interim).trim();
    };
    speech.onerror = e => {
      if (e.error === 'aborted') return;
      VOICE.error = { 'not-allowed': 'Microphone access was blocked. Allow it in the browser and try again.', 'no-speech': "Didn't hear anything.", 'network': 'Speech service unreachable (check the network).' }[e.error] || `Speech error: ${e.error}`;
    };
    speech.onend = () => {
      const v = VOICE, q = v ? (v.final + ' ' + v.interim).trim() : ''; speech = null; $('mic').classList.remove('on');
      if (v && v.error) { SFX.play('sad'); setTimeout(() => { if (VOICE === v) VOICE = null; }, 3500); return; }
      VOICE = null;
      if (v && !v.cancel && q) { $('prompt').value = q; ask(q, $('platform').value); }
    };
    $('mic').classList.add('on'); speech.start();
  }
  function cancelListen() { if (speech && VOICE) { VOICE.cancel = true; $('prompt').value = VOICE.before; speech.abort(); VOICE = null; } }
  if (!VOICE_OK) { $('mic').disabled = true; $('mic').title = 'Voice input needs Chrome, Edge or Safari'; }
  $('mic').addEventListener('click', listen);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cancelListen();
    else if ((e.key === 'm' || e.key === 'M') && !/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); listen(); }
  });
  let ctrl = null, timers = [];
  function busy(b) { $('ask').textContent = b ? 'Stop' : 'Ask'; $('ask').dataset.busy = b ? '1' : ''; }
  function reset(prompt) { if (ctrl) ctrl.abort(); timers.forEach(clearTimeout); timers = []; if (rec) { clearTimeout(stopTimer); rec.stop(); } S = fresh(prompt); }
  async function ask(prompt, platform) {
    SFX.init(); reset(prompt); busy(true); SFX.play('question'); startRec(new Date().toISOString().slice(0, 19).replace(/:/g, '-'));
    ctrl = new AbortController();
    try {
      const res = await fetch('/api/ask', { method: 'POST', body: JSON.stringify({ prompt, platform }), signal: ctrl.signal });
      if (!res.ok) throw new Error(await res.text());
      const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); let i;
        while ((i = buf.indexOf('\n\n')) >= 0) { const chunk = buf.slice(0, i); buf = buf.slice(i + 2); if (chunk.startsWith('data: ')) apply(JSON.parse(chunk.slice(6))); }
      }
      if (!S.done && !S.error) apply({ type: 'error', text: 'Stream ended early.' });
      loadSessions();
    } catch (e) { if (e.name !== 'AbortError') apply({ type: 'error', text: e.message }); else busy(false); }
  }
  function replay(sess) {
    SFX.init(); reset(sess.prompt); busy(true); SFX.play('question'); startRec(sess.id);
    let at = 600 + sess.prompt.length / 70 * 1000, prev = 0; // let the prompt type in first
    for (const ev of sess.events) {
      const gap = ev.at - prev; prev = ev.at; at += Math.min(gap, ev.type === 'delta' ? 120 : 1600); // squeeze long waits
      timers.push(setTimeout(() => apply(ev), at));
    }
  }
  async function loadSessions() {
    const list = await fetch('/api/sessions').then(r => r.json()).catch(() => []);
    $('replay').innerHTML = '<option value="">Replay…</option>' + list.map(s => `<option value="${s.id}">${trunc(s.prompt, 50).replace(/</g, '&lt;')}</option>`).join('');
  }
  $('f').addEventListener('submit', e => {
    e.preventDefault();
    if ($('ask').dataset.busy) { reset(S.prompt); busy(false); return; }
    const q = $('prompt').value.trim(); if (q) ask(q, $('platform').value);
  });
  $('preset').addEventListener('change', e => { // fill the prompt; edit it or press Enter to ask
    if (!e.target.value) return; $('prompt').value = e.target.value; e.target.value = ''; $('prompt').focus();
  });
  $('sound').addEventListener('change', e => { SFX.enabled = e.target.checked; });
  $('prompt').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('f').requestSubmit(); } });
  $('replay').addEventListener('change', async e => {
    if (!e.target.value) return; const s = await fetch('/api/sessions/' + e.target.value).then(r => r.json()); e.target.value = ''; replay(s);
  });

  Promise.all(['700 20px "Pixelify Sans"', '600 20px "Pixelify Sans"', '400 20px "Press Start 2P"', '700 20px "JetBrains Mono"'].map(f => document.fonts.load(f)))
    .then(() => { loadSessions(); requestAnimationFrame(frame); });
  window.LIVE = { apply, replay, state: () => S };
})();
