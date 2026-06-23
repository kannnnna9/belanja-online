# Keranjang Pintar

Catat belanja pakai kamera. Foto label harga di rak, AI-nya (Google Gemini) baca nama barang sama harganya, langsung masuk keranjang. Tinggal jepret, nggak usah ngetik satu-satu.

Dibuat buat belanja di supermarket dan minimarket — di mana barang ditata di rak dengan label harga.

Appnya jalan di browser, gratis, tanpa server. Kamu pakai API key Gemini punyamu sendiri, dan key itu cuma disimpan di browsermu.

## Buat kamu yang cuma mau nyatet belanja

Nggak usah bikin repo atau install apa-apa. Tinggal buka ini di HP:

**https://kannnnna9.github.io/keranjang-pintar/**

Pertama kali buka, dia minta API key Gemini (cara dapetnya di bawah, gratis). Tempel sekali, habis itu kepakai terus di HP itu.

Alurnya:

1. Buka linknya lewat HP. Harus HTTPS biar kamera bisa nyala, dan link itu udah HTTPS.
2. Tempel API key, pencet Simpan & Mulai.
3. Kamu masuk ke halaman keranjang. Ini halaman utamanya, sekaligus tempat liat daftar belanja sama totalnya. Awalnya masih kosong.
4. Pencet "Tambah Item" buat buka kamera (kasih izin kamera kalau diminta). Arahkan ke label harga, pastiin tulisannya masuk bingkai, terus pencet tombol rana. Tunggu sebentar AI-nya baca.
5. Cek hasilnya. Kalau nama atau harganya meleset, betulin langsung di situ baru Tambah ke Keranjang. Habis itu balik sendiri ke keranjang, item sama totalnya udah keupdate.
6. Ulangi buat barang lain. Atau pakai "Input Manual" kalau mau ketik sendiri tanpa kamera.
7. Kalau udah kelar, pencet Selesai buat liat ringkasan (jumlah item + total belanja).

Keranjang nggak disimpan permanen, cuma bertahan selama tab kebuka. Tutup tab, keranjang kosong lagi. API key-nya tetap kesimpen jadi nggak perlu tempel ulang.

## Ambil API key Gemini (gratis)

1. Buka https://aistudio.google.com, login Google.
2. Klik "Get API Key".
3. Klik "Create API key", pilih project atau bikin baru.
4. Salin key-nya. Key baru bentuknya diawali `AQ.`.
5. Tempel ke app.

Jatah gratisnya cukup buat belanja harian.

Key `AQ.` udah otomatis aman: dia kebatasi ke Generative Language API sejak dibuat, jadi nggak usah atur apa-apa lagi. Tinggal tempel dan jalan.

Soal "gratis": kebanyakan akun Google biasa langsung jalan. Tapi sebagian kecil akun kadang diblokir otomatis sama Google (muncul "project has been denied access"). Itu salah deteksi dari pihak Google, bukan masalah appnya. Kalau kamu kena, lihat bagian "Kalau scan gagal" di bawah.

## Kalau scan gagal

Pesan error asli dari Google muncul di panel hasil, warnanya merah. Baca itu buat tau masalahnya:

- Muncul "You exceeded your current quota" atau "limit: 0": kuota model lagi habis. App ini pakai `gemini-3.1-flash-lite` yang jatah gratisnya longgar (15 request/menit, 500/hari), jadi mestinya jarang kejadian. Kalau tetap muncul, tunggu kuotanya reset (tengah malam waktu Pasifik, sekitar jam 2 siang WIB).
- Muncul "Your project has been denied access": akunmu kena blokir otomatis Google. App sama key-mu sebenernya nggak salah. Yang bisa dicoba, dari yang paling gampang: (1) pakai API key dari akun Google lain; (2) aktifin billing di project Cloud-mu, tetap gratis selama pemakaian di bawah limit, cuma project yang ada billing-nya lebih dipercaya Google jadi lolos blokir; (3) minta ditinjau di forum https://discuss.ai.google.dev, tapi ini lama.
- Muncul "API key not valid": key-nya salah atau ada spasi keikut. Tempel ulang lewat ⚙ > Ganti API Key.
- Kamera nggak nongol: pastiin halaman dibuka lewat HTTPS dan izin kameranya udah dikasih.

## Mau host sendiri? (opsional)

Buat kebanyakan orang, cukup pakai link di atas. Tapi kalau kamu pengen punya salinan sendiri, misalnya mau ngoprek kodenya, pakai domain sendiri, atau biar yakin nggak ada kode aneh, caranya gampang:

1. Bikin repo baru, upload isi folder ini (`index.html`, `style.css`, `app.js`, `README.md`).
2. Di Settings > Pages, pilih branch (misal `main`) folder root.
3. Tunggu URL-nya keluar: `https://NAMA-AKUN.github.io/NAMA-REPO/`.
4. Buka di HP.

## Isi folder

```
keranjang-pintar/
├── index.html   UI + layar setup key
├── style.css    Tampilan (palet "Ungu Lembut")
├── app.js       Kamera, panggil Gemini, keranjang, ringkasan
└── README.md    File ini
```

Model AI-nya diatur di konstanta `MODEL` paling atas `app.js`. Sekarang isinya `gemini-3.1-flash-lite`, dipaku ke id stabil (bukan alias `-latest`) karena jatah gratisnya paling longgar dan nggak ikut hot-swap ke rilis ber-limit lebih ketat.

## Privasi

Nggak ada data yang dikirim ke server pihak ketiga selain ke Google Gemini, itu pun cuma buat baca gambar labelnya. Key-mu disimpan di browsermu sendiri, nggak lewat aku. Foto label dikirim ke Google buat diproses, dan di jatah gratis datanya bisa dipakai Google buat ningkatin layanan, jadi mending jangan motret yang ada info pribadinya.
