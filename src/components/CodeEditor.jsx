import React, { useMemo, useRef } from 'react';
import { tokenLines } from '../utils/highlight';

/**
 * Lightweight code editor: a transparent textarea over a syntax-highlighted <pre>, with line
 * numbers, Tab = 4 spaces and Ctrl/Cmd + Enter to run. Used by the Practice Lab and exercises.
 */
export default function CodeEditor({ value, onChange, lang, onRun, minHeight = 220, label = 'Code editor', className = '' }) {
  const preRef = useRef(null);
  const lines = useMemo(() => tokenLines(value, lang), [value, lang]);
  const gutter = String(lines.length).length > 2 ? '3rem' : '2.5rem';

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); onRun?.(); return; }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: s, selectionEnd: en } = ta;
      onChange(value.slice(0, s) + '    ' + value.slice(en));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
    }
  };
  const syncScroll = (e) => {
    if (preRef.current) { preRef.current.scrollTop = e.currentTarget.scrollTop; preRef.current.scrollLeft = e.currentTarget.scrollLeft; }
  };

  return (
    <div className={`relative font-mono text-[13px] leading-[1.7] bg-evergreen ${className}`} style={{ minHeight }}>
      <pre ref={preRef} aria-hidden="true" className="absolute inset-0 overflow-hidden m-0 py-3 text-[#E9F1EC] pointer-events-none">
        <code className="table min-w-full">
          {lines.map((toks, i) => (
            <span key={i} className="table-row">
              <span className="table-cell select-none text-right pl-3 pr-4 text-brand-400/70 text-[12px]" style={{ width: gutter }}>{i + 1}</span>
              <span className="table-cell whitespace-pre pr-6">{toks.length ? toks.map((t, k) => (t.t ? <span key={k} className={`tok-${t.t}`}>{t.v}</span> : <React.Fragment key={k}>{t.v}</React.Fragment>)) : ' '}</span>
            </span>
          ))}
        </code>
      </pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        wrap="off"
        aria-label={label}
        className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-ivory outline-none py-3 pr-6 whitespace-pre overflow-auto thin-scroll selection:bg-white/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300"
        style={{ paddingLeft: `calc(${gutter} + 1.75rem)`, tabSize: 4, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
      />
    </div>
  );
}
