export default {
  n: 11,
  title: 'Malware Analysis & Threat Intelligence',
  description: 'The malware lifecycle and delivery, malware types, static, dynamic, behavioral and code analysis, PE file internals and entropy, an isolated analysis lab, core tools (PEStudio, Ghidra, ProcMon, YARA), the threat-intelligence disciplines and lifecycle, threat actors and ATT&CK mapping, MISP and OpenCTI, and lessons from WannaCry and SolarWinds.',
  intro: 'Malware (malicious software) is code designed to infiltrate, damage, exploit or run unauthorized operations on a system without the owner’s consent. In the 1980s it was mostly experimental boot-sector infectors spread on floppy disks. Today it is a business. Organized crime groups and nation-state APTs build multi-stage tools, and many of them are designed to evade signature-based antivirus.\n\nThis module has two parts. Part one teaches how malware is delivered and how it survives a reboot, the main malware types, and how analysts study a sample safely: static triage, PE file internals, dynamic behavior in an isolated lab, and detection with YARA. Part two turns those technical findings into Cyber Threat Intelligence (CTI): the disciplines and lifecycle, threat actor profiling, MITRE ATT&CK mapping, and platforms such as MISP and OpenCTI.\n\nOne rule applies to every lab in this module. All analysis happens in isolated, host-only virtual machines with harmless training samples. Never run an untrusted file on your own computer or on a connected network, not even “just to see what it does”. Analysts treat a sample the way a hospital lab treats a dangerous virus: it only leaves its sealed room as a written report.',
  objectives: [
    'Describe the malware lifecycle, delivery vectors and persistence mechanisms.',
    'Classify malware types by behavior and detection signals.',
    'Explain static, dynamic, behavioral and code analysis, and read key PE header fields.',
    'Design an isolated analysis lab and use core tools safely.',
    'Write a YARA rule and extract IOCs from analysis results.',
    'Explain the CTI disciplines and lifecycle, map behavior to ATT&CK, and share intelligence with MISP/OpenCTI.'
  ],
  terms: [
    ['Dropper / loader', 'The first-stage program that delivers or decrypts the main payload.'],
    ['Persistence', 'A mechanism that restarts malware after a reboot, such as a Run registry key or scheduled task.'],
    ['C2', 'Command and control: the attacker’s infrastructure that malware contacts for instructions.'],
    ['Worm', 'Malware that spreads across networks on its own, without user action.'],
    ['Trojan', 'Malware disguised as legitimate software.'],
    ['Rootkit', 'Malware that hides itself by subverting the operating system, sometimes in the kernel.'],
    ['Fileless malware', 'Malware that runs in memory using built-in tools (PowerShell, WMI): “living off the land”.'],
    ['PE file', 'Portable Executable: the Windows format for .exe, .dll and driver files.'],
    ['Entropy', 'A 0–8 measure of randomness; sections above about 7 suggest packing or encryption.'],
    ['Packer', 'A tool (UPX, Themida, VMProtect) that compresses or encrypts code to hide it from analysis.'],
    ['YARA', 'A rule language for identifying files or memory by strings, bytes and conditions.'],
    ['CTI', 'Cyber Threat Intelligence: evaluated, contextualized, actionable knowledge about threats.'],
    ['STIX / TAXII', 'A JSON standard for describing threat intelligence / a protocol for exchanging it.'],
    ['TLP', 'Traffic Light Protocol: sharing labels (RED, AMBER, GREEN, CLEAR) for sensitive intelligence.']
  ],
  diagramTitle: 'The malware lifecycle and the analysis lab',
  ascii: ' MALWARE LIFECYCLE\n develop & pack -> deliver (LNK, ISO, HTML smuggling, supply chain)\n   -> execute & drop -> persist (Run key, task, service) -> C2 beacon\n   -> actions on objectives (steal creds, move laterally, exfiltrate, encrypt)\n\n ANALYSIS DEPTH (effort and insight increase downward)\n 1 fully automated (sandbox, multi-AV)   3 dynamic / behavioral (ProcMon, FakeNet)\n 2 static triage (hashes, strings, PE)   4 code analysis (Ghidra, debugger)\n\n ISOLATED LAB (host-only network, snapshots, no Internet)\n [ FlareVM (Windows analysis) ] <----> [ REMnux + INetSim/FakeNet (fake DNS/HTTP) ]\n         findings -> IOCs + YARA/Sigma -> SIEM/EDR -> CTI platform (MISP/OpenCTI)',
  diagramExplain: 'Malware moves from delivery to persistence, command and control and its goal. Analysts climb four tiers of analysis depth inside an isolated lab where a second VM fakes Internet services, then turn findings into IOCs, YARA and Sigma rules and shared intelligence.',
  sections: [
    {
      h: '1. The malware lifecycle and delivery',
      t: 'An attacker rarely sends a bare .exe file today, because email gateways block them. Instead, malware moves through a chain of stages, a bit like a parcel that changes hands several times before it reaches your door. If defenders break any one link in that chain, the attack fails.\n\nThe stages are: development and packing, where the author hides the code; delivery and weaponization, where it is wrapped in something harmless-looking; execution and dropping, where a small first program unpacks the real payload, often after checking whether it is running inside a sandbox; persistence, so it survives a reboot; command and control (C2), where it calls home over HTTPS, DNS or WebSockets; and finally actions on objectives, such as credential theft, lateral movement, data exfiltration or file encryption.\n\nHere is a realistic case. A student receives an email titled “Scholarship_List.zip”. Inside is an ISO file. When opened, Windows mounts it like a CD, and inside sits a shortcut named “List.pdf.lnk”. Clicking it runs hidden PowerShell, which downloads a loader. The loader adds a Run registry key and starts beaconing to a C2 server every few minutes.\n\nThe table below lists common delivery tricks. Notice that none of them is a plain .exe attachment. Each one abuses a normal Windows or browser feature, which is why awareness and careful file-type policies matter as much as antivirus.',
      table: [
        ['Delivery vector', 'Mechanism', 'Real-world examples'],
        ['Weaponized LNK shortcuts', 'A shortcut that runs hidden PowerShell or mshta', 'Emotet, QakBot, Raspberry Robin'],
        ['ISO / VHD containers', 'Mounting a disk image bypasses Mark-of-the-Web', 'Bumblebee, IcedID, LockBit'],
        ['HTML smuggling', 'JavaScript builds the payload inside the browser', 'NOBELIUM, QakBot'],
        ['Supply-chain poisoning', 'A backdoor injected into a trusted software update', 'SolarWinds SUNBURST, 3CX'],
        ['Drive-by compromise', 'Browser exploits or malicious ad redirects', 'SocGholish']
      ]
    },
    {
      h: '2. Malware types',
      t: 'Malware categories describe behavior: how a program spreads, hides and does damage. Think of them like job titles in a criminal gang. One member breaks in, another keeps watch, another collects the money. A single modern malware family often holds several of these jobs at once.\n\nFor example, one sample can be a trojan (it pretends to be useful software) with worm-like spreading over SMB, a keylogger module that steals passwords, and a final ransomware payload. This is called modular malware. The attacker loads only the modules a victim is worth. A small shop may just get ransomware, while a bank may get a quiet keylogger first.\n\nThe categories still help because each type leaves different traces. A worm creates a burst of connections on ports 445 or 3389 as it scans for new victims. Ransomware writes thousands of files in a few minutes and usually runs “vssadmin delete shadows” to remove Windows backup copies. Fileless malware may leave no file on disk at all, but you will see an odd parent-child process pair, such as Word starting PowerShell.\n\nWhen you study the table, read the last column carefully. As a defender, the detection signal is the part you use every day in a SOC. Knowing the name of a family is useful, but knowing what it looks like in your logs is what lets you catch it.',
      table: [
        ['Type', 'Mechanism', 'Detection signal'],
        ['Virus', 'Infects host files', 'Altered executables, entropy anomalies'],
        ['Worm', 'Self-propagates via network exploits (SMB, RDP)', 'Spikes of 445/3389 scanning'],
        ['Trojan', 'Disguised as legitimate software', 'Unsigned binaries in AppData'],
        ['Ransomware', 'Encrypts files and deletes shadow copies', 'vssadmin delete shadows, rapid file writes'],
        ['Rootkit', 'Hooks the OS to hide processes and files', 'Kernel integrity and driver checks'],
        ['Keylogger', 'Captures keystrokes through API hooks', 'Global keyboard hooks'],
        ['Botnet', 'Zombie hosts controlled remotely', 'Periodic beaconing to suspicious IPs'],
        ['Fileless', 'Runs in RAM with PowerShell, WMI, mshta', 'Odd parent-child processes (winword → powershell)'],
        ['RAT', 'Full remote control (AsyncRAT, Quasar)', 'Persistent TLS sessions, dynamic DNS']
      ]
    },
    {
      h: '3. Analysis methods and PE internals',
      t: 'Malware analysis has four tiers, and each one costs more effort but gives deeper insight. The idea is like a doctor’s check-up: first a quick automatic test, then a physical look, then watching the patient under observation, and only if needed, a detailed scan.\n\nTier one is fully automated: a sandbox and many antivirus engines give a quick verdict. Tier two is static triage: you calculate hashes, pull out readable strings and read the file headers without running the file. Tier three is dynamic and behavioral analysis: you run the sample inside an isolated lab and record what it does. Tier four is code analysis: you disassemble and debug it to understand exact logic. Static analysis is fast and safe, but packing can defeat it. Dynamic analysis shows real behavior, but a sample can detect the sandbox and stay quiet.\n\nWindows programs use the Portable Executable (PE) format, and its headers tell an analyst a lot. Every PE file starts with “MZ” (0x5A4D). At offset 0x3C, the e_lfanew field gives the location of the “PE\\0\\0” signature. After that come the compile timestamp, the entry point, the import table and the sections. If the imports include VirtualAllocEx, WriteProcessMemory and CreateRemoteThread together, the program can inject code into another process.\n\nA common beginner mistake is to trust the file extension. A file called invoice.pdf.exe is still a PE file, and the header check exposes it immediately.',
      table: [
        ['PE component', 'Key fields', 'Why it matters'],
        ['DOS header', '“MZ” (0x5A4D) at offset 0; e_lfanew at 0x3C', 'Identifies the file and points to the PE header'],
        ['PE signature', '“PE\\0\\0” at the e_lfanew offset', 'Confirms a Windows executable'],
        ['File header', 'Machine, NumberOfSections, TimeDateStamp', 'Compile time (or deliberate timestamp stomping)'],
        ['Optional header', 'AddressOfEntryPoint, ImageBase', 'Where execution starts'],
        ['Import table', 'APIs from kernel32, advapi32, ws2_32', 'Capabilities: VirtualAllocEx + WriteProcessMemory + CreateRemoteThread = injection'],
        ['Sections', '.text, .data, .rsrc', 'Entropy above ~7.2 suggests packing or encryption']
      ]
    },
    {
      h: '4. The isolated lab and core tools',
      t: 'You would never test a gas cylinder for leaks inside your hostel room. In the same way, you never run malware on a normal computer. Detonating a sample needs a lab that stops it from escaping and also fools it into thinking it has a real Internet connection.\n\nThe standard setup uses two virtual machines. The first is a Windows analysis VM, usually FlareVM, which comes with tools like PEStudio, Process Monitor and Ghidra. The second is a Linux VM, usually REMnux, running INetSim or FakeNet-NG. These tools pretend to be DNS, HTTP and other servers, so when malware asks for its C2 domain, it gets a fake reply and you can record the request. Both VMs sit on a host-only network with no route to the Internet or your home Wi-Fi. Before every run you take a snapshot, and afterwards you roll back to the clean state.\n\nA typical session looks like this: revert to snapshot, start FakeNet-NG and Process Monitor, run the training sample for a few minutes, save the logs, and revert again. Each tool in the table has a limit, so analysts always combine several.\n\nOne warning is worth repeating. Never upload confidential company files to public services such as VirusTotal. Uploads can be visible to other users. Search by the file’s hash first, and only upload when you are sure the file contains no private data.',
      table: [
        ['Tool', 'Category', 'Limitation'],
        ['VirusTotal', 'Multi-AV and sandbox reports', 'Public uploads can leak data; search by hash first'],
        ['PEStudio', 'Static triage of imports, strings, entropy', 'Cannot see unpacked memory'],
        ['Detect It Easy', 'Compiler and packer identification', 'Fooled by modified headers'],
        ['Ghidra / IDA Free', 'Disassembler and decompiler', 'Steep learning curve'],
        ['Process Monitor', 'Registry, file and process activity', 'Millions of events; filter hard'],
        ['Wireshark / FakeNet-NG', 'Capture and fake network services', 'Custom encrypted protocols stay opaque'],
        ['YARA', 'Pattern matching in files and memory', 'Breaks if authors change strings'],
        ['Autoruns', 'Every auto-start location', 'Shows a lot of legitimate entries']
      ]
    },
    {
      h: '5. Measuring entropy (packing detection)',
      t: 'Entropy measures how random a set of bytes is. The scale runs from 0 to 8 bits per byte. Think of a class register: if every student in the list is called “Rahul”, the list is very predictable and has low entropy. If every name is different and random, it has high entropy.\n\nThe code below uses Shannon’s formula. It counts how often each byte value appears, turns each count into a probability, and adds up minus p times log2(p) for every value. A file of only the letter A gives 0. Normal English text and normal compiled code usually sit around 3.5 to 5.5. Compressed, packed or encrypted data looks almost random, so it approaches the maximum of 8, because a byte has 256 possible values and log2(256) is 8.\n\nWhen you run the script, you should see three lines: the English text near 4, the repeated byte at 0.00, and the random bytes above 7.9 with the “likely packed/encrypted” flag. Tools like PEStudio and Detect It Easy do the same calculation for each section of a PE file.\n\nIn practice, a section with entropy above about 7.2 combined with very few imports is a classic sign of a packed sample. The packer hides the real code and its API list until runtime. High entropy alone is not proof of malware, because ZIP files and installers are also compressed, so always read it together with other signs.',
      code: 'import math, os\nfrom collections import Counter\n\ndef entropy(data):\n    counts = Counter(data)\n    n = len(data)\n    return -sum(c / n * math.log2(c / n) for c in counts.values())\n\nsamples = {\n    "english text": b"the quick brown fox jumps over the lazy dog " * 50,\n    "repeated byte": b"A" * 2000,\n    "random bytes (like encrypted)": os.urandom(2000),\n}\nfor name, data in samples.items():\n    e = entropy(data)\n    flag = "  <- likely packed/encrypted" if e > 7.2 else ""\n    print(f"{name:32} {e:4.2f}{flag}")',
      lang: 'python'
    },
    {
      h: '6. Writing a YARA rule',
      t: 'YARA is a rule language that finds files or memory that match a pattern. It works like a security guard at an apartment gate who has a written description: “a man in a red cap, carrying a blue bag, who arrives after 10 pm”. The guard only stops someone who matches the full description, not everyone in a red cap.\n\nA YARA rule has three parts. The meta section records who wrote the rule, why, and its sharing label, such as TLP AMBER. The strings section lists what to look for: plain ASCII text, wide (UTF-16) text as Windows programs often store it, and hex patterns where ?? means “any byte”. The condition section combines them with logic. In the rule below, the file must start with MZ, must have the PE signature at the e_lfanew offset, must be smaller than 2 MB, and must contain either the PowerShell command string, or both the error string and the XOR loop bytes.\n\nTo test it, you run yara64 against the training sample, where it should match. Then you run it with -r against a folder of clean files, such as C:\\Windows\\System32, where it should match nothing.\n\nThis testing step is the part beginners skip. A rule that also flags a real Windows file will flood the SOC with false alerts and may even quarantine system files. Always test rules against known-good files before deploying them to EDR or a scanner.',
      code: 'rule Training_Beacon_Stager\n{\n    meta:\n        description = "Training rule: stager strings seen in the lab sample"\n        author      = "CodeLekho student"\n        tlp         = "AMBER"\n    strings:\n        $s1 = "cmd.exe /c powershell -enc" ascii\n        $s2 = "C2_BEACON_INIT_ERROR" wide\n        $x1 = { 8B 45 ?? 33 C0 8A 04 08 30 04 18 }   // XOR loop, ?? = any byte\n    condition:\n        uint16(0) == 0x5A4D                          // "MZ"\n        and uint32(uint32(0x3C)) == 0x00004550        // "PE\\0\\0"\n        and filesize < 2MB\n        and ($s1 or ($s2 and $x1))\n}',
      lang: 'yara'
    },
    {
      h: '7. Cyber Threat Intelligence: disciplines and lifecycle',
      t: 'A list of 50,000 IP addresses is data, not intelligence. Compare it with a railway enquiry board that only shows train numbers with no times or platforms. Intelligence is information that has been evaluated, put in context and made actionable for a person who must make a decision.\n\nCTI follows a lifecycle. Direction comes first: someone states what they need to know, such as “Which ransomware groups are targeting Indian hospitals?”. Then come collection (feeds, reports, your own incident data), processing (cleaning, removing duplicates, translating), analysis (connecting the facts and judging how reliable they are), dissemination (sending the result to the right people in the right format) and feedback (asking whether it helped, which shapes the next round of direction).\n\nThe same finding is written differently for each audience, as the table shows. Strategic intelligence goes to the CISO and the board, looks years ahead and talks about motives and financial risk. Operational intelligence helps SOC and incident response leads plan for campaigns over the coming months. Tactical intelligence tells detection engineers and threat hunters about new TTPs and changes in ATT&CK techniques. Technical intelligence is the machine-readable list of hashes, IPs, domains and URLs that Tier 1 and 2 analysts and firewall admins load into their tools.\n\nA common mistake is sending the board a list of IP addresses, or sending analysts a long essay. Match the format to the reader.',
      table: [
        ['Discipline', 'Audience', 'Horizon', 'Deliverables'],
        ['Strategic', 'CISO, board, risk committee', 'Years', 'Adversary motives, industry risk, financial impact'],
        ['Operational', 'SOC and IR leads', 'Months', 'Campaigns, infrastructure trends, timing'],
        ['Tactical', 'Detection engineers, hunters', 'Weeks', 'TTPs and ATT&CK technique shifts'],
        ['Technical', 'Tier 1/2 analysts, firewall admins', 'Hours to days', 'Machine-readable IOCs (hashes, IPs, domains, URLs)']
      ]
    },
    {
      h: '8. Threat actors, ATT&CK and TIPs',
      t: 'Knowing who is likely to attack you helps you predict how. A jeweller in a busy market worries about burglars at night, while a bank worries about insiders and organized fraud. Profiling threat actors works the same way: their motivation tells you their likely targets and methods.\n\nThe table groups actors by motive. Nation-state APTs want espionage, sabotage or intellectual property, and are patient. eCrime groups want money, mostly through ransomware and banking theft. Hacktivists want attention for a cause. Insiders may want money or revenge. Analysts map each group’s behavior to MITRE ATT&CK techniques, so defenders can check which techniques they can already detect.\n\nThreat Intelligence Platforms (TIPs) collect, correlate and share indicators. MISP is strong at community sharing of structured IOCs, often over TAXII feeds. OpenCTI models relationships, for example “this malware is used by this actor in this campaign and exploits this vulnerability”, as STIX 2.1 objects written in JSON. So when your lab finds a C2 domain, you can create an indicator in OpenCTI, link it to the malware family and the ATT&CK command-and-control tactic, and share it with partners.\n\nEvery shared item carries a Traffic Light Protocol label. TLP:RED is only for the people in the exchange. TLP:AMBER allows limited, need-to-know sharing. TLP:GREEN can go to the wider community. TLP:CLEAR is public. Respecting these labels is how organizations keep trusting each other enough to share.',
      table: [
        ['Actor type', 'Motivation', 'Examples'],
        ['Nation-state APTs', 'Espionage, sabotage, IP theft', 'APT29, APT28, Lazarus Group, Volt Typhoon'],
        ['eCrime groups', 'Extortion, ransomware, banking theft', 'LockBit affiliates, FIN7, Wizard Spider'],
        ['Hacktivists', 'Ideology, public shaming', 'Loosely organized collectives'],
        ['Insiders', 'Money, sabotage, revenge', 'Compromised or disgruntled employees']
      ]
    },
    {
      h: '9. Case studies: WannaCry and SolarWinds',
      t: 'WannaCry hit in May 2017. It used the EternalBlue exploit (CVE-2017-0144) against Windows SMBv1 to spread as a worm, with no clicks needed. Within hours it reached 150+ countries and affected over 200,000 systems, including many UK NHS trusts, where some hospitals had to cancel appointments and divert patients.\n\nThe spread stopped partly by luck and partly by careful static analysis. A researcher reading the sample’s strings found a hard-coded, unregistered domain. The malware checked that domain before spreading. When the researcher registered it, the check succeeded and the built-in kill switch halted new infections. The painful part is that the patch, MS17-010, had been released two months earlier. Organizations that had patched and disabled SMBv1 were safe.\n\nSolarWinds SUNBURST, discovered in 2020, was very different. Attackers got into the company’s build pipeline and injected a backdoor into a digitally signed Orion update. Customers installed it because it came from a trusted vendor with a valid signature. The backdoor stayed dormant for up to two weeks, avoided machines running security tools and used DNS-based C2 to blend in with normal traffic. About 18,000 organizations installed the update.\n\nThe two cases teach opposite lessons. WannaCry was loud and fast, and basic hygiene would have stopped it. SUNBURST was quiet and patient, and it proved that a valid signature does not mean the software is safe.',
      b: [
        'WannaCry lessons: disable SMBv1, patch quickly, segment networks, keep offline backups.',
        'SolarWinds lessons: signed does not mean safe; protect build pipelines; inspect outbound DNS; adopt Zero Trust.'
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 11: safe static triage and a YARA rule',
    steps: [
      ['Build the lab: FlareVM and REMnux on a host-only network with snapshots. Use only synthetic or training samples from trusted course sources.', null, 'Confirm there is no route to the Internet or your home network before handling any sample.'],
      ['Hash the training sample and search the hash (not the file) in threat-intel sources.', 'Get-FileHash -Algorithm SHA256 .\\training_sample.bin\nGet-FileHash -Algorithm MD5 .\\training_sample.bin', 'Searching by hash avoids uploading a file that might contain confidential data.'],
      ['Open the sample in PEStudio and Detect It Easy. Record entropy per section, the packer, and suspicious imports.', null, 'High entropy in .rsrc plus VirtualAllocEx, WriteProcessMemory and CreateRemoteThread suggest a packed injector.'],
      ['Extract strings (FLOSS decodes obfuscated ones), then write a YARA rule from two distinctive strings and test it.', 'floss .\\training_sample.bin > strings.txt\nyara64 detect_training.yar .\\training_sample.bin\nyara64 -r detect_training.yar C:\\Windows\\System32   # must NOT match clean files', 'A rule that matches system files is a false-positive factory. Tighten it until only the sample matches.'],
      ['Dynamic run (advanced, lab only): start FakeNet-NG on REMnux, ProcMon with a filter on the sample, run it from a snapshot, then revert.', null, 'Look for child processes, Run-key persistence and DNS queries captured by FakeNet. Revert the snapshot afterwards.']
    ]
  },
  examples: [
    {
      title: 'Checking a PE header with Python',
      lang: 'python',
      code: 'import struct\n\n# a minimal fake header for learning: "MZ", padding, e_lfanew = 0x80, then "PE\\0\\0"\nfake = bytearray(0x100)\nfake[0:2] = b"MZ"\nstruct.pack_into("<I", fake, 0x3C, 0x80)\nfake[0x80:0x84] = b"PE\\0\\0"\n\ndef looks_like_pe(data):\n    if data[:2] != b"MZ":\n        return "not an MZ file"\n    e_lfanew = struct.unpack_from("<I", data, 0x3C)[0]\n    if data[e_lfanew:e_lfanew + 4] != b"PE\\0\\0":\n        return "MZ but no PE signature"\n    return f"valid PE header at offset {hex(e_lfanew)}"\n\nprint(looks_like_pe(bytes(fake)))\nprint(looks_like_pe(b"%PDF-1.7 not an exe"))',
      explanation: 'The same two checks YARA uses (uint16(0) == 0x5A4D and the PE signature at e_lfanew) identify Windows executables even when the file extension lies, such as invoice.pdf.exe or a .scr file.'
    },
    {
      title: 'Turning analysis results into a STIX-style indicator',
      lang: 'python',
      code: 'import json\n\nindicator = {\n    "type": "indicator",\n    "spec_version": "2.1",\n    "name": "Training stager C2 domain",\n    "pattern_type": "stix",\n    "pattern": "[domain-name:value = \'threat-c2.example\']",\n    "labels": ["malicious-activity"],\n    "kill_chain_phases": [{"kill_chain_name": "mitre-attack", "phase_name": "command-and-control"}],\n    "x_tlp": "AMBER",\n}\nprint(json.dumps(indicator, indent=2))',
      explanation: 'STIX 2.1 is JSON, so tools like OpenCTI and MISP can import indicators automatically and link them to actors, campaigns and ATT&CK techniques. The TLP label tells partners how widely they may share it.'
    }
  ],
  best: [
    'Analyze only in isolated, snapshotted VMs on a host-only network.',
    'Search hashes before uploading files to public services, and never upload confidential documents.',
    'Start with static triage, then dynamic analysis, then code analysis only if needed.',
    'Test YARA and Sigma rules against clean files before deploying them.',
    'Map findings to ATT&CK and prefer behavior-based detections.',
    'Label shared intelligence with TLP and include context, not just IOC lists.'
  ],
  mistakes: [
    'Running a suspicious file on your own computer “just to see”.',
    'Using a bridged network, so the sample reaches the Internet or your home devices.',
    'Uploading a confidential customer document to a public scanner.',
    'Publishing YARA rules that match legitimate Windows files.',
    'Treating a raw feed of IPs as intelligence without context or expiry.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Explain the difference between a virus, a worm and a trojan with one example each.\n2. A sample imports VirtualAllocEx, WriteProcessMemory and CreateRemoteThread and has a section with entropy 7.8. What do you conclude?\n3. Why can a sample exit immediately in a sandbox, and how do analysts handle it?\n4. Write a YARA rule from two distinctive strings and explain how you would test it for false positives.\n5. Classify these as strategic, operational, tactical or technical intelligence: a list of C2 IPs; a board report on ransomware risk in banking; a note that an actor moved from macros to LNK files.\n6. Map WannaCry’s behavior to three ATT&CK tactics.'
  },
  mini: {
    title: 'Mini project: malware triage and threat dossier',
    objective: 'Investigate a training sample and brief a CISO.',
    requirements: [
      'Executive summary of impact, risk and recommended response.',
      'Static profile: hashes, compile time, sections, entropy and imports.',
      'Dynamic profile: process tree, persistence, dropped files and network indicators.',
      'One tested YARA rule and one Sigma rule.',
      'Mapping to at least five ATT&CK techniques.'
    ],
    deliverable: 'A threat dossier with screenshots from your lab, the rules and an IOC table with TLP labels.'
  },
  takeaways: [
    'Malware follows a lifecycle: deliver, execute, persist, beacon, act.',
    'Static analysis is fast and safe; dynamic analysis shows real behavior; both are needed.',
    'High entropy plus few imports suggests packing.',
    'Detections built on behavior outlast hash and IP blocklists.',
    'Intelligence is data with context, made actionable for a specific audience.'
  ],
  quickRef: [
    'MZ = 0x5A4D at offset 0 · e_lfanew at 0x3C · "PE\\0\\0"',
    'Entropy > ~7.2 → packed/encrypted',
    'Injection APIs: VirtualAllocEx + WriteProcessMemory + CreateRemoteThread',
    'Persistence: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run, scheduled tasks, services',
    'CTI: strategic · operational · tactical · technical · TLP RED/AMBER/GREEN/CLEAR'
  ],
  refs: [
    ['MITRE ATT&CK', 'https://attack.mitre.org/'],
    ['YARA documentation', 'https://yara.readthedocs.io/'],
    ['Ghidra (NSA)', 'https://ghidra-sre.org/'],
    ['MISP Threat Sharing', 'https://www.misp-project.org/'],
    ['FIRST Traffic Light Protocol', 'https://www.first.org/tlp/']
  ],
  quiz: [
    ['Which DOS-header field gives the offset where the PE header begins?', ['e_magic', 'e_cblp', 'e_lfanew', 'e_oemid'], 2, 'e_lfanew at offset 0x3C holds the offset of the “PE\\0\\0” signature.'],
    ['Which entropy value suggests packing or encryption?', ['Below 3.5', 'Between 4.0 and 5.5', 'Above about 7.0', 'Exactly 0'], 2, 'Packed or encrypted data approaches the maximum of 8.'],
    ['A binary imports VirtualAllocEx, WriteProcessMemory and CreateRemoteThread. What technique is likely?', ['Process injection', 'Key generation', 'Keylogging', 'DNS tunneling'], 0, 'Allocate memory in another process, write code into it, then start a thread there.'],
    ['What is the main difference between a virus and a worm?', ['Viruses encrypt, worms steal', 'Worms need a user to run them', 'Worms self-propagate across networks; viruses need a host file', 'Viruses only run in the kernel'], 2, 'Worms spread on their own; viruses infect files that a user runs.'],
    ['Which CTI discipline produces risk reports for the board?', ['Technical', 'Tactical', 'Operational', 'Strategic'], 3, 'Strategic CTI serves executives with long-term risk and adversary trends.']
  ],

  skills: ['Classify malware by behavior', 'Triage a sample statically', 'Read PE headers and entropy', 'Write and test a YARA rule', 'Produce intelligence for different audiences'],
  prereq: ['Module 03 (Windows internals and logs)', 'Module 09 (SOC and ATT&CK)', 'Module 10 (evidence handling)'],
  analogy: 'Malware analysis is a bomb squad’s work: first look at the device from the outside (static), then watch it behave inside a blast chamber (dynamic, in an isolated lab), and only then take it apart piece by piece (code analysis). Threat intelligence is the investigation unit that connects this device to a group, predicts their next target, and tells the right people in language they can act on.',
  why: 'Most incidents involve malware somewhere in the chain. Understanding how it works lets SOC analysts, responders and detection engineers find it, contain it, and write detections that survive the next variant.',
  workflow: {
    title: 'From suspicious file to shared intelligence',
    nodes: [
      ['collect', 'Collect safely', 'Hash and isolate', 'Suspicious file', 'Hashes, custody record', 'Copy the sample into a password-protected archive, record its hashes and chain of custody, and move it only into the isolated lab.'],
      ['static', 'Static triage', 'Strings, PE, entropy', 'Sample', 'Capabilities and packer', 'Use PEStudio, Detect It Easy and FLOSS: imports reveal capabilities, entropy reveals packing, strings reveal URLs, registry keys and mutexes.'],
      ['dynamic', 'Dynamic analysis', 'Run in the lab', 'Snapshot VM', 'Behavior', 'Detonate with ProcMon, FakeNet-NG and Wireshark running. Record child processes, persistence, dropped files and C2 traffic, then revert the snapshot.'],
      ['detect', 'Detection', 'IOCs, YARA, Sigma', 'Findings', 'Rules', 'Extract IOCs and write YARA (files) and Sigma (logs) rules. Test them against clean data before deployment.'],
      ['intel', 'Intelligence', 'Context and ATT&CK', 'Rules and IOCs', 'Dossier', 'Map behavior to ATT&CK, link to known actors or campaigns where evidence supports it, and write for the audience: executives, SOC or engineers.'],
      ['share', 'Share', 'MISP/OpenCTI with TLP', 'Dossier', 'Community defense', 'Publish to your TIP with TLP labels and expiry dates so partners can block and hunt.']
    ],
    explanation: 'Each step adds context; the output is detections and intelligence, not just a verdict on one file.'
  },
  caseStudy: {
    title: 'WannaCry ransomware worm (2017)',
    problem: 'A ransomware worm spread across 150+ countries in hours by exploiting unpatched Windows SMBv1 (EternalBlue, CVE-2017-0144).',
    data: 'Static strings of the sample, SMB scanning traffic on TCP 445, patch status (MS17-010).',
    steps: ['The worm scanned internal and Internet ranges on TCP 445.', 'It exploited SMBv1 and installed the ransomware payload.', 'Files were encrypted and a ransom was demanded; hospitals delayed surgeries.', 'An analyst found an unregistered domain in the strings; registering it triggered the built-in kill switch and slowed the spread.'],
    result: 'Static string analysis directly helped stop a global outbreak; patching and disabling SMBv1 would have prevented it.',
    limitations: 'Simplified summary; read official reports for exact figures.'
  },
  exercises: [
    { title: 'Read the signs', objective: 'Combine static indicators.', problem: 'A file has a .rsrc section with entropy 7.84, only two imports, and no digital signature. What is the most likely explanation?', options: ['It is a plain text file', 'It is packed or encrypted to hide its real code', 'It is a Windows system file', 'It is a corrupted image'], answer: 1, hints: ['High entropy plus few imports.'], solution: ['Packed binaries resolve APIs at runtime, so few imports appear.', 'Encrypted or compressed data has high entropy.'], explanation: 'Next step: dynamic analysis or unpacking in a debugger.' },
    { title: 'Name the persistence', type: 'Short answer', objective: 'Recognize autostart locations.', problem: 'Which Sysinternals tool lists every auto-start location, including Run keys, services and scheduled tasks? (one word)', accept: ['autoruns'], hints: ['Its name says what it shows.'], solution: ['Autoruns.'], explanation: 'Compare its output with a clean baseline to spot persistence.' },
    { title: 'TLP choice', objective: 'Apply sharing rules.', problem: 'You may share an indicator with partner organizations who need it, but it must not be published. Which TLP label fits best?', options: ['TLP:CLEAR', 'TLP:GREEN', 'TLP:AMBER', 'TLP:RED'], answer: 2, hints: ['Limited, need-to-know sharing.'], solution: ['AMBER allows limited sharing on a need-to-know basis.'], explanation: 'RED is only for the people in the exchange; CLEAR is public.' },
    { title: 'Entropy maximum', objective: 'Know the scale.', problem: 'What is the maximum possible Shannon entropy of a byte stream, in bits per byte?', answer: 8, hints: ['A byte has 256 possible values = 2^8.'], solution: ['log2(256) = 8.'], explanation: 'Truly random or well-encrypted data comes close to 8.' }
  ],
  checks: [
    ['Why search a hash before uploading a file to a public scanner?', ['Uploads are slower', 'Uploads may expose confidential data to others', 'Hashes are encrypted', 'Scanners reject files'], 1, 'Public uploads can be downloaded by other researchers.'],
    ['What does “living off the land” mean?', ['Using built-in tools like PowerShell and WMI for malicious purposes', 'Hosting malware on farms', 'Using only Linux', 'Avoiding the network'], 0, 'Legitimate tools make malicious activity blend in.'],
    ['In which format is STIX 2.1 serialized?', ['XML', 'YAML', 'JSON', 'CSV'], 2, 'STIX 2.1 objects are JSON.']
  ],
  cheat: ['Static → Dynamic → Code', 'MZ · e_lfanew · PE\\0\\0', 'Entropy > 7.2 = packed', 'YARA: meta · strings · condition', 'Strategic · Operational · Tactical · Technical'],
  next: 'Module 12 moves to the cloud: shared responsibility, IAM, network and data protection, posture management and cloud incident response.'
};
