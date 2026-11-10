import express from 'express';
import { getDb, saveDb, readDb } from '../db.js';
import { publicBase } from '../lib/publicUrl.js';
import * as R from '../lib/referrals.js';

// Refer & Earn API. Public: promo settings, link clicks, code check. Learner (signed-in, see
// learnerAuth PROTECTED): own dashboard, claiming a link, withdrawals, notifications, preferences.
// Admin (/api/admin/... is behind adminGate): overview, referrers, commissions, withdrawals,
// refunds, suspension, settings, audit log, CSV export and a manual run of the scheduled job.
const router = express.Router();
const norm = (v) => String(v || '').trim().toLowerCase();
const siteUrl = (req) => publicBase(req).publicUrl.replace(/\/+$/, '');
const adminName = (req) => req.admin?.adminId || 'admin';
const needLearner = (req, res) => {
  if (req.learnerEmail) return false;
  res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in to use Refer & Earn.' });
  return true;
};

/* ---------------------------------------------------------------- public */

router.get('/referrals/promo', (req, res) => {
  res.json({ success: true, promo: R.publicPromo(readDb()) });
});

router.get('/referrals/code/:code', (req, res) => {
  const db = readDb();
  const prof = R.profileByCode(db, req.params.code);
  const s = R.settings(db);
  if (!prof || prof.suspended || !s.enabled) return res.json({ success: true, valid: false });
  res.json({ success: true, valid: true, code: prof.code, referrerName: (db.learners?.[prof.email]?.name || 'A friend').split(' ')[0], discountPct: s.discountPct });
});

router.post('/referrals/click', (req, res) => {
  const db = getDb();
  const result = R.recordClick(db, req.body?.code, req.body?.visitorId);
  if (result.valid && result.counted) saveDb(db);
  res.json({ success: true, ...result, discountPct: R.settings(db).discountPct });
});

/* ---------------------------------------------------------------- learner */

router.get('/referrals/me', (req, res) => {
  if (needLearner(req, res)) return;
  const db = getDb();
  const had = !!db.referralProfiles?.[req.learnerEmail];
  const view = R.learnerView(db, req.learnerEmail, siteUrl(req));
  if (!had) saveDb(db); // the code was just created
  res.json({ success: true, ...view, attribution: R.activeAttribution(db, req.learnerEmail) ? { code: db.referralAttributions[req.learnerEmail].code, expiresAt: db.referralAttributions[req.learnerEmail].expiresAt } : null });
});

// A signed-in learner opened someone's link: link the account if the policy allows it.
router.post('/referrals/claim', (req, res) => {
  if (needLearner(req, res)) return;
  const db = getDb();
  const r = R.attribute(db, req.learnerEmail, req.body?.code, { source: 'link-signed-in' });
  if (r.ok) saveDb(db);
  const messages = {
    SELF_REFERRAL: 'You cannot use your own referral link.', ALREADY_REFERRED: 'Your account is already linked to a referral.',
    EXISTING_CUSTOMER: 'Referral discounts are for new learners before their first purchase.', INVALID_CODE: 'This referral link is not valid.',
    REFERRER_SUSPENDED: 'This referral link is no longer active.', PROGRAM_OFF: 'Refer & Earn is paused right now.'
  };
  res.status(r.ok ? 200 : 409).json({ success: r.ok, code: r.reason, message: r.ok ? 'Referral discount unlocked for your next purchase.' : messages[r.reason] || 'Could not apply this referral.', attribution: r.attribution || null });
});

router.post('/referrals/withdrawals', (req, res) => {
  if (needLearner(req, res)) return;
  const db = getDb();
  const r = R.requestWithdrawal(db, req.learnerEmail, { amountPaise: req.body?.amountPaise, method: req.body?.method, payout: req.body?.payout });
  if (!r.ok) return res.status(r.status).json({ success: false, message: r.message });
  saveDb(db);
  res.json({ success: true, ...R.learnerView(db, req.learnerEmail, siteUrl(req)) });
});

