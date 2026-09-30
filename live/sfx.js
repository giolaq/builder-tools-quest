// Chiptune SFX for live mode: the same pulse / triangle / stepped-noise recipes as audio.py, synthesised into
// WebAudio buffers once, then fired on live events. SFX.stream() exposes the mix so recordings carry sound.
(function () {
  const SR = 44100, midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const rnd = K.rng(11);
  let ctx = null, master = null, dest = null, bufs = null;

  // ---------- oscillators + envelope (audio.py equivalents) ----------
  const sq = (f, duty = 0.5) => t => ((t * f) % 1 < duty ? 1 : -1);
  const tri = f => t => 2 * Math.abs(2 * ((t * f) % 1) - 1) - 1;
  const noise = (period = 1) => { let v = 0, k = 0; return () => { if (k++ % period === 0) v = rnd() * 2 - 1; return v; }; };
  const sweepOsc = (f0, f1, d, duty = 0.5) => { const r = f1 / f0, c = f0 * d / Math.log(r); return t => ((c * (Math.pow(r, t / d) - 1)) % 1 < duty ? 1 : -1); };
  const envAt = (t, d, { a = 0.003, dec = 6, sus = 0, rel = 0.02 } = {}) => {
    let e = Math.min(1, t / a) * (sus + (1 - sus) * Math.exp(-dec * t));
    if (rel && t > d - rel) e *= Math.max(0, (d - t) / rel);
    return e;
  };
  // a sound = list of voices [t0, dur, osc, gain, env]; rendered to one mono buffer
  function render(voices) {
    const len = Math.ceil(SR * Math.max(...voices.map(v => v[0] + v[1]))) + 1, out = new Float32Array(len);
    for (const [t0, d, osc, g, e] of voices) {
      const i0 = Math.floor(t0 * SR), n = Math.floor(d * SR);
      for (let i = 0; i < n; i++) { const t = i / SR; out[i0 + i] += osc(t) * envAt(t, d, e) * g; }
    }
    const b = ctx.createBuffer(1, len, SR); b.copyToChannel(out, 0); return b;
  }
  const blip = (t0, n = 84, g = 0.08, d = 0.08, duty = 0.5) => [t0, d, sq(midi(n), duty), g, { dec: 20 }];
  const jingle = (t0, notes, sp = 0.07, g = 0.07, d = 0.12) => notes.map((n, i) => blip(t0 + i * sp, n, g, d, 0.25));
  const sweep = (t0, f0, f1, d = 0.4, g = 0.07, duty = 0.5) => [t0, d, sweepOsc(f0, f1, d, duty), g, { dec: 2, sus: 0.5 }];

  function build() {
    const S = {
      question: [blip(0, 76, 0.07, 0.12), blip(0.15, 81, 0.07, 0.12)],                       // Gio asks
      chirp: jingle(0, [79, 83, 86], 0.05, 0.06),                                           // Byte opens ADBT
      beam: [sweep(0, 300, 1500, 0.35, 0.06, 0.25), ...Array.from({ length: 6 }, (_, i) => blip(0.35 + i * 0.07, 80 + (i * 5) % 17, 0.03, 0.05, 0.125))],
      scroll: [sweep(0, 400, 700, 0.3, 0.04), ...jingle(0.3, [72, 76, 79], 0.06, 0.05, 0.06)], // reading a doc
      got: jingle(0, [86, 91], 0.05, 0.07),                                                 // ADBT answered
      err: [[0, 0.3, noise(40), 0.18, { dec: 9 }], sweep(0.05, 500, 200, 0.3, 0.05)],
      write: [blip(0, 88, 0.06), blip(0.12, 93, 0.05)],                                     // answer starts
      fanfare: [...jingle(0, [74, 78, 81, 86], 0.09, 0.06, 0.18), [0.36, 0.25, sweepOsc(800, 3200, 0.25, 0.125), 0.06, { dec: 2, sus: 0.5 }], [0.36, 0.2, noise(1), 0.04, { dec: 14 }]],
      sad: [sweep(0, 900, 300, 0.4, 0.05), sweep(0.5, 250, 150, 0.5, 0.05)],
      key: [[0, 0.02, noise(2), 0.04, { dec: 90 }]],                                         // typewriter tick
    };
    bufs = {}; for (const k in S) bufs[k] = render(S[k]);
  }

  function init() {
    if (ctx) return ctx.state === 'suspended' ? ctx.resume() : null;
    ctx = new AudioContext({ sampleRate: SR });
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; // soften pulse edges, as in audio.py
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -6; lim.ratio.value = 12; // audio.py normalises its mix; this is the live equivalent
    master = ctx.createGain(); master.gain.value = 3.5; master.connect(lp); lp.connect(lim); lim.connect(ctx.destination);
    dest = ctx.createMediaStreamDestination(); lim.connect(dest);
    build();
  }
  function play(name, { g = 1, pan = 0 } = {}) {
    if (!ctx || !bufs || !SFX.enabled) return;
    const src = ctx.createBufferSource(); src.buffer = bufs[name];
    const gain = ctx.createGain(); gain.gain.value = g; const p = ctx.createStereoPanner(); p.pan.value = pan;
    src.connect(gain); gain.connect(p); p.connect(master); src.start();
  }
  const SFX = { enabled: true, init, play, stream: () => (dest ? dest.stream : null), rnd };
  window.SFX = SFX;
})();
