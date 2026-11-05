import React, { useEffect, useState } from 'react';
import { ArrowRight, Braces, Code2, Database, Flame, MessagesSquare, Play, Target } from 'lucide-react';
import { api } from '../../services/api';

/* ------------------------------------------------------------------ */
/* Per-plan look: a restrained colour and an icon                      */
/* ------------------------------------------------------------------ */

export const QUEST = {
  'sql-50': { track: 'SQL', bg: 'linear-gradient(135deg,#0F4636,#013A2B)' },
  'dsa-75': { track: 'Data structures & algorithms', bg: 'linear-gradient(135deg,#14465A,#0C2D3A)' },
  'programming-essentials': { track: 'Python', bg: 'linear-gradient(135deg,#1E5141,#0C2D26)' },
  'js-30': { track: 'JavaScript', bg: 'linear-gradient(135deg,#7A5216,#3D2A0A)' },
  'interview-questions': { track: 'Interview questions', bg: 'linear-gradient(135deg,#5E5120,#2E2810)' }
};
const ICONS = { database: Database, target: Target, code: Code2, js: Braces, chat: MessagesSquare };
const DIFF = [['Easy', '#2F9E6E'], ['Medium', '#C98A1B'], ['Hard', '#C8485F']];

function useCodingStreak(signedIn) {
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    if (!signedIn) { setStreak(0); return undefined; }
    let live = true;
    api.getStreak().then(r => { if (live && r?.streak) setStreak(r.streak.current || 0); }).catch(() => {});
    return () => { live = false; };
  }, [signedIn]);
  return streak;
}

/* ------------------------------------------------------------------ */
/* Header of a study plan                                              */
/* ------------------------------------------------------------------ */