router.post('/referrals/notifications/read', (req, res) => {
  if (needLearner(req, res)) return;
  const db = getDb();
  (db.notifications?.[req.learnerEmail] || []).forEach(n => { n.read = true; });
  saveDb(db);
  res.json({ success: true });
});

router.post('/referrals/preferences', (req, res) => {
  if (needLearner(req, res)) return;
  const db = getDb();
  const learner = db.learners?.[req.learnerEmail];
  if (!learner) return res.status(404).json({ success: false, message: 'Account not found.' });
  learner.promoOptOut = !!req.body?.promoOptOut;
  saveDb(db);
  res.json({ success: true, promoOptOut: learner.promoOptOut });
});

/* ---------------------------------------------------------------- admin */

const inRange = (iso, from, to) => (!from || iso >= from) && (!to || iso <= `${to}T23:59:59.999Z`);

router.get('/admin/referrals/overview', (req, res) => {
  const db = getDb();
  res.json({ success: true, overview: R.adminOverview(db), settings: R.settings(db) });
});

router.get('/admin/referrals/referrers', (req, res) => {
  res.json({ success: true, referrers: R.adminReferrers(getDb(), req.query.q) });
});

router.get('/admin/referrals/referrers/:email', (req, res) => {
  const db = getDb();
  const email = norm(req.params.email);
  if (!db.referralProfiles?.[email]) return res.status(404).json({ success: false, message: 'Referrer not found.' });
  const view = R.learnerView(db, email, siteUrl(req));
  res.json({ success: true, email, name: db.learners?.[email]?.name || '', ...view });
});

router.post('/admin/referrals/referrers/:email/suspend', (req, res) => {
  const db = getDb();
  const r = R.setSuspended(db, req.params.email, !!req.body?.suspended, req.body?.reason, adminName(req));
  if (!r.ok) return res.status(404).json({ success: false, message: 'Referrer not found.' });
  saveDb(db);
  res.json({ success: true, profile: r.profile });
});

router.get('/admin/referrals/rewards', (req, res) => {
  const db = getDb();
  const { status, email, from, to } = req.query;
  const rows = (db.referralRewards || []).filter(r => (!status || r.status === status)
    && (!email || r.referrerEmail.includes(norm(email)) || r.refereeEmail.includes(norm(email)))
    && inRange(r.createdAt, from, to)).slice().reverse();
  res.json({ success: true, rewards: rows });
});

router.post('/admin/referrals/rewards/:id/reverse', (req, res) => {
  const db = getDb();
  const r = R.reverseReward(db, req.params.id, req.body?.reason, adminName(req));
  if (!r.ok) return res.status(r.reason === 'NOT_FOUND' ? 404 : 409).json({ success: false, message: r.reason === 'NOT_FOUND' ? 'Commission not found.' : 'This commission is already reversed.' });
  saveDb(db);
  res.json({ success: true, reward: r.reward });
});

router.post('/admin/referrals/orders/:orderId/refund', (req, res) => {
  const db = getDb();
  const r = R.refundOrder(db, req.params.orderId, req.body?.amountPaise, adminName(req));
  if (!r.ok) {
    const msg = { ORDER_NOT_FOUND: 'Order not found.', BAD_AMOUNT: 'Enter the refunded amount.', MORE_THAN_PAID: 'The refund is more than the amount paid.' }[r.reason];
    return res.status(r.reason === 'ORDER_NOT_FOUND' ? 404 : 400).json({ success: false, message: msg });
  }
  saveDb(db);
  res.json({ success: true, order: r.order, reward: r.reward });
});

router.get('/admin/referrals/withdrawals', (req, res) => {
  const db = getDb();
  const { status, method, email, from, to } = req.query;
  const rows = (db.withdrawalRequests || []).filter(w => (!status || w.status === status) && (!method || w.method === method)
    && (!email || w.email.includes(norm(email))) && inRange(w.createdAt, from, to))
    .map(w => ({ ...w, name: db.learners?.[w.email]?.name || '' })).reverse();
  res.json({ success: true, withdrawals: rows });
});

