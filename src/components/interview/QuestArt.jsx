import React, { useEffect, useState } from 'react';
import { Flame, Play } from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/* Per-plan look: gradient, accent colours, mascot outfit and voice    */
/* ------------------------------------------------------------------ */

export const QUEST = {
  'sql-50': {
    track: 'SQL TRACK', bubble: 'SELECT *!', screen: 'db', glyphs: ['JOIN', '{ }', 'WHERE'],
    bg: 'linear-gradient(120deg,#062A3A 0%,#0B4F5C 45%,#127A78 75%,#2BB3A0 100%)',
    hair: '#1B2A4A', phones: '#2BD4B4', hoodie: '#F2B544', iris: '#1FA394', glow: '#5EF0D2'
  },
  'dsa-75': {
    track: 'DSA TRACK', bubble: 'O(n) wins!', screen: 'tree', glyphs: ['O(1)', '[ ]', 'BFS'],
    bg: 'linear-gradient(120deg,#120D3A 0%,#26207A 45%,#4B3BC4 75%,#7A6CF2 100%)',
    hair: '#2B1D4F', phones: '#7EE0FF', hoodie: '#3FC1A5', iris: '#5B6CFF', glow: '#9FA8FF'
  },
  'programming-essentials': {
    track: 'PYTHON TRACK', bubble: "Let's code!", screen: 'code', glyphs: ['{ }', 'λ', 'def'],
    bg: 'linear-gradient(120deg,#1A0B3D 0%,#3B1478 42%,#7A2A9C 72%,#E2577E 100%)',
    hair: '#1E1A4D', phones: '#FF7EB6', hoodie: '#2EC4A6', iris: '#8B5CF6', glow: '#FF9ED2'
  },
  'js-30': {
    track: 'JS SPRINT', bubble: 'async / await!', screen: 'js', glyphs: ['=>', '{ }', '===' ],
    bg: 'linear-gradient(120deg,#3A1405 0%,#8A3A0C 40%,#D9701E 72%,#FFB347 100%)',
    hair: '#3A1E12', phones: '#FFD34D', hoodie: '#2E86DE', iris: '#E8641C', glow: '#FFD580'
  },
  'interview-questions': {
    track: 'INTERVIEW ROUND', bubble: 'Ask me anything!', screen: 'qa', glyphs: ['?', 'OS', 'HR'],
    bg: 'linear-gradient(120deg,#04281E 0%,#0B4A36 42%,#1D7A55 72%,#C9A646 100%)',
    hair: '#1F2B24', phones: '#F2D27A', hoodie: '#E85D75', iris: '#1D9A6C', glow: '#F7E2A0'
  }
};
const DOTS = ['#38E1C6', '#FF7EB6', '#FFC94D', '#9FA8FF', '#7DDB8A', '#FF9F6B'];

/* ------------------------------------------------------------------ */
/* Mascot: an original anime-style coder with headphones and a laptop  */
/* ------------------------------------------------------------------ */

function Screen({ kind, color }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (kind === 'db') return <g><ellipse cx="120" cy="196" rx="15" ry="5" {...s} /><path d="M105 196v14c0 3 7 5 15 5s15-2 15-5v-14" {...s} /></g>;
  if (kind === 'tree') return <g {...s}><circle cx="120" cy="193" r="4" /><circle cx="108" cy="212" r="4" /><circle cx="132" cy="212" r="4" /><path d="M117 196l-6 12M123 196l6 12" /></g>;
  if (kind === 'js') return <text x="120" y="214" textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="24" fill={color}>JS</text>;
  if (kind === 'qa') return <text x="120" y="214" textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="22" fill={color}>Q&amp;A</text>;
  return <g {...s}><path d="M110 194l-9 9 9 9M130 194l9 9-9 9M124 190l-8 26" /></g>;
}

