// Chapter 7 — "The crash boss" (bars 40–46, 78–92 s). A stone boss room; a glitchy block-monster.
(function () {
  const K = window.K, P = K.P;
  const T0 = K.at(40), T_ASK = K.at(41, 3), T_CAST = K.at(42, 3), T_KIND = K.at(44, 1), T_SWING = K.at(45, 1), T_END = K.at(47);
  const T_FLY = T_CAST + 0.15;        // hex rows fly from the boss into the box
  const T_BOX = T_CAST + 0.35;        // box arrives, decoding starts
  const T_HL = T_BOX + 1.75;          // highlight line lights
  const T_BOXOUT = T_KIND - 0.3;
  const T_JS = T_KIND + 1.25;         // JavaScript shield lights
  const T_KOUT = T_SWING - 0.45;      // shields clear before the leap
  const T_LEAP = T_SWING - 0.4, T_HIT = T_SWING, T_LAND = T_SWING + 0.5;
  const T_POP0 = T_SWING + 0.75;      // stack frames start falling (top first)
  const T_CHECK = T_SWING + 1.9, T_CHEER = T_CHECK + 0.3;
  const GX = 70, GY = 362, BX = 222, BY = 362;
  const BOSS_X = 65, BOSS_Y = 70, CELL = 10;
  const FLOOR = 206;
  const MASK = [
    '.....XXXX.....',
    '...XXXXXXXX...',
    '..XXXXXXXXXX..',
    '.XXXXXXXXXXXX.',
    'XXXEEXXXXEEXXX',
    'XXXEEXXXXEEXXX',
    'XXXXXXXXXXXXXX',
    '.XXMMMMMMMMXX.',
    'XXXTMTMMTMTXXX',
    'X.XXXXXXXXXX.X',
    '.XXXXXXXXXXXX.',
    '..XX..XX..XX..',
  ];
  // stack frames the boss splits into (each covers 3 mask rows)
  const FRAMES = [
    { lab: 'renderRow', w: 140, col: P.gold },
    { lab: 'FlatList', w: 128, col: P.mint },
    { lab: 'App', w: 116, col: P.mint },
    { lab: 'main', w: 104, col: P.mint },
  ];
  const TRACE = ['at renderRow (List.tsx:42)', 'at FlatList (VirtualList.js:318)', 'at App (App.tsx:17)'];
  const HEX = '0x7f3a 0x00c1 0x9be2 0x44d0 0x1ac7 0xe0f3';
  const KINDS = [{ lab: 'JavaScript', x: 55 }, { lab: 'Native', x: 135 }, { lab: 'Low memory', x: 215 }];
  const SHY = 196;                    // shield top (low-res)

  // ---------------- low-res ----------------
  function torch(p, x, y, t, lit) {
    K.OR(p, x - 3, y, 6, 3, P.stoneD); K.R(p, x - 1, y + 3, 2, 6, P.brownD);
    const f = Math.floor(t * 8 + x);
    const hgt = (lit ? 9 : 7) + (f % 3);
    for (let i = 0; i < 5; i++) {
      const h = hgt - Math.abs(i - 2) * 2 - ((f + i) % 2);
      K.R(p, x - 2 + i, y - h, 1, h, i === 2 ? P.goldL : P.gold);
    }
    K.R(p, x - 1, y - 2, 3, 2, P.paper);
    K.dither(p, x - 8, y - 14, 17, 18, lit ? 'rgba(235,231,154,0.22)' : 'rgba(212,206,70,0.14)', f % 2);
  }
  function pillar(p, x, t, lit) {
    K.R(p, x - 1, 22, 24, FLOOR - 22, P.ink);
    K.R(p, x, 30, 22, FLOOR - 30, P.stone);
    for (let y = 34; y < FLOOR; y += 12) K.R(p, x, y, 22, 1, P.stoneD);
    K.R(p, x + 3, 30, 2, FLOOR - 30, P.stoneL); K.R(p, x + 18, 30, 2, FLOOR - 30, P.stoneD);
    K.block(p, x - 3, 22, 28, 8, P.stoneL); K.block(p, x - 3, FLOOR - 8, 28, 8, P.stoneL);
    torch(p, x + 11, 104, t, lit);
  }
  function room(p, t, lit) {
    K.wall(p, 0, 0, 270, FLOOR);
    K.dither(p, 0, 0, 270, FLOOR, 'rgba(8,14,12,0.45)');
    // arch behind the boss
    K.R(p, 56, 40, 158, FLOOR - 40, P.ink);
    K.R(p, 60, 44, 150, FLOOR - 44, P.stoneD); K.dither(p, 60, 44, 150, FLOOR - 44, P.ink, 1);
    for (let i = 0; i < 11; i++) K.block(p, 53 + i * 15, 34, 13, 8, P.stoneL);
    // floor
    K.stoneFloor(p, 0, FLOOR, 270, 480 - FLOOR);
    K.R(p, 0, FLOOR, 270, 3, P.stoneD); K.dither(p, 0, FLOOR + 3, 270, 4, 'rgba(10,15,12,0.5)');
    // runner carpet toward the heroes
    K.R(p, 110, FLOOR + 7, 50, 480 - FLOOR - 7, P.forestD); K.R(p, 112, FLOOR + 7, 46, 480 - FLOOR - 7, P.forest);
    K.R(p, 114, FLOOR + 7, 1, 480 - FLOOR - 7, P.gold); K.R(p, 155, FLOOR + 7, 1, 480 - FLOOR - 7, P.gold);
    pillar(p, 12, t, lit); pillar(p, 236, t, lit);
    // hanging banners (plain, original)
    [[42, P.forest], [218, P.forest]].forEach(([x, c]) => {
      K.R(p, x - 1, 44, 12, 50, P.ink); K.R(p, x, 44, 10, 46, c); K.R(p, x, 44, 10, 2, P.gold);
      K.R(p, x + 3, 60, 4, 4, P.gold); K.R(p, x, 90, 4, 3, c); K.R(p, x + 6, 90, 4, 3, c);
    });
  }

  // boss cell colours for this (stepped) frame
  function drawBoss(p, t, flash, calm) {
    const f = Math.floor(t * 8);
    const r = K.rng(97 + f * 13);
    const appear = K.prog(t, T0 + 0.1, 0.8);
    const jx = calm ? 0 : Math.round((r() - 0.5) * 3), jy = calm ? 0 : Math.round((r() - 0.5) * 2);
    const shiftRow = Math.floor(r() * 12), shiftAmt = calm ? 0 : Math.round((r() - 0.5) * 10);
    // red glow on the arch + floor shadow
    K.dither(p, BOSS_X - 6, BOSS_Y - 6, 152, 132, 'rgba(200,70,60,0.16)', f % 2);
    K.dither(p, BOSS_X + 20, FLOOR + 4, 100, 5, 'rgba(8,10,10,0.6)');
    for (let j = 0; j < MASK.length; j++) for (let i = 0; i < MASK[j].length; i++) {
      const m = MASK[j][i]; if (m === '.') continue;
      const cr = K.rng(1 + j * 31 + i * 7 + f * 101);
      const born = ((i * 7 + j * 5) % 11) / 11;
      if (born > appear) continue;
      if (!calm && cr() < 0.05) continue;                          // flicker out
      const x = BOSS_X + i * CELL + jx + (j === shiftRow ? shiftAmt : 0), y = BOSS_Y + j * CELL + jy;
      K.R(p, x, y, CELL, CELL, P.ink);
      if (flash) { K.R(p, x + 1, y + 1, CELL - 1, CELL - 1, P.paper); continue; }
      if (m === 'E') {
        K.R(p, x + 1, y + 1, CELL - 1, CELL - 1, P.goldL);
        if ((f + i) % 6) K.R(p, x + 2 + ((i % 2) ? 0 : 4), y + 3, 4, 4, P.ink);
        continue;
      }
      if (m === 'M') { K.R(p, x + 1, y + 1, CELL - 1, CELL - 1, P.ink); K.R(p, x + 1, y + 1, CELL - 1, 1, P.redD); continue; }
      if (m === 'T') { K.R(p, x + 1, y + 1, CELL - 1, CELL - 1, P.ink); K.R(p, x + 2, y + 1, 6, 5, P.paper); continue; }
      const v = cr();
      const base = v < 0.55 ? P.red : v < 0.9 ? P.redD : v < 0.96 ? P.stoneD : P.goldD;
      K.R(p, x + 1, y + 1, CELL - 1, CELL - 1, base);
      K.R(p, x + 1, y + 1, CELL - 1, 1, K.lighten(base, 0.25));
      // garbled glyph pixels
      if (cr() < 0.6) for (let k = 0; k < 3; k++) K.R(p, x + 2 + Math.floor(cr() * 6), y + 2 + Math.floor(cr() * 6), 1 + Math.floor(cr() * 3), 1, cr() < 0.5 ? K.lighten(base, 0.45) : P.ink);
    }
    // loose glitch fragments around the boss
    if (!calm) for (let k = 0; k < 4; k++) {
      const x = BOSS_X - 10 + Math.floor(r() * 160), y = BOSS_Y + Math.floor(r() * 120);
      K.R(p, x, y, 2 + Math.floor(r() * 5), 2, r() < 0.5 ? P.red : P.redD);
    }
  }

  function frameGeom(k) {
    const w = FRAMES[k].w, x = 135 - w / 2, y = BOSS_Y + k * 30 + 2;
    return { x, y, w, h: 26 };
  }
  // stack-frame slabs after the slice. returns per-slab state (for hi labels)
  function slabState(t, k) {
    const g = frameGeom(k);
    const sep = K.ease.out(K.prog(K.step(t, 15), T_HIT + 0.08, 0.3));
    const dx = Math.round((k % 2 ? 1 : -1) * 6 * sep);
    const tf = T_POP0 + k * 0.24;
    const fu = K.prog(K.step(t, 15), tf, 0.35);
    const dy = Math.round(26 * fu * fu);
    return { x: g.x + dx, y: g.y + dy, w: g.w, h: g.h, fall: fu, tf, gone: t >= tf + 0.35 };
  }
  function drawSlabs(p, t) {
    for (let k = 0; k < FRAMES.length; k++) {
      const s = slabState(t, k);
      if (s.gone) { K.poof(p, s.x + s.w / 2, s.y + s.h / 2, t, s.tf + 0.35, 0.45); continue; }
      K.R(p, s.x - 1, s.y - 1, s.w + 2, s.h + 2, P.ink);
      K.R(p, s.x, s.y, s.w, s.h, P.paper);
      K.R(p, s.x, s.y + s.h - 2, s.w, 2, P.paperD);
      K.R(p, s.x, s.y, 6, s.h, FRAMES[k].col);
      if (s.fall > 0) K.dither(p, s.x, s.y, s.w, s.h, P.stoneL, Math.floor(t * 15) % 2);
      if (s.fall > 0.5) K.dither(p, s.x, s.y, s.w, s.h, P.ink, Math.floor(t * 15 + 1) % 2);
    }
  }

  function beam(p, t) {
    if (t < T_CAST || t > T_BOX + 1.9) return;
    const x0 = BX, y0 = BY - 70, x1 = 203, y1 = 160;
    const grow = K.prog(K.step(t, 15), T_CAST, 0.25);
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 2);
    const f = Math.floor(t * 15);
    const fade = t > T_BOX + 1.5;
    for (let i = 0; i <= n * grow; i++) {
      if (fade && (i + f) % 2) continue;
      const x = Math.round(K.lerp(x0, x1, i / n)), y = Math.round(K.lerp(y0, y1, i / n));
      const pk = ((i + f * 2) % 9) === 0;
      K.R(p, x - 1, y, 3, 2, pk ? P.goldL : P.mint);
      K.R(p, x, y, 1, 2, P.mintL);
    }
    if (grow >= 1 && !fade) { K.sparkle(p, x1, y1, t, T_CAST + 0.25 + Math.floor((t - T_CAST) / 0.4) * 0.4, P.mintL, 0.4); }
  }

  function shield(p, i, t) {
    const d = KINDS[i], t0 = T_KIND + i * 0.5;
    if (t < t0) return;
    const a = K.ease.back(K.prog(K.step(t, 15), t0, 0.25));
    const lit = i === 0 && t >= T_JS;
    const dim = t >= T_JS && i > 0;
    const w = 30, h = 34, x = d.x - w / 2, y = SHY + Math.round((1 - a) * 10);
    const face = lit ? P.gold : dim ? P.stoneD : P.stoneL, rim = lit ? P.goldL : dim ? P.stone : P.paperD;
    // shield silhouette: rect top, tapering bottom
    for (let j = 0; j < h; j++) {
      const inset = j < 20 ? 0 : Math.round((j - 20) * 1.1);
      K.R(p, x - 1 + inset, y + j - 1, w + 2 - inset * 2, 1, P.ink);
    }
    for (let j = 0; j < h - 2; j++) {
      const inset = j < 19 ? 0 : Math.round((j - 19) * 1.1);
      K.R(p, x + inset, y + j, w - inset * 2, 1, j === 0 ? rim : face);
    }
    K.R(p, x + w / 2 - 1, y + h - 3, 2, 2, P.ink);
    const cx = d.x, cy = y + 13, ic = lit ? P.ink : dim ? P.stone : P.ink;
    if (i === 0) { // { }
      K.R(p, cx - 6, cy - 5, 2, 11, ic); K.R(p, cx - 7, cy, 1, 1, ic); K.R(p, cx - 4, cy - 5, 2, 1, ic); K.R(p, cx - 4, cy + 5, 2, 1, ic);
      K.R(p, cx + 4, cy - 5, 2, 11, ic); K.R(p, cx + 6, cy, 1, 1, ic); K.R(p, cx + 2, cy - 5, 2, 1, ic); K.R(p, cx + 2, cy + 5, 2, 1, ic);
    } else if (i === 1) { // gear
      K.R(p, cx - 4, cy - 4, 8, 8, ic); K.R(p, cx - 1, cy - 6, 2, 12, ic); K.R(p, cx - 6, cy - 1, 12, 2, ic); K.R(p, cx - 1, cy - 1, 2, 2, face);
    } else { // memory stick
      K.R(p, cx - 7, cy - 3, 14, 7, ic); for (let k = 0; k < 4; k++) K.R(p, cx - 6 + k * 4, cy - 2, 2, 3, face);
      for (let k = 0; k < 6; k++) K.R(p, cx - 6 + k * 2 + 1, cy + 4, 1, 2, ic);
    }
    if (lit) { K.sparkle(p, x - 2, y, t, T_JS, P.goldL, 0.5); K.sparkle(p, x + w + 2, y + 6, t, T_JS + 0.15, P.goldL, 0.5); }
  }

  function bigCheck(p, t) {
    if (t < T_CHECK) return;
    const a = K.ease.back(K.prog(K.step(t, 15), T_CHECK, 0.3));
    const s = Math.max(1, Math.round(6 * a));
    const cx = 135, cy = 124;
    const pts = [[-7, -2], [-6, -1], [-5, 0], [-4, 1], [-3, 2], [-2, 3], [-1, 2], [0, 1], [1, 0], [2, -1], [3, -2], [4, -3], [5, -4]];
    [[P.ink, 2], [P.goldD, 0], [P.gold, -1]].forEach(([c, grow], layer) => pts.forEach(([x, y]) => {
      const off = layer === 1 ? 1 : 0;
      K.R(p, cx + x * s - s - grow + off, cy + y * s - s - grow + off, s * 2 + grow * 2, s * 2 + grow * 2, c);
    }));
    pts.forEach(([x, y]) => K.R(p, cx + x * s - s + 1, cy + y * s - s + 1, s, 1, P.goldL));
    K.sparkle(p, cx - 34, cy - 20, t, T_CHECK + 0.1, P.goldL, 0.55);
    K.sparkle(p, cx + 36, cy - 30, t, T_CHECK + 0.25, P.goldL, 0.55);
    K.sparkle(p, cx + 20, cy + 26, t, T_CHECK + 0.4, P.mintL, 0.55);
    if (t > T_CHECK + 0.9) { const k = Math.floor((t - T_CHECK - 0.9) / 0.6); K.sparkle(p, cx + ((k * 37) % 80) - 40, cy + ((k * 23) % 50) - 25, t, T_CHECK + 0.9 + k * 0.6, P.goldL, 0.5); }
  }

  // ---------------- hi-res helpers ----------------
  const BOXX = 60, BOXY = 788, BOXW = 760, BOXH = 236;
  const rowY = i => BOXY + 94 + i * 52;
  function garble(len, seed) {
    let s = ''; for (let i = 0; i < len; i++) s += HEX[(i + seed * 7) % HEX.length]; return s;
  }
  const HEXD = '0123456789abcdef';
  function decoded(i, t) {
    const target = TRACE[i], g = garble(target.length, i), f = Math.floor(t * 15);
    let out = '';
    for (let k = 0; k < target.length; k++) {
      const r = K.rng(11 + i * 97 + k * 13)();
      const tr = T_BOX + 0.25 + i * 0.25 + r * 1.1;
      if (t >= tr) out += target[k];
      else if (g[k] === ' ' || g[k] === 'x' || t < T_BOX + 0.15) out += g[k];
      else out += HEXD[(k * 5 + f * 3 + i) % 16];
    }
    return out;
  }

  window.CH[7] = {
    lo(p, t) {
      const won = t >= T_CHECK;
      room(p, t, won);
      // boss
      if (t < T_HIT + 0.08) drawBoss(p, t, t >= T_HIT - 0.02, false);
      else if (t < T_HIT + 0.15) drawBoss(p, t, true, true);
      else drawSlabs(p, t);
      // slash streak
      if (t >= T_HIT - 0.05 && t < T_HIT + 0.3) {
        const u = K.prog(K.step(t, 20), T_HIT - 0.05, 0.12);
        const x0 = 56, x1 = Math.round(K.lerp(56, 216, u));
        const fade = t > T_HIT + 0.15;
        K.R(p, x0, 164, x1 - x0, 6, P.ink); K.R(p, x0, 165, x1 - x0, 4, fade ? P.gold : P.goldL); K.R(p, x0, 166, x1 - x0, 2, P.paper);
      }
      if (won) K.dither(p, 60, 44, 150, 160, 'rgba(235,231,154,0.12)', Math.floor(t * 4) % 2);
      beam(p, t);
      if (t >= T_KIND && t < T_KOUT) for (let i = 0; i < 3; i++) shield(p, i, t);
      if (t >= T_KOUT && t < T_KOUT + 0.5) KINDS.forEach(d => K.poof(p, d.x, SHY + 12, t, T_KOUT, 0.4));
      bigCheck(p, t);

      // ---- Gio ----
      let gx = GX, gy = GY, pose = 'idle', expr = 'worried', glow = 0, flip = false, look = 1;
      if (t < T0 + 0.9) { expr = 'wow'; }
      if (t >= T_ASK - 0.2 && t < T_CAST) { pose = 'point'; }
      if (t >= T_CAST) { expr = 'wow'; look = 0; }
      if (t >= T_HL) expr = 'happy';
      if (t >= T_JS) expr = 'grin';
      if (t >= T_KOUT - 0.2) { pose = 'sword'; glow = 1; expr = 'grin'; }
      if (t >= T_LEAP && t < T_LAND + 0.05) {
        pose = 'swing'; glow = 1;
        const ts = K.step(t, 15);
        if (ts < T_HIT) { const u = K.ease.out(K.prog(ts, T_LEAP, 0.35)); gx = K.lerp(GX, 42, u); gy = K.lerp(GY, 214, u); }
        else if (ts < T_HIT + 0.15) { gx = 42; gy = 214; }
        else { const u = K.ease.in(K.prog(ts, T_HIT + 0.15, 0.35)); gx = K.lerp(42, GX, u); gy = K.lerp(214, GY, u); }
      }
      if (t >= T_LAND + 0.05 && t < T_CHEER) { pose = 'sword'; glow = 1; expr = 'grin'; }
      let hop = 0;
      if (t >= T_CHEER) {
        pose = 'cheer'; expr = 'grin';
        hop = Math.round(K.hop(t, T_CHEER, 0.4, 7) + K.hop(t, T_CHEER + 0.5, 0.4, 5) + K.hop(t, T_CHEER + 1.0, 0.4, 4));
      }
      if (t >= T_LAND && t < T_LAND + 0.2) K.poof(p, GX, GY - 2, t, T_LAND, 0.35);
      K.gio(p, Math.round(gx), Math.round(gy) - hop, { t, pose, expr, u: 3, blade: glow, flip, look });
      if (t >= T_LEAP && t < T_HIT) K.sparkle(p, Math.round(gx) + 50, Math.round(gy) - 48, t, T_LEAP + 0.1, P.goldL, 0.3);

      // ---- Byte ----
      let face = '!';
      if (t >= T0 + 1.2) face = 'eyes';
      if (t >= T_ASK + 0.4) face = '?';
      if (t >= T_CAST - 0.1) face = 'scroll';
      if (t >= T_HL) face = 'eyes';
      if (t >= T_JS) face = 'happy';
      if (t >= T_KOUT) face = 'eyes';
      if (t >= T_CHECK) face = 'happy';
      const bhop = Math.round(K.hop(t, T_CAST - 0.15, 0.3, 5) + K.hop(t, T_JS, 0.35, 4) + K.hop(t, T_CHEER + 0.25, 0.4, 6) + K.hop(t, T_CHEER + 0.75, 0.4, 4));
      const shake = t < T0 + 1.0 ? (Math.floor(t * 16) % 2) : 0;
      K.byte(p, BX + shake, BY - bhop, { t, face, level: 1, u: 3 });
    },

    hi(c, t) {
      // hex glyphs crawling over the boss, then flying into the box
      if (t >= T0 + 0.5 && t < T_BOX + 0.1) {
        const f = Math.floor(t * 8);
        const fly = K.ease.inOut(K.prog(K.step(t, 15), T_FLY, 0.3));
        const a = K.prog(t, T0 + 0.5, 0.3);
        c.save(); c.globalAlpha = a; c.font = K.F.mono(36); c.textAlign = 'left'; c.textBaseline = 'middle';
        for (let i = 0; i < 3; i++) {
          const r = K.rng(5 + f * 17 + i * 3);
          const src = garble(13, i + f % 3);
          const bx = 400 + Math.round((r() - 0.5) * 20), by = [BOSS_Y + 17, BOSS_Y + 65, BOSS_Y + 103][i] * 4;
          const x = K.lerp(bx, BOXX + 40, fly), y = K.lerp(by, rowY(i), fly);
          const s = fly > 0 ? garble(Math.round(K.lerp(13, TRACE[i].length, fly)), i) : src;
          c.fillStyle = P.ink; c.fillText(s, x + 3, y + 3);
          c.fillStyle = r() < 0.15 ? P.goldL : P.paper; c.fillText(s, x, y);
        }
        c.restore();
      }

      // 41.3 Gio asks
      if (t >= T_ASK && t < T_CAST + 0.1) {
        const s = K.pop(t, T_ASK, 0.3), a = 1 - K.prog(t, T_CAST - 0.15, 0.2);
        K.bubble(c, 'Why did my app crash?', 400, (GY - 106) * 4, { size: 48, scale: s, alpha: a });
      }

      // 42.3 symbolicate_acr chip above Byte
      if (t >= T_CAST - 0.1 && t < T_BOXOUT + 0.25) {
        const a = 1 - K.prog(t, T_BOXOUT, 0.25);
        K.code(c, 'symbolicate_acr', 780, (BY - 76) * 4, { size: 44, font: K.F.mono(44), scale: K.pop(t, T_CAST - 0.1, 0.3), alpha: a });
      }

      // stack trace box
      if (t >= T_BOX - 0.1 && t < T_BOXOUT + 0.25) {
        const a = K.prog(t, T_BOX - 0.1, 0.15) * (1 - K.prog(t, T_BOXOUT, 0.25));
        c.save(); c.globalAlpha = a;
        K.box(c, BOXX, BOXY, BOXW, BOXH, { fill: P.ink, border: P.mint });
        c.fillStyle = P.forestD; c.fillRect(BOXX + 4, BOXY + 4, BOXW - 8, 54);
        K.text(c, 'crash report', BOXX + 32, BOXY + 32, { font: K.F.px(40), color: P.mintL, align: 'left', shadow: false });
        const done = t >= T_HL;
        K.text(c, done ? 'decoded' : 'decoding…', BOXX + BOXW - 28, BOXY + 32, { font: K.F.px(40), color: done ? P.goldL : P.stoneL, align: 'right', shadow: false });
        c.font = K.F.mono(36); c.textAlign = 'left'; c.textBaseline = 'middle';
        for (let i = 0; i < 3; i++) {
          const s = decoded(i, t), y = rowY(i);
          if (i === 0 && t >= T_HL) {
            const k = K.prog(K.step(t, 15), T_HL, 0.2);
            const w = c.measureText(TRACE[0]).width + 32;
            c.fillStyle = P.gold; c.fillRect(BOXX + 24, y - 25, Math.round(w * k), 50);
            c.fillStyle = P.ink; c.fillText(s, BOXX + 40, y + 2);
            if (k >= 1) { c.fillStyle = P.goldL; c.fillText('◀', BOXX + 44 + w, y + 2); }
          } else {
            const fin = s === TRACE[i];
            c.fillStyle = fin ? (i === 0 ? P.goldL : P.paperD) : P.red; c.fillText(s, BOXX + 40, y + 2);
          }
        }
        c.restore();
      }

      // 44.1 crash kinds
      if (t >= T_KIND && t < T_KOUT + 0.15) {
        const a = 1 - K.prog(t, T_KOUT, 0.15);
        KINDS.forEach((d, i) => {
          const t0 = T_KIND + i * 0.5; if (t < t0) return;
          const lit = i === 0 && t >= T_JS, dim = i > 0 && t >= T_JS;
          const s = K.pop(t, t0, 0.3) * (lit ? 1 + 0.12 * (1 - K.prog(t, T_JS, 0.25)) : 1);
          K.chip(c, d.lab, [220, 540, 860][i], (SHY + 52) * 4, {
            size: 48, scale: s, alpha: a * (dim ? 0.75 : 1), pad: 18,
            color: lit ? P.ink : dim ? P.stoneL : P.paper, fill: lit ? P.gold : P.ink, border: lit ? P.goldL : P.stone,
          });
        });
      }

      // 45.1 stack-frame labels on the slabs
      if (t >= T_HIT + 0.15 && t < T_CHECK) {
        c.font = K.F.mono(40); c.textAlign = 'center'; c.textBaseline = 'middle';
        FRAMES.forEach((fr, k) => {
          const s = slabState(t, k); if (s.gone || s.fall > 0.6) return;
          c.save(); c.globalAlpha = 1 - K.clamp(s.fall / 0.6);
          c.fillStyle = k === 0 ? P.ink : P.forestD;
          c.fillText(fr.lab, (s.x + s.w / 2 + 2) * 4, (s.y + s.h / 2 - 1) * 4 + 2);
          c.restore();
        });
      }

      // fix chip after the check
      if (t >= T_CHECK + 0.35) {
        K.code(c, 'fixed: List.tsx:42', 540, 900, { size: 44, font: K.F.mono(44), scale: K.pop(t, T_CHECK + 0.35, 0.35), border: P.gold });
      }
    },
  };
})();
