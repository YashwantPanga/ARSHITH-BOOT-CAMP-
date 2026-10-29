import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Minus, Pencil, Plus, Target, X } from 'lucide-react';
import { Flame } from '../StreakCard';

/* ------------------------------------------------------------------ */
/* Plan maths (India time)                                             */
/* ------------------------------------------------------------------ */

const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
export const dayKey = (d = new Date()) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const weekday = (key) => new Date(`${key}T00:00:00Z`).getUTCDay();
const shift = (key, n) => { const d = new Date(`${key}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Today's goal, the plan streak and per-day solve counts for one set. */
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

/* ------------------------------------------------------------------ */
/* Animated target                                                     */
/* ------------------------------------------------------------------ */

function TargetArt({ glow = '#7DB59A', hit = false }) {
  return (
    <svg viewBox="0 0 200 160" className="w-48 h-40 mx-auto" aria-hidden="true">
      <defs>
        <radialGradient id="planGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={glow} stopOpacity=".45" /><stop offset="100%" stopColor={glow} stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="96" cy="84" r="72" fill="url(#planGlow)" className="plan-glow" />
      {[60, 46, 32, 18].map((r, i) => (
        <circle key={r} cx="96" cy="84" r={r} fill={i % 2 ? '#FBF8F1' : '#013A2B'} stroke={i % 2 ? '#013A2B' : glow} strokeWidth="3"
          className="plan-ring" style={{ animationDelay: `${i * 0.09}s` }} />
      ))}
      <circle cx="96" cy="84" r="7" fill="#F2B544" className="plan-ring" style={{ animationDelay: '.38s' }} />
      <g className={hit ? 'plan-arrow-hit' : 'plan-arrow'}>
        <line x1="96" y1="84" x2="168" y2="24" stroke="#C47A1E" strokeWidth="5" strokeLinecap="round" />
        <path d="M160 18 l18 -4 -4 18 z M168 24 l14 -2 M168 24 l2 -14" fill="#F2B544" stroke="#C47A1E" strokeWidth="2" strokeLinejoin="round" />
      </g>
      {hit && Array.from({ length: 10 }).map((_, i) => (
        <circle key={i} cx="96" cy="84" r="3.5" fill={i % 2 ? '#F2B544' : glow} className="plan-burst" style={{ '--a': `${i * 36}deg` }} />
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* "New study plan" dialog                                             */
/* ------------------------------------------------------------------ */

export function PlanModal({ set, initial, glow, onSave, onClose }) {
  const [perDay, setPerDay] = useState(initial?.perDay || 1);
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
  const weekly = perDay * days.length;
  const weeks = days.length ? Math.ceil(set.items.length / weekly) : 0;
  const save = async () => {
    if (!days.length) { setError('Pick at least one day.'); return; }
    setState('saving'); setError('');
    const ok = await onSave({ perDay, days });
    if (!ok) { setState('edit'); setError('Could not save your plan. Check your connection and try again.'); return; }
    setState('done');
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Study plan">
      <div className="absolute inset-0 bg-[#0C2D26]/55 backdrop-blur-[2px] animate-fade-in" onClick={() => state !== 'saving' && onClose()} />
      <div className="plan-sheet relative w-full sm:max-w-md max-h-[94vh] overflow-y-auto bg-white rounded-t-[26px] sm:rounded-[26px] shadow-2xl px-5 sm:px-7 pt-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-display text-[16px] font-semibold text-evergreen"><CalendarDays className="w-5 h-5 text-sage" /> {initial ? 'Edit study plan' : 'New study plan'}</p>
          <button onClick={onClose} disabled={state === 'saving'} className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-charcoal/50 hover:bg-cream" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <TargetArt glow={glow} hit={state === 'done'} />

        {state === 'done' ? (
          <div className="text-center pb-3 animate-fade-up">
            <p className="font-display text-[22px] font-bold text-evergreen">Plan locked in!</p>
            <p className="mt-1 text-[14px] text-charcoal/65">{perDay} problem{perDay > 1 ? 's' : ''} on {days.length === 7 ? 'every day' : days.map(d => WEEK[d].slice(0, 1) + WEEK[d].slice(1).toLowerCase()).join(', ')}. Your calendar is ready.</p>
          </div>
        ) : (
          <>
            <p className="text-center text-[15px] text-charcoal/75">
              I commit to solve
              <span className="inline-flex items-center mx-2 align-middle rounded-xl border border-brand-900/15 bg-cream overflow-hidden">
                <button onClick={() => setPerDay(n => Math.max(1, n - 1))} className="w-9 h-9 flex items-center justify-center text-forest active:bg-brand-100" aria-label="Fewer"><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center font-display text-[18px] font-bold text-evergreen tabular-nums">{perDay}</span>
                <button onClick={() => setPerDay(n => Math.min(10, n + 1))} className="w-9 h-9 flex items-center justify-center text-forest active:bg-brand-100" aria-label="More"><Plus className="w-4 h-4" /></button>
              </span>
              problem{perDay > 1 ? 's' : ''} on every
            </p>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {WEEK.map((w, d) => {
                const on = days.includes(d);
                return (
                  <button key={w} onClick={() => toggle(d)} aria-pressed={on}
                    className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition active:scale-95 ${on ? 'bg-forest border-forest text-ivory shadow-[0_8px_16px_-10px_rgba(1,58,43,.9)]' : 'bg-white border-brand-900/15 text-charcoal/50'}`}>
                    <span className="text-[10.5px] font-semibold tracking-wide">{w}</span>
                    <span className="font-display text-[15px] font-bold">{on ? perDay : '–'}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[13px] text-charcoal/55">
              {days.length ? `${weekly} problem${weekly > 1 ? 's' : ''} a week · finish all ${set.items.length} in about ${weeks} week${weeks > 1 ? 's' : ''}` : 'Pick the days you will practise.'}
            </p>
            {error && <p className="mt-2 text-center text-[13px] text-rose-600">{error}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button onClick={onClose} disabled={state === 'saving'} className="h-11 rounded-xl border border-brand-900/15 text-charcoal/75 font-semibold text-[15px] hover:bg-cream">Cancel</button>
              <button onClick={save} disabled={state === 'saving'} className="h-11 rounded-xl bg-forest text-ivory font-display font-semibold text-[15px] hover:bg-sage disabled:opacity-70">{state === 'saving' ? 'Saving…' : initial ? 'Save plan' : 'Confirm'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* "My Plan" card with calendar                                        */
/* ------------------------------------------------------------------ */

function GoalRing({ done, goal }) {
  const pct = Math.min(1, done / goal);
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#E3ECE7" strokeWidth="6" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={pct >= 1 ? '#2F7A5C' : '#E8A13A'} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
    </svg>
  );
}

export function MyPlanCard({ set, plan, solvedMap, signedIn, onSetUp, onEdit, compact = false }) {
  const stats = useMemo(() => planStats(plan, solvedMap), [plan, solvedMap]);
  const [month, setMonth] = useState(() => stats.today.slice(0, 7));   // 'YYYY-MM'

  if (!plan) {
    return (
      <div className="edu-card p-5 relative overflow-hidden">
        <span className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-brand-50" />
        <div className="relative flex items-start gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1E5141] to-[#013A2B] text-[#F2D27A] flex items-center justify-center shrink-0"><Target className="w-5 h-5" /></span>
          <div className="min-w-0">
            <p className="font-display text-[17px] font-semibold text-evergreen">Set up a study plan</p>
            <p className="text-[13px] text-charcoal/60 mt-0.5">Pick how many problems a day and on which days. We will track it on your calendar and keep your streak.</p>
            <button onClick={onSetUp} className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-forest text-ivory text-[13.5px] font-semibold hover:bg-sage transition">
              <CalendarDays className="w-4 h-4" /> {signedIn ? 'Create my plan' : 'Sign in to plan'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [y, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = weekday(first);
  const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const moveMonth = (n) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(d.toISOString().slice(0, 7)); };
  const goalDone = stats.todayPlanned && stats.left === 0;

  return (
    <div className="edu-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[18px] font-semibold text-evergreen">My Plan</h3>
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-[12.5px] text-charcoal/55 hover:text-forest"><Pencil className="w-3.5 h-3.5" /> Edit</button>
      </div>

      {/* today */}
      <div className={`mt-3 rounded-2xl p-3.5 flex items-center gap-3.5 ${goalDone ? 'bg-mint-50 border border-mint-200 plan-done-glow' : 'bg-cream border border-brand-900/[.08]'}`}>
        <div className="relative shrink-0">
          {stats.todayPlanned ? <GoalRing done={stats.doneToday} goal={plan.perDay} /> : <span className="w-14 h-14 rounded-full bg-white border border-brand-900/10 flex items-center justify-center text-[11px] text-charcoal/50">Rest</span>}
          {stats.todayPlanned && <span className="absolute inset-0 flex items-center justify-center font-display text-[13px] font-bold text-evergreen">{goalDone ? <Check className="w-5 h-5 text-mint-500" /> : `${stats.doneToday}/${plan.perDay}`}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[14.5px] text-charcoal">
            {!stats.todayPlanned ? 'Rest day' : goalDone ? "Today's goal done!" : `${stats.left} problem${stats.left > 1 ? 's' : ''} left today`}
          </p>
          <p className="text-[12.5px] text-charcoal/55">{plan.perDay} a day · {plan.days.length === 7 ? 'every day' : plan.days.map(d => WEEK[d].slice(0, 2)).join(' ')}</p>
        </div>
        <div className="flex flex-col items-center shrink-0" title="Plan streak: planned days completed in a row">
          <Flame lit={stats.streak > 0} size={26} />
          <span className="font-display text-[14px] font-bold text-evergreen leading-none mt-0.5 tabular-nums">{stats.streak}</span>
        </div>
      </div>

      {!compact && (
        <>
          {/* calendar */}
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => moveMonth(-1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/50 hover:bg-cream" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[13.5px] font-semibold text-evergreen">{label}</span>
            <button onClick={() => moveMonth(1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/50 hover:bg-cream" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1 text-center">
            {WEEK.map(w => <span key={w} className="text-[10px] font-semibold text-charcoal/40 py-1">{w.slice(0, 1)}</span>)}
            {Array.from({ length: lead }).map((_, i) => <span key={`p${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const k = `${month}-${String(i + 1).padStart(2, '0')}`;
              const isToday = k === stats.today;
              const planned = stats.planned(k);
              const met = planned && stats.met(k);
              const missed = planned && !met && k < stats.today;
              const partial = !met && (stats.perDay[k] || 0) > 0;
              return (
                <span key={k} title={`${k}${planned ? ` · plan: ${plan.perDay}` : ''}${stats.perDay[k] ? ` · solved ${stats.perDay[k]}` : ''}`}
                  className={`relative mx-auto w-8 h-8 rounded-full flex items-center justify-center text-[12px] tabular-nums transition
                    ${met ? 'bg-forest text-ivory font-semibold plan-day-pop' : partial ? 'bg-[#FBF0D9] text-[#8A5A12] font-semibold' : planned ? 'bg-brand-50 text-charcoal/80' : 'text-charcoal/35'}
                    ${isToday ? 'ring-2 ring-[#E8A13A] ring-offset-1 plan-today' : ''}`}>
                  {i + 1}
                  {missed && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-rose-400" />}
                </span>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-charcoal/55">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-forest" /> Goal met</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#F6DDAA]" /> Started</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-brand-100" /> Planned</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Missed</span>
          </div>
        </>
      )}
    </div>
  );
}
