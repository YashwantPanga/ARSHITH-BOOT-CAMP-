import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, Plus, Pencil, Loader2, X, RefreshCw, GraduationCap, Ticket, BadgeIndianRupee, Pause, Play, Copy, Check, Share2, KeyRound, Download, Printer, MessageCircle } from 'lucide-react';
import { api } from '../../services/adminApi';
import CollegeVoucher, { THEMES, downloadVoucherPng } from '../campus/CollegeVoucher';
import { shareCard, svgToPngBlob, savePng } from '../../utils/shareCard';

/**
 * Staff view of Campus Rewards: partner colleges and their voucher campaigns. Each campaign has one
 * unique voucher code to share with that college's students; the discount, dates and limits are
 * checked on the server at checkout. Also redemptions, per-college analytics and the audit log.
 */
const rs = (p) => `₹${(Number(p || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const input = 'h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
const btn = 'h-9 px-3 rounded-xl text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50';
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-3xl dark-bezel p-5 sm:p-6 ${className}`}>{children}</div>;
const TONE = {
  active: 'bg-emerald-50 text-emerald-700', live: 'bg-emerald-50 text-emerald-700', scheduled: 'bg-sky-50 text-sky-700',
  expired: 'bg-slate-100 text-slate-500', paused: 'bg-amber-50 text-amber-700', ended: 'bg-slate-100 text-slate-500', inactive: 'bg-slate-100 text-slate-500'
};
const Pill = ({ s }) => <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${TONE[s] || 'bg-slate-100 text-slate-600'}`}>{String(s).replace(/_/g, ' ').toLowerCase()}</span>;
const Field = ({ label, error, children, wide }) => (
  <label className={`block ${wide ? 'sm:col-span-2' : ''}`}><span className="text-[12px] font-bold text-slate-500">{label}</span><span className="mt-1 block">{children}</span>{error && <span className="mt-1 block text-[12px] text-rose-600">{error}</span>}</label>
);
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-900/40 overflow-y-auto" role="dialog" aria-modal="true" onClick={onClose}>
    <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} bg-white rounded-2xl p-5 sm:p-6 shadow-xl`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-3"><p className="text-lg font-bold text-slate-800">{title}</p><button onClick={onClose} className="text-slate-400" aria-label="Close"><X className="w-5 h-5" /></button></div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

