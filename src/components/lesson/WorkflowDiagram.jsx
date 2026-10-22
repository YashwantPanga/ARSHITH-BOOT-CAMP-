import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
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

function DiagramSvg({ def }) {
  const L = useMemo(() => layoutDiagram(def), [def]);
  const pos = new Map(L.nodes.map(n => [n.id, n]));
  let loopIndex = 0;
  return (
    <svg viewBox={`0 0 ${L.width} ${L.height}`} width={L.width} height={L.height} className="block max-w-none" role="img" aria-labelledby="wf-title">
      <title id="wf-title">{def.title || 'Workflow diagram'}</title>
      <defs>
        <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#BCD1C6" />
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
            <path d={d} fill="none" stroke="#BCD1C6" strokeWidth="1.6" strokeDasharray={e.back ? '5 4' : undefined} markerEnd="url(#wf-arrow)" />
            {e.label && (
              <g transform={`translate(${lx},${ly})`}>
                <rect x={-(e.label.length * 3.3 + 8)} y="-9" width={e.label.length * 6.6 + 16} height="18" rx="9" fill="#0C2D26" stroke="#5F8574" />
                <text textAnchor="middle" y="4" fontSize="10.5" fill="#E9F1EC" fontFamily="DM Sans, DM Sans, system-ui, sans-serif">{e.label}</text>
              </g>
            )}
          </g>
        );
      })}
      {L.nodes.map((n, i) => {
        const lines = wrap(n.label);
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}>
            <rect width={L.NODE_W} height={L.NODE_H} rx="14" fill="#FBF8F1" stroke="#90B1A2" />
            <rect width="6" height={L.NODE_H - 20} x="0" y="10" rx="3" fill={i === 0 ? '#426557' : '#013A2B'} />
            <circle cx="24" cy="20" r="10" fill="#013A2B" />
            <text x="24" y="24" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#FBF8F1" fontFamily="DM Sans, DM Sans, system-ui, sans-serif">{i + 1}</text>
            {lines.map((l, k) => (
              <text key={k} x="42" y={24 + k * 16 + (lines.length === 1 ? 8 : 0)} fontSize="12.5" fontWeight="600" fill="#302B25" fontFamily="DM Sans, DM Sans, system-ui, sans-serif">{l}</text>
            ))}
          </g>
        );
      })}
    </svg>
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
      <div className="relative rounded-2xl overflow-hidden border border-black/20 bg-evergreen">
        <div className="absolute inset-0 opacity-[.12] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#BCD1C6 1px, transparent 1px), linear-gradient(90deg, #BCD1C6 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between gap-3 px-4 h-9 border-b border-white/10 bg-black/20">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-300 truncate">{def.title || 'Workflow'}</span>
          <span className="text-[10.5px] text-brand-300/80 shrink-0 sm:hidden">scroll →</span>
        </div>
        <div className="relative overflow-x-auto thin-scroll p-2 sm:p-3" tabIndex={0} aria-label="Diagram, scroll horizontally on small screens">
          <DiagramBoundary><DiagramSvg def={def} /></DiagramBoundary>
        </div>
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
