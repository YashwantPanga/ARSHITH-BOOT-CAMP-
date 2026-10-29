import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Award, CheckCircle2, ChevronLeft, ChevronRight, Circle, Eye, FileText, Flame, Lightbulb,
  Loader2, Lock, Play, RotateCcw, Search, Send, Sparkles, Table2, Trophy, XCircle
} from 'lucide-react';
import { INTERVIEW_SETS, findInterviewSet } from '../../shared/interview/index.js';
import { INTERVIEW_SQL_SCHEMA } from '../../shared/interview/sqlSchema.js';
import { RESULT_MARK, buildPythonCheck, parsePythonCheck, pyRepr, pythonStarter } from '../../shared/interview/pyHarness.js';
import { TICK_MARK, buildJsCheck, jsRepr, jsStarter } from '../../shared/interview/jsHarness.js';
import CodeEditor from '../components/CodeEditor';
import { Inline } from '../components/lesson/Markdown';
import { runJavaScript, runPython, runSqlFresh } from '../utils/runners';
import { noteCoding } from '../utils/activity';
import { api } from '../services/api';
import { paths } from '../router';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const THEMES = {
  forest: { card: 'from-[#0F4636] via-[#013A2B] to-[#0C2D26]', tile: 'from-[#1E5141] to-[#0C2D26]', glow: '#7DB59A' },
  teal: { card: 'from-[#1C5E66] via-[#0F4A52] to-[#0C2D26]', tile: 'from-[#2A7079] to-[#0C2D26]', glow: '#8FD3D0' },
  gold: { card: 'from-[#9A7222] via-[#6E4F17] to-[#3A2A0E]', tile: 'from-[#B8862B] to-[#4A3510]', glow: '#F2D27A' },
  ember: { card: 'from-[#C47A1E] via-[#8E4E12] to-[#3D2108]', tile: 'from-[#D98A26] to-[#4A2A0A]', glow: '#FFD580' }
};
const LANG_LABEL = { sql: 'SQL', python: 'Python 3', javascript: 'JavaScript' };
const DIFF_STYLE = {
  Easy: 'bg-mint-50 text-mint-500 border-mint-200',
  Medium: 'bg-[#FBF3DF] text-[#8A6414] border-[#EBD7A4]',
  Hard: 'bg-rose-50 text-rose-600 border-rose-200'
};

/** Line-art badge for a set: a database, a target, a JS 30 mark or speech bubbles. */
function SetIcon({ icon, className = 'w-24 h-24', glow = '#7DB59A' }) {
  const stroke = { stroke: glow, strokeWidth: 5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (icon === 'js') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <rect x="8" y="14" width="66" height="66" rx="16" {...stroke} />
        <text x="41" y="64" textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="34" fill={glow}>JS</text>
        <circle cx="76" cy="74" r="17" fill={glow} />
        <text x="76" y="80" textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="16" fill="#3D2108">30</text>
      </svg>
    );
  }
  if (icon === 'database') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <ellipse cx="50" cy="24" rx="30" ry="11" {...stroke} />
        <path d="M20 24v18c0 6 13 11 30 11s30-5 30-11V24" {...stroke} />
        <path d="M20 42v18c0 6 13 11 30 11s30-5 30-11V42" {...stroke} />
        <path d="M20 60v16c0 6 13 11 30 11s30-5 30-11V60" {...stroke} />
        <text x="50" y="68" textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="17" fill={glow}>SQL</text>
      </svg>
    );
  }
  if (icon === 'target') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <circle cx="46" cy="50" r="34" {...stroke} opacity=".55" />
        <circle cx="46" cy="50" r="22" {...stroke} opacity=".8" />
        <circle cx="46" cy="50" r="9" fill={glow} />
        <path d="M58 60l26 10-11 4-4 11z" fill={glow} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect x="10" y="14" width="58" height="40" rx="10" {...stroke} />
      <path d="M24 54l-6 14 18-14" {...stroke} />
      <rect x="40" y="46" width="50" height="34" rx="10" fill={glow} opacity=".9" />
      <text x="39" y="41" textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="20" fill={glow}>Q</text>
      <text x="65" y="70" textAnchor="middle" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="18" fill="#2A1F0A">A</text>
    </svg>
  );
}

