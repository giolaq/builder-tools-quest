# Style guide — Builder Tools quest (original pixel adventure, portrait)

Frame: **1080×1920 vertical, 30 fps**, for phones. Two layers per frame:
- **Low-res world** `lo(p, t)`: a **270×480** canvas scaled ×4 with hard edges. All scenery, characters and effects go here, on whole pixels (use `K.R`, `K.OR`, `K.block`, `K.dither`, `K.spr`; round with `K.r`). No anti-aliased shapes, no gradients, no rotation, no blur. Chunky stepped motion is fine and on-style (`K.step(t, 8)`).
- **Hi-res overlay** `hi(c, t)` on the 1080×1920 canvas: only text, labels, code chips, speech bubbles (`K.chip`, `K.code`, `K.bubble`, `K.text`, `K.box`). Low-res point (x,y) = hi-res (x*4, y*4) (`K.H4`).

Every frame is a pure function of t: no Math.random (use `K.rng(seed)`), no state between frames.

## Palette (`K.P`) — from color-hex palette 4125
Core: `stone #494b4b`, `forest #0e5135`, `emerald #0d9263`, `mint #4aba91`, `gold #d4ce46`. Shades: stoneL/stoneD, forestD, emeraldL, mintL, goldL/goldD. Extras only where needed: `ink`, `paper`/`paperD`, `brown`/`brownD` (wood), `water`/`waterL`, `red`/`redD` (**only** crashes, errors, the slow monster), Gio's own colours.
Greens and grey are the world; **gold means "look here"** (the active item, the blade glow, highlights); mint is magic/Byte's knowledge.

## Type (overlay only)
- `K.F.px(size)` Pixelify Sans — labels, chips, bubbles. `K.F.mono(size)` JetBrains Mono — code/commands. `K.F.arcade(size)` Press Start 2P — sparingly, for a big title only.
- **Phone rule:** labels ≥ 40 px, code ≥ 32 px (long commands may go to 28 px and wrap/split across two chips). Check the 300 px-wide sheet thumbnails: if you can't read it there, it's too small.

## Layout (portrait)
- **Safe area for action & labels: x 60–1020, y 260–1440** (low-res: x 15–255, y 65–360). Top 0–240 holds the chapter tag; **y 1460–1760 is the caption dialogue box** (drawn by film.js); below 1760 is platform UI — keep empty-ish scenery only.
- The world can fill the whole frame (grass, walls) — just keep anything meaningful inside the safe area.
- One idea per moment; ≤ 3 things moving.

## Characters (see `snaps/sprite_reference.png`)
- **Mini Gio** `K.gio(p, x, y, {t, pose, expr, u})`, anchor = feet. poses: idle, walk, wave, cheer, point, sword (Compile Blade raised), swing (blade horizontal, use `flip` for left), read. expr: happy, grin, wow, worried. `u` = pixel size (default 2 ≈ 68 low-res px tall; use 2–3). `flip:true` mirrors.
- **Byte** `K.byte(p, x, y, {t, face, level, tint, u})`: the AI agent. faces: eyes, '?', '!', happy, scroll. `level:1` after chapter 2 (mint screen, gold antenna, badge) — **Byte is levelled from chapter 3 onward**.
- **Compile Blade** `K.blade(p, hx, hy, u, dir, glow, t)` — cursor-bar blade. Gold glow when powered.
- Props: `K.chest`, `K.tv`, `K.tree`, `K.bush`, `K.flower`, `K.grass`, `K.path`, `K.stoneFloor`, `K.wall`, `K.sparkle`, `K.poof`.

## Originality
Everything original: no characters, items, symbols, music motifs or maps from existing games (no triangles-of-gold symbols, no heart-container HUD, no fairy companions, no green-tunic heroes). No real logos (Amazon, Fire TV, Claude, Cursor, Kiro…): plain text signs only.
