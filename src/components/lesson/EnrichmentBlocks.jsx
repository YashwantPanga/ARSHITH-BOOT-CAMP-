import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, ExternalLink, ArrowRight, Briefcase, Database, Flag, AlertTriangle, RefreshCw, Lightbulb, GraduationCap } from 'lucide-react';
import { api } from '../../services/api';
import CodeBlock from '../CodeBlock';

/* ------------------------------------------------------------------ */
/* Data loading: enrichment is fetched per module, with retry          */
/* ------------------------------------------------------------------ */
export function useModuleEnrichment(courseId, moduleId) {
  const [state, setState] = useState({ status: 'loading', data: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!courseId || !moduleId) return undefined;
    const ctrl = new AbortController();
    let retryTimer;
    setState({ status: 'loading', data: null });
    const load = (triesLeft) => {
      api.getModuleEnrichment(courseId, moduleId, ctrl.signal)
        .then(res => setState({ status: res.enrichment ? 'ok' : 'empty', data: res.enrichment || null }))
        .catch(err => {
          if (err.name === 'AbortError') return;
          // Retry transient failures (network errors / 5xx) once before showing an error.
          if (triesLeft > 0 && (!err.status || err.status >= 500)) { retryTimer = setTimeout(() => load(triesLeft - 1), 800); return; }
          setState({ status: 'error', data: null, message: err.message });
        });
    };
    load(1);
    return () => { ctrl.abort(); clearTimeout(retryTimer); };
  }, [courseId, moduleId, attempt]);
  return { ...state, retry: () => setAttempt(a => a + 1) };
}

export function SectionSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading content">
      {Array.from({ length: lines }, (_, i) => <div key={i} className="h-4 rounded skeleton" style={{ width: `${90 - i * 12}%` }} />)}
      <div className="h-40 rounded-xl skeleton" />
    </div>
  );
}

