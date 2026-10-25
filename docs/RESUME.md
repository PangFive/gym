# Wegym — Ringkasan Proyek

_Dulu bernama WHY; nama internal (cache, key penyimpanan) tetap `why_…` agar data lama aman._

Aplikasi gym berbasis web (PWA) untuk member gym: tonton tutorial alat, scan QR di mesin, susun
program dan plan mingguan, catat setiap set, dan lihat progres. Data tersimpan di akun Firebase dan
tersinkron di semua perangkat.

| | |
|---|---|
| **Live** | https://pangfive.github.io/gym/ |
| **Repo** | https://github.com/PangFive/gym |
| **Firebase** | project `why-gym` (Authentication + Realtime Database, region asia-southeast1) |
| **Teknologi** | Satu file HTML (HTML/CSS/JavaScript murni, tanpa build), Firebase Web SDK 10.14.1, service worker |
| **Deploy** | GitHub Actions → GitHub Pages, otomatis setiap push ke `main` |

---

## 1. Fitur

### Akun & sinkron
- Masuk dengan **email/password** atau **Google**; daftar, lupa password, keluar.
- Data di Firebase, juga di-cache di HP: aplikasi langsung terbuka, tetap jalan **offline**, dan
  perubahan terkirim begitu online lagi.
- Data lama dari browser (sebelum ada akun) ikut pindah ke akun saat login pertama.

### Tutorial alat
- 56 alat dengan video YouTube (vertikal), deskripsi, otot utama & pendukung.
- **Peta otot** depan/belakang (pria/wanita): ketuk otot untuk menyaring latihan; 15 otot.
- Halaman detail: video, peta otot latihan itu, saran set × reps, **+ Program**, **Latih Ini** (saat
  workout berjalan: **Tambah ke workout** / **Buka di workout**).
- **Scan QR di mesin** (tombol QR di kanan atas semua halaman): membuka detail alat itu. Saat workout:
  sheet detail yang berhenti di deskripsi (tanpa Program, YouTube, alat lain), tombol kecil **Tutup** / **Tambah ke workout** (atau **Buka di workout**). Dari Edit Program muncul kartu konfirmasi (Batal /
  Tambahkan) dan kamera tetap terbuka untuk alat berikutnya. Tombol **Tambah** dan **Scan** ada di atas daftar latihan.
- Kamera scan minta 4:3 (1920×1440), penuh layar, zoom kamera diset tepat 1× (kamera multi-lensa Samsung 0,6×–10× bisa terbuka di 0,6× ultrawide) + fokus otomatis terus; kotak scan dibaca resolusi penuh; tombol **Senter** muncul kalau
  kameranya mendukung; tanpa tombol zoom; scan pertama pindah dari ultrawide ke lensa utama (Android: camera2 0) dan lensa diingat, tombol **Lensa** untuk ganti manual; ketuk layar untuk fokus; petunjuk muncul setelah 7 detik.

### Program & plan mingguan
- Tab **Jadwal**: tiap hari Senin–Minggu berisi satu/lebih program atau hari istirahat, dengan status
  Selesai / Terlewat.
- Tab **Program**: buat, edit (set, reps, urutan), hapus program. Program baru berupa draf sampai disimpan.
  Urutan diubah dengan **drag** pegangan ⋮⋮ (halaman bergulir sendiri di tepi; panah atas/bawah di keyboard).
- **Pilih latihan**: peta otot (bisa pilih beberapa otot), preview video, dan **Rekomendasi Gemini**
  (latihan dari daftar alat gym beserta set × reps, sesuai program, otot pilihan, dan tujuan).
- **Ikon program** otomatis dari otot utama latihannya (atau pilih sendiri: 15 otot, 8 ikon, 9 warna).
- **Bagikan program** lewat link, menu share HP, atau file `.json`; penerima tinggal membuka link.
- **Import** program (dan plan mingguan) dari JSON, misalnya buatan Claude.

