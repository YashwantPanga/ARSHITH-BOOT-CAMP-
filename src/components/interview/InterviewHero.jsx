import React, { useId } from 'react';
import { ArrowRight, Award, ShieldCheck } from 'lucide-react';
import CyclingWord, { Gloss, Puffy, IconCode, IconHired, useWordClock, prefersReduced } from '../CyclingWord';

/**
 * Interview Prep (locked) hero. The first word cycles Prepare -> Code -> Answer -> Get hired, each with
 * its own glossy icon, and the soft pastel panel changes colour with the word. A cream strip with a
 * curved notch carries the numbers. The price and the free route sit in the panel.
 */
function IconPrepare({ tint, uid }) {
  const id = `ip-prep-${uid}`;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* clipboard with a checklist */}
      <Puffy id={id} d="M30 22 H90 C99 22 104 27 104 36 V100 C104 109 99 114 90 114 H30 C21 114 16 109 16 100 V36 C16 27 21 22 30 22 Z" highlight={{ cx: 38, cy: 34, rx: 16, ry: 6 }} />
      <rect x="42" y="12" width="36" height="18" rx="9" fill="#fff" opacity=".85" />
      {[52, 72, 92].map(y => (
        <g key={y}>
          <path d={`M32 ${y} l6 6 l11 -12`} stroke="#fff" strokeOpacity=".95" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="58" y={y - 1} width="32" height="7" rx="3.5" fill="#fff" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}

function IconAnswer({ tint, uid }) {
  const id = `ip-ans-${uid}`;
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* rounded speech bubble with three dots */}
      <Puffy id={id} d="M60 14 C90 14 110 31 110 54 C110 77 90 94 60 94 C54 94 48 93 43 92 L24 106 C21 108 18 106 19 103 L23 86 C15 78 10 67 10 54 C10 31 30 14 60 14 Z" highlight={{ cx: 40, cy: 30, rx: 18, ry: 7 }} />
      {[40, 60, 80].map(x => <circle key={x} cx={x} cy="55" r="7.5" fill="#fff" opacity=".92" />)}
    </svg>
  );
}

export const IV_WORDS = [
  { word: 'Prepare', tint: '#3FB874' },
  { word: 'Code', tint: '#E3B21F' },
  { word: 'Answer', tint: '#F2772F' },
  { word: 'Get hired', tint: '#B45FC4' }
];
const IV_ICONS = [IconPrepare, IconCode, IconAnswer, IconHired];
const CODE_SAMPLE = ['seen = {}', 'for i, n in enumerate(nums):', '    if target - n in seen:', '        return [seen[target - n], i]'].join(String.fromCharCode(10));
const TONES = ['iv-t-sage', 'iv-t-lemon', 'iv-t-peach', 'iv-t-rose'];

