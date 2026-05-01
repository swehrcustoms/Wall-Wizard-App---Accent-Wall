/**
 * Generates WallWizard PWA icons using only Node.js built-ins.
 * Outputs: public/icons/icon-192.png, icon-512.png, apple-touch-icon.png, maskable-512.png
 */
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'public', 'icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ─── Minimal PNG encoder ──────────────────────────────────────────────────

function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  })());
  let c = 0xFFFFFFFF;
  for (const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function encodePNG(pixels, width, height) {
  // pixels: Uint8Array of RGBA values, row-major
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB (we strip alpha for simplicity)
  // Actually let's keep RGBA — color type 6
  ihdr[9] = 6;
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Raw scanlines: filter byte (0) + RGBA per pixel
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = y * (1 + width * 4) + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Icon drawing ─────────────────────────────────────────────────────────

function drawIcon(size, safe = 0) {
  // safe: extra padding for maskable icons (as fraction, e.g. 0.1 = 10%)
  const pixels = new Uint8Array(size * size * 4);

  // Brand blue background: #0284c7
  const BG = [2, 132, 199, 255];
  // White foreground
  const FG = [255, 255, 255, 255];
  // Accent gold: #f59e0b
  const GOLD = [245, 158, 11, 255];

  const setPixel = (x, y, color) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i]     = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
    pixels[i + 3] = color[3];
  };

  const fillRect = (x0, y0, w, h, color) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++)
        setPixel(x, y, color);
  };

  const fillCircle = (cx, cy, r, color) => {
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r)
          setPixel(x, y, color);
  };

  // Fill background
  fillRect(0, 0, size, size, BG);

  // Draw rounded corners via masking
  const cornerR = size * 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inCorner = false;
      if (x < cornerR && y < cornerR) inCorner = (x - cornerR) ** 2 + (y - cornerR) ** 2 > cornerR ** 2;
      if (x > size - cornerR && y < cornerR) inCorner = (x - (size - cornerR)) ** 2 + (y - cornerR) ** 2 > cornerR ** 2;
      if (x < cornerR && y > size - cornerR) inCorner = (x - cornerR) ** 2 + (y - (size - cornerR)) ** 2 > cornerR ** 2;
      if (x > size - cornerR && y > size - cornerR) inCorner = (x - (size - cornerR)) ** 2 + (y - (size - cornerR)) ** 2 > cornerR ** 2;
      if (inCorner) {
        const i = (y * size + x) * 4;
        pixels[i] = 0; pixels[i+1] = 0; pixels[i+2] = 0; pixels[i+3] = 0;
      }
    }
  }

  // Icon content area (respecting safe zone)
  const pad = Math.floor(size * (0.18 + safe));
  const inner = size - pad * 2;

  // Draw a wizard hat shape using simple rects + triangles
  // Hat brim
  const brimH = Math.floor(inner * 0.15);
  const brimY = pad + Math.floor(inner * 0.72);
  fillRect(pad, brimY, inner, brimH, FG);

  // Hat crown (trapezoid approximation with stacked rects)
  const crownTop = pad + Math.floor(inner * 0.1);
  const crownBot = brimY;
  const crownH = crownBot - crownTop;
  const topW = Math.floor(inner * 0.2);
  const botW = Math.floor(inner * 0.55);
  for (let row = 0; row < crownH; row++) {
    const t = row / crownH;
    const rowW = Math.floor(topW + (botW - topW) * t);
    const rowX = pad + Math.floor((inner - rowW) / 2);
    fillRect(rowX, crownTop + row, rowW, 1, FG);
  }

  // Star on hat
  const starCX = Math.floor(size / 2);
  const starCY = pad + Math.floor(inner * 0.35);
  const starR = Math.floor(inner * 0.07);
  fillCircle(starCX, starCY, starR, GOLD);

  // Magic sparkles (small dots)
  [
    [pad + Math.floor(inner * 0.78), pad + Math.floor(inner * 0.15)],
    [pad + Math.floor(inner * 0.85), pad + Math.floor(inner * 0.30)],
    [pad + Math.floor(inner * 0.20), pad + Math.floor(inner * 0.20)],
  ].forEach(([sx, sy]) => fillCircle(sx, sy, Math.max(2, Math.floor(starR * 0.55)), GOLD));

  return pixels;
}

// ─── Generate all sizes ─────────────────────────────────────────────────

const specs = [
  { name: 'icon-192.png',        size: 192, safe: 0    },
  { name: 'icon-512.png',        size: 512, safe: 0    },
  { name: 'apple-touch-icon.png',size: 180, safe: 0    },
  { name: 'maskable-512.png',    size: 512, safe: 0.10 }, // 10% safe zone
];

for (const { name, size, safe } of specs) {
  const pixels = drawIcon(size, safe);
  const png = encodePNG(pixels, size, size);
  const outPath = path.join(OUT_DIR, name);
  fs.writeFileSync(outPath, png);
  console.log(`✓ ${name}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log('\nIcons written to public/icons/');
