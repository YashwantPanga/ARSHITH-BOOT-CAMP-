import React, { useEffect, useState } from 'react';
import { ArrowRight, QrCode } from 'lucide-react';
import BubbleBackground from './BubbleBackground';

/**
 * Home hero: "<icon> Learn / Code / Practise / Get hired" + "with CodeLekho". The first word cycles every
 * 1.75 s with its own glossy icon, over a drifting bubble background whose pointer bubble takes that word's colour.
 * A cream stats strip with a curved notch sits underneath. Reduced motion shows a still "Code".
 */
const SLOT_MS = 1750;

const WORDS = [
  { word: 'Learn', tint: '#3FB874' },
  { word: 'Code', tint: '#E3B21F' },
  { word: 'Practise', tint: '#F2772F' },
  { word: 'Get hired', tint: '#B45FC4' }
];

/* ---------- glossy "inflated" icons, drawn in each word's tint ---------- */

function Gloss({ id, tint }) {
  return (
    <defs>
      <radialGradient id={`${id}-body`} cx="34%" cy="26%" r="80%">
        <stop offset="0" stopColor="#fff" stopOpacity=".95" />
        <stop offset=".22" stopColor={tint} stopOpacity=".55" />
        <stop offset=".6" stopColor={tint} />
        <stop offset="1" stopColor={tint} />
      </radialGradient>
      <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset=".55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".28" />
      </linearGradient>
      <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" /></filter>
      <filter id={`${id}-drop`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="9" stdDeviation="8" floodColor={tint} floodOpacity=".45" /></filter>
    </defs>
  );
}

/** Body shape + body gradient + bottom shade + specular highlight, the same recipe for every icon. */
function Puffy({ id, d, highlight }) {
  return (
    <g filter={`url(#${id}-drop)`}>
      <path d={d} fill={`url(#${id}-body)`} />
      <path d={d} fill={`url(#${id}-shade)`} />
      <ellipse {...highlight} fill="#fff" opacity=".7" filter={`url(#${id}-soft)`} />
    </g>
  );
}

function IconLearn({ tint }) {
  const id = 'gi-learn';
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* open book */}
      <Puffy id={id} d="M14 30 C14 24 19 21 25 22 C38 24 50 29 60 36 C70 29 82 24 95 22 C101 21 106 24 106 30 V86 C106 92 101 95 95 94 C82 93 70 97 60 104 C50 97 38 93 25 94 C19 95 14 92 14 86 Z" highlight={{ cx: 36, cy: 38, rx: 15, ry: 7 }} />
      <path d="M60 38 V100" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 46 C36 47 44 50 51 54 M26 60 C36 61 44 64 51 68 M69 54 C76 50 84 47 94 46 M69 68 C76 64 84 61 94 60" stroke="#fff" strokeOpacity=".5" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconCode({ tint }) {
  const id = 'gi-code';
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* speech-bubble chip with embossed </> */}
      <Puffy id={id} d="M30 16 H90 C101 16 108 23 108 34 V72 C108 83 101 90 90 90 H56 L36 106 C33 108 30 106 31 103 L34 90 H30 C19 90 12 83 12 72 V34 C12 23 19 16 30 16 Z" highlight={{ cx: 40, cy: 30, rx: 18, ry: 7 }} />
      <path d="M46 40 L33 53 L46 66 M74 40 L87 53 L74 66 M65 36 L55 70" stroke="#fff" strokeOpacity=".9" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconPractise({ tint }) {
  const id = 'gi-prac';
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* terminal window with a prompt and a blinking-cursor bar */}
      <Puffy id={id} d="M26 18 H94 C104 18 110 24 110 34 V86 C110 96 104 102 94 102 H26 C16 102 10 96 10 86 V34 C10 24 16 18 26 18 Z" highlight={{ cx: 38, cy: 30, rx: 18, ry: 6 }} />
      <circle cx="26" cy="31" r="3.6" fill="#fff" opacity=".75" /><circle cx="37" cy="31" r="3.6" fill="#fff" opacity=".55" /><circle cx="48" cy="31" r="3.6" fill="#fff" opacity=".4" />
      <path d="M28 54 L42 65 L28 76" stroke="#fff" strokeOpacity=".92" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect className="ch-cursor" x="52" y="72" width="26" height="7" rx="3.5" fill="#fff" opacity=".9" />
    </svg>
  );
}

function IconHired({ tint }) {
  const id = 'gi-hire';
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* briefcase with a tick */}
      <path d="M44 32 V26 C44 20 48 16 54 16 H66 C72 16 76 20 76 26 V32" stroke={tint} strokeWidth="8" fill="none" strokeLinecap="round" />
      <Puffy id={id} d="M24 32 H96 C105 32 110 37 110 46 V88 C110 97 105 102 96 102 H24 C15 102 10 97 10 88 V46 C10 37 15 32 24 32 Z" highlight={{ cx: 38, cy: 44, rx: 18, ry: 6 }} />
      <path d="M10 60 C40 70 80 70 110 60" stroke="#fff" strokeOpacity=".35" strokeWidth="3" fill="none" />
      <path d="M44 66 L56 77 L78 54" stroke="#fff" strokeOpacity=".95" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const ICONS = [IconLearn, IconCode, IconPractise, IconHired];

