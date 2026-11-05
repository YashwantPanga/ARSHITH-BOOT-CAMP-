import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Flag, Minus, Pencil, Plus, X } from 'lucide-react';
import { Flame } from '../StreakCard';

/* ------------------------------------------------------------------ */
/* Plan maths (India time)                                             */
/* ------------------------------------------------------------------ */

const WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const dayKey = (d = new Date()) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const weekday = (key) => new Date(`${key}T00:00:00Z`).getUTCDay();
const shift = (key, n) => { const d = new Date(`${key}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Today's target, the plan streak and per-day solve counts for one set. */
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
/* "Set your study plan" dialog                                        */
/* ------------------------------------------------------------------ */

const LEVELS = [
  { n: 1, name: 'Light', note: 'Build the habit' },
  { n: 2, name: 'Steady', note: 'Recommended pace' },
  { n: 3, name: 'Intensive', note: 'For an interview soon' }
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
    if (!days.length) { setError('Pick at least one study day.'); return; }
    setState('saving'); setError('');
    const ok = await onSave({ perDay, days });
    if (!ok) { setState('edit'); setError('Could not save your plan. Check your connection and try again.'); return; }
    setState('done');
    setTimeout(onClose, 1400);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label="Study plan">
      <div className="absolute inset-0 bg-[#0C2D26]/55 backdrop-blur-[2px] animate-fade-in" onClick={() => state !== 'saving' && onClose()} />
      <div className="plan-sheet relative w-full sm:max-w-md max-h-[94vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="px-5 sm:px-7 pt-5 pb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[19px] font-bold text-evergreen">{initial ? 'Update your study plan' : 'Set your study plan'}</p>
            <p className="mt-0.5 text-[13.5px] text-charcoal/60">{set.title}</p>
          </div>
          <button onClick={onClose} disabled={state === 'saving'} className="w-9 h-9 -mr-2 -mt-1 rounded-full flex items-center justify-center text-charcoal/50 hover:bg-cream shrink-0" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-5 sm:px-7 pb-[calc(20px+env(safe-area-inset-bottom))]">
          {state === 'done' ? (
            <div className="text-center py-6 animate-fade-up">
              <span className="mx-auto w-12 h-12 rounded-full bg-leaf-light text-leaf-dark flex items-center justify-center"><Check className="w-6 h-6" /></span>
              <p className="mt-3 font-display text-[20px] font-bold text-evergreen">Your plan is saved</p>
              <p className="mt-1 text-[14px] text-charcoal/65">{perDay} problem{perDay > 1 ? 's' : ''} on each study day{finish ? `. Target finish: ${finish}` : ''}.</p>
            </div>
          ) : (
            <>
              <p className="text-[13.5px] font-semibold text-charcoal">Problems per day</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {LEVELS.map(l => {
                  const on = perDay === l.n;
                  return (
                    <button key={l.n} onClick={() => setPerDay(l.n)} aria-pressed={on}
                      className={`rounded-xl border px-2 py-2.5 text-center transition active:scale-[.98] ${on ? 'border-forest bg-brand-50 ring-1 ring-forest' : 'border-brand-900/15 bg-white hover:border-sage'}`}>
                      <span className="block font-display text-[14.5px] font-bold text-evergreen">{l.name}</span>
                      <span className="block text-[12px] text-charcoal/60">{l.n} a day</span>
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

              <p className="mt-5 text-[13.5px] font-semibold text-charcoal">Study days</p>
              <div className="mt-2 flex justify-between gap-1.5">
                {WEEK.map((w, d) => {
                  const on = days.includes(d);
                  return (
                    <button key={w} onClick={() => toggle(d)} aria-pressed={on} aria-label={w}
                      className={`flex-1 aspect-square max-w-[46px] rounded-full font-display text-[14px] font-semibold transition active:scale-95 ${on ? 'bg-forest text-ivory' : 'bg-cream text-charcoal/45 border border-brand-900/10'}`}>
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

              <div className="mt-5 rounded-xl bg-cream border border-brand-900/[.08] p-3.5 flex items-center gap-3">
                <Flag className="w-4 h-4 text-sage shrink-0" />
                <p className="text-[13.5px] leading-snug text-charcoal/75">
                  {!days.length ? 'Pick your study days to see your target finish date.'
                    : remaining === 0 ? 'You have solved every problem here. Set a plan to keep revising.'
                    : <>Target finish: <b className="text-evergreen">{finish}</b> · {remaining} problem{remaining > 1 ? 's' : ''} left</>}
                </p>
              </div>
              {error && <p className="mt-2 text-center text-[13px] text-rose-600">{error}</p>}
              <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-2.5">
                <button onClick={onClose} disabled={state === 'saving'} className="h-12 rounded-lg border border-brand-900/15 text-charcoal/75 font-semibold text-[15px] hover:bg-cream">Not now</button>
                <button onClick={save} disabled={state === 'saving'} className="h-12 rounded-lg bg-forest text-ivory font-display font-semibold text-[15.5px] hover:bg-sage active:scale-[.99] transition disabled:opacity-70">
                  {state === 'saving' ? 'Saving…' : initial ? 'Update plan' : 'Save plan'}
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
/* Study plan card with this week's progress                           */
/* ------------------------------------------------------------------ */

function WeekRow({ stats, plan }) {
  // this week, Monday to Sunday
  const monday = shift(stats.today, -((weekday(stats.today) + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => shift(monday, i));
  return (
    <div className="mt-3 grid grid-cols-7 gap-1" role="img" aria-label="This week's progress">
      {week.map(k => {
        const isToday = k === stats.today;
        const planned = k >= stats.start && plan.days.includes(weekday(k));   // days before the plan began are off
        const met = planned && stats.met(k);
        const missed = planned && !met && k < stats.today;
        return (
          <span key={k} className="flex flex-col items-center gap-1">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center ${met ? 'bg-leaf text-white' : missed ? 'bg-[#F1EEE7] text-charcoal/35' : planned ? 'border border-sage/50 bg-white' : 'bg-transparent'} ${isToday ? 'ring-2 ring-forest ring-offset-1' : ''}`}>
              {met ? <Check className="w-3.5 h-3.5" /> : missed ? <X className="w-3 h-3" /> : !planned && <span className="w-1 h-1 rounded-full bg-charcoal/25" />}
            </span>
            <span className={`text-[10.5px] font-semibold ${isToday ? 'text-forest' : 'text-charcoal/45'}`}>{SHORT[weekday(k)]}</span>
          </span>
        );
      })}
    </div>
  );
}

