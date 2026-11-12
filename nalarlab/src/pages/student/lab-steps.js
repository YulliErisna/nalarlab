// Rendering for each of the six lab steps. Pure functions of (problem, state).
import { html, raw } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { formatNumber, linearHtml, compile, astToHtml, FormulaError } from '../../engine/expression.js';
import { REPEAT_OPTIONS, modelToCode, describeModel, isModelComplete, runModel, correctModel } from '../../engine/model.js';
import { observationRows, diagnoseModel } from '../../engine/diagnose.js';
import { ruleCoefficients } from '../../data/curriculum.js';
import { misconceptionById } from '../../data/misconceptions.js';
import { modelChart } from '../../ui/charts.js';

export const STEPS = [
  { id: 'pahami', label: 'Pahami masalah' },
  { id: 'pola', label: 'Variabel & pola' },
  { id: 'model', label: 'Bangun model' },
  { id: 'simulasi', label: 'Jalankan simulasi' },
  { id: 'rumus', label: 'Tulis rumus' },
  { id: 'tafsir', label: 'Jawab & refleksi' },
];

/** Deterministic shuffle so option order is stable per mission but not always "correct first". */
export function stableOrder(length, seedText) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    const j = h % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function feedbackBox(fb) {
  if (!fb) return '';
  const kind = { ok: 'callout--ok', error: 'callout--error', hint: 'callout--hint', info: 'callout--info' }[fb.type] || 'callout--info';
  const ic = { ok: 'check', error: 'alert', hint: 'bulb', info: 'info' }[fb.type] || 'info';
  const m = fb.bug ? misconceptionById(fb.bug) : null;
  return html`<div class="callout ${kind}" role="${fb.type === 'error' ? 'alert' : 'status'}" data-feedback>
    ${icon(ic)}<div class="callout__body">
      ${fb.title ? html`<strong>${fb.title}</strong>` : ''}
      <span>${fb.message}</span>
      ${m ? html`<span><span class="badge badge--red">${icon('bug')}Pola kesalahan: ${m.name}</span></span><span>${m.studentTip}</span>` : ''}
    </div></div>`;
}

function hintBlock(state, stepIndex, hints) {
  const used = state.hintLevel?.[stepIndex] || 0;
  return html`<div class="bench__section" aria-live="polite">
    ${hints.slice(0, used).map((h, i) => html`<div class="callout callout--hint">${icon('bulb')}<div class="callout__body"><strong>Petunjuk ${i + 1}</strong><span>${h}</span></div></div>`)}
  </div>`;
}

function hintButton(state, stepIndex, total) {
  const used = state.hintLevel?.[stepIndex] || 0;
  if (used >= total) return html`<span class="subtle">Semua petunjuk sudah dibuka</span>`;
  return html`<button type="button" class="btn btn--ghost" data-hint="${stepIndex}">${icon('bulb')}Petunjuk ${used + 1} dari ${total}</button>`;
}

// ---------------------------------------------------------------- Brief (left column)

export function renderBrief(problem, visual) {
  const rows = observationRows(problem);
  return html`<div class="panel brief">
      <div class="brief__story">${problem.story.map((p) => html`<p>${p}</p>`)}</div>
      <p class="brief__ask">${problem.final.text}</p>
    </div>
    <div class="panel brief" aria-labelledby="data-title">
      <h2 class="h4" id="data-title" style="margin-bottom:0.75rem">Data yang diketahui</h2>
      <div style="overflow-x:auto"><table class="obs-table">
        <tbody>
          <tr><th scope="row">${problem.variable}</th>${rows.map((r) => html`<td>${formatNumber(r.x)}</td>`)}</tr>
          <tr><th scope="row">${problem.outputSymbol} (${problem.unit})</th>${rows.map((r) => html`<td>${formatNumber(r.y)}</td>`)}</tr>
        </tbody></table></div>
      <div style="margin-top:1rem">${visual}</div>
    </div>`;
}

