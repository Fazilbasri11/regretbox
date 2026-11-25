# REGRETBOX — PRODUCT & TECHNICAL SPECIFICATION

**Versi:** 3.0  
**Tanggal:** 25 November 2026  
**Platform:** Web responsif (desktop, tablet, dan mobile)  
**Konsep:** Pemakaman digital 3D tempat siapa pun dapat menuliskan satu kalimat penyesalan, lalu kalimat itu langsung diabadikan pada batu nisan publik.

---

## Perubahan dari v2.0

1. **Tidak ada landing page.** Membuka web langsung menampilkan pemakaman 3D. Tidak ada halaman pembuka, headline pemasaran, atau tombol yang harus ditekan sebelum pemakaman terlihat.
2. **Target visual diganti total** mengikuti gambar referensi `docs/reference/cemetery-reference.png` (bagian 0). Tampilan v2.0 (low-poly datar, gelap merata, teks nisan tidak terbaca, halaman bisa di-scroll) **tidak diterima**.
3. **Batu nisan, elemen, cahaya, dan background** dispesifikasikan rinci: komposisi layar dalam persen, palet warna, model, material, pencahayaan, dan post-processing (bagian 7 dan 8).
4. **HUD / UI overlay** mengikuti referensi (bagian 9).
5. **Strategi aset** ditambahkan karena tampilan referensi tidak bisa dicapai dengan primitif geometri (bagian 10).
6. **Acceptance criteria visual** dan **proses Visual QA** ditambahkan (bagian 23 dan 26).
7. Label tombol utama menjadi **Add Your Regret** (sesuai referensi). Tombol kirim di form tetap **Bury It**.
8. Aturan produk lainnya **tidak berubah**: tanpa login/akun, satu kalimat maksimal 120 karakter, langsung publik, tidak bisa diedit atau ditarik kembali.

---

## 0. Referensi Visual dan Aturan Kesetiaan

**File referensi:** `docs/reference/cemetery-reference.png` (1024 × 576, rasio 16:9). Baca gambar ini sebelum menulis kode apa pun, dan bandingkan hasil dengannya setelah setiap perubahan scene.

Gambar tersebut adalah **target visual**. Pada viewport desktop 1920 × 1080, layar pertama harus bisa dikenali sebagai scene yang sama: komposisi, warna, cahaya, atmosfer, model, dan tata letak UI. Real-time di browser tidak harus identik piksel demi piksel, tetapi elemen, posisi, ukuran relatif, dan suasananya harus sama. Jika teks spec bertentangan dengan gambar, **gambar yang menang**, kecuali pada tabel penyimpangan di bawah.

### Penyimpangan yang disengaja

Beberapa elemen pada gambar bertentangan dengan aturan produk (tanpa akun, tanpa dashboard pribadi, tanpa data palsu). Elemen itu **diganti, bukan dihapus**, agar tata letak tetap sama:

| Di gambar referensi | Di implementasi | Alasan |
|---|---|---|
| Menu **My Regrets** | **List View** | Tidak ada dashboard atau daftar pribadi |
| Menu **Stats** | **Search #** | Tidak ada halaman Stats; pencarian nomor wajib |
| Avatar akun di kanan atas | Tombol pengaturan tampilan (ikon gear) | Tidak ada akun atau profil |
| **Visitors Today** | **Buried Today** (jumlah makam dibuat hari ini) | Pengunjung tidak dilacak |
| Chip cuaca **24°C Foggy** | Chip suasana **Night / Foggy** tanpa suhu | Tidak ada data cuaca asli; jangan memalsukan angka |
| Kalimat contoh di nisan | Kalimat dari database | Konten nyata |

### Yang salah pada tampilan sebelumnya (jangan diulang)

Tampilan v2.0 di `localhost:5173/cemetery` dinilai tidak bagus karena:

1. Layout tidak full-screen: header terpotong di atas, halaman bisa di-scroll, footer muncul di bawah canvas.
2. Scene datar: tidak ada bulan, tidak ada langit berawan, tidak ada cahaya terarah, kabut biru-hijau gelap yang merata.
3. Objek berupa primitif low-poly: pohon seperti gumpalan, kapel berupa kotak dengan jendela kuning, lentera kotak, paving dengan grid tajam, batu putih polos.
4. Batu nisan kecil dan gelap; tulisannya tidak terbaca dari posisi awal kamera.
5. Papan "Bury a Regret" tertutup tiangnya sendiri sehingga teksnya terbaca rusak ("Bury a gret").
6. Lentera dan jendela tidak berpendar; jalan tidak memantulkan cahaya.
7. Tombol kontrol (Search, Reset View, Low GFX, Exit 3D, dropdown waktu) berupa deretan pil besar yang menutupi scene.

### Larangan

- Jangan mengganti elemen referensi dengan versi sederhana (kotak, silinder, bidang datar, lampu tanpa glow) lalu menganggapnya selesai.
- Jangan menurunkan kualitas visual demi mempercepat pengerjaan tanpa melaporkannya secara jujur (bagian 26).

---

## 1. Ringkasan Produk

RegretBox adalah pengalaman web interaktif dengan konsep pemakaman digital. Pengunjung **langsung masuk ke pemakaman 3D** yang bisa dijelajahi, lalu menulis **satu kalimat** tentang sesuatu yang ingin mereka kuburkan. Setelah dikirim, sistem langsung membuat batu nisan dan menempatkannya di pemakaman itu.

RegretBox sengaja dibuat sederhana dan anonim:
- Tidak ada pendaftaran atau login.
- Tidak ada akun pengguna.
- Tidak ada email atau pengingat.
- Tidak ada jadwal menunggu.
- Setiap catatan langsung dimakamkan setelah dikirim.
- Catatan pada batu nisan bersifat publik dan dapat dibaca semua pengunjung.
- Pengirim tidak memiliki dashboard, riwayat pribadi, atau fitur untuk membuka kembali catatan yang sudah dikirim.
- Setiap batu nisan memiliki nomor unik.

**Tagline:** *Write it. Bury it. Let it rest.* (ditampilkan pada layar loading dan di bagian bawah form penguburan, bukan pada landing page.)

### Prinsip pengalaman

RegretBox bukan aplikasi catatan, jurnal, media sosial, atau layanan terapi. Ini adalah pengalaman simbolis: tulis satu kalimat, kirim, lalu lihat batu nisan baru muncul di pemakaman. Suasananya sinematik, tenang, dan sedikit gothic.

---

## 2. Ruang Lingkup Produk

### Fitur yang wajib ada

1. **Pemakaman 3D sebagai layar pertama**, tanpa landing page, dengan intro kamera sinematik singkat yang berjalan otomatis.
2. Papan kayu **Add Your Regret** di dalam dunia 3D (dengan tombol HTML yang setara untuk aksesibilitas) untuk membuka form.
3. Form untuk menulis satu kalimat penyesalan.
4. Batas karakter yang jelas.
5. Tombol **Bury It** untuk menguburkan catatan.
6. Pembuatan nomor makam otomatis dan unik.
7. Animasi pemakaman otomatis setelah pengiriman berhasil.
8. Dunia pemakaman 3D yang bisa dijelajahi, dengan kualitas visual sesuai referensi (bagian 0, 7, 8).
9. Pencarian makam berdasarkan nomor.
10. Batu nisan publik yang tulisannya dapat dibaca semua orang.
11. HUD sesuai referensi (bagian 9).
12. Tampilan responsif untuk desktop dan mobile.
13. Fallback tampilan 2D/list jika perangkat tidak mendukung 3D.

### Fitur yang tidak boleh dibuat

- **Landing page**, halaman pemasaran, atau hero page terpisah sebelum pemakaman.
- Login, registrasi, akun, profil, avatar, atau autentikasi pengguna.
- Email, notifikasi, reminder, atau scheduler pengingat.
- Pilihan tanggal pengingat atau masa tunggu.
- Dashboard pribadi, halaman "My Regrets", atau daftar catatan milik pengguna.
- Fitur melihat kembali catatan melalui halaman privat.
- Fitur edit, resurrection, atau membatalkan pemakaman setelah berhasil dikirim.
- Isi cerita panjang, deskripsi, refleksi, atau kolom tambahan.
- Komentar, chat, like, atau interaksi sosial pada makam.
- Tombol, chip, atau angka palsu yang hanya tampak berfungsi.

---

## 3. Alur Pengguna

### Alur utama

