// Builds the JavaScript program that checks a learner's answer: their code, then every test run as an
// async function, then one result line on the console. Used by the browser (sandboxed iframe) and by
// scripts/verify-interview.mjs (Node).
import { RESULT_MARK } from './pyHarness.js';

// Logged after every test so the browser runner knows the code is still making progress.
export const TICK_MARK = '__ARB_TICK__';

const RUNNER = `
const __canon = (v) => {
  if (v === undefined) return '[undefined]';
  if (typeof v === 'function') return '[function]';
  if (typeof v === 'number' && Number.isNaN(v)) return '[NaN]';
  if (v instanceof Error) return { error: v.message };
  if (Array.isArray(v)) return v.map(__canon);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, __canon(v[k])]));
  return v;
};
const __same = (a, b) => JSON.stringify(__canon(a)) === JSON.stringify(__canon(b));
const __timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out after ' + ms / 1000 + ' s')), ms));
(async () => {
  const results = [];
  for (let i = 0; i < __tests.length; i++) {
    try {
      const got = await Promise.race([__tests[i](), __timeout(3000)]);
      results.push({ ok: __same(got, __expected[i]), got: __canon(got) });
    } catch (e) {
      results.push({ ok: false, error: (e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : String(e)) });
    }
    console.log(${JSON.stringify(TICK_MARK)});
  }
  console.log(${JSON.stringify(RESULT_MARK)} + JSON.stringify({ results }));
})();
`;

/** JavaScript source that runs `code` against the first `limit` tests of `problem`. */
export function buildJsCheck(problem, code, limit = Infinity) {
  const tests = problem.tests.slice(0, Math.min(problem.tests.length, limit));
  const fns = tests.map((t) => `async () => {\n${t.code}\n}`).join(',\n');
  return `${code}\n;\nconst __tests = [\n${fns}\n];\nconst __expected = ${JSON.stringify(tests.map((t) => t.expected))};\n${RUNNER}`;
}

/** Starter code shown in the editor. */
export function jsStarter(problem) {
  return problem.cls
    ? `class ${problem.fn} {\n  // Write your methods here\n}\n`
    : `function ${problem.fn}(${problem.params}) {\n  // Write your solution here\n}\n`;
}

/** Readable text for a JSON value. */
export function jsRepr(v) {
  return JSON.stringify(v);
}
