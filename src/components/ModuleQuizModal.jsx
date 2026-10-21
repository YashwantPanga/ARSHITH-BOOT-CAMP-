import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, ArrowRight, CheckCircle2, XCircle, RefreshCw, ListChecks, AlertCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { cleanText } from '../utils/textUtils';
import { userIdOf, displayNameOf } from '../utils/session';
import { Spinner, BrandLoader } from './ui';

export const QuestionCard = ({ q, index, total, selected, onSelect, disabled = false }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between text-xs">
      <span className="chip bg-brand-50 text-brand-700">Question {index + 1} of {total}</span>
      {q.difficulty && <span className="chip bg-slate-100 text-slate-500 capitalize">{q.difficulty}</span>}
    </div>
    {q.topic && <p className="eyebrow">{cleanText(q.topic)}</p>}
    <h3 className="text-lg sm:text-xl font-semibold text-brand-900 leading-snug">{cleanText(q.questionText)}</h3>
    {q.codeSnippet && (
      <div className="code-block"><pre>{q.codeSnippet}</pre></div>
    )}
    <div className="grid gap-3" role="radiogroup">
      {(q.options || []).map((opt, i) => {
        const isSel = selected === i;
        return (
          <button
            key={i}
            role="radio"
            aria-checked={isSel}
            disabled={disabled}
            onClick={() => onSelect(i)}
            className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${isSel ? 'border-peach-500 bg-peach-50 ring-4 ring-peach-100' : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40'}`}
          >
            <span className={`w-8 h-8 rounded-xl text-sm font-bold flex items-center justify-center shrink-0 ${isSel ? 'bg-peach-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + i)}</span>
            <span className="pt-1 text-[15px] text-slate-700 whitespace-pre-wrap break-words">{opt}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export const ReviewList = ({ items = [] }) => (
  <div className="space-y-4">
    {items.map((q, i) => (
      <div key={q.id || i} className={`rounded-2xl border p-5 bg-white ${q.isCorrect ? 'border-mint-200' : 'border-rose-200'}`}>
        <div className="flex items-start gap-3">
          {q.isCorrect ? <CheckCircle2 className="w-5 h-5 text-mint-400 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
          <p className="font-medium text-brand-900">{i + 1}. {cleanText(q.questionText)}</p>
        </div>
        {q.codeSnippet && <div className="code-block mt-3"><pre>{q.codeSnippet}</pre></div>}
        <div className="mt-3 grid gap-2">
          {(q.options || []).map((o, k) => {
            const correct = k === q.correctAnswer;
            const chosen = k === q.selectedAnswer;
            return (
              <div key={k} className={`flex gap-3 px-3 py-2 rounded-xl text-sm ${correct ? 'bg-mint-50 text-mint-500 font-medium' : chosen ? 'bg-rose-50 text-rose-600' : 'text-slate-500'}`}>
                <span className="font-bold w-5">{String.fromCharCode(65 + k)}</span>
                <span className="flex-1 whitespace-pre-wrap">{o}</span>
                {correct && <span className="text-xs">Correct</span>}
                {chosen && !correct && <span className="text-xs">Your answer</span>}
              </div>
            );
          })}
          {q.selectedAnswer === null && <p className="text-xs text-rose-500 px-3">Not answered</p>}
        </div>
        {q.explanation && <p className="mt-3 text-sm text-slate-500 bg-slate-50 rounded-xl p-3"><strong className="text-slate-600">Explanation:</strong> {cleanText(q.explanation)}</p>}
      </div>
    ))}
  </div>
);

export default function ModuleQuizModal({ isOpen, onClose, module, moduleNumber, courseId, studentUser, hasNextModule, onSubmitted, onContinueNextModule }) {
  const [phase, setPhase] = useState('loading'); // loading | error | taking | submitting | result | review
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const bodyRef = useRef(null);

  const load = async () => {
    setPhase('loading');
    setError('');
    setIdx(0);
    setAnswers({});
    setResult(null);
    try {
      const res = await api.getModuleQuiz(module.id);
      if (!res.questions?.length) throw new Error('No questions found for this module.');
      setQuestions(res.questions);
      setPhase('taking');
    } catch (err) {
      setError(err.message || 'Could not load the quiz.');
      setPhase('error');
    }
  };

  useEffect(() => {
    if (isOpen && module?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, module?.id]);

  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [idx, phase]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && phase !== 'submitting') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [isOpen, phase, onClose]);

  if (!isOpen || !module) return null;

  const total = questions.length;
  const answered = Object.keys(answers).length;
  const q = questions[idx];

  const submit = async () => {
    setPhase('submitting');
    try {
      const res = await api.submitModuleQuiz(module.id, {
        userId: userIdOf(studentUser),
        studentName: displayNameOf(studentUser),
        courseId,
        answers
      });
      setResult(res.result);
      setPhase('result');
      onSubmitted?.(res.result);
      if (res.result.passed) confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: ['#426557', '#013A2B', '#5F8574', '#90B1A2'] });
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
      setPhase('taking');
    }
  };

  return (
    <div data-quiz-modal className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-brand-950/50 backdrop-blur-sm animate-fade-in" onClick={() => phase !== 'submitting' && onClose()} />
      <div className="relative w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[92vh] bg-white sm:rounded-3xl shadow-2xl flex flex-col animate-scale-in">
        <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0">
          <span className="w-10 h-10 rounded-xl bg-peach-50 text-peach-500 flex items-center justify-center"><ListChecks className="w-5 h-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Module {moduleNumber} quiz</p>
            <p className="text-sm font-semibold text-brand-900 truncate">{cleanText(module.title)}</p>
          </div>
          <button onClick={onClose} disabled={phase === 'submitting'} className="p-2 rounded-xl hover:bg-slate-100" aria-label="Close quiz"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {phase === 'taking' && total > 0 && (
          <div className="px-5 sm:px-6 pt-4 shrink-0">
            <div className="flex gap-1.5">
              {questions.map((qq, i) => (
                <button key={qq.id} onClick={() => setIdx(i)} aria-label={`Question ${i + 1}`}
                  className={`h-2 flex-1 rounded-full transition ${i === idx ? 'bg-peach-500' : answers[qq.id] !== undefined ? 'bg-brand-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        )}

        <div ref={bodyRef} className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-6">
          {phase === 'loading' && <div className="py-16 flex justify-center"><BrandLoader label="Preparing quiz" /></div>}
          {phase === 'submitting' && <div className="py-16 flex justify-center"><BrandLoader label="Grading your answers" /></div>}
          {phase === 'error' && (
            <div className="py-12 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="mt-3 text-sm text-slate-600">{error}</p>
              <button onClick={load} className="btn-outline mt-5"><RefreshCw className="w-4 h-4" /> Try again</button>
            </div>
          )}

          {phase === 'taking' && q && (
            <div key={q.id} className="animate-fade-in">
              {error && <p className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-sm">{error}</p>}
              <QuestionCard q={q} index={idx} total={total} selected={answers[q.id]} onSelect={(i) => setAnswers(a => ({ ...a, [q.id]: i }))} />
            </div>
          )}

          {phase === 'result' && result && (
            <div className="text-center py-4 animate-fade-up">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${result.passed ? 'bg-mint-50 text-mint-400' : 'bg-rose-50 text-rose-500'}`}>
                {result.passed ? <Trophy className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
              </div>
              <h3 className="mt-4 text-2xl font-bold text-brand-900">{result.passed ? 'Module complete!' : 'Not passed yet'}</h3>
              <p className="text-slate-500 mt-1">{result.passed ? 'Great work — this module is now marked complete.' : 'You need 70% to pass. Review the module and try again.'}</p>
              <div className="mt-6 grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <Stat label="Score" value={`${result.score}/${result.totalQuestions}`} />
                <Stat label="Percentage" value={`${result.percentage}%`} tone={result.passed ? 'text-mint-500' : 'text-rose-500'} />
                <Stat label="Attempt" value={`#${result.attemptNumber}`} />
              </div>
            </div>
          )}

          {phase === 'review' && result && <ReviewList items={result.questionsReview} />}
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 shrink-0 flex flex-wrap items-center justify-between gap-2">
          {phase === 'taking' && (
            <>
              <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className="btn-outline"><ArrowLeft className="w-4 h-4" /> Back</button>
              <span className="text-xs text-slate-400 order-last w-full text-center sm:order-none sm:w-auto">{answered}/{total} answered</span>
              {idx < total - 1 ? (
                <button onClick={() => setIdx(i => i + 1)} className="btn-plum">Next <ArrowRight className="w-4 h-4" /></button>
              ) : (
                <button onClick={submit} disabled={answered < total} className="btn-primary" title={answered < total ? 'Answer every question to submit' : ''}>Submit quiz</button>
              )}
            </>
          )}
          {phase === 'result' && (
            <>
              <button onClick={() => setPhase('review')} className="btn-outline">Review answers</button>
              {result?.passed ? (
                hasNextModule ? <button onClick={onContinueNextModule} className="btn-primary">Next module <ArrowRight className="w-4 h-4" /></button>
                  : <button onClick={onClose} className="btn-primary">Done</button>
              ) : (
                <button onClick={load} className="btn-primary"><RefreshCw className="w-4 h-4" /> Retake quiz</button>
              )}
            </>
          )}
          {phase === 'review' && (
            <>
              <button onClick={() => setPhase('result')} className="btn-outline"><ArrowLeft className="w-4 h-4" /> Result</button>
              <button onClick={result?.passed ? onClose : load} className="btn-primary">{result?.passed ? 'Close' : 'Retake quiz'}</button>
            </>
          )}
          {(phase === 'loading' || phase === 'error' || phase === 'submitting') && <span />}
        </div>
      </div>
    </div>
  );
}

const Stat = ({ label, value, tone = 'text-brand-900' }) => (
  <div className="rounded-2xl bg-slate-50 p-3">
    <p className="text-[11px] text-slate-400">{label}</p>
    <p className={`text-lg font-bold ${tone}`}>{value}</p>
  </div>
);