1. Pengunjung membuka RegretBox (`/`).
2. Layar loading minimal muncul (bulan kecil, wordmark RegretBox, tagline, bar progres tipis). Ini **bukan landing page**: tidak ada headline pemasaran dan tidak ada tombol yang harus ditekan. Layar hilang otomatis saat aset siap.
3. Kamera melakukan dolly-in sinematik singkat (sekitar 3 detik) menuju posisi awal. Input apa pun (klik, tap, tombol, scroll) langsung melewati intro.
4. Pengunjung melihat pemakaman 3D sesuai komposisi referensi, termasuk papan kayu **Add Your Regret**.
5. Pengunjung mengklik papan itu (atau tombol HTML yang setara).
6. Form sederhana muncul dengan satu kolom kalimat.
7. Pengunjung menulis satu kalimat, maksimal 120 karakter.
8. UI menampilkan penghitung karakter.
9. Sebelum mengirim, tampilkan konfirmasi bahwa catatan akan langsung dipublikasikan dan tidak dapat diedit atau ditarik kembali.
10. Pengunjung menyetujui konfirmasi dan menekan **Bury It**.
11. Server memvalidasi teks, menyimpan catatan, dan memberikan nomor makam unik.
12. Kamera bergerak ke lokasi makam baru dan animasi pemakaman diputar.
13. Batu nisan menampilkan nomor, satu kalimat yang dikirim, dan tanggal.
14. Pengunjung dapat kembali menjelajahi pemakaman.

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

## 5. Nomor Makam dan Format Batu Nisan

Format nomor: `#00001`, `#00002`, `#00003`, dan seterusnya.

Ketentuan:
- Nomor diberikan otomatis oleh backend.
- Nomor unik secara global.
- Nomor tidak boleh dipakai ulang.
- Pengunjung tidak memilih nomor sendiri pada MVP.
- Nomor tidak dibuat atau dihitung dari JavaScript di browser.
- Gunakan sequence/identity atau mekanisme database atomik dengan unique constraint.
- Nomor makam menjadi identitas publik batu nisan.

### Isi tulisan pada batu nisan (sesuai referensi)

Urutan baris, rata tengah:

```text
          R.I.P.

      Regret #00291

  "Seharusnya aku tidak
      membeli itu."

   Dikuburkan: 25 Nov 2026
```

- Baris 1: `R.I.P.` (kapital kecil, letter-spacing lebar).
- Baris 2: `Regret #` + nomor 5 digit.
- Baris 3: kalimat pengguna, huruf miring, diberi tanda kutip.
- Baris 4: label `Dikuburkan:` + tanggal dari `created_at` dalam format `D MMM YYYY` (locale `id-ID`, contoh `25 Nov 2026`).
- Label `Dikuburkan:` disimpan di `config.ts` (`graveDateLabel`) agar mudah diganti bahasa.

### Tata letak teks pada muka batu (persentase tinggi muka batu dari atas)

| Elemen | Posisi vertikal | Gaya |
|---|---|---|
| `R.I.P.` | 12–18% | Serif kapital kecil, letter-spacing 0.18em |
| `Regret #00291` | 24–32% | Serif, ukuran sedang |
| Pembatas ornamen tipis | sekitar 37% | Garis 1 px dengan titik tengah |
| Kalimat pengguna | 42–72% | Serif miring, maksimal 5 baris, ukuran font otomatis menyesuaikan panjang teks |
| Pembatas | sekitar 77% | Garis 1 px |
| `Dikuburkan: tanggal` | 82–90% | Serif kecil, warna sedikit lebih redup |

Cara render teks yang membuatnya terbaca dijelaskan di bagian 7.3.

---

## 6. Pemakaman 3D: Struktur Dunia dan Interaksi

Pemakaman adalah lingkungan 3D yang dapat dijelajahi, bukan sekadar gambar latar. Pengunjung dapat bergerak, mengubah arah pandang, mendekati batu nisan, dan mencari makam tertentu. Tampilan visualnya diatur di bagian 7 dan 8.

### Zona pemakaman

1. **Entrance**: gerbang besi, pilar berlentera, dan jalan masuk.
2. **Old Cemetery**: makam lama, dekat gerbang dan kapel.
3. **New Cemetery**: makam terbaru; di sinilah kamera awal berada.
4. **Memorial Garden**: taman tenang di sekitar kapel dengan lebih banyak bunga dan lentera.

Pembagian zona adalah struktur visual, bukan lokasi geografis nyata.

### Penempatan makam dan posisi awal kamera

- Backend mengalokasikan slot secara berurutan **dari dekat gerbang menjauhi gerbang** di sepanjang jalan setapak, selang-seling kiri dan kanan. Dengan begitu makam terbaru selalu berada di tepi terjauh dari gerbang, dan dua makam sebelumnya otomatis berada di sisi kiri dan kanan makam terbaru.
- Jarak antarbaris sekitar 3 m. Backend menambahkan deviasi kecil (`rotation_y` ±10°, offset ±0.25 m) di dalam area valid.
- Semua batu nisan **menghadap menjauhi gerbang** (ke arah kamera awal) dengan deviasi ±10°, sehingga tulisan terbaca saat pengunjung bergerak dari area baru menuju gerbang.
- **Posisi awal kamera dihitung relatif terhadap makam terbaru**: sekitar 3.2 m di belakangnya, tinggi mata 1.5 m, menghadap ke gerbang, dengan makam terbaru berada pada posisi "hero" (bagian 7.2). **Reset View** kembali ke posisi ini.
- Saat makam baru dibuat, "frontier" bergeser. Lingkungan (rumput, pagar, pohon, kabut) diperluas per chunk mengikuti frontier.
- Jika makam kurang dari 3, komposisi tetap sama; slot kosong diisi bunga dan lentera tanpa nisan.

### Interaksi batu nisan

- Batu nisan dapat dipilih dengan klik atau tap.
- Saat dipilih, kamera mendekat secara halus ke jarak sekitar 1.8 m di depan nisan, setinggi mata 1.1 m, FOV menyempit ke sekitar 38°, dan latar belakang di-blur ringan (depth of field).
- Pada saat dipilih, tulisan nisan di-render pada resolusi tertinggi (bagian 7.3).
- Satu kalimat, nomor, dan tanggal ditampilkan jelas pada nisan dan pada panel detail.
- Nomor makam selalu terlihat.
- Tidak ada profil pemilik atau informasi akun karena sistem tidak menggunakan akun.
- Pengunjung dapat menyalin atau membagikan tautan publik makam (`/grave/00291`).
- Tersedia tombol **Report this gravestone** pada panel detail.

---
## 7. Arah Visual dan Komposisi Scene

### 7.1 Suasana

**Pemakaman gothic berkabut di bawah bulan purnama.** Sinematik, tenang, dan sedikit misterius, bukan horor ekstrem. Bayangan dingin (indigo, biru), titik cahaya hangat (amber lentera). Rumput hijau gelap dengan kabut tipis di permukaan tanah, batu nisan berlumut, dan jalan batu yang basah memantulkan cahaya lentera.

Waktu dan cuaca **dikunci pada "Moonlit Foggy Night"**. Tidak ada siklus siang/malam otomatis, tidak ada dropdown waktu, dan tampilan tidak mengikuti jam perangkat.

### Palet warna

| Nama | Hex | Dipakai untuk |
|---|---|---|
| Midnight Indigo | `#0B1026` | Langit atas, bayangan terdalam |
| Deep Navy | `#121A38` | Langit tengah, kabut jauh |
| Horizon Haze | `#2A3A66` | Langit dekat horizon |
| Moon Mist | `#8FA6D9` | Rim light bulan, kabut yang tersinari |
| Moon Glow | `#DCE6FF` | Cakram bulan dan halo |
| Slate Stone | `#6F7380` sampai `#8C8A84` | Permukaan batu nisan (dengan variasi) |
| Moss | `#3F5A3A` | Lumut |
| Grass Dark | `#17261C` | Rumput |
| Lantern Amber | `#FFB45A` | Api lentera, jendela kapel, papan kayu |
| Ember Core | `#FFD9A0` | Inti api |
| Bone Ivory | `#E9E4D8` | Teks UI dan ukiran |
| Hydrangea Violet / Blue | `#6E5BB8` / `#4D6FD1` | Bunga hydrangea |
| Daisy White | `#F4F1E8` | Bunga daisy |

### 7.2 Peta komposisi (posisi awal kamera, viewport 16:9)

Persentase dihitung dari lebar (x) dan tinggi (y) layar, titik 0,0 di kiri atas. Ini nilai awal; **sesuaikan sampai screenshot cocok dengan referensi**.

**Kamera:** FOV vertikal 44–48°, tinggi mata 1.5 m, pitch sekitar −4°. Garis horizon (dasar gerbang) berada sekitar y = 42%.

