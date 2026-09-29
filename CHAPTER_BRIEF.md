# Chapter brief (for chapter builders)

Project: this repository. A code-drawn **vertical (1080×1920)** pixel-art explainer rendered to MP4 frame by frame.

Read first: `STORYBOARD.md` (your chapter's cue table, facts), `STYLE.md` (two layers, palette, type sizes, **portrait safe area**), `kit.js` (helpers, sprites), and look at `snaps/sprite_reference.png`.

## Contract
- Write only `chapters/chN.js`. Don't edit kit.js, film.js, index.html, STYLE.md or other chapters. Put helpers inside your file (IIFE).
- Register: `window.CH[N] = { lo(p, t) {...}, hi(c, t) {...} }`. **t is global film seconds**; use `K.at(bar, beat)` for cue times.
- `lo` draws the full 270×480 low-res world every frame (fill the background yourself). `hi` draws crisp text/chips/bubbles on 1080×1920. Pure functions of t.
- Chapter is live from `K.at(firstBar)` to `K.at(lastBar + 1)`. film.js draws the pixel-block wipe over the first/last ~0.4 s, the chapter tag (top-left, y < 240) and the **captions** (dialogue box y 1460–1760). Do NOT draw captions. Keep meaningful content in x 60–1020, y 260–1440 (low-res x 15–255, y 65–360).
- Hit every cue on its beat; what the caption says must be visible at that moment.
- Mini Gio appears in every chapter (pass `t`); Byte too unless the storyboard says otherwise. Byte is `level:1` from chapter 3 on. Use `u: 2` or `3` so faces read.
- Pixel look: low-res layer only whole pixels, no smoothing, stepped motion OK. Scenery built from the kit terrain + your own pixel shapes. Original designs only (see STYLE.md "Originality"). No real logos; agent/product names as plain text signs/chips.
- Code must be exact: `npx -y @amazon-devices/amazon-devices-buildertools-mcp@latest init-context`, `vega project generate --template helloWorld`, `analyze_perfetto_traces`, `get_app_hot_functions`, `search_documentation`, `symbolicate_acr`. Long commands: split across lines/chips so each is ≥ 28 px and fits 960 px wide.

## Check your own work (required)
1. `python3 snap.py --ch N --n 12` → `snaps/chN_sheet.png` (thumbnails 300 px wide ≈ phone size). Read it.
2. `python3 snap.py --only N --t <cue seconds...>` → full-size stills `snaps/t_XXX.XX.png`. Read them.
3. Fix JS errors (script exits non-zero and prints them).
4. Iterate ≥ 3 passes until every cue reads at thumbnail size, nothing overlaps awkwardly or sits under the caption box, motion has clean start/end states, and it looks polished and charming, not placeholder-y.

Finish with a short report: what's on screen per cue, any deviations and why, final sheet path.
