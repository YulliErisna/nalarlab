import { html, raw } from '../../core/dom.js';
import { pageHead } from '../../ui/shell.js';
import { TOPICS, problemsByTopic, ruleCoefficients } from '../../data/curriculum.js';
import { misconceptionById } from '../../data/misconceptions.js';
import { linearHtml, formatNumber } from '../../engine/expression.js';
import { correctModel, describeModel } from '../../engine/model.js';
import { classData } from './common.js';

export default function bank(ctx) {
  const data = classData(ctx.user.kelas);
  const doneBy = {};
  for (const s of data.roster) for (const a of s.attempts) (doneBy[a.problemId] ||= new Set()).add(s.id);

  return {
    title: 'Bank misi',
    crumbs: [{ label: `Kelas ${ctx.user.kelas}`, href: '/guru' }, { label: 'Bank misi', href: '/guru/misi' }],
    render: () => html`
      ${pageHead({ title: 'Bank misi', lead: 'Kunci jawaban dan model acuan untuk setiap misi. Halaman ini hanya terlihat oleh akun guru.' })}
      ${TOPICS.map((topic) => html`<section class="topic" aria-labelledby="bank-${topic.id}">
        <div class="topic__head"><h2 class="h2" id="bank-${topic.id}">${topic.title}</h2><p class="muted small">${topic.desc}</p></div>
        <div class="table-wrap"><table class="table">
          <thead><tr><th scope="col">Misi</th><th scope="col">Rumus acuan</th><th scope="col">Model acuan</th><th scope="col">Jawaban akhir</th><th scope="col">Melatih</th><th scope="col" class="num">Diselesaikan</th></tr></thead>
          <tbody>${problemsByTopic(topic.id).map((p) => {
            const { m, c } = ruleCoefficients(p);
            return html`<tr>
              <td><strong>${p.title}</strong><br /><span class="subtle">${p.summary}</span></td>
              <td><span class="math">${raw(`<var>${p.outputSymbol}</var> = `)}${raw(linearHtml(m, c, p.variable, { highlight: true }))}</span></td>
              <td class="small">${describeModel(correctModel(p), p)}</td>
              <td class="tnum">${formatNumber(p.final.answer)} ${p.final.unit === 'minggu ke-' ? '(minggu ke-)' : p.final.unit}</td>
              <td>${p.targets.map((t) => html`<span class="badge" style="margin:0.1rem 0.25rem 0.1rem 0">${misconceptionById(t).name}</span>`)}</td>
              <td class="num">${doneBy[p.id]?.size || 0} siswa</td>
            </tr>`;
          })}</tbody></table></div>
      </section>`)}`,
  };
}
