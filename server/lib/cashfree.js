// Cashfree Payments (online payment for paid courses and Interview Prep). Turned on by setting
// CASHFREE_APP_ID and CASHFREE_SECRET_KEY in .env. CASHFREE_ENV=production uses the live API; anything
// else uses the sandbox (test) API. Webhooks are signed with the same secret key.
import crypto from 'crypto';

const API_VERSION = '2023-08-01';

export const cashfreeConfigured = () => Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
export const cashfreeMode = () => (String(process.env.CASHFREE_ENV || '').trim().toLowerCase() === 'production' ? 'production' : 'sandbox');
const base = () => (cashfreeMode() === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg');

const headers = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'x-api-version': API_VERSION,
  'x-client-id': process.env.CASHFREE_APP_ID,
  'x-client-secret': process.env.CASHFREE_SECRET_KEY
});

async function call(path, init = {}) {
  const res = await fetch(`${base()}${path}`, { ...init, headers: headers(), signal: AbortSignal.timeout(20000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Cashfree returned ${res.status}`);
  return data;
}

/** A Cashfree order id: letters, digits, _ and - only, at most 45 characters. */
export const newOrderId = (prefix = 'cl') => `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;

/**
 * Creates an order. amount is in rupees. Returns Cashfree's order ({ order_id, payment_session_id, ... }).
 * customer: { id, email, phone, name }. Cashfree requires a 10-digit phone number.
 */
export async function createOrder({ orderId, amount, customer, returnUrl, note }) {
  const phone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
  return call('/orders', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      order_amount: Number(amount.toFixed(2)),
      order_currency: 'INR',
      customer_details: {
        customer_id: String(customer.id).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 50),
        customer_email: customer.email,
        customer_phone: phone.length === 10 ? phone : '9999999999',
        customer_name: customer.name || undefined
      },
      order_meta: returnUrl ? { return_url: returnUrl } : undefined,
      order_note: note || undefined
    })
  });
}

/** The order as Cashfree has it now; order_status is 'ACTIVE', 'PAID', 'EXPIRED' or 'TERMINATED'. */
export const getOrder = (orderId) => call(`/orders/${encodeURIComponent(orderId)}`);

/** Successful payment for the order, if any ({ cf_payment_id, payment_status, ... }). */
export async function successfulPayment(orderId) {
  const list = await call(`/orders/${encodeURIComponent(orderId)}/payments`).catch(() => []);
  return (Array.isArray(list) ? list : []).find(p => p.payment_status === 'SUCCESS') || null;
}

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** Webhook calls carry x-webhook-signature: base64(HMAC-SHA256(timestamp + raw body, secret key)). */
export function webhookSignatureValid(rawBody, timestamp, signature) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret || !rawBody || !timestamp || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(String(timestamp) + rawBody.toString('utf8')).digest('base64');
  return safeEqual(expected, signature);
}
