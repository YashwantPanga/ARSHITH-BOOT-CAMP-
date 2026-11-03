import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, Circle, Award, Download, ChevronRight, ChevronLeft, BookOpen, ExternalLink,
  Code, Dumbbell, AlertTriangle, ListChecks, HelpCircle, Briefcase, Terminal, Layers, Lock, Menu, X,
  ShieldCheck, Lightbulb, Target, ClipboardList, MessageSquare, Clock, Network, PlayCircle, FlaskConical, Timer, Check, Star, Search
} from 'lucide-react';
import { generateCoursePDF } from '../utils/pdfGenerator';
import { cleanText, moduleTitle, displayTitle } from '../utils/textUtils';
import ModuleQuizModal from '../components/ModuleQuizModal';
import FinalTestModal from '../components/FinalTestModal';
import CourseProjectsModal from '../components/CourseProjectsModal';
import PdfBuildOverlay from '../components/PdfBuildOverlay';
import { ProgressRing, ProgressBar, useToast, SafeImg } from '../components/ui';
import PremiumCodeBlock from '../components/CodeBlock';
import { PlaygroundProvider, usePlayground } from '../components/CodePlayground';
import { ConceptMap, BlueprintDiagram } from '../components/Diagrams';
import { conceptLabel, conceptSummary, markdownConcepts } from '../utils/conceptSummary';
import VisualDiagram from '../components/diagrams/VisualDiagram';
import { visualDiagramFor } from '../data/visualDiagrams';
import { detectLanguage } from '../utils/highlight';
import { displayNameOf, userIdOf } from '../utils/session';
import { api } from '../services/api';
import { normalizeModule } from '../utils/normalizeModule';
import Markdown from '../components/lesson/Markdown';
import WorkflowDiagram from '../components/lesson/WorkflowDiagram';
import PracticeExercises from '../components/lesson/PracticeExercises';
import {
  useModuleEnrichment, SectionSkeleton, LoadError, SkillsAndPrereqs, Intuition, WorkedExample, CaseStudy, KnowledgeCheck, FurtherLearning
} from '../components/lesson/EnrichmentBlocks';

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

