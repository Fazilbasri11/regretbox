# REGRETBOX — PRODUCT & TECHNICAL SPECIFICATION

**Versi:** 2.0  
**Tanggal:** 25 November 2026  
**Platform:** Web responsif (desktop, tablet, dan mobile)  
**Konsep:** Pemakaman digital 3D tempat siapa pun dapat menuliskan satu kalimat penyesalan, lalu kalimat itu langsung diabadikan pada batu nisan publik.

---

## 1. Ringkasan Produk

RegretBox adalah pengalaman web interaktif dengan konsep pemakaman digital. Pengunjung menulis **satu kalimat** tentang sesuatu yang ingin mereka kuburkan. Setelah dikirim, sistem langsung membuat batu nisan dan menempatkannya di pemakaman 3D.

RegretBox sengaja dibuat sederhana dan anonim:
- Tidak ada pendaftaran atau login.
- Tidak ada akun pengguna.
- Tidak ada email atau pengingat.
- Tidak ada jadwal menunggu.
- Setiap catatan langsung dimakamkan setelah dikirim.
- Catatan pada batu nisan bersifat publik dan dapat dibaca semua pengunjung.
- Pengirim tidak memiliki dashboard, riwayat pribadi, atau fitur untuk membuka kembali catatan yang sudah dikirim.
- Setiap batu nisan memiliki nomor unik.

**Tagline:** *Write it. Bury it. Let it rest.*

### Prinsip pengalaman
RegretBox bukan aplikasi catatan, jurnal, media sosial, atau layanan terapi. Ini adalah pengalaman simbolis: tulis satu kalimat, kirim, lalu lihat batu nisan baru muncul di pemakaman.

---

## 2. Ruang Lingkup Produk

### Fitur yang wajib ada
1. Landing page dengan pengenalan singkat RegretBox.
2. Form untuk menulis satu kalimat penyesalan.
3. Batas karakter yang jelas.
4. Tombol untuk menguburkan catatan.
5. Pembuatan nomor makam otomatis dan unik.
6. Animasi pemakaman otomatis setelah pengiriman berhasil.
7. Dunia pemakaman 3D yang bisa dijelajahi.
8. Pencarian makam berdasarkan nomor.
9. Batu nisan publik yang tulisannya dapat dibaca semua orang.
10. Tampilan responsif untuk desktop dan mobile.
11. Fallback tampilan 2D/list jika perangkat tidak mendukung 3D.

### Fitur yang tidak boleh dibuat
- Login, registrasi, akun, profil, atau autentikasi pengguna.
- Email, notifikasi, reminder, atau scheduler pengingat.
- Pilihan tanggal pengingat atau masa tunggu.
- Dashboard pribadi atau daftar catatan milik pengguna.
- Fitur melihat kembali catatan melalui halaman privat.
- Fitur edit, resurrection, atau membatalkan pemakaman setelah berhasil dikirim.
- Isi cerita panjang, deskripsi, refleksi, atau kolom tambahan.
- Komentar, chat, like, atau interaksi sosial pada makam.

---

## 3. Alur Pengguna

### Alur utama
1. Pengunjung membuka RegretBox.
2. Pengunjung melihat pemakaman 3D dan tombol **Bury a Regret**.
3. Pengunjung menekan tombol tersebut.
4. Form sederhana muncul dengan satu kolom kalimat.
5. Pengunjung menulis satu kalimat, maksimal 120 karakter.
6. UI menampilkan penghitung karakter.
7. Sebelum mengirim, tampilkan konfirmasi bahwa catatan akan langsung dipublikasikan dan tidak dapat diedit atau ditarik kembali.
8. Pengunjung menyetujui konfirmasi dan menekan **Bury It**.
9. Server memvalidasi teks, menyimpan catatan, dan memberikan nomor makam unik.
10. Kamera bergerak ke lokasi makam baru dan animasi pemakaman diputar.
11. Batu nisan menampilkan nomor dan satu kalimat yang dikirim.
12. Pengunjung dapat kembali menjelajahi pemakaman.

