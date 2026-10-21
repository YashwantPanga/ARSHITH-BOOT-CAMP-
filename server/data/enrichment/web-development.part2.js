// Additional learning content for Web Development, modules 6–10.
const MDN = 'MDN Web Docs (Mozilla)';

export default {
  'web-mod-6': {
    skills: ['Design mobile-first with min-width media queries', 'Use relative units (rem, %, vw) and fluid type with clamp()', 'Respect dark-mode and reduced-motion preferences'],
    prerequisites: ['Flexbox and Grid (Module 05)'],
    intuition: {
      analogy: 'Mobile-first is packing for a small suitcase first: you decide what truly matters, then add extras when you get a bigger suitcase (wider screens). Desktop-first is trying to squeeze a wardrobe into a carry-on.',
      whyItMatters: 'Most learners in India browse on phones. Responsive design is not a bonus feature — for many users the mobile layout is the only layout.'
    },
    workflow: {
      title: 'Mobile-first CSS cascade',
      nodes: [
        { id: 'base', label: 'Base styles', detail: 'Single column, readable font, touch-sized buttons. No media query.', input: 'All devices', output: 'Phone layout' },
        { id: 'md', label: '@media (min-width: 768px)', detail: 'Two columns, larger spacing.', input: 'Tablets and up', output: 'Enhanced layout' },
        { id: 'lg', label: '@media (min-width: 1024px)', detail: 'Sidebar + content, wider max-width.', input: 'Laptops and up', output: 'Desktop layout' },
        { id: 'pref', label: 'User preferences', detail: 'prefers-color-scheme, prefers-reduced-motion.', input: 'OS settings', output: 'Comfortable experience' }
      ],
      edges: [{ from: 'base', to: 'md' }, { from: 'md', to: 'lg' }, { from: 'base', to: 'pref' }],
      explanation: 'Each min-width query only adds or overrides; nothing has to be "undone", which keeps the CSS smaller and easier to reason about.'
    },
    workedExample: {
      title: 'Fluid typography and a mobile-first layout',
      language: 'html',
      code: '<style>\n  :root { font-size: 100%; }\n  h1 { font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3rem); }\n  .layout { display: grid; gap: 1rem; padding: 1rem; }\n  @media (min-width: 768px) { .layout { grid-template-columns: 240px 1fr; } }\n  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }\n  @media (prefers-color-scheme: dark) { body { background: #0C2D26; color: #FBF8F1; } }\n</style>\n<div class="layout"><aside>Modules</aside><main><h1>Responsive lesson</h1></main></div>',
      lineByLine: [
        { line: 3, explanation: 'clamp(min, preferred, max): the heading grows with the viewport but never below 1.75rem or above 3rem.' },
        { line: 4, explanation: 'Base layout: one column for phones.' },
        { line: 5, explanation: 'From 768px, a fixed sidebar and flexible content column.' },
        { line: 6, explanation: 'Users who reduce motion in their OS get no animations.' }
      ],
      expectedResult: 'On a phone the sidebar sits above the content; from 768px they appear side by side. The heading size changes smoothly while resizing.',
      edgeCases: ['Without <meta name="viewport" content="width=device-width, initial-scale=1"> phones render a zoomed-out desktop page and media queries do not match as expected.', 'Fixed heights on text containers clip content when users enlarge the font size.']
    },
    caseStudy: {
      title: 'Fixing a course page on small phones',
      problem: 'On 360px-wide phones, code blocks forced the whole page to scroll sideways and buttons overlapped.',
      data: 'Lighthouse and DevTools device emulation reports.',
      steps: ['Find the widest element with DevTools (overflowing pre blocks).', 'Give code blocks overflow-x: auto so only they scroll.', 'Replace fixed widths with max-width: 100% and min-width: 0 on flex children.', 'Test at 360, 390 and 768px.'],
      result: 'No page-level horizontal scrolling; code remains readable with its own scrollbar.',
      limitations: 'Emulation is close to, but not identical to, real devices — test on at least one real phone.'
    },
    exercises: [
      {
        id: 'web6-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Mobile-first query',
        objective: 'Write media queries in mobile-first style.',
        problem: 'In mobile-first CSS, which media query adds a two-column layout for tablets and larger?',
        options: ['@media (max-width: 767px)', '@media (min-width: 768px)', '@media print', '@media (orientation: portrait)'],
        hints: ['Mobile-first styles are enhanced as the screen gets wider.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['min-width queries apply from a width upward, so they enhance the base (mobile) styles.'],
        explanation: 'max-width queries are typical of desktop-first CSS.',
        mistakes: ['Mixing min- and max-width queries randomly, creating gaps or overlaps at the boundaries.'],
        challenge: 'Write the range syntax version: @media (width >= 768px).'
      },
      {
        id: 'web6-e2', type: 'Numerical calculation', difficulty: 'Beginner',
        title: 'rem to pixels',
        objective: 'Convert relative units.',
        problem: 'The root font size is the browser default (16px). How many pixels is 2.5rem?',
        hints: ['1rem = root font size.'],
        check: { type: 'numeric', answer: 40, tolerance: 0 },
        solution: ['2.5 × 16px = 40px.'],
        explanation: 'If a user sets a larger default font size, rem-based sizes scale with it — an accessibility win.',
        mistakes: ['Using the parent element\'s font size (that is em).'],
        challenge: 'What is 1.25em inside an element whose font-size is 20px? (25px)'
      },
      {
        id: 'web6-e3', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Respect motion preferences',
        objective: 'Name the media feature for reduced motion.',
        problem: 'Which media feature (name only) lets you disable animations for users who requested less motion in their OS settings?',
        hints: ['It starts with "prefers-".'],
        check: { type: 'text', accept: ['prefers-reduced-motion', '(prefers-reduced-motion: reduce)', 'prefers-reduced-motion: reduce'] },
        solution: ['@media (prefers-reduced-motion: reduce) { … }'],
        explanation: 'Large motion can trigger nausea or dizziness for people with vestibular disorders.',
        mistakes: ['Removing all transitions for everyone instead of honouring the preference.'],
        challenge: 'Write a dark-mode block using prefers-color-scheme.'
      }
    ],
    knowledgeCheck: [
      { id: 'web6-k1', question: 'Which meta tag is required for responsive pages on phones?', options: ['<meta name="theme-color">', '<meta name="viewport" content="width=device-width, initial-scale=1">', '<meta charset>', '<meta name="robots">'], answer: 1, explanation: 'Without it, phones emulate a desktop-width viewport.' },
      { id: 'web6-k2', question: 'What does 50vw mean?', options: ['50% of the parent width', '50% of the viewport width', '50 pixels', '50% of the font size'], answer: 1, explanation: 'vw and vh are percentages of the viewport.' },
      { id: 'web6-k3', question: 'Which makes images scale down inside narrow containers?', options: ['width: 100vw', 'max-width: 100%; height: auto', 'float: left', 'overflow: visible'], answer: 1, explanation: 'They never exceed their container and keep their aspect ratio.' }
    ],
    cheatSheet: ['Base styles = mobile; enhance with @media (min-width: …)', 'rem for type and spacing; clamp(min, fluid, max)', 'img { max-width: 100%; height: auto; }', '@media (prefers-reduced-motion: reduce), (prefers-color-scheme: dark)'],
    references: [
      { title: 'Responsive web design', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design', publisher: MDN },
      { title: 'Using media queries', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries', publisher: MDN },
      { title: 'prefers-reduced-motion', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion', publisher: MDN }
    ],
    next: 'Module 07 adds behaviour with JavaScript.'
  },

  'web-mod-7': {
    skills: ['Use let/const and understand block scope', 'Write closures deliberately', 'Transform data with map, filter and reduce'],
    prerequisites: ['Basic programming ideas (variables, loops); HTML/CSS modules'],
    intuition: {
      analogy: 'A closure is a backpack a function carries: when it is created it packs the variables around it, and it can still open the backpack long after the surrounding function has finished.',
      whyItMatters: 'Closures power event handlers, React hooks and module patterns; array methods are the everyday way to process API data in the browser.'
    },
    workflow: {
      title: 'How JavaScript runs your script',
      nodes: [
        { id: 'parse', label: 'Parse', detail: 'Engine (V8 in Chrome/Node) reads the source.', input: 'Source code', output: 'Syntax tree' },
        { id: 'compile', label: 'Compile (JIT)', detail: 'Bytecode first, optimised machine code for hot functions.', input: 'Syntax tree', output: 'Executable code' },
        { id: 'stack', label: 'Call stack', detail: 'Each function call pushes a frame; returns pop it.', input: 'Calls', output: 'Execution order' },
        { id: 'heap', label: 'Heap', detail: 'Objects, arrays and closures live here.', input: 'Allocations', output: 'Shared memory' },
        { id: 'gc', label: 'Garbage collector', detail: 'Frees objects that are no longer reachable.', input: 'Unreachable objects', output: 'Reclaimed memory' }
      ],
      edges: [{ from: 'parse', to: 'compile' }, { from: 'compile', to: 'stack' }, { from: 'stack', to: 'heap', label: 'references' }, { from: 'heap', to: 'gc' }],
      explanation: 'A closure keeps its captured variables reachable on the heap, which is why they survive after the outer function returns — and why unnecessary closures can hold memory.'
    },
    workedExample: {
      title: 'Closures and array methods',
      language: 'javascript',
      code: "function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst next = makeCounter();\nnext(); next();\nconsole.log(next());\n\nconst prices = [499, 1299, 39, 249];\nconst discounted = prices.filter(p => p > 100).map(p => p - 50);\nconsole.log(discounted.join(', '));\nconsole.log(prices.reduce((sum, p) => sum + p, 0));\nconsole.log(typeof null, typeof undefined, [] === []);",
      lineByLine: [
        { line: 2, explanation: 'count is private to each counter created by makeCounter.' },
        { line: 3, explanation: 'The returned arrow function closes over count.' },
        { line: 7, explanation: 'Third call returns 3.' },
        { line: 10, explanation: 'filter keeps prices above 100, map subtracts 50 from each.' },
        { line: 12, explanation: 'reduce accumulates a total starting from 0.' },
        { line: 13, explanation: 'Historic quirk: typeof null is "object". Two different arrays are never === equal.' }
      ],
      expectedOutput: '3\n449, 1249, 199\n2086\nobject undefined false',
      edgeCases: ['var is function-scoped and hoisted; let/const are block-scoped and in a temporal dead zone before declaration.', '== performs type coercion ("5" == 5 is true); prefer ===.']
    },
    caseStudy: {
      title: 'Cleaning API data for a course list',
      problem: 'A course API returns 200 entries, including drafts and prices in paise; the page needs published courses sorted by rating with prices in rupees.',
      data: 'Array of objects {title, status, pricePaise, rating}.',
      steps: ["filter(c => c.status === 'published')", 'map(c => ({ ...c, price: c.pricePaise / 100 }))', 'toSorted((a, b) => b.rating - a.rating) (or sort on a copy)', 'Render the first 12.'],
      result: 'A readable, side-effect-free pipeline that is easy to unit-test.',
      limitations: 'Sorting large arrays on every render is wasteful — memoise the result (Module 12) or sort on the server.'
    },
    exercises: [
      {
        id: 'web7-e1', type: 'Predict the output', difficulty: 'Beginner',
        title: 'Strict equality',
        objective: 'Distinguish == and ===.',
        problem: 'What does console.log("5" == 5, "5" === 5) print?',
        hints: ['== converts types before comparing; === does not.'],
        check: { type: 'text', accept: ['true false'] },
        solution: ['"5" == 5 → "5" is converted to 5 → true.', '"5" === 5 → different types → false.'],
        explanation: 'Use === by default to avoid surprising coercions.',
        mistakes: ['Expecting both to be true.'],
        challenge: 'What does null == undefined return? (true) And null === undefined? (false)'
      },
      {
        id: 'web7-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Loop closures',
        objective: 'Understand block scope in loops.',
        problem: 'for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));\n\nWhat is logged?',
        options: ['0 1 2', '3 3 3', '0 0 0', 'undefined ×3'],
        hints: ['var creates one variable shared by all iterations.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['All callbacks close over the same i.', 'They run after the loop finished, when i is 3.'],
        explanation: 'With let, each iteration gets its own binding and the output is 0 1 2.',
        mistakes: ['Assuming the value is captured at the time setTimeout is called.'],
        challenge: 'Fix it without changing var to let (hint: an IIFE or passing i as an argument).'
      },
      {
        id: 'web7-e3', type: 'JavaScript coding', difficulty: 'Intermediate', language: 'javascript',
        title: 'Score statistics',
        objective: 'Use reduce, Math.max and filter.',
        problem: 'Print the average score, the top score and how many scores are at least 75. Expected:\nAverage: 80\nTop: 90\nPassed: 3',
        starterCode: 'const scores = [70, 85, 90, 75];\n\n// compute and print the three lines\n',
        hints: ['scores.reduce((a, b) => a + b, 0) / scores.length', 'Math.max(...scores)', 'scores.filter(s => s >= 75).length'],
        check: { type: 'output', expectedOutput: 'Average: 80\nTop: 90\nPassed: 3' },
        solutionCode: "const scores = [70, 85, 90, 75];\n\nconst average = scores.reduce((a, b) => a + b, 0) / scores.length;\nconsole.log('Average: ' + average);\nconsole.log('Top: ' + Math.max(...scores));\nconsole.log('Passed: ' + scores.filter(s => s >= 75).length);",
        solution: ['Sum is 320; 320 / 4 = 80.', 'The spread operator passes array items as separate arguments to Math.max.', '85, 90 and 75 are ≥ 75.'],
        explanation: 'Each method returns a new value; the original array is unchanged.',
        mistakes: ['Calling Math.max(scores), which returns NaN.'],
        challenge: 'Return all four statistics as one object and print it with JSON.stringify.'
      }
    ],
    knowledgeCheck: [
      { id: 'web7-k1', question: 'Which declaration cannot be reassigned?', options: ['var', 'let', 'const', 'function'], answer: 2, explanation: 'const prevents reassignment (object contents can still change).' },
      { id: 'web7-k2', question: 'What does [1, 2, 3].map(x => x * 2) return?', options: ['[2, 4, 6]', '6', '[1, 2, 3]', 'undefined'], answer: 0, explanation: 'map returns a new array of the same length.' },
      { id: 'web7-k3', question: 'Which value is falsy?', options: ['"0"', '[]', '0', '{}'], answer: 2, explanation: 'Empty arrays/objects and "0" are truthy in JavaScript.' }
    ],
    cheatSheet: ['const / let (block scope); avoid var', '=== and !==', 'arr.map / filter / reduce / find / some / every', 'Spread: [...a], {...o}; destructuring: const {x} = o'],
    references: [
      { title: 'JavaScript Guide — Grammar and types', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types', publisher: MDN },
      { title: 'Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures', publisher: MDN },
      { title: 'Array', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array', publisher: MDN }
    ],
    next: 'Module 08 connects JavaScript to the page through the DOM and events.'
  },

  'web-mod-8': {
    skills: ['Select and update elements safely', 'Handle events with delegation', 'Persist small amounts of data with localStorage and JSON'],
    prerequisites: ['JavaScript fundamentals (Module 07)'],
    intuition: {
      analogy: 'The DOM is a live family tree of the page. Event bubbling is news travelling up the family: when a child is clicked, the parent and grandparents hear about it too — so one listener on the parent can handle clicks from all its children.',
      whyItMatters: 'Every interactive feature — menus, tabs, carts, quizzes — reads and changes the DOM in response to events.'
    },
    workflow: {
      title: 'Event propagation and delegation',
      nodes: [
        { id: 'click', label: 'User clicks a button', detail: 'The event target is the button.', input: 'Pointer/keyboard', output: 'Event object' },
        { id: 'capture', label: 'Capture phase', detail: 'Event travels from window down to the target.', input: 'Event', output: 'Capturing listeners run' },
        { id: 'target', label: 'Target phase', detail: 'Listeners on the button itself run.', input: 'Event', output: 'Target handlers' },
        { id: 'bubble', label: 'Bubble phase', detail: 'Event travels back up through ancestors.', input: 'Event', output: 'Ancestor handlers' },
        { id: 'deleg', label: 'Delegated handler on list', detail: 'event.target.closest("[data-id]") finds which item was clicked.', input: 'Bubbled event', output: 'One handler for many items' }
      ],
      edges: [{ from: 'click', to: 'capture' }, { from: 'capture', to: 'target' }, { from: 'target', to: 'bubble' }, { from: 'bubble', to: 'deleg' }],
      explanation: 'Delegation works for items added later, too, because the listener is on a stable ancestor.'
    },
    workedExample: {
      title: 'Saving a cart with JSON (runs without a browser DOM)',
      language: 'javascript',
      code: "const cart = [{ id: 1, qty: 2 }, { id: 3, qty: 1 }];\nconst saved = JSON.stringify(cart);          // what localStorage.setItem would store\nconst restored = JSON.parse(saved);         // what getItem + parse gives back\nrestored[0].qty += 1;\nconsole.log(saved);\nconsole.log(restored.reduce((n, item) => n + item.qty, 0));\nconsole.log(cart[0].qty);",
      lineByLine: [
        { line: 2, explanation: 'localStorage only stores strings, so objects are serialised to JSON first.' },
        { line: 3, explanation: 'Parsing creates brand-new objects.' },
        { line: 4, explanation: 'Changing the restored copy does not affect the original array.' },
        { line: 6, explanation: 'Total quantity after the change: 3 + 1 = 4.' }
      ],
      expectedOutput: '[{"id":1,"qty":2},{"id":3,"qty":1}]\n4\n2',
      edgeCases: ['Setting element.innerHTML with user-supplied text enables XSS; use textContent for plain text.', 'localStorage can throw in private browsing or when full — wrap access in try/catch.']
    },
    caseStudy: {
      title: 'A to-do list that survives refreshes',
      problem: 'Learners lose their study checklist whenever they reload the page.',
      data: 'An array of tasks {id, text, done} rendered as list items.',
      steps: ['Render the list from the array with createElement and textContent.', 'Attach one click listener on the <ul> and use event.target.closest("li").dataset.id.', 'After every change, save JSON.stringify(tasks) to localStorage; load and parse it on start-up inside try/catch.'],
      result: 'The checklist persists per browser and the code handles hundreds of items with a single listener.',
      limitations: 'localStorage is per-device and unencrypted — never store tokens or personal data there; sync to a server for multi-device use.'
    },
    exercises: [
      {
        id: 'web8-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Safe text insertion',
        objective: 'Prevent XSS when updating the DOM.',
        problem: 'Which line safely displays a user\'s comment that may contain "<script>" text?',
        options: ['el.innerHTML = comment', 'el.textContent = comment', 'document.write(comment)', 'el.outerHTML = comment'],
        hints: ['Only one property treats the value as plain text.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['textContent never parses HTML, so tags are shown literally and scripts cannot run.'],
        explanation: 'innerHTML parses markup and can execute attacker-controlled handlers such as onerror.',
        mistakes: ['Using innerHTML for convenience with untrusted input.'],
        challenge: 'When is innerHTML acceptable? (Static, trusted templates only.)'
      },
      {
        id: 'web8-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Which element was clicked?',
        objective: 'Use the event object in delegation.',
        problem: 'Inside a delegated click listener on a <ul>, which event property gives the element that was actually clicked? (e.g. event.something)',
        hints: ['currentTarget is the element the listener is attached to.'],
        check: { type: 'text', accept: ['event.target', 'e.target', 'target'] },
        solution: ['event.target is the innermost element that was clicked.', 'event.currentTarget is the <ul> that owns the listener.'],
        explanation: 'Combine it with closest() to find the list item even when a child span was clicked.',
        mistakes: ['Using currentTarget, which is always the list.'],
        challenge: 'Stop the event from reaching ancestors with event.stopPropagation() — and explain why that is rarely needed.'
      },
      {
        id: 'web8-e3', type: 'JavaScript coding', difficulty: 'Intermediate', language: 'javascript',
        title: 'A tiny storage wrapper',
        objective: 'Serialise and deserialise data safely.',
        problem: 'Complete save(key, value) and load(key, fallback) using the provided store (it behaves like localStorage). Expected output:\n2\nPython,SQL\n[]',
        starterCode: "const store = new Map();\nconst storage = { setItem: (k, v) => store.set(k, String(v)), getItem: (k) => (store.has(k) ? store.get(k) : null) };\n\nfunction save(key, value) {\n  // store JSON text\n}\nfunction load(key, fallback) {\n  // parse JSON text, or return fallback when missing or invalid\n}\n\nsave('courses', ['Python', 'SQL']);\nconsole.log(load('courses', []).length);\nconsole.log(load('courses', []).join(','));\nstorage.setItem('broken', '{not json');\nconsole.log(JSON.stringify(load('broken', [])));",
        hints: ['storage.setItem(key, JSON.stringify(value))', 'Wrap JSON.parse in try/catch and handle a null result.'],
        check: { type: 'output', expectedOutput: '2\nPython,SQL\n[]' },
        solutionCode: "const store = new Map();\nconst storage = { setItem: (k, v) => store.set(k, String(v)), getItem: (k) => (store.has(k) ? store.get(k) : null) };\n\nfunction save(key, value) {\n  storage.setItem(key, JSON.stringify(value));\n}\nfunction load(key, fallback) {\n  const raw = storage.getItem(key);\n  if (raw === null) return fallback;\n  try {\n    return JSON.parse(raw);\n  } catch {\n    return fallback;\n  }\n}\n\nsave('courses', ['Python', 'SQL']);\nconsole.log(load('courses', []).length);\nconsole.log(load('courses', []).join(','));\nstorage.setItem('broken', '{not json');\nconsole.log(JSON.stringify(load('broken', [])));",
        solution: ['Serialise with JSON.stringify before storing.', 'Return the fallback when nothing is stored or parsing fails.'],
        explanation: 'Corrupted or outdated stored values are common in real browsers; defensive loading prevents a blank page.',
        mistakes: ['Storing the array directly, which becomes the string "Python,SQL".'],
        challenge: 'Add a version number to stored data and discard old versions.'
      }
    ],
    knowledgeCheck: [
      { id: 'web8-k1', question: 'Which method returns the first element matching a CSS selector?', options: ['getElementsByClassName', 'querySelector', 'querySelectorAll', 'getElementById'], answer: 1, explanation: 'querySelectorAll returns all matches as a NodeList.' },
      { id: 'web8-k2', question: 'Which storage is cleared when the tab is closed?', options: ['localStorage', 'sessionStorage', 'cookies', 'IndexedDB'], answer: 1, explanation: 'sessionStorage lasts for the tab session.' },
      { id: 'web8-k3', question: 'What does event.preventDefault() do on a form submit?', options: ['Stops bubbling', 'Stops the browser\'s default navigation/submission', 'Deletes the form', 'Reloads the page'], answer: 1, explanation: 'It lets JavaScript handle the submission (e.g. with fetch).' }
    ],
    cheatSheet: ['document.querySelector(sel) / querySelectorAll(sel)', "el.addEventListener('click', handler)", 'event.target.closest(selector), el.dataset.id', 'el.textContent (safe) vs innerHTML (parses HTML)'],
    references: [
      { title: 'Introduction to the DOM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', publisher: MDN },
      { title: 'Event bubbling', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling', publisher: MDN },
      { title: 'Using the Web Storage API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API', publisher: MDN }
    ],
    next: 'Module 09 handles asynchronous work such as network requests with promises and async/await.'
  },

  'web-mod-9': {
    skills: ['Predict execution order with the event loop', 'Combine promises with all, allSettled, race and any', 'Write async/await code with proper error handling'],
    prerequisites: ['DOM and events (Module 08)'],
    intuition: {
      analogy: 'The event loop is a single chef with order tickets. Quick tasks are done immediately; slow tasks (baking) are put in the oven with a timer, and the chef keeps serving others. Promise callbacks are "urgent tickets" handled before the next ordinary ticket.',
      whyItMatters: 'Network requests, timers and file reads are asynchronous. Misunderstanding the order leads to UI that shows stale data or crashes on undefined values.'
    },
    workflow: {
      title: 'One turn of the event loop',
      nodes: [
        { id: 'sync', label: 'Run synchronous code', detail: 'Everything on the call stack until it is empty.', input: 'Script / callback', output: 'Empty stack' },
        { id: 'micro', label: 'Drain microtasks', detail: 'Promise .then/await continuations, queueMicrotask.', input: 'Microtask queue', output: 'Empty microtask queue' },
        { id: 'render', label: 'Render (if needed)', detail: 'Browser may update the screen.', input: 'DOM changes', output: 'New frame' },
        { id: 'macro', label: 'Next macrotask', detail: 'setTimeout, events, network callbacks.', input: 'Task queue', output: 'Back to synchronous code' }
      ],
      edges: [{ from: 'sync', to: 'micro' }, { from: 'micro', to: 'render' }, { from: 'render', to: 'macro' }, { from: 'macro', to: 'sync', label: 'loop' }],
      explanation: 'All microtasks run before the next macrotask, which is why a resolved promise logs before a 0 ms setTimeout.'
    },
    workedExample: {
      title: 'async/await with error handling',
      language: 'javascript',
      code: "const fakeFetch = (id, ms) => new Promise((resolve, reject) =>\n  setTimeout(() => (id > 0 ? resolve({ id, title: 'Course ' + id }) : reject(new Error('Invalid id'))), ms));\n\nasync function loadTwo() {\n  try {\n    const [a, b] = await Promise.all([fakeFetch(1, 30), fakeFetch(2, 10)]);\n    console.log(a.title + ' & ' + b.title);\n    await fakeFetch(-1, 5);\n  } catch (err) {\n    console.log('Caught: ' + err.message);\n  } finally {\n    console.log('done');\n  }\n}\nconsole.log('start');\nloadTwo();",
      lineByLine: [
        { line: 1, explanation: 'A stand-in for fetch that resolves or rejects after a delay.' },
        { line: 6, explanation: 'Promise.all runs both in parallel and keeps the input order in its result.' },
        { line: 8, explanation: 'Awaiting a rejected promise throws inside the async function.' },
        { line: 15, explanation: 'start logs first because loadTwo pauses at its first await.' }
      ],
      expectedOutput: 'start\nCourse 1 & Course 2\nCaught: Invalid id\ndone',
      edgeCases: ['fetch only rejects on network failure — check response.ok for 404/500.', 'Promise.all rejects as soon as one promise rejects; use allSettled when partial results are useful.']
    },
    caseStudy: {
      title: 'Loading a dashboard faster',
      problem: 'A learner dashboard awaited three API calls one after another, taking the sum of their durations (about 1.8 s).',
      data: 'Independent requests: profile, progress and certificates.',
      steps: ['Start all three requests first, then await Promise.all.', 'Use allSettled so a failing certificate service does not blank the whole page.', 'Show a skeleton while loading and an inline error for the failed part.'],
      result: 'Load time drops to roughly the slowest single request, and partial failures degrade gracefully.',
      limitations: 'Parallel requests increase momentary server load; rate limits still apply.'
    },
    exercises: [
      {
        id: 'web9-e1', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'Event-loop order',
        objective: 'Order synchronous, microtask and macrotask logs.',
        problem: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');\n\nWrite the letters in the order they are logged, separated by spaces.",
        hints: ['Synchronous logs first.', 'Microtasks (promise callbacks) run before macrotasks (timers).'],
        check: { type: 'text', accept: ['A D C B', 'ADCB', 'A, D, C, B'] },
        solution: ['A and D are synchronous.', 'C is a microtask and runs when the stack empties.', 'B is a timer macrotask and runs last.'],
        explanation: 'A 0 ms timeout means "as soon as possible after the current work and all microtasks".',
        mistakes: ['Putting B before C because its delay is 0.'],
        challenge: 'Add queueMicrotask(() => console.log("E")) after the promise line and predict again.'
      },
      {
        id: 'web9-e2', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Choose the combinator',
        objective: 'Pick the right Promise combinator.',
        problem: 'You request the same file from three mirrors and want the first successful response, ignoring failures unless all fail. Which do you use?',
        options: ['Promise.all', 'Promise.allSettled', 'Promise.race', 'Promise.any'],
        hints: ['race settles with the first result even if it is a failure.'],
        check: { type: 'mcq', answer: 3 },
        solution: ['Promise.any resolves with the first fulfilled promise and rejects only if all reject (AggregateError).'],
        explanation: 'race would settle with the first rejection if a mirror fails quickly.',
        mistakes: ['Choosing race.'],
        challenge: 'Use race to implement a 2-second timeout around a request.'
      },
      {
        id: 'web9-e3', type: 'JavaScript coding', difficulty: 'Advanced', language: 'javascript',
        title: 'Partial results with allSettled',
        objective: 'Handle mixed success and failure.',
        problem: 'Print one line per course, in order: the title for successes, "Error: <message>" for failures. Expected:\nCourse 1\nError: Not found\nCourse 3',
        starterCode: "const fetchCourse = (id) => new Promise((resolve, reject) =>\n  setTimeout(() => (id === 2 ? reject(new Error('Not found')) : resolve({ id, title: 'Course ' + id })), 10 * id));\n\n// use Promise.allSettled on ids 1, 2, 3 and print the results\n",
        hints: ['Promise.allSettled([1, 2, 3].map(fetchCourse))', "r.status === 'fulfilled' ? r.value.title : 'Error: ' + r.reason.message"],
        check: { type: 'output', expectedOutput: 'Course 1\nError: Not found\nCourse 3' },
        solutionCode: "const fetchCourse = (id) => new Promise((resolve, reject) =>\n  setTimeout(() => (id === 2 ? reject(new Error('Not found')) : resolve({ id, title: 'Course ' + id })), 10 * id));\n\nPromise.allSettled([1, 2, 3].map(fetchCourse)).then((results) => {\n  for (const r of results) {\n    console.log(r.status === 'fulfilled' ? r.value.title : 'Error: ' + r.reason.message);\n  }\n});",
        solution: ['allSettled waits for every promise and never rejects.', 'Each result has status plus value or reason, in input order.'],
        explanation: 'Results keep the input order regardless of which promise finished first.',
        mistakes: ['Using Promise.all, which rejects and loses the successful results.'],
        challenge: 'Rewrite it with async/await and a for…of loop.'
      }
    ],
    knowledgeCheck: [
      { id: 'web9-k1', question: 'What does an async function always return?', options: ['undefined', 'A Promise', 'The awaited value', 'A callback'], answer: 1, explanation: 'Its return value is wrapped in a resolved promise.' },
      { id: 'web9-k2', question: 'fetch() resolves (does not reject) for a 404 response. How do you detect it?', options: ['try/catch only', 'Check response.ok or response.status', 'It is impossible', 'Use XMLHttpRequest'], answer: 1, explanation: 'Throw your own error when !response.ok.' },
      { id: 'web9-k3', question: 'Which queue has priority after the current synchronous code?', options: ['Macrotask (timers)', 'Microtask (promises)', 'Render queue', 'Network queue'], answer: 1, explanation: 'Microtasks are drained before the next macrotask.' }
    ],
    cheatSheet: ['async function f() { try { const r = await p; } catch (e) {} }', 'Promise.all / allSettled / race / any', 'const res = await fetch(url); if (!res.ok) throw …; await res.json()', 'Microtasks before macrotasks'],
    references: [
      { title: 'Using promises', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises', publisher: MDN },
      { title: 'async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function', publisher: MDN },
      { title: 'Using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', publisher: MDN },
      { title: 'In depth: Microtasks and the JavaScript runtime environment', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide/In_depth', publisher: MDN }
    ],
    next: 'Module 10 puts your code under version control with Git and GitHub.'
  },

  'web-mod-10': {
    skills: ['Move changes through working tree, staging area and commits', 'Create branches and resolve merge conflicts', 'Open and review a pull request'],
    prerequisites: ['Command-line basics'],
    intuition: {
      analogy: 'Git is a photo album for your project. The staging area is the pile of photos you have chosen for the next page; a commit glues them in with a caption. Branches are parallel albums you can later merge.',
      whyItMatters: 'Every professional team uses version control. It lets you experiment safely, undo mistakes and collaborate through reviewed pull requests.'
    },
    workflow: {
      title: 'Everyday Git and GitHub flow',
      nodes: [
        { id: 'wt', label: 'Working tree', detail: 'Files you edit.', input: 'Edits', output: 'Modified files' },
        { id: 'stage', label: 'Staging area', detail: 'git add selects changes for the next commit.', input: 'Modified files', output: 'Staged snapshot' },
        { id: 'local', label: 'Local repository', detail: 'git commit -m "…" records the snapshot.', input: 'Staged snapshot', output: 'Commit on a branch' },
        { id: 'remote', label: 'Remote (GitHub)', detail: 'git push shares the branch.', input: 'Local commits', output: 'Branch on GitHub' },
        { id: 'pr', label: 'Pull request', detail: 'Review, CI checks, then merge into main.', input: 'Pushed branch', output: 'Reviewed change in main' }
      ],
      edges: [{ from: 'wt', to: 'stage', label: 'git add' }, { from: 'stage', to: 'local', label: 'git commit' }, { from: 'local', to: 'remote', label: 'git push' }, { from: 'remote', to: 'pr' }, { from: 'pr', to: 'wt', label: 'git pull' }],
      explanation: 'Small, focused commits with clear messages make reviews faster and history useful.'
    },
    workedExample: {
      title: 'Feature branch from start to pull request',
      language: 'text',
      code: 'git switch -c feature/course-search     # create and switch to a branch\n# …edit files…\ngit status                               # see modified files\ngit add src/search.js                    # stage one file\ngit commit -m "Add course search by title"\ngit push -u origin feature/course-search # publish the branch\n# open a pull request on GitHub, get a review, merge\ngit switch main && git pull              # update local main',
      lineByLine: [
        { line: 1, explanation: 'Work on a branch so main stays deployable.' },
        { line: 4, explanation: 'Stage only what belongs in this commit.' },
        { line: 5, explanation: 'Messages in the imperative mood describe what the commit does.' },
        { line: 6, explanation: '-u sets the upstream so later git push needs no arguments.' }
      ],
      expectedResult: 'A new branch appears on GitHub with one commit, ready for a pull request.',
      edgeCases: ['Never commit secrets (.env files); add them to .gitignore before the first commit.', 'git push --force on a shared branch rewrites others\' history — prefer --force-with-lease, and avoid it on main.']
    },
    caseStudy: {
      title: 'Two developers edit the same file',
      problem: 'Asha and Ravi both change the course card component; Ravi\'s merge reports a conflict.',
      data: 'A conflict block with <<<<<<<, ======= and >>>>>>> markers.',
      steps: ['Ravi runs git pull origin main into his branch.', 'He opens the file, keeps the correct combination of both changes and removes the markers.', 'git add the file, git commit to conclude the merge, run the tests, push.'],
      result: 'The pull request merges cleanly with both features intact.',
      limitations: 'Frequent small merges from main reduce the size and pain of conflicts.'
    },
    exercises: [
      {
        id: 'web10-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Which command stages?',
        objective: 'Map commands to Git areas.',
        problem: 'Which command moves a modified file into the staging area?',
        options: ['git commit', 'git add', 'git push', 'git clone'],
        hints: ['Staging comes before committing.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['git add stages; git commit records staged changes; git push uploads commits.'],
        explanation: 'git restore --staged file unstages it again.',
        mistakes: ['Expecting git commit to include unstaged changes (it does not, unless you use -a).'],
        challenge: 'Stage only part of a file with git add -p.'
      },
      {
        id: 'web10-e2', type: 'Short answer', difficulty: 'Beginner',
        title: 'Create and switch',
        objective: 'Use the modern branch command.',
        problem: 'Write the single Git command that creates a new branch named fix/footer and switches to it.',
        hints: ['git switch with a flag (older equivalent: git checkout -b).'],
        check: { type: 'text', accept: ['git switch -c fix/footer', 'git checkout -b fix/footer'] },
        solution: ['git switch -c fix/footer creates the branch from the current commit and switches to it.'],
        explanation: 'git branch fix/footer only creates it without switching.',
        mistakes: ['Forgetting -c, which tries to switch to a branch that does not exist yet.'],
        challenge: 'Delete the branch after it has been merged (git branch -d fix/footer).'
      },
      {
        id: 'web10-e3', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Undo safely',
        objective: 'Choose a safe way to undo a pushed commit.',
        problem: 'A bad commit is already pushed to the shared main branch. What is the safest way to undo its changes?',
        options: ['git reset --hard HEAD~1 then git push --force', 'git revert <commit>', 'Delete the repository', 'git commit --amend'],
        hints: ['Prefer an approach that does not rewrite shared history.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['git revert creates a new commit that applies the inverse change; history stays intact for everyone.'],
        explanation: 'Rewriting pushed history forces every collaborator to repair their local copies.',
        mistakes: ['Force-pushing to main.'],
        challenge: 'When is git commit --amend appropriate? (Only for commits not yet pushed.)'
      }
    ],
    knowledgeCheck: [
      { id: 'web10-k1', question: 'What does git pull do?', options: ['Only downloads', 'fetch + merge (or rebase) into the current branch', 'Uploads commits', 'Deletes branches'], answer: 1, explanation: 'git fetch only downloads; pull also integrates.' },
      { id: 'web10-k2', question: 'Which file lists paths Git should ignore?', options: ['.gitconfig', '.gitignore', '.env', 'README.md'], answer: 1, explanation: 'Add node_modules, build output and secrets there.' },
      { id: 'web10-k3', question: 'What is a pull request?', options: ['A Git command', 'A request on GitHub to review and merge a branch', 'A way to download code', 'A merge conflict'], answer: 1, explanation: 'It is a collaboration feature of hosting platforms, not core Git.' }
    ],
    cheatSheet: ['git status · git add · git commit -m · git push', 'git switch -c branch · git merge · git rebase', 'git log --oneline --graph', 'git revert <sha> (safe undo on shared branches)'],
    references: [
      { title: 'Pro Git book — Git Basics', url: 'https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository', publisher: 'Git project (Scott Chacon, Ben Straub)' },
      { title: 'Pro Git book — Basic Branching and Merging', url: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging', publisher: 'Git project (Scott Chacon, Ben Straub)' },
      { title: 'About pull requests', url: 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests', publisher: 'GitHub Docs' }
    ],
    next: 'Module 11 starts building user interfaces with React.'
  }
};
