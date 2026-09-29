// Chapter 3 — Any agent (bars 13–18, 24–36 s)
(function () {
  const K = window.K, P = K.P;
  const T0 = K.at(13), T1 = K.at(19);
  const C_APPEAR = K.at(13, 1);            // 24.0 portals rise
  // one portal per ~beat pair: 27.0, 28.0, 29.0
  const LIGHT = [K.at(14, 3), K.at(15, 1), K.at(15, 3)];
  const C_SIGN = K.at(16, 1);              // 30.0 signpost
  const C_THUMB = K.at(17, 1);             // 32.0 thumbs-up + beep

  const PORTALS = [
    { x: 52, name: 'Claude Code', col: P.gold },
    { x: 135, name: 'Cursor', col: P.mint },
    { x: 218, name: 'Kiro', col: P.polo },
  ];
  const BASE = 282;       // arch base y (low-res)
  const OW = 34, OH = 58; // opening size
  const RIM = 6;
  const GIO = [186, 356], HOME = [104, 354], FRONT_Y = 298;

  // rows of an arch shape: returns list of [y, x0, x1]
  function archRows(cx, base, w, h) {
    const r = w / 2, rows = [];
    for (let j = 0; j < h; j++) {
      const y = base - h + j;
      let hw = r;
      if (j < r) { const dy = r - j - 0.5; hw = Math.sqrt(Math.max(0, r * r - dy * dy)); }
      hw = Math.round(hw);
      if (hw > 0) rows.push([y, cx - hw, cx + hw]);
    }
    return rows;
  }
  function fillRows(p, rows, c) { p.fillStyle = c; rows.forEach(([y, a, b]) => p.fillRect(a, y, b - a, 1)); }

  function rise(t, i) { return K.clamp(Math.floor(K.prog(t, C_APPEAR + i * 0.2, 0.4) * 6) / 6); }
  function litAmt(t, i) { return t >= LIGHT[i] ? 1 : 0; }

  function portal(p, t, i) {
    const pt = PORTALS[i], cx = pt.x, r = rise(t, i);
    if (r <= 0) return;
    const fullH = OH + RIM;
    const vis = Math.round(fullH * r); // rising from ground: clip top
    p.save(); p.beginPath(); p.rect(cx - 50, BASE - vis - 2, 100, vis + 12); p.clip();
    const yoff = 0;
    // outer ink + stone
    const outer = archRows(cx, BASE + yoff, OW + RIM * 2 + 2, OH + RIM + 1);
    fillRows(p, outer, P.ink);
    const stone = archRows(cx, BASE + yoff, OW + RIM * 2, OH + RIM);
    fillRows(p, stone, P.stone);
    // brick joints on the stone ring
    stone.forEach(([y, a, b]) => {
      const k = y - (BASE - OH - RIM);
      if (k % 6 === 0) { p.fillStyle = P.stoneD; p.fillRect(a, y, b - a, 1); }
      p.fillStyle = P.stoneL; p.fillRect(a, y, 1, 1);
      p.fillStyle = P.stoneD; p.fillRect(b - 1, y, 1, 1);
    });
    // keystone
    const lit = litAmt(t, i);
    K.OR(p, cx - 3, BASE - OH - RIM - 1, 6, 6, lit ? pt.col : P.stoneL);
    // opening
    const op = archRows(cx, BASE, OW + 2, OH + 1); fillRows(p, op, P.ink);
    const inner = archRows(cx, BASE, OW, OH);
    if (!lit) {
      fillRows(p, inner, P.forestD);
      // idle hum: faint dithered shimmer rows
      const ph = Math.floor(t * 6) % 2;
      p.save(); p.beginPath(); inner.forEach(([y, a, b]) => p.rect(a, y, b - a, 1)); p.clip();
      K.dither(p, cx - OW / 2, BASE - OH, OW, OH, 'rgba(74,186,145,0.18)', ph);
      const sy = BASE - ((Math.floor(t * 8) * 3) % OH);
      K.R(p, cx - OW / 2, sy, OW, 1, 'rgba(147,220,189,0.35)');
      p.restore();
    } else {
      const since = t - LIGHT[i];
      if (since < 0.12) fillRows(p, inner, P.paper);
      else {
        // swirl: concentric arch rings cycling (stepped)
        const ph = Math.floor(t * 8);
        const cols = [K.lighten(pt.col, -0.55), K.lighten(pt.col, -0.25), pt.col, K.lighten(pt.col, 0.45)];
        for (let k = 0; k < 7; k++) {
          const w = OW - k * 4, h = OH - k * 4; if (w <= 2 || h <= 2) break;
          fillRows(p, archRows(cx, BASE - k, w, h), cols[(k + ph) % 4]);
        }
        // sparks drifting up inside
        const rr = K.rng(11 + i);
        for (let s = 0; s < 5; s++) {
          const sx = cx - 12 + Math.floor(rr() * 24), off = rr() * OH;
          const sy = BASE - 2 - ((off + K.step(t, 8) * 30) % (OH - 8));
          K.R(p, sx, sy, 1, 1, P.paper);
        }
      }
    }
    // base step
    p.restore();
    if (r > 0) {
      K.OR(p, cx - OW / 2 - RIM - 2, BASE, OW + RIM * 2 + 4, 3, P.stoneL);
      K.R(p, cx - OW / 2 - RIM - 2, BASE + 2, OW + RIM * 2 + 4, 1, P.stoneD);
    }
    // rising dust
    if (r < 1) { K.R(p, cx - 22 + (Math.floor(t * 12) % 3), BASE + 1, 3, 2, P.paperD); K.R(p, cx + 18 - (Math.floor(t * 12) % 3), BASE, 3, 2, P.paperD); }
    K.poof(p, cx, BASE - 4, t, C_APPEAR + i * 0.2 + 0.4, 0.45);
    // sign plank hung above arch
    if (r >= 1) {
      const sy = BASE - OH - RIM - 22, sw = 78;
      const drop = Math.round(K.clamp(1 - K.prog(t, C_APPEAR + i * 0.2 + 0.4, 0.3)) * -6);
      K.R(p, cx - 24, sy + 14 + drop, 1, BASE - OH - RIM - (sy + 14 + drop), P.ink);
      K.R(p, cx + 23, sy + 14 + drop, 1, BASE - OH - RIM - (sy + 14 + drop), P.ink);
      K.block(p, cx - sw / 2, sy + drop, sw, 14, lit ? P.brown : P.brownD);
      K.R(p, cx - sw / 2, sy + 6 + drop, sw, 1, K.lighten(P.brownD, -0.2));
      if (lit) { K.R(p, cx - sw / 2 - 1, sy + drop - 1, sw + 2, 1, pt.col); K.R(p, cx - sw / 2 - 1, sy + 14 + drop, sw + 2, 1, pt.col); }
      if (lit) K.sparkle(p, cx, BASE - OH / 2, t, LIGHT[i], K.lighten(pt.col, 0.4), 0.6);
    }
  }

  // Byte path: returns {x, y, u, tint, vis, face}
  function byteState(t) {
    let x = HOME[0], y = HOME[1], u = 2, tint = null, vis = true, face = 'eyes', hopY = 0;
    const walkTo = (a, b, s, d) => { const k = Math.floor(K.tw(t, s, d, 'inOut') * 10) / 10; return [K.lerp(a[0], b[0], k), K.lerp(a[1], b[1], k)]; };
    const P1 = [PORTALS[0].x, FRONT_Y];
    if (t < 25.6) { /* home */ }
    else if (t < LIGHT[0]) { [x, y] = walkTo(HOME, P1, 25.6, 1.2); }
    else if (t < 30.0) {
      // which portal
      let i = t < LIGHT[1] ? 0 : t < LIGHT[2] ? 1 : 2;
      const s = t - LIGHT[i], cx = PORTALS[i].x;
      x = cx; y = FRONT_Y;
      if (s < 0.3) { y = FRONT_Y - Math.round(K.prog(s, 0, 0.3) * 14); u = s < 0.15 ? 2 : 1; hopY = K.hop(s, 0, 0.3, 6); }
      else if (s < 0.45) { vis = false; }
      else if (s < 0.6) { u = 1; y = FRONT_Y - 6; tint = PORTALS[i].col; }
      else {
        tint = s < 1.0 ? PORTALS[i].col : null; face = 'happy';
        hopY = K.hop(s, 0.6, 0.3, 10);
        if (i < 2 && s >= 0.7) { const nx = PORTALS[i + 1].x; x = Math.round(K.lerp(cx, nx, Math.floor(K.tw(t, LIGHT[i] + 0.7, 0.28, 'inOut') * 6) / 6)); hopY = K.hop(s, 0.7, 0.28, 10); }
        if (i === 2 && s >= 0.9) { face = 'happy'; }
      }
      if (i === 2 && s >= 1.0) { tint = null; }
    } else if (t < 30.8) {
      [x, y] = walkTo([PORTALS[2].x, FRONT_Y], [135, FRONT_Y], 30.0, 0.8);
    } else if (t < 31.6) {
      [x, y] = walkTo([135, FRONT_Y], HOME, 30.8, 0.8);
    }
    if (t >= C_THUMB) { face = 'happy'; hopY = K.hop(t, C_THUMB, 0.35, 8) + K.hop(t, C_THUMB + 0.4, 0.3, 5); }
    return { x: Math.round(x), y: Math.round(y - hopY), u, tint, vis, face };
  }

  function scene(p, t) {
    // grass everywhere
    K.grass(p, 0, 0, K.LW, K.LH, 31);
    // back area (y < 150): signpost & trees
    K.tree(p, 22, 112, 1); K.tree(p, 250, 106, 1); K.tree(p, 232, 66, 0.8);
    K.bush(p, 60, 118); K.bush(p, 210, 118);
    // path to the signpost through a gap
    // back wall with central gap
    K.wall(p, 0, 124, 116, 30); K.wall(p, 154, 124, 116, 30);
    K.R(p, 0, 123, 116, 1, P.ink); K.R(p, 154, 123, 116, 1, P.ink);
    K.R(p, 116, 123, 1, 31, P.ink); K.R(p, 153, 123, 1, 31, P.ink);
    K.path(p, 118, 90, 34, 64);
    // stone terrace
    K.stoneFloor(p, 0, 154, K.LW, 148);
    K.R(p, 0, 154, K.LW, 1, P.ink);
    K.R(p, 0, 302, K.LW, 2, P.ink); K.R(p, 0, 304, K.LW, 3, P.stoneD);
    // steps down to the lawn + path
    K.path(p, 110, 307, 50, 70);
    for (let s = 0; s < 3; s++) K.block(p, 104, 304 + s * 4, 62, 3, P.stoneL);
    // wall torches between portals (mint flames flicker; flare gold when both neighbours lit)
    [[95, 0], [175, 1]].forEach(([tx, k]) => {
      K.OR(p, tx - 2, 232, 4, 8, P.brownD); K.OR(p, tx - 4, 229, 8, 3, P.stoneL);
      const f = Math.floor(t * 8 + k) % 3, hot = t >= LIGHT[k + 1];
      const fc = hot ? P.gold : P.mint, fl = hot ? P.goldL : P.mintL;
      K.R(p, tx - 2, 222 + (f === 1 ? -1 : 0), 4, 7, fc); K.R(p, tx - 1, 219 + (f === 2 ? 1 : 0), 2, 4, fc); K.R(p, tx - 1, 224, 2, 4, fl);
      K.dither(p, tx - 6, 216, 12, 18, hot ? 'rgba(212,206,70,0.18)' : 'rgba(74,186,145,0.14)', f % 2);
    });
    // ivy tufts on the terrace edge
    [[8, 0], [60, 1], [205, 0], [258, 1]].forEach(([vx, k]) => { K.R(p, vx, 155, 6, 3, P.forest); K.R(p, vx + 1 + k, 158, 2, 5 + k * 3, P.forest); K.R(p, vx + 2, 155, 2, 1, P.emeraldL); });
    K.flower(p, 30, 318); K.flower(p, 240, 322, P.mintL); K.flower(p, 250, 340); K.flower(p, 48, 340, P.paper);
    K.bush(p, 20, 360); K.bush(p, 252, 356);
    // foreground edge below caption stays scenery only
    K.tree(p, 16, 470, 1.1); K.tree(p, 258, 474, 1.2);
  }

  function signpost(p, t) {
    const a = K.prog(t, C_SIGN, 0.3); if (a <= 0) return;
    const drop = Math.round((1 - Math.floor(a * 4) / 4) * -16);
    const cx = 135, by = 114;
    K.OR(p, cx - 52, by - 30 + drop, 4, 30 - drop, P.brownD); K.OR(p, cx + 48, by - 30 + drop, 4, 30 - drop, P.brownD);
    K.block(p, cx - 64, by - 44 + drop, 128, 18, P.brown);
    K.R(p, cx - 64, by - 36 + drop, 128, 1, P.brownD);
    // arrow tip pointing onward (right)
    K.R(p, cx + 64, by - 42 + drop, 2, 14, P.ink); K.R(p, cx + 65, by - 40 + drop, 3, 10, P.brown); K.R(p, cx + 68, by - 38 + drop, 2, 6, P.brown); K.R(p, cx + 70, by - 36 + drop, 1, 2, P.ink);
    K.shadow(p, cx, by, 110);
    K.poof(p, cx - 50, by - 2, t, C_SIGN + 0.25, 0.4); K.poof(p, cx + 50, by - 2, t, C_SIGN + 0.25, 0.4);
    K.sparkle(p, cx + 70, by - 50, t, C_SIGN + 0.3, P.goldL, 0.6);
  }

  function lo(p, t) {
    scene(p, t);
    signpost(p, t);
    for (let i = 0; i < 3; i++) portal(p, t, i);
    const b = byteState(t);
    // Gio: watches Byte, cheers at 17.1
    const cheer = t >= C_THUMB && t < C_THUMB + 2.2;
    const look = b.x < GIO[0] - 10 ? -1 : b.x > GIO[0] + 10 ? 1 : 0;
    let pose = 'idle', expr = 'happy';
    if (t >= LIGHT[0] && t < 30) expr = 'wow';
    if (t >= C_SIGN && t < C_THUMB) { pose = 'point'; }
    if (cheer) { pose = 'cheer'; expr = 'grin'; }
    if (t >= C_THUMB + 2.2) { pose = 'wave'; expr = 'grin'; }
    // draw in depth order
    const drawByte = () => { if (b.vis) K.byte(p, b.x, b.y, { t, u: b.u, level: 1, tint: b.tint, face: b.face }); };
    const drawGio = () => K.gio(p, GIO[0], GIO[1] - (cheer ? K.hop(t, C_THUMB, 0.35, 6) : 0), { t, u: 2, pose, expr, look, flip: pose === 'point' });
    if (b.y < GIO[1]) { drawByte(); drawGio(); } else { drawGio(); drawByte(); }
    // warp sparkles when entering / exiting
    for (let i = 0; i < 3; i++) {
      K.sparkle(p, PORTALS[i].x, FRONT_Y - 20, t, LIGHT[i] + 0.3, K.lighten(PORTALS[i].col, 0.4), 0.4);
      K.sparkle(p, PORTALS[i].x, FRONT_Y - 14, t, LIGHT[i] + 0.5, P.paper, 0.4);
    }
    K.sparkle(p, HOME[0], HOME[1] - 50, t, C_THUMB + 0.1, P.goldL, 0.5);
  }

  function hi(c, t) {
    // portal signs
    for (let i = 0; i < 3; i++) {
      if (rise(t, i) < 1) continue;
      const a = K.prog(t, C_APPEAR + i * 0.2 + 0.4, 0.2);
      const drop = Math.round(K.clamp(1 - K.prog(t, C_APPEAR + i * 0.2 + 0.4, 0.3)) * -24);
      const lit = litAmt(t, i);
      const sy = (BASE - OH - RIM - 22 + 7) * 4 + drop;
      K.text(c, PORTALS[i].name, PORTALS[i].x * 4, sy + 2, { font: K.F.px(42), color: lit ? P.goldL : P.paper, alpha: a });
    }
    // signpost text
    const sa = K.prog(t, C_SIGN, 0.3);
    if (sa > 0) {
      const drop = Math.round((1 - Math.floor(sa * 4) / 4) * -64);
      K.text(c, 'Copilot · Cline · more', 135 * 4, (114 - 35) * 4 + drop + 2, { font: K.F.px(40), color: P.paper, alpha: sa >= 1 ? 1 : 0.9 });
    }
    // Byte beep bubble
    const bs = K.pop(t, C_THUMB + 0.05, 0.3);
    const bend = C_THUMB + 2.0;
    if (t >= C_THUMB && t < bend + 0.2) {
      const b = byteState(t);
      K.bubble(c, 'beep!', b.x * 4 + 60, (HOME[1] - 50) * 4, { size: 40, scale: bs, alpha: 1 - K.prog(t, bend, 0.2) });
    }
  }

  window.CH[3] = { lo, hi };
})();
