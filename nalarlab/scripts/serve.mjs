// Static file server with SPA fallback, used by `npm run dev` and `npm run preview`.
// Zero dependencies: only Node.js built-ins.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const argValue = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const port = Number(process.env.PORT || argValue('--port', isDev ? 5173 : 4173));
const host = process.env.HOST || argValue('--host', 'localhost');
// In dev, files are served from the project root, with /public mounted at "/".
const roots = isDev
  ? [path.join(ROOT, 'public'), ROOT]
  : [path.resolve(ROOT, argValue('--dir', 'dist'))];

if (!isDev && !fs.existsSync(roots[0])) {
  console.error(`Folder "${roots[0]}" tidak ditemukan. Jalankan "npm run build" terlebih dahulu.`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

// Live reload (dev only): browsers subscribe to /__reload via Server-Sent Events.
const clients = new Set();
if (isDev) {
  let timer = null;
  const notify = () => {
    clearTimeout(timer);
    timer = setTimeout(() => clients.forEach((res) => res.write('data: reload\n\n')), 80);
  };
  for (const dir of ['src', 'public']) {
    try {
      fs.watch(path.join(ROOT, dir), { recursive: true }, notify);
    } catch {
      /* recursive watch unsupported: live reload disabled for this folder */
    }
  }
  try {
    fs.watch(path.join(ROOT, 'index.html'), notify);
  } catch {
    /* ignore */
  }
}

const RELOAD_SNIPPET = `<script>(()=>{try{const s=new EventSource('/__reload');s.onmessage=()=>location.reload();}catch(e){}})();</script>`;

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  for (const base of roots) {
    const target = path.normalize(path.join(base, clean));
    if (!target.startsWith(base)) continue; // path traversal guard
    try {
      const stat = fs.statSync(target);
      if (stat.isFile()) return target;
      if (stat.isDirectory()) {
        const index = path.join(target, 'index.html');
        if (fs.existsSync(index)) return index;
      }
    } catch {
      /* try next root */
    }
  }
  return null;
}

function sendIndex(res) {
  const index = resolveFile('/index.html');
  let body = fs.readFileSync(index, 'utf8');
  if (isDev) body = body.replace('</body>', `${RELOAD_SNIPPET}</body>`);
  res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (isDev && req.url === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 1000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const urlPath = req.url || '/';
  if (urlPath === '/' || urlPath.startsWith('/index.html')) return sendIndex(res);

  const file = resolveFile(urlPath);
  if (file) {
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': isDev ? 'no-cache' : 'public, max-age=0, must-revalidate',
    });
    fs.createReadStream(file).pipe(res);
    return;
  }

  // Unknown asset (has a file extension): real 404.
  if (path.extname(urlPath.split('?')[0])) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
    return;
  }

  // Client-side route: SPA fallback.
  sendIndex(res);
});

server.listen(port, host, () => {
  const mode = isDev ? 'development' : 'preview';
  console.log(`\n  NalarLab (${mode}) berjalan di http://${host}:${port}\n`);
  if (isDev) console.log('  Perubahan file di src/ dan public/ akan memuat ulang halaman otomatis.\n');
});
