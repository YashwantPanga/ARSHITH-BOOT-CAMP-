// The three mini projects of the Cyber Security course. Learners build any one and submit its GitHub
// repository (with the 15 module quizzes, this unlocks the final assessment). All three are defensive
// and run on the learner's own machine or lab data only.

export const PROJECTS = [
  {
    id: 'cs-proj-1',
    projectNumber: 1,
    title: 'Project 1: Log Analyzer & Brute-Force Detector',
    subtitle: 'Modules 03, 04 & 09 – Linux logs, Python automation and SOC detection logic',
    difficulty: 'Beginner',
    estimatedTime: '2 – 3 Hours',
    pageLength: '1 – 2 Pages',
    description: 'Build a Python command-line tool that reads an SSH authentication log, counts failed logins per source IP, raises MEDIUM alerts at a threshold within a time window, raises HIGH alerts when a success follows the failures, and exports the results to CSV for an analyst. Use the sample log in the starter code (documentation-range IP addresses) or your own server’s log.',
    objectives: [
      'Parse log lines with regular expressions and extract timestamp, user and source IP',
      'Count failures per IP with collections.Counter and apply a threshold',
      'Escalate when a successful login follows repeated failures from the same IP',
      'List the usernames each suspicious IP targeted',
      'Export alerts to CSV and print a readable summary'
    ],
    requirements: [
      'Command-line arguments: --log (file path), --threshold (default 3) and --csv (output file)',
      'Handle a missing or unreadable log file with a clear error message instead of a crash',
      'Alerts include severity, IP, failure count, targeted users and the reason',
      'At least three unit tests (for example with pytest) using small sample logs',
      'A README with usage examples, sample output and the MITRE ATT&CK technique detected (T1110 Brute Force)'
    ],
    starterCode: '#!/usr/bin/env python3\n"""Project 1: brute-force detector for SSH auth logs (run only on logs you own)."""\nimport argparse, csv, re\nfrom collections import Counter, defaultdict\n\nSAMPLE = """Nov 26 09:00:01 web sshd[811]: Failed password for root from 203.0.113.7 port 4021 ssh2\nNov 26 09:00:03 web sshd[811]: Failed password for admin from 203.0.113.7 port 4022 ssh2\nNov 26 09:00:05 web sshd[811]: Failed password for asha from 203.0.113.7 port 4023 ssh2\nNov 26 09:00:09 web sshd[812]: Failed password for ravi from 198.51.100.4 port 5100 ssh2\nNov 26 09:00:12 web sshd[813]: Accepted password for asha from 203.0.113.7 port 4024 ssh2\nNov 26 09:01:30 web sshd[814]: Accepted publickey for meena from 192.0.2.15 port 6000 ssh2"""\n\nFAIL = re.compile(r"Failed password for (?:invalid user )?(\\S+) from (\\S+)")\nOK = re.compile(r"Accepted \\S+ for (\\S+) from (\\S+)")\n\n\ndef analyze(lines, threshold=3):\n    """Return a list of alert dicts."""\n    # TODO: count failures per IP, remember targeted users,\n    #       add a MEDIUM alert at the threshold and a HIGH alert for success after failures\n    return []\n\n\ndef main():\n    ap = argparse.ArgumentParser()\n    ap.add_argument("--log")\n    ap.add_argument("--threshold", type=int, default=3)\n    ap.add_argument("--csv")\n    args = ap.parse_args()\n    lines = open(args.log, encoding="utf-8").read().splitlines() if args.log else SAMPLE.splitlines()\n    for a in analyze(lines, args.threshold):\n        print(f"[{a[\'severity\']}] {a[\'ip\']:<15} {a[\'reason\']}")\n    # TODO: write alerts to args.csv when given\n\n\nif __name__ == "__main__":\n    main()\n',
    expectedOutput: '[MEDIUM] 203.0.113.7     3 failed logins (users: admin, asha, root)\n[HIGH] 203.0.113.7     success for asha AFTER 3 failures\nSummary: 2 alerts, 1 suspicious IP, written to alerts.csv'
  },
  {
    id: 'cs-proj-2',
    projectNumber: 2,
    title: 'Project 2: File Integrity Monitor with SHA-256',
    subtitle: 'Modules 05 & 10 – Hashing, evidence integrity and change detection',
    difficulty: 'Intermediate',
    estimatedTime: '3 – 4 Hours',
    pageLength: '2 Pages',
    description: 'Build a file integrity monitor (FIM) that creates a SHA-256 baseline of a folder you own, then reports NEW, CHANGED and DELETED files on later runs. Add an HMAC over the baseline file so an attacker who edits both a file and the baseline is still detected, and produce a chain-of-custody style report.',
    objectives: [
      'Hash every file in a folder tree with hashlib.sha256, reading large files in chunks',
      'Store a JSON baseline with path, size, modification time and hash',
      'Compare a new scan with the baseline and classify NEW, CHANGED and DELETED files',
      'Protect the baseline with an HMAC key kept outside the monitored folder',
      'Write a timestamped report suitable for an incident record'
    ],
    requirements: [
      'Subcommands: init (create the baseline) and check (compare and report)',
      'Read files in 64 KB chunks so very large files do not exhaust memory',
      'Refuse to run check if the baseline HMAC does not verify, and say why',
      'Exit code 0 when nothing changed and 1 when changes are found (for automation)',
      'Tests that modify, add and delete files in a temporary folder and assert the report',
      'A README explaining the threat model and the limits of hash-based monitoring'
    ],
    starterCode: '#!/usr/bin/env python3\n"""Project 2: file integrity monitor (use only on folders you own)."""\nimport argparse, hashlib, hmac, json, os, pathlib, sys, time\n\nCHUNK = 64 * 1024\n\n\ndef sha256_file(path):\n    h = hashlib.sha256()\n    with open(path, "rb") as f:\n        for block in iter(lambda: f.read(CHUNK), b""):\n            h.update(block)\n    return h.hexdigest()\n\n\ndef scan(root):\n    """Return {relative_path: {"sha256": ..., "size": ...}} for every file under root."""\n    # TODO: walk the folder with pathlib.Path(root).rglob("*")\n    return {}\n\n\ndef sign(data_bytes, key):\n    return hmac.new(key, data_bytes, hashlib.sha256).hexdigest()\n\n\ndef compare(baseline, current):\n    """Return lists of new, changed and deleted paths."""\n    # TODO\n    return [], [], []\n\n\nif __name__ == "__main__":\n    ap = argparse.ArgumentParser()\n    ap.add_argument("command", choices=["init", "check"])\n    ap.add_argument("folder")\n    ap.add_argument("--baseline", default="baseline.json")\n    args = ap.parse_args()\n    key = os.environ.get("FIM_KEY", "").encode()\n    if not key:\n        sys.exit("Set the FIM_KEY environment variable (keep it outside the monitored folder).")\n    # TODO: implement init and check\n',
    expectedOutput: 'FIM check of ./watched at 2026-11-26T10:15:02Z\nbaseline signature: OK\nCHANGED  app.conf\nNEW      backdoor.sh\nDELETED  readme.txt\n3 changes found (exit code 1)'
  },
  {
    id: 'cs-proj-3',
    projectNumber: 3,
    title: 'Project 3: Web Security Header & TLS Checker',
    subtitle: 'Modules 02, 05, 06 & 08 – HTTPS, security headers, cookies and reporting',
    difficulty: 'Intermediate',
    estimatedTime: '3 – 4 Hours',
    pageLength: '2 Pages',
    description: 'Build a checker that audits a website you own (or a local test server) for HTTPS redirects, TLS version, certificate expiry, key security headers and cookie flags, and produces a graded report with a remediation note for every missing control. Never run it against sites you are not authorized to assess.',
    objectives: [
      'Request a site and inspect the response headers and Set-Cookie flags',
      'Check that HTTP redirects to HTTPS and that HSTS is present',
      'Read the TLS version and certificate expiry date with the ssl module',
      'Score the results and explain each finding with a fix',
      'Export the findings as JSON and as a readable table'
    ],
    requirements: [
      'Check Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, Referrer-Policy and X-Frame-Options (or CSP frame-ancestors)',
      'Flag cookies missing HttpOnly, Secure or SameSite',
      'Warn when the certificate expires within 30 days or TLS is older than 1.2',
      'An allow-list of hostnames you are authorized to test; refuse anything else',
      'Tests that use a local test server (for example http.server or Flask) with and without the headers',
      'A README with sample output and a short explanation of why each header matters'
    ],
    starterCode: '#!/usr/bin/env python3\n"""Project 3: security header and TLS checker (authorized targets only)."""\nimport datetime, json, socket, ssl, sys\nimport requests  # pip install requests\n\nAUTHORIZED = {"localhost", "127.0.0.1", "your-own-site.example"}\nHEADERS = {\n    "Content-Security-Policy": "Limits where scripts and content can load from (reduces XSS).",\n    "Strict-Transport-Security": "Forces HTTPS on future visits.",\n    "X-Content-Type-Options": "Stops MIME sniffing (value: nosniff).",\n    "Referrer-Policy": "Limits what URL data leaks to other sites.",\n}\n\n\ndef tls_info(host, port=443):\n    ctx = ssl.create_default_context()\n    with socket.create_connection((host, port), timeout=5) as sock:\n        with ctx.wrap_socket(sock, server_hostname=host) as tls:\n            cert = tls.getpeercert()\n            expires = datetime.datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")\n            return tls.version(), expires\n\n\ndef check(url):\n    host = url.split("//")[-1].split("/")[0].split(":")[0]\n    if host not in AUTHORIZED:\n        sys.exit(f"{host} is not in the authorized list.")\n    findings = []\n    # TODO: request the page, check HEADERS, cookie flags, HTTPS redirect, TLS version and expiry\n    return findings\n\n\nif __name__ == "__main__":\n    print(json.dumps(check(sys.argv[1]), indent=2))\n',
    expectedOutput: 'Target: https://your-own-site.example   Grade: B\nPASS  HTTPS redirect, TLSv1.3, certificate valid 74 more days\nPASS  Strict-Transport-Security\nFAIL  Content-Security-Policy missing -> add a CSP (start in Report-Only mode)\nWARN  Cookie "session" missing SameSite -> set SameSite=Lax\nSaved findings.json'
  }
];

export const FINAL_PROJECT = {
  id: 'cs-final-capstone',
  title: 'Cyber Security Capstone: Mini SOC, Assessment and Response Report',
  description: 'Build a small monitored lab (SIEM with Windows and Linux agents), run an authorized assessment of a vulnerable training app inside it, detect your own activity with ATT&CK-mapped rules, and write a professional incident and assessment report with remediation and retest evidence.',
  rubric: [
    'Working lab with log collection and at least five tested detection rules mapped to MITRE ATT&CK',
    'Authorized assessment with validated findings, CVSS scores and remediation advice',
    'Incident timeline, IOCs and evidence hashes with a chain-of-custody record',
    'Least privilege, no secrets in the repository, all indicators defanged',
    'Clear README, architecture diagram and a one-page executive summary'
  ],
  instructions: 'Submit your GitHub repository URL and a link to a short recorded walkthrough of your lab.',
  allowedFileTypes: ['.zip', '.pdf', '.md', '.py'],
  maxFileSizeMb: 50,
  githubUrlAllowed: true,
  liveProjectUrlAllowed: true,
  passingScore: 80,
  published: true
};
