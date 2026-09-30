// Live mode server: serves the repo and runs headless Claude Code wired to the ADBT MCP only.
// POST /api/ask {prompt, platform} streams events (SSE): tool, result, delta, done, error.
// Each run is saved to out/live/<id>.json so it can be replayed (and recorded) without re-asking.
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path'), { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..'), SESS = path.join(ROOT, 'out', 'live');
const PORT = +process.env.PORT || 4173, CLAUDE = process.env.CLAUDE_BIN || 'claude';
const MCP = 'amazon-devices-buildertools-mcp';
const MCP_CONFIG = JSON.stringify({ mcpServers: { [MCP]: { command: 'npx', args: ['-y', `@amazon-devices/${MCP}@latest`] } } });
const PLATFORMS = { vega: ['vega_os'], fireos: ['fire_os'], both: ['vega_os', 'fire_os'] };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.css': 'text/css' };

const system = device => [
  `You answer Fire TV app developer questions using ONLY the ${MCP} tools (ADBT).`,
  'First call set_project_context with {"config":{}}.',
  `The target platform is ${JSON.stringify({ device_os: device })}: pass it as target_platform to list_documents and search_documentation.`,
  'Search the docs, read the most relevant document, then answer concisely (under 150 words) using what ADBT returned.',
  'Plain text with short bullet points and inline `code`; no tables, no headings, no welcome or feedback banners.',
].join(' ');

function ask(res, body) {
  const prompt = String(body.prompt || '').trim().slice(0, 2000), device = PLATFORMS[body.platform] || PLATFORMS.vega;
  if (!prompt) { res.writeHead(400); return res.end('empty prompt'); }
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const id = new Date().toISOString().replace(/[:.]/g, '-'), t0 = Date.now();
  const log = { id, prompt, platform: body.platform || 'vega', events: [] };
  const send = ev => { ev.at = Date.now() - t0; log.events.push(ev); res.write(`data: ${JSON.stringify(ev)}\n\n`); };
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--include-partial-messages',
    '--strict-mcp-config', '--mcp-config', MCP_CONFIG, '--tools', '', '--allowedTools', `mcp__${MCP}`,
    '--append-system-prompt', system(device)];
  if (process.env.LIVE_MODEL) args.push('--model', process.env.LIVE_MODEL);
  const child = spawn(CLAUDE, args, { cwd: os.tmpdir(), stdio: ['ignore', 'pipe', 'pipe'] });
  let buf = '', err = '', finished = false;
  child.stdout.on('data', d => {
    buf += d; let i;
    while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); if (line.trim()) handle(line); }
  });
  child.stderr.on('data', d => { err += d; });
  function handle(line) {
    let d; try { d = JSON.parse(line); } catch { return; }
    if (d.type === 'stream_event' && d.event.type === 'content_block_delta' && d.event.delta.type === 'text_delta') send({ type: 'delta', text: d.event.delta.text });
    else if (d.type === 'assistant') {
      for (const c of d.message.content) if (c.type === 'tool_use') send({ type: 'tool', id: c.id, name: c.name.replace(`mcp__${MCP}__`, ''), input: c.input });
    } else if (d.type === 'user' && Array.isArray(d.message.content)) {
      for (const c of d.message.content) if (c.type === 'tool_result') {
        const text = Array.isArray(c.content) ? c.content.map(x => x.text || '').join('\n') : String(c.content || '');
        send({ type: 'result', id: c.tool_use_id, text: text.slice(0, 20000), isError: !!c.is_error });
      }
    } else if (d.type === 'result') {
      finished = true;
      send(d.is_error ? { type: 'error', text: d.result || d.subtype } : { type: 'done', text: d.result, ms: d.duration_ms });
    }
  }
  child.on('close', code => {
    if (!finished) send({ type: 'error', text: err.trim().split('\n').slice(-3).join(' ') || `claude exited with ${code}` });
    fs.writeFileSync(path.join(SESS, `${id}.json`), JSON.stringify(log, null, 1));
    res.end();
  });
  res.on('close', () => { if (!finished) child.kill(); });
}

function sessions(res, id) {
  if (id) {
    const f = path.join(SESS, path.basename(id) + '.json');
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'application/json' }); return fs.createReadStream(f).pipe(res);
  }
  const list = fs.readdirSync(SESS).filter(f => f.endsWith('.json')).sort().reverse().map(f => {
    const s = JSON.parse(fs.readFileSync(path.join(SESS, f))); return { id: s.id, prompt: s.prompt };
  });
  res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(list));
}

function serveStatic(req, res) {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/live/';
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, path.normalize(p));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}

fs.mkdirSync(SESS, { recursive: true });
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/api/ask') {
    let b = ''; req.on('data', d => { b += d; if (b.length > 1e5) req.destroy(); });
    req.on('end', () => { let body; try { body = JSON.parse(b); } catch { res.writeHead(400); return res.end('bad json'); } ask(res, body); });
  } else if (url.pathname.startsWith('/api/sessions')) sessions(res, url.pathname.split('/')[3]);
  else serveStatic(req, res);
}).listen(PORT, '127.0.0.1', () => console.log(`Live mode: http://localhost:${PORT}/live/`));
