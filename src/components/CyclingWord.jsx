import React, { useEffect, useId, useState } from 'react';

/**
 * The home headline's first word: Learn -> Code -> Practise -> Get hired, every 1.75 s, each with its
 * own glossy 3D icon. The word blurs up and out and the next rises in; the icon pops in with a small
 * twist and then floats. Reduced motion shows a still "Code". Pauses while the tab is hidden.
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

function IconLearn({ tint, uid }) {
  const id = `gi-learn-${uid}`; // unique per copy: the page has a phone and a desktop headline
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

function IconCode({ tint, uid }) {
  const id = `gi-code-${uid}`; // unique per copy: the page has a phone and a desktop headline
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* speech-bubble chip with embossed </> */}
      <Puffy id={id} d="M30 16 H90 C101 16 108 23 108 34 V72 C108 83 101 90 90 90 H56 L36 106 C33 108 30 106 31 103 L34 90 H30 C19 90 12 83 12 72 V34 C12 23 19 16 30 16 Z" highlight={{ cx: 40, cy: 30, rx: 18, ry: 7 }} />
      <path d="M46 40 L33 53 L46 66 M74 40 L87 53 L74 66 M65 36 L55 70" stroke="#fff" strokeOpacity=".9" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconPractise({ tint, uid }) {
  const id = `gi-prac-${uid}`; // unique per copy: the page has a phone and a desktop headline
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <Gloss id={id} tint={tint} />
      {/* terminal window with a prompt and a blinking-cursor bar */}
      <Puffy id={id} d="M26 18 H94 C104 18 110 24 110 34 V86 C110 96 104 102 94 102 H26 C16 102 10 96 10 86 V34 C10 24 16 18 26 18 Z" highlight={{ cx: 38, cy: 30, rx: 18, ry: 6 }} />
      <circle cx="26" cy="31" r="3.6" fill="#fff" opacity=".75" /><circle cx="37" cy="31" r="3.6" fill="#fff" opacity=".55" /><circle cx="48" cy="31" r="3.6" fill="#fff" opacity=".4" />
      <path d="M28 54 L42 65 L28 76" stroke="#fff" strokeOpacity=".92" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect className="cw-cursor" x="52" y="72" width="26" height="7" rx="3.5" fill="#fff" opacity=".9" />
    </svg>
  );
}

function IconHired({ tint, uid }) {
  const id = `gi-hire-${uid}`; // unique per copy: the page has a phone and a desktop headline
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

export default function CyclingWord({ className = '' }) {
  const reduced = prefersReduced();
  const i = useWordClock(WORDS.length, reduced);
  const { word, tint } = WORDS[i];
  const Icon = ICONS[i];
  const uid = useId().replace(/:/g, '');
  return (
    <span className={`cw-slot ${className}`}>
      <span className="sr-only">{WORDS.map(w => w.word).join(', ')}</span>
      {/* keyed so each word plays its own enter and leave */}
      <span key={`i${i}`} className={`cw-icon ${reduced ? '' : 'is-anim'}`} aria-hidden="true"><span className="cw-icon-float"><Icon tint={tint} uid={uid} /></span></span>
      <span key={`w${i}`} className={`cw-word ${reduced ? '' : 'is-anim'}`} aria-hidden="true">{word}</span>
    </span>
  );
}
