// Course enrolment rules.
//  - A learner can hold several courses at once.
//  - Every course is free while PAID_COURSES is not 'on' in .env.
//  - With PAID_COURSES=on, each learner gets exactly one free course - the first one. Every other course
//    costs coursePrice() (₹99) to unlock, unlocked by a Razorpay payment (routes/paymentRoutes.js) or the admin.
//  - Failing a course's final twice closes it. Starting it again (free, or ₹99 in paid mode) gives two
//    fresh final attempts (attemptOffset) and restarts its module quizzes (progressFrom).
import { finalAttemptsTotal, MAX_FINAL_ATTEMPTS, getPassedFinalAttempt } from '../routes/quizRoutes.js';
import { enrolmentRecord, enrolledCourseIds } from './enrolledCourses.js';
import { razorpayConfigured } from './razorpay.js';

export const PAID_COURSE_PRICE = 99;
/** Rupees per paid course. COURSE_PRICE in .env overrides it (e.g. COURSE_PRICE=1 to try a real payment). */
export function coursePrice() {
  const v = Number(process.env.COURSE_PRICE);
  return Number.isInteger(v) && v >= 1 ? v : PAID_COURSE_PRICE;
}
/** Courses cost money only when PAID_COURSES=on (once a Razorpay account for the bootcamp is approved). */
export function paidCourses() {
  return String(process.env.PAID_COURSES || '').trim().toLowerCase() === 'on';
}
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
  const usedFreeCourse = ids.length > 0 || history.length > 0;
  return {
    courseId: ids[0] || null,                 // most recent course
    courseIds: ids,
    courses,                                  // { courseId: 'active' | 'passed' | 'failed' }
    status: ids[0] ? courses[ids[0]] : null,
    canEnrollNew: true,
    nextPrice: paidCourses() && usedFreeCourse ? coursePrice() : 0,
    paymentsEnabled: paidCourses() && razorpayConfigured(),
    free: !paidCourses(),
    passedCourseIds: ids.filter(id => courses[id] === 'passed'),
    history: history.map(h => ({ courseId: h.courseId, outcome: h.outcome, enrolledAt: h.enrolledAt, closedAt: h.closedAt, paid: !!h.paid }))
  };
}

/** Adds courseId to the learner's courses, or restarts a failed one: fresh final attempts, and its
 *  module quizzes count again only from now (older attempts stay on record for the admin). */
export function enrol(db, email, courseId, { paid = false, by = 'learner' } = {}) {
  email = norm(email);
  if (!db.learnerEnrollments) db.learnerEnrollments = {};
  const prev = db.learnerEnrollments[email];
  const now = new Date().toISOString();
  // move older single-course records into the courses map
  const courses = prev?.courses ? { ...prev.courses } : (prev?.courseId ? { [prev.courseId]: { enrolledAt: prev.enrolledAt, paid: !!prev.paid, by: prev.by || 'learner', attemptOffset: prev.attemptOffset || 0 } } : {});
  const history = [...(prev?.history || [])];
  const before = courses[courseId] ? courseStatus(db, email, courseId) || 'closed' : null;
  if (before) history.push({ courseId, enrolledAt: courses[courseId].enrolledAt, closedAt: now, outcome: before, paid: !!courses[courseId].paid });
  const progressFrom = before === 'failed' ? now : courses[courseId]?.progressFrom;
  courses[courseId] = { enrolledAt: now, paid, by, attemptOffset: finalAttemptsTotal(db, email, courseId), ...(progressFrom ? { progressFrom } : {}) };
  db.learnerEnrollments[email] = { courseId, enrolledAt: now, courses, history };

  // keep the admin's student record in step
  const student = (db.students || []).find(s => norm(s.email) === email);
  if (student) {
    student.enrolledCourses = enrolledCourseIds(db, email);
    if (!student.progressMap) student.progressMap = {};
    if (!student.progressMap[courseId] || before === 'failed') student.progressMap[courseId] = { progress: 0, completedModules: [], quizzesPassed: [], finalTestPassed: false, projectStatus: 'Not Submitted' };
  }
  return db.learnerEnrollments[email];
}
