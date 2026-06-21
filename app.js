/* ============================================================
   BelanjaCatat Online — app.js
   App statis, tanpa backend. Pola BYOK: API key Gemini disimpan
   di localStorage browser user. Satu jepret = satu label harga.
   ============================================================ */

'use strict';

/* ---------- Konfigurasi ----------
   MODEL pakai alias 'gemini-flash-lite-latest' (varian Flash-Lite, latensi
   rendah, cocok untuk tugas ringan baca 1 label) supaya selalu menunjuk ke
   Flash-Lite terbaru tanpa ikut mati saat Google men-deprecate versi tertentu
   (alias di-hot-swap dengan notice 2 minggu; mis. gemini-2.0-flash dimatikan
   1 Juni 2026 → free tier-nya jadi limit:0).
   Diuji menggantikan 'gemini-flash-latest' (Flash penuh) karena bottleneck
   scan terbukti di inferensi model, bukan jaringan (payload cuma ~55KB tapi
   2–3,4s di WiFi stabil). Mau akurasi maksimal lagi? balik ke 'gemini-flash-latest'. */
const MODEL = 'gemini-flash-lite-latest';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const KEY_STORAGE = 'bco_api_key';
const HISTORY_STORAGE = 'bco_history';

// Versi aplikasi. Satu sumber kebenaran: teks versi di halaman pengaturan
// diisi dari sini saat init, jadi cukup ubah angka ini tiap rilis.
const APP_VERSION = 'v0.3.0';

const PROMPT = [
  'Baca teks pada label harga ini.',
  "Keluarkan dalam format JSON: {nama: '...', harga: ...}.",
  'Harga dalam Rupiah, tanpa titik/koma. Contoh: 16500 bukan 16.500.',
].join(' ');

/* ---------- State ---------- */
let cart = [];          // [{ nama, harga }]
let stream = null;      // MediaStream kamera aktif
let lastShot = null;    // base64 JPEG hasil jepret terakhir (untuk "Ulangi")
let editIndex = -1;     // indeks item keranjang yang sedang diedit (-1 = tidak ada)
let sessionSaved = false; // true bila komposisi keranjang ini sudah masuk riwayat

/* ---------- Util DOM ---------- */
const $ = (id) => document.getElementById(id);
const rupiah = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => (s.hidden = true));
  $(id).hidden = false;
}
function openSheet(id) { $(id).hidden = false; }
function closeSheet(id) { $(id).hidden = true; }

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  wireEvents();
  const ver = $('app-version');
  if (ver) ver.textContent = APP_VERSION;
  if (getKey()) {
    enterDashboard();
  } else {
    showScreen('screen-setup');
  }
});

function wireEvents() {
  // Setup
  $('btn-save-key').addEventListener('click', saveKey);
  $('api-key-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveKey();
  });

  // Dashboard
  $('btn-add-item').addEventListener('click', openCamera);
  $('btn-manual').addEventListener('click', inputManual);
  $('btn-finish').addEventListener('click', finishShopping);
  $('btn-settings').addEventListener('click', () => openSheet('sheet-settings'));
  $('btn-history').addEventListener('click', openHistory);

  // Riwayat
  $('btn-history-back').addEventListener('click', enterDashboard);
  $('btn-clear-history').addEventListener('click', clearHistory);

  // Edit item keranjang
  $('btn-edit-save').addEventListener('click', saveEdit);
  $('btn-edit-cancel').addEventListener('click', () => closeSheet('sheet-edit'));

  // Kamera
  $('btn-capture').addEventListener('click', capture);
  $('btn-back').addEventListener('click', enterDashboard);

  // Hasil scan / input manual
  $('btn-add').addEventListener('click', addToCart);
  $('btn-retry').addEventListener('click', retryScan);

  // Ringkasan
  $('btn-close-summary').addEventListener('click', () => closeSheet('sheet-summary'));
  $('btn-new').addEventListener('click', newShopping);

  // Pengaturan
  $('btn-change-key').addEventListener('click', changeKey);

  // Tombol tutup generik (data-close="id")
  document.querySelectorAll('[data-close]').forEach((b) => {
    b.addEventListener('click', () => closeSheet(b.dataset.close));
  });

  // Klik backdrop untuk menutup sheet
  document.querySelectorAll('.sheet-backdrop').forEach((bd) => {
    bd.addEventListener('click', (e) => {
      if (e.target !== bd) return;
      bd.hidden = true;
      // Tutup hasil scan via backdrop saat di kamera → nyalakan lagi utk jepret ulang.
      if (bd.id === 'sheet-result' && !$('screen-camera').hidden) startCamera();
    });
  });
}

