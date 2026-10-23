// Draws the lesson diagrams into the course PDF so the PDF matches the website, designed for print:
//  - every diagram is a numbered figure (eyebrow "FIGURE 4.1", title, subtitle, framed panel, caption);
//  - workflow diagrams are drawn as vector shapes with the website's own layout and arrow routing,
//    followed by a step table;
//  - visual architecture diagrams (src/data/visualDiagrams.js) are white cards with a coloured accent
//    edge, numbered badges, tag chips and a light "technical detail" box (the PDF cannot be clicked).
import { layoutDiagram, routeEdges } from '../components/lesson/WorkflowDiagram';
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

// [tint, border, accent, title ink] — same palette as the website cards.
const TONES = {
  blue:   [[240, 249, 255], [186, 230, 253], [3, 105, 161],  [12, 74, 110]],
  green:  [[236, 253, 245], [167, 243, 208], [4, 120, 87],   [6, 78, 59]],
  purple: [[245, 243, 255], [221, 214, 254], [109, 40, 217], [76, 29, 149]],
  orange: [[255, 251, 235], [253, 230, 138], [180, 83, 9],   [120, 53, 15]],
  teal:   [[240, 253, 250], [153, 246, 228], [15, 118, 110], [19, 78, 74]],
  rose:   [[255, 241, 242], [254, 205, 211], [190, 18, 60],  [136, 19, 55]],
  slate:  [[248, 247, 244], [228, 224, 215], [71, 66, 59],   [48, 43, 37]]
};
const ORDER = ['blue', 'green', 'purple', 'orange', 'teal', 'rose'];
const toneOf = (name, i = 0) => TONES[name] || TONES[ORDER[i % ORDER.length]];
const LH = (pt) => pt * 0.3528 * 1.32; // line height in mm for a font size in pt
const INK = [48, 43, 37];
const MUTED = [122, 116, 106];
const SAGE = [66, 101, 87];
const FOREST = [1, 58, 43];
const LINE = [228, 224, 215];
const ARROW = [47, 93, 78];
const HALO = [205, 223, 213];

/* ------------------------------------------------------------------ shared figure parts */

/** Height of a figure heading (eyebrow + title + subtitle) for a given width. */
function measureFigureHead(doc, { title, subtitle }, w) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.6);
  const t = doc.splitTextToSize(pdfSafe(title || ''), w);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2);
  const s = subtitle ? doc.splitTextToSize(pdfSafe(subtitle), w) : [];
  return { t, s, h: 4.2 + t.length * LH(10.6) + (s.length ? s.length * LH(8.2) + 0.6 : 0) + 2.6 };
}
function drawFigureHead(doc, x, y, head, label) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(...SAGE);
  doc.text(label.toUpperCase(), x, y + 2.6);
  doc.setDrawColor(...SAGE); doc.setLineWidth(0.3);
  doc.line(x + doc.getTextWidth(label.toUpperCase()) + 2, y + 1.7, x + doc.getTextWidth(label.toUpperCase()) + 10, y + 1.7);
  let cy = y + 4.2;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.6); doc.setTextColor(...FOREST);
  head.t.forEach(l => { cy += LH(10.6); doc.text(l, x, cy - LH(10.6) * 0.25); });
  if (head.s.length) {
    cy += 0.6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2); doc.setTextColor(...MUTED);
    head.s.forEach(l => { cy += LH(8.2); doc.text(l, x, cy - LH(8.2) * 0.25); });
  }
}
function drawCaption(ctx, text, need) {
  const { doc, margin: m, contentWidth: cw } = ctx;
  if (!text) return;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8);
  const lines = doc.splitTextToSize(pdfSafe(text), cw - 9);
  need(lines.length * LH(7.8) + 3);
  let y = ctx.getY();
  doc.setFillColor(...SAGE); doc.circle(m + 1.6, y + 1.4, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6); doc.setTextColor(255, 255, 255);
  doc.text('i', m + 1.6, y + 2.25, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...MUTED);
  lines.forEach((l, k) => doc.text(l, m + 5, y + 2.4 + k * LH(7.8)));
  ctx.setY(y + lines.length * LH(7.8) + 2.5);
}

