import React, { useEffect, useMemo, useState } from 'react';
import { Linkedin, X, Copy, Check, Award, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const CONFETTI = ['#013A2B', '#426557', '#E0B54A', '#BCD1C6', '#0A66C2'];

/**
 * Share a certificate on LinkedIn. While the animation plays, the certificate is rendered and saved
 * on the server, so the verify link's preview shows the certificate picture. LinkedIn only lets a
 * site open its post box (with the text filled in); the learner presses Post there.
 */
export default function LinkedInShare({ cert, verifyUrl, renderCanvas, onClose }) {
  const [phase, setPhase] = useState('preparing'); // preparing | ready
  const [image, setImage] = useState('');
  const [imageSaved, setImageSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = useMemo(() => {
    const tag = String(cert.courseTitle || '').replace(/[^A-Za-z0-9]+/g, '');
    return `I'm happy to share that I've earned my certificate in ${cert.courseTitle} from Arshith Bootcamp${cert.percentage != null ? `, scoring ${cert.percentage}% in the proctored final assessment` : ''}!\n\nVerify it here: ${verifyUrl}\n\n#ArshithBootcamp #Certificate #Learning${tag ? ` #${tag}` : ''}`;
  }, [cert, verifyUrl]);

  const confetti = useMemo(() => Array.from({ length: 34 }, (_, i) => {
    const a = (i / 34) * Math.PI * 2;
    return { x: Math.cos(a) * (120 + Math.random() * 160), y: Math.sin(a) * (90 + Math.random() * 120) - 60, r: Math.round(Math.random() * 540 - 270), c: CONFETTI[i % CONFETTI.length], d: Math.random() * 0.3 };
  }), []);

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    (async () => {
      try {
        const canvas = await renderCanvas();
        const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        if (!alive) return;
        setImage(dataUrl);
        await api.uploadCertificateImage(cert.certificateId, dataUrl);
        if (alive) setImageSaved(true);
      } catch { /* the post still works; LinkedIn then shows the site picture */ }
      // let the animation finish before showing the post
      setTimeout(() => alive && setPhase('ready'), Math.max(0, 2200 - (Date.now() - started)));
    })();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { alive = false; window.removeEventListener('keydown', onKey); };
  }, [cert.certificateId, renderCanvas, onClose]);

  const post = () => window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  const addToProfile = () => window.open(`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.courseTitle)}&organizationName=${encodeURIComponent('Arshith Bootcamp')}&certId=${encodeURIComponent(cert.certificateId)}&certUrl=${encodeURIComponent(verifyUrl)}${cert.issueDate ? `&issueYear=${new Date(cert.issueDate).getFullYear()}&issueMonth=${new Date(cert.issueDate).getMonth() + 1}` : ''}`, '_blank', 'noopener');
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* blocked */ } };
  const initials = String(cert.studentName || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-evergreen/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label="Share on LinkedIn" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[22px] bg-ivory shadow-2xl en-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-20 p-2 rounded-full text-charcoal/50 hover:bg-cream" aria-label="Close"><X className="w-4 h-4" /></button>

        {phase === 'preparing' ? (
          <div className="relative h-[360px] bg-[radial-gradient(120%_90%_at_50%_100%,#0E5C45,#013A2B_70%)] overflow-hidden flex flex-col items-center justify-center text-center px-6">
            <div className="en-rays absolute left-1/2 top-1/2 w-[560px] h-[560px] -ml-[280px] -mt-[280px]" aria-hidden="true" />
            <div className="absolute left-1/2 top-[42%]" aria-hidden="true">
              {confetti.map((p, i) => (
                <span key={i} className="en-confetti absolute w-2 h-1 rounded-sm" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--r': `${p.r}deg`, background: p.c, animationDelay: `${0.9 + p.d}s` }} />
              ))}
            </div>
            {/* certificate card flying into the LinkedIn badge */}
            <div className="relative li-stage">
              <div className="li-cert w-[220px] aspect-[1000/707] rounded-lg bg-ivory ring-4 ring-white/80 shadow-2xl overflow-hidden flex items-center justify-center">
                {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <Award className="w-12 h-12 text-forest" />}
              </div>
              <span className="li-badge absolute -right-6 -bottom-5 w-14 h-14 rounded-2xl bg-[#0A66C2] text-white flex items-center justify-center shadow-xl"><Linkedin className="w-7 h-7" /></span>
            </div>
            <p className="relative mt-10 font-display text-[20px] font-semibold text-ivory">Preparing your LinkedIn post</p>
            <p className="relative mt-1 text-[14px] text-ivory/70 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Adding your certificate picture…</p>
          </div>
        ) : (
          <div className="p-6">
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Share your achievement</p>
            <h2 className="mt-1 text-[22px] font-bold text-evergreen">Your LinkedIn post is ready</h2>

            {/* post preview */}
            <div className="mt-4 rounded-xl border border-brand-900/10 bg-white overflow-hidden">
              <div className="p-3 flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-forest text-ivory text-[12px] font-bold flex items-center justify-center">{initials}</span>
                <span className="text-[13.5px] font-semibold text-charcoal">{cert.studentName}</span>
              </div>
              <p className="px-3 pb-3 text-[13px] text-charcoal/80 whitespace-pre-line line-clamp-5">{text}</p>
              {image && <img src={image} alt="Your certificate" className="w-full border-t border-brand-900/10" />}
            </div>
            {!imageSaved && <p className="mt-2 text-[12px] text-charcoal/55">The picture could not be attached; LinkedIn will show a link preview instead.</p>}

            <div className="mt-5 grid gap-2">
              <button onClick={post} className="font-display h-12 rounded-md bg-[#0A66C2] text-white text-[15.5px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#004182] transition-colors">
                <Linkedin className="w-5 h-5" /> Post on LinkedIn
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={addToProfile} className="font-display h-11 rounded-md border border-forest/25 bg-white text-forest text-[14.5px] font-semibold inline-flex items-center justify-center gap-1.5 hover:border-forest"><ExternalLink className="w-4 h-4" /> Add to profile</button>
                <button onClick={copy} className="font-display h-11 rounded-md border border-forest/25 bg-white text-forest text-[14.5px] font-semibold inline-flex items-center justify-center gap-1.5 hover:border-forest">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{copied ? 'Copied' : 'Copy text'}</button>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-charcoal/55">LinkedIn opens with the text filled in - press <strong>Post</strong> there. "Add to profile" lists the certificate under Licenses &amp; certifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
