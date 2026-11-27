export default {
  n: 13,
  title: 'DevSecOps & Secure Software Development',
  description: 'DevSecOps culture and shift-left, security in every SDLC phase, secure coding and OWASP ASVS, STRIDE threat modeling, source-control and CI/CD pipeline security, SAST, DAST, SCA and IAST, secret scanning, software supply chain security with SBOMs and signing, hardened container builds and the Codecov incident.',
  intro: 'DevSecOps puts security practices, automated checks and compliance inside the normal DevOps delivery process. In the old model, a security team reviewed a finished release weeks later and sent back a long list of problems. In DevSecOps, developers get immediate, automated feedback inside their editor, their pull requests and their CI pipeline, while the code is still fresh in their minds.\n\n“Shift left” means finding flaws as early as possible, when they are cheapest to fix. A design flaw caught in a threat model costs a few minutes of discussion. The same flaw found in production can cost a breach, a public apology and weeks of rework. It is the same reason a tailor takes measurements before cutting the cloth.\n\nThis module walks through security at every stage of the software lifecycle: threat modeling with STRIDE, the main testing types (SAST, DAST, SCA and IAST), secret scanning, pipeline hardening, and software supply-chain integrity with SBOMs and signed artifacts. You will run real open-source tools such as Semgrep, Gitleaks, Syft, Trivy and Cosign.',
  objectives: [
    'Explain DevSecOps, shift-left, and the security activities in each SDLC phase.',
    'Apply secure coding principles and OWASP ASVS requirements.',
    'Threat-model a design with STRIDE.',
    'Compare SAST, DAST, SCA and IAST and place each in a pipeline.',
    'Protect source control, CI/CD runners and secrets.',
    'Secure the software supply chain with SBOMs, signing and hardened container builds.'
  ],
  terms: [
    ['DevSecOps', 'Building security into DevOps culture, automation and pipelines.'],
    ['Shift left', 'Moving security checks earlier in the lifecycle, where fixes are cheaper.'],
    ['SSDLC', 'Secure Software Development Lifecycle: security activities in every phase.'],
    ['Threat modeling', 'Finding design flaws before coding by asking what can go wrong.'],
    ['STRIDE', 'Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.'],
    ['SAST', 'Static analysis of source code; finds the exact line, but with more false positives.'],
    ['DAST', 'Dynamic testing of a running application from the outside.'],
    ['SCA', 'Software Composition Analysis: finds known CVEs in third-party libraries.'],
    ['IAST', 'Interactive testing with an agent inside the running application during tests.'],
    ['SBOM', 'Software Bill of Materials: a machine-readable list of every component (CycloneDX, SPDX).'],
    ['Artifact signing', 'Cryptographically signing builds or images (for example with Sigstore Cosign) to prove they are unmodified.'],
    ['SLSA', 'Supply-chain Levels for Software Artifacts: a framework for build integrity.'],
    ['Distroless image', 'A container image with only the app and its runtime: no shell or package manager.']
  ],
  diagramTitle: 'A secure CI/CD pipeline',
  ascii: ' PLAN        DESIGN        CODE           BUILD / CI              TEST          RELEASE         RUN\n security    threat model  IDE linters,   SAST (Semgrep)          DAST (ZAP)    image scan      WAF, RASP,\n requirements (STRIDE)     pre-commit     SCA (deps, CVEs)        pentest,      (Trivy), IaC    SIEM, bug\n                           secret scan    secret scan (Gitleaks)  fuzzing       scan, SBOM,     bounty\n                           (Gitleaks),    build in ephemeral                    sign (Cosign)\n                           code review    runner, fail on CRITICAL              verify signature\n                                                                                 before deploy\n  <------------------------------- shift left: cheaper to fix ----------------------------------',
  diagramExplain: 'Each phase has its own automated or human check. Checks early in the pipeline (threat modeling, pre-commit and SAST) are the cheapest to act on; later checks (DAST, image scanning, signature verification) catch what slipped through. Gates fail the build on critical findings so insecure code never reaches production.',
  sections: [
    {
      h: '1. Security in every phase of the SDLC',
      t: 'Security is not one gate at the end of a project. It is a small check at every stage, like quality checks in a car factory: each station inspects its own work before passing the car forward, so the final inspection finds very little.\n\nThe table maps activities to each phase of the software development lifecycle (SDLC). In planning, you write security and compliance requirements, such as PCI DSS for card data or India’s DPDP Act for personal data, and classify the data. In design, you build a threat model with STRIDE and map the attack surface. In development, developers follow secure coding standards, use IDE linters, run pre-commit secret scanning and review each other’s code. In build and CI, SAST, SCA and secret checks run automatically and pass or fail the build. In testing, DAST, penetration testing and fuzzing attack the running app. At release, images are scanned, IaC is checked, an SBOM is created and artifacts are signed. In operations, a WAF, RASP, SIEM monitoring and a bug bounty program keep watch.\n\nA common fear is that all these checks will slow delivery. DevSecOps does not slow delivery when the checks are automated and their results arrive where developers already work: a comment on the pull request, not a PDF sent by email two weeks later.',
      table: [
        ['Phase', 'Security activities', 'Artifacts'],
        ['Planning', 'Security and compliance requirements (PCI DSS, DPDP)', 'Requirements, data classification'],
        ['Design', 'Threat modeling (STRIDE), attack surface mapping', 'Threat model, security architecture'],
        ['Development', 'Secure coding standards, IDE linters, pre-commit secret scanning, peer review', 'Reviewed, signed commits'],
        ['Build / CI', 'SAST, SCA, secret checks', 'Reports, gate pass/fail'],
        ['Testing / staging', 'DAST, penetration testing, fuzzing', 'DAST report, verified fixes'],
        ['Release', 'Image scanning, IaC checks, SBOM, signing and verification', 'Signed images, SBOM'],
        ['Operations', 'WAF, RASP, SIEM, bug bounty', 'Telemetry, patch advisories']
      ]
    },
    {
      h: '2. Secure coding and OWASP ASVS',
      t: 'Secure coding means writing code so that whole classes of bugs cannot happen at all. It is like a railway ticket counter where the clerk only accepts a printed form with fixed boxes, rather than free text. You cannot sneak an instruction into a box meant for a station name.\n\nSQL injection is the classic example, shown below. In the vulnerable line, the user’s input is pasted directly into the SQL text with an f-string. If someone types \' OR \'1\'=\'1 as a username, the database reads it as part of the command and may return every user. In the secure version, the query has %s placeholders, and the input is passed separately. The database driver treats it only as data, never as SQL, whatever characters it contains.\n\nThe same thinking gives other defensive patterns. Output encoding stops cross-site scripting (XSS) by turning < and > into harmless text before showing it in a page. Allow-list validation accepts only known-good input, such as a pincode that must be exactly six digits. Safe memory handling avoids buffer overflows in languages like C. And no secrets are hard-coded in source files.\n\nOWASP ASVS (Application Security Verification Standard) turns these ideas into testable requirements at three levels of rigor. Level 1 is the minimum for any app, Level 2 is recommended for most apps that handle sensitive data, and Level 3 is for critical systems such as banking or healthcare. Teams use it as a checklist during design and review.',
      code: '# VULNERABLE: input becomes part of the SQL text\nquery = f"SELECT * FROM users WHERE username = \'{user_input}\'"   # never do this\n\n# SECURE: parameterized statement, input is only data\ncursor.execute(\n    "SELECT id, username, email, role FROM users WHERE username = %s AND status = %s",\n    (user_input, "active"),\n)',
      lang: 'python',
      run: false
    },
    {
      h: '3. Threat modeling with STRIDE',
      t: 'Threat modeling means thinking like an attacker before any code is written. Before a wedding, families plan who stands at the gate, where the gifts are kept and what happens if the power fails. Threat modeling is the same kind of planning for software.\n\nYou start by drawing the data flow: users, services, data stores and trust boundaries. A trust boundary is any line where data moves between areas with different levels of trust, such as the Internet and your API, or your API and the database. Then you ask the six STRIDE questions at each element and boundary. Can someone pretend to be another user (Spoofing)? Can someone change data or code (Tampering)? Can someone deny an action they took (Repudiation)? Can private data leak (Information disclosure)? Can someone make the system unavailable (Denial of service)? Can a normal user gain admin rights (Elevation of privilege)?\n\nEach threat maps to a security goal and a standard control, as the table shows. Take a college fee payment app. Spoofing a student is countered with MFA. Tampering with the fee amount in transit is countered with TLS and server-side checks. A student claiming “I never paid” is answered with secure, immutable audit logs.\n\nThe output is a short list of threats with owners and fixes. A threat model does not need to be perfect. One hour with a whiteboard finds problems that would take weeks to fix later.',
      table: [
        ['Threat', 'Attacker goal', 'Goal violated', 'Countermeasure'],
        ['Spoofing', 'Pretend to be another user or service', 'Authenticity', 'MFA, signatures, mutual TLS'],
        ['Tampering', 'Modify code, data or packets', 'Integrity', 'HMAC, signatures, TLS'],
        ['Repudiation', 'Deny having done an action', 'Non-repudiation', 'Secure, immutable audit logs'],
        ['Information disclosure', 'Expose private data or secrets', 'Confidentiality', 'Encryption, least privilege'],
        ['Denial of service', 'Exhaust CPU, memory, connections', 'Availability', 'Rate limits, DDoS protection, autoscaling'],
        ['Elevation of privilege', 'Gain admin capabilities', 'Authorization', 'RBAC, least privilege, input validation']
      ]
    },
    {
      h: '4. Application security testing types',
      t: 'No single testing tool finds everything, so teams combine them along the pipeline. A doctor does the same: a blood test, an X-ray and a physical check each reveal different problems, and no one test replaces the others.\n\nSAST (static application security testing) reads source code or bytecode without running it. It is white-box testing and runs at commit or before merge. It points to the exact line, early, but raises more false positives. DAST (dynamic testing) attacks the running application from outside, like a real attacker, usually in staging. It finds real, exploitable behavior but cannot tell you which code line is responsible. SCA (software composition analysis) parses dependency manifests such as package.json or requirements.txt and reports known CVEs in third-party libraries, though it does not find flaws in your own code. IAST places an agent inside the running app during integration tests, so it sees both the request and the code path. It needs good test coverage to be useful.\n\nThe output below shows Semgrep, a popular SAST tool, scanning the src folder with the OWASP Top Ten rule pack. It ran 124 rules across 18 files and found 2 issues, including untrusted input concatenated into a SQL statement at line 42 of auth.py.\n\nThe common mistake is buying one tool and assuming the job is done. A sensible beginner setup is Semgrep for SAST, a dependency scanner for SCA and OWASP ZAP for DAST.',
      table: [
        ['', 'SAST', 'DAST', 'SCA', 'IAST'],
        ['Analyzes', 'Source code / bytecode', 'Running application', 'Third-party dependencies', 'Running app with an agent'],
        ['Runs the app?', 'No (white-box)', 'Yes (black-box)', 'No (manifest parsing)', 'Yes (instrumented)'],
        ['Pipeline stage', 'Commit / pre-merge', 'Staging', 'Build / pull request', 'Integration tests'],
        ['Strength', 'Points to the exact line, early', 'Real, exploitable behavior', 'Known CVEs in libraries', 'Context of both'],
        ['Limitation', 'More false positives', 'Cannot point to the code line', 'Does not find custom-code flaws', 'Needs good test coverage']
      ],
      code: '$ semgrep scan --config=p/owasp-top-ten ./src\nsrc/auth.py:42  python.sqlalchemy.security.injection.taint-sql-injection\n  Untrusted input concatenated into a SQL statement.\nRan 124 rules across 18 files. 2 findings.'
    },
    {
      h: '5. Securing source control and the pipeline',
      t: 'A CI/CD pipeline holds privileged credentials, source code and deployment rights. That makes it a high-value target. If an attacker controls the pipeline, they do not need to break into production; the pipeline will deploy their code for them. Think of it as the master key cabinet in a hostel office.\n\nThe bullets list the main controls. Protect branches with required reviews, required status checks and signed commits, and allow no direct pushes to main. Run secret scanning on the server as well as in pre-commit hooks, because a developer can skip hooks with git commit --no-verify. Use ephemeral runners that are created fresh for each job, so one compromised build cannot persist. Give jobs short-lived credentials through OIDC federation instead of long-lived cloud keys stored as secrets. Pin third-party actions and dependencies to specific versions or commit hashes, and review any change to pipeline files. Fail builds on CRITICAL findings and on secrets, and track accepted exceptions with an owner and an expiry date.\n\nThe example config below adds Gitleaks as a pre-commit hook, pinned to version v8.18.2. After running pre-commit install, every git commit is scanned, and a commit containing something like an AWS access key is blocked before it ever leaves the laptop.\n\nRemember that a secret pushed to Git stays in the history even after you delete the file. If one leaks, rotate it immediately. Cleaning the history alone is not enough.',
      b: [
        'Protect branches: required reviews, required status checks and signed commits; no direct pushes to main.',
        'Enforce secret scanning on the server as well as in pre-commit hooks, because hooks can be skipped with --no-verify.',
        'Use ephemeral (fresh per job) runners so one compromised build cannot persist.',
        'Give pipeline jobs short-lived credentials via OIDC federation instead of long-lived cloud keys.',
        'Pin third-party actions and dependencies to specific versions or commit hashes, and review changes to pipeline files.',
        'Fail builds on CRITICAL findings and secrets; track accepted exceptions with an owner and expiry.'
      ],
      code: '# .pre-commit-config.yaml: block commits that contain secrets\nrepos:\n  - repo: https://github.com/gitleaks/gitleaks\n    rev: v8.18.2\n    hooks:\n      - id: gitleaks',
      lang: 'yaml'
    },
    {
      h: '6. Software supply chain security',
      t: 'Most modern applications are largely made of open-source components. Your own code may be a small part of what ships. This is like a restaurant that buys spices, oil and vegetables from many suppliers: if one supplier sends a bad batch, every dish that used it is affected. One compromised dependency can reach thousands of organizations.\n\nAn SBOM (Software Bill of Materials) is the ingredient list. Written in CycloneDX or SPDX format, it records every library and version inside your build. When a critical CVE such as Log4Shell appears, you search your SBOMs and answer “are we affected?” within minutes instead of days.\n\nThe commands below show a simple flow. Syft generates an SBOM for the image myapp:1.4.2 in CycloneDX JSON. Trivy scans the image and, because of --exit-code 1, fails the pipeline if it finds CRITICAL or HIGH vulnerabilities. Cosign signs the image with a private key, and before deployment cosign verify checks the signature with the public key. A valid signature proves the image is the one your pipeline built, not one swapped in by an attacker.\n\nWatch for two tricks. Dependency confusion happens when an attacker publishes a public package with the same name as your internal one, and the build tool picks the public version. Typosquatting uses names that look almost right, such as “reqeusts” instead of “requests”. Pin versions and use a private registry to reduce both risks.',
      code: 'syft myapp:1.4.2 -o cyclonedx-json > sbom.json      # generate an SBOM\ntrivy image --severity CRITICAL,HIGH --exit-code 1 myapp:1.4.2\ncosign sign --key cosign.key registry.example/myapp:1.4.2\ncosign verify --key cosign.pub registry.example/myapp:1.4.2'
    },
    {
      h: '7. Hardened container builds',
      t: 'A container image should contain only what the application needs to run. Every extra tool inside it, such as a shell, curl or a package manager, is something an attacker can use after breaking in. It is like moving house: you pack only what you will use, not the whole storeroom.\n\nMulti-stage builds make this easy, as the Dockerfile below shows. Stage 1 uses the full golang:1.22-alpine image, downloads modules and compiles the program. CGO_ENABLED=0 makes a static binary, and -ldflags="-w -s" strips debug information to make it smaller. Stage 2 starts again from a distroless image, gcr.io/distroless/static-debian12:nonroot, and copies in only the compiled binary. The compiler, source code and build tools stay behind in stage 1 and never ship.\n\nDistroless images contain no shell or package manager, which shrinks the attack surface. If an attacker finds a bug in the server, they cannot simply run /bin/sh, because it does not exist. The USER nonroot:nonroot line means the app also runs as a non-root user, so even a successful exploit gets limited rights. The final image is often only a few megabytes, which also means fewer CVEs for Trivy to report.\n\nOne practical tip: because there is no shell, you cannot docker exec into the container for debugging. Teams keep a separate debug image for that and never use it in production.',
      code: '# Stage 1: build\nFROM golang:1.22-alpine AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 go build -ldflags="-w -s" -o server .\n\n# Stage 2: minimal runtime, no shell, non-root\nFROM gcr.io/distroless/static-debian12:nonroot\nCOPY --from=builder /app/server /app/server\nUSER nonroot:nonroot\nEXPOSE 8080\nENTRYPOINT ["/app/server"]',
      lang: 'dockerfile'
    },
    {
      h: '8. Troubleshooting a DevSecOps program',
      t: 'DevSecOps pipelines fail socially as often as technically. If the tools annoy developers, people find ways around them. It is like a strict hostel rule that nobody follows because it is inconvenient; the rule exists on paper but protects no one.\n\nThe table lists common symptoms and fixes. Developers bypass pre-commit hooks with git commit --no-verify, so the real control must be server-side branch protection and CI secret scanning. A SAST tool raises 400 false positives because a generic rule pack was run on a legacy codebase; the fix is to baseline existing issues and scan only new changes (diffs), so developers see only problems they just created. Long-lived runners run out of disk because of bloated cached layers; ephemeral, auto-scaling runners solve this and also improve security. A secret scanner keeps flagging dummy test values; ignore those specific fingerprints, not whole folders, or a real secret in the same folder will be missed.\n\nIn practice, a good security engineer spends as much time talking to developers as configuring tools. Explain why a check exists, keep the rules tuned and fast, and fix noisy rules quickly.\n\nA useful measure is how many findings get fixed, not how many are reported. A tool that reports 2,000 issues that nobody reads is less useful than one that reports 10 issues that all get fixed in the same week.',
      table: [
        ['Symptom', 'Root cause', 'Fix'],
        ['Developers bypass pre-commit hooks', 'git commit --no-verify', 'Server-side branch protection and CI secret scanning'],
        ['SAST raises 400 false positives', 'Generic rule pack on a legacy codebase', 'Baseline existing issues; scan only new changes (diffs)'],
        ['Runners run out of disk', 'Bloated cached layers on long-lived runners', 'Ephemeral, auto-scaling runners'],
        ['Secret scanner flags test dummies', 'No context for known test values', 'Ignore specific fingerprints, not whole folders']
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 13: SAST, secret scanning and an image gate',
    steps: [
      ['Run Semgrep against a deliberately vulnerable sample app (for example a local copy of a training repository).', 'pip install semgrep\nsemgrep scan --config=auto --config=p/owasp-top-ten ./src', 'Fix one SQL injection and one command injection finding, then rerun until they disappear.'],
      ['Install the pre-commit framework with Gitleaks, then try to commit a fake key.', 'pip install pre-commit\npre-commit install\necho "aws_secret_access_key = AKIAFAKEEXAMPLE1234567890" > config.txt\ngit add config.txt && git commit -m "test"   # should be blocked', 'Use only obviously fake test values. Then enable secret scanning on the server too.'],
      ['Scan a container image with Trivy and make the job fail on CRITICAL findings.', 'trivy image --severity CRITICAL,HIGH --exit-code 1 python:3.8-slim\ntrivy image --severity CRITICAL,HIGH --exit-code 1 gcr.io/distroless/python3-debian12', 'Compare an older full image with a distroless one: fewer packages means fewer CVEs.'],
      ['Generate an SBOM for your image and search it for a library name, as you would during a Log4Shell-style emergency.', 'syft myapp:latest -o cyclonedx-json > sbom.json\npython -c "import json; print([c[\'name\'] for c in json.load(open(\'sbom.json\'))[\'components\']][:20])"', 'An SBOM per release turns “are we affected?” into a search instead of a scramble.']
    ]
  },
  examples: [
    {
      title: 'A tiny secret scanner',
      lang: 'python',
      code: 'import re\n\nPATTERNS = {\n    "AWS access key id": r"\\bAKIA[0-9A-Z]{16}\\b",\n    "Private key block": r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----",\n    "Generic password": r"(?i)password\\s*=\\s*[\'\\"][^\'\\"]{6,}[\'\\"]",\n}\n\nfiles = {\n    "settings.py": "DEBUG = False\\npassword = \'Summer2026!\'\\n",\n    "deploy.sh": "export AWS_KEY=AKIAABCDEFGHIJKLMNOP\\n",\n    "README.md": "Use environment variables for secrets.\\n",\n}\n\nfor name, text in files.items():\n    for label, rx in PATTERNS.items():\n        for m in re.finditer(rx, text):\n            print(f"{name}: {label} -> {m.group(0)[:12]}...")',
      explanation: 'Real scanners such as Gitleaks and GitHub secret scanning use hundreds of patterns plus entropy checks, but the idea is the same: match secret shapes before they reach a shared repository. The fix is always rotate first, then remove.'
    },
    {
      title: 'A pipeline gate that fails on critical findings',
      lang: 'python',
      code: 'findings = [\n    {"tool": "semgrep", "severity": "HIGH", "id": "sql-injection", "file": "auth.py"},\n    {"tool": "trivy", "severity": "CRITICAL", "id": "CVE-2021-44228", "file": "log4j-core-2.14.1.jar"},\n    {"tool": "gitleaks", "severity": "CRITICAL", "id": "aws-access-key", "file": "deploy.sh"},\n    {"tool": "trivy", "severity": "MEDIUM", "id": "CVE-2023-0001", "file": "openssl"},\n]\nBLOCKING = {"CRITICAL"}\n\nblockers = [f for f in findings if f["severity"] in BLOCKING]\nfor f in blockers:\n    print(f"BLOCK  {f[\'tool\']:8} {f[\'id\']:16} {f[\'file\']}")\nprint("exit code:", 1 if blockers else 0)',
      explanation: 'CI systems stop a pipeline when a step exits with a non-zero code. Setting the threshold (block CRITICAL, warn on HIGH) is a policy decision agreed with the development teams.'
    }
  ],
  best: [
    'Threat-model new features with STRIDE before writing code.',
    'Run SAST, SCA and secret scanning on every pull request, and DAST in staging.',
    'Fail builds on critical vulnerabilities and on any detected secret.',
    'Protect main with reviews, status checks and signed commits.',
    'Use ephemeral runners and OIDC instead of long-lived pipeline secrets.',
    'Produce an SBOM, sign artifacts, and verify signatures before deployment.'
  ],
  mistakes: [
    'Adding scanners but never failing the build, so findings pile up unread.',
    'Relying only on client-side pre-commit hooks that developers can skip.',
    'Removing a leaked secret from the code without rotating it.',
    'Using third-party CI actions pinned to a moving tag like @master.',
    'Shipping full OS images that run as root.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Draw the data flow of a login feature and list one STRIDE threat at each trust boundary.\n2. Explain when you would use SAST, DAST, SCA and IAST, and their main limitations.\n3. A developer committed an API key to a branch and pushed. List the steps in the right order.\n4. Why are ephemeral runners safer than long-lived ones?\n5. What is dependency confusion, and how do you prevent it?\n6. Explain how an SBOM helped organizations respond to Log4Shell.'
  },
  mini: {
    title: 'Mini project: a secure CI/CD pipeline',
    objective: 'Build a pipeline that blocks insecure code before it ships.',
    requirements: [
      'Branch protection with required reviews, signed commits and status checks.',
      'A workflow running Gitleaks, Semgrep, Trivy and Cosign.',
      'An SBOM generated with Syft in CycloneDX format.',
      'Gates that fail on any CRITICAL CVE or hard-coded secret.',
      'A short document mapping the controls to NIST SP 800-218 (SSDF).'
    ],
    deliverable: 'A public repository with the workflow file, a README, and screenshots of a blocked and a passing run.'
  },
  takeaways: [
    'Security belongs in every phase, automated where developers already work.',
    'STRIDE finds design flaws before code exists.',
    'SAST, DAST, SCA and IAST each find different problems; combine them.',
    'Pipelines are high-value targets: protect branches, runners and secrets.',
    'SBOMs, signing and minimal images secure the software supply chain.'
  ],
  quickRef: [
    'STRIDE: Spoofing · Tampering · Repudiation · Info disclosure · DoS · Elevation',
    'SAST = code · DAST = running app · SCA = libraries · IAST = agent at runtime',
    'semgrep · gitleaks · trivy --exit-code 1 · syft · cosign sign/verify',
    'Multi-stage build · distroless · USER nonroot',
    'Leaked secret: rotate → revoke → remove from history → scan'
  ],
  refs: [
    ['NIST SP 800-218: Secure Software Development Framework', 'https://csrc.nist.gov/pubs/sp/800/218/final'],
    ['OWASP ASVS', 'https://owasp.org/www-project-application-security-verification-standard/'],
    ['SLSA framework', 'https://slsa.dev/'],
    ['OWASP SAMM', 'https://owaspsamm.org/'],
    ['Sigstore', 'https://www.sigstore.dev/']
  ],
  quiz: [
    ['What does “shift left” mean in DevSecOps?', ['Moving servers to another region', 'Finding and fixing security issues earlier in the lifecycle', 'Deploying on Mondays', 'Removing testing'], 1, 'Earlier fixes are cheaper and faster.'],
    ['Which testing type analyzes source code without running it?', ['DAST', 'SAST', 'IAST', 'Penetration testing'], 1, 'SAST is static, white-box analysis.'],
    ['Which tool type finds known CVEs in third-party libraries?', ['SCA', 'DAST', 'A WAF', 'A linter'], 0, 'Software Composition Analysis checks dependencies against vulnerability databases.'],
    ['In STRIDE, what does the R stand for?', ['Ransomware', 'Repudiation', 'Rootkit', 'Replication'], 1, 'Repudiation: denying an action; countered by secure audit logs.'],
    ['What is an SBOM?', ['A firewall rule set', 'A machine-readable list of software components and dependencies', 'A signing key', 'A container registry'], 1, 'SBOMs make it fast to find affected software when a CVE appears.']
  ],

  skills: ['Threat-model with STRIDE', 'Choose SAST, DAST, SCA and IAST', 'Set pipeline security gates', 'Handle leaked secrets', 'Generate SBOMs and sign artifacts'],
  prereq: ['Module 04 (secure coding)', 'Module 06 (OWASP Top 10)', 'Module 12 (containers and IaC)'],
  analogy: 'A car factory with quality checks at every station instead of one inspection at the gate: the design is reviewed for safety, each part is checked when it arrives (dependencies), each weld is checked as it is made (SAST), and the finished car is crash-tested (DAST) and stamped with a tamper-proof serial plate (signing) before it leaves.',
  why: 'Software is how most attacks get in, and modern teams ship many times a day. Only automated security built into the pipeline can keep up, which is why DevSecOps engineers are in high demand.',
  workflow: {
    title: 'A pull request through a secure pipeline',
    nodes: [
      ['pr', 'Pull request', 'Developer opens a PR', 'Code change', 'Triggered pipeline', 'Branch protection means the change cannot reach main without passing checks and a human review.'],
      ['secrets', 'Secret scan', 'Gitleaks on the diff', 'Changed files', 'Pass or block', 'Any detected secret blocks the merge. If one leaked, rotate it immediately: removing it from code is not enough.'],
      ['sast', 'SAST', 'Semgrep / CodeQL', 'Source code', 'Code findings', 'New high and critical findings are reported inline on the PR so the developer fixes them while the code is fresh.'],
      ['sca', 'SCA', 'Dependency check', 'Lock files', 'Vulnerable libraries', 'Known CVEs in dependencies are flagged with the fixed version; critical ones fail the build.'],
      ['image', 'Build, scan, sign', 'Trivy + SBOM + Cosign', 'Container image', 'Signed image and SBOM', 'The image is built in an ephemeral runner, scanned, given an SBOM and signed.'],
      ['deploy', 'Verify and deploy', 'Signature check + DAST', 'Signed image', 'Running release', 'The platform deploys only signed images; DAST runs against staging before production.']
    ],
    explanation: 'Each check runs automatically; humans focus on review and on the findings that matter.'
  },
  caseStudy: {
    title: 'The Codecov Bash Uploader compromise (2021)',
    problem: 'Attackers obtained credentials from a flawed public Docker image and modified Codecov’s Bash Uploader script hosted in cloud storage.',
    data: 'The script’s published checksum, CI environment variables, outbound requests from CI runners.',
    steps: ['A credential was extracted from a public image.', 'The attackers altered the official uploader script.', 'Customers’ CI pipelines downloaded and ran the script, which sent their CI environment variables (including secrets) to the attackers.', 'The change was eventually noticed because the script no longer matched its published checksum.'],
    result: 'Verifying checksums or signatures of downloaded tools, minimizing secrets in CI and rotating them quickly limit this kind of supply-chain attack.',
    limitations: 'Simplified summary; read primary sources for details.'
  },
  exercises: [
    { title: 'STRIDE classification', objective: 'Map threats to STRIDE.', problem: 'A user changes the price field in a checkout request from 999 to 1 and the server accepts it. Which STRIDE category is this?', options: ['Spoofing', 'Tampering', 'Repudiation', 'Denial of service'], answer: 1, hints: ['Data was modified.'], solution: ['Modifying data in transit or in a request is Tampering.', 'Fix: calculate prices on the server.'], explanation: 'Integrity controls stop tampering.' },
    { title: 'Leaked secret: first step', objective: 'Respond to a secret leak.', problem: 'An AWS key was pushed to a public repository. What should you do first?', options: ['Delete the file in a new commit', 'Revoke/rotate the key immediately', 'Make the repository private and wait', 'Rename the variable'], answer: 1, hints: ['Bots find keys within minutes.'], solution: ['Rotate or revoke the key first.', 'Then review cloud logs for misuse and clean the git history.'], explanation: 'The key stays valid and visible in history until it is revoked.' },
    { type: 'Short answer', title: 'Name the format', objective: 'Know SBOM standards.', problem: 'Name one standard SBOM format (CycloneDX or the other common one).', accept: ['cyclonedx', 'spdx'], hints: ['One is from OWASP, one from the Linux Foundation.'], solution: ['CycloneDX (OWASP) or SPDX (Linux Foundation).'], explanation: 'Both are machine-readable and widely supported.' },
    { title: 'Which test finds this?', objective: 'Pick the right testing type.', problem: 'Your app uses an old library with a known critical CVE. Which tool type finds this most directly?', options: ['DAST', 'SCA', 'Threat modeling', 'A WAF'], answer: 1, hints: ['It is about third-party components.'], solution: ['SCA compares dependency versions with vulnerability databases.'], explanation: 'SAST looks at your own code; SCA looks at what you imported.' }
  ],
  checks: [
    ['Why are ephemeral CI runners safer?', ['They are cheaper', 'Each job starts clean, so a compromise cannot persist between builds', 'They run faster', 'They need no network'], 1, 'Fresh runners limit the blast radius of a poisoned build.'],
    ['What does a distroless image omit?', ['The application', 'The shell and package manager', 'TLS', 'Logging'], 1, 'Fewer tools means less for an attacker to use and fewer CVEs.'],
    ['What does Cosign provide?', ['Vulnerability scanning', 'Signing and verification of container images', 'Secret scanning', 'Load balancing'], 1, 'Signatures prove an image came from your pipeline unchanged.']
  ],
  cheat: ['Shift left', 'STRIDE per trust boundary', 'PR: secrets → SAST → SCA → build → scan → SBOM → sign', 'Fail on CRITICAL + secrets', 'Rotate leaked secrets first'],
  next: 'Module 14 covers identity, governance, risk and compliance: IAM programs, frameworks, audits and how security is managed as a business function.'
};
