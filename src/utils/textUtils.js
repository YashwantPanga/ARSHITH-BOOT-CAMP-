export function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/ГÇö/g, ' - ')
    .replace(/ΓÇö/g, ' - ')
    .replace(/"Çö/g, ' - ')
    .replace(/Çö/g, ' - ')
    .replace(/â€”—/g, ' - ')
    .replace(/â€”/g, ' - ')
    .replace(/â€“/g, ' - ')
    .replace(/â€/g, '')
    .replace(/[\u2014\u2013\u2012\u2015]/g, ' - ')
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u00A0\u200B]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ -\s*- /g, ' - ')
    .trim();
}

/** "Module 03: NumPy Basics" -> "NumPy Basics" (the UI already shows the module number). */
export function moduleTitle(str) {
  return cleanText(str).replace(/^module\s*\d+\s*[:.\-]\s*/i, '');
}

const ACRONYMS = new Set(['AI', 'ML', 'DL', 'SQL', 'NLP', 'API', 'APIS', 'LLM', 'LLMS', 'UI', 'UX', 'CSS', 'HTML', 'JS', 'BI']);
const SMALL_WORDS = new Set(['and', 'or', 'with', 'of', 'the', 'for', 'in', 'to', 'a', 'an', 'on']);

/**
 * Display-only title casing for names stored in ALL CAPS (e.g. "AI WITH DATA SCIENCE" → "AI with Data Science").
 * The stored value is never changed; mixed-case titles are returned as they are.
 */
export function displayTitle(str) {
  const t = cleanText(str);
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length < 4 || letters !== letters.toUpperCase()) return t;
  return t.split(/\s+/).map((w, i) => {
    const bare = w.replace(/[^A-Za-z]/g, '');
    if (ACRONYMS.has(bare)) return w;
    const lower = w.toLowerCase();
    if (i > 0 && SMALL_WORDS.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}
