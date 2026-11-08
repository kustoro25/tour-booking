// Script sekali pakai: ubah logo sumber (background putih) menjadi aset web:
// - public/images/haybali/logo-haybali.png  (logo lengkap, background transparan)
// - public/images/haybali/logo-mark.png     (emblem H + mobil, untuk ikon brand)
// - favicon & apple-touch-icon turunan emblem
// Jalankan: node scripts/generate-logo-assets.mjs
// Prasyarat: simpan file logo sumber (JPG/PNG background putih) di tmp-logo/logo-src.jpg
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'tmp-logo/logo-src.jpg';
const OUT_DIR = 'public/images/haybali';
const WHITE_MIN = 232; // ambang "putih" yang dianggap background

/** Hapus background putih yang menyambung ke tepi gambar (flood fill BFS). */
function makeBorderWhiteTransparent(data, width, height) {
  const idx = (x, y) => (y * width + x) * 4;
  const visited = new Uint8Array(width * height);
  const queue = [];
  const pushIfWhite = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    const i = p * 4;
    if (data[i] >= WHITE_MIN && data[i + 1] >= WHITE_MIN && data[i + 2] >= WHITE_MIN) {
      visited[p] = 1;
      data[i + 3] = 0; // transparan
      queue.push(x, y);
    }
  };

  for (let x = 0; x < width; x++) {
    pushIfWhite(x, 0);
    pushIfWhite(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfWhite(0, y);
    pushIfWhite(width - 1, y);
  }

  while (queue.length) {
    const y = queue.pop();
    const x = queue.pop();
    pushIfWhite(x + 1, y);
    pushIfWhite(x - 1, y);
    pushIfWhite(x, y + 1);
    pushIfWhite(x, y - 1);
  }

  // Huruf "H" berwarna putih di dalam lingkaran kuning bisa ikut terhapus bila
  // ada celah tipis menghubungkannya ke background. Kembalikan putih di dalam
  // lingkaran agar huruf tetap tampil seperti desain aslinya.
  let minX = width, minY = height, maxX = -1, maxY = -1;
  const isYellow = (i) => data[i] >= 195 && data[i + 1] >= 140 && data[i + 2] <= 105;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (isYellow(i)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX > minX && maxY > minY) {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const radius = Math.min(maxX - minX, maxY - minY) / 2;
    const limit = radius * 0.985;
    for (let y = Math.max(0, Math.floor(cy - limit)); y <= Math.min(height - 1, Math.ceil(cy + limit)); y++) {
      for (let x = Math.max(0, Math.floor(cx - limit)); x <= Math.min(width - 1, Math.ceil(cx + limit)); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > limit * limit) continue;
        const i = (y * width + x) * 4;
        if (data[i + 3] === 0) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
        }
      }
    }
  }
}

/** Bounding box piksel yang masih terlihat (alpha > 8). */
function visibleBox(data, width, height) {
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/** ICO container sederhana yang membungkus PNG (didukung Windows Vista+). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((entry, i) => {
    const base = i * 16;
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1);
    dir.writeUInt8(0, base + 2);
    dir.writeUInt8(0, base + 3);
    dir.writeUInt16LE(1, base + 4);
    dir.writeUInt16LE(32, base + 6);
    dir.writeUInt32LE(entry.png.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

const base = sharp(SRC).ensureAlpha().raw();
const { data, info } = await base.toBuffer({ resolveWithObject: true });
makeBorderWhiteTransparent(data, info.width, info.height);

const transparent = sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
});
const box = visibleBox(data, info.width, info.height);
const full = transparent.clone().extract(box);
const fullBuf = await full.png({ compressionLevel: 9 }).toBuffer();

// Logo lengkap
fs.mkdirSync(OUT_DIR, { recursive: true });
await sharp(fullBuf)
  .resize({ height: 720, fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true, colours: 200 })
  .toFile(path.join(OUT_DIR, 'logo-haybali.png'));

// Emblem (bagian atas: lingkaran H + mobil). Batas bawah dicari dari baris
// yang sepenuhnya transparan di bawah gambar mobil (celah sebelum teks).
let emblemHeight = Math.round(box.height * 0.72);
{
  const rawFull = await sharp(fullBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data: d, info: inf } = rawFull;
  const rowEmpty = (y) => {
    for (let x = 0; x < inf.width; x++) {
      if (d[(y * inf.width + x) * 4 + 3] > 8) return false;
    }
    return true;
  };
  for (let y = Math.round(inf.height * 0.45); y < inf.height - 1; y++) {
    if (rowEmpty(y) && rowEmpty(y + 1)) {
      emblemHeight = y;
      break;
    }
  }
}

const markRaw = await sharp(fullBuf)
  .extract({ left: 0, top: 0, width: box.width, height: emblemHeight })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const markBox = visibleBox(markRaw.data, markRaw.info.width, markRaw.info.height);
const mark = await sharp(markRaw.data, {
  raw: { width: markRaw.info.width, height: markRaw.info.height, channels: 4 },
})
  .extract({ left: markBox.left, top: markBox.top, width: markBox.width, height: markBox.height })
  .png()
  .toBuffer();
// Ikon brand: 256px cukup untuk tampilan 40px (retina 2x) dan jauh lebih ringan.
const markBuf = await sharp(mark)
  .resize({ width: 256, height: 256, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9, palette: true, colours: 128 })
  .toBuffer();
fs.writeFileSync(path.join(OUT_DIR, 'logo-mark.png'), markBuf);

// Turunan ikon situs
const targets = [
  { file: 'public/favicon-32x32.png', size: 32 },
  { file: 'public/favicon-16x16.png', size: 16 },
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/android-chrome-192x192.png', size: 192 },
  { file: 'public/android-chrome-512x512.png', size: 512 },
];
const icoSizes = {};
for (const t of targets) {
  // Selalu dari emblem resolusi penuh agar ikon 512 tidak ikut ter-upscale.
  const buf = await sharp(mark)
    .resize(t.size, t.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true, colours: 128 })
    .toBuffer();
  fs.writeFileSync(t.file, buf);
  if (t.size === 16 || t.size === 32) icoSizes[t.size] = buf;
}
fs.writeFileSync(
  'src/app/favicon.ico',
  buildIco([
    { size: 16, png: icoSizes[16] },
    { size: 32, png: icoSizes[32] },
  ])
);

// Pratinjau untuk pemeriksaan visual (logo di atas latar gelap situs)
const previewTile = 64;
const tile = await sharp(markBuf)
  .resize(previewTile - 8, previewTile - 8, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();
await sharp({ create: { width: 360, height: 260, channels: 4, background: '#0b0b0f' } })
  .composite([
    { input: tile, left: 160, top: 20 },
    { input: await sharp(markBuf).resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), left: 80, top: 100 },
  ])
  .png()
  .toFile('tmp-logo/preview.png');

console.log('logo-haybali.png, logo-mark.png, favicon set, favicon.ico dibuat');
console.log('emblem crop:', markBox.width + 'x' + markBox.height);
