import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';

/*
 * Presentation-style diagrams (the look of a well-made PowerPoint / SmartArt slide): solid shapes,
 * chevron processes, pyramids, cycles, a triangle, hub-and-spoke and header columns, drawn as SVG.
 * Data lives in src/data/cyberDiagrams.js. Section types:
 *   chevrons {steps:[{title,text}]}         process left → right (up to 6 steps)
 *   steps    {steps:[{title,text}]}         numbered vertical process (any length)
 *   pyramid  {levels:[{title,text}]}        top = narrowest
 *   cycle    {center, nodes:[{title}]}      repeating loop
 *   triad    {center, items:[3 × {title,text}]}
 *   hub      {center, items:[{title,text}]}
 *   columns  {columns:[{title,subtitle,items:[]}]}
 *   stack    {layers:[{title,text}]}        labelled horizontal bands
 *   table    {head:[], rows:[[]]}
 */

const PALETTE = ['#0F5A45', '#2B8A73', '#C08A2B', '#35596A', '#7A4E8C', '#B5523B'];
const INK = '#1F2A26';
const MUTED = '#4C5A55';
const FONT = 'DM Sans, Segoe UI, Arial, sans-serif';
const W = 1000;

const colorOf = (i, c) => c || PALETTE[i % PALETTE.length];

/** Splits text into lines that fit `width` at `size` (approximate glyph width). */
function wrap(text, width, size, bold = false) {
  const per = size * (bold ? 0.56 : 0.52);
  const max = Math.max(4, Math.floor(width / per));
  const lines = [];
  let line = '';
  for (const word of String(text || '').split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function Txt({ x, y, lines, size = 16, weight = 400, fill = INK, anchor = 'middle', lh = 1.25 }) {
  return (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} fontFamily={FONT}>
      {lines.map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : size * lh}>{l}</tspan>)}
    </text>
  );
}

/** Text block vertically centred on cy. */
const centred = (cy, n, size, lh = 1.25) => cy - ((n - 1) * size * lh) / 2 + size * 0.35;

function Shadow({ id }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0C2D26" floodOpacity=".22" />
    </filter>
  );
}

function Arrow({ id, color = '#8A9A94' }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={color} />
    </marker>
  );
}

/* ---------------------------------------------------------------- shapes */

function Chevrons({ s, uid }) {
  const n = s.steps.length;
  const h = 106, tip = 26, gap = 6;
  const w = (W - gap * (n - 1)) / n;
  const desc = s.steps.map(st => wrap(st.text, w - 14, 17.5));
  const H = h + 30 + Math.max(0, ...desc.map(d => d.length)) * 22 + 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /></defs>
      {s.steps.map((st, i) => {
        const x = i * (w + gap);
        const left = i === 0 ? `${x},0` : `${x},0`;
        const pts = i === 0
          ? `${x},0 ${x + w - tip},0 ${x + w},${h / 2} ${x + w - tip},${h} ${x},${h}`
          : `${x - tip + gap},0 ${x + w - tip},0 ${x + w},${h / 2} ${x + w - tip},${h} ${x - tip + gap},${h} ${x + gap},${h / 2}`;
        const title = wrap(st.title, w - tip - 22, 19, true).slice(0, 3);
        const cx = x + (i === 0 ? (w - tip) / 2 : w / 2 - tip / 4);
        return (
          <g key={i} data-left={left}>
            <polygon points={pts} fill={colorOf(i, st.color)} filter={`url(#${uid}s)`} />
            <Txt x={cx} y={centred(h / 2, title.length, 19)} lines={title} size={19} weight={700} fill="#fff" />
            <Txt x={x + w / 2 - (i === n - 1 ? 0 : tip / 2)} y={h + 32} lines={desc[i]} size={17.5} fill={MUTED} />
          </g>
        );
      })}
    </svg>
  );
}

