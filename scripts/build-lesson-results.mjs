// Runs every section example in the rewritten lessons on the Practice Lab sample database and saves
// the result tables to server/data/lessons/results.json (shown as "Result" under each example).
//   node scripts/build-lesson-results.mjs          -> writes the file
// tests/sql-lessons.test.js fails when the file is out of date.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import LESSONS from '../server/data/lessons/index.js';
import { SAMPLE_SCHEMA } from '../shared/sampleSchema.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RESULTS_FILE = path.join(ROOT, 'server', 'data', 'lessons', 'results.json');
const MAX_ROWS = 12;
const tidy = (v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v);

export async function buildResults() {
  const SQL = await createRequire(import.meta.url)('sql.js')();
  const out = {};
  for (const [courseId, mods] of Object.entries(LESSONS)) {
    for (const [moduleId, l] of Object.entries(mods)) {
      (l.readingMaterial.sections || []).forEach((sec, i) => {
        if (!sec.code) return;
        const db = new SQL.Database();
        db.exec(SAMPLE_SCHEMA);
        const res = db.exec(sec.code);
        db.close();
        const last = res[res.length - 1];
        if (!last) return;
        out[`${courseId}/${moduleId}/${i}`] = {
          columns: last.columns,
          rows: last.values.slice(0, MAX_ROWS).map(r => r.map(tidy)),
          ...(last.values.length > MAX_ROWS ? { more: last.values.length - MAX_ROWS } : {})
        };
      });
    }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const out = await buildResults();
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(out, null, 1) + '\n');
  console.log(`Wrote ${Object.keys(out).length} result tables to ${path.relative(ROOT, RESULTS_FILE)}`);
}
