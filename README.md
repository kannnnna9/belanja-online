# BelanjaCatat Online

Aplikasi web untuk **mencatat belanja dengan kamera**. Foto label harga di rak, dan AI (Google Gemini) membaca **nama barang & harga** secara otomatis, lalu menambahkannya ke keranjang.

- 🆓 **Gratis & open source** — tanpa server, tanpa biaya hosting.
- 📷 **Satu jepret = satu label** — arahkan kamera ke label harga di rak.
- 🔑 **Bawa kunci sendiri (BYOK)** — kamu pakai API key Gemini gratismu sendiri; key tersimpan **hanya di browsermu**, tidak dikirim ke siapa pun selain Google.
- 🌐 **Statis murni** — cukup di-deploy ke GitHub Pages.

---

## Cara Pakai Aplikasi

1. Buka aplikasi di browser HP (lewat HTTPS — wajib untuk akses kamera).
2. Saat pertama dibuka, tempel **API key Gemini** (lihat panduan di bawah), lalu tekan **Simpan & Mulai**.
3. Izinkan akses kamera. Arahkan ke **label harga** di rak, pastikan teks masuk dalam bingkai.
4. Tekan tombol **rana** (lingkaran ungu). Tunggu AI membaca label.
5. Periksa hasilnya — **nama & harga bisa kamu edit** bila keliru — lalu **Tambah ke Keranjang**.
6. Buka **🛒 keranjang** kapan saja untuk melihat daftar & total belanja.
7. Tekan **Selesai** untuk melihat **ringkasan** (jumlah item + total).
8. **Belanja Baru** mengosongkan keranjang untuk sesi berikutnya.

> Data belanja **tidak disimpan permanen** — hanya bertahan selama sesi. Tutup tab = keranjang kosong lagi. (API key tetap tersimpan agar tak perlu ditempel ulang.)

---

## Panduan: Dapat API Key Gemini Gratis

1. Buka **<https://aistudio.google.com>** dan login dengan akun Google.
2. Klik **“Get API Key”** (kiri atas / menu).
3. Klik **“Create API key”** → pilih project (atau buat baru).
4. **Salin** key yang muncul. Bisa berformat lama `AIza...` atau format baru **`AQ.`** (key baru ini sudah ter-restrict otomatis — lihat catatan di bawah).
5. Tempel ke aplikasi pada layar setup.

Free tier Gemini Flash sudah cukup untuk pemakaian harian (sekitar **1.500 permintaan/hari**). Kuota dihitung per akun Google-mu sendiri.

> **Catatan jujur soal "gratis":** mayoritas akun Google gratis bisa langsung dipakai. Tapi sebagian kecil akun bisa kena **blokir otomatis Google** (`project has been denied access`) — ini false-positive sisi Google, bukan masalah aplikasi. Kalau kamu kena, lihat bagian **[Jika Scan Gagal](#jika-scan-gagal)**.

---

## Penting: Pasang "Referrer Restriction" agar Key Aman

Sejak **19 Juni 2026**, Google **menolak API key yang tidak dibatasi**.

- **Punya key format baru `AQ.`?** Key ini **sudah ter-restrict otomatis** ke Generative Language API — kamu **tidak perlu** mengatur apa pun secara manual. Lewati bagian ini.
- **Punya key format lama `AIza...`?** Wajib pasang restriction manual berikut, sekaligus membuat key-mu aman walau aplikasinya statis:

1. Buka **<https://console.cloud.google.com/apis/credentials>** (project yang sama dengan key-mu).
2. Klik nama API key-mu.
3. Di **Application restrictions**, pilih **HTTP referrers (web sites)**.
4. Tambahkan domain GitHub Pages-mu, misalnya:
   ```
   https://NAMA-AKUN.github.io/*
   https://NAMA-AKUN.github.io/belanja-online/*
   ```
5. Di **API restrictions**, batasi ke **Generative Language API** saja.
6. **Save.** Tunggu beberapa menit hingga aktif.

Dengan ini, key yang bocor pun **tak bisa dipakai dari domain lain**.

---

## Deploy ke GitHub Pages

1. Buat repository baru, unggah isi folder `belanja-online/` (`index.html`, `style.css`, `app.js`, `README.md`).
2. Di **Settings → Pages**, pilih branch (mis. `main`) dan folder root.
3. Tunggu hingga muncul URL `https://NAMA-AKUN.github.io/NAMA-REPO/`.
4. Buka URL itu di HP. Jangan lupa pasang **referrer restriction** sesuai URL tersebut.

---

## Jika Scan Gagal

Kalau hasil scan gagal, aplikasi menampilkan **pesan error asli dari Google** di dalam panel hasil (teks merah). Pakai itu untuk mengenali masalahnya:

- **"You exceeded your current quota" / "limit: 0"** — model AI sedang tak punya jatah free tier (mis. model lama yang sudah dihentikan Google). Aplikasi ini sudah memakai alias `gemini-flash-latest` yang selalu menunjuk model Flash terbaru, jadi seharusnya jarang terjadi. Bila tetap muncul, tunggu reset kuota harian (tengah malam waktu Pasifik / ±14.00 WIB).
- **"Your project has been denied access"** — blokir otomatis Google pada sebagian akun free (false-positive, kadang berdasarkan region). Aplikasi & key-mu sebenarnya benar. Solusi, urut dari paling mudah:
  1. Coba **API key dari akun Google lain**.
  2. **Aktifkan billing** di project Cloud-mu (tetap gratis selama di bawah limit free tier — proyek ber-billing dianggap lebih tepercaya & lolos blokir).
  3. Minta peninjauan di forum **<https://discuss.ai.google.dev>** (lambat).
- **"API key not valid"** — key salah atau ada spasi nyangkut. Tempel ulang lewat **⚙ → Ganti API Key**.
- **Kamera tidak muncul** — pastikan halaman dibuka via **HTTPS** dan izin kamera sudah diberikan.

---

## Struktur

```
belanja-online/
├── index.html   UI utama + layar setup API key
├── style.css    Tampilan minimalis (palet "Ungu Lembut")
├── app.js       Kamera, panggil Gemini, keranjang, ringkasan
└── README.md    Dokumen ini
```

Model AI diatur lewat konstanta `MODEL` di bagian atas `app.js`. Nilai default-nya **`gemini-flash-latest`** — alias yang selalu menunjuk model Flash terbaru, agar **tidak ikut mati** saat Google menghentikan versi tertentu (mis. `gemini-2.0-flash` dihentikan 1 Juni 2026). Mau dipatok ke versi tetap? Ganti ke `gemini-2.5-flash-lite`.

---

## Catatan

- **Open source, gratis, tanpa backend.** Tidak ada data yang dikirim ke server pihak ketiga selain Google Gemini (untuk membaca gambar label).
- Karena BYOK, **kamu memegang kendali penuh** atas kunci & kuotamu sendiri.
- Foto label dikirim ke Google untuk diproses; pada free tier, data dapat dipakai Google untuk peningkatan layanan. Hindari memotret informasi pribadi.
