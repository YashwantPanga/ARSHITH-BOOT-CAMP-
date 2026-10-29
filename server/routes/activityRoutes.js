import express from 'express';
import { getDb, saveDb } from '../db.js';
import { activeDays, dayKey, recordActivity, streakSummary } from '../lib/streak.js';

// Daily coding streak: the site reports when a learner runs code, the dashboard reads the streak.
const router = express.Router();
const KINDS = new Set(['code', 'practice', 'interview', 'quiz']);

router.post('/activity', (req, res) => {
  const { userId, kind = 'code' } = req.body || {};
  const db = getDb();
  const newToday = !activeDays(db, userId).has(dayKey());   // first coding of the day: the streak grows
  recordActivity(db, userId, KINDS.has(kind) ? kind : 'code');
  saveDb(db);
  res.json({ success: true, newToday, streak: streakSummary(db, userId) });
});

router.get('/activity/streak', (req, res) => {
  res.json({ success: true, streak: streakSummary(getDb(), req.query.userId) });
});

export default router;