/* ---------------------------------------------------------------- overview + analytics */
function Overview({ a, compact }) {
  const tiles = [['Partner colleges', `${a.activeColleges}/${a.colleges}`, Building2], ['Live vouchers', `${a.liveCampaigns}/${a.campaigns}`, Ticket], ['Redemptions', a.redeemed, CheckCircle2], ['Students who used one', a.students, GraduationCap],
    ['Discount given', rs(a.discountPaise), BadgeIndianRupee], ['Revenue via vouchers', rs(a.revenuePaise), BadgeIndianRupee]];
  return (
    <div className="space-y-4">
      {!compact && <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{tiles.map(([l, v, Icon]) => <Card key={l} className="!p-4"><Icon className="w-5 h-5 text-emerald-700" /><p className="mt-2 text-2xl font-black text-slate-800">{v}</p><p className="text-[12px] font-semibold text-slate-500">{l}</p></Card>)}</div>}
      <Card>
        <p className="font-bold text-slate-800">By college</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">{['College', 'Status', 'Vouchers (live)', 'Redemptions', 'Students', 'Discount', 'Revenue'].map(h => <th key={h} className="py-2 pr-3 font-bold">{h}</th>)}</tr></thead>
            <tbody>{a.byCollege.length === 0 ? <tr><td colSpan={7} className="py-8 text-center text-slate-400">No colleges yet. Add one under Colleges.</td></tr> : a.byCollege.map(c => (
              <tr key={c.id} className="border-t border-slate-100"><td className="py-2.5 pr-3 font-semibold text-slate-800">{c.name} <span className="font-mono text-emerald-700">{c.code}</span></td><td className="pr-3"><Pill s={c.status} /></td><td className="pr-3">{c.campaigns} ({c.live})</td><td className="pr-3">{c.redeemed}</td><td className="pr-3">{c.students}</td><td className="pr-3">{rs(c.discountPaise)}</td><td className="pr-3">{rs(c.revenuePaise)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------- colleges */
function CollegeForm({ college, onSaved, onClose, flash }) {
  const [f, setF] = useState(() => ({ name: college?.name || '', code: college?.code || '', domains: (college?.domains || []).join(', '), logo: college?.logo || '', address: college?.address || '', city: college?.city || '', state: college?.state || '', country: college?.country || 'India', description: college?.description || '', status: college?.status || 'active' }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 280 * 1024) { setErrors(x => ({ ...x, logo: 'Use a PNG, JPG or WebP under 280 KB.' })); return; }
    const r = new FileReader(); r.onload = () => setF(x => ({ ...x, logo: r.result })); r.readAsDataURL(file);
  };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    const body = { ...f, code: f.code.toUpperCase() };
    try { const r = college ? await api.updateCampusCollege(college.id, body) : await api.addCampusCollege(body); flash(college ? 'College updated' : 'College added'); onSaved(r.college); }
    catch (err) { setErrors(err.data?.errors || { _: err.message }); } finally { setBusy(false); }
  };
  return (
    <Modal title={college ? `Edit ${college.name}` : 'Add a partner college'} onClose={onClose}>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
        <Field label="College name" error={errors.name} wide><input value={f.name} onChange={set('name')} className={input} /></Field>
        <Field label="College code (unique, e.g. ABC001)" error={errors.code}><input value={f.code} onChange={(e) => setF(x => ({ ...x, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} className={`${input} font-mono`} maxLength={12} /></Field>
        <Field label="Status"><select value={f.status} onChange={set('status')} className={input}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field>
        <Field label="Official email domain (optional, for your records)" error={errors.domains} wide><input value={f.domains} onChange={set('domains')} className={input} placeholder="abc.edu.in" /></Field>
        <Field label="Logo" error={errors.logo}>
          <span className="flex items-center gap-3">{f.logo ? <img src={f.logo} alt="" className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white" /> : <span className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-400" /></span>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickLogo} className="text-[12.5px]" /></span>
        </Field>
        <Field label="Country"><input value={f.country} onChange={set('country')} className={input} /></Field>
        <Field label="Address" wide><input value={f.address} onChange={set('address')} className={input} /></Field>
        <Field label="City" error={errors.city}><input value={f.city} onChange={set('city')} className={input} /></Field>
        <Field label="State" error={errors.state}><input value={f.state} onChange={set('state')} className={input} /></Field>
        <Field label="Description" wide><textarea value={f.description} onChange={set('description')} rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></Field>
        {errors._ && <p className="sm:col-span-2 text-[13px] text-rose-600">{errors._}</p>}
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={`${btn} bg-slate-100 text-slate-600`}>Cancel</button><button disabled={busy} className={`${btn} bg-emerald-700 text-white`}>{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{college ? 'Save' : 'Add college'}</button></div>
      </form>
    </Modal>
  );
}

function Colleges({ flash, reload }) {
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null); // null | 'new' | college
  const load = useCallback(() => api.getCampusColleges().then(r => setRows(r.colleges)).catch(e => flash(e.message, 'error')), [flash]);
  useEffect(() => { load(); }, [load]);
  const toggle = async (c) => { try { await api.updateCampusCollege(c.id, { status: c.status === 'active' ? 'inactive' : 'active' }); flash(c.status === 'active' ? 'College deactivated' : 'College activated'); load(); reload(); } catch (e) { flash(e.message, 'error'); } };
  return (
    <Card>
      <div className="flex items-center justify-between gap-3"><p className="font-bold text-slate-800">Partner colleges</p><button onClick={() => setEdit('new')} className={`${btn} bg-emerald-700 text-white`}><Plus className="w-4 h-4" /> Add college</button></div>
      <div className="mt-4 grid md:grid-cols-2 gap-3">
        {rows === null ? <p className="py-8 text-center text-slate-400 text-sm md:col-span-2">Loading…</p> : rows.length === 0 ? <p className="py-8 text-center text-slate-400 text-sm md:col-span-2">No colleges yet.</p> : rows.map(c => (
          <div key={c.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              {c.logo ? <img src={c.logo} alt="" className="w-12 h-12 rounded-xl object-contain border border-slate-200 bg-white" /> : <span className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-slate-400" /></span>}
              <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 truncate">{c.name}</p><p className="text-[12.5px] text-slate-500"><span className="font-mono text-emerald-700">{c.code}</span> · {c.city}, {c.state}{c.domains.length ? ` · @${c.domains.join(', @')}` : ''}</p></div>
              <Pill s={c.status} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[12px]">{[['Vouchers', c.stats?.campaigns], ['Live', c.stats?.live], ['Redeemed', c.stats?.redeemed], ['Students', c.stats?.students]].map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 py-2"><b className="block text-slate-800 text-base">{v ?? 0}</b>{l}</div>)}</div>
            <div className="mt-3 flex gap-2"><button onClick={() => setEdit(c)} className={`${btn} bg-slate-100 text-slate-700`}><Pencil className="w-3.5 h-3.5" /> Edit</button><button onClick={() => toggle(c)} className={`${btn} ${c.status === 'active' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>{c.status === 'active' ? 'Deactivate' : 'Activate'}</button></div>
          </div>
        ))}
      </div>
      {edit && <CollegeForm college={edit === 'new' ? null : edit} flash={flash} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); reload(); }} />}
    </Card>
  );
}

/* ---------------------------------------------------------------- campaigns */
function CampaignForm({ colleges, courses, onClose, onSaved, flash }) {
  const today = new Date().toISOString().slice(0, 10);
  const later = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
  const [f, setF] = useState({ collegeId: colleges[0]?.id || '', name: '', discountPct: 25, custom: '', startsAt: today, endsAt: later, allCourses: true, courseIds: [], kinds: ['course'], minPurchase: 0, maxDiscount: 0, maxRedemptions: 0, perStudentLimit: 1 });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF(x => ({ ...x, [k]: e.target.value }));
  const pct = f.discountPct === 'custom' ? Number(f.custom) : Number(f.discountPct);
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErrors({});
    try {
      await api.addCampusCampaign({ collegeId: f.collegeId, name: f.name, discountPct: pct, startsAt: new Date(`${f.startsAt}T00:00:00`).toISOString(), endsAt: new Date(`${f.endsAt}T23:59:59`).toISOString(), eligibleCourseIds: f.allCourses ? 'all' : f.courseIds, eligibleKinds: f.kinds, minPurchase: Number(f.minPurchase), maxDiscount: Number(f.maxDiscount), maxRedemptions: Number(f.maxRedemptions), perStudentLimit: Number(f.perStudentLimit) });
      flash('Voucher created'); onSaved();
    } catch (err) { setErrors(err.data?.errors || { _: err.message }); } finally { setBusy(false); }
  };
  const toggleKind = (k) => setF(x => ({ ...x, kinds: x.kinds.includes(k) ? x.kinds.filter(y => y !== k) : [...x.kinds, k] }));
  return (
    <Modal title="New college voucher" onClose={onClose}>
      <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
        <Field label="College" error={errors.collegeId}><select value={f.collegeId} onChange={set('collegeId')} className={input}>{colleges.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}</select></Field>
        <Field label="Campaign name" error={errors.name}><input value={f.name} onChange={set('name')} className={input} placeholder="Semester launch 2026" /></Field>
        <Field label="Discount" error={errors.discountPct} wide>
          <span className="flex flex-wrap gap-2">{[25, 30, 50].map(p => <button type="button" key={p} onClick={() => setF(x => ({ ...x, discountPct: p }))} className={`h-10 px-4 rounded-xl border text-sm font-bold ${f.discountPct === p ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-200 text-slate-600'}`}>{p}% OFF</button>)}
            <button type="button" onClick={() => setF(x => ({ ...x, discountPct: 'custom' }))} className={`h-10 px-4 rounded-xl border text-sm font-bold ${f.discountPct === 'custom' ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-200 text-slate-600'}`}>Custom</button>
            {f.discountPct === 'custom' && <input type="number" min={1} max={90} value={f.custom} onChange={set('custom')} className={`${input} !w-24`} placeholder="%" />}</span>
        </Field>
        <Field label="Starts" error={errors.startsAt}><input type="date" value={f.startsAt} onChange={set('startsAt')} className={input} /></Field>
        <Field label="Ends (vouchers expire then)" error={errors.endsAt}><input type="date" value={f.endsAt} onChange={set('endsAt')} className={input} /></Field>
        <Field label="Applies to" error={errors.eligibleKinds} wide>
          <span className="flex gap-4 text-sm">{[['course', 'Courses'], ['interview', 'Interview Prep']].map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f.kinds.includes(k)} onChange={() => toggleKind(k)} className="w-4 h-4 accent-emerald-700" />{l}</label>)}</span>
        </Field>
        {f.kinds.includes('course') && (
          <Field label="Eligible courses" error={errors.eligibleCourseIds} wide>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allCourses} onChange={(e) => setF(x => ({ ...x, allCourses: e.target.checked }))} className="w-4 h-4 accent-emerald-700" /> All courses</label>
            {!f.allCourses && <span className="mt-2 grid sm:grid-cols-2 gap-1.5">{courses.map(c => <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.courseIds.includes(c.id)} onChange={() => setF(x => ({ ...x, courseIds: x.courseIds.includes(c.id) ? x.courseIds.filter(i => i !== c.id) : [...x.courseIds, c.id] }))} className="w-4 h-4 accent-emerald-700" />{c.title}</label>)}</span>}
          </Field>
        )}
        <Field label="Minimum purchase (₹, 0 = none)" error={errors.minPurchase}><input type="number" min={0} value={f.minPurchase} onChange={set('minPurchase')} className={input} /></Field>
        <Field label="Maximum discount (₹, 0 = no cap)" error={errors.maxDiscount}><input type="number" min={0} value={f.maxDiscount} onChange={set('maxDiscount')} className={input} /></Field>
        <Field label="Total redemptions (0 = no limit)" error={errors.maxRedemptions}><input type="number" min={0} value={f.maxRedemptions} onChange={set('maxRedemptions')} className={input} /></Field>
        <Field label="Uses per student" error={errors.perStudentLimit}><input type="number" min={1} max={10} value={f.perStudentLimit} onChange={set('perStudentLimit')} className={input} /></Field>
        <p className="sm:col-span-2 text-[12px] text-slate-500">A unique voucher code is generated for this college when you create it. Share it with the college; students enter it at checkout.</p>
        {errors._ && <p className="sm:col-span-2 text-[13px] text-rose-600">{errors._}</p>}
        <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" onClick={onClose} className={`${btn} bg-slate-100 text-slate-600`}>Cancel</button><button disabled={busy || !colleges.length} className={`${btn} bg-emerald-700 text-white`}>{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Create voucher</button></div>
      </form>
    </Modal>
  );
}


function CopyBtn({ text, label, icon: Icon = Copy }) {
  const [done, setDone] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* blocked */ } };
  return <button onClick={copy} className={`${btn} bg-slate-100 text-slate-700`}>{done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Icon className="w-3.5 h-3.5" />}{done ? 'Copied' : label}</button>;
}

const coversText = (c, courses) => {
  const course = c.eligibleCourseIds === 'all' ? 'all courses' : c.eligibleCourseIds.length === 1 ? (courses.find(x => x.id === c.eligibleCourseIds[0])?.title || '1 course') : `${c.eligibleCourseIds.length} courses`;
  return c.eligibleKinds.includes('course') && c.eligibleKinds.includes('interview') ? `${course} + Interview Prep` : c.eligibleKinds.includes('interview') ? 'Interview Prep' : course;
};

/** One college voucher: the shareable design, a theme choice and the actions. */
function VoucherRow({ c, courses, onStatus, onNewCode, share, flash }) {
  const [theme, setTheme] = useState(c.discountPct >= 50 ? 'gold' : 'emerald');
  const [saving, setSaving] = useState(false);
  const [print, setPrint] = useState(0); // bump to print the coupon again
  const svgRef = useRef(null);      // wide voucher (tablets and laptops)
  const tallRef = useRef(null);     // tall coupon (phones)
  const phone = () => window.matchMedia?.('(max-width: 639px)').matches;
  const shareWa = async () => {
    setSaving(true);
    try {
      const tall = phone();
      const r = await shareCard({ svg: tall ? tallRef.current : svgRef.current, width: tall ? 1200 : 2000, height: tall ? 1640 : 840, fileName: `CodeLekho-${c.college?.code || 'college'}-${c.voucherCode}.png`, text: share(c) });
      if (r === 'fallback') flash('Voucher image saved - attach it in the WhatsApp chat that opened.');
    } catch { flash('Could not create the image.', 'error'); } finally { setSaving(false); }
  };
  const download = async () => {
    setSaving(true);
    try {
      const name = `CodeLekho-${c.college?.code || 'college'}-${c.voucherCode}.png`;
      if (phone()) savePng(await svgToPngBlob(tallRef.current, 1200, 1640), name); else await downloadVoucherPng(svgRef.current, name);
    } catch { flash('Could not create the image.', 'error'); } finally { setSaving(false); }
  };
  return (
    <Card className="!p-4 sm:!p-5">
      <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-5 items-center">
        <div>
          {/* the coupon printer: the voucher feeds out of the slot, a gold scan line sweeping over it */}
          <div className="cv-printer">
            <div className="cv-head" aria-hidden="true"><span className="cv-led" /><span className="cv-slot" /><span className="cv-brand">CODELEKHO · COUPONS</span></div>
            <div className="cv-feed">
              <div key={`${print}-${theme}`} className="cv-paper">
                {['landscape', 'portrait'].map(layout => (
                  <CollegeVoucher key={layout} ref={layout === 'portrait' ? tallRef : svgRef} layout={layout} theme={theme} code={c.voucherCode} discountPct={c.discountPct} college={c.college} endsAt={c.endsAt} serial={c.serial || '0001'} covers={coversText(c, courses)} site={window.location.host}
                    className={`${layout === 'portrait' ? 'sm:hidden' : 'hidden sm:block'} w-full h-auto rounded-b-[18px] ${c.state === 'live' || c.state === 'scheduled' ? '' : 'grayscale opacity-70'}`} />
                ))}
                <span className="cv-scan" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-bold text-slate-500 mr-1">Design</span>
            {Object.entries(THEMES).map(([k, v]) => (
              <button key={k} onClick={() => setTheme(k)} className={`h-8 pl-1.5 pr-3 rounded-full border text-[12.5px] font-semibold inline-flex items-center gap-1.5 ${theme === k ? 'border-emerald-700 text-emerald-800 bg-emerald-50' : 'border-slate-200 text-slate-600'}`}>
                <span className="w-5 h-5 rounded-full" style={{ background: `linear-gradient(135deg, ${v.bg[0]}, ${v.bg[1]})` }} />{v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-800">{c.name}</p><Pill s={c.state} /></div>
          <p className="text-[13px] text-slate-500">{c.college?.name} · {day(c.startsAt)} → {day(c.endsAt)}</p>
          <div className="grid grid-cols-3 gap-2 text-center text-[12px]">
            {[['Redeemed', c.maxRedemptions ? `${c.redeemed}/${c.maxRedemptions}` : c.redeemed], ['Students', c.students], ['Discount given', rs(c.discountPaise)]].map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 py-2"><b className="block text-slate-800 text-[15px]">{v}</b>{l}</div>)}
          </div>
          <p className="text-[12px] text-slate-500">{c.perStudentLimit} use{c.perStudentLimit > 1 ? 's' : ''} per student{c.minPurchasePaise ? ` · min ${rs(c.minPurchasePaise)}` : ''}{c.maxDiscountPaise ? ` · up to ${rs(c.maxDiscountPaise)} off` : ''}{c.inProgress ? ` · ${c.inProgress} payment(s) in progress` : ''}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={shareWa} disabled={saving} className={`${btn} bg-[#25D366] text-[#073B1E]`}>{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />} Share on WhatsApp</button>
            <button onClick={download} disabled={saving} className={`${btn} bg-emerald-700 text-white`}><Download className="w-3.5 h-3.5" /> Download PNG</button>
            <button onClick={() => setPrint(n => n + 1)} className={`${btn} bg-slate-100 text-slate-700`}><Printer className="w-3.5 h-3.5" /> Print again</button>
            <CopyBtn text={c.voucherCode} label="Copy code" />
            <CopyBtn text={share(c)} label="Copy share message" icon={Share2} />
            {c.status === 'active' && <button onClick={() => onStatus(c, 'paused')} className={`${btn} bg-amber-50 text-amber-800`}><Pause className="w-3.5 h-3.5" /> Pause</button>}
            {c.status === 'paused' && <button onClick={() => onStatus(c, 'active')} className={`${btn} bg-emerald-50 text-emerald-700`}><Play className="w-3.5 h-3.5" /> Resume</button>}
            <button onClick={() => onNewCode(c)} className={`${btn} bg-slate-100 text-slate-700`}><KeyRound className="w-3.5 h-3.5" /> New code</button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Campaigns({ flash, reload }) {
  const [rows, setRows] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api.getCampusCampaigns().then(r => setRows(r.campaigns)).catch(e => flash(e.message, 'error')), [flash]);
  useEffect(() => { load(); api.getCampusColleges().then(r => setColleges(r.colleges.filter(c => c.status === 'active'))).catch(() => {}); api.getPublicCourses().then(r => setCourses(r.courses || [])).catch(() => {}); }, [load]);
  const setStatus = async (c, status) => { try { await api.updateCampusCampaign(c.id, { status }); flash(status === 'paused' ? 'Voucher paused' : 'Voucher active again'); load(); reload(); } catch (e) { flash(e.message, 'error'); } };
  const newCode = async (c) => {
    if (!window.confirm(`Make a new code for ${c.college?.name}? The old code ${c.voucherCode} stops working at once.`)) return;
    try { await api.newCampusCode(c.id); flash('New code created'); load(); } catch (e) { flash(e.message, 'error'); }
  };
  const share = (c) => `${c.college?.name} students: get ${c.discountPct}% off CodeLekho ${c.eligibleKinds.includes('interview') && c.eligibleKinds.includes('course') ? 'courses and Interview Prep' : c.eligibleKinds.includes('interview') ? 'Interview Prep' : 'courses'}. Use voucher code ${c.voucherCode} at checkout on ${window.location.origin} - valid till ${day(c.endsAt)}.`;
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-bold text-slate-800">College vouchers</p><p className="text-[12.5px] text-slate-500">Each voucher has a unique code for one college. Share it; students enter it at checkout.</p></div>
          <button onClick={() => setAdding(true)} disabled={!colleges.length} className={`${btn} bg-emerald-700 text-white`}><Plus className="w-4 h-4" /> New voucher</button>
        </div>
        {!colleges.length && <p className="mt-2 text-[13px] text-slate-500">Add an active college first.</p>}
      </Card>
      {rows === null ? <Card><p className="py-8 text-center text-slate-400 text-sm">Loading…</p></Card> : rows.length === 0 ? <Card><p className="py-8 text-center text-slate-400 text-sm">No vouchers yet.</p></Card> : rows.map(c => (
        <VoucherRow key={c.id} c={c} courses={courses} onStatus={setStatus} onNewCode={newCode} share={share} flash={flash} />
      ))}
      {adding && <CampaignForm colleges={colleges} courses={courses} flash={flash} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); reload(); }} />}
    </div>
  );
}

/* ---------------------------------------------------------------- vouchers, redemptions, audit */
function Redemptions({ flash }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.getCampusRedemptions().then(r => setRows(r.redemptions)).catch(e => flash(e.message, 'error')); }, [flash]);
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead><tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">{['When', 'Code', 'Learner', 'College', 'Item', 'Price', 'Discount', 'Paid', 'Order'].map(h => <th key={h} className="py-2 pr-3 font-bold">{h}</th>)}</tr></thead>
          <tbody>{rows === null ? <tr><td colSpan={9} className="py-8 text-center text-slate-400">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={9} className="py-8 text-center text-slate-400">No redemptions yet.</td></tr> : rows.map(r => (
            <tr key={r.id} className="border-t border-slate-100 text-[12.5px]"><td className="py-2.5 pr-3 whitespace-nowrap">{when(r.at)}</td><td className="pr-3 font-mono font-bold">{r.code}</td><td className="pr-3">{r.learner || r.email}<span className="block text-slate-400">{r.learner ? r.email : ''}</span></td><td className="pr-3">{r.college}</td><td className="pr-3">{r.item}</td><td className="pr-3">{rs(r.originalPaise)}</td><td className="pr-3 text-emerald-700 font-semibold">−{rs(r.discountPaise)}</td><td className="pr-3 font-bold">{rs(r.finalPaise)}</td><td className="pr-3 font-mono text-slate-400">{r.orderId}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </Card>
  );
}

function Audit({ flash }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api.getCampusAudit().then(r => setRows(r.audit)).catch(e => flash(e.message, 'error')); }, [flash]);
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

const TABS = [['overview', 'Campus overview'], ['colleges', 'Colleges'], ['campaigns', 'College vouchers'], ['redemptions', 'Redemptions'], ['analytics', 'College analytics'], ['audit', 'Audit log']];

export default function AdminCampus({ notify }) {
  const [tab, setTab] = useState('overview');
  const [a, setA] = useState(null);
  const notifyRef = useRef(notify);
  notifyRef.current = notify;
  const flash = useCallback((msg, type = 'success') => notifyRef.current?.(msg, type), []);
  const reload = useCallback(() => api.getCampusOverview().then(r => setA(r.analytics)).catch(e => flash(e.message, 'error')), [flash]);
  useEffect(() => { reload(); }, [reload]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-2xl bg-white dark-bezel overflow-x-auto max-w-full">
          {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`shrink-0 h-9 px-3.5 rounded-xl text-[13px] font-bold ${tab === k ? 'bg-emerald-700 text-white' : 'text-slate-500 hover:text-slate-800'}`}>{l}</button>)}
        </div>
        <button onClick={reload} className={`${btn} bg-white dark-bezel text-slate-700`} aria-label="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
      </div>
      {!a ? <Card><p className="py-8 text-center text-slate-400 text-sm">Loading…</p></Card> : (
        <>
          {tab === 'overview' && <Overview a={a} />}
          {tab === 'colleges' && <Colleges flash={flash} reload={reload} />}
          {tab === 'campaigns' && <Campaigns flash={flash} reload={reload} />}
          {tab === 'redemptions' && <Redemptions flash={flash} />}
          {tab === 'analytics' && <Overview a={a} compact />}
          {tab === 'audit' && <Audit flash={flash} />}
        </>
      )}
    </div>
  );
}
