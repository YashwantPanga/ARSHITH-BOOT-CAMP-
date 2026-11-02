import React, { useEffect, useRef, useState } from 'react';
import { Award, BookOpen, ChevronRight, Code2, Moon, Play, QrCode, Search, Sun, Sunrise, Target, Timer, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { paths } from '../../router';
import { INTERVIEW_SETS } from '../../../shared/interview/index.js';
import { CourseRow } from '../PopularCourses';
import { WhatBringsYou } from '../MobileWelcome';

/**
 * Phones only: the home page as an app screen. A deep pine header with a soft light beam, search and
 * four category tabs (the active tab joins the panel under it and re-tints the header), a promo
 * carousel, a "try it" code card and short steps. Palette: #051F20 #0B2B26 #163832 #235347 #8EB69B #DAF1DE.
 */

const QUESTION_COUNT = INTERVIEW_SETS.reduce((n, s) => n + s.items.length, 0);

const TABS = [
  { id: 'courses', label: 'Courses', icon: BookOpen, tint: 'from-pine-950 via-pine-900 to-pine-800' },
  { id: 'interview', label: 'Interview', icon: Target, tint: 'from-pine-900 via-pine-800 to-pine-700', badge: 'NEW' },
  { id: 'practice', label: 'Practice', icon: Code2, tint: 'from-pine-950 via-pine-800 to-pine-700' },
  { id: 'certificate', label: 'Certificate', icon: Award, tint: 'from-pine-800 via-pine-900 to-pine-950' }
];

const SEARCH_HINTS = ['Python', 'SQL joins', 'Web Development', 'Data Science', 'Interview questions'];

/* ------------------------------------------------------------------ */
/* Code samples for the "try it" card                                  */
/* ------------------------------------------------------------------ */

const SAMPLES = [
  {
    id: 'python', label: 'Python', course: 'python-programming', learn: 'Learn Python',
    code: '# Your first Python program\nname = "CodeLekho"\nsteps = ["Learn", "Practise", "Get hired"]\nfor step in steps:\n    print(step, "with", name)',
    output: 'Learn with CodeLekho\nPractise with CodeLekho\nGet hired with CodeLekho'
  },
  {
    id: 'sql', label: 'SQL', course: 'sql-mastery', learn: 'Learn SQL',
    code: '-- Students who passed\nSELECT name, score\nFROM students\nWHERE score >= 70\nORDER BY score DESC;',
    output: 'name   | score\n-------+------\nAsha   |    92\nRavi   |    81\nMeera  |    74',
    sample: true
  },
  {
    id: 'html', label: 'HTML', course: 'web-development', learn: 'Learn HTML',
    code: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello, CodeLekho!</h1>\n  <p>My first web page.</p>\n</body>\n</html>',
    html: true
  },
  {
    id: 'js', label: 'JavaScript', course: 'web-development', learn: 'Learn JavaScript',
    code: 'const skills = ["HTML", "CSS", "JS"];\nskills.forEach((s, i) => {\n  console.log(`${i + 1}. ${s}`);\n});',
    output: '1. HTML\n2. CSS\n3. JS'
  }
];

const KEYWORDS = {
  python: /\b(for|in|print|def|return|if|else|import)\b/g,
  sql: /\b(SELECT|FROM|WHERE|ORDER BY|DESC|AND|OR)\b/g,
  js: /\b(const|let|forEach|console|log|return)\b/g,
  html: null
};

/** Tiny highlighter: comments, strings, keywords and tags. Returns React nodes for one line. */
function highlight(line, lang) {
  if (/^\s*(#|--|\/\/)/.test(line)) return <span className="text-pine-300/70 italic">{line}</span>;
  const parts = [];
  const re = lang === 'html'
    ? /(<\/?[\w!]+[^>]*>)/g
    : new RegExp(`("[^"]*"|\`[^\`]*\`|${KEYWORDS[lang].source})`, 'g');
  let last = 0; let m;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const tok = m[0];
    const cls = lang === 'html' ? 'text-[#F2A6A6]' : /^["`]/.test(tok) ? 'text-[#F2D27A]' : 'text-pine-300 font-semibold';
    parts.push(<span key={m.index} className={cls}>{tok}</span>);
    last = m.index + tok.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

function TryItCard({ navigate }) {
  const [active, setActive] = useState(SAMPLES[0].id);
  const [ran, setRan] = useState(false);
  const s = SAMPLES.find(x => x.id === active);
  const pick = (id) => { setActive(id); setRan(false); };
  return (
    <div>
      <div className="-mx-4 px-4 scroll-px-4 flex gap-2 overflow-x-auto no-scrollbar snap-x" role="tablist" aria-label="Languages">
        {SAMPLES.map(x => (
          <button key={x.id} role="tab" aria-selected={x.id === active} onClick={() => pick(x.id)}
            className={`snap-start shrink-0 h-9 px-4 rounded-full text-[13.5px] font-semibold border transition-all duration-300 ${x.id === active ? 'bg-pine-950 text-pine-100 border-pine-950 shadow-[0_8px_18px_-10px_rgba(5,31,32,.9)]' : 'bg-white text-pine-800 border-pine-800/15 active:bg-pine-100'}`}>
            {x.label}
          </button>
        ))}
      </div>

      <div key={active} className="mh-swap mt-3 rounded-2xl overflow-hidden bg-pine-950 shadow-[0_24px_40px_-24px_rgba(5,31,32,.9)] ring-1 ring-pine-700/40">
        <div className="flex items-center gap-1.5 px-3.5 h-9 border-b border-white/5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" /><span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-[11.5px] font-medium text-pine-300/80">{s.label} example</span>
        </div>
        <pre className="m-0 px-3.5 py-3 text-[12.5px] leading-[1.65] font-mono text-pine-100 overflow-x-auto no-scrollbar border-l-[3px] border-pine-300/70 ml-3.5 my-3 bg-white/[.03] rounded-r-lg">
          {s.code.split('\n').map((line, i) => <div key={i} className="whitespace-pre">{highlight(line, s.id)}{'\n'}</div>)}
        </pre>
        {ran && (
          <div className="mh-out mx-3.5 mb-3 rounded-lg bg-pine-100 text-pine-950 overflow-hidden">
            <p className="px-3 pt-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-pine-700">{s.sample ? 'Result (sample table)' : 'Output'}</p>
            {s.html
              ? <div className="px-3 pb-3 pt-1 bg-white m-2 rounded-md"><p className="font-serif text-[22px] font-bold leading-tight">Hello, CodeLekho!</p><p className="font-serif text-[14px] mt-1">My first web page.</p></div>
              : <pre className="m-0 px-3 pb-2.5 pt-1 text-[12.5px] leading-[1.6] font-mono whitespace-pre overflow-x-auto no-scrollbar">{s.output}</pre>}
          </div>
        )}
        <div className="flex items-center gap-2 px-3.5 pb-3.5">
          <button onClick={() => setRan(true)} className="h-10 px-4 rounded-xl bg-pine-300 text-pine-950 text-[14px] font-bold inline-flex items-center gap-1.5 active:scale-[.97] transition">
            <Play className="w-4 h-4 fill-current" /> {ran ? 'Run again' : 'Try it yourself'}
          </button>
          <button onClick={() => navigate(paths.course(s.course))} className="h-10 px-3 rounded-xl text-pine-100 text-[13.5px] font-semibold inline-flex items-center gap-1 active:bg-white/10 transition">
            {s.learn} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab panels                                                          */
/* ------------------------------------------------------------------ */

function CoursesPanel({ courses, enrolledCourseId, offer, navigate, onViewAll }) {
  return (
    <div>
      <PanelHead title="Free certificate courses" action="See all" onAction={onViewAll} />
      <div className="-mx-4 px-4 scroll-px-4 mt-3 flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
        {courses.map((c, i) => (
          <div key={c.id} className="mh-rise snap-start shrink-0 w-[46%] min-w-[156px]" style={{ animationDelay: `${i * 70}ms` }}>
            <CourseRow course={c} enrolledCourseId={enrolledCourseId} offer={offer} onSelect={(id) => navigate(paths.course(id))} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InterviewPanel({ navigate }) {
  return (
    <div>
      <PanelHead title={`${QUESTION_COUNT} interview questions`} action="Open" onAction={() => navigate(paths.interview())} />
      <div className="mt-3 grid grid-cols-1 gap-2">
        {INTERVIEW_SETS.slice(0, 4).map((s, i) => (
          <button key={s.id} onClick={() => navigate(paths.interview(s.id))} style={{ animationDelay: `${i * 60}ms` }}
            className="mh-rise min-w-0 w-full flex items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-pine-800/10 active:scale-[.99] transition">
            <span className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-pine-700 to-pine-950 text-pine-100 text-[12px] font-bold flex items-center justify-center">{s.items.length}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-pine-950 truncate">{s.title}</span>
              <span className="block text-[12px] text-pine-800/60 truncate">{s.tagline}</span>
            </span>
            <ChevronRight className="w-4 h-4 text-pine-700/50" />
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-[12px] text-pine-800/60 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Unlocks after you earn 4 course certificates.</p>
    </div>
  );
}

function CertificatePanel({ navigate }) {
  const steps = ['Pass every module quiz', 'Submit your projects on GitHub', 'Score 70%+ in the proctored final'];
  return (
    <div>
      <div className="mh-rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-pine-700 to-pine-950 p-4 text-pine-100">
        <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-pine-300/20 blur-xl" aria-hidden="true" />
        <Award className="w-7 h-7 text-pine-300" />
        <p className="mt-2 font-display text-[19px] font-bold leading-tight text-white">A certificate anyone can verify</p>
        <p className="mt-1 text-[13px] text-pine-100/75">Every certificate has a unique ID and a QR code employers can scan.</p>
        <button onClick={() => navigate(paths.verify())} className="mt-3 h-10 px-4 rounded-xl bg-pine-100 text-pine-950 text-[13.5px] font-bold inline-flex items-center gap-1.5 active:scale-[.97] transition">
          <QrCode className="w-4 h-4" /> Verify a certificate
        </button>
      </div>
      <ol className="mt-3 grid gap-2">
        {steps.map((t, i) => (
          <li key={t} className="mh-rise flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-pine-800/10" style={{ animationDelay: `${120 + i * 70}ms` }}>
            <span className="w-7 h-7 shrink-0 rounded-full bg-pine-100 text-pine-800 text-[12px] font-bold flex items-center justify-center">{i + 1}</span>
            <span className="text-[13.5px] font-medium text-pine-950">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PanelHead({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-[17px] font-bold text-pine-950">{title}</h2>
      {action && <button onClick={onAction} className="shrink-0 -mr-2 py-2 px-2 text-[13px] font-semibold text-pine-700 inline-flex items-center gap-0.5 active:opacity-70">{action} <ChevronRight className="w-4 h-4" /></button>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Promo carousel                                                      */
/* ------------------------------------------------------------------ */

function PromoCarousel({ slides }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  const touched = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const onScroll = () => setI(Math.round(el.scrollLeft / el.clientWidth));
    const stop = () => { touched.current = true; };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchstart', stop, { passive: true });
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = reduce ? null : setInterval(() => {
      if (touched.current || !el.clientWidth) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % slides.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    }, 4200);
    return () => { el.removeEventListener('scroll', onScroll); el.removeEventListener('touchstart', stop); if (t) clearInterval(t); };
  }, [slides.length]);
  return (
    <div>
      <div ref={ref} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-[22px]">
        {slides.map((s) => (
          <div key={s.title} className="snap-center shrink-0 w-full">
            <div className={`relative h-[168px] overflow-hidden rounded-[22px] p-5 ${s.bg}`}>
              <span className="mh-beam absolute -left-10 -top-16 w-56 h-56 rounded-full bg-pine-100/25 blur-2xl" aria-hidden="true" />
              {/* stacked pills, echoing the palette */}
              <span className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 rotate-[-8deg]" aria-hidden="true">
                {['bg-pine-950', 'bg-pine-900', 'bg-pine-800', 'bg-pine-700', 'bg-pine-300', 'bg-pine-100'].map((c, k) => (
                  <span key={c} className={`mh-pill block h-[18px] w-28 rounded-full ${c} shadow-[0_6px_10px_-6px_rgba(0,0,0,.6)]`} style={{ animationDelay: `${k * 90}ms` }} />
                ))}
              </span>
              <p className="relative text-[10.5px] font-bold uppercase tracking-[0.18em] text-pine-300">{s.eyebrow}</p>
              <p className="relative mt-1.5 max-w-[68%] font-display text-[22px] font-bold leading-[1.15] text-white">{s.title}</p>
              <p className="relative mt-1 max-w-[62%] text-[12.5px] leading-snug text-pine-100/75">{s.text}</p>
              <button onClick={s.go} className="absolute left-5 bottom-4 h-9 px-4 rounded-full bg-pine-100 text-pine-950 text-[13px] font-bold inline-flex items-center gap-1.5 active:scale-[.97] transition">
                {s.cta} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
        {slides.map((s, k) => <span key={s.title} className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? 'w-5 bg-pine-800' : 'w-1.5 bg-pine-800/25'}`} />)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function MobileHome({ courses = [], enrolledCourseId, offer, studentUser, navigate, goCourses }) {
  const [tab, setTab] = useState('courses');
  const [query, setQuery] = useState('');
  const [hint, setHint] = useState(0);
  const active = TABS.find(t => t.id === tab);
  const firstName = (studentUser?.name || '').trim().split(/\s+/)[0];
  const moduleCount = courses.reduce((n, c) => n + (c.modules?.length || 0), 0) || 60;
  const hour = new Date().getHours();
  const Greeting = hour < 5 || hour >= 19 ? { icon: Moon, text: 'Good evening' } : hour < 12 ? { icon: Sunrise, text: 'Good morning' } : { icon: Sun, text: 'Good afternoon' };

  useEffect(() => {
    const t = setInterval(() => setHint(h => (h + 1) % SEARCH_HINTS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const submit = (e) => { e.preventDefault(); goCourses(query.trim() ? { q: query.trim() } : undefined); };
  const enroll = () => navigate(studentUser ? paths.dashboard() : paths.register());

  const slides = [
    { eyebrow: 'Free for everyone', title: 'Enroll free. Get certified.', text: `${courses.length || 4} career tracks with a verified certificate.`, cta: studentUser ? 'Continue' : 'Enroll free', go: enroll, bg: 'bg-gradient-to-br from-pine-800 via-pine-900 to-pine-950' },
    { eyebrow: 'New · Interview Prep', title: 'Crack any job interview', text: `${QUESTION_COUNT} real questions in ${INTERVIEW_SETS.length} study plans.`, cta: 'Start prep', go: () => navigate(paths.interview()), bg: 'bg-gradient-to-br from-pine-700 via-pine-800 to-pine-950' },
    { eyebrow: 'Trusted by employers', title: 'QR-verified certificates', text: 'Anyone can check yours in seconds.', cta: 'Verify one', go: () => navigate(paths.verify()), bg: 'bg-gradient-to-br from-pine-950 via-pine-900 to-pine-700' }
  ];

  const stats = [
    { icon: Layers, value: courses.length || 4, label: 'Career tracks' },
    { icon: BookOpen, value: `${moduleCount}+`, label: 'Modules' },
    { icon: Timer, value: '45 min', label: 'Proctored final' },
    { icon: Award, value: '100%', label: 'Free certificate' }
  ];

  return (
    <div className="md:hidden bg-[#F3F8F4] text-pine-950">
      {/* Header: tinted per tab, with a slow light beam */}
      <section className={`relative overflow-hidden bg-gradient-to-br ${active.tint} transition-colors duration-500 px-4 pt-5`}>
        <span className="mh-beam pointer-events-none absolute -left-24 -top-28 w-80 h-80 rounded-full bg-pine-100/20 blur-3xl" aria-hidden="true" />
        <span className="pointer-events-none absolute -right-16 top-10 w-48 h-48 rounded-full bg-pine-300/10 blur-2xl" aria-hidden="true" />

        <div className="relative mh-rise">
          <p className="text-[13px] font-medium text-pine-300 flex items-center gap-1.5"><Greeting.icon className="w-4 h-4" /> {Greeting.text}{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="mt-1 font-display text-[27px] font-bold leading-[1.12] text-white">Learn. Practise.<br /><span className="text-pine-300">Get hired.</span></h1>
        </div>

        <form onSubmit={submit} className="relative mt-4 mh-rise" style={{ animationDelay: '80ms' }}>
          <Search className="w-[18px] h-[18px] text-pine-800/50 absolute left-4 top-1/2 -translate-y-1/2" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search courses"
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white text-[15px] text-pine-950 outline-none shadow-[0_14px_30px_-16px_rgba(0,0,0,.6)] focus:ring-4 focus:ring-pine-300/40" />
          {!query && (
            <span className="pointer-events-none absolute left-11 top-1/2 -translate-y-1/2 h-[23px] overflow-hidden text-[15px] text-pine-800/45 flex gap-1">
              Search for <span key={hint} className="mh-hint text-pine-800/70">‘{SEARCH_HINTS[hint]}’</span>
            </span>
          )}
        </form>

        {/* Category tabs: the active one joins the panel below */}
        <div className="relative mt-5 grid grid-cols-4 gap-1.5" role="tablist" aria-label="Explore">
          {TABS.map(({ id, label, icon: Icon, badge }) => {
            const on = id === tab;
            return (
              <button key={id} role="tab" aria-selected={on} onClick={() => setTab(id)}
                className={`relative flex flex-col items-center gap-1.5 pt-3 pb-2.5 rounded-t-[18px] transition-all duration-300 ${on ? 'bg-[#F3F8F4] text-pine-950' : 'text-pine-100/80 active:bg-white/5'}`}>
                {on && <><span className="mh-corner-l" aria-hidden="true" /><span className="mh-corner-r" aria-hidden="true" /></>}
                <span className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ${on ? 'bg-gradient-to-br from-pine-700 to-pine-950 text-pine-100 shadow-[0_10px_18px_-10px_rgba(5,31,32,.9)] scale-105' : 'bg-white/10 text-pine-100'}`}>
                  <Icon className="w-5 h-5" />
                  {badge && <span className="absolute -top-1.5 -right-2 rounded-full bg-pine-300 px-1.5 text-[9.5px] font-extrabold leading-[15px] text-pine-950">{badge}</span>}
                </span>
                <span className={`text-[12px] ${on ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab panel */}
      <section className="px-4 pt-4 pb-6">
        <div key={tab} className="mh-swap">
          {tab === 'courses' && <CoursesPanel courses={courses} enrolledCourseId={enrolledCourseId} offer={offer} navigate={navigate} onViewAll={() => goCourses()} />}
          {tab === 'interview' && <InterviewPanel navigate={navigate} />}
          {tab === 'practice' && <div><PanelHead title="What do you want to learn?" /><p className="mt-1 mb-3 text-[13px] text-pine-800/65">Pick a language and run a real example.</p><TryItCard navigate={navigate} /></div>}
          {tab === 'certificate' && <CertificatePanel navigate={navigate} />}
        </div>
      </section>

      {/* Promo carousel */}
      <section className="px-4 pb-7">
        <PromoCarousel slides={slides} />
      </section>

      {/* Stats strip */}
      <section className="px-4 pb-7">
        <div className="grid grid-cols-4 rounded-2xl bg-white ring-1 ring-pine-800/10 divide-x divide-pine-800/10 py-3">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center text-center px-1">
              <Icon className="w-4 h-4 text-pine-700" />
              <p className="mt-1 font-display text-[16px] font-bold leading-none text-pine-950">{value}</p>
              <p className="mt-1 text-[10.5px] leading-tight text-pine-800/60">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Try it (always visible, w3schools style) unless the Practice tab already shows it */}
      {tab !== 'practice' && (
        <section className="px-4 pb-7">
          <PanelHead title="Try it yourself" />
          <p className="mt-1 mb-3 text-[13px] text-pine-800/65">Every lesson has examples you can run in your browser.</p>
          <TryItCard navigate={navigate} />
        </section>
      )}

      <WhatBringsYou onCourses={() => goCourses()} onCategories={() => navigate(paths.categories())} />

      {/* How it works */}
      <section className="px-4 pt-2 pb-8">
        <PanelHead title="How it works" />
        <ol className="mt-3 relative">
          <span className="absolute left-[17px] top-4 bottom-4 w-px bg-gradient-to-b from-pine-700 to-pine-300" aria-hidden="true" />
          {[
            ['Read the modules', 'Textbook-style lessons with worked code.'],
            ['Pass each quiz', 'Five questions close every module.'],
            ['Take the proctored final', '45 minutes, 70% to pass. Best on a laptop.'],
            ['Earn your certificate', 'Unique ID and QR code, free.']
          ].map(([t, d], i) => (
            <li key={t} className="relative flex gap-3 py-2">
              <span className="relative z-[1] w-9 h-9 shrink-0 rounded-full bg-pine-950 text-pine-100 text-[13px] font-bold flex items-center justify-center ring-4 ring-[#F3F8F4]">{i + 1}</span>
              <span className="pt-1">
                <span className="block text-[14.5px] font-semibold text-pine-950">{t}</span>
                <span className="block text-[12.5px] text-pine-800/65">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
