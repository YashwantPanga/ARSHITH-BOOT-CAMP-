export default {
  n: 3,
  title: 'Linux & Windows OS Security',
  description: 'OS architecture, the Linux shell and file system, users, groups and permissions, processes, services and packages, SSH and logs; Windows accounts, UAC, NTFS ACLs, Active Directory basics, PowerShell, Defender, Firewall, Event Viewer, and hardening checklists for both.',
  intro: 'Operating systems are where attacks finally land: malware runs on them, attackers escalate privileges on them, and defenders collect logs from them. A SOC analyst reads Linux auth logs and Windows Event IDs every day; a penetration tester looks for a misconfigured permission to become root; a cloud engineer hardens server images before they ship.\n\nThink of an operating system as the management office of an apartment building. It decides who gets a key, which doors each key opens, and it keeps a visitor register at the gate. Most OS security comes down to giving the right keys to the right people and reading that register carefully.\n\nThis module covers Linux first (architecture, terminal, permissions, services, SSH and logs) and then Windows (accounts, UAC, NTFS permissions, Active Directory, PowerShell, Defender and Event Viewer). It ends with hardening checklists you can apply to real machines. Practice in a virtual machine (VirtualBox or VMware) so you can break things safely.',
  objectives: [
    'Explain OS architecture and the role of the kernel, shell and services.',
    'Navigate Linux with the terminal and manage files, users, groups, processes and packages.',
    'Read and set Linux and NTFS permissions.',
    'Use SSH, logs and basic Bash safely.',
    'Describe Windows security components: accounts, UAC, Defender, Firewall, Event Viewer and Active Directory.',
    'Apply hardening checklists to both platforms.'
  ],
  terms: [
    ['Kernel', 'The core of the OS that manages hardware, memory, processes and files; programs ask it for services through system calls.'],
    ['Shell', 'The command interpreter (bash, zsh, PowerShell) that runs what you type.'],
    ['root / Administrator', 'The all-powerful account on Linux / Windows. Use it only when needed.'],
    ['sudo', 'Runs one command with elevated rights and logs who did it.'],
    ['SUID', 'A Linux permission bit that runs a program as its owner (often root); misconfigured SUID binaries enable privilege escalation.'],
    ['UAC', 'User Account Control: Windows prompts before administrator actions, even for admins.'],
    ['ACL', 'Access Control List: the list of who may do what on a file or folder (NTFS).'],
    ['SID / access token', 'Windows identifies users by SIDs; every process carries a token with the user’s SIDs and privileges.'],
    ['Active Directory', 'Microsoft’s directory service: domain controllers store users, computers and groups and apply Group Policy.'],
    ['GPO', 'Group Policy Object: a set of settings pushed to many Windows machines from AD.'],
    ['Hardening', 'Reducing the attack surface of a system by removing, restricting and configuring securely.'],
    ['CIS Benchmark', 'A free, consensus-based hardening guide for an OS or application.']
  ],
  diagramTitle: 'How an OS decides access',
  ascii: '  User / program\n        |  request: open /etc/shadow  (or C:\\Data\\report.xlsx)\n        v\n  +-------------------+     Linux: owner? group? others?  r=4 w=2 x=1\n  |   Kernel /        |---> Windows: token SIDs vs ACL entries\n  |   Security ref.   |       (explicit Deny > Allow, inherited)\n  +-------------------+\n        |  allowed?                       |  denied?\n        v                                 v\n   access granted                   error + log event\n   (auditd / Event 4663)            (auth.log / Event 4625, 4656)\n\n  Hardening habits:  PATCH · MINIMIZE · RESTRICT · LOG · ENCRYPT',
  diagramExplain: 'Every file open, login and admin action goes through an access decision. Linux checks owner, group and others permission bits; Windows compares the process token with the object’s ACL, where an explicit Deny beats Allow. Both write evidence to logs, which is why logs are a defender’s first stop.',
  sections: [
    {
      h: '1. Linux architecture and distributions',
      t: 'The kernel is the core of the operating system. It manages hardware, memory, processes and files, and decides which program gets the CPU and which program may open which file. Think of the station master at a busy railway station: no train (program) uses a platform until the station master allows it.\n\nApplications never touch the hardware directly. They request services from the kernel through system calls. When a program wants to read a file, it calls open() and read(); the kernel checks the permissions, reads the disk and hands back the data. This split is a security boundary. Normal programs run in user mode with limited rights, while the kernel runs in kernel mode with full control.\n\nA distribution bundles the kernel with tools and a package manager, plus a desktop or server setup. Ubuntu and Debian use apt, RHEL, Rocky and Fedora use dnf, and Alpine, popular for small containers, uses apk. Kali Linux is a Debian-based distribution packed with security testing tools; use it only in authorized labs. On any system, uname -r shows the kernel version and cat /etc/os-release shows the distribution.\n\nThis matters because a bug in the kernel affects every program on the machine. Kernel updates are among the most important patches you will ever apply, so never postpone them for long.',
      table: [
        ['Distribution', 'Typical use', 'Package manager'],
        ['Ubuntu / Debian', 'Servers, desktops, learning', 'apt'],
        ['Kali Linux', 'Security testing toolkit (authorized labs only)', 'apt'],
        ['RHEL / Rocky / Fedora', 'Enterprise servers', 'dnf / yum'],
        ['Alpine', 'Minimal containers', 'apk']
      ]
    },
    {
      h: '2. Terminal, shell and file system',
      t: 'The terminal is a text window, and the shell is the program inside it. The shell interprets your commands and runs them. Bash is the most common shell on Linux. Typing commands feels slow at first, like learning to ride a bicycle, but within a week it becomes faster than clicking, and you can repeat the same steps on a hundred servers.\n\nMost commands follow one pattern: command, then options, then arguments. In ls -la /var/log, ls is the command, -la are options (long listing, include hidden files), and /var/log is the argument. A pipe (|) sends the output of one command into the next, so grep "error" app.log | sort | uniq -c finds error lines, sorts them and counts repeats. When unsure, man ss or ss --help shows the built-in help.\n\nThe file system is one tree that starts at /, called the root directory. There are no drive letters like C: on Windows. Security people live in /etc (configuration) and /var/log (evidence). /etc holds files such as passwd, sudoers and the SSH settings. /var/log holds the logs you read after an incident; for example, sudo tail -f /var/log/auth.log shows logins live as they happen.\n\nAlso keep an eye on /tmp. Every user can write there, so attackers often drop their tools in it. The table lists the key folders, and the code block shows the commands you will use most.',
      table: [
        ['Path', 'Contents'],
        ['/etc', 'System configuration (passwd, ssh, sudoers)'],
        ['/home', 'User home directories'],
        ['/var/log', 'Log files'],
        ['/bin, /usr/bin', 'Programs'],
        ['/tmp', 'Temporary files (world-writable: watch it)'],
        ['/root', 'Home of the root user'],
        ['/proc', 'Live kernel and process information']
      ],
      code: 'pwd; ls -la; cd /var/log      # where am I, list, move\ncat file; less file; tail -f syslog   # read, follow live\ngrep "error" app.log | sort | uniq -c   # search and count\nman ss; ss --help                 # built-in help\nsudo systemctl restart ssh        # one command with elevated rights'
    },
    {
      h: '3. Users, groups and permissions',
      t: 'Linux is a multi-user system, so it must decide who can do what with every file. Think of a hostel: each room has an owner, the floor is a group of students, and everyone else is a visitor. A room can let the owner do anything, let floor-mates look inside, and keep visitors out completely.\n\nEach file has an owner, a group and permissions for user, group and others: read = 4, write = 2, execute = 1. Add the numbers for each class to get one digit. So rwxr-x--- = 750: the owner gets 4+2+1 = 7, the group gets 4+1 = 5, and others get 0. rw-r--r-- = 644, the usual setting for a normal file: the owner can read and write, everyone else can only read.\n\nTry it in your VM. ls -l notes.txt may show -rw-r--r-- 1 alice devs. To stop others reading it, run chmod 640 notes.txt. To change the owner and group, run sudo chown alice:devs notes.txt. To see your own user and groups, run id.\n\nThree habits prevent most permission problems. Avoid 777 (world-writable), because then any user or any compromised program can change the file. Use sudo instead of logging in as root, so each admin action is deliberate and logged. And watch SUID binaries: a SUID program runs with its owner’s rights, often root, so misconfigured ones are a classic privilege-escalation path. find / -perm -4000 2>/dev/null lists them.',
      table: [
        ['Task', 'Command'],
        ['Add user / group', 'sudo adduser alice; sudo groupadd devs'],
        ['Add to group', 'sudo usermod -aG devs alice'],
        ['Change owner', 'sudo chown alice:devs file'],
        ['Change mode', 'chmod 640 file  (or chmod u+x,g-w file)'],
        ['Lock account', 'sudo passwd -l alice'],
        ['Who am I / groups', 'id, whoami, groups'],
        ['Find SUID files', 'find / -perm -4000 2>/dev/null']
      ]
    },
    {
      h: '4. Processes, services, packages, SSH and logs',
      t: 'A running Linux server is like a busy hospital. Processes are the staff at work, services are departments that must always be open, packages are the medicines and equipment that must stay up to date, SSH is the staff entrance, and logs are the register at the front desk. A defender checks all five.\n\nEvery running program is a process with a PID, and it runs as some user. ps aux and top show what is running, and kill PID stops a process. Long-running services are managed by systemd: systemctl status ssh shows whether SSH is running, and journalctl -u ssh shows its logs. Packages are installed and updated with the package manager; on Ubuntu, sudo apt update && sudo apt upgrade keeps them patched.\n\nPatch often and remove unused packages to shrink the attack surface, because every installed package is code that could have a bug. Harden SSH with keys and by disabling password and root login. Create a key pair on your laptop with ssh-keygen -t ed25519, copy the public key to the server, then set PasswordAuthentication no and PermitRootLogin no in /etc/ssh/sshd_config and restart SSH. Bots on the Internet that try thousands of passwords now get nowhere.\n\nLogs tell you what happened. On Debian and Ubuntu, /var/log/auth.log records logins and sudo use; on RHEL it is /var/log/secure. The code block counts failed SSH logins per source IP. Run it on a server you own and you will often see hundreds of attempts from bots within one day.',
      b: [
        'Processes: ps aux, top, kill PID. Each process has a PID and runs as a user.',
        'Services (systemd): systemctl status ssh, systemctl enable/disable, journalctl -u ssh.',
        'Packages: sudo apt update && sudo apt upgrade keeps software patched.',
        'SSH: create keys with ssh-keygen -t ed25519; in /etc/ssh/sshd_config set PasswordAuthentication no and PermitRootLogin no.',
        'Logs: /var/log/auth.log (Debian/Ubuntu) or /var/log/secure (RHEL) record logins and sudo use; /var/log/syslog and journalctl cover the system.'
      ],
      code: '# count failed SSH logins per source IP (on your own server\'s log)\ngrep "Failed password" /var/log/auth.log \\\n  | awk \'{print $(NF-3)}\' | sort | uniq -c | sort -nr | head'
    },
    {
      h: '5. Linux hardening checklist',
      t: 'Hardening means changing default settings so a system offers fewer ways to attack it. A fresh Linux install is like a new flat: it works, but the locks are basic, the builder still has spare keys, and the windows have no grills. Hardening is fitting proper locks and taking back the spare keys.\n\nHardening is a checklist habit, not a one-time task. The steps follow a simple order: patch the system, remove what you do not need, restrict who can do what, turn on logging, and encrypt data. Each bullet in the list fits one of these steps. Repeat the checks on a schedule, because new software, new users and new rules change a system over time.\n\nHere is a typical first hour on a new Ubuntu server. Run sudo apt update && sudo apt upgrade and enable unattended-upgrades. Check listening ports with ss -tulpn and stop services you do not need. Set up SSH keys and disable root login. Enable the ufw firewall with only SSH allowed. Lock accounts nobody uses, and confirm that logs are being written.\n\nBenchmark your own systems with CIS Benchmarks or Lynis. Running sudo lynis audit system gives a hardening index and a list of suggestions, so you can measure progress instead of guessing. Only run it on machines you manage.',
      b: [
        'Keep the system patched (unattended-upgrades).',
        'SSH keys only, no root login; limit exposure with a host firewall (ufw / nftables).',
        'Remove unused services and packages; check listening ports with ss -tulpn.',
        'Enforce strong passwords or MFA; lock unused accounts.',
        'Least-privilege sudo rules in /etc/sudoers.d; avoid broad NOPASSWD.',
        'Enable auditd and ship logs centrally.',
        'Full-disk encryption (LUKS) on laptops; an AppArmor or SELinux profile for services.'
      ]
    },
    {
      h: '6. Windows architecture, accounts and privileges',
      t: 'Windows runs on most office laptops and in most company networks, so defenders must know how it controls access. Like Linux, Windows runs user-mode applications over a protected NT kernel. Programs such as Word and Chrome must ask the system for anything sensitive, just as a visitor must ask the reception desk before entering an office floor.\n\nA few parts matter most for security. LSASS (the Local Security Authority Subsystem Service) handles authentication and keeps login credentials in memory, which is why attackers try to dump it. The SAM database stores local accounts and their password hashes. The Registry stores system and application settings. Services are background programs that often run with high rights. UAC (User Account Control) asks for approval before a program gets administrator rights.\n\nIdentities are SIDs, and each process carries an access token. A SID (security identifier) is a unique ID for every user, group and computer, and looks like S-1-5-21-...-1001. When you log in, Windows builds a token listing your SID, your group SIDs and your privileges. Every program you start gets a copy, and Windows checks that token whenever the program opens a file or changes a setting. Run whoami /all to see your own token.\n\nA good habit follows from this: use a standard account for daily work and elevate to administrator only when needed. Malware that runs with a standard user’s token can do far less damage. The table lists the main account types.',
      table: [
        ['Account type', 'Notes'],
        ['Standard user', 'Daily use; cannot change system settings'],
        ['Administrator', 'Full control; use only when needed (UAC elevation)'],
        ['SYSTEM', 'Highest local identity, used by the OS'],
        ['Service accounts', 'Run services; use managed service accounts, not admin users'],
        ['Domain accounts', 'Managed centrally in Active Directory']
      ]
    },
    {
      h: '7. NTFS permissions',
      t: 'NTFS is the file system Windows uses, and it stores permissions on every file and folder. Think of a college library. Some students may only read books in the reading room, the library staff may add and remove books, and the head librarian decides who gets which rights. NTFS works the same way with Read, Modify and Full control.\n\nPermissions are stored in ACLs and inherit from parent folders; an explicit Deny overrides Allow. An ACL (access control list) is a list of entries, and each entry names a user or group and allows or denies certain rights. Inheritance means that setting the right rules on a top-level folder covers everything inside it. If a user belongs to two groups and one of them is explicitly denied, the Deny wins.\n\nExample: only the Finance group should edit C:\\Data. Run icacls C:\\Data to view the current ACL. Then run icacls C:\\Data /grant "Finance:(OI)(CI)M" to give Finance Modify rights. (OI) and (CI) mean the rule flows down to files and subfolders. If the folder inherited a broad entry such as “Everyone: Read” from its parent, icacls C:\\Data /inheritance:r removes the inherited entries.\n\nFolders shared over the network also have share permissions. When share and NTFS permissions combine, the most restrictive applies. If the share allows Read and NTFS allows Modify, a user connecting over the network can only read.',
      table: [
        ['Permission', 'Allows'],
        ['Full control', 'Everything, including changing permissions'],
        ['Modify', 'Read, write, delete'],
        ['Read & execute', 'View and run'],
        ['Read / Write', 'View / create and change']
      ],
      code: 'icacls C:\\Data                                    # view the ACL\nicacls C:\\Data /grant "Finance:(OI)(CI)M"         # Modify for group Finance\nicacls C:\\Data /inheritance:r                     # remove inherited permissions',
      lang: 'powershell'
    },
    {
      h: '8. Active Directory (introduction)',
      t: 'Active Directory (AD) is Microsoft’s directory service: the central address book and ID office of a company network. Think of the ID card office of a large university. It issues every student and staff card, records each person’s department, and its rules decide which buildings each card opens. Without it, every lab would need its own list of users and passwords.\n\nA domain controller (DC) stores users, computers and groups, authenticates them with Kerberos or NTLM, and applies Group Policy. Kerberos is the modern default; NTLM is older and weaker. Core concepts are domain, forest, OU (organizational unit), group and GPO. A domain is one administrative unit, such as college.local. A forest is one or more domains that trust each other. An OU is a folder for organizing objects. A group collects users who need the same rights. A GPO (Group Policy Object) is a set of settings pushed to computers and users.\n\nIn practice, when a staff member logs in to any office PC, the PC asks the DC to verify the password. A GPO linked to the Staff OU might then lock the screen after 10 minutes and block USB storage on every staff machine at once, without anyone visiting each desk.\n\nAD is a top target for attackers, so protect Domain Admins, use tiered administration, patch DCs and monitor changes. Whoever controls Domain Admins controls the whole company. Tiered administration means admin accounts for DCs are never used to log in to ordinary workstations, where their credentials could be stolen.'
    },
    {
      h: '9. PowerShell, Defender, Firewall and Event Viewer',
      t: 'PowerShell is the command shell and scripting language of Windows. It works with objects rather than plain text, so you can filter, sort and select results easily. Think of it as asking the computer direct questions and getting tidy answers, instead of clicking through ten settings windows.\n\nPowerShell gives fast, scriptable answers to security questions. Get-LocalGroupMember Administrators answers “who is an admin on this machine?” Get-Service | Where Status -eq Running lists running services. Get-NetFirewallProfile shows whether Windows Defender Firewall is on for each profile, and Get-MpComputerStatus shows whether Microsoft Defender is running and up to date. Some commands, such as reading the Security log, need PowerShell run as administrator.\n\nWindows records security activity in the event logs, which you can browse in Event Viewer or search with Get-WinEvent. Event IDs are what SOC analysts search for. For example, many 4625 events (failed logon) for one account followed by a 4624 (successful logon) can mean a password was guessed. A 1102 event means the security log was cleared, which attackers often do to hide their tracks.\n\nLearn the IDs in the table by heart, because you will see them in every SIEM. Attackers also use PowerShell, so defenders turn on PowerShell script logging to record what scripts actually ran.',
      code: 'Get-LocalUser                                   # local users\nGet-LocalGroupMember Administrators              # who is an admin?\nGet-Service | Where Status -eq Running          # running services\nGet-NetFirewallProfile | Select Name, Enabled    # firewall on?\nGet-MpComputerStatus                            # Defender status\nGet-WinEvent -FilterHashtable @{LogName=\'Security\'; Id=4625} -MaxEvents 20',
      lang: 'powershell',
      table: [
        ['Event ID', 'Meaning'],
        ['4624 / 4625', 'Successful / failed logon'],
        ['4672', 'Special privileges assigned to a new logon (admin logon)'],
        ['4720 / 4732', 'User created / added to a security group'],
        ['4688', 'New process created (enable command-line auditing)'],
        ['1102', 'Security audit log cleared (suspicious)']
      ]
    },
    {
      h: '10. Windows hardening checklist',
      t: 'Windows hardening follows the same idea as Linux hardening: change risky defaults and close the doors you do not need. The same five habits apply: patch, minimize, restrict, log and encrypt. Only the tools and names change, just as the rules of the road are the same in Delhi and Chennai even if the signboards differ.\n\nPatch with Windows Update and remove software that no longer gets updates. Minimize by disabling SMBv1 and services you do not use. Restrict by using standard accounts daily, disabling unused built-in accounts, and never exposing RDP directly to the Internet; put it behind a VPN with MFA and Network Level Authentication. Log by enabling audit policies and forwarding events to a central server. Encrypt laptops with BitLocker.\n\nConsider why LAPS matters. If every laptop in an office shares one local admin password, an attacker who steals it from one machine can log in to all of them. With LAPS, each machine gets a unique local admin password that changes regularly, so one stolen password opens only one door.\n\nIn companies, these settings are pushed to hundreds of machines through Group Policy or Intune, using CIS or Microsoft security baselines. The table compares Linux and Windows tools for the same tasks, which helps when you manage both.',
      b: [
        'Apply updates promptly; remove unsupported software.',
        'Use standard accounts daily; disable unused built-in accounts; use LAPS for unique local admin passwords.',
        'Turn on BitLocker, Defender (with tamper protection), the firewall and SmartScreen.',
        'Disable SMBv1 and unneeded services; never expose RDP directly: use VPN + MFA + NLA.',
        'Enable audit policies and forward logs centrally.',
        'Apply CIS or Microsoft security baselines through Group Policy or Intune; allow-list apps with AppLocker or WDAC.'
      ],
      table: [
        ['Task', 'Linux', 'Windows'],
        ['Add user', 'adduser', 'net user / New-LocalUser'],
        ['Permissions', 'chmod, chown', 'icacls, Security tab'],
        ['Services', 'systemctl', 'services.msc, Get-Service'],
        ['Logs', '/var/log, journalctl', 'Event Viewer, Get-WinEvent'],
        ['Firewall', 'ufw / nftables', 'Windows Defender Firewall'],
        ['Disk encryption', 'LUKS', 'BitLocker']
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 03: permissions and a Windows audit (VMs only)',
    steps: [
      ['Create a folder with two files, set one to 600 and one to 644, then test what a second user can read.', 'mkdir lab && cd lab\necho secret > private.txt && chmod 600 private.txt\necho hello > public.txt && chmod 644 public.txt\nls -l\nsudo adduser bob\nsudo -u bob cat private.txt   # Permission denied\nsudo -u bob cat public.txt    # hello', '600 gives only the owner read/write; 644 lets everyone read. Testing as another user proves the permission works.'],
      ['Find SUID programs and look up why two of them need it.', 'find / -perm -4000 -type f 2>/dev/null', 'passwd needs SUID to write /etc/shadow. An unusual SUID binary (for example a copy of a shell) is a red flag for privilege escalation.'],
      ['Harden SSH with a key pair and disable password login. Test login again.', 'ssh-keygen -t ed25519\nssh-copy-id user@your-vm\nsudo nano /etc/ssh/sshd_config   # PasswordAuthentication no, PermitRootLogin no\nsudo systemctl restart ssh', 'Keep a second session open while you change SSH settings so you cannot lock yourself out.'],
      ['On a Windows VM: list local administrators and confirm Defender and the firewall are on.', 'Get-LocalGroupMember Administrators\nGet-MpComputerStatus | Select RealTimeProtectionEnabled, AntivirusSignatureLastUpdated\nGet-NetFirewallProfile | Select Name, Enabled', 'Remove admins that are not needed. All three firewall profiles (Domain, Private, Public) should be enabled.'],
      ['Type a wrong password on purpose a few times, then find the failed logons.', "Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625} -MaxEvents 5 | Format-List TimeCreated, Message", 'Many 4625 events in a short time from one source is the pattern of a password-guessing (brute-force) attack.']
    ]
  },
  examples: [
    {
      title: 'Reading permission strings in Python',
      lang: 'python',
      code: 'def to_octal(perm):\n    """Convert a symbolic permission like \'rwxr-x---\' to its number."""\n    values = {"r": 4, "w": 2, "x": 1, "-": 0}\n    digits = []\n    for i in range(0, 9, 3):\n        digits.append(str(sum(values[c] for c in perm[i:i + 3])))\n    return "".join(digits)\n\nfor p in ["rwxr-x---", "rw-r--r--", "rw-------", "rwxrwxrwx"]:\n    flag = "  <- world-writable!" if p[7] == "w" else ""\n    print(p, "=", to_octal(p) + flag)',
      explanation: 'Each group of three letters is added up (r = 4, w = 2, x = 1). The script also flags world-writable files, which an attacker could modify.'
    },
    {
      title: 'Top source IPs of failed SSH logins',
      lang: 'python',
      code: 'from collections import Counter\nimport re\n\nlog = """Nov 26 10:01:12 web sshd[811]: Failed password for root from 203.0.113.9 port 51022 ssh2\nNov 26 10:01:15 web sshd[811]: Failed password for root from 203.0.113.9 port 51023 ssh2\nNov 26 10:02:40 web sshd[812]: Failed password for invalid user admin from 198.51.100.4 port 40110 ssh2\nNov 26 10:03:02 web sshd[813]: Accepted publickey for asha from 192.168.1.20 port 50211 ssh2\nNov 26 10:03:09 web sshd[814]: Failed password for root from 203.0.113.9 port 51040 ssh2"""\n\nips = Counter(re.findall(r"Failed password .* from (\\S+)", log))\nfor ip, count in ips.most_common():\n    print(f"{ip:15} {count} failed")',
      explanation: 'The same job as the grep | awk | sort | uniq pipeline, written in Python. Repeated failures for root from one IP are a brute-force pattern that should be blocked (fail2ban) and reviewed.'
    }
  ],
  best: [
    'Use a standard account for daily work and elevate only when needed (sudo, UAC).',
    'SSH with keys only; disable password and root login.',
    'Patch automatically and remove unused software and services.',
    'Keep the host firewall on with default-deny inbound.',
    'Turn on full-disk encryption (LUKS, BitLocker) on every laptop.',
    'Enable auditing and ship logs to a central place where attackers cannot delete them.'
  ],
  mistakes: [
    'Fixing a “permission denied” error with chmod 777.',
    'Running daily work, browsers and email as root or a domain admin.',
    'Exposing RDP or SSH with passwords directly to the Internet.',
    'Leaving SMBv1 and old services enabled because “nothing uses them”.',
    'Never reading the logs until after an incident, then finding they were not collected.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Convert rwxr-x--- and rw-r--r-- to numeric form; then convert 640 and 755 to symbolic.\n2. Why is running daily work as root or Administrator risky?\n3. Explain what UAC does and why it exists.\n4. Write a command to list the 10 most frequent IPs in a web server access log.\n5. Draw the Windows logon flow in your own words.\n6. Create a hardening checklist for a new Ubuntu web server and a Windows 11 laptop.'
  },
  mini: {
    title: 'Mini project: harden two virtual machines',
    objective: 'Apply CIS benchmark items to one Ubuntu VM and one Windows VM and measure the difference.',
    requirements: [
      'Record before and after: open ports, admin accounts and patch level.',
      'Apply at least ten benchmark items on each VM.',
      'Run Lynis on Ubuntu before and after and compare the hardening index.'
    ],
    deliverable: 'A two-page report with the commands used, screenshots from your own lab, and the residual risks you accept.'
  },
  takeaways: [
    'Linux and Windows both enforce access with identities and permissions.',
    'Permission math: r = 4, w = 2, x = 1; 644 and 600 are common safe values; 777 is almost never right.',
    'Logs are your evidence: auth.log and Event IDs 4624/4625/4672/4720/1102.',
    'Active Directory is a top target: protect admins and domain controllers.',
    'The five hardening habits: patch, minimize, restrict, log, encrypt.'
  ],
  quickRef: [
    'chmod 600 secret · 644 public file · 755 script/dir · avoid 777',
    'find / -perm -4000 2>/dev/null  → SUID files',
    'sshd_config: PasswordAuthentication no · PermitRootLogin no',
    'Event IDs: 4624 ok · 4625 failed · 4672 admin · 4720 user created · 1102 log cleared',
    'Get-LocalGroupMember Administrators · Get-MpComputerStatus · Get-WinEvent'
  ],
  refs: [
    ['CIS Benchmarks', 'https://www.cisecurity.org/cis-benchmarks'],
    ['Microsoft Security Baselines', 'https://learn.microsoft.com/windows/security/operating-system-security/device-management/windows-security-configuration-framework/windows-security-baselines'],
    ['The Linux Command Line (free book)', 'https://linuxcommand.org/tlcl.php'],
    ['Ubuntu Security documentation', 'https://ubuntu.com/security'],
    ['Lynis auditing tool', 'https://cisofy.com/lynis/']
  ],
  quiz: [
    ['Which permission value gives the owner read/write and everyone else read only?', ['600', '644', '755', '777'], 1, '6 (owner rw) + 4 (group r) + 4 (others r) = 644.'],
    ['Which Windows Event ID records a failed logon?', ['4624', '4625', '4672', '1102'], 1, '4625 is a failed logon; 4624 is a successful one.'],
    ['Which file records SSH logins on Debian/Ubuntu?', ['/etc/passwd', '/var/log/auth.log', '/bin/login', '/proc/auth'], 1, 'auth.log holds authentication events on Debian-based systems.'],
    ['Which technology encrypts a Windows system drive?', ['AppLocker', 'UAC', 'BitLocker', 'NTFS'], 2, 'BitLocker provides full-disk encryption.'],
    ['What does least privilege mean for OS accounts?', ['Everyone is an admin', 'Users get only the rights they need', 'Passwords never expire', 'Logging is disabled'], 1, 'Limiting rights limits the damage from mistakes and attacks.']
  ],

  skills: ['Read and set Linux permissions', 'Harden SSH and services', 'Find Windows security events', 'Apply CIS-style hardening'],
  prereq: ['Module 01 (least privilege)', 'Module 02 (ports and services)'],
  analogy: 'An apartment building: the kernel is the building management, user accounts are residents with keys, groups are floors, and permissions are which doors each key opens. root or Administrator is the master key, so you keep it in a safe and use it only when needed. Logs are the visitor register at the gate.',
  why: 'Almost every attack ends on an endpoint or server. Knowing how permissions, accounts and logs work lets you prevent privilege escalation, spot suspicious logins and investigate incidents.',
  workflow: {
    title: 'Hardening a new server',
    nodes: [
      ['patch', 'Patch', 'Update everything', 'Fresh install', 'Current packages', 'Install all updates first and turn on automatic security updates. Most real compromises use known bugs with available patches (remember WannaCry and Equifax).'],
      ['min', 'Minimize', 'Remove what you do not need', 'Package and service list', 'Smaller attack surface', 'Uninstall unused packages, disable unneeded services and check listening ports with ss -tulpn or Get-NetTCPConnection. Every open port is a door.'],
      ['restrict', 'Restrict', 'Accounts, sudo, SSH, firewall', 'Users and access', 'Least privilege', 'Lock unused accounts, give sudo only to admins, use SSH keys with no root or password login, and set the host firewall to default-deny inbound.'],
      ['log', 'Log', 'Audit and centralize', 'System events', 'Evidence in the SIEM', 'Enable auditd or Windows audit policies and forward logs to a central server. Attackers often clear local logs (Event ID 1102), so a remote copy matters.'],
      ['encrypt', 'Encrypt', 'Disks and connections', 'Data at rest and in transit', 'Protected data', 'Use LUKS or BitLocker for disks and SSH/TLS for connections, so a stolen disk or a captured packet reveals nothing.'],
      ['verify', 'Verify', 'Benchmark and repeat', 'Hardened system', 'Score and gaps', 'Run Lynis or a CIS benchmark scan, fix the gaps, and repeat after every major change.']
    ],
    explanation: 'Patch, minimize, restrict, log and encrypt, then verify. The same loop works for Linux, Windows and cloud images.'
  },
  caseStudy: {
    title: 'Ransomware through exposed Remote Desktop',
    problem: 'A company exposed RDP to the Internet with a weak password and no MFA.',
    data: 'Windows Security log (4625 then 4624 from a foreign IP), 4672 admin logons, 1102 log-cleared event.',
    steps: ['Attackers brute-forced RDP: thousands of 4625 events, then a 4624 success.', 'They used admin rights (4672) to disable Defender.', 'They cleared the Security log (1102) and spread to file servers with domain admin credentials.', 'Files were encrypted overnight.'],
    result: 'MFA, no direct RDP exposure (VPN first), least privilege, patching and central logging would each have broken this chain.',
    limitations: 'Simplified summary of a common pattern; real incidents vary.'
  },
  exercises: [
    { title: 'Permission to number', objective: 'Convert symbolic permissions.', problem: 'What is rwxr-x--- in numeric (octal) form? Enter the three digits.', answer: 750, hints: ['rwx = 4+2+1', 'r-x = 4+0+1', '--- = 0'], solution: ['Owner rwx = 7.', 'Group r-x = 5.', 'Others --- = 0, so 750.'], explanation: 'Owner has full access, the group can read and execute, others have nothing.' },
    { title: 'Spot the brute force', objective: 'Read Windows Event IDs.', problem: 'You see 900 events with ID 4625 in two minutes for the account administrator, then one 4624. What most likely happened?', options: ['A normal user forgot their password once', 'A password-guessing attack that finally succeeded', 'The audit log was cleared', 'A new user was created'], answer: 1, hints: ['4625 = failed, 4624 = success.'], solution: ['Hundreds of failures in minutes is automated guessing.', 'The 4624 afterwards means one guess worked.'], explanation: 'Investigate immediately: disable the account, check the source IP and look for 4672 and 1102.' },
    { title: 'Which setting stops root SSH logins?', type: 'Short answer', objective: 'Know sshd_config.', problem: 'Which sshd_config directive (name only) disables direct root login over SSH?', accept: ['PermitRootLogin', 'permitrootlogin', 'PermitRootLogin no'], hints: ['It starts with Permit…'], solution: ['Set PermitRootLogin no and restart sshd.'], explanation: 'Admins log in as themselves and use sudo, which is logged.' },
    { title: 'Explicit deny', objective: 'Understand NTFS precedence.', problem: 'A user is in a group with Allow Modify and in another group with explicit Deny Write on the same folder. Can they write?', options: ['Yes, Allow wins', 'No, explicit Deny wins', 'Only if they are admin', 'It depends on the share'], answer: 1, hints: ['Which one overrides on NTFS?'], solution: ['Explicit Deny overrides Allow.'], explanation: 'Use Deny sparingly; it is hard to troubleshoot.' }
  ],
  checks: [
    ['Why is /tmp interesting to defenders?', ['It holds passwords', 'It is world-writable, so attackers often drop tools there', 'It is encrypted', 'It stores the kernel'], 1, 'Any user can write to /tmp; check it for unexpected executables.'],
    ['What does UAC do?', ['Encrypts the disk', 'Prompts before administrator actions, even for admins', 'Blocks all downloads', 'Replaces antivirus'], 1, 'It separates admin rights from everyday use.'],
    ['Which tool assigns unique local admin passwords per Windows machine?', ['LAPS', 'SMBv1', 'NTLM', 'RDP'], 0, 'LAPS stops one stolen local admin password from unlocking every PC.']
  ],
  cheat: ['r=4 w=2 x=1 · 600 · 644 · 750 · 755', 'auth.log · /var/log/secure · journalctl -u ssh', '4624 · 4625 · 4672 · 4720 · 4732 · 4688 · 1102', 'Patch · Minimize · Restrict · Log · Encrypt'],
  next: 'Module 04 turns these manual checks into scripts: Python, Bash and PowerShell for security automation.'
};
