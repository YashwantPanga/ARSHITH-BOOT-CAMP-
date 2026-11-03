import React from 'react';

/**
 * Two small animated illustrations for the phone welcome card: a student coding at a laptop, and a
 * student in an interview that ends with a "HIRED" stamp. Flat shapes in the card's lime-forest palette.
 */
const SKIN = '#E8B98F';
const HAIR = '#1E2A26';

export function CodingSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 140 120" className={className} role="img" aria-label="Student writing code on a laptop">
      <rect x="0" y="0" width="140" height="120" rx="18" fill="#E2FBCE" />
      <circle cx="112" cy="22" r="26" fill="#E3EF26" opacity=".55" />
      {/* student behind the laptop */}
      <g className="stk-bob">
        <path d="M44 96 C44 74 54 66 70 66 C86 66 96 74 96 96 Z" fill="#076653" />
        <circle cx="70" cy="48" r="13" fill={SKIN} />
        <path d="M57 46 C57 34 64 30 71 30 C80 30 85 36 84 45 C79 40 70 39 62 42 C60 43 58 45 57 46 Z" fill={HAIR} />
      </g>
      {/* laptop */}
      <rect x="34" y="58" width="72" height="44" rx="5" fill="#06231D" />
      <rect x="38" y="62" width="64" height="36" rx="3" fill="#0C342C" />
      <rect className="stk-type" style={{ animationDelay: '0s' }} x="43" y="68" width="34" height="4" rx="2" fill="#E3EF26" />
      <rect className="stk-type" style={{ animationDelay: '.35s' }} x="49" y="76" width="40" height="4" rx="2" fill="#8EE3B5" />
      <rect className="stk-type" style={{ animationDelay: '.7s' }} x="49" y="84" width="26" height="4" rx="2" fill="#FFFDEE" />
      <rect className="stk-caret" x="78" y="84" width="2.5" height="5" fill="#E3EF26" />
      <path d="M26 102 H114 L108 108 H32 Z" fill="#06231D" />
      {/* code brackets floating up */}
      <text className="stk-float" x="16" y="40" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="700" fill="#076653">{'</>'}</text>
      <text className="stk-float stk-float-2" x="104" y="58" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" fill="#0C342C">{'{ }'}</text>
    </svg>
  );
}

export function InterviewSticker({ className = '' }) {
  return (
    <svg viewBox="0 0 140 120" className={className} role="img" aria-label="Student cracking an interview">
      <rect x="0" y="0" width="140" height="120" rx="18" fill="#E3EF26" />
      <circle cx="24" cy="20" r="22" fill="#FFFDEE" opacity=".5" />
      {/* interviewer (right) */}
      <path d="M86 98 C86 80 93 74 106 74 C119 74 126 80 126 98 Z" fill="#0C342C" />
      <circle cx="106" cy="60" r="11" fill={SKIN} />
      <path d="M95 58 C95 48 101 45 107 45 C114 45 118 50 117 57 C111 53 103 53 95 58 Z" fill="#5B4636" />
      {/* candidate (left) */}
      <g className="stk-nod">
        <path d="M14 98 C14 80 21 74 34 74 C47 74 54 80 54 98 Z" fill="#076653" />
        <circle cx="34" cy="60" r="11" fill={SKIN} />
        <path d="M23 58 C23 47 29 44 35 44 C43 44 46 50 45 57 C40 52 31 52 23 58 Z" fill={HAIR} />
      </g>
      {/* table */}
      <rect x="8" y="96" width="124" height="8" rx="4" fill="#06231D" />
      {/* candidate's answer bubble */}
      <g className="stk-bubble">
        <rect x="40" y="22" width="44" height="22" rx="8" fill="#FFFDEE" />
        <path d="M48 44 L46 52 L56 44 Z" fill="#FFFDEE" />
        <rect x="46" y="29" width="22" height="3" rx="1.5" fill="#076653" />
        <rect x="46" y="35" width="32" height="3" rx="1.5" fill="#0C342C" opacity=".5" />
      </g>
      {/* HIRED stamp */}
      <g className="stk-stamp">
        <rect x="70" y="16" width="58" height="22" rx="5" fill="none" stroke="#06231D" strokeWidth="2.5" />
        <text x="99" y="32" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="900" letterSpacing="2" fill="#06231D">HIRED</text>
      </g>
    </svg>
  );
}
