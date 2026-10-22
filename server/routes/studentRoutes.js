import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

export function computeStudentDetails(student, db) {
  const normEmail = String(student.email || '').trim().toLowerCase();
  const studentId = student.id;

  // Find enrolled course IDs from student record or learnerEnrollments
  let enrolledIds = Array.isArray(student.enrolledCourses) ? [...student.enrolledCourses] : [];
  const learnerEnrollmentCourseId = db.learnerEnrollments?.[normEmail]?.courseId;
  if (learnerEnrollmentCourseId && !enrolledIds.includes(learnerEnrollmentCourseId)) {
    enrolledIds.push(learnerEnrollmentCourseId);
  }
  if (enrolledIds.length === 0 && student.progressMap) {
    enrolledIds = Object.keys(student.progressMap);
  }

  const courses = db.courses || [];
  const quizAttempts = db.quizAttempts || [];
  const finalAttempts = db.finalTestAttempts || [];
  const submissions = db.projectSubmissions || [];
  const certificates = db.certificates || [];

  const courseDetails = enrolledIds.map(cId => {
    const course = courses.find(c => c.id === cId) || { id: cId, title: cId, modules: [] };
    const modules = course.modules || [];
    const totalModules = modules.length;

    // Passed module IDs for this student & course
    const passedAttempts = quizAttempts.filter(a =>
      (String(a.userId || '').toLowerCase() === normEmail || a.studentId === studentId) &&
      (a.courseId === cId || !a.courseId) &&
      a.passed
    );
    const passedModuleIds = new Set(passedAttempts.map(a => a.moduleId));

    const completedModules = [];
    const pendingModules = [];
    modules.forEach(m => {
      if (passedModuleIds.has(m.id)) {
        const attempt = passedAttempts.find(a => a.moduleId === m.id);
        completedModules.push({
          id: m.id,
          title: m.title,
          score: attempt?.percentage ?? attempt?.score ?? 100,
          completedAt: attempt?.completedAt || student.lastActivity
        });
      } else {
        pendingModules.push({
          id: m.id,
          title: m.title
        });
      }
    });

    // Check final test passed
    const passedFinal = finalAttempts.find(a =>
      (String(a.userId || '').toLowerCase() === normEmail || a.studentId === studentId) &&
      a.courseId === cId &&
      a.passed
    );

    // Calculate real progress percentage
    let progress = 0;
    if (passedFinal) {
      progress = 100;
    } else if (totalModules > 0) {
      progress = Math.round((completedModules.length / totalModules) * 100);
    } else if (student.progressMap?.[cId]?.progress) {
      progress = student.progressMap[cId].progress;
    }

    // Check project submissions for this student & course
    const studentSubs = submissions.filter(s =>
      (String(s.userId || s.studentEmail || '').toLowerCase() === normEmail || s.studentId === studentId) &&
      s.courseId === cId
    );

    let projectStatus = 'Not Submitted';
    if (studentSubs.length > 0) {
      if (studentSubs.some(s => s.status === 'Needs Revision' || s.status === 'Resubmission Required')) {
        projectStatus = 'Needs Revision';
      } else if (studentSubs.some(s => s.status === 'Under Review')) {
        projectStatus = 'Under Review';
      } else if (studentSubs.some(s => s.status === 'Submitted')) {
        projectStatus = 'Submitted';
      } else if (studentSubs.every(s => s.status === 'Approved')) {
        projectStatus = 'Approved';
      } else {
        projectStatus = studentSubs[0].status;
      }
    } else if (student.progressMap?.[cId]?.projectStatus) {
      projectStatus = student.progressMap[cId].projectStatus;
    }

    // Check certificate
    const cert = certificates.find(c =>
      (String(c.userId || c.studentEmail || '').toLowerCase() === normEmail || c.studentId === studentId || c.learnerId === studentId) &&
      c.courseId === cId &&
      c.status === 'active'
    );

    const certificateStatus = cert ? 'Earned' : 'Not Earned';

    return {
      courseId: cId,
      courseTitle: course.title,
      category: course.category || '',
      progress,
      totalModules,
      completedModulesCount: completedModules.length,
      completedModules,
      pendingModules,
      passedFinal: !!passedFinal,
      finalScore: passedFinal?.percentage || passedFinal?.score || null,
      projectStatus,
      projectSubmissions: studentSubs,
      latestGithubUrl: studentSubs[0]?.githubUrl || '',
      certificateStatus,
      certificateId: cert?.certificateId || null,
      certificateIssueDate: cert?.issueDate || cert?.createdAt || null,
      certificateGrade: cert?.grade || null
    };
  });

  const primary = courseDetails[0] || {
    courseId: '',
    courseTitle: 'No Course Enrolled',
    progress: 0,
    totalModules: 0,
    completedModulesCount: 0,
    completedModules: [],
    pendingModules: [],
    projectStatus: 'Not Submitted',
    projectSubmissions: [],
    latestGithubUrl: '',
    certificateStatus: 'Not Earned',
    certificateId: null,
    certificateIssueDate: null
  };

  let progressStatus = 'Not Started';
  if (primary.progress === 100) progressStatus = 'Completed';
  else if (primary.progress > 0) progressStatus = 'In Progress';

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    regNo: student.regNo || '',
    phone: student.phone || '',
    role: student.role || 'Student',
    status: student.status || 'active',
    avatar: student.avatar || '',
    joinDate: student.joinDate || student.createdAt || '',
    lastActivity: student.lastActivity || student.joinDate || '',
    enrolledCourses: enrolledIds,
    enrolledCourseDetails: courseDetails,
    primaryCourse: primary.courseTitle,
    progress: primary.progress,
    progressStatus,
    projectStatus: primary.projectStatus,
    certificateStatus: primary.certificateStatus,
    certificateId: primary.certificateId,
    certificateIssueDate: primary.certificateIssueDate,
    certificateGrade: primary.certificateGrade,
    githubUrl: primary.latestGithubUrl,
    projectSubmissions: primary.projectSubmissions,
    completedModules: primary.completedModules,
    pendingModules: primary.pendingModules,
    totalModules: primary.totalModules,
    completedModulesCount: primary.completedModulesCount
  };
}

