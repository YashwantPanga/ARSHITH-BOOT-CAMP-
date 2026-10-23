import React from 'react';
import { Check } from 'lucide-react';
import { Reveal, SafeImg } from './ui';
import { IMAGES } from '../data/meta';

const STEPS = [
  { title: 'Read 15 deep-dive modules', text: 'Concepts, worked code, common mistakes and best practices — written like a textbook, not a playlist.', tone: 'bg-brand-100 text-forest' },
  { title: 'Complete every module quiz', text: 'A 5-question quiz closes each module. Finish it to mark the module complete.', tone: 'bg-[#EFE9DC] text-charcoal' },
  { title: 'Take the proctored final', text: 'The 45-minute final unlocks after every module quiz and one project repository, with camera, tab and fullscreen monitoring.', tone: 'bg-[#E3ECE7] text-sage' },
  { title: 'Earn a unique certificate', text: 'Score 70%+ and download a certificate with your exact score and a one-of-a-kind verification ID.', tone: 'bg-forest text-ivory' }
];

/** "How it works" in the eduleb about layout (image + checklist) with numbered step cards below. */
export default function WhyLearnWithUs() {
  return (
    <section className="relative py-16 md:py-24 bg-cream overflow-hidden">
      <div className="absolute inset-0 edu-shape pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <Reveal>
            <div className="relative mx-auto max-w-md">
              <div className="absolute -left-4 -top-4 w-full h-full rounded-[28px] border-2 border-sage/30" aria-hidden="true" />
              <div className="relative rounded-[28px] overflow-hidden shadow-[0_30px_60px_-30px_rgba(1,58,43,.5)] aspect-[4/5] sm:aspect-[5/5]">
                <SafeImg src={IMAGES.portrait} alt="Learner with books" className="w-full h-full object-cover" />
              </div>
            </div>
          </Reveal>

          <Reveal>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">How it works</p>
            <h2 className="edu-title mt-2 text-3xl sm:text-[38px] leading-tight">Construct a stunning career perspective — <b>one verified step at a time</b></h2>
            <p className="mt-4 text-charcoal/70 leading-relaxed max-w-xl">Every course follows the same honest path. Nothing is skipped, and your certificate shows exactly what you scored.</p>
            <ul className="mt-6 space-y-3">
              {['70% pass mark for the final assessment', '3 mini projects'].map(t => (
                <li key={t} className="flex items-center gap-3 font-display text-[16.5px] font-medium text-evergreen">
                  <span className="w-7 h-7 rounded-full bg-forest text-ivory flex items-center justify-center shrink-0"><Check className="w-4 h-4" /></span>{t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 90}>
              <div className="edu-card h-full p-7 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center gap-4">
                  <span className={`w-[58px] h-[58px] rounded-full flex items-center justify-center font-display text-[24px] font-semibold shrink-0 ${s.tone}`}>0{i + 1}</span>
                  <h3 className="font-display text-[18px] font-semibold text-evergreen leading-snug">{s.title}</h3>
                </div>
                <p className="mt-5 text-[14.5px] leading-relaxed text-charcoal/65">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
