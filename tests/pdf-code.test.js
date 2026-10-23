// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import jsPDF from 'jspdf';
import { tokenizeLine, normLang, drawCodeCard, drawExplanationPanel } from '../src/utils/pdfCode';

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));

// Every code string in the course content (examples, exercises, tutorials, errors, projects...).
function allCode() {
  const out = [];
  const walk = (o, key = '') => {
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && /code|example|solution|starter|snippet/i.test(k) && v.includes('\n')) out.push({ key: `${key}.${k}`, code: v, lang: o.language || '' });
      else if (typeof v === 'object') walk(v, k);
    }
  };
  walk(db.courses);
  return out;
}

function makeCtx() {
  const PDF = jsPDF.jsPDF || jsPDF;
  const doc = new PDF({ unit: 'mm', format: 'a4', compress: false });
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 25;
  let pages = 1;
  return {
    doc, margin: 15, contentWidth: 180, pageHeight,
    getY: () => y, setY: (v) => { y = v; },
    checkPageBreak: (h = 25) => { if (y + h > pageHeight - 20) { doc.addPage(); pages++; y = 25; return true; } return false; },
    pages: () => pages
  };
}

describe('PDF code blocks', () => {
  it('colours Python keywords, strings, comments and numbers', () => {
    const { tokens } = tokenizeLine("def area(r):  # circle area", 'python');
    expect(tokens.find(t => t.t === 'def').kind).toBe('keyword');
    expect(tokens.find(t => t.t.startsWith('#')).kind).toBe('comment');
    const s = tokenizeLine("x = f'{n} items' + 3.5", 'python').tokens;
    expect(s.find(t => t.t.startsWith("f'")).kind).toBe('string');
    expect(s.find(t => t.t === '3.5').kind).toBe('number');
  });

  it('treats a bare @ as the matrix operator and @name as a decorator', () => {
    expect(tokenizeLine('y = X @ w', 'python').tokens.map(t => t.t).join('')).toBe('y = X @ w');
    expect(tokenizeLine('@property', 'python').tokens[0]).toEqual({ t: '@property', kind: 'builtin' });
  });

  it('keeps triple-quoted strings across lines', () => {
    const a = tokenizeLine('doc = """start', 'python');
    expect(a.state.triple).toBe('"""');
    const b = tokenizeLine('still inside """ + 1', 'python', a.state);
    expect(b.tokens[0].kind).toBe('string');
    expect(b.state.triple).toBeFalsy();
  });

  it('is case-insensitive for SQL keywords', () => {
    expect(tokenizeLine('select name from users', 'sql').tokens.filter(t => t.kind === 'keyword').map(t => t.t)).toEqual(['select', 'from']);
  });

  it('tokenises every code sample in every course without losing characters', () => {
    const samples = allCode();
    expect(samples.length).toBeGreaterThan(100);
    for (const { key, code, lang } of samples) {
      let state = {};
      for (const line of code.split('\n')) {
        const r = tokenizeLine(line, normLang(lang || 'python'), state);
        state = r.state;
        expect(r.tokens.map(t => t.t).join(''), key).toBe(line);
      }
    }
  });

  it('draws every code sample as a card that stays inside the page', () => {
    for (const { code, lang } of allCode().slice(0, 400)) {
      const ctx = makeCtx();
      drawCodeCard(ctx, { title: 'Example', code, language: lang || 'python' });
      expect(ctx.getY()).toBeLessThanOrEqual(ctx.pageHeight - 15);
    }
  });

  it('draws the explanation panel with line-by-line notes', () => {
    const ctx = makeCtx();
    drawExplanationPanel(ctx, { explanation: 'Builds a model.', lineByLine: [{ line: 'clf.fit(X, y)', explanation: 'Trains it.' }] });
    const text = ctx.doc.output();
    expect(text).toContain('HOW THIS CODE WORKS');
    expect(text).toContain('LINE BY LINE');
    expect(text).toContain('Trains it.');
  });
});
