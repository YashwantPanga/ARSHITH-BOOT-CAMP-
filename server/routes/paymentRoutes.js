import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { enrolmentState, enrol, priceFor } from '../lib/enrollment.js';
import { cashfreeConfigured, cashfreeMode, createOrder, getOrder, successfulPayment, newOrderId, webhookSignatureValid } from '../lib/cashfree.js';
import { interviewPrice, interviewPaid, grantInterview } from '../lib/interviewAccess.js';
import { interviewUnlockedByCertificates } from './interviewRoutes.js';
import { sendMail } from '../lib/mailer.js';
import { verifyAdminToken } from '../middleware/auth.js';
import { quote as referralQuote, onOrderPaid as referralOnPaid } from '../lib/referrals.js';
import * as Campus from '../lib/campus.js';

// Paid unlocks through Cashfree - a course or Interview Prep:
//  1. POST /payments/order   - the server works out the price and creates a Cashfree order
//  2. Cashfree Checkout runs in the browser (payment_session_id)
//  3. POST /payments/verify  - the server asks Cashfree for the order; when it is PAID it unlocks
//  4. POST /payments/webhook - Cashfree's own confirmation; unlocks if step 3 never arrived
// Each order is stored in db.payments, so an order unlocks its item exactly once.
const router = express.Router();
const INTERVIEW = 'interview-prep';

