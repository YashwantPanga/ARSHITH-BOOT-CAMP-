import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Clock, Copy, Lightbulb, Sparkles, Star, Turtle } from 'lucide-react';
import { approachesFor } from '../../../shared/interview/approaches/index.js';
import { Inline } from '../lesson/Markdown';

const KIND = {
  brute: { label: 'Brute force', icon: Turtle, chip: 'bg-rose-50 text-rose-700 border-rose-200' },
  recommended: { label: 'Recommended', icon: Star, chip: 'bg-[#FFF4D6] text-[#8A5A00] border-[#F2D27A]' },
  alt: { label: 'Alternative', icon: ArrowRightLeft, chip: 'bg-brand-50 text-forest border-brand-200' }
};
const kindOf = (a) => (a.recommended ? 'recommended' : a.brute ? 'brute' : 'alt');

function Code({ code }) {
  return <pre className="mt-3 p-3 sm:p-4 max-w-full rounded-xl bg-[#0C2D26] text-[#E8F1EC] text-[12px] sm:text-[13px] leading-[1.65] sm:leading-6 overflow-x-auto thin-scroll font-mono">{code}</pre>;
}

/**
 * Solution tab: every approach to a problem as numbered tabs (brute force → recommended → alternatives),
 * each with its idea, code and complexity, then a comparison table and the interview recommendation.
 */
export default function Approaches({ item, onCopy }) {
  const { list, pick } = useMemo(() => approachesFor(item), [item]);
  const recIndex = list.findIndex(a => a.recommended);
  const [active, setActive] = useState(recIndex);
  const a = list[active];
  const k = KIND[kindOf(a)];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-[20px] font-bold text-evergreen">{list.length > 1 ? `${list.length} ways to solve it` : 'Solution'}</h2>
        {list.length > 1 && <span className="text-[12px] text-charcoal/50">Tap an approach</span>}
      </div>

      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain no-scrollbar -mx-1 px-1 pb-1" role="tablist">
          {list.map((ap, i) => {
            const on = i === active;
            const Icon = KIND[kindOf(ap)].icon;
            return (
              <button key={i} role="tab" aria-selected={on} onClick={() => setActive(i)}
                className={`shrink-0 text-left rounded-xl border px-3 py-2 transition active:scale-[.98] ${on ? 'bg-forest border-forest text-ivory shadow-[0_8px_18px_-10px_rgba(1,58,43,.9)]' : 'bg-white border-brand-900/15 text-charcoal hover:border-sage'}`}>
                <span className={`flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] ${on ? 'text-[#F2D27A]' : 'text-charcoal/45'}`}>
                  <Icon className="w-3 h-3" /> Approach {i + 1}
                </span>
                <span className="block text-[13px] font-semibold mt-0.5 max-w-[190px] truncate">{ap.title}</span>
              </button>
            );
          })}
        </div>
      )}

      <div key={active} className="mt-4 rounded-2xl border border-brand-900/10 bg-white p-3 sm:p-5 animate-fade-up">
        <div className="flex flex-wrap items-center gap-2">
          {list.length > 1 && <span className="font-display text-[15px] font-bold text-evergreen">Approach {active + 1}:</span>}
          <span className="font-display text-[15px] font-bold text-evergreen">{a.title}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${k.chip}`}><k.icon className="w-3 h-3" />{k.label}</span>
        </div>
        <div className="mt-3 flex gap-2.5">
          <Lightbulb className="w-4 h-4 text-sage shrink-0 mt-1" />
          <p className="text-[14.5px] leading-relaxed text-charcoal/85"><Inline text={a.idea} /></p>
        </div>
        <Code code={a.code} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {a.complexity && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cream border border-brand-900/10 text-[12.5px] text-charcoal/75"><Clock className="w-3.5 h-3.5 text-sage" />{a.complexity}</span>}
          <button onClick={() => onCopy(a.code)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-forest hover:underline"><Copy className="w-3.5 h-3.5" /> Try this in the editor</button>
        </div>
      </div>

      {list.length > 1 && (
        <>
          <div className="mt-5 rounded-2xl border border-brand-900/10 overflow-hidden">
            <div className="px-4 py-2.5 bg-cream text-[11.5px] font-semibold uppercase tracking-[0.14em] text-sage">Compare the approaches</div>
            {list.map((ap, i) => (
              <button key={i} onClick={() => setActive(i)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-brand-900/[.08] transition ${ap.recommended ? 'bg-[#FFF9E8]' : 'bg-white hover:bg-brand-50/50'}`}>
                <span className="w-6 h-6 rounded-full bg-brand-100 text-forest text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 text-[13.5px] text-charcoal truncate">{ap.title}{ap.recommended && <Star className="inline w-3.5 h-3.5 ml-1 -mt-0.5 text-[#D9A21B] fill-[#F2D27A]" />}</span>
                <span className="text-[12px] text-charcoal/60 text-right max-w-[45%]">{ap.complexity}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl p-4 bg-gradient-to-br from-[#013A2B] to-[#1E5141] text-ivory">
            <p className="flex items-center gap-2 font-display font-bold text-[15px]"><Sparkles className="w-4 h-4 text-[#F2D27A]" /> For your interview, use Approach {recIndex + 1}</p>
            <p className="mt-1.5 text-[14px] text-ivory/85 leading-relaxed"><Inline text={pick || item.explanation} /></p>
            <p className="mt-2 text-[12.5px] text-ivory/60">Tip: explain the brute force first in one sentence, then improve it. Interviewers love seeing how you get to the better answer.</p>
          </div>
        </>
      )}
    </div>
  );
}
