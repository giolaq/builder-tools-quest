// 16:9 composition: portrait film centred at full height, pixel side panels.
(function () {
  const P = K.P, W = 1920, H = 1080, VW = Math.round(1080 * 1080 / 1920), VX = Math.round((W - VW) / 2);
  const side = document.createElement('canvas'); side.width = 480; side.height = 270;
  function world(p, t) { // low-res 480x270 backdrop for the whole frame
    K.grass(p, 0, 0, 480, 270, 21);
    const r = K.rng(9);
    for (let i = 0; i < 14; i++) { const x = r() < 0.5 ? 8 + r() * 140 : 332 + r() * 140, y = 30 + r() * 250; K.tree(p, x, y, 0.7 + r() * 0.5); }
    for (let i = 0; i < 30; i++) { const x = r() < 0.5 ? r() * 150 : 330 + r() * 150; K.flower(p, x, r() * 270, r() < .5 ? P.gold : P.paper); }
    // stone frame around the film slot
    const x0 = VX / 4 - 4, w = VW / 4 + 8;
    K.R(p, x0 - 1, 0, w + 2, 270, P.ink); K.wall(p, x0, 0, w, 270);
  }
  const CH = FILM.CHAPTERS;
  function panels(c, t) {
    const cur = Math.max(0, CH.findIndex(x => t >= x.start && t < x.end));
    const ci = t >= FILM.DURATION - 0.01 ? 8 : cur;
    // left: title + chapter list
    const lx = 44, lw = VX - 88;
    K.box(c, lx, 70, lw, 190, { fill: P.forestD });
    K.text(c, 'THE BUILDER', lx + lw / 2, 128, { font: K.F.arcade(34), color: P.goldL });
    K.text(c, 'TOOLS QUEST', lx + lw / 2, 180, { font: K.F.arcade(34), color: P.goldL });
    K.text(c, 'Fire TV · AI dev tools', lx + lw / 2, 228, { font: K.F.px(30, 600), color: P.mintL, shadow: false });
    K.box(c, lx, 300, lw, 700, { fill: P.ink, border: P.mint });
    CH.forEach((ch, i) => {
      const y = 350 + i * 72, done = i < ci, now = i === ci;
      if (now) { c.fillStyle = P.forest; c.fillRect(lx + 12, y - 30, lw - 24, 60); c.fillStyle = P.gold; c.fillRect(lx + 22, y - 8, 12, 16); c.fillRect(lx + 34, y - 4, 6, 8); }
      K.text(c, `${i + 1}`, lx + 70, y + 2, { font: K.F.px(38), color: now ? P.goldL : done ? P.mint : P.stoneL, shadow: false });
      K.text(c, ch.title, lx + 104, y + 2, { font: K.F.px(38), color: now ? P.paper : done ? P.mintL : P.stoneL, align: 'left', shadow: false });
      if (done) { c.fillStyle = P.mint; const x = lx + lw - 56; c.fillRect(x, y, 8, 8); c.fillRect(x + 8, y + 8, 8, 8); c.fillRect(x + 16, y, 8, 8); c.fillRect(x + 24, y - 8, 8, 8); }
    });
    // right: quest log + progress
    const rx = VX + VW + 44, rw = W - rx - 44;
    K.box(c, rx, 70, rw, 250, { fill: P.forestD });
    K.text(c, 'QUEST LOG', rx + rw / 2, 124, { font: K.F.arcade(30), color: P.goldL });
    const prog = K.clamp(t / FILM.DURATION);
    const bx = rx + 40, bw = rw - 80;
    c.fillStyle = P.ink; c.fillRect(bx - 6, 176, bw + 12, 52); c.fillStyle = P.stoneD; c.fillRect(bx, 182, bw, 40);
    c.fillStyle = P.mint; c.fillRect(bx, 182, Math.round(bw * prog / 8) * 8, 40);
    c.fillStyle = P.mintL; c.fillRect(bx, 182, Math.round(bw * prog / 8) * 8, 8);
    CH.forEach((ch, i) => { if (i) { const x = bx + bw * ch.start / FILM.DURATION; c.fillStyle = P.ink; c.fillRect(Math.round(x) - 2, 182, 4, 40); } });
    K.text(c, `Chapter ${ci + 1} of 9`, rx + rw / 2, 272, { font: K.F.px(38), color: P.paper, shadow: false });
    // right: the command, always handy
    K.box(c, rx, 380, rw, 250, { fill: P.ink, border: P.mint });
    K.text(c, 'Install:', rx + 34, 430, { font: K.F.px(34), color: P.mintL, align: 'left', shadow: false });
    ['npx -y', '@amazon-devices/', 'amazon-devices-buildertools-mcp', '@latest init-context'].forEach((ln, i) =>
      K.text(c, ln, rx + 34, 482 + i * 38, { font: K.F.mono(26), color: P.goldL, align: 'left', shadow: false }));
    K.box(c, rx, 690, rw, 90, { fill: P.forestD });
    K.text(c, 'developer.amazon.com', rx + rw / 2, 737, { font: K.F.px(38), color: P.paper, shadow: false });
  }
  window.renderWide = function (t) {
    renderAt(t);
    const w = document.getElementById('w').getContext('2d'); w.setTransform(1, 0, 0, 1, 0, 0); w.globalAlpha = 1;
    const p = side.getContext('2d'); p.imageSmoothingEnabled = false; world(p, t);
    w.imageSmoothingEnabled = false; w.drawImage(side, 0, 0, W, H);
    panels(w, t);
    // film slot
    w.imageSmoothingEnabled = true; w.imageSmoothingQuality = 'high';
    w.fillStyle = P.ink; w.fillRect(VX - 8, 0, VW + 16, H);
    w.drawImage(document.getElementById('c'), VX, 0, VW, H);
    // global fades match the film
    if (t < 0.5) { w.fillStyle = `rgba(0,0,0,${1 - K.prog(t, 0, 0.5)})`; w.fillRect(0, 0, W, H); }
    if (t > FILM.DURATION - 0.6) { w.fillStyle = `rgba(0,0,0,${K.prog(t, FILM.DURATION - 0.6, 0.6)})`; w.fillRect(0, 0, W, H); }
  };
})();
