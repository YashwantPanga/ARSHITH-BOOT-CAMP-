// Rewritten lesson text, laid over the stored course content when courses are served, so a deploy
// (git pull + restart) updates every database without a data migration.
// { [courseId]: { [moduleId]: { description?, readingMaterial } } }
import sql1 from './sql-mastery.part1.js';
import sql2 from './sql-mastery.part2.js';
import sql3 from './sql-mastery.part3.js';

const LESSONS = {
  'sql-mastery': { ...sql1, ...sql2, ...sql3 }
};

/** The course with any rewritten lessons applied (the stored course is not changed). */
export function withLessons(course) {
  const lessons = LESSONS[course?.id];
  if (!lessons) return course;
  return {
    ...course,
    modules: (course.modules || []).map(m => {
      const l = lessons[m.id];
      if (!l) return m;
      return { ...m, ...(l.description ? { description: l.description } : {}), readingMaterial: l.readingMaterial };
    })
  };
}

export default LESSONS;
