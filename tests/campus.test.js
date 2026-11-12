import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as C from '../server/lib/campus.js';

// Campus Rewards through the real API: the admin adds colleges and creates a voucher for each one;
// every voucher has its own unique code; learners enter it at checkout. Discount, dates, eligibility,
// limits, payment failure / success and concurrency are all enforced on the server.
const DAY = 24 * 60 * 60 * 1000;
const tmp = path.join(os.tmpdir(), `arb-campus-db-${process.pid}-${Date.now()}.json`);
const SECRET = 'cf_campus_secret';
const S1 = 'student-one@example.test';
const S2 = 'student-two@example.test';
const S3 = 'student-three@example.test';
const N = 'normal-buyer@example.test';
let app; let db$; let admin; const tok = {};
const realFetch = global.fetch;
const paid = new Set(); const failed = new Set(); const created = {};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const as = (email) => ({ 'X-Learner-Token': tok[email] });
let abc; let xyz; let abcVoucher; let xyzVoucher;
const live = (extra = {}) => ({ startsAt: new Date(Date.now() - DAY).toISOString(), endsAt: new Date(Date.now() + 60 * DAY).toISOString(), ...extra });

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', PAID_COURSES: 'on', CASHFREE_APP_ID: 'cf_app', CASHFREE_SECRET_KEY: SECRET, CASHFREE_ENV: 'sandbox', ARB_OUTBOX_DIR: path.join(os.tmpdir(), `arb-campus-outbox-${process.pid}`) });
  global.fetch = vi.fn(async (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('https://sandbox.cashfree.com/pg/')) return realFetch(url, opts);
    if (u.endsWith('/pg/orders') && opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      created[body.order_id] = body;
      return json({ order_id: body.order_id, order_amount: body.order_amount, payment_session_id: `s_${body.order_id}`, order_status: 'ACTIVE' });
    }
    const m = u.match(/\/pg\/orders\/([^/]+)(\/payments)?$/);
    if (m && m[2]) return json(paid.has(m[1]) ? [{ cf_payment_id: 4242, payment_status: 'SUCCESS' }] : []);
    if (m) return json({ order_id: m[1], order_status: paid.has(m[1]) ? 'PAID' : failed.has(m[1]) ? 'EXPIRED' : 'ACTIVE' });
    return json({}, 404);
  });
  app = (await import('../server/app.js')).default;
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  for (const [email, reg] of [[S1, 'CMP001'], [S2, 'CMP002'], [S3, 'CMP003'], [N, 'CMP004']]) {
    db.learners[email] = { name: `Learner ${reg}`, email, regNo: reg, phone: '9000000000', learnerId: `ARB-${reg}`, passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
  }
  db$.saveDb(db);
  for (const [email, reg] of [[S1, 'CMP001'], [S2, 'CMP002'], [S3, 'CMP003'], [N, 'CMP004']]) {
    tok[email] = (await request(app).post('/api/learners/login').send({ email, password: 'Pw#12345', regNo: reg })).body.token;
  }
  const { JWT_SECRET } = await import('../server/middleware/auth.js');
  admin = { Authorization: `Bearer ${jwt.sign({ role: 'admin', adminId: db$.getDb().admin.adminId }, JWT_SECRET)}` };
});
afterAll(() => {
  global.fetch = realFetch;
  for (const k of ['PAID_COURSES', 'CASHFREE_APP_ID', 'CASHFREE_SECRET_KEY', 'CASHFREE_ENV']) delete process.env[k];
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
});

const order = (email, body) => request(app).post('/api/payments/order').set(as(email)).send(body);
const verify = (email, orderId) => request(app).post('/api/payments/verify').set(as(email)).send({ orderId });

