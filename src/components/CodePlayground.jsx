import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, RotateCcw, X, Terminal, Copy, Check, Database, Keyboard, Eye, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { LANG_LABEL } from '../utils/highlight';
import CodeEditor from './CodeEditor';
import { runPython, runSql, resetSqlDb, buildWebDoc, SAMPLE_SCHEMA } from '../utils/runners';

const Ctx = createContext(null);
export const usePlayground = () => useContext(Ctx);

const STARTERS = {
  python: '# Practice Python here – press Run (or Ctrl + Enter)\nname = "Arshith"\nskills = ["Python", "SQL", "Web", "AI"]\n\nfor i, s in enumerate(skills, start=1):\n    print(f"{i}. {name} is learning {s}")\n',
  sql: '-- Sample tables: departments, employees, customers, products, orders, order_items\nSELECT d.dept_name, COUNT(*) AS headcount, ROUND(AVG(e.salary), 0) AS avg_salary\nFROM employees e\nJOIN departments d ON d.dept_id = e.dept_id\nGROUP BY d.dept_name\nORDER BY avg_salary DESC;\n',
  html: '<section class="hero">\n  <h1>Hello, Arshith!</h1>\n  <p>Edit this HTML and press Run.</p>\n  <button onclick="this.textContent = \'Clicked!\'">Click me</button>\n</section>\n\n<style>\n  .hero { padding: 32px; border-radius: 16px; background: #013A2B; color: #FBF8F1; font-family: Inter, sans-serif; }\n  button { margin-top: 12px; padding: 10px 18px; border: 0; border-radius: 10px; background: #FBF8F1; color: #013A2B; font-weight: 600; }\n</style>\n',
  javascript: '// Practice JavaScript – console output appears below\nconst scores = [72, 88, 95, 64];\nconst avg = scores.reduce((a, b) => a + b, 0) / scores.length;\nconsole.log("Average:", avg.toFixed(1));\ndocument.getElementById("app").innerHTML = `<h2>Average score: ${avg.toFixed(1)}</h2>`;\n',
  css: '.card {\n  max-width: 360px;\n  padding: 24px;\n  border-radius: 16px;\n  background: #FBF8F1;\n  border: 1px solid #426557;\n}\n.card-title { color: #013A2B; }\n.btn-primary { display: inline-block; margin-top: 12px; padding: 10px 16px; border-radius: 10px; background: #013A2B; color: #fff; text-decoration: none; }\n'
};

export function PlaygroundProvider({ children, defaultLang = 'python' }) {
  const [state, setState] = useState(null); // { code, lang }
  const open = useCallback(({ code, lang } = {}) => {
    const l = lang || defaultLang;
    setState({ code: code ?? STARTERS[l] ?? '', lang: l, key: Date.now() });
  }, [defaultLang]);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <Ctx.Provider value={value}>
      {children}
      {state && <PlaygroundModal key={state.key} initial={state} onClose={() => setState(null)} />}
    </Ctx.Provider>
  );
}

const LANGS = ['python', 'sql', 'html', 'css', 'javascript'];
const RUN_HINT = {
  python: 'Python 3.12 (Pyodide) · runs in your browser · numpy / pandas / matplotlib load on demand',
  sql: 'SQLite (sql.js) in your browser · sample e-commerce & HR tables preloaded · PostgreSQL-only syntax may differ',
  html: 'Live preview in a sandboxed frame',
  css: 'Your CSS is applied to sample markup',
  javascript: 'Runs in a sandboxed frame · console.log output shown below'
};