/* 3D rectangular blocks: a flat front face plus a shaded right side and bottom edge, lit from the
   top-left. Shading is mixed from the block's own colours so every tone keeps its identity. */
const DEPTH = 1.6;
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function prism(doc, x, y, w, h, { face, edge, accent, depth = DEPTH }) {
  const side = mix(face, accent, 0.55);
  const bottom = mix(face, accent, 0.32);
  // right side
  doc.setFillColor(...side);
  doc.lines([[depth, depth], [0, h], [-depth, -depth]], x + w, y, [1, 1], 'F', true);
  // bottom edge
  doc.setFillColor(...bottom);
  doc.lines([[w, 0], [depth, depth], [-w, 0]], x, y + h, [1, 1], 'F', true);
  // front face
  doc.setFillColor(...face); doc.setDrawColor(...edge); doc.setLineWidth(0.3);
  doc.rect(x, y, w, h, 'FD');
  // crisp edges where the faces meet
  doc.setDrawColor(...mix(accent, [0, 0, 0], 0.1)); doc.setLineWidth(0.15);
  doc.line(x + w, y, x + w + depth, y + depth);
  doc.line(x + w, y + h, x + w + depth, y + h + depth);
  doc.line(x, y + h, x + depth, y + h + depth);
}

/* Bold connectors: a soft halo, a thick round-capped shaft and a solid swept arrowhead. */
function boldLine(doc, x1, y1, x2, y2, color = ARROW) {
  doc.setLineCap('round');
  doc.setDrawColor(...HALO); doc.setLineWidth(1.5); doc.line(x1, y1, x2, y2);
  doc.setDrawColor(...color); doc.setLineWidth(0.75); doc.line(x1, y1, x2, y2);
  doc.setLineCap('butt');
}
function headAt(doc, tipX, tipY, dx, dy, color = ARROW, len = 2.5, half = 1.45) {
  const bx = tipX - dx * len; const by = tipY - dy * len;
  const nx = tipX - dx * len * 0.62; const ny = tipY - dy * len * 0.62; // notch for a swept look
  doc.setFillColor(...color);
  doc.lines([[bx - dy * half - tipX, by + dx * half - tipY], [nx - (bx - dy * half), ny - (by + dx * half)], [bx + dy * half - nx, by - dx * half - ny]], tipX, tipY, [1, 1], 'F', true);
}
function arrowDown(doc, x, y, len = 4, color = ARROW) {
  boldLine(doc, x, y, x, y + len - 1.8, color);
  headAt(doc, x, y + len, 0, 1, color);
}
function arrowRight(doc, x, y, len = 4, color = ARROW) {
  boldLine(doc, x, y, x + len - 1.8, y, color);
  headAt(doc, x + len, y, 1, 0, color);
}

/* ------------------------------------------------------------------ visual diagram cards */

