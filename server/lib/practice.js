// Enrichment content (diagrams, case studies, practice exercises, knowledge checks, references)
// lives in server/data/enrichment/*.js — separate from db.json, so the original module content,
// quiz questions and answer keys are never rewritten. This module loads it, strips answers for the
// public API, and grades practice submissions on the server.

import ENRICHMENT from '../data/enrichment/index.js';

export function getModuleEnrichment(courseId, moduleId) {
  return ENRICHMENT[courseId]?.[moduleId] || null;
}

export function allEnrichment() {
  return ENRICHMENT;
}

const EXERCISE_PRIVATE = ['check', 'solution', 'solutionCode', 'explanation', 'mistakes'];

/** Public copy: everything a learner needs to attempt the work, but no answers or solutions. */
export function toPublicEnrichment(e) {
  if (!e) return null;
  return {
    ...e,
    exercises: (e.exercises || []).map((ex) => {
      const out = { ...ex };
      for (const k of EXERCISE_PRIVATE) delete out[k];
      out.checkType = ex.check?.type || 'none';
      if (ex.check?.type === 'rows' || ex.check?.type === 'output') out.checkLanguage = ex.language;
      return out;
    }),
    knowledgeCheck: (e.knowledgeCheck || []).map(({ answer, explanation, ...q }) => q)
  };
}

/* ------------------------------------------------------------------ */
/* Grading                                                             */
/* ------------------------------------------------------------------ */
export const normText = (s) => String(s ?? '')
  .toLowerCase()
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, ' ')
  .replace(/^[\s"'`]+|[\s"'`.!;]+$/g, '')
  .trim();

const normOutput = (s) => String(s ?? '')
  .replace(/\r\n/g, '\n')
  .split('\n')
  .map((l) => l.replace(/\s+$/, ''))
  .join('\n')
  .trim();

const cell = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))) {
    return String(Math.round(Number(v) * 1e6) / 1e6);
  }
  return String(v).trim();
};
const rowKey = (r) => (Array.isArray(r) ? r : Object.values(r || {})).map(cell).join('␟');

/** Grades one exercise. Returns { correct, feedback }. Never throws on malformed input. */
export function gradeExercise(ex, submission = {}) {
  const check = ex?.check;
  if (!check) return { correct: false, feedback: 'This exercise has no automatic check. Compare your work with the solution.' };

  switch (check.type) {
    case 'mcq': {
      const picked = Number(submission.answer);
      if (!Number.isInteger(picked)) return { correct: false, feedback: 'Choose one option first.' };
      return { correct: picked === check.answer, feedback: picked === check.answer ? 'Correct.' : 'Not quite — review the explanation below.' };
    }
    case 'numeric': {
      const raw = String(submission.answer ?? '').replace(/[,%\s]/g, '');
      const n = Number(raw);
      if (raw === '' || Number.isNaN(n)) return { correct: false, feedback: 'Enter a number.' };
      const tol = check.tolerance ?? 0.01;
      const ok = Math.abs(n - check.answer) <= tol;
      return { correct: ok, feedback: ok ? 'Correct.' : `Not quite. Your answer was ${n}.` };
    }
    case 'text': {
      const a = normText(submission.answer);
      if (!a) return { correct: false, feedback: 'Type an answer first.' };
      const accepted = (check.accept || []).map(normText);
      const okExact = accepted.includes(a);
      const okKeywords = (check.keywords || []).length > 0 && check.keywords.every((k) => a.includes(normText(k)));
      const ok = okExact || okKeywords;
      return { correct: ok, feedback: ok ? 'Correct.' : 'Not quite — compare your answer with the explanation.' };
    }
    case 'output': {
      const out = normOutput(submission.output);
      if (!out) return { correct: false, feedback: 'Run your code first — the checker compares its printed output.' };
      const ok = out === normOutput(check.expectedOutput);
      return { correct: ok, feedback: ok ? 'Output matches the expected result.' : 'Your program ran, but its output does not match the expected output yet.' };
    }
    case 'rows': {
      const rows = Array.isArray(submission.rows) ? submission.rows : null;
      if (!rows) return { correct: false, feedback: 'Run your query first — the checker compares the rows it returns.' };
      const want = check.rows.map(rowKey);
      const got = rows.map(rowKey);
      const ok = got.length === want.length && (check.ordered
        ? got.every((k, i) => k === want[i])
        : [...got].sort().every((k, i) => k === [...want].sort()[i]));
      return {
        correct: ok,
        feedback: ok ? 'Your query returns exactly the expected rows.' : `Your query returned ${got.length} row(s); the expected result has ${want.length}. Check filters, grouping${check.ordered ? ' and ordering' : ''}.`
      };
    }
    default:
      return { correct: false, feedback: 'Unknown exercise type.' };
  }
}

export function gradeKnowledge(q, answer) {
  const picked = Number(answer);
  if (!Number.isInteger(picked)) return { correct: false, feedback: 'Choose one option first.' };
  return { correct: picked === q.answer, feedback: picked === q.answer ? 'Correct.' : 'Not quite.' };
}
