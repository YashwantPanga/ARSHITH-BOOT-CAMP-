import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { TrackMark } from './TrackBadge';

const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/**
 * Accessible automatic slideshow for a course's images.
 * - autoplay with a configurable interval; pauses on hover, keyboard focus, or via the pause button
 * - no autoplay and no slide animation when the user prefers reduced motion
 * - ←/→ keys, previous/next buttons and clickable indicators
 * - fixed aspect ratio (no layout shift); only the current and neighbouring slides load
 */
export default function CourseSlideshow({ slides, courseTitle, iconType, interval = 5000, className = '' }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [paused, setPaused] = useState(() => prefersReducedMotion());
  const [failed, setFailed] = useState({});
  const reduced = useRef(prefersReducedMotion());
  const count = slides.length;

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => { setIndex(0); }, [slides]);

  useEffect(() => {
    if (count < 2 || paused || hovered || focused) return undefined;
    const t = setTimeout(next, interval);
    return () => clearTimeout(t);
  }, [count, paused, hovered, focused, interval, next, index]);

  // Pause when the tab is hidden.
  useEffect(() => {
    const onVis = () => { if (document.hidden) setPaused(true); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  if (!count) {
    // No image mapped: a styled course card rather than a broken image or another course's flyer.
    return (
      <div className={`relative aspect-[16/10] rounded-[2rem] overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-sage flex items-center justify-center ${className}`}>
        <div className="text-center text-ivory px-6">
          <TrackMark type={iconType} className="w-14 h-14 mx-auto" />
          <p className="mt-3 font-display text-2xl">{courseTitle}</p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`relative rounded-[2rem] overflow-hidden ring-8 ring-white/10 shadow-2xl bg-evergreen ${className}`}
      aria-roledescription="carousel"
      aria-label={`${courseTitle} images`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
      onKeyDown={onKeyDown}
    >
      <div className="relative aspect-[16/10]">
        {slides.map((s, i) => {
          const near = i === index || i === (index + 1) % count || i === (index - 1 + count) % count;
          const active = i === index;
          return (
            <figure
              key={s.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className={`absolute inset-0 m-0 ${reduced.current ? '' : 'transition-opacity duration-700 ease-out'} ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              {failed[i] || !near ? (
                <div className="w-full h-full bg-gradient-to-br from-brand-900 via-brand-700 to-sage" role="img" aria-label={s.alt} />
              ) : (
                <img
                  src={s.src}
                  alt={s.alt}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={() => setFailed(f => ({ ...f, [i]: true }))}
                />
              )}
              {s.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 p-4 pr-24 sm:p-5 sm:pr-28 bg-gradient-to-t from-evergreen/85 via-evergreen/40 to-transparent text-ivory text-sm sm:text-[15px] leading-snug">
                  {s.caption}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button type="button" onClick={prev} aria-label="Previous image" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ivory/90 text-brand-900 flex items-center justify-center shadow-floating hover:bg-white focus-visible:ring-4 focus-visible:ring-brand-200">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={next} aria-label="Next image" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-ivory/90 text-brand-900 flex items-center justify-center shadow-floating hover:bg-white focus-visible:ring-4 focus-visible:ring-brand-200">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-evergreen/70 backdrop-blur px-2 py-1.5">
            {slides.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-ivory' : 'w-2 bg-ivory/50 hover:bg-ivory/80'}`}
              />
            ))}
            <button type="button" onClick={() => setPaused(p => !p)} aria-label={paused ? 'Start automatic slideshow' : 'Pause automatic slideshow'} className="ml-1 w-6 h-6 rounded-full text-ivory flex items-center justify-center hover:bg-white/15">
              {paused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">Image {index + 1} of {count}: {slides[index]?.alt}</p>
        </>
      )}
    </section>
  );
}
