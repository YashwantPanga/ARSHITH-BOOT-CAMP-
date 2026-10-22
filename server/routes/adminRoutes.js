import express from 'express';
import XLSX from 'xlsx';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { computeStudentDetails } from './studentRoutes.js';

const router = express.Router();

// Computed real application analytics
router.get('/admin/analytics', verifyAdminToken, (req, res) => {
  const db = getDb();
  const courses = db.courses || [];
  const rawStudents = [...(db.students || [])];
  const existingEmails = new Set(rawStudents.map(s => String(s.email).toLowerCase()));

  // Ensure any registered learners are included
  if (db.learners) {
    Object.values(db.learners).forEach(l => {
      const email = String(l.email).toLowerCase();
      if (!existingEmails.has(email)) {
        rawStudents.push({
          id: l.learnerId,
          name: l.name,
          email: l.email,
          regNo: l.regNo || '',
          phone: l.phone || '',
          role: 'Student',
          status: l.status || 'active',
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

  const enrichedStudents = rawStudents.map(s => computeStudentDetails(s, db));
  const certificates = db.certificates || [];
  const submissions = db.projectSubmissions || [];

  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === 'published').length;
  const draftCourses = courses.filter(c => c.status === 'draft').length;
  const archivedCourses = courses.filter(c => c.status === 'archived').length;

  // 1. Total Registered Students
  const totalStudents = enrichedStudents.length;
  // 2. Active Students
  const activeStudents = enrichedStudents.filter(s => s.status === 'active').length;
  // 3. Course Completions (students who have 100% progress or passed final in at least one course)
  const courseCompletions = enrichedStudents.filter(s =>
    s.progress === 100 || (s.enrolledCourseDetails || []).some(cd => cd.progress === 100 || cd.passedFinal)
  ).length;
  // 4. Projects Submitted
  const projectsSubmitted = submissions.length;
  // 5. Certificates Earned
  const certificatesEarned = certificates.filter(c => c.status === 'active').length;

  let totalEnrollments = 0;
  enrichedStudents.forEach(s => {
    totalEnrollments += (s.enrolledCourses || []).length;
  });

  const activeCertificates = certificatesEarned;
  const revokedCertificates = certificates.filter(c => c.status === 'revoked').length;

  const pendingSubmissions = submissions.filter(s => s.status === 'Submitted' || s.status === 'Under Review').length;
  const approvedSubmissions = submissions.filter(s => s.status === 'Approved').length;
  const needsRevisionSubmissions = submissions.filter(s => s.status === 'Needs Revision' || s.status === 'Resubmission Required').length;
  const rejectedSubmissions = submissions.filter(s => s.status === 'Rejected').length;

  // Breakdown by course
  const courseAnalytics = courses.map(c => {
    let enrolledCount = 0;
    let completedCount = 0;
    enrichedStudents.forEach(s => {
      const isEnrolled = (s.enrolledCourses || []).includes(c.id);
      if (isEnrolled) {
        enrolledCount += 1;
        const cDetail = (s.enrolledCourseDetails || []).find(cd => cd.courseId === c.id);
        if (cDetail && (cDetail.progress === 100 || cDetail.passedFinal)) {
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
      courseCompletions,
      projectsSubmitted,
      certificatesEarned,
      totalEnrollments,
      totalCertificates: certificates.length,
      activeCertificates,
      revokedCertificates,
      pendingSubmissions,
      approvedSubmissions,
      needsRevisionSubmissions,
      rejectedSubmissions
    },
    courseAnalytics
  });
});

// Export Student Data to Excel (.xlsx)
router.get('/admin/export/students', verifyAdminToken, (req, res) => {
  const db = getDb();
  const rawStudents = [...(db.students || [])];
  const existingEmails = new Set(rawStudents.map(s => String(s.email).toLowerCase()));

  if (db.learners) {
    Object.values(db.learners).forEach(l => {
      const email = String(l.email).toLowerCase();
      if (!existingEmails.has(email)) {
        rawStudents.push({
          id: l.learnerId,
          name: l.name,
          email: l.email,
          regNo: l.regNo || '',
          phone: l.phone || '',
          role: 'Student',
          status: l.status || 'active',
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

  let enriched = rawStudents.map(s => computeStudentDetails(s, db));

  // Apply optional query filters
  const { search, course, progress, projectStatus, certificateStatus } = req.query;
  if (search) {
    const q = String(search).toLowerCase().trim();
    enriched = enriched.filter(s =>
      String(s.name).toLowerCase().includes(q) ||
      String(s.email).toLowerCase().includes(q) ||
      String(s.id).toLowerCase().includes(q)
    );
  }
  if (course && course !== 'All') {
    enriched = enriched.filter(s =>
      (s.enrolledCourses || []).includes(course) || s.primaryCourse === course
    );
  }
  if (progress && progress !== 'All') {
    enriched = enriched.filter(s => s.progressStatus === progress);
  }
  if (projectStatus && projectStatus !== 'All') {
    enriched = enriched.filter(s => s.projectStatus === projectStatus);
  }
  if (certificateStatus && certificateStatus !== 'All') {
    enriched = enriched.filter(s => s.certificateStatus === certificateStatus);
  }

  // Build rows with exact 15 required columns:
  // - Student ID
  // - Student Name
  // - Email Address
  // - Enrollment Date
  // - Course Name
  // - Completion Percentage
  // - Completed Modules
  // - Total Modules
  // - Project Name
  // - GitHub Repository URL
  // - Project Submission Date
  // - Project Review Status
  // - Admin Feedback
  // - Certificate Status
  // - Certificate Issue Date
  const rows = [];
  enriched.forEach(s => {
    const courseDetails = s.enrolledCourseDetails || [];
    if (courseDetails.length === 0) {
      rows.push({
        'Student ID': s.id || 'N/A',
        'Student Name': s.name || 'N/A',
        'Email Address': s.email || 'N/A',
        'Enrollment Date': s.joinDate || 'N/A',
        'Course Name': 'None',
        'Completion Percentage': '0%',
        'Completed Modules': 0,
        'Total Modules': 0,
        'Project Name': 'None',
        'GitHub Repository URL': 'N/A',
        'Project Submission Date': 'N/A',
        'Project Review Status': 'Not Submitted',
        'Admin Feedback': '',
        'Certificate Status': 'Not Earned',
        'Certificate Issue Date': 'N/A'
      });
      return;
    }

    courseDetails.forEach(cd => {
      const subs = cd.projectSubmissions || [];
      if (subs.length === 0) {
        rows.push({
          'Student ID': s.id || 'N/A',
          'Student Name': s.name || 'N/A',
          'Email Address': s.email || 'N/A',
          'Enrollment Date': s.joinDate || 'N/A',
          'Course Name': cd.courseTitle || 'N/A',
          'Completion Percentage': `${cd.progress}%`,
          'Completed Modules': cd.completedModulesCount,
          'Total Modules': cd.totalModules,
          'Project Name': 'None',
          'GitHub Repository URL': 'N/A',
          'Project Submission Date': 'N/A',
          'Project Review Status': cd.projectStatus || 'Not Submitted',
          'Admin Feedback': '',
          'Certificate Status': cd.certificateStatus,
          'Certificate Issue Date': cd.certificateIssueDate ? new Date(cd.certificateIssueDate).toLocaleDateString() : 'N/A'
        });
      } else {
        subs.forEach(sub => {
          rows.push({
            'Student ID': s.id || 'N/A',
            'Student Name': s.name || 'N/A',
            'Email Address': s.email || 'N/A',
            'Enrollment Date': s.joinDate || 'N/A',
            'Course Name': cd.courseTitle || 'N/A',
            'Completion Percentage': `${cd.progress}%`,
            'Completed Modules': cd.completedModulesCount,
            'Total Modules': cd.totalModules,
            'Project Name': sub.projectTitle || sub.projectId || 'Course Project',
            'GitHub Repository URL': sub.githubUrl || 'N/A',
            'Project Submission Date': sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A',
            'Project Review Status': sub.status || 'Submitted',
            'Admin Feedback': sub.feedback || '',
            'Certificate Status': cd.certificateStatus,
            'Certificate Issue Date': cd.certificateIssueDate ? new Date(cd.certificateIssueDate).toLocaleDateString() : 'N/A'
          });
        });
      }
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Set nice column widths
  ws['!cols'] = [
    { wch: 18 }, // Student ID
    { wch: 22 }, // Student Name
    { wch: 28 }, // Email Address
    { wch: 15 }, // Enrollment Date
    { wch: 26 }, // Course Name
    { wch: 22 }, // Completion Percentage
    { wch: 18 }, // Completed Modules
    { wch: 15 }, // Total Modules
    { wch: 30 }, // Project Name
    { wch: 45 }, // GitHub Repository URL
    { wch: 22 }, // Project Submission Date
    { wch: 20 }, // Project Review Status
    { wch: 35 }, // Admin Feedback
    { wch: 18 }, // Certificate Status
    { wch: 22 }  // Certificate Issue Date
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Arshith_Bootcamp_Students_${dateStr}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
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
