import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Rocket, Shuffle, TrendingUp, Binoculars, ChevronRight, Play } from 'lucide-react';
import { RevealText } from './ui';
import { tokenLines } from '../utils/highlight';

const LazyPlayground = lazy(() => import('./CodePlayground').then(m => ({ default: m.PlaygroundModal })));

/** One short, runnable example per track for the phone hero. */
const EXAMPLES = [
  { id: 'python', label: 'Python', lang: 'python', title: 'Python example', code: ['name = "CodeLekho"', 'skills = ["Python", "SQL", "AI"]', '', 'for skill in skills:', '    print(f"{name} teaches {skill}")'].join('\n') },
  { id: 'sql', label: 'SQL', lang: 'sql', title: 'SQL example', code: ['SELECT department, COUNT(*) AS staff', 'FROM employees', 'GROUP BY department', 'ORDER BY staff DESC;'].join('\n') },
  { id: 'html', label: 'HTML', lang: 'html', title: 'HTML example', code: ['<!DOCTYPE html>', '<html>', '<body>', '  <h1>My first page</h1>', '  <p>Built on CodeLekho.</p>', '</body>', '</html>'].join('\n') },
  { id: 'js', label: 'JavaScript', lang: 'javascript', title: 'JavaScript example', code: ['const scores = [72, 88, 95];', 'const best = Math.max(...scores);', '', 'console.log(`Best score: ${best}`);'].join('\n') },
  { id: 'ai', label: 'AI & Data', lang: 'python', title: 'Data example', code: ['import statistics as st', '', 'marks = [64, 71, 88, 92, 79]', 'print("Average:", st.mean(marks))', 'print("Top mark:", max(marks))'].join('\n') }
];

