import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown, ArrowRight, BarChart3, Binary, Blocks, Boxes, Brain, BrainCircuit, Bug, ChevronDown, Cloud, Code2,
  Combine, Container, Cpu, Database, FileCode2, FileSearch, Filter, FlaskConical, GitBranch, GitCompare, Gauge,
  Layers, LayoutGrid, Lightbulb, LineChart, ListChecks, Maximize2, MessageSquare, Minimize2, Network, PieChart,
  Puzzle, RefreshCw, Rocket, Scale, ScanSearch, Search, Server, Shapes, ShieldCheck, Sigma, Sparkles, SplitSquareHorizontal,
  Table2, Target, TerminalSquare, TrendingUp, Workflow, X, Zap
} from 'lucide-react';
import { cleanText } from '../../utils/textUtils';

/*
 * Data-driven visual diagrams for lessons. A diagram is a list of sections, each drawn as
 * rounded numbered cards with icons, arrows and (where the process iterates) explicit feedback loops.
 * Section types: layers | flow | branches | compare | table | code. See src/data/visualDiagrams.js.
 */

export const ICONS = {
  ai: Brain, brain: Brain, network: Network, neural: BrainCircuit, sparkles: Sparkles, data: Database, database: Database,
  chart: BarChart3, line: LineChart, pie: PieChart, trend: TrendingUp, target: Target, search: Search, scan: ScanSearch,
  file: FileSearch, filter: Filter, flask: FlaskConical, branch: GitBranch, compare: GitCompare, gauge: Gauge,
  layers: Layers, grid: LayoutGrid, idea: Lightbulb, list: ListChecks, chat: MessageSquare, puzzle: Puzzle,
  loop: RefreshCw, rocket: Rocket, scale: Scale, server: Server, shapes: Shapes, shield: ShieldCheck, sigma: Sigma,
  split: SplitSquareHorizontal, table: Table2, terminal: TerminalSquare, workflow: Workflow, zap: Zap, cpu: Cpu,
  binary: Binary, blocks: Blocks, boxes: Boxes, bug: Bug, cloud: Cloud, code: Code2, combine: Combine,
  container: Container, filecode: FileCode2
};

