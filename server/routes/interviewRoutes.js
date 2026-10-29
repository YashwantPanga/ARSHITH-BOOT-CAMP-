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

export default router;
