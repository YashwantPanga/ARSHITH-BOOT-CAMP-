export default {
  n: 1,
  title: 'Cyber Security Fundamentals',
  description: 'What cyber security is, the CIA Triad, authentication vs authorization, threats, vulnerabilities, risks and exploits, threat actors and the kill chain, attack surface, security controls, ethics and law, security domains and career paths.',
  intro: 'Cyber security is the practice of protecting computers, networks, applications, data and people from digital attacks, damage or unauthorized access. Think of it as the locks, alarms, guards, rules and habits that keep our digital life safe, in the same way a house has doors, locks and a neighborhood watch.\n\nAlmost everything you do touches a digital system: paying with UPI, ordering food, booking a train ticket, attending an online class. Hospital records and the power grid run on computers too. When these systems are attacked, real people lose money, privacy, time and sometimes safety. One shared OTP can empty a bank account, and one ransomware attack can stop a hospital from treating patients.\n\nSecurity is a process, not a product. No tool makes you 100 percent safe. The goal is to make attacks harder, costlier, easier to detect and quicker to recover from. This module gives you the vocabulary and mental models that every later module builds on. You need no prior knowledge: each term is explained in plain language first, then in technical detail.',
  objectives: [
    'Explain what cyber security is and why every organization needs it.',
    'Use the CIA Triad (confidentiality, integrity, availability) to analyze any security problem.',
    'Tell apart threats, vulnerabilities, risks and exploits, and describe how they connect.',
    'Describe who attacks, why they attack, and where they attack (the attack surface).',
    'Classify security controls as preventive, detective, corrective, deterrent or compensating.',
    'Work within ethical and legal boundaries, and map out a cyber security career path.'
  ],
  terms: [
    ['CIA Triad', 'Confidentiality, Integrity and Availability: the three goals every security control protects.'],
    ['Asset', 'Anything of value that needs protection: a customer database, a laptop, a brand’s reputation.'],
    ['Threat', 'Anything that could cause harm to an asset, such as a phishing campaign, a malicious insider or a flood.'],
    ['Vulnerability', 'A weakness a threat can use: an unpatched server, a weak password, a misconfigured cloud bucket.'],
    ['Exploit', 'A method or piece of code that takes advantage of a vulnerability.'],
    ['Risk', 'The chance of loss, usually estimated as likelihood × impact.'],
    ['Zero-day', 'A vulnerability unknown to the vendor, for which no patch exists yet.'],
    ['Attack surface', 'The sum of all points where an unauthorized person could try to enter or extract data.'],
    ['Defense in depth', 'Several layers of controls, so one failure does not mean total failure.'],
    ['Least privilege', 'Giving people and programs only the minimum access they need for their job.'],
    ['APT', 'Advanced Persistent Threat: a skilled, patient, often state-backed attacker.'],
    ['MFA', 'Multi-factor authentication: two or more factor types (know, have, are), so a stolen password alone is not enough.']
  ],
  diagramTitle: 'The security ecosystem and the CIA Triad',
  ascii: '                 +--------------------------------------+\n                 |        THREAT ACTORS & VECTORS        |\n                 |  criminals, APTs, insiders, phishing  |\n                 +------------------+-------------------+\n                                    |\n                                    v\n     +---------------------------------------------------------+\n     |   PEOPLE  (awareness)   PROCESS (policy)   TECHNOLOGY    |\n     |              +-------------------------+                 |\n     |              |   DATA & SYSTEMS        |                 |\n     |              |  C  confidentiality     |                 |\n     |              |  I  integrity           |                 |\n     |              |  A  availability        |                 |\n     |              +-------------------------+                 |\n     +---------------------------------------------------------+\n        Controls: preventive -> detective -> corrective\n        Laws & standards: IT Act 2000, DPDP 2023, ISO 27001, NIST CSF',
  diagramExplain: 'People, process and technology surround the data at the center. Threat actors attack through vectors such as phishing or exposed services. Every control you add protects one or more of the three CIA goals, and layers of preventive, detective and corrective controls give defense in depth.',
  sections: [
    {
      h: '1. Introduction to cyber security',
      t: 'Information security (InfoSec) protects information in any form: digital files, printed papers, spoken words, even a password written on a sticky note on a monitor. Cyber security is the major subset focused on digital systems, networks and data connected to cyberspace. Think of a college office. Locking the exam papers in a steel cupboard is information security. Protecting the online results portal from hackers is cyber security.\n\nIn real life, the same information often lives in many forms at once. A customer’s details may sit in a database, on a printed form in a file, and in a phone call with the support team. An attacker picks whichever form is easiest to steal. That is why a good security plan covers people, paper and computers together, not only servers and software.\n\nFor example, a company can encrypt every laptop and still leak data because an employee threw old customer printouts in the dustbin without shredding them. The laptops were safe, but the information was not.\n\nIn industry the two terms are often used interchangeably, and job ads mix them freely. Still, knowing the difference helps in interviews and in designing protection that includes people and paper, not only computers. The table compares the two side by side.',
      table: [
        ['', 'Information security', 'Cyber security'],
        ['Scope', 'All information, digital or physical', 'Digital systems, networks and data connected to cyberspace'],
        ['Example', 'Locking a paper file in a cabinet; shredding old bills', 'Encrypting a laptop; blocking a phishing site'],
        ['Relationship', 'The broader umbrella', 'A major subset focused on the digital part'],
        ['Typical role', 'Policy, risk, compliance, governance', 'Technical defense, monitoring, testing']
      ]
    },
    {
      h: '2. Why cyber security matters',
      t: 'Attacks cost money, privacy, safety and trust. These are not abstract losses. When a company is hit by ransomware, staff cannot work and customers cannot buy, and the company may spend large sums on recovery and fines. When a person’s Aadhaar number or medical report leaks, it can be misused for years.\n\nMany attacks need no advanced skill. A caller says he is from the bank and asks a shopkeeper for an OTP to “update KYC”. The shopkeeper shares it, and money leaves the account within minutes. Nothing was hacked in the technical sense, yet the loss is real. Security covers both the technology and the people who use it.\n\nRegulations make protecting personal data a legal duty. In India, the IT Act 2000 and the Digital Personal Data Protection (DPDP) Act 2023 set rules for how organizations collect, store and protect personal data. Europe’s GDPR does the same for people in the EU. An organization that ignores these duties can face penalties, court cases and a loss of customers.\n\nFor a defender, the lesson is simple: every system you protect has real people behind it. The bullets list the main kinds of harm. The note shows how one careless click can grow into a hospital emergency, and which basic controls would have limited the damage.',
      b: [
        'Money: ransomware, fraud and data breaches cost organizations millions in recovery and fines.',
        'Privacy: Aadhaar numbers, medical records and photos can be stolen and misused.',
        'Safety: attacks on hospitals, traffic systems and power plants can endanger lives.',
        'Trust and reputation: customers leave companies that cannot protect their data.',
        'Law and compliance: India’s IT Act 2000, the DPDP Act 2023 and Europe’s GDPR require protection of personal data.',
        'National security: governments defend critical infrastructure against hostile states.'
      ],
      note: 'Real-world pattern: an employee opens a fake invoice email, malware spreads and encrypts patient records, and surgeries are delayed. Good backups, staff training and network segmentation would have limited the damage.'
    },
    {
      h: '3. The CIA Triad',
      t: 'The CIA Triad is the foundation of all security thinking. It has nothing to do with the American spy agency. The letters stand for confidentiality, integrity and availability. Think of a bank locker. Only you and the bank can open it (confidentiality). What you put inside stays exactly as you left it (integrity). And you can open it during bank hours when you need your documents (availability).\n\nWhen you meet any security problem, ask: which of the three goals is at risk? A stolen password threatens confidentiality. Someone changing marks in the college database breaks integrity. A website that crashes on result day has an availability problem. Naming the goal tells you what kind of protection to look for: encryption and access control for confidentiality, hashes and audit logs for integrity, backups and redundancy for availability.\n\nGoals can pull against each other. Very strict access rules improve confidentiality but may slow staff down, which hurts availability. A hospital that asks doctors for three separate passwords before opening a patient file looks safe on paper, but in an emergency those lost minutes matter.\n\nSecurity design is the art of balancing the three goals for the value of what you protect. Use the table to link each goal with an everyday example, a typical attack and the usual protection, then try the quick check in the note.',
      table: [
        ['Goal', 'Plain meaning', 'Everyday example', 'Attack against it', 'Protection'],
        ['Confidentiality', 'Only the right people can see it', 'Only you can read your WhatsApp chats', 'Data breach, eavesdropping, shoulder surfing', 'Encryption, access control, MFA'],
        ['Integrity', 'Data is correct and unchanged', 'Your bank balance cannot be silently edited', 'Tampering, file-altering malware, man-in-the-middle', 'Hashing, digital signatures, version control, audit logs'],
        ['Availability', 'Systems work when you need them', 'UPI works during the festival rush', 'DDoS, ransomware, hardware failure', 'Backups, redundancy, load balancing, DR plans']
      ],
      note: 'Quick check: an insider changes a student’s marks (integrity). A fake login page steals the password (confidentiality). The server crashes on result day (availability).'
    },
    {
      h: '4. Authentication vs authorization',
      t: 'Authentication (AuthN) answers “Who are you?” Authorization (AuthZ) answers “What are you allowed to do?” Think of entering a college exam hall. The invigilator checks your ID card to confirm you are really you: that is authentication. Your hall ticket then says which room and seat you may use: that is authorization. A valid ID does not let you sit in any room you like.\n\nAuthentication happens first. It uses one or more factors: something you know (a password or PIN), something you have (a phone that receives an OTP, or a hardware token) or something you are (a fingerprint or your face). Using two different kinds of factor is called multi-factor authentication (MFA). Authorization happens after authentication. The system looks up your roles, permissions and policies, and decides whether each action is allowed.\n\nA third idea, accounting (also called auditing), records what the user did: who logged in, when, from where, and what they changed. Together they form AAA. On a college portal, you log in with a password and OTP (authentication), you can view but not edit your marks (authorization), and the system logs every marks change a teacher makes (accounting).\n\nMany security bugs come from confusing the first two. A common mistake is to check only that a user is logged in, and not what that user may do. Then any logged-in student can open the admin page just by typing its address.',
      table: [
        ['', 'Authentication', 'Authorization'],
        ['Question', 'Who are you?', 'What are you allowed to do?'],
        ['Happens', 'First', 'After authentication'],
        ['Based on', 'Know / have / are factors', 'Roles, permissions, policies'],
        ['Example', 'Entering your password and OTP', 'A student can view marks; only a teacher can edit them'],
        ['Failure looks like', 'Attacker logs in as someone else', 'A normal user opens the admin page']
      ]
    },
    {
      h: '5. Threats, vulnerabilities, risks and exploits',
      t: 'These four words are often mixed up, so use the house analogy. The asset is your valuables, such as gold kept at home. The vulnerability is an unlocked window. The threat is a burglar in the area. The exploit is climbing through that window. The risk is the chance and cost of being robbed. If there is no burglar nearby, or the window is locked, the risk drops.\n\nIn computing the same chain applies. The asset may be a customer database. The vulnerability may be an unpatched web server or a weak password. The threat may be a criminal group scanning the Internet. The exploit is the code or method that uses the weakness. Risk is usually estimated as likelihood × impact, so an event that is both likely and damaging gets the highest score.\n\nA risk can be handled four ways. Mitigate it: reduce it with controls, such as patching the server. Transfer it: pass the cost to someone else through insurance or outsourcing. Avoid it: stop the risky activity, such as shutting down an old service nobody uses. Accept it: live with a small risk knowingly, when fixing it would cost more than the possible loss.\n\nRisk assessment ranks risks so a limited budget is spent where it matters most. No organization can fix everything at once, so it fixes the biggest risks first. The table lists common attacks and the CIA goal each one mainly hits.',
      table: [
        ['Attack', 'What it is', 'Mainly hits'],
        ['Phishing', 'Fake emails or messages that trick people into giving data or clicking links', 'Confidentiality'],
        ['Malware', 'Malicious software: viruses, worms, trojans, spyware', 'All three'],
        ['Ransomware', 'Encrypts data and demands payment', 'Availability'],
        ['DDoS', 'Floods a service with traffic to make it unusable', 'Availability'],
        ['SQL injection', 'Sends malicious database commands through a web form', 'Confidentiality, integrity'],
        ['Man-in-the-middle', 'Secretly intercepts or alters communication', 'Confidentiality, integrity'],
        ['Social engineering', 'Manipulating people rather than machines', 'Mainly confidentiality'],
        ['Insider threat', 'Misuse of access by an employee or contractor', 'All three']
      ]
    },
    {
      h: '6. Threat actors and the attack lifecycle',
      t: 'Knowing who attacks and why helps predict how they will attack. A bank and a small blog face very different enemies. Think of an apartment security guard who knows that thieves usually try the back gate at night: he watches that gate more closely. Defenders study threat actors for the same reason.\n\nEach actor has a motive and a skill level. Cyber criminals want money and often work in organized groups. Nation-state groups, called APTs, want secrets or disruption and are very patient. Hacktivists act for a political or social cause. Insiders already have access. Script kiddies use ready-made tools for fun. Competitors want trade secrets. The table sums up each group.\n\nSerious attacks are not one click. They follow stages described by the Cyber Kill Chain: reconnaissance (study the target), weaponization (prepare the malware or exploit), delivery (send it, often by email), exploitation (trigger the weakness), installation (stay on the machine), command and control (the malware connects back to the attacker) and actions on objectives (steal, encrypt or destroy data). For example, a criminal collects staff emails from LinkedIn, sends a fake invoice with a harmful attachment, and the attachment installs a backdoor that calls home.\n\nThe defender’s advantage is that breaking any single link stops the whole attack. A spam filter can block delivery, a patch can block exploitation, and a firewall rule can block command and control. You do not have to win at every stage, only at one.',
      table: [
        ['Actor', 'Motivation', 'Skill and resources', 'Typical targets'],
        ['Cyber criminals', 'Money', 'Medium to high; organized groups', 'Banks, businesses, individuals'],
        ['Nation-state groups (APT)', 'Espionage, disruption, power', 'Very high; long-term patience', 'Governments, defense, infrastructure'],
        ['Hacktivists', 'Political or social cause', 'Low to medium', 'Organizations they oppose'],
        ['Insiders', 'Revenge, profit or accidents', 'Varies; already have access', 'Their own employer'],
        ['Script kiddies', 'Fun, fame, curiosity', 'Low; ready-made tools', 'Easy, poorly protected sites'],
        ['Competitors', 'Business advantage', 'Medium', 'Trade secrets, designs']
      ]
    },
    {
      h: '7. Attack surface',
      t: 'The attack surface is every point where an unauthorized person could try to enter or extract data. Think of a house: every door, window and balcony is a possible way in. A house with ten doors is harder to guard than a house with one. In the same way, the bigger the attack surface, the more chances the attacker has.\n\nThere are three kinds of attack surface. The digital surface covers open ports, websites, APIs, cloud storage and outdated software. The physical surface covers server rooms, laptops and USB ports. The human surface covers staff who can be fooled by a phishing email or a convincing phone call. Attackers look for the easiest point, not the most technical one.\n\nHere is a real pattern. A company runs a test server for a project that ended two years ago. Nobody patches it, because nobody remembers it exists. An attacker scans the Internet, finds the forgotten server with an open remote-login port, and uses it as a way into the internal network. The main servers were well protected; the old one was not.\n\nThe simplest rule follows from this: if a service is not needed, turn it off. Every port you close, account you remove and old app you uninstall is one less door to guard. The bullets list the main areas and the usual ways to reduce them.',
      b: [
        'Digital: open ports, web apps, APIs, cloud buckets, exposed services, outdated software.',
        'Physical: unlocked server rooms, stolen laptops, rogue USB drives.',
        'Human: staff who can be fooled by phishing or pressured by phone callers.',
        'Reduction: close unused ports, remove unused software, patch quickly, apply least privilege, segment networks, train staff.'
      ]
    },
    {
      h: '8. Security controls and defense in depth',
      t: 'A control (also called a safeguard) is anything that reduces risk. It can be a firewall, a password policy, a locked door or a training session. Think of how a bank protects cash: guards at the gate, CCTV cameras, a strong-room door, and a rule that two officers must be present to open the vault. Each one is a control, and none of them is enough alone.\n\nControls are grouped by when they act. Preventive controls stop an incident, detective controls discover it, corrective controls limit damage and restore normal work, deterrent controls discourage attackers, and compensating controls stand in when the ideal control is not possible. Controls are also grouped by what they are made of: administrative (policies, training), technical (software and hardware safeguards) or physical (locks, guards, fences).\n\nTake a college email system. MFA is a preventive, technical control. An alert when someone logs in from another country is detective. Resetting the password and restoring deleted mail is corrective. A login banner warning that misuse will be punished is a deterrent. A written rule that staff must never share passwords is administrative.\n\nA strong program layers all three kinds. This is called defense in depth: if one layer fails, the next still protects the asset. If a phishing email gets past the spam filter, MFA can still stop the stolen password from working, and monitoring can still catch the strange login.',
      table: [
        ['Type', 'Purpose', 'Examples'],
        ['Preventive', 'Stop an incident from happening', 'Firewall rules, MFA, encryption, locks, awareness training, patching'],
        ['Detective', 'Discover that something is happening or happened', 'SIEM alerts, intrusion detection, log review, CCTV, audits'],
        ['Corrective', 'Limit damage and restore normal operation', 'Incident response plan, restore from backup, patch deployment, account lockout'],
        ['Deterrent', 'Discourage attackers', 'Warning banners, legal notices, visible cameras'],
        ['Compensating', 'Alternative when the ideal control is not possible', 'Extra monitoring on an old system that cannot be patched']
      ]
    },
    {
      h: '9. Security awareness',
      t: 'Technology fails when people are tricked. A company can buy the best firewall, but if an employee types a password into a fake login page, the attacker simply logs in. Human error or manipulation plays a part in most breaches, so everyone needs good habits, not only the IT team.\n\nAttackers use emotion more than technical skill. They create fear (“your account will be blocked today”), urgency (“pay the fine within one hour”) or greed (“you have won a prize”). The aim is to make you act before you think. The usual channels are email, SMS, WhatsApp and phone calls in which the caller pretends to be from your bank, a courier company or the police.\n\nA common case: you get an SMS saying your electricity will be cut tonight unless you call a number. The caller asks you to install a “support” app, which is really a remote-access tool, and then asks for your OTP. A careful person stops, checks the official bill or the electricity board’s app, and never shares the OTP.\n\nGood habits are simple and cost nothing. The bullets list the most useful ones. Practice them yourself first, because as a security professional you will also teach them to friends, family and colleagues.',
      b: [
        'Check the sender and hover over links to see the real address before clicking.',
        'Use a unique, long passphrase for every important account and keep them in a password manager.',
        'Turn on MFA everywhere, especially email and banking.',
        'Install updates promptly.',
        'Never share OTPs, PINs or CVV, even with someone claiming to be from the bank.',
        'Report suspicious messages quickly, and lock your screen when you leave your seat.'
      ]
    },
    {
      h: '10. Ethics and legal boundaries',
      t: 'Security professionals are trusted with powerful skills. The same technique can protect or harm depending on permission. A locksmith who opens your door when you are locked out is helping you. The same locksmith opening a neighbor’s door without asking is committing a crime. In security, written permission is what separates a professional from a criminal.\n\nThe golden rule: no written permission, no testing. Before any security test, a professional gets a signed agreement that states what may be tested, when and how. Without it, scanning or breaking into a system can be an offense under laws such as India’s IT Act 2000, even if you meant no harm. Practice only on your own devices, labs you built, or learning platforms such as TryHackMe, Hack The Box or OWASP Juice Shop, which exist so that you can practice legally.\n\nSometimes you find a flaw by accident. For example, you change a number in the address bar of a college website and see another student’s details. Responsible disclosure means reporting the flaw privately to the owner, giving them time to fix it, and never exploiting it or publishing customer data. Do not download other people’s data to “prove” the bug. A clear description and a screenshot of your own record are enough.\n\nThe table lists the main laws and standards you will hear about in this field. The note reminds you to check the current official text, because laws change.',
      table: [
        ['Law or standard', 'Region', 'Why it matters'],
        ['Information Technology Act, 2000', 'India', 'Defines cyber offenses such as unauthorized access, data theft and identity fraud (Sections 43 and 66 are often cited)'],
        ['Digital Personal Data Protection Act, 2023', 'India', 'Rules for handling personal data and the duties of organizations'],
        ['GDPR', 'European Union', 'Strict data protection rules with heavy fines'],
        ['ISO/IEC 27001', 'International', 'Standard for an information security management system'],
        ['NIST Cybersecurity Framework 2.0', 'USA, widely adopted', 'Govern, Identify, Protect, Detect, Respond, Recover'],
        ['PCI DSS', 'Payment industry', 'Security rules for card data']
      ],
      note: 'Laws change, so always check the current text on official government sites before relying on a section number.'
    },
    {
      h: '11. Security domains and career paths',
      t: 'Cyber security is a family of specialties that share one foundation. Think of medicine: every doctor first studies anatomy, then some become surgeons and others become radiologists. In security, everyone learns networking, operating systems and the CIA Triad, then chooses a direction.\n\nSome roles are defensive. A SOC analyst watches alerts and investigates suspicious activity, and a digital forensics analyst studies evidence after an incident. Some roles are offensive but always authorized: a penetration tester attacks systems with written permission to find weaknesses before criminals do. Other roles build security into systems, such as cloud security and DevSecOps engineers. GRC analysts handle risk, audits and policy, and need clear writing more than coding.\n\nA practical path for a first-year student: learn networking and Linux well, then build small projects. A home lab with a firewall, a log parser in Python, or a written walkthrough of a TryHackMe room all show employers what you can actually do. Certifications help, but a project you can explain well in an interview often counts for more.\n\nThis program walks through each of these areas in later modules. Use the table to see the daily work and the skills for each role, and the note for common certifications.',
      table: [
        ['Role', 'Daily work', 'Skills to build'],
        ['SOC Analyst', 'Watch alerts, investigate suspicious activity, escalate incidents', 'Networking, logs, SIEM, Windows and Linux'],
        ['Penetration Tester', 'Legally attack systems to find weaknesses and write reports', 'Web security, Linux, scripting, reporting'],
        ['Cloud Security Engineer', 'Secure cloud accounts, identities and configurations', 'Cloud platforms, IAM, Infrastructure as Code'],
        ['DevSecOps Engineer', 'Automate security checks in CI/CD', 'Git, pipelines, containers, scanning tools'],
        ['Digital Forensics Analyst', 'Preserve and analyze evidence', 'File systems, memory analysis, chain of custody'],
        ['GRC Analyst', 'Risk assessments, audits, policy', 'Standards, communication, documentation']
      ],
      note: 'Beginner certifications include CompTIA Security+, ISC2 Certified in Cybersecurity, the Google Cybersecurity Certificate and eJPT; later options include CEH, OSCP, CISSP and cloud security certifications. Choose by the role you want, and build practical projects alongside them.'
    },
    {
      h: '12. Real-world incidents and their lessons',
      t: 'Real incidents teach lessons that theory cannot. Most famous breaches did not need genius attackers. They worked because of basic gaps: a missing patch, a vendor with too much access, or a staff member who clicked a link. Studying them is like a cricket team watching replays of a match it lost: you see exactly where it went wrong.\n\nMap each well-documented case to the CIA Triad, the kill chain and the control types you learned here. For each one, ask three questions. Which CIA goal was hit? At which kill-chain stage could the defender have stopped it? Which control (preventive, detective or corrective) was missing or failed?\n\nTake WannaCry in 2017. Microsoft had released a patch for the Windows flaw it used about two months before the outbreak. Organizations that had patched were safe. The worm spread across unpatched machines on flat networks and encrypted their files, so availability was the main loss. Patching (preventive) was missing, segmentation would have slowed the spread, and offline backups (corrective) made recovery possible.\n\nDo the same for Equifax, Target and SolarWinds. You will notice that the lessons repeat: patch quickly, know what assets you have, control third-party access, and verify the software you install.',
      table: [
        ['Incident', 'What happened', 'Lesson'],
        ['WannaCry (2017)', 'Ransomware worm spread through unpatched Windows systems, disrupting hospitals and companies', 'Patch quickly; segment networks; keep offline backups'],
        ['Equifax (2017)', 'A known, unpatched web application flaw exposed data of about 147 million people', 'Patch management and asset inventory are critical'],
        ['Target (2013)', 'Attackers entered through a vendor’s credentials and reached payment systems', 'Vendors are part of your attack surface'],
        ['SolarWinds (2020)', 'A software update was trojanized and reached thousands of customers', 'Verify the software supply chain'],
        ['Everyday phishing', 'Fake bank or courier messages steal OTPs and credentials daily', 'Awareness and MFA; never share an OTP']
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 01: look at your own machine like a defender',
    steps: [
      ['Identify yourself (authentication context). Use your own Linux machine or a Kali/Ubuntu virtual machine only.', '$ whoami\n$ id', 'whoami prints your username. id shows your user ID and groups. Membership of a group such as sudo grants administrative power (authorization).'],
      ['See which services are listening: this is your attack surface.', '$ ss -tuln', '-t TCP, -u UDP, -l listening only, -n numbers instead of names. A service on 0.0.0.0 accepts connections from any interface; 127.0.0.1 accepts only from the same machine.'],
      ['See recent logins (a detective control).', '$ last -n 3', 'Unexpected logins are a sign to investigate. On Windows, run whoami /groups and netstat -an to see the same ideas.'],
      ['Reflect: which listening services do you actually need, and which CIA goal would an exposed SSH service with a weak password threaten first?', null, 'Stopping unneeded services shrinks the attack surface. A weak SSH password threatens confidentiality first (an attacker logs in), then integrity and availability.']
    ]
  },
  examples: [
    {
      title: 'Risk score = likelihood × impact',
      lang: 'python',
      code: 'risks = [\n    ("Phishing of staff email", 4, 4),\n    ("Unpatched public web server", 3, 5),\n    ("Stolen laptop without encryption", 2, 4),\n    ("Server room door left open", 2, 3),\n]\n\nprint(f"{\'Risk\':36} L  I  Score  Level")\nfor name, likelihood, impact in sorted(risks, key=lambda r: r[1] * r[2], reverse=True):\n    score = likelihood * impact\n    level = "HIGH" if score >= 15 else "MEDIUM" if score >= 8 else "LOW"\n    print(f"{name:36} {likelihood}  {impact}  {score:>5}  {level}")',
      explanation: 'A simple risk register: each risk gets a likelihood and an impact from 1 to 5, and the product ranks where to spend effort first. Real programs use the same idea with more detail.'
    }
  ],
  best: [
    'Ask “which CIA goal is at risk?” for every security problem you meet.',
    'Apply least privilege: give users and services only the access they need.',
    'Turn on MFA for email, banking and admin accounts.',
    'Patch quickly and keep an inventory of every asset you own.',
    'Layer preventive, detective and corrective controls (defense in depth).',
    'Get written permission before any security test, and stay inside the agreed scope.'
  ],
  mistakes: [
    'Treating threat, vulnerability and risk as the same thing.',
    'Confusing authentication (who you are) with authorization (what you may do).',
    'Believing one product (antivirus, firewall) makes you completely safe.',
    'Testing a website or network “just to learn” without the owner’s written permission.',
    'Ignoring people and process: most breaches involve a human step.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Pick an app you use daily (for example UPI). List its assets, three threats, three vulnerabilities and one control for each CIA goal.\n2. Classify each control as preventive, detective or corrective: CCTV, antivirus quarantine, MFA, restoring from backup, log review, a firewall rule.\n3. Draw the attack surface of your college or home network on paper, then mark five ways to reduce it.\n4. Read one real breach report and record: actor, motivation, kill-chain stages, failed controls and lessons.'
  },
  mini: {
    title: 'Mini project: personal security audit',
    objective: 'Find and fix the biggest risks in your own digital life.',
    requirements: [
      'Inventory your accounts and devices; mark which have MFA, unique passwords and recent updates.',
      'Score each asset for impact (1 to 5) and likelihood (1 to 5) and multiply for a risk score.',
      'Write a one-page improvement plan for your top five risks, then apply the fixes.'
    ],
    deliverable: 'A short report with your risk table, your plan and before/after screenshots of the settings you changed.'
  },
  takeaways: [
    'Cyber security is a continuous process of reducing, detecting and recovering from risk, not a single product.',
    'Every problem maps to confidentiality, integrity or availability.',
    'Authentication proves identity; authorization decides what that identity may do.',
    'Risk = likelihood × impact; it can be mitigated, transferred, avoided or accepted.',
    'Layered controls and a small attack surface give defense in depth.',
    'No written permission, no testing.'
  ],
  quickRef: [
    'CIA: Confidentiality (encryption, MFA) · Integrity (hashes, signatures) · Availability (backups, redundancy)',
    'AAA: Authentication → Authorization → Accounting',
    'Risk = Likelihood × Impact · Treat: mitigate / transfer / avoid / accept',
    'Controls: preventive · detective · corrective · deterrent · compensating',
    'Kill chain: recon → weaponize → deliver → exploit → install → C2 → actions'
  ],
  refs: [
    ['NIST Cybersecurity Framework', 'https://www.nist.gov/cyberframework'],
    ['NIST SP 800-12: An Introduction to Information Security', 'https://csrc.nist.gov/pubs/sp/800/12/r1/final'],
    ['CERT-In advisories', 'https://www.cert-in.org.in/'],
    ['MITRE ATT&CK', 'https://attack.mitre.org/'],
    ['OWASP Foundation', 'https://owasp.org/']
  ],
  quiz: [
    ['An attacker changes the destination account number in a payment file without being detected. Which CIA goal failed?', ['Confidentiality', 'Integrity', 'Availability', 'Accounting'], 1, 'Nothing was disclosed and the system stayed up, but the data is no longer correct: integrity failed.'],
    ['Entering a password and then an OTP sent to your phone is an example of:', ['Authorization', 'Multi-factor authentication', 'Accounting', 'Encryption'], 1, 'It combines something you know (password) and something you have (phone): two factor types.'],
    ['What is the difference between a threat and a vulnerability?', ['They are the same thing', 'A threat is a weakness; a vulnerability causes harm', 'A threat can cause harm; a vulnerability is a weakness it can use', 'A threat is always an insider'], 2, 'The threat is the burglar; the vulnerability is the unlocked window.'],
    ['Log review that spots unusual logins is which type of control?', ['Preventive', 'Detective', 'Corrective', 'Deterrent'], 1, 'It discovers that something is happening; it does not stop or fix it.'],
    ['Which kill-chain stage is “sending a phishing email with a malicious attachment”?', ['Reconnaissance', 'Delivery', 'Installation', 'Actions on objectives'], 1, 'Delivery is when the weapon reaches the target, for example by email.']
  ],

  // ----- lesson enrichment
  skills: ['Analyze problems with the CIA Triad', 'Score risk as likelihood × impact', 'Classify security controls', 'Recognize threat actors and kill-chain stages'],
  prereq: ['None: this is the starting module'],
  analogy: 'A bank branch: the money is the asset, a broken back door is a vulnerability, a robber gang is the threat, picking the lock is the exploit, and the chance of losing money is the risk. Guards (preventive), CCTV (detective) and insurance plus a recovery plan (corrective) work together.',
  why: 'Every later skill, from firewalls to forensics, is a way of protecting confidentiality, integrity or availability against a specific threat. With these words and models you can reason about any new attack you meet.',
  workflow: {
    title: 'From asset to risk decision',
    nodes: [
      ['asset', 'Identify assets', 'What has value?', 'Business, data, systems', 'Asset list', 'List what needs protecting: customer data, servers, laptops, reputation. You cannot protect what you do not know you have, so asset inventory is the first step of every security program.'],
      ['threat', 'Find threats', 'Who or what could cause harm?', 'Asset list', 'Threat list', 'For each asset, think about who might attack (criminals, insiders, hacktivists) and what could go wrong (phishing, ransomware, floods). Threat intelligence and past incidents help here.'],
      ['vuln', 'Find vulnerabilities', 'Which weaknesses could they use?', 'Threats', 'Weaknesses', 'Look for unpatched software, weak passwords, open ports, misconfigured cloud storage and untrained staff. Scanners and audits find many of these (Module 08).'],
      ['risk', 'Score risk', 'Likelihood × impact', 'Threat + vulnerability', 'Ranked risks', 'Rate likelihood and impact (for example 1 to 5 each) and multiply. A public server with a known critical bug and customer data scores high; an internal test box with no data scores low.'],
      ['treat', 'Treat the risk', 'Mitigate, transfer, avoid or accept', 'Ranked risks', 'Controls and decisions', 'Mitigate with controls (patch, MFA, segmentation), transfer with insurance, avoid by stopping the activity, or accept a small risk knowingly and document it.'],
      ['monitor', 'Monitor and improve', 'Security is a process', 'Controls', 'Updated risk picture', 'Threats and systems keep changing, so detective controls, reviews and lessons learned feed back into the asset and risk lists.']
    ],
    explanation: 'This loop is the heart of every security program, from a personal audit to an ISO 27001 management system.'
  },
  caseStudy: {
    title: 'Ransomware at a hospital',
    problem: 'An employee opened a fake invoice email. Malware spread across a flat network and encrypted patient records and scheduling systems.',
    data: 'Email gateway logs, endpoint alerts, backup status, network diagram.',
    steps: ['Delivery: the phishing email reached the inbox (awareness failed).', 'Exploitation and installation: the attachment ran malware on the PC.', 'Lateral movement: a flat network let it reach the record servers.', 'Impact: data encrypted (availability lost), surgeries delayed.', 'Recovery: offline backups restored systems; MFA, segmentation and training were added.'],
    result: 'Systems were restored from backups without paying, and the new layers break the kill chain at several points.',
    limitations: 'Backups only help if they are offline or immutable and regularly tested.'
  },
  exercises: [
    { title: 'Name the CIA goal', objective: 'Map an incident to the triad.', problem: 'A college results website goes offline on result day because of a flood of fake traffic. Which CIA goal failed?', options: ['Confidentiality', 'Integrity', 'Availability', 'Authentication'], answer: 2, hints: ['Was anything stolen or changed?'], solution: ['No data was disclosed or altered.', 'Legitimate users could not reach the service: availability.'], explanation: 'A DDoS attack targets availability.' },
    { title: 'Compute a risk score', difficulty: 'Beginner', objective: 'Use likelihood × impact.', problem: 'A risk has likelihood 4 and impact 5 on a 1–5 scale. What is its risk score?', answer: 20, hints: ['Multiply the two numbers.'], solution: ['Risk = likelihood × impact = 4 × 5 = 20.'], explanation: 'On a 1–25 scale, 20 is high and should be treated first.' },
    { title: 'Classify the control', objective: 'Tell control types apart.', problem: 'Restoring a database from last night’s backup after ransomware is which type of control?', options: ['Preventive', 'Detective', 'Corrective', 'Deterrent'], answer: 2, hints: ['Does it stop, discover or repair?'], solution: ['The incident already happened.', 'Restoring limits damage and returns to normal: corrective.'], explanation: 'Backups are the classic corrective control.' },
    { type: 'Short answer', title: 'AuthN or AuthZ?', objective: 'Separate identity from permission.', problem: 'A logged-in student opens /admin and can delete courses. Which failed: authentication or authorization? Answer with one word.', accept: ['authorization', 'authorisation', 'authz'], hints: ['The student proved who they are correctly.'], solution: ['Identity was verified correctly.', 'The system failed to check what that identity is allowed to do.'], explanation: 'This is broken access control, the top OWASP web risk (Module 06).' }
  ],
  checks: [
    ['Which is the best example of least privilege?', ['Everyone is an admin to save time', 'A support agent can view tickets but cannot change billing', 'Passwords are shared in a team chat', 'Admins use one shared account'], 1, 'Each role gets only the access needed for its job.'],
    ['A vulnerability with no patch available yet is called:', ['A zero-day', 'A false positive', 'A honeypot', 'A deterrent'], 0, 'The vendor has had “zero days” to fix it.'],
    ['Which is a compensating control?', ['Extra monitoring on a legacy server that cannot be patched', 'A firewall rule', 'A warning banner', 'Restoring from backup'], 0, 'It is an alternative when the ideal control (patching) is not possible.']
  ],
  cheat: ['CIA = Confidentiality · Integrity · Availability', 'AuthN = who you are · AuthZ = what you may do', 'Risk = Likelihood × Impact', 'Treat risk: mitigate · transfer · avoid · accept', 'No written permission, no testing'],
  next: 'Module 02 shows how data travels across networks (OSI, TCP/IP, DNS, subnetting) and how firewalls, segmentation and IDS/IPS defend it.'
};