const siteUrl = (req) => (process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');

/** Marks the order paid and unlocks what it paid for (once). Returns true when this call did it. */
function fulfil(db, order, paymentId, via) {
  if (order.status === 'paid') return false;
  order.status = 'paid';
  order.paymentId = paymentId ? String(paymentId) : null;
  order.paidAt = new Date().toISOString();
  order.confirmedBy = via;
  if (order.kind === 'interview') grantInterview(db, order.email, { orderId: order.orderId });
  else enrol(db, order.email, order.courseId, { paid: true, by: 'cashfree' });
  referralOnPaid(db, order); // Refer & Earn: pending commission for the referrer, once per order
  Campus.onOrderPaid(db, order); // Campus Rewards: the voucher is used up only now, after payment
  logActivity({ action: order.kind === 'interview' ? 'Interview Prep payment' : 'Course payment', target: order.email, details: `Paid ₹${order.amount / 100} for ${order.courseTitle} (${order.paymentId || order.orderId})`, ipAddress: '-', device: 'Cashfree' });
  return true;
}

function sendReceipt(db, order) {
  const learner = db.learners?.[order.email];
  const name = learner?.name || order.email;
  const date = new Date(order.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const where = order.kind === 'interview' ? 'Interview Prep is now unlocked for you.' : `${order.courseTitle} is now unlocked in your dashboard.`;
  const rows = [['Item', order.courseTitle], ['Amount', `₹${(order.amount / 100).toFixed(2)}`], ['Payment ID', order.paymentId || '-'], ['Order ID', order.orderId], ['Date', date]];
  sendMail({
    to: order.email,
    subject: `Payment received - ${order.courseTitle} is unlocked`,
    text: `Hi ${name},\n\nThank you for your payment. ${where}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nCodeLekho`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#302B25">
      <h2 style="color:#013A2B">Payment received</h2>
      <p>Hi ${name},</p><p>Thank you for your payment. ${where.replace(order.courseTitle, `<strong>${order.courseTitle}</strong>`)}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#426557">${k}</td><td style="padding:6px 0;text-align:right"><strong>${v}</strong></td></tr>`).join('')}</table>
      <p style="font-size:12px;color:#888;margin-top:24px">Questions about this payment? Reply to this email or write to codelekho@arshithgroup.com.</p></div>`
  }).catch(() => {});
}

/** What the learner gets back after a payment: their course state plus Interview Prep access. */
const afterPayment = (db, email, order) => ({ success: true, kind: order.kind, courseId: order.courseId, paymentId: order.paymentId, interviewUnlocked: interviewPaid(db, email), ...enrolmentState(db, email) });

/** What the learner wants to buy, or an error response: { item } | { status, body }. */
function itemFor(db, email, body) {
  if (body.product === 'interview') {
    if (interviewPaid(db, email) || interviewUnlockedByCertificates(db, email)) return { status: 409, body: { success: false, code: 'ALREADY_UNLOCKED', message: 'Interview Prep is already unlocked for you.' } };
    return { item: { kind: 'interview', courseId: INTERVIEW, title: 'Interview Prep', price: interviewPrice(), back: '/interview' } };
  }
  const course = (db.courses || []).find(c => c.id === body.courseId);
  if (!course) return { status: 404, body: { success: false, message: 'Course not found.' } };
  const state = enrolmentState(db, email);
  if (state.courses[course.id] === 'active') return { status: 409, body: { success: false, code: 'ALREADY_ENROLLED', message: 'This course is already unlocked for you.' } };
  if (state.passedCourseIds.includes(course.id)) return { status: 409, body: { success: false, message: 'You have already passed this course. Your certificate is in your dashboard.' } };
  const price = priceFor(course.id);
  if (!(price > 0)) return { status: 409, body: { success: false, code: 'FREE_COURSE', message: 'This course is free - enrol without paying.' } };
  return { item: { kind: 'course', courseId: course.id, title: course.title, price, back: '/dashboard' } };
}

// The price the learner will pay, with any referral discount (shown before paying).
router.get('/payments/quote', (req, res) => {
  const email = req.learnerEmail;
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in.' });
  const db = getDb();
  const found = itemFor(db, email, { product: req.query.product, courseId: req.query.courseId });
  if (!found.item) return res.status(found.status).json(found.body);
  if (req.query.voucher) {
    // a college voucher replaces the referral discount (they do not stack)
    const v = Campus.validate(db, email, req.query.voucher, { kind: found.item.kind, courseId: found.item.courseId }, found.item.price * 100);
    saveDb(db);
    if (!v.ok) return res.status(v.status).json({ success: false, code: v.code, message: v.message });
    return res.json({ success: true, title: found.item.title, ...v.quote, referral: null });
  }
  const q = referralQuote(db, email, { kind: found.item.kind, courseId: found.item.courseId, pricePaise: found.item.price * 100 });
  res.json({ success: true, title: found.item.title, originalPaise: q.originalPaise, discountPaise: q.discountPaise, finalPaise: q.finalPaise, referral: q.referral ? { code: q.referral.code, discountPct: q.referral.discountPct } : null });
});

router.post('/payments/order', async (req, res) => {
  const email = req.learnerEmail;
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in to pay.' });
  if (!cashfreeConfigured()) return res.status(503).json({ success: false, code: 'PAYMENTS_OFF', message: 'Online payment is not available yet. Please contact us to enrol.' });

  const db = getDb();
  const found = itemFor(db, email, req.body || {});
  if (!found.item) return res.status(found.status).json(found.body);
  const item = found.item;
  const orderId = newOrderId(item.kind === 'interview' ? 'ip' : 'cl');
  // the server alone decides the price: a campus voucher if one is given, otherwise any referral discount
  let q;
  let voucher = null;
  if (req.body?.voucherCode) {
    const v = Campus.validate(db, email, req.body.voucherCode, { kind: item.kind, courseId: item.courseId }, item.price * 100);
    if (!v.ok) { saveDb(db); return res.status(v.status).json({ success: false, code: v.code, message: v.message }); }
    q = { ...v.quote, referral: null };
    voucher = { ...v.quote.voucher, campaignId: v.campaign.id };
    // hold one use of the code before talking to Cashfree, so limits hold even with checkouts at the same moment
    Campus.reserve(db, v.campaign, email, orderId);
    saveDb(db);
  } else {
    q = referralQuote(db, email, { kind: item.kind, courseId: item.courseId, pricePaise: item.price * 100 });
  }
  const learner = db.learners?.[email];
  try {
    const cf = await createOrder({
      orderId,
      amount: q.finalPaise / 100,
      customer: { id: learner?.learnerId || email, email, phone: learner?.phone, name: learner?.name },
      // UPI apps and some banks come back to the site instead of the payment window
      returnUrl: `${siteUrl(req)}${item.back}?cf_order={order_id}`,
      note: item.title
    });
    // re-read after the network call so changes made meanwhile are kept
    const fresh = getDb();
    if (!fresh.payments) fresh.payments = [];
    fresh.payments.push({ orderId, kind: item.kind, email, courseId: item.courseId, courseTitle: item.title, amount: q.finalPaise, originalAmount: q.originalPaise, discountAmount: q.discountPaise, ...(q.referral ? { referral: q.referral } : {}), ...(voucher ? { voucher } : {}), currency: 'INR', status: 'created', gateway: 'cashfree', createdAt: new Date().toISOString() });
    saveDb(fresh);
    res.json({ success: true, orderId, paymentSessionId: cf.payment_session_id, mode: cashfreeMode(), amount: q.finalPaise / 100, originalAmount: q.originalPaise / 100, discountAmount: q.discountPaise / 100, referral: !!q.referral, voucher, currency: 'INR', title: item.title, kind: item.kind });
  } catch (err) {
    console.error('[payments] order failed:', err.message);
    if (voucher) { const fresh = getDb(); if (Campus.releaseForOrder(fresh, orderId, 'payment could not start')) saveDb(fresh); }
    res.status(502).json({ success: false, message: 'Could not start the payment. Please try again in a minute.' });
  }
});

router.post('/payments/verify', async (req, res) => {
  const email = req.learnerEmail;
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in again.' });
  const orderId = String(req.body?.orderId || '');
  if (!orderId) return res.status(400).json({ success: false, message: 'Payment details are missing.' });

  const db = getDb();
  const order = (db.payments || []).find(p => p.orderId === orderId);
  if (!order || order.email !== email) return res.status(404).json({ success: false, message: 'Payment order not found.' });
  if (order.status === 'paid') return res.json(afterPayment(db, email, order));

  let cf;
  try {
    cf = await getOrder(orderId);
  } catch (err) {
    console.error('[payments] verify failed:', err.message);
    return res.status(502).json({ success: false, message: 'Could not reach the payment service. Please try again in a minute.' });
  }
  if (cf.order_status !== 'PAID') {
    if (cf.order_status !== 'ACTIVE' && order.voucher) { const fresh = getDb(); if (Campus.releaseForOrder(fresh, orderId)) saveDb(fresh); }
    return res.status(409).json({ success: false, code: 'NOT_PAID', status: cf.order_status, message: cf.order_status === 'ACTIVE' ? 'The payment has not gone through yet.' : 'This payment was not completed. No money was taken - please try again.' });
  }
  const payment = await successfulPayment(orderId);
  // re-read after the network calls so changes made meanwhile are kept (and a webhook that already
  // fulfilled this order is seen)
  const fresh = getDb();
  const live = (fresh.payments || []).find(p => p.orderId === orderId);
  if (fulfil(fresh, live, payment?.cf_payment_id, 'checkout')) {
    saveDb(fresh);
    sendReceipt(fresh, live);
  }
  res.json(afterPayment(fresh, email, live));
});

// Cashfree -> server. Configure in Cashfree Dashboard > Developers > Webhooks with the URL
// https://<site>/api/payments/webhook (payment success events); it is signed with the secret key.
router.post('/payments/webhook', (req, res) => {
  if (!webhookSignatureValid(req.rawBody, req.headers['x-webhook-timestamp'], req.headers['x-webhook-signature'])) return res.status(400).json({ success: false });
  const data = req.body?.data || {};
  const orderId = data.order?.order_id;
  if (String(req.body?.type || '').startsWith('PAYMENT_SUCCESS') && data.payment?.payment_status === 'SUCCESS' && orderId) {
    const db = getDb();
    const order = (db.payments || []).find(p => p.orderId === orderId);
    if (order && Math.round(Number(data.order?.order_amount) * 100) === order.amount && fulfil(db, order, data.payment?.cf_payment_id, 'webhook')) {
      saveDb(db);
      sendReceipt(db, order);
    }
  }
  res.json({ success: true });
});

router.get('/admin/payments', verifyAdminToken, (req, res) => {
  const db = getDb();
  const payments = [...(db.payments || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json({ success: true, enabled: cashfreeConfigured(), mode: cashfreeMode(), payments });
});

export default router;
