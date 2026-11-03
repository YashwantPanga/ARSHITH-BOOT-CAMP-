import React, { useEffect, useMemo, useRef, useState } from 'react';
import { tokenLines } from '../utils/highlight';

/**
 * Lightweight code editor: a transparent textarea over a syntax-highlighted <pre>, with line
 * numbers, Tab = 4 spaces and Ctrl/Cmd + Enter to run. Used by the Practice Lab and exercises.
 * The <pre> and the textarea share exactly the same box (left offset, padding, font), so the caret
 * always sits on the visible character; the line numbers are a separate column kept in step.
 * On touch screens long lines wrap (no sideways scrolling) and the line numbers are left out, since
 * wrapped lines no longer line up with a number column.
 */
const PAD_Y = 12;   // px, top/bottom padding of both layers
const PAD_X = 14;   // px, gap between the line numbers and the code
// Touch screens get 16px code: iPhones zoom into any text field smaller than that when it is tapped,
// and the page then stays zoomed in.
const TOUCH = '(pointer: coarse)';

function useFontSize() {
  const pick = () => (typeof window !== 'undefined' && window.matchMedia?.(TOUCH).matches ? 16 : 13);
  const [size, setSize] = useState(pick);
  useEffect(() => {
    const mq = window.matchMedia?.(TOUCH);
    if (!mq) return undefined;
    const onChange = () => setSize(pick());
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return size;
}

export default function CodeEditor({ value, onChange, lang, onRun, minHeight = 220, label = 'Code editor', className = '', light = false }) {
  const preRef = useRef(null);
  const gutterRef = useRef(null);
  const lines = useMemo(() => tokenLines(value, lang), [value, lang]);
  const fontSize = useFontSize();
  const wrap = fontSize === 16; // touch screen
  const LINE = fontSize * 1.7; // px, line height of the code
  const gutter = wrap ? 0 : String(lines.length).length > 2 ? 48 : 40; // px

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
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) { preRef.current.scrollTop = scrollTop; preRef.current.scrollLeft = scrollLeft; }
    if (gutterRef.current) gutterRef.current.scrollTop = scrollTop;
  };

  const layer = { padding: wrap ? `${PAD_Y}px ${PAD_X}px` : `${PAD_Y}px 24px ${PAD_Y}px ${PAD_X}px`, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit', tabSize: 4, letterSpacing: 0 };
  return (
    <div className={`relative font-mono leading-[1.7] ${light ? 'bg-white code-light' : 'bg-evergreen'} ${className}`} style={{ minHeight, fontSize }}>
      {!wrap && <div ref={gutterRef} aria-hidden="true" className="absolute top-0 bottom-0 left-0 overflow-hidden select-none text-right text-brand-400/70 text-[12px]" style={{ width: gutter, paddingTop: PAD_Y }}>
        {lines.map((_, i) => <div key={i} className="pr-1" style={{ height: LINE, lineHeight: `${LINE}px` }}>{i + 1}</div>)}
      </div>}
      <pre ref={preRef} aria-hidden="true" className={`absolute top-0 bottom-0 right-0 overflow-hidden m-0 ${light ? 'text-[#1F2D28]' : 'text-[#E9F1EC]'} pointer-events-none ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`} style={{ left: gutter, ...layer }}>
        {lines.map((toks, i) => (
          <div key={i}>{toks.length ? toks.map((t, k) => (t.t ? <span key={k} className={`tok-${t.t}`}>{t.v}</span> : <React.Fragment key={k}>{t.v}</React.Fragment>)) : ' '}</div>
        ))}
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
        wrap={wrap ? 'soft' : 'off'}
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        aria-label={label}
        className={`absolute top-0 bottom-0 right-0 m-0 border-0 resize-none bg-transparent text-transparent ${light ? 'caret-charcoal selection:bg-brand-200/60' : 'caret-ivory selection:bg-white/20'} outline-none ${wrap ? 'whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden no-scrollbar' : 'whitespace-pre overflow-auto thin-scroll'} focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300`}
        style={{ left: gutter, width: `calc(100% - ${gutter}px)`, ...layer }}
      />
    </div>
  );
}
