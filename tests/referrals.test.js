import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as R from '../server/lib/referrals.js';

// Refer & Earn: the money rules are tested twice - through the real API (clicks, sign-up, discounted
// Cashfree order, commission, release job, withdrawal, admin) and directly on the ledger functions
// (refunds, reversals, failed payouts, overdue, concurrency, attribution policy).
const DAY = 24 * 60 * 60 * 1000;
const tmp = path.join(os.tmpdir(), `arb-ref-db-${process.pid}-${Date.now()}.json`);
const REF = 'referrer@example.test';
const NEW = 'newbie@example.test';
const SECRET = 'cf_ref_secret';
let app; let db$; let admin; const tok = {};
const realFetch = global.fetch;
const paid = new Set();
const created = {};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const as = (email) => ({ 'X-Learner-Token': tok[email] });
const login = async (email, reg) => { tok[email] = (await request(app).post('/api/learners/login').send({ email, password: 'Pw#12345', regNo: reg })).body.token; };

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', PAID_COURSES: 'on', CASHFREE_APP_ID: 'cf_app', CASHFREE_SECRET_KEY: SECRET, CASHFREE_ENV: 'sandbox' });
  global.fetch = vi.fn(async (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('https://sandbox.cashfree.com/pg/')) return realFetch(url, opts);
    if (u.endsWith('/pg/orders') && opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      created[body.order_id] = body;
      return json({ order_id: body.order_id, order_amount: body.order_amount, payment_session_id: `s_${body.order_id}`, order_status: 'ACTIVE' });
    }
    const m = u.match(/\/pg\/orders\/([^/]+)(\/payments)?$/);
    if (m && m[2]) return json(paid.has(m[1]) ? [{ cf_payment_id: 9001, payment_status: 'SUCCESS' }] : []);
    if (m) return json({ order_id: m[1], order_status: paid.has(m[1]) ? 'PAID' : 'ACTIVE' });
    return json({}, 404);
  });
  app = (await import('../server/app.js')).default;
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  db.learners[REF] = { name: 'Yash Kumar', email: REF, regNo: 'REF001', phone: '9000000001', learnerId: 'ARB-STU-REF001', passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
  db$.saveDb(db);
  await login(REF, 'REF001');
  const { JWT_SECRET } = await import('../server/middleware/auth.js');
  admin = { Authorization: `Bearer ${jwt.sign({ role: 'admin', adminId: db$.getDb().admin.adminId }, JWT_SECRET)}` };
});
afterAll(() => {
  global.fetch = realFetch;
  for (const k of ['PAID_COURSES', 'CASHFREE_APP_ID', 'CASHFREE_SECRET_KEY', 'CASHFREE_ENV']) delete process.env[k];
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
});

