import { html, raw, on } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';
import { matchsticksSvg } from '../../ui/visuals.js';
import { classRoster } from '../../core/progress.js';
import { MISCONCEPTIONS } from '../../data/misconceptions.js';

const STEPS = [
  { title: 'Pahami', text: 'Pilih informasi yang benar-benar dibutuhkan dari cerita.' },
  { title: 'Cari pola', text: 'Hitung perubahan antarlangkah dan tentukan arti variabel.' },
  { title: 'Bangun model', text: 'Susun blok: nilai awal, perulangan, dan perubahan.' },
  { title: 'Jalankan', text: 'Uji model pada data. Kesalahan muncul sebagai contoh tandingan.' },
  { title: 'Tulis rumus', text: 'Terjemahkan model menjadi notasi matematika yang setara.' },
  { title: 'Tafsirkan', text: 'Pakai rumus untuk menjawab dan jelaskan maknanya.' },
];

function trace(n) {
  const values = [4];
  for (let i = 1; i < n; i += 1) values.push(values[i - 1] + 3);
  const shown = values.length > 5 ? [...values.slice(0, 2), '…', ...values.slice(-2)] : values;
  return shown.join(' → ');
}

function heroBench(n) {
  return html`<div class="bench-demo gridpaper" data-bench>
    <div class="bench-demo__fig" data-fig aria-live="polite">${raw(matchsticksSvg(n, { unit: 30, fresh: n > 1 }))}</div>
    <div class="bench-demo__row">
      <div class="blocks blocks--static" aria-label="Model komputasional">
        <div class="block"><span class="block__kw">mulai</span><span class="block__txt">nilai =</span><span class="block__val block__val--c">4</span></div>
        <div class="block block--loop"><div class="block__row"><span class="block__kw">ulangi</span><span class="block__val">n − 1</span><span class="block__txt">kali</span></div>
          <div class="block block--inner"><span class="block__txt">nilai = nilai +</span><span class="block__val block__val--m">3</span></div></div>
        <div class="block block--end"><span class="block__kw">hasil</span><span class="block__txt" data-trace>${trace(n)}</span></div>
      </div>
      <div class="bench-demo__formula">
        <span class="subtle">Rumus yang setara</span>
        <span class="math"><var>B</var>(<var>n</var>) = <mark class="hl hl-m"><span class="mn">3</span><var>n</var></mark> + <mark class="hl hl-c"><span class="mn">1</span></mark></span>
        <span class="bench-demo__result" data-result>Untuk <var>n</var> = ${n}: 3 × ${n} + 1 = <strong>${3 * n + 1}</strong> batang</span>
        <span class="subtle">Angka 3 berulang setiap langkah. Angka 1 adalah 4 − 3, sisa yang sudah ada sejak awal.</span>
      </div>
    </div>
    <label class="bench-demo__slider"><span>Banyak persegi</span>
      <input class="range" type="range" min="1" max="8" value="${n}" data-n aria-label="Banyak persegi, n" />
      <output class="math" data-n-out><var>n</var> = ${n}</output></label>
  </div>`;
}

function teacherPreview() {
  const roster = classRoster('8A').filter((s) => s.simulated).slice(0, 7);
  const ids = ['off-by-one', 'konstanta-hilang', 'tertukar', 'tanda', 'aditif'];
  const names = Object.fromEntries(MISCONCEPTIONS.map((m) => [m.id, m.name]));
  const level = (c) => (c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : 3);
  return html`<div class="panel panel--pad" aria-label="Pratinjau peta miskonsepsi">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:0.75rem">
      <h3 class="h4">Peta miskonsepsi kelas 8A</h3><span class="badge badge--sim">Data simulasi</span></div>
    <div class="heatmap-wrap"><table class="heatmap">
      <thead><tr><th scope="col"><span class="sr-only">Siswa</span></th>${ids.map((id) => html`<th scope="col"><span>${names[id]}</span></th>`)}</tr></thead>
      <tbody>${roster.map((s) => {
        const counts = Object.fromEntries(ids.map((id) => [id, s.attempts.reduce((sum, a) => sum + a.bugs.filter((b) => b === id).length, 0)]));
        return html`<tr><th scope="row">${s.name.split(' ')[0]}</th>${ids.map((id) => html`<td class="heat-${level(counts[id])}" title="${counts[id]} kali">${counts[id] || ''}</td>`)}</tr>`;
      })}</tbody></table></div>
  </div>`;
}

