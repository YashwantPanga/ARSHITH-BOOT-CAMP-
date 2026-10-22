// Draws the lesson diagrams into the course PDF so the PDF matches the website:
//  - visual diagrams (src/data/visualDiagrams.js) as native vector cards, arrows, loops and tables;
//  - workflow diagrams as an image of the exact same SVG drawing the website shows.
// Nothing here is interactive, so the "technical detail" of each card is printed under it.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DiagramSvg, layoutDiagram } from '../components/lesson/WorkflowDiagram';
import { cleanText } from './pdfGenerator';

// jsPDF's built-in fonts only cover plain ASCII, so maths symbols are spelled out instead of dropped.
const SYMBOLS = [
  [/≥/g, '>='], [/≤/g, '<='], [/≠/g, '!='], [/→/g, '->'], [/←/g, '<-'], [/↺/g, 'back to'], [/·/g, '*'], [/×/g, 'x'],
  [/−/g, '-'], [/…/g, '...'], [/μ/g, 'mu'], [/σ/g, 'sigma'], [/Σ/g, 'Sum'], [/Π/g, 'Prod'], [/λ/g, 'lambda'],
  [/α/g, 'alpha'], [/χ/g, 'chi'], [/√/g, 'sqrt'], [/²/g, '^2'], [/ᵀ/g, '^T'], [/⁻¹/g, '^-1'], [/ŷ/g, 'y_hat'],
  [/x̄/g, 'x_bar'], [/∝/g, '~'], [/₂/g, '_2'], [/₁/g, '_1'], [/ₖ/g, '_k'], [/ᵢ/g, '_i'], [/ⱼ/g, '_j'], [/‖/g, '||'],
  [/ε/g, 'eps'], [/θ/g, 'theta'], [/β/g, 'beta'], [/∈/g, ' in '], [/✓/g, 'v']
];
export const pdfSafe = (s) => cleanText(SYMBOLS.reduce((t, [re, r]) => t.replace(re, r), String(s ?? '')));

// [fill, border, accent, title] — same palette as the website cards.
const TONES = {
  blue:   [[240, 249, 255], [186, 230, 253], [3, 105, 161],  [12, 74, 110]],
  green:  [[236, 253, 245], [167, 243, 208], [4, 120, 87],   [6, 78, 59]],
  purple: [[245, 243, 255], [221, 214, 254], [109, 40, 217], [76, 29, 149]],
  orange: [[255, 251, 235], [253, 230, 138], [180, 83, 9],   [120, 53, 15]],
  teal:   [[240, 253, 250], [153, 246, 228], [15, 118, 110], [19, 78, 74]],
  rose:   [[255, 241, 242], [254, 205, 211], [190, 18, 60],  [136, 19, 55]],
  slate:  [[255, 255, 255], [228, 224, 215], [71, 66, 59],   [48, 43, 37]]
};
const ORDER = ['blue', 'green', 'purple', 'orange', 'teal', 'rose'];
const toneOf = (name, i = 0) => TONES[name] || TONES[ORDER[i % ORDER.length]];
const LH = (pt) => pt * 0.3528 * 1.28; // line height in mm for a font size in pt
const INK = [48, 43, 37];
const MUTED = [122, 116, 106];
const SAGE = [66, 101, 87];
const FOREST = [1, 58, 43];

