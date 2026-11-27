// Presentation-style diagrams for the 15 Cyber Security modules, drawn by
// components/diagrams/SlideDiagram.jsx (chevrons, steps, pyramid, cycle, triad, hub, columns, stack, table).
// The module's text diagram stays available through the "Text version" button.

export const CYBER_DIAGRAMS = {
  /* ------------------------------------------------------------------ 01 */
  'cs-mod-1': {
    title: 'The CIA Triad, Risk and Defense in Depth',
    subtitle: 'What we protect, how harm happens, and the layers that stop it.',
    slides: [
      {
        type: 'triad', title: 'The CIA Triad', text: 'Every security problem threatens at least one of these goals.',
        center: 'Data & systems',
        items: [
          { title: 'Confidentiality', text: 'Only the right people can see it. Protected by encryption, access control and MFA.' },
          { title: 'Integrity', text: 'Data is correct and unchanged. Protected by hashes, signatures and audit logs.' },
          { title: 'Availability', text: 'Systems work when needed. Protected by backups, redundancy and DR plans.' }
        ]
      },
      {
        type: 'chevrons', title: 'From threat to risk', text: 'A threat uses an exploit against a vulnerability to harm an asset.',
        steps: [
          { title: 'Threat actor', text: 'Criminal, APT, insider, hacktivist' },
          { title: 'Exploit', text: 'Code or trick that abuses a weakness' },
          { title: 'Vulnerability', text: 'Unpatched server, weak password' },
          { title: 'Asset', text: 'Data, systems, reputation' },
          { title: 'Risk', text: 'Likelihood × impact' }
        ]
      },
      {
        type: 'stack', title: 'Defense in depth', text: 'If one layer fails, the next one still protects the asset.',
        layers: [
          { title: 'People', text: 'Awareness training, clear policies and least privilege.' },
          { title: 'Network', text: 'Firewalls, segmentation and IDS/IPS.' },
          { title: 'Endpoints & apps', text: 'Patching, EDR, secure code and MFA.' },
          { title: 'Data', text: 'Encryption, backups and locked server rooms.' },
          { title: 'Detect & respond', text: 'SIEM alerts, incident response and restore from backup.' }
        ]
      }
    ],
    note: 'No written permission, no testing: every technique in this course is practiced only on your own systems or authorized labs.'
  },

  /* ------------------------------------------------------------------ 02 */
  'cs-mod-2': {
    title: 'How Data Travels and How the Network Is Defended',
    subtitle: 'Layers, the journey of one web request, and a segmented network.',
    slides: [
      {
        type: 'stack', title: 'OSI layers and their attacks', text: 'Each layer adds a header on the way down and has its own attacks.',
        layers: [
          { title: '7  Application', text: 'HTTP, DNS, SMTP · injection, phishing' },
          { title: '4  Transport', text: 'TCP, UDP, ports · SYN floods, port scans' },
          { title: '3  Network', text: 'IP, routers, ICMP · IP spoofing, route hijacks' },
          { title: '2  Data link', text: 'Ethernet, MAC, switches · ARP spoofing, MAC flooding' },
          { title: '1  Physical', text: 'Cables, Wi-Fi radio · tapping, jamming' }
        ]
      },
      {
        type: 'chevrons', title: 'Opening https://example.com',
        steps: [
          { title: 'DNS lookup', text: 'Name → IP over UDP 53' },
          { title: 'TCP handshake', text: 'SYN → SYN-ACK → ACK on 443' },
          { title: 'TLS handshake', text: 'Certificate check, session keys' },
          { title: 'HTTP request', text: 'GET / inside the encrypted tunnel' }
        ]
      },
      {
        type: 'hub', title: 'A segmented network', text: 'The firewall allows only what each zone needs (default deny).',
        center: 'Firewall + IPS',
        items: [
          { title: 'DMZ', text: 'Web server: TCP 443 only' },
          { title: 'Staff VLAN', text: 'Web and DNS out to the Internet' },
          { title: 'Server VLAN', text: 'Only from app servers, logged' },
          { title: 'Guest Wi-Fi', text: 'Internet only, no internal access' },
          { title: 'IDS → SIEM', text: 'Copy of traffic analyzed' }
        ]
      },
      {
        type: 'table', title: 'Subnetting at a glance',
        head: ['CIDR', 'Mask', 'Addresses', 'Usable hosts'],
        rows: [['/24', '255.255.255.0', '256', '254'], ['/26', '255.255.255.192', '64', '62'], ['/27', '255.255.255.224', '32', '30'], ['/30', '255.255.255.252', '4', '2']]
      }
    ]
  },

  /* ------------------------------------------------------------------ 03 */
  'cs-mod-3': {
    title: 'OS Access Control and the Hardening Cycle',
    subtitle: 'How Linux and Windows decide access, and the habits that harden both.',
    slides: [
      {
        type: 'columns', title: 'Who may open this file?',
        columns: [
          { title: 'Linux', subtitle: 'owner · group · others', items: ['r = 4, w = 2, x = 1 (640 = owner rw, group r)', 'sudo for admin tasks, no root login', 'Watch SUID binaries', 'Evidence in /var/log/auth.log'] },
          { title: 'Windows', subtitle: 'access token vs ACL', items: ['NTFS ACLs inherit from parent folders', 'Explicit Deny beats Allow', 'UAC prompts before admin actions', 'Evidence in Event Viewer'] }
        ]
      },
      {
        type: 'cycle', title: 'The hardening cycle', center: 'Hardened system',
        nodes: [{ title: 'Patch' }, { title: 'Minimize' }, { title: 'Restrict' }, { title: 'Log' }, { title: 'Encrypt' }, { title: 'Verify (CIS / Lynis)' }]
      },
      {
        type: 'table', title: 'Windows Event IDs every analyst knows',
        head: ['Event ID', 'Meaning', 'Why it matters'],
        rows: [['4624 / 4625', 'Logon success / failure', 'Many 4625s then a 4624 = brute force that worked'], ['4672', 'Admin privileges at logon', 'Who used admin rights'], ['4720 / 4732', 'User created / added to group', 'Persistence and privilege changes'], ['1102', 'Audit log cleared', 'Attackers hiding their tracks']]
      }
    ]
  },

  /* ------------------------------------------------------------------ 04 */
  'cs-mod-4': {
    title: 'Security Automation and Safe Input Handling',
    subtitle: 'How scripts turn logs into alerts, and how code keeps input from becoming commands.',
    slides: [
      {
        type: 'chevrons', title: 'The automation pattern',
        steps: [
          { title: 'Input', text: 'Logs, CSV, APIs, files' },
          { title: 'Parse', text: 'Regex, json, csv' },
          { title: 'Analyze', text: 'Counter, thresholds, allow-lists' },
          { title: 'Output', text: 'Alert, CSV report, ticket' }
        ]
      },
      {
        type: 'columns', title: 'Untrusted input: three places it can hurt, three fixes',
        columns: [
          { title: 'Database', subtitle: 'SQL injection', items: ['Risk: building SQL with string concatenation', 'Fix: parameterized queries, execute("... = ?", (value,))'] },
          { title: 'Browser', subtitle: 'Cross-site scripting', items: ['Risk: innerHTML and eval() with user data', 'Fix: textContent, HTML encoding and a CSP'] },
          { title: 'Shell', subtitle: 'Command injection', items: ['Risk: os.system("ping " + host)', 'Fix: validate, then subprocess.run([...]) with an argument list'] }
        ]
      }
    ],
    note: 'Validate with allow-lists on the server. Client-side checks help usability but never replace server checks.'
  },

  /* ------------------------------------------------------------------ 05 */
  'cs-mod-5': {
    title: 'Cryptography Building Blocks',
    subtitle: 'Which tool gives which guarantee, and how TLS combines them.',
    slides: [
      {
        type: 'columns', title: 'Encoding, hashing and encryption',
        columns: [
          { title: 'Encoding', subtitle: 'Base64, hex', items: ['Changes format only', 'Anyone can reverse it', 'Not security'] },
          { title: 'Hashing', subtitle: 'SHA-256, Argon2id', items: ['One-way fingerprint', 'Integrity checks', 'Password storage with salt'] },
          { title: 'Encryption', subtitle: 'AES-GCM, RSA/ECC', items: ['Reversible with the key', 'Confidentiality', 'Keys kept in a KMS'] }
        ]
      },
      {
        type: 'steps', title: 'TLS 1.3 handshake (simplified)',
        steps: [
          { title: 'Client hello', text: 'Supported ciphers and a fresh ECDHE key share.' },
          { title: 'Server hello + certificate', text: 'Server key share, certificate chain and a signature; the browser checks the chain, name and expiry.' },
          { title: 'Session keys', text: 'Both sides compute the same keys, giving forward secrecy.' },
          { title: 'Encrypted data', text: 'AES-GCM or ChaCha20-Poly1305 protects every request.' }
        ]
      },
      {
        type: 'chevrons', title: 'Storing a password safely',
        steps: [
          { title: 'Password', text: 'Sent over HTTPS' },
          { title: 'Add salt', text: '16 random bytes per user' },
          { title: 'Slow hash', text: 'Argon2id or bcrypt' },
          { title: 'Store', text: 'Salt + settings + hash' }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 06 */
  'cs-mod-6': {
    title: 'Securing a Web Request',
    subtitle: 'The server-side checks every request must pass, mapped to the OWASP Top 10.',
    slides: [
      {
        type: 'steps', title: 'Server-side checks, in order',
        steps: [
          { title: 'WAF and rate limits', text: 'Block known attack patterns and slow down brute force.' },
          { title: 'Authenticate', text: 'Who is this? Sessions, MFA and token checks (A07).' },
          { title: 'Authorize every object', text: 'May this user read order 7? Stops IDOR (A01).' },
          { title: 'Validate input', text: 'Type, length and format with allow-lists (A03).' },
          { title: 'Parameterize queries', text: 'Input is data, never SQL.' },
          { title: 'Restrict outbound calls', text: 'Allow-list destinations to stop SSRF (A10).' },
          { title: 'Encode output + headers', text: 'HTML encoding, CSP and HttpOnly cookies stop XSS.' }
        ]
      },
      {
        type: 'table', title: 'OWASP Top 10 (2021) at a glance',
        head: ['#', 'Risk', 'Core fix'],
        rows: [['A01', 'Broken Access Control', 'Server-side ownership checks'], ['A02', 'Cryptographic Failures', 'TLS, strong algorithms, protected secrets'], ['A03', 'Injection', 'Parameterize, encode, validate'], ['A05', 'Security Misconfiguration', 'Hardened defaults, no debug'], ['A06', 'Vulnerable Components', 'SBOM, updates, scanning'], ['A07', 'Authentication Failures', 'MFA, rate limits, safe sessions'], ['A10', 'SSRF', 'Outbound allow-lists, IMDSv2']]
      }
    ],
    note: 'Never trust the client: hidden fields, prices and roles in the browser can all be changed by the user.'
  },

  /* ------------------------------------------------------------------ 07 */
  'cs-mod-7': {
    title: 'The Penetration-Testing Lifecycle',
    subtitle: 'Authorization first; the report and the retest are the real product.',
    slides: [
      {
        type: 'chevrons', title: 'Before anything starts',
        steps: [
          { title: 'Written authorization', text: 'Signed by the system owner' },
          { title: 'Scope', text: 'Exact IPs, apps, accounts, exclusions' },
          { title: 'Rules of engagement', text: 'Techniques, hours, contacts, stop-work' }
        ]
      },
      {
        type: 'cycle', title: 'The testing cycle', center: 'Authorized engagement',
        nodes: [{ title: 'Plan' }, { title: 'Recon' }, { title: 'Enumerate' }, { title: 'Analyze' }, { title: 'Validate' }, { title: 'Report' }, { title: 'Retest' }]
      },
      {
        type: 'columns', title: 'Engagement types',
        columns: [
          { title: 'Vulnerability assessment', items: ['Broad and mostly automated', 'Weekly or monthly', 'A prioritized list'] },
          { title: 'Penetration test', items: ['Deep, manual, goal-driven', 'Yearly or after big changes', 'Proven attack paths'] },
          { title: 'Red team', items: ['Simulates a real adversary', 'Tests detection and response', 'Measures the blue team'] }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 08 */
  'cs-mod-8': {
    title: 'Vulnerability Management',
    subtitle: 'A continuous cycle, with priority set by context and not by CVSS alone.',
    slides: [
      {
        type: 'cycle', title: 'The vulnerability-management cycle', center: 'Fewer exploitable weaknesses',
        nodes: [{ title: 'Inventory' }, { title: 'Scan' }, { title: 'Validate' }, { title: 'Prioritize' }, { title: 'Remediate' }, { title: 'Verify' }]
      },
      {
        type: 'columns', title: 'What sets real priority',
        columns: [
          { title: 'Severity', subtitle: 'CVSS base score', items: ['Low 0.1–3.9', 'Medium 4–6.9', 'High 7–8.9', 'Critical 9–10'] },
          { title: 'Threat', subtitle: 'Is it being exploited?', items: ['CISA KEV catalog', 'EPSS probability', 'Public exploit code'] },
          { title: 'Context', subtitle: 'Your environment', items: ['Internet-facing or internal', 'Data and business value', 'WAF, segmentation, EDR'] }
        ]
      },
      {
        type: 'table', title: 'Reading Nmap port states',
        head: ['State', 'Meaning'],
        rows: [['open', 'A service answered'], ['closed', 'The host answered, no service is listening'], ['filtered', 'A firewall dropped or blocked the probe']]
      }
    ]
  },

  /* ------------------------------------------------------------------ 09 */
  'cs-mod-9': {
    title: 'The SOC: from Logs to Decisions',
    subtitle: 'Log sources, alert triage and the Pyramid of Pain.',
    slides: [
      {
        type: 'hub', title: 'Log sources feed the SIEM', center: 'SIEM',
        items: [
          { title: 'Identity', text: 'Logons, MFA, privilege changes' },
          { title: 'Endpoints', text: 'EDR, Sysmon, auditd' },
          { title: 'Network', text: 'Firewall, DNS, proxy' },
          { title: 'Cloud', text: 'CloudTrail, Activity Log' },
          { title: 'Apps & email', text: 'Errors, admin actions' },
          { title: 'SOC analysts', text: 'Alerts, triage, response' }
        ]
      },
      {
        type: 'chevrons', title: 'Triage of one alert',
        steps: [
          { title: 'Alert', text: 'A rule fires' },
          { title: 'Context', text: 'Asset value, user baseline' },
          { title: 'Enrich', text: 'Threat intel, related alerts' },
          { title: 'Decide', text: 'True or false positive' },
          { title: 'Act + record', text: 'Escalate or tune; write the ticket' }
        ]
      },
      {
        type: 'pyramid', title: 'Pyramid of Pain', text: 'Detecting behavior at the top hurts attackers the most.',
        levels: [
          { title: 'TTPs', text: 'Tough: attackers must change how they operate.' },
          { title: 'Tools', text: 'Challenging: new tools take time.' },
          { title: 'Artifacts', text: 'Annoying: host and network traces.' },
          { title: 'Domains', text: 'Simple to register new ones.' },
          { title: 'IP addresses', text: 'Easy to change.' },
          { title: 'Hash values', text: 'Trivial: one changed byte gives a new hash.' }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 10 */
  'cs-mod-10': {
    title: 'Incident Response and Evidence Handling',
    subtitle: 'The NIST lifecycle, the order of volatility and the chain of custody.',
    slides: [
      {
        type: 'cycle', title: 'NIST incident-response lifecycle', center: 'Lessons feed preparation',
        nodes: [{ title: 'Preparation' }, { title: 'Detection & analysis' }, { title: 'Containment & recovery' }, { title: 'Post-incident review' }]
      },
      {
        type: 'pyramid', title: 'Order of volatility', text: 'Collect from the top down: the top disappears first.',
        levels: [
          { title: 'CPU & cache', text: 'Gone in nanoseconds.' },
          { title: 'RAM', text: 'Processes, connections and keys; lost at power-off, so isolate instead.' },
          { title: 'Network state', text: 'Routing tables and connections change constantly.' },
          { title: 'Disk', text: 'Image it through a write blocker and verify hashes.' },
          { title: 'Logs & backups', text: 'Most stable; collect remote copies.' }
        ]
      },
      {
        type: 'chevrons', title: 'Chain of custody',
        steps: [
          { title: 'Identify', text: 'Label each item' },
          { title: 'Hash', text: 'SHA-256 at collection' },
          { title: 'Image', text: 'Work on copies' },
          { title: 'Record', text: 'Every transfer: who, when, why' },
          { title: 'Secure', text: 'Locked, access-controlled storage' }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 11 */
  'cs-mod-11': {
    title: 'Malware Analysis and Threat Intelligence',
    subtitle: 'How malware works, how analysts study it safely, and how findings become intelligence.',
    slides: [
      {
        type: 'chevrons', title: 'Malware lifecycle',
        steps: [
          { title: 'Deliver', text: 'LNK, ISO, smuggling, supply chain' },
          { title: 'Execute', text: 'Dropper decrypts the payload' },
          { title: 'Persist', text: 'Run keys, tasks, services' },
          { title: 'Beacon', text: 'C2 over HTTPS or DNS' },
          { title: 'Act', text: 'Steal, move, encrypt' }
        ]
      },
      {
        type: 'pyramid', title: 'Depth of analysis', text: 'Each level gives more insight and takes more effort.',
        levels: [
          { title: 'Code analysis', text: 'Ghidra and a debugger: how it really works.' },
          { title: 'Dynamic', text: 'Run it in an isolated lab with ProcMon and FakeNet-NG.' },
          { title: 'Static triage', text: 'Hashes, strings, PE headers and entropy.' },
          { title: 'Automated', text: 'Sandbox and multi-AV results, searched by hash.' }
        ]
      },
      {
        type: 'cycle', title: 'Threat-intelligence cycle', center: 'Actionable intelligence',
        nodes: [{ title: 'Direction' }, { title: 'Collection' }, { title: 'Processing' }, { title: 'Analysis' }, { title: 'Sharing (TLP)' }, { title: 'Feedback' }]
      },
      {
        type: 'columns', title: 'Four kinds of intelligence',
        columns: [
          { title: 'Strategic', subtitle: 'Board · years', items: ['Adversary motives', 'Industry risk'] },
          { title: 'Operational', subtitle: 'SOC & IR leads · months', items: ['Campaigns', 'Infrastructure trends'] },
          { title: 'Tactical', subtitle: 'Engineers · weeks', items: ['TTPs', 'ATT&CK shifts'] },
          { title: 'Technical', subtitle: 'Analysts · hours', items: ['IOCs', 'Hashes, IPs, domains'] }
        ]
      }
    ],
    note: 'Analyze samples only in isolated, snapshotted VMs on a host-only network, and search hashes before uploading anything to public services.'
  },

  /* ------------------------------------------------------------------ 12 */
  'cs-mod-12': {
    title: 'Cloud Security',
    subtitle: 'What you own in the cloud, and how identity, network and data controls layer together.',
    slides: [
      {
        type: 'table', title: 'Shared responsibility model',
        head: ['Layer', 'IaaS', 'PaaS', 'SaaS'],
        rows: [['Data and access', 'You', 'You', 'You'], ['Application', 'You', 'You', 'Provider'], ['OS and runtime', 'You', 'Provider', 'Provider'], ['Hypervisor, hardware, facilities', 'Provider', 'Provider', 'Provider']]
      },
      {
        type: 'stack', title: 'A three-tier cloud network',
        layers: [
          { title: 'Public subnet', text: 'WAF + load balancer: the only Internet entry point.' },
          { title: 'Private subnet', text: 'App servers. SG allows 443 from the load balancer only; IAM role and IMDSv2, no stored keys.' },
          { title: 'Isolated subnet', text: 'Database. SG allows 5432 from the app tier only; KMS-encrypted, no public IP.' },
          { title: 'Monitoring', text: 'CloudTrail to the SIEM, CSPM drift checks, GuardDuty or Defender.' }
        ]
      },
      {
        type: 'chevrons', title: 'Envelope encryption',
        steps: [
          { title: 'Get data key', text: 'KMS returns plain + encrypted DEK' },
          { title: 'Encrypt data', text: 'With the plaintext DEK' },
          { title: 'Store', text: 'Encrypted DEK beside the data' },
          { title: 'Erase', text: 'Plaintext DEK removed from memory' }
        ]
      }
    ]
  },

  /* ------------------------------------------------------------------ 13 */
  'cs-mod-13': {
    title: 'A Secure CI/CD Pipeline',
    subtitle: 'Security checks at every stage; the earlier, the cheaper.',
    slides: [
      {
        type: 'chevrons', title: 'Pipeline stages',
        steps: [
          { title: 'Design', text: 'STRIDE threat model' },
          { title: 'Code', text: 'Pre-commit, Gitleaks, review' },
          { title: 'Build', text: 'SAST + SCA, fail on critical' },
          { title: 'Package', text: 'Image scan, SBOM, signing' },
          { title: 'Test', text: 'DAST in staging' },
          { title: 'Deploy', text: 'Verify signature, monitor' }
        ]
      },
      {
        type: 'columns', title: 'Testing types',
        columns: [
          { title: 'SAST', subtitle: 'Source code', items: ['Finds the exact line', 'Runs on every pull request', 'More false positives'] },
          { title: 'DAST', subtitle: 'Running app', items: ['Real, exploitable behavior', 'Runs in staging', 'No code line'] },
          { title: 'SCA', subtitle: 'Dependencies', items: ['Known CVEs in libraries', 'Runs at build time', 'Not your own code'] }
        ]
      },
      {
        type: 'table', title: 'STRIDE',
        head: ['Threat', 'Goal violated', 'Typical control'],
        rows: [['Spoofing', 'Authenticity', 'MFA, mutual TLS'], ['Tampering', 'Integrity', 'Signatures, HMAC'], ['Repudiation', 'Non-repudiation', 'Immutable audit logs'], ['Information disclosure', 'Confidentiality', 'Encryption, least privilege'], ['Denial of service', 'Availability', 'Rate limits, autoscaling'], ['Elevation of privilege', 'Authorization', 'RBAC, input validation']]
      }
    ]
  },

  /* ------------------------------------------------------------------ 14 */
  'cs-mod-14': {
    title: 'Identity, Governance and Risk',
    subtitle: 'Access that follows people, and a program leaders can measure.',
    slides: [
      {
        type: 'cycle', title: 'Identity lifecycle', center: 'Right access, right time',
        nodes: [{ title: 'Joiner' }, { title: 'Authenticate (MFA)' }, { title: 'Mover' }, { title: 'Access review' }, { title: 'Leaver' }]
      },
      {
        type: 'pyramid', title: 'Governance documents', text: 'From leadership intent to everyday practice.',
        levels: [
          { title: 'Policy', text: 'Mandatory and high-level: “All remote access must use MFA.”' },
          { title: 'Standard', text: 'Mandatory and specific: “FIDO2 keys for admins.”' },
          { title: 'Procedure', text: 'Mandatory step by step: the enrolment SOP.' },
          { title: 'Guideline', text: 'Advisory: tips for strong passphrases.' }
        ]
      },
      {
        type: 'columns', title: 'Risk treatment',
        columns: [
          { title: 'Mitigate', items: ['Add controls', 'Example: MFA on VPN'] },
          { title: 'Transfer', items: ['Shift the impact', 'Example: cyber insurance'] },
          { title: 'Avoid', items: ['Stop the activity', 'Example: retire a legacy server'] },
          { title: 'Accept', items: ['Keep a small risk', 'Documented and approved'] }
        ]
      },
      {
        type: 'table', title: 'Frameworks',
        head: ['Framework', 'Structure'],
        rows: [['NIST CSF 2.0', 'Govern · Identify · Protect · Detect · Respond · Recover'], ['ISO/IEC 27001:2022', 'ISMS clauses 4–10 + 93 Annex A controls'], ['SOC 2', 'Trust criteria; Type II tests a period'], ['PCI DSS v4.0', '12 requirements for card data'], ['CIS Controls v8', '18 controls in IG1–IG3']]
      }
    ]
  },

  /* ------------------------------------------------------------------ 15 */
  'cs-mod-15': {
    title: 'Career Paths and the Road to Hiring',
    subtitle: 'One shared foundation, four career pillars, and the evidence employers look for.',
    slides: [
      {
        type: 'hub', title: 'Career pillars', center: 'Security foundations',
        items: [
          { title: 'Defensive', text: 'SOC analyst, incident responder' },
          { title: 'Offensive', text: 'Penetration tester, red team' },
          { title: 'Engineering', text: 'Cloud security, DevSecOps' },
          { title: 'Governance', text: 'GRC analyst, IAM, audit' }
        ]
      },
      {
        type: 'chevrons', title: 'From learner to hired',
        steps: [
          { title: 'Target role', text: 'One path for 6–12 months' },
          { title: 'Lab practice', text: 'Homelab and legal platforms' },
          { title: 'Capstone', text: 'One documented project' },
          { title: 'Certify', text: 'Matched to the role' },
          { title: 'Show work', text: 'Resume, GitHub, LinkedIn' },
          { title: 'Interview', text: 'Fundamentals + scenarios' }
        ]
      },
      {
        type: 'table', title: 'Capstone rubric',
        head: ['Domain', 'Weight'],
        rows: [['Technical execution', '35%'], ['Security practice', '25%'], ['Documentation', '25%'], ['Presentation', '15%']]
      }
    ]
  }
};