describe('Refer & Earn through the API', () => {
  let code; let orderId; let commission;

  it('gives every learner a unique code and link; the page needs a learner session', async () => {
    expect((await request(app).get('/api/referrals/me')).status).toBe(401);
    const me = (await request(app).get('/api/referrals/me').set(as(REF))).body;
    expect(me.code).toMatch(/^YASHK\d{3}/);
    expect(me.link).toMatch(new RegExp(`/ref/${me.code}$`));
    code = me.code;
    expect((await request(app).get('/api/referrals/me').set(as(REF))).body.code).toBe(code); // stable
  });

  it('counts a link click once per visitor and checks codes', async () => {
    const c1 = await request(app).post('/api/referrals/click').send({ code: code.toLowerCase(), visitorId: 'v-1' });
    expect(c1.body).toMatchObject({ valid: true, referrerName: 'Yash', discountPct: 10 });
    await request(app).post('/api/referrals/click').send({ code, visitorId: 'v-1' });
    await request(app).post('/api/referrals/click').send({ code, visitorId: 'v-2' });
    expect((await request(app).get('/api/referrals/me').set(as(REF))).body.stats.clicks).toBe(2);
    expect((await request(app).post('/api/referrals/click').send({ code: 'NOPE999', visitorId: 'v-3' })).body.valid).toBe(false);
  });

  it('links a new account at sign-up and blocks self-referral', async () => {
    const r = await request(app).post('/api/learners/register').send({ name: 'Riya Shah', email: NEW, regNo: 'NEW001', phone: '9000000002', password: 'Pw#12345', referralCode: code, referralSource: 'link' });
    expect(r.status).toBe(201);
    expect(r.body.referral).toBe('applied');
    const db = db$.getDb(); db.learners[NEW].emailVerified = true; db$.saveDb(db);
    await login(NEW, 'NEW001');
    const self = await request(app).post('/api/referrals/claim').set(as(REF)).send({ code });
    expect(self.body.code).toBe('SELF_REFERRAL');
    expect((await request(app).post('/api/referrals/claim').set(as(NEW)).send({ code })).body.code).toBe('ALREADY_REFERRED');
    expect((await request(app).get('/api/referrals/me').set(as(REF))).body.stats.registrations).toBe(1);
  });

  it('applies the 10% discount on the server and charges the discounted price', async () => {
    const q = (await request(app).get('/api/payments/quote').query({ courseId: 'sql-mastery' }).set(as(NEW))).body;
    expect(q.referral).toMatchObject({ code, discountPct: 10 });
    expect(q.discountPaise).toBe(Math.floor(q.originalPaise / 10));
    expect(q.finalPaise).toBe(q.originalPaise - q.discountPaise);
    const o = await request(app).post('/api/payments/order').set(as(NEW)).send({ courseId: 'sql-mastery', amount: 1 }); // a client price is ignored
    expect(o.status).toBe(200);
    orderId = o.body.orderId;
    expect(created[orderId].order_amount).toBe(q.finalPaise / 100);
    expect(db$.getDb().payments.find(p => p.orderId === orderId)).toMatchObject({ amount: q.finalPaise, originalAmount: q.originalPaise, discountAmount: q.discountPaise });
    commission = Math.floor(q.finalPaise / 10);
  });

  it('creates exactly one pending commission once the payment is verified (webhook replays too)', async () => {
    expect((await request(app).post('/api/payments/verify').set(as(NEW)).send({ orderId })).status).toBe(409);
    expect(db$.getDb().referralRewards || []).toHaveLength(0);
    paid.add(orderId);
    expect((await request(app).post('/api/payments/verify').set(as(NEW)).send({ orderId })).status).toBe(200);
    await request(app).post('/api/payments/verify').set(as(NEW)).send({ orderId });
    // Cashfree's webhook for the same payment arrives late: still one commission
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: orderId, order_amount: created[orderId].order_amount }, payment: { cf_payment_id: 9001, payment_status: 'SUCCESS' } } });
    const ts = String(Date.now());
    const sig = (await import('node:crypto')).createHmac('sha256', SECRET).update(ts + body).digest('base64');
    expect((await request(app).post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-webhook-timestamp', ts).set('x-webhook-signature', sig).send(body)).status).toBe(200);
    const rewards = db$.getDb().referralRewards;
    expect(rewards).toHaveLength(1);
    expect(rewards[0]).toMatchObject({ status: 'pending', commissionPaise: commission, commissionPct: 10, referrerEmail: REF, refereeEmail: NEW, paymentId: '9001' });
    const me = (await request(app).get('/api/referrals/me').set(as(REF))).body;
    expect(me.wallet).toMatchObject({ pending: commission, available: 0, reserved: 0, withdrawn: 0, lifetime: commission });
    expect(me.stats).toMatchObject({ purchases: 1, conversion: 100 });
    expect(me.notifications.some(n => n.type === 'commission.created')).toBe(true);
  });

  it('releases the commission only after 7 days, once', () => {
    const db = db$.getDb();
    const paidAt = Date.parse(db.payments.find(p => p.orderId === orderId).paidAt);
    expect(R.releaseDue(db, paidAt + 6 * DAY)).toBe(0);
    expect(R.releaseDue(db, paidAt + 7 * DAY + 1000)).toBe(1);
    expect(R.releaseDue(db, paidAt + 8 * DAY)).toBe(0);
    expect(R.balances(db, REF)).toMatchObject({ pending: 0, available: commission });
    db$.saveDb(db);
  });

  it('enforces the ₹100 minimum, then reserves, approves and pays a withdrawal with a UTR', async () => {
    const small = await request(app).post('/api/referrals/withdrawals').set(as(REF)).send({ amountPaise: 5000, method: 'upi', payout: { upiId: 'yash@okaxis' } });
    expect(small.status).toBe(400);
    expect(small.body.message).toMatch(/minimum withdrawal is ₹100/);
    await request(app).put('/api/admin/referrals/settings').set(admin).send({ minWithdrawalPaise: 100 });
    expect((await request(app).post('/api/referrals/withdrawals').set(as(REF)).send({ amountPaise: commission + 1, method: 'upi', payout: { upiId: 'yash@okaxis' } })).status).toBe(400);
    expect((await request(app).post('/api/referrals/withdrawals').set(as(REF)).send({ amountPaise: 200, method: 'upi', payout: { upiId: 'not a upi' } })).status).toBe(400);
    const ok = await request(app).post('/api/referrals/withdrawals').set(as(REF)).send({ amountPaise: commission, method: 'upi', payout: { upiId: 'yash@okaxis' } });
    expect(ok.status).toBe(200);
    expect(ok.body.wallet).toMatchObject({ available: 0, reserved: commission });
    const id = ok.body.withdrawals[0].id;
    expect(ok.body.withdrawals[0].payout.upiId).toBe('ya•••@okaxis');
    expect((await request(app).post(`/api/admin/referrals/withdrawals/${id}/paid`).set(admin).send({ utr: 'UTR123456' })).status).toBe(409); // not approved yet
    const ap = await request(app).post(`/api/admin/referrals/withdrawals/${id}/approve`).set(admin);
    expect(ap.body.request.status).toBe('approved');
    expect(Date.parse(ap.body.request.deadlineAt) - Date.parse(ap.body.request.approvedAt)).toBe(7 * DAY);
    expect((await request(app).post(`/api/admin/referrals/withdrawals/${id}/paid`).set(admin).send({ utr: '' })).status).toBe(400);
    expect((await request(app).post(`/api/admin/referrals/withdrawals/${id}/paid`).set(admin).send({ utr: 'UTR123456' })).body.request.status).toBe('paid');
    const me = (await request(app).get('/api/referrals/me').set(as(REF))).body;
    expect(me.wallet).toMatchObject({ available: 0, reserved: 0, withdrawn: commission });
    expect(me.withdrawals[0]).toMatchObject({ status: 'paid', utr: 'UTR123456' });
  });

  it('admin endpoints need an admin, and the admin sees totals, filters, audit and CSV', async () => {
    expect((await request(app).get('/api/admin/referrals/overview')).status).toBe(404);
    expect((await request(app).get('/api/admin/referrals/overview').set(as(REF))).status).toBe(404);
    const ov = (await request(app).get('/api/admin/referrals/overview').set(admin)).body.overview;
    expect(ov).toMatchObject({ referrers: 1, clicks: 2, registrations: 1, purchases: 1, withdrawnPaise: commission });
    expect((await request(app).get('/api/admin/referrals/referrers').query({ q: 'yash' }).set(admin)).body.referrers[0].code).toBe(code);
    expect((await request(app).get('/api/admin/referrals/withdrawals').query({ status: 'paid', method: 'upi' }).set(admin)).body.withdrawals).toHaveLength(1);
    expect((await request(app).get('/api/admin/referrals/audit').set(admin)).body.audit.some(a => a.action === 'withdrawal.paid')).toBe(true);
    const csv = await request(app).get('/api/admin/referrals/export').query({ type: 'withdrawals' }).set(admin);
    expect(csv.headers['content-type']).toMatch(/text\/csv/);
    expect(csv.text).toContain('UTR123456');
  });

  it('a suspended referrer cannot give discounts or withdraw', async () => {
    await request(app).post(`/api/admin/referrals/referrers/${encodeURIComponent(REF)}/suspend`).set(admin).send({ suspended: true, reason: 'test' });
    const q = (await request(app).get('/api/payments/quote').query({ courseId: 'web-development' }).set(as(NEW))).body;
    expect(q.referral).toBeNull();
    expect(q.discountPaise).toBe(0);
    await request(app).post(`/api/admin/referrals/referrers/${encodeURIComponent(REF)}/suspend`).set(admin).send({ suspended: false });
  });
});

