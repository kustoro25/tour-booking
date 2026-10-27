/**
 * Codemod sekali pakai: memetakan utilitas Tailwind tema terang (amber/orange/putih)
 * ke palet noir & gold untuk halaman publik.
 * Jalankan: node scripts/theme-noir.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');

const EXCLUDE_DIRS = [/[\\/]admin[\\/]/, /[\\/]api[\\/]/, /[\\/]invoice[\\/]/, /[\\/]design-demo[\\/]/];
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

const BAND_LIGHT = '@@BAND_A@@';
const BAND_DARK = '@@BAND_B@@';

/** Aturan penggantian: [regex, hasil] */
const RULES = [
  // --- permukaan / latar ---
  [/(?<![\w-])hover:bg-white(?![\w-])/g, 'hover:bg-ink-800'],
  [/(?<![\w-])bg-white\/(95|90|80|70|60)(?=$|[^\d])/g, 'bg-ink-900/$1'],
  [/(?<![\w-])bg-white(?![\w-])/g, 'bg-ink-850'],
  [/(?<![\w-])hover:bg-gray-50\/50/g, 'hover:bg-gold-400/5'],
  [/(?<![\w-])hover:bg-gray-50(?![\w-])/g, 'hover:bg-ink-800'],
  [/(?<![\w-])hover:bg-gray-100(?![\w-])/g, 'hover:bg-ink-800'],
  [/(?<![\w-])bg-gray-50(?![\w-])/g, 'bg-ink-900'],
  [/(?<![\w-])bg-gray-100(?![\w-])/g, 'bg-ink-800'],
  [/(?<![\w-])bg-gray-200(?![\w-])/g, 'bg-ink-700'],
  [/(?<![\w-])bg-gray-300(?![\w-])/g, 'bg-ink-700'],
  [/(?<![\w-])bg-gray-800(?![\w-])/g, 'bg-ink-800'],
  [/(?<![\w-])bg-gray-900(?![\w-])/g, 'bg-ink-950'],
  [/(?<![\w-])to-white(?![\w-])/g, 'to-ink-950'],
  [/(?<![\w-])from-white(?![\w-])/g, 'from-ink-850'],

  // --- teks netral ---
  [/(?<![\w-])text-gray-900(?![\w-])/g, 'text-ivory'],
  [/(?<![\w-])text-gray-800(?![\w-])/g, 'text-ivory'],
  [/(?<![\w-])text-gray-700(?![\w-])/g, 'text-mist'],
  [/(?<![\w-])text-gray-600(?![\w-])/g, 'text-mist'],
  [/(?<![\w-])text-gray-500(?![\w-])/g, 'text-mist-dim'],
  [/(?<![\w-])text-gray-400(?![\w-])/g, 'text-mist-dim'],
  [/(?<![\w-])text-gray-300(?![\w-])/g, 'text-mist'],
  [/(?<![\w-])text-gray-200(?![\w-])/g, 'text-mist'],

  // --- border / divider ---
  [/(?<![\w-])divide-gray-100(?![\w-])/g, 'divide-ink-700'],
  [/(?<![\w-])divide-gray-200(?![\w-])/g, 'divide-ink-700'],
  [/(?<![\w-])border-gray-50(?![\w-])/g, 'border-ink-700'],
  [/(?<![\w-])border-gray-100(?![\w-])/g, 'border-ink-700'],
  [/(?<![\w-])border-gray-200(?![\w-])/g, 'border-ink-700'],
  [/(?<![\w-])border-gray-300(?![\w-])/g, 'border-ink-600'],
  [/(?<![\w-])border-gray-700(?![\w-])/g, 'border-ink-600'],
  [/(?<![\w-])border-gray-800(?![\w-])/g, 'border-ink-700'],

  // --- aksen amber & orange → emas ---
  [/(?<![\w-])text-amber-900\/80/g, 'text-gold-200/80'],
  [/(?<![\w-])text-amber-900(?![\w-])/g, 'text-gold-200'],
  [/(?<![\w-])text-amber-800(?![\w-])/g, 'text-gold-200'],
  [/(?<![\w-])text-amber-700(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-amber-600(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-amber-500(?![\w-])/g, 'text-gold-400'],
  [/(?<![\w-])text-amber-400(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-amber-300(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-amber-200(?![\w-])/g, 'text-gold-600/60'],
  [/(?<![\w-])bg-amber-50\/50/g, 'bg-gold-400/5'],
  [/(?<![\w-])bg-amber-50(?![\w-])/g, 'bg-gold-400/10'],
  [/(?<![\w-])bg-amber-100(?![\w-])/g, 'bg-gold-400/15'],
  [/(?<![\w-])bg-amber-200(?![\w-])/g, 'bg-gold-400/25'],
  [/(?<![\w-])bg-amber-400\/15/g, 'bg-gold-400/15'],
  [/(?<![\w-])bg-amber-400\/10/g, 'bg-gold-400/10'],
  [/(?<![\w-])bg-amber-500\/95/g, 'bg-gold-500/95'],
  [/(?<![\w-])bg-amber-500(?![\w-])/g, 'bg-gold-400'],
  [/(?<![\w-])bg-amber-600(?![\w-])/g, 'bg-gold-500'],
  [/(?<![\w-])bg-amber-700(?![\w-])/g, 'bg-gold-600'],
  [/(?<![\w-])hover:bg-amber-700(?![\w-])/g, 'hover:bg-gold-300'],
  [/(?<![\w-])hover:bg-amber-600(?![\w-])/g, 'hover:bg-gold-300'],
  [/(?<![\w-])hover:bg-amber-50(?![\w-])/g, 'hover:bg-gold-400/10'],
  [/(?<![\w-])hover:bg-amber-200(?![\w-])/g, 'hover:bg-gold-400/20'],
  [/(?<![\w-])border-amber-100(?![\w-])/g, 'border-gold-500/20'],
  [/(?<![\w-])border-amber-200(?![\w-])/g, 'border-gold-500/30'],
  [/(?<![\w-])border-amber-300\/30/g, 'border-gold-400/40'],
  [/(?<![\w-])border-amber-300(?![\w-])/g, 'border-gold-400/40'],
  [/(?<![\w-])border-amber-600(?![\w-])/g, 'border-gold-500'],
  [/(?<![\w-])hover:border-amber-100(?![\w-])/g, 'hover:border-gold-500/40'],
  [/(?<![\w-])hover:border-amber-700(?![\w-])/g, 'hover:border-gold-400'],
  [/(?<![\w-])hover:border-amber-600(?![\w-])/g, 'hover:border-gold-400'],
  [/(?<![\w-])hover:text-amber-900(?![\w-])/g, 'hover:text-gold-200'],
  [/(?<![\w-])hover:text-amber-700(?![\w-])/g, 'hover:text-gold-200'],
  [/(?<![\w-])hover:text-amber-600(?![\w-])/g, 'hover:text-gold-300'],
  [/(?<![\w-])group-hover:text-amber-600(?![\w-])/g, 'group-hover:text-gold-300'],
  [/(?<![\w-])from-amber-400(?![\w-])/g, 'from-gold-400'],
  [/(?<![\w-])from-amber-500(?![\w-])/g, 'from-gold-300'],
  [/(?<![\w-])from-amber-600(?![\w-])/g, 'from-gold-500'],
  [/(?<![\w-])hover:from-amber-600(?![\w-])/g, 'hover:from-gold-400'],
  [/(?<![\w-])to-amber-600(?![\w-])/g, 'to-gold-600'],
  [/(?<![\w-])hover:to-amber-700(?![\w-])/g, 'hover:to-gold-300'],
  [/(?<![\w-])to-amber-900\/60/g, 'to-ink-950/80'],
  [/(?<![\w-])to-amber-100\/50/g, 'to-gold-400/10'],
  [/(?<![\w-])via-amber-500(?![\w-])/g, 'via-gold-400'],
  [/(?<![\w-])shadow-amber-500\/20/g, 'shadow-gold-500/20'],
  [/(?<![\w-])shadow-amber-500\/30/g, 'shadow-gold-500/30'],
  [/(?<![\w-])group-hover:shadow-amber-500\/40/g, 'group-hover:shadow-gold-400/40'],
  [/(?<![\w-])focus:ring-amber-500(?![\w-])/g, 'focus:ring-gold-400'],
  [/(?<![\w-])focus:border-amber-500(?![\w-])/g, 'focus:border-gold-400'],

  [/(?<![\w-])text-orange-700(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-orange-600(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-orange-500(?![\w-])/g, 'text-gold-400'],
  [/(?<![\w-])bg-orange-50(?![\w-])/g, 'bg-gold-400/10'],
  [/(?<![\w-])bg-orange-100(?![\w-])/g, 'bg-gold-400/15'],
  [/(?<![\w-])bg-orange-600(?![\w-])/g, 'bg-gold-500'],
  [/(?<![\w-])from-orange-500(?![\w-])/g, 'from-gold-400'],
  [/(?<![\w-])from-orange-600(?![\w-])/g, 'from-gold-500'],
  [/(?<![\w-])hover:from-orange-600(?![\w-])/g, 'hover:from-gold-400'],
  [/(?<![\w-])via-orange-500(?![\w-])/g, 'via-gold-400'],
  [/(?<![\w-])to-orange-700(?![\w-])/g, 'to-gold-300'],
  [/(?<![\w-])to-orange-600(?![\w-])/g, 'to-gold-600'],
  [/(?<![\w-])to-orange-500(?![\w-])/g, 'to-gold-500'],
  [/(?<![\w-])to-orange-100\/50/g, 'to-gold-400/10'],
  [/(?<![\w-])shadow-orange-500\/20/g, 'shadow-gold-500/20'],
  [/(?<![\w-])hover:shadow-orange-500\/30/g, 'hover:shadow-gold-400/30'],

  [/(?<![\w-])text-yellow-500(?![\w-])/g, 'text-gold-400'],
  [/(?<![\w-])to-yellow-500(?![\w-])/g, 'to-gold-400'],

  // --- teal → emas ---
  [/(?<![\w-])text-teal-700(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-teal-600(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])bg-teal-50(?![\w-])/g, 'bg-gold-400/10'],
  [/(?<![\w-])bg-teal-100(?![\w-])/g, 'bg-gold-400/15'],
  [/(?<![\w-])to-teal-400(?![\w-])/g, 'to-gold-400'],
  [/(?<![\w-])to-teal-600(?![\w-])/g, 'to-gold-600'],

  // --- slate (kartu gelap & tombol sekunder) ---
  [/(?<![\w-])from-slate-700(?![\w-])/g, 'from-ink-700'],
  [/(?<![\w-])to-slate-800(?![\w-])/g, 'to-ink-800'],
  [/(?<![\w-])hover:from-slate-800(?![\w-])/g, 'hover:from-ink-600'],
  [/(?<![\w-])hover:to-slate-900(?![\w-])/g, 'hover:to-ink-700'],
  [/(?<![\w-])shadow-slate-500\/20/g, 'shadow-ink-950/40'],
  [/(?<![\w-])shadow-slate-500\/30/g, 'shadow-ink-950/50'],

  // --- biru (state pilihan, fokus, info) → emas ---
  [/(?<![\w-])text-blue-900\/80/g, 'text-gold-200/80'],
  [/(?<![\w-])text-blue-900(?![\w-])/g, 'text-gold-200'],
  [/(?<![\w-])text-blue-800(?![\w-])/g, 'text-gold-200'],
  [/(?<![\w-])text-blue-700(?![\w-])/g, 'text-gold-200'],
  [/(?<![\w-])text-blue-600(?![\w-])/g, 'text-gold-300'],
  [/(?<![\w-])text-blue-500(?![\w-])/g, 'text-gold-400'],
  [/(?<![\w-])text-blue-200(?![\w-])/g, 'text-gold-200'],
  [/(?<![\w-])hover:text-blue-700(?![\w-])/g, 'hover:text-gold-200'],
  [/(?<![\w-])hover:text-blue-600(?![\w-])/g, 'hover:text-gold-300'],
  [/(?<![\w-])group-hover:text-blue-600(?![\w-])/g, 'group-hover:text-gold-300'],
  [/(?<![\w-])bg-blue-50\/50/g, 'bg-gold-400/5'],
  [/(?<![\w-])bg-blue-50(?![\w-])/g, 'bg-gold-400/10'],
  [/(?<![\w-])bg-blue-100(?![\w-])/g, 'bg-gold-400/15'],
  [/(?<![\w-])bg-blue-500\/10/g, 'bg-gold-400/10'],
  [/(?<![\w-])bg-blue-500(?![\w-])/g, 'bg-gold-500'],
  [/(?<![\w-])bg-blue-600(?![\w-])/g, 'bg-gold-500'],
  [/(?<![\w-])hover:bg-blue-50(?![\w-])/g, 'hover:bg-gold-400/10'],
  [/(?<![\w-])border-blue-100(?![\w-])/g, 'border-gold-500/20'],
  [/(?<![\w-])border-blue-400(?![\w-])/g, 'border-gold-400'],
  [/(?<![\w-])border-blue-500(?![\w-])/g, 'border-gold-400'],
  [/(?<![\w-])border-blue-600(?![\w-])/g, 'border-gold-500'],
  [/(?<![\w-])hover:border-blue-100(?![\w-])/g, 'hover:border-gold-500/40'],
  [/(?<![\w-])hover:border-blue-300(?![\w-])/g, 'hover:border-gold-400/60'],
  [/(?<![\w-])hover:border-blue-400(?![\w-])/g, 'hover:border-gold-400'],
  [/(?<![\w-])focus:ring-blue-500(?![\w-])/g, 'focus:ring-gold-400'],
  [/(?<![\w-])focus:border-blue-500(?![\w-])/g, 'focus:border-gold-400'],
  [/(?<![\w-])ring-blue-300(?![\w-])/g, 'ring-gold-400'],
  [/(?<![\w-])group-hover\/photo:ring-blue-400/g, 'group-hover/photo:ring-gold-400'],
  [/(?<![\w-])from-blue-50(?![\w-])/g, 'from-gold-400/10'],
  [/(?<![\w-])from-blue-400(?![\w-])/g, 'from-gold-400'],
  [/(?<![\w-])from-blue-500(?![\w-])/g, 'from-gold-500'],
  [/(?<![\w-])from-blue-600(?![\w-])/g, 'from-gold-500'],
  [/(?<![\w-])from-blue-900\/70/g, 'from-ink-950/80'],
  [/(?<![\w-])via-blue-900\/20/g, 'via-ink-950/20'],
  [/(?<![\w-])to-blue-600(?![\w-])/g, 'to-gold-600'],
  [/(?<![\w-])to-blue-700(?![\w-])/g, 'to-gold-400'],
  [/(?<![\w-])to-blue-950(?![\w-])/g, 'to-ink-950'],
  [/(?<![\w-])hover:from-blue-700(?![\w-])/g, 'hover:from-gold-400'],
  [/(?<![\w-])hover:to-blue-800(?![\w-])/g, 'hover:to-gold-600'],
  [/(?<![\w-])shadow-blue-200(?![\w-])/g, 'shadow-gold-700/30'],
  [/(?<![\w-])shadow-blue-500\/20/g, 'shadow-gold-500/20'],
  [/(?<![\w-])shadow-blue-500\/30/g, 'shadow-gold-500/30'],
  [/(?<![\w-])hover:shadow-blue-500\/30/g, 'hover:shadow-gold-400/30'],
  [/(?<![\w-])hover:shadow-blue-500\/40/g, 'hover:shadow-gold-400/40'],

  // --- placeholder ---
  [/(?<![\w-])placeholder-gray-500(?![\w-])/g, 'placeholder-mist-dim'],
  [/(?<![\w-])placeholder-gray-400(?![\w-])/g, 'placeholder-mist-dim'],
];

const files = process.argv.length > 2
  ? process.argv.slice(2).map((p) => path.resolve(p))
  : walk(ROOT);
let changed = 0;
const report = [];

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let text = original;

  // Pita <section> berlatar putih / abu terang dipisah agar tetap kontras dengan kartu.
  text = text
    .split('\n')
    .map((line) => {
      if (!line.includes('<section') && !line.includes('<main')) return line;
      return line
        .replace(/(?<![\w-])bg-white(?![\w-])/g, BAND_LIGHT)
        .replace(/(?<![\w-])bg-gray-50(?![\w-])/g, BAND_DARK);
    })
    .join('\n');

  for (const [re, to] of RULES) text = text.replace(re, to);

  text = text
    .replaceAll(BAND_LIGHT, 'bg-ink-950')
    .replaceAll(BAND_DARK, 'bg-ink-900');

  if (text !== original) {
    fs.writeFileSync(file, text);
    changed += 1;
    report.push(path.relative(ROOT, file));
  }
}

console.log(`File diubah: ${changed}`);
report.forEach((f) => console.log(' -', f));
