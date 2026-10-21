import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';
import crypto from 'crypto';
import { normalizeUserId, getPassedFinalAttempt, PASS_PERCENTAGE } from './quizRoutes.js';

const router = express.Router();

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
function makeUniqueCertificateId(db, course) {
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

function gradeLabel(pct) {
  if (pct >= 90) return 'Distinction';
  if (pct >= 80) return 'Merit';
  return 'Pass';
}

// ==========================================
// LEARNER: CLAIM CERTIFICATE (only after passing the final with >= 70%)
// ==========================================
router.post('/certificates/issue', (req, res) => {
  const userId = normalizeUserId(req.body.userId);
  const { studentName, regNo, courseId } = req.body;
  if (!userId || !courseId) return res.status(400).json({ success: false, message: 'userId and courseId are required.' });

  const db = getDb();
  const course = (db.courses || []).find(c => c.id === courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  const passedAttempt = getPassedFinalAttempt(db, userId, course.id);
  if (!passedAttempt) {
    return res.status(403).json({
      success: false,
      message: `A certificate is issued only after scoring ${PASS_PERCENTAGE}% or above in the final assessment.`
    });
  }

  if (!db.certificates) db.certificates = [];
  let cert = db.certificates.find(c => c.userId === userId && c.courseId === course.id && c.status === 'active');

  const learner = db.learners?.[userId];
  if (!cert) {
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
    saveDb(db);
  } else if (learner && !cert.learnerId) {
    cert.learnerId = learner.learnerId;
    if (!cert.regNo) cert.regNo = learner.regNo;
    saveDb(db);
  }

  res.json({ success: true, certificate: cert });
});

// ==========================================
// PUBLIC CERTIFICATE VERIFICATION ENDPOINT
// ==========================================
router.get('/certificates/verify/:id', (req, res) => {
  const db = getDb();
  const certIdInput = req.params.id.trim().toUpperCase();

  const cert = (db.certificates || []).find(
    c => String(c.certificateId).toUpperCase() === certIdInput || String(c.id).toUpperCase() === certIdInput
  );

  if (!cert) {
    return res.status(404).json({
      success: false,
      message: 'Certificate not found. Please verify the Certificate ID.'
    });
  }

  // Return public non-sensitive verification payload
  res.json({
    success: true,
    certificate: {
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      courseTitle: cert.courseTitle,
      issueDate: cert.issueDate,
      instructorName: cert.instructorName,
      grade: cert.grade,
      percentage: cert.percentage ?? null,
      regNo: cert.regNo || '',
      learnerId: cert.learnerId || '',
      courseId: cert.courseId,
      score: cert.score ?? null,
      totalQuestions: cert.totalQuestions ?? null,
      revokedAt: cert.revokedAt || null,
      status: cert.status, // active | revoked
      skills: cert.skills || []
    }
  });
});

// ==========================================
// PROTECTED ADMIN CERTIFICATE ENDPOINTS
// ==========================================

// Get all certificates
router.get('/admin/certificates', verifyAdminToken, (req, res) => {
  const db = getDb();
  res.json({ success: true, certificates: db.certificates || [] });
});

// Check eligibility server-side
router.post('/admin/certificates/check-eligibility', verifyAdminToken, (req, res) => {
  const { studentId, courseId } = req.body;
  const db = getDb();

  const student = (db.students || []).find(s => s.id === studentId);
  const course = (db.courses || []).find(c => c.id === courseId);

  if (!student || !course) {
    return res.status(404).json({ success: false, message: 'Student or Course not found.' });
  }

  const progressObj = (student.progressMap && student.progressMap[courseId]) || {};
  const totalModules = course.modules?.length || 1;
  const completedModulesCount = progressObj.completedModules?.length || 0;
  const quizzesPassedCount = progressObj.quizzesPassed?.length || 0;
  const finalTestPassed = Boolean(progressObj.finalTestPassed);
  const projectStatus = progressObj.projectStatus || 'Not Submitted';

  const allModulesCompleted = completedModulesCount >= totalModules;
  const allQuizzesPassed = quizzesPassedCount >= totalModules;
  const projectApproved = projectStatus === 'Approved';

  const isEligible = allModulesCompleted && allQuizzesPassed && finalTestPassed && projectApproved;

  res.json({
    success: true,
    isEligible,
    details: {
      allModulesCompleted: `${completedModulesCount}/${totalModules}`,
      allQuizzesPassed: `${quizzesPassedCount}/${totalModules}`,
      finalTestPassed,
      projectStatus
    }
  });
});

// Generate Certificate
router.post('/admin/certificates/generate', verifyAdminToken, (req, res) => {
  const { studentId, courseId, grade, forceOverride } = req.body;
  const db = getDb();

  const student = (db.students || []).find(s => s.id === studentId);
  const course = (db.courses || []).find(c => c.id === courseId);

  if (!student || !course) {
    return res.status(404).json({ success: false, message: 'Student or Course not found.' });
  }

  // Check if certificate already exists for this student & course
  const existingCert = (db.certificates || []).find(
    c => c.studentId === studentId && c.courseId === courseId && c.status === 'active'
  );

  if (existingCert) {
    return res.status(400).json({
      success: false,
      message: `Student already has an active certificate (${existingCert.certificateId}) for this course.`,
      certificate: existingCert
    });
  }

  // Verify eligibility if not forceOverride
  if (!forceOverride) {
    const progressObj = (student.progressMap && student.progressMap[courseId]) || {};
    const totalModules = course.modules?.length || 1;
    const completedModulesCount = progressObj.completedModules?.length || 0;
    const finalTestPassed = Boolean(progressObj.finalTestPassed);
    const projectStatus = progressObj.projectStatus || 'Not Submitted';

    if (completedModulesCount < totalModules || !finalTestPassed || projectStatus !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Student does not meet automatic certificate eligibility criteria (Requires 100% modules, passed quizzes, passed final test, and approved project). Use explicit override if needed.'
      });
    }
  }

  // Same collision-checked ID format as learner-claimed certificates (e.g. ARB-PY-2026-7KQ2M9XD)
  const certificateId = makeUniqueCertificateId(db, course);

  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const issueDateStr = new Date().toLocaleDateString('en-US', options);

  const newCert = {
    id: certificateId,
    certificateId,
    studentId: student.id,
    studentName: (student.name && student.name.trim()) ? student.name.trim() : (student.email && student.email.trim() ? student.email.trim() : 'Student'),
    studentEmail: student.email,
    regNo: student.regNo || '',
    learnerId: String(student.id || '').startsWith('ARB-STU-') ? student.id : '',
    courseId: course.id,
    courseTitle: course.title,
    issueDate: issueDateStr,
    createdAt: new Date().toISOString(),
    instructorName: course.instructor?.name || 'Arshith Bootcamp Lead',
    grade: grade || '96% Distinction',
    status: 'active',
    skills: course.skills || ['Core Bootcamp Mastery']
  };

  if (!db.certificates) db.certificates = [];
  db.certificates.unshift(newCert);
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'CERTIFICATE_GENERATED',
    target: `Certificate: ${certificateId}`,
    details: `Generated for ${student.name} (${course.title})`
  });

  res.status(201).json({ success: true, message: 'Certificate generated successfully', certificate: newCert });
});

// Revoke Certificate
router.post('/admin/certificates/:id/revoke', verifyAdminToken, (req, res) => {
  const db = getDb();
  const cert = (db.certificates || []).find(c => c.id === req.params.id || c.certificateId === req.params.id);

  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });

  cert.status = 'revoked';
  cert.revokedAt = new Date().toISOString();
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'CERTIFICATE_REVOKED',
    target: `Certificate: ${cert.certificateId}`,
    details: `Revoked certificate issued to ${cert.studentName}`
  });

  res.json({ success: true, message: 'Certificate revoked successfully.', certificate: cert });
});

// Restore Revoked Certificate
router.post('/admin/certificates/:id/restore', verifyAdminToken, (req, res) => {
  const db = getDb();
  const cert = (db.certificates || []).find(c => c.id === req.params.id || c.certificateId === req.params.id);

  if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found.' });

  cert.status = 'active';
  delete cert.revokedAt;
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'CERTIFICATE_RESTORED',
    target: `Certificate: ${cert.certificateId}`,
    details: `Restored revoked certificate for ${cert.studentName}`
  });

  res.json({ success: true, message: 'Certificate restored to active status.', certificate: cert });
});

export default router;
