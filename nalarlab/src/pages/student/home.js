import { html } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { getAttempts, inProgressLabs } from '../../core/progress.js';
import { studentSummary, recommendNext, formatDuration, relativeDay, sortAttempts } from '../../engine/learning.js';
import { problemById, topicById, PROBLEMS } from '../../data/curriculum.js';
import { misconceptionById } from '../../data/misconceptions.js';
import { emptyState } from '../../ui/shell.js';
import { recommendationReason, skillMeters, bktTip } from './common.js';

const STEP_NAMES = ['Pahami masalah', 'Variabel & pola', 'Bangun model', 'Jalankan simulasi', 'Tulis rumus', 'Jawab & refleksi'];

export default function home(ctx) {
  const user = ctx.user;
  const attempts = getAttempts(user.id);
  const summary = studentSummary(attempts);
  const rec = recommendNext(attempts);
  const resume = inProgressLabs(user.id)[0];
  const resumeProblem = resume ? problemById(resume.problemId) : null;
  const firstName = user.name.split(' ')[0];
  const recent = sortAttempts(attempts).slice(-4).reverse();

  return {
    title: 'Beranda',
    crumbs: [{ label: 'Beranda', href: '/belajar' }],
    render: () => html`
      <div class="page-head"><div class="page-head__text">
        <h1 class="h1">Halo, ${firstName}.</h1>
        <p class="lead">${attempts.length ? 'Lanjutkan misi terakhir atau ikuti rekomendasi berikutnya.' : 'Mulai dari misi pertama. Setiap langkah punya umpan balik, jadi kamu bisa belajar dari kesalahan.'}</p>
      </div></div>

      <div class="dash">
        <div class="dash__col">
          ${resumeProblem
            ? html`<div class="resume">
                <div class="resume__text"><strong>Kamu berhenti di langkah "${STEP_NAMES[resume.step] || STEP_NAMES[0]}"</strong>
                <span class="muted">Misi ${resumeProblem.title}. Isianmu sudah tersimpan.</span></div>
                <a class="btn" href="/belajar/misi/${resumeProblem.id}">Lanjutkan misi</a>
              </div>`
            : ''}

          <section class="next-mission gridpaper" aria-labelledby="next-title">
            <div>
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem">
                <span class="badge badge--model">${topicById(rec.problem.topic).title}</span>
                <span class="badge">Rekomendasi berikutnya</span>
              </div>
              <h2 class="h2" id="next-title">${rec.problem.title}</h2>
              <p class="muted" style="margin-top:0.35rem">${rec.problem.summary}</p>
              <p class="next-mission__why">${icon('target')}<span>${recommendationReason(rec, summary)}</span></p>
            </div>
            <a class="btn btn--lg" href="/belajar/misi/${rec.problem.id}">${rec.reason === 'review' ? 'Ulangi misi' : 'Mulai misi'}</a>
          </section>

          <section class="panel quick-stats" aria-label="Ringkasan">
            <div><span class="quick-stats__num">${summary.completed}<span class="subtle" style="font-family:var(--font-ui)"> / ${PROBLEMS.length}</span></span><span class="quick-stats__label">Misi selesai</span></div>
            <div><span class="quick-stats__num">${formatDuration(summary.totalSeconds)}</span><span class="quick-stats__label">Waktu belajar</span></div>
            <div><span class="quick-stats__num">${attempts.length ? summary.averageScore : '–'}</span><span class="quick-stats__label">Skor rata-rata</span></div>
          </section>

          <section class="panel" aria-labelledby="activity-title">
            <div class="panel__head"><h2 class="h3" id="activity-title">Aktivitas terbaru</h2><a class="link small" href="/belajar/progres">Lihat semua</a></div>
            <div class="panel__body">
              ${recent.length
                ? html`<ul class="activity">${recent.map((a) => html`<li>
                    <span class="activity__dot" aria-hidden="true"></span>
                    <span><strong>${problemById(a.problemId)?.title}</strong><br /><span class="subtle">${relativeDay(a.finishedAt)}, ${formatDuration(a.durationSec)}${a.bugs.length ? `, ${a.bugs.length} kesalahan terdiagnosis` : ''}</span></span>
                    <span class="badge ${a.score >= 80 ? 'badge--green' : a.score >= 50 ? 'badge--amber' : 'badge--red'}">Skor ${a.score}</span>
                  </li>`)}</ul>`
                : emptyState({ iconName: 'clock', title: 'Belum ada aktivitas', text: 'Riwayat misi akan muncul di sini setelah kamu menyelesaikan misi pertama.' })}
            </div>
          </section>
        </div>

        <div class="dash__col">
          <section class="panel" aria-labelledby="skills-title">
            <div class="panel__head"><h2 class="h3" id="skills-title" style="display:flex;align-items:center;gap:0.35rem">Penguasaan ${bktTip}</h2></div>
            <div class="panel__body">
              ${attempts.length
                ? skillMeters(summary.mastery, { compact: true })
                : emptyState({ iconName: 'chart', title: 'Belum ada data', text: 'Penguasaan lima keterampilan dihitung setelah misi pertama selesai.' })}
            </div>
          </section>

          <section class="panel" aria-labelledby="mis-title">
            <div class="panel__head"><h2 class="h3" id="mis-title">Kesalahan yang sering muncul</h2></div>
            <div class="panel__body">
              ${summary.misconceptions.length
                ? html`<ul class="mis-list">${summary.misconceptions.slice(0, 3).map((m) => {
                    const info = misconceptionById(m.id);
                    return html`<li><span class="mis-list__name">${info.name}</span><span class="badge badge--red">${m.count} kali</span><span class="mis-list__tip">${info.studentTip}</span></li>`;
                  })}</ul>`
                : emptyState({ iconName: 'bug', title: 'Belum ada pola kesalahan', text: 'Saat kamu keliru, NalarLab mencocokkannya dengan pustaka miskonsepsi dan memberi saran latihan.' })}
            </div>
          </section>
        </div>
      </div>`,
  };
}
