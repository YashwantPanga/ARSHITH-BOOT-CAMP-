import React, { useEffect, useState } from 'react';
import { X, IndianRupee, Mail, Phone, Loader2, ShieldCheck } from 'lucide-react';
import { displayTitle } from '../utils/textUtils';
import { api } from '../services/api';
import { payWithCashfree, preloadCashfree } from '../utils/cashfree';
import { rupees } from '../utils/referral';

/**
 * Shown when something needs payment: a course (or a failed course again) or Interview Prep (product="interview"). With online payment on (Cashfree keys set on the
 * server) the learner pays here and it unlocks straight away - onPaid(serverState) is called once the
 * server has confirmed the payment with Cashfree. Otherwise the learner contacts the team.
 */
export default function PaymentNotice({ course, price = 99, retake = false, product = 'course', paymentsEnabled, onPaid, onClose }) {
  const interview = product === 'interview';
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
  useEffect(() => { if (online) preloadCashfree(); }, [online]);
  // the server's price for this learner (a referral discount is applied there, never trusted from here)
  const [quote, setQuote] = useState(null);
  useEffect(() => {
    let live = true;
    api.getPaymentQuote(interview ? { product: 'interview' } : { courseId: course?.id }).then(q => { if (live) setQuote(q); }).catch(() => {});
    return () => { live = false; };
  }, [interview, course?.id]);
  const discounted = quote && quote.discountPaise > 0;
  const money = (paise) => rupees(paise, paise % 100 ? 2 : 0);
  const priceLabel = discounted ? money(quote.finalPaise) : `₹${price}`;

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      const state = await payWithCashfree(
        () => (interview ? api.createInterviewOrder() : api.createPaymentOrder(course.id)),
        { onConfirming: () => setConfirming(true) }
      );
      if (state) { onPaid?.(state); return; }
    } catch (err) {
      if (err.data?.code === 'PAYMENTS_OFF') setOnline(false);
      else if (err.data?.code === 'ALREADY_UNLOCKED' || err.data?.code === 'ALREADY_ENROLLED') { onPaid?.(err.data); return; }
      else setError(`${err.message || 'We could not confirm the payment.'}${err.orderId ? ` Your order ID is ${err.orderId} - if money was taken, send it to codelekho@arshithgroup.com and we will unlock it.` : ''}`);
    }
    setBusy(false);
    setConfirming(false);
  };

  const itemTitle = interview ? 'Interview Prep' : displayTitle(course?.title || 'this course');
  const subject = encodeURIComponent(`${interview ? 'Unlock Interview Prep' : `Enrol in ${course?.title || 'a course'}`} (₹${price})`);
  const contact = (
    <div className="mt-3 grid gap-1.5">
      <a href={`mailto:codelekho@arshithgroup.com?subject=${subject}`} className="inline-flex items-center gap-2 text-forest font-semibold hover:underline"><Mail className="w-4 h-4" /> codelekho@arshithgroup.com</a>
      <a href="tel:+918217729744" className="inline-flex items-center gap-2 text-forest font-semibold hover:underline"><Phone className="w-4 h-4" /> +91 82177 29744</a>
    </div>
  );
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-evergreen/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={() => !busy && onClose()}>
      <div className="relative w-full max-w-md rounded-[22px] bg-ivory p-6 sm:p-7 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} disabled={busy} className="absolute top-3 right-3 p-2 rounded-full text-charcoal/50 hover:bg-cream disabled:opacity-40" aria-label="Close"><X className="w-4 h-4" /></button>
        <span className="w-14 h-14 rounded-full bg-brand-100 text-forest flex items-center justify-center"><IndianRupee className="w-7 h-7" /></span>
        <h2 id="pay-title" className="mt-4 text-[23px] font-bold text-evergreen leading-tight">{online ? `Unlock ${itemTitle}${retake ? ' again' : ''} for ${priceLabel}` : `${itemTitle} costs ${priceLabel}`}</h2>
        <p className="mt-2 text-[14.5px] text-charcoal/70 leading-relaxed">
          {interview
            ? <>A one-time payment unlocks every Interview Prep set for good. It is free for students who complete all 4 courses.</>
            : retake
            ? <>You used both final assessment attempts without passing, so this course is locked. Buy it again for ₹{price} to study it once more with two fresh attempts.</>
            : <>One-time payment for the full course and certificate. You get two attempts at the final assessment; if you fail both, you can buy the course again.</>}
        </p>
            {discounted && (
              <div className="mt-4 rounded-xl border border-[#E5C88E] bg-[#FFF8E8] p-4 text-[14px]">
                <p className="flex justify-between text-charcoal/70"><span>Price</span><span className="line-through">{money(quote.originalPaise)}</span></p>
                <p className="mt-1 flex justify-between font-semibold text-[#8A6420]"><span>Referral Discount Applied ({quote.referral?.discountPct}%)</span><span>− {money(quote.discountPaise)}</span></p>
                <p className="mt-2 pt-2 border-t border-[#E5C88E]/60 flex justify-between font-display text-[16px] font-bold text-evergreen"><span>You pay</span><span>{money(quote.finalPaise)}</span></p>
              </div>
            )}
        {online ? (
          <>
            <ul className="mt-4 rounded-xl bg-white border border-sage/25 p-4 text-[14px] text-charcoal/75 space-y-1.5">
              {interview ? (
                <>
                  <li>✓ 350+ coding problems and interview questions</li>
                  <li>✓ Daily plans, multiple approaches and solutions</li>
                  <li>✓ Lifetime access - pay once</li>
                </>
              ) : (
                <>
                  <li>✓ Full course, quizzes, project and proctored final</li>
                  <li>✓ Two attempts at the final assessment</li>
                  <li>✓ Verifiable certificate when you pass</li>
                </>
              )}
            </ul>
            {error && <p className="mt-3 text-[13.5px] text-rose-600" role="alert">{error}</p>}
            <button onClick={pay} disabled={busy} className="font-display mt-5 w-full h-12 rounded-md bg-forest text-ivory text-[15.5px] font-semibold hover:bg-sage transition-colors disabled:opacity-70 inline-flex items-center justify-center gap-2">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> {confirming ? 'Confirming your payment…' : 'Opening secure payment…'}</> : `Pay ${priceLabel} and unlock`}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-charcoal/55"><ShieldCheck className="w-3.5 h-3.5" /> UPI, cards and net banking, secured by Cashfree</p>
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