function Steps({ s, uid }) {
  const rows = s.steps.map(st => ({ t: wrap(st.title, 300, 20, true), d: wrap(st.text, 560, 17.5) }));
  const rh = rows.map(r => Math.max(72, Math.max(r.t.length * 25, r.d.length * 22.5) + 28));
  const H = rh.reduce((a, b) => a + b, 0) + 10;
  let y = 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /></defs>
      <line x1={58} y1={30} x2={58} y2={H - 40} stroke="#C9D6D0" strokeWidth={4} />
      {rows.map((r, i) => {
        const top = y; y += rh[i];
        const c = colorOf(i, s.steps[i].color);
        const mid = top + (rh[i] - 10) / 2;
        return (
          <g key={i}>
            <circle cx={58} cy={mid} r={26} fill={c} filter={`url(#${uid}s)`} />
            <Txt x={58} y={mid + 7} lines={[String(i + 1)]} size={20} weight={700} fill="#fff" />
            <rect x={104} y={top} width={330} height={rh[i] - 10} rx={10} fill={c} filter={`url(#${uid}s)`} />
            <Txt x={124} y={centred(mid, r.t.length, 20, 1.22)} lines={r.t} size={20} weight={700} fill="#fff" anchor="start" lh={1.22} />
            <rect x={434} y={top} width={562} height={rh[i] - 10} rx={10} fill="#F2F6F4" stroke="#DCE6E1" />
            <Txt x={454} y={centred(mid, r.d.length, 17.5, 1.27)} lines={r.d} size={17.5} fill={INK} anchor="start" lh={1.27} />
          </g>
        );
      })}
    </svg>
  );
}

function Pyramid({ s, uid }) {
  const L = s.levels.length;
  const lh = 72, top = 14, apexW = 92, baseW = 560, cx = 300;
  const H = top + L * lh + 16;
  const widthAt = (y) => apexW + (baseW - apexW) * ((y - top) / (L * lh));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /></defs>
      {s.levels.map((lv, i) => {
        const y0 = top + i * lh, y1 = y0 + lh - 5;
        const w0 = widthAt(y0), w1 = widthAt(y1);
        const pts = `${cx - w0 / 2},${y0} ${cx + w0 / 2},${y0} ${cx + w1 / 2},${y1} ${cx - w1 / 2},${y1}`;
        const title = wrap(lv.title, Math.max(w0, 150) - 20, 16, true).slice(0, 2);
        const note = wrap(lv.text, 360, 17).slice(0, 3);
        const mid = (y0 + y1) / 2;
        return (
          <g key={i}>
            <polygon points={pts} fill={colorOf(i, lv.color)} filter={`url(#${uid}s)`} />
            <Txt x={cx} y={centred(mid, title.length, 18)} lines={title} size={i === 0 ? 16 : 18} weight={700} fill="#fff" />
            {lv.text && <line x1={cx + w1 / 2 + 8} y1={mid} x2={612} y2={mid} stroke="#B9C7C1" strokeWidth={1.5} strokeDasharray="4 4" />}
            {lv.text && <circle cx={612} cy={mid} r={4} fill={colorOf(i, lv.color)} />}
            {lv.text && <Txt x={626} y={centred(mid, note.length, 17)} lines={note} size={17} fill={INK} anchor="start" />}
          </g>
        );
      })}
    </svg>
  );
}

function Cycle({ s, uid }) {
  const n = s.nodes.length;
  const R = n > 5 ? 190 : 170, r = n > 5 ? 66 : 72;
  const cx = W / 2, cy = R + r + 10;
  const H = cy + R + r + 14;
  const at = (i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + R * Math.cos(a), cy + R * Math.sin(a), a]; };
  const step = (2 * Math.PI) / n;
  const pad = Math.asin(Math.min(0.95, (r + 10) / R));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /><Arrow id={`${uid}a`} color="#7E938B" /></defs>
      {s.nodes.map((_, i) => {
        const a0 = -Math.PI / 2 + i * step + pad, a1 = -Math.PI / 2 + (i + 1) * step - pad;
        const p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)], p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
        return <path key={`a${i}`} d={`M${p0[0]},${p0[1]} A${R},${R} 0 0 1 ${p1[0]},${p1[1]}`} fill="none" stroke="#9FB2AA" strokeWidth={5} markerEnd={`url(#${uid}a)`} />;
      })}
      {s.center && (() => {
        const t = wrap(s.center, 150, 19, true);
        return <g><circle cx={cx} cy={cy} r={84} fill="#F2F6F4" stroke="#D3DFD9" strokeWidth={2} /><Txt x={cx} y={centred(cy, t.length, 19)} lines={t} size={19} weight={700} fill={INK} /></g>;
      })()}
      {s.nodes.map((nd, i) => {
        const [x, y] = at(i);
        const t = wrap(nd.title, r * 1.6, 17.5, true).slice(0, 3);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={colorOf(i, nd.color)} filter={`url(#${uid}s)`} />
            <Txt x={x} y={centred(y, t.length, 17.5)} lines={t} size={17.5} weight={700} fill="#fff" />
          </g>
        );
      })}
    </svg>
  );
}

