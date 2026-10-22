import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { validateDiagram, validateEnrichment, hasAsciiDiagram } from '../shared/contentSchema.js';
import { normalizeModule, normalizeDiagram, normalizePracticeExercise, normalizeSummary } from '../src/utils/normalizeModule.js';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { fingerprint, compare } from '../scripts/content-diff.mjs';
import { validateCatalogue } from '../scripts/validate-content.mjs';

const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
const allModules = db.courses.flatMap(c => c.modules.map(m => ({ course: c, module: m })));

describe('diagram validation', () => {
  it('rejects missing data', () => {
    expect(validateDiagram(undefined).ok).toBe(false);
    expect(validateDiagram(null).errors[0]).toMatch(/missing/);
  });
  it('rejects empty and malformed definitions', () => {
    expect(validateDiagram({ nodes: [] }).ok).toBe(false);
    expect(validateDiagram('A -> B').ok).toBe(false);
    const bad = validateDiagram({ nodes: [{ id: 'a', label: 'A' }, { id: 'a', label: 'dup' }, { id: 'c' }], edges: [{ from: 'a', to: 'zzz' }, { from: 'a', to: 'a' }] });
    expect(bad.ok).toBe(false);
    expect(bad.errors.join(' ')).toMatch(/Duplicate node id/);
    expect(bad.errors.join(' ')).toMatch(/no label/);
    expect(bad.errors.join(' ')).toMatch(/unknown node/);
    expect(bad.errors.join(' ')).toMatch(/to itself/);
  });
  it('accepts a valid diagram, including loops', () => {
    const ok = validateDiagram({ nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'a', label: 'retry' }] });
    expect(ok).toEqual({ ok: true, errors: [] });
  });
  it('treats whitespace-only ASCII as no diagram', () => {
    expect(hasAsciiDiagram('   \n  ')).toBe(false);
    expect(hasAsciiDiagram('+---+\n| A |\n+---+')).toBe(true);
  });
});

describe('module normaliser (root cause of empty sections)', () => {
  it('maps a string diagram (AI modules 7–15) to a drawable diagram', () => {
    const d = normalizeDiagram('\n+-----------+\n| POPULATION |\n+-----------+\n');
    expect(d.ascii.startsWith('+')).toBe(true);
  });
  it('drops diagrams with nothing to draw instead of rendering an empty panel', () => {
    expect(normalizeDiagram({ title: 'x', ascii: '' })).toBeNull();
    expect(normalizeDiagram('')).toBeNull();
  });
  it('maps {question, starterCode, solution} practice exercises', () => {
    const pe = normalizePracticeExercise({ question: 'Do X', starterCode: 'pass', solution: 'print(1)' });
    expect(pe).toEqual({ title: 'Practice exercise', problem: 'Do X', starterCode: 'pass', solutionCode: 'print(1)' });
    expect(normalizePracticeExercise({})).toBeNull();
  });
  it('handles array, string and object summaries', () => {
    expect(normalizeSummary({ summary: ['a', 'b'], keyTakeaways: ['b', 'c'] }).takeaways).toEqual(['a', 'b', 'c']);
    expect(normalizeSummary({ summary: 'text' }).text).toBe('text');
    expect(normalizeSummary({ summary: { takeaways: ['x'], quickReference: ['q'] } }).quickReference).toEqual(['q']);
  });
  it('gives every real module drawable concepts, practice and summary content', () => {
    for (const { course, module } of allModules) {
      const nm = normalizeModule(module);
      const label = `${course.id}/${module.id}`;
      expect(nm.sections.length > 0 || nm.theoryMarkdown.length > 0, `${label} concepts`).toBe(true);
      expect(!!nm.practiceExercise, `${label} practice`).toBe(true);
      expect(nm.summary.takeaways.length > 0 || !!nm.summary.text, `${label} summary`).toBe(true);
      if (module.readingMaterial?.diagram) expect(nm.diagram?.ascii.length, `${label} diagram`).toBeGreaterThan(50);
    }
  });
  it('fixes the specific broken case: AI module 07 diagram and practice', () => {
    const m = db.courses.find(c => c.id === 'data-science-ai').modules.find(x => x.id === 'ai-ds-mod-7');
    expect(typeof m.readingMaterial.diagram).toBe('string');
    const nm = normalizeModule(m);
    expect(nm.diagram.ascii).toMatch(/HYPOTHESIS/);
    expect(nm.practiceExercise.problem).toMatch(/analyze_categorical_association/);
    expect(nm.theoryMarkdown).toMatch(/Descriptive Statistics/);
  });
  it('tolerates a module with missing optional content', () => {
    const nm = normalizeModule({ id: 'x', title: 'Empty', readingMaterial: {} });
    expect(nm.diagram).toBeNull();
    expect(nm.practiceExercise).toBeNull();
    expect(nm.codeExamples).toEqual([]);
    expect(normalizeModule(undefined).objectives).toEqual([]);
  });
});

describe('enrichment content', () => {
  it('exists for every module and validates without errors', () => {
    for (const { course, module } of allModules) {
      const e = ENRICHMENT[course.id]?.[module.id];
      const v = validateEnrichment(e, `${course.id}/${module.id}`);
      expect(v.errors).toEqual([]);
    }
  });
  it('has no orphaned enrichment for modules that do not exist', () => {
    const ids = new Set(allModules.map(x => `${x.course.id}/${x.module.id}`));
    for (const [cid, mods] of Object.entries(ENRICHMENT)) for (const mid of Object.keys(mods)) expect(ids.has(`${cid}/${mid}`)).toBe(true);
  });
  it('never duplicates a graded quiz question in the new knowledge checks', () => {
    const norm = s => String(s || '').trim().toLowerCase();
    for (const { course, module } of allModules) {
      const graded = new Set([...(module.quiz?.questions || []), ...(db.questionBank || []).filter(q => q.moduleId === module.id)].map(q => norm(q.questionText || q.question)));
      for (const q of ENRICHMENT[course.id][module.id].knowledgeCheck || []) expect(graded.has(norm(q.question))).toBe(false);
    }
  });
  it('validation script reports zero errors for the whole catalogue', () => {
    const { errors, rows } = validateCatalogue();
    expect(rows.length).toBe(60);
    expect(errors).toEqual([]);
  });
});

describe('original content is preserved', () => {
  it('matches the baseline taken from the delivered project archive', () => {
    const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'content-baseline.json'), 'utf8'));
    const result = compare(base, fingerprint(db));
    expect(result.changed).toBe(0);
    expect(result.bankChanged).toEqual([]);
    for (const n of result.courseNotes) {
      expect(n.title, `${n.id} title`).toBe(true);
      expect(n.description, `${n.id} descriptions`).toBe(true);
      expect(n.finalTest, `${n.id} final test`).toBe(true);
    }
  });
});
