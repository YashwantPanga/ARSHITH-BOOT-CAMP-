/**
 * One-time data migration: re-orders MCQ options so that the correct answer
 * is spread evenly across A/B/C/D instead of almost always being "B".
 *
 * The permutation is deterministic (hash of question id + text), so the same
 * question always lands on the same order — duplicates of a question stored in
 * several places (paper A + finalTest.questions, quiz + selfAssessment) stay in sync.
 *
 * Usage:  node scripts/rebalance-answers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = seed || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

let touched = 0;
const targetCounts = {};

function rebalance(q) {
  if (!q || !Array.isArray(q.options) || q.options.length < 2) return;
  if (typeof q.correctAnswer !== 'number') return;
  const n = q.options.length;
  const correct = q.correctAnswer;
  if (correct < 0 || correct >= n) return;

  const key = `${q.id ?? ''}|${q.questionText ?? q.question ?? ''}`;
  const rand = rng(hash(key));
  const target = hash(key + '#slot') % n;

  // Shuffle the wrong options, then place the correct one at `target`.
  const wrong = q.options.filter((_, i) => i !== correct);
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  const next = [...wrong];
  next.splice(target, 0, q.options[correct]);
  q.options = next;
  q.correctAnswer = target;
  targetCounts[target] = (targetCounts[target] || 0) + 1;
  touched++;
}

function walk(node) {
  if (Array.isArray(node)) { node.forEach(walk); return; }
  if (node && typeof node === 'object') {
    if (Array.isArray(node.options) && typeof node.correctAnswer === 'number') rebalance(node);
    for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v);
  }
}

// ---------- server/data/db.json ----------
const dbPath = path.join(root, 'server', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
if (db.meta?.answersRebalanced) {
  console.log('Already rebalanced – nothing to do.');
  process.exit(0);
}
walk(db.courses);
walk(db.questionBank);
// Old attempts reference the old option order; clear them so analytics stay truthful.
db.quizAttempts = [];
db.finalTestAttempts = [];
db.finalTestActiveSessions = {};
for (const c of db.courses) {
  c.progress = 0;
  for (const m of c.modules || []) m.completed = false;
}
db.meta = { ...(db.meta || {}), answersRebalanced: true };
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('db.json rebalanced:', touched, 'questions', targetCounts);

// ---------- src/data/coursesData.js (offline fallback copy) ----------
touched = 0;
for (const k of Object.keys(targetCounts)) delete targetCounts[k];
const cdPath = path.join(root, 'src', 'data', 'coursesData.js');
const mod = await import(pathToFileURL(cdPath).href + '?t=' + Date.now());
const courses = JSON.parse(JSON.stringify(mod.INITIAL_COURSES));
walk(courses);
for (const c of courses) {
  c.progress = 0;
  for (const m of c.modules || []) m.completed = false;
}
fs.writeFileSync(
  cdPath,
  `// Offline fallback copy of the course catalogue (used only when the API is unreachable).\nexport const INITIAL_COURSES = ${JSON.stringify(courses, null, 2)};\n`
);
console.log('coursesData.js rebalanced:', touched, 'questions', targetCounts);