/** Measures a card and returns its height plus a draw(x, y) function. */
function card(doc, node, w, n, tone, opts = {}) {
  const pad = 3;
  const badge = n !== undefined && n !== null && n !== '';
  const tx = pad + (badge ? 7 : 0);
  const innerW = w - tx - pad;
  const fullW = w - pad * 2;
  const parts = [];
  const add = (text, size, style, color, width = innerW, font = 'helvetica', indent = 0) => {
    if (!text) return;
    doc.setFont(font, style); doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width - indent);
    parts.push({ lines, size, style, color, font, indent, x: width === innerW ? tx : pad });
  };
  add(pdfSafe(node.title), opts.compact ? 8 : 8.8, 'bold', tone[3]);
  add(pdfSafe(node.subtitle), 7.2, 'normal', MUTED);
  if (node.text) add(pdfSafe(node.text), 7.6, 'normal', INK, fullW);
  (node.items || []).forEach(it => add(`-  ${pdfSafe(it)}`, 7.4, 'normal', INK, fullW, 'helvetica', 2));
  if (node.tags?.length) add(node.tags.map(pdfSafe).join('   |   '), 7, 'bold', tone[2], fullW);
  const details = Array.isArray(node.details) ? node.details : node.details ? [node.details] : [];
  details.forEach(d => add(pdfSafe(d), 6.9, 'normal', SAGE, fullW, 'courier'));

  let h = pad + 1;
  parts.forEach((p, i) => { h += p.lines.length * LH(p.size) + (i === 0 ? 0.6 : 0.9); });
  h = Math.max(h + pad - 1, badge ? 12 : 9);

  const draw = (x, y) => {
    doc.setFillColor(...tone[0]); doc.setDrawColor(...tone[1]); doc.setLineWidth(0.35);
    doc.roundedRect(x, y, w, h, 2.2, 2.2, 'FD');
    if (badge) {
      doc.setFillColor(...tone[2]); doc.circle(x + pad + 2.7, y + pad + 2.7, 2.7, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255);
      doc.text(String(n), x + pad + 2.7, y + pad + 3.75, { align: 'center' });
    }
    let cy = y + pad + 1;
    parts.forEach((p, i) => {
      doc.setFont(p.font, p.style); doc.setFontSize(p.size); doc.setTextColor(...p.color);
      p.lines.forEach(line => { cy += LH(p.size); doc.text(line, x + p.x + p.indent, cy - LH(p.size) * 0.22); });
      cy += i === 0 ? 0.6 : 0.9;
    });
  };
  return { h, draw };
}

function arrowDown(doc, x, y, len = 4, color = [95, 133, 116]) {
  doc.setDrawColor(...color); doc.setFillColor(...color); doc.setLineWidth(0.45);
  doc.line(x, y, x, y + len - 1.4);
  doc.triangle(x - 1.3, y + len - 1.6, x + 1.3, y + len - 1.6, x, y + len, 'F');
}
function arrowRight(doc, x, y, len = 4, color = [95, 133, 116]) {
  doc.setDrawColor(...color); doc.setFillColor(...color); doc.setLineWidth(0.45);
  doc.line(x, y, x + len - 1.4, y);
  doc.triangle(x + len - 1.6, y - 1.3, x + len - 1.6, y + 1.3, x + len, y, 'F');
}

/**
 * Draws a visual diagram definition. `ctx` gives access to the PDF state of generateCoursePDF:
 * { doc, margin, contentWidth, getY, setY, checkPageBreak, renderCodeBox }.
 */