| Elemen | Posisi | Ukuran relatif | Catatan |
|---|---|---|---|
| Bulan purnama | x ≈ 62%, y ≈ 12% | Diameter ≈ 9% lebar layar | Halo lebar, awan tipis melintas di tepi bawahnya |
| Cabang pohon gundul | Sudut kiri atas, x 0–35%, y 0–45% | Siluet gelap, tepi disorot bulan | Menjorok ke dalam frame dari kiri atas |
| Gerbang besi | Tengah, x ≈ 55%, dasar di y ≈ 42% | Lebar ≈ 18% layar, tinggi ≈ 25% | Emblem **R** dalam lingkaran di puncak lengkung |
| Pilar gerbang | Kiri dan kanan gerbang | Tinggi ≈ 1.3× gerbang | Lentera menyala di atas masing-masing pilar |
| Pagar besi | Memanjang ±15% layar dari gerbang | Tinggi ≈ 8% layar | Ujung tombak (finial), melengkung ke kabut |
| Kapel gothic | x 68–88%, y 20–45% | Tinggi ≈ 25% layar | Jendela lengkung runcing menyala amber di x ≈ 74%, y ≈ 35% |
| Jalan batu basah | Dari bawah (x 55–80%) menyempit ke gerbang | Lebar ≈ 3 m | Pantulan lentera, lumut di sela batu |
| **Nisan hero** (terbaru) | Tengah-kiri, x ≈ 42%, dasar di y ≈ 82% | Tinggi ≈ 40% layar | Teks terbaca penuh tanpa zoom |
| Nisan kiri (sebelumnya) | x ≈ 18%, dasar di y ≈ 74% | Tinggi ≈ 25% layar | Sedikit menghadap kanan |
| Nisan kanan (sebelumnya) | x ≈ 63%, dasar di y ≈ 72% | Tinggi ≈ 22% layar | Sedikit menghadap kiri |
| Lentera di dasar nisan | Kiri-depan masing-masing nisan | Tinggi ≈ 9% layar (hero) | Api berkedip halus, glow hangat di batu dan rumput |
| Nisan jauh (siluet) | Baris selang-seling, y 42–60% | Mengecil dan memudar dalam kabut | Minimal 15 siluet terlihat |
| Titik lentera jauh | Tersebar di pagar, jalan, tengah dan jauh | Titik kecil berpendar | Minimal 12 titik terlihat |
| Hydrangea ungu/biru | Pojok kiri bawah, x 0–25%, y 78–100% | Besar, sedikit out-of-focus | Bunga kecil putih di sela-sela |
| Buket daisy putih | Dasar nisan hero | Kecil | Menerima cahaya lentera |
| Papan kayu **Add Your Regret** | Kanan, x 82–98%, y 56–80% | Tinggi ≈ 24% layar | Bentuk papan panah menunjuk ke kiri, miring sekitar −6° |

**Layar potret (mobile):** pertahankan FOV horizontal minimal 70° dengan memundurkan dan menaikkan kamera sedikit. Nisan hero dan gerbang **harus tetap terlihat**; kapel dan papan boleh terpotong (papan tetap bisa diakses lewat tombol HTML, bagian 9).

### 7.3 Batu nisan

**Model hero "Arched Classic"**
- Dimensi: lebar sekitar 1.0 m, tinggi 1.5 m, tebal 0.3 m, bagian atas melengkung setengah lingkaran.
- Muka batu memiliki **bingkai cekung bertingkat** (bevel) sekitar 6 cm dari tepi, seperti pada referensi.
- Alas (plinth) lebih lebar dari badan: sekitar 1.3 × 0.25 × 0.6 m, setengah terbenam di tanah.
- Pelapukan: lumut di bagian bawah dan retakan, noda air memanjang dari atas, tepi sedikit gompal.
- Material PBR batu kapur lapuk: albedo, normal, roughness 0.85–0.95, ambient occlusion. Warna dasar abu-abu cokelat hangat sampai abu-abu kebiruan (lihat palet).
- Jumlah segitiga: hero ≥ 8.000, LOD menengah ≈ 1.500, LOD jauh ≈ 150.

**Varian model (minimal 4)** dipilih backend lewat `grave_style`:

| `grave_style` | Bentuk | Bobot |
|---|---|---|
| `arched` | Lengkung klasik (model hero) | 45% |
| `slim` | Lengkung ramping, lebih tinggi | 25% |
| `cross` | Berhias salib di puncak | 15% |
| `scroll` | Puncak datar dengan gulungan ornamen | 15% |

Setiap instans diberi variasi acak kecil: kemiringan ±2.5°, skala ±8%, tint warna ±6%.

**Rendering tulisan agar terbaca dan terlihat terukir**
1. Render teks ke `CanvasTexture` dengan font serif (bagian 9), mengikuti tata letak bagian 5.
2. Warna tulisan **ivory hangat** `#E6D9BD` pada opasitas 85%, dengan bayangan dalam gelap 1–2 px agar terlihat terukir.
3. Hasilkan **normal/bump map dari teks yang sama** (render ke height canvas, blur ringan, ubah ke normal) sehingga cahaya bulan dan lentera menangkap tepi huruf.
4. Ukuran font otomatis (auto-fit): mulai dari ukuran terbesar yang muat, turunkan bertahap sampai kalimat muat dalam maksimal 5 baris.
5. Tingkat detail berdasarkan jarak:
   - Terdekat (sampai ±18 m, maksimal 24 nisan): tekstur individual 1024 × 1280, anisotropy 8–16.
   - Menengah (±18–40 m): tekstur lebih kecil dari atlas bersama.
   - Jauh: tanpa tulisan, hanya siluet.
   - Saat nisan dipilih: naikkan ke 2048 untuk nisan itu.
6. Gunakan cache LRU (maksimal 48 tekstur tulisan) dan panggil `dispose()` pada tekstur yang dikeluarkan.
7. **Syarat keterbacaan:** pada viewport 1920 × 1080 di posisi awal, kalimat pada nisan hero tinggi hurufnya minimal 22 px, dan nomor serta tanggal terbaca tanpa zoom. Rata-rata kecerahan muka batu hero minimal sekitar 70/255 di bawah pencahayaan scene. Kontras teks terhadap batu minimal 4.5:1.

**Detail sekitar nisan:** gundukan tanah gelap di depan, rumput lebat di dasar, kerikil kecil, lentera di sisi kiri-depan, buket bunga di dasar (daisy putih pada hero).

**Nisan jauh:** baris selang-seling dengan kemiringan acak, tanpa tulisan, ditelan kabut; sebagian punya lentera kecil atau bunga.

### 7.4 Gerbang

- Gerbang besi tempa dengan lengkung di atas dan **medalion lingkaran berisi huruf R** di puncaknya.
- Dua pilar batu persegi dengan tutup berundak; di atas masing-masing ada lentera menyala.
- Pagar besi dengan ujung tombak memanjang ke kiri dan kanan, menghilang dalam kabut.
- Latar belakang gerbang lebih terang (kabut disinari bulan) sehingga siluet besi terlihat jelas.
- Cahaya hangat lentera jatuh di bagian atas pilar dan membentuk halo.
- Plakat kecil bertuliskan `REGRETBOX` di dasar pilar kiri bersifat opsional.

### 7.5 Kapel

- Kapel batu gothic: atap curam, jendela lengkung runcing dengan tracery, penopang (buttress) di sisi dinding, salib atau finial kecil di puncak atap.
- Jendela dan pintu **menyala amber** (emissive + bloom), cahaya tumpah ke tanah di depannya.
- Dinding batu biru-abu dingin dengan lumut dan sulur; atap basah mengilap oleh bulan.
- Lentera kecil di sekitar kaki kapel.
- Posisi: sisi kanan, di belakang sisi kanan jalan.

### 7.6 Jalan setapak

- Batu cobblestone **basah**: roughness 0.25–0.45, normal map kuat, variasi tinggi antarbatu.
- Pantulan cahaya lentera dan langit: gunakan env map malam (PMREM) ditambah highlight spekuler dari point light. Screen-space reflection atau planar reflection hanya pada kualitas High.
- Lumut tipis di sela batu, tepi jalan tidak lurus sempurna, ada beberapa genangan kecil.
- Jalan melengkung halus menuju gerbang dan menyempit sesuai perspektif.

### 7.7 Vegetasi

- **Pohon gundul foreground** di kiri atas: cabang melengkung masuk ke frame, siluet gelap, tepi disorot rim light bulan.
- **Pohon latar:** siluet gelap (campuran gundul dan cemara) di 2–3 lapis di horizon, makin jauh makin pudar dalam kabut.
- **Rumput:** instanced blade atau kartu rumput, hijau gelap `#17261C` dengan sorot hijau lebih terang pada tepi yang tersinari. Goyangan angin halus lewat vertex shader.
- **Semak dan sulur** di sekitar pagar dan kapel.
- **Bunga:** hydrangea ungu/biru di foreground kiri bawah, daisy putih di dasar nisan, bunga liar kecil. Gunakan instancing dan depth of field untuk foreground.

### 7.8 Lentera

- Lentera besi dengan panel kaca dan lilin di dalamnya.
- Api berkedip halus (noise 6–10 Hz, amplitudo kecil) dengan intensitas 0.9–1.1.
- Glow: sprite additive berbentuk gradien radial (radius sekitar 1.2 m) ditambah bloom.
- **Anggaran cahaya:** point light asli hanya untuk 4–6 lentera terdekat. Lentera lain memakai material emissive, sprite glow, dan decal cahaya di tanah.
- Sebaran: dasar tiap nisan dekat, puncak pilar gerbang, sepanjang pagar, tiap sekitar 6 m di jalan, dan sekitar kapel. **Minimal 12 lentera terlihat** pada posisi awal.

