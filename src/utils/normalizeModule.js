// Normalises the reading material of a module into one shape the reader can render.
//
// Root cause of the empty "Architecture & workflow" panels and heading-only "Practice exercise"
// sections: modules 07–15 of the AI course store their content in a different shape from the rest
// of the catalogue, and the reader only understood the first shape:
//   - diagram is a plain ASCII string instead of { title, ascii, explanation }
//   - practiceExercise uses { question, starterCode, solution } instead of { title, problem, solutionCode }
//   - concepts live in a Markdown string `theory` (not `sections`), steps in `tutorial` (not `tutorials`),
//     tasks in `miniTasks` (array) and the summary is an array or a string instead of { takeaways }.
// This adapter maps every known variant onto one contract without modifying the stored data.
//
// Intentionally NOT rendered: `mcqs`, `selfAssessment.questions` and AI `quiz` arrays. Every one of
// those questions is identical to a graded module-quiz question (verified by scripts/validate-content.mjs),
// so showing them with answers in the reader would leak the graded quiz.

import { hasAsciiDiagram } from '../../shared/contentSchema.js';

const str = (v) => (typeof v === 'string' ? v : '');
const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;

export function normalizeDiagram(d) {
  if (!d) return null;
  if (typeof d === 'string') return hasAsciiDiagram(d) ? { title: '', ascii: d.replace(/^\n+|\s+$/g, ''), explanation: '' } : null;
  if (typeof d === 'object') {
    const ascii = str(d.ascii || d.diagram || d.content);
    if (!hasAsciiDiagram(ascii)) return null;
    return { title: str(d.title), ascii: ascii.replace(/^\n+|\s+$/g, ''), explanation: str(d.explanation) };
  }
  return null;
}

export function normalizePracticeExercise(pe) {
  if (!pe || typeof pe !== 'object') return null;
  const problem = str(pe.problem || pe.question || pe.description || pe.task);
  const solutionCode = str(pe.solutionCode || pe.solution);
  const starterCode = str(pe.starterCode);
  if (!problem && !solutionCode && !starterCode) return null;
  return { title: str(pe.title) || 'Practice exercise', problem, starterCode, solutionCode };
}

export function normalizeSummary(rm) {
  const s = rm.summary;
  let takeaways = [];
  let quickReference = [];
  let text = '';
  if (Array.isArray(s)) takeaways = s.filter(isNonEmptyStr);
  else if (typeof s === 'string') text = s;
  else if (s && typeof s === 'object') {
    takeaways = (s.takeaways || []).filter(isNonEmptyStr);
    quickReference = (s.quickReference || []).filter(isNonEmptyStr);
  }
  const keyTakeaways = (rm.keyTakeaways || []).filter(isNonEmptyStr);
  // Show both lists when they differ; avoid printing the same list twice.
  const seen = new Set(takeaways);
  const merged = [...takeaways, ...keyTakeaways.filter(t => !seen.has(t))];
  return { takeaways: merged, quickReference, text };
}

/** Returns a normalised view of a module's reading material. */
export function normalizeModule(module) {
  const rm = module?.readingMaterial || {};
  const tutorials = Array.isArray(rm.tutorials) ? rm.tutorials : [];
  const miniTasks = [
    ...(rm.miniTask ? [rm.miniTask] : []),
    ...(Array.isArray(rm.miniTasks) ? rm.miniTasks.filter(isNonEmptyStr).map((t, i) => ({ title: `Mini task ${i + 1}`, objective: t })) : [])
  ];
  return {
    introduction: str(rm.introduction),
    objectives: (rm.objectives || []).filter(isNonEmptyStr),
    terminology: Array.isArray(rm.terminology) ? rm.terminology.filter(t => t && t.term) : [],
    diagram: normalizeDiagram(rm.diagram),
    sections: Array.isArray(rm.sections) ? rm.sections : [],
    theoryMarkdown: str(rm.theory),
    tutorials,
    tutorialMarkdown: str(rm.tutorial),
    codeExamples: Array.isArray(rm.codeExamples) ? rm.codeExamples.filter(ex => ex && ex.code) : [],
    commonErrors: Array.isArray(rm.commonErrors) ? rm.commonErrors : [],
    commonMistakes: Array.isArray(rm.commonMistakes) ? rm.commonMistakes : [],
    bestPractices: Array.isArray(rm.bestPractices) ? rm.bestPractices : [],
    practiceExercise: normalizePracticeExercise(rm.practiceExercise),
    practiceQuestions: Array.isArray(rm.practiceQuestions) ? rm.practiceQuestions : [],
    interviewQuestions: Array.isArray(rm.interviewQuestions) ? rm.interviewQuestions : [],
    miniTasks,
    summary: normalizeSummary(rm),
    references: Array.isArray(rm.references) ? rm.references.filter(r => r && r.url) : []
  };
}
