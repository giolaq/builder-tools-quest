// Chapter 9 — Quest complete (bars 52–55, 102–110 s). Sunset village, lit Fire TV sign, end card.
(function () {
  const K = window.K, P = K.P;
  const T0 = K.at(52), T_CARD = K.at(53), T_WAVE = K.at(54), T_HOLD = K.at(54, 3), T_END = K.at(56);
  const HORIZON = 214;               // low-res y where sky meets land
  const SIGN = { x: 26, y: 238, w: 64, h: 40 }; // TV signpost screen (low-res)
  const GIO = [150, 346], BYTE = [212, 346];

  // ---------- sky: dithered sunset bands ----------
  function sky(p) {
    // [y0, y1, base, ditherColour]  (dark top -> bright horizon)
    const bands = [
      [0, 60, P.forestD, null], [60, 84, P.forestD, P.forest], [84, 112, P.forest, null], [112, 132, P.forest, P.goldD],
      [132, 156, P.goldD, null], [156, 174, P.goldD, P.gold], [174, 196, P.gold, null], [196, HORIZON, P.gold, P.goldL],
    ];
    bands.forEach(([a, b, c, d]) => { K.R(p, 0, a, K.LW, b - a, c); if (d) K.dither(p, 0, a, K.LW, b - a, d); });
    // stars in the dark top
    const r = K.rng(91);
    for (let i = 0; i < 26; i++) { const x = Math.floor(r() * K.LW), y = Math.floor(r() * 78); K.R(p, x, y, 1, 1, i % 5 ? P.mint : P.goldL); }
    // setting sun (half disc on the horizon)
    const cx = 196, cy = HORIZON + 2;
    const disc = (rad, col) => { for (let j = -rad; j <= 0; j++) { const hw = Math.round(Math.sqrt(rad * rad - j * j)); K.R(p, cx - hw, cy + j, hw * 2, 1, col); } };
    disc(24, P.goldL); disc(20, P.paper);
    // sun stripes (retro)
    [cy - 6, cy - 11].forEach((y, i) => K.R(p, cx - 24, y, 48, 2 - i, P.goldL));
    // clouds: flat pixel strips
    const cloud = (x, y, w) => { K.R(p, x + 3, y - 2, w - 8, 2, P.goldL); K.R(p, x, y, w, 3, P.goldL); K.R(p, x + 2, y + 3, w - 4, 1, P.goldD); };
    cloud(22, 140, 40); cloud(150, 122, 30); cloud(64, 176, 26); cloud(222, 168, 34);
  }

  // ---------- village skyline (houses with lit windows) ----------
  function house(p, x, w, h, roof, seed) {
    const by = HORIZON + 14, top = by - h;
    // roof (stepped triangle)
    const rh = Math.ceil(w / 2) - 1;
    for (let j = 0; j < rh; j++) { const hw = j + 1; K.R(p, x + w / 2 - hw - 1, top - rh + j, hw * 2 + 2, 1, P.ink); K.R(p, x + w / 2 - hw, top - rh + j, hw * 2, 1, roof); }
    K.R(p, x - 1, top - 1, w + 2, h + 1, P.ink); K.R(p, x, top, w, h, P.stoneD); K.dither(p, x, top, w, h, P.stone, seed % 2);
    K.R(p, x - 1, top - 1, w + 2, 1, P.ink);
    // windows lit warm
    for (let i = 0; i < Math.floor((w - 4) / 7); i++) { const wx = x + 3 + i * 7; K.R(p, wx, top + 3, 4, 4, P.goldL); K.R(p, wx, top + 3, 4, 1, P.gold); }
    // door
    K.R(p, x + w - 8, by - 7, 5, 7, P.brownD);
  }
  function village(p) {
    // far hills silhouette
    for (let x = 0; x < K.LW; x++) { const h = 6 + Math.round(4 * Math.sin(x / 19) + 3 * Math.sin(x / 7.3)); K.R(p, x, HORIZON - h, 1, h, P.forest); }
    K.R(p, 0, HORIZON, K.LW, 16, P.forest);
    K.tree(p, 118, HORIZON + 12, 0.8);
    house(p, 4, 30, 18, P.brown, 1); house(p, 44, 24, 14, P.stone, 2); house(p, 132, 28, 16, P.brown, 3); house(p, 236, 30, 20, P.stone, 4);
    K.tree(p, 175, HORIZON + 14, 0.9);
  }

  // ---------- ground ----------
  function ground(p) {
    K.grass(p, 0, HORIZON + 14, K.LW, K.LH - HORIZON - 14, 29);
    // warm light raking across the grass (sparse gold dither near horizon)
    K.dither(p, 0, HORIZON + 14, K.LW, 3, P.goldD);
    const r = K.rng(12); for (let i = 0; i < 70; i++) { const x = Math.floor(r() * K.LW), y = HORIZON + 18 + Math.floor(r() * 60); K.R(p, x, y, 1, 1, P.gold); }
    // stone path from bottom up to the sign
    K.path(p, 118, 300, 64, K.LH - 300);
    K.path(p, 60, 300, 122, 22);
    // flowers
    [[20, 330, P.gold], [240, 312, P.goldL], [104, 380, P.gold], [226, 400, P.mintL], [30, 420, P.goldL], [250, 360, P.gold], [96, 318, P.mintL]].forEach(([x, y, c]) => K.flower(p, x, y, c));
    K.bush(p, 246, 334); K.bush(p, 14, 360); K.bush(p, 236, 440);
  }

  // ---------- lit Fire TV signpost ----------
  function sign(p, t) {
    const { x, y, w, h } = SIGN;
    // glow halo (dithered, pulses slowly until hold)
    const pulse = t < T_HOLD ? Math.floor(K.step(t, 3) * 3) % 2 : 0;
    K.dither(p, x - 6 - pulse, y - 6 - pulse, w + 12 + pulse * 2, h + 12 + pulse * 2, P.goldL, 1);
    // posts
    K.OR(p, x + 10, y + h, 4, 330 - y - h + 12, P.brown); K.OR(p, x + w - 14, y + h, 4, 330 - y - h + 12, P.brown);
    K.R(p, x + 10, y + h, 1, 330 - y - h + 12, K.lighten(P.brown, 0.25));
    K.shadow(p, x + w / 2, 342, w + 6);
    // TV frame + lit screen
    K.R(p, x - 1, y - 1, w + 2, h + 2, P.ink); K.R(p, x, y, w, h, P.stoneD); K.R(p, x, y, w, 1, P.stoneL);
    K.R(p, x + 3, y + 3, w - 6, h - 6, P.ink);
    K.R(p, x + 4, y + 4, w - 8, h - 8, P.gold); K.dither(p, x + 4, y + 4, w - 8, h - 8, P.goldL);
    K.R(p, x + 5, y + 5, 6, 1, P.paper); K.R(p, x + 5, y + 6, 2, 3, P.paper);
    // antenna ears
    K.R(p, x + w / 2 - 8, y - 6, 1, 5, P.ink); K.R(p, x + w / 2 + 7, y - 6, 1, 5, P.ink);
    K.R(p, x + w / 2 - 9, y - 8, 3, 2, P.goldL); K.R(p, x + w / 2 + 6, y - 8, 3, 2, P.goldL);
  }

  // ---------- sparkles (pre-hold only) ----------
  const SPK = [[40, 230], [96, 252], [182, 226], [238, 262], [124, 196], [70, 276], [214, 208], [20, 270]];
  function sparkles(p, t) {
    SPK.forEach(([x, y], i) => {
      for (let k = 0; k < 8; k++) { const s = T0 + 0.1 + i * 0.23 + k * 0.62; if (s + 0.5 > T_HOLD) break; K.sparkle(p, x + ((k * 13) % 9) - 4, y + ((k * 7) % 11) - 5, t, s, k % 2 ? P.goldL : P.mintL, 0.5); }
    });
    // burst around Gio's blade at the level-up moment
    K.sparkle(p, GIO[0] + 24, GIO[1] - 150, t, T0 + 0.05, P.goldL, 0.6);
    K.sparkle(p, GIO[0] + 24, GIO[1] - 150, t, T0 + 0.9, P.paper, 0.6);
    K.sparkle(p, BYTE[0], BYTE[1] - 80, t, T0 + 0.5, P.mintL, 0.6);
  }

  function lo(p, t) {
    sky(p); village(p); ground(p); sign(p, t);
    const waving = t >= T_WAVE;
    // Byte: happy, levelled; hops at 52.1 and 54.1, then still from hold
    const bt = t < T_HOLD ? t : 0; // frozen (bob 0) during the hold
    const bh = Math.round(K.hop(t, T0 + 0.15, 0.4, 8) + K.hop(t, T_WAVE + 0.1, 0.4, 6));
    K.byte(p, BYTE[0], BYTE[1] - bh, { t: bt, face: 'happy', level: 1, u: 3 });
    // Gio: blade raised with gold glow, then waves goodbye
    const gh = Math.round(K.hop(t, T0 + 0.05, 0.35, 5));
    if (!waving) K.gio(p, GIO[0], GIO[1] - gh, { t, pose: 'sword', expr: 'grin', blade: 0.75 + 0.25 * (Math.floor(K.step(t, 4) * 4) % 2), u: 3 });
    else K.gio(p, GIO[0], GIO[1], { t, pose: 'wave', expr: 'happy', u: 3 });
    if (t < T_HOLD) sparkles(p, t);
  }

  // ---------- hi-res overlay ----------
  const CMD = ['npx -y', '@amazon-devices/amazon-devices-buildertools-mcp@latest', 'init-context'];
  function hi(c, t) {
    // "Fire TV" text on the lit sign
    const sx = K.H4(SIGN.x + SIGN.w / 2), sy = K.H4(SIGN.y + SIGN.h / 2);
    K.text(c, 'Fire TV', sx, sy + 2, { font: K.F.px(44), color: P.ink, shadow: false });

    // QUEST COMPLETE banner: pops at 52.1, gives way before the end card
    const bIn = K.pop(t, T0 + 0.1, 0.4), bOut = K.prog(t, T_CARD - 0.45, 0.3);
    if (bIn > 0 && bOut < 1) {
      c.save(); c.globalAlpha = 1 - bOut; c.translate(540, 700 - Math.round(bOut * 60 / 4) * 4); c.scale(bIn, bIn);
      c.font = K.F.arcade(44); const w = c.measureText('QUEST COMPLETE').width + 80;
      K.box(c, -w / 2, -56, w, 112, { fill: P.forestD, border: P.gold });
      const blinkOn = Math.floor((t - T0) * 4) % 2 === 0 || t - T0 > 1.0;
      K.text(c, 'QUEST COMPLETE', 0, 4, { font: K.F.arcade(44), color: blinkOn ? P.gold : P.goldL, shadow: true });
      c.restore();
    }

    // End card
    const cIn = K.pop(t, T_CARD, 0.4);
    if (cIn > 0) {
      const X = 60, W = 960, Y = 284, H = 420;
      c.save(); c.translate(540, Y + H / 2); c.scale(cIn, cIn); c.translate(-540, -(Y + H / 2));
      K.box(c, X, Y, W, H, { fill: P.forestD, border: P.gold });
      // title (two lines)
      const ta = K.prog(t, T_CARD + 0.2, 0.2);
      K.text(c, 'Amazon Devices', 540, Y + 76, { font: K.F.px(68), color: P.goldL, alpha: ta });
      K.text(c, 'Builder Tools', 540, Y + 150, { font: K.F.px(68), color: P.goldL, alpha: ta });
      // command panel
      const px = X + 10, pw = W - 20, py = Y + 200, ph = 196;
      c.globalAlpha = ta; c.fillStyle = P.mint; c.fillRect(px, py, pw, ph); c.fillStyle = P.ink; c.fillRect(px + 4, py + 4, pw - 8, ph - 8); c.globalAlpha = 1;
            CMD.forEach((s, i) => {
        const a = K.prog(t, T_CARD + 0.35 + i * 0.15, 0.15);
        let size = 30; c.font = K.F.mono(size); while (c.measureText(s).width > pw - 20 && size > 28) { size--; c.font = K.F.mono(size); }
        K.text(c, s, 540, py + 42 + i * 56, { font: K.F.mono(size), color: i === 0 ? P.mintL : P.goldL, alpha: a, shadow: false });
      });
      c.restore();
    }

    // URL at 54.1
    const ua = K.prog(t, T_WAVE + 0.1, 0.3);
    if (ua > 0) K.text(c, 'developer.amazon.com', 540, 756 - Math.round((1 - ua) * 12), { font: K.F.px(60), color: P.ink, alpha: ua, shadow: false });
  }

  window.CH[9] = { lo, hi };
})();
