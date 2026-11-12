// Guards the mathematical correctness of every mission.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROBLEMS, TOPICS, SKILLS, evaluateRule } from '../src/data/curriculum.js';
import { MISCONCEPTIONS } from '../src/data/misconceptions.js';
import { diagnoseFormula, checkFinal } from '../src/engine/diagnose.js';
import { correctModel, runModel } from '../src/engine/model.js';
import { linearText } from '../src/engine/expression.js';
import { simulateClass } from '../src/data/classSim.js';
import { rakaAttempts } from '../src/data/seed.js';

test('every mission is internally consistent', () => {
  const ids = new Set();
  for (const p of PROBLEMS) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
    assert.ok(TOPICS.some((t) => t.id === p.topic), `${p.id}: topic`);
    assert.ok([0, 1].includes(p.n0), `${p.id}: n0`);
    assert.equal(p.observations.length, 4, `${p.id}: four observations`);
    const gaps = p.observations.slice(1).map((x, i) => x - p.observations[i]);
    assert.ok(gaps.every((g) => g === gaps[0]), `${p.id}: evenly spaced observations`);
    assert.ok(p.observations[0] >= p.n0, `${p.id}: observations start at or after n0`);
    assert.equal(p.facts.filter((f) => f.relevant).length >= 2, true, `${p.id}: relevant facts`);
    assert.equal(p.askOptions.filter((o) => o.correct).length, 1, `${p.id}: one ask answer`);
    assert.equal(p.reflection.options.filter((o) => o.correct).length, 1, `${p.id}: one reflection answer`);
    p.targets.forEach((t) => assert.ok(MISCONCEPTIONS.some((m) => m.id === t), `${p.id}: target ${t}`));

    // The canonical formula is accepted by the diagnosis engine.
    const m = p.step;
    const c = p.start - p.step * p.n0;
    assert.equal(diagnoseFormula(p, linearText(m, c, p.variable)).status, 'correct', `${p.id}: canonical formula`);

    // The final answer matches the rule.
    if (p.final.direction === 'forward') {
      assert.equal(evaluateRule(p, p.final.at), p.final.answer, `${p.id}: forward answer`);
    } else {
      assert.ok(Math.abs(evaluateRule(p, p.final.answer) - p.final.target) < 1e-9, `${p.id}: inverse answer`);
    }
    assert.equal(checkFinal(p, p.final.answer).ok, true);

    // The correct block model reproduces every observation.
    for (const x of p.observations) assert.ok(Math.abs(runModel(correctModel(p), x).value - evaluateRule(p, x)) < 1e-9);
  }
});

test('simulated class is deterministic and uses known ids', () => {
  const a = simulateClass(1_800_000_000_000);
  const b = simulateClass(1_800_000_000_000);
  assert.deepEqual(a, b);
  assert.equal(a.length, 24);
  for (const student of a) {
    for (const attempt of student.attempts) {
      assert.ok(PROBLEMS.some((p) => p.id === attempt.problemId));
      Object.keys(attempt.skills).forEach((s) => assert.ok(SKILLS.some((k) => k.id === s)));
      attempt.bugs.forEach((bug) => assert.ok(MISCONCEPTIONS.some((m) => m.id === bug), bug));
    }
  }
});

test('seeded demo history references valid content', () => {
  for (const attempt of rakaAttempts(Date.now())) {
    assert.ok(PROBLEMS.some((p) => p.id === attempt.problemId));
    attempt.bugs.forEach((bug) => assert.ok(MISCONCEPTIONS.some((m) => m.id === bug)));
  }
});
