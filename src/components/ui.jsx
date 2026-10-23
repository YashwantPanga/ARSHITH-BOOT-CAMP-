import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, type = 'info', ms = 3800) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ms);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed z-[200] top-20 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => {
          const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertTriangle : Info;
          const tone = t.type === 'success'
            ? 'border-mint-300 text-mint-500'
            : t.type === 'error' ? 'border-rose-200 text-rose-600' : 'border-brand-200 text-brand-600';
          return (
            <div key={t.id} className={`pointer-events-auto animate-fade-up bg-white border ${tone} shadow-card-hover rounded-2xl px-4 py-3 flex items-start gap-3`}>
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 font-medium flex-1">{t.message}</p>
              <button onClick={() => setToasts(x => x.filter(y => y.id !== t.id))} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Modal shell + confirm dialog                                        */
/* ------------------------------------------------------------------ */
export function Modal({ open, onClose, children, maxWidth = 'max-w-md', dismissable = true }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && dismissable) onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismissable, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-evergreen/60 backdrop-blur-sm animate-fade-in" onClick={() => dismissable && onClose?.()} />
      <div className={`relative w-full ${maxWidth} bg-white rounded-3xl shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto`}>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary', onConfirm, onCancel, busy = false }) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="p-6 sm:p-7">
        <h3 className="text-lg font-bold text-brand-900">{title}</h3>
        <div className="text-sm text-slate-600 mt-2 leading-relaxed">{message}</div>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-6">
          <button className="btn-outline" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className={tone === 'danger' ? 'btn bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Decorative confetti triangles (reference template motif)            */
/* ------------------------------------------------------------------ */
const DEFAULT_TRIS = [
  { c: 'tri-orange', s: { top: '8%', left: '4%' }, r: 15 },
  { c: 'tri-green', s: { top: '4%', left: '46%' }, r: -10 },
  { c: 'tri-purple', s: { top: '38%', right: '3%' }, r: 0 },
  { c: 'tri-amber', s: { bottom: '12%', left: '30%' }, r: 20 },
  { c: 'tri-orange', s: { bottom: '6%', right: '18%' }, r: -25 },
  { c: 'tri-purple', s: { bottom: '30%', left: '2%' }, r: 180 }
];

export function Triangles({ items = DEFAULT_TRIS, className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {items.map((t, i) => (
        <span key={i} className="absolute animate-drift" style={{ ...t.s, animationDelay: `${i * 0.7}s` }}>
          <span className={`tri ${t.c} relative block`} style={{ transform: `rotate(${t.r}deg)` }} />
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll                                                    */
/* ------------------------------------------------------------------ */
export function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('is-visible'); io.disconnect(); }
    }, { threshold: 0.01, rootMargin: '0px 0px -30px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */
export function SafeImg({ src, alt = '', className = '', fallbackClass = 'bg-gradient-to-br from-brand-900 via-brand-700 to-sage' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className={`${className} ${fallbackClass}`} role="img" aria-label={alt} />;
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

export function ProgressBar({ value = 0, className = '', tone = 'peach' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const bar = tone === 'mint' ? 'bg-mint-400' : tone === 'plum' ? 'bg-sage' : 'bg-gradient-to-r from-brand-900 to-sage';
  return (
    <div className={`h-2 w-full bg-brand-100/70 rounded-full overflow-hidden ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full ${bar} rounded-full transition-[width] duration-700 ease-out`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ value = 0, size = 56, stroke = 6, label, dark = false }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={dark ? 'rgba(251,248,241,.18)' : '#DDE8E2'} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={dark ? '#BCD1C6' : '#013A2B'} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <span className={`absolute text-xs font-bold ${dark ? 'text-white' : 'text-brand-900'}`}>{label ?? `${pct}%`}</span>
    </div>
  );
}

/** eduleb "section-top" page banner: centered title, optional text and a Home / page breadcrumb. */
export function PageTop({ title, crumb, eyebrow, onHome, children }) {
  return (
    <section className="relative overflow-hidden bg-cream border-b border-brand-900/10">
      <div className="absolute inset-0 edu-shape pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
        {eyebrow && <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">{eyebrow}</p>}
        <h1 className="mt-2 text-[34px] sm:text-[48px] font-bold leading-tight text-evergreen">{title}</h1>
        {children}
        <nav aria-label="Breadcrumb" className="mt-5 font-display text-[15.5px] text-evergreen">
          {onHome ? <button onClick={onHome} className="font-semibold text-sage hover:underline">Home</button> : <span className="font-semibold text-sage">Home</span>}
          <span className="mx-2 text-charcoal/40">/</span>{crumb || title}
        </nav>
      </div>
    </section>
  );
}

export function Logo({ onClick, light = false, className = '' }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 group ${className}`} aria-label="Arshith Bootcamp home">
      <img
        src={light ? '/arshith-bootcamp-logo-white.png' : '/arshith-bootcamp-logo.png'}
        alt="Arshith Bootcamp"
        className="h-11 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </button>
  );
}

export function Spinner({ className = 'w-6 h-6' }) {
  return <span className={`inline-block ${className} border-[3px] border-brand-100 border-t-brand-900 rounded-full animate-spin`} />;
}

/** Brand loader – a sapling growing inside a ring (same art as the splash screen). */
export function BrandLoader({ size = 72, label }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-label={label || 'Loading'}>
      <div className="arb-loader" style={{ width: size, height: size }} aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <circle className="ring" cx="50" cy="50" r="46" />
          <circle className="ring-arc" cx="50" cy="50" r="46" />
          <path className="stem" d="M50 74 C50 62 50 52 50 40" />
          <path className="leaf leaf-l" d="M50 56 C40 56 32 50 30 40 C40 40 48 46 50 56Z" />
          <path className="leaf leaf-r" d="M50 46 C60 46 68 40 70 30 C60 30 52 36 50 46Z" />
          <circle className="seed" cx="50" cy="76" r="3" />
        </svg>
      </div>
      {label && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">{label}</p>}
    </div>
  );
}

export function PageLoader({ label = 'Loading' }) {
  return <div className="min-h-[60vh] flex items-center justify-center"><BrandLoader label={label} /></div>;
}
