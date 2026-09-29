#!/usr/bin/env python3
"""Render the film to MP4. python3 render.py [--workers 2] [--fps 30] [--start S --end E]"""
import argparse, base64, os, subprocess, sys, time
from multiprocessing import Process
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out')
DUR = 110.0

def worker(idx, f0, f1, fps):
    seg = os.path.join(OUT, f'seg{idx}.mp4')
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(fps), '-c:v', 'mjpeg', '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', seg], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
        pg.goto('file://' + os.path.join(HERE, 'index.html')); pg.wait_for_function('window.ready')
        t0 = time.time()
        for f in range(f0, f1):
            t = f / fps
            data = pg.evaluate(f"(()=>{{renderAt({t});return document.getElementById('c').toDataURL('image/jpeg',0.96)}})()")
            ff.stdin.write(base64.b64decode(data.split(',')[1]))
            if (f - f0) % 300 == 0: print(f'[w{idx}] frame {f}/{f1} {time.time()-t0:.0f}s', flush=True)
        b.close()
    ff.stdin.close(); ff.wait()

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--workers', type=int, default=2); ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--start', type=float, default=0); ap.add_argument('--end', type=float, default=DUR); a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    F0, F1 = int(a.start * a.fps), int(round(a.end * a.fps)); n = a.workers
    cuts = [F0 + (F1 - F0) * i // n for i in range(n + 1)]
    ps = [Process(target=worker, args=(i, cuts[i], cuts[i + 1], a.fps)) for i in range(n)]
    [p.start() for p in ps]; [p.join() for p in ps]
    with open(os.path.join(OUT, 'segs.txt'), 'w') as f:
        for i in range(n): f.write(f"file 'seg{i}.mp4'\n")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(OUT, 'segs.txt'), '-c', 'copy', os.path.join(OUT, 'video_only.mp4')], check=True)
    print('done', os.path.join(OUT, 'video_only.mp4'))
