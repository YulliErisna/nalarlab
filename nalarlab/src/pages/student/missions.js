import { html, raw } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { getAttempts, inProgressLabs } from '../../core/progress.js';
import { topicProgress, recommendNext, sortAttempts } from '../../engine/learning.js';
import { TOPICS, UNLOCK_AFTER, ruleCoefficients } from '../../data/curriculum.js';
import { linearHtml } from '../../engine/expression.js';
import { pageHead } from '../../ui/shell.js';

export default function missions(ctx) {
  const attempts = getAttempts(ctx.user.id);
  const progress = topicProgress(attempts);
  const rec = recommendNext(attempts);
  const inProgress = new Set(inProgressLabs(ctx.user.id).map((l) => l.problemId));
  const best = {};
  for (const a of sortAttempts(attempts)) best[a.problemId] = Math.max(best[a.problemId] ?? 0, a.score);

  const card = (problem, unlocked, topicIndex) => {
    const done = best[problem.id] !== undefined;
    const isRec = rec.problem.id === problem.id;
    const { m, c } = ruleCoefficients(problem);
    let status = html`<span class="badge">Belum dimulai</span>`;
    if (!unlocked) status = html`<span class="badge">${icon('lock')}Terkunci</span>`;
    else if (inProgress.has(problem.id)) status = html`<span class="badge badge--amber">Sedang dikerjakan</span>`;
    else if (done) status = html`<span class="badge badge--green">${icon('check')}Selesai, skor ${best[problem.id]}</span>`;
    else if (isRec) status = html`<span class="badge badge--model">Rekomendasi</span>`;

    const body = html`
      <div class="mission__top">${status}</div>
      <h3 class="mission__title">${problem.title}</h3>
      <p class="mission__summary">${problem.summary}</p>
      <div class="mission__foot">
        ${done ? html`<span class="mission__formula">Rumus: <span class="math" style="font-size:1.05rem">${raw(linearHtml(m, c, problem.variable))}</span></span>` : html`<span>Rumus ditemukan setelah misi selesai</span>`}
      </div>`;

    if (!unlocked) {
      return html`<div class="mission is-locked" aria-label="${problem.title}, terkunci">${body}
        <p class="subtle">Selesaikan ${UNLOCK_AFTER} misi ${TOPICS[topicIndex - 1].title} untuk membuka.</p></div>`;
    }
    return html`<a class="mission ${isRec ? 'is-recommended' : ''}" href="/belajar/misi/${problem.id}">${body}</a>`;
  };

  return {
    title: 'Misi',
    crumbs: [{ label: 'Beranda', href: '/belajar' }, { label: 'Misi', href: '/belajar/misi' }],
    render: () => html`
      ${pageHead({ title: 'Misi', lead: 'Tiga topik, sembilan misi. Topik berikutnya terbuka setelah kamu menyelesaikan dua misi di topik sebelumnya.' })}
      ${progress.map(
        (t, index) => html`<section class="topic" aria-labelledby="topic-${t.topic.id}">
          <div class="topic__head">
            <div style="display:grid;gap:0.25rem">
              <h2 class="h2" id="topic-${t.topic.id}">${t.topic.title}</h2>
              <p class="muted small">${t.topic.desc} ${t.topic.grade}.</p>
            </div>
            <div class="topic__progress">
              <span class="tnum">${t.completed} dari ${t.total} selesai</span>
              <span class="meter__track" role="progressbar" aria-valuemin="0" aria-valuemax="${t.total}" aria-valuenow="${t.completed}" aria-label="Progres ${t.topic.title}"><span class="meter__fill meter__fill--berkembang" style="width:${(t.completed / t.total) * 100}%"></span></span>
            </div>
          </div>
          <div class="missions">${t.problems.map((p) => card(p, t.unlocked, index))}</div>
        </section>`,
      )}`,
  };
}
