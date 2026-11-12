import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, evaluate, compile, FormulaError, linearText, parseNumber, formatNumber, astToHtml } from '../src/engine/expression.js';
import { runModel, correctModel, modelCoefficients } from '../src/engine/model.js';
import { diagnoseFormula, diagnoseModel, checkPattern, checkFinal } from '../src/engine/diagnose.js';
import { bktUpdate, computeMastery, recommendNext, topicProgress, scoreAttempt } from '../src/engine/learning.js';
import { problemById } from '../src/data/curriculum.js';

const kursi = problemById('kursi-aula');
const kuota = problemById('kuota');
const esTeh = problemById('es-teh');
const ojek = problemById('ojek');

test('parser handles implicit multiplication, decimal comma and unicode operators', () => {
  assert.equal(evaluate(parse('4n + 8', 'n'), 20), 88);
  assert.equal(evaluate(parse('12 + 4(n − 1)', 'n'), 20), 88);
  assert.equal(evaluate(parse('K = 4×n+8', 'n'), 2), 16);
  assert.equal(evaluate(parse('30 - 1,5x', 'x'), 12), 12);
  assert.equal(evaluate(parse('(n+1)(n-1)', 'n'), 3), 8);
  assert.equal(evaluate(parse('-n + 2', 'n'), 5), -3);
  assert.equal(evaluate(parse('n^2', 'n'), 4), 16);
});

test('parser reports friendly errors', () => {
  assert.throws(() => parse('', 'n'), FormulaError);
  assert.throws(() => parse('4m + 8', 'n'), /Huruf "m"/);
  assert.throws(() => parse('4(n + 8', 'n'), /belum ditutup/);
  assert.throws(() => parse('4n +', 'n'), /berakhir/);
  assert.throws(() => parse('4n $ 2', 'n'), /tidak bisa dipakai/);
  assert.throws(() => parse('n4', 'n'), FormulaError);
});

test('formatting uses Indonesian conventions', () => {
  assert.equal(formatNumber(2.5), '2,5');
  assert.equal(formatNumber(-1.5), '−1,5');
  assert.equal(linearText(4, 8, 'n'), '4n + 8');
  assert.equal(linearText(-1.5, 30, 'x'), '30 − 1,5x');
  assert.equal(linearText(15, 0, 'x'), '15x');
  assert.equal(linearText(1, -2, 'n'), 'n − 2');
  assert.match(astToHtml(compile('4(n-1)', 'n').ast, 'n'), /<span class="mn">4<\/span>\(<var>n<\/var> − <span class="mn">1<\/span>\)/);
});

test('parseNumber accepts typical student input', () => {
  assert.equal(parseNumber('7,5'), 7.5);
  assert.equal(parseNumber('7.5'), 7.5);
  assert.equal(parseNumber('1.500'), 1500);
  assert.equal(parseNumber('−3'), -3);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
});

test('model runs like a loop and matches the rule when correct', () => {
  for (const problem of [kursi, kuota, esTeh, ojek]) {
    const model = correctModel(problem);
    for (const x of problem.observations) {
      assert.equal(runModel(model, x).value, problem.start + problem.step * (x - problem.n0));
    }
    const { m, c } = modelCoefficients(model);
    assert.equal(m, problem.step);
    assert.equal(c, problem.start - problem.step * problem.n0);
  }
  assert.equal(runModel(correctModel(kursi), 3).times, 2);
});

test('model diagnosis names off-by-one and sign errors', () => {
  const offByOne = { ...correctModel(kursi), repeat: 'v' };
  const result = diagnoseModel(kursi, offByOne);
  assert.equal(result.pass, false);
  assert.equal(result.bug, 'off-by-one');
  assert.match(result.message, /modelmu menghasilkan 16/);

  const sign = { ...correctModel(kuota), op: '+' };
  assert.equal(diagnoseModel(kuota, sign).bug, 'tanda');
  assert.equal(diagnoseModel(kursi, correctModel(kursi)).pass, true);
});

test('formula diagnosis covers the misconception library', () => {
  assert.equal(diagnoseFormula(kursi, '4n+8').status, 'correct');
  assert.equal(diagnoseFormula(kursi, '12 + 4(n-1)').status, 'correct');
  assert.equal(diagnoseFormula(kursi, '12 + 4n').bug, 'off-by-one');
  assert.equal(diagnoseFormula(problemById('korek-api'), '3n').bug, 'konstanta-hilang');
  assert.equal(diagnoseFormula(ojek, '6x + 2,5').bug, 'tertukar');
  assert.equal(diagnoseFormula(kuota, '30 + 1,5x').bug, 'tanda');
  assert.equal(diagnoseFormula(esTeh, 'x + 42').bug, 'aditif');
  assert.equal(diagnoseFormula(kursi, 'n^2 + 11').bug, 'bukan-linear');
  assert.equal(diagnoseFormula(kursi, '5n + 7').bug, null);
  assert.equal(diagnoseFormula(kursi, '4n + 8)').status, 'invalid');
  assert.equal(diagnoseFormula(kursi, '1/(n-2)').status, 'invalid');
});

test('pattern check explains wrong rates', () => {
  assert.equal(checkPattern(kursi, [4, 4, 4], 4).ok, true);
  assert.equal(checkPattern(kuota, [-1.5, -1.5, -1.5], 1.5).bug, 'tanda');
  const peta = problemById('peta');
  const r = checkPattern(peta, [5, 5, 5], 5);
  assert.equal(r.ok, false);
  assert.equal(r.bug, 'beda-salah');
  assert.equal(checkPattern(peta, [5, 5, 5], 2.5).ok, true);
});

test('final answers: forward and inverse questions', () => {
  assert.equal(checkFinal(kursi, 88).ok, true);
  assert.equal(checkFinal(kursi, 92).ok, false);
  assert.equal(checkFinal(problemById('sepeda'), 7.5).ok, true);
  assert.match(checkFinal(problemById('sepeda'), 1080).message, /variabel/);
});

test('BKT increases with correct answers and decreases with errors', () => {
  assert.ok(bktUpdate(0.3, true) > 0.3);
  assert.ok(bktUpdate(0.8, false) < 0.8);
  const attempt = (problemId, ok, t) => ({ problemId, finishedAt: t, skills: { model: { firstTry: ok } }, bugs: [] });
  const mastery = computeMastery([attempt('kursi-aula', true, 1), attempt('korek-api', true, 2)]);
  assert.equal(mastery.history.length, 2);
  assert.ok(mastery.current.model > mastery.history[0].values.model - 1e-9);
});

test('unlocking and recommendation', () => {
  assert.equal(topicProgress([])[1].unlocked, false);
  const two = [{ problemId: 'kursi-aula', finishedAt: 1, bugs: [], score: 80 }, { problemId: 'korek-api', finishedAt: 2, bugs: [], score: 80 }];
  assert.equal(topicProgress(two)[1].unlocked, true);
  assert.equal(recommendNext([]).problem.id, 'kursi-aula');
  const withBugs = [
    { problemId: 'kursi-aula', finishedAt: 1, bugs: ['off-by-one'], score: 40 },
    { problemId: 'korek-api', finishedAt: 2, bugs: ['off-by-one'], score: 60 },
  ];
  const rec = recommendNext(withBugs);
  assert.equal(rec.reason, 'misconception');
  assert.equal(rec.problem.id, 'tabungan');
  assert.equal(scoreAttempt({ a: { firstTry: true }, b: { firstTry: false } }), 50);
});
