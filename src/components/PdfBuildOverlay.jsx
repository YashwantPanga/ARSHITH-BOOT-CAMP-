import React, { useEffect, useState } from 'react';
import { Check, FileDown } from 'lucide-react';

const TIPS = [
  'Every code example comes with a "How this code works" panel.',
  'Diagrams are drawn as sharp vector figures - perfect for printing.',
  'Each module opens with a summary of what it contains.',
  'Code keeps its indentation and syntax colours.',
  'Your name is printed on the cover of your manual.'
];

/**
 * Full-screen "binding your manual" animation shown while the course PDF is generated.
 * progress: { step, total, label } | null.  done: shows the finished state.  Pages fly into a book;
 * the book is stamped with a check mark when the PDF is ready. Reduced-motion users see it static.
 */
export default function PdfBuildOverlay({ open, progress, done, courseTitle }) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    if (!open || done) return undefined;
    const t = setInterval(() => setTip(i => (i + 1) % TIPS.length), 2600);
    return () => clearInterval(t);
  }, [open, done]);
  if (!open) return null;

  const pct = done ? 100 : progress ? Math.min(99, Math.round((progress.step / Math.max(1, progress.total)) * 100)) : 2;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-evergreen/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label="Preparing your course PDF">
      <div className="relative w-full max-w-[420px] rounded-3xl bg-ivory shadow-2xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-100">
          <div className="h-full bg-gradient-to-r from-sage to-forest transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>

        <div className="px-7 pt-9 pb-7 text-center">
          {/* the book */}
          <div className="relative mx-auto w-[170px] h-[150px]" aria-hidden="true">
            {!done && [0, 1, 2, 3].map(i => (
              <span key={i} className="pdf-fly-page absolute left-1/2 top-1/2 w-[46px] h-[60px] -ml-[23px] -mt-[30px] rounded-[4px] bg-white border border-brand-900/10 shadow-md" style={{ animationDelay: `${i * 0.45}s` }}>
                <span className="block mx-2 mt-2 h-[3px] rounded bg-brand-200" />
                <span className="block mx-2 mt-1.5 h-[3px] w-6 rounded bg-brand-100" />
                <span className="block mx-2 mt-1.5 h-[3px] rounded bg-brand-100" />
                <span className="block mx-2 mt-1.5 h-[8px] rounded bg-evergreen/80" />
              </span>
            ))}
            <div className={`absolute left-1/2 bottom-0 -ml-[52px] w-[104px] h-[124px] [perspective:600px] ${done ? 'pdf-book-done' : 'pdf-book-breathe'}`}>
              {/* page block */}
              <div className="absolute inset-y-[6px] right-[-6px] left-[8px] rounded-r-md bg-white border border-brand-900/10" />
              <div className="absolute inset-y-[3px] right-[-3px] left-[6px] rounded-r-md bg-cream border border-brand-900/10" />
              {/* cover */}
              <div className="absolute inset-0 rounded-md rounded-l-sm bg-forest shadow-[0_14px_30px_-10px_rgba(1,58,43,.6)] overflow-hidden">
                <div className="absolute left-0 inset-y-0 w-[9px] bg-black/25" />
                <div className="absolute left-[18px] right-3 top-4 h-[3px] rounded bg-white/70" />
                <div className="absolute left-[18px] right-6 top-[22px] h-[3px] rounded bg-white/35" />
                <div className="absolute left-[18px] right-3 bottom-4 h-[18px] rounded bg-white/10" />
                <div className="absolute left-[18px] bottom-[22px] text-[7px] font-bold tracking-[0.18em] text-white/70">ARSHITH</div>
                {done && (
                  <div className="pdf-stamp absolute inset-0 flex items-center justify-center">
                    <span className="w-14 h-14 rounded-full bg-ivory text-forest flex items-center justify-center shadow-lg ring-4 ring-sage/40"><Check className="w-8 h-8" strokeWidth={3} /></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="mt-6 text-[11px] font-bold tracking-[0.18em] uppercase text-sage">{done ? 'Download complete' : 'Binding your course manual'}</p>
          <h2 className="mt-1 font-display text-2xl text-forest leading-tight">{done ? 'Your PDF is ready' : `${pct}%`}</h2>
          <p className="mt-1.5 text-sm text-charcoal/70 min-h-[20px]" aria-live="polite">
            {done ? `${courseTitle} - saved to your downloads.` : progress?.label || 'Getting started'}
          </p>
          {!done && (
            <p key={tip} className="mt-4 text-[12.5px] text-charcoal/55 animate-fade-in flex items-center justify-center gap-1.5">
              <FileDown className="w-3.5 h-3.5 shrink-0 text-sage" aria-hidden="true" />{TIPS[tip]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
