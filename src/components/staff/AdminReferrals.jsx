import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshCw, Download, Search, Users, MousePointerClick, UserPlus, ShoppingBag, Wallet, Clock, AlertTriangle, Ban, Undo2,
  CheckCircle2, XCircle, BadgeIndianRupee, Save, Play, Loader2, X
} from 'lucide-react';
import { api } from '../../services/adminApi';
import { getAdminToken } from '../../services/api';

/**
 * Staff view of Refer & Earn: overview, referrers (search, detail, suspend), commissions (filters,
 * reverse, refunds), withdrawals (approve, reject, paid with UTR, failed, retry, release),
 * program and promotion settings, and the audit log. Every action is checked again on the server.
 */
const rs = (p, dp = 2) => `₹${(Number(p || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const TONE = {
  pending: 'bg-amber-50 text-amber-700', available: 'bg-emerald-50 text-emerald-700', cancelled: 'bg-slate-100 text-slate-500', reversed: 'bg-rose-50 text-rose-600',
  pending_approval: 'bg-amber-50 text-amber-700', approved: 'bg-sky-50 text-sky-700', paid: 'bg-emerald-50 text-emerald-700', rejected: 'bg-rose-50 text-rose-600',
  overdue: 'bg-rose-100 text-rose-700', payment_failed: 'bg-rose-50 text-rose-600', released: 'bg-slate-100 text-slate-600'
};
const Pill = ({ s }) => <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${TONE[s] || 'bg-slate-100 text-slate-600'}`}>{String(s).replace(/_/g, ' ')}</span>;
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-3xl dark-bezel p-5 sm:p-6 ${className}`}>{children}</div>;
const input = 'h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
const btn = 'h-9 px-3 rounded-xl text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50';

async function downloadCsv(type) {
  const res = await fetch(`/api/admin/referrals/export?type=${type}`, { headers: { Authorization: `Bearer ${getAdminToken()}` } });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `referral-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A small prompt dialog (reason, UTR, refund amount). */
