import { mathToText } from './latexText';
import { cleanText } from './textUtils';

/**
 * Splits a section heading into a short title and an optional subtitle for the concept map:
 * "5 & 6. Classes vs. Objects: The Cookie Cutter Analogy" -> { title: "Classes vs. Objects", sub: "The Cookie Cutter Analogy" }.
 * Numbering prefixes ("1.", "5 & 6.", "7 to 13.") are dropped because the map numbers the cards itself.
 */
export function conceptLabel(heading) {
  const h = cleanText(heading).replace(/^\d+(?:\s*(?:&|to|-|and)\s*\d+)?\s*[.)]\s*/i, '');
  const i = h.indexOf(': ');
  return i > 3 && i < h.length - 4 ? { title: h.slice(0, i), sub: h.slice(i + 2) } : { title: h, sub: '' };
}

/**
 * One plain-language sentence that says what a concept is about, taken from the start of its
 * explanation. Markdown, code, tables and LaTeX are flattened to readable text.
 */
export function conceptSummary(text, max = 130) {
  const t = String(text || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/^#{1,6}.*$/gm, '')
    .replace(/^\s*\|.*$/gm, '');
  const flat = (p) => cleanText(mathToText(p
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')))
    .replace(/\\/g, '')
    .replace(/^•\s*/, '')
    .replace(/\s*•.*$/, '') // keep only the lead-in before an inline bullet list
    .replace(/\s*:$/, '.');
  // A usable summary is a real sentence, not a lead-in to a formula or list ("... calibrated if:").
  const ok = (x) => x.replace(/[^A-Za-z]/g, '').length > 25 && !/\b(if|where|is|as|by|that|follows|given|are|of|to)\.$/i.test(x);
  const paras = t.split(/\n\s*\n|\n(?=\s*(?:[-*•]|\d+[.)])\s)/).map(p => p.trim()).filter(Boolean);
  let s = paras.map(flat).find(ok) || paras.map(flat).find(x => x.length > 10) || '';
  // first sentence end that is not an abbreviation such as "e.g." or "vs."
  const end = [...s.matchAll(/[.!?](?=\s|$)/g)].find(m => m.index >= 29 && !/\b(?:e\.g|i\.e|vs|etc|approx|Dr|Mr|Ms)$/i.test(s.slice(0, m.index)));
  if (end && end.index < max) s = s.slice(0, end.index + 1);
  if (s.length > max) s = `${s.slice(0, max).replace(/[\s,;:(]+\S*$/, '')}…`;
  return s;
}

/** Splits theory Markdown into { heading, body } blocks at its ##/###/#### headings. */
export function markdownConcepts(md) {
  const out = [];
  const src = String(md || '');
  // headings inside code fences or $$ maths are not headings (the Markdown renderer skips them too)
  const masked = src.replace(/```[\s\S]*?```|\$\$[\s\S]*?\$\$/g, m => m.replace(/[^\n]/g, ' '));
  const marks = [...masked.matchAll(/^#{2,4}\s+(.+)$/gm)].map(m => ({ index: m.index, 0: src.slice(m.index, m.index + m[0].length), 1: src.slice(m.index, m.index + m[0].length).replace(/^#+\s+/, '') }));
  marks.forEach((m, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
    out.push({ heading: m[1], body: src.slice(m.index + m[0].length, end) });
  });
  return out;
}
