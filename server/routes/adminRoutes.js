import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

// Computed real application analytics
router.get('/admin/analytics', verifyAdminToken, (req, res) => {
  const db = getDb();
  const courses = db.courses || [];
  const students = db.students || [];
  const certificates = db.certificates || [];
  const submissions = db.projectSubmissions || [];

  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === 'published').length;
  const draftCourses = courses.filter(c => c.status === 'draft').length;
  const archivedCourses = courses.filter(c => c.status === 'archived').length;

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  
  let totalEnrollments = 0;
  students.forEach(s => {
    totalEnrollments += (s.enrolledCourses || []).length;
  });

  const totalCertificates = certificates.length;
  const activeCertificates = certificates.filter(c => c.status === 'active').length;
  const revokedCertificates = certificates.filter(c => c.status === 'revoked').length;

  const pendingSubmissions = submissions.filter(s => s.status === 'Submitted' || s.status === 'Under Review').length;
  const approvedSubmissions = submissions.filter(s => s.status === 'Approved').length;
  const rejectedSubmissions = submissions.filter(s => s.status === 'Rejected').length;

  // Breakdown by course
  const courseAnalytics = courses.map(c => {
    let enrolledCount = 0;
    let completedCount = 0;
    students.forEach(s => {
      if (s.enrolledCourses && s.enrolledCourses.includes(c.id)) {
        enrolledCount += 1;
        const prog = s.progressMap && s.progressMap[c.id];
        if (prog && prog.progress === 100) {
          completedCount += 1;
        }
      }
    });

    return {
      courseId: c.id,
      title: c.title,
      category: c.category,
      price: c.price,
      enrolledCount,
      completedCount,
      completionRate: enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0
    };
  });

  res.json({
    success: true,
    overview: {
      totalCourses,
      publishedCourses,
      draftCourses,
      archivedCourses,
      totalStudents,
      activeStudents,
      totalEnrollments,
      totalCertificates,
      activeCertificates,
      revokedCertificates,
      pendingSubmissions,
      approvedSubmissions,
      rejectedSubmissions
    },
    courseAnalytics
  });
});

// Get Audit / Activity Logs
router.get('/admin/activity-logs', verifyAdminToken, (req, res) => {
  const db = getDb();
  res.json({ success: true, logs: db.activityLogs || [] });
});

// Update Admin Profile (name / email)
router.put('/admin/profile', verifyAdminToken, (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const db = getDb();
  db.admin.name = name.trim();
  db.admin.email = email.trim();
  saveDb(db);

  logActivity({
    adminId: db.admin.adminId,
    action: 'UPDATE_PROFILE',
    target: 'Admin Profile',
    details: `Updated admin profile: ${name} (${email})`
  });

  res.json({ success: true, message: 'Admin profile updated successfully', admin: db.admin });
});

export default router;
