import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import '../styles/course-banners.css';

/*
 * The course page's hero "video": the course's three animated banners (Live Terminal, Kinetic Type,
 * Floating Stack) play one after another as a 20-second loop, with a wipe transition between them,
 * video-style progress bars and a play/pause button. Banner markup: src/data/courseBanners/*.html
 * (loaded only on course pages), styles: src/styles/course-banners.css.
 */

const BANNER_OF = { 'python-programming': 'python', 'sql-mastery': 'sql', 'data-science-ai': 'ai', 'web-development': 'web', 'cyber-security': 'cyber' };
const VARS = {
  python: { '--cb-accent': '#FFD43B', '--cb-on': '#0B1120', '--cb-dark': '#071634' },
  sql: { '--cb-accent': '#FFB547', '--cb-on': '#14082E', '--cb-dark': '#0A0A4A' },
  ai: { '--cb-accent': '#7CFFCB', '--cb-on': '#06104F', '--cb-dark': '#050A4A' },
  web: { '--cb-accent': '#C8FF5A', '--cb-on': '#1E0838', '--cb-dark': '#1E0838' },
  cyber: { '--cb-accent': '#39FF88', '--cb-on': '#0B0521', '--cb-dark': '#0B0521' }
};
// [concept, milliseconds] — 8 + 6 + 6 = 20 seconds; the terminal needs longer to finish typing
const SCENES = [['terminal', 8000], ['kinetic', 6000], ['stack', 6000]];
const FILES = import.meta.glob('../data/courseBanners/*.html', { query: '?raw', import: 'default' });

export const hasBannerReel = (courseId) => Boolean(BANNER_OF[courseId]);

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