### Setelah pengiriman
- Catatan langsung berstatus `buried`.
- Tidak ada status menunggu atau tanggal pengingat.
- Tidak ada salinan catatan pada dashboard atau halaman privat.
- Catatan tetap menjadi bagian dari pemakaman publik dan dapat ditemukan melalui pencarian nomor.
- Pengirim tidak diberi kemampuan khusus untuk mengubah atau menghapus catatan setelah dikirim.

**Peringatan sebelum submit harus sangat jelas:**
> Your sentence will be published on a public gravestone. It cannot be edited or taken back after burial. Do not include your name, contact details, or other personal information.

---

## 4. Form Catatan

### Satu kolom saja
Label: **What do you want to bury?**  
Placeholder: *Write one sentence. Leave it here.*

Aturan input:
- Wajib diisi.
- Maksimal **120 karakter**.
- Minimal 3 karakter setelah spasi di awal/akhir dihapus.
- Satu kalimat saja; jangan sediakan kolom judul atau isi tambahan.
- Tampilkan penghitung, misalnya `48 / 120`.
- Tolak input kosong atau hanya berisi spasi.
- Trim spasi di awal dan akhir.
- Normalisasi karakter yang tidak diperlukan dan validasi di server.
- Escape output saat ditampilkan untuk mencegah XSS.
- Jangan menerima HTML atau script.

Batas 120 karakter adalah batas produk awal dan dapat diubah melalui konfigurasi tanpa mengubah struktur aplikasi.

### Aturan isi
Tampilkan panduan bahwa catatan bersifat publik. Larang pengguna memasukkan:
- Nama lengkap atau informasi identitas pribadi.
- Nomor telepon, alamat email, alamat rumah, atau akun pribadi.
- Kata sandi, nomor identitas, atau informasi keuangan.
- Ancaman, pelecehan, ujaran kebencian, atau konten ilegal.

Sediakan mekanisme pelaporan dan moderasi untuk konten publik. Jangan menjanjikan bahwa sistem otomatis dapat mendeteksi seluruh informasi sensitif.

---

## 5. Nomor Makam

Format nomor: `#00001`, `#00002`, `#00003`, dan seterusnya.

Ketentuan:
- Nomor diberikan otomatis oleh backend.
- Nomor unik secara global.
- Nomor tidak boleh dipakai ulang.
- Pengunjung tidak memilih nomor sendiri pada MVP.
- Nomor tidak dibuat atau dihitung dari JavaScript di browser.
- Gunakan sequence/identity atau mekanisme database atomik dengan unique constraint.
- Nomor makam menjadi identitas publik batu nisan.

Contoh tampilan batu nisan:

```text
          R.I.P.

        REGRET #00291

  "I should have walked away."

        REST IN PEACE
```

---

## 6. Pemakaman 3D

Pemakaman adalah lingkungan 3D yang dapat dijelajahi, bukan sekadar gambar latar. Pengunjung dapat bergerak, mengubah arah pandang, mendekati batu nisan, dan mencari makam tertentu.

### Elemen lingkungan
- Gerbang utama dengan nama RegretBox.
- Jalan setapak.
- Rumput dan tanah.
- Pepohonan dan semak.
- Bunga dan lentera.
- Kabut tipis.
- Pencahayaan senja atau malam.
- Batu nisan dengan beberapa variasi model.
- Area makam yang dapat diperluas.

Arah visual: **dark cinematic, atmospheric, tenang, sedikit gothic, bukan horor ekstrem**. Pastikan batu nisan dan tulisannya tetap mudah terlihat.

### Interaksi batu nisan
- Batu nisan dapat dipilih dengan klik atau tap.
- Saat dipilih, kamera mendekat secara halus.
- Satu kalimat pada batu nisan ditampilkan dengan jelas.
- Nomor makam selalu terlihat.
- Tidak ada profil pemilik atau informasi akun karena sistem tidak menggunakan akun.
- Pengunjung dapat menyalin atau membagikan tautan publik makam jika fitur permalink diaktifkan.

