import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { publicBase } from '../lib/publicUrl.js';
import { learnerFromRequest } from '../middleware/learnerAuth.js';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { ensureCertificate, makeUniqueCertificateId, sendCompletionEmail } from '../lib/certificates.js';
import { normalizeUserId, getPassedFinalAttempt, PASS_PERCENTAGE } from './quizRoutes.js';

const router = express.Router();

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

  const { cert, created } = ensureCertificate(db, userId, course, passedAttempt, { studentName, regNo });
  saveDb(db);
  // Safety net: if the completion email was not sent when the final was passed, send it now.
  if (created || !cert.completionEmail) {
    sendCompletionEmail(cert, req).then(() => {
      const fresh = getDb();
      const c = (fresh.certificates || []).find(x => x.certificateId === cert.certificateId);
      if (c) { c.completionEmail = cert.completionEmail; saveDb(fresh); }
    }).catch(() => {});
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
// CERTIFICATE PICTURE FOR LINKEDIN POSTS
// The learner's browser renders the certificate and uploads it here; the verify page links it as its
// preview image (og:image), so a LinkedIn post of the verify link shows the certificate itself.
// ==========================================
export const CERT_IMAGE_DIR = process.env.ARB_CERT_IMAGE_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'cert-images');
const certFileName = (id) => `${String(id).toUpperCase().replace(/[^A-Z0-9-]/g, '')}.jpg`;
export const certImagePath = (id) => path.join(CERT_IMAGE_DIR, certFileName(id));

router.post('/certificates/:id/image', (req, res) => {
  const email = learnerFromRequest(req);
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in again.' });
  const db = getDb();
  const id = String(req.params.id).trim().toUpperCase();
  const cert = (db.certificates || []).find(c => String(c.certificateId).toUpperCase() === id);
  if (!cert || String(cert.userId || '').toLowerCase() !== email) return res.status(404).json({ success: false, message: 'Certificate not found.' });
  const m = String(req.body?.image || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return res.status(400).json({ success: false, message: 'Send the certificate as a JPEG image.' });
  const buf = Buffer.from(m[1], 'base64');
  if (buf.length < 10_000 || buf.length > 4_000_000 || buf[0] !== 0xFF || buf[1] !== 0xD8) return res.status(400).json({ success: false, message: 'The certificate image is not valid.' });
  fs.mkdirSync(CERT_IMAGE_DIR, { recursive: true });
  fs.writeFileSync(certImagePath(id), buf);
  res.json({ success: true, imageUrl: `${publicBase(req).publicUrl}/api/certificates/${encodeURIComponent(id)}/image.jpg` });
});

router.get('/certificates/:id/image.jpg', (req, res) => {
  const file = certImagePath(req.params.id);
  if (!fs.existsSync(file)) return res.status(404).json({ success: false, message: 'No image for this certificate.' });
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.type('image/jpeg').sendFile(file);
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
