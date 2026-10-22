import React from 'react';
import { ArrowRight, ShieldCheck, QrCode, BookOpen, Award, Layers, Timer } from 'lucide-react';
import HeroSlideshow from './HeroSlideshow';

export default function HeroSection({ onExploreClick, onRegisterClick, onVerifyClick, courses = [] }) {
  const trackCount = courses.length || 4;
  const moduleCount = courses.reduce((n, c) => n + (c.modules?.length || 0), 0) || 60;

  return (
    <section className="relative overflow-hidden bg-ivory">
      <div className="absolute inset-0 texture-dots opacity-60 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
        <nav className="text-sm text-charcoal/60" aria-label="Breadcrumb">Home <span className="mx-1.5 text-charcoal/30">›</span> <a href="https://arshithgroup.com" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:underline">arshithgroup.com</a></nav>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-0 grid lg:grid-cols-12 gap-10 items-center">
        {/* Copy */}
        <div className="relative z-10 lg:col-span-6 pt-8 lg:pt-0 lg:pb-24 animate-fade-up">
          <p className="font-display text-[28px] sm:text-[34px] leading-none text-brand-900 uppercase tracking-[0.06em]">
            Arshith <span className="text-sage">Bootcamp</span>
          </p>
          <h1 className="mt-4 text-display-xl text-charcoal">
            Achieve your career goals with <em className="not-italic font-semibold text-brand-900">free online courses</em>
          </h1>
          <p className="mt-6 text-[17px] sm:text-lg text-charcoal/70 leading-relaxed max-w-xl">
            Mentor-written programs in Python, SQL, Web Development and AI — with deep-dive modules, live code practice,
            quizzes after every module, a proctored final and a QR-verified certificate.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={onRegisterClick} className="btn-primary px-7 py-4 text-[15px] group">
              Start Learning for Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={onExploreClick} className="btn-outline px-7 py-4 text-[15px]">Explore Courses</button>
          </div>

          <button onClick={onVerifyClick} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sage hover:text-brand-900 transition-colors">
            <QrCode className="w-4 h-4" /> Have a certificate? Verify it by ID or QR scan
          </button>
        </div>

        {/* Visual: concentric circles + portrait like the reference */}
        <div className="lg:col-span-6 relative h-[440px] sm:h-[540px] lg:h-[600px] animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="absolute left-1/2 lg:left-auto lg:-right-24 -translate-x-1/2 lg:translate-x-0 bottom-[-60px] lg:bottom-[-120px] w-[440px] h-[440px] sm:w-[540px] sm:h-[540px] lg:w-[680px] lg:h-[680px] rounded-full bg-brand-100/70" />
          <div className="absolute left-1/2 lg:left-auto lg:-right-4 -translate-x-1/2 lg:translate-x-0 bottom-[-40px] lg:bottom-[-80px] w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] lg:w-[520px] lg:h-[520px] rounded-full bg-brand-200/70" />
          <div className="absolute left-1/2 lg:left-auto lg:right-10 -translate-x-1/2 lg:translate-x-0 bottom-0 w-[300px] h-[400px] sm:w-[380px] sm:h-[500px] rounded-t-full overflow-hidden ring-[10px] ring-ivory/70 shadow-floating">
            <HeroSlideshow />
          </div>

          <div className="absolute z-10 left-0 sm:left-4 lg:left-0 top-[38%] bg-white/80 backdrop-blur-md ring-1 ring-white/60 rounded-2xl shadow-floating px-5 py-4 animate-drift" style={{ animationDuration: '8s' }}>
            <p className="font-display text-3xl font-semibold text-brand-900 leading-none">{moduleCount}+</p>
            <p className="text-sm text-charcoal/70 mt-1">Free learning modules</p>
          </div>

          <div className="absolute z-10 right-0 sm:right-2 top-10 bg-brand-900/90 backdrop-blur-md text-ivory rounded-2xl shadow-floating px-4 py-3 flex items-center gap-3 animate-drift" style={{ animationDuration: '10s', animationDelay: '1s' }}>
            <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><QrCode className="w-5 h-5" /></span>
            <div>
              <p className="text-[11px] text-brand-200">Certificate</p>
              <p className="text-sm font-semibold">QR-verified &amp; unique</p>
            </div>
          </div>

          <div className="absolute z-10 left-6 sm:left-16 bottom-10 bg-white/80 backdrop-blur-md ring-1 ring-white/60 rounded-2xl shadow-floating px-4 py-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></span>
            <div>
              <p className="text-[11px] text-charcoal/50">Final assessment</p>
              <p className="text-sm font-semibold text-charcoal">Proctored · 70% to pass</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip – mirrors the rating strip in the reference */}
      <div className="relative border-t border-brand-900/10 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-y-4 divide-x divide-brand-900/10">
          <Stat icon={Layers} value={trackCount} label="Career tracks" />
          <Stat icon={BookOpen} value={moduleCount} label="Deep-dive modules" />
          <Stat icon={Timer} value="45 min" label="Proctored final" />
          <Stat icon={Award} value="100%" label="Free certificates" />
        </div>
      </div>
    </section>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center justify-center gap-3 px-3">
      <Icon className="w-5 h-5 text-sage shrink-0" />
      <span className="font-display text-2xl font-semibold text-brand-900">{value}</span>
      <span className="text-sm text-charcoal/60 hidden sm:inline">{label}</span>
    </div>
  );
}