### Zona pemakaman
Zona dapat digunakan untuk membagi dunia agar mudah dinavigasi:
1. **Entrance** — gerbang dan petunjuk.
2. **New Cemetery** — makam yang baru dibuat.
3. **Old Cemetery** — makam yang lebih lama.
4. **Memorial Garden** — area taman yang lebih tenang.

Pembagian zona adalah struktur visual, bukan lokasi geografis nyata.

---

## 7. Kontrol Desktop

- `W`, `A`, `S`, `D`: bergerak.
- Mouse: mengubah arah pandang melalui drag.
- Scroll wheel: bergerak maju/mundur atau mengatur kecepatan, dengan perilaku yang konsisten dan dijelaskan pada onboarding.
- Klik batu nisan: memilih dan melihat kalimat.
- `Esc`: menutup panel detail.
- Tombol **Search**: membuka pencarian nomor makam.
- Tombol **Reset View**: mengembalikan kamera ke titik awal.
- Tombol **Exit 3D / List View**: beralih ke tampilan alternatif.

Jangan mengambil alih shortcut browser saat fokus berada di input pencarian atau kolom teks.

---

## 8. Kontrol Mobile

Mobile harus menjadi pengalaman yang dirancang khusus, bukan sekadar desktop yang diperkecil.

- Satu jari drag pada area 3D: mengubah arah pandang.
- Virtual joystick di kiri bawah: bergerak.
- Tombol interaksi di kanan bawah: memilih batu nisan yang disorot.
- Tap batu nisan: mendekat dan membuka kalimat.
- Tombol pencarian mudah dijangkau dengan ibu jari.
- Panel detail tampil sebagai bottom sheet.
- Tombol utama minimal sekitar 44 × 44 CSS px.
- Tidak ada interaksi yang hanya bergantung pada hover.
- Area joystick dan kontrol tidak boleh menutupi kolom pencarian atau tombol penting.
- Sediakan tombol untuk keluar dari mode 3D.

Jika performa perangkat rendah, tawarkan **Low Graphics Mode** atau **List View**.

---

## 9. Pencarian Makam

Pencarian utama menggunakan nomor makam.

Contoh input:
- `00291`
- `#00291`

Alur:
1. Pengunjung membuka Search.
2. Pengunjung memasukkan nomor makam.
3. Frontend mengirim permintaan ke backend.
4. Backend mencari nomor yang cocok.
5. Jika ditemukan, kamera bergerak menuju koordinat makam.
6. Batu nisan disorot dan satu kalimat ditampilkan.
7. Jika tidak ditemukan, tampilkan `Grave not found`.

Semua makam pada sistem ini bersifat publik, sehingga tidak diperlukan aturan visibilitas privat.

Pencarian berdasarkan isi kalimat tidak wajib untuk MVP. Prioritaskan pencarian nomor agar implementasi sederhana dan tidak membuka risiko pencarian teks yang disalahgunakan.

---

## 10. Teknologi yang Direkomendasikan

### Frontend
- **Vite** — build tool.
- **TypeScript** — logika aplikasi yang lebih terstruktur.
- **Three.js** — dunia pemakaman 3D.
- **GSAP** — transisi kamera dan animasi pemakaman.
- **HTML/CSS** — UI responsif.

### Backend dan database
- **Supabase Postgres** — menyimpan kalimat publik, nomor makam, dan koordinat 3D.
- **Supabase Edge Functions** atau **Vercel Functions** — validasi dan operasi server.

Tidak perlu Supabase Auth karena tidak ada akun atau login.

### Hosting dan source control
- **GitHub** — repository source code.
- **Vercel** — hosting frontend dan server functions bila diperlukan.
- **Supabase** — database.

### Prinsip arsitektur
- Model 3D, tekstur, audio, dan aset statis disimpan di folder `public/` atau object storage/CDN.
- Database hanya menyimpan data teks pendek, nomor makam, waktu pembuatan, dan koordinat.
- Jangan menyimpan file model 3D di database.
- Secret API hanya berada di environment variable server.
- Jangan menaruh service role key di frontend.
- Karena tidak ada login, endpoint submit dan search harus memiliki rate limit dan validasi server.

---

## 11. Arsitektur Sistem

