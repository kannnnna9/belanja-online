#!/usr/bin/env python3
"""Generator ikon Keranjang Pintar — tanpa dependensi (zlib+struct saja).

Menggambar glyph tas belanja (dark) di atas latar ungu aksen, lalu menulis
PNG RGB. Dipakai untuk ikon PWA (192 & 512, maskable-safe: konten di dalam
zona aman tengah ~80%). Jalankan: `python3 make-icons.py`.
"""
import zlib, struct

BG = (167, 139, 250)   # --accent  #a78bfa
FG = (26, 16, 37)      # gelap brand #1a1025

def render(S):
    # buffer RGB, isi latar
    buf = bytearray()
    for _ in range(S * S):
        buf += bytes(BG)

    def put(x, y, c):
        if 0 <= x < S and 0 <= y < S:
            i = (y * S + x) * 3
            buf[i:i+3] = bytes(c)

    # --- badan tas: persegi sudut-bulat ---
    x0, y0, x1, y1 = 0.28*S, 0.42*S, 0.72*S, 0.76*S
    r = 0.06*S
    for y in range(int(y0), int(y1)):
        for x in range(int(x0), int(x1)):
            dx = min(x - x0, x1 - 1 - x)
            dy = min(y - y0, y1 - 1 - y)
            if dx < r and dy < r and (dx - r)**2 + (dy - r)**2 > r*r:
                continue  # sudut di luar radius → biarkan latar
            put(x, y, FG)

    # --- pegangan: cincin (annulus) bagian atas saja ---
    cx, cy = 0.50*S, 0.42*S
    ro, ri = 0.135*S, 0.088*S
    for y in range(int(cy - ro), int(cy)):       # hanya y di atas badan
        for x in range(int(cx - ro), int(cx + ro)):
            d = ((x - cx)**2 + (y - cy)**2) ** 0.5
            if ri <= d <= ro:
                put(x, y, FG)

    return bytes(buf)

def write_png(path, S):
    raw = render(S)
    # tambah filter byte 0 di tiap baris
    rows = bytearray()
    for y in range(S):
        rows.append(0)
        rows += raw[y*S*3:(y+1)*S*3]

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", S, S, 8, 2, 0, 0, 0)  # RGB, 8-bit
    idat = zlib.compress(bytes(rows), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))
    print(f"wrote {path} ({S}x{S})")

if __name__ == "__main__":
    write_png("icon-192.png", 192)
    write_png("icon-512.png", 512)
