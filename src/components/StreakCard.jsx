import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Code2, Trophy, X } from 'lucide-react';
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
  if (!s) return <div className="h-[230px] rounded-[24px] bg-gradient-to-br from-[#0C2D26] to-[#013A2B] animate-pulse" />;

  const lit = s.current > 0 && s.codedToday;
  const week = s.recent.slice(-7);
  const startPad = weekdayIndex(week[0].date);
  const next = s.nextMilestone;
  const toNext = next ? Math.round((s.current / next) * 100) : 100;

  return (
    <>
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0C2D26] via-[#013A2B] to-[#1E3B22] text-ivory p-5 sm:p-7 shadow-[0_24px_50px_-28px_rgba(12,45,38,.9)]">
        <span className="absolute -left-10 -bottom-16 w-72 h-72 rounded-full bg-[#FF8A1F] opacity-[.14] blur-3xl" />
        <span className="absolute right-10 -top-20 w-64 h-64 rounded-full bg-[#7DB59A] opacity-10 blur-3xl" />
        {lit && Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="streak-ember" style={{ left: `${6 + i * 3.2}%`, animationDelay: `${i * 0.45}s`, animationDuration: `${3 + (i % 3)}s` }} />
        ))}

        <div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-6 lg:gap-10 items-center">
          {/* flame + number */}
          <div className="flex items-center gap-4">
            <Flame lit={lit} size={84} />
            <div>
              <p className="font-display text-[56px] sm:text-[64px] font-bold leading-none tabular-nums">{count}</p>
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#FFD580]">day{s.current === 1 ? '' : 's'} streak</p>
            </div>
          </div>

          {/* week + status */}
          <div className="min-w-0">
            <p className="font-display text-[19px] sm:text-[21px] font-semibold">Daily coding streak</p>
            <p className="text-[14px] text-ivory/70 mt-0.5">{statusLine(s)}</p>
            <div className="mt-4 flex gap-2 sm:gap-3">
              {week.map((d, i) => {
                const isToday = d.date === s.today;
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1.5">
                    <span className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[13px] font-semibold transition
                      ${d.active ? 'bg-gradient-to-br from-[#FFC24B] to-[#E8641C] text-[#3D1A05] shadow-[0_6px_16px_-6px_rgba(255,138,31,.9)]' : 'bg-white/[.08] border border-white/15 text-ivory/45'}
                      ${isToday && !d.active ? 'streak-today-ring' : ''}`}
                      style={d.active ? { animation: `streakPop .45s ${i * 0.07}s both` } : undefined}>
                      {d.active ? <CheckCircle2 className="w-4 h-4" /> : ''}
                    </span>
                    <span className={`text-[11px] ${isToday ? 'text-[#FFD580] font-semibold' : 'text-ivory/50'}`}>{WEEKDAYS[(startPad + i) % 7]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* stats */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-48">
            <div className="rounded-xl bg-white/[.08] border border-white/10 px-3.5 py-2.5">
              <p className="text-[11.5px] text-ivory/60 flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-[#FFD580]" /> Best streak</p>
              <p className="font-display text-[20px] font-bold">{s.best} <span className="text-[12px] font-normal text-ivory/60">days</span></p>
            </div>
            <div className="rounded-xl bg-white/[.08] border border-white/10 px-3.5 py-2.5">
              <p className="text-[11.5px] text-ivory/60 flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-[#7DB59A]" /> Coding days</p>
              <p className="font-display text-[20px] font-bold">{s.totalDays}</p>
            </div>
            <div className="rounded-xl bg-white/[.08] border border-white/10 px-3.5 py-2.5">
              <p className="text-[11.5px] text-ivory/60">{next ? `Next badge: ${next} days` : 'All badges earned'}</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#FFC24B] to-[#E8641C] transition-all duration-700" style={{ width: `${toNext}%` }} /></div>
            </div>
          </div>
        </div>

        {/* last 5 weeks + badges */}
        <div className="relative mt-6 pt-5 border-t border-white/10 flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.16em] text-ivory/50 mb-2">Last 5 weeks</p>
            <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
              {Array.from({ length: weekdayIndex(s.recent[0].date) }).map((_, i) => <span key={`p${i}`} className="w-3.5 h-3.5" />)}
              {s.recent.map(d => (
                <span key={d.date} title={`${d.date}${d.active ? ' · coded' : ''}`}
                  className={`w-3.5 h-3.5 rounded-[4px] ${d.active ? (d.runs >= 10 ? 'bg-[#FF7A1A]' : d.runs >= 3 ? 'bg-[#FFA43D]' : 'bg-[#FFD07A]') : 'bg-white/10'} ${d.date === s.today ? 'ring-2 ring-[#FFD580] ring-offset-1 ring-offset-[#013A2B]' : ''}`} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.16em] text-ivory/50 mb-2">Streak badges</p>
            <div className="flex flex-wrap gap-2">
              {s.milestones.map(m => (
                <span key={m.days} title={m.reached ? `Reached a ${m.days}-day streak` : `Reach a ${m.days}-day streak`}
                  className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-center leading-none border transition
                    ${m.reached ? 'bg-gradient-to-br from-[#FFD580] to-[#E8641C] border-[#FFE3A8] text-[#3D1A05] shadow-[0_8px_18px_-8px_rgba(255,138,31,.9)] streak-badge-shine' : 'bg-white/5 border-white/15 text-ivory/40'}`}>
                  <span className="font-display text-[15px] font-bold">{m.days}</span>
                  <span className="text-[8.5px] uppercase tracking-wider mt-0.5">days</span>
                </span>
              ))}
            </div>
          </div>
        </div>
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
      <div className="relative w-full max-w-sm rounded-[28px] overflow-hidden bg-gradient-to-b from-[#123E30] to-[#0C2D26] text-ivory text-center px-6 pt-10 pb-7 shadow-2xl streak-pop-in">
        <button onClick={onClose} className="absolute right-4 top-4 text-ivory/60 hover:text-ivory" aria-label="Close"><X className="w-5 h-5" /></button>
        <div className="relative mx-auto w-44 h-44 flex items-center justify-center">
          <span className="absolute inset-0 streak-rays" />
          <span className="absolute inset-6 rounded-full bg-[#FF8A1F] opacity-30 blur-2xl streak-glow" />
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} className="streak-spark" style={{ '--a': `${(360 / 14) * i}deg`, animationDelay: `${0.25 + (i % 4) * 0.06}s` }} />
          ))}
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
