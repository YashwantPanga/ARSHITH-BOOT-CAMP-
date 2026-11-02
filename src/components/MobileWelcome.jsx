import React from 'react';
import { Rocket, Shuffle, TrendingUp, Binoculars, ChevronRight } from 'lucide-react';
import { RevealText } from './ui';

/** Phones: hero band in the reference style - picture in a curved shape, centred heading, one wide button. */
export function MobileHero({ onRegisterClick, onExploreClick, onVerifyClick }) {
  return (
    <section className="lg:hidden relative overflow-hidden bg-forest text-ivory px-5 pt-7 pb-9 text-center">
      <div className="relative mx-auto h-[250px] w-full max-w-[330px]" aria-hidden="true">
        {/* two curved bands behind the student */}
        <span className="absolute left-[-6%] top-[26%] h-[150px] w-[112%] rounded-[90px] -rotate-[18deg] bg-gradient-to-r from-[#BCD1C6] to-[#5F8574] opacity-90" />
        <span className="absolute left-[6%] top-[8%] h-[150px] w-[94%] rounded-[90px] rotate-[14deg] bg-gradient-to-r from-[#426557] to-[#90B1A2] opacity-70" />
        <img src="/hero-student.webp" alt="" width="950" height="1000" fetchpriority="high"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[250px] w-auto max-w-none object-contain [mask-image:linear-gradient(to_bottom,#000_88%,transparent)]" />
      </div>
      <p className="mt-6 font-display text-[12.5px] font-semibold uppercase tracking-[0.24em] text-[#BCD1C6]">CodeLekho</p>
      <RevealText as="h1" className="mt-2 text-[31px] leading-[1.12] font-bold text-ivory">Achieve your career goals with <span className="text-[#BCD1C6]">free online courses</span></RevealText>
      <p className="mt-3 text-[15px] leading-relaxed text-ivory/85">
        Mentor-written programs in Python, SQL, Web Development and AI — with deep-dive modules, live code practice,
        quizzes after every module, a proctored final and a QR-verified certificate.
      </p>
      <button onClick={onRegisterClick} className="font-display mt-6 w-full h-12 rounded-md bg-ivory text-forest text-[16px] font-semibold active:scale-[.99] transition">Start Learning for Free</button>
      <p className="mt-3 text-[13.5px] text-ivory/80">
        or <button onClick={onExploreClick} className="font-semibold text-ivory underline underline-offset-2">explore all courses</button>
        <span className="mx-1.5 text-ivory/40">·</span>
        <button onClick={onVerifyClick} className="font-semibold text-ivory underline underline-offset-2">verify a certificate</button>
      </p>
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
    <section className="sm:hidden px-4 pb-7">
      <div className="rounded-[22px] bg-white p-4 ring-1 ring-pine-800/10 shadow-[0_18px_36px_-28px_rgba(5,31,32,.7)]">
        <h2 className="font-display text-[17px] font-bold text-pine-950">What brings you to CodeLekho?</h2>
        <div className="mt-3 grid gap-2">
          {items.map(({ icon: Icon, label, go }) => (
            <button key={label} onClick={go} className="flex items-center gap-3 rounded-2xl bg-[#F3F8F4] p-2.5 text-left active:scale-[.99] active:bg-pine-100 transition">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-pine-700 to-pine-950 text-pine-100 flex items-center justify-center shrink-0"><Icon className="w-[18px] h-[18px]" /></span>
              <span className="flex-1 text-[14px] font-semibold text-pine-950">{label}</span>
              <ChevronRight className="w-4 h-4 text-pine-700/50" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
