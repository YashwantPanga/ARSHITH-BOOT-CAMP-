export default {
  n: 10,
  title: 'Digital Forensics & Incident Response',
  description: 'The NIST incident-response lifecycle, incident types, severity and roles, evidence collection, the order of volatility and chain of custody, disk, memory, log, network and cloud forensics, imaging and timelines, containment, eradication and recovery, reporting, legal notification and lessons learned.',
  intro: 'Incident response (IR) is how an organization handles a security incident to limit damage and recover. Digital forensics collects and analyzes evidence to understand exactly what happened, and sometimes to support legal action. Together they are called DFIR. Think of the fire brigade and the fire investigator: one puts the fire out, the other finds out how it started.\n\nWhen ransomware hits at 2 a.m., the organizations that recover in days instead of months are the ones that prepared. They have a plan, know who decides, have offline backups, and preserve evidence before wiping systems.\n\nThis module follows the NIST incident-response lifecycle, shows how to handle evidence so it stays trustworthy, introduces disk, memory, log, network and cloud forensics, and ends with containment, recovery, reporting and lessons learned. Practice only on your own lab images and public training datasets such as Digital Corpora, NIST CFReDS or Blue Team Labs.',
  objectives: [
    'Follow the NIST incident-response lifecycle.',
    'Preserve and collect evidence with a defensible chain of custody and the order of volatility.',
    'Explain disk, memory, log, network and cloud forensics conceptually and practically.',
    'Build timelines and document findings.',
    'Contain, eradicate and recover, then learn from the incident.'
  ],
  terms: [
    ['Incident', 'An event that actually or potentially harms the confidentiality, integrity or availability of systems or data.'],
    ['IR plan', 'The prepared document of roles, contacts, decisions and playbooks for handling incidents.'],
    ['Order of volatility', 'Collect the most short-lived evidence first: CPU and RAM before disk, disk before backups.'],
    ['Chain of custody', 'A record of who handled evidence, when and why, keeping it trustworthy and admissible.'],
    ['Forensic image', 'A bit-for-bit copy of storage, verified with hashes.'],
    ['Write blocker', 'A hardware or software tool that prevents any change to the original media during imaging.'],
    ['Timeline', 'A merged, ordered list of file times, logs and events that reconstructs what happened.'],
    ['IOC', 'Indicator of compromise: a hash, IP, domain or artifact linked to the incident.'],
    ['Containment', 'Stopping the spread: isolating hosts, disabling accounts, blocking IPs and revoking tokens.'],
    ['Eradication', 'Removing the attacker’s access, malware and persistence, and fixing the root cause.'],
    ['Tabletop exercise', 'A discussion-based rehearsal of an incident scenario with the people who would respond.'],
    ['Blameless review', 'A lessons-learned meeting focused on fixing systems and processes, not blaming people.']
  ],
  diagramTitle: 'NIST incident-response lifecycle and order of volatility',
  ascii: '   +-------------+    +-----------------------+    +---------------------------+\n   | Preparation |--->| Detection & Analysis  |--->| Containment, Eradication, |\n   | plan, tools,|    | triage, scope, severity|<---| Recovery                  |\n   | backups,    |    | evidence, timeline     |    | isolate, clean, restore   |\n   | tabletops   |    +-----------------------+    +-------------+-------------+\n   +------^------+                                               |\n          |              Post-incident activity: lessons learned  |\n          +-------------------------------------------------------+\n\n   Order of volatility (collect first -> last):\n   CPU/cache -> RAM (processes, connections) -> network state -> running\n   processes -> disk -> remote logs -> backups/archives',
  diagramExplain: 'The lifecycle is a loop: lessons from every incident improve preparation. During detection and containment, evidence is collected in order of volatility, because RAM and network state disappear when a machine is shut down or isolated.',
  sections: [
    {
      h: '1. The incident-response lifecycle (NIST SP 800-61)',
      t: 'NIST SP 800-61 is a widely used US government guide for handling security incidents. Its well-known lifecycle has four phases: preparation; detection and analysis; containment, eradication and recovery; and post-incident activity. The table lists the key activities in each. It works like the fire plan for a college building: what you do before, during and after a fire. The 2025 revision maps response to the NIST Cybersecurity Framework 2.0, but most teams still describe their work with these four phases.\n\nPreparation decides how well you respond. It covers the IR plan and policy, contacts, tooling, logging, backups, training, tabletop exercises and a retainer with specialists. A tabletop exercise is a meeting where the team talks through a pretend incident, such as "the finance server is encrypted at 2 a.m., what do we do?", and finds gaps before a real attacker does.\n\nWhen an incident starts, detection and analysis confirm what is happening, how far it has spread and how serious it is. Containment, eradication and recovery stop the damage, remove the attacker, fix the root cause and restore service from clean backups. Post-incident activity records lessons, writes the report and updates controls and playbooks.\n\nThe phases form a loop, not a straight line. During containment you often find new affected systems, which sends you back to analysis. A team that never prepared tends to discover, at 3 a.m., that nobody has the backup admin’s phone number.',
      table: [
        ['Phase', 'Key activities'],
        ['Preparation', 'IR plan and policy, contacts, tooling, logging, backups, training, tabletop exercises, a retainer with specialists'],
        ['Detection and analysis', 'Alerts and reports, triage, scoping, severity rating, timeline, evidence collection'],
        ['Containment, eradication, recovery', 'Isolate affected systems, remove attacker access and malware, fix the root cause, restore from clean backups, heightened monitoring'],
        ['Post-incident activity', 'Lessons learned, report, update controls and playbooks, metrics']
      ]
    },
    {
      h: '2. Incident types, severity and roles',
      t: 'Not every incident is the same, and not every incident is an emergency. A phishing email that nobody clicked is very different from ransomware on 200 servers. Teams classify incidents by type and rate their severity, so the response matches the danger. A hospital does the same: a cut finger and a heart attack are both treated, but not by the same team at the same speed.\n\nSeverity combines scope (how many systems and users), data sensitivity, business impact and attacker progress. One infected laptop with no sensitive data might be Low. The same malware on the payroll server, with signs that the attacker is moving to other machines, is Critical. Many teams use a simple scale such as Low, Medium, High and Critical, with a response time attached to each level.\n\nRoles must be clear before anything happens. The incident commander runs the response and makes decisions. Analysts investigate. Communications handles messages to staff and customers. Legal checks reporting duties. HR joins when an employee is involved. Executives approve major business decisions, and IT operations carries out the technical changes.\n\nDecide in advance who may shut systems down, notify customers, and contact law enforcement or regulators. In the middle of a crisis, nobody should be asking "am I allowed to unplug this server?"',
      b: [
        'Common types: phishing and account takeover, ransomware, malware, data breach, insider misuse, denial of service, web application compromise, cloud misconfiguration abuse.',
        'Roles: incident commander, analysts, communications, legal, HR, executives and IT operations.'
      ]
    },
    {
      h: '3. Evidence collection and handling',
      t: 'Digital evidence is easy to damage. Simply opening a file can change its last-access time, and switching off a computer erases everything in memory. So forensics follows a careful process. It is like a police team at a crime scene: they photograph and bag items before anyone touches them.\n\nThe forensic process is identify → preserve → collect → examine → analyze → report. Identify which devices and data matter. Preserve them so they do not change, for example by cutting a laptop off the network instead of switching it off. Collect copies with proper tools. Examine and analyze the copies, never the original, and then report what you found.\n\nCollect in order of volatility, as the table shows: the shortest-lived data first. CPU registers and cache are gone in nanoseconds, RAM is lost at power-off and network state changes constantly. Disk is persistent but can be overwritten, remote logs are rotated over time, and backups and archives are the most stable. That is why a responder captures memory before pulling the power cable.\n\nThe working rules: minimize changes to the original evidence, work on forensic copies, hash everything, document every action with date, time and person, and keep evidence secure. Above all, be able to explain and repeat your process. In court or in a management review, "I clicked around and found it" is not good enough.',
      table: [
        ['Order', 'Evidence', 'Why first'],
        ['1', 'CPU registers and cache', 'Gone in nanoseconds'],
        ['2', 'RAM: processes, network connections, keys', 'Lost at power-off'],
        ['3', 'Network state and routing tables', 'Changes constantly'],
        ['4', 'Running processes and temporary files', 'Change as the system runs'],
        ['5', 'Disk', 'Persistent but can be overwritten'],
        ['6', 'Remote logs and monitoring data', 'Rotated over time'],
        ['7', 'Backups and archives', 'Most stable']
      ]
    },
    {
      h: '4. Chain of custody and hash verification',
      t: 'Chain of custody is the written history of a piece of evidence: where it has been and who has held it since it was collected. If that history has gaps, anyone can claim the evidence was swapped or altered. It is like a courier tracking page that shows every hand-off of a parcel, from pickup to delivery.\n\nA chain-of-custody record lists each item (with a description and serial number), its hash, and every transfer: who handed it to whom, when, where and why. A single entry might read: "Laptop, serial LAB-0042, SHA-256 recorded; handed by R. Kumar to S. Iyer, 26 Nov, 14:05, IR lab, for imaging."\n\nA hash is a fixed-length fingerprint of data. SHA-256 produces a 64-character hex value, and changing even one byte of a file gives a completely different hash. The code shows the method. It records the SHA-256 of each file at collection, then edits auth.log to simulate tampering. When it checks again, invoice.pdf shows OK and auth.log shows MISMATCH. Matching hashes prove the evidence is unchanged; a mismatch proves something changed.\n\nRecord the hash at the moment of collection, not hours later. A hash taken after the file has been copied around proves nothing about its original state. Prefer SHA-256 over MD5, which is no longer collision-resistant.',
      code: 'import hashlib, pathlib, tempfile\n\nlab = pathlib.Path(tempfile.mkdtemp())\n(lab / "invoice.pdf").write_bytes(b"%PDF lab sample")\n(lab / "auth.log").write_text("Failed password for root from 203.0.113.7\\n")\n\ndef sha256(p):\n    return hashlib.sha256(p.read_bytes()).hexdigest()\n\nacquired = {p.name: sha256(p) for p in lab.iterdir()}   # hashes recorded at collection\n\n(lab / "auth.log").write_text("log edited later\\n")       # simulate tampering\n\nfor name, original in acquired.items():\n    status = "OK" if sha256(lab / name) == original else "MISMATCH - evidence changed!"\n    print(f"{name:12} {status}")',
      lang: 'python'
    },
    {
      h: '5. Forensic analysis areas and tools',
      t: 'Forensics is not one skill. Different kinds of evidence need different methods and tools, and the table groups them into areas: disk, memory, logs, network, email, cloud and mobile. Think of a detective who checks CCTV footage, phone records and fingerprints separately, then puts the whole story together.\n\nDisk forensics examines file system metadata, deleted files, the registry, browser history, prefetch files and logs, using tools such as Autopsy with The Sleuth Kit, FTK Imager and Eric Zimmerman’s tools. Prefetch, for example, shows which programs ran on a Windows machine and when. Memory forensics looks at running processes, network connections, injected code and credentials in memory, with Volatility 3 and Magnet RAM Capture.\n\nLog analysis covers authentication, process, application and cloud events, through SIEM queries or tools such as Chainsaw, Hayabusa and grep. Network forensics uses packet captures, flow data and DNS and proxy logs, with Wireshark, Zeek and NetworkMiner. Email forensics checks headers, attachments and link targets. Cloud forensics relies on audit logs such as AWS CloudTrail, because you usually cannot image the provider’s hardware. Mobile forensics needs specialist suites and legal authority.\n\nUse these tools only on lab or authorized data. Taking an image of a friend’s phone "to practice" is a privacy violation. Public datasets such as Digital Corpora give you realistic images to learn on safely.',
      table: [
        ['Area', 'What you examine', 'Common tools'],
        ['Disk', 'File system metadata, deleted files, registry, browser history, prefetch, logs', 'Autopsy / Sleuth Kit, FTK Imager, Eric Zimmerman tools'],
        ['Memory', 'Running processes, network connections, injected code, credentials in memory', 'Volatility 3, Magnet RAM Capture'],
        ['Logs', 'Authentication, process, application and cloud events', 'SIEM queries, Chainsaw, Hayabusa, grep'],
        ['Network', 'Packet captures, flow data, DNS and proxy logs', 'Wireshark, Zeek, NetworkMiner'],
        ['Email', 'Headers, attachments, link targets', 'Header analyzers, sandboxes'],
        ['Cloud', 'Audit logs, snapshots, IAM changes', 'CloudTrail, Azure Activity Log, native tools'],
        ['Mobile', 'App data, messages, location', 'Specialist suites; legal authority required']
      ]
    },
    {
      h: '6. Imaging and timelines',
      t: 'A forensic image is a bit-for-bit copy of storage. It copies every sector, including empty space and deleted files, not just the files you can see. It is made through a write blocker and verified with hashes of the source and the image. A write blocker lets the computer read a drive but never write to it, like a photocopier that cannot change the original page.\n\nThe code shows a lab example on a USB stick you own. dd reads the whole device /dev/sdb and writes it to usb.img in 4 MB blocks, showing progress. conv=noerror,sync keeps going past unreadable blocks and pads them with zeros. Then sha256sum hashes both the device and the image, and both hashes must match. The same block also runs Volatility 3 on a training memory image, listing processes with windows.pslist and network connections with windows.netscan.\n\nAnalysts then build a timeline that merges file times, logs and events to reconstruct the order of actions. A timeline might show: 09:02 phishing email opened, 09:03 file saved to Downloads, 09:04 new process started, 09:10 connection to an unknown IP. Read in order, the story becomes clear.\n\nWatch out for time zones, clock drift and anti-forensic tampering. Indian servers may log in IST (UTC+5:30), cloud services in UTC, and a laptop’s clock may run three minutes fast. An attacker may also change file timestamps on purpose. Normalize everything to UTC before you compare.',
      code: '# image a USB stick you own (Linux), then verify\nsudo dd if=/dev/sdb of=usb.img bs=4M status=progress conv=noerror,sync\nsha256sum /dev/sdb usb.img          # both hashes must match\n\n# memory triage with Volatility 3 on a training image\nvol -f memory.raw windows.pslist\nvol -f memory.raw windows.netscan'
    },
    {
      h: '7. Containment, eradication and recovery',
      t: 'Once you know what is happening, you must stop it getting worse, remove the attacker and get the business running again. These are three separate steps: containment, eradication and recovery. The first rule: preserve evidence before wiping anything. If you reinstall a server straight away, you also erase the clues that show how the attacker got in.\n\nContainment is like closing the fire doors in a building so the fire cannot spread. Isolate hosts from the network, but do not power them off, because that loses memory. Disable compromised accounts, block malicious IPs and domains, and revoke tokens. Most EDR tools can isolate a laptop with one click while still letting the responder connect to it.\n\nEradication removes the attacker completely: the malware, persistence such as scheduled tasks, and the entry point, which must be patched. Reset credentials, including service accounts and keys. If you cannot be sure a system is clean, rebuild it. Recovery then restores from known-good backups, validates systems, monitors closely in case the attacker returns, and keeps people informed about the status.\n\nRansomware needs extra care. Keep offline, tested backups, because attackers try to encrypt or delete online ones first. Involve legal and law enforcement. Paying does not guarantee recovery and can carry legal risk, for example if the group is under sanctions.',
      b: [
        'Contain: isolate hosts from the network (do not power off: that loses memory), disable compromised accounts, block malicious IPs and domains, revoke tokens.',
        'Eradicate: remove malware and persistence, patch the entry point, reset credentials (including service accounts and keys), and rebuild when integrity is uncertain.',
        'Recover: restore from known-good backups, validate systems, monitor closely and communicate status.',
        'Ransomware: keep offline, tested backups; involve legal and law enforcement. Paying does not guarantee recovery and can carry legal risk.'
      ]
    },
    {
      h: '8. Reporting, legal duties and lessons learned',
      t: 'When the incident is over, the work is not. The organization must explain what happened, meet its legal duties and learn from the event so it does not happen again. It is like the inquiry report after a railway accident: the facts, the causes and what will change.\n\nWrite for two audiences: an executive summary and a technical appendix with a timeline and IOCs (indicators of compromise, such as malicious IPs, domains and file hashes). The summary says in plain words what happened, what was affected and what is being done. The appendix lets other teams check their own systems for the same IOCs.\n\nBreach-notification laws can impose strict deadlines. CERT-In requires certain incidents in India to be reported within 6 hours of noticing them, and GDPR has a 72-hour rule for personal-data breaches. Always check current requirements with legal counsel, because rules change. Avoid speculation in writing: an email saying "the attacker probably stole everything" can cause panic and legal trouble if it later proves false.\n\nWithin two weeks, hold a blameless review: what happened, what worked, what failed and what will change. Blameless means the goal is to fix systems, not to punish the person who clicked the link, so people speak honestly. Track the actions to completion and update the IR plan and detections.'
    }
  ],
  lab: {
    title: 'Hands-on Lab 10: evidence drill, memory triage and a tabletop',
    steps: [
      ['Create a folder of sample files, hash them, change one file and re-verify.', '# Linux\nsha256sum evidence/* > evidence.sha256\nsha256sum -c evidence.sha256\n# PowerShell\nGet-FileHash .\\evidence\\* -Algorithm SHA256', 'sha256sum -c prints OK for unchanged files and FAILED for the changed one. Then fill in a chain-of-custody form for the folder.'],
      ['Image a small USB stick you own with FTK Imager or dd, hash the source and the image, and compare.', null, 'Matching hashes prove a faithful copy. Analyze the image, never the original.'],
      ['Download a public memory image from a training dataset and list processes with Volatility 3; find the suspicious one.', 'vol -f sample.mem windows.pslist\nvol -f sample.mem windows.pstree\nvol -f sample.mem windows.netscan', 'Look for misspelled system names, odd parents (Word starting PowerShell) and connections to unusual IPs.'],
      ['Run a ransomware tabletop with classmates: who is called, what is isolated first, who decides about notifications? Write the timeline and decisions.', null, 'Tabletops expose gaps such as “nobody knows where the offline backups are” before a real incident does.']
    ]
  },
  examples: [
    {
      title: 'Building a merged timeline',
      lang: 'python',
      code: 'from datetime import datetime\n\nevents = [\n    ("2026-11-20 09:14:02", "email",    "Phishing email delivered to asha@corp.example"),\n    ("2026-11-20 09:16:40", "endpoint", "invoice.pdf.exe executed by asha on laptop-22"),\n    ("2026-11-20 09:17:05", "network",  "laptop-22 connects to 198.51.100.44:443"),\n    ("2026-11-20 09:31:12", "identity", "4625 x6 then 4624 for svc-backup on fs01"),\n    ("2026-11-20 10:02:55", "endpoint", "Mass file renames on fs01 (.locked)"),\n]\n\nfor ts, source, what in sorted(events, key=lambda e: datetime.fromisoformat(e[0])):\n    print(f"{ts}  [{source:8}] {what}")',
      explanation: 'A timeline merges sources into one story: delivery, execution, command and control, credential abuse, then impact. Real tools (Plaso, Timesketch, forensic suites) merge millions of events the same way, so keep every source in UTC.'
    }
  ],
  best: [
    'Prepare: a written IR plan, contacts, decision owners, logging and offline, tested backups.',
    'Collect volatile evidence first and analyze copies, never originals.',
    'Hash every piece of evidence and keep a chain-of-custody record.',
    'Isolate instead of powering off, so memory evidence survives.',
    'Rebuild systems when their integrity is uncertain, and reset every exposed credential.',
    'Hold a blameless lessons-learned review and track the actions to completion.'
  ],
  mistakes: [
    'Pulling the power plug first and losing the memory evidence.',
    'Wiping and reinstalling before scoping, so the root cause is never found.',
    'Working directly on the original disk instead of a verified image.',
    'Forgetting service accounts and API keys when resetting credentials.',
    'Missing legal notification deadlines because nobody owned the decision.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Why is pulling the power plug often the wrong first step on a suspected compromised server?\n2. Explain the order of volatility and put six data types in order.\n3. What does a write blocker do and why is it needed?\n4. Write the first five lines of a chain-of-custody record for a seized laptop.\n5. A server was encrypted by ransomware and the backups are encrypted too. What preparation would have helped?\n6. Draft a 150-word executive summary of a phishing incident that compromised one mailbox.'
  },
  mini: {
    title: 'Mini project: a full simulated incident report',
    objective: 'Investigate a lab VM image and logs and report like a professional responder.',
    requirements: [
      'Timeline, root cause, scope and IOCs.',
      'Containment and recovery actions.',
      'An evidence list with hashes and a chain-of-custody form.',
      'A lessons-learned section and a one-page executive brief.'
    ],
    deliverable: 'An IR report following the structure in this module.'
  },
  takeaways: [
    'IR is a repeatable lifecycle; preparation decides how well you respond.',
    'Evidence must be preserved, hashed and tracked with a chain of custody.',
    'Collect volatile data first; analyze copies, not originals.',
    'Contain without destroying evidence, then eradicate and recover.',
    'Learn and improve after every incident.'
  ],
  quickRef: [
    'NIST: Prepare → Detect & Analyze → Contain/Eradicate/Recover → Post-incident',
    'Volatility: CPU → RAM → network → processes → disk → logs → backups',
    'Evidence: hash · copy · document · secure · repeatable',
    'vol -f mem.raw windows.pslist / pstree / netscan',
    'CERT-In 6 hours · GDPR 72 hours (check current rules)'
  ],
  refs: [
    ['NIST SP 800-61: Computer Security Incident Handling Guide', 'https://csrc.nist.gov/pubs/sp/800/61/r3/final'],
    ['NIST SP 800-86: Integrating Forensic Techniques into Incident Response', 'https://csrc.nist.gov/pubs/sp/800/86/final'],
    ['RFC 3227: Guidelines for Evidence Collection and Archiving', 'https://www.rfc-editor.org/rfc/rfc3227'],
    ['Volatility Foundation', 'https://volatilityfoundation.org/'],
    ['NIST CFReDS datasets', 'https://cfreds.nist.gov/']
  ],
  quiz: [
    ['Which should be collected first?', ['Hard drive', 'RAM contents', 'Backups', 'Printed logs'], 1, 'RAM is the most volatile of these.'],
    ['What proves evidence was unchanged?', ['A password', 'Matching cryptographic hashes', 'A screenshot', 'A filename'], 1, 'Matching hashes show the data is identical.'],
    ['Which NIST phase includes lessons learned?', ['Preparation', 'Post-incident activity', 'Detection', 'Containment'], 1, 'Post-incident activity includes the lessons-learned review.'],
    ['A write blocker:', ['Speeds up imaging', 'Prevents changes to the source media', 'Encrypts evidence', 'Deletes malware'], 1, 'It stops any writes to the original media.'],
    ['Containing an infected host usually means:', ['Wiping it immediately', 'Isolating it from the network while preserving evidence', 'Ignoring it', 'Changing the logo'], 1, 'Isolate and preserve before eradication.']
  ],

  skills: ['Follow the NIST IR lifecycle', 'Apply the order of volatility', 'Keep a chain of custody', 'Build an incident timeline', 'Plan containment and recovery'],
  prereq: ['Module 03 (logs and Event IDs)', 'Module 05 (hashes)', 'Module 09 (triage)'],
  analogy: 'A crime scene: first responders secure the area (containment) without trampling footprints (evidence); investigators photograph and bag everything with labels and signatures (chain of custody); fragile evidence such as footprints in rain is collected first (order of volatility); and the case report must let a court follow every step.',
  why: 'Every organization will have incidents. The difference between a contained event and a disaster is preparation, calm process and trustworthy evidence, which also protects the company legally.',
  workflow: {
    title: 'First hours of a ransomware incident',
    nodes: [
      ['detect', 'Detect', 'Alert or user report', 'Mass file renames', 'Declared incident', 'An EDR alert or a user reporting “.locked” files starts the clock. Declare an incident and name an incident commander.'],
      ['scope', 'Scope', 'Which hosts and accounts?', 'Alerts, logs', 'Affected list', 'Use EDR, SIEM and identity logs to list affected hosts, accounts and the likely entry point. Scope drives every later decision.'],
      ['preserve', 'Preserve', 'Volatile evidence first', 'Affected hosts', 'Memory images, logs', 'Capture memory and key logs from representative hosts before isolation changes them, and record hashes and custody.'],
      ['contain', 'Contain', 'Isolate, disable, block', 'Affected list', 'Spread stopped', 'Isolate hosts with EDR or switch ports, disable compromised accounts, block command-and-control IPs and domains, and protect backups.'],
      ['eradicate', 'Eradicate and recover', 'Clean, patch, restore', 'Contained environment', 'Clean systems', 'Remove persistence, patch the entry point, reset credentials, rebuild where needed and restore from offline backups, then monitor closely.'],
      ['learn', 'Report and learn', 'Notify, review, improve', 'Timeline and evidence', 'Report and actions', 'Meet legal deadlines (CERT-In, GDPR), brief executives, and hold a blameless review that updates the plan and detections.']
    ],
    explanation: 'Evidence is preserved before containment changes the systems, and containment comes before cleanup.'
  },
  caseStudy: {
    title: 'Colonial Pipeline ransomware (2021)',
    problem: 'Ransomware hit the IT network of a major US fuel pipeline operator; reports indicated a compromised VPN account without MFA.',
    data: 'VPN logs, IT network telemetry, the separation between IT and operational technology.',
    steps: ['Attackers gained access through a VPN account.', 'Ransomware affected IT systems.', 'The operator proactively shut down pipeline operations as a containment measure while it investigated.', 'Fuel supply was disrupted for days in parts of the US.'],
    result: 'The case shows the trade-off between containment and availability, and the value of segmenting IT from operational technology and enforcing MFA.',
    limitations: 'Simplified summary; read primary sources for details.'
  },
  exercises: [
    { title: 'Order of volatility', objective: 'Prioritize collection.', problem: 'Which should you collect first from a live compromised server?', options: ['The disk image', 'RAM (running processes and connections)', 'Last month’s backups', 'Printed policies'], answer: 1, hints: ['What disappears at power-off?'], solution: ['RAM is lost when the machine stops.', 'Disk and backups persist.'], explanation: 'Collect the most volatile evidence first.' },
    { title: 'Isolate or power off?', objective: 'Contain without destroying evidence.', problem: 'An EDR alert shows ransomware starting on one laptop. What is the best first containment step?', options: ['Pull the power plug', 'Isolate it from the network with the EDR, keeping it powered on', 'Reinstall Windows immediately', 'Email the attacker'], answer: 1, hints: ['Stop the spread but keep the memory.'], solution: ['Network isolation stops spread.', 'Keeping power preserves memory evidence.'], explanation: 'Wiping comes after scoping and evidence collection.' },
    { title: 'GDPR deadline', objective: 'Know notification rules.', problem: 'Under GDPR, how many hours does an organization generally have to notify the regulator of a personal-data breach after becoming aware of it?', answer: 72, hints: ['Three days.'], solution: ['GDPR Article 33: 72 hours.'], explanation: 'India’s CERT-In rules for certain incidents are much shorter (6 hours). Always confirm with legal counsel.' },
    { type: 'Short answer', title: 'Name the record', objective: 'Use DFIR vocabulary.', problem: 'What is the record called that lists who handled a piece of evidence, when and why? (three words)', accept: ['chain of custody'], hints: ['It keeps evidence admissible.'], solution: ['Chain of custody.'], explanation: 'Gaps in the chain can make evidence unusable in court.' }
  ],
  checks: [
    ['Why work on a forensic image instead of the original disk?', ['Images are faster', 'To avoid changing the original evidence', 'Originals cannot be read', 'It is cheaper'], 1, 'Analysis must not alter the source.'],
    ['What is a tabletop exercise?', ['A physical attack', 'A discussion-based rehearsal of an incident', 'A type of malware', 'A backup method'], 1, 'It tests the plan and people before a real incident.'],
    ['Why normalize timestamps to UTC in a timeline?', ['UTC is more secure', 'Sources use different time zones and clocks drift', 'Logs require it', 'It saves space'], 1, 'Mixed time zones produce a false order of events.']
  ],
  cheat: ['Prepare · Detect · Contain · Eradicate · Recover · Learn', 'RAM before disk', 'Hash, copy, document, secure', 'Isolate, don’t power off', 'Blameless review in 2 weeks'],
  next: 'Module 11 goes deeper into the malware found during incidents, and into threat intelligence that helps you see it coming.'
};
