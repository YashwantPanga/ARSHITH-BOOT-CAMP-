import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Award, BookOpen, Code2, ListChecks, MonitorCheck, Target, X } from 'lucide-react';
import { paths } from '../../router';
import { INTERVIEW_SETS } from '../../../shared/interview/index.js';

// Phones, browsing pages only (never over a lesson, dashboard or form). Visitors see it once per visit;
// signed-in learners see it once ever. It also tells DesktopNotice not to open, so popups never stack.
const PAGES = ['home', 'courses', 'categories', 'interview'];
const KEY = 'arb_welcome_card';
export const DESKTOP_NOTICE_KEY = 'desktopNoticeSeen';
const QUESTION_COUNT = INTERVIEW_SETS.reduce((n, s) => n + s.items.length, 0);

const PILLS = [
  { label: 'Free courses', icon: BookOpen, cls: 'bg-pine-950 text-pine-300' },
  { label: 'Live code practice', icon: Code2, cls: 'bg-pine-900 text-pine-300' },
  { label: 'Quiz after every module', icon: ListChecks, cls: 'bg-pine-800 text-pine-300' },
  { label: 'Proctored final', icon: MonitorCheck, cls: 'bg-pine-700 text-pine-100' },
  { label: 'Verified certificate', icon: Award, cls: 'bg-pine-300 text-pine-950' }
];

function Card({ onClose, navigate, signedIn }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const go = (to) => { onClose(); navigate(to); };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="absolute inset-0 bg-pine-950/75 backdrop-blur-[3px] animate-fade-in" onClick={onClose} />
      <div className="wc-card relative w-full max-w-[380px] overflow-hidden rounded-[30px] bg-gradient-to-b from-pine-800 via-pine-900 to-pine-950 text-white shadow-[0_40px_80px_-30px_rgba(0,0,0,.9)] ring-1 ring-white/10">
        <span className="wc-beam pointer-events-none absolute -left-24 -top-32 w-[22rem] h-[22rem] rounded-full bg-pine-100/30 blur-3xl" aria-hidden="true" />
        <button onClick={onClose} className="absolute right-3.5 top-3.5 z-10 w-9 h-9 rounded-full bg-white/10 text-pine-100 flex items-center justify-center active:bg-white/20" aria-label="Close"><X className="w-4 h-4" /></button>

        <div className="relative px-5 pt-6">
          <p className="wc-fade text-[11px] font-bold uppercase tracking-[0.22em] text-pine-300" style={{ animationDelay: '150ms' }}>Welcome to CodeLekho</p>
          <h2 id="welcome-title" className="wc-fade mt-1.5 font-display text-[28px] font-bold leading-[1.1]" style={{ animationDelay: '230ms' }}>
            Enroll free.<br /><span className="wc-shine">Crack any job.</span>
          </h2>
        </div>

        {/* the stacked pills drop in one by one, the last (lightest) one is Interview Prep */}
        <div className="relative mt-4 px-5" aria-hidden="true">
          {PILLS.map(({ label, icon: Icon, cls }, i) => (
            <div key={label} className={`wc-pill relative flex items-center gap-2.5 h-[46px] -mt-3 first:mt-0 rounded-full px-4 pt-1 shadow-[0_10px_18px_-10px_rgba(0,0,0,.8)] ring-1 ring-white/5 ${cls}`}
              style={{ animationDelay: `${380 + i * 110}ms`, zIndex: i + 1 }}>
              <Icon className="w-4 h-4 opacity-90" />
              <span className="text-[13px] font-semibold">{label}</span>
            </div>
          ))}
          <div className="wc-pill wc-hero relative -mt-3 rounded-[26px] bg-pine-100 text-pine-950 px-4 py-4 shadow-[0_18px_30px_-14px_rgba(0,0,0,.9)]" style={{ animationDelay: `${380 + PILLS.length * 110}ms`, zIndex: 10 }}>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-pine-700 to-pine-950 text-pine-100 flex items-center justify-center"><Target className="w-5 h-5" /></span>
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-pine-700">New · Interview Prep</p>
                <p className="font-display text-[17px] font-bold leading-tight">{QUESTION_COUNT} real interview questions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative px-5 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
          <button onClick={() => go(signedIn ? paths.dashboard() : paths.register())}
            className="wc-fade wc-cta relative overflow-hidden w-full h-[52px] rounded-2xl bg-pine-100 text-pine-950 font-display text-[16.5px] font-bold inline-flex items-center justify-center gap-2 active:scale-[.98] transition"
            style={{ animationDelay: '1150ms' }}>
            {signedIn ? 'Continue learning' : 'Enroll for free'} <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => go(paths.interview())} className="wc-fade mt-2 w-full h-11 rounded-2xl text-pine-100 text-[14.5px] font-semibold ring-1 ring-pine-300/30 active:bg-white/5 transition" style={{ animationDelay: '1230ms' }}>
            Explore Interview Prep
          </button>
          <p className="wc-fade mt-3 text-center text-[11.5px] text-pine-100/55" style={{ animationDelay: '1300ms' }}>Tip: take the proctored final on a laptop with a webcam.</p>
        </div>
      </div>
    </div>
  );
}

/** Phones: an animated welcome card the first time the site opens in a visit. */
export default function WelcomeCard({ navigate, signedIn, routeName }) {
  const [open, setOpen] = useState(false);
  const onPage = PAGES.includes(routeName);
  useEffect(() => {
    const storage = () => (signedIn ? localStorage : sessionStorage);
    let seen = false;
    try { seen = storage().getItem(KEY) === '1' || sessionStorage.getItem(KEY) === '1'; } catch { seen = true; }
    const phone = window.matchMedia?.('(max-width: 767px)').matches;
    if (seen || !phone || !onPage) return undefined;
    const t = setTimeout(() => {
      // opens before the laptop notice (700 ms) and keeps it closed; its tip is inside this card
      try { storage().setItem(KEY, '1'); sessionStorage.setItem(KEY, '1'); sessionStorage.setItem(DESKTOP_NOTICE_KEY, '1'); } catch { /* storage blocked */ }
      setOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, [onPage, signedIn]);
  // on <body>: the page wrapper is transformed by its enter animation, which would trap a fixed overlay
  return open ? createPortal(<Card navigate={navigate} signedIn={signedIn} onClose={() => setOpen(false)} />, document.body) : null;
}
