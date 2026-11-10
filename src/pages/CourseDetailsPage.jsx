import React, { useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import { ArrowLeft, Clock, Award, CheckCircle2, ChevronDown, BookOpen, ShieldCheck, PlayCircle, ListChecks, FileText, BarChart3, Layers, Languages, Camera, Timer, Target, QrCode, ArrowDown } from 'lucide-react';
import { ProgressBar } from '../components/ui';
import { priceOf, BestSellerBadge } from '../components/CourseCard';
import { cleanText, displayTitle } from '../utils/textUtils';
import { tokenLines } from '../utils/highlight';

/**
 * Course details as a scroll story: a dark hero with glowing light trails, then a pinned stage where a
 * big chapter title changes as you scroll and a card slides in for each chapter while the trails rise
 * into peaks, then the curriculum and fee card on a light section. Smooth (eased) scrolling on this page.
 */

const TRAIL_COLORS = ['#8EE3B5', '#E5C88E', '#4CA153', '#6FC2B0'];

/* ---------- smooth scrolling (this page only) ---------- */
function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    let id = requestAnimationFrame(function raf(t) { lenis.raf(t); id = requestAnimationFrame(raf); });
    // pop-ups lock the page by hiding body overflow: stop smooth scrolling while they are open
    const sync = () => (document.body.style.overflow === 'hidden' ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => { cancelAnimationFrame(id); mo.disconnect(); lenis.destroy(); };
  }, []);
}

/* ---------- hero: long glowing curves with light streaks running along them ---------- */
function HeroTrails() {
  const paths = [
    'M-80 640 C 260 600 420 470 700 500 S 1180 640 1520 420',
    'M-80 690 C 300 640 460 540 760 560 S 1200 690 1520 500',
    'M-80 740 C 320 700 520 610 820 620 S 1220 730 1520 590',
    'M-80 790 C 360 760 560 690 880 690 S 1240 780 1520 680'
  ];
  return (
    <svg className="cd-hero-trails absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {paths.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={TRAIL_COLORS[i]} strokeWidth="9" strokeOpacity=".12" fill="none" strokeLinecap="round" />
          <path className="cd-draw" d={d} stroke={TRAIL_COLORS[i]} strokeWidth="2.2" fill="none" strokeLinecap="round" style={{ animationDelay: `${i * 0.15}s` }} />
          <path className="cd-streak" d={d} stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" style={{ animationDelay: `${-i * 1.3}s` }} />
        </g>
      ))}
    </svg>
  );
}

/* ---------- story: chapters ---------- */
function chaptersFor(course) {
  const modules = course.modules || [];
  const first = modules[0]?.readingMaterial || {};
  const code = first.codeExamples?.[0]?.code || (first.sections || []).find(s => s.code)?.code
    || 'SELECT name, score\nFROM students\nWHERE score >= 70\nORDER BY score DESC;';
  const lang = /select|from|where/i.test(code) ? 'sql' : /<\w+/.test(code) ? 'html' : 'python';
  return [
    { id: 'learn', title: ["What you'll", 'learn'], kind: 'learn', items: (course.whatYouWillLearn || []).slice(0, 6) },
    { id: 'modules', title: [`${modules.length} deep-dive`, 'modules'], kind: 'intro', count: modules.length },
    ...modules.map((m, i) => ({
      id: `m-${m.id}`, kind: 'module', module: m, n: i + 1, of: modules.length,
      title: [`Module ${String(i + 1).padStart(2, '0')}`, cleanText(m.title).replace(/^Module\s+\d+\s*(?:-|:|–)\s*/i, '')]
    })),
    { id: 'code', title: ['Live code in', 'every lesson'], kind: 'code', code: code.split('\n').slice(0, 9).join('\n'), lang },
    { id: 'final', title: ['A proctored', 'final'], kind: 'final', questions: course.finalTest?.totalQuestions || 25 },
    { id: 'cert', title: ['A certificate', 'that proves it'], kind: 'cert' }
  ];
}