export function drawVisualDiagram(ctx, def) {
  const { doc, margin: m, contentWidth: cw, checkPageBreak } = ctx;
  let y = ctx.getY();
  const sync = () => ctx.setY(y);
  const need = (h) => { sync(); if (checkPageBreak(h)) y = ctx.getY(); };

  // Title
  need(16);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...FOREST);
  doc.splitTextToSize(pdfSafe(def.title), cw).forEach(l => { doc.text(l, m, y); y += LH(10.5); });
  if (def.subtitle) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8.2); doc.setTextColor(...MUTED);
    doc.splitTextToSize(pdfSafe(def.subtitle), cw).forEach(l => { doc.text(l, m, y); y += LH(8.2); });
  }
  y += 2;

  const rowOfCards = (cards, xs, rowGapAfter = 0) => {
    const hMax = Math.max(...cards.map(c => c?.h || 0));
    need(hMax + 2);
    cards.forEach((c, i) => c && c.draw(xs[i], y));
    const top = y;
    y += hMax + rowGapAfter;
    return { top, hMax };
  };

  def.sections.forEach((s, si) => {
    // Section heading
    need(14);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.2); doc.setTextColor(...SAGE);
    const head = `${def.sections.length > 1 ? String(si + 1).padStart(2, '0') + '  ' : ''}${pdfSafe(s.title || '').toUpperCase()}`;
    if (head.trim()) { doc.text(head, m, y); y += LH(8.2) + 0.5; }
    if (s.text) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...MUTED);
      doc.splitTextToSize(pdfSafe(s.text), cw).forEach(l => { need(5); doc.text(l, m, y); y += LH(7.8); });
    }
    y += 1.5;

    if (s.type === 'layers') {
      s.items.forEach((it, i) => {
        const ind = Math.min(i * 5, 20);
        const c = card(doc, it, cw - ind, it.n ?? i + 1, toneOf(it.tone, i));
        need(c.h + 6);
        c.draw(m + ind, y); y += c.h;
        if (i < s.items.length - 1) { arrowDown(doc, m + ind + 10, y + 0.5); y += 5; }
      });
    }

    if (s.type === 'flow') {
      const steps = s.steps;
      const row = (s.direction || (steps.length <= 4 ? 'row' : 'column')) === 'row' && steps.length <= 4;
      if (row) {
        const gap = 6;
        const w = (cw - gap * (steps.length - 1)) / steps.length;
        const cards = steps.map((st, i) => card(doc, st, w, st.n ?? i + 1, toneOf(st.tone, i), { compact: true }));
        const { top, hMax } = rowOfCards(cards, steps.map((_, i) => m + i * (w + gap)));
        steps.forEach((_, i) => { if (i < steps.length - 1) arrowRight(doc, m + (i + 1) * w + i * gap + 0.8, top + hMax / 2, gap - 1.6); });
      } else {
        steps.forEach((st, i) => {
          const c = card(doc, st, cw, st.n ?? i + 1, toneOf(st.tone, i));
          need(c.h + 6);
          c.draw(m, y); y += c.h;
          if (i < steps.length - 1) { arrowDown(doc, m + 10, y + 0.5); y += 5; }
        });
      }
      if (s.loops?.length) {
        y += 2.5;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.4);
        const lines = s.loops.flatMap(l => doc.splitTextToSize(`${pdfSafe(l.from)}  loops back to  ${pdfSafe(l.to)}${l.label ? '  -  ' + pdfSafe(l.label) : ''}`, cw - 8));
        const h = 7 + lines.length * LH(7.4) + 2;
        need(h + 2);
        doc.setDrawColor(144, 177, 162); doc.setLineWidth(0.35); doc.setLineDashPattern([1.2, 1], 0);
        doc.setFillColor(255, 255, 255); doc.roundedRect(m, y, cw, h, 2, 2, 'FD');
        doc.setLineDashPattern([], 0);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...SAGE);
        doc.text('FEEDBACK LOOPS', m + 4, y + 4.6);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.4); doc.setTextColor(...INK);
        lines.forEach((l, i) => doc.text(l, m + 4, y + 8.4 + i * LH(7.4)));
        y += h;
      }
    }

    if (s.type === 'compare') {
      const cols = s.columns.length <= 3 ? s.columns.length : 2;
      const gap = 4;
      const w = (cw - gap * (cols - 1)) / cols;
      for (let r = 0; r < s.columns.length; r += cols) {
        const slice = s.columns.slice(r, r + cols);
        const cards = slice.map((c, i) => card(doc, c, w, c.n, toneOf(c.tone, r + i)));
        rowOfCards(cards, slice.map((_, i) => m + i * (w + gap)), 3);
      }
      y -= 3;
    }

    if (s.type === 'branches') {
      if (s.source) {
        const sw = cw * 0.7;
        const c = card(doc, s.source, sw, undefined, TONES.slate);
        need(c.h + 6);
        c.draw(m + (cw - sw) / 2, y); y += c.h;
        arrowDown(doc, m + cw / 2, y + 0.5); y += 5;
      }
      const k = s.columns.length;
      const gap = 4;
      const w = (cw - gap * (k - 1)) / k;
      const xs = s.columns.map((_, i) => m + i * (w + gap));
      need(10);
      s.columns.forEach((c, i) => {
        if (!c.title) return;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...toneOf(c.tone, i)[3]);
        doc.text(doc.splitTextToSize(pdfSafe(c.title).toUpperCase(), w)[0], xs[i], y + 2);
      });
      y += 4.5;
      const depth = Math.max(...s.columns.map(c => c.cards.length));
      for (let r = 0; r < depth; r++) {
        const cards = s.columns.map((c, i) => (c.cards[r] ? card(doc, c.cards[r], w, c.cards[r].n, toneOf(c.tone, i), { compact: true }) : null));
        const { top } = rowOfCards(cards, xs);
        if (r < depth - 1) {
          s.columns.forEach((c, i) => { if (c.cards[r + 1] && cards[i]) arrowDown(doc, xs[i] + w / 2, top + cards[i].h + 0.5, 4); });
          y += 5;
        }
      }
      if (s.merge) {
        y += 1;
        arrowDown(doc, m + cw / 2, y); y += 5;
        const mw = cw * 0.75;
        const c = card(doc, s.merge, mw, undefined, TONES.slate);
        need(c.h + 2);
        c.draw(m + (cw - mw) / 2, y); y += c.h;
      }
    }

    if (s.type === 'table') {
      const n = s.head.length;
      const firstW = cw * 0.26;
      const restW = (cw - firstW) / (n - 1);
      const widths = s.head.map((_, i) => (i === 0 ? firstW : restW));
      const drawRow = (cells, header) => {
        doc.setFont('helvetica', header ? 'bold' : 'normal'); doc.setFontSize(7.6);
        const wrapped = cells.map((c, i) => doc.splitTextToSize(pdfSafe(c), widths[i] - 4));
        const h = Math.max(...wrapped.map(l => l.length)) * LH(7.6) + 3.6;
        need(h + 1);
        let x = m;
        if (header) { doc.setFillColor(239, 244, 241); doc.rect(m, y, cw, h, 'F'); }
        doc.setDrawColor(228, 224, 215); doc.setLineWidth(0.25); doc.line(m, y + h, m + cw, y + h);
        wrapped.forEach((lines, i) => {
          doc.setFont('helvetica', header || i === 0 ? 'bold' : 'normal'); doc.setTextColor(...(header ? FOREST : INK));
          lines.forEach((l, k) => doc.text(l, x + 2, y + 2.6 + LH(7.6) * (k + 0.75)));
          x += widths[i];
        });
        y += h;
      };
      drawRow(s.head, true);
      s.rows.forEach(r => drawRow(r, false));
    }

    if (s.type === 'code') {
      sync();
      ctx.renderCodeBox(s.label || s.title, s.code, 'python');
      y = ctx.getY() - 4;
    }

    y += 3;
    if (si < def.sections.length - 1) { need(10); arrowDown(doc, m + cw / 2, y - 1, 5, [66, 101, 87]); y += 9; }
  });

  if (def.note) {
    y += 1;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.8); doc.setTextColor(...MUTED);
    doc.splitTextToSize(`Note: ${pdfSafe(def.note)}`, cw).forEach(l => { need(5); doc.text(l, m, y); y += LH(7.8); });
  }
  y += 3;
  sync();
}

