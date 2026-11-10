import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Gift, X } from 'lucide-react';
import { api } from '../services/api';
import { paths } from '../router';

/**
 * Refer & Earn promotion: a centred modal on desktop, a floating card above the bottom nav on phones.
 * Driven by the admin's promo settings (/referrals/promo): delay, dismissal period, pages, audience.
 * Never shown to admins, on account/checkout screens, while another dialog is open, or to a learner
 * who opted out.
 */
const DISMISS_KEY = 'cl_refpromo_dismissed';
const PAGE_TO_LOCATION = { home: 'home', courses: 'courses', categories: 'courses', 'course-details': 'course-details', dashboard: 'dashboard', interview: 'interview', about: 'about', contact: 'about' };
const isPhone = () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches;
const dismissedWithin = (days) => { try { const t = Number(localStorage.getItem(DISMISS_KEY) || 0); return t && Date.now() - t < days * 86400000; } catch { return true; } };
const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ } };
// another dialog (payment, enrol, auth, the phone welcome card) is open
const dialogOpen = () => !!document.querySelector('[role="dialog"][aria-modal="true"]');

let promoCache = null;
const loadPromo = () => (promoCache ||= api.getReferralPromo().then(r => r.promo).catch(() => { promoCache = null; return null; }));

export default function ReferralPromo({ routeName, signedIn, enabled, navigate }) {
  const [promo, setPromo] = useState(null);
  const [optOut, setOptOut] = useState(false);
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState(isPhone);

  useEffect(() => { if (enabled) loadPromo().then(setPromo); }, [enabled]);
  useEffect(() => {
    if (!signedIn) { setOptOut(false); return; }
    api.getMyReferrals().then(d => setOptOut(!!d.promoOptOut)).catch(() => {});
  }, [signedIn]);

  const location = PAGE_TO_LOCATION[routeName];
  const eligible = enabled && promo?.enabled && !optOut && location && (promo.locations || []).includes(location)
    && (signedIn ? promo.loggedIn : promo.guests) && !dismissedWithin(promo.dismissDays || 7);

  useEffect(() => {
    if (!eligible) { setShow(false); return undefined; }
    const ph = isPhone();
    setPhone(ph);
    if (ph ? !promo.mobileCard : !promo.desktopModal) return undefined;
    let timer;
    const tryShow = () => {
      // wait while another dialog is up, then try again a little later
      if (dialogOpen()) { timer = setTimeout(tryShow, 4000); return; }
      setShow(true);
    };
    timer = setTimeout(tryShow, Math.max(0, Number(promo.delaySeconds ?? 8)) * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, routeName]);

  useEffect(() => {
    if (!show || phone) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, phone]);

  if (!show || !promo) return null;
  const close = () => { dismiss(); setShow(false); };
  const go = () => { dismiss(); setShow(false); navigate(paths.refer()); };

  if (phone) {
    return createPortal(
      <div className="ref-promo-card fixed left-3 right-3 bottom-[84px] z-[60] rounded-[22px] overflow-hidden text-ivory shadow-[0_24px_50px_-18px_rgba(6,35,29,.85)]" role="complementary" aria-label="Refer and earn">
        <div className="relative bg-[#0C2D26] p-4 pr-11">
          <div className="absolute inset-0 bg-[radial-gradient(70%_100%_at_100%_0%,rgba(229,200,142,.22),transparent_70%)]" aria-hidden="true" />
          <button onClick={close} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center" aria-label="Dismiss"><X className="w-4 h-4" /></button>
          <div className="relative flex items-center gap-3">
            <span className="ref-gift w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-b from-[#F3D9A0] to-[#C9A15A] text-[#2A1D08] flex items-center justify-center"><Gift className="w-6 h-6" /></span>
            <span className="min-w-0">
              <span className="block font-display text-[16.5px] font-bold leading-tight">{promo.mobileHeadline}</span>
              <span className="block mt-0.5 text-[12.5px] leading-snug text-ivory/70">{promo.mobileDescription}</span>
            </span>
          </div>
          <button onClick={go} className="relative mt-3 w-full h-10 rounded-xl bg-[#E5C88E] text-[#2A1D08] font-display text-[14px] font-bold inline-flex items-center justify-center gap-1.5">{promo.cta} <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-[#06231D]/55 backdrop-blur-[3px] animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="ref-promo-title" onClick={close}>
      <div className="ref-promo relative w-full max-w-[760px] grid md:grid-cols-[1.05fr_1fr] rounded-[28px] overflow-hidden bg-ivory shadow-[0_40px_80px_-30px_rgba(6,35,29,.9)] animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 text-charcoal/60 hover:text-evergreen flex items-center justify-center" aria-label="Close"><X className="w-4 h-4" /></button>
        <div className="relative bg-[#0C2D26] p-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_45%,rgba(229,200,142,.2),transparent_70%)]" aria-hidden="true" />
          <PromoArt />
        </div>
        <div className="p-8 flex flex-col justify-center">
          <span className="self-start inline-flex items-center gap-1.5 rounded-full bg-[#FBF0D9] px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#8A6420]"><Gift className="w-3.5 h-3.5" /> Refer &amp; Earn</span>
          <h2 id="ref-promo-title" className="mt-4 font-display text-[32px] font-bold leading-[1.05] text-evergreen">{promo.headline}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-charcoal/70">{promo.description}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <span className="rounded-xl bg-brand-50 px-3 py-2.5"><b className="block font-display text-[20px] text-forest">{promo.discountPct}% off</b><span className="text-[12px] text-charcoal/60">for your friends</span></span>
            <span className="rounded-xl bg-[#FBF0D9] px-3 py-2.5"><b className="block font-display text-[20px] text-[#8A6420]">{promo.commissionPct}% to you</b><span className="text-[12px] text-charcoal/60">on what they pay</span></span>
          </div>
          <button onClick={go} className="mt-6 h-12 rounded-xl bg-forest text-ivory font-display text-[15.5px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-sage transition-colors">{promo.cta} <ArrowRight className="w-4 h-4" /></button>
          <button onClick={close} className="mt-2.5 text-[13px] text-charcoal/50 hover:text-charcoal/75">Maybe later</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PromoArt() {
  return (
    <svg viewBox="0 0 240 220" className="relative w-full max-w-[280px]" aria-hidden="true">
      <defs>
        <linearGradient id="rp-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE3A6" /><stop offset=".55" stopColor="#E5C88E" /><stop offset="1" stopColor="#B88A3E" /></linearGradient>
        <linearGradient id="rp-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A9A72" /><stop offset="1" stopColor="#0F4A37" /></linearGradient>
      </defs>
      {[[34, 52], [206, 46], [30, 170], [210, 168]].map(([x, y], i) => (
        <g key={i} className="ra-node" style={{ animationDelay: `${i * 0.35}s` }}>
          <line x1={x} y1={y} x2="120" y2="120" stroke="#8EE3B5" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="4 5" />
          <circle cx={x} cy={y} r="15" fill="#FFFDF7" stroke="#8EE3B5" strokeWidth="2" />
          <circle cx={x} cy={y - 3.5} r="5" fill="#1E7A5A" /><path d={`M${x - 8} ${y + 9} q8 -10 16 0`} fill="#1E7A5A" />
        </g>
      ))}
      <rect x="78" y="108" width="84" height="68" rx="9" fill="url(#rp-box)" />
      <rect x="112" y="108" width="16" height="68" fill="url(#rp-gold)" />
      <g className="ra-lid">
        <rect x="72" y="94" width="96" height="20" rx="6" fill="#2A9A72" />
        <rect x="112" y="94" width="16" height="20" fill="url(#rp-gold)" />
        <path d="M120 94 C 104 74 82 80 92 92 Z M120 94 C 136 74 158 80 148 92 Z" fill="url(#rp-gold)" />
      </g>
      {[[98, 56, 0], [142, 46, .5], [120, 30, 1]].map(([x, y, d], i) => (
        <g key={i} className="ra-coin" style={{ animationDelay: `${d}s` }}>
          <circle cx={x} cy={y} r="12" fill="url(#rp-gold)" stroke="#B88A3E" strokeWidth="1.2" />
          <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="#7A5A1E" fontFamily="system-ui">₹</text>
        </g>
      ))}
    </svg>
  );
}

/** Small card for the learner dashboard. */
export function ReferCard({ onClick }) {
  return (
    <button onClick={onClick} className="mt-4 w-full text-left relative overflow-hidden rounded-[20px] bg-[#0C2D26] text-ivory p-5 flex items-center gap-4 shadow-[0_18px_40px_-28px_rgba(6,35,29,.9)]">
      <span className="absolute inset-0 bg-[radial-gradient(60%_120%_at_100%_0%,rgba(229,200,142,.2),transparent_70%)]" aria-hidden="true" />
      <span className="relative w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-b from-[#F3D9A0] to-[#C9A15A] text-[#2A1D08] flex items-center justify-center"><Gift className="w-6 h-6" /></span>
      <span className="relative flex-1 min-w-0">
        <span className="block font-display text-[17px] font-bold">Refer &amp; Earn</span>
        <span className="block text-[13px] text-ivory/70">Friends save 10%. You earn 10% of what they pay.</span>
      </span>
      <ArrowRight className="relative w-5 h-5 text-[#E5C88E] shrink-0" />
    </button>
  );
}
