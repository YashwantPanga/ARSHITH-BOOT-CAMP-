import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, ScanFace } from 'lucide-react';
import { loadProctorModels, captureReference, calibrateGaze } from '../../utils/aiProctor';

/**
 * Pre-exam identity check, shown once the camera is on:
 *  1. loads the AI proctoring models (progress bar),
 *  2. captures the student's face as the reference used throughout the exam (identity and eye tracking).
 * onChange({ ready, reference, gaze, idCard }) reports the state to the exam; idCard is always null
 * (the photo-ID name check was removed). The face reference stays on the device.
 */
export default function IdentityCheck({ attachVideo, onChange }) {
  const videoEl = useRef(null);
  const [models, setModels] = useState({ state: 'loading', label: 'Starting', done: 0, total: 6 });
  const [face, setFace] = useState({ state: 'idle', msg: '', thumb: '' });
  const refDesc = useRef(null);
  const gazeBase = useRef(null);

  const load = () => {
    setModels(m => ({ ...m, state: 'loading', error: '' }));
    loadProctorModels((label, done, total) => setModels({ state: 'loading', label, done, total }))
      .then(() => setModels(m => ({ ...m, state: 'ready' })))
      .catch(() => setModels(m => ({ ...m, state: 'error' })));
  };
  useEffect(load, []);

  const setVideo = (el) => { videoEl.current = el; attachVideo(el); };

  const snapshot = () => {
    const v = videoEl.current;
    const c = document.createElement('canvas');
    c.width = 160; c.height = 120;
    const ctx = c.getContext('2d');
    ctx.translate(160, 0); ctx.scale(-1, 1); // match the mirrored preview
    ctx.drawImage(v, 0, 0, 160, 120);
    return c.toDataURL('image/jpeg', 0.7);
  };

  const doFace = async () => {
    setFace({ state: 'busy', msg: 'Look straight at the camera and hold still…', thumb: '' });
    try {
      refDesc.current = await captureReference(videoEl.current);
      // the student is looking at the screen right now: this becomes their "eyes on screen" pose
      gazeBase.current = await calibrateGaze(videoEl.current);
      setFace({ state: 'done', msg: '', thumb: snapshot() });
    } catch (e) {
      refDesc.current = null;
      gazeBase.current = null;
      setFace({ state: 'error', msg: e.message || 'Face capture failed. Try again.', thumb: '' });
    }
  };

  const ready = models.state === 'ready' && face.state === 'done';

  useEffect(() => {
    onChange?.({
      ready,
      reference: face.state === 'done' ? refDesc.current : null,
      gaze: face.state === 'done' ? gazeBase.current : null,
      idCard: null
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, face.state]);

  const Step = ({ n, title, state, children }) => (
    <li className="flex gap-3">
      <span className={`shrink-0 w-7 h-7 rounded-full text-[12px] font-bold flex items-center justify-center ${state === 'done' ? 'bg-mint-400 text-white' : state === 'active' ? 'bg-brand-900 text-ivory' : 'bg-slate-100 text-slate-400'}`}>
        {state === 'done' ? <CheckCircle2 className="w-4 h-4" /> : n}
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <p className={`text-sm font-semibold ${state === 'pending' ? 'text-slate-400' : 'text-brand-900'}`}>{title}</p>
        {children}
      </div>
    </li>
  );

  const pct = Math.round((models.done / models.total) * 100);
  const showHint = (models.state === 'ready' && face.state === 'idle') || face.state === 'error';
  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden">
        <video ref={setVideo} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
        {/* next action, shown on the camera itself */}
        {showHint && (
          <div className="pointer-events-none absolute inset-x-0 top-0 p-2 flex justify-center" aria-live="polite">
            <span className="cta-hint inline-flex items-center gap-1.5 rounded-full bg-black/60 text-white text-[12px] font-semibold px-3 py-1.5">
              <span className="cta-arrow" aria-hidden="true">↓</span>Look at the camera, then press "Capture my face" below
            </span>
          </div>
        )}
        {/* face guide */}
        {face.state !== 'done' && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38%] aspect-[3/4] rounded-[45%] border-2 border-dashed border-white/60" aria-hidden="true" />}
        {face.state === 'busy' && (
          <div className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-xs px-3 py-2 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />{face.msg}</div>
        )}
      </div>

      <ol className="space-y-3">
        <Step n={1} title="Prepare AI proctoring" state={models.state === 'ready' ? 'done' : 'active'}>
          {models.state === 'loading' && (
            <div className="mt-1.5">
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-gradient-to-r from-sage to-forest transition-[width] duration-500" style={{ width: `${Math.max(6, pct)}%` }} /></div>
              <p className="mt-1 text-xs text-slate-500">Loading {models.label.toLowerCase()}… ({pct}%) - first time only, about 40 MB.</p>
            </div>
          )}
          {models.state === 'error' && (
            <p className="mt-1 text-xs text-rose-600">The proctoring models could not load. Check your internet connection. <button type="button" onClick={load} className="underline font-semibold">Try again</button></p>
          )}
          {models.state === 'ready' && <p className="text-xs text-slate-500">Face, identity, eye, phone and hand detection are ready.</p>}
        </Step>

        <Step n={2} title="Capture your face" state={face.state === 'done' ? 'done' : models.state === 'ready' ? 'active' : 'pending'}>
          <p className="text-xs text-slate-500">Centre your face in the outline, in good light, and look at the screen as you will during the exam. If you wear glasses, wear them now. This becomes your reference for identity and eye tracking.</p>
          {face.state === 'error' && <p className="mt-1 text-xs text-rose-600">{face.msg}</p>}
          {face.state === 'done'
            ? <div className="mt-2 flex items-center gap-2">{face.thumb && <img src={face.thumb} alt="Your captured face" className="w-12 h-9 rounded-md object-cover ring-1 ring-mint-300" />}<span className="text-xs text-mint-500 font-semibold">Face captured - you can start the exam</span><button type="button" onClick={doFace} className="ml-auto text-xs underline text-slate-500">Retake</button></div>
            : (
              <div className="mt-2 flex items-center gap-3">
                <button type="button" onClick={doFace} disabled={models.state !== 'ready' || face.state === 'busy'} className={`btn-plum text-sm py-2.5 px-4 ${models.state === 'ready' && face.state !== 'busy' ? 'cta-pulse' : ''}`}><ScanFace className="w-4 h-4" /> {face.state === 'busy' ? 'Capturing…' : face.state === 'error' ? 'Try again' : 'Capture my face'}</button>
                {models.state === 'ready' && face.state !== 'busy' && <span className="cta-nudge text-xs font-semibold text-brand-900">← Press to continue</span>}
                {models.state !== 'ready' && <span className="text-xs text-slate-400">Available once proctoring is ready</span>}
              </div>
            )}
        </Step>
      </ol>
    </div>
  );
}
