import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck, ShieldX, Award, QrCode, Calendar, User, Hash, BookOpen, BadgeCheck } from 'lucide-react';
import { api } from '../services/api';
import { BrandLoader } from '../components/ui';
import { displayTitle } from '../utils/textUtils';
import { useCertificateQr } from './CertificatePage';

/** Pulls a certificate ID out of whatever a QR code contains (verify URL or the bare ID). */
export function certIdFromQr(text) {
  const t = String(text || '').trim();
  const m = t.match(/\/verify\/([^/?#\s]+)/i);
  if (m) return decodeURIComponent(m[1]).toUpperCase();
  const id = t.match(/ARB-[A-Z0-9]+-\d{4}-[A-Z0-9]+/i);
  return id ? id[0].toUpperCase() : '';
}

export default function CertificateVerifyPage({ certId = '', onSearch, onHome }) {
  const [input, setInput] = useState(certId);
  const [state, setState] = useState({ status: certId ? 'loading' : 'idle' });

  useEffect(() => {
    setInput(certId);
    if (!certId) { setState({ status: 'idle' }); return; }
    let cancelled = false;
    setState({ status: 'loading' });
    api.verifyPublicCertificate(certId)
      .then(res => !cancelled && setState({ status: 'ok', cert: res.certificate }))
      .catch(err => !cancelled && setState({ status: 'notfound', message: err.message }));
    return () => { cancelled = true; };
  }, [certId]);

  const submit = (e) => {
    e.preventDefault();
    const id = input.trim().toUpperCase();
    if (id) onSearch(id);
  };

  const cert = state.cert;
  const active = cert?.status === 'active';

  return (
    <div className="bg-cream">
      <section className="relative overflow-hidden bg-brand-900 text-ivory">
        <div className="absolute inset-0 texture-dots-light" />
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-200">Certificate verification</p>
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-medium leading-tight">Verify an CodeLekho certificate</h1>
          <p className="mt-3 text-brand-100/90">Enter the certificate ID, or scan the QR code on the certificate with your phone camera.</p>
          <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. ARB-PY-2026-7KQ2M9XD" className="flex-1 px-5 py-3.5 rounded-xl text-charcoal bg-ivory font-mono uppercase outline-none placeholder:normal-case placeholder:font-sans focus:ring-4 focus:ring-brand-300/40" />
            <button className="btn bg-ivory text-brand-900 hover:bg-white px-6 py-3.5"><Search className="w-4 h-4" /> Verify</button>
          </form>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {state.status === 'loading' && <div className="flex justify-center py-10"><BrandLoader label="Checking registry" /></div>}
        {state.status === 'idle' && (
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: QrCode, t: 'Scan the QR', d: 'Point any phone camera at the QR code in the certificate’s corner.' },
              { icon: Hash, t: 'Or type the ID', d: 'Every certificate carries a unique ID like ARB-PY-2026-XXXXXXXX.' },
              { icon: ShieldCheck, t: 'See live status', d: 'We show the holder, course, score and whether it is still valid.' }
            ].map(s => (
              <div key={s.t} className="card p-5">
                <span className="w-10 h-10 rounded-xl bg-brand-900 text-ivory flex items-center justify-center"><s.icon className="w-5 h-5" /></span>
                <p className="mt-3 font-semibold text-charcoal">{s.t}</p>
                <p className="mt-1 text-sm text-slate-500">{s.d}</p>
              </div>
            ))}
          </div>
        )}
        {state.status === 'notfound' && (
          <div className="card p-8 text-center animate-scale-in">
            <ShieldX className="w-12 h-12 text-rose-600 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-brand-900">No certificate found</h2>
            <p className="mt-1 text-slate-500">We couldn't find a certificate with ID <span className="font-mono">{certId}</span>. Check the ID and try again.</p>
          </div>
        )}
        {state.status === 'ok' && cert && <VerifiedCard cert={cert} active={active} onHome={onHome} />}
      </div>

    </div>
  );
}

function VerifiedCard({ cert, active, onHome }) {
  const qr = useCertificateQr(cert.certificateId, 240);
  return (
    <div className="card overflow-hidden animate-scale-in">
      <div className={`p-6 flex items-center gap-4 ${active ? 'bg-brand-900 text-ivory' : 'bg-rose-50'}`}>
        {active ? <span className="w-12 h-12 rounded-full bg-ivory text-brand-900 flex items-center justify-center"><BadgeCheck className="w-7 h-7" /></span> : <ShieldX className="w-10 h-10 text-rose-600" />}
        <div className="flex-1">
          <p className={`font-display text-xl font-semibold ${active ? '' : 'text-rose-700'}`}>{active ? 'Verified — this certificate is authentic' : 'This certificate has been revoked'}</p>
          <p className={`text-sm font-mono ${active ? 'text-brand-200' : 'text-slate-600'}`}>{cert.certificateId}</p>
        </div>
        {qr && <img src={qr} alt="" className="hidden sm:block w-16 h-16 rounded-lg bg-white p-1" />}
      </div>
      <dl className="p-6 grid sm:grid-cols-2 gap-5 text-sm">
        <Item icon={User} label="Awarded to" value={cert.studentName} />
        {cert.regNo && <Item icon={Hash} label="Registration no." value={cert.regNo} mono />}
        {cert.learnerId && <Item icon={ShieldCheck} label="Learner ID" value={cert.learnerId} mono />}
        <Item icon={BookOpen} label="Course" value={displayTitle(cert.courseTitle)} />
        <Item icon={Award} label="Final score" value={cert.percentage != null ? `${cert.percentage}%${cert.score != null ? ` (${cert.score}/${cert.totalQuestions})` : ''}` : cert.grade} />
        <Item icon={Calendar} label="Issued on" value={cert.issueDate} />
      </dl>
      {cert.skills?.length > 0 && (
        <div className="px-6 pb-6">
          <p className="text-xs text-slate-400 mb-2">Skills covered</p>
          <div className="flex flex-wrap gap-1.5">{cert.skills.slice(0, 12).map(s => <span key={s} className="chip bg-brand-50 text-brand-900">{s}</span>)}</div>
        </div>
      )}
      <div className="px-6 pb-6"><button onClick={onHome} className="btn-outline"><Award className="w-4 h-4" /> Explore CodeLekho</button></div>
    </div>
  );
}

const Item = ({ icon: Icon, label, value, mono }) => (
  <div className="flex gap-3">
    <span className="w-9 h-9 rounded-lg bg-cream border border-brand-900/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-sage" /></span>
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={`mt-0.5 font-semibold text-brand-900 ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  </div>
);