/* ============================================================
   API KEY (BYOK)
   ============================================================ */
function getKey() { return localStorage.getItem(KEY_STORAGE) || ''; }

function saveKey() {
  const val = $('api-key-input').value.trim();
  const err = $('setup-error');
  if (!val) {
    err.textContent = 'API key tidak boleh kosong.';
    err.hidden = false;
    return;
  }
  localStorage.setItem(KEY_STORAGE, val);
  err.hidden = true;
  enterDashboard();
}

function changeKey() {
  closeSheet('sheet-settings');
  stopCamera();
  $('api-key-input').value = getKey();
  showScreen('screen-setup');
}

/* ============================================================
   NAVIGASI
   ============================================================ */
function enterDashboard() {
  stopCamera();
  showScreen('screen-dashboard');
  renderCart();
}

function openCamera() {
  showScreen('screen-camera');
  startCamera();
}

/* ============================================================
   KAMERA
   ============================================================ */
async function startCamera() {
  const errBox = $('cam-error');
  errBox.hidden = true;
  if (stream) return; // sudah aktif
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    $('video').srcObject = stream;
  } catch (e) {
    errBox.textContent =
      'Tidak bisa mengakses kamera: ' + e.message +
      '. Pastikan izin kamera diberikan dan halaman dibuka via HTTPS.';
    errBox.hidden = false;
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
    $('video').srcObject = null;
  }
}

// Matikan kamera tapi biarkan frame terakhir tetap tampil (membeku).
// Dipakai saat jepret: kamera tak perlu jalan di latar selama loading scan.
function freezeCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
    // sengaja TIDAK reset srcObject supaya frame terakhir membeku di layar
  }
}

function capture() {
  const video = $('video');
  if (!video.videoWidth) {
    $('cam-error').textContent = 'Kamera belum siap. Coba sebentar lagi.';
    $('cam-error').hidden = false;
    return;
  }
  const canvas = $('canvas');
  // Batasi sisi terpanjang ~1280px agar payload ringan
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  lastShot = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  freezeCamera(); // matikan kamera setelah jepret; nyalakan lagi hanya bila jepret ulang
  scanLabel(lastShot);
}

/* ============================================================
   PANGGIL GEMINI
   ============================================================ */
async function scanLabel(base64) {
  openSheet('overlay-loading');
  // [DIAGNOSTIK SEMENTARA] ukur waktu request + ukuran payload, tampilkan
  // di sheet hasil supaya kebaca di HP. Hapus setelah selesai mengukur.
  const kb = Math.round((base64.length * 3 / 4) / 1024);
  const t0 = performance.now();
  try {
    const result = await callGemini(base64);
    const s = ((performance.now() - t0) / 1000).toFixed(1);
    closeSheet('overlay-loading');
    showResult(result.nama, result.harga, `Hasil Scan · ${s}s · ${kb}KB`);
  } catch (e) {
    const s = ((performance.now() - t0) / 1000).toFixed(1);
    closeSheet('overlay-loading');
    // Tetap buka sheet hasil supaya user bisa isi manual,
    // dan tampilkan pesan error ASLI di dalam sheet (bukan di #cam-error
    // yang ketutup sheet) supaya penyebab gagal kelihatan.
    showResult('', '', 'Scan Gagal');
    showResultError(`Gagal (${s}s, ${kb}KB): ` + e.message);
  }
}

