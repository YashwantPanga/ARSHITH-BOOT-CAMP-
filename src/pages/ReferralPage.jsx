import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy, Check, Share2, QrCode, Gift, Wallet, Clock, ArrowRight, Users, MousePointerClick, UserPlus, ShoppingBag,
  BadgeIndianRupee, Landmark, Smartphone, Bell, Trophy, ShieldCheck, Loader2, ChevronRight, Sparkle, Info
} from 'lucide-react';
import { api } from '../services/api';
import { paths } from '../router';
import ReferralTicket from '../components/ReferralTicket';
import ReferralShareCard from '../components/ReferralShareCard';
import { shareCard } from '../utils/shareCard';
import { rupees, visitorId, rememberReferral, forgetReferral } from '../utils/referral';

/**
 * Refer & Earn. Visitors see how the program works; signed-in learners get their referral code,
 * link, QR, stats, wallet (from the server's ledger), history, withdrawals and notifications.
 */

const STATUS = {
  pending: ['Pending', 'bg-[#FBF0D9] text-[#8A6420]'],
  available: ['Released', 'bg-brand-50 text-forest'],
  cancelled: ['Cancelled', 'bg-slate-100 text-slate-500'],
  reversed: ['Reversed', 'bg-rose-50 text-rose-600'],
  registered: ['Signed up', 'bg-sky-50 text-sky-700'],
  pending_approval: ['Pending approval', 'bg-[#FBF0D9] text-[#8A6420]'],
  approved: ['Approved · processing', 'bg-sky-50 text-sky-700'],
  paid: ['Paid', 'bg-brand-50 text-forest'],
  rejected: ['Rejected', 'bg-rose-50 text-rose-600'],
  overdue: ['Overdue', 'bg-rose-50 text-rose-600'],
  payment_failed: ['Payment failed', 'bg-rose-50 text-rose-600'],
  released: ['Returned to wallet', 'bg-slate-100 text-slate-600']
};
const Pill = ({ s }) => { const [l, c] = STATUS[s] || [s, 'bg-slate-100 text-slate-600']; return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${c}`}>{l}</span>; };
const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/* ---------- the illustration: a gift box with coins and a network of friends ---------- */
export function RewardArt({ className = '' }) {
  return (
    <svg viewBox="0 0 320 260" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ra-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1E7A5A" /><stop offset="1" stopColor="#0C3B2E" /></linearGradient>
        <linearGradient id="ra-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2A9A72" /><stop offset="1" stopColor="#14644A" /></linearGradient>
        <linearGradient id="ra-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FBE3A6" /><stop offset=".5" stopColor="#E5C88E" /><stop offset="1" stopColor="#B88A3E" /></linearGradient>
        <radialGradient id="ra-glow" cx="50%" cy="60%" r="50%"><stop offset="0" stopColor="#E5C88E" stopOpacity=".55" /><stop offset="1" stopColor="#E5C88E" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="160" cy="150" rx="130" ry="100" fill="url(#ra-glow)" />
      {/* friends network */}
      {[[48, 70], [270, 62], [36, 196], [282, 190]].map(([x, y], i) => (
        <g key={i} className="ra-node" style={{ animationDelay: `${i * 0.4}s` }}>
          <line x1={x} y1={y} x2="160" y2="140" stroke="#8EE3B5" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="4 5" />
          <circle cx={x} cy={y} r="17" fill="#FFFDF7" stroke="#8EE3B5" strokeWidth="2" />
          <circle cx={x} cy={y - 4} r="5.5" fill="#1E7A5A" /><path d={`M${x - 9} ${y + 10} q9 -11 18 0`} fill="#1E7A5A" />
        </g>
      ))}
      {/* box */}
      <rect x="104" y="128" width="112" height="88" rx="10" fill="url(#ra-box)" />
      <rect x="150" y="128" width="20" height="88" fill="url(#ra-gold)" />
      <g className="ra-lid">
        <rect x="96" y="110" width="128" height="26" rx="8" fill="url(#ra-lid)" />
        <rect x="150" y="110" width="20" height="26" fill="url(#ra-gold)" />
        <path d="M160 110 C 140 84 112 92 124 108 Z M160 110 C 180 84 208 92 196 108 Z" fill="url(#ra-gold)" />
      </g>
      {/* coins */}
      {[[132, 70, 0], [186, 58, .5], [160, 40, 1]].map(([x, y, d], i) => (
        <g key={i} className="ra-coin" style={{ animationDelay: `${d}s` }}>
          <circle cx={x} cy={y} r="15" fill="url(#ra-gold)" stroke="#B88A3E" strokeWidth="1.5" />
          <text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#7A5A1E" fontFamily="system-ui">₹</text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- visitors: how it works ---------- */
function HowItWorks({ rules, navigate, signedIn }) {
  const r = rules || { discountPct: 10, commissionPct: 10, releaseDays: 7, minWithdrawalPaise: 10000, attributionDays: 30, payoutSlaDays: 7 };
  return (
    <div className="bg-ivory">
      <section className="relative overflow-hidden bg-[#0C2D26] text-ivory">
        <div className="absolute inset-0 bg-[radial-gradient(60%_70%_at_80%_30%,rgba(229,200,142,.18),transparent_70%),radial-gradient(50%_60%_at_10%_90%,rgba(142,227,181,.14),transparent_70%)]" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E5C88E]/40 bg-[#E5C88E]/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.18em] text-[#E5C88E]"><Gift className="w-3.5 h-3.5" /> Refer &amp; Earn</span>
            <h1 className="mt-5 font-display text-[40px] sm:text-[56px] font-bold leading-[1.02] tracking-[-0.02em]">Your Network.<br /><span className="text-[#E5C88E]">Your Rewards.</span></h1>
            <p className="mt-5 text-[16.5px] leading-relaxed text-ivory/75 max-w-lg">Invite friends to CodeLekho. Help them save {r.discountPct}% and earn {r.commissionPct}% commission on their eligible purchases.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => navigate(signedIn ? paths.refer() : paths.register(paths.refer()))} className="h-12 px-6 rounded-xl bg-gradient-to-b from-[#F3D9A0] to-[#C9A15A] text-[#2A1D08] font-display font-bold inline-flex items-center gap-2 shadow-[0_12px_30px_-12px_rgba(229,200,142,.8)]">Start Earning <ArrowRight className="w-4 h-4" /></button>
              <a href="#how" className="h-12 px-6 rounded-xl border border-white/20 text-ivory font-semibold inline-flex items-center">Explore How It Works</a>
            </div>
            <p className="mt-5 text-[13px] text-ivory/55">Minimum withdrawal {rupees(r.minWithdrawalPaise, 0)} · paid by UPI or bank transfer</p>
          </div>
          <RewardArt className="w-full max-w-[440px] mx-auto" />
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-5 sm:px-8 py-14 scroll-mt-24">
        <p className="text-[12.5px] font-bold uppercase tracking-[0.2em] text-sage">How it works</p>
        <h2 className="mt-2 font-display text-[30px] sm:text-[38px] font-semibold text-evergreen">Three steps. Real money.</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            [Share2, 'Share your link', 'Copy your link or QR, or send it on WhatsApp. Your friend has 30 days to sign up and buy.'],
            [BadgeIndianRupee, `They save ${r.discountPct}%`, `The discount is applied automatically at checkout on every eligible course and Interview Prep.`],
            [Wallet, `You earn ${r.commissionPct}%`, `Commission on what they actually pay. It is released after ${r.releaseDays} days and you can withdraw from ${rupees(r.minWithdrawalPaise, 0)}.`]
          ].map(([Icon, t, d], i) => (
            <div key={t} className="relative rounded-[20px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] p-6 shadow-[0_18px_40px_-32px_rgba(12,45,38,.6)]">
              <span className="absolute right-5 top-4 font-display text-[44px] font-bold text-brand-900/[.06]">0{i + 1}</span>
              <span className="w-11 h-11 rounded-2xl bg-forest text-[#E5C88E] flex items-center justify-center"><Icon className="w-5 h-5" /></span>
              <p className="mt-4 font-display text-[19px] font-semibold text-evergreen">{t}</p>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-charcoal/65">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid lg:grid-cols-[1.1fr_1fr] gap-4">
          <div className="rounded-[22px] bg-[#0C2D26] text-ivory p-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#8EE3B5]">Example</p>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[['Course price', '₹1,000'], [`${r.discountPct}% off`, '− ₹100'], ['Friend pays', '₹900'], [`You earn ${r.commissionPct}%`, '₹90']].map(([l, v], i) => (
                <div key={l} className={`rounded-xl p-3 ${i === 3 ? 'bg-gradient-to-b from-[#F3D9A0] to-[#C9A15A] text-[#2A1D08]' : 'bg-white/[.06] border border-white/10'}`}>
                  <p className="font-display text-[18px] sm:text-[22px] font-bold">{v}</p>
                  <p className={`mt-1 text-[11px] ${i === 3 ? 'text-[#2A1D08]/70' : 'text-ivory/60'}`}>{l}</p>
                </div>
              ))}
            </div>
          </div>
          <ul className="rounded-[20px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] p-6 grid gap-2.5 text-[14px] text-charcoal/75">
            {[
              `Commission is ${r.commissionPct}% of the amount your friend actually paid, after their discount.`,
              `It stays pending for ${r.releaseDays} days, then moves to your available balance.`,
              `Withdraw from ${rupees(r.minWithdrawalPaise, 0)} by UPI or bank transfer; paid within ${r.payoutSlaDays} days of approval.`,
              'Refunded purchases reverse the commission. You cannot refer yourself.',
              'Earnings may be taxable income under Indian law; please declare them.'
            ].map(t => <li key={t} className="flex gap-2.5"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-sage" />{t}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ---------- signed-in dashboard ---------- */
function CopyButton({ text, label, className = '' }) {
  const [done, setDone] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* blocked */ } };
  return <button onClick={copy} className={`inline-flex items-center gap-1.5 ${className}`}>{done ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{done ? 'Copied' : label}</button>;
}

function Withdraw({ data, onDone, toast }) {
  const [method, setMethod] = useState(data.savedPayout?.last || 'upi');
  const [amount, setAmount] = useState('');
  const [f, setF] = useState({ upiId: data.savedPayout?.upi?.upiId || '', holder: data.savedPayout?.bank?.holder || '', bank: data.savedPayout?.bank?.bank || '', account: '', ifsc: data.savedPayout?.bank?.ifsc || '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const min = data.rules.minWithdrawalPaise;
  const available = data.wallet.available;
  const can = available >= min && !data.suspended;
  const set = (k) => (e) => { setF(x => ({ ...x, [k]: k === 'ifsc' ? e.target.value.toUpperCase() : e.target.value })); setErr(''); };
  const submit = async (e) => {
    e.preventDefault();
    const paise = Math.round(Number(amount) * 100);
    if (!paise || paise < min) return setErr(`The minimum withdrawal is ${rupees(min, 0)}.`);
    if (paise > available) return setErr(`You can withdraw up to ${rupees(available)}.`);
    setBusy(true);
    try {
      const payout = method === 'upi' ? { upiId: f.upiId } : { holder: f.holder, bank: f.bank, account: f.account, ifsc: f.ifsc };
      const res = await api.requestWithdrawal({ amountPaise: paise, method, payout });
      setAmount('');
      toast?.('Withdrawal requested. You will be notified when it is approved.', 'success', 4500);
      onDone(res);
    } catch (e2) { setErr(e2.message || 'Could not request the withdrawal.'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="rounded-[20px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[19px] font-semibold text-evergreen flex items-center gap-2"><Wallet className="w-5 h-5 text-sage" /> Withdraw</p>
        <span className="text-[12.5px] text-charcoal/55">Available <b className="text-evergreen">{rupees(available)}</b></span>
      </div>
      {!can && <p className="mt-3 rounded-xl bg-cream px-3 py-2.5 text-[13px] text-charcoal/65"><Info className="inline w-4 h-4 mr-1 -mt-0.5 text-sage" />{data.suspended ? 'Your referral account is suspended. Please contact support.' : `You can withdraw once your available balance reaches ${rupees(min, 0)}.`}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-xl bg-cream">
        {[['upi', 'UPI', Smartphone], ['bank', 'Bank transfer', Landmark]].map(([k, l, Icon]) => (
          <button type="button" key={k} onClick={() => setMethod(k)} className={`h-10 rounded-lg text-[14px] font-semibold inline-flex items-center justify-center gap-2 transition ${method === k ? 'bg-white text-evergreen shadow-sm' : 'text-charcoal/55'}`}><Icon className="w-4 h-4" />{l}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        <label className="block"><span className="text-[12.5px] font-semibold text-charcoal/70">Amount (₹)</span>
          <input type="number" inputMode="decimal" min={min / 100} step="0.01" value={amount} onChange={(e) => { setAmount(e.target.value); setErr(''); }} className="auth-input mt-1" placeholder={`${min / 100} or more`} disabled={!can} /></label>
        {method === 'upi' ? (
          <label className="block"><span className="text-[12.5px] font-semibold text-charcoal/70">UPI ID</span><input value={f.upiId} onChange={set('upiId')} className="auth-input mt-1" placeholder="name@okbank" autoComplete="off" disabled={!can} /></label>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="text-[12.5px] font-semibold text-charcoal/70">Account holder</span><input value={f.holder} onChange={set('holder')} className="auth-input mt-1" disabled={!can} /></label>
            <label className="block"><span className="text-[12.5px] font-semibold text-charcoal/70">Bank name</span><input value={f.bank} onChange={set('bank')} className="auth-input mt-1" disabled={!can} /></label>
            <label className="block"><span className="text-[12.5px] font-semibold text-charcoal/70">Account number</span><input value={f.account} onChange={set('account')} inputMode="numeric" className="auth-input mt-1" autoComplete="off" disabled={!can} /></label>
            <label className="block"><span className="text-[12.5px] font-semibold text-charcoal/70">IFSC</span><input value={f.ifsc} onChange={set('ifsc')} className="auth-input mt-1 uppercase" maxLength={11} disabled={!can} /></label>
          </div>
        )}
      </div>
      {err && <p className="mt-3 text-[13px] text-rose-600" role="alert">{err}</p>}
      <button disabled={!can || busy} className="mt-4 w-full h-12 rounded-xl bg-forest text-ivory font-display font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeIndianRupee className="w-4 h-4" />} Request withdrawal</button>
      <p className="mt-2.5 text-[12px] text-charcoal/50 text-center">Reviewed by our team; paid within {data.rules.payoutSlaDays} days of approval.</p>
    </form>
  );
}

function Dashboard({ data, setData, toast, navigate, firstName }) {
  const [qr, setQr] = useState('');
  const [tab, setTab] = useState('history');
  useEffect(() => { QRCode.toDataURL(data.link, { margin: 1, width: 360, color: { dark: '#0C2D26', light: '#FFFFFF' } }).then(setQr).catch(() => {}); }, [data.link]);
  const unread = data.notifications.filter(n => !n.read).length;
  const w = data.wallet;
  const total = Math.max(1, w.pending + w.available + w.reserved + w.withdrawn);
  // shares the invite as a card image (with the link as the caption)
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (sharing) return;
    const text = `Learn coding with me on CodeLekho - you get ${data.rules.discountPct}% off with my code ${data.code}: ${data.link}`;
    setSharing(true);
    try {
      const r = await shareCard({ svg: cardRef.current, width: 1080, height: 1350, fileName: `CodeLekho-invite-${data.code}.png`, text });
      if (r === 'fallback') toast?.('Your invite card was saved - attach it in the WhatsApp chat that opened.', 'success', 5000);
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } finally { setSharing(false); }
  };
  const openNotes = async () => { setTab('notifications'); if (unread) { try { await api.markReferralNotificationsRead(); setData(d => ({ ...d, notifications: d.notifications.map(n => ({ ...n, read: true })) })); } catch { /* ignore */ } } };
  const toggleOptOut = async () => { try { const r = await api.setPromoOptOut(!data.promoOptOut); setData(d => ({ ...d, promoOptOut: r.promoOptOut })); } catch { /* ignore */ } };

  return (
    <div className="bg-ivory min-h-screen">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-7 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12.5px] font-bold uppercase tracking-[0.2em] text-sage">Refer &amp; Earn</p>
            <h1 className="mt-1 font-display text-[30px] sm:text-[38px] font-bold text-evergreen leading-tight">Your Network. <span className="text-[#B88A3E]">Your Rewards.</span></h1>
          </div>
          <button onClick={openNotes} className="relative h-10 px-3.5 rounded-xl bg-white border border-brand-900/10 inline-flex items-center gap-2 text-[13.5px] font-semibold text-evergreen"><Bell className="w-4 h-4" /> Notifications{unread > 0 && <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-[#C9A15A] text-white text-[11px] flex items-center justify-center">{unread}</span>}</button>
        </div>
        {data.suspended && <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-[14px] text-rose-700">Your referral account is suspended, so your link does not give discounts right now. Please contact support.</p>}
        {!data.rules.enabled && <p className="mt-4 rounded-xl bg-cream border border-brand-900/10 px-4 py-3 text-[14px] text-charcoal/70">Refer &amp; Earn is paused right now. Your earnings are safe.</p>}

        {/* phones: the printed pass */}
        {/* the image that goes out with every share */}
        <div className="hidden" aria-hidden="true"><ReferralShareCard ref={cardRef} code={data.code} link={data.link} firstName={firstName} discountPct={data.rules.discountPct} /></div>
        <ReferralTicket code={data.code} link={data.link} firstName={firstName} discountPct={data.rules.discountPct} commissionPct={data.rules.commissionPct} qr={qr} onShare={share} art={<RewardArt className="w-full" />} />

        {/* tablets and desktop: ticket with code, link, share, QR */}
        <section className="ref-ticket mt-6 hidden md:grid lg:grid-cols-[1fr_auto] rounded-[26px] overflow-hidden text-ivory shadow-[0_30px_60px_-34px_rgba(12,45,38,.9)]">
          <div className="relative p-6 sm:p-8 bg-[#0C2D26]">
            <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_100%_0%,rgba(229,200,142,.16),transparent_70%)]" aria-hidden="true" />
            <div className="absolute inset-0 opacity-[.07] bg-[repeating-radial-gradient(circle_at_85%_120%,transparent_0,transparent_9px,#E5C88E_10px,transparent_11px)]" aria-hidden="true" />
            <div className="relative">
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#8EE3B5]">Your referral code</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="ref-foil font-mono text-[34px] sm:text-[44px] font-bold tracking-[0.12em]">{data.code}</span>
                <CopyButton text={data.code} label="Copy code" className="h-9 px-3 rounded-lg bg-white/10 border border-white/15 text-[13px] font-semibold" />
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-black/20 border border-white/10 pl-3 pr-1.5 py-1.5 max-w-xl">
                <span className="flex-1 min-w-0 truncate font-mono text-[13.5px] text-ivory/85">{data.link}</span>
                <CopyButton text={data.link} label="Copy link" className="shrink-0 h-9 px-3 rounded-lg bg-[#E5C88E] text-[#2A1D08] text-[13px] font-bold" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <button onClick={share} disabled={sharing} className="h-10 px-4 rounded-xl bg-[#25D366] text-[#073B1E] text-[14px] font-bold inline-flex items-center gap-2 disabled:opacity-70">{sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : null} WhatsApp</button>
                <button onClick={share} className="h-10 px-4 rounded-xl border border-white/20 text-[14px] font-semibold inline-flex items-center gap-2"><Share2 className="w-4 h-4" /> Share</button>
              </div>
              <p className="mt-4 text-[12.5px] text-ivory/55">Friends get {data.rules.discountPct}% off for {data.rules.attributionDays} days · you earn {data.rules.commissionPct}% of what they pay</p>
            </div>
          </div>
          <div className="relative flex items-center justify-center p-6 bg-[#123E31] lg:border-l-2 lg:border-dashed lg:border-white/20">
            <span className="hidden lg:block absolute -left-[13px] -top-[13px] w-6 h-6 rounded-full bg-ivory" aria-hidden="true" />
            <span className="hidden lg:block absolute -left-[13px] -bottom-[13px] w-6 h-6 rounded-full bg-ivory" aria-hidden="true" />
            <div className="text-center">
              {qr ? <img src={qr} alt={`QR code for ${data.link}`} className="w-36 h-36 rounded-xl bg-white p-1.5 mx-auto" /> : <span className="w-36 h-36 rounded-xl bg-white/10 flex items-center justify-center mx-auto"><QrCode className="w-8 h-8" /></span>}
              {qr && <a href={qr} download={`codelekho-${data.code}.png`} className="mt-3 inline-block text-[12.5px] font-semibold text-[#E5C88E] hover:underline">Download QR</a>}
            </div>
          </div>
        </section>

        {/* earnings */}
        <section className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ['Lifetime earnings', rupees(w.lifetime), Trophy, true],
            ['Pending', rupees(w.pending), Clock],
            ['Available', rupees(w.available), Wallet],
            ['Withdrawn', rupees(w.withdrawn), BadgeIndianRupee],
            ['Active referrals', data.stats.activeReferrals, Users]
          ].map(([l, v, Icon, gold]) => (
            <div key={l} className={`rounded-[20px] p-4 sm:p-5 ${gold ? 'bg-gradient-to-br from-[#F7E3B5] to-[#E0BE7C] text-[#2A1D08] col-span-2 lg:col-span-1' : 'bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)]'}`}>
              <Icon className={`w-5 h-5 ${gold ? 'text-[#7A5A1E]' : 'text-sage'}`} />
              <p className={`mt-3 font-display text-[24px] sm:text-[26px] font-bold leading-none ${gold ? '' : 'text-evergreen'}`}>{v}</p>
              <p className={`mt-1.5 text-[12.5px] ${gold ? 'text-[#2A1D08]/70' : 'text-charcoal/55'}`}>{l}</p>
            </div>
          ))}
        </section>

        {/* wallet bar + funnel */}
        <section className="mt-4 grid lg:grid-cols-2 gap-4">
          <div className="rounded-[20px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] p-5">
            <p className="font-display text-[16px] font-semibold text-evergreen">Wallet</p>
            <div className="mt-3 flex h-3 rounded-full overflow-hidden bg-cream">
              {[['#E5C88E', w.pending], ['#1E7A5A', w.available], ['#6FA8C9', w.reserved], ['#0C2D26', w.withdrawn]].map(([c, v], i) => v > 0 && <span key={i} style={{ width: `${(v / total) * 100}%`, background: c }} />)}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12.5px]">
              {[['Pending', w.pending, '#E5C88E'], ['Available', w.available, '#1E7A5A'], ['Reserved', w.reserved, '#6FA8C9'], ['Withdrawn', w.withdrawn, '#0C2D26']].map(([l, v, c]) => (
                <span key={l} className="flex items-center gap-1.5 text-charcoal/65"><i className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l} <b className="text-evergreen">{rupees(v)}</b></span>
              ))}
            </div>
          </div>
          <div className="rounded-[20px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] p-5">
            <p className="font-display text-[16px] font-semibold text-evergreen">Your funnel</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[['Clicks', data.stats.clicks, MousePointerClick], ['Sign-ups', data.stats.registrations, UserPlus], ['Purchases', data.stats.purchases, ShoppingBag], ['Conversion', `${data.stats.conversion}%`, ChevronRight]].map(([l, v, Icon]) => (
                <div key={l} className="rounded-xl bg-cream p-3 text-center"><Icon className="w-4 h-4 mx-auto text-sage" /><p className="mt-1.5 font-display text-[20px] font-bold text-evergreen">{v}</p><p className="text-[11.5px] text-charcoal/55">{l}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-4 grid lg:grid-cols-[1.45fr_1fr] gap-4 items-start">
          {/* history tabs */}
          <div className="rounded-[20px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] overflow-hidden">
            <div className="flex gap-1 p-1.5 m-3 rounded-xl bg-cream overflow-x-auto no-scrollbar">
              {[['history', 'Referrals'], ['rewards', 'Commissions'], ['wallet', 'Transactions'], ['withdrawals', 'Withdrawals'], ['notifications', `Notifications${unread ? ` (${unread})` : ''}`]].map(([k, l]) => (
                <button key={k} onClick={() => (k === 'notifications' ? openNotes() : setTab(k))} className={`shrink-0 h-9 px-3.5 rounded-lg text-[13px] font-semibold transition ${tab === k ? 'bg-white text-evergreen shadow-sm' : 'text-charcoal/55'}`}>{l}</button>
              ))}
            </div>
            <div className="px-3 pb-3 max-h-[440px] overflow-y-auto thin-scroll">
              {tab === 'history' && (data.history.length ? data.history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-3 border-t border-brand-900/[.06] first:border-0">
                  <span className="w-9 h-9 rounded-full bg-brand-50 text-forest font-display font-bold flex items-center justify-center shrink-0">{h.name[0]}</span>
                  <span className="flex-1 min-w-0"><span className="block text-[14px] font-semibold text-evergreen">{h.name}</span><span className="block text-[12px] text-charcoal/50">Joined {day(h.date)}{h.purchases ? ` · ${h.purchases} purchase${h.purchases > 1 ? 's' : ''} · ${rupees(h.amountPaise)}` : ''}</span></span>
                  <span className="text-right"><Pill s={h.status} />{h.commissionPaise > 0 && <span className="block mt-1 text-[12.5px] font-semibold text-forest">+{rupees(h.commissionPaise)}</span>}</span>
                </div>
              )) : <Empty text="No referrals yet. Share your link to get started." />)}
              {tab === 'rewards' && (data.rewards.length ? data.rewards.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-2 py-3 border-t border-brand-900/[.06] first:border-0">
                  <span className="flex-1 min-w-0"><span className="block text-[14px] font-semibold text-evergreen truncate">{r.course}</span><span className="block text-[12px] text-charcoal/50">Paid {rupees(r.paidPaise)} · {day(r.createdAt)}{r.status === 'pending' ? ` · releases ${day(r.releaseAt)}` : ''}</span></span>
                  <span className="text-right"><span className="block font-display text-[15px] font-bold text-evergreen">{rupees(r.commissionPaise)}</span><Pill s={r.status} /></span>
                </div>
              )) : <Empty text="Commissions appear here when your referrals buy a course." />)}
              {tab === 'wallet' && (data.transactions.length ? data.transactions.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-2 py-2.5 border-t border-brand-900/[.06] first:border-0 text-[13px]">
                  <span className="flex-1 min-w-0"><span className="block font-semibold text-evergreen">{t.type.replace(/\./g, ' · ')}</span><span className="block text-[11.5px] text-charcoal/50">{day(t.at)} · {t.bucket}</span></span>
                  <span className={`font-mono font-semibold ${t.delta > 0 ? 'text-forest' : 'text-rose-600'}`}>{t.delta > 0 ? '+' : '−'}{rupees(Math.abs(t.delta))}</span>
                </div>
              )) : <Empty text="No wallet activity yet." />)}
              {tab === 'withdrawals' && (data.withdrawals.length ? data.withdrawals.map(x => (
                <div key={x.id} className="px-2 py-3 border-t border-brand-900/[.06] first:border-0">
                  <div className="flex items-center justify-between gap-2"><span className="font-display text-[16px] font-bold text-evergreen">{rupees(x.amountPaise)}</span><Pill s={x.status} /></div>
                  <p className="mt-1 text-[12px] text-charcoal/55">{x.method === 'upi' ? `UPI ${x.payout.upiId}` : `${x.payout.bank} ${x.payout.account}`} · requested {day(x.createdAt)}{x.deadlineAt && ['approved', 'overdue'].includes(x.status) ? ` · pay by ${day(x.deadlineAt)}` : ''}{x.utr ? ` · UTR ${x.utr}` : ''}{x.rejectedReason ? ` · ${x.rejectedReason}` : ''}</p>
                </div>
              )) : <Empty text="No withdrawals yet." />)}
              {tab === 'notifications' && (data.notifications.length ? data.notifications.map(n => (
                <div key={n.id} className="flex gap-3 px-2 py-3 border-t border-brand-900/[.06] first:border-0">
                  <span className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: n.read ? '#CBD5D0' : '#C9A15A' }} />
                  <span className="min-w-0"><span className="block text-[14px] font-semibold text-evergreen">{n.title}</span><span className="block text-[13px] text-charcoal/65">{n.body}</span><span className="block text-[11.5px] text-charcoal/45 mt-0.5">{day(n.at)}</span></span>
                </div>
              )) : <Empty text="No notifications yet." />)}
            </div>
          </div>

          <div className="grid gap-4">
            <Withdraw data={data} onDone={(res) => setData(d => ({ ...d, ...res }))} toast={toast} />
            <div className="rounded-[20px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] p-5">
              <p className="font-display text-[16px] font-semibold text-evergreen flex items-center gap-2"><Trophy className="w-4 h-4 text-[#B88A3E]" /> Top referrers</p>
              {data.leaderboard.length ? (
                <ol className="mt-3 grid gap-1.5">
                  {data.leaderboard.map(l => <li key={l.rank} className="flex items-center gap-3 text-[13.5px]"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${l.rank === 1 ? 'bg-[#E5C88E] text-[#2A1D08]' : 'bg-cream text-charcoal/60'}`}>{l.rank}</span><span className="flex-1 text-evergreen">{l.name}</span><b className="text-forest">{rupees(l.earnedPaise, 0)}</b></li>)}
                </ol>
              ) : <p className="mt-2 text-[13px] text-charcoal/55">Only released (verified) earnings count. Be the first.</p>}
            </div>
            <label className="flex items-center justify-between gap-3 rounded-[18px] bg-white border border-[#E8E1CF] shadow-[0_1px_2px_rgba(12,45,38,.04)] px-4 py-3 text-[13.5px] text-charcoal/70">
              Show Refer &amp; Earn pop-ups on the site
              <input type="checkbox" checked={!data.promoOptOut} onChange={toggleOptOut} className="w-4 h-4 accent-[#013A2B]" />
            </label>
          </div>
        </section>
        <p className="mt-6 text-center text-[12px] text-charcoal/45">Commission is {data.rules.commissionPct}% of the amount paid after discount · released after {data.rules.releaseDays} days · refunds reverse it · earnings may be taxable. <button onClick={() => navigate(paths.terms())} className="underline">Terms</button></p>
      </div>
    </div>
  );
}

