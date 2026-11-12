// The NalarLab mission workspace: six steps from story to formula.
import { html, toString, on, raw, prefersReducedMotion } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { toast, confirmDialog } from '../../ui/feedback.js';
import { getAttempts, addAttempt, getLabState, saveLabState, clearLabState } from '../../core/progress.js';
import { problemById, topicById, SKILLS, ruleCoefficients } from '../../data/curriculum.js';
import { misconceptionById } from '../../data/misconceptions.js';
import { parseNumber, formatNumber, linearHtml } from '../../engine/expression.js';
import { emptyModel, isModelComplete, runModel, describeModel } from '../../engine/model.js';
import { checkPattern, diagnoseModel, diagnoseFormula, checkFinal } from '../../engine/diagnose.js';
import { isProblemUnlocked, computeMastery, scoreAttempt, recommendNext, formatDuration, masteryLevel } from '../../engine/learning.js';
import { problemVisual } from '../../ui/visuals.js';
import { scoreRing, masteryMeter } from '../../ui/charts.js';
import { emptyState } from '../../ui/shell.js';
import {
  STEPS, renderBrief, stepUnderstand, stepPattern, stepModel, stepSimulate, stepFormula, stepInterpret,
  codeHtml, formulaPreview,
} from './lab-steps.js';

const STEP_SKILL = { 0: 'pahami', 1: 'pola', 3: 'model', 4: 'simbol', 5: 'tafsir' };

function freshState(problem) {
  return {
    problemId: problem.id,
    step: 0,
    completedSteps: [],
    startedAt: Date.now(),
    elapsedSec: 0,
    hints: 0,
    hintLevel: {},
    bugs: [],
    skills: {},
    checked: {},
    feedback: {},
    answers: { facts: [], ask: null, varMeaning: null, outMeaning: null, diffs: [null, null, null], rate: null, model: emptyModel(), formula: '', final: '', reflection: null },
  };
}

/** Bring older or seeded states up to the current shape. */
function hydrate(problem, saved) {
  const base = freshState(problem);
  const state = { ...base, ...saved, answers: { ...base.answers, ...(saved.answers || {}) } };
  state.hintLevel = saved.hintLevel || {};
  state.checked = saved.checked || {};
  state.feedback = saved.feedback || {};
  return state;
}

