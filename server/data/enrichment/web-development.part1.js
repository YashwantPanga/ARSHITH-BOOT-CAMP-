// Additional learning content for Web Development, modules 1–5.
const MDN = 'MDN Web Docs (Mozilla)';

export default {
  'web-mod-1': {
    skills: ['Trace a page load from URL to pixels', 'Read status codes and headers in DevTools', 'Take a URL apart programmatically'],
    prerequisites: ['Using a web browser; no coding required'],
    intuition: {
      analogy: 'Typing a URL is like posting a letter: DNS is the address book that turns a name into a street address (IP), TCP/TLS is the secure courier, HTTP is the language of the letter, and the browser is the person who unpacks the parcel and assembles the furniture (the page).',
      whyItMatters: 'Every performance, security or "it works on my machine" problem in web development lives somewhere on this path. Knowing the stages tells you where to look.'
    },
    workflow: {
      title: 'From URL to rendered page',
      nodes: [
        { id: 'url', label: 'URL entered', detail: 'https://shop.example.com/cart?id=7', input: 'User action', output: 'Scheme, host, path, query' },
        { id: 'dns', label: 'DNS resolution', detail: 'Host name → IP via resolver and caches.', input: 'Host name', output: 'IP address' },
        { id: 'conn', label: 'TCP + TLS', detail: 'Connect to port 443 and negotiate encryption.', input: 'IP address', output: 'Secure connection' },
        { id: 'http', label: 'HTTP request/response', detail: 'GET /cart → 200 OK + HTML.', input: 'Request', output: 'HTML document' },
        { id: 'parse', label: 'Parse HTML/CSS/JS', detail: 'Build DOM and CSSOM; run scripts.', input: 'Resources', output: 'Render tree' },
        { id: 'paint', label: 'Layout & paint', detail: 'Compute geometry and draw pixels.', input: 'Render tree', output: 'Visible page' }
      ],
      edges: [{ from: 'url', to: 'dns' }, { from: 'dns', to: 'conn' }, { from: 'conn', to: 'http' }, { from: 'http', to: 'parse' }, { from: 'parse', to: 'paint' }, { from: 'parse', to: 'http', label: 'CSS/JS/images' }],
      explanation: 'Parsing usually triggers more requests (stylesheets, scripts, images), which is why the Network tab shows many rows for a single page.'
    },
    workedExample: {
      title: 'Taking a URL apart with the URL API',
      language: 'javascript',
      code: "const url = new URL('https://shop.example.com:8443/cart/items?id=7&coupon=SAVE10#summary');\nconsole.log(url.protocol);\nconsole.log(url.hostname, url.port);\nconsole.log(url.pathname);\nconsole.log(url.searchParams.get('coupon'));\nconsole.log(url.hash);",
      lineByLine: [
        { line: 1, explanation: 'The URL constructor parses a full address (available in browsers and Node.js).' },
        { line: 2, explanation: 'protocol includes the trailing colon: "https:".' },
        { line: 3, explanation: 'hostname excludes the port; port is a string.' },
        { line: 5, explanation: 'searchParams decodes query parameters for you.' },
        { line: 6, explanation: 'The fragment (#summary) is never sent to the server.' }
      ],
      expectedOutput: 'https:\nshop.example.com 8443\n/cart/items\nSAVE10\n#summary',
      edgeCases: ['Relative URLs need a base: new URL("../img.png", "https://site.com/a/b/").', 'Spaces and special characters in query values must be encoded; URLSearchParams does it automatically.']
    },
    caseStudy: {
      title: 'Diagnosing a "site is down" report',
      problem: 'Users in one city report the college portal does not load, while it works for staff.',
      data: 'Browser DevTools Network tab and a command-line DNS lookup.',
      steps: ['Check whether the request even starts (DNS error vs HTTP error).', 'Run nslookup portal.example.edu: the old IP is returned for some resolvers after a server move.', 'Lower DNS TTLs before future moves and keep the old server redirecting for a while.'],
      result: 'The issue was a stale DNS record, not the web server — identified in minutes by following the request path.',
      limitations: 'DNS caches outside your control (ISPs, browsers) can keep old records until their TTL expires.'
    },
    exercises: [
      {
        id: 'web1-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'What does DNS do?',
        objective: 'Identify the role of DNS.',
        problem: 'Which step converts arshithbootcamp.com into an IP address?',
        options: ['HTTP', 'DNS resolution', 'TLS handshake', 'HTML parsing'],
        hints: ['It is the "address book" of the internet.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['DNS (Domain Name System) maps human-readable names to IP addresses.'],
        explanation: 'TLS encrypts the connection after the IP is known; HTTP is the request language.',
        mistakes: ['Thinking the browser contacts the website by name directly.'],
        challenge: 'Find the IP of a site you use with nslookup or dig.'
      },
      {
        id: 'web1-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Permanent redirect',
        objective: 'Know common status codes.',
        problem: 'A page has moved permanently to a new URL. Which HTTP status code should the server return? (number)',
        hints: ['3xx codes are redirects; one is "Moved Permanently".'],
        check: { type: 'text', accept: ['301', '308'] },
        solution: ['301 Moved Permanently (or 308, which also preserves the request method).', 'Search engines transfer ranking to the new URL.'],
        explanation: '302/307 are temporary redirects.',
        mistakes: ['Using 302 for permanent moves.'],
        challenge: 'Which code means "Not Modified" when the browser cache is still valid? (304)'
      },
      {
        id: 'web1-e3', type: 'JavaScript coding', difficulty: 'Intermediate', language: 'javascript',
        title: 'Read query parameters',
        objective: 'Use URL and URLSearchParams.',
        problem: 'Print the course id, the page number plus 1, and the number of query parameters for the URL below. Expected output:\npython\n3\n3',
        starterCode: "const link = 'https://arshith.example/courses?course=python&page=2&sort=rating';\n\n// use new URL(...) and its searchParams\n",
        hints: ["const u = new URL(link);", "Number(u.searchParams.get('page')) + 1", '[...u.searchParams].length counts the pairs.'],
        check: { type: 'output', expectedOutput: 'python\n3\n3' },
        solutionCode: "const link = 'https://arshith.example/courses?course=python&page=2&sort=rating';\n\nconst u = new URL(link);\nconsole.log(u.searchParams.get('course'));\nconsole.log(Number(u.searchParams.get('page')) + 1);\nconsole.log([...u.searchParams].length);",
        solution: ['Parse once with new URL.', 'Query values are strings; convert page with Number before adding.', 'Spread the searchParams iterator to count the entries.'],
        explanation: 'Without Number(), "2" + 1 would give the string "21".',
        mistakes: ['Splitting the string on "&" manually, which breaks on encoded values.'],
        challenge: 'Change page to 5 with searchParams.set and print the new URL.'
      }
    ],
    knowledgeCheck: [
      { id: 'web1-k1', question: 'Which part of a URL is not sent to the server?', options: ['Path', 'Query string', 'Fragment (#…)', 'Host'], answer: 2, explanation: 'The fragment is handled only by the browser.' },
      { id: 'web1-k2', question: 'A 500 status code indicates…', options: ['A client error', 'A server error', 'A redirect', 'Success'], answer: 1, explanation: '5xx means the server failed to fulfil a valid request.' },
      { id: 'web1-k3', question: 'Which DevTools panel shows request timing and headers?', options: ['Elements', 'Console', 'Network', 'Sources'], answer: 2, explanation: 'Network lists every request with timing, headers and responses.' }
    ],
    cheatSheet: ['URL = scheme://host:port/path?query#fragment', '2xx ok · 3xx redirect · 4xx client error · 5xx server error', 'DevTools: Network (requests), Elements (DOM/CSS), Console (logs)', 'new URL(str).searchParams.get(name)'],
    references: [
      { title: 'How the web works', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works', publisher: MDN },
      { title: 'HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status', publisher: MDN },
      { title: 'URL API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/URL', publisher: MDN }
    ],
    next: 'Module 02 writes the HTML document that the browser parses in the last steps of this diagram.'
  },

  'web-mod-2': {
    skills: ['Write a valid HTML5 document skeleton', 'Choose semantic elements over generic divs', 'Resolve relative and absolute link paths'],
    prerequisites: ['Module 01'],
    intuition: {
      analogy: 'HTML is the structure of a building: walls, rooms, doors and signs. Semantic tags (header, nav, main, article, footer) are labelled rooms — screen readers and search engines can walk straight to "the kitchen" instead of opening every door.',
      whyItMatters: 'Good structure improves accessibility, SEO and maintainability at no extra cost, and every CSS and JavaScript technique later depends on it.'
    },
    workflow: {
      title: 'Anatomy of an HTML5 page',
      nodes: [
        { id: 'doctype', label: '<!doctype html>', detail: 'Selects standards mode.', input: 'File start', output: 'Rendering mode' },
        { id: 'head', label: '<head>', detail: 'charset, viewport, title, description, links to CSS.', input: 'Metadata', output: 'Information about the page' },
        { id: 'body', label: '<body>', detail: 'Everything users see.', input: 'Content', output: 'Visible document' },
        { id: 'landmarks', label: 'Landmarks', detail: 'header, nav, main, aside, footer.', input: 'Page regions', output: 'Navigable structure' },
        { id: 'content', label: 'Content elements', detail: 'h1–h6, p, a, img (with alt), lists, tables.', input: 'Text and media', output: 'Accessible content' }
      ],
      edges: [{ from: 'doctype', to: 'head' }, { from: 'head', to: 'body' }, { from: 'body', to: 'landmarks' }, { from: 'landmarks', to: 'content' }],
      explanation: 'One <main> per page and a logical heading order (h1 → h2 → h3) let assistive technology present the page as an outline.'
    },
    workedExample: {
      title: 'A minimal semantic page',
      language: 'html',
      code: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Python Course – Arshith Bootcamp</title>\n  <meta name="description" content="Learn Python in 15 modules.">\n</head>\n<body>\n  <header><a href="/">Arshith Bootcamp</a></header>\n  <nav aria-label="Main"><a href="/courses">Courses</a> <a href="/about">About</a></nav>\n  <main>\n    <h1>Python Programming</h1>\n    <p>15 modules, quizzes and a certificate.</p>\n    <img src="images/python.png" alt="Python logo on a laptop screen" width="320" height="180">\n  </main>\n  <footer><small>© 2026 Arshith Bootcamp</small></footer>\n</body>\n</html>',
      lineByLine: [
        { line: 2, explanation: 'lang helps screen readers pronounce text and search engines index it.' },
        { line: 5, explanation: 'The viewport meta tag makes mobile browsers use the device width.' },
        { line: 11, explanation: 'nav marks the main navigation landmark; aria-label names it.' },
        { line: 15, explanation: 'alt text describes the image; width/height reserve space and prevent layout shift.' }
      ],
      expectedResult: 'A page with a header link, a navigation bar, a main heading, a paragraph and an image, followed by a footer. A screen reader lists the banner, navigation, main and content-info landmarks.',
      edgeCases: ['Decorative images should have alt="" so screen readers skip them.', 'Skipping heading levels (h1 → h4) breaks the document outline.']
    },
    caseStudy: {
      title: 'Making a course page screen-reader friendly',
      problem: 'A blind learner reported that a course page "is just a long list of links" and the main content was hard to find.',
      data: 'A page built entirely from <div> elements with click handlers.',
      steps: ['Replace layout divs with header, nav, main and footer.', 'Turn clickable divs into <a> or <button> elements.', 'Add alt text and a single h1.', 'Test with the browser\'s accessibility tree and a screen reader.'],
      result: 'The learner can jump to the main content and navigation with screen-reader shortcuts; the page also ranks better for the course name.',
      limitations: 'Semantics fix structure; colour contrast and keyboard focus styles still need CSS work.'
    },
    exercises: [
      {
        id: 'web2-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Pick the semantic element',
        objective: 'Choose elements by meaning.',
        problem: 'Which element should wrap a blog post that makes sense on its own (could be syndicated)?',
        options: ['<div>', '<section>', '<article>', '<span>'],
        hints: ['It represents self-contained content.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['<article> is for independent, reusable content such as posts, comments or cards.', '<section> groups related content within a page and should have a heading.'],
        explanation: 'div and span carry no meaning; use them only for styling hooks.',
        mistakes: ['Using section for every block.'],
        challenge: 'Mark up a list of three course cards using article elements.'
      },
      {
        id: 'web2-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Resolve a relative path',
        objective: 'Understand relative URLs.',
        problem: 'A page at https://site.com/courses/python/index.html contains <img src="../images/py.png">. What absolute URL does the browser request?',
        hints: ['".." goes up one folder from the page\'s folder (/courses/python/).'],
        check: { type: 'text', accept: ['https://site.com/courses/images/py.png'] },
        solution: ['The page\'s folder is /courses/python/.', '".." moves to /courses/.', 'Result: https://site.com/courses/images/py.png'],
        explanation: 'A leading slash (/images/py.png) would instead start from the site root.',
        mistakes: ['Going up two levels and answering /images/py.png.'],
        challenge: 'Check your answer with new URL("../images/py.png", pageUrl).href in the Practice Lab.'
      },
      {
        id: 'web2-e3', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'SEO metadata',
        objective: 'Know which tags affect search results and sharing.',
        problem: 'Which tag controls the image shown when a course link is shared on social media?',
        options: ['<meta name="keywords">', '<meta property="og:image">', '<link rel="icon">', '<img alt>'],
        hints: ['It is part of the Open Graph protocol.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['og:image (Open Graph) is read by most social platforms when generating link previews.'],
        explanation: 'The keywords meta tag is ignored by major search engines today.',
        mistakes: ['Expecting the favicon to be used as the preview image.'],
        challenge: 'Write og:title and og:description tags for this course.'
      }
    ],
    knowledgeCheck: [
      { id: 'web2-k1', question: 'How many <main> elements should a page have (visible at once)?', options: ['None', 'One', 'One per section', 'Unlimited'], answer: 1, explanation: 'Only one visible main landmark per page.' },
      { id: 'web2-k2', question: 'Which attribute opens a link in a new tab?', options: ['rel="external"', 'target="_blank"', 'href="new"', 'open="tab"'], answer: 1, explanation: 'Add rel="noopener" for security with target="_blank".' },
      { id: 'web2-k3', question: 'What does <meta charset="utf-8"> do?', options: ['Sets the font', 'Declares the character encoding', 'Improves SEO ranking', 'Enables JavaScript'], answer: 1, explanation: 'It tells the browser how to decode bytes into characters.' }
    ],
    cheatSheet: ['<!doctype html><html lang="en">', '<meta charset="utf-8">, <meta name="viewport" …>', 'header · nav · main · article · section · aside · footer', 'img: alt, width, height · a: href, target, rel'],
    references: [
      { title: 'Structuring documents', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents', publisher: MDN },
      { title: 'HTML elements reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements', publisher: MDN },
      { title: 'The Open Graph protocol', url: 'https://ogp.me/', publisher: 'Open Graph protocol' }
    ],
    next: 'Module 03 adds forms and media so pages can collect input and show images and video responsively.'
  },

  'web-mod-3': {
    skills: ['Build accessible forms with labels and fieldsets', 'Choose GET or POST correctly', 'Serve responsive images with srcset and <picture>'],
    prerequisites: ['HTML structure (Module 02)'],
    intuition: {
      analogy: 'A form is a paper application: each field needs a printed label next to it (label), related questions are boxed together (fieldset with legend), and the envelope type matters — a postcard (GET) is fine for a search term, but a sealed envelope (POST) is right for a password.',
      whyItMatters: 'Forms are how users sign up, pay and enrol. Unlabelled or inaccessible forms lose users; wrong methods leak data into URLs and logs.'
    },
    workflow: {
      title: 'Form submission flow',
      nodes: [
        { id: 'fill', label: 'User fills fields', detail: 'Labels, input types and autocomplete help.', input: 'User input', output: 'Field values' },
        { id: 'validate', label: 'Built-in validation', detail: 'required, type="email", min, pattern.', input: 'Field values', output: 'Valid / show errors' },
        { id: 'encode', label: 'Encode', detail: 'urlencoded or multipart/form-data (files).', input: 'Valid values', output: 'Request body or query' },
        { id: 'send', label: 'GET or POST', detail: 'GET appends to URL; POST puts data in the body.', input: 'Encoded data', output: 'HTTP request' },
        { id: 'server', label: 'Server validation', detail: 'Never trust the client; re-validate.', input: 'Request', output: 'Response / errors' }
      ],
      edges: [{ from: 'fill', to: 'validate' }, { from: 'validate', to: 'encode', label: 'valid' }, { from: 'validate', to: 'fill', label: 'errors' }, { from: 'encode', to: 'send' }, { from: 'send', to: 'server' }],
      explanation: 'Browser validation improves the experience; server validation provides the security.'
    },
    workedExample: {
      title: 'An accessible enrolment form',
      language: 'html',
      code: '<form action="/enrol" method="post">\n  <fieldset>\n    <legend>Your details</legend>\n    <label for="name">Full name</label>\n    <input id="name" name="name" autocomplete="name" required>\n\n    <label for="email">Email</label>\n    <input id="email" name="email" type="email" autocomplete="email" required>\n  </fieldset>\n  <fieldset>\n    <legend>Batch</legend>\n    <label><input type="radio" name="batch" value="am" checked> Morning</label>\n    <label><input type="radio" name="batch" value="pm"> Evening</label>\n  </fieldset>\n  <button type="submit">Enrol</button>\n</form>',
      lineByLine: [
        { line: 1, explanation: 'POST because the form creates an enrolment and sends personal data.' },
        { line: 4, explanation: 'for="name" links the label to the input; clicking the label focuses the field.' },
        { line: 8, explanation: 'type="email" gives the right mobile keyboard and basic validation.' },
        { line: 12, explanation: 'Radio buttons with the same name form one group; wrapping in a label also links them.' }
      ],
      expectedResult: 'Submitting with an empty or malformed email shows the browser\'s validation message; a valid submission sends name, email and batch in the request body.',
      edgeCases: ['Placeholder text is not a substitute for a label — it disappears while typing.', 'File uploads require enctype="multipart/form-data".']
    },
    caseStudy: {
      title: 'Halving form abandonment',
      problem: 'Analytics showed 60% of mobile users abandoned the sign-up form.',
      data: 'A 9-field form with placeholder-only labels and generic text inputs.',
      steps: ['Remove optional fields and group the rest in fieldsets.', 'Add visible labels, correct input types (tel, email) and autocomplete attributes.', 'Show errors next to the field instead of in an alert.'],
      result: 'Mobile keyboards match each field, browsers autofill details, and completion improves substantially in follow-up measurements.',
      limitations: 'Improvements must be measured with your own analytics; results vary by audience.'
    },
    exercises: [
      {
        id: 'web3-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'GET or POST?',
        objective: 'Choose the HTTP method for a form.',
        problem: 'Which form should use method="get"?',
        options: ['Login form', 'Course search box', 'Payment form', 'Password reset form'],
        hints: ['GET puts the values in the URL, which can be bookmarked and appear in logs.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['Search terms are safe to show in the URL and sharing a results link is useful.', 'Logins, payments and resets contain sensitive data and change state: use POST.'],
        explanation: 'GET requests should be safe (no side effects) and idempotent.',
        mistakes: ['Using GET for login, which leaks the password into history and server logs.'],
        challenge: 'Build the search form so it submits ?q=python to /courses.'
      },
      {
        id: 'web3-e2', type: 'Short answer', difficulty: 'Beginner',
        title: 'Link a label',
        objective: 'Associate labels with inputs.',
        problem: 'An input has id="phone". Which attribute on the <label> links it to that input? (attribute name)',
        hints: ['In JavaScript the same property is called htmlFor.'],
        check: { type: 'text', accept: ['for', 'for="phone"'] },
        solution: ['<label for="phone">Phone</label> associates the label with the input whose id is phone.'],
        explanation: 'Alternatively, wrap the input inside the label element.',
        mistakes: ['Using name instead of id for the association.'],
        challenge: 'Add inputmode and autocomplete attributes suitable for a phone number.'
      },
      {
        id: 'web3-e3', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Responsive images',
        objective: 'Pick the right responsive-image technique.',
        problem: 'You want a cropped square image on phones and a wide banner on desktops (different compositions). What should you use?',
        options: ['<img srcset> with width descriptors', '<picture> with <source media="…">', 'CSS background-size: cover only', 'Two <img> tags hidden with CSS'],
        hints: ['Changing the crop is called "art direction".'],
        check: { type: 'mcq', answer: 1 },
        solution: ['<picture> lets you choose a different image per media condition (art direction).', 'srcset alone serves the same image at different resolutions.'],
        explanation: 'Hiding images with CSS still downloads both.',
        mistakes: ['Using srcset for art direction.'],
        challenge: 'Write a <picture> element with an AVIF source and a JPEG fallback.'
      }
    ],
    knowledgeCheck: [
      { id: 'web3-k1', question: 'Which attribute makes a field mandatory?', options: ['mandatory', 'required', 'validate', 'needed'], answer: 1, explanation: 'required triggers built-in validation.' },
      { id: 'web3-k2', question: 'Which enctype is needed for file uploads?', options: ['text/plain', 'application/json', 'multipart/form-data', 'none'], answer: 2, explanation: 'Files are sent as separate parts of the body.' },
      { id: 'web3-k3', question: 'What should a <video> element include for accessibility?', options: ['autoplay', 'Captions via <track kind="captions">', 'A border', 'loop'], answer: 1, explanation: 'Captions serve deaf and hard-of-hearing users and noisy environments.' }
    ],
    cheatSheet: ['<label for="id"> + <input id="id" name="…">', 'type: email, tel, number, date, password; autocomplete=…', 'method="get" for searches, "post" for changes', '<picture><source media srcset><img alt></picture>'],
    references: [
      { title: 'Web forms — Your first form', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Your_first_form', publisher: MDN },
      { title: 'Sending form data', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Sending_and_retrieving_form_data', publisher: MDN },
      { title: 'Responsive images', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images', publisher: MDN }
    ],
    next: 'Module 04 styles these structures with CSS.'
  },

  'web-mod-4': {
    skills: ['Predict which rule wins using specificity and the cascade', 'Calculate element size with the box model', 'Build a theme with CSS custom properties'],
    prerequisites: ['HTML structure (Module 02)'],
    intuition: {
      analogy: 'The cascade is a set of tie-break rules in a debate: more specific arguments beat general ones, and if two are equally specific, the one spoken last wins. Inheritance is family resemblance — children get some traits (font, colour) from their parent unless they declare their own.',
      whyItMatters: 'Most "my CSS is not working" moments are specificity or box-model surprises. Understanding them replaces trial-and-error and !important hacks.'
    },
    workflow: {
      title: 'How the browser decides a property value',
      nodes: [
        { id: 'collect', label: 'Collect matching declarations', detail: 'From browser defaults, your stylesheets and inline styles.', input: 'Element', output: 'Candidate values' },
        { id: 'origin', label: 'Origin & importance', detail: '!important and author vs user agent styles.', input: 'Candidates', output: 'Filtered candidates' },
        { id: 'spec', label: 'Specificity', detail: 'ID > class/attribute/pseudo-class > element.', input: 'Remaining', output: 'Most specific' },
        { id: 'order', label: 'Source order', detail: 'Later declaration wins ties.', input: 'Equal specificity', output: 'Winner' },
        { id: 'inherit', label: 'Inheritance / initial', detail: 'If nothing applies, inherit (e.g. color) or use the initial value.', input: 'No declaration', output: 'Computed value' }
      ],
      edges: [{ from: 'collect', to: 'origin' }, { from: 'origin', to: 'spec' }, { from: 'spec', to: 'order', label: 'tie' }, { from: 'collect', to: 'inherit', label: 'nothing matches' }],
      explanation: 'DevTools → Elements → Styles shows this process: overridden declarations appear struck through.'
    },
    workedExample: {
      title: 'Specificity and the box model',
      language: 'html',
      code: '<style>\n  :root { --brand: #013A2B; }\n  p { color: gray; }\n  .note { color: var(--brand); }\n  #intro.note { color: crimson; }\n  .box { width: 200px; padding: 20px; border: 5px solid; }\n  .box.bb { box-sizing: border-box; }\n</style>\n<p id="intro" class="note">Crimson wins: (1,1,0) beats (0,1,0).</p>\n<div class="box">Total width 250px</div>\n<div class="box bb">Total width 200px</div>',
      lineByLine: [
        { line: 2, explanation: 'A custom property defined on :root is available everywhere via var().' },
        { line: 5, explanation: 'ID + class specificity (1,1,0) beats the class-only rule.' },
        { line: 6, explanation: 'content-box (default): 200 + 2×20 padding + 2×5 border = 250px wide.' },
        { line: 7, explanation: 'border-box: padding and border fit inside the 200px.' }
      ],
      expectedResult: 'The paragraph is crimson. The first box measures 250px wide in DevTools, the second exactly 200px.',
      edgeCases: ['!important overrides normal specificity and makes later overrides painful — reserve it for utilities.', 'Margins of adjacent blocks collapse vertically (the larger one wins), padding never collapses.']
    },
    caseStudy: {
      title: 'Introducing a design-token theme',
      problem: 'A site had 140 hard-coded hex colours; a rebrand required editing dozens of files and still missed some.',
      data: 'Existing stylesheets with repeated colour values.',
      steps: ['Define tokens: --color-primary, --color-surface, --color-text on :root.', 'Replace hard-coded values with var(--token).', 'Add a [data-theme="dark"] block that redefines the same tokens.'],
      result: 'The next rebrand is a change to six lines, and dark mode reuses every component unchanged.',
      limitations: 'Very old browsers without custom-property support need fallbacks (rare today).'
    },
    exercises: [
      {
        id: 'web4-e1', type: 'Short answer', difficulty: 'Beginner',
        title: 'Calculate specificity',
        objective: 'Compute selector specificity.',
        problem: 'What is the specificity of the selector  #nav .item a  ? Answer as three numbers (IDs, classes, elements), e.g. 0,2,1',
        hints: ['Count IDs, then classes/attributes/pseudo-classes, then element names.'],
        check: { type: 'text', accept: ['1,1,1', '1, 1, 1', '(1,1,1)', '(1, 1, 1)', '1 1 1', '1-1-1'] },
        solution: ['#nav → 1 ID.', '.item → 1 class.', 'a → 1 element.', 'Specificity (1,1,1).'],
        explanation: 'Specificity is compared column by column from the left; one ID beats any number of classes.',
        mistakes: ['Adding them into a single number such as 111 and comparing as decimals.'],
        challenge: 'Which wins: .menu .item a or #nav a?'
      },
      {
        id: 'web4-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Box width',
        objective: 'Apply the content-box model.',
        problem: '.card { width: 300px; padding: 16px; border: 2px solid; margin: 10px; } with the default box-sizing. How wide (px) is the visible card including its border?',
        hints: ['content-box: width + left/right padding + left/right border. Margin is outside the visible box.'],
        check: { type: 'numeric', answer: 336, tolerance: 0 },
        solution: ['300 + 16 + 16 + 2 + 2 = 336px.', 'The 10px margins add space around it but are not part of the card itself.'],
        explanation: 'With box-sizing: border-box the visible width would be exactly 300px.',
        mistakes: ['Adding margins (356) or forgetting the second side.'],
        challenge: 'What is the width with box-sizing: border-box? (300)'
      },
      {
        id: 'web4-e3', type: 'Multiple choice', difficulty: 'Intermediate',
        title: 'Which colour is applied?',
        objective: 'Combine specificity and source order.',
        problem: 'p.lead { color: blue; }\n.lead { color: green; }\np.lead { color: red; }\n\nWhat colour is <p class="lead">?',
        options: ['blue', 'green', 'red', 'black'],
        hints: ['Two rules have equal specificity; which comes later?'],
        check: { type: 'mcq', answer: 2 },
        solution: ['p.lead has specificity (0,1,1) and beats .lead (0,1,0).', 'Between the two p.lead rules, the later one (red) wins.'],
        explanation: 'Source order only decides between equally specific declarations.',
        mistakes: ['Choosing green because it is "in the middle".'],
        challenge: 'Add a rule that makes it green without !important or changing the HTML.'
      }
    ],
    knowledgeCheck: [
      { id: 'web4-k1', question: 'Which property is inherited by default?', options: ['border', 'margin', 'color', 'width'], answer: 2, explanation: 'Text properties like color and font-family inherit; box properties do not.' },
      { id: 'web4-k2', question: 'How do you read a custom property --gap?', options: ['$gap', 'var(--gap)', 'gap()', '@gap'], answer: 1, explanation: 'var(--gap, fallback).' },
      { id: 'web4-k3', question: 'Which unit is relative to the root font size?', options: ['em', 'rem', 'px', '%'], answer: 1, explanation: 'rem = root em; em is relative to the element\'s own font size.' }
    ],
    cheatSheet: ['Specificity: (IDs, classes/attrs/pseudo-classes, elements)', '* { box-sizing: border-box; }', ':root { --token: value; } … var(--token)', 'DevTools → Styles / Computed panes'],
    references: [
      { title: 'Cascade, specificity, and inheritance', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts', publisher: MDN },
      { title: 'The box model', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model', publisher: MDN },
      { title: 'Using CSS custom properties (variables)', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties', publisher: MDN }
    ],
    next: 'Module 05 arranges boxes on the page with Flexbox and Grid.'
  },

  'web-mod-5': {
    skills: ['Align items with Flexbox main and cross axes', 'Build two-dimensional layouts with Grid and fr units', 'Choose between Flexbox and Grid'],
    prerequisites: ['Box model (Module 04)'],
    intuition: {
      analogy: 'Flexbox arranges items like books on one shelf — you decide how they share the shelf\'s length and how they line up vertically. Grid is the whole bookcase: rows and columns defined first, then items placed into cells.',
      whyItMatters: 'Modern layouts — navbars, card grids, dashboards — are built with these two tools. They replace fragile floats and absolute positioning.'
    },
    workflow: {
      title: 'Choosing a layout method',
      nodes: [
        { id: 'q', label: 'One dimension or two?', detail: 'Do items flow in a single row/column, or align in rows AND columns?', input: 'Design', output: 'Decision' },
        { id: 'flex', label: 'Flexbox', detail: 'display: flex; justify-content (main), align-items (cross), gap.', input: 'A row or column of items', output: 'Distributed items' },
        { id: 'grid', label: 'Grid', detail: 'grid-template-columns: repeat(3, 1fr); gap.', input: 'Rows and columns', output: 'Aligned 2-D layout' },
        { id: 'wrap', label: 'Responsive behaviour', detail: 'flex-wrap or repeat(auto-fit, minmax(240px, 1fr)).', input: 'Viewport changes', output: 'Layout adapts without media queries' }
      ],
      edges: [{ from: 'q', to: 'flex', label: '1-D' }, { from: 'q', to: 'grid', label: '2-D' }, { from: 'flex', to: 'wrap' }, { from: 'grid', to: 'wrap' }],
      explanation: 'Many pages combine both: Grid for the page skeleton, Flexbox inside each card or toolbar.'
    },
    workedExample: {
      title: 'A responsive card grid with a flex toolbar',
      language: 'html',
      code: '<style>\n  .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; }\n  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }\n  .card { padding: 16px; border: 1px solid #ccc; border-radius: 12px; }\n</style>\n<div class="toolbar"><strong>Courses</strong><button>Filter</button></div>\n<div class="grid">\n  <div class="card">Python</div><div class="card">SQL</div>\n  <div class="card">Web</div><div class="card">AI</div>\n</div>',
      lineByLine: [
        { line: 2, explanation: 'space-between pushes the title and button to opposite ends; align-items centres them vertically.' },
        { line: 3, explanation: 'auto-fit + minmax creates as many 220px+ columns as fit, then stretches them equally.' },
        { line: 3, explanation: 'gap spaces rows and columns without margins on the items.' }
      ],
      expectedResult: 'On a wide screen the four cards sit in one row; as the window narrows they wrap to two columns, then one, with no media queries.',
      edgeCases: ['Flex items shrink by default (flex-shrink: 1); add min-width: 0 to let long text truncate inside them.', 'fr units divide the free space after fixed tracks and gaps are subtracted.']
    },
    caseStudy: {
      title: 'Rebuilding a dashboard layout',
      problem: 'A dashboard built with floats broke whenever a widget\'s content grew, and sidebars overlapped on tablets.',
      data: 'Header, sidebar, main area with 6 widgets, footer.',
      steps: ['Define the page with grid-template-areas: "header header" "sidebar main" "footer footer".', 'Lay widgets out with a nested auto-fit grid.', 'Use flex for each widget\'s title bar.', 'At narrow widths redefine the areas to a single column.'],
      result: 'Widgets grow without overlap and the tablet layout needs only one media query.',
      limitations: 'Very complex interactive layouts (drag-and-drop dashboards) still need JavaScript.'
    },
    exercises: [
      {
        id: 'web5-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Centre horizontally',
        objective: 'Use the main-axis property.',
        problem: 'In a row flex container, which property centres items horizontally?',
        options: ['align-items: center', 'justify-content: center', 'text-align: center', 'place-self: end'],
        hints: ['Horizontal is the main axis when flex-direction is row.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['justify-content aligns along the main axis (horizontal for rows).', 'align-items aligns along the cross axis (vertical for rows).'],
        explanation: 'With flex-direction: column the axes swap.',
        mistakes: ['Using align-items for horizontal centring in a row.'],
        challenge: 'Centre a box both ways using place-items on a grid container.'
      },
      {
        id: 'web5-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'fr arithmetic',
        objective: 'Compute track sizes with fr.',
        problem: 'A 900px-wide grid has grid-template-columns: 1fr 2fr 1fr and column-gap: 20px. How wide (px) is the middle column?',
        hints: ['Subtract the gaps first: there are 2 gaps between 3 columns.', 'Then divide the remaining space into 4 equal fr units.'],
        check: { type: 'numeric', answer: 430, tolerance: 0 },
        solution: ['Free space = 900 − 2×20 = 860px.', '1fr = 860 / 4 = 215px.', 'Middle column = 2fr = 430px.'],
        explanation: 'Gaps are removed before fr units are distributed.',
        mistakes: ['Ignoring the gaps and answering 450.'],
        challenge: 'What changes if the first column is fixed at 100px?'
      },
      {
        id: 'web5-e3', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Stack items vertically',
        objective: 'Change the flex direction.',
        problem: 'Write the CSS declaration that makes a flex container place its children in a vertical column.',
        hints: ['The property controls the main axis direction.'],
        check: { type: 'text', accept: ['flex-direction: column', 'flex-direction:column', 'flex-direction: column;'] },
        solution: ['flex-direction: column; makes the main axis vertical.'],
        explanation: 'After this change, justify-content controls vertical alignment and align-items horizontal.',
        mistakes: ['Writing display: column, which is not a valid value.'],
        challenge: 'Reverse the order visually without changing the HTML.'
      }
    ],
    knowledgeCheck: [
      { id: 'web5-k1', question: 'Which value makes a grid create as many columns as fit?', options: ['repeat(auto-fit, minmax(200px, 1fr))', 'repeat(3, 1fr)', 'auto auto', 'span 3'], answer: 0, explanation: 'auto-fit/auto-fill with minmax creates responsive columns.' },
      { id: 'web5-k2', question: 'Which property sets space between flex or grid items?', options: ['margin', 'gap', 'padding', 'spacing'], answer: 1, explanation: 'gap works for both flex and grid.' },
      { id: 'web5-k3', question: 'position: sticky elements stick relative to…', options: ['The viewport always', 'Their nearest scrolling ancestor', 'The body only', 'Nothing'], answer: 1, explanation: 'Sticky positioning works within the nearest scroll container.' }
    ],
    cheatSheet: ['display: flex; justify-content; align-items; gap; flex-wrap', 'flex: 1 1 0 (grow shrink basis)', 'display: grid; grid-template-columns: repeat(auto-fit, minmax(…, 1fr))', 'grid-template-areas for named layouts'],
    references: [
      { title: 'Flexbox', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox', publisher: MDN },
      { title: 'CSS grid layout', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids', publisher: MDN },
      { title: 'Basic concepts of grid layout', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout', publisher: MDN }
    ],
    next: 'Module 06 makes these layouts adapt to every screen size and user preference.'
  }
};