const Empty = ({ text }) => <p className="py-10 text-center text-[13.5px] text-charcoal/50"><Sparkle className="w-4 h-4 inline mr-1 -mt-0.5 text-sage" />{text}</p>;

export default function ReferralPage({ studentUser, navigate, toast }) {
  const [data, setData] = useState(null);
  const [promo, setPromo] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setError('');
    api.getMyReferrals().then(d => setData({ ...d, link: `${window.location.origin}${paths.refLink(d.code)}` })).catch(e => setError(e.message || 'Could not load your referrals.'));
  }, []);
  useEffect(() => { if (studentUser) load(); else api.getReferralPromo().then(r => setPromo(r.promo)).catch(() => {}); }, [studentUser, load]);
  const rules = useMemo(() => promo && { discountPct: promo.discountPct, commissionPct: promo.commissionPct, releaseDays: promo.releaseDays, minWithdrawalPaise: promo.minWithdrawalPaise, attributionDays: promo.attributionDays, payoutSlaDays: promo.payoutSlaDays }, [promo]);

  if (!studentUser) return <HowItWorks rules={rules} navigate={navigate} signedIn={false} />;
  if (error) return <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-8 text-center"><p className="text-charcoal/70">{error}</p><button onClick={load} className="h-10 px-4 rounded-xl bg-forest text-ivory font-semibold">Try again</button></div>;
  if (!data) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-sage" /></div>;
  return <Dashboard data={data} setData={setData} toast={toast} navigate={navigate} firstName={(() => { const w = String(studentUser.name || '').trim().split(/\s+/).filter(Boolean); return w.find(x => x.replace(/\./g, '').length > 1) || w[0] || 'a friend'; })()} />;
}