### 7.9 Papan kayu "Add Your Regret"

- Objek 3D: papan kayu berbentuk panah menunjuk ke kiri (ke arah pemakaman), dipasang pada tiang kayu. Kayu PBR dengan serat dan lumut ringan.
- Tulisan **Add Your Regret** diukir dengan font serif, menyala amber lembut (emissive map). Di ujung kanan ada ikon lingkaran dengan tanda **+**.
- Disinari lentera hangat dari bawah sehingga tulisan terbaca jelas.
- **Tidak boleh terpotong atau tertutup objek lain** pada posisi awal kamera. Beri jarak bebas minimal 1 m di depannya, dan pastikan tiang tidak menutupi huruf.
- Hover: emissive naik sekitar 40%, skala 1.03, kursor menjadi pointer. Klik membuka form penguburan.
- Tombol HTML setara (label **Add Your Regret**, dapat difokus keyboard) memicu aksi yang sama dan wajib ada untuk aksesibilitas dan mobile.

### 7.10 Langit, bulan, dan awan

- **Langit:** gradien dari `#0B1026` (zenith) ke `#1B2650` ke `#2A3A66` (dekat horizon), dengan bintang jarang dan halus yang memudar oleh awan dan kabut.
- **Bulan:** purnama dengan tekstur kawah halus, ukuran dan posisi sesuai bagian 7.2. Halo dua lapis (dalam rapat, luar lebar sekitar 4× radius) berwarna `#AFC4FF`, dengan bloom.
- **Awan:** 2–3 lapis gumpalan tipis memanjang (alpha noise) yang bergerak pelan (sekitar 0.2–0.5°/detik), sebagian melintasi tepi bulan, dengan rim perak `#B9C8F0` di tepi yang dekat bulan.
- Arah cahaya bulan pada scene harus **sama dengan posisi bulan di langit** (back-right, di atas).
- **Sumber:** panorama langit opsional `public/textures/sky/night-moon-4k.webp` (4096 × 2048). Jika file belum ada, gunakan sky shader prosedural dengan komposisi yang sama.

### 7.11 Kabut dan atmosfer

- `FogExp2` warna `#141B33`, density awal 0.022 (sesuaikan agar nisan jauh memudar seperti referensi).
- **Kabut permukaan:** 4–6 bidang atau sprite noise besar di ketinggian 0.1–0.9 m, bergeser pelan (sekitar 0.05 m/detik), opasitas 0.12–0.22, bertint `#5A6C9C` di area yang tersinari bulan.
- **Partikel:** 40–80 kunang-kunang atau debu hangat, additive, gerak brownian lambat di dekat lentera.
- Kabut dipakai untuk menyembunyikan batas jarak render. Far plane sekitar 120 m.
- Mode `prefers-reduced-motion`: awan dan kabut diam atau sangat lambat, partikel dimatikan, kedipan api dikurangi.
- Audio ambient (angin, jangkrik) opsional, **mati secara default**, dengan tombol di panel pengaturan.

---

## 8. Pencahayaan, Material, dan Post-processing

### 8.1 Lampu

| Lampu | Jenis | Nilai awal | Fungsi |
|---|---|---|---|
| Bulan | `DirectionalLight` | warna `#9DB4FF`, intensitas sekitar 0.9, dari belakang-kanan di atas | Rim light di tepi nisan, bayangan panjang ke arah kamera |
| Ambient langit | `HemisphereLight` | langit `#3A4A7A`, tanah `#1B2A1E`, intensitas 0.5 | Mengisi bayangan, menjaga muka nisan tidak hitam |
| Lentera (4–6 terdekat) | `PointLight` | warna `#FFB45A`, intensitas 1.2, jarak 5–6 m, decay 2, berkedip | Cahaya hangat di batu, rumput, jalan |
| Jendela kapel | `PointLight` atau emissive + decal | warna `#FFB45A` | Cahaya tumpah di depan kapel |

Bayangan: shadow map 2048 untuk bulan yang mengikuti kamera (frustum sekitar 40 m), PCFSoft atau VSM. Lentera tidak membuat bayangan, kecuali lentera hero (cube 1024). Pencahayaan statis di-bake bila memungkinkan.

### 8.2 Renderer

- `toneMapping = ACESFilmicToneMapping`, `toneMappingExposure` sekitar 1.05–1.15.
- `outputColorSpace = SRGBColorSpace`.
- Pixel ratio dibatasi: maksimal 2 di desktop, 1.5 di mobile.
- Anisotropic filtering 8–16 pada tekstur batu dan jalan.
- Antialiasing lewat SMAA atau FXAA di composer.

### 8.3 Post-processing (paket `postprocessing`)

Urutan efek:

| Urutan | Efek | Nilai awal | Tier |
|---|---|---|---|
| 1 | Ambient occlusion (N8AO atau SSAO) | radius 0.5, intensitas 1.2 | High |
| 2 | Depth of field halus | fokus pada nisan hero, bokeh scale 1.5 | High, Medium |
| 3 | Bloom (selektif luminance) | threshold 0.85, strength 0.6–0.9, radius 0.6 | High, Medium (setengah resolusi) |
| 4 | Vignette | darkness 0.35 | Semua |
| 5 | Film grain | 0.03 | High, Medium |
| 6 | Color grading | bayangan ke indigo, highlight hangat, saturasi 1.05, kontras 1.08 | Semua |
| 7 | Tone mapping ACES | lihat 8.2 | Semua |
| 8 | SMAA | preset medium | Semua |

Tujuan grading: bayangan `#0B1030` ke teal-biru di mid-tone, highlight ke amber hangat. **Jangan membuat scene lebih gelap daripada referensi**: nisan dan tulisannya harus menonjol.

### 8.4 Material

- Semua objek scene memakai material PBR (`MeshStandardMaterial` atau `MeshPhysicalMaterial`).
- `MeshBasicMaterial` hanya untuk sprite glow, partikel, dan bulan.
- Tidak boleh ada permukaan datar satu warna tanpa tekstur pada objek utama (nisan, jalan, gerbang, kapel, papan, pohon).

### 8.5 Tier kualitas

| Fitur | High | Medium | Low (Low Graphics Mode) |
|---|---|---|---|
| Bulan, halo, awan, kabut | Ya | Ya | Ya (lebih sedikit lapis) |
| Bloom | Penuh | Setengah resolusi | Tidak; glow lewat sprite |
| Depth of field, AO | Ya | DOF saja | Tidak |
| Bayangan | Bulan + lentera hero | Bulan saja | Tidak |
| Pantulan jalan | Screen-space/planar | env map + roughness | roughness saja |
| Partikel | 80 | 40 | 15 |
| Pixel ratio maks | 2 | 1.5 | 1 |

Kualitas **Auto** memilih tier awal dari deteksi perangkat dan menurunkannya otomatis jika rata-rata frame time 2 detik melampaui anggaran. Pada tier Low, **bulan, kabut, lentera berpendar, tulisan nisan terbaca, dan batu bertekstur tetap harus ada**.

---

## 9. HUD dan UI Overlay

Semua ukuran di bawah mengacu pada desktop 1920 × 1080.

### 9.1 Aturan layout global

```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #05070f; }
canvas#scene { position: fixed; inset: 0; width: 100vw; height: 100dvh; display: block; }
.hud { position: fixed; inset: 0; pointer-events: none; }
.hud > * { pointer-events: auto; }
```

- **Tidak ada scroll halaman, tidak ada footer di bawah canvas, header tidak mendorong konten.** Header berupa overlay transparan di atas canvas.
- Hormati `env(safe-area-inset-*)` pada perangkat dengan notch.
- Link Terms & Privacy dan Help berada di panel pengaturan (9.7), bukan di footer.

### 9.2 Token UI

| Token | Nilai |
|---|---|
| Glass | `background: rgba(18,20,32,0.55); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.10)` |
| Radius | Pil 999px; kartu 20px |
| Teks utama | `#E9E4D8` |
| Teks redup | `rgba(233,228,216,0.70)` |
| Aksen | Amber `#E8A84B`, teks di atas amber `#1A1206` |
| Font judul dan ukiran | **Cormorant Garamond** (fallback Playfair Display, Georgia, serif) |
| Font UI | **Inter** (fallback system-ui, sans-serif) |
| Bayangan teks judul | `0 2px 16px rgba(0,0,0,0.6)` |

Font di-host sendiri (self-hosted), `font-display: swap`. Fokus keyboard terlihat jelas (outline 2 px amber, offset 2 px).

### 9.3 Kiri atas: logo dan navigasi

