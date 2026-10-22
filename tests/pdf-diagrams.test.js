// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import jsPDF from 'jspdf';
import { drawVisualDiagram, pdfSafe } from '../src/utils/pdfDiagrams';
import { VISUAL_DIAGRAMS } from '../src/data/visualDiagrams';
import { cleanText, latexToText, cleanCodeLine } from '../src/utils/pdfGenerator';

// Draws each visual diagram into a real jsPDF document, the same way the course PDF does.
function draw(def) {
  const PDF = jsPDF.jsPDF || jsPDF;
  const doc = new PDF({ unit: 'mm', format: 'a4', compress: false });
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 25;
  let pages = 1;
  const ctx = {
    doc, margin: 15, contentWidth: 180, pageHeight,
    getY: () => y, setY: (v) => { y = v; },
    checkPageBreak: (h = 25) => { if (y + h > pageHeight - 20) { doc.addPage(); pages++; y = 25; return true; } return false; },
    renderCodeBox: (title, code) => { doc.text(String(title), 15, y); y += 4 + String(code).split('\n').length * 4.2 + 4; }
  };
  drawVisualDiagram(ctx, def);
  return { doc, y, pages, text: doc.output() };
}

describe('PDF diagrams', () => {
  it('spells out maths symbols instead of dropping them', () => {
    expect(pdfSafe('p ≥ 0.05 → reject H0')).toBe('p >= 0.05 -> reject H0');
    expect(pdfSafe('w = (Xᵀ X)⁻¹ Xᵀ y')).toBe('w = (X^T X)^-1 X^T y');
    expect(pdfSafe('x̄ ~ N(μ, σ / √n)')).toBe('x_bar ~ N(mu, sigma / sqrtn)');
    expect(pdfSafe('λ · Σ |wⱼ|')).toBe('lambda * Sum |w_j|');
  });

  it.each(Object.entries(VISUAL_DIAGRAMS))('%s draws into the PDF with all card titles', (id, def) => {
    const { y, pages, text } = draw(def);
    expect(y).toBeGreaterThan(30);
    expect(pages).toBeLessThan(8);
    const titles = def.sections.flatMap(s => [...(s.items || []), ...(s.steps || []), ...(s.type === 'compare' ? s.columns : []), ...((s.type === 'branches' ? s.columns : []).flatMap(c => c.cards))]).map(c => c.title);
    // jsPDF escapes ( ) and \ in its content stream; compare on a few plain words of each title.
    for (const t of titles) {
      const word = pdfSafe(t).split(/[^A-Za-z0-9]+/).find(w => w.length >= 4);
      if (word) expect(text, `${id}: ${t}`).toContain(word);
    }
  });
});

describe('PDF text cleaning', () => {
  it('turns LaTeX maths into readable text', () => {
    expect(latexToText(String.raw`\binom{n}{k} p^k (1-p)^{n-k}`)).toBe('C(n, k) p^k (1-p)^(n-k)');
    expect(latexToText(String.raw`\frac{\bar{x}_1 - \bar{x}_2}{\sqrt{s^2}}`)).toBe('(x_bar_1 - x_bar_2)/(sqrt(s^2))');
    expect(latexToText(String.raw`\mu_1 \neq \mu_2`)).toBe('mu_1 != mu_2');
    expect(cleanText(String.raw`Test $H_0: \mu = 0$ at $\alpha = 0.05$`)).toBe('Test H_0: mu = 0 at alpha = 0.05');
    expect(cleanText('Revenue rose from $300 to $500')).toBe('Revenue rose from $300 to $500');
    expect(cleanText('Models $k$ successes in $n$ trials; significant if $p < 0.05$ (or $0.01$)')).toBe('Models k successes in n trials; significant if p < 0.05 (or 0.01)');
  });

  it('keeps code indentation', () => {
    expect(cleanCodeLine('        return x  # done   ')).toBe('        return x  # done');
    expect(cleanCodeLine('\tif a ≥ b:')).toBe('    if a >= b:');
  });
});
