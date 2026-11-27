export default {
  n: 4,
  title: 'Programming & Scripting for Security',
  description: 'Python fundamentals for security work, errors and files, JSON and CSV, regular expressions, log parsing and a brute-force detector, a password checker, HTTP and sockets used responsibly, Bash, PowerShell, JavaScript and SQL essentials, and secure coding with input validation.',
  intro: 'Defenders and testers automate repetitive work: parsing logs, checking configurations, hashing files, enriching alerts. A SOC analyst who can write a 20-line script answers in minutes a question that would take hours by hand.\n\nThink of a ticket checker on a 24-coach train who must check every passenger. A script is a checker who never gets tired: you explain the rule once, and it applies that rule to a million log lines without skipping one. You do not need to be a full-time developer to write such scripts. You need the basics, regular practice and care with untrusted input.\n\nPython is the main language of this module because it is readable, has a huge library set and runs everywhere. You will also read the Bash, PowerShell, JavaScript and SQL that appear in security work. Every code example is defensive or educational, and the Python ones run right here in the Practice Lab. Run scripts that touch files, ports or websites only on systems you own or are authorized to test.',
  objectives: [
    'Write Python using variables, types, conditions, loops, functions and modules.',
    'Handle errors, files, JSON and CSV, and use regular expressions.',
    'Parse logs and build small detection scripts.',
    'Make HTTP requests and use sockets responsibly.',
    'Read Bash, PowerShell, JavaScript and SQL used in security work.',
    'Apply secure coding and input validation.'
  ],
  terms: [
    ['Script', 'A small program that automates a task, such as checking logs every hour.'],
    ['Regular expression (regex)', 'A pattern language for finding text such as IP addresses, hashes or error lines.'],
    ['Counter', 'Python’s collections.Counter: counts how many times each item appears.'],
    ['JSON', 'A text format for structured data used by APIs, SIEMs and alert pipelines.'],
    ['Socket', 'An endpoint for network communication: an IP address plus a port.'],
    ['Parameterized query', 'A database query where user input is passed separately as data, never mixed into the SQL text.'],
    ['Input validation', 'Checking that input has the expected type, length and format before using it.'],
    ['Allow-list', 'A list of what is permitted; everything else is rejected. Safer than a block-list.'],
    ['Output encoding', 'Converting data so it is treated as text in its context (HTML, URL, SQL, shell).'],
    ['Secret', 'A password, API key or token. Keep it in environment variables or a secrets manager, never in code.'],
    ['IOC', 'Indicator of compromise: an IP, domain or file hash linked to malicious activity.']
  ],
  diagramTitle: 'The automation pattern behind most security scripts',
  ascii: '  [ INPUT ]           [ PARSE ]           [ ANALYZE ]          [ OUTPUT ]\n  logs, CSV,   --->  regex, json,  --->  count, compare,  --->  alert, CSV,\n  API, files         csv.reader          thresholds,           ticket, email\n                                          allow-lists\n        ^                                                         |\n        +------------------- schedule / repeat -------------------+\n\n  Untrusted input  -->  VALIDATE (allow-list)  -->  USE SAFELY\n                         reject bad input           parameterize SQL\n                                                    encode HTML output\n                                                    argument lists, not shell strings',
  diagramExplain: 'Almost every security script reads input, parses it, analyzes it against rules or thresholds, and outputs an alert or report, then repeats on a schedule. Any input that comes from outside is untrusted and must be validated before it is used in a query, a page or a command.',
  sections: [
    {
      h: '1. Python fundamentals for security',
      t: 'A program is a list of instructions that the computer follows in order, exactly as written. Think of a recipe: wash the rice, add two cups of water, cook for 15 minutes. The computer never guesses what you meant, so every step must be clear. Python is popular in security because its code reads almost like plain English.\n\nThese building blocks cover most security scripts. Variables store values, such as attempts = 3. Lists hold many values, such as ports = [22, 80, 443]. Conditions (if, elif, else) make decisions. Loops (for, while) repeat work for every log line or host. Functions (def) package a check so you can reuse it. Dicts and sets count and deduplicate data, and modules such as re, json, csv and socket give you tested tools instead of writing everything yourself.\n\nRead the code from top to bottom. It sets a few variables, then locks the account when attempts reach 3 and the user is not an admin. It loops over the list of ports and prints each one. Finally, it defines a risk function that multiplies likelihood by impact, exactly as in Module 01, so risk(3, 4) prints 12. Change the values and run it again to see how the output changes.\n\nDo not try to memorize every piece of syntax. Understand what each block does and look up the exact spelling when you need it. Experienced programmers do this every day.',
      table: [
        ['Concept', 'Syntax', 'Security use'],
        ['Conditions', 'if / elif / else', 'Threshold alerts'],
        ['Loops', 'for, while', 'Process every log line or host'],
        ['Functions', 'def name(args):', 'Reusable checks'],
        ['Modules', 'import re, json, csv, socket', 'Use tested libraries'],
        ['Dicts / sets', '{} and set()', 'Count IPs, deduplicate IOCs']
      ],
      code: 'name = "alice"\nattempts = 3\nis_admin = False\nports = [22, 80, 443]\n\nif attempts >= 3 and not is_admin:\n    print("lock account for", name)\n\nfor p in ports:\n    print("checking port", p)\n\ndef risk(likelihood, impact):\n    return likelihood * impact\n\nprint("risk score:", risk(3, 4))',
      lang: 'python'
    },
    {
      h: '2. Errors, files, JSON and CSV',
      t: 'Real scripts read files and handle data from other tools, and real data is messy. A file may be missing, a line may be broken, or a value may have the wrong type. A good script expects these problems, like a bus driver who carries a spare tire instead of hoping for good roads.\n\nPython handles errors with try and except. Code that might fail goes in try, and what to do on failure goes in except. Catch expected errors by name, such as FileNotFoundError, rather than hiding every error. Use with blocks so files close safely: with open("hosts.txt") as f closes the file even if an error happens inside the block.\n\nUse json and csv to exchange data with SIEMs and spreadsheets. JSON stores structured data, such as an alert with an IP, a count and a severity. json.dumps turns a Python dict into JSON text, and json.loads turns the text back into a dict. CSV stores rows and columns that open directly in Excel. SIEMs, APIs and ticket systems mostly speak JSON, while managers usually want a CSV report.\n\nIn the code, the alert dict becomes JSON text and back again, and the severity is printed in capitals. The file read sits inside try, so a missing hosts.txt prints a clear message and continues with an empty list instead of crashing. A script that crashes at 2 a.m. on one bad line is worse than no script at all.',
      code: 'import json\n\nalert = {"ip": "203.0.113.7", "count": 4, "severity": "high"}\ntext = json.dumps(alert, indent=2)      # dict -> JSON text\nprint(text)\n\nback = json.loads(text)                  # JSON text -> dict\nprint(back["severity"].upper())\n\ntry:\n    with open("hosts.txt") as f:          # closes the file even on error\n        hosts = [line.strip() for line in f if line.strip()]\nexcept FileNotFoundError:\n    print("hosts.txt not found, using an empty list")\n    hosts = []',
      lang: 'python'
    },
    {
      h: '3. Regular expressions',
      t: 'A regular expression (regex) is a pattern that describes the shape of text. Regex finds structured text inside messy logs. Think of searching a thick attendance register for every roll number that starts with 23CS and ends with three digits. You do not know each number, but you know its shape. Regex lets you search by shape.\n\nPatterns are built from small parts. \\d means one digit, + means one or more, {1,3} means between one and three times, and [a-f0-9] means any one character from that set. \\b marks a word boundary. So \\d{1,3}(\\.\\d{1,3}){3} means “one to three digits, then three groups of a dot followed by one to three digits”, which matches IPv4-like text such as 203.0.113.7. In Python, re.search finds the first match and re.findall returns all of them.\n\nTake the log line Failed password for root from 203.0.113.7 port 4021. The pattern Failed password for (\\S+) from (\\S+) captures two groups: the username root and the IP 203.0.113.7. \\S+ means one or more characters that are not spaces. The brackets mark the parts you want to keep.\n\nTest patterns on sample data before trusting them. The IPv4 pattern above also matches 999.999.999.999, which is not a real address. A pattern that is too loose raises false alerts, and one that is too strict quietly misses attacks. A tester such as regex101.com shows exactly what each part matches.',
      table: [
        ['Pattern', 'Matches'],
        ['\\d+', 'One or more digits'],
        ['\\d{1,3}(\\.\\d{1,3}){3}', 'IPv4-like text'],
        ['[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+', 'Email-like text'],
        ['\\b[a-f0-9]{64}\\b', 'A SHA-256 hash'],
        ['(?i)failed password', 'A case-insensitive phrase']
      ]
    },
    {
      h: '4. Project: log parser and brute-force detector',
      t: 'This project solves a real SOC task: find IP addresses with repeated failed SSH logins. A brute-force attack is like someone at your hostel door trying every key on a large bunch. Each failed try leaves one line in the log, so many failures from one source stand out once you count them.\n\nThe script works in four steps. It reads the log text line by line. A compiled regex pulls out the username and IP from each “Failed password” line. Counter from the collections module counts failures per IP. Finally, it compares each count with THRESHOLD = 3 and prints ALERT for any IP that reaches it. This input, parse, analyze, output pattern is the same one in the module diagram.\n\nThe sample uses documentation-range addresses (203.0.113.x, 198.51.100.x, 192.0.2.x), which are reserved for examples and never belong to a real machine. In the sample, 203.0.113.7 fails four times, trying root and test, so it is flagged. 198.51.100.23 fails once and is marked ok. The “Accepted password” line for 192.0.2.10 does not match the pattern, so it is not counted. Run the code and check this yourself.\n\nExtensions: add a time window, write results to CSV, raise a ticket, and list the usernames targeted. Five failures in one minute are far more suspicious than five in a month. In production a SIEM rule does this at scale, but the logic is the same, and knowing it helps you tune those rules.',
      code: 'import re\nfrom collections import Counter\n\nlog = """Failed password for root from 203.0.113.7 port 4021 ssh2\nFailed password for root from 203.0.113.7 port 4022 ssh2\nFailed password for admin from 198.51.100.23 port 5100 ssh2\nFailed password for root from 203.0.113.7 port 4023 ssh2\nAccepted password for asha from 192.0.2.10 port 6000 ssh2\nFailed password for test from 203.0.113.7 port 4024 ssh2"""\n\npattern = re.compile(r"Failed password for (\\S+) from (\\d+\\.\\d+\\.\\d+\\.\\d+)")\nby_ip = Counter()\nfor line in log.splitlines():\n    m = pattern.search(line)\n    if m:\n        user, ip = m.groups()\n        by_ip[ip] += 1\n\nTHRESHOLD = 3\nfor ip, count in by_ip.most_common():\n    flag = "ALERT" if count >= THRESHOLD else "ok"\n    print(f"{ip:<15} failed={count} {flag}")',
      lang: 'python'
    },
    {
      h: '5. Project: password strength checker',
      t: 'Passwords are still the most common lock on accounts, so checking their strength is a good first project. Think of a gym trainer watching your form: the trainer does not stop you, but tells you what to fix.\n\nThe checker gives 2 points for a length of 12 or more characters and 1 point each for lowercase, uppercase, a digit and a symbol, for a maximum of 6. For anything missing it adds a note such as “use 12+ characters” or “add symbol”. If the password is on a small list of very common ones, such as password or qwerty, the score drops to 0 with the note “common password”. Run it and compare the three sample passwords.\n\nModern guidance (NIST SP 800-63B) favors length and screening against breached and common passwords over complex composition rules, plus password managers and MFA. “Pa$$w0rd1” ticks every box for character types, yet it is one of the first guesses any cracking tool tries. A long passphrase such as “chai-on-the-terrace-at-six” is stronger and easier to remember. A password manager lets you use a different long password everywhere, and MFA protects the account even if one password leaks.\n\nThis toy checker is for learning only. A real system checks new passwords against a large list of breached passwords, never prints or logs the password itself, and stores it only as a slow, salted hash, which you will learn in Module 05.',
      code: 'import re\n\ndef check(pw):\n    score, notes = 0, []\n    if len(pw) >= 12:\n        score += 2\n    else:\n        notes.append("use 12+ characters")\n    for pat, name in [(r"[a-z]", "lowercase"), (r"[A-Z]", "uppercase"), (r"\\d", "digit"), (r"[^\\w]", "symbol")]:\n        if re.search(pat, pw):\n            score += 1\n        else:\n            notes.append("add " + name)\n    if pw.lower() in {"password", "123456", "qwerty", "letmein"}:\n        score, notes = 0, ["common password"]\n    return score, notes\n\nfor pw in ["password", "Summer2024", "c0rrect-Horse-battery!"]:\n    s, n = check(pw)\n    print(f"{pw:<24} score={s}/6 {\'; \'.join(n)}")',
      lang: 'python'
    },
    {
      h: '6. HTTP, sockets and automation (responsibly)',
      t: 'Many security checks need to talk to other machines: does this website send the right security headers, is this port open? Python can answer in a few lines. But just as you should not walk down a street at night trying every door to see which ones are unlocked, you must not probe systems that are not yours.\n\nThe requests library checks a website’s security headers; a socket tests whether a port answers. In the code, requests.get fetches the page, and the loop reports whether Content-Security-Policy, X-Content-Type-Options and Strict-Transport-Security are present. A missing header is a finding to fix. The socket function works one level lower: it tries a TCP connection with a one-second timeout, and if the connection succeeds, the port is open.\n\nFor example, after hardening your own VM, run port_open("127.0.0.1", 22) to confirm SSH is listening and port_open("127.0.0.1", 3306) to confirm the database port is closed. Then run the header check against your own website and add the headers it reports as MISSING.\n\nConnecting to ports or scanning systems you do not own or have permission to test can be illegal or break acceptable-use policies, including your college network rules. Practice on localhost, your own VMs or authorized lab ranges. In professional work, the written scope of the engagement lists exactly which hosts you may touch.',
      code: 'import requests                       # pip install requests\n\nr = requests.get("https://your-own-site.example", timeout=5)\nfor h in ["Content-Security-Policy", "X-Content-Type-Options", "Strict-Transport-Security"]:\n    print(h, "->", "present" if h in r.headers else "MISSING")\n\nimport socket\ndef port_open(host, port, timeout=1):\n    with socket.socket() as s:\n        s.settimeout(timeout)\n        return s.connect_ex((host, port)) == 0\n\nprint(port_open("127.0.0.1", 22))      # your own machine only',
      lang: 'python',
      run: false
    },
    {
      h: '7. Bash, PowerShell and JavaScript',
      t: 'Different systems speak different scripting languages, and a security professional should at least be able to read the common ones. Bash automates Linux servers, PowerShell automates Windows, and JavaScript runs in browsers. Think of an office where people speak Hindi, Tamil and English: you may work mostly in one, but you must follow the others when they come up.\n\nThe Bash script in the code prints the date, the disk usage of /, the logged-in users and the line count of each readable log file. The commented PowerShell lines list local administrators and recent failed logons on your own machine. Small scripts like these turn a 15-minute manual check into one command you can schedule every morning.\n\nJavaScript needs extra care because it runs in the user’s browser, which makes it a target for XSS (Module 06). If a page puts user input into innerHTML, an attacker can submit text such as <img src=x onerror=alert(1)> and the browser runs it as code. In JavaScript, never insert untrusted text with innerHTML: use textContent, which always shows the input as plain text. Avoid eval(), which runs any string as code.\n\nKeep secrets out of client-side code. Anything in browser JavaScript, including API keys, can be read by any visitor who opens the developer tools. Secret keys belong on the server.',
      code: '#!/bin/bash\n# report disk usage, logged-in users and log sizes\necho "Date: $(date)"\ndf -h / | tail -1\nwho\nfor f in /var/log/*.log; do\n  [ -r "$f" ] && echo "$f $(wc -l < "$f") lines"\ndone\n\n# PowerShell: local admins and recent failed logons (your own machine)\n# Get-LocalGroupMember -Group "Administrators"\n# Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625} -MaxEvents 10\n\n// JavaScript\n// unsafe: element.innerHTML = userInput;\n// safe:   element.textContent = userInput;'
    },
    {
      h: '8. SQL fundamentals and SQL injection',
      t: 'SQL is the language used to ask a database for data, for example “give me the user named alice”. Almost every website stores users, orders or marks in a database, so SQL appears all over security work. Think of a request slip at a library counter: you write what you want, and the librarian fetches exactly that.\n\nSQL injection happens when input is concatenated into a query, so the input can change the query itself. The vulnerable line in the code builds "SELECT * FROM users WHERE name = \'" + user_input + "\'". When the input is x\' OR \'1\'=\'1, the query becomes ... WHERE name = \'x\' OR \'1\'=\'1\'. Since \'1\'=\'1\' is always true, every row comes back, and no valid name was needed.\n\nThe cure is parameterized queries, which pass input separately as data. In Python with sqlite3 you write db.execute("SELECT * FROM users WHERE name = ?", (user_input,)). The database fills the ? with the whole input as one value, so quote characters inside it have no special meaning and cannot change the query’s structure.\n\nThis example uses a throwaway in-memory database, so nothing real is touched. Run it and compare the two results: the vulnerable query returns both alice and bob, while the parameterized one returns an empty list. Never try injection on websites you do not own or are not authorized to test.',
      code: 'import sqlite3\n\ndb = sqlite3.connect(":memory:")\ndb.execute("CREATE TABLE users(name TEXT, role TEXT)")\ndb.executemany("INSERT INTO users VALUES(?, ?)", [("alice", "admin"), ("bob", "user")])\n\nuser_input = "x\' OR \'1\'=\'1"          # what an attacker might type\n\n# VULNERABLE: string concatenation lets input change the query\nbad = db.execute("SELECT * FROM users WHERE name = \'" + user_input + "\'").fetchall()\nprint("vulnerable query returned:", bad)\n\n# SAFE: the parameter is treated only as data\ngood = db.execute("SELECT * FROM users WHERE name = ?", (user_input,)).fetchall()\nprint("parameterized returned   :", good)',
      lang: 'python'
    },
    {
      h: '9. Secure programming and input validation',
      t: 'Treat every input from users, files, APIs and headers as untrusted. An apartment security guard does not let someone in just because they say they live there; the guard checks the resident list. Your code must check every piece of data it did not create itself in the same way.\n\nThe safest check is an allow-list: describe exactly what good input looks like (type, length, format) and reject everything else. A block-list tries to list bad inputs, and attackers usually find one you forgot. Validate on the server, because checks in the browser can be skipped. When you use the data, encode it for its context: HTML encoding for a web page, parameters for SQL, an argument list for a command.\n\nThe code shows this with a ping tool. The unsafe version, os.system("ping " + host), hands the input to a shell, so an input such as x; rm -rf ~ would run a second, destructive command. The safe version first checks the host name with re.fullmatch against a strict pattern of letters, digits, dots and hyphens, then calls subprocess.run with an argument list, so no shell ever reads the input.\n\nThe bullets add the other habits: keep secrets out of code, fail with generic error messages, update dependencies, never write your own crypto, and run programs with minimum permissions. These habits prevent most of the web bugs you will study in Module 06.',
      b: [
        'Validate on the server with allow-lists (expected type, length, format), not block-lists.',
        'Encode output for its context: HTML, URL, SQL or shell.',
        'Never build shell commands from input; use library functions or subprocess with an argument list.',
        'Keep secrets out of code: environment variables or a secrets manager; never commit keys to git.',
        'Fail safely: generic error messages to users, details in protected logs.',
        'Use maintained libraries, update dependencies, and never write your own crypto.',
        'Run programs with the minimum permissions they need.'
      ],
      code: 'import re, subprocess\n\nhost = "example.com"\n# unsafe: os.system("ping " + host)   -> shell injection risk ("x; rm -rf ~")\nif re.fullmatch(r"[A-Za-z0-9.-]{1,253}", host):          # allow-list check\n    subprocess.run(["ping", "-c", "1", host], check=False)  # argument list, no shell\nelse:\n    print("rejected input")',
      lang: 'python',
      run: false
    }
  ],
  lab: {
    title: 'Hands-on Lab 04: integrity monitoring with hashes',
    steps: [
      ['Create a test folder with a few files you own.', 'mkdir watched && cd watched\necho "config v1" > app.conf\necho "hello" > readme.txt', 'Use a throwaway folder. Never point integrity tools at system folders you do not understand.'],
      ['Hash every file with SHA-256 and save the baseline to JSON.', 'import hashlib, json, pathlib\n\ndef snapshot(folder):\n    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest()\n            for p in pathlib.Path(folder).iterdir() if p.is_file()}\n\njson.dump(snapshot("watched"), open("baseline.json", "w"), indent=2)', 'A hash is a fingerprint: any change to a file gives a completely different value (Module 05).'],
      ['Change one file, then compare a new snapshot with the baseline.', 'base = json.load(open("baseline.json"))\nnow = snapshot("watched")\nfor name in sorted(set(base) | set(now)):\n    if name not in now:\n        print("DELETED ", name)\n    elif name not in base:\n        print("NEW     ", name)\n    elif base[name] != now[name]:\n        print("CHANGED ", name)', 'This is the idea behind file integrity monitoring tools such as AIDE, Wazuh FIM and Tripwire.'],
      ['Extend the brute-force detector: also match “Accepted password” and report a success that follows failures from the same IP.', null, 'Failures followed by a success from one IP is the signature of a brute force that worked: an urgent alert.']
    ]
  },
  examples: [
    {
      title: 'Extracting and deduplicating IOCs from a report',
      lang: 'python',
      code: 'import re\n\nreport = """Phishing kit hosted at 198.51.100.44 and 203.0.113.9.\nPayload hash e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nSecond stage at 198.51.100.44 contacted admin@bad-example.test"""\n\nips = sorted(set(re.findall(r"\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", report)))\nhashes = sorted(set(re.findall(r"\\b[a-f0-9]{64}\\b", report)))\nemails = sorted(set(re.findall(r"[\\w.+-]+@[\\w-]+\\.[\\w.]+", report)))\n\nprint("IPs:", ips)\nprint("SHA-256:", hashes)\nprint("Emails:", emails)',
      explanation: 'Threat reports are text. Regex pulls out the indicators, and a set removes duplicates, ready to load into a blocklist or SIEM watchlist (Module 11).'
    },
    {
      title: 'Validating IPv4 input with the standard library',
      lang: 'python',
      code: 'import ipaddress\n\ndef valid_ipv4(text):\n    try:\n        ipaddress.IPv4Address(text)\n        return True\n    except ValueError:\n        return False\n\nfor value in ["192.168.1.10", "256.1.1.1", "10.0.0.5; rm -rf /", "8.8.8.8"]:\n    print(f"{value!r:24} -> {valid_ipv4(value)}")',
      explanation: 'An allow-list check using a tested library is far safer than writing your own regex. Input that is not a valid address, such as an injection attempt, is rejected before it reaches a command or query.'
    }
  ],
  best: [
    'Validate input with allow-lists on the server, and reject anything unexpected.',
    'Use parameterized queries for every database call.',
    'Call programs with subprocess argument lists, never by building a shell string.',
    'Keep secrets in environment variables or a secrets manager; enable secret scanning in git.',
    'Use tested libraries (ipaddress, hashlib, csv, json) instead of hand-written parsers.',
    'Test scripts on sample data and run them with the least privilege.'
  ],
  mistakes: [
    'Concatenating user input into SQL, HTML or shell commands.',
    'Using innerHTML or eval() with untrusted data in JavaScript.',
    'Committing API keys or passwords to a repository, even a private one.',
    'Showing full stack traces to users instead of logging them privately.',
    'Running port checks or web requests against systems you are not authorized to test.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Write a function that returns True if a string is a valid IPv4 address (use the ipaddress module).\n2. Modify the password checker to reject passwords shorter than 8 characters outright.\n3. Write a regex that finds SHA-256 hashes in a text file and count the unique ones.\n4. Explain why parameterized queries stop SQL injection.\n5. Convert the Bash disk report to PowerShell.\n6. Review a script that uses os.system("ping " + user_input). List what is wrong and fix it.'
  },
  mini: {
    title: 'Mini project: SecToolkit',
    objective: 'Build one Python command-line tool with three security subcommands.',
    requirements: [
      'parse-log: the brute-force detector with a threshold and CSV output.',
      'hash-dir: the integrity checker with a JSON baseline and a compare mode.',
      'check-headers: security-header check for a website you own.',
      'Unit tests, a README and a requirements.txt file.'
    ],
    deliverable: 'A public GitHub repository for your portfolio with the tool, tests and usage examples.'
  },
  takeaways: [
    'Automation turns repeated analysis into fast, consistent checks.',
    'Regex, JSON, CSV and Counter handle most log-parsing tasks.',
    'Never trust input: validate with allow-lists, encode output and parameterize queries.',
    'Secrets belong in a secrets manager, not in code.',
    'Run scripts only on systems you are authorized to test.'
  ],
  quickRef: [
    'from collections import Counter · Counter(items).most_common(5)',
    're.findall(r"\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", text)  → IPs',
    'db.execute("... WHERE name = ?", (value,))  → safe SQL',
    'subprocess.run(["ping", "-c", "1", host])  → no shell',
    'element.textContent = input  (never innerHTML)'
  ],
  refs: [
    ['Python documentation', 'https://docs.python.org/3/'],
    ['Automate the Boring Stuff with Python (free online)', 'https://automatetheboringstuff.com/'],
    ['OWASP Input Validation Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html'],
    ['OWASP SQL Injection Prevention Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'],
    ['NIST SP 800-63B Digital Identity Guidelines', 'https://pages.nist.gov/800-63-4/sp800-63b.html']
  ],
  quiz: [
    ['Which Python structure counts occurrences most conveniently?', ['collections.Counter', 'turtle', 'tkinter', 'random'], 0, 'Counter tallies items; the log parser uses it to count failures per IP.'],
    ['What is the best defense against SQL injection?', ['Block-listing words like OR', 'Parameterized queries', 'Hiding error messages', 'Longer passwords'], 1, 'Parameters keep input as data, never as SQL code.'],
    ['Which JavaScript property inserts text without parsing HTML?', ['innerHTML', 'outerHTML', 'textContent', 'document.write'], 2, 'textContent does not interpret HTML, which prevents XSS.'],
    ['Which approach is safer for validating input?', ['Block-list', 'Allow-list', 'No checks', 'Client-side checks only'], 1, 'Allow-lists define what is valid; block-lists miss variants.'],
    ['Where should API keys live?', ['In source code', 'In a public repository', 'In environment variables or a secrets manager', 'In code comments'], 2, 'Keys in code leak through repositories; use managed storage and rotate them.']
  ],

  skills: ['Parse logs with regex and Counter', 'Write detection thresholds', 'Use parameterized SQL', 'Validate input with allow-lists', 'Hash files for integrity'],
  prereq: ['Module 03 (logs and the shell)', 'Basic Python helps but is not required'],
  analogy: 'A script is a tireless junior analyst: you explain the rule once (“flag any IP with three failed logins”) and it checks a million lines in a second without getting bored. Input validation is the security guard at the door: only visitors on the guest list get in.',
  why: 'Every security role automates. Analysts parse logs, testers write small tools, engineers build checks into pipelines. Knowing how injection works in code also makes you better at finding and fixing it.',
  workflow: {
    title: 'Brute-force detection script',
    nodes: [
      ['read', 'Read the log', 'Line by line', 'auth.log', 'Lines of text', 'Open the log with a with block (or read it from the SIEM API) and loop over each line, so even huge files use little memory.'],
      ['match', 'Match the pattern', 'Regex on each line', 'Line', 'User and IP', 'A compiled regex such as Failed password for (\\S+) from (\\d+\\.\\d+\\.\\d+\\.\\d+) extracts the target username and the source IP from each failure line.'],
      ['count', 'Count per IP', 'Counter[ip] += 1', 'Matches', 'Failures per IP', 'collections.Counter keeps a running total for every source IP. most_common() sorts them for you.'],
      ['rule', 'Apply the threshold', 'count >= 3 ?', 'Totals', 'Flagged IPs', 'IPs at or above the threshold are flagged. Production rules add a time window (for example 5 failures in 2 minutes) to reduce false positives.'],
      ['act', 'Act', 'Alert, block, report', 'Flagged IPs', 'CSV, ticket, firewall rule', 'Write a CSV for the analyst, open a ticket, or hand the IP to fail2ban or the firewall. Always keep a human review for blocking decisions that affect real users.']
    ],
    explanation: 'Input → parse → analyze → output: the same pattern powers SIEM correlation rules.'
  },
  caseStudy: {
    title: 'Cloud keys leaked in a public repository',
    problem: 'A developer committed a cloud access key to a public GitHub project while testing.',
    data: 'Git history, cloud audit logs (new instances in unusual regions), billing alerts.',
    steps: ['Automated bots scan public repositories for key patterns within minutes of a push.', 'The key was used to start expensive compute instances for crypto-mining.', 'The billing alert fired; the key was revoked and the commit history cleaned.', 'Secret scanning, pre-commit hooks and environment variables were added.'],
    result: 'Removing the file in a later commit was not enough: the key stayed in git history until it was rotated.',
    limitations: 'Simplified summary of a very common pattern.'
  },
  exercises: [
    {
      title: 'Count failed logins',
      difficulty: 'Beginner',
      objective: 'Use Counter on parsed log lines.',
      problem: 'Complete the script so it prints each IP and its number of failed logins, most failures first, in the format IP count.',
      code: 'from collections import Counter\n\nlines = [\n    "Failed password from 203.0.113.7",\n    "Failed password from 198.51.100.2",\n    "Failed password from 203.0.113.7",\n    "Accepted password from 192.0.2.4",\n    "Failed password from 203.0.113.7",\n]\n\ncounts = Counter()\nfor line in lines:\n    # TODO: count only lines that start with "Failed"\n    pass\n\nfor ip, n in counts.most_common():\n    print(ip, n)',
      solutionCode: 'from collections import Counter\n\nlines = [\n    "Failed password from 203.0.113.7",\n    "Failed password from 198.51.100.2",\n    "Failed password from 203.0.113.7",\n    "Accepted password from 192.0.2.4",\n    "Failed password from 203.0.113.7",\n]\n\ncounts = Counter()\nfor line in lines:\n    if line.startswith("Failed"):\n        counts[line.split()[-1]] += 1\n\nfor ip, n in counts.most_common():\n    print(ip, n)',
      expected: '203.0.113.7 3\n198.51.100.2 1',
      hints: ['line.split()[-1] is the last word: the IP.', 'Skip the Accepted line.'],
      solution: ['Check line.startswith("Failed").', 'Add 1 to counts for the IP at the end of the line.'],
      explanation: 'most_common() returns the IPs sorted by count, highest first.'
    },
    { title: 'Why parameters work', objective: 'Explain SQL injection defense.', problem: 'Why does db.execute("SELECT * FROM users WHERE name = ?", (value,)) stop SQL injection?', options: ['It encrypts the value', 'The value is sent separately as data, so it can never change the SQL statement', 'It removes quotes from the value', 'It only works for numbers'], answer: 1, hints: ['Think about when the SQL text is parsed.'], solution: ['The database parses the statement with a placeholder first.', 'The value is bound afterwards as plain data.'], explanation: 'Even x\' OR \'1\'=\'1 is just a strange name, not SQL.' },
    { title: 'Fix the ping tool', objective: 'Spot shell injection.', problem: 'os.system("ping -c 1 " + host) is called with host = "8.8.8.8; cat /etc/passwd". What happens?', options: ['Ping fails safely', 'The shell runs ping and then cat /etc/passwd', 'Python raises a SyntaxError', 'Only the IP is used'], answer: 1, hints: ['The ; separates two shell commands.'], solution: ['The shell treats ; as a command separator.', 'Use subprocess.run(["ping", "-c", "1", host]) after validating host.'], explanation: 'This is command injection: input became code.' },
    { title: 'Count the hashes', objective: 'Use regex for IOCs.', problem: 'How many characters long is a SHA-256 hash written in hexadecimal?', answer: 64, hints: ['256 bits, 4 bits per hex character.'], solution: ['256 / 4 = 64 hex characters.'], explanation: 'That is why the regex \\b[a-f0-9]{64}\\b finds SHA-256 hashes.' }
  ],
  checks: [
    ['What does a with open(...) block guarantee?', ['The file is encrypted', 'The file is closed even if an error occurs', 'The file is read twice', 'The file becomes read-only'], 1, 'Context managers clean up resources reliably.'],
    ['Which is the safest way to show a username on a web page?', ['innerHTML', 'eval()', 'textContent', 'document.write'], 2, 'textContent treats the value as plain text.'],
    ['Which address range is reserved for documentation examples?', ['203.0.113.0/24', '10.0.0.0/8', '8.8.8.0/24', '172.16.0.0/12'], 0, '192.0.2.0/24, 198.51.100.0/24 and 203.0.113.0/24 are reserved for examples.']
  ],
  cheat: ['Counter(x).most_common()', 're.compile(r"Failed password for (\\S+) from (\\S+)")', 'json.dumps / json.loads · csv.writer', 'execute("... = ?", (v,))', 'subprocess.run([...]) · textContent'],
  next: 'Module 05 explains the cryptography behind hashes, passwords, HTTPS and digital signatures.'
};
