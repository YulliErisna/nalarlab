import { html } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { emptyState, initials } from '../../ui/shell.js';
import { lineChart } from '../../ui/charts.js';
import { problemById, PROBLEMS } from '../../data/curriculum.js';
import { misconceptionById } from '../../data/misconceptions.js';
import { recommendNext, sortAttempts, formatDuration, formatDateTime, formatDate } from '../../engine/learning.js';
import { skillMeters, misconceptionBadges } from '../student/common.js';
import { classData } from './common.js';

export default function studentDetail(ctx) {
  const data = classData(ctx.user.kelas);
  const s = data.roster.find((x) => x.id === ctx.params.id);
  const crumbs = [{ label: `Kelas ${ctx.user.kelas}`, href: '/guru' }, { label: s ? s.name : 'Siswa', href: ctx.path }];

  if (!s) {
    return {
      title: 'Siswa tidak ditemukan',
      crumbs,
      render: () => emptyState({ iconName: 'users', title: 'Siswa tidak ditemukan', text: 'Siswa ini tidak ada di kelas yang kamu ampu.', action: html`<a class="btn" href="/guru">Kembali ke kelas</a>` }),
    };
  }

  const attempts = sortAttempts(s.attempts);
  const rec = recommendNext(attempts);
  const top = s.topMis ? misconceptionById(s.topMis.id) : null;

  return {
    title: s.name,
    crumbs,
    render: () => html`
      <div class="page-head">
        <div style="display:flex;gap:1rem;align-items:center">
          <span class="avatar avatar--lg ${s.simulated ? 'avatar--sim' : ''}" aria-hidden="true">${initials(s.name)}</span>
          <div class="page-head__text"><h1 class="h1">${s.name}</h1>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap">${s.simulated ? html`<span class="badge badge--sim">Siswa simulasi</span>` : html`<span class="badge badge--model">Akun demo lokal</span>`}
              <span class="badge">Kelas ${s.kelas}</span>${s.needsAttention ? html`<span class="badge badge--red">Perlu perhatian</span>` : ''}</div></div>
        </div>
        <a class="btn btn--secondary" href="/guru">${icon('arrowLeft')}Kembali ke kelas</a>
      </div>
      ${!attempts.length
        ? emptyState({ iconName: 'clock', title: 'Belum ada aktivitas', text: `${s.name.split(' ')[0]} belum menyelesaikan misi. Data akan muncul setelah misi pertama selesai.` })
        : html`
        <section class="panel class-strip" aria-label="Ringkasan siswa">
          <div><span class="quick-stats__num">${s.summary.completed}<span class="subtle" style="font-family:var(--font-ui)"> / ${PROBLEMS.length}</span></span><span class="quick-stats__label">Misi selesai</span></div>
          <div><span class="quick-stats__num">${s.summary.averageScore}</span><span class="quick-stats__label">Skor rata-rata</span></div>
          <div><span class="quick-stats__num">${formatDuration(s.summary.totalSeconds)}</span><span class="quick-stats__label">Waktu belajar</span></div>
          <div><span class="quick-stats__num">${s.summary.hints}</span><span class="quick-stats__label">Petunjuk dipakai</span></div>
        </section>
        <div class="dash" style="margin-top:1.25rem">
          <div class="dash__col">
            ${top
              ? html`<section class="reteach" aria-labelledby="int-title">
                <div style="display:grid;gap:0.5rem;align-content:start"><span class="reteach__label">Saran intervensi</span>
                  <h2 class="h3" id="int-title">${top.name} (${s.topMis.count}×)</h2><p class="small muted">${top.why}</p></div>
                <div style="display:grid;gap:0.5rem;align-content:start"><p class="small">${top.remedy}</p>
                  <p class="small"><strong>Misi berikutnya yang disarankan:</strong> ${rec.problem.title}</p></div>
              </section>`
              : ''}
            <section class="panel" aria-labelledby="trend-title">
              <div class="panel__head"><h2 class="h3" id="trend-title">Rata-rata penguasaan per misi</h2></div>
              <div class="panel__body">${lineChart({ labels: s.summary.mastery.history.map((h) => formatDate(h.at)), series: [{ name: 'Rata-rata penguasaan', values: s.summary.mastery.history.map((h) => h.average) }], title: `Perkembangan penguasaan ${s.name}` })}</div>
            </section>
            <section aria-labelledby="hist-title">
              <h2 class="h3" id="hist-title" style="margin-bottom:0.75rem">Riwayat misi</h2>
              <div class="table-wrap"><table class="table">
                <thead><tr><th scope="col">Waktu</th><th scope="col">Misi</th><th scope="col" class="num">Skor</th><th scope="col" class="num">Durasi</th><th scope="col">Kesalahan</th></tr></thead>
                <tbody>${[...attempts].reverse().map((a) => html`<tr><td style="white-space:nowrap">${formatDateTime(a.finishedAt)}</td><td>${problemById(a.problemId)?.title}</td>
                  <td class="num">${a.score}</td><td class="num">${formatDuration(a.durationSec)}</td><td>${misconceptionBadges(a.bugs)}</td></tr>`)}</tbody>
              </table></div>
            </section>
          </div>
          <div class="dash__col">
            <section class="panel" aria-labelledby="skill-title">
              <div class="panel__head"><h2 class="h3" id="skill-title">Penguasaan keterampilan</h2></div>
              <div class="panel__body">${skillMeters(s.summary.mastery, { compact: true })}</div>
            </section>
            <section class="panel" aria-labelledby="mc-title">
              <div class="panel__head"><h2 class="h3" id="mc-title">Pola kesalahan</h2></div>
              <div class="panel__body">${s.summary.misconceptions.length
                ? html`<ul class="mis-list">${s.summary.misconceptions.map((m) => html`<li><span class="mis-list__name">${misconceptionById(m.id).name}</span><span class="badge badge--red">${m.count}×</span></li>`)}</ul>`
                : html`<p class="muted">Tidak ada pola kesalahan yang terdiagnosis.</p>`}</div>
            </section>
          </div>
        </div>`}`,
  };
}
