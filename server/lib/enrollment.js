// Course enrolment rules.
//  - A learner studies one course at a time; the next course opens once the current one is finished
//    (final passed, or both final attempts used).
//  - Courses are free while the learner keeps passing. After failing a course's final twice, every
//    later course - including the same course again - costs PAID_COURSE_PRICE.
//  - Buying the same course again gives a fresh set of final attempts (attemptOffset).
//  - Online payment is not connected yet, so paid enrolments are made by the admin.
import { finalAttemptsTotal, MAX_FINAL_ATTEMPTS, getPassedFinalAttempt } from '../routes/quizRoutes.js';

export const PAID_COURSE_PRICE = 99;
const norm = (v) => String(v || '').trim().toLowerCase();

/** 'active' | 'passed' | 'failed' for one enrolment record. */
export function enrolmentStatus(db, email, enr) {
  if (!enr) return null;
  if (getPassedFinalAttempt(db, email, enr.courseId)) return 'passed';
  const used = Math.max(0, finalAttemptsTotal(db, email, enr.courseId) - (enr.attemptOffset || 0));
  return used >= MAX_FINAL_ATTEMPTS ? 'failed' : 'active';
}

/** Everything the site needs to show what a learner may enrol in next. */
export function enrolmentState(db, email) {
  const enr = db.learnerEnrollments?.[norm(email)] || null;
  const status = enrolmentStatus(db, norm(email), enr);
  const history = enr?.history || [];
  const failedBefore = history.some(h => h.outcome === 'failed') || status === 'failed';
  return {
    courseId: enr?.courseId || null,
    status,                                   // of the current course
    canEnrollNew: !enr || status !== 'active',
    nextPrice: failedBefore ? PAID_COURSE_PRICE : 0,
    paymentsEnabled: false,
    passedCourseIds: [...new Set((db.finalTestAttempts || []).filter(a => norm(a.userId) === norm(email) && a.passed).map(a => a.courseId))],
    history: history.map(h => ({ courseId: h.courseId, outcome: h.outcome, enrolledAt: h.enrolledAt, closedAt: h.closedAt, paid: !!h.paid }))
  };
}

/** Makes courseId the learner's current course (the previous one moves to history). */
export function enrol(db, email, courseId, { paid = false, by = 'learner' } = {}) {
  email = norm(email);
  if (!db.learnerEnrollments) db.learnerEnrollments = {};
  const prev = db.learnerEnrollments[email];
  const history = [...(prev?.history || [])];
  const now = new Date().toISOString();
  if (prev) history.push({ courseId: prev.courseId, enrolledAt: prev.enrolledAt, closedAt: now, outcome: enrolmentStatus(db, email, prev) === 'active' ? 'switched' : enrolmentStatus(db, email, prev), paid: !!prev.paid });
  db.learnerEnrollments[email] = { courseId, enrolledAt: now, paid, by, attemptOffset: finalAttemptsTotal(db, email, courseId), history };

  // keep the admin's student record in step
  const student = (db.students || []).find(s => norm(s.email) === email);
  if (student) {
    student.enrolledCourses = [courseId];
    if (!student.progressMap) student.progressMap = {};
    if (!student.progressMap[courseId]) student.progressMap[courseId] = { progress: 0, completedModules: [], quizzesPassed: [], finalTestPassed: false, projectStatus: 'Not Submitted' };
  }
  return db.learnerEnrollments[email];
}
