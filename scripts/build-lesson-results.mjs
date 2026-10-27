// Runs every section example of the rewritten lessons and saves what it produces to
// server/data/lessons/results.json, shown under each example on the lesson page:
//   SQL        -> result table (Practice Lab sample database)
//   Python     -> printed output, plus the chart if the example draws one (needs a local `python`
//                 with numpy, pandas, matplotlib and scikit-learn)
//   JavaScript -> console output (Node)
//   HTML / CSS -> nothing here; the lesson page shows a live preview
//   node scripts/build-lesson-results.mjs             -> rebuild everything
//   node scripts/build-lesson-results.mjs <courseId>  -> rebuild one course, keep the others
// Each entry stores a hash of its code; tests/sql-lessons.test.js fails when an example changed
// without its result being rebuilt.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { lessonSections } from '../server/data/lessons/index.js';
import { SAMPLE_SCHEMA } from '../shared/sampleSchema.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RESULTS_FILE = path.join(ROOT, 'server', 'data', 'lessons', 'results.json');
const MAX_ROWS = 12;
const MAX_LINES = 40;
const tidy = (v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v);
export const codeHash = (code) => crypto.createHash('sha1').update(String(code)).digest('hex').slice(0, 12);

/** Which examples produce a stored result, and how. */
export function resultKind(sec) {
  if (!sec.code || sec.run === false) return null;
  const lang = sec.language || 'sql';
  if (lang === 'sql') return 'sql';
  if (lang === 'python') return 'python';
  if (lang === 'javascript') return 'javascript';
  return null;
}

// Python examples run through this wrapper: it prints the output and, when matplotlib drew a chart,
// appends it as a base64 PNG after a marker line.
const PY_RUNNER = `
import sys, io, os, base64
os.environ['MPLBACKEND'] = 'Agg'
code = sys.stdin.read()
exec(compile(code, 'example.py', 'exec'), {'__name__': '__main__'})
sys.stdout.flush()
if 'matplotlib.pyplot' in sys.modules:
    import matplotlib.pyplot as plt
    if plt.get_fignums():
        buf = io.BytesIO()
        plt.gcf().savefig(buf, format='png', dpi=80, bbox_inches='tight')
        sys.stdout.write('\\n@@IMG@@' + base64.b64encode(buf.getvalue()).decode())
`;

function runPython(code) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'arb-lesson-'));
  const r = spawnSync('python', ['-X', 'utf8', '-c', PY_RUNNER], { input: code, cwd, encoding: 'utf8', timeout: 120000, env: { ...process.env, PYTHONIOENCODING: 'utf-8', MPLBACKEND: 'Agg', PYTHONWARNINGS: 'ignore' } });
  fs.rmSync(cwd, { recursive: true, force: true });
  if (r.status !== 0) throw new Error((r.stderr || r.error?.message || 'python failed').trim().split('\n').slice(-3).join(' | '));
  const [text, img] = r.stdout.split('\n@@IMG@@');
  return { output: clip(text), ...(img ? { image: `data:image/png;base64,${img.trim()}` } : {}) };
}

function runNode(code) {
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8', timeout: 20000 });
  if (r.status !== 0) throw new Error((r.stderr || 'node failed').trim().split('\n').slice(0, 3).join(' | '));
  return { output: clip(r.stdout) };
}

const clip = (s) => {
  const lines = String(s).replace(/\r\n/g, '\n').replace(/\s+$/, '').split('\n');
  return lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES), `... (${lines.length - MAX_LINES} more lines)`].join('\n') : lines.join('\n');
};

export async function buildResults({ only, previous = {}, onProgress } = {}) {
  const SQL = await createRequire(import.meta.url)('sql.js')();
  const out = {};
  const failures = [];
  for (const [courseId, modules] of Object.entries(lessonSections())) {
    for (const [moduleId, sections] of Object.entries(modules)) {
      sections.forEach((sec, i) => {
        const kind = resultKind(sec);
        if (!kind) return;
        const key = `${courseId}/${moduleId}/${i}`;
        const h = codeHash(sec.code);
        if (only && only !== courseId) { if (previous[key]) out[key] = previous[key]; return; }
        if (previous[key]?.h === h && kind !== 'sql') { out[key] = previous[key]; return; } // unchanged
        try {
          if (kind === 'sql') {
            const db = new SQL.Database();
            db.exec(SAMPLE_SCHEMA);
            const res = db.exec(sec.code);
            db.close();
            const last = res[res.length - 1];
            if (!last) return;
            out[key] = { h, columns: last.columns, rows: last.values.slice(0, MAX_ROWS).map(r => r.map(tidy)), ...(last.values.length > MAX_ROWS ? { more: last.values.length - MAX_ROWS } : {}) };
          } else {
            out[key] = { h, ...(kind === 'python' ? runPython(sec.code) : runNode(sec.code)) };
          }
          onProgress?.(key);
        } catch (e) {
          failures.push(`${key} "${sec.heading}": ${e.message}`);
        }
      });
    }
  }
  return { results: out, failures };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const only = process.argv[2];
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch { /* first build */ }
  let n = 0;
  const { results, failures } = await buildResults({ only, previous, onProgress: () => { if (++n % 25 === 0) process.stdout.write(`${n} `); } });
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results) + '\n');
  console.log(`\nWrote ${Object.keys(results).length} results to ${path.relative(ROOT, RESULTS_FILE)}`);
  if (failures.length) { console.error(`${failures.length} example(s) failed:\n` + failures.join('\n')); process.exit(1); }
}
