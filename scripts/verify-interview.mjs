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
import { allExtraApproaches } from '../shared/interview/approaches/index.js';
import { findInterviewItem } from '../shared/interview/index.js';

const require = createRequire(import.meta.url);
const PY = process.env.PYTHON || 'python';
let failures = 0;
const fail = (msg) => { failures++; console.log('  FAIL', msg); };

function runPy(src) {
  const r = spawnSync(PY, ['-'], { input: src, encoding: 'utf8', timeout: 20000 });
  return parsePythonCheck((r.stdout || '') + (r.stderr ? `\n${r.stderr}` : ''));
}

console.log('DSA Top 75 and Programming Essentials');
for (const p of [...findInterviewSet('dsa-75').items, ...findInterviewSet('programming-essentials').items]) {
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

console.log('Extra approaches (Python and JavaScript)');
const setOf = (id) => ({ dsa: 'dsa-75', pe: 'programming-essentials', js: 'js-30', sql: 'sql-50' })[id.split('-')[0]];
for (const { id, approach } of allExtraApproaches()) {
  const item = findInterviewItem(setOf(id), id);
  if (!item) { fail(`${id}: approach for an unknown problem`); continue; }
  if (setOf(id) === 'sql-50') continue;   // SQL approaches are checked with the SQL answers below
  const run = setOf(id) === 'js-30' ? runJs(buildJsCheck(item, approach.code)) : runPy(buildPythonCheck(item, approach.code));
  if (!run.result?.results) { fail(`${id} "${approach.title}": no result ${run.printed.slice(-200)}`); continue; }
  run.result.results.forEach((r, i) => { if (!r.ok) fail(`${id} "${approach.title}": test ${i + 1} got ${JSON.stringify(r.got ?? r.error)}`); });
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

// SQL alternatives must return the same rows as the model answer.
const rowsOf = (sql) => {
  const db = new SQL.Database();
  db.exec(INTERVIEW_SQL_SCHEMA);
  try { return (db.exec(sql).at(-1)?.values || []).map(r => JSON.stringify(r.map(v => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)))); }
  finally { db.close(); }
};
for (const { id, approach } of allExtraApproaches().filter(a => a.id.startsWith('sql-'))) {
  const item = findInterviewItem('sql-50', id);
  try {
    const want = rowsOf(item.solution), got = rowsOf(approach.code);
    const same = item.ordered ? want.join('|') === got.join('|') : [...want].sort().join('|') === [...got].sort().join('|');
    if (!same) fail(`${id} "${approach.title}": rows differ
    want ${want.join(' ')}
    got  ${got.join(' ')}`);
  } catch (e) {
    fail(`${id} "${approach.title}": ${e.message}`);
  }
}

console.log(failures ? `\n${failures} problem(s)` : '\nAll interview answers verified.');
process.exit(failures ? 1 : 0);