### Workout
- **Fokus set**: satu latihan terbuka, satu set aktif; kg (±2,5) dan reps (±1) lewat tombol −/+ (angka tetap bisa diketik), "Terakhir 50 kg × 10 · Pakai" dari sesi sebelumnya
- Set tampil sebagai **timeline** (hijau = selesai, biru = sedang diisi, abu = belum); ketuk titik untuk mengedit set mana saja, + untuk tambah set; set banyak → bisa digeser
- **Timer istirahat** = kartu dengan cincin hitung mundur, info set berikutnya, −15/+15/Lewati; 3 detik terakhir kuning, lalu kartu hijau "Lanjut Set 2". Bunyi (3 tik + nada naik) dijadwalkan di jam audio saat set selesai, dan audio dibuka saat tombol diketuk (aturan autoplay HP)
- "Selesai set" → **timer istirahat**, beban baru terbawa ke set berikutnya yang belum diubah manual, lalu lanjut otomatis ke set/latihan berikutnya; latihan lain terlipat jadi satu baris; yang sudah selesai naik ke atas (urut waktu selesai)
  (bunyi/getar bisa diatur).
- Kartu **Hari ini** di Beranda: program hari ini + tombol mulai, strip status minggu ini.
- Ringkasan setelah selesai, riwayat lengkap.

### Kalori (AI Gemini)
- Kartu **Kalori Hari Ini** di Beranda: ring kalori vs target, bar protein/karbo/lemak, tombol
  **Foto makanan**, **Dari galeri**, **Tulis manual**; halaman Kalori dengan strip minggu (pilih hari,
  rata-rata kkal, hari sesuai target) dan daftar makanan per waktu makan.
- Setelah foto dipilih ada langkah **Keterangan (opsional)**: porsi, cara masak, atau yang tidak terlihat
  di foto; dikirim bersama foto dan diutamakan AI bila berbeda dengan tebakannya. **Ganti foto** memilih ulang.
- Foto diperkecil (1024 px) lalu dikirim langsung dari HP ke **Google Gemini** dengan API key milik
  pengguna (disimpan hanya di perangkat, Pengaturan → Perangkat ini → Gemini). Hasil: nama hidangan,
  rincian item (gram, kkal, makro), tingkat keyakinan; bisa diedit (gram menskalakan kalori, porsi
  ¼×–4×, waktu makan) sebelum disimpan. Foto tidak disimpan.
- **Profil tubuh** (jenis kelamin, tahun lahir, tinggi, berat, target berat, aktivitas, kecepatan
  0,25–1 kg/minggu), seperti onboarding MyFitnessPal / Lose It. BMR dengan rumus Mifflin–St Jeor
  × faktor aktivitas = TDEE; target harian = TDEE ± kecepatan × 7.700 / 7 kkal, minimal 1.500 (pria)
  / 1.200 (wanita). Bisa juga diatur sendiri. Protein 1,8 g/kg berat, lemak 25%, sisanya karbo.
- **Defisit / surplus** hari ini (masuk − pembakaran) di halaman Kalori dan kartu Beranda. Warnanya ikut
  target harian: biru selama masih di bawah 90% target, hijau di 90–105% target, kuning di atas 105%.
- **Berat badan**: catat harian, progres dari berat awal ke target, grafik 30 catatan terakhir,
  perkiraan tanggal tercapai.

### Statistik
- Volume per minggu/bulan/tahun, target mingguan (workout, set, menit), keseimbangan otot
  (peta panas + set efektif; otot pendukung dihitung ½ set), riwayat.

### Pengaturan
- **Pengaturan saya** (per akun): nama, target per minggu, istirahat, figur otot, bunyi, getar.
- **Pengaturan aplikasi** (semua pengguna, khusus admin): nama aplikasi, pengumuman di Beranda,
  istirahat & target default, saran set × reps — dengan pratinjau langsung.
