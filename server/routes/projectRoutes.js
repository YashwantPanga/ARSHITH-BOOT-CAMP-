import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

// Get all project submissions
router.get('/admin/projects/submissions', verifyAdminToken, (req, res) => {
  const db = getDb();
  res.json({ success: true, submissions: db.projectSubmissions || [] });
});

// Review Project Submission
router.post('/admin/projects/submissions/:id/review', verifyAdminToken, (req, res) => {
  const { status, score, feedback } = req.body;
  const validStatuses = ['Approved', 'Rejected', 'Resubmission Required', 'Under Review'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid review status.' });
  }

  const db = getDb();
  const sub = (db.projectSubmissions || []).find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, message: 'Project submission not found.' });

  sub.status = status;
  sub.score = Number(score) || sub.score;
  sub.feedback = feedback || '';
  sub.reviewedAt = new Date().toISOString();

  if (!sub.history) sub.history = [];
  sub.history.push({
    status,
    timestamp: new Date().toISOString(),
    note: `Reviewed by admin with score ${score || 'N/A'}. Feedback: ${feedback || 'None'}`
  });

  // Update student progressMap project status
  const student = (db.students || []).find(s => s.id === sub.studentId);
  if (student && student.progressMap && student.progressMap[sub.courseId]) {
    student.progressMap[sub.courseId].projectStatus = status;
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

export default router;
