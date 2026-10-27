import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Razorpay payments for paid courses. Razorpay's order API is mocked; signatures are made with the
// test secret exactly as Razorpay makes them.
const tmp = path.join(os.tmpdir(), `arb-pay-db-${process.pid}-${Date.now()}.json`);
const A = 'payer@example.test';
const B = 'other@example.test';
const SECRET = 'test_secret_123';
const HOOK = 'hook_secret_456';
let app; let db$; const tok = {};
const realFetch = global.fetch;
let orderNo = 0;

const sign = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('hex');
const as = (email) => ({ 'X-Learner-Token': tok[email] });
const order = (email, courseId) => request(app).post('/api/payments/order').set(as(email)).send({ courseId });
const state = async (email) => (await request(app).get('/api/enrollment').set(as(email))).body;

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', RAZORPAY_KEY_ID: 'rzp_test_abc', RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: HOOK });
  global.fetch = vi.fn(async (url, opts) => {
    if (!String(url).startsWith('https://api.razorpay.com/')) return realFetch(url, opts);
    const body = JSON.parse(opts.body);
    return new Response(JSON.stringify({ id: `order_T${++orderNo}`, amount: body.amount, currency: body.currency, status: 'created' }), { status: 200 });
  });
  app = (await import('../server/app.js')).default;
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  for (const [email, id] of [[A, 'ARB-STU-PAY001'], [B, 'ARB-STU-OTH001']]) {
    db.learners[email] = { name: 'Learner ' + id, email, regNo: id.slice(-6), phone: '9999999999', learnerId: id, passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
    db.students = [{ id, name: 'Learner ' + id, email, status: 'active' }, ...(db.students || [])];
  }
  db$.saveDb(db);
  for (const [email, reg] of [[A, 'PAY001'], [B, 'OTH001']]) tok[email] = (await request(app).post('/api/learners/login').send({ email, password: 'Pw#12345', regNo: reg })).body.token;
});
afterAll(() => {
  global.fetch = realFetch;
  for (const k of ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET']) delete process.env[k];
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
});

describe('Razorpay payments', () => {
  it('the free course needs no payment; the next one does, and payments show as enabled', async () => {
    expect((await order(A, 'python-programming')).body.code).toBe('FREE_COURSE');
    await request(app).post('/api/enrollment').set(as(A)).send({ courseId: 'python-programming' });
    expect(await state(A)).toMatchObject({ nextPrice: 99, paymentsEnabled: true });
    expect((await order(A, 'python-programming')).body.code).toBe('ALREADY_ENROLLED');
  });

  it('creates a ₹99 order priced by the server and rejects a forged signature', async () => {
    const r = await order(A, 'sql-mastery');
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ keyId: 'rzp_test_abc', amount: 9900, currency: 'INR' });
    const bad = await request(app).post('/api/payments/verify').set(as(A)).send({ razorpay_order_id: r.body.orderId, razorpay_payment_id: 'pay_X', razorpay_signature: 'forged' });
    expect(bad.status).toBe(400);
    expect((await state(A)).courseIds).not.toContain('sql-mastery');
  });

  it('a valid payment unlocks the course; another learner cannot claim the order', async () => {
    const { orderId } = (await order(A, 'sql-mastery')).body;
    const proof = { razorpay_order_id: orderId, razorpay_payment_id: 'pay_OK1', razorpay_signature: sign(`${orderId}|pay_OK1`) };
    expect((await request(app).post('/api/payments/verify').set(as(B)).send(proof)).status).toBe(404);
    const ok = await request(app).post('/api/payments/verify').set(as(A)).send(proof);
    expect(ok.status).toBe(200);
    expect(ok.body.courses['sql-mastery']).toBe('active');
    // the same proof again changes nothing
    expect((await request(app).post('/api/payments/verify').set(as(A)).send(proof)).status).toBe(200);
    const rec = db$.getDb().payments.filter(p => p.orderId === orderId);
    expect(rec).toHaveLength(1);
    expect(rec[0]).toMatchObject({ status: 'paid', paymentId: 'pay_OK1', amount: 9900 });
    expect(db$.getDb().learnerEnrollments[A].courses['sql-mastery']).toMatchObject({ paid: true, by: 'razorpay' });
  });

  it('the webhook unlocks a course when the browser never confirmed, and needs a valid signature', async () => {
    await request(app).post('/api/enrollment').set(as(B)).send({ courseId: 'python-programming' });
    const { orderId } = (await order(B, 'sql-mastery')).body;
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_WH1', order_id: orderId } } } });
    const send = (sig) => request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('X-Razorpay-Signature', sig).send(body);
    expect((await send('nope')).status).toBe(400);
    expect((await state(B)).courseIds).not.toContain('sql-mastery');
    expect((await send(crypto.createHmac('sha256', HOOK).update(body).digest('hex'))).status).toBe(200);
    expect((await state(B)).courses['sql-mastery']).toBe('active');
  });

  it('payment endpoints need a learner session', async () => {
    expect((await request(app).post('/api/payments/order').send({ courseId: 'sql-mastery' })).status).toBe(401);
  });
});
