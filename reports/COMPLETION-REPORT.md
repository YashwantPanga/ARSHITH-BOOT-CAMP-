# Completion report — content, diagrams, practice, typography and slideshow

Branch: `feat/content-diagrams-practice` (starting checkpoint: commit `3537275`).
Supporting evidence: `reports/content-validation.md`, `reports/link-check.md`, `reports/content-diff.md`.

## 1. Root causes of the empty architecture and practice sections

The reader rendered section headings when a field merely *existed*, but read only one data shape.
AI with Data Science modules 07–15 store content in a different shape from every other module:

| Field | Shape the reader expected | Shape in AI modules 07–15 | Visible symptom |
|---|---|---|---|
| `diagram` | `{ title, ascii, explanation }` | a plain ASCII **string** | empty dark-grid "Architecture & workflow" panel (`diagram.ascii` was `undefined`) |
| `practiceExercise` | `{ title, problem, solutionCode }` | `{ question, starterCode, solution }` | "Practice exercise" heading with no body |
| concepts | `sections[]` | Markdown string `theory` | concepts silently missing |
| tutorial | `tutorials[]` | Markdown string `tutorial` | silently missing |
| mini tasks | `miniTask` object | `miniTasks[]` strings | silently missing |
| summary | `{ takeaways }` | array (07–15) or string (all Web modules) | Web summaries silently dropped |

Fix (shared layer, no course-specific code): `src/utils/normalizeModule.js` maps every known variant
onto one contract without changing stored data; sections render only when there is drawable content,
and genuinely missing data now shows an explicit message instead of a blank panel.

A related finding: every in-reading question set (`mcqs`, `selfAssessment`, AI `quiz`) is
**identical to the graded module quiz** (420 questions checked). They are intentionally not shown in
the reader so the graded quiz cannot be previewed with answers; they remain stored unchanged.

## 2. Files and components changed / added

- Data contract & validation: `shared/contentSchema.js`, `shared/sampleSchema.js`, `shared/linkOverrides.js`, `src/utils/normalizeModule.js`
- Reader: `src/pages/LearningPage.jsx` (rewritten section builder), `src/components/lesson/{WorkflowDiagram,PracticeExercises,EnrichmentBlocks,Markdown}.jsx`, `src/components/CodeEditor.jsx`
- Runners: `src/utils/runners.js` (+ sandboxed JavaScript runner), `src/utils/highlight.js`
- Server: `server/app.js` (app split from `server/index.js` for testing), `server/lib/practice.js`, `server/routes/practiceRoutes.js`, `server/middleware/learnerAuth.js`, `server/routes/learnerRoutes.js` (tokens), `server/db.js` (`ARB_DB_FILE` for tests)
- Content: `server/data/enrichment/*.js` (12 files, 60 modules)
- Slideshow: `src/components/CourseSlideshow.jsx`, `src/data/courseGallery.js`, `src/pages/CourseDetailsPage.jsx`
- Typography/tokens: `index.html`, `tailwind.config.js`, `src/index.css`
- Client auth: `src/services/api.js`, `src/components/LoginModal.jsx`, `src/App.jsx`
- Display-only title casing: `src/utils/textUtils.js` (`displayTitle`)
- Tooling: `scripts/{validate-content,verify-exercises,content-diff}.mjs`, `tests/*`, `vite.config.js` (Vitest), `package.json` scripts

## 3. Database changes

No schema migration. New content lives in `server/data/enrichment/` and is served by
`GET /api/courses/:courseId/modules/:moduleId/enrichment`. `db.json` only gains new optional
collections when used: `practiceProgress` (practice completions) and `learners` / `contactMessages`
(from the previous update). A course title re-cased in the previous update ("AI with Data Science")
was **restored to the original stored value** "AI WITH DATA SCIENCE"; the UI formats ALL-CAPS names for
display only.

## 4. How original content was preserved

`scripts/content-diff.mjs` hashes, per module, the title, the entire `readingMaterial`, code examples,
the graded quiz (questions + answer keys) and in-reading question sets, plus all 275 question-bank
items, and compares them with the original `db.json` from the delivered archive. Result: **60/60
modules unchanged, 0/275 question-bank items changed**; course titles, descriptions and final tests
unchanged. The only course-level difference is the thumbnail image URL (higher-resolution images from
the previous update). `tests/content.test.js` enforces this on every test run.

## 5. Modules that received additional content

All 60 modules (Python 15, SQL 15, Web 15, AI 15). Each now has: practical skills and prerequisites,
an analogy and "why it matters", a subject-specific workflow diagram with stage inputs/outputs, a
worked example with line-by-line explanation and expected output, a real-world case study, three
graded exercises of increasing difficulty (180 total), three new knowledge-check questions (180,
none duplicating graded quiz questions), a cheat sheet, references and a "next step".

## 6. Diagrams and practice sections repaired

- Architecture: all 60 modules now show a structured SVG workflow (validated; layered layout;
  labelled branches and loops; horizontal scroll on phones; error boundary; stage table as text
  alternative). AI modules 01–15 additionally show their original ASCII diagram, now visible for
  07–15.
