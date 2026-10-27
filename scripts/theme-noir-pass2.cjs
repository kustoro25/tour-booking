/**
 * Codemod lanjutan (sekali pakai) untuk tema noir & gold:
 * - panel status terang (green/red/yellow/...) → tint transparan gelap
 * - tombol/badge isi emas → teks hitam agar kontras
 * Jalankan: node scripts/theme-noir-pass2.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const EXCLUDE_DIRS = [/[\\/]admin[\\/]/, /[\\/]api[\\/]/, /[\\/]invoice[\\/]/];
const EXCLUDE_FILES = ['ImageUpload.tsx', 'Skeleton.tsx', 'Toast.tsx'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.some((re) => re.test(full + path.sep))) continue;
      walk(full, out);
    } else if (entry.name.endsWith('.tsx') && !EXCLUDE_FILES.includes(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Keluarga warna status: [nama, langit terang → tint gelap, teks gelap → terang] */
const STATUS = ['green', 'emerald', 'red', 'rose', 'yellow', 'purple', 'indigo', 'sky', 'lime', 'cyan', 'pink', 'violet'];

const RULES = [
  // Gradien emas datar / gelap → metalik
  [/bg-gradient-to-br from-gold-400 to-gold-400/g, 'bg-gradient-to-br from-gold-300 to-gold-600'],
  [/bg-gradient-to-br from-gold-400 to-gold-500/g, 'bg-gradient-to-br from-gold-300 to-gold-600'],
  [/bg-gradient-to-br from-gold-500 to-gold-600/g, 'bg-gradient-to-br from-gold-300 to-gold-600'],
  [/bg-gradient-to-r from-gold-500 to-gold-400 text-white/g, 'bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950'],
  [/bg-gradient-to-r from-gold-500 to-gold-600 text-white/g, 'bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950'],
  [/bg-gradient-to-r from-gold-400 to-red-500 text-white/g, 'bg-gradient-to-r from-gold-300 to-gold-600 text-ink-950'],
  [/bg-gold-500 text-white/g, 'bg-gold-400 text-ink-950'],
  [/bg-gold-400 text-white/g, 'bg-gold-400 text-ink-950'],
  [/bg-gold-600 text-white/g, 'bg-gold-500 text-ink-950'],
  [/(?<![\w-])ring-blue-200(?![\w-])/g, 'ring-gold-400/30'],
  [/(?<![\w-])text-blue-100(?![\w-])/g, 'text-gold-200'],
  [/(?<![\w-])bg-gray-700 text-white(?![\w-])/g, 'bg-ink-700 text-ivory'],
  [/(?<![\w-])from-yellow-400(?![\w-])/g, 'from-gold-300'],
];

for (const color of STATUS) {
  const c = color;
  RULES.push(
    [new RegExp(`(?<![\\w-])bg-${c}-50(?![\\w-])`, 'g'), `bg-${c}-500/10`],
    [new RegExp(`(?<![\\w-])bg-${c}-100(?![\\w-])`, 'g'), `bg-${c}-500/15`],
    [new RegExp(`(?<![\\w-])bg-${c}-200(?![\\w-])`, 'g'), `bg-${c}-500/25`],
    [new RegExp(`(?<![\\w-])hover:bg-${c}-50(?![\\w-])`, 'g'), `hover:bg-${c}-500/15`],
    [new RegExp(`(?<![\\w-])hover:bg-${c}-100(?![\\w-])`, 'g'), `hover:bg-${c}-500/20`],
    [new RegExp(`(?<![\\w-])hover:bg-${c}-200(?![\\w-])`, 'g'), `hover:bg-${c}-500/30`],
    [new RegExp(`(?<![\\w-])border-${c}-100(?![\\w-])`, 'g'), `border-${c}-500/25`],
    [new RegExp(`(?<![\\w-])border-${c}-200(?![\\w-])`, 'g'), `border-${c}-500/30`],
    [new RegExp(`(?<![\\w-])border-${c}-300(?![\\w-])`, 'g'), `border-${c}-500/40`],
    [new RegExp(`(?<![\\w-])text-${c}-900(?![\\w-])`, 'g'), `text-${c}-200`],
    [new RegExp(`(?<![\\w-])text-${c}-800(?![\\w-])`, 'g'), `text-${c}-200`],
    [new RegExp(`(?<![\\w-])text-${c}-700(?![\\w-])`, 'g'), `text-${c}-300`],
    [new RegExp(`(?<![\\w-])text-${c}-600(?![\\w-])`, 'g'), `text-${c}-300`],
    [new RegExp(`(?<![\\w-])hover:text-${c}-900(?![\\w-])`, 'g'), `hover:text-${c}-200`],
    [new RegExp(`(?<![\\w-])hover:text-${c}-700(?![\\w-])`, 'g'), `hover:text-${c}-200`],
    [new RegExp(`(?<![\\w-])hover:text-${c}-600(?![\\w-])`, 'g'), `hover:text-${c}-300`],
    [new RegExp(`(?<![\\w-])hover:border-${c}-300(?![\\w-])`, 'g'), `hover:border-${c}-500/40`],
    [new RegExp(`(?<![\\w-])hover:bg-${c}-600(?![\\w-])`, 'g'), `hover:bg-${c}-500`],
  );
}

let changed = 0;
const report = [];
const files = process.argv.length > 2
  ? process.argv.slice(2).map((p) => path.resolve(p))
  : walk(ROOT);
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let text = original;
  for (const [re, to] of RULES) text = text.replace(re, to);
  if (text !== original) {
    fs.writeFileSync(file, text);
    changed += 1;
    report.push(path.relative(ROOT, file));
  }
}
console.log(`File diubah: ${changed}`);
report.forEach((f) => console.log(' -', f));
