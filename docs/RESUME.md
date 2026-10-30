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
- Perbandingan "sudah terkirim atau belum" memakai JSON dengan kunci terurut (`canon()`), karena Firebase
  mengembalikan objek dengan kunci terurut; tanpa itu set kardio (`g`) selalu terlihat berubah dan dikirim ulang.
- Data lama dari browser (sebelum ada akun) ikut pindah ke akun saat login pertama.

### Tutorial alat
- 56 alat dengan video YouTube (vertikal), deskripsi, otot utama & pendukung.
- **Kardio** (kategori sendiri, bawaan aplikasi, tanpa video): Treadmill, Sepeda statis, Elliptical, Mesin dayung,
  Stair climber (id 9001–9005). Gambar 3D (`public/img/cardio-<k>.webp`, 600×800, dibuat dengan AI Figma, latar
  transparan dengan bayangan sebagai alpha; latarnya gradient lembut warna alat `CARDIO_C` lewat CSS `.cxi`, seperti
  kartu otot; ikut di-cache service worker) di tempat thumbnail; Beranda = tiga gambar
  dikipas; detail dan preview = gambar besar 3:4, Jenis/Saran 20–30 mnt/
  yang dicatat, peta otot (otot yang bekerja, hanya untuk gambar: tidak ikut filter otot, hitungan, atau ikon
  program). Muncul di chip **Kardio** (Tutorial dan Pilih latihan), kartu **Kardio** di Jelajahi Otot (Beranda), dan
  di "Semua"; tidak muncul di filter otot dan tidak dikirim ke rekomendasi Gemini "Pilih latihan". Tidak ikut data
  alat gym di Firebase (Import/Export alat tetap 56 alat video).
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
- **Pilih latihan**: peta otot (bisa pilih beberapa otot), preview video (popup dengan peta otot utama/pendukung,
  sama seperti di detail alat), dan **Rekomendasi Gemini**
  (latihan dari daftar alat gym beserta set × reps, sesuai program, otot pilihan, dan tujuan).
  Permintaan yang ditulis ("latihan perut hari ini") diutamakan dan dianggap sama dengan memilih otot di peta:
  Gemini hanya memilih alat untuk otot itu, boleh cuma 1–2 kalau alatnya sedikit (perut hanya punya Abs Crunches
  Machine). Gemini juga mengembalikan kode otot yang ia tangkap; alat yang tidak melatih otot itu dibuang di kode.
  Sama untuk Tambah latihan saat workout. Tanpa permintaan dan tanpa otot, Gemini melengkapi program/workout agar
  seimbang (4–6 latihan). Ganti latihan saat workout tidak memakai aturan ini.
  Alat yang sudah ada di program/workout diberi label **Sudah di program** / **Sudah di workout** dan tidak bisa
  dipilih lagi (juga di popup preview), jadi tidak ada latihan dobel.
- **Ikon program** otomatis dari otot utama latihannya (atau pilih sendiri: 15 otot, 8 ikon, 9 warna).
- **Otot** di Edit Program: satu baris di bawah nama program (3 otot utama terbanyak). Diketuk membuka popup
  peta tubuh (warna makin tua = makin banyak set; otot pendukung berbobot ½), set per otot utama, otot yang hanya
  jadi pendukung, dan otot yang belum dilatih. Baris yang sama ada di detail riwayat workout (Statistik). Saat workout berjalan, popup-nya dibuka dari tombol kecil **Otot: …** di kartu
  Set selesai · Volume · Detak jantung.
- **Bagikan program** lewat link, menu share HP, atau file `.json`; penerima tinggal membuka link.
- **Import** program (dan plan mingguan) dari JSON, misalnya buatan Claude, atau dari link/file bagikan. Isinya tampil
  dulu sebagai kartu program (seperti di Plan): centang yang mau diimport, **Lihat isi** membuka daftar latihannya.
  Program yang sama persis (nama + isi) dengan punyamu tidak dicentang ("Sudah ada di programmu"); nama sama tapi
  isi beda diberi peringatan. Jadwal mingguan dari import dipakai lewat sakelar, hanya untuk program yang dipilih
  (atau program milikmu yang namanya sama).

