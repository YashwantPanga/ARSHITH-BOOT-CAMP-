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