// Static class strings so Tailwind keeps them in the build. Text colours meet WCAG AA on their tints.
export const TONES = {
  blue:   { card: 'bg-sky-50/70 border-sky-200',      badge: 'bg-sky-700 text-white',     icon: 'bg-sky-100 text-sky-700',       title: 'text-sky-900',     chip: 'bg-sky-100 text-sky-900',       ring: 'focus-visible:ring-sky-400',     arrow: 'text-sky-600' },
  green:  { card: 'bg-emerald-50/70 border-emerald-200', badge: 'bg-emerald-700 text-white', icon: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-900', chip: 'bg-emerald-100 text-emerald-900', ring: 'focus-visible:ring-emerald-400', arrow: 'text-emerald-600' },
  purple: { card: 'bg-violet-50/70 border-violet-200',  badge: 'bg-violet-700 text-white',  icon: 'bg-violet-100 text-violet-700',  title: 'text-violet-900',  chip: 'bg-violet-100 text-violet-900',  ring: 'focus-visible:ring-violet-400',  arrow: 'text-violet-600' },
  orange: { card: 'bg-amber-50/80 border-amber-200',    badge: 'bg-amber-700 text-white',   icon: 'bg-amber-100 text-amber-800',    title: 'text-amber-900',   chip: 'bg-amber-100 text-amber-900',    ring: 'focus-visible:ring-amber-400',   arrow: 'text-amber-600' },
  teal:   { card: 'bg-teal-50/70 border-teal-200',      badge: 'bg-teal-700 text-white',    icon: 'bg-teal-100 text-teal-700',      title: 'text-teal-900',    chip: 'bg-teal-100 text-teal-900',      ring: 'focus-visible:ring-teal-400',    arrow: 'text-teal-600' },
  rose:   { card: 'bg-rose-50/70 border-rose-200',      badge: 'bg-rose-700 text-white',    icon: 'bg-rose-100 text-rose-700',      title: 'text-rose-900',    chip: 'bg-rose-100 text-rose-900',      ring: 'focus-visible:ring-rose-400',    arrow: 'text-rose-600' },
  slate:  { card: 'bg-white border-slate-200',          badge: 'bg-slate-700 text-white',   icon: 'bg-slate-100 text-slate-700',    title: 'text-slate-900',   chip: 'bg-slate-100 text-slate-800',    ring: 'focus-visible:ring-slate-400',   arrow: 'text-slate-500' }
};
const ORDER = ['blue', 'green', 'purple', 'orange', 'teal', 'rose'];
export const toneOf = (name, i = 0) => TONES[name] || TONES[ORDER[i % ORDER.length]];
const Icon = ({ name, className }) => { const C = ICONS[name] || Shapes; return <C className={className} aria-hidden="true" />; };

/* ---------- building blocks ---------- */

function Badge({ n, tone }) {
  if (n === undefined || n === null || n === '') return null;
  return <span className={`shrink-0 w-7 h-7 rounded-full text-[13px] font-bold flex items-center justify-center ${tone.badge}`}>{n}</span>;
}

/** One card. Cards with `details` expand on click / Enter to show advanced information. */
export function DiagramCard({ node, n, toneName, index = 0, compact = false, fill = true, stacked = false }) {
  const tone = toneOf(node.tone || toneName, index);
  const [open, setOpen] = useState(false);
  const hasMore = Array.isArray(node.details) ? node.details.length > 0 : !!node.details;
  const iconEl = node.icon && <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${tone.icon}`}><Icon name={node.icon} className="w-[18px] h-[18px]" /></span>;
  const chevron = hasMore && <ChevronDown className={`w-4 h-4 mt-1 shrink-0 text-charcoal/40 motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />;
  const titleEl = (
    <div className="min-w-0 flex-1">
      <p className={`font-semibold leading-snug ${compact || stacked ? 'text-[14px]' : 'text-[15px]'} ${tone.title}`}>{node.title}</p>
      {node.subtitle && <p className="text-[12.5px] text-charcoal/60 leading-snug mt-0.5">{node.subtitle}</p>}
    </div>
  );
  const body = (
    <>
      {stacked ? (
        // Narrow cards in a row: badge and icon on top, title underneath, so the title keeps its width.
        <>
          <div className="flex items-center gap-2"><Badge n={n} tone={tone} />{iconEl}<span className="flex-1" />{chevron}</div>
          <div className="mt-2.5">{titleEl}</div>
        </>
      ) : (
        <div className="flex items-start gap-3"><Badge n={n} tone={tone} />{iconEl}{titleEl}{chevron}</div>
      )}
      {node.text && <p className="mt-2 text-[13.5px] leading-6 text-charcoal/80">{node.text}</p>}
      {node.items?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {node.items.map((it, k) => <li key={k} className="text-[13px] leading-5 text-charcoal/80 flex gap-2"><span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${tone.badge}`} aria-hidden="true" /><span>{it}</span></li>)}
        </ul>
      )}
      {node.tags?.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{node.tags.map((t, k) => <span key={k} className={`px-2 py-0.5 rounded-full text-[11.5px] font-medium ${tone.chip}`}>{t}</span>)}</div>}
      {hasMore && open && (
        <div className="mt-3 pt-3 border-t border-black/5 space-y-1">
          {(Array.isArray(node.details) ? node.details : [node.details]).map((d, k) => (
            <p key={k} className={`text-[12.5px] leading-5 text-charcoal/75 ${/[=^()|]|\b[a-z]_?\w*\(/.test(d) ? 'font-mono text-[12px]' : ''}`}>{d}</p>
          ))}
        </div>
      )}
      {hasMore && !open && <p className="mt-2.5 self-start inline-flex items-center gap-1 rounded-full bg-white/80 border border-black/5 px-2 py-0.5 text-[11px] font-semibold text-charcoal/55">+ Formula & technical detail</p>}
    </>
  );
  const cls = `block w-full ${fill ? 'h-full' : ''} text-left rounded-2xl border p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(12,45,38,.05)] ${tone.card}`;
  return hasMore
    ? <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className={`${cls} flex flex-col justify-start hover:shadow-md motion-safe:transition-shadow focus:outline-none focus-visible:ring-2 ${tone.ring}`}>{body}</button>
    : <div className={cls}>{body}</div>;
}

/**
 * Thick connector with a solid arrowhead and light flowing along it towards the next step.
 * dir: 'down' | 'right'. Colour comes from the text colour (tone.arrow classes).
 */
export function FlowArrow({ dir = 'down', className = 'text-forest/70' }) {
  const down = dir === 'down';
  const W = down ? 18 : 38;
  const H = down ? 30 : 18;
  const shaft = down ? 'M9,2 L9,19' : 'M2,9 L25,9';
  const head = down ? 'M2.5,17 L9,28 L15.5,17 Q9,20 2.5,17 Z' : 'M23,2.5 L35,9 L23,15.5 Q26,9 23,2.5 Z';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className={`flow-arrow shrink-0 overflow-visible ${className}`} aria-hidden="true">
      <path d={shaft} stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d={shaft} stroke="#fff" strokeOpacity=".85" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 7" fill="none" className="flow-arrow-dash" />
      <path d={head} fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

const Down = ({ className = 'text-forest/70' }) => <div className="flex justify-center py-1.5" aria-hidden="true"><FlowArrow dir="down" className={className} /></div>;

function SectionHead({ s, n }) {
  if (!s.title && !s.text) return null;
  return (
    <div className="mb-3">
      {s.title && <h4 className="text-[13px] font-bold tracking-[0.08em] uppercase text-forest flex items-center gap-2">{n !== undefined && <span className="text-sage">{String(n).padStart(2, '0')}</span>}{s.title}</h4>}
      {s.text && <p className="mt-1 text-[13.5px] leading-6 text-charcoal/70">{s.text}</p>}
    </div>
  );
}

/* ---------- section types ---------- */

/** Stacked levels (e.g. AI ⊃ ML ⊃ DL ⊃ GenAI): each level indents slightly to show "inside". */
function LayersSection({ s }) {
  return (
    <ol className="space-y-0">
      {s.items.map((it, i) => (
        <li key={i} style={{ marginLeft: `min(${i * 18}px, ${i * 4}vw)` }}>
          <DiagramCard node={it} n={it.n ?? i + 1} index={i} />
          {i < s.items.length - 1 && <Down className={toneOf(s.items[i + 1].tone, i + 1).arrow} />}
        </li>
      ))}
    </ol>
  );
}

/** Ordered steps. Rows on wide screens (≤5 steps), a vertical list otherwise. Loops are listed explicitly. */
function Flow({ s }) {
  const steps = s.steps;
  const row = (s.direction || (steps.length <= 5 ? 'row' : 'column')) === 'row';
  return (
    <div>
      <ol className={row ? 'flex flex-col lg:flex-row lg:items-stretch gap-0 lg:gap-0' : 'flex flex-col'}>
        {steps.map((st, i) => (
          <li key={i} className={row ? 'lg:flex-1 lg:min-w-0 flex flex-col lg:flex-row lg:items-stretch' : ''}>
            <div className={row ? 'lg:flex-1 lg:min-w-0' : ''}><DiagramCard node={st} n={st.n ?? i + 1} index={i} compact={row} stacked={row && steps.length > 2} /></div>
            {i < steps.length - 1 && (row
              ? <div className="flex items-center justify-center py-1.5 lg:py-0 lg:px-1" aria-hidden="true"><span className="lg:hidden"><FlowArrow dir="down" className={toneOf(steps[i + 1].tone, i + 1).arrow} /></span><span className="hidden lg:flex"><FlowArrow dir="right" className={toneOf(steps[i + 1].tone, i + 1).arrow} /></span></div>
              : <Down />)}
          </li>
        ))}
      </ol>
      {s.loops?.length > 0 && (
        <div className="mt-3 rounded-xl border border-dashed border-brand-300 bg-white/70 p-3">
          <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-sage flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Feedback loops</p>
          <ul className="mt-1.5 space-y-1">
            {s.loops.map((l, i) => (
              <li key={i} className="text-[13px] leading-5 text-charcoal/80">
                <span className="font-semibold">{l.from}</span> <span aria-hidden="true">↺</span><span className="sr-only">loops back to</span> <span className="font-semibold">{l.to}</span>{l.label && <span className="text-charcoal/60"> — {l.label}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {s.after && (
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[12px] font-semibold text-charcoal/55 sm:w-28 shrink-0">{s.after.label || 'Then'}</span>
          <div className="flex-1"><DiagramCard node={s.after} index={5} /></div>
        </div>
      )}
    </div>
  );
}

/** One input splitting into parallel tracks, each a short vertical chain, optionally merging again. */
function Branches({ s }) {
  const cols = s.columns;
  const grid = cols.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  return (
    <div>
      {s.source && <><div className="max-w-xl mx-auto"><DiagramCard node={{ icon: 'data', tone: 'slate', ...s.source }} /></div><Down /></>}
      <div className={`grid gap-4 ${grid}`}>
        {cols.map((c, ci) => {
          const tone = toneOf(c.tone, ci);
          return (
            <div key={ci} className="flex flex-col justify-start">
              {c.title && <p className={`mb-2 text-[12px] font-bold uppercase tracking-[0.08em] ${tone.title} flex items-center gap-1.5`}>{c.icon && <Icon name={c.icon} className="w-3.5 h-3.5" />}{c.title}</p>}
              {c.cards.map((card, k) => (
                <React.Fragment key={k}>
                  <DiagramCard node={{ tone: c.tone || ORDER[ci % ORDER.length], ...card }} n={card.n} index={ci} compact fill={false} />
                  {k < c.cards.length - 1 && <Down className={tone.arrow} />}
                </React.Fragment>
              ))}
            </div>
          );
        })}
      </div>
      {s.merge && <><Down /><div className="max-w-2xl mx-auto"><DiagramCard node={{ icon: 'combine', tone: 'slate', ...s.merge }} /></div></>}
    </div>
  );
}

/** Side-by-side alternatives (e.g. mutable vs immutable, p < 0.05 vs p ≥ 0.05). */
function Compare({ s }) {
  const grid = s.columns.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';
  return <div className={`grid gap-3 ${grid}`}>{s.columns.map((c, i) => <DiagramCard key={i} node={c} n={c.n} index={i} />)}</div>;
}

function TableSection({ s }) {
  return (
    <div className="overflow-x-auto thin-scroll rounded-xl border border-brand-900/10 bg-white" tabIndex={0} aria-label={`${s.title || 'Table'}, scroll sideways on small screens`}>
      <table className="w-full text-[13px] min-w-[520px]">
        {s.title && <caption className="sr-only">{s.title}</caption>}
        <thead className="bg-brand-50 text-forest">
          <tr>{s.head.map((h, i) => <th key={i} scope="col" className="px-3 py-2.5 text-left font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {s.rows.map((r, i) => (
            <tr key={i} className="border-t border-brand-900/5 align-top">
              {r.map((cell, k) => k === 0
                ? <th key={k} scope="row" className="px-3 py-2.5 text-left font-semibold text-charcoal">{cell}</th>
                : <td key={k} className="px-3 py-2.5 text-charcoal/80">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeSection({ s }) {
  return (
    <div className="rounded-2xl border border-brand-900/10 bg-white overflow-hidden">
      {s.label && <p className="px-4 py-2 text-[12px] font-semibold text-charcoal/60 border-b border-brand-900/5 bg-cream">{s.label}</p>}
      <pre className="p-4 text-[12.5px] leading-6 font-mono text-charcoal overflow-x-auto thin-scroll"><code>{s.code}</code></pre>
    </div>
  );
}

const SECTION = { layers: LayersSection, flow: Flow, branches: Branches, compare: Compare, table: TableSection, code: CodeSection };

/** Renders all sections of a diagram, joined by arrows. */
export function DiagramBody({ def }) {
  return (
    <div className="space-y-0">
      {def.sections.map((s, i) => {
        const C = SECTION[s.type];
        if (!C) return null;
        return (
          <React.Fragment key={i}>
            <section aria-label={s.title || `Part ${i + 1}`} className="rounded-2xl bg-white/60 border border-brand-900/[.06] p-3 sm:p-4">
              <SectionHead s={s} n={def.sections.length > 1 ? i + 1 : undefined} />
              <C s={s} />
            </section>
            {i < def.sections.length - 1 && <div className="flex justify-center py-2" aria-hidden="true"><span className="flow-hop w-11 h-11 rounded-full bg-gradient-to-br from-forest to-evergreen shadow-[0_8px_18px_-8px_rgba(1,58,43,.6)] ring-4 ring-white flex items-center justify-center"><ArrowDown className="w-5 h-5 text-ivory" strokeWidth={2.75} /></span></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Lists problems in a diagram definition (used by tests and to avoid rendering broken data). */
export function validateVisualDiagram(def) {
  const errors = [];
  if (!def || typeof def !== 'object') return ['Diagram definition is missing.'];
  if (!def.title) errors.push('Diagram has no title.');
  if (!Array.isArray(def.sections) || !def.sections.length) errors.push('Diagram has no sections.');
  (def.sections || []).forEach((s, i) => {
    const where = `Section ${i + 1}`;
    if (!SECTION[s.type]) errors.push(`${where}: unknown type "${s.type}".`);
    const need = { layers: 'items', flow: 'steps', branches: 'columns', compare: 'columns', table: 'rows' }[s.type];
    if (need && (!Array.isArray(s[need]) || !s[need].length)) errors.push(`${where}: "${need}" is empty.`);
    if (s.type === 'branches') (s.columns || []).forEach((c, k) => { if (!c.cards?.length) errors.push(`${where}, column ${k + 1}: no cards.`); });
    if (s.type === 'table' && s.head && (s.rows || []).some(r => r.length !== s.head.length)) errors.push(`${where}: table rows and header differ in length.`);
    if (s.type === 'code' && !s.code) errors.push(`${where}: code is empty.`);
    const cards = [...(s.items || []), ...(s.steps || []), ...(s.type === 'compare' ? s.columns || [] : []), ...((s.columns || []).flatMap(c => c.cards || []))];
    cards.forEach((c, k) => { if (!c || !c.title) errors.push(`${where}: card ${k + 1} has no title.`); });
  });
  return errors;
}

/**
 * Lesson diagram: header with fullscreen and "original diagram" toggle, the visual body, and
 * a short note. `original` is the source text diagram, kept available unchanged.
 */
export default function VisualDiagram({ def, original }) {
  const [full, setFull] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!full) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [full]);

  const errors = validateVisualDiagram(def);
  if (errors.length) return null;

  const header = (inFull) => (
    <div className="flex flex-wrap items-start gap-3 justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-sage">Visual diagram</p>
        <h3 className="mt-1 font-display text-xl sm:text-2xl text-forest leading-tight">{cleanText(def.title)}</h3>
        {def.subtitle && <p className="mt-1 text-[14px] leading-6 text-charcoal/70 max-w-3xl">{def.subtitle}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        {original && !inFull && (
          <button type="button" onClick={() => setShowOriginal(v => !v)} aria-expanded={showOriginal} className="btn border border-brand-900/15 bg-white text-forest hover:bg-brand-50 px-3 py-1.5 text-[13px]">
            <TerminalSquare className="w-4 h-4" aria-hidden="true" /> {showOriginal ? 'Hide original' : 'Original diagram'}
          </button>
        )}
        {inFull
          ? <button ref={closeRef} type="button" onClick={() => setFull(false)} className="btn border border-brand-900/15 bg-white text-forest hover:bg-brand-50 px-3 py-1.5 text-[13px]"><Minimize2 className="w-4 h-4" aria-hidden="true" /> Close</button>
          : <button type="button" onClick={() => setFull(true)} className="btn border border-brand-900/15 bg-white text-forest hover:bg-brand-50 px-3 py-1.5 text-[13px]" aria-label="Open diagram full screen"><Maximize2 className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">Full screen</span></button>}
      </div>
    </div>
  );

  const surface = 'rounded-3xl border border-brand-900/10 bg-gradient-to-b from-[#F6F9FC] to-[#F8F5EE] p-3 sm:p-5';
  return (
    <figure className="space-y-3">
      <div className={surface}>
        {header(false)}
        <div className="mt-4"><DiagramBody def={def} /></div>
        {def.note && <p className="mt-4 text-[13px] leading-6 text-charcoal/70 flex gap-2"><Lightbulb className="w-4 h-4 mt-1 shrink-0 text-sage" aria-hidden="true" /><span>{def.note}</span></p>}
        {def.legend && <p className="mt-2 text-[12px] text-charcoal/55">{def.legend}</p>}
      </div>
      {showOriginal && original && (
        <pre className="rounded-2xl bg-evergreen text-[#E9F1EC] p-4 text-[12px] leading-[1.55] font-mono overflow-x-auto thin-scroll" aria-label="Original text diagram">{original}</pre>
      )}
      {full && (
        <div className="fixed inset-0 z-[150] bg-evergreen/70 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={`${cleanText(def.title)} (full screen)`} onClick={(e) => { if (e.target === e.currentTarget) setFull(false); }}>
          <div className={`${surface} max-w-6xl mx-auto bg-ivory`}>
            {header(true)}
            <div className="mt-4"><DiagramBody def={def} /></div>
            {def.note && <p className="mt-4 text-[13px] leading-6 text-charcoal/70">{def.note}</p>}
          </div>
          <button type="button" onClick={() => setFull(false)} className="fixed top-3 right-3 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center" aria-label="Close full screen"><X className="w-5 h-5" /></button>
        </div>
      )}
    </figure>
  );
}
