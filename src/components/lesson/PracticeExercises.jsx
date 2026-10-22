import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb, Play, Loader2, RotateCcw, Trophy, AlertTriangle, Target, ListChecks, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import CodeEditor from '../CodeEditor';
import CodeBlock from '../CodeBlock';
import { runPython, runSql, runJavaScript, resetSqlDb } from '../../utils/runners';

const DIFF_TONE = {
  Beginner: 'bg-brand-50 text-brand-900 border-brand-200',
  Intermediate: 'bg-cream text-charcoal border-brand-900/15',
  Advanced: 'bg-brand-900 text-ivory border-brand-900'
};

const Para = ({ text }) => String(text || '').split('\n').map((l, i) => (l.trim() ? <p key={i} className="whitespace-pre-wrap">{l}</p> : <div key={i} className="h-2" />));

/** One graded practice exercise. All grading happens on the server via /api/practice/check. */
export function ExerciseCard({ ex, index, courseId, moduleId, completed, onCompleted }) {
  const isCode = ex.checkType === 'output' || ex.checkType === 'rows';
  const lang = ex.checkType === 'rows' ? 'sql' : (ex.checkLanguage || ex.language || 'python');
  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState(ex.starterCode || '');
  const [hintsShown, setHintsShown] = useState(0);
  const [run, setRun] = useState({ status: 'idle', output: '', rows: null, error: '' });
  const [check, setCheck] = useState({ status: 'idle' });
  const stopRef = useRef(null);

  const runCode = async () => {
    if (run.status === 'running') return;
    setRun({ status: 'running', output: '', rows: null, error: '' });
    try {
      if (lang === 'python') {
        let out = '';
        let err = '';
        await new Promise((resolve) => {
          stopRef.current = runPython(code, '', (m) => {
            if (m.type === 'out') out += m.text + '\n';
            else if (m.type === 'err') err += m.text + '\n';
            else if (m.type === 'status') setRun(r => ({ ...r, statusText: m.text }));
            else if (m.type === 'done') resolve();
          });
        });
        setRun({ status: err ? 'error' : 'done', output: out.trimEnd(), rows: null, error: err.trim() });
      } else if (lang === 'sql') {
        await resetSqlDb();
        const { results } = await runSql(code);
        const last = results[results.length - 1];
        setRun({ status: 'done', output: '', rows: last ? { columns: last.columns, values: last.values } : { columns: [], values: [] }, error: '' });
      } else {
        const { output, errors } = await runJavaScript(code);
        setRun({ status: errors.length ? 'error' : 'done', output, rows: null, error: errors.join('\n') });
      }
    } catch (e) {
      setRun({ status: 'error', output: '', rows: null, error: String(e.message || e) });
    } finally {
      stopRef.current = null;
    }
  };

  const submit = async () => {
    if (check.status === 'checking') return; // no duplicate submissions
    const payload = { courseId, moduleId, itemId: ex.id, kind: 'exercise' };
    if (isCode) {
      if (run.status !== 'done') { setCheck({ status: 'error', message: 'Run your code successfully first — the checker compares what it produces.' }); return; }
      if (lang === 'sql') payload.rows = run.rows?.values || [];
      else payload.output = run.output;
    } else {
      if (String(answer).trim() === '') { setCheck({ status: 'error', message: ex.checkType === 'mcq' ? 'Choose an option first.' : 'Type an answer first.' }); return; }
      payload.answer = answer;
    }
    setCheck({ status: 'checking' });
    try {
      const res = await api.checkPractice(payload);
      setCheck({ status: 'checked', ...res });
      if (res.correct) onCompleted?.(ex.id, res.recorded);
    } catch (e) {
      // Keep the learner's answer; just report the failure and allow a retry.
      setCheck({ status: 'error', message: e.status ? e.message : 'Could not reach the server to check your answer. Your work is kept — try again.' });
    }
  };

  const result = check.status === 'checked' ? check : null;

  return (
    <article className="rounded-2xl border border-brand-900/10 bg-white overflow-hidden" aria-labelledby={`ex-${ex.id}`}>
      <header className="px-4 sm:px-6 pt-5 pb-4 border-b border-brand-900/10 bg-cream/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-[11px] font-bold tracking-[0.16em] text-sage">EXERCISE {index + 1}</span>
          <span className={`chip border text-[11px] ${DIFF_TONE[ex.difficulty] || DIFF_TONE.Intermediate}`}>{ex.difficulty}</span>
          {ex.type && <span className="chip border border-brand-900/10 bg-white text-charcoal/70 text-[11px]">{ex.type}</span>}
          {(completed || result?.correct) && <span className="chip bg-brand-900 text-ivory text-[11px] ml-auto"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>}
        </div>
        <h4 id={`ex-${ex.id}`} className="mt-2 font-display text-xl text-brand-900">{ex.title}</h4>
        <p className="mt-1 text-sm text-charcoal/65 flex gap-2"><Target className="w-4 h-4 mt-0.5 text-sage shrink-0" />{ex.objective}</p>
      </header>

      <div className="px-4 sm:px-6 py-5 space-y-4 text-[15px] leading-7 text-charcoal/85">
        <div className="space-y-1"><Para text={ex.problem} /></div>
        {ex.data && <div className="rounded-xl bg-cream p-3 text-sm"><Para text={ex.data} /></div>}
        {ex.instructions?.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {ex.instructions.map((t, i) => <li key={i} className="flex gap-2"><ListChecks className="w-4 h-4 mt-1 text-sage shrink-0" />{t}</li>)}
          </ul>
        )}

        {/* Answer input */}
        {ex.checkType === 'mcq' && (
          <fieldset className="space-y-2" disabled={check.status === 'checking'}>
            <legend className="sr-only">Choose one answer</legend>
            {(ex.options || []).map((o, i) => {
              const picked = String(answer) === String(i);
              const isRight = result && result.expected === i;
              const isWrongPick = result && picked && !result.correct;
              return (
                <label key={i} className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${isRight ? 'border-brand-900 bg-brand-50' : isWrongPick ? 'border-rose-300 bg-rose-50' : picked ? 'border-sage bg-cream' : 'border-brand-900/10 hover:border-brand-300'}`}>
                  <input type="radio" name={`ans-${ex.id}`} value={i} checked={picked} onChange={() => setAnswer(String(i))} className="mt-1.5 accent-[#013A2B]" />
                  <span className="text-sm whitespace-pre-wrap break-words min-w-0">{o}</span>
                </label>
              );
            })}
          </fieldset>
        )}
        {(ex.checkType === 'numeric' || ex.checkType === 'text') && (
          <label className="block">
            <span className="block text-xs font-semibold text-charcoal/60 mb-1.5">{ex.checkType === 'numeric' ? 'Your answer (number)' : 'Your answer'}</span>
            <input
              className="input font-mono max-w-xl"
              inputMode={ex.checkType === 'numeric' ? 'decimal' : 'text'}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={ex.checkType === 'numeric' ? 'e.g. 42' : 'Type your answer'}
            />
          </label>
        )}
        {isCode && (
          <div className="rounded-xl overflow-hidden border border-black/20">
            <div className="flex items-center gap-2 px-3 h-10 bg-[#0a2620] border-b border-white/5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-300">{lang === 'sql' ? 'SQL · sample database' : lang === 'javascript' ? 'JavaScript' : 'Python'}</span>
              <span className="ml-auto flex items-center gap-1">
                <button onClick={() => { setCode(ex.starterCode || ''); setRun({ status: 'idle', output: '', rows: null, error: '' }); }} className="h-7 px-2 rounded-md text-[11px] text-brand-200 hover:bg-white/10 flex items-center gap-1" title="Reset to starter code"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
                {run.status === 'running' && lang === 'python'
                  ? <button onClick={() => stopRef.current?.()} className="h-7 px-3 rounded-md bg-rose-500 text-white text-xs font-bold">Stop</button>
                  : <button onClick={runCode} disabled={run.status === 'running'} className="h-7 px-3 rounded-md bg-ivory text-brand-900 text-xs font-bold flex items-center gap-1.5 disabled:opacity-60">{run.status === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />} Run</button>}
              </span>
            </div>
            <CodeEditor value={code} onChange={setCode} lang={lang} onRun={runCode} minHeight={Math.min(420, Math.max(180, (code.split('\n').length + 2) * 22))} label={`Code for ${ex.title}`} />
            <div className="bg-white border-t border-brand-900/10 px-4 py-3 text-[13px] font-mono" aria-live="polite">
              {run.status === 'idle' && <p className="text-charcoal/45 font-sans text-sm">Run your code to see its output here (Ctrl + Enter).</p>}
              {run.status === 'running' && <p className="text-sage font-sans text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{run.statusText || 'Running…'}</p>}
              {run.output && <pre className="whitespace-pre-wrap text-charcoal m-0">{run.output}</pre>}
              {run.error && <pre className="whitespace-pre-wrap text-rose-700 bg-rose-50 rounded-md px-2 py-1 m-0 mt-1">{run.error}</pre>}
              {run.rows && (
                run.rows.columns.length ? (
                  <div className="overflow-x-auto thin-scroll max-h-64 rounded-lg border border-brand-900/10">
                    <table className="w-full text-[12.5px]">
                      <thead className="bg-brand-900 text-ivory sticky top-0"><tr>{run.rows.columns.map((c, i) => <th key={i} className="px-3 py-1.5 text-left font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
                      <tbody>{run.rows.values.map((r, i) => <tr key={i} className="odd:bg-white even:bg-cream">{r.map((c, j) => <td key={j} className="px-3 py-1 whitespace-nowrap">{c === null ? 'NULL' : String(c)}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                ) : <p className="text-charcoal/55 font-sans text-sm">The last statement returned no rows.</p>
              )}
            </div>
          </div>
        )}

        {/* Hints, revealed one at a time */}
        {ex.hints?.length > 0 && (
          <div className="space-y-2">
            {ex.hints.slice(0, hintsShown).map((h, i) => (
              <p key={i} className="flex gap-2 text-sm rounded-xl bg-cream border border-brand-900/10 px-3 py-2 animate-fade-in"><Lightbulb className="w-4 h-4 mt-0.5 text-sage shrink-0" /><span><strong className="text-charcoal">Hint {i + 1}:</strong> {h}</span></p>
            ))}
            {hintsShown < ex.hints.length && (
              <button onClick={() => setHintsShown(n => n + 1)} className="text-sm font-semibold text-sage hover:text-brand-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> {hintsShown === 0 ? 'Show a hint' : 'Show next hint'} ({hintsShown}/{ex.hints.length})
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button onClick={submit} disabled={check.status === 'checking'} className="btn-primary">
            {check.status === 'checking' ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</> : <><CheckCircle2 className="w-4 h-4" /> Check answer</>}
          </button>
          {result && !result.correct && <span className="text-xs text-charcoal/55">You can change your answer and check again.</span>}
        </div>

        <div aria-live="polite">
          {check.status === 'error' && (
            <p role="alert" className="flex gap-2 text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{check.message}</p>
          )}
          {result && (
            <div className={`rounded-2xl border p-4 sm:p-5 space-y-3 animate-fade-in ${result.correct ? 'border-brand-900/30 bg-brand-50/60' : 'border-rose-200 bg-rose-50/50'}`}>
              <p className={`flex items-center gap-2 font-semibold ${result.correct ? 'text-brand-900' : 'text-rose-800'}`}>
                {result.correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {result.feedback}
              </p>
              {result.explanation && <p className="text-sm text-charcoal/80">{result.explanation}</p>}
              {result.solution?.length > 0 && (
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-sage mb-1.5">STEP-BY-STEP SOLUTION</p>
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-charcoal/85 marker:text-sage">{result.solution.map((s, i) => <li key={i}>{s}</li>)}</ol>
                </div>
              )}
              {result.solutionCode && <CodeBlock code={result.solutionCode} language={lang} label="solution" courseId={courseId} compact />}
              {result.mistakes?.length > 0 && (
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-sage mb-1.5">COMMON MISTAKES</p>
                  <ul className="space-y-1 text-sm">{result.mistakes.map((m, i) => <li key={i} className="flex gap-2"><XCircle className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />{m}</li>)}</ul>
                </div>
              )}
              {ex.challenge && <p className="flex gap-2 text-sm rounded-xl bg-white border border-brand-900/10 px-3 py-2"><Trophy className="w-4 h-4 mt-0.5 text-sage shrink-0" /><span><strong>Extra challenge:</strong> {ex.challenge}</span></p>}
              {result.correct && !result.recorded && <p className="text-xs text-charcoal/55">Sign in to save practice completions to your profile. Practice never affects quiz or certificate results.</p>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/** List of exercises with a completion counter. */
export default function PracticeExercises({ exercises, courseId, moduleId, completedIds = [] }) {
  const [done, setDone] = useState(() => new Set(completedIds));
  const completedKey = completedIds.join('|');
  // Merge saved progress when it arrives after the first render.
  useEffect(() => { if (completedKey) setDone(s => new Set([...s, ...completedKey.split('|')])); }, [completedKey]);
  if (!exercises?.length) {
    return <p className="text-sm text-charcoal/60">No practice exercises are available for this module yet.</p>;
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-sm text-charcoal/70">
        <Sparkles className="w-4 h-4 text-sage" />
        <span><strong className="text-brand-900">{[...done].filter(id => exercises.some(e => e.id === id)).length}</strong> of {exercises.length} exercises completed · answers are checked on the server; solutions appear after your first attempt.</span>
      </div>
      {exercises.map((ex, i) => (
        <ExerciseCard key={ex.id} ex={ex} index={i} courseId={courseId} moduleId={moduleId} completed={done.has(ex.id)} onCompleted={(id) => setDone(s => new Set([...s, id]))} />
      ))}
    </div>
  );
}
