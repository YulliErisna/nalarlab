# NalarLab — Dari kode ke konsep

NalarLab adalah **demo web lab matematika** untuk siswa SMP. Siswa menyusun **model komputasional** (seperti program kecil), menjalankannya pada data dari situasi nyata, lalu **menerjemahkannya menjadi rumus**. Setiap kesalahan dicocokkan dengan pustaka miskonsepsi sehingga siswa dan guru tahu *mengapa* jawabannya keliru, bukan hanya *bahwa* jawabannya keliru.

Proyek ini adalah prototipe pendamping esai kompetisi bertema *"The Role of the Youth Generation in Realizing Quality Education"*.

> **Frontend-only.** Tanpa backend, tanpa database, tanpa API key, tanpa layanan berbayar, dan **tanpa dependensi npm**. Semua logika berjalan di browser.

---

## Daftar isi

- [Fitur](#fitur)
- [Akun demo](#akun-demo)
- [Menjalankan secara lokal](#menjalankan-secara-lokal)
- [Build produksi](#build-produksi)
- [Push ke GitHub](#push-ke-github)
- [Deploy ke Vercel atau Netlify](#deploy-ke-vercel-atau-netlify)
- [Struktur folder](#struktur-folder)
- [Arsitektur](#arsitektur)
- [Pengujian](#pengujian)
- [Data dan sumber](#data-dan-sumber)
- [Keterbatasan simulasi](#keterbatasan-simulasi)
- [Lisensi](#lisensi)

---

## Fitur

### Untuk siswa

| Fitur | Yang bisa dicoba |
|---|---|
| **Lab 6 langkah** | Pahami masalah → variabel & pola → bangun model → jalankan simulasi → tulis rumus → jawab & refleksi. |
| **Blok model yang bisa dijalankan** | Atur nilai awal, banyak perulangan (`n − 1`, `n`, `n + 1`), operasi, dan besar perubahan. Bisa dilihat sebagai kode JavaScript. |
| **Simulasi langkah demi langkah** | Jejak eksekusi perulangan, tabel uji terhadap data, dan grafik data vs. model. |
| **Diagnosis kesalahan** | 8 pola miskonsepsi (misalnya *salah hitung banyak langkah*, *koefisien dan konstanta tertukar*, *penalaran aditif pada proporsi*). Umpan balik berupa contoh tandingan, bukan kunci jawaban. |
| **Pengurai rumus** | Menerima bentuk setara apa pun (`4n + 8`, `12 + 4(n − 1)`, `4×n+8`, koma desimal), dengan pratinjau tipografi langsung dan papan simbol. |
| **Petunjuk bertingkat** | Tiga tingkat petunjuk per langkah. Memakai petunjuk tercatat dalam skor. |
| **Jalur adaptif** | Rekomendasi misi berikutnya berdasarkan miskonsepsi yang berulang dan keterampilan terlemah. Topik terbuka bertahap. |
| **Progres** | Penguasaan 5 keterampilan (Bayesian Knowledge Tracing), grafik perkembangan per keterampilan, pola kesalahan, dan riwayat misi. |
| **Lanjutkan kapan saja** | Isian misi tersimpan otomatis dan tetap ada setelah halaman di-refresh. |

### Untuk guru

| Fitur | Yang bisa dicoba |
|---|---|
| **Ringkasan kelas** | Jumlah siswa aktif, misi selesai, rata-rata penguasaan, dan siswa yang perlu perhatian. |
| **Saran mengajar ulang** | Miskonsepsi yang paling banyak muncul, siswa terdampak, dan aktivitas yang disarankan. |
| **Peta miskonsepsi** | Heatmap siswa × miskonsepsi. |
| **Daftar siswa** | Bisa dicari dan diurutkan per kolom. Ada halaman detail per siswa dengan saran intervensi. |
| **Pustaka miskonsepsi & bank misi** | Penjelasan setiap pola kesalahan dan kunci jawaban setiap misi. |

### Konten

- 3 topik: **Pola & barisan**, **Fungsi linear**, dan **Rasio & proporsi**.
- 9 misi kontekstual: kursi aula, batang korek, tabungan, tarif ojek, kuota internet, suhu pendakian, es teh, skala peta, dan sepeda.
- Kebenaran matematis setiap misi dijaga oleh tes otomatis (`tests/content.test.js`).

---

## Akun demo

Semua akun demo memakai kata sandi **`nalar123`**.

| Peran | Email | Isi |
|---|---|---|
| Siswa | `siswa@nalarlab.demo` | Raka Pratama: 4 misi selesai dan 1 misi yang sedang berjalan (bisa dilanjutkan). |
| Siswa baru | `nadia@nalarlab.demo` | Nadia Putri: belum punya riwayat, untuk melihat tampilan kosong (*empty state*). |
| Guru | `guru@nalarlab.demo` | Sari Wulandari: kelas 8A berisi 24 siswa simulasi ditambah akun siswa lokal. |

Di halaman **Masuk**, ada tombol untuk langsung masuk dengan akun demo. Kamu juga bisa **membuat akun baru** di `/daftar` sebagai siswa atau guru.

> ⚠️ **Autentikasi ini hanya simulasi frontend.** Akun disimpan di `localStorage` dan sesi di `sessionStorage`. Kata sandi disimpan sebagai hash non-kriptografis (FNV-1a), sehingga **tidak aman**. Jangan memakai kata sandi sungguhan dan jangan pakai pola ini di produksi.

**Reset data demo:** menu pengguna (pojok kanan atas) atau halaman **Profil & data demo**, lalu pilih **Reset data demo**. Akun baru, progres, dan riwayat dihapus, lalu data awal dipulihkan.

---

## Menjalankan secara lokal

Prasyarat: **Node.js 18.17 atau lebih baru** (disarankan versi 20 atau 22).

```bash
npm install     # tidak mengunduh apa pun: proyek ini tanpa dependensi
npm run dev     # http://localhost:5173 (dengan live reload)
```

Port bisa diubah: `PORT=3000 npm run dev`.

## Build produksi

```bash
npm run build     # memeriksa sintaks semua modul + import, lalu menulis ke dist/
npm run preview   # menyajikan dist/ di http://localhost:4173
npm test          # 14 tes unit untuk mesin diagnosis dan konten
```

`npm run build` **gagal** (exit code 1) jika ada error sintaks, import yang tidak ditemukan, atau aset CSS yang hilang.

---

## Push ke GitHub

```bash
git init
git add .
git commit -m "NalarLab: demo lab matematika berbasis computational problem-solving"
git branch -M main
git remote add origin https://github.com/<username>/nalarlab.git
git push -u origin main
```

`.gitignore` sudah mengecualikan `node_modules/`, `dist/`, log, file editor, dan `.env*`. Repositori ini tidak berisi credential, API key, file database, atau konfigurasi backend.

---

## Deploy ke Vercel atau Netlify

Proyek ini adalah **situs statis**. Routing di sisi klien sudah dilengkapi *fallback* supaya halaman seperti `/belajar/misi/kursi-aula` tidak menghasilkan 404 saat di-refresh.

### Vercel

1. Import repositori di [vercel.com/new](https://vercel.com/new).
2. Pengaturan dibaca otomatis dari `vercel.json`: build command `npm run build`, output directory `dist`, serta rewrite semua rute ke `index.html`.
3. Klik **Deploy**. Tidak perlu environment variable.

Lewat CLI: `npx vercel --prod`.

### Netlify

1. **Add new site → Import an existing project**, lalu pilih repositori.
2. Pengaturan dibaca dari `netlify.toml`: build `npm run build`, publish `dist`. Fallback SPA juga ditulis ke `dist/_redirects`.
3. Klik **Deploy**.

Lewat drag-and-drop: jalankan `npm run build`, lalu seret folder `dist/` ke [app.netlify.com/drop](https://app.netlify.com/drop).

---

## Struktur folder

```
nalarlab/
├── index.html                # Entry HTML
├── package.json              # Skrip npm, tanpa dependensi
├── vercel.json / netlify.toml
├── public/                   # Disalin apa adanya ke dist/
│   ├── favicon.svg
│   ├── _redirects            # Fallback SPA untuk Netlify
│   └── fonts/                # Inter + Latin Modern (WOFF, dengan lisensi)
├── scripts/
│   ├── serve.mjs             # Server dev/preview + SPA fallback + live reload
│   └── build.mjs             # Validasi modul & import, lalu salin ke dist/
├── src/
│   ├── main.js               # Daftar rute + aksi global (logout, reset)
│   ├── core/                 # dom (templating), storage, auth, router, progress
│   ├── engine/               # expression (parser), model, diagnose, learning (BKT)
│   ├── data/                 # curriculum, misconceptions, seed, classSim
│   ├── ui/                   # icons, shell (layout), charts, visuals, feedback
│   ├── pages/
│   │   ├── public/           # landing, about, login, register, forgot, 404
│   │   ├── student/          # home, missions, lab, lab-steps, progress
│   │   ├── teacher/          # class, student, library, bank
│   │   └── shared/           # account
│   └── styles/               # base, components, layout, lab, pages
└── tests/                    # node:test — engine.test.js, content.test.js
```

---

## Arsitektur

**Teknologi:** JavaScript (ES modules) murni, CSS dengan design tokens, SVG, dan Node.js untuk skrip dev/build. Tidak memakai framework atau bundler.

Alasannya: demo ini harus bisa di-*clone*, dijalankan, dan di-*deploy* tanpa langkah instalasi yang bisa gagal, serta tanpa dependensi yang perlu dipelihara. Seluruh kode bisa dibaca dari `src/` apa adanya.

- **Routing:** History API dengan *guard* berbasis status login dan peran (`student`, `teacher`, `any`). Halaman dimuat secara *lazy* lewat `import()`.
- **Templating:** *tagged template* `html` yang meng-*escape* semua nilai interpolasi untuk mencegah XSS dari input pengguna.
- **State:** state lokal per halaman, ditambah persistensi:
  - `localStorage`: `users`, `attempts:<userId>`, `lab:<userId>:<missionId>` (misi berjalan)
  - `sessionStorage`: `session`
  - Semua kunci berawalan `nalarlab:v1:`. Akses storage selalu dibungkus `try/catch`, dengan *fallback* ke memori.
- **Mesin belajar (`src/engine`):**
  - `expression.js`: parser rumus (*recursive descent*, tanpa `eval`), mendukung perkalian implisit dan koma desimal.
  - `model.js`: eksekusi blok model sebagai perulangan sungguhan, beserta jejak eksekusinya.
  - `diagnose.js`: menguji model terhadap data, mengecek kesetaraan rumus di beberapa titik, mengklasifikasikan miskonsepsi berdasarkan kemiringan dan konstanta, dan memeriksa jawaban akhir (maju maupun invers).
  - `learning.js`: Bayesian Knowledge Tracing, aturan buka topik, rekomendasi adaptif, dan ringkasan.
- **Konsistensi data:** semua grafik dan statistik dihitung ulang dari daftar percobaan (*attempt*), bukan disimpan terpisah.
- **Aksesibilitas:** *skip link*, landmark, fokus terlihat, `aria-live` untuk umpan balik, dialog dengan *focus trap* dan Esc, tabel alternatif untuk grafik, `prefers-reduced-motion`, serta navigasi keyboard di semua kontrol.

---

## Pengujian

| Jenis | Cakupan | Hasil |
|---|---|---|
| Unit (`npm test`) | Parser, format angka Indonesia, model, diagnosis 8 miskonsepsi, BKT, rekomendasi, dan konsistensi matematis 9 misi | 14/14 lulus |
| End-to-end (Playwright, dijalankan saat pengembangan) | Registrasi & validasi, login/logout, guard peran, satu misi penuh dengan kesalahan yang disengaja, refresh di tengah misi, progres, dasbor guru (cari, urutkan, detail), profil, reset data, lupa sandi, 404 | 59/59 lulus, 0 error konsol |
| Responsif | 390 px, 820 px, 1360 px; tanpa *overflow* horizontal | OK |
| Build | `npm run build` dan `npm run preview` dengan fallback SPA | OK |

Skrip Playwright tidak disertakan di repo supaya proyek tetap tanpa dependensi.

---

## Data dan sumber

- **Data simulasi:** 24 siswa kelas 8A di dasbor guru, riwayat awal akun demo, dan seluruh statistik kelas. Data ini dibangkitkan secara deterministik dan **tidak mewakili siswa atau hasil penelitian sungguhan**. Di aplikasi, data ini diberi label "Data simulasi".
- **Data resmi:** hanya angka di halaman depan, yaitu 17% siswa Indonesia mencapai Level 2 matematika vs. rata-rata OECD 65%. Sumbernya OECD (2026), *PISA 2025 Results (Volume I), Country Note: Indonesia*.
- Skor *computational problem solving* dan skor matematika PISA memakai skala berbeda, sehingga **tidak dibandingkan secara langsung**. NalarLab memperlakukan hubungan keduanya sebagai **hipotesis desain**, bukan klaim hasil.

## Keterbatasan simulasi

1. Login, registrasi, dan sesi hanya simulasi di browser; tidak aman untuk data sungguhan.
2. Data hanya tersimpan di perangkat dan browser yang sama; tidak ada sinkronisasi.
3. "Lupa kata sandi" hanya simulasi antarmuka; tidak ada email yang dikirim.
4. Guru hanya melihat siswa yang terdaftar di browser yang sama, ditambah siswa simulasi.
5. Diagnosis berbasis aturan untuk pola linear. Rumus non-linear dikenali sebagai "bentuk tidak sesuai", tanpa diagnosis lebih rinci.
6. Efektivitas pembelajaran belum diuji di kelas. Klaim efektivitas memerlukan studi lapangan.

## Lisensi

Kode berlisensi MIT (lihat `LICENSE`). Font di `public/fonts/` memakai lisensi masing-masing (SIL OFL 1.1 untuk Inter dan GUST Font License untuk Latin Modern); lihat `public/fonts/LICENSES.md`.
