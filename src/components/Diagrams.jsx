import React, { useState } from 'react';
import { ArrowDownRight } from 'lucide-react';
import { cleanText } from '../utils/textUtils';

export { default as ConceptMap } from './lesson/ConceptMap';

/**
 * Horizontal learning-flow diagram: the path a learner follows through a module.
 * Steps with an onClick become buttons: a click sends a ripple out from the pointer, pops the
 * step's number and icon, then calls onClick (used to scroll to that part of the module).
 */
export function LearningFlow({ steps }) {
  const [burst, setBurst] = useState(null); // { i, x, y, key }
  const click = (e, s, i) => {
    const r = e.currentTarget.getBoundingClientRect();
    setBurst({ i, x: (e.clientX || r.left + r.width / 2) - r.left, y: (e.clientY || r.top + r.height / 2) - r.top, key: Date.now() });
    s.onClick();
  };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {steps.map((s, i) => {
        const Tag = s.onClick ? 'button' : 'div';
        const hit = burst?.i === i;
        return (
          <div key={i} className="relative">
            <Tag
              type={s.onClick ? 'button' : undefined}
              onClick={s.onClick ? (e) => click(e, s, i) : undefined}
              aria-label={s.onClick ? `${s.title}: go to this part of the module` : undefined}
              className={`flow-step group relative overflow-hidden w-full h-full text-left rounded-2xl p-4 border transition duration-300 ${s.done ? 'bg-brand-900 border-brand-900 text-ivory' : 'bg-white border-brand-900/10 text-charcoal'} ${s.onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(1,58,43,.55)] active:translate-y-0 active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage' : ''} ${hit ? 'flow-step-hit' : ''}`}
            >
              {hit && (
                <span key={burst.key} className="pointer-events-none absolute inset-0" aria-hidden="true">
                  <span className={`flow-ripple absolute rounded-full ${s.done ? 'bg-ivory/25' : 'bg-sage/25'}`} style={{ left: burst.x, top: burst.y }} />
                  {[0, 1, 2, 3, 4, 5, 6, 7].map(k => (
                    <span key={k} className={`flow-spark absolute w-1.5 h-1.5 rounded-full ${s.done ? 'bg-ivory' : 'bg-sage'}`} style={{ left: burst.x, top: burst.y, '--a': `${k * 45}deg` }} />
                  ))}
                </span>
              )}
              <div className="relative flex items-center gap-2">
                <span key={hit ? burst.key : 'n'} className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${hit ? 'flow-pop' : ''} ${s.done ? 'bg-ivory text-brand-900' : 'bg-brand-50 text-brand-900'}`}>{i + 1}</span>
                <s.icon className={`w-4 h-4 transition-transform duration-300 ${s.onClick ? 'group-hover:rotate-[-8deg] group-hover:scale-110' : ''} ${s.done ? 'text-brand-200' : 'text-sage'}`} />
                {s.onClick && <ArrowDownRight className={`ml-auto w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition ${s.done ? 'text-brand-200' : 'text-sage'}`} aria-hidden="true" />}
              </div>
              <p className="relative mt-3 text-sm font-semibold">{s.title}</p>
              <p className={`relative text-xs mt-0.5 ${s.done ? 'text-brand-200' : 'text-charcoal/55'}`}>{s.text}</p>
            </Tag>
            {i < steps.length - 1 && <span className="hidden sm:block absolute top-1/2 -right-3 w-3 h-px bg-brand-300" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}

/** ASCII architecture diagrams rendered on a blueprint-style surface. */
export function BlueprintDiagram({ ascii, caption }) {
  return (
    <figure className="rounded-2xl overflow-hidden border border-black/20 bg-evergreen relative">
      <div className="absolute inset-0 opacity-[.12] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#BCD1C6 1px, transparent 1px), linear-gradient(90deg, #BCD1C6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="relative flex items-center gap-2 px-4 h-9 border-b border-white/10 bg-black/20">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-300">architecture diagram</span>
      </div>
      <pre className="relative p-5 text-[12.5px] leading-[1.55] text-[#E9F1EC] font-mono overflow-x-auto thin-scroll">{ascii}</pre>
      {caption && <figcaption className="relative px-5 pb-4 text-xs text-brand-200">{caption}</figcaption>}
    </figure>
  );
}
