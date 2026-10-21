import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, Circle, Award, Download, ChevronRight, ChevronLeft, BookOpen, ExternalLink,
  Code, Sparkles, AlertTriangle, ListChecks, HelpCircle, Briefcase, Terminal, Layers, Lock, Menu, X,
  ShieldCheck, Lightbulb, Target, ClipboardList, MessageSquare, Clock, Network, PlayCircle, FlaskConical, Timer
} from 'lucide-react';
import { generateCoursePDF } from '../utils/pdfGenerator';
import { cleanText, moduleTitle } from '../utils/textUtils';
import ModuleQuizModal from '../components/ModuleQuizModal';
import FinalTestModal from '../components/FinalTestModal';
import CourseProjectsModal from '../components/CourseProjectsModal';
import { ProgressRing, ProgressBar, useToast, SafeImg } from '../components/ui';
import PremiumCodeBlock from '../components/CodeBlock';
import { PlaygroundProvider, usePlayground } from '../components/CodePlayground';
import { ConceptMap, LearningFlow, BlueprintDiagram } from '../components/Diagrams';
import { detectLanguage } from '../utils/highlight';
import { displayNameOf } from '../utils/session';

/* ---------- small render helpers ---------- */
// cleanText() collapses newlines, so clean line-by-line to keep the author's paragraph breaks.
const cleanLines = (t) => String(t).split('\n').map(l => cleanText(l)).join('\n');

const Paragraphs = ({ text, className = 'text-[15px] leading-7 text-slate-600' }) => {
  if (!text) return null;
  return String(text).split(/\n{2,}/).filter(p => p.trim()).map((p, i) => (
    <p key={i} className={`${className} whitespace-pre-line`}>{cleanLines(p)}</p>
  ));
};

const CodeBlock = (props) => <PremiumCodeBlock {...props} />;

const DEFAULT_LANG = { 'sql-mastery': 'sql', 'web-development': 'html' };

