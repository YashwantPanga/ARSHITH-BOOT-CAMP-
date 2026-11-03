import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, BookOpen, Laptop, Target, X } from 'lucide-react';
import { paths } from '../../router';

const SHEET_KEY = 'arb_welcome_card_v2';
// shown once per visit (browser tab session), the first time a phone opens the site
const seen = () => { try { return sessionStorage.getItem(SHEET_KEY) === '1'; } catch { return true; } };
const mark = () => { try { sessionStorage.setItem(SHEET_KEY, '1'); } catch { /* ignore */ } };
const isPhone = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;

/** The six greens of the welcome card, darkest first. */
export const PALETTE = ['#051F20', '#0B2B26', '#163832', '#235347', '#8EB69B', '#DAF1DE'];

const WORDS = ['Python', 'SQL', 'Web Development', 'AI & Data', 'DSA'];

/** Cycles through the course names, one every 1.6s. */
function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % WORDS.length), 1600);
    return () => clearInterval(t);
  }, []);
  return <span key={i} className="welcome-word inline-block text-[#8EB69B]">{WORDS[i]}</span>;
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
      <div className="absolute inset-0 bg-[#051F20]/70 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div className="welcome-sheet relative w-full max-h-[94dvh] overflow-y-auto no-scrollbar rounded-t-[30px] text-[#DAF1DE] pb-[calc(18px+env(safe-area-inset-bottom))]"
        style={{ background: 'radial-gradient(130% 70% at 50% 0%, #235347 0%, #163832 38%, #0B2B26 68%, #051F20 100%)' }}>
        <span className="welcome-shine" aria-hidden="true" />
        <span className="mx-auto mt-2.5 block w-10 h-1 rounded-full bg-[#DAF1DE]/30" aria-hidden="true" />
        <button onClick={onClose} className="absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-[#DAF1DE]/15 border border-[#DAF1DE]/25 text-[#DAF1DE] flex items-center justify-center active:scale-95 transition" aria-label="Close"><X className="w-4 h-4" /></button>

        {/* the palette: six stacked pills that slide up one after another, then fan out */}
        <div className="relative mx-auto mt-4 h-[118px] w-[78%] max-w-[300px]" aria-hidden="true">
          {PALETTE.map((c, i) => (
            <span key={c} className="welcome-pill absolute inset-x-0 h-[52px] rounded-full border border-white/10"
              style={{ background: `linear-gradient(180deg, ${c}, ${PALETTE[Math.max(0, i - 1)]})`, top: `${i * 13}px`, zIndex: i, '--d': `${120 + i * 90}ms`,
                boxShadow: `0 -6px 18px -8px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,${i > 3 ? 0.5 : 0.12})` }} />
          ))}
          <span className="welcome-badge absolute left-1/2 -translate-x-1/2 bottom-[-6px] z-10 px-3 py-1 rounded-full bg-[#051F20] border border-[#8EB69B]/50 text-[10.5px] font-bold tracking-[0.2em] text-[#DAF1DE] whitespace-nowrap">100% FREE</span>
        </div>

        <div className="px-6 text-center">
          <p className="welcome-up mt-6 text-[11px] font-bold tracking-[0.24em] text-[#8EB69B]" style={{ '--d': '650ms' }}>ENROLL FREE · LEARN · GET HIRED</p>
          <h2 id="welcome-title" className="welcome-up mt-2 font-display text-[28px] leading-[1.12] font-extrabold text-white" style={{ '--d': '730ms' }}>
            Crack any job<span className="block h-[34px] overflow-hidden whitespace-nowrap text-[26px]">with <RotatingWord /></span>
          </h2>
          <p className="welcome-up mt-2 text-[14px] leading-snug text-[#DAF1DE]/75" style={{ '--d': '810ms' }}>Learn free, practise real interview questions and earn a certificate that proves it.</p>
        </div>

        <ul className="mt-4 mx-5 grid gap-2">
          {perks.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="welcome-up flex items-center gap-3 rounded-2xl bg-[#DAF1DE]/[.07] border border-[#DAF1DE]/[.12] px-3 py-2.5" style={{ '--d': `${900 + i * 90}ms` }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: PALETTE[3 - i] }}><Icon className="w-5 h-5 text-[#DAF1DE]" /></span>
              <span className="min-w-0 text-left">
                <span className="block text-[14.5px] font-semibold text-white leading-tight">{title}</span>
                <span className="block text-[12.5px] text-[#DAF1DE]/65 leading-snug">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="welcome-up px-5 mt-4 grid gap-2.5" style={{ '--d': '1200ms' }}>
          <button onClick={() => go(signedIn ? paths.dashboard() : paths.register())}
            className="welcome-cta relative overflow-hidden w-full h-[52px] rounded-2xl bg-gradient-to-b from-[#DAF1DE] to-[#8EB69B] text-[#051F20] font-display font-bold text-[17px] shadow-[0_4px_0_#235347,0_16px_30px_-12px_rgba(142,182,155,.7)] active:translate-y-[3px] active:shadow-[0_1px_0_#235347] transition">
            {signedIn ? 'Continue learning' : 'Enroll for free'}
          </button>
          <button onClick={() => go(paths.interview())} className="w-full h-11 rounded-2xl border border-[#8EB69B]/45 text-[#DAF1DE] font-semibold text-[14.5px] active:bg-white/5 transition">See Interview Prep</button>
        </div>
        <p className="welcome-up mt-3 px-6 flex items-center justify-center gap-1.5 text-[11.5px] text-[#DAF1DE]/55" style={{ '--d': '1300ms' }}>
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