function Triad({ s, uid }) {
  const H = 600;
  const V = [[500, 92], [262, 404], [738, 404]];
  const r = 78;
  const placements = [
    { x: 600, y: 60, anchor: 'start', w: 360 },
    { x: 40, y: 500, anchor: 'start', w: 380 },
    { x: 580, y: 500, anchor: 'start', w: 380 }
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /></defs>
      <polygon points={V.map(v => v.join(',')).join(' ')} fill="#EEF4F1" stroke="#C3D3CB" strokeWidth={3} />
      {s.center && (() => { const t = wrap(s.center, 170, 21, true); return <Txt x={500} y={centred(300, t.length, 21)} lines={t} size={21} weight={700} fill={INK} />; })()}
      {s.items.map((it, i) => {
        const [x, y] = V[i];
        const t = wrap(it.title, 2 * r - 18, 19, true);
        const p = placements[i];
        const d = wrap(it.text, p.w, 17).slice(0, 3);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill={colorOf(i, it.color)} filter={`url(#${uid}s)`} />
            <Txt x={x} y={centred(y, t.length, 19)} lines={t} size={19} weight={700} fill="#fff" />
            <Txt x={p.x} y={i === 0 ? p.y + 8 : p.y} lines={d} size={17} fill={MUTED} anchor={p.anchor} />
          </g>
        );
      })}
    </svg>
  );
}

function Hub({ s, uid }) {
  const n = s.items.length;
  const bw = 252, bh = 104, cx = W / 2;
  const rx = 360, ry = n > 4 ? 170 : 140;
  const cy = ry + bh / 2 + 8;
  const H = cy + ry + bh / 2 + 12;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /></defs>
      {s.items.map((_, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        return <line key={`l${i}`} x1={cx} y1={cy} x2={cx + rx * Math.cos(a)} y2={cy + ry * Math.sin(a)} stroke="#B9C7C1" strokeWidth={3} />;
      })}
      {(() => { const t = wrap(s.center, 150, 20, true); return <g><circle cx={cx} cy={cy} r={88} fill={INK} filter={`url(#${uid}s)`} /><Txt x={cx} y={centred(cy, t.length, 20)} lines={t} size={20} weight={700} fill="#fff" /></g>; })()}
      {s.items.map((it, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
        const t = wrap(it.title, bw - 24, 18, true).slice(0, 2);
        const d = wrap(it.text, bw - 24, 15.5).slice(0, 2);
        const total = t.length * 22 + (d.length ? 6 + d.length * 19 : 0);
        const y0 = y - total / 2 + 14;
        return (
          <g key={i}>
            <rect x={x - bw / 2} y={y - bh / 2} width={bw} height={bh} rx={14} fill={colorOf(i, it.color)} filter={`url(#${uid}s)`} />
            <Txt x={x} y={y0} lines={t} size={18} weight={700} fill="#fff" />
            {d.length > 0 && <Txt x={x} y={y0 + t.length * 22 + 4} lines={d} size={15.5} fill="#E9F2EE" />}
          </g>
        );
      })}
    </svg>
  );
}

