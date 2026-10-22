import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * "Stacking cards" scroll effect: each child stays pinned while the next one slides up over it,
 * like a deck of cards. A child taller than the screen first scrolls normally and pins only when
 * its bottom reaches the bottom of the screen, so nothing is covered before it has been seen.
 * The covered card shrinks and dims slightly. Users who prefer reduced motion get a normal page.
 */
export default function StackingSections({ children, className = '' }) {
  const items = React.Children.toArray(children).filter(Boolean);
  const rootRef = useRef(null);
  const cardRefs = useRef([]);
  const innerRefs = useRef([]);
  const shadeRefs = useRef([]);
  const [tops, setTops] = useState([]);
  const measureRef = useRef(() => {});
  const lastSize = useRef('');
  const [enabled, setEnabled] = useState(() => typeof window !== 'undefined' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = () => setEnabled(!mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Where each card pins: just under the sticky header, or higher (negative) for cards taller than the screen.
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const measure = () => {
      const headerH = document.querySelector('header')?.offsetHeight || 0;
      const vh = window.innerHeight;
      const heights = cardRefs.current.map(el => el?.offsetHeight || 0);
      lastSize.current = `${vh}|${headerH}|${heights.join(',')}`;
      setTops(heights.map(h => Math.min(headerH, vh - h)));
    };
    measureRef.current = measure;
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    cardRefs.current.forEach(el => el && ro?.observe(el));
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    // Images finishing loading change section heights; 'load' does not bubble, so listen in the capture phase.
    const root = rootRef.current;
    root?.addEventListener('load', measure, true);
    return () => { ro?.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('load', measure); root?.removeEventListener('load', measure, true); };
  }, [enabled, items.length]);

  // Shrink and dim the card that is being covered, based on how far the next card has slid over it.
  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;
    // Re-measure if the window, header or a card changed size without a resize event reaching us.
    const checkSize = () => {
      const headerH = document.querySelector('header')?.offsetHeight || 0;
      const size = `${window.innerHeight}|${headerH}|${cardRefs.current.map(el => el?.offsetHeight || 0).join(',')}`;
      if (size !== lastSize.current) measureRef.current();
    };
    const update = () => {
      frame = 0;
      const headerH = document.querySelector('header')?.offsetHeight || 0;
      const span = Math.max(1, window.innerHeight - headerH);
      cardRefs.current.forEach((el, i) => {
        const next = cardRefs.current[i + 1];
        const inner = innerRefs.current[i];
        const shade = shadeRefs.current[i];
        if (!el || !inner) return;
        const p = next ? Math.min(1, Math.max(0, 1 - (next.getBoundingClientRect().top - headerH) / span)) : 0;
        inner.style.transform = p ? `scale(${1 - 0.05 * p})` : '';
        if (shade) shade.style.opacity = String(0.28 * p);
      });
    };
    const onScroll = () => { checkSize(); if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, [enabled, items.length]);

  if (!enabled) return <div className={className}>{items}</div>;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {items.map((child, i) => (
        <div
          key={child.key ?? i}
          ref={el => { cardRefs.current[i] = el; }}
          className={`sticky ${i > 0 ? 'rounded-t-[28px] sm:rounded-t-[36px] overflow-hidden shadow-[0_-22px_44px_-24px_rgba(1,58,43,.45)]' : ''}`}
          style={{ top: tops[i] ?? 0, zIndex: i + 1 }}
        >
          <div ref={el => { innerRefs.current[i] = el; }} className="relative origin-top will-change-transform">
            {child}
            <div ref={el => { shadeRefs.current[i] = el; }} className="pointer-events-none absolute inset-0 bg-evergreen opacity-0" aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  );
}
