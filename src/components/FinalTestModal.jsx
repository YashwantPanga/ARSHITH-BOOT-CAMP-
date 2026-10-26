import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, Clock, ShieldCheck, Camera, Maximize, AlertTriangle, CheckCircle2, XCircle, Lock, Award,
  ArrowLeft, ArrowRight, RefreshCw, Eye, MonitorX, Copy, Ban, Video, Users, Smartphone, UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { examGuard } from '../router';
import { userIdOf, displayNameOf } from '../utils/session';
import { cleanText, displayTitle } from '../utils/textUtils';
import { QuestionCard } from './ModuleQuizModal';
import { Spinner } from './ui';
import IdentityCheck from './proctor/IdentityCheck';
import { analyzeFrame, handNearFace, matchPercent, gazeState } from '../utils/aiProctor';
import CertificateCelebration from './CertificateCelebration';

const MAX_VIOLATIONS = 3;
const PASS = 70;

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * Proctored final assessment.
 *  - Unlocks only after every module quiz is passed (also enforced by the API).
 *  - Requires camera + full screen. Tab switches, leaving the window, exiting full screen,
 *    covering/turning off the camera, and pressing Back are violations.
 *  - The 3rd violation ends the exam automatically and it is recorded as a fail.
 *  - Copy / paste / right-click / dev-tools shortcuts are blocked.
 *  - AI proctoring (in the browser, nothing uploaded): before the exam the student's face is captured
 *    and the name on their photo ID is matched with the registered name; during the exam extra people, a different person, a phone or a
 *    missing face become violations after a short grace period, and hands near the face are flagged.
 *    Detections are shown live on screen as they happen.
 */
