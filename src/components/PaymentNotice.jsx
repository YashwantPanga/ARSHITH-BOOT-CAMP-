import React, { useEffect } from 'react';
import { X, IndianRupee, Mail, Phone } from 'lucide-react';
import { displayTitle } from '../utils/textUtils';

/**
 * Shown when a course needs payment (after failing a final assessment twice). Online payment is not
 * connected yet, so the learner contacts the team, and the admin enrols them after payment.
 */
export default function PaymentNotice({ course, price = 99, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const subject = encodeURIComponent(`Enrol in ${course?.title || 'a course'} (₹${price})`);
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-evergreen/60 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-[22px] bg-ivory p-6 sm:p-7 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full text-charcoal/50 hover:bg-cream" aria-label="Close"><X className="w-4 h-4" /></button>
        <span className="w-14 h-14 rounded-full bg-brand-100 text-forest flex items-center justify-center"><IndianRupee className="w-7 h-7" /></span>
        <h2 id="pay-title" className="mt-4 text-[23px] font-bold text-evergreen leading-tight">{displayTitle(course?.title || 'This course')} costs ₹{price}</h2>
        <p className="mt-2 text-[14.5px] text-charcoal/70 leading-relaxed">
          Every student gets one free course. Each further course costs ₹{price} to unlock - including the same course again after
          failing its final assessment twice, which gives two fresh attempts.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-sage/50 bg-white p-4 text-[14px] text-charcoal/75">
          <p className="font-display font-semibold text-evergreen">Online payment is coming soon</p>
          <p className="mt-1">To enrol now, contact us. After payment we enrol you straight away.</p>
          <div className="mt-3 grid gap-1.5">
            <a href={`mailto:bootcamp@arshithgroup.com?subject=${subject}`} className="inline-flex items-center gap-2 text-forest font-semibold hover:underline"><Mail className="w-4 h-4" /> bootcamp@arshithgroup.com</a>
            <a href="tel:+918217729744" className="inline-flex items-center gap-2 text-forest font-semibold hover:underline"><Phone className="w-4 h-4" /> +91 82177 29744</a>
          </div>
        </div>
        <button onClick={onClose} className="font-display mt-5 w-full h-12 rounded-md bg-forest text-ivory text-[15.5px] font-semibold hover:bg-sage transition-colors">OK</button>
      </div>
    </div>
  );
}
