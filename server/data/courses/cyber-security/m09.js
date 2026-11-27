export default {
  n: 9,
  title: 'SOC Operations & Blue Team Security',
  description: 'What a SOC does, roles and tiers, log sources, SIEM, SOAR and EDR, a working brute-force detection rule, alert triage and true vs false positives, MITRE ATT&CK and the Pyramid of Pain, threat hunting, and SOC metrics such as MTTD and MTTR.',
  intro: 'A Security Operations Center (SOC) watches an organization’s systems around the clock, detects attacks and coordinates the first response. It is like the CCTV control room at a big railway station, where staff watch many screens and send help the moment something looks wrong.\n\nThe blue team is the wider defensive function around it: detection engineers, threat hunters, incident responders and the people who keep the logging pipeline healthy. SOC analyst is one of the most common first jobs in cyber security, so this module stays very practical.\n\nIn this module you follow an event from a log source into a SIEM, write a real detection rule, triage alerts like a Tier 1 analyst, map detections to MITRE ATT&CK, and run a hypothesis-driven threat hunt. The examples use reserved documentation IP addresses, and every lab runs in your own environment.',
  objectives: [
    'Describe SOC roles, tiers, tools and workflows.',
    'Explain log sources, SIEM correlation and detection rules.',
    'Triage alerts and decide true positive vs false positive.',
    'Use MITRE ATT&CK and the Pyramid of Pain to design detections.',
    'Run a basic threat hunt and measure SOC performance.'
  ],
  terms: [
    ['SOC', 'Security Operations Center: the team that monitors, detects and starts the response to attacks.'],
    ['Tier 1 / 2 / 3', 'Alert triage / deeper investigation and response / threat hunting, engineering and escalation experts.'],
    ['SIEM', 'Security Information and Event Management: collects, normalizes, stores and correlates logs and raises alerts.'],
    ['SOAR', 'Security Orchestration, Automation and Response: automates repetitive response steps with playbooks.'],
    ['EDR / XDR', 'Endpoint (and extended, cross-domain) detection and response.'],
    ['Correlation rule', 'Logic that links events, such as 5 failed logins then a success from the same IP.'],
    ['True / false positive', 'A real malicious event correctly flagged / benign activity wrongly flagged.'],
    ['False negative', 'A missed attack: the most dangerous outcome, and the reason hunting exists.'],
    ['MITRE ATT&CK', 'A knowledge base of adversary tactics (the why) and techniques (the how).'],
    ['TTPs', 'Tactics, techniques and procedures: attacker behavior.'],
    ['Pyramid of Pain', 'A model showing that detecting behavior (TTPs) hurts attackers far more than blocking a hash or IP.'],
    ['Sigma', 'A vendor-neutral format for writing detection rules that convert to SPL, KQL and others.'],
    ['MTTD / MTTR', 'Mean time to detect / mean time to respond (or recover).']
  ],
  diagramTitle: 'From log source to response',
  ascii: '  LOG SOURCES                     SIEM                         SOC\n  identity (AD, SSO) ----+                                   Tier 1: triage\n  endpoints (EDR, Sysmon)+--> collect -> normalize ->        Tier 2: investigate\n  network (FW, DNS, proxy)    store -> correlate --> ALERT -> Tier 3: hunt/engineer\n  cloud (CloudTrail...)  |         rules (Sigma/SPL/KQL)        |\n  apps & email ----------+                                     v\n                                     SOAR playbooks  <-- enrich, contain, ticket\n                                            |\n                                            v\n                          incident response (Module 10)  ->  lessons -> new rules',
  diagramExplain: 'Logs from identity, endpoints, network, cloud and applications flow into the SIEM, where correlation rules raise alerts. Analysts triage and escalate, SOAR automates repeatable steps, confirmed incidents go to incident response, and lessons learned become new or better detections.',
  sections: [
    {
      h: '1. What a SOC does',
      t: 'A SOC combines people, process and technology. People are the analysts and engineers. Process is the written playbooks that say what to do with each kind of alert. Technology is the SIEM, EDR and other tools that collect data and raise alerts. Remove any one and the SOC fails, like a hospital emergency ward with doctors but no equipment, or equipment but no procedures.\n\nAnalysts are usually organized in tiers, with escalation from Tier 1 triage to Tier 2 investigation and Tier 3 experts. Tier 1 handles the stream of new alerts and decides which ones are real. Tier 2 takes confirmed cases, works out how far they spread and starts the response. Tier 3 handles the hardest cases, such as advanced malware, and often does threat hunting and detection engineering.\n\nHere is a typical flow. At 2:10 a.m. an alert says a staff account logged in from an unusual country. Tier 1 checks the details, finds no travel record for the employee and escalates. Tier 2 finds that the account also created an email forwarding rule, so it disables the account and ends its sessions. Tier 3 then studies how the attacker got the password.\n\nThe table lists the main SOC functions, from monitoring to detection engineering. Smaller organizations often hire a managed SOC provider instead of running their own.',
      table: [
        ['Function', 'Description'],
        ['Monitoring and detection', 'Watch alerts and dashboards across systems'],
        ['Triage and analysis', 'Decide what is real and how serious it is'],
        ['Incident response', 'Contain, eradicate and recover (Module 10)'],
        ['Threat intelligence', 'Use external and internal intel to improve detection'],
        ['Threat hunting', 'Proactively search for threats that evaded alerts'],
        ['Detection engineering', 'Write and tune rules and playbooks'],
        ['Reporting', 'Metrics, trends and lessons learned']
      ]
    },
    {
      h: '2. Logging, SIEM and the alert pipeline',
      t: 'Good logging is the foundation of detection: you cannot detect what you do not record. A log is a timestamped line saying that something happened, such as a login, a file change or a blocked connection. It is like the visitor register at an apartment gate. If the guard never writes down who entered, nobody can later find out who visited flat 304.\n\nLogs come from many sources, as the table shows: identity systems, endpoints, network devices, cloud platforms and applications. A SIEM (security information and event management) system collects them in one place. The pipeline works in steps: collect the logs, parse them into fields such as user, source IP and time, normalize the field names so different sources match, store them, and run detection rules that raise alerts.\n\nFor example, a failed SSH login on a Linux server writes a line to /var/log/auth.log. An agent forwards it to the SIEM, which pulls out the username and source IP. If many such events arrive from one IP, a rule raises an alert, and an analyst sees it on the dashboard.\n\nCommon SIEMs include Splunk, Microsoft Sentinel, Elastic Security, Wazuh and QRadar. Wazuh and Elastic are free to start with, so they suit a home lab. A common mistake is collecting everything without checking quality: clocks out of sync or missing fields make good rules fail.',
      table: [
        ['Log source', 'Useful events'],
        ['Identity (AD, Entra ID, SSO)', 'Logons, MFA failures, privilege changes'],
        ['Endpoints (EDR, Sysmon, auditd)', 'Process creation, file and registry changes, network connections'],
        ['Network (firewall, DNS, proxy, NetFlow)', 'Blocked traffic, rare destinations, DNS lookups'],
        ['Cloud (CloudTrail, Azure Activity, GCP Audit)', 'API calls, role changes, storage access'],
        ['Applications and email', 'Errors, admin actions, phishing reports']
      ]
    },
    {
      h: '3. Detection engineering: a working rule',
      t: 'A detection rule is a small piece of logic that turns raw logs into an alert. Each rule answers one question, such as "is someone guessing passwords?" It is like a bank blocking your card after several wrong PIN attempts in a short time.\n\nThis rule flags repeated failed SSH logins and escalates to HIGH when a success follows the failures: the logic behind many SIEM correlation searches. The Python code reads each log line and uses regular expressions to pull out the username and source IP from "Failed password" and "Accepted password" lines. It keeps a list of failures for each IP. On the third failure from one IP it raises a MEDIUM alert. If that IP later logs in successfully, it raises a HIGH alert, because a guess may have worked.\n\nIn the sample log, 203.0.113.7 fails as root, admin and asha within a few seconds. Many usernames from one address point to automated guessing, not to a user who forgot a password. Then asha logs in successfully from the same IP, so the rule raises HIGH, and an analyst should check that account at once. Meena’s login from 192.0.2.15 raises nothing, because there were no failures before it.\n\nIn a SIEM the same idea is written in SPL, KQL or Sigma, for example: event = failed logon, group by source IP, count >= 5 in 5 minutes. Sigma is a vendor-neutral format that can be converted for Splunk or Sentinel. Test every rule on sample data, so you know it fires when it should and stays quiet when it should not.',
      code: 'import re\nfrom collections import defaultdict\n\nlog = """Nov 26 09:00:01 web sshd: Failed password for root from 203.0.113.7\nNov 26 09:00:03 web sshd: Failed password for admin from 203.0.113.7\nNov 26 09:00:05 web sshd: Failed password for asha from 203.0.113.7\nNov 26 09:00:09 web sshd: Failed password for ravi from 198.51.100.4\nNov 26 09:00:12 web sshd: Accepted password for asha from 203.0.113.7\nNov 26 09:01:30 web sshd: Accepted password for meena from 192.0.2.15"""\n\nFAIL = re.compile(r"Failed password for (\\S+) from (\\S+)")\nOK = re.compile(r"Accepted password for (\\S+) from (\\S+)")\nfails = defaultdict(list)\nalerts = []\n\nfor line in log.splitlines():\n    if m := FAIL.search(line):\n        user, ip = m.groups()\n        fails[ip].append(user)\n        if len(fails[ip]) == 3:\n            alerts.append(("MEDIUM", ip, "3+ failed logins (possible brute force)"))\n    elif m := OK.search(line):\n        user, ip = m.groups()\n        if len(fails.get(ip, [])) >= 3:\n            alerts.append(("HIGH", ip, f"success for {user} AFTER many failures"))\n\nfor sev, ip, why in alerts:\n    print(f"[{sev}] {ip:<14} {why}")\nprint("users targeted by 203.0.113.7:", sorted(set(fails["203.0.113.7"])))',
      lang: 'python'
    },
    {
      h: '4. Alert triage',
      t: 'Triage decides what is real and how serious it is. The word comes from hospital emergency wards, where a nurse quickly sorts patients so the most urgent cases see a doctor first. In a SOC, hundreds of alerts can arrive in one shift, and triage makes sure the real attack is not buried under noise.\n\nFor each alert, the analyst works through the questions in the table. What triggered it, and is the rule reliable? Which asset or user is involved? Is the behavior normal for this user or system? Is the IP, domain or hash known bad according to threat intel such as VirusTotal or AbuseIPDB? The answers lead to a verdict.\n\nA true positive is real malicious or policy-violating activity, so you escalate or respond. A false positive is benign activity that was flagged, such as an IT admin running a normal script. Close it with a reason and tune the rule; do not just ignore it, or the same noise will return tomorrow. A false negative is a missed attack, which is the reason threat hunting exists.\n\nRecord every decision in a ticket with timestamps, evidence and reasoning. A note like "closed, FP" helps nobody. "Closed as false positive: login from 198.51.100.20 is the company VPN exit IP, confirmed with IT, rule tuned to exclude it" lets the next analyst trust your work.',
      table: [
        ['Question', 'Why it matters'],
        ['What triggered it, and is the rule reliable?', 'Rules have different false-positive rates'],
        ['Which asset or user is involved?', 'A domain controller is more critical than a test VM'],
        ['Is the behavior normal for this user or system?', 'Baselines separate anomalies from routine'],
        ['Is the IP, domain or hash known bad?', 'Enrich with threat intel (VirusTotal, AbuseIPDB, internal)'],
        ['Are there related alerts?', 'Attacks produce chains of events']
      ],
      b: [
        'True positive: real malicious or policy-violating activity → escalate or respond.',
        'False positive: benign activity flagged → close with a reason and tune the rule; do not just ignore it.',
        'False negative: a missed attack → the reason threat hunting exists.'
      ]
    },
    {
      h: '5. MITRE ATT&CK and the Pyramid of Pain',
      t: 'MITRE ATT&CK is a free public knowledge base of how real attackers behave, built from reports of actual intrusions. MITRE ATT&CK lists adversary tactics (Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, Impact) and the techniques under each. A tactic is the attacker’s goal at that stage; a technique is how they reach it. For example, under Persistence, technique T1053 is Scheduled Task/Job.\n\nSOCs map detections to it to see coverage gaps. You list every rule you have and mark which technique it detects. Like a cricket captain checking the field placement, you quickly see the gaps: you may have many rules for Initial Access and none for Lateral Movement. Those empty cells tell you what to build next.\n\nThe Pyramid of Pain ranks indicators by how hard they are for attackers to change: hashes (trivial), IP addresses (easy), domains (simple), network and host artifacts (annoying), tools (challenging) and TTPs (tough). TTPs means tactics, techniques and procedures. An attacker can change one byte of a malware file and get a new hash in seconds, or rent a new server for a new IP. Changing how they work takes real effort.\n\nThat is why detecting behavior hurts attackers most. A rule that blocks one hash stops one file. A rule that catches "an Office document starting PowerShell" catches many campaigns, whatever file or IP they use.'
    },
    {
      h: '6. Threat hunting',
      t: 'Alerts only fire for things someone already wrote a rule for. Threat hunting looks for attackers who slipped past those rules. Hunting is proactive and hypothesis-driven: you start with an idea of what an attacker might be doing, then search the data to prove or disprove it. It is like a hostel warden who does not wait for complaints, but checks one floor on a hunch after noticing something odd.\n\nStart with a hypothesis, often taken from ATT&CK or a threat report. Example hypothesis: "attackers may use scheduled tasks for persistence." On Windows, creating a scheduled task writes event ID 4698 to the Security log when that auditing is turned on, and Sysmon can record the processes that tasks start.\n\nQuery task-creation logs, look for rare names, unusual accounts and odd paths, and investigate anything strange. A task named GoogleUpdateTaskMachine running from C:\\Program Files is normal on many machines. A task named "upd", created by a finance user and running a file from C:\\Users\\Public at 3 a.m., deserves a closer look.\n\nThen turn confirmed patterns into automated detections, so you never have to hunt for the same thing by hand again. The loop is: hypothesis → data → investigate → findings → new detection. Even a hunt that finds nothing is useful, because it often shows which logs are missing.'
    },
    {
      h: '7. Blue-team metrics',
      t: 'Measure what improves defense, and watch analyst workload. Metrics tell a SOC whether it is getting better or just getting busier. Without them, a team can work hard every night and still not know whether attackers are being caught faster. It is like a cricket team that tracks not only runs scored but also catches dropped.\n\nThe table lists the core metrics. MTTD, mean time to detect, is the average time from the start of an attack to the moment the SOC notices it. MTTR or MTTC, mean time to respond or contain, measures how quickly the team stops it. The false-positive rate is the share of alerts that turned out to be benign. Coverage counts the ATT&CK techniques with working detections. Alert volume per analyst is an indicator of burnout and quality.\n\nFor example, if MTTD falls from 6 hours to 40 minutes after adding endpoint logs, that investment paid off. If the false-positive rate is 90 percent, analysts spend most of each shift on noise, and the rules need tuning.\n\nA common mistake is chasing a number for its own sake. Closing tickets quickly looks good on a chart, but if analysts close real attacks as false positives to hit a target, the metric is hiding risk. Use metrics to ask better questions, not to punish people.',
      table: [
        ['Metric', 'Meaning'],
        ['MTTD', 'Mean time to detect'],
        ['MTTR / MTTC', 'Mean time to respond / contain'],
        ['False-positive rate', 'Share of alerts that were benign'],
        ['Coverage', 'ATT&CK techniques with working detections'],
        ['Alert volume per analyst', 'Burnout and quality indicator']
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 09: a home SIEM and a detection rule',
    steps: [
      ['Install Wazuh (or Elastic) on a VM and add two agents: one Linux, one Windows. Confirm logs arrive.', null, 'Wazuh is free and open source; its all-in-one installer fits on a lab VM with about 8 GB of RAM.'],
      ['Generate failed logins on purpose on the Linux agent.', 'for i in 1 2 3 4 5 6; do ssh wronguser@localhost exit; done', 'Each attempt writes a “Failed password” or “Invalid user” line to auth.log, which the agent ships to the SIEM.'],
      ['Write or enable a rule that alerts after 5 failures in 5 minutes from one source, and confirm it fires.', null, 'Note the rule ID, the fields it groups by and the time window. These are the knobs you tune later.'],
      ['Install Sysmon on the Windows VM with a community configuration, run whoami and ipconfig, and find them as process-creation events (Event ID 1).', null, 'Then write a rule for unusual parent-child pairs, such as winword.exe starting powershell.exe.'],
      ['Write a ticket for one alert: what triggered it, the evidence, your verdict (true or false positive) and the next step.', null, 'Clear tickets are what a shift handover and an audit depend on.']
    ]
  },
  examples: [
    {
      title: 'Alert enrichment and a triage verdict',
      lang: 'python',
      code: 'KNOWN_BAD = {"203.0.113.7": "brute-force source (internal intel)"}\nCRITICAL_ASSETS = {"dc01", "payroll-db"}\n\nalerts = [\n    {"rule": "5 failed logins", "src": "203.0.113.7", "host": "dc01", "user": "administrator"},\n    {"rule": "5 failed logins", "src": "192.0.2.15", "host": "laptop-22", "user": "meena"},\n]\n\nfor a in alerts:\n    intel = KNOWN_BAD.get(a["src"], "no intel match")\n    critical = a["host"] in CRITICAL_ASSETS\n    if a["src"] in KNOWN_BAD and critical:\n        verdict = "ESCALATE to Tier 2 (likely true positive on a critical asset)"\n    elif a["src"] in KNOWN_BAD:\n        verdict = "Investigate: known-bad source"\n    else:\n        verdict = "Check with the user: probably a forgotten password"\n    print(f"{a[\'host\']:10} {a[\'src\']:13} intel={intel!r}\\n  -> {verdict}")',
      explanation: 'Enrichment (threat intel plus asset criticality) turns an identical rule hit into two very different decisions. SOAR platforms automate exactly this lookup so analysts start with context.'
    }
  ],
  best: [
    'Collect identity, endpoint, network and cloud logs centrally, with enough retention.',
    'Write detections for behavior (TTPs), not only hashes and IPs.',
    'Map detections to MITRE ATT&CK to find coverage gaps.',
    'Tune noisy rules instead of ignoring them; document every change.',
    'Use playbooks and SOAR for repeatable steps such as enrichment and phishing triage.',
    'Track MTTD, MTTR and false-positive rate, and protect analysts from alert fatigue.'
  ],
  mistakes: [
    'Collecting logs nobody reviews, or not collecting the ones you need.',
    'Closing false positives without tuning the rule, so they return tomorrow.',
    'Triaging without asset context: treating a domain controller like a test VM.',
    'Relying only on IP and hash blocklists that attackers change in minutes.',
    'Skipping the ticket notes, so the next shift repeats the work.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Extend the detection rule to alert when one IP targets 3 or more different usernames.\n2. Explain the difference between a SIEM, SOAR and EDR.\n3. Map three alerts (failed logins, a new admin user, an unusual outbound connection) to ATT&CK tactics.\n4. Describe how you would tune a rule that creates 200 false positives a day.\n5. Write a hunt hypothesis for stolen cloud credentials and list the logs you need.\n6. Draft a shift handover note after an unresolved incident.'
  },
  mini: {
    title: 'Mini project: design a mini-SOC',
    objective: 'Design and prototype the SOC for a 100-person company.',
    requirements: [
      'Log sources and the SIEM you choose, with reasons.',
      'Ten detection rules mapped to ATT&CK.',
      'A phishing triage playbook and escalation paths.',
      'A shift schedule and five KPIs.',
      'Prototype two rules in a lab SIEM and show test results.'
    ],
    deliverable: 'A design document plus screenshots of the two working rules firing in your lab.'
  },
  takeaways: [
    'A SOC combines people, process and technology.',
    'Good logging is the foundation of detection.',
    'Triage decisions need context, evidence and a written record.',
    'Behavior-based detections (TTPs) are the hardest for attackers to evade.',
    'Hunting and detection engineering continuously close gaps.'
  ],
  quickRef: [
    'SIEM = collect + correlate · SOAR = automate · EDR = endpoint detect + respond',
    'TP = real · FP = benign flagged · FN = missed attack',
    'Pyramid of Pain: hash < IP < domain < artifacts < tools < TTPs',
    'ATT&CK tactics: Initial Access → … → Exfiltration → Impact',
    'MTTD · MTTR · FP rate · ATT&CK coverage'
  ],
  refs: [
    ['MITRE ATT&CK', 'https://attack.mitre.org/'],
    ['Sigma rules project', 'https://github.com/SigmaHQ/sigma'],
    ['NIST SP 800-92: Guide to Computer Security Log Management', 'https://csrc.nist.gov/pubs/sp/800/92/final'],
    ['The Pyramid of Pain (David Bianco)', 'https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html'],
    ['Wazuh documentation', 'https://documentation.wazuh.com/']
  ],
  quiz: [
    ['Which of these is a false positive?', ['Missed ransomware', 'A benign admin script flagged as malicious', 'A real breach', 'A correctly blocked IP'], 1, 'Benign activity flagged as malicious is a false positive.'],
    ['What does SOAR primarily provide?', ['Automation of response workflows', 'Disk encryption', 'Email delivery', 'Patching'], 0, 'SOAR orchestrates and automates response steps.'],
    ['Which is hardest for an attacker to change?', ['File hash', 'IP address', 'Domain name', 'TTPs'], 3, 'Behaviors cost attackers the most to change: the top of the Pyramid of Pain.'],
    ['Threat hunting is:', ['Waiting for alerts', 'Proactive, hypothesis-driven searching', 'Only reading the news', 'Disabling logs'], 1, 'Hunts look for threats that evaded alerts.'],
    ['MTTD stands for:', ['Mean time to detect', 'Maximum time to deploy', 'Minimum threat data', 'Managed team detection'], 0, 'Mean time to detect measures how quickly attacks are noticed.']
  ],

  skills: ['Trace logs into a SIEM', 'Write a correlation rule', 'Triage alerts with context', 'Map detections to ATT&CK', 'Plan a threat hunt'],
  prereq: ['Module 03 (logs and Event IDs)', 'Module 04 (Python and regex)'],
  analogy: 'A SOC is the control room of a metro network. Sensors (logs) report from every station; the screens (SIEM) highlight unusual patterns; operators (analysts) decide which alarms are real; and a playbook says exactly who to call and which gates to close when one is.',
  why: 'Prevention eventually fails. Fast detection and response decide whether an intrusion becomes a minor ticket or a front-page breach, and SOC work is one of the main entry points into the field.',
  workflow: {
    title: 'Triage of one alert',
    nodes: [
      ['alert', 'Alert fires', 'Rule hit in the SIEM', 'Correlated events', 'Alert in the queue', 'For example: 6 failed logins to dc01 from 203.0.113.7 in 2 minutes, followed by a success.'],
      ['context', 'Gather context', 'Asset, user, baseline', 'Alert', 'Who and what', 'dc01 is a domain controller (critical). The user is a privileged account that normally logs in from the office network, never from outside.'],
      ['enrich', 'Enrich', 'Threat intel lookups', 'IPs, domains, hashes', 'Reputation', 'Look up the source IP in internal intel and services such as AbuseIPDB. Check for related alerts from the same IP or user.'],
      ['decide', 'Decide', 'TP, FP or needs more', 'Evidence', 'Verdict', 'Success after many failures, from an unusual location, on a critical asset: a likely true positive.'],
      ['act', 'Act', 'Escalate or close', 'Verdict', 'Incident or tuned rule', 'True positive → escalate to Tier 2 / incident response and start containment (disable the account, block the IP). False positive → close with the reason and tune the rule.'],
      ['record', 'Record', 'Ticket and handover', 'Actions', 'Audit trail', 'Write timestamps, evidence, decisions and next steps so the next shift and the incident report can rely on them.']
    ],
    explanation: 'Context and enrichment turn a raw rule hit into a defensible decision.'
  },
  caseStudy: {
    title: 'Alerts that were not acted on (Target, 2013)',
    problem: 'Security tooling reportedly generated alerts about the intruders’ malware, but the alerts did not lead to timely action.',
    data: 'Malware detection alerts, network logs, the escalation process.',
    steps: ['Attackers entered through a third-party vendor’s credentials.', 'Malware was installed on point-of-sale systems.', 'Security tools raised alerts.', 'Escalation and ownership did not turn the alerts into containment, and card data was stolen.'],
    result: 'Detection without effective triage, escalation and ownership does not protect an organization.',
    limitations: 'Simplified summary; read primary sources for details.'
  },
  exercises: [
    { title: 'Classify the outcome', objective: 'Use triage vocabulary.', problem: 'A backup job copies many files at 2 a.m. every night and triggers a “mass file access” alert. Investigation shows it is the scheduled backup. What is this alert?', options: ['True positive', 'False positive', 'False negative', 'True negative'], answer: 1, hints: ['Was it malicious?'], solution: ['Benign activity was flagged.', 'Close it and tune the rule (for example exclude the backup service account at that time).'], explanation: 'Tuning keeps the queue useful.' },
    { title: 'Pyramid of Pain', objective: 'Rank indicators.', problem: 'Which detection would hurt an attacker the most to evade?', options: ['Blocking one malware hash', 'Blocking one IP address', 'Detecting the technique of dumping credentials from LSASS memory', 'Blocking one domain'], answer: 2, hints: ['Behavior vs artifacts.'], solution: ['Hashes, IPs and domains change in minutes.', 'Changing a technique requires new tooling and tradecraft.'], explanation: 'TTP-based detections sit at the top of the pyramid.' },
    { type: 'Short answer', title: 'Name the ATT&CK tactic', objective: 'Map behavior to ATT&CK.', problem: 'An attacker creates a scheduled task so their malware starts again after every reboot. Which ATT&CK tactic is this? (one word)', accept: ['persistence'], hints: ['They want to stay.'], solution: ['Scheduled tasks for restart are Persistence (T1053).'], explanation: 'Hunt for rare scheduled task names and creators.' },
    { title: 'Compute the false-positive rate', objective: 'Use SOC metrics.', problem: 'Out of 400 alerts this week, 300 were benign. What is the false-positive rate in percent?', answer: 75, hints: ['300 / 400.'], solution: ['300 / 400 = 0.75 = 75%.'], explanation: 'A rate this high causes alert fatigue; tune the noisiest rules first.' }
  ],
  checks: [
    ['Which log would show a new admin user on Windows?', ['Event ID 4720 / 4732', 'DNS logs', 'Web access logs', 'NetFlow'], 0, '4720 = user created, 4732 = added to a security group.'],
    ['What is the main goal of detection engineering?', ['Buying tools', 'Writing and tuning reliable rules and playbooks', 'Deleting logs', 'Patching servers'], 1, 'Engineers turn knowledge of attacks into reliable detections.'],
    ['Why map detections to ATT&CK?', ['To see coverage gaps', 'To encrypt logs', 'To speed up the SIEM', 'It is required by law'], 0, 'Unmapped techniques show where you are blind.']
  ],
  cheat: ['Collect → Normalize → Correlate → Alert → Triage → Respond', 'TP · FP · FN', 'Hash < IP < Domain < Artifacts < Tools < TTPs', 'Sigma → SPL / KQL', 'MTTD · MTTR · FP rate'],
  next: 'Module 10 continues where triage ends: digital forensics and incident response with NIST’s lifecycle and evidence handling.'
};
