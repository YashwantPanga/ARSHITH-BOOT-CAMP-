import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { enrolmentState, enrol } from '../lib/enrollment.js';
import { razorpayConfigured, razorpayKeyId, createOrder, paymentSignatureValid, webhookSignatureValid } from '../lib/razorpay.js';
import { sendMail } from '../lib/mailer.js';
import { verifyAdminToken } from '../middleware/auth.js';

// Paid course unlocks through Razorpay:
//  1. POST /payments/order   - the server works out the price and creates a Razorpay order
//  2. Razorpay Checkout runs in the browser
//  3. POST /payments/verify  - the server checks Razorpay's signature and unlocks the course
//  4. POST /payments/webhook - Razorpay's own confirmation; unlocks the course if step 3 never arrived
// Each order is stored in db.payments, so an order unlocks its course exactly once.
const router = express.Router();
const norm = (v) => String(v || '').trim().toLowerCase();

/** Marks the order paid and unlocks its course (once). Returns true when this call did it. */
function fulfil(db, order, paymentId, via) {
  if (order.status === 'paid') return false;
  order.status = 'paid';
  order.paymentId = paymentId;
  order.paidAt = new Date().toISOString();
  order.confirmedBy = via;
  enrol(db, order.email, order.courseId, { paid: true, by: 'razorpay' });
  logActivity({ action: 'Course payment', target: order.email, details: `Paid ₹${order.amount / 100} for ${order.courseTitle} (${paymentId})`, ipAddress: '-', device: 'Razorpay' });
  return true;
}

function sendReceipt(db, order) {
  const learner = db.learners?.[order.email];
  const name = learner?.name || order.email;
  const date = new Date(order.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const rows = [['Course', order.courseTitle], ['Amount', `₹${(order.amount / 100).toFixed(2)}`], ['Payment ID', order.paymentId], ['Order ID', order.orderId], ['Date', date]];
  sendMail({
    to: order.email,
    subject: `Payment received - ${order.courseTitle} is unlocked`,
    text: `Hi ${name},\n\nThank you for your payment. ${order.courseTitle} is now unlocked in your dashboard.\n\n${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nCodeLekho`,
    html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#302B25">
      <h2 style="color:#013A2B">Payment received</h2>
      <p>Hi ${name},</p><p>Thank you for your payment. <strong>${order.courseTitle}</strong> is now unlocked in your dashboard.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#426557">${k}</td><td style="padding:6px 0;text-align:right"><strong>${v}</strong></td></tr>`).join('')}</table>
      <p style="font-size:12px;color:#888;margin-top:24px">Questions about this payment? Reply to this email or write to codelekho@arshithgroup.com.</p></div>`
  }).catch(() => {});
}

router.post('/payments/order', async (req, res) => {
  const email = req.learnerEmail;
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in to pay.' });
  if (!razorpayConfigured()) return res.status(503).json({ success: false, code: 'PAYMENTS_OFF', message: 'Online payment is not available yet. Please contact us to enrol.' });

  const db = getDb();
  const course = (db.courses || []).find(c => c.id === req.body.courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  const state = enrolmentState(db, email);
  if (state.courses[course.id] === 'active') return res.status(409).json({ success: false, code: 'ALREADY_ENROLLED', message: 'This course is already unlocked for you.' });
  if (state.passedCourseIds.includes(course.id)) return res.status(409).json({ success: false, message: 'You have already passed this course. Your certificate is in your dashboard.' });
  if (!(state.nextPrice > 0)) return res.status(409).json({ success: false, code: 'FREE_COURSE', message: 'This course is free for you - enrol without paying.' });

  const amount = state.nextPrice * 100;
  try {
    const rz = await createOrder({ amount, receipt: `arb_${Date.now().toString(36)}`, notes: { email, courseId: course.id } });
    if (!db.payments) db.payments = [];
    db.payments.push({ orderId: rz.id, email, courseId: course.id, courseTitle: course.title, amount, currency: 'INR', status: 'created', createdAt: new Date().toISOString() });
    saveDb(db);
    const learner = db.learners?.[email];
    res.json({ success: true, keyId: razorpayKeyId(), orderId: rz.id, amount, currency: 'INR', courseTitle: course.title, prefill: { name: learner?.name || '', email } });
  } catch (err) {
    console.error('[payments] order failed:', err.message);
    res.status(502).json({ success: false, message: 'Could not start the payment. Please try again in a minute.' });
  }
});

router.post('/payments/verify', (req, res) => {
  const email = req.learnerEmail;
  if (!email) return res.status(401).json({ success: false, code: 'LEARNER_AUTH_REQUIRED', message: 'Please sign in again.' });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (!orderId || !paymentId || !signature) return res.status(400).json({ success: false, message: 'Payment details are missing.' });

  const db = getDb();
  const order = (db.payments || []).find(p => p.orderId === orderId);
  if (!order || order.email !== email) return res.status(404).json({ success: false, message: 'Payment order not found.' });
  if (!paymentSignatureValid(orderId, paymentId, signature)) {
    return res.status(400).json({ success: false, code: 'BAD_SIGNATURE', message: 'We could not confirm this payment. If money was taken, contact us with your payment ID.' });
  }
  if (fulfil(db, order, paymentId, 'checkout')) {
    saveDb(db);
    sendReceipt(db, order);
  }
  res.json({ success: true, courseId: order.courseId, paymentId, ...enrolmentState(db, email) });
});

// Razorpay -> server. Configure in Razorpay Dashboard > Webhooks with the events payment.captured
// and order.paid, URL https://<site>/api/payments/webhook, and the same secret as RAZORPAY_WEBHOOK_SECRET.
router.post('/payments/webhook', (req, res) => {
  if (!webhookSignatureValid(req.rawBody, req.headers['x-razorpay-signature'])) return res.status(400).json({ success: false });
  const payment = req.body?.payload?.payment?.entity;
  if (['payment.captured', 'order.paid'].includes(req.body?.event) && payment?.order_id) {
    const db = getDb();
    const order = (db.payments || []).find(p => p.orderId === payment.order_id);
    if (order && fulfil(db, order, payment.id, 'webhook')) {
      saveDb(db);
      sendReceipt(db, order);
    }
  }
  res.json({ success: true });
});

router.get('/admin/payments', verifyAdminToken, (req, res) => {
  const db = getDb();
  const payments = [...(db.payments || [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json({ success: true, enabled: razorpayConfigured(), payments });
});

export default router;
