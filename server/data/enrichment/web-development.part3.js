// Additional learning content for Web Development, modules 11–15.
const MDN = 'MDN Web Docs (Mozilla)';
const REACT = 'React team (Meta Open Source)';

export default {
  'web-mod-11': {
    skills: ['Think of UI as a function of state', 'Compose components and pass data with props', 'Render lists with stable keys'],
    prerequisites: ['JavaScript array methods and modules (Modules 07–09)'],
    intuition: {
      analogy: 'A React component is a recipe card: given ingredients (props and state) it always describes the same dish (UI). When an ingredient changes, React re-reads the recipe and only swaps the parts of the plate that actually changed.',
      whyItMatters: 'Manually keeping the DOM in sync with data becomes error-prone as apps grow. React\'s declarative model removes a whole class of "the screen shows old data" bugs.'
    },
    workflow: {
      title: 'React render cycle',
      nodes: [
        { id: 'event', label: 'Event', detail: 'User clicks, data arrives.', input: 'Interaction', output: 'setState call' },
        { id: 'state', label: 'State update', detail: 'setCount(c => c + 1) schedules a re-render.', input: 'New value', output: 'Pending render' },
        { id: 'render', label: 'Render', detail: 'Component functions run and return JSX (a description).', input: 'Props + state', output: 'New element tree' },
        { id: 'diff', label: 'Reconcile', detail: 'Compare with the previous tree; keys match list items.', input: 'Old vs new tree', output: 'Minimal changes' },
        { id: 'commit', label: 'Commit to DOM', detail: 'Apply the changes; run effects afterwards.', input: 'Changes', output: 'Updated screen' }
      ],
      edges: [{ from: 'event', to: 'state' }, { from: 'state', to: 'render' }, { from: 'render', to: 'diff' }, { from: 'diff', to: 'commit' }, { from: 'commit', to: 'event', label: 'next interaction' }],
      explanation: 'Rendering must be pure (no side effects); side effects belong in event handlers or effects (Module 12).'
    },
    workedExample: {
      title: 'Props, state and a keyed list',
      language: 'jsx',
      code: "import { useState } from 'react';\n\nfunction CourseCard({ title, modules }) {\n  return <li>{title} — {modules} modules</li>;\n}\n\nexport default function CourseList({ courses }) {\n  const [onlyLong, setOnlyLong] = useState(false);\n  const shown = onlyLong ? courses.filter(c => c.modules >= 15) : courses;\n  return (\n    <section>\n      <label>\n        <input type=\"checkbox\" checked={onlyLong} onChange={e => setOnlyLong(e.target.checked)} />\n        Only 15+ modules\n      </label>\n      <ul>{shown.map(c => <CourseCard key={c.id} title={c.title} modules={c.modules} />)}</ul>\n    </section>\n  );\n}",
      lineByLine: [
        { line: 3, explanation: 'A component is a function that receives props as an object (destructured here).' },
        { line: 9, explanation: 'Local state; setOnlyLong triggers a re-render.' },
        { line: 10, explanation: 'Derived data is computed during render, not stored in extra state.' },
        { line: 14, explanation: 'A controlled input: its value comes from state.' },
        { line: 17, explanation: 'key={c.id} gives React a stable identity for each item.' }
      ],
      expectedResult: 'Ticking the checkbox hides courses with fewer than 15 modules; unticking shows them again without reloading.',
      edgeCases: ['Using the array index as key breaks state when items are reordered or removed.', 'Mutating state (courses.push(x)) does not trigger a render — create a new array instead.']
    },
    caseStudy: {
      title: 'Turning a jQuery widget into components',
      problem: 'A course filter widget written with jQuery had duplicated DOM-update code for every filter, and bugs appeared when filters were combined.',
      data: 'Filters: level, duration, category; a list of 60 courses.',
      steps: ['Model filters as one state object.', 'Compute the visible list from state in render.', 'Split the UI into FilterBar and CourseCard components with props.'],
      result: 'Combining filters "just works" because the list is always derived from the current state.',
      limitations: 'Server-side filtering is still needed when the course list is large.'
    },
    exercises: [
      {
        id: 'web11-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Keys in lists',
        objective: 'Choose a good key.',
        problem: 'Which is the best key for rendering a list of enrolled students that can be sorted and filtered?',
        options: ['The array index', 'Math.random()', 'The student\'s database id', 'The student\'s name'],
        hints: ['Keys must be stable and unique among siblings.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['A database id is unique and does not change when the list is reordered.', 'Indexes change on sort; random keys change every render; names may repeat.'],
        explanation: 'Unstable keys make React re-create components and lose their state (e.g. typed input).',
        mistakes: ['Using the index for dynamic lists.'],
        challenge: 'What warning does React show when keys are missing?'
      },
      {
        id: 'web11-e2', type: 'Short answer', difficulty: 'Beginner',
        title: 'JSX attribute names',
        objective: 'Know JSX differences from HTML.',
        problem: 'In JSX, which attribute name replaces HTML\'s class?',
        hints: ['class is a reserved word in JavaScript.'],
        check: { type: 'text', accept: ['className'] },
        solution: ['Use className="card" in JSX.'],
        explanation: 'Similarly, for becomes htmlFor, and event handlers use camelCase (onClick).',
        mistakes: ['Writing class, which React warns about.'],
        challenge: 'Convert <label for="email" class="lbl"> to JSX.'
      },
      {
        id: 'web11-e3', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Updating state correctly',
        objective: 'Avoid state mutation.',
        problem: 'items is a state array. Which line correctly adds newItem?',
        options: ['items.push(newItem)', 'setItems(items.push(newItem))', 'setItems([...items, newItem])', 'items = [...items, newItem]'],
        hints: ['State must be replaced with a new value through its setter.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Spreading creates a new array; passing it to setItems triggers a render.', 'push mutates and returns a number, not an array.'],
        explanation: 'React compares references; a mutated array is the same reference, so React may skip the update.',
        mistakes: ['Mutating state directly.'],
        challenge: 'Remove the item with id 3 immutably (filter).'
      }
    ],
    knowledgeCheck: [
      { id: 'web11-k1', question: 'Props are…', options: ['Mutable by the child', 'Read-only inputs passed from the parent', 'Global variables', 'CSS classes'], answer: 1, explanation: 'Children must not modify props; they can call callbacks passed as props.' },
      { id: 'web11-k2', question: 'What does a component return?', options: ['HTML strings', 'A description of UI (React elements)', 'DOM nodes', 'Promises'], answer: 1, explanation: 'JSX compiles to React element objects.' },
      { id: 'web11-k3', question: 'Where should data derived from props be computed?', options: ['In extra state synced with useEffect', 'During render', 'In localStorage', 'In the DOM'], answer: 1, explanation: 'Computing during render avoids out-of-sync state.' }
    ],
    cheatSheet: ['function C({ prop }) { return <div>{prop}</div>; }', 'const [v, setV] = useState(initial)', 'list.map(x => <Item key={x.id} {...x} />)', 'className, htmlFor, onClick, onChange'],
    references: [
      { title: 'React — Describing the UI', url: 'https://react.dev/learn/describing-the-ui', publisher: REACT },
      { title: 'React — Rendering Lists (keys)', url: 'https://react.dev/learn/rendering-lists', publisher: REACT },
      { title: 'React — State: A Component\'s Memory', url: 'https://react.dev/learn/state-a-components-memory', publisher: REACT }
    ],
    next: 'Module 12 adds effects, refs, context and client-side routing.'
  },

  'web-mod-12': {
    skills: ['Synchronise with external systems using useEffect and cleanup', 'Share data with Context and access DOM nodes with useRef', 'Build multi-page navigation with React Router'],
    prerequisites: ['React fundamentals (Module 11)'],
    intuition: {
      analogy: 'useEffect is a "while this screen is open, keep this connection running" note: subscribe when the component appears, update when its dependencies change, and hang up (cleanup) when it leaves.',
      whyItMatters: 'Data fetching, timers, subscriptions and analytics all live outside React. Effects with correct dependencies and cleanups prevent memory leaks and stale data.'
    },
    workflow: {
      title: 'Effect lifecycle',
      nodes: [
        { id: 'mount', label: 'Component mounts', detail: 'First render is committed to the DOM.', input: 'Initial props', output: 'Screen shown' },
        { id: 'run', label: 'Effect runs', detail: 'Start fetch / subscription / timer.', input: 'Dependencies', output: 'Running side effect' },
        { id: 'change', label: 'Dependency changes', detail: 'e.g. courseId prop changes.', input: 'New props/state', output: 'Re-render' },
        { id: 'cleanup', label: 'Cleanup', detail: 'Abort fetch, unsubscribe, clear timer.', input: 'Previous effect', output: 'Old work stopped' },
        { id: 'unmount', label: 'Unmount', detail: 'Final cleanup when the component is removed.', input: 'Navigation away', output: 'No leaks' }
      ],
      edges: [{ from: 'mount', to: 'run' }, { from: 'run', to: 'change' }, { from: 'change', to: 'cleanup' }, { from: 'cleanup', to: 'run', label: 'with new deps' }, { from: 'run', to: 'unmount' }],
      explanation: 'Cleanup runs before the next effect and on unmount, so a slow response for an old courseId can never overwrite the data for the new one.'
    },
    workedExample: {
      title: 'Fetching with abort-on-change',
      language: 'jsx',
      code: "import { useEffect, useState } from 'react';\nimport { useParams } from 'react-router-dom';\n\nexport default function CoursePage() {\n  const { courseId } = useParams();\n  const [state, setState] = useState({ status: 'loading' });\n\n  useEffect(() => {\n    const ctrl = new AbortController();\n    setState({ status: 'loading' });\n    fetch(`/api/courses/${courseId}`, { signal: ctrl.signal })\n      .then(r => (r.ok ? r.json() : Promise.reject(new Error(r.status))))\n      .then(data => setState({ status: 'ok', course: data.course }))\n      .catch(err => { if (err.name !== 'AbortError') setState({ status: 'error' }); });\n    return () => ctrl.abort();\n  }, [courseId]);\n\n  if (state.status === 'loading') return <p>Loading…</p>;\n  if (state.status === 'error') return <p role=\"alert\">Could not load the course.</p>;\n  return <h1>{state.course.title}</h1>;\n}",
      lineByLine: [
        { line: 5, explanation: 'useParams reads :courseId from the URL defined by the route.' },
        { line: 9, explanation: 'An AbortController lets the cleanup cancel the request.' },
        { line: 12, explanation: 'Treat non-2xx responses as errors.' },
        { line: 15, explanation: 'Cleanup aborts the previous request when courseId changes or the page unmounts.' },
        { line: 16, explanation: 'The effect re-runs only when courseId changes.' }
      ],
      expectedResult: 'Navigating quickly between two courses always shows the course you ended on, with a loading state and an accessible error message on failure.',
      edgeCases: ['An empty dependency array [] means "run once after mount" — reading changing props inside it gives stale values.', 'In development, React StrictMode runs effects twice to surface missing cleanups.']
    },
    caseStudy: {
      title: 'Stale lesson content after fast navigation',
      problem: 'Learners clicking quickly through modules sometimes saw the previous module\'s text under the new title.',
      data: 'A useEffect that fetched lesson content without cleanup.',
      steps: ['Reproduce with network throttling in DevTools.', 'Add an AbortController and abort in the cleanup.', 'Include moduleId in the dependency array.'],
      result: 'Out-of-order responses are discarded and the displayed content always matches the selected module.',
      limitations: 'Data-fetching libraries (React Query, SWR) add caching and retries if the app grows.'
    },
    exercises: [
      {
        id: 'web12-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Dependency arrays',
        objective: 'Predict when an effect runs.',
        problem: 'useEffect(fn, [userId]) runs…',
        options: ['On every render', 'Only once ever', 'After the first render and whenever userId changes', 'Never'],
        hints: ['The array lists the values the effect depends on.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Effects run after the first commit and again when any dependency changes (compared with Object.is).'],
        explanation: 'No array → every render; [] → only after mount.',
        mistakes: ['Leaving out dependencies to "avoid loops", which creates stale data bugs.'],
        challenge: 'Why does putting an object literal in the dependency array re-run the effect every time?'
      },
      {
        id: 'web12-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Clean up a timer',
        objective: 'Write an effect cleanup.',
        problem: 'An effect starts const id = setInterval(tick, 1000). What should its cleanup function call? (one function call)',
        hints: ['The counterpart of setInterval.'],
        check: { type: 'text', accept: ['clearInterval(id)', 'clearinterval(id)', 'clearInterval'] },
        solution: ['return () => clearInterval(id);'],
        explanation: 'Without cleanup, each mount adds another interval that keeps running after the component disappears.',
        mistakes: ['Calling clearTimeout on an interval id (works in browsers but is confusing).'],
        challenge: 'Write a useInterval custom hook.'
      },
      {
        id: 'web12-e3', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Route parameters',
        objective: 'Read dynamic segments in React Router.',
        problem: 'With <Route path="/learn/:courseId/:moduleId" element={<Lesson />} />, how does Lesson read moduleId?',
        options: ['props.moduleId', 'const { moduleId } = useParams()', 'window.moduleId', 'useState(moduleId)'],
        hints: ['React Router provides a hook for URL parameters.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['useParams returns an object of the dynamic segments as strings.'],
        explanation: 'Use useSearchParams for ?query values.',
        mistakes: ['Expecting route params as props.'],
        challenge: 'Navigate programmatically to the next module with useNavigate.'
      }
    ],
    knowledgeCheck: [
      { id: 'web12-k1', question: 'Changing a ref (ref.current = x)…', options: ['Triggers a re-render', 'Does not trigger a re-render', 'Throws an error', 'Resets state'], answer: 1, explanation: 'Refs hold mutable values without rendering.' },
      { id: 'web12-k2', question: 'What problem does Context solve?', options: ['Styling', 'Passing data deeply without prop drilling', 'Routing', 'Testing'], answer: 1, explanation: 'Values such as the signed-in user or theme are provided once and read anywhere below.' },
      { id: 'web12-k3', question: 'Which component renders a client-side navigation link in React Router?', options: ['<a href>', '<Link to>', '<Route>', '<Nav>'], answer: 1, explanation: 'Link updates the URL without a full page reload.' }
    ],
    cheatSheet: ['useEffect(() => { …; return cleanup; }, [deps])', 'const ref = useRef(null); <input ref={ref} />', 'createContext / <Ctx.Provider value> / useContext(Ctx)', 'useParams, useNavigate, <Link to>'],
    references: [
      { title: 'React — Synchronizing with Effects', url: 'https://react.dev/learn/synchronizing-with-effects', publisher: REACT },
      { title: 'React — Passing Data Deeply with Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', publisher: REACT },
      { title: 'React — You Might Not Need an Effect', url: 'https://react.dev/learn/you-might-not-need-an-effect', publisher: REACT },
      { title: 'AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController', publisher: MDN }
    ],
    next: 'Module 13 builds the server side with Node.js and Express.'
  },

  'web-mod-13': {
    skills: ['Explain Node\'s event-driven, non-blocking model', 'Compose an Express middleware pipeline', 'Design RESTful routes and status codes'],
    prerequisites: ['JavaScript async (Module 09)', 'HTTP basics (Module 01)'],
    intuition: {
      analogy: 'An Express app is an airport security line: each middleware is a checkpoint (logging, body parsing, authentication). A passenger either moves on with next() or is turned back with a response — and only those who pass every checkpoint reach the gate (the route handler).',
      whyItMatters: 'Most web back-ends — including this platform\'s API — are a stack of small middleware functions. Understanding the order explains authentication bugs and missing request bodies.'
    },
    workflow: {
      title: 'Express request pipeline',
      nodes: [
        { id: 'req', label: 'HTTP request', detail: 'POST /api/enrollment', input: 'Client', output: 'req, res objects' },
        { id: 'log', label: 'Logger middleware', detail: 'Records method and URL, then next().', input: 'req', output: 'Logged request' },
        { id: 'json', label: 'express.json()', detail: 'Parses the JSON body into req.body.', input: 'Raw body', output: 'req.body object' },
        { id: 'auth', label: 'Auth middleware', detail: 'Verifies the token; 401 if missing/invalid.', input: 'Headers', output: 'req.user or 401' },
        { id: 'route', label: 'Route handler', detail: 'Validates input, talks to the database, sends JSON.', input: 'req.user, req.body', output: '201 / 400 / 409 response' },
        { id: 'err', label: 'Error handler', detail: '(err, req, res, next) → 500 with a safe message.', input: 'Thrown error', output: 'Error response' }
      ],
      edges: [{ from: 'req', to: 'log' }, { from: 'log', to: 'json' }, { from: 'json', to: 'auth' }, { from: 'auth', to: 'route', label: 'valid' }, { from: 'route', to: 'err', label: 'throws' }],
      explanation: 'Order matters: a route registered before express.json() sees req.body as undefined, and one registered before the auth middleware is unprotected.'
    },
    workedExample: {
      title: 'Simulating a middleware chain in plain JavaScript',
      language: 'javascript',
      code: "function run(middlewares, req) {\n  const res = { statusCode: 200, send(body) { console.log(this.statusCode + ' ' + body); } };\n  let i = 0;\n  const next = () => { const mw = middlewares[i++]; if (mw) mw(req, res, next); };\n  next();\n}\n\nconst logger = (req, res, next) => { console.log('LOG ' + req.method + ' ' + req.url); next(); };\nconst auth = (req, res, next) => {\n  if (!req.token) { res.statusCode = 401; return res.send('unauthorized'); }\n  next();\n};\nconst handler = (req, res) => res.send('enrolled in ' + req.body.courseId);\n\nrun([logger, auth, handler], { method: 'POST', url: '/api/enrollment', token: 'abc', body: { courseId: 'sql' } });\nrun([logger, auth, handler], { method: 'POST', url: '/api/enrollment', body: { courseId: 'sql' } });",
      lineByLine: [
        { line: 4, explanation: 'next() calls the following middleware — the same contract Express uses.' },
        { line: 9, explanation: 'Returning a response without calling next() stops the chain.' },
        { line: 15, explanation: 'With a token, all three run.' },
        { line: 16, explanation: 'Without a token, auth answers 401 and the handler never runs.' }
      ],
      expectedOutput: 'LOG POST /api/enrollment\n200 enrolled in sql\nLOG POST /api/enrollment\n401 unauthorized',
      edgeCases: ['Forgetting to call next() or send a response leaves the request hanging until it times out.', 'Async errors in Express 4 must be passed to next(err); Express 5 forwards rejected promises automatically.']
    },
    caseStudy: {
      title: 'Designing the enrollment API',
      problem: 'The platform must allow exactly one course per learner and report clear errors to the front end.',
      data: 'Learner token, courseId, existing enrolments.',
      steps: ['POST /api/enrollment with JSON { courseId }.', 'Auth middleware resolves the learner from the token.', 'Return 404 if the course does not exist, 409 if already enrolled in another course, 200 on success.', 'Log every enrolment for auditing.'],
      result: 'The front end can show precise messages because each failure has its own status code.',
      limitations: 'A file-based JSON database (like this project\'s db.json) is fine for small deployments; production systems use a transactional database.'
    },
    exercises: [
      {
        id: 'web13-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Status code for validation errors',
        objective: 'Map API outcomes to status codes.',
        problem: 'The client sends POST /api/students with an invalid email. Which status should the API return?',
        options: ['200 OK', '201 Created', '400 Bad Request', '500 Internal Server Error'],
        hints: ['The client sent data the server cannot accept.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['400 (or 422) signals a client-side validation problem; include a message explaining which field is wrong.'],
        explanation: '500 should be reserved for unexpected server failures.',
        mistakes: ['Returning 200 with { success: false }, which hides errors from monitoring tools.'],
        challenge: 'Which status fits "email already registered"? (409 Conflict)'
      },
      {
        id: 'web13-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Parse JSON bodies',
        objective: 'Know the built-in body parser.',
        problem: 'Which built-in Express middleware call makes req.body available for JSON requests? (write the call)',
        hints: ['app.use(express.____())'],
        check: { type: 'text', accept: ['express.json()', 'app.use(express.json())', 'express.json'] },
        solution: ['app.use(express.json()); parses application/json bodies into req.body.'],
        explanation: 'Set a size limit (express.json({ limit: "1mb" })) to protect the server from huge payloads.',
        mistakes: ['Installing body-parser for JSON; it is built into Express 4.16+.'],
        challenge: 'Which middleware parses HTML form posts? (express.urlencoded())'
      },
      {
        id: 'web13-e3', type: 'JavaScript coding', difficulty: 'Advanced', language: 'javascript',
        title: 'Add a rate-limit middleware',
        objective: 'Write middleware that can stop the chain.',
        problem: 'Using the run() helper, write rateLimit that allows at most 2 requests per ip and answers 429 "too many requests" afterwards. Expected:\n200 ok\n200 ok\n429 too many requests\n200 ok',
        starterCode: "function run(middlewares, req) {\n  const res = { statusCode: 200, send(body) { console.log(this.statusCode + ' ' + body); } };\n  let i = 0;\n  const next = () => { const mw = middlewares[i++]; if (mw) mw(req, res, next); };\n  next();\n}\n\nconst hits = new Map();\nconst rateLimit = (req, res, next) => {\n  // count requests per req.ip; block after 2\n};\nconst handler = (req, res) => res.send('ok');\n\nfor (const ip of ['1.1.1.1', '1.1.1.1', '1.1.1.1', '2.2.2.2']) run([rateLimit, handler], { ip });",
        hints: ['const n = (hits.get(req.ip) || 0) + 1; hits.set(req.ip, n);', 'if (n > 2) { res.statusCode = 429; return res.send("too many requests"); }'],
        check: { type: 'output', expectedOutput: '200 ok\n200 ok\n429 too many requests\n200 ok' },
        solutionCode: "function run(middlewares, req) {\n  const res = { statusCode: 200, send(body) { console.log(this.statusCode + ' ' + body); } };\n  let i = 0;\n  const next = () => { const mw = middlewares[i++]; if (mw) mw(req, res, next); };\n  next();\n}\n\nconst hits = new Map();\nconst rateLimit = (req, res, next) => {\n  const n = (hits.get(req.ip) || 0) + 1;\n  hits.set(req.ip, n);\n  if (n > 2) {\n    res.statusCode = 429;\n    return res.send('too many requests');\n  }\n  next();\n};\nconst handler = (req, res) => res.send('ok');\n\nfor (const ip of ['1.1.1.1', '1.1.1.1', '1.1.1.1', '2.2.2.2']) run([rateLimit, handler], { ip });",
        solution: ['Count requests per IP in a Map.', 'Respond with 429 and do not call next() once the limit is exceeded.', 'A different IP has its own counter.'],
        explanation: 'Real rate limiters also reset counts after a time window and store counters in a shared store (e.g. Redis) when there are several servers.',
        mistakes: ['Calling next() after sending the 429 response, which runs the handler too.'],
        challenge: 'Reset each IP\'s count after 60 seconds.'
      }
    ],
    knowledgeCheck: [
      { id: 'web13-k1', question: 'Why is Node.js efficient for I/O-heavy servers?', options: ['It uses many threads per request', 'Non-blocking I/O with an event loop (libuv)', 'It compiles to C', 'It caches everything'], answer: 1, explanation: 'While waiting for I/O, the single JS thread serves other requests.' },
      { id: 'web13-k2', question: 'Which REST route best updates part of student 42?', options: ['POST /updateStudent?id=42', 'PATCH /students/42', 'GET /students/42/update', 'PUT /students'], answer: 1, explanation: 'PATCH for partial updates on a resource URL.' },
      { id: 'web13-k3', question: 'An Express error-handling middleware has how many parameters?', options: ['2', '3', '4', '5'], answer: 2, explanation: '(err, req, res, next) — Express recognises it by its arity.' }
    ],
    cheatSheet: ['app.use(mw) — order matters', 'router.get/post/patch/delete(path, handler)', 'res.status(201).json(obj)', 'app.use((err, req, res, next) => …)'],
    references: [
      { title: 'Express — Using middleware', url: 'https://expressjs.com/en/guide/using-middleware.html', publisher: 'Express.js (OpenJS Foundation)' },
      { title: 'Express — Error handling', url: 'https://expressjs.com/en/guide/error-handling.html', publisher: 'Express.js (OpenJS Foundation)' },
      { title: 'Node.js — Introduction to Node.js', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', publisher: 'OpenJS Foundation' }
    ],
    next: 'Module 14 connects the API to a database, adds authentication and deploys it.'
  },

  'web-mod-14': {
    skills: ['Store passwords safely with bcrypt', 'Issue and verify JWTs for stateless authentication', 'Prevent SQL injection and plan a deployment'],
    prerequisites: ['Express (Module 13)', 'Basic SQL'],
    intuition: {
      analogy: 'Hashing a password is like putting it through a paper shredder that always shreds the same input into the same pattern: you can check whether a new password produces the same shreds, but you cannot reassemble the original. A JWT is a tamper-evident wristband: anyone can read it, but only the event organiser can issue a valid one.',
      whyItMatters: 'Authentication mistakes leak users\' passwords and data. Most breaches exploit basic issues — plain-text passwords, injectable queries, secrets in source code.'
    },
    workflow: {
      title: 'Sign-up, login and authenticated request',
      nodes: [
        { id: 'signup', label: 'Sign up', detail: 'bcrypt.hash(password, 10) → store only the hash.', input: 'Email + password', output: 'User row with hash' },
        { id: 'login', label: 'Log in', detail: 'bcrypt.compare(password, hash).', input: 'Credentials', output: 'Valid / invalid' },
        { id: 'issue', label: 'Issue JWT', detail: 'jwt.sign({ sub, role }, SECRET, { expiresIn })', input: 'Valid user', output: 'Signed token' },
        { id: 'request', label: 'Authenticated request', detail: 'Client sends the token in a header.', input: 'Token', output: 'Request with credentials' },
        { id: 'verify', label: 'Verify middleware', detail: 'jwt.verify checks signature and expiry.', input: 'Token', output: 'req.user or 401' },
        { id: 'db', label: 'Parameterised query', detail: 'SELECT … WHERE id = $1', input: 'req.user.id', output: 'User\'s own data' }
      ],
      edges: [{ from: 'signup', to: 'login' }, { from: 'login', to: 'issue', label: 'valid' }, { from: 'issue', to: 'request' }, { from: 'request', to: 'verify' }, { from: 'verify', to: 'db', label: 'valid' }],
      explanation: 'The server never stores the password, and every protected request is re-verified from the token\'s signature rather than trusting an id sent by the client.'
    },
    workedExample: {
      title: 'Reading (not verifying!) a JWT payload',
      language: 'javascript',
      code: "const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhc2hhQGV4YW1wbGUuY29tIiwicm9sZSI6ImxlYXJuZXIiLCJleHAiOjE3NjcyMjU2MDB9.signature';\nconst [header, payload] = token.split('.').slice(0, 2).map(part => {\n  const b64 = part.replace(/-/g, '+').replace(/_/g, '/');\n  return JSON.parse(atob(b64));\n});\nconsole.log(token.split('.').length);\nconsole.log(header.alg);\nconsole.log(payload.sub, payload.role);\nconsole.log(new Date(payload.exp * 1000).toISOString());",
      lineByLine: [
        { line: 1, explanation: 'A JWT has three base64url parts: header.payload.signature.' },
        { line: 3, explanation: 'Convert base64url to standard base64 before decoding.' },
        { line: 4, explanation: 'The header and payload are plain JSON — anyone can read them.' },
        { line: 9, explanation: 'exp is in seconds since 1970; this token expires on 1 January 2026.' }
      ],
      expectedOutput: '3\nHS256\nasha@example.com learner\n2026-01-01T00:00:00.000Z',
      edgeCases: ['Never put secrets or personal data in a JWT payload — it is encoded, not encrypted.', 'Decoding is not verifying: always call jwt.verify with the secret on the server before trusting claims.']
    },
    caseStudy: {
      title: 'Moving learner accounts from the browser to the server',
      problem: 'An early version of a learning site kept accounts (including passwords) in the browser\'s localStorage, so learners could not log in on another device and anyone using the computer could read the password.',
      data: 'Existing accounts in localStorage; quiz progress on the server keyed by email.',
      steps: ['Add /register and /login endpoints that store bcrypt hashes.', 'Return a signed learner token and require it on progress endpoints.', 'Migrate old accounts once, on their next successful local login.', 'Stop storing passwords in the browser.'],
      result: 'Learners sign in from any device; progress endpoints can no longer be called on behalf of someone else.',
      limitations: 'Tokens stored in localStorage can be stolen by XSS; httpOnly cookies plus CSRF protection are the stronger option for high-risk apps.'
    },
    exercises: [
      {
        id: 'web14-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Storing passwords',
        objective: 'Choose a password storage method.',
        problem: 'How should a web app store user passwords?',
        options: ['Plain text in the database', 'Encrypted with a key stored next to the database', 'A slow, salted hash such as bcrypt or Argon2', 'Base64 encoded'],
        hints: ['You should be unable to recover the original password at all.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Password hashing algorithms are deliberately slow and salted, which makes cracking leaked hashes expensive.'],
        explanation: 'Base64 is an encoding, not protection; encryption can be reversed by whoever obtains the key.',
        mistakes: ['Using a fast hash like SHA-256 without salting or work factor.'],
        challenge: 'Why does bcrypt produce a different hash for the same password each time? (Random salt.)'
      },
      {
        id: 'web14-e2', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'JWT structure',
        objective: 'Recall the parts of a JWT.',
        problem: 'How many dot-separated parts does a signed JWT (JWS compact form) have?',
        hints: ['header . payload . signature'],
        check: { type: 'numeric', answer: 3, tolerance: 0 },
        solution: ['Header, payload and signature — three parts.'],
        explanation: 'The signature is computed over the first two parts using the secret or private key.',
        mistakes: ['Answering 2 by forgetting the signature.'],
        challenge: 'What happens if someone edits the payload but keeps the old signature? (Verification fails.)'
      },
      {
        id: 'web14-e3', type: 'JavaScript coding', difficulty: 'Intermediate', language: 'javascript',
        title: 'Is the token expired?',
        objective: 'Decode a JWT payload and compare its expiry.',
        problem: "Write isExpired(token, nowSeconds) that decodes the payload and returns true when exp <= now. Expected:\nfalse\ntrue",
        starterCode: "const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhc2hhQGV4YW1wbGUuY29tIiwicm9sZSI6ImxlYXJuZXIiLCJleHAiOjE3NjcyMjU2MDB9.signature';\n\nfunction isExpired(token, nowSeconds) {\n  // decode the payload (second part) and compare payload.exp with nowSeconds\n}\n\nconsole.log(isExpired(token, 1767225599)); // one second before expiry\nconsole.log(isExpired(token, 1767225600)); // exactly at expiry",
        hints: ["const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');", 'const payload = JSON.parse(atob(part)); return payload.exp <= nowSeconds;'],
        check: { type: 'output', expectedOutput: 'false\ntrue' },
        solutionCode: "const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhc2hhQGV4YW1wbGUuY29tIiwicm9sZSI6ImxlYXJuZXIiLCJleHAiOjE3NjcyMjU2MDB9.signature';\n\nfunction isExpired(token, nowSeconds) {\n  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');\n  const payload = JSON.parse(atob(part));\n  return payload.exp <= nowSeconds;\n}\n\nconsole.log(isExpired(token, 1767225599));\nconsole.log(isExpired(token, 1767225600));",
        solution: ['Take the second part, convert base64url to base64, decode and parse.', 'A token is expired once the current time reaches exp.'],
        explanation: 'Client-side expiry checks are only for UX (e.g. prompting re-login); the server must still verify the signature and expiry.',
        mistakes: ['Comparing milliseconds (Date.now()) with seconds (exp).'],
        challenge: 'Return the number of minutes left before expiry.'
      }
    ],
    knowledgeCheck: [
      { id: 'web14-k1', question: 'Where should the JWT signing secret live?', options: ['In the React bundle', 'In a server environment variable / secret manager', 'In the README', 'In localStorage'], answer: 1, explanation: 'Anything shipped to the browser is public.' },
      { id: 'web14-k2', question: 'Which defence stops SQL injection?', options: ['Escaping quotes by hand', 'Parameterised queries / prepared statements', 'Hiding error messages', 'Using POST'], answer: 1, explanation: 'Parameters separate code from data.' },
      { id: 'web14-k3', question: 'Which status means "authenticated but not allowed"?', options: ['401', '403', '404', '409'], answer: 1, explanation: '401 = not authenticated; 403 = authenticated but forbidden.' }
    ],
    cheatSheet: ['await bcrypt.hash(pw, 10); await bcrypt.compare(pw, hash)', "jwt.sign({ sub, role }, process.env.JWT_SECRET, { expiresIn: '1h' })", 'jwt.verify(token, secret) in middleware → req.user', 'db.query("… WHERE id = $1", [id])'],
    references: [
      { title: 'OWASP Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', publisher: 'OWASP Foundation' },
      { title: 'RFC 7519 — JSON Web Token (JWT)', url: 'https://datatracker.ietf.org/doc/html/rfc7519', publisher: 'IETF' },
      { title: 'OWASP SQL Injection Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html', publisher: 'OWASP Foundation' }
    ],
    next: 'Module 15 brings everything together into a deployed, performant capstone project.'
  },

  'web-mod-15': {
    skills: ['Plan a full-stack project from requirements to deployment', 'Measure and improve Core Web Vitals', 'Present a portfolio project professionally'],
    prerequisites: ['Modules 01–14'],
    intuition: {
      analogy: 'A capstone is building a small house yourself after learning carpentry, plumbing and wiring separately: the challenge is not any single skill but connecting them so the lights turn on when the door opens.',
      whyItMatters: 'Employers judge readiness by working, deployed projects with readable code and clear documentation — not by certificates alone.'
    },
    workflow: {
      title: 'Capstone delivery pipeline',
      nodes: [
        { id: 'req', label: 'Requirements', detail: 'User stories and a minimal feature list.', input: 'Idea', output: 'Scope' },
        { id: 'design', label: 'Design', detail: 'Data model, API routes, wireframes.', input: 'Scope', output: 'Plan' },
        { id: 'build', label: 'Build', detail: 'React front end + Express API + database.', input: 'Plan', output: 'Working app' },
        { id: 'test', label: 'Test & measure', detail: 'Unit/API tests, Lighthouse, accessibility checks.', input: 'Working app', output: 'Quality report' },
        { id: 'deploy', label: 'Deploy', detail: 'CI build, environment variables, HTTPS hosting.', input: 'Tested app', output: 'Live URL' },
        { id: 'showcase', label: 'Showcase', detail: 'README, screenshots, demo video, portfolio entry.', input: 'Live URL', output: 'Portfolio piece' }
      ],
      edges: [{ from: 'req', to: 'design' }, { from: 'design', to: 'build' }, { from: 'build', to: 'test' }, { from: 'test', to: 'build', label: 'fix' }, { from: 'test', to: 'deploy' }, { from: 'deploy', to: 'showcase' }],
      explanation: 'The test → build loop is where most of the quality comes from; plan time for it.'
    },
    workedExample: {
      title: 'Debouncing a search box (performance pattern)',
      language: 'javascript',
      code: "function debounce(fn, ms) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\n\nlet calls = 0;\nconst search = debounce((q) => { calls++; console.log('search: ' + q); }, 50);\n['p', 'py', 'pyt', 'pyth'].forEach((q, i) => setTimeout(() => search(q), i * 10));\nsetTimeout(() => console.log('API calls: ' + calls), 200);",
      lineByLine: [
        { line: 1, explanation: 'debounce returns a wrapper that delays calling fn.' },
        { line: 4, explanation: 'Each new keystroke cancels the previous pending call.' },
        { line: 11, explanation: 'Four keystrokes 10 ms apart — faster than the 50 ms delay.' },
        { line: 12, explanation: 'Only the last query reaches the "API".' }
      ],
      expectedOutput: 'search: pyth\nAPI calls: 1',
      edgeCases: ['Debouncing too long makes the UI feel unresponsive; 200–300 ms is common for search.', 'Code-splitting (dynamic import()) reduces the initial JavaScript a page must download.']
    },
    caseStudy: {
      title: 'Improving a portfolio site\'s Largest Contentful Paint',
      problem: 'A learner\'s portfolio scored poorly on mobile because a 3 MB hero image loaded late.',
      data: 'Lighthouse report: LCP around 5 s on a simulated mid-range phone.',
      steps: ['Resize and compress the hero image (WebP/AVIF) and serve srcset sizes.', 'Add width/height to prevent layout shift, and fetchpriority="high" for the hero image.', 'Lazy-load below-the-fold images.', 'Re-run Lighthouse and record before/after numbers in the README.'],
      result: 'LCP moves into the "good" range (≤ 2.5 s) in the follow-up Lighthouse run, and the README documents the improvement.',
      limitations: 'Lab tools simulate conditions; field data from real users (e.g. Chrome UX Report) can differ.'
    },
    exercises: [
      {
        id: 'web15-e1', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'Good LCP threshold',
        objective: 'Know Core Web Vitals targets.',
        problem: 'According to web.dev, what is the maximum Largest Contentful Paint (in seconds) still considered "good"?',
        hints: ['It is between 2 and 3 seconds.'],
        check: { type: 'numeric', answer: 2.5, tolerance: 0 },
        solution: ['LCP ≤ 2.5 s is good; above 4 s is poor.'],
        explanation: 'Measured at the 75th percentile of page loads.',
        mistakes: ['Confusing LCP with total page load time.'],
        challenge: 'What are the "good" thresholds for INP and CLS? (≤ 200 ms and ≤ 0.1)'
      },
      {
        id: 'web15-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Reduce initial JavaScript',
        objective: 'Pick a code-splitting technique.',
        problem: 'Your admin dashboard is large but rarely used by learners. How do you keep it out of the learners\' initial bundle in a React app?',
        options: ['Minify it more', 'Load it with React.lazy(() => import("./AdminDashboard"))', 'Inline it in index.html', 'Move it to a CSS file'],
        hints: ['Dynamic import() creates a separate chunk loaded on demand.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['React.lazy + Suspense loads the dashboard chunk only when that route is visited.'],
        explanation: 'Bundlers such as Vite split dynamic imports into separate files automatically.',
        mistakes: ['Thinking minification alone solves large bundles.'],
        challenge: 'Wrap the lazy component in <Suspense fallback={…}>.'
      },
      {
        id: 'web15-e3', type: 'Real-world case study', difficulty: 'Advanced',
        title: 'What belongs in a project README?',
        objective: 'Document a project for reviewers.',
        problem: 'Which item is LEAST useful in a portfolio project README?',
        options: ['A live demo link and screenshots', 'Setup steps and environment variables (names, not values)', 'Your real database password', 'Architecture overview and key decisions'],
        hints: ['Think about what a reviewer needs — and what must never be public.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Secrets must never appear in a repository; list variable names and provide an .env.example instead.'],
        explanation: 'Good READMEs let reviewers run and understand the project in minutes.',
        mistakes: ['Committing .env files.'],
        challenge: 'Write a five-section README outline for your capstone.'
      }
    ],
    knowledgeCheck: [
      { id: 'web15-k1', question: 'Which metric measures visual stability?', options: ['LCP', 'INP', 'CLS', 'TTFB'], answer: 2, explanation: 'Cumulative Layout Shift.' },
      { id: 'web15-k2', question: 'Where should production secrets be configured?', options: ['In the client bundle', 'In the hosting platform\'s environment variables', 'In Git', 'In comments'], answer: 1, explanation: 'Keep them outside source control.' },
      { id: 'web15-k3', question: 'What does a CI pipeline typically do on each push?', options: ['Deletes branches', 'Installs, lints, tests and builds the project', 'Writes code', 'Buys hosting'], answer: 1, explanation: 'Automated checks catch regressions before deployment.' }
    ],
    cheatSheet: ['Core Web Vitals: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1', 'React.lazy(() => import(…)) + <Suspense>', 'img: width/height, loading="lazy", srcset', 'README: demo, setup, architecture, decisions, tests'],
    references: [
      { title: 'Web Vitals', url: 'https://web.dev/articles/vitals', publisher: 'web.dev (Google)' },
      { title: 'Largest Contentful Paint (LCP)', url: 'https://web.dev/articles/lcp', publisher: 'web.dev (Google)' },
      { title: 'React — lazy', url: 'https://react.dev/reference/react/lazy', publisher: REACT },
      { title: 'Lighthouse overview', url: 'https://developer.chrome.com/docs/lighthouse/overview', publisher: 'Chrome for Developers (Google)' }
    ],
    next: 'You have completed the Web Development track. Deploy your capstone, add it to your portfolio, and consider the SQL course to deepen your back-end skills.'
  }
};
