import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, BookOpen, Code2, Laptop, Target, X } from 'lucide-react';
import { paths } from '../../router';

const SHEET_KEY = 'arb_welcome_card_v3';
// shown once per visit (browser tab session), the first time a phone opens the site
const seen = () => { try { return sessionStorage.getItem(SHEET_KEY) === '1'; } catch { return true; } };
const mark = () => { try { sessionStorage.setItem(SHEET_KEY, '1'); } catch { /* ignore */ } };
const isPhone = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;

/** The welcome card's own palette (lime to deep forest). The rest of the site keeps its colours. */
export const PALETTE = { cream: '#FFFDEE', mint: '#E2FBCE', lime: '#E3EF26', green: '#076653', forest: '#0C342C', night: '#06231D' };
const P = PALETTE;
/** The four gradients of the palette, light to dark: one per fanned card. */
const GRADIENTS = [
  `linear-gradient(180deg, ${P.cream}, ${P.lime})`,
  `linear-gradient(180deg, ${P.mint}, ${P.lime} 45%, ${P.green})`,
  `linear-gradient(180deg, ${P.lime}, ${P.green} 50%, ${P.forest})`,
  `linear-gradient(180deg, ${P.green}, ${P.forest} 55%, ${P.night})`
];
const CARDS = [
  { label: 'Learn', ink: P.green, icon: BookOpen },
  { label: 'Practise', ink: P.forest, icon: Code2 },
  { label: 'Crack', ink: P.cream, icon: Target },
  { label: 'Get hired', ink: P.lime, icon: Award }
];

const WORDS = ['Python', 'SQL', 'Web Development', 'AI & Data', 'DSA'];

/** Cycles through the course names, one every 1.6s. */
function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % WORDS.length), 1600);
    return () => clearInterval(t);
  }, []);
  return <span key={i} className="welcome-word inline-block" style={{ color: P.lime }}>{WORDS[i]}</span>;
}