const looksLikeFormula = (s) => /[=^|]|\b\w+\(|\bsum\b|_\w/.test(s);

/** Measures a card (white, coloured accent edge) and returns its height plus draw(x, y). */
function card(doc, node, outerW, n, tone, opts = {}) {
  const w = outerW - DEPTH; // leave room for the 3D side
  const pad = 3.2;
  const accent = 1.3;
  const badge = n !== undefined && n !== null && n !== '';
  const left = accent + pad;
  const tx = left + (badge ? 7.2 : 0);
  const titleW = w - tx - pad;
  const fullW = w - left - pad;
  const parts = [];
  const add = (text, size, style, color, width, x, font = 'helvetica', gapAfter = 0.8) => {
    if (!text) return;
    doc.setFont(font, style); doc.setFontSize(size);
    parts.push({ kind: 'text', lines: doc.splitTextToSize(text, width), size, style, color, font, x, gapAfter });
  };
  add(pdfSafe(node.title), opts.compact ? 8.4 : 9, 'bold', tone[3], titleW, tx, 'helvetica', 0.3);
  add(pdfSafe(node.subtitle), 7.2, 'normal', MUTED, titleW, tx);
  if (badge && parts.length) {
    // keep the text below the badge column once the title block is done
    const titleH = parts.reduce((s, p) => s + p.lines.length * LH(p.size) + p.gapAfter, 0);
    if (titleH < 6.4) parts.push({ kind: 'space', h: 6.4 - titleH });
  }
  add(pdfSafe(node.text), 7.9, 'normal', INK, fullW, left, 'helvetica', 1);
  (node.items || []).forEach(it => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6);
    parts.push({ kind: 'bullet', lines: doc.splitTextToSize(pdfSafe(it), fullW - 3.2), size: 7.6, x: left, color: tone[2] });
  });
  if (node.tags?.length) {
    // chips flow left to right and wrap
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8);
    const rows = [[]]; let rowW = 0;
    node.tags.map(pdfSafe).forEach(tg => {
      const cwid = doc.getTextWidth(tg) + 4;
      if (rowW + cwid > fullW && rows[rows.length - 1].length) { rows.push([]); rowW = 0; }
      rows[rows.length - 1].push({ t: tg, w: cwid }); rowW += cwid + 1.6;
    });
    parts.push({ kind: 'chips', rows, x: left });
  }
  const details = Array.isArray(node.details) ? node.details : node.details ? [node.details] : [];
  if (details.length) {
    const blocks = details.map(d => {
      const mono = looksLikeFormula(pdfSafe(d));
      doc.setFont(mono ? 'courier' : 'helvetica', 'normal'); doc.setFontSize(mono ? 7 : 7.4);
      return { mono, size: mono ? 7 : 7.4, lines: doc.splitTextToSize(pdfSafe(d), fullW - 5) };
    });
    parts.push({ kind: 'detail', blocks, x: left });
  }

  const partH = (p) => p.kind === 'space' ? p.h
    : p.kind === 'chips' ? p.rows.length * 5 + 0.6
    : p.kind === 'detail' ? 5.4 + p.blocks.reduce((s, b) => s + b.lines.length * LH(b.size) + 0.6, 0) + 1.6
    : p.kind === 'bullet' ? p.lines.length * LH(p.size) + 0.5
    : p.lines.length * LH(p.size) + p.gapAfter;
  const h = Math.max(pad + parts.reduce((s, p) => s + partH(p), 0) + pad - 0.6, badge ? 12 : 10);

  const draw = (x, y) => {
    prism(doc, x, y, w, h, { face: [255, 255, 255], edge: tone[1], accent: tone[2] });
    doc.setFillColor(...tone[2]);
    doc.rect(x, y, accent, h, 'F');
    if (badge) {
      doc.setFillColor(...tone[2]); doc.circle(x + left + 2.8, y + pad + 2.8, 2.8, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4); doc.setTextColor(255, 255, 255);
      doc.text(String(n), x + left + 2.8, y + pad + 3.85, { align: 'center' });
    }
    let cy = y + pad;
    parts.forEach(p => {
      if (p.kind === 'space') { cy += p.h; return; }
      if (p.kind === 'text') {
        doc.setFont(p.font, p.style); doc.setFontSize(p.size); doc.setTextColor(...p.color);
        p.lines.forEach(l => { cy += LH(p.size); doc.text(l, x + p.x, cy - LH(p.size) * 0.24); });
        cy += p.gapAfter; return;
      }
      if (p.kind === 'bullet') {
        doc.setFillColor(...p.color); doc.circle(x + p.x + 0.9, cy + LH(p.size) * 0.5, 0.55, 'F');
        doc.setFont('helvetica', 'normal'); doc.setFontSize(p.size); doc.setTextColor(...INK);
        p.lines.forEach(l => { cy += LH(p.size); doc.text(l, x + p.x + 3.2, cy - LH(p.size) * 0.24); });
        cy += 0.5; return;
      }
      if (p.kind === 'chips') {
        cy += 0.6;
        p.rows.forEach(row => {
          let cx = x + p.x;
          row.forEach(c => {
            doc.setFillColor(...tone[0]); doc.setDrawColor(...tone[1]); doc.setLineWidth(0.2);
            doc.roundedRect(cx, cy, c.w, 4, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(...tone[3]);
            doc.text(c.t, cx + c.w / 2, cy + 2.75, { align: 'center' });
            cx += c.w + 1.6;
          });
          cy += 5;
        });
        return;
      }
      if (p.kind === 'detail') {
        const bh = partH(p) - 1.6;
        cy += 0.8;
        doc.setFillColor(247, 248, 246); doc.setDrawColor(...LINE); doc.setLineWidth(0.2);
        doc.roundedRect(x + p.x, cy, w - p.x - 3.2, bh, 1.4, 1.4, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6); doc.setTextColor(...MUTED);
        doc.text('TECHNICAL DETAIL', x + p.x + 2.5, cy + 3.3);
        let dy = cy + 4.6;
        p.blocks.forEach(b => {
          doc.setFont(b.mono ? 'courier' : 'helvetica', b.mono ? 'bold' : 'normal'); doc.setFontSize(b.size);
          doc.setTextColor(...(b.mono ? FOREST : INK));
          b.lines.forEach(l => { dy += LH(b.size); doc.text(l, x + p.x + 2.5, dy - LH(b.size) * 0.24); });
          dy += 0.6;
        });
        cy += bh + 0.8;
      }
    });
  };
  return { h: h + DEPTH, draw };
}

