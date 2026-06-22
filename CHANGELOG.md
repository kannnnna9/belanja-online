# Changelog

Semua perubahan penting pada proyek ini dicatat di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/),
dan proyek ini menganut [Semantic Versioning](https://semver.org/lang/id/).

## [0.5.0] - 2026-06-22

### Changed

- Pin model scan ke `gemini-3.1-flash-lite` (sebelumnya alias
  `gemini-flash-latest`). Pengecekan kuota free-tier di AI Studio menunjukkan
  `gemini-flash-latest` kini menunjuk Gemini 3.5 Flash dengan batas hanya
  **20 request per hari (RPD)** — tak cukup untuk satu sesi belanja (struk bisa
  50 item = 50 scan). Gemini 3.1 Flash Lite jauh lebih longgar: **15 RPM,
  500 RPD**, dan akurasi baca label tetap 100%. Id stabil dipilih (bukan alias
  `-latest`) agar tak hot-swap ke rilis ber-limit lebih ketat. ([57cf85f])
- Foto label di-crop ke kotak scan 5:3 sebelum dikirim; area di luar kotak
  tidak ikut dikirim. Resolusi diturunkan ke maksimal 800px lebar dengan
  kualitas JPEG 0,75 (dari 1280px / 0,85) untuk memangkas ukuran payload dan
  token gambar Gemini. ([57cf85f])

### Added

- Indikator kuota di dashboard: "⚡ Siap" saat idle, "⏳ N/15 RPM" mengikuti
  jumlah request dalam 60 detik terakhir, "❌ Limit" saat kena 429. Pemakaian
  harian (RPD) ditampilkan di halaman Pengaturan (N/500), reset otomatis tiap
  ganti hari. ([57cf85f])
- Tombol "🖼 Uji Galeri" di dashboard: pilih gambar dari penyimpanan lalu
  kirim ke pipeline scan yang sama (crop 5:3 + turun resolusi); hasilnya bisa
  diedit dan masuk keranjang seperti hasil kamera. ([57cf85f])

## [0.4.0] - 2026-06-22

### Changed

- Kembalikan model scan ke `gemini-flash-latest` (Flash penuh). Eksperimen
  `gemini-flash-lite-latest` menunjukkan akurasi sama persis (100% pada label
  uji) tetapi latensi tidak konsisten: sekitar separuh scan kena cold-start
  free-tier, kasus terburuk 16,7 detik. Flash penuh konsisten 2–3,4 detik
  tanpa lonjakan, jadi dipilih demi prediktabilitas. ([main])

### Added

- Timeout per percobaan + auto-retry saat scan: percobaan pertama dipotong di
  6 detik untuk memangkas lonjakan cold-start, retry kedua diberi tenggang 12
  detik. Sebagai jaring pengaman; pada Flash penuh yang ~3 detik nyaris tak
  pernah terpicu. ([f33760d])

### Removed

- Buang teks diagnostik sementara (`· 2.3s · 55KB · x1`) dari judul sheet
  hasil; kembali ke "Hasil Scan" bersih. ([main])

## [0.3.0] - 2026-06-21

### Added

- Riwayat belanja tersimpan di `localStorage` (`bco_history`). Tiap kali
  "Selesai", sesi belanja dicatat (tanggal, jumlah item, total). Halaman
  Riwayat menampilkan daftar sesi; ketuk satu sesi untuk lihat detail item,
  dan ada tombol "Hapus Riwayat". Data terpisah dari fungsi scan. ([674a20a])
- Edit item di keranjang: ketuk baris item untuk ubah nama dan harga, total
  diperbarui otomatis. ([674a20a])

### Changed

- Area scan kamera kini kotak horizontal rasio 5:3 di tengah layar dengan
  border aksen dan sudut melengkung; area di luarnya digelapkan. Aplikasi
  tetap portrait, hanya kotak scan yang landscape. ([674a20a])

## [0.2.2] - 2026-06-21

### Changed

- Ganti model Gemini ke alias `gemini-flash-latest` supaya selalu menunjuk
  ke Flash terbaru yang masih punya free tier. `gemini-2.0-flash` dimatikan
  Google 1 Juni 2026, sehingga free tier-nya jadi `limit:0` dan tiap scan
  gagal "quota exceeded". ([5cf5ba4])
- Kamera dimatikan saat loading scan (frame terakhir membeku), tidak lagi
  jalan di latar selama AI memproses. Dinyalakan lagi hanya bila user
  batal/tutup hasil saat masih di layar kamera. ([ede8107])
- Selaraskan README dan tutorial setup in-app dengan kondisi terkini:
  format key `AQ.` (auto-restrict) vs `AIza` lama, penjelasan alias model,
  dan bagian troubleshooting "Jika Scan Gagal". ([71d6ad3], [9160343])

## [0.2.1] - 2026-06-21

### Fixed

- Pesan error scan asli (mis. 400 API key / 403 referrer) kini tampil di
  dalam sheet hasil (`#res-error`). Sebelumnya ditulis ke `#cam-error` yang
  ketutup sheet, sehingga sheet tampak kosong tanpa alasan. ([cba4120])

## [0.2.0] - 2026-06-21

### Added

- Alur aplikasi setup → dashboard → kamera. ([c05cd6d])

## [0.1.1] - 2026-06-21

### Changed

- Kirim API key Gemini lewat header `x-goog-api-key`. ([5fd5685])

## [0.1.0] - 2026-06-21

### Added

- Inisialisasi BelanjaCatat Online: aplikasi statis BYOK untuk scan label
  harga di rak lewat kamera, nama dan harga dibaca otomatis oleh Gemini.
  ([a41a163])

[0.5.0]: https://github.com/kannnnna9/belanja-online/compare/57cf85f...main
[0.4.0]: https://github.com/kannnnna9/belanja-online/compare/bca2427...main
[0.3.0]: https://github.com/kannnnna9/belanja-online/compare/ede8107...674a20a
[0.2.2]: https://github.com/kannnnna9/belanja-online/compare/cba4120...ede8107
[0.2.1]: https://github.com/kannnnna9/belanja-online/compare/c05cd6d...cba4120
[0.2.0]: https://github.com/kannnnna9/belanja-online/compare/5fd5685...c05cd6d
[0.1.1]: https://github.com/kannnnna9/belanja-online/compare/a41a163...5fd5685
[0.1.0]: https://github.com/kannnnna9/belanja-online/commit/a41a163

[a41a163]: https://github.com/kannnnna9/belanja-online/commit/a41a163
[5fd5685]: https://github.com/kannnnna9/belanja-online/commit/5fd5685
[c05cd6d]: https://github.com/kannnnna9/belanja-online/commit/c05cd6d
[cba4120]: https://github.com/kannnnna9/belanja-online/commit/cba4120
[5cf5ba4]: https://github.com/kannnnna9/belanja-online/commit/5cf5ba4
[71d6ad3]: https://github.com/kannnnna9/belanja-online/commit/71d6ad3
[9160343]: https://github.com/kannnnna9/belanja-online/commit/9160343
[ede8107]: https://github.com/kannnnna9/belanja-online/commit/ede8107
[674a20a]: https://github.com/kannnnna9/belanja-online/commit/674a20a
[f33760d]: https://github.com/kannnnna9/belanja-online/commit/f33760d
[57cf85f]: https://github.com/kannnnna9/belanja-online/commit/57cf85f
[main]: https://github.com/kannnnna9/belanja-online/commits/main