export function QuestHero({ set, solvedMap, signedIn, next, onStart, onPlan, hasPlan, topics }) {
  const q = QUEST[set.id] || QUEST['programming-essentials'];
  const Icon = ICONS[set.icon] || Code2;
  const solved = Object.keys(solvedMap).length;
  const streak = useCodingStreak(signedIn);
  const pct = Math.round((solved / set.items.length) * 100);
  const levels = DIFF.map(([d, c]) => ({
    d, c, total: set.items.filter(i => i.difficulty === d).length, done: set.items.filter(i => i.difficulty === d && solvedMap[i.id]).length
  })).filter(g => g.total);
  const shown = topics.slice(0, 5);

  return (
    <section className="rounded-2xl sm:rounded-[22px] bg-gradient-to-br from-forest via-[#0B3E30] to-evergreen text-ivory p-4 sm:p-8 shadow-[0_24px_50px_-30px_rgba(1,58,43,.9)]">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5 lg:gap-10 items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-leaf-light" /></span>
            <p className="font-display text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.16em] text-[#BCD1C6]">{q.track}</p>
          </div>
          <h1 className="mt-3 font-display text-[26px] sm:text-[38px] font-bold leading-[1.1] tracking-tight">{set.title}</h1>
          <p className="mt-2 text-[14px] sm:text-[15.5px] text-ivory/75 max-w-xl">{set.tagline}. {set.items.length} {set.kind === 'concept' ? 'questions' : 'problems'} with worked solutions.</p>
          <div className="mt-4 hidden sm:flex flex-wrap gap-2">
            {shown.map(t => <span key={t} className="px-2.5 py-1 rounded-full bg-white/[.08] border border-white/15 text-[12px] font-medium text-ivory/85">{t}</span>)}
            {topics.length > shown.length && <span className="px-2.5 py-1 rounded-full bg-white/[.08] border border-white/15 text-[12px] font-medium text-ivory/85">+{topics.length - shown.length} more</span>}
          </div>
          <div className={`mt-5 grid ${onPlan ? 'grid-cols-[1.3fr_1fr]' : 'grid-cols-1'} sm:flex sm:flex-wrap gap-2.5 sm:gap-3`}>
            <button onClick={onStart} className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-4 sm:px-6 rounded-lg bg-ivory text-forest font-display font-semibold text-[14.5px] sm:text-[15.5px] hover:bg-white active:scale-[.98] transition">
              <Play className="w-4 h-4 fill-current" /> {solved ? 'Continue' : 'Start'} with #{next.n}
            </button>
            {onPlan && (
              <button onClick={onPlan} className="inline-flex items-center justify-center h-11 sm:h-12 px-4 sm:px-6 rounded-lg border border-white/30 text-ivory font-display font-semibold text-[14.5px] sm:text-[15.5px] hover:bg-white/10 active:scale-[.98] transition">
                {hasPlan ? 'My study plan' : 'Set a study plan'}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white/[.07] border border-white/12 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] text-ivory/70">Your progress</p>
            <p className="font-display text-[22px] font-bold leading-none">{solved}<span className="text-[14px] font-medium text-ivory/55"> / {set.items.length}</span></p>
          </div>
          <div className="mt-2.5 h-1.5 rounded-full bg-white/15 overflow-hidden"><div className="h-full rounded-full bg-leaf transition-all duration-700" style={{ width: `${pct}%` }} /></div>
          <div className="mt-3.5 space-y-2">
            {levels.map(g => (
              <div key={g.d} className="flex items-center gap-2.5 text-[13px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.c }} />
                <span className="flex-1 text-ivory/80">{g.d}</span>
                <span className="font-semibold tabular-nums">{g.done}/{g.total}</span>
              </div>
            ))}
          </div>
          {signedIn
            ? <p className="mt-3 pt-3 border-t border-white/10 flex items-center gap-1.5 text-[12.5px] text-ivory/65"><Flame className="w-3.5 h-3.5 text-[#E8A13A]" /> {streak} day{streak === 1 ? '' : 's'} coding streak</p>
            : <p className="mt-3 pt-3 border-t border-white/10 text-[12.5px] text-ivory/65">Sign in to save your progress.</p>}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Study plan card on the Interview Prep home                          */
/* ------------------------------------------------------------------ */

export function QuestCard({ set, solved, signedIn, onOpen }) {
  const q = QUEST[set.id] || QUEST['programming-essentials'];
  const Icon = ICONS[set.icon] || Code2;
  const counts = DIFF.map(([d, c]) => [d, c, set.items.filter(i => i.difficulty === d).length]).filter(([, , n]) => n);
  return (
    <button onClick={onOpen} className="group edu-card text-left shrink-0 snap-start w-[264px] sm:w-auto h-full p-4 sm:p-5 flex flex-col items-start transition duration-200 hover:-translate-y-0.5 hover:border-sage/50 hover:shadow-[0_20px_36px_-24px_rgba(1,58,43,.5)]">
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-ivory" style={{ background: q.bg }}><Icon className="w-5 h-5" /></span>
        <span className="font-display text-[11.5px] font-semibold uppercase tracking-[0.12em] text-charcoal/55 line-clamp-2">{q.track}</span>
      </span>
      <span className="mt-3 block font-display text-[19px] font-bold leading-tight text-evergreen">{set.title}</span>
      <span className="mt-1 block text-[13.5px] text-charcoal/65 leading-snug line-clamp-2">{set.tagline}</span>
      <span className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {counts.map(([d, c, n]) => (
          <span key={d} className="inline-flex items-center gap-1.5 text-[12.5px] text-charcoal/70">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />{n} {d}
          </span>
        ))}
      </span>
      <span className="mt-auto pt-4 w-full">
        {signedIn && solved > 0 && (
          <span className="block mb-2.5 h-1.5 rounded-full bg-brand-100 overflow-hidden"><span className="block h-full rounded-full bg-leaf" style={{ width: `${(solved / set.items.length) * 100}%` }} /></span>
        )}
        <span className="flex items-center justify-between font-display text-[14px] font-semibold text-forest">
          {solved ? `Continue · ${solved}/${set.items.length}` : `${set.items.length} ${set.kind === 'concept' ? 'questions' : 'problems'}`}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </span>
    </button>
  );
}