### Workout
- **Fokus set**: satu latihan terbuka, satu set aktif; kg (±2,5) dan reps (±1) lewat tombol −/+ (angka tetap bisa diketik), "Terakhir 50 kg × 10 · Pakai" dari sesi sebelumnya
- Set tampil sebagai **timeline** (hijau = selesai, biru = sedang diisi, abu = belum); ketuk titik untuk mengedit set mana saja, + untuk tambah set; set banyak → bisa digeser
- **Timer istirahat** = kartu dengan cincin hitung mundur, info set berikutnya, −15/+15/Lewati; 3 detik terakhir kuning, lalu kartu hijau "Lanjut Set 2". Bunyi (3 tik + nada naik) dijadwalkan di jam audio saat set selesai, dan audio dibuka saat tombol diketuk (aturan autoplay HP)
- "Selesai set" → **timer istirahat**, beban baru terbawa ke set berikutnya yang belum diubah manual, lalu lanjut otomatis ke set/latihan berikutnya; latihan lain terlipat jadi satu baris; yang sudah selesai naik ke atas (urut waktu selesai)
  (bunyi/getar bisa diatur).
- **Ganti latihan** (tombol "Ganti" di kartu latihan yang terbuka, selama masih ada set belum selesai): pilih alasan
  (alat sedang dipakai / rusak / terasa sakit / mau variasi, plus catatan opsional) → **Gemini** memilih 3 alat dari
  daftar alat gym untuk otot utama yang sama, dengan alasan dan tip singkat; "Minta pilihan lain" tidak mengulang yang
  sudah disarankan. Gemini melihat latihan yang diganti (otot, sisa set × reps, beban), latihan lain di workout,
  alat di 3 workout terakhir, dan profil. Di bawahnya daftar alat lain untuk otot yang sama tanpa Gemini (tetap jalan
  tanpa API key / offline). "Terasa sakit" menampilkan peringatan untuk berhenti bila nyeri tajam. Belum ada set
  selesai → latihan diganti di tempat (jumlah set & reps sama, beban dari riwayat alat baru); sebagian selesai → set
  yang selesai tetap di alat lama, sisa set pindah ke alat baru tepat di bawahnya. Hanya workout hari ini; program tetap.
  **Scan alat lain** dari sheet yang sama: kamera terbuka dalam mode cek, QR alat yang kosong dibaca, lalu sheet kembali
  dengan kartu "Hasil scan" (peta otot alat itu + penilaian Gemini: Cocok / Bisa, dengan catatan / Kurang cocok,
  alasan, tip) dan tombol "Pakai alat ini" / "Scan lagi". Tanpa API key: hanya perbandingan otot utama. Alat yang sama
  atau yang sudah ada di workout tidak bisa dipakai. Menutup kamera tanpa scan mengembalikan sheet seperti semula.
- Kartu **Hari ini** di Beranda: program hari ini + tombol mulai, strip status minggu ini.
- Ringkasan setelah selesai, riwayat lengkap.
- **Perkiraan kalori terbakar** per workout (informasi saja, tidak mengubah target/defisit): MET × berat × jam,
  MET dari Compendium of Physical Activities (3,5 latihan beban 8–15 reps; 4,3 sirkuit sedang; 6,0 berat),
  dipilih dari tempo (set per menit). Berat = catatan berat terakhir sebelum hari itu. Tampil di ringkasan,
  riwayat (dengan rumusnya), kartu riwayat, dan Statistik per periode. Akurasi kira-kira ±30%.
  Kardio dihitung terpisah: treadmill dengan rumus **ACSM** (jalan < 7,5 km/j: 0,1·v + 1,8·v·incline + 3,5;
  lari: 0,2·v + 0,9·v·incline + 3,5 ml O2/kg/menit, v dalam m/menit, ±5 kkal per liter O2), alat lain dengan MET
  per level (1–4, 5–8, 9–12, 13–16, 17+): sepeda 3,5/4,8/6,8/8,8/11, dayung 4,8/7/8,5/12, elliptical 4–8 (5,0 sedang),
  stair 6–11 (9,0 umum). Sisa durasi workout (durasi − menit kardio) memakai MET latihan beban dari tempo set beban.
