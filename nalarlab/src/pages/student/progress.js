import { html, on, toString } from '../../core/dom.js';
import { getAttempts } from '../../core/progress.js';
import { studentSummary, sortAttempts, formatDuration, formatDateTime, formatDate } from '../../engine/learning.js';
import { SKILLS, problemById } from '../../data/curriculum.js';
import { misconceptionById } from '../../data/misconceptions.js';
import { lineChart, hBars } from '../../ui/charts.js';
import { pageHead, emptyState } from '../../ui/shell.js';
import { skillMeters, misconceptionBadges, bktTip } from './common.js';

export default function progressPage(ctx) {
  const attempts = sortAttempts(getAttempts(ctx.user.id));
  const summary = studentSummary(attempts);
  let view = 'average';

  const chart = () => {
    const history = summary.mastery.history;
    const labels = history.map((h) => formatDate(h.at));
    const skill = SKILLS.find((s) => s.id === view);
    const series = skill
      ? [{ name: skill.name, values: history.map((h) => h.values[skill.id]) }]
      : [{ name: 'Rata-rata penguasaan', values: history.map((h) => h.average) }];
    return lineChart({ labels, series, title: skill ? `Penguasaan ${skill.name} per misi` : 'Rata-rata penguasaan per misi', desc: 'Satu titik untuk setiap misi yang selesai' });
  };

  const tabs = () => html`<div class="tabs" role="tablist" aria-label="Pilih keterampilan">
    <button type="button" class="tab" role="tab" aria-selected="${view === 'average'}" data-view="average">Rata-rata</button>
    ${SKILLS.map((s) => html`<button type="button" class="tab" role="tab" aria-selected="${view === s.id}" data-view="${s.id}">${s.short}</button>`)}
  </div>`;

  return {
    title: 'Progres belajar',
    crumbs: [{ label: 'Beranda', href: '/belajar' }, { label: 'Progres belajar', href: '/belajar/progres' }],
    render: () => html`
      ${pageHead({ title: 'Progres belajar', lead: 'Semua angka di halaman ini dihitung dari riwayat misimu sendiri dan tersimpan di browser ini.' })}
      ${!attempts.length
        ? emptyState({ iconName: 'chart', title: 'Grafik progres masih kosong', text: 'Selesaikan satu misi untuk melihat penguasaan keterampilan, pola kesalahan, dan riwayat belajarmu.', action: html`<a class="btn" href="/belajar/misi">Pilih misi</a>` })
        : html`
          <section class="panel class-strip" aria-label="Ringkasan" style="margin-bottom:1.25rem">
            <div><span class="quick-stats__num">${summary.completed}</span><span class="quick-stats__label">Misi selesai</span></div>
            <div><span class="quick-stats__num">${summary.averageScore}</span><span class="quick-stats__label">Skor rata-rata</span></div>
            <div><span class="quick-stats__num">${formatDuration(summary.totalSeconds)}</span><span class="quick-stats__label">Total waktu</span></div>
            <div><span class="quick-stats__num">${summary.hints}</span><span class="quick-stats__label">Petunjuk dipakai</span></div>
          </section>

          <div class="charts-grid">
            <section class="panel" aria-labelledby="trend-title">
              <div class="panel__head" style="flex-wrap:wrap"><h2 class="h3" id="trend-title" style="display:flex;align-items:center;gap:0.35rem">Perkembangan penguasaan ${bktTip}</h2></div>
              <div class="panel__body" style="display:grid;gap:1rem">
                <div data-tabs>${tabs()}</div>
                <div data-chart>${chart()}</div>
              </div>
            </section>
            <section class="panel" aria-labelledby="skill-title">
              <div class="panel__head"><h2 class="h3" id="skill-title">Lima keterampilan</h2></div>
              <div class="panel__body">${skillMeters(summary.mastery)}</div>
            </section>
          </div>

          <section class="panel" style="margin-top:1.25rem" aria-labelledby="mc-title">
            <div class="panel__head"><h2 class="h3" id="mc-title">Pola kesalahan yang terdiagnosis</h2></div>
            <div class="panel__body">
              ${summary.misconceptions.length
                ? hBars(summary.misconceptions.map((m) => ({ label: misconceptionById(m.id).name, value: m.count })), { format: (v) => `${v}×` })
                : html`<p class="muted">Belum ada kesalahan yang terdiagnosis. Bagus.</p>`}
            </div>
          </section>

          <section style="margin-top:1.25rem" aria-labelledby="hist-title">
            <h2 class="h3" id="hist-title" style="margin-bottom:0.75rem">Riwayat misi</h2>
            <div class="table-wrap"><table class="table">
              <thead><tr><th scope="col">Waktu</th><th scope="col">Misi</th><th scope="col" class="num">Skor</th><th scope="col" class="num">Durasi</th><th scope="col" class="num">Petunjuk</th><th scope="col">Kesalahan terdiagnosis</th></tr></thead>
              <tbody>${[...attempts].reverse().map((a) => html`<tr>
                <td style="white-space:nowrap">${formatDateTime(a.finishedAt)}</td>
                <td><a class="link" href="/belajar/misi/${a.problemId}">${problemById(a.problemId)?.title}</a></td>
                <td class="num">${a.score}</td><td class="num">${formatDuration(a.durationSec)}</td><td class="num">${a.hints}</td>
                <td>${misconceptionBadges(a.bugs)}</td></tr>`)}</tbody>
            </table></div>
          </section>`}`,
    mount(root) {
      return on(root, 'click', '[data-view]', (e, btn) => {
        view = btn.dataset.view;
        root.querySelector('[data-tabs]').innerHTML = toString(tabs());
        root.querySelector('[data-chart]').innerHTML = toString(chart());
        root.querySelector(`[data-view="${view}"]`)?.focus();
      });
    },
  };
}
