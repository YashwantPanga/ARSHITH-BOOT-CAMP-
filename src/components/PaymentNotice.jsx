import React, { useEffect, useRef, useState } from 'react';
import { X, IndianRupee, Mail, Phone, Loader2, ShieldCheck, TicketPercent, Check, PartyPopper } from 'lucide-react';
import { displayTitle } from '../utils/textUtils';
import { api } from '../services/api';
import { payWithCashfree, preloadCashfree } from '../utils/cashfree';
import { rupees } from '../utils/referral';

/**
 * Shown when something needs payment: a course (or a failed course again) or Interview Prep (product="interview"). With online payment on (Cashfree keys set on the
 * server) the learner pays here and it unlocks straight away - onPaid(serverState) is called once the
 * server has confirmed the payment with Cashfree. Otherwise the learner contacts the team.
 */
export default function PaymentNotice({ course, price = 149, retake = false, product = 'course', paymentsEnabled, onPaid, onClose }) {
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
  const [celebrate, setCelebrate] = useState(false);   // the offer was just applied here
  const fetchQuote = () => api.getPaymentQuote(interview ? { product: 'interview' } : { courseId: course?.id });
  useEffect(() => {
    let live = true;
    fetchQuote().then(q => { if (live) setQuote(q); }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {quote && (
          <PriceBox quote={quote} celebrate={celebrate} money={money} fetchQuote={fetchQuote} disabled={busy} onApplied={(q) => { setQuote(q); setCelebrate(true); }} />
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

/** Price summary with the "Have a referral code?" field. The server decides the price; this only asks it. */
function PriceBox({ quote, celebrate, money, onApplied, fetchQuote, disabled }) {
  const discounted = quote.discountPaise > 0;
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [state, setState] = useState({ busy: false, error: '', from: '' });
  const inputRef = useRef(null);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const apply = async (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) { setState(s => ({ ...s, error: 'Enter a referral code.' })); return; }
    setState({ busy: true, error: '', from: '' });
    try {
      const check = await api.checkReferralCode(c);
      if (!check.valid) throw new Error('This referral code is not valid.');
      try { await api.claimReferral(c); } catch (err) { if (err.data?.code !== 'ALREADY_REFERRED') throw err; }
      const q = await fetchQuote();
      if (!(q.discountPaise > 0)) throw new Error('This code does not give a discount on this item.');
      setState({ busy: false, error: '', from: check.referrerName || '' });
      onApplied(q);
    } catch (err) {
      setState({ busy: false, error: err.message || 'Could not apply this code.', from: '' });
    }
  };

  // after applying: the price counts down to the new amount
  const [shown, setShown] = useState(quote.finalPaise);
  useEffect(() => {
    if (!celebrate) { setShown(quote.finalPaise); return undefined; }
    const from = quote.originalPaise;
    const to = quote.finalPaise;
    const start = performance.now();
    const dur = 900;
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / dur);
      setShown(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const stop = setTimeout(() => setShown(to), dur + 200); // lands even when frames are paused
    return () => { cancelAnimationFrame(raf); clearTimeout(stop); };
  }, [celebrate, quote.originalPaise, quote.finalPaise]);

  if (discounted) {
    return (
      <div className={`relative mt-4 rounded-2xl border border-[#E5C88E] bg-gradient-to-b from-[#FFF8E8] to-[#FFFDF6] p-4 text-[14px] ${celebrate ? 'offer-pop' : ''}`}>
        {celebrate && <Burst />}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-forest text-ivory pl-1.5 pr-2.5 py-1 text-[12px] font-bold">
            <span className="w-4 h-4 rounded-full bg-[#E5C88E] text-forest flex items-center justify-center"><Check className="w-3 h-3" strokeWidth={3} /></span>
            {quote.referral?.code} applied
          </span>
          {state.from && <span className="text-[12px] text-charcoal/55">from {state.from}</span>}
        </div>
        <p className="mt-3 flex justify-between text-charcoal/65"><span>Price</span><span className={celebrate ? 'offer-strike' : 'line-through'}>{money(quote.originalPaise)}</span></p>
        <p className="mt-1 flex justify-between font-semibold text-[#8A6420]"><span>Referral discount ({quote.referral?.discountPct}%)</span><span>− {money(quote.discountPaise)}</span></p>
        <p className="mt-2.5 pt-2.5 border-t border-dashed border-[#E5C88E] flex items-end justify-between">
          <span className="font-display text-[15px] font-semibold text-evergreen">You pay</span>
          <span className={`font-display text-[24px] font-bold text-evergreen tabular-nums leading-none ${celebrate ? 'offer-price' : ''}`}>{money(shown)}</span>
        </p>
        {celebrate && <p className="offer-saved mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#E5C88E]/30 py-2 text-[13.5px] font-bold text-[#7A5A1E]"><PartyPopper className="w-4 h-4" /> Offer unlocked · you save {money(quote.discountPaise)}</p>}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="rounded-2xl bg-white border border-sage/25 px-4 py-3 flex items-center justify-between text-[14px]">
        <span className="text-charcoal/65">Price</span>
        <span className="font-display text-[18px] font-bold text-evergreen">{money(quote.originalPaise)}</span>
      </div>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} disabled={disabled} className="mt-2.5 w-full rounded-2xl border border-dashed border-[#C9A15A] bg-[#FFF8E8]/60 px-4 py-3 flex items-center gap-3 text-left hover:bg-[#FFF8E8] transition-colors">
          <span className="w-9 h-9 rounded-xl bg-[#E5C88E]/40 text-[#8A6420] flex items-center justify-center shrink-0"><TicketPercent className="w-5 h-5" /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold text-evergreen">Have a referral code?</span>
            <span className="block text-[12.5px] text-charcoal/55">Enter it to get an extra discount</span>
          </span>
          <span className="text-[13px] font-bold text-[#8A6420]">Apply</span>
        </button>
      ) : (
        <form onSubmit={apply} className="offer-open mt-2.5 rounded-2xl border border-[#C9A15A] bg-[#FFF8E8]/60 p-3">
          <label htmlFor="pay-ref" className="block text-[12.5px] font-semibold text-charcoal/70 mb-1.5">Referral code</label>
          <div className="flex gap-2">
            <input id="pay-ref" ref={inputRef} value={code} onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setState(s => ({ ...s, error: '' })); }} maxLength={16} placeholder="e.g. RIYAT497" autoComplete="off" className={`auth-input flex-1 min-w-0 font-mono tracking-[0.12em] ${state.error ? 'offer-shake !border-rose-400' : ''}`} />
            <button disabled={state.busy || disabled} className="h-12 px-5 rounded-xl bg-forest text-ivory font-display font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">{state.busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}</button>
          </div>
          {state.error
            ? <p className="mt-2 text-[12.5px] text-rose-600" role="alert">{state.error}</p>
            : <p className="mt-2 text-[12px] text-charcoal/50">For new learners. The discount covers every eligible purchase for 30 days.</p>}
        </form>
      )}
    </div>
  );
}

/** A short burst of gold and green confetti from the price box. */
function Burst() {
  const bits = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const d = 70 + (i % 3) * 26;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d - 30, c: ['#E5C88E', '#2BB673', '#C9A15A', '#13684C'][i % 4], r: (i * 47) % 360, delay: (i % 5) * 0.03 };
  });
  return (
    <span className="offer-burst pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ '--dx': `${b.dx}px`, '--dy': `${b.dy}px`, '--r': `${b.r}deg`, background: b.c, animationDelay: `${b.delay}s` }} className={i % 2 ? 'is-dot' : ''} />)}
    </span>
  );
}
