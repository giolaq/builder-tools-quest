#!/usr/bin/env python3
"""Render stills. Usage:
  python3 snap.py --ch 3 [--n 8]          -> snaps/ch3_sheet.png (+ individual frames)
  python3 snap.py --t 31.5 40 ...         -> snaps/t_31.50.png ...
  python3 snap.py --sheet                 -> snaps/contact_sheet.png (3 frames per chapter)
  add --nocap to hide captions, --only N to draw chapter N regardless of time (no wipes)
"""
import argparse, base64, io, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'snaps'); os.makedirs(OUT, exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def grab(page, t, cap=True, only=None):
    js = f"(async()=>{{await window.ready;renderAt({t},{{captions:{str(cap).lower()},only:{only or 'null'}}});return document.getElementById('c').toDataURL('image/png')}})()"
    return Image.open(io.BytesIO(base64.b64decode(page.evaluate(js).split(',')[1]))).convert('RGB')
def sheet(frames, cols, path, tw=640):
    th = int(tw * 16 / 9); rows = (len(frames) + cols - 1) // cols
    S = Image.new('RGB', (cols * tw + (cols + 1) * 10, rows * (th + 40) + 10), (20, 20, 30)); d = ImageDraw.Draw(S); f = ImageFont.truetype(FONT, 22)
    for i, (lab, im) in enumerate(frames):
        x = 10 + (i % cols) * (tw + 10); y = 10 + (i // cols) * (th + 40)
        S.paste(im.resize((tw, th), Image.LANCZOS), (x, y + 30)); d.text((x, y + 2), lab, fill=(255, 210, 110), font=f)
    S.save(path); print(path)
def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--ch', type=int); ap.add_argument('--n', type=int, default=8); ap.add_argument('--t', type=float, nargs='*')
    ap.add_argument('--sheet', action='store_true'); ap.add_argument('--nocap', action='store_true'); ap.add_argument('--only', type=int); ap.add_argument('--page', default='index.html')
    a = ap.parse_args()
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errs.append(m.text))
        pg.goto('file://' + os.path.join(HERE, a.page)); pg.wait_for_function('window.ready')
        FILM = pg.evaluate('window.FILM ? {ch: FILM.CHAPTERS.map(c=>[c.start,c.end,c.title])} : null')
        cap = not a.nocap
        if a.t:
            for t in a.t:
                im = grab(pg, t, cap, a.only); path = os.path.join(OUT, f't_{t:06.2f}.png'); im.save(path); print(path)
        if a.ch:
            s, e, title = FILM['ch'][a.ch - 1]; fr = []
            for i in range(a.n):
                t = round(s + 0.35 + (e - s - 0.7) * i / max(1, a.n - 1), 2); fr.append((f'ch{a.ch} t={t:.2f}s', grab(pg, t, cap, a.ch)))
            sheet(fr, 6, os.path.join(OUT, f'ch{a.ch}_sheet.png'), tw=300)
        if a.sheet:
            fr = []
            for i, (s, e, title) in enumerate(FILM['ch']):
                for k in (0.3, 0.62, 0.92):
                    t = round(s + (e - s) * k, 2); fr.append((f'{i+1}. {title}  {t:.1f}s', grab(pg, t, cap)))
            sheet(fr, 9, os.path.join(OUT, 'contact_sheet.png'), tw=240)
        if errs: print('JS ERRORS:', *errs[:10], sep='\n  '); sys.exit(1)
        b.close()
main()