/** Live result of an HTML / CSS lesson example, in a sandboxed frame that grows to fit its content. */
function LivePreview({ code, title }) {
  const [h, setH] = useState(160);
  const id = useMemo(() => `pv-${Math.random().toString(36).slice(2)}`, []);
  useEffect(() => {
    const onMsg = (e) => { if (e.data?.arbPreview === id) setH(Math.min(560, Math.max(80, e.data.height + 4))); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [id]);
  const doc = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;margin:14px;color:#1f2937}</style></head><body>${code}<script>
    const send = () => parent.postMessage({ arbPreview: '${id}', height: document.documentElement.scrollHeight }, '*');
    addEventListener('load', send); new ResizeObserver(send).observe(document.body); setTimeout(send, 300);
  </script></body></html>`;
  return (
    <div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sage mb-1.5">Result (live preview - try clicking or typing in it)</p>
      <iframe title={`Live preview: ${title}`} srcDoc={doc} sandbox="allow-scripts allow-forms allow-modals" className="w-full rounded-xl border border-slate-200 bg-white" style={{ height: h }} />
    </div>
  );
}

const DEFAULT_LANG = { 'sql-mastery': 'sql', 'web-development': 'html' };

/** Rough reading time for a module (~230 words per minute). */
function readingMinutes(rm) {
  // generated example results (tables, output, charts) are not read word by word
  const text = JSON.stringify(rm || {}, (k, v) => (k === 'result' ? undefined : v));
  const words = text.replace(/\\n|[{}[\]",:]/g, ' ').split(/\s+/).length;
  return Math.max(5, Math.round(words / 160)); // technical text with code reads slower than prose
}

/** Examples the learner can run: the code examples plus the section examples. */
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const numberWord = (n) => NUMBER_WORDS[n] || String(n);
/** "Loops — teaching your code to repeat itself" -> ['Loops', 'teaching your code to repeat itself'] (second line shown in italics). */
function splitTitle(t) {
  const m = String(t).match(/^(.{3,}?)\s+(?:—|–|-|:)\s+(.+)$/) || String(t).match(/^(.{3,}?):\s*(.+)$/);
  return m ? [m[1], m[2]] : [t, ''];
}

const runnableCount = (rm) => (rm.codeExamples || []).length + (rm.sections || []).filter(s => s.code && s.run !== false).length;

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

function LearningInner({ course, studentUser, activeModuleId, onSelectModule, onExit, onProgressChanged, onViewCertificate, onCourseLocked, onUnlockAgain, retakePrice = 0 }) {
  const toast = useToast();
  const playground = usePlayground();
  const modules = course.modules || [];
  const currentIndex = Math.max(0, modules.findIndex(m => m.id === activeModuleId));
  const current = modules[currentIndex];
  const rm = current?.readingMaterial || {};
  const nm = useMemo(() => normalizeModule(current), [current]);
  const enr = useModuleEnrichment(course.id, current?.id);
  const [practiceDone, setPracticeDone] = useState({});

  const [quizOpen, setQuizOpen] = useState(false);
  const [finalOpen, setFinalOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(null);
  const [pdfDone, setPdfDone] = useState(false);
  const downloadPdf = async () => {
    setPdfBusy(true); setPdfDone(false); setPdfProgress(null);
    try {
      await generateCoursePDF(course, studentName, { onProgress: setPdfProgress });
      setPdfDone(true);
      await new Promise(r => setTimeout(r, 1800)); // let the "ready" stamp play
    } catch (err) {
      toast(`Could not create the PDF: ${err.message}`, 'error');
    } finally {
      setPdfBusy(false); setPdfDone(false); setPdfProgress(null);
    }
  };
  const [drawer, setDrawer] = useState(false);
  const [activeSec, setActiveSec] = useState(null); // section in view, for the course path and 'On this page'
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [revealed, setRevealed] = useState({});
  const mainRef = useRef(null);
  const readBarRef = useRef(null);

  const done = modules.filter(m => m.completed).length;
  const total = modules.length || 1;
  const allQuizzesPassed = done === modules.length && modules.length > 0;
  // Final assessment also requires a GitHub repository for any one mini project (enforced on the server).
  const projectReq = course.learnerProgress?.projects || { required: Math.min(1, course.projects?.length || 0), total: course.projects?.length || 0, submitted: 0, missing: course.projects || [] };
  const projectsDone = projectReq.required === 0 || (projectReq.missing || []).length === 0;
  const finalReady = allQuizzesPassed && projectsDone;
  const passedFinal = course.learnerProgress?.passedFinal || null;
  const studentName = displayNameOf(studentUser);

  // Reset per-module UI and jump to the top of the reading pane (not the window).
  useEffect(() => {
    setRevealed({});
    setDrawer(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    if (readBarRef.current) readBarRef.current.style.width = '0%';
  }, [current?.id]);

  // Practice completions saved on the server (signed-in learners only).
  useEffect(() => {
    if (!studentUser?.token) return undefined;
    let alive = true;
    api.getPracticeProgress(userIdOf(studentUser), course.id)
      .then(res => {
        if (!alive) return;
        const map = {};
        Object.entries(res.progress || {}).forEach(([moduleId, p]) => { map[moduleId] = Object.keys(p.exercises || {}); });
        setPracticeDone(map);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [course.id, studentUser]);

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
      toast(`Final assessment unlocks after you pass all ${modules.length} module quizzes (${done}/${modules.length} done) and submit all project repositories.`, 'error', 5000);
      return;
    }
    if (!projectsDone) {
      toast('Submit a GitHub repository for any one course project to unlock the final assessment.', 'error', 5500);
      setProjectsOpen(true);
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
  // Original module content comes from `nm` (a normalised, read-only view of readingMaterial);
  // additional content comes from `enr` (loaded separately, never merged into the stored module).
  const sections = useMemo(() => {
    const s = [];
    const E = enr.data;
    const enrLoading = enr.status === 'loading';
    const enrFailed = enr.status === 'error';
    const mistakes = [
      ...nm.commonErrors.map(e => ({ type: 'obj', ...e })),
      ...nm.commonMistakes.map(e => (typeof e === 'string' ? { type: 'str', text: e } : { type: 'obj', ...e }))
    ];
    const practices = nm.bestPractices.map(normalizePractice).filter(p => p.rule || p.title);

    // 1. Learning objectives
    if (nm.objectives.length || E?.skills?.length || E?.prerequisites?.length) s.push({
      id: 'objectives', title: 'Learning objectives', icon: Target, body: (
        <div className="space-y-4">
          {nm.objectives.length > 0 && (
            <ul className="grid sm:grid-cols-2 gap-3">
              {nm.objectives.map((o, i) => (
                <li key={i} className="flex gap-3 p-3.5 rounded-xl bg-brand-50/60 border border-brand-100 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-peach-500 mt-0.5 shrink-0" />{cleanText(o)}
                </li>
              ))}
            </ul>
          )}
          {E && <SkillsAndPrereqs skills={E.skills} prerequisites={E.prerequisites} />}
        </div>
      )
    });

    // 2. Introduction and intuition
    if (nm.introduction || E?.intuition) s.push({
      id: 'intro', title: 'Introduction & intuition', icon: BookOpen, body: (
        <div className="space-y-4">
          <Paragraphs text={nm.introduction} />
          {E?.intuition && <Intuition intuition={E.intuition} />}
        </div>
      )
    });

    if (nm.terminology.length) s.push({
      id: 'terms', title: 'Key terminology', icon: BookOpen, body: (
        <div className="grid sm:grid-cols-2 gap-3">
          {nm.terminology.map((t, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-white">
              <p className="font-mono text-sm font-semibold text-brand-700 break-words">{cleanText(t.term)}</p>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{cleanText(t.definition)}</p>
              {t.importance && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100"><strong className="text-slate-600">Why it matters:</strong> {cleanText(t.importance)}</p>}
            </div>
          ))}
        </div>
      )
    });

    // Concept map: from structured section headings, or from the Markdown headings of `theory`.
    // Each concept gets a short title, an optional subtitle and a one-sentence summary of what it covers.
    const concepts = (nm.sections.length
      ? nm.sections.map((sec, i) => ({ id: `concept-${i}`, heading: sec.heading, body: sec.text })).filter(c => c.heading)
      : markdownConcepts(nm.theoryMarkdown).map((c, i) => ({ id: `theory-h-${i}`, ...c }))
    ).map(c => ({ id: c.id, ...conceptLabel(c.heading), summary: conceptSummary(c.body) }));
    if (concepts.length >= 2) s.push({
      id: 'map', title: 'Concept map', icon: Network, body: (
        <ConceptMap title={moduleTitle(current?.title || '')} concepts={concepts} onPick={(id) => jumpToEl(id)} />
      )
    });

    // 3. Detailed concepts
    if (nm.sections.length) s.push({
      id: 'theory', title: 'Concepts explained', icon: BookOpen, body: (
        <div className="space-y-5">
          {nm.sections.map((sec, i) => (
            <div key={i} id={`concept-${i}`} className="space-y-3 scroll-mt-6">
              {sec.heading && <h4 className="flex items-start gap-3 text-xl font-semibold text-brand-900"><span className="mt-0.5 w-7 h-7 rounded-lg bg-brand-50 text-brand-900 text-xs font-sans font-bold flex items-center justify-center shrink-0">{i + 1}</span><span className="min-w-0">{cleanText(sec.heading).replace(/^\d+[.)]\s*/, '')}</span></h4>}
              <Paragraphs text={sec.text || sec.content} />
              {sec.syntax && (
                <div className="rounded-xl border border-brand-900/10 bg-cream/70 overflow-hidden">
                  <p className="px-4 pt-2.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-sage">Syntax</p>
                  <pre className="px-4 pb-3 pt-1 font-mono text-[13.5px] text-brand-900 whitespace-pre-wrap break-words m-0">{sec.syntax}</pre>
                </div>
              )}
              {sec.bulletPoints?.length > 0 && (
                <ul className="space-y-1.5 pl-1">
                  {sec.bulletPoints.map((b, k) => <li key={k} className="flex gap-2.5 text-[15px] text-slate-600"><span className="text-peach-500 mt-1">•</span><span className="min-w-0">{cleanText(b).replace(/^\s*[•●▪*-]+\s*/, '')}</span></li>)}
                </ul>
              )}
              {sec.code && (
                <div className="space-y-2">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sage">{sec.run === false ? 'Example' : 'Example - press Try it to run it yourself'}</p>
                  <CodeBlock courseId={course.id} language={sec.language} code={sec.code} runnable={sec.run !== false} />
                </div>
              )}
              {(sec.result?.output || sec.output) && (
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sage mb-1.5">{sec.result?.output ? 'Output' : 'What you will see'}</p>
                  <pre className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-[13px] text-slate-800 whitespace-pre-wrap break-words max-h-80 overflow-y-auto thin-scroll m-0">{sec.result?.output || sec.output}</pre>
                </div>
              )}
              {sec.result?.image && (
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sage mb-1.5">Chart</p>
                  <img src={sec.result.image} alt={`Chart drawn by the example: ${cleanText(sec.heading || '')}`} className="max-w-full rounded-xl border border-slate-200 bg-white" />
                </div>
              )}
              {sec.code && sec.run !== false && ['html', 'css'].includes(sec.language) && <LivePreview code={sec.code} title={cleanText(sec.heading || 'Example')} />}
              {sec.result?.columns?.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-sage mb-1.5">Result ({sec.result.rows.length} row{sec.result.rows.length === 1 ? '' : 's'}{sec.result.more ? `, first ${sec.result.rows.length} shown` : ''})</p>
                  <div className="overflow-x-auto thin-scroll rounded-xl border border-slate-200 max-h-72">
                    <table className="w-full text-[13px] font-mono">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0"><tr>{sec.result.columns.map((h, k) => <th key={k} className="px-3 py-1.5 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody>{sec.result.rows.map((r, k) => <tr key={k} className="odd:bg-white even:bg-slate-50">{r.map((c, j) => <td key={j} className="px-3 py-1.5 text-slate-700 border-t border-slate-100 whitespace-nowrap">{c === null ? <span className="text-slate-400">NULL</span> : String(c)}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                </div>
              )}
              {sec.table?.headers && (
                <div className="overflow-x-auto thin-scroll rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-brand-900 text-white"><tr>{sec.table.headers.map((h, k) => <th key={k} className="px-3 py-2 text-left font-semibold">{cleanText(h)}</th>)}</tr></thead>
                    <tbody>{(sec.table.rows || []).map((r, k) => <tr key={k} className="odd:bg-white even:bg-slate-50">{r.map((c, j) => <td key={j} className="px-3 py-2 text-slate-600 border-t border-slate-100">{cleanText(c)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
              {sec.note && (
                <div className="flex gap-3.5 rounded-[18px] border border-brand-900/[.08] bg-brand-50/70 px-4 py-4">
                  <span className="w-9 h-9 rounded-xl bg-forest text-[#E5C88E] flex items-center justify-center shrink-0"><Lightbulb className="w-4 h-4" /></span>
                  <div className="min-w-0"><p className="font-lesson text-[18px] font-semibold text-evergreen leading-tight">Remember</p><p className="mt-1 text-[15px] leading-relaxed text-charcoal/80">{sec.note}</p></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    });
    else if (nm.theoryMarkdown) s.push({
      id: 'theory', title: 'Concepts explained', icon: BookOpen, body: <Markdown source={nm.theoryMarkdown} courseId={course.id} headingIdPrefix="theory-h" />
    });

    // 4. Workflow & architecture: new structured diagram + the module's original ASCII diagram
    if (nm.diagram || E?.workflow || enrLoading || enrFailed) s.push({
      id: 'diagram', title: nm.diagram?.title ? cleanText(nm.diagram.title) : 'Architecture & workflow', icon: Layers, body: (
        <div className="space-y-5">
          {E?.workflow && (
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-[0.14em] text-sage">{nm.diagram ? 'STEP-BY-STEP WORKFLOW' : 'WORKFLOW DIAGRAM'}</p>
              <WorkflowDiagram def={E.workflow} />
              {E.workflow.explanation && <p className="text-sm leading-6 text-charcoal/75">{E.workflow.explanation}</p>}
            </div>
          )}
          {enrLoading && !nm.diagram && <SectionSkeleton />}
          {enrFailed && <LoadError message={enr.message} onRetry={enr.retry} />}
          {nm.diagram && (
            <div className="space-y-3">
              {E?.workflow && <p className="text-xs font-bold tracking-[0.14em] text-sage">ARCHITECTURE DIAGRAM</p>}
              {/* Visual version when one exists; the original text diagram stays one click away. */}
              {visualDiagramFor(current.id)
                ? <VisualDiagram key={current.id} def={visualDiagramFor(current.id)} original={nm.diagram.ascii} />
                : <BlueprintDiagram ascii={nm.diagram.ascii} />}
              <Paragraphs text={nm.diagram.explanation} className="text-sm leading-6 text-slate-600" />
            </div>
          )}
        </div>
      )
    });

    if (nm.tutorials.length) s.push({
      id: 'tutorials', title: 'Step-by-step tutorials', icon: Terminal, body: (
        <div className="space-y-5">
          {nm.tutorials.map((t, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
              <h4 className="font-semibold text-brand-900">{cleanText(t.title)}</h4>
              <ol className="mt-4 space-y-4 border-l-2 border-peach-200 pl-5 ml-1">
                {(t.steps || []).map((st, k) => (
                  <li key={k} className="relative min-w-0">
                    <span className="absolute -left-[1.95rem] top-0 w-6 h-6 rounded-full bg-peach-500 text-white text-[11px] font-bold flex items-center justify-center">{st.step || k + 1}</span>
                    {st.title && <p className="text-sm font-semibold text-brand-900">{cleanText(st.title)}</p>}
                    {st.instruction && <p className={`text-sm ${st.title ? 'text-slate-600 mt-0.5' : 'font-medium text-slate-700'}`}>{cleanText(st.instruction)}</p>}
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
    else if (nm.tutorialMarkdown) s.push({
      id: 'tutorials', title: 'Step-by-step tutorial', icon: Terminal, body: <Markdown source={nm.tutorialMarkdown} courseId={course.id} />
    });

    // 5. Practical examples and code
    if (nm.codeExamples.length || E?.workedExample) s.push({
      id: 'code', title: 'Code examples', icon: Code, body: (
        <div className="space-y-6">
          {nm.codeExamples.map((ex, i) => {
            const key = `lbl-${i}`;
            return (
              <div key={i} className="space-y-2.5">
                <CodeBlock courseId={course.id} language={ex.language} code={ex.code} title={cleanText(ex.title)} />
                {ex.explanation && (
                  <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-600">How this code works</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{cleanText(ex.explanation)}</p>
                  </div>
                )}
                {ex.lineByLine?.length > 0 && (
                  <div>
                    <button onClick={() => toggle(key)} className="text-sm font-semibold text-peach-500 hover:text-peach-600">{revealed[key] ? 'Hide' : 'Show'} line-by-line explanation</button>
                    {revealed[key] && (
                      <div className="mt-2 rounded-xl border border-slate-200 divide-y divide-slate-100 animate-fade-in">
                        {ex.lineByLine.map((l, k) => (
                          <div key={k} className="grid grid-cols-[auto,1fr] gap-3 p-3 text-sm">
                            <span className="text-xs font-mono text-brand-500 pt-0.5">L{l.line}</span>
                            <div className="min-w-0"><code className="text-[13px] text-brand-900 bg-brand-50 px-1.5 py-0.5 rounded break-words">{l.code}</code><p className="text-slate-500 mt-1">{l.explanation}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {E?.workedExample && (
            <div className="pt-5 border-t border-brand-900/10">
              <p className="text-xs font-bold tracking-[0.14em] text-sage mb-3">WORKED EXAMPLE, LINE BY LINE</p>
              <WorkedExample example={E.workedExample} courseId={course.id} />
            </div>
          )}
        </div>
      )
    });

    if (mistakes.length) s.push({
      id: 'mistakes', title: 'Common mistakes & how to fix them', icon: AlertTriangle, body: (
        <div className="space-y-3">
          {mistakes.map((m, i) => m.type === 'str' ? (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-rose-50/60 border border-rose-100 text-sm text-slate-700">
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /><span className="min-w-0">{cleanText(m.text)}</span>
            </div>
          ) : (
            <div key={i} className="p-4 rounded-xl border border-rose-100 bg-white space-y-3">
              <p className="text-sm font-semibold text-rose-600">{cleanText(m.error || m.title || m.mistake)}</p>
              {m.reason && <p className="text-sm text-slate-600"><strong>Cause:</strong> {cleanText(m.reason)}</p>}
              <div className="grid sm:grid-cols-2 gap-3">
                {m.wrongCode && <div className="min-w-0"><p className="text-[11px] font-semibold uppercase text-rose-600 mb-1">Wrong</p><CodeBlock courseId={course.id} code={m.wrongCode} tone="bad" runnable={false} compact /></div>}
                {m.fixCode && <div className="min-w-0"><p className="text-[11px] font-semibold uppercase text-mint-500 mb-1">Correct</p><CodeBlock courseId={course.id} code={m.fixCode} tone="good" compact /></div>}
              </div>
              {(m.explanation || m.fix) && <p className="text-sm text-slate-500"><strong className="text-slate-600">Tip:</strong> {cleanText(m.explanation || m.fix)}</p>}
            </div>
          ))}
        </div>
      )
    });

    if (practices.length) s.push({
      id: 'best', title: 'Best practices & industry standards', icon: Lightbulb, body: (
        <div className="grid sm:grid-cols-2 gap-3">
          {practices.map((p, i) => (
            <div key={i} className="p-4 rounded-xl border border-mint-200 bg-mint-50/50 space-y-2 min-w-0">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-lg bg-mint-400 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="space-y-1 min-w-0">
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

    // 6. Real-world case study
    if (E?.caseStudy) s.push({ id: 'case', title: 'Real-world case study', icon: Briefcase, body: <CaseStudy study={E.caseStudy} /> });

    // 7. Practice: the module's original exercise, the new graded exercises and mini tasks
    const pe = nm.practiceExercise;
    if (pe || E?.exercises?.length || nm.miniTasks.length || enrLoading || enrFailed) s.push({
      id: 'exercise', title: 'Practice exercises', icon: Dumbbell, body: (
        <div className="space-y-6">
          {pe && (
            <div className="practice-card rounded-[22px] bg-[#0C3B2E] text-ivory p-4 sm:p-6 space-y-3.5 shadow-[0_24px_50px_-30px_rgba(12,45,38,.9)]">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#D9B776]">Practice {current ? `${currentIndex + 1}.1` : ''} <span className="px-2 py-0.5 rounded-md bg-white/10 text-ivory/80 tracking-normal normal-case font-semibold">Module exercise</span></p>
              <p className="font-lesson text-[24px] sm:text-[27px] font-semibold leading-tight">{cleanText(pe.title)}</p>
              {pe.problem && <p className="text-[15px] text-ivory/80 whitespace-pre-line leading-7">{cleanLines(pe.problem)}</p>}
              {pe.starterCode && <CodeBlock courseId={course.id} code={pe.starterCode} label="starter code" />}
              {(pe.solutionCode || pe.starterCode) && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => playground?.open({ code: pe.starterCode || practiceStarter(pe, course.id), lang: detectLanguage(pe.solutionCode || pe.starterCode, '', course.id) })} className="h-10 px-4 rounded-xl bg-gradient-to-b from-[#E5C88E] to-[#C49A52] text-[#2A1D08] text-[13.5px] font-bold inline-flex items-center gap-2"><Code className="w-4 h-4" /> Open in practice editor</button>
                  {pe.solutionCode && <button onClick={() => toggle('solution')} className="h-10 px-4 rounded-xl border border-white/20 text-ivory text-[13.5px] font-semibold hover:bg-white/5" aria-expanded={!!revealed.solution}>{revealed.solution ? 'Hide solution' : 'Show solution'}</button>}
                </div>
              )}
              {revealed.solution && pe.solutionCode && <div className="animate-fade-in"><CodeBlock courseId={course.id} code={pe.solutionCode} label="solution" /></div>}
            </div>
          )}
          {E?.exercises?.length > 0 && (
            <PracticeExercises exercises={E.exercises} courseId={course.id} moduleId={current.id} completedIds={practiceDone[current.id] || []} />
          )}
          {enrLoading && <SectionSkeleton lines={2} />}
          {enrFailed && <LoadError message={enr.message} onRetry={enr.retry} />}
          {nm.miniTasks.map((t, i) => (
            <div key={i} className="rounded-2xl border border-dashed border-brand-300 p-4 sm:p-5 space-y-3">
              <p className="text-xs font-bold tracking-[0.14em] text-sage flex items-center gap-2"><ClipboardList className="w-4 h-4" /> MINI TASK</p>
              {t.title && <p className="font-semibold text-brand-900">{cleanText(t.title)}</p>}
              {t.objective && <p className="text-[15px] text-slate-600">{cleanText(t.objective)}</p>}
              {t.requirements?.length > 0 && (
                <ul className="space-y-2">{t.requirements.map((r, k) => <li key={k} className="flex gap-2.5 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-mint-400 mt-0.5 shrink-0" />{cleanText(r)}</li>)}</ul>
              )}
              {t.deliverable && <p className="text-sm p-3 rounded-lg bg-peach-50 text-brand-900"><strong>Deliverable:</strong> {cleanText(t.deliverable)}</p>}
            </div>
          ))}
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
                <p className="flex-1 min-w-0 text-sm font-medium text-slate-700">{cleanText(q.question)}</p>
                <button onClick={() => toggle(key)} aria-expanded={!!revealed[key]} className="text-xs font-semibold text-peach-500 hover:text-peach-600 shrink-0">{revealed[key] ? 'Hide' : 'Answer'}</button>
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

    if (nm.practiceQuestions.length) s.push({ id: 'practice-q', title: 'Practice questions', icon: HelpCircle, body: qaList(nm.practiceQuestions, 'pq') });
    if (nm.interviewQuestions.length) s.push({ id: 'interview', title: 'Interview questions', icon: MessageSquare, body: qaList(nm.interviewQuestions, 'iq') });

    // 8. Summary and key takeaways
    const sum = nm.summary;
    if (sum.takeaways.length || sum.quickReference.length || sum.text || E?.cheatSheet?.length) s.push({
      id: 'summary', title: 'Summary & key takeaways', icon: CheckCircle2, body: (
        <div className="space-y-4">
          {sum.text && <Paragraphs text={sum.text} />}
          {sum.takeaways.length > 0 && <ul className="space-y-2">{sum.takeaways.map((t, i) => <li key={i} className="flex gap-2.5 text-[15px] text-slate-600"><CheckCircle2 className="w-4 h-4 text-peach-500 mt-1 shrink-0" /><span className="min-w-0">{cleanText(t)}</span></li>)}</ul>}
          {sum.quickReference.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2">{sum.quickReference.map((q, i) => <code key={i} className="text-[13px] p-2.5 rounded-lg bg-brand-50 text-brand-900 break-words">{cleanText(q)}</code>)}</div>
          )}
          {E?.cheatSheet?.length > 0 && (
            <div>
              <p className="text-xs font-bold tracking-[0.14em] text-sage mb-2">REMEMBER — CHEAT SHEET</p>
              <div className="grid sm:grid-cols-2 gap-2">{E.cheatSheet.map((c, i) => <code key={i} className="text-[12.5px] p-2.5 rounded-lg bg-evergreen text-[#E9F1EC] break-words whitespace-pre-wrap">{c}</code>)}</div>
            </div>
          )}
        </div>
      )
    });

    // 9. Knowledge check (new questions; the graded quiz stays separate and unchanged)
    if (E?.knowledgeCheck?.length) s.push({
      id: 'knowledge', title: 'Knowledge check', icon: ListChecks, body: <KnowledgeCheck questions={E.knowledgeCheck} courseId={course.id} moduleId={current.id} />
    });

    // 10. Further learning
    if (nm.references.length || E?.references?.length || E?.next) s.push({
      id: 'refs', title: 'Further learning', icon: ExternalLink, body: <FurtherLearning references={E?.references || []} originalReferences={nm.references} next={E?.next} />
    });
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, revealed, enr.status, enr.data, practiceDone]);

  const jumpTo = (id) => jumpToEl(`sec-${id}`);

  // Highlight the section being read (the reading pane is the scroll container).
  useEffect(() => {
    const root = mainRef.current;
    if (!root || !('IntersectionObserver' in window)) return undefined;
    const els = [...root.querySelectorAll('[data-sec]')];
    if (!els.length) return undefined;
    setActiveSec(els[0].dataset.sec);
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter(e => e.isIntersecting).sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top);
      if (seen[0]) setActiveSec(seen[0].target.dataset.sec);
    }, { root, rootMargin: '0px 0px -65% 0px', threshold: 0 });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [current?.id, sections.length]);
  // Learning-flow steps: scroll to the first section that exists for the step, then make it glow.
  const flowGo = (ids) => {
    const elId = ids.map(id => (id.startsWith('#') ? id.slice(1) : `sec-${id}`)).find(id => document.getElementById(id));
    if (!elId) return;
    setTimeout(() => {
      jumpToEl(elId);
      const el = document.getElementById(elId);
      el.classList.remove('flow-arrive'); void el.offsetWidth; el.classList.add('flow-arrive');
      setTimeout(() => el.classList.remove('flow-arrive'), 3000);
    }, 260);
  };

  if (!current) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-lg font-semibold text-brand-900">This course has no modules yet.</p>
        <button className="btn-outline" onClick={onExit}>Back to dashboard</button>
      </div>
    );
  }

  /* ---------- course path (left column / phone drawer) ---------- */
  const practiceTotal = (nm.practiceExercise ? 1 : 0) + (enr.data?.exercises?.length || 0) + nm.miniTasks.length;
  const practiceDoneCount = Math.min((practiceDone[current?.id] || []).length, enr.data?.exercises?.length || 0);
  const snippetCount = runnableCount(rm);
  const sidebar = (
    <div className="p-3 sm:p-4 space-y-4">
      <div className="rounded-[20px] bg-white border border-brand-900/[.08] p-3 shadow-[0_10px_30px_-24px_rgba(12,45,38,.5)]">
        <div className="flex items-center gap-3 px-1.5 pt-1.5 pb-3">
          <ProgressRing value={(done / total) * 100} size={46} label={`${done}/${modules.length}`} />
          <div className="min-w-0">
            <p className="font-lesson text-[21px] font-semibold text-evergreen leading-none">Course path</p>
            <p className="mt-1 text-[11.5px] text-charcoal/55">{modules.length} modules · {course.modules.reduce((n, m) => n + runnableCount(m.readingMaterial || {}), 0)} practice snippets</p>
          </div>
        </div>
        <nav className="space-y-0.5" aria-label="Modules">
          {modules.map((m, i) => {
            const active = i === currentIndex;
            return (
              <div key={m.id} className={active ? 'rounded-2xl bg-brand-50/80 ring-1 ring-brand-900/[.06] pb-2' : ''}>
                <button onClick={() => goTo(i)} className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition ${active ? '' : 'hover:bg-cream'}`} aria-current={active ? 'page' : undefined}>
                  <span className={`w-8 h-8 rounded-full text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 ${m.completed ? 'bg-forest text-ivory' : active ? 'bg-forest text-ivory ring-4 ring-[#C49A52]/25' : 'bg-cream text-charcoal/55 border border-brand-900/10'}`}>
                    {m.completed && !active ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[13.5px] leading-snug truncate ${active ? 'font-semibold text-evergreen' : 'font-medium text-charcoal/85'}`}>{moduleTitle(m.title)}</span>
                    <span className="block text-[11px] text-charcoal/45 mt-0.5">{active ? (m.completed ? 'Completed · reviewing' : 'In progress') : m.completed ? 'Completed' : `${runnableCount(m.readingMaterial || {})} snippets`}</span>
                  </span>
                </button>
                {active && sections.length > 0 && (
                  <ul className="mt-0.5 ml-[2.1rem] mr-2 space-y-0.5">
                    {sections.map((s, k) => (
                      <li key={s.id}>
                        <button onClick={() => { setDrawer(false); jumpTo(s.id); }} className={`w-full text-left text-[12.5px] px-2.5 py-1.5 rounded-lg truncate transition ${activeSec === s.id ? 'bg-white text-evergreen font-semibold shadow-sm' : 'text-charcoal/60 hover:text-evergreen'}`}>
                          {currentIndex + 1}.{k + 1} {s.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {course.projects?.length > 0 && (
        <button onClick={() => setProjectsOpen(true)} className="w-full rounded-[18px] bg-white border border-brand-900/[.08] p-4 text-left hover:border-forest/30 transition">
          <span className="flex items-center gap-2 text-[13.5px] font-semibold text-evergreen"><Briefcase className="w-4 h-4 text-[#C49A52]" />{course.projects.length} mini projects<span className={`ml-auto chip text-[10px] ${projectsDone ? 'bg-forest text-ivory' : 'bg-cream text-charcoal/70 border border-brand-900/10'}`}>{projectReq.submitted}/{projectReq.total ?? course.projects.length}</span></span>
          <span className="block text-[11.5px] text-charcoal/55 mt-1">{projectsDone ? 'Project submitted. The final assessment can be unlocked.' : 'Submit a GitHub repository for any one project to unlock the final.'}</span>
        </button>
      )}

      <div className={`rounded-[18px] p-4 border ${passedFinal ? 'border-leaf/40 bg-leaf-light' : finalReady ? 'border-[#C49A52]/50 bg-[#FBF3E3]' : 'border-brand-900/[.08] bg-white'}`}>
        <p className="flex items-center gap-2 text-[13.5px] font-semibold text-evergreen">
          {passedFinal ? <Award className="w-4 h-4 text-leaf" /> : finalReady ? <ShieldCheck className="w-4 h-4 text-[#C49A52]" /> : <Lock className="w-4 h-4 text-charcoal/40" />}
          Final assessment
        </p>
        {passedFinal ? (
          <p className="text-[11.5px] text-charcoal/55 mt-1.5">Passed with {passedFinal.percentage}%. Your certificate is ready.</p>
        ) : finalReady ? (
          <p className="text-[11.5px] text-charcoal/55 mt-1.5">25 questions · 45 minutes · proctored. Pass mark 70%.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-[11.5px]">
            <li className={`flex items-center gap-2 ${allQuizzesPassed ? 'text-evergreen' : 'text-charcoal/55'}`}>{allQuizzesPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}All module quizzes ({done}/{modules.length})</li>
            {projectReq.required > 0 && <li className={`flex items-center gap-2 ${projectsDone ? 'text-evergreen' : 'text-charcoal/55'}`}>{projectsDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}One project repository ({Math.min(projectReq.submitted, projectReq.required)}/{projectReq.required})</li>}
          </ul>
        )}
        <button onClick={passedFinal ? onViewCertificate : (allQuizzesPassed && !projectsDone ? () => setProjectsOpen(true) : openFinal)} disabled={!allQuizzesPassed && !passedFinal} className="mt-3 w-full h-10 rounded-xl bg-forest text-ivory text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-evergreen transition disabled:bg-cream disabled:text-charcoal/40 disabled:cursor-not-allowed">
          {passedFinal ? <><Award className="w-4 h-4" /> View certificate</> : finalReady ? 'Start final assessment' : allQuizzesPassed ? <><Briefcase className="w-4 h-4" /> Submit project repos</> : <><Lock className="w-4 h-4" /> Locked</>}
        </button>
      </div>
    </div>
  );

  const myScore = current.quizScore;
  const num = String(currentIndex + 1).padStart(2, '0');
  const [titleMain, titleRest] = splitTitle(moduleTitle(current.title));
  const searchHits = searchQ.trim()
    ? [
        ...sections.filter(s => s.title.toLowerCase().includes(searchQ.trim().toLowerCase())).map((s) => ({ kind: 'section', id: s.id, label: s.title, sub: `This module · ${currentIndex + 1}.${sections.indexOf(s) + 1}` })),
        ...modules.map((m, i) => ({ m, i })).filter(({ m }) => moduleTitle(m.title).toLowerCase().includes(searchQ.trim().toLowerCase())).map(({ m, i }) => ({ kind: 'module', i, label: moduleTitle(m.title), sub: `Module ${String(i + 1).padStart(2, '0')}` }))
      ].slice(0, 12)
    : [];

  return (
    <div className="lesson-page h-[100dvh] flex flex-col bg-[#F6F4EE] overflow-hidden">
      {/* Top bar */}
      <header className="h-14 sm:h-16 shrink-0 bg-[#0C3B2E] text-ivory flex items-center gap-2 sm:gap-4 px-2.5 sm:px-5 z-30 shadow-[0_6px_20px_-12px_rgba(0,0,0,.6)]">
        <button onClick={() => setDrawer(true)} className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10" aria-label="Open course path"><Menu className="w-5 h-5" /></button>
        <button onClick={onExit} className="hidden lg:flex items-center gap-2.5 shrink-0 pr-2 group" title="Back to dashboard">
          <span className="w-9 h-9 rounded-full border border-[#C49A52]/60 flex items-center justify-center text-[#E5C88E] group-hover:bg-white/5"><ArrowLeft className="w-4 h-4" /></span>
          <span className="text-left leading-tight">
            <img src="/codelekho-logo-white.svg" alt="CodeLekho" className="block h-[26px] w-auto object-contain" />
            <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#D9B776] max-w-[170px] truncate">{displayTitle(course.title)}</span>
          </span>
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="lg:hidden min-w-0">
            <span className="block text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#D9B776] truncate">{displayTitle(course.title)}</span>
            <span className="block text-[13px] font-semibold truncate">Module {currentIndex + 1} of {modules.length}</span>
          </span>
          <span className="hidden lg:block text-[12.5px] text-ivory/80 whitespace-nowrap">Module {currentIndex + 1} of {modules.length}</span>
          <span className="hidden md:block flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden max-w-[640px]"><span className="block h-full rounded-full bg-gradient-to-r from-[#C49A52] to-[#E5C88E] transition-all duration-700" style={{ width: `${course.progress || 0}%` }} /></span>
          <span className="hidden md:block text-[12.5px] font-semibold text-ivory/90">{course.progress || 0}%</span>
        </div>
        <button onClick={() => setSearchOpen(true)} className="h-9 w-9 sm:w-auto sm:px-3.5 rounded-xl border border-white/15 bg-white/[.06] hover:bg-white/10 flex items-center justify-center gap-2 text-[13px] font-medium" aria-label="Search lessons"><Search className="w-4 h-4" /><span className="hidden xl:inline">Search lessons</span></button>
        <button onClick={() => playground?.open()} className="h-9 w-9 sm:w-auto sm:px-3 rounded-xl border border-white/15 bg-white/[.06] hover:bg-white/10 flex items-center justify-center gap-2 text-[13px] font-medium" title="Open the Practice Lab" aria-label="Open the Practice Lab"><FlaskConical className="w-4 h-4" /><span className="hidden 2xl:inline">Practice Lab</span></button>
        <button onClick={downloadPdf} disabled={pdfBusy} className="hidden sm:flex h-9 px-3 rounded-xl border border-white/15 bg-white/[.06] hover:bg-white/10 items-center justify-center gap-2 text-[13px] font-medium" title="Download course PDF" aria-label="Download course PDF">
          {pdfBusy ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" />}
          <span className="hidden 2xl:inline">{pdfBusy ? 'Preparing…' : 'Course PDF'}</span>
        </button>
        {passedFinal ? (
          <button onClick={onViewCertificate} className="h-9 px-3 rounded-xl bg-gradient-to-b from-[#E5C88E] to-[#C49A52] text-[#2A1D08] flex items-center gap-2 text-[13px] font-bold"><Award className="w-4 h-4" /><span className="hidden sm:inline">Certificate</span></button>
        ) : (
          <button onClick={openFinal} className={`h-9 px-3 rounded-xl flex items-center gap-2 text-[13px] font-semibold ${finalReady ? 'bg-gradient-to-b from-[#E5C88E] to-[#C49A52] text-[#2A1D08]' : 'border border-white/15 text-ivory/60'}`} title={finalReady ? 'Start final assessment' : 'Complete all module quizzes and submit a GitHub repo for any one project to unlock'}>
            {finalReady ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}<span className="hidden md:inline">Final</span>
          </button>
        )}
      </header>
      {/* phones: thin progress line under the bar */}
      <div className="md:hidden h-[3px] bg-[#0C3B2E]"><div className="h-full bg-gradient-to-r from-[#C49A52] to-[#E5C88E]" style={{ width: `${course.progress || 0}%` }} /></div>

      <div className="flex-1 flex min-h-0">
        {/* Desktop course path */}
        <aside className="hidden lg:block w-[300px] xl:w-[316px] shrink-0 overflow-y-auto thin-scroll overscroll-contain">{sidebar}</aside>

        {/* Phone / tablet drawer */}
        {drawer && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-evergreen/50 animate-fade-in" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-[88%] max-w-sm bg-[#F6F4EE] overflow-y-auto overscroll-contain animate-slide-in-left shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-[#0C3B2E] text-ivory">
                <button onClick={onExit} className="flex items-center gap-2 text-[13px] font-semibold"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
                <button onClick={() => setDrawer(false)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10" aria-label="Close"><X className="w-5 h-5" /></button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        {/* Reading pane: the only scroll container for module content */}
        <main ref={mainRef} onScroll={onMainScroll} className="flex-1 min-w-0 overflow-y-auto overscroll-contain relative" style={{ scrollbarGutter: 'stable' }}>
          <div className="sticky top-0 z-10 h-[3px] bg-transparent"><div ref={readBarRef} className="h-full bg-[#C49A52] transition-[width] duration-150" style={{ width: '0%' }} /></div>

          <div className="max-w-[1180px] mx-auto px-4 sm:px-8 lg:px-6 xl:px-8 pt-5 sm:pt-7 pb-12 xl:grid xl:grid-cols-[minmax(0,1fr)_224px] xl:gap-8">
            <article key={current.id} className="min-w-0 max-w-[700px] animate-fade-up">
              {/* breadcrumb + module header */}
              <nav className="text-[12.5px] text-charcoal/55" aria-label="Breadcrumb">
                <button onClick={onExit} className="hover:text-evergreen">{displayTitle(course.title)}</button>
                <span className="mx-2 text-charcoal/30">/</span>
                <span className="font-semibold text-evergreen">Module {num}</span>
              </nav>
              <div className="mt-4 sm:mt-6 flex items-end gap-3 sm:gap-4">
                <span className="font-lesson text-[64px] sm:text-[96px] leading-[.78] font-semibold text-[#C49A52] [font-variant-numeric:oldstyle-nums]">{num}</span>
                <p className="pb-2 sm:pb-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#A8823F] leading-relaxed">Module {numberWord(currentIndex + 1)} · {displayTitle(course.title)}</p>
              </div>
              <h1 className="mt-3 sm:mt-4 font-lesson text-[32px] sm:text-[46px] font-semibold leading-[1.05] text-evergreen">
                {titleMain}
                {titleRest && <span className="block italic font-medium text-forest/90">{titleRest}</span>}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="lesson-chip"><Clock className="w-3.5 h-3.5" />{readingMinutes(rm)} min read</span>
                <span className="lesson-chip"><Code className="w-3.5 h-3.5" />{snippetCount} code snippets</span>
                {practiceTotal > 0 && <span className="lesson-chip lesson-chip-gold"><Star className="w-3.5 h-3.5" />{practiceTotal} practice task{practiceTotal === 1 ? '' : 's'}</span>}
                <span className={`lesson-chip ${current.completed ? 'lesson-chip-done' : ''}`}>{current.completed ? <><CheckCircle2 className="w-3.5 h-3.5" /> Quiz done{myScore !== undefined ? ` · ${myScore}%` : ''}</> : <><ListChecks className="w-3.5 h-3.5" /> Quiz pending</>}</span>
              </div>
              {current.description && <p className="mt-5 sm:mt-6 font-lesson text-[19px] sm:text-[22px] leading-[1.5] text-charcoal/85">{cleanText(current.description)}</p>}

              {/* below xl: the "on this page" list as a scrollable row */}
              {sections.length > 2 && (
                <div className="xl:hidden mt-6 flex gap-2 overflow-x-auto no-scrollbar snap-x scroll-px-4 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                  {sections.map((s, i) => (
                    <button key={s.id} onClick={() => jumpTo(s.id)} className={`snap-start shrink-0 h-8 px-3 rounded-full border text-[12.5px] font-medium transition ${activeSec === s.id ? 'bg-forest text-ivory border-forest' : 'bg-white text-charcoal/70 border-brand-900/10'}`}>
                      <span className={activeSec === s.id ? 'text-[#E5C88E]' : 'text-[#A8823F]'}>{currentIndex + 1}.{i + 1}</span> {s.title}
                    </button>
                  ))}
                </div>
              )}

              {sections.map((s, i) => (
                <section key={s.id} id={`sec-${s.id}`} data-sec={s.id} className="scroll-mt-4 mt-10 sm:mt-14">
                  <h2 className="flex items-baseline gap-2.5 font-lesson text-[26px] sm:text-[32px] font-semibold leading-tight text-evergreen">
                    <span className="font-mono text-[12px] sm:text-[13px] font-semibold text-[#A8823F] translate-y-[-3px]">{currentIndex + 1}.{i + 1}</span>
                    <span className="min-w-0">{s.title}</span>
                  </h2>
                  <div className="lesson-body mt-4 space-y-3">{s.body}</div>
                </section>
              ))}

              {/* quiz */}
              <section id="quiz-cta" className="mt-12 rounded-[22px] bg-white border border-brand-900/[.08] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 shadow-[0_18px_40px_-30px_rgba(12,45,38,.5)]">
                <span className="w-12 h-12 rounded-2xl bg-forest text-[#E5C88E] flex items-center justify-center shrink-0"><ListChecks className="w-6 h-6" /></span>
                <div className="flex-1">
                  <p className="font-lesson text-[22px] font-semibold text-evergreen leading-tight">Module {num} quiz</p>
                  <p className="text-[13.5px] text-charcoal/60">5 questions · unlimited retakes. Finishing it marks this module complete.</p>
                </div>
                <button onClick={() => setQuizOpen(true)} className={`h-11 px-5 rounded-xl text-[14px] font-semibold ${current.completed ? 'border border-forest/30 text-forest hover:bg-cream' : 'bg-forest text-ivory hover:bg-evergreen'}`}>
                  {current.completed ? 'Retake quiz' : 'Take quiz'}
                </button>
              </section>

              {/* previous / next */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                {currentIndex > 0 ? (
                  <button onClick={() => goTo(currentIndex - 1)} className="min-w-0 rounded-[18px] bg-white border border-brand-900/[.08] p-3.5 sm:p-4 text-left hover:border-forest/30 transition">
                    <span className="flex items-center gap-1 text-[11.5px] text-charcoal/55"><ArrowLeft className="w-3 h-3" /> Previous</span>
                    <span className="mt-1 block font-lesson text-[17px] sm:text-[19px] font-semibold text-evergreen truncate">{String(currentIndex).padStart(2, '0')} · {moduleTitle(modules[currentIndex - 1].title)}</span>
                  </button>
                ) : <span />}
                {currentIndex < modules.length - 1 ? (
                  <button onClick={() => goTo(currentIndex + 1)} className="min-w-0 rounded-[18px] bg-forest text-ivory p-3.5 sm:p-4 text-right hover:bg-evergreen transition">
                    <span className="flex items-center justify-end gap-1 text-[11.5px] text-ivory/70">Next <ChevronRight className="w-3 h-3" /></span>
                    <span className="mt-1 block font-lesson text-[17px] sm:text-[19px] font-semibold truncate">{String(currentIndex + 2).padStart(2, '0')} · {moduleTitle(modules[currentIndex + 1].title)}</span>
                  </button>
                ) : (
                  <button onClick={passedFinal ? onViewCertificate : openFinal} className="min-w-0 rounded-[18px] bg-forest text-ivory p-3.5 sm:p-4 text-right hover:bg-evergreen transition">
                    <span className="flex items-center justify-end gap-1 text-[11.5px] text-ivory/70">Finish <ChevronRight className="w-3 h-3" /></span>
                    <span className="mt-1 block font-lesson text-[17px] sm:text-[19px] font-semibold truncate">{passedFinal ? 'View certificate' : 'Final assessment'}</span>
                  </button>
                )}
              </div>
            </article>

            {/* right rail (wide screens) */}
            <aside className="hidden xl:block">
              <div className="sticky top-6 space-y-4">
                {sections.length > 0 && (
                  <nav className="rounded-[20px] bg-white border border-brand-900/[.08] p-4" aria-label="On this page">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-charcoal/55 mb-2.5">On this page</p>
                    <ul className="border-l border-brand-900/10">
                      {sections.map(s => (
                        <li key={s.id}>
                          <button onClick={() => jumpTo(s.id)} className={`-ml-px w-full text-left pl-3 py-1.5 text-[12.5px] border-l-2 transition ${activeSec === s.id ? 'border-[#C49A52] text-evergreen font-semibold' : 'border-transparent text-charcoal/60 hover:text-evergreen'}`}>{s.title}</button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
                <div className="rounded-[20px] bg-brand-50/80 border border-brand-900/[.06] p-4">
                  <p className="font-lesson text-[19px] font-semibold text-evergreen leading-tight">{practiceTotal ? 'Practice in this module' : 'Snippets in this module'}</p>
                  {practiceTotal > 0 ? (
                    <>
                      <div className="mt-3 flex gap-1.5">
                        {Array.from({ length: Math.min(practiceTotal, 8) }).map((_, k) => <span key={k} className={`h-1.5 flex-1 rounded-full ${k < practiceDoneCount ? 'bg-forest' : k === practiceDoneCount ? 'bg-[#C49A52]' : 'bg-white'}`} />)}
                      </div>
                      <p className="mt-2 text-[11.5px] text-charcoal/60">{practiceDoneCount} of {practiceTotal} done{practiceDoneCount ? ' · keep going!' : ''}</p>
                    </>
                  ) : <p className="mt-2 text-[11.5px] text-charcoal/60">{snippetCount} runnable snippets. Press Run on any of them.</p>}
                </div>
                <button onClick={() => (current.completed ? null : setQuizOpen(true))} className={`w-full h-11 rounded-xl text-[13.5px] font-semibold inline-flex items-center justify-center gap-2 transition ${current.completed ? 'bg-forest text-ivory cursor-default' : 'border border-forest/40 text-forest bg-white hover:bg-cream'}`}>
                  <Check className="w-4 h-4" />{current.completed ? 'Module complete' : 'Mark module complete'}
                </button>
                {!current.completed && <p className="-mt-2 text-center text-[11px] text-charcoal/45">Pass the 5-question quiz to complete it</p>}
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* lesson search */}
      {searchOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24" role="dialog" aria-modal="true" aria-label="Search lessons">
          <div className="absolute inset-0 bg-evergreen/50 backdrop-blur-sm animate-fade-in" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center gap-2 px-4 border-b border-brand-900/10">
              <Search className="w-4 h-4 text-charcoal/40" />
              <input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)} placeholder="Search modules and sections" className="flex-1 h-12 text-[16px] outline-none bg-transparent" />
              <button onClick={() => setSearchOpen(false)} className="p-1.5 rounded-lg text-charcoal/50 hover:bg-cream" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto thin-scroll p-2">
              {!searchQ.trim() && <li className="px-3 py-6 text-center text-[13px] text-charcoal/45">Type to find a module or a section.</li>}
              {searchQ.trim() && !searchHits.length && <li className="px-3 py-6 text-center text-[13px] text-charcoal/45">Nothing matches “{searchQ}”.</li>}
              {searchHits.map((h, k) => (
                <li key={k}>
                  <button onClick={() => { setSearchOpen(false); setSearchQ(''); if (h.kind === 'section') jumpTo(h.id); else goTo(h.i); }} className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-cream flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-brand-50 text-forest flex items-center justify-center shrink-0">{h.kind === 'section' ? <BookOpen className="w-4 h-4" /> : <Layers className="w-4 h-4" />}</span>
                    <span className="min-w-0"><span className="block text-[14px] font-medium text-evergreen truncate">{h.label}</span><span className="block text-[11.5px] text-charcoal/50">{h.sub}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
        locked={!finalReady}
        projectReq={projectReq}
        passedFinal={passedFinal}
        onSubmitted={() => onProgressChanged()}
        onViewCertificate={() => { setFinalOpen(false); onViewCertificate(); }}
        onCourseLocked={onCourseLocked}
        onUnlockAgain={onUnlockAgain}
        retakePrice={retakePrice}
      />

      <PdfBuildOverlay open={pdfBusy} progress={pdfProgress} done={pdfDone} courseTitle={displayTitle(course.title)} />

      <CourseProjectsModal
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        course={course}
        onSubmitted={() => onProgressChanged()}
        quizProgress={{ done, total: modules.length }}
        passedFinal={!!passedFinal}
        onStartFinal={async () => { setProjectsOpen(false); await onProgressChanged(); setFinalOpen(true); }}
      />
    </div>
  );
}
