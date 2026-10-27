import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import LESSONS, { withLessons } from '../server/data/lessons/index.js';
import { SAMPLE_SCHEMA } from '../shared/sampleSchema.js';
import { normalizeModule } from '../src/utils/normalizeModule.js';

// Every SQL example and practice solution in the rewritten lessons must run in the Practice Lab
// (SQLite + the sample tables), and must not use PostgreSQL-only syntax.
const require = createRequire(import.meta.url);
const lessons = Object.entries(LESSONS['sql-mastery']);
const POSTGRES_ONLY = /::|->>|\bILIKE\s*'|\bINTERVAL\s*'|\bSERIAL\b|\bJSONB\b/;

describe('SQL lessons', () => {
  it('cover all 15 modules', () => {
    expect(lessons.map(([id]) => id)).toEqual(Array.from({ length: 15 }, (_, i) => `sql-mod-${i + 1}`));
  });

  it('every code example and practice solution runs on the sample database', async () => {
    const SQL = await require('sql.js')();
    const failures = [];
    for (const [id, l] of lessons) {
      const rm = l.readingMaterial;
      const snippets = [...rm.codeExamples.map(e => [e.title, e.code]), [rm.practiceExercise.title, rm.practiceExercise.solutionCode]];
      for (const [title, code] of snippets) {
        if (POSTGRES_ONLY.test(code.replace(/--.*$/gm, ''))) failures.push(`${id} "${title}": PostgreSQL-only syntax`);
        const db = new SQL.Database();
        db.exec(SAMPLE_SCHEMA);
        try {
          const res = db.exec(code);
          if (!res.length || !res[res.length - 1].values.length) failures.push(`${id} "${title}": returns no rows`);
          else if (/\d\.\d{6,}/.test(JSON.stringify(res[res.length - 1].values))) failures.push(`${id} "${title}": untidy decimals`);
        } catch (e) { failures.push(`${id} "${title}": ${e.message}`); }
        db.close();
      }
    }
    expect(failures).toEqual([]);
  });

  it('render through the normal lesson pipeline with no stray bullet marks', () => {
    for (const [id, l] of lessons) {
      const nm = normalizeModule({ id, title: id, readingMaterial: l.readingMaterial });
      expect(nm.codeExamples.length, id).toBeGreaterThanOrEqual(3);
      for (const s of l.readingMaterial.sections) for (const b of s.bulletPoints || []) expect(b, id).not.toMatch(/^\s*[•●▪]/);
    }
  });

  it('are applied to the SQL course when it is served', () => {
    const course = { id: 'sql-mastery', modules: [{ id: 'sql-mod-2', title: 'M2', readingMaterial: { introduction: 'old' } }] };
    const out = withLessons(course);
    expect(out.modules[0].readingMaterial).toBe(LESSONS['sql-mastery']['sql-mod-2'].readingMaterial);
    expect(course.modules[0].readingMaterial.introduction).toBe('old');
    expect(withLessons({ id: 'python-programming', modules: [] }).modules).toEqual([]);
  });
});
