// Which courses a learner is enrolled in. A learner can hold several courses; older records stored a
// single { courseId }, which still reads as one enrolled course.
const norm = (v) => String(v || '').trim().toLowerCase();

/** Enrolment record of one course: { enrolledAt, paid, by, attemptOffset } or null. */
export function enrolmentRecord(db, email, courseId) {
  const enr = db.learnerEnrollments?.[norm(email)];
  if (!enr || !courseId) return null;
  if (enr.courses) return enr.courses[courseId] || null;
  return enr.courseId === courseId ? enr : null;
}

/** All enrolled course ids, most recent first. */
export function enrolledCourseIds(db, email) {
  const enr = db.learnerEnrollments?.[norm(email)];
  if (!enr) return [];
  if (enr.courses) {
    return Object.entries(enr.courses)
      .sort((a, b) => String(b[1].enrolledAt || '').localeCompare(String(a[1].enrolledAt || '')))
      .map(([id]) => id);
  }
  return enr.courseId ? [enr.courseId] : [];
}

export const isEnrolled = (db, email, courseId) => !!enrolmentRecord(db, email, courseId);
