import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb, saveDb, logActivity } from '../db.js';
import { signLearnerToken, learnerFromRequest } from '../middleware/learnerAuth.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { KNOWN_DEFAULT_PASSWORDS } from './authRoutes.js';
import { sendMail, devCodesAllowed, smtpConfigured } from '../lib/mailer.js';
import { verificationEmail, resetEmail, passwordChangedEmail } from '../lib/emailTemplates.js';
import { publicBase, isEmailSafeUrl } from '../lib/publicUrl.js';

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
    enrolledCourseIds: enrolled ? [enrolled] : [],
    // the name is printed on certificates, so it cannot be edited once one exists
    nameLocked: (db.certificates || []).some(c => normEmail(c.userId) === l.email && c.status !== 'revoked')
  };
}

// Simple in-memory brute-force guard per email
const attempts = new Map();

/* ---------- one-time codes (email verification & password reset) ---------- */
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const sixDigits = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

/** Creates a code + link token, stores only their hashes, returns the plain values. */
function issueOneTimeCode(learner, field, ttl) {
  const code = sixDigits();
  const token = crypto.randomBytes(32).toString('hex');
  learner[field] = { codeHash: sha(`${learner.email}:${code}`), tokenHash: sha(token), expiresAt: Date.now() + ttl, attempts: 0, sentAt: Date.now() };
  return { code, token };
}

/** Checks a code or link token against the stored record. Returns 'ok' | 'expired' | 'invalid' | 'locked'. */
function checkOneTimeCode(learner, field, { code, token }) {
  const rec = learner[field];
  if (!rec) return 'invalid';
  if (Date.now() > rec.expiresAt) return 'expired';
  if (rec.attempts >= MAX_CODE_ATTEMPTS) return 'locked';
  const ok = (token && sha(token) === rec.tokenHash) || (code && sha(`${learner.email}:${String(code).trim()}`) === rec.codeHash);
  if (!ok) { rec.attempts += 1; return rec.attempts >= MAX_CODE_ATTEMPTS ? 'locked' : 'invalid'; }
  return 'ok';
}

const CODE_MESSAGES = {
  expired: 'This code has expired. Request a new one.',
  invalid: 'That code is not correct. Check the latest email and try again.',
  locked: 'Too many incorrect attempts. Request a new code.'
};

/** Creates a new verification code on the learner (caller saves the db), returns the email to send. */
function issueVerification(req, learner) {
  const { code, token } = issueOneTimeCode(learner, 'emailVerification', VERIFY_TTL_MS);
  const link = `${publicBase(req).publicUrl}/verify-email?email=${encodeURIComponent(learner.email)}&token=${token}`;
  return { mail: { to: learner.email, ...verificationEmail({ name: learner.name, code, link: isEmailSafeUrl(link) ? link : null }) }, devCode: devCodesAllowed() ? code : undefined };
}

const mailStatus = (result) => (result.delivered ? 'sent' : result.mode === 'outbox' ? 'outbox' : 'failed');

/**
 * Sends an email. With real SMTP it goes out in the background (Gmail takes ~3-5 s to accept a message),
 * so the page responds immediately; failures are logged. Without SMTP it is saved to the outbox first.
 */
async function dispatchMail(mail) {
  if (!smtpConfigured()) return mailStatus(await sendMail(mail));
  sendMail(mail).then(r => { if (!r.delivered) console.error(`[mail] "${mail.subject}" to ${mail.to} was not delivered: ${r.error}`); });
  return 'sending';
}

router.post('/learners/register', async (req, res) => {
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
    createdAt: new Date().toISOString(),
    emailVerified: false
  };
  db.learners[email] = learner;
  // The account stays inactive until the email address is verified with the emailed code.
  const { mail, devCode } = issueVerification(req, learner);

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

  const emailStatus = await dispatchMail(mail);
  res.status(201).json({
    success: true,
    verificationRequired: true,
    email,
    emailStatus,
    ...(devCode ? { devCode } : {}),
    message: emailStatus === 'outbox' || emailStatus === 'failed' ? 'Your account was created, but email is not configured on this server yet.' : `We sent a 6-digit code to ${email}.`
  });
});

router.post('/learners/verify-email', (req, res) => {
  const email = normEmail(req.body.email);
  const db = getDb();
  const learner = db.learners?.[email];
  if (!learner) return res.status(400).json({ success: false, message: CODE_MESSAGES.invalid });
  if (learner.emailVerified !== false) {
    return res.json({ success: true, alreadyVerified: true, learner: publicLearner(db, learner), token: signLearnerToken(email) });
  }
  const verdict = checkOneTimeCode(learner, 'emailVerification', { code: req.body.code, token: req.body.token });
  if (verdict !== 'ok') { saveDb(db); return res.status(400).json({ success: false, code: verdict.toUpperCase(), message: CODE_MESSAGES[verdict] }); }
  learner.emailVerified = true;
  learner.emailVerifiedAt = new Date().toISOString();
  delete learner.emailVerification;
  saveDb(db);
  res.json({ success: true, learner: publicLearner(db, learner), token: signLearnerToken(email) });
});