export default function landing() {
  let n = 4;
  return {
    title: 'Dari kode ke konsep',
    render: () => html`
      <section class="hero">
        <div class="container hero__grid">
          <div class="hero__copy">
            <h1 class="display">Bangun modelnya, temukan rumusnya.</h1>
            <p class="lead">NalarLab adalah lab matematika berbasis web untuk siswa SMP. Siswa menyusun model seperti program kecil, menjalankannya pada data dari situasi nyata, lalu menerjemahkannya menjadi rumus. Setiap kesalahan dibaca sebagai pola yang bisa diperbaiki.</p>
            <div class="hero__actions">
              <a class="btn btn--lg" href="/masuk?demo=siswa">Coba sebagai siswa</a>
              <a class="btn btn--lg btn--secondary" href="/masuk?demo=guru">Lihat dasbor guru</a>
            </div>
            <p class="hero__note">Demo frontend tanpa server. Akun, progres, dan data kelas tersimpan di browsermu dan bisa direset kapan saja.</p>
          </div>
          ${heroBench(n)}
        </div>
      </section>

      <section class="section" aria-labelledby="masalah">
        <div class="container evidence">
          <div>
            <div class="section__head">
              <h2 class="h2" id="masalah">Banyak siswa naik kelas tanpa memahami struktur matematikanya.</h2>
              <p class="muted">Pada PISA 2025, sebagian besar siswa Indonesia usia 15 tahun belum mencapai kemahiran dasar matematika. Masalahnya bukan sekadar latihan yang kurang, tetapi simbol yang dipelajari tanpa makna dan kesalahan yang jarang didiagnosis.</p>
            </div>
            <div class="stat-pair">
              <div class="stat"><span class="stat__num">17%</span><span class="stat__label">siswa Indonesia mencapai Level 2 matematika atau lebih</span></div>
              <div class="stat"><span class="stat__num">65%</span><span class="stat__label">rata-rata negara OECD untuk ukuran yang sama</span></div>
            </div>
            <p class="source">Sumber: OECD (2026), <a href="https://www.oecd.org/en/publications/pisa-2025-results-volume-i-country-notes_2d4ff9ea-en/indonesia_9c880f8a-en.html" target="_blank" rel="noopener">PISA 2025 Results (Volume I), Country Note: Indonesia</a>. Data dikumpulkan tahun 2025, dirilis 8 September 2026.</p>
          </div>
          <div class="hypothesis">
            <h3 class="h3">Gagasan yang sedang diuji</h3>
            <p class="muted">PISA 2025 untuk pertama kalinya mengukur pemecahan masalah komputasional. Kemendikdasmen mencatat siswa Indonesia tampil relatif lebih baik di domain itu dibanding mata pelajaran konvensional.</p>
            <p class="muted">NalarLab bertolak dari satu pertanyaan: dapatkah cara berpikir komputasional menjadi pintu masuk menuju pemahaman matematika? Ini hipotesis desain, bukan klaim hasil. Skor kedua domain memakai skala berbeda, jadi tidak dibandingkan secara langsung.</p>
          </div>
        </div>
      </section>

      <section class="section" id="cara-kerja" aria-labelledby="cara-kerja-title">
        <div class="container">
          <div class="section__head">
            <h2 class="h2" id="cara-kerja-title">Satu misi, enam langkah berpikir.</h2>
            <p class="muted">Setiap misi berangkat dari situasi sehari-hari: kursi aula, tarif ojek, sisa kuota, skala peta. Urutannya sama, sehingga siswa terbiasa dengan cara bernalarnya, bukan dengan bentuk soalnya.</p>
          </div>
          <ol class="steps-line">${STEPS.map((s, i) => html`<li><span class="steps-line__n">${i + 1}</span><h3>${s.title}</h3><p>${s.text}</p></li>`)}</ol>
        </div>
      </section>

      <section class="section" id="untuk-guru" aria-labelledby="guru-title">
        <div class="container split">
          <div>
            <div class="section__head" style="margin-bottom:1.5rem">
              <h2 class="h2" id="guru-title">Guru melihat pola kesalahan, bukan hanya nilai.</h2>
              <p class="muted">Setiap jawaban dicocokkan dengan pustaka miskonsepsi. Guru tahu siapa yang salah menghitung banyak langkah, siapa yang tertukar koefisien dan konstanta, dan materi apa yang perlu diajarkan ulang ke seluruh kelas.</p>
            </div>
            <ul class="feature-list">
              <li>${icon('bug')}<div><strong>Diagnosis yang bisa dijelaskan</strong><p>Bukan sekadar benar atau salah. Sistem menunjukkan contoh tandingan tanpa memberi jawaban.</p></div></li>
              <li>${icon('target')}<div><strong>Jalur belajar yang menyesuaikan</strong><p>Misi berikutnya dipilih dari miskonsepsi yang berulang dan keterampilan yang paling lemah.</p></div></li>
              <li>${icon('shield')}<div><strong>Tanpa AI yang memberi jawaban</strong><p>Umpan balik berbasis aturan dan bukti, agar siswa tetap melakukan proses berpikirnya sendiri.</p></div></li>
            </ul>
          </div>
          ${teacherPreview()}
        </div>
      </section>

      <div class="container">
        <div class="cta-band">
          <h2 class="h2">Coba satu misi. Butuh sekitar sepuluh menit.</h2>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
            <a class="btn btn--lg" href="/masuk?demo=siswa">Masuk sebagai siswa</a>
            <a class="btn btn--lg btn--secondary" href="/daftar">Buat akun baru</a>
          </div>
        </div>
      </div>`,
    mount(root) {
      const update = (value) => {
        n = value;
        root.querySelector('[data-fig]').innerHTML = matchsticksSvg(n, { unit: 30, fresh: n > 1 });
        root.querySelector('[data-trace]').textContent = trace(n);
        root.querySelector('[data-result]').innerHTML = `Untuk <var>n</var> = ${n}: 3 × ${n} + 1 = <strong>${3 * n + 1}</strong> batang`;
        root.querySelector('[data-n-out]').innerHTML = `<var>n</var> = ${n}`;
      };
      return on(root, 'input', '[data-n]', (e, el) => update(Number(el.value)));
    },
  };
}