function showResultError(msg) {
  const el = $('res-error');
  el.textContent = msg + ' — isi manual atau ulangi.';
  el.hidden = false;
}

async function callGemini(base64) {
  const url = `${API_BASE}/${MODEL}:generateContent`;
  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: { nama: { type: 'STRING' }, harga: { type: 'NUMBER' } },
        required: ['nama', 'harga'],
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Key dikirim via header (wajib untuk key format baru "AQ.",
      // dan tetap kompatibel dengan key lama "AIza").
      'x-goog-api-key': getKey(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j.error && j.error.message) msg = j.error.message;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseResult(text);
}

function parseResult(text) {
  // Buang pagar kode ```json ... ``` bila ada, lalu ambil objek JSON
  let clean = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start !== -1 && end !== -1) clean = clean.slice(start, end + 1);

  let obj;
  try {
    obj = JSON.parse(clean);
  } catch (_) {
    throw new Error('Format hasil tidak terbaca');
  }
  const harga = parseInt(String(obj.harga).replace(/\D/g, ''), 10);
  return { nama: obj.nama || '', harga: isNaN(harga) ? '' : harga };
}

/* ============================================================
   HASIL SCAN
   ============================================================ */
function showResult(nama, harga, title) {
  $('result-title').textContent = title || 'Hasil Scan';
  $('res-error').hidden = true; // bersihkan error lama
  $('res-nama').value = nama;
  $('res-harga').value = harga;
  openSheet('sheet-result');
}

// Tombol "Input Manual" di dashboard → sheet kosong, tanpa kamera.
function inputManual() {
  showResult('', '', 'Input Manual');
}

function addToCart() {
  const nama = $('res-nama').value.trim();
  const harga = parseInt($('res-harga').value, 10);
  if (!nama) { $('res-nama').focus(); return; }
  if (isNaN(harga)) { $('res-harga').focus(); return; }

  cart.push({ nama, harga });
  sessionSaved = false; // keranjang berubah → boleh dicatat ulang
  closeSheet('sheet-result');
  $('cam-error').hidden = true;
  enterDashboard(); // selesai tambah → kembali ke dashboard
}

function retryScan() {
  closeSheet('sheet-result');
  $('cam-error').hidden = true;
  // Kalau masih di layar kamera, hidupkan lagi supaya bisa jepret ulang.
  // (Kalau hasil ini dari Input Manual di dashboard, kamera tak disentuh.)
  if (!$('screen-camera').hidden) startCamera();
}

/* ============================================================
   KERANJANG
   ============================================================ */
function cartTotal() { return cart.reduce((s, it) => s + it.harga, 0); }