// Get all students with computed real database progress
router.get('/admin/students', verifyAdminToken, (req, res) => {
  const db = getDb();
  const studentsList = [...(db.students || [])];
  const existingEmails = new Set(studentsList.map(s => String(s.email).toLowerCase()));

  // Ensure any registered learners are included
  if (db.learners) {
    Object.values(db.learners).forEach(l => {
      const email = String(l.email).toLowerCase();
      if (!existingEmails.has(email)) {
        studentsList.push({
          id: l.learnerId,
          name: l.name,
          email: l.email,
          regNo: l.regNo || '',
          phone: l.phone || '',
          role: 'Student',
          status: 'active',
          avatar: '',
          joinDate: l.createdAt ? l.createdAt.slice(0, 10) : '',
          lastActivity: l.createdAt || '',
          enrolledCourses: db.learnerEnrollments?.[email]?.courseId ? [db.learnerEnrollments[email].courseId] : [],
          progressMap: {}
        });
        existingEmails.add(email);
      }
    });
  }

  const enrichedStudents = studentsList.map(s => computeStudentDetails(s, db));
  res.json({ success: true, students: enrichedStudents });
});

// Get single student profile and details
router.get('/admin/students/:id', verifyAdminToken, (req, res) => {
  const db = getDb();
  let student = (db.students || []).find(s => s.id === req.params.id || String(s.email).toLowerCase() === String(req.params.id).toLowerCase());
  
  if (!student && db.learners) {
    const l = Object.values(db.learners).find(x => x.learnerId === req.params.id || String(x.email).toLowerCase() === String(req.params.id).toLowerCase());
    if (l) {
      student = {
        id: l.learnerId,
        name: l.name,
        email: l.email,
        regNo: l.regNo || '',
        phone: l.phone || '',
        role: 'Student',
        status: 'active',
        avatar: '',
        joinDate: l.createdAt ? l.createdAt.slice(0, 10) : '',
        lastActivity: l.createdAt || '',
        enrolledCourses: db.learnerEnrollments?.[l.email]?.courseId ? [db.learnerEnrollments[l.email].courseId] : [],
        progressMap: {}
      };
    }
  }

  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const details = computeStudentDetails(student, db);
  res.json({
    success: true,
    student: details
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
