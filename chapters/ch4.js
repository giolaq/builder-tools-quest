// Chapter 4 — "The library" (bars 19–25, 36–50 s). Inside a tall library tower.
(function () {
  const K = window.K, P = K.P;
  const T0 = K.at(19), T_BALL = K.at(22), T_ASK = K.at(23, 3), T_END = K.at(26);
  const T_ANS = T_ASK + 1.1;                 // Byte answers
  const T_SIT = T_ASK - 0.35;                // Gio hops onto the book pile
  const GX = 62, GY = 352, BX = 212, BY = 352;   // Gio / Byte feet (low-res)
  const BALL = { x: 137, y: 298, r: 15 };        // crystal ball centre
  const ROW0 = 76, ROWH = 60;                    // shelf rows: top of each row
  const LEFT = [16, 131], RIGHT = [139, 254];    // bookcase columns (low-res x)
  // six featured Agent Skills books: two columns of three
  const BOOKS = [
    { lab: 'Setup', col: 0, row: 0, t: K.at(20, 1), c: P.emerald },
    { lab: 'Focus', col: 0, row: 1, t: K.at(20, 2), c: P.gold },
    { lab: 'Media', col: 0, row: 2, t: K.at(20, 3), c: P.water },
    { lab: 'UI', col: 1, row: 0, t: K.at(20, 4), c: P.mint },
    { lab: 'Manifest', col: 1, row: 1, t: K.at(21, 1), c: P.brown },
    { lab: 'Performance', col: 1, row: 2, t: K.at(21, 2), c: P.forest },
  ];
  const FB_W = 11, FB_H = 42;
  BOOKS.forEach(b => { b.x = (b.col ? RIGHT[0] : LEFT[0]) + 6; b.bot = ROW0 + b.row * ROWH + 52; });

  // ---------------- low-res scenery ----------------
  const SPINE = [P.forest, P.emerald, P.stone, P.brown, P.brownD, P.goldD, P.forestD, P.stoneL, P.water, P.redD];
  function disc(p, cx, cy, r, col) {
    p.fillStyle = col;
    for (let j = -r; j <= r; j++) { const hw = Math.round(Math.sqrt(r * r - j * j)); p.fillRect(K.r(cx - hw), K.r(cy + j), hw * 2, 1); }
  }
  function lantern(p, x, len, t, seed) {
    K.R(p, x, 0, 1, len, P.ink);
    const y = len;
    K.OR(p, x - 4, y, 9, 2, P.stoneD);
    K.R(p, x - 4, y + 2, 1, 9, P.ink); K.R(p, x + 4, y + 2, 1, 9, P.ink);
    K.R(p, x - 3, y + 2, 7, 9, P.goldD);
    const fl = Math.floor(t * 6 + seed) % 3;
    K.R(p, x - 1, y + 4 + (fl === 1 ? 1 : 0), 3, 5 - (fl === 1 ? 1 : 0), P.goldL); K.R(p, x, y + 3 + (fl === 2 ? 1 : 0), 1, 2, P.paper);
    K.OR(p, x - 4, y + 11, 9, 2, P.stoneD);
    if (fl !== 0) K.dither(p, x - 9, y + 1, 19, 13, 'rgba(235,231,154,0.18)', 1);
  }
  function candle(p, x, y, t, seed) { // candle standing on (x, y)
    K.OR(p, x - 1, y - 7, 3, 7, P.paper); K.R(p, x + 1, y - 7, 1, 7, P.paperD);
    const f = Math.floor(t * 8 + seed * 3) % 3;
    K.R(p, x, y - 9 - (f === 2 ? 1 : 0), 1, 2 + (f === 2 ? 1 : 0), P.goldL); K.R(p, x - (f === 1 ? 1 : 0), y - 10 - (f === 2 ? 1 : 0), 1, 1, P.gold);
  }
  function candelabra(p, x, t, seed) { // floor stand, feet at y 300
    K.OR(p, x - 5, 298, 11, 3, P.goldD); K.R(p, x - 1, 262, 3, 36, P.ink); K.R(p, x, 262, 1, 36, P.goldD);
    K.OR(p, x - 7, 260, 15, 2, P.goldD); K.R(p, x - 7, 260, 15, 1, P.gold);
    candle(p, x - 5, 259, t, seed); candle(p, x + 5, 259, t, seed + 1); candle(p, x, 257, t, seed + 2);
    if (Math.floor(t * 3 + seed) % 4) K.dither(p, x - 10, 244, 21, 12, 'rgba(235,231,154,0.2)', 1);
  }
  function window_(p, t) {
    // tall arched window, night sky
    const x = 113, y = 6, w = 44, h = 52;
    K.R(p, x - 3, y + 6, w + 6, h - 3, P.stoneL);
    disc(p, x + w / 2, y + 20, 25, P.stoneL);
    K.R(p, x, y + 18, w, h - 18, P.ink); disc(p, x + w / 2, y + 20, 22, P.ink);
    K.R(p, x + 1, y + 18, w - 2, h - 19, P.forestD); disc(p, x + w / 2, y + 20, 21, P.forestD);
    // stars
    const r = K.rng(11);
    for (let k = 0; k < 10; k++) { const sx = x + 4 + Math.floor(r() * (w - 8)), sy = y + 4 + Math.floor(r() * (h - 10)); if ((k + Math.floor(t * 2)) % 4) K.R(p, sx, sy, 1, 1, k % 3 ? P.mintL : P.goldL); }
    // moon
    disc(p, x + 30, y + 16, 5, P.paper); disc(p, x + 32, y + 14, 4, P.forestD);
    // mullions
    K.R(p, x + w / 2 - 1, y + 1, 2, h - 2, P.ink); K.R(p, x, y + 30, w, 2, P.ink);
    K.R(p, x - 4, y + h - 1, w + 8, 3, P.stoneL); K.R(p, x - 4, y + h + 2, w + 8, 1, P.ink);
  }
  function books(p, row, x0, x1, skip, seed) {
    const r = K.rng(seed), bot = ROW0 + row * ROWH + 52;
    let x = x0 + 1;
    while (x < x1 - 3) {
      if (skip != null && x >= skip - 1 && x < skip + FB_W + 1) { x = skip + FB_W + 1; continue; }
      const w = 4 + Math.floor(r() * 4), h = 30 + Math.floor(r() * 14);
      const ww = Math.min(w, x1 - x - 1); if (ww < 3) break;
      const lean = r() < 0.08 && x > x0 + 20;
      const c = SPINE[Math.floor(r() * SPINE.length)];
      if (lean) { // a leaning book: stepped diagonal
        for (let j = 0; j < h - 4; j++) K.R(p, x + Math.floor(j / 6), bot - j - 1, ww, 1, j % 6 === 0 ? P.ink : c);
      } else {
        K.R(p, x, bot - h, ww, h, P.ink); K.R(p, x + 1, bot - h + 1, ww - 2 < 1 ? 1 : ww - 1, h - 1, c);
        K.R(p, x + 1, bot - h + 1, 1, h - 1, K.lighten(c, 0.2));
        K.R(p, x + 1, bot - h + 5, ww - 1, 1, P.goldD); K.R(p, x + 1, bot - 6, ww - 1, 1, P.goldD);
      }
      x += ww + (r() < 0.12 ? 2 : 0);
    }
  }
  function bookcase(p) {
    // frame
    K.R(p, 10, 62, 250, 200, P.ink); K.R(p, 11, 63, 248, 198, P.brownD);
    K.block(p, 8, 62, 254, 8, P.brown); // cornice
    for (let row = 0; row < 3; row++) {
      const top = ROW0 + row * ROWH;
      [LEFT, RIGHT].forEach(([a, b], ci) => {
        K.R(p, a, top - 4, b - a, 56, P.ink); K.R(p, a + 1, top - 3, b - a - 2, 55, K.lighten(P.brownD, -0.35));
        K.dither(p, a + 1, top - 3, b - a - 2, 8, 'rgba(0,0,0,0.35)');
        const fb = BOOKS.find(q => q.row === row && q.col === ci);
        books(p, row, a, b, fb ? fb.x : null, 17 + row * 7 + ci * 31);
      });
      K.block(p, 12, top + 52, 246, 4, P.brown); // shelf board
      K.R(p, 12, top + 56, 246, 1, P.ink);
    }
    // centre post + side posts
    K.block(p, 131, 66, 8, 196, P.brown, { outline: false }); K.R(p, 131, 66, 1, 196, P.ink); K.R(p, 138, 66, 1, 196, P.ink);
    K.block(p, 10, 66, 6, 196, P.brown, { outline: false }); K.block(p, 254, 66, 6, 196, P.brown, { outline: false });
    // plinth
    K.block(p, 8, 252, 254, 10, P.brownD);
    K.R(p, 30, 255, 40, 2, P.brown); K.R(p, 200, 255, 40, 2, P.brown);
  }
  function scene(p, t) {
    K.wall(p, 0, 0, 270, 262);
    K.dither(p, 0, 0, 270, 262, 'rgba(8,20,14,0.4)');
    window_(p, t);
    lantern(p, 188, 20, t, 1); lantern(p, 226, 30, t, 2);
    bookcase(p);
    // flagstone floor (lighter, big square tiles, distinct from the brick wall)
    K.R(p, 0, 262, 270, 218, P.stoneL);
    for (let y = 262, row = 0; y < 480; y += 18, row++) {
      K.R(p, 0, y, 270, 1, P.stone);
      for (let x = (row % 2) * 13; x < 270; x += 26) { K.R(p, x, y, 1, 18, P.stone); K.R(p, x + 1, y + 1, 24, 1, K.lighten(P.stoneL, 0.12)); }
    }
    K.dither(p, 0, 262, 270, 218, 'rgba(18,21,21,0.18)');
    K.dither(p, 0, 262, 270, 6, 'rgba(10,15,12,0.55)');
    // rug
    K.R(p, 22, 318, 226, 44, P.ink); K.R(p, 23, 319, 224, 42, P.forest); K.R(p, 26, 322, 218, 36, P.emerald);
    K.dither(p, 28, 324, 214, 32, P.forest, 1); K.R(p, 26, 339, 218, 1, P.gold);
    for (let x = 24; x < 248; x += 6) { K.R(p, x, 362, 2, 3, P.paperD); }
    candelabra(p, 20, t, 0); candelabra(p, 250, t, 5);
  }
  // featured book (slides up out of the shelf on its beat)
  function featured(p, b, t) {
    const u = K.ease.back(K.prog(K.step(t, 15), b.t - 0.05, 0.3));
    const lift = Math.round(12 * u);
    const active = t >= b.t - 0.05;
    const x = b.x, y = b.bot - FB_H - lift;
    // gap left behind
    if (lift > 0) K.R(p, x, b.bot - lift, FB_W, lift, P.ink);
    // pre-cue shimmer
    if (!active && t > b.t - 0.35) K.dither(p, x - 1, y - 1, FB_W + 2, FB_H + 2, P.goldL, Math.floor(t * 12) % 2);
    const glow = (b.lab === 'Focus' && t >= T_ANS - 0.1) ? 1 : (active && t < b.t + 0.6 ? 1 : 0);
    const edge = glow ? P.goldL : (active ? P.gold : P.ink);
    if (glow) K.dither(p, x - 3, y - 3, FB_W + 6, FB_H + 6, 'rgba(235,231,154,0.6)', Math.floor(t * 8) % 2);
    K.R(p, x - 1, y - 1, FB_W + 2, FB_H + 2, edge);
    K.R(p, x, y, FB_W, FB_H, P.ink);
    K.R(p, x + 1, y + 1, FB_W - 2, FB_H - 2, b.c); K.R(p, x + 1, y + 1, 1, FB_H - 2, K.lighten(b.c, 0.3)); K.R(p, x + FB_W - 2, y + 1, 1, FB_H - 2, K.lighten(b.c, -0.3));
    // gold bands + spine title strokes
    K.R(p, x + 1, y + 4, FB_W - 2, 2, P.gold); K.R(p, x + 1, y + FB_H - 6, FB_W - 2, 2, P.gold);
    for (let k = 0; k < 4; k++) K.R(p, x + 4, y + 11 + k * 5, 3, 3, b.c === P.gold ? P.ink : P.paper);
    if (active) K.sparkle(p, x + FB_W / 2, y - 2, t, b.t, P.goldL, 0.5);
  }
  function pedestal(p) {
    const x = BALL.x;
    K.OR(p, x - 13, 340, 26, 6, P.stoneL); K.R(p, x - 13, 340, 26, 1, P.paper);
    K.OR(p, x - 7, 318, 14, 22, P.stone); K.R(p, x - 7, 318, 2, 22, P.stoneL); K.R(p, x + 5, 318, 2, 22, P.stoneD);
    K.R(p, x - 7, 326, 14, 1, P.stoneD); K.R(p, x - 7, 332, 14, 1, P.stoneD);
    K.OR(p, x - 11, 313, 22, 5, P.stoneL); K.R(p, x - 11, 313, 22, 1, P.paper);
    // gold claw cradle
    K.R(p, x - 10, 309, 3, 4, P.goldD); K.R(p, x + 8, 309, 3, 4, P.goldD); K.R(p, x - 2, 310, 5, 3, P.gold);
  }
  function ball(p, t) {
    const { x, y, r } = BALL;
    const on = K.prog(K.step(t, 12), T_BALL - 0.1, 0.35);
    if (on > 0) { // stepped mint aura
      const pulse = Math.floor(t * 4) % 2;
      const rr = r + 3 + Math.round(on * 4) + pulse;
      K.dither(p, x - rr, y - rr, rr * 2, rr * 2, 'rgba(147,220,189,0.35)', pulse);
      disc(p, x, y, r + 3, 'rgba(74,186,145,0.45)');
    }
    disc(p, x, y, r + 1, P.ink);
    disc(p, x, y, r, on > 0.5 ? P.emerald : P.forestD);
    disc(p, x - 1, y + 1, r - 3, on > 0.5 ? P.mint : P.forest);
    if (on >= 1) {
      // docs page floating inside, gently bobbing
      const bob = Math.floor(t * 3) % 2;
      const px = x - 6, py = y - 8 + bob;
      K.R(p, px - 1, py - 1, 13, 16, P.ink); K.R(p, px, py, 11, 14, P.paper);
      K.R(p, px, py, 11, 3, P.gold);
      const sc = Math.floor((t - T_BALL) * 4);
      for (let k = 0; k < 4; k++) { const w = 3 + ((k * 5 + sc) % 6); K.R(p, px + 2, py + 5 + k * 2, w, 1, k === 1 ? P.emerald : P.stone); }
    }
    // highlights
    K.R(p, x - 9, y - 9, 3, 2, P.mintL); K.R(p, x - 10, y - 7, 2, 2, P.mintL); K.R(p, x + 7, y + 6, 1, 1, P.mintL);
    if (on > 0) { K.sparkle(p, x - 18, y - 12, t, T_BALL, P.mintL, 0.5); K.sparkle(p, x + 19, y - 6, t, T_BALL + 0.2, P.mintL, 0.5); K.sparkle(p, x + 2, y - 22, t, T_BALL + 0.4, P.goldL, 0.5); }
  }
  function bookPile(p, x) { // Gio's seat: three big books, top at y 330
    K.shadow(p, x, 351, 50);
    K.OR(p, x - 23, 343, 46, 8, P.forest); K.R(p, x - 23, 343, 46, 1, P.emeraldL); K.R(p, x + 18, 344, 4, 6, P.paper); K.R(p, x - 20, 346, 6, 2, P.gold);
    K.OR(p, x - 20, 335, 41, 7, P.brown); K.R(p, x - 20, 335, 41, 1, K.lighten(P.brown, 0.3)); K.R(p, x - 19, 336, 3, 6, P.paper); K.R(p, x + 14, 337, 4, 2, P.gold);
    K.OR(p, x - 22, 328, 43, 6, P.water); K.R(p, x - 22, 328, 43, 1, P.waterL); K.R(p, x + 16, 329, 3, 5, P.paper);
  }
  function openBook(p, x, y, t) { // held open in front of Gio, (x, y) = centre bottom
    K.R(p, x - 13, y - 8, 26, 9, P.ink);
    K.R(p, x - 12, y - 7, 11, 7, P.paper); K.R(p, x + 1, y - 7, 11, 7, P.paper);
    K.R(p, x - 1, y - 7, 2, 8, P.brownD); K.R(p, x - 13, y, 26, 1, P.brown);
    for (let k = 0; k < 3; k++) { K.R(p, x - 10, y - 6 + k * 2, 7, 1, P.stoneL); K.R(p, x + 3, y - 6 + k * 2, k === 1 ? 5 : 7, 1, P.stoneL); }
    if (Math.floor(t * 1.5) % 4 === 0) K.R(p, x + 2, y - 7, 10, 1, P.paperD); // page flutter
  }

  // ---------------- hi-res helpers ----------------
  function answerBubble(c, tx, ty, t) {
    const a = K.pop(t, T_ANS, 0.35); if (a <= 0) return;
    c.save(); c.translate(tx, ty); c.scale(a, a);
    const w = 200, h = 120, x = -w / 2, y = -24 - h;
    c.fillStyle = P.ink; c.fillRect(x - 4, y - 4, w + 8, h + 8); c.fillRect(-12, -24, 24, 8); c.fillRect(-8, -16, 16, 8); c.fillRect(-4, -8, 8, 8);
    c.fillStyle = P.paper; c.fillRect(x, y, w, h); c.fillRect(-8, -28, 16, 8); c.fillRect(-4, -20, 8, 8);
    c.fillStyle = P.paperD; c.fillRect(x, y + h - 4, w, 4);
    // pixel check in a gold tile
    const cx = 0, cy = y + h / 2 - 2;
    c.fillStyle = P.ink; c.fillRect(cx - 40, cy - 40, 80, 80); c.fillStyle = P.gold; c.fillRect(cx - 34, cy - 34, 68, 68);
    c.fillStyle = P.goldL; c.fillRect(cx - 34, cy - 34, 68, 6);
    c.fillStyle = P.forestD;
    [[-20, 0], [-12, 8], [-4, 16], [4, 8], [12, 0], [20, -8], [28, -16]].forEach(([dx, dy]) => c.fillRect(cx + dx - 6 - 4, cy + dy - 6 - 2, 12, 12));
    c.restore();
  }

  window.CH[4] = {
    lo(p, t) {
      scene(p, t);
      BOOKS.forEach(b => featured(p, b, t));
      pedestal(p); ball(p, t);

      // ---- Gio: stands, points at the shelves, then hops onto the book pile to read ----
      bookPile(p, GX);
      const sitting = t >= T_SIT + 0.3;
      let pose = 'idle', expr = 'happy', look = 0;
      if (t >= K.at(20, 1) - 0.2 && t < K.at(21, 4)) { pose = 'point'; look = 1; }
      if (t >= K.at(20, 1) - 0.2 && t < K.at(20, 1) + 0.6) expr = 'wow';
      if (t >= T_BALL && t < T_SIT) { expr = 'wow'; look = 1; }
      if (t >= T_BALL + 0.8 && t < T_SIT) expr = 'happy';
      if (sitting) { pose = 'read'; expr = 'happy'; look = 0; }
      if (t >= T_ANS + 0.2) expr = 'grin';
      let gy = GY;
      if (t >= T_SIT && t < T_SIT + 0.3) gy = GY - Math.round(K.hop(t, T_SIT, 0.3, 12)) - Math.round(6 * K.prog(t, T_SIT, 0.3));
      if (sitting) gy = GY - 6;
      const g = K.gio(p, GX, gy, { t, pose, expr, u: 2, look });
      if (sitting) {
        // little dangling-feet swing
        openBook(p, GX, gy - 20, t);
      }

      // ---- Byte ----
      let face = 'eyes';
      if (t >= K.at(21, 2) + 0.4 && t < T_BALL) face = 'happy';
      if (t >= T_BALL + 0.2 && t < T_ANS) face = 'scroll';
      if (t >= T_ASK + 0.3 && t < T_ANS - 0.2) face = '!';
      if (t >= T_ANS) face = 'happy';
      const bh = Math.round(K.hop(t, T_ANS, 0.35, 6) + K.hop(t, T_ANS + 0.45, 0.3, 3) + K.hop(t, T_BALL + 0.1, 0.3, 4));
      K.byte(p, BX, BY - bh, { t, face, level: 1, u: 3 });
      // mint link from ball to Byte while it searches
      if (t >= T_BALL + 0.3 && t < T_ANS) {
        const on = Math.floor(t * 10);
        for (let x = BALL.x + 20; x < BX - 26; x += 3) K.R(p, x, 300, 2, 1, ((x / 3 + on) % 4) === 0 ? P.goldL : P.mint);
      }
    },

    hi(c, t) {
      // book labels: chips beside each book (active = gold, done = calm)
      c.font = K.F.px(44);
      BOOKS.forEach(b => {
        if (t < b.t) return;
        const w = Math.ceil(c.measureText(b.lab).width + 48);
        const cx = (b.x + FB_W + 5) * 4 + w / 2, cy = (b.bot - FB_H / 2 - 12) * 4;
        const hot = t < b.t + 0.6 || (b.lab === 'Focus' && t >= T_ANS - 0.1);
        K.chip(c, b.lab, cx, cy, {
          size: 44, scale: K.pop(t, b.t, 0.3),
          color: hot ? P.goldL : P.paper, border: hot ? P.gold : P.mint, fill: P.forestD,
        });
      });
      // 22.1 search_documentation
      const cA = K.prog(t, T_BALL, 0.15) * (1 - K.prog(t, T_SIT - 0.3, 0.25));
      if (cA > 0) K.code(c, 'search_documentation', BALL.x * 4, (BALL.y - BALL.r - 13) * 4, { size: 40, font: K.F.mono(40), alpha: cA, scale: K.pop(t, T_BALL, 0.35) });
      // 23.3 question + answer
      if (t >= T_ASK) {
        const q = 'How do I handle focus?';
        const n = Math.floor((t - T_ASK) * 30);
        const s = K.pop(t, T_ASK, 0.3);
        // fixed-width bubble, typed text
        c.save();
        const tx = GX * 4 + 20, ty = (GY - 6 - 70) * 4, cx = 420;
        c.font = K.F.px(46); const w = Math.ceil(c.measureText(q).width + 56), h = 78;
        c.translate(tx, ty); c.scale(s, s); c.translate(-tx, -ty);
        const x = cx - w / 2, y = ty - 24 - h;
        c.fillStyle = P.ink; c.fillRect(x - 4, y - 4, w + 8, h + 8); c.fillRect(tx - 12, ty - 24, 24, 8); c.fillRect(tx - 8, ty - 16, 16, 8); c.fillRect(tx - 4, ty - 8, 8, 8);
        c.fillStyle = P.paper; c.fillRect(x, y, w, h); c.fillRect(tx - 8, ty - 28, 16, 8); c.fillRect(tx - 4, ty - 20, 8, 8);
        c.fillStyle = P.paperD; c.fillRect(x, y + h - 4, w, 4);
        c.fillStyle = P.ink; c.textAlign = 'left'; c.textBaseline = 'middle';
        const vis = q.slice(0, Math.max(0, n)); c.fillText(vis, x + 28, y + h / 2 + 1);
        if (n < q.length && Math.floor(t * 8) % 2 === 0) { c.fillStyle = P.emerald; c.fillRect(x + 28 + c.measureText(vis).width + 4, y + h / 2 - 20, 6, 38); }
        c.restore();
        answerBubble(c, BX * 4, (BY - 66) * 4, t);
      }
    },
  };
})();
