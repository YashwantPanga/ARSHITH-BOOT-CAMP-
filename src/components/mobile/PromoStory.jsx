import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Code2, Laptop, X } from 'lucide-react';
import { paths } from '../../router';
import { CodingSticker, InterviewSticker } from './Stickers';

const SHEET_KEY = 'arb_welcome_card_v4';
// shown once per visit (browser tab session), the first time a phone opens the site
const seen = () => { try { return sessionStorage.getItem(SHEET_KEY) === '1'; } catch { return true; } };
const mark = () => { try { sessionStorage.setItem(SHEET_KEY, '1'); } catch { /* ignore */ } };
const isPhone = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;

/** The welcome card's own palette (lime to deep forest). The rest of the site keeps its colours. */
export const PALETTE = { cream: '#FFFDEE', mint: '#E2FBCE', lime: '#E3EF26', green: '#076653', forest: '#0C342C', night: '#06231D' };
const P = PALETTE;

/* ------------------------------------------------------------------ */
/* The story: four scenes that loop, like a product promo sheet         */
/* ------------------------------------------------------------------ */

const SCENES = 4;
const SCENE_MS = 2400;

/** Scene 1: two things that go together, in a zig-zag with a "+" between them. */
function ScenePair() {
  return (
    <div className="ws-scene relative h-full flex flex-col justify-center gap-1 px-1">
      <div className="ws-from-left flex items-center gap-4">
        <span className="relative w-[118px] h-[86px] shrink-0 rounded-2xl overflow-hidden border border-white/15 shadow-[0_14px_26px_-12px_rgba(0,0,0,.8)]">
          <img src="/course-cards/python-programming.webp" alt="" className="w-full h-full object-cover" />
        </span>
        <span className="text-left">
          <span className="block font-display text-[19px] font-bold leading-tight">Courses from ₹149</span>
          <span className="block text-[13px] text-white/65">Learn <span style={{ color: P.lime }}>here</span></span>
        </span>
      </div>
      <span className="ws-plus self-center w-8 h-8 rounded-full flex items-center justify-center text-[20px] font-bold z-10 shadow-[0_6px_16px_-6px_rgba(0,0,0,.6)]" style={{ background: P.lime, color: P.night }}>+</span>
      <div className="ws-from-right flex items-center justify-end gap-4">
        <span className="text-right">
          <span className="block font-display text-[19px] font-bold leading-tight">Interview Prep</span>
          <span className="block text-[13px] text-white/65">Practise <span style={{ color: P.lime }}>here</span></span>
        </span>
        <span className="w-[118px] h-[86px] shrink-0 rounded-2xl flex flex-col items-center justify-center gap-1 border border-white/15 shadow-[0_14px_26px_-12px_rgba(0,0,0,.8)]" style={{ background: `linear-gradient(160deg, ${P.lime}, ${P.green} 70%)` }}>
          <Code2 className="w-7 h-7" style={{ color: P.night }} strokeWidth={2.4} />
          <span className="text-[10.5px] font-extrabold tracking-[0.14em]" style={{ color: P.night }}>350+ PROBLEMS</span>
        </span>
      </div>
    </div>
  );
}

