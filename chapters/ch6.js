// Chapter 6 — "The slow dungeon" (bars 33–39, 64–78 s). A torch-lit corridor blocked by a sleepy snail-monster.
(function () {
  const K = window.K, P = K.P;
  const T0 = K.at(33), T_SCR = K.at(34, 3), T_MAG = K.at(36, 1), T_G1 = K.at(37, 1), T_G2 = K.at(37, 2), T_G3 = K.at(37, 3),
    T_WIN = K.at(38, 1), T_END = K.at(40);
  const T_ROLL = T_G1 - 0.75;        // scroll rolls back up
  const T_TILES = T_ROLL + 0.3;      // UI tile + ghosts appear
  const T_SHR = T_WIN, T_SCOOT = T_WIN + 0.5, T_GONE = T_WIN + 1.3;
  const T_DOOR = T_WIN + 0.5, T_GRIN = T_WIN + 1.0, T_BLADE = T_WIN + 1.6;
  const WL = 38, WR = 232;           // corridor walls (inner edges)
  const GX = 72, GY = 356, BX = 200, BY = 356;
  const SNX = 140, SNY = 198;        // snail anchor (bottom centre)
  const SC = { x0: 34, x1: 236, y: 214, h: 58 };   // scroll
  const TR = { x: 50, y: 244, h: 14 };             // timeline track
  const SEG = [10, 7, 12, 6, 9, -46, 8, 11, 6, 9, 10, 7, 9, 12, 8]; // negative = the fat red block
  const HOT = (() => { let x = TR.x; for (const w of SEG) { if (w < 0) return { x, w: -w }; x += w; } })();
  const DOOR = { x: 108, y: 66, w: 54, h: 46 };
  const TILES = [64, 108, 152, 196], REAL = 1, GH = [0, 2, 3], GT = [T_G1, T_G2, T_G3], TILE_Y = 246;
  const SLOT = 822;                  // hi-res chip slot (under the snail, above the scroll)

  // ---------------- low-res helpers ----------------
  function disc(p, cx, cy, r, c) {
    p.fillStyle = c; const R = Math.round(r);
    for (let j = -R; j <= R; j++) { const hw = Math.round(Math.sqrt(Math.max(0, r * r - j * j))); p.fillRect(Math.round(cx - hw), Math.round(cy + j), hw * 2, 1); }
  }
  function torch(p, x, y, t, side) {
    const f = Math.floor(t * 8 + x * 0.37) % 3;
    // warm halo
    p.save(); p.globalAlpha = 0.16 + (f === 1 ? 0.04 : 0); disc(p, x, y - 4, 16, P.gold); p.globalAlpha = 0.14; disc(p, x, y - 4, 9, P.goldL); p.restore();
    K.OR(p, x - 3, y + 2, 6, 2, P.stoneD);                  // bracket
    K.R(p, x - side * 4, y, 2, 5, P.ink);
    K.OR(p, x - 1, y - 3, 2, 7, P.brown);                  // stick
    const h = [7, 9, 8][f];
    K.R(p, x - 3, y - 3 - h, 6, h, P.ink);
    K.R(p, x - 2, y - 2 - h, 4, h - 1, P.gold);
    K.R(p, x - 1, y - 1 - h + (f === 2 ? 1 : 0), 2, h - 3, P.goldL);
    K.R(p, x - (f === 0 ? 1 : 0), y - 4 - h, 1, 2, P.goldL);
    K.R(p, x - 1, y - 4, 2, 1, P.paper);
  }
  function door(p, t) {
    const d = DOOR, open = K.ease.out(K.prog(K.step(t, 12), T_DOOR, 0.6));
    // stone arch frame
    K.block(p, d.x - 8, d.y - 8, d.w + 16, d.h + 8, P.stoneL);
    for (let y = d.y - 6; y < d.y + d.h; y += 6) { K.R(p, d.x - 7, y, 5, 1, P.stone); K.R(p, d.x + d.w + 2, y, 5, 1, P.stone); }
    K.R(p, d.x - 2, d.y - 6, d.w + 4, 2, P.stone);
    K.R(p, d.x + d.w / 2 - 4, d.y - 8, 8, 5, P.gold); K.R(p, d.x + d.w / 2 - 3, d.y - 7, 6, 3, P.goldD); // keystone
    // opening (dark → gold light)
    K.R(p, d.x, d.y, d.w, d.h, P.ink);
    if (open > 0) {
      const lw = Math.round(d.w * open);
      const lx = d.x + Math.round((d.w - lw) / 2);
      K.R(p, lx, d.y, lw, d.h, P.gold); K.dither(p, lx, d.y, lw, d.h, P.goldL, Math.floor(t * 6) % 2);
      K.R(p, lx + 4, d.y + 4, Math.max(0, lw - 8), d.h - 4, P.goldL);
    }
    // two door leaves swing inward (get narrower)
    const leaf = Math.max(3, Math.round((d.w / 2) * (1 - open)));
    [[d.x, 1], [d.x + d.w - leaf, -1]].forEach(([x]) => {
      K.R(p, x, d.y, leaf, d.h, P.brownD);
      for (let i = 2; i < leaf; i += 6) K.R(p, x + i, d.y, 1, d.h, P.brown);
      K.R(p, x, d.y + 10, leaf, 3, P.ink); K.R(p, x, d.y + 32, leaf, 3, P.ink);
      if (leaf > 8) { K.R(p, x + 2, d.y + 11, 1, 1, P.gold); K.R(p, x + leaf - 3, d.y + 11, 1, 1, P.gold); K.R(p, x + 2, d.y + 33, 1, 1, P.gold); K.R(p, x + leaf - 3, d.y + 33, 1, 1, P.gold); }
    });
    if (open < 0.1) { K.R(p, d.x + d.w / 2 - 1, d.y, 2, d.h, P.ink); K.OR(p, d.x + d.w / 2 - 3, d.y + 20, 2, 4, P.gold); K.OR(p, d.x + d.w / 2 + 1, d.y + 20, 2, 4, P.gold); }
    // light spilling into the corridor
    if (open > 0) {
      p.save();
      for (let j = 0; j < 80; j += 2) { p.globalAlpha = 0.5 * open * (1 - j / 80); const w = Math.round(d.w * open + j * 1.1); K.dither(p, d.x + d.w / 2 - w / 2, d.y + d.h + j, w, 2, P.goldL, j / 2 % 2); }
      p.restore();
      K.sparkle(p, d.x + 6, d.y + 6, t, T_DOOR + 0.5); K.sparkle(p, d.x + d.w - 6, d.y + 14, t, T_DOOR + 0.75); K.sparkle(p, d.x + d.w / 2, d.y - 12, t, T_DOOR + 1.0);
    }
  }
  function scene(p, t) {
    // floor + side walls + top wall
    K.stoneFloor(p, WL, 112, WR - WL, 368);
    K.dither(p, WL, 112, WR - WL, 368, 'rgba(8,12,10,0.25)', 1);
    K.wall(p, 0, 0, WL, 480); K.wall(p, WR, 0, 270 - WR, 480);
    K.wall(p, 0, 0, 270, 112);
    K.dither(p, 0, 0, 270, 112, 'rgba(8,12,10,0.3)');
    K.dither(p, 0, 112, WL, 368, 'rgba(8,12,10,0.3)'); K.dither(p, WR, 112, 270 - WR, 368, 'rgba(8,12,10,0.3)');
    K.R(p, 0, 110, 270, 3, P.ink);
    K.R(p, WL - 1, 112, 2, 368, P.ink); K.R(p, WR - 1, 112, 2, 368, P.ink);
    K.dither(p, WL + 1, 112, 5, 368, 'rgba(8,12,10,0.5)'); K.dither(p, WR - 6, 112, 5, 368, 'rgba(8,12,10,0.5)');
    K.dither(p, WL, 113, WR - WL, 4, 'rgba(8,12,10,0.5)');
    // mouse-hole in the right wall (the snail's exit)
    K.R(p, WR - 1, 170, 16, 28, P.ink); K.R(p, WR - 1, 168, 12, 2, P.ink); K.R(p, WR + 15, 174, 2, 24, P.stoneD);
    // cracks + little bones for flavour
    K.R(p, 60, 300, 6, 1, P.stoneD); K.R(p, 65, 301, 4, 1, P.stoneD); K.R(p, 204, 136, 1, 5, P.stoneD);
    K.R(p, 212, 318, 8, 2, P.paperD); K.R(p, 211, 317, 2, 4, P.paperD); K.R(p, 219, 317, 2, 4, P.paperD);
    door(p, t);
    torch(p, 84, 86, t, 0); torch(p, 186, 86, t, 0);
    torch(p, WL - 5, 170, t, -1); torch(p, WR + 5, 150, t, 1);
    torch(p, WL - 5, 300, t, -1); torch(p, WR + 5, 290, t, 1);
  }

  // big sleepy snail, facing left. (ax, ay) = bottom centre; s = scale
  function snail(p, ax, ay, s, t, moving) {
    const R = (x, y, w, h, c) => { p.fillStyle = c; const X0 = Math.round(ax + x * s), Y0 = Math.round(ay + y * s); p.fillRect(X0, Y0, Math.max(1, Math.round(ax + (x + w) * s) - X0), Math.max(1, Math.round(ay + (y + h) * s) - Y0)); };
    const O = (x, y, w, h, c) => { R(x - 1.5, y - 1.5, w + 3, h + 3, P.ink); R(x, y, w, h, c); };
    const body = '#d9cfa8', bodyD = '#a89d74', bodyL = P.paper;
    const ph = moving ? Math.floor(t * 12) % 2 : Math.floor(t * 2) % 2;   // slow stepped stretch (on the beat)
    const st = ph ? 4 : 0;
    K.dither(p, ax - 74 * s, ay - 1, 140 * s, 3, 'rgba(8,12,10,0.6)');
    // slime trail
    if (!moving) K.dither(p, ax + 56 * s, ay - 3, 18, 2, P.mintL, 1);
    // foot / body
    O(-66 - st, -18, 124 + st, 18, body);
    R(-66 - st, -18, 124 + st, 2, bodyL); R(-66 - st, -3, 124 + st, 3, bodyD);
    for (let i = -60; i < 56; i += 10) R(i - st * ((56 - i) / 122), -6, 5, 2, bodyD);
    // tail
    O(56, -11, 8, 11, body); O(62, -6, 6, 6, body); R(56, -3, 12, 3, bodyD);
    // head
    const hx = -74 - st;
    const dome = [[4, -40, 22, 2], [1, -38, 28, 3], [0, -35, 30, 35]];
    dome.forEach(([x, y, w, h]) => R(hx + x - 1.5, y - 1.5, w + 3, h + 3, P.ink));
    dome.forEach(([x, y, w, h]) => R(hx + x, y, w, h, body));
    R(hx + 4, -40, 18, 2, bodyL); R(hx + 1, -37, 3, 30, bodyL); R(hx + 26, -35, 4, 33, bodyD); R(hx + 22, -40, 4, 2, bodyD);
    // eye stalks (sway on a slow stepped cycle)
    const sw = [0, 1, 0, -1][Math.floor(t * 2) % 4];
    [[hx + 6, 0], [hx + 20, 1]].forEach(([ex, k]) => {
      const dx = k ? -sw : sw;
      O(ex + dx, -56, 4, 16, body);
      O(ex - 3 + dx * 2, -66, 10, 10, P.paper);
      R(ex + dx * 2 - 1, -62, 4, 4, P.ink);                       // pupil (looking down-left)
      R(ex - 3 + dx * 2, -66, 10, 4, body); R(ex - 3 + dx * 2, -62.5, 10, 1.5, bodyD); // droopy lids
    });
    // cheeks + sleepy mouth
    R(hx + 3, -18, 5, 3, K.lighten(P.red, 0.35)); R(hx + 21, -18, 5, 3, K.lighten(P.red, 0.35));
    R(hx + 10, -16, 10, 2, P.ink); R(hx + 12, -14, 6, 2, P.redD);
    // shell
    const sx = ax + 10 * s, sy = ay - 44 * s, r = 34 * s;
    disc(p, sx, sy, r + 1.5, P.ink); disc(p, sx, sy, r, P.red);
    // spiral groove
    const turns = 2.6, th1 = turns * Math.PI * 2, dot = Math.max(1, Math.round(3 * s));
    for (let th = 0.5; th < th1; th += 0.05) {
      const rr = r * 0.86 * th / th1, px = sx - 2 * s + Math.cos(th + 1.2) * rr, py = sy + 2 * s + Math.sin(th + 1.2) * rr;
      K.R(p, px - dot / 2, py - dot / 2, dot, dot, P.redD);
    }
    disc(p, sx - 2 * s, sy + 2 * s, 3 * s, P.redD);
    // dithered shade bottom-right + highlight top-left
    p.save(); p.beginPath(); p.rect(sx, sy + r * 0.2, r + 2, r); p.clip(); K.dither(p, sx, sy + r * 0.2, r, r, P.redD); p.restore();
    K.R(p, sx - r * 0.62, sy - r * 0.62, 5 * s, 3 * s, K.lighten(P.red, 0.45)); K.R(p, sx - r * 0.72, sy - r * 0.4, 3 * s, 4 * s, K.lighten(P.red, 0.3));
    K.R(p, sx - r * 0.3, sy - r * 0.82, 4 * s, 2 * s, K.lighten(P.red, 0.3));
  }
  function zzz(p, x, y, t) {
    for (let k = 0; k < 3; k++) {
      const u = ((t - T0) * 0.5 + k / 3) % 1, zx = x - Math.round(u * 12) - k * 3, zy = y - Math.round(u * 26);
      if (u < 0.05 || u > 0.9) continue;
      const n = u < 0.45 ? 6 : 5;
      K.R(p, zx - 1, zy - 1, n + 2, n + 2, 'rgba(18,21,21,0.5)');
      K.R(p, zx, zy, n, 1, P.paper); K.R(p, zx, zy + n - 1, n, 1, P.paper);
      for (let i = 1; i < n - 1; i++) K.R(p, zx + n - 1 - i, zy + i, 1, 1, P.paper);
    }
  }

  function scroll(p, t) {
    const openU = K.ease.out(K.prog(K.step(t, 15), T_SCR, 0.5));
    const closeU = K.ease.in(K.prog(K.step(t, 15), T_ROLL, 0.3));
    const u = openU * (1 - closeU); if (t < T_SCR || u <= 0) return;
    const cx = (SC.x0 + SC.x1) / 2, full = SC.x1 - SC.x0 - 12;
    const w = Math.round(full * u), x = Math.round(cx - w / 2);
    // paper
    K.R(p, x - 1, SC.y - 1, w + 2, SC.h + 2, P.ink);
    K.R(p, x, SC.y, w, SC.h, P.paper); K.R(p, x, SC.y, w, 2, K.lighten(P.paper, 0.4)); K.R(p, x, SC.y + SC.h - 3, w, 3, P.paperD);
    // content clipped to the unrolled part
    p.save(); p.beginPath(); p.rect(x, SC.y, w, SC.h); p.clip();
    // second (thin) track
    let xx = TR.x;
    SEG.forEach((s, i) => { const ww = Math.abs(s); K.R(p, xx, TR.y - 8, ww - 1, 3, i % 3 === 0 ? P.stoneL : P.paperD); xx += ww; });
    // main track
    xx = TR.x;
    const hotOn = t >= T_MAG;
    SEG.forEach((s, i) => {
      const ww = Math.abs(s);
      K.R(p, xx, TR.y, ww, TR.h, P.ink);
      if (s < 0) {
        const flash = hotOn && t < T_MAG + 0.12;
        const c = flash ? P.paper : hotOn ? P.gold : P.red;
        K.R(p, xx + 1, TR.y + 1, ww - 2, TR.h - 2, c);
        K.R(p, xx + 1, TR.y + 1, ww - 2, 2, hotOn ? P.goldL : K.lighten(P.red, 0.3));
        K.dither(p, xx + 1, TR.y + TR.h - 4, ww - 2, 3, hotOn ? P.goldD : P.redD);
      } else {
        K.R(p, xx + 1, TR.y + 1, ww - 2, TR.h - 2, i % 2 ? P.mint : P.emerald);
        K.R(p, xx + 1, TR.y + 1, ww - 2, 1, i % 2 ? P.mintL : P.emeraldL);
      }
      xx += ww;
    });
    for (let k = 0; k <= 10; k++) K.R(p, TR.x + k * 17, TR.y + TR.h + 1, 1, k % 5 ? 2 : 3, P.stone);
    p.restore();
    // rollers
    [x - 5, x + w - 1].forEach(rx => { K.OR(p, rx, SC.y - 4, 6, SC.h + 8, P.brown); K.R(p, rx + 1, SC.y - 4, 1, SC.h + 8, K.lighten(P.brown, 0.3)); K.R(p, rx, SC.y - 5, 6, 2, P.gold); K.R(p, rx, SC.y + SC.h + 3, 6, 2, P.gold); });
    // magnifier over the fat block
    const mA = K.prog(K.step(t, 15), T_MAG - 0.35, 0.35);
    if (mA > 0 && closeU <= 0) {
      const mx = Math.round(K.lerp(20, HOT.x + HOT.w / 2, K.ease.out(mA))), my = Math.round(K.lerp(330, TR.y + TR.h / 2, K.ease.out(mA)));
      // handle up-right
      for (let k = 0; k < 16; k++) K.R(p, mx - 14 - k, my + 10 + k, 4, 4, k < 2 ? P.ink : P.brownD);
      for (let k = 2; k < 16; k++) K.R(p, mx - 13 - k, my + 11 + k, 2, 2, P.brown);
      disc(p, mx, my, 15, P.ink); disc(p, mx, my, 13, P.stoneL);
      p.save(); p.globalAlpha = 0.9; disc(p, mx, my, 11, P.paper); p.restore();
      // magnified contents
      p.save(); p.beginPath(); for (let j = -11; j <= 11; j++) { const hw = Math.round(Math.sqrt(121 - j * j)); p.rect(mx - hw, my + j, hw * 2, 1); } p.clip();
      const zc = t >= T_MAG ? (t < T_MAG + 0.12 ? P.paper : P.gold) : P.red;
      K.R(p, mx - 30, my - 9, 60, 18, P.ink); K.R(p, mx - 28, my - 7, 56, 14, zc); K.R(p, mx - 28, my - 7, 56, 3, t >= T_MAG ? P.goldL : K.lighten(P.red, 0.3));
      K.dither(p, mx - 28, my + 2, 56, 5, t >= T_MAG ? P.goldD : P.redD);
      K.R(p, mx - 8, my - 9, 1, 1, P.paper); K.R(p, mx - 9, my - 8, 1, 3, P.paper);
      p.restore();
      K.R(p, mx - 7, my - 8, 4, 2, P.paper); K.R(p, mx - 8, my - 6, 2, 2, P.paper); // glint
      if (t >= T_MAG) { K.sparkle(p, mx - 16, my - 12, t, T_MAG + 0.05); K.sparkle(p, mx + 18, my + 8, t, T_MAG + 0.2); }
    }
  }

  // UI tile (a little app card). ghost = dithered, semi-transparent re-render copy
  function uiTile(p, cx, cy, t, ghost, k) {
    const w = 32, h = 30, x = Math.round(cx - w / 2), y = Math.round(cy - h / 2);
    const ph = (Math.floor(t * 8) + k) % 2;
    const F = ghost ? (xx, yy, ww, hh, c) => K.dither(p, xx, yy, ww, hh, c, ph) : (xx, yy, ww, hh, c) => K.R(p, xx, yy, ww, hh, c);
    p.save(); if (ghost) p.globalAlpha = 0.75;
    F(x - 1, y - 1, w + 2, h + 2, ghost ? P.mintL : P.ink);
    F(x, y, w, h, ghost ? P.paper : P.forest);
    F(x + 3, y + 3, w - 6, 14, ghost ? P.mintL : P.mint);
    if (!ghost) { K.R(p, x + 3, y + 3, w - 6, 1, P.mintL); K.R(p, x + 6, y + 11, 6, 6, P.emerald); K.R(p, x + 13, y + 8, 8, 9, P.emerald); K.R(p, x + 20, y + 5, 3, 3, P.goldL); }
    F(x + 3, y + 20, w - 10, 2, ghost ? P.mintL : P.paper);
    F(x + 3, y + 24, w - 16, 2, ghost ? P.mintL : P.paperD);
    p.restore();
    if (ghost) { // little ghost eyes, cute
      K.R(p, x + 11, y + 7, 2, 3, P.forestD); K.R(p, x + 19, y + 7, 2, 3, P.forestD);
    }
  }
  function tiles(p, t) {
    if (t < T_TILES || t >= T_WIN + 0.2) return;
    const a = K.prog(K.step(t, 15), T_TILES, 0.25);
    const rise = Math.round(8 * (1 - K.ease.out(a)));
    // real tile slides to centre after the last poof
    const slide = K.ease.inOut(K.prog(K.step(t, 15), T_G3 + 0.2, 0.4));
    const rx = Math.round(K.lerp(TILES[REAL], 135, slide));
    GH.forEach((gi, n) => {
      if (t >= GT[n]) return;
      const bob = [0, -1, 0, 1][(Math.floor(t * 6) + n) % 4];
      if (a > 0) uiTile(p, TILES[gi], TILE_Y + rise + bob, t, true, n);
    });
    if (t < T_WIN) uiTile(p, rx, TILE_Y + rise, t, false, 0);
    GH.forEach((gi, n) => K.poof(p, TILES[gi], TILE_Y, t, GT[n], 0.4));
    if (t >= T_G3 + 0.6) K.sparkle(p, rx + 18, TILE_Y - 16, t, T_G3 + 0.6);
    if (t >= T_WIN - 0.05) K.poof(p, 135, TILE_Y, t, T_WIN - 0.05, 0.35);
  }

  // ---------------- hi-res helpers ----------------
  // one chip at a time in the slot: pops in at s, shrinks out at e
  function slotChip(c, t, s, e, draw) {
    if (t < s || t >= e) return;
    const k = Math.min(K.pop(t, s, 0.3), 1 - K.prog(t, e - 0.15, 0.15));
    if (k > 0) draw(k);
  }

  window.CH[6] = {
    lo(p, t) {
      scene(p, t);
      // ---- snail ----
      if (t < T_GONE) {
        let s = 1, ax = SNX, moving = false;
        if (t >= T_SHR) {
          const u = K.prog(K.step(t, 8), T_SHR, 0.5);
          s = K.lerp(1, 0.34, u);
          if (t < T_SHR + 0.1) s = 1.06; // startled puff
        }
        if (t >= T_SCOOT) { moving = true; ax = Math.round(K.lerp(SNX, 300, K.ease.in(K.prog(K.step(t, 15), T_SCOOT, 0.8)))); }
        p.save(); p.beginPath(); p.rect(0, 0, WR, 480); p.rect(WR - 1, 166, 18, 32); p.clip();
        snail(p, ax, SNY, s, t, moving);
        p.restore();
        if (moving) for (let k = 0; k < 3; k++) K.dither(p, ax - 34 - k * 9, SNY - 6 - k * 3, 6 - k, 1, P.paper);
        if (t < T_SHR) zzz(p, SNX - 80, SNY - 70, t);
        if (t >= T_SHR && t < T_SCOOT) { K.R(p, SNX - 34, SNY - 40, 2, 5, P.paper); K.R(p, SNX - 34, SNY - 33, 2, 2, P.paper); }
      }
      // slime trail to the hole after it leaves
      if (t >= T_SCOOT + 0.3) K.dither(p, SNX, SNY - 2, Math.min(WR - SNX, Math.round((t - T_SCOOT) * 160)), 2, P.mintL, 1);

      scroll(p, t);
      tiles(p, t);

      // data link Byte → scroll while reading
      if (t >= T_SCR && t < T_ROLL) {
        const on = Math.floor(t * 10);
        for (let y = SC.y + SC.h + 4; y < BY - 66; y += 3) K.R(p, BX, y, 1, 2, ((y / 3 + on) % 4) === 0 ? P.goldL : P.mint);
      }

      // ---- characters ----
      let pose = 'idle', expr = 'worried', look = 1;
      if (t >= T_SCR) expr = 'happy';
      if (t >= T_SCR && t < T_MAG) pose = 'read';
      if (t >= T_MAG) { pose = 'point'; expr = 'wow'; }
      if (t >= T_MAG + 0.8) expr = 'happy';
      if (t >= T_TILES) { pose = 'idle'; look = 1; }
      if (t >= T_WIN) expr = 'wow';
      if (t >= T_GRIN) expr = 'grin';
      if (t >= T_BLADE) pose = 'sword';
      if (t < T_SCR) look = 1;
      const hop = Math.round(K.hop(t, T_BLADE, 0.4, 6));
      K.gio(p, GX, GY - hop, { t, pose, expr, u: 2, look, blade: t >= T_BLADE ? K.clamp((t - T_BLADE) / 0.3) : 0 });
      if (t >= T_BLADE) K.sparkle(p, GX + 14, GY - 100 - hop, t, T_BLADE + 0.15);

      let face = '!';
      if (t < T_SCR - 0.8) face = 'eyes';
      if (t >= T_SCR && t < T_ROLL) face = 'scroll';
      if (t >= T_MAG && t < T_MAG + 0.6) face = '!';
      if (t >= T_ROLL) face = 'eyes';
      if (t >= T_G1) face = 'happy';
      if (t >= T_WIN && t < T_GRIN) face = '!';
      if (t >= T_GRIN) face = 'happy';
      const bhop = Math.round(K.hop(t, T_SCR - 0.3, 0.3, 4) + K.hop(t, T_GRIN, 0.35, 5) + K.hop(t, T_GRIN + 0.5, 0.35, 3));
      K.byte(p, BX, BY - bhop, { t, face, level: 1, u: 3 });
    },

    hi(c, t) {
      // 33.1 the monster's name
      slotChip(c, t, T0 + 0.25, T_SCR, k => K.chip(c, 'Slow launch (TTFF)', 540, SLOT, { size: 48, scale: k, color: P.paper, border: P.red, fill: P.ink }));
      // 34.3 trace tool
      slotChip(c, t, T_SCR + 0.1, T_MAG, k => K.code(c, 'analyze_perfetto_traces', 540, SLOT, { size: 40, font: K.F.mono(40), scale: k }));
      // 36.1 hot functions tool
      slotChip(c, t, T_MAG, T_TILES, k => K.code(c, 'get_app_hot_functions', 540, SLOT, { size: 40, font: K.F.mono(40), scale: k, border: P.gold }));
      // 37.1 re-renders counter
      slotChip(c, t, T_TILES, T_WIN, k => {
        const n = 3 - GT.filter(g => t >= g).length;
        K.chip(c, `Re-renders x${n}`, 540, SLOT, { size: 48, scale: k, color: n ? P.mintL : P.goldL, border: n ? P.mint : P.gold });
      });
      // 38.1 win
      slotChip(c, t, T_GONE - 0.1, T_END + 1, k => K.chip(c, 'Faster start', 540, SLOT, { size: 52, scale: k, color: P.goldL, border: P.gold }));

      // scroll text
      const openU = K.prog(t, T_SCR + 0.35, 0.15) * (1 - K.prog(t, T_ROLL, 0.12));
      if (openU > 0) {
        if (t < T_MAG) K.text(c, 'launch trace', (SC.x1 - 16) * 4, (SC.y + 11) * 4, { font: K.F.px(40), color: P.stone, align: 'right', shadow: false, alpha: openU });
        if (t >= T_MAG + 0.1) {
          const k = K.pop(t, T_MAG + 0.1, 0.3);
          c.save(); c.globalAlpha = openU; c.translate((HOT.x + HOT.w / 2) * 4 + 20, (SC.y + 11) * 4); c.scale(k, k);
          K.text(c, 'hot function', 0, 0, { font: K.F.px(44), color: P.ink, shadow: false });
          c.fillStyle = P.gold; c.fillRect(-120, 26, 240, 6);
          c.restore();
        } else {
          K.text(c, 'slow', (HOT.x + HOT.w / 2) * 4, (SC.y + 11) * 4, { font: K.F.px(40), color: P.redD, shadow: false, alpha: openU });
        }
      }
    },
  };
})();
