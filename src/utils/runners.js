// In-browser code runners for the practice playground.
//  - Python: Pyodide (CPython compiled to WebAssembly) inside a Web Worker, so an infinite loop can be stopped.
//  - SQL: sql.js (SQLite compiled to WebAssembly) with a small sample database.
//  - HTML / CSS / JavaScript: rendered in a sandboxed iframe (see CodePlayground).

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

export const SAMPLE_SCHEMA = `
CREATE TABLE departments (dept_id INTEGER PRIMARY KEY, dept_name TEXT NOT NULL, location TEXT);
CREATE TABLE employees (emp_id INTEGER PRIMARY KEY, first_name TEXT, last_name TEXT, email TEXT UNIQUE, dept_id INTEGER REFERENCES departments(dept_id), salary REAL, hire_date TEXT, manager_id INTEGER);
CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT, city TEXT, signup_date TEXT);
CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL);
CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(customer_id), order_date TEXT, status TEXT, total_amount REAL);
CREATE TABLE order_items (item_id INTEGER PRIMARY KEY, order_id INTEGER REFERENCES orders(order_id), product_id INTEGER REFERENCES products(product_id), quantity INTEGER, unit_price REAL);
INSERT INTO departments VALUES (1,'Engineering','Hyderabad'),(2,'Sales','Mumbai'),(3,'Marketing','Bengaluru'),(4,'Finance','Chennai');
INSERT INTO employees VALUES
 (101,'Aarav','Sharma','aarav@arb.io',1,98000,'2021-03-14',NULL),(102,'Diya','Reddy','diya@arb.io',1,87000,'2022-06-01',101),
 (103,'Kabir','Mehta','kabir@arb.io',2,64000,'2020-11-20',NULL),(104,'Ananya','Iyer','ananya@arb.io',2,58000,'2023-01-09',103),
 (105,'Rohan','Gupta','rohan@arb.io',3,61000,'2021-08-30',NULL),(106,'Meera','Nair','meera@arb.io',4,72000,'2019-05-17',NULL),
 (107,'Vihaan','Das','vihaan@arb.io',1,79000,'2024-02-12',101),(108,'Isha','Patel','isha@arb.io',3,55000,'2024-07-01',105);
INSERT INTO customers VALUES (1,'Arjun Rao','Hyderabad','2023-01-05'),(2,'Sara Khan','Mumbai','2023-03-22'),(3,'Neel Joshi','Pune','2023-07-11'),(4,'Tara Singh','Delhi','2024-02-02'),(5,'Zoya Ali','Hyderabad','2024-05-19');
INSERT INTO products VALUES (1,'Laptop Pro 14','Electronics',1299.0),(2,'Noise-Cancel Headphones','Electronics',249.0),(3,'Standing Desk','Furniture',499.0),(4,'Ergo Chair','Furniture',329.0),(5,'Python Crash Course','Books',39.0);
INSERT INTO orders VALUES (1001,1,'2024-06-01','DELIVERED',1548.0),(1002,2,'2024-06-03','SHIPPED',499.0),(1003,1,'2024-06-10','DELIVERED',39.0),(1004,3,'2024-06-15','CANCELLED',329.0),(1005,4,'2024-07-02','PENDING',1338.0),(1006,5,'2024-07-04','DELIVERED',249.0);
INSERT INTO order_items VALUES (1,1001,1,1,1299.0),(2,1001,2,1,249.0),(3,1002,3,1,499.0),(4,1003,5,1,39.0),(5,1004,4,1,329.0),(6,1005,1,1,1299.0),(7,1005,5,1,39.0),(8,1006,2,1,249.0);
`;

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
