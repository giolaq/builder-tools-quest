// Pixel kit for the Builder Tools film. Low-res world (270x480 portrait, scaled x4) + crisp hi-res overlay.
(function () {
  const K = {};
  K.W = 1080; K.H = 1920; K.LW = 270; K.LH = 480; K.S = 4;
  K.BPM = 120; K.BEAT = 0.5; K.BAR = 2;
  K.at = (bar, beat = 1) => ((bar - 1) * 4 + (beat - 1)) * K.BEAT;

  // palette 4125 + minimal extras
  K.P = {
    stone: '#494b4b', forest: '#0e5135', emerald: '#0d9263', mint: '#4aba91', gold: '#d4ce46',
    stoneL: '#6e7171', stoneD: '#2f3232', forestD: '#082e1f', emeraldL: '#2fae7e', mintL: '#93dcbd', goldL: '#ebe79a', goldD: '#9c9728',
    ink: '#121515', paper: '#f1eed8', paperD: '#c9c5a8', red: '#c8463c', redD: '#86291f',
    skin: '#c98b62', skinD: '#a4693f', hair: '#2a1e1a', glasses: '#7a4a26', polo: '#f6c9d3', poloD: '#d9a1b0', pants: '#33343f', shoe: '#1c1d20',
    brown: '#7a5230', brownD: '#553820', water: '#1f6f73', waterL: '#3aa3a0',
  };
  K.F = {
    px: (s, w = 700) => `${w} ${s}px "Pixelify Sans", monospace`,
    arcade: s => `400 ${s}px "Press Start 2P", monospace`,
    mono: s => `700 ${s}px "JetBrains Mono", monospace`,
  };

  // ---------- math ----------
  K.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  K.lerp = (a, b, u) => a + (b - a) * u;
  K.prog = (t, s, d) => K.clamp((t - s) / d);
  K.ease = {
    lin: u => u, out: u => 1 - Math.pow(1 - u, 3), in: u => u * u * u,
    inOut: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    back: u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
  };
  K.tw = (t, s, d, e = 'out') => K.ease[e](K.prog(t, s, d));
  K.pop = (t, s, d = 0.35) => K.ease.back(K.prog(t, s, d));
  K.env = (t, a, b, fi = 0.25, fo = 0.25) => Math.min(K.prog(t, a, fi), 1 - K.prog(t, b - fo, fo));
  K.hop = (t, t0, d = 0.4, h = 8) => { const u = (t - t0) / d; return u < 0 || u > 1 ? 0 : 4 * h * u * (1 - u); };
  K.rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  K.type = (s, t, t0, cps = 30) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
  // snap to whole low-res pixels
  K.r = v => Math.round(v);
  // stepped (chunky) animation: quantise time to n fps
  K.step = (t, fps = 8) => Math.floor(t * fps) / fps;

  // ---------- low-res primitives (p = low-res ctx) ----------
  K.R = (p, x, y, w, h, c) => { p.fillStyle = c; p.fillRect(K.r(x), K.r(y), K.r(w), K.r(h)); };
  // rect with 1px ink outline
  K.OR = (p, x, y, w, h, c, ink = K.P.ink) => { K.R(p, x - 1, y - 1, w + 2, h + 2, ink); K.R(p, x, y, w, h, c); };
  // bevelled block: light top/left, dark bottom/right
  K.block = (p, x, y, w, h, c, { hi = null, lo = null, outline = true } = {}) => {
    if (outline) K.R(p, x - 1, y - 1, w + 2, h + 2, K.P.ink);
    K.R(p, x, y, w, h, c); K.R(p, x, y, w, 1, hi || K.lighten(c, 0.25)); K.R(p, x, y + h - 1, w, 1, lo || K.lighten(c, -0.35));
  };
  K.dither = (p, x, y, w, h, c, phase = 0) => { p.fillStyle = c; for (let j = 0; j < h; j++) for (let i = (j + phase) % 2; i < w; i += 2) p.fillRect(K.r(x) + i, K.r(y) + j, 1, 1); };
  K.lighten = (hex, amt) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = c => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)); return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); };
  K.shadow = (p, cx, y, w) => K.dither(p, cx - w / 2, y, w, 2, 'rgba(10,20,15,0.55)');
  // draw a sprite from string rows. key: char -> colour ('.' transparent)
  K.spr = (p, rows, x, y, key, { u = 1, flip = false } = {}) => {
    const w = rows[0].length;
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < w; i++) {
      const ch = rows[j][flip ? w - 1 - i : i]; const c = key[ch]; if (!c) continue;
      p.fillStyle = c; p.fillRect(K.r(x) + i * u, K.r(y) + j * u, u, u);
    }
  };

  // ---------- terrain ----------
  K.grass = (p, x0, y0, w, h, seed = 3) => {
    K.R(p, x0, y0, w, h, K.P.emerald);
    const r = K.rng(seed);
    for (let k = 0; k < w * h / 40; k++) { const x = x0 + Math.floor(r() * w), y = y0 + Math.floor(r() * h); K.R(p, x, y, 1, 2, K.P.forest); K.R(p, x + 1, y + 1, 1, 1, K.P.forest); }
    for (let k = 0; k < w * h / 160; k++) { const x = x0 + Math.floor(r() * w), y = y0 + Math.floor(r() * h); K.R(p, x, y, 1, 1, K.P.mint); }
  };
  K.path = (p, x, y, w, h) => { K.R(p, x, y, w, h, K.P.paperD); K.dither(p, x, y, w, h, K.lighten(K.P.paperD, -0.12)); K.R(p, x, y, w, 1, K.lighten(K.P.paperD, -0.3)); };
  K.stoneFloor = (p, x0, y0, w, h) => { K.R(p, x0, y0, w, h, K.P.stone); for (let y = y0; y < y0 + h; y += 8) { K.R(p, x0, y, w, 1, K.P.stoneD); for (let x = x0 + ((y - y0) / 8 % 2) * 8; x < x0 + w; x += 16) K.R(p, x, y, 1, 8, K.P.stoneD); } };
  K.wall = (p, x0, y0, w, h) => { K.R(p, x0, y0, w, h, K.P.stoneD); for (let y = y0; y < y0 + h; y += 6) for (let x = x0 + ((y - y0) / 6 % 2) * 5; x < x0 + w; x += 10) { K.R(p, x, y, 9, 5, K.P.stone); K.R(p, x, y, 9, 1, K.P.stoneL); } };
  K.tree = (p, cx, by, s = 1) => {
    K.shadow(p, cx, by - 1, 18 * s);
    K.OR(p, cx - 2 * s, by - 8 * s, 4 * s, 8 * s, K.P.brown);
    const c = (x, y, r, col) => { p.fillStyle = col; p.beginPath(); for (let j = -r; j <= r; j++) { const hw = Math.round(Math.sqrt(r * r - j * j)); p.rect(K.r(x - hw), K.r(y + j), hw * 2, 1); } p.fill(); };
    c(cx, by - 16 * s, 10 * s + 1, K.P.ink); c(cx, by - 16 * s, 10 * s, K.P.forest); c(cx - 2 * s, by - 18 * s, 7 * s, K.P.emerald); c(cx - 4 * s, by - 20 * s, 3 * s, K.P.mint);
  };
  K.bush = (p, cx, by) => { K.OR(p, cx - 5, by - 6, 10, 6, K.P.forest); K.R(p, cx - 4, by - 6, 5, 2, K.P.emerald); };
  K.flower = (p, x, y, c = K.P.gold) => { K.R(p, x, y, 1, 1, c); K.R(p, x - 1, y + 1, 3, 1, c); K.R(p, x, y + 2, 1, 1, K.P.forest); };

  // ---------- Mini Gio (front view) ----------
  // anchor = feet centre (x, y) in low-res px. u = pixel size (2 default). opts:
  // pose: idle|walk|wave|cheer|point|sword|swing|read ; expr: happy|grin|wow|worried ; t ; face: 'front'|'side'(flip for left)
  // blade: 0..1 glow of Compile Blade (drawn when pose is sword/swing/cheerBlade) ; flip
  K.gio = (p, x, y, o = {}) => {
    const P = K.P, u = o.u || 2, t = o.t || 0, pose = o.pose || 'idle', expr = o.expr || 'happy';
    const fl = o.flip ? -1 : 1;
    const R = (xx, yy, w, h, c) => { const X = fl > 0 ? xx : -xx - w; p.fillStyle = c; p.fillRect(K.r(x + X * u), K.r(y + yy * u), w * u, h * u); };
    const O = (xx, yy, w, h, c) => { R(xx - 1, yy - 1, w + 2, h + 2, P.ink); R(xx, yy, w, h, c); };
    K.dither(p, x - 8 * u, y - u, 16 * u, u * 1.5, 'rgba(8,20,14,0.55)');
    const walk = pose === 'walk' ? (Math.floor(t * 8) % 2) : -1;
    // legs + shoes
    const lL = walk === 0 ? -1 : 0, lR = walk === 1 ? -1 : 0;
    O(-5, -9 + lL, 4, 6, P.pants); O(1, -9 + lR, 4, 6, P.pants);
    O(-6, -3 + lL, 5, 2, P.shoe); O(1, -3 + lR, 5, 2, P.shoe); R(-6, -2 + lL, 5, 1, P.paper); R(1, -2 + lR, 5, 1, P.paper);
    // torso
    O(-6, -17, 12, 8, P.polo); R(-6, -10, 12, 1, P.poloD); R(-6, -17, 1, 7, P.poloD);
    R(-2, -17, 4, 2, P.skin); R(-3, -17, 1, 2, P.paper); R(2, -17, 1, 2, P.paper); R(-1, -15, 2, 1, P.skin);
    R(0, -14, 1, 1, P.poloD); R(0, -12, 1, 1, P.poloD);
    // arms: [shoulderSide] draw function: dir -1 viewer-left, 1 viewer-right
    const wave = Math.floor(t * 6) % 2;
    const arm = (side, a) => {
      const sx = side < 0 ? -9 : 6; // sleeve column (2 wide)
      if (a === 'down') { O(sx, -17, 3, 3, P.polo); O(sx, -14, 3, 4, P.skin); return [sx + 1, -10]; }
      if (a === 'up') { O(sx, -19, 3, 3, P.polo); O(sx + side, -25, 3, 6, P.skin); return [sx + side + 1, -25]; }
      if (a === 'wave') { O(sx, -18, 3, 3, P.polo); O(sx + side * (1 + wave), -24, 3, 6, P.skin); O(sx + side * (1 + wave) - 0, -26, 3, 2, P.skin); return [sx + side * 2, -25]; }
      if (a === 'point') { O(sx, -17, 3, 3, P.polo); O(sx + side * 3, -16, 5, 3, P.skin); return [sx + side * 6, -15]; }
      if (a === 'forward') { O(sx, -17, 3, 3, P.polo); O(sx, -14, 3, 3, P.skin); return [sx + 1, -12]; }
      if (a === 'hip') { O(sx, -17, 3, 3, P.polo); O(sx + (side < 0 ? 1 : -1), -14, 3, 3, P.skin); return [sx, -12]; }
      return [sx, -12];
    };
    let aL = 'down', aR = 'down', handBlade = null;
    if (pose === 'wave') { aL = 'down'; aR = 'wave'; }
    if (pose === 'cheer') { aL = 'up'; aR = 'up'; }
    if (pose === 'point') { aR = 'point'; }
    if (pose === 'read') { aL = 'forward'; aR = 'forward'; }
    if (pose === 'sword') { aR = 'up'; }
    if (pose === 'swing') { aR = 'point'; }
    if (o.armL) aL = o.armL; if (o.armR) aR = o.armR;
    const hl = arm(-1, aL), hr = arm(1, aR);
    // head
    O(-6, -31, 12, 11, P.skin);
    R(-5, -20, 10, 1, P.skin); R(-6, -20, 1, 1, P.ink); R(5, -20, 1, 1, P.ink); R(-5, -19, 10, 1, P.ink); R(-4, -19, 8, 1, P.skin); R(-4, -18, 8, 1, P.ink);
    R(-3, -18, 6, 1, P.skinD);
    O(-8, -27, 1, 3, P.skin); O(7, -27, 1, 3, P.skin);
    // hair (short, dark, slight peak)
    R(-7, -33, 14, 3, P.ink); R(-6, -33, 12, 1, P.hair); R(-6, -32, 12, 3, P.hair); R(-7, -30, 1, 4, P.hair); R(6, -30, 1, 4, P.hair);
    R(-5, -29, 2, 1, P.hair); R(3, -29, 2, 1, P.hair); R(-1, -29, 2, 1, P.hair); R(-7, -34, 14, 1, 'rgba(0,0,0,0)');
    R(-5, -34, 10, 1, P.ink);
    // brows
    const by = expr === 'wow' ? -28 : -27;
    R(-5, by, 3, 1, P.hair); R(2, by, 3, 1, P.hair);
    if (expr === 'worried') { R(-3, by - 1, 1, 1, P.hair); R(2, by - 1, 1, 1, P.hair); }
    // glasses + eyes
    const blink = ((t + 0.4) % 3.1) < 0.12;
    R(-5, -26, 4, 3, P.glasses); R(1, -26, 4, 3, P.glasses); R(-1, -26, 2, 1, P.glasses);
    R(-4, -25, 2, 1, blink ? P.skin : P.paper); R(2, -25, 2, 1, blink ? P.skin : P.paper);
    if (!blink) { const lx = o.look || 0; R(-3 + (lx < 0 ? -1 : 0), -25, 1, 1, P.ink); R(2 + (lx > 0 ? 1 : 0), -25, 1, 1, P.ink); }
    else { R(-4, -25, 2, 1, P.ink); R(2, -25, 2, 1, P.ink); }
    // nose, stubble, moustache, mouth, goatee
    R(-1, -23, 2, 1, P.skinD); R(-6, -22, 1, 2, P.skinD); R(5, -22, 1, 2, P.skinD);
    R(-3, -22, 6, 1, P.hair);
    if (expr === 'grin') { R(-2, -21, 4, 1, P.paper); R(-2, -20, 4, 1, P.redD); }
    else if (expr === 'wow') { R(-1, -21, 2, 2, P.redD); }
    else if (expr === 'worried') { R(-2, -21, 4, 1, P.skinD); R(-2, -21, 1, 1, P.redD); R(1, -21, 1, 1, P.redD); }
    else { R(-2, -21, 4, 1, P.redD); R(-3, -22, 1, 1, P.hair); }
    R(-2, -19, 4, 2, P.hair); R(-1, -18, 2, 1, P.hair);
    // Compile Blade in viewer-right hand for sword / swing poses
    if (pose === 'sword' || pose === 'swing' || o.blade != null && o.bladeHand) {
      const hx = x + (fl > 0 ? hr[0] : -hr[0]) * u, hy = y + hr[1] * u;
      K.blade(p, hx, hy, u, pose === 'swing' ? (fl > 0 ? 'right' : 'left') : 'up', o.blade || 0, t);
    }
    return { head: [x, y - 34 * u], handR: [x + (fl > 0 ? hr[0] : -hr[0]) * u, y + hr[1] * u], handL: [x + (fl > 0 ? hl[0] : -hl[0]) * u, y + hl[1] * u] };
  };

  // Compile Blade: hilt at (hx,hy). dir 'up'|'right'|'left'. glow 0..1. Blade = glowing cursor bar.
  K.blade = (p, hx, hy, u = 2, dir = 'up', glow = 0, t = 0) => {
    const P = K.P; const L = 16; // blade length in sprite px
    const cur = (Math.floor(t * 4) % 2 === 0) || glow > 0.5; // cursor blink
    const bc = cur ? P.paper : P.mintL;
    p.save();
    if (glow > 0) { p.globalAlpha = 0.35 * glow; p.fillStyle = P.goldL; if (dir === 'up') p.fillRect(hx - 3 * u, hy - (L + 6) * u, 6 * u, (L + 4) * u); else p.fillRect(hx + (dir === 'right' ? 2 : -(L + 4)) * u, hy - 3 * u, (L + 2) * u, 6 * u); p.globalAlpha = 1; }
    const B = (xx, yy, w, h, c) => { p.fillStyle = c; p.fillRect(K.r(hx + xx * u), K.r(hy + yy * u), w * u, h * u); };
    if (dir === 'up') {
      B(-2, -(L + 4), 4, L + 1, P.ink); B(-1, -(L + 3), 2, L - 1, bc); B(-1, -(L + 3), 1, L - 1, glow > 0 ? P.goldL : P.paper);
      B(-3, -4, 6, 2, P.ink); B(-2, -4, 4, 1, P.gold); B(-1, -2, 2, 3, P.brown);
    } else {
      const s = dir === 'right' ? 1 : -1;
      const X = xx => s > 0 ? xx : -xx; const W = (xx, yy, w, h, c) => B(s > 0 ? xx : -xx - w, yy, w, h, c);
      W(3, -2, L + 1, 4, P.ink); W(4, -1, L - 1, 2, bc); W(4, -1, L - 1, 1, glow > 0 ? P.goldL : P.paper);
      W(1, -3, 2, 6, P.ink); W(1, -2, 1, 4, P.gold); W(-2, -1, 3, 2, P.brown);
    }
    p.restore();
  };

  // ---------- Byte (AI agent companion) ----------
  // anchor feet centre. face: 'eyes'|'?'|'!'|'happy'|'scroll' ; level: 0|1 (mint screen + badge) ; tint: colour for body trim
  K.byte = (p, x, y, o = {}) => {
    const P = K.P, u = o.u || 2, t = o.t || 0, lvl = o.level || 0;
    const R = (xx, yy, w, h, c) => { p.fillStyle = c; p.fillRect(K.r(x + xx * u), K.r(y + yy * u), w * u, h * u); };
    K.dither(p, x - 7 * u, y - u, 14 * u, u * 1.5, 'rgba(8,20,14,0.55)');
    const bob = Math.floor(t * 4) % 2;
    // treads
    R(-6, -3, 12, 3, P.ink); R(-5, -2, 10, 1, P.stoneL); for (let i = -5; i < 5; i += 2) R(i + (Math.floor(t * 8) % 2), -2, 1, 1, P.stoneD);
    // body
    R(-7, -16 - bob, 14, 13, P.ink); R(-6, -15 - bob, 12, 11, o.tint || P.stoneL); R(-6, -15 - bob, 12, 1, K.lighten(o.tint || P.stoneL, 0.3)); R(-6, -5 - bob, 12, 1, K.lighten(o.tint || P.stoneL, -0.35));
    // screen
    const sc = lvl ? P.forestD : P.ink;
    R(-5, -14 - bob, 10, 7, P.ink); R(-4, -13 - bob, 8, 5, sc);
    const f = o.face || 'eyes', ec = lvl ? P.mint : P.goldL;
    const blink = ((t + 1.1) % 2.7) < 0.12;
    if (f === '?') { R(-1, -13 - bob, 2, 1, P.gold); R(1, -12 - bob, 1, 1, P.gold); R(0, -11 - bob, 1, 1, P.gold); R(0, -9 - bob, 1, 1, P.gold); }
    else if (f === '!') { R(0, -13 - bob, 1, 3, P.gold); R(0, -9 - bob, 1, 1, P.gold); }
    else if (f === 'scroll') { for (let i = 0; i < 3; i++) R(-3, -13 - bob + i * 2 - (Math.floor(t * 10) % 2), 2 + ((i * 3 + Math.floor(t * 10)) % 5), 1, ec); }
    else if (f === 'happy') { R(-3, -11 - bob, 2, 1, ec); R(1, -11 - bob, 2, 1, ec); R(-2, -12 - bob, 1, 1, ec); R(2, -12 - bob, 1, 1, ec); R(-1, -9 - bob, 2, 1, ec); }
    else { if (!blink) { R(-3, -12 - bob, 2, 2, ec); R(1, -12 - bob, 2, 2, ec); } else { R(-3, -11 - bob, 2, 1, ec); R(1, -11 - bob, 2, 1, ec); } }
    // antenna
    R(0, -19 - bob, 1, 3, P.ink); R(-1, -21 - bob, 3, 2, lvl ? P.gold : P.stone); if (lvl && Math.floor(t * 3) % 2) R(-1, -21 - bob, 3, 2, P.goldL);
    // arms
    R(-9, -11 - bob, 2, 4, P.ink); R(7, -11 - bob, 2, 4, P.ink);
    // badge
    if (lvl) { R(2, -7 - bob, 4, 2, P.gold); }
    return { head: [x, y - 22 * u], screen: [x, y - 11 * u] };
  };

  // ---------- props ----------
  K.chest = (p, x, y, open = 0, u = 2) => { // x,y = bottom-left; 16x12 units
    const R = (xx, yy, w, h, c) => { p.fillStyle = c; p.fillRect(K.r(x + xx * u), K.r(y + yy * u), w * u, h * u); };
    R(-1, -9, 18, 10, K.P.ink); R(0, -8, 16, 8, K.P.brown); R(0, -8, 16, 1, K.lighten(K.P.brown, 0.25)); R(0, -4, 16, 1, K.P.gold); R(7, -5, 2, 3, K.P.gold);
    const lh = 5, oy = -9 - Math.round(open * 6);
    if (open > 0.05) { R(0, -9, 16, 1, K.P.goldL); }
    R(-1, oy - lh, 18, lh + 1, K.P.ink); R(0, oy - lh + 1, 16, lh - 1, K.P.brownD); R(0, oy - lh + 1, 16, 1, K.lighten(K.P.brown, 0.2)); R(0, oy - 1, 16, 1, K.P.gold);
  };
  // TV (pixel). screenFn(p, sx, sy, sw, sh) draws in low-res
  K.tv = (p, x, y, w, h, screenFn) => {
    K.R(p, x - 1, y - 1, w + 2, h + 2, K.P.ink); K.R(p, x, y, w, h, K.P.stoneD); K.R(p, x + 2, y + 2, w - 4, h - 4, K.P.ink);
    K.R(p, x + w / 2 - 3, y + h, 6, 3, K.P.stoneD); K.R(p, x + w / 2 - 8, y + h + 3, 16, 2, K.P.ink);
    if (screenFn) { p.save(); p.beginPath(); p.rect(x + 3, y + 3, w - 6, h - 6); p.clip(); screenFn(p, x + 3, y + 3, w - 6, h - 6); p.restore(); }
  };
  K.sparkle = (p, x, y, t, t0, c = K.P.goldL, dur = 0.5) => {
    const u = K.prog(t, t0, dur); if (u <= 0 || u >= 1) return; const d = Math.round(2 + u * 8);
    [[d, 0], [-d, 0], [0, d], [0, -d], [d * 0.7, d * 0.7], [-d * 0.7, d * 0.7], [d * 0.7, -d * 0.7], [-d * 0.7, -d * 0.7]].forEach(([dx, dy], i) => { if (i > 3 && u > 0.6) return; K.R(p, x + dx, y + dy, u < 0.7 ? 2 : 1, u < 0.7 ? 2 : 1, c); });
  };
  K.poof = (p, x, y, t, t0, dur = 0.4) => { const u = K.prog(t, t0, dur); if (u <= 0 || u >= 1) return; const r = 3 + u * 10; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; K.R(p, x + Math.cos(a) * r - 1, y + Math.sin(a) * r - 1, 3 - Math.floor(u * 3), 3 - Math.floor(u * 3), K.P.paper); } };

  // ---------- hi-res overlay helpers (c = hi-res ctx, coordinates in 1080x1920) ----------
  K.H4 = v => v * 4; // low-res -> hi-res
  K.text = (c, s, x, y, { font = K.F.px(44), color = K.P.paper, align = 'center', base = 'middle', alpha = 1, shadow = true } = {}) => {
    c.save(); c.globalAlpha *= alpha; c.font = font; c.textAlign = align; c.textBaseline = base;
    if (shadow) { c.fillStyle = K.P.ink; c.fillText(s, x + 4, y + 4); }
    c.fillStyle = color; c.fillText(s, x, y); c.restore();
  };
  // RPG-style box: ink outer, gold border, dark fill (square corners, pixel steps)
  K.box = (c, x, y, w, h, { fill = K.P.forestD, border = K.P.gold, alpha = 1 } = {}) => {
    c.save(); c.globalAlpha *= alpha;
    c.fillStyle = K.P.ink; c.fillRect(x - 8, y - 4, w + 16, h + 8); c.fillRect(x - 4, y - 8, w + 8, h + 16);
    c.fillStyle = border; c.fillRect(x - 4, y, w + 8, h); c.fillRect(x, y - 4, w, h + 8);
    c.fillStyle = K.P.ink; c.fillRect(x, y, w, h);
    c.fillStyle = fill; c.fillRect(x + 4, y + 4, w - 8, h - 8);
    c.restore();
  };
  // label chip: pixel box with text. returns width
  K.chip = (c, s, x, y, { size = 44, font = null, color = K.P.paper, fill = K.P.forestD, border = K.P.gold, alpha = 1, scale = 1, pad = 24 } = {}) => {
    if (alpha <= 0 || scale <= 0) return 0;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(scale, scale);
    c.font = font || K.F.px(size); const w = Math.ceil(c.measureText(s).width + pad * 2), h = Math.round(size * 1.5);
    K.box(c, -w / 2, -h / 2, w, h, { fill, border });
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 3);
    c.restore(); return w * scale;
  };
  K.code = (c, s, x, y, o = {}) => K.chip(c, s, x, y, Object.assign({ size: 36, font: K.F.mono(36), color: K.P.goldL, fill: K.P.ink, border: K.P.mint }, o));
  // speech bubble pointing down at (x, y)
  K.bubble = (c, s, x, y, { size = 40, alpha = 1, scale = 1, font = null } = {}) => {
    if (alpha <= 0 || scale <= 0) return;
    c.save(); c.globalAlpha *= alpha; c.translate(x, y); c.scale(scale, scale);
    c.font = font || K.F.px(size); const w = Math.ceil(c.measureText(s).width + 48), h = Math.round(size * 1.6);
    c.fillStyle = K.P.ink; c.fillRect(-w / 2 - 4, -h - 28, w + 8, h + 8); c.fillRect(-12, -24, 24, 8); c.fillRect(-8, -16, 16, 8); c.fillRect(-4, -8, 8, 8);
    c.fillStyle = K.P.paper; c.fillRect(-w / 2, -h - 24, w, h); c.fillRect(-8, -24, 16, 4); c.fillRect(-4, -20, 8, 8);
    c.fillStyle = K.P.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, -24 - h / 2 + 3);
    c.restore();
  };

  window.K = K; window.CH = window.CH || {};
})();