/**
 * Draws a visual diagram definition as a numbered figure. `ctx` gives access to the PDF state:
 * { doc, margin, contentWidth, getY, setY, checkPageBreak, renderCodeBox }.
 */
export function drawVisualDiagram(ctx, def, figLabel = 'Figure') {
  const { doc, margin: m, contentWidth: cw, checkPageBreak } = ctx;
  let y = ctx.getY();
  const sync = () => ctx.setY(y);
  const need = (h) => { sync(); if (checkPageBreak(h)) y = ctx.getY(); };

  const head = measureFigureHead(doc, def, cw);
  need(head.h + 30);
  drawFigureHead(doc, m, y, head, figLabel);
  y += head.h + 1;

  const rowOfCards = (cards, xs, rowGapAfter = 0) => {
    const hMax = Math.max(...cards.map(c => c?.h || 0));
    need(hMax + 2);
    cards.forEach((c, i) => c && c.draw(xs[i], y));
    const top = y;
    y += hMax + rowGapAfter;
    return { top, hMax };
  };

  def.sections.forEach((s, si) => {
    // Section heading: numbered pill + small caps title
    need(16);
    const multi = def.sections.length > 1;
    let hx = m;
    if (multi) {
      doc.setFillColor(...FOREST); doc.roundedRect(m, y - 0.2, 7, 4.6, 1.2, 1.2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
      doc.text(String(si + 1).padStart(2, '0'), m + 3.5, y + 3.05, { align: 'center' });
      hx = m + 9;
    }
    if (s.title) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...FOREST);
      doc.text(doc.splitTextToSize(pdfSafe(s.title).toUpperCase(), cw - (hx - m))[0], hx, y + 3.1);
    }
    if (multi || s.title) y += 6.4;
    if (s.text) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.9); doc.setTextColor(...MUTED);
      doc.splitTextToSize(pdfSafe(s.text), cw).forEach(l => { need(5); doc.text(l, m, y + 2); y += LH(7.9); });
      y += 1.2;
    }
    y += 0.8;

    if (s.type === 'layers') {
      s.items.forEach((it, i) => {
        const ind = Math.min(i * 5, 20);
        const c = card(doc, it, cw - ind, it.n ?? i + 1, toneOf(it.tone, i));
        need(c.h + 6);
        c.draw(m + ind, y); y += c.h;
        if (i < s.items.length - 1) { arrowDown(doc, m + ind + 9, y + 0.6); y += 5.4; }
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
        steps.forEach((_, i) => { if (i < steps.length - 1) arrowRight(doc, m + (i + 1) * w + i * gap + 0.8, top + Math.min(hMax / 2, 9), gap - 1.6); });
      } else {
        steps.forEach((st, i) => {
          const c = card(doc, st, cw, st.n ?? i + 1, toneOf(st.tone, i));
          need(c.h + 6);
          c.draw(m, y); y += c.h;
          if (i < steps.length - 1) { arrowDown(doc, m + 9, y + 0.6); y += 5.4; }
        });
      }
      if (s.loops?.length) {
        y += 2.6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6);
        const items = s.loops.map(l => ({ head: `${pdfSafe(l.from)}  ->  back to  ${pdfSafe(l.to)}`, lines: l.label ? doc.splitTextToSize(pdfSafe(l.label), cw - 14) : [] }));
        const h = 8 + items.reduce((acc, it) => acc + LH(7.8) + it.lines.length * LH(7.6) + 1.2, 0);
        need(h + 2);
        doc.setDrawColor(...ARROW); doc.setLineWidth(0.35); doc.setLineDashPattern([1.3, 1], 0);
        doc.setFillColor(250, 252, 250); doc.roundedRect(m, y, cw, h, 2, 2, 'FD');
        doc.setLineDashPattern([], 0);
        // loop icon: a small circular arrow
        doc.setDrawColor(...SAGE); doc.setLineWidth(0.45); doc.circle(m + 5, y + 4.4, 1.7, 'S');
        doc.setFillColor(...SAGE); doc.triangle(m + 6.1, y + 2.2, m + 7.4, y + 3.6, m + 5.6, y + 3.8, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); doc.setTextColor(...SAGE);
        doc.text('FEEDBACK LOOP' + (items.length > 1 ? 'S' : ''), m + 9, y + 5.2);
        let ly = y + 8.4;
        items.forEach(it => {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.8); doc.setTextColor(...INK);
          doc.text(it.head, m + 9, ly + 2.4); ly += LH(7.8);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6); doc.setTextColor(...MUTED);
          it.lines.forEach(l => { doc.text(l, m + 9, ly + 2.4); ly += LH(7.6); });
          ly += 1.2;
        });
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
        const sw = cw * 0.66;
        const c = card(doc, s.source, sw, undefined, TONES.slate);
        need(c.h + 8);
        c.draw(m + (cw - sw) / 2, y); y += c.h;
      }
      const k = s.columns.length;
      const gap = 4;
      const w = (cw - gap * (k - 1)) / k;
      const xs = s.columns.map((_, i) => m + i * (w + gap));
      if (s.source) {
        // a fan-out connector from the source to every column
        boldLine(doc, m + cw / 2, y, m + cw / 2, y + 2.4);
        boldLine(doc, xs[0] + w / 2, y + 2.4, xs[k - 1] + w / 2, y + 2.4);
        xs.forEach(x => arrowDown(doc, x + w / 2, y + 2.4, 3.4));
        y += 6.4;
      }
      need(12);
      s.columns.forEach((c, i) => {
        if (!c.title) return;
        const t = toneOf(c.tone, i);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
        const label = doc.splitTextToSize(pdfSafe(c.title).toUpperCase(), w - 2)[0];
        doc.setFillColor(...t[0]); doc.roundedRect(xs[i], y, Math.min(w, doc.getTextWidth(label) + 5), 4.8, 1.2, 1.2, 'F');
        doc.setTextColor(...t[3]); doc.text(label, xs[i] + 2.5, y + 3.3);
      });
      y += 6.4;
      const depth = Math.max(...s.columns.map(c => c.cards.length));
      for (let r = 0; r < depth; r++) {
        const cards = s.columns.map((c, i) => (c.cards[r] ? card(doc, c.cards[r], w, c.cards[r].n, toneOf(c.tone, i), { compact: true }) : null));
        const { top } = rowOfCards(cards, xs);
        if (r < depth - 1) {
          s.columns.forEach((c, i) => { if (c.cards[r + 1] && cards[i]) arrowDown(doc, xs[i] + w / 2, top + cards[i].h + 0.6, 4.2); });
          y += 5.4;
        }
      }
      if (s.merge) {
        // a fan-in connector from every column into the merge card
        xs.forEach(x => boldLine(doc, x + w / 2, y + 0.6, x + w / 2, y + 2.6));
        boldLine(doc, xs[0] + w / 2, y + 2.6, xs[k - 1] + w / 2, y + 2.6);
        arrowDown(doc, m + cw / 2, y + 2.6, 3.6);
        y += 6.8;
        const mw = cw * 0.72;
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
      const drawRow = (cells, header, zebra) => {
        doc.setFont('helvetica', header ? 'bold' : 'normal'); doc.setFontSize(7.8);
        const wrapped = cells.map((c, i) => doc.splitTextToSize(pdfSafe(c), widths[i] - 5));
        const h = Math.max(...wrapped.map(l => l.length)) * LH(7.8) + 4;
        need(h + 1);
        if (header) { doc.setFillColor(...FOREST); doc.roundedRect(m, y, cw, h, 1.6, 1.6, 'F'); doc.rect(m, y + h - 1.6, cw, 1.6, 'F'); }
        else if (zebra) { doc.setFillColor(247, 248, 246); doc.rect(m, y, cw, h, 'F'); }
        doc.setDrawColor(...LINE); doc.setLineWidth(0.2); if (!header) doc.line(m, y + h, m + cw, y + h);
        let x = m;
        wrapped.forEach((lines, i) => {
          doc.setFont('helvetica', header || i === 0 ? 'bold' : 'normal');
          doc.setTextColor(...(header ? [255, 255, 255] : i === 0 ? FOREST : INK));
          lines.forEach((l, k) => doc.text(l, x + 2.5, y + 2.4 + LH(7.8) * (k + 0.78)));
          x += widths[i];
        });
        y += h;
      };
      drawRow(s.head, true);
      s.rows.forEach((r, i) => drawRow(r, false, i % 2 === 1));
    }

    if (s.type === 'code') {
      sync();
      ctx.renderCodeBox(s.label || s.title, s.code, 'python');
      y = ctx.getY() - 2;
    }

    y += 3;
    if (si < def.sections.length - 1) { need(12); arrowDown(doc, m + cw / 2, y - 1.2, 5.4, SAGE); y += 8; }
  });

  sync();
  drawCaption(ctx, def.note, need);
  ctx.setY(ctx.getY() + 3);
}

