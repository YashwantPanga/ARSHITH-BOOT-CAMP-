import React, { useEffect, useState } from 'react';
import { Laptop, X } from 'lucide-react';

const KEY = 'desktopNoticeSeen';

/** Phones and small tablets: suggest a laptop or desktop (once per visit), since the proctored exam needs one. */
export default function DesktopNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
    if (seen) return undefined;
    const small = window.matchMedia?.('(max-width: 767px)').matches;
    const touchTablet = window.matchMedia?.('(pointer: coarse) and (max-width: 1024px)').matches;
    if (!small && !touchTablet) return undefined;
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try { sessionStorage.setItem(KEY, '1'); } catch { /* storage blocked */ }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-evergreen/55 backdrop-blur-[2px] animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="desktop-notice-title" onClick={close}>
      <div className="relative w-full max-w-sm rounded-[20px] bg-white p-6 pt-7 text-center shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-3 right-3 p-2 rounded-full text-charcoal/50 hover:bg-cream" aria-label="Close"><X className="w-4 h-4" /></button>
        <span className="mx-auto w-14 h-14 rounded-full bg-brand-100 text-forest flex items-center justify-center"><Laptop className="w-7 h-7" /></span>
        <h2 id="desktop-notice-title" className="mt-4 text-[22px] font-semibold text-evergreen leading-tight">Best on a laptop or desktop</h2>
        <p className="mt-2 text-[14.5px] text-charcoal/70 leading-relaxed">
          For the best experience, open CodeLekho on a laptop or desktop. The code practice and the
          AI-proctored final assessment need a larger screen and a webcam.
        </p>
        <button onClick={close} className="font-display mt-5 w-full h-12 rounded-md bg-forest text-ivory text-[15.5px] font-semibold hover:bg-sage transition-colors">Continue on mobile</button>
      </div>
    </div>
  );
}
