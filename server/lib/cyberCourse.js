// Adds the Cyber Security course to the database at startup, and refreshes its content when the
// course files change (CYBER_CONTENT_VERSION). Settings the admin may change on the course record
// (published status, featured, price, ratings and counts) are kept when content is refreshed.
import { buildCyberCourse, CYBER_COURSE_ID, CYBER_CONTENT_VERSION } from '../data/courses/cyber-security/build.js';

const CONTENT_FIELDS = ['modules', 'projects', 'finalProject', 'finalTest', 'whatYouWillLearn', 'skills', 'pdfUrl', 'contentVersion'];

/** Returns 'added', 'updated' or null (nothing to do). The caller saves the database. */
export function ensureCyberCourse(db) {
  if (!db) return null;
  if (!Array.isArray(db.courses)) db.courses = [];
  const existing = db.courses.find(c => c.id === CYBER_COURSE_ID);
  if (!existing) {
    db.courses.push({ ...buildCyberCourse(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return 'added';
  }
  if (existing.contentVersion === CYBER_CONTENT_VERSION) return null;
  const fresh = buildCyberCourse();
  for (const k of CONTENT_FIELDS) existing[k] = fresh[k];
  existing.updatedAt = new Date().toISOString();
  return 'updated';
}
