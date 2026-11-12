// Production build: validates every module, then copies the app into dist/.
// Zero dependencies: only Node.js built-ins.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const errors = [];
const started = Date.now();

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const rel = (p) => path.relative(ROOT, p);

// 1. Syntax check every JavaScript module.
const jsFiles = walk(SRC).filter((f) => f.endsWith('.js'));
for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`Syntax error in ${rel(file)}:\n${result.stderr.trim()}`);
}

// 2. Verify that every relative import resolves to an existing file.
const importPattern = /(?:import|export)\s[^'"]*?from\s*['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)|import\s*['"](\.[^'"]+)['"]/g;
for (const file of jsFiles) {
  const code = fs.readFileSync(file, 'utf8');
  for (const match of code.matchAll(importPattern)) {
    const spec = match[1] || match[2] || match[3];
    const target = path.resolve(path.dirname(file), spec);
    if (!fs.existsSync(target)) errors.push(`Unresolved import "${spec}" in ${rel(file)}`);
  }
}

// 3. Verify assets referenced from CSS exist (url(/...)).
const cssFiles = walk(SRC).filter((f) => f.endsWith('.css'));
for (const file of cssFiles) {
  const css = fs.readFileSync(file, 'utf8');
  for (const match of css.matchAll(/url\(\s*['"]?(\/[^'")]+)['"]?\s*\)/g)) {
    if (!fs.existsSync(path.join(PUBLIC, match[1]))) errors.push(`Missing asset "${match[1]}" in ${rel(file)}`);
  }
  for (const match of css.matchAll(/@import\s+['"](\.[^'"]+)['"]/g)) {
    if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) {
      errors.push(`Unresolved @import "${match[1]}" in ${rel(file)}`);
    }
  }
}

if (errors.length) {
  console.error(`\nBuild gagal (${errors.length} masalah):\n`);
  errors.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}

// 4. Copy files to dist/.
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.cpSync(PUBLIC, DIST, { recursive: true });
fs.cpSync(SRC, path.join(DIST, 'src'), { recursive: true });

// 5. Cache-bust the entry points referenced from index.html.
const hash = crypto.createHash('sha256');
for (const file of [...jsFiles, ...cssFiles].sort()) hash.update(fs.readFileSync(file));
const version = hash.digest('hex').slice(0, 10);
let indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
indexHtml = indexHtml
  .replace('/src/main.js"', `/src/main.js?v=${version}"`)
  .replace('/src/styles/app.css"', `/src/styles/app.css?v=${version}"`);
fs.writeFileSync(path.join(DIST, 'index.html'), indexHtml);
// Netlify fallback for client-side routes (Vercel uses vercel.json).
fs.writeFileSync(path.join(DIST, '_redirects'), '/*    /index.html    200\n');

const files = walk(DIST);
const size = files.reduce((sum, f) => sum + fs.statSync(f).size, 0);
console.log(`\n  Build selesai dalam ${Date.now() - started} ms`);
console.log(`  ${jsFiles.length} modul JavaScript diperiksa, ${files.length} file ditulis ke dist/ (${(size / 1024).toFixed(0)} KB)`);
console.log(`  Versi aset: ${version}\n`);