```text
Pengunjung Desktop / Mobile
          |
          v
     VERCEL HOSTING
          |
          +---- UI responsif
          |
          +---- Three.js Cemetery
          |        +---- Camera & Controls
          |        +---- Grave Models
          |        +---- Search Navigation
          |        +---- Burial Animation
          |
          +---- API / Server Functions
                   |
                   +---- Validasi kalimat
                   +---- Rate limiting
                   +---- Alokasi nomor makam
                   +---- Penentuan koordinat
                   |
                   v
              SUPABASE DB
                   |
                   +---- Graves
```

Tidak ada modul autentikasi, email, notifikasi, atau scheduler.

---

## 12. Rancangan Database

### Tabel `graves`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid primary key | ID internal makam |
| `grave_number` | bigint unique | Nomor publik permanen |
| `inscription` | varchar(120) | Satu kalimat pada batu nisan |
| `pos_x` | real | Koordinat X di dunia 3D |
| `pos_y` | real | Koordinat Y bila diperlukan |
| `pos_z` | real | Koordinat Z di dunia 3D |
| `rotation_y` | real | Arah hadap batu nisan |
| `grave_style` | text | Variasi model batu nisan |
| `created_at` | timestamptz | Waktu makam dibuat |
| `moderation_status` | text | `visible`, `flagged`, atau `hidden` |

Ketentuan database:
- `grave_number` memiliki unique constraint.
- `inscription` wajib dan maksimal 120 karakter.
- Nomor makam dibuat oleh database/backend secara atomik.
- Koordinat harus berada di area pemakaman yang valid.
- Tidak ada `user_id`, email, profil, atau relasi akun.
- Tidak ada tabel reminder, reflection, atau user profile.

### Keamanan akses database
- Jangan memberikan akses anon langsung untuk insert bebas ke tabel tanpa validasi.
- Pengunjung membaca data publik melalui endpoint yang hanya mengembalikan kolom yang diperlukan.
- Pembuatan makam dilakukan melalui server function yang memvalidasi teks, menerapkan rate limit, dan mengalokasikan nomor.
- Jangan pernah mengekspos service role key.

---

## 13. Moderasi dan Perlindungan Penyalahgunaan

Karena semua kalimat bersifat publik dan tidak ada akun, sistem perlu perlindungan penyalahgunaan.

MVP minimal:
- Batas 120 karakter.
- Rate limit berdasarkan IP atau mekanisme abuse prevention yang sesuai.
- Validasi dan sanitasi input di server.
- Escape teks saat dirender.
- Proteksi spam sederhana, misalnya honeypot dan/atau challenge anti-bot jika dibutuhkan.
- Tombol **Report this gravestone**.
- Status moderasi `visible`, `flagged`, dan `hidden`.
- Prosedur admin untuk menyembunyikan konten yang melanggar aturan.

Jangan mengumpulkan atau menyimpan alamat IP lebih lama dari yang diperlukan untuk keamanan. Jika IP dipakai untuk rate limiting, jelaskan praktik tersebut dalam kebijakan privasi dan tetapkan retensi minimum.

Tampilkan pemberitahuan bahwa catatan bersifat publik, dapat dibaca siapa saja, dan tidak dapat diedit setelah dikirim. Pengguna harus menghindari informasi pribadi.

---

## 14. Desain UI/UX

### Arah visual
- Background: charcoal, hitam kebiruan, atau midnight blue.
- Aksen: abu-abu batu, putih tulang, dan amber lentera.
- Font judul: serif elegan.
- Font UI: sans-serif yang mudah dibaca.
- Efek: kabut halus, cahaya lembut, bayangan, dan kamera bergerak perlahan.
- Hindari efek horor berlebihan.

### Landing page
Komponen:
- Logo RegretBox.
- Headline: **Some things deserve a proper burial.**
- Deskripsi singkat tentang cara kerja.
- Tombol **Explore Cemetery**.
- Tombol **Bury a Regret**.
- Search by grave number.
- Jumlah makam publik, jika ingin ditampilkan.