- **Logo:** lencana berbentuk batu nisan (atas melengkung), 40 × 48 px, berisi huruf **R** serif, warna batu abu terang. Di sebelahnya wordmark **RegretBox** (Cormorant Garamond 600, 30 px, ivory). Posisi: 32 px dari kiri, 24 px dari atas.
- **Navigasi** (jarak 40 px dari wordmark), Inter 500 16 px, ikon 18 px di kiri teks:
  - **Cemetery** (aktif: garis bawah 2 px ivory dengan offset 6 px),
  - **List View** (ikon daftar),
  - **Search #** (ikon kaca pembesar; membuka overlay pencarian).

### 9.4 Kiri: teks hero

- Posisi: top sekitar 112 px, left 52 px.
- **The Regret Cemetery**: Cormorant Garamond 500, 44 px, ivory.
- Subteks: **A place where your bad decisions finally rest in peace.** Inter 400 17 px, line-height 1.5, warna redup, lebar maksimal 340 px (dua baris).
- Pembatas ornamen di bawahnya: garis 1 px lebar sekitar 220 px, `rgba(233,228,216,0.35)`, dengan belah ketupat kecil di tengah.
- Setelah pengunjung mulai bergerak, opasitas turun ke sekitar 40% dan kembali penuh saat Reset View.

### 9.5 Kanan atas: statistik dan pengaturan

- **Kartu statistik** (glass, radius 20 px, padding 16 × 24 px), dua kolom dengan pembatas vertikal tipis:
  - ikon lencana R + angka **Total Graves** (jumlah makam berstatus `visible`),
  - ikon bulan sabit atau lilin + angka **Buried Today** (makam dibuat hari ini, hitungan server).
  Angka: Inter 600 22 px; label: Inter 400 13 px redup. Format angka `Intl.NumberFormat('en-US')`.
- Di kanan kartu: **tombol pengaturan** berbentuk lingkaran 44 px (ikon gear dengan chevron kecil), menggantikan avatar.
- Angka berasal dari endpoint `GET /api/stats` dan **tidak boleh hardcode**. Angka diperbarui setelah penguburan berhasil (animasi hitung naik 600 ms).

### 9.6 Bawah: chip dan petunjuk

- **Kiri bawah, chip suasana** (glass, non-interaktif, tanpa efek hover): ikon awan, baris 1 **Night** (semibold), baris 2 **Foggy** (redup). Tanpa angka suhu.
- **Tengah bawah, petunjuk gulir:** ikon mouse 28 × 44 px dengan chevron di bawahnya. Pada 6 detik pertama membesar menjadi pil petunjuk: `Drag to look · WASD / Scroll to move · Click a stone to read · Esc to close`. Menghilang setelah gerakan pertama; dapat dilihat lagi dari panel pengaturan (Help). Di mobile: `Drag to look · Use the joystick to move`.
- **Kanan bawah, pil jumlah** (glass): **A total of 12,486 regrets lie here…** dengan angka asli dari `GET /api/stats`, tanpa label "(Demo)".

### 9.7 Dalam dunia 3D

- Papan **Add Your Regret** (bagian 7.9) adalah ajakan utama untuk mengubur penyesalan. Tidak ada tombol "Bury a Regret" tambahan di header.
- Tombol HTML setara untuk aksesibilitas: berada tepat di atas posisi papan di layar (transparan atau dengan gaya pil amber saat difokus keyboard). Di mobile berupa pil amber di tengah bawah.

### 9.8 Panel pengaturan (popover dari tombol gear)

Isi, dengan gaya glass dan tombol minimal 44 px:
- **Reset View**
- **Graphics:** Auto / High / Low
- **Sound:** Off / On (default Off)
- **Controls help** (menampilkan ulang petunjuk)
- **Exit 3D / List View** (beralih ke List View)
- Link **Terms & Privacy**

Kontrol ini **tidak** ditampilkan sebagai deretan pil di atas scene.

### 9.9 Form penguburan dan panel detail

- **Form:** modal glass berwarna gelap di tengah layar (mobile: bottom sheet), judul serif, satu textarea, penghitung `0 / 120`, peringatan publik, checkbox konfirmasi, tombol **Bury It** (amber). Tagline *Write it. Bury it. Let it rest.* kecil di bagian bawah. Latar scene tetap terlihat dengan blur ringan.
- **Panel detail makam:** desktop berupa kartu glass 360 px di sisi kanan; mobile berupa bottom sheet. Isi: `Regret #00291`, kalimat, `Dikuburkan: tanggal`, tombol **Copy link**, dan **Report this gravestone**.

### 9.10 Mobile

- **Bar atas:** lencana R + wordmark di kiri; ikon search dan gear di kanan (tombol minimal 44 × 44 px).
- Teks hero mengecil: judul 26 px; subteks disembunyikan atau dipotong dua baris.
- Statistik menjadi satu pil kecil di bawah bar atas: `12,486 graves`.
- Bawah: joystick virtual di kiri (diameter sekitar 96 px), tombol interaksi di kanan (sekitar 64 px), pil **Add Your Regret +** di tengah bawah di atas keduanya.
- Chip suasana dan pil jumlah kanan-bawah disembunyikan.
- Tidak ada horizontal overflow sampai lebar 320 px.

---

## 10. Strategi Aset

Tampilan referensi **tidak dapat dicapai** dengan `BoxGeometry` atau `CylinderGeometry`. Objek utama harus memakai model dan tekstur nyata.

### 10.1 Urutan sumber

1. **Aset CC0 atau berlisensi bebas komersial**: Poly Haven, ambientCG, Kenney, Quaternius, dan sejenisnya. Catat sumber, lisensi, dan tautan setiap aset di `public/CREDITS.md`.
2. **Aset buatan pengguna** (model atau gambar yang dibuat dengan tool lain) yang diletakkan pada path di tabel 10.2. Jika file ada, **pakai file itu**.
3. **Fallback prosedural**: geometri extrude dengan bevel, displacement noise, dan tekstur canvas. Dipakai hanya bila file belum ada; log peringatan dan sebutkan aset yang belum ada di README. Fallback tetap harus lolos checklist visual sebisa mungkin.

### 10.2 Daftar aset

| Aset | Path | Anggaran |
|---|---|---|
| Nisan (4 varian, 3 LOD) | `public/models/tombstones/{arched,slim,cross,scroll}.glb` | Hero ≥ 8k segitiga, LOD 1.5k dan 150 |
| Gerbang + pilar + pagar | `public/models/environment/gate.glb` | ≤ 25k segitiga |
| Kapel | `public/models/environment/chapel.glb` | ≤ 30k segitiga |
| Lentera | `public/models/environment/lantern.glb` | ≤ 2k segitiga, di-instance |
| Papan kayu | `public/models/environment/sign.glb` | ≤ 6k segitiga |
| Pohon gundul foreground | `public/models/environment/tree_bare_fg.glb` | ≤ 20k segitiga |
| Pohon latar (2 varian) | `public/models/environment/tree_{bare,pine}.glb` | ≤ 3k segitiga, di-instance |
| Bunga (hydrangea, daisy) | `public/models/environment/flowers.glb` | ≤ 1k segitiga per tipe, di-instance |
| Tekstur batu lapuk | `public/textures/stone/` | Albedo, normal, ORM 2048 (KTX2) |
| Tekstur cobblestone basah | `public/textures/path/` | Albedo, normal, ORM 2048 (KTX2) |
| Tekstur rumput, kayu, besi, kulit pohon | `public/textures/*/` | 1024–2048 (KTX2) |
| HDRI malam | `public/textures/env/night-moon.hdr` | 1k–2k, diubah ke PMREM |
| Panorama langit (opsional) | `public/textures/sky/night-moon-4k.webp` | 4096 × 2048 |
| Sprite glow, awan, kabut, partikel | `public/textures/fx/*.webp` | ≤ 512 px |
| Font | `public/fonts/` | WOFF2, self-hosted |

### 10.3 Format dan kompresi

- Model: GLB dengan kompresi Draco atau meshopt.
- Tekstur: KTX2 (Basis Universal) untuk PBR; WebP untuk sprite dan panorama.
- Muat aset kritis dulu (langit, jalan, gerbang, 3 nisan terdekat, papan, lentera), sisanya lazy load setelah tampilan pertama muncul.
- Ukuran unduhan awal: ≤ 12 MB di mobile dan ≤ 25 MB di desktop sampai tampilan pertama bisa dipakai.
- Semua aset di-host sendiri. Jangan hotlink aset dari CDN pihak ketiga saat runtime.
- Progres loading ditampilkan lewat `LoadingManager` pada bar progres tipis di layar loading.

---
## 11. Kontrol Desktop