export default function FinalTestModal({ isOpen, onClose, course, studentUser, locked, projectReq, passedFinal, onSubmitted, onViewCertificate }) {
  const [phase, setPhase] = useState('intro');
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(45 * 60);
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [agree, setAgree] = useState(false);
  const [camState, setCamState] = useState('idle'); // idle | asking | ok | denied | unsupported
  const [violations, setViolations] = useState([]);
  const [warning, setWarning] = useState(null);
  const [notice, setNotice] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [lockInfo, setLockInfo] = useState(null);
  const [identity, setIdentity] = useState({ ready: false, reference: null, gaze: null, idCard: null });
  const [liveAlert, setLiveAlert] = useState(null); // condition currently on camera { type, message, strike }

  const streamRef = useRef(null);
  const phaseRef = useRef(phase);
  const violationsRef = useRef([]);
  const lastViolationAt = useRef(0);
  const endAtRef = useRef(0);
  const answersRef = useRef({});
  const sessionRef = useRef(null);
  const submittingRef = useRef(false);
  const noticeTimer = useRef(null);
  const identityRef = useRef(identity);
  const flagsRef = useRef([]);                      // cautions that are not strikes (hand near face)
  const statsRef = useRef({ checks: 0, matched: 0, mismatched: 0, sum: 0 });
  identityRef.current = identity;

  phaseRef.current = phase;
  answersRef.current = answers;
  sessionRef.current = session;

  const userId = userIdOf(studentUser);
  const studentName = displayNameOf(studentUser);

  /* ---------------- camera ---------------- */
  const attachVideo = useCallback((el) => {
    if (el && streamRef.current && el.srcObject !== streamRef.current) {
      el.srcObject = streamRef.current;
      el.play?.().catch(() => {});
    }
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const enableCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCamState('unsupported'); return; }
    setCamState('asking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      setCamState('ok');
    } catch {
      setCamState('denied');
    }
  };

  /* ---------------- open / close lifecycle ---------------- */
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setResult(null);
    setConfirmOpen(false);
    setWarning(null);
    setViolations([]);
    violationsRef.current = [];
    flagsRef.current = [];
    statsRef.current = { checks: 0, matched: 0, mismatched: 0, sum: 0 };
    setIdentity({ ready: false, reference: null, gaze: null, idCard: null });
    setLiveAlert(null);
    setAgree(false);
    setLockInfo(null);
    if (passedFinal) setPhase('passed');
    else if (locked) setPhase('locked');
    else setPhase('intro');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      stopCamera();
      setCamState('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const flashNotice = (msg) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 2600);
  };

  /* ---------------- submit ---------------- */
  const exitFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  const executeSubmit = useCallback(async ({ auto = false, terminated = false } = {}) => {
    if (submittingRef.current || !sessionRef.current) return;
    submittingRef.current = true;
    setConfirmOpen(false);
    setWarning(null);
    setPhase('submitting');
    try {
      const res = await api.submitFinalTest({
        userId,
        studentName,
        courseId: course.id,
        sessionId: sessionRef.current.sessionId,
        answers: answersRef.current,
        proctoring: {
          terminated,
          autoSubmitted: auto,
          cameraVerified: true,
          violations: violationsRef.current,
          flags: flagsRef.current.slice(0, 50),
          identity: {
            faceCaptured: !!identityRef.current.reference,
            idCard: identityRef.current.idCard,
            liveChecks: statsRef.current.checks,
            mismatchedChecks: statsRef.current.mismatched,
            averageMatch: statsRef.current.matched ? Math.round(statsRef.current.sum / statsRef.current.matched) : null
          }
        }
      });
      try { localStorage.removeItem(`arb_final_${sessionRef.current.sessionId}`); } catch { /* ignore */ }
      exitFullscreen();
      stopCamera();
      setResult({ ...res.result, terminated });
      setPhase('result');
      onSubmitted?.(res.result);
    } catch (err) {
      setError(err.message || 'Submission failed. Check your connection and try again.');
      setPhase('submit-error');
    } finally {
      submittingRef.current = false;
    }
  }, [course.id, userId, studentName, onSubmitted]);

  /* ---------------- violations ---------------- */
  // Tells the server about a warning / flag right away so the admin panel updates during the exam.
  const reportLive = useCallback((event) => {
    const sid = sessionRef.current?.sessionId;
    if (!sid) return;
    api.reportProctorEvent({ userId, courseId: course.id, sessionId: sid, event }).catch(() => {});
  }, [userId, course.id]);

  const addViolation = useCallback((type, message, { debounce = true } = {}) => {
    if (phaseRef.current !== 'taking') return;
    const now = Date.now();
    if (debounce && now - lastViolationAt.current < 2500) return; // one action often fires blur + visibility + fullscreen together
    if (debounce) lastViolationAt.current = now;
    const v = { type, message, at: new Date().toISOString() };
    violationsRef.current = [...violationsRef.current, v];
    reportLive({ type, message, strike: true });
    setViolations(violationsRef.current);
    if (violationsRef.current.length >= MAX_VIOLATIONS) {
      executeSubmit({ terminated: true });
    } else {
      setWarning(v);
    }
  }, [executeSubmit, reportLive]);

  /* ---------------- proctoring monitors (only while taking) ---------------- */
  useEffect(() => {
    if (phase !== 'taking') return undefined;

    examGuard.active = true;
    const here = window.location.href;
    window.history.pushState({ exam: true }, '', here);

    const onPop = () => {
      window.history.pushState({ exam: true }, '', here);
      addViolation('NAVIGATION', 'You tried to leave the exam using the Back button.');
    };
    const onVisibility = () => { if (document.hidden) addViolation('TAB_SWITCH', 'You switched tabs or minimised the window.'); };
    const onBlur = () => addViolation('WINDOW_BLUR', 'The exam window lost focus (another app or window was opened).');
    const onFs = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) addViolation('FULLSCREEN_EXIT', 'You exited full-screen mode.');
    };
    const block = (label) => (e) => { e.preventDefault(); flashNotice(`${label} is disabled during the exam.`); };
    const onCopy = block('Copying');
    const onPaste = block('Pasting');
    const onCut = block('Cutting');
    const onContext = block('Right-click');
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if ((mod && ['c', 'v', 'x', 'a', 'p', 's', 'u'].includes(k)) || k === 'f12' || (mod && e.shiftKey && ['i', 'j', 'c'].includes(k)) || k === 'printscreen') {
        e.preventDefault();
        flashNotice('That shortcut is disabled during the exam.');
      }
    };
    const onUnload = (e) => { e.preventDefault(); e.returnValue = ''; };

    window.addEventListener('popstate', onPop);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('beforeunload', onUnload);

    // Camera health: track ended, or the lens is covered (very dark / flat frames).
    const track = streamRef.current?.getVideoTracks?.()[0];
    const onEnded = () => addViolation('CAMERA_OFF', 'Your camera was turned off or disconnected.');
    track?.addEventListener('ended', onEnded);

    const canvas = document.createElement('canvas');
    canvas.width = 48; canvas.height = 36;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const probe = document.createElement('video');
    probe.muted = true; probe.playsInline = true;
    if (streamRef.current) { probe.srcObject = streamRef.current; probe.play().catch(() => {}); }
    let darkStreak = 0;
    const camTimer = setInterval(() => {
      if (!ctx || !probe.videoWidth) return;
      try {
        ctx.drawImage(probe, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let sum = 0, sumSq = 0;
        const n = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          sum += l; sumSq += l * l;
        }
        const mean = sum / n;
        const sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
        darkStreak = (mean < 16 || sd < 4) ? darkStreak + 1 : 0;
        if (darkStreak === 2) addViolation('CAMERA_BLOCKED', 'Your camera appears to be covered or blocked.');
        if (darkStreak > 6) darkStreak = 0;
      } catch { /* frame not ready */ }
    }, 3000);

    // AI proctoring loop (about 2-3 checks a second; nothing is shown to the student except warnings).
    // A condition becomes a warning when it was seen in at least 75% of the checks during its hold time,
    // so one bad frame never counts but a real problem is caught within a second or two. After a warning
    // the same condition waits RULE_COOLDOWN before it can count again.
    const RULES = {
      PHONE_DETECTED: { hold: 1200, strike: true, msg: 'A mobile phone was detected on camera.' },
      MULTIPLE_FACES: { hold: 1500, strike: true, msg: 'More than one person is in front of the camera.' },
      IDENTITY_MISMATCH: { hold: 3000, strike: true, msg: 'The person on camera does not match the face captured before the exam.' },
      LOOKING_DOWN: { hold: 2500, strike: true, msg: 'You are looking down, away from the screen.' },
      LOOKING_AWAY: { hold: 3000, strike: true, msg: 'You are looking away from the screen.' },
      NO_FACE: { hold: 3000, strike: true, msg: 'Your face was not visible on camera.' },
      HAND_NEAR_FACE: { hold: 3000, strike: false, msg: 'A hand is covering or near your face.' }
    };
    const RULE_COOLDOWN = 15000;
    const IDENTITY_EVERY = 1500;   // the face-identity model is heavier, so it runs every 1.5 s
    const history = {};
    const lastStrike = {};
    let lastIdentityAt = 0;
    let identity = { faces: 0, same: null, at: 0 };
    let objects = { phones: 0, people: 0, at: 0 }; // phone/person detection runs on every other check
    let tick = 0;
    let alive = true;
    // identity gallery: starts with the captured face and learns confident new views (glasses on/off)
    const gallery = identityRef.current.reference ? [identityRef.current.reference] : null;
    const loop = async () => {
      if (!alive) return;
      const t0 = performance.now();
      try {
        if (probe.videoWidth && !document.hidden) {
          const doIdentity = !!gallery && Date.now() - lastIdentityAt >= IDENTITY_EVERY;
          const doObjects = tick++ % 2 === 0 || objects.phones > 0 || objects.people > 1;
          const r = await analyzeFrame(probe, gallery, { identity: doIdentity, objects: doObjects });
          if (!alive) return;
          const now = Date.now();
          if (doObjects) objects = { phones: r.phones.length, people: r.people, at: now };
          if (doIdentity) {
            lastIdentityAt = now;
            const f = r.faces[0];
            identity = { faces: r.faces.length, same: r.faces.length === 1 ? f.same : null, at: now };
            const st = statsRef.current;
            if (r.faces.length === 1 && f.distance != null) {
              st.checks += 1;
              if (f.same) { st.matched += 1; st.sum += matchPercent(f.distance); } else st.mismatched += 1;
            }
          }
          const gz = gazeState(r.gaze, identityRef.current.gaze);
          const faceBox = r.meshBoxes[0] || r.faces[0]?.box;
          const facesSeen = Math.max(r.meshFaces, doIdentity ? r.faces.length : 0);
          const active = {
            PHONE_DETECTED: objects.phones > 0,
            MULTIPLE_FACES: facesSeen > 1 || objects.people > 1,
            IDENTITY_MISMATCH: now - identity.at < IDENTITY_EVERY * 2 && identity.faces === 1 && identity.same === false,
            LOOKING_DOWN: r.meshFaces > 0 && !!gz?.down,
            LOOKING_AWAY: r.meshFaces > 0 && !!gz?.away && !gz?.down,
            NO_FACE: facesSeen === 0 && objects.people === 0,
            HAND_NEAR_FACE: !!faceBox && r.hands.some(h => handNearFace(h, faceBox))
          };
          let shown = null;
          for (const [type, on] of Object.entries(active)) {
            const rule = RULES[type];
            const h = (history[type] ||= []);
            h.push({ t: now, on });
            while (h.length && now - h[0].t > rule.hold) h.shift();
            const ratio = h.filter(x => x.on).length / h.length;
            if (on && ratio >= 0.5 && !shown) shown = { type, message: rule.msg, strike: rule.strike };
            const span = now - h[0].t;
            if (on && span >= rule.hold * 0.8 && ratio >= 0.75 && now - (lastStrike[type] || 0) > RULE_COOLDOWN) {
              lastStrike[type] = now;
              h.length = 0;
              if (rule.strike) addViolation(type, rule.msg, { debounce: false });
              else { flagsRef.current = [...flagsRef.current, { type, message: rule.msg, at: new Date().toISOString() }]; reportLive({ type, message: rule.msg, strike: false }); }
            }
          }
          setLiveAlert(shown);
        }
      } catch { /* a frame failed - try the next one */ }
      if (alive) setTimeout(loop, Math.max(60, 400 - (performance.now() - t0)));
    };
    setTimeout(loop, 500);

    return () => {
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onContext);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('beforeunload', onUnload);
      track?.removeEventListener('ended', onEnded);
      clearInterval(camTimer);
      alive = false;
      setLiveAlert(null);
      probe.srcObject = null;
      // Drop the history entry we pushed, then release the Back-button guard.
      const release = () => { examGuard.active = false; window.removeEventListener('popstate', release); };
      window.addEventListener('popstate', release);
      window.history.back();
      setTimeout(release, 600);
    };
  }, [phase, addViolation, reportLive]);

  /* ---------------- timer ---------------- */
  useEffect(() => {
    if (phase !== 'taking') return undefined;
    const t = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        executeSubmit({ auto: true });
      }
    }, 500);
    return () => clearInterval(t);
  }, [phase, executeSubmit]);

  /* ---------------- start ---------------- */
  const start = async () => {
    setError('');
    if (!document.documentElement.requestFullscreen) {
      setError('This browser does not support full-screen exams. Please use Chrome, Edge or Firefox on a laptop or desktop.');
      return;
    }
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      setError('Full-screen mode is required. Please allow full screen and try again.');
      return;
    }
    setIsFullscreen(!!document.fullscreenElement);
    setPhase('starting');
    try {
      const res = await api.startFinalTest({ userId, studentName, courseId: course.id });
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(`arb_final_${res.sessionId}`) || '{}'); } catch { saved = {}; }
      setSession({ sessionId: res.sessionId, paper: res.assignedPaper, total: res.totalQuestions });
      setQuestions(res.questions);
      setAnswers(saved);
      setIdx(0);
      endAtRef.current = Date.now() + res.remainingSeconds * 1000;
      setRemaining(res.remainingSeconds);
      violationsRef.current = [];
      setViolations([]);
      lastViolationAt.current = Date.now();
      setPhase('taking');
    } catch (err) {
      exitFullscreen();
      if (err.status === 403 && err.data?.locked) { setLockInfo(err.data); setPhase('locked'); return; }
      if (err.status === 409 && err.data?.alreadyPassed) { setResult(err.data.result); setPhase('passed'); onSubmitted?.(); return; }
      setError(err.message || 'Could not start the assessment.');
      setPhase('intro');
    }
  };

  const choose = (qid, i) => {
    setAnswers(prev => {
      const next = { ...prev, [qid]: i };
      try { localStorage.setItem(`arb_final_${sessionRef.current?.sessionId}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const resumeFullscreen = async () => {
    try { await document.documentElement.requestFullscreen(); setIsFullscreen(true); } catch { /* user must click again */ }
    setWarning(null);
  };

  if (!isOpen) return null;

  const total = questions.length;
  const answered = questions.filter(q => answers[q.id] !== undefined).length;
  const q = questions[idx];
  const canClose = !['taking', 'starting', 'submitting'].includes(phase);

  /* ---------------- layout ---------------- */
  return (
    <div className={`fixed inset-0 z-[110] bg-white flex flex-col ${phase === 'taking' ? 'no-select' : ''}`}>
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6 bg-white">
        <span className="w-10 h-10 rounded-xl bg-brand-900 text-peach-400 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Proctored final assessment</p>
          <p className="text-sm font-semibold text-brand-900 truncate">{displayTitle(course.title)}</p>
        </div>
        {phase === 'taking' && (
          <>
            <div className="hidden md:flex items-center gap-1.5 chip bg-brand-50 text-brand-900" title="Camera, identity, eye, phone and hand checks are running">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> AI proctoring on
            </div>
            <div className={`hidden sm:flex items-center gap-1.5 chip ${violations.length ? 'bg-rose-50 text-rose-600' : 'bg-mint-50 text-mint-500'}`}>
              <Eye className="w-3.5 h-3.5" /> {violations.length}/{MAX_VIOLATIONS} warnings
            </div>
            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-mono font-semibold text-sm ${remaining < 300 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-brand-50 text-brand-900'}`}>
              <Clock className="w-4 h-4" />{fmt(remaining)}
            </div>
          </>
        )}
        {canClose && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5 text-slate-500" /></button>
        )}
      </header>

      {phase === 'taking' && liveAlert && (
        <div role="status" className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[116] max-w-[92vw] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl text-sm font-semibold animate-fade-up ${liveAlert.strike ? 'bg-rose-600 text-white' : 'bg-amber-400 text-amber-950'}`}>
          <span className="relative flex w-2.5 h-2.5"><span className="absolute inset-0 rounded-full bg-white/80 animate-ping" /><span className="relative w-2.5 h-2.5 rounded-full bg-white" /></span>
          <span>{liveAlert.message} {liveAlert.strike ? 'Fix this now or it will count as a warning.' : 'This is being recorded for review.'}</span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-white">
        {phase === 'locked' && (
          <Centered>
            <span className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto"><Lock className="w-8 h-8" /></span>
            <h2 className="mt-5 text-2xl font-bold text-brand-900">Final assessment is locked</h2>
            <p className="mt-2 text-slate-500">To unlock the final assessment, complete every module quiz and submit a GitHub repository for any one course project.</p>
            <ul className="mt-4 text-sm text-slate-600 space-y-1 text-left inline-block">
              <li>Module quizzes passed: <strong>{lockInfo?.passedModules ?? (course.modules || []).filter(m => m.completed).length} / {lockInfo?.totalModules ?? (course.modules || []).length}</strong></li>
              {(lockInfo?.projects || projectReq)?.required > 0 && <li>Project repository submitted (any one project): <strong>{Math.min((lockInfo?.projects || projectReq).submitted, (lockInfo?.projects || projectReq).required)} / {(lockInfo?.projects || projectReq).required}</strong></li>}
            </ul>
            <button onClick={onClose} className="btn-primary mt-7">Continue learning</button>
          </Centered>
        )}

        {phase === 'passed' && (
          <Centered>
            <span className="w-16 h-16 rounded-2xl bg-mint-50 text-mint-400 flex items-center justify-center mx-auto"><Award className="w-8 h-8" /></span>
            <h2 className="mt-5 text-2xl font-bold text-brand-900">You've passed this assessment</h2>
            <p className="mt-2 text-slate-500">Your score: <strong className="text-brand-900">{(passedFinal || result)?.percentage}%</strong>. Your certificate shows this exact score.</p>
            <button onClick={onViewCertificate} className="btn-plum mt-7"><Award className="w-4 h-4" /> View certificate</button>
          </Centered>
        )}

        {phase === 'intro' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-5 gap-8 animate-fade-up">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-brand-900">Before you begin</h2>
                <p className="text-slate-500 mt-1">{course.finalTest?.totalQuestions || 25} questions · 45 minutes · pass mark {PASS}% · paper assigned by your name</p>
              </div>
              <ul className="space-y-3">
                {[
                  [Maximize, 'Stay in full screen', 'The exam runs in full screen. Pressing Esc or leaving full screen counts as a warning.'],
                  [MonitorX, 'Do not switch tabs or apps', 'Switching tabs, minimising, or clicking another window counts as a warning.'],
                  [Video, 'Keep your camera on', 'Your face must stay visible. Covering or turning off the camera counts as a warning.'],
                  [UserCheck, 'Identity is checked all the time', 'Before you start, your face is captured and the name on your photo ID must match your registered name. The person on camera is compared with your captured face throughout the exam.'],
                  [Users, 'Only you in the frame', 'Another person on camera counts as a warning.'],
                  [Smartphone, 'No phone', 'A mobile phone seen on camera counts as a warning. Hands covering your face are flagged for review.'],
                  [Eye, 'Keep your eyes on the screen', 'Eye tracking is on. Looking down or away from the screen for more than a few seconds counts as a warning.'],
                  [Copy, 'No copy, paste or right-click', 'Clipboard, right-click and developer-tool shortcuts are disabled.'],
                  [Ban, `${MAX_VIOLATIONS} warnings end the exam`, `On the ${MAX_VIOLATIONS}rd warning the exam is submitted automatically and recorded as not passed.`],
                  [Clock, 'Timer cannot be paused', 'The clock runs on the server. When time is up your answers are submitted automatically.']
                ].map(([Icon, t, d]) => (
                  <li key={t} className="flex gap-3 p-4 rounded-2xl border border-slate-200">
                    <Icon className="w-5 h-5 text-peach-500 shrink-0 mt-0.5" />
                    <div><p className="text-sm font-semibold text-brand-900">{t}</p><p className="text-sm text-slate-500">{d}</p></div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="card p-5">
                <p className="text-sm font-semibold text-brand-900 flex items-center gap-2"><Camera className="w-4 h-4 text-peach-500" /> Camera & identity check</p>
                {camState === 'ok'
                  ? <div className="mt-3"><IdentityCheck attachVideo={attachVideo} onChange={setIdentity} registeredName={studentName} /></div>
                  : <div className="mt-3 aspect-video rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center"><Camera className="w-8 h-8 text-slate-600" /></div>}
                {camState !== 'ok' && (
                  <button onClick={enableCamera} disabled={camState === 'asking'} className="btn-plum w-full mt-3">
                    {camState === 'asking' ? 'Waiting for permission…' : 'Enable camera'}
                  </button>
                )}
                {camState === 'denied' && <p className="mt-2 text-xs text-rose-600">Camera access was blocked. Allow camera access for this site in your browser's address bar, then try again.</p>}
                {camState === 'unsupported' && <p className="mt-2 text-xs text-rose-600">This browser can't access a camera. Use a recent Chrome, Edge or Firefox on a device with a webcam.</p>}
              </div>

              <div className="card p-5 space-y-3">
                <p className="text-sm text-slate-500">Candidate</p>
                <p className="font-semibold text-brand-900 -mt-2">{studentName}</p>
                <label className="flex gap-3 items-start text-sm text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 w-4 h-4 accent-[#426557]" />
                  I have read the rules and I agree to be proctored during this assessment.
                </label>
                {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</p>}
                {camState === 'ok' && !identity.ready && <p className="text-xs text-slate-500">Finish the identity check above to start.</p>}
                <button onClick={start} disabled={camState !== 'ok' || !identity.ready || !agree} className="btn-primary w-full py-3.5">
                  <Maximize className="w-4 h-4" /> Start proctored exam
                </button>
              </div>
            </div>
          </div>
        )}

        {(phase === 'starting' || phase === 'submitting') && (
          <Centered>
            <Spinner className="w-10 h-10 mx-auto" />
            <p className="mt-4 text-slate-500">{phase === 'starting' ? 'Preparing your question paper…' : 'Submitting and grading your answers…'}</p>
          </Centered>
        )}

        {phase === 'submit-error' && (
          <Centered>
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="mt-3 text-slate-600">{error}</p>
            <button onClick={() => executeSubmit({})} className="btn-primary mt-5"><RefreshCw className="w-4 h-4" /> Retry submission</button>
          </Centered>
        )}

        {phase === 'taking' && q && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div key={q.id} className="animate-fade-in">
                <QuestionCard q={q} index={idx} total={total} selected={answers[q.id]} onSelect={(i) => choose(q.id, i)} />
              </div>
              <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-slate-100">
                <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="btn-outline"><ArrowLeft className="w-4 h-4" /> Previous</button>
                {idx < total - 1
                  ? <button onClick={() => setIdx(i => i + 1)} className="btn-plum">Next <ArrowRight className="w-4 h-4" /></button>
                  : <button onClick={() => setConfirmOpen(true)} className="btn-primary">Finish &amp; submit</button>}
              </div>
            </div>
            <aside className="lg:col-span-4">
              <div className="card p-5 lg:sticky lg:top-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-brand-900">Question navigator</span>
                  <span className="text-slate-500">{answered}/{total}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((qq, i) => (
                    <button key={qq.id} onClick={() => setIdx(i)}
                      className={`h-10 rounded-xl text-sm font-semibold transition ${i === idx ? 'bg-peach-500 text-white ring-4 ring-peach-100' : answers[qq.id] !== undefined ? 'bg-brand-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-900" />Answered</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200" />Not answered</span>
                </div>
                {session?.paper && <p className="text-xs text-slate-400">Paper {session.paper.paperCode}</p>}
                <button onClick={() => setConfirmOpen(true)} className="btn-primary w-full">Submit assessment</button>
              </div>
            </aside>
          </div>
        )}

        {phase === 'result' && result && (
          <Centered wide>
            {result.passed ? (
              <CertificateCelebration name={studentName} courseTitle={displayTitle(course.title)} percentage={result.percentage} />
            ) : (
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-rose-50 text-rose-500">
                <XCircle className="w-10 h-10" />
              </div>
            )}
            <h2 className="mt-5 text-3xl font-bold text-brand-900">{result.passed ? 'Congratulations, you passed!' : result.terminated ? 'Exam ended by proctoring' : 'Not passed this time'}</h2>
            <p className="mt-2 text-slate-500">
              {result.passed ? 'Your certificate is ready and will show exactly this score.'
                : result.terminated ? `The exam was stopped after ${MAX_VIOLATIONS} proctoring warnings and is recorded as not passed.`
                : `You need ${PASS}% or more to earn the certificate. Review the modules and try again.`}
            </p>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <ResultStat label="Percentage" value={`${result.percentage}%`} tone={result.passed ? 'text-mint-500' : 'text-rose-500'} />
              <ResultStat label="Score" value={`${result.score}/${result.totalQuestions}`} />
              <ResultStat label="Time taken" value={result.timeTakenFormatted?.replace(' minutes', 'm').replace(' minute', 'm').replace(' seconds', 's').replace(' second', 's') || '—'} />
              <ResultStat label="Warnings" value={`${result.proctorViolations ?? violations.length}/${MAX_VIOLATIONS}`} />
            </div>
            {!result.passed && result.attemptsLeft !== undefined && (
              <p className={`mt-6 text-sm font-semibold ${result.attemptsLeft > 0 ? 'text-brand-900' : 'text-rose-600'}`}>
                {result.attemptsLeft > 0 ? `You have ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} left.` : 'You have used both attempts at this final assessment.'}
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {result.passed
                ? <button onClick={onViewCertificate} className="btn-plum"><Award className="w-4 h-4" /> Get my certificate</button>
                : result.attemptsLeft === 0
                  ? <button onClick={onClose} className="btn-outline">Close</button>
                  : <button onClick={() => { setPhase('intro'); setAgree(false); setCamState('idle'); }} className="btn-primary"><RefreshCw className="w-4 h-4" /> Retake assessment</button>}
            </div>
          </Centered>
        )}

      </div>

      {/* Toast-style notice for blocked actions */}
      {notice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] bg-brand-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl animate-fade-up">{notice}</div>
      )}

      {/* Full-screen required overlay */}
      {phase === 'taking' && !isFullscreen && !warning && (
        <Overlay>
          <Maximize className="w-10 h-10 text-peach-500 mx-auto" />
          <h3 className="mt-4 text-xl font-bold text-brand-900">Return to full screen</h3>
          <p className="mt-2 text-sm text-slate-500">The exam can only continue in full-screen mode.</p>
          <button onClick={resumeFullscreen} className="btn-primary mt-6 w-full">Enter full screen</button>
        </Overlay>
      )}

      {/* Violation warning */}
      {warning && phase === 'taking' && (
        <Overlay>
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="mt-4 text-xl font-bold text-brand-900">Warning {violations.length} of {MAX_VIOLATIONS}</h3>
          <p className="mt-2 text-sm text-slate-600">{warning.message}</p>
          <p className="mt-2 text-xs text-rose-600">{MAX_VIOLATIONS - violations.length} more warning{MAX_VIOLATIONS - violations.length !== 1 ? 's' : ''} will end your exam automatically.</p>
          <button onClick={isFullscreen ? () => setWarning(null) : resumeFullscreen} className="btn-primary mt-6 w-full">
            {isFullscreen ? 'I understand, continue' : 'Return to full screen & continue'}
          </button>
        </Overlay>
      )}

      {/* Submit confirmation */}
      {confirmOpen && phase === 'taking' && (
        <Overlay>
          <h3 className="text-xl font-bold text-brand-900">Submit your assessment?</h3>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <ResultStat label="Answered" value={answered} />
            <ResultStat label="Unanswered" value={total - answered} tone={total - answered ? 'text-rose-500' : 'text-brand-900'} />
            <ResultStat label="Time left" value={fmt(remaining)} />
          </div>
          {total - answered > 0 && <p className="mt-3 text-xs text-rose-600">Unanswered questions are marked wrong.</p>}
          <div className="mt-6 flex gap-2">
            <button onClick={() => setConfirmOpen(false)} className="btn-outline flex-1">Keep working</button>
            <button onClick={() => executeSubmit({})} className="btn-primary flex-1">Submit</button>
          </div>
        </Overlay>
      )}
    </div>
  );
}

const Centered = ({ children, wide = false }) => (
  <div className={`${wide ? 'max-w-3xl' : 'max-w-md'} mx-auto px-6 py-16 sm:py-24 text-center animate-fade-up`}>{children}</div>
);

const Overlay = ({ children }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-sm animate-fade-in">
    <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full text-center animate-scale-in">{children}</div>
  </div>
);

const ResultStat = ({ label, value, tone = 'text-brand-900' }) => (
  <div className="rounded-2xl bg-slate-50 p-3">
    <p className="text-[11px] text-slate-400">{label}</p>
    <p className={`text-lg font-bold ${tone}`}>{value}</p>
  </div>
);
