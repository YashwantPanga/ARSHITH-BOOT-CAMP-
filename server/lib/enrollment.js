// Course enrolment rules.
//  - A learner can hold several courses at once.
//  - The first course is free, and the next one is free again once every course so far has been
//    passed. Otherwise a further course costs PAID_COURSE_PRICE to unlock - also the same course
//    again after failing its final twice, which gives two fresh final attempts (attemptOffset).
//  - Online payment is not connected yet, so paid courses are unlocked by the admin.
import { finalAttemptsTotal, MAX_FINAL_ATTEMPTS, getPassedFinalAttempt } from '../routes/quizRoutes.js';
import { enrolmentRecord, enrolledCourseIds } from './enrolledCourses.js';

export const PAID_COURSE_PRICE = 99;
const norm = (v) => String(v || '').trim().toLowerCase();

/** 'active' | 'passed' | 'failed' for one enrolled course. */
export function courseStatus(db, email, courseId) {
  const rec = enrolmentRecord(db, email, courseId);
  if (!rec) return null;
  if (getPassedFinalAttempt(db, norm(email), courseId)) return 'passed';
  const used = Math.max(0, finalAttemptsTotal(db, norm(email), courseId) - (rec.attemptOffset || 0));
  return used >= MAX_FINAL_ATTEMPTS ? 'failed' : 'active';
}

/** Everything the site needs to show what a learner holds and what the next course costs. */
export function enrolmentState(db, email) {
  email = norm(email);
  const ids = enrolledCourseIds(db, email);
  const courses = Object.fromEntries(ids.map(id => [id, courseStatus(db, email, id)]));
  const history = db.learnerEnrollments?.[email]?.history || [];
  const failedBefore = history.some(h => h.outcome === 'failed') || Object.values(courses).includes('failed');
  const allPassed = ids.every(id => courses[id] === 'passed');
  return {
    courseId: ids[0] || null,                 // most recent course
    courseIds: ids,
    courses,                                  // { courseId: 'active' | 'passed' | 'failed' }
    status: ids[0] ? courses[ids[0]] : null,
    canEnrollNew: true,
    nextPrice: ids.length === 0 || (allPassed && !failedBefore) ? 0 : PAID_COURSE_PRICE,
    paymentsEnabled: false,
    passedCourseIds: ids.filter(id => courses[id] === 'passed'),
    history: history.map(h => ({ courseId: h.courseId, outcome: h.outcome, enrolledAt: h.enrolledAt, closedAt: h.closedAt, paid: !!h.paid }))
  };
}

/** Adds courseId to the learner's courses (or restarts it with fresh final attempts after a fail). */
export function enrol(db, email, courseId, { paid = false, by = 'learner' } = {}) {
  email = norm(email);
  if (!db.learnerEnrollments) db.learnerEnrollments = {};
  const prev = db.learnerEnrollments[email];
  const now = new Date().toISOString();
  // move older single-course records into the courses map
  const courses = prev?.courses ? { ...prev.courses } : (prev?.courseId ? { [prev.courseId]: { enrolledAt: prev.enrolledAt, paid: !!prev.paid, by: prev.by || 'learner', attemptOffset: prev.attemptOffset || 0 } } : {});
  const history = [...(prev?.history || [])];
  if (courses[courseId]) history.push({ courseId, enrolledAt: courses[courseId].enrolledAt, closedAt: now, outcome: courseStatus(db, email, courseId) || 'closed', paid: !!courses[courseId].paid });
  courses[courseId] = { enrolledAt: now, paid, by, attemptOffset: finalAttemptsTotal(db, email, courseId) };
  db.learnerEnrollments[email] = { courseId, enrolledAt: now, courses, history };

  // keep the admin's student record in step
  const student = (db.students || []).find(s => norm(s.email) === email);
  if (student) {
    student.enrolledCourses = enrolledCourseIds(db, email);
    if (!student.progressMap) student.progressMap = {};
    if (!student.progressMap[courseId]) student.progressMap[courseId] = { progress: 0, completedModules: [], quizzesPassed: [], finalTestPassed: false, projectStatus: 'Not Submitted' };
  }
  return db.learnerEnrollments[email];
}
