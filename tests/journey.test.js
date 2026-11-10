import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as R from '../server/lib/referrals.js';

// One full journey through the real API, the way people use the site:
// referral link -> sign-up with the code (email verification) -> discounted price -> Cashfree payment
// (mocked) -> every module quiz -> project -> proctored final (passed) -> certificate -> public
// verification -> referrer's commission released -> withdrawal approved and paid by the admin.
const DAY = 24 * 60 * 60 * 1000;
const tmp = path.join(os.tmpdir(), `arb-journey-db-${process.pid}-${Date.now()}.json`);
const COURSE = 'python-programming';
const REF = 'journey-ref@example.test';
const SECRET = 'cf_journey_secret';
const student = { name: 'Priya Journey', regNo: 'JRN0001', phone: '9876500001', email: 'journey-student@example.test', password: 'Journey#123' };
let app; let db$; let admin; let refToken; let token;
const realFetch = global.fetch;
const paid = new Set();
const created = {};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const asStudent = (r) => r.set('X-Learner-Token', token);

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', PAID_COURSES: 'on', CASHFREE_APP_ID: 'cf_app', CASHFREE_SECRET_KEY: SECRET, CASHFREE_ENV: 'sandbox', ARB_OUTBOX_DIR: path.join(os.tmpdir(), `arb-journey-outbox-${process.pid}`) });
  global.fetch = vi.fn(async (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('https://sandbox.cashfree.com/pg/')) return realFetch(url, opts);
    if (u.endsWith('/pg/orders') && opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      created[body.order_id] = body;
      return json({ order_id: body.order_id, order_amount: body.order_amount, payment_session_id: `s_${body.order_id}`, order_status: 'ACTIVE' });
    }
    const m = u.match(/\/pg\/orders\/([^/]+)(\/payments)?$/);
    if (m && m[2]) return json(paid.has(m[1]) ? [{ cf_payment_id: 7001, payment_status: 'SUCCESS' }] : []);
    if (m) return json({ order_id: m[1], order_status: paid.has(m[1]) ? 'PAID' : 'ACTIVE' });
    return json({}, 404);
  });
  app = (await import('../server/app.js')).default;
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  db.learners[REF] = { name: 'Ravi Mentor', email: REF, regNo: 'JREF01', phone: '9000011111', learnerId: 'ARB-STU-JREF01', passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
  db$.saveDb(db);
  refToken = (await request(app).post('/api/learners/login').send({ email: REF, password: 'Pw#12345', regNo: 'JREF01' })).body.token;
  const { JWT_SECRET } = await import('../server/middleware/auth.js');
  admin = { Authorization: `Bearer ${jwt.sign({ role: 'admin', adminId: db$.getDb().admin.adminId }, JWT_SECRET)}` };
});
afterAll(() => {
  global.fetch = realFetch;
  for (const k of ['PAID_COURSES', 'CASHFREE_APP_ID', 'CASHFREE_SECRET_KEY', 'CASHFREE_ENV']) delete process.env[k];
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
});