// ---------------------------------------------------------------- Step 1

export function stepUnderstand(problem, state) {
  const a = state.answers;
  const factOrder = stableOrder(problem.facts.length, `${problem.id}-facts`);
  const askOrder = stableOrder(problem.askOptions.length, `${problem.id}-ask`);
  const checked = state.checked?.[0];
  return html`
    <div class="bench__title"><h2 class="h3">Pahami masalahnya</h2><p>Sebelum menghitung, pisahkan informasi yang menentukan jawaban dari informasi yang hanya cerita.</p></div>
    <div class="bench__section bench__card">
      <h3 id="facts-label">Informasi mana yang dibutuhkan? Pilih semua yang sesuai.</h3>
      <div class="chips" role="group" aria-labelledby="facts-label">
        ${factOrder.map((i) => {
          const fact = problem.facts[i];
          const on = a.facts.includes(fact.id);
          const cls = checked && on && !fact.relevant ? 'is-wrong' : checked && !on && fact.relevant ? 'is-missing' : '';
          return html`<button type="button" class="chip ${cls}" aria-pressed="${on}" data-fact="${fact.id}"><span class="chip__box">${on ? icon('check') : ''}</span>${fact.text}</button>`;
        })}
      </div>
    </div>
    <div class="bench__section bench__card">
      <h3 id="ask-label">Apa yang ditanyakan?</h3>
      <div class="options" role="radiogroup" aria-labelledby="ask-label">
        ${askOrder.map((i) => {
          const option = problem.askOptions[i];
          const on = a.ask === i;
          const cls = checked && on ? (option.correct ? 'is-right' : 'is-wrong') : '';
          return html`<button type="button" class="option ${cls}" role="radio" aria-checked="${on}" data-ask="${i}"><span class="option__dot"></span><span>${option.text}</span></button>`;
        })}
      </div>
    </div>
    ${hintBlock(state, 0, hintsFor(problem, 0))}
    ${feedbackBox(state.feedback?.[0])}
    <div class="bench__actions">
      ${hintButton(state, 0, 3)}<span class="spacer"></span>
      ${state.completedSteps.includes(0)
        ? html`<button type="button" class="btn" data-go="1">Lanjut ke variabel & pola</button>`
        : html`<button type="button" class="btn" data-check="0">Periksa</button>`}
    </div>`;
}

// ---------------------------------------------------------------- Step 2

