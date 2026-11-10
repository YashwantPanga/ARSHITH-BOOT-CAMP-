import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Cashfree payments for paid courses and Interview Prep. Cashfree's API is mocked: an order stays
// ACTIVE until the test marks it paid; webhooks are signed exactly as Cashfree signs them.
const tmp = path.join(os.tmpdir(), `arb-pay-db-${process.pid}-${Date.now()}.json`);
const A = 'payer@example.test';
const B = 'other@example.test';
const C = 'prep-buyer@example.test';
const SECRET = 'cf_test_secret_123';
let app; let db$; const tok = {};
const realFetch = global.fetch;
const paid = new Set();
const created = {};

const as = (email) => ({ 'X-Learner-Token': tok[email] });
const order = (email, courseId) => request(app).post('/api/payments/order').set(as(email)).send({ courseId });
const prepOrder = (email) => request(app).post('/api/payments/order').set(as(email)).send({ product: 'interview' });
const verify = (email, orderId) => request(app).post('/api/payments/verify').set(as(email)).send({ orderId });
const state = async (email) => (await request(app).get('/api/enrollment').set(as(email))).body;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', PAID_COURSES: 'on', CASHFREE_APP_ID: 'cf_app_test', CASHFREE_SECRET_KEY: SECRET, CASHFREE_ENV: 'sandbox' });
  global.fetch = vi.fn(async (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('https://sandbox.cashfree.com/pg/')) return realFetch(url, opts);
    if (opts.headers?.['x-client-secret'] !== SECRET) return json({ message: 'authentication failed' }, 401);
    if (u.endsWith('/pg/orders') && opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      created[body.order_id] = body;
      return json({ order_id: body.order_id, order_amount: body.order_amount, payment_session_id: `session_${body.order_id}`, order_status: 'ACTIVE' });
    }
    const m = u.match(/\/pg\/orders\/([^/]+)(\/payments)?$/);
    if (m && m[2]) return json(paid.has(m[1]) ? [{ cf_payment_id: 5551, payment_status: 'SUCCESS' }] : []);
    if (m) return json({ order_id: m[1], order_status: paid.has(m[1]) ? 'PAID' : 'ACTIVE' });
    return json({ message: 'not found' }, 404);
  });
  app = (await import('../server/app.js')).default;
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  for (const [email, id] of [[A, 'ARB-STU-PAY001'], [B, 'ARB-STU-OTH001'], [C, 'ARB-STU-PRP001']]) {
    db.learners[email] = { name: 'Learner ' + id, email, regNo: id.slice(-6), phone: '9876543210', learnerId: id, passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
    db.students = [{ id, name: 'Learner ' + id, email, status: 'active' }, ...(db.students || [])];
  }
  db$.saveDb(db);
  for (const [email, reg] of [[A, 'PAY001'], [B, 'OTH001'], [C, 'PRP001']]) tok[email] = (await request(app).post('/api/learners/login').send({ email, password: 'Pw#12345', regNo: reg })).body.token;
});
afterAll(() => {
  global.fetch = realFetch;
  for (const k of ['PAID_COURSES', 'CASHFREE_APP_ID', 'CASHFREE_SECRET_KEY', 'CASHFREE_ENV', 'COURSE_PRICE', 'INTERVIEW_PRICE']) delete process.env[k];
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
});