describe('Campus Rewards: college vouchers', () => {
  it('only an admin can add colleges; codes are unique and fields validated', async () => {
    expect((await request(app).post('/api/admin/campus/colleges').set(as(S1)).send({ name: 'Hack College', code: 'HCK001', city: 'X', state: 'Y' })).status).toBe(404);
    const bad = await request(app).post('/api/admin/campus/colleges').set(admin).send({ name: 'AB', code: 'a' });
    expect(bad.status).toBe(400);
    expect(Object.keys(bad.body.errors)).toEqual(expect.arrayContaining(['name', 'code', 'city']));
    abc = (await request(app).post('/api/admin/campus/colleges').set(admin).send({ name: 'ABC Engineering College', code: 'ABC001', domains: 'abc.edu.in', city: 'Hyderabad', state: 'Telangana' })).body.college;
    xyz = (await request(app).post('/api/admin/campus/colleges').set(admin).send({ name: 'XYZ Institute of Technology', code: 'XYZ001', city: 'Pune', state: 'Maharashtra' })).body.college;
    expect(abc.id).toBeTruthy();
    expect((await request(app).post('/api/admin/campus/colleges').set(admin).send({ name: 'Copy College', code: 'ABC001', city: 'A', state: 'B' })).status).toBe(400);
  });

  it('each college voucher gets its own unique, unpredictable code', async () => {
    const a = await request(app).post('/api/admin/campus/campaigns').set(admin).send({ collegeId: abc.id, name: 'ABC launch', discountPct: 25, eligibleKinds: ['course', 'interview'], ...live() });
    expect(a.status).toBe(201);
    abcVoucher = a.body.campaign;
    expect(abcVoucher.voucherCode).toMatch(/^ABC-[A-HJ-NP-Z2-9]{6}$/);
    const x = await request(app).post('/api/admin/campus/campaigns').set(admin).send({ collegeId: xyz.id, name: 'XYZ launch', discountPct: 50, ...live() });
    xyzVoucher = x.body.campaign;
    expect(xyzVoucher.voucherCode).toMatch(/^XYZ-/);
    const codes = new Set();
    const db = db$.getDb();
    for (let i = 0; i < 300; i++) codes.add(C.newVoucherCode(db, abc));
    expect(codes.size).toBe(300);
    expect((await request(app).post('/api/admin/campus/campaigns').set(admin).send({ collegeId: abc.id, name: 'Bad', discountPct: 120, startsAt: '2026-12-01', endsAt: '2026-11-01' })).status).toBe(400);
  });

  it('the server works out the discount from the code', async () => {
    const q = await request(app).get(`/api/payments/quote?courseId=data-science-ai&voucher=${abcVoucher.voucherCode}`).set(as(S1));
    expect(q.body).toMatchObject({ originalPaise: 19900, discountPaise: 4975, finalPaise: 14925, voucher: { code: abcVoucher.voucherCode, discountPct: 25, college: 'ABC Engineering College' } });
    const lower = await request(app).get(`/api/payments/quote?courseId=python-programming&voucher=${abcVoucher.voucherCode.toLowerCase()}`).set(as(S1));
    expect(lower.body.finalPaise).toBe(11175);
    const x = await request(app).get(`/api/payments/quote?courseId=python-programming&voucher=${xyzVoucher.voucherCode}`).set(as(S1));
    expect(x.body.discountPaise).toBe(7450); // XYZ is 50%
  });

  it('wrong codes are refused and repeated guessing is blocked', async () => {
    const r = await request(app).post('/api/campus/vouchers/validate').set(as(S3)).send({ code: 'ABC-ZZZZZZ', courseId: 'sql-mastery' });
    expect(r.status).toBe(404);
    for (let i = 0; i < 9; i++) await request(app).post('/api/campus/vouchers/validate').set(as(S3)).send({ code: `ABC-ZZZZZ${'ABCDEFGHJ'[i]}`, courseId: 'sql-mastery' });
    const blocked = await request(app).post('/api/campus/vouchers/validate').set(as(S3)).send({ code: abcVoucher.voucherCode, courseId: 'sql-mastery' });
    expect(blocked.status).toBe(429);
    expect((await request(app).post('/api/campus/vouchers/validate').send({ code: abcVoucher.voucherCode, courseId: 'sql-mastery' })).status).toBe(401);
  });

  it('eligibility and limits come from the voucher', async () => {
    const ip = await request(app).get(`/api/payments/quote?product=interview&voucher=${xyzVoucher.voucherCode}`).set(as(S1));
    expect(ip.status).toBe(409);
    expect(ip.body.code).toBe('NOT_ELIGIBLE');
    const min = await request(app).post('/api/admin/campus/campaigns').set(admin).send({ collegeId: abc.id, name: 'Big spenders', discountPct: 30, minPurchase: 500, ...live() });
    const m = await request(app).get(`/api/payments/quote?courseId=python-programming&voucher=${min.body.campaign.voucherCode}`).set(as(S1));
    expect(m.body.code).toBe('MIN_PURCHASE');
    const cap = await request(app).post('/api/admin/campus/campaigns').set(admin).send({ collegeId: abc.id, name: 'Capped', discountPct: 80, maxDiscount: 20, ...live() });
    const c = await request(app).get(`/api/payments/quote?courseId=python-programming&voucher=${cap.body.campaign.voucherCode}`).set(as(S1));
    expect(c.body.discountPaise).toBe(2000);
  });

  it('not-started, expired, paused and inactive-college vouchers do not work', async () => {
    const later = await request(app).post('/api/admin/campus/campaigns').set(admin).send({ collegeId: abc.id, name: 'Next term', discountPct: 20, startsAt: new Date(Date.now() + 5 * DAY).toISOString(), endsAt: new Date(Date.now() + 30 * DAY).toISOString() });
    expect((await request(app).get(`/api/payments/quote?courseId=sql-mastery&voucher=${later.body.campaign.voucherCode}`).set(as(S1))).body.code).toBe('NOT_STARTED');
    const db = db$.getDb();
    const old = db.campusCampaigns.find(c => c.id === later.body.campaign.id);
    old.startsAt = new Date(Date.now() - 10 * DAY).toISOString(); old.endsAt = new Date(Date.now() - DAY).toISOString();
    db$.saveDb(db);
    expect((await request(app).get(`/api/payments/quote?courseId=sql-mastery&voucher=${old.voucherCode}`).set(as(S1))).body.code).toBe('EXPIRED');
    await request(app).put(`/api/admin/campus/campaigns/${xyzVoucher.id}`).set(admin).send({ status: 'paused' });
    expect((await request(app).get(`/api/payments/quote?courseId=sql-mastery&voucher=${xyzVoucher.voucherCode}`).set(as(S1))).body.code).toBe('CAMPAIGN_OFF');
    await request(app).put(`/api/admin/campus/campaigns/${xyzVoucher.id}`).set(admin).send({ status: 'active' });
    await request(app).put(`/api/admin/campus/colleges/${xyz.id}`).set(admin).send({ status: 'inactive' });
    expect((await request(app).get(`/api/payments/quote?courseId=sql-mastery&voucher=${xyzVoucher.voucherCode}`).set(as(S1))).body.code).toBe('COLLEGE_INACTIVE');
    await request(app).put(`/api/admin/campus/colleges/${xyz.id}`).set(admin).send({ status: 'active' });
  });

  it('a failed payment gives the use back', async () => {
    const o = await order(S1, { courseId: 'python-programming', voucherCode: abcVoucher.voucherCode, amount: 1 });
    expect(o.status).toBe(200);
    expect(created[o.body.orderId].order_amount).toBe(111.75);
    // the same learner cannot start a second payment with it while this one is open
    const twice = await order(S1, { courseId: 'sql-mastery', voucherCode: abcVoucher.voucherCode });
    expect(twice.body.code).toBe('IN_USE');
    failed.add(o.body.orderId);
    expect((await verify(S1, o.body.orderId)).status).toBe(409);
    expect(db$.getDb().campusReservations).toHaveLength(0);
  });

  it('a successful payment records the redemption once; the learner cannot reuse it', async () => {
    const o = await order(S1, { courseId: 'python-programming', voucherCode: abcVoucher.voucherCode });
    paid.add(o.body.orderId);
    expect((await verify(S1, o.body.orderId)).status).toBe(200);
    await verify(S1, o.body.orderId); // replay
    const db = db$.getDb();
    expect(db.voucherRedemptions.filter(r => r.orderId === o.body.orderId)).toHaveLength(1);
    expect(db.payments.find(p => p.orderId === o.body.orderId)).toMatchObject({ status: 'paid', amount: 11175, originalAmount: 14900, discountAmount: 3725 });
    expect(db.referralRewards?.some(r => r.orderId === o.body.orderId)).toBeFalsy(); // no referral commission on top
    const again = await order(S1, { courseId: 'sql-mastery', voucherCode: abcVoucher.voucherCode });
    expect(again.body.code).toBe('REDEEMED');
    // other students of the college can still use the shared code
    expect((await request(app).get(`/api/payments/quote?courseId=sql-mastery&voucher=${abcVoucher.voucherCode}`).set(as(S2))).status).toBe(200);
  });

  it('total redemptions are capped, even with checkouts at the same moment', () => {
    const db = db$.getDb();
    const now = Date.now();
    const camp = C.addCampaign(db, { collegeId: abc.id, name: 'Only one', discountPct: 40, maxRedemptions: 1, ...live() }, 'test', now).campaign;
    const item = { kind: 'course', courseId: 'sql-mastery' };
    const first = C.check(db, S2, camp.voucherCode, item, 14900, now);
    expect(first.ok).toBe(true);
    C.reserve(db, first.campaign, S2, 'order_a', now);
    expect(C.check(db, N, camp.voucherCode, item, 14900, now)).toMatchObject({ ok: false, code: 'CAMPAIGN_FULL' });
    // the held use comes back if that payment never finishes
    expect(C.check(db, N, camp.voucherCode, item, 14900, now + C.RESERVE_MS + 1000).ok).toBe(true);
  });

  it('a new code replaces the old one at once', async () => {
    const old = abcVoucher.voucherCode;
    const r = await request(app).post(`/api/admin/campus/campaigns/${abcVoucher.id}/new-code`).set(admin);
    expect(r.body.campaign.voucherCode).not.toBe(old);
    expect((await request(app).get(`/api/payments/quote?courseId=sql-mastery&voucher=${old}`).set(as(S2))).status).toBe(404);
    expect((await request(app).get(`/api/payments/quote?courseId=sql-mastery&voucher=${r.body.campaign.voucherCode}`).set(as(S2))).status).toBe(200);
  });

  it('admin views show real numbers and are closed to everyone else', async () => {
    for (const u of ['/api/admin/campus/overview', '/api/admin/campus/campaigns', '/api/admin/campus/redemptions', '/api/admin/campus/audit']) {
      expect((await request(app).get(u).set(as(S1))).status).toBe(404);
    }
    const a = (await request(app).get('/api/admin/campus/analytics').set(admin)).body.analytics;
    expect(a).toMatchObject({ colleges: 2, redeemed: 1, discountPaise: 3725 });
    expect(a.byCollege.find(c => c.code === 'ABC001')).toMatchObject({ redeemed: 1, students: 1 });
    const camps = (await request(app).get('/api/admin/campus/campaigns').set(admin)).body.campaigns;
    expect(camps.find(c => c.id === abcVoucher.id)).toMatchObject({ redeemed: 1, students: 1, state: 'live' });
    expect((await request(app).get('/api/admin/campus/redemptions').set(admin)).body.redemptions[0]).toMatchObject({ email: S1, discountPaise: 3725 });
    expect((await request(app).get('/api/admin/campus/audit').set(admin)).body.audit.length).toBeGreaterThan(4);
  });

  it('normal checkout without a voucher is unchanged', async () => {
    const q = await request(app).get('/api/payments/quote?courseId=web-development').set(as(N));
    expect(q.body).toMatchObject({ originalPaise: 14900, discountPaise: 0, finalPaise: 14900 });
    const o = await order(N, { courseId: 'web-development' });
    expect(created[o.body.orderId].order_amount).toBe(149);
    paid.add(o.body.orderId);
    expect((await verify(N, o.body.orderId)).status).toBe(200);
  });
});
