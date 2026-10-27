// Razorpay (online payment for paid courses). Turned on by setting RAZORPAY_KEY_ID and
// RAZORPAY_KEY_SECRET in .env; RAZORPAY_WEBHOOK_SECRET is optional and enables the webhook, which
// unlocks the course even when the student closes the page right after paying.
import crypto from 'crypto';

const API = 'https://api.razorpay.com/v1';

export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || '';

/** Creates an order. amount is in paise. Returns Razorpay's order object ({ id, amount, currency, ... }). */
export async function createOrder({ amount, receipt, notes }) {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount, currency: 'INR', receipt, notes })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || `Razorpay returned ${res.status}`);
  return data;
}

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** The signature Checkout returns after a successful payment: HMAC-SHA256("order_id|payment_id"). */
export function paymentSignatureValid(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

/** Webhook calls carry X-Razorpay-Signature: HMAC-SHA256 of the raw body with the webhook secret. */
export function webhookSignatureValid(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}
