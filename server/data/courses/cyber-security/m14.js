export default {
  n: 14,
  title: 'Identity, Governance, Risk & Compliance',
  description: 'IAM fundamentals and the identity lifecycle, MFA, passkeys and FIDO2, access control models (RBAC, ABAC, DAC, MAC), Kerberos, SAML and OIDC, privileged access management, security governance and the policy hierarchy, risk assessment and treatment, NIST CSF 2.0, ISO 27001, SOC 2, PCI DSS and CIS Controls, business continuity (RPO/RTO), privacy and audits.',
  intro: 'Technology alone does not make an organization secure. Someone must decide who gets access to what, which risks matter most, which rules everyone follows, and how to prove all of it to customers, auditors and regulators. That is the work of identity and access management (IAM) and governance, risk and compliance (GRC).\n\nThe first part of this module goes deep on identity: authentication factors and phishing-resistant passkeys, access control models, enterprise protocols such as Kerberos, SAML and OIDC, and privileged access management. The second part covers governance: the policy hierarchy, risk registers and risk treatment, the major frameworks (NIST CSF 2.0, ISO 27001, SOC 2, PCI DSS and CIS Controls), business continuity, privacy and audits.\n\nThese topics may sound like paperwork, but they decide where the security budget goes and who is accountable when something breaks. They lead to roles such as IAM engineer, GRC analyst and auditor, and eventually to the CISO’s chair.',
  objectives: [
    'Explain the identity lifecycle and compare authentication factors, including passkeys.',
    'Choose between RBAC, ABAC, DAC and MAC, and design an access matrix with separation of duties.',
    'Describe Kerberos, SAML 2.0 and OIDC, and how single sign-on works.',
    'Explain privileged access management and just-in-time access.',
    'Build a risk register, score risks and choose a treatment.',
    'Compare NIST CSF 2.0, ISO 27001, SOC 2, PCI DSS and CIS Controls, and explain RPO, RTO and audit evidence.'
  ],
  terms: [
    ['Identity lifecycle', 'Joiner, mover, leaver: creating, changing and removing access as people change roles.'],
    ['Passkey (FIDO2/WebAuthn)', 'Phishing-resistant login with a key pair bound to the website’s domain and stored on a device.'],
    ['RBAC / ABAC', 'Access by job role / access decided by attributes such as tags, location and time.'],
    ['DAC / MAC', 'The owner decides access (file permissions) / the system enforces labels and clearances.'],
    ['SSO', 'Single sign-on: one login gives access to many applications through an identity provider.'],
    ['SAML / OIDC', 'XML-based enterprise SSO / a modern identity layer on top of OAuth 2.0 using JSON tokens.'],
    ['Kerberos', 'Active Directory’s ticket-based authentication protocol (TGT and service tickets).'],
    ['PAM', 'Privileged Access Management: vaulting, monitoring and time-limiting admin access.'],
    ['JIT access', 'Just-in-time: admin rights granted for a short, approved window and then removed.'],
    ['Separation of duties', 'No single person can complete a sensitive action alone, such as creating and approving a payment.'],
    ['Risk register', 'A list of risks with likelihood, impact, score, treatment, owner and due date.'],
    ['RPO / RTO', 'Recovery point objective (how much data you can lose) / recovery time objective (how long you can be down).'],
    ['GRC', 'Governance, Risk and Compliance: managing security as a business function.']
  ],
  diagramTitle: 'Identity lifecycle and the governance stack',
  ascii: ' IDENTITY LIFECYCLE\n joiner -> provision (role-based) -> authenticate (MFA / passkey) -> authorize (RBAC/ABAC)\n   -> mover (remove old access!) -> access review (quarterly) -> leaver (disable same day)\n\n GOVERNANCE STACK\n   POLICY      "All remote access must use MFA"          (board / CISO, mandatory)\n   STANDARD    "FIDO2 keys for admins; TOTP for staff"   (specific, mandatory)\n   PROCEDURE   step-by-step enrolment SOP                 (operational)\n   GUIDELINE   tips for choosing a passphrase             (advisory)\n\n RISK:  identify -> score (likelihood x impact, 5x5) -> treat (mitigate | transfer\n        | avoid | accept) -> monitor in the risk register -> report to leadership\n FRAMEWORKS: NIST CSF 2.0 · ISO 27001 · SOC 2 · PCI DSS v4.0 · CIS Controls v8',
  diagramExplain: 'Identity controls follow a person from their first day to their last, with reviews in between to stop access creep. Governance turns leadership intent into policies, standards, procedures and guidelines, and risk management decides where to invest, measured against recognized frameworks.',
  sections: [
    {
      h: '1. IAM fundamentals and authentication factors',
      t: 'Identity and access management (IAM) makes sure the right people and services get the right access, for verified reasons, across the whole lifecycle: when they join, when they change roles and when they leave. Think of your college ID card. It proves who you are at the gate, it lets you into the library but not the staff room, and it should stop working the day you graduate.\n\nAuthentication proves identity using factors. Something you know is a password or PIN. Something you have is a phone, an authenticator app or a hardware token. Something you are is a fingerprint or face. MFA combines two or more different types. Stolen or guessed passwords are behind a large share of intrusions, through credential stuffing (trying leaked passwords on other sites), password spraying (trying one common password on many accounts) and phishing.\n\nNot all MFA is equal, as the table shows. SMS codes can be stolen through a SIM swap. Authenticator app codes can still be typed into a fake login page and relayed by an adversary-in-the-middle phishing kit. FIDO2 and WebAuthn passkeys, such as a YubiKey, Windows Hello or a phone passkey, are phishing-resistant: the key is bound to the real website’s domain, so it simply will not sign in to a lookalike site.\n\nThis is why organizations are moving to MFA and passwordless login. Biometrics are convenient, but remember that you cannot change your fingerprint if its data leaks.',
      table: [
        ['Factor', 'Examples', 'Phishing resistance'],
        ['Something you know', 'Password, PIN', 'Very weak: reused, sprayed and phished'],
        ['Something you have', 'SMS OTP, authenticator app, hardware token', 'SMS vulnerable to SIM swap; OTP codes can be phished by adversary-in-the-middle kits'],
        ['Something you are', 'Fingerprint, face', 'Convenient, but biometrics cannot be changed if leaked'],
        ['FIDO2 / WebAuthn (passkeys)', 'YubiKey, Windows Hello, phone passkeys', 'Phishing-resistant: the key only works on the real website’s domain']
      ]
    },
    {
      h: '2. Access control models',
      t: 'Once a user has proved who they are, access control decides what they may do. Different places use different rules. In a hospital, a nurse sees patient files because of her role. In a hostel, a student decides who may borrow his bicycle. In the army, a soldier sees a document only if his clearance matches its label. These are the four main models.\n\nRBAC (role-based access control) attaches permissions to job roles, and users receive roles; it fits corporate departments such as HR, finance and engineering. ABAC (attribute-based access control) evaluates rules about the user, the resource, the action and the context, such as time, IP address or device health; it powers cloud policies, Zero Trust and conditional access. DAC (discretionary access control) lets the resource owner decide who has access, as with chmod on Linux or NTFS permissions on Windows. MAC (mandatory access control) has the system enforce labels and clearances that users cannot change, as in military systems and SELinux.\n\nFor example, an ABAC rule might say: finance staff may approve payments only from a managed laptop, during office hours, from India. An RBAC system alone cannot express that.\n\nPick the model that fits the data and the regulation, and combine it with two principles. Least privilege gives each person only what they need. Separation of duties makes sure no single person can, for example, both create a vendor and approve its payment.',
      table: [
        ['Model', 'Mechanism', 'Typical use'],
        ['RBAC', 'Permissions attached to job roles; users get roles', 'Corporate departments (HR, finance, engineering)'],
        ['ABAC', 'Rules evaluate user, resource, action and context (time, IP, device)', 'Cloud, Zero Trust, conditional access'],
        ['DAC', 'The resource owner decides who has access', 'File permissions (chmod, NTFS)'],
        ['MAC', 'The system enforces labels and clearances', 'Military, intelligence, SELinux']
      ]
    },
    {
      h: '3. Enterprise identity protocols',
      t: 'Inside a company, people log in many times a day to email, file shares and web apps. Typing a password into each one would be slow and unsafe. Identity protocols solve this, a bit like a cinema ticket: you pay once at the counter, then show the ticket at each door without paying again.\n\nKerberos authenticates users inside Active Directory. The client proves its identity to the Key Distribution Center (KDC), which runs on the domain controller, and receives a Ticket Granting Ticket (TGT). It then exchanges the TGT for a service ticket for each resource it needs, such as a file server or printer. The password is not sent again for each service; the encrypted tickets do the work.\n\nFor web and cloud single sign-on, two protocols dominate. SAML 2.0 uses signed XML assertions and is common in enterprises; for example, logging in to Salesforce through the company’s identity provider. OpenID Connect (OIDC) is built on OAuth 2.0, uses signed ID tokens in JSON Web Token (JWT) format, and dominates modern apps, such as “Sign in with Google”.\n\nOAuth 2.0 itself is often misunderstood. It is for delegated authorization: letting an app act on your behalf with limited scopes, such as a photo printing site reading your Google Photos but not your email. It is not for proving identity. That is the job OIDC adds on top.',
      table: [
        ['Protocol', 'Used for', 'Format'],
        ['Kerberos', 'Login and SSO inside Active Directory', 'Encrypted tickets'],
        ['SAML 2.0', 'Enterprise web SSO', 'Signed XML assertions'],
        ['OAuth 2.0', 'Delegated authorization (scopes)', 'Access tokens'],
        ['OIDC', 'Modern SSO and login', 'Signed ID tokens (JWT)']
      ]
    },
    {
      h: '4. Privileged access management (PAM)',
      t: 'Admin accounts are the keys to the kingdom. One domain admin or cloud root account can read every file, create new users and turn off security tools. Think of a bank: the locker room master key is not left on the manager’s desk; it is kept in a safe, signed out for a reason and signed back in.\n\nPrivileged access management (PAM) applies the same discipline to IT, as the bullets list. First, separate admin accounts from daily accounts: Priya uses priya for email and browsing, and priya-adm only for admin tasks, with no email or browsing on it. Second, vault privileged passwords and keys, rotate them automatically, and check them out per task, so no one memorizes them. Third, use just-in-time (JIT) elevation: an engineer requests admin rights for a two-hour window to patch a server, a manager approves, and the rights disappear afterwards. This replaces standing admin rights that sit unused but available to any attacker who steals the account.\n\nFourth, record and monitor privileged sessions and alert on unusual use, such as an admin login at 3 am from a new country. Finally, protect the most sensitive tier, such as domain admins and cloud root, with hardware security keys.\n\nAttackers almost always aim for privileged accounts, because that is how a single infected laptop becomes a company-wide ransomware incident. Strong PAM cuts that path short.',
      b: [
        'Separate admin accounts from daily accounts; no email or browsing on admin accounts.',
        'Vault privileged passwords and keys, rotate them automatically, and check them out per task.',
        'Grant just-in-time (JIT) elevation for a short, approved window instead of standing admin rights.',
        'Record and monitor privileged sessions, and alert on unusual use.',
        'Protect the most sensitive tier (domain admins, cloud root) with hardware security keys.'
      ]
    },
    {
      h: '5. Governance and the policy hierarchy',
      t: 'Governance answers three questions: who decides, who is accountable, and how do we know the rules are followed. It is like the management of a large apartment society. There is a committee, a secretary with clear powers, written rules for everyone, and specific instructions for the security guards.\n\nIn an organization, governance usually means a security steering committee, a CISO with a clear mandate, and a RACI matrix that lists, for each task, who is Responsible, Accountable, Consulted and Informed. Documents are layered so leaders approve intent and engineers own details. A policy is mandatory and high-level, such as “All access must use MFA”, approved by the CISO or board each year. A standard is mandatory and specific, such as “AES-256 for all disks”. A procedure is the mandatory step-by-step method, such as the laptop encryption SOP. A guideline is advice, such as how to choose a good passphrase.\n\nThis layering keeps documents stable. When the company changes its disk encryption tool, only the procedure changes. The policy and standard stay the same and do not need board approval again.\n\nThe common mistake is writing an 80-page policy that nobody reads. Short, readable policies plus training work far better. If an employee cannot explain the rule in one sentence, the document has not done its job.',
      table: [
        ['Document', 'Authority', 'Example', 'Approved by'],
        ['Policy', 'Mandatory, high-level', '“All access must use MFA”', 'CISO / board, yearly'],
        ['Standard', 'Mandatory, specific', '“AES-256 for all disks”', 'Security architecture'],
        ['Procedure', 'Mandatory, step by step', 'Laptop encryption SOP', 'Security operations'],
        ['Guideline', 'Advisory', 'How to choose a passphrase', 'Awareness team']
      ]
    },
    {
      h: '6. Risk assessment and treatment',
      t: 'Risk is the chance that something bad happens, combined with how bad it would be. You already do this when you decide whether to carry an umbrella: how likely is rain, and how much would getting wet matter. Organizations do the same, but they write it down.\n\nEach risk gets a score for likelihood and impact on a 1 to 5 scale. Multiplying them gives a score up to 25, shown on a 5×5 heatmap. Then you choose a treatment, as the table shows. Mitigate means adding controls, such as enforcing MFA on all VPN access. Transfer means shifting the impact to a third party, such as cyber insurance or an MSSP contract. Avoid means stopping the risky activity, such as decommissioning an internet-facing legacy system. Accept means knowingly keeping a small risk, such as an internal low-value tool without SSO, with the decision documented. Every risk in the register needs an owner and a due date.\n\nThe Python code builds a small risk register and sorts it by score. Ransomware via an unpatched VPN scores 4×5=20 and prints first as HIGH, while a lost unencrypted USB drive scores 3×2=6 and is LOW. The sorting shows leaders where to spend first.\n\nResidual risk is what remains after controls are in place. It is never zero. Accepted risks need a documented approver, so that if something goes wrong, it is clear who made the decision and why.',
      table: [
        ['Treatment', 'Meaning', 'Example'],
        ['Mitigate', 'Add controls to lower likelihood or impact', 'Enforce MFA on all VPN access'],
        ['Transfer', 'Shift impact to a third party', 'Cyber insurance, an MSSP contract'],
        ['Avoid', 'Stop the risky activity', 'Decommission an internet-facing legacy system'],
        ['Accept', 'Knowingly retain a small risk', 'An internal low-value tool without SSO, documented']
      ],
      code: 'register = [\n    ("RSK-01", "Ransomware via unpatched VPN", 4, 5, "Mitigate", "SecOps"),\n    ("RSK-02", "Cloud keys committed to GitHub", 4, 4, "Mitigate", "AppSec"),\n    ("RSK-03", "Data center power loss > 4 h", 2, 4, "Transfer", "IT Lead"),\n    ("RSK-04", "Lost unencrypted USB drive", 3, 2, "Avoid", "IT Lead"),\n]\n\ndef level(score):\n    return "HIGH" if score >= 15 else "MEDIUM" if score >= 8 else "LOW"\n\nfor rid, desc, l, i, treat, owner in sorted(register, key=lambda r: r[2] * r[3], reverse=True):\n    print(f"{rid}  {l}x{i}={l*i:>2} {level(l*i):6}  {treat:8} {owner:8} {desc}")',
      lang: 'python'
    },
    {
      h: '7. Frameworks and compliance',
      t: 'A framework is a ready-made structure for a security program. It is like a syllabus: instead of each teacher inventing their own course, everyone follows a known structure, and outsiders can check what was covered. Frameworks let customers, regulators and insurers trust a program without inspecting every detail themselves.\n\nThe table compares the main ones. NIST CSF 2.0 is voluntary and widely adopted, with six functions: Govern, Identify, Protect, Detect, Respond and Recover. ISO/IEC 27001:2022 defines an information security management system (ISMS) that can be certified by an external auditor; it has clauses 4 to 10 plus Annex A with 93 controls. SOC 2 reports, common for SaaS and service providers, cover the trust criteria of security, availability, confidentiality, processing integrity and privacy. PCI DSS v4.0 applies to anyone handling payment card data, with 12 requirements and regular scans and assessments. CIS Controls v8 give a prioritized technical baseline of 18 controls, split into implementation groups IG1 to IG3.\n\nThe note explains a frequent interview question. A SOC 2 Type I report checks that controls are designed properly at one point in time. A Type II report tests that they actually operated over a period, usually 6 to 12 months, so customers trust it more.\n\nFrameworks overlap heavily. One control, such as MFA for all remote access, satisfies requirements in almost all of them. Mapping each control to several frameworks saves a lot of duplicated effort.',
      table: [
        ['Framework', 'Scope', 'Structure'],
        ['NIST CSF 2.0', 'Voluntary, widely adopted', '6 functions: Govern, Identify, Protect, Detect, Respond, Recover'],
        ['ISO/IEC 27001:2022', 'Certifiable ISMS', 'Clauses 4–10 plus Annex A with 93 controls'],
        ['SOC 2 (Type I and II)', 'Service and SaaS providers', 'Trust criteria: security, availability, confidentiality, processing integrity, privacy'],
        ['PCI DSS v4.0', 'Anyone handling payment card data', '12 requirements, regular scans and assessments'],
        ['CIS Controls v8', 'Prioritized technical baseline', '18 controls in implementation groups IG1–IG3']
      ],
      note: 'SOC 2 Type I checks that controls are designed properly at one point in time; Type II tests that they actually operated over a period, usually 6–12 months.'
    },
    {
      h: '8. Business continuity, privacy and audits',
      t: 'Business continuity planning (BCP) keeps critical operations running during a disruption, such as a flood, a power failure or ransomware. Disaster recovery (DR) is the technical part: restoring IT systems and data. Think of a wedding caterer with a backup generator and a second cook on call. The guests still get dinner, even if things go wrong in the kitchen.\n\nTwo numbers drive the plan. RPO (recovery point objective) is how much data you can afford to lose, which sets backup frequency: an RPO of 1 hour needs at least hourly backups. RTO (recovery time objective) is how fast systems must be back. The 3-2-1 backup rule keeps 3 copies of data, on 2 different media, with 1 offsite, ideally offline or immutable so ransomware cannot encrypt it too.\n\nPrivacy laws add duties. GDPR in Europe and India’s DPDP Act 2023 require purpose limitation (use data only for the stated reason), data minimization (collect only what you need), consent and breach notification. A college app that asks for Aadhaar numbers just to register for a fest would fail data minimization.\n\nAudits run smoothly when evidence is collected continuously, not in a panic the week before. The bullets cover the usual weak spots: access creep, which quarterly access reviews fix; vendor risk, which supplier assessments and SOC 2 Type II or ISO 27001 evidence address; and automated collection of configuration exports, access reviews and training records.',
      b: [
        'Access creep: run quarterly access reviews with manager sign-off.',
        'Vendor risk: assess suppliers before onboarding and request SOC 2 Type II or ISO 27001 evidence.',
        'Evidence: automate collection (configuration exports, access reviews, training records).'
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 14: risk register, access matrix and a CSF gap analysis',
    steps: [
      ['Build a risk register with at least five risks for a small company, using the 5×5 scale. Give each a treatment, owner and due date.', null, 'Use the Python register above as a template, or a spreadsheet. Focus on specific, testable actions.'],
      ['Design an access control matrix for four roles (junior developer, DevSecOps lead, finance analyst, CISO) across five systems (GitHub, production cloud, ERP ledger, SIEM, HR system).', null, 'Check separation of duties: nobody who writes code should approve their own production deployment alone, and finance staff should not administer the ERP.'],
      ['Turn on a passkey or hardware key for one of your own accounts that supports it, and record the recovery steps.', null, 'Always register at least two authenticators or save recovery codes safely, so losing one device does not lock you out.'],
      ['Do a NIST CSF 2.0 gap analysis for your college lab or a small business: rate each of the six functions from Tier 1 (partial) to Tier 4 (adaptive) and list the top three gaps.', null, 'A gap analysis turns a framework into a roadmap: current state, target state, and the actions in between.']
    ]
  },
  examples: [
    {
      title: 'Finding access creep in an access review',
      lang: 'python',
      code: 'role_entitlements = {\n    "developer": {"github:write", "siem:read"},\n    "finance":   {"erp:write"},\n}\n\nusers = [\n    {"name": "asha",  "role": "developer", "access": {"github:write", "siem:read"}},\n    {"name": "ravi",  "role": "finance",   "access": {"erp:write", "github:write"}},          # moved teams\n    {"name": "meena", "role": "developer", "access": {"github:write", "erp:approve", "erp:write"}},\n]\n\nfor u in users:\n    extra = u["access"] - role_entitlements[u["role"]]\n    sod = {"erp:write", "erp:approve"} <= u["access"]\n    notes = []\n    if extra:\n        notes.append(f"remove {sorted(extra)}")\n    if sod:\n        notes.append("separation-of-duties conflict")\n    print(f"{u[\'name\']:6} {u[\'role\']:9} {\'; \'.join(notes) or \'ok\'}")',
      explanation: 'Comparing actual access with what the role should have finds leftovers from old jobs (access creep) and toxic combinations, such as the ability to both create and approve payments. Identity governance tools run this check across thousands of users.'
    }
  ],
  best: [
    'Use phishing-resistant MFA (passkeys or FIDO2 keys) for admins and remote access.',
    'Automate joiner, mover and leaver processes and run quarterly access reviews.',
    'Grant admin rights just-in-time through PAM, and record privileged sessions.',
    'Keep a living risk register with owners, due dates and documented acceptance.',
    'Map controls once to several frameworks (NIST CSF, ISO 27001, SOC 2).',
    'Define RPO and RTO per system and test restores, following the 3-2-1 backup rule.'
  ],
  mistakes: [
    'Leaving accounts active after people leave, or keeping old access after role changes.',
    'Treating SMS OTP as phishing-resistant for high-risk accounts.',
    'Writing policies nobody reads and nobody enforces.',
    'Accepting risks informally without an approver or review date.',
    'Collecting audit evidence manually the week before the audit.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Explain why passkeys resist phishing while OTP codes do not.\n2. Choose an access control model for: a hospital records system, a cloud platform with tags, a military archive, and a shared folder. Justify each.\n3. Describe the Kerberos TGT and service ticket flow in your own words.\n4. Score and treat three risks for a college: ransomware, a lost laptop, and a website outage on result day.\n5. Write one policy, one standard and one procedure about MFA.\n6. A system has RPO 15 minutes and RTO 2 hours. What does this require in practice?'
  },
  mini: {
    title: 'Mini project: governance and risk roadmap',
    objective: 'Set up a security governance program for a small health-tech company preparing for ISO 27001 and SOC 2.',
    requirements: [
      'A governance charter with committee structure, CISO responsibilities and a RACI matrix.',
      'A risk register with ten scored risks and treatments.',
      'An information security policy and an access control policy.',
      'An RBAC matrix with separation of duties and PAM controls.',
      'A gap analysis and audit plan with milestones.'
    ],
    deliverable: 'A document pack ready for leadership review.'
  },
  takeaways: [
    'Identity is the new perimeter: strong, phishing-resistant authentication and least-privilege authorization.',
    'Manage the whole identity lifecycle, including movers and leavers.',
    'Privileged access needs vaulting, JIT elevation and monitoring.',
    'Risk = likelihood × impact; every risk gets a treatment, an owner and a date.',
    'Frameworks and audits turn security into something leaders can measure and trust.'
  ],
  quickRef: [
    'Factors: know · have · are · passkeys = phishing-resistant',
    'RBAC role · ABAC attributes · DAC owner · MAC labels',
    'Kerberos (AD) · SAML (XML SSO) · OAuth (delegation) · OIDC (identity on OAuth)',
    'Treat: mitigate · transfer · avoid · accept',
    'NIST CSF 2.0: Govern · Identify · Protect · Detect · Respond · Recover · RPO = data loss · RTO = downtime'
  ],
  refs: [
    ['NIST Cybersecurity Framework 2.0', 'https://www.nist.gov/cyberframework'],
    ['ISO/IEC 27001 overview', 'https://www.iso.org/standard/27001'],
    ['CIS Critical Security Controls v8', 'https://www.cisecurity.org/controls'],
    ['FIDO Alliance: passkeys', 'https://fidoalliance.org/passkeys/'],
    ['NIST SP 800-63B Digital Identity Guidelines', 'https://pages.nist.gov/800-63-4/sp800-63b.html']
  ],
  quiz: [
    ['Which authentication method is phishing-resistant?', ['SMS OTP', 'Authenticator app codes', 'FIDO2 passkeys', 'Security questions'], 2, 'Passkeys are bound to the real site’s domain, so a fake site cannot use them.'],
    ['Which access model decides using attributes such as tags, time and location?', ['RBAC', 'ABAC', 'DAC', 'MAC'], 1, 'Attribute-Based Access Control evaluates context dynamically.'],
    ['Buying cyber insurance is which risk treatment?', ['Mitigate', 'Transfer', 'Avoid', 'Accept'], 1, 'It shifts financial impact to a third party.'],
    ['How many functions does NIST CSF 2.0 have?', ['4', '5', '6', '12'], 2, 'Govern, Identify, Protect, Detect, Respond, Recover.'],
    ['What does RPO measure?', ['Maximum downtime', 'Maximum acceptable data loss, measured in time', 'Number of backups', 'Recovery cost'], 1, 'RPO sets how often you must back up; RTO sets how fast you must restore.']
  ],

  skills: ['Compare authentication factors', 'Design RBAC with separation of duties', 'Explain SSO protocols', 'Build a risk register', 'Map controls to frameworks'],
  prereq: ['Module 01 (risk and controls)', 'Module 03 (Active Directory)', 'Module 12 (cloud IAM)'],
  analogy: 'A company is a hotel: identity management issues key cards on check-in, updates them when guests change rooms and deactivates them at check-out; the master key is locked in the manager’s safe and signed out per use (PAM); and the hotel’s rulebook, insurance and safety inspections are governance, risk and compliance.',
  why: 'Stolen credentials and excessive access are behind most breaches, and every regulated business must prove its controls to customers and auditors. IAM and GRC roles turn security into decisions the business can fund and measure.',
  workflow: {
    title: 'Running a quarterly access review',
    nodes: [
      ['export', 'Export entitlements', 'From IdP, AD, cloud, apps', 'Systems', 'Who has what', 'Pull current access for every user from the identity provider, Active Directory, cloud IAM and key applications.'],
      ['compare', 'Compare with roles', 'Expected vs actual', 'Role catalog', 'Differences', 'Compare each user’s access with what their current role should grant. Flag leftovers from old jobs and dormant accounts.'],
      ['sod', 'Check SoD', 'Toxic combinations', 'Access sets', 'Conflicts', 'Look for combinations no single person should hold, such as creating and approving payments, or writing code and approving its production release.'],
      ['certify', 'Manager certification', 'Keep or remove', 'Review list', 'Signed decisions', 'Each manager confirms or removes their team’s access. Unanswered reviews default to removal after the deadline.'],
      ['remove', 'Remediate', 'Revoke and log', 'Decisions', 'Clean access', 'Remove access through the normal provisioning system so it is logged, and fix the process that let the creep happen.'],
      ['evidence', 'Keep evidence', 'For auditors', 'Records', 'Audit trail', 'Store the export, decisions and remediation tickets: ISO 27001 and SOC 2 auditors will ask for them.']
    ],
    explanation: 'Access reviews are one of the most commonly tested controls in audits, and one of the best defenses against insider misuse.'
  },
  caseStudy: {
    title: 'A governance failure behind a technical breach (Equifax, 2017)',
    problem: 'An urgent alert about a critical Apache Struts vulnerability was issued, but the patch did not reach an internet-facing system.',
    data: 'Alert distribution lists, asset inventory, patch records, certificate management.',
    steps: ['The security alert was distributed, but ownership of the affected application was unclear.', 'The asset inventory and scans did not identify the vulnerable system.', 'An expired certificate on a traffic-inspection device hid the data exfiltration for months.', 'Personal data of about 147 million people was exposed, with major legal and leadership consequences.'],
    result: 'Clear ownership, accurate inventory, patch SLAs, certificate management and leadership oversight are governance controls, and their absence caused a technical disaster.',
    limitations: 'Simplified summary; read the official reports for details.'
  },
  exercises: [
    { title: 'Pick the treatment', objective: 'Choose a risk treatment.', problem: 'An old internet-facing server cannot be patched and is no longer needed by the business. Best treatment?', options: ['Accept', 'Transfer', 'Avoid: decommission it', 'Ignore'], answer: 2, hints: ['Can the activity simply stop?'], solution: ['If the system is not needed, removing it eliminates the risk.'], explanation: 'Avoidance is often the cheapest treatment for legacy systems.' },
    { title: 'Compute the score', objective: 'Use the 5×5 matrix.', problem: 'Likelihood 3, impact 5. What is the risk score?', answer: 15, hints: ['Multiply.'], solution: ['3 × 5 = 15.'], explanation: 'On a 25-point scale, 15 or more is usually high.' },
    { title: 'SSO protocol', objective: 'Recognize protocols.', problem: 'A modern web app wants users to “Sign in with Google” and receive a signed ID token (JWT). Which protocol is this?', options: ['Kerberos', 'OpenID Connect', 'SNMP', 'FTP'], answer: 1, hints: ['Identity layer on OAuth 2.0.'], solution: ['OIDC adds an ID token to OAuth 2.0 flows.'], explanation: 'OAuth alone is for authorization, not identity.' },
    { type: 'Short answer', title: 'Name the principle', objective: 'Recognize separation of duties.', problem: 'What is the principle that prevents one person from both creating and approving a payment? (three words)', accept: ['separation of duties', 'segregation of duties'], hints: ['SoD.'], solution: ['Separation (segregation) of duties.'], explanation: 'It limits fraud and mistakes by requiring two people for sensitive actions.' }
  ],
  checks: [
    ['What is “access creep”?', ['Slow logins', 'Accumulating access from old roles that was never removed', 'A malware type', 'A network delay'], 1, 'Movers keep old rights unless reviews remove them.'],
    ['SOC 2 Type II differs from Type I because it:', ['Is cheaper', 'Tests that controls operated over a period, not just their design', 'Covers only privacy', 'Is a law'], 1, 'Type II tests operating effectiveness over months.'],
    ['Which document type is advisory, not mandatory?', ['Policy', 'Standard', 'Procedure', 'Guideline'], 3, 'Guidelines recommend; the others require.']
  ],
  cheat: ['Passkeys > TOTP > SMS > password only', 'Joiner · Mover · Leaver · Review', 'JIT admin via PAM', 'L × I → treat → owner → date', 'CSF 2.0 · ISO 27001 · SOC 2 · PCI DSS · CIS v8'],
  next: 'Module 15 brings everything together in a capstone project and a career plan: portfolio, certifications, resume and interviews.'
};