function renderCart() {
  const cc = $('cart-count');
  if (cc) cc.textContent = cart.length;
  $('cart-total').textContent = rupiah(cartTotal());

  const list = $('cart-list');
  const empty = $('cart-empty');
  list.innerHTML = '';

  if (cart.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  cart.forEach((it, i) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <button class="ci-tap" type="button">
        <span class="ci-name"></span>
        <span class="ci-price">${rupiah(it.harga)}</span>
      </button>
      <button class="ci-del" aria-label="Hapus">🗑</button>`;
    li.querySelector('.ci-name').textContent = it.nama;
    li.querySelector('.ci-tap').addEventListener('click', () => openEdit(i));
    li.querySelector('.ci-del').addEventListener('click', () => removeItem(i));
    list.appendChild(li);
  });
}

function removeItem(i) {
  cart.splice(i, 1);
  sessionSaved = false; // keranjang berubah → boleh dicatat ulang
  renderCart();
}

/* ---------- Edit item keranjang ---------- */
function openEdit(i) {
  editIndex = i;
  $('edit-nama').value = cart[i].nama;
  $('edit-harga').value = cart[i].harga;
  openSheet('sheet-edit');
}

function saveEdit() {
  if (editIndex < 0) return;
  const nama = $('edit-nama').value.trim();
  const harga = parseInt($('edit-harga').value, 10);
  if (!nama) { $('edit-nama').focus(); return; }
  if (isNaN(harga)) { $('edit-harga').focus(); return; }
  cart[editIndex] = { nama, harga };
  editIndex = -1;
  sessionSaved = false;
  closeSheet('sheet-edit');
  renderCart(); // total ikut diperbarui
}

/* ============================================================
   RINGKASAN
   ============================================================ */
function finishShopping() {
  if (cart.length === 0) return;

  // Simpan sesi ini ke riwayat sekali per komposisi keranjang.
  if (!sessionSaved) {
    recordSession();
    sessionSaved = true;
  }

  const list = $('summary-list');
  list.innerHTML = '';
  cart.forEach((it) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `<span class="ci-name"></span><span class="ci-price">${rupiah(it.harga)}</span>`;
    li.querySelector('.ci-name').textContent = it.nama;
    list.appendChild(li);
  });

  $('sum-count').textContent = cart.length;
  $('sum-total').textContent = rupiah(cartTotal());
  openSheet('sheet-summary');
}

function newShopping() {
  cart = [];
  lastShot = null;
  sessionSaved = false;
  closeSheet('sheet-summary');
  renderCart();
}

/* ============================================================
   RIWAYAT BELANJA (localStorage)
   Data riwayat TERPISAH dari fungsi scan — bila kosong/rusak,
   scan & keranjang tetap berjalan normal.
   ============================================================ */
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_STORAGE)) || []; }
  catch (_) { return []; }
}

function recordSession() {
  const list = loadHistory();
  list.unshift({
    ts: Date.now(),
    total: cartTotal(),
    items: cart.map((it) => ({ nama: it.nama, harga: it.harga })),
  });
  localStorage.setItem(HISTORY_STORAGE, JSON.stringify(list));
}

function fmtDate(ts) {
  const d = new Date(ts);
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  return `${tgl} · ${jam}`;
}

function openHistory() {
  stopCamera();
  showScreen('screen-history');
  renderHistory();
}

function renderHistory() {
  const list = $('history-list');
  const empty = $('history-empty');
  const data = loadHistory();
  list.innerHTML = '';

  if (data.length === 0) {
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  data.forEach((sesi, i) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div class="hi-info">
        <span class="hi-date"></span>
        <span class="hi-count"></span>
      </div>
      <span class="hi-total">${rupiah(sesi.total)}</span>`;
    li.querySelector('.hi-date').textContent = fmtDate(sesi.ts);
    li.querySelector('.hi-count').textContent = sesi.items.length + ' item';
    li.addEventListener('click', () => showHistoryDetail(i));
    list.appendChild(li);
  });
}

function showHistoryDetail(i) {
  const sesi = loadHistory()[i];
  if (!sesi) return;

  const list = $('hist-detail-list');
  list.innerHTML = '';
  sesi.items.forEach((it) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `<span class="ci-name"></span><span class="ci-price">${rupiah(it.harga)}</span>`;
    li.querySelector('.ci-name').textContent = it.nama;
    list.appendChild(li);
  });

  $('hist-detail-title').textContent = fmtDate(sesi.ts);
  $('hist-detail-count').textContent = sesi.items.length;
  $('hist-detail-total').textContent = rupiah(sesi.total);
  openSheet('sheet-history-detail');
}

function clearHistory() {
  if (loadHistory().length === 0) return;
  if (!confirm('Hapus semua riwayat belanja? Tindakan ini tidak bisa dibatalkan.')) return;
  localStorage.removeItem(HISTORY_STORAGE);
  renderHistory();
}