/* ---------------------------------------------------------------- ledger rules */

function freshDb() {
  return {
    learners: {
      'a@x.test': { name: 'Asha Rao', phone: '9111111111' },
      'b@x.test': { name: 'Bala Iyer', phone: '9222222222' },
      'c@x.test': { name: 'Chandra Das', phone: '9111111111' }
    },
    payments: []
  };
}
function paidOrder(db, id, buyer, amountPaise, now) {
  const order = { orderId: id, kind: 'course', email: buyer, courseId: 'python-programming', courseTitle: 'Python', amount: amountPaise, originalAmount: Math.round(amountPaise / 0.9), discountAmount: 0, status: 'paid', paidAt: new Date(now).toISOString(), referral: R.quote(db, buyer, { kind: 'course', courseId: 'python-programming', pricePaise: 100000 }, now).referral };
  db.payments.push(order);
  return R.onOrderPaid(db, order, now);
}

describe('Refer & Earn ledger rules', () => {
  const T0 = Date.parse('2026-11-01T10:00:00Z');

  it('uses the exact example: ₹1000 -> ₹100 off -> ₹900 paid -> ₹90 commission', () => {
    const db = freshDb();
    const code = R.ensureProfile(db, 'a@x.test', T0).code;
    expect(R.attribute(db, 'b@x.test', code, { now: T0 }).ok).toBe(true);
    const q = R.quote(db, 'b@x.test', { kind: 'course', courseId: 'x', pricePaise: 100000 }, T0);
    expect(q).toMatchObject({ originalPaise: 100000, discountPaise: 10000, finalPaise: 90000 });
    const r = paidOrder(db, 'o1', 'b@x.test', q.finalPaise, T0);
    expect(r.commissionPaise).toBe(9000);
    expect(paidOrder(db, 'o1', 'b@x.test', q.finalPaise, T0)).toBe(r); // same order: no second commission
    expect(db.referralRewards).toHaveLength(1);
  });

  it('blocks self-referral by phone, existing customers and expired links', () => {
    const db = freshDb();
    const code = R.ensureProfile(db, 'a@x.test', T0).code;
    expect(R.attribute(db, 'c@x.test', code, { now: T0 }).reason).toBe('SELF_REFERRAL'); // same phone
    db.payments.push({ orderId: 'old', email: 'b@x.test', status: 'paid', amount: 100 });
    expect(R.attribute(db, 'b@x.test', code, { now: T0 }).reason).toBe('EXISTING_CUSTOMER');
    db.payments = [];
    R.attribute(db, 'b@x.test', code, { now: T0 });
    expect(R.activeAttribution(db, 'b@x.test', T0 + 29 * DAY)).not.toBeNull();
    expect(R.activeAttribution(db, 'b@x.test', T0 + 31 * DAY)).toBeNull();
    expect(R.quote(db, 'b@x.test', { kind: 'course', courseId: 'x', pricePaise: 100000 }, T0 + 31 * DAY).discountPaise).toBe(0);
  });

  it('a partial refund before release cuts the pending commission in proportion; a full refund cancels it', () => {
    const db = freshDb();
    R.attribute(db, 'b@x.test', R.ensureProfile(db, 'a@x.test', T0).code, { now: T0 });
    paidOrder(db, 'o2', 'b@x.test', 90000, T0);
    expect(R.refundOrder(db, 'o2', 30000, 'admin', T0 + DAY).ok).toBe(true);
    expect(R.balances(db, 'a@x.test').pending).toBe(6000);
    expect(R.refundOrder(db, 'o2', 70000, 'admin', T0 + DAY).reason).toBe('MORE_THAN_PAID');
    R.refundOrder(db, 'o2', 60000, 'admin', T0 + DAY);
    expect(R.balances(db, 'a@x.test')).toMatchObject({ pending: 0, available: 0 });
    expect(db.referralRewards[0].status).toBe('cancelled');
    expect(R.releaseDue(db, T0 + 10 * DAY)).toBe(0);
  });

  it('a refund after release takes the commission back from the available balance', () => {
    const db = freshDb();
    R.attribute(db, 'b@x.test', R.ensureProfile(db, 'a@x.test', T0).code, { now: T0 });
    paidOrder(db, 'o3', 'b@x.test', 90000, T0);
    R.releaseDue(db, T0 + 8 * DAY);
    R.refundOrder(db, 'o3', 90000, 'admin', T0 + 9 * DAY);
    expect(R.balances(db, 'a@x.test')).toMatchObject({ pending: 0, available: 0 });
    expect(db.referralRewards[0].status).toBe('reversed');
  });

  it('two withdrawal requests for the whole balance: only one can reserve it', () => {
    const db = freshDb();
    R.attribute(db, 'b@x.test', R.ensureProfile(db, 'a@x.test', T0).code, { now: T0 });
    paidOrder(db, 'o4', 'b@x.test', 200000, T0); // ₹200 commission
    R.releaseDue(db, T0 + 8 * DAY);
    const one = R.requestWithdrawal(db, 'a@x.test', { amountPaise: 20000, method: 'upi', payout: { upiId: 'asha@okhdfc' } }, T0 + 8 * DAY);
    const two = R.requestWithdrawal(db, 'a@x.test', { amountPaise: 20000, method: 'upi', payout: { upiId: 'asha@okhdfc' } }, T0 + 8 * DAY);
    expect(one.ok).toBe(true);
    expect(two.ok).toBe(false);
    expect(R.balances(db, 'a@x.test')).toMatchObject({ available: 0, reserved: 20000 });
  });

  it('reject restores the money; a failed payout can be retried or released; overdue is flagged once', () => {
    const db = freshDb();
    R.attribute(db, 'b@x.test', R.ensureProfile(db, 'a@x.test', T0).code, { now: T0 });
    paidOrder(db, 'o5', 'b@x.test', 300000, T0); // ₹300
    R.releaseDue(db, T0 + 8 * DAY);
    const bank = { holder: 'Asha Rao', bank: 'HDFC', account: '123456789012', ifsc: 'HDFC0001234' };
    const w1 = R.requestWithdrawal(db, 'a@x.test', { amountPaise: 10000, method: 'bank', payout: bank }, T0 + 8 * DAY).request;
    R.actOnWithdrawal(db, w1.id, 'reject', { reason: 'Check bank details' }, T0 + 9 * DAY);
    expect(R.balances(db, 'a@x.test')).toMatchObject({ available: 30000, reserved: 0 });

    const w2 = R.requestWithdrawal(db, 'a@x.test', { amountPaise: 15000, method: 'bank', payout: bank }, T0 + 9 * DAY).request;
    R.actOnWithdrawal(db, w2.id, 'approve', {}, T0 + 9 * DAY);
    expect(R.flagOverdue(db, T0 + 15 * DAY)).toBe(0);
    expect(R.flagOverdue(db, T0 + 17 * DAY)).toBe(1);
    expect(R.flagOverdue(db, T0 + 18 * DAY)).toBe(0);
    expect(w2.status).toBe('overdue');
    R.actOnWithdrawal(db, w2.id, 'failed', { reason: 'Bank rejected' }, T0 + 18 * DAY);
    R.actOnWithdrawal(db, w2.id, 'retry', {}, T0 + 18 * DAY);
    expect(w2.status).toBe('approved');
    R.actOnWithdrawal(db, w2.id, 'failed', { reason: 'Again' }, T0 + 19 * DAY);
    R.actOnWithdrawal(db, w2.id, 'release', { reason: 'Give back' }, T0 + 19 * DAY);
    expect(R.balances(db, 'a@x.test')).toMatchObject({ available: 30000, reserved: 0, withdrawn: 0 });
    expect(R.actOnWithdrawal(db, w2.id, 'paid', { utr: 'UTR999999' }, T0 + 20 * DAY).ok).toBe(false); // released: cannot be paid
  });

  it('the ledger always adds up and every entry is unique', () => {
    const db = freshDb();
    R.attribute(db, 'b@x.test', R.ensureProfile(db, 'a@x.test', T0).code, { now: T0 });
    paidOrder(db, 'o6', 'b@x.test', 123457, T0);
    R.runJobs(db, T0 + 8 * DAY);
    R.runJobs(db, T0 + 8 * DAY);
    const ids = db.referralLedger.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const b = R.balances(db, 'a@x.test');
    expect(b.available).toBe(Math.floor(123457 / 10));
    expect(db.referralLedger.every(e => Number.isInteger(e.delta))).toBe(true);
  });

  it('admin can reverse an invalid commission; settings are validated', () => {
    const db = freshDb();
    R.attribute(db, 'b@x.test', R.ensureProfile(db, 'a@x.test', T0).code, { now: T0 });
    const r = paidOrder(db, 'o7', 'b@x.test', 90000, T0);
    expect(R.reverseReward(db, r.id, 'fraud', 'admin', T0).ok).toBe(true);
    expect(R.reverseReward(db, r.id, 'fraud', 'admin', T0).ok).toBe(false);
    expect(R.balances(db, 'a@x.test').pending).toBe(0);
    const s = R.updateSettings(db, { discountPct: 500, commissionPct: 15, promo: { delaySeconds: 3, headline: '' } }, 'admin');
    expect(s.discountPct).toBe(10); // out of range: kept
    expect(s.commissionPct).toBe(15);
    expect(s.promo.delaySeconds).toBe(3);
    expect(s.promo.headline).toBe('Your Network. Your Rewards.');
  });

  it('codes are unique and CSV cells cannot run formulas', () => {
    const db = { learners: {} };
    const codes = new Set();
    for (let i = 0; i < 300; i++) codes.add(R.ensureProfile(db, `user${i}@x.test`).code);
    expect(codes.size).toBe(300);
    expect(R.toCsv([{ v: '=HYPERLINK("x")' }], [['V', r => r.v]])).toContain("'=HYPERLINK");
  });
});

describe('greeting names', () => {
  it('uses the first real word of a name, not an initial', () => {
    expect(R.firstName('P Yashwant')).toBe('Yashwant');
    expect(R.firstName('P. Yashwant Kumar')).toBe('Yashwant');
    expect(R.firstName('Riya Tester')).toBe('Riya');
    expect(R.firstName('')).toBe('A friend');
  });
});
