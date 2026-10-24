# WHY

Aplikasi gym dalam satu halaman: video tutorial alat, peta otot, program dan plan mingguan,
pencatatan set dengan timer istirahat, serta statistik. Login dan data tersimpan di Firebase,
jadi tersinkron di semua perangkat.

Live: https://pangfive.github.io/gym/

Ringkasan lengkap proyek: [docs/RESUME.md](docs/RESUME.md). Contoh file import: [docs/contoh/](docs/contoh/).

## Isi repo

| File | Isi |
|---|---|
| `public/index.html` | Seluruh aplikasi (HTML, CSS, JavaScript), tanpa proses build |
| `public/sw.js`, `public/manifest.json`, `public/icons/` | PWA: service worker (offline), manifest, dan ikon aplikasi |
| `database.rules.json` | Aturan keamanan Firebase Realtime Database |
| `.github/workflows/pages.yml` | Deploy otomatis ke GitHub Pages setiap push ke `main` |

## Setup Firebase (sekali saja)

1. **Authentication → Get started → Sign-in method**: aktifkan **Email/Password** dan **Google**.
2. **Authentication → Settings → Authorized domains**: tambahkan `pangfive.github.io`.
   (`localhost` sudah diizinkan dari awal.)
3. **Realtime Database → Rules**: ganti isinya dengan `database.rules.json`, lalu **Publish**.
4. **Admin pertama**: selama aplikasi belum punya admin, akun yang masuk ditawari popup
   **"Jadikan saya admin"** (juga ada tombolnya di **Pengaturan → Pengaturan aplikasi**). Hanya
   akun pertama yang mengklaim yang berhasil; setelah itu popup tidak muncul lagi. Admin tambahan
   bisa ditambahkan lewat **Realtime Database → Data**: `app/admins/<ID akun>` = `true`
   (ID akun ada di **Pengaturan → Akun → Salin ID akun**).

## Struktur data

Pengaturan aplikasi dan pengaturan user disimpan terpisah.

| Path | Isi | Akses |
|---|---|---|
| `app/settings` | **Pengaturan aplikasi**: `appName`, `announcement`, `defaultRest`, `defaultGoal`, `suggestion` | dibaca semua orang, diubah admin |
| `app/tutorials` | **Data alat**: nama, kategori, video YouTube, deskripsi, otot utama/pendukung | dibaca semua orang, diubah admin |
| `app/admins/<uid>` | `true` untuk akun admin | akun pertama mengklaim sendiri; selanjutnya lewat Firebase Console |
| `app/meta/hasAdmin` | `true` begitu ada admin; popup admin hanya muncul selama ini kosong | dibaca semua orang |
| `users/<uid>/settings` | **Pengaturan user**: `name`, `goal`, `rest`, `body`, `sound`, `vibrate` | pemilik akun |
| `users/<uid>/routines` | Program latihan | pemilik akun |
| `users/<uid>/week` | Plan mingguan: `d0` (Minggu) … `d6` (Sabtu) → daftar id program | pemilik akun |
| `users/<uid>/history/<id>` | Riwayat workout | pemilik akun |
| `users/<uid>/active` | Workout yang sedang berjalan | pemilik akun |
| `users/<uid>/profile` | Email, nama, waktu login terakhir | pemilik akun |

Data juga di-cache di perangkat: aplikasi langsung terbuka, tetap bisa dipakai offline, dan
perubahannya dikirim ke Firebase begitu online lagi.

## Pasang di HP (PWA)

WHY bisa dipasang seperti aplikasi: di Android/Chrome lewat tombol **Pasang** di Beranda atau
**Pengaturan → Perangkat ini**, di iPhone lewat Safari → **Bagikan → Tambahkan ke Layar Utama**.
Service worker menyimpan aplikasi, SDK Firebase, font, dan thumbnail video supaya tetap terbuka
saat offline. Halaman selalu diambil baru dari jaringan bila online, jadi update langsung terlihat.

## Data alat (tutorial)

Data alat ada di Firebase (`app/tutorials`) dan dikelola admin lewat **Pengaturan → Data alat**:

- **Simpan data bawaan ke Firebase**: sekali saja di awal, memindahkan 56 alat bawaan ke Firebase.
- **Export JSON**: unduh semua alat (`why-alat-<tanggal>.json`) untuk diedit atau dicadangkan.
- **Import JSON**: ganti semua alat dari file. Menerima hasil Export di atas, atau JSON dari API
  tutorial gym (`{"data":[...]}`) yang langsung dikonversi. Sebelum disimpan muncul ringkasan
  berapa alat yang baru, berubah, dan dihapus.

Format hasil Export (field yang bisa diedit):

```json
{"why_tutorials":1,
 "items":[{"id":38,"title":"Selectorized Chest Press","category":"chest",
           "youtube":"-zLwVSx2Pfc","description":"…",
           "primary":["chest"],"secondary":["triceps","deltoids"]}]}
```

`youtube` boleh berisi id video atau link YouTube. Kode otot untuk `primary`/`secondary` tercantum di
bagian `muscles` pada file Export.

## Program dari Claude

Di halaman **Plan**, tekan **Salin data** lalu tempel ke chat Claude. Jawaban Claude dalam format
berikut bisa langsung di-import (bagian `week` opsional):

```json
{"why_plan":1,
 "routines":[{"name":"Push Day","items":[{"id":38,"sets":3,"reps":"10"}]}],
 "week":{"senin":["Push Day"],"kamis":["Push Day"]}}
```

## Menjalankan di komputer

```bash
python -m http.server 8080 --directory public
```

Lalu buka http://localhost:8080.

## Kredit

Gambar peta otot dari [MuscleMap](https://github.com/melihcolpan/MuscleMap) oleh Melih Colpan
(lisensi MIT, lihat `THIRD_PARTY_NOTICES.md`). Video tutorial diputar dari YouTube.
