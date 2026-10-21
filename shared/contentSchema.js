// Data contract for module enrichment and workflow diagrams.
// Used by the module reader (to decide what to render), the content validation script and the tests.

const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Validates a structured workflow diagram:
 *   { title, nodes: [{ id, label, detail?, input?, output? }], edges: [{ from, to, label? }] }
 * Returns { ok, errors[] }. Never throws.
 */
export function validateDiagram(d) {
  const errors = [];
  if (d === null || d === undefined) return { ok: false, errors: ['Diagram data is missing.'] };
  if (typeof d !== 'object' || Array.isArray(d)) return { ok: false, errors: ['Diagram must be an object with nodes and edges.'] };
  if (!Array.isArray(d.nodes) || d.nodes.length === 0) errors.push('Diagram has no nodes.');
  const ids = new Set();
  (Array.isArray(d.nodes) ? d.nodes : []).forEach((n, i) => {
    if (!n || typeof n !== 'object') { errors.push(`Node ${i + 1} is not an object.`); return; }
    if (!isStr(n.id)) errors.push(`Node ${i + 1} has no id.`);
    else if (ids.has(n.id)) errors.push(`Duplicate node id "${n.id}".`);
    else ids.add(n.id);
    if (!isStr(n.label)) errors.push(`Node "${n.id || i + 1}" has no label.`);
  });
  if (d.edges !== undefined && !Array.isArray(d.edges)) errors.push('Diagram edges must be an array.');
  (Array.isArray(d.edges) ? d.edges : []).forEach((e, i) => {
    if (!e || !ids.has(e.from) || !ids.has(e.to)) errors.push(`Edge ${i + 1} references an unknown node (${e?.from} → ${e?.to}).`);
    else if (e.from === e.to) errors.push(`Edge ${i + 1} connects "${e.from}" to itself.`);
  });
  if (Array.isArray(d.nodes) && d.nodes.length > 16) errors.push('Diagram has more than 16 nodes; split it into smaller diagrams.');
  return { ok: errors.length === 0, errors };
}

/** True when an ASCII diagram string actually contains drawing characters (not just whitespace). */
export const hasAsciiDiagram = (s) => typeof s === 'string' && s.replace(/\s/g, '').length > 10;

const EX_TYPES = ['mcq', 'numeric', 'text', 'output', 'rows'];

/** Validates one module's enrichment block. Returns { errors[], warnings[] }. */
export function validateEnrichment(e, label = 'module') {
  const errors = [];
  const warnings = [];
  if (!e || typeof e !== 'object') return { errors: [`${label}: enrichment missing`], warnings };

  if (!e.workflow) warnings.push(`${label}: no workflow diagram`);
  else {
    const v = validateDiagram(e.workflow);
    v.errors.forEach((m) => errors.push(`${label}: workflow – ${m}`));
  }

  const ex = e.exercises || [];
  if (!ex.length) errors.push(`${label}: no practice exercises`);
  const ids = new Set();
  ex.forEach((x, i) => {
    const tag = `${label}: exercise ${x?.id || i + 1}`;
    if (!isStr(x?.id)) errors.push(`${tag} has no id`);
    else if (ids.has(x.id)) errors.push(`${tag} duplicate id`);
    else ids.add(x.id);
    for (const k of ['title', 'objective', 'difficulty', 'problem']) if (!isStr(x?.[k])) errors.push(`${tag} missing ${k}`);
    if (!x?.hints?.length) warnings.push(`${tag} has no hints`);
    if (!x?.solution?.length && !isStr(x?.solutionCode)) errors.push(`${tag} has no solution`);
    const c = x?.check;
    if (!c || !EX_TYPES.includes(c.type)) errors.push(`${tag} has no valid check`);
    else if (c.type === 'mcq' && (!Array.isArray(x.options) || !Number.isInteger(c.answer) || c.answer < 0 || c.answer >= x.options.length)) errors.push(`${tag} mcq answer out of range`);
    else if (c.type === 'numeric' && typeof c.answer !== 'number') errors.push(`${tag} numeric answer missing`);
    else if (c.type === 'text' && !(c.accept?.length || c.keywords?.length)) errors.push(`${tag} text check has nothing to accept`);
    else if (c.type === 'output' && (!isStr(c.expectedOutput) || !isStr(x.solutionCode))) errors.push(`${tag} output check needs expectedOutput and solutionCode`);
    else if (c.type === 'rows' && (!Array.isArray(c.rows) || !isStr(x.solutionCode))) errors.push(`${tag} rows check needs rows and solutionCode`);
  });

  (e.knowledgeCheck || []).forEach((q, i) => {
    if (!isStr(q?.question) || !Array.isArray(q.options) || !Number.isInteger(q.answer) || q.answer >= q.options.length) {
      errors.push(`${label}: knowledge check ${q?.id || i + 1} invalid`);
    }
  });
  if (!(e.knowledgeCheck || []).length) warnings.push(`${label}: no knowledge check`);
  if (!e.caseStudy) warnings.push(`${label}: no case study`);
  if (!(e.references || []).length) errors.push(`${label}: no references`);
  (e.references || []).forEach((r) => { if (!isStr(r?.title) || !/^https:\/\//.test(r?.url || '')) errors.push(`${label}: bad reference ${r?.url}`); });
  return { errors, warnings };
}
