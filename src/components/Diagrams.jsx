import React, { useMemo } from 'react';
import { cleanText } from '../utils/textUtils';

/* Word-wrap a label into at most `maxLines` lines of ~`width` characters. */
function wrap(text, width = 18, maxLines = 3) {
  const words = cleanText(text).replace(/^\d+[.)]\s*/, '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    if (lines.length === maxLines) break;
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…';
  return lines;
}

/**
 * Concept map: the module in the centre, its main concepts radiating out.
 * Generated from the module's own section headings so every module gets a diagram.
 */
export function ConceptMap({ title, concepts = [], onPick }) {
  const items = concepts.slice(0, 8);
  const W = 860;
  const H = items.length > 4 ? 520 : 400;
  const cx = W / 2;
  const cy = H / 2;
  const rx = 300;
  const ry = H / 2 - 70;

  const nodes = useMemo(() => items.map((c, i) => {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / items.length;
    return { ...c, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), lines: wrap(c.label, 20, 2) };
  }), [items, cx, cy, rx, ry]);

  if (!items.length) return null;
  const centre = wrap(title, 16, 3);

  return (
    <div className="rounded-2xl border border-brand-900/10 bg-gradient-to-br from-cream to-white p-2 sm:p-4 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[620px] h-auto" role="img" aria-label={`Concept map for ${cleanText(title)}`}>
        <defs>
          <pattern id="cm-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#013A2B" opacity=".08" /></pattern>
          <filter id="cm-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0C2D26" floodOpacity=".14" /></filter>
        </defs>
        <rect width={W} height={H} fill="url(#cm-dots)" />
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#BCD1C6" strokeDasharray="4 6" />
        {nodes.map((n, i) => (
          <path key={`l${i}`} d={`M${cx},${cy} Q${(cx + n.x) / 2 + (n.y - cy) * 0.12},${(cy + n.y) / 2 - (n.x - cx) * 0.12} ${n.x},${n.y}`} fill="none" stroke="#426557" strokeWidth="1.6" opacity=".55" />
        ))}
        <g filter="url(#cm-shadow)">
          <circle cx={cx} cy={cy} r="86" fill="#013A2B" />
          <circle cx={cx} cy={cy} r="78" fill="none" stroke="#FBF8F1" strokeOpacity=".25" />
          {centre.map((l, i) => (
            <text key={i} x={cx} y={cy + (i - (centre.length - 1) / 2) * 19 + 6} textAnchor="middle" fontFamily="DM Serif Display, Georgia, serif" fontSize="16" fontWeight="400" fill="#FBF8F1">{l}</text>
          ))}
        </g>
        {nodes.map((n, i) => {
          const w = 200;
          const h = n.lines.length > 1 ? 58 : 42;
          return (
            <g key={i} transform={`translate(${n.x - w / 2},${n.y - h / 2})`} className={onPick ? 'cursor-pointer' : ''} onClick={() => onPick?.(n.id)} filter="url(#cm-shadow)">
              <rect width={w} height={h} rx="14" fill="#FFFFFF" stroke="#013A2B" strokeOpacity=".14" />
              <rect width="5" height={h - 16} x="0" y="8" rx="2.5" fill={i % 2 ? '#426557' : '#013A2B'} />
              <circle cx="22" cy={h / 2} r="11" fill="#EFF4F1" />
              <text x="22" y={h / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#013A2B" fontFamily="DM Sans, system-ui, sans-serif">{i + 1}</text>
              {n.lines.map((l, k) => (
                <text key={k} x="42" y={h / 2 + (k - (n.lines.length - 1) / 2) * 16 + 4.5} fontSize="12.5" fontWeight="600" fill="#302B25" fontFamily="DM Sans, system-ui, sans-serif">{l}</text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Horizontal learning-flow diagram: the path a learner follows through a module. */
export function LearningFlow({ steps }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {steps.map((s, i) => (
        <div key={i} className="relative">
          <div className={`h-full rounded-2xl p-4 border transition ${s.done ? 'bg-brand-900 border-brand-900 text-ivory' : 'bg-white border-brand-900/10 text-charcoal'}`}>
            <div className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${s.done ? 'bg-ivory text-brand-900' : 'bg-brand-50 text-brand-900'}`}>{i + 1}</span>
              <s.icon className={`w-4 h-4 ${s.done ? 'text-brand-200' : 'text-sage'}`} />
            </div>
            <p className="mt-3 text-sm font-semibold">{s.title}</p>
            <p className={`text-xs mt-0.5 ${s.done ? 'text-brand-200' : 'text-charcoal/55'}`}>{s.text}</p>
          </div>
          {i < steps.length - 1 && <span className="hidden sm:block absolute top-1/2 -right-3 w-3 h-px bg-brand-300" aria-hidden="true" />}
        </div>
      ))}
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
