// Chapter 8 — "The bridge" (bars 47–51, 92–102 s). A river; Byte builds a plank bridge; the Fire OS house hops over to Vega.
(function () {
  const K = window.K, P = K.P;
  const T0 = K.at(47), T_BUILD = K.at(48, 1), T_HOP = K.at(49, 3), T_REV = K.at(50, 3), T_END = K.at(52);
  const NPL = 6, PL_T = i => T_BUILD + i * K.BEAT;             // plank i lands on its beat (48.1 … 49.2)
  const RV0 = 170, RV1 = 262;                                  // river top / bottom (low-res)
  const BRX = 100, BRW = 50;                                    // bridge centre x / width
  const PLH = 15;                                              // plank pitch
  const HOUSE_B = 322, HOUSE_T = 158;                          // house base y: bottom bank → top bank
  const GIO = [40, 356];
  const BYTE_TOP = [42, 158];
  const HOPS = 6, HOP_D = 0.26;                                // stepped hops across
  const SIGN_F = { x: 200, y: 284 }, SIGN_V = { x: 164, y: 104 };
  const TV = { x: 198, y: 98, w: 56, h: 44 };
  const CL = { x: 72, y: 282, w: 84, h: 66 };                  // checklist panel

  // ---------------- low-res helpers ----------------
  function bank(p, y0, y1, seed) { K.grass(p, 0, y0, 270, y1 - y0, seed); }
  function river(p, t) {
    K.R(p, 0, RV0, 270, RV1 - RV0, P.water);
    K.dither(p, 0, RV0, 270, 5, K.lighten(P.water, -0.2));                    // shade under the top bank
    const s = K.step(t, 6);
    const r = K.rng(17);
    // drifting stepped ripples (move right), three speeds for depth
    for (let k = 0; k < 26; k++) {
      const y = RV0 + 8 + Math.floor(r() * (RV1 - RV0 - 14)), w = 4 + Math.floor(r() * 9), sp = 10 + (k % 3) * 6;
      const x = Math.floor(((r() * 300 + s * sp) % 300)) - 20;
      const bright = (k + Math.floor(s * 3)) % 5 === 0;
      K.R(p, x, y, w, 1, bright ? P.mintL : P.waterL);
      if (w > 7) K.R(p, x + 2, y + 1, w - 5, 1, K.lighten(P.water, 0.12));
    }
    // edges: ink line + foam that flickers in steps
    K.R(p, 0, RV0 - 1, 270, 1, P.ink); K.R(p, 0, RV1, 270, 1, P.ink);
    const f = Math.floor(t * 4) % 2;
    for (let x = f * 3; x < 270; x += 6) { K.R(p, x, RV0, 3, 1, P.waterL); K.R(p, x + 3, RV1 - 1, 3, 1, P.mintL); }
  }
  // dirt lips of both banks
  function lips(p) {
    K.R(p, 0, RV0 - 5, 270, 4, P.brown); K.R(p, 0, RV0 - 5, 270, 1, P.brownD); K.dither(p, 0, RV0 - 4, 270, 3, P.brownD);
    K.R(p, 0, RV1 + 1, 270, 3, P.brownD); K.dither(p, 0, RV1 + 1, 270, 2, P.brown, 1);
  }
  function reeds(p, x, y) {
    [[0, 9], [3, 12], [6, 8], [9, 11]].forEach(([dx, h]) => { K.R(p, x + dx - 1, y - h - 1, 3, h + 1, P.ink); K.R(p, x + dx, y - h, 1, h, P.emeraldL); });
    K.OR(p, x + 2, y - 15, 2, 4, P.brown);
  }
  function riverDecor(p, t) {
    const bob = Math.floor(t * 2) % 2;
    // lily pads
    [[196, 214], [232, 236], [34, 232]].forEach(([x, y], i) => {
      const yy = y + ((bob + i) % 2);
      K.R(p, x - 6, yy - 2, 12, 5, P.ink); K.R(p, x - 5, yy - 1, 10, 3, P.emerald); K.R(p, x - 4, yy - 1, 4, 1, P.mint); K.R(p, x, yy, 3, 1, P.ink);
      if (i === 0) { K.R(p, x - 2, yy - 4, 3, 2, P.goldL); K.R(p, x - 1, yy - 5, 1, 1, P.paper); }
    });
    // rocks in the stream, with a stepped wake
    [[160, 244], [52, 194]].forEach(([x, y]) => {
      K.OR(p, x, y, 9, 5, P.stoneL); K.R(p, x, y, 9, 1, P.paperD); K.R(p, x + 1, y + 4, 8, 1, P.stone);
      K.R(p, x + 11 + (Math.floor(t * 4) % 3) * 2, y + 2, 3, 1, P.mintL);
    });
    reeds(p, 8, RV0 + 4); reeds(p, 246, RV1 - 1); reeds(p, 150, RV1 - 1);
  }
  function plank(p, i, t) {
    const tl = PL_T(i); if (t < tl - 0.12) return;
    const drop = t < tl ? Math.round((tl - K.step(t, 24)) * 60) : 0;          // slides down quickly onto its beat
    const y = RV1 - (i + 1) * PLH + 1 - drop, x = BRX - BRW / 2;
    K.dither(p, x + 1, y + PLH - 1, BRW, 2, 'rgba(8,20,14,0.5)');
    K.OR(p, x, y, BRW, PLH - 2, P.brown);
    K.R(p, x, y, BRW, 1, K.lighten(P.brown, 0.3)); K.R(p, x, y + PLH - 3, BRW, 1, P.brownD);
    K.R(p, x + 6 + (i * 7) % 18, y + 4, 10, 1, P.brownD);                      // grain
    const fresh = t < tl + 0.2;
    K.R(p, x + 2, y + 5, 2, 2, fresh ? P.goldL : P.stoneL); K.R(p, x + BRW - 4, y + 5, 2, 2, fresh ? P.goldL : P.stoneL);
  }
  function posts(p, t) {
    const on = t >= PL_T(0) - 0.1;
    const x0 = BRX - BRW / 2 - 4, x1 = BRX + BRW / 2 + 1;
    [[RV1 - 2, true], [RV0 - 10, t >= PL_T(NPL - 1)]].forEach(([y, show]) => {
      if (!show || !on) return;
      K.OR(p, x0, y, 3, 10, P.brownD); K.OR(p, x1, y, 3, 10, P.brownD); K.R(p, x0, y, 3, 1, P.brown); K.R(p, x1, y, 3, 1, P.brown);
    });
  }
  // small house. anchor = base centre. step: -1 idle, 0/1 walking foot frame
  function house(p, cx, by, step) {
    const w = 46, h = 30, x = cx - w / 2, top = by - h;
    K.dither(p, x - 2, by, w + 4, 2, 'rgba(8,20,14,0.55)');
    if (step >= 0) { // little feet
      K.OR(p, x + 6, by - 1 - (step === 0 ? 2 : 0), 6, 3, P.brownD); K.OR(p, x + w - 12, by - 1 - (step === 1 ? 2 : 0), 6, 3, P.brownD);
    }
    K.OR(p, x, top, w, h, P.paperD); K.dither(p, x, top + h - 4, w, 4, K.lighten(P.paperD, -0.15));
    K.R(p, x, top, w, 1, P.paper);
    // roof (stepped)
    const rh = 15;
    for (let j = 0; j < rh; j++) { const hw = Math.round((j + 1) * (w / 2 + 3) / rh); K.R(p, cx - hw - 1, top - rh + j, hw * 2 + 2, 1, P.ink); K.R(p, cx - hw, top - rh + j, hw * 2, 1, j % 3 === 2 ? P.forestD : P.forest); }
    K.R(p, cx - (w / 2 + 4), top, w + 8, 2, P.ink);
    K.R(p, cx - 1, top - rh - 1, 2, 1, P.ink);
    // chimney
    K.OR(p, x + w - 9, top - 14, 4, 7, P.stone);
    // door + window
    K.OR(p, cx - 5, by - 15, 10, 15, P.brown); K.R(p, cx - 5, by - 15, 10, 1, K.lighten(P.brown, 0.3)); K.R(p, cx + 2, by - 8, 2, 2, P.gold);
    K.OR(p, x + 5, top + 6, 9, 8, P.goldL); K.R(p, x + 9, top + 6, 1, 8, P.ink); K.R(p, x + 5, top + 10, 9, 1, P.ink);
    K.OR(p, x + w - 14, top + 6, 9, 8, P.goldL); K.R(p, x + w - 10, top + 6, 1, 8, P.ink); K.R(p, x + w - 14, top + 10, 9, 1, P.ink);
  }
  function signpost(p, cx, y, w, lit) {
    K.OR(p, cx - 1, y + 14, 3, 20, P.brownD);
    K.block(p, cx - w / 2, y, w, 16, P.brown); K.R(p, cx - w / 2 + 2, y + 2, w - 4, 1, K.lighten(P.brown, 0.3));
    if (lit) K.R(p, cx - w / 2, y + 15, w, 1, P.gold);
  }
  function tvScreen(t) {
    return (p, sx, sy, sw, sh) => {
      K.R(p, sx, sy, sw, sh, P.forest); K.dither(p, sx, sy, sw, sh, P.emerald);
      const f = Math.floor(t * 3);
      // three tiles, one highlighted (focus) — hops along in steps
      for (let i = 0; i < 3; i++) {
        const tx = sx + 4 + i * 16, ty = sy + 8, on = (f % 3) === i;
        K.R(p, tx - 1, ty - 1, 14, 16, on ? P.gold : P.forestD); K.R(p, tx, ty, 12, 14, on ? P.mintL : P.mint);
      }
      K.R(p, sx + 4, sy + 3, 20, 2, P.goldL);
    };
  }
  function tvGlow(p, t) {
    if (Math.floor(t * 2) % 3 === 0) return;
    K.dither(p, TV.x - 4, TV.y - 4, TV.w + 8, 3, 'rgba(147,220,189,0.45)');
    K.dither(p, TV.x - 4, TV.y + TV.h - 2, 3, 6, 'rgba(147,220,189,0.45)'); K.dither(p, TV.x + TV.w + 1, TV.y + TV.h - 2, 3, 6, 'rgba(147,220,189,0.45)');
  }
  function hammer(p, x, y, down) {
    if (down) { K.OR(p, x, y - 2, 9, 2, P.brown); K.OR(p, x + 8, y - 5, 4, 8, P.stoneL); K.R(p, x + 8, y - 5, 4, 1, P.paper); }
    else { K.OR(p, x + 1, y - 11, 2, 9, P.brown); K.OR(p, x - 2, y - 15, 8, 4, P.stoneL); K.R(p, x - 2, y - 15, 8, 1, P.paper); }
  }
  function checklist(p, t) {
    const a = K.prog(K.step(t, 15), T_REV, 0.2); if (a <= 0) return;
    const s = Math.round(6 * (1 - K.ease.back(a)));
    const x = CL.x + s, y = CL.y + s, w = CL.w - 2 * s, h = CL.h - 2 * s;
    K.dither(p, x + 2, y + h + 1, w, 2, 'rgba(8,20,14,0.55)');
    K.R(p, x - 1, y - 1, w + 2, h + 2, P.ink); K.R(p, x, y, w, h, P.paper);
    // clip at top
    K.OR(p, x + w / 2 - 8, y - 3, 16, 5, P.stoneL); K.R(p, x + w / 2 - 8, y - 3, 16, 1, P.paper);
    if (a < 0.5) return;
    const rows = [[P.mint, 38], [P.gold, 30], [P.mint, 44]];
    rows.forEach(([col, lw], i) => {
      const ry = CL.y + 10 + i * 17, tc = T_REV + 0.5 + i * 0.5, done = t >= tc;
      K.R(p, CL.x + 6, ry, 10, 10, P.ink); K.R(p, CL.x + 7, ry + 1, 8, 8, done ? P.forestD : P.paper);
      if (done) { K.R(p, CL.x + 8, ry + 4, 2, 2, P.mintL); K.R(p, CL.x + 10, ry + 6, 2, 2, P.mintL); K.R(p, CL.x + 12, ry + 3, 2, 3, P.mintL); K.R(p, CL.x + 14, ry + 1, 1, 2, P.mintL); }
      // diff line: "+" marker and bar
      K.R(p, CL.x + 21, ry + 4, 5, 1, col); K.R(p, CL.x + 23, ry + 2, 1, 5, col);
      K.R(p, CL.x + 29, ry + 3, lw - 8, 3, col); K.R(p, CL.x + 29, ry + 6, Math.round((lw - 8) * 0.6), 1, P.paperD);
      if (done) K.sparkle(p, CL.x + 11, ry + 5, t, tc, P.goldL, 0.4);
    });
    // reading focus bar steps down the rows
    const cur = Math.min(2, Math.floor((t - T_REV) / 0.5));
    if (t < T_REV + 1.6) K.R(p, CL.x + 2, CL.y + 10 + cur * 17, 2, 10, P.gold);
  }
  // house position over time
  function housePos(t) {
    if (t < T_HOP) return { y: HOUSE_B, step: -1, lift: 0 };
    const k = Math.min(HOPS, Math.floor((t - T_HOP) / HOP_D));
    const ph = ((t - T_HOP) / HOP_D) - k;
    if (k >= HOPS) return { y: HOUSE_T, step: -1, lift: 0 };
    const y0 = K.lerp(HOUSE_B, HOUSE_T, k / HOPS), y1 = K.lerp(HOUSE_B, HOUSE_T, (k + 1) / HOPS);
    const u = K.step(ph, 8) ; // stepped within hop
    return { y: Math.round(K.lerp(y0, y1, u)), step: k % 2, lift: Math.round(Math.sin(u * Math.PI) * 6) };
  }
  // Byte position over time
  function bytePos(t) {
    if (t < T_BUILD - 0.5) return [150, 350];
    if (t < T_BUILD - 0.1) { const u = K.step(K.prog(t, T_BUILD - 0.5, 0.4), 8); return [Math.round(K.lerp(150, BRX + 4, u)), Math.round(K.lerp(350, RV1 + 8, u))]; }
    // stands at the lip of the last plank, moves onto each new plank after the strike
    let n = 0; for (let i = 0; i < NPL; i++) if (t >= PL_T(i) + 0.22) n = i + 1;
    const yAt = m => m === 0 ? RV1 + 8 : RV1 - (m - 1) * PLH - 4;
    if (n < NPL || t < K.at(49, 3) - 0.35) return [BRX + 4, yAt(n)];
    // walk off to the top bank left
    const u = K.step(K.prog(t, K.at(49, 3) - 0.35, 0.35), 10);
    return [Math.round(K.lerp(BRX + 4, BYTE_TOP[0], u)), Math.round(K.lerp(yAt(NPL), BYTE_TOP[1], u))];
  }

  window.CH[8] = {
    lo(p, t) {
      // ---- world ----
      bank(p, 0, RV0 - 4, 81); bank(p, RV1 + 2, 480, 82);
      K.path(p, BRX - 14, 0, 28, RV0 - 5); K.path(p, BRX - 14, RV1 + 4, 28, 480 - RV1 - 4); K.path(p, BRX + 14, 148, 126, 10);
      river(p, t); lips(p); riverDecor(p, t);
      // decor
      K.tree(p, 22, 62, 1); K.tree(p, 250, 64, 0.9); K.tree(p, 138, 48, 0.8); [[70, 80], [74, 84], [190, 70], [60, 120], [236, 160]].forEach(([x, y], i) => K.flower(p, x, y, i % 2 ? P.mintL : P.goldL)); K.flower(p, 60, 140); K.flower(p, 124, 150, P.mintL); K.flower(p, 250, 160);
      K.flower(p, 250, 300, P.goldL); K.flower(p, 244, 306, P.paper); K.flower(p, 238, 330, P.mintL); K.flower(p, 120, 350); K.tree(p, 30, 470, 1); K.tree(p, 240, 476, 1.1); K.flower(p, 150, 452, P.goldL);
      // top bank: Vega sign + lit TV
      signpost(p, SIGN_V.x, SIGN_V.y, 58, true);
      tvGlow(p, t);
      K.tv(p, TV.x, TV.y, TV.w, TV.h, tvScreen(t));
      // bottom bank: Fire OS sign
      signpost(p, SIGN_F.x, SIGN_F.y, 70, false);
      // bridge
      posts(p, t);
      for (let i = 0; i < NPL; i++) plank(p, i, t);
      for (let i = 0; i < NPL; i++) { K.poof(p, BRX, RV1 - i * PLH - 6, t, PL_T(i), 0.35); K.sparkle(p, BRX + 14, RV1 - i * PLH - 8, t, PL_T(i), P.goldL, 0.35); }
      checklist(p, t);

      // ---- characters (back to front by y) ----
      const hp = housePos(t);
      const [bx, by] = bytePos(t);
      const drawByte = () => {
        let face = 'eyes';
        if (t >= T_BUILD - 0.5 && t < PL_T(NPL - 1) + 0.3) face = 'scroll';
        if (t >= PL_T(NPL - 1) + 0.3) face = 'happy';
        if (t >= T_REV) face = '!';
        if (t >= T_REV + 1.6) face = 'happy';
        const walking = (t >= T_BUILD - 0.5 && t < T_BUILD - 0.1) || (t >= K.at(49, 3) - 0.35 && t < K.at(49, 3));
        const bh = walking ? (Math.floor(t * 8) % 2) : Math.round(K.hop(t, T_HOP + HOPS * HOP_D, 0.35, 5));
        K.byte(p, bx, by - bh, { t, face, level: 1, u: 2 });
        // hammer during the build: raised before each beat, down on it
        if (t >= T_BUILD - 0.25 && t < PL_T(NPL - 1) + 0.3) {
          let down = false; for (let i = 0; i < NPL; i++) if (t >= PL_T(i) && t < PL_T(i) + 0.18) down = true;
          hammer(p, bx + 14, by - 14, down);
        }
      };
      const drawHouse = () => house(p, BRX, hp.y - hp.lift, hp.step);
      if (by < hp.y) { drawByte(); drawHouse(); } else { drawHouse(); drawByte(); }
      if (t >= T_HOP + HOPS * HOP_D) { K.sparkle(p, BRX - 20, HOUSE_T - 30, t, T_HOP + HOPS * HOP_D, P.goldL, 0.5); K.sparkle(p, BRX + 22, HOUSE_T - 20, t, T_HOP + HOPS * HOP_D + 0.12, P.goldL, 0.5); }
      for (let k = 0; k < HOPS; k++) if (t >= T_HOP) { /* dust on each landing */
        const tl = T_HOP + (k + 1) * HOP_D, ly = Math.round(K.lerp(HOUSE_B, HOUSE_T, (k + 1) / HOPS));
        const u = K.prog(t, tl, 0.2); if (u > 0 && u < 1) { const d = 18 + Math.round(u * 6); K.R(p, BRX - d, ly - 2, 3, 2, P.paper); K.R(p, BRX + d - 3, ly - 2, 3, 2, P.paper); }
      }

      // Gio
      let pose = 'idle', expr = 'happy', look = 1;
      if (t < T0 + 1.2) pose = 'wave';
      else if (t < T_BUILD) pose = 'point';
      if (t >= T_BUILD) { pose = 'idle'; look = 1; }
      if (t >= T_HOP) { expr = 'wow'; }
      if (t >= T_HOP + HOPS * HOP_D) { expr = 'grin'; pose = 'cheer'; }
      if (t >= T_REV) { pose = 'point'; expr = 'happy'; }
      if (t >= T_REV + 1.6) expr = 'grin';
      const gh = pose === 'cheer' ? Math.round(K.hop(t, T_HOP + HOPS * HOP_D, 0.4, 5)) : 0;
      K.gio(p, GIO[0], GIO[1] - gh, { t, pose, expr, u: 2, look });
    },

    hi(c, t) {
      // signs
      K.text(c, 'Vega OS', SIGN_V.x * 4, (SIGN_V.y + 8) * 4 + 2, { font: K.F.px(44), color: P.goldL });
      K.text(c, 'Fire OS app', SIGN_F.x * 4, (SIGN_F.y + 8) * 4 + 2, { font: K.F.px(42), color: t < T_HOP ? P.goldL : P.paperD });
      // 49.3 Beta chip beside the house, once it lands
      const tb = T_HOP + HOPS * HOP_D;
      if (t >= T_HOP) {
        const s = K.pop(t, T_HOP, 0.35), hp = housePos(t);
        K.chip(c, 'Beta', BRX * 4, (hp.y - hp.lift - 57) * 4, { size: 48, scale: s, color: P.ink, fill: P.gold, border: P.goldL });
      }
      // 50.3 review chip
      if (t >= T_REV) {
        K.chip(c, 'Review the changes', 540, (RV1 + 1) * 4, { size: 48, scale: K.pop(t, T_REV, 0.35), color: P.goldL });
      }
    },
  };
})();
