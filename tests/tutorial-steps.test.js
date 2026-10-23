import { describe, it, expect } from 'vitest';
import { normalizeTutorials } from '../src/utils/normalizeModule';

describe('normalizeTutorials', () => {
  it('maps the web course shape { stepNumber, title, description }', () => {
    const [t] = normalizeTutorials([{ title: 'Tutorial: Card grid', steps: [{ stepNumber: 1, title: 'Create container', description: 'Add a section.' }] }]);
    expect(t.title).toBe('Card grid');
    expect(t.steps[0]).toEqual({ step: 1, title: 'Create container', instruction: 'Add a section.', code: '', explanation: '' });
  });

  it('keeps the AI course shape { step, instruction, code, explanation }', () => {
    const [t] = normalizeTutorials([{ title: 'Setup', steps: [{ step: 2, instruction: 'Install', code: 'pip install x', explanation: 'Why' }] }]);
    expect(t.steps[0]).toMatchObject({ step: 2, instruction: 'Install', code: 'pip install x', explanation: 'Why' });
  });

  it('numbers steps without a number and drops empty ones', () => {
    const [t] = normalizeTutorials([{ title: 'X', steps: ['First do this', {}, { instruction: 'Then this' }] }]);
    expect(t.steps.map(s => [s.step, s.instruction])).toEqual([[1, 'First do this'], [3, 'Then this']]);
  });
});
