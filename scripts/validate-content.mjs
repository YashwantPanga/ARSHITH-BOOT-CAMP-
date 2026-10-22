// Inventories every course/module and flags content problems.
//   node scripts/validate-content.mjs           → reports/content-validation.md (exit 1 on errors)
//   node scripts/validate-content.mjs --links   → also checks every reference URL → reports/link-check.md
//
// Required per module: learning objectives, an architecture/workflow diagram, practice, a summary
// and references. Optional (reported, not errors): terminology, tutorials, case study, knowledge check.
// The script never invents content to make a check pass.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { validateEnrichment, validateDiagram } from '../shared/contentSchema.js';
import { normalizeModule } from '../src/utils/normalizeModule.js';
import { COURSE_GALLERY } from '../src/data/courseGallery.js';
import { resolveLink } from '../shared/linkOverrides.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'data', 'db.json'), 'utf8'));
const norm = (s) => String(s || '').trim().toLowerCase();

export function validateCatalogue() {
  const rows = [];
  const errors = [];
  const warnings = [];
  const seenIds = new Map();

  for (const c of db.courses || []) {
    if (!c.title || !c.description) errors.push(`${c.id}: course is missing title or description`);
    if (!c.thumbnail) warnings.push(`${c.id}: course has no thumbnail image`);
    if (!COURSE_GALLERY[c.id]) warnings.push(`${c.id}: no slideshow image mapping (only the thumbnail will show)`);

    for (const m of c.modules || []) {
      const key = `${c.id}/${m.id}`;
      if (seenIds.has(m.id)) errors.push(`${key}: duplicate module id (also in ${seenIds.get(m.id)})`);
      seenIds.set(m.id, c.id);
      if (!m.title) errors.push(`${key}: module has no title`);

      const nm = normalizeModule(m);
      const e = ENRICHMENT[c.id]?.[m.id];
      const v = validateEnrichment(e, key);
      v.errors.forEach(x => errors.push(x));
      v.warnings.forEach(x => warnings.push(x));
      if (e?.workflow && !validateDiagram(e.workflow).ok) errors.push(`${key}: invalid workflow diagram`);

      const rawDiagram = m.readingMaterial?.diagram;
      if (rawDiagram && !nm.diagram) errors.push(`${key}: stored diagram exists but contains no drawable content`);

      const graded = new Set([...(m.quiz?.questions || []), ...(db.questionBank || []).filter(q => q.moduleId === m.id)].map(q => norm(q.questionText || q.question)));
      const rmQs = [...(m.readingMaterial?.mcqs || []), ...(m.readingMaterial?.selfAssessment?.questions || []), ...(m.readingMaterial?.quiz || [])];
      const duplicatesOfGraded = rmQs.filter(q => graded.has(norm(q.questionText || q.question))).length;

      const has = {
        objectives: nm.objectives.length > 0,
        architecture: !!nm.diagram || !!e?.workflow,
        practice: !!nm.practiceExercise || (e?.exercises?.length || 0) > 0,
        summary: nm.summary.takeaways.length > 0 || !!nm.summary.text || (e?.cheatSheet?.length || 0) > 0,
        references: nm.references.length > 0 || (e?.references?.length || 0) > 0,
        concepts: nm.sections.length > 0 || !!nm.theoryMarkdown,
        caseStudy: !!e?.caseStudy,
        knowledgeCheck: (e?.knowledgeCheck?.length || 0) > 0
      };
      for (const req of ['objectives', 'architecture', 'practice', 'summary', 'references', 'concepts']) {
        if (!has[req]) errors.push(`${key}: missing required ${req}`);
      }
      rows.push({
        key, title: m.title, ...has,
        exercises: e?.exercises?.length || 0,
        originalShape: rawDiagram && typeof rawDiagram === 'string' ? 'string diagram (normalised)' : (m.readingMaterial?.theory ? 'markdown theory (normalised)' : 'standard'),
        hiddenGradedDuplicates: duplicatesOfGraded
      });
    }
  }
  return { rows, errors, warnings };
}

