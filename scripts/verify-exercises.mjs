// Executes every runnable solution and worked example in the enrichment content and checks that
// the real output matches the stated expected output.
//   node scripts/verify-exercises.mjs            → prints a report, exit code 1 on any mismatch
// Python needs a local `python` (numpy/pandas for AI modules); missing runtimes are reported as SKIPPED.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { SAMPLE_SCHEMA } from '../shared/sampleSchema.js';

const require = createRequire(import.meta.url);
const norm = (s) => String(s ?? '').replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').trim();
const cell = (v) => (v === null || v === undefined ? 'NULL' : (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) ? String(Math.round(Number(v) * 1e6) / 1e6) : String(v).trim()));

function hasPython() {
  const r = spawnSync('python', ['-c', 'import sys; print(sys.version_info[0])'], { encoding: 'utf8' });
  return r.status === 0 && r.stdout.trim() === '3';
}
const PY = hasPython();

function runPython(code) {
  const r = spawnSync('python', ['-X', 'utf8', '-c', code], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 60000, env: { ...process.env, MPLBACKEND: 'Agg', PYTHONIOENCODING: 'utf-8' } });
  return { out: r.stdout, err: r.stderr, ok: r.status === 0 };
}
function runNode(code) {
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: 20000 });
  return { out: r.stdout, err: r.stderr, ok: r.status === 0 };
}

export async function verifyAll({ quiet = false } = {}) {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const results = [];
  const runSqlRows = (code) => {
    const db = new SQL.Database();
    db.exec(SAMPLE_SCHEMA);
    const res = db.exec(code);
    db.close();
    const last = res[res.length - 1];
    return last ? last.values : [];
  };

  for (const [courseId, mods] of Object.entries(ENRICHMENT)) {
    for (const [moduleId, e] of Object.entries(mods)) {
      const items = [];
      if (e.workedExample?.expectedOutput && e.workedExample.code) items.push({ id: `${moduleId}/worked-example`, lang: e.workedExample.language, code: e.workedExample.code, kind: 'output', expected: e.workedExample.expectedOutput, noRun: e.workedExample.noRun });
      for (const x of e.exercises || []) {
        if (x.check?.type === 'output') items.push({ id: `${moduleId}/${x.id}`, lang: x.language, code: x.solutionCode, kind: 'output', expected: x.check.expectedOutput });
        if (x.check?.type === 'rows') items.push({ id: `${moduleId}/${x.id}`, lang: 'sql', code: x.solutionCode, kind: 'rows', rows: x.check.rows, ordered: x.check.ordered });
      }
      for (const it of items) {
        let status = 'PASS';
        let detail = '';
        try {
          if (it.noRun) { status = 'SKIPPED'; detail = 'illustrative only (needs network/files/browser)'; }
          else if (it.kind === 'rows' || it.lang === 'sql') {
            if (it.kind === 'rows') {
              const got = runSqlRows(it.code).map(r => r.map(cell).join('|'));
              const want = it.rows.map(r => r.map(cell).join('|'));
              const ok = got.length === want.length && (it.ordered ? got.every((g, i) => g === want[i]) : [...got].sort().join('\n') === [...want].sort().join('\n'));
              if (!ok) { status = 'FAIL'; detail = `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`; }
            } else {
              const db = new SQL.Database(); db.exec(SAMPLE_SCHEMA); const res = db.exec(it.code); db.close();
              const text = res.map(r => [r.columns.join(' | '), ...r.values.map(v => v.map(cell).join(' | '))].join('\n')).join('\n\n');
              if (norm(text) !== norm(it.expected)) { status = 'FAIL'; detail = `got:\n${text}`; }
            }
          } else if (it.lang === 'python') {
            if (!PY) { status = 'SKIPPED'; detail = 'python not installed'; }
            else {
              const r = runPython(it.code);
              if (!r.ok && /ModuleNotFoundError/.test(r.err)) { status = 'SKIPPED'; detail = r.err.trim().split('\n').pop(); }
              else if (!r.ok || norm(r.out) !== norm(it.expected)) { status = 'FAIL'; detail = r.ok ? `got:\n${r.out}` : r.err.trim().split('\n').slice(-3).join('\n'); }
            }
          } else if (it.lang === 'javascript') {
            const r = runNode(it.code);
            if (!r.ok || norm(r.out) !== norm(it.expected)) { status = 'FAIL'; detail = r.ok ? `got:\n${r.out}` : r.err.trim().split('\n').slice(0, 3).join('\n'); }
          } else { status = 'SKIPPED'; detail = `no runner for ${it.lang}`; }
        } catch (err) { status = 'FAIL'; detail = String(err.message || err); }
        results.push({ courseId, id: it.id, status, detail });
        if (!quiet && status !== 'PASS') console.log(`${status}  ${courseId}/${it.id}${detail ? `\n    ${detail.replace(/\n/g, '\n    ')}` : ''}`);
      }
    }
  }
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('verify-exercises.mjs')) {
  const r = await verifyAll();
  const c = (s) => r.filter(x => x.status === s).length;
  console.log(`\nVerified ${r.length} runnable items: ${c('PASS')} passed, ${c('FAIL')} failed, ${c('SKIPPED')} skipped.`);
  process.exit(c('FAIL') ? 1 : 0);
}
