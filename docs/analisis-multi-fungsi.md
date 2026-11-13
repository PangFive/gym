# Analisis alat dan teknik multi fungsi

_Dibuat 12–13 November 2026. Dasar fitur "Untuk otot apa" di program._

## Aturan di aplikasi

Pilihan otot hanya muncul untuk latihan **multi fungsi**, dan isinya hanya **otot utama**:

- **Alat**: punya 2+ otot utama.
- **Teknik**: bertipe `variasi` dan punya 2+ otot utama.
- Teknik `koreksi` (satu gerakan benar/salah, mis. Barbell Squat) dan `rangkaian` (satu sesi beberapa
  gerakan) tidak menampilkan pilihan walau otot utamanya banyak.
- Tanpa pilihan, latihan dihitung untuk semua otot utamanya. Pilihan tersimpan di item program sebagai
  `f` (daftar kode otot), ikut ke workout dan riwayat.

Jadi `type` dan `primary` di data menentukan tampilannya. Otot yang sekadar ikut bekerja masuk `secondary`.

## Alat (56 data)

### Multi fungsi (7)

| ID | Alat | Pilihan | Catatan |
|---|---|---|---|
| 46 | Pec/Rear Delt Fly | Dada / Bahu | data sudah benar |
| 57 | Leg Extension / Leg Curl Machine | Paha depan / Hamstring | data sudah benar |
| 60 | Selectorized Abduction/Adduction Machine | Paha dalam / Bokong | data sudah benar |
| 71 | Mid Back / Rear Delt Row | Punggung atas / Bahu | data sudah benar |
| 73 | Total Arms Machine | Bisep / Trisep | data sudah benar |
| 67 | Standing Multi Flight | Bahu / Dada | Dada dipindah dari pendukung ke utama. Video hanya menunjukkan gerakan bahu; Dada mengikuti deskripsi alat dan contoh dari pemilik |
| 63 | Multi Back Extension | Punggung bawah / Bokong | Bokong dipindah ke utama. Video satu gerakan; alasan: kategori alat "glutes" dan gerakan ini dipakai untuk dua sasaran |

### Dicek dari video, bukan multi fungsi

| ID | Alat | Yang terlihat | Keputusan |
|---|---|---|---|
| 72 | Tricep / Dip Press | satu gerakan menekan ke bawah sambil duduk | tetap Trisep |
| 43 | Horizontal Multi Press | satu gerakan press sambil berbaring | tetap Dada |
| 79 | Dual Upper Smith | satu gerakan incline press | tetap Dada |
| 31 | Adjustable Low Pulley | row dari dua ketinggian, dua-duanya punggung | tetap Punggung atas |

### Nama dobel tapi otot sama

66 Lat Pulldown / Row Machine (punggung atas), 45 Decline/Mid Pec Press (dada), 26 Two Way Row (punggung atas).

## Teknik (205 data)

### Multi fungsi: 41 video `variasi` dengan 2+ otot utama

Sudah multi sejak awal (26 tidak diubah; 464 dan 634 juga sudah multi dan hanya ditambah ototnya): 277, 291, 292, 310, 320, 323, 330, 333, 362, 391, 394, 397,
401, 424, 429, 444, 446, 462, 539, 544, 548, 562, 578, 596, 658, 669.

Diubah pada 13 November 2026 (16 entri):

| ID | Judul | Perubahan | Dasar |
|---|---|---|---|
| 275 | Back Extension | tipe koreksi → variasi (Punggung bawah / Bokong) | video: ikon otot berganti punggung lalu bokong |
| 288 | Crunch Variations | utama Perut + Perut samping | teks: bawah, samping, atas |
| 298 | Hip Thrust Foot Position | utama Bokong + Paha depan + Hamstring | teks: jarak kaki menggeser fokus |
| 378 | Smith Bench Variations | utama Dada + Trisep | teks: area dada dan trisep |
| 395 | EZ Curl Grips | utama Bisep + Lengan bawah | video: reverse grip menyorot lengan bawah |
| 414 | Dumbbell Curl Grip | utama Bisep + Lengan bawah | teks: genggaman menggeser kerja |
| 421 | Seated Cable Row Focus | utama Punggung atas + Bahu | teks: lats, punggung atas, bahu belakang |
| 423 | Cable Shoulder and Chest Moves → **Cable Fly Low, Mid, High** | utama Dada saja, Bahu pendukung (tidak multi) | video: tiga tinggi kabel, semuanya dada |
| 464 | Bench Press Grip Focus | utama Dada + Trisep + Bahu | teks: lebar pegangan |
| 561 | Dumbbell Traps by Area | utama Trapezius + Punggung atas | teks |
| 576 | Seated Cable Row by Area | utama Punggung atas + Trapezius | teks |
| 580 | Cable Row Handle Choice | utama Punggung atas + Bahu | teks |
| 598 | Cable Bar Back Moves | utama Punggung atas + Bahu | teks |
| 601 | Seated Floor Cable Back | utama Punggung atas + Trapezius + Bahu | teks |
| 634 | Squat and Leg Press by Area | utama Paha depan + Bokong + Paha dalam | teks |
| 655 | Seated Row Handle Focus | utama Punggung atas + Bahu + Trapezius | teks |

Dicek dari video dan tetap: 287 Cable Glute Moves (semua bokong, satu otot), 596 Bent-Over Dumbbell Upper
Back (tiga area berbeda, tetap multi).

### Bukan multi fungsi

- `variasi` dengan satu otot utama: variasinya menggeser bagian dari otot yang sama (mis. arah ujung kaki
  pada calf raise, lebar pegangan lat pulldown), dan kode otot aplikasi tidak membedakannya.
- `koreksi` dengan 2+ otot utama (18): gerakan gabungan, mis. 372 Barbell Squat, 313 Barbell Deadlift.
- `rangkaian` (28 dengan 2+ otot utama): satu sesi berisi beberapa gerakan.

## AI

- Daftar alat dan teknik yang dibaca AI menandai latihan multi fungsi: `|MULTI, pilih "for": kode / kode`.
- AI mengisi `"for"` pada item program (Tanya AI, saran di pemilih latihan, Program dari Claude).
  Pilihan yang tidak sah dibuang.
- Di pemilih latihan, otot yang diminta pengguna menang: latihan multi yang dibiarkan kosong atau
  diarahkan ke otot lain oleh AI diset ke otot yang diminta.

## Yang belum

- (Selesai 13 November 2026) 16 perubahan teknik sudah diimpor ke Firebase lewat akun admin; hasilnya
  205 video, 41 di antaranya multi fungsi. Katalog `docs/teknik-katalog.json` memuat hal yang sama.
- Teks belum diperiksa pelatih. Keputusan 67 dan 63 tidak murni dari video.
