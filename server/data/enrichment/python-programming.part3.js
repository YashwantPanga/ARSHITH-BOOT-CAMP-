// Additional learning content for Python Programming, modules 11–15.
const PY_DOCS = 'Python Software Foundation';

export default {
  'py-mod-11': {
    skills: ['Model a real entity as a class with attributes and methods', 'Use inheritance and method overriding', 'Implement __str__ and __repr__'],
    prerequisites: ['Functions (Module 06)', 'Dictionaries (Module 07)'],
    intuition: {
      analogy: 'A class is a blueprint for a house; each object is an actual house built from it. All houses share the design (methods), but each has its own paint colour and number of residents (attributes). `self` is simply "this particular house".',
      whyItMatters: 'As programs grow, keeping data and the functions that change it together prevents inconsistent updates — for example, a bank balance that can only change through deposit() and withdraw().'
    },
    workflow: {
      title: 'From class definition to object behaviour',
      nodes: [
        { id: 'cls', label: 'class Account', detail: 'Defines attributes and methods once.', input: 'Design', output: 'A class object' },
        { id: 'new', label: 'Account("Asha", 500)', detail: 'Calling the class creates a new instance.', input: 'Constructor arguments', output: 'Empty object' },
        { id: 'init', label: '__init__(self, …)', detail: 'Initialises instance attributes on self.', input: 'self + arguments', output: 'Ready object' },
        { id: 'method', label: 'acct.deposit(200)', detail: 'Python calls Account.deposit(acct, 200).', input: 'Object + arguments', output: 'Updated state' },
        { id: 'sub', label: 'class Savings(Account)', detail: 'Inherits methods and can override them.', input: 'Parent class', output: 'Specialised behaviour' }
      ],
      edges: [{ from: 'cls', to: 'new' }, { from: 'new', to: 'init' }, { from: 'init', to: 'method' }, { from: 'cls', to: 'sub', label: 'inherit' }],
      explanation: 'Method calls on an object are translated into function calls with the object passed as self — that is the whole "magic" of methods.'
    },
    workedExample: {
      title: 'A small account hierarchy',
      language: 'python',
      code: 'class Account:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def deposit(self, amount):\n        if amount <= 0:\n            raise ValueError("amount must be positive")\n        self.balance += amount\n\n    def __str__(self):\n        return f"{self.owner}: ₹{self.balance}"\n\nclass Savings(Account):\n    def __init__(self, owner, balance=0, rate=0.04):\n        super().__init__(owner, balance)\n        self.rate = rate\n\n    def add_interest(self):\n        self.balance = round(self.balance * (1 + self.rate), 2)\n\na = Account("Asha", 500)\na.deposit(200)\ns = Savings("Ravi", 1000)\ns.add_interest()\nprint(a)\nprint(s)\nprint(isinstance(s, Account))',
      lineByLine: [
        { line: 2, explanation: '__init__ runs automatically after the object is created.' },
        { line: 7, explanation: 'Validation inside the method protects the object\'s state.' },
        { line: 11, explanation: '__str__ controls what print(obj) shows.' },
        { line: 16, explanation: 'super().__init__ reuses the parent\'s initialisation instead of copying it.' },
        { line: 27, explanation: 'A Savings object is also an Account (inheritance is an "is-a" relationship).' }
      ],
      expectedOutput: 'Asha: ₹700\nRavi: ₹1040.0\nTrue',
      edgeCases: ['Class attributes defined outside __init__ are shared by all instances — mutable ones (lists) cause surprises.', 'Forgetting self in a method definition raises TypeError: takes 0 positional arguments but 1 was given.']
    },
    caseStudy: {
      title: 'Modelling courses and enrolments',
      problem: 'An admin script tracked courses as parallel lists (names, fees, seats), and an index mismatch once enrolled students into the wrong course.',
      data: 'Course name, fee, seat limit and a list of enrolled students.',
      steps: ['Create class Course with enrol(student) that checks seats.', 'Keep enrolled students in an instance list.', 'Add __repr__ for readable debugging output.'],
      result: 'Each course carries its own data, so mismatched indexes are impossible and seat rules live in one place.',
      limitations: 'Objects live in memory only; persist them with JSON (Module 14) or SQLite (Module 15).'
    },
    exercises: [
      {
        id: 'py11-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'What is self?',
        objective: 'Understand the instance parameter.',
        problem: 'When you call acct.deposit(100), what is passed as self?',
        options: ['The class Account', 'The number 100', 'The object acct', 'Nothing'],
        hints: ['Method calls become Account.deposit(acct, 100).'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Python passes the instance before the other arguments, so self is acct.'],
        explanation: 'self is just a naming convention for that first parameter.',
        mistakes: ['Thinking self refers to the class.'],
        challenge: 'Call the method as Account.deposit(acct, 100) and confirm it behaves the same.'
      },
      {
        id: 'py11-e2', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'Overriding',
        objective: 'Trace method resolution with inheritance.',
        problem: 'class A:\n    def hi(self): return "A"\nclass B(A):\n    def hi(self): return "B" + super().hi()\n\nprint(B().hi())\n\nWhat is printed?',
        hints: ['B.hi runs first and calls the parent version.'],
        check: { type: 'text', accept: ['BA'] },
        solution: ['B().hi() returns "B" + A.hi(self).', 'A.hi returns "A", so the result is "BA".'],
        explanation: 'super() delegates to the next class in the method resolution order.',
        mistakes: ['Answering "B" and forgetting the super() call.'],
        challenge: 'Print B.__mro__ to see the lookup order.'
      },
      {
        id: 'py11-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'A Course class with seat limits',
        objective: 'Encapsulate state and rules in a class.',
        problem: 'Implement Course(name, seats) with enrol(student) returning True if enrolled or False when full, and __str__ returning "Name (enrolled/seats)". Expected output:\nTrue\nTrue\nFalse\nSQL (2/2)',
        starterCode: 'class Course:\n    def __init__(self, name, seats):\n        pass\n\n    def enrol(self, student):\n        pass\n\n    def __str__(self):\n        pass\n\nc = Course("SQL", 2)\nprint(c.enrol("Asha"))\nprint(c.enrol("Ravi"))\nprint(c.enrol("Meena"))\nprint(c)\n',
        hints: ['Store self.students = [] in __init__.', 'Compare len(self.students) with self.seats.'],
        check: { type: 'output', expectedOutput: 'True\nTrue\nFalse\nSQL (2/2)' },
        solutionCode: 'class Course:\n    def __init__(self, name, seats):\n        self.name = name\n        self.seats = seats\n        self.students = []\n\n    def enrol(self, student):\n        if len(self.students) >= self.seats:\n            return False\n        self.students.append(student)\n        return True\n\n    def __str__(self):\n        return f"{self.name} ({len(self.students)}/{self.seats})"\n\nc = Course("SQL", 2)\nprint(c.enrol("Asha"))\nprint(c.enrol("Ravi"))\nprint(c.enrol("Meena"))\nprint(c)',
        solution: ['Create the student list per instance in __init__.', 'Check capacity before appending.', 'Format the summary in __str__.'],
        explanation: 'Defining students = [] at class level would share one list among all courses.',
        mistakes: ['Making students a class attribute.'],
        challenge: 'Prevent the same student from enrolling twice.'
      }
    ],
    knowledgeCheck: [
      { id: 'py11-k1', question: 'Which method is called by print(obj)?', options: ['__init__', '__str__', '__call__', '__len__'], answer: 1, explanation: 'print uses str(obj), which calls __str__ (falling back to __repr__).' },
      { id: 'py11-k2', question: 'Inheritance models which relationship?', options: ['has-a', 'is-a', 'uses-a', 'none'], answer: 1, explanation: 'A Savings account is an Account. Containment ("has-a") is composition.' },
      { id: 'py11-k3', question: 'What does a leading underscore in self._balance signal?', options: ['A private, enforced attribute', 'A convention: internal use', 'A syntax error', 'A class attribute'], answer: 1, explanation: 'Python does not enforce privacy; the underscore is a convention.' }
    ],
    cheatSheet: ['class Name(Parent): def __init__(self, …):', 'super().__init__(…)', '__str__ / __repr__ / __eq__', 'isinstance(obj, Class), @property'],
    references: [
      { title: 'The Python Tutorial — Classes', url: 'https://docs.python.org/3/tutorial/classes.html', publisher: PY_DOCS },
      { title: 'Data model — Special method names', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names', publisher: PY_DOCS },
      { title: 'dataclasses — Data Classes', url: 'https://docs.python.org/3/library/dataclasses.html', publisher: PY_DOCS }
    ],
    next: 'Module 12 returns to text processing with regular expressions, a compact language for patterns.'
  },

  'py-mod-12': {
    skills: ['Write patterns with character classes, quantifiers and groups', 'Use re.findall, re.search and re.sub', 'Avoid greedy-matching surprises'],
    prerequisites: ['String methods (Module 08)'],
    intuition: {
      analogy: 'A regular expression is a description of a shape rather than a fixed word — "three digits, a dash, four digits" — like asking a librarian for "any book whose title starts with The and ends with a year".',
      whyItMatters: 'Extracting emails, dates, IDs or prices from messy text with only find() and split() becomes long and fragile. One well-tested pattern replaces many lines of string code.'
    },
    workflow: {
      title: 'How re.search processes text',
      nodes: [
        { id: 'pat', label: 'Pattern r"…"', detail: 'Raw string so backslashes reach the regex engine unchanged.', input: 'Your description', output: 'Pattern text' },
        { id: 'comp', label: 're.compile', detail: 'Pattern is compiled (and cached).', input: 'Pattern text', output: 'Compiled pattern' },
        { id: 'scan', label: 'Scan the text', detail: 'Engine tries the pattern at each position, backtracking on mismatch.', input: 'Target string', output: 'First match or None' },
        { id: 'groups', label: 'Groups', detail: 'Parentheses capture parts: m.group(1).', input: 'Match object', output: 'Extracted values' },
        { id: 'none', label: 'None', detail: 'No match — check before calling .group().', input: 'No match', output: 'None' }
      ],
      edges: [{ from: 'pat', to: 'comp' }, { from: 'comp', to: 'scan' }, { from: 'scan', to: 'groups', label: 'match' }, { from: 'scan', to: 'none', label: 'no match' }],
      explanation: 'search finds the first match anywhere; match only tries at the start; findall returns every non-overlapping match.'
    },
    workedExample: {
      title: 'Extracting structured data from text',
      language: 'python',
      code: 'import re\n\ntext = "Contact asha.r@example.com or ravi_99@mail.co.in by 2026-04-15; ref INV-2041."\nemails = re.findall(r"[\\w.]+@[\\w.]+\\.\\w+", text)\nprint(emails)\n\nm = re.search(r"(\\d{4})-(\\d{2})-(\\d{2})", text)\nprint(m.group(0), "→ month", m.group(2))\n\nprint(re.sub(r"INV-(\\d+)", r"Invoice #\\1", "ref INV-2041"))\nprint(re.findall(r"<.+?>", "<b>bold</b>"))',
      lineByLine: [
        { line: 4, explanation: '[\\w.]+ matches letters, digits, underscores and dots; findall returns all matches.' },
        { line: 7, explanation: 'Three capture groups for year, month and day.' },
        { line: 8, explanation: 'group(0) is the whole match; group(2) the month.' },
        { line: 10, explanation: '\\1 in the replacement refers to the first captured group.' },
        { line: 11, explanation: '+? is lazy: it matches as little as possible, giving each tag separately.' }
      ],
      expectedOutput: "['asha.r@example.com', 'ravi_99@mail.co.in']\n2026-04-15 → month 04\nref Invoice #2041\n['<b>', '</b>']",
      edgeCases: ['Without the r prefix, "\\b" is a backspace character, not a word boundary.', 'Email validation by regex is never perfect; use it to extract, then confirm by sending a message.']
    },
    caseStudy: {
      title: 'Masking phone numbers in support transcripts',
      problem: 'Chat transcripts must be shared with an analytics vendor without exposing customers\' 10-digit mobile numbers.',
      data: 'Free-text chats where numbers appear as 9876543210, 98765 43210 or +91-98765-43210.',
      steps: ['Write a pattern allowing an optional +91 prefix and optional separators: r"(?:\\+91[-\\s]?)?\\d{5}[-\\s]?\\d{5}".', 'Use re.sub to replace each match with "[PHONE]".', 'Test the pattern on a list of known formats, including non-numbers that must not match.'],
      result: 'All three formats are masked in one pass while order IDs (which have letters) are untouched.',
      limitations: 'Patterns cannot catch every format a human might type; masking should be combined with access controls.'
    },
    exercises: [
      {
        id: 'py12-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Pick the pattern',
        objective: 'Match a fixed-format identifier.',
        problem: 'Which pattern matches roll numbers like CS-2041 (two capital letters, a dash, four digits) and nothing longer?',
        options: [String.raw`[A-Z]+-\d+`, String.raw`^[A-Z]{2}-\d{4}$`, String.raw`\w\w-\d\d\d\d`, String.raw`[A-Z]{2}\d{4}`],
        hints: ['Anchors ^ and $ stop extra characters before or after.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['{2} and {4} fix the lengths.', '^ and $ require the whole string to match.'],
        explanation: 'Without anchors, re.search would also find CS-2041 inside "XCS-20419".',
        mistakes: ['Using \\w, which also allows digits and underscores.'],
        challenge: 'Allow an optional trailing letter such as CS-2041A.'
      },
      {
        id: 'py12-e2', type: 'Predict the output', difficulty: 'Intermediate',
        title: 'Greedy versus lazy',
        objective: 'Predict greedy matching.',
        problem: 'import re\nprint(re.findall(r"\\d+", "a12b345c6"))\n\nWhat is printed?',
        hints: ['\\d+ matches one or more consecutive digits.'],
        check: { type: 'text', accept: ["['12', '345', '6']"] },
        solution: ['Each maximal run of digits becomes one match: 12, 345, 6.', 'findall returns them as strings in a list.'],
        explanation: '+ is greedy, so it consumes all consecutive digits before stopping.',
        mistakes: ["Expecting integers [12, 345, 6]; findall returns strings."],
        challenge: 'Sum the numbers with sum(map(int, …)).'
      },
      {
        id: 'py12-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Extract prices',
        objective: 'Use a capture group and convert matches.',
        problem: 'Extract every rupee amount written as "Rs." followed by a number (with optional decimals) and print the total with two decimals. Expected:\nTotal: 1748.50',
        starterCode: 'import re\ntext = "Book Rs.499, Pen Rs.25.50 and Bag Rs.1224 (discount 10%)"\n\n# find the amounts and print the total\n',
        hints: [String.raw`Pattern: r"Rs\.(\d+(?:\.\d+)?)"`, 'findall returns just the captured group when there is one group.'],
        check: { type: 'output', expectedOutput: 'Total: 1748.50' },
        solutionCode: 'import re\ntext = "Book Rs.499, Pen Rs.25.50 and Bag Rs.1224 (discount 10%)"\n\namounts = re.findall(r"Rs\\.(\\d+(?:\\.\\d+)?)", text)\ntotal = sum(float(a) for a in amounts)\nprint(f"Total: {total:.2f}")',
        solution: ['Escape the dot after Rs so it matches a literal ".".', '(?:…) groups the decimals without capturing them separately.', '499 + 25.50 + 1224 = 1748.50.'],
        explanation: 'The 10% is ignored because it is not preceded by "Rs.".',
        mistakes: ['Using r"\\d+" which also captures 10.', 'Forgetting to escape the dot.'],
        challenge: 'Also accept "₹" as a prefix.'
      }
    ],
    knowledgeCheck: [
      { id: 'py12-k1', question: 'What does \\s match?', options: ['Any letter', 'Any whitespace', 'The letter s', 'A sentence'], answer: 1, explanation: 'Spaces, tabs and newlines.' },
      { id: 'py12-k2', question: 're.match("cat", "concat") returns…', options: ['A match', 'None', 'An error', '"cat"'], answer: 1, explanation: 'match only checks at the start of the string; use search to look anywhere.' },
      { id: 'py12-k3', question: 'Which flag makes matching case-insensitive?', options: ['re.M', 're.I', 're.S', 're.X'], answer: 1, explanation: 're.IGNORECASE (re.I).' }
    ],
    cheatSheet: [String.raw`\d \w \s . — digit, word char, whitespace, any`, String.raw`+ * ? {n,m} — quantifiers; +? lazy`, '( ) group, (?: ) non-capturing, | alternation', 're.search / re.findall / re.sub / re.compile'],
    references: [
      { title: 'Regular Expression HOWTO', url: 'https://docs.python.org/3/howto/regex.html', publisher: PY_DOCS },
      { title: 're — Regular expression operations', url: 'https://docs.python.org/3/library/re.html', publisher: PY_DOCS }
    ],
    next: 'Module 13 applies text parsing to data fetched over the network.'
  },

  'py-mod-13': {
    skills: ['Explain the TCP/IP and HTTP request–response cycle', 'Parse an HTTP response and HTML with the standard library', 'Scrape responsibly (robots.txt, rate limits)'],
    prerequisites: ['Strings and regular expressions (Modules 08, 12)'],
    intuition: {
      analogy: 'TCP is a reliable phone line between two computers; HTTP is the polite script both sides follow on that line: "GET /page please" — "200 OK, here it is". A socket is the handset you hold.',
      whyItMatters: 'Data rarely lives only on your machine. Understanding what happens under requests.get() makes timeouts, status codes and encoding problems understandable instead of mysterious.'
    },
    workflow: {
      title: 'Fetching a web page',
      nodes: [
        { id: 'dns', label: 'DNS lookup', detail: 'Hostname → IP address.', input: 'example.com', output: 'IP address' },
        { id: 'tcp', label: 'TCP connection (port 443/80)', detail: 'socket.connect(); TLS handshake for HTTPS.', input: 'IP + port', output: 'Open connection' },
        { id: 'req', label: 'HTTP request', detail: 'GET /path HTTP/1.1 + headers (Host, User-Agent).', input: 'Connection', output: 'Bytes sent' },
        { id: 'resp', label: 'HTTP response', detail: 'Status line, headers, blank line, body.', input: 'Server work', output: 'Bytes received' },
        { id: 'parse', label: 'Decode & parse', detail: 'Bytes → str (charset) → HTML parser extracts data.', input: 'Body bytes', output: 'Structured data' }
      ],
      edges: [{ from: 'dns', to: 'tcp' }, { from: 'tcp', to: 'req' }, { from: 'req', to: 'resp' }, { from: 'resp', to: 'parse' }],
      explanation: 'urllib and requests perform all five steps for you; sockets let you see each one. Status codes in the response tell you whether parsing should even start.'
    },
    workedExample: {
      title: 'Parsing a raw HTTP response and its HTML (no network needed)',
      language: 'python',
      code: 'from html.parser import HTMLParser\n\nraw = (b"HTTP/1.1 200 OK\\r\\nContent-Type: text/html; charset=utf-8\\r\\n\\r\\n"\n       b"<html><body><h1>Courses</h1><a href=\'/py\'>Python</a><a href=\'/sql\'>SQL</a></body></html>")\n\nhead, body = raw.split(b"\\r\\n\\r\\n", 1)\nstatus = head.split(b"\\r\\n")[0].decode()\nprint(status)\n\nclass LinkParser(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.links = []\n    def handle_starttag(self, tag, attrs):\n        if tag == "a":\n            self.links.append(dict(attrs).get("href"))\n\np = LinkParser()\np.feed(body.decode("utf-8"))\nprint(p.links)',
      lineByLine: [
        { line: 3, explanation: 'A real server sends exactly this kind of byte stream.' },
        { line: 6, explanation: 'Headers and body are separated by an empty line (\\r\\n\\r\\n).' },
        { line: 7, explanation: 'The first header line is the status line.' },
        { line: 10, explanation: 'HTMLParser calls handle_starttag for every opening tag.' },
        { line: 19, explanation: 'Decode bytes using the charset from Content-Type before parsing.' }
      ],
      expectedOutput: "HTTP/1.1 200 OK\n['/py', '/sql']",
      edgeCases: ['Always set a timeout on network calls; the default can wait forever.', 'Check status codes: 404/500 pages are also HTML and will parse without errors.']
    },
    caseStudy: {
      title: 'Tracking a public notice board',
      problem: 'A student wants to know when a university results page adds a new notice, without refreshing it manually.',
      data: 'A public HTML page that lists notices as links.',
      steps: ['Check robots.txt and the site\'s terms before scraping.', 'Fetch the page with urllib.request and a timeout, at most every few hours.', 'Extract link texts with HTMLParser and compare with the previous run saved in a file.', 'Print or e-mail only the new notices.'],
      result: 'A short script replaces repeated manual checks and puts negligible load on the site.',
      limitations: 'Page layouts change and break scrapers; if the site offers an RSS feed or API (Module 14), prefer that.'
    },
    exercises: [
      {
        id: 'py13-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Status codes',
        objective: 'Interpret HTTP status classes.',
        problem: 'A request returns status 404. What does it mean?',
        options: ['Success', 'Redirect', 'Client error: resource not found', 'Server crashed'],
        hints: ['4xx codes are client-side problems.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['2xx success, 3xx redirect, 4xx client error, 5xx server error.', '404 = Not Found.'],
        explanation: 'Your request was valid HTTP, but the path does not exist on that server.',
        mistakes: ['Treating any response as success and parsing an error page.'],
        challenge: 'Which code means you are sending too many requests? (429)'
      },
      {
        id: 'py13-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Header/body separator',
        objective: 'Know the HTTP message structure.',
        problem: 'In an HTTP/1.1 response, what byte sequence separates the headers from the body? (Write it using \\r and \\n.)',
        hints: ['Each header line ends with \\r\\n; the end of headers adds one more.'],
        check: { type: 'text', accept: ['\\r\\n\\r\\n', 'crlf crlf', 'crlfcrlf'] },
        solution: ['Each header line ends with CRLF (\\r\\n).', 'An empty line — a second CRLF — marks the end of the headers: \\r\\n\\r\\n.'],
        explanation: 'This is defined by the HTTP/1.1 message syntax.',
        mistakes: ['Answering just \\n\\n; servers send CRLF pairs.'],
        challenge: 'Parse the Content-Type header value from a raw response.'
      },
      {
        id: 'py13-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Extract headings from HTML',
        objective: 'Use HTMLParser to collect text inside tags.',
        problem: 'Print every <h2> text from the HTML, one per line. Expected:\nSyllabus\nProjects',
        starterCode: 'from html.parser import HTMLParser\n\nhtml = "<h1>Python</h1><h2>Syllabus</h2><p>15 modules</p><h2>Projects</h2>"\n\n# write a parser that collects text inside h2 tags\n',
        hints: ['Track whether you are inside an h2 with a flag set in handle_starttag and cleared in handle_endtag.', 'Collect text in handle_data when the flag is set.'],
        check: { type: 'output', expectedOutput: 'Syllabus\nProjects' },
        solutionCode: 'from html.parser import HTMLParser\n\nhtml = "<h1>Python</h1><h2>Syllabus</h2><p>15 modules</p><h2>Projects</h2>"\n\nclass H2Parser(HTMLParser):\n    def __init__(self):\n        super().__init__()\n        self.inside = False\n        self.found = []\n    def handle_starttag(self, tag, attrs):\n        if tag == "h2":\n            self.inside = True\n    def handle_endtag(self, tag):\n        if tag == "h2":\n            self.inside = False\n    def handle_data(self, data):\n        if self.inside:\n            self.found.append(data)\n\np = H2Parser()\np.feed(html)\nprint("\\n".join(p.found))',
        solution: ['Use a boolean flag to know when you are inside an h2.', 'Collect data only while the flag is True.'],
        explanation: 'HTMLParser is event-based: it calls your methods as it walks through the document.',
        mistakes: ['Using a regex on HTML; it breaks on nested or attribute-heavy markup.'],
        challenge: 'Also collect the href of every link that appears inside a <nav>.'
      }
    ],
    knowledgeCheck: [
      { id: 'py13-k1', question: 'Which default port does HTTPS use?', options: ['80', '21', '443', '8080'], answer: 2, explanation: 'HTTP uses 80 and HTTPS uses 443.' },
      { id: 'py13-k2', question: 'What does urllib.request.urlopen(url).read() return?', options: ['str', 'bytes', 'dict', 'HTML object'], answer: 1, explanation: 'Network data is bytes; decode it with the page\'s charset.' },
      { id: 'py13-k3', question: 'What should you check before scraping a site?', options: ['robots.txt and terms of use', 'Only the page title', 'Nothing', 'The server\'s CPU'], answer: 0, explanation: 'Respect the site\'s rules and keep request rates low.' }
    ],
    cheatSheet: ['urllib.request.urlopen(url, timeout=10)', 'resp.status, resp.headers, resp.read().decode()', 'html.parser.HTMLParser — handle_starttag / handle_data', 'Respect robots.txt; add delays between requests'],
    references: [
      { title: 'socket — Low-level networking interface', url: 'https://docs.python.org/3/library/socket.html', publisher: PY_DOCS },
      { title: 'urllib.request — Extensible library for opening URLs', url: 'https://docs.python.org/3/library/urllib.request.html', publisher: PY_DOCS },
      { title: 'html.parser — Simple HTML and XHTML parser', url: 'https://docs.python.org/3/library/html.parser.html', publisher: PY_DOCS },
      { title: 'An overview of HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview', publisher: 'MDN Web Docs (Mozilla)' }
    ],
    next: 'Module 14 replaces fragile scraping with structured web services that return XML or JSON.'
  },

  'py-mod-14': {
    skills: ['Parse and generate JSON and XML', 'Map JSON types to Python types', 'Call a REST API and handle its responses'],
    prerequisites: ['Dictionaries and lists (Module 07)', 'HTTP basics (Module 13)'],
    intuition: {
      analogy: 'Scraping is reading a printed newspaper to copy share prices; a web service is the stock exchange sending you a neatly labelled spreadsheet. JSON and XML are two formats for that spreadsheet.',
      whyItMatters: 'Payments, maps, weather, AI models and most modern platforms are accessed through REST APIs that exchange JSON.'
    },
    workflow: {
      title: 'A REST API round trip',
      nodes: [
        { id: 'build', label: 'Build request', detail: 'URL + query parameters (urllib.parse.urlencode), headers, optional JSON body.', input: 'Python values', output: 'HTTP request' },
        { id: 'send', label: 'Send (GET/POST/PUT/DELETE)', detail: 'Verb expresses the action on a resource.', input: 'HTTP request', output: 'HTTP response' },
        { id: 'status', label: 'Check status', detail: '2xx → continue; 4xx/5xx → handle error.', input: 'Response', output: 'OK or error path' },
        { id: 'decode', label: 'json.loads', detail: 'JSON text → dict/list.', input: 'Response body', output: 'Python objects' },
        { id: 'use', label: 'Use the data', detail: 'Navigate keys, validate, store.', input: 'dict/list', output: 'Application result' }
      ],
      edges: [{ from: 'build', to: 'send' }, { from: 'send', to: 'status' }, { from: 'status', to: 'decode', label: '2xx' }, { from: 'decode', to: 'use' }],
      explanation: 'Treat the response as untrusted input: check the status, then check that the keys you need exist.'
    },
    workedExample: {
      title: 'JSON and XML from the same data',
      language: 'python',
      code: 'import json\nimport xml.etree.ElementTree as ET\n\npayload = \'{"course": "Python", "modules": 15, "free": true, "tags": ["beginner", "data"], "mentor": null}\'\ndata = json.loads(payload)\nprint(type(data["free"]).__name__, data["mentor"], data["tags"][1])\nprint(json.dumps({"ok": True, "count": 2}, sort_keys=True))\n\nxml = "<courses><course id=\'py\' modules=\'15\'>Python</course><course id=\'sql\' modules=\'15\'>SQL</course></courses>"\nroot = ET.fromstring(xml)\nfor c in root.findall("course"):\n    print(c.get("id"), c.text, int(c.get("modules")))',
      lineByLine: [
        { line: 5, explanation: 'json.loads converts JSON text to Python objects.' },
        { line: 6, explanation: 'JSON true → True (bool), null → None, arrays → lists.' },
        { line: 7, explanation: 'json.dumps goes the other way; sort_keys makes output stable.' },
        { line: 10, explanation: 'ET.fromstring parses XML into an element tree.' },
        { line: 12, explanation: 'Attributes are read with get(); they are always strings.' }
      ],
      expectedOutput: 'bool None data\n{"count": 2, "ok": true}\npy Python 15\nsql SQL 15',
      edgeCases: ['JSON keys are always strings: json.dumps({1: "a"}) produces {"1": "a"}.', 'Never parse untrusted XML with features that resolve external entities; the standard library warns about XML vulnerabilities.']
    },
    caseStudy: {
      title: 'Showing live currency rates in a fee calculator',
      problem: 'International students want fees displayed in their own currency.',
      data: 'A public exchange-rate API returning JSON such as {"base": "INR", "rates": {"USD": 0.012}}.',
      steps: ['Request the latest rates once per hour and cache them in a file.', 'Check response.status == 200 and that "rates" exists.', 'Multiply the INR fee by the selected rate and round to 2 decimals.'],
      result: 'Students see approximate local prices; the API is called 24 times a day instead of once per page view.',
      limitations: 'Rates are indicative; the payment provider\'s rate at checkout may differ, so label displayed values as approximate.'
    },
    exercises: [
      {
        id: 'py14-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'JSON type mapping',
        objective: 'Map JSON values to Python types.',
        problem: 'After json.loads(\'{"a": [1, 2], "b": null}\'), what is the type of data["b"]?',
        options: ['str', 'NoneType', 'list', 'bool'],
        hints: ['JSON null maps to Python None.'],
        check: { type: 'mcq', answer: 1 },
        solution: ['null becomes None, whose type is NoneType.'],
        explanation: 'object→dict, array→list, string→str, number→int/float, true/false→bool, null→None.',
        mistakes: ['Expecting the string "null".'],
        challenge: 'What does json.dumps(None) return? ("null")'
      },
      {
        id: 'py14-e2', type: 'Short answer', difficulty: 'Intermediate',
        title: 'Choose the HTTP verb',
        objective: 'Match REST verbs to actions.',
        problem: 'Which HTTP method should a REST API use to create a new student record at /students?',
        hints: ['GET reads, DELETE removes, PUT replaces a known resource.'],
        check: { type: 'text', accept: ['POST'] },
        solution: ['POST to the collection (/students) creates a new member and usually returns 201 Created.'],
        explanation: 'PUT /students/42 replaces a specific record; POST /students lets the server assign the id.',
        mistakes: ['Using GET with query parameters to create data — GET must not change state.'],
        challenge: 'Which status code should the API return when the email already exists? (409 Conflict)'
      },
      {
        id: 'py14-e3', type: 'Python coding', difficulty: 'Intermediate', language: 'python',
        title: 'Summarise an API response',
        objective: 'Navigate nested JSON safely.',
        problem: 'Parse the JSON and print each course title with its average rating to 1 decimal, skipping courses with no ratings. Expected:\nPython: 4.5\nWeb: 4.0',
        starterCode: 'import json\nresponse = \'{"courses": [{"title": "Python", "ratings": [5, 4, 5, 4]}, {"title": "SQL", "ratings": []}, {"title": "Web", "ratings": [4]}]}\'\n\n# parse and print\n',
        hints: ['data = json.loads(response)', 'for c in data["courses"]: if not c["ratings"]: continue'],
        check: { type: 'output', expectedOutput: 'Python: 4.5\nWeb: 4.0' },
        solutionCode: 'import json\nresponse = \'{"courses": [{"title": "Python", "ratings": [5, 4, 5, 4]}, {"title": "SQL", "ratings": []}, {"title": "Web", "ratings": [4]}]}\'\n\ndata = json.loads(response)\nfor c in data["courses"]:\n    ratings = c.get("ratings") or []\n    if not ratings:\n        continue\n    print(f"{c[\'title\']}: {sum(ratings) / len(ratings):.1f}")',
        solution: ['json.loads gives a dict with a "courses" list.', 'Skip empty rating lists to avoid ZeroDivisionError.', 'Format the average with :.1f.'],
        explanation: 'c.get("ratings") or [] also handles a missing or null ratings key.',
        mistakes: ['Dividing by len([]) and crashing on SQL.'],
        challenge: 'Output the result as JSON with json.dumps(indent=2).'
      }
    ],
    knowledgeCheck: [
      { id: 'py14-k1', question: 'Which function writes Python objects directly to an open file as JSON?', options: ['json.dumps', 'json.dump', 'json.write', 'json.save'], answer: 1, explanation: 'dump writes to a file; dumps returns a string.' },
      { id: 'py14-k2', question: 'In REST, what does status 201 indicate?', options: ['OK', 'Created', 'No content', 'Unauthorized'], answer: 1, explanation: '201 Created is the usual response to a successful POST.' },
      { id: 'py14-k3', question: 'In ElementTree, how do you read the attribute id of element e?', options: ['e.id', 'e["id"]', 'e.get("id")', 'e.text'], answer: 2, explanation: 'Attributes are stored in e.attrib and read with get().' }
    ],
    cheatSheet: ['json.loads(s) / json.dumps(obj, indent=2)', 'json.load(f) / json.dump(obj, f)', 'ET.fromstring(xml).findall("tag"), e.get("attr"), e.text', 'GET read · POST create · PUT replace · PATCH update · DELETE remove'],
    references: [
      { title: 'json — JSON encoder and decoder', url: 'https://docs.python.org/3/library/json.html', publisher: PY_DOCS },
      { title: 'xml.etree.ElementTree — The ElementTree XML API', url: 'https://docs.python.org/3/library/xml.etree.elementtree.html', publisher: PY_DOCS },
      { title: 'HTTP request methods', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods', publisher: 'MDN Web Docs (Mozilla)' }
    ],
    next: 'Module 15 stores API and file data in a SQLite database and visualises it.'
  },

  'py-mod-15': {
    skills: ['Create, query and update an SQLite database from Python', 'Prevent SQL injection with parameterised queries', 'Turn query results into a simple chart'],
    prerequisites: ['Files and exceptions (Modules 09–10)', 'JSON (Module 14)'],
    intuition: {
      analogy: 'A CSV file is a stack of index cards; a database is a filing cabinet with labelled drawers, an index, and a clerk (the SQL engine) who fetches exactly the cards you ask for and refuses to file a card that breaks the rules.',
      whyItMatters: 'Once data has relationships (students, courses, enrolments) or needs safe concurrent updates, files become error-prone. SQLite gives you a real database in a single file with no server to install.'
    },
    workflow: {
      title: 'Python ↔ SQLite lifecycle',
      nodes: [
        { id: 'conn', label: 'sqlite3.connect', detail: 'Opens (or creates) the database file; ":memory:" for temporary DBs.', input: 'File path', output: 'Connection' },
        { id: 'cur', label: 'Cursor.execute(sql, params)', detail: 'Sends SQL with ? placeholders and a tuple of values.', input: 'SQL + parameters', output: 'Executed statement' },
        { id: 'commit', label: 'commit()', detail: 'Makes INSERT/UPDATE/DELETE changes permanent.', input: 'Pending changes', output: 'Durable data' },
        { id: 'fetch', label: 'fetchall()', detail: 'Retrieves result rows as tuples.', input: 'SELECT', output: 'List of rows' },
        { id: 'viz', label: 'Visualise', detail: 'matplotlib bar/line chart from the rows.', input: 'Rows', output: 'Chart' }
      ],
      edges: [{ from: 'conn', to: 'cur' }, { from: 'cur', to: 'commit', label: 'writes' }, { from: 'cur', to: 'fetch', label: 'reads' }, { from: 'fetch', to: 'viz' }],
      explanation: 'Use the connection as a context manager (with conn:) to commit automatically on success and roll back on error.'
    },
    workedExample: {
      title: 'An in-memory gradebook',
      language: 'python',
      code: 'import sqlite3\n\nconn = sqlite3.connect(":memory:")\ncur = conn.cursor()\ncur.execute("CREATE TABLE marks (student TEXT, course TEXT, score INTEGER)")\nrows = [("Asha", "Python", 88), ("Ravi", "Python", 64), ("Asha", "SQL", 92), ("Meena", "SQL", 75)]\ncur.executemany("INSERT INTO marks VALUES (?, ?, ?)", rows)\nconn.commit()\n\nfor course, avg in cur.execute("SELECT course, ROUND(AVG(score), 1) FROM marks GROUP BY course ORDER BY course"):\n    print(course, avg)\n\nname = "Asha\' OR \'1\'=\'1"\ncur.execute("SELECT COUNT(*) FROM marks WHERE student = ?", (name,))\nprint("Matches for injected name:", cur.fetchone()[0])\nconn.close()',
      lineByLine: [
        { line: 3, explanation: ':memory: creates a temporary database that disappears on close.' },
        { line: 7, explanation: 'executemany runs the INSERT once per tuple; ? placeholders are filled safely.' },
        { line: 10, explanation: 'A cursor can be iterated directly to read rows.' },
        { line: 13, explanation: 'A classic injection string. Because it is passed as a parameter, it is treated as a literal name.' },
        { line: 15, explanation: 'No student has that literal name, so the count is 0 — the injection failed.' }
      ],
      expectedOutput: 'Python 76.0\nSQL 83.5\nMatches for injected name: 0',
      edgeCases: ['Building SQL with f-strings (f"... WHERE name = \'{name}\'") allows injection — always use parameters.', 'Forgetting commit() means changes vanish when the program ends.']
    },
    caseStudy: {
      title: 'From CSV exports to a queryable progress database',
      problem: 'A training team exports quiz results as weekly CSV files and answers questions like "average score per module" by hand in spreadsheets.',
      data: 'CSV rows: email, module, score, date.',
      steps: ['Create tables learners(email PRIMARY KEY) and results(email, module, score, taken_on).', 'Load each CSV with csv.DictReader and executemany inside a with conn: block.', 'Answer questions with GROUP BY queries.', 'Plot average score per module with matplotlib.'],
      result: 'New questions are answered with one SQL query instead of a new spreadsheet, and the chart is regenerated each week by re-running the script.',
      limitations: 'SQLite handles one writer at a time; a multi-user web app would use PostgreSQL (see the SQL course).'
    },
    exercises: [
      {
        id: 'py15-e1', type: 'Multiple choice', difficulty: 'Beginner',
        title: 'Safe query',
        objective: 'Recognise parameterised queries.',
        problem: 'Which statement is safe from SQL injection?',
        options: ['cur.execute(f"SELECT * FROM users WHERE name = \'{name}\'")', 'cur.execute("SELECT * FROM users WHERE name = \'" + name + "\'")', 'cur.execute("SELECT * FROM users WHERE name = ?", (name,))', 'cur.execute("SELECT * FROM users WHERE name = %s" % name)'],
        hints: ['Only one option passes the value separately from the SQL text.'],
        check: { type: 'mcq', answer: 2 },
        solution: ['Options A, B and D build SQL text from user input.', 'Option C sends the value as a parameter, so it can never change the query structure.'],
        explanation: 'The (name,) tuple needs the trailing comma to be a tuple.',
        mistakes: ['Writing (name) without a comma, which is just a string.'],
        challenge: 'Rewrite an INSERT with named placeholders (:name) and a dict.'
      },
      {
        id: 'py15-e2', type: 'Numerical calculation', difficulty: 'Intermediate',
        title: 'Predict an aggregate',
        objective: 'Compute GROUP BY results by hand.',
        problem: 'Using the worked example\'s marks table, what does SELECT MAX(score) - MIN(score) FROM marks return?',
        hints: ['Scores are 88, 64, 92 and 75.'],
        check: { type: 'numeric', answer: 28, tolerance: 0 },
        solution: ['MAX = 92, MIN = 64.', '92 - 64 = 28.'],
        explanation: 'Aggregate functions reduce all rows to one value when there is no GROUP BY.',
        mistakes: ['Using only one course\'s scores.'],
        challenge: 'Write the query that returns the range per course.'
      },
      {
        id: 'py15-e3', type: 'Python coding', difficulty: 'Advanced', language: 'python',
        title: 'Top student per course',
        objective: 'Create, insert and query with SQLite from Python.',
        problem: 'Using an in-memory database, insert the rows and print the top scorer of each course in alphabetical course order. Expected:\nPython Asha 88\nSQL Asha 92',
        starterCode: 'import sqlite3\nrows = [("Asha", "Python", 88), ("Ravi", "Python", 64), ("Asha", "SQL", 92), ("Meena", "SQL", 75)]\n\n# create the table, insert rows, query the top scorer per course\n',
        hints: ['A correlated subquery works: WHERE score = (SELECT MAX(score) FROM marks m2 WHERE m2.course = m.course)', 'Remember ORDER BY course.'],
        check: { type: 'output', expectedOutput: 'Python Asha 88\nSQL Asha 92' },
        solutionCode: 'import sqlite3\nrows = [("Asha", "Python", 88), ("Ravi", "Python", 64), ("Asha", "SQL", 92), ("Meena", "SQL", 75)]\n\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE marks (student TEXT, course TEXT, score INTEGER)")\nconn.executemany("INSERT INTO marks VALUES (?, ?, ?)", rows)\nquery = """\nSELECT course, student, score FROM marks m\nWHERE score = (SELECT MAX(score) FROM marks m2 WHERE m2.course = m.course)\nORDER BY course\n"""\nfor course, student, score in conn.execute(query):\n    print(course, student, score)\nconn.close()',
        solution: ['Create the table and insert with executemany.', 'For each row keep it only if its score equals its course\'s maximum.', 'Order by course for deterministic output.'],
        explanation: 'Window functions (RANK() OVER PARTITION BY) are an alternative covered in the SQL course.',
        mistakes: ['SELECT course, student, MAX(score) … GROUP BY course works in SQLite by accident but is invalid in most databases.'],
        challenge: 'Handle ties by returning all students who share the top score.'
      }
    ],
    knowledgeCheck: [
      { id: 'py15-k1', question: 'What does `with conn:` do for an sqlite3 connection?', options: ['Closes it', 'Commits on success, rolls back on error', 'Creates a table', 'Nothing'], answer: 1, explanation: 'The connection context manager manages the transaction, not closing.' },
      { id: 'py15-k2', question: 'Which placeholder style does sqlite3 use by default?', options: ['%s', '?', '$1', '{}'], answer: 1, explanation: 'qmark style (?) or named style (:name).' },
      { id: 'py15-k3', question: 'Which chart best shows average score per module?', options: ['Pie chart', 'Bar chart', 'Scatter plot', 'Histogram of names'], answer: 1, explanation: 'Bars compare a value across categories.' }
    ],
    cheatSheet: ['conn = sqlite3.connect("app.db")', 'conn.execute(sql, params), executemany', 'with conn: …  → commit / rollback', 'cur.fetchone(), fetchall(); never f-string SQL'],
    references: [
      { title: 'sqlite3 — DB-API 2.0 interface for SQLite databases', url: 'https://docs.python.org/3/library/sqlite3.html', publisher: PY_DOCS },
      { title: 'SQLite — SELECT', url: 'https://www.sqlite.org/lang_select.html', publisher: 'SQLite Consortium' },
      { title: 'Matplotlib — Quick start guide', url: 'https://matplotlib.org/stable/users/explain/quick_start.html', publisher: 'Matplotlib Development Team' },
      { title: 'OWASP SQL Injection Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html', publisher: 'OWASP Foundation' }
    ],
    next: 'You have completed the Python track. Continue with the SQL course for deeper database design, or the AI with Data Science course for pandas and machine learning.'
  }
};