export function stepPattern(problem, state) {
  const a = state.answers;
  const rows = observationRows(problem);
  const varOrder = stableOrder(problem.varOptions.length, `${problem.id}-var`);
  const outOrder = stableOrder(problem.outOptions.length, `${problem.id}-out`);
  const res = state.patternResult;
  const cellClass = (i) => (res ? (res.diffResults[i]?.ok ? 'is-ok' : 'is-bad') : '');
  const val = (v) => (v === null || v === undefined || Number.isNaN(v) ? '' : String(v).replace('.', ','));
  return html`
    <div class="bench__title"><h2 class="h3">Tentukan variabel dan temukan polanya</h2><p>Variabel adalah nama untuk besaran yang berubah. Pola adalah besar perubahan setiap langkah.</p></div>
    <div class="bench__section bench__card" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem">
      <div class="field"><label class="label" for="var-meaning"><span class="math"><var>${problem.variable}</var></span> menyatakan</label>
        <select class="select" id="var-meaning" data-answer="varMeaning" ${res && a.varMeaning !== 0 ? 'aria-invalid="true"' : ''}>
          <option value="">Pilih arti…</option>
          ${varOrder.map((i) => html`<option value="${i}" ${a.varMeaning === i ? 'selected' : ''}>${problem.varOptions[i]}</option>`)}
        </select></div>
      <div class="field"><label class="label" for="out-meaning"><span class="math"><var>${problem.outputSymbol}</var></span> menyatakan</label>
        <select class="select" id="out-meaning" data-answer="outMeaning" ${res && a.outMeaning !== 0 ? 'aria-invalid="true"' : ''}>
          <option value="">Pilih arti…</option>
          ${outOrder.map((i) => html`<option value="${i}" ${a.outMeaning === i ? 'selected' : ''}>${problem.outOptions[i]}</option>`)}
        </select></div>
    </div>
    <div class="bench__section bench__card">
      <h3>Hitung perubahan antarkolom</h3>
      <div style="overflow-x:auto"><table class="obs-table" style="max-width:520px">
        <tbody>
          <tr><th scope="row">${problem.variable}</th>${rows.map((r) => html`<td>${formatNumber(r.x)}</td>`)}</tr>
          <tr><th scope="row">${problem.outputSymbol}</th>${rows.map((r) => html`<td>${formatNumber(r.y)}</td>`)}</tr>
        </tbody></table></div>
      <div class="diff-row" role="group" aria-label="Selisih antarkolom">
        ${rows.slice(1).map((r, i) => html`<label class="diff-cell"><span class="diff-cell__label">${formatNumber(r.y)} − ${formatNumber(rows[i].y)}</span>
          <input class="input input--num ${cellClass(i)}" inputmode="decimal" autocomplete="off" data-diff="${i}" value="${val(a.diffs[i])}" aria-label="Selisih kolom ${i + 1} dan ${i + 2}" /></label>`)}
      </div>
      <div class="rate-line"><label for="rate">Perubahan untuk setiap kenaikan 1 pada <span class="math"><var>${problem.variable}</var></span>:</label>
        <input class="input input--num ${res ? (res.rateOk ? 'is-ok' : 'is-bad') : ''}" id="rate" inputmode="decimal" autocomplete="off" data-rate value="${val(a.rate)}" /></div>
      <p class="subtle">Gunakan tanda minus jika nilainya berkurang. Desimal boleh ditulis dengan koma.</p>
    </div>
    ${hintBlock(state, 1, hintsFor(problem, 1))}
    ${feedbackBox(state.feedback?.[1])}
    <div class="bench__actions">
      ${hintButton(state, 1, 3)}<span class="spacer"></span>
      ${state.completedSteps.includes(1)
        ? html`<button type="button" class="btn" data-go="2">Lanjut ke model</button>`
        : html`<button type="button" class="btn" data-check="1">Periksa</button>`}
    </div>`;
}

// ---------------------------------------------------------------- Step 3

export function codeHtml(model, problem) {
  const code = modelToCode(model, problem)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\b(function|let|for|return)\b/g, '<span class="tok-k">$1</span>')
    .replace(/(\s)(-?\d+(?:\.\d+)?)(?=[;\s)])/g, '$1<span class="tok-n">$2</span>');
  return raw(code);
}

export function modelBlocks(problem, model, { invalid = {} } = {}) {
  const num = (v) => (Number.isFinite(v) ? String(v).replace('.', ',') : '');
  return html`<div class="blocks" aria-label="Blok model">
    <div class="block is-hl-c"><span class="block__kw">mulai</span><label class="block__txt" for="m-start">nilai =</label>
      <input class="input input--num" id="m-start" inputmode="decimal" autocomplete="off" data-model="start" value="${num(model.start)}" ${invalid.start ? 'aria-invalid="true"' : ''} aria-label="Nilai awal" /></div>
    <div class="block block--loop">
      <div class="block__row"><span class="block__kw">ulangi</span>
        <select class="select" data-model="repeat" aria-label="Banyak perulangan">
          ${REPEAT_OPTIONS.map((o) => html`<option value="${o.id}" ${model.repeat === o.id ? 'selected' : ''}>${o.label(problem.variable)}</option>`)}
        </select><span class="block__txt">kali</span></div>
      <div class="block block--inner is-hl-m"><label class="block__txt" for="m-amount">nilai = nilai</label>
        <select class="select" data-model="op" aria-label="Operasi">
          <option value="+" ${model.op === '+' ? 'selected' : ''}>+</option>
          <option value="-" ${model.op === '-' ? 'selected' : ''}>−</option>
        </select>
        <input class="input input--num" id="m-amount" inputmode="decimal" autocomplete="off" data-model="amount" value="${num(model.amount)}" ${invalid.amount ? 'aria-invalid="true"' : ''} aria-label="Besar perubahan" /></div>
    </div>
    <div class="block block--end"><span class="block__kw">hasil</span><span class="block__txt">nilai = <span class="math">${problem.outputSymbol}(${problem.variable})</span></span></div>
  </div>`;
}

