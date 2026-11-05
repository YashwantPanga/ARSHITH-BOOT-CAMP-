import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { enrolmentState, enrol } from '../lib/enrollment.js';
import { cashfreeConfigured, cashfreeMode, createOrder, getOrder, successfulPayment, newOrderId, webhookSignatureValid } from '../lib/cashfree.js';
import { interviewPrice, interviewPaid, grantInterview } from '../lib/interviewAccess.js';
import { interviewUnlockedByCertificates } from './interviewRoutes.js';
import { sendMail } from '../lib/mailer.js';
import { verifyAdminToken } from '../middleware/auth.js';

// Paid unlocks through Cashfree - a course (every course after the free one) or Interview Prep:
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

router.post('/payments/order', async (req, res) => {
  const email = req.learnerEmail;
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in to pay.' });
  if (!cashfreeConfigured()) return res.status(503).json({ success: false, code: 'PAYMENTS_OFF', message: 'Online payment is not available yet. Please contact us to enrol.' });

  const db = getDb();
  let item;
  if (req.body.product === 'interview') {
    if (interviewPaid(db, email) || interviewUnlockedByCertificates(db, email)) return res.status(409).json({ success: false, code: 'ALREADY_UNLOCKED', message: 'Interview Prep is already unlocked for you.' });
    item = { kind: 'interview', courseId: INTERVIEW, title: 'Interview Prep', price: interviewPrice(), back: '/interview' };
  } else {
    const course = (db.courses || []).find(c => c.id === req.body.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
    const state = enrolmentState(db, email);
    if (state.courses[course.id] === 'active') return res.status(409).json({ success: false, code: 'ALREADY_ENROLLED', message: 'This course is already unlocked for you.' });
    if (state.passedCourseIds.includes(course.id)) return res.status(409).json({ success: false, message: 'You have already passed this course. Your certificate is in your dashboard.' });
    if (!(state.nextPrice > 0)) return res.status(409).json({ success: false, code: 'FREE_COURSE', message: 'This course is free for you - enrol without paying.' });
    item = { kind: 'course', courseId: course.id, title: course.title, price: state.nextPrice, back: '/dashboard' };
  }

  const orderId = newOrderId(item.kind === 'interview' ? 'ip' : 'cl');
  const learner = db.learners?.[email];
  try {
    const cf = await createOrder({
      orderId,
      amount: item.price,
      customer: { id: learner?.learnerId || email, email, phone: learner?.phone, name: learner?.name },
      // UPI apps and some banks come back to the site instead of the payment window
      returnUrl: `${siteUrl(req)}${item.back}?cf_order={order_id}`,
      note: item.title
    });
    if (!db.payments) db.payments = [];
    db.payments.push({ orderId, kind: item.kind, email, courseId: item.courseId, courseTitle: item.title, amount: item.price * 100, currency: 'INR', status: 'created', gateway: 'cashfree', createdAt: new Date().toISOString() });
    saveDb(db);
    res.json({ success: true, orderId, paymentSessionId: cf.payment_session_id, mode: cashfreeMode(), amount: item.price, currency: 'INR', title: item.title, kind: item.kind });
  } catch (err) {
    console.error('[payments] order failed:', err.message);
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
    return res.status(409).json({ success: false, code: 'NOT_PAID', status: cf.order_status, message: cf.order_status === 'ACTIVE' ? 'The payment has not gone through yet.' : 'This payment was not completed. No money was taken - please try again.' });
  }
  const payment = await successfulPayment(orderId);
  if (fulfil(db, order, payment?.cf_payment_id, 'checkout')) {
    saveDb(db);
    sendReceipt(db, order);
  }
  res.json(afterPayment(db, email, order));
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
    if (order && Number(data.order?.order_amount) * 100 === order.amount && fulfil(db, order, data.payment?.cf_payment_id, 'webhook')) {
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