- **Data alat** (admin): simpan ke Firebase, Import JSON, Export JSON.
- Admin pertama ditawari lewat popup selama aplikasi belum punya admin.
- Backup/restore data, "Salin data untuk Claude", hapus data latihan, salin ID akun.

### PWA
- Bisa dipasang di layar utama (Android: tombol Pasang; iPhone: Safari → Bagikan → Tambahkan ke
  Layar Utama), ikon WHY, shortcut Plan/Tutorial/Statistik.
- Service worker menyimpan aplikasi, SDK Firebase, font, pembaca QR, dan thumbnail video. Halaman diambil
  dari jaringan (maks 4 detik, tanpa cache HTTP); kalau lambat, salinan tersimpan dipakai dulu, versi baru
  tetap diunduh di belakang, lalu muncul tombol **Versi baru tersedia · Muat ulang**.

---

## 2. Isi repo

| File | Isi |
|---|---|
| `public/index.html` | Seluruh aplikasi |
| `public/sw.js` | Service worker (offline, ganti cache lama openGym) |
| `public/manifest.json`, `public/icons/` | Manifest PWA dan ikon |
| `database.rules.json` | Aturan keamanan Realtime Database |
| `.github/workflows/pages.yml` | Deploy ke GitHub Pages |
| `docs/RESUME.md` | Dokumen ini |
| `docs/contoh/data-alat.json` | Data 56 alat (format Export WHY) — untuk Import di Pengaturan → Data alat |
| `docs/contoh/program-4-hari.json` | Program 4 hari (Dada & Trisep, Kaki, Bahu, Lengan) + jadwal |
| `README.md`, `THIRD_PARTY_NOTICES.md` | Panduan singkat; lisensi gambar peta otot (MIT) |

---

## 3. Struktur data Firebase

| Path | Isi | Akses |
|---|---|---|
| `app/settings` | Pengaturan aplikasi: `appName`, `announcement`, `defaultRest`, `defaultGoal`, `suggestion` | baca: semua · tulis: admin |
| `app/tutorials` | Data alat: `{ v, count, updatedAt, items: { <id>: { id, t, m, y, d, p, s } } }` | baca: semua · tulis: admin |
| `app/admins/<uid>` | `true` untuk admin | akun pertama mengklaim sendiri; berikutnya lewat Console |
| `app/meta/hasAdmin` | `true` begitu ada admin | baca: semua |
| `users/<uid>/settings` | Pengaturan user: `name`, `goal`, `rest`, `body`, `sound`, `vibrate`, `kcal`, profil tubuh `sex`, `birth`, `height`, `goalW`, `act`, `pace`, `kcalAuto`, `startW`, `startD` | pemilik akun |
| `users/<uid>/routines` | Program: `{ id, name, items: [{ id, sets, reps }], icon?, color? }` | pemilik akun |
| `users/<uid>/week` | Plan mingguan: `d0` (Minggu) … `d6` (Sabtu) → id program | pemilik akun |
| `users/<uid>/history/<id>` | Riwayat workout | pemilik akun |
| `users/<uid>/meals/<id>` | Catatan makan: `{ date, slot, name, portion, conf, note, items: [{ n, g, kcal, p, c, f }] }` | pemilik akun |
| `users/<uid>/weights/<YYYY-MM-DD>` | Berat badan per hari: `{ date, kg }` | pemilik akun |
| `users/<uid>/active` | Workout yang sedang berjalan | pemilik akun |
| `users/<uid>/profile` | Email, nama, waktu login terakhir | pemilik akun |

Kode field alat: `t` judul, `m` kategori, `y` id YouTube, `d` deskripsi, `p`/`s` otot utama/pendukung.

---

## 4. Setup (sudah dilakukan, untuk referensi)

