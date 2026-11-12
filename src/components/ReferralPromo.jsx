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
// the small Refer & Earn ring on phones can be hidden for the rest of the visit
const RING_KEY = 'cl_refring_hidden';
const ringHidden = () => { try { return sessionStorage.getItem(RING_KEY) === '1'; } catch { return false; } };
const hideRing = () => { try { sessionStorage.setItem(RING_KEY, '1'); } catch { /* ignore */ } };

let promoCache = null;
const loadPromo = () => (promoCache ||= api.getReferralPromo().then(r => r.promo).catch(() => { promoCache = null; return null; }));

export default function ReferralPromo({ routeName, signedIn, enabled, navigate }) {
  const [promo, setPromo] = useState(null);
  const [optOut, setOptOut] = useState(false);
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState(isPhone);
  const [ringOff, setRingOff] = useState(ringHidden);

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

  // phones: a small floating ring on browsing pages whenever the card is not showing
  const ringOk = enabled && promo?.enabled && promo.mobileCard && !optOut && !!location && (signedIn ? promo.loggedIn : promo.guests) && !ringOff;
  const ring = ringOk && !show ? (
    <ReferRing
      pct={promo.commissionPct}
      onOpen={() => navigate(paths.refer())}
      onHide={() => { hideRing(); setRingOff(true); }}
    />
  ) : null;
  if (!show || !promo) return ring;
  const close = () => { dismiss(); setShow(false); };
  const go = () => { dismiss(); setShow(false); navigate(paths.refer()); };

  if (phone) {
    return createPortal(
      <div className="ref-promo-card fixed left-3 right-3 bottom-[84px] z-[60] rounded-[22px] overflow-hidden text-ivory shadow-[0_24px_50px_-18px_rgba(6,35,29,.85)]" role="complementary" aria-label="Refer and earn">
        <div className="relative bg-[linear-gradient(150deg,#145A43_0%,#0C2D26_55%,#081F19_100%)] p-4 pr-11">
          <div className="absolute inset-0 bg-[radial-gradient(70%_100%_at_100%_0%,rgba(229,200,142,.24),transparent_70%)]" aria-hidden="true" />
          <span className="promo-gloss" aria-hidden="true" />
          <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[.09] to-transparent pointer-events-none" aria-hidden="true" />
          <button onClick={close} className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center" aria-label="Dismiss"><X className="w-4 h-4" /></button>
          <div className="relative flex items-center gap-3">
            <MiniPrinter />
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

/** A tiny pass machine: a green pass pops out of the slot and tilts, on a loop. */
function MiniPrinter() {
  return (
    <span className="relative w-[54px] h-[58px] shrink-0" aria-hidden="true">
      <span className="mini-pass absolute left-[11px] bottom-[22px] w-[32px] h-[38px] rounded-[6px] bg-[linear-gradient(165deg,#2BB673,#13684C)] border border-[#E5C88E]/60 flex flex-col items-center justify-center gap-[3px] shadow-[0_6px_12px_-4px_rgba(0,0,0,.6)]">
        <span className="w-[12px] h-[12px] rounded-[3px] bg-[#E5C88E]" />
        <span className="w-[18px] h-[2.5px] rounded bg-white/70" />
        <span className="text-[6.5px] font-black text-[#FFF1C9] leading-none">10% OFF</span>
      </span>
      <span className="absolute left-0 right-0 bottom-0 h-[28px] rounded-[10px] bg-[linear-gradient(180deg,#FFFDF7,#E6DEC9)] shadow-[0_8px_14px_-6px_rgba(0,0,0,.7),inset_0_-3px_0_rgba(0,0,0,.08)]">
        <span className="absolute left-[6px] right-[6px] top-[5px] h-[4px] rounded-full bg-[#0C2D26]" />
        <span className="mini-led absolute left-[7px] bottom-[6px] w-[5px] h-[5px] rounded-full bg-[#2BB673]" />
        <span className="absolute right-[7px] bottom-[5px] w-[12px] h-[12px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFF1C9,#C9A15A)]" />
      </span>
    </span>
  );
}

/** Phones: a scalloped ring on the right edge with rotating "Refer & Earn" text. */
export function ReferRing({ pct = 10, onOpen, onHide }) {
  // the ring alternates two messages
  const [alt, setAlt] = useState(false);
  useEffect(() => { const t = setInterval(() => setAlt(a => !a), 3200); return () => clearInterval(t); }, []);
  const label = alt ? `EARN ${pct}% \u00B7 EARN ${pct}% \u00B7 ` : 'REFER & EARN \u00B7 REFER & EARN \u00B7 ';
  const scallop = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return <circle key={i} cx={50 + Math.cos(a) * 43} cy={50 + Math.sin(a) * 43} r="7.6" />;
  });
  return createPortal(
    <div className="ref-ring md:hidden fixed right-2 bottom-[150px] z-[55] w-[88px] h-[88px]">
      <button onClick={onOpen} className="absolute inset-0 rounded-full" aria-label={`Refer and earn ${pct}%`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_14px_rgba(6,35,29,.55)]">
          <defs>
            <linearGradient id="rr-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1E8A63" /><stop offset="1" stopColor="#0A3528" /></linearGradient>
            <linearGradient id="rr-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C9" /><stop offset=".5" stopColor="#E5C88E" /><stop offset="1" stopColor="#B88A3E" /></linearGradient>
            <path id="rr-path" d="M50,50 m-33,0 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0" />
            <clipPath id="rr-clip"><circle cx="50" cy="50" r="44" /></clipPath>
          </defs>
          <g fill="url(#rr-fill)">{scallop}<circle cx="50" cy="50" r="44" /></g>
          <circle cx="50" cy="50" r="40.5" fill="none" stroke="#E5C88E" strokeOpacity=".55" strokeWidth=".8" strokeDasharray="1.5 2.2" />
          <g className="rr-spin">
            <text fontSize="9.2" fontWeight="800" letterSpacing="1.2" fill="url(#rr-gold)" fontFamily="system-ui, sans-serif">
              <textPath href="#rr-path" key={label} className="rr-text">{label}</textPath>
            </text>
          </g>
          {/* the pass in the middle */}
          <g className="rr-pass">
            <rect x="37" y="32" width="26" height="34" rx="4" fill="#FFFDF7" transform="rotate(-10 50 49)" />
            <rect x="41" y="37" width="18" height="11" rx="2" fill="#1E8A63" transform="rotate(-10 50 49)" />
            <rect x="41" y="51" width="13" height="2.4" rx="1.2" fill="#0C2D26" opacity=".35" transform="rotate(-10 50 49)" />
            <circle cx="55" cy="59" r="3.6" fill="url(#rr-gold)" transform="rotate(-10 50 49)" />
          </g>
          {/* glossy shine */}
          <g clipPath="url(#rr-clip)"><rect className="rr-shine" x="-40" y="-10" width="22" height="120" fill="#fff" opacity=".22" transform="rotate(25 50 50)" /></g>
        </svg>
      </button>
      <button onClick={onHide} className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-white text-charcoal/60 shadow flex items-center justify-center" aria-label="Hide Refer and earn">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>,
    document.body
  );
}

/**
 * Shown under "Congratulations, you passed!": a small card that slides in once the celebration has
 * played, inviting the learner to bring friends (they save, you earn). Hidden when the program is off.
 */
export function PassReferNudge({ delay = 2600 }) {
  const [promo, setPromo] = useState(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    let live = true;
    loadPromo().then(p => { if (live) setPromo(p); });
    const t = setTimeout(() => setShow(true), delay);
    return () => { live = false; clearTimeout(t); };
  }, [delay]);
  if (!show || !promo?.enabled) return null;
  return (
    <a href={paths.refer()} className="pass-nudge group mt-6 mx-auto max-w-md flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#145A43,#0A2F24)] text-ivory px-4 py-3 text-left shadow-[0_18px_36px_-20px_rgba(6,35,29,.85)] ring-1 ring-[#E5C88E]/30">
      <span className="ref-gift w-11 h-11 shrink-0 rounded-xl bg-gradient-to-b from-[#F3D9A0] to-[#C9A15A] text-[#2A1D08] flex items-center justify-center"><Gift className="w-5 h-5" /></span>
      <span className="flex-1 min-w-0">
        <span className="block font-display text-[15px] font-bold leading-tight">Celebrate with your friends</span>
        <span className="block text-[12.5px] text-ivory/70 leading-snug">They get {promo.discountPct}% off. You earn {promo.commissionPct}% of what they pay.</span>
      </span>
      <span className="shrink-0 inline-flex items-center gap-1 text-[13px] font-bold text-[#E5C88E]">Refer <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></span>
    </a>
  );
}