function DifficultyPill({ level }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11.5px] font-semibold ${DIFF_STYLE[level]}`}>{level}</span>;
}

function ProgressBar({ value, total, light = false }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`h-1.5 rounded-full overflow-hidden ${light ? 'bg-white/20' : 'bg-brand-100'}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${light ? 'bg-[#F2D27A]' : 'bg-forest'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const countBy = (items, key) => items.reduce((m, it) => ({ ...m, [it[key]]: (m[it[key]] || 0) + 1 }), {});
const draftKey = (id) => `arb_iv_draft_${id}`;
const readDraft = (id) => { try { return localStorage.getItem(draftKey(id)); } catch { return null; } };
const writeDraft = (id, code) => { try { localStorage.setItem(draftKey(id), code); } catch { /* storage unavailable */ } };
const clearDraft = (id) => { try { localStorage.removeItem(draftKey(id)); } catch { /* storage unavailable */ } };

/* ------------------------------------------------------------------ */
/* Progress (server for signed-in learners)                            */
/* ------------------------------------------------------------------ */

let progressCache = { user: null, data: null };

function useInterviewProgress(studentUser) {
  const email = studentUser?.email || null;
  const [progress, setProgress] = useState(progressCache.user === email ? progressCache.data || {} : {});
  useEffect(() => {
    if (!email) { setProgress({}); return; }
    let live = true;
    api.getInterviewProgress().then(r => {
      if (!live) return;
      progressCache = { user: email, data: r.progress || {} };
      setProgress(r.progress || {});
    }).catch(() => {});
    return () => { live = false; };
  }, [email]);
  const mark = useCallback(async (setId, itemId, solved = true) => {
    if (!email) return false;
    setProgress(p => ({ ...p, [setId]: { ...(p[setId] || {}), ...(solved ? { [itemId]: new Date().toISOString() } : {}) } }));
    try {
      const r = await api.markInterview(setId, itemId, solved);
      progressCache = { user: email, data: r.progress };
      setProgress(r.progress);
      return true;
    } catch {
      return false;
    }
  }, [email]);
  return { progress, mark, signedIn: !!email };
}

/* ------------------------------------------------------------------ */
/* Page router                                                         */
/* ------------------------------------------------------------------ */

export default function InterviewPrepPage({ setId, itemId, tab, studentUser, navigate, toast }) {
  const state = useInterviewProgress(studentUser);
  const set = setId ? findInterviewSet(setId) : null;
  const item = set && itemId ? set.items.find(i => i.id === itemId) : null;
  const props = { ...state, navigate, toast, studentUser, startTab: tab };

  if (setId && !set) return <NotFound navigate={navigate} what="This study plan" />;
  if (itemId && !item) return <NotFound navigate={navigate} what="This question" back={paths.interview(set.id)} />;
  if (item) return set.kind === 'concept' ? <ConceptCard key={item.id} set={set} item={item} {...props} /> : <Workspace key={item.id} set={set} item={item} {...props} />;
  if (set) return <SetPage set={set} {...props} />;
  return <PrepHome {...props} />;
}

function NotFound({ navigate, what, back = paths.interview() }) {
  return (
    <div className="bg-ivory min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-2xl font-bold text-evergreen">{what} was not found.</p>
        <button onClick={() => navigate(back)} className="btn-primary mt-5"><ArrowLeft className="w-4 h-4" /> Back to Interview Prep</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home: ongoing + featured plans                                      */
/* ------------------------------------------------------------------ */

function PrepHome({ progress, signedIn, navigate }) {
  const ongoing = INTERVIEW_SETS.filter(s => Object.keys(progress[s.id] || {}).length > 0);
  const total = INTERVIEW_SETS.reduce((n, s) => n + s.items.length, 0);
  const done = INTERVIEW_SETS.reduce((n, s) => n + Object.keys(progress[s.id] || {}).length, 0);
  return (
    <div className="bg-ivory min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 justify-between">
          <div>
            <p className="eyebrow">Interview Prep</p>
            <h1 className="font-display text-[34px] sm:text-[44px] font-bold text-evergreen leading-tight mt-2">Study plans for your interviews</h1>
            <p className="mt-3 text-[15.5px] text-charcoal/70 max-w-2xl">Practise the questions placement and job interviews really ask. Write real SQL, Python and JavaScript in your browser, check your answer instantly, and learn from a worked solution for every problem.</p>
          </div>
          {signedIn
            ? <div className="edu-card px-5 py-3.5 shrink-0"><p className="text-[12px] text-charcoal/55">Solved so far</p><p className="font-display text-[26px] font-bold text-forest leading-none mt-1">{done}<span className="text-charcoal/40 text-[16px]"> / {total}</span></p></div>
            : <button onClick={() => navigate(paths.login(paths.interview()))} className="btn-outline shrink-0">Sign in to save progress <ArrowRight className="w-4 h-4" /></button>}
        </div>

        {ongoing.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-[22px] font-bold text-evergreen">Ongoing</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {ongoing.map(s => {
                const solved = Object.keys(progress[s.id] || {}).length;
                const theme = THEMES[s.theme];
                return (
                  <button key={s.id} onClick={() => navigate(paths.interview(s.id))} className="edu-card p-3 flex items-center gap-4 text-left hover:border-sage/50 hover:-translate-y-0.5 transition">
                    <span className={`w-[72px] h-[72px] rounded-xl bg-gradient-to-br ${theme.tile} flex items-center justify-center shrink-0`}><SetIcon icon={s.icon} glow={theme.glow} className="w-12 h-12" /></span>
                    <span className="flex-1 min-w-0 pr-2">
                      <span className="block font-display text-[16px] font-semibold text-evergreen truncate">{s.title}</span>
                      <span className="block mt-2.5"><ProgressBar value={solved} total={s.items.length} /></span>
                      <span className="mt-2 flex justify-between text-[12.5px] text-charcoal/55"><span>Total progress</span><span><b className="text-charcoal">{solved}</b> / {s.items.length}</span></span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-12">
          <h2 className="font-display text-[22px] font-bold text-evergreen">Featured</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {INTERVIEW_SETS.map(s => {
              const theme = THEMES[s.theme];
              const diff = countBy(s.items, 'difficulty');
              const solved = Object.keys(progress[s.id] || {}).length;
              return (
                <button key={s.id} onClick={() => navigate(paths.interview(s.id))}
                  className={`group relative overflow-hidden rounded-[22px] bg-gradient-to-br ${theme.card} p-5 sm:p-6 h-[220px] sm:h-[300px] flex flex-col items-start justify-start text-left text-ivory shadow-[0_22px_40px_-24px_rgba(12,45,38,.9)] hover:-translate-y-1 transition duration-300`}>
                  <span className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-20 blur-2xl" style={{ background: theme.glow }} />
                  <span className="relative block font-display text-[21px] font-bold leading-tight">{s.title}</span>
                  <span className="relative block mt-1.5 text-[14px] text-ivory/75">{s.tagline}</span>
                  <span className="relative mt-4 flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
                    {['Easy', 'Medium', 'Hard'].filter(d => diff[d]).map(d => <span key={d} className="px-2 py-0.5 rounded-full bg-white/[.12] border border-white/15">{diff[d]} {d}</span>)}
                  </span>
                  <SetIcon icon={s.icon} glow={theme.glow} className="absolute right-4 bottom-4 w-20 h-20 sm:w-24 sm:h-24 group-hover:scale-105 group-hover:-rotate-3 transition duration-300" />
                  <span className="absolute left-6 bottom-6 right-28">
                    {signedIn && solved > 0 && <span className="block mb-2"><ProgressBar value={solved} total={s.items.length} light /></span>}
                    <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold whitespace-nowrap">{solved ? `Continue · ${solved}/${s.items.length}` : `Start · ${s.items.length}`} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[22px] font-bold text-evergreen flex items-center gap-2"><Flame className="w-5 h-5 text-[#C47A1E]" /> 30-Day Challenge</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTERVIEW_SETS.filter(s => s.challenge).map(s => {
              const theme = THEMES[s.theme];
              const solved = Object.keys(progress[s.id] || {}).length;
              return (
                <button key={s.id} onClick={() => navigate(paths.interview(s.id))} className="edu-card p-3 flex items-center gap-4 text-left hover:border-sage/50 hover:-translate-y-0.5 transition">
                  <span className={`w-[76px] h-[76px] rounded-xl bg-gradient-to-br ${theme.tile} flex items-center justify-center shrink-0`}><SetIcon icon={s.icon} glow={theme.glow} className="w-14 h-14" /></span>
                  <span className="flex-1 min-w-0 pr-2">
                    <span className="block font-display text-[17px] font-semibold text-evergreen">{s.title}</span>
                    <span className="block text-[13px] text-charcoal/60 mt-0.5">{s.tagline}</span>
                    <span className="block text-[12.5px] text-[#9C5A12] font-semibold mt-1.5">{solved ? `Day ${Math.min(solved + 1, s.items.length)} of ${s.items.length}` : `${s.items.length} days · start today`}</span>
                  </span>
                  <ArrowRight className="w-5 h-5 text-charcoal/35 shrink-0" />
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            [Play, 'Write and run', 'A real editor with SQL, Python and JavaScript running right in your browser. Nothing to install.'],
            [CheckCircle2, 'Check instantly', 'Run the examples, then submit against hidden tests or the expected result table.'],
            [Lightbulb, 'Learn the pattern', 'Every problem has a worked solution, a plain-English explanation and its complexity.']
          ].map(([Icon, t, d]) => (
            <div key={t} className="edu-card p-5">
              <span className="w-10 h-10 rounded-xl bg-brand-50 text-forest flex items-center justify-center"><Icon className="w-5 h-5" /></span>
              <p className="mt-3 font-display text-[17px] font-semibold text-evergreen">{t}</p>
              <p className="mt-1 text-[14px] text-charcoal/65">{d}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One plan: progress + filterable list                                */
/* ------------------------------------------------------------------ */

function SetPage({ set, progress, signedIn, navigate }) {
  const solvedMap = progress[set.id] || {};
  const solved = Object.keys(solvedMap).length;
  const theme = THEMES[set.theme];
  const topics = useMemo(() => [...new Set(set.items.map(i => i.topic))], [set]);
  const [topic, setTopic] = useState('All');
  const [diff, setDiff] = useState('All');
  const [status, setStatus] = useState('All');
  const [q, setQ] = useState('');
  const [showTags, setShowTags] = useState(false);
  const list = set.items.filter(i =>
    (topic === 'All' || i.topic === topic) && (diff === 'All' || i.difficulty === diff)
    && (status === 'All' || (status === 'Solved') === !!solvedMap[i.id])
    && (!q.trim() || i.title.toLowerCase().includes(q.trim().toLowerCase())));
  const next = set.items.find(i => !solvedMap[i.id]) || set.items[0];
  const byDiff = ['Easy', 'Medium', 'Hard'].map(d => [d, set.items.filter(i => i.difficulty === d).length, set.items.filter(i => i.difficulty === d && solvedMap[i.id]).length]);
  const noun = set.kind === 'concept' ? 'questions' : 'problems';

  return (
    <div className="bg-ivory min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <nav className="text-[13.5px] text-charcoal/55 flex items-center gap-1.5">
          <button onClick={() => navigate(paths.interview())} className="hover:text-forest">Interview Prep</button><ChevronRight className="w-3.5 h-3.5" /><span className="text-charcoal">{set.title}</span>
        </nav>

        <div className={`mt-4 relative overflow-hidden rounded-[24px] bg-gradient-to-br ${theme.card} text-ivory p-6 sm:p-8`}>
          <span className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full opacity-15 blur-3xl" style={{ background: theme.glow }} />
          <div className="relative flex flex-col md:flex-row gap-5 lg:gap-6 md:items-center">
            <SetIcon icon={set.icon} glow={theme.glow} className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-ivory/70">{set.tagline}</p>
              <h1 className="font-display text-[28px] sm:text-[32px] lg:text-[38px] font-bold leading-tight mt-1">{set.title}</h1>
              <p className="mt-2 text-[15px] text-ivory/80 max-w-2xl">{set.description}</p>
              <button onClick={() => navigate(paths.interview(set.id, next.id))} className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-md bg-ivory text-forest font-display font-semibold text-[15px] hover:bg-white transition">
                <Play className="w-4 h-4" /> {solved ? 'Continue' : 'Start'} with #{next.n}
              </button>
            </div>
            <div className="md:w-56 lg:w-64 shrink-0 rounded-2xl bg-white/10 border border-white/15 p-4">
              <div className="flex items-baseline justify-between"><span className="text-[13px] text-ivory/70">Progress</span><span className="font-display text-[22px] font-bold">{solved}<span className="text-ivory/60 text-[14px]"> / {set.items.length}</span></span></div>
              <div className="mt-2"><ProgressBar value={solved} total={set.items.length} light /></div>
              <div className="mt-3 space-y-1 text-[12.5px]">
                {byDiff.filter(([, n]) => n).map(([d, n, s]) => <div key={d} className="flex justify-between text-ivory/80"><span>{d}</span><span>{s} / {n}</span></div>)}
              </div>
              {!signedIn && <button onClick={() => navigate(paths.login(paths.interview(set.id)))} className="mt-3 text-[12.5px] underline underline-offset-2 text-ivory/85 hover:text-white">Sign in to save your progress</button>}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-7 items-start">
          <div className="min-w-0">
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain snap-x scroll-px-4 sm:scroll-px-0 thin-scroll pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
                {['All', ...topics].map(t => (
                  <button key={t} onClick={() => setTopic(t)} className={`shrink-0 snap-start px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition ${topic === t ? 'bg-forest text-ivory border-forest' : 'bg-white text-charcoal/75 border-brand-900/15 hover:border-sage'}`}>{t}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${noun}`} className="w-full h-10 pl-9 pr-3 rounded-lg border border-brand-900/15 bg-white text-[14px] outline-none focus:border-sage" />
                </div>
                <select value={diff} onChange={e => setDiff(e.target.value)} className="h-10 px-2.5 rounded-lg border border-brand-900/15 bg-white text-[14px]" aria-label="Difficulty">
                  {['All', 'Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d === 'All' ? 'Any level' : d}</option>)}
                </select>
                <select value={status} onChange={e => setStatus(e.target.value)} className="h-10 px-2.5 rounded-lg border border-brand-900/15 bg-white text-[14px]" aria-label="Status">
                  {['All', 'Solved', 'Unsolved'].map(d => <option key={d} value={d}>{d === 'All' ? 'Any status' : d}</option>)}
                </select>
                <label className="ml-auto inline-flex items-center gap-2 text-[13px] text-charcoal/65 cursor-pointer select-none">
                  <input type="checkbox" checked={showTags} onChange={e => setShowTags(e.target.checked)} className="accent-[#013A2B] w-4 h-4" /> Show tags
                </label>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {list.length === 0 && <p className="edu-card p-8 text-center text-charcoal/55">No {noun} match these filters.</p>}
              {[...new Set(list.map(i => i.topic))].map(tp => (
                <div key={tp} className="edu-card overflow-hidden">
                  <div className="px-5 py-2.5 bg-cream border-b border-brand-900/[.08] flex items-center justify-between">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-sage">{tp}</span>
                    <span className="text-[12px] text-charcoal/45">{list.filter(i => i.topic === tp && solvedMap[i.id]).length} / {list.filter(i => i.topic === tp).length}</span>
                  </div>
                  {list.filter(i => i.topic === tp).map(i => {
                    const isDone = !!solvedMap[i.id];
                    return (
                      <div key={i.id} className="flex items-center gap-3 px-5 py-3 border-b border-brand-900/[.08] last:border-b-0 hover:bg-brand-50/50 transition">
                        {isDone ? <CheckCircle2 className="w-5 h-5 text-mint-400 shrink-0" /> : <Circle className="w-5 h-5 text-charcoal/20 shrink-0" />}
                        <button onClick={() => navigate(paths.interview(set.id, i.id))} className="flex-1 min-w-0 text-left">
                          <span className="block text-[15px] text-charcoal truncate hover:text-forest">{i.n}. {i.title}</span>
                          {showTags && <span className="block text-[12px] text-charcoal/45 mt-0.5">{i.topic}{i.fn ? ` · ${i.fn}` : ''}</span>}
                        </button>
                        <button onClick={() => navigate(`${paths.interview(set.id, i.id)}?tab=solution`)} className="hidden sm:inline-flex items-center gap-1 text-[12.5px] text-charcoal/55 hover:text-forest shrink-0">
                          <FileText className="w-3.5 h-3.5" /> {set.kind === 'concept' ? 'Answer' : 'Solution'}
                        </button>
                        <span className="w-[68px] flex justify-end shrink-0"><DifficultyPill level={i.difficulty} /></span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <PlanSidebar set={set} solved={solved} navigate={navigate} progress={progress} />
        </div>
      </div>
    </div>
  );
}

/** Right column of a plan: summary, completion award and related plans. */
function PlanSidebar({ set, solved, navigate, progress }) {
  const theme = THEMES[set.theme];
  const earned = solved >= set.items.length;
  return (
    <aside className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 lg:sticky lg:top-24">
      <div className="edu-card p-5">
        <h3 className="font-display text-[18px] font-semibold text-evergreen">Summary</h3>
        <ul className="mt-3 space-y-2">
          {(set.summary || []).map(s => <li key={s} className="flex gap-2 text-[14px] text-charcoal/75"><CheckCircle2 className="w-4 h-4 text-sage shrink-0 mt-0.5" />{s}</li>)}
        </ul>
        <p className="mt-3 text-[12.5px] text-charcoal/50">{set.items.length} {set.kind === 'concept' ? 'questions' : 'problems'} · {[...new Set(set.items.map(i => i.topic))].length} topics</p>
      </div>

      <div className="edu-card p-5">
        <h3 className="font-display text-[18px] font-semibold text-evergreen flex items-center gap-2"><Award className="w-5 h-5 text-sage" /> Award</h3>
        <div className="mt-3 flex items-center gap-3.5">
          <span className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${theme.tile} flex items-center justify-center shrink-0 ${earned ? 'ring-4 ring-[#F2D27A]/60' : 'opacity-75'}`}>
            <SetIcon icon={set.icon} glow={theme.glow} className="w-10 h-10" />
            {earned && <CheckCircle2 className="absolute -right-1 -bottom-1 w-6 h-6 text-mint-400 bg-white rounded-full" />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[14.5px] text-charcoal">{set.title} badge</p>
            <p className="text-[12.5px] text-charcoal/60">{earned ? 'Earned. Well done!' : `Complete all ${set.items.length} to earn it · ${set.items.length - solved} to go`}</p>
          </div>
        </div>
      </div>

      <div className="edu-card p-5">
        <h3 className="font-display text-[18px] font-semibold text-evergreen">Related</h3>
        <div className="mt-3 space-y-2.5">
          {INTERVIEW_SETS.filter(s => s.id !== set.id).map(s => {
            const th = THEMES[s.theme];
            const done = Object.keys(progress[s.id] || {}).length;
            return (
              <button key={s.id} onClick={() => navigate(paths.interview(s.id))} className="w-full flex items-center gap-3 text-left group">
                <span className={`w-11 h-11 rounded-lg bg-gradient-to-br ${th.tile} flex items-center justify-center shrink-0`}><SetIcon icon={s.icon} glow={th.glow} className="w-7 h-7" /></span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-charcoal group-hover:text-forest truncate">{s.title}</span>
                  <span className="block text-[12px] text-charcoal/50 truncate">{done ? `${done} / ${s.items.length} solved` : s.tagline}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Problem workspace (SQL, Python and JavaScript)                                  */
/* ------------------------------------------------------------------ */

function TopBar({ set, item, navigate, solved }) {
  const idx = set.items.indexOf(item);
  const prev = set.items[idx - 1];
  const next = set.items[idx + 1];
  return (
    <div className="bg-white border-b border-brand-900/10">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <button onClick={() => navigate(paths.interview(set.id))} className="flex items-center gap-1.5 text-[14px] text-charcoal/70 hover:text-forest min-w-0">
          <ArrowLeft className="w-4 h-4 shrink-0" /><span className="truncate">{set.title}</span>
        </button>
        <span className="ml-auto text-[13px] text-charcoal/50 tabular-nums">{idx + 1} / {set.items.length}</span>
        {solved && <span className="hidden sm:inline-flex items-center gap-1 text-[12.5px] font-semibold text-mint-400"><CheckCircle2 className="w-4 h-4" /> Solved</span>}
        <button disabled={!prev} onClick={() => navigate(paths.interview(set.id, prev.id))} className="w-9 h-9 rounded-lg border border-brand-900/15 flex items-center justify-center disabled:opacity-30 hover:border-sage" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
        <button disabled={!next} onClick={() => navigate(paths.interview(set.id, next.id))} className="w-9 h-9 rounded-lg border border-brand-900/15 flex items-center justify-center disabled:opacity-30 hover:border-sage" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

/** Blank-line separated paragraphs; a paragraph whose lines all start with "- " becomes a bullet list. */
function Paragraphs({ text, className = '' }) {
  return String(text).split('\n\n').map((p, i) => {
    const lines = p.split('\n');
    if (lines.every(l => l.startsWith('- '))) {
      return (
        <ul key={i} className="space-y-1.5">
          {lines.map((l, j) => <li key={j} className={`flex gap-2.5 text-[15px] leading-relaxed text-charcoal/85 ${className}`}><span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-sage shrink-0" /><span><Inline text={l.slice(2)} /></span></li>)}
        </ul>
      );
    }
    return <p key={i} className={`text-[15px] leading-relaxed text-charcoal/85 ${className}`}><Inline text={p} /></p>;
  });
}

function CodeView({ code }) {
  return <pre className="mt-3 p-4 rounded-xl bg-[#0C2D26] text-[#E8F1EC] text-[13px] leading-6 overflow-x-auto thin-scroll font-mono">{code}</pre>;
}

/** Last result set of a sql.js run as rows of plain values. */
const lastRows = (res) => {
  const r = res.results?.[res.results.length - 1];
  return r ? { columns: r.columns, values: r.values } : { columns: [], values: [] };
};
const normCell = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const rowKey = (row) => JSON.stringify(row.map(normCell));
function sameRows(a, b, ordered) {
  if (a.length !== b.length || (a[0] && b[0] && a[0].length !== b[0].length)) return false;
  const ka = a.map(rowKey);
  const kb = b.map(rowKey);
  if (!ordered) { ka.sort(); kb.sort(); }
  return ka.every((k, i) => k === kb[i]);
}

function ResultTable({ columns, values, max = 50 }) {
  if (!columns.length) return <p className="text-[13.5px] text-charcoal/55">The query ran but returned no table.</p>;
  return (
    <div className="overflow-auto thin-scroll max-h-72 rounded-lg border border-brand-900/10">
      <table className="w-full text-[13px]">
        <thead className="bg-cream sticky top-0"><tr>{columns.map((c, i) => <th key={i} className="text-left font-semibold text-evergreen px-3 py-2 border-b border-brand-900/10 whitespace-nowrap">{c}</th>)}</tr></thead>
        <tbody>
          {values.slice(0, max).map((r, i) => <tr key={i} className="odd:bg-white even:bg-ivory/60">{r.map((v, j) => <td key={j} className="px-3 py-1.5 border-b border-brand-900/5 whitespace-nowrap font-mono text-[12.5px]">{v === null ? <span className="text-charcoal/35">NULL</span> : String(v)}</td>)}</tr>)}
        </tbody>
      </table>
      {values.length > max && <p className="px-3 py-1.5 text-[12px] text-charcoal/50">Showing {max} of {values.length} rows.</p>}
    </div>
  );
}

function TablePreview({ tables }) {
  const [open, setOpen] = useState(null);
  const [data, setData] = useState({});
  const show = async (t) => {
    setOpen(open === t ? null : t);
    if (!data[t]) {
      try { const r = await runSqlFresh(INTERVIEW_SQL_SCHEMA, `SELECT * FROM ${t};`); setData(d => ({ ...d, [t]: lastRows(r) })); }
      catch { setData(d => ({ ...d, [t]: { columns: [], values: [] } })); }
    }
  };
  return (
    <div className="mt-6">
      <p className="eyebrow mb-2">Tables used</p>
      <div className="flex flex-wrap gap-2">
        {tables.map(t => <button key={t} onClick={() => show(t)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-mono transition ${open === t ? 'bg-forest text-ivory border-forest' : 'bg-white border-brand-900/15 hover:border-sage'}`}><Table2 className="w-3.5 h-3.5" />{t}</button>)}
      </div>
      {open && data[open] && <div className="mt-3"><ResultTable {...data[open]} /></div>}
    </div>
  );
}

function Workspace({ set, item, progress, mark, signedIn, navigate, toast, startTab }) {
  const isSql = set.kind === 'sql';
  const isJs = set.kind === 'javascript';
  const starter = isSql ? `-- Write your SQL query here\nSELECT ` : isJs ? jsStarter(item) : pythonStarter(item);
  const [code, setCode] = useState(() => readDraft(item.id) ?? starter);
  const [tab, setTab] = useState(startTab === 'solution' ? 'solution' : 'problem');
  const [busy, setBusy] = useState(null);       // 'run' | 'submit'
  const [out, setOut] = useState(null);         // what the output panel shows
  const [reveal, setReveal] = useState(startTab === 'solution');
  const stopRef = useRef(null);
  const solved = !!progress[set.id]?.[item.id];

  useEffect(() => () => stopRef.current?.(), []);
  const edit = (v) => { setCode(v); writeDraft(item.id, v); };
  const reset = () => { setCode(starter); clearDraft(item.id); setOut(null); };

  const accept = async () => {
    if (!signedIn) return;
    if (!solved) {
      const ok = await mark(set.id, item.id, true);
      if (ok) toast?.('Accepted! Saved to your progress.', 'success', 3200);
    }
  };

  const runSql = async (submit) => {
    setBusy(submit ? 'submit' : 'run');
    try {
      const mine = lastRows(await runSqlFresh(INTERVIEW_SQL_SCHEMA, code));
      if (!submit) { setOut({ kind: 'sql', mine }); return; }
      const expected = lastRows(await runSqlFresh(INTERVIEW_SQL_SCHEMA, item.solution));
      const ok = sameRows(mine.values, expected.values, !!item.ordered);
      setOut({ kind: 'sql', mine, expected, verdict: ok ? 'accepted' : 'wrong' });
      if (ok) accept();
    } catch (e) {
      setOut({ kind: 'error', text: String(e.message || e) });
    } finally {
      setBusy(null);
    }
  };

  const runPy = (submit) => {
    setBusy(submit ? 'submit' : 'run');
    setOut({ kind: 'status', text: 'Starting Python…' });
    let text = '';
    const limit = submit ? Infinity : 2;
    const timer = setTimeout(() => stopRef.current?.(), 15000);
    stopRef.current = runPython(buildPythonCheck(item, code, limit), '', (e) => {
      if (e.type === 'status') setOut(o => (o?.kind === 'status' ? { kind: 'status', text: e.text } : o));
      if (e.type === 'out' || e.type === 'err') text += `${e.text}\n`;
      if (e.type === 'done') {
        clearTimeout(timer);
        stopRef.current = null;
        setBusy(null);
        const { printed, result } = parsePythonCheck(text);
        if (!result) { setOut({ kind: 'error', text: printed.trim() || 'Your code stopped before it could be tested (it took too long or crashed).' }); return; }
        if (result.error) { setOut({ kind: 'error', text: result.error, printed }); return; }
        const all = result.results.every(r => r.ok);
        setOut({ kind: 'py', results: result.results, printed, submit, verdict: submit ? (all ? 'accepted' : 'wrong') : null });
        if (submit && all) accept();
      }
    });
  };

  const runJs = async (submit) => {
    setBusy(submit ? 'submit' : 'run');
    setOut({ kind: 'status', text: 'Running your code…' });
    const { output, errors: raw } = await runJavaScript(buildJsCheck(item, code, submit ? Infinity : 2), { quietMs: 3500, maxMs: 20000, doneMark: RESULT_MARK });
    setBusy(null);
    const errors = raw.map(e => e.replace(/ \(line \d+\)$/, ''));   // line numbers point into the test wrapper
    const { printed, result } = parsePythonCheck(output.split('\n').filter(l => l !== TICK_MARK).join('\n'));
    if (!result) { setOut({ kind: 'error', text: errors.join('\n') || 'Your code stopped before it could be tested (it took too long or has a syntax error).', printed }); return; }
    const all = result.results.every(r => r.ok);
    setOut({ kind: 'py', results: result.results, printed: [printed, ...errors].filter(Boolean).join('\n'), submit, verdict: submit ? (all ? 'accepted' : 'wrong') : null });
    if (submit && all) accept();
  };

  const run = (submit) => {
    if (busy) return;
    noteCoding('interview');
    if (isSql) runSql(submit);
    else if (isJs) runJs(submit);
    else runPy(submit);
  };

  return (
    <div className="bg-ivory min-h-screen">
      <TopBar set={set} item={item} navigate={navigate} solved={solved} />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* left: statement / solution */}
        <div className="edu-card overflow-hidden flex flex-col min-w-0 lg:max-h-[calc(100vh-120px)] lg:sticky lg:top-[76px]">
          <div className="flex border-b border-brand-900/10 px-2">
            {[['problem', 'Problem'], ['solution', 'Solution']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`px-4 py-3 text-[14px] font-semibold border-b-2 -mb-px transition ${tab === id ? 'border-forest text-forest' : 'border-transparent text-charcoal/55 hover:text-charcoal'}`}>{label}</button>
            ))}
          </div>
          <div className="p-5 sm:p-6 overflow-y-auto thin-scroll">
            {tab === 'problem' ? (
              <>
                <h1 className="font-display text-[24px] font-bold text-evergreen leading-tight">{item.n}. {item.title}</h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2"><DifficultyPill level={item.difficulty} /><span className="text-[12.5px] text-charcoal/55">{item.topic}</span></div>
                <div className="mt-5 space-y-3"><Paragraphs text={item.prompt} /></div>
                {isSql && item.ordered && <p className="mt-3 text-[13px] text-charcoal/60">Row order matters for this one.</p>}
                {isSql && <p className="mt-3 text-[13px] text-charcoal/60">Column names do not matter; the values in each row do.</p>}
                {isJs && item.tests.slice(0, 2).map((tc, i) => (
                  <div key={i} className="mt-5">
                    <p className="text-[13.5px] font-semibold text-evergreen">Example {i + 1}</p>
                    <pre className="mt-1.5 p-3.5 rounded-xl bg-cream border border-brand-900/[.08] text-[13px] leading-6 overflow-x-auto thin-scroll font-mono text-charcoal">{`${tc.code}\n// returns ${jsRepr(tc.expected)}`}</pre>
                  </div>
                ))}
                {set.kind === 'python' && item.tests.slice(0, 2).map(([args, exp], i) => (
                  <div key={i} className="mt-5">
                    <p className="text-[13.5px] font-semibold text-evergreen">Example {i + 1}</p>
                    <pre className="mt-1.5 p-3.5 rounded-xl bg-cream border border-brand-900/[.08] text-[13px] leading-6 overflow-x-auto thin-scroll font-mono text-charcoal">{`Input:  ${item.fn}(${args.map(pyRepr).join(', ')})\nOutput: ${pyRepr(exp)}`}</pre>
                  </div>
                ))}
                {!isSql && <p className="mt-4 text-[13px] text-charcoal/60">Submit also runs {item.tests.length - 2} hidden test{item.tests.length - 2 === 1 ? '' : 's'}.{item.compare ? ' Any order of the answer is accepted.' : ''}</p>}
                {isSql && <TablePreview tables={item.tables} />}
              </>
            ) : !reveal && !solved ? (
              <div className="py-10 text-center">
                <span className="mx-auto w-14 h-14 rounded-full bg-brand-50 text-forest flex items-center justify-center"><Lock className="w-6 h-6" /></span>
                <p className="mt-4 font-display text-[19px] font-semibold text-evergreen">Give it a real try first</p>
                <p className="mt-1.5 text-[14px] text-charcoal/65 max-w-sm mx-auto">You learn most from struggling a little. Stuck after a few attempts? Open the solution and study how it works.</p>
                <button onClick={() => setReveal(true)} className="btn-outline mt-5"><Eye className="w-4 h-4" /> Show the solution</button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-[20px] font-bold text-evergreen">Solution</h2>
                <CodeView code={item.solution} />
                <div className="mt-5 rounded-xl bg-brand-50/70 border border-brand-900/10 p-4">
                  <p className="flex items-center gap-2 font-semibold text-evergreen text-[14px]"><Lightbulb className="w-4 h-4 text-sage" /> How it works</p>
                  <div className="mt-2 space-y-2"><Paragraphs text={item.explanation} className="text-[14.5px]" /></div>
                  {item.complexity && <p className="mt-3 text-[13px] text-charcoal/65"><b className="text-charcoal">Complexity:</b> {item.complexity}</p>}
                </div>
                <button onClick={() => { edit(item.solution); setTab('problem'); }} className="mt-4 text-[13.5px] font-semibold text-forest hover:underline">Copy into the editor to experiment</button>
              </>
            )}
          </div>
        </div>

        {/* right: editor + output */}
        <div className="min-w-0 flex flex-col gap-4">
          <div className="edu-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-brand-900/10 bg-cream/60">
              <span className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-sage">{LANG_LABEL[set.kind]}</span>
              <button onClick={reset} className="ml-auto inline-flex items-center gap-1 text-[12.5px] text-charcoal/55 hover:text-forest"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
            <CodeEditor value={code} onChange={edit} lang={set.kind} onRun={() => run(false)} minHeight={isSql ? 220 : 300} label={`${item.title} answer`} />
            <div className="flex items-center gap-2 px-4 py-3 border-t border-brand-900/10">
              <span className="hidden sm:inline text-[12px] text-charcoal/45">Ctrl + Enter runs</span>
              <button onClick={() => run(false)} disabled={!!busy} className="ml-auto inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-forest/40 text-forest font-semibold text-[14px] hover:bg-brand-50 disabled:opacity-60">
                {busy === 'run' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
              </button>
              <button onClick={() => run(true)} disabled={!!busy} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-forest text-ivory font-semibold text-[14px] hover:bg-sage disabled:opacity-60">
                {busy === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
              </button>
            </div>
          </div>

          <OutputPanel out={out} item={item} isSql={isSql} isJs={isJs} signedIn={signedIn} navigate={navigate} set={set} />
        </div>
      </div>
    </div>
  );
}

function Verdict({ ok, signedIn, navigate, set, item }) {
  const idx = set.items.indexOf(item);
  const next = set.items[idx + 1];
  return ok ? (
    <div className="rounded-xl bg-mint-50 border border-mint-200 p-4 flex flex-wrap items-center gap-3">
      <Trophy className="w-6 h-6 text-mint-400" />
      <div className="flex-1 min-w-[180px]">
        <p className="font-display text-[18px] font-bold text-mint-500">Accepted</p>
        <p className="text-[13px] text-charcoal/65">{signedIn ? 'Nice work. It is saved to your progress.' : 'Nice work. Sign in to keep track of what you have solved.'}</p>
      </div>
      {!signedIn && <button onClick={() => navigate(paths.login(paths.interview(set.id, item.id)))} className="btn-outline !py-2">Sign in</button>}
      {next && <button onClick={() => navigate(paths.interview(set.id, next.id))} className="btn-primary !py-2">Next problem <ArrowRight className="w-4 h-4" /></button>}
    </div>
  ) : (
    <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-center gap-3">
      <XCircle className="w-6 h-6 text-rose-500 shrink-0" />
      <div><p className="font-display text-[18px] font-bold text-rose-600">Not quite</p><p className="text-[13px] text-charcoal/65">Compare your result with the expected one below, fix your code and submit again.</p></div>
    </div>
  );
}

function OutputPanel({ out, item, isSql, isJs, signedIn, navigate, set }) {
  return (
    <div className="edu-card p-4 sm:p-5 min-h-[160px]">
      <p className="eyebrow mb-3">Output</p>
      {!out && <p className="text-[14px] text-charcoal/50">{isSql ? 'Run your query to see its result table. Submit compares it with the expected result.' : 'Run checks your code against the two examples. Submit runs every test, including hidden ones.'}</p>}
      {out?.kind === 'status' && <p className="flex items-center gap-2 text-[14px] text-charcoal/65"><Loader2 className="w-4 h-4 animate-spin" /> {out.text}</p>}
      {out?.kind === 'error' && (
        <>
          {out.printed && <pre className="mb-3 p-3 rounded-lg bg-cream text-[12.5px] font-mono whitespace-pre-wrap">{out.printed}</pre>}
          <pre className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px] font-mono whitespace-pre-wrap overflow-x-auto">{out.text}</pre>
        </>
      )}
      {out?.kind === 'sql' && (
        <div className="space-y-4">
          {out.verdict && <Verdict ok={out.verdict === 'accepted'} signedIn={signedIn} navigate={navigate} set={set} item={item} />}
          <div><p className="text-[13px] font-semibold text-evergreen mb-1.5">Your result <span className="font-normal text-charcoal/50">({out.mine.values.length} rows)</span></p><ResultTable {...out.mine} /></div>
          {out.verdict === 'wrong' && <div><p className="text-[13px] font-semibold text-evergreen mb-1.5">Expected result <span className="font-normal text-charcoal/50">({out.expected.values.length} rows)</span></p><ResultTable {...out.expected} /></div>}
        </div>
      )}
      {out?.kind === 'py' && (
        <div className="space-y-3">
          {out.verdict && <Verdict ok={out.verdict === 'accepted'} signedIn={signedIn} navigate={navigate} set={set} item={item} />}
          {!out.verdict && <p className={`text-[14px] font-semibold ${out.results.every(r => r.ok) ? 'text-mint-500' : 'text-rose-600'}`}>{out.results.filter(r => r.ok).length} of {out.results.length} examples passed{out.results.every(r => r.ok) ? ' - now Submit to run the hidden tests.' : ''}</p>}
          {out.verdict && <p className="text-[13.5px] text-charcoal/65">{out.results.filter(r => r.ok).length} of {out.results.length} tests passed.</p>}
          <div className="space-y-2">
            {out.results.map((r, i) => {
              const hidden = i >= 2;
              if (r.ok && hidden) return null;
              const [args, exp] = isJs ? [null, item.tests[i].expected] : item.tests[i];
              const show = isJs ? jsRepr : pyRepr;
              return (
                <div key={i} className={`rounded-lg border p-3 text-[12.5px] font-mono ${r.ok ? 'border-mint-200 bg-mint-50/50' : 'border-rose-200 bg-rose-50/60'}`}>
                  <p className={`font-sans font-semibold text-[13px] ${r.ok ? 'text-mint-500' : 'text-rose-600'}`}>{r.ok ? '✓' : '✗'} {hidden ? `Hidden test ${i - 1}` : `Example ${i + 1}`}</p>
                  {isJs
                    ? <pre className="mt-1 text-charcoal/75 whitespace-pre-wrap">{item.tests[i].code}</pre>
                    : <p className="mt-1 text-charcoal/75 break-all">Input: {item.fn}({args.map(pyRepr).join(', ')})</p>}
                  <p className="text-charcoal/75 break-all">Expected: {show(exp)}</p>
                  {!r.ok && <p className="text-rose-700 break-all">{r.error ? r.error : `Got: ${show(r.got)}`}</p>}
                </div>
              );
            })}
          </div>
          {out.printed && <div><p className="text-[13px] font-semibold text-evergreen mb-1">Printed output</p><pre className="p-3 rounded-lg bg-cream text-[12.5px] font-mono whitespace-pre-wrap max-h-48 overflow-auto thin-scroll">{out.printed}</pre></div>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Concept question card                                               */
/* ------------------------------------------------------------------ */

function ConceptCard({ set, item, progress, mark, signedIn, navigate, toast, startTab }) {
  const [open, setOpen] = useState(startTab === 'solution');
  const known = !!progress[set.id]?.[item.id];
  const idx = set.items.indexOf(item);
  const next = set.items[idx + 1];
  const toggleKnown = async () => {
    if (!signedIn) { navigate(paths.login(paths.interview(set.id, item.id))); return; }
    await mark(set.id, item.id, !known);
    if (!known) {
      toast?.('Marked as known.', 'success', 2200);
      if (next) navigate(paths.interview(set.id, next.id));
    }
  };
  return (
    <div className="bg-ivory min-h-screen">
      <TopBar set={set} item={item} navigate={navigate} solved={known} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="edu-card p-6 sm:p-9">
          <div className="flex flex-wrap items-center gap-2"><DifficultyPill level={item.difficulty} /><span className="text-[12.5px] text-charcoal/55">{item.topic}</span></div>
          <h1 className="mt-4 font-display text-[26px] sm:text-[30px] font-bold text-evergreen leading-tight">{item.title}</h1>
          {!open ? (
            <div className="mt-8 rounded-2xl border border-dashed border-brand-900/20 bg-cream/60 p-6 text-center">
              <Sparkles className="w-6 h-6 text-sage mx-auto" />
              <p className="mt-2 text-[14.5px] text-charcoal/70">Say your answer out loud as if you were in the interview, then compare it with ours.</p>
              <button onClick={() => setOpen(true)} className="btn-primary mt-4"><Eye className="w-4 h-4" /> Show the answer</button>
            </div>
          ) : (
            <div className="mt-6 animate-fade-up">
              <p className="eyebrow mb-2">Model answer</p>
              <div className="space-y-3"><Paragraphs text={item.answer} /></div>
              {item.code && <CodeView code={item.code} />}
              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={toggleKnown} className={known ? 'btn-outline' : 'btn-primary'}>
                  <CheckCircle2 className="w-4 h-4" /> {known ? 'Known (undo)' : signedIn ? 'I knew this' : 'Sign in to track'}
                </button>
                {next && <button onClick={() => navigate(paths.interview(set.id, next.id))} className="btn-outline">Next question <ArrowRight className="w-4 h-4" /></button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
