import { api } from '../services/api';

// Cashfree Checkout in the browser. The server creates the order (and its price); this opens
// Cashfree's payment window and then asks the server to confirm the order with Cashfree.
let sdk = null;
function loadSdk() {
  if (window.Cashfree) return Promise.resolve();
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      s.onload = resolve;
      s.onerror = () => { sdk = null; reject(new Error('Could not load the payment window. Check your internet connection.')); };
      document.body.appendChild(s);
    });
  }
  return sdk;
}
export const preloadCashfree = () => loadSdk().catch(() => {});

/**
 * Confirms an order with the server, retrying while Cashfree is still settling it or the phone's
 * connection drops. Resolves with the server's answer once the order is paid.
 */
export async function confirmOrder(orderId, tries = 6) {
  let last;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await api.verifyPayment(orderId);
    } catch (err) {
      last = err;
      const pending = err.data?.code === 'NOT_PAID' && err.data?.status === 'ACTIVE';
      const retryable = pending || !err.status || err.status >= 500;
      if (!retryable) throw err;
      await new Promise(r => setTimeout(r, attempt * 1500));
    }
  }
  throw last;
}

/**
 * Runs a payment end to end. createOrder() returns the server's order ({ orderId, paymentSessionId, mode }).
 * onConfirming() is called once the window closes after paying. Resolves with the confirmed state, or
 * null when the learner closed the window without paying.
 */
export async function payWithCashfree(createOrder, { onConfirming } = {}) {
  const [order] = await Promise.all([createOrder(), loadSdk()]);
  const cashfree = window.Cashfree({ mode: order.mode === 'production' ? 'production' : 'sandbox' });
  const result = await cashfree.checkout({ paymentSessionId: order.paymentSessionId, redirectTarget: '_modal' });
  if (result?.error) {
    // closing the window is not an error worth showing
    const msg = result.error.message || '';
    if (/closed|cancel/i.test(msg)) {
      // the learner may still have paid (e.g. in a UPI app) - check once quietly
      try { return await api.verifyPayment(order.orderId); } catch { return null; }
    }
    throw Object.assign(new Error(msg || 'The payment failed. No money was taken - please try again.'), { orderId: order.orderId });
  }
  onConfirming?.();
  try {
    return await confirmOrder(order.orderId);
  } catch (err) {
    err.orderId = order.orderId;
    throw err;
  }
}