export function stepModel(problem, state) {
  const model = state.answers.model;
  return html`
    <div class="bench__title"><h2 class="h3">Bangun model komputasional</h2>
      <p>Susun program kecil yang menghasilkan <span class="math"><var>${problem.outputSymbol}</var></span> untuk setiap <span class="math"><var>${problem.variable}</var></span>: mulai dari sebuah nilai, lalu ulangi perubahan yang sama beberapa kali.</p></div>
    <div class="bench__section">${modelBlocks(problem, model, { invalid: state.modelInvalid || {} })}</div>
    <p class="small muted" data-model-sentence aria-live="polite">${isModelComplete(model) ? describeModel(model, problem) : 'Lengkapi nilai awal dan besar perubahan.'}</p>
    <details class="bench__section" ${state.showCode ? 'open' : ''} data-code-details>
      <summary class="btn btn--secondary btn--sm" style="width:fit-content">${icon('code')}Lihat sebagai kode</summary>
      <pre class="code-view" data-code>${codeHtml(model, problem)}</pre>
    </details>
    ${hintBlock(state, 2, hintsFor(problem, 2))}
    ${feedbackBox(state.feedback?.[2])}
    <div class="bench__actions">
      ${hintButton(state, 2, 3)}<span class="spacer"></span>
      <button type="button" class="btn btn--model" data-run>${icon('play')}Jalankan simulasi</button>
    </div>`;
}

// ---------------------------------------------------------------- Step 4

export function stepSimulate(problem, state) {
  const model = state.answers.model;
  const result = diagnoseModel(problem, model);
  const xs = problem.observations;
  const stepX = xs[1] - xs[0];
  const curve = [];
  for (let x = Math.min(problem.n0, xs[0]); x <= xs[xs.length - 1] + stepX + 1e-9; x += stepX) curve.push({ x, y: runModel(model, x).value });
  const traceX = state.traceX ?? xs[0];
  return html`
    <div class="bench__title"><h2 class="h3">Jalankan dan uji modelnya</h2><p>Model diuji dengan setiap data yang diketahui. Jika ada yang berbeda, kamu melihat contoh tandingannya.</p></div>
    <div class="bench__section bench__card">
      <h3>Jalankan langkah demi langkah</h3>
      <form class="sim-controls" data-trace-form>
        <label for="trace-x">Untuk <span class="math"><var>${problem.variable}</var></span> =</label>
        <input class="input input--num" id="trace-x" inputmode="numeric" value="${traceX}" data-trace-x />
        <button type="submit" class="btn btn--secondary">${icon('step')}Jalankan</button>
      </form>
      <ol class="trace" data-trace aria-live="polite" aria-label="Jejak eksekusi"></ol>
    </div>
    <div class="bench__section">
      <table class="test-table">
        <caption class="sr-only">Hasil uji model terhadap data</caption>
        <thead><tr><th scope="col">${problem.variable}</th><th scope="col">Data</th><th scope="col">Modelmu</th><th scope="col">Status</th></tr></thead>
        <tbody>${result.tests.map((t) => html`<tr class="${t.ok ? '' : 'is-bad'}"><td>${formatNumber(t.x)}</td><td>${formatNumber(t.expected)}</td><td>${formatNumber(t.got)}</td>
          <td class="status ${t.ok ? 'test-ok' : 'test-bad'}">${t.ok ? 'Cocok' : 'Berbeda'}</td></tr>`)}</tbody>
      </table>
    </div>
    <div class="bench__section bench__card">${modelChart({ problem, points: result.tests, model: curve, label: `Grafik data dan hasil model untuk ${problem.title}` })}</div>
    ${feedbackBox(state.feedback?.[3])}
    <div class="bench__actions">
      <button type="button" class="btn btn--secondary" data-go="2">${icon('arrowLeft')}${result.pass ? 'Lihat model' : 'Perbaiki model'}</button>
      <span class="spacer"></span>
      ${result.pass ? html`<button type="button" class="btn" data-go="4">Lanjut: tulis rumus</button>` : ''}
    </div>`;
}

