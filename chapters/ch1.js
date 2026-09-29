// Chapter 1 — "The quest" (bars 1–6, 0–12 s)
(function () {
  const K = window.K, P = K.P;
  const T_IN = K.at(1), T_GIO = K.at(2), T_BYTE = K.at(3), T_Q = K.at(4), T_QUEST = K.at(5, 3), T_END = K.at(7);

  // layout (low-res)
  const PATH_X = 110, PATH_W = 50;             // vertical path
  const SIGN = { x: 96, y: 70, w: 78, h: 44 }; // TV signpost frame
  const GIO_X = 108, BYTE_X = 170, FEET = 272;
  const SCROLL = { cx: 135, y: 282, w: 216, h: 62 };

  // ---------- scenery ----------
  function house(p, x, y, w, roof, roofD, seed) {
    // walls
    const wy = y + 22, wh = 30;
    K.shadow(p, x + w / 2, wy + wh, w + 6);
    K.OR(p, x, wy, w, wh, P.paper);
    K.R(p, x, wy, w, 2, P.paperD); K.R(p, x + w - 2, wy, 2, wh, P.paperD);
    // timber beams
    K.R(p, x, wy + 10, w, 1, P.brownD);
    // door
    const dx = x + Math.floor(w / 2) - 5;
    K.OR(p, dx, wy + 14, 10, 16, P.brown); K.R(p, dx + 1, wy + 15, 8, 1, K.lighten(P.brown, 0.2)); K.R(p, dx + 7, wy + 22, 1, 2, P.gold);
    // windows (warm light)
    [[x + 5, wy + 14], [x + w - 15, wy + 14]].forEach(([wx, wyy]) => {
      K.OR(p, wx, wyy, 10, 8, P.goldL); K.R(p, wx, wyy + 4, 10, 4, P.gold); K.R(p, wx + 4, wyy, 1, 8, P.brownD); K.R(p, wx, wyy + 3, 10, 1, P.brownD);
    });
    // stepped roof: ink silhouette first, then fill
    const rowX = j => { const inset = Math.max(0, 12 - Math.floor(j / 2)); return [x - 4 + inset, w + 8 - inset * 2]; };
    for (let j = 0; j < 24; j++) { const [rx, rw] = rowX(j); K.R(p, rx - 1, y + j - 1, rw + 2, 2, P.ink); }
    K.R(p, x - 5, y + 23, w + 10, 2, P.ink);
    for (let j = 0; j < 24; j++) { const [rx, rw] = rowX(j); K.R(p, rx, y + j, rw, 1, j % 4 === 3 ? roofD : roof); K.R(p, rx, y + j, 1, 1, K.lighten(roof, 0.3)); }
    K.R(p, x + 8, y + 1, w - 16, 1, K.lighten(roof, 0.35));
    // chimney
    K.OR(p, x + w - 16, y - 2, 6, 10, P.stone); K.R(p, x + w - 16, y - 2, 6, 1, P.stoneL);
    return [x + w - 13, y - 4];
  }
  function smoke(p, sx, sy, t, off) {
    for (let k = 0; k < 3; k++) {
      const u = ((K.step(t, 6) * 0.35 + k / 3 + off) % 1);
      const px = sx + Math.round(Math.sin(u * 5 + k) * 2) + Math.round(u * 5), py = sy - Math.round(u * 22);
      const s = u < 0.5 ? 3 : 2; p.globalAlpha = 0.75 * (1 - u); K.R(p, px, py, s, s, P.paperD); p.globalAlpha = 1;
    }
  }
  function well(p, cx, by, t) {
    K.shadow(p, cx, by, 30);
    // stone ring
    K.OR(p, cx - 12, by - 14, 24, 14, P.stone);
    for (let i = 0; i < 4; i++) K.R(p, cx - 12 + i * 6 + (i % 2), by - 8, 5, 1, P.stoneD);
    K.R(p, cx - 12, by - 14, 24, 1, P.stoneL);
    // water opening
    K.R(p, cx - 9, by - 18, 18, 5, P.ink); K.R(p, cx - 8, by - 17, 16, 3, P.water);
    if (Math.floor(t * 3) % 2) K.R(p, cx - 4, by - 16, 3, 1, P.waterL); else K.R(p, cx + 2, by - 16, 3, 1, P.waterL);
    // posts + roof
    K.OR(p, cx - 12, by - 34, 2, 18, P.brown); K.OR(p, cx + 10, by - 34, 2, 18, P.brown);
    K.OR(p, cx - 10, by - 30, 20, 1, P.brownD);
    K.R(p, cx - 0, by - 29, 1, 8, P.ink); K.OR(p, cx - 2, by - 22, 4, 3, P.brown);
    for (let j = 0; j < 6; j++) { const iw = 16 + j * 4; K.R(p, cx - iw / 2 - 1, by - 42 + j, iw + 2, 1, P.ink); K.R(p, cx - iw / 2, by - 42 + j, iw, 1, j % 2 ? P.brownD : P.brown); }
    K.R(p, cx - 15, by - 36, 30, 1, P.ink);
  }
  function lamp(p, cx, by, t) {
    K.shadow(p, cx, by, 10);
    K.OR(p, cx - 1, by - 26, 2, 26, P.stoneD);
    K.OR(p, cx - 3, by - 2, 6, 2, P.stoneD);
    K.OR(p, cx - 3, by - 33, 6, 6, P.goldL); K.R(p, cx - 3, by - 30, 6, 3, P.gold);
    K.R(p, cx - 4, by - 34, 8, 1, P.ink); K.R(p, cx - 1, by - 36, 2, 2, P.ink);
  }
  function bush(p, cx, by) {
    K.shadow(p, cx, by - 1, 16);
    const rows = [[-5, 10], [-7, 14], [-8, 16], [-8, 16], [-8, 16], [-8, 16], [-7, 14]];
    rows.forEach(([o, w], j) => K.R(p, cx + o - 1, by - 8 + j - 1, w + 2, 3, P.ink));
    rows.forEach(([o, w], j) => K.R(p, cx + o, by - 8 + j, w, 1, j < 2 ? P.emeraldL : P.forest));
    K.R(p, cx - 4, by - 5, 3, 1, P.emerald); K.R(p, cx + 1, by - 4, 3, 1, P.emerald);
    K.R(p, cx - 2, by - 6, 1, 1, P.polo); K.R(p, cx + 3, by - 5, 1, 1, P.polo);
  }
  function fence(p, x, y, n) {
    for (let i = 0; i < n; i++) { K.OR(p, x + i * 7, y - 7, 2, 8, P.brown); }
    K.OR(p, x, y - 5, n * 7 - 5, 1, P.brownD);
  }
  function plaza(p) {
    // rounded stone square
    const x0 = 34, y0 = 150, w = 202, h = 150;
    K.R(p, x0 - 1, y0 + 3, w + 2, h - 6, P.ink); K.R(p, x0 + 3, y0 - 1, w - 6, h + 2, P.ink);
    p.save(); p.beginPath(); p.rect(x0 + 4, y0, w - 8, h); p.rect(x0, y0 + 4, w, h - 8); p.rect(x0 + 1, y0 + 2, w - 2, h - 4); p.rect(x0 + 2, y0 + 1, w - 4, h - 2); p.clip();
    K.R(p, x0, y0, w, h, P.stoneL);
    for (let y = y0; y < y0 + h; y += 10) {
      K.R(p, x0, y, w, 1, P.stone);
      for (let x = x0 + ((y - y0) / 10 % 2) * 7; x < x0 + w; x += 14) { K.R(p, x, y, 1, 10, P.stone); K.R(p, x + 1, y + 1, 12, 1, K.lighten(P.stoneL, 0.15)); }
    }
    // moss in the cracks
    const mr = K.rng(21); for (let k = 0; k < 30; k++) K.R(p, x0 + Math.floor(mr() * w), y0 + Math.floor(mr() * h), 2, 1, P.emerald);
    p.restore();
  }
  function signpost(p, t, flash) {
    const { x, y, w, h } = SIGN;
    K.shadow(p, x + w / 2, y + h + 18, w + 6);
    // posts
    K.OR(p, x + 10, y + h, 4, 18, P.brown); K.OR(p, x + w - 14, y + h, 4, 18, P.brown);
    K.R(p, x + 10, y + h, 1, 18, K.lighten(P.brown, 0.25)); K.R(p, x + w - 14, y + h, 1, 18, K.lighten(P.brown, 0.25));
    // rabbit-ear antenna
    for (let i = 0; i < 8; i++) { K.R(p, x + w / 2 - 2 - i, y - 2 - i, 1, 1, P.ink); K.R(p, x + w / 2 + 1 + i, y - 2 - i, 1, 1, P.ink); }
    K.R(p, x + w / 2 - 11, y - 11, 3, 3, P.gold); K.R(p, x + w / 2 + 8, y - 11, 3, 3, P.gold);
    K.OR(p, x + w / 2 - 4, y - 3, 8, 3, P.stoneD);
    // wooden frame
    const fr = flash ? P.gold : P.brown;
    K.R(p, x - 2, y - 2, w + 4, h + 4, P.ink);
    K.R(p, x - 1, y - 1, w + 2, h + 2, fr);
    K.R(p, x - 1, y - 1, w + 2, 1, flash ? P.goldL : K.lighten(P.brown, 0.3));
    K.R(p, x - 1, y + h, w + 2, 1, flash ? P.goldD : P.brownD);
    // bolts
    [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]].forEach(([bx, by]) => K.R(p, bx, by, 1, 1, P.goldL));
    // screen
    K.R(p, x + 2, y + 2, w - 4, h - 4, P.ink);
    const on = K.prog(t, 0.2, 0.45);
    if (on > 0) {
      const sh = Math.max(1, Math.round((h - 8) * on));
      const sy = y + 4 + Math.round((h - 8 - sh) / 2);
      K.R(p, x + 4, sy, w - 8, sh, P.forest);
      for (let j = sy; j < sy + sh; j += 2) K.R(p, x + 4, j, w - 8, 1, K.lighten(P.forest, -0.25));
      if (on >= 1) { K.R(p, x + 5, y + 5, 6, 1, P.emerald); K.R(p, x + 5, y + 6, 2, 3, P.emerald); }
    }
  }
  function scroll(p, t) {
    const u = K.tw(t, T_QUEST, 0.6, 'out');
    if (u <= 0) return;
    const { cx, y, h } = SCROLL; const half = Math.max(3, Math.round((SCROLL.w / 2) * u));
    const drop = Math.round((1 - K.tw(t, T_QUEST, 0.25, 'out')) * -10);
    const yy = y + drop;
    K.dither(p, cx - half, yy + h + 2, half * 2, 3, 'rgba(8,20,14,0.55)');
    // parchment sheet
    K.R(p, cx - half, yy - 1, half * 2, h + 2, P.ink);
    K.R(p, cx - half, yy, half * 2, h, P.paper);
    K.R(p, cx - half, yy, half * 2, 2, P.paperD); K.R(p, cx - half, yy + h - 3, half * 2, 3, P.paperD);
    K.dither(p, cx - half, yy + h - 5, half * 2, 2, P.paperD, 1);
    // aged specks
    const r = K.rng(77); for (let k = 0; k < 40; k++) { const sx = cx - 104 + Math.floor(r() * 208), sy = yy + 3 + Math.floor(r() * (h - 8)); if (Math.abs(sx - cx) < half - 3) K.R(p, sx, sy, 1, 1, P.paperD); }
    // rolled ends
    [-1, 1].forEach(s => {
      const rx = s < 0 ? cx - half - 6 : cx + half;
      K.R(p, rx - 1, yy - 4, 8, h + 8, P.ink);
      K.R(p, rx, yy - 3, 6, h + 6, P.paperD); K.R(p, rx + 1, yy - 3, 2, h + 6, P.paper); K.R(p, rx + 4, yy - 3, 2, h + 6, K.lighten(P.paperD, -0.2));
      K.R(p, rx + 1, yy - 6, 4, 3, P.brown); K.R(p, rx + 1, yy + h + 3, 4, 3, P.brown);
      K.R(p, rx + 1, yy - 6, 4, 1, P.ink); K.R(p, rx + 1, yy + h + 5, 4, 1, P.ink);
    });
    // gold seal (appears once open)
    if (u > 0.95) {
      const sx = cx + 88, sy = yy + h - 10;
      K.R(p, sx - 4, sy - 5, 9, 11, P.ink); K.R(p, sx - 5, sy - 4, 11, 9, P.ink);
      K.R(p, sx - 3, sy - 4, 7, 9, P.gold); K.R(p, sx - 4, sy - 3, 9, 7, P.gold); K.R(p, sx - 2, sy - 3, 3, 2, P.goldL);
      K.R(p, sx - 3, sy + 5, 2, 4, P.goldD); K.R(p, sx + 2, sy + 5, 2, 4, P.goldD);
    }
  }
  // flutter lines while the scroll unrolls
  function flutter(p, t) {
    const u = K.prog(t, T_QUEST, 0.6); if (u <= 0 || u >= 1) return;
    const half = Math.round((SCROLL.w / 2) * K.ease.out(u));
    [-1, 1].forEach(s => { const x = SCROLL.cx + s * (half + 12); for (let k = 0; k < 3; k++) K.R(p, x + s * (k % 2) * 2, SCROLL.y + 10 + k * 16, 4, 1, P.paper); });
  }

  function lo(p, t) {
    // grass everywhere
    K.grass(p, 0, 0, K.LW, K.LH, 11);
    // path from bottom into plaza, and short path up to the sign
    K.path(p, PATH_X, 290, PATH_W, 200);
    plaza(p);
    K.path(p, PATH_X + 5, 124, PATH_W - 10, 30);
    // flower beds along path
    const fr = K.rng(5);
    for (let k = 0; k < 14; k++) {
      const side = k % 2 ? 1 : -1; const fy = 360 + Math.floor(fr() * 110); const fx = side < 0 ? PATH_X - 6 - Math.floor(fr() * 20) : PATH_X + PATH_W + 4 + Math.floor(fr() * 20);
      K.flower(p, fx, fy, k % 3 ? P.gold : P.paper);
    }
    [[30, 318], [44, 326], [228, 316], [240, 330], [22, 150], [250, 152], [90, 138], [182, 140]].forEach(([x, y], i) => K.flower(p, x, y, i % 3 ? P.gold : P.polo));
    // houses (upper third)
    const c1 = house(p, 14, 66, 62, P.brown, P.brownD, 1);
    const c2 = house(p, 194, 66, 62, P.stone, P.stoneD, 2);
    // trees and bushes framing
    K.tree(p, 10, 62, 1.1); K.tree(p, 262, 58, 1.1);
    bush(p, 86, 146); bush(p, 184, 146);
    K.tree(p, 18, 262, 1); K.tree(p, 256, 262, 1);
    K.tree(p, 24, 410, 1.2); K.tree(p, 248, 420, 1.2); K.tree(p, 60, 470, 1); K.tree(p, 212, 476, 1);
    bush(p, 70, 340); bush(p, 200, 346);
    fence(p, 36, 360, 5); fence(p, 200, 360, 5);
    // signpost (flashes gold when Gio points at it)
    const flash = t >= T_Q && t < T_QUEST && Math.floor((t - T_Q) * 4) % 2 === 0 && t < T_Q + 1.5;
    signpost(p, t, flash);
    // chimney smoke
    smoke(p, c1[0], c1[1], t, 0); smoke(p, c2[0], c2[1], t, 0.5);
    // well + lamp on the plaza
    well(p, 58, 214, t);
    lamp(p, 222, 214, t);

    // ---- Byte trundles in behind (3.1)
    const bu = K.tw(K.step(t, 10), T_BYTE - 1.1, 1.3, 'out');
    if (t >= T_BYTE - 1.1) {
      const by = K.r(K.lerp(520, FEET, bu)), bx = K.r(K.lerp(PATH_X + 30, BYTE_X, K.tw(t, T_BYTE - 0.2, 0.5, 'inOut')));
      const hopY = K.r(K.hop(t, T_BYTE + 0.2, 0.3, 4));
      let face = 'eyes';
      if (t >= T_Q) face = '?';
      if (t >= T_QUEST + 0.3) face = '!';
      if (t >= T_QUEST + 1.3) face = 'eyes';
      K.byte(p, bx, by - hopY, { t, face, u: 3 });
    }

    // ---- Gio walks in (2.1), waves, points at sign (4.1), draws the blade (5.3)
    const wu = K.prog(K.step(t, 10), 0.2, 1.8);
    const gy = K.r(K.lerp(520, FEET, K.ease.out(wu)));
    let pose = 'walk', expr = 'happy', o = {};
    if (t >= 2.0) pose = 'idle';
    if (t >= T_GIO && t < T_GIO + 1.9) { pose = 'wave'; expr = 'grin'; }
    if (t >= T_BYTE && t < T_Q) { pose = 'idle'; o.look = 1; }
    if (t >= T_Q && t < T_QUEST) { pose = 'idle'; o.armR = 'up'; expr = 'wow'; }
    if (t >= T_Q + 1.6 && t < T_QUEST) { o.armR = 'down'; expr = 'worried'; o.look = 1; }
    if (t >= T_QUEST) { pose = 'sword'; expr = 'grin'; o.blade = K.clamp((t - T_QUEST) / 0.3); }
    const gHop = t >= T_QUEST ? K.r(K.hop(t, T_QUEST, 0.35, 6)) : 0;
    const g = K.gio(p, GIO_X, gy - gHop, Object.assign({ t, pose, expr, u: 3 }, o));
    // blade sparkle at the tip
    if (t >= T_QUEST) {
      const tipX = g.handR[0], tipY = g.handR[1] - 20 * 3;
      K.sparkle(p, tipX, tipY, t, T_QUEST + 0.25, P.goldL, 0.6);
      K.sparkle(p, tipX, tipY, t, T_QUEST + 1.4, P.goldL, 0.5);
      if (Math.floor(t * 3) % 3 === 0 && t > T_QUEST + 0.9) K.R(p, tipX + 6, tipY + 8, 1, 1, P.goldL);
    }
    // quest scroll
    scroll(p, t); flutter(p, t);
  }

  function hi(c, t) {
    // "Fire TV" on the signpost screen
    const on = K.prog(t, 0.45, 0.25);
    if (on > 0) {
      const cx = K.H4(SIGN.x + SIGN.w / 2), cy = K.H4(SIGN.y + SIGN.h / 2) + 2;
      const flash = t >= T_Q && t < T_Q + 1.5 && Math.floor((t - T_Q) * 4) % 2 === 0;
      K.text(c, 'Fire TV', cx, cy, { font: K.F.px(68), color: flash ? P.goldL : P.paper, alpha: on });
    }
    // chip: "your AI agent" pointing to Byte
    const byx = K.H4(BYTE_X), chipY = K.H4(FEET - 66) - 70;
    const ca = K.env(t, T_BYTE, T_Q, 0.01, 0.2);
    if (ca > 0) {
      const s = K.pop(t, T_BYTE, 0.35);
      c.save(); c.globalAlpha = ca;
      c.fillStyle = P.ink; c.fillRect(byx - 10, chipY + 30, 20, 10); c.fillRect(byx - 6, chipY + 40, 12, 10); c.fillRect(byx - 2, chipY + 50, 4, 8);
      c.fillStyle = P.gold; c.fillRect(byx - 6, chipY + 30, 12, 8); c.fillRect(byx - 2, chipY + 38, 4, 10);
      c.restore();
      K.chip(c, 'your AI agent', byx + 36, chipY - 10, { size: 48, alpha: ca, scale: s });
    }
    // Byte's "?" bubble
    const qa = K.env(t, T_Q, T_QUEST, 0.01, 0.2);
    if (qa > 0) {
      const s = K.pop(t, T_Q, 0.3);
      const bob = Math.floor(t * 3) % 2 ? 0 : -4;
      K.bubble(c, '?', byx + 8, K.H4(FEET - 70) + bob, { size: 64, alpha: qa, scale: s });
    }
    // quest scroll text
    const ta = K.prog(t, T_QUEST + 0.45, 0.2);
    if (ta > 0) {
      const cx = K.H4(SCROLL.cx), y0 = K.H4(SCROLL.y);
      K.text(c, 'QUEST:', cx, y0 + 64, { font: K.F.px(46), color: P.goldD, alpha: ta, shadow: false });
      K.text(c, 'Ship a Vega OS app', cx, y0 + 146, { font: K.F.px(66), color: P.ink, alpha: ta, shadow: false });
    }
  }

  window.CH[1] = { lo, hi };
})();
