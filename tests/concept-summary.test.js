import { describe, it, expect } from 'vitest';
import { conceptLabel, conceptSummary, markdownConcepts } from '../src/utils/conceptSummary';

describe('concept map text', () => {
  it('drops numbering and splits a subtitle after the colon', () => {
    expect(conceptLabel('5 & 6. Classes vs. Objects: The Cookie Cutter Analogy')).toEqual({ title: 'Classes vs. Objects', sub: 'The Cookie Cutter Analogy' });
    expect(conceptLabel('7 to 13. Deep Dive')).toEqual({ title: 'Deep Dive', sub: '' });
    expect(conceptLabel('1. Model Drift Mathematical Formulations').title).toBe('Model Drift Mathematical Formulations');
  });

  it('summarises with the first full sentence and readable maths', () => {
    expect(conceptSummary('A variable is a name bound to an object. More text follows here.')).toBe('A variable is a name bound to an object.');
    expect(conceptSummary('In production, the distribution $P(X)$ inevitably changes over time:')).toBe('In production, the distribution P(X) inevitably changes over time.');
  });

  it('skips lead-ins that only introduce a formula', () => {
    expect(conceptSummary('A classifier is perfectly calibrated if:\n$$P(Y=1)=p$$\n\nPlatt Scaling fits logistic parameters on raw scores.')).toBe('Platt Scaling fits logistic parameters on raw scores.');
  });

  it('does not end a sentence at e.g.', () => {
    expect(conceptSummary('When requesting Top-N items (e.g. the five best sellers) ties must be broken deterministically.')).toBe('When requesting Top-N items (e.g. the five best sellers) ties must be broken deterministically.');
  });

  it('splits theory Markdown at headings, ignoring # lines inside code', () => {
    const md = '### 1. First\nText one.\n```python\n## not a heading\n```\n### 2. Second\nText two.';
    expect(markdownConcepts(md).map(c => c.heading)).toEqual(['1. First', '2. Second']);
  });
});
