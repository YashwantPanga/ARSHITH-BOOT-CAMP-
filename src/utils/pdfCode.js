// Premium code blocks for the course PDF: an editor-style card (title bar, language tag, line
// numbers, syntax colours) and a "How this code works" panel with the explanation and the
// line-by-line notes. Both split cleanly across pages.
import { cleanText, cleanCodeLine } from './pdfGenerator';

/* ------------------------------------------------------------------ syntax colouring */

const KEYWORDS = {
  python: 'False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield self',
  javascript: 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield async await of null undefined true false from require module',
  sql: 'select from where join left right inner outer full cross on group by order having limit offset insert into values update set delete create table alter drop index view primary key foreign references not null unique default as and or in is like ilike between distinct union all case when then else end with count sum avg min max begin commit rollback transaction over partition row_number rank dense_rank exists asc desc check constraint returning',
  bash: 'if then else fi for do done while in case esac function export echo cd ls mkdir rm cp mv pip python npm node git docker sudo source',
  css: 'important media keyframes from to root',
  html: ''
};
const BUILTINS = {
  python: 'print len range enumerate zip map filter sorted sum min max abs round int float str list dict set tuple bool type isinstance open super property staticmethod classmethod np pd plt sns',
  javascript: 'console document window Math JSON Array Object Promise fetch setTimeout parseInt String Number Boolean Map Set',
  sql: '', bash: '', css: '', html: ''
};
const sets = {};
const wordSet = (table, lang) => (sets[`${table === KEYWORDS ? 'k' : 'b'}:${lang}`] ||= new Set((table[lang] || '').split(/\s+/).filter(Boolean)));

export function normLang(lang) {
  const l = String(lang || '').toLowerCase();
  if (/^(py|python)/.test(l)) return 'python';
  if (/^(js|javascript|jsx|ts|typescript|node)/.test(l)) return 'javascript';
  if (/sql|postgres|mysql/.test(l)) return 'sql';
  if (/^(html|xml)/.test(l)) return 'html';
  if (/^css/.test(l)) return 'css';
  if (/^(bash|shell|sh|cmd|powershell|ps1)/.test(l)) return 'bash';
  return 'text';
}

