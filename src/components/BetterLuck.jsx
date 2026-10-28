import React from 'react';

/**
 * Shown when a final assessment is not passed: a gentle "Better luck next time" animation - an arrow
 * flies at a target, lands just outside the bullseye, and a small sprout grows beside it ("you are
 * growing"). Kind and encouraging, never mocking. Honours reduced-motion settings.
 */
export default function BetterLuck({ lockedOut = false }) {
  return (
    <div className="better-luck relative mx-auto w-[220px] h-[150px]" aria-hidden="true">
      <style>{`
        .better-luck .bl-ring { transform-origin: 110px 78px; animation: bl-pop .5s ease-out both; }
        .better-luck .bl-ring:nth-of-type(2) { animation-delay: .08s; }
        .better-luck .bl-ring:nth-of-type(3) { animation-delay: .16s; }
        .better-luck .bl-arrow { animation: bl-fly .7s cubic-bezier(.2,.8,.3,1) .45s both; }
        .better-luck .bl-wobble { transform-origin: 136px 66px; animation: bl-wobble .6s ease-in-out 1.15s 2 both; }
        .better-luck .bl-stem { stroke-dasharray: 60; stroke-dashoffset: 60; animation: bl-grow .9s ease-out 1.5s forwards; }
        .better-luck .bl-leaf { transform-box: fill-box; transform-origin: bottom center; transform: scale(0); animation: bl-leaf .5s ease-out forwards; }
        .better-luck .bl-leaf.l1 { animation-delay: 2.0s; } .better-luck .bl-leaf.l2 { animation-delay: 2.2s; }
        .better-luck .bl-spark { opacity: 0; animation: bl-spark 1.6s ease-in-out 2.3s infinite; }
        .better-luck .bl-spark.s2 { animation-delay: 2.7s; } .better-luck .bl-spark.s3 { animation-delay: 3.1s; }
        @keyframes bl-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bl-fly { from { transform: translate(-150px, -40px) rotate(-8deg); opacity: 0; } 60% { opacity: 1; } to { transform: translate(0, 0) rotate(0); opacity: 1; } }
        @keyframes bl-wobble { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-7deg); } 70% { transform: rotate(5deg); } }
        @keyframes bl-grow { to { stroke-dashoffset: 0; } }
        @keyframes bl-leaf { to { transform: scale(1); } }
        @keyframes bl-spark { 0%, 100% { opacity: 0; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-6px); } }
        @media (prefers-reduced-motion: reduce) { .better-luck * { animation: none !important; opacity: 1 !important; transform: none !important; stroke-dashoffset: 0 !important; } }
      `}</style>
      <svg viewBox="0 0 220 150" className="w-full h-full">
        {/* target */}
        <circle className="bl-ring" cx="110" cy="78" r="46" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="3" />
        <circle className="bl-ring" cx="110" cy="78" r="30" fill="#FFFFFF" stroke="#FDA4AF" strokeWidth="3" />
        <circle className="bl-ring" cx="110" cy="78" r="13" fill={lockedOut ? '#FB7185' : '#F43F5E'} />
        {/* arrow: lands just outside the bullseye and wobbles */}
        <g className="bl-arrow">
          <g className="bl-wobble">
            <line x1="136" y1="66" x2="196" y2="38" stroke="#302B25" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M136 66 l11 -1 l-5 -9 z" fill="#302B25" />
            <path d="M190 33 l14 -6 l-3 12 z M196 41 l14 2 l-10 8 z" fill="#D9B44A" />
          </g>
        </g>
        {/* a sprout grows: you are still growing */}
        <path className="bl-stem" d="M40 140 C40 120 42 110 46 98" fill="none" stroke="#2F7A5C" strokeWidth="3.5" strokeLinecap="round" />
        <path className="bl-leaf l1" d="M45 112 C33 108 28 100 30 92 C40 94 46 102 45 112 Z" fill="#7DB59A" />
        <path className="bl-leaf l2" d="M46 103 C56 96 64 96 68 101 C62 109 52 109 46 103 Z" fill="#426557" />
        <rect x="26" y="138" width="34" height="6" rx="3" fill="#C8D8D0" />
        {/* sparkles */}
        <path className="bl-spark" d="M70 30 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#D9B44A" />
        <path className="bl-spark s2" d="M168 112 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="#7DB59A" />
        <path className="bl-spark s3" d="M24 60 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="#FDA4AF" />
      </svg>
    </div>
  );
}