describe('a learner\'s whole journey', () => {
  let code; let orderId; let certificateId; let commission;

  it('1. the referrer has a code; a friend opens the link', async () => {
    const me = await request(app).get('/api/referrals/me').set('X-Learner-Token', refToken);
    expect(me.status).toBe(200);
    code = me.body.code;
    const click = await request(app).post('/api/referrals/click').send({ code, visitorId: 'v-journey' });
    expect(click.body).toMatchObject({ valid: true, referrerName: 'Ravi' });
  });

  it('2. the friend signs up with the code and verifies the email', async () => {
    const r = await request(app).post('/api/learners/register').send({ ...student, referralCode: code, referralSource: 'link' });
    expect(r.status).toBe(201);
    expect(r.body.referral).toBe('applied');
    const v = await request(app).post('/api/learners/verify-email').send({ email: student.email, code: r.body.devCode });
    expect(v.status).toBe(200);
    token = v.body.token;
    expect(token).toBeTruthy();
  });

  it('3. the course is locked until paid; the price shows the referral discount', async () => {
    const locked = await asStudent(request(app).post('/api/enrollment')).send({ userId: student.email, courseId: COURSE });
    expect(locked.body.code).toBe('PAYMENT_REQUIRED');
    const q = await asStudent(request(app).get(`/api/payments/quote?courseId=${COURSE}`));
    expect(q.body).toMatchObject({ originalPaise: 14900, discountPaise: 1490, finalPaise: 13410, referral: { code, discountPct: 10 } });
  });

  it('4. pays through Cashfree; the course unlocks once, and the referrer earns 10% of what was paid', async () => {
    const o = await asStudent(request(app).post('/api/payments/order')).send({ courseId: COURSE, amount: 1 });
    expect(o.status).toBe(200);
    orderId = o.body.orderId;
    expect(created[orderId].order_amount).toBe(134.1);
    const early = await asStudent(request(app).post('/api/payments/verify')).send({ orderId });
    expect(early.body.success).not.toBe(true); // not paid yet: nothing unlocks
    paid.add(orderId);
    const v = await asStudent(request(app).post('/api/payments/verify')).send({ orderId });
    expect(v.status).toBe(200);
    await asStudent(request(app).post('/api/payments/verify')).send({ orderId }); // a replay changes nothing
    const db = db$.getDb();
    expect(db.payments.filter(p => p.orderId === orderId && p.status === 'paid')).toHaveLength(1);
    const rewards = db.referralRewards.filter(r => r.orderId === orderId);
    expect(rewards).toHaveLength(1);
    commission = rewards[0].commissionPaise;
    expect(commission).toBe(1341);
    const st = await asStudent(request(app).get('/api/enrollment'));
    expect(JSON.stringify(st.body)).toContain(COURSE);
  });

  it('5. completes every module quiz and submits a project, which unlocks the final', async () => {
    const course = db$.getDb().courses.find(c => c.id === COURSE);
    const locked = await asStudent(request(app).post('/api/final-test/start')).send({ courseId: COURSE, studentName: student.name });
    expect(locked.status).toBe(403);
    for (const m of course.modules) {
      const r = await asStudent(request(app).post(`/api/quizzes/module/${m.id}/submit`)).send({ userId: student.email, answers: {}, studentName: student.name });
      expect(r.status).toBe(200);
    }
    const p = await asStudent(request(app).post('/api/projects/submit')).send({ courseId: COURSE, projectId: course.projects[0].id, githubUrl: 'https://github.com/priya/log-analyzer' });
    expect(p.status).toBe(200);
  });

  it('6. passes the proctored final', async () => {
    const s = await asStudent(request(app).post('/api/final-test/start')).send({ courseId: COURSE, studentName: student.name });
    expect(s.status).toBe(200);
    expect(JSON.stringify(s.body.questions)).not.toMatch(/correctAnswer/);
    const db = db$.getDb();
    const key = Object.keys(db.finalTestActiveSessions).find(k => k.startsWith(`${student.email}::`));
    const session = db.finalTestActiveSessions[key];
    const course = db.courses.find(c => c.id === COURSE);
    const paper = (course.finalTest?.questionPapers || []).find(p => p.paperCode === session.paperCode);
    const questions = paper?.questions?.length ? paper.questions : course.finalTest.questions;
    const answers = Object.fromEntries(questions.map(q => [q.id, q.correctAnswer]));
    const r = await asStudent(request(app).post('/api/final-test/submit')).send({ courseId: COURSE, sessionId: s.body.sessionId, answers, studentName: student.name });
    expect(r.status).toBe(200);
    expect(r.body.result.passed).toBe(true);
    expect(r.body.result.percentage).toBe(100);
  });

  it('7. gets a certificate that anyone can verify', async () => {
    const c = await asStudent(request(app).post('/api/certificates/issue')).send({ userId: student.email, courseId: COURSE, studentName: student.name, regNo: student.regNo });
    expect(c.status).toBe(200);
    certificateId = c.body.certificate.certificateId;
    expect(certificateId).toBeTruthy();
    const again = await asStudent(request(app).post('/api/certificates/issue')).send({ userId: student.email, courseId: COURSE, studentName: student.name, regNo: student.regNo });
    expect(again.body.certificate.certificateId).toBe(certificateId); // one certificate, not two
    const pub = await request(app).get(`/api/certificates/verify/${certificateId}`);
    expect(pub.status).toBe(200);
    expect(JSON.stringify(pub.body)).toContain('Priya');
    expect((await request(app).get('/api/certificates/verify/NOT-A-REAL-ID')).status).toBe(404);
  });

  it('8. after 7 days the commission is released and the referrer is paid out by the admin', async () => {
    const db = db$.getDb();
    R.runJobs(db, Date.now() + 8 * DAY);
    db$.saveDb(db);
    const me = await request(app).get('/api/referrals/me').set('X-Learner-Token', refToken);
    expect(me.body.wallet).toMatchObject({ pending: 0, available: commission, lifetime: commission });
    expect(me.body.stats).toMatchObject({ clicks: 1, registrations: 1, purchases: 1 });
    await request(app).put('/api/admin/referrals/settings').set(admin).send({ minWithdrawalPaise: 1000 });
    const w = await request(app).post('/api/referrals/withdrawals').set('X-Learner-Token', refToken).send({ amountPaise: commission, method: 'upi', payout: { upiId: 'ravi@okaxis' } });
    expect(w.status).toBe(200);
    const id = db$.getDb().withdrawalRequests.find(x => x.email === REF).id;
    expect((await request(app).post(`/api/admin/referrals/withdrawals/${id}/approve`).set(admin).send({})).status).toBe(200);
    expect((await request(app).post(`/api/admin/referrals/withdrawals/${id}/paid`).set(admin).send({ utr: 'UTR123456789' })).status).toBe(200);
    const after = await request(app).get('/api/referrals/me').set('X-Learner-Token', refToken);
    expect(after.body.wallet).toMatchObject({ available: 0, reserved: 0, withdrawn: commission });
    const ov = await request(app).get('/api/admin/referrals/overview').set(admin);
    expect(ov.body.overview).toMatchObject({ purchases: 1, withdrawnPaise: commission });
  });
});
