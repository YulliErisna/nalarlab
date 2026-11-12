// Library of common misconceptions that the diagnosis engine can detect.
// `remedy` is written for teachers, `studentTip` for students.

export const MISCONCEPTIONS = [
  {
    id: 'off-by-one',
    name: 'Salah hitung banyak langkah',
    summary: 'Menambahkan perubahan satu kali terlalu banyak atau terlalu sedikit.',
    example: 'Menulis 12 + 4n untuk kursi di aula, sehingga baris pertama berisi 16 kursi, bukan 12.',
    why: 'Siswa menyamakan "nomor langkah" dengan "banyak penambahan". Pada langkah pertama belum ada penambahan.',
    studentTip: 'Coba hitung manual untuk langkah pertama. Berapa kali perubahan sudah terjadi pada saat itu?',
    remedy: 'Minta siswa menjalankan model untuk n = 1 dan menghitung berapa kali isi perulangan dijalankan. Bandingkan tabel "nomor baris" dan "banyak penambahan" berdampingan.',
  },
  {
    id: 'konstanta-hilang',
    name: 'Suku tetap terlupa',
    summary: 'Hanya menulis laju perubahan tanpa nilai awal.',
    example: 'Menulis 3n untuk persegi korek api, padahal satu persegi butuh 4 batang.',
    why: 'Siswa fokus pada pola "bertambah 3" dan lupa bahwa ada bagian yang sudah ada sejak awal.',
    studentTip: 'Masukkan n = 1 ke rumusmu. Apakah hasilnya sama dengan data pertama?',
    remedy: 'Gunakan representasi gambar: warnai bagian yang selalu ada dengan warna berbeda dari bagian yang bertambah.',
  },
  {
    id: 'konstanta-salah',
    name: 'Nilai awal tidak tepat',
    summary: 'Laju perubahan sudah benar, tetapi titik awalnya bergeser.',
    example: 'Menulis 15n + 50 untuk tabungan, padahal saldo minggu pertama sudah 50.',
    why: 'Nilai awal diambil langsung dari cerita tanpa memeriksa pada langkah ke berapa nilai itu terjadi.',
    studentTip: 'Pada langkah ke berapa nilai awal dalam cerita terjadi? Langkah 0 atau langkah 1?',
    remedy: 'Latih siswa menentukan "langkah nol" dengan mundur satu langkah dari data pertama.',
  },
  {
    id: 'tertukar',
    name: 'Koefisien dan konstanta tertukar',
    summary: 'Nilai awal dikalikan dengan variabel, sedangkan laju ditambahkan.',
    example: 'Menulis 6x + 2,5 untuk tarif ojek, sehingga biaya per km menjadi 6.',
    why: 'Siswa mengenali kedua angka penting tetapi belum memahami peran masing-masing dalam rumus.',
    studentTip: 'Angka mana yang berulang setiap kali x bertambah 1? Angka itulah yang dikalikan dengan x.',
    remedy: 'Bandingkan blok "mulai" dan blok "ulangi" pada model: hanya isi perulangan yang menjadi koefisien.',
  },
  {
    id: 'tanda',
    name: 'Arah perubahan terbalik',
    summary: 'Situasi berkurang ditulis sebagai bertambah, atau sebaliknya.',
    example: 'Menulis 30 + 1,5x untuk sisa kuota, sehingga kuota justru bertambah setiap hari.',
    why: 'Siswa memakai besar perubahan tanpa memperhatikan arahnya.',
    studentTip: 'Apakah nilainya naik atau turun ketika variabel bertambah? Tanda koefisien harus mengikuti arah itu.',
    remedy: 'Mulai dengan prediksi: "besok lebih banyak atau lebih sedikit?" sebelum siswa menulis rumus.',
  },
  {
    id: 'beda-salah',
    name: 'Besar perubahan tidak tepat',
    summary: 'Struktur rumus benar, tetapi laju perubahannya keliru.',
    example: 'Menulis 2x untuk jarak peta karena selisih antarkolom 5 dibagi 2 dihitung keliru.',
    why: 'Sering muncul saat langkah variabel tidak naik satu per satu (misalnya 2, 4, 6).',
    studentTip: 'Bagi perubahan nilai dengan perubahan variabel untuk mendapatkan laju per satu satuan.',
    remedy: 'Latih menghitung laju dari dua titik yang berjarak lebih dari 1 satuan.',
  },
  {
    id: 'aditif',
    name: 'Penalaran aditif pada proporsi',
    summary: 'Menambah selisih tetap padahal seharusnya mengalikan dengan faktor yang sama.',
    example: 'Menulis x + 42 untuk gula es teh karena 3 + 42 = 45.',
    why: 'Penalaran "bertambah" lebih akrab daripada "berlipat", sehingga hubungan sebanding diperlakukan seperti selisih tetap.',
    studentTip: 'Uji rumusmu pada data lain, misalnya 6 gelas. Apakah gulanya ikut berlipat dua?',
    remedy: 'Gunakan tabel rasio dan minta siswa memeriksa apakah perbandingan y : x tetap sama di setiap kolom.',
  },
  {
    id: 'bukan-linear',
    name: 'Bentuk rumus tidak sesuai pola',
    summary: 'Rumus menghasilkan pola yang tidak bertambah dengan laju tetap.',
    example: 'Menulis n² + 3 untuk pola yang selalu bertambah 4.',
    why: 'Siswa mencocokkan beberapa angka tanpa memeriksa apakah perubahannya tetap.',
    studentTip: 'Hitung selisih hasil rumusmu untuk n = 1, 2, 3. Apakah selisihnya selalu sama?',
    remedy: 'Ajak siswa membandingkan tabel selisih dari rumus dan dari data.',
  },
];

export const misconceptionById = (id) => MISCONCEPTIONS.find((m) => m.id === id) || null;
