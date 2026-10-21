// In-browser code runners for the practice playground.
//  - Python: Pyodide (CPython compiled to WebAssembly) inside a Web Worker, so an infinite loop can be stopped.
//  - SQL: sql.js (SQLite compiled to WebAssembly) with a small sample database.
//  - HTML / CSS / JavaScript: rendered in a sandboxed iframe (see CodePlayground).

import { SAMPLE_SCHEMA } from '../../shared/sampleSchema.js';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
const SQLJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/';

/* ------------------------------------------------------------------ */
/* Python                                                              */
/* ------------------------------------------------------------------ */
const WORKER_SRC = `
importScripts('${PYODIDE_URL}pyodide.js');
let py = null;
async function boot() {
  if (!py) {
    py = await loadPyodide({ indexURL: '${PYODIDE_URL}' });
    await py.runPythonAsync("import os\\nos.environ['MPLBACKEND']='AGG'");
  }
  return py;
}
self.onmessage = async (e) => {
  const { code, stdin } = e.data;
  try {
    self.postMessage({ type: 'status', text: 'Loading Python runtime…' });
    const p = await boot();
    const lines = String(stdin || '').split('\\n');
    let li = 0;
    p.setStdin({ stdin: () => (li < lines.length ? lines[li++] : null) });
    p.setStdout({ batched: (s) => self.postMessage({ type: 'out', text: s }) });
    p.setStderr({ batched: (s) => self.postMessage({ type: 'err', text: s }) });
    self.postMessage({ type: 'status', text: 'Installing imports…' });
    await p.loadPackagesFromImports(code, { messageCallback: () => {}, errorCallback: () => {} });
    self.postMessage({ type: 'status', text: 'Running…' });
    const ns = p.globals.get('dict')();
    const t0 = performance.now();
    await p.runPythonAsync(code, { globals: ns });
    // Export any open matplotlib figures as PNG images.
    const figs = await p.runPythonAsync(\`
import sys
_imgs = []
if 'matplotlib.pyplot' in sys.modules:
    import io, base64
    import matplotlib.pyplot as _plt
    for _n in _plt.get_fignums():
        _b = io.BytesIO(); _plt.figure(_n).savefig(_b, format='png', dpi=110, bbox_inches='tight')
        _imgs.append(base64.b64encode(_b.getvalue()).decode())
    _plt.close('all')
_imgs\`, { globals: ns });
    const images = figs ? figs.toJs() : [];
    ns.destroy();
    self.postMessage({ type: 'done', ms: Math.round(performance.now() - t0), images });
  } catch (err) {
    self.postMessage({ type: 'err', text: String(err && err.message || err) });
    self.postMessage({ type: 'done', error: true });
  }
};`;

let pyWorker = null;
const newWorker = () => new Worker(URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })));

/** Runs Python; `on(event)` receives {type:'status'|'out'|'err'|'done'}. Returns a stop() function. */
export function runPython(code, stdin, on) {
  if (!pyWorker) pyWorker = newWorker();
  const w = pyWorker;
  w.onmessage = (e) => on(e.data);
  w.onerror = (e) => { on({ type: 'err', text: e.message || 'Python worker failed to start (are you offline?)' }); on({ type: 'done', error: true }); };
  w.postMessage({ code, stdin });
  return () => {
    w.terminate();
    if (pyWorker === w) pyWorker = null;
    on({ type: 'err', text: 'Execution stopped.' });
    on({ type: 'done', error: true });
  };
}

/* ------------------------------------------------------------------ */
/* SQL                                                                 */
/* ------------------------------------------------------------------ */
let sqlPromise = null;
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}
function loadSqlJs() {
  if (!sqlPromise) {
    sqlPromise = loadScript(`${SQLJS_URL}sql-wasm.js`)
      .then(() => window.initSqlJs({ locateFile: (f) => `${SQLJS_URL}${f}` }))
      .catch((e) => { sqlPromise = null; throw e; });
  }
  return sqlPromise;
}

export { SAMPLE_SCHEMA };

let sqlDb = null;
export async function resetSqlDb() {
  const SQL = await loadSqlJs();
  if (sqlDb) sqlDb.close();
  sqlDb = new SQL.Database();
  sqlDb.exec(SAMPLE_SCHEMA);
  return sqlDb;
}

/** Runs SQL against the sample database. Returns { results:[{columns, values}], ms, changes }. */
export async function runSql(code) {
  if (!sqlDb) await resetSqlDb();
  const t0 = performance.now();
  const results = sqlDb.exec(code);
  return { results, ms: Math.round(performance.now() - t0), changes: sqlDb.getRowsModified() };
}

