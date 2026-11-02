import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { ArrowLeft, Briefcase, Code2, Eye, Gauge, HelpCircle, Lightbulb, ListChecks, Feather, MessageCircleQuestion, Mic, Pause, Play, RotateCcw, Search, Send, ThumbsUp, Volume2, VolumeX, X } from 'lucide-react';
import { SCRIPT_FONTS, TUTOR_ACTIONS, TUTOR_LANGUAGES, TUTOR_STYLES, findTutorLanguage } from '../../../shared/tutor/languages.js';
import { NAME_STACK, Rich, loadFont, loadNameFonts, parseAnswer, pickVoice, scriptStack, synth, useVoices } from './tutorKit';
import BoardPlayer, { parseBoards } from './BoardPlayer';
import { api } from '../../services/api';
import { moduleTitle } from '../../utils/textUtils';

/*
 * Lekha, the AI tutor. A floating orb on every lesson opens a sheet: pick one of 24 languages,
 * press Explain, and the module is explained in that language - streamed in as it is written and
 * read aloud sentence by sentence by the device's voice, with the spoken sentence highlighted.
 * Then it becomes a conversation: check-yourself cards pause the voice until the student answers,
 * any sentence can be tapped to "explain this part", quick buttons ask for a simpler version,
 * another example, real-life use, the code line by line or a quiz, and doubts can be typed or spoken.
 */

const LANG_KEY = 'arb_tutor_lang';
const STYLE_KEY = 'arb_tutor_style';
const RATE_KEY = 'arb_tutor_rate';
const SEEN_KEY = 'arb_tutor_seen';
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } }
};
const ORBIT = ['అ', 'अ', 'த', 'ಅ', 'മ', 'A', 'অ', 'ગ'];
const CYCLE = ['తెలుగు', 'हिन्दी', 'தமிழ்', 'മലയാളം', 'ಕನ್ನಡ', 'বাংলা', 'English', 'मराठी'];

/* ------------------------------------------------------------------ */
/* Icon: an open book whose pages give off sound waves, plus a spark   */
/* ------------------------------------------------------------------ */

export function TutorGlyph({ className = 'w-7 h-7', speaking = false }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path d="M4 9.5c3.2-1.6 6.4-1.6 9.6 0v14c-3.2-1.6-6.4-1.6-9.6 0z" fill="currentColor" opacity=".9" />
      <path d="M13.6 9.5c1.5-.8 3-.8 4.4-.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 13.4h3.6M7 16.4h3.6M7 19.4h2.4" stroke="#0B2B26" strokeWidth="1.3" strokeLinecap="round" />
      <g className={speaking ? 'tutor-waves on' : 'tutor-waves'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M18 14.2c1.2 1.2 1.2 3.4 0 4.6" />
        <path d="M21 11.8c2.6 2.6 2.6 6.8 0 9.4" />
        <path d="M24 9.4c4 4 4 10.2 0 14.2" />
      </g>
    </svg>
  );
}

/** The orb with orbiting script letters. */
function TutorOrb({ size = 56, speaking = false }) {
  return (
    <span className="tutor-orb relative inline-flex items-center justify-center rounded-full text-pine-100" style={{ width: size, height: size }}>
      <span className="tutor-orbit absolute inset-0 rounded-full" aria-hidden="true">
        {ORBIT.map((ch, i) => (
          <span key={ch} className="absolute left-1/2 top-1/2 text-[10px] font-bold text-pine-300" style={{ transform: `rotate(${i * 45}deg) translateY(-${size / 2 + 1}px) rotate(-${i * 45}deg)`, marginLeft: -4, marginTop: -7 }}>{ch}</span>
        ))}
      </span>
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-pine-700 via-pine-900 to-pine-950 shadow-[0_14px_30px_-10px_rgba(5,31,32,.9)] ring-1 ring-pine-300/30" />
      <span className="tutor-halo absolute inset-0 rounded-full" aria-hidden="true" />
      <TutorGlyph className="relative w-[58%] h-[58%]" speaking={speaking} />
    </span>
  );
}