export default function InterviewHero({ price, total, signedIn, earned, required, onUnlock, onBrowse, onContinue }) {
  const word = useWordClock(IV_WORDS.length, prefersReduced());
  const grain = `ivg-${useId().replace(/:/g, '')}`;
  return (
    <section className="iv-card relative overflow-hidden rounded-[22px] sm:rounded-[26px] text-[#0D0D0C] ring-1 ring-[#0D0D0C]/[.06] shadow-[0_30px_60px_-44px_rgba(12,45,38,.55)]">
      {/* the panel: four colour layers, one per word, cross-fading */}
      <div className="relative">
        {TONES.map((t, k) => <span key={t} className={`iv-tone ${t} ${k === word ? 'is-on' : ''}`} aria-hidden="true" />)}
        <svg className="absolute inset-0 w-full h-full opacity-[.18] mix-blend-multiply pointer-events-none" aria-hidden="true">
          <filter id={grain}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0" /></filter>
          <rect width="100%" height="100%" filter={`url(#${grain})`} />
        </svg>

        {/* laptops: a glass card that follows the word */}
        <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-[58%] w-[300px]" aria-hidden="true">
          <div key={word} className="iv-glass rounded-[20px] border border-white/60 bg-white/45 backdrop-blur-md p-5 shadow-[0_24px_48px_-28px_rgba(13,13,12,.45)]">
            {[
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0D0D0C]/50">Your study plan</p>
                <p className="mt-1 font-display text-[19px] font-semibold">Day 6 of 30</p>
                <div className="mt-3 grid grid-cols-10 gap-1">{Array.from({ length: 30 }, (_, k) => <span key={k} className={`h-2.5 rounded-[3px] ${k < 6 ? 'bg-[#3FB874]' : 'bg-[#0D0D0C]/10'}`} />)}</div>
                <p className="mt-3 text-[12.5px] text-[#0D0D0C]/55">Finish by your interview date</p>
              </>,
              <>
                <div className="flex items-center justify-between"><p className="font-display text-[17px] font-semibold">Two Sum</p><span className="rounded-full bg-[#3FB874]/15 text-[#1E7A4E] px-2 py-0.5 text-[11px] font-bold">EASY</span></div>
                <pre className="mt-3 rounded-xl bg-[#0D0D0C] text-[#D7F5E3] p-3 text-[11.5px] leading-[1.55] font-mono overflow-hidden">{CODE_SAMPLE}</pre>
                <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1E7A4E]"><span className="w-4 h-4 rounded-full bg-[#3FB874] text-white flex items-center justify-center text-[10px]">✓</span> All 12 tests passed</p>
              </>,
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0D0D0C]/50">Mock interview · 00:42</p>
                <p className="mt-2 font-display text-[17px] font-semibold leading-snug">“How would you find duplicate emails in a users table?”</p>
                <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-[12.5px] text-[#0D0D0C]/70"><b className="text-[#0D0D0C]">Pattern:</b> GROUP BY email HAVING COUNT(*) &gt; 1</p>
              </>,
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0D0D0C]/50">Readiness</p>
                <div className="mt-2 flex items-end gap-2"><p className="font-display text-[40px] font-semibold leading-none">92%</p><p className="pb-1 text-[12.5px] text-[#0D0D0C]/55">interview ready</p></div>
                <div className="mt-3 h-2 rounded-full bg-[#0D0D0C]/10 overflow-hidden"><span className="iv-bar block h-full rounded-full bg-[#B45FC4]" /></div>
                <p className="mt-3 text-[12.5px] text-[#0D0D0C]/55">SQL · Python · JavaScript · DSA</p>
              </>
            ][word]}
          </div>
        </div>

        <div className="relative px-5 pt-6 pb-16 sm:px-12 sm:pt-10 sm:pb-20 lg:pr-[380px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#0D0D0C]/15 bg-white/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0D0D0C]/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3FB874]" /> Interview Prep
          </span>
          <h1 className="iv-headline mt-4 sm:mt-5 font-display font-semibold">
            <CyclingWord index={word} words={IV_WORDS} icons={IV_ICONS} />
            <span className="block">with confidence</span>
          </h1>

          <div className="mt-6 sm:mt-8 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button onClick={onUnlock} className="group h-12 px-6 rounded-xl bg-[#0D0D0C] text-white font-display text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition hover:bg-[#013A2B] active:scale-[.99]">
                {signedIn ? `Unlock for ₹${price}` : `Sign in · ₹${price} lifetime`} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button onClick={signedIn ? onContinue : onBrowse} className={`iv-free h-12 px-5 rounded-xl border-[1.4px] border-[#0D0D0C]/80 font-display text-[14.5px] font-semibold inline-flex items-center justify-center gap-2 transition hover:bg-[#0D0D0C] hover:text-white ${word === 3 ? 'is-lit' : ''}`}>
                <Award className="w-4 h-4" /> Free with {required} certificates{signedIn ? ` · ${earned}/${required}` : ''}
              </button>
            </div>
            <p className="text-[13.5px] sm:text-[14.5px] leading-snug text-[#0D0D0C]/60 max-w-[420px]">
              {total} real interview questions in SQL, Python, JavaScript and DSA, with worked solutions and your own study plan.
            </p>
          </div>
        </div>
      </div>

      {/* cream strip with the curved notch */}
      <div className="relative bg-[#FBF6EF]">
        <svg className="absolute left-0 right-0 -top-[34px] sm:-top-[46px] w-full h-[35px] sm:h-[47px]" viewBox="0 0 1440 62" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 62 H1062 C1092 62 1098 54 1116 34 C1138 9 1146 1 1178 1 H1440 V62 Z" fill="#FBF6EF" />
        </svg>
        <p className="absolute right-5 sm:right-10 -top-[24px] sm:-top-[32px] flex items-center gap-1.5 text-[11.5px] sm:text-[13px] text-[#0D0D0C]/45"><ShieldCheck className="w-3.5 h-3.5" /> Secure payment · Cashfree</p>
        <div className="px-5 py-5 sm:px-12 sm:py-7 grid grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)_auto] gap-x-5 gap-y-4 items-center">
          <p className="col-span-2 lg:col-span-1 font-display text-[17px] sm:text-[20px] font-medium leading-tight">Practise what companies<br className="hidden sm:block" /> really ask</p>
          {[[`${total}+`, 'Questions and problems'], ['4', 'Practice tracks'], [`₹${price}`, 'One-time, lifetime access']].map(([v, l], k) => (
            <div key={l} className={k === 2 ? 'col-span-2 sm:col-span-1' : ''}>
              <p className="font-display text-[26px] sm:text-[32px] font-semibold leading-none tracking-tight">{v}</p>
              <p className="mt-1 text-[12.5px] sm:text-[13.5px] text-[#0D0D0C]/55">{l}</p>
            </div>
          ))}
          {/* line art: a laptop with a tick */}
          <svg viewBox="0 0 80 60" className="hidden lg:block w-[72px] text-[#0D0D0C]/55" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="14" y="8" width="52" height="34" rx="4" />
            <path d="M6 50 H74 L68 42 H12 Z" />
            <path d="M31 25 l6 6 l12 -12" />
          </svg>
        </div>
      </div>
    </section>
  );
}