/* ------------------------------------------------------------------ workflow (vector) */

const NODE_TONES = [
  [[240, 249, 255], [186, 230, 253], [3, 105, 161], [12, 74, 110]],
  [[236, 253, 245], [167, 243, 208], [4, 120, 87], [6, 78, 59]],
  [[245, 243, 255], [221, 214, 254], [109, 40, 217], [76, 29, 149]],
  [[255, 251, 235], [253, 230, 138], [180, 83, 9], [120, 53, 15]],
  [[240, 253, 250], [153, 246, 228], [15, 118, 110], [19, 78, 74]],
  [[255, 241, 242], [254, 205, 211], [190, 18, 60], [136, 19, 55]]
];

/** Strokes an SVG path ("M L C Q" commands, as produced by routeEdges) with jsPDF; returns the end tangent. */
function strokeSvgPath(doc, d, tx, ty, s) {
  const re = /([MLCQ])([^MLCQ]*)/g;
  let cur = [0, 0];
  let prev = [0, 0];
  let m;
  const pt = (x, y) => [tx + x * s, ty + y * s];
  while ((m = re.exec(d))) {
    const nums = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (m[1] === 'M') { cur = pt(nums[0], nums[1]); prev = cur; doc.moveTo(...cur); }
    if (m[1] === 'L') { prev = cur; cur = pt(nums[0], nums[1]); doc.lineTo(...cur); }
    if (m[1] === 'C') { const c1 = pt(nums[0], nums[1]); const c2 = pt(nums[2], nums[3]); const e = pt(nums[4], nums[5]); doc.curveTo(...c1, ...c2, ...e); prev = c2; cur = e; }
    if (m[1] === 'Q') {
      const q = pt(nums[0], nums[1]); const e = pt(nums[2], nums[3]);
      const c1 = [cur[0] + (2 / 3) * (q[0] - cur[0]), cur[1] + (2 / 3) * (q[1] - cur[1])];
      const c2 = [e[0] + (2 / 3) * (q[0] - e[0]), e[1] + (2 / 3) * (q[1] - e[1])];
      doc.curveTo(...c1, ...c2, ...e); prev = q; cur = e;
    }
  }
  doc.stroke();
  // direction of the last segment (fall back to the previous vertex for degenerate controls)
  let dx = cur[0] - prev[0]; let dy = cur[1] - prev[1];
  if (Math.hypot(dx, dy) < 0.01) { dx = 1; dy = 0; }
  return { end: cur, dir: [dx / Math.hypot(dx, dy), dy / Math.hypot(dx, dy)] };
}

