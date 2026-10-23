import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Compass, Hash, MousePointerClick } from 'lucide-react';

const TREE_FROM = 7; // this many concepts or more use the tree layout

/**
 * Animated concept map of a module's key ideas, drawn as numbered cards around the module topic.
 *  - Up to 6 ideas ("hub"): the topic sits in a glowing hub in the middle, ideas to its left and
 *    right (left column first, then right), each joined to the hub by a curved connector.
 *  - 7 or more ("tree"): the hub sits on top, a trunk runs down between two columns and every idea
 *    branches off it, read left-right, row by row.
 * Connectors are measured from the real card positions so they always meet the cards exactly;
 * light flows along them and a dot travels out to each idea. On narrow screens the hub sits on
 * top and the cards stack in one numbered column.
 *
 * concepts: [{ id, title, sub, summary }]. onPick(id) jumps to the concept's explanation.
 */
export default function ConceptMap({ title, concepts = [], onPick }) {
  const wrapRef = useRef(null);
  const hubRef = useRef(null);
  const cardRefs = useRef([]);
  const [geo, setGeo] = useState({ w: 0, h: 0, paths: [], trunk: '', wide: false });
  const [hover, setHover] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [reduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const tree = concepts.length >= TREE_FROM;
  const half = Math.ceil(concepts.length / 2);
  const isLeft = (i) => (tree ? i % 2 === 0 : i < half);

  // Measure the cards and the hub, then route a connector from each card's inner edge.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const f = (n) => n.toFixed(1);
    const measure = () => {
      const hub = hubRef.current;
      const wb = wrap.getBoundingClientRect();
      const wide = wb.width >= 600;
      if (!hub || !wide) { setGeo({ w: 0, h: 0, paths: [], trunk: '', wide }); return; }
      const hb = hub.getBoundingClientRect();
      const hx = hb.left + hb.width / 2 - wb.left;
      const hy = hb.top + hb.height / 2 - wb.top;
      const r = hb.width / 2 + 4;
      let lastY = hy;
      const paths = concepts.map((_, i) => {
        const el = cardRefs.current[i];
        if (!el) return '';
        const b = el.getBoundingClientRect();
        const left = isLeft(i);
        const sx = (left ? b.right : b.left) - wb.left;
        const sy = b.top + b.height / 2 - wb.top;
        if (tree) {
          // branch: leaves the card level, then bends up into the trunk
          lastY = Math.max(lastY, sy);
          const mx = (sx + hx) / 2;
          return `M${f(sx)},${f(sy)} C${f(mx)},${f(sy)} ${f(hx)},${f(sy)} ${f(hx)},${f(sy - 26)}`;
        }
        const a = Math.atan2(sy - hy, sx - hx);
        const ex = hx + r * Math.cos(a);
        const ey = hy + r * Math.sin(a);
        const dx = ex - sx;
        return `M${f(sx)},${f(sy)} C${f(sx + dx * 0.55)},${f(sy)} ${f(ex - dx * 0.3)},${f(ey)} ${f(ex)},${f(ey)}`;
      });
      const trunk = tree ? `M${f(hx)},${f(hb.bottom - wb.top + 4)} L${f(hx)},${f(lastY - 26)}` : '';
      setGeo({ w: wb.width, h: wb.height, paths, trunk, wide });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    // cards slide in with a transform; measure again once they have settled
    const settle = visible ? setTimeout(measure, 900 + concepts.length * 90) : null;
    return () => { ro.disconnect(); clearTimeout(settle); };
  }, [concepts, half, tree, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play the entrance once the map scrolls into view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  if (!concepts.length) return null;

  const card = (c, i) => {
    const left = isLeft(i);
    const on = hover === i;
    return (
      <button
        key={i}
        ref={el => { cardRefs.current[i] = el; }}
        type="button"
        onClick={() => onPick?.(c.id)}
        onMouseEnter={() => setHover(i)}
        onMouseLeave={() => setHover(-1)}
        onFocus={() => setHover(i)}
        onBlur={() => setHover(-1)}
        className={`cm-card group relative w-full text-left rounded-2xl bg-white border px-3.5 py-3 transition duration-300 focus-visible:outline-none ${on ? 'border-sage/60 shadow-[0_18px_36px_-20px_rgba(1,58,43,.55)] -translate-y-0.5' : 'border-brand-900/10 shadow-[0_8px_22px_-18px_rgba(1,58,43,.45)]'} ${visible ? 'cm-card-in' : 'opacity-0'}`}
        style={{ animationDelay: `${0.25 + i * 0.08}s` }}
        aria-label={`Concept ${i + 1}: ${c.title}. Go to its explanation`}
      >
        {/* connector port on the side that faces the hub / trunk */}
        <span className={`${geo.wide ? 'block' : 'hidden'} absolute top-1/2 -mt-[5px] w-2.5 h-2.5 rounded-full border-2 border-white transition-colors ${on ? 'bg-forest' : 'bg-sage/70'} ${left ? '-right-[6px]' : '-left-[6px]'}`} aria-hidden="true" />
        <span className="flex items-start gap-3">
          <span className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[12.5px] font-bold transition-colors ${on ? 'bg-forest text-ivory' : 'bg-brand-50 text-forest'}`}>{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold leading-snug text-brand-900">{c.title}</span>
            {c.sub && <span className="block mt-0.5 text-[12px] font-medium leading-snug text-sage">{c.sub}</span>}
            {c.summary && <span className="mt-1.5 text-[12.5px] leading-relaxed text-charcoal/60 line-clamp-3">{c.summary}</span>}
            <span className={`mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-forest transition-all ${on ? 'opacity-100 translate-x-0' : 'opacity-60 -translate-x-0.5'}`}>
              Read explanation <ArrowRight className="w-3 h-3" />
            </span>
          </span>
        </span>
      </button>
    );
  };

  const long = title.length > 34;
  const dim = (i) => (hover === -1 || hover === i ? 1 : 0.3);
  const hubSize = geo.wide && !tree ? 'w-[164px] h-[164px]' : 'w-[168px] h-[168px]';

  const hubEl = (
    <div ref={hubRef} className={`relative ${hubSize} ${visible ? 'cm-hub-in' : 'opacity-0'}`}>
      {!reduced && <><span className="cm-ring absolute inset-0 rounded-full border-2 border-sage/40" aria-hidden="true" /><span className="cm-ring absolute inset-0 rounded-full border-2 border-sage/30" style={{ animationDelay: '1.4s' }} aria-hidden="true" /></>}
      <svg viewBox="0 0 100 100" className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] cel-spin-slow" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="none" stroke="#90B1A2" strokeWidth=".6" strokeDasharray="1.5 3" />
        <circle cx="50" cy="2" r="1.8" fill="#D9B44A" />
      </svg>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,#0E5C45,#013A2B_62%,#00261C)] shadow-[0_20px_40px_-14px_rgba(1,58,43,.7),inset_0_2px_0_rgba(255,255,255,.12)] flex flex-col items-center justify-center text-center px-5">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-brand-200/80">Module topic</span>
        <span className={`mt-1.5 font-display text-ivory leading-tight ${long ? 'text-[13.5px]' : 'text-[16px]'}`}>{title}</span>
        <span className="mt-2 text-[10.5px] font-semibold text-[#E9D79A]">{concepts.length} key ideas</span>
      </div>
    </div>
  );

  let body;
  if (geo.wide && tree) {
    body = (
      <>
        <div className="col-span-2 flex justify-center pt-2 pb-8">{hubEl}</div>
        {concepts.map((c, i) => card(c, i))}
      </>
    );
  } else if (geo.wide) {
    body = (
      <>
        <div className="col-start-2 row-start-1 flex justify-center">{hubEl}</div>
        <div className="col-start-1 row-start-1 space-y-3">{concepts.slice(0, half).map((c, i) => card(c, i))}</div>
        <div className="col-start-3 row-start-1 space-y-3">{concepts.slice(half).map((c, i) => card(c, i + half))}</div>
      </>
    );
  } else {
    body = (
      <>
        <div className="flex justify-center py-3">{hubEl}</div>
        <div className="space-y-3">{concepts.map((c, i) => card(c, i))}</div>
      </>
    );
  }
  const grid = !geo.wide ? 'grid gap-3'
    : tree ? 'grid grid-cols-2 gap-x-16 gap-y-3.5 items-start'
      : 'grid gap-x-10 grid-cols-[minmax(0,1fr)_164px_minmax(0,1fr)] items-center';

  return (
    <div className="space-y-4">
      {/* how to read it */}
      <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
        {[
          { icon: Compass, t: 'The green hub is this module', d: 'Every idea on the map belongs to this topic.' },
          { icon: Hash, t: 'Each card is one key idea', d: 'Numbered in the order you will learn them.' },
          { icon: MousePointerClick, t: 'Click a card', d: 'It takes you straight to its full explanation.' }
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex items-start gap-2.5 rounded-xl bg-brand-50/70 border border-brand-900/5 px-3 py-2.5">
            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-sage" aria-hidden="true" />
            <p className="text-[12.5px] leading-snug text-charcoal/70"><strong className="block text-brand-900 font-semibold">{t}</strong>{d}</p>
          </div>
        ))}
      </div>

      <div className="relative rounded-3xl border border-brand-900/10 bg-gradient-to-br from-cream via-white to-brand-50/40 p-3.5 sm:p-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(rgba(1,58,43,.09) 1px, transparent 1px)', backgroundSize: '22px 22px' }} aria-hidden="true" />

        <div ref={wrapRef} className={`relative ${grid}`}>
          {geo.paths.length > 0 && (
            <svg className="absolute inset-0 pointer-events-none overflow-visible" width={geo.w} height={geo.h} aria-hidden="true">
              {geo.trunk && (
                <g>
                  <path d={geo.trunk} data-base="1" fill="none" stroke="#90B1A2" strokeWidth="2" strokeOpacity=".8" strokeLinecap="round" className={visible ? 'cm-draw' : ''} />
                  {visible && !reduced && <path d={geo.trunk} fill="none" stroke="#426557" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 12" className="cm-flow-down" strokeOpacity=".7" />}
                </g>
              )}
              {geo.paths.map((d, i) => d && (
                <g key={i}>
                  <path d={d} data-base="1" fill="none" stroke={hover === i ? '#013A2B' : '#90B1A2'} strokeWidth={hover === i ? 2.4 : 1.5} strokeOpacity={0.75 * dim(i) + 0.05} className={visible ? 'cm-draw' : ''} style={{ animationDelay: `${0.2 + i * 0.08}s`, transition: 'stroke .25s, stroke-width .25s, stroke-opacity .25s' }} />
                  {visible && !reduced && (
                    <>
                      <path d={d} fill="none" stroke="#426557" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 12" className="cm-flow" strokeOpacity={0.7 * dim(i)} />
                      <circle r={hover === i ? 4.5 : 3.2} fill="#D9B44A" stroke="#fff" strokeWidth="1.2" visibility="hidden">
                        <set attributeName="visibility" to="visible" begin={`${1.2 + i * 0.3}s`} />
                        <animateMotion dur={tree ? '2.4s' : '3.4s'} begin={`${1.2 + i * 0.3}s`} repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path={d} />
                      </circle>
                    </>
                  )}
                </g>
              ))}
            </svg>
          )}
          {body}
        </div>
      </div>
    </div>
  );
}