// peak heights of the trails for each chapter (three peaks), blended as you scroll
const OPENING_PEAKS = [[0, 0, 0], [220, 120, 60]];
const peaksFor = (i) => (i < OPENING_PEAKS.length ? OPENING_PEAKS[i]
  : [0, 1, 2].map(k => 60 + Math.round(240 * Math.abs(Math.sin(i * 1.7 + k * 2.3)))));
const PEAK_X = [420, 760, 1080];

function trailPath(lineIdx, heights) {
  const base = 600 + lineIdx * 28;
  const pts = [];
  for (let x = -40; x <= 1480; x += 40) {
    let y = base;
    heights.forEach((h, k) => {
      const w = 110 + lineIdx * 14;
      y -= h * Math.exp(-(((x - PEAK_X[k] - lineIdx * 26) / w) ** 2));
    });
    pts.push([x, y]);
  }
  // smooth line through the points (Catmull-Rom to Bezier)
  let d = `M ${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]; const p1 = pts[i]; const p2 = pts[i + 1]; const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1].toFixed(1)} ${c2[0]} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function ChapterCard({ ch, isMine, price }) {
  if (ch.kind === 'learn') {
    return (
      <ul className="grid gap-2.5">
        {ch.items.map((w, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-snug text-ivory/85"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#8EE3B5]" />{cleanText(w)}</li>
        ))}
      </ul>
    );
  }
  if (ch.kind === 'intro') {
    return (
      <div>
        <p className="font-display text-[56px] font-semibold leading-none text-ivory">{ch.count}</p>
        <p className="mt-2 text-[15px] text-ivory/75">modules, each with worked code, common mistakes, practice and a 5-question quiz. Keep scrolling to walk through every one.</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{Array.from({ length: ch.count }).map((_, i) => <span key={i} className="w-7 h-7 rounded-lg bg-[#8EE3B5]/12 border border-[#8EE3B5]/25 text-[#8EE3B5] font-mono text-[11px] flex items-center justify-center">{String(i + 1).padStart(2, '0')}</span>)}</div>
      </div>
    );
  }
  if (ch.kind === 'module') {
    const m = ch.module;
    const objectives = (m.readingMaterial?.objectives || []).slice(0, 4);
    return (
      <div>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-full bg-[#8EE3B5]/15 text-[#8EE3B5] font-mono text-[14px] font-semibold flex items-center justify-center shrink-0">{String(ch.n).padStart(2, '0')}</span>
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden"><span className="block h-full rounded-full bg-gradient-to-r from-[#8EE3B5] to-[#E5C88E]" style={{ width: `${(ch.n / ch.of) * 100}%` }} /></div>
        </div>
        {m.description && <p className="mt-4 text-[15px] leading-relaxed text-ivory/80 line-clamp-4">{cleanText(m.description)}</p>}
        {objectives.length > 0 && (
          <ul className="mt-4 grid gap-2">
            {objectives.map((o, k) => <li key={k} className="flex gap-2.5 text-[14px] leading-snug text-ivory/75"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#8EE3B5]" />{cleanText(o)}</li>)}
          </ul>
        )}
        <p className="mt-4 inline-flex items-center gap-2 text-[12.5px] text-[#E5C88E]"><ListChecks className="w-4 h-4" /> Ends with a 5-question quiz</p>
      </div>
    );
  }
  if (ch.kind === 'code') {
    const lines = tokenLines(ch.code, ch.lang);
    return (
      <div className="rounded-xl bg-[#04170F]/80 border border-white/10 overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 h-8 border-b border-white/10"><i className="w-2.5 h-2.5 rounded-full bg-[#5F8574]" /><i className="w-2.5 h-2.5 rounded-full bg-[#90B1A2]" /><i className="w-2.5 h-2.5 rounded-full bg-[#BCD1C6]" /><span className="ml-2 text-[11px] text-ivory/50">Module 01 · example</span></div>
        <pre className="m-0 p-4 font-mono text-[12.5px] leading-[1.7] text-[#E9F1EC] overflow-hidden">
          {lines.map((toks, i) => <span key={i} className="block whitespace-pre-wrap break-words">{toks.length ? toks.map((t, k) => (t.t ? <span key={k} className={`tok-${t.t}`}>{t.v}</span> : <React.Fragment key={k}>{t.v}</React.Fragment>)) : ' '}</span>)}
        </pre>
        <p className="px-4 pb-4 text-[13px] text-ivory/60">Press Run on any example and edit it right in your browser.</p>
      </div>
    );
  }
  if (ch.kind === 'final') {
    return (
      <div>
        <div className="grid grid-cols-3 gap-2.5">
          {[[ch.questions, 'questions', ListChecks], ['45', 'minutes', Timer], ['70%', 'to pass', Target]].map(([v, l, Icon]) => (
            <div key={l} className="rounded-xl bg-white/[.06] border border-white/10 p-3 text-center">
              <Icon className="w-4 h-4 mx-auto text-[#E5C88E]" />
              <p className="mt-1.5 font-display text-[24px] font-semibold text-ivory leading-none">{v}</p>
              <p className="mt-1 text-[12px] text-ivory/60">{l}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[14px] text-ivory/75"><Camera className="w-4 h-4 text-[#8EE3B5]" /> Camera, tab and full-screen monitoring keep it fair.</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-[#FBF8F1] p-5 text-evergreen shadow-2xl">
      <p className="text-[10px] font-bold tracking-[0.22em] text-sage">CODELEKHO</p>
      <p className="mt-1 font-display text-[20px] font-semibold leading-tight">Certificate of Completion</p>
      <div className="mt-3 h-1.5 w-3/4 rounded bg-brand-100" /><div className="mt-1.5 h-1.5 w-1/2 rounded bg-brand-100" />
      <div className="mt-4 flex items-end justify-between">
        <span className="inline-flex items-center gap-2 text-[12.5px] text-charcoal/70"><QrCode className="w-8 h-8 text-evergreen" /> Verify online by ID or QR</span>
        <span className="px-2 py-1 rounded border-2 border-[#2F7A5C] text-[#2F7A5C] text-[11px] font-bold tracking-[0.12em] -rotate-6">{isMine ? 'YOURS' : price ? `₹${price}` : 'INCLUDED'}</span>
      </div>
    </div>
  );
}

function ScrollStory({ course, isMine, price }) {
  const chapters = useMemo(() => chaptersFor(course), [course]);
  const wrapRef = useRef(null);
  const pathRefs = useRef([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    let raf = 0; let lastActive = -1;
    const update = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const span = wrap.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));          // 0..1 through the story
      const f = p * (chapters.length - 1);
      const i = Math.min(chapters.length - 1, Math.round(f));
      if (i !== lastActive) { lastActive = i; setActive(i); }
      const a = Math.floor(f); const t = f - a;
      const ease = t * t * (3 - 2 * t);
      const from = peaksFor(a); const to = peaksFor(Math.min(chapters.length - 1, a + 1));
      const h = from.map((v, k) => v + (to[k] - v) * ease);
      pathRefs.current.forEach((g, li) => { if (g) { const d = trailPath(li, h); g.querySelectorAll('path').forEach(el => el.setAttribute('d', d)); } });
      wrap.style.setProperty('--story-p', p.toFixed(4));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [chapters.length]);

  return (
    <section ref={wrapRef} className="cd-story relative z-[2] bg-[#06231D]" style={{ height: `${chapters.length * 62 + 40}vh` }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_80%,rgba(14,92,69,.55),transparent_70%)]" aria-hidden="true" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          {TRAIL_COLORS.map((c, i) => (
            <g key={c} ref={(g) => { pathRefs.current[i] = g; }}>
              <path d={trailPath(i, peaksFor(0))} stroke={c} strokeWidth="10" strokeOpacity=".1" fill="none" />
              <path d={trailPath(i, peaksFor(0))} stroke={c} strokeWidth="2.2" fill="none" />
              <path className="cd-streak cd-streak-slow" d={trailPath(i, peaksFor(0))} stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" style={{ animationDelay: `${-i * 1.7}s` }} />
            </g>
          ))}
        </svg>

        <div className="relative h-full max-w-7xl mx-auto px-5 sm:px-8 pt-24 sm:pt-28 pb-10 grid lg:grid-cols-2 gap-6 lg:gap-12 content-start lg:content-center">
          <div className="relative min-h-[150px] sm:min-h-[220px]">
            <p className="text-[12px] font-semibold tracking-[0.22em] uppercase text-[#8EE3B5]">{displayTitle(course.title)} · {String(active + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}</p>
            {chapters.map((ch, i) => (
              <h2 key={ch.id} className={`cd-chapter absolute left-0 right-0 top-8 font-display font-light tracking-[-0.03em] text-ivory ${ch.kind === 'module' ? 'text-[34px] sm:text-[52px] lg:text-[64px] leading-[1.02]' : 'text-[44px] sm:text-[68px] lg:text-[84px] leading-[.98]'} ${i === active ? 'is-on' : i < active ? 'is-past' : ''}`} aria-hidden={i !== active}>
                {ch.kind === 'module' ? <span className="block font-mono text-[14px] sm:text-[16px] font-semibold tracking-[0.2em] text-[#E5C88E] mb-3">{ch.title[0]} / {String(ch.of).padStart(2, '0')}</span> : <>{ch.title[0]}<br /></>}
                <span className={ch.kind === 'module' ? 'text-ivory line-clamp-3' : 'text-[#8EE3B5]'}>{ch.title[1]}</span>
              </h2>
            ))}
            {/* module progress: one bar per module, filled up to the one on screen */}
            <div className="hidden lg:flex absolute left-0 -bottom-10 gap-1.5" aria-hidden="true">
              {chapters.filter(c => c.kind === 'module').map(c => {
                const idx = chapters.indexOf(c);
                return <span key={c.id} className={`h-1 rounded-full transition-all duration-500 ${idx === active ? 'w-8 bg-[#E5C88E]' : idx < active ? 'w-3 bg-[#8EE3B5]' : 'w-3 bg-white/20'}`} />;
              })}
            </div>
          </div>
          <div className="relative min-h-[300px] lg:min-h-[420px]">
            {chapters.map((ch, i) => (
              <div key={ch.id} className={`cd-card absolute inset-x-0 top-0 rounded-[22px] bg-[#0C2D26]/80 border border-white/10 p-5 sm:p-6 backdrop-saturate-150 shadow-[0_30px_60px_-30px_rgba(0,0,0,.8)] ${i === active ? 'is-on' : i < active ? 'is-past' : ''}`} aria-hidden={i !== active}>
                <ChapterCard ch={ch} isMine={isMine} price={price} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CourseDetailsPage({ course, enrolledCourseId, offer, isLoggedIn, onBack, onEnroll, onContinue, onHome }) {
  useSmoothScroll();
  const [open, setOpen] = useState(() => new Set([course.modules?.[0]?.id]));
  const isMine = offer?.enrolledIds ? offer.enrolledIds.includes(course.id) : enrolledCourseId === course.id;
  const price = priceOf(course);
  const done = course.modules?.filter(m => m.completed).length || 0;
  const total = course.modules?.length || 0;
  const nextModule = course.modules?.find(m => !m.completed) || course.modules?.[0];

  const toggle = (id) => setOpen(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const enrollLabel = !isLoggedIn ? 'Sign in to enroll' : price ? `Enroll for ₹${price}` : 'Enroll in this course';
  const cta = isMine ? (
    <button onClick={() => onContinue(nextModule?.id)} className="btn font-display !rounded-md w-full py-3.5 text-[15.5px] bg-forest text-ivory hover:bg-sage"><PlayCircle className="w-5 h-5" />{done ? 'Continue learning' : 'Start learning'}</button>
  ) : (
    <button onClick={onEnroll} className="btn font-display !rounded-md w-full py-3.5 text-[15.5px] bg-forest text-ivory hover:bg-sage shadow-[0_14px_28px_-16px_rgba(1,58,43,.8)]">{enrollLabel}</button>
  );

  const facts = [
    { icon: Layers, label: 'Category', value: course.category },
    { icon: BarChart3, label: 'Level', value: course.level || 'All levels' },
    { icon: Clock, label: 'Duration', value: course.duration },
    { icon: BookOpen, label: 'Modules', value: total },
    { icon: ListChecks, label: 'Quizzes', value: total },
    { icon: Languages, label: 'Language', value: 'English' }
  ];

  return (
    <div className="course-details bg-ivory pb-20">
      {/* hero: dark, glowing light trails, a huge thin title */}
      <section className="relative z-[2] overflow-hidden bg-[#06231D] text-ivory min-h-[640px] lg:min-h-[calc(100vh-64px)]">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_20%,rgba(14,92,69,.6),transparent_70%),radial-gradient(60%_50%_at_10%_90%,rgba(76,161,83,.18),transparent_70%)]" aria-hidden="true" />
        <HeroTrails />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-14 min-h-[inherit] flex flex-col">
          <nav aria-label="Breadcrumb" className="font-display text-[14px] text-ivory/70 flex flex-wrap items-center gap-x-2">
            {onHome ? <button onClick={onHome} className="font-semibold text-[#8EE3B5] hover:underline">Home</button> : <span className="font-semibold text-[#8EE3B5]">Home</span>}
            <span className="text-ivory/30">/</span>
            <button onClick={onBack} className="font-semibold text-[#8EE3B5] hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5 sm:hidden" />Courses</button>
            <span className="text-ivory/30">/</span>
            <span className="truncate max-w-[60vw]">{displayTitle(course.title)}</span>
          </nav>

          <div className="mt-10 lg:mt-14 lg:text-right">
            <span className="cd-rise font-display inline-flex rounded-md bg-[#8EE3B5]/15 border border-[#8EE3B5]/30 text-[#8EE3B5] text-[13px] font-medium px-3 py-1">{course.category}</span>
            <h1 className="cd-rise mt-4 font-display font-light text-[44px] sm:text-[68px] lg:text-[96px] leading-[.98] tracking-[-0.035em]" style={{ animationDelay: '.1s' }}>{displayTitle(course.title)}</h1>
          </div>

          <div className="mt-auto pt-10 grid lg:grid-cols-[minmax(0,460px)_1fr] items-end gap-6">
            <div className="cd-rise rounded-[20px] bg-[#0C2D26]/70 border border-white/10 p-5 sm:p-6" style={{ animationDelay: '.25s' }}>
              <p className="text-[15px] sm:text-[16px] leading-relaxed text-ivory/80 line-clamp-5">{cleanText(course.description)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[{ icon: Clock, text: course.duration }, { icon: BookOpen, text: `${total} modules` }, { icon: Award, text: 'Certificate' }].map(({ icon: Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 rounded-full bg-white/[.07] border border-white/15 px-3 py-1.5 text-[13px] text-ivory/85"><Icon className="w-3.5 h-3.5 text-[#8EE3B5]" />{text}</span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button onClick={isMine ? () => onContinue(nextModule?.id) : onEnroll} className="h-12 px-6 rounded-xl bg-gradient-to-b from-[#E5C88E] to-[#C49A52] text-[#2A1D08] font-display font-bold text-[15.5px] inline-flex items-center gap-2 hover:brightness-105 transition">
                  {isMine ? <><PlayCircle className="w-5 h-5" />{done ? 'Continue learning' : 'Start learning'}</> : enrollLabel}
                </button>
                {!isMine && <span className="font-display text-[22px] font-semibold text-ivory">{price ? `₹${price}` : 'Free'}</span>}
              </div>
            </div>
            <p className="hidden lg:flex justify-end items-center gap-2 text-[13px] text-ivory/50"><ArrowDown className="w-4 h-4 cd-bob" /> Scroll to explore the course</p>
          </div>
        </div>
      </section>

      <ScrollStory course={course} isMine={isMine} price={price} />

      {/* curriculum and fee card on a light section */}
      <div className="relative z-[2] bg-ivory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 pt-14">
          <div className="lg:col-span-8 order-2 lg:order-1">
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Curriculum</p>
            <h2 className="mt-1 font-display font-light text-[34px] sm:text-[44px] leading-tight tracking-[-0.02em] text-evergreen">{total} modules, <span className="text-sage">a quiz after each</span></h2>
            {isMine && <span className="mt-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-[13px] font-semibold text-forest">{done}/{total} quizzes completed</span>}
            <div className="mt-7 space-y-3">
              {course.modules?.map((m, i) => {
                const isOpen = open.has(m.id);
                return (
                  <div key={m.id} className={`rounded-2xl border transition-colors ${isOpen ? 'border-sage/40 bg-cream' : 'border-brand-900/10 bg-white hover:border-sage/40'}`}>
                    <button onClick={() => toggle(m.id)} className="w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-left" aria-expanded={isOpen}>
                      <span className={`w-11 h-11 rounded-full font-display text-[15px] font-semibold flex items-center justify-center shrink-0 ${m.completed ? 'bg-forest text-ivory' : 'bg-brand-100 text-forest'}`}>
                        {m.completed ? <CheckCircle2 className="w-5 h-5" /> : String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-display text-[16.5px] font-medium text-evergreen leading-snug">{cleanText(m.title)}</span>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${isOpen ? 'bg-forest text-ivory rotate-180' : 'bg-cream text-charcoal/60'}`}><ChevronDown className="w-4 h-4" /></span>
                    </button>
                    <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="px-4 sm:px-5 pb-5 sm:pl-[5rem] text-[14.5px] text-charcoal/70 leading-relaxed space-y-3">
                          <p>{cleanText(m.description)}</p>
                          {m.readingMaterial?.objectives?.length > 0 && (
                            <ul className="space-y-1.5">
                              {m.readingMaterial.objectives.slice(0, 4).map((o, k) => <li key={k} className="flex gap-2"><span className="text-sage font-bold">•</span>{cleanText(o)}</li>)}
                            </ul>
                          )}
                          {isMine && <button onClick={() => onContinue(m.id)} className="font-display font-semibold text-forest hover:text-sage">Open module →</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="lg:col-span-4 order-1 lg:order-2">
            <div className="edu-card overflow-hidden lg:sticky lg:top-28">
              <div className="bg-[#06231D] px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.2em] text-[#8EE3B5]">Course fee</p>
                  <p className="font-display text-[34px] font-bold leading-none text-ivory mt-1">{isMine ? 'Unlocked' : price ? `₹${price}` : 'Free'}</p>
                </div>
                {course.bestSeller && !isMine
                  ? <BestSellerBadge />
                  : <span className="rounded-full bg-ivory/15 text-ivory text-[12.5px] font-semibold px-3 py-1.5 inline-flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Certificate included</span>}
              </div>
              <div className="p-6 space-y-5">
                {isMine && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-charcoal/60">Your progress</span><span className="font-semibold text-forest">{course.progress}%</span></div>
                    <ProgressBar value={course.progress} />
                  </div>
                )}
                {cta}
                <ul className="divide-y divide-brand-900/10 text-[14.5px]">
                  {facts.map(({ icon: Icon, label, value }) => (
                    <li key={label} className="flex items-center gap-3 py-3">
                      <Icon className="w-4 h-4 text-sage shrink-0" />
                      <span className="text-charcoal/65">{label}</span>
                      <span className="ml-auto font-display font-medium text-evergreen text-right">{value}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl bg-cream border border-brand-900/10 p-4">
                  <p className="font-display text-[15px] font-semibold text-evergreen">This course includes</p>
                  <ul className="mt-3 space-y-2.5 text-[14px] text-charcoal/75">
                    <li className="flex gap-3"><FileText className="w-4 h-4 text-sage mt-0.5 shrink-0" />{total} reading modules with code</li>
                    <li className="flex gap-3"><ListChecks className="w-4 h-4 text-sage mt-0.5 shrink-0" />{total} module quizzes</li>
                    <li className="flex gap-3"><ShieldCheck className="w-4 h-4 text-sage mt-0.5 shrink-0" />45-min proctored final ({course.finalTest?.totalQuestions || 25} questions)</li>
                    <li className="flex gap-3"><Award className="w-4 h-4 text-sage mt-0.5 shrink-0" />Certificate with your score &amp; unique ID</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