router.post('/admin/referrals/withdrawals/:id/:action', (req, res) => {
  const db = getDb();
  const r = R.actOnWithdrawal(db, req.params.id, req.params.action, { reason: req.body?.reason, utr: req.body?.utr, actor: adminName(req) });
  if (!r.ok) return res.status(r.status).json({ success: false, message: r.message });
  saveDb(db);
  res.json({ success: true, request: r.request });
});

router.get('/admin/referrals/settings', (req, res) => res.json({ success: true, settings: R.settings(getDb()) }));

router.put('/admin/referrals/settings', (req, res) => {
  const db = getDb();
  const settings = R.updateSettings(db, req.body || {}, adminName(req));
  saveDb(db);
  res.json({ success: true, settings });
});

router.get('/admin/referrals/audit', (req, res) => {
  const db = getDb();
  res.json({ success: true, audit: (db.referralAudit || []).slice(-500).reverse() });
});

router.post('/admin/referrals/jobs/run', (req, res) => {
  const db = getDb();
  const result = R.runJobs(db);
  saveDb(db);
  res.json({ success: true, ...result });
});

router.get('/admin/referrals/export', (req, res) => {
  const db = getDb();
  const rs = (p) => (p / 100).toFixed(2);
  const type = req.query.type;
  let csv;
  if (type === 'withdrawals') {
    csv = R.toCsv(db.withdrawalRequests || [], [
      ['Request ID', w => w.id], ['Email', w => w.email], ['Name', w => db.learners?.[w.email]?.name || ''], ['Amount (INR)', w => rs(w.amountPaise)],
      ['Method', w => w.method], ['UPI ID', w => w.payout?.upiId || ''], ['Account holder', w => w.payout?.holder || ''], ['Bank', w => w.payout?.bank || ''],
      ['Account number', w => w.payout?.account || ''], ['IFSC', w => w.payout?.ifsc || ''], ['Status', w => w.status], ['Requested', w => w.createdAt],
      ['Approved', w => w.approvedAt || ''], ['Pay by', w => w.deadlineAt || ''], ['Paid', w => w.paidAt || ''], ['UTR', w => w.utr || '']
    ]);
  } else if (type === 'referrers') {
    csv = R.toCsv(R.adminReferrers(db), [
      ['Email', r => r.email], ['Name', r => r.name], ['Code', r => r.code], ['Suspended', r => (r.suspended ? 'yes' : 'no')], ['Clicks', r => r.clicks],
      ['Registrations', r => r.registrations], ['Purchases', r => r.purchases], ['Lifetime (INR)', r => rs(r.wallet.lifetime)], ['Pending (INR)', r => rs(r.wallet.pending)],
      ['Available (INR)', r => rs(r.wallet.available)], ['Reserved (INR)', r => rs(r.wallet.reserved)], ['Withdrawn (INR)', r => rs(r.wallet.withdrawn)]
    ]);
  } else {
    csv = R.toCsv(db.referralRewards || [], [
      ['Commission ID', r => r.id], ['Order ID', r => r.orderId], ['Payment ID', r => r.paymentId || ''], ['Referrer', r => r.referrerEmail], ['Referred learner', r => r.refereeEmail],
      ['Item', r => r.courseTitle], ['Original (INR)', r => rs(r.originalPaise)], ['Discount (INR)', r => rs(r.discountPaise)], ['Paid (INR)', r => rs(r.paidPaise)],
      ['Commission %', r => r.commissionPct], ['Commission (INR)', r => rs(r.commissionPaise)], ['Status', r => r.status], ['Created', r => r.createdAt], ['Release at', r => r.releaseAt]
    ]);
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="codelekho-${['withdrawals', 'referrers'].includes(type) ? type : 'commissions'}.csv"`);
  res.send(`﻿${csv}`);
});

export default router;
