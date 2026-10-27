// Rewritten lesson text, laid over the stored course content when courses are served, so a deploy
// (git pull + restart) updates every database without a data migration.
// { [courseId]: { [moduleId]: { description?, readingMaterial } } }
// Section examples get their result table from results.json (scripts/build-lesson-results.mjs).
import fs from 'node:fs';
import sql1 from './sql-mastery.part1.js';
import sql2 from './sql-mastery.part2.js';
import sql3 from './sql-mastery.part3.js';
import sec1 from './sql-sections.part1.js';
import sec2 from './sql-sections.part2.js';
import sec3 from './sql-sections.part3.js';

// The detailed step-by-step sections replace each module's shorter sections.
const withSections = (lessons, sections) => Object.fromEntries(Object.entries(lessons).map(([id, l]) => [
  id, sections[id] ? { ...l, readingMaterial: { ...l.readingMaterial, sections: sections[id] } } : l
]));

const LESSONS = {
  'sql-mastery': withSections({ ...sql1, ...sql2, ...sql3 }, { ...sec1, ...sec2, ...sec3 })
};

let results = {};
try { results = JSON.parse(fs.readFileSync(new URL('./results.json', import.meta.url), 'utf8')); } catch { /* not built yet */ }

const withResults = (courseId, moduleId, rm) => ({
  ...rm,
  sections: (rm.sections || []).map((sec, i) => {
    const result = results[`${courseId}/${moduleId}/${i}`];
    return result ? { ...sec, result } : sec;
  })
});

/** The course with any rewritten lessons applied (the stored course is not changed). */
export function withLessons(course) {
  const lessons = LESSONS[course?.id];
  if (!lessons) return course;
  return {
    ...course,
    modules: (course.modules || []).map(m => {
      const l = lessons[m.id];
      if (!l) return m;
      return { ...m, ...(l.description ? { description: l.description } : {}), readingMaterial: withResults(course.id, m.id, l.readingMaterial) };
    })
  };
}

export default LESSONS;
