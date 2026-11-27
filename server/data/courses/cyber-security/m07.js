export default {
  n: 7,
  title: 'Ethical Hacking & Penetration Testing',
  description: 'Legal authorization, scope and rules of engagement, the penetration-testing lifecycle and methodologies, passive and active reconnaissance, enumeration, vulnerability assessment vs penetration testing, safe validation and risk rating, professional reporting, remediation and retesting.',
  intro: 'Ethical hacking means testing systems with the owner’s written permission to find weaknesses before criminals do. The technical skills overlap with an attacker’s. What makes it ethical and legal is authorization, scope and professional conduct. A locksmith who opens your door because you called him is doing a job. The same skill used on a neighbor’s door is burglary.\n\nThis module teaches the full process a professional penetration tester follows, from the scope document to the retest, and the judgment that goes with it. It deliberately contains no weaponized attack code. The value of a penetration test is the report and the fixes, not the exploit.\n\nAll hands-on work happens in your own lab or on legal practice platforms such as Hack The Box, TryHackMe, VulnHub, OWASP Juice Shop and PortSwigger Academy. Testing a system without authorization is a crime in most countries, including under India’s IT Act 2000, the US CFAA and the UK Computer Misuse Act, even with good intentions.',
  objectives: [
    'Explain legal authorization, scope and rules of engagement.',
    'Describe the full penetration-testing lifecycle and the major methodologies.',
    'Perform, in a lab, reconnaissance, enumeration and vulnerability assessment.',
    'Distinguish vulnerability assessment, penetration testing and red teaming.',
    'Write a professional report and verify remediation by retesting.'
  ],
  terms: [
    ['Penetration test', 'An authorized, goal-driven test that shows how weaknesses combine into real impact.'],
    ['Vulnerability assessment', 'Mostly automated scanning plus review that lists and prioritizes many weaknesses.'],
    ['Red / blue / purple team', 'Attack simulation / defenders / both working together to improve detection.'],
    ['Scope', 'Exactly which systems, ranges, apps and accounts may be tested, and what is out of scope.'],
    ['Rules of engagement (RoE)', 'The agreed document of allowed techniques, timing, contacts and data handling.'],
    ['OSINT', 'Open-source intelligence: information gathered from public sources.'],
    ['Passive reconnaissance', 'Learning about a target without contacting its systems.'],
    ['Enumeration', 'Extracting details such as services, versions, users, shares and directories.'],
    ['False positive', 'A reported issue that is not actually exploitable or present.'],
    ['CVE', 'Common Vulnerabilities and Exposures: a public ID for a known vulnerability.'],
    ['Black / gray / white box', 'Testing with no, partial or full knowledge of the target’s internals.'],
    ['Retest', 'Re-verifying each finding after the fix to close it.']
  ],
  diagramTitle: 'The penetration-testing lifecycle',
  ascii: '   [ WRITTEN AUTHORIZATION + SCOPE + RoE ]   <- nothing starts without this\n                     |\n   1 Planning --> 2 Reconnaissance --> 3 Enumeration --> 4 Vulnerability analysis\n                   passive | active      ports, versions,   CVEs, misconfig,\n                   (OSINT)  (approved)   users, dirs        design flaws\n                                                               |\n   7 Retest  <--  6 Reporting  <------------  5 Validation  <---+\n   confirm fixes   exec summary +             minimal-impact proof,\n                   findings + fixes           stop at sensitive data\n\n   Frameworks: PTES · NIST SP 800-115 · OWASP WSTG · MITRE ATT&CK',
  diagramExplain: 'Every engagement starts with written permission and an agreed scope. The tester moves from gathering information to proving a small number of real issues with minimal impact, then delivers a report the client can act on, and finally retests the fixes.',
  sections: [
    {
      h: '1. Fundamentals and legal authorization',
      t: 'In ethical hacking, the same action can be a professional service or a crime. The difference is permission. Scanning a company’s servers under a signed contract is a paid job. Scanning the same servers without one can lead to a police case under the IT Act 2000. Think of a surgeon and a stranger with a knife: the cut may look similar, but consent changes everything.\n\nPermission must be written, specific and given by someone who has the authority to give it. A friend who works at a company cannot authorize you to test that company’s website; only the owner or an authorized manager can. The written document says exactly what you may test, when and how. If something is not in writing, treat it as not allowed.\n\nThe table names the common roles. A white hat is an authorized tester. A black hat is a criminal. A gray hat acts without permission but without malicious intent, and is still taking a legal risk. Red teams simulate real adversaries to test detection and response, blue teams defend, and purple teams are red and blue working together to improve detection.\n\nFor students, the safe path is simple. Practice on your own lab machines and on platforms that invite you to test, such as TryHackMe or Hack The Box. Bug bounty programs are another legal route, but only within each program’s published rules.',
      table: [
        ['Term', 'Meaning'],
        ['White hat', 'Authorized tester working to improve security'],
        ['Black hat', 'Criminal attacker'],
        ['Gray hat', 'Acts without permission but without malicious intent; still legally risky'],
        ['Red team', 'Goal-based adversary simulation that tests detection and response'],
        ['Blue team', 'Defenders'],
        ['Purple team', 'Red and blue collaborating to improve detection']
      ]
    },
    {
      h: '2. Rules of engagement checklist',
      t: 'The rules of engagement (RoE) is the document that turns a test from a risk into a controlled job. It records exactly what the tester may and may not do. The RoE protects both the tester and the client. It is like the agreement before a hostel room inspection: everyone knows which rooms, at what time, and what the inspectors may open.\n\nAmbiguity is dangerous. If the scope says "the website" but does not list the domain, the tester might touch a payment gateway owned by a different company. If the hours are not agreed, a scan at 11 a.m. on a sale day could slow down the shop. Each line of the checklist removes a guess: exact ranges and domains, dates and hours, source IPs, allowed techniques, data handling, contacts and third parties.\n\nTwo items protect careers. The stop-work procedure means that if the client says stop, you stop at once. The escalation contact means that if you find something critical, such as an exposed customer database, you can reach a named person immediately instead of waiting for the final report.\n\nA practical habit: before you start each day, reread the scope and confirm the target IP. A small typo, such as 10.0.5.12 instead of 10.0.5.21, can mean testing a machine that nobody authorized.',
      b: [
        'Scope: exact IP ranges, domains, applications and cloud accounts, and what is explicitly out of scope.',
        'Dates and hours of testing, and the source IPs the tester will use.',
        'Allowed techniques: for example no denial of service, no social engineering unless agreed, no data exfiltration beyond proof.',
        'Data handling: encryption, retention and deletion of evidence.',
        'Communication: contacts, escalation for critical findings and a stop-work procedure.',
        'Third parties: hosting and cloud provider policies, and permission from owners of shared systems.',
        'Liability and confidentiality: contract and NDA.'
      ]
    },
    {
      h: '3. The penetration-testing lifecycle',
      t: 'A penetration test is not random poking. It follows a lifecycle, a fixed series of phases, so that two different testers on the same job would cover the same ground. Think of a doctor’s routine: history, examination, tests, diagnosis, prescription and a follow-up visit. Skipping a step means missing something.\n\nThe phases in the table flow in order. Planning agrees the objectives and scope. Reconnaissance learns about the target. Enumeration identifies services, users and versions. Vulnerability analysis finds weaknesses. Validation proves a weakness is real, safely. Reporting communicates the risk, and the retest confirms that each fix works. Each phase feeds the next: you cannot analyze a service you never discovered.\n\nAlign your work with recognized methodologies such as PTES (the Penetration Testing Execution Standard), NIST SP 800-115, the OWASP Web Security Testing Guide and MITRE ATT&CK. PTES and NIST describe the overall process, the OWASP guide gives detailed web test cases, and ATT&CK describes real attacker techniques, so you can test against what real groups actually do.\n\nClients trust a report that says "tested following the OWASP WSTG" far more than one that says "we tried some things". A named method also helps you, because it gives you a checklist when you are tired or short of time. The note below explains the test types and areas a job can cover.',
      table: [
        ['Phase', 'Goal', 'Typical activities (authorized)'],
        ['Planning', 'Agree objectives and scope', 'Kick-off, RoE, contracts'],
        ['Reconnaissance', 'Learn about the target', 'Passive (public sources, DNS) and active (approved scanning)'],
        ['Enumeration', 'Identify services, users, versions', 'Port and service discovery, banner checks, directory review'],
        ['Vulnerability analysis', 'Find weaknesses', 'Scanners, configuration review, manual analysis'],
        ['Validation', 'Prove the weakness is real, safely', 'Minimal-impact proof; avoid damage and data exposure'],
        ['Reporting', 'Communicate risk', 'Findings, evidence, remediation'],
        ['Retest', 'Confirm fixes', 'Re-verify each finding']
      ],
      note: 'Test types: black box (no inside knowledge, like an outside attacker), gray box (some knowledge, such as a user account) and white box (full access to code and design: the most thorough). Areas include external and internal networks, web apps, APIs, mobile, cloud, wireless, physical and social engineering.'
    },
    {
      h: '4. Reconnaissance and information gathering',
      t: 'Reconnaissance is the homework before the test. It builds a map of hosts, technologies, users and exposed services within scope, and that map tells you where to look later. It is like reading a college’s website, notice board and admission brochure before you visit: you learn a lot without talking to anyone.\n\nThere are two kinds. Passive reconnaissance makes no direct contact with the target. You read public DNS records, certificate transparency logs, search engines, job posts, public code repositories, social media (OSINT, open-source intelligence) and breach-notification data. A job post asking for "experience with Apache Tomcat 9" tells you what software the company probably runs. Active reconnaissance touches the target, so it needs authorization: DNS queries to the target’s own servers, port and service discovery, and web crawling.\n\nThe code block shows simple passive commands against a lab domain. whois lab.example shows who registered it. dig +short lab.example A returns its IPv4 address, and the MX query returns its mail servers. Searching crt.sh for %.lab.example lists certificates issued for its subdomains, which often reveals names such as dev or staging.\n\nWrite everything down as you go, and check each subdomain or IP against the scope before you touch it. Finding staging.lab.example does not mean you are allowed to test it.',
      b: [
        'Passive (no direct contact): public DNS records, certificate transparency logs, search engines, job posts, public code repositories, social media (OSINT) and breach-notification data.',
        'Active (touches the target, so it needs authorization): DNS queries to the target’s servers, port and service discovery, web crawling.'
      ],
      code: '# passive examples against a domain you are authorized to assess\nwhois lab.example\ndig +short lab.example A\ndig +short lab.example MX\n# certificate transparency: search crt.sh for %.lab.example to list subdomains'
    },
    {
      h: '5. Enumeration and vulnerability assessment',
      t: 'Enumeration is where general knowledge turns into detail. Reconnaissance told you that a server exists; enumeration tells you exactly what runs on it. Think of a building inspector who has found the building and now walks floor by floor, noting every door, its lock type and who holds the key.\n\nEnumeration extracts details: open ports and the services behind them, software versions, shares, usernames, directories and API endpoints. For example, an authorized scan might show port 22 running OpenSSH 8.9 and port 80 running Apache 2.4.52, a shared folder named public, and an API path /api/v1/. Each detail is a fact you can check against known weaknesses.\n\nVulnerability assessment compares those details with known weaknesses (the CVE database), misconfigurations (CIS baselines) and design flaws, then prioritizes them. If that Apache version has a published CVE, that is a finding. If the CIS benchmark says root login over SSH should be disabled and it is enabled, that is a misconfiguration.\n\nThe table shows how this differs from a penetration test. A vulnerability assessment lists many weaknesses, mostly through automated scanning, and is repeated weekly or monthly. A penetration test goes further and shows how weaknesses combine into real impact. Clients often ask for one when they need the other, so learn to explain the difference clearly.',
      table: [
        ['', 'Vulnerability assessment', 'Penetration test'],
        ['Goal', 'Find and list many weaknesses', 'Show how weaknesses combine into real impact'],
        ['Method', 'Mostly automated scanning plus review', 'Manual, creative, goal-driven'],
        ['Output', 'Prioritized list', 'Narrative with proof and attack paths'],
        ['Frequency', 'Often (weekly or monthly)', 'Periodic (yearly or after a major change)']
      ]
    },
    {
      h: '6. Validation and risk identification',
      t: 'Scanners make mistakes. They often report a weakness only because of a version number, even when the vendor has already patched it. Validation confirms that a suspected weakness is real (removing false positives) with the least possible impact. It is like a doctor confirming a suspected fracture with an X-ray before putting on a plaster.\n\nThe key phrase is least possible impact. Use read-only proofs, test accounts and agreed data. For example, to prove an access-control flaw, log in as test user A and show that you can view test user B’s profile. You do not need to change or download anything to prove the point.\n\nSometimes you reach more than you expected. If you reach sensitive data such as a real customer database, stop, record minimal evidence and report immediately. A single screenshot showing the table names is enough evidence. Copying the data would create a breach of your own and could break both the law and your contract.\n\nThen rate risk by likelihood and impact. CVSS helps, as you will see in Module 08. A weak password on an internet-facing admin portal is likely to be abused and has high impact. The same weakness on an isolated lab printer is less likely and lower impact. The bullets list the network themes, web themes and root causes you will meet most often.',
      b: [
        'Network themes: exposed services, weak or default credentials, unpatched software, insecure protocols, poor segmentation, misconfigured firewalls and VPNs.',
        'Web themes: follow the OWASP WSTG: authentication, sessions, access control, input handling, business logic and APIs.',
        'Common root causes: missing patches, default settings, excess privileges, weak credentials and lack of monitoring.'
      ]
    },
    {
      h: '7. Reporting',
      t: 'The report is the product. A client does not pay for the clever moments during testing. They pay for a document that tells them what is wrong and how to fix it. A brilliant test with a confusing report is a failed engagement. Think of a medical report: the patient needs a clear diagnosis and prescription, not the lab technician’s rough notes.\n\nThe report serves two readers. Executives want to know what the risk is and what they should do. Engineers want to know how to reproduce and fix each problem. That is why the table splits it into a one-page executive summary, a methodology section, detailed findings and appendices.\n\nThe executive summary uses plain business language, for example: "An attacker could read any customer’s order history. Fix the order API first." The methodology section lists the standards, dates, tools and limitations. Each finding is technical: title, severity, affected assets, description, evidence, impact, remediation and references. The appendices hold raw scan output, the test accounts used and confirmation that test artifacts were cleaned up.\n\nA common student mistake is pasting raw scanner output as the report. Scanner output is evidence, not analysis. Your job is to explain what it means for this client and what they should do next.',
      table: [
        ['Section', 'Content'],
        ['Executive summary', 'Scope, overall risk, top issues, business impact, key recommendations (one page)'],
        ['Methodology', 'Standards and approach, dates, tools, limitations'],
        ['Findings', 'Title, severity, affected assets, description, evidence, impact, remediation, references'],
        ['Appendices', 'Raw scan outputs, test accounts, cleanup confirmation']
      ]
    },
    {
      h: '8. A sample finding (training example)',
      t: 'A finding is one problem described so clearly that a developer can fix it without calling you. The table shows a training example: missing multi-factor authentication on an administrative portal. Compare this with a poor finding such as "server is bad". That is like a mechanic saying "the car has a problem" and handing back the keys.\n\nRead the example field by field. The title names the exact issue. The severity is High, with an example CVSS score of 7.5. The affected asset is admin.lab.test, a training environment. The description says the login relies only on a password and has no lockout after repeated failures. The impact states the business result: guessed or stolen credentials would give full administrative control.\n\nThe evidence proves it is real using lab data: a screenshot of the login page and a log excerpt showing 50 attempts without lockout. The remediation gives specific steps: enforce MFA for administrators, add rate limiting and lockout, alert on repeated failures and restrict access by network. The retest line says how you will confirm the fix: check that the MFA prompt and the lockout now work.\n\nBefore you submit a finding, ask yourself one question. Could a developer who has never met me fix this from what I wrote? If not, add the missing detail.',
      table: [
        ['Field', 'Content'],
        ['Title', 'Missing multi-factor authentication on the administrative portal'],
        ['Severity', 'High (CVSS example 7.5)'],
        ['Affected', 'admin.lab.test (training environment)'],
        ['Description', 'The admin login relies only on a password, and there is no lockout after repeated failures.'],
        ['Impact', 'Compromised or guessed credentials would give full administrative control.'],
        ['Evidence', 'Screenshot of the login page; log excerpt showing 50 attempts without lockout (lab data).'],
        ['Remediation', 'Enforce MFA for administrators, add rate limiting and lockout, alert on repeated failures, restrict access by network.'],
        ['Retest', 'Confirm the MFA prompt and lockout after the fix.']
      ]
    },
    {
      h: '9. Professional conduct',
      t: 'In this field, your reputation is your career. Clients let you into their most sensitive systems because they trust you. One leak, one out-of-scope scan or one exaggerated report can end that trust, and news travels fast in a small industry. It is like the attendant at a bank locker room: the job exists only because people believe the attendant will never open someone else’s locker.\n\nThe bullets read like rules, but each has a practical meaning. Stay in scope and stop when told, even in the middle of a promising test. Report critical findings immediately instead of saving them for the final report. Minimize harm: avoid disruption and real personal data, and remove any test accounts or files you created.\n\nConfidentiality means findings and evidence go only to the client. Do not post screenshots on LinkedIn, even blurred ones, and do not discuss client names with friends. Honesty means stating your limitations and false positives plainly. If you ran out of time to test the mobile app, say so. Never raise a Medium to a Critical to look impressive.\n\nIf you find a flaw outside an engagement, for example on a website you were simply using, follow responsible disclosure. Stop, do not explore further, and report it through the organization’s security contact or bug bounty page. In India, CERT-In also accepts vulnerability reports.',
      b: [
        'Stay in scope, stop when told, and report critical findings immediately.',
        'Minimize harm: avoid disruption and real personal data, and clean up test artifacts.',
        'Keep findings and evidence confidential and share them only with the client.',
        'Be honest about limitations and false positives; never exaggerate.',
        'Follow responsible disclosure for flaws found outside an engagement.'
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 07: build a safe practice range',
    steps: [
      ['Create two VMs on a host-only network: a Kali or Ubuntu tester and an intentionally vulnerable target (Metasploitable 2 or OWASP Juice Shop).', null, 'Host-only networking keeps the vulnerable machine away from the Internet and your home devices. Confirm there is no route out before you start.'],
      ['Confirm the isolation from the tester VM.', 'ip addr                  # note the host-only subnet, e.g. 192.168.56.0/24\nping -c 2 8.8.8.8        # should FAIL on a host-only network\nping -c 2 192.168.56.101 # the target should answer', 'If the Internet answers, fix the network settings before going further.'],
      ['Write a one-page scope and RoE for your own lab as if a client had hired you.', null, 'Include the in-scope IPs, allowed techniques, testing hours and a stop-work contact. This habit makes real engagements smooth.'],
      ['Run discovery against the target only, and record what you find in the finding format.', 'nmap -sV -p- 192.168.56.101 -oN target-services.txt', 'Service versions guide your vulnerability analysis. Module 08 covers Nmap in depth.'],
      ['Complete an introductory room on TryHackMe or Hack The Box Academy and write a mini report: executive summary, three findings and retest notes.', null, 'Writing the report is the skill employers test most.']
    ]
  },
  examples: [
    {
      title: 'Turning findings into a prioritized register',
      lang: 'python',
      code: 'findings = [\n    {"title": "Admin portal without MFA", "likelihood": 4, "impact": 5},\n    {"title": "Directory listing on /backup", "likelihood": 3, "impact": 4},\n    {"title": "Verbose server banner", "likelihood": 2, "impact": 1},\n    {"title": "Outdated TLS 1.0 enabled", "likelihood": 2, "impact": 3},\n]\n\ndef severity(score):\n    return "Critical" if score >= 20 else "High" if score >= 12 else "Medium" if score >= 6 else "Low"\n\nfor f in sorted(findings, key=lambda f: f["likelihood"] * f["impact"], reverse=True):\n    s = f["likelihood"] * f["impact"]\n    print(f"{severity(s):8} {s:>2}  {f[\'title\']}")',
      explanation: 'Clients cannot fix everything at once. Ranking findings by likelihood × impact (or by CVSS plus business context) tells them where to start.'
    }
  ],
  best: [
    'Get written authorization, a precise scope and RoE before touching anything.',
    'Prefer passive reconnaissance first; run active scans only on in-scope targets during agreed hours.',
    'Validate with the least impact possible and stop at sensitive data.',
    'Write findings that a developer can reproduce and fix, with evidence.',
    'Report critical issues immediately, not only in the final report.',
    'Retest every finding and confirm cleanup of test artifacts.'
  ],
  mistakes: [
    'Scanning an IP “just to check” before the contract is signed.',
    'Testing a shared hosting or cloud provider’s infrastructure that is not in scope.',
    'Copying a scanner’s output into the report without validating it.',
    'Downloading more real data than needed to prove impact.',
    'Writing findings without a clear remediation or retest step.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. List the contents of a scope document and explain why each item matters.\n2. Explain the difference between a vulnerability assessment, a penetration test and a red-team exercise.\n3. A scanner reports a “critical” issue on a host. How do you validate it safely? What do you do if you find a real customer database?\n4. Rate a finding: a public admin page without MFA and with a weak password policy. Justify likelihood and impact.\n5. Rewrite the poor finding “server is bad” as a professional entry.\n6. Explain why retesting matters and what evidence closes a finding.'
  },
  mini: {
    title: 'Mini project: a full mini-engagement',
    objective: 'Run a complete, professional engagement against your own lab target.',
    requirements: [
      'Scope and RoE document.',
      'Reconnaissance notes and enumeration results.',
      'A vulnerability list with CVSS scores.',
      'Validated findings with evidence and remediation advice.',
      'A retest section after you fix two of the issues.'
    ],
    deliverable: 'A 10-page professional report in the structure shown in this module.'
  },
  takeaways: [
    'Authorization and scope come first, always.',
    'The lifecycle: plan, recon, enumerate, analyze, validate, report, retest.',
    'A vulnerability assessment lists weaknesses; a penetration test proves impact.',
    'Reports and remediation, not exploits, are the value of a test.',
    'Professional conduct protects people, data and your career.'
  ],
  quickRef: [
    'No written permission, no testing',
    'Plan → Recon → Enumerate → Analyze → Validate → Report → Retest',
    'Finding = title · severity · asset · description · evidence · impact · fix · retest',
    'Passive = public sources · Active = touches target (authorized only)',
    'PTES · NIST SP 800-115 · OWASP WSTG · MITRE ATT&CK'
  ],
  refs: [
    ['NIST SP 800-115: Technical Guide to Information Security Testing', 'https://csrc.nist.gov/pubs/sp/800/115/final'],
    ['Hack The Box Academy (legal practice platform)', 'https://academy.hackthebox.com/'],
    ['OWASP Web Security Testing Guide', 'https://owasp.org/www-project-web-security-testing-guide/'],
    ['MITRE ATT&CK', 'https://attack.mitre.org/'],
    ['TryHackMe (legal practice platform)', 'https://tryhackme.com/']
  ],
  quiz: [
    ['What must exist before any penetration test begins?', ['A scanner license', 'Written authorization and scope', 'A Kali VM', 'A report template'], 1, 'Written permission and scope protect both the tester and the client.'],
    ['Which phase proves a suspected weakness with minimal impact?', ['Planning', 'Reporting', 'Validation', 'Reconnaissance'], 2, 'Validation confirms the issue safely and removes false positives.'],
    ['Passive reconnaissance means:', ['Scanning ports', 'Using public information without contacting the target', 'Brute forcing logins', 'Social engineering by phone'], 1, 'Passive methods use public data only.'],
    ['Which document describes what is allowed during a test?', ['An invoice', 'The rules of engagement', 'A resume', 'A press release'], 1, 'The RoE sets allowed techniques, timing and limits.'],
    ['What does a retest do?', ['Finds only new bugs', 'Confirms that fixes work', 'Replaces the report', 'Deletes evidence'], 1, 'Retests verify remediation so findings can be closed.']
  ],

  skills: ['Write scope and rules of engagement', 'Plan recon and enumeration', 'Validate findings safely', 'Write professional findings and reports'],
  prereq: ['Module 02 (networks)', 'Module 03 (OS security)', 'Module 06 (web security)'],
  analogy: 'A penetration tester is like a building inspector hired to break in: the owner signs a letter listing which doors to try and when, the inspector notes every weak lock with photos, never takes the valuables, and comes back after the locksmith visits to confirm the doors now hold.',
  why: 'Organizations need proof of how their defenses fail before criminals find out. Even if you become a defender, thinking like a tester improves every control you build.',
  workflow: {
    title: 'From scope to closed finding',
    nodes: [
      ['auth', 'Authorization', 'Contract + scope + RoE', 'Client request', 'Signed permission', 'Agree in writing on targets, dates, techniques, contacts and data handling. Without this, every later step may be illegal.'],
      ['recon', 'Reconnaissance', 'Passive, then active', 'Scope', 'Target map', 'Start with public information (DNS, certificate logs, job posts), then run approved active discovery on in-scope addresses only.'],
      ['enum', 'Enumeration', 'Services and versions', 'Live hosts', 'Detailed inventory', 'Identify services, versions, shares, users and directories. Versions point to known CVEs; directories and endpoints point to web flaws.'],
      ['analysis', 'Vulnerability analysis', 'CVEs, misconfig, design', 'Inventory', 'Candidate weaknesses', 'Combine scanner results with manual review and the OWASP WSTG. Many scanner results will be false positives until validated.'],
      ['validate', 'Validation', 'Minimal-impact proof', 'Candidates', 'Confirmed findings', 'Prove each issue with the smallest safe step: a read-only request, a test account, an agreed record. Stop and escalate if you reach sensitive data.'],
      ['report', 'Report', 'Executives + engineers', 'Findings', 'Prioritized fixes', 'One-page executive summary plus reproducible technical findings with evidence and specific remediation.'],
      ['retest', 'Retest', 'Close the loop', 'Fixed systems', 'Closed findings', 'Re-run each proof after the fix and record the evidence that closes the finding.']
    ],
    explanation: 'The flow mirrors the lifecycle diagram; the value is created in the last three steps.'
  },
  caseStudy: {
    title: 'Authorized testers arrested over unclear authority (Iowa, 2019)',
    problem: 'Two contracted penetration testers were arrested during an authorized physical test of a courthouse.',
    data: 'The contract, the scope document and the question of who had authority over the building.',
    steps: ['The state judicial branch contracted the physical test.', 'The county, which controlled the building, did not agree that the state could authorize entry.', 'The testers were arrested during the night-time test.', 'Charges were later dropped, but the testers and their firm faced serious consequences.'],
    result: 'Scope, authority and RoE must be unambiguous, including who owns each system or building.',
    limitations: 'Simplified summary; read primary sources for details.'
  },
  exercises: [
    { title: 'Passive or active?', objective: 'Classify recon activities.', problem: 'Which activity is passive reconnaissance?', options: ['Running a port scan on the target', 'Searching certificate transparency logs for the target’s subdomains', 'Sending crafted packets to the firewall', 'Trying default passwords on the VPN'], answer: 1, hints: ['Does it touch the target’s systems?'], solution: ['Certificate logs are public third-party data.', 'The others interact with the target directly.'], explanation: 'Active steps need authorization and must stay in scope.' },
    { title: 'Found real customer data', objective: 'Apply professional conduct.', problem: 'While validating a finding in scope, you can read a production table of real customers. What should you do?', options: ['Download it as evidence', 'Stop, record minimal evidence (for example a row count) and report immediately', 'Continue testing quietly', 'Post it to show impact'], answer: 1, hints: ['Minimize harm and escalate.'], solution: ['Stop accessing the data.', 'Capture the least evidence needed and use the escalation contact.'], explanation: 'This is exactly what the critical-finding escalation in the RoE is for.' },
    { title: 'Assessment vs test', objective: 'Distinguish engagement types.', problem: 'A client wants a monthly, mostly automated list of weaknesses across 2,000 servers. What are they asking for?', options: ['A penetration test', 'A vulnerability assessment', 'A red-team exercise', 'A forensic investigation'], answer: 1, hints: ['Breadth and frequency vs depth.'], solution: ['Frequent, broad, automated scanning with a prioritized list is vulnerability assessment.'], explanation: 'Penetration tests are deeper, manual and periodic.' },
    { title: 'Count the phases', objective: 'Recall the lifecycle.', problem: 'How many phases are in the lifecycle used in this module (planning to retest)?', answer: 7, hints: ['Plan, recon, enumerate, analyze, validate, report, retest.'], solution: ['There are seven phases.'], explanation: 'Different methodologies group them slightly differently.' }
  ],
  checks: [
    ['Who can authorize testing of a cloud-hosted web app?', ['Anyone who uses the app', 'The owner of the app, within the cloud provider’s policies', 'The tester themselves', 'Any employee'], 1, 'The system owner authorizes, and provider rules still apply.'],
    ['What makes a finding actionable?', ['A scary title', 'Clear evidence plus a specific remediation', 'A long scanner dump', 'Hiding the affected asset'], 1, 'Engineers must be able to reproduce and fix it.'],
    ['Which test gives the tester full access to code and design?', ['Black box', 'Gray box', 'White box', 'Red team'], 2, 'White-box testing is the most thorough.']
  ],
  cheat: ['Permission → Scope → RoE', 'Recon: passive first', 'Validate with minimal impact', 'Report for executives AND engineers', 'Retest to close'],
  next: 'Module 08 covers the tools behind assessments: Nmap, vulnerability scanners, Burp Suite, Wireshark and CVSS-based prioritization.'
};
