import React, { useEffect, useState } from 'react';
import { SCRIPT_FONTS, TUTOR_LANGUAGES } from '../../../shared/tutor/languages.js';

// Shared pieces of the AI tutor: script fonts, text parsing, rich text and the device voice.

/* ------------------------------------------------------------------ */
/* Fonts: Noto for each Indian script, loaded only when needed         */
/* ------------------------------------------------------------------ */

const loadedFonts = new Set();
export function loadFont(family, text) {
  const id = text ? `${family}|names` : family;
  if (!family || loadedFonts.has(id) || typeof document === 'undefined') return;
  loadedFonts.add(id);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  // with `text`, Google sends only those letters (a few KB) - enough for the language names
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;600;700&display=swap${text ? `&text=${encodeURIComponent(text)}` : ''}`;
  document.head.appendChild(link);
}
/** Just the letters of the language names (and the launcher's cycling words), in each script's font. */
export function loadNameFonts() {
  const byFamily = {};
  for (const l of TUTOR_LANGUAGES) if (SCRIPT_FONTS[l.code]) byFamily[SCRIPT_FONTS[l.code]] = (byFamily[SCRIPT_FONTS[l.code]] || '') + l.native;
  Object.entries(byFamily).forEach(([family, chars]) => loadFont(family, chars));
}
export const NAME_STACK = `'Source Sans 3', ${[...new Set(Object.values(SCRIPT_FONTS))].map(f => `'${f}'`).join(', ')}, system-ui, sans-serif`;
export const scriptStack = (code) => (SCRIPT_FONTS[code] ? `'Source Sans 3', '${SCRIPT_FONTS[code]}', system-ui, sans-serif` : undefined);

/* ------------------------------------------------------------------ */
/* Text: split the explanation into blocks and speakable sentences    */
/* ------------------------------------------------------------------ */

export const SENTENCE_SPLIT = /(?<=[.!?।॥؟])\s+/u;
export const plain = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\s+/g, ' ').trim();

/**
 * Splits one answer into blocks (headings, paragraphs, bullets, code, check cards) and speakable
 * sentences. Sentence numbers start at `offset` so several answers share one voice queue. Answer
 * sentences of a check card carry `gate` (the card id): the voice waits there until it is revealed.
 */
export function parseAnswer(text, offset = 0, idPrefix = 'c') {
  const blocks = [];
  const units = [];
  let unit = offset;
  let checks = 0;
  const sentencesOf = (raw, gate) => raw.split(SENTENCE_SPLIT).map(x => x.trim()).filter(Boolean)
    .map(p => { const u = { i: unit++, raw: p, speak: plain(p), gate }; units.push(u); return u; });
  const addText = (type, raw) => { const sentences = sentencesOf(raw); if (sentences.length) blocks.push({ type, sentences }); };
  const lines = text.replace(/\r/g, '').split('\n');
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k];
    if (/^\s*\[\[CHECK\]\]/.test(line)) {
      const body = [];
      k++;
      while (k < lines.length && !/^\s*\[\[\/CHECK\]\]/.test(lines[k])) body.push(lines[k++]);
      const joined = body.join('\n');
      const q = (joined.match(/Q:\s*([\s\S]*?)(?=\n\s*A:|$)/) || [])[1]?.trim() || '';
      const a = (joined.match(/A:\s*([\s\S]*)$/) || [])[1]?.trim() || '';
      const id = `${idPrefix}${checks++}`;
      blocks.push({ type: 'check', id, q: sentencesOf(q.replace(/\s+/g, ' ')), a: sentencesOf(a.replace(/\s+/g, ' '), id) });
      continue;
    }
    if (/^```/.test(line.trim())) {
      const code = [];
      k++;
      while (k < lines.length && !/^```/.test(lines[k].trim())) code.push(lines[k++]);
      blocks.push({ type: 'code', code: code.join('\n') });
      continue;
    }
    if (!line.trim() || /^\s*\[\[\/?BOARD/.test(line)) continue; // boards show as plain notes here
    const note = line.match(/^\s*@\d+\s+(.*)/) || line.match(/^\s*>\s+(.*)/);
    if (note) { addText('li', note[1]); continue; }
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) { addText('h', h[1]); continue; }
    const li = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
    if (li) { addText('li', li[1]); continue; }
    let para = line; // join soft-wrapped paragraph lines
    while (k + 1 < lines.length && lines[k + 1].trim() && !/^(#{1,4}\s|\s*(?:[-*•]|\d+[.)])\s|```|\s*\[\[\/?CHECK\]\])/.test(lines[k + 1])) para += ` ${lines[++k]}`;
    addText('p', para);
  }
  return { blocks, units, next: unit };
}

export function Rich({ text }) {
  // **bold** and `code` inside a sentence
  const out = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`/g;
  let last = 0; let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(m[1] ? <strong key={m.index} className="font-semibold text-pine-950">{m[1]}</strong> : <code key={m.index} className="px-1 rounded bg-pine-100 text-pine-900 text-[0.9em]">{m[2]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ------------------------------------------------------------------ */
/* Voice                                                              */
/* ------------------------------------------------------------------ */

export const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
const NATURAL = /natural|neural|google|premium|enhanced|online|wavenet|siri/i;

export function pickVoice(voices, tag) {
  if (!tag) return null;
  const t = tag.toLowerCase();
  const base = t.split('-')[0];
  const norm = (v) => v.lang.replace('_', '-').toLowerCase();
  const exact = voices.filter(v => norm(v) === t);
  const same = exact.length ? exact : voices.filter(v => norm(v).split('-')[0] === base);
  if (!same.length) return null;
  return [...same].sort((a, b) => (NATURAL.test(b.name) - NATURAL.test(a.name)) || (a.localService - b.localService))[0];
}

export function useVoices() {
  const [voices, setVoices] = useState(() => synth?.getVoices() || []);
  useEffect(() => {
    if (!synth) return undefined;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener?.('voiceschanged', load);
    const t = setTimeout(load, 800); // some browsers fill the list late without the event
    return () => { synth.removeEventListener?.('voiceschanged', load); clearTimeout(t); };
  }, []);
  return voices;
}

