import express from 'express';
import { getDb, saveDb } from '../db.js';
import { findInterviewItem } from '../../shared/interview/index.js';

// Interview Prep progress: which problems a learner has solved (or questions marked as known).
// The answers are checked in the browser, so this is practice credit only - it never counts towards
// a certificate. Stored as db.interviewProgress[email][setId][itemId] = ISO date.
const router = express.Router();

router.get('/interview/progress', (req, res) => {
  const db = getDb();
  res.json({ success: true, progress: db.interviewProgress?.[req.query.userId] || {} });
});

router.post('/interview/solved', (req, res) => {
  const { userId, setId, itemId, solved = true } = req.body || {};
  if (!findInterviewItem(setId, itemId)) return res.status(404).json({ success: false, message: 'Problem not found.' });
  const db = getDb();
  if (!db.interviewProgress) db.interviewProgress = {};
  const mine = (db.interviewProgress[userId] ||= {});
  const set = (mine[setId] ||= {});
  if (solved && !set[itemId]) set[itemId] = new Date().toISOString();
  if (!solved) delete set[itemId];
  saveDb(db);
  res.json({ success: true, progress: mine });
});

// Top learners of the last 7 days for one plan (public): first name and initial only.
router.get('/interview/leaderboard/:setId', (req, res) => {
  const db = getDb();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const rows = Object.entries(db.interviewProgress || {})
    .map(([email, sets]) => ({ email, solved: Object.values(sets[req.params.setId] || {}).filter(d => d >= since).length }))
    .filter(r => r.solved > 0)
    .sort((a, b) => b.solved - a.solved)
    .slice(0, 5)
    .map(({ email, solved }) => {
      const [first = 'Learner', last = ''] = String(db.learners?.[email]?.name || 'Learner').trim().split(/\s+/);
      return { name: last ? `${first} ${last[0]}.` : first, solved };
    });
  res.json({ success: true, leaders: rows });
});

export default router;
