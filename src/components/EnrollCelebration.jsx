import React, { useEffect, useMemo } from 'react';
import { ArrowRight, BookOpen, ListChecks, Award, X } from 'lucide-react';
import { courseArt } from './CourseCard';
import { displayTitle } from '../utils/textUtils';

const CONFETTI_COLORS = ['#013A2B', '#426557', '#E0B54A', '#BCD1C6', '#7DB59A', '#FBF8F1'];

/**
 * Shown right after a learner enrols: a gift box opens, the course card rises out of it, a FREE (or,
 * after a payment, PAID) stamp lands on the course fee and confetti bursts. "Start learning" opens the first module.
 */
export default function EnrollCelebration({ course, learnerName, paid = 0, onStart, onClose }) {
  const first = String(learnerName || '').trim().split(/\s+/)[0];
  const modules = course?.modules?.length || 0;

  // Confetti pieces with their own direction, spin, delay and colour
  const pieces = useMemo(() => Array.from({ length: 46 }, (_, i) => {
    const angle = (i / 46) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 160 + Math.random() * 220;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 120,
      r: Math.round(Math.random() * 720 - 360),
      d: Math.random() * 0.25,
      c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 6 + Math.round(Math.random() * 6),
      round: i % 3 === 0
    };
  }), []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  if (!course) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-evergreen/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="enroll-done-title">
      <div className="relative w-full max-w-md rounded-[24px] bg-ivory shadow-2xl overflow-hidden en-card">
        <button onClick={onClose} className="absolute top-3 right-3 z-20 p-2 rounded-full text-charcoal/50 hover:bg-cream" aria-label="Close"><X className="w-4 h-4" /></button>

        {/* stage: rays, confetti, gift box with the course card rising out */}
        <div className="relative h-[230px] bg-[radial-gradient(120%_90%_at_50%_100%,#0E5C45,#013A2B_70%)] overflow-hidden">
          <div className="en-rays absolute left-1/2 top-[62%] w-[520px] h-[520px] -ml-[260px] -mt-[260px]" aria-hidden="true" />
          <div className="absolute left-1/2 top-[58%]" aria-hidden="true">
            {pieces.map((p, i) => (
              <span
                key={i}
                className="en-confetti absolute"
                style={{
                  '--x': `${p.x}px`, '--y': `${p.y}px`, '--r': `${p.r}deg`,
                  animationDelay: `${0.55 + p.d}s`,
                  width: p.w, height: p.round ? p.w : p.w * 0.45,
                  background: p.c, borderRadius: p.round ? '50%' : '2px'
                }}
              />
            ))}
          </div>

          {/* course card rising out of the box */}
          <div className="en-rise absolute z-20 left-1/2 bottom-[54px] w-[190px] -ml-[95px] rounded-xl overflow-hidden ring-4 ring-ivory shadow-2xl bg-forest">
            <img src={courseArt(course)} alt="" className="w-full aspect-[16/10] object-cover" />
          </div>

          {/* gift box */}
          <div className="absolute left-1/2 bottom-0 w-[170px] -ml-[85px]" aria-hidden="true">
            <div className="en-lid relative z-10 mx-auto w-[184px] -ml-[7px] h-[30px] rounded-md bg-[#E0B54A] shadow-lg">
              <span className="absolute left-1/2 top-0 bottom-0 w-6 -ml-3 bg-[#B98F2E]" />
              <span className="absolute left-1/2 -top-5 -ml-9 w-8 h-6 rounded-full border-[5px] border-[#B98F2E] -rotate-12" />
              <span className="absolute left-1/2 -top-5 ml-1 w-8 h-6 rounded-full border-[5px] border-[#B98F2E] rotate-12" />
            </div>
            <div className="relative h-[58px] rounded-b-md bg-[#F0C75E]">
              <span className="absolute left-1/2 top-0 bottom-0 w-6 -ml-3 bg-[#B98F2E]" />
            </div>
          </div>
        </div>

        <div className="px-6 pt-6 pb-6 text-center">
          <p className="en-up font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage" style={{ animationDelay: '.7s' }}>Enrolment confirmed</p>
          <h2 id="enroll-done-title" className="en-up mt-1.5 text-[25px] leading-tight font-bold text-evergreen" style={{ animationDelay: '.8s' }}>
            {first ? `Congratulations, ${first}!` : 'Congratulations!'}
          </h2>
          <p className="en-up mt-2 text-[15px] text-charcoal/70" style={{ animationDelay: '.9s' }}>
            <strong className="text-evergreen">{displayTitle(course.title)}</strong> is now yours.
          </p>

          {/* course fee with the FREE / PAID stamp */}
          <div className="en-up relative mt-5 mx-auto w-fit rounded-xl border border-dashed border-sage/50 bg-white pl-6 pr-24 py-3 text-left" style={{ animationDelay: '1s' }}>
            <p className="text-[12px] uppercase tracking-[0.18em] text-charcoal/50">Course fee</p>
            <p className="font-display text-[28px] font-bold text-evergreen leading-none mt-1">₹{paid}</p>
            <span className="en-stamp absolute right-3 top-1/2 -mt-4 rotate-[-14deg] rounded-md border-[3px] border-[#2F7A5C] text-[#2F7A5C] bg-ivory/90 font-display font-bold text-[17px] tracking-[0.12em] px-2.5 py-0.5">{paid ? 'PAID' : 'FREE'}</span>
          </div>

          <ul className="en-up mt-5 flex flex-wrap justify-center gap-2 text-[13px] text-charcoal/75" style={{ animationDelay: '1.15s' }}>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5"><BookOpen className="w-3.5 h-3.5 text-sage" />{modules} modules</li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5"><ListChecks className="w-3.5 h-3.5 text-sage" />{modules} quizzes</li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5"><Award className="w-3.5 h-3.5 text-sage" />Certificate</li>
          </ul>

          <button onClick={onStart} className="en-up en-cta font-display mt-6 w-full h-12 rounded-md bg-forest text-ivory text-[16px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-sage transition-colors" style={{ animationDelay: '1.3s' }}>
            Start learning <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="en-up mt-2 text-[13.5px] font-medium text-charcoal/55 hover:text-forest" style={{ animationDelay: '1.4s' }}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}
