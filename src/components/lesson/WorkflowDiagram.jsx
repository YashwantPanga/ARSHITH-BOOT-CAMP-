import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, RefreshCw } from 'lucide-react';
import { DiagramCard } from '../diagrams/VisualDiagram';
import { validateDiagram } from '../../../shared/contentSchema.js';

// Text metrics used to size boxes (DM Sans). Slightly generous so text never touches the border.
const LABEL_FONT = 12.5;
const LABEL_CHAR_W = 7.3;    // average width of a semibold 12.5px character
const LABEL_LINE_H = 16;
const EDGE_FONT = 10.5;
const EDGE_CHAR_W = 6.1;
const NODE_W = 200;
const TEXT_X = 42;           // text starts right of the number badge
const TEXT_RIGHT_PAD = 12;
const MAX_CHARS = Math.floor((NODE_W - TEXT_X - TEXT_RIGHT_PAD) / LABEL_CHAR_W);
const MAX_LINES = 4;
const MAX_ROW_W = 1040;      // wider chains wrap onto further rows instead of scrolling sideways
const ROW_GAP = 64;          // vertical space between rows (holds the connecting arrows)

/**
 * Wraps a label to `max` characters per line. Long tokens without spaces (code such as
 * model.predict(X_test)) are broken after punctuation, or hard-split as a last resort.
 */
export function wrapLabel(text, max = MAX_CHARS, maxLines = MAX_LINES) {
  const pieces = [];
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (word.length <= max) { pieces.push(word); continue; }
    let rest = word;
    while (rest.length > max) {
      const head = rest.slice(0, max);
      const cut = Math.max(head.lastIndexOf('('), head.lastIndexOf(','), head.lastIndexOf('.'), head.lastIndexOf('_'), head.lastIndexOf('/'), head.lastIndexOf('-'));
      const at = cut > 2 ? cut + 1 : max;
      pieces.push(rest.slice(0, at) + '​'); // marks "no space when joining"
      rest = rest.slice(at);
    }
    if (rest) pieces.push(rest);
  }
  const lines = [];
  let cur = '';
  for (const p of pieces) {
    const glue = cur && !cur.endsWith('​') ? ' ' : '';
    if (cur && (cur + glue + p).replace(/​/g, '').length > max) { lines.push(cur); cur = p; } else cur = cur + glue + p;
  }
  if (cur) lines.push(cur);
  const clean = lines.map(l => l.replace(/​/g, ''));
  if (clean.length > maxLines) {
    clean.length = maxLines;
    clean[maxLines - 1] = clean[maxLines - 1].slice(0, max - 1).replace(/\s+$/, '') + '…';
  }
  return clean;
}

const edgeLabelWidth = (label) => label.length * EDGE_CHAR_W + 18;

/* Layered left-to-right layout. Forward edges define layers (longest path); edges that point back
   to an earlier or same layer are drawn as loops underneath the diagram. Boxes are sized to fit the
   longest wrapped label, and gaps are wide enough for the edge labels. */
