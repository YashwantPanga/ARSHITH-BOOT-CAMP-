import React, { useEffect, useId, useRef } from 'react';

/**
 * Soft "bubble" background: large blurred colour bubbles drifting on their own paths and melting into
 * each other (an SVG goo filter plus blur), and one bubble that follows the pointer. Colours default to
 * the site palette (cream base with mint, sage, leaf and a little gold); `accent` tints the pointer bubble.
 * Fills its parent (position it with className, e.g. "absolute inset-0").
 * `lite` skips the goo/blur filter (the bubbles are already soft gradients), which keeps a full-screen
 * layer cheap to animate; `base={false}` drops the cream base so it can tint the page underneath.
 */
const DEFAULT_COLORS = {
  first: '188,209,198',   // mint  #BCD1C6
  second: '120,190,150',  // light leaf
  third: '229,200,142',   // soft gold #E5C88E
  fourth: '159,211,199',  // sea mint
  fifth: '96,150,124'     // sage
};

const toRgb = (hex) => {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return '120,190,150';
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
};

export default function BubbleBackground({ className = '', interactive = true, accent, colors = DEFAULT_COLORS, lite = false, base = true }) {
  const rootRef = useRef(null);
  const dotRef = useRef(null);
  const gooId = `goo-${useId().replace(/:/g, '')}`;

  // pointer bubble: eases towards the pointer every frame
  useEffect(() => {
    const root = rootRef.current;
    const dot = dotRef.current;
    if (!interactive || !root || !dot) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const host = root.parentElement || root;
    if (window.matchMedia?.('(pointer: coarse)').matches) return undefined; // touch: no pointer to follow
    let tx = 0; let ty = 0; let x = 0; let y = 0; let raf = 0;
    const onMove = (e) => {
      const r = root.getBoundingClientRect();
      tx = e.clientX - r.left - r.width / 2;
      ty = e.clientY - r.top - r.height / 2;
    };
    const step = () => {
      x += (tx - x) / 14;
      y += (ty - y) / 14;
      dot.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      raf = requestAnimationFrame(step);
    };
    host.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(step);
    return () => { host.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, [interactive]);

  const bubble = (rgb) => `radial-gradient(circle at center, rgba(${rgb}, .8) 0, rgba(${rgb}, 0) 50%) no-repeat`;
  const accentRgb = accent ? toRgb(accent) : colors.second;

  return (
    <div ref={rootRef} className={`bubble-bg overflow-hidden ${base ? '' : 'no-base'} ${lite ? 'is-lite' : ''} ${className}`} aria-hidden="true">
      {!lite && <svg className="absolute w-0 h-0">
        <defs>
          <filter id={gooId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>}
      <div className="bubble-field absolute inset-0" style={lite ? undefined : { filter: `url(#${gooId}) blur(40px)` }}>
        <span className="bubble b1" style={{ background: bubble(colors.first) }} />
        <span className="bubble b2" style={{ background: bubble(colors.second) }} />
        <span className="bubble b3" style={{ background: bubble(colors.third) }} />
        <span className="bubble b4" style={{ background: bubble(colors.fourth) }} />
        <span className="bubble b5" style={{ background: bubble(colors.fifth) }} />
        {interactive && <span ref={dotRef} className="bubble b-pointer" style={{ background: bubble(accentRgb) }} />}
      </div>
    </div>
  );
}
