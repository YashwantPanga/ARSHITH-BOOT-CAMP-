// Grammar and spacing corrections for module text, applied when courses and practice content are
// served (like the lesson overlay), so every database gets them on deploy without a data migration.
//
// Only prose is changed. Code, answer keys and quiz options are never touched: the server marks a
// quiz by comparing the chosen option with the stored answer, so option text must stay exactly as stored.
import FIXES, { SPELLING } from '../data/lessons/text-fixes.js';

// keys whose values are code, data or answers (left exactly as stored)
const SKIP = new Set([
  'code', 'solutionCode', 'starterCode', 'syntax', 'wrongCode', 'fixCode', 'example', 'snippet', 'sql', 'query',
  'options', 'correctAnswer', 'answer', 'check', 'accept', 'expected', 'expectedOutput', 'tests', 'setup', 'schema', 'seed',
  'result', 'output', 'rows', 'columns', 'values', 'input', 'stdin', 'quickReference', 'cheatSheet', 'diagram', 'mermaid',
  'id', 'moduleId', 'courseId', 'language', 'checkType', 'checkLanguage', 'url', 'link', 'thumbnail', 'introVideoUrl',
  'iconBg', 'iconType', 'slug', 'status', 'line', 'hidden'
]);

// a plain word with optional surrounding punctuation (no digits, dots, underscores or inner brackets)
const WORD = /^[(“"']?[A-Za-z][A-Za-z'’]+[)”"',.:;!?]*$/;

// [wrong, right] pairs, longest first so a longer phrase wins over a shorter one inside it
const PAIRS = Object.entries(FIXES).sort((a, b) => b[0].length - a[0].length);

// exercise and question text can quote exact program output ("Longest: practising"), so it only gets
// the exact phrase fixes, never the automatic spelling and dash rules
const EXACT_ONLY = new Set(['problem', 'challenge', 'question', 'questionText', 'prompt']);

/** One prose string with the corrections applied. */
export function polishText(s, key = '') {
  if (typeof s !== 'string' || !s) return s;
  let t = s;
  for (const [wrong, right] of PAIRS) if (t.includes(wrong)) t = t.split(wrong).join(right);
  if (EXACT_ONLY.has(key)) return t;
  // "Module 02  -  Variables" → "Module 02 – Variables" (a spaced hyphen used as a dash, with doubled spaces)
  t = t.replace(/(\S) {2,}- {2,}(\S)/g, '$1 – $2');
  // "people - including you" → "people – including you": a spaced hyphen between two plain words is a
  // dash. Math and code ("n - 1", "MAX(score) - MIN(score)", "a.rating - b.rating") are left alone.
  // A bracket right after it ("+ (add), - (subtract)") means it is an operator, not a dash.
  t = t.replace(/(\S+) - (?=(\S+))/g, (all, left, right) => (WORD.test(left) && WORD.test(right) && !right.startsWith('(') ? `${left} – ` : all));
  for (const [rx, to] of SPELLING) t = t.replace(rx, to);
  return t;
}

/** A deep copy with every prose string polished (code and answer fields untouched). */
export function polishDeep(v, key = '') {
  if (SKIP.has(key)) return v;
  if (typeof v === 'string') return polishText(v, key);
  if (Array.isArray(v)) return v.map((x) => polishDeep(x, key));
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = polishDeep(x, k);
    return out;
  }
  return v;
}

/** A course with its modules' text polished (title, description and reading material, quizzes). */
export function polishCourse(course) {
  if (!course?.modules) return course;
  return { ...course, modules: course.modules.map((m) => polishDeep(m)) };
}
