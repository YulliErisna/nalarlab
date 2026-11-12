// Turns a wrong model or formula into a specific, explainable diagnosis.
// Diagnosis never reveals the final answer: it names the pattern and gives a counterexample.

import { evaluateRule, ruleCoefficients } from '../data/curriculum.js';
import { formatNumber, compile, FormulaError } from './expression.js';
import { runModel, modelCoefficients, correctModel } from './model.js';

const EPS = 1e-6;
const same = (a, b) => Math.abs(a - b) < EPS;
const f = formatNumber;

/** Observation table rows for a mission: [{x, y}] */
export function observationRows(problem) {
  return problem.observations.map((x) => ({ x, y: evaluateRule(problem, x) }));
}

/** Check the "change per step" table filled by the student. */
export function checkPattern(problem, diffs, rate) {
  const rows = observationRows(problem);
  const expectedDiffs = rows.slice(1).map((row, i) => row.y - rows[i].y);
  const diffResults = expectedDiffs.map((expected, i) => ({ expected, given: diffs[i], ok: Number.isFinite(diffs[i]) && same(diffs[i], expected) }));
  const rateOk = Number.isFinite(rate) && same(rate, problem.step);
  const xStep = rows[1].x - rows[0].x;
  let message = '';
  let bug = null;
  const firstBad = diffResults.findIndex((r) => !r.ok);
  if (firstBad !== -1) {
    const a = rows[firstBad];
    const b = rows[firstBad + 1];
    message = `Periksa selisih antara ${f(a.y)} dan ${f(b.y)}. Hitung nilai kanan dikurangi nilai kiri${expectedDiffs[firstBad] < 0 ? ', hasilnya boleh negatif' : ''}.`;
  } else if (!rateOk) {
    if (Number.isFinite(rate) && same(rate, -problem.step)) {
      bug = 'tanda';
      message = 'Besarnya sudah tepat, tetapi arahnya terbalik. Apakah nilainya naik atau turun?';
    } else if (xStep !== 1 && Number.isFinite(rate) && same(rate, expectedDiffs[0])) {
      bug = 'beda-salah';
      message = `Selisih ${f(expectedDiffs[0])} terjadi ketika ${problem.variable} naik ${f(xStep)}, bukan 1. Berapa perubahan untuk kenaikan 1 saja?`;
    } else {
      bug = 'beda-salah';
      message = `Laju perubahan adalah perubahan nilai ketika ${problem.variable} naik tepat 1.`;
    }
  }
  return { ok: firstBad === -1 && rateOk, diffResults, rateOk, message, bug, expectedDiffs, xStep };
}

/** Run the model against every observation and diagnose mismatches. */
export function diagnoseModel(problem, model) {
  const rows = observationRows(problem);
  const tests = rows.map((row) => {
    const got = runModel(model, row.x).value;
    return { x: row.x, expected: row.y, got, ok: same(got, row.y) };
  });
  const pass = tests.every((t) => t.ok);
  if (pass) return { pass, tests, bug: null, message: 'Semua uji cocok dengan data. Modelmu menghasilkan nilai yang sama seperti situasi nyata.' };

  const target = correctModel(problem);
  const counter = tests.find((t) => !t.ok);
  const v = problem.variable;
  const counterText = `Untuk ${v} = ${f(counter.x)}, modelmu menghasilkan ${f(counter.got)}, padahal data menunjukkan ${f(counter.expected)}.`;
  const startOk = same(model.start, target.start);
  const opOk = model.op === target.op;
  const amountOk = same(model.amount, target.amount);
  const repeatOk = model.repeat === target.repeat;

  let bug = null;
  let detail = '';
  if (startOk && amountOk && !opOk && repeatOk) {
    bug = 'tanda';
    detail = 'Perhatikan arah perubahannya: apakah nilainya bertambah atau berkurang setiap langkah?';
  } else if (startOk && amountOk && opOk && !repeatOk) {
    bug = 'off-by-one';
    const firstX = rows[0].x;
    const loops = runModel(model, firstX).times;
    detail = `Jalankan langkah demi langkah untuk ${v} = ${f(firstX)}: perulanganmu berjalan ${loops} kali. Berapa kali seharusnya perubahan terjadi?`;
  } else if (startOk && repeatOk && opOk && !amountOk) {
    bug = 'beda-salah';
    detail = 'Bandingkan besar perubahan di dalam perulangan dengan laju yang kamu temukan pada tabel pola.';
  } else if (!startOk && amountOk && opOk && repeatOk) {
    bug = 'konstanta-salah';
    detail = `Nilai awal model dipakai saat perulangan belum berjalan. Nilai apa yang benar ketika belum ada perubahan?`;
  } else if (!startOk && amountOk && opOk && !repeatOk) {
    // Compensating errors that still miss the data are most often a step-counting confusion.
    const { m, c } = modelCoefficients(model);
    const truth = ruleCoefficients(problem);
    bug = same(m, truth.m) && !same(c, truth.c) ? 'off-by-one' : 'konstanta-salah';
    detail = 'Nilai awal dan banyak perulangan saling berkaitan. Tentukan dulu nilai pada langkah pertama, lalu hitung banyak perubahan sesudahnya.';
  } else {
    detail = 'Lebih dari satu bagian model belum sesuai. Periksa satu blok dulu, mulai dari nilai awal.';
  }
  return { pass, tests, bug, message: `${counterText} ${detail}`, counter };
}

