// ID card check for the final assessment: reads the text on a photo ID in the browser (OCR) and
// checks that the student's registered name is printed on it. The image never leaves the device;
// only the outcome (matched or not, and how much of the name was found) is submitted.

// Letters OCR commonly reads as digits on ID print (0/O, 1/I, 5/S, 8/B, 4/A, 6/G).
const DIGIT_AS_LETTER = { 0: 'O', 1: 'I', 5: 'S', 8: 'B', 4: 'A', 6: 'G' };
/** OCR text with digits glued to letters read as those letters ("Y4SHWANT" -> "YASHWANT"); plain numbers stay numbers. */
const fixDigits = (t) => String(t || '').replace(/[A-Za-z0-9]+/g, (w) => (/[A-Za-z]/.test(w) ? w.replace(/[014568]/g, d => DIGIT_AS_LETTER[d]) : w));

const norm = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')   // drop accents
  .toUpperCase().replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();

/** The registered name split into the parts that are looked for on the card (capitals). */
export const nameParts = (name) => norm(name).split(' ').filter(Boolean);

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
  const words = norm(fixDigits(text)).split(' ').filter(Boolean);
  // also try neighbouring words glued together - OCR sometimes splits a name ("YASH WANT", "YA SH WANT")
  const glued = words.slice(0, -1).map((w, i) => w + words[i + 1]);
  const glued3 = words.slice(0, -2).map((w, i) => w + words[i + 1] + words[i + 2]);
  // and the usual letter-shape slips: VV for W, RN for M
  const variants = (w) => [w, w.replace(/VV/g, 'W'), w.replace(/RN/g, 'M')];
  const pool = [...new Set([...words, ...glued, ...glued3].flatMap(variants))];
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

/** True when a script file could not be loaded because the site was updated after this page opened. */
export const isStaleBuildError = (err) => /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch/i.test(String(err?.message || err));

// Readers working side by side: two on machines with 4+ cores, so two camera frames are read at once.
export const OCR_READERS = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 2) >= 4 ? 2 : 1;
const NAME_PARAMS = {
  tessedit_pageseg_mode: '11',            // sparse text: ID cards are short scattered lines
  preserve_interword_spaces: '1',
  // names only: reading just letters is faster and stops "O" turning into "0" and similar
  tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .-'
};

// The reader's files are served by this site (public/ocr, copied at build time) - much faster than
// fetching them from a CDN while the proctoring models also download.
const LOCAL_FILES = { workerPath: '/ocr/worker.min.js', corePath: '/ocr/core', langPath: '/ocr/lang' };

// Loading progress (0-1) for the first-time download of the reader, for the identity step to show.
const progressListeners = new Set();
export const onOcrProgress = (fn) => { progressListeners.add(fn); return () => progressListeners.delete(fn); };
const logger = (m) => {
  if (m?.status && typeof m.progress === 'number' && /load|initializ/i.test(m.status)) progressListeners.forEach(fn => fn(m.progress, m.status));
};

let workerPromise = null;
/** Starts the OCR engine once (English); resolves to a scheduler with OCR_READERS workers. */
export function loadOcr() {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').catch((err) => {
      if (isStaleBuildError(err)) {
        const e = new Error('The website was updated while this page was open. Reload the page, then scan your ID again.');
        e.stale = true;
        throw e;
      }
      throw err;
    }).then(async (T) => {
      const make = async (opts) => {
        const w = await T.createWorker('eng', 1, opts);
        await w.setParameters(NAME_PARAMS);
        return w;
      };
      // measured: the default model with letters-only reading is the quickest accurate setup
      let files = { ...LOCAL_FILES, logger };
      let first;
      try { first = await make(files); } catch { files = { logger }; first = await make(files); } // CDN fallback
      progressListeners.forEach(fn => fn(1, 'ready'));
      const scheduler = T.createScheduler();
      scheduler.addWorker(first);
      // the second reader joins in the background, so reading can start straight away
      for (let i = 1; i < OCR_READERS; i++) make(files).then(w => scheduler.addWorker(w)).catch(() => {});
      return scheduler;
    });
    workerPromise.catch(() => { workerPromise = null; });
  }
  return workerPromise;
}

/** Text read from one image or camera frame. attempt alternates grey / black-and-white processing. */
export async function readIdText(source, { crop = null, attempt = 0 } = {}) {
  const scheduler = await loadOcr();
  const { data } = await scheduler.addJob('recognize', prepare(source, { crop, binary: attempt % 2 === 1 }), {}, { text: true, blocks: false, hocr: false, tsv: false });
  return data?.text || '';
}

/**
 * Grey, contrast-stretched, enlarged copy of an image/video frame - OCR reads small print far better
 * this way. crop (fractions of the frame) limits it to the on-screen card outline, which is faster
 * and keeps background text out. binary turns it into black-and-white text (helps with glare and
 * coloured card backgrounds); attempts alternate between the two.
 */
function prepare(source, { crop = null, binary = false } = {}) {
  const fw = source.videoWidth || source.naturalWidth || source.width;
  const fh = source.videoHeight || source.naturalHeight || source.height;
  const sx = crop ? Math.round(fw * crop.x) : 0, sy = crop ? Math.round(fh * crop.y) : 0;
  const w = crop ? Math.round(fw * crop.w) : fw, h = crop ? Math.round(fh * crop.h) : fh;
  // enlarge only small pictures: bigger images cost time without reading names better
  const scale = Math.min(2, Math.max(1, 1000 / Math.max(w, h)));
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, sx, sy, w, h, 0, 0, c.width, c.height);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const px = img.data;
  let lo = 255, hi = 0;
  for (let i = 0; i < px.length; i += 4) {
    const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = g;
    if (g < lo) lo = g; if (g > hi) hi = g;
  }
  const range = Math.max(1, hi - lo);
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) {
    const v = ((px[i] - lo) / range) * 255;
    px[i] = px[i + 1] = px[i + 2] = v;
    sum += v;
  }
  if (binary) {
    // light text on a dark card is inverted first, so the threshold always yields dark text on white
    const mean = sum / (px.length / 4);
    const invert = mean < 110;
    const cut = invert ? 255 - mean * 0.9 : mean * 0.9;
    for (let i = 0; i < px.length; i += 4) {
      const v = invert ? 255 - px[i] : px[i];
      px[i] = px[i + 1] = px[i + 2] = v < cut ? 0 : 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Reads an ID card from a video frame or an uploaded image and checks the registered name.
 * Letter case never matters: both sides are compared in capitals.
 * Returns { matched, percent, found, total, missing, text }.
 */
export async function checkIdName(source, registeredName, { crop = null, attempt = 0 } = {}) {
  const text = await readIdText(source, { crop, attempt });
  return { ...matchNameInText(registeredName, text), text };
}