// Token kinds: plain | keyword | builtin | string | comment | number | tag | attr
export function tokenizeLine(line, lang, state = {}) {
  const out = [];
  let i = 0;
  const push = (t, kind) => { if (t) out.push({ t, kind }); };
  // Python triple-quoted strings can span lines.
  if (state.triple) {
    const end = line.indexOf(state.triple);
    if (end < 0) { push(line, 'string'); return { tokens: out, state }; }
    push(line.slice(0, end + 3), 'string');
    i = end + 3;
    state = { ...state, triple: null };
  }
  const commentStart = lang === 'python' || lang === 'bash' ? '#' : lang === 'sql' ? '--' : lang === 'javascript' || lang === 'css' ? '//' : null;
  const kw = wordSet(KEYWORDS, lang);
  const bi = wordSet(BUILTINS, lang);
  while (i < line.length) {
    const rest = line.slice(i);
    if (lang === 'html') {
      const c = rest.match(/^<!--.*?(-->|$)/); if (c) { push(c[0], 'comment'); i += c[0].length; continue; }
      const tg = rest.match(/^<\/?[A-Za-z][\w-]*/); if (tg) { push(tg[0], 'tag'); i += tg[0].length; continue; }
      const at = rest.match(/^[\w-]+(?==)/); if (at) { push(at[0], 'attr'); i += at[0].length; continue; }
    }
    if (lang === 'css') {
      const pr = rest.match(/^[\w-]+(?=\s*:)/); if (pr) { push(pr[0], 'attr'); i += pr[0].length; continue; }
    }
    if (commentStart && rest.startsWith(commentStart)) { push(rest, 'comment'); break; }
    if ((lang === 'javascript' || lang === 'css') && rest.startsWith('/*')) {
      const e = rest.indexOf('*/', 2); const seg = e < 0 ? rest : rest.slice(0, e + 2); push(seg, 'comment'); i += seg.length; continue;
    }
    if (lang === 'python') {
      const tq = rest.match(/^[rbfuRBFU]{0,2}("""|''')/);
      if (tq) {
        const q = tq[1]; const end = rest.indexOf(q, tq[0].length);
        if (end < 0) { push(rest, 'string'); return { tokens: out, state: { ...state, triple: q } }; }
        push(rest.slice(0, end + 3), 'string'); i += end + 3; continue;
      }
    }
    const str = rest.match(/^[rbfuRBFU]{0,2}("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)/);
    if (str && !/\w/.test(line[i - 1] || '')) { push(str[0], 'string'); i += str[0].length; continue; }
    const num = rest.match(/^\d[\d_]*(\.\d+)?([eE][+-]?\d+)?/);
    if (num && !/\w/.test(line[i - 1] || '')) { push(num[0], 'number'); i += num[0].length; continue; }
    // Python decorator (@property); a bare "@" is the matrix-multiply operator and stays plain.
    const deco = lang === 'python' ? rest.match(/^@[A-Za-z_][\w.]*/) : null;
    if (deco && !/\S/.test(line.slice(0, i))) { push(deco[0], 'builtin'); i += deco[0].length; continue; }
    const w = rest.match(/^[A-Za-z_$][\w$]*/);
    if (w) {
      const word = w[0];
      const lower = lang === 'sql' ? word.toLowerCase() : word;
      const kind = kw.has(lower) ? 'keyword' : bi.has(word) ? 'builtin' : /^\s*\(/.test(rest.slice(word.length)) ? 'builtin' : 'plain';
      push(word, kind); i += word.length; continue;
    }
    push(rest[0], 'plain'); i += 1;
  }
  return { tokens: out, state };
}

// Colours on the dark card background (all comfortably readable).
const INK = {
  plain: [233, 241, 236], keyword: [240, 196, 104], builtin: [143, 201, 236], string: [150, 214, 166],
  comment: [128, 156, 144], number: [242, 166, 112], tag: [240, 196, 104], attr: [143, 201, 236]
};

/* ------------------------------------------------------------------ code card */

const CODE_SIZE = 7.8;     // pt
const CODE_LH = 3.75;      // mm between baselines
const HEAD_H = 7.2;        // title bar height (mm)
const LANG_LABEL = { python: 'PYTHON', javascript: 'JAVASCRIPT', sql: 'SQL', html: 'HTML', css: 'CSS', bash: 'SHELL', text: 'CODE' };

/**
 * Draws an editor-style code card. ctx: { doc, margin, contentWidth, pageHeight, getY, setY, checkPageBreak }.
 * variant: 'default' | 'buggy' | 'fixed' (changes the tag colour and label).
 */
export function drawCodeCard(ctx, { title, code, language, variant = 'default' }) {
  const { doc, margin: m, contentWidth: cw, pageHeight, checkPageBreak } = ctx;
  const lang = normLang(language);
  doc.setFont('courier', 'normal');
  doc.setFontSize(CODE_SIZE);
  const charW = doc.getTextWidth('M');

  // Source lines (indentation kept), trimmed of blank lines at both ends.
  const src = String(code || '').replace(/\r/g, '').split('\n').map(cleanCodeLine);
  while (src.length && !src[src.length - 1].trim()) src.pop();
  while (src.length && !src[0].trim()) src.shift();
  if (!src.length) return;

  const gutter = String(src.length).length * charW + 5.5;
  const textX = m + gutter + 3;
  const maxChars = Math.max(20, Math.floor((m + cw - 4 - textX) / charW));

  // Tokenise every source line, then wrap by character count; continuation rows get no number.
  const rows = [];
  let state = {};
  src.forEach((line, idx) => {
    const r = tokenizeLine(line, lang, state);
    state = r.state;
    const indent = Math.min(line.length - line.trimStart().length, 24) + 2;
    let cur = []; let len = 0; let first = true;
    const flush = () => { rows.push({ n: first ? idx + 1 : null, tokens: cur, pad: first ? 0 : indent }); cur = []; len = 0; first = false; };
    r.tokens.forEach(tok => {
      let t = tok.t;
      while (t.length) {
        const room = maxChars - (first ? 0 : indent) - len;
        if (t.length <= room) { cur.push({ t, kind: tok.kind }); len += t.length; t = ''; }
        else {
          let cut = room > 0 ? t.lastIndexOf(' ', room) : -1;
          if (cut < room * 0.5) cut = Math.max(room, 1);
          if (room <= 0) { flush(); continue; }
          cur.push({ t: t.slice(0, cut), kind: tok.kind }); flush(); t = t.slice(cut).replace(/^\s+/, '');
        }
      }
    });
    flush();
  });

  const chip = variant === 'buggy' ? { label: 'BUGGY', fill: [122, 33, 33], ink: [255, 214, 214] }
    : variant === 'fixed' ? { label: 'FIXED', fill: [29, 96, 73], ink: [214, 245, 228] }
    : { label: LANG_LABEL[lang], fill: [30, 81, 65], ink: [207, 227, 216] };

  let y = ctx.getY();
  let idx = 0;
  let part = 0;
  while (idx < rows.length) {
    ctx.setY(y);
    if (checkPageBreak(HEAD_H + 3 * CODE_LH + 8)) y = ctx.getY();
    const avail = pageHeight - 22 - y - HEAD_H - 6;
    const n = Math.max(3, Math.floor(avail / CODE_LH));
    const chunk = rows.slice(idx, idx + n);
    const bodyH = chunk.length * CODE_LH + 5.5;
    const totalH = HEAD_H + bodyH;

    // card + title bar
    doc.setFillColor(12, 45, 38);
    doc.roundedRect(m, y, cw, totalH, 2.4, 2.4, 'F');
    doc.setFillColor(6, 33, 26);
    doc.roundedRect(m, y, cw, HEAD_H, 2.4, 2.4, 'F');
    doc.rect(m, y + HEAD_H - 2.4, cw, 2.4, 'F');
    [[224, 108, 90], [224, 181, 74], [95, 179, 122]].forEach((c, k) => { doc.setFillColor(...c); doc.circle(m + 4.4 + k * 3.2, y + HEAD_H / 2, 0.95, 'F'); });
    // language / variant tag on the right
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.4);
    const chipW = doc.getTextWidth(chip.label) + 4.4;
    doc.setFillColor(...chip.fill);
    doc.roundedRect(m + cw - chipW - 3.5, y + 1.6, chipW, HEAD_H - 3.2, 1.2, 1.2, 'F');
    doc.setTextColor(...chip.ink);
    doc.text(chip.label, m + cw - chipW / 2 - 3.5, y + HEAD_H / 2 + 0.85, { align: 'center' });
    // title
    const label = cleanText(title || '') + (part > 0 ? '  (continued)' : '');
    if (label.trim()) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.6); doc.setTextColor(222, 236, 228);
      let t = label;
      const maxW = cw - chipW - 22;
      while (t.length > 4 && doc.getTextWidth(t) > maxW) t = t.slice(0, -2);
      if (t !== label) t = t.replace(/\s+\S*$/, '') + '...';
      doc.text(t, m + 14.6, y + HEAD_H / 2 + 0.95);
    }
    // gutter
    const top = y + HEAD_H;
    doc.setDrawColor(31, 74, 62); doc.setLineWidth(0.25);
    doc.line(m + gutter, top + 1.5, m + gutter, top + bodyH - 1.5);

    chunk.forEach((row, k) => {
      const by = top + 4.3 + k * CODE_LH;
      if (row.n !== null) {
        doc.setFont('courier', 'normal'); doc.setFontSize(CODE_SIZE - 0.6); doc.setTextColor(95, 133, 116);
        doc.text(String(row.n), m + gutter - 1.6, by, { align: 'right' });
      }
      let x = textX + row.pad * charW;
      row.tokens.forEach(tok => {
        doc.setFont('courier', tok.kind === 'keyword' ? 'bold' : tok.kind === 'comment' ? 'italic' : 'normal');
        doc.setFontSize(CODE_SIZE);
        doc.setTextColor(...INK[tok.kind]);
        doc.text(tok.t, x, by);
        x += tok.t.length * charW;
      });
    });

    y += totalH + 3;
    idx += chunk.length;
    part += 1;
  }
  ctx.setY(y);
}

/* ------------------------------------------------------------------ explanation panel */

/**
 * "How this code works" panel: the explanation, then numbered line-by-line notes.
 * Built as rows that are measured first, then drawn in page-sized chunks with the panel background.
 */
export function drawExplanationPanel(ctx, { explanation, lineByLine, heading = 'How this code works' }) {
  const { doc, margin: m, contentWidth: cw, pageHeight, checkPageBreak } = ctx;
  const notes = (Array.isArray(lineByLine) ? lineByLine : []).filter(l => l && (l.explanation || l.line || l.code));
  if (!explanation && !notes.length) return;

  const padX = 6;            // left padding (after the accent bar)
  const innerW = cw - padX - 4;
  const rows = [];
  const lh = (pt) => pt * 0.3528 * 1.38;

  // heading row
  rows.push({ h: 6.2, keepNext: true, draw: (y) => {
    doc.setFillColor(30, 81, 65); doc.circle(m + padX + 1.6, y + 2.6, 1.6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6.4); doc.setTextColor(255, 255, 255);
    doc.text('i', m + padX + 1.6, y + 3.55, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4); doc.setTextColor(30, 81, 65);
    doc.text(heading.toUpperCase(), m + padX + 5, y + 3.6);
  } });

  if (explanation) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.6);
    const lines = doc.splitTextToSize(cleanText(explanation), innerW);
    lines.forEach(l => rows.push({ h: lh(8.6), draw: (y) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.6); doc.setTextColor(48, 43, 37);
      doc.text(l, m + padX, y + lh(8.6) * 0.78);
    } }));
    rows.push({ h: 1.6, draw: () => {} });
  }

  if (notes.length) {
    rows.push({ h: 5.4, keepNext: true, draw: (y) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); doc.setTextColor(122, 116, 106);
      doc.text('LINE BY LINE', m + padX, y + 3.6);
    } });
    notes.forEach((lbl, i) => {
      const isNumber = /^\s*\d+(\s*-\s*\d+)?\s*$/.test(String(lbl.line ?? ''));
      const codeText = cleanCodeLine(isNumber ? lbl.code : (lbl.line || lbl.code)).trim();
      const badge = isNumber ? `L${String(lbl.line).trim()}` : String(i + 1);
      const bx = m + padX;
      const tx = bx + 7;
      const tw = m + cw - 4 - tx;
      doc.setFont('courier', 'bold'); doc.setFontSize(7.3);
      const codeLines = codeText ? doc.splitTextToSize(codeText, tw - 3) : [];
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2);
      const expLines = lbl.explanation ? doc.splitTextToSize(cleanText(lbl.explanation), tw) : [];
      const codeH = codeLines.length ? codeLines.length * 3.3 + 2.4 : 0;
      const h = Math.max(5.4, codeH + (expLines.length ? 1.1 + expLines.length * lh(8.2) : 0)) + 2.2;
      rows.push({ h, keep: true, draw: (y) => {
        doc.setFillColor(30, 81, 65);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.6);
        const bw = Math.max(4.6, doc.getTextWidth(badge) + 2.4);
        doc.roundedRect(bx, y + 0.2, bw, 4.4, 1.1, 1.1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(badge, bx + bw / 2, y + 3.3, { align: 'center' });
        let cy = y;
        if (codeLines.length) {
          doc.setFillColor(255, 255, 255); doc.setDrawColor(207, 223, 214); doc.setLineWidth(0.2);
          doc.roundedRect(tx, cy, tw, codeH, 1, 1, 'FD');
          doc.setFont('courier', 'bold'); doc.setFontSize(7.3); doc.setTextColor(1, 58, 43);
          codeLines.forEach((l, k) => doc.text(l, tx + 1.6, cy + 3.1 + k * 3.3));
          cy += codeH + 1.1;
        }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2); doc.setTextColor(93, 87, 78);
        expLines.forEach((l, k) => doc.text(l, tx, cy + lh(8.2) * 0.8 + k * lh(8.2)));
      } });
    });
  }

  // Paginate: draw the panel background for each page-chunk of rows, then the rows.
  let y = ctx.getY();
  let i = 0;
  while (i < rows.length) {
    ctx.setY(y);
    const firstH = rows[i].h + (rows[i + 1]?.h || 0) + 6;
    if (checkPageBreak(firstH)) y = ctx.getY();
    const limit = pageHeight - 22;
    let h = 3;
    let j = i;
    while (j < rows.length && y + h + rows[j].h + 3 <= limit) { h += rows[j].h; j++; }
    // A label (heading, "LINE BY LINE") never ends a page on its own: move it to the next chunk.
    while (j > i + 1 && j < rows.length && rows[j - 1].keepNext) { j--; h -= rows[j].h; }
    if (j === i) { h += rows[j].h; j++; } // a single row taller than the page: draw it anyway
    h += 2.5;
    doc.setFillColor(240, 247, 243);
    doc.roundedRect(m, y, cw, h, 2.2, 2.2, 'F');
    doc.setFillColor(30, 81, 65);
    doc.roundedRect(m, y, 1.4, h, 0.7, 0.7, 'F');
    let cy = y + 3;
    for (let k = i; k < j; k++) { rows[k].draw(cy); cy += rows[k].h; }
    y += h + 3;
    i = j;
  }
  ctx.setY(y + 1);
}
