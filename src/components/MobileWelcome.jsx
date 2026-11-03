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
