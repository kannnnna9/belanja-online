/* ============================================================
   BelanjaCatat Online — app.js
   App statis, tanpa backend. Pola BYOK: API key Gemini disimpan
   di localStorage browser user. Satu jepret = satu label harga.
   ============================================================ */

'use strict';

/* ---------- Konfigurasi ----------
   Ganti MODEL di sini bila ingin pakai model lain
   (mis. 'gemini-3-flash' begitu tersedia di akunmu). */
const MODEL = 'gemini-2.0-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const KEY_STORAGE = 'bco_api_key';

const PROMPT = [
  'Baca teks pada label harga ini.',
  "Keluarkan dalam format JSON: {nama: '...', harga: ...}.",
  'Harga dalam Rupiah, tanpa titik/koma. Contoh: 16500 bukan 16.500.',
].join(' ');

/* ---------- State ---------- */
let cart = [];          // [{ nama, harga }]
let stream = null;      // MediaStream kamera aktif
let lastShot = null;    // base64 JPEG hasil jepret terakhir (untuk "Ulangi")

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
    bd.addEventListener('click', (e) => { if (e.target === bd) bd.hidden = true; });
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
  scanLabel(lastShot);
}

/* ============================================================
   PANGGIL GEMINI
   ============================================================ */
async function scanLabel(base64) {
  openSheet('overlay-loading');
  try {
    const result = await callGemini(base64);
    closeSheet('overlay-loading');
    showResult(result.nama, result.harga);
  } catch (e) {
    closeSheet('overlay-loading');
    // Tetap buka sheet hasil supaya user bisa isi manual,
    // dan tampilkan pesan error ASLI di dalam sheet (bukan di #cam-error
    // yang ketutup sheet) supaya penyebab gagal kelihatan.
    showResult('', '', 'Scan Gagal');
    showResultError('Gagal membaca label: ' + e.message);
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
  closeSheet('sheet-result');
  $('cam-error').hidden = true;
  enterDashboard(); // selesai tambah → kembali ke dashboard
}

function retryScan() {
  closeSheet('sheet-result');
  $('cam-error').hidden = true;
  // Layar di bawah sheet (kamera atau dashboard) tetap; user bisa ulang/lanjut.
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
      <span class="ci-name"></span>
      <span class="ci-price">${rupiah(it.harga)}</span>
      <button class="ci-del" aria-label="Hapus">🗑</button>`;
    li.querySelector('.ci-name').textContent = it.nama;
    li.querySelector('.ci-del').addEventListener('click', () => removeItem(i));
    list.appendChild(li);
  });
}

function removeItem(i) {
  cart.splice(i, 1);
  renderCart();
}

/* ============================================================
   RINGKASAN
   ============================================================ */
function finishShopping() {
  if (cart.length === 0) return;

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
  closeSheet('sheet-summary');
  renderCart();
}
