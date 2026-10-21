// Single place that knows how the logged-in learner is stored in the browser.

export const STUDENT_KEY = 'studentUser';

export function readStudent() {
  try {
    const raw = localStorage.getItem(STUDENT_KEY);
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    const u = JSON.parse(raw);
    return u && u.email ? u : null;
  } catch {
    return null;
  }
}

export function writeStudent(user) {
  try {
    if (!user) {
      localStorage.removeItem(STUDENT_KEY);
      return;
    }
    localStorage.setItem(STUDENT_KEY, JSON.stringify(user));
    localStorage.setItem(accountKey(user.email), JSON.stringify(user));
  } catch {
    /* storage unavailable – session simply won't persist */
  }
}

export const accountKey = (email) => `studentUser_${String(email || '').trim().toLowerCase()}`;

export function readAccount(email) {
  try {
    const raw = localStorage.getItem(accountKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Stable id used by the API for quizzes, exams, enrollment and certificates. */
export const userIdOf = (user) => String(user?.email || '').trim().toLowerCase();

export const displayNameOf = (user) =>
  (user?.name && user.name.trim()) || (user?.email && user.email.trim()) || 'Student';

/** One course per login: the first enrolled course id, or null. */
export const enrolledCourseOf = (user) => (user?.enrolledCourseIds && user.enrolledCourseIds[0]) || null;