/** Height (mm) the workflow figure's heading and drawing need, so a section heading can stay with it. */
export function measureWorkflow(doc, def, contentWidth, pageHeight) {
  const L = layoutDiagram(def, { maxRowW: 800 });
  const pad = 4;
  let s = Math.min((contentWidth - pad * 2) / L.width, 0.22);
  if (L.height * s > pageHeight - 70) s = (pageHeight - 70) / L.height;
  return measureFigureHead(doc, { title: def.title || 'Workflow', subtitle: def.caption }, contentWidth).h + L.height * s + pad * 2 + 6;
}

/**
 * Draws a workflow definition as a vector figure (same layout and routing as the website), then a
 * step table. ctx: { doc, margin, contentWidth, pageHeight, getY, setY, checkPageBreak }.
 */
export function drawWorkflow(ctx, def, figLabel = 'Figure') {
  const { doc, margin: m, contentWidth: cw, pageHeight, checkPageBreak } = ctx;
  let y = ctx.getY();
  const need = (h) => { ctx.setY(y); if (checkPageBreak(h)) y = ctx.getY(); };

  // A narrower layout than the website gives larger type on paper.
  const L = layoutDiagram(def, { maxRowW: 800 });
  const routes = routeEdges(L);
  const pad = 4;
  let s = Math.min((cw - pad * 2) / L.width, 0.22);
  const maxH = pageHeight - 70;
  if (L.height * s > maxH) s = maxH / L.height;
  const W = L.width * s;
  const H = L.height * s;

  const head = measureFigureHead(doc, { title: def.title || 'Workflow', subtitle: def.caption }, cw);
  need(head.h + H + pad * 2 + 6);
  drawFigureHead(doc, m, y, head, figLabel);
  y += head.h + 0.6;

  // panel
  doc.setFillColor(249, 250, 248); doc.setDrawColor(...LINE); doc.setLineWidth(0.25);
  doc.roundedRect(m, y, cw, H + pad * 2, 2.4, 2.4, 'FD');
  const ox = m + (cw - W) / 2;
  const oy = y + pad;

  // edges
  doc.setLineCap('round'); doc.setLineJoin('round');
  routes.forEach(r => {
    if (!r.back) { doc.setDrawColor(...HALO); doc.setLineWidth(1.5); strokeSvgPath(doc, r.d, ox, oy, s); }
    doc.setDrawColor(...ARROW); doc.setLineWidth(0.72);
    if (r.back) doc.setLineDashPattern([1.6, 1.2], 0);
    const { end, dir } = strokeSvgPath(doc, r.d, ox, oy, s);
    doc.setLineDashPattern([], 0);
    headAt(doc, end[0] + dir[0] * 0.4, end[1] + dir[1] * 0.4, dir[0], dir[1], ARROW, 2.6, 1.5);
  });
  doc.setLineCap('butt'); doc.setLineJoin('miter');
  // edge labels
  routes.forEach(r => {
    if (!r.label) return;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.6);
    const t = pdfSafe(r.label);
    const lw = doc.getTextWidth(t) + 3.6;
    const cx = ox + r.lx * s; const cy = oy + r.ly * s;
    doc.setFillColor(255, 255, 255); doc.setDrawColor(150, 180, 166); doc.setLineWidth(0.3);
    doc.roundedRect(cx - lw / 2, cy - 1.9, lw, 3.8, 1.9, 1.9, 'FD');
    doc.setTextColor(...INK);
    doc.text(t, cx, cy + 0.85, { align: 'center' });
  });
  // nodes
  const fs = Math.max(7, Math.min(8.4, (12.5 * s) / 0.3528));
  L.nodes.forEach(n => {
    const [fill, stroke, accent, ink] = NODE_TONES[(n.step - 1) % NODE_TONES.length];
    const x = ox + n.x * s; const ny = oy + n.y * s;
    const w = L.NODE_W * s; const h = L.NODE_H * s;
    prism(doc, x, ny, w, h, { face: fill, edge: stroke, accent, depth: 1.4 });
    const r = Math.min(2.6, 11 * s);
    doc.setFillColor(...accent); doc.circle(x + 22 * s, ny + h / 2, r, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(Math.max(6.4, r * 2.4)); doc.setTextColor(255, 255, 255);
    doc.text(String(n.step), x + 22 * s, ny + h / 2 + r * 0.38, { align: 'center' });
    // label: re-wrap for Helvetica at this size so it always fits the box
    doc.setFont('helvetica', 'bold'); doc.setFontSize(fs); doc.setTextColor(...ink);
    const tw = w - 40 * s - 2;
    let lines = doc.splitTextToSize(pdfSafe(n.label), tw);
    const maxLines = Math.max(1, Math.floor((h - 1.6) / LH(fs)));
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '...'; }
    const first = ny + h / 2 - ((lines.length - 1) * LH(fs)) / 2 + fs * 0.3528 * 0.35;
    lines.forEach((l, k) => doc.text(l, x + 40 * s, first + k * LH(fs)));
  });
  y += H + pad * 2 + 4;
  ctx.setY(y);

  // Step table: number, step, what happens, input -> output
  const steps = [...L.nodes].sort((a, b) => a.step - b.step);
  const hasIO = steps.some(n => n.input || n.output);
  const cols = hasIO ? [9, 40, cw - 9 - 40 - 52, 52] : [9, 48, cw - 57];
  const heads = hasIO ? ['#', 'Step', 'What happens', 'Input  ->  Output'] : ['#', 'Step', 'What happens'];
  const row = (cells, header, zebra) => {
    doc.setFont('helvetica', header ? 'bold' : 'normal'); doc.setFontSize(7.7);
    const wrapped = cells.map((c, i) => doc.splitTextToSize(pdfSafe(c), cols[i] - 4));
    const h = Math.max(...wrapped.map(l => l.length)) * LH(7.7) + 3.6;
    need(h + 1);
    if (header) { doc.setFillColor(...FOREST); doc.roundedRect(m, y, cw, h, 1.6, 1.6, 'F'); doc.rect(m, y + h - 1.6, cw, 1.6, 'F'); }
    else if (zebra) { doc.setFillColor(247, 248, 246); doc.rect(m, y, cw, h, 'F'); }
    if (!header) { doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(m, y + h, m + cw, y + h); }
    let x = m;
    wrapped.forEach((lines, i) => {
      doc.setFont('helvetica', header || i <= 1 ? 'bold' : 'normal');
      doc.setTextColor(...(header ? [255, 255, 255] : i === 0 ? SAGE : i === 1 ? FOREST : INK));
      lines.forEach((l, k) => doc.text(l, x + (i === 0 ? cols[0] / 2 : 2.2), y + 2.3 + LH(7.7) * (k + 0.78), i === 0 ? { align: 'center' } : undefined));
      x += cols[i];
    });
    y += h;
  };
  need(16);
  row(heads, true);
  steps.forEach((n, i) => row(hasIO
    ? [String(n.step), n.label, n.detail || '', [n.input, n.output].filter(Boolean).join('  ->  ')]
    : [String(n.step), n.label, n.detail || ''], false, i % 2 === 1));
  y += 4;
  ctx.setY(y);
}
