import React, { useState } from 'react';
import { ArrowRight, QrCode, BookOpen, Award, Layers, Timer, Search } from 'lucide-react';
import { MobileHero } from './MobileWelcome';

/**
 * Landing hero (eduleb layout): headline, course search and actions on the left; the student in
 * front of a large forest-green circle on the right; a row of four counter cards underneath.
 */
export default function HeroSection({ onExploreClick, onRegisterClick, onVerifyClick, onSearch, courses = [] }) {
  const [query, setQuery] = useState('');
  const trackCount = courses.length || 4;
  const moduleCount = courses.reduce((n, c) => n + (c.modules?.length || 0), 0) || 60;

  const features = [
    { icon: Layers, value: trackCount, title: 'Career tracks', text: 'Python, SQL, Web Development and AI with Data Science.', tone: 'bg-brand-100 text-forest' },
    { icon: BookOpen, value: `${moduleCount}+`, title: 'Deep-dive modules', text: 'Mentor-written lessons, live code practice and a quiz after every module.', tone: 'bg-[#EFE9DC] text-charcoal' },
    { icon: Timer, value: '45 min', title: 'Proctored final', text: 'A proctored final assessment - 70% to pass.', tone: 'bg-[#E3ECE7] text-sage' },
    { icon: Award, value: '100%', title: 'Free certificates', text: 'Every certificate is unique and QR-verified.', tone: 'bg-forest text-ivory' }
  ];

  const submit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query.trim());
    else onExploreClick?.();
  };

  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="absolute inset-0 edu-shape pointer-events-none hidden lg:block" aria-hidden="true" />

      {/* below lg the hero is a full-width forest band */}
      <MobileHero onRegisterClick={onRegisterClick} onExploreClick={onExploreClick} onVerifyClick={onVerifyClick} />
      <div className="relative hidden lg:block">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
        <nav className="text-sm text-ivory/60 lg:text-charcoal/60" aria-label="Breadcrumb">Home <span className="mx-1.5 text-ivory/30 lg:text-charcoal/30">/</span> <a href="https://arshithgroup.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-ivory lg:text-sage hover:underline">arshithgroup.com</a></nav>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-6 items-center">
        {/* Copy */}
        <div className="relative z-10 pt-6 lg:pt-4 lg:pb-16 animate-fade-up">
          <p className="font-display text-[13px] font-semibold uppercase tracking-[0.24em] text-[#BCD1C6] lg:text-sage">Arshith Bootcamp</p>
          <h1 className="mt-3 lg:mt-4 text-[36px] sm:text-[52px] lg:text-[62px] leading-[1.1] text-ivory lg:text-evergreen">
            Achieve your career goals with <span className="text-[#BCD1C6] lg:text-sage">free online courses</span>
          </h1>
          <p className="mt-4 lg:mt-5 text-[15.5px] sm:text-[17px] text-ivory/80 lg:text-charcoal/70 leading-relaxed max-w-lg">
            Mentor-written programs in Python, SQL, Web Development and AI — with deep-dive modules, live code practice,
            quizzes after every module, a proctored final and a QR-verified certificate.
          </p>

          {/* course search (eduleb hero search bar) */}
          <form onSubmit={submit} className="mt-7 flex items-center max-w-lg rounded-md bg-white p-1.5 shadow-[0_20px_40px_-24px_rgba(1,58,43,.45)] ring-1 ring-brand-900/10">
            <Search className="w-5 h-5 text-charcoal/40 ml-3 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your course here"
              aria-label="Search courses"
              className="min-w-0 flex-1 h-11 px-3 text-[15px] text-charcoal bg-transparent outline-none placeholder:text-charcoal/45"
            />
            <button type="submit" className="font-display h-11 px-5 sm:px-6 rounded bg-forest text-ivory text-[15px] font-semibold hover:bg-sage transition-colors">Search</button>
          </form>

          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <button onClick={onRegisterClick} className="font-display w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-md bg-ivory text-forest lg:bg-forest lg:text-ivory px-7 py-3.5 text-[15.5px] font-semibold border border-ivory lg:border-forest hover:bg-white lg:hover:bg-sage lg:hover:border-sage transition group">
              Start Learning for Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={onExploreClick} className="font-display w-full sm:w-auto justify-center inline-flex items-center rounded-md border border-ivory/40 text-ivory lg:border-forest/25 lg:bg-white lg:text-forest px-7 py-3.5 text-[15.5px] font-semibold hover:bg-white/10 lg:hover:bg-white lg:hover:border-forest transition">
              Explore Courses
            </button>
          </div>

          <button onClick={onVerifyClick} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#BCD1C6] lg:text-sage hover:text-white lg:hover:text-forest transition-colors">
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

      {/* Our features as eduleb counter cards */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:-mt-6 pb-14">
        <h2 className="sr-only">Our Features</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {features.map(({ icon: Icon, value, title, text, tone }) => (
            <div key={title} className="edu-card p-3.5 sm:p-5 flex flex-col sm:flex-row gap-2.5 sm:gap-4 hover:-translate-y-1 transition-transform duration-300">
              <span className={`shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></span>
              <div className="min-w-0">
                <p className="font-display text-[28px] font-semibold leading-none text-evergreen">{value}</p>
                <p className="mt-1.5 font-display text-[15.5px] font-medium text-charcoal">{title}</p>
                <p className="mt-1 hidden sm:block text-[12.5px] text-charcoal/60 leading-snug">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
