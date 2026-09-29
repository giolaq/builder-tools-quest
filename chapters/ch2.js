// Chapter 2 — "One command" (bars 7–12, 12–24 s)
(function () {
  const K = window.K, P = K.P;
  const T = {
    start: K.at(7, 1), type0: K.at(7, 1) + 0.45, full: K.at(8, 1), glow: K.at(8, 3),
    termOut: K.at(9, 1) - 0.25, open: K.at(9, 1),
    items: [K.at(9, 1), K.at(9, 2), K.at(9, 3)],
    fly: K.at(10, 3) - 0.45, level: K.at(10, 3), fresh: K.at(11, 3), end: K.at(13, 1),
  };
  const CMD = ['npx -y', '@amazon-devices/amazon-devices-buildertools-mcp@latest', 'init-context'];
  const CMD_LEN = CMD.join('').length;

  // layout (low-res)
  const CH_X = 103, CH_Y = 232, CH_U = 4;          // chest bottom-left
  const GIO = [66, 356], BYTE = [204, 356], CU = 3;
  const SLOT = [[56, 134], [135, 134], [214, 134]]; // item hover positions
  const SCREEN = [BYTE[0], BYTE[1] - 11 * CU];
  const FRESH_ICON = [83, 104];

  // ---------- sprites ----------
  const ITEM = {
    server: { rows: [
      '.kkkkkkkkkk.',
      'kssssssssssk',
      'ksmmsssssgsk',
      'kddddddddddk',
      'kkkkkkkkkkkk',
      'kssssssssssk',
      'ksmmsssssgsk',
      'kddddddddddk',
      'kkkkkkkkkkkk',
      'kssssssssssk',
      'ksmmssssssk.',
      '.kkkkkkkkkk.'].map(r => r.padEnd(12, '.')),
      key: { k: P.ink, s: P.stoneL, d: P.stone, m: P.mint, g: P.gold } },
    book: { rows: [
      '.kkkkkkkkkk.',
      'kfeeeeeeekpk',
      'kfeggggggkpk',
      'kfeeeeeeekpk',
      'kfeemmmmekpk',
      'kfeeeeeeekpk',
      'kfeemmmeekpk',
      'kfeeeeeeekpk',
      'kfeeeeeeekpk',
      'kfeeeeeeekpk',
      'kfffffffkkpk',
      '.kkkkkkkkkk.'],
      key: { k: P.ink, f: P.forest, e: P.emerald, g: P.gold, m: P.mintL, p: P.paper } },
    lens: { rows: [
      '..kkkkk.....',
      '.kooooook...',
      'kolwllllok..',
      'kolwllllok..',
      'kollllllok..',
      'kollllllok..',
      'kollllllok..',
      '.koooooook..',
      '..kkkkkkbbk.',
      '.......kbbbk',
      '........kbbk',
      '.........kk.'],
      key: { k: P.ink, o: P.gold, l: P.mintL, w: P.paper, b: P.brown } },
  };

  const ORDER = ['server', 'book', 'lens'];
  const LABEL = ['MCP server', 'Agent Skills', 'Docs search'];

  // item position at time t (centre, low-res) or null
  function itemPos(i, t) {
    const t0 = T.items[i]; if (t < t0) return null;
    const src = [135, CH_Y - 30];
    const u = K.ease.out(K.prog(K.step(t, 15), t0, 0.4));
    let x = K.lerp(src[0], SLOT[i][0], u), y = K.lerp(src[1], SLOT[i][1], u) - Math.sin(u * Math.PI) * 14;
    y += (Math.floor(t * 3 + i) % 2); // hover bob
    const f0 = T.fly + i * 0.1, fu = K.ease.in(K.prog(K.step(t, 15), f0, 0.35));
    if (fu >= 1) return null;
    if (fu > 0) { x = K.lerp(x, SCREEN[0], fu); y = K.lerp(y, SCREEN[1], fu) - Math.sin(fu * Math.PI) * 20; }
    return { x: K.r(x), y: K.r(y), fly: fu };
  }

  // ---------- scenery ----------
  function ellipse(p, cx, cy, rx, ry, c) {
    p.fillStyle = c;
    for (let j = -ry; j <= ry; j++) { const hw = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry))); p.fillRect(cx - hw, cy + j, hw * 2, 1); }
  }
  function pillar(p, x, by, lit) {
    K.shadow(p, x + 5, by, 16);
    K.block(p, x, by - 30, 10, 30, P.stone);
    for (let y = by - 24; y < by - 2; y += 7) K.R(p, x, y, 10, 1, P.stoneD);
    K.block(p, x - 2, by - 34, 14, 4, P.stoneL);
    // crystal on top
    const c = lit ? P.mintL : P.forest, c2 = lit ? P.mint : P.forestD;
    K.R(p, x + 2, by - 42, 6, 8, P.ink); K.R(p, x + 3, by - 44, 4, 2, P.ink);
    K.R(p, x + 3, by - 41, 4, 6, c2); K.R(p, x + 4, by - 43, 2, 8, c);
    if (lit) K.dither(p, x - 3, by - 48, 16, 14, 'rgba(147,220,189,0.35)', 0);
  }

  // original chest: body + hinged lid. open 0..1 (lid swings back, showing its inner face)
  function chest(p, x, y, open, u, t) {
    const R = (xx, yy, w, h, c) => { p.fillStyle = c; p.fillRect(K.r(x + xx * u), K.r(y + yy * u), K.r(w * u), K.r(h * u)); };
    if (open > 0.05) {
      // lid swung back: inner face stands above the body
      const lh = Math.max(1, Math.round(6 * Math.min(open, 1.2)));
      R(-1, -9 - lh - 1, 18, lh + 2, P.ink); R(0, -9 - lh, 16, lh, P.brownD);
      R(0, -9 - lh, 16, 1, P.gold); R(1, -9 - lh + 1, 14, lh - 1, K.lighten(P.brownD, -0.2));
      R(0, -9 - lh, 1, lh, P.gold); R(15, -9 - lh, 1, lh, P.gold);
    }
    // body
    R(-1, -9, 18, 10, P.ink); R(0, -8, 16, 8, P.brown); R(0, -8, 16, 1, K.lighten(P.brown, 0.25));
    R(0, -1, 16, 1, P.brownD); R(3, -8, 1, 8, P.brownD); R(12, -8, 1, 8, P.brownD);
    R(0, -5, 16, 1, P.gold); R(-1, -8, 1, 8, P.ink);
    if (open > 0.05) {
      // open mouth glowing
      R(0, -9, 16, 2, P.goldL); R(2, -9, 12, 1, P.paper);
      R(7, -6, 2, 2, P.goldD);
    } else {
      // closed lid on top
      R(-1, -14, 18, 6, P.ink); R(0, -13, 16, 4, P.brownD); R(0, -13, 16, 1, K.lighten(P.brown, 0.2)); R(0, -10, 16, 1, P.gold);
      R(3, -13, 1, 4, P.ink); R(12, -13, 1, 4, P.ink);
      R(7, -10, 2, 4, P.gold); R(7, -8, 2, 1, P.ink);
    }
  }
  // circular arrows icon, drawn on whole pixels, rotated in 45deg steps
  function arrows(p, cx, cy, r, ang) {
    const sz = r + 3;
    const ring = (col, r0, r1) => {
      for (let j = -sz; j <= sz; j++) for (let i = -sz; i <= sz; i++) {
        const d = Math.hypot(i + 0.5, j + 0.5); if (d < r0 || d > r1) continue;
        let a = Math.atan2(j + 0.5, i + 0.5) - ang; a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if ((a > 0.05 && a < 0.75) || (a > Math.PI + 0.05 && a < Math.PI + 0.75)) continue;
        K.R(p, cx + i, cy + j, 1, 1, col);
      }
    };
    ring(P.ink, r - 3, r + 1); ring(P.mint, r - 2, r);
    // arrowheads at the end of each arc (pointing along travel)
    [0, Math.PI].forEach(a0 => {
      const a = a0 + ang + 0.05, rr = r - 1;
      const bx = cx + Math.cos(a) * rr, by = cy + Math.sin(a) * rr;
      const tx = -Math.sin(a), ty = Math.cos(a); // tangent (clockwise travel)
      const nx = Math.cos(a), ny = Math.sin(a);
      for (let k = 0; k <= 4; k++) for (let w = -4 + k; w <= 4 - k; w++) {
        const px = bx + tx * k + nx * w, py = by + ty * k + ny * w;
        K.R(p, Math.round(px) - (k === 0 || Math.abs(w) === 4 - k ? 1 : 0), Math.round(py), 1, 1, (k === 0 || Math.abs(w) === 4 - k) ? P.ink : P.goldL);
      }
    });
  }

  function lo(p, t) {
    K.grass(p, 0, 0, K.LW, K.LH, 22);
    // dirt path from bottom up to shrine
    K.path(p, 112, 262, 46, K.LH - 262);
    // stone clearing
    ellipse(p, 135, 236, 104, 46, P.ink);
    ellipse(p, 135, 236, 102, 44, P.stoneD);
    ellipse(p, 135, 235, 100, 42, P.stone);
    // flagstone joints
    for (let y = 196; y < 278; y += 8) for (let x = 38 + ((y / 8) % 2) * 9; x < 234; x += 18) {
      const dx = (x - 135) / 100, dy = (y - 235) / 42; if (dx * dx + dy * dy > 0.9) continue;
      K.R(p, x, y, 17, 1, P.stoneD); K.R(p, x, y + 1, 1, 7, P.stoneD); K.R(p, x + 1, y + 1, 6, 1, P.stoneL);
    }
    // border trees & bushes
    [[18, 60, 1.2], [70, 48, 1], [200, 50, 1.1], [252, 62, 1.2], [8, 170, 1], [262, 180, 1], [14, 300, 1.1], [258, 296, 1]].forEach(([x, y, s]) => K.tree(p, x, y, s));
    [[40, 390], [236, 388], [30, 440], [246, 450], [96, 420], [180, 430]].forEach(([x, y]) => K.bush(p, x, y));
    [[44, 330], [228, 328], [100, 300], [170, 306], [60, 410], [214, 412]].forEach(([x, y], i) => K.flower(p, x, y, i % 2 ? P.gold : P.mintL));

    // pillars light when chest opens
    const lit = t >= T.open;
    pillar(p, 50, 244, lit); pillar(p, 210, 244, lit);

    // plinth
    K.shadow(p, 135, 268, 110);
    K.block(p, 81, 256, 108, 9, P.stone);
    K.block(p, 89, 240, 92, 16, P.stoneL);
    for (let x = 97; x < 181; x += 14) K.R(p, x, 242, 1, 12, P.stone);
    // carved mint rune line on plinth front
    const runeOn = lit || (t >= T.glow && Math.floor(t * 6) % 2);
    for (let x = 95; x < 176; x += 8) K.R(p, x, 248, 4, 2, runeOn ? P.mint : P.stoneD);
    K.block(p, 85, 232, 100, 8, P.stoneL, { hi: P.paperD });

    // chest glow (anticipation + open)
    const open = K.ease.back(K.prog(K.step(t, 12), T.open - 0.05, 0.3));
    if (t >= T.glow && t < T.open) { // keyhole twinkle
      if (Math.floor(t * 8) % 2) K.R(p, CH_X + 7 * CH_U - 2, CH_Y - 5 * CH_U - 2, 2 * CH_U + 4, 3 * CH_U + 4, P.goldL);
    }
    if (open > 0.05) {
      const fade = 1 - K.prog(t, T.level, 1.0) * 0.75;
      p.save(); p.globalAlpha = 0.5 * fade;
      K.dither(p, CH_X + 4, CH_Y - 150, 56, 110, P.goldL, 0);
      p.globalAlpha = 0.35 * fade; K.dither(p, CH_X - 6, CH_Y - 130, 76, 90, P.gold, 1);
      p.restore();
    }
    K.shadow(p, 135, CH_Y, 70);
    chest(p, CH_X, CH_Y, K.clamp(open, 0, 1.2), CH_U, t);
    K.sparkle(p, 135, CH_Y - 50, t, T.open, P.goldL, 0.6);

    // items
    ORDER.forEach((k, i) => {
      const q = itemPos(i, t); if (!q) return;
      const it = ITEM[k];
      // soft halo
      if (q.fly === 0) { K.dither(p, q.x - 12, q.y + 24, 24, 2, 'rgba(8,20,14,0.5)'); if (Math.floor(t * 4 + i) % 2) { K.R(p, q.x - 23, q.y - 1, 2, 2, P.goldL); K.R(p, q.x + 21, q.y - 1, 2, 2, P.goldL); } }
      K.spr(p, it.rows, q.x - 18, q.y - 18, it.key, { u: 3 });
      K.sparkle(p, q.x, q.y, t, T.items[i] + 0.35, P.goldL, 0.5);
      if (q.fly > 0.1) { K.R(p, q.x - 1, q.y + 14, 2, 2, P.mintL); K.R(p, q.x, q.y + 20, 1, 1, P.goldL); }
    });

    // Mini Gio
    const gpose = t >= T.level ? 'sword' : (t >= T.full && t < T.open + 0.2 ? 'point' : 'idle');
    const gexpr = t >= T.level ? 'grin' : (t >= T.open ? 'wow' : 'happy');
    const glow = t >= T.level ? 0.65 + 0.35 * (Math.floor(t * 4) % 2) : 0;
    const gHop = K.r(K.hop(t, T.level, 0.35, 6));
    const g = K.gio(p, GIO[0], GIO[1] - gHop, { t, pose: gpose, expr: gexpr, u: CU, blade: glow, look: 1 });
    if (t >= T.level) {
      const tip = [g.handR[0], g.handR[1] - 20 * CU];
      K.sparkle(p, tip[0], tip[1], t, T.level, P.goldL, 0.6);
      K.sparkle(p, tip[0] - 6, tip[1] + 12, t, T.level + 0.25, P.gold, 0.5);
      if (t > T.level + 0.6) { const k = Math.floor(t * 2) % 3; K.sparkle(p, tip[0] + (k - 1) * 5, tip[1] + k * 8, t, Math.floor(t * 2) / 2, P.goldL, 0.45); }
    }

    // Byte
    const lvl = t >= T.level ? 1 : 0;
    const face = lvl ? 'happy' : (t >= T.open ? '!' : (t >= T.full ? '?' : 'eyes'));
    const bHop = K.r(K.hop(t, T.level, 0.4, 10));
    K.byte(p, BYTE[0], BYTE[1] - bHop, { t, face, level: lvl, u: CU });
    if (t >= T.level - 0.05) {
      K.sparkle(p, BYTE[0] - 26, BYTE[1] - 50, t, T.level, P.mintL, 0.6);
      K.sparkle(p, BYTE[0] + 26, BYTE[1] - 36, t, T.level + 0.1, P.goldL, 0.6);
      K.sparkle(p, BYTE[0], BYTE[1] - 70, t, T.level + 0.2, P.goldL, 0.6);
      K.poof(p, SCREEN[0], SCREEN[1], t, T.level - 0.05, 0.4);
    }

    // "stays up to date" icon (rotates in 90° steps)
    if (t >= T.fresh) {
      const s = K.pop(t, T.fresh, 0.3);
      if (s > 0.2) {
        const R0 = s < 0.7 ? 8 : 11;
        K.R(p, FRESH_ICON[0] - 16, FRESH_ICON[1] - 16, 32, 32, P.ink);
        K.R(p, FRESH_ICON[0] - 15, FRESH_ICON[1] - 15, 30, 30, P.forestD);
        arrows(p, FRESH_ICON[0], FRESH_ICON[1], R0, Math.floor((t - T.fresh) * 6) * Math.PI / 4);
      }
    }
  }

  // ---------- hi-res ----------
  function terminal(c, t) {
    const a = K.prog(t, T.start + 0.25, 0.2) * (1 - K.prog(t, T.termOut, 0.25));
    if (a <= 0) return;
    const x = 60, w = 960, h = 206, dy = -K.tw(t, T.termOut, 0.25, 'in') * 30;
    const y = 276 + dy;
    c.save(); c.globalAlpha = a;
    K.box(c, x, y, w, h, { fill: P.ink, border: P.mint });
    const n = Math.floor(Math.max(0, t - T.type0) * 48); // ~48 chars/s -> done before 8.1
    let used = 0; const lh = 54, fs = 29;
    c.font = K.F.mono(fs); c.textBaseline = 'middle'; c.textAlign = 'left';
    let cur = null;
    CMD.forEach((ln, i) => {
      const vis = ln.slice(0, K.clamp(n - used, 0, ln.length)); used += ln.length;
      const lx = x + 22, ly = y + 49 + i * lh;
      if (i === 0) { c.fillStyle = P.mint; c.fillText('$', lx, ly); }
      const tx = i === 0 ? lx + 36 : lx;
      c.fillStyle = P.goldL; c.fillText(vis, tx, ly);
      if (vis.length < ln.length || (i === CMD.length - 1)) { if (!cur && (vis.length < ln.length || n >= CMD_LEN)) cur = [tx + c.measureText(vis).width + 4, ly]; }
    });
    if (cur && (n < CMD_LEN || Math.floor(t * 3) % 2 === 0)) { c.fillStyle = P.paper; c.fillRect(cur[0], cur[1] - 17, 16, 34); }
    c.restore();
  }

  function hi(c, t) {
    terminal(c, t);
    // item chips
    ORDER.forEach((k, i) => {
      const q = itemPos(i, t); if (!q) return;
      const s = K.pop(t, T.items[i] + 0.25, 0.3), a = 1 - K.prog(t, T.fly + i * 0.1, 0.15);
      if (s <= 0 || a <= 0) return;
      K.chip(c, LABEL[i], K.H4(SLOT[i][0]), 390, { size: 40, scale: s, alpha: a, border: i === 0 ? P.gold : P.mint });
    });
    // Fire TV badge chip over Byte
    if (t >= T.level) {
      const s = K.pop(t, T.level + 0.1, 0.3);
      K.chip(c, 'Fire TV', K.H4(BYTE[0]), K.H4(BYTE[1] - 23 * CU) - 56, { size: 40, scale: s, border: P.mint, color: P.mintL });
    }
    // stays up to date
    if (t >= T.fresh) {
      const s = K.pop(t, T.fresh + 0.05, 0.3);
      K.chip(c, 'stays up to date', 616, K.H4(FRESH_ICON[1]) + 2, { size: 40, scale: s, border: P.gold });
    }
  }

  window.CH[2] = { lo, hi };
})();
