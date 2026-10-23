import React from 'react';
import { ArrowRight, QrCode, BookOpen, Award, Layers, Timer, Code2, Database, Globe } from 'lucide-react';

/* Track icons for the "Free learning" card, in the site palette. */
const TRACKS = [
  { key: 'python', icon: Code2, color: 'text-[#2F6FB1]' },
  { key: 'sql', icon: Database, color: 'text-[#B45309]' },
  { key: 'web', icon: Globe, color: 'text-[#0F766E]' }
];

/**
 * Landing hero: headline and actions on the left; on the right a student in front of a large
 * forest-green circle; the free-modules card and "Our features" underneath.
 */
export default function HeroSection({ onExploreClick, onRegisterClick, onVerifyClick, courses = [] }) {
  const trackCount = courses.length || 4;
  const moduleCount = courses.reduce((n, c) => n + (c.modules?.length || 0), 0) || 60;

  const features = [
    { icon: Layers, title: `${trackCount} career tracks`, text: 'Python, SQL, Web Development and AI with Data Science.' },
    { icon: BookOpen, title: `${moduleCount} deep-dive modules`, text: 'Mentor-written lessons, live code practice and a quiz after every module.' },
    { icon: Timer, title: '45-min proctored final', text: 'A proctored final assessment - 70% to pass.' },
    { icon: Award, title: '100% free certificates', text: 'Every certificate is unique and QR-verified.' }
  ];

  return (
    <section className="relative overflow-hidden bg-ivory">
      <div className="absolute inset-0 texture-dots opacity-50 pointer-events-none" aria-hidden="true" />

      {/* below lg the hero is a full-width forest band (mobile layout like Coursera's) */}
      <div className="relative bg-[radial-gradient(120%_80%_at_20%_0%,#0E5C45,#013A2B_60%)] lg:bg-none">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
        <nav className="text-sm text-ivory/60 lg:text-charcoal/60" aria-label="Breadcrumb">Home <span className="mx-1.5 text-ivory/30 lg:text-charcoal/30">›</span> <a href="https://arshithgroup.com" target="_blank" rel="noopener noreferrer" className="text-ivory lg:text-charcoal hover:underline">arshithgroup.com</a></nav>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-6 lg:gap-6 items-center">
        {/* Copy */}
        <div className="relative z-10 pt-6 lg:pt-4 lg:pb-16 animate-fade-up">
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-[#BCD1C6] lg:text-sage">Arshith Bootcamp</p>
          <h1 className="mt-3 lg:mt-4 font-display text-[36px] sm:text-[52px] lg:text-[66px] leading-[1.06] text-ivory lg:text-charcoal">
            Achieve your career goals with <span className="text-[#BCD1C6] lg:text-brand-900">free online courses</span>
          </h1>
          <p className="mt-4 lg:mt-6 text-[15.5px] sm:text-[17px] text-ivory/80 lg:text-charcoal/65 leading-relaxed max-w-md">
            Mentor-written programs in Python, SQL, Web Development and AI — with deep-dive modules, live code practice,
            quizzes after every module, a proctored final and a QR-verified certificate.
          </p>

          <div className="mt-7 lg:mt-9 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <button onClick={onRegisterClick} className="w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-lg bg-ivory text-brand-900 lg:bg-brand-900 lg:text-ivory px-7 py-4 text-[15px] font-semibold shadow-[0_14px_30px_-14px_rgba(0,0,0,.5)] lg:shadow-[0_14px_30px_-14px_rgba(1,58,43,.7)] hover:bg-white lg:hover:bg-forest hover:-translate-y-0.5 transition group">
              Start Learning for Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={onExploreClick} className="w-full sm:w-auto justify-center inline-flex items-center rounded-lg border border-ivory/40 text-ivory lg:border-brand-900/20 lg:bg-white/70 lg:text-brand-900 px-7 py-4 text-[15px] font-semibold hover:bg-white/10 lg:hover:bg-white lg:hover:border-brand-900/40 transition">
              Explore Courses
            </button>
          </div>

          <button onClick={onVerifyClick} className="mt-5 lg:mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#BCD1C6] lg:text-sage hover:text-white lg:hover:text-brand-900 transition-colors">
            <QrCode className="w-4 h-4" /> Have a certificate? Verify it by ID or QR scan
          </button>
        </div>

        {/* Visual */}
        <div className="relative h-[420px] sm:h-[540px] lg:h-[600px] animate-fade-up" style={{ animationDelay: '120ms' }}>
          {/* forest-green circle with the student standing in front of it (head rises above the circle) */}
          <div className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-10 bottom-10 w-[310px] h-[310px] sm:w-[420px] sm:h-[420px] lg:w-[450px] lg:h-[450px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#5F8574,#426557_70%)] lg:bg-[radial-gradient(circle_at_35%_30%,#0E5C45,#013A2B_70%)] shadow-[0_40px_80px_-40px_rgba(1,58,43,.65)]" aria-hidden="true" />
          <img
            src="/hero-student.webp"
            alt="A student learning online with a laptop and backpack"
            width="950" height="1000"
            fetchpriority="high"
            className="absolute z-[1] left-1/2 -translate-x-[47%] lg:left-auto lg:translate-x-0 lg:right-[18px] bottom-10 h-[370px] sm:h-[500px] lg:h-[560px] w-auto max-w-none object-contain [mask-image:linear-gradient(to_bottom,#000_86%,transparent)]"
          />
        </div>
      </div>
      </div>

      {/* Free modules card (like the feedback card) + Our features */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-4 pb-14 grid lg:grid-cols-[230px_1fr] gap-6 items-end">
        <div className="rounded-2xl bg-brand-100/80 ring-1 ring-brand-900/5 shadow-floating px-5 py-4 lg:-mt-24 lg:mb-2">
          <p className="font-display text-xl text-brand-900">Free learning</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex -space-x-2" aria-hidden="true">
              {TRACKS.map(({ key, icon: Icon, color }) => (
                <span key={key} className="w-8 h-8 rounded-full bg-white ring-2 ring-brand-100 flex items-center justify-center"><Icon className={`w-4 h-4 ${color}`} /></span>
              ))}
            </span>
            <p className="font-display text-3xl text-brand-900 leading-none">{moduleCount}+</p>
          </div>
          <p className="mt-1.5 text-[12px] text-charcoal/65">Free learning modules</p>
        </div>

        <div>
          <h2 className="font-display text-2xl sm:text-[28px] tracking-[0.08em] text-charcoal">Our Features</h2>
          <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group rounded-2xl bg-white shadow-[0_10px_30px_-18px_rgba(1,58,43,.35)] ring-1 ring-brand-900/5 p-4 flex gap-3.5 hover:-translate-y-1 hover:shadow-floating transition">
                <span className="shrink-0 w-11 h-11 rounded-xl bg-brand-900 text-ivory flex items-center justify-center group-hover:bg-forest transition-colors"><Icon className="w-5 h-5" /></span>
                <div className="min-w-0">
                  <p className="font-semibold text-[14.5px] text-charcoal leading-snug">{title}</p>
                  <p className="mt-1 text-[12.5px] text-charcoal/60 leading-snug">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