export function layoutDiagram(def) {
  const nodes = def.nodes.map(n => ({ ...n, lines: wrapLabel(n.label) }));
  const byId = new Map(nodes.map(n => [n.id, n]));
  const edges = (def.edges || []).filter(e => byId.has(e.from) && byId.has(e.to) && e.from !== e.to);

  // Detect back edges with DFS so cycles do not break layering.
  const out = new Map(nodes.map(n => [n.id, []]));
  edges.forEach((e, i) => out.get(e.from).push(i));
  const state = new Map();
  const back = new Set();
  const visit = (id) => {
    state.set(id, 1);
    for (const i of out.get(id)) {
      const t = edges[i].to;
      if (state.get(t) === 1) back.add(i);
      else if (!state.get(t)) visit(t);
    }
    state.set(id, 2);
  };
  nodes.forEach(n => { if (!state.get(n.id)) visit(n.id); });

  const layer = new Map(nodes.map(n => [n.id, 0]));
  for (let pass = 0; pass < nodes.length; pass++) {
    let changed = false;
    edges.forEach((e, i) => {
      if (back.has(i)) return;
      const want = layer.get(e.from) + 1;
      if (layer.get(e.to) < want) { layer.set(e.to, want); changed = true; }
    });
    if (!changed) break;
  }

  const cols = [];
  nodes.forEach(n => { const l = layer.get(n.id); (cols[l] ||= []).push(n); });
  const maxLines = Math.max(1, ...nodes.map(n => n.lines.length));
  const NODE_H = Math.max(64, 26 + maxLines * LABEL_LINE_H + 8);
  const forwardLabels = edges.filter((e, i) => !back.has(i) && e.label).map(e => edgeLabelWidth(e.label));
  const GAP_X = Math.max(72, ...forwardLabels.map(w => w + 28));
  const GAP_Y = 26, PAD = 24;
  const maxRows = Math.max(...cols.map(c => c?.length || 0));
  const innerH = maxRows * NODE_H + (maxRows - 1) * GAP_Y;
  // Layers per row: as many as fit in MAX_ROW_W (at least 2), so long chains read like lines of text.
  const perRow = Math.max(2, Math.floor((MAX_ROW_W + GAP_X) / (NODE_W + GAP_X)));
  const rowCount = Math.ceil(cols.length / perRow);
  const rowTop = (r) => PAD + r * (innerH + ROW_GAP);
  cols.forEach((col, l) => {
    const colH = col.length * NODE_H + (col.length - 1) * GAP_Y;
    const row = Math.floor(l / perRow);
    col.forEach((n, r) => {
      n.x = PAD + (l % perRow) * (NODE_W + GAP_X);
      n.y = rowTop(row) + (innerH - colH) / 2 + r * (NODE_H + GAP_Y);
      n.layer = l;
      n.row = row;
    });
  });
  // Arrows that wrap to the next row and enter a box from the side (another box sits above it) run
  // down the gap left of that box; widen the left margin so their labels fit beside them.
  const sideLabels = edges.filter((e, i) => !back.has(i) && e.label).filter(e => {
    const a = byId.get(e.from), b = byId.get(e.to);
    return a.row !== b.row && nodes.some(m => m.layer === b.layer && m.y < b.y);
  }).map(e => edgeLabelWidth(e.label));
  const extraLeft = sideLabels.length ? Math.max(0, Math.max(...sideLabels) + 30 - PAD) : 0;
  if (extraLeft) nodes.forEach(n => { n.x += extraLeft; });
  // Visual reading order: left to right, then top to bottom. Used for the step numbers everywhere.
  [...nodes].sort((a, b) => a.layer - b.layer || a.y - b.y).forEach((n, i) => { n.step = i + 1; });
  const loops = edges.filter((_, i) => back.has(i)).length;
  const colsInRow = Math.min(cols.length, perRow);
  const width = PAD * 2 + extraLeft + colsInRow * NODE_W + (colsInRow - 1) * GAP_X;
  const innerBottom = rowTop(rowCount - 1) + innerH;
  const height = innerBottom + PAD + (loops ? 36 + loops * 14 : 0);
  return { nodes, edges: edges.map((e, i) => ({ ...e, back: back.has(i) })), width, height, NODE_W, NODE_H, GAP_X, PAD, innerH, rowCount, rowTop, innerBottom };
}

// Same colour family as the visual diagram cards: [card fill, border, accent/badge, title text].
const NODE_TONES = [
  ['#F0F9FF', '#BAE6FD', '#0369A1', '#0C4A6E'],
  ['#ECFDF5', '#A7F3D0', '#047857', '#064E3B'],
  ['#F5F3FF', '#DDD6FE', '#6D28D9', '#4C1D95'],
  ['#FFFBEB', '#FDE68A', '#B45309', '#78350F'],
  ['#F0FDFA', '#99F6E4', '#0F766E', '#134E4A'],
  ['#FFF1F2', '#FECDD3', '#BE123C', '#881337']
];

