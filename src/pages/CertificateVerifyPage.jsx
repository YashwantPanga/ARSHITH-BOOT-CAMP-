import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Search, ShieldCheck, ShieldX, Award, QrCode, Camera, Upload, X, Calendar, User, Hash, BookOpen, BadgeCheck } from 'lucide-react';
import { api } from '../services/api';
import { BrandLoader } from '../components/ui';
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
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const fileRef = useRef(null);

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

  const onDecoded = (text) => {
    const id = certIdFromQr(text);
    setScanning(false);
    if (id) { setScanError(''); onSearch(id); } else setScanError('That QR code is not an Arshith Bootcamp certificate code.');
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanError('');
    try {
      const bmp = await createImageBitmap(file);
      const c = document.createElement('canvas');
      const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
      c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      const ctx = c.getContext('2d');
      ctx.drawImage(bmp, 0, 0, c.width, c.height);
      const code = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
      if (code?.data) onDecoded(code.data); else setScanError('No QR code found in that image. Try a clearer, closer photo.');
    } catch {
      setScanError('Could not read that image.');
    }
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
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-medium leading-tight">Verify an Arshith Bootcamp certificate</h1>
          <p className="mt-3 text-brand-100/90">Enter the certificate ID, or scan the QR code printed in the corner of the certificate.</p>
          <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. ARB-PY-2026-7KQ2M9XD" className="flex-1 px-5 py-3.5 rounded-xl text-charcoal bg-ivory font-mono uppercase outline-none placeholder:normal-case placeholder:font-sans focus:ring-4 focus:ring-brand-300/40" />
            <button className="btn bg-ivory text-brand-900 hover:bg-white px-6 py-3.5"><Search className="w-4 h-4" /> Verify</button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button onClick={() => { setScanError(''); setScanning(true); }} className="btn border border-white/25 text-ivory hover:bg-white/10"><Camera className="w-4 h-4" /> Scan QR with camera</button>
            <button onClick={() => fileRef.current?.click()} className="btn border border-white/25 text-ivory hover:bg-white/10"><Upload className="w-4 h-4" /> Upload QR photo</button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
          {scanError && <p className="mt-4 text-sm text-rose-200">{scanError}</p>}
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

      {scanning && <QrScanner onClose={() => setScanning(false)} onDecoded={onDecoded} onError={(m) => { setScanning(false); setScanError(m); }} />}
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
        <Item icon={BookOpen} label="Course" value={cert.courseTitle} />
        <Item icon={Award} label="Final score" value={cert.percentage != null ? `${cert.percentage}%${cert.score != null ? ` (${cert.score}/${cert.totalQuestions})` : ''}` : cert.grade} />
        <Item icon={Calendar} label="Issued on" value={cert.issueDate} />
        <Item icon={User} label="Instructor" value={cert.instructorName} />
      </dl>
      {cert.skills?.length > 0 && (
        <div className="px-6 pb-6">
          <p className="text-xs text-slate-400 mb-2">Skills covered</p>
          <div className="flex flex-wrap gap-1.5">{cert.skills.slice(0, 12).map(s => <span key={s} className="chip bg-brand-50 text-brand-900">{s}</span>)}</div>
        </div>
      )}
      <div className="px-6 pb-6"><button onClick={onHome} className="btn-outline"><Award className="w-4 h-4" /> Explore Arshith Bootcamp</button></div>
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

/** Live camera QR scanner (works on localhost / HTTPS). */
function QrScanner({ onClose, onDecoded, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cb = useRef({ onDecoded, onError });
  cb.current = { onDecoded, onError };

  useEffect(() => {
    let stream;
    let raf;
    let done = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        const c = canvasRef.current;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        const tick = () => {
          if (done) return;
          if (v.readyState >= 2 && v.videoWidth) {
            c.width = v.videoWidth; c.height = v.videoHeight;
            ctx.drawImage(v, 0, 0);
            const code = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: 'dontInvert' });
            if (code?.data) { done = true; cb.current.onDecoded(code.data); return; }
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        cb.current.onError('Camera unavailable. Allow camera access, or upload a photo of the QR code instead.');
      }
    })();
    return () => { done = true; cancelAnimationFrame(raf); stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-evergreen/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-ivory rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="font-display text-lg font-semibold text-brand-900 flex items-center gap-2"><QrCode className="w-5 h-5" /> Scan certificate QR</p>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative aspect-square bg-black">
          <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-[18%] rounded-2xl border-2 border-ivory/90 shadow-[0_0_0_9999px_rgba(12,45,38,.45)]" />
          <div className="absolute left-[18%] right-[18%] top-1/2 h-0.5 bg-ivory/80 animate-pulse" />
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <p className="px-5 py-4 text-sm text-slate-500">Hold the QR code inside the frame. It is read automatically.</p>
      </div>
    </div>
  );
}
