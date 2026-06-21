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
4. **Salin** key yang muncul (diawali `AIza...`).
5. Tempel ke aplikasi pada layar setup.

Free tier Gemini Flash sudah cukup untuk pemakaian harian (sekitar **1.500 permintaan/hari**). Kuota dihitung per akun Google-mu sendiri.

---

## Penting: Pasang "Referrer Restriction" agar Key Aman

Sejak **19 Juni 2026**, Google **menolak API key yang tidak dibatasi**. Jadi langkah ini **wajib**, sekaligus membuat key-mu aman walau aplikasinya statis:

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

## Struktur

```
belanja-online/
├── index.html   UI utama + layar setup API key
├── style.css    Tampilan minimalis (palet "Ungu Lembut")
├── app.js       Kamera, panggil Gemini, keranjang, ringkasan
└── README.md    Dokumen ini
```

Model AI diatur lewat konstanta `MODEL` di bagian atas `app.js`.

---

## Catatan

- **Open source, gratis, tanpa backend.** Tidak ada data yang dikirim ke server pihak ketiga selain Google Gemini (untuk membaca gambar label).
- Karena BYOK, **kamu memegang kendali penuh** atas kunci & kuotamu sendiri.
- Foto label dikirim ke Google untuk diproses; pada free tier, data dapat dipakai Google untuk peningkatan layanan. Hindari memotret informasi pribadi.