### Form penguburan
- Satu textarea/input saja.
- Penghitung karakter `0 / 120`.
- Peringatan bahwa kalimat akan menjadi publik dan tidak dapat ditarik kembali.
- Checkbox konfirmasi publikasi.
- Tombol **Bury It**.

### Tampilan makam
- Nomor makam.
- Satu kalimat.
- Ornamen sederhana.
- Tidak ada nama pemilik, avatar, profil, atau informasi akun.

### Desktop
- Navigasi horizontal.
- Canvas 3D menjadi area utama.
- Search pada bagian atas atau panel samping.
- Panel detail makam di sisi layar.

### Mobile
- Canvas 3D memenuhi area konten.
- Kontrol joystick di bawah.
- Search dalam tombol/overlay yang mudah dijangkau.
- Detail makam berupa bottom sheet.
- Form satu kolom.
- Tidak ada horizontal overflow pada lebar layar kecil.

### Aksesibilitas
- Kontras teks memadai.
- Fokus keyboard terlihat.
- Semua tombol memiliki label.
- Hormati `prefers-reduced-motion`.
- Sediakan List View 2D.
- Jangan mengandalkan warna atau hover saja untuk menyampaikan informasi.

---

## 15. Performa 3D

Pemakaman dapat berisi ribuan batu nisan. Optimasi harus dirancang sejak awal.

Gunakan:
- `THREE.InstancedMesh` untuk model batu nisan yang berulang.
- Level of Detail (LOD) untuk objek jauh.
- Frustum culling.
- Texture atlas dan material bersama.
- Baked lighting untuk lingkungan statis.
- Jumlah dynamic lights dan shadow terbatas.
- Lazy loading model dan tekstur.
- Pembagian pemakaman menjadi area/chunk.
- Query makam berdasarkan area yang sedang dilihat.
- Raycasting hanya pada objek yang relevan.

Target awal:
- Pengalaman stabil pada perangkat menengah.
- Target 30–60 FPS sesuai kemampuan perangkat.
- Sediakan Low Graphics Mode.
- Deteksi WebGL; jika tidak tersedia, tampilkan List View 2D.
- Jangan memuat semua detail ribuan makam sekaligus.

### Penempatan makam
- Backend memilih slot/koordinat yang belum terpakai.
- Jangan menempatkan makam secara acak dari browser tanpa validasi.
- Gunakan grid atau sistem slot agar makam tidak saling bertumpuk.
- Area pemakaman dapat diperluas ketika slot hampir penuh.

---

## 16. Struktur Folder Proyek

