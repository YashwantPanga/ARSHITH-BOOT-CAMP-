import React, { useEffect, useMemo, useState } from 'react';
import { Check, Flag, Minus, Pencil, Plus, Rocket, Sparkles, X, Zap } from 'lucide-react';
import { Flame } from '../StreakCard';

/* ------------------------------------------------------------------ */
/* Plan maths (India time)                                             */
/* ------------------------------------------------------------------ */

const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const dayKey = (d = new Date()) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const weekday = (key) => new Date(`${key}T00:00:00Z`).getUTCDay();
const shift = (key, n) => { const d = new Date(`${key}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const XP_PER_PROBLEM = 10;

/** Today's mission, the mission streak and per-day solve counts for one set. */
export function planStats(plan, solvedMap = {}) {
  const perDay = {};
  for (const at of Object.values(solvedMap)) { const k = dayKey(at); perDay[k] = (perDay[k] || 0) + 1; }
  const today = dayKey();
  if (!plan) return { perDay, today };
  const start = dayKey(plan.startedAt);
  const planned = (k) => k >= start && plan.days.includes(weekday(k));
  const met = (k) => (perDay[k] || 0) >= plan.perDay;
  const doneToday = perDay[today] || 0;
  const todayPlanned = plan.days.includes(weekday(today));

  // consecutive planned days met, counting back from today (today only counts once met)
  let streak = 0;
  let k = todayPlanned && !met(today) ? shift(today, -1) : today;
  for (let guard = 0; guard < 400 && k >= start; guard++, k = shift(k, -1)) {
    if (!planned(k)) continue;
    if (!met(k)) break;
    streak++;
  }
  return { perDay, today, start, planned, met, doneToday, todayPlanned, left: Math.max(0, plan.perDay - doneToday), streak };
}

/** Date (India time) on which the remaining problems are done at this pace. */
function finishDate(remaining, perDay, days) {
  if (!remaining || !days.length) return null;
  let k = dayKey();
  let left = remaining;
  for (let guard = 0; guard < 2000; guard++, k = shift(k, 1)) {
    if (days.includes(weekday(k))) left -= perDay;
    if (left <= 0) break;
  }
  return new Date(`${k}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/* ------------------------------------------------------------------ */
/* Illustrations                                                       */
/* ------------------------------------------------------------------ */

/** Rocket on a launch pad; `launch` sends it up with a flame trail. */
function RocketArt({ launch = false }) {
  return (
    <svg viewBox="0 0 200 150" className="w-44 h-36 mx-auto" aria-hidden="true">
      <defs>
        <linearGradient id="rk-body" x1="0" x2="1"><stop offset="0%" stopColor="#FBF8F1" /><stop offset="100%" stopColor="#D9E4DE" /></linearGradient>
        <radialGradient id="rk-glow" cx="50%" cy="60%" r="55%"><stop offset="0%" stopColor="#F2D27A" stopOpacity=".55" /><stop offset="100%" stopColor="#F2D27A" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="100" cy="80" r="70" fill="url(#rk-glow)" className="mission-pulse" />
      {[[30, 30], [168, 42], [150, 18], [46, 62], [176, 96]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="#F2D27A" className="mission-twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
      ))}
      <ellipse cx="100" cy="138" rx="46" ry="7" fill="#013A2B" opacity=".18" />
      <g className={launch ? 'mission-launch' : 'mission-hover'}>
        <path d="M100 18c18 14 26 38 24 66H76c-2-28 6-52 24-66z" fill="url(#rk-body)" stroke="#013A2B" strokeWidth="3" />
        <circle cx="100" cy="56" r="10" fill="#1E5141" stroke="#013A2B" strokeWidth="3" />
        <circle cx="97" cy="53" r="3" fill="#A8E6C1" />
        <path d="M76 70l-16 22h18zM124 70l16 22h-18z" fill="#E8641C" stroke="#013A2B" strokeWidth="3" strokeLinejoin="round" />
        <path d="M86 84h28l-4 10H90z" fill="#013A2B" />
        <path d="M92 96q8 26 8 34q0-8 8-34z" fill="#FFB347" className="mission-flame" />
        <path d="M96 96q4 14 4 20q0-6 4-20z" fill="#FFF1A8" className="mission-flame" />
      </g>
    </svg>
  );
}

/** Treasure chest; `open` lifts the lid and lets coins fly out. */
function Chest({ open }) {
  return (
    <svg viewBox="0 0 80 72" className="w-16 h-[58px] shrink-0" aria-hidden="true">
      {open && <circle cx="40" cy="34" r="30" fill="#F2D27A" opacity=".35" className="mission-pulse" />}
      {open && [0, 1, 2, 3].map(i => (
        <circle key={i} cx="40" cy="34" r="4.5" fill="#F2B544" stroke="#B5781A" strokeWidth="1.5" className="mission-coin" style={{ '--dx': `${[-18, -6, 8, 20][i]}px`, animationDelay: `${i * 0.12}s` }} />
      ))}
      <rect x="10" y="34" width="60" height="32" rx="6" fill="#9C5A1E" stroke="#5E3510" strokeWidth="3" />
      <rect x="10" y="44" width="60" height="6" fill="#F2B544" stroke="#5E3510" strokeWidth="2" />
      <rect x="34" y="40" width="12" height="14" rx="3" fill="#FFD95A" stroke="#5E3510" strokeWidth="2" />
      <g className={open ? 'mission-lid-open' : ''} style={{ transformOrigin: '12px 34px' }}>
        <path d="M10 34c0-14 10-22 30-22s30 8 30 22z" fill="#B86A26" stroke="#5E3510" strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 12v22M44 12v22" stroke="#F2B544" strokeWidth="3" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* "Set your daily mission" dialog                                     */
/* ------------------------------------------------------------------ */

const LEVELS = [
  { n: 1, name: 'Warm-up', emoji: '🌱', note: 'Easy pace, build the habit' },
  { n: 2, name: 'Steady', emoji: '🔥', note: 'Most popular choice' },
  { n: 3, name: 'Beast mode', emoji: '⚡', note: 'For interview week' }
];

export function PlanModal({ set, initial, onSave, onClose, solvedCount = 0 }) {
  const [perDay, setPerDay] = useState(initial?.perDay || 2);
  const [days, setDays] = useState(initial?.days || [1, 2, 3, 4, 5]);
  const [state, setState] = useState('edit');       // edit | saving | done
  const [error, setError] = useState('');
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && state !== 'saving') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, state]);

  const toggle = (d) => setDays(ds => (ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d].sort()));
  const remaining = Math.max(0, set.items.length - solvedCount);
  const finish = finishDate(remaining, perDay, days);
  const save = async () => {
    if (!days.length) { setError('Pick at least one training day.'); return; }
    setState('saving'); setError('');
    const ok = await onSave({ perDay, days });
    if (!ok) { setState('edit'); setError('Could not save your mission. Check your connection and try again.'); return; }
    setState('done');
    setTimeout(onClose, 1700);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Daily mission">
      <div className="absolute inset-0 bg-[#0C2D26]/55 backdrop-blur-[2px] animate-fade-in" onClick={() => state !== 'saving' && onClose()} />
      <div className="plan-sheet relative w-full sm:max-w-md max-h-[94vh] overflow-y-auto bg-white rounded-t-[26px] sm:rounded-[26px] shadow-2xl">
        <div className="relative px-5 sm:px-7 pt-5 pb-3 bg-gradient-to-b from-[#EFF4F1] to-white rounded-t-[26px]">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-display text-[16px] font-bold text-evergreen"><Rocket className="w-5 h-5 text-[#E8641C]" /> {initial ? 'Update your daily mission' : 'Set your daily mission'}</p>
            <button onClick={onClose} disabled={state === 'saving'} className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-charcoal/50 hover:bg-white" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
          <RocketArt launch={state === 'done'} />
        </div>

        <div className="px-5 sm:px-7 pb-[calc(20px+env(safe-area-inset-bottom))]">
          {state === 'done' ? (
            <div className="text-center py-3 animate-fade-up">
              <p className="font-display text-[22px] font-bold text-evergreen">Mission launched! 🚀</p>
              <p className="mt-1 text-[14px] text-charcoal/65">{perDay} problem{perDay > 1 ? 's' : ''} on each training day{finish ? `. Finish line: ${finish}` : ''}.</p>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-sage">1 · Pick your intensity</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {LEVELS.map(l => {
                  const on = perDay === l.n;
                  return (
                    <button key={l.n} onClick={() => setPerDay(l.n)} aria-pressed={on}
                      className={`relative rounded-2xl border-2 px-2 py-3 text-center transition active:scale-[.97] ${on ? 'border-[#E8A13A] bg-[#FFF6E0] shadow-[0_10px_20px_-14px_rgba(232,161,58,.9)]' : 'border-brand-900/10 bg-white hover:border-brand-300'}`}>
                      <span className="block text-[22px] leading-none">{l.emoji}</span>
                      <span className="block mt-1.5 font-display text-[14px] font-bold text-evergreen">{l.name}</span>
                      <span className="block text-[11.5px] text-charcoal/55">{l.n} a day</span>
                      {on && <Check className="absolute top-1.5 right-1.5 w-4 h-4 text-[#C47A1E]" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between text-[12.5px] text-charcoal/60">
                <span>{LEVELS.find(l => l.n === perDay)?.note || 'Custom pace'}</span>
                <span className="inline-flex items-center gap-1">
                  Custom
                  <button onClick={() => setPerDay(n => Math.max(1, n - 1))} className="w-7 h-7 rounded-lg border border-brand-900/15 flex items-center justify-center active:bg-brand-50" aria-label="Fewer"><Minus className="w-3.5 h-3.5" /></button>
                  <span className="w-5 text-center font-bold text-evergreen tabular-nums">{perDay}</span>
                  <button onClick={() => setPerDay(n => Math.min(10, n + 1))} className="w-7 h-7 rounded-lg border border-brand-900/15 flex items-center justify-center active:bg-brand-50" aria-label="More"><Plus className="w-3.5 h-3.5" /></button>
                </span>
              </div>

              <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em] text-sage">2 · Choose your training days</p>
              <div className="mt-2 flex justify-between gap-1.5">
                {WEEK.map((w, d) => {
                  const on = days.includes(d);
                  return (
                    <button key={w} onClick={() => toggle(d)} aria-pressed={on} aria-label={w}
                      className={`flex-1 aspect-square max-w-[46px] rounded-full font-display text-[14px] font-bold transition active:scale-90 ${on ? 'bg-gradient-to-br from-[#1E5141] to-[#013A2B] text-[#F2D27A] shadow-[0_6px_14px_-8px_rgba(1,58,43,.9)]' : 'bg-cream text-charcoal/40 border border-brand-900/10'}`}>
                      {SHORT[d]}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-2 text-[12px]">
                <button onClick={() => setDays([1, 2, 3, 4, 5])} className="px-2.5 py-1 rounded-full bg-brand-50 text-forest font-semibold">Weekdays</button>
                <button onClick={() => setDays([0, 6])} className="px-2.5 py-1 rounded-full bg-brand-50 text-forest font-semibold">Weekends</button>
                <button onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])} className="px-2.5 py-1 rounded-full bg-brand-50 text-forest font-semibold">Every day</button>
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#013A2B] to-[#1E5141] text-ivory p-3.5 flex items-center gap-3">
                <Flag className="w-5 h-5 text-[#F2D27A] shrink-0" />
                <p className="text-[13.5px] leading-snug">
                  {!days.length ? 'Pick your training days to see your finish line.'
                    : remaining === 0 ? 'You have solved every problem here. Set a mission to keep revising!'
                    : <>Finish line: <b className="text-[#F2D27A]">{finish}</b> · {remaining} problem{remaining > 1 ? 's' : ''} to go · +{perDay * XP_PER_PROBLEM} XP a day</>}
                </p>
              </div>
              {error && <p className="mt-2 text-center text-[13px] text-rose-600">{error}</p>}
              <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2.5">
                <button onClick={onClose} disabled={state === 'saving'} className="h-12 rounded-xl border border-brand-900/15 text-charcoal/75 font-semibold text-[15px] hover:bg-cream">Not now</button>
                <button onClick={save} disabled={state === 'saving'} className="h-12 rounded-xl bg-gradient-to-b from-[#FFD95A] to-[#FFB52E] text-[#2A1A05] font-display font-bold text-[15.5px] shadow-[0_4px_0_#C27A12] active:translate-y-[3px] active:shadow-[0_1px_0_#C27A12] transition disabled:opacity-70 inline-flex items-center justify-center gap-2">
                  <Rocket className="w-4 h-4" /> {state === 'saving' ? 'Launching…' : initial ? 'Update mission' : 'Launch mission'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Daily Mission card with this week's quest road                       */
/* ------------------------------------------------------------------ */

function QuestRoad({ stats, plan }) {
  // this week, Monday to Sunday
  const monday = shift(stats.today, -((weekday(stats.today) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => shift(monday, i));
  const xs = [14, 50, 86, 122, 158, 194, 230];
  const ys = [44, 22, 44, 22, 44, 22, 44];
  const path = xs.map((x, i) => `${i ? 'L' : 'M'}${x} ${ys[i]}`).join(' ');
  return (
    <svg viewBox="0 0 244 70" className="w-full h-auto mt-3" role="img" aria-label="This week's quest road">
      <path d={path} fill="none" stroke="#DDE8E2" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 10" />
      {week.map((k, i) => {
        const x = xs[i], y = ys[i];
        const isToday = k === stats.today;
        const planned = k >= stats.start && plan.days.includes(weekday(k));   // days before the mission began are off
        const met = planned && stats.met(k);
        const missed = planned && !met && k < stats.today;
        const day = SHORT[weekday(k)];
        return (
          <g key={k}>
            {isToday && <circle cx={x} cy={y} r="15" fill="#F2D27A" opacity=".35" className="mission-pulse" />}
            {!planned ? (
              <g><circle cx={x} cy={y} r="5" fill="#B9D3C4" /><path d={`M${x - 4} ${y - 4}q2 -5 4 0q2 -5 4 0`} fill="none" stroke="#7DB59A" strokeWidth="1.6" /></g>
            ) : met ? (
              <g className="mission-coin-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <circle cx={x} cy={y} r="11" fill="#F2B544" stroke="#B5781A" strokeWidth="2.5" />
                <circle cx={x} cy={y} r="7" fill="none" stroke="#FFE08A" strokeWidth="1.5" />
                <path d={`M${x - 4} ${y}l3 3 5 -6`} fill="none" stroke="#7A4A0E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ) : missed ? (
              <g><circle cx={x} cy={y} r="10" fill="#EDEAE3" stroke="#CBC5B8" strokeWidth="2" /><path d={`M${x - 4} ${y - 6}l3 5-3 3 4 4`} fill="none" stroke="#B3AB9C" strokeWidth="1.8" /></g>
            ) : (
              <circle cx={x} cy={y} r="10" fill={isToday ? '#FFF6E0' : '#fff'} stroke={isToday ? '#E8A13A' : '#90B1A2'} strokeWidth="2.5" strokeDasharray={isToday ? '' : '3 3'} />
            )}
            {isToday && <g className="mission-pin"><path d={`M${x} ${y - 14}l-6 -9a7 7 0 1 1 12 0z`} fill="#E8641C" /><circle cx={x} cy={y - 26} r="2.6" fill="#fff" /></g>}
            <text x={x} y="66" textAnchor="middle" fontSize="9" fontWeight="700" fill={isToday ? '#C47A1E' : '#8A9A92'}>{day}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function MyPlanCard({ set, plan, solvedMap, signedIn, onSetUp, onEdit, compact = false }) {
  const stats = useMemo(() => planStats(plan, solvedMap), [plan, solvedMap]);

  if (!plan) {
    return (
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#013A2B] to-[#1E5141] text-ivory p-5">
        <span className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-[#F2D27A]/15" />
        <div className="relative flex items-center gap-3.5">
          <span className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0"><Rocket className="w-6 h-6 text-[#F2D27A]" /></span>
          <div className="min-w-0">
            <p className="font-display text-[17px] font-bold">Start a daily mission</p>
            <p className="text-[12.5px] text-ivory/70 mt-0.5">Choose your pace and training days. Collect coins, open the chest and keep your streak.</p>
          </div>
        </div>
        <button onClick={onSetUp} className="relative mt-3.5 w-full h-10 rounded-xl bg-gradient-to-b from-[#FFD95A] to-[#FFB52E] text-[#2A1A05] font-display font-bold text-[14px] shadow-[0_3px_0_#C27A12] active:translate-y-[2px] transition inline-flex items-center justify-center gap-1.5">
          <Rocket className="w-4 h-4" /> {signedIn ? 'Set my mission' : 'Sign in to start'}
        </button>
      </div>
    );
  }

  const done = stats.todayPlanned && stats.left === 0;
  const remaining = Math.max(0, set.items.length - Object.keys(solvedMap || {}).length);
  const finish = finishDate(remaining, plan.perDay, plan.days);
  const segments = Array.from({ length: plan.perDay }, (_, i) => i < stats.doneToday);

  return (
    <div className="rounded-[20px] border border-brand-900/10 bg-white p-4 sm:p-5 shadow-[0_14px_30px_-24px_rgba(12,45,38,.6)]">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[17px] font-bold text-evergreen flex items-center gap-2"><Zap className="w-4 h-4 text-[#E8A13A] fill-[#F2D27A]" /> Daily Mission</h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF1E6] text-[#C2561A] text-[12px] font-bold" title="Mission streak: training days completed in a row"><Flame lit={stats.streak > 0} size={14} /> {stats.streak}</span>
          <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/45 hover:bg-cream hover:text-forest" aria-label="Edit mission"><Pencil className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className={`mt-3 rounded-2xl p-3 flex items-center gap-3 ${done ? 'bg-gradient-to-r from-[#FFF6E0] to-[#FFEBC2] border border-[#F2D27A]' : 'bg-cream border border-brand-900/[.08]'}`}>
        <Chest open={done} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold text-evergreen leading-tight">
            {!stats.todayPlanned ? 'Rest day: recharge' : done ? 'Mission complete!' : `Solve ${plan.perDay} problem${plan.perDay > 1 ? 's' : ''}`}
          </p>
          <p className="text-[12.5px] text-charcoal/60 mt-0.5">
            {!stats.todayPlanned ? 'No mission today. Bonus problems still earn XP.' : done ? `Chest opened · +${plan.perDay * XP_PER_PROBLEM} XP earned` : `${stats.left} to go · reward +${plan.perDay * XP_PER_PROBLEM} XP`}
          </p>
          {stats.todayPlanned && (
            <div className="mt-2 flex gap-1">
              {segments.map((on, i) => <span key={i} className={`h-2 flex-1 rounded-full transition-colors duration-500 ${on ? 'bg-gradient-to-r from-[#FFC24B] to-[#E8641C]' : 'bg-brand-100'}`} />)}
            </div>
          )}
        </div>
      </div>

      <QuestRoad stats={stats} plan={plan} />

      {!compact && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-charcoal/60">
          <span className="inline-flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-sage" />{finish ? <>Finish line <b className="text-evergreen">{finish}</b></> : 'All problems solved'}</span>
          <span className="inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#E8A13A]" />{plan.perDay}/day · {plan.days.length === 7 ? 'daily' : `${plan.days.length} days/wk`}</span>
        </div>
      )}
    </div>
  );
}
