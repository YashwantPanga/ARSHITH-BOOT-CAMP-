import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { paths } from '../router';
import { displayTitle } from '../utils/textUtils';

/**
 * Shown once to a learner whose account is linked to a referral (signed up with a code or opened a
 * friend's link): a gift opens and shows what each course now costs them. Dismissed for good per account.
 */
const seenKey = (email) => `cl_ref_welcome_${email}`;
const seen = (email) => { try { return localStorage.getItem(seenKey(email)) === '1'; } catch { return true; } };
const markSeen = (email) => { try { localStorage.setItem(seenKey(email), '1'); } catch { /* ignore */ } };
const money = (paise) => `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const dialogOpen = () => !!document.querySelector('[role="dialog"][aria-modal="true"]');

export default function ReferralWelcome({ studentUser, courses = [], navigate, enabled }) {
  const [gift, setGift] = useState(null);
  const [priced, setPriced] = useState([]);
  const email = studentUser?.email;

  useEffect(() => {
    if (!enabled || !email || seen(email)) return undefined;
    let live = true; let timer;
    api.getMyReferrals().then(d => {
      const a = d?.attribution;
      if (!live || !a || a.used) return;
      const show = () => { if (!live) return; if (dialogOpen()) { timer = setTimeout(show, 1500); return; } setGift(a); };
      timer = setTimeout(show, 700);
    }).catch(() => {});
    return () => { live = false; clearTimeout(timer); };
  }, [enabled, email]);

  // prices come from the server; fetch them if the page only has the offline catalogue
  const havePrices = courses.some(c => Number(c.price) > 0);
  useEffect(() => {
    if (!gift || havePrices) return;
    api.getPublicCourses().then(r => setPriced(r.courses || [])).catch(() => {});
  }, [gift, havePrices]);

  if (!gift) return null;
  const close = () => { markSeen(email); setGift(null); };
  const go = () => { close(); navigate(paths.courses()); };
  const pct = gift.discountPct || 10;
  const list = (havePrices ? courses : priced).filter(c => Number(c.price) > 0).slice(0, 4);
  const until = new Date(gift.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  return createPortal(
    <div className="fixed inset-0 z-[115] flex items-end sm:items-center justify-center bg-[#06231D]/60 backdrop-blur-[3px] animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="refwel-title" onClick={close}>
      <div className="refwel relative w-full sm:max-w-[420px] rounded-t-[28px] sm:rounded-[28px] overflow-hidden bg-ivory shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>

        {/* the gift */}
        <div className="relative h-[210px] bg-[linear-gradient(160deg,#145A43,#0A2F24_70%)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(55%_65%_at_50%_70%,rgba(229,200,142,.35),transparent_70%)]" aria-hidden="true" />
          <span className="refwel-rays absolute left-1/2 top-[62%] w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
          {Array.from({ length: 22 }, (_, i) => (
            <i key={i} className="refwel-bit" style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 7) * 0.12}s`, '--r': `${(i * 53) % 360}deg`, background: ['#E5C88E', '#2BB673', '#FFF1C9', '#8EE3B5'][i % 4] }} aria-hidden="true" />
          ))}
          <svg viewBox="0 0 200 160" className="absolute left-1/2 bottom-0 w-[220px] -translate-x-1/2" aria-hidden="true">
            <defs>
              <linearGradient id="rw-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C9" /><stop offset=".55" stopColor="#E5C88E" /><stop offset="1" stopColor="#B88A3E" /></linearGradient>
              <linearGradient id="rw-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A9A72" /><stop offset="1" stopColor="#0E4A37" /></linearGradient>
            </defs>
            {/* the pass rising out of the box */}
            <g className="refwel-pass">
              <rect x="66" y="34" width="68" height="84" rx="8" fill="#FFFDF7" />
              <rect x="74" y="42" width="52" height="30" rx="5" fill="#1E7A5A" />
              <text x="100" y="61.5" textAnchor="middle" fontSize="11.5" fontWeight="900" letterSpacing=".5" fill="#FFF1C9" fontFamily="system-ui, sans-serif">{pct}% OFF</text>
              <rect x="76" y="80" width="40" height="4" rx="2" fill="#0C2D26" opacity=".25" />
              <rect x="76" y="89" width="30" height="4" rx="2" fill="#0C2D26" opacity=".15" />
              <circle cx="120" cy="104" r="6" fill="url(#rw-gold)" />
            </g>
            <rect x="46" y="104" width="108" height="56" rx="8" fill="url(#rw-box)" />
            <rect x="92" y="104" width="16" height="56" fill="url(#rw-gold)" />
            <g className="refwel-lid">
              <rect x="40" y="94" width="120" height="18" rx="6" fill="#2A9A72" />
              <rect x="92" y="94" width="16" height="18" fill="url(#rw-gold)" />
            </g>
          </svg>
        </div>

        <div className="px-6 pt-5 pb-6 sm:px-7">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.2em] text-[#8A6420]">A gift from {gift.referrerName}</p>
          <h2 id="refwel-title" className="mt-1.5 font-display text-[26px] font-bold leading-[1.1] text-evergreen">Welcome! {pct}% off is yours</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-charcoal/65">You joined with {gift.referrerName}'s invite, so every course and Interview Prep costs {pct}% less until {until}. It is applied automatically at checkout.</p>

          {list.length > 0 && (
            <ul className="mt-4 rounded-2xl border border-[#E8E1CF] bg-white divide-y divide-[#F0EADC]">
              {list.map((c, i) => {
                const orig = Math.round(Number(c.price) * 100);
                const off = orig - Math.floor((orig * pct) / 100);
                return (
                  <li key={c.id} className="refwel-row flex items-center justify-between gap-3 px-4 py-2.5" style={{ animationDelay: `${0.5 + i * 0.08}s` }}>
                    <span className="min-w-0 truncate text-[13.5px] font-medium text-evergreen">{displayTitle(c.title)}</span>
                    <span className="shrink-0 text-[13px]"><s className="text-charcoal/40 mr-1.5">{money(orig)}</s><b className="font-display text-[15px] text-forest">{money(off)}</b></span>
                  </li>
                );
              })}
            </ul>
          )}

          <button onClick={go} className="mt-5 w-full h-12 rounded-xl bg-forest text-ivory font-display text-[15.5px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-sage transition-colors">Pick my course <ArrowRight className="w-4 h-4" /></button>
          <button onClick={close} className="mt-2 w-full h-10 text-[13.5px] font-medium text-charcoal/55 hover:text-charcoal/80">Maybe later</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
