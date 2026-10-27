import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import LESSONS, { withLessons } from '../server/data/lessons/index.js';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { RESULTS_FILE, resultKind, codeHash } from '../scripts/build-lesson-results.mjs';
import { lessonSections } from '../server/data/lessons/index.js';
import { SAMPLE_SCHEMA } from '../shared/sampleSchema.js';
import { normalizeModule } from '../src/utils/normalizeModule.js';

// Every SQL example (section examples, code examples, practice solutions) in the rewritten lessons
// must run in the Practice Lab (SQLite + the sample tables) and must not use PostgreSQL-only syntax.
const require = createRequire(import.meta.url);
const lessons = Object.entries(LESSONS['sql-mastery']);
const POSTGRES_ONLY = /::|->>|\bILIKE\s*'|\bINTERVAL\s*'|\bSERIAL\b|\bJSONB\b/;

describe('SQL lessons', () => {
  it('cover all 15 modules, each with detailed step-by-step sections', () => {
    expect(lessons.map(([id]) => id)).toEqual(Array.from({ length: 15 }, (_, i) => `sql-mod-${i + 1}`));
    for (const [id, l] of lessons) {
      const secs = l.readingMaterial.sections;
      expect(secs.length, id).toBeGreaterThanOrEqual(6);
      expect(secs.filter(s => s.code).length, `${id} runnable section examples`).toBeGreaterThanOrEqual(4);
    }
  });

  it('every example and practice solution runs on the sample database', async () => {
    const SQL = await require('sql.js')();
    const failures = [];
    for (const [id, l] of lessons) {
      const rm = l.readingMaterial;
      const snippets = [
        ...rm.sections.filter(s => s.code).map(s => [`section "${s.heading}"`, s.code]),
        ...rm.codeExamples.map(e => [e.title, e.code]),
        [rm.practiceExercise.title, rm.practiceExercise.solutionCode]
      ];
      for (const [title, code] of snippets) {
        if (POSTGRES_ONLY.test(code.replace(/--.*$/gm, ''))) failures.push(`${id} ${title}: PostgreSQL-only syntax`);
        const db = new SQL.Database();
        db.exec(SAMPLE_SCHEMA);
        try {
          const res = db.exec(code);
          if (!res.length || !res[res.length - 1].values.length) failures.push(`${id} ${title}: returns no rows`);
          else if (/\d\.\d{6,}/.test(JSON.stringify(res[res.length - 1].values))) failures.push(`${id} ${title}: untidy decimals`);
        } catch (e) { failures.push(`${id} ${title}: ${e.message}`); }
        db.close();
      }
    }
    expect(failures).toEqual([]);
  });

  it('results.json has an up-to-date result for every runnable example - run node scripts/build-lesson-results.mjs', () => {
    const saved = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
    const stale = [];
    for (const [courseId, modules] of Object.entries(lessonSections())) {
      for (const [moduleId, sections] of Object.entries(modules)) {
        sections.forEach((sec, i) => {
          if (!resultKind(sec)) return;
          const r = saved[`${courseId}/${moduleId}/${i}`];
          if (!r || r.h !== codeHash(sec.code)) stale.push(`${courseId}/${moduleId}/${i} ${sec.heading}`);
        });
      }
    }
    expect(stale).toEqual([]);
  });

  it('render through the normal lesson pipeline with no stray bullet marks', () => {
    for (const [id, l] of lessons) {
      const nm = normalizeModule({ id, title: id, readingMaterial: l.readingMaterial });
      expect(nm.codeExamples.length, id).toBeGreaterThanOrEqual(3);
      for (const s of l.readingMaterial.sections) for (const b of s.bulletPoints || []) expect(b, id).not.toMatch(/^\s*[•●▪]/);
    }
  });

  it('are applied to the SQL course when it is served, with result tables', () => {
    const course = { id: 'sql-mastery', modules: [{ id: 'sql-mod-2', title: 'M2', readingMaterial: { introduction: 'old' } }] };
    const out = withLessons(course);
    const rm = out.modules[0].readingMaterial;
    expect(rm.introduction).toBe(LESSONS['sql-mastery']['sql-mod-2'].readingMaterial.introduction);
    const withCode = rm.sections.filter(s => s.code);
    expect(withCode.every(s => s.result?.columns?.length > 0)).toBe(true);
    expect(course.modules[0].readingMaterial.introduction).toBe('old');
    expect(withLessons({ id: 'python-programming', modules: [] }).modules).toEqual([]);
  });

  it('every box of the SQL diagrams has a full explanation for its click card', () => {
    for (const [id, e] of Object.entries(ENRICHMENT['sql-mastery'])) {
      for (const n of e.workflow.nodes) expect(String(n.explain || '').length, `${id}/${n.id}`).toBeGreaterThan(60);
    }
  });
});

describe('Python, Web Development and Data Science lessons', () => {
  const courses = { 'python-programming': 'py-mod-', 'web-development': 'web-mod-', 'data-science-ai': 'ai-ds-mod-' };

  it.each(Object.entries(courses))('%s: all 15 modules have detailed step-by-step sections', (courseId, prefix) => {
    const mods = lessonSections()[courseId];
    expect(Object.keys(mods).sort()).toEqual(Array.from({ length: 15 }, (_, i) => `${prefix}${i + 1}`).sort());
    for (const [id, secs] of Object.entries(mods)) {
      expect(secs.length, id).toBeGreaterThanOrEqual(6);
      expect(secs.filter(s => s.code).length, `${id} examples`).toBeGreaterThanOrEqual(3);
      for (const s of secs) {
        expect(s.heading, id).toBeTruthy();
        expect(String(s.text || '').length, `${id} "${s.heading}" text`).toBeGreaterThan(40);
        if (s.code && s.run !== false) expect(['python', 'html', 'javascript', 'sql', 'text'], `${id} "${s.heading}" language`).toContain(s.language || 'sql');
      }
    }
  });

  it('replace the stored sections (and a Markdown theory text) when a course is served', () => {
    const course = { id: 'data-science-ai', modules: [{ id: 'ai-ds-mod-9', title: 'M9', readingMaterial: { theory: '# old', introduction: 'kept' } }] };
    const rm = withLessons(course).modules[0].readingMaterial;
    expect(rm.introduction).toBe('kept');
    expect(rm.theory).toBeUndefined();
    expect(rm.sections.length).toBe(lessonSections()['data-science-ai']['ai-ds-mod-9'].length);
    expect(rm.sections.find(s => s.code && s.language === 'python').result.output).toBeTruthy();
  });
});