function PlaygroundModal({ initial, onClose }) {
  const [lang, setLang] = useState(initial.lang);
  const [code, setCode] = useState(initial.code);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(/input\(/.test(initial.code));
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [out, setOut] = useState([]); // [{k:'out'|'err'|'info', text}]
  const [images, setImages] = useState([]);
  const [tables, setTables] = useState([]);
  const [doc, setDoc] = useState('');
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const stopRef = useRef(null);
  const isWeb = ['html', 'css', 'javascript'].includes(lang);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; stopRef.current = null; };
  }, [onClose]);

  // Console messages from the sandboxed preview frame
  // Every "Try it" starts from a fresh sample database, so an example always behaves as shown even
  // after earlier examples created or changed tables.
  useEffect(() => { if (initial.lang === 'sql') resetSqlDb().catch(() => {}); }, [initial]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data && e.data.__arb) setOut(o => [...o, { k: e.data.kind === 'error' ? 'err' : e.data.kind === 'warn' ? 'warn' : 'out', text: e.data.text }]);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const push = (k, text) => setOut(o => [...o, { k, text }]);

  const run = async () => {
    if (running) return;
    setOut([]); setImages([]); setTables([]); setStatus('');
    if (isWeb) {
      setDoc(buildWebDoc(code, lang) + `<!-- ${Date.now()} -->`);
      push('info', 'Preview updated.');
      return;
    }
    setRunning(true);
    if (lang === 'python') {
      stopRef.current = runPython(code, stdin, (m) => {
        if (m.type === 'status') setStatus(m.text);
        else if (m.type === 'out') push('out', m.text);
        else if (m.type === 'err') push('err', m.text);
        else if (m.type === 'done') {
          setRunning(false); setStatus(''); stopRef.current = null;
          if (m.images?.length) setImages(m.images);
          if (!m.error) push('info', `Finished in ${m.ms} ms`);
        }
      });
      return;
    }
    if (lang === 'sql') {
      try {
        setStatus('Loading SQLite…');
        const { results, ms, changes } = await runSql(code);
        setTables(results);
        push('info', results.length ? `${results.length} result set${results.length > 1 ? 's' : ''} · ${ms} ms` : `Statement executed · ${changes} row(s) affected · ${ms} ms`);
      } catch (err) {
        push('err', String(err.message || err));
      } finally {
        setRunning(false); setStatus('');
      }
    }
  };

  const stop = () => stopRef.current?.();

  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* blocked */ } };
  const switchLang = (l) => { setLang(l); setCode(STARTERS[l]); setOut([]); setTables([]); setImages([]); setDoc(''); };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-5">
      <div className="absolute inset-0 bg-evergreen/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${full ? 'h-full max-w-none' : 'max-w-6xl h-[92vh]'} bg-ivory rounded-3xl shadow-2xl animate-scale-in flex flex-col overflow-hidden`}>
        {/* Title bar */}
        <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3 border-b border-brand-900/10 bg-white">
          <span className="w-9 h-9 rounded-xl bg-brand-900 text-ivory flex items-center justify-center"><Terminal className="w-4 h-4" /></span>
          <div className="mr-auto">
            <p className="font-display text-lg font-semibold text-brand-900 leading-tight">Practice Lab</p>
            <p className="text-[11px] text-charcoal/55 hidden sm:block">{RUN_HINT[lang]}</p>
          </div>
          <div className="flex bg-cream rounded-xl p-1 border border-brand-900/10 overflow-x-auto no-scrollbar">
            {LANGS.map(l => (
              <button key={l} onClick={() => switchLang(l)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${lang === l ? 'bg-brand-900 text-ivory' : 'text-charcoal/60 hover:text-brand-900'}`}>{LANG_LABEL[l]}</button>
            ))}
          </div>
          <button onClick={() => setFull(f => !f)} className="hidden sm:flex p-2 rounded-lg hover:bg-cream text-charcoal/60" aria-label="Toggle full screen">{full ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream text-charcoal/60" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 min-h-0 grid lg:grid-cols-2">
          {/* Editor */}
          <div className="flex flex-col min-h-0 border-b lg:border-b-0 lg:border-r border-brand-900/10 bg-evergreen">
            <div className="flex items-center gap-2 px-3 h-11 bg-black/20 border-b border-white/5">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-300">editor · {LANG_LABEL[lang]}</span>
              <span className="ml-auto flex items-center gap-1">
                {lang === 'python' && <button onClick={() => setShowStdin(s => !s)} className={`flex items-center gap-1 h-7 px-2 rounded-md text-[11px] ${showStdin ? 'bg-white/15 text-white' : 'text-brand-200 hover:bg-white/10'}`}><Keyboard className="w-3.5 h-3.5" /> Input</button>}
                <button onClick={copy} className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-brand-200 hover:bg-white/10">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                <button onClick={() => setCode(initial.lang === lang ? initial.code : STARTERS[lang])} className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] text-brand-200 hover:bg-white/10" title="Reset code"><RotateCcw className="w-3.5 h-3.5" /></button>
                {running && lang === 'python' ? (
                  <button onClick={stop} className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-rose-500 text-white text-xs font-bold"><Square className="w-3 h-3 fill-current" /> Stop</button>
                ) : (
                  <button onClick={run} disabled={running} className="flex items-center gap-1.5 h-7 px-3.5 rounded-md bg-ivory text-brand-900 text-xs font-bold hover:bg-white disabled:opacity-60">
                    {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />} Run
                  </button>
                )}
              </span>
            </div>
            <CodeEditor value={code} onChange={setCode} lang={lang} onRun={run} minHeight={240} className="flex-1 min-h-0" label="Code editor" />
            {showStdin && lang === 'python' && (
              <div className="border-t border-white/10 p-3 bg-black/20">
                <p className="text-[10.5px] uppercase tracking-[0.16em] text-brand-300 mb-1.5">Program input (one value per line for each input())</p>
                <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} className="w-full rounded-lg bg-black/25 text-[#E9F1EC] font-mono text-[13px] p-2 outline-none border border-white/10 focus:border-brand-300" placeholder={'Arshith\n21'} />
              </div>
            )}
          </div>

          {/* Output */}
          <div className="flex flex-col min-h-0 bg-white">
            <div className="flex items-center gap-2 px-4 h-11 border-b border-brand-900/10">
              {isWeb ? <Eye className="w-4 h-4 text-sage" /> : lang === 'sql' ? <Database className="w-4 h-4 text-sage" /> : <Terminal className="w-4 h-4 text-sage" />}
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/60">{isWeb ? 'Preview & console' : 'Output'}</span>
              {status && <span className="ml-auto flex items-center gap-1.5 text-xs text-sage"><Loader2 className="w-3.5 h-3.5 animate-spin" />{status}</span>}
              {lang === 'sql' && !status && <button onClick={async () => { await resetSqlDb(); setOut([{ k: 'info', text: 'Sample database reset.' }]); setTables([]); }} className="ml-auto text-xs font-semibold text-sage hover:text-brand-900">Reset data</button>}
            </div>
            <div className="flex-1 min-h-0 overflow-auto thin-scroll">
              {isWeb && (
                <div className="h-[55%] min-h-[220px] border-b border-brand-900/10 bg-white">
                  {doc ? <iframe title="Preview" sandbox="allow-scripts allow-modals" srcDoc={doc} className="w-full h-full" /> : <Empty text="Press Run to render the preview." />}
                </div>
              )}

              {tables.map((t, i) => (
                <div key={i} className="m-4 overflow-auto rounded-xl border border-brand-900/10 max-h-80 thin-scroll">
                  <table className="w-full text-[13px]">
                    <thead className="bg-brand-900 text-ivory sticky top-0"><tr>{t.columns.map((c, k) => <th key={k} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
                    <tbody>{t.values.map((r, k) => <tr key={k} className="odd:bg-white even:bg-cream">{r.map((c, j) => <td key={j} className="px-3 py-1.5 border-t border-brand-900/5 font-mono whitespace-nowrap">{c === null ? <span className="text-charcoal/40">NULL</span> : String(c)}</td>)}</tr>)}</tbody>
                  </table>
                  <p className="px-3 py-1.5 text-[11px] text-charcoal/50 bg-cream border-t border-brand-900/5">{t.values.length} row{t.values.length !== 1 ? 's' : ''}</p>
                </div>
              ))}

              {images.map((src, i) => <img key={i} src={`data:image/png;base64,${src}`} alt={`Plot ${i + 1}`} className="m-4 rounded-xl border border-brand-900/10 max-w-[calc(100%-2rem)]" />)}

              <div className="p-4 font-mono text-[13px] leading-relaxed space-y-0.5">
                {out.length === 0 && !tables.length && !images.length && !isWeb && <Empty text={lang === 'sql' ? 'Run a query to see results here.' : 'Run your code to see output here.'} />}
                {out.map((o, i) => (
                  <pre key={i} className={`whitespace-pre-wrap break-words m-0 ${o.k === 'err' ? 'text-rose-700 bg-rose-50 rounded-md px-2 py-1' : o.k === 'warn' ? 'text-amber-700' : o.k === 'info' ? 'text-sage text-xs pt-2' : 'text-charcoal'}`}>{o.text}</pre>
                ))}
              </div>

              {lang === 'sql' && (
                <details className="mx-4 mb-4 rounded-xl border border-brand-900/10 bg-cream">
                  <summary className="px-3 py-2 text-xs font-semibold text-brand-900 cursor-pointer">Sample schema</summary>
                  <pre className="px-3 pb-3 text-[11.5px] text-charcoal/70 whitespace-pre-wrap">{SAMPLE_SCHEMA.split('\n').filter(l => l.startsWith('CREATE')).join('\n')}</pre>
                </details>
              )}
            </div>
            <div className="px-4 py-2 border-t border-brand-900/10 text-[11px] text-charcoal/50 flex justify-between">
              <span>Ctrl + Enter to run · Tab inserts 4 spaces</span>
              <span className="hidden sm:inline">First Python run downloads the runtime (~10 MB)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Empty = ({ text }) => <div className="h-full min-h-[120px] flex items-center justify-center text-sm text-charcoal/40 font-sans">{text}</div>;