// ---------------------------------------------------------------- Step 5

export function formulaPreview(problem, text) {
  if (!String(text || '').trim()) return html`<span>Pratinjau rumus muncul di sini saat kamu mengetik.</span>`;
  try {
    const { ast } = compile(text, problem.variable);
    return html`<span class="math"><var>${problem.outputSymbol}</var> = ${raw(astToHtml(ast, problem.variable))}</span>`;
  } catch (error) {
    if (error instanceof FormulaError) return html`<span>${error.message}</span>`;
    throw error;
  }
}

function staticModel(problem, model) {
  const opt = REPEAT_OPTIONS.find((o) => o.id === model.repeat);
  return html`<div class="blocks blocks--static" aria-label="Modelmu">
    <div class="block"><span class="block__kw">mulai</span><span class="block__txt">nilai =</span><span class="block__val block__val--c">${formatNumber(model.start)}</span></div>
    <div class="block block--loop"><div class="block__row"><span class="block__kw">ulangi</span><span class="block__val">${opt.label(problem.variable)}</span><span class="block__txt">kali</span></div>
      <div class="block block--inner"><span class="block__txt">nilai = nilai ${model.op === '-' ? '−' : '+'}</span><span class="block__val block__val--m">${formatNumber(model.amount)}</span></div></div>
    <div class="block block--end"><span class="block__kw">hasil</span><span class="block__txt">nilai</span></div>
  </div>`;
}

export function longForm(problem) {
  const target = correctModel(problem);
  const v = problem.variable;
  const op = target.op === '-' ? '−' : '+';
  const amount = `<mark class="hl hl-m">${formatNumber(target.amount)}</mark>`;
  const start = `<mark class="hl hl-c">${formatNumber(target.start)}</mark>`;
  if (problem.start === 0 && problem.n0 === 0) return `${amount}<var>${v}</var>`;
  const count = problem.n0 === 1 ? `(<var>${v}</var> − 1)` : `<var>${v}</var>`;
  return `${start} ${op} ${amount}${count}`;
}

