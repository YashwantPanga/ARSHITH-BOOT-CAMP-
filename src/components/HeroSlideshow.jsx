import React, { useEffect, useRef, useState } from 'react';

const U = (id, w, h) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=90`;
const img = (id) => ({ src: U(id, 1080, 1350), srcSet: `${U(id, 760, 950)} 760w, ${U(id, 1080, 1350)} 1080w, ${U(id, 2160, 2700)} 2160w` });

/** Course visuals for the hero arch. Swap the Unsplash ids to use your own artwork. */
export const HERO_SLIDES = [
  { course: 'Python Programming', alt: 'A learner holding a note that reads Python in front of a monitor', ...img('photo-1526379095098-d400fd0bf935') },
  { course: 'SQL & Databases', alt: 'Glowing 3D cubes connected by lines, like related tables in a database', ...img('photo-1639322537228-f710d846310a') },
  { course: 'Web Development', alt: 'A responsive website shown on a desktop monitor, tablet and phone', ...img('photo-1547658719-da2b51169166') },
  { course: 'AI & Data Science', alt: '3D isometric analytics charts and graphs', ...img('photo-1666875753105-c63a6f3bdc86') }
];

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/**
 * Automatic hero slideshow: 800 ms crossfade with a slow Ken Burns zoom (scale 1 → 1.05).
 * Cycles every 4 s, pauses on hover/keyboard focus and when the tab is hidden, and stays on the
 * first slide (no motion) for users who prefer reduced motion. Images stay in the background layer
 * so overlaid badges remain on top.
 */
export default function HeroSlideshow({ slides = HERO_SLIDES, interval = 4000, className = '' }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(() => new Set());
  const reduced = useRef(reducedMotion());
  const count = slides.length;

  // Advance only to a slide whose image has finished loading, so the crossfade never shows an empty frame.
  const nextIndex = (index + 1) % count;
  const nextReady = ready.has(nextIndex);
  useEffect(() => {
    if (reduced.current || paused || count < 2 || !nextReady) return undefined;
    const t = setTimeout(() => setIndex(nextIndex), interval);
    return () => clearTimeout(t);
  }, [index, nextIndex, nextReady, paused, count, interval]);

  const markReady = (i) => setReady(prev => (prev.has(i) ? prev : new Set([...prev, i])));

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-brand-900 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
      aria-label="Our courses"
    >
      {slides.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.src}
            aria-hidden={!active}
            className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
            style={{ opacity: active ? 1 : 0, zIndex: active ? 1 : 0 }}
          >
            {(i === 0 || ready.has(0)) && (
              <img
                src={s.src}
                srcSet={s.srcSet}
                sizes="(min-width: 640px) 380px, 300px"
                alt={active ? s.alt : ''}
                className={`w-full h-full object-cover will-change-transform ${active && !reduced.current ? 'hero-kenburns' : ''}`}
                loading="eager"
                onLoad={() => markReady(i)}
                onError={() => markReady(i)}
                decoding="async"
                fetchpriority={i === 0 ? 'high' : 'auto'}
              />
            )}
          </div>
        );
      })}
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-brand-900/45 via-transparent to-brand-900/10 pointer-events-none" aria-hidden="true" />
      <div className="absolute z-[3] left-1/2 -translate-x-1/2 bottom-[5.5rem] sm:bottom-24 flex flex-col items-center gap-2">
        <span className="chip bg-ivory/90 backdrop-blur text-brand-900 text-[11px] shadow-soft" aria-live="off">{slides[index].course}</span>
        <div className="flex gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => { if (ready.has(i)) setIndex(i); }}
              aria-label={`Show ${s.course}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-ivory' : 'w-1.5 bg-ivory/55 hover:bg-ivory/80'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