/** Inline button for the module hero. */
export function TutorHeroButton({ onClick }) {
  return (
    <button onClick={onClick} className="group mt-5 inline-flex items-center gap-3 rounded-full bg-pine-100 pl-1.5 pr-4 py-1.5 text-pine-950 shadow-[0_10px_24px_-12px_rgba(0,0,0,.6)] active:scale-[.98] transition">
      <TutorOrb size={36} />
      <span className="text-left leading-tight">
        <span className="block text-[14px] font-bold">Explain with AI tutor</span>
        <span className="block text-[11.5px] text-pine-800/70">With voice · 24 Indian languages</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet: language picker, then the explanation and the conversation */
/* ------------------------------------------------------------------ */

const ACTION_ICONS = { simpler: Feather, example: Lightbulb, reallife: Briefcase, code: Code2, quiz: ListChecks };
const Recognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
const cheer = () => {
  try {
    confetti({ particleCount: 70, spread: 70, startVelocity: 32, origin: { y: 0.85 }, colors: ['#DAF1DE', '#8EB69B', '#235347', '#163832'], zIndex: 200, disableForReducedMotion: true });
  } catch { /* no canvas */ }
};

function Sentence({ u, current, selected, onPick }) {
  const on = u.i === current;
  return (
    <span data-u={u.i} onClick={() => onPick(u)}
      className={`rounded-md transition-colors duration-300 cursor-pointer ${on ? 'bg-pine-300/45 text-pine-950 shadow-[0_0_0_3px_rgba(142,182,155,.45)]' : selected ? 'bg-pine-100 shadow-[0_0_0_2px_rgba(35,83,71,.35)]' : ''}`}>
      <Rich text={u.raw} />{' '}
    </span>
  );
}

function CheckCard({ block, revealed, waiting, onReveal, sentence }) {
  return (
    <div className={`tutor-check my-4 rounded-2xl p-4 ring-1 transition-all duration-300 ${waiting ? 'bg-white ring-2 ring-pine-700 shadow-[0_14px_30px_-18px_rgba(5,31,32,.8)]' : 'bg-white ring-pine-800/10'}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-pine-700 flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Check yourself</p>
      <p className="mt-1.5 text-[15.5px] font-semibold leading-relaxed text-pine-950">{block.q.map(sentence)}</p>
      {revealed ? (
        <p className="tutor-reveal mt-2.5 rounded-xl bg-pine-100/70 p-3 text-[15px] leading-relaxed text-pine-950/90">{block.a.map(sentence)}</p>
      ) : (
        <div className="mt-3 flex items-center gap-2.5">
          <button onClick={() => onReveal(block.id)} disabled={!block.a.length} className="h-9 px-4 rounded-full bg-pine-950 text-pine-100 text-[13px] font-bold inline-flex items-center gap-1.5 active:scale-95 transition disabled:opacity-40">
            <Eye className="w-4 h-4" /> Show answer
          </button>
          {waiting && <span className="text-[12.5px] text-pine-700 font-medium tutor-think">Think for a moment…</span>}
        </div>
      )}
    </div>
  );
}

function TutorSheet({ course, mod, onClose }) {
  const [lang, setLang] = useState(() => store.get(LANG_KEY, 'en'));
  const [style, setStyle] = useState(() => store.get(STYLE_KEY, 'simple'));
  const [rate, setRate] = useState(() => Number(store.get(RATE_KEY, '1')) || 1);
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('pick'); // pick | learn
  // the conversation: the explanation first, then follow-ups { id, kind, label, text, streaming, error, cached }
  const [thread, setThread] = useState([]);
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [revealed, setRevealed] = useState(() => new Set());
  const [waiting, setWaiting] = useState(null); // check card the voice is waiting on
  const [selected, setSelected] = useState(null); // tapped sentence
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [feedback, setFeedback] = useState(null); // null | 'yes' | 'no'
  const [view, setView] = useState('boards'); // boards | chat
  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const recRef = useRef(null);
  const playRef = useRef({ playing: false, index: 0 });

  const language = findTutorLanguage(lang) || TUTOR_LANGUAGES[0];
  const voices = useVoices();
  const voice = useMemo(() => pickVoice(voices, language.speech) || pickVoice(voices, language.voiceFallback), [voices, language]);
  const usingFallbackVoice = !!voice && !pickVoice(voices, language.speech);

  const parsed = useMemo(() => {
    let offset = 0;
    const all = [];
    const segs = thread.map((seg, si) => {
      const r = parseAnswer(seg.text, offset, `s${si}c`);
      offset = r.next;
      all.push(...r.units);
      return { ...seg, blocks: r.blocks, first: r.units[0]?.i ?? offset };
    });
    return { segs, units: all };
  }, [thread]);
  const busy = thread.some(t => t.streaming);
  const ready = busy ? Math.max(0, parsed.units.length - 1) : parsed.units.length; // the last sentence may still be growing
  const live = useRef({});
  live.current = { units: parsed.units, ready, busy, revealed };

  const shown = TUTOR_LANGUAGES.filter(l => !query.trim() || `${l.name} ${l.native}`.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(loadNameFonts, []);
  useEffect(() => { loadFont(SCRIPT_FONTS[lang]); }, [lang]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); abortRef.current?.abort(); synth?.cancel(); recRef.current?.abort?.(); };
  }, [onClose]);

  /* ---- voice queue: speaks sentence `index`, then the next when it is ready ---- */
  const speakFrom = useCallback((index) => {
    if (!synth || !voiceOn || !voice) return; // no voice for this language: text only (a notice explains why)
    synth.cancel();
    setWaiting(null);
    playRef.current = { playing: true, index };
    setPlaying(true);
    const step = (i) => {
      if (!playRef.current.playing) return;
      const { units, ready: r, busy: b, revealed: rv } = live.current;
      if (i >= r) {
        if (b) { setTimeout(() => step(i), 350); return; } // wait for more text
        playRef.current.playing = false; setPlaying(false); setCurrent(-1); return;
      }
      const u = units[i];
      if (u.gate && !rv.has(u.gate)) { // a check card: let the student think and answer first
        playRef.current = { playing: false, index: i }; setPlaying(false); setCurrent(-1); setWaiting(u.gate); return;
      }
      playRef.current.index = i;
      setCurrent(i);
      const utter = new SpeechSynthesisUtterance(u.speak);
      if (voice) utter.voice = voice;
      utter.lang = voice?.lang || language.speech;
      utter.rate = rate;
      let moved = false;
      let guard = null;
      const next = () => { if (!moved) { moved = true; clearTimeout(guard); step(i + 1); } };
      utter.onend = next;
      utter.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') next(); };
      synth.speak(utter);
      guard = setTimeout(() => { if (playRef.current.playing && playRef.current.index === i) next(); }, Math.max(6000, u.speak.length * 160) / rate);
    };
    step(index);
  }, [voice, language.speech, rate, voiceOn]);

  const pause = () => { playRef.current.playing = false; setPlaying(false); synth?.cancel(); };
  const resume = () => speakFrom(Math.max(0, current >= 0 ? current : playRef.current.index));

  useEffect(() => {
    if (current < 0) return;
    scrollRef.current?.querySelector(`[data-u="${current}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [current]);
  useEffect(() => { if (playRef.current.playing) speakFrom(playRef.current.index); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [rate]);

  const reveal = (id) => {
    const next = new Set(revealed); next.add(id);
    setRevealed(next);
    live.current.revealed = next;
    if (waiting === id) { const at = parsed.units.find(u => u.gate === id)?.i; if (at !== undefined) speakFrom(at); }
  };

  const unlockSpeech = () => { if (synth && voiceOn) { try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch { /* no speech */ } } };

  /** Runs one request into a new thread entry; the voice starts at its first sentence as soon as it arrives. */
  const run = async (entry, call, fresh = false) => {
    unlockSpeech(); // iOS: speech must start inside the tap
    pause(); setSelected(null);
    const id = `${Date.now()}`;
    const seg = fresh ? 0 : thread.length;
    const startAt = fresh ? 0 : parsed.units.length; // sentence numbers continue across entries
    live.current = { ...live.current, units: fresh ? [] : live.current.units, ready: startAt, busy: true };
    setThread(t => [...(fresh ? [] : t), { id, ...entry, text: '', streaming: true }]);
    const patch = (p) => setThread(t => t.map(x => (x.id === id ? { ...x, ...p } : x)));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (voiceOn && !fresh) setTimeout(() => speakFrom(startAt), 60); // boards narrate the explanation; follow-ups start here
    if (seg > 0) setTimeout(() => scrollRef.current?.querySelector(`[data-seg="${seg}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 120);
    try {
      const result = await call((t) => patch({ text: t }), ctrl.signal);
      patch({ text: result.text, cached: result.cached, streaming: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      patch({ text: err.partial || '', streaming: false, error: err.status === 503 ? 'The AI tutor is not switched on yet. Please check back soon.' : err.message });
    }
  };

  const explain = () => {
    store.set(LANG_KEY, lang); store.set(STYLE_KEY, style);
    setPhase('learn'); setRevealed(new Set()); setFeedback(null); setCurrent(-1);
    run({ kind: 'explain' }, (onText, signal) => api.tutorExplain({ courseId: course.id, moduleId: mod.id, lang, style }, onText, signal), true);
  };

  const history = () => thread.filter(t => t.kind === 'ask' && t.text && !t.error).map(t => ({ q: t.label, a: t.text }));
  const ask = ({ action, question, focus, label }) => {
    if (busy) return;
    setView('chat');
    const body = { courseId: course.id, moduleId: mod.id, lang, style, action, question, focus, history: action ? [] : history() };
    run({ kind: 'ask', label }, (onText, signal) => api.tutorAsk(body, onText, signal));
  };
  const sendDraft = (text = draft) => {
    const q = text.trim();
    if (!q) return;
    setDraft('');
    ask({ question: q, label: q });
  };

  const listen = () => {
    if (!Recognition) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Recognition();
    rec.lang = language.code === 'hinglish' ? 'en-IN' : language.speech;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (const r of e.results) { if (r.isFinal) finalText = r[0].transcript; else interim += r[0].transcript; }
      setDraft(finalText || interim);
    };
    rec.onend = () => { setListening(false); if (finalText.trim()) sendDraft(finalText); };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    pause();
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const back = () => { abortRef.current?.abort(); pause(); setPhase('pick'); setThread([]); };
  const explainDone = thread[0] && !thread[0].streaming && !thread[0].error && thread[0].text;
  const boards = useMemo(() => (thread[0]?.kind === 'explain' ? parseBoards(thread[0].text) : []), [thread]);
  // boards view while the lesson is coming in as boards (or before the first text arrives)
  const boardsMode = phase === 'learn' && (boards.length > 0 || (thread[0]?.streaming && !thread[0]?.text.trim()));
  const showBoards = boardsMode && view === 'boards' && !thread[0]?.error;

  const feedbackCard = (onStage) => (
    <div className={`tutor-in rounded-[22px] bg-gradient-to-br from-pine-800 to-pine-950 text-white ${onStage ? 'h-full flex flex-col justify-center p-6 ring-1 ring-white/10' : 'mt-7 p-4'}`} dir="ltr">
      {feedback === 'yes' ? (
        <>
          <p className="font-display text-[20px] font-bold">Superb! You've got it.</p>
          <p className="mt-1 text-[13.5px] text-pine-100/75">Lock it in with a quick quiz before you move on.</p>
          <button onClick={() => ask({ action: 'quiz', label: 'Quiz me' })} className="mt-4 h-11 px-5 self-start rounded-xl bg-pine-100 text-pine-950 text-[14px] font-bold inline-flex items-center gap-1.5 active:scale-95 transition"><ListChecks className="w-4 h-4" /> Quiz me</button>
        </>
      ) : (
        <>
          {onStage && <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4"><MessageCircleQuestion className="w-7 h-7 text-pine-300" /></span>}
          <p className="font-display text-[20px] font-bold">Did that make sense?</p>
          <p className="mt-1 text-[13.5px] text-pine-100/75">Be honest. I can explain it another way.</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => { setFeedback('yes'); cheer(); }} className="flex-1 h-12 rounded-xl bg-pine-100 text-pine-950 text-[14.5px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-95 transition"><ThumbsUp className="w-4 h-4" /> Yes, got it!</button>
            <button onClick={() => { setFeedback('no'); ask({ action: 'simpler', label: 'Not yet. Please explain it more simply.' }); }} className="flex-1 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 text-[14.5px] font-bold active:bg-white/20">Not yet</button>
          </div>
        </>
      )}
    </div>
  );

  const sentence = (u) => <Sentence key={u.i} u={u} current={current} selected={selected?.i === u.i} onPick={setSelected} />;

  return (
    <div className="fixed inset-0 z-[140] flex items-end lg:items-stretch lg:justify-end" role="dialog" aria-modal="true" aria-labelledby="tutor-title">
      <div className="absolute inset-0 bg-pine-950/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="tutor-sheet relative w-full lg:w-[480px] h-[92dvh] lg:h-full flex flex-col rounded-t-[28px] lg:rounded-none lg:rounded-l-[28px] bg-[#F3F8F4] overflow-hidden shadow-[0_-20px_60px_-20px_rgba(0,0,0,.6)]">
        {/* header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-pine-800 via-pine-900 to-pine-950 px-5 pt-5 pb-4 text-white">
          <span className="mh-beam pointer-events-none absolute -left-16 -top-24 w-64 h-64 rounded-full bg-pine-100/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3.5">
            {phase === 'learn'
              ? <button onClick={back} className="w-9 h-9 -ml-1 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20" aria-label="Choose another language"><ArrowLeft className="w-4 h-4" /></button>
              : <TutorOrb size={44} />}
            <div className="min-w-0 flex-1">
              <p id="tutor-title" className="font-display text-[18px] font-bold leading-tight">Lekha <span className="text-pine-300 font-semibold">· AI tutor</span></p>
              <p className="text-[12.5px] text-pine-100/70 truncate">{moduleTitle(mod.title)}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>

          {phase === 'learn' && !showBoards && (
            <div className="relative mt-4 flex items-center gap-2.5">
              <button onClick={playing ? pause : resume} disabled={!synth || !voiceOn || (!parsed.units.length && !busy)} aria-label={playing ? 'Pause voice' : 'Play voice'}
                className="relative w-12 h-12 shrink-0 rounded-full bg-pine-100 text-pine-950 flex items-center justify-center shadow-lg active:scale-95 transition disabled:opacity-40">
                {playing && <span className="tutor-ping absolute inset-0 rounded-full" aria-hidden="true" />}
                {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-end gap-[3px] h-5" aria-hidden="true">
                  {Array.from({ length: 18 }).map((_, i) => <span key={i} className={`tutor-bar w-[3px] rounded-full bg-pine-300 ${playing ? 'on' : ''}`} style={{ animationDelay: `${(i % 6) * 0.11}s`, height: `${30 + ((i * 37) % 70)}%` }} />)}
                </div>
                <p className="mt-1 text-[11.5px] text-pine-100/70 truncate" style={{ fontFamily: NAME_STACK }}>
                  {waiting ? 'Waiting for your answer…' : <>{language.native}{language.native !== language.name ? ` · ${language.name}` : ''}{voice ? ` · ${voice.name}` : ''}</>}
                </p>
              </div>
              <button onClick={() => { const r = rate >= 1.25 ? 0.8 : rate >= 1 ? 1.25 : 1; setRate(r); store.set(RATE_KEY, String(r)); }} className="h-9 px-2.5 rounded-full bg-white/10 text-[12.5px] font-bold inline-flex items-center gap-1 active:bg-white/20" aria-label="Voice speed">
                <Gauge className="w-3.5 h-3.5" />{rate}x
              </button>
              <button onClick={() => speakFrom(0)} disabled={!parsed.units.length || !voiceOn} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 disabled:opacity-40" aria-label="Start again"><RotateCcw className="w-4 h-4" /></button>
              <button onClick={() => { if (voiceOn) pause(); setVoiceOn(v => !v); }} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20" aria-label={voiceOn ? 'Turn voice off' : 'Turn voice on'}>
                {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* body */}
        <div ref={scrollRef} className={`flex-1 overscroll-contain px-5 ${showBoards ? 'pt-4 pb-3 overflow-hidden flex flex-col' : 'py-5 overflow-y-auto'}`}>
          {phase === 'pick' ? (
            <div className="tutor-in">
              <h2 className="font-display text-[19px] font-bold text-pine-950">Which language should I explain in?</h2>
              <p className="mt-1 text-[13px] text-pine-800/65">I'll explain this module in simple words, read it out loud, and answer your doubts.</p>
              <div className="relative mt-3.5">
                <Search className="w-4 h-4 text-pine-800/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search languages" aria-label="Search languages"
                  className="w-full h-11 pl-10 pr-3 rounded-2xl bg-white ring-1 ring-pine-800/10 text-[14.5px] outline-none focus:ring-2 focus:ring-pine-700/40" />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Language">
                {shown.map((l, i) => {
                  const on = l.code === lang;
                  return (
                    <button key={l.code} role="radio" aria-checked={on} onClick={() => setLang(l.code)} style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
                      className={`tutor-chip relative min-w-0 rounded-2xl px-2 py-2.5 text-center transition-all duration-200 ${on ? 'bg-pine-950 text-pine-100 shadow-[0_10px_20px_-12px_rgba(5,31,32,.9)] scale-[1.03]' : 'bg-white text-pine-950 ring-1 ring-pine-800/10 active:bg-pine-100'}`}>
                      <span className="block text-[15px] font-bold leading-tight truncate" dir={l.rtl ? 'rtl' : undefined} style={{ fontFamily: scriptStack(l.code) }}>{l.native}</span>
                      <span className={`block text-[10.5px] truncate ${on ? 'text-pine-300' : 'text-pine-800/55'}`}>{l.name}</span>
                    </button>
                  );
                })}
              </div>
              <h3 className="mt-5 text-[13px] font-bold uppercase tracking-[0.12em] text-pine-700">How deep?</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {TUTOR_STYLES.map(s => (
                  <button key={s.id} onClick={() => setStyle(s.id)} aria-pressed={style === s.id}
                    className={`rounded-2xl p-3 text-left transition ${style === s.id ? 'bg-white ring-2 ring-pine-700' : 'bg-white/60 ring-1 ring-pine-800/10'}`}>
                    <span className="block text-[13.5px] font-bold text-pine-950">{s.label}</span>
                    <span className="block mt-0.5 text-[11.5px] leading-snug text-pine-800/60">{s.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
            {boardsMode && (
              <div className="shrink-0 -mt-1 mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-pine-800/[.07] p-1" role="tablist" aria-label="View" dir="ltr">
                {[['boards', 'Lesson boards'], ['chat', `Ask & notes${thread.length > 1 ? ` · ${thread.length - 1}` : ''}`]].map(([id, label]) => (
                  <button key={id} role="tab" aria-selected={view === id} onClick={() => { setView(id); pause(); }}
                    className={`h-9 rounded-xl text-[13px] font-bold transition-all duration-300 ${view === id ? 'bg-white text-pine-950 shadow-[0_6px_14px_-8px_rgba(5,31,32,.5)]' : 'text-pine-800/70'}`}>{label}</button>
                ))}
              </div>
            )}
            {showBoards ? (
              <div className="flex-1 min-h-0">
                <BoardPlayer boards={boards} streaming={!!thread[0]?.streaming} voice={voice} speechLang={language.speech} active={showBoards}
                  fontFamily={scriptStack(language.code)} dir={language.rtl ? 'rtl' : undefined} ending={feedbackCard(true)} />
              </div>
            ) : (
            <article className="tutor-in" dir={language.rtl ? 'rtl' : undefined} lang={language.code === 'hinglish' ? 'en' : language.code} style={{ fontFamily: scriptStack(language.code) }}>
              {!voice && voiceOn && synth && (
                <p className="mb-4 rounded-2xl bg-white ring-1 ring-pine-800/10 p-3 text-[12.5px] text-pine-800/80" dir="ltr">
                  This device has no {language.name} voice yet, so I'll show the text only. To hear it: on Android open Settings → Text-to-speech → Google → install {language.name}; on iPhone open Settings → Accessibility → Spoken Content → Voices.
                </p>
              )}
              {usingFallbackVoice && <p className="mb-4 text-[12px] text-pine-800/60" dir="ltr">No {language.name} voice on this device, so a {voice.lang} voice is reading. It may not sound perfect.</p>}

              {parsed.segs.map((seg, si) => (
                <section key={seg.id} data-seg={si} className={seg.kind === 'ask' ? 'mt-7 scroll-mt-3' : ''}>
                  {seg.kind === 'ask' && (
                    <div className="flex justify-end mb-3" dir="ltr">
                      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-pine-950 text-pine-100 px-3.5 py-2.5 text-[14.5px] leading-snug" style={{ fontFamily: scriptStack(language.code) }}>{seg.label}</p>
                    </div>
                  )}
                  <div className={seg.kind === 'ask' ? 'rounded-2xl bg-white/70 ring-1 ring-pine-800/10 px-4 py-3' : ''}>
                    {seg.blocks.map((b, bi) => {
                      if (b.type === 'code') return <pre key={bi} dir="ltr" className="my-3 rounded-xl bg-pine-950 text-pine-100 text-[12.5px] leading-relaxed font-mono p-3.5 overflow-x-auto">{b.code}</pre>;
                      if (b.type === 'check') return <CheckCard key={b.id} block={b} revealed={revealed.has(b.id)} waiting={waiting === b.id} onReveal={reveal} sentence={sentence} />;
                      const Tag = b.type === 'h' ? 'h3' : b.type === 'li' ? 'li' : 'p';
                      const cls = b.type === 'h'
                        ? 'mt-5 first:mt-0 mb-2 font-display text-[18px] font-bold text-pine-950'
                        : b.type === 'li' ? 'ml-5 list-disc my-1.5 text-[15.5px] leading-[1.75] text-pine-950/85' : 'my-2.5 text-[15.5px] leading-[1.75] text-pine-950/85';
                      return <Tag key={bi} className={cls} style={b.type === 'h' ? { fontFamily: scriptStack(language.code) } : undefined}>{b.sentences.map(sentence)}</Tag>;
                    })}
                    {seg.streaming && (
                      <p className="mt-2 inline-flex items-center gap-2 text-[13px] font-medium text-pine-700" dir="ltr">
                        <span className="tutor-dots" aria-hidden="true"><i /><i /><i /></span>
                        {seg.text ? 'Lekha is explaining…' : seg.kind === 'explain' ? `Lekha is reading the module and preparing your ${language.name} explanation…` : 'Lekha is thinking…'}
                      </p>
                    )}
                    {seg.error && <p className="mt-3 rounded-2xl bg-rose-50 ring-1 ring-rose-200 p-3 text-[13.5px] text-rose-800" dir="ltr">{seg.error}</p>}
                  </div>
                </section>
              ))}

              {/* did it make sense? (the boards show it on their last screen) */}
              {explainDone && thread.length === 1 && !boards.length && (
                <div className="tutor-in mt-7 rounded-[22px] bg-gradient-to-br from-pine-800 to-pine-950 p-4 text-white" dir="ltr">
                  {feedback === 'yes' ? (
                    <>
                      <p className="font-display text-[17px] font-bold">Superb! You've got it.</p>
                      <p className="mt-1 text-[13px] text-pine-100/75">Lock it in with a quick quiz before you move on.</p>
                      <button onClick={() => ask({ action: 'quiz', label: 'Quiz me' })} className="mt-3 h-10 px-4 rounded-xl bg-pine-100 text-pine-950 text-[13.5px] font-bold inline-flex items-center gap-1.5 active:scale-95 transition"><ListChecks className="w-4 h-4" /> Quiz me</button>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-[17px] font-bold">Did that make sense?</p>
                      <p className="mt-1 text-[13px] text-pine-100/75">Be honest. I can explain it another way.</p>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => { setFeedback('yes'); cheer(); }} className="flex-1 h-11 rounded-xl bg-pine-100 text-pine-950 text-[14px] font-bold inline-flex items-center justify-center gap-1.5 active:scale-95 transition"><ThumbsUp className="w-4 h-4" /> Yes, got it!</button>
                        <button onClick={() => { setFeedback('no'); ask({ action: 'simpler', label: 'Not yet. Please explain it more simply.' }); }} className="flex-1 h-11 rounded-xl bg-white/10 ring-1 ring-white/20 text-[14px] font-bold active:bg-white/20">Not yet</button>
                      </div>
                    </>
                  )}
                </div>
              )}
              {explainDone && <p className="mt-6 text-[11.5px] text-pine-800/50" dir="ltr">Tap any sentence to replay it or ask about it. AI can make mistakes; the module text is the final reference.</p>}
            </article>
            )}
            </>
          )}
        </div>

        {/* footer */}
        {phase === 'pick' ? (
          <div className="shrink-0 px-5 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))] bg-[#F3F8F4] border-t border-pine-800/10">
            <button onClick={explain} className="wc-cta relative overflow-hidden w-full h-[52px] rounded-2xl bg-pine-950 text-pine-100 font-display text-[16px] font-bold inline-flex items-center justify-center gap-2 active:scale-[.98] transition">
              <Play className="w-4 h-4 fill-current" /> Explain in <span style={{ fontFamily: NAME_STACK }}>{language.native}</span>
            </button>
          </div>
        ) : (
          <div className="shrink-0 bg-white border-t border-pine-800/10 pb-[calc(10px+env(safe-area-inset-bottom))]">
            {showBoards ? null : selected ? (
              <div className="tutor-in flex items-center gap-2 px-4 pt-3">
                <p className="min-w-0 flex-1 text-[12.5px] text-pine-800/70 truncate" style={{ fontFamily: scriptStack(language.code) }}>“{selected.speak}”</p>
                <button onClick={() => { speakFrom(selected.i); setSelected(null); }} disabled={!voiceOn} className="h-9 px-3 rounded-full bg-pine-100 text-pine-950 text-[12.5px] font-bold inline-flex items-center gap-1 disabled:opacity-40"><Volume2 className="w-3.5 h-3.5" /> Replay</button>
                <button onClick={() => ask({ focus: selected.speak, label: `Explain this part: “${selected.speak}”` })} disabled={busy} className="h-9 px-3 rounded-full bg-pine-950 text-pine-100 text-[12.5px] font-bold inline-flex items-center gap-1 disabled:opacity-40"><HelpCircle className="w-3.5 h-3.5" /> Explain this</button>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full text-pine-800/60 flex items-center justify-center" aria-label="Cancel"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pt-3" aria-label="Quick questions">
                <span className="shrink-0 self-center text-[12px] font-bold text-pine-700 pr-0.5">Still confused?</span>
                {TUTOR_ACTIONS.map(a => {
                  const Icon = ACTION_ICONS[a.id] || Lightbulb;
                  return (
                    <button key={a.id} onClick={() => ask({ action: a.id, label: a.label })} disabled={busy}
                      className="shrink-0 h-9 px-3.5 rounded-full bg-[#F3F8F4] ring-1 ring-pine-800/10 text-pine-900 text-[13px] font-semibold inline-flex items-center gap-1.5 active:scale-95 transition disabled:opacity-40">
                      <Icon className="w-3.5 h-3.5 text-pine-700" />{a.label}
                    </button>
                  );
                })}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); sendDraft(); }} className="flex items-center gap-2 px-4 pt-2.5">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={busy} maxLength={600}
                placeholder={listening ? 'Listening… speak your doubt' : `Ask your doubt in ${language.name}…`} aria-label="Ask a doubt"
                style={{ fontFamily: scriptStack(language.code) }}
                className="min-w-0 flex-1 h-11 px-4 rounded-full bg-[#F3F8F4] ring-1 ring-pine-800/10 text-[14.5px] outline-none focus:ring-2 focus:ring-pine-700/40 disabled:opacity-60" />
              {Recognition && (
                <button type="button" onClick={listen} disabled={busy} aria-label={listening ? 'Stop listening' : 'Speak your doubt'}
                  className={`relative w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition disabled:opacity-40 ${listening ? 'bg-rose-600 text-white' : 'bg-pine-100 text-pine-900'}`}>
                  {listening && <span className="tutor-ping absolute inset-0 rounded-full" aria-hidden="true" />}
                  <Mic className="w-5 h-5" />
                </button>
              )}
              <button type="submit" disabled={busy || !draft.trim()} aria-label="Send" className="w-11 h-11 shrink-0 rounded-full bg-pine-950 text-pine-100 flex items-center justify-center active:scale-95 transition disabled:opacity-40"><Send className="w-[18px] h-[18px]" /></button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating launcher                                                  */
/* ------------------------------------------------------------------ */

export default function AITutor({ course, mod, open, onOpen, onClose }) {
  const [seen, setSeen] = useState(() => store.get(SEEN_KEY, '') === '1');
  const [word, setWord] = useState(0);
  useEffect(() => {
    if (seen) return undefined;
    loadNameFonts();
    const t = setInterval(() => setWord(w => (w + 1) % CYCLE.length), 1800);
    return () => clearInterval(t);
  }, [seen]);
  const launch = () => { store.set(SEEN_KEY, '1'); setSeen(true); onOpen(); };
  if (!course || !mod) return null;
  // on <body>: the lesson column animates with a transform, which would unpin fixed elements
  return createPortal(
    <>
      {!open && (
        <button onClick={launch} aria-label="Open the AI tutor: explain this module in your language"
          className="tutor-fab fixed z-40 right-[22px] sm:right-7 bottom-[84px] sm:bottom-[92px] flex items-center gap-3">
          {!seen && (
            <span className="tutor-label hidden min-[360px]:inline-flex items-center h-9 pl-3.5 pr-3 rounded-full bg-pine-950 text-pine-100 text-[13px] font-semibold shadow-lg ring-1 ring-pine-300/20">
              Explain in&nbsp;<span key={word} className="mh-hint text-pine-300" style={{ fontFamily: NAME_STACK }}>{CYCLE[word]}</span>
            </span>
          )}
          <TutorOrb size={56} />
        </button>
      )}
      {open && <TutorSheet course={course} mod={mod} onClose={onClose} />}
    </>,
    document.body
  );
}
