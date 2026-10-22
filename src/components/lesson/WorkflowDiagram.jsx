import React, { useMemo } from 'react';
import { AlertTriangle, ArrowDown, RefreshCw } from 'lucide-react';
import { DiagramCard } from '../diagrams/VisualDiagram';
import { validateDiagram } from '../../../shared/contentSchema.js';

/* Layered left-to-right layout. Forward edges define layers (longest path); edges that point back
   to an earlier or same layer are drawn as loops underneath the diagram. */
export function layoutDiagram(def) {
  const nodes = def.nodes.map(n => ({ ...n }));
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
  const NODE_W = 176, NODE_H = 66, GAP_X = 64, GAP_Y = 26, PAD = 24;
  const maxRows = Math.max(...cols.map(c => c?.length || 0));
  const innerH = maxRows * NODE_H + (maxRows - 1) * GAP_Y;
  cols.forEach((col, l) => {
    const colH = col.length * NODE_H + (col.length - 1) * GAP_Y;
    col.forEach((n, r) => {
      n.x = PAD + l * (NODE_W + GAP_X);
      n.y = PAD + (innerH - colH) / 2 + r * (NODE_H + GAP_Y);
      n.layer = l;
    });
  });
  const loops = edges.filter((_, i) => back.has(i)).length;
  const width = PAD * 2 + cols.length * NODE_W + (cols.length - 1) * GAP_X;
  const height = PAD * 2 + innerH + (loops ? 36 + loops * 14 : 0);
  return { nodes, edges: edges.map((e, i) => ({ ...e, back: back.has(i) })), width, height, NODE_W, NODE_H, innerBottom: PAD + innerH };
}

function wrap(text, max = 22, lines = 2) {
  const words = String(text).split(/\s+/);
  const out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  if (out.length > lines) { out.length = lines; out[lines - 1] = out[lines - 1].replace(/\s*\S*$/, '') + '…'; }
  return out;
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

function DiagramSvg({ def }) {
  const L = useMemo(() => layoutDiagram(def), [def]);
  const pos = new Map(L.nodes.map(n => [n.id, n]));
  let loopIndex = 0;
  return (
    <svg viewBox={`0 0 ${L.width} ${L.height}`} width={L.width} height={L.height} className="block max-w-none" role="img" aria-labelledby="wf-title">
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
        if (e.back) {
          loopIndex += 1;
          const yb = L.innerBottom + 18 + loopIndex * 14;
          const x1 = a.x + L.NODE_W / 2;
          const x2 = b.x + L.NODE_W / 2;
          d = `M${x1},${a.y + L.NODE_H} C${x1},${yb} ${x2},${yb} ${x2},${b.y + L.NODE_H + 2}`;
          lx = (x1 + x2) / 2;
          ly = yb - 2;
        } else {
          const x1 = a.x + L.NODE_W;
          const y1 = a.y + L.NODE_H / 2;
          const x2 = b.x - 2;
          const y2 = b.y + L.NODE_H / 2;
          const mx = (x1 + x2) / 2;
          d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
          lx = mx;
          ly = (y1 + y2) / 2;
        }
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="#5F8574" strokeOpacity=".7" strokeWidth="1.8" strokeDasharray={e.back ? '5 4' : undefined} markerEnd="url(#wf-arrow)" />
            {e.label && (
              <g transform={`translate(${lx},${ly})`}>
                <rect x={-(e.label.length * 3.3 + 8)} y="-9" width={e.label.length * 6.6 + 16} height="18" rx="9" fill="#FFFFFF" stroke="#BCD1C6" />
                <text textAnchor="middle" y="4" fontSize="10.5" fill="#302B25" fontFamily="DM Sans, system-ui, sans-serif">{e.label}</text>
              </g>
            )}
          </g>
        );
      })}
      {L.nodes.map((n, i) => {
        const lines = wrap(n.label);
        const [fill, stroke, accent, ink] = NODE_TONES[i % NODE_TONES.length];
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}>
            <rect width={L.NODE_W} height={L.NODE_H} rx="14" fill={fill} stroke={stroke} strokeWidth="1.2" />
            <circle cx="22" cy="20" r="11" fill={accent} />
            <text x="22" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF" fontFamily="DM Sans, system-ui, sans-serif">{i + 1}</text>
            {lines.map((l, k) => (
              <text key={k} x="40" y={24 + k * 16 + (lines.length === 1 ? 8 : 0)} fontSize="12.5" fontWeight="600" fill={ink} fontFamily="DM Sans, system-ui, sans-serif">{l}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Phone layout: the same stages as numbered cards from top to bottom, edge labels on the arrows. */
function DiagramStack({ def }) {
  const L = useMemo(() => layoutDiagram(def), [def]);
  const order = [...L.nodes].sort((a, b) => a.layer - b.layer || a.y - b.y);
  const label = new Map(def.nodes.map(n => [n.id, n.label]));
  const loops = L.edges.filter(e => e.back);
  return (
    <div className="p-3">
      <ol>
        {order.map((n, i) => {
          const outs = L.edges.filter(e => !e.back && e.from === n.id);
          return (
            <li key={n.id}>
              <DiagramCard node={{ title: n.label, text: n.detail }} n={def.nodes.findIndex(x => x.id === n.id) + 1} index={def.nodes.findIndex(x => x.id === n.id)} />
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
  if (!v.ok) return <DiagramProblem messages={v.errors} />;
  const hasStageData = def.nodes.some(n => n.input || n.output);
  return (
    <figure className="space-y-4">
      <div className="relative rounded-3xl overflow-hidden border border-brand-900/10 bg-gradient-to-b from-[#F6F9FC] to-[#F8F5EE]">
        <div className="relative flex items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-1">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-sage">Workflow</p>
            <p className="font-display text-lg sm:text-xl text-forest leading-tight truncate">{def.title || 'Workflow'}</p>
          </div>
        </div>
        <div className="relative overflow-x-auto thin-scroll p-2 sm:p-3 hidden sm:block" tabIndex={0} aria-label="Diagram, scroll horizontally if it is wider than the screen">
          <DiagramBoundary><DiagramSvg def={def} /></DiagramBoundary>
        </div>
        <div className="sm:hidden"><DiagramBoundary><DiagramStack def={def} /></DiagramBoundary></div>
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
              {def.nodes.map((n, i) => (
                <tr key={n.id} className="border-t border-brand-900/5 align-top">
                  <td className="px-3 py-2.5 font-semibold text-sage">{i + 1}</td>
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