/* ------------------------------------------------------------------ workflow image */

/** Renders a workflow definition to a PNG (data URL) using the website's own SVG drawing. */
export async function workflowToPng(def, scale = 2.5) {
  const L = layoutDiagram(def);
  const markup = renderToStaticMarkup(React.createElement(DiagramSvg, { def, L }));
  const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', String(L.width));
  svg.setAttribute('height', String(L.height));
  svg.removeAttribute('style');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(L.width * scale);
    canvas.height = Math.round(L.height * scale);
    const g = canvas.getContext('2d');
    g.fillStyle = '#F7F8F6';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/png'), width: L.width, height: L.height, steps: [...L.nodes].sort((a, b) => a.step - b.step) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Places a rendered workflow (from workflowToPng) with its title and a numbered stage list. */
export function drawWorkflow(ctx, def, png) {
  const { doc, margin: m, contentWidth: cw, pageHeight, checkPageBreak } = ctx;
  let y = ctx.getY();
  const need = (h) => { ctx.setY(y); if (checkPageBreak(h)) y = ctx.getY(); };

  const maxH = pageHeight - 50;
  let w = Math.min(cw, png.width * 0.2);
  let h = (w * png.height) / png.width;
  if (h > maxH) { h = maxH; w = (h * png.width) / png.height; }

  need(h + 14);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.6); doc.setTextColor(...SAGE);
  doc.text('WORKFLOW', m, y); y += LH(7.6);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...FOREST);
  doc.text(pdfSafe(def.title || 'Workflow'), m, y); y += 3;
  doc.setFillColor(247, 248, 246); doc.setDrawColor(228, 224, 215); doc.setLineWidth(0.3);
  doc.roundedRect(m, y, cw, h + 6, 3, 3, 'FD');
  doc.addImage(png.dataUrl, 'PNG', m + (cw - w) / 2, y + 3, w, h, undefined, 'FAST');
  y += h + 9;

  if (def.caption) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.8); doc.setTextColor(...MUTED);
    doc.splitTextToSize(pdfSafe(def.caption), cw).forEach(l => { need(5); doc.text(l, m, y); y += LH(7.8); });
    y += 1;
  }
  // Stage list (same numbers as the drawing)
  png.steps.forEach(n => {
    const text = `${n.step}.  ${pdfSafe(n.label)}${n.detail ? '  -  ' + pdfSafe(n.detail) : ''}`;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6); doc.setTextColor(...INK);
    doc.splitTextToSize(text, cw - 4).forEach((l, i) => { need(5); doc.text(l, m + (i ? 6 : 2), y); y += LH(7.6); });
  });
  y += 4;
  ctx.setY(y);
}
