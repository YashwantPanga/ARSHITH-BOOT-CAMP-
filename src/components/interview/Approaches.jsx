import React, { useMemo, useState } from 'react';
import { ArrowDownToLine } from 'lucide-react';
import { approachesFor } from '../../../shared/interview/approaches/index.js';
import { Inline } from '../lesson/Markdown';
import { CodePanel, CopyButton, KeyIdea, PANEL_BTN, StaticCode } from './CodePanel';

const KIND_LABEL = (a) => (a.recommended ? 'Recommended' : a.brute ? 'Brute force' : 'Alternative');
const KIND_CHIP = (a) => (a.recommended ? 'bg-[#E3F1E8] text-[#1E6A45] border-[#CDE5D6]' : a.brute ? 'bg-[#FCE8E6] text-[#A3352B] border-[#F3CFCB]' : 'bg-cream text-charcoal/70 border-brand-900/10');

/**
 * Solution approach: every way to solve the problem as numbered steps (brute force, recommended,
 * alternatives). The selected step shows its code, which can be copied into the editor. The key idea
 * underneath is the interview recommendation.
 */
export default function Approaches({ item, lang, onCopy }) {
  const { list, pick } = useMemo(() => approachesFor(item), [item]);
  const recIndex = Math.max(0, list.findIndex(a => a.recommended));
  const [active, setActive] = useState(recIndex);
  const a = list[active];

  return (
    <div>
      <ol className="space-y-1">
        {list.map((ap, i) => {
          const on = i === active;
          return (
            <li key={i}>
              <button onClick={() => setActive(i)} aria-expanded={on}
                className={`w-full flex gap-3.5 text-left rounded-2xl px-3 py-3 transition ${on ? 'bg-[#F3F8F4]' : 'hover:bg-cream/70'}`}>
                <span className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center text-[14px] font-bold ${on ? 'border-forest text-forest bg-white' : 'border-[#A9CDB7] text-[#3F7A5C]'}`}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[16px] font-bold text-evergreen">{ap.title}</span>
                    {list.length > 1 && <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${KIND_CHIP(ap)}`}>{KIND_LABEL(ap)}</span>}
                  </span>
                  <span className="block mt-1 text-[14.5px] leading-relaxed text-charcoal/75"><Inline text={ap.idea} /></span>
                  {ap.complexity && <span className="block mt-1 font-mono text-[12.5px] text-charcoal/55">{ap.complexity}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <CodePanel key={active} className="mt-4 animate-fade-up" fileName={list.length > 1 ? `Approach ${active + 1}` : null}
        actions={<>
          <CopyButton text={() => a.code} />
          <button onClick={() => onCopy(a.code)} className={PANEL_BTN}><ArrowDownToLine className="w-4 h-4" /> Try in editor</button>
        </>}>
        <StaticCode code={a.code} lang={lang} maxHeight={360} />
      </CodePanel>

      {(pick || item.explanation) && (
        <div className="mt-4">
          <KeyIdea label={list.length > 1 ? `Key idea (use approach ${recIndex + 1} in your interview)` : 'Key idea'}><Inline text={pick || item.explanation} /></KeyIdea>
        </div>
      )}
    </div>
  );
}
