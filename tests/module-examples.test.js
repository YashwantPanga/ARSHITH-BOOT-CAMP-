import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { withLessons } from '../server/data/lessons/index.js';

// The stored module examples had lost their backslash escapes: a "\n" inside a string had become a real
// line break, which Python reports as an unterminated string. Every example served must be free of that.
const db = JSON.parse(fs.readFileSync(new URL('../server/data/db.json', import.meta.url), 'utf8'));

/** Line numbers where a single-line ('...' or "...") Python string contains a raw line break. */
function brokenStrings(code) {
  const lines = [];
  let quote = null;
  let line = 1;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch === '\n') line++;
    if (!quote) {
      if (ch === '#') { while (i + 1 < code.length && code[i + 1] !== '\n') i++; continue; }
      if (ch === '"' || ch === "'") {
        if (code.slice(i, i + 3) === ch.repeat(3)) { quote = ch.repeat(3); i += 2; } else quote = ch;
      }
      continue;
    }
    if (ch === '\\') { i++; continue; }
    if (quote.length === 3) {
      if (code.slice(i, i + 3) === quote) { quote = null; i += 2; }
      continue;
    }
    if (ch === quote) quote = null;
    else if (ch === '\n' || ch === '\r') { lines.push(line - (ch === '\n' ? 1 : 0)); quote = null; }
  }
  return lines;
}

describe('module code examples', () => {
  const served = db.courses.filter(c => ['python-programming', 'data-science-ai'].includes(c.id)).map(withLessons);

  it('have no line breaks inside single-line Python strings', () => {
    const bad = [];
    for (const course of served) {
      for (const mod of course.modules) {
        (mod.readingMaterial?.codeExamples || []).forEach((ex, i) => {
          const lines = brokenStrings(String(ex.code || ''));
          if (lines.length) bad.push(`${course.id}/${mod.id}/${i} (line ${lines[0]})`);
        });
      }
    }
    expect(bad).toEqual([]);
  });

  it('keep the regex escapes in the regular-expression lesson', () => {
    const mod = served.find(c => c.id === 'python-programming').modules.find(m => m.id === 'py-mod-12');
    const code = mod.readingMaterial.codeExamples.map(e => e.code).join('\n');
    expect(code).toContain(String.raw`r'^From: (\S+@\S+)'`);
    expect(code).toContain(String.raw`\d{1,3}(?:\.\d{1,3}){3}`);
    expect(code).toContain(String.raw`r'[;,:|\s]+'`);
  });
});
