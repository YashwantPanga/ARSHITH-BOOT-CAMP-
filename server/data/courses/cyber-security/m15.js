export default {
  n: 15,
  title: 'Capstone, Career & Professional Development',
  description: 'Cyber security career paths and roadmaps, certifications by stage, an ATS-friendly resume, a GitHub security portfolio, technical and scenario interview answers, five capstone project blueprints with a grading rubric, professional ethics, and a 30-60-90 day plan.',
  intro: 'You now have the building blocks of the whole field: fundamentals, networks, operating systems, scripting, cryptography, web security, ethical hacking, vulnerability management, SOC work, forensics, malware and intelligence, cloud, DevSecOps, identity and GRC. This final module turns that knowledge into a job.\n\nEmployers hire people who can show their skills, not just list them. A resume line that says “knows SIEM” is easy to write; a GitHub repository with working detection rules and a clear incident report is proof. In this module you will choose a career path, plan certifications that match it, write a resume that passes applicant tracking systems, build a GitHub portfolio with a professional capstone project, and practice the scenario questions that interviewers actually ask.\n\nThe module ends with a 30-60-90 day plan, so you keep moving after the course. Treat it like preparing for a placement season: steady weekly work beats a last-minute rush.',
  objectives: [
    'Compare the main cyber security roles and choose a target path.',
    'Plan certifications by career stage and role.',
    'Write an ATS-friendly, achievement-focused resume.',
    'Build a GitHub portfolio with documented, safe security projects.',
    'Answer technical and scenario interview questions with a clear structure.',
    'Deliver a capstone project that meets a professional rubric.'
  ],
  terms: [
    ['Career path', 'A sequence of roles and skills toward a target job, such as SOC analyst → incident responder → threat hunter.'],
    ['ATS', 'Applicant Tracking System: software that parses and filters resumes by keywords before a human sees them.'],
    ['Portfolio', 'Public evidence of your skills: repositories, write-ups, lab reports and diagrams.'],
    ['Write-up', 'A clear explanation of how you solved a lab or CTF challenge, for learning and for your portfolio.'],
    ['CTF', 'Capture the Flag: legal security competitions and challenges.'],
    ['Defanging', 'Making indicators unclickable in documents, such as hxxp://evil[.]example.'],
    ['STAR method', 'Situation, Task, Action, Result: a structure for answering behavioral questions.'],
    ['Capstone', 'A final, end-to-end project that demonstrates professional-level skills.'],
    ['Homelab', 'Your own lab of VMs and tools for safe, legal practice.'],
    ['30-60-90 plan', 'Goals for the first 30, 60 and 90 days, used to stay focused and to show initiative in interviews.']
  ],
  diagramTitle: 'Career pillars and the path from learning to hiring',
  ascii: '                  +--------------------- FOUNDATIONS -----------------------+\n                  | networks · Linux/Windows · scripting · crypto · web     |\n                  +---------------------------+-----------------------------+\n        +-------------------+-----------------+-------------------+-------------------+\n   DEFENSIVE (blue)    OFFENSIVE (red)    ENGINEERING           GOVERNANCE\n   SOC analyst         pentester          cloud security eng.   GRC analyst\n   incident responder  red teamer         DevSecOps engineer    auditor / IAM\n   threat hunter, DFIR app-sec tester     detection engineer    risk / privacy\n\n   LEARN -> LAB (homelab, legal platforms) -> BUILD (capstone + write-ups)\n         -> CERTIFY (by role) -> SHOW (GitHub, resume, LinkedIn) -> INTERVIEW -> GROW',
  diagramExplain: 'Every path shares one foundation, then branches into defensive, offensive, engineering and governance roles. Hiring follows evidence: labs and capstones you can show, certifications that match the role, and clear answers in interviews.',
  sections: [
    {
      h: '1. Career roles',
      t: 'Cyber security is not one job. It is an ecosystem of offensive testing, defensive operations, security engineering and governance. Think of a hospital: surgeons, nurses, lab technicians and administrators all work for patient health, but their daily work is very different. Security roles are the same.\n\nThe table shows six common entry paths. A SOC analyst triages SIEM alerts, investigates endpoints and isolates infected hosts, using tools such as Splunk, Sentinel, EDR and Wireshark. A penetration tester performs authorized testing of web apps, networks and APIs with Burp Suite, Nmap and BloodHound. A cloud security engineer secures cloud tenants, IAM, VPCs and encryption. A DevSecOps engineer embeds SAST, SCA, secret and image scans in CI/CD pipelines. A DFIR specialist does disk and memory forensics, builds timelines and triages malware. A GRC analyst runs risk assessments, writes policies and supports audits against NIST and ISO 27001.\n\nThe last column matters most for a fresher. It shows the evidence that gets you shortlisted. For a SOC role, that is strong TCP/IP and Linux or Windows skills plus a home SOC lab with Sysmon. For a pentest role, it is scripting, a practical certification such as eJPT or OSCP, and published write-ups.\n\nPick one target role for the next 6 to 12 months, so your learning, projects and certifications line up. Spreading effort across all six usually leaves you average at everything and shortlisted for nothing.',
      table: [
        ['Role', 'Main responsibilities', 'Core tools', 'Entry evidence'],
        ['SOC Analyst (Tier 1/2)', 'Triage SIEM alerts, investigate endpoints, isolate hosts', 'Splunk, Sentinel, EDR, Wireshark', 'TCP/IP and Linux/Windows skills; a home SOC lab with Sysmon'],
        ['Penetration Tester', 'Authorized testing of web apps, networks and APIs', 'Burp Suite, Nmap, BloodHound', 'Scripting, eJPT/OSCP, published write-ups'],
        ['Cloud Security Engineer', 'Secure cloud tenants, IAM, VPCs, encryption', 'AWS/Azure IAM, KMS, Terraform, Checkov', 'Cloud certs; hardened Terraform modules on GitHub'],
        ['DevSecOps Engineer', 'Embed SAST, SCA, secrets and image scans in CI/CD', 'GitHub Actions, Semgrep, Trivy, Gitleaks, Cosign', 'Docker and Git; a working secure pipeline'],
        ['DFIR Specialist', 'Disk and memory forensics, timelines, malware triage', 'Autopsy, Volatility 3, FTK Imager, KAPE', 'Sample forensic reports'],
        ['GRC Analyst', 'Risk assessments, policies, audits (NIST, ISO 27001)', 'Risk registers, GRC platforms', 'A sample risk assessment and policy set']
      ]
    },
    {
      h: '2. Certifications by stage',
      t: 'Certifications help most when backed by hands-on skill. A certificate is like a driving license: it shows you passed a test, but an employer still wants to see you drive. Interviewers often ask you to explain or demonstrate something from the exam syllabus.\n\nThe table groups certifications by stage. Foundational ones include CompTIA Security+, which suits SOC Tier 1 or IT support staff moving into security, and ISC2 Certified in Cybersecurity (CC), a good first credential for beginners. Intermediate options include CompTIA CySA+ for SOC Tier 2 and blue team analysts, and the AWS or Azure security specialty for cloud security engineers. On the offensive side, eJPT or PNPT suit junior penetration testers, and OSCP (PEN-200) is an advanced practical exam for pentesters and red teamers. CISSP is an expert, management-level certification that requires years of work experience, and it suits security architects, GRC leads and the CISO track.\n\nA sensible plan for a SOC-focused student might be: ISC2 CC in the first semester of preparation, then Security+, with a home lab and two write-ups built alongside. A pentest-focused student might do eJPT first and work towards OSCP later.\n\nChoose by target role, not by popularity or what a friend is doing. Before paying, check current prices, prerequisites and exam formats on the vendor sites, because these change often. Many vendors offer student discounts or free training material.',
      table: [
        ['Certification', 'Level', 'Best for'],
        ['CompTIA Security+', 'Foundational', 'SOC Tier 1, IT support moving into security'],
        ['ISC2 Certified in Cybersecurity (CC)', 'Foundational', 'First credential for beginners'],
        ['CompTIA CySA+', 'Intermediate', 'SOC Tier 2, blue team analyst'],
        ['eJPT / PNPT', 'Junior practical', 'Junior penetration tester'],
        ['OSCP (PEN-200)', 'Advanced practical', 'Penetration tester, red team'],
        ['AWS / Azure security specialty', 'Intermediate', 'Cloud security engineer'],
        ['CISSP', 'Expert / management (requires experience)', 'Security architect, GRC lead, CISO track']
      ]
    },
    {
      h: '3. An ATS-friendly resume',
      t: 'Many companies use an applicant tracking system (ATS) that reads and filters resumes before a recruiter ever sees them. It works a bit like a railway reservation system that only accepts details in the right boxes. If the software cannot read your resume, a human never will.\n\nTo pass the ATS, use a clean single-column layout and standard headings: Summary, Skills, Projects, Experience, Education and Certifications. Avoid tables, images and multi-column templates, because parsers often mix up their text. Copy the important keywords from the job description, such as “SIEM”, “incident response” or “AWS IAM”, where they truthfully match your skills. Then write quantified achievements, because numbers show impact.\n\nThe bullets give strong examples. If you lack work experience, lead with projects: “Built a home SOC with Wazuh and Sysmon; wrote 6 detection rules mapped to MITRE ATT&CK.” Quantify results: “Reduced false positives by 40% by tuning 3 noisy rules.” Group skills into clear clusters, and link your GitHub, LinkedIn and your best write-up so a recruiter can check your work in one click.\n\nKeep it to one page early in your career, and tailor it to each job. A common mistake is sending the same resume to fifty companies. Spending ten minutes adjusting the summary and skills for each role gets far more interview calls than one generic version.',
      b: [
        'Lead with projects if you lack experience: “Built a home SOC with Wazuh and Sysmon; wrote 6 detection rules mapped to MITRE ATT&CK.”',
        'Quantify: “Reduced false positives by 40% by tuning 3 noisy rules.”',
        'Group skills: Networking · Linux/Windows · Python/Bash · SIEM · Burp/ZAP · AWS IAM · Incident response.',
        'Link GitHub, LinkedIn and your best write-up; avoid tables, images and multi-column templates that confuse parsers.',
        'Keep it to one page early in your career, and tailor it to each job.'
      ]
    },
    {
      h: '4. A GitHub security portfolio',
      t: 'Your portfolio is proof. In an interview, saying “I know Docker security” is a claim, but a link to a working, documented project is evidence. Three well-documented projects beat twenty empty repositories, just as three good dishes impress more than a long menu of half-cooked ones.\n\nEvery repository needs a README that explains the problem, shows an architecture diagram, lists setup commands, includes sample output and covers security considerations. A recruiter may spend only two minutes on your profile, so the README should answer “what is this, and does it work?” immediately. Pin your best projects on your GitHub profile and keep the commit history clean and meaningful, with messages like “Add Sigma rule for encoded PowerShell” rather than “update”.\n\nSafety rules apply to portfolios too. Defang all indicators, for example hxxp://evil[.]example or 203.0.113[.]7, so nobody clicks them by accident. Never host live malware or real customer data. Never commit secrets: use .gitignore, environment variables and secret scanning, because bots scan public GitHub for keys within minutes.\n\nWrite lab reports and CTF write-ups only for platforms that allow them, and never publish targets you were not authorized to test. A portfolio that shows you respect these rules is itself a signal to employers that you can be trusted with access to their systems.',
      b: [
        'Every repository needs a README: problem, architecture diagram, setup commands, sample output and security considerations.',
        'Defang all indicators (hxxp://evil[.]example, 203.0.113[.]7) and never host live malware or real customer data.',
        'Never commit secrets: use .gitignore, environment variables and secret scanning.',
        'Write lab reports and CTF write-ups only for platforms that allow them, and never publish targets you were not authorized to test.',
        'Pin your best projects and keep commit history clean and meaningful.'
      ]
    },
    {
      h: '5. Technical interview foundations',
      t: 'Technical interviews for entry-level roles focus on fundamentals. Expect questions such as the TCP three-way handshake, what happens when you type a URL into a browser, DNS, common ports, Linux permissions, hashing versus encryption, the OWASP Top 10, and how you would investigate a suspicious login.\n\nThe best way to answer is in layers, like explaining a recipe to a friend: first the name of the dish, then how it is made, then an example, then a tip. For each question, give a one-line definition, explain how it works, add an example, and finish with the security angle. Take “What does chmod 744 mean?”. Definition: it sets file permissions. How it works: each digit is a sum of read (4), write (2) and execute (1), for owner, group and others. Example: 7 means rwx for the owner, and 4 means read only for group and others. Security angle: never give write permission to others on scripts that run as root.\n\nThe table gives strong short answers for other common questions, such as hashing being one-way for integrity while encryption is reversible with a key for confidentiality, or an IDS alerting out of band while an IPS sits inline and can block.\n\nIf you do not know an answer, say so and explain how you would find out. Interviewers respect honest reasoning far more than confident guessing.',
      table: [
        ['Question', 'Strong short answer'],
        ['Hashing vs encryption?', 'Hashing is one-way for integrity; encryption is reversible with a key for confidentiality.'],
        ['What is XSS and how do you stop it?', 'Untrusted input runs as script in a browser; encode output, use CSP and HttpOnly cookies.'],
        ['IDS vs IPS?', 'IDS detects and alerts out of band; IPS sits inline and can block.'],
        ['What does chmod 744 mean?', 'Owner rwx, group read, others read.'],
        ['What is least privilege?', 'Give users and services only the access they need, nothing more.']
      ]
    },
    {
      h: '6. Scenario interview questions',
      t: 'Scenario questions test your process, not just your memory. The interviewer describes an incident and watches how you think. It is like a viva where the examiner asks “what would you do if the experiment failed?”: there is no single correct sentence, but there is a correct order of steps.\n\nUse a clear structure every time: verify, contain, investigate, eradicate and recover, then communicate and learn. Verify that the alert is real. Contain the damage so it cannot spread. Investigate what happened and how far it went. Eradicate the cause, recover normal service, then document and share the lessons.\n\nThe bullets show this structure applied. For a suspicious attachment, you isolate the workstation with EDR but do not power it off, because memory holds evidence. You then collect the email, the attachment hash and the process tree, check other recipients, block the sender and IOCs, reset the user’s credentials, scan for persistence, and brief the user. For a public S3 bucket with database backups, you enable Block Public Access first, then check CloudTrail and access logs, rotate exposed credentials, and involve legal for notification duties. For many failed logins followed by a success from abroad, you treat it as account compromise and revoke sessions and tokens.\n\nSay your steps out loud in order. A calm, structured answer shows the interviewer how you would behave at 2 am during a real incident.',
      b: [
        '“A user opened a suspicious attachment.” Isolate the workstation with EDR (do not power off, to keep memory), collect the email, attachment hash and process tree, check other recipients and block the sender and IOCs, reset the user’s credentials, scan for persistence, then document and brief the user.',
        '“An S3 bucket with database backups is public.” Enable Block Public Access immediately, check CloudTrail for who changed the policy and S3 access logs for downloads, rotate any credentials in the backups, assess personal-data exposure with legal (notification duties), and add a CSPM rule and an organization-wide guardrail.',
        '“Many failed logins, then a success, from abroad.” Treat it as a likely account compromise: disable or reset the account, revoke sessions and tokens, review what the session accessed, enforce MFA, and tune the detection.'
      ]
    },
    {
      h: '7. Capstone project blueprints',
      t: 'A capstone project ties several modules together into one complete piece of work. It is your final-year project for this course. Complete at least one capstone end to end for your portfolio, from setup to written report.\n\nThe table offers five blueprints. A mini SOC uses Wazuh or Elastic with Sysmon on Windows and Linux VMs, and delivers dashboards, Sigma-style rules mapped to ATT&CK and a simulated incident report. An authorized web app assessment tests OWASP Juice Shop with Burp Suite and ZAP, and delivers a professional pentest report with CVSS scores and a remediation roadmap. A Python automation toolkit builds a command-line tool with argparse or Click: a log analyzer, IOC enricher and hash checker, with tests. A cloud security audit uses LocalStack or the AWS free tier with Terraform, Checkov and Trivy to build a hardened multi-tier VPC and a CIS benchmark report. A DevSecOps pipeline uses GitHub Actions to enforce SAST, secret scanning, image scans and signing.\n\nPick the project that matches your target role from section 1. A future SOC analyst should build the mini SOC; a future cloud engineer, the cloud audit. Plan it in weekly milestones, for example: week 1 setup, week 2 core features, week 3 testing, week 4 report and README.\n\nA finished, documented project is worth much more than three half-built ones. Interviewers will ask you to explain every choice, so build it yourself.',
      table: [
        ['Project', 'Stack', 'Deliverable'],
        ['1. Mini SOC and SIEM monitoring', 'Wazuh/Elastic, Sysmon, Windows and Linux VMs', 'Dashboards, Sigma-style rules mapped to ATT&CK, a simulated incident report'],
        ['2. Authorized web app assessment', 'Burp Suite, OWASP ZAP, Juice Shop', 'A professional pentest report with CVSS scores and a remediation roadmap'],
        ['3. Python security automation toolkit', 'Python, argparse/Click, requests', 'A CLI: log analyzer, IOC enricher, hash and integrity checker, with tests'],
        ['4. Cloud security audit', 'LocalStack/AWS free tier, Terraform, Checkov, Trivy', 'A hardened multi-tier VPC, CIS benchmark report and CI security gate'],
        ['5. DevSecOps secure pipeline', 'GitHub Actions, Docker, Semgrep, Gitleaks, Trivy, Cosign', 'A working pipeline enforcing SAST, secrets, image scans and signing']
      ]
    },
    {
      h: '8. Capstone rubric',
      t: 'Capstone projects are judged like professional work, using the rubric below. Think of it as the marking scheme a teacher shares before an exam. Read it before you start, not after you finish, so you know where the marks are.\n\nThe weights show what matters. Technical execution is 35%: the project works reliably, handles edge cases and is verified by tests. Errors, failing lab steps or an incomplete build fail this part. Security practice is 25%: least privilege, parameterized logic, defanged artifacts and no secrets in the repository. A single hard-coded password or wildcard permission is a failing sign here, because a security project that is itself insecure loses trust immediately. Documentation is 25%: a clear README, diagrams, setup steps and sample output. Presentation is 15%: you can explain your design choices, the risks and the trade-offs clearly.\n\nFor example, a mini SOC project with working dashboards but no README and an API key in the config file could lose most of the security and documentation marks, even though the technical part works well.\n\nUse the rubric as a checklist before you submit. Run a secret scanner on your repository, ask a friend to follow your README from scratch, and practice explaining the project in five minutes. Students who cannot explain their own code or tools fail the presentation part, whatever the code quality.',
      table: [
        ['Domain', 'Weight', 'Excellent', 'Failing'],
        ['Technical execution', '35%', 'Works reliably, handles edge cases, verified by tests', 'Errors, failing lab steps, incomplete'],
        ['Security practice', '25%', 'Least privilege, parameterized logic, defanged artifacts, no secrets', 'Hard-coded secrets or wildcard permissions'],
        ['Documentation', '25%', 'Clear README, diagrams, setup steps, sample output', 'No README or diagrams'],
        ['Presentation', '15%', 'Explains design choices, risk and trade-offs clearly', 'Cannot explain the code or tools used']
      ]
    },
    {
      h: '9. Ethics, community and continuous learning',
      t: 'In security, your reputation is your most valuable asset. A company is about to trust you with its passwords, logs and customer data, much like a family trusts a house-sitter with the keys. One unauthorized scan or leaked file can end a career before it starts, and in India it can also bring legal action under the IT Act.\n\nThe ethical rules are simple to state. Stay within authorization: test only systems you own or have written permission to test, and only within the agreed scope. Respect privacy: do not read, copy or share personal data you come across. Disclose responsibly: if you find a vulnerability, report it privately to the owner or through their bug bounty program, and give them time to fix it before talking about it publicly. Give credit to the people and tools whose work you use.\n\nLearning never stops in this field, because attackers keep changing. Follow CERT-In and CISA advisories, read incident write-ups, join local security meetups and online communities, and contribute to open-source tools. Practice only on legal platforms such as TryHackMe, Hack The Box, PortSwigger Academy and Blue Team Labs.\n\nA practical habit is to set aside a few hours every week: one advisory, one lab and one short note in your own words. Over a year, that steady routine builds more skill than occasional all-night sessions.'
    }
  ],
  lab: {
    title: 'Hands-on Lab 15: build your professional kit',
    steps: [
      ['Choose one target role and write a one-paragraph career goal for the next 12 months.', null, 'Specific goals (“SOC Analyst Tier 1 in a managed security provider by next December”) drive better choices than “get into cyber”.'],
      ['Pick one capstone blueprint, create its GitHub repository with a README skeleton (problem, architecture, setup, usage, security notes), and push your first commit.', 'git init capstone-mini-soc\ncd capstone-mini-soc\necho "# Mini SOC capstone" > README.md\ngit add README.md && git commit -m "Project skeleton"', 'Add a .gitignore and enable secret scanning before adding any configuration files.'],
      ['Rewrite your resume in a single-column format with a Projects section, then compare its keywords with three real job descriptions for your target role.', null, 'Add missing skills only if you genuinely have them; plan labs for the rest.'],
      ['Record yourself answering the three scenario questions in section 6 in under two minutes each, then improve the weakest answer.', null, 'Structure (verify → contain → investigate → recover → communicate) matters more than tool names.']
    ]
  },
  examples: [
    {
      title: 'Matching your resume to a job description',
      lang: 'python',
      code: 'import re\n\njob = """SOC Analyst: monitor SIEM alerts (Splunk or Sentinel), triage incidents,\nanalyze Windows event logs and Sysmon, map detections to MITRE ATT&CK,\nPython scripting, phishing analysis, incident response."""\n\nresume = """Built a home SOC with Wazuh and Sysmon. Wrote Python log parsers.\nMapped 6 detection rules to MITRE ATT&CK. Analyzed phishing emails in labs."""\n\nkeywords = ["siem", "splunk", "sentinel", "sysmon", "mitre att&ck", "python",\n            "phishing", "incident response", "windows event logs", "triage"]\n\nfound = [k for k in keywords if re.search(re.escape(k), resume, re.I)]\nmissing = [k for k in keywords if k not in found]\nprint("Covered:", found)\nprint("Gaps to build or describe:", missing)',
      explanation: 'A quick keyword gap check against a real job description shows what to highlight and what to learn next. Only claim skills you can demonstrate in an interview.'
    }
  ],
  best: [
    'Choose one target role and align projects, certifications and resume keywords with it.',
    'Show evidence: documented capstones, lab reports and write-ups.',
    'Keep public work safe: defang IOCs, no live malware, no secrets, no unauthorized targets.',
    'Answer scenarios with a clear structure and explain trade-offs.',
    'Network through communities and keep learning from advisories and incident reports.',
    'Use a 30-60-90 day plan and review it monthly.'
  ],
  mistakes: [
    'Collecting certifications without hands-on projects to back them up.',
    'Applying with a generic resume that does not match the job’s keywords.',
    'Publishing write-ups about systems you were not authorized to test.',
    'Listing tools you cannot explain in an interview.',
    'Stopping learning after the first job offer.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Write a 3-line professional summary for your target role.\n2. Turn two module labs into resume bullets with numbers.\n3. Answer: “Walk me through what happens when you type a URL in a browser,” covering DNS, TCP, TLS and HTTP.\n4. Answer the suspicious-attachment scenario in under two minutes.\n5. Choose two certifications for your path and justify the order.\n6. Draft your 30-60-90 day plan.'
  },
  mini: {
    title: 'Capstone: deliver one professional project',
    objective: 'Complete one of the five capstone blueprints to portfolio standard.',
    requirements: [
      'Working implementation with tests or evidence screenshots from your own lab.',
      'A README with architecture diagram, setup, usage and security considerations.',
      'A short report or presentation that explains decisions, risks and trade-offs.',
      'All indicators defanged; no secrets or real personal data in the repository.'
    ],
    deliverable: 'A public GitHub repository and a 5-minute recorded walkthrough, graded with the rubric in this module.'
  },
  takeaways: [
    'Pick a target role; every path shares the same foundations.',
    'Certifications open doors; projects and clear thinking get you hired.',
    'A clean, keyword-matched resume and a documented portfolio are your evidence.',
    'Scenario answers follow a structure: verify, contain, investigate, recover, communicate.',
    'Ethics and continuous learning sustain a long career.'
  ],
  quickRef: [
    'Paths: SOC/DFIR · Pentest · Cloud/DevSecOps · GRC/IAM',
    'Certs: Security+ / CC → CySA+ / eJPT → OSCP / cloud specialty → CISSP',
    'Resume: one column · keywords · projects · numbers',
    'Portfolio: README · diagram · defanged IOCs · no secrets',
    'Scenario: verify → contain → investigate → recover → communicate'
  ],
  refs: [
    ['NICE Framework (cyber security work roles)', 'https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center'],
    ['CompTIA Security+', 'https://www.comptia.org/certifications/security'],
    ['ISC2 Certified in Cybersecurity', 'https://www.isc2.org/certifications/cc'],
    ['TryHackMe learning paths', 'https://tryhackme.com/paths'],
    ['CERT-In', 'https://www.cert-in.org.in/']
  ],
  quiz: [
    ['What is the main role of an ATS in hiring?', ['It runs technical interviews', 'It parses resumes and filters them by keywords before a human reviews them', 'It issues certifications', 'It scans networks'], 1, 'Matching the job’s keywords helps your resume reach a recruiter.'],
    ['Which certification is a widely recognized foundational credential?', ['CISSP', 'OSCP', 'CompTIA Security+', 'AWS Security Specialty'], 2, 'Security+ is a common entry-level baseline; CISSP requires years of experience.'],
    ['In a scenario about a suspicious endpoint alert, what comes first?', ['Wipe the machine', 'Verify the alert, then isolate the host while preserving memory', 'Email the whole company', 'Ignore it until morning'], 1, 'Confirm, then contain without destroying evidence.'],
    ['How should malicious URLs and IPs appear in a public portfolio?', ['As clickable links', 'Defanged, for example hxxp://evil[.]example', 'Hidden in images', 'Removed entirely, with no explanation'], 1, 'Defanging keeps documents safe and follows platform rules.'],
    ['Which is the strongest evidence for a junior SOC role?', ['A list of tool names', 'A documented home SOC lab with detection rules and an incident report', 'A long objective statement', 'A multi-column designer resume'], 1, 'Demonstrated, documented work beats keywords alone.']
  ],

  skills: ['Choose a career path', 'Plan certifications', 'Write an ATS-friendly resume', 'Build and document a capstone', 'Answer scenario questions'],
  prereq: ['Modules 01–14'],
  analogy: 'Getting hired is like a cricket selection trial: practice in the nets is your homelab, match scores are your capstone and write-ups, the coaching badge is a certification, and the trial itself is the interview. Selectors pick the player whose record they can see.',
  why: 'Skills only change your life when someone can see them. This module turns fifteen modules of learning into evidence an employer trusts.',
  workflow: {
    title: 'From learner to hired',
    nodes: [
      ['target', 'Pick a target role', 'One path for 6–12 months', 'Interests and strengths', 'Focused goal', 'Read real job descriptions for SOC, pentest, cloud and GRC roles and choose one target. Your next steps all depend on this choice.'],
      ['lab', 'Practice in labs', 'Homelab + legal platforms', 'Course modules', 'Hands-on skill', 'Repeat the module labs in your homelab and complete beginner paths on legal platforms. Keep notes as you go.'],
      ['build', 'Build a capstone', 'One end-to-end project', 'Skills', 'Portfolio piece', 'Complete one capstone blueprint to the rubric standard, with a strong README, diagram and report.'],
      ['certify', 'Certify', 'Match the role', 'Target role', 'Credential', 'Add one foundational certification aligned with your role, backed by your projects.'],
      ['show', 'Show your work', 'Resume, GitHub, LinkedIn', 'Projects and certs', 'Visible profile', 'Tailor a one-page, keyword-matched resume; pin your best repositories; share write-ups.'],
      ['interview', 'Interview and grow', 'Fundamentals + scenarios', 'Applications', 'Offer and next goals', 'Practice structured answers, learn from every interview, and set your 30-60-90 day plan for the new role.']
    ],
    explanation: 'Each step produces evidence for the next; the cycle continues after your first job.'
  },
  caseStudy: {
    title: 'A fresher’s path to a SOC role',
    problem: 'A B.Tech graduate with no experience wanted a SOC analyst job within six months.',
    data: 'Job descriptions, a homelab, legal practice platforms, a public GitHub profile.',
    steps: ['Chose SOC Analyst Tier 1 as the single target role.', 'Built a home SOC with Wazuh, Sysmon and two VMs; wrote six detection rules and an incident report.', 'Earned a foundational certification while finishing the SOC learning path on a practice platform.', 'Rewrote the resume around the project with measurable results and tailored it per application.', 'Practiced scenario answers and explained the lab in detail during interviews.'],
    result: 'The documented lab gave interviewers something concrete to discuss, which is often decisive for freshers.',
    limitations: 'An illustrative composite of a common path; timelines vary with effort and the job market.'
  },
  exercises: [
    { title: 'Pick the evidence', objective: 'Know what convinces employers.', problem: 'Which resume bullet is strongest for a SOC role?', options: ['Familiar with SIEM tools', 'Built a Wazuh home SOC; wrote 6 ATT&CK-mapped rules and cut false positives by 40% after tuning', 'Passionate about cyber security', 'Knows Splunk, Sentinel, QRadar, Elastic, Wazuh'], answer: 1, hints: ['Specific, measurable, verifiable.'], solution: ['It names the project, the work and a measurable result.'], explanation: 'Interviewers can ask about it, and you can show it.' },
    { title: 'Order the steps', objective: 'Structure a scenario answer.', problem: 'For a suspected compromised laptop, which step comes right after verifying the alert?', options: ['Wipe and reinstall', 'Isolate the host while keeping it powered on', 'Write the final report', 'Change the company logo'], answer: 1, hints: ['Stop the spread, keep the evidence.'], solution: ['Containment comes next, preserving memory evidence.'], explanation: 'Eradication and reporting come later.' },
    { type: 'Short answer', title: 'Defang an IP', objective: 'Apply portfolio safety.', problem: 'Defang the IP address 203.0.113.7 using the common bracket style for the last dot only, as 203.0.113[.]7. Type exactly that.', accept: ['203.0.113[.]7'], hints: ['Wrap the final dot in square brackets.'], solution: ['203.0.113[.]7'], explanation: 'Defanged indicators cannot be clicked or auto-linked by mistake.' },
    { title: 'Rubric weight', objective: 'Read the capstone rubric.', problem: 'In the capstone rubric, what percentage is technical execution worth?', answer: 35, hints: ['It is the largest weight.'], solution: ['Technical execution = 35%.'], explanation: 'Security practice and documentation are 25% each; presentation is 15%.' }
  ],
  checks: [
    ['Why choose one target role first?', ['Roles never change', 'So projects, certifications and resume keywords line up', 'It is required by law', 'To avoid learning fundamentals'], 1, 'Focus makes your evidence coherent.'],
    ['Which certification usually requires several years of experience?', ['Security+', 'ISC2 CC', 'CISSP', 'eJPT'], 2, 'CISSP requires verified professional experience.'],
    ['What makes a portfolio README strong?', ['Only a title', 'Problem, architecture diagram, setup, sample output and security notes', 'Many emojis', 'Links to unauthorized targets'], 1, 'A reviewer should understand and reproduce your work quickly.']
  ],
  cheat: ['One target role', 'Lab → Build → Certify → Show → Interview', 'Resume: projects + numbers + keywords', 'Defang · no secrets · authorized only', '30-60-90 plan'],
  next: 'You have completed all 15 modules. Finish your module quizzes and one project, then take the final assessment to earn your CodeLekho Cyber Security certificate.'
};