export default function lab(ctx) {
  const problem = problemById(ctx.params.id);
  const user = ctx.user;

  if (!problem) {
    return {
      title: 'Misi tidak ditemukan',
      crumbs: [{ label: 'Misi', href: '/belajar/misi' }, { label: 'Tidak ditemukan', href: ctx.path }],
      render: () => emptyState({ iconName: 'search', title: 'Misi tidak ditemukan', text: 'Tautan misi ini tidak dikenal. Pilih misi dari daftar.', action: html`<a class="btn" href="/belajar/misi">Buka daftar misi</a>` }),
    };
  }

  const attemptsBefore = getAttempts(user.id);
  const unlocked = isProblemUnlocked(problem.id, attemptsBefore);
  const crumbs = [{ label: 'Misi', href: '/belajar/misi' }, { label: problem.title, href: ctx.path }];

  if (!unlocked) {
    return {
      title: problem.title,
      crumbs,
      render: () => emptyState({ iconName: 'lock', title: 'Misi ini masih terkunci', text: `Selesaikan dua misi pada topik sebelumnya untuk membuka topik ${topicById(problem.topic).title}.`, action: html`<a class="btn" href="/belajar/misi">Kembali ke daftar misi</a>` }),
    };
  }

  const saved = getLabState(user.id, problem.id);
  let state = saved ? hydrate(problem, saved) : freshState(problem);
  let summary = null; // set when the mission is finished
  let root;
  let timer;
  let saveTimer;
  let traceTimers = [];
  const previousBest = attemptsBefore.filter((a) => a.problemId === problem.id).reduce((m, a) => Math.max(m, a.score), -1);
  const visual = problemVisual(problem);

  const persist = (immediate = false) => {
    clearTimeout(saveTimer);
    const write = () => saveLabState(user.id, problem.id, state);
    if (immediate) write();
    else saveTimer = setTimeout(write, 250);
  };

  const recordSkill = (skillId, correct) => {
    const entry = state.skills[skillId];
    if (!entry) state.skills[skillId] = { firstTry: Boolean(correct), tries: 1 };
    else entry.tries += 1;
  };

  const recordBug = (bug) => {
    if (bug && !state.bugs.includes(bug)) state.bugs.push(bug);
  };

  const complete = (step) => {
    if (!state.completedSteps.includes(step)) state.completedSteps.push(step);
  };

  const goTo = (step) => {
    const maxReachable = Math.max(0, ...state.completedSteps.map((s) => s + 1));
    if (step > maxReachable) return;
    state.step = step;
    persist(true);
    renderAll({ focusBench: true });
  };

  // ------------------------------------------------------------ rendering

  const benchFor = () => {
    switch (state.step) {
      case 0: return stepUnderstand(problem, state);
      case 1: return stepPattern(problem, state);
      case 2: return stepModel(problem, state);
      case 3: return stepSimulate(problem, state);
      case 4: return stepFormula(problem, state);
      default: return stepInterpret(problem, state);
    }
  };

  const stepper = () => {
    const maxReachable = Math.max(0, ...state.completedSteps.map((s) => s + 1));
    return html`<ol class="stepper" aria-label="Langkah misi">${STEPS.map((s, i) => {
      const done = state.completedSteps.includes(i);
      const current = state.step === i;
      return html`<li class="stepper__item ${done ? 'is-done' : ''} ${current ? 'is-current' : ''}">
        <button type="button" class="stepper__btn" data-step="${i}" ${i > maxReachable ? 'disabled' : ''} ${current ? html`aria-current="step"` : ''} aria-label="Langkah ${i + 1}: ${s.label}${done ? ', selesai' : ''}">
          <span class="stepper__num">${done && !current ? icon('check') : i + 1}</span><span class="stepper__label">${s.label}</span>
        </button></li>`;
    })}</ol>`;
  };

  const header = () => html`<div class="lab-head">
    <div class="lab-head__title">
      <div class="lab-head__meta"><span class="badge badge--model">${topicById(problem.topic).title}</span>
        ${previousBest >= 0 ? html`<span class="badge badge--green">Pernah selesai, skor terbaik ${previousBest}</span>` : ''}</div>
      <h1 class="h1">${problem.title}</h1>
    </div>
    <div class="lab-head__actions">
      ${summary ? '' : html`<span class="timer" aria-label="Waktu pengerjaan">${icon('clock')}<span data-timer>${clock(state.elapsedSec)}</span></span>
        <button type="button" class="btn btn--ghost btn--sm" data-restart>${icon('reset')}Mulai ulang</button>
        <a class="btn btn--secondary btn--sm" href="/belajar/misi" data-save-exit>${icon('save')}Simpan & keluar</a>`}
    </div>
  </div>`;

  const view = () =>
    summary
      ? html`${header()}${summaryView()}`
      : html`${header()}<div data-stepper>${stepper()}</div>
        <div class="lab-grid">
          <aside class="lab-brief" aria-label="Soal">${renderBrief(problem, visual)}</aside>
          <section class="lab-bench gridpaper" data-bench aria-label="Langkah ${state.step + 1}: ${STEPS[state.step].label}" tabindex="-1">${benchFor()}</section>
        </div>`;

  function renderAll({ focusBench = false, focusSelector } = {}) {
    if (!root) return;
    stopTrace();
    if (summary) {
      root.innerHTML = toString(view());
      root.querySelector('h1')?.focus();
      return;
    }
    root.querySelector('[data-stepper]').innerHTML = toString(stepper());
    const bench = root.querySelector('[data-bench]');
    bench.innerHTML = toString(benchFor());
    bench.setAttribute('aria-label', `Langkah ${state.step + 1}: ${STEPS[state.step].label}`);
    if (state.step === 3) runTrace(state.traceX ?? problem.observations[0], { animate: false });
    if (focusSelector) root.querySelector(focusSelector)?.focus();
    else if (focusBench) {
      bench.focus({ preventScroll: true });
      const top = bench.getBoundingClientRect().top + window.scrollY - 140;
      if (window.scrollY > top) window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  const clock = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  // ------------------------------------------------------------ simulation trace

  function stopTrace() {
    traceTimers.forEach(clearTimeout);
    traceTimers = [];
  }

  function runTrace(x, { animate = true } = {}) {
    const list = root.querySelector('[data-trace]');
    if (!list) return;
    stopTrace();
    const model = state.answers.model;
    const { value, times, trace } = runModel(model, x, { maxTrace: 400 });
    const op = model.op === '-' ? '−' : '+';
    const items = [`<li class="trace__item trace__item--start">nilai = ${formatNumber(model.start)}</li>`];
    const shown = trace.length > 8 ? [...trace.slice(0, 4), null, ...trace.slice(-3)] : trace;
    for (const t of shown) {
      items.push(t ? `<li class="trace__item"><span class="trace__op">${t.i}: ${op}${formatNumber(model.amount)}</span> ${formatNumber(t.after)}</li>` : `<li class="trace__item" aria-label="langkah lain dilewati">…</li>`);
    }
    items.push(`<li class="trace__item trace__item--end">${problem.outputSymbol}(${formatNumber(x)}) = ${formatNumber(value)}</li>`);
    const summaryText = `<li class="sr-only">Perulangan berjalan ${times} kali, hasil ${formatNumber(value)}.</li>`;
    if (!animate || prefersReducedMotion()) {
      list.innerHTML = items.join('') + summaryText;
      return;
    }
    list.innerHTML = '';
    items.forEach((item, i) => {
      traceTimers.push(setTimeout(() => list.insertAdjacentHTML('beforeend', item + (i === items.length - 1 ? summaryText : '')), i * 220));
    });
  }

  // ------------------------------------------------------------ checks

  function checkUnderstand() {
    const a = state.answers;
    const relevant = problem.facts.filter((f) => f.relevant).map((f) => f.id);
    const extra = a.facts.filter((id) => !relevant.includes(id));
    const missing = relevant.filter((id) => !a.facts.includes(id));
    const askOk = a.ask !== null && problem.askOptions[a.ask]?.correct;
    if (!a.facts.length || a.ask === null) {
      state.feedback[0] = { type: 'hint', message: 'Pilih minimal satu informasi dan satu jawaban untuk pertanyaan "Apa yang ditanyakan?".' };
      return renderAll({ focusSelector: '[data-feedback]' });
    }
    state.checked[0] = true;
    const ok = !extra.length && !missing.length && askOk;
    recordSkill('pahami', ok);
    if (ok) {
      complete(0);
      state.feedback[0] = { type: 'ok', title: 'Tepat.', message: 'Kamu memisahkan data yang menentukan jawaban dari informasi tambahan.' };
    } else {
      const parts = [];
      if (extra.length) parts.push(`Ada ${extra.length} informasi yang tidak memengaruhi jawaban (bergaris merah).`);
      if (missing.length) parts.push(`Ada ${missing.length} informasi penting yang belum dipilih (bergaris putus-putus).`);
      if (!askOk) parts.push('Baca lagi kalimat pertanyaan di akhir cerita.');
      state.feedback[0] = { type: 'error', title: 'Belum tepat.', message: parts.join(' ') };
    }
    persist(true);
    renderAll({ focusSelector: '[data-feedback]' });
  }

  function checkPatternStep() {
    const a = state.answers;
    if (a.varMeaning === null || a.outMeaning === null) {
      state.feedback[1] = { type: 'hint', message: 'Pilih dulu arti kedua variabel.' };
      return renderAll({ focusSelector: a.varMeaning === null ? '#var-meaning' : '#out-meaning' });
    }
    if (a.diffs.some((d) => !Number.isFinite(d)) || !Number.isFinite(a.rate)) {
      state.feedback[1] = { type: 'hint', message: 'Isi semua kotak selisih dan laju perubahan dengan angka.' };
      return renderAll({ focusSelector: '[data-feedback]' });
    }
    const varsOk = a.varMeaning === 0 && a.outMeaning === 0;
    const result = checkPattern(problem, a.diffs, a.rate);
    state.patternResult = result;
    if (!varsOk) recordSkill('pahami', false);
    recordSkill('pola', result.ok);
    recordBug(result.bug);
    if (varsOk && result.ok) {
      complete(1);
      state.feedback[1] = { type: 'ok', title: 'Polanya ditemukan.', message: `Setiap kali ${problem.variable} naik 1, ${problem.outputSymbol} ${problem.step < 0 ? 'berkurang' : 'bertambah'} ${formatNumber(Math.abs(problem.step))}. Laju inilah yang akan diulang di dalam model.` };
    } else {
      const message = !varsOk ? `Arti variabel belum tepat. ${problem.variable} adalah besaran yang kita pilih, ${problem.outputSymbol} adalah hasil yang dihitung. ${result.ok ? '' : result.message}` : result.message;
      state.feedback[1] = { type: 'error', title: 'Belum tepat.', message, bug: result.bug };
    }
    persist(true);
    renderAll({ focusSelector: '[data-feedback]' });
  }

  function runSimulation() {
    const model = state.answers.model;
    const invalid = { start: !Number.isFinite(model.start), amount: !Number.isFinite(model.amount) };
    if (invalid.start || invalid.amount) {
      state.modelInvalid = invalid;
      state.feedback[2] = { type: 'hint', message: invalid.start ? 'Isi nilai awal pada blok "mulai".' : 'Isi besar perubahan di dalam blok "ulangi".' };
      return renderAll({ focusSelector: invalid.start ? '#m-start' : '#m-amount' });
    }
    state.modelInvalid = {};
    state.feedback[2] = null;
    const result = diagnoseModel(problem, model);
    recordSkill('model', result.pass);
    recordBug(result.bug);
    complete(2);
    if (result.pass) {
      complete(3);
      state.feedback[3] = { type: 'ok', title: 'Semua uji cocok.', message: result.message };
    } else {
      state.completedSteps = state.completedSteps.filter((s) => s < 3);
      state.feedback[3] = { type: 'error', title: 'Ada data yang tidak cocok.', message: result.message, bug: result.bug };
    }
    state.step = 3;
    state.traceX = problem.observations[0];
    persist(true);
    renderAll({ focusBench: true });
    if (!prefersReducedMotion()) runTrace(state.traceX, { animate: true });
  }

  function checkFormula() {
    const text = state.answers.formula;
    const result = diagnoseFormula(problem, text);
    if (result.status === 'invalid') {
      state.feedback[4] = { type: 'hint', title: 'Rumus belum bisa dibaca.', message: result.message };
      return renderAll({ focusSelector: '#formula' });
    }
    recordSkill('simbol', result.status === 'correct');
    recordBug(result.bug);
    if (result.status === 'correct') {
      complete(4);
      state.feedback[4] = { type: 'ok', title: 'Rumusmu setara dengan model.', message: result.message };
    } else {
      state.feedback[4] = { type: 'error', title: 'Belum setara.', message: result.message, bug: result.bug };
    }
    persist(true);
    renderAll({ focusSelector: result.status === 'correct' ? '[data-feedback]' : '#formula' });
  }

  function checkInterpret() {
    const a = state.answers;
    const value = parseNumber(a.final);
    if (value === null || a.reflection === null) {
      state.feedback[5] = { type: 'hint', message: 'Isi jawaban berupa angka dan pilih satu penjelasan.' };
      return renderAll({ focusSelector: value === null ? '#final' : '[data-feedback]' });
    }
    const final = checkFinal(problem, value);
    const reflectionOk = problem.reflection.options[a.reflection]?.correct;
    state.checked[5] = true;
    state.finalOk = final.ok;
    recordSkill('tafsir', final.ok && reflectionOk);
    if (final.ok && reflectionOk) {
      complete(5);
      state.feedback[5] = { type: 'ok', title: 'Jawaban dan penjelasanmu tepat.', message: `${problem.final.text.replace(/\?.*$/, '?')} Jawabannya ${formatNumber(problem.final.answer)} ${problem.final.unit === 'minggu ke-' ? '(minggu ke-' + formatNumber(problem.final.answer) + ')' : problem.final.unit}.` };
    } else {
      const parts = [];
      if (!final.ok) parts.push(final.message);
      if (!reflectionOk) parts.push('Penjelasan yang dipilih belum tepat. Hubungkan angka di rumus dengan bagian modelmu.');
      state.feedback[5] = { type: 'error', title: 'Belum tepat.', message: parts.join(' ') };
    }
    persist(true);
    renderAll({ focusSelector: '[data-feedback]' });
  }

  function useHint(step) {
    const total = step === 5 ? 2 : 3;
    const used = state.hintLevel[step] || 0;
    if (used >= total) return;
    state.hintLevel[step] = used + 1;
    state.hints += 1;
    // A hint before the first check means the step was not solved independently.
    const skill = STEP_SKILL[step === 2 ? 3 : step];
    if (skill && !state.skills[skill]) state.skills[skill] = { firstTry: false, tries: 0 };
    persist(true);
    renderAll();
    const hints = root.querySelectorAll('.callout--hint');
    hints[hints.length - 1]?.setAttribute('tabindex', '-1');
    hints[hints.length - 1]?.focus();
  }

  function finish() {
    const finishedAt = Date.now();
    const skills = {};
    for (const s of SKILLS) skills[s.id] = state.skills[s.id] || { firstTry: false, tries: 0 };
    const attempt = {
      id: `a-${finishedAt.toString(36)}`,
      userId: user.id,
      problemId: problem.id,
      startedAt: state.startedAt,
      finishedAt,
      durationSec: state.elapsedSec,
      skills,
      bugs: [...state.bugs],
      hints: state.hints,
      score: scoreAttempt(skills),
    };
    const before = computeMastery(getAttempts(user.id));
    const allAttempts = addAttempt(user.id, attempt);
    const after = computeMastery(allAttempts);
    clearLabState(user.id, problem.id);
    clearInterval(timer);
    summary = { attempt, before, after, next: recommendNext(allAttempts) };
    toast(`Misi "${problem.title}" selesai. Skor ${attempt.score}.`, { type: 'success' });
    renderAll();
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ summary

  function summaryView() {
    const { attempt, before, after, next } = summary;
    const { m, c } = ruleCoefficients(problem);
    return html`<div class="dash" style="margin-top:0.5rem">
      <div class="dash__col">
        <section class="panel panel--pad gridpaper" aria-labelledby="sum-title">
          <div class="summary-hero">
            ${scoreRing(attempt.score, 'Skor misi')}
            <div style="display:grid;gap:0.4rem">
              <h2 class="h2" id="sum-title">Misi selesai.</h2>
              <p class="muted">Rumus yang kamu temukan: <span class="math"><var>${problem.outputSymbol}</var> = ${raw(linearHtml(m, c, problem.variable, { highlight: true }))}</span></p>
              <p class="subtle">Waktu ${formatDuration(attempt.durationSec)}, ${attempt.hints} petunjuk dipakai. Skor dihitung dari langkah yang benar pada percobaan pertama.</p>
            </div>
          </div>
        </section>
        <section class="panel" aria-labelledby="err-title">
          <div class="panel__head"><h2 class="h3" id="err-title">Memahami kesalahanmu</h2></div>
          <div class="panel__body" style="display:grid;gap:0.85rem">
            ${attempt.bugs.length
              ? attempt.bugs.map((id) => {
                  const mc = misconceptionById(id);
                  return html`<div class="callout callout--hint">${icon('bug')}<div class="callout__body"><strong>${mc.name}</strong><span>${mc.why}</span><span>Lain kali: ${mc.studentTip}</span></div></div>`;
                })
              : html`<div class="callout callout--ok">${icon('check')}<span>Tidak ada pola kesalahan yang terdiagnosis pada misi ini.</span></div>`}
          </div>
        </section>
      </div>
      <div class="dash__col">
        <section class="panel" aria-labelledby="delta-title">
          <div class="panel__head"><h2 class="h3" id="delta-title">Perubahan penguasaan</h2></div>
          <div class="panel__body skill-deltas">
            ${SKILLS.map((s) => {
              const delta = Math.round((after.current[s.id] - before.current[s.id]) * 100);
              return html`<div>${masteryMeter(s.name, after.current[s.id], { level: masteryLevel(after.current[s.id]) })}
                <span class="delta ${delta >= 0 ? 'delta--up' : 'delta--down'}">${delta >= 0 ? '+' : '−'}${Math.abs(delta)} poin dari sebelum misi</span></div>`;
            })}
          </div>
        </section>
        <section class="panel panel--pad" style="display:grid;gap:0.75rem">
          <h2 class="h3">Berikutnya</h2>
          <p class="muted small">${next.problem.id === problem.id ? 'Ulangi misi ini untuk memperkuat pemahamanmu.' : `Rekomendasi: ${next.problem.title}.`}</p>
          <div style="display:flex;gap:0.6rem;flex-wrap:wrap">
            <a class="btn" href="/belajar/misi/${next.problem.id}">${next.problem.id === problem.id ? 'Ulangi misi' : 'Mulai misi berikutnya'}</a>
            <a class="btn btn--secondary" href="/belajar/progres">Lihat progres</a>
          </div>
        </section>
      </div>
    </div>`;
  }

  // ------------------------------------------------------------ live updates (no full re-render while typing)

  function onModelInput(field, value) {
    const model = state.answers.model;
    if (field === 'start' || field === 'amount') {
      const n = parseNumber(value);
      model[field] = n === null ? '' : n;
    } else model[field] = value;
    // Editing the model invalidates later steps until the model is run again.
    if (state.completedSteps.some((s) => s >= 3)) {
      state.completedSteps = state.completedSteps.filter((s) => s < 3);
      state.feedback[3] = null;
      state.feedback[4] = null;
      root.querySelector('[data-stepper]').innerHTML = toString(stepper());
    }
    const code = root.querySelector('[data-code]');
    if (code) code.innerHTML = toString(codeHtml(model, problem));
    const sentence = root.querySelector('[data-model-sentence]');
    if (sentence) sentence.textContent = isModelComplete(model) ? describeModel(model, problem) : 'Lengkapi nilai awal dan besar perubahan.';
    persist();
  }

  return {
    title: problem.title,
    crumbs,
    render: () => html`<div data-lab-root>${view()}</div>`,
    mount(el) {
      root = el.querySelector('[data-lab-root]');
      if (saved && !summary) {
        toast(`Melanjutkan dari langkah ${state.step + 1}: ${STEPS[state.step].label}.`, { type: 'info' });
      }
      persist(true);
      if (state.step === 3) runTrace(state.traceX ?? problem.observations[0], { animate: false });

      timer = setInterval(() => {
        if (document.hidden || summary) return;
        state.elapsedSec += 1;
        const t = root.querySelector('[data-timer]');
        if (t) t.textContent = clock(state.elapsedSec);
        if (state.elapsedSec % 10 === 0) persist();
      }, 1000);

      const offs = [
        on(root, 'click', '[data-step]', (e, btn) => goTo(Number(btn.dataset.step))),
        on(root, 'click', '[data-go]', (e, btn) => goTo(Number(btn.dataset.go))),
        on(root, 'click', '[data-check]', (e, btn) => {
          const step = Number(btn.dataset.check);
          if (step === 0) checkUnderstand();
          if (step === 1) checkPatternStep();
          if (step === 5) checkInterpret();
        }),
        on(root, 'click', '[data-hint]', (e, btn) => useHint(Number(btn.dataset.hint))),
        on(root, 'click', '[data-fact]', (e, btn) => {
          const id = btn.dataset.fact;
          const facts = state.answers.facts;
          state.answers.facts = facts.includes(id) ? facts.filter((f) => f !== id) : [...facts, id];
          state.checked[0] = false;
          persist();
          renderAll({ focusSelector: `[data-fact="${id}"]` });
        }),
        on(root, 'click', '[data-ask]', (e, btn) => {
          state.answers.ask = Number(btn.dataset.ask);
          state.checked[0] = false;
          persist();
          renderAll({ focusSelector: `[data-ask="${btn.dataset.ask}"]` });
        }),
        on(root, 'click', '[data-reflection]', (e, btn) => {
          state.answers.reflection = Number(btn.dataset.reflection);
          state.checked[5] = false;
          persist();
          renderAll({ focusSelector: `[data-reflection="${btn.dataset.reflection}"]` });
        }),
        on(root, 'change', '[data-answer]', (e, sel) => {
          state.answers[sel.dataset.answer] = sel.value === '' ? null : Number(sel.value);
          persist();
        }),
        on(root, 'input', '[data-diff]', (e, input) => {
          state.answers.diffs[Number(input.dataset.diff)] = parseNumber(input.value) ?? NaN;
          input.classList.remove('is-ok', 'is-bad');
          persist();
        }),
        on(root, 'input', '[data-rate]', (e, input) => {
          state.answers.rate = parseNumber(input.value) ?? NaN;
          input.classList.remove('is-ok', 'is-bad');
          persist();
        }),
        on(root, 'input', '[data-model]', (e, input) => onModelInput(input.dataset.model, input.value)),
        on(root, 'change', 'select[data-model]', (e, input) => onModelInput(input.dataset.model, input.value)),
        on(root, 'toggle', '[data-code-details]', (e, d) => {
          state.showCode = d.open;
          persist();
        }, true),
        on(root, 'click', '[data-run]', () => runSimulation()),
        on(root, 'submit', '[data-trace-form]', (e) => {
          e.preventDefault();
          const input = root.querySelector('[data-trace-x]');
          const x = parseNumber(input.value);
          if (x === null || x < 0 || x > 200 || !Number.isInteger(x)) {
            toast(`Masukkan bilangan bulat ${problem.variable} antara 0 dan 200.`, { type: 'error' });
            input.focus();
            return;
          }
          state.traceX = x;
          persist();
          runTrace(x, { animate: true });
        }),
        on(root, 'input', '[data-formula]', (e, input) => {
          state.answers.formula = input.value;
          root.querySelector('[data-preview]').innerHTML = toString(formulaPreview(problem, input.value));
          persist();
        }),
        on(root, 'submit', '[data-formula-form]', (e) => {
          e.preventDefault();
          checkFormula();
        }),
        on(root, 'click', '[data-key]', (e, btn) => {
          const input = root.querySelector('[data-formula]');
          const key = btn.dataset.key;
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? input.value.length;
          const insert = ['+', '−', '×'].includes(key) ? ` ${key} ` : key;
          input.value = input.value.slice(0, start) + insert + input.value.slice(end);
          input.focus();
          input.setSelectionRange(start + insert.length, start + insert.length);
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }),
        on(root, 'input', '[data-final]', (e, input) => {
          state.answers.final = input.value;
          persist();
        }),
        on(root, 'keydown', '[data-final]', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            checkInterpret();
          }
        }),
        on(root, 'click', '[data-finish]', () => finish()),
        on(root, 'click', '[data-save-exit]', () => {
          persist(true);
          toast('Progres misi disimpan. Kamu bisa melanjutkannya kapan saja.', { type: 'success' });
        }),
        on(root, 'click', '[data-restart]', async () => {
          const ok = await confirmDialog({ title: 'Mulai ulang misi ini?', body: 'Semua isian dan waktu pada misi ini dihapus. Riwayat misi yang sudah selesai tetap tersimpan.', confirmText: 'Mulai ulang' });
          if (!ok) return;
          state = freshState(problem);
          persist(true);
          root.innerHTML = toString(view());
          toast('Misi dimulai dari awal.', { type: 'info' });
        }),
        on(root, 'keydown', 'input.input--num:not([data-final]):not([data-trace-x])', (e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (state.step === 1) checkPatternStep();
          if (state.step === 2) runSimulation();
        }),
      ];

      return () => {
        offs.forEach((off) => off());
        clearInterval(timer);
        stopTrace();
        if (!summary) persist(true);
      };
    },
  };
}
