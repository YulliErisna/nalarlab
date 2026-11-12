import { html } from '../../core/dom.js';
import { pageHead } from '../../ui/shell.js';
import { MISCONCEPTIONS } from '../../data/misconceptions.js';
import { PROBLEMS } from '../../data/curriculum.js';
import { classData } from './common.js';

export default function library(ctx) {
  const data = classData(ctx.user.kelas);
  const inClass = Object.fromEntries(data.misconceptions.map((m) => [m.id, m]));

  return {
    title: 'Pustaka miskonsepsi',
    crumbs: [{ label: `Kelas ${ctx.user.kelas}`, href: '/guru' }, { label: 'Pustaka miskonsepsi', href: '/guru/miskonsepsi' }],
    render: () => html`
      ${pageHead({ title: 'Pustaka miskonsepsi', lead: 'Delapan pola kesalahan yang dapat dikenali mesin diagnosis NalarLab. Setiap pola dilengkapi penyebab, contoh, dan aktivitas pengajaran ulang.' })}
      <div class="library">${MISCONCEPTIONS.map((m) => {
        const stat = inClass[m.id];
        const missions = PROBLEMS.filter((p) => p.targets.includes(m.id));
        return html`<article class="panel lib-item" id="${m.id}" aria-labelledby="lib-${m.id}">
          <div style="display:grid;gap:0.6rem;align-content:start">
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap">${stat ? html`<span class="badge badge--red">${stat.students.length} siswa, ${stat.count} kali di kelas ${ctx.user.kelas}</span>` : html`<span class="badge">Belum muncul di kelas ini</span>`}</div>
            <h2 class="h3" id="lib-${m.id}">${m.name}</h2>
            <p class="muted">${m.summary}</p>
            ${missions.length ? html`<p class="small"><strong>Dilatih di misi:</strong> ${missions.map((p) => p.title).join(', ')}</p>` : ''}
          </div>
          <dl>
            <div><dt>Contoh</dt><dd>${m.example}</dd></div>
            <div><dt>Mengapa terjadi</dt><dd>${m.why}</dd></div>
            <div><dt>Aktivitas pengajaran ulang</dt><dd>${m.remedy}</dd></div>
            <div><dt>Umpan balik untuk siswa</dt><dd>${m.studentTip}</dd></div>
          </dl>
        </article>`;
      })}</div>`,
    mount() {
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        if (target) setTimeout(() => target.scrollIntoView({ block: 'start' }), 0);
      }
    },
  };
}
