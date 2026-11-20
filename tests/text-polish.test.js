import { describe, it, expect } from 'vitest';
import { polishText, polishDeep } from '../server/lib/textPolish.js';
import FIXES from '../server/data/lessons/text-fixes.js';
import { withLessons } from '../server/data/lessons/index.js';

describe('course text corrections', () => {
  it('turns spaced hyphens between words into dashes, but never touches math or code', () => {
    expect(polishText('Comments explain the code to people - including you.')).toBe('Comments explain the code to people – including you.');
    expect(polishText('Module 02  -  Variables')).toBe('Module 02 – Variables');
    expect(polishText('n - 1 rows')).toBe('n - 1 rows');
    expect(polishText('MAX(score) - MIN(score)')).toBe('MAX(score) - MIN(score)');
    expect(polishText('delivered_on - shipped_on')).toBe('delivered_on - shipped_on');
    expect(polishText('+ (add), - (subtract)')).toBe('+ (add), - (subtract)');
  });

  it('uses US spelling as whole words only', () => {
    expect(polishText('a summarised colour behaviour, recognised maths')).toBe('a summarized color behavior, recognized math');
    expect(polishText('analyses of data')).toBe('analyses of data'); // the noun stays
    expect(polishText('the enrolments table')).toBe('the enrolments table'); // SQL table name
  });

  it('never changes quiz options, answers, checks or code', () => {
    const q = {
      questionText: 'What does it print?',
      options: ['It is summarised', 'Network network protocols'],
      correctAnswer: 'It is summarised',
      explanation: 'It is summarised - always.',
      code: 'x = a - b  # colour',
      check: { type: 'output', accept: ['colour'] }
    };
    const out = polishDeep(q);
    expect(out.options).toEqual(q.options);
    expect(out.correctAnswer).toBe(q.correctAnswer);
    expect(out.code).toBe(q.code);
    expect(out.check).toEqual(q.check);
    expect(out.explanation).toBe('It is summarized – always.');
  });

  it('gives exercise and question text only the exact phrase fixes (they can quote program output)', () => {
    expect(polishDeep({ problem: 'Longest: practising' }).problem).toBe('Longest: practising');
    expect(polishDeep({ problem: 'Which step converts arshithbootcamp.com into an IP address?' }).problem).toBe('Which step converts codelekho.com into an IP address?');
  });

  it('applies the fixes to served courses without changing quiz options', () => {
    const course = { id: 'demo', modules: [{ id: 'm1', title: 'Module 01  -  Intro', quiz: { questions: [{ questionText: 'Q', options: ['a - b', 'colour'], correctAnswer: 'colour' }] } }] };
    const served = withLessons(course);
    expect(served.modules[0].title).toBe('Module 01 – Intro');
    expect(served.modules[0].quiz.questions[0].options).toEqual(['a - b', 'colour']);
    expect(served.modules[0].quiz.questions[0].correctAnswer).toBe('colour');
    expect(course.modules[0].title).toBe('Module 01  -  Intro'); // the stored course is not changed
  });

  it('every fix is a real change', () => {
    for (const [wrong, right] of Object.entries(FIXES)) expect(wrong).not.toBe(right);
  });
});
