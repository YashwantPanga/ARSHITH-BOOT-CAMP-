import React, { useState } from 'react';
import { Check, Copy, Lightbulb } from 'lucide-react';
import { Inline } from '../lesson/Markdown';
import { LANG_LABEL } from '../../../shared/interview/codeLang.js';

/**
 * Plain-text answer format used by Interview Prep:
 * - blank lines separate paragraphs;
 * - a run of lines starting with "- " is a bullet list, "1. " a numbered list;
 * - ```lang fences hold code; "Interview tip: ..." becomes a highlighted note.
 * Inline `code` and **bold** are handled by <Inline>.
 */
function parse(text) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n');
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
      blocks.push({ type: 'code', lang: fence[1] || 'text', text: buf.join('\n') });
      continue;
    }
    if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) items.push(lines[i++].slice(2));
      blocks.push({ type: 'ul', items });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ''));
      blocks.push({ type: 'ol', items });
      continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(```|- |\d+\. )/.test(lines[i])) buf.push(lines[i++]);
    const p = buf.join(' ');
    const tip = p.match(/^Interview tip:\s*/);
    blocks.push(tip ? { type: 'tip', text: p.slice(tip[0].length) } : { type: 'p', text: p });
  }
  return blocks;
}

export function CodeBox({ code, lang = 'text', className = 'mt-4' }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ }
  };
  return (
    <div className={`${className} rounded-xl overflow-hidden border border-[#0C2D26]/80 bg-[#0C2D26] max-w-full`}>
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-1.5 bg-[#123A31] border-b border-white/10">
        <span className="text-[11.5px] font-semibold tracking-wide uppercase text-[#9FC3B3]">{LANG_LABEL[lang] || lang}</span>
        <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[12px] text-[#CFE3D9] hover:text-white" aria-label="Copy code">
          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="p-3.5 sm:p-4 text-[12.5px] sm:text-[13px] leading-[1.65] sm:leading-6 overflow-x-auto thin-scroll font-mono text-[#E8F1EC]"><code>{code}</code></pre>
    </div>
  );
}

const TEXT = 'text-[15px] sm:text-[15.5px] leading-[1.75] text-charcoal/85';

export default function AnswerText({ text, className = '' }) {
  return parse(text).map((b, i) => {
    if (b.type === 'code') return <CodeBox key={i} code={b.text} lang={b.lang} className="" />;
    if (b.type === 'ul') {
      return (
        <ul key={i} className="space-y-2 pl-1">
          {b.items.map((t, j) => <li key={j} className={`flex gap-3 ${TEXT} ${className}`}><span className="mt-[11px] w-1.5 h-1.5 rounded-full bg-forest/70 shrink-0" /><span className="min-w-0"><Inline text={t} /></span></li>)}
        </ul>
      );
    }
    if (b.type === 'ol') {
      return (
        <ol key={i} className="space-y-2 pl-1">
          {b.items.map((t, j) => <li key={j} className={`flex gap-3 ${TEXT} ${className}`}><span className="mt-[3px] w-6 h-6 rounded-full bg-forest/10 text-forest text-[12.5px] font-semibold flex items-center justify-center shrink-0 tabular-nums">{j + 1}</span><span className="min-w-0"><Inline text={t} /></span></li>)}
        </ol>
      );
    }
    if (b.type === 'tip') {
      return (
        <div key={i} className="flex gap-3 rounded-xl border-l-4 border-forest bg-forest/[.06] px-4 py-3">
          <Lightbulb className="w-4 h-4 mt-1 text-forest shrink-0" />
          <p className={`${TEXT} ${className}`}><span className="font-semibold text-evergreen">Interview tip: </span><Inline text={b.text} /></p>
        </div>
      );
    }
    return <p key={i} className={`${TEXT} ${className}`}><Inline text={b.text} /></p>;
  });
}
