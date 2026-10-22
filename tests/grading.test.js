import { describe, it, expect } from 'vitest';
import { gradeExercise, gradeKnowledge, toPublicEnrichment, allEnrichment } from '../server/lib/practice.js';

describe('server-side grading', () => {
  it('grades multiple choice', () => {
    const ex = { check: { type: 'mcq', answer: 2 } };
    expect(gradeExercise(ex, { answer: 2 }).correct).toBe(true);
    expect(gradeExercise(ex, { answer: '2' }).correct).toBe(true);
    expect(gradeExercise(ex, { answer: 1 }).correct).toBe(false);
    expect(gradeExercise(ex, {}).feedback).toMatch(/Choose/);
  });
  it('grades numeric answers with tolerance and ignores formatting', () => {
    const ex = { check: { type: 'numeric', answer: 71750, tolerance: 0.5 } };
    expect(gradeExercise(ex, { answer: '71,750' }).correct).toBe(true);
    expect(gradeExercise(ex, { answer: '71750.4' }).correct).toBe(true);
    expect(gradeExercise(ex, { answer: '71760' }).correct).toBe(false);
    expect(gradeExercise(ex, { answer: 'abc' }).feedback).toMatch(/number/);
  });
  it('grades text answers case- and whitespace-insensitively', () => {
    const ex = { check: { type: 'text', accept: ['A D C B'] } };
    expect(gradeExercise(ex, { answer: '  a d c b. ' }).correct).toBe(true);
    expect(gradeExercise(ex, { answer: 'A B C D' }).correct).toBe(false);
    const kw = { check: { type: 'text', keywords: ['grant select', 'on orders'] } };
    expect(gradeExercise(kw, { answer: 'GRANT SELECT ON orders TO analyst;' }).correct).toBe(true);
  });
  it('grades program output and requires a run first', () => {
    const ex = { check: { type: 'output', expectedOutput: 'a\nb' } };
    expect(gradeExercise(ex, { output: 'a  \r\nb\n' }).correct).toBe(true);
    expect(gradeExercise(ex, { output: '' }).feedback).toMatch(/Run your code/);
    expect(gradeExercise(ex, { output: 'a\nc' }).correct).toBe(false);
  });
  it('grades SQL result rows, ordered and unordered', () => {
    const ordered = { check: { type: 'rows', ordered: true, rows: [['x', 1], ['y', 2.5]] } };
    expect(gradeExercise(ordered, { rows: [['x', 1], ['y', 2.5000000001]] }).correct).toBe(true);
    expect(gradeExercise(ordered, { rows: [['y', 2.5], ['x', 1]] }).correct).toBe(false);
    const unordered = { check: { type: 'rows', rows: [['x', 1], ['y', 2]] } };
    expect(gradeExercise(unordered, { rows: [['y', 2], ['x', 1]] }).correct).toBe(true);
    expect(gradeExercise(unordered, { rows: 'nope' }).correct).toBe(false);
  });
  it('never throws on exercises without a check', () => {
    expect(gradeExercise(undefined, {}).correct).toBe(false);
    expect(gradeExercise({ check: { type: 'weird' } }, {}).correct).toBe(false);
  });
  it('grades knowledge checks', () => {
    expect(gradeKnowledge({ answer: 1 }, 1).correct).toBe(true);
    expect(gradeKnowledge({ answer: 1 }, 0).correct).toBe(false);
  });
});

describe('public enrichment payload', () => {
  it('contains no answers or solutions for any module', () => {
    for (const mods of Object.values(allEnrichment())) {
      for (const e of Object.values(mods)) {
        const pub = toPublicEnrichment(e);
        for (const ex of pub.exercises) {
          for (const k of ['check', 'solution', 'solutionCode', 'explanation', 'mistakes']) expect(ex[k]).toBeUndefined();
          expect(ex.checkType).toBeTruthy();
        }
        for (const q of pub.knowledgeCheck) { expect(q.answer).toBeUndefined(); expect(q.explanation).toBeUndefined(); }
      }
    }
  });
});
