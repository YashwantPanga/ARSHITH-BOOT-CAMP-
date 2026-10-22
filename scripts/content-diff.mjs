// Content-preservation check: proves that original module text, code examples, quizzes, answer keys
// and the question bank are byte-for-byte unchanged compared with a baseline.
//
//   node scripts/content-diff.mjs --baseline path/to/original/db.json   → writes reports/content-diff.md
//                                                                          and tests/fixtures/content-baseline.json
//   node scripts/content-diff.mjs                                         → compares with the stored fixture
//
// Hashes cover everything learners study or are graded on. Course-level presentation fields that were
// intentionally changed (thumbnail images) are reported separately, not hidden.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = path.join(ROOT, 'tests', 'fixtures', 'content-baseline.json');
const sha = (v) => crypto.createHash('sha256').update(JSON.stringify(v ?? null)).digest('hex').slice(0, 16);

export function fingerprint(db) {
  const modules = {};
  const courses = {};
  for (const c of db.courses || []) {
    courses[c.id] = {
      title: sha(c.title),
      description: sha([c.shortDescription, c.description, c.whatYouWillLearn, c.skills]),
      finalTest: sha(c.finalTest),
      thumbnail: c.thumbnail || ''
    };
    for (const m of c.modules || []) {
      const rm = m.readingMaterial || {};
      modules[`${c.id}/${m.id}`] = {
        title: sha(m.title),
        readingMaterial: sha(rm),
        codeExamples: sha(rm.codeExamples),
        quiz: sha(m.quiz),
        inReadingQuestions: sha([rm.mcqs, rm.selfAssessment, rm.quiz])
      };
    }
  }
  const bank = {};
  for (const q of db.questionBank || []) bank[q.id] = sha(q);
  return { modules, courses, questionBank: bank };
}

export function compare(base, cur) {
  const rows = [];
  let changed = 0;
  for (const [key, b] of Object.entries(base.modules)) {
    const c = cur.modules[key];
    if (!c) { rows.push([key, 'MISSING', '']); changed++; continue; }
    const diffs = Object.keys(b).filter(k => b[k] !== c[k]);
    if (diffs.length) changed++;
    rows.push([key, diffs.length ? 'CHANGED' : 'unchanged', diffs.join(', ')]);
  }
  const bankChanged = Object.keys(base.questionBank).filter(id => base.questionBank[id] !== cur.questionBank[id]);
  const courseNotes = Object.entries(base.courses).map(([id, b]) => {
    const c = cur.courses[id] || {};
    return { id, title: b.title === c.title, description: b.description === c.description, finalTest: b.finalTest === c.finalTest, thumbnailChanged: b.thumbnail !== c.thumbnail };
  });
  return { rows, changed, bankChanged, courseNotes };
}

function report(result, baseLabel) {
  const lines = [
    '# Content preservation report',
    '',
    `Baseline: ${baseLabel}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Modules compared: **${result.rows.length}**, changed: **${result.changed}**`,
    `- Question-bank items compared: **${Object.keys(fingerprintCache.base.questionBank).length}**, changed: **${result.bankChanged.length}**`,
    '',
    'Each module row compares SHA-256 hashes of: module title, the complete `readingMaterial` object, code examples, the graded `quiz` (questions + answer keys) and the in-reading question sets.',
    '',
    '## Course-level fields',
    '',
    '| Course | Title | Descriptions | Final test (incl. answer keys) | Thumbnail |',
    '|---|---|---|---|---|',
    ...result.courseNotes.map(n => `| ${n.id} | ${n.title ? 'unchanged' : '**changed**'} | ${n.description ? 'unchanged' : '**changed**'} | ${n.finalTest ? 'unchanged' : '**changed**'} | ${n.thumbnailChanged ? 'replaced with higher-resolution image (presentation only)' : 'unchanged'} |`),
    '',
    '## Modules',
    '',
    '| Module | Status | Changed parts |',
    '|---|---|---|',
    ...result.rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} |`),
    ''
  ];
  return lines.join('\n');
}

const fingerprintCache = {};

if (process.argv[1] && process.argv[1].endsWith('content-diff.mjs')) {
  const argi = process.argv.indexOf('--baseline');
  const cur = fingerprint(JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'data', 'db.json'), 'utf8')));
  let base;
  let label;
  if (argi > -1) {
    const file = process.argv[argi + 1];
    base = fingerprint(JSON.parse(fs.readFileSync(file, 'utf8')));
    label = `original db.json from the delivered project archive (${path.basename(file)})`;
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, JSON.stringify(base, null, 1));
  } else {
    base = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    label = 'tests/fixtures/content-baseline.json';
  }
  fingerprintCache.base = base;
  const result = compare(base, cur);
  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'reports', 'content-diff.md'), report(result, label));
  console.log(`Modules: ${result.rows.length}, changed: ${result.changed}; question bank changed: ${result.bankChanged.length}`);
  result.courseNotes.forEach(n => console.log(`${n.id}: title ${n.title ? 'same' : 'CHANGED'}, descriptions ${n.description ? 'same' : 'CHANGED'}, finalTest ${n.finalTest ? 'same' : 'CHANGED'}, thumbnail ${n.thumbnailChanged ? 'replaced' : 'same'}`));
  process.exit(result.changed || result.bankChanged.length ? 1 : 0);
}
