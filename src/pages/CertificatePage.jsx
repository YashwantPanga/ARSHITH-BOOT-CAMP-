import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import LinkedInShare from '../components/LinkedInShare';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Download, ShieldCheck, ArrowLeft, Lock, Copy, Check, AlertTriangle, QrCode, Image as ImageIcon, Linkedin } from 'lucide-react';
import { api } from '../services/api';
import { userIdOf, displayNameOf } from '../utils/session';
import { BrandLoader, useToast } from '../components/ui';
import { displayTitle } from '../utils/textUtils';

const W = 1000;
const H = 707; // A4 landscape ratio

// Palette
const FOREST = '#013A2B';
const EVERGREEN = '#0C2D26';
const IVORY = '#FBF8F1';
const CREAM = '#F8F5EE';
const SAGE = '#426557';
const CHARCOAL = '#302B25';

const isLocalHost = (h) => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(h);
let baseUrlPromise = null;

/**
 * Base address encoded in QR codes. A QR code containing "localhost" cannot be opened by the phone that
 * scans it, so when the site is opened on localhost we ask the server for its network address
 * (or PUBLIC_SITE_URL when configured).
 */
export function getPublicBaseUrl() {
  if (!isLocalHost(window.location.hostname)) return Promise.resolve(window.location.origin);
  if (!baseUrlPromise) {
    baseUrlPromise = fetch('/api/site-info')
      .then(r => r.json())
      .then(d => (d && /^https?:\/\//.test(d.publicUrl || '') ? d.publicUrl.replace(/\/+$/, '') : window.location.origin))
      .catch(() => window.location.origin);
  }
  return baseUrlPromise;
}

export const verifyUrlFor = (certId, base = window.location.origin) => `${base}/verify/${encodeURIComponent(certId)}`;

/** Verification URL for a certificate, resolved against the public base address. */
export function useVerifyUrl(certId) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!certId) { setUrl(''); return undefined; }
    let alive = true;
    getPublicBaseUrl().then(base => alive && setUrl(verifyUrlFor(certId, base)));
    return () => { alive = false; };
  }, [certId]);
  return url;
}

/** QR code (as a data URL) that opens the public verification page for this certificate. */
export function useCertificateQr(certId, size = 360) {
  const url = useVerifyUrl(certId);
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (!url) return undefined;
    let alive = true;
    QRCode.toDataURL(url, { errorCorrectionLevel: 'H', margin: 1, width: size, color: { dark: FOREST, light: '#FFFFFF' } })
      .then(data => alive && setQr(data))
      .catch(() => alive && setQr(''));
    return () => { alive = false; };
  }, [url, size]);
  return qr;
}

