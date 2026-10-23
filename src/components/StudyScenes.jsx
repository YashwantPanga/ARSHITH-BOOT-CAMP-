import React from 'react';

/*
 * Small looping illustrations for page banners, drawn in the site palette and animated with CSS
 * (ss-* keyframes in index.css; motion stops when the visitor prefers reduced motion).
 */
const SKIN = '#C98E6B';
const HAIR = '#302B25';

/** A student typing on a laptop: code lines appear on the screen, coffee steams, a code bubble floats. */
export function LaptopScene({ className = '' }) {
  return (
    <svg viewBox="0 0 300 230" className={className} role="img" aria-label="Animated illustration of a student studying on a laptop">
      <circle cx="150" cy="122" r="98" fill="#E3ECE7" />
      <circle cx="150" cy="122" r="98" fill="none" stroke="#426557" strokeOpacity=".18" strokeDasharray="4 7" className="ss-spin" />

      {/* chair */}
      <rect x="38" y="118" width="14" height="66" rx="7" fill={HAIR} opacity=".85" />
      <rect x="38" y="168" width="74" height="10" rx="5" fill={HAIR} opacity=".85" />
      <rect x="70" y="178" width="7" height="34" rx="3" fill={HAIR} opacity=".7" />

      {/* student */}
      <g className="ss-breathe">
        <rect x="56" y="104" width="54" height="70" rx="24" fill="#013A2B" />
        <rect x="78" y="98" width="12" height="12" rx="5" fill={SKIN} />
        <circle cx="86" cy="82" r="20" fill={SKIN} />
        <path d="M66 80c0-14 10-22 22-22 11 0 19 7 19 15-6-3-14-4-21-2-6 2-11 6-13 12z" fill={HAIR} />
        <circle cx="97" cy="84" r="2" fill={HAIR} className="ss-blink" />
        <path d="M95 93q4 2 7-1" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
      <rect x="88" y="164" width="62" height="16" rx="8" fill="#0C2D26" />
      <rect x="136" y="166" width="16" height="48" rx="8" fill="#0C2D26" />
      <rect x="132" y="208" width="26" height="8" rx="4" fill={HAIR} />

      {/* desk */}
      <rect x="118" y="154" width="176" height="8" rx="4" fill="#426557" />
      <rect x="276" y="162" width="8" height="54" rx="3" fill="#426557" opacity=".8" />

      {/* typing arm */}
      <g className="ss-type">
        <path d="M100 122 L126 145 L160 147" stroke="#013A2B" strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="162" cy="147" r="6" fill={SKIN} />
      </g>

      {/* laptop */}
      <rect x="196" y="90" width="76" height="58" rx="6" fill={HAIR} />
      <rect x="201" y="95" width="66" height="47" rx="3" fill="#FBF8F1" />
      <rect x="150" y="148" width="124" height="6" rx="3" fill={HAIR} />
      <g>
        <rect x="207" y="102" width="30" height="4" rx="2" fill="#426557" className="ss-code ss-c1" />
        <rect x="213" y="111" width="42" height="4" rx="2" fill="#013A2B" className="ss-code ss-c2" />
        <rect x="213" y="120" width="24" height="4" rx="2" fill="#E0B54A" className="ss-code ss-c3" />
        <rect x="207" y="129" width="36" height="4" rx="2" fill="#426557" className="ss-code ss-c4" />
        <rect x="246" y="128" width="2" height="7" fill="#013A2B" className="ss-caret" />
      </g>

      {/* coffee */}
      <rect x="124" y="136" width="15" height="18" rx="3" fill="#FBF8F1" stroke="#426557" strokeWidth="1.5" />
      <path d="M139 141q6 0 6 5t-6 5" stroke="#426557" strokeWidth="1.5" fill="none" />
      <path d="M128 130q-3-5 0-9t0-9" stroke="#426557" strokeWidth="1.5" fill="none" strokeLinecap="round" className="ss-steam" />
      <path d="M135 130q-3-5 0-9t0-9" stroke="#426557" strokeWidth="1.5" fill="none" strokeLinecap="round" className="ss-steam ss-d2" />

      {/* floating code bubble */}
      <g className="ss-float">
        <rect x="214" y="38" width="54" height="30" rx="10" fill="#013A2B" />
        <path d="M228 68 l6 8 l4 -8z" fill="#013A2B" />
        <text x="241" y="58" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="13" fontWeight="600" fill="#FBF8F1">{'</>'}</text>
      </g>
      <g className="ss-float ss-d2">
        <circle cx="46" cy="58" r="13" fill="#FBF8F1" stroke="#426557" strokeWidth="1.5" />
        <path d="M40 58l4 4 8-8" stroke="#013A2B" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** A student writing an exam on a clipboard: answers are written line by line and ticked, the clock runs, an A+ pops. */
export function ExamScene({ className = '' }) {
  const rows = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 300 230" className={className} role="img" aria-label="Animated illustration of a student writing an exam on a pad">
      <circle cx="150" cy="122" r="98" fill="#E3ECE7" />
      <circle cx="150" cy="122" r="98" fill="none" stroke="#426557" strokeOpacity=".18" strokeDasharray="4 7" className="ss-spin" />

      {/* wall clock */}
      <g>
        <circle cx="62" cy="52" r="17" fill="#FBF8F1" stroke="#013A2B" strokeWidth="2.5" />
        <line x1="62" y1="52" x2="62" y2="42" stroke="#013A2B" strokeWidth="2.2" strokeLinecap="round" className="ss-clock-m" />
        <line x1="62" y1="52" x2="69" y2="52" stroke="#426557" strokeWidth="2.2" strokeLinecap="round" className="ss-clock-h" />
        <circle cx="62" cy="52" r="2" fill="#013A2B" />
      </g>

      {/* chair */}
      <rect x="154" y="170" width="72" height="9" rx="4.5" fill={HAIR} opacity=".85" />
      <rect x="216" y="112" width="13" height="64" rx="6.5" fill={HAIR} opacity=".85" />
      <rect x="186" y="179" width="7" height="34" rx="3" fill={HAIR} opacity=".7" />

      {/* student */}
      <g className="ss-breathe">
        <rect x="160" y="96" width="56" height="76" rx="24" fill="#426557" />
        <rect x="182" y="90" width="12" height="12" rx="5" fill={SKIN} />
        <circle cx="188" cy="72" r="20" fill={SKIN} />
        <path d="M168 72c-1-15 9-24 21-24 12 0 21 9 20 21-5-6-12-8-19-8-8 0-15 4-22 11z" fill={HAIR} />
        <path d="M206 64c4 6 4 16 1 22" stroke={HAIR} strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="180" cy="77" r="2" fill={HAIR} className="ss-blink" />
        <path d="M177 85q3 2 6 0" stroke={HAIR} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>
      <rect x="160" y="166" width="54" height="15" rx="7.5" fill="#0C2D26" />
      <rect x="164" y="172" width="15" height="42" rx="7.5" fill="#0C2D26" />
      <rect x="158" y="208" width="26" height="8" rx="4" fill={HAIR} />

      {/* clipboard + exam sheet */}
      <g className="ss-tilt">
        <rect x="88" y="84" width="88" height="114" rx="7" fill={HAIR} />
        <rect x="94" y="94" width="76" height="98" rx="3" fill="#FBF8F1" />
        <rect x="119" y="79" width="26" height="11" rx="3" fill="#013A2B" />
        <text x="102" y="108" fontFamily="Jost, sans-serif" fontSize="9" fontWeight="700" fill="#013A2B" letterSpacing="1">EXAM</text>
        <rect x="140" y="102" width="22" height="6" rx="3" fill="#E3ECE7" />
        {rows.map(i => (
          <g key={i}>
            <circle cx="106" cy={124 + i * 17} r="4" fill="none" stroke="#426557" strokeWidth="1.4" />
            <path d={`M103.5 ${124 + i * 17} l2 2 l4 -4.5`} stroke="#013A2B" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={`ss-tick ss-t${i + 1}`} />
            <line x1="116" y1={124 + i * 17} x2="160" y2={124 + i * 17} stroke="#E4E0D7" strokeWidth="3" strokeLinecap="round" />
            <line x1="116" y1={124 + i * 17} x2="160" y2={124 + i * 17} stroke="#302B25" strokeWidth="2" strokeLinecap="round" pathLength="1" className={`ss-line ss-l${i + 1}`} />
          </g>
        ))}
        {/* hand holding the board */}
        <circle cx="90" cy="150" r="6" fill={SKIN} />
      </g>

      {/* writing hand with pencil */}
      <g className="ss-pen">
        <rect x="124" y="114" width="44" height="12" rx="6" fill="#426557" />
        <circle cx="124" cy="120" r="6" fill={SKIN} />
        <rect x="113" y="110" width="4" height="18" rx="1.5" fill="#E0B54A" transform="rotate(-35 115 119)" />
      </g>

      {/* A+ result */}
      <g className="ss-pop">
        <circle cx="242" cy="52" r="18" fill="#013A2B" />
        <text x="242" y="57" textAnchor="middle" fontFamily="Jost, sans-serif" fontSize="15" fontWeight="700" fill="#FBF8F1">A+</text>
      </g>
      <g className="ss-float ss-d2">
        <rect x="30" y="140" width="26" height="32" rx="3" fill="#FBF8F1" stroke="#426557" strokeWidth="1.5" />
        <line x1="36" y1="150" x2="50" y2="150" stroke="#426557" strokeWidth="1.5" />
        <line x1="36" y1="156" x2="50" y2="156" stroke="#426557" strokeWidth="1.5" />
        <line x1="36" y1="162" x2="45" y2="162" stroke="#426557" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