/** Phones: a clean, centred hero - heading, track pills, a live code example and stacked actions. */
export function MobileHero({ onRegisterClick, onExploreClick, onVerifyClick, onInterviewClick }) {
  const [tab, setTab] = useState(0);
  const [trying, setTrying] = useState(null);
  const ex = EXAMPLES[tab];
  const lines = useMemo(() => tokenLines(ex.code, ex.lang), [ex]);
  return (
    <section className="lg:hidden relative overflow-hidden bg-[#051F20] text-[#DAF1DE] pt-8 pb-8">
      <span className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] rounded-full bg-[#235347] opacity-50 blur-3xl" aria-hidden="true" />
      <div className="relative px-5 text-center">
        <p className="m-hero-in font-display text-[12px] font-semibold uppercase tracking-[0.26em] text-[#8EB69B]">Free courses · Interview prep</p>
        <RevealText as="h1" className="mt-2 text-[30px] leading-[1.14] font-bold text-white">What do you want to learn?</RevealText>
        <p className="m-hero-in mt-2.5 text-[14.5px] leading-relaxed text-[#DAF1DE]/75" style={{ animationDelay: '120ms' }}>Pick a track and start right away. Every lesson comes with code you can run and edit in your browser.</p>
      </div>

      {/* track pills: scroll sideways */}
      <div className="relative mt-5 flex gap-2 overflow-x-auto no-scrollbar px-5 snap-x" role="tablist" aria-label="Choose a track">
        {EXAMPLES.map((e, i) => (
          <button key={e.id} role="tab" aria-selected={i === tab} onClick={() => setTab(i)}
            className={`snap-start shrink-0 h-9 px-4 rounded-full text-[13.5px] font-semibold border transition-all duration-300 ${i === tab ? 'bg-[#DAF1DE] text-[#051F20] border-[#DAF1DE] shadow-[0_6px_16px_-8px_rgba(218,241,222,.7)]' : 'bg-white/[.04] text-[#DAF1DE]/80 border-[#DAF1DE]/20'}`}>
            {e.label}
          </button>
        ))}
      </div>

      {/* code example card */}
      <div className="relative mx-4 mt-4 rounded-2xl bg-[#0B2B26] border border-[#8EB69B]/20 p-3 shadow-[0_24px_44px_-26px_rgba(0,0,0,.9)]">
        <div className="flex items-center gap-2 px-1 pb-2.5">
          <span className="flex gap-1.5" aria-hidden="true"><i className="w-2.5 h-2.5 rounded-full bg-[#8EB69B]" /><i className="w-2.5 h-2.5 rounded-full bg-[#235347]" /><i className="w-2.5 h-2.5 rounded-full bg-[#DAF1DE]/60" /></span>
          <span className="text-[12px] font-semibold text-[#DAF1DE]/80">{ex.title}</span>
        </div>
        <pre key={ex.id} className="m-code-swap rounded-xl bg-[#051F20] border-l-[3px] border-[#8EB69B] px-3.5 py-3 text-[12.5px] leading-[1.7] font-mono text-[#E9F1EC] overflow-x-auto no-scrollbar min-h-[150px]">
          {lines.map((toks, i) => (
            <span key={i} className="block whitespace-pre">{toks.length ? toks.map((t, k) => (t.t ? <span key={k} className={`tok-${t.t}`}>{t.v}</span> : <React.Fragment key={k}>{t.v}</React.Fragment>)) : ' '}</span>
          ))}
        </pre>
        <button onClick={() => setTrying({ code: ex.code, lang: ex.lang })} className="mt-3 inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#235347] text-[#DAF1DE] text-[14px] font-semibold border border-[#8EB69B]/30 active:scale-[.98] transition">
          <Play className="w-3.5 h-3.5 fill-current" /> Try it yourself
        </button>
      </div>

      {/* stacked actions */}
      <div className="relative mx-4 mt-4 grid gap-2.5">
        <button onClick={onRegisterClick} className="font-display h-12 rounded-xl bg-gradient-to-b from-[#DAF1DE] to-[#8EB69B] text-[#051F20] text-[16px] font-bold shadow-[0_3px_0_#235347] active:translate-y-[2px] active:shadow-none transition">Start learning for free</button>
        {[
          ['Interview Prep', onInterviewClick],
          ['Explore all courses', onExploreClick],
          ['Verify a certificate', onVerifyClick]
        ].map(([label, go]) => (
          <button key={label} onClick={go} className="h-11 rounded-xl bg-white/[.04] border border-[#DAF1DE]/15 text-[14.5px] font-semibold text-[#DAF1DE] flex items-center justify-center gap-1.5 active:bg-white/10 transition">
            {label} <ChevronRight className="w-4 h-4 text-[#8EB69B]" />
          </button>
        ))}
      </div>

      {trying && (
        <Suspense fallback={null}>
          <LazyPlayground initial={{ ...trying, key: Date.now() }} onClose={() => setTrying(null)} />
        </Suspense>
      )}
    </section>
  );
}

/** Phones: "What brings you here today?" card with four quick routes. */
export function WhatBringsYou({ onCourses, onCategories }) {
  const items = [
    { icon: Rocket, label: 'Start my career', go: onCourses },
    { icon: Shuffle, label: 'Change my career', go: onCategories },
    { icon: TrendingUp, label: 'Grow in my current role', go: onCourses },
    { icon: Binoculars, label: 'Explore topics outside of work', go: onCategories }
  ];
  return (
    <section className="sm:hidden px-4 py-6 bg-ivory">
      <div className="rounded-2xl border border-brand-900/15 bg-white p-4">
        <h2 className="text-center text-[19px] font-semibold text-evergreen">What brings you to CodeLekho today?</h2>
        <div className="mt-4 grid gap-2.5">
          {items.map(({ icon: Icon, label, go }) => (
            <button key={label} onClick={go} className="flex items-center gap-3 rounded-xl border border-brand-900/15 bg-white p-2.5 text-left active:bg-cream transition">
              <span className="w-10 h-10 rounded-lg bg-forest text-ivory flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
              <span className="flex-1 text-[14.5px] font-semibold text-charcoal">{label}</span>
              <ChevronRight className="w-4 h-4 text-charcoal/40" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
