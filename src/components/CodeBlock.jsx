import React, { useMemo, useState } from 'react';
import { Copy, Check, Play } from 'lucide-react';
import { tokenLines, detectLanguage, LANG_LABEL, isRunnable } from '../utils/highlight';
import { usePlayground } from './CodePlayground';

/**
 * Premium code block: window chrome, language tag, line numbers, syntax colours,
 * copy button and a "Try it" button that opens the code in the practice playground.
 */
export default function CodeBlock({ code, label, language, courseId, compact = false, runnable = true, tone }) {
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
  const edge = tone === 'bad' ? 'ring-1 ring-rose-400/40' : tone === 'good' ? 'ring-1 ring-mint-300/50' : '';

  return (
    <div className={`rounded-xl overflow-hidden bg-evergreen border border-black/20 shadow-[0_18px_40px_-24px_rgba(12,45,38,.6)] ${edge}`}>
      <div className="flex items-center gap-3 px-3.5 h-9 bg-black/20 border-b border-white/5">
        <span className="flex gap-1.5" aria-hidden="true">
          <i className="w-2.5 h-2.5 rounded-full bg-[#5F8574]" /><i className="w-2.5 h-2.5 rounded-full bg-[#90B1A2]" /><i className="w-2.5 h-2.5 rounded-full bg-[#BCD1C6]" />
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-300">{label || LANG_LABEL[lang] || 'Code'}</span>
        <span className="ml-auto flex items-center gap-1">
          {canRun && (
            <button onClick={() => playground.open({ code: String(code), lang })} className="flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-ivory text-brand-900 text-[11px] font-bold hover:bg-white transition" title="Open in the practice playground">
              <Play className="w-3 h-3 fill-current" /> Try it
            </button>
          )}
          <button onClick={copy} className="flex items-center gap-1 h-6 px-2 rounded-md text-[11px] text-brand-200 hover:text-white hover:bg-white/10 transition" aria-label="Copy code">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy'}
          </button>
        </span>
      </div>
      <div className={`overflow-x-auto thin-scroll ${compact ? 'max-h-72' : 'max-h-[560px]'} overflow-y-auto`}>
        <pre className="py-3 text-[13px] leading-[1.7] text-[#E9F1EC] font-mono" style={{ tabSize: 4 }}>
          <code className="table min-w-full">
            {lines.map((toks, i) => (
              <span key={i} className="table-row hover:bg-white/[0.03]">
                <span className="table-cell select-none text-right pr-4 pl-4 text-brand-400/70 w-10 text-[12px]">{i + 1}</span>
                <span className="table-cell pr-5 whitespace-pre">
                  {toks.length ? toks.map((t, k) => (t.t ? <span key={k} className={`tok-${t.t}`}>{t.v}</span> : <React.Fragment key={k}>{t.v}</React.Fragment>)) : ' '}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