- `W`, `A`, `S`, `D`: bergerak.
- Mouse: mengubah arah pandang melalui drag.
- Scroll wheel: bergerak maju/mundur, dengan perilaku yang konsisten dan dijelaskan pada petunjuk di layar (9.6).
- Klik batu nisan: memilih dan melihat kalimat.
- Klik papan **Add Your Regret**: membuka form penguburan.
- `Esc`: menutup panel detail, form, atau overlay.
- **Search #** pada navigasi: membuka pencarian nomor makam.
- **Reset View** (panel pengaturan): mengembalikan kamera ke posisi awal (bagian 6, Penempatan makam dan posisi awal kamera).
- **Exit 3D / List View** (panel pengaturan dan navigasi): beralih ke tampilan alternatif.

Jangan mengambil alih shortcut browser saat fokus berada di input pencarian atau kolom teks.

---

## 12. Kontrol Mobile

Mobile harus menjadi pengalaman yang dirancang khusus, bukan sekadar desktop yang diperkecil (tata letak HUD mobile ada di 9.10).

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

## 13. Pencarian Makam

Pencarian utama menggunakan nomor makam.

Contoh input:
- `00291`
- `#00291`

Alur:
1. Pengunjung membuka **Search #**.
2. Pengunjung memasukkan nomor makam.
3. Frontend mengirim permintaan ke backend.
4. Backend mencari nomor yang cocok.
5. Jika ditemukan, kamera bergerak menuju koordinat makam.
6. Batu nisan disorot dan satu kalimat ditampilkan.
7. Jika tidak ditemukan, tampilkan `Grave not found`.

Semua makam pada sistem ini bersifat publik, sehingga tidak diperlukan aturan visibilitas privat.

Pencarian berdasarkan isi kalimat tidak wajib untuk MVP. Prioritaskan pencarian nomor agar implementasi sederhana dan tidak membuka risiko pencarian teks yang disalahgunakan.

---

## 14. Teknologi yang Direkomendasikan

### Frontend
- **Vite** — build tool.
- **TypeScript** — logika aplikasi yang lebih terstruktur.
- **Three.js** — dunia pemakaman 3D (`GLTFLoader` dengan `DRACOLoader`, `MeshoptDecoder`, dan `KTX2Loader`).
- **postprocessing** (pmndrs) — bloom, depth of field, vignette, noise, grading, SMAA.
- **GSAP** — transisi kamera dan animasi pemakaman.
- **HTML/CSS** — HUD dan UI responsif.
- Router sederhana berbasis History API (tanpa framework tambahan).

### Backend dan database
- **Supabase Postgres** — menyimpan kalimat publik, nomor makam, dan koordinat 3D.
- **Supabase Edge Functions** atau **Vercel Functions** — validasi dan operasi server.

Tidak perlu Supabase Auth karena tidak ada akun atau login.

### Hosting dan source control
- **GitHub** — repository source code.
- **Vercel** — hosting frontend dan server functions bila diperlukan.
- **Supabase** — database.

### Prinsip arsitektur
- Model 3D, tekstur, audio, dan aset statis disimpan di folder `public/` atau object storage/CDN milik sendiri.
- Database hanya menyimpan data teks pendek, nomor makam, waktu pembuatan, dan koordinat.
- Jangan menyimpan file model 3D di database.
- Secret API hanya berada di environment variable server.
- Jangan menaruh service role key di frontend.
- Karena tidak ada login, endpoint submit dan search harus memiliki rate limit dan validasi server.

---

## 15. Arsitektur Sistem

```text
Pengunjung Desktop / Mobile
          |
          v
     VERCEL HOSTING
          |
          +---- HUD / UI responsif (overlay di atas canvas)
          |
          +---- Three.js Cemetery (layar pertama, tanpa landing page)
          |        +---- Camera & Controls
          |        +---- Grave Models + Inscription Textures (LOD, cache)
          |        +---- Environment (sky, moon, fog, gate, chapel, path)
          |        +---- Lighting + Post-processing + Quality Governor
          |        +---- Search Navigation
          |        +---- Burial Animation
          |
          +---- API / Server Functions
                   |
                   +---- Validasi kalimat
                   +---- Rate limiting
                   +---- Alokasi nomor makam
                   +---- Penentuan slot, koordinat, dan grave_style
                   +---- Statistik (total dan buried today)
                   |
                   v
              SUPABASE DB
                   |
                   +---- Graves
```

Tidak ada modul autentikasi, email, notifikasi, atau scheduler.

---

## 16. Rancangan Database

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
| `grave_style` | text | `arched`, `slim`, `cross`, atau `scroll` (dipilih backend dengan bobot di 7.3) |
| `created_at` | timestamptz | Waktu makam dibuat; juga sumber tanggal `Dikuburkan:` |
| `moderation_status` | text | `visible`, `flagged`, atau `hidden` |

Ketentuan database:
- `grave_number` memiliki unique constraint.
- `inscription` wajib dan maksimal 120 karakter.
- Nomor makam dibuat oleh database/backend secara atomik.
- Koordinat harus berada di area pemakaman yang valid.
- Tidak ada `user_id`, email, profil, atau relasi akun.
- Tidak ada tabel reminder, reflection, atau user profile.

### Endpoint statistik

`GET /api/stats` mengembalikan `{ total, buried_today }`. Hanya makam berstatus `visible` yang dihitung; `buried_today` memakai tanggal UTC server. Tidak ada pelacakan pengunjung.

### Seed data demonstrasi

- Minimal **40 makam** bernomor `#00252` sampai `#00291` agar scene awal terlihat penuh. Sequence nomor diset ke `max + 1` setelah seed.
- Campuran kalimat Indonesia dan Inggris, semuanya fiktif dan tidak mengandung data pribadi.
- Tiga makam terbaru harus sesuai referensi:

| Nomor | Kalimat | Tanggal |
|---|---|---|
| `#00291` | Seharusnya aku tidak membeli itu. | 25 Nov 2026 |
| `#00290` | Terlalu percaya sama dia... | 20 Nov 2026 |
| `#00289` | Mungkin aku bisa lebih sabar. | 18 Nov 2026 |

- Angka di UI selalu berasal dari database; dengan seed ini nilainya `40`, bukan `12,486`.

### Keamanan akses database

- Jangan memberikan akses anon langsung untuk insert bebas ke tabel tanpa validasi.
- Pengunjung membaca data publik melalui endpoint yang hanya mengembalikan kolom yang diperlukan.
- Pembuatan makam dilakukan melalui server function yang memvalidasi teks, menerapkan rate limit, dan mengalokasikan nomor serta slot.
- Jangan pernah mengekspos service role key.

---

## 17. Moderasi dan Perlindungan Penyalahgunaan

Karena semua kalimat bersifat publik dan tidak ada akun, sistem perlu perlindungan penyalahgunaan.

MVP minimal:
- Batas 120 karakter.
- Rate limit berdasarkan IP atau mekanisme abuse prevention yang sesuai.
- Validasi dan sanitasi input di server.
- Escape teks saat dirender (termasuk saat dirender ke canvas tekstur nisan).
- Proteksi spam sederhana, misalnya honeypot dan/atau challenge anti-bot jika dibutuhkan.
- Tombol **Report this gravestone**.
- Status moderasi `visible`, `flagged`, dan `hidden`.
- Prosedur admin untuk menyembunyikan konten yang melanggar aturan.

Jangan mengumpulkan atau menyimpan alamat IP lebih lama dari yang diperlukan untuk keamanan. Jika IP dipakai untuk rate limiting, jelaskan praktik tersebut dalam kebijakan privasi dan tetapkan retensi minimum.

Tampilkan pemberitahuan bahwa catatan bersifat publik, dapat dibaca siapa saja, dan tidak dapat diedit setelah dikirim. Pengguna harus menghindari informasi pribadi.

---

## 18. Desain UI/UX Umum

Tata letak HUD, token UI, dan gaya setiap elemen ada di **bagian 9**. Bagian ini melengkapi aturan umum.

### Arah visual
- Mengikuti bagian 0, 7, dan 8. Dark cinematic, atmosferik, tenang, sedikit gothic. Hindari efek horor berlebihan.
- Font judul serif elegan, font UI sans-serif yang mudah dibaca.

### Form penguburan
- Satu textarea/input saja.
- Penghitung karakter `0 / 120`.
- Peringatan bahwa kalimat akan menjadi publik dan tidak dapat ditarik kembali.
- Checkbox konfirmasi publikasi.
- Tombol **Bury It**.

### Tampilan makam
- Nomor makam, satu kalimat, dan tanggal.
- Ornamen sederhana.
- Tidak ada nama pemilik, avatar, profil, atau informasi akun.

### Aksesibilitas
- Kontras teks memadai.
- Fokus keyboard terlihat.
- Semua tombol memiliki label (termasuk tombol HTML setara untuk papan **Add Your Regret**).
- Canvas diberi `role="img"` dengan `aria-label` yang menjelaskan scene; seluruh isi makam tetap dapat diakses lewat List View.
- Hormati `prefers-reduced-motion`: intro dolly diganti cut singkat, transisi kamera dipercepat atau dihilangkan, awan/kabut/partikel diam, kedipan api dikurangi.
- Sediakan List View 2D.
- Jangan mengandalkan warna atau hover saja untuk menyampaikan informasi.