/** Scene 2: a phone rises with the learner's plan. */
function ScenePhone() {
  const rows = [
    { t: 'Python Programming', s: 'Course · 15 modules', c: P.green },
    { t: 'SQL Interview 50', s: 'Interview Prep', c: P.forest },
    { t: 'Certificate', s: 'QR-verified', c: P.lime }
  ];
  return (
    <div className="ws-scene relative h-full flex items-end justify-center">
      <div className="ws-rise w-[200px] h-[196px] rounded-t-[26px] border-[5px] border-b-0 p-2.5 pt-3" style={{ background: P.cream, borderColor: '#111' }}>
        <p className="flex items-center gap-1 text-[10px] font-bold" style={{ color: P.forest }}>‹ My learning</p>
        {rows.map((r, i) => (
          <div key={r.t} className="ws-row mt-2 flex items-center gap-2 rounded-xl bg-white p-2 shadow-[0_2px_6px_rgba(0,0,0,.08)]" style={{ animationDelay: `${250 + i * 140}ms` }}>
            <span className="w-6 h-6 rounded-lg shrink-0" style={{ background: r.c }} />
            <span className="flex-1 min-w-0">
              <span className="block text-[10.5px] font-bold text-[#1d2b26] truncate">{r.t}</span>
              <span className="block text-[9px] text-[#1d2b26]/50">{r.s}</span>
            </span>
            <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: P.green }}><Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Scene 3: two animated stickers - coding every day, then cracking the interview. */
function SceneStickers() {
  return (
    <div className="ws-scene h-full grid grid-cols-2 gap-3 items-center">
      {[
        { el: <CodingSticker className="w-full h-auto" />, title: 'Code every day', sub: 'Real problems, real editor', cls: 'ws-from-left' },
        { el: <InterviewSticker className="w-full h-auto" />, title: 'Crack the interview', sub: 'Walk in prepared', cls: 'ws-from-right' }
      ].map(({ el, title, sub, cls }) => (
        <div key={title} className={`${cls} text-center`}>
          <div className="rounded-[18px] overflow-hidden shadow-[0_16px_30px_-14px_rgba(0,0,0,.8)] ring-1 ring-white/15">{el}</div>
          <p className="mt-2.5 font-display text-[15px] font-bold leading-tight">{title}</p>
          <p className="text-[11.5px] text-white/60">{sub}</p>
        </div>
      ))}
    </div>
  );
}

/** Scene 4: the big tick. */
function SceneDone() {
  return (
    <div className="ws-scene h-full flex flex-col items-center justify-center">
      <span className="relative w-[150px] h-[150px] rounded-full flex items-center justify-center" style={{ background: `${P.lime}1f` }}>
        <span className="ws-ring absolute inset-0 rounded-full border-2" style={{ borderColor: `${P.lime}80` }} />
        <span className="ws-orbit absolute inset-[-6px] rounded-full" aria-hidden="true"><i className="absolute left-1/2 -top-1 w-2.5 h-2.5 -ml-1 rounded-full" style={{ background: P.lime }} /></span>
        <span className="ws-pop w-[104px] h-[104px] rounded-full flex items-center justify-center shadow-[0_0_44px_rgba(227,239,38,.45)]" style={{ background: `radial-gradient(circle at 35% 30%, ${P.mint}, ${P.lime} 70%)` }}>
          <Check className="ws-check w-14 h-14" style={{ color: P.night }} strokeWidth={3.4} />
        </span>
      </span>
    </div>
  );
}

function Stage({ scene }) {
  if (scene === 0) return <ScenePair />;
  if (scene === 1) return <ScenePhone />;
  if (scene === 2) return <SceneStickers />;
  return <SceneDone />;
}

function WelcomeCard({ onClose, navigate, signedIn }) {
  const [scene, setScene] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setScene(s => (s + 1) % SCENES), SCENE_MS);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { clearInterval(t); document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);
  const go = (to) => { onClose(); navigate(to); };

  return (
    <div className="fixed inset-0 z-[125] flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="welcome-sheet relative w-full max-w-[480px] max-h-[94dvh] overflow-y-auto no-scrollbar rounded-t-[28px] text-white pb-[calc(16px+env(safe-area-inset-bottom))]"
        style={{ background: `radial-gradient(120% 70% at 50% 0%, ${P.green} 0%, ${P.forest} 48%, ${P.night} 100%)` }}>
        <span className="welcome-shine" aria-hidden="true" />
        <button onClick={onClose} className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: P.cream, color: P.night }} aria-label="Close"><X className="w-4 h-4" strokeWidth={2.6} /></button>

        <p className="pt-6 text-center text-[11px] font-bold tracking-[0.22em]" style={{ color: P.lime }}>LEARN · PRACTISE · GET HIRED</p>
        <h2 id="welcome-title" className="mt-1.5 text-center font-display text-[26px] font-extrabold leading-tight px-12">Now crack interviews here</h2>

        <div className="relative mt-4 mx-6 h-[232px] overflow-hidden">
          <Stage key={scene} scene={scene} />
        </div>
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: SCENES }).map((_, i) => <span key={i} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === scene ? 20 : 6, background: i === scene ? P.lime : 'rgba(255,255,255,.25)' }} />)}
        </div>

        <div className="px-5 mt-4">
          <button onClick={() => go(signedIn ? paths.dashboard() : paths.register())}
            className="welcome-cta relative overflow-hidden w-full h-[52px] rounded-2xl font-display font-bold text-[17px] active:translate-y-[2px] transition"
            style={{ background: P.lime, color: P.night, boxShadow: `0 14px 30px -14px ${P.lime}` }}>
            {signedIn ? 'Continue learning' : 'Enroll now'}
          </button>
        </div>
        <p className="mt-3 px-6 flex items-center justify-center gap-1.5 text-[11.5px] text-white/50">
          <Laptop className="w-3.5 h-3.5 shrink-0" /> The proctored final needs a laptop and webcam.
        </p>
      </div>
    </div>
  );
}

/** Phones, first page of a visit: the animated welcome card. */
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
