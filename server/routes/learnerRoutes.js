import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb, saveDb } from '../db.js';
import { signLearnerToken } from '../middleware/learnerAuth.js';

// Learner accounts live on the server (previously they were only in the browser's localStorage,
// with plain-text passwords, so a learner could not sign in from another device).
const router = express.Router();

const normEmail = (e) => String(e || '').trim().toLowerCase();
const normReg = (r) => String(r || '').trim().toUpperCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** ARB-STU-7KQ2M9 – unique learner id, also printed on certificates. */
function makeLearnerId(db) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const taken = new Set(Object.values(db.learners || {}).map(l => l.learnerId));
  for (;;) {
    let s = '';
    for (const b of crypto.randomBytes(6)) s += alphabet[b % alphabet.length];
    const id = `ARB-STU-${s}`;
    if (!taken.has(id)) return id;
  }
}

function publicLearner(db, l) {
  const enrolled = db.learnerEnrollments?.[l.email]?.courseId;
  return {
    learnerId: l.learnerId,
    name: l.name,
    email: l.email,
    regNo: l.regNo,
    phone: l.phone,
    createdAt: l.createdAt,
    enrolledCourseIds: enrolled ? [enrolled] : []
  };
}

// Simple in-memory brute-force guard per email
const attempts = new Map();

router.post('/learners/register', (req, res) => {
  const email = normEmail(req.body.email);
  const regNo = normReg(req.body.regNo);
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');

  if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  if (name.length < 2) return res.status(400).json({ success: false, message: 'Please enter your full name.' });
  if (!/^[A-Z0-9-]{4,20}$/.test(regNo)) return res.status(400).json({ success: false, message: 'Registration number must be 4–20 letters, digits or hyphens.' });
  if (phone.replace(/\D/g, '').length < 10) return res.status(400).json({ success: false, message: 'Please enter a valid phone number (at least 10 digits).' });
  if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

  const db = getDb();
  if (!db.learners) db.learners = {};
  if (db.learners[email]) return res.status(409).json({ success: false, field: 'email', message: 'An account with this email already exists. Please log in instead.' });
  if (Object.values(db.learners).some(l => l.regNo === regNo)) {
    return res.status(409).json({ success: false, field: 'regNo', message: 'This registration number is already registered to another account.' });
  }

  const learner = {
    learnerId: makeLearnerId(db),
    email,
    name,
    regNo,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString()
  };
  db.learners[email] = learner;

  // Mirror into the admin "students" list so registrations show up in the admin portal.
  if (!db.students) db.students = [];
  if (!db.students.some(s => normEmail(s.email) === email)) {
    db.students.unshift({
      id: learner.learnerId,
      name,
      email,
      regNo,
      phone,
      role: 'Student',
      status: 'active',
      avatar: '',
      joinDate: learner.createdAt.slice(0, 10),
      lastActivity: learner.createdAt,
      enrolledCourses: db.learnerEnrollments?.[email]?.courseId ? [db.learnerEnrollments[email].courseId] : [],
      progressMap: {}
    });
  }
  saveDb(db);
  res.status(201).json({ success: true, learner: publicLearner(db, learner), token: signLearnerToken(email) });
});

router.post('/learners/login', (req, res) => {
  const email = normEmail(req.body.email);
  const regNo = normReg(req.body.regNo);
  const password = String(req.body.password || '');
  if (!email || !regNo || !password) return res.status(400).json({ success: false, message: 'Email, registration number and password are required.' });

  const a = attempts.get(email) || { count: 0, until: 0 };
  if (Date.now() < a.until) {
    return res.status(429).json({ success: false, message: `Too many attempts. Try again in ${Math.ceil((a.until - Date.now()) / 1000)} seconds.` });
  }

  const db = getDb();
  const learner = db.learners?.[email];
  if (!learner) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'No account found for this email. Please register first.' });

  const fail = (message) => {
    a.count += 1;
    if (a.count >= 6) { a.until = Date.now() + 5 * 60 * 1000; a.count = 0; }
    attempts.set(email, a);
    return res.status(401).json({ success: false, message });
  };
  if (learner.regNo !== regNo) return fail('Registration number does not match this account.');
  if (!bcrypt.compareSync(password, learner.passwordHash)) return fail('Incorrect password. Please try again.');

  attempts.delete(email);
  const student = (db.students || []).find(s => normEmail(s.email) === email);
  if (student) {
    if (String(student.status || '').toLowerCase() === 'deactivated') return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact support.' });
    student.lastActivity = new Date().toISOString();
    saveDb(db);
  }
  res.json({ success: true, learner: publicLearner(db, learner), token: signLearnerToken(email) });
});

// Contact form – messages are stored for the admin team (previously the form only pretended to send).
router.post('/contact', (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 120);
  const email = normEmail(req.body.email);
  const message = String(req.body.message || '').trim().slice(0, 5000);
  if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 5) {
    return res.status(400).json({ success: false, message: 'Please provide your name, a valid email and a message.' });
  }
  const db = getDb();
  if (!db.contactMessages) db.contactMessages = [];
  db.contactMessages.unshift({ id: `msg-${Date.now()}`, name, email, message, createdAt: new Date().toISOString(), status: 'new' });
  saveDb(db);
  res.status(201).json({ success: true });
});

export default router;
