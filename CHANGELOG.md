# Changelog

Semua perubahan penting pada proyek ini dicatat di berkas ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/),
dan proyek ini menganut [Semantic Versioning](https://semver.org/lang/id/).

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