export default function CertificatePage({ course, studentUser, onBack, onVerify, onGoToCourse }) {
  const toast = useToast();
  const [state, setState] = useState({ status: 'loading' });
  const [downloading, setDownloading] = useState('');
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const wrapRef = useRef(null);
  const certRef = useRef(null);

  const load = async () => {
    setState({ status: 'loading' });
    try {
      const res = await api.issueCertificate({
        userId: userIdOf(studentUser),
        studentName: displayNameOf(studentUser),
        regNo: studentUser?.regNo || '',
        courseId: course.id
      });
      setState({ status: 'ok', cert: res.certificate });
    } catch (err) {
      setState({ status: err.status === 403 ? 'locked' : 'error', message: err.message });
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [course.id, studentUser?.email]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const fit = () => setScale(Math.min(1, el.clientWidth / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [state.status]);

  const cert = state.cert;
  const qr = useCertificateQr(cert?.certificateId);
  const verifyUrl = useVerifyUrl(cert?.certificateId);

  const render = async (scale = 3) => {
    await document.fonts?.ready;
    return html2canvas(certRef.current, {
      scale, useCORS: true, backgroundColor: IVORY, width: W, height: H, windowWidth: W, windowHeight: H, logging: false,
      onclone: (doc) => {
        const node = doc.querySelector('[data-cert]');
        if (node) { node.style.transform = 'none'; node.parentElement.style.width = `${W}px`; node.parentElement.style.height = `${H}px`; }
        // html2canvas draws some text a few px lower than the browser; nudge those nodes in the clone only.
        doc.querySelectorAll('[data-shift]').forEach(el => { el.style.position = 'relative'; el.style.top = `${el.dataset.shift}px`; });
      }
    });
  };

  const downloadPdf = async () => {
    if (!certRef.current || !cert) return;
    setDownloading('pdf');
    try {
      const canvas = await render();
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
      pdf.setProperties({
        title: `Certificate ${cert.certificateId} – ${cert.studentName}`,
        subject: `Certificate of Completion: ${cert.courseTitle}`,
        author: 'CodeLekho',
        keywords: `certificate, ${cert.certificateId}, ${cert.regNo || ''}`,
        creator: 'CodeLekho Certificate Service'
      });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
      // Make the QR corner clickable in the PDF as well.
      const mm = 297 / W;
      pdf.link(QR_BOX.x * mm, QR_BOX.y * mm, QR_BOX.s * mm, QR_BOX.s * mm, { url: verifyUrl });
      pdf.save(`CodeLekho_Certificate_${cert.certificateId}.pdf`);
    } catch (err) {
      console.error(err);
      toast('Could not create the PDF. Please try again.', 'error');
    } finally {
      setDownloading('');
    }
  };

  const downloadPng = async () => {
    if (!certRef.current || !cert) return;
    setDownloading('png');
    try {
      const canvas = await render();
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `CodeLekho_Certificate_${cert.certificateId}.png`;
      a.click();
    } catch {
      toast('Could not create the image. Please try again.', 'error');
    } finally {
      setDownloading('');
    }
  };

  // LinkedIn: animated share window; the certificate picture is rendered at 1600 px wide for the post
  const [sharing, setSharing] = useState(false);
  const shareLinkedIn = () => setSharing(true);
  const renderForPost = useCallback(() => render(1.6), [cert]); // eslint-disable-line react-hooks/exhaustive-deps
  const closeShare = useCallback(() => setSharing(false), []);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(cert.certificateId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  return (
    <div className="bg-cream min-h-[70vh] py-8">
      {sharing && cert && <LinkedInShare cert={cert} verifyUrl={verifyUrl} renderCanvas={renderForPost} onClose={closeShare} />}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onBack} className="btn-ghost -ml-3"><ArrowLeft className="w-4 h-4" /> Dashboard</button>
          {state.status === 'ok' && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onVerify(cert.certificateId)} className="btn-ghost border border-brand-900/15"><ShieldCheck className="w-4 h-4" /> Verify online</button>
              <button onClick={shareLinkedIn} className="btn-ghost border border-brand-900/15"><Linkedin className="w-4 h-4" /> Share on LinkedIn</button>
              <button onClick={downloadPng} disabled={!!downloading} className="btn-outline"><ImageIcon className="w-4 h-4" />{downloading === 'png' ? 'Preparing…' : 'PNG'}</button>
              <button onClick={downloadPdf} disabled={!!downloading || !qr} className="btn-primary"><Download className="w-4 h-4" />{downloading === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}</button>
            </div>
          )}
        </div>

        {state.status === 'loading' && <div className="py-24 flex justify-center"><BrandLoader label="Preparing your certificate" /></div>}

        {state.status === 'locked' && (
          <div className="card max-w-lg mx-auto p-8 text-center">
            <span className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-900 flex items-center justify-center mx-auto"><Lock className="w-8 h-8" /></span>
            <h1 className="mt-5 text-2xl font-semibold text-brand-900">Certificate not unlocked yet</h1>
            <p className="mt-2 text-slate-500">{state.message || 'Score 70% or above in the final assessment to unlock your certificate.'}</p>
            <ol className="mt-6 text-left text-sm text-slate-600 space-y-2">
              <li>1. Pass all {course.modules?.length || 15} module quizzes ({course.modules?.filter(m => m.completed).length || 0} done)</li>
              <li>2. Score 70% or more in the proctored final assessment</li>
            </ol>
            <button onClick={onGoToCourse} className="btn-primary mt-7">Go to course</button>
          </div>
        )}

        {state.status === 'error' && (
          <div className="card max-w-lg mx-auto p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <p className="mt-3 text-slate-600">{state.message || 'Could not load your certificate.'}</p>
            <button onClick={load} className="btn-primary mt-5">Try again</button>
          </div>
        )}

        {state.status === 'ok' && (
          <>
            <div className="card p-4 sm:p-5 flex flex-wrap items-center gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-slate-400">Certificate ID</p>
                <p className="font-mono font-semibold text-brand-900 flex items-center gap-2">{cert.certificateId}
                  <button onClick={copyId} className="p-1 rounded hover:bg-cream" aria-label="Copy ID">{copied ? <Check className="w-4 h-4 text-mint-400" /> : <Copy className="w-4 h-4 text-slate-400" />}</button>
                </p>
              </div>
              {cert.regNo && <div><p className="text-xs text-slate-400">Registration no.</p><p className="font-mono font-semibold text-brand-900">{cert.regNo}</p></div>}
              <div><p className="text-xs text-slate-400">Final score</p><p className="font-semibold text-brand-900">{cert.percentage}% ({cert.score}/{cert.totalQuestions})</p></div>
              <div><p className="text-xs text-slate-400">Issued</p><p className="font-semibold text-brand-900">{cert.issueDate}</p></div>
              <p className="ml-auto flex items-center gap-2 text-xs text-slate-500 max-w-xs"><QrCode className="w-4 h-4 text-sage shrink-0" />Anyone can scan the QR code on the certificate to open its live verification page.</p>
            </div>

            <div ref={wrapRef} className="w-full">
              <div className="overflow-hidden mx-auto rounded-md shadow-[0_40px_80px_-40px_rgba(12,45,38,.55)]" style={{ width: W * scale, height: H * scale }}>
                <div ref={certRef} data-cert style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                  <CertificateArt cert={cert} verifyUrl={verifyUrl} qr={qr} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const QR_BOX = { x: 842, y: 548, s: 104 };

function Seal() {
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <svg width="118" height="118" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="57" fill={FOREST} />
      {ticks.map(a => <line key={a} x1="60" y1="6" x2="60" y2="11" stroke={IVORY} strokeOpacity=".5" strokeWidth="1.2" transform={`rotate(${a} 60 60)`} />)}
      <circle cx="60" cy="60" r="45" fill="none" stroke={IVORY} strokeOpacity=".6" strokeWidth="1" />
      <circle cx="60" cy="60" r="41" fill={EVERGREEN} />
      <text x="60" y="34" textAnchor="middle" fontFamily="DM Sans, system-ui, sans-serif" fontSize="7" fontWeight="700" letterSpacing="2" fill={IVORY} fillOpacity=".85">VERIFIED</text>
      <text x="60" y="94" textAnchor="middle" fontFamily="DM Sans, system-ui, sans-serif" fontSize="7" fontWeight="700" letterSpacing="2" fill={IVORY} fillOpacity=".85">CODELEKHO</text>
      <path d="M60 46 C60 56 60 62 60 78" stroke={IVORY} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M60 66 C52 66 46 61 45 53 C53 53 59 58 60 66Z" fill="#90B1A2" />
      <path d="M60 58 C68 58 74 53 75 45 C67 45 61 50 60 58Z" fill={IVORY} />
    </svg>
  );
}

function CertificateArt({ cert, verifyUrl, qr }) {
  const grade = String(cert.grade || '').replace(/^\d+%\s*/, '');
  return (
    <div style={{ width: W, height: H, position: 'relative', background: IVORY, fontFamily: 'DM Sans, system-ui, sans-serif', overflow: 'hidden', color: CHARCOAL }}>
      {/* Watermark: repeated brand tile + large centred mark */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/arshith-watermark-tile.png)', backgroundSize: '240px 160px', opacity: 0.05 }} />
      <div style={{ position: 'absolute', left: 250, top: 200, width: 700, textAlign: 'center', transform: 'rotate(-18deg)', fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 120, fontWeight: 400, color: FOREST, opacity: 0.035, letterSpacing: 10 }}>ARSHITH</div>

      {/* Left band */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 210, background: `linear-gradient(180deg, ${FOREST} 0%, ${EVERGREEN} 100%)` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(251,248,241,.10) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 46, display: 'flex', justifyContent: 'center' }}>
          <img src="/codelekho-logo-white.png" alt="" style={{ width: 170, objectFit: 'contain' }} crossOrigin="anonymous" />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center' }}><Seal /></div>
        <div style={{ position: 'absolute', left: 26, right: 26, bottom: 44, color: IVORY }}>
          <p style={{ fontSize: 9, letterSpacing: '0.24em', opacity: 0.6, fontWeight: 700 }}>CREDENTIAL</p>
          <p style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 17, marginTop: 6, lineHeight: 1.25 }}>Professional<br />Certificate</p>
          <div style={{ height: 1, background: 'rgba(251,248,241,.25)', margin: '14px 0' }} />
          <p style={{ fontSize: 9, letterSpacing: '0.24em', opacity: 0.6, fontWeight: 700 }}>LEARNER ID</p>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, marginTop: 4, fontWeight: 600 }}>{cert.learnerId || cert.regNo || '—'}</p>
        </div>
      </div>

      {/* Frame */}
      <div style={{ position: 'absolute', left: 232, top: 22, right: 22, bottom: 22, border: `1.5px solid ${SAGE}`, borderRadius: 4 }} />
      <div style={{ position: 'absolute', left: 240, top: 30, right: 30, bottom: 30, border: `0.75px solid ${SAGE}55`, borderRadius: 2 }} />

      {/* Content */}
      <div style={{ position: 'absolute', left: 280, right: 70, top: 66, bottom: 56 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.38em', color: SAGE, fontWeight: 700 }}>CERTIFICATE OF COMPLETION</p>
        <p style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontSize: 15, color: CHARCOAL, opacity: 0.75, marginTop: 26 }}>This is to proudly certify that</p>
        {/* Fixed line boxes keep html2canvas' text placement identical to the on-screen layout */}
        <p data-shift="-9" style={{ fontFamily: 'DM Serif Display, Georgia, serif', fontStyle: 'italic', fontSize: String(cert.studentName).length > 26 ? 42 : 52, color: FOREST, fontWeight: 400, lineHeight: '72px', height: 72, marginTop: 6, maxWidth: 620, whiteSpace: 'nowrap' }}>{cert.studentName}</p>
        {cert.regNo && (
          <p style={{ marginTop: 6, fontSize: 11.5, lineHeight: '16px', letterSpacing: '0.16em', color: SAGE, fontWeight: 600 }}>
            REGISTRATION NO. <span style={{ fontFamily: 'JetBrains Mono, monospace', color: FOREST, letterSpacing: '0.06em' }}>{cert.regNo}</span>
          </p>
        )}
        <div style={{ width: 120, height: 2, background: FOREST, marginTop: 18 }} />
        <p style={{ marginTop: 18, fontSize: 14, color: CHARCOAL, opacity: 0.8, maxWidth: 560, lineHeight: 1.65 }}>
          has successfully completed every module and module quiz, and passed the proctored final assessment of
        </p>
        <p style={{ fontFamily: 'DM Serif Display, Georgia, serif', marginTop: 8, fontSize: 31, fontWeight: 400, color: FOREST, maxWidth: 600, lineHeight: 1.15 }}>{displayTitle(cert.courseTitle)}</p>
        <div style={{ marginTop: 18, display: 'inline-block', border: `1px solid ${FOREST}`, borderRadius: 999, padding: 5, height: 40, boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
          <span data-shift="-5" style={{ display: 'inline-block', verticalAlign: 'top', height: 28, lineHeight: '28px', padding: '0 12px 0 12px', color: SAGE, fontWeight: 600, letterSpacing: '0.08em', fontSize: 12 }}>FINAL SCORE</span>
          <span style={{ display: 'inline-block', verticalAlign: 'top', height: 28, lineHeight: '28px', background: FOREST, color: IVORY, borderRadius: 999, padding: '0 14px', fontWeight: 700, fontSize: 14 }}><span data-shift="-5">{cert.percentage}%{grade ? ` · ${grade}` : ''}</span></span>
        </div>
      </div>

      {/* Footer row */}
      <div style={{ position: 'absolute', left: 280, right: 170, bottom: 58, display: 'flex', alignItems: 'flex-end', gap: 34 }}>
        <div>
          <p style={{ fontSize: 9, letterSpacing: '0.22em', color: SAGE, fontWeight: 700 }}>DATE OF ISSUE</p>
          <p style={{ fontSize: 14, color: FOREST, fontWeight: 600, marginTop: 3 }}>{cert.issueDate}</p>
        </div>
        <div>
          <p style={{ fontSize: 9, letterSpacing: '0.22em', color: SAGE, fontWeight: 700 }}>CERTIFICATE ID</p>
          <p style={{ fontSize: 13.5, color: FOREST, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', marginTop: 3 }}>{cert.certificateId}</p>
        </div>
        <div style={{ textAlign: 'center', width: 180, marginLeft: 'auto' }}>
          <img src="/ceo-signature.png" alt="" style={{ height: 54, objectFit: 'contain', margin: '0 auto' }} crossOrigin="anonymous" />
          <div style={{ borderTop: `1px solid ${FOREST}`, marginTop: 2 }} />
          <p style={{ fontSize: 9, letterSpacing: '0.22em', color: SAGE, fontWeight: 700, marginTop: 6 }}>LEAD INSTRUCTOR &amp; CEO</p>
        </div>
      </div>

      {/* QR corner */}
      <p style={{ position: 'absolute', left: QR_BOX.x - 18, width: QR_BOX.s + 36, top: QR_BOX.y - 30, fontSize: 8.5, letterSpacing: '0.2em', color: SAGE, fontWeight: 700, textAlign: 'center' }}>SCAN TO VERIFY</p>
      <div style={{ position: 'absolute', left: QR_BOX.x - 8, top: QR_BOX.y - 8, width: QR_BOX.s + 16, height: QR_BOX.s + 16, background: '#FFFFFF', border: `1px solid ${SAGE}66`, borderRadius: 10, padding: 8, boxSizing: 'border-box' }}>
        {qr ? <img src={qr} alt="Verification QR code" style={{ width: QR_BOX.s, height: QR_BOX.s, display: 'block' }} /> : <div style={{ width: QR_BOX.s, height: QR_BOX.s, background: CREAM }} />}
      </div>
      <p style={{ position: 'absolute', right: 34, bottom: 7, fontSize: 8.5, color: CHARCOAL, opacity: 0.55 }}>{verifyUrl}</p>
    </div>
  );
}