export function Mascot({ q, className = '' }) {
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`mg-${q.screen}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={q.glow} stopOpacity=".55" /><stop offset="100%" stopColor={q.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`iris-${q.screen}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1B1440" /><stop offset="100%" stopColor={q.iris} /></linearGradient>
      </defs>
      <circle cx="120" cy="110" r="104" fill={`url(#mg-${q.screen})`} className="quest-glow" />
      <g className="quest-bob">
        {/* body */}
        <path d="M52 240c4-40 30-58 68-58s64 18 68 58z" fill={q.hoodie} />
        <path d="M100 184l20 18 20-18" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
        <rect x="111" y="160" width="18" height="24" rx="7" fill="#FFD9BE" />
        {/* hair back */}
        <path d="M58 102c-4-50 28-78 62-78s68 26 62 78c-2 22-8 40-14 50H72c-8-10-13-28-14-50z" fill={q.hair} />
        {/* face */}
        <path d="M74 98c0-30 20-48 46-48s46 18 46 48c0 34-20 62-46 62S74 132 74 98z" fill="#FFE3CC" />
        {/* bangs */}
        <path d="M66 96c4-38 28-56 56-56 26 0 48 16 52 50-10-12-22-20-34-22l-6 14-8-16c-14 2-26 10-34 20l-2-10c-10 6-18 14-24 20z" fill={q.hair} />
        {/* eyes (blink) */}
        <g className="quest-blink">
          <ellipse cx="98" cy="108" rx="11" ry="14" fill="#fff" />
          <ellipse cx="142" cy="108" rx="11" ry="14" fill="#fff" />
          <ellipse cx="99" cy="110" rx="8" ry="11" fill={`url(#iris-${q.screen})`} />
          <ellipse cx="141" cy="110" rx="8" ry="11" fill={`url(#iris-${q.screen})`} />
          <circle cx="102" cy="105" r="3.4" fill="#fff" /><circle cx="144" cy="105" r="3.4" fill="#fff" />
          <circle cx="96" cy="115" r="1.6" fill="#fff" opacity=".8" /><circle cx="138" cy="115" r="1.6" fill="#fff" opacity=".8" />
        </g>
        <path d="M86 92q12-6 22 0M132 92q10-6 22 0" fill="none" stroke={q.hair} strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx="86" cy="128" rx="8" ry="4" fill="#FF8FA3" opacity=".45" /><ellipse cx="154" cy="128" rx="8" ry="4" fill="#FF8FA3" opacity=".45" />
        <path d="M112 134q8 7 16 0" fill="none" stroke="#B4535E" strokeWidth="3" strokeLinecap="round" />
        {/* headphones */}
        <path d="M66 104c0-42 24-66 54-66s54 24 54 66" fill="none" stroke={q.phones} strokeWidth="8" strokeLinecap="round" />
        <rect x="56" y="96" width="20" height="36" rx="10" fill={q.phones} /><rect x="164" y="96" width="20" height="36" rx="10" fill={q.phones} />
        <rect x="60" y="102" width="6" height="22" rx="3" fill="#fff" opacity=".45" /><rect x="168" y="102" width="6" height="22" rx="3" fill="#fff" opacity=".45" />
        {/* laptop */}
        <rect x="80" y="178" width="80" height="50" rx="8" fill="#EEF1F7" stroke="#C7CEDD" strokeWidth="3" />
        <rect x="70" y="226" width="100" height="10" rx="4" fill="#C7CEDD" />
        <Screen kind={q.screen} color={q.iris} />
      </g>
    </svg>
  );
}

