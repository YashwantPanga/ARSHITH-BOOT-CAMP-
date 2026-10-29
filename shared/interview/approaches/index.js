// Multiple approaches per coding problem. The problem's own solution is always the recommended one;
// the files in this folder add a brute-force approach and other alternatives, each with its idea, code
// and complexity. approachesFor() returns them in teaching order: brute force, recommended, extras.
import { DSA_APPROACHES, DSA_MAIN } from './dsa.js';
import { PE_APPROACHES, PE_MAIN } from './essentials.js';
import { JS_APPROACHES, JS_MAIN } from './js.js';
import { SQL_APPROACHES, SQL_MAIN } from './sql.js';

const ALL = { ...DSA_APPROACHES, ...PE_APPROACHES, ...JS_APPROACHES, ...SQL_APPROACHES };
const MAIN = { ...DSA_MAIN, ...PE_MAIN, ...JS_MAIN, ...SQL_MAIN };

/** Ordered approaches for one problem plus the interview recommendation, or null if there are none. */
export function approachesFor(item) {
  const extra = ALL[item.id];
  const main = { title: MAIN[item.id] || 'Optimal approach', idea: item.explanation, code: item.solution, complexity: item.complexity || '', recommended: true };
  if (!extra) return { list: [main], pick: null };
  const list = [...(extra.brute ? [{ ...extra.brute, brute: true }] : []), main, ...(extra.extra || [])];
  return { list, pick: extra.pick || null };
}

/** Every extra approach (for verification): [{ item id, approach }]. */
export function allExtraApproaches() {
  return Object.entries(ALL).flatMap(([id, e]) => [e.brute, ...(e.extra || [])].filter(Boolean).map(a => ({ id, approach: a })));
}
