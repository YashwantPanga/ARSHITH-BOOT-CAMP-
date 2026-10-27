// Copies the ID-card text reader (Tesseract worker, engine and English language data) into
// public/ocr/, so the site serves it itself instead of downloading ~10 MB from a CDN during the
// exam check. Runs before every build and dev start (npm prebuild / predev).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const out = path.join(root, 'public', 'ocr');
const nm = (...p) => path.join(root, 'node_modules', ...p);

const files = [
  [nm('tesseract.js', 'dist', 'worker.min.js'), 'worker.min.js'],
  ...fs.readdirSync(nm('tesseract.js-core'))
    .filter(f => /^tesseract-core.*lstm.*\.(js|wasm)$/.test(f))
    .map(f => [nm('tesseract.js-core', f), path.join('core', f)]),
  [nm('@tesseract.js-data', 'eng', '4.0.0_best_int', 'eng.traineddata.gz'), path.join('lang', 'eng.traineddata.gz')]
];

let copied = 0;
for (const [from, to] of files) {
  const dest = path.join(out, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const fresh = fs.existsSync(dest) && fs.statSync(dest).size === fs.statSync(from).size;
  if (!fresh) { fs.copyFileSync(from, dest); copied++; }
}
console.log(`[ocr] ${files.length} reader files in public/ocr (${copied} updated)`);