/* Sparkles and drifting code glyphs layered over a banner. */
function Sky({ q, glyphs = true }) {
  const stars = [[8, 18], [22, 72], [36, 12], [52, 80], [61, 22], [74, 64], [86, 14], [93, 78], [46, 46]];
  return (
    <>
      <span className="quest-rays" />
      <span className="absolute inset-0 quest-dots" />
      {stars.map(([x, y], i) => (
        <span key={i} className="quest-star" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 5) * 0.6}s` }} />
      ))}
      {glyphs && q.glyphs.map((g, i) => (
        <span key={g} className="quest-glyph hidden md:block" style={{ right: `${[45, 31, 43][i]}%`, top: `${[16, 20, 70][i]}%`, animationDelay: `${i * 1.1}s`, color: [q.glow, '#FFE08A', '#FFFFFF'][i] }}>{g}</span>
      ))}
    </>
  );
}

/** Title with its last word in a gold gradient. */
function GoldTitle({ text, className }) {
  const words = text.split(' ');
  const last = words.pop();
  return <h1 className={className}>{words.join(' ')} <span className="quest-gold">{last}</span></h1>;
}

/* ------------------------------------------------------------------ */
/* Plan page banner                                                    */
/* ------------------------------------------------------------------ */

function useCodingStreak(signedIn) {
  const [days, setDays] = useState(0);
  useEffect(() => {
    if (!signedIn) return;
    api.getStreak().then(r => setDays(r.streak?.current || 0)).catch(() => {});
  }, [signedIn]);
  return days;
}

export function QuestHero({ set, solvedMap, signedIn, playerName, next, onStart, onPlan, hasPlan, topics }) {
  const q = QUEST[set.id] || QUEST['programming-essentials'];
  const solved = Object.keys(solvedMap).length;
  const streak = useCodingStreak(signedIn);
  const level = Math.floor(solved / 5);
  const toNext = ((solved % 5) / 5) * 100;
  const gems = [['Easy', '#3FD69B'], ['Medium', '#FFC34D'], ['Hard', '#FF6B8B']].map(([d, c]) => ({
    d, c, total: set.items.filter(i => i.difficulty === d).length, done: set.items.filter(i => i.difficulty === d && solvedMap[i.id]).length
  })).filter(g => g.total);
  const shown = topics.slice(0, 5);

  return (
    <section className="relative overflow-hidden rounded-[26px] text-white shadow-[0_30px_60px_-30px_rgba(20,10,60,.8)]" style={{ background: q.bg }}>
      <Sky q={q} />
      <div className="relative grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_230px_250px] items-center gap-4 lg:gap-2 p-5 sm:p-8 lg:pr-6">
        <div className="min-w-0 relative z-10">
          <span className="inline-block px-3 py-1 rounded-md bg-[#FFD34D] text-[#2A1A05] text-[11px] font-extrabold tracking-[0.16em] shadow-[0_3px_0_#C99A1E]">QUEST · {q.track}</span>
          <GoldTitle text={set.title} className="mt-3 font-display text-[30px] sm:text-[40px] lg:text-[46px] font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_3px_0_rgba(0,0,0,.25)]" />
          <p className="mt-3 text-[14.5px] sm:text-[15px] text-white/80 max-w-xl">{set.tagline}. {set.items.length} challenges, every one unlocked. Begin your quest.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {shown.map((t, i) => (
              <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/25 text-[12px] font-semibold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full" style={{ background: DOTS[i % DOTS.length] }} />{t}
              </span>
            ))}
            {topics.length > shown.length && <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/25 text-[12px] font-semibold">+{topics.length - shown.length}</span>}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={onStart} className="quest-btn inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-gradient-to-b from-[#FFD95A] to-[#FFB52E] text-[#2A1A05] font-display font-bold text-[15.5px]">
              <Play className="w-4 h-4 fill-current" /> {solved ? 'Continue Quest' : 'Start Quest'} #{next.n}
            </button>
            {onPlan && (
              <button onClick={onPlan} className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border-2 border-white/45 bg-white/5 text-white font-display font-semibold text-[15px] hover:bg-white/15 active:scale-[.98] transition">
                <Flame className="w-4 h-4 text-[#FFC94D]" /> {hasPlan ? 'My daily plan' : 'Daily plan'}
              </button>
            )}
          </div>
        </div>

        {/* mascot */}
        <div className="relative hidden md:block w-[200px] lg:w-[230px] self-end -mb-8 sm:-mb-8 lg:-mb-8">
          <span className="quest-bubble absolute -top-1 right-0 lg:-right-4 z-10 px-3 py-1.5 rounded-xl bg-white text-[#1B1440] text-[13px] font-extrabold shadow-[0_4px_0_rgba(0,0,0,.2)] whitespace-nowrap">{q.bubble}</span>
          <Mascot q={q} className="w-full h-auto" />
        </div>

        {/* status panel */}
        <div className="relative z-10 md:col-span-2 lg:col-span-1 rounded-2xl bg-[#140B33]/55 border border-white/20 backdrop-blur-md p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.15)]">
          <div className="flex items-center justify-between text-[11px] font-extrabold tracking-[0.18em]">
            <span>STATUS</span><span className="text-white/60 truncate max-w-[120px]">PLAYER: {signedIn ? (playerName || 'YOU').split(' ')[0].toUpperCase() : 'GUEST'}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-display font-extrabold"><span className="text-[13px] text-white/70 mr-1">LV.</span><span className="text-[30px] leading-none">{level}</span></p>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFC94D]/20 border border-[#FFC94D]/40 text-[#FFD86B] text-[12px] font-bold"><Flame className="w-3.5 h-3.5" /> {streak} day{streak === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-2.5 flex justify-between text-[10.5px] font-bold tracking-wider text-white/60"><span>EXP</span><span>{solved} / {set.items.length}</span></div>
          <div className="mt-1 h-2 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#5EF0D2] via-[#9FA8FF] to-[#FF7EB6] transition-all duration-700" style={{ width: `${(solved / set.items.length) * 100}%` }} /></div>
          <p className="mt-1 text-[10.5px] text-white/50">{solved ? `${Math.round(toNext)}% to level ${level + 1}` : 'Solve 5 to reach level 1'}</p>
          <div className="mt-3 space-y-1.5">
            {gems.map(g => (
              <div key={g.d} className="flex items-center gap-2.5 rounded-lg bg-white/[.06] px-2.5 py-1.5">
                <span className="w-5 h-5 rotate-45 rounded-[4px] flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,.25)]" style={{ background: g.c }}><span className="w-2 h-2 rounded-[2px] bg-white/60" /></span>
                <span className="flex-1 text-[13px] font-semibold">{g.d}</span>
                <span className="text-[12.5px] font-bold text-white/80 tabular-nums">{g.done}/{g.total}</span>
              </div>
            ))}
          </div>
          {!signedIn && <p className="mt-2.5 text-[11.5px] text-white/60">Sign in to save your progress.</p>}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Featured card on the Interview Prep home                            */
/* ------------------------------------------------------------------ */

export function QuestCard({ set, solved, signedIn, onOpen }) {
  const q = QUEST[set.id] || QUEST['programming-essentials'];
  const diff = ['Easy', 'Medium', 'Hard'].map(d => [d, set.items.filter(i => i.difficulty === d).length]).filter(([, n]) => n);
  return (
    <button onClick={onOpen} className="quest-card group relative overflow-hidden rounded-[22px] text-left text-white h-[250px] sm:h-[290px] p-5 flex flex-col items-start shadow-[0_22px_44px_-26px_rgba(20,10,60,.9)]" style={{ background: q.bg }}>
      <Sky q={q} glyphs={false} />
      <span className="relative inline-block px-2.5 py-0.5 rounded-md bg-[#FFD34D] text-[#2A1A05] text-[10px] font-extrabold tracking-[0.16em] shadow-[0_2px_0_#C99A1E]">QUEST · {q.track}</span>
      <span className="relative mt-2.5 block font-display text-[22px] font-extrabold leading-tight max-w-[78%] drop-shadow-[0_2px_0_rgba(0,0,0,.2)]">{set.title}</span>
      <span className="relative mt-1 block text-[13px] text-white/75 max-w-[62%] leading-snug">{set.tagline}</span>
      <span className="relative mt-3 flex flex-wrap gap-1.5 max-w-[60%]">
        {diff.map(([d, n], i) => (
          <span key={d} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ['#3FD69B', '#FFC34D', '#FF6B8B'][i] }} />{n} {d}
          </span>
        ))}
      </span>
      <Mascot q={q} className="absolute -right-6 -bottom-10 w-[170px] sm:w-[190px] transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.03]" />
      <span className="quest-bubble-sm absolute right-4 top-4 px-2 py-1 rounded-lg bg-white text-[#1B1440] text-[11px] font-extrabold shadow-[0_3px_0_rgba(0,0,0,.2)]">{q.bubble}</span>
      <span className="absolute left-5 bottom-5 right-[44%]">
        {signedIn && solved > 0 && (
          <span className="block mb-2 h-1.5 rounded-full bg-white/20 overflow-hidden"><span className="block h-full rounded-full bg-gradient-to-r from-[#FFD95A] to-[#FFB52E]" style={{ width: `${(solved / set.items.length) * 100}%` }} /></span>
        )}
        <span className="quest-btn-sm inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-gradient-to-b from-[#FFD95A] to-[#FFB52E] text-[#2A1A05] font-display font-bold text-[13.5px] whitespace-nowrap">
          <Play className="w-3.5 h-3.5 fill-current" /> {solved ? `Continue · ${solved}/${set.items.length}` : `Start · ${set.items.length}`}
        </span>
      </span>
    </button>
  );
}
