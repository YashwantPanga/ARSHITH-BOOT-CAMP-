import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, BookmarkCheck, ChevronLeft, ChevronRight, Code2, Eye, Gauge, HelpCircle, Lightbulb, ListOrdered, Pause, Play, RotateCcw, Rocket, Store, Volume2, VolumeX } from 'lucide-react';
import { Rich, plain, synth } from './tutorKit';

/*
 * Lesson boards: the explanation as narrated, animated slides. Each board's points appear as the
 * voice reaches them, code boards light up the line being explained, check boards stop and wait for
 * the student, and the player moves to the next board on its own. Without a voice it runs on timers.
 */

export const BOARD_TYPES = {
  why: { label: 'Why it matters', icon: Rocket, bg: 'from-pine-700 via-pine-800 to-pine-950' },
  idea: { label: 'Big idea', icon: Lightbulb, bg: 'from-pine-800 via-pine-900 to-pine-950' },
  analogy: { label: 'Real-life example', icon: Store, bg: 'from-[#2C5E50] via-pine-800 to-pine-950' },
  code: { label: 'Code walkthrough', icon: Code2, bg: 'from-pine-900 via-pine-950 to-[#031516]' },
  steps: { label: 'Step by step', icon: ListOrdered, bg: 'from-pine-800 via-pine-900 to-pine-950' },
  mistake: { label: 'Watch out', icon: AlertTriangle, bg: 'from-[#4A3B1E] via-pine-900 to-pine-950', accent: 'text-[#F2D27A]' },
  recap: { label: 'Recap', icon: BookmarkCheck, bg: 'from-pine-700 via-pine-900 to-pine-950' },
  check: { label: 'Check yourself', icon: HelpCircle, bg: 'from-[#1F4A3F] via-pine-900 to-pine-950' }
};