export function stepFormula(problem, state) {
  const solved = state.completedSteps.includes(4);
  const { m, c } = ruleCoefficients(problem);
  const model = state.answers.model;
  return html`
    <div class="bench__title"><h2 class="h3">Terjemahkan model menjadi rumus</h2><p>Modelmu sudah cocok dengan data. Sekarang tuliskan aturan yang sama dalam notasi matematika. Semua bentuk yang setara diterima.</p></div>
    <div class="translate">
      <div class="bench__section bench__card"><h3>Modelmu</h3>${staticModel(problem, model)}
        <p class="subtle">Warna stabilo menandai bagian model yang akan muncul di rumus.</p></div>
      <div class="bench__section bench__card">
        <form class="formula-field" data-formula-form>
          <label class="label" for="formula">Rumus untuk <span class="math"><var>${problem.outputSymbol}</var></span></label>
          <div class="formula-input"><span class="formula-input__lhs"><var>${problem.outputSymbol}</var> =</span>
            <input id="formula" data-formula autocomplete="off" spellcheck="false" placeholder="contoh: 2${problem.variable} + 5" value="${state.answers.formula || ''}" ${solved ? 'readonly' : ''} aria-describedby="formula-preview" /></div>
          <div class="keypad" aria-label="Tombol simbol">
            ${[problem.variable, '+', '−', '×', '(', ')', ','].map((k) => html`<button type="button" data-key="${k}" ${solved ? 'disabled' : ''} aria-label="Sisipkan ${k}">${k}</button>`)}
          </div>
          <div class="formula-preview" id="formula-preview" data-preview aria-live="polite">${formulaPreview(problem, state.answers.formula)}</div>
          ${solved ? '' : html`<button type="submit" class="btn" style="justify-self:start">Periksa rumus</button>`}
        </form>
      </div>
    </div>
    ${solved
      ? html`<div class="bench__section bench__card mapping">
          <h3>Dari model ke rumus</h3>
          <p class="mapping__eq math"><var>${problem.outputSymbol}</var> = ${raw(longForm(problem))} = ${raw(linearHtml(m, c, problem.variable, { highlight: true }))}</p>
          <p class="mapping__row"><mark class="hl hl-m">koefisien ${formatNumber(m)}</mark><span>adalah perubahan di dalam perulangan, yang terjadi setiap kali ${problem.variable} naik 1.</span></p>
          ${Math.abs(c) > 1e-9
            ? html`<p class="mapping__row"><mark class="hl hl-c">konstanta ${formatNumber(c)}</mark><span>${problem.n0 === 1 ? `adalah nilai awal dikurangi satu perubahan (${formatNumber(problem.start)} − ${formatNumber(problem.step)}), karena pada ${problem.variable} = 1 belum ada perubahan.` : `adalah nilai saat ${problem.variable} = 0, sebelum ada perubahan apa pun.`}</span></p>`
            : html`<p class="mapping__row"><span>Tidak ada konstanta: saat ${problem.variable} = 0 hasilnya 0. Inilah ciri hubungan sebanding.</span></p>`}
        </div>`
      : hintBlock(state, 4, hintsFor(problem, 4))}
    ${feedbackBox(state.feedback?.[4])}
    <div class="bench__actions">
      ${solved ? '' : hintButton(state, 4, 3)}<span class="spacer"></span>
      ${solved ? html`<button type="button" class="btn" data-go="5">Lanjut: jawab pertanyaan</button>` : ''}
    </div>`;
}

// ---------------------------------------------------------------- Step 6

export function stepInterpret(problem, state) {
  const a = state.answers;
  const order = stableOrder(problem.reflection.options.length, `${problem.id}-refl`);
  const checked = state.checked?.[5];
  const done = state.completedSteps.includes(5);
  const { m, c } = ruleCoefficients(problem);
  return html`
    <div class="bench__title"><h2 class="h3">Jawab dan jelaskan</h2><p>Gunakan rumusmu <span class="math"><var>${problem.outputSymbol}</var> = ${raw(linearHtml(m, c, problem.variable))}</span> untuk menjawab pertanyaan dalam cerita.</p></div>
    <div class="bench__section bench__card">
      <label class="label" for="final">${problem.final.text}</label>
      <div style="display:flex;gap:0.6rem;align-items:center;flex-wrap:wrap">
        ${problem.final.unit === 'minggu ke-' ? html`<span>minggu ke-</span>` : ''}
        <input class="input input--num" id="final" inputmode="decimal" autocomplete="off" data-final value="${a.final ?? ''}" ${done ? 'readonly' : ''} ${checked && !state.finalOk ? 'aria-invalid="true"' : ''} />
        ${problem.final.unit !== 'minggu ke-' ? html`<span>${problem.final.unit}</span>` : ''}
      </div>
    </div>
    <div class="bench__section bench__card">
      <h3 id="refl-label">${problem.reflection.question}</h3>
      <div class="options" role="radiogroup" aria-labelledby="refl-label">
        ${order.map((i) => {
          const option = problem.reflection.options[i];
          const on = a.reflection === i;
          const cls = checked && on ? (option.correct ? 'is-right' : 'is-wrong') : '';
          return html`<button type="button" class="option ${cls}" role="radio" aria-checked="${on}" data-reflection="${i}" ${done ? 'disabled' : ''}><span class="option__dot"></span><span>${option.text}</span></button>`;
        })}
      </div>
      ${done ? html`<p class="small" style="margin-top:0.5rem"><strong>Penjelasan:</strong> ${problem.reflection.explain}</p>` : ''}
    </div>
    ${done ? '' : hintBlock(state, 5, hintsFor(problem, 5))}
    ${feedbackBox(state.feedback?.[5])}
    <div class="bench__actions">
      ${done ? '' : hintButton(state, 5, 2)}<span class="spacer"></span>
      ${done ? html`<button type="button" class="btn btn--lg" data-finish>${icon('flag')}Selesaikan misi</button>` : html`<button type="button" class="btn" data-check="5">Periksa jawaban</button>`}
    </div>`;
}

