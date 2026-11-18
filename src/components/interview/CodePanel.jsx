import React, { useMemo, useState } from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import { tokenLines } from '../../utils/highlight';

/* Building blocks for the Interview Prep question pages: the question header, the segmented
   language switch, the dark "Code snippet" panel, a read-only highlighted code view with line
   numbers, phone tabs and the complexity tiles. They show only data the question really has. */

const LANG_NAME = {
  python: 'Python', 'python-unix': 'Python', javascript: 'JavaScript', jsx: 'React', sql: 'SQL', java: 'Java',
  cpp: 'C++', html: 'HTML', css: 'CSS', shell: 'Terminal', yaml: 'YAML', nginx: 'Nginx', dockerfile: 'Docker', text: 'Code'
};
const LANG_SHORT = { javascript: 'JS' };
const LANG_DOT = {
  python: '#3FB874', 'python-unix': '#3FB874', javascript: '#E8B53A', jsx: '#5AB4E0', sql: '#7FA8E8', java: '#E07A6A',
  cpp: '#7FA8E8', html: '#E8865A', css: '#8E7FE0', shell: '#9FB3AA', yaml: '#C49A5A', nginx: '#3FB874', dockerfile: '#5AB4E0', text: '#9FB3AA'
};
const EXT = { python: 'py', 'python-unix': 'py', javascript: 'js', jsx: 'jsx', sql: 'sql', java: 'java', cpp: 'cpp', html: 'html', css: 'css', shell: 'sh', yaml: 'yaml', nginx: 'conf', text: 'txt' };
const HIGHLIGHT = { python: 'python', 'python-unix': 'python', javascript: 'javascript', jsx: 'javascript', sql: 'sql', java: 'javascript', html: 'html', css: 'css' };

export const langName = (lang) => LANG_NAME[lang] || lang;

const snakeCase = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

/**
 * A file name for the code panel chip, taken from the code itself where possible: two_sum.py from
 * fn "twoSum", dijkstra.py from "def dijkstra", a path named in a leading comment, else the topic.
 */