describe('Cashfree course payments', () => {
  it('every course needs payment, Data Science costs ₹199, and payments show as enabled', async () => {
    const free = await request(app).post('/api/enrollment').set(as(A)).send({ courseId: 'python-programming' });
    expect(free.status).toBe(402);
    expect(await state(A)).toMatchObject({ free: false, paymentsEnabled: true });
    expect((await order(A, 'data-science-ai')).body).toMatchObject({ amount: 199, kind: 'course' });
  });

  it('creates a ₹149 order priced by the server, and an unpaid order unlocks nothing', async () => {
    const r = await order(A, 'sql-mastery');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ amount: 149, currency: 'INR', mode: 'sandbox', kind: 'course' });
    expect(r.body.paymentSessionId).toBe(`session_${r.body.orderId}`);
    expect(created[r.body.orderId]).toMatchObject({ order_amount: 149, order_currency: 'INR', customer_details: { customer_email: A, customer_phone: '9876543210' } });
    const notYet = await verify(A, r.body.orderId);
    expect(notYet.status).toBe(409);
    expect(notYet.body.code).toBe('NOT_PAID');
    expect((await state(A)).courseIds).not.toContain('sql-mastery');
  });

  it('a paid order unlocks the course once; another learner cannot claim it', async () => {
    const { orderId } = (await order(A, 'sql-mastery')).body;
    paid.add(orderId);
    expect((await verify(B, orderId)).status).toBe(404);
    const ok = await verify(A, orderId);
    expect(ok.status).toBe(200);
    expect(ok.body.courses['sql-mastery']).toBe('active');
    expect((await verify(A, orderId)).status).toBe(200); // again: nothing changes
    const rec = db$.getDb().payments.filter(p => p.orderId === orderId);
    expect(rec).toHaveLength(1);
    expect(rec[0]).toMatchObject({ status: 'paid', paymentId: '5551', amount: 14900, gateway: 'cashfree' });
    expect(db$.getDb().learnerEnrollments[A].courses['sql-mastery']).toMatchObject({ paid: true, by: 'cashfree' });
  });

  it('the webhook unlocks a course when the browser never confirmed, and needs a valid signature', async () => {
    await request(app).post('/api/enrollment').set(as(B)).send({ courseId: 'python-programming' });
    const { orderId } = (await order(B, 'sql-mastery')).body;
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: orderId, order_amount: 149 }, payment: { cf_payment_id: 7771, payment_status: 'SUCCESS' } } });
    const ts = String(Date.now());
    const send = (sig) => request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-webhook-timestamp', ts).set('x-webhook-signature', sig).send(body);
    expect((await send('nope')).status).toBe(400);
    expect((await state(B)).courseIds).not.toContain('sql-mastery');
    expect((await send(crypto.createHmac('sha256', SECRET).update(ts + body).digest('base64'))).status).toBe(200);
    expect((await state(B)).courses['sql-mastery']).toBe('active');
  });

  it('payment endpoints need a learner session', async () => {
    expect((await request(app).post('/api/payments/order').send({ courseId: 'sql-mastery' })).status).toBe(401);
  });
});

describe('Interview Prep payment', () => {
  const progress = (email) => request(app).get('/api/interview/progress').set(as(email));

  it('is locked without certificates and offers a ₹599 unlock', async () => {
    const p = (await progress(C)).body;
    expect(p.unlocked).toBe(false);
    expect(p.purchase).toMatchObject({ price: 599, paid: false, paymentsEnabled: true });
  });

  it('a paid ₹599 order unlocks Interview Prep for that learner only', async () => {
    const r = await prepOrder(C);
    expect(r.body).toMatchObject({ amount: 599, kind: 'interview' });
    expect((await verify(C, r.body.orderId)).status).toBe(409);
    paid.add(r.body.orderId);
    const ok = await verify(C, r.body.orderId);
    expect(ok.body).toMatchObject({ kind: 'interview', interviewUnlocked: true });
    expect((await progress(C)).body).toMatchObject({ unlocked: true, purchase: { paid: true } });
    expect((await progress(B)).body.unlocked).toBe(false);
    expect((await request(app).post('/api/interview/solved').set(as(C)).send({ setId: 'sql-50', itemId: 'sql-01' })).status).toBe(200);
    expect((await prepOrder(C)).body.code).toBe('ALREADY_UNLOCKED');
  });

  it('is free (no payment needed) with certificates for all 4 courses', async () => {
    const db = db$.getDb();
    ['python-programming', 'sql-mastery', 'web-development', 'data-science-ai'].forEach((courseId, i) => db.certificates.push({ certificateId: `ARB-T-2026-PAYC00${i}`, userId: B, courseId, status: 'active' }));
    db$.saveDb(db);
    expect((await progress(B)).body.unlocked).toBe(true);
    expect((await prepOrder(B)).body.code).toBe('ALREADY_UNLOCKED');
  });
});

describe('prices', () => {
  it('COURSE_PRICE and INTERVIEW_PRICE in .env override the normal prices (for a ₹1 test payment)', async () => {
    const { coursePrice } = await import('../server/lib/enrollment.js');
    const { interviewPrice } = await import('../server/lib/interviewAccess.js');
    process.env.COURSE_PRICE = '1';
    process.env.INTERVIEW_PRICE = '1';
    expect(coursePrice('python-programming')).toBe(1);
    expect(coursePrice('data-science-ai')).toBe(1);
    expect(interviewPrice()).toBe(1);
    expect((await order(A, 'web-development')).body.amount).toBe(1);
    process.env.COURSE_PRICE = 'abc';
    process.env.INTERVIEW_PRICE = '';
    expect(coursePrice('python-programming')).toBe(149);
    expect(coursePrice('data-science-ai')).toBe(199);
    expect(interviewPrice()).toBe(599);
  });
});