---

## 19. Performa 3D

Pemakaman dapat berisi ribuan batu nisan. Optimasi harus dirancang sejak awal, **tanpa mengorbankan kualitas visual pada tier High dan Medium**.

Gunakan:
- `THREE.InstancedMesh` untuk model batu nisan, lentera, bunga, rumput, dan pohon latar.
- Level of Detail (LOD) untuk objek jauh.
- Frustum culling.
- Texture atlas dan material bersama.
- Baked lighting untuk lingkungan statis.
- Jumlah dynamic lights dan shadow terbatas (bagian 8.1).
- Lazy loading model dan tekstur.
- Pembagian pemakaman menjadi area/chunk.
- Query makam berdasarkan area yang sedang dilihat.
- Raycasting hanya pada objek yang relevan.
- Cache LRU untuk tekstur tulisan nisan (bagian 7.3).

### Anggaran

| Metrik | Desktop | Mobile |
|---|---|---|
| Draw call per frame | ≤ 250 | ≤ 150 |
| Segitiga di layar | ≤ 1.5 juta | ≤ 600 ribu |
| Memori tekstur | ≤ 512 MB | ≤ 256 MB |
| Frame rate | 60 FPS di perangkat menengah (High/Medium) | ≥ 30 FPS di perangkat menengah (Medium/Low) |

- Quality governor mengukur rata-rata frame time 2 detik dan menurunkan tier otomatis bila melebihi anggaran.
- Deteksi WebGL; jika tidak tersedia, tampilkan List View 2D.
- Jangan memuat semua detail ribuan makam sekaligus.

### Penempatan makam

- Backend memilih slot/koordinat yang belum terpakai, mengikuti aturan di bagian 6.
- Jangan menempatkan makam secara acak dari browser tanpa validasi.
- Gunakan grid atau sistem slot agar makam tidak saling bertumpuk.
- Area pemakaman diperluas per chunk ketika slot hampir penuh.

---

## 20. Struktur Folder Proyek