export function MyPlanCard({ set, plan, solvedMap, signedIn, onSetUp, onEdit, compact = false }) {
  const stats = useMemo(() => planStats(plan, solvedMap), [plan, solvedMap]);

  if (!plan) {
    return (
      <div className="rounded-2xl border border-brand-900/10 bg-white p-5 shadow-[0_14px_30px_-24px_rgba(12,45,38,.6)]">
        <div className="flex items-center gap-3.5">
          <span className="w-11 h-11 rounded-xl bg-brand-50 text-forest flex items-center justify-center shrink-0"><CalendarDays className="w-5 h-5" /></span>
          <div className="min-w-0">
            <p className="font-display text-[16.5px] font-bold text-evergreen">Set a study plan</p>
            <p className="text-[13px] text-charcoal/60 mt-0.5">Choose your daily target and study days, and see when you will finish.</p>
          </div>
        </div>
        <button onClick={onSetUp} className="mt-3.5 w-full h-10 rounded-lg bg-forest text-ivory font-display font-semibold text-[14px] hover:bg-sage transition">
          {signedIn ? 'Create my plan' : 'Sign in to start'}
        </button>
      </div>
    );
  }

  const done = stats.todayPlanned && stats.left === 0;
  const remaining = Math.max(0, set.items.length - Object.keys(solvedMap || {}).length);
  const finish = finishDate(remaining, plan.perDay, plan.days);
  const segments = Array.from({ length: plan.perDay }, (_, i) => i < stats.doneToday);

  return (
    <div className="rounded-2xl border border-brand-900/10 bg-white p-4 sm:p-5 shadow-[0_14px_30px_-24px_rgba(12,45,38,.6)]">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[16.5px] font-bold text-evergreen flex items-center gap-2"><CalendarDays className="w-4 h-4 text-sage" /> My study plan</h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-charcoal/70" title="Study days completed in a row"><Flame lit={stats.streak > 0} size={14} /> {stats.streak}</span>
          <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal/45 hover:bg-cream hover:text-forest" aria-label="Edit plan"><Pencil className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="mt-3 rounded-xl p-3 bg-cream border border-brand-900/[.08]">
        <p className="font-display text-[14.5px] font-semibold text-evergreen leading-tight">
          {!stats.todayPlanned ? 'No study planned today' : done ? 'Today’s target is done' : `Today: solve ${plan.perDay} problem${plan.perDay > 1 ? 's' : ''}`}
        </p>
        <p className="text-[12.5px] text-charcoal/60 mt-0.5">
          {!stats.todayPlanned ? 'You can still practise if you like.' : done ? 'Well done. See you on your next study day.' : `${stats.left} to go`}
        </p>
        {stats.todayPlanned && (
          <div className="mt-2 flex gap-1">
            {segments.map((on, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${on ? 'bg-leaf' : 'bg-brand-100'}`} />)}
          </div>
        )}
      </div>

      <WeekRow stats={stats} plan={plan} />

      {!compact && (
        <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-charcoal/60">
          <span className="inline-flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-sage" />{finish ? <>Target finish <b className="text-evergreen">{finish}</b></> : 'All problems solved'}</span>
          <span>{plan.perDay}/day · {plan.days.length === 7 ? 'daily' : `${plan.days.length} days/wk`}</span>
        </div>
      )}
    </div>
  );
}
