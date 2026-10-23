// ID card check for the final assessment: reads the text on a photo ID in the browser (OCR) and
// checks that the student's registered name is printed on it. The image never leaves the device;
// only the outcome (matched or not, and how much of the name was found) is submitted.

const norm = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')   // drop accents
  .toUpperCase().replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** Edit distance between two short words. */
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/** OCR misreads a letter or two; longer words may differ by more. */
const close = (want, got) => {
  if (want === got) return true;
  if (want.length <= 3) return false;
  return lev(want, got) <= (want.length >= 8 ? 2 : 1);
};

/**
 * Does the ID text contain the registered name?
 * Every name part of 2+ letters must be found (with small OCR slips allowed). A one-letter
 * initial on either side counts for the matching part (e.g. "P YASHWANT" for "Panga Yashwant").
 * Returns { matched, found, total, percent, missing }.
 */
export function matchNameInText(registeredName, text) {
  const parts = norm(registeredName).split(' ').filter(Boolean);
  const words = norm(text).split(' ').filter(Boolean);
  // also try neighbouring words glued together - OCR sometimes splits a name ("YASH WANT")
  const glued = words.slice(0, -1).map((w, i) => w + words[i + 1]);
  const pool = [...words, ...glued];
  const initials = new Set(words.filter(w => w.length === 1));
  const missing = [];
  let found = 0;
  for (const p of parts) {
    const ok = p.length === 1
      ? words.some(w => w[0] === p)
      : pool.some(w => close(p, w));
    if (ok) found += 1; else missing.push(p);
  }
  // allow the surname or given name to appear only as an initial on the card
  const initialOk = missing.length === 1 && parts.length >= 2 && initials.has(missing[0][0]);
  const total = parts.length || 1;
  const effective = found + (initialOk ? 1 : 0);
  return {
    matched: parts.length > 0 && effective === parts.length,
    found: effective,
    total,
    percent: Math.round((effective / total) * 100),
    missing: initialOk ? [] : missing
  };
}

let workerPromise = null;
/** Starts the OCR engine once (English). */
export function loadOcr() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) => createWorker('eng'));
    workerPromise.catch(() => { workerPromise = null; });
  }
  return workerPromise;
}

/** Grey, contrast-stretched, enlarged copy of an image/video frame - OCR reads small print far better this way. */
function prepare(source) {
  const w = source.videoWidth || source.naturalWidth || source.width;
  const h = source.videoHeight || source.naturalHeight || source.height;
  const scale = Math.min(3, Math.max(1, 1800 / Math.max(w, h)));
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const px = img.data;
  let lo = 255, hi = 0;
  for (let i = 0; i < px.length; i += 4) {
    const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = g;
    if (g < lo) lo = g; if (g > hi) hi = g;
  }
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < px.length; i += 4) {
    const v = ((px[i] - lo) / range) * 255;
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Reads an ID card from a video frame or an uploaded image and checks the registered name.
 * Returns { matched, percent, found, total, missing, text }.
 */
export async function checkIdName(source, registeredName) {
  const worker = await loadOcr();
  const { data } = await worker.recognize(prepare(source));
  const text = data?.text || '';
  return { ...matchNameInText(registeredName, text), text };
}