router.post('/learners/resend-verification', async (req, res) => {
  const email = normEmail(req.body.email);
  const db = getDb();
  const learner = db.learners?.[email];
  const generic = { success: true, message: 'If this account still needs verification, a new code has been sent.' };
  if (!learner || learner.emailVerified !== false) return res.json(generic);
  const last = learner.emailVerification?.sentAt || 0;
  if (Date.now() - last < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ success: false, message: `Please wait ${Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - last)) / 1000)} seconds before requesting another code.` });
  }
  const { mail, devCode } = issueVerification(req, learner);
  saveDb(db);
  res.json({ ...generic, emailStatus: await dispatchMail(mail), ...(devCode ? { devCode } : {}) });
});

/* ---------- forgot / reset password ---------- */
router.post('/learners/forgot-password', async (req, res) => {
  const email = normEmail(req.body.email);
  // Same response whether or not the account exists, so emails cannot be enumerated.
  const generic = { success: true, message: 'If an account exists for this email, we have sent a password reset code.' };
  if (!EMAIL_RE.test(email)) return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  const db = getDb();
  const learner = db.learners?.[email];
  if (!learner) return res.json(generic);
  const last = learner.passwordReset?.sentAt || 0;
  if (Date.now() - last < RESEND_COOLDOWN_MS) return res.json(generic);
  const { code, token } = issueOneTimeCode(learner, 'passwordReset', RESET_TTL_MS);
  saveDb(db);
  const link = `${publicBase(req).publicUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
  const emailStatus = await dispatchMail({ to: email, ...resetEmail({ name: learner.name, code, link: isEmailSafeUrl(link) ? link : null }) });
  res.json({ ...generic, emailStatus, ...(devCodesAllowed() ? { devCode: code } : {}) });
});

router.post('/learners/reset-password', async (req, res) => {
  const email = normEmail(req.body.email);
  const password = String(req.body.password || '');
  if (password.length < 6) return res.status(400).json({ success: false, field: 'password', message: 'Password must be at least 6 characters.' });
  const db = getDb();
  const learner = db.learners?.[email];
  if (!learner) return res.status(400).json({ success: false, message: CODE_MESSAGES.invalid });
  const verdict = checkOneTimeCode(learner, 'passwordReset', { code: req.body.code, token: req.body.token });
  if (verdict !== 'ok') { saveDb(db); return res.status(400).json({ success: false, code: verdict.toUpperCase(), message: CODE_MESSAGES[verdict] }); }
  learner.passwordHash = bcrypt.hashSync(password, 10);
  learner.passwordChangedAt = new Date().toISOString(); // signs out every existing session
  delete learner.passwordReset;
  // Receiving the reset code proves ownership of the address.
  if (learner.emailVerified === false) { learner.emailVerified = true; learner.emailVerifiedAt = learner.passwordChangedAt; delete learner.emailVerification; }
  saveDb(db);
  attempts.delete(email);
  sendMail({ to: email, ...passwordChangedEmail({ name: learner.name }) }).catch(() => {});
  res.json({ success: true, message: 'Your password has been changed. Please sign in with your new password.' });
});

// Every failed sign-in gets this same answer and status, whatever was wrong.
const LOGIN_FAILED = 'Incorrect email, registration number or password.';
// Compared against when there is no account, so every attempt costs one password check.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
// Failed sign-ins per address (email lockout above is per account; this one slows spraying many emails).
const ipFails = new Map();
const IP_LIMIT = 20, IP_WINDOW_MS = 15 * 60 * 1000;

const adminEmail = (db) => normEmail(process.env.ADMIN_EMAIL || db.admin?.email || '');

router.post('/learners/login', (req, res) => {
  const email = normEmail(req.body.email);
  const regNo = normReg(req.body.regNo);
  const password = String(req.body.password || '');
  const ip = req.ip || '0.0.0.0';

  const a = attempts.get(email) || { count: 0, until: 0 };
  const ipA = ipFails.get(ip);
  if (Date.now() < a.until || (ipA && ipA.count >= IP_LIMIT && Date.now() - ipA.since < IP_WINDOW_MS)) {
    return res.status(429).json({ success: false, message: 'Too many attempts. Please wait a few minutes and try again.' });
  }

  const fail = () => {
    a.count += 1;
    if (a.count >= 6) { a.until = Date.now() + 5 * 60 * 1000; a.count = 0; }
    if (email) attempts.set(email, a);
    const cur = ipFails.get(ip);
    ipFails.set(ip, cur && Date.now() - cur.since < IP_WINDOW_MS ? { count: cur.count + 1, since: cur.since } : { count: 1, since: Date.now() });
    return res.status(401).json({ success: false, message: LOGIN_FAILED });
  };

  const db = getDb();
  const admin = db.admin;
  const isAdmin = !!email && !!admin?.passwordHash && email === adminEmail(db);
  const learner = isAdmin ? null : db.learners?.[email];

  // exactly one password comparison on every path
  let passwordOk = false;
  try { passwordOk = bcrypt.compareSync(password, isAdmin ? admin.passwordHash : (learner?.passwordHash || DUMMY_HASH)); } catch { passwordOk = false; }
  if (!email || !password) return fail();

  if (isAdmin) {
    // the admin needs no registration number
    if (!passwordOk || KNOWN_DEFAULT_PASSWORDS.includes(password)) return fail();
    attempts.delete(email);
    ipFails.delete(ip);
    admin.lastLogin = new Date().toISOString();
    saveDb(db);
    logActivity({ adminId: admin.adminId, action: 'ADMIN_LOGIN', target: 'Portal', details: 'Signed in', ipAddress: ip, device: req.headers['user-agent'] || 'Browser' });
    const staffToken = jwt.sign({ adminId: admin.adminId, role: admin.role, name: admin.name }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, learner: { name: admin.name, email: admin.email, staff: true }, token: null, staffToken });
  }

  if (!learner || !passwordOk || !regNo || learner.regNo !== regNo) return fail();

  attempts.delete(email);
  ipFails.delete(ip);
  if (learner.emailVerified === false) {
    return res.status(403).json({ success: false, code: 'EMAIL_NOT_VERIFIED', email, message: 'Please verify your email address first. Enter the 6-digit code we emailed you.' });
  }
  const student = (db.students || []).find(s => normEmail(s.email) === email);
  if (student) {
    if (String(student.status || '').toLowerCase() === 'deactivated') return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact support.' });
    student.lastActivity = new Date().toISOString();
    saveDb(db);
  }
  res.json({ success: true, learner: publicLearner(db, learner), token: signLearnerToken(email) });
});

/* ---------- my profile (signed-in learner) ---------- */
// Name, registration number and phone can be changed; the email is the account itself. The name is
// printed on certificates and checked against the photo ID, so it is locked once a certificate exists.
router.put('/learners/me', (req, res) => {
  const email = learnerFromRequest(req);
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in again.' });
  const db = getDb();
  const learner = db.learners?.[email];
  if (!learner) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in again.' });

  const name = req.body.name === undefined ? learner.name : String(req.body.name).trim().replace(/\s+/g, ' ');
  const regNo = req.body.regNo === undefined ? learner.regNo : normReg(req.body.regNo);
  const phone = req.body.phone === undefined ? learner.phone : String(req.body.phone).trim();
  if (name.length < 2) return res.status(400).json({ success: false, field: 'name', message: 'Please enter your full name.' });
  if (!/^[A-Z0-9-]{4,20}$/.test(regNo)) return res.status(400).json({ success: false, field: 'regNo', message: 'Registration number must be 4–20 letters, digits or hyphens.' });
  if (phone.replace(/\D/g, '').length < 10) return res.status(400).json({ success: false, field: 'phone', message: 'Please enter a valid phone number (at least 10 digits).' });
  if (regNo !== learner.regNo && Object.values(db.learners).some(l => l.email !== email && l.regNo === regNo)) {
    return res.status(409).json({ success: false, field: 'regNo', message: 'This registration number is already registered to another account.' });
  }
  const hasCertificate = (db.certificates || []).some(c => normEmail(c.userId) === email && c.status !== 'revoked');
  if (name !== learner.name && hasCertificate) {
    return res.status(409).json({ success: false, field: 'name', message: 'Your name is printed on your certificate, so it can no longer be changed here. Contact us if it is wrong.' });
  }

  Object.assign(learner, { name, regNo, phone, updatedAt: new Date().toISOString() });
  const student = (db.students || []).find(s => normEmail(s.email) === email);
  if (student) Object.assign(student, { name, regNo, phone });
  saveDb(db);
  res.json({ success: true, message: 'Your profile has been updated.', learner: { ...publicLearner(db, learner), nameLocked: hasCertificate } });
});

router.post('/learners/change-password', (req, res) => {
  const email = learnerFromRequest(req);
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in again.' });
  const db = getDb();
  const learner = db.learners?.[email];
  if (!learner) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in again.' });
  const current = String(req.body.currentPassword || '');
  const next = String(req.body.newPassword || '');
  if (!bcrypt.compareSync(current, learner.passwordHash)) return res.status(400).json({ success: false, field: 'currentPassword', message: 'Your current password is not correct.' });
  if (next.length < 6) return res.status(400).json({ success: false, field: 'newPassword', message: 'The new password must be at least 6 characters.' });
  if (next === current) return res.status(400).json({ success: false, field: 'newPassword', message: 'Choose a password different from the current one.' });
  learner.passwordHash = bcrypt.hashSync(next, 10);
  learner.passwordChangedAt = new Date().toISOString();
  saveDb(db);
  sendMail({ to: email, ...passwordChangedEmail({ name: learner.name }) }).catch(() => {});
  // older sessions stop working after a password change; this one continues with a fresh token
  res.json({ success: true, message: 'Your password has been changed.', token: signLearnerToken(email) });
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
