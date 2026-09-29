import base64, os, subprocess, sys, time
from multiprocessing import Process
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); FPS = 30; DUR = 110.0
def worker(i, f0, f1):
    ff = subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','14','-pix_fmt','yuv420p',os.path.join(OUT,f'wseg{i}.mp4')], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width':1920,'height':1080})
        pg.goto('file://' + os.path.join(HERE, 'wide.html')); pg.wait_for_function('window.ready')
        for f in range(f0, f1):
            d = pg.evaluate(f"(()=>{{renderWide({f/FPS});return document.getElementById('w').toDataURL('image/jpeg',0.96)}})()")
            ff.stdin.write(base64.b64decode(d.split(',')[1]))
        b.close()
    ff.stdin.close(); ff.wait()
if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True); os.makedirs(os.path.join(HERE, 'snaps'), exist_ok=True)
    if len(sys.argv) > 1:  # stills
        with sync_playwright() as p:
            b = p.chromium.launch(args=['--allow-file-access-from-files']); pg = b.new_page(viewport={'width':1920,'height':1080})
            pg.goto('file://' + os.path.join(HERE, 'wide.html')); pg.wait_for_function('window.ready')
            for t in sys.argv[1:]:
                d = pg.evaluate(f"(async()=>{{await window.ready;renderWide({t});return document.getElementById('w').toDataURL('image/png')}})()")
                open(os.path.join(HERE,'snaps',f'wide_{t}.png'),'wb').write(base64.b64decode(d.split(',')[1])); print('snaps/wide_'+t+'.png')
            b.close()
        sys.exit()
    n = int(DUR*FPS); cuts = [0, n//2, n]
    ps = [Process(target=worker, args=(i, cuts[i], cuts[i+1])) for i in range(2)]; [q.start() for q in ps]; [q.join() for q in ps]
    open(os.path.join(OUT,'wsegs.txt'),'w').write("file 'wseg0.mp4'\nfile 'wseg1.mp4'\n")
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',os.path.join(OUT,'wsegs.txt'),'-c','copy',os.path.join(OUT,'wide_video.mp4')], check=True); print('done')