export function LoadError({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex flex-wrap items-center gap-3">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="flex-1 min-w-[12rem]">This part of the lesson could not be loaded{message ? `: ${message}` : '.'} The rest of the module is still available.</span>
      <button onClick={onRetry} className="btn-outline py-1.5 px-3 text-xs"><RefreshCw className="w-3.5 h-3.5" /> Try again</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Learning objectives extras & intuition                              */
/* ------------------------------------------------------------------ */
export function SkillsAndPrereqs({ skills = [], prerequisites = [] }) {
  if (!skills.length && !prerequisites.length) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {skills.length > 0 && (
        <div className="rounded-xl border border-brand-900/10 p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-sage mb-2">PRACTICAL SKILLS</p>
          <ul className="space-y-1.5 text-sm text-charcoal/80">{skills.map((s, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-brand-900 shrink-0" />{s}</li>)}</ul>
        </div>
      )}
      {prerequisites.length > 0 && (
        <div className="rounded-xl border border-brand-900/10 p-4 bg-cream/60">
          <p className="text-xs font-bold tracking-[0.14em] text-sage mb-2">BEFORE YOU START</p>
          <ul className="space-y-1.5 text-sm text-charcoal/80">{prerequisites.map((s, i) => <li key={i} className="flex gap-2"><GraduationCap className="w-4 h-4 mt-0.5 text-sage shrink-0" />{s}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export function Intuition({ intuition }) {
  if (!intuition) return null;
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {intuition.analogy && (
        <div className="rounded-xl bg-brand-900 text-ivory p-5">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-200 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> AN ANALOGY</p>
          <p className="text-[15px] leading-7 text-ivory/90">{intuition.analogy}</p>
        </div>
      )}
      {intuition.whyItMatters && (
        <div className="rounded-xl border border-brand-900/10 p-5">
          <p className="text-xs font-bold tracking-[0.14em] text-sage mb-2">WHY IT MATTERS</p>
          <p className="text-[15px] leading-7 text-charcoal/80">{intuition.whyItMatters}</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Worked example with line-by-line explanation                       */
/* ------------------------------------------------------------------ */
export function WorkedExample({ example, courseId }) {
  if (!example?.code) return null;
  return (
    <div className="space-y-3">
      <p className="font-semibold text-brand-900">{example.title}</p>
      <CodeBlock code={example.code} language={example.language} courseId={courseId} runnable={example.language !== 'text' && example.language !== 'jsx'} />
      {example.lineByLine?.length > 0 && (
        <div className="rounded-xl border border-brand-900/10 divide-y divide-brand-900/5">
          {example.lineByLine.map((l, i) => (
            <div key={i} className="grid grid-cols-[auto,1fr] gap-3 px-4 py-2.5 text-sm">
              <span className="font-mono text-xs text-sage pt-0.5 w-8">L{l.line}</span>
              <p className="text-charcoal/80">{l.explanation}</p>
            </div>
          ))}
        </div>
      )}
      {example.expectedOutput && (
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-sage mb-1.5">EXPECTED OUTPUT</p>
          <pre className="rounded-xl bg-cream border border-brand-900/10 px-4 py-3 text-[13px] font-mono text-charcoal whitespace-pre-wrap overflow-x-auto">{example.expectedOutput}</pre>
        </div>
      )}
      {example.expectedResult && (
        <p className="text-sm rounded-xl bg-cream border border-brand-900/10 px-4 py-3"><strong className="text-brand-900">Expected result: </strong>{example.expectedResult}</p>
      )}
      {example.edgeCases?.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-sage mb-1.5">EDGE CASES & COMMON ERRORS</p>
          <ul className="space-y-1.5 text-sm text-charcoal/80">{example.edgeCases.map((e, i) => <li key={i} className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />{e}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Case study                                                           */
/* ------------------------------------------------------------------ */
export function CaseStudy({ study }) {
  if (!study) return null;
  return (
    <div className="space-y-4">
      <p className="font-display text-xl text-brand-900">{study.title}</p>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-brand-900/10 p-4"><p className="text-xs font-bold tracking-[0.14em] text-sage mb-1.5 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> THE PROBLEM</p><p className="text-charcoal/80 leading-6">{study.problem}</p></div>
        <div className="rounded-xl border border-brand-900/10 p-4"><p className="text-xs font-bold tracking-[0.14em] text-sage mb-1.5 flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> DATA & ASSUMPTIONS</p><p className="text-charcoal/80 leading-6">{study.data}</p></div>
      </div>
      {study.steps?.length > 0 && (
        <ol className="space-y-3 border-l-2 border-brand-200 pl-5 ml-2">
          {study.steps.map((s, i) => (
            <li key={i} className="relative text-sm text-charcoal/85 leading-6">
              <span className="absolute -left-[1.95rem] top-0 w-6 h-6 rounded-full bg-brand-900 text-ivory text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      )}
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        {study.result && <div className="rounded-xl bg-brand-50 border border-brand-200 p-4"><p className="text-xs font-bold tracking-[0.14em] text-brand-900 mb-1.5 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> RESULT</p><p className="text-charcoal/85 leading-6">{study.result}</p></div>}
        {study.limitations && <div className="rounded-xl bg-cream border border-brand-900/10 p-4"><p className="text-xs font-bold tracking-[0.14em] text-sage mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> LIMITATIONS</p><p className="text-charcoal/80 leading-6">{study.limitations}</p></div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Knowledge check (new questions, graded on the server)               */
/* ------------------------------------------------------------------ */
function KnowledgeQuestion({ q, index, courseId, moduleId }) {
  const [picked, setPicked] = useState(null);
  const [state, setState] = useState({ status: 'idle' });
  const busy = useRef(false);
  const submit = async () => {
    if (picked === null || busy.current) return;
    busy.current = true;
    setState({ status: 'checking' });
    try {
      const res = await api.checkPractice({ courseId, moduleId, itemId: q.id, kind: 'knowledge', answer: picked });
      setState({ status: 'done', ...res });
    } catch (e) {
      setState({ status: 'error', message: e.status ? e.message : 'Could not check your answer. Please try again.' });
    } finally {
      busy.current = false;
    }
  };
  const done = state.status === 'done';
  return (
    <fieldset className="rounded-xl border border-brand-900/10 p-4 space-y-3">
      <legend className="sr-only">Question {index + 1}</legend>
      <p className="flex gap-3 text-[15px] font-medium text-charcoal"><span className="w-6 h-6 rounded-full bg-brand-50 text-brand-900 text-xs font-bold flex items-center justify-center shrink-0">{index + 1}</span>{q.question}</p>
      <div className="grid sm:grid-cols-2 gap-2 pl-0 sm:pl-9">
        {q.options.map((o, i) => {
          const isAnswer = done && state.answer === i;
          const wrong = done && picked === i && !state.correct;
          return (
            <button key={i} type="button" onClick={() => { if (!done) setPicked(i); }} aria-pressed={picked === i}
              className={`text-left text-sm rounded-lg border px-3 py-2 transition ${isAnswer ? 'border-brand-900 bg-brand-50 text-brand-900 font-semibold' : wrong ? 'border-rose-300 bg-rose-50 text-rose-800' : picked === i ? 'border-sage bg-cream' : 'border-brand-900/10 hover:border-brand-300'}`}>
              {o}
            </button>
          );
        })}
      </div>
      <div className="pl-0 sm:pl-9 flex flex-wrap items-center gap-3" aria-live="polite">
        {!done && <button onClick={submit} disabled={picked === null || state.status === 'checking'} className="btn-outline py-1.5 px-4 text-xs">{state.status === 'checking' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Check'}</button>}
        {done && <p className={`flex items-center gap-1.5 text-sm font-semibold ${state.correct ? 'text-brand-900' : 'text-rose-700'}`}>{state.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}{state.correct ? 'Correct' : 'Not quite'}</p>}
        {done && state.explanation && <p className="text-sm text-charcoal/75 basis-full">{state.explanation}</p>}
        {state.status === 'error' && <p role="alert" className="text-sm text-rose-700">{state.message}</p>}
      </div>
    </fieldset>
  );
}

export function KnowledgeCheck({ questions, courseId, moduleId }) {
  if (!questions?.length) return null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-charcoal/65">New self-check questions for this lesson. They are separate from the graded module quiz and do not affect your results.</p>
      {questions.map((q, i) => <KnowledgeQuestion key={q.id} q={q} index={i} courseId={courseId} moduleId={moduleId} />)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Further learning                                                     */
/* ------------------------------------------------------------------ */
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

export function FurtherLearning({ references = [], originalReferences = [], next }) {
  const seen = new Set();
  const all = [...references, ...originalReferences].filter(r => r?.url && !seen.has(r.url) && seen.add(r.url));
  return (
    <div className="space-y-4">
      {all.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-2.5">
          {all.map((r, i) => (
            <li key={i}>
              <a href={r.url} target="_blank" rel="noreferrer" className="group flex items-start gap-3 rounded-xl border border-brand-900/10 p-3.5 hover:border-brand-300 hover:bg-cream/60 transition h-full">
                <ExternalLink className="w-4 h-4 mt-0.5 text-sage shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-charcoal group-hover:text-brand-900 break-words">{r.title}</span>
                  <span className="block text-xs text-charcoal/55 mt-0.5 break-all">{r.publisher ? `${r.publisher} · ` : ''}{hostOf(r.url)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-charcoal/50">Explanations in this lesson are original teaching material; the links above are free official documentation and open course resources for further reading.</p>
      {next && <p className="flex gap-2 text-sm rounded-xl bg-brand-50 border border-brand-200 px-4 py-3 text-brand-900"><ArrowRight className="w-4 h-4 mt-0.5 shrink-0" /><span><strong>Next:</strong> {next}</span></p>}
    </div>
  );
}