/** /ref/CODE: remembers the code, counts the click, links a signed-in learner, and invites a visitor to join. */
export function RefLanding({ code, studentUser, navigate, toast }) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const r = await api.trackReferralClick(code, visitorId());
        if (!live) return;
        if (!r.valid) { setState({ invalid: true }); return; }
        rememberReferral(r.code, r.referrerName);
        let claim = null;
        if (studentUser) {
          try { const c = await api.claimReferral(r.code); claim = { ok: true, message: c.message }; forgetReferral(); } catch (e) { claim = { ok: false, message: e.message }; }
        }
        if (live) setState({ ...r, claim });
      } catch { if (live) setState({ error: true }); }
    })();
    return () => { live = false; };
  }, [code, studentUser]);

  if (state.loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-sage" /></div>;
  return (
    <div className="relative overflow-hidden bg-[#0C2D26] text-ivory min-h-[78vh] flex items-center">
      <div className="absolute inset-0 bg-[radial-gradient(55%_70%_at_75%_35%,rgba(229,200,142,.2),transparent_70%),radial-gradient(45%_60%_at_10%_90%,rgba(142,227,181,.14),transparent_70%)]" aria-hidden="true" />
      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-14 grid md:grid-cols-[1.1fr_1fr] gap-10 items-center w-full">
        <div>
          {state.invalid || state.error ? (
            <>
              <h1 className="font-display text-[34px] sm:text-[44px] font-bold leading-tight">{state.error ? 'Something went wrong' : 'This invite link is not active'}</h1>
              <p className="mt-4 text-ivory/70 text-[16px]">{state.error ? 'Please try the link again in a moment.' : 'The link may be mistyped or no longer valid. You can still explore all our courses.'}</p>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E5C88E]/40 bg-[#E5C88E]/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.18em] text-[#E5C88E]"><Gift className="w-3.5 h-3.5" /> You are invited</span>
              <h1 className="mt-5 font-display text-[38px] sm:text-[52px] font-bold leading-[1.03]">{state.referrerName} invited you to <span className="text-[#E5C88E]">CodeLekho</span></h1>
              <p className="mt-4 text-[16.5px] text-ivory/75 max-w-md">Get <b className="text-ivory">{state.discountPct}% off</b> eligible courses and Interview Prep. The discount is applied automatically at checkout.</p>
              {state.claim && <p className={`mt-4 rounded-xl px-4 py-3 text-[14px] ${state.claim.ok ? 'bg-[#8EE3B5]/15 text-[#BFF3D6]' : 'bg-white/10 text-ivory/80'}`}>{state.claim.message}</p>}
            </>
          )}
          <div className="mt-7 flex flex-wrap gap-3">
            {!studentUser && !state.invalid && !state.error && <button onClick={() => navigate(paths.register())} className="h-12 px-6 rounded-xl bg-gradient-to-b from-[#F3D9A0] to-[#C9A15A] text-[#2A1D08] font-display font-bold inline-flex items-center gap-2">Create free account <ArrowRight className="w-4 h-4" /></button>}
            <button onClick={() => navigate(paths.courses())} className="h-12 px-6 rounded-xl border border-white/20 font-semibold">Explore courses</button>
          </div>
          {!studentUser && !state.invalid && !state.error && <p className="mt-4 text-[13px] text-ivory/55">Already have an account? <button onClick={() => navigate(paths.login(paths.refLink(code)))} className="underline text-ivory/80">Sign in</button> to apply the invite.</p>}
        </div>
        <RewardArt className="w-full max-w-[420px] mx-auto" />
      </div>
    </div>
  );
}
