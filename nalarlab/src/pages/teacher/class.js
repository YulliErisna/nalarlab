import { html, on, toString } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { pageHead, emptyState, initials } from '../../ui/shell.js';
import { hBars } from '../../ui/charts.js';
import { SKILLS } from '../../data/curriculum.js';
import { MISCONCEPTIONS, misconceptionById } from '../../data/misconceptions.js';
import { relativeDay } from '../../engine/learning.js';
import { classData } from './common.js';

const COLUMNS = [
  { id: 'name', label: 'Siswa' },
  { id: 'completed', label: 'Misi selesai', num: true },
  { id: 'mastery', label: 'Penguasaan rata-rata' },
  { id: 'score', label: 'Skor rata-rata', num: true },
  { id: 'topMis', label: 'Kesalahan dominan' },
  { id: 'last', label: 'Aktivitas terakhir' },
];

export default function classPage(ctx) {
  const kelas = ctx.user.kelas;
  const data = classData(kelas);
  const ui = { sort: 'attention', dir: 1, q: '' };
  const realCount = data.roster.filter((s) => !s.simulated).length;
  const simCount = data.roster.length - realCount;

  const sortValue = (s, key) => {
    switch (key) {
      case 'name': return s.name.toLowerCase();
      case 'completed': return s.summary.completed;
      case 'mastery': return s.masteryAvg ?? -1;
      case 'score': return s.attempts.length ? s.summary.averageScore : -1;
      case 'topMis': return s.topMis ? misconceptionById(s.topMis.id).name : 'zzz';
      case 'last': return s.summary.lastActive ?? 0;
      default: return (s.needsAttention ? 0 : 1) * 10 + (s.masteryAvg ?? 2);
    }
  };

  const rows = () => {
    const q = ui.q.trim().toLowerCase();
    return data.roster
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = sortValue(a, ui.sort);
        const vb = sortValue(b, ui.sort);
        return (va > vb ? 1 : va < vb ? -1 : 0) * ui.dir;
      });
  };

  const table = () => {
    const list = rows();
    return html`<div class="table-wrap"><table class="table">
      <caption class="sr-only">Daftar siswa kelas ${kelas}. Klik judul kolom untuk mengurutkan.</caption>
      <thead><tr>${COLUMNS.map((c) => html`<th scope="col" class="${c.num ? 'num' : ''}" ${ui.sort === c.id ? html`aria-sort="${ui.dir === 1 ? 'ascending' : 'descending'}"` : ''}>
        <button type="button" class="th-sort" data-sort="${c.id}" ${ui.sort === c.id ? html`aria-sort="true"` : ''}>${c.label}${icon('sort')}</button></th>`)}
        <th scope="col">Status</th></tr></thead>
      <tbody>${list.length
        ? list.map((s) => html`<tr>
          <td><div class="student-cell"><span class="avatar ${s.simulated ? 'avatar--sim' : ''}" aria-hidden="true">${initials(s.name)}</span>
            <span><a href="/guru/siswa/${s.id}">${s.name}</a>${s.simulated ? '' : html`<br /><span class="badge badge--model" style="margin-top:0.2rem">Akun demo</span>`}</span></div></td>
          <td class="num">${s.summary.completed}</td>
          <td>${s.masteryAvg === null ? html`<span class="subtle">Belum ada data</span>` : html`<span class="mini-meter" aria-hidden="true"><span style="width:${Math.round(s.masteryAvg * 100)}%"></span></span><span class="tnum">${Math.round(s.masteryAvg * 100)}%</span>`}</td>
          <td class="num">${s.attempts.length ? s.summary.averageScore : '–'}</td>
          <td>${s.topMis ? html`${misconceptionById(s.topMis.id).name} <span class="subtle">(${s.topMis.count}×)</span>` : html`<span class="subtle">–</span>`}</td>
          <td style="white-space:nowrap">${s.summary.lastActive ? relativeDay(s.summary.lastActive) : html`<span class="subtle">Belum mulai</span>`}</td>
          <td>${s.needsAttention ? html`<span class="badge badge--red">Perlu perhatian</span>` : s.attempts.length ? html`<span class="badge badge--green">Sesuai jalur</span>` : html`<span class="badge">Belum aktif</span>`}</td>
        </tr>`)
        : html`<tr><td colspan="7"><p class="muted" style="padding:1rem 0">Tidak ada siswa dengan nama "${ui.q}".</p></td></tr>`}</tbody>
    </table></div>`;
  };

  const heatIds = MISCONCEPTIONS.map((m) => m.id).filter((id) => data.misconceptions.some((m) => m.id === id));
  const heatLevel = (c) => (c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : 3);
  const heatStudents = [...data.active].sort((a, b) => b.attempts.reduce((s, x) => s + x.bugs.length, 0) - a.attempts.reduce((s, x) => s + x.bugs.length, 0)).slice(0, 14);

  const top = data.misconceptions[0];
  const topInfo = top ? misconceptionById(top.id) : null;

  return {
    title: `Kelas ${kelas}`,
    crumbs: [{ label: `Kelas ${kelas}`, href: '/guru' }],
    render: () => html`
      ${pageHead({
        title: `Kelas ${kelas}`,
        lead: data.roster.length ? `Ringkasan belajar ${data.roster.length} siswa. ${simCount ? `${simCount} siswa adalah data simulasi; ${realCount} lainnya akun demo di browser ini.` : ''}` : '',
        actions: data.roster.length ? html`<span class="badge badge--sim">${simCount ? 'Sebagian besar data simulasi' : 'Akun demo lokal'}</span>` : '',
      })}
      ${!data.roster.length
        ? emptyState({ iconName: 'users', title: `Belum ada siswa di kelas ${kelas}`, text: `Siswa yang mendaftar dengan kelas ${kelas} akan muncul di sini setelah menyelesaikan misi. Data kelas simulasi tersedia di kelas 8A; ubah kelas yang diampu di halaman profil untuk melihatnya.`, action: html`<a class="btn" href="/akun">Buka profil</a>` })
        : html`
        <section class="panel class-strip" aria-label="Ringkasan kelas">
          <div><span class="quick-stats__num">${data.roster.length}</span><span class="quick-stats__label">Siswa, ${data.active.length} sudah aktif</span></div>
          <div><span class="quick-stats__num">${data.completedTotal}</span><span class="quick-stats__label">Misi diselesaikan</span></div>
          <div><span class="quick-stats__num">${Math.round(data.masteryAverage * 100)}%</span><span class="quick-stats__label">Rata-rata penguasaan</span></div>
          <div><span class="quick-stats__num">${data.roster.filter((s) => s.needsAttention).length}</span><span class="quick-stats__label">Perlu perhatian</span></div>
        </section>

        ${top
          ? html`<section class="reteach gridpaper" style="margin-top:1.25rem" aria-labelledby="reteach-title">
            <div style="display:grid;gap:0.6rem;align-content:start">
              <span class="reteach__label">Saran mengajar ulang untuk seluruh kelas</span>
              <h2 class="h2" id="reteach-title">${topInfo.name}</h2>
              <p class="muted">${top.students.length} dari ${data.active.length} siswa aktif menunjukkan pola ini, total ${top.count} kali. ${topInfo.why}</p>
              <p class="small"><strong>Siswa terdampak:</strong> ${top.students.slice(0, 6).map((s) => s.name.split(' ')[0]).join(', ')}${top.students.length > 6 ? `, dan ${top.students.length - 6} lainnya` : ''}.</p>
            </div>
            <div class="bench__card" style="display:grid;gap:0.6rem;align-content:start">
              <h3 class="h4">${icon('bulb')} Aktivitas yang disarankan</h3>
              <p class="small">${topInfo.remedy}</p>
              <p class="small muted">Contoh kesalahan: ${topInfo.example}</p>
              <a class="link small" href="/guru/miskonsepsi#${top.id}">Buka di pustaka miskonsepsi</a>
            </div>
          </section>`
          : ''}

        <div class="charts-grid" style="margin-top:1.25rem">
          <section class="panel" aria-labelledby="heat-title">
            <div class="panel__head"><h2 class="h3" id="heat-title">Peta miskonsepsi</h2><span class="subtle">Siswa dengan kesalahan terbanyak</span></div>
            <div class="panel__body" style="display:grid;gap:0.85rem">
              ${heatStudents.length && heatIds.length
                ? html`<div class="heatmap-wrap"><table class="heatmap">
                    <caption class="sr-only">Jumlah kemunculan setiap miskonsepsi per siswa</caption>
                    <thead><tr><th scope="col"><span class="sr-only">Siswa</span></th>${heatIds.map((id) => html`<th scope="col"><span>${misconceptionById(id).name}</span></th>`)}</tr></thead>
                    <tbody>${heatStudents.map((s) => {
                      const counts = Object.fromEntries(s.summary.misconceptions.map((m) => [m.id, m.count]));
                      return html`<tr><th scope="row"><a class="link" style="font-weight:500;text-decoration:none" href="/guru/siswa/${s.id}">${s.name.split(' ').slice(0, 2).join(' ')}</a></th>
                        ${heatIds.map((id) => html`<td class="heat-${heatLevel(counts[id] || 0)}" aria-label="${misconceptionById(id).name}: ${counts[id] || 0} kali">${counts[id] || ''}</td>`)}</tr>`;
                    })}</tbody></table></div>
                    <div class="heat-scale" aria-hidden="true"><span><i class="heat-1"></i>1 kali</span><span><i class="heat-2"></i>2 kali</span><span><i class="heat-3"></i>3 kali atau lebih</span></div>`
                : html`<p class="muted">Belum ada kesalahan yang terdiagnosis di kelas ini.</p>`}
            </div>
          </section>
          <section class="panel" aria-labelledby="skills-title">
            <div class="panel__head"><h2 class="h3" id="skills-title">Penguasaan kelas per keterampilan</h2></div>
            <div class="panel__body">
              ${hBars(SKILLS.map((s) => ({ label: s.name, value: Math.round(data.skillAverages[s.id] * 100) })), { max: 100, format: (v) => `${v}%` })}
              <p class="subtle" style="margin-top:1rem">Rata-rata dari siswa yang sudah aktif. Keterampilan dengan nilai terendah adalah prioritas pembahasan di kelas.</p>
            </div>
          </section>
        </div>

        <section style="margin-top:1.5rem" aria-labelledby="roster-title">
          <div class="toolbar">
            <h2 class="h3" id="roster-title">Daftar siswa</h2>
            <label class="search"><span class="sr-only">Cari siswa</span>${icon('search')}<input class="input" type="search" placeholder="Cari nama siswa" data-search /></label>
          </div>
          <div data-table>${table()}</div>
        </section>`}`,
    mount(root) {
      const host = () => root.querySelector('[data-table]');
      const offs = [
        on(root, 'click', '[data-sort]', (e, btn) => {
          const key = btn.dataset.sort;
          ui.dir = ui.sort === key ? -ui.dir : key === 'mastery' || key === 'completed' || key === 'score' || key === 'last' ? -1 : 1;
          ui.sort = key;
          host().innerHTML = toString(table());
          root.querySelector(`[data-sort="${key}"]`)?.focus();
        }),
        on(root, 'input', '[data-search]', (e, input) => {
          ui.q = input.value;
          host().innerHTML = toString(table());
        }),
      ];
      return () => offs.forEach((off) => off());
    },
  };
}
