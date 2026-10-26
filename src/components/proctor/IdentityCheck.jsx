import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CreditCard, Loader2, ScanFace, ShieldAlert, Upload } from 'lucide-react';
import { loadProctorModels, captureReference, calibrateGaze } from '../../utils/aiProctor';
import { checkIdName, loadOcr } from '../../utils/idCardOcr';

const MAX_ID_TRIES = 3;
const SCAN_SECONDS = 12;               // one scan keeps reading camera frames for up to this long
// The part of the camera frame inside the on-screen card outline (a little generous on each side).
const CARD_CROP = { x: 0.06, y: 0.03, w: 0.88, h: 0.94 };

/**
 * Pre-exam identity check, shown once the camera is on:
 *  1. loads the AI proctoring models (progress bar),
 *  2. captures the student's face as the reference used throughout the exam,
 *  3. reads the student's ID card (camera scan or uploaded photo) and checks that their registered
 *     name is printed on it.
 * After MAX_ID_TRIES unmatched attempts the student may continue; the attempt is flagged for review.
 * onChange({ ready, reference, idCard }) reports the state to the exam.
 * Nothing is uploaded: the face reference and the ID image stay on the device; only results are submitted.
 */
export default function IdentityCheck({ attachVideo, onChange, registeredName }) {
  const videoEl = useRef(null);
  const [models, setModels] = useState({ state: 'loading', label: 'Starting', done: 0, total: 6 });
  const [face, setFace] = useState({ state: 'idle', msg: '', thumb: '' });
  const [idCard, setIdCard] = useState({ state: 'idle', msg: '', tries: 0, result: null });
  const refDesc = useRef(null);
  const gazeBase = useRef(null);
  const [scanTime, setScanTime] = useState(0);
  const [matchFlash, setMatchFlash] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const load = () => {
    setModels(m => ({ ...m, state: 'loading', error: '' }));
    loadProctorModels((label, done, total) => setModels({ state: 'loading', label, done, total }))
      .then(() => setModels(m => ({ ...m, state: 'ready' })))
      .catch(() => setModels(m => ({ ...m, state: 'error' })));
  };
  useEffect(load, []);
  // start the ID text reader straight away, so it is ready by the time the student shows the card
  useEffect(() => { loadOcr().catch(() => {}); }, []);

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
      loadOcr().catch(() => {}); // warm up the text reader for the ID step
    } catch (e) {
      refDesc.current = null;
      gazeBase.current = null;
      setFace({ state: 'error', msg: e.message || 'Face capture failed. Try again.', thumb: '' });
    }
  };

  // Reads the card and looks for the registered name, frame after frame, stopping at the first match.
  // getSource(i) returns the i-th image to read (null when there are no more); crop limits the
  // camera frame to the card outline.
  const runId = async (getSource, busyMsg, { crop = null, seconds = 0 } = {}) => {
    setIdCard(s => ({ ...s, state: 'busy', msg: busyMsg }));
    setScanTime(0);
    const started = performance.now();
    const timer = setInterval(() => alive.current && setScanTime((performance.now() - started) / 1000), 100);
    try {
      let r = null;
      for (let i = 0; !r?.matched && alive.current; i++) {
        if (i > 0 && (!seconds || performance.now() - started > seconds * 1000)) break;
        const src = await getSource(i);
        if (!src) break;
        const next = await checkIdName(src, registeredName, { crop, attempt: i });
        if (!r || next.found > r.found || (next.found === r.found && next.text.length > r.text.length)) r = next;
      }
      if (!alive.current) return;
      if (!r) throw new Error('No image to read.');
      if (r.matched) { setMatchFlash(true); setTimeout(() => alive.current && setMatchFlash(false), 2600); }
      const nothing = r.text.replace(/[^A-Za-z]/g, '').length < 6;
      setIdCard(s => ({
        state: r.matched ? 'done' : 'mismatch',
        tries: s.tries + 1,
        result: r,
        msg: r.matched ? '' : nothing
          ? 'No text could be read from the card. Hold it closer so it fills most of the picture, keep it flat and avoid glare - or upload a clear photo of it.'
          : `Your registered name was not found on the card${r.missing.length ? ` (missing: ${r.missing.join(', ')})` : ''}. Make sure the card shows your full name as registered, then try again.`
      }));
    } catch (e) {
      if (alive.current) setIdCard(s => ({ ...s, state: 'error', stale: !!e.stale, tries: e.stale ? s.tries : s.tries + 1, msg: e.message || 'The card could not be read. Try again.' }));
    } finally {
      clearInterval(timer);
    }
  };
  const scanId = () => runId(async (i) => { if (i) await new Promise(r => setTimeout(r, 120)); return videoEl.current; },
    'Hold your ID card inside the frame, flat and close…', { crop: CARD_CROP, seconds: SCAN_SECONDS });
  const uploadId = (file) => {
    if (!file) return;
    let img = null;
    runId(async (i) => {
      if (i > 1) return null;          // an uploaded photo is read twice: normal and black-and-white
      if (!img) {
        img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();
      }
      return img;
    }, 'Reading the name on your ID photo…', { seconds: 30 });
  };
  const scanning = idCard.state === 'busy';

  const idTries = idCard.tries;
  const canSkipId = idTries >= MAX_ID_TRIES && idCard.state !== 'done';
  const [skipped, setSkipped] = useState(false);
  const ready = models.state === 'ready' && face.state === 'done' && (idCard.state === 'done' || skipped);

  useEffect(() => {
    onChange?.({
      ready,
      reference: face.state === 'done' ? refDesc.current : null,
      gaze: face.state === 'done' ? gazeBase.current : null,
      idCard: { method: 'name', checked: idCard.state === 'done' || skipped, matched: idCard.state === 'done', percent: idCard.result?.percent ?? null, attempts: idTries, flaggedForReview: skipped }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, face.state, idCard.state, skipped, idTries]);

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
  return (
    <div className="space-y-4">
      <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden">
        <video ref={setVideo} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
        {/* face guide */}
        {face.state !== 'done' && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38%] aspect-[3/4] rounded-[45%] border-2 border-dashed border-white/60" aria-hidden="true" />}
        {face.state === 'done' && ((idCard.state !== 'done' && !skipped) || matchFlash) && (
          <div className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] max-h-[86%] aspect-[1.586] rounded-xl ${matchFlash ? 'id-frame-ok' : scanning ? 'id-frame-scan' : 'border-2 border-dashed border-white/60'}`} aria-hidden="true">
            {!matchFlash && <span className="absolute -top-5 left-0 text-[10px] font-semibold text-white/85">{scanning ? 'Scanning - hold still' : 'Fit your ID card here'}</span>}
            {(scanning || matchFlash) && <><i className="id-corner tl" /><i className="id-corner tr" /><i className="id-corner bl" /><i className="id-corner br" /></>}
            {scanning && <span className="absolute inset-0 overflow-hidden rounded-xl"><span className="id-scan-glow" /><span className="id-scan-line" /></span>}
            {matchFlash && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="id-ok-badge flex items-center gap-1.5 rounded-full bg-white text-forest text-sm font-bold px-4 py-2 shadow-lg"><CheckCircle2 className="w-5 h-5 text-mint-400" /> Name matched</span>
              </span>
            )}
          </div>
        )}
        {(face.state === 'busy' || idCard.state === 'busy') && (
          <div className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-xs px-3 py-2 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />{face.state === 'busy' ? face.msg : idCard.msg}{scanning && <span className="ml-auto tabular-nums text-white/70">{scanTime.toFixed(1)}s</span>}</div>
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
            ? <div className="mt-2 flex items-center gap-2">{face.thumb && <img src={face.thumb} alt="Your captured face" className="w-12 h-9 rounded-md object-cover ring-1 ring-mint-300" />}<span className="text-xs text-mint-500 font-semibold">Face captured</span><button type="button" onClick={doFace} className="ml-auto text-xs underline text-slate-500">Retake</button></div>
            : <button type="button" onClick={doFace} disabled={models.state !== 'ready' || face.state === 'busy'} className="btn-plum mt-2 text-sm py-2 px-3"><ScanFace className="w-4 h-4" /> {face.state === 'busy' ? 'Capturing…' : 'Capture my face'}</button>}
        </Step>

        <Step n={3} title="Verify the name on your ID" state={idCard.state === 'done' || skipped ? 'done' : face.state === 'done' ? 'active' : 'pending'}>
          <p className="text-xs text-slate-500">Show a photo ID (college ID, Aadhaar, passport, licence). The name on it must match your registered name: <strong className="text-brand-900">{registeredName}</strong>.</p>
          {(idCard.state === 'mismatch' || idCard.state === 'error') && !skipped && <p className="mt-1 text-xs text-rose-600">{idCard.msg}</p>}
          {idCard.state === 'error' && idCard.stale && <button type="button" onClick={() => window.location.reload()} className="btn-plum mt-2 text-sm py-2 px-3">Reload page</button>}
          {idCard.state === 'done' && <p className="mt-1 text-xs text-mint-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Name verified on your ID</p>}
          {skipped && <p className="mt-1 text-xs text-amber-700 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Continuing without a name match - this attempt will be reviewed.</p>}
          {idCard.state !== 'done' && !skipped && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={scanId} disabled={face.state !== 'done' || idCard.state === 'busy'} className="btn-plum text-sm py-2 px-3"><CreditCard className="w-4 h-4" /> {idCard.state === 'busy' ? 'Reading…' : idTries ? 'Scan again' : 'Scan my ID'}</button>
              <label className={`btn-outline text-sm py-2 px-3 ${face.state !== 'done' || idCard.state === 'busy' ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                <Upload className="w-4 h-4" /> Upload ID photo
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { uploadId(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {canSkipId && <button type="button" onClick={() => setSkipped(true)} className="btn-outline text-sm py-2 px-3">Continue and flag for review</button>}
            </div>
          )}
          {idTries > 0 && idCard.state !== 'done' && !skipped && <p className="mt-1 text-[11px] text-slate-400">Attempt {idTries} of {MAX_ID_TRIES}{canSkipId ? '' : ` - after ${MAX_ID_TRIES} attempts you can continue and be reviewed`}</p>}
        </Step>
      </ol>
    </div>
  );
}
