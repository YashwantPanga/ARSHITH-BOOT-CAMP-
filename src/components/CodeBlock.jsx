import React, { useMemo, useState } from 'react';
import { Copy, Check, Play, FileCode2 } from 'lucide-react';
import { tokenLines, detectLanguage, LANG_LABEL, isRunnable } from '../utils/highlight';
import { usePlayground } from './CodePlayground';

/**
 * Premium code block: editor-style window chrome with an optional file title and language pill,
 * a separated line-number gutter, syntax colours, copy button and a "Try it" button that opens
 * the code in the practice playground. tone="bad" / "good" tints the frame for wrong/fixed code.
 */
export default function CodeBlock({ code, label, language, courseId, compact = false, runnable = true, tone, title }) {
  const lang = useMemo(() => detectLanguage(code, language, courseId), [code, language, courseId]);
  const lines = useMemo(() => tokenLines(String(code || '').replace(/\s+$/, ''), lang), [code, lang]);
  const [copied, setCopied] = useState(false);
  const playground = usePlayground();

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked */ }
  };

  const canRun = runnable && playground && isRunnable(lang) && label !== 'diagram';
  const langLabel = LANG_LABEL[lang] || 'Code';
  const frame = tone === 'bad'
    ? 'border-rose-400/40 shadow-[0_20px_44px_-26px_rgba(190,40,70,.55)]'
    : tone === 'good'
      ? 'border-mint-300/50 shadow-[0_20px_44px_-26px_rgba(30,140,100,.55)]'
      : 'border-black/25 shadow-[0_22px_48px_-26px_rgba(12,45,38,.7)]';
  const glow = tone === 'bad' ? 'via-rose-300/60' : tone === 'good' ? 'via-mint-300/70' : 'via-brand-200/40';
  const gutterW = String(lines.length).length > 2 ? 'w-10 sm:w-12' : 'w-8 sm:w-10';

  return (
    <div className={`code-card group relative max-w-full min-w-0 rounded-xl sm:rounded-2xl overflow-hidden bg-evergreen border ${frame}`}>
      {/* top light edge */}
      <span className={`pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent ${glow} to-transparent`} aria-hidden="true" />
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-3.5 h-10 bg-gradient-to-b from-white/[0.06] to-black/10 border-b border-white/[0.06]">
        <span className="hidden sm:flex gap-1.5 shrink-0" aria-hidden="true">
          <i className="w-2.5 h-2.5 rounded-full bg-[#5F8574]" /><i className="w-2.5 h-2.5 rounded-full bg-[#90B1A2]" /><i className="w-2.5 h-2.5 rounded-full bg-[#BCD1C6]" />
        </span>
        {title ? (
          <span className="flex items-center gap-1.5 min-w-0 text-[12px] font-medium text-brand-100">
            <FileCode2 className="w-3.5 h-3.5 shrink-0 text-brand-300" aria-hidden="true" />
            <span className="truncate">{title}</span>
          </span>
        ) : (
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-300 truncate">{label || langLabel}</span>
        )}
        <span className="ml-auto flex items-center gap-1 shrink-0">
          {title && <span className="hidden sm:inline-flex items-center h-5 px-2 mr-1 rounded-full bg-white/[0.07] border border-white/10 text-[9.5px] font-bold uppercase tracking-[0.14em] text-brand-200">{label || langLabel}</span>}
          {canRun && (
            <button onClick={() => playground.open({ code: String(code), lang })} className="flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-ivory text-brand-900 text-[11px] font-bold hover:bg-white hover:-translate-y-px transition" title="Open in the practice playground">
              <Play className="w-3 h-3 fill-current" /> Try it
            </button>
          )}
          <button onClick={copy} className="flex items-center gap-1 h-6 px-2 rounded-md text-[11px] text-brand-200 hover:text-white hover:bg-white/10 transition" aria-label="Copy code">
            {copied ? <Check className="w-3.5 h-3.5 text-mint-300" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy'}
          </button>
        </span>
      </div>
      <div className={`overflow-x-auto thin-scroll ${compact ? 'max-h-72' : 'max-h-[560px]'} overflow-y-auto`}>
        <pre className="py-3 sm:py-3.5 text-[12px] sm:text-[13px] leading-[1.7] sm:leading-[1.75] text-[#E9F1EC] font-mono" style={{ tabSize: 4 }}>
          <code className="table min-w-full">
            {lines.map((toks, i) => (
              <span key={i} className="table-row hover:bg-white/[0.04] transition-colors">
                <span className={`table-cell select-none text-right pr-2 pl-2 sm:pr-3 sm:pl-3 ${gutterW} text-[11px] sm:text-[12px] text-brand-400/60 border-r border-white/[0.06]`}>{i + 1}</span>
                <span className="table-cell pl-3 sm:pl-4 pr-4 sm:pr-5 whitespace-pre">
                  {toks.length ? toks.map((t, k) => (t.t ? <span key={k} className={`tok-${t.t}`}>{t.v}</span> : <React.Fragment key={k}>{t.v}</React.Fragment>)) : ' '}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
      <div className="flex items-center justify-between px-3.5 h-7 bg-black/15 border-t border-white/[0.05] text-[10.5px] text-brand-400/80 font-mono">
        <span>{lines.length} {lines.length === 1 ? 'line' : 'lines'}</span>
        <span>{langLabel}</span>
      </div>
    </div>
  );
}