function WelcomeCard({ onClose, navigate, signedIn }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);
  const go = (to) => { onClose(); navigate(to); };
  const perks = [
    { icon: BookOpen, title: 'Free certificate courses', text: 'Python, SQL, Web Dev and AI' },
    { icon: Target, title: 'Interview Prep', text: '350+ coding problems and interview questions' },
    { icon: Award, title: 'QR-verified certificate', text: 'Share it with any recruiter' }
  ];

  return (
    <div className="fixed inset-0 z-[125] flex items-end" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div className="welcome-sheet relative w-full max-h-[94dvh] overflow-y-auto no-scrollbar rounded-t-[28px] text-white pb-[calc(18px+env(safe-area-inset-bottom))]"
        style={{ background: `linear-gradient(180deg, ${P.green} 0%, ${P.forest} 42%, ${P.night} 100%)` }}>
        {/* hero band: the four palette gradients as cards that rise and fan out */}
        <div className="relative h-[200px] overflow-hidden" style={{ background: `radial-gradient(90% 85% at 50% 100%, ${P.lime}55 0%, transparent 60%), linear-gradient(180deg, ${P.forest}, ${P.green})` }}>
          <span className="welcome-shine" aria-hidden="true" />
          <span className="absolute left-1/2 top-2.5 -translate-x-1/2 w-10 h-1 rounded-full bg-white/35" aria-hidden="true" />
          <button onClick={onClose} className="absolute right-4 top-4 z-20 w-9 h-9 rounded-full bg-black/25 border border-white/25 text-white flex items-center justify-center active:scale-95 transition" aria-label="Close"><X className="w-4 h-4" /></button>
          <div className="absolute inset-x-0 bottom-[-30px] flex justify-center" aria-hidden="true">
            {CARDS.map(({ label, ink, icon: Icon }, i) => (
              <span key={label} className="welcome-card-fan relative -mx-2.5 w-[78px] h-[168px] rounded-[18px] border border-white/25 flex flex-col items-center justify-start gap-2.5 py-3 shadow-[0_18px_30px_-14px_rgba(0,0,0,.7)]"
                style={{ background: GRADIENTS[i], color: ink, zIndex: i === 1 || i === 2 ? 2 : 1, '--r': `${(i - 1.5) * 9}deg`, '--y': `${Math.abs(i - 1.5) * 14}px`, '--d': `${150 + i * 110}ms` }}>
                <Icon className="w-5 h-5" strokeWidth={2.3} />
                <span className="font-display text-[13px] font-extrabold tracking-wide [writing-mode:vertical-rl] rotate-180">{label}</span>
              </span>
            ))}
          </div>
          <span className="welcome-badge absolute left-1/2 top-7 z-10 px-3 py-1 rounded-full text-[10.5px] font-extrabold tracking-[0.2em] whitespace-nowrap shadow-[0_6px_16px_-6px_rgba(0,0,0,.5)]" style={{ background: P.lime, color: P.night }}>100% FREE</span>
        </div>

        <div className="relative px-6 pt-7 text-center">
          <p className="welcome-up text-[11px] font-bold tracking-[0.24em]" style={{ color: P.mint, '--d': '650ms' }}>ENROLL FREE · LEARN · GET HIRED</p>
          <h2 id="welcome-title" className="welcome-up mt-2 font-display text-[28px] leading-[1.12] font-extrabold" style={{ '--d': '730ms' }}>
            Crack any job<span className="block h-[34px] overflow-hidden whitespace-nowrap text-[26px]">with <RotatingWord /></span>
          </h2>
          <p className="welcome-up mt-2 text-[14px] leading-snug text-white/70" style={{ '--d': '810ms' }}>Learn free, practise real interview questions and earn a certificate that proves it.</p>
        </div>

        <ul className="mt-4 mx-5 grid gap-2">
          {perks.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="welcome-up flex items-center gap-3 rounded-2xl bg-white/[.06] border border-white/10 px-3 py-2.5" style={{ '--d': `${900 + i * 90}ms` }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENTS[i + 1] }}><Icon className="w-5 h-5" style={{ color: i === 0 ? P.forest : P.cream }} /></span>
              <span className="min-w-0 text-left">
                <span className="block text-[14.5px] font-semibold leading-tight">{title}</span>
                <span className="block text-[12.5px] text-white/60 leading-snug">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="welcome-up px-5 mt-4 grid gap-2.5" style={{ '--d': '1200ms' }}>
          <button onClick={() => go(signedIn ? paths.dashboard() : paths.register())}
            className="welcome-cta relative overflow-hidden w-full h-[52px] rounded-2xl font-display font-bold text-[17px] active:translate-y-[3px] transition"
            style={{ background: `linear-gradient(180deg, ${P.mint}, ${P.lime})`, color: P.night, boxShadow: `0 4px 0 ${P.green}, 0 16px 30px -12px ${P.lime}99` }}>
            {signedIn ? 'Continue learning' : 'Enroll for free'}
          </button>
          <button onClick={() => go(paths.interview())} className="w-full h-11 rounded-2xl border text-[14.5px] font-semibold active:bg-white/5 transition" style={{ borderColor: `${P.lime}66`, color: P.mint }}>See Interview Prep</button>
        </div>
        <p className="welcome-up mt-3 px-6 flex items-center justify-center gap-1.5 text-[11.5px] text-white/50" style={{ '--d': '1300ms' }}>
          <Laptop className="w-3.5 h-3.5 shrink-0" /> The proctored final needs a laptop and webcam.
        </p>
      </div>
    </div>
  );
}

/** Phones, first page of a visit: the animated welcome card in the green palette. */
export default function PromoStory({ navigate, signedIn = false, enabled = true }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled || !isPhone() || seen()) return undefined;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [enabled]);
  const close = useCallback(() => { mark(); setOpen(false); }, []);
  // rendered on <body>: the page wrapper animates (transform), which would trap a fixed overlay
  return open ? createPortal(<WelcomeCard navigate={navigate} signedIn={signedIn} onClose={close} />, document.body) : null;
}