async function checkLinks() {
  const urls = new Map();
  for (const c of db.courses || []) for (const m of c.modules || []) {
    for (const r of m.readingMaterial?.references || []) if (r?.url) urls.set(resolveLink(r.url), [...(urls.get(r.url) || []), `${c.id}/${m.id} (original)`]);
    for (const r of ENRICHMENT[c.id]?.[m.id]?.references || []) urls.set(r.url, [...(urls.get(r.url) || []), `${c.id}/${m.id}`]);
  }
  const list = [...urls.keys()];
  const results = [];
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const url = list[i++];
      let status = 0;
      let note = '';
      for (const method of ['HEAD', 'GET']) {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 15000);
          const res = await fetch(url, { method, redirect: 'follow', signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (link-check; Arshith Bootcamp content validation)' } });
          clearTimeout(t);
          status = res.status;
          if (res.ok) break;
        } catch (err) { note = String(err.cause?.code || err.name || err.message); }
      }
      results.push({ url, status, note, usedBy: urls.get(url) });
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return results.sort((a, b) => a.url.localeCompare(b.url));
}

if (process.argv[1] && process.argv[1].endsWith('validate-content.mjs')) {
  const { rows, errors, warnings } = validateCatalogue();
  const yes = (b) => (b ? '✓' : '—');
  const md = [
    '# Content validation report', '', `Generated: ${new Date().toISOString()}`, '',
    `- Courses: ${db.courses.length} · Modules: ${rows.length}`,
    `- Errors: **${errors.length}** · Warnings: **${warnings.length}**`, '',
    'Required per module: objectives, concepts, architecture/workflow, practice, summary, references. Optional: case study, knowledge check.', '',
    '"Hidden graded duplicates" counts in-reading questions (`mcqs`, `selfAssessment`, `quiz`) that are identical to a graded quiz question. They are intentionally not displayed in the reader so the graded quiz is not leaked; they remain stored unchanged.', '',
    '| Module | Objectives | Concepts | Architecture | Practice (new exercises) | Summary | References | Case study | Knowledge check | Stored shape | Hidden graded duplicates |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map(r => `| ${r.key} | ${yes(r.objectives)} | ${yes(r.concepts)} | ${yes(r.architecture)} | ${yes(r.practice)} (${r.exercises}) | ${yes(r.summary)} | ${yes(r.references)} | ${yes(r.caseStudy)} | ${yes(r.knowledgeCheck)} | ${r.originalShape} | ${r.hiddenGradedDuplicates} |`),
    '', '## Errors', '', ...(errors.length ? errors.map(e => `- ${e}`) : ['None.']),
    '', '## Warnings', '', ...(warnings.length ? warnings.map(e => `- ${e}`) : ['None.']), ''
  ].join('\n');
  fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'reports', 'content-validation.md'), md);
  console.log(`Modules: ${rows.length}, errors: ${errors.length}, warnings: ${warnings.length}`);
  errors.slice(0, 20).forEach(e => console.log('ERROR', e));

  let linkFailures = 0;
  if (process.argv.includes('--links')) {
    const links = await checkLinks();
    const bad = links.filter(l => !(l.status >= 200 && l.status < 400));
    linkFailures = bad.length;
    const lmd = [
      '# Reference link check', '', `Generated: ${new Date().toISOString()}`, '',
      `Checked **${links.length}** unique URLs: **${links.length - bad.length}** reachable, **${bad.length}** failed.`, '',
      'Some sites reject automated requests (HTTP 403/429) even though the page exists in a browser; those are listed so they can be checked by hand.', '',
      '| Status | URL | Used by |', '|---|---|---|',
      ...links.map(l => `| ${l.status || 'ERR ' + l.note} | ${l.url} | ${[...new Set(l.usedBy)].slice(0, 3).join(', ')}${l.usedBy.length > 3 ? ' …' : ''} |`), ''
    ].join('\n');
    fs.writeFileSync(path.join(ROOT, 'reports', 'link-check.md'), lmd);
    console.log(`Links: ${links.length} checked, ${bad.length} failed`);
    bad.forEach(l => console.log('LINK', l.status || l.note, l.url));
  }
  process.exit(errors.length ? 1 : 0);
}
