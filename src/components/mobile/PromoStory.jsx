import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, Target, X } from 'lucide-react';
import { paths } from '../../router';

const SHEET_KEY = 'arb_promo_interview_v1';
const seen = (k) => { try { return !!localStorage.getItem(k); } catch { return true; } };
const mark = (k) => { try { localStorage.setItem(k, '1'); } catch { /* ignore */ } };
const isPhone = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;

/* ------------------------------------------------------------------ */
/* Bottom sheet with a looping animated story                          */
/* ------------------------------------------------------------------ */

const FRAMES = 4;

function StoryStage({ frame }) {
  if (frame === 0) {
    return (
      <div className="story-in relative h-full flex flex-col justify-center gap-3 px-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white/[.07] border border-white/15 p-3 story-slide-l">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1E5141] to-[#013A2B] flex items-center justify-center shadow-lg"><BookOpen className="w-7 h-7 text-[#A8E6C1]" /></span>
          <div><p className="font-display text-[18px] font-bold">Learn</p><p className="text-[13px] text-white/70">from <span className="text-[#FFC94D]">free courses</span></p></div>
        </div>
        <span className="mx-auto w-8 h-8 -my-1 rounded-full bg-[#F2B544] text-forest text-[20px] font-bold flex items-center justify-center shadow-lg story-pop z-10">+</span>
        <div className="flex items-center gap-3 rounded-2xl bg-white/[.07] border border-white/15 p-3 story-slide-r">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5B4BD1] to-[#26207A] flex items-center justify-center shadow-lg"><Target className="w-7 h-7 text-[#C9C2FF]" /></span>
          <div><p className="font-display text-[18px] font-bold">Practise</p><p className="text-[13px] text-white/70">with <span className="text-[#FFC94D]">interview prep</span></p></div>
        </div>
      </div>
    );
  }
  if (frame === 1) {
    return (
      <div className="story-in h-full flex items-end justify-center">
        <div className="w-[176px] h-[188px] rounded-t-[22px] bg-[#F4F6F5] border-4 border-b-0 border-[#1B1B1B] p-2.5 story-rise">
          <p className="text-[9px] font-bold text-evergreen">◂ My learning</p>
          {[['SQL Interview 50', '#127A78', true], ['DSA Top 75', '#4B3BC4', true], ['Python course', '#1E5141', false]].map(([t, c, done], i) => (
            <div key={t} className="mt-2 flex items-center gap-2 rounded-lg bg-white p-1.5 shadow-sm story-row" style={{ animationDelay: `${0.15 + i * 0.15}s` }}>
              <span className="w-5 h-5 rounded" style={{ background: c }} />
              <span className="flex-1 text-[9px] font-semibold text-charcoal">{t}</span>
              {done ? <span className="w-4 h-4 rounded-full bg-forest flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></span> : <span className="text-[8px] text-charcoal/50">− 1 +</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (frame === 2) {
    return (
      <div className="story-in h-full flex items-center justify-center">
        <span className="relative w-28 h-28 rounded-full bg-[#F2B544] flex items-center justify-center shadow-[0_0_40px_rgba(242,181,68,.55)] story-scallop">
          <span className="w-4 h-4 rounded-full bg-forest story-orbit" />
        </span>
      </div>
    );
  }
  return (
    <div className="story-in h-full flex flex-col items-center justify-center">
      <span className="relative w-32 h-32 rounded-full bg-[#F2B544]/15 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border-2 border-[#F2B544]/50 story-ring" />
        <span className="w-24 h-24 rounded-full bg-[#F2B544] flex items-center justify-center shadow-[0_0_40px_rgba(242,181,68,.55)] story-pop">
          <Check className="w-12 h-12 text-forest story-check" strokeWidth={3.2} />
        </span>
        {[0, 1, 2, 3, 4, 5].map(i => <span key={i} className="story-spark" style={{ '--a': `${i * 60}deg` }} />)}
      </span>
      <p className="mt-3 font-display text-[16px] font-bold">Interview ready! 🎉</p>
    </div>
  );
}

function PromoSheet({ onClose, navigate }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame(f => (f + 1) % FRAMES), 2300);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearInterval(t); document.body.style.overflow = prev; };
  }, []);
  const go = () => { onClose(); navigate(paths.interview()); };
  return (
    <div className="fixed inset-0 z-[125] flex items-end" role="dialog" aria-modal="true" aria-label="New: interview prep">
      <div className="absolute inset-0 bg-black/55 animate-fade-in" onClick={onClose} />
      <div className="relative w-full rounded-t-[28px] overflow-hidden text-white sheet-up pb-[calc(16px+env(safe-area-inset-bottom))]" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #1E5141 0%, #013A2B 55%, #0C2D26 100%)' }}>
        <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/90 text-forest flex items-center justify-center z-10" aria-label="Close"><X className="w-4 h-4" /></button>
        <p className="pt-6 text-center text-[11px] font-bold tracking-[0.22em] text-[#F2D27A]">LEARN · PRACTISE · GET HIRED</p>
        <h2 className="mt-1 text-center font-display text-[26px] font-extrabold leading-tight px-10">Now crack interviews here</h2>
        <div className="mt-3 mx-5 h-[220px] relative overflow-hidden">
          <StoryStage key={frame} frame={frame} />
        </div>
        <div className="mt-2 flex justify-center gap-1.5">
          {Array.from({ length: FRAMES }).map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === frame ? 'w-5 bg-[#F2D27A]' : 'w-1.5 bg-white/30'}`} />)}
        </div>
        <div className="px-5 mt-4">
          <button onClick={go} className="w-full h-[52px] rounded-2xl bg-gradient-to-b from-[#FFD95A] to-[#F2B544] text-[#2A1A05] font-display font-bold text-[17px] shadow-[0_4px_0_#B5781A,0_14px_28px_-12px_rgba(242,181,68,.8)] active:translate-y-[3px] active:shadow-[0_1px_0_#B5781A] transition">Start practising free</button>
        </div>
      </div>
    </div>
  );
}

/** Phones, first visit to the home page: the animated promo sheet, shown once. */
export default function PromoStory({ navigate }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!isPhone() || seen(SHEET_KEY)) return undefined;
    const t = setTimeout(() => setOpen(true), 1600);
    return () => clearTimeout(t);
  }, []);
  // rendered on <body>: the page wrapper animates (transform), which would trap the fixed sheet under the bottom bar
  return open ? createPortal(<PromoSheet navigate={navigate} onClose={() => { mark(SHEET_KEY); setOpen(false); }} />, document.body) : null;
}