1. Firebase **Authentication** → aktifkan Email/Password dan Google.
2. Authentication → **Authorized domains** → `pangfive.github.io`.
3. **Realtime Database → Rules** → isi `database.rules.json` → Publish.
4. Login → terima popup **Jadikan saya admin**.
5. Pengaturan → Data alat → **Simpan data bawaan ke Firebase** (sekali).
6. GitHub repo → Settings → Pages → Source: **GitHub Actions**.

Menjalankan di komputer: `python -m http.server 8080 --directory public` → http://localhost:8080.

---

## 5. Format JSON

### Program (Import di Plan → Program)
```json
{"why_plan":1,
 "routines":[{"name":"Push Day","items":[{"id":38,"sets":3,"reps":"10"}],"icon":"g:flame","color":"#f2785c"}],
 "week":{"senin":["Push Day"],"kamis":["Push Day"]}}
```
`week`, `icon`, `color` opsional. `items` juga boleh berupa `[id, sets, reps]`. `icon`: `m:<otot>` atau
`g:<dumbbell|barbell|kettlebell|flame|bolt|heart|target|trophy>`.

### Data alat (Import di Pengaturan → Data alat)
Format Export WHY (lihat `docs/contoh/data-alat.json`):
```json
{"why_tutorials":1,
 "items":[{"id":38,"title":"Selectorized Chest Press","category":"chest","youtube":"-zLwVSx2Pfc",
           "description":"…","primary":["chest"],"secondary":["triceps","deltoids"]}]}
```
Juga menerima JSON mentah API tutorial gym (`{"data":[…]}` dengan `jenis_alat`, `youtube_id`, `aktif`).

Kode otot: `chest` Dada, `deltoids` Bahu, `trapezius` Trapezius, `upper-back` Punggung atas,
`lower-back` Punggung bawah, `biceps` Bisep, `triceps` Trisep, `forearm` Lengan bawah, `abs` Perut,
`obliques` Perut samping, `gluteal` Glutes, `quadriceps` Paha depan, `hamstring` Paha belakang,
`adductors` Paha dalam, `calves` Betis.

### QR di mesin
Isi QR stiker gym: `{"type":"tutorial","id":63,"title":"…","youtube_url":"…","youtube_id":"…"}`.
Aplikasi mencocokkan `id` (lalu `youtube_id`) dengan data alat.

---

## 6. Perbedaan data alat dengan JSON asli gym

| JSON asli (57) | Di WHY (56) |
|---|---|
| "Instruksi Shower" (id 81, ARM) | Dihapus — bukan latihan |
| Abs Crunches Machine (id 39) kategori LEG | Kategori `core` (Perut) |
| "Flat Chest Press " (spasi di akhir) | "Flat Chest Press" |
| — | Ditambah otot utama & pendukung per alat |

---

## 7. Riwayat pengembangan (ringkas)

1. Fork openGym → rebrand WHY, deploy GitHub Pages.
2. Diganti aplikasi satu halaman WHY: tutorial dari JSON gym, desain kaca pastel, filter & peta otot,
   15 otot detail, thumbnail video vertikal.
3. Popup/dialog sendiri, perbaikan aksesibilitas & sentuhan (audit ui-ux-pro-max).
4. Firebase: login, sinkron, pemisahan pengaturan aplikasi vs user, plan mingguan.
5. Repo GitHub diganti total ke WHY; PWA + ikon baru; admin pertama lewat popup.
6. Pengaturan didesain ulang; data alat pindah ke Firebase (Import/Export JSON).
7. Bagikan program, ikon program otomatis, scan QR mesin, header Beranda baru.
8. Pelacak kalori dengan foto + Gemini (API key milik pengguna).
9. Profil tubuh, target kalori otomatis (TDEE), defisit/surplus harian, log berat badan.

## 8. Ide berikutnya

- Mode **Rotation** (program berputar tanpa terikat hari), seperti openGym.
- Hari **Punggung** untuk melengkapi program 4 hari.
- QR baru yang langsung membuka WHY (`…/gym/#/alat/<id>`) dan halaman cetak QR untuk admin.
- Mode gelap.
