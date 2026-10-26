import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { GITHUB_REPO_RE, projectRequirement } from '../lib/projects.js';

const router = express.Router();

// Get all project submissions
router.get('/admin/projects/submissions', verifyAdminToken, (req, res) => {
  const db = getDb();
  res.json({ success: true, submissions: db.projectSubmissions || [] });
});

// Review Project Submission
router.post('/admin/projects/submissions/:id/review', verifyAdminToken, (req, res) => {
  const { status, score, feedback } = req.body;
  const validStatuses = ['Approved', 'Needs Revision', 'Under Review', 'Resubmission Required', 'Submitted', 'Rejected'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid review status. Allowed: ' + validStatuses.join(', ') });
  }

  const db = getDb();
  const sub = (db.projectSubmissions || []).find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: 'Project submission not found.' });

  // Normalize 'Resubmission Required' to 'Needs Revision' for clear UI consistency if needed
  sub.status = status;
  sub.score = score !== undefined && score !== '' ? Number(score) : sub.score;
  sub.feedback = feedback || '';
  sub.reviewedAt = new Date().toISOString();

  if (!sub.history) sub.history = [];
  sub.history.push({
    status,
    timestamp: new Date().toISOString(),
    note: `Reviewed by admin${score ? ` with score ${score}` : ''}. Feedback: ${feedback || 'None'}`
  });

  // Update student progressMap project status
  const normEmail = String(sub.userId || sub.studentEmail || '').toLowerCase();
  const student = (db.students || []).find(s => s.id === sub.studentId || String(s.email).toLowerCase() === normEmail);
  if (student) {
    if (!student.progressMap) student.progressMap = {};
    if (!student.progressMap[sub.courseId]) {
      student.progressMap[sub.courseId] = { progress: 0, completedModules: [], quizzesPassed: [], finalTestPassed: false, projectStatus: status };
    } else {
      student.progressMap[sub.courseId].projectStatus = status;
    }
  }

  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: `PROJECT_${status.toUpperCase()}`,
    target: `Project Submission: ${sub.id}`,
    details: `Reviewed submission for ${sub.studentName} (${sub.courseTitle}) -> ${status}`
  });

  res.json({ success: true, message: `Project submission updated to ${status}`, submission: sub });
});

// ==========================================
// LEARNER: SUBMIT A GITHUB REPOSITORY FOR A MINI PROJECT
// (previously these were kept only in the browser, so admins never saw them)
// ==========================================
router.post('/projects/submit', (req, res) => {
  const userId = String(req.body.userId || '').trim().toLowerCase();
  const { courseId, projectId } = req.body;
  const githubUrl = String(req.body.githubUrl || '').trim();
  const liveProjectUrl = String(req.body.liveProjectUrl || '').trim();
  if (!userId) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Your session has expired. Please sign in again.' });
  if (!courseId || !projectId) return res.status(400).json({ success: false, message: 'Choose a project before submitting.' });
  if (!GITHUB_REPO_RE.test(githubUrl)) {
    return res.status(400).json({ success: false, field: 'githubUrl', message: 'Enter the link to a public GitHub repository, e.g. https://github.com/your-name/project-name' });
  }
  if (liveProjectUrl && !/^https?:\/\/\S+$/.test(liveProjectUrl)) {
    return res.status(400).json({ success: false, field: 'liveProjectUrl', message: 'The live demo link must start with http:// or https://' });
  }

  const db = getDb();
  const course = (db.courses || []).find(c => c.id === courseId);
  const project = course?.projects?.find(p => p.id === projectId);
  if (!course || !project) return res.status(404).json({ success: false, message: 'Project not found.' });
  const enrolled = db.learnerEnrollments?.[userId]?.courseId;
  if (enrolled !== course.id) return res.status(403).json({ success: false, message: 'Enroll in this course before submitting its projects.' });

  if (!db.projectSubmissions) db.projectSubmissions = [];
  const learner = db.learners?.[userId];
  const now = new Date().toISOString();
  let sub = db.projectSubmissions.find(s => s.userId === userId && s.courseId === course.id && s.projectId === project.id);
  if (sub) {
    sub.githubUrl = githubUrl;
    sub.liveProjectUrl = liveProjectUrl;
    sub.status = 'Submitted';
    sub.submittedAt = now;
    sub.history = [...(sub.history || []), { status: 'Submitted', timestamp: now, note: 'Resubmitted by learner' }];
  } else {
    sub = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      studentId: learner?.learnerId || userId,
      studentName: learner?.name || userId,
      studentEmail: userId,
      courseId: course.id,
      courseTitle: course.title,
      projectId: project.id,
      projectTitle: project.title,
      status: 'Submitted',
      githubUrl,
      liveProjectUrl,
      submittedAt: now,
      score: null,
      feedback: '',
      history: [{ status: 'Submitted', timestamp: now, note: 'Submitted by learner' }]
    };
    db.projectSubmissions.unshift(sub);
  }
  saveDb(db);
  res.json({ success: true, submission: sub, requirement: projectRequirement(db, userId, course) });
});

router.get('/projects/mine', (req, res) => {
  const userId = String(req.query.userId || '').trim().toLowerCase();
  const db = getDb();
  const course = (db.courses || []).find(c => c.id === req.query.courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  const submissions = (db.projectSubmissions || []).filter(s => s.userId === userId && s.courseId === course.id);
  res.json({ success: true, submissions, requirement: projectRequirement(db, userId, course) });
});

export default router;
