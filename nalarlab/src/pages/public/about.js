import { html } from '../../core/dom.js';
import { icon } from '../../ui/icons.js';

export default function about() {
  return {
    title: 'Tentang demo',
    render: () => html`<div class="container" style="padding-top:3rem">
      <div class="page-head"><div class="page-head__text">
        <h1 class="h1">Tentang demo ini</h1>
        <p class="lead">NalarLab adalah prototipe untuk menunjukkan bagaimana mahasiswa Informatika dapat membangun alat belajar matematika yang menjelaskan kesalahan, bukan hanya menilainya.</p>
      </div></div>

      <div class="evidence" style="align-items:start">
        <div class="prose">
          <h2 class="h3" style="margin-bottom:0.75rem">Apa yang benar-benar berjalan</h2>
          <p>Seluruh logika berjalan di browser: pengurai rumus, mesin simulasi model, diagnosis miskonsepsi, estimasi penguasaan (Bayesian Knowledge Tracing), rekomendasi misi, dan analitik kelas. Tidak ada server, database, kunci API, atau layanan berbayar.</p>
          <p>Setiap grafik dihitung ulang dari riwayat percobaan yang tersimpan, sehingga angka di dasbor siswa dan guru selalu sesuai dengan aktivitas yang terjadi.</p>
          <h2 class="h3" style="margin:1.75rem 0 0.75rem">Data yang dipakai</h2>
          <p><strong>Data simulasi:</strong> 24 teman sekelas di dasbor guru, riwayat awal akun demo, dan semua grafik kelas. Data ini dibangkitkan secara deterministik dan tidak mewakili siswa sungguhan.</p>
          <p><strong>Data resmi:</strong> hanya angka PISA 2025 di halaman depan, dikutip dari OECD (2026), <em>PISA 2025 Results (Volume I), Country Note: Indonesia</em>.</p>
        </div>
        <div class="panel panel--pad" style="display:grid;gap:1rem">
          <h2 class="h3">Keterbatasan simulasi</h2>
          <ul class="feature-list">
            <li>${icon('key')}<div><strong>Login hanya simulasi</strong><p>Akun disimpan di localStorage dan sesi di sessionStorage. Ini bukan sistem keamanan dan tidak boleh dipakai untuk data sungguhan.</p></div></li>
            <li>${icon('database')}<div><strong>Data hanya ada di perangkat ini</strong><p>Progres tidak tersinkron antarperangkat dan hilang jika data browser dihapus. Tersedia tombol reset data demo.</p></div></li>
            <li>${icon('mail')}<div><strong>Tidak ada email yang dikirim</strong><p>Fitur lupa kata sandi hanya menampilkan alur antarmukanya.</p></div></li>
            <li>${icon('flag')}<div><strong>Efek belajar belum diuji</strong><p>Prototipe ini belum melalui uji coba di kelas. Klaim efektivitas memerlukan studi lapangan.</p></div></li>
          </ul>
          <a class="btn btn--secondary" href="/masuk">Masuk ke demo</a>
        </div>
      </div>
    </div>`,
  };
}
