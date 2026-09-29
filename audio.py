#!/usr/bin/env python3
"""Chiptune soundtrack + SFX on the 120 BPM grid -> out/audio.wav (110 s)."""
import numpy as np, wave, os
from scipy.signal import lfilter
SR = 44100; BEAT = 0.5; DUR = 110.0
N = int(SR * (DUR + 1)); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(11)
def at(bar, beat=1): return ((bar - 1) * 4 + (beat - 1)) * BEAT
def tt(d): return np.arange(int(SR * d)) / SR
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def sq(f, d, duty=0.5): t = tt(d); return np.where((t * f) % 1 < duty, 1.0, -1.0)
def tri(f, d): t = tt(d); return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1
def noise(d, period=1):  # stepped noise like a 2A03 channel
    n = int(SR * d); v = rng.uniform(-1, 1, n // period + 1); return np.repeat(v, period)[:n]
def env(d, a=0.003, dec=6.0, sus=0.0, rel=0.02):
    t = tt(d); e = np.minimum(1, t / a) * (sus + (1 - sus) * np.exp(-dec * t)); r = int(rel * SR)
    if r and len(e) > r: e[-r:] *= np.linspace(1, 0, r)
    return e
def add(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[:j - i] * g; L[i:j] += s * np.sqrt(0.5 * (1 - pan)); R[i:j] += s * np.sqrt(0.5 * (1 + pan))
def lp(x, cut): a = np.exp(-2 * np.pi * cut / SR); return lfilter([1 - a], [1, -a], x)

# ---------- music ----------
# Heroic-but-original progression in D minor-ish modal: Dm Bb C Am  (8-bar loop w/ melody)
PROG = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 48, 52]]
BASS = [38, 34, 36, 33]
# original melody, one phrase per 4 bars, as (beat offset, midi, length in beats)
MEL_A = [(0, 74, 1), (1, 77, .5), (1.5, 76, .5), (2, 74, 1), (3, 69, 1), (4, 70, 1.5), (5.5, 72, .5), (6, 74, 2),
         (8, 72, 1), (9, 76, .5), (9.5, 74, .5), (10, 72, 1), (11, 67, 1), (12, 69, 1), (13, 72, 1), (14, 76, 1), (15, 74, 1)]
MEL_B = [(0, 81, 1.5), (1.5, 79, .5), (2, 77, 1), (3, 74, 1), (4, 74, .5), (4.5, 77, .5), (5, 79, 1), (6, 77, 2),
         (8, 76, 1), (9, 77, 1), (10, 79, 1), (11, 81, 1), (12, 79, 1.5), (13.5, 77, .5), (14, 76, 2)]
