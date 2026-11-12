// Small SVG charts. Each chart ships with a visually hidden data table for screen readers.
import { html, raw } from '../core/dom.js';
import { formatNumber } from '../engine/expression.js';

const niceMax = (value) => {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

/**
 * Line chart.
 * series: [{ name, values: number[], className }]
 */
export function lineChart({ labels, series, yMin = 0, yMax = 1, yFormat = (v) => `${Math.round(v * 100)}%`, height = 220, title, desc }) {
  const width = 640;
  const pad = { top: 16, right: 18, bottom: 34, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = Math.max(labels.length, 1);
  const x = (i) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => pad.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));
  const labelEvery = Math.ceil(n / 8);

  const grid = ticks
    .map((t) => `<line class="gridline" x1="${pad.left}" x2="${width - pad.right}" y1="${y(t)}" y2="${y(t)}"/><text x="${pad.left - 8}" y="${y(t) + 4}" text-anchor="end">${yFormat(t)}</text>`)
    .join('');
  const xLabels = labels
    .map((label, i) => (i % labelEvery === 0 || i === n - 1 ? `<text x="${x(i)}" y="${height - 10}" text-anchor="middle">${label}</text>` : ''))
    .join('');
  const lines = series
    .map((s) => {
      const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
      const dots = s.dots === false ? '' : s.values.map((v, i) => `<circle class="dot" cx="${x(i)}" cy="${y(v)}" r="3.5"><title>${s.name}: ${yFormat(v)}</title></circle>`).join('');
      return `<polyline class="series ${s.className || ''}" points="${pts}"/>${dots}`;
    })
    .join('');

  const table = html`<table class="sr-only"><caption>${title}</caption>
    <thead><tr><th scope="col">Titik</th>${series.map((s) => html`<th scope="col">${s.name}</th>`)}</tr></thead>
    <tbody>${labels.map((label, i) => html`<tr><th scope="row">${label}</th>${series.map((s) => html`<td>${yFormat(s.values[i])}</td>`)}</tr>`)}</tbody></table>`;

  return html`<figure style="margin:0">
    ${raw(`<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}${desc ? `. ${desc}` : ''}">
      <line class="axis" x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + innerH}" y2="${pad.top + innerH}"/>
      ${grid}${xLabels}${lines}
    </svg>`)}
    ${table}
  </figure>`;
}

/** Scatter of observations + the student's model line (simulation step). */
export function modelChart({ problem, points, model, label }) {
  const width = 560;
  const height = 230;
  const pad = { top: 14, right: 16, bottom: 34, left: 46 };
  const xs = points.map((p) => p.x);
  const xMax = Math.max(...xs) + (xs[1] - xs[0]);
  const xMin = Math.min(problem.n0, xs[0]);
  const values = [...points.map((p) => p.expected), ...(model ? model.map((m) => m.y) : [])].filter(Number.isFinite);
  const hi = Math.max(...values, 0);
  const lo = Math.min(...values, 0);
  const yMax = niceMax(hi * 1.1);
  const yMin = lo < 0 ? -niceMax(-lo * 1.1) : 0;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const sx = (v) => pad.left + ((v - xMin) / (xMax - xMin || 1)) * innerW;
  const sy = (v) => pad.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  let svg = '';
  for (let t = 0; t <= 4; t += 1) {
    const v = yMin + (t / 4) * (yMax - yMin);
    svg += `<line class="gridline" x1="${pad.left}" x2="${width - pad.right}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${pad.left - 8}" y="${sy(v) + 4}" text-anchor="end">${formatNumber(v)}</text>`;
  }
  svg += `<line class="axis" x1="${pad.left}" x2="${width - pad.right}" y1="${sy(0)}" y2="${sy(0)}"/>`;
  const step = xs[1] - xs[0];
  for (let v = xMin; v <= xMax + 1e-9; v += step) svg += `<text x="${sx(v)}" y="${height - 10}" text-anchor="middle">${formatNumber(v)}</text>`;
  svg += `<text x="${width - pad.right}" y="${sy(0) - 8}" text-anchor="end" style="font-style:italic">${problem.variable}</text>`;
  if (model && model.length > 1) {
    svg += `<polyline class="series series--model" points="${model.map((m) => `${sx(m.x)},${sy(m.y)}`).join(' ')}"/>`;
    svg += model.map((m) => `<circle class="dot dot--model" cx="${sx(m.x)}" cy="${sy(m.y)}" r="3.5"><title>Model: ${formatNumber(m.y)}</title></circle>`).join('');
  }
  svg += points.map((p) => `<circle class="dot dot--data" cx="${sx(p.x)}" cy="${sy(p.expected)}" r="6"><title>Data: ${problem.variable} = ${formatNumber(p.x)}, ${formatNumber(p.expected)}</title></circle>`).join('');

  return html`<figure style="margin:0">
    ${raw(`<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">${svg}</svg>`)}
    <div class="legend"><span><i class="dot"></i>Data dari situasi</span><span><i class="model"></i>Hasil modelmu</span></div>
  </figure>`;
}

/** Horizontal bars as HTML (easier to make responsive than SVG). */
export function hBars(items, { max, format = (v) => v } = {}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return html`<div class="hbars">${items.map(
    (item) => html`<div class="hbar">
      <span>${item.label}</span>
      <span class="hbar__track" role="presentation"><span class="hbar__fill" style="width:${Math.round((item.value / top) * 100)}%;${item.color ? `background:${item.color}` : ''}"></span></span>
      <span class="hbar__val">${format(item.value)}</span>
    </div>`,
  )}</div>`;
}

/** Circular score ring. */
export function scoreRing(percent, label) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, percent)) / 100) * c;
  return raw(`<svg class="score-ring" viewBox="0 0 108 108" role="img" aria-label="${label}: ${percent}%">
    <circle cx="54" cy="54" r="${r}" fill="none" stroke="#e7eeeb" stroke-width="9"/>
    <circle cx="54" cy="54" r="${r}" fill="none" stroke="#15233d" stroke-width="9" stroke-linecap="round" stroke-dasharray="${filled} ${c}" transform="rotate(-90 54 54)"/>
    <text x="54" y="60" text-anchor="middle" style="font-family:var(--font-display);font-size:28px;fill:#15233d">${percent}</text>
  </svg>`);
}

export function masteryMeter(skillName, p, { level, sub } = {}) {
  const pct = Math.round(p * 100);
  return html`<div class="meter">
    <div class="meter__top"><span>${skillName}${sub ? html` <span class="subtle">${sub}</span>` : ''}</span><span class="tnum" style="font-weight:600">${pct}%</span></div>
    <div class="meter__track" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Penguasaan ${skillName}">
      <span class="meter__fill meter__fill--${level?.id || 'berkembang'}" style="width:${pct}%"></span><span class="meter__ticks"></span>
    </div>
  </div>`;
}
