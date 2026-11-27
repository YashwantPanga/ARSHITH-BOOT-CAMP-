export default {
  n: 12,
  title: 'Cloud Security & Infrastructure Security',
  description: 'The shared responsibility model, security services across AWS, Azure and GCP, VPC segmentation with security groups and NACLs, least-privilege IAM and Zero Trust, envelope encryption with KMS, container and Kubernetes hardening, Infrastructure as Code scanning, CSPM, common misconfigurations and cloud incident lessons.',
  intro: 'In the cloud, the security boundary is no longer racks, cables and an office firewall. Identity and access policies, API keys, Infrastructure as Code and container orchestrators form the new perimeter. One wrong checkbox can make a storage bucket public to the whole Internet, and automated scanners will usually find it within hours.\n\nThis module starts with the shared responsibility model, the single most misunderstood idea in cloud security. It then maps the equivalent security services across AWS, Azure and GCP, so you can work on any of them. You will design least-privilege IAM policies, segment cloud networks, understand envelope encryption with KMS, harden containers and Kubernetes, scan Terraform before it is deployed, and monitor posture continuously.\n\nYou do not need a company account to practice. Every lab fits in free tiers or runs locally with LocalStack, Docker, Minikube, Terraform and Checkov. If you do use a real cloud account, set a billing alert first and delete what you create at the end of each lab.',
  objectives: [
    'Explain the shared responsibility model for IaaS, PaaS and SaaS.',
    'Map core security services across AWS, Azure and GCP.',
    'Write least-privilege IAM policies and apply Zero Trust principles.',
    'Segment cloud networks with security groups, NACLs and private endpoints.',
    'Explain envelope encryption and protect storage and secrets.',
    'Harden containers and Kubernetes, scan IaC, and monitor posture with CSPM.'
  ],
  terms: [
    ['Shared responsibility model', 'The provider secures the cloud itself; the customer secures what they put in it.'],
    ['IAM', 'Identity and Access Management: users, roles, groups and the policies that grant permissions.'],
    ['Least privilege', 'Granting only the minimum actions on the minimum resources needed.'],
    ['Zero Trust', 'Never trust by network location; verify every request with identity, device and context.'],
    ['VPC / VNet', 'A private, isolated virtual network for your cloud resources.'],
    ['Security group', 'A stateful, allow-only firewall at the instance (network interface) level.'],
    ['NACL', 'A stateless subnet-level firewall with numbered allow and deny rules.'],
    ['KMS', 'Key Management Service: managed creation, storage and use of encryption keys.'],
    ['Envelope encryption', 'Data is encrypted with a data key (DEK), and the DEK is encrypted with a master key in KMS.'],
    ['IMDSv2', 'A token-based version of the AWS instance metadata service that blocks simple SSRF credential theft.'],
    ['IaC', 'Infrastructure as Code: infrastructure defined in files such as Terraform, which can be scanned before deployment.'],
    ['CSPM', 'Cloud Security Posture Management: continuous checks of cloud configuration against benchmarks.'],
    ['Pod Security Standards', 'Kubernetes profiles (Privileged, Baseline, Restricted) enforced at admission time.']
  ],
  diagramTitle: 'Shared responsibility and a hardened cloud network',
  ascii: '               IaaS (VM)        PaaS (managed DB)     SaaS (M365)\n CUSTOMER    data, IAM, OS,     data, IAM, app,       users, MFA, data,\n (IN cloud)  apps, firewall      DB configuration      sharing settings\n PROVIDER    facilities, hardware, hypervisor  (+ OS and engine for PaaS,\n (OF cloud)  + everything except data and access for SaaS)\n\n Internet -> [WAF + load balancer]  public subnet\n                  |  SG: 443 from LB only\n             [App tier]             private subnet  (IMDSv2, IAM role, no keys)\n                  |  SG: 5432 from app SG only\n             [Database]             isolated subnet (KMS-encrypted, no public IP)\n Logs: CloudTrail / Activity Log -> SIEM · CSPM checks drift · GuardDuty / Defender',
  diagramExplain: 'The provider always secures the physical layers; customers always own their data, identities and access. A hardened cloud network keeps only the load balancer public, places application and database tiers in private subnets that accept traffic only from the tier above, encrypts data with KMS, and sends logs to detection services.',
  sections: [
    {
      h: '1. The shared responsibility model',
      t: 'Renting a flat is a good way to picture cloud security. The owner is responsible for the building: the walls, the lift, the main gate and the water supply. You are responsible for locking your own door, deciding who gets a spare key and keeping your valuables safe. If you leave your door open, the building owner did not fail.\n\nThe cloud works the same way. The provider secures the cloud itself: data centers and facilities, hardware, the hypervisor and the host network. The customer secures what is in the cloud: data, identities and configurations. A common cause of cloud breaches is a customer assuming the provider protects their data and settings. It does not.\n\nThe split shifts with the service model, as the table shows. With IaaS, such as an EC2 virtual machine, you patch the operating system, manage firewall rules and run your applications. With PaaS, such as RDS, the provider also patches the OS and database engine, but you still control the data, IAM and database settings. With SaaS, such as Microsoft 365, the provider runs almost everything, yet user accounts, MFA, sharing settings and your data stay your job.\n\nOne line never moves: in every model, the customer owns data and access. A provider can give you encryption and MFA features, but only you can switch them on and use them correctly.',
      table: [
        ['Service model', 'Customer responsibility', 'Provider responsibility'],
        ['IaaS (EC2, Azure VM, Compute Engine)', 'Data, IAM, OS updates, applications, firewall rules', 'Facilities, hardware, hypervisor, host network'],
        ['PaaS (RDS, Azure SQL, App Engine)', 'Data, IAM, application code, database configuration', 'Also OS patching and database engine updates'],
        ['SaaS (M365, Salesforce, Workspace)', 'User access, data classification, MFA, sharing settings', 'Everything else, including the software and backups']
      ]
    },
    {
      h: '2. Security services across AWS, Azure and GCP',
      t: 'AWS, Azure and GCP use different product names, but the building blocks are the same. It is like the same dish having different names in different states: the recipe changes a little, but you can recognize it. Once you understand the idea behind each service, moving between clouds becomes much easier.\n\nEvery cloud has the same layers. An identity service decides who you are: AWS IAM, Microsoft Entra ID, or Cloud Identity and IAM in GCP. An access model decides what you may do: JSON policies in AWS, RBAC with Conditional Access in Azure, and predefined or custom IAM roles in GCP. A key service stores encryption keys: AWS KMS and CloudHSM, Azure Key Vault and Managed HSM, Google Cloud KMS and Cloud HSM. Networking gives you a private network with firewall rules, and threat detection services watch logs for attacks.\n\nIn practice, a job posting may ask for “AWS security” while your college lab used Azure. Use the table to translate. If you know how Azure NSGs filter traffic for a VNet, you already understand most of AWS security groups and NACLs for a VPC.\n\nThe mistake to avoid is learning only menu clicks in one console. Learn the concept first, such as “identity”, “key management” or “network filtering”, then learn each provider’s name for it. Concepts stay the same for years, while console screens change every few months.',
      table: [
        ['Domain', 'AWS', 'Azure', 'GCP'],
        ['Identity', 'IAM (users, groups, roles)', 'Microsoft Entra ID', 'Cloud Identity & IAM'],
        ['Access model', 'JSON policies', 'RBAC & Conditional Access', 'IAM roles (predefined and custom)'],
        ['Keys', 'AWS KMS, CloudHSM', 'Key Vault, Managed HSM', 'Cloud KMS, Cloud HSM'],
        ['Networking', 'VPC, security groups, NACLs', 'VNet, NSGs', 'VPC, firewall rules'],
        ['Threat detection', 'GuardDuty', 'Defender for Cloud', 'Security Command Center'],
        ['Audit logs', 'CloudTrail, CloudWatch', 'Azure Monitor, Activity Log', 'Cloud Audit Logs'],
        ['Storage protection', 'S3 Block Public Access, bucket policies', 'Storage firewall, private endpoints', 'Uniform bucket-level access']
      ]
    },
    {
      h: '3. Network segmentation: security groups vs NACLs',
      t: 'A cloud network is protected by two layers of filtering, and you should use both together. Think of a college: a guard at the main gate checks everyone entering the campus, and each lab has its own door with a register. The gate is like a network ACL on the subnet. The lab door is like a security group on each instance.\n\nThe table shows the key differences. A security group is attached to an instance’s network interface. It is stateful: if inbound traffic is allowed, the reply goes out automatically. It only has allow rules, and everything else is denied. A network ACL sits at the subnet boundary. It is stateless, so you must allow both the request and the reply, including the high ephemeral ports. Its rules can allow or deny, and they are checked in numbered order, lowest first, until one matches.\n\nA good design places the web load balancer in a public subnet. Application servers and databases go in private subnets with no public IP. The database security group allows port 5432 only from the application servers’ security group, not from an IP range. Admin access goes through SSM Session Manager, or a bastion host behind a VPN. Never open ports 22 or 3389 to 0.0.0.0/0.\n\nAWS PrivateLink and private endpoints keep traffic to cloud services such as S3 off the public Internet. Your servers can reach the service without any Internet gateway at all.',
      table: [
        ['', 'Security group', 'Network ACL'],
        ['Operates at', 'Network interface (instance)', 'Subnet boundary'],
        ['State', 'Stateful: return traffic allowed automatically', 'Stateless: both directions must be allowed'],
        ['Rule evaluation', 'All rules together', 'In numbered order, lowest first'],
        ['Rule actions', 'Allow only (implicit deny)', 'Allow and deny']
      ]
    },
    {
      h: '4. Identity is the new perimeter: least-privilege IAM',
      t: 'In the cloud, whoever holds valid credentials can do whatever those credentials allow, from anywhere in the world. That is why identity is the new perimeter. Think of a hotel key card: a good card opens only your room, only during your stay, and not the manager’s office.\n\nLeast privilege means granting only the actions needed, only on the resources needed, only under the right conditions, such as MFA, TLS or a known source network. The example below shows this. The “before” policy allows s3:* on every resource, which means full control of every bucket in the account. The “after” policy allows only reading objects from one bucket, and only when the request uses TLS. If the key leaks, the damage is limited to that bucket.\n\nPrefer roles and short-lived credentials over long-lived access keys. A role gives temporary credentials that expire, often within an hour, while an access key works until someone deletes it. Lock the root account away with hardware MFA and do not use it for daily work. Review unused permissions regularly; most clouds have tools that show which permissions were never used.\n\nThere are two common access models. RBAC assigns permissions by role, such as “developer” or “auditor”. ABAC evaluates attributes dynamically, such as resource tags, time of day or IP address. A beginner mistake is copying a wildcard policy from a forum because it “just works”. It works for attackers too.',
      code: '// BEFORE: full control of every bucket in the account\n{ "Effect": "Allow", "Action": "s3:*", "Resource": "*" }\n\n// AFTER: read one bucket\'s objects, only over TLS\n{\n  "Effect": "Allow",\n  "Action": ["s3:GetObject"],\n  "Resource": "arn:aws:s3:::app-data-bucket-prod/*",\n  "Condition": { "Bool": { "aws:SecureTransport": "true" } }\n}',
      lang: 'json'
    },
    {
      h: '5. Data protection and envelope encryption',
      t: 'Encrypting terabytes of data directly inside a hardware security module (HSM) is impractical: it would be far too slow. So clouds use envelope encryption. Picture a bank locker. Your valuables go in a box locked with your own small key, and that small key is kept inside the bank’s main vault, which only the bank can open.\n\nThe steps are as follows. The storage service asks KMS for a data key. KMS returns two things: a plaintext data key (DEK) and the same key encrypted under the master key, which never leaves KMS. The service encrypts the data with the plaintext DEK, stores only the encrypted DEK next to the data, and erases the plaintext DEK from memory. To decrypt, the service sends the encrypted DEK back to KMS. KMS decrypts it only if the caller has IAM permission, and every such call is logged.\n\nThis design means a stolen disk is useless without KMS access, and you can disable one master key to make all its data unreadable at once. Your audit log also shows exactly who decrypted what and when.\n\nEncryption is only one control. Turn on S3 Block Public Access at the account or organization level, as the command below does for one bucket. Require TLS for all requests, use MFA Delete or object lock for critical buckets so data cannot be quietly removed, and keep passwords and API keys in a secrets manager, not in code or environment files.',
      code: 'aws s3api put-public-access-block --bucket my-lab-bucket \\\n  --public-access-block-configuration \\\n  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"'
    },
    {
      h: '6. Container and Kubernetes security',
      t: 'Containers share the host kernel. A virtual machine is like a separate house, but a container is more like a room in a shared PG: everyone uses the same main door and wiring. If one room is badly secured, a tenant can sometimes reach the shared areas. A weakly isolated container can escape to the node and then compromise the whole cluster.\n\nKubernetes adds several layers to protect, shown in the table. The API server controls the cluster, so it needs TLS, no anonymous access and ideally a private endpoint. RBAC decides what each user and service account can do; application pods should never have cluster-admin, and you can disable automountServiceAccountToken for pods that do not call the API. Pod Security Admission can enforce the “Restricted” Pod Security Standard, which blocks privileged containers that could escape to the host.\n\nSecurity starts with the image itself. The Dockerfile below creates a normal user called appuser, copies the files with that user as owner, and switches to it with the USER instruction. The application then runs without root rights. If an attacker exploits a bug in app.py, they get a limited user inside the container, not root, which makes an escape much harder.\n\nA quick check is to run “docker run --rm myimage whoami”. If it prints root, the image needs fixing. Combine this with a slim base image, a read-only filesystem where possible and network policies between namespaces.',
      table: [
        ['Area', 'Risk', 'Control'],
        ['API server', 'Unauthenticated cluster takeover', 'TLS, no anonymous auth, private endpoint only'],
        ['RBAC', 'A pod’s service account stealing secrets', 'No cluster-admin for apps; namespace roles; disable automountServiceAccountToken'],
        ['Pod security', 'Privileged container escaping to the host', 'Pod Security Standards “Restricted” via Pod Security Admission'],
        ['Filesystem', 'Attacker writing tools or miners', 'readOnlyRootFilesystem: true; emptyDir for scratch space'],
        ['Network', 'Lateral movement between services', 'Default-deny NetworkPolicy; allow explicit flows'],
        ['Runtime', 'Exploits inside containers', 'Runtime monitoring (for example Falco) for unexpected shells'],
        ['etcd', 'Holds all cluster state and secrets', 'Encrypt at rest and restrict access']
      ],
      code: '# Dockerfile hardening\nFROM python:3.12-slim\nRUN useradd --create-home appuser\nWORKDIR /app\nCOPY --chown=appuser . .\nUSER appuser                 # never run the app as root\nCMD ["python", "app.py"]'
    },
    {
      h: '7. Infrastructure as Code and CSPM',
      t: 'Infrastructure as Code (IaC) means describing servers, networks and buckets in files such as Terraform, CloudFormation or Kubernetes manifests. Because the infrastructure is written as text, you can check it before it exists. This is called shifting security left. It is like checking a building plan before construction starts, rather than breaking walls after the building is finished.\n\nScanners such as Checkov and tfsec read these files and compare them against hundreds of rules. They flag problems such as unencrypted buckets, port 22 open to the world, or missing audit logging. In the output below, Checkov ran on a Terraform folder, passed 28 checks and failed 3, and names the exact rule and resource for each failure. Added to a CI pipeline, a failed check can stop the merge, so the mistake never reaches the cloud.\n\nScanning code is not enough, because people still change settings by hand in the console, and those changes are not in Terraform. Cloud Security Posture Management (CSPM) tools fill this gap. After deployment, they continuously compare live configuration with CIS and NIST baselines and alert on drift, such as a bucket that someone made public on a Friday evening.\n\nUse both together. IaC scanning stops new mistakes at the door, and CSPM catches the ones that appear later. Treat a failed check like a failed unit test: fix it, or record a clear, approved exception.',
      code: '$ checkov -d ./terraform --framework terraform\nPassed checks: 28, Failed checks: 3\nCheck: CKV_AWS_20: "Ensure the S3 bucket has a policy preventing non-TLS requests"\n        FAILED for resource: aws_s3_bucket.customer_data   File: /terraform/s3.tf:12-25'
    },
    {
      h: '8. Common misconfigurations and fixes',
      t: 'Most cloud breaches come from configuration, not exotic exploits. Attackers do not need a zero-day when a database is open to the Internet or an access key sits in a public GitHub repository. It is like a thief who does not pick the lock because the door was left open.\n\nThe table lists the usual suspects. A public storage bucket happens when account-level Block Public Access is off; the fix is to enforce it organization-wide with a service control policy (SCP). Server-side request forgery (SSRF) to the instance metadata service is another classic. With IMDSv1, a vulnerable web app can be tricked into fetching http://169.254.169.254 and returning the instance’s temporary credentials, with no token needed. Requiring IMDSv2 (HttpTokens=required, hop limit 1) blocks most of these attacks. Ports 22 or 3389 open to 0.0.0.0/0 usually come from admins in a hurry; delete the rule and use SSM Session Manager or a VPN with a bastion.\n\nWhen you investigate a cloud account, start with these checks before anything advanced: public buckets, open management ports, long-lived access keys, disabled logging and wildcard IAM policies. CSPM tools and the free CIS benchmark checks automate much of this.\n\nEach fix in the table removes a whole class of problems, not just one incident. That is why organizations prefer guardrails at the organization level over fixing accounts one by one.',
      table: [
        ['Misconfiguration', 'Root cause', 'Fix'],
        ['Public storage bucket', 'No account-level Block Public Access', 'Enforce Block Public Access organization-wide (SCP)'],
        ['SSRF to instance metadata', 'IMDSv1 allows tokenless access', 'Require IMDSv2 (HttpTokens=required, hop limit 1)'],
        ['Ports 22/3389 open to 0.0.0.0/0', 'Admins opening management ports', 'Delete the rule; use SSM Session Manager or VPN + bastion'],
        ['Access keys in GitHub', 'Hard-coded credentials', 'Revoke immediately; use roles, OIDC federation or a secrets manager'],
        ['Wildcard IAM (“*:*”)', 'Convenience during development', 'Least-privilege policies and access reviews']
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 12: least privilege, storage lockdown and IaC scanning',
    steps: [
      ['Start LocalStack (or use a free-tier sandbox account you own) and create a test bucket.', 'pip install localstack awscli-local\nlocalstack start -d\nawslocal s3 mb s3://lab-secure-bucket', 'LocalStack emulates AWS APIs on your machine: no cost and no risk to real accounts.'],
      ['Write an over-privileged policy (s3:* on *), then refactor it to read-only on one bucket with aws:SecureTransport, and test both with the IAM policy simulator.', null, 'Record a pass/fail table: the refactored policy must deny DeleteObject and requests to other buckets.'],
      ['Enable Block Public Access and default KMS encryption on the bucket.', 'awslocal s3api put-public-access-block --bucket lab-secure-bucket --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"', 'Account-wide Block Public Access stops one mistaken bucket policy from exposing data.'],
      ['Scan a Terraform folder with Checkov, fix the failures, and scan again until it passes.', 'pip install checkov\ncheckov -d ./terraform --framework terraform', 'Add the scan to a CI pipeline with a hard fail on critical findings (Module 13).']
    ]
  },
  examples: [
    {
      title: 'Auditing IAM policies for wildcards',
      lang: 'python',
      code: 'policies = {\n    "dev-admin":   {"Action": "*", "Resource": "*"},\n    "app-reader":  {"Action": ["s3:GetObject"], "Resource": "arn:aws:s3:::app-data/*"},\n    "backup-job":  {"Action": "s3:*", "Resource": "*"},\n    "logs-writer": {"Action": ["logs:PutLogEvents"], "Resource": "arn:aws:logs:*:*:log-group:app"},\n}\n\nfor name, p in policies.items():\n    actions = p["Action"] if isinstance(p["Action"], list) else [p["Action"]]\n    issues = []\n    if any(a == "*" or a.endswith(":*") for a in actions):\n        issues.append("wildcard action")\n    if p["Resource"] == "*":\n        issues.append("all resources")\n    print(f"{name:12} {\'FLAG: \' + \', \'.join(issues) if issues else \'ok\'}")',
      explanation: 'A tiny version of what CSPM and IAM Access Analyzer do: find policies that grant every action or every resource, then narrow them to least privilege.'
    }
  ],
  best: [
    'Know exactly which layers you own for every service you use.',
    'Use roles and short-lived credentials; delete root access keys and protect root with hardware MFA.',
    'Write least-privilege policies with conditions (MFA, TLS, source network).',
    'Block public access to storage at the organization level and encrypt everything with KMS.',
    'Require IMDSv2, keep workloads in private subnets, and never expose 22/3389 to the Internet.',
    'Scan IaC in CI, run CSPM continuously, and send cloud audit logs to the SIEM.'
  ],
  mistakes: [
    'Assuming the cloud provider secures your data and configurations.',
    'Granting s3:* or *:* “temporarily” and never removing it.',
    'Hard-coding access keys in code, laptops or CI variables without rotation.',
    'Running containers as root or privileged.',
    'Turning off CloudTrail or Activity Logs to save cost.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. For an EC2 web server, an RDS database and Microsoft 365, list what you are responsible for.\n2. Explain the difference between a security group and a NACL with one example rule for each.\n3. Rewrite “Action: s3:*, Resource: *” as a least-privilege policy for an app that only reads one bucket.\n4. Explain envelope encryption in your own words and why it scales.\n5. List five Kubernetes hardening settings and what each prevents.\n6. A developer pushed an access key to a public repository ten minutes ago. Write your first five actions.'
  },
  mini: {
    title: 'Mini project: cloud security audit',
    objective: 'Audit a lab cloud environment against the CIS Foundations Benchmark.',
    requirements: [
      'An architecture threat model: VPC boundaries, IAM trust, data paths and egress.',
      'IAM review: inactive credentials, root MFA, wildcard permissions.',
      'Storage and encryption posture: KMS, TLS-only policies, public access blocks.',
      'A CI pipeline that runs Checkov and fails on critical findings.',
      'A risk-prioritized remediation roadmap.'
    ],
    deliverable: 'An audit report with evidence from LocalStack or a free-tier sandbox and the working pipeline.'
  },
  takeaways: [
    'Shared responsibility: the provider secures the cloud; you secure what you put in it.',
    'Identity is the new perimeter: least privilege, roles, MFA and short-lived credentials.',
    'Segment with private subnets, security groups and NACLs; keep admin ports off the Internet.',
    'Encrypt with KMS (envelope encryption) and block public storage by default.',
    'Shift left with IaC scanning, and watch drift with CSPM and cloud audit logs.'
  ],
  quickRef: [
    'SG = stateful, allow-only, instance · NACL = stateless, allow + deny, subnet',
    'IAM: no "*", add Conditions (aws:MultiFactorAuthPresent, aws:SecureTransport)',
    'IMDSv2: HttpTokens=required · S3: Block Public Access ×4',
    'K8s: PSS Restricted · readOnlyRootFilesystem · default-deny NetworkPolicy · no cluster-admin',
    'checkov -d . · tfsec · Trivy for images'
  ],
  refs: [
    ['CIS Amazon Web Services Foundations Benchmark', 'https://www.cisecurity.org/benchmark/amazon_web_services'],
    ['NIST SP 800-207: Zero Trust Architecture', 'https://csrc.nist.gov/pubs/sp/800/207/final'],
    ['AWS Well-Architected Framework: Security Pillar', 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html'],
    ['Kubernetes Pod Security Standards', 'https://kubernetes.io/docs/concepts/security/pod-security-standards/'],
    ['Checkov documentation', 'https://www.checkov.io/']
  ],
  quiz: [
    ['Under the shared responsibility model, who patches the guest OS on an EC2 instance?', ['AWS', 'The customer', 'The hypervisor vendor', 'Nobody: it is automatic'], 1, 'In IaaS the customer owns the OS, applications and firewall rules.'],
    ['What is the main difference between a security group and a NACL?', ['Security groups are stateless; NACLs are stateful', 'Security groups are stateful; NACLs are stateless', 'NACLs work at the instance level', 'Security groups support explicit deny rules'], 1, 'Security groups track connections; NACLs evaluate each direction separately.'],
    ['In envelope encryption, which key directly encrypts the customer data?', ['The KMS master key', 'The data encryption key (DEK)', 'The HSM root secret', 'The TLS certificate'], 1, 'The DEK encrypts the data; the master key encrypts the DEK.'],
    ['What does IMDSv2 add to protect instance metadata?', ['RSA keys', 'A session token obtained with a PUT request', 'It disables 169.254.169.254', 'It encrypts metadata with S3 keys'], 1, 'Simple SSRF requests cannot perform the token exchange.'],
    ['Why set readOnlyRootFilesystem: true on containers?', ['To save RAM', 'To stop attackers modifying binaries or writing tools inside the container', 'Docker requires it', 'To run only on Linux'], 1, 'An exploited container cannot easily persist or download tools.']
  ],

  skills: ['Apply the shared responsibility model', 'Write least-privilege IAM policies', 'Design segmented cloud networks', 'Harden containers and Kubernetes', 'Scan IaC and monitor posture'],
  prereq: ['Module 02 (networking)', 'Module 05 (encryption and keys)', 'Module 06 (SSRF)'],
  analogy: 'Renting a flat in a gated society: the builder secures the compound wall, lifts and wiring (security OF the cloud), but you lock your own door, decide who gets keys, and keep valuables in a safe (security IN the cloud). Leaving your door open is not the builder’s fault.',
  why: 'Most organizations now run critical systems in the cloud, and misconfiguration is the leading cause of cloud breaches. Cloud security engineering is one of the fastest-growing roles in the field.',
  workflow: {
    title: 'Securing a new cloud workload',
    nodes: [
      ['own', 'Define ownership', 'Shared responsibility', 'Service choice', 'Your security tasks', 'List what you own for each service: for a managed database, IAM, network access, encryption settings and backups are yours even though the engine is patched for you.'],
      ['iam', 'Identity first', 'Roles, least privilege, MFA', 'Workload needs', 'Scoped policies', 'Give the workload a role with only the actions and resources it needs, add conditions, and never embed access keys.'],
      ['net', 'Network', 'Private subnets, SG/NACL', 'Architecture', 'Segmented VPC', 'Only the load balancer is public; app and database tiers accept traffic only from the tier above; admin access goes through SSM or VPN.'],
      ['data', 'Data', 'KMS, TLS, no public access', 'Storage and DB', 'Encrypted, private data', 'Enable KMS encryption, require TLS, block public access, and enable versioning or object lock for critical data.'],
      ['iac', 'Code it', 'Terraform + Checkov in CI', 'Infrastructure', 'Reviewed, scanned IaC', 'Define everything as code, review it like application code, and fail the pipeline on critical misconfigurations.'],
      ['watch', 'Watch', 'Logs, CSPM, threat detection', 'Running environment', 'Alerts and drift reports', 'Send CloudTrail/Activity logs to the SIEM, enable GuardDuty or Defender, and let CSPM flag drift from the baseline.']
    ],
    explanation: 'Identity, network, data and code controls are layered, then monitored continuously.'
  },
  caseStudy: {
    title: 'SSRF to cloud credentials (Capital One, 2019)',
    problem: 'A misconfigured web application firewall on an EC2 instance was vulnerable to SSRF, and the instance metadata service allowed tokenless access (IMDSv1).',
    data: 'Requests to 169.254.169.254, CloudTrail API calls with the instance role, S3 access logs.',
    steps: ['The attacker made the WAF request the metadata service.', 'Metadata returned temporary credentials for the instance’s IAM role.', 'The role had broad S3 read permissions.', 'More than 100 million customer records were copied from S3.'],
    result: 'IMDSv2, a least-privilege role, SSRF hardening and alerting on unusual S3 access would each have stopped or exposed the attack.',
    limitations: 'Simplified summary; read primary sources for details.'
  },
  exercises: [
    { title: 'Who patches?', objective: 'Apply shared responsibility.', problem: 'You use a managed PostgreSQL service (PaaS). Who patches the database engine?', options: ['You, the customer', 'The cloud provider', 'Nobody', 'The database vendor directly'], answer: 1, hints: ['What does “managed” take off your plate?'], solution: ['For PaaS, the provider patches the OS and engine.', 'You still own IAM, network access, encryption settings and data.'], explanation: 'Know which layer is yours for each service.' },
    { title: 'Spot the danger', objective: 'Read an IAM policy.', problem: 'A policy grants "Action": "s3:*" on "Resource": "*". What does it allow?', options: ['Read one bucket', 'Full control of every bucket and object in the account', 'Only listing buckets', 'Nothing until MFA is used'], answer: 1, hints: ['Wildcards on both action and resource.'], solution: ['s3:* = every S3 action; * = every resource.'], explanation: 'Replace it with specific actions on specific ARNs.' },
    { type: 'Short answer', title: 'Name the condition key', objective: 'Enforce TLS.', problem: 'Which AWS condition key, set to true, lets a bucket policy allow only requests made over TLS?', accept: ['aws:securetransport', 'securetransport'], hints: ['aws:Secure…'], solution: ['aws:SecureTransport'], explanation: 'Pair it with a Deny for requests where it is false.' },
    { title: 'Count the flags', objective: 'Know S3 Block Public Access.', problem: 'How many settings does S3 Block Public Access have?', answer: 4, hints: ['BlockPublicAcls, IgnorePublicAcls, …'], solution: ['BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets.'], explanation: 'Turn on all four at the account or organization level.' }
  ],
  checks: [
    ['What does CSPM do?', ['Guards data centers physically', 'Continuously checks cloud configuration against benchmarks and flags drift', 'Blocks DDoS', 'Backs up data'], 1, 'It is configuration auditing at cloud scale.'],
    ['Which Kubernetes component stores all cluster state and secrets?', ['kube-proxy', 'etcd', 'CoreDNS', 'kubelet'], 1, 'Encrypt etcd at rest and restrict access to it.'],
    ['Which is the safest way to give an EC2 app access to S3?', ['Hard-coded access keys', 'An IAM role attached to the instance', 'The root account', 'A public bucket'], 1, 'Roles provide short-lived, rotated credentials automatically.']
  ],
  cheat: ['OF the cloud = provider · IN the cloud = you', 'Roles > keys · no wildcards · add conditions', 'Private subnets · SG + NACL · no 22/3389 to the world', 'KMS + TLS + Block Public Access', 'Checkov in CI · CSPM · CloudTrail to SIEM'],
  next: 'Module 13 builds security into software delivery: DevSecOps pipelines, SAST, SCA, secrets scanning, supply-chain integrity and secure SDLC.'
};
