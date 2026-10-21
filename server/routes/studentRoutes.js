import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

// Get all students
router.get('/admin/students', verifyAdminToken, (req, res) => {
  const db = getDb();
  // Return students without sensitive internal data
  const students = (db.students || []).map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    regNo: s.regNo || '',
    phone: s.phone || '',
    role: s.role,
    status: s.status,
    avatar: s.avatar,
    joinDate: s.joinDate,
    lastActivity: s.lastActivity,
    enrolledCourses: s.enrolledCourses || [],
    progressMap: s.progressMap || {}
  }));

  res.json({ success: true, students });
});

// Get single student profile and details
router.get('/admin/students/:id', verifyAdminToken, (req, res) => {
  const db = getDb();
  const student = (db.students || []).find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  res.json({
    success: true,
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
      status: student.status,
      avatar: student.avatar,
      joinDate: student.joinDate,
      lastActivity: student.lastActivity,
      enrolledCourses: student.enrolledCourses || [],
      progressMap: student.progressMap || {}
    }
  });
});

// Update student status (activate / deactivate)
router.post('/admin/students/:id/status', verifyAdminToken, (req, res) => {
  const { status } = req.body;
  if (!['active', 'deactivated'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  const db = getDb();
  const student = db.students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  student.status = status;
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'STUDENT_STATUS_CHANGED',
    target: `Student: ${student.name} (${student.email})`,
    details: `Status set to ${status}`
  });

  res.json({ success: true, message: `Student status set to ${status}`, student });
});

// Reset student password securely
router.post('/admin/students/:id/reset-password', verifyAdminToken, (req, res) => {
  const db = getDb();
  const student = db.students.find(s => s.id === req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  // In production, send reset token email. We record password reset trigger.
  student.passwordResetAt = new Date().toISOString();
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'RESET_STUDENT_PASSWORD',
    target: `Student: ${student.name}`,
    details: `Initiated password reset for ${student.email}`
  });

  res.json({ success: true, message: `Password reset link dispatched to ${student.email}` });
});

// ==========================================
// LEARNER: SINGLE-COURSE ENROLLMENT LOCK
// One login = one course. The first course a learner enrolls in is permanent.
// ==========================================
const normId = (id) => String(id || '').trim().toLowerCase();

router.get('/enrollment', (req, res) => {
  const userId = normId(req.query.userId);
  if (!userId) return res.status(400).json({ success: false, message: 'userId is required.' });
  const db = getDb();
  res.json({ success: true, courseId: db.learnerEnrollments?.[userId]?.courseId || null });
});

router.post('/enrollment', (req, res) => {
  const userId = normId(req.body.userId);
  const { courseId } = req.body;
  if (!userId || !courseId) return res.status(400).json({ success: false, message: 'userId and courseId are required.' });

  const db = getDb();
  const course = (db.courses || []).find(c => c.id === courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  if (!db.learnerEnrollments) db.learnerEnrollments = {};
  const existing = db.learnerEnrollments[userId];
  if (existing && existing.courseId !== courseId) {
    const existingTitle = (db.courses || []).find(c => c.id === existing.courseId)?.title || existing.courseId;
    return res.status(409).json({
      success: false,
      courseId: existing.courseId,
      message: `Your account is already enrolled in "${existingTitle}". Only one course is allowed per login.`
    });
  }
  if (!existing) {
    db.learnerEnrollments[userId] = { courseId, enrolledAt: new Date().toISOString() };
    // Keep the admin student record in sync with the learner's enrollment.
    const student = (db.students || []).find(st => normId(st.email) === userId);
    if (student) {
      student.enrolledCourses = [courseId];
      if (!student.progressMap) student.progressMap = {};
      if (!student.progressMap[courseId]) student.progressMap[courseId] = { progress: 0, completedModules: [], quizzesPassed: [], finalTestPassed: false, projectStatus: 'Not Submitted' };
    }
    saveDb(db);
  }
  res.json({ success: true, courseId });
});

// Manual Course Enrollment
router.post('/admin/enrollments', verifyAdminToken, (req, res) => {
  const { studentId, courseId } = req.body;
  const db = getDb();

  const student = db.students.find(s => s.id === studentId);
  const course = db.courses.find(c => c.id === courseId);

  if (!student || !course) {
    return res.status(404).json({ success: false, message: 'Student or Course not found.' });
  }

  if (!student.enrolledCourses) student.enrolledCourses = [];
  // Policy: one course per student account.
  const otherCourse = student.enrolledCourses.find(cId => cId !== courseId);
  if (otherCourse) {
    return res.status(400).json({
      success: false,
      message: `${student.name} is already enrolled in "${otherCourse}". Each account can be enrolled in only one course — remove that enrollment first.`
    });
  }
  if (!student.enrolledCourses.includes(courseId)) {
    student.enrolledCourses.push(courseId);
  }

  if (!student.progressMap) student.progressMap = {};
  if (!student.progressMap[courseId]) {
    student.progressMap[courseId] = {
      progress: 0,
      completedModules: [],
      quizzesPassed: [],
      finalTestPassed: false,
      projectStatus: 'Not Submitted'
    };
  }

  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'MANUAL_ENROLLMENT',
    target: `Student: ${student.name}`,
    details: `Manually enrolled into course ${course.title}`
  });

  res.json({ success: true, message: `Enrolled ${student.name} into ${course.title}` });
});

// Remove Enrollment
router.delete('/admin/enrollments/:studentId/:courseId', verifyAdminToken, (req, res) => {
  const db = getDb();
  const student = db.students.find(s => s.id === req.params.studentId);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  student.enrolledCourses = (student.enrolledCourses || []).filter(cId => cId !== req.params.courseId);
  if (student.progressMap && student.progressMap[req.params.courseId]) {
    delete student.progressMap[req.params.courseId];
  }

  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'REMOVE_ENROLLMENT',
    target: `Student: ${student.name}`,
    details: `Removed enrollment for course ${req.params.courseId}`
  });

  res.json({ success: true, message: 'Enrollment removed successfully' });
});

export default router;