- **Kardio di workout**: satu "set" = satu **bagian** (default 1, bisa ditambah untuk interval): Durasi (menit),
  Kecepatan (km/j, ±0,5) + Incline (%, ±0,5) untuk treadmill, atau Level untuk alat lain. Di bawahnya perkiraan
  jarak dan kalori. Tidak ada timer istirahat setelah kardio, tidak ikut Volume (kg). Di program: menit, bukan
  set × reps. "Ganti" pada alat kardio menawarkan alat kardio lain.
- **Detak jantung dari jam** (Web Bluetooth, Chrome Android/desktop): jam Huawei dengan *Settings → HR Data
  Broadcasts* menyala jadi sensor detak jantung Bluetooth standar (service 0x180D, karakteristik 0x2A37), sama
  seperti chest strap. Sel ketiga ringkasan workout = "Detak jantung": ketuk → petunjuk (sekali, sampai pernah
  tersambung) → pemilih perangkat Chrome (dialog bawaan Chrome, tidak bisa diubah tampilannya). Jam yang pernah dipilih
  diingat (`why_hr_dev`): kalau Chrome mendukung `getDevices()`, berikutnya langsung tersambung tanpa dialog (tunggu jam
  terlihat ≤ 7 dtk; tidak ketemu → ketukan berikutnya membuka dialog). "Ganti jam" di detail.
  Refresh memutus Bluetooth (koneksi ikut halaman). Kalau jam tersambung saat refresh (`why_hr_on` = start workout), Wegym
  menyambung lagi sendiri bila `getDevices()` ada (Chrome 169: masih di balik flag); kalau tidak, sel jadi "Terputus ·
  Sambung lagi" (sekali ketuk → dialog). Bacaan sebelum refresh tetap ada (disimpan juga saat `pagehide`). Tampil BPM live dengan warna zona (% dari 220 − umur, nama zona seperti
  di jam), juga di timer istirahat; ketuk untuk detail (zona, rata-rata, maks, kalori). Putus → menyambung ulang
  otomatis 6× (jeda 1,5 s → 48 s). Layar dijaga menyala (Wake Lock) selama terhubung. Jam tetap bisa merekam
  Workout sendiri ke Huawei Health sambil menyiarkan. Bacaan disimpan di perangkat (`why_hr`) per workout, lalu
  saat selesai jadi `hr` di riwayat: rata-rata, maks, min, detik terukur, rata-rata tiap 30 detik (grafik).
  Kalori pada menit yang terukur pakai rumus **Keytel 2005** (jenis kelamin, umur, berat; minimal 1 MET),
  menit yang tidak terukur tetap MET. Huawei Health Kit / Health Connect tidak dipakai: tertutup untuk web app.

### Kalori (AI Gemini atau Claude)
- Kartu **Kalori Hari Ini** di Beranda: ring kalori vs target, bar protein/karbo/lemak, tombol
  **Foto makanan**, **Dari galeri**, **Tulis manual**; halaman Kalori dengan strip minggu (pilih hari,
  rata-rata kkal, hari sesuai target) dan daftar makanan per waktu makan. Di halaman Kalori target harian
  tampil sebagai label hijau "Target N kkal" (ketuk untuk membuka profil).
- Setelah foto dipilih ada langkah **Keterangan (opsional)**: porsi, cara masak, atau yang tidak terlihat
  di foto; dikirim bersama foto dan diutamakan AI bila berbeda dengan tebakannya. **Ganti foto** memilih ulang.
- Foto diperkecil (1024 px) lalu dikirim langsung dari HP ke **Google Gemini** atau **Anthropic Claude**
  dengan API key milik pengguna (disimpan hanya di perangkat, Pengaturan → Perangkat ini → AI). Hasil: nama hidangan,
  rincian item (gram, kkal, makro), tingkat keyakinan; bisa diedit (gram menskalakan kalori, porsi
  ¼×–4×, waktu makan) sebelum disimpan. Foto tidak disimpan.
- **Pilihan AI** di lembar Hubungkan AI: Gemini (key gratis dari AI Studio) atau Claude (key berbayar dari
  platform.claude.com, isi saldo dulu). Yang terakhir disimpan yang dipakai untuk semua fitur AI (kalori, rekomendasi
  latihan, ganti alat, saran target); key yang lain tetap tersimpan untuk pindah lagi. Claude: model terbaru tiap keluarga
  (Opus 5.5 disarankan, Sonnet, Haiku, Fable) dites sekali saat key ditempel lalu disimpan, karena tiap tes ditagih;
  effort `low`, foto dikirim sebelum teks, `fallbacks: "default"` (beta) bila model menolak; Haiku tanpa fallback.
  Saldo habis tampil sebagai "Saldo Claude habis".