/** Rough reading time for a module (~230 words per minute). */
function readingMinutes(rm) {
  const words = JSON.stringify(rm || {}).replace(/\\n|[{}[\]",:]/g, ' ').split(/\s+/).length;
  return Math.max(5, Math.round(words / 230));
}

/** Starter code for the Practice Lab: the problem as comments, then room to write the answer. */
function practiceStarter(ex, courseId) {
  const lang = detectLanguage(ex.solutionCode, '', courseId);
  const prefix = lang === 'sql' ? '-- ' : lang === 'python' ? '# ' : lang === 'html' ? '' : '// ';
  const problem = cleanText(ex.title || 'Practice exercise') + '\n' + String(ex.problem || '').split('\n').map(l => cleanText(l)).join('\n');
  if (lang === 'html') return `<!-- ${problem.replace(/-->/g, '')} -->\n\n`;
  return problem.split('\n').map(l => prefix + l).join('\n') + '\n\n';
}

export default function LearningPage(props) {
  return (
    <PlaygroundProvider defaultLang={DEFAULT_LANG[props.course.id] || 'python'}>
      <LearningInner {...props} />
    </PlaygroundProvider>
  );
}

const normalizePractice = (bp) => (typeof bp === 'string' ? { rule: bp } : bp || {});

function LearningInner({ course, studentUser, activeModuleId, onSelectModule, onExit, onProgressChanged, onViewCertificate }) {
  const toast = useToast();
  const playground = usePlayground();
  const modules = course.modules || [];
  const currentIndex = Math.max(0, modules.findIndex(m => m.id === activeModuleId));
  const current = modules[currentIndex];
  const rm = current?.readingMaterial || {};

  const [quizOpen, setQuizOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [revealed, setRevealed] = useState({});
  const mainRef = useRef(null);
  const readBarRef = useRef(null);

  const done = modules.filter(m => m.completed).length;
  const total = modules.length || 1;
  const allQuizzesPassed = done === modules.length && modules.length > 0;
  const passedFinal = course.learnerProgress?.passedFinal || null;
  const studentName = displayNameOf(studentUser);

  // Reset per-module UI and jump to the top of the reading pane (not the window).
  useEffect(() => {
    setRevealed({});
    setDrawer(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (readBarRef.current) readBarRef.current.style.width = '0%';
  }, [current?.id]);

  const onMainScroll = (e) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    if (readBarRef.current) readBarRef.current.style.width = `${max > 0 ? (el.scrollTop / max) * 100 : 100}%`;
  };

  const toggle = (key) => setRevealed(r => ({ ...r, [key]: !r[key] }));
  const goTo = (idx) => { if (modules[idx]) onSelectModule(modules[idx].id); };

  const openFinal = () => {
    if (passedFinal) { setFinalOpen(true); return; }
    if (!allQuizzesPassed) {
      toast(`Final assessment unlocks after you pass all ${modules.length} module quizzes (${done}/${modules.length} done).`, 'error', 5000);
      return;
    }
    setFinalOpen(true);
  };

  const jumpToEl = (elId) => {
    const el = document.getElementById(elId);
    const pane = mainRef.current;
    if (el && pane) pane.scrollTo({ top: el.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 16, behavior: 'smooth' });
  };

  /* ---------- build the reading sections dynamically (numbering follows what exists) ---------- */
  const sections = useMemo(() => {
    const s = [];
    const mistakes = [
      ...(rm.commonErrors || []).map(e => ({ type: 'obj', ...e })),
      ...(rm.commonMistakes || []).map(e => (typeof e === 'string' ? { type: 'str', text: e } : { type: 'obj', ...e }))
    ];
    const practices = (rm.bestPractices || []).map(normalizePractice).filter(p => p.rule || p.title);

    if (rm.introduction) s.push({ id: 'intro', title: 'Introduction', icon: BookOpen, body: <Paragraphs text={rm.introduction} /> });

    if (rm.objectives?.length) s.push({
      id: 'objectives', title: 'What you will learn', icon: Target, body: (
        <ul className="grid sm:grid-cols-2 gap-3">
          {rm.objectives.map((o, i) => (
            <li key={i} className="flex gap-3 p-3.5 rounded-xl bg-brand-50/60 border border-brand-100 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-peach-500 mt-0.5 shrink-0" />{cleanText(o)}
            </li>
          ))}
        </ul>
      )
    });

    if (rm.terminology?.length) s.push({
      id: 'terms', title: 'Key terminology', icon: BookOpen, body: (
        <div className="grid sm:grid-cols-2 gap-3">
          {rm.terminology.map((t, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="font-mono text-sm font-semibold text-brand-700">{cleanText(t.term)}</p>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{cleanText(t.definition)}</p>
              {t.importance && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100"><strong className="text-slate-600">Why it matters:</strong> {cleanText(t.importance)}</p>}
            </div>
          ))}
        </div>
      )
    });

    const concepts = (rm.sections || []).filter(sec => sec.heading).map((sec, i) => ({ id: `concept-${i}`, label: sec.heading }));
    if (concepts.length >= 2) s.push({
      id: 'map', title: 'Concept map', icon: Network, body: (
        <div className="space-y-3">
          <p className="text-sm text-charcoal/65">How the ideas in this module connect. Click a concept to jump to its explanation.</p>
          <ConceptMap title={moduleTitle(current?.title || '')} concepts={concepts} onPick={(id) => jumpToEl(id)} />
        </div>
      )
    });

    if (rm.diagram) s.push({
      id: 'diagram', title: rm.diagram.title ? cleanText(rm.diagram.title) : 'Architecture & workflow', icon: Layers, body: (
        <div className="space-y-3">
          <BlueprintDiagram ascii={rm.diagram.ascii} />
          <Paragraphs text={rm.diagram.explanation} className="text-sm leading-6 text-slate-600" />
        </div>
      )
    });

    if (rm.sections?.length) s.push({
      id: 'theory', title: 'Concepts explained', icon: BookOpen, body: (
        <div className="space-y-5">
          {rm.sections.map((sec, i) => (
            <div key={i} id={`concept-${i}`} className="space-y-3 scroll-mt-6">
              {sec.heading && <h4 className="flex items-center gap-3 text-xl font-semibold text-brand-900"><span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-900 text-xs font-sans font-bold flex items-center justify-center shrink-0">{i + 1}</span>{cleanText(sec.heading).replace(/^\d+[.)]\s*/, '')}</h4>}
              <Paragraphs text={sec.text || sec.content} />
              {sec.bulletPoints?.length > 0 && (
                <ul className="space-y-1.5 pl-1">
                  {sec.bulletPoints.map((b, k) => <li key={k} className="flex gap-2.5 text-[15px] text-slate-600"><span className="text-peach-500 mt-1">•</span>{cleanText(b)}</li>)}
                </ul>
              )}
              {sec.code && <CodeBlock courseId={course.id} code={sec.code} />}
              {sec.table?.headers && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-900 text-white"><tr>{sec.table.headers.map((h, k) => <th key={k} className="px-3 py-2 text-left font-semibold">{cleanText(h)}</th>)}</tr></thead>
                    <tbody>{sec.table.rows.map((r, k) => <tr key={k} className="odd:bg-white even:bg-slate-50">{r.map((c, j) => <td key={j} className="px-3 py-2 text-slate-600 border-t border-slate-100">{cleanText(c)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    });

    if (rm.tutorials?.length) s.push({
      id: 'tutorials', title: 'Step-by-step tutorials', icon: Terminal, body: (
        <div className="space-y-5">
          {rm.tutorials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 p-5">
              <h4 className="font-semibold text-brand-900">{cleanText(t.title)}</h4>
              <ol className="mt-4 space-y-4 border-l-2 border-peach-200 pl-5">
                {(t.steps || []).map((st, k) => (
                  <li key={k} className="relative">
                    <span className="absolute -left-[1.95rem] top-0 w-6 h-6 rounded-full bg-peach-500 text-white text-[11px] font-bold flex items-center justify-center">{st.step || k + 1}</span>
                    <p className="text-sm font-medium text-slate-700">{cleanText(st.instruction)}</p>
                    {st.code && <div className="mt-2"><CodeBlock courseId={course.id} code={st.code} /></div>}
                    {st.explanation && <p className="text-sm text-slate-500 mt-2">{cleanText(st.explanation)}</p>}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )
    });

    if (rm.codeExamples?.length) s.push({
      id: 'code', title: 'Code examples', icon: Code, body: (
        <div className="space-y-5">
          {rm.codeExamples.map((ex, i) => {
            const key = `lbl-${i}`;
            return (
              <div key={i} className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-brand-900">{cleanText(ex.title)}</p>
                  {ex.language && <span className="chip bg-brand-50 text-brand-700 uppercase text-[10px]">{ex.language}</span>}
                </div>
                <CodeBlock courseId={course.id} language={ex.language} code={ex.code} />
                {ex.explanation && <p className="text-sm text-slate-500"><strong className="text-slate-600">Note:</strong> {cleanText(ex.explanation)}</p>}
                {ex.lineByLine?.length > 0 && (
                  <div>
                    <button onClick={() => toggle(key)} className="text-sm font-semibold text-peach-500 hover:text-peach-600">{revealed[key] ? 'Hide' : 'Show'} line-by-line explanation</button>
                    {revealed[key] && (
                      <div className="mt-2 rounded-xl border border-slate-200 divide-y divide-slate-100 animate-fade-in">
                        {ex.lineByLine.map((l, k) => (
                          <div key={k} className="grid grid-cols-[auto,1fr] gap-3 p-3 text-sm">
                            <span className="text-xs font-mono text-brand-500 pt-0.5">L{l.line}</span>
                            <div><code className="text-[13px] text-brand-900 bg-brand-50 px-1.5 py-0.5 rounded">{l.code}</code><p className="text-slate-500 mt-1">{l.explanation}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )
    });

    if (mistakes.length) s.push({
      id: 'mistakes', title: 'Common mistakes & how to fix them', icon: AlertTriangle, body: (
        <div className="space-y-3">
          {mistakes.map((m, i) => m.type === 'str' ? (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-rose-50/60 border border-rose-100 text-sm text-slate-700">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />{cleanText(m.text)}
            </div>
          ) : (
            <div key={i} className="p-4 rounded-xl border border-rose-100 bg-white space-y-3">
              <p className="text-sm font-semibold text-rose-600">{cleanText(m.error || m.title)}</p>
              {m.reason && <p className="text-sm text-slate-600"><strong>Cause:</strong> {cleanText(m.reason)}</p>}
              <div className="grid sm:grid-cols-2 gap-3">
                {m.wrongCode && <div><p className="text-[11px] font-semibold uppercase text-rose-600 mb-1">Wrong</p><CodeBlock courseId={course.id} code={m.wrongCode} tone="bad" runnable={false} compact /></div>}
                {m.fixCode && <div><p className="text-[11px] font-semibold uppercase text-mint-500 mb-1">Correct</p><CodeBlock courseId={course.id} code={m.fixCode} tone="good" compact /></div>}
              </div>
              {m.explanation && <p className="text-sm text-slate-500"><strong className="text-slate-600">Tip:</strong> {cleanText(m.explanation)}</p>}
            </div>
          ))}
        </div>
      )
    });

    if (practices.length) s.push({
      id: 'best', title: 'Best practices & industry standards', icon: Lightbulb, body: (
        <div className="grid sm:grid-cols-2 gap-3">
          {practices.map((p, i) => (
            <div key={i} className="p-4 rounded-xl border border-mint-200 bg-mint-50/50 space-y-2">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-mint-400 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="space-y-1">
                  {p.title && <p className="text-sm font-semibold text-brand-900">{cleanText(p.title)}</p>}
                  {p.rule && <p className="text-sm text-slate-700 leading-relaxed">{cleanText(p.rule)}</p>}
                </div>
              </div>
              {p.why && <p className="text-xs text-slate-500 pl-9"><strong className="text-slate-600">Why:</strong> {cleanText(p.why)}</p>}
              {p.example && <div className="pl-9"><CodeBlock courseId={course.id} code={p.example} /></div>}
            </div>
          ))}
        </div>
      )
    });

    if (rm.practiceExercise) s.push({
      id: 'exercise', title: 'Practice exercise', icon: Sparkles, body: (
        <div className="space-y-3">
          {rm.practiceExercise.title && <p className="font-semibold text-brand-900">{cleanText(rm.practiceExercise.title)}</p>}
          <p className="text-[15px] text-slate-600 whitespace-pre-line leading-7">{cleanLines(rm.practiceExercise.problem || '')}</p>
          {rm.practiceExercise.solutionCode && (
            <>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => playground?.open({ code: practiceStarter(rm.practiceExercise, course.id), lang: detectLanguage(rm.practiceExercise.solutionCode, '', course.id) })} className="btn-primary py-2"><FlaskConical className="w-4 h-4" /> Solve in Practice Lab</button>
                <button onClick={() => toggle('solution')} className="btn-outline py-2">{revealed.solution ? 'Hide solution' : 'Show solution'}</button>
              </div>
              {revealed.solution && <div className="animate-fade-in"><CodeBlock courseId={course.id} code={rm.practiceExercise.solutionCode} label="solution" /></div>}
            </>
          )}
        </div>
      )
    });

    const qaList = (list, prefix, answerKey = 'answer') => (
      <div className="space-y-3">
        {list.map((q, i) => {
          const key = `${prefix}-${i}`;
          return (
            <div key={i} className="rounded-xl border border-slate-200 p-4">
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="flex-1 text-sm font-medium text-slate-700">{cleanText(q.question)}</p>
                <button onClick={() => toggle(key)} className="text-xs font-semibold text-peach-500 hover:text-peach-600 shrink-0">{revealed[key] ? 'Hide' : 'Answer'}</button>
              </div>
              {revealed[key] && (
                <div className="mt-3 ml-9 p-3 rounded-lg bg-slate-50 text-sm text-slate-600 space-y-2 animate-fade-in">
                  <p>{cleanText(q[answerKey])}</p>
                  {q.explanation && <p className="text-slate-500">{cleanText(q.explanation)}</p>}
                  {q.keyPoints?.length > 0 && <ul className="list-disc pl-5 text-slate-500">{q.keyPoints.map((k, j) => <li key={j}>{cleanText(k)}</li>)}</ul>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

    if (rm.practiceQuestions?.length) s.push({ id: 'practice-q', title: 'Practice questions', icon: HelpCircle, body: qaList(rm.practiceQuestions, 'pq') });
    if (rm.interviewQuestions?.length) s.push({ id: 'interview', title: 'Interview questions', icon: MessageSquare, body: qaList(rm.interviewQuestions, 'iq') });

    if (rm.miniTask) s.push({
      id: 'task', title: 'Mini task', icon: ClipboardList, body: (
        <div className="space-y-3">
          <p className="font-semibold text-brand-900">{cleanText(rm.miniTask.title)}</p>
          {rm.miniTask.objective && <p className="text-[15px] text-slate-600">{cleanText(rm.miniTask.objective)}</p>}
          {rm.miniTask.requirements?.length > 0 && (
            <ul className="space-y-2">{rm.miniTask.requirements.map((r, i) => <li key={i} className="flex gap-2.5 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-mint-400 mt-0.5 shrink-0" />{cleanText(r)}</li>)}</ul>
          )}
          {rm.miniTask.deliverable && <p className="text-sm p-3 rounded-lg bg-peach-50 text-brand-900"><strong>Deliverable:</strong> {cleanText(rm.miniTask.deliverable)}</p>}
        </div>
      )
    });

    const takeaways = rm.summary?.takeaways?.length ? rm.summary.takeaways : rm.keyTakeaways;
    if (takeaways?.length || rm.summary?.quickReference?.length) s.push({
      id: 'summary', title: 'Summary & key takeaways', icon: CheckCircle2, body: (
        <div className="space-y-4">
          {takeaways?.length > 0 && <ul className="space-y-2">{takeaways.map((t, i) => <li key={i} className="flex gap-2.5 text-[15px] text-slate-600"><CheckCircle2 className="w-4 h-4 text-peach-500 mt-1 shrink-0" />{cleanText(t)}</li>)}</ul>}
          {rm.summary?.quickReference?.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2">{rm.summary.quickReference.map((q, i) => <code key={i} className="text-[13px] p-2.5 rounded-lg bg-brand-50 text-brand-900">{cleanText(q)}</code>)}</div>
          )}
        </div>
      )
    });

    if (rm.references?.length) s.push({
      id: 'refs', title: 'References', icon: ExternalLink, body: (
        <div className="flex flex-wrap gap-2">
          {rm.references.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noreferrer" className="chip bg-white border border-slate-200 text-brand-700 hover:border-brand-400">{r.title}<ExternalLink className="w-3 h-3" /></a>)}
        </div>
      )
    });
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, revealed]);

  const jumpTo = (id) => jumpToEl(`sec-${id}`);

  if (!current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-brand-900">This course has no modules yet.</p>
        <button className="btn-outline" onClick={onExit}>Back to dashboard</button>
      </div>
    );
  }

  /* ---------- sidebar ---------- */
  const sidebar = (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl bg-brand-900 text-white p-4">
        <div className="flex items-center gap-3">
          <ProgressRing value={(done / total) * 100} size={52} dark />
          <div>
            <p className="text-xs text-brand-200">Quizzes passed</p>
            <p className="font-semibold">{done} of {modules.length} modules</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Modules">
        {modules.map((m, i) => {
          const active = i === currentIndex;
          return (
            <button key={m.id} onClick={() => goTo(i)} className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition ${active ? 'bg-peach-50 ring-1 ring-peach-200' : 'hover:bg-slate-50'}`}>
              <span className={`mt-0.5 w-7 h-7 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 ${m.completed ? 'bg-mint-400 text-white' : active ? 'bg-peach-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {m.completed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-sm leading-snug ${active ? 'font-semibold text-brand-900' : 'text-slate-600'}`}>{moduleTitle(m.title)}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">{m.completed ? `Quiz passed${m.quizScore !== undefined ? ` · ${m.quizScore}%` : ''}` : m.quizScore !== undefined ? `Best ${m.quizScore}% · retake quiz` : 'Quiz pending'}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {course.projects?.length > 0 && (
        <button onClick={() => setProjectsOpen(true)} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:border-brand-300 transition">
          <span className="flex items-center gap-2 text-sm font-semibold text-brand-900"><Briefcase className="w-4 h-4 text-peach-500" />{course.projects.length} mini projects</span>
          <span className="block text-xs text-slate-500 mt-1">Practice builds with starter code &amp; GitHub submission.</span>
        </button>
      )}

      <div className={`rounded-2xl p-4 border ${passedFinal ? 'border-mint-300 bg-mint-50' : allQuizzesPassed ? 'border-peach-300 bg-peach-50' : 'border-slate-200 bg-slate-50'}`}>
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          {passedFinal ? <Award className="w-4 h-4 text-mint-500" /> : allQuizzesPassed ? <ShieldCheck className="w-4 h-4 text-peach-500" /> : <Lock className="w-4 h-4 text-slate-400" />}
          Final assessment
        </p>
        <p className="text-xs text-slate-500 mt-1.5">
          {passedFinal ? `Passed with ${passedFinal.percentage}%. Your certificate is ready.`
            : allQuizzesPassed ? '25 questions · 45 minutes · proctored. Pass mark 70%.'
            : `Locked — pass all module quizzes first (${done}/${modules.length}).`}
        </p>
        {!passedFinal && <ProgressBar value={(done / total) * 100} className="mt-3" tone={allQuizzesPassed ? 'peach' : 'plum'} />}
        <button onClick={passedFinal ? onViewCertificate : openFinal} disabled={!allQuizzesPassed && !passedFinal} className={`mt-3 w-full ${passedFinal ? 'btn-plum' : 'btn-primary'} py-2.5`}>
          {passedFinal ? <><Award className="w-4 h-4" /> View certificate</> : allQuizzesPassed ? 'Start final assessment' : <><Lock className="w-4 h-4" /> Locked</>}
        </button>
      </div>
    </div>
  );

  const myScore = current.quizScore;

  return (
    <div className="h-[100dvh] flex flex-col bg-cream overflow-hidden">
      {/* Top bar */}
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-3 sm:px-5 z-30">
        <button onClick={() => setDrawer(true)} className="lg:hidden p-2 rounded-xl hover:bg-slate-100" aria-label="Open modules"><Menu className="w-5 h-5 text-brand-900" /></button>
        <button onClick={onExit} className="btn-ghost px-3 py-2 hidden sm:inline-flex"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-peach-500 truncate">{cleanText(course.title)}</p>
          <p className="text-sm font-semibold text-brand-900 truncate">Module {currentIndex + 1}: {moduleTitle(current.title)}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 mr-1">
          <span>{course.progress}%</span>
          <ProgressBar value={course.progress} className="w-24" />
        </div>
        <button onClick={() => playground?.open()} className="btn-ghost px-3 py-2 border border-brand-900/10" title="Open the Practice Lab"><FlaskConical className="w-4 h-4" /><span className="hidden xl:inline">Practice Lab</span></button>
        <button onClick={() => generateCoursePDF(course, studentName)} className="btn-outline px-3 py-2" title="Download course PDF"><Download className="w-4 h-4" /><span className="hidden xl:inline">Course PDF</span></button>
        {passedFinal ? (
          <button onClick={onViewCertificate} className="btn-plum px-3 sm:px-4 py-2"><Award className="w-4 h-4" /><span className="hidden sm:inline">Certificate</span></button>
        ) : (
          <button onClick={openFinal} className={`btn px-3 sm:px-4 py-2 ${allQuizzesPassed ? 'bg-peach-500 text-white hover:bg-peach-600' : 'bg-slate-100 text-slate-500'}`} title={allQuizzesPassed ? 'Start final assessment' : 'Pass all module quizzes to unlock'}>
            {allQuizzesPassed ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}<span className="hidden sm:inline">Final assessment</span>
          </button>
        )}
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-80 xl:w-[22rem] shrink-0 bg-white border-r border-slate-200 overflow-y-auto thin-scroll overscroll-contain">{sidebar}</aside>

        {/* Mobile drawer */}
        {drawer && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-brand-950/40 animate-fade-in" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-white overflow-y-auto overscroll-contain animate-slide-in-left shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <button onClick={onExit} className="btn-ghost px-2 py-1.5"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
                <button onClick={() => setDrawer(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Reading pane — the only scroll container for module content */}
        <main ref={mainRef} onScroll={onMainScroll} className="flex-1 min-w-0 overflow-y-auto overscroll-contain relative" style={{ scrollbarGutter: 'stable' }}>
          <div className="sticky top-0 z-10 h-1 bg-transparent"><div ref={readBarRef} className="h-full bg-peach-500 transition-[width] duration-150" style={{ width: '0%' }} /></div>

          <div key={current.id} className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-fade-up">
            {/* Module hero */}
            <div className="relative overflow-hidden rounded-3xl bg-brand-900 text-ivory">
              <SafeImg src={course.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-r from-evergreen via-brand-900/95 to-brand-900/60" />
              <div className="absolute inset-0 texture-dots-light" />
              <div className="relative p-6 sm:p-9">
                <div className="flex items-center gap-3">
                  <span className="font-display text-5xl sm:text-6xl font-semibold text-ivory/15 leading-none">{String(currentIndex + 1).padStart(2, '0')}</span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">Module {currentIndex + 1} of {modules.length}</p>
                </div>
                <h1 className="mt-3 text-[1.7rem] sm:text-[2.3rem] font-medium leading-tight max-w-3xl">{moduleTitle(current.title)}</h1>
                {current.description && <p className="mt-3 text-brand-100/90 leading-relaxed max-w-3xl">{cleanText(current.description)}</p>}
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`chip ${current.completed ? 'bg-ivory text-brand-900' : 'bg-white/10 text-brand-100'}`}>
                    {current.completed ? <><CheckCircle2 className="w-3.5 h-3.5" /> Quiz passed {myScore !== undefined ? `(${myScore}%)` : ''}</> : 'Quiz not passed yet'}
                  </span>
                  <span className="chip bg-white/10 text-brand-100"><BookOpen className="w-3.5 h-3.5" />{sections.length} sections</span>
                  <span className="chip bg-white/10 text-brand-100"><Timer className="w-3.5 h-3.5" />~{readingMinutes(rm)} min read</span>
                  <span className="chip bg-white/10 text-brand-100"><Code className="w-3.5 h-3.5" />{(rm.codeExamples || []).length} runnable examples</span>
                </div>
              </div>
            </div>

            <LearningFlow steps={[
              { icon: BookOpen, title: 'Read & understand', text: 'Concepts and concept map', done: true },
              { icon: Code, title: 'Run the examples', text: 'Press “Try it” on any code', done: false },
              { icon: FlaskConical, title: 'Practice', text: 'Solve the exercise in the lab', done: false },
              { icon: ListChecks, title: 'Pass the quiz', text: '70% marks the module done', done: !!current.completed }
            ]} />

            {/* Section jump list */}
            {sections.length > 2 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                {sections.map((s, i) => (
                  <button key={s.id} onClick={() => jumpTo(s.id)} className="chip whitespace-nowrap bg-white border border-slate-200 text-slate-600 hover:border-peach-300 hover:text-brand-900">
                    <span className="text-peach-500">{i + 1}.</span> {s.title}
                  </button>
                ))}
              </div>
            )}

            {sections.map((s, i) => (
              <section key={s.id} id={`sec-${s.id}`} className="card p-5 sm:p-8 scroll-mt-4">
                <h2 className="flex items-center gap-3.5 text-xl sm:text-2xl font-medium text-brand-900 mb-5 pb-4 border-b border-brand-900/10">
                  <span className="w-10 h-10 rounded-xl bg-brand-900 text-ivory flex items-center justify-center shrink-0"><s.icon className="w-[18px] h-[18px]" /></span>
                  <span><span className="font-sans text-xs font-bold tracking-[0.2em] text-sage block mb-0.5">SECTION {String(i + 1).padStart(2, '0')}</span>{s.title}</span>
                </h2>
                <div className="space-y-3">{s.body}</div>
              </section>
            ))}

            {/* Quiz call-to-action */}
            <section className="rounded-3xl border-2 border-dashed border-peach-300 bg-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
              <span className="w-14 h-14 rounded-2xl bg-peach-500 text-white flex items-center justify-center shrink-0"><ListChecks className="w-7 h-7" /></span>
              <div className="flex-1">
                <p className="font-bold text-brand-900 text-lg">Module {currentIndex + 1} quiz</p>
                <p className="text-sm text-slate-500">5 questions · pass mark 70% · unlimited retakes. Passing marks this module complete.</p>
              </div>
              <button onClick={() => setQuizOpen(true)} className={current.completed ? 'btn-outline' : 'btn-primary'}>
                {current.completed ? 'Retake quiz' : 'Take quiz'}
              </button>
            </section>

            {/* Prev / next */}
            <div className="flex items-center justify-between gap-3 pt-2 pb-10">
              <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex === 0} className="btn-outline"><ChevronLeft className="w-4 h-4" /> Previous</button>
              {currentIndex < modules.length - 1 ? (
                <button onClick={() => goTo(currentIndex + 1)} className="btn-plum">Next module <ChevronRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={passedFinal ? onViewCertificate : openFinal} className="btn-primary">{passedFinal ? 'View certificate' : 'Final assessment'} <ChevronRight className="w-4 h-4" /></button>
              )}
            </div>
          </div>
        </main>
      </div>

      <ModuleQuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        module={current}
        moduleNumber={currentIndex + 1}
        courseId={course.id}
        studentUser={studentUser}
        hasNextModule={currentIndex < modules.length - 1}
        onSubmitted={() => onProgressChanged()}
        onContinueNextModule={() => {
          setQuizOpen(false);
          if (currentIndex < modules.length - 1) goTo(currentIndex + 1);
        }}
      />

      <FinalTestModal
        isOpen={finalOpen}
        onClose={() => setFinalOpen(false)}
        course={course}
        studentUser={studentUser}
        locked={!allQuizzesPassed}
        passedFinal={passedFinal}
        onSubmitted={() => onProgressChanged()}
        onViewCertificate={() => { setFinalOpen(false); onViewCertificate(); }}
      />

      <CourseProjectsModal isOpen={projectsOpen} onClose={() => setProjectsOpen(false)} course={course} />
    </div>
  );
}