function DiagramSvg({ def, L }) {
  const pos = new Map(L.nodes.map(n => [n.id, n]));
  // A box directly below n in the same column (an arrow leaving or entering n from below would cross it).
  const hasBelow = (n) => L.nodes.some(m => m.layer === n.layer && m.y > n.y);
  const hasAbove = (n) => L.nodes.some(m => m.layer === n.layer && m.y < n.y);
  // Labels are placed one by one and nudged until they overlap neither a box nor an earlier label.
  const placed = L.nodes.map(n => ({ x: n.x - 2, y: n.y - 2, w: L.NODE_W + 4, h: L.NODE_H + 4 }));
  const overlaps = (r) => placed.some(q => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
  const placeLabel = (x, y, w) => {
    const shifts = [[0, 0], [0, -12], [0, 12], [-(w / 2 + 8), 0], [w / 2 + 8, 0], [0, -24], [0, 24], [-(w / 2 + 8), -14], [w / 2 + 8, -14]];
    for (const [dx, dy] of shifts) {
      const cx = Math.min(Math.max(x + dx, w / 2 + 2), L.width - w / 2 - 2);
      const r = { x: cx - w / 2, y: y + dy - 9, w, h: 18 };
      if (!overlaps(r)) { placed.push(r); return [cx, y + dy]; }
    }
    return [x, y];
  };
  let loopIndex = 0;
  return (
    <svg
      viewBox={`0 0 ${L.width} ${L.height}`}
      className="block h-auto mx-auto"
      // Scales down to fit the lesson (never below 72%, so text stays readable; narrower spaces get the card list).
      style={{ width: '100%', maxWidth: L.width, minWidth: Math.round(L.width * 0.72) }}
      role="img"
      aria-labelledby="wf-title"
    >
      <title id="wf-title">{def.title || 'Workflow diagram'}</title>
      <defs>
        <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#5F8574" />
        </marker>
      </defs>
      {L.edges.map((e, i) => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        let d;
        let lx;
        let ly;
        if (e.back && a.row === b.row && L.rowCount === 1) {
          loopIndex += 1;
          const yb = L.innerBottom + 18 + loopIndex * 14;
          // Leave/enter from below when the column is free underneath, otherwise through the side gap.
          const out = hasBelow(a)
            ? `M${a.x + L.NODE_W},${a.y + L.NODE_H / 2} L${a.x + L.NODE_W + 14},${a.y + L.NODE_H / 2} L${a.x + L.NODE_W + 14},${yb}`
            : `M${a.x + L.NODE_W / 2},${a.y + L.NODE_H} L${a.x + L.NODE_W / 2},${yb}`;
          const xin = hasBelow(b) ? b.x - 14 : b.x + L.NODE_W / 2;
          const inn = hasBelow(b)
            ? ` L${xin},${yb} L${xin},${b.y + L.NODE_H / 2} L${b.x - 2},${b.y + L.NODE_H / 2}`
            : ` L${xin},${yb} L${xin},${b.y + L.NODE_H + 2}`;
          d = out + inn;
          lx = ((hasBelow(a) ? a.x + L.NODE_W + 14 : a.x + L.NODE_W / 2) + xin) / 2;
          ly = yb;
        } else if (e.back) {
          // Loop back across rows: down under the diagram, up the left margin, into the target from above.
          loopIndex += 1;
          const yb = L.innerBottom + 18 + loopIndex * 14;
          const xm = 6 + loopIndex * 5;
          const yt = L.rowTop(b.row) - 14 - loopIndex * 5;
          const x1 = a.x + L.NODE_W / 2;
          const x2 = b.x + L.NODE_W / 2;
          d = `M${x1},${a.y + L.NODE_H} L${x1},${yb} L${xm},${yb} L${xm},${yt} L${x2},${yt} L${x2},${b.y - 2}`;
          lx = (x1 + xm) / 2;
          ly = yb;
        } else if (a.row !== b.row) {
          // Continues on the next row: down into the gap between rows, across, and down into the target.
          const x1 = a.x + L.NODE_W / 2;
          const x2 = b.x + L.NODE_W / 2;
          const lane = L.rowTop(a.row) + L.innerH + ROW_GAP / 2;
          const turn = (from, to) => (to < from ? -10 : 10);
          const start = hasBelow(a)
            ? `M${a.x + L.NODE_W},${a.y + L.NODE_H / 2} L${a.x + L.NODE_W + 14},${a.y + L.NODE_H / 2} L${a.x + L.NODE_W + 14},${lane - 10} Q${a.x + L.NODE_W + 14},${lane} `
            : `M${x1},${a.y + L.NODE_H} L${x1},${lane - 10} Q${x1},${lane} `;
          const xd = hasBelow(a) ? a.x + L.NODE_W + 14 : x1;
          if (hasAbove(b)) {
            // Another box sits above the target in its column: come down the gap on its left, enter from the side.
            const xs = b.x - 14;
            const ym = b.y + L.NODE_H / 2;
            d = `${start}${xd + turn(xd, xs)},${lane} L${xs - turn(xd, xs)},${lane} Q${xs},${lane} ${xs},${lane + 10} L${xs},${ym - 10} Q${xs},${ym} ${xs + 10},${ym} L${b.x - 2},${ym}`;
            lx = xs - edgeLabelWidth(e.label || '') / 2 - 6;
            ly = (lane + ym) / 2;
          } else {
            d = `${start}${xd + turn(xd, x2)},${lane} L${x2 - turn(xd, x2)},${lane} Q${x2},${lane} ${x2},${lane + 10} L${x2},${b.y - 2}`;
            lx = x2;
            ly = (lane + b.y) / 2;
          }
        } else {
          const x1 = a.x + L.NODE_W;
          const y1 = a.y + L.NODE_H / 2;
          const x2 = b.x - 2;
          const y2 = b.y + L.NODE_H / 2;
          const span = b.layer - a.layer;
          if (span <= 1) {
            const mx = (x1 + x2) / 2;
            d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
            lx = mx;
            ly = (y1 + y2) / 2;
          } else {
            // Edge that skips layers: run along a lane above every box in the row so it never crosses one.
            const top = L.rowTop(a.row) - 12;
            d = `M${x1},${y1} C${x1 + 24},${y1} ${x1 + 24},${top} ${x1 + 48},${top} L${x2 - 48},${top} C${x2 - 24},${top} ${x2 - 24},${y2} ${x2},${y2}`;
            lx = x1 + L.GAP_X / 2;
            ly = top;
          }
        }
        const lw = e.label ? edgeLabelWidth(e.label) : 0;
        if (e.label) [lx, ly] = placeLabel(lx, ly, lw);
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="#5F8574" strokeOpacity=".7" strokeWidth="1.8" strokeDasharray={e.back ? '5 4' : undefined} markerEnd="url(#wf-arrow)" />
            {e.label && (
              <g transform={`translate(${lx},${ly})`}>
                <rect x={-lw / 2} y="-9" width={lw} height="18" rx="9" fill="#FFFFFF" stroke="#BCD1C6" />
                <text textAnchor="middle" y="3.5" fontSize={EDGE_FONT} fill="#302B25" fontFamily="DM Sans, system-ui, sans-serif">{e.label}</text>
              </g>
            )}
          </g>
        );
      })}
      {L.nodes.map((n) => {
        const [fill, stroke, accent, ink] = NODE_TONES[(n.step - 1) % NODE_TONES.length];
        const firstBaseline = L.NODE_H / 2 - ((n.lines.length - 1) * LABEL_LINE_H) / 2 + 4.5;
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}>
            <title>{n.label}</title>
            <rect width={L.NODE_W} height={L.NODE_H} rx="14" fill={fill} stroke={stroke} strokeWidth="1.2" />
            <circle cx="22" cy={L.NODE_H / 2} r="11" fill={accent} />
            <text x="22" y={L.NODE_H / 2 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF" fontFamily="DM Sans, system-ui, sans-serif">{n.step}</text>
            {n.lines.map((l, k) => (
              <text key={k} x={TEXT_X} y={firstBaseline + k * LABEL_LINE_H} fontSize={LABEL_FONT} fontWeight="600" fill={ink} fontFamily="DM Sans, system-ui, sans-serif">{l}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Phone layout: the same stages as numbered cards from top to bottom, edge labels on the arrows. */
function DiagramStack({ def, L }) {
  const order = [...L.nodes].sort((a, b) => a.step - b.step);
  const label = new Map(def.nodes.map(n => [n.id, n.label]));
  const loops = L.edges.filter(e => e.back);
  return (
    <div className="p-3">
      <ol>
        {order.map((n, i) => {
          const outs = L.edges.filter(e => !e.back && e.from === n.id);
          return (
            <li key={n.id}>
              <DiagramCard node={{ title: n.label, text: n.detail }} n={n.step} index={n.step - 1} />
              {i < order.length - 1 && (
                <div className="flex flex-col items-center py-1.5 text-[12px] text-charcoal/60" aria-hidden="true">
                  <ArrowDown className="w-4 h-4 text-sage" />
                  {outs.length > 0 && <span className="text-center">{outs.map(e => e.label ? `${e.label} → ${label.get(e.to)}` : `→ ${label.get(e.to)}`).join(' · ')}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {loops.length > 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-brand-300 bg-white/70 p-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-sage flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Feedback loops</p>
          <ul className="mt-1.5 space-y-1">{loops.map((e, i) => <li key={i} className="text-[13px] text-charcoal/80"><span className="font-semibold">{label.get(e.from)}</span> ↺ <span className="font-semibold">{label.get(e.to)}</span>{e.label && <span className="text-charcoal/60"> — {e.label}</span>}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

class DiagramBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error('Diagram failed to render:', err); }
  render() {
    if (this.state.failed) return <DiagramProblem messages={['The diagram could not be drawn. The step-by-step description below explains the same workflow.']} />;
    return this.props.children;
  }
}

export function DiagramProblem({ messages }) {
  return (
    <div role="alert" className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3">
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">This diagram is unavailable</p>
        <ul className="mt-1 list-disc pl-5 space-y-0.5">{messages.slice(0, 4).map((m, i) => <li key={i}>{m}</li>)}</ul>
      </div>
    </div>
  );
}

/**
 * Renders a structured workflow diagram plus an accessible stage-by-stage description.
 * Invalid definitions show an explicit message instead of an empty panel.
 */
export default function WorkflowDiagram({ def }) {
  const v = useMemo(() => validateDiagram(def), [def]);
  const L = useMemo(() => (v.ok ? layoutDiagram(def) : null), [def, v.ok]);
  const boxRef = useRef(null);
  const [boxW, setBoxW] = useState(0);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setBoxW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  if (!v.ok) return <DiagramProblem messages={v.errors} />;
  // The drawing may shrink to 72% before text gets too small; below that, use the card list instead.
  const drawingFits = !boxW || boxW - 24 >= L.width * 0.72;
  const hasStageData = def.nodes.some(n => n.input || n.output);
  const rows = [...L.nodes].sort((a, b) => a.step - b.step);
  return (
    <figure className="space-y-4">
      <div ref={boxRef} className="relative rounded-3xl overflow-hidden border border-brand-900/10 bg-gradient-to-b from-[#F6F9FC] to-[#F8F5EE]">
        <div className="relative px-4 sm:px-5 pt-4 pb-1">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-sage">Workflow</p>
          <p className="font-display text-lg sm:text-xl text-forest leading-tight">{def.title || 'Workflow'}</p>
        </div>
        {drawingFits && (
          <div className="relative overflow-x-auto thin-scroll p-2 sm:p-3 hidden sm:block">
            <DiagramBoundary><DiagramSvg def={def} L={L} /></DiagramBoundary>
          </div>
        )}
        <div className={drawingFits ? 'sm:hidden' : ''}><DiagramBoundary><DiagramStack def={def} L={L} /></DiagramBoundary></div>
      </div>
      {def.caption && <figcaption className="text-sm text-charcoal/65">{def.caption}</figcaption>}
      {hasStageData && (
        <div className="overflow-x-auto thin-scroll rounded-xl border border-brand-900/10">
          <table className="w-full text-sm min-w-[560px]">
            <caption className="sr-only">Stages of the workflow with their inputs and outputs</caption>
            <thead className="bg-cream text-charcoal/70">
              <tr><th className="px-3 py-2 text-left font-semibold w-8">#</th><th className="px-3 py-2 text-left font-semibold">Stage</th><th className="px-3 py-2 text-left font-semibold">Input</th><th className="px-3 py-2 text-left font-semibold">Output</th></tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id} className="border-t border-brand-900/5 align-top">
                  <td className="px-3 py-2.5 font-semibold text-sage">{n.step}</td>
                  <td className="px-3 py-2.5"><p className="font-semibold text-charcoal">{n.label}</p>{n.detail && <p className="text-charcoal/65 mt-0.5">{n.detail}</p>}</td>
                  <td className="px-3 py-2.5 text-charcoal/75">{n.input || '—'}</td>
                  <td className="px-3 py-2.5 text-charcoal/75">{n.output || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