// ---------------------------------------------------------------- Hints

export function hintsFor(problem, step) {
  const v = problem.variable;
  const rows = observationRows(problem);
  const xStep = rows[1].x - rows[0].x;
  const diff = rows[1].y - rows[0].y;
  const target = correctModel(problem);
  const relevant = problem.facts.filter((f) => f.relevant).map((f) => `"${f.text}"`).join(' dan ');
  switch (step) {
    case 0:
      return [
        'Informasi yang dibutuhkan biasanya berupa nilai awal dan besar perubahan.',
        'Untuk setiap informasi, tanyakan: jika angka ini diganti, apakah jawabannya ikut berubah?',
        `Informasi yang dibutuhkan: ${relevant}. Pertanyaannya ada di kalimat terakhir cerita.`,
      ];
    case 1:
      return [
        'Selisih dihitung dari nilai kanan dikurangi nilai kiri. Jika nilainya turun, selisihnya negatif.',
        xStep === 1 ? 'Jika semua selisih sama, laju perubahannya adalah selisih itu.' : `${v} naik ${formatNumber(xStep)} setiap kolom. Bagi selisihnya dengan ${formatNumber(xStep)} untuk mendapat perubahan per 1.`,
        `Setiap selisih bernilai ${formatNumber(diff)}, sehingga laju perubahannya ${formatNumber(problem.step)}.`,
      ];
    case 2:
      return [
        'Nilai awal adalah nilai sebelum ada perubahan apa pun.',
        `Untuk ${v} = ${formatNumber(rows[0].x)}, hitung manual: berapa kali perubahan sudah terjadi sejak nilai awal?`,
        `Satu model yang benar: mulai ${formatNumber(target.start)}, ulangi ${REPEAT_OPTIONS.find((o) => o.id === target.repeat).label(v)} kali, ${target.op === '-' ? 'kurangi' : 'tambah'} ${formatNumber(target.amount)}.`,
      ];
    case 4:
      return [
        'Perhatikan blok perulangan: berapa yang berubah setiap kali, dan berapa kali perulangan berjalan?',
        'Tulis bentuk panjangnya dulu: nilai awal, lalu tambah atau kurangi perubahan dikali banyak perulangan.',
        raw(`Bentuk panjangnya: <span class="math">${longForm(problem)}</span>. Kamu boleh menyederhanakannya.`),
      ];
    case 5:
      return problem.final.direction === 'inverse'
        ? ['Nilai hasilnya sudah diketahui. Tuliskan persamaan: rumusmu = nilai itu.', `Selesaikan persamaan untuk ${v}: pindahkan konstanta, lalu bagi dengan koefisien.`]
        : [`Ganti ${v} dengan nilai yang ditanyakan, lalu hitung.`, 'Untuk refleksi, hubungkan setiap angka di rumus dengan bagian modelmu.'];
    default:
      return [];
  }
}
