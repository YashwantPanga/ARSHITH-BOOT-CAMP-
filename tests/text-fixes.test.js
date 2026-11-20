import { describe, it, expect } from 'vitest';
import { applyTextFixes, COURSE_TEXT } from '../server/lib/textFixes.js';
import { shortText } from '../src/utils/textUtils.js';
import { categorySlug, categoryFromSlug, categoryOf } from '../src/data/meta.js';

describe('text review fixes', () => {
  it('renames the courses once and never again, so later admin edits stay', () => {
    const db = { courses: [{ id: 'data-science-ai', title: 'AI WITH DATA SCIENCE', category: 'Artificial Intelligence & Data Science' }, { id: 'other', title: 'Keep me' }] };
    expect(applyTextFixes(db)).toBe(true);
    expect(db.courses[0].title).toBe('AI & Data Science');
    expect(db.courses[0].category).toBe('AI & Data Science');
    expect(db.courses[0].shortDescription).toBe(COURSE_TEXT['data-science-ai'].shortDescription);
    expect(db.courses[1].title).toBe('Keep me');
    db.courses[0].title = 'Edited by admin';
    expect(applyTextFixes(db)).toBe(false);
    expect(db.courses[0].title).toBe('Edited by admin');
  });

  it('no course description starts with "Master" any more', () => {
    for (const t of Object.values(COURSE_TEXT)) expect(t.shortDescription.startsWith('Master')).toBe(false);
  });

  it('shortens text at a word boundary, never after a comma', () => {
    const s = shortText('Build full-stack websites with HTML5, CSS3, modern JavaScript, React and more', 46);
    expect(s.endsWith('…')).toBe(true);
    expect(s).not.toMatch(/[,\s]…$/);
    expect(shortText('Short text', 40)).toBe('Short text');
  });

  it('uses clean category links and understands the old names', () => {
    expect(categorySlug('Web Development')).toBe('web-development');
    expect(categorySlug('AI & Data Science')).toBe('ai-and-data-science');
    expect(categoryFromSlug('web-development')).toBe('Web Development');
    expect(categoryFromSlug('Artificial Intelligence & Data Science')).toBe('AI & Data Science');
    expect(categoryFromSlug('nonsense')).toBe('All Categories');
    expect(categoryOf({ category: 'Programming' })).toBe('Python');
  });
});