- Practice: original exercises render for all 60 modules (07–15 fixed); 180 new exercises
  (61 multiple-choice, 32 short-answer, 27 numerical, 36 Python/JavaScript coding, 24 SQL) with
  progressive hints, server-side checking, feedback, step-by-step solutions after an attempt, common
  mistakes, an extra challenge and completion tracking for signed-in learners.
- Code execution is in the browser only (Pyodide Web Worker with a Stop button, sql.js on a sample
  database, sandboxed iframe for JavaScript). Nothing learners type runs on the server. Practice
  results never affect quizzes or certificates.

## 7. Free educational sources used

Official documentation and open courseware only, linked per module: docs.python.org, peps.python.org,
postgresql.org, sqlite.org, developer.mozilla.org, react.dev, expressjs.com, nodejs.org, git-scm.com,
docs.github.com, numpy.org, pandas.pydata.org, matplotlib.org, seaborn.pydata.org, scikit-learn.org,
docs.scipy.org, developers.google.com (Machine Learning Crash Course), ocw.mit.edu,
introtodeeplearning.com, khanacademy.org, web.dev, developer.chrome.com, OWASP cheat sheets, IETF RFC
7519, ogp.me, fastapi.tiangolo.com, arXiv (Vaswani et al., 2017). **All 257 unique reference URLs
(original + new) were fetched and resolve**; two dead links in original content are redirected at
display time without editing the stored data. Explanations are original wording; the reader labels
links as further reading.

## 8. Typography and design

DM Sans (UI/body), DM Serif Display (headings, single weight with faux-bold disabled), JetBrains Mono
(code, ligatures off). Centralised in `tailwind.config.js` (fluid `display-*` scale) and CSS variables
in `src/index.css`; balanced heading wrapping, `text-wrap: pretty` for paragraphs, overflow-safe long
words. Colours remain the forest/sage/ivory palette.

## 9. Slideshow

Course detail pages replace the single image with an accessible carousel: the course's existing
thumbnail is always slide 1, followed by an explicit per-course image mapping (no designed flyer
posters exist in the project, so no branding is overlaid or invented). Autoplay every 5 s, pauses on
hover/focus/hidden tab and via a pause button, no autoplay for reduced-motion users, ←/→ keys,
previous/next and indicator buttons, fixed 16:10 ratio (no layout shift), only adjacent slides load,
image-error fallback, and a styled course card for unmapped courses.

## 10. Responsive layout

Automated audit rendered 11 routes at 360, 390, 768, 1024, 1440 and 1920 px (66 combinations) plus
the module reader for three modules at all six widths (18): **no horizontal overflow** anywhere.
Code blocks, diagrams and tables scroll inside their own containers; nested card padding reduced on
phones.

## 11. Security and performance

- Learner-owned endpoints (quiz submit/attempts, final start/submit/attempts, progress, enrollment,
  certificate issue, practice progress) now require a signed learner token whose subject must match
  the `userId` — previously anyone could act for any email. Admin auth is unchanged.
- Practice answers/solutions are never in public payloads; solutions arrive only in the grading
  response.
- Markdown renders as React elements (no raw HTML); math via KaTeX with `trust: false`.
- Enrichment loads per module with abort-on-navigation and one retry; no caching of lessons or progress.

## 12. Tests executed (real results)

- `npm test` → **5 files, 54 tests, all passed** (schema/diagram validation for empty, malformed,
  missing and valid data; normaliser on all 60 real modules; grading; public-payload leakage; API +
  auth on a throw-away DB copy incl. unauthenticated visitor and non-admin edit attempts;
  component tests incl. empty exercise list, failed request preserving the answer, hints, slideshow
  navigation, Markdown safety; content preservation; exercise verifier).
- `npm run verify:exercises` → **112/112 runnable solutions and worked examples produce exactly their
  stated output** (Python 3.11 + NumPy/pandas/Matplotlib, sql.js, Node.js). It caught and I corrected
  five wrong expected values while authoring.
- `npm run validate:content` → 60 modules, 0 errors, 0 warnings. `npm run validate:links` → 257/257 reachable.
- `npm run build` → succeeds.
- Manual browser checks: AI Module 07 renders all 14 sections; a Python exercise ran in Pyodide and
  was graded correct and recorded; JavaScript async exercise and SQL window-function exercise ran and
  graded; wrong text answers rejected; certificate PNG/PDF export re-checked with the new fonts.
- No linter or type checker is configured in this project, so none was run.

## 13. Remaining issues and limitations

- **The project lives in `%TEMP%`. Windows temp cleanup deleted 28 untouched files during this work**
  (restored from Git). Move the project to a permanent folder.
- The SQL Practice Lab uses SQLite; a few PostgreSQL-only examples in original content will not run there (noted in the lab).
- Python/SQL runtimes load from public CDNs on first use (internet required).
- Practice completion for code exercises relies on output produced in the learner's browser; it is
  recorded as practice only and never counts toward certification.
- Existing signed-in learners must sign in once more (tokens are new).
- Set `JWT_SECRET` for any real deployment.

## 14. Run locally

```
npm install
npm run app          # builds and serves on http://localhost:5000
npm test             # 54 tests
npm run validate:links
```
