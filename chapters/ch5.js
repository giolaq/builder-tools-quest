// Chapter 5 — "First app" (bars 26–32, 50–64 s). A pixel workshop / forge.
(function () {
  const K = window.K, P = K.P;
  const T0 = K.at(26), T_CLI = K.at(27, 3), T_B = K.at(29, 1), T_I = K.at(29, 2), T_L = K.at(29, 3),
    T_TV = K.at(30, 3), T_OK = K.at(31, 3), T_END = K.at(33);
  const T_TAP = T_OK + 0.9;          // Gio taps "Yes"
  const T_GRIN = T_TAP + 0.4;
  const GX = 70, GY = 352, BX = 214, BY = 352; // Gio / Byte feet (low-res)
  const TILE = [{ x: 70, lab: 'Build', t: T_B }, { x: 135, lab: 'Install', t: T_I }, { x: 200, lab: 'Launch', t: T_L }];
  const TY = 104, TS = 48;           // icon tiles top / size
  const TVX = 48, TVY = 98, TVW = 174, TVH = 100;
  const PR = { x: 96, y: 284, w: 84, h: 50 };  // "Allow?" prompt (low-res)

  // ---------------- low-res helpers ----------------
  function planks(p, y0, y1) {
    K.R(p, 0, y0, 270, y1 - y0, P.brown);
    for (let y = y0, row = 0; y < y1; y += 10, row++) {
      K.R(p, 0, y, 270, 1, P.brownD); K.R(p, 0, y + 1, 270, 1, K.lighten(P.brown, 0.12));
      for (let x = (row % 2) * 23 + 5; x < 270; x += 46) K.R(p, x, y, 1, 10, P.brownD);
    }
    K.dither(p, 0, y0, 270, 3, 'rgba(10,15,12,0.5)');
  }
  function furnace(p, t) {
    // hood + chimney on the left wall
    K.R(p, 6, 0, 30, 186, P.stoneD); for (let y = 4; y < 186; y += 8) K.R(p, 7, y, 28, 1, P.ink);
    K.R(p, 6, 0, 1, 186, P.ink); K.R(p, 35, 0, 1, 186, P.ink);
    K.block(p, 0, 186, 44, 10, P.stone);
    // body
    K.block(p, 2, 196, 40, 66, P.stoneL);
    for (let y = 202; y < 262; y += 8) for (let x = 3 + ((y / 8) % 2) * 5; x < 41; x += 10) K.R(p, x, y, 1, 7, P.stone);
    // mouth + fire (gold = warm glow, no red)
    K.R(p, 9, 222, 26, 26, P.ink); K.R(p, 11, 224, 22, 22, P.brownD);
    const f = Math.floor(t * 8);
    for (let i = 0; i < 11; i++) {
      const h = 6 + ((i * 7 + f * 3) % 9);
      K.R(p, 11 + i * 2, 246 - h, 2, h, i % 2 ? P.gold : P.goldD);
      K.R(p, 11 + i * 2, 246 - Math.floor(h / 2), 2, Math.floor(h / 2), P.goldL);
    }
    K.R(p, 11, 243, 22, 3, P.paper);
    // floating embers
    for (let k = 0; k < 5; k++) {
      const ph = (t * 0.7 + k * 0.23) % 1, ex = 16 + ((k * 13) % 14) + Math.round(Math.sin(t * 3 + k) * 2), ey = 220 - Math.floor(ph * 60);
      if (ey > 186 || ey < 40) continue; K.R(p, ex + 24, ey, 1, 1, ph < 0.5 ? P.goldL : P.gold);
    }
  }
  function rack(p) {
    // tool rack on the right wall
    K.block(p, 228, 206, 40, 4, P.brown);
    // hammer
    K.R(p, 234, 210, 2, 18, P.brownD); K.OR(p, 231, 226, 8, 4, P.stoneL);
    // tongs
    K.R(p, 246, 210, 1, 24, P.stoneD); K.R(p, 249, 210, 1, 24, P.stoneD); K.R(p, 245, 233, 3, 2, P.stoneD); K.R(p, 248, 233, 3, 2, P.stoneD);
    // saw
    K.R(p, 256, 210, 2, 6, P.brownD); K.OR(p, 255, 216, 6, 14, P.stoneL); for (let y = 217; y < 230; y += 2) K.R(p, 261, y, 1, 1, P.stoneD);
  }
  function lamp(p, x, t) {
    K.R(p, x, 0, 1, 50, P.ink);
    K.OR(p, x - 4, 50, 9, 4, P.stoneD); K.R(p, x - 3, 54, 7, 3, P.goldL); K.R(p, x - 2, 57, 5, 1, P.gold);
    if (Math.floor(t * 2 + x) % 5) K.dither(p, x - 8, 58, 17, 4, 'rgba(235,231,154,0.25)', 1);
  }
  function sign(p) {
    K.R(p, 110, 58, 1, 8, P.ink); K.R(p, 160, 58, 1, 8, P.ink);
    K.block(p, 94, 66, 82, 20, P.brown); K.R(p, 96, 68, 78, 1, K.lighten(P.brown, 0.3));
  }
  function scene(p, t) {
    K.wall(p, 0, 0, 270, 262);
    K.dither(p, 0, 0, 270, 262, 'rgba(8,20,14,0.35)');
    K.R(p, 0, 258, 270, 4, P.stoneD);
    planks(p, 262, 480);
    // rug under the characters
    K.R(p, 40, 334, 200, 30, P.forest); K.R(p, 42, 336, 196, 26, P.emerald); K.dither(p, 44, 338, 192, 22, P.forest, 1);
    K.R(p, 40, 348, 200, 1, P.gold);
    furnace(p, t); rack(p); lamp(p, 70, t); lamp(p, 200, t); sign(p);
    // anvil + workbench, low in frame (scenery under caption area is fine)
    K.block(p, 180, 392, 60, 8, P.brownD); K.R(p, 186, 400, 4, 30, P.brownD); K.R(p, 230, 400, 4, 30, P.brownD);
    K.OR(p, 30, 402, 34, 6, P.stoneD); K.OR(p, 38, 408, 18, 8, P.stone); K.OR(p, 34, 416, 26, 4, P.stoneD);
  }
  // mini keyboard held by Gio while typing
  function keyboard(p, x, y, t) {
    K.OR(p, x - 13, y, 26, 7, P.stoneD);
    const f = Math.floor(t * 12);
    for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) {
      const lit = ((i + j * 3 + f) * 7) % 11 === 0;
      K.R(p, x - 12 + i * 4, y + 1 + j * 3, 3, 2, lit ? P.goldL : P.paperD);
    }
  }
  // icon tiles
  function tile(p, i, t, vis) {
    const d = TILE[i], x = d.x - TS / 2, lit = t >= d.t, fl = lit && t < d.t + 0.15;
    const yy = TY + vis;
    K.R(p, x - 2, yy - 2, TS + 4, TS + 4, P.ink);
    K.R(p, x - 1, yy - 1, TS + 2, TS + 2, lit ? (fl ? P.goldL : P.gold) : P.stone);
    K.R(p, x, yy, TS, TS, lit ? P.forest : P.stoneD);
    K.dither(p, x + 1, yy + 1, TS - 2, TS - 2, lit ? P.forestD : P.ink);
    const cx = d.x, cy = yy + TS / 2;
    const dim = c => lit ? c : K.lighten(c, -0.45);
    if (i === 0) { // hammer striking an anvil
      K.OR(p, cx - 12, cy + 8, 24, 4, dim(P.stoneL)); K.R(p, cx - 12, cy + 8, 24, 1, dim(P.paper));
      K.OR(p, cx - 6, cy + 12, 12, 5, dim(P.stone)); K.OR(p, cx - 10, cy + 17, 20, 3, dim(P.stoneD));
      K.R(p, cx - 16, cy + 8, 4, 2, dim(P.stoneL));
      const u = K.prog(t, d.t - 0.2, 0.2), up = lit ? (t < d.t + 0.3 ? 0 : 1) : 1 - u; // raised → strike on beat
      const hy = up > 0.5 ? cy - 12 : cy - 2;
      K.OR(p, cx + 2, hy + 3, 3, 12 - (up > 0.5 ? 0 : 4), dim(P.brown));
      K.OR(p, cx - 3, hy - 3, 13, 6, dim(P.stoneL)); K.R(p, cx - 3, hy - 3, 13, 1, dim(P.paper));
      if (lit) K.sparkle(p, cx, cy + 6, t, d.t, P.goldL, 0.45);
    } else if (i === 1) { // box dropping into a slot
      K.OR(p, cx - 14, cy + 10, 28, 8, dim(P.stoneL)); K.R(p, cx - 10, cy + 10, 20, 3, P.ink);
      const u = K.ease.in(K.prog(t, d.t - 0.35, 0.35));
      const by = Math.round(K.lerp(cy - 20, cy - 1, u));
      if (t < d.t + 0.2 || !lit) {
        K.OR(p, cx - 8, by, 16, 12, dim(P.brown)); K.R(p, cx - 8, by, 16, 1, dim(K.lighten(P.brown, 0.3)));
        K.R(p, cx - 1, by, 2, 12, dim(P.gold));
      } else {
        K.OR(p, cx - 8, cy + 3, 16, 7, P.brown); K.R(p, cx - 1, cy + 3, 2, 7, P.gold);
        K.R(p, cx - 10, cy + 10, 20, 1, P.mint);
      }
      if (lit) { K.R(p, cx - 1, cy - 18, 2, 6, P.mintL); K.R(p, cx - 3, cy - 14, 6, 1, P.mintL); K.R(p, cx - 2, cy - 13, 4, 1, P.mintL); }
      if (lit) K.sparkle(p, cx, cy + 10, t, d.t, P.mintL, 0.45);
    } else { // play arrow
      const c1 = dim(P.gold), c2 = dim(P.goldL);
      for (let j = -12; j <= 12; j++) { const w = Math.round((12 - Math.abs(j)) * 1.6) + 1; K.R(p, cx - 9, cy + j, w, 1, j < 0 ? c2 : c1); }
      for (let j = -13; j <= 13; j++) { const w = Math.round((12 - Math.abs(j)) * 1.6) + 2; K.R(p, cx - 10 + w, cy + j, 1, 1, P.ink); }
      K.R(p, cx - 10, cy - 13, 1, 27, P.ink);
      if (lit) K.sparkle(p, cx + 14, cy - 12, t, d.t, P.goldL, 0.5);
    }
    // step-lit check
    if (lit && t > d.t + 0.3) { const kx = x + TS - 9, ky = yy + 3; K.R(p, kx, ky + 3, 2, 2, P.mintL); K.R(p, kx + 2, ky + 4, 2, 2, P.mintL); K.R(p, kx + 4, ky + 2, 2, 2, P.mintL); K.R(p, kx + 6, ky, 2, 2, P.mintL); }
  }
  function arrow(p, x, y, on) {
    const c = on ? P.gold : P.stone;
    K.R(p, x - 1, y - 1, 6, 4, P.ink); K.R(p, x, y, 4, 2, c); K.R(p, x + 4, y - 3, 1, 8, P.ink);
    K.R(p, x + 4, y - 2, 2, 6, c); K.R(p, x + 6, y - 1, 1, 4, c); K.R(p, x + 7, y, 1, 2, c);
  }
  function tvScreen(t) {
    return (p, sx, sy, sw, sh) => {
      const u = t - T_TV;
      if (u < 0.25) { // static boot
        const r = K.rng(1 + Math.floor(t * 30));
        for (let y = sy; y < sy + sh; y += 2) for (let x = sx; x < sx + sw; x += 2) K.R(p, x, y, 2, 2, r() < 0.5 ? P.stoneL : P.ink);
        return;
      }
      K.R(p, sx, sy, sw, sh, P.forest);
      K.dither(p, sx, sy, sw, sh, P.forestD);
      // scanline + pixel stars
      const r = K.rng(7);
      for (let k = 0; k < 18; k++) { const x = sx + Math.floor(r() * sw), y = sy + Math.floor(r() * sh); if ((k + Math.floor(t * 4)) % 3) K.R(p, x, y, 1, 1, P.mint); }
      K.R(p, sx + 10, sy + sh - 16, sw - 20, 3, P.emerald); K.R(p, sx + 10, sy + sh - 16, Math.round((sw - 20) * K.clamp(u / 0.8)), 3, P.gold);
    };
  }
  function prompt(p, t) {
    const a = K.prog(t, T_OK, 0.2); if (a <= 0) return;
    const s = Math.round(4 * (1 - K.ease.back(a))); // stepped pop
    const x = PR.x + s, y = PR.y + s, w = PR.w - 2 * s, h = PR.h - 2 * s;
    K.R(p, x - 1, y - 1, w + 2, h + 2, P.ink); K.R(p, x, y, w, h, P.paper); K.R(p, x, y, w, 9, P.gold); K.R(p, x, y + 9, w, 1, P.ink);
    K.R(p, x + w - 7, y + 3, 4, 3, P.goldD);
    if (a < 1) return;
    const tapped = t >= T_TAP;
    // Yes / No buttons
    K.R(p, PR.x + 4, PR.y + 30, 36, 15, P.ink); K.R(p, PR.x + 5, PR.y + 31, 34, 13, tapped ? (t < T_TAP + 0.15 ? P.goldL : P.gold) : P.mint);
    K.R(p, PR.x + 44, PR.y + 30, 36, 15, P.ink); K.R(p, PR.x + 45, PR.y + 31, 34, 13, P.paperD);
    if (tapped) K.sparkle(p, PR.x + 22, PR.y + 37, t, T_TAP, P.goldL, 0.45);
  }

  // ---------------- hi-res helpers ----------------
  function bubble2(c, lines, cx, tx, ty, size, shown, alpha) {
    if (alpha <= 0) return;
    c.save(); c.globalAlpha *= alpha; c.font = K.F.px(size);
    const w = Math.ceil(Math.max(...lines.map(l => c.measureText(l).width)) + 64), lh = Math.round(size * 1.25), h = lines.length * lh + 36;
    const x = Math.round(cx - w / 2), y = ty - 24 - h;
    c.fillStyle = P.ink; c.fillRect(x - 4, y - 4, w + 8, h + 8); c.fillRect(tx - 12, ty - 24, 24, 8); c.fillRect(tx - 8, ty - 16, 16, 8); c.fillRect(tx - 4, ty - 8, 8, 8);
    c.fillStyle = P.paper; c.fillRect(x, y, w, h); c.fillRect(tx - 8, ty - 28, 16, 8); c.fillRect(tx - 4, ty - 20, 8, 8);
    c.fillStyle = P.paperD; c.fillRect(x, y + h - 4, w, 4);
    c.fillStyle = P.ink; c.textAlign = 'left'; c.textBaseline = 'middle';
    let used = 0, lastX = x + 32, lastY = y + 18 + lh / 2;
    lines.forEach((ln, i) => {
      const vis = ln.slice(0, Math.max(0, shown - used)); used += ln.length;
      const yy = y + 18 + lh * i + lh / 2 + 2; c.fillText(vis, x + 32, yy);
      if (vis.length) { lastX = x + 32 + c.measureText(vis).width; lastY = yy; }
    });
    if (Math.floor(K.step(c.__t || 0, 4) * 4) % 2 === 0) { c.fillStyle = P.emerald; c.fillRect(lastX + 6, lastY - size * 0.45, 6, size * 0.85); }
    c.restore();
  }

  window.CH[5] = {
    lo(p, t) {
      scene(p, t);
      // ---- stage (upper wall) ----
      // icons (29.1 … until the TV arrives)
      if (t >= T_B - 0.6 && t < T_TV) {
        const vis = Math.round(-60 * (1 - K.ease.out(K.prog(K.step(t, 12), T_B - 0.6, 0.4))));
        for (let i = 0; i < 3; i++) tile(p, i, t, vis);
        arrow(p, 98, TY + vis + TS / 2 - 1, t >= T_I); arrow(p, 163, TY + vis + TS / 2 - 1, t >= T_L);
      }
      if (t >= T_TV - 0.05 && t < T_TV + 0.4) { TILE.forEach(d => K.poof(p, d.x, TY + TS / 2, t, T_TV - 0.05, 0.4)); }
      // TV drops in on 30.3
      if (t >= T_TV - 0.2) {
        const u = K.ease.back(K.prog(K.step(t, 15), T_TV - 0.2, 0.35));
        const y = Math.round(K.lerp(-TVH - 20, TVY, u));
        K.R(p, TVX + 30, 86, 1, Math.max(0, y - 86), P.ink); K.R(p, TVX + TVW - 30, 86, 1, Math.max(0, y - 86), P.ink);
        K.tv(p, TVX, y, TVW, TVH, t >= T_TV ? tvScreen(t) : (pp, sx, sy, sw, sh) => K.R(pp, sx, sy, sw, sh, P.forestD));
        if (t >= T_TV + 0.25) { K.sparkle(p, TVX + 6, y + 6, t, T_TV + 0.25); K.sparkle(p, TVX + TVW - 6, y + 10, t, T_TV + 0.4); K.sparkle(p, TVX + TVW / 2, y - 4, t, T_TV + 0.55); }
      }
      // data cable from Byte to terminal during the CLI beat
      if (t >= T_CLI && t < T_B - 0.3) {
        const on = Math.floor(t * 10);
        for (let y = 222; y < BY - 70; y += 3) K.R(p, BX, y, 1, 2, ((y / 3 + on) % 4) === 0 ? P.goldL : P.mint);
      }
      prompt(p, t);

      // ---- characters ----
      const typing = t < T_CLI + 0.2;
      let pose = typing ? 'read' : 'idle', expr = 'happy', look = 1;
      if (t >= T_TV) expr = 'wow';
      if (t >= T_TV + 0.8) expr = 'happy';
      if (t >= T_OK + 0.3 && t < T_TAP + 0.35) pose = 'point';
      if (t >= T_GRIN) { expr = 'grin'; pose = t >= T_GRIN + 0.8 ? 'cheer' : 'idle'; }
      if (t >= T_B - 0.6 && t < T_OK) look = 0;
      const hop = t >= T_GRIN + 0.8 ? Math.round(K.hop(t, T_GRIN + 0.8, 0.4, 5) + K.hop(t, T_GRIN + 1.3, 0.4, 3)) : 0;
      K.gio(p, GX, GY - hop, { t, pose, expr, u: 2, look });
      if (typing) keyboard(p, GX, GY - 26, t);
      // Byte
      let face = 'eyes';
      if (t >= T_CLI - 0.2 && t < T_B - 0.3) face = 'scroll';
      else if (t >= T_B - 0.3 && t < T_TV + 0.4) face = 'eyes';
      else if (t >= T_TV + 0.4 && t < T_OK) face = 'happy';
      else if (t >= T_OK && t < T_TAP) face = '?';
      else if (t >= T_TAP) face = 'happy';
      const bhop = Math.round(K.hop(t, T_CLI - 0.2, 0.3, 4) + K.hop(t, T_TAP + 0.1, 0.35, 5));
      K.byte(p, BX, BY - bhop, { t, face, level: 1, u: 3 });
    },

    hi(c, t) {
      c.__t = t;
      // workshop sign
      K.text(c, 'Workshop', 540, 305, { font: K.F.px(44), color: P.goldL });

      // 26.1 Gio's request bubble (typed)
      const bA = t < T_CLI ? K.prog(t, T0 + 0.15, 0.15) : 1 - K.prog(t, T_CLI + 0.3, 0.25);
      if (bA > 0) {
        const lines = ['Set up a Vega', 'hello world app.'];
        const shown = Math.floor((t - T0 - 0.2) * 16);
        bubble2(c, lines, 400, GX * 4 + 24, (GY - 72) * 4 + 8, 56, shown, bA);
      }

      // 27.3 terminal
      const tA = K.prog(t, T_CLI - 0.1, 0.2) * (1 - K.prog(t, T_B - 0.6, 0.25));
      if (tA > 0) {
        c.save(); c.globalAlpha = tA;
        const x = 90, y = 400, w = 900, h = 470;
        K.box(c, x, y, w, h, { fill: P.ink, border: P.mint });
        c.fillStyle = P.forestD; c.fillRect(x + 4, y + 4, w - 8, 60);
        [P.stoneL, P.stoneL, P.mint].forEach((col, i) => { c.fillStyle = col; c.fillRect(x + 28 + i * 36, y + 26, 20, 20); });
        K.text(c, 'terminal', x + w - 30, y + 36, { font: K.F.px(40), color: P.mintL, align: 'right', shadow: false });
        c.font = K.F.mono(40); c.textAlign = 'left'; c.textBaseline = 'middle';
        const L1 = 'vega project generate', L2 = '--template helloWorld';
        const n = Math.floor((t - T_CLI) * 28);
        const s1 = L1.slice(0, Math.max(0, n)), s2 = L2.slice(0, Math.max(0, n - L1.length - 2));
        const out = [
          { s: 'Creating project...', t: T_CLI + 1.8, col: P.mintL },
          { s: '+ package.json', t: T_CLI + 2.1, col: P.stoneL },
          { s: '+ src/App.tsx', t: T_CLI + 2.3, col: P.stoneL },
          { s: '✓ helloWorld ready', t: T_CLI + 2.55, col: P.mint },
        ].filter(o => t >= o.t);
        // scroll: once output passes 3 lines, shift everything up one line per extra line
        const lh = 62, maxRows = 6;
        const rows = [{ s: '$ ', c2: s1, col: P.goldL }, { s: '  ', c2: s2, col: P.goldL }, ...out.map(o => ({ s: '', c2: o.s, col: o.col }))];
        const off = Math.max(0, rows.length - maxRows);
        c.save(); c.beginPath(); c.rect(x + 8, y + 72, w - 16, h - 84); c.clip();
        rows.slice(off).forEach((r, i) => {
          const yy = y + 110 + i * lh;
          if (r.s === '$ ') { c.fillStyle = P.mint; c.fillText('$', x + 40, yy); }
          c.fillStyle = r.col; c.fillText(r.c2, x + (r.s ? 90 : 40), yy);
        });
        // cursor
        const last = rows.slice(off).length - 1, lr = rows[off + last];
        if (Math.floor(t * 4) % 2 === 0) { c.fillStyle = P.goldL; c.fillRect(x + (lr.s ? 90 : 40) + c.measureText(lr.c2).width + 6, y + 110 + last * lh - 22, 22, 44); }
        c.restore();
        c.restore();
      }

      // 29.1 icon chips
      if (t >= T_B - 0.3 && t < T_TV) {
        TILE.forEach((d, i) => {
          const lit = t >= d.t;
          const s = lit ? K.pop(t, d.t, 0.3) : 1;
          K.chip(c, d.lab, d.x * 4, (TY + TS) * 4 + 70, {
            size: 44, scale: s, alpha: K.prog(t, T_B - 0.3, 0.2),
            color: lit ? P.goldL : P.stoneL, border: lit ? P.gold : P.stone, fill: lit ? P.forestD : P.ink,
          });
        });
      }

      // 30.3 TV: Hello World + label
      if (t >= T_TV + 0.25) {
        const s = K.pop(t, T_TV + 0.25, 0.3);
        c.save(); c.translate(540, (TVY + TVH / 2 - 4) * 4); c.scale(s, s);
        K.text(c, 'Hello World', 0, 0, { font: K.F.px(84), color: P.goldL });
        c.restore();
      }
      if (t >= T_TV) {
        const lA = K.prog(t, T_TV + 0.1, 0.2) * (1 - 0.0 * K.prog(t, T_OK, 0.3));
        K.chip(c, 'Virtual Device', 540, (TVY + TVH + 8) * 4 + 40, { size: 44, alpha: lA, scale: K.pop(t, T_TV + 0.1, 0.3), color: P.paper, border: P.mint });
      }

      // 31.3 approval prompt + chip
      if (t >= T_OK + 0.2) {
        K.text(c, 'Allow?', (PR.x + PR.w / 2) * 4, (PR.y + 19) * 4 + 4, { font: K.F.px(48), color: P.ink, shadow: false });
        K.text(c, 'Yes', (PR.x + 22) * 4, (PR.y + 37) * 4 + 4, { font: K.F.px(40), color: P.ink, shadow: false });
        K.text(c, 'No', (PR.x + 62) * 4, (PR.y + 37) * 4 + 4, { font: K.F.px(40), color: P.stone, shadow: false });
      }
      if (t >= T_OK) {
        const s = K.pop(t, T_OK, 0.35);
        const cy = 1010;
        const w = K.chip(c, 'You approve each step', 540, cy, { size: 48, scale: s, color: P.goldL });
        // check badge pops when Gio taps
        if (t >= T_TAP) {
          const k = K.pop(t, T_TAP, 0.3);
          c.save(); c.translate(540 + w / 2 + 6, cy - 44); c.scale(k, k);
          c.fillStyle = P.ink; c.fillRect(-36, -36, 72, 72); c.fillStyle = P.gold; c.fillRect(-30, -30, 60, 60);
          c.fillStyle = P.ink;
          [[-18, 0], [-12, 6], [-6, 12], [0, 6], [6, 0], [12, -6], [18, -12]].forEach(([x, y]) => c.fillRect(x - 5, y - 5, 10, 10));
          c.restore();
        }
      }
    },
  };
})();