function Columns({ s, uid }) {
  const n = s.columns.length;
  const gap = 18, cw = (W - gap * (n - 1)) / n;
  const head = s.columns.map(c => wrap(c.title, cw - 28, 21, true));
  const sub = s.columns.map(c => wrap(c.subtitle, cw - 28, 15.5));
  const hh = Math.max(...head.map((h, i) => h.length * 25 + (sub[i].length ? sub[i].length * 19 + 6 : 0))) + 30;
  const body = s.columns.map(c => (c.items || []).map(it => wrap(it, cw - 50, 17)));
  const bh = Math.max(...body.map(b => b.reduce((a, l) => a + l.length * 21.5 + 12, 0))) + 24;
  const H = hh + bh + 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /></defs>
      {s.columns.map((c, i) => {
        const x = i * (cw + gap);
        const col = colorOf(i, c.color);
        let y = hh + 30;
        return (
          <g key={i}>
            <rect x={x} y={0} width={cw} height={H - 4} rx={12} fill="#F4F7F5" stroke="#DDE6E2" />
            <rect x={x} y={0} width={cw} height={hh} rx={12} fill={col} filter={`url(#${uid}s)`} />
            <rect x={x} y={hh - 12} width={cw} height={12} fill={col} />
            <Txt x={x + 16} y={32} lines={head[i]} size={21} weight={700} fill="#fff" anchor="start" lh={1.2} />
            {sub[i].length > 0 && <Txt x={x + 16} y={32 + head[i].length * 25 + 2} lines={sub[i]} size={15.5} fill="#EAF2EE" anchor="start" />}
            {body[i].map((lines, k) => {
              const yy = y; y += lines.length * 21.5 + 12;
              return (
                <g key={k}>
                  <rect x={x + 16} y={yy - 10} width={8} height={8} rx={2} fill={col} />
                  <Txt x={x + 34} y={yy} lines={lines} size={17} fill={INK} anchor="start" lh={1.27} />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function Stack({ s, uid }) {
  const rows = s.layers.map(l => ({ t: wrap(l.title, 250, 19, true), d: wrap(l.text, 610, 17) }));
  const rh = rows.map(r => Math.max(64, Math.max(r.t.length * 24, r.d.length * 21.5) + 24));
  const H = rh.reduce((a, b) => a + b + 8, 0);
  let y = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={s.title}>
      <defs><Shadow id={`${uid}s`} /></defs>
      {rows.map((r, i) => {
        const top = y; y += rh[i] + 8;
        const mid = top + rh[i] / 2;
        const c = colorOf(i, s.layers[i].color);
        return (
          <g key={i}>
            <rect x={0} y={top} width={W} height={rh[i]} rx={10} fill="#F2F6F4" stroke="#DCE6E1" />
            <path d={`M10,${top} H300 L330,${mid} L300,${top + rh[i]} H10 Q0,${top + rh[i]} 0,${top + rh[i] - 10} V${top + 10} Q0,${top} 10,${top} Z`} fill={c} filter={`url(#${uid}s)`} />
            <Txt x={22} y={centred(mid, r.t.length, 19, 1.22)} lines={r.t} size={19} weight={700} fill="#fff" anchor="start" lh={1.22} />
            <Txt x={356} y={centred(mid, r.d.length, 17, 1.27)} lines={r.d} size={17} fill={INK} anchor="start" lh={1.27} />
          </g>
        );
      })}
    </svg>
  );
}

function Table({ s }) {
  return (
    <div className="overflow-x-auto thin-scroll rounded-lg border border-[#C9D6D0]">
      <table className="w-full text-[13.5px]">
        <thead><tr>{s.head.map((h, i) => <th key={i} scope="col" className="bg-[#0F5A45] text-white text-left font-semibold px-3 py-2.5">{h}</th>)}</tr></thead>
        <tbody>
          {s.rows.map((r, i) => (
            <tr key={i} className={i % 2 ? 'bg-[#EAF1ED]' : 'bg-white'}>
              {r.map((c, j) => <td key={j} className={`px-3 py-2 border-t border-[#DCE6E1] ${j === 0 ? 'font-semibold text-[#0F3D30]' : 'text-[#2F3B37]'}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The shape components by slide type (also used to draw the course PDF's figures). */
export const SLIDE_SHAPES = { chevrons: Chevrons, steps: Steps, pyramid: Pyramid, cycle: Cycle, triad: Triad, hub: Hub, columns: Columns, stack: Stack, table: Table };
const SECTION = SLIDE_SHAPES;
export const SLIDE_TYPES = Object.keys(SECTION);

/** Problems in a diagram definition (empty when valid). */
export function validateSlideDiagram(def) {
  const errors = [];
  if (!def?.title) errors.push('Diagram has no title.');
  if (!Array.isArray(def?.slides) || !def.slides.length) errors.push('Diagram has no slides.');
  const need = { chevrons: 'steps', steps: 'steps', pyramid: 'levels', cycle: 'nodes', triad: 'items', hub: 'items', columns: 'columns', stack: 'layers', table: 'rows' };
  (def?.slides || []).forEach((s, i) => {
    const where = `Slide ${i + 1}`;
    if (!SECTION[s.type]) { errors.push(`${where}: unknown type "${s.type}".`); return; }
    const list = s[need[s.type]];
    if (!Array.isArray(list) || !list.length) errors.push(`${where}: "${need[s.type]}" is empty.`);
    if (s.type === 'chevrons' && list?.length > 6) errors.push(`${where}: chevrons take at most 6 steps.`);
    if (s.type === 'triad' && list?.length !== 3) errors.push(`${where}: a triad needs exactly 3 items.`);
    if (s.type === 'table' && (s.rows || []).some(r => r.length !== s.head.length)) errors.push(`${where}: row and header lengths differ.`);
  });
  return errors;
}

function Slides({ def, uid }) {
  return (
    <div className="space-y-5">
      {def.slides.map((s, i) => {
        const C = SECTION[s.type];
        return (
          <section key={i} aria-label={s.title} className="rounded-xl bg-white border border-[#DDE6E2] shadow-[0_1px_3px_rgba(12,45,38,.06)] overflow-hidden">
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[#E6EDE9] bg-[#FAFCFB]">
              <span className="w-1.5 self-stretch rounded-full bg-[#C08A2B]" aria-hidden="true" />
              <div className="min-w-0">
                <h4 className="font-display text-[16px] sm:text-[17px] font-semibold text-[#0F3D30] leading-tight">{s.title}</h4>
                {s.text && <p className="text-[13px] text-[#5A6863] leading-snug mt-0.5">{s.text}</p>}
              </div>
            </div>
            <div className="p-3 sm:p-5 overflow-x-auto thin-scroll">
              <div className={s.type === 'table' ? '' : 'min-w-[620px]'}><C s={s} uid={`${uid}-${i}`} /></div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function SlideDiagram({ def }) {
  const uid = useId().replace(/:/g, '');
  const [full, setFull] = useState(false);
  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [full]);

  // `scope` keeps SVG ids unique when the diagram is shown twice (page + full screen)
  const body = (scope) => (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[21px] sm:text-[24px] font-semibold text-[#0F3D30] leading-tight">{def.title}</h3>
          {def.subtitle && <p className="mt-1 text-[14px] text-[#5A6863]">{def.subtitle}</p>}
        </div>
        <button type="button" onClick={() => setFull(f => !f)} className="h-9 px-3 rounded-lg border border-[#C9D6D0] bg-white text-[13px] font-semibold text-[#0F3D30] inline-flex items-center gap-1.5 hover:bg-[#F2F6F4]">
          {scope === 'full' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}{scope === 'full' ? 'Close' : 'Full screen'}
        </button>
      </div>
      <div className="mt-4"><Slides def={def} uid={`${uid}${scope}`} /></div>
      {def.note && <p className="mt-4 text-[13px] leading-6 text-[#4C5A55] border-l-4 border-[#C08A2B] pl-3">{def.note}</p>}
    </>
  );

  return (
    <>
      <div className="rounded-2xl border border-[#DDE6E2] bg-[#F7FAF8] p-3 sm:p-5">{body('page')}</div>
      {/* rendered on <body>: the lesson column is animated (transform), which would trap a fixed overlay inside it */}
      {full && createPortal(
        <div className="fixed inset-0 z-[90] bg-[#F7FAF8] overflow-y-auto p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={def.title}>
          <div className="max-w-6xl mx-auto">{body('full')}</div>
        </div>,
        document.body
      )}
    </>
  );
}
