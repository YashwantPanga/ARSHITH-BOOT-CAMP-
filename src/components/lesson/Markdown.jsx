import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import CodeBlock from '../CodeBlock';

// Small, safe Markdown renderer for lesson text stored as Markdown (AI course `theory`/`tutorial`).
// It builds React elements (no innerHTML for user/author text). Math between $…$ / $$…$$ is rendered
// with KaTeX, whose output is generated markup from escaped input (trust: false, throwOnError: false).

function MathTex({ tex, display }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: false, trust: false, strict: 'ignore', output: 'html' });
    } catch {
      return null;
    }
  }, [tex, display]);
  if (!html) return <code className="font-mono text-[0.92em]">{tex}</code>;
  return display
    ? <div className="my-3 overflow-x-auto thin-scroll text-charcoal" dangerouslySetInnerHTML={{ __html: html }} />
    : <span className="text-charcoal" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Inline formatting: `code`, **bold**, *italic*, $math$, [links](https://…). */
export function Inline({ text }) {
  const parts = [];
  const re = /(`[^`]+`)|(\$\$[^$]+\$\$)|(\$[^$\n]+\$)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m;
  let k = 0;
  const s = String(text ?? '');
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const tok = m[0];
    if (m[1]) parts.push(<code key={k++} className="font-mono text-[0.9em] px-1.5 py-0.5 rounded bg-brand-50 text-brand-900">{tok.slice(1, -1)}</code>);
    else if (m[2]) parts.push(<MathTex key={k++} tex={tok.slice(2, -2)} display={false} />);
    else if (m[3]) parts.push(<MathTex key={k++} tex={tok.slice(1, -1)} display={false} />);
    else if (m[4]) parts.push(<strong key={k++} className="font-semibold text-charcoal">{tok.slice(2, -2)}</strong>);
    else if (m[5]) parts.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    else if (m[6]) {
      const label = tok.slice(1, tok.indexOf(']'));
      parts.push(<a key={k++} href={m[7]} target="_blank" rel="noreferrer" className="text-brand-700 underline underline-offset-2 hover:text-brand-900">{label}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return <>{parts}</>;
}

function parseBlocks(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push({ type: 'code', lang: fence[1], text: buf.join('\n') });
      continue;
    }
    if (/^\$\$/.test(line.trim())) {
      const buf = [line.trim().replace(/^\$\$/, '')];
      if (!/\$\$$/.test(line.trim()) || line.trim() === '$$') {
        i++;
        while (i < lines.length && !/\$\$\s*$/.test(lines[i])) buf.push(lines[i++]);
        if (i < lines.length) buf.push(lines[i].replace(/\$\$\s*$/, ''));
      } else buf[0] = buf[0].replace(/\$\$$/, '');
      i++;
      blocks.push({ type: 'math', text: buf.join('\n').trim() });
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { blocks.push({ type: 'heading', level: h[1].length, text: h[2] }); i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const row = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = row(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(row(lines[i++]));
      blocks.push({ type: 'table', head, rows });
      continue;
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '');
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(item);
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*([-*+]|\d+[.)])\s+|\s*\|)/.test(lines[i]) && !/^\$\$/.test(lines[i].trim())) buf.push(lines[i++]);
    blocks.push({ type: 'p', text: buf.join(' ') });
  }
  return blocks;
}

/**
 * headingIdPrefix: when set, every level 2-4 heading gets id `${prefix}-${n}` (n counts those
 * headings from 0), so other parts of the page - such as the concept map - can link to them.
 */
export default function Markdown({ source, courseId, headingIdPrefix }) {
  const blocks = useMemo(() => parseBlocks(source), [source]);
  if (!blocks.length) return null;
  let headingNo = 0;
  return (
    <div className="space-y-3.5 text-[15px] leading-7 text-charcoal/80">
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading': {
            const cls = b.level <= 3 ? 'font-display text-xl text-brand-900 mt-5 first:mt-0' : 'font-semibold text-charcoal mt-3';
            const id = headingIdPrefix && b.level >= 2 && b.level <= 4 ? `${headingIdPrefix}-${headingNo++}` : undefined;
            return <h4 key={i} id={id} className={`${cls} scroll-mt-6`}><Inline text={b.text} /></h4>;
          }
          case 'code': return <CodeBlock key={i} code={b.text} language={b.lang} courseId={courseId} />;
          case 'math': return <MathTex key={i} tex={b.text} display />;
          case 'ul': return <ul key={i} className="space-y-1.5 pl-1">{b.items.map((t, k) => <li key={k} className="flex gap-2.5"><span className="text-sage mt-[0.2rem] shrink-0">•</span><span className="min-w-0"><Inline text={t} /></span></li>)}</ul>;
          case 'ol': return <ol key={i} className="space-y-1.5 list-decimal pl-6 marker:text-sage marker:font-semibold">{b.items.map((t, k) => <li key={k} className="pl-1"><Inline text={t} /></li>)}</ol>;
          case 'table': return (
            <div key={i} className="overflow-x-auto thin-scroll rounded-xl border border-brand-900/10">
              <table className="w-full text-sm">
                <thead className="bg-brand-900 text-ivory"><tr>{b.head.map((c, k) => <th key={k} className="px-3 py-2 text-left font-semibold"><Inline text={c} /></th>)}</tr></thead>
                <tbody>{b.rows.map((r, k) => <tr key={k} className="odd:bg-white even:bg-cream">{r.map((c, j) => <td key={j} className="px-3 py-2 border-t border-brand-900/5 align-top"><Inline text={c} /></td>)}</tr>)}</tbody>
              </table>
            </div>
          );
          default: return <p key={i}><Inline text={b.text} /></p>;
        }
      })}
    </div>
  );
}