function Ask({ ask, onClose }) {
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!ask) return null;
  const submit = async (e) => {
    e.preventDefault();
    if (ask.required && !v.trim()) return setErr('This is required.');
    setBusy(true); setErr('');
    try { await ask.onSubmit(v.trim()); onClose(); } catch (e2) { setErr(e2.message || 'Failed.'); setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40" role="dialog" aria-modal="true" onClick={() => !busy && onClose()}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3"><p className="font-bold text-slate-800">{ask.title}</p><button type="button" onClick={onClose} className="text-slate-400"><X className="w-4 h-4" /></button></div>
        {ask.text && <p className="mt-1.5 text-[13px] text-slate-500">{ask.text}</p>}
        {ask.label && <input autoFocus className={`${input} w-full mt-3`} placeholder={ask.label} value={v} onChange={(e) => setV(e.target.value)} type={ask.type || 'text'} step="0.01" />}
        {err && <p className="mt-2 text-[12.5px] text-rose-600">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`${btn} bg-slate-100 text-slate-600`}>Cancel</button>
          <button disabled={busy} className={`${btn} ${ask.danger ? 'bg-rose-600' : 'bg-emerald-700'} text-white`}>{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{ask.cta || 'Confirm'}</button>
        </div>
      </form>
    </div>
  );
}

function Overview({ ov }) {
  const tiles = [
    ['Referrers', ov.referrers, Users], ['Link clicks', ov.clicks, MousePointerClick], ['Registrations', ov.registrations, UserPlus], ['Purchases', ov.purchases, ShoppingBag],
    ['Commission (live)', rs(ov.totalCommissionPaise), BadgeIndianRupee], ['Pending', rs(ov.pendingCommissionPaise), Clock], ['Available', rs(ov.availableCommissionPaise), Wallet], ['Paid out', rs(ov.withdrawnPaise), CheckCircle2]
  ];
  return (
    <div className="space-y-4">
      {(ov.pendingWithdrawals > 0 || ov.overdueWithdrawals > 0) && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-semibold flex items-center gap-2 ${ov.overdueWithdrawals ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>
          <AlertTriangle className="w-4 h-4" /> {ov.pendingWithdrawals} withdrawal{ov.pendingWithdrawals === 1 ? '' : 's'} waiting for approval{ov.overdueWithdrawals ? ` · ${ov.overdueWithdrawals} overdue (past the payment deadline)` : ''}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(([l, v, Icon]) => (
          <Card key={l} className="!p-4"><Icon className="w-5 h-5 text-emerald-700" /><p className="mt-2 text-2xl font-black text-slate-800">{v}</p><p className="text-[12px] text-slate-500 font-semibold">{l}</p></Card>
        ))}
      </div>
      <p className="text-[12.5px] text-slate-500">Conversion (purchases / registrations): <b>{ov.registrations ? Math.round((ov.purchases / ov.registrations) * 100) : 0}%</b>. Commissions move from pending to available automatically every 15 minutes.</p>
    </div>
  );
}

function Referrers({ setAsk, flash, reload }) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [detail, setDetail] = useState(null);
  const load = useCallback((query = '') => api.getAdminReferrers(query).then(r => setRows(r.referrers)).catch(e => flash(e.message, 'error')), [flash]);
  useEffect(() => { load(); }, [load]);
  const open = (email) => api.getAdminReferrer(email).then(setDetail).catch(e => flash(e.message, 'error'));
  const suspend = (r) => setAsk({
    title: r.suspended ? `Reactivate ${r.code}?` : `Suspend ${r.code}?`, text: r.suspended ? 'Their link will give discounts again.' : 'Their link stops giving discounts and they cannot withdraw.',
    label: r.suspended ? '' : 'Reason (shown in the audit log)', required: !r.suspended, danger: !r.suspended, cta: r.suspended ? 'Reactivate' : 'Suspend',
    onSubmit: async (reason) => { await api.suspendReferrer(r.email, !r.suspended, reason); flash(r.suspended ? 'Referrer reactivated' : 'Referrer suspended'); load(q); reload(); if (detail?.email === r.email) open(r.email); }
  });
  return (
    <Card>
      <form onSubmit={(e) => { e.preventDefault(); load(q); }} className="flex gap-2">
        <div className="relative flex-1"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or code" className={`${input} w-full pl-9`} /></div>
        <button className={`${btn} bg-emerald-700 text-white`}>Search</button>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">{['Referrer', 'Code', 'Clicks', 'Sign-ups', 'Purchases', 'Lifetime', 'Available', 'Status', ''].map(h => <th key={h} className="py-2 pr-3 font-bold">{h}</th>)}</tr></thead>
          <tbody>
            {rows === null ? <tr><td colSpan={9} className="py-8 text-center text-slate-400">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={9} className="py-8 text-center text-slate-400">No referrers yet.</td></tr> : rows.map(r => (
              <tr key={r.email} className="border-t border-slate-100">
                <td className="py-2.5 pr-3"><button onClick={() => open(r.email)} className="text-left"><span className="block font-semibold text-slate-800 hover:text-emerald-700">{r.name || '—'}</span><span className="block text-[12px] text-slate-500">{r.email}</span></button></td>
                <td className="pr-3 font-mono font-bold">{r.code}</td><td className="pr-3">{r.clicks}</td><td className="pr-3">{r.registrations}</td><td className="pr-3">{r.purchases}</td>
                <td className="pr-3 font-semibold">{rs(r.wallet.lifetime)}</td><td className="pr-3">{rs(r.wallet.available)}</td>
                <td className="pr-3">{r.suspended ? <Pill s="suspended" /> : <Pill s="active" />}</td>
                <td className="text-right"><button onClick={() => suspend(r)} className={`${btn} ${r.suspended ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}><Ban className="w-3.5 h-3.5" />{r.suspended ? 'Reactivate' : 'Suspend'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail && (
        <div className="mt-5 rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-bold text-slate-800">{detail.name} <span className="font-mono text-emerald-700">{detail.code}</span></p><p className="text-[12.5px] text-slate-500">{detail.email} · {detail.link}</p></div>
            <button onClick={() => setDetail(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[12.5px]">
            {[['Pending', detail.wallet.pending], ['Available', detail.wallet.available], ['Reserved', detail.wallet.reserved], ['Withdrawn', detail.wallet.withdrawn], ['Lifetime', detail.wallet.lifetime]].map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 p-2.5"><b className="block text-slate-800">{rs(v)}</b>{l}</div>)}
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Referred learners</p>
          <ul className="mt-1 text-[13px] divide-y divide-slate-100">
            {detail.history.length ? detail.history.map((h, i) => <li key={i} className="py-1.5 flex justify-between gap-3"><span>{h.name} · joined {when(h.date)}</span><span>{h.purchases} purchase(s) · {rs(h.commissionPaise)}</span></li>) : <li className="py-2 text-slate-400">None yet</li>}
          </ul>
        </div>
      )}
    </Card>
  );
}

function Commissions({ setAsk, flash, reload }) {
  const [f, setF] = useState({ status: '', email: '', from: '', to: '' });
  const [rows, setRows] = useState(null);
  const load = useCallback((filters) => api.getAdminReferralRewards(filters).then(r => setRows(r.rewards)).catch(e => flash(e.message, 'error')), [flash]);
  useEffect(() => { load({}); }, [load]);
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const reverse = (r) => setAsk({ title: `Reverse ${rs(r.commissionPaise)} commission?`, text: 'Use this for fraud or a mistaken referral. It is taken back from the referrer’s wallet.', label: 'Reason', required: true, danger: true, cta: 'Reverse',
    onSubmit: async (reason) => { await api.reverseReferralReward(r.id, reason); flash('Commission reversed'); load(f); reload(); } });
  const refund = (r) => setAsk({ title: `Record a refund for order ${r.orderId}`, text: `Paid ${rs(r.paidPaise)}${r.refundedPaise ? `, already refunded ${rs(r.refundedPaise)}` : ''}. The commission is cut in proportion. Refund the money in Cashfree first.`, label: 'Refunded amount in ₹', type: 'number', required: true, danger: true, cta: 'Record refund',
    onSubmit: async (v) => { await api.refundReferralOrder(r.orderId, Math.round(Number(v) * 100)); flash('Refund recorded'); load(f); reload(); } });
  return (
    <Card>
      <form onSubmit={(e) => { e.preventDefault(); load(f); }} className="flex flex-wrap gap-2">
        <select value={f.status} onChange={set('status')} className={input}><option value="">All statuses</option>{['pending', 'available', 'cancelled', 'reversed'].map(s => <option key={s} value={s}>{s}</option>)}</select>
        <input value={f.email} onChange={set('email')} placeholder="Referrer or buyer email" className={`${input} flex-1 min-w-[180px]`} />
        <input type="date" value={f.from} onChange={set('from')} className={input} aria-label="From" /><input type="date" value={f.to} onChange={set('to')} className={input} aria-label="To" />
        <button className={`${btn} bg-emerald-700 text-white`}>Filter</button>
        <button type="button" onClick={() => downloadCsv('commissions').catch(e => flash(e.message, 'error'))} className={`${btn} bg-slate-100 text-slate-700`}><Download className="w-3.5 h-3.5" /> CSV</button>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">{['Date', 'Referrer → buyer', 'Item', 'Paid', 'Commission', 'Status', 'Releases', ''].map(h => <th key={h} className="py-2 pr-3 font-bold">{h}</th>)}</tr></thead>
          <tbody>
            {rows === null ? <tr><td colSpan={8} className="py-8 text-center text-slate-400">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={8} className="py-8 text-center text-slate-400">No commissions match.</td></tr> : rows.map(r => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="py-2.5 pr-3 whitespace-nowrap text-[12.5px]">{when(r.createdAt)}</td>
                <td className="pr-3 text-[12.5px]"><span className="block font-semibold text-slate-800">{r.referrerEmail} <span className="font-mono text-emerald-700">{r.code}</span></span><span className="text-slate-500">→ {r.refereeEmail}</span></td>
                <td className="pr-3 text-[12.5px]">{r.courseTitle}<span className="block text-slate-400 font-mono">{r.orderId}</span></td>
                <td className="pr-3 whitespace-nowrap">{rs(r.paidPaise)}{r.discountPaise ? <span className="block text-[11.5px] text-slate-400">−{rs(r.discountPaise)} off</span> : null}{r.refundedPaise ? <span className="block text-[11.5px] text-rose-500">refunded {rs(r.refundedPaise)}</span> : null}</td>
                <td className="pr-3 font-bold whitespace-nowrap">{rs(r.commissionPaise)}</td>
                <td className="pr-3"><Pill s={r.status} /></td>
                <td className="pr-3 text-[12.5px] whitespace-nowrap">{r.status === 'pending' ? when(r.releaseAt) : r.releasedAt ? when(r.releasedAt) : '—'}</td>
                <td className="text-right whitespace-nowrap space-x-1">
                  {['pending', 'available'].includes(r.status) && <button onClick={() => refund(r)} className={`${btn} bg-slate-100 text-slate-700`}><Undo2 className="w-3.5 h-3.5" />Refund</button>}
                  {['pending', 'available'].includes(r.status) && <button onClick={() => reverse(r)} className={`${btn} bg-rose-50 text-rose-600`}><XCircle className="w-3.5 h-3.5" />Reverse</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Withdrawals({ setAsk, flash, reload }) {
  const [f, setF] = useState({ status: '', method: '', email: '', from: '', to: '' });
  const [rows, setRows] = useState(null);
  const load = useCallback((filters) => api.getAdminWithdrawals(filters).then(r => setRows(r.withdrawals)).catch(e => flash(e.message, 'error')), [flash]);
  useEffect(() => { load({}); }, [load]);
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const act = (w, action, ask) => {
    const run = async (value) => { await api.actOnWithdrawal(w.id, action, action === 'paid' ? { utr: value } : { reason: value }); flash(`Withdrawal ${action === 'paid' ? 'marked paid' : action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'failed' ? 'marked failed' : action === 'retry' ? 'set to retry' : 'released'}`); load(f); reload(); };
    setAsk({ ...ask, onSubmit: run });
  };
  return (
    <Card>
      <form onSubmit={(e) => { e.preventDefault(); load(f); }} className="flex flex-wrap gap-2">
        <select value={f.status} onChange={set('status')} className={input}><option value="">All statuses</option>{['pending_approval', 'approved', 'overdue', 'paid', 'rejected', 'payment_failed', 'released'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
        <select value={f.method} onChange={set('method')} className={input}><option value="">UPI + bank</option><option value="upi">UPI</option><option value="bank">Bank</option></select>
        <input value={f.email} onChange={set('email')} placeholder="Email" className={`${input} flex-1 min-w-[160px]`} />
        <input type="date" value={f.from} onChange={set('from')} className={input} aria-label="From" /><input type="date" value={f.to} onChange={set('to')} className={input} aria-label="To" />
        <button className={`${btn} bg-emerald-700 text-white`}>Filter</button>
        <button type="button" onClick={() => downloadCsv('withdrawals').catch(e => flash(e.message, 'error'))} className={`${btn} bg-slate-100 text-slate-700`}><Download className="w-3.5 h-3.5" /> CSV</button>
      </form>
      <div className="mt-4 grid gap-3">
        {rows === null ? <p className="py-8 text-center text-slate-400 text-sm">Loading…</p> : rows.length === 0 ? <p className="py-8 text-center text-slate-400 text-sm">No withdrawal requests match.</p> : rows.map(w => {
          const late = w.deadlineAt && ['approved', 'overdue'].includes(w.status) && Date.parse(w.deadlineAt) < Date.now();
          return (
            <div key={w.id} className={`rounded-2xl border p-4 ${late ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-slate-800">{rs(w.amountPaise)} <Pill s={w.status} /></p>
                  <p className="text-[12.5px] text-slate-500">{w.name} · {w.email} · requested {when(w.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {w.status === 'pending_approval' && <>
                    <button onClick={() => act(w, 'approve', { title: `Approve ${rs(w.amountPaise)}?`, text: 'You then have 7 days to pay it and enter the UTR.', cta: 'Approve' })} className={`${btn} bg-emerald-700 text-white`}><CheckCircle2 className="w-3.5 h-3.5" />Approve</button>
                    <button onClick={() => act(w, 'reject', { title: 'Reject this withdrawal?', text: 'The amount goes back to the learner’s available balance.', label: 'Reason (sent to the learner)', required: true, danger: true, cta: 'Reject' })} className={`${btn} bg-rose-50 text-rose-600`}><XCircle className="w-3.5 h-3.5" />Reject</button>
                  </>}
                  {['approved', 'overdue'].includes(w.status) && <>
                    <button onClick={() => act(w, 'paid', { title: `Mark ${rs(w.amountPaise)} as paid`, text: 'Enter the bank / UPI transaction reference (UTR).', label: 'UTR / transaction ID', required: true, cta: 'Mark paid' })} className={`${btn} bg-emerald-700 text-white`}><BadgeIndianRupee className="w-3.5 h-3.5" />Mark paid</button>
                    <button onClick={() => act(w, 'failed', { title: 'Payment failed?', label: 'What went wrong', required: true, danger: true, cta: 'Mark failed' })} className={`${btn} bg-rose-50 text-rose-600`}>Failed</button>
                  </>}
                  {w.status === 'payment_failed' && <>
                    <button onClick={() => act(w, 'retry', { title: 'Retry this payment?', text: 'It goes back to approved with a new 7-day deadline.', cta: 'Retry' })} className={`${btn} bg-sky-50 text-sky-700`}>Retry</button>
                    <button onClick={() => act(w, 'release', { title: 'Return the money to the wallet?', text: 'The learner can then request a new withdrawal.', cta: 'Release' })} className={`${btn} bg-slate-100 text-slate-700`}>Release</button>
                  </>}
                </div>
              </div>
              <div className="mt-3 grid sm:grid-cols-3 gap-2 text-[12.5px]">
                <div className="rounded-xl bg-slate-50 p-2.5"><b className="block text-slate-700">{w.method === 'upi' ? 'UPI' : 'Bank transfer'}</b>{w.method === 'upi' ? w.payout.upiId : `${w.payout.holder} · ${w.payout.bank} · ${w.payout.account} · ${w.payout.ifsc}`}</div>
                <div className="rounded-xl bg-slate-50 p-2.5"><b className="block text-slate-700">Pay by</b><span className={late ? 'text-rose-600 font-bold' : ''}>{when(w.deadlineAt)}</span></div>
                <div className="rounded-xl bg-slate-50 p-2.5"><b className="block text-slate-700">{w.utr ? 'UTR' : 'Note'}</b>{w.utr || w.rejectedReason || w.failureReason || '—'}{w.paidAt ? ` · paid ${when(w.paidAt)}` : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

const LOCATIONS = [['home', 'Home'], ['courses', 'Courses'], ['course-details', 'Course page'], ['dashboard', 'Dashboard'], ['interview', 'Interview Prep'], ['about', 'About / Contact']];
function SettingsTab({ initial, flash, reload }) {
  const [s, setS] = useState(() => ({ ...initial, minWithdrawal: initial.minWithdrawalPaise / 100 }));
  const [busy, setBusy] = useState(false);
  const set = (k, num) => (e) => setS(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : num ? Number(e.target.value) : e.target.value }));
  const setP = (k, num) => (e) => setS(x => ({ ...x, promo: { ...x.promo, [k]: e.target.type === 'checkbox' ? e.target.checked : num ? Number(e.target.value) : e.target.value } }));
  const toggleLoc = (id) => setS(x => ({ ...x, promo: { ...x.promo, locations: x.promo.locations.includes(id) ? x.promo.locations.filter(l => l !== id) : [...x.promo.locations, id] } }));
  const save = async () => {
    setBusy(true);
    try {
      const { minWithdrawal, ...rest } = s;
      const r = await api.updateReferralSettings({ ...rest, minWithdrawalPaise: Math.round(Number(minWithdrawal) * 100) });
      setS({ ...r.settings, minWithdrawal: r.settings.minWithdrawalPaise / 100 });
      flash('Settings saved'); reload();
    } catch (e) { flash(e.message, 'error'); } finally { setBusy(false); }
  };
  // plain functions (not components) so inputs keep focus while typing
  const Num = ({ label, k, promo, min = 0, max = 100 }) => (
    <label key={k} className="block"><span className="text-[12px] font-bold text-slate-500">{label}</span>
      <input type="number" min={min} max={max} value={promo ? s.promo[k] : s[k]} onChange={promo ? setP(k, true) : set(k, true)} className={`${input} w-full mt-1`} /></label>
  );
  const Check = ({ label, k, promo }) => (
    <label key={k} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!(promo ? s.promo[k] : s[k])} onChange={promo ? setP(k) : set(k)} className="w-4 h-4 accent-emerald-700" />{label}</label>
  );
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <p className="font-bold text-slate-800">Program</p>
        <div className="mt-3 grid gap-3">{Check({ label: "Refer & Earn is on", k: "enabled" })}{Check({ label: "Interview Prep earns commission", k: "interviewEligible" })}</div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {Num({ label: "Friend discount %", k: "discountPct", max: 90 })}{Num({ label: "Commission %", k: "commissionPct", max: 90 })}
          {Num({ label: "Release after (days)", k: "releaseDays", max: 90 })}{Num({ label: "Attribution window (days)", k: "attributionDays", min: 1, max: 365 })}
          <label className="block"><span className="text-[12px] font-bold text-slate-500">Minimum withdrawal (₹)</span><input type="number" min={1} value={s.minWithdrawal} onChange={(e) => setS(x => ({ ...x, minWithdrawal: e.target.value }))} className={`${input} w-full mt-1`} /></label>
          {Num({ label: "Pay within (days of approval)", k: "payoutSlaDays", min: 1, max: 60 })}
        </div>
        <p className="mt-3 text-[12px] text-slate-500">Changes apply to new purchases. Commissions already earned keep the rate they were earned at.</p>
      </Card>
      <Card>
        <p className="font-bold text-slate-800">Promotion pop-up</p>
        <div className="mt-3 grid grid-cols-2 gap-3">{Check({ label: "Promotion on", k: "enabled", promo: true })}{Check({ label: "Desktop pop-up", k: "desktopModal", promo: true })}{Check({ label: "Mobile card", k: "mobileCard", promo: true })}{Check({ label: "Show to visitors", k: "guests", promo: true })}{Check({ label: "Show to signed-in learners", k: "loggedIn", promo: true })}</div>
        <div className="mt-4 grid gap-3">
          <label className="block"><span className="text-[12px] font-bold text-slate-500">Headline</span><input value={s.promo.headline} onChange={setP('headline')} maxLength={80} className={`${input} w-full mt-1`} /></label>
          <label className="block"><span className="text-[12px] font-bold text-slate-500">Description</span><textarea value={s.promo.description} onChange={setP('description')} maxLength={240} rows={2} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-sm" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-[12px] font-bold text-slate-500">Button text</span><input value={s.promo.cta} onChange={setP('cta')} maxLength={30} className={`${input} w-full mt-1`} /></label>
            <label className="block"><span className="text-[12px] font-bold text-slate-500">Mobile headline</span><input value={s.promo.mobileHeadline} onChange={setP('mobileHeadline')} maxLength={60} className={`${input} w-full mt-1`} /></label>
          </div>
          <label className="block"><span className="text-[12px] font-bold text-slate-500">Mobile description</span><input value={s.promo.mobileDescription} onChange={setP('mobileDescription')} maxLength={120} className={`${input} w-full mt-1`} /></label>
          <div className="grid grid-cols-2 gap-3">{Num({ label: "Show after (seconds)", k: "delaySeconds", promo: true, max: 120 })}{Num({ label: "Hide after dismiss (days)", k: "dismissDays", promo: true, min: 1, max: 90 })}</div>
          <div><span className="text-[12px] font-bold text-slate-500">Show on</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">{LOCATIONS.map(([id, l]) => <button type="button" key={id} onClick={() => toggleLoc(id)} className={`h-8 px-3 rounded-full text-[12.5px] font-semibold border ${s.promo.locations.includes(id) ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200'}`}>{l}</button>)}</div>
            <p className="mt-1.5 text-[11.5px] text-slate-400">Never shown on sign-in, sign-up, checkout, lessons or staff pages.</p>
          </div>
        </div>
      </Card>
      <div className="lg:col-span-2 flex justify-end"><button onClick={save} disabled={busy} className={`${btn} h-11 px-5 bg-emerald-700 text-white`}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings</button></div>
    </div>
  );
}

function Audit({ flash }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.getReferralAudit().then(r => setRows(r.audit)).catch(e => flash(e.message, 'error')); }, [flash]);
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">{['When', 'Who', 'Action', 'Target', 'Details'].map(h => <th key={h} className="py-2 pr-3 font-bold">{h}</th>)}</tr></thead>
          <tbody>{rows === null ? <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="py-8 text-center text-slate-400">Nothing logged yet.</td></tr> : rows.map(a => (
            <tr key={a.id} className="border-t border-slate-100 text-[12.5px]"><td className="py-2 pr-3 whitespace-nowrap">{when(a.at)}</td><td className="pr-3">{a.actor}</td><td className="pr-3 font-mono">{a.action}</td><td className="pr-3 font-mono">{a.target}</td><td className="pr-3 text-slate-500">{a.details}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </Card>
  );
}

const TABS = [['overview', 'Overview'], ['referrers', 'Referrers'], ['commissions', 'Commissions'], ['withdrawals', 'Withdrawals'], ['settings', 'Settings & promo'], ['audit', 'Audit log']];

export default function AdminReferrals({ notify }) {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [ask, setAsk] = useState(null);
  const [running, setRunning] = useState(false);
  // the parent's toast function changes every render; keep a stable wrapper so lists do not refetch
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const flash = useCallback((msg, type = 'success') => notifyRef.current?.(msg, type), []);
  const reload = useCallback(() => api.getReferralOverview().then(setData).catch(e => flash(e.message, 'error')), [flash]);
  useEffect(() => { reload(); }, [reload]);
  const runJobs = async () => {
    setRunning(true);
    try { const r = await api.runReferralJobs(); flash(`Jobs run: ${r.released || 0} released, ${r.overdue || 0} overdue`); reload(); } catch (e) { flash(e.message, 'error'); } finally { setRunning(false); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-2xl bg-white dark-bezel overflow-x-auto max-w-full">
          {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 h-9 px-3.5 rounded-xl text-[13px] font-bold ${tab === k ? 'bg-emerald-700 text-white' : 'text-slate-500 hover:text-slate-800'}`}>{l}{k === 'withdrawals' && data?.overview.pendingWithdrawals ? <span className="ml-1.5 px-1.5 rounded-full bg-amber-400 text-amber-950 text-[10.5px]">{data.overview.pendingWithdrawals}</span> : null}</button>)}
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCsv('referrers').catch(e => flash(e.message, 'error'))} className={`${btn} bg-white dark-bezel text-slate-700`}><Download className="w-3.5 h-3.5" /> Referrers CSV</button>
          <button onClick={runJobs} disabled={running} className={`${btn} bg-white dark-bezel text-slate-700`}>{running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run release job</button>
          <button onClick={reload} className={`${btn} bg-white dark-bezel text-slate-700`} aria-label="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {!data ? <Card><p className="py-8 text-center text-slate-400 text-sm">Loading…</p></Card> : (
        <>
          {tab === 'overview' && <Overview ov={data.overview} />}
          {tab === 'referrers' && <Referrers setAsk={setAsk} flash={flash} reload={reload} />}
          {tab === 'commissions' && <Commissions setAsk={setAsk} flash={flash} reload={reload} />}
          {tab === 'withdrawals' && <Withdrawals setAsk={setAsk} flash={flash} reload={reload} />}
          {tab === 'settings' && <SettingsTab initial={data.settings} flash={flash} reload={reload} />}
          {tab === 'audit' && <Audit flash={flash} />}
        </>
      )}
      <Ask ask={ask} onClose={() => setAsk(null)} />
    </div>
  );
}