QUIET = set(range(1, 3)) | {55}            # intro bars / outro
DUNGEON = set(range(33, 40))                # ch6: tense, minor drone
BOSS = set(range(40, 46))                   # ch7: driving
for bar in range(1, 56):
    t0 = at(bar); ch = PROG[(bar - 1) % 4]; root = BASS[(bar - 1) % 4]
    if bar in DUNGEON: ch = [50, 53, 56]; root = 38
    if bar in BOSS: ch = [[50, 53, 57], [51, 55, 58]][(bar - 40) // 2 % 2]; root = ch[0] - 12
    # arp (pulse 12.5%) 16ths, quiet
    if bar not in QUIET or bar == 2:
        for k in range(16):
            n = ch[k % 3] + 12 * (1 + (k // 3) % 2)
            d = 0.12; add(sq(midi(n), d, 0.125) * env(d, dec=18), t0 + k * BEAT / 4, 0.022 if bar not in BOSS else 0.03, 0.25 if k % 2 else -0.25)
    # triangle bass
    if bar not in QUIET:
        pat = [0, 1, 1.5, 2, 3, 3.5] if bar in BOSS else [0, 1.5, 2, 3]
        for b in pat:
            d = 0.28; add(tri(midi(root), d) * env(d, dec=3, sus=0.5), t0 + b * BEAT, 0.24)
    # drums (noise)
    if bar not in QUIET and bar not in DUNGEON:
        for b in (0, 2): add(tri(55, 0.12) * env(0.12, dec=25), t0 + b * BEAT, 0.3); add(noise(0.05, 20) * env(0.05, dec=40), t0 + b * BEAT, 0.15)
        for b in (1, 3): add(noise(0.14, 3) * env(0.14, dec=20), t0 + b * BEAT, 0.12)
        for k in range(8): add(noise(0.03, 1) * env(0.03, dec=60), t0 + k * BEAT / 2, 0.05, 0.4)
    if bar in DUNGEON:  # slow heartbeat
        add(tri(50, 0.2) * env(0.2, dec=12), t0, 0.35); add(tri(50, 0.2) * env(0.2, dec=12), t0 + 0.3, 0.25)
    # lead melody (pulse 25%) on theme sections
    phrase = None; rel = None
    for start, mel in ((3, MEL_A), (7, MEL_A), (13, MEL_B), (19, MEL_A), (26, MEL_B), (47, MEL_A), (52, MEL_B)):
        if start <= bar < start + 4 and bar not in DUNGEON and bar not in BOSS:
            phrase = mel; rel = (bar - start) * 4
    if phrase and bar == (next(s for s in (3, 7, 13, 19, 26, 47, 52) if s <= bar < s + 4)):
        for (b, n, ln) in phrase:
            d = ln * BEAT * 0.92; v = sq(midi(n), d, 0.25) * env(d, dec=1.2, sus=0.6, rel=0.03)
            vib = 1; add(v, t0 + b * BEAT, 0.05, 0.1)
    if bar in BOSS and (bar - 40) % 2 == 0:  # boss riff
        for i, n in enumerate([62, 65, 63, 62, 60, 62, 58, 62]):
            d = BEAT * 0.45; add(sq(midi(n), d, 0.5) * env(d, dec=4, sus=0.4), t0 + i * BEAT / 2, 0.035)
# intro swell + final chord
for n in (50, 57, 62): add(sq(midi(n), 3.6, 0.25) * np.linspace(0, 1, int(SR * 3.6)) ** 2 * 0.6, 0.2, 0.03)
for n in (50, 57, 62, 66, 69): d = 4.5; add(sq(midi(n), d, 0.25) * env(d, a=0.01, dec=0.9), at(54), 0.035)

# ---------- SFX ----------
def blip(t0, n=84, g=0.08, d=0.08, duty=0.5): add(sq(midi(n), d, duty) * env(d, dec=20), t0, g)
def step(t0, g=0.05): add(noise(0.03, 8) * env(0.03, dec=60), t0, g)
def jingle(t0, notes, sp=0.07, g=0.07, d=0.12): [blip(t0 + i * sp, n, g, d, 0.25) for i, n in enumerate(notes)]
def sweep(t0, f0, f1, d=0.4, g=0.07, duty=0.5):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); ph = np.cumsum(f) / SR; add(np.where(ph % 1 < duty, 1., -1.) * env(d, dec=2, sus=0.5), t0, g)
def boom(t0, g=0.25): add(noise(0.4, 40) * env(0.4, dec=7), t0, g)
def shing(t0): sweep(t0, 800, 3200, 0.25, 0.08, 0.125); add(noise(0.2, 1) * env(0.2, dec=14), t0, 0.05)
def poof(t0, g=0.1): add(noise(0.12, 6) * env(0.12, dec=25), t0, g)
def typing(t0, t1, g=0.035):
    t = t0
    while t < t1: add(noise(0.02, 2) * env(0.02, dec=90), t, g, (rng.random() - .5) * .5); t += 0.06
def fanfare(t0, g=0.06): jingle(t0, [74, 78, 81, 86], 0.09, g, 0.18)
def levelup(t0): jingle(t0, [72, 76, 79, 84, 88, 91], 0.06, 0.07, 0.1)
def wipe(t0): sweep(t0, 200, 900, 0.5, 0.03, 0.125); add(noise(0.5, 4) * np.sin(np.pi * tt(0.5) / 0.5), t0, 0.03)

for bar in (7, 13, 19, 26, 33, 40, 47, 52): wipe(at(bar) - 0.45)
# ch1
for i in range(6): step(0.9 + i * 0.18)
blip(at(2, 1), 81, 0.07); blip(at(2, 1) + 0.1, 86, 0.07)
for i in range(4): step(at(3) - 0.9 + i * 0.2, 0.04)
jingle(at(3, 1), [79, 83, 86], 0.05, 0.06)                       # Byte chirp
blip(at(4, 1), 76, 0.07, 0.12); blip(at(4, 1) + 0.15, 81, 0.07, 0.12)   # question
sweep(at(5, 3), 300, 900, 0.3, 0.05); shing(at(5, 3) + 0.4); fanfare(at(5, 4) + 0.2)
# ch2
typing(at(7, 1) + 0.2, at(8, 1) + 0.6)
sweep(at(9, 1) - 0.3, 200, 500, 0.3, 0.06)                       # chest open
for b in range(3): jingle(at(9, 1 + b), [86, 91], 0.05, 0.07)
levelup(at(10, 3)); shing(at(10, 4)); blip(at(11, 3), 88, 0.06)
# ch3
sweep(at(13, 1), 100, 140, 1.5, 0.04, 0.5)
for i, b in enumerate([(14, 3), (15, 1), (15, 3)]): sweep(at(*b), 300, 1500, 0.35, 0.06, 0.25); blip(at(*b) + 0.4, 84 + i * 3, 0.06)
blip(at(16, 1), 79, 0.06); jingle(at(17, 1), [84, 88, 91], 0.05, 0.06)
# ch4
for i, b in enumerate([(20, 1), (20, 2), (20, 3), (20, 4), (21, 1), (21, 2)]): blip(at(*b), 72 + i * 2, 0.06, 0.06)
jingle(at(22, 1), [88, 93, 96, 100], 0.08, 0.04, 0.3)            # crystal shimmer
typing(at(23, 3), at(24, 2)); jingle(at(24, 3), [84, 91], 0.1, 0.06)
# ch5
typing(at(26, 1), at(27, 2)); typing(at(27, 3), at(28, 4), 0.03)
for i in range(3): blip(at(29, 1 + i), 76 + i * 4, 0.08, 0.1)
fanfare(at(30, 3)); blip(at(31, 3) + 0.5, 88, 0.07); blip(at(31, 3) + 0.62, 93, 0.07)
# ch6
sweep(at(33, 1), 110, 80, 1.5, 0.05, 0.5)                         # snail groan
sweep(at(34, 3), 400, 700, 0.3, 0.04)                             # scroll
jingle(at(36, 1), [80, 92], 0.05, 0.06)
for i in range(3): poof(at(37, 1 + i))
sweep(at(38, 1), 900, 300, 0.4, 0.05); sweep(at(38, 1) + 0.6, 150, 250, 0.6, 0.05)  # snail leaves, door
fanfare(at(38, 3))
# ch7
for i in range(8): add(noise(0.05, 12) * env(0.05, dec=30), at(40, 1) + i * 0.13, 0.08)   # glitch build
boom(at(40, 1) + 1.1, 0.2)
blip(at(41, 3), 74, 0.06); blip(at(41, 3) + 0.12, 79, 0.06)
sweep(at(42, 3), 300, 2400, 0.9, 0.06, 0.25)                      # beam
for i in range(10): blip(at(43, 1) + i * 0.08, 80 + (i * 5) % 17, 0.03, 0.05, 0.125)  # decoding
for i in range(3): blip(at(44, 1 + i), 67 + i * 5, 0.08, 0.12)
jingle(at(44, 4), [88, 91], 0.05, 0.06)
shing(at(45, 1)); boom(at(45, 1) + 0.25, 0.28)
for i in range(4): poof(at(45, 2) + i * 0.25, 0.08)
fanfare(at(45, 4) + 0.3, 0.07)
# ch8
for i in range(6):
    b = [(48, 1), (48, 2), (48, 3), (48, 4), (49, 1), (49, 2)][i]
    add(noise(0.06, 30) * env(0.06, dec=40), at(*b), 0.18); blip(at(*b), 60, 0.05, 0.05)
for i in range(6): blip(at(49, 3) + i * 0.22, 72 + (i % 2) * 5, 0.05, 0.08, 0.25)
jingle(at(49, 3) + 1.4, [84, 88], 0.06, 0.06)
for i in range(3): blip(at(50, 3) + 0.2 + i * 0.25, 86, 0.05)
# ch9
levelup(at(52, 1)); shing(at(52, 1) + 0.3)
typing(at(53, 1) + 0.2, at(53, 3))

mix = np.stack([L, R], 1)[:int(SR * DUR)]
fi = int(0.4 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fs = int((DUR - 2.0) * SR); mix[fs:] *= np.linspace(1, 0, len(mix) - fs)[:, None]
mix = lp(mix.T, 9000).T  # soften harsh pulse edges a touch
pk = np.max(np.abs(mix)); mix = np.tanh(mix / pk * 1.1) / np.tanh(1.1) * 0.89
os.makedirs('out', exist_ok=True)
with wave.open('out/audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', len(mix) / SR)
