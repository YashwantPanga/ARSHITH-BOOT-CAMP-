import React from 'react';
import { BookOpen, ListChecks, ShieldCheck, Award, Briefcase, LineChart } from 'lucide-react';
import { Reveal, SafeImg, Triangles } from './ui';
import { IMAGES } from '../data/meta';

const STEPS = [
  { icon: BookOpen, title: 'Read 15 deep-dive modules', text: 'Concepts, worked code, common mistakes and best practices — written like a textbook, not a playlist.', tone: 'bg-brand-900 text-white' },
  { icon: ListChecks, title: 'Complete every module quiz', text: 'A 5-question quiz closes each module. Finish it to mark the module complete.', tone: 'bg-white text-brand-900' },
  { icon: ShieldCheck, title: 'Take the proctored final', text: 'The 45-minute final unlocks only after all quizzes are passed, with camera, tab and fullscreen monitoring.', tone: 'bg-white text-brand-900' },
  { icon: Award, title: 'Earn a unique certificate', text: 'Score 70%+ and download a certificate with your exact score and a one-of-a-kind verification ID.', tone: 'bg-white text-brand-900' }
];

export default function WhyLearnWithUs() {
  return (
    <section className="relative py-20 md:py-28 bg-white overflow-hidden">
      <Triangles />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <Reveal className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm">
              <div className="absolute -left-6 -top-6 w-40 h-40 rounded-3xl bg-peach-100" />
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/5]">
                <SafeImg src={IMAGES.portrait} alt="Learner with books" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -right-4 bottom-10 bg-brand-900 text-white rounded-2xl p-4 shadow-xl w-44">
                <LineChart className="w-5 h-5 text-peach-400" />
                <p className="text-2xl font-bold mt-2">70%</p>
                <p className="text-xs text-brand-200">pass mark for every quiz &amp; the final</p>
              </div>
              <div className="absolute -left-4 bottom-0 bg-mint-400 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2">
                <Briefcase className="w-4 h-4" /><span className="text-sm font-semibold">3 mini projects</span>
              </div>
            </div>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal>
              <p className="eyebrow">How it works</p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-brand-900 leading-tight">Construct a stunning career perspective — one verified step at a time</h2>
              <p className="mt-3 text-slate-500 max-w-2xl">Every course follows the same honest path. Nothing is skipped, and your certificate shows exactly what you scored.</p>
            </Reveal>

            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 90}>
                  <div className={`h-full rounded-2xl p-6 border ${i === 0 ? 'border-brand-900' : 'border-slate-200'} ${s.tone} card-hover`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-white/10 text-peach-400' : 'bg-peach-50 text-peach-500'}`}>
                        <s.icon className="w-5 h-5" />
                      </span>
                      <span className={`text-xs font-semibold ${i === 0 ? 'text-brand-200' : 'text-slate-400'}`}>Step 0{i + 1}</span>
                    </div>
                    <h3 className="mt-4 font-bold text-[17px]">{s.title}</h3>
                    <p className={`mt-1.5 text-sm leading-relaxed ${i === 0 ? 'text-brand-100' : 'text-slate-500'}`}>{s.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