```text
regretbox/
├── docs/
│   ├── reference/
│   │   └── cemetery-reference.png
│   └── qa/                       # screenshot hasil Visual QA
├── public/
│   ├── models/
│   │   ├── tombstones/
│   │   └── environment/
│   ├── textures/
│   │   ├── stone/
│   │   ├── path/
│   │   ├── env/
│   │   ├── sky/
│   │   └── fx/
│   ├── fonts/
│   ├── audio/
│   ├── icons/
│   └── CREDITS.md
├── src/
│   ├── app/
│   │   ├── main.ts
│   │   ├── router.ts
│   │   └── config.ts
│   ├── hud/
│   │   ├── Header/
│   │   ├── HeroText/
│   │   ├── StatsCard/
│   │   ├── StatusChips/
│   │   ├── SettingsPopover/
│   │   └── LoadingScreen/
│   ├── components/
│   │   ├── Search/
│   │   ├── GraveDetails/
│   │   ├── BurialForm/
│   │   ├── BottomSheet/
│   │   └── Modal/
│   ├── pages/
│   │   ├── Cemetery/             # layar pertama untuk "/"
│   │   ├── ListView/
│   │   ├── Terms/
│   │   └── NotFound/
│   ├── three/
│   │   ├── CemeteryScene.ts
│   │   ├── Sky.ts
│   │   ├── Atmosphere.ts
│   │   ├── Lighting.ts
│   │   ├── PostFX.ts
│   │   ├── Environment.ts
│   │   ├── Tombstone.ts
│   │   ├── InscriptionTexture.ts
│   │   ├── Lanterns.ts
│   │   ├── SignBoard.ts
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
├── vercel.json                   # rewrite semua route ke index.html
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 21. Environment Variables

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

## 22. Halaman dan Routing

| Route | Isi |
|---|---|
| `/` | **Cemetery 3D**, layar pertama. Langsung menampilkan pemakaman, tanpa landing page |
| `/cemetery` | Alias yang menampilkan Cemetery 3D yang sama (tanpa redirect yang terlihat) |
| `/grave/:number` | Cemetery 3D dengan kamera terfokus pada makam dan panel detail terbuka (permalink) |
| `/list` | **List View**, alternatif 2D untuk perangkat yang tidak mendukung 3D |
| `/terms` | **Terms & Privacy**: ketentuan publikasi, moderasi, dan privasi |
| `*` | **NotFound** |

Komponen yang muncul sebagai overlay di atas Cemetery (bukan halaman terpisah):
1. **Bury Form** — satu kolom kalimat maksimal 120 karakter.
2. **Grave Detail** — nomor makam, satu kalimat publik, tanggal.
3. **Search** — mencari nomor makam.
4. **Report Content** — melaporkan batu nisan.

**Tidak ada** halaman Home/landing, login, registrasi, profil, dashboard pribadi, "My Regrets", pengaturan akun, atau halaman reminder.

`vercel.json` harus me-rewrite semua route ke `index.html` agar deep link `/grave/00291` dan `/list` berfungsi setelah deploy.

---

## 23. Kriteria Penerimaan (Acceptance Criteria)

### Entry dan layout
- [ ] Membuka `/` langsung menampilkan pemakaman 3D; **tidak ada landing page** dan tidak ada tombol yang harus ditekan sebelum scene terlihat.
- [ ] `/cemetery` menampilkan scene yang sama.
- [ ] Tidak ada scroll halaman, header tidak terpotong, tidak ada footer di bawah canvas (diuji di 1920 × 1080, 1366 × 768, dan 390 × 844).
- [ ] Layar loading hilang otomatis; intro kamera dapat dilewati dengan input apa pun.

### Visual (dibandingkan dengan `docs/reference/cemetery-reference.png`)
- [ ] Bulan purnama dengan halo dan awan terlihat di kanan atas.
- [ ] Cabang pohon gundul menjorok dari kiri atas.
- [ ] Gerbang besi dengan medalion **R**, dua pilar berlentera, dan pagar terlihat di kejauhan.
- [ ] Kapel gothic dengan jendela amber menyala terlihat di kanan.
- [ ] Jalan batu basah dengan pantulan cahaya lentera.
- [ ] Tiga nisan dekat (hero, kiri, kanan) terlihat dengan ukuran relatif sesuai 7.2 dan bermaterial batu berlumut (bukan kotak polos).
- [ ] Tulisan nisan hero (`R.I.P.`, `Regret #nomor`, kalimat, `Dikuburkan: tanggal`) **terbaca penuh tanpa zoom** di 1920 × 1080 dan di 390 × 844.
- [ ] Lentera menyala dengan glow dan kedipan halus di dasar nisan; minimal 12 lentera terlihat.
- [ ] Hydrangea di kiri bawah dan daisy di dasar nisan hero terlihat.
- [ ] Kabut tipis di permukaan tanah dan siluet nisan jauh yang memudar.
- [ ] Papan **Add Your Regret** terbaca penuh, tidak terpotong atau tertutup tiang, dan dapat diklik.
- [ ] HUD sesuai bagian 9: logo, navigasi (Cemetery, List View, Search #), teks hero, kartu statistik, tombol gear, chip Night/Foggy, petunjuk gulir, pil jumlah.
- [ ] Tidak ada elemen HUD yang menutupi hero stone atau papan.
- [ ] Rata-rata kecerahan scene tidak lebih gelap dari referensi secara kasatmata; muka nisan hero tidak hitam.
- [ ] Tier Low tetap menampilkan bulan, kabut, lentera berpendar, tulisan terbaca, dan batu bertekstur.

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
- [ ] Makam terbaru menjadi fokus posisi awal kamera; Reset View kembali ke sana.
- [ ] Kalimat dapat dibaca semua pengunjung.
- [ ] Pencarian nomor menemukan makam yang sesuai.
- [ ] Angka **Total Graves** dan **Buried Today** berasal dari `GET /api/stats` dan berubah setelah penguburan.

### 3D dan perangkat
- [ ] Pemakaman dapat dijelajahi di desktop.
- [ ] Kontrol mouse dan keyboard berfungsi.
- [ ] Pemakaman dapat dijelajahi di mobile.
- [ ] Kontrol sentuh dan joystick berfungsi.
- [ ] Tap/click batu nisan menampilkan kalimat.
- [ ] Search mengarahkan kamera ke makam yang ditemukan.
- [ ] Ada List View 2D jika WebGL tidak tersedia.
- [ ] Tidak ada horizontal overflow pada layar 320 px.
- [ ] Performa sesuai anggaran di bagian 19.

### Larangan fitur
- [ ] Tidak ada landing page.
- [ ] Tidak ada login atau registrasi.
- [ ] Tidak ada akun, profil, avatar, atau "My Regrets".
- [ ] Tidak ada email atau reminder.
- [ ] Tidak ada scheduler pengingat.
- [ ] Tidak ada isi panjang atau kolom deskripsi.
- [ ] Tidak ada resurrection atau fitur membuka kembali catatan secara privat.
- [ ] Tidak ada tombol, chip, atau angka palsu.

### Keamanan
- [ ] Validasi dilakukan di server.
- [ ] Output teks di-escape.
- [ ] Rate limiting aktif.
- [ ] Secret tidak muncul di frontend.
- [ ] Mekanisme report/moderasi tersedia.

---

## 24. Tahapan Pengembangan

### Phase 1 — Fondasi web
- Setup Vite dan TypeScript.
- Setup Supabase database.
- Router yang langsung menampilkan Cemetery di `/` (tanpa landing page) dan layout full-screen.
- Layar loading dan shell HUD.
- Buat API submit, search, dan stats.
- Buat schema `graves`, nomor unik, dan seed data (bagian 16).

**Hasil:** pengunjung dapat mengirim satu kalimat tanpa akun dan data tersimpan.

### Phase 2 — Hero scene (vertical slice visual)
- Langit, bulan, awan, kabut, pencahayaan, dan post-processing.
- Gerbang, kapel, jalan batu basah, pohon, rumput, bunga.
- Tiga nisan dekat dengan tulisan terukir, lentera, dan papan **Add Your Regret**.
- HUD lengkap sesuai bagian 9.
- Jalankan Visual QA (bagian 26) sampai semua item "Visual" di bagian 23 lolos.

**Hasil:** layar pertama sudah mirip referensi. **Jangan lanjut ke Phase 3 sebelum Phase 2 disetujui secara visual.**

### Phase 3 — Dunia penuh dan data
- Ambil data makam dari database dan tampilkan nomor, kalimat, dan tanggal pada nisan.
- Alokasi slot dan posisi awal kamera relatif terhadap makam terbaru.
- InstancedMesh, LOD, chunk loading, dan cache tekstur tulisan.

**Hasil:** data publik tampil di dunia 3D dengan kualitas yang sama dengan hero scene.

### Phase 4 — Navigasi desktop dan mobile
- Kontrol keyboard dan mouse.
- Joystick dan gesture mobile.
- Panel detail makam.
- Search dan navigasi kamera.
- List View 2D.

**Hasil:** pemakaman dapat dijelajahi di desktop dan ponsel.

### Phase 5 — Upacara pemakaman
- Form satu kalimat dan penghitung karakter.
- Konfirmasi publikasi.
- Submit ke backend.
- Animasi kamera menuju slot baru.
- Animasi batu nisan muncul: naik dari tanah dengan debu, lentera menyala, bloom berdenyut singkat, tulisan terukir muncul.

**Hasil:** setelah submit berhasil, makam langsung dibuat dan ditampilkan.

### Phase 6 — Moderasi dan optimasi
- Rate limiting dan anti-spam.
- Report content.
- Admin moderation sederhana.
- Quality governor, tier kualitas, dan uji performa mobile.
- Uji aksesibilitas dan keamanan.

**Hasil:** aplikasi siap untuk peluncuran terbatas.

---

## 25. Hosting dan Biaya

| Layanan | Fungsi | Catatan |
|---|---|---|
| Vercel | Hosting frontend dan API | Paket Hobby memiliki batas penggunaan dan ketentuan nonkomersial |
| Supabase | Database PostgreSQL | Paket gratis memiliki kuota dan batas tertentu |
| GitHub | Source code | Untuk version control |

Catatan:
- MVP dapat dimulai dengan layanan gratis selama penggunaan masih sesuai batas dan ketentuan masing-masing penyedia.
- Vercel Hobby ditujukan untuk penggunaan personal/nonkomersial. Periksa paket yang sesuai jika aplikasi dimonetisasi.
- Aset 3D dan tekstur memakan bandwidth; periksa kuota bandwidth Vercel setelah aset ditambahkan.
- Periksa kuota database, bandwidth, function execution, dan kebijakan pause sebelum peluncuran.
- Siapkan backup database jika mulai menyimpan catatan publik pengguna.

Referensi harga resmi:
- Vercel: https://vercel.com/pricing
- Supabase: https://supabase.com/pricing

---

## 26. Instruksi untuk AI Coding Agent

Bangun RegretBox berdasarkan spesifikasi ini. Jangan menambahkan fitur yang secara eksplisit dilarang.

### Aturan implementasi

1. Baca seluruh dokumen **dan lihat `docs/reference/cemetery-reference.png`** sebelum mulai coding.
2. Gunakan Vite + TypeScript + Three.js + `postprocessing`.
3. **Tidak boleh ada landing page.** Route `/` langsung menampilkan Cemetery 3D.
4. Layout harus full-screen tanpa scroll halaman (bagian 9.1).
5. Pastikan desain mobile dan desktop sama-sama menjadi prioritas.
6. Tidak boleh ada login, registrasi, akun, profil, avatar, atau autentikasi.
7. Tidak boleh ada email, reminder, scheduler, atau notifikasi.
8. Form hanya memiliki satu kolom kalimat, maksimal 120 karakter.
9. Tidak boleh ada judul terpisah, deskripsi, atau isi panjang.
10. Setelah submit berhasil, catatan langsung menjadi makam publik.
11. Pengirim tidak dapat mengedit, menghapus, atau membuka catatan melalui halaman privat.
12. Semua pengunjung dapat membaca kalimat pada batu nisan.
13. Nomor makam dibuat secara atomik oleh backend/database.
14. Gunakan rate limiting dan validasi server karena endpoint tidak memakai login.
15. Jangan mengekspos service role key di frontend.
16. Gunakan InstancedMesh/LOD/chunk loading untuk menjaga performa 3D.
17. Sediakan kontrol desktop, kontrol mobile, dan List View 2D.
18. Jangan membuat tombol, chip, atau angka palsu. Statistik harus berasal dari database.
19. Jangan memakai primitif (`BoxGeometry`, `CylinderGeometry`, bidang datar) untuk objek utama scene (nisan, gerbang, kapel, lentera, papan, pohon, jalan). Ikuti strategi aset di bagian 10.
20. Pertahankan elemen referensi; jangan menyederhanakannya (bagian 0).
21. Sertakan `.env.example`, migration database, seed data demonstrasi, README, `public/CREDITS.md`, `vercel.json`, dan panduan deployment.
22. Jalankan build dan perbaiki error setelah setiap fase.
23. Jika layanan eksternal memerlukan kredensial, dokumentasikan konfigurasi; jangan mengganti integrasi nyata dengan simulasi tanpa penjelasan.

### Proses Visual QA (wajib setiap kali scene berubah)

1. Jalankan dev server, buka `/` dengan Playwright (Chromium headless; bila tanpa GPU, gunakan flag software GL seperti `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`).
2. Ambil screenshot pada **1920 × 1080** dan **390 × 844**, setelah intro selesai dan aset termuat. Simpan di `docs/qa/` dengan nama bertanggal.
3. Bandingkan dengan `docs/reference/cemetery-reference.png`. Periksa **satu per satu** item bagian "Visual" di bagian 23, dan nilai: komposisi (7.2), keterbacaan tulisan nisan, cahaya dan glow, kabut, serta HUD.
4. Perbaiki selisih terbesar terlebih dahulu (biasanya: model dan material, cahaya, bloom, komposisi kamera, keterbacaan teks), lalu ulangi dari langkah 1.
5. Periksa juga console: tidak ada error atau warning tekstur/shader.
6. **Laporkan hasil jujur.** Sebutkan item yang belum lolos dan aset yang belum tersedia (sehingga memakai fallback prosedural). Jangan menyatakan selesai bila ada item visual yang gagal.

### Urutan deliverable

1. Project scaffold, router langsung ke Cemetery, layout full-screen, dan HUD shell.
2. Database, API submit/search/stats, nomor makam unik, dan seed.
3. **Hero scene** yang lolos Visual QA.
4. Dunia pemakaman penuh, data nyata, dan model nisan lengkap.
5. Kontrol desktop dan mobile.
6. Form satu kalimat dan animasi pemakaman otomatis.
7. Moderasi, optimasi, pengujian, dan deployment.

### Definisi selesai

Aplikasi dapat dijalankan lokal dan di-deploy ke Vercel. Membuka web langsung menampilkan pemakaman 3D yang secara visual sesuai `docs/reference/cemetery-reference.png`: bulan dan awan, gerbang, kapel, jalan batu basah, nisan berlumut dengan tulisan terbaca, lentera berpendar, kabut, dan papan **Add Your Regret**. Pengunjung dapat mengirim satu kalimat maksimal 120 karakter tanpa login. Catatan langsung dibuat menjadi makam publik bernomor unik, dapat dibaca semua orang, dan dapat ditemukan melalui pencarian. Pemakaman 3D dapat dijelajahi dengan nyaman di desktop maupun mobile. Tidak ada landing page, akun, login, email, reminder, dashboard pribadi, atau fitur membuka kembali catatan yang telah dikuburkan.
