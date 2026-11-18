import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Phone carousel for course cards: the centre card is full size, the cards beside it shrink and fade
 * (scale), it loops, and it has dots, a counter and arrows. Native scroll-snap does the swiping, so it
 * feels like the phone's own scrolling; a small scroll handler only sets each card's size.
 */
export default function CourseCarousel({ items, renderItem, getKey, scale = 0.82, label = 'Courses' }) {
  const n = items.length;
  const loop = n > 2;
  // a loop shows three copies and quietly jumps back to the middle copy when you reach an edge
  const slides = loop ? [...items, ...items, ...items] : items;
  const boxRef = useRef(null);
  const frame = useRef(0);
  const settle = useRef(0);
  const [active, setActive] = useState(0);

  const cards = () => [...(boxRef.current?.querySelectorAll('[data-slide]') || [])];

  // size every card by its distance from the centre; returns the index of the centred card
  const paint = useCallback(() => {
    const box = boxRef.current;
    if (!box) return 0;
    const mid = box.scrollLeft + box.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    cards().forEach((el, i) => {
      const centre = el.offsetLeft + el.offsetWidth / 2;
      const d = Math.abs(centre - mid);
      const k = Math.min(1, d / (el.offsetWidth || 1));
      el.style.transform = `scale(${1 - (1 - scale) * k})`;
      el.style.opacity = String(1 - 0.38 * k);
      if (d < bestD) { bestD = d; best = i; }
    });
    setActive(n ? best % n : 0);
    return best;
  }, [n, scale]);

  // which card is in the middle right now (reads only, so it never disturbs a scroll in progress)
  const centred = () => {
    const box = boxRef.current;
    if (!box) return 0;
    const mid = box.scrollLeft + box.clientWidth / 2;
    let best = 0;
    let bestD = Infinity;
    cards().forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < bestD) { bestD = d; best = i; } });
    return best;
  };

  const centreOn = useCallback((i, smooth) => {
    const box = boxRef.current;
    const el = cards()[i];
    if (!box || !el) return;
    box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  // start on the first card of the middle copy
  useEffect(() => {
    if (!n) return undefined;
    const start = () => { centreOn(loop ? n : 0, false); paint(); };
    start();
    window.addEventListener('resize', start);
    return () => window.removeEventListener('resize', start);
  }, [n, loop, centreOn, paint]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
    if (!loop) return;
    clearTimeout(settle.current);
    // once the swipe has settled, jump from an outer copy back to the same card in the middle copy
    settle.current = setTimeout(() => {
      const best = paint();
      if (best < n || best >= 2 * n) { centreOn(n + (best % n), false); paint(); }
    }, 140);
  };
  useEffect(() => () => { cancelAnimationFrame(frame.current); clearTimeout(settle.current); }, []);

  const step = (dir) => centreOn(centred() + dir, true);
  const goTo = (i) => centreOn((loop ? n : 0) + i, true);

  if (!n) return null;
  return (
    <div className="course-carousel" role="region" aria-roledescription="carousel" aria-label={label}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } }}>
      <div ref={boxRef} onScroll={onScroll} className="cc-track no-scrollbar">
        {slides.map((item, i) => {
          const copy = loop && (i < n || i >= 2 * n);
          return (
            <div key={`${getKey(item)}-${i}`} data-slide className="cc-slide" role="group" aria-roledescription="slide"
              aria-label={`${(i % n) + 1} of ${n}`} aria-hidden={copy || undefined}>
              {renderItem(item, { tabIndex: copy ? -1 : undefined })}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1">
        <button type="button" onClick={() => step(-1)} className="cc-arrow" aria-label="Previous course"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {items.map((item, i) => (
              <button key={getKey(item)} type="button" onClick={() => goTo(i)} aria-label={`Go to course ${i + 1}`} aria-current={i === active || undefined}
                className={`cc-dot ${i === active ? 'is-on' : ''}`} />
            ))}
          </div>
          <span className="text-[12px] font-semibold text-charcoal/55 tabular-nums" aria-live="polite">{active + 1} / {n}</span>
        </div>
        <button type="button" onClick={() => step(1)} className="cc-arrow" aria-label="Next course"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
}
