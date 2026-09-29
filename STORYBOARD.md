# STORYBOARD — "Builder Tools: a Fire TV quest"

Animated explainer, drawn and scored entirely in code. Audience: software engineers. One idea per chapter.

**Topic:** Amazon Devices Builder Tools (ADBT) for AI-powered Fire TV development
**Runtime:** 1:50 · **Chapters:** 9 · **Guide:** Mini Gio (pixel version)
**Beat grid:** 120 BPM, 4/4 → 1 beat = 0.5 s, 1 bar = 2 s. Cues are `bar.beat`, global across the film.
**Output:** vertical MP4, 1080×1920, 30 fps, laid out for phones.

---

## Style — original retro pixel adventure

A top-down 16-bit action-adventure world of our own: grass tiles, stone paths, a village, a library tower, a dungeon, a bridge. Drawn on a 270×480 (portrait) pixel canvas and scaled ×4 with hard edges, so every shape is chunky pixels. 1-px dark outlines, dithered shadows.

**Palette** — built on [color-hex palette 4125](https://www.color-hex.com/color-palette/4125): `#494b4b` stone grey, `#0e5135` forest, `#0d9263` emerald, `#4aba91` mint, `#d4ce46` gold. Extra shades only where needed: near-black ink, parchment white, Gio's skin/pink polo/brown glasses, and one crash red. Captions and code chips are drawn at full resolution on top so they stay sharp on a phone. The music is synthesized chiptune (square, triangle and noise channels).

Everything is original: no characters, items, symbols, sounds or maps from any existing game.

## Guide — pixel Mini Gio

The same Mini Gio, as a 32×48 sprite: dark hair, brown glasses, goatee, pink polo, dark trousers, trainers. Four-direction walk cycle, a wave, a cheer. He's the player character.

## The Compile Blade

Gio's weapon: a pixel sword whose blade is a glowing text cursor (`▌`). It glows gold when Byte learns something new, and in chapter 7 it slices the crash boss into readable stack frames.

## Companion — Byte

A small cube robot with a screen face and an antenna. It stands for **your AI coding agent** (Claude Code, Cursor, Kiro…). Byte follows Gio; when Builder Tools is installed, Byte's screen turns teal and gains a "Fire TV" badge.

---

## Chapter plan

| # | Title | Bars | Time | One idea |
|---|---|---|---|---|
| 1 | The quest | 1–6 | 0:00–0:12 | Your AI agent doesn't know Fire TV yet |
| 2 | One command | 7–12 | 0:12–0:24 | One `npx` command installs Builder Tools |
| 3 | Any agent | 13–18 | 0:24–0:36 | Works with the agent you already use |
| 4 | The library | 19–25 | 0:36–0:50 | Skills + docs search: Vega knowledge in your editor |
| 5 | First app | 26–32 | 0:50–1:04 | Describe it; the agent runs the Vega CLI |
| 6 | The slow dungeon | 33–39 | 1:04–1:18 | Performance: it reads the traces |
| 7 | The crash boss | 40–46 | 1:18–1:32 | Crashes: it reads the crash report |
| 8 | The bridge | 47–51 | 1:32–1:42 | Port a Fire OS app to Vega (Beta) |
| 9 | Quest complete | 52–55 | 1:42–1:50 | Your agent, now a Fire TV expert |

---

## 1 · The quest — bars 1–6

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 1.1 | Fade in on a pixel village. A TV-shaped signpost reads "Fire TV". | — | Chiptune intro arpeggio |
| 2.1 | Pixel Gio walks in and waves. | "Hi, I'm Gio." | Footstep blips |
| 3.1 | Byte trundles in behind him. A label pops: "your AI agent". | "This is Byte, my AI coding agent." | Robot chirp |
| 4.1 | Gio points at the Fire TV sign; Byte's screen shows "?" | "It codes well, but doesn't know Fire TV yet." | Question blip |
| 5.3 | A quest scroll unrolls: "Ship a Vega OS app". Gio draws the Compile Blade. | "Our quest: ship a Vega OS app." | Scroll flutter + blade shing |

## 2 · One command — bars 7–12

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 7.1 | A treasure chest on a stone plinth. A terminal chip below it types the command. | "One command installs it:" | Typing clicks on 8ths |
| 8.1 | Command in full, mono chip: `npx -y @amazon-devices/amazon-devices-buildertools-mcp@latest init-context` | (caption stays) | — |
| 9.1 | Chest opens; three items float up one per beat: **MCP server**, **Agent Skills**, **Docs search**. | "An MCP server, Agent Skills and docs search." | Pop ×3 |
| 10.3 | Items fly into Byte; its screen turns mint with a "Fire TV" badge, and Gio's blade flares gold. | "Byte levels up." | Level-up jingle |
| 11.3 | Small "It stays up to date" tag. | "And it keeps itself up to date." | Tick |

## 3 · Any agent — bars 13–18

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 13.1 | Three stone portals in a row, each with a plain text sign: "Claude Code", "Cursor", "Kiro". | "Works with the agent you already use." | Low hum |
| 14.3 | Each portal lights in turn; Byte hops through and pops out wearing that sign's colour. | — | Warp ×3 |
| 16.1 | A signpost behind: "Copilot · Cline · more". | "Copilot, Cline and others too." | Blip |
| 17.1 | Gio gives a thumbs-up; Byte beeps. | "No new editor to learn." | Chirp |

## 4 · The library — bars 19–25

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 19.1 | A library tower interior: shelves of pixel books. | "Inside: Vega know-how." | Soft pad |
| 20.1 | Books glow and slide out with spine labels: "Setup", "Focus", "Media", "UI", "Manifest", "Performance". | "Agent Skills: step-by-step guides." | Page blips per beat |
| 22.1 | A crystal ball labelled `search_documentation` shows a docs page. | "It searches the official docs." | Shimmer |
| 23.3 | Gio sits reading while Byte answers a speech bubble "How do I handle focus?" with a ✓. | "Answers in your editor, no tab-switching." | Chime |

## 5 · First app — bars 26–32

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 26.1 | A pixel workshop. Gio types in a speech bubble: "Set up a Vega hello world app." | "Describe what you want…" | Typing |
| 27.3 | Byte's screen scrolls real CLI lines: `vega project generate --template helloWorld` | "…Byte runs the Vega CLI." | Fast ticks |
| 29.1 | Build → Install → Launch as three pixel icons lighting in sequence. | "Build, install, launch." | Blip ×3 rising |
| 30.3 | A pixel TV ("Virtual Device") shows "Hello World". | "Running on the Virtual Device." | Fanfare sting |
| 31.3 | Tag: "You approve each step." | "You stay in control." | Tick |

## 6 · The slow dungeon — bars 33–39

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 33.1 | Dungeon door. A sluggish snail-monster labelled "Slow launch (TTFF)" blocks the corridor. | "Your app starts slowly." | Low drone |
| 34.3 | Byte unrolls a trace scroll: `analyze_perfetto_traces`. A timeline bar with one fat red block. | "Byte reads the performance traces." | Scroll flutter |
| 36.1 | Magnifier over the red block: `get_app_hot_functions` highlights one function. | "It finds the hot functions…" | Zoom blip |
| 37.1 | Ghostly duplicate sprites (re-renders) fade away. | "…and needless re-renders." | Poof ×3 |
| 38.1 | Snail shrinks and scoots off; door opens. | "Faster start, smoother UI." | Door creak + sting |

## 7 · The crash boss — bars 40–46

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 40.1 | Boss room. A glitchy block-monster made of garbled hex text. | "Then the app crashes." | Boss drone, glitch noise |
| 41.3 | Gio asks in a bubble: "Why did my app crash?" | "Just ask why." | Blip |
| 42.3 | Byte casts `symbolicate_acr`; the hex scrambles into a readable stack trace with a highlighted line. | "It decodes the crash report." | Rising sweep |
| 44.1 | Three labelled shields pop: "JavaScript", "Native", "Low memory". One lights. | "It tells you which kind of crash." | Pop ×3 |
| 45.1 | Gio swings the Compile Blade; the boss splits into neat stack-frame blocks and dissolves; ✓. | "Then helps you fix it." | Blade shing + victory sting |

## 8 · The bridge — bars 47–51

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 47.1 | A river. Left bank: a house labelled "Fire OS app". Right bank: "Vega OS". | "Got a Fire OS app?" | Water shimmer |
| 48.1 | Byte builds a plank bridge, one plank per beat. | "Ask Byte to port it to Vega." | Hammer ×4 |
| 49.3 | The house walks across; small "Beta" tag. | "App porting is in Beta." | Footsteps |
| 50.3 | Tag: "Check the result yourself." | "Review what it changes." | Tick |

## 9 · Quest complete — bars 52–55

| Cue | Picture | Caption | Sound |
|---|---|---|---|
| 52.1 | Back in the village at sunset. Gio and Byte stand by the Fire TV sign, now lit. | "Your agent, now a Fire TV expert." | Main theme |
| 53.1 | End card: "Amazon Devices Builder Tools" and the `npx … init-context` command. | "Install it in one command." | — |
| 54.1 | Gio waves; "developer.amazon.com" in plain text. Fade out by 55.4. | "Go build something." | Final chord |

---

## Facts & sources

- ADBT is a suite of AI-powered tools for Fire TV development: an MCP server, Agent Skills, and documentation search from developer.amazon.com. Announced May 20, 2026. — [Amazon blog](https://developer.amazon.com/apps-and-games/blogs/2026/05/introducing-amazon-builder-tools)
- Install: `npx -y @amazon-devices/amazon-devices-buildertools-mcp@latest init-context`; the blog says it stays current with updates. — [MCP server docs](https://developer.amazon.com/docs/vega/0.22/mcp-server.html)
- Agents: Claude Code, Cursor, Kiro (blog); docs also list Cline, GitHub Copilot, Amazon Q and custom agents. — both sources
- Requires Node.js 18+ and Vega SDK 0.22+ for Vega workflows. — docs
- MCP tools include `analyze_perfetto_traces`, `get_app_hot_functions`, `search_documentation`, `symbolicate_acr`; 10 Agent Skills (setup, building, navigation, focus, media, UI, manifest, performance, best practices, app migration). — docs
- Performance: TTFF/TTFD diagnosis, re-render analysis, input latency, CPU hot functions. Crashes: symbolicates Amazon Crash Reports; classifies JavaScript, native, low-memory-killer and ANR crashes. — docs
- App porting (Fire OS → Vega) is Beta and may need manual adjustments. — docs
- The agent proposes Vega CLI commands (e.g. `vega project generate --template helloWorld`) and runs them; in Claude Code, MCP tool calls need approval. — [Getting started guide](https://developer.amazon.com/apps-and-games/blogs/2026/07/guide-to-building-for-fire-tv-on-vega-os)

## What's simplified

1. **Byte** stands in for any AI coding agent; ADBT is what you add to it, not a separate agent.
2. **"Byte runs the CLI"**: the MCP server gives the agent context and tools, and the agent runs Vega CLI commands on your machine. You approve steps.
3. **Agent list**: the film names three agents plus "Copilot, Cline and more"; Amazon Q and custom agents are also supported.
4. **Crash types**: the film shows three; ANR is a fourth.
5. **Skipped**: In-App Purchase integration, media player (Shaka) workflows, Fire OS support (partial), non-interactive install flags, the `check-status` command.
6. **Privacy**: the blog says your code and prompts aren't collected; the docs note documentation-search queries go to Amazon and anonymous telemetry is on by default (can be turned off). Not covered in the film.
7. **Brand**: no Amazon, Fire TV or agent logos; plain text labels only.