function useWordClock(count, reduced) {
  const [i, setI] = useState(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return undefined;
    let t;
    const tick = () => { t = setTimeout(() => { if (document.visibilityState === 'visible') setI(n => (n + 1) % count); tick(); }, SLOT_MS); };
    tick();
    return () => clearTimeout(t);
  }, [count, reduced]);
  return i;
}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function CodingHero({ onRegisterClick, onExploreClick, onVerifyClick, signedIn = false, courses = [] }) {
  const reduced = prefersReduced();
  const i = useWordClock(WORDS.length, reduced);
  const { word, tint } = WORDS[i];
  const Icon = ICONS[i];
  const modules = courses.reduce((n, c) => n + (c.modules?.length || 0), 0) || 60;
  const last = i === WORDS.length - 1;

  return (
    <section className="coding-hero relative overflow-hidden bg-[#FBF6EF] text-evergreen">
      {/* the panel: four colour layers, one per word, crossfading */}
      <div className="relative sm:min-h-[520px] lg:min-h-[calc(78vh-64px)]">
        {/* drifting colour bubbles; the pointer bubble takes the current word's colour */}
        <BubbleBackground className="absolute inset-0" accent={tint} />
        <span className="ch-grain" aria-hidden="true" />

        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12 pt-12 sm:pt-16 lg:pt-[9vh] pb-24 sm:pb-28">
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.24em] text-evergreen/55">CodeLekho · Learn to code, for real</p>
          <h1 className="ch-title mt-4 font-display font-semibold text-evergreen" aria-label={`${word} with CodeLekho`}>
            <span className="ch-slot" aria-hidden="true">
              {/* keyed so each word plays its own enter and leave */}
              <span key={`i${i}`} className={`ch-icon ${reduced ? '' : 'is-anim'}`}><span className="ch-icon-float"><Icon tint={tint} /></span></span>
              <span key={`w${i}`} className={`ch-word ${reduced ? '' : 'is-anim'}`}>{word}</span>
            </span>
            <span className="block">with CodeLekho</span>
          </h1>

          <div className="mt-8 sm:mt-10 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
            <div className="flex flex-wrap gap-3">
              <button onClick={onRegisterClick} className="ch-btn ch-btn-solid">{signedIn ? 'Continue learning' : 'Start learning free'} <ArrowRight className="w-4 h-4" /></button>
              <button onClick={onExploreClick} className={`ch-btn ${last && !reduced ? 'is-flash' : ''}`}>Explore courses</button>
            </div>
            <p className="max-w-[440px] text-[15px] sm:text-[16.5px] leading-snug text-evergreen/60">
              Python, SQL, Web Development and AI, with live code in your browser, real interview practice and a certificate anyone can verify.
            </p>
          </div>
          <button onClick={onVerifyClick} className="mt-5 inline-flex items-center gap-2 text-[13.5px] font-medium text-evergreen/55 hover:text-evergreen transition-colors"><QrCode className="w-4 h-4" /> Have a certificate? Verify it</button>
        </div>
      </div>

      {/* stats strip with the curved notch */}
      <div className="relative -mt-[62px] z-[1]">
        <svg className="block w-full h-[62px]" viewBox="0 0 1440 62" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 62 H1062 C1092 62 1098 54 1116 34 C1138 9 1146 1 1178 1 H1440 V62 Z" fill="#FBF6EF" />
        </svg>
        <p className="hidden sm:block absolute right-[6%] top-[18px] text-[14px] text-evergreen/45">↓ Scroll to explore courses</p>
        <div className="bg-[#FBF6EF]">
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-12 pb-10 sm:pb-12 pt-2 grid grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)_auto] gap-x-6 gap-y-6 items-end">
            <p className="col-span-2 lg:col-span-1 font-display text-[22px] sm:text-[27px] font-medium leading-[1.15] text-evergreen">Learn by building,<br />one module at a time</p>
            {[
              [`${courses.length || 4}`, 'Career tracks'],
              [`${modules}+`, 'Deep-dive modules'],
              ['355', 'Interview problems']
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-[36px] sm:text-[48px] font-semibold leading-none tracking-[-0.03em] text-evergreen">{n}</p>
                <p className="mt-1.5 text-[13.5px] sm:text-[15px] text-evergreen/55">{l}</p>
              </div>
            ))}
            {/* sprout */}
            <svg viewBox="0 0 80 90" className="hidden lg:block w-[64px] h-auto justify-self-end text-evergreen/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M40 84 V40" />
              <path d="M40 54 C40 38 28 30 12 30 C12 46 24 54 40 54 Z" />
              <path d="M40 46 C40 28 52 18 70 18 C70 36 58 46 40 46 Z" />
              <path d="M18 84 H62" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
