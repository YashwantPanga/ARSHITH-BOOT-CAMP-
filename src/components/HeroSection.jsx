import React from 'react';
import { ArrowRight, ShieldCheck, QrCode, BookOpen, Award, Layers, Timer, Code2, Database, Globe, BrainCircuit, Star } from 'lucide-react';

/* Track tiles (top of the visual) and their accent colours, in the site palette. */
const TRACKS = [
  { key: 'python', label: 'Python', icon: Code2, color: 'text-[#2F6FB1]', bar: 'bg-[#2F6FB1]' },
  { key: 'sql', label: 'SQL', icon: Database, color: 'text-[#B45309]', bar: 'bg-[#E0A458]' },
  { key: 'web', label: 'Web', icon: Globe, color: 'text-[#0F766E]', bar: 'bg-sage' },
  { key: 'ai', label: 'AI', icon: BrainCircuit, color: 'text-[#6D28D9]', bar: 'bg-forest' }
];

const trackOf = (c) => {
  const t = `${c.id} ${c.title}`.toLowerCase();
  if (t.includes('python')) return 'python';
  if (t.includes('sql')) return 'sql';
  if (t.includes('web')) return 'web';
  return 'ai';
};

/**
 * Landing hero: headline and actions on the left; on the right a student in front of a large
 * forest-green circle, with floating cards for the tracks, modules per track, the QR-verified
 * certificate, the proctored final and the free modules; "Our features" underneath.
 */