export default function CourseBannerReel({ courseId, courseTitle, onCta }) {
  const key = BANNER_OF[courseId];
  const wrap = useRef(null);
  const [html, setHtml] = useState(null);          // { terminal, kinetic, stack }
  const [scene, setScene] = useState(0);
  const [prev, setPrev] = useState(null);          // scene being wiped away
  const [cycle, setCycle] = useState(0);           // remounts banners so their animations replay
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const [visible, setVisible] = useState(true);
  const running = playing && visible;

  useEffect(() => {
    let live = true;
    Promise.all(SCENES.map(([c]) => FILES[`../data/courseBanners/${key}-${c}.html`]?.()))
      .then(list => { if (live) setHtml(Object.fromEntries(SCENES.map(([c], i) => [c, list[i] || '']))); })
      .catch(() => {});
    return () => { live = false; };
  }, [key]);

  // scale the 1280x720 stage to the frame, pause off-screen and in background tabs
  useEffect(() => {
    const el = wrap.current;
    if (!el) return undefined;
    const fit = () => el.style.setProperty('--cb-scale', (el.clientWidth / 1280).toFixed(5));
    fit();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => setVisible(e.isIntersecting && !document.hidden), { threshold: 0.15 }) : null;
    io?.observe(el);
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    if (!ro) window.addEventListener('resize', fit);
    return () => { ro?.disconnect(); io?.disconnect(); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('resize', fit); };
  }, []);

  // background videos (Python, Cyber Security) follow play/pause and visibility too
  useEffect(() => {
    wrap.current?.querySelectorAll('video').forEach(v => { if (running) v.play?.().catch(() => {}); else v.pause?.(); });
  }, [running, scene, cycle, html]);

  const go = useCallback((next) => {
    setPrev(scene);
    setScene(next);
    if (next === 0) setCycle(c => c + 1); // a new loop: replay the banners' own animations
  }, [scene]);

  // the active progress bar's animationend moves the reel on (so pausing simply pauses the bar)
  const onBarEnd = () => go((scene + 1) % SCENES.length);
  useEffect(() => { if (prev === null) return undefined; const t = setTimeout(() => setPrev(null), 950); return () => clearTimeout(t); }, [prev, scene]);

  const tilt = (e) => {
    if (reducedMotion()) return;
    const el = wrap.current, r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--cb-ry', `${(x * 6).toFixed(2)}deg`);
    el.style.setProperty('--cb-rx', `${(-y * 5).toFixed(2)}deg`);
    el.style.setProperty('--cb-px', `${(-x * 30).toFixed(1)}px`);
    el.style.setProperty('--cb-py', `${(-y * 20).toFixed(1)}px`);
  };
  const untilt = () => ['--cb-rx', '--cb-ry', '--cb-px', '--cb-py'].forEach(p => wrap.current?.style.removeProperty(p));

  const onClick = (e) => {
    const cta = e.target.closest('[data-cb-cta]');
    if (!cta) return;
    e.preventDefault();
    onCta?.();
  };

  const layer = (i, entering) => (
    <section
      key={`${SCENES[i][0]}-${cycle}-${i}`}
      className={`cb cb-reel-layer ${entering ? 'cb-reel-in' : ''} ${running ? '' : 'cb-paused'}`}
      data-course={key}
      data-concept={SCENES[i][0]}
      style={VARS[key]}
      aria-hidden={!entering}
      dangerouslySetInnerHTML={{ __html: html?.[SCENES[i][0]] || '' }}
    />
  );

  if (!key) return null;
  return (
    <div
      ref={wrap}
      className="cb-reel group relative w-full aspect-video overflow-hidden rounded-[22px] sm:rounded-[28px] shadow-[0_30px_60px_-28px_rgba(6,35,29,.55)]"
      style={{ background: VARS[key]['--cb-dark'] }}
      onPointerMove={tilt}
      onPointerLeave={untilt}
      onClick={onClick}
      role="region"
      aria-roledescription="video"
      aria-label={`${courseTitle} course preview`}
    >
      {!html && <div className={`absolute inset-0 bg-cover bg-center opacity-40 cb-img-${key}`} aria-hidden="true" />}
      {html && prev !== null && prev !== scene && layer(prev, false)}
      {html && layer(scene, prev !== null)}
      {html && prev !== null && <span key={`sweep-${scene}-${cycle}`} className="cb-reel-sweep" style={{ background: VARS[key]['--cb-accent'] }} aria-hidden="true" />}

      {/* video controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-3 sm:px-4 pb-2.5 sm:pb-3.5 pt-8 bg-gradient-to-t from-black/45 to-transparent flex items-center gap-2.5 sm:gap-3 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setPlaying(p => !p); }}
          className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-white/90 text-[#0B1120] flex items-center justify-center shadow hover:bg-white"
          aria-label={playing ? 'Pause preview' : 'Play preview'}
        >
          {playing ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
        </button>
        <div className="flex-1 flex gap-1.5" role="group" aria-label="Preview scenes">
          {SCENES.map(([c, ms], i) => (
            <button
              key={c}
              type="button"
              onClick={(e) => { e.stopPropagation(); if (i !== scene) go(i); }}
              className="relative h-[5px] rounded-full bg-white/30 overflow-hidden hover:bg-white/45 py-0"
              style={{ flexGrow: ms }}
              aria-label={`Scene ${i + 1} of ${SCENES.length}`}
              aria-current={i === scene ? 'true' : undefined}
            >
              <span
                key={i === scene ? `fill-${scene}-${cycle}` : `done-${i}`}
                className={`absolute inset-y-0 left-0 rounded-full ${i === scene ? 'cb-reel-fill' : ''}`}
                style={{
                  background: VARS[key]['--cb-accent'],
                  width: i < scene ? '100%' : i === scene ? undefined : '0%',
                  animationDuration: `${ms}ms`,
                  animationPlayState: running ? 'running' : 'paused'
                }}
                onAnimationEnd={i === scene ? onBarEnd : undefined}
              />
            </button>
          ))}
        </div>
        <span className="hidden sm:inline font-mono text-[11.5px] text-white/85 tabular-nums">0:20</span>
      </div>
    </div>
  );
}