export function fileNameFor(item, lang) {
  const code = String(item.code || '');
  const pathInComment = (code.match(/^(?:#|\/\/)\s*([\w./-]+\.(?:ya?ml|conf|java|py|js))\b/m) || [])[1];
  if (pathInComment) return pathInComment.split('/').pop();
  if (lang === 'dockerfile') return 'Dockerfile';
  if (lang === 'java') return `${(code.match(/public class (\w+)/) || [])[1] || 'Main'}.java`;
  if (lang === 'sql') return item.fn ? `${snakeCase(item.fn)}.sql` : 'query.sql';
  if (lang === 'html') return 'index.html';
  if (lang === 'shell') return 'commands.sh';
  if (lang === 'jsx') return `${(code.match(/export (?:default )?function (\w+)/) || [])[1] || 'App'}.jsx`;
  if (item.fn) return lang === 'javascript' ? `${item.fn}.js` : `${snakeCase(item.fn)}.${EXT[lang] || 'txt'}`;
  // Concept questions: the key words of the question, e.g. "How does Dijkstra's algorithm work?" -> dijkstras_algorithm
  const words = String(item.title || '').toLowerCase().replace(/'s\b/g, 's').replace(/\([^)]*\)/g, ' ').split(/[^a-z0-9]+/)
    .filter(w => w && !STOP.has(w)).slice(0, 3);
  const base = words.join('_') || 'example';
  return `${base}.${EXT[lang] || 'txt'}`;
}
const STOP = new Set('what is are a an the how does do did why when where which who explain describe name give some vs versus and or of in to for with it its your you can should would will be this that these those show simple common main between difference work works used use using there here on at by they them one must need needed matter get way ways'.split(' '));

/** "#001 · Easy · Topic" line and the large title. */
export function QuestionHeader({ n, eyebrow, difficulty, tags = [], title, right }) {
  const tone = { Easy: 'bg-[#E3F1E8] text-[#1E6A45] border-[#CDE5D6]', Medium: 'bg-[#FFF4DC] text-[#8A5A00] border-[#F2DDA8]', Hard: 'bg-[#FCE8E6] text-[#A3352B] border-[#F3CFCB]' }[difficulty] || 'bg-cream text-charcoal border-brand-900/10';
  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:gap-8">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-charcoal/55 tabular-nums">{eyebrow ? `${eyebrow} ` : ''}#{String(n).padStart(3, '0')}</span>
          <span className={`px-2.5 py-0.5 rounded-full border text-[12px] font-semibold ${tone}`}>{difficulty}</span>
          {tags.filter(Boolean).map(t => <span key={t} className="px-2.5 py-0.5 rounded-full border border-brand-900/15 bg-white text-[12px] text-charcoal/70">{t}</span>)}
        </div>
        <h1 className="mt-2 font-display text-[26px] sm:text-[32px] font-bold text-evergreen leading-[1.15]">{title}</h1>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

/** Segmented language switch. With one language it simply shows that language as the active pill. */
export function LangSwitch({ langs, active, onChange, className = '' }) {
  return (
    <div role="tablist" aria-label="Language" className={`inline-flex w-full lg:w-auto p-1 rounded-full bg-white border border-brand-900/10 shadow-[0_6px_18px_-14px_rgba(1,58,43,.6)] ${className}`}>
      {langs.map(l => {
        const on = l === active;
        return (
          <button key={l} role="tab" aria-selected={on} onClick={() => onChange?.(l)} disabled={langs.length === 1}
            className={`flex-1 lg:flex-none inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-[14px] font-semibold transition disabled:cursor-default ${on ? 'bg-forest text-ivory' : 'text-charcoal/65 hover:text-forest'}`}>
            <span className="w-2 h-2 rounded-full" style={{ background: on ? '#9FE0B5' : LANG_DOT[l] }} aria-hidden="true" />
            <span className="sm:hidden">{LANG_SHORT[l] || langName(l)}</span><span className="hidden sm:inline">{langName(l)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs used on phones (and inside cards). */
export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div role="tablist" className={`flex gap-5 border-b border-brand-900/10 overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map(([id, label]) => (
        <button key={id} role="tab" aria-selected={active === id} onClick={() => onChange(id)}
          className={`shrink-0 pb-2.5 pt-1 text-[15px] font-semibold border-b-2 -mb-px transition ${active === id ? 'border-forest text-evergreen' : 'border-transparent text-charcoal/45 hover:text-charcoal/75'}`}>{label}</button>
      ))}
    </div>
  );
}

export function CopyButton({ text, dark = true, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text()); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <button type="button" onClick={copy} className={dark ? PANEL_BTN : 'btn-outline !py-2'} aria-label="Copy code">
      {done ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}<span>{done ? 'Copied' : label}</span>
    </button>
  );
}

export const PANEL_BTN = 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-white/15 text-[13.5px] font-semibold text-ivory/90 hover:bg-white/10 disabled:opacity-50';
export const PANEL_RUN = 'inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#8FD9A8] text-[#0C2D26] text-[13.5px] font-bold hover:bg-[#A5E3BA] disabled:opacity-60';
export const PANEL_PRIMARY = 'inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white text-[#0C2D26] text-[13.5px] font-bold hover:bg-ivory disabled:opacity-60';

/** The dark "</> Code snippet" panel: header with file chip and actions, body, optional status footer. */
export function CodePanel({ fileName, actions, children, footer, className = '' }) {
  return (
    <section className={`rounded-[22px] bg-[#0C2D26] text-ivory overflow-hidden shadow-[0_24px_48px_-32px_rgba(1,58,43,.8)] ${className}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 sm:px-5 py-3 border-b border-white/10">
        <span className="w-8 h-8 rounded-lg bg-white/[.07] flex items-center justify-center text-[#8FD9A8]"><Code2 className="w-4 h-4" /></span>
        <span className="font-display text-[16px] font-bold">Code snippet</span>
        {fileName && <span className="px-2 py-0.5 rounded-md bg-white/[.07] font-mono text-[12px] text-ivory/70 truncate max-w-[180px]">{fileName}</span>}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
      {footer && <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 sm:px-5 py-2.5 border-t border-white/10 font-mono text-[12px] text-ivory/60">{footer}</footer>}
    </section>
  );
}

/** Read-only code with syntax colours and line numbers; scrolls sideways inside its own box. */
export function StaticCode({ code, lang, maxHeight }) {
  const lines = useMemo(() => tokenLines(code, HIGHLIGHT[lang] || 'text'), [code, lang]);
  const width = String(lines.length).length > 2 ? 'w-10' : 'w-8';
  return (
    <div className="overflow-auto thin-scroll py-3" style={maxHeight ? { maxHeight } : undefined}>
      <pre className="m-0 min-w-max font-mono text-[12.5px] sm:text-[13px] leading-[1.75] text-[#E9F1EC]">
        {lines.map((toks, i) => (
          <div key={i} className="flex pr-5 hover:bg-white/[.04]">
            <span aria-hidden="true" className={`${width} shrink-0 pr-3 text-right select-none text-ivory/30`}>{i + 1}</span>
            <code className="whitespace-pre">{toks.length ? toks.map((t, k) => (t.t ? <span key={k} className={`tok-${t.t}`}>{t.v}</span> : <React.Fragment key={k}>{t.v}</React.Fragment>)) : ' '}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}

/** Splits "O(n) time, O(1) space for ..." into tiles. Strings without a clear time/space label stay whole. */
export function parseComplexity(text) {
  if (!text) return null;
  const big = /(O\((?:[^()]|\([^()]*\))*\))/;
  const time = text.match(new RegExp(`${big.source}\\s+time`));
  const space = text.match(new RegExp(`${big.source}\\s+(?:extra\\s+)?space`));
  if (!time && !space) return { tiles: [['Complexity', text]], note: '' };
  let note = text;
  [time?.[0], space?.[0]].filter(Boolean).forEach(p => { note = note.replace(p, ''); });
  note = note.replace(/^[\s,]+|[\s,]+$/g, '').replace(/^,\s*/, '');
  return { tiles: [time && ['Time', time[1]], space && ['Space', space[1]]].filter(Boolean), note };
}

export function ComplexityTiles({ text, compact = false }) {
  const c = parseComplexity(text);
  if (!c) return null;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {c.tiles.map(([label, value]) => (
          <div key={label} className={`rounded-2xl border border-brand-900/10 bg-[#F3F8F4] px-4 ${compact ? 'py-3' : 'py-3.5'} ${c.tiles.length === 1 ? 'col-span-2' : ''}`}>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-charcoal/55">{label}</p>
            <p className={`mt-0.5 font-mono font-bold text-evergreen ${label === 'Complexity' ? 'text-[15px] leading-snug' : 'text-[22px]'}`}>{value}</p>
          </div>
        ))}
      </div>
      {c.note && <p className="mt-2 text-[13px] text-charcoal/60">{c.note}</p>}
    </div>
  );
}

/** Pale green note, used for the key idea of a solution. */
export function KeyIdea({ children, label = 'Key idea' }) {
  return (
    <div className="rounded-2xl border border-[#CDE5D6] bg-[#EEF7F1] px-4 py-3 text-[14.5px] leading-relaxed text-[#1E5141]">
      <span className="font-semibold text-evergreen">{label}: </span>{children}
    </div>
  );
}