- **Profil tubuh** (jenis kelamin, tahun lahir, tinggi, berat, target berat, aktivitas, kecepatan
  0,25–1 kg/minggu), seperti onboarding MyFitnessPal / Lose It. BMR dengan rumus Mifflin–St Jeor
  × faktor aktivitas = TDEE; target harian = TDEE ± kecepatan × 7.700 / 7 kkal, minimal 1.500 (pria)
  / 1.200 (wanita). Bisa juga diatur sendiri. Protein 1,8 g/kg berat, lemak 25%, sisanya karbo.
- **Defisit / surplus** hari ini (masuk − pembakaran) di halaman Kalori dan kartu Beranda. Warnanya ikut
  target harian: oranye selama masih di bawah 90% target (defisit besar), hijau di 90–105% target, merah di atas 105%.
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

### Aplikasi Android (`mobile/`)
- APK Flutter yang membuka situs di WebView. Perubahan web langsung terlihat tanpa build ulang.
- Halaman mengenali aplikasi dari user agent `WegymApp/` dan meminta lewat kanal `WegymNative` (`native()`):
  login Google native (token diserahkan ke Firebase), bagikan, simpan ekspor, layar tetap menyala.
- Tombol Kembali menutup popup teratas (`closeTop()`), baru pindah halaman.
- Link luar (YouTube, AI Studio) terbuka di aplikasinya sendiri.
- Login Google butuh SHA-1 kunci rilis terdaftar di aplikasi Android proyek Firebase why-gym.
- Detak jantung lewat Web Bluetooth belum jalan di APK: WebView Android tidak punya Web Bluetooth.
- **Jam Huawei GT 6 (disiapkan):**
  - Halaman mengirim set berikutnya dan sisa istirahat (`watchState()`) setiap ada perubahan.
  - Halaman menerima dari jam `setDone` / `skipRest` (`watchEvent()`).
  - Penghubung ke jam (Wear Engine di `MainActivity.kt`) dan aplikasi jamnya menunggu akun Huawei Developer dan izin Wear Engine.

---

## 2. Isi repo

| File | Isi |
|---|---|
| `public/index.html` | Seluruh aplikasi |
| `public/sw.js` | Service worker (offline, ganti cache lama openGym) |
| `public/manifest.json`, `public/icons/` | Manifest PWA dan ikon |
| `mobile/` | Aplikasi Android (Flutter); cara build dan kunci rilis di `mobile/README.md` |
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
| `users/<uid>/history/<id>` | Riwayat workout: `{ date, name, rids, dur, sets, vol, items: [{ id, sets: [{ w, r, g? }] }], hr? }` (kardio: `r` = menit, `w` = km/j atau level, `g` = incline %); `hr` = `{ avg, max, min, sec, s: [bpm tiap 30 dtk, 0 = kosong] }` | pemilik akun |
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
`week`, `icon`, `color` opsional. `items` juga boleh berupa `[id, sets, reps]`. Alat kardio: `sets` 1, `reps` = menit. `icon`: `m:<otot>` atau
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
10. Detak jantung live dari jam Huawei (HR Data Broadcasts lewat Web Bluetooth), kalori dari detak jantung.
11. Ganti latihan saat workout dengan rekomendasi Gemini (alasan: alat dipakai, rusak, sakit, variasi).
12. Kategori Kardio: 5 alat bawaan, dicatat menit + kecepatan/incline atau level, kalori ACSM/MET.
13. Gambar 3D untuk alat kardio (AI Figma), latar gradient lembut berwarna per alat.
14. Aplikasi Android (Flutter WebView) dan sambungan workout untuk jam Huawei: catat set dan timer istirahat.
15. Claude sebagai pilihan AI di samping Gemini.

## 8. Ide berikutnya

- Mode **Rotation** (program berputar tanpa terikat hari), seperti openGym.
- Hari **Punggung** untuk melengkapi program 4 hari.
- QR baru yang langsung membuka WHY (`…/gym/#/alat/<id>`) dan halaman cetak QR untuk admin.
- Mode gelap.
