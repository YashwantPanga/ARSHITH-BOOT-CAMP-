// Checks the Interview Prep answers: every DSA solution must pass all of its tests in real Python,
// every JavaScript solution all of its tests in Node, the empty starters must not, and every SQL
// solution must run on the practice database.
//   node scripts/verify-interview.mjs          (python on PATH, or set PYTHON=...)
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { findInterviewSet } from '../shared/interview/index.js';
import { buildPythonCheck, parsePythonCheck, pythonStarter } from '../shared/interview/pyHarness.js';
import { INTERVIEW_SQL_SCHEMA } from '../shared/interview/sqlSchema.js';
import { buildJsCheck, jsStarter } from '../shared/interview/jsHarness.js';

const require = createRequire(import.meta.url);
const PY = process.env.PYTHON || 'python';
let failures = 0;
const fail = (msg) => { failures++; console.log('  FAIL', msg); };

function runPy(src) {
  const r = spawnSync(PY, ['-'], { input: src, encoding: 'utf8', timeout: 20000 });
  return parsePythonCheck((r.stdout || '') + (r.stderr ? `\n${r.stderr}` : ''));
}

console.log('DSA Top 75');
for (const p of findInterviewSet('dsa-75').items) {
  const { result, printed } = runPy(buildPythonCheck(p, p.solution));
  if (!result?.results) { fail(`${p.id} ${p.title}: no result ${printed.slice(-300)}`); continue; }
  result.results.forEach((r, i) => { if (!r.ok) fail(`${p.id} ${p.title}: test ${i + 1} got ${JSON.stringify(r.got ?? r.error)} expected ${JSON.stringify(p.tests[i][1])}`); });
  const starter = runPy(buildPythonCheck(p, pythonStarter(p)));
  if (starter.result?.results?.every(r => r.ok)) fail(`${p.id}: the empty starter passes every test`);
}

function runJs(src) {
  const r = spawnSync(process.execPath, ['-'], { input: src, encoding: 'utf8', timeout: 60000 });
  return parsePythonCheck((r.stdout || '') + (r.stderr ? `\n${r.stderr}` : ''));
}

console.log('JavaScript 30-Day Sprint');
for (const p of findInterviewSet('js-30').items) {
  const { result, printed } = runJs(buildJsCheck(p, p.solution));
  if (!result?.results) { fail(`${p.id} ${p.title}: no result ${printed.slice(-300)}`); continue; }
  result.results.forEach((r, i) => { if (!r.ok) fail(`${p.id} ${p.title}: test ${i + 1} got ${JSON.stringify(r.got ?? r.error)} expected ${JSON.stringify(p.tests[i].expected)}`); });
  const starter = runJs(buildJsCheck(p, jsStarter(p)));
  if (starter.result?.results?.every(r => r.ok)) fail(`${p.id}: the empty starter passes every test`);
}

console.log('SQL Interview 50');
const SQL = await require('sql.js')();
for (const p of findInterviewSet('sql-50').items) {
  const db = new SQL.Database();
  db.exec(INTERVIEW_SQL_SCHEMA);
  try {
    const res = db.exec(p.solution);
    const rows = res.at(-1)?.values || [];
    if (!rows.length) fail(`${p.id} ${p.title}: no rows`);
    if (process.argv.includes('--show')) console.log(`  ${p.id}`, JSON.stringify(rows));
  } catch (e) {
    fail(`${p.id} ${p.title}: ${e.message}`);
  }
  db.close();
}

console.log(failures ? `\n${failures} problem(s)` : '\nAll interview answers verified.');
process.exit(failures ? 1 : 0);