```text
regretbox/
├── public/
│   ├── models/
│   │   ├── tombstones/
│   │   └── environment/
│   ├── textures/
│   ├── audio/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── main.ts
│   │   ├── router.ts
│   │   └── config.ts
│   ├── components/
│   │   ├── Search/
│   │   ├── GraveDetails/
│   │   ├── BurialForm/
│   │   ├── BottomSheet/
│   │   └── Modal/
│   ├── pages/
│   │   ├── Home/
│   │   ├── Cemetery/
│   │   └── NotFound/
│   ├── three/
│   │   ├── CemeteryScene.ts
│   │   ├── CameraController.ts
│   │   ├── DesktopControls.ts
│   │   ├── MobileControls.ts
│   │   ├── GraveManager.ts
│   │   ├── SearchNavigator.ts
│   │   ├── BurialAnimation.ts
│   │   ├── AssetLoader.ts
│   │   └── PerformanceManager.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── graves.ts
│   ├── styles/
│   └── utils/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 17. Environment Variables

Contoh `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server-side only
SUPABASE_SERVICE_ROLE_KEY=
RATE_LIMIT_SECRET=
```

Aturan:
- Variabel `VITE_*` masuk ke bundle frontend dan bukan tempat menyimpan secret.
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh digunakan di server.
- Jangan commit file `.env` ke GitHub.
- Jangan mengarang kredensial; dokumentasikan cara mengisi environment variable.

---

## 18. Halaman yang Dibutuhkan

1. **Home** — pengenalan RegretBox dan CTA.
2. **Cemetery 3D** — dunia pemakaman yang dapat dijelajahi.
3. **Bury Form** — satu kolom kalimat maksimal 120 karakter.
4. **Grave Detail** — nomor makam dan satu kalimat publik.
5. **Search** — mencari nomor makam.
6. **List View** — alternatif 2D untuk perangkat yang tidak mendukung 3D.
7. **Report Content** — melaporkan batu nisan.
8. **Terms & Privacy** — ketentuan publikasi, moderasi, dan privasi.

Tidak perlu halaman login, registrasi, profil, dashboard pribadi, pengaturan akun, atau halaman reminder.

---

## 19. Kriteria Penerimaan (Acceptance Criteria)

### Catatan
- [ ] Pengunjung dapat mengirim catatan tanpa login atau membuat akun.
- [ ] Hanya ada satu kolom kalimat.
- [ ] Batas input maksimal 120 karakter.
- [ ] Penghitung karakter berfungsi.
- [ ] Input kosong ditolak.
- [ ] Konfirmasi publikasi ditampilkan sebelum submit.
- [ ] Catatan langsung dimakamkan setelah server mengonfirmasi penyimpanan.
- [ ] Tidak ada fitur edit atau hapus oleh pengirim.
- [ ] Tidak ada dashboard atau riwayat pribadi.

### Nomor dan makam
- [ ] Setiap makam memiliki nomor unik.
- [ ] Nomor diberikan oleh backend/database.
- [ ] Nomor tidak digunakan ulang.
- [ ] Posisi makam tidak bertumpuk.
- [ ] Kalimat dapat dibaca semua pengunjung.
- [ ] Pencarian nomor menemukan makam yang sesuai.

### 3D dan perangkat
- [ ] Pemakaman dapat dijelajahi di desktop.
- [ ] Kontrol mouse dan keyboard berfungsi.
- [ ] Pemakaman dapat dijelajahi di mobile.
- [ ] Kontrol sentuh dan joystick berfungsi.
- [ ] Tap/click batu nisan menampilkan kalimat.
- [ ] Search mengarahkan kamera ke makam yang ditemukan.
- [ ] Ada List View 2D jika WebGL tidak tersedia.
- [ ] Tidak ada horizontal overflow pada layar 320 px.

### Larangan fitur
- [ ] Tidak ada login atau registrasi.
- [ ] Tidak ada akun atau profil.
- [ ] Tidak ada email atau reminder.
- [ ] Tidak ada scheduler pengingat.
- [ ] Tidak ada isi panjang atau kolom deskripsi.
- [ ] Tidak ada resurrection atau fitur membuka kembali catatan secara privat.

### Keamanan
- [ ] Validasi dilakukan di server.
- [ ] Output teks di-escape.
- [ ] Rate limiting aktif.
- [ ] Secret tidak muncul di frontend.
- [ ] Mekanisme report/moderasi tersedia.

---

## 20. Tahapan Pengembangan

### Phase 1 — Fondasi web
- Setup Vite dan TypeScript.
- Setup Supabase database.
- Buat landing page responsif.
- Buat API submit dan search.
- Buat schema `graves` dan nomor unik.

**Hasil:** pengunjung dapat mengirim satu kalimat tanpa akun dan data tersimpan.

### Phase 2 — Pemakaman 3D
- Buat scene Three.js.
- Buat lingkungan pemakaman.
- Tambahkan model batu nisan.
- Ambil data makam dari database.
- Tampilkan nomor dan kalimat pada batu nisan.

**Hasil:** data publik tampil di dunia 3D.

### Phase 3 — Navigasi desktop dan mobile
- Kontrol keyboard dan mouse.
- Joystick dan gesture mobile.
- Panel detail makam.
- Search dan navigasi kamera.
- List View 2D.

**Hasil:** pemakaman dapat dijelajahi di desktop dan ponsel.

### Phase 4 — Upacara pemakaman
- Form satu kalimat.
- Penghitung karakter.
- Konfirmasi publikasi.
- Submit ke backend.
- Animasi kamera menuju slot baru.
- Animasi batu nisan muncul.

**Hasil:** setelah submit berhasil, makam langsung dibuat dan ditampilkan.

### Phase 5 — Moderasi dan optimasi
- Rate limiting dan anti-spam.
- Report content.
- Admin moderation sederhana.
- Optimasi InstancedMesh, LOD, dan chunk loading.
- Uji performa perangkat mobile.
- Uji aksesibilitas dan keamanan.

**Hasil:** aplikasi siap untuk peluncuran terbatas.

---

## 21. Hosting dan Biaya

| Layanan | Fungsi | Catatan |
|---|---|---|
| Vercel | Hosting frontend dan API | Paket Hobby memiliki batas penggunaan dan ketentuan nonkomersial |
| Supabase | Database PostgreSQL | Paket gratis memiliki kuota dan batas tertentu |
| GitHub | Source code | Untuk version control |

Catatan:
- MVP dapat dimulai dengan layanan gratis selama penggunaan masih sesuai batas dan ketentuan masing-masing penyedia.
- Vercel Hobby ditujukan untuk penggunaan personal/nonkomersial. Periksa paket yang sesuai jika aplikasi dimonetisasi.
- Periksa kuota database, bandwidth, function execution, dan kebijakan pause sebelum peluncuran.
- Siapkan backup database jika mulai menyimpan catatan publik pengguna.

Referensi harga resmi:
- Vercel: https://vercel.com/pricing
- Supabase: https://supabase.com/pricing

---

## 22. Instruksi untuk AI Coding Agent

Bangun RegretBox berdasarkan spesifikasi ini. Jangan menambahkan fitur yang secara eksplisit dilarang.

### Aturan implementasi
1. Baca seluruh dokumen sebelum mulai coding.
2. Gunakan Vite + TypeScript + Three.js.
3. Pastikan desain mobile dan desktop sama-sama menjadi prioritas.
4. Tidak boleh ada login, registrasi, akun, profil, atau autentikasi.
5. Tidak boleh ada email, reminder, scheduler, atau notifikasi.
6. Form hanya memiliki satu kolom kalimat, maksimal 120 karakter.
7. Tidak boleh ada judul terpisah, deskripsi, atau isi panjang.
8. Setelah submit berhasil, catatan langsung menjadi makam publik.
9. Pengirim tidak dapat mengedit, menghapus, atau membuka catatan melalui halaman privat.
10. Semua pengunjung dapat membaca kalimat pada batu nisan.
11. Nomor makam dibuat secara atomik oleh backend/database.
12. Gunakan rate limiting dan validasi server karena endpoint tidak memakai login.
13. Jangan mengekspos service role key di frontend.
14. Gunakan InstancedMesh/LOD/chunk loading untuk menjaga performa 3D.
15. Sediakan kontrol desktop, kontrol mobile, dan List View 2D.
16. Jangan membuat tombol palsu atau fitur yang hanya tampak berfungsi.
17. Sertakan `.env.example`, migration database, seed data demonstrasi, README, dan panduan deployment.
18. Jalankan build dan perbaiki error setelah setiap fase.
19. Jika layanan eksternal memerlukan kredensial, dokumentasikan konfigurasi; jangan mengganti integrasi nyata dengan simulasi tanpa penjelasan.

### Urutan deliverable
1. Project scaffold dan UI responsif.
2. Database, API submit, nomor makam unik, dan pencarian.
3. Dunia pemakaman 3D dan model batu nisan.
4. Kontrol desktop dan mobile.
5. Form satu kalimat dan animasi pemakaman otomatis.
6. Moderasi, optimasi, pengujian, dan deployment.

### Definisi selesai
Aplikasi dapat dijalankan lokal dan di-deploy ke Vercel. Pengunjung dapat mengirim satu kalimat maksimal 120 karakter tanpa login. Catatan langsung dibuat menjadi makam publik bernomor unik, dapat dibaca semua orang, dan dapat ditemukan melalui pencarian. Pemakaman 3D dapat dijelajahi dengan nyaman di desktop maupun mobile. Tidak ada akun, login, email, reminder, dashboard pribadi, atau fitur membuka kembali catatan yang telah dikuburkan.
