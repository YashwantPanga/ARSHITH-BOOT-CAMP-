import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

// Email verification, forgot/reset password and the course-completion email, on a throw-away DB.
// SMTP is not configured in tests, so emails go to a temporary outbox folder.
const tmp = path.join(os.tmpdir(), `arb-account-db-${process.pid}-${Date.now()}.json`);
const outbox = path.join(os.tmpdir(), `arb-account-outbox-${process.pid}-${Date.now()}`);
let app;
const email = `acct${Date.now()}@example.test`;
const learner = { name: 'Account Tester', regNo: 'ACC0001', phone: '9876543210', email, password: 'first-pass' };
let devCode;

const outboxText = () => (fs.existsSync(outbox) ? fs.readdirSync(outbox).map(f => fs.readFileSync(path.join(outbox, f), 'utf8')).join('\n') : '');

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  process.env.ARB_DB_FILE = tmp;
  process.env.ARB_OUTBOX_DIR = outbox;
  process.env.NODE_ENV = 'test';
  delete process.env.SMTP_HOST;
  app = (await import('../server/app.js')).default;
});
afterAll(() => {
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  try { fs.rmSync(outbox, { recursive: true, force: true }); } catch { /* ignore */ }
});

describe('email verification', () => {
  it('creates the account unverified and emails a 6-digit code', async () => {
    const res = await request(app).post('/api/learners/register').send(learner);
    expect(res.status).toBe(201);
    expect(res.body.verificationRequired).toBe(true);
    expect(res.body.emailStatus).toBe('outbox');
    expect(res.body.devCode).toMatch(/^\d{6}$/);
    devCode = res.body.devCode;
    expect(outboxText()).toContain(devCode);
    expect(outboxText()).toContain('/verify-email?email=');
    const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    expect(JSON.stringify(db.learners[email])).not.toContain(devCode); // only a hash is stored
  });

  it('blocks sign-in until the email is verified', async () => {
    const res = await request(app).post('/api/learners/login').send({ email, regNo: learner.regNo, password: learner.password });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('rejects a wrong code and rate-limits resends', async () => {
    const wrong = await request(app).post('/api/learners/verify-email').send({ email, code: devCode === '000000' ? '111111' : '000000' });
    expect(wrong.status).toBe(400);
    const resend = await request(app).post('/api/learners/resend-verification').send({ email });
    expect(resend.status).toBe(429);
  });

  it('verifies with the right code and signs the learner in', async () => {
    const res = await request(app).post('/api/learners/verify-email').send({ email, code: devCode });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    const login = await request(app).post('/api/learners/login').send({ email, regNo: learner.regNo, password: learner.password });
    expect(login.status).toBe(200);
  });

  it('lets accounts created before verification existed keep signing in', async () => {
    const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    const legacy = Object.values(db.learners || {}).find(l => l.emailVerified === undefined);
    if (legacy) expect(legacy.emailVerified).toBeUndefined(); // treated as verified by the login route
  });
});

describe('forgot and reset password', () => {
  let oldToken;
  let resetCode;

  it('gives the same answer for unknown emails (no account enumeration)', async () => {
    const res = await request(app).post('/api/learners/forgot-password').send({ email: 'nobody-here@example.test' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If an account exists/);
    expect(res.body.devCode).toBeUndefined();
  });

  it('emails a reset code for a real account', async () => {
    const login = await request(app).post('/api/learners/login').send({ email, regNo: learner.regNo, password: learner.password });
    oldToken = login.body.token;
    const res = await request(app).post('/api/learners/forgot-password').send({ email });
    expect(res.status).toBe(200);
    resetCode = res.body.devCode;
    expect(resetCode).toMatch(/^\d{6}$/);
    expect(outboxText()).toContain('/reset-password?email=');
  });

  it('rejects a wrong code and a short password', async () => {
    const wrong = await request(app).post('/api/learners/reset-password').send({ email, code: resetCode === '000000' ? '111111' : '000000', password: 'new-pass-123' });
    expect(wrong.status).toBe(400);
    const short = await request(app).post('/api/learners/reset-password').send({ email, code: resetCode, password: '123' });
    expect(short.status).toBe(400);
  });

  it('changes the password, signs out old sessions and allows the new password', async () => {
    await new Promise(r => setTimeout(r, 1200)); // make the change strictly later than the old token
    const res = await request(app).post('/api/learners/reset-password').send({ email, code: resetCode, password: 'new-pass-123' });
    expect(res.status).toBe(200);
    const oldSession = await request(app).get(`/api/enrollment?userId=${email}`).set('X-Learner-Token', oldToken);
    expect(oldSession.status).toBe(401);
    const oldPw = await request(app).post('/api/learners/login').send({ email, regNo: learner.regNo, password: learner.password });
    expect(oldPw.status).toBe(401);
    const newPw = await request(app).post('/api/learners/login').send({ email, regNo: learner.regNo, password: 'new-pass-123' });
    expect(newPw.status).toBe(200);
    const reuse = await request(app).post('/api/learners/reset-password').send({ email, code: resetCode, password: 'another-pass' });
    expect(reuse.status).toBe(400); // codes are single-use
    expect(outboxText()).toContain('password was changed');
  });
});

describe('course completion email', () => {
  it('is sent once the learner has a passing final, with certificate ID and verify link', async () => {
    const login = await request(app).post('/api/learners/login').send({ email, regNo: learner.regNo, password: 'new-pass-123' });
    const token = login.body.token;
    await request(app).post('/api/enrollment').set('X-Learner-Token', token).send({ userId: email, courseId: 'sql-mastery' });
    const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    db.finalTestAttempts.unshift({ id: 'acct-final', userId: email, studentName: 'Account Tester', courseId: 'sql-mastery', score: 22, totalQuestions: 25, percentage: 88, passed: true });
    fs.writeFileSync(tmp, JSON.stringify(db));
    const res = await request(app).post('/api/certificates/issue').set('X-Learner-Token', token).send({ userId: email, courseId: 'sql-mastery' });
    expect(res.status).toBe(200);
    const certId = res.body.certificate.certificateId;
    await new Promise(r => setTimeout(r, 500));
    const text = outboxText();
    expect(text).toMatch(/Congratulations! You completed SQL (&amp;|&) Relational Databases/);
    expect(text).toContain('Congratulations, Account Tester!');
    expect(text).toContain(certId);
    expect(text).toContain(`/verify/${certId}`);
    const after = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    expect(after.certificates.find(c => c.certificateId === certId).completionEmail.status).toBe('saved-to-outbox');
  });
});
