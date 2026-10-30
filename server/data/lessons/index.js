// Rewritten lesson content, laid over the stored course content when courses are served, so a
// deploy (git pull + restart) updates every database without a data migration.
//  - SQL: full lesson text (sql-mastery.part*.js) plus detailed step-by-step sections.
//  - Python, Web Development, Data Science & AI: detailed step-by-step sections that replace the
//    module's concept sections; the rest of each module (introduction, examples, quiz) is kept.
// Each example's result (table, output, chart) comes from results.json (scripts/build-lesson-results.mjs).
import fs from 'node:fs';
import sql1 from './sql-mastery.part1.js';
import sql2 from './sql-mastery.part2.js';
import sql3 from './sql-mastery.part3.js';
import sqlSec1 from './sql-sections.part1.js';
import sqlSec2 from './sql-sections.part2.js';
import sqlSec3 from './sql-sections.part3.js';
import pySec1 from './python-sections.part1.js';
import pySec2 from './python-sections.part2.js';
import pySec3 from './python-sections.part3.js';
import webSec1 from './web-sections.part1.js';
import webSec2 from './web-sections.part2.js';
import webSec3 from './web-sections.part3.js';
import aiSec1 from './ai-sections.part1.js';
import aiSec2 from './ai-sections.part2.js';
import aiSec3 from './ai-sections.part3.js';
import EXAMPLE_FIXES from './example-fixes.js';

/** { [courseId]: { [moduleId]: sections[] } } - the detailed step-by-step sections. */
const SECTIONS = {
  'sql-mastery': { ...sqlSec1, ...sqlSec2, ...sqlSec3 },
  'python-programming': { ...pySec1, ...pySec2, ...pySec3 },
  'web-development': { ...webSec1, ...webSec2, ...webSec3 },
  'data-science-ai': { ...aiSec1, ...aiSec2, ...aiSec3 }
};

/** Full replacement lessons ({ description?, readingMaterial }) - SQL only. */
const FULL = {
  'sql-mastery': { ...sql1, ...sql2, ...sql3 }
};

export const lessonSections = () => SECTIONS;

let results = {};
try { results = JSON.parse(fs.readFileSync(new URL('./results.json', import.meta.url), 'utf8')); } catch { /* not built yet */ }

const sectionsFor = (courseId, moduleId) => {
  const secs = SECTIONS[courseId]?.[moduleId];
  if (!secs) return null;
  return secs.map((sec, i) => {
    const result = results[`${courseId}/${moduleId}/${i}`];
    return result ? { ...sec, result } : sec;
  });
};

/** The module's code examples with the corrections from example-fixes.js applied, or null when none apply. */
const fixedExamples = (courseId, moduleId, examples) => {
  if (!Array.isArray(examples)) return null;
  let changed = false;
  const out = examples.map((ex, i) => {
    const code = EXAMPLE_FIXES[`${courseId}/${moduleId}/${i}`];
    if (code === undefined || code === ex.code) return ex;
    changed = true;
    return { ...ex, code };
  });
  return changed ? out : null;
};

/** The course with the rewritten lessons applied (the stored course is not changed). */
export function withLessons(course) {
  if (!course || (!SECTIONS[course.id] && !FULL[course.id])) return course;
  return {
    ...course,
    modules: (course.modules || []).map(m => {
      const full = FULL[course.id]?.[m.id];
      const sections = sectionsFor(course.id, m.id);
      const examples = full ? null : fixedExamples(course.id, m.id, m.readingMaterial?.codeExamples);
      if (!full && !sections && !examples) return m;
      const rm = { ...(full ? full.readingMaterial : m.readingMaterial) };
      if (sections) {
        rm.sections = sections;
        delete rm.theory; // the sections replace a Markdown theory text (some AI modules)
      }
      if (examples) rm.codeExamples = examples;
      return { ...m, ...(full?.description ? { description: full.description } : {}), readingMaterial: rm };
    })
  };
}

/** SQL lessons with their detailed sections (used by tests). */
const LESSONS = {
  'sql-mastery': Object.fromEntries(Object.entries(FULL['sql-mastery']).map(([id, l]) => [
    id, { ...l, readingMaterial: { ...l.readingMaterial, sections: SECTIONS['sql-mastery'][id] || l.readingMaterial.sections } }
  ]))
};
export default LESSONS;
