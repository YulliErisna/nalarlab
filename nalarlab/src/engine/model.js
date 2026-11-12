// The block model students build:
//   nilai ← start
//   ulangi R(v) kali:  nilai ← nilai (+|−) amount
//   hasil ← nilai
// R(v) is one of v, v − 1, v + 1.

import { formatNumber } from './expression.js';

export const REPEAT_OPTIONS = [
  { id: 'v-1', label: (v) => `${v} − 1`, count: (x) => x - 1 },
  { id: 'v', label: (v) => `${v}`, count: (x) => x },
  { id: 'v+1', label: (v) => `${v} + 1`, count: (x) => x + 1 },
];

export const emptyModel = () => ({ start: '', op: '+', amount: '', repeat: 'v' });

export function isModelComplete(model) {
  return Number.isFinite(model.start) && Number.isFinite(model.amount) && Boolean(model.repeat) && (model.op === '+' || model.op === '-');
}

export function repeatCount(model, x) {
  const option = REPEAT_OPTIONS.find((o) => o.id === model.repeat) || REPEAT_OPTIONS[1];
  return option.count(x);
}

/** Execute the model like a program and keep a trace of each loop iteration. */
export function runModel(model, x, { maxTrace = 60 } = {}) {
  const times = Math.max(0, Math.floor(repeatCount(model, x) + 1e-9));
  const delta = model.op === '-' ? -model.amount : model.amount;
  let value = model.start;
  const trace = [];
  for (let i = 1; i <= times; i += 1) {
    const before = value;
    value = Math.round((value + delta) * 1e9) / 1e9;
    if (trace.length < maxTrace) trace.push({ i, before, after: value });
  }
  return { value, times, trace, truncated: times > maxTrace };
}

/** Slope/intercept equivalent of the model (valid while the loop count is non-negative). */
export function modelCoefficients(model) {
  const delta = model.op === '-' ? -model.amount : model.amount;
  const shift = model.repeat === 'v-1' ? -1 : model.repeat === 'v+1' ? 1 : 0;
  return { m: delta, c: model.start + delta * shift };
}

/** The program as readable JavaScript (shown in the "Lihat kode" panel). */
export function modelToCode(model, problem) {
  const v = problem.variable;
  const fn = problem.outputSymbol;
  const start = Number.isFinite(model.start) ? String(model.start) : '?';
  const amount = Number.isFinite(model.amount) ? String(model.amount) : '?';
  const bound = model.repeat === 'v-1' ? `${v} - 1` : model.repeat === 'v+1' ? `${v} + 1` : v;
  return [
    `function ${fn}(${v}) {`,
    `  let nilai = ${start};`,
    `  for (let i = 1; i <= ${bound}; i++) {`,
    `    nilai = nilai ${model.op === '-' ? '-' : '+'} ${amount};`,
    `  }`,
    `  return nilai;`,
    `}`,
  ].join('\n');
}

export function describeModel(model, problem) {
  const v = problem.variable;
  const option = REPEAT_OPTIONS.find((o) => o.id === model.repeat) || REPEAT_OPTIONS[1];
  return `Mulai dari ${formatNumber(model.start)}, ulangi ${option.label(v)} kali: ${model.op === '-' ? 'kurangi' : 'tambah'} ${formatNumber(model.amount)}.`;
}

/** The model that matches a mission exactly (used for hints and teacher answer keys). */
export function correctModel(problem) {
  return {
    start: problem.start,
    op: problem.step < 0 ? '-' : '+',
    amount: Math.abs(problem.step),
    repeat: problem.n0 === 1 ? 'v-1' : 'v',
  };
}
