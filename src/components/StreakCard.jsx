import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Code2, Trophy, X } from 'lucide-react';
import { api } from '../services/api';
import { readStudent, userIdOf } from '../utils/session';

/* ------------------------------------------------------------------ */
/* Animated flame                                                      */
/* ------------------------------------------------------------------ */

/** Layered SVG flame that flickers; grey when the streak is not lit today. */
export function Flame({ lit = true, size = 96, className = '' }) {
  const id = useRef(`f${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} className={`${lit ? 'streak-flame' : ''} ${className}`} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}o`} cx="50%" cy="75%" r="70%">
          <stop offset="0%" stopColor={lit ? '#FFE08A' : '#D9D4C9'} />
          <stop offset="45%" stopColor={lit ? '#FF9A2E' : '#B9B2A5'} />
          <stop offset="100%" stopColor={lit ? '#E2461E' : '#8F887B'} />
        </radialGradient>
        <radialGradient id={`${id}i`} cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#FFFBEA" />
          <stop offset="60%" stopColor={lit ? '#FFD45C' : '#E7E2D8'} />
          <stop offset="100%" stopColor={lit ? '#FF9A2E' : '#C9C2B5'} />
        </radialGradient>
      </defs>
      {lit && <ellipse cx="60" cy="132" rx="34" ry="8" fill="#FF7A1A" opacity=".25" className="streak-glow" />}
      <path className="streak-outer" fill={`url(#${id}o)`}
        d="M60 6C66 30 92 44 96 76c4 34-14 62-36 62S20 114 22 84c2-20 14-30 18-46 8 12 6 22 12 28 2-22 2-40 8-60z" />
      <path className="streak-inner" fill={`url(#${id}i)`}
        d="M60 58c4 14 20 24 20 46 0 18-9 28-20 28s-20-10-20-26c0-12 8-18 10-28 4 6 4 12 7 14 1-12 0-22 3-34z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const weekdayIndex = (key) => (new Date(`${key}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
const celebratedKey = (email, day) => `arb_streak_party_${email}_${day}`;

function statusLine(s) {
  if (!s.current) return 'Run any code today to light your first flame.';
  if (s.codedToday) return `You coded today. Your streak is safe until midnight.`;
  return `Code today to keep your ${s.current}-day streak alive!`;
}

/* ------------------------------------------------------------------ */
/* Dashboard card                                                      */
/* ------------------------------------------------------------------ */

export default function StreakCard() {
  const [s, setS] = useState(null);
  const [party, setParty] = useState(false);
  const [more, setMore] = useState(false);     // phones: calendar and badges are folded away
  const email = userIdOf(readStudent());

  useEffect(() => {
    let live = true;
    api.getStreak().then((r) => {
      if (!live || !r?.streak) return;
      setS(r.streak);
      try {
        const k = celebratedKey(email, r.streak.today);
        if (r.streak.codedToday && r.streak.current > 0 && !localStorage.getItem(k)) {
          localStorage.setItem(k, '1');
          setParty(true);
        }
      } catch { /* storage unavailable: skip the celebration */ }
    }).catch(() => {});
    const onStreak = (e) => setS(e.detail);
    window.addEventListener('arb:streak', onStreak);
    return () => { live = false; window.removeEventListener('arb:streak', onStreak); };
  }, [email]);

  const count = useCountUp(s?.current || 0);
  if (!s) return <div className="h-[132px] rounded-2xl bg-white border border-brand-900/10 animate-pulse" />;

  const lit = s.current > 0 && s.codedToday;
  const week = s.recent.slice(-7);
  const startPad = weekdayIndex(week[0].date);
  const next = s.nextMilestone;
  const toNext = next ? Math.round((s.current / next) * 100) : 100;

  return (
    <>
      <section className="relative rounded-2xl bg-white border border-brand-900/10 shadow-[0_14px_34px_-24px_rgba(1,58,43,.45)] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-7">
          {/* flame + number */}
          <div className="flex items-center gap-3 md:pr-7 md:border-r md:border-brand-900/10">
            <span className="shrink-0 w-12 h-12 rounded-xl bg-[#FFF4E3] border border-[#F6DDB5] flex items-center justify-center">
              <Flame lit={lit} size={28} className="w-7 h-auto" />
            </span>
            <div>
              <p className="font-display text-[30px] font-bold leading-none text-evergreen tabular-nums">{count}<span className="ml-1.5 text-[13px] font-semibold text-charcoal/55">day{s.current === 1 ? '' : 's'}</span></p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">Coding streak</p>
            </div>
          </div>

          {/* this week + status */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-charcoal/65">{statusLine(s)}</p>
            <div className="mt-2.5 flex gap-2 sm:gap-2.5">
              {week.map((d, i) => {
                const isToday = d.date === s.today;
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center transition
                      ${d.active ? 'bg-forest text-ivory' : 'bg-cream border border-brand-900/10'}
                      ${isToday ? 'ring-2 ring-leaf ring-offset-2 ring-offset-white' : ''}`}>
                      {d.active && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`text-[10.5px] ${isToday ? 'text-leaf-dark font-semibold' : 'text-charcoal/45'}`}>{WEEKDAYS[(startPad + i) % 7]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 gap-2 md:w-[300px] shrink-0">
            <div className="rounded-xl bg-cream/70 border border-brand-900/[.07] px-3 py-2">
              <p className="text-[10.5px] text-charcoal/55 flex items-center gap-1"><Trophy className="w-3 h-3 text-[#C9962B]" /> Best</p>
              <p className="font-display text-[17px] font-bold text-evergreen leading-tight">{s.best}<span className="ml-1 text-[11px] font-normal text-charcoal/50">days</span></p>
            </div>
            <div className="rounded-xl bg-cream/70 border border-brand-900/[.07] px-3 py-2">
              <p className="text-[10.5px] text-charcoal/55 flex items-center gap-1"><Code2 className="w-3 h-3 text-leaf-dark" /> Coded</p>
              <p className="font-display text-[17px] font-bold text-evergreen leading-tight">{s.totalDays}<span className="ml-1 text-[11px] font-normal text-charcoal/50">days</span></p>
            </div>
            <div className="rounded-xl bg-cream/70 border border-brand-900/[.07] px-3 py-2">
              <p className="text-[10.5px] text-charcoal/55">{next ? `Next: ${next} days` : 'All badges'}</p>
              <div className="mt-2 h-1.5 rounded-full bg-brand-900/10 overflow-hidden"><div className="h-full rounded-full bg-leaf transition-all duration-700" style={{ width: `${toNext}%` }} /></div>
            </div>
          </div>
        </div>

        {/* last 5 weeks + badges, folded away to keep the card compact */}
        <button onClick={() => setMore(m => !m)} className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-sage hover:text-forest transition-colors">
          {more ? 'Hide calendar & badges' : 'Calendar & badges'} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${more ? 'rotate-180' : ''}`} />
        </button>
        {more && (
          <div className="mt-3 pt-4 border-t border-brand-900/10 flex flex-col md:flex-row gap-5 md:items-start md:justify-between animate-fade-in">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-charcoal/45 mb-2">Last 5 weeks</p>
              <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
                {Array.from({ length: weekdayIndex(s.recent[0].date) }).map((_, i) => <span key={`p${i}`} className="w-3 h-3" />)}
                {s.recent.map(d => (
                  <span key={d.date} title={`${d.date}${d.active ? ' · coded' : ''}`}
                    className={`w-3 h-3 rounded-[3px] ${d.active ? (d.runs >= 10 ? 'bg-forest' : d.runs >= 3 ? 'bg-sage' : 'bg-leaf/60') : 'bg-brand-900/[.07]'} ${d.date === s.today ? 'ring-1 ring-leaf ring-offset-1 ring-offset-white' : ''}`} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-charcoal/45 mb-2">Streak badges</p>
              <div className="flex flex-wrap gap-2">
                {s.milestones.map(m => (
                  <span key={m.days} title={m.reached ? `Reached a ${m.days}-day streak` : `Reach a ${m.days}-day streak`}
                    className={`w-11 h-11 rounded-full flex flex-col items-center justify-center text-center leading-none border
                      ${m.reached ? 'bg-forest border-[#D9B25A] text-ivory' : 'bg-white border-brand-900/15 text-charcoal/35'}`}>
                    <span className="font-display text-[14px] font-bold">{m.days}</span>
                    <span className="text-[8px] uppercase tracking-wider mt-0.5">days</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
      {party && <StreakCelebration streak={s} onClose={() => setParty(false)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Full-screen celebration (once a day, on the dashboard)              */
/* ------------------------------------------------------------------ */

export function StreakCelebration({ streak, onClose }) {
  const n = streak.current;
  const milestone = streak.milestones.find(m => m.days === n);
  const [shown, setShown] = useState(Math.max(0, n - 1));
  useEffect(() => { const t = setTimeout(() => setShown(n), 900); return () => clearTimeout(t); }, [n]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Streak celebration">
      <div className="absolute inset-0 bg-[#0C2D26]/80 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-[28px] bg-gradient-to-b from-[#123E30] to-[#0C2D26] text-ivory text-center px-6 pt-10 pb-7 shadow-2xl streak-pop-in">
        <button onClick={onClose} className="absolute right-4 top-4 text-ivory/60 hover:text-ivory" aria-label="Close"><X className="w-5 h-5" /></button>
        <div className="relative mx-auto w-44 h-44 flex items-center justify-center">
          <span className="absolute inset-8 rounded-full bg-[#FF8A1F] opacity-20 blur-2xl" />
          <Flame lit size={110} className="relative streak-flame-zoom" />
        </div>
        <p key={shown} className="font-display text-[64px] font-bold leading-none mt-1 streak-number-flip tabular-nums">{shown}</p>
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#FFD580]">day streak!</p>
        <p className="mt-4 text-[15px] text-ivory/80">
          {milestone ? `You unlocked the ${n}-day badge. That is real consistency!`
            : n === 1 ? 'Your first flame is lit. Code again tomorrow to grow it.'
            : `You have coded ${n} days in a row. Keep the flame burning!`}
        </p>
        <button onClick={onClose} className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-[#FFC24B] to-[#E8641C] text-[#3D1A05] font-display font-bold text-[16px] hover:brightness-105 active:scale-[.99] transition">Keep going</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toast after the first run of the day (anywhere on the site)         */
/* ------------------------------------------------------------------ */

export function StreakToast() {
  const [s, setS] = useState(null);
  useEffect(() => {
    let timer;
    const onStreak = (e) => {
      setS(e.detail);
      clearTimeout(timer);
      timer = setTimeout(() => setS(null), 5200);
    };
    window.addEventListener('arb:streak', onStreak);
    return () => { clearTimeout(timer); window.removeEventListener('arb:streak', onStreak); };
  }, []);
  if (!s) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-[130] streak-toast" role="status">
      <div className="flex items-center gap-3 pl-2 pr-5 py-2 rounded-full bg-gradient-to-r from-[#0C2D26] to-[#013A2B] text-ivory shadow-[0_18px_40px_-14px_rgba(12,45,38,.9)] border border-[#FFD580]/30">
        <Flame lit size={34} />
        <div className="leading-tight">
          <p className="font-display font-bold text-[15px]">{s.current}-day streak <span className="text-[#FFD580]">+1</span></p>
          <p className="text-[12px] text-ivory/65">{s.current === 1 ? 'First flame lit. See you tomorrow!' : 'You coded today. Keep it going!'}</p>
        </div>
      </div>
    </div>
  );
}