/* ------------------------------------------------------------------ */
/* Web                                                                 */
/* ------------------------------------------------------------------ */
const CONSOLE_SHIM = `<script>(function(){var send=function(k,a){try{parent.postMessage({__arb:1,kind:k,text:Array.prototype.map.call(a,function(x){if(typeof x==='object'){try{return JSON.stringify(x,null,2)}catch(e){return String(x)}}return String(x)}).join(' ')},'*')}catch(e){}};['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){send(k,arguments);o&&o.apply(console,arguments)}});window.onerror=function(m,s,l){send('error',[m+(l?' (line '+l+')':'')])};})();<\/script>`;

const CSS_DEMO = `<div class="card"><h2 class="card-title">Styled card</h2><p>Your CSS is applied to this sample markup.</p><a class="btn-primary" href="#">Primary button</a></div>
<header class="site-header"><nav><a href="#">Home</a> <a href="#">Courses</a></nav></header>
<main class="container"><section class="grid"><div class="item">1</div><div class="item">2</div><div class="item">3</div></section>
<button class="btn">Button</button><p class="text">Paragraph text</p><ul class="list"><li>One</li><li>Two</li></ul></main>`;

/** Builds the iframe document for an HTML, CSS or JavaScript snippet. */
export function buildWebDoc(code, lang) {
  const base = '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Inter,system-ui,sans-serif;padding:16px;color:#302B25}</style>';
  if (lang === 'css') return `<!doctype html><html><head>${base}${CONSOLE_SHIM}<style>${code}</style></head><body>${CSS_DEMO}</body></html>`;
  if (lang === 'javascript') return `<!doctype html><html><head>${base}${CONSOLE_SHIM}</head><body><div id="app"></div><script>${code.replace(/<\/script>/gi, '<\\/script>')}<\/script></body></html>`;
  const hasHead = /<head[^>]*>/i.test(code);
  return hasHead ? code.replace(/<head([^>]*)>/i, `<head$1>${CONSOLE_SHIM}`) : `<!doctype html><html><head>${base}${CONSOLE_SHIM}</head><body>${code}</body></html>`;
}

/* ------------------------------------------------------------------ */
/* JavaScript (console output, for exercises)                         */
/* ------------------------------------------------------------------ */
/**
 * Runs JavaScript in a hidden sandboxed iframe (no access to this page, cookies or storage) and
 * resolves with the console output once the code has been quiet for a moment (so timers/promises
 * can finish). Capped at `maxMs`.
 */
export function runJavaScript(code, { quietMs = 400, maxMs = 4000 } = {}) {
  return new Promise((resolve) => {
    const runId = Math.random().toString(36).slice(2);
    const lines = [];
    const errors = [];
    let quietTimer;
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.style.display = 'none';
    const finish = () => {
      clearTimeout(quietTimer);
      clearTimeout(hardTimer);
      window.removeEventListener('message', onMsg);
      frame.remove();
      resolve({ output: lines.join('\n'), errors });
    };
    const bump = () => { clearTimeout(quietTimer); quietTimer = setTimeout(finish, quietMs); };
    const onMsg = (e) => {
      if (e.source !== frame.contentWindow || !e.data || e.data.runId !== runId) return;
      if (e.data.kind === 'error') errors.push(e.data.text);
      else if (e.data.kind !== 'ready') lines.push(e.data.text);
      bump();
    };
    const hardTimer = setTimeout(finish, maxMs);
    window.addEventListener('message', onMsg);
    const shim = `<script>(function(){var id=${JSON.stringify(runId)};var fmt=function(x){if(typeof x==='string')return x;try{return JSON.stringify(x)}catch(e){return String(x)}};var send=function(k,a){parent.postMessage({runId:id,kind:k,text:Array.prototype.map.call(a,fmt).join(' ')},'*')};['log','info','warn'].forEach(function(k){console[k]=function(){send('log',arguments)}});console.error=function(){send('error',arguments)};window.onerror=function(m,s,l){send('error',[m+(l?' (line '+l+')':'')])};window.addEventListener('unhandledrejection',function(e){send('error',['Unhandled rejection: '+(e.reason&&e.reason.message||e.reason)])});send('ready',[])})();<\/script>`;
    frame.srcdoc = `<!doctype html><html><head>${shim}</head><body><script>${String(code).replace(/<\/script>/gi, '<\\/script>')}<\/script></body></html>`;
    document.body.appendChild(frame);
  });
}
