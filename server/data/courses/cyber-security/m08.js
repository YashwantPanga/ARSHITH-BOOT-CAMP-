export default {
  n: 8,
  title: 'Security Tools & Vulnerability Assessment',
  description: 'The security toolkit and Kali Linux, Nmap discovery and reading results, Wireshark and Burp Suite/ZAP in a lab, vulnerability scanning types and the management cycle, CVE, CWE and CVSS scoring, context-based prioritization with KEV and EPSS, and tracking fixes to closure.',
  intro: 'Tools find facts; people interpret them. A port scanner can list a hundred open ports in seconds, and a vulnerability scanner can produce a 300-page report. But only an analyst can decide which three findings put the business at risk this week. A thermometer can show a fever, but a doctor decides what it means.\n\nThis module walks through the core toolkit: Nmap, Wireshark, Burp Suite and ZAP, and vulnerability scanners such as OpenVAS/Greenbone and Nessus. It then teaches you to read CVE entries, calculate CVSS scores and prioritize with real-world context such as active exploitation and internet exposure.\n\nUse every tool only on systems you own or are authorized to assess. Nmap’s project hosts scanme.nmap.org for permitted light scanning, and your own lab VMs are always fair game. Scanning a college or company network without approval can set off alarms and lead to legal trouble.',
  objectives: [
    'Set up Kali Linux (or another toolkit VM) safely.',
    'Use Nmap for host and service discovery, Wireshark for traffic analysis and Burp/ZAP for web testing in a lab.',
    'Run and interpret vulnerability scans, and reduce false positives.',
    'Read CVE entries and compute and use CVSS scores.',
    'Prioritize and report vulnerabilities and verify fixes.'
  ],
  terms: [
    ['Kali Linux', 'A Debian-based distribution from OffSec that bundles hundreds of security tools. Use it in a VM, not as a daily OS.'],
    ['Nmap', 'The standard tool for discovering hosts, open ports, services and versions.'],
    ['Open / closed / filtered', 'A service answers / the host answers but no service / a firewall dropped the probes.'],
    ['Credentialed scan', 'A scan that logs in with a low-privilege account to check patches and configuration from inside.'],
    ['DAST', 'Dynamic application security testing: scanning a running web app.'],
    ['CVE', 'A public ID (CVE-YYYY-NNNN) for one known vulnerability.'],
    ['CWE', 'Common Weakness Enumeration: the type of mistake behind a vulnerability (for example CWE-89, SQL injection).'],
    ['CVSS', 'Common Vulnerability Scoring System: a 0–10 technical severity score built from a vector.'],
    ['NVD', 'The US National Vulnerability Database, which enriches CVEs with CVSS scores and CWE types.'],
    ['KEV', 'CISA’s Known Exploited Vulnerabilities catalog: flaws attackers are actively using.'],
    ['EPSS', 'Exploit Prediction Scoring System: the probability a CVE will be exploited soon.'],
    ['False positive', 'A reported finding that is not real on that system.']
  ],
  diagramTitle: 'The continuous vulnerability-management cycle',
  ascii: '        +----------------+\n        | 1 Asset        |  you cannot scan what you do not know\n        |   inventory    |\n        +-------+--------+\n                v\n   +------------+------------+        +------------------------+\n   | 2 Scan (auth + unauth,  | -----> | 3 Validate             |\n   |   agents, web, images)  |        |   remove false positives|\n   +-------------------------+        +-----------+------------+\n                ^                                 v\n   +------------+------------+        +-----------+------------+\n   | 6 Verify: rescan/retest | <----- | 4 Prioritize           |\n   +------------+------------+        |   CVSS + KEV + EPSS +  |\n                ^                     |   exposure + asset value|\n                |                     +-----------+------------+\n                +------- 5 Remediate (owner + due date) <---+',
  diagramExplain: 'Vulnerability management is a loop, not a one-off scan. Inventory feeds scanning, analysts validate and prioritize with context, owners fix by a due date, and a rescan proves each fix before the cycle repeats.',
  sections: [
    {
      h: '1. The security toolkit and Kali Linux',
      t: 'Kali Linux is a Linux distribution built for security testing. It comes with hundreds of tools already installed, including Nmap, Wireshark and Burp Suite. The table lists the main tools and the defensive value of each. Think of Kali as a fully stocked toolbox. It is very useful for a job, but you would not carry it to class every day.\n\nRun Kali as a VM (VirtualBox, VMware) or from a live USB. A virtual machine lets you take a snapshot, break things while learning and roll back in seconds. Keep it updated with sudo apt update && sudo apt full-upgrade, because tool versions and vulnerability checks change often.\n\nKeep it on a host-only or isolated lab network. In VirtualBox, a host-only adapter puts Kali and your practice VMs on a private network such as 192.168.56.0/24 that cannot reach your college Wi-Fi. This stops a scan from hitting real machines by accident, which is the most common beginner mistake.\n\nDo not use Kali as your daily operating system. It is designed for testing, not for everyday browsing and banking, and many of its tools run with high privileges. Alternatives are Parrot OS or an Ubuntu VM with the tools installed. In the end, the operating system matters less than knowing what each tool does and pointing it only at authorized targets.',
      table: [
        ['Tool', 'Purpose', 'Defensive value'],
        ['Nmap', 'Host, port and service discovery', 'Find unexpected exposure on your own networks'],
        ['Wireshark / tcpdump', 'Capture and analyze packets', 'Troubleshooting, spotting cleartext and anomalies'],
        ['Burp Suite / OWASP ZAP', 'Intercepting web proxy and scanner', 'Test your own web apps'],
        ['OpenVAS/Greenbone, Nessus', 'Vulnerability scanners', 'Continuous vulnerability management'],
        ['Nikto', 'Web server configuration checks', 'Spot outdated or risky server settings'],
        ['Lynis, CIS-CAT', 'Configuration audit', 'Hardening scores against benchmarks'],
        ['John / Hashcat', 'Password-hash auditing', 'Test your own organization’s hashes, with permission']
      ]
    },
    {
      h: '2. Nmap: network and service discovery',
      t: 'Nmap (Network Mapper) is the standard tool for finding out what is running on a network. Nmap sends probes and interprets replies to find live hosts, open ports, services and versions. Think of a new hostel warden walking down the corridor, knocking on every door to see which rooms are occupied and who answers.\n\nA port is a numbered door on a computer, and services listen behind them: SSH on 22, HTTP on 80, HTTPS on 443 and MySQL on 3306. The reply to each probe tells Nmap the port’s state. Open means a service answered. Closed means the host replied but nothing is listening there. Filtered means a firewall dropped the probe, so no clear answer came back. With -sV, Nmap also asks each service for its version.\n\nThe code block shows a lab scan of 192.168.56.101. Port 22 runs OpenSSH 8.9p1 and port 80 runs Apache httpd 2.4.52, so you now have exact versions to look up. Port 443 is closed and 3306 is filtered. The table lists other useful options, such as -sn for a ping sweep and -oA to save results in all formats.\n\nScan only authorized targets: aggressive scans can disrupt fragile systems such as old printers or factory controllers. Compare results with your asset inventory: every unexpected open port is a question to answer. If a server is listed as a web server only, an open database port needs an explanation.',
      table: [
        ['Command (lab only)', 'Meaning'],
        ['nmap -sn 192.168.56.0/24', 'Ping sweep: which hosts are up?'],
        ['nmap -sV -p 22,80,443 TARGET', 'Detect service versions on chosen ports'],
        ['nmap -p- TARGET', 'All 65,535 TCP ports'],
        ['nmap --top-ports 100 TARGET', 'The most common ports'],
        ['nmap -sC TARGET', 'Default safe scripts (NSE)'],
        ['nmap -oA scan1 TARGET', 'Save output in all formats']
      ],
      code: '$ nmap -sV -p 22,80,443,3306 192.168.56.101\nPORT     STATE    SERVICE VERSION\n22/tcp   open     ssh     OpenSSH 8.9p1 Ubuntu\n80/tcp   open     http    Apache httpd 2.4.52\n443/tcp  closed   https\n3306/tcp filtered mysql\n# open = service answers · closed = no service · filtered = firewall dropped the probe'
    },
    {
      h: '3. Wireshark and Burp Suite in vulnerability work',
      t: 'Scanners tell you what might be wrong. Wireshark and Burp Suite let you see what is actually happening, on the network and inside web requests. It is the difference between a delivery app saying "out for delivery" and you standing at the gate watching the rider arrive.\n\nWireshark (Module 02) confirms that a service really uses encryption, spots cleartext credentials and shows scanner behavior. If a vendor says its login is encrypted, a capture filtered with tls.handshake should show a TLS handshake. If the filter http shows a password in plain text, the claim is false. The filter tcp.flags.syn==1 && tcp.flags.ack==0 shows new connection attempts, which is how a port scan looks from the defender’s side.\n\nBurp Suite Community and OWASP ZAP sit between your browser and a web app so you can see, modify and replay requests. In the lab: set the browser proxy, install the proxy’s CA certificate, browse the app, inspect the history, send requests to Repeater and compare responses for different users.\n\nHere is a typical access-control check. Log in as test user A and capture the request for one of A’s orders. Send it to Repeater, swap in test user B’s session cookie and resend. A different user’s item returning 200 warrants an access-control review, because B should have been refused with 403 or 404.',
      b: ['Wireshark filters: http · tls.handshake · ip.addr == x.x.x.x · tcp.flags.syn==1 && tcp.flags.ack==0']
    },
    {
      h: '4. Vulnerability scanning',
      t: 'A vulnerability scanner checks systems against a large database of known weaknesses: missing patches, old software versions, weak settings and default passwords. Tools such as OpenVAS/Greenbone and Nessus can test thousands of items on each host. It is like a fire safety inspection with a long printed checklist: fast and thorough for known items, but blind to anything that is not on the list.\n\nDifferent scan types see different things. Combine them for coverage. An unauthenticated scan sees only what an outsider sees, so it misses many problems. An authenticated (credentialed) scan logs in with a least-privilege account and reads installed versions and settings directly, so it is far more accurate. Agents on each host suit laptops and cloud machines that come and go, and web application (DAST) scans test running apps.\n\nThe bullets give the process. Plan: get approval, define targets and time windows, and tell the operations team, so they do not mistake your scan for an attack. Tune: use safe checks, throttle the speed and avoid production at peak hours. Validate: confirm high-severity results by hand, and mark false positives with the reason.\n\nThe last step is where many teams fail. A report of 400 findings that nobody owns changes nothing. Track every finding to closure with an owner and a due date, then rescan to prove it is fixed.',
      table: [
        ['Scan type', 'Description', 'Notes'],
        ['Unauthenticated', 'Sees what an outsider sees', 'Fewer findings, more false negatives'],
        ['Authenticated (credentialed)', 'Logs in to inspect patches and configuration', 'More accurate; use a least-privilege scan account'],
        ['Agent-based', 'Software on each host reports in', 'Good for laptops and cloud'],
        ['Web application (DAST)', 'Crawls and tests a running app', 'Run against staging when possible'],
        ['Container / image', 'Checks packages in images', 'Part of CI/CD (Module 13)']
      ],
      b: [
        'Plan: get approval, define targets and windows, and tell the operations team.',
        'Tune: use safe checks, throttle, and avoid scanning production at peak times.',
        'Validate: manually confirm high-severity results; mark false positives and record why.',
        'Track every finding to closure with an owner and a due date.'
      ]
    },
    {
      h: '5. CVE, CWE and CVSS',
      t: 'When thousands of people discuss the same flaw, they need a common name for it. CVE (Common Vulnerabilities and Exposures) gives each public flaw an ID, such as CVE-2021-44228 for the Log4Shell flaw. It works like the PNR number on a train ticket: one number that everyone can use to find the same record.\n\nNVD, the US National Vulnerability Database, adds detail to each entry: CVSS scores and CWE weakness types. CWE (Common Weakness Enumeration) names the kind of mistake behind the flaw. For example, CWE-89 is SQL injection and CWE-79 is cross-site scripting. A CVE is one specific bug; a CWE is the category of bug.\n\nCVSS v3.1 measures technical severity from 0 to 10 using a vector: attack vector (AV), attack complexity (AC), privileges required (PR), user interaction (UI), scope (S) and impact on confidentiality, integrity and availability (C/I/A). The vector AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H means: attackable over the network, easy, no login needed, no user action, and high impact on all three. That scores 9.8, Critical.\n\nThe code shows how the formula turns these letters into a number, using weights such as 0.85 for a network attack vector. Run it, then change one value, for example PR from N to H, and watch the score fall to 7.2. Trying a few changes like this shows you which factors matter most.',
      table: [
        ['CVSS score', 'Severity'],
        ['0.0', 'None'],
        ['0.1 – 3.9', 'Low'],
        ['4.0 – 6.9', 'Medium'],
        ['7.0 – 8.9', 'High'],
        ['9.0 – 10.0', 'Critical']
      ],
      code: 'import math\n\nW = {"AV": {"N": .85, "A": .62, "L": .55, "P": .2}, "AC": {"L": .77, "H": .44},\n     "UI": {"N": .85, "R": .62}, "CIA": {"H": .56, "L": .22, "N": 0}}\nPR = {"U": {"N": .85, "L": .62, "H": .27}, "C": {"N": .85, "L": .68, "H": .5}}\n\ndef roundup(x):\n    i = round(x * 100000)\n    return i / 100000.0 if i % 10000 == 0 else (math.floor(i / 10000) + 1) / 10.0\n\ndef cvss31(vector):\n    m = dict(p.split(":") for p in vector.split("/")[1:])\n    s = m["S"]\n    iss = 1 - (1 - W["CIA"][m["C"]]) * (1 - W["CIA"][m["I"]]) * (1 - W["CIA"][m["A"]])\n    impact = 6.42 * iss if s == "U" else 7.52 * (iss - .029) - 3.25 * (iss - .02) ** 15\n    expl = 8.22 * W["AV"][m["AV"]] * W["AC"][m["AC"]] * PR[s][m["PR"]] * W["UI"][m["UI"]]\n    if impact <= 0:\n        return 0.0\n    return roundup(min(impact + expl, 10)) if s == "U" else roundup(min(1.08 * (impact + expl), 10))\n\ndef severity(x):\n    return "None" if x == 0 else "Low" if x < 4 else "Medium" if x < 7 else "High" if x < 9 else "Critical"\n\nfor v in ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",\n          "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N",\n          "CVSS:3.1/AV:L/AC:H/PR:H/UI:R/S:U/C:L/I:N/A:N"]:\n    score = cvss31(v)\n    print(f"{score:>4}  {severity(score):8} {v}")',
      lang: 'python'
    },
    {
      h: '6. Prioritize with context, not just CVSS',
      t: 'CVSS measures technical severity, not your risk. A score describes the flaw in general, everywhere in the world. Your risk depends on where that flaw sits in your own organization. A broken lock on a bank locker room and the same broken lock on an empty storeroom are the same lock, but not the same problem.\n\nThe table lists the questions to ask. Is the flaw in CISA’s Known Exploited Vulnerabilities (KEV) catalog, meaning attackers are using it right now? What is its EPSS probability, the estimated chance that it will be exploited in the next 30 days? Is the system internet-facing? What data or business process depends on it? Is a compensating control such as a WAF, segmentation or EDR protecting it? Is a patch available, and is downtime needed?\n\nRule of thumb: a "Medium" CVSS flaw that is actively exploited on an internet-facing server can outrank a "Critical" one on an isolated test box. For example, a 6.5 flaw listed in KEV on your public VPN gateway should be patched this week. A 9.8 on a lab VM with no network access can wait for the normal patch cycle.\n\nMany organizations write this into policy, such as "KEV-listed and internet-facing: fix within 7 days". Being able to explain this reasoning clearly is a skill interviewers look for.',
      table: [
        ['Factor', 'Question'],
        ['Exploitability', 'Is it in CISA’s KEV catalog? What is its EPSS probability?'],
        ['Exposure', 'Is the system internet-facing?'],
        ['Asset value', 'What data or business process depends on it?'],
        ['Compensating controls', 'Is there a WAF, segmentation or EDR protecting it?'],
        ['Fix effort', 'Is a patch available? Is downtime needed?']
      ]
    },
    {
      h: '7. Analyzing a CVE step by step',
      t: 'When a scanner or a news headline reports a new CVE, a good analyst follows the same routine every time. A routine stops you from panicking over a scary headline or ignoring a real threat. It is like checking your PNR status before rushing to the station: confirm the facts first, then act.\n\nFor each important finding, start with the facts. Read the CVE description and affected versions. Check NVD for the CVSS vector and CWE. Check KEV and EPSS for real-world exploitation. These steps answer three questions: what is it, how bad is it in general, and are attackers using it?\n\nNext, confirm the version on your system with a credentialed scan or the package manager. On Ubuntu, apt list --installed | grep openssh shows the installed OpenSSH package. Remember that Linux distributions often backport fixes, so a version number that looks old may already be patched; the distribution’s security notice will tell you. Then find the vendor fix or workaround.\n\nFinally, assign an owner and due date by priority, and rescan after the fix. The rescan is what closes the finding; without it, "we patched it" is only a claim. Keep notes on each step in the ticket so anyone can see how you reached your decision.'
    }
  ],
  lab: {
    title: 'Hands-on Lab 08: discover, scan and prioritize in your lab',
    steps: [
      ['Build the lab: a Kali VM and a vulnerable target VM on a host-only network. Take snapshots before scanning.', 'ping -c 2 192.168.56.101   # target answers\nping -c 2 8.8.8.8          # Internet should NOT answer', 'Snapshots let you roll back if a scan or exploit breaks the target.'],
      ['Run a ping sweep, then a service scan of the target, and record the results in a table.', 'nmap -sn 192.168.56.0/24\nnmap -sV -sC -p- 192.168.56.101 -oA target', 'Record port, state, service and version. Versions are what scanners match against CVEs.'],
      ['Run an OpenVAS/Greenbone or Nessus Essentials scan of the target and export the report.', null, 'Mark each high finding as confirmed or false positive, and write down how you checked.'],
      ['Pick three findings with CVE IDs. Look each up on NVD and record the CVSS vector, CWE, affected versions and fix; then compute the score with the CVSS calculator above.', null, 'Check whether any of them is in the CISA KEV catalog: that changes the priority immediately.'],
      ['Fix one issue on the target (patch or configuration), rescan, and compare before and after.', null, 'Only the rescan proves the fix; a closed ticket does not.']
    ]
  },
  examples: [
    {
      title: 'Context-based priority ranking',
      lang: 'python',
      code: 'vulns = [\n    {"id": "Finding A", "cvss": 9.8, "kev": False, "internet": False, "asset": 2},\n    {"id": "Finding B", "cvss": 6.5, "kev": True,  "internet": True,  "asset": 5},\n    {"id": "Finding C", "cvss": 7.5, "kev": False, "internet": True,  "asset": 4},\n    {"id": "Finding D", "cvss": 5.3, "kev": False, "internet": False, "asset": 1},\n]\n\ndef priority(v):\n    score = v["cvss"]\n    score += 4 if v["kev"] else 0         # actively exploited\n    score += 2 if v["internet"] else 0    # exposed to everyone\n    score += v["asset"] * 0.5             # business value 1-5\n    return round(score, 1)\n\nfor v in sorted(vulns, key=priority, reverse=True):\n    print(f"{v[\'id\']}: priority {priority(v):>4}  (CVSS {v[\'cvss\']}, KEV={v[\'kev\']}, internet={v[\'internet\']})")',
      explanation: 'Finding B has a lower CVSS score than A, but it is actively exploited, internet-facing and on a valuable asset, so it is fixed first. Real programs use similar weighted models (risk-based vulnerability management).'
    }
  ],
  best: [
    'Keep an up-to-date asset inventory and scan all of it.',
    'Prefer credentialed scans with a least-privilege scan account.',
    'Validate high-severity results manually and document false positives.',
    'Prioritize with KEV, EPSS, exposure and asset value, not CVSS alone.',
    'Give every finding an owner and a due date, and verify fixes with a rescan.',
    'Schedule scans with operations and throttle them on fragile systems.'
  ],
  mistakes: [
    'Scanning networks or hosts that are not in your authorization.',
    'Treating the scanner report as the final answer without validation.',
    'Sorting only by CVSS and ignoring actively exploited, internet-facing flaws.',
    'Closing tickets without a rescan or retest.',
    'Using Kali as an everyday operating system.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. What is the difference between open, closed and filtered ports?\n2. Why is credentialed scanning more accurate than unauthenticated scanning?\n3. Compute the CVSS base score for AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N with the calculator and name the severity.\n4. Explain why you might patch a CVSS 6.5 vulnerability before a CVSS 9.0 one.\n5. Write a one-paragraph remediation plan for “TLS 1.0 enabled”.\n6. List five precautions before running a scan in a production environment.'
  },
  mini: {
    title: 'Mini project: lab vulnerability assessment',
    objective: 'Run a full vulnerability-management cycle on your lab network.',
    requirements: [
      'An asset list and Nmap scans of every host.',
      'An authenticated vulnerability scan.',
      'Manual validation of the top five findings.',
      'CVSS plus context-based prioritization and a remediation plan.',
      'Fix three issues, rescan, and show before/after metrics.'
    ],
    deliverable: 'A short report with the inventory, prioritized findings table, remediation plan and before/after evidence.'
  },
  takeaways: [
    'Tools produce data; analysts produce decisions.',
    'Nmap discovers, scanners assess, proxies test web apps, Wireshark confirms.',
    'CVE names a flaw, CWE names its type, CVSS scores its technical severity.',
    'Context (KEV, EPSS, exposure, asset value) sets the real priority.',
    'Always scan with permission, and verify every fix with a rescan.'
  ],
  quickRef: [
    'nmap -sn NET · -sV · -p- · --top-ports 100 · -sC · -oA name',
    'CVSS: Low 0.1–3.9 · Medium 4–6.9 · High 7–8.9 · Critical 9–10',
    'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H = 9.8',
    'Priority = CVSS + KEV + EPSS + exposure + asset value',
    'Inventory → Scan → Validate → Prioritize → Remediate → Verify'
  ],
  refs: [
    ['Nmap Reference Guide', 'https://nmap.org/book/man.html'],
    ['Kali Linux Documentation', 'https://www.kali.org/docs/'],
    ['National Vulnerability Database (NVD)', 'https://nvd.nist.gov/'],
    ['CISA Known Exploited Vulnerabilities Catalog', 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog'],
    ['FIRST CVSS v3.1 Specification', 'https://www.first.org/cvss/v3.1/specification-document']
  ],
  quiz: [
    ['Which tool is mainly used to discover open ports?', ['Nmap', 'Autopsy', 'Hashcat', 'Lynis'], 0, 'Nmap performs host, port and service discovery.'],
    ['A CVSS score of 9.1 is rated:', ['Low', 'Medium', 'High', 'Critical'], 3, '9.0 to 10.0 is Critical.'],
    ['What does a CVE identify?', ['A firewall rule', 'A specific publicly known vulnerability', 'A password', 'A malware family'], 1, 'Each CVE ID names one public vulnerability.'],
    ['Which scan logs in to inspect a host from inside?', ['Unauthenticated', 'Credentialed', 'Ping sweep', 'Passive'], 1, 'Credentialed scans use an account to check patches and configuration.'],
    ['After patching, what proves the vulnerability is gone?', ['A closed ticket', 'A rescan or retest', 'A meeting', 'Nothing'], 1, 'Only verification by rescanning or retesting proves the fix.']
  ],

  skills: ['Read Nmap results', 'Choose scan types', 'Calculate CVSS v3.1', 'Prioritize with KEV and EPSS', 'Track remediation'],
  prereq: ['Module 02 (ports and protocols)', 'Module 07 (authorization and validation)'],
  analogy: 'A scanner is a metal detector at the airport: it beeps at belts and coins as well as weapons. The security officer (analyst) checks each beep, ignores the harmless ones, and acts fast on the dangerous ones, starting with the passenger already at the gate (internet-facing and exploited).',
  why: 'Most breaches exploit known vulnerabilities with patches available. Organizations that find, prioritize and fix them quickly prevent the majority of incidents.',
  workflow: {
    title: 'Analyzing one scanner finding',
    nodes: [
      ['finding', 'Scanner finding', 'CVE on a host', 'Scan report', 'Candidate issue', 'The scanner reports, for example, an outdated web server version linked to a CVE on 10.0.5.20.'],
      ['confirm', 'Confirm', 'Is the version really there?', 'Host access', 'True or false positive', 'Check the version with a credentialed scan or the package manager. Backported patches often make banner-based findings false positives.'],
      ['research', 'Research', 'NVD, vendor, KEV, EPSS', 'CVE ID', 'Vector, CWE, exploitation status', 'Read the CVSS vector and CWE on NVD, the vendor advisory for the fix, and check whether attackers are actively exploiting it (KEV) or likely to (EPSS).'],
      ['context', 'Add context', 'Exposure and asset value', 'Asset inventory', 'Business priority', 'Is the host internet-facing? What data does it hold? Is there a WAF or segmentation in front of it?'],
      ['assign', 'Assign', 'Owner + due date', 'Priority', 'Tracked ticket', 'Critical and actively exploited internet-facing flaws get days, not months. Record any accepted risk with an approver.'],
      ['verify', 'Verify', 'Rescan after the fix', 'Patched host', 'Closed finding', 'Rescan or retest the specific issue. Close the ticket only with evidence.']
    ],
    explanation: 'The same six steps apply to every finding, whether it came from a scanner, a pentest or a bug bounty.'
  },
  caseStudy: {
    title: 'The Equifax breach (2017)',
    problem: 'A known Apache Struts vulnerability, with a patch available for months, remained on an internet-facing system.',
    data: 'Asset inventory, scan coverage, patch records, web logs.',
    steps: ['A critical Struts vulnerability was published with a fix.', 'The affected internet-facing application was not identified and patched.', 'A scanning gap meant the issue was not detected.', 'Attackers exploited it and exfiltrated data on about 147 million people over weeks.'],
    result: 'Complete inventory, scans that really cover everything, and fast patching of known-exploited flaws would have prevented it.',
    limitations: 'Simplified summary; read the official reports for details.'
  },
  exercises: [
    { title: 'Compute a CVSS score', difficulty: 'Intermediate', objective: 'Use the CVSS calculator.', problem: 'What is the CVSS v3.1 base score of AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N? (Run the calculator in the lesson.)', answer: 6.5, tolerance: 0.05, hints: ['Network, low complexity, low privileges, high confidentiality impact only.'], solution: ['Run cvss31("CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N").', 'The result is 6.5: Medium.'], explanation: 'A logged-in user can read sensitive data: medium technical severity, but possibly high business risk.' },
    { title: 'Read the port state', objective: 'Interpret Nmap.', problem: 'Nmap shows 3306/tcp filtered. What does that most likely mean?', options: ['MySQL is open to everyone', 'A firewall dropped or blocked the probes', 'No host exists', 'The service crashed'], answer: 1, hints: ['Filtered is different from closed.'], solution: ['Filtered means no clear answer came back, usually because a firewall dropped the probe.'], explanation: 'Closed would mean the host answered but no service listens.' },
    { title: 'Which first?', objective: 'Prioritize with context.', problem: 'Which should be fixed first?', options: ['CVSS 9.8 on an isolated test VM with no data', 'CVSS 6.5 in the KEV catalog on the internet-facing login server', 'CVSS 4.3 on an internal printer', 'CVSS 7.0 on a decommissioned host'], answer: 1, hints: ['Exploitation + exposure + value.'], solution: ['Active exploitation and internet exposure on a valuable asset outweigh the raw score.'], explanation: 'Risk-based prioritization beats sorting by CVSS.' },
    { type: 'Short answer', title: 'Name the catalog', objective: 'Know prioritization sources.', problem: 'Which CISA catalog lists vulnerabilities known to be exploited in the wild? Give its three-letter short name.', accept: ['kev'], hints: ['Known Exploited Vulnerabilities.'], solution: ['CISA KEV.'], explanation: 'Many organizations patch KEV entries within days.' }
  ],
  checks: [
    ['Why is credentialed scanning more accurate?', ['It is faster', 'It can see installed patches and configuration from inside', 'It needs no permission', 'It scans more IPs'], 1, 'Logging in avoids guessing from banners.'],
    ['What does CWE describe?', ['A score', 'The type of weakness, such as SQL injection', 'A firewall', 'An exploit kit'], 1, 'CWE-89 is SQL injection, CWE-79 is XSS.'],
    ['What should you do before scanning production?', ['Nothing', 'Get approval, agree a window and tell operations', 'Disable logging', 'Use the most aggressive options'], 1, 'Scans can disrupt fragile systems; coordinate first.']
  ],
  cheat: ['nmap -sn · -sV · -p- · -sC · -oA', 'open · closed · filtered', 'CVE = which flaw · CWE = what kind · CVSS = how severe', 'KEV + EPSS + exposure + value = priority', 'Rescan to close'],
  next: 'Module 09 moves to the blue team: SOC operations, SIEM, log analysis, detection rules and MITRE ATT&CK.'
};
