import crypto from 'crypto';
import { sendMail } from './mailer.js';
import { completionEmail } from './emailTemplates.js';
import { publicBase } from './publicUrl.js';

const COURSE_CODES = {
  'python-programming': 'PY',
  'sql-mastery': 'SQL',
  'web-development': 'WD',
  'data-science-ai': 'AIDS'
};

function courseCode(course) {
  return COURSE_CODES[course.id] ||
    course.title.split(/\s+/).map(w => w[0]).join('').replace(/[^A-Z]/gi, '').toUpperCase().slice(0, 4) || 'GEN';
}

/** ARB-PY-2026-7KQ2M9XD — 8 random base32 chars, guaranteed unique inside db.certificates. */
export function makeUniqueCertificateId(db, course) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const existing = new Set((db.certificates || []).map(c => String(c.certificateId).toUpperCase()));
  for (;;) {
    const bytes = crypto.randomBytes(8);
    let suffix = '';
    for (const b of bytes) suffix += alphabet[b % alphabet.length];
    const id = `ARB-${courseCode(course)}-${new Date().getFullYear()}-${suffix}`;
    if (!existing.has(id)) return id;
  }
}

export function gradeLabel(pct) {
  if (pct >= 90) return 'Distinction';
  if (pct >= 80) return 'Merit';
  return 'Pass';
}

/**
 * Returns the learner's active certificate for the course, creating it from the passed final
 * attempt if needed. Mutates db; the caller saves. Returns { cert, created }.
 */
export function ensureCertificate(db, userId, course, passedAttempt, { studentName = '', regNo = '' } = {}) {
  if (!db.certificates) db.certificates = [];
  let cert = db.certificates.find(c => c.userId === userId && c.courseId === course.id && c.status === 'active');
  const learner = db.learners?.[userId];
  if (cert) {
    if (learner && !cert.learnerId) {
      cert.learnerId = learner.learnerId;
      if (!cert.regNo) cert.regNo = learner.regNo;
    }
    return { cert, created: false };
  }
  const certificateId = makeUniqueCertificateId(db, course);
  const pct = passedAttempt.percentage;
  cert = {
    id: certificateId,
    certificateId,
    userId,
    studentId: userId,
    // Name / reg. no. come from the server-side account when it exists, so they can't be spoofed.
    studentName: learner?.name || String(studentName || '').trim() || passedAttempt.studentName || userId,
    studentEmail: userId,
    regNo: learner?.regNo || String(regNo || '').trim().toUpperCase(),
    learnerId: learner?.learnerId || '',
    courseId: course.id,
    courseTitle: course.title,
    percentage: pct,
    score: passedAttempt.score,
    totalQuestions: passedAttempt.totalQuestions,
    attemptId: passedAttempt.id,
    grade: `${pct}% ${gradeLabel(pct)}`,
    issueDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    createdAt: new Date().toISOString(),
    instructorName: course.instructor?.name || 'Arshith Bootcamp',
    status: 'active',
    skills: course.skills || []
  };
  db.certificates.unshift(cert);
  return { cert, created: true };
}

const displayTitle = (t) => {
  const s = String(t || '');
  if (s.replace(/[^A-Za-z]/g, '') !== s.replace(/[^A-Za-z]/g, '').toUpperCase()) return s;
  return s.split(/\s+/).map((w, i) => (['AI', 'SQL', 'ML'].includes(w) ? w : (i && ['WITH', 'AND', 'OF'].includes(w) ? w.toLowerCase() : w.charAt(0) + w.slice(1).toLowerCase()))).join(' ');
};

/**
 * Sends the "course completed" email once per certificate. Records the outcome on the certificate
 * (completionEmail: { status, at }) — the caller must save the db afterwards.
 */
export async function sendCompletionEmail(cert, req) {
  if (cert.completionEmail?.status === 'sent') return cert.completionEmail;
  const base = publicBase(req).publicUrl;
  const mail = completionEmail({
    name: cert.studentName,
    courseTitle: displayTitle(cert.courseTitle),
    percentage: cert.percentage,
    grade: String(cert.grade || '').replace(/^\d+%\s*/, ''),
    certificateId: cert.certificateId,
    certificateLink: `${base}/certificate/${encodeURIComponent(cert.courseId)}`,
    verifyLink: `${base}/verify/${encodeURIComponent(cert.certificateId)}`
  });
  const result = await sendMail({ to: cert.studentEmail || cert.userId, ...mail });
  cert.completionEmail = { status: result.delivered ? 'sent' : result.mode === 'outbox' ? 'saved-to-outbox' : 'failed', at: new Date().toISOString(), ...(result.error ? { error: result.error } : {}) };
  return cert.completionEmail;
}
