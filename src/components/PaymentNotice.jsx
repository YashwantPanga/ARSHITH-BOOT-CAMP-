import React, { useEffect, useState } from 'react';
import { X, IndianRupee, Mail, Phone, Loader2, ShieldCheck } from 'lucide-react';
import { displayTitle } from '../utils/textUtils';
import { api } from '../services/api';

let checkoutScript = null;
const loadCheckout = () => {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript) {
    checkoutScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve;
      s.onerror = () => { checkoutScript = null; reject(new Error('Could not load the payment window. Check your internet connection.')); };
      document.body.appendChild(s);
    });
  }
  return checkoutScript;
};

/**
 * Shown when a course needs payment (every course after the free one, or a failed course again).
 * With online payment on (Razorpay keys set on the server) the learner pays here and the course
 * unlocks straight away - onPaid(enrolmentState) is called once the server has confirmed the payment.
 * Otherwise the learner contacts the team and the admin enrols them.
 */
export default function PaymentNotice({ course, price = 99, retake = false, paymentsEnabled, onPaid, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Show the Pay button unless the server has said online payment is off; if it turns out to be
  // off when the learner presses Pay (PAYMENTS_OFF), the contact details are shown instead.
  const [online, setOnline] = useState(paymentsEnabled !== false);
  useEffect(() => { if (paymentsEnabled === false) setOnline(false); }, [paymentsEnabled]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);
  useEffect(() => { if (online) loadCheckout().catch(() => {}); }, [online]);

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const [order] = await Promise.all([api.createPaymentOrder(course.id), loadCheckout()]);
      const rz = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Arshith Bootcamp',
        description: displayTitle(order.courseTitle),
        prefill: order.prefill,
        theme: { color: '#013A2B' },
        handler: async (resp) => {
          try {
            const state = await api.verifyPayment(resp);
            onPaid?.(state);
          } catch (err) {
            setError(err.message || 'We could not confirm the payment. If money was taken, contact us with your payment ID.');
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) }
      });
      rz.on('payment.failed', (r) => setError(r?.error?.description || 'The payment failed. No money was taken - please try again.'));
      rz.open();
    } catch (err) {
      if (err.data?.code === 'PAYMENTS_OFF') setOnline(false);
      setError(err.data?.code === 'PAYMENTS_OFF' ? '' : (err.message || 'Could not start the payment. Please try again.'));
      setBusy(false);
    }
  };

  const subject = encodeURIComponent(`Enrol in ${course?.title || 'a course'} (₹${price})`);
  const contact = (
    <div className="mt-3 grid gap-1.5">
      <a href={`mailto:bootcamp@arshithgroup.com?subject=${subject}`} className="inline-flex items-center gap-2 text-forest font-semibold hover:underline"><Mail className="w-4 h-4" /> bootcamp@arshithgroup.com</a>
      <a href="tel:+918217729744" className="inline-flex items-center gap-2 text-forest font-semibold hover:underline"><Phone className="w-4 h-4" /> +91 82177 29744</a>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-evergreen/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={() => !busy && onClose()}>
      <div className="relative w-full max-w-md rounded-[22px] bg-ivory p-6 sm:p-7 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} disabled={busy} className="absolute top-3 right-3 p-2 rounded-full text-charcoal/50 hover:bg-cream disabled:opacity-40" aria-label="Close"><X className="w-4 h-4" /></button>
        <span className="w-14 h-14 rounded-full bg-brand-100 text-forest flex items-center justify-center"><IndianRupee className="w-7 h-7" /></span>
        <h2 id="pay-title" className="mt-4 text-[23px] font-bold text-evergreen leading-tight">{online ? `Unlock ${displayTitle(course?.title || 'this course')}${retake ? ' again' : ''} for ₹${price}` : `${displayTitle(course?.title || 'This course')} costs ₹${price}`}</h2>
        <p className="mt-2 text-[14.5px] text-charcoal/70 leading-relaxed">
          {retake
            ? <>You used both final assessment attempts without passing, so this course is locked. Pay ₹{price} to study it again with two fresh attempts.</>
            : <>Every student gets one free course. Each further course costs ₹{price} to unlock - including the same course again after
              failing its final assessment twice, which gives two fresh attempts.</>}
        </p>
        {online ? (
          <>
            <ul className="mt-4 rounded-xl bg-white border border-sage/25 p-4 text-[14px] text-charcoal/75 space-y-1.5">
              <li>✓ Full course, quizzes, project and proctored final</li>
              <li>✓ Two attempts at the final assessment</li>
              <li>✓ Verifiable certificate when you pass</li>
            </ul>
            {error && <p className="mt-3 text-[13.5px] text-rose-600" role="alert">{error}</p>}
            <button onClick={pay} disabled={busy} className="font-display mt-5 w-full h-12 rounded-md bg-forest text-ivory text-[15.5px] font-semibold hover:bg-sage transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening secure payment…</> : `Pay ₹${price} and unlock`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-charcoal/55"><ShieldCheck className="w-3.5 h-3.5" /> UPI, cards and net banking, secured by Razorpay</p>
          </>
        ) : (
          <>
            <div className="mt-4 rounded-xl border border-dashed border-sage/50 bg-white p-4 text-[14px] text-charcoal/75">
              <p className="font-display font-semibold text-evergreen">Online payment is coming soon</p>
              <p className="mt-1">To enrol now, contact us. After payment we enrol you straight away.</p>
              {contact}
            </div>
            <button onClick={onClose} className="font-display mt-5 w-full h-12 rounded-md bg-forest text-ivory text-[15.5px] font-semibold hover:bg-sage transition-colors">OK</button>
          </>
        )}
      </div>
    </div>
  );
}