export default function HeroSection({ onExploreClick, onRegisterClick, onVerifyClick, courses = [] }) {
  const trackCount = courses.length || 4;
  const moduleCount = courses.reduce((n, c) => n + (c.modules?.length || 0), 0) || 60;
  const perTrack = TRACKS.map(t => ({ ...t, modules: courses.filter(c => trackOf(c) === t.key).reduce((n, c) => n + (c.modules?.length || 0), 0) || 15 }));
  const maxModules = Math.max(...perTrack.map(t => t.modules), 1);

  const features = [
    { icon: Layers, title: `${trackCount} career tracks`, text: 'Python, SQL, Web Development and AI with Data Science.' },
    { icon: BookOpen, title: `${moduleCount} deep-dive modules`, text: 'Mentor-written lessons, live code practice and a quiz after every module.' },
    { icon: Timer, title: '45-min proctored final', text: 'A proctored final assessment - 70% to pass.' },
    { icon: Award, title: '100% free certificates', text: 'Every certificate is unique and QR-verified.' }
  ];

  return (
    <section className="relative overflow-hidden bg-ivory">
      <div className="absolute inset-0 texture-dots opacity-50 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8">
        <nav className="text-sm text-charcoal/60" aria-label="Breadcrumb">Home <span className="mx-1.5 text-charcoal/30">›</span> <a href="https://arshithgroup.com" target="_blank" rel="noopener noreferrer" className="text-charcoal hover:underline">arshithgroup.com</a></nav>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-6 items-center">
        {/* Copy */}
        <div className="relative z-10 pt-8 lg:pt-4 lg:pb-16 animate-fade-up">
          <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-sage">Arshith Bootcamp</p>
          <h1 className="mt-4 font-display text-[44px] sm:text-[58px] lg:text-[66px] leading-[1.04] text-charcoal">
            Achieve your career goals with <span className="text-brand-900">free online courses</span>
          </h1>
          <p className="mt-6 text-[16px] sm:text-[17px] text-charcoal/65 leading-relaxed max-w-md">
            Mentor-written programs in Python, SQL, Web Development and AI — with deep-dive modules, live code practice,
            quizzes after every module, a proctored final and a QR-verified certificate.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={onRegisterClick} className="inline-flex items-center gap-2 rounded-lg bg-brand-900 text-ivory px-7 py-4 text-[15px] font-semibold shadow-[0_14px_30px_-14px_rgba(1,58,43,.7)] hover:bg-forest hover:-translate-y-0.5 transition group">
              Start Learning for Free <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={onExploreClick} className="inline-flex items-center rounded-lg border border-brand-900/20 bg-white/70 px-7 py-4 text-[15px] font-semibold text-brand-900 hover:bg-white hover:border-brand-900/40 transition">
              Explore Courses
            </button>
          </div>

          <button onClick={onVerifyClick} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sage hover:text-brand-900 transition-colors">
            <QrCode className="w-4 h-4" /> Have a certificate? Verify it by ID or QR scan
          </button>
        </div>

        {/* Visual */}
        <div className="relative h-[460px] sm:h-[560px] lg:h-[600px] animate-fade-up" style={{ animationDelay: '120ms' }}>
          {/* forest-green circle with the student standing in front of it (head rises above the circle) */}
          <div className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-10 bottom-10 w-[310px] h-[310px] sm:w-[420px] sm:h-[420px] lg:w-[450px] lg:h-[450px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#0E5C45,#013A2B_70%)] shadow-[0_40px_80px_-40px_rgba(1,58,43,.65)]" aria-hidden="true">
            <span className="absolute inset-[-18px] rounded-full border border-dashed border-brand-900/15" />
          </div>
          <img
            src="/hero-student.webp"
            alt="A student learning online with a laptop and backpack"
            width="950" height="1000"
            fetchpriority="high"
            className="absolute z-[1] left-1/2 -translate-x-[47%] lg:left-auto lg:translate-x-0 lg:right-[18px] bottom-10 h-[390px] sm:h-[520px] lg:h-[560px] w-auto max-w-none object-contain [mask-image:linear-gradient(to_bottom,#000_86%,transparent)]"
          />

          {/* track tiles (like the social icon tiles) */}
          <div className="absolute z-[2] left-0 sm:left-6 lg:left-0 top-2 sm:top-6 grid grid-cols-2 gap-2.5 -rotate-[8deg] animate-drift" style={{ animationDuration: '9s' }} aria-label="Career tracks">
            {TRACKS.map(({ key, label, icon: Icon, color }, i) => (
              <span key={key} className={`w-[62px] h-[62px] sm:w-[74px] sm:h-[74px] rounded-2xl bg-white shadow-floating flex flex-col items-center justify-center gap-1 ${i % 2 ? 'translate-y-3' : ''}`}>
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${color}`} aria-hidden="true" />
                <span className="text-[10px] font-bold text-charcoal/60">{label}</span>
              </span>
            ))}
          </div>

          {/* modules per track (like the bar chart card) */}
          <div className="absolute z-[2] left-2 sm:left-10 lg:left-6 top-[46%] w-[150px] sm:w-[168px] rounded-2xl bg-white shadow-floating px-4 pt-3.5 pb-3 animate-drift" style={{ animationDuration: '11s', animationDelay: '1.5s' }}>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F3E3A6] text-[#B45309] flex items-center justify-center"><Star className="w-3.5 h-3.5 fill-current" /></span>
              <p className="text-[11px] font-bold text-charcoal">Modules per track</p>
            </div>
            <div className="mt-3 h-[78px] flex items-end justify-between gap-1.5">
              {perTrack.map(t => (
                <div key={t.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`w-full rounded-t-md ${t.bar}`} style={{ height: `${Math.max(18, (t.modules / maxModules) * 62)}px` }} />
                  <span className="text-[9px] font-semibold text-charcoal/55">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QR-verified certificate (like the brand chip) */}
          <div className="absolute z-[2] left-1/2 -translate-x-1/2 lg:left-[44%] bottom-0 rounded-2xl bg-white shadow-floating px-4 py-3 flex items-center gap-3 animate-drift" style={{ animationDuration: '10s', animationDelay: '.6s' }}>
            <span className="w-9 h-9 rounded-xl bg-brand-900 text-ivory flex items-center justify-center"><QrCode className="w-5 h-5" /></span>
            <div className="leading-tight">
              <p className="text-[11px] text-charcoal/50">Certificate</p>
              <p className="text-[15px] font-display text-brand-900">QR-verified &amp; unique</p>
            </div>
          </div>

          {/* proctored final (like the reminder card) */}
          <div className="absolute z-[2] right-0 sm:right-2 lg:-right-4 bottom-[12%] w-[170px] rounded-2xl bg-white shadow-floating ring-1 ring-peach-200/60 px-3.5 py-3 animate-drift" style={{ animationDuration: '12s', animationDelay: '2s' }}>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-50 text-brand-900 flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></span>
              <p className="text-[11px] font-bold text-charcoal">Final assessment</p>
            </div>
            <p className="mt-1.5 text-[11px] text-charcoal/60 leading-snug">Proctored · 70% to pass</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-center">
              <span className="rounded-md bg-ivory py-1 text-charcoal/70">45 min</span>
              <span className="rounded-md bg-brand-900 py-1 text-ivory">Certificate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Free modules card (like the feedback card) + Our features */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-4 pb-14 grid lg:grid-cols-[230px_1fr] gap-6 items-end">
        <div className="rounded-2xl bg-brand-100/80 ring-1 ring-brand-900/5 shadow-floating px-5 py-4 lg:-mt-24 lg:mb-2">
          <p className="font-display text-xl text-brand-900">Free learning</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex -space-x-2" aria-hidden="true">
              {TRACKS.slice(0, 3).map(({ key, icon: Icon, color }) => (
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