/** Parses "[[BOARD type]] ... [[/BOARD]]" blocks. The last board may still be arriving (complete: false). */
export function parseBoards(text) {
  const boards = [];
  let b = null;
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k];
    const open = line.match(/^\s*\[\[BOARD\s+([a-z]+)\s*\]\]/i);
    if (open) { if (b) boards.push(b); b = { type: BOARD_TYPES[open[1].toLowerCase()] ? open[1].toLowerCase() : 'idea', title: '', items: [], code: null, notes: [], check: null, complete: false }; continue; }
    if (/^\s*\[\[\/BOARD\]\]/i.test(line)) { if (b) { b.complete = true; boards.push(b); b = null; } continue; }
    if (!b || !line.trim()) continue;
    if (/^\s*\[\[CHECK\]\]/.test(line)) {
      const body = [];
      k++;
      while (k < lines.length && !/^\s*\[\[\/CHECK\]\]/.test(lines[k]) && !/^\s*\[\[\/?BOARD/.test(lines[k])) body.push(lines[k++]);
      if (k < lines.length && /^\s*\[\[\/?BOARD/.test(lines[k])) k--; // let the board marker be read
      const joined = body.join('\n');
      b.check = {
        q: (joined.match(/Q:\s*([\s\S]*?)(?=\n\s*A:|$)/) || [])[1]?.replace(/\s+/g, ' ').trim() || '',
        a: (joined.match(/A:\s*([\s\S]*)$/) || [])[1]?.replace(/\s+/g, ' ').trim() || ''
      };
      continue;
    }
    if (/^\s*```/.test(line)) {
      const code = [];
      k++;
      while (k < lines.length && !/^\s*```/.test(lines[k]) && !/^\s*\[\[\/BOARD/.test(lines[k])) code.push(lines[k++]);
      if (k < lines.length && /^\s*\[\[\/BOARD/.test(lines[k])) k--;
      b.code = code;
      continue;
    }
    const h = line.match(/^\s*#{1,4}\s+(.*)/);
    if (h && !b.title) { b.title = h[1].trim(); continue; }
    const note = line.match(/^\s*@(\d+)\s+(.*)/);
    if (note) { b.notes.push({ line: Number(note[1]), text: note[2].trim() }); continue; }
    const callout = line.match(/^\s*>\s+(.*)/);
    if (callout) { b.items.push({ kind: 'callout', text: callout[1].trim() }); continue; }
    const point = line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)/);
    b.items.push({ kind: 'point', text: (point ? point[1] : line).trim() });
  }
  if (b) boards.push(b);
  return boards;
}

/** What the narrator says on a board, in order. `a` (a check answer) waits until it is revealed. */
function stepsOf(board) {
  const steps = [];
  if (board.title) steps.push({ kind: 'title', text: board.title });
  board.items.forEach((it, i) => steps.push({ kind: it.kind, text: it.text, item: i }));
  board.notes.forEach((n, i) => steps.push({ kind: 'note', text: n.text, note: i }));
  if (board.check?.q) steps.push({ kind: 'q', text: board.check.q });
  if (board.check?.a) steps.push({ kind: 'a', text: board.check.a });
  return steps.map(s => ({ ...s, speak: plain(s.text) }));
}

function ThinkRing({ seconds = 6 }) {
  return (
    <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90" aria-hidden="true">
      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(218,241,222,.15)" strokeWidth="3" />
      <circle cx="18" cy="18" r="15" fill="none" stroke="#8EB69B" strokeWidth="3" strokeLinecap="round" strokeDasharray="94.2" className="board-think" style={{ animationDuration: `${seconds}s` }} />
    </svg>
  );
}

function Board({ board, index, total, step, steps, revealed, onReveal, fontFamily, dir }) {
  const meta = BOARD_TYPES[board.type] || BOARD_TYPES.idea;
  const Icon = meta.icon;
  const shownUpTo = (pred) => steps.findIndex(pred);
  const isShown = (pred) => { const at = shownUpTo(pred); return at !== -1 && at <= step; };
  const isNow = (pred) => { const at = shownUpTo(pred); return at === step; };
  const activeNote = steps[step]?.kind === 'note' ? board.notes[steps[step].note] : null;
  const noteStarted = steps.some((s, i) => s.kind === 'note' && i <= step);

  return (
    <div className={`board-card relative h-full overflow-hidden rounded-[26px] bg-gradient-to-br ${meta.bg} text-white shadow-[0_30px_60px_-30px_rgba(5,31,32,.95)] ring-1 ring-white/10`} dir={dir}>
      <span className="board-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
      <span className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:radial-gradient(#DAF1DE_1px,transparent_1px)] [background-size:18px_18px]" aria-hidden="true" />
      <Icon className="board-mark pointer-events-none absolute -right-6 -bottom-6 w-40 h-40 text-white/[.05]" aria-hidden="true" />

      <div className="relative h-full flex flex-col p-5" style={{ fontFamily }}>
        <div className="flex items-center justify-between gap-3" dir="ltr">
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 ring-1 ring-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${meta.accent || 'text-pine-300'}`}>
            <Icon className="w-3.5 h-3.5" /> {meta.label}
          </span>
          <span className="text-[11.5px] font-semibold text-pine-100/50 tabular-nums">{index + 1} / {total}</span>
        </div>

        {board.title && <h3 key={`t${index}`} className="board-title mt-4 font-display text-[24px] leading-[1.15] font-bold text-white" style={{ fontFamily }}>{board.title}</h3>}

        <div className="mt-4 flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2.5">
          {board.items.map((it, i) => {
            const shown = isShown(s => s.item === i);
            const now = isNow(s => s.item === i);
            if (it.kind === 'callout') {
              return (
                <p key={i} className={`board-item text-[19px] leading-snug font-bold text-pine-100 border-l-[3px] border-pine-300 pl-3.5 py-1 ${shown ? 'in' : ''}`}>
                  <Rich text={it.text} />
                </p>
              );
            }
            return (
              <div key={i} className={`board-item flex gap-3 rounded-2xl px-3.5 py-3 ring-1 transition-colors duration-300 ${shown ? 'in' : ''} ${now ? 'bg-white/[.12] ring-pine-300/60' : 'bg-white/[.05] ring-white/10'}`}>
                <span className={`mt-[7px] w-2 h-2 shrink-0 rounded-full ${now ? 'bg-pine-100 shadow-[0_0_10px_#DAF1DE]' : 'bg-pine-300/70'}`} />
                <p className="text-[15.5px] leading-relaxed text-pine-100/95"><Rich text={it.text} /></p>
              </div>
            );
          })}

          {board.code && (
            <div className={`board-item rounded-2xl overflow-hidden bg-black/40 ring-1 ring-white/10 ${isShown(s => s.kind === 'title') || !board.title ? 'in' : ''}`} dir="ltr">
              <div className="flex items-center gap-1.5 px-3 h-8 border-b border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" /><span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              </div>
              <pre className="m-0 py-2 text-[12.5px] leading-[1.7] font-mono overflow-x-auto no-scrollbar">
                {board.code.map((ln, i) => {
                  const on = activeNote?.line === i + 1;
                  return (
                    <div key={i} className={`flex px-3 transition-all duration-300 ${on ? 'bg-pine-300/20 text-white' : noteStarted ? 'text-pine-100/45' : 'text-pine-100/90'}`}>
                      <span className={`w-6 shrink-0 select-none text-right pr-3 ${on ? 'text-pine-300' : 'text-white/25'}`}>{i + 1}</span>
                      <span className="whitespace-pre">{ln || ' '}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          )}
          {activeNote && (
            <p key={`n${step}`} className="board-caption flex gap-2.5 items-start text-[14.5px] leading-relaxed text-pine-100" style={{ fontFamily }}>
              <span className="shrink-0 mt-0.5 rounded-md bg-pine-300 text-pine-950 px-1.5 text-[11px] font-bold font-sans" dir="ltr">Line {activeNote.line}</span>
              <span><Rich text={activeNote.text} /></span>
            </p>
          )}

          {board.check?.q && (
            <div className={`board-item rounded-2xl bg-white/[.07] ring-1 ring-white/10 p-4 ${isShown(s => s.kind === 'q') ? 'in' : ''}`}>
              <p className="text-[17px] font-bold leading-snug text-white"><Rich text={board.check.q} /></p>
              {revealed ? (
                <p className="tutor-reveal mt-3 rounded-xl bg-pine-100 text-pine-950 p-3 text-[15px] leading-relaxed"><Rich text={board.check.a} /></p>
              ) : (
                <div className="mt-3.5 flex items-center gap-3" dir="ltr">
                  <ThinkRing />
                  <button onClick={onReveal} disabled={!board.check.a} className="h-10 px-4 rounded-full bg-pine-100 text-pine-950 text-[13.5px] font-bold inline-flex items-center gap-1.5 active:scale-95 transition disabled:opacity-40">
                    <Eye className="w-4 h-4" /> Show answer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * props: boards, streaming, voice (SpeechSynthesisVoice | null), speechLang, active (false pauses),
 * fontFamily, dir, ending (node shown after the last board), onEnded()
 */
export default function BoardPlayer({ boards, streaming, voice, speechLang, active, fontFamily, dir, ending, onEnded }) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(-1);     // step on screen (being spoken)
  const [spoken, setSpoken] = useState(-1); // last step finished
  const [playing, setPlaying] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [rate, setRate] = useState(1);
  const [revealed, setRevealed] = useState(() => new Set());
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  const token = useRef(0);   // invalidates callbacks from an earlier narration
  const saying = useRef(''); // what is being said now, so new streamed text does not restart it

  const board = boards[index];
  const steps = useMemo(() => (board ? stepsOf(board) : []), [board]);

  const stopSpeech = () => { token.current++; saying.current = ''; clearTimeout(timer.current); synth?.cancel(); };

  /** Says (or, without a voice, waits the reading time of) one step, then calls next. */
  const say = useCallback((text, next) => {
    const my = ++token.current;
    clearTimeout(timer.current);
    synth?.cancel();
    const after = () => { if (my === token.current) { clearTimeout(timer.current); saying.current = ''; next(); } };
    if (synth && voiceOn && voice) { // no voice for this language: timed mode instead of a wrong-language voice
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang || speechLang;
      u.rate = rate;
      u.onend = after;
      u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') after(); };
      synth.speak(u);
      // some browsers never fire onend: move on anyway after a generous reading time
      timer.current = setTimeout(after, Math.max(6000, text.length * 160) / rate);
    } else {
      timer.current = setTimeout(after, Math.max(1300, text.length * 55) / rate);
    }
  }, [voice, speechLang, voiceOn, rate]);

  // narrator: next step, then the next board; new streamed text re-runs this but never restarts a step
  useEffect(() => {
    if (!playing || !active || !board || done) return undefined;
    const target = spoken + 1;
    const s = steps[target];
    if (!s) {
      if (!board.complete) return undefined; // the rest of this board is still being written
      if (index + 1 < boards.length) {
        timer.current = setTimeout(() => { setIndex(i => i + 1); setStep(-1); setSpoken(-1); }, 700);
        return () => clearTimeout(timer.current);
      }
      if (!streaming) { setDone(true); onEnded?.(); }
      return undefined;
    }
    if (s.kind === 'a' && !revealed.has(index)) return undefined; // waits for "Show answer"
    const key = `${index}:${target}:${voiceOn}:${rate}`;
    if (saying.current === key) return undefined;
    saying.current = key;
    setStep(target);
    say(s.speak, () => setSpoken(target));
    return undefined;
  }, [playing, active, board, steps, spoken, index, boards.length, streaming, revealed, done, say, voiceOn, rate, onEnded]);

  useEffect(() => () => stopSpeech(), []);
  useEffect(() => { if (!active) { stopSpeech(); } else setSpoken(x => Math.min(x, step - 1)); /* resume the current step */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const go = (i) => {
    if (i < 0 || i >= boards.length) return;
    stopSpeech(); setDone(false); setIndex(i);
    if (playing) { setStep(-1); setSpoken(-1); }
    else { const n = stepsOf(boards[i]).length - 1; setStep(n); setSpoken(n); } // paused: show the whole board
  };
  const restartStep = () => { stopSpeech(); setSpoken(Math.max(-1, step - 1)); };
  const togglePlay = () => {
    if (playing) { stopSpeech(); setPlaying(false); return; }
    if (done) { setDone(false); setIndex(0); setStep(-1); setSpoken(-1); } else restartStep();
    setPlaying(true);
  };
  const reveal = () => { const n = new Set(revealed); n.add(index); setRevealed(n); };
  const replay = () => { stopSpeech(); setDone(false); setStep(-1); setSpoken(-1); setPlaying(true); };

  if (!board) {
    return (
      <div className="board-card h-full rounded-[26px] bg-gradient-to-br from-pine-800 via-pine-900 to-pine-950 p-6 flex flex-col items-center justify-center text-center text-pine-100">
        <span className="board-loader" aria-hidden="true"><i /><i /><i /></span>
        <p className="mt-5 font-display text-[18px] font-bold text-white">Lekha is preparing your lesson</p>
        <p className="mt-1 text-[13px] text-pine-100/65">Reading the module and building the boards…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* story-style progress */}
      <div className="shrink-0 flex gap-1 mb-3" aria-label="Boards">
        {boards.map((b, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Board ${i + 1}: ${b.title || BOARD_TYPES[b.type]?.label || ''}`} className="flex-1 h-1.5 rounded-full bg-pine-800/15 overflow-hidden">
            <span className={`block h-full rounded-full bg-pine-800 transition-all duration-500 ${i < index ? 'w-full' : i === index ? (done ? 'w-full' : 'board-progress') : 'w-0'}`}
              style={i === index && !done ? { width: `${steps.length ? Math.round(((step + 1) / steps.length) * 100) : 0}%` } : undefined} />
          </button>
        ))}
        {streaming && <span className="w-4 h-1.5 rounded-full bg-pine-800/15 board-pending" aria-hidden="true" />}
      </div>

      <div className="relative flex-1 min-h-[240px]">
        {done && ending ? (
          <div className="board-enter h-full">{ending}</div>
        ) : (
          <div key={index} className="board-enter h-full">
            <Board board={board} index={index} total={boards.length + (streaming ? 1 : 0)} step={step} steps={steps}
              revealed={revealed.has(index)} onReveal={reveal} fontFamily={fontFamily} dir={dir} />
          </div>
        )}
        {!board.complete && step + 1 >= steps.length && (
          <p className="absolute bottom-3 inset-x-0 text-center text-[12px] text-pine-100/60" dir="ltr">Writing the rest of this board…</p>
        )}
      </div>

      {/* controls */}
      <div className="shrink-0 mt-3 flex items-center justify-between gap-2" dir="ltr">
        <button onClick={() => { setVoiceOn(v => !v); restartStep(); }} className="w-10 h-10 rounded-full bg-white ring-1 ring-pine-800/10 text-pine-900 flex items-center justify-center active:scale-95" aria-label={voiceOn ? 'Turn voice off' : 'Turn voice on'}>
          {voiceOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        <div className="flex items-center gap-2.5">
          <button onClick={() => go(index - 1)} disabled={index === 0} className="w-11 h-11 rounded-full bg-white ring-1 ring-pine-800/10 text-pine-900 flex items-center justify-center active:scale-95 disabled:opacity-35" aria-label="Previous board"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={togglePlay} className="relative w-14 h-14 rounded-full bg-pine-950 text-pine-100 flex items-center justify-center shadow-[0_12px_24px_-12px_rgba(5,31,32,.9)] active:scale-95 transition" aria-label={playing && !done ? 'Pause' : 'Play'}>
            {playing && !done && <span className="tutor-ping absolute inset-0 rounded-full" aria-hidden="true" />}
            {playing && !done ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>
          <button onClick={() => go(index + 1)} disabled={index + 1 >= boards.length} className="w-11 h-11 rounded-full bg-white ring-1 ring-pine-800/10 text-pine-900 flex items-center justify-center active:scale-95 disabled:opacity-35" aria-label="Next board"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={replay} className="w-10 h-10 rounded-full bg-white ring-1 ring-pine-800/10 text-pine-900 flex items-center justify-center active:scale-95" aria-label="Replay this board"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => { setRate(r => (r >= 1.25 ? 0.8 : r >= 1 ? 1.25 : 1)); restartStep(); }} className="h-10 px-2.5 rounded-full bg-white ring-1 ring-pine-800/10 text-pine-900 text-[12.5px] font-bold inline-flex items-center gap-1 active:scale-95" aria-label="Voice speed"><Gauge className="w-3.5 h-3.5" />{rate}x</button>
        </div>
      </div>
    </div>
  );
}