/**
 * Compare a student formula with the mission rule.
 * Returns { status: 'correct' | 'wrong' | 'invalid', bug, message, m, c }
 */
export function diagnoseFormula(problem, input) {
  let fn;
  try {
    ({ fn } = compile(input, problem.variable));
  } catch (error) {
    if (error instanceof FormulaError) return { status: 'invalid', bug: null, message: error.message };
    throw error;
  }
  const points = [0, 1, 2, 3, 5, 7, 11];
  const values = points.map((p) => fn(p));
  if (values.some((value) => !Number.isFinite(value))) {
    return { status: 'invalid', bug: null, message: 'Rumus ini menghasilkan pembagian dengan nol untuk sebagian nilai. Periksa kembali bentuknya.' };
  }
  const truth = ruleCoefficients(problem);
  const expected = points.map((p) => truth.m * p + truth.c);
  if (values.every((value, i) => same(value, expected[i]))) {
    return { status: 'correct', bug: null, message: 'Rumusmu setara dengan model. Bentuk lain yang setara juga diterima.', m: truth.m, c: truth.c };
  }

  const c = values[0];
  const m = values[1] - values[0];
  const linear = points.every((p, i) => Math.abs(values[i] - (m * p + c)) < 1e-6);
  const v = problem.variable;
  const firstX = problem.observations[0];
  const at = (x) => fn(x);
  const counter = `Untuk ${v} = ${f(firstX)}, rumusmu menghasilkan ${f(at(firstX))}, padahal seharusnya ${f(evaluateRule(problem, firstX))}.`;

  if (!linear) {
    return { status: 'wrong', bug: 'bukan-linear', m: NaN, c: NaN, message: `${counter} Selisih hasil rumusmu tidak selalu sama, padahal pola ini bertambah tetap.` };
  }

  let bug = 'lainnya';
  let hint = 'Bandingkan rumusmu dengan blok model: nilai awal, perubahan, dan banyak perulangan.';
  if (same(m, truth.m) && (same(c, truth.c + truth.m) || same(c, truth.c - truth.m))) {
    bug = 'off-by-one';
    hint = problem.n0 === 1 ? `Pada ${v} = 1 belum ada perubahan. Banyak perubahannya ${v} − 1, bukan ${v}.` : `Saat ${v} = 0, belum ada perubahan sama sekali. Banyak perubahannya tepat ${v} kali.`;
  } else if (same(m, truth.m) && same(c, 0) && !same(truth.c, 0)) {
    bug = 'konstanta-hilang';
    hint = 'Laju perubahannya sudah benar. Bagian yang selalu ada sejak awal belum masuk ke rumus.';
  } else if (same(m, truth.c) && same(c, truth.m) && !same(truth.c, truth.m)) {
    bug = 'tertukar';
    hint = `Angka yang dikalikan dengan ${v} seharusnya adalah perubahan untuk setiap kenaikan 1, bukan nilai awal.`;
  } else if (same(m, -truth.m) && same(c, truth.c)) {
    bug = 'tanda';
    hint = 'Besar perubahannya sudah benar, tetapi arahnya terbalik.';
  } else if (same(truth.c, 0) && same(m, 1) && !same(truth.m, 1)) {
    bug = 'aditif';
    hint = `Uji pada data lain: jika ${v} menjadi dua kali lipat, apakah hasilnya ikut dua kali lipat?`;
  } else if (same(c, truth.c) && !same(m, truth.m)) {
    bug = 'beda-salah';
    hint = `Nilai awalnya sudah tepat. Periksa lagi besar perubahan untuk setiap kenaikan 1 pada ${v}.`;
  } else if (same(m, truth.m) && !same(c, truth.c)) {
    bug = 'konstanta-salah';
    hint = `Laju perubahannya sudah benar. Periksa nilai saat ${v} = 0.`;
  }
  return { status: 'wrong', bug: bug === 'lainnya' ? null : bug, m, c, message: `${counter} ${hint}` };
}

/** Check the final numeric answer, with a tolerance for rounding. */
export function checkFinal(problem, value) {
  if (!Number.isFinite(value)) return { ok: false, message: 'Masukkan jawaban berupa angka.' };
  const ok = Math.abs(value - problem.final.answer) < 1e-6;
  if (ok) return { ok, message: 'Jawaban tepat.' };
  const { m, c } = ruleCoefficients(problem);
  if (problem.final.direction === 'inverse') {
    const forward = m * problem.final.target + c;
    if (same(value, forward)) {
      return { ok, message: 'Kamu memasukkan nilai yang diketahui sebagai variabel. Di soal ini, hasil rumusnya yang diketahui. Cari nilai variabel yang membuat rumus sama dengan nilai itu.' };
    }
    return { ok, message: 'Susun persamaan: rumusmu = nilai yang diketahui, lalu selesaikan untuk variabelnya.' };
  }
  return { ok, message: `Masukkan ${problem.variable} = ${f(problem.final.at)} ke rumusmu dan hitung dengan teliti.` };
}
