// Illustrations generated from each mission's numbers (never hard-coded pictures).
import { raw } from '../core/dom.js';
import { evaluateRule } from '../data/curriculum.js';
import { formatNumber } from '../engine/expression.js';

const INK = '#15233d';
const MODEL = '#0f6e6a';
const HL = '#e3f25c';
const AQUA = '#9fe4dd';

/** n squares in a row made of matchsticks. `fresh` marks sticks added by the last step. */
export function matchsticksSvg(n, { unit = 34, fresh = 0, showCount = false } = {}) {
  const w = n * unit + 20;
  const h = unit + 30;
  const sticks = [];
  const stick = (x1, y1, x2, y2, isNew) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const hx = x2 + ((x2 - x1) / len) * 0.1;
    const hy = y2 + ((y2 - y1) / len) * 0.1;
    sticks.push(`<g class="stick${isNew ? ' is-new' : ''}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isNew ? MODEL : '#c9a36b'}" stroke-width="4" stroke-linecap="round"/><circle cx="${hx}" cy="${hy}" r="3.6" fill="#b8293f"/></g>`);
  };
  const ox = 10;
  const oy = 10;
  // first vertical
  stick(ox, oy + unit - 3, ox, oy + 3, n === 1 && fresh);
  for (let i = 0; i < n; i += 1) {
    const x = ox + i * unit;
    const isNew = fresh && i === n - 1;
    stick(x + 3, oy, x + unit - 3, oy, isNew);
    stick(x + 3, oy + unit, x + unit - 3, oy + unit, isNew);
    stick(x + unit, oy + unit - 3, x + unit, oy + 3, isNew);
  }
  const label = showCount ? `<text x="${w / 2}" y="${h - 2}" text-anchor="middle" font-size="12" fill="${INK}" font-family="Inter, sans-serif">${n} persegi = ${3 * n + 1} batang</text>` : '';
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${n} persegi berjejer dari ${3 * n + 1} batang korek">${sticks.join('')}${label}</svg>`;
}

function rowsSvg(problem) {
  const rows = problem.observations.map((x) => ({ x, y: evaluateRule(problem, x) }));
  const max = Math.max(...rows.map((r) => r.y));
  const dot = 9;
  const gap = 4;
  const width = max * (dot + gap) + 120;
  const rowH = 22;
  const height = rows.length * rowH + 12;
  let out = '';
  rows.forEach((row, i) => {
    const y = 8 + i * rowH;
    out += `<text x="0" y="${y + 9}" font-size="12" fill="#46546f" font-family="Inter, sans-serif">Baris ${row.x}</text>`;
    const start = 62 + ((max - row.y) * (dot + gap)) / 2;
    for (let k = 0; k < row.y; k += 1) {
      const isNew = i > 0 && k >= rows[i - 1].y - (i === 0 ? 0 : 0) && k >= row.y - problem.step;
      out += `<rect x="${start + k * (dot + gap)}" y="${y}" width="${dot}" height="${dot}" rx="2" fill="${isNew ? MODEL : INK}" opacity="${isNew ? 1 : 0.85}"/>`;
    }
    out += `<text x="${width - 4}" y="${y + 9}" text-anchor="end" font-size="13" fill="${INK}" font-family="LM Roman Text, serif">${row.y}</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Susunan kursi: ${rows.map((r) => `baris ${r.x} berisi ${r.y}`).join(', ')}">${out}</svg>`;
}

function glassesSvg(problem) {
  const [x1] = problem.observations;
  const y1 = evaluateRule(problem, x1);
  let out = '';
  for (let i = 0; i < x1; i += 1) {
    const x = 20 + i * 62;
    out += `<path d="M${x} 18 h40 l-5 58 a4 4 0 0 1 -4 3.5 h-22 a4 4 0 0 1 -4 -3.5 z" fill="#fff" stroke="${INK}" stroke-width="2"/>`;
    out += `<path d="M${x + 4} 40 h32 l-3.2 35 a3 3 0 0 1 -3 2.5 h-20.6 a3 3 0 0 1 -3 -2.5 z" fill="#c98a1a" opacity=".55"/>`;
  }
  const bx = 20 + x1 * 62 + 24;
  out += `<text x="${bx}" y="46" font-size="15" fill="${INK}" font-family="LM Roman Text, serif">${x1} gelas</text>`;
  out += `<text x="${bx}" y="70" font-size="15" fill="${INK}" font-family="LM Roman Text, serif">${formatNumber(y1)} gram gula</text>`;
  return `<svg viewBox="0 0 ${bx + 150} 90" role="img" aria-label="${x1} gelas es teh memakai ${formatNumber(y1)} gram gula">${out}</svg>`;
}

function barsSvg(problem) {
  const rows = [{ x: problem.n0, y: problem.start }, ...problem.observations.map((x) => ({ x, y: evaluateRule(problem, x) }))].filter(
    (row, i, arr) => arr.findIndex((r) => r.x === row.x) === i,
  );
  const list = problem.n0 === 0 && problem.observations[0] !== 0 && problem.start === 0 ? rows.slice(1) : rows;
  const max = Math.max(...list.map((r) => Math.abs(r.y)), 1);
  const bw = 42;
  const gap = 18;
  const h = 120;
  const width = list.length * (bw + gap) + 10;
  let out = '';
  list.forEach((row, i) => {
    const bh = Math.max(2, (Math.abs(row.y) / max) * (h - 30));
    const x = 10 + i * (bw + gap);
    const isStart = row.x === problem.n0 && problem.start !== 0;
    out += `<rect x="${x}" y="${h - bh}" width="${bw}" height="${bh}" rx="4" fill="${isStart ? AQUA : INK}" ${isStart ? `stroke="${INK}" stroke-width="1.5"` : ''}/>`;
    out += `<text x="${x + bw / 2}" y="${h - bh - 6}" text-anchor="middle" font-size="13" fill="${INK}" font-family="LM Roman Text, serif">${formatNumber(row.y)}</text>`;
    out += `<text x="${x + bw / 2}" y="${h + 16}" text-anchor="middle" font-size="11" fill="#46546f" font-family="Inter, sans-serif">${problem.variable} = ${formatNumber(row.x)}</text>`;
  });
  return `<svg viewBox="0 0 ${width} ${h + 22}" role="img" aria-label="Nilai ${problem.outputSymbol} untuk beberapa nilai ${problem.variable}: ${list.map((r) => `${formatNumber(r.x)} menghasilkan ${formatNumber(r.y)}`).join(', ')}">${out}</svg>`;
}

export function problemVisual(problem) {
  if (problem.visual === 'rows') return raw(rowsSvg(problem));
  if (problem.visual === 'matchsticks') {
    return raw(`<div style="display:flex;gap:1.25rem;align-items:flex-end;flex-wrap:wrap">${[1, 2, 3]
      .map((n) => `<div style="width:${n * 40 + 30}px">${matchsticksSvg(n, { unit: 32, showCount: true })}</div>`)
      .join('')}</div>`);
  }
  if (problem.visual === 'glasses') return raw(glassesSvg(problem));
  return raw(barsSvg(problem));
}

export { HL };
