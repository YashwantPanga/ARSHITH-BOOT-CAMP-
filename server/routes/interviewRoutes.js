import express from 'express';
import { getDb, saveDb } from '../db.js';
import { findInterviewItem, findInterviewSet } from '../../shared/interview/index.js';

// Interview Prep progress: which problems a learner has solved (or questions marked as known).
// The answers are checked in the browser, so this is practice credit only - it never counts towards
// a certificate. Stored as db.interviewProgress[email][setId][itemId] = ISO date.
// A learner may also commit to a daily plan per set: db.interviewPlans[email][setId] =
// { perDay, days (0 = Sunday ... 6 = Saturday), startedAt }.
// Interview Prep unlocks once the learner holds active (not revoked) certificates for 4 different courses.
const router = express.Router();

export const INTERVIEW_CERTIFICATES_REQUIRED = 4;
export const INTERVIEW_LOCKED_MESSAGE = `Interview Prep unlocks after you earn ${INTERVIEW_CERTIFICATES_REQUIRED} CodeLekho certificates.`;

/** Number of different courses the learner holds an active certificate for. */
export function certificateCount(db, email) {
  const id = String(email || '').trim().toLowerCase();
  if (!id) return 0;
  const courses = (db.certificates || [])
    .filter(c => String(c.userId || '').trim().toLowerCase() === id && c.status === 'active')
    .map(c => c.courseId);
  return new Set(courses).size;
}

export function interviewUnlocked(db, email) {
  return certificateCount(db, email) >= INTERVIEW_CERTIFICATES_REQUIRED;
}

/** Learners without a certificate may not record progress; admins (no learner session) pass. */
function lockedFor(req, db) {
  return req.learnerEmail && !interviewUnlocked(db, req.learnerEmail);
}

router.get('/interview/progress', (req, res) => {
  const db = getDb();
  const unlocked = !req.learnerEmail || interviewUnlocked(db, req.learnerEmail);
  const certificates = { earned: certificateCount(db, req.learnerEmail), required: INTERVIEW_CERTIFICATES_REQUIRED };
  res.json({ success: true, unlocked, certificates, progress: db.interviewProgress?.[req.query.userId] || {}, plans: db.interviewPlans?.[req.query.userId] || {} });
});

router.post('/interview/solved', (req, res) => {
  const { userId, setId, itemId, solved = true } = req.body || {};
  if (!findInterviewItem(setId, itemId)) return res.status(404).json({ success: false, message: 'Problem not found.' });
  const db = getDb();
  if (lockedFor(req, db)) return res.status(403).json({ success: false, code: 'INTERVIEW_LOCKED', message: INTERVIEW_LOCKED_MESSAGE });
  if (!db.interviewProgress) db.interviewProgress = {};
  const mine = (db.interviewProgress[userId] ||= {});
  const set = (mine[setId] ||= {});
  if (solved && !set[itemId]) set[itemId] = new Date().toISOString();
  if (!solved) delete set[itemId];
  saveDb(db);
  res.json({ success: true, progress: mine });
});

router.post('/interview/plan', (req, res) => {
  const { userId, setId, perDay, days, clear = false } = req.body || {};
  if (!findInterviewSet(setId)) return res.status(404).json({ success: false, message: 'Study plan not found.' });
  const db = getDb();
  if (lockedFor(req, db)) return res.status(403).json({ success: false, code: 'INTERVIEW_LOCKED', message: INTERVIEW_LOCKED_MESSAGE });
  if (!db.interviewPlans) db.interviewPlans = {};
  const mine = (db.interviewPlans[userId] ||= {});
  if (clear) {
    delete mine[setId];
  } else {
    const n = Number(perDay);
    const weekdays = [...new Set((Array.isArray(days) ? days : []).map(Number))].filter(d => Number.isInteger(d) && d >= 0 && d <= 6).sort();
    if (!Number.isInteger(n) || n < 1 || n > 10) return res.status(400).json({ success: false, message: 'Choose between 1 and 10 problems a day.' });
    if (!weekdays.length) return res.status(400).json({ success: false, message: 'Pick at least one day of the week.' });
    mine[setId] = { perDay: n, days: weekdays, startedAt: mine[setId]?.startedAt || new Date().toISOString() };
  }
  saveDb(db);
  res.json({ success: true, plans: mine });
});

export default router;
