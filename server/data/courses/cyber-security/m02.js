export default {
  n: 2,
  title: 'Computer Networks & Network Security',
  description: 'Network types and topologies, the OSI and TCP/IP models, IPv4/IPv6, MAC addresses, subnetting and CIDR, core protocols and ports, switching, routing, VLAN, NAT and VPN, firewalls, segmentation, IDS/IPS and safe packet analysis with Wireshark.',
  intro: 'Networking is the base layer of almost every security skill. Phishing links, ransomware spreading between servers, a stolen session cookie and a DDoS flood all travel across a network. Learn how data moves first, and attacks and defenses will make sense.\n\nThink of a network as the Indian Railways. Every train needs a route, a destination station and signals that say when it may move. Data works the same way: each packet carries addresses, routers choose its route, and firewalls act as checkpoints that decide what may continue.\n\nIn this module you follow a packet from your browser to a web server: through the OSI and TCP/IP layers, through IP addressing and subnets, through DNS, TCP and TLS, and through the switches, routers and firewalls in between. Then you see how defenders segment networks, filter traffic and watch it with IDS/IPS and packet captures. Every lab here is safe: run it only on networks and machines you own or are authorized to use.',
  objectives: [
    'Describe LAN, WAN, MAN and common topologies.',
    'Explain the OSI and TCP/IP models and encapsulation.',
    'Work with IPv4/IPv6, MAC addresses, CIDR and subnetting.',
    'Explain DNS, DHCP, ARP, ICMP, TCP, UDP and common ports and protocols.',
    'Describe switching, routing, VLAN, NAT, VPN, proxies and firewalls.',
    'Explain segmentation, IDS/IPS and network monitoring, and read a packet capture safely.'
  ],
  terms: [
    ['Protocol', 'An agreed set of rules for how devices communicate, such as TCP, DNS or HTTP.'],
    ['OSI model', 'A 7-layer reference model of network communication, from Physical (1) to Application (7).'],
    ['Encapsulation', 'Each layer adds its own header as data goes down the stack; the receiver removes them in reverse.'],
    ['CIDR', 'Classless Inter-Domain Routing notation, such as /24, giving the number of network bits in an address.'],
    ['Subnet', 'A smaller logical network carved out of a larger address block.'],
    ['MAC address', 'A 48-bit hardware address of a network interface, used on the local link. It can be spoofed.'],
    ['Port', 'A number (0–65535) that identifies a service on a host; IP + port is a socket.'],
    ['VLAN', 'A logical split of one switch into separate broadcast domains.'],
    ['NAT/PAT', 'Translation of private addresses to a public one; it hides internal layout but is not a firewall.'],
    ['DMZ', 'A separate network zone for public-facing servers, isolated from the internal network.'],
    ['IDS / IPS', 'Intrusion Detection System (alerts, out of band) / Intrusion Prevention System (blocks, inline).'],
    ['Stateful firewall', 'A firewall that tracks connections and automatically allows the return traffic.']
  ],
  diagramTitle: 'Encapsulation and a segmented network',
  ascii: ' SENDER                                                   RECEIVER\n [7 Application  HTTP, DNS ]   data                    [ Application ]\n [4 Transport    TCP/UDP   ]   + TCP hdr  = segment     [ Transport   ]\n [3 Network      IP        ]   + IP hdr   = packet      [ Network     ]\n [2 Data link    Ethernet  ]   + MAC hdr  = frame       [ Data link   ]\n [1 Physical     cable/Wi-Fi]  bits  ------------------> [ Physical    ]\n\n Internet --> [Firewall] --+--> DMZ  (web server: allow TCP 443 only)\n                            +--> Staff VLAN  --> Internet (80/443, DNS)\n                            +--> Server VLAN (only from staff, logged)\n                            +--> Guest Wi-Fi (Internet only, no internal)\n              IPS inline on the edge; IDS on a SPAN port -> SIEM',
  diagramExplain: 'Data gains a header at each layer on the way down and loses it on the way up. A firewall splits the network into zones so an attacker who lands in one zone cannot freely reach the others; IPS blocks known-bad traffic inline while IDS watches a copy and alerts.',
  sections: [
    {
      h: '1. Network fundamentals and topologies',
      t: 'A computer network connects devices, called nodes, so they can exchange data over copper, fiber or wireless links, following agreed rules called protocols. Think of a hostel WhatsApp group: everyone can send and receive messages because they all use the same app and follow the same rules. Remove the shared rules and nobody understands anybody.\n\nNetworks are grouped by size. A PAN covers one person, such as your phone and Bluetooth earbuds. A LAN covers one building or campus, such as your college Wi-Fi. A MAN covers a city, and a WAN connects cities or countries; the Internet is the largest WAN. The topology is the shape of the connections: bus, ring, star or mesh.\n\nModern LANs are almost always star topologies: every device connects to a switch. In a college computer lab, each of the 60 PCs has its own cable running to a switch in the rack, and Wi-Fi laptops reach the same network through an access point. If one cable breaks, only that one PC goes offline and the rest keep working.\n\nFor security, the topology shows you the weak points. In a star, the central switch is a single point of failure, and it is also the best place to watch traffic. The note compares the main topologies and their trade-offs.',
      table: [
        ['Type', 'Area', 'Example'],
        ['PAN', 'Around one person', 'Bluetooth headset'],
        ['LAN', 'One building or campus', 'Office or home Wi-Fi'],
        ['MAN', 'A city or large campus', 'City-wide fiber network'],
        ['WAN', 'Countries or the world', 'The Internet; company links between cities']
      ],
      note: 'Topology trade-offs: bus is cheap but one cable fault breaks all; star is easy to manage but the central switch is a single point of failure; mesh is highly resilient but costly.'
    },
    {
      h: '2. The OSI and TCP/IP models',
      t: 'The OSI model splits network communication into 7 layers, each with one job. Think of sending a parcel by courier. You write a letter, put it in an envelope with a name, the courier puts it in a sack with a city label, and a truck carries the sack. Each step adds its own wrapping and reads only its own label.\n\nFrom top to bottom the layers are Application, Presentation, Session, Transport, Network, Data link and Physical. Memory aid, top to bottom: All People Seem To Need Data Processing. On the way down at the sender, each layer adds a header to the data; this is called encapsulation. At the receiver, each layer removes its header on the way up. The practical TCP/IP model groups the seven into 4: Application, Transport, Internet and Link.\n\nFollow one web request. Your browser creates an HTTP request (Application). TCP adds source and destination port numbers and makes a segment (Transport). IP adds source and destination IP addresses and makes a packet (Network). Ethernet or Wi-Fi adds MAC addresses and makes a frame (Data link). Finally the bits travel as electrical, light or radio signals (Physical).\n\nKnowing the layer tells you which device handles the data and which attacks apply. ARP spoofing is a layer 2 attack, so a firewall that checks only IPs and ports will not see it. SQL injection lives at layer 7, so a router cannot stop it. The table maps each layer to examples and security concerns.',
      table: [
        ['Layer', 'PDU', 'Examples', 'Security concerns'],
        ['7 Application', 'Data', 'HTTP, DNS, SMTP', 'Injection, phishing, protocol abuse'],
        ['6 Presentation', 'Data', 'TLS, encoding, compression', 'Weak ciphers, downgrade attacks'],
        ['5 Session', 'Data', 'Session handling', 'Session hijacking'],
        ['4 Transport', 'Segment / datagram', 'TCP, UDP, ports', 'SYN floods, port scanning'],
        ['3 Network', 'Packet', 'IP, routers, ICMP', 'IP spoofing, routing attacks'],
        ['2 Data link', 'Frame', 'Ethernet, switches, MAC', 'ARP spoofing, MAC flooding, VLAN hopping'],
        ['1 Physical', 'Bits', 'Cables, Wi-Fi radio', 'Tapping, jamming, theft']
      ]
    },
    {
      h: '3. Addressing: IPv4, IPv6 and MAC',
      t: 'Every device on a network needs an address, just as every house needs a postal address. There are two main kinds. IP addresses identify a host on a network, and a laptop gets a new one when it moves to another network. MAC addresses identify an interface on a local link and are set by the manufacturer. Think of the IP address as your hostel room number and the MAC address as the serial number printed on your phone.\n\nAn IPv4 address is 32 bits written as four decimal numbers from 0 to 255, such as 192.168.1.10. That gives about 4.3 billion addresses, which is not enough for today’s devices. IPv6 is 128 bits in hexadecimal, such as 2001:db8::1, a vastly larger space. A MAC address is 48 bits written in hex, such as 3c:22:fb:9a:10:4e.\n\nSome IPv4 ranges are reserved. The private ranges such as 192.168.0.0/16 are used inside homes and offices and are not routable on the Internet. 127.0.0.1 is loopback, which means “this machine”. If your laptop shows an address starting with 169.254, DHCP failed and the system gave itself a link-local address. Run ipconfig /all on Windows or ip addr on Linux to see your own addresses.\n\nFor defenders, addresses are the first clue in any log. If a login came from 10.0.4.22, it came from inside the network; if it came from an unknown public address, it came from outside. That one fact changes how you investigate.',
      table: [
        ['Range', 'Use'],
        ['10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16', 'Private (RFC 1918), not routable on the Internet'],
        ['127.0.0.0/8', 'Loopback (localhost)'],
        ['169.254.0.0/16', 'Link-local (when DHCP fails)'],
        ['224.0.0.0/4', 'Multicast'],
        ['Everything else (mostly)', 'Public']
      ]
    },
    {
      h: '4. Subnetting and CIDR',
      t: 'Subnetting means splitting one network into smaller networks. Think of a large apartment complex divided into blocks A, B, C and D. Each block has its own gate and residents, but all of them share the complex’s address. A company does the same when it gives staff, servers and guests their own subnets.\n\nA subnet mask splits an address into network and host parts; CIDR writes it as a prefix length. /24 means 24 network bits (mask 255.255.255.0), leaving 8 bits for hosts. Two formulas do most of the work. Total addresses = 2^(32 − prefix). Usable hosts = total − 2, because the first address is the network address and the last is the broadcast address.\n\nWorked example: to split 192.168.10.0/24 into 4 equal subnets you need 2 extra bits (2^2 = 4), so the new prefix is /26 with 64 addresses each: 192.168.10.0, .64, .128 and .192. Each subnet has 62 usable hosts. The first one runs from 192.168.10.0 (network) to 192.168.10.63 (broadcast), so its usable hosts are .1 to .62.\n\nSubnetting matters for security because each subnet can get its own firewall rules, as you will see in the segmentation section. Run the Python code to check your answers. Then cover the table and try to rebuild it from the formula.',
      table: [
        ['CIDR', 'Mask', 'Total addresses', 'Usable hosts'],
        ['/24', '255.255.255.0', '256', '254'],
        ['/25', '255.255.255.128', '128', '126'],
        ['/26', '255.255.255.192', '64', '62'],
        ['/27', '255.255.255.224', '32', '30'],
        ['/28', '255.255.255.240', '16', '14'],
        ['/30', '255.255.255.252', '4', '2']
      ],
      code: 'import ipaddress\n\nfor cidr in ["192.168.10.0/26", "172.16.5.64/27"]:\n    net = ipaddress.ip_network(cidr)\n    hosts = list(net.hosts())\n    print(f"Network {net.network_address}  mask {net.netmask}")\n    print(f"  broadcast {net.broadcast_address}  usable {net.num_addresses - 2}")\n    print(f"  first {hosts[0]}  last {hosts[-1]}")',
      lang: 'python'
    },
    {
      h: '5. Core protocols and ports',
      t: 'An IP address gets data to the right machine, but one machine runs many programs at once. A port number tells the machine which program should receive the data. Think of a big government office: the IP address is the building’s address, and the port is the counter number inside. Counter 443 handles secure web traffic and counter 22 handles SSH.\n\nPort numbers run from 0 to 65535 in three ranges. Ports 0 to 1023 are well-known, used by standard services such as DNS (53) and HTTPS (443). Ports 1024 to 49151 are registered for specific applications. Ports 49152 to 65535 are dynamic: your computer picks one for the client side of a connection. A connection is identified by source IP/port and destination IP/port, so the same server port can serve thousands of users at once.\n\nFor example, when you open a website, your laptop at 192.168.1.10 might use source port 51834 to reach the server’s port 443. On Windows, netstat -ano lists these connections with the process ID behind each one. On Linux, ss -tulpn lists the ports your own machine is listening on.\n\nEvery open port is part of the attack surface. A defender should know which ports must be open and close the rest. The table lists the core protocols, their ports and the main security notes, and the note explains the difference between TCP and UDP.',
      table: [
        ['Protocol (port)', 'Layer', 'Purpose', 'Security notes'],
        ['DNS (53)', 'App', 'Names to IPs', 'Cache poisoning, tunneling; use DNSSEC, DoH/DoT'],
        ['DHCP (67/68)', 'App', 'Auto-assigns IP settings', 'Rogue DHCP servers; use DHCP snooping'],
        ['ARP', '2/3', 'IP to MAC on the local link', 'ARP spoofing; use dynamic ARP inspection'],
        ['ICMP', '3', 'Errors, ping', 'Recon, covert channels; filter selectively'],
        ['TCP', '4', 'Reliable, ordered delivery', 'SYN floods; use SYN cookies and rate limits'],
        ['UDP', '4', 'Fast, connectionless', 'Amplification and reflection DDoS'],
        ['HTTP (80) / HTTPS (443)', 'App', 'Web', 'Use HTTPS with modern TLS'],
        ['FTP (21)', 'App', 'File transfer', 'Cleartext; prefer SFTP/FTPS'],
        ['SSH (22)', 'App', 'Secure remote shell', 'Use keys, disable root login, limit exposure'],
        ['SMTP (25)', 'App', 'Email transfer', 'Spoofing; use SPF, DKIM, DMARC']
      ],
      note: 'TCP opens with a three-way handshake (SYN, SYN-ACK, ACK) and gives reliable, ordered delivery: web, email, SSH. UDP has no handshake and no built-in reliability, so it is faster: DNS, VoIP, streaming, games.'
    },
    {
      h: '6. Network devices and technologies',
      t: 'Network devices are the traffic signals, toll booths and junctions of a network. Each one works at a certain layer and makes decisions using a certain address. Knowing which device reads which address helps you see where an attack can happen and where you can stop it.\n\nSwitches learn which MAC address is on which port and forward frames only there. They do this by noting the source MAC of each frame that arrives and saving it in a MAC address table. Routers read the destination IP and choose the next hop using static routes or protocols such as OSPF, which is used inside an organization, and BGP, which connects Internet providers.\n\nFollow your phone loading a website on college Wi-Fi. The access point passes your frames to a switch. The switch sends them to the router. The router uses NAT to swap your private address for the college’s public IP, then forwards the packet toward the Internet. On the way back, NAT reverses the swap. Each device looks only at the labels it needs.\n\nEach device can also be attacked or misconfigured. MAC flooding can overflow a switch’s table. Misconfigured routing and BGP hijacks can redirect traffic: in 2008 a BGP mistake by a Pakistani provider briefly made YouTube unreachable in many countries. The table lists other key devices and technologies, including VLANs, VPNs and load balancers.',
      table: [
        ['Device / tech', 'What it does'],
        ['Switch (L2)', 'Forwards frames by MAC address within a LAN'],
        ['Router (L3)', 'Forwards packets between networks using routing tables'],
        ['Access point', 'Provides Wi-Fi access (use WPA3 or WPA2-Enterprise)'],
        ['VLAN', 'Splits a switch into multiple broadcast domains'],
        ['NAT / PAT', 'Lets many private hosts share one public IP; not a firewall'],
        ['VPN', 'Encrypted tunnel (IPsec, WireGuard, OpenVPN) across untrusted networks'],
        ['Proxy', 'Intermediary for filtering and caching; a reverse proxy protects servers'],
        ['Load balancer', 'Spreads traffic across servers for availability']
      ]
    },
    {
      h: '7. Firewalls and segmentation',
      t: 'A firewall decides which traffic may pass between networks, like the security guard at an apartment gate who checks each visitor against a list. Segmentation divides the network into zones with their own locked doors, so a visitor who gets into one wing cannot walk freely into all the others.\n\nThere are several types. Packet filters decide on IPs, ports and protocols. Stateful firewalls track connections, so a reply to a request from inside is let back in, while an unexpected incoming packet is dropped. Next-generation firewalls (NGFW) add application awareness, user identity, intrusion prevention and TLS inspection. A WAF protects web applications at layer 7, for example by blocking requests that look like SQL injection.\n\nBest practice: default deny, allow only what is required, log, and review rules regularly. Read the sample rules in the table from top to bottom. Rule 1 lets the Internet reach only the DMZ web server on TCP 443. Rule 2 lets staff browse the web and use DNS. Rule 3 blocks guest Wi-Fi from internal networks. Rule 4 denies and logs everything else. A guest laptop trying to open the file server matches rule 3 and is blocked.\n\nSegmentation limits how far an attacker can move: put public systems in a DMZ and separate staff, server, guest and IoT networks. If a cheap smart camera on the IoT network is hacked, the attacker should hit a wall, not reach the payroll server.',
      table: [
        ['#', 'Source', 'Destination', 'Service', 'Action'],
        ['1', 'Internet', 'Web server (DMZ)', 'TCP 443', 'Allow'],
        ['2', 'Staff VLAN', 'Internet', 'TCP 80/443, UDP 53', 'Allow'],
        ['3', 'Guest Wi-Fi', 'Internal VLANs', 'Any', 'Deny'],
        ['4', 'Any', 'Any', 'Any', 'Deny (log)']
      ],
      note: 'Firewall rules are read top to bottom and the first match wins. The final “deny any, log” rule is what makes the policy default-deny.'
    },
    {
      h: '8. IDS, IPS and monitoring',
      t: 'A firewall decides what may pass, but it does not judge everything inside the allowed traffic. Intrusion detection and prevention systems look inside that traffic for signs of attack. Think of a shop with CCTV and a guard. The camera records and raises an alarm (IDS), while the guard can stop a person at the door (IPS).\n\nDetection is signature-based (known patterns) or anomaly-based (deviation from normal). A signature might be a byte pattern from known malware or a known exploit string. It is accurate for known attacks but misses new ones. Anomaly-based detection first learns normal behavior, then flags unusual events, such as an office PC suddenly sending 5 GB to an unknown server at 3 a.m. It can catch new attacks but raises more false alarms.\n\nPlacement matters too. An IDS sits out of band and watches a copy of the traffic from a SPAN port or network tap, so it can only alert. An IPS sits inline, in the path of the traffic, so it can block, but a false positive may also block real users. Open-source tools such as Snort and Suricata can run in either mode.\n\nMonitoring tools collect logs, NetFlow and alerts into a SIEM for analysts (Module 09), who search and connect events from many sources. Detection only helps if someone reviews the alerts and acts on them.',
      table: [
        ['', 'Action', 'Placement', 'Risk'],
        ['IDS', 'Detects and alerts', 'Out of band (SPAN port or tap)', 'Slower response'],
        ['IPS', 'Detects and blocks', 'Inline', 'False positives can block legitimate traffic']
      ]
    },
    {
      h: '9. Packet analysis with Wireshark',
      t: 'Wireshark is a free packet analyzer. It captures the frames passing through a network interface and shows every layer of each packet in readable form. Think of the slow-motion replay in cricket: you can pause on one moment and see exactly what happened, frame by frame.\n\nCapture only on networks you own or are authorized to monitor: captures can contain passwords and personal data. Treat a capture file like a confidential document. To start, choose your own Wi-Fi or Ethernet adapter, start the capture, open a website, then stop. Display filters narrow the view. dns shows only name lookups, and ip.addr == 192.168.1.10 shows packets to or from one host.\n\nA classic lab: on a test VM you own, set up a simple login page served over plain HTTP, log in, and filter the capture with http.request. In the POST request you can read the username and password as plain text. Repeat on an HTTPS site and you see only encrypted TLS records. Cleartext protocols (HTTP, FTP, Telnet) expose credentials to anyone who can capture traffic, which is why encryption in transit matters.\n\nDefenders use Wireshark to investigate alerts, find unexpected connections and confirm that sensitive traffic is encrypted. The table lists useful display filters to begin with.',
      table: [
        ['Display filter', 'Shows'],
        ['dns', 'Only DNS traffic'],
        ['tcp.port == 80', 'Traffic to or from port 80'],
        ['ip.addr == 192.168.1.10', 'Packets involving one host'],
        ['tcp.flags.syn == 1 && tcp.flags.ack == 0', 'New connection attempts (SYNs)'],
        ['http.request', 'HTTP requests']
      ]
    }
  ],
  lab: {
    title: 'Hands-on Lab 02: inspect your own network',
    steps: [
      ['Find your IP address, mask and gateway. Is the address private?', '# Windows\nipconfig /all\n# Linux / macOS\nip addr', 'A 192.168.x.x or 10.x.x.x address is private (RFC 1918); your router translates it with NAT.'],
      ['Find the MAC address of your gateway in the ARP table.', '# Windows\narp -a\n# Linux\nip neigh', 'If two IPs suddenly share one MAC address, that can be a sign of ARP spoofing.'],
      ['Resolve a domain and note which DNS server answers, then trace the route.', 'nslookup example.com\ntracert example.com      # Windows\ndig example.com          # Linux\ntraceroute example.com   # Linux', 'Each traceroute hop is a router. DNS answers can be cached; a poisoned cache sends you to the wrong IP.'],
      ['List listening ports and the program behind each (only on your own machine).', '# Windows\nnetstat -ano\n# Linux\nss -tulpn', 'Every listening port is part of your attack surface. Close what you do not need.'],
      ['Capture safely with Wireshark: start a capture on your interface, open a test page you are allowed to use, stop, then filter with dns and tcp.flags.syn == 1 and follow a TCP stream.', null, 'You will see the three handshake packets and notice that HTTP is readable but HTTPS content is encrypted.']
    ]
  },
  examples: [
    {
      title: 'Subnet calculator (safe, offline)',
      lang: 'python',
      code: 'import ipaddress\n\nnet = ipaddress.ip_network("10.10.0.0/24")\nprint(f"Splitting {net} into 8 subnets:")\nfor sub in net.subnets(new_prefix=27):\n    hosts = list(sub.hosts())\n    print(f"  {sub}  hosts {hosts[0]} - {hosts[-1]}  ({sub.num_addresses - 2} usable)")',
      explanation: 'Eight subnets need 3 extra bits, so /24 becomes /27 with 32 addresses (30 usable) each. The ipaddress module does the binary math for you, which is handy when you plan VLANs.'
    },
    {
      title: 'Checking which TCP ports answer on your own machine',
      lang: 'python',
      code: 'import socket\n\nhost = "127.0.0.1"   # only scan machines you own\nfor port in [22, 80, 443, 3306, 8080]:\n    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:\n        s.settimeout(0.3)\n        state = "open" if s.connect_ex((host, port)) == 0 else "closed"\n        print(f"{host}:{port:<5} {state}")',
      run: false, // browsers cannot open raw TCP sockets; run it on your own machine
      explanation: 'connect_ex tries a full TCP handshake and returns 0 when a service accepts it. This is how a basic port scanner works; Module 08 uses Nmap, which does the same far faster and more carefully. Scanning machines you do not own without permission can be illegal.'
    }
  ],
  best: [
    'Default deny: allow only the traffic each zone needs, and log the rest.',
    'Segment the network: DMZ for public servers, separate VLANs for staff, servers, guests and IoT.',
    'Prefer encrypted protocols: HTTPS, SSH, SFTP, DoH/DoT instead of HTTP, Telnet, FTP.',
    'Change default credentials on routers, cameras and IoT devices.',
    'Enable DHCP snooping and dynamic ARP inspection on managed switches.',
    'Send firewall, DNS and IDS logs to a central SIEM and review them.'
  ],
  mistakes: [
    'Thinking NAT is a firewall: it hides addresses but does not filter traffic on its own.',
    'Forgetting to subtract the network and broadcast addresses when counting usable hosts.',
    'Leaving a flat network where every device can reach every other device.',
    'Putting an IPS inline without tuning, so false positives block real users.',
    'Capturing traffic on a network you are not authorized to monitor.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Which OSI layer does a switch work at? A router? A traditional firewall?\n2. Calculate usable hosts for /27 and /29. List the first and last host in 172.16.5.64/27.\n3. Split 10.10.0.0/24 into 8 subnets. What is each prefix?\n4. Explain why UDP is used for DNS and streaming but TCP for web pages.\n5. Draw the packet flow when you open https://example.com (DNS, TCP, TLS, HTTP).\n6. Design a segmented network for a school with admin, labs, guest Wi-Fi and a public website, and write its firewall rules.'
  },
  mini: {
    title: 'Mini project: secure small-office network design',
    objective: 'Design and prove a segmented, monitored network for a 30-person office.',
    requirements: [
      'A diagram with VLANs, a DMZ and the firewall.',
      'An IP plan with subnets for every VLAN.',
      'A firewall rule table that is default-deny.',
      'A monitoring plan: which logs you collect and where the IDS sits.',
      'A one-page risk summary.'
    ],
    deliverable: 'The design document plus a working Cisco Packet Tracer or GNS3 file that shows the rules being enforced.'
  },
  takeaways: [
    'Networks move data in layers; each layer has its own protocols and attacks.',
    'Subnetting is an essential skill: total = 2^(32 − prefix), usable = total − 2.',
    'TCP is reliable and connection-based; UDP is fast and connectionless.',
    'Defense combines segmentation, default-deny firewalls, IDS/IPS, encryption and monitoring.',
    'Capture and test only on networks you are authorized to use.'
  ],
  quickRef: [
    'OSI 7→1: Application · Presentation · Session · Transport · Network · Data link · Physical',
    'Ports: 21 FTP · 22 SSH · 25 SMTP · 53 DNS · 80 HTTP · 443 HTTPS · 3389 RDP',
    'Private: 10/8 · 172.16/12 · 192.168/16 · Loopback 127/8',
    '/26 = 64 addresses, 62 usable · /27 = 32, 30 usable · /30 = 4, 2 usable',
    'Handshake: SYN → SYN-ACK → ACK'
  ],
  refs: [
    ['RFC 1918: Address Allocation for Private Internets', 'https://www.rfc-editor.org/rfc/rfc1918'],
    ['RFC 9293: Transmission Control Protocol', 'https://www.rfc-editor.org/rfc/rfc9293'],
    ['Wireshark User’s Guide', 'https://www.wireshark.org/docs/'],
    ['NIST SP 800-41: Guidelines on Firewalls and Firewall Policy', 'https://csrc.nist.gov/pubs/sp/800/41/r1/final'],
    ['NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems', 'https://csrc.nist.gov/pubs/sp/800/94/final']
  ],
  quiz: [
    ['Which protocol maps IP addresses to MAC addresses on a LAN?', ['DNS', 'ARP', 'DHCP', 'ICMP'], 1, 'ARP resolves IPv4 to MAC addresses (IPv6 uses Neighbor Discovery).'],
    ['How many usable hosts are in a /26 network?', ['64', '62', '30', '126'], 1, '2^6 = 64 addresses minus the network and broadcast addresses = 62.'],
    ['Which device is placed inline and can block malicious traffic?', ['IDS', 'Hub', 'IPS', 'Switch'], 2, 'An IPS sits inline and can drop traffic; an IDS only alerts.'],
    ['Which port does HTTPS use by default?', ['80', '22', '443', '53'], 2, 'HTTPS uses TCP 443; 80 is HTTP, 22 SSH and 53 DNS.'],
    ['What does the TCP three-way handshake consist of?', ['SYN, SYN-ACK, ACK', 'ACK, SYN, FIN', 'SYN, ACK, FIN', 'GET, POST, OK'], 0, 'The client sends SYN, the server replies SYN-ACK, and the client completes with ACK.']
  ],

  skills: ['Read the OSI/TCP-IP layers', 'Subnet with CIDR', 'Recognize ports and protocol risks', 'Design segmented networks and firewall rules', 'Filter a packet capture'],
  prereq: ['Module 01: CIA Triad and attack surface'],
  analogy: 'Sending a parcel: you write the letter (application data), put it in an envelope with a room number (port), then a box with a street address (IP), then a courier sack with the next depot’s code (MAC). Each depot only reads its own label. Firewalls are the security desk at each building, checking who may enter which floor.',
  why: 'Every attack and every alert you will analyze is network traffic. Without layers, addresses, ports and protocols, scanner output, firewall logs and SIEM alerts look like noise.',
  workflow: {
    title: 'What happens when you open https://example.com',
    nodes: [
      ['dns', 'DNS lookup', 'Name → IP', 'example.com', 'IP address', 'Your computer asks its DNS resolver (UDP 53, or DoH/DoT when encrypted) for the IP address of example.com. A poisoned answer here would send you to an attacker’s server, which is why DNSSEC and trusted resolvers matter.'],
      ['arp', 'Find the gateway', 'ARP for the router’s MAC', 'Gateway IP', 'Gateway MAC', 'The destination is on another network, so your PC sends the frame to its default gateway. ARP finds the gateway’s MAC address on the local link. ARP spoofing attacks lie at exactly this step.'],
      ['tcp', 'TCP handshake', 'SYN, SYN-ACK, ACK', 'Server IP:443', 'Open connection', 'Your PC opens a TCP connection to port 443. The three-way handshake agrees on sequence numbers. Floods of SYNs without the final ACK are a classic denial-of-service attack.'],
      ['tls', 'TLS handshake', 'Encrypt the channel', 'Certificate', 'Session keys', 'The server proves its identity with a certificate and both sides agree on session keys (Module 05). From here on, anyone capturing packets sees only encrypted bytes.'],
      ['http', 'HTTP request', 'GET / over TLS', 'Encrypted request', 'Web page', 'The browser sends the HTTP request inside TLS. Firewalls, a WAF and the web server logs see and filter this traffic on the way.'],
      ['fw', 'Filtered and logged', 'Firewall, IDS, SIEM', 'Traffic', 'Alerts and logs', 'At the network edge the firewall allows only TCP 443 to the DMZ web server, an IDS watches a copy of the traffic, and logs go to the SIEM for the SOC.']
    ],
    explanation: 'Each step uses a different layer and protocol, and each one has its own attacks and defenses.'
  },
  caseStudy: {
    title: 'The Mirai botnet (2016)',
    problem: 'Hundreds of thousands of cameras and routers still used factory default passwords and were reachable from the Internet over Telnet.',
    data: 'Internet-wide scanning, default credential lists, DDoS traffic statistics.',
    steps: ['Mirai scanned the Internet for Telnet on IoT devices.', 'It logged in with a short list of default usernames and passwords.', 'Infected devices joined a botnet controlled by the attackers.', 'The botnet launched very large DDoS floods, including against DNS provider Dyn, making major websites unreachable.'],
    result: 'Availability was lost for many services that were never attacked directly, because they depended on one DNS provider.',
    limitations: 'Summary simplified. The lessons hold: change default passwords, segment IoT, patch firmware, and filter outbound traffic.'
  },
  exercises: [
    { title: 'Usable hosts in a /27', objective: 'Apply the subnetting formula.', problem: 'How many usable host addresses does a /27 network have?', answer: 30, hints: ['32 − 27 = 5 host bits.', '2^5 = 32 total addresses.'], solution: ['Total = 2^(32 − 27) = 32.', 'Usable = 32 − 2 = 30.'], explanation: 'Subtract the network and broadcast addresses.' },
    { title: 'Prefix for 8 subnets', objective: 'Borrow bits to subnet.', problem: 'You split 10.10.0.0/24 into 8 equal subnets. What is the new prefix length? (Enter the number only.)', answer: 27, hints: ['8 = 2^3, so you borrow 3 bits.'], solution: ['24 + 3 = 27.', 'Each /27 has 32 addresses.'], explanation: 'Each borrowed bit doubles the number of subnets and halves their size.' },
    { title: 'IDS or IPS?', objective: 'Choose placement by requirement.', problem: 'The security team wants to automatically drop traffic matching a known exploit signature before it reaches the web server. Which should they deploy?', options: ['IDS on a SPAN port', 'IPS inline', 'A hub', 'NAT'], answer: 1, hints: ['Which one can block?'], solution: ['Only an inline device can drop packets.', 'An IPS sits inline and blocks matches.'], explanation: 'An IDS only alerts; it sees a copy of the traffic.' },
    { title: 'Which protocol is cleartext?', objective: 'Spot insecure protocols.', problem: 'Which protocol sends usernames and passwords in readable text that Wireshark can show?', options: ['SSH', 'HTTPS', 'Telnet', 'SFTP'], answer: 2, hints: ['Which one has no encryption at all?'], solution: ['SSH, HTTPS and SFTP encrypt the session.', 'Telnet sends everything in cleartext.'], explanation: 'Replace Telnet with SSH everywhere.' }
  ],
  checks: [
    ['Which address range is private (RFC 1918)?', ['8.8.8.0/24', '172.16.0.0/12', '1.1.1.0/24', '224.0.0.0/4'], 1, '10/8, 172.16/12 and 192.168/16 are private.'],
    ['Why is DNS usually carried over UDP?', ['UDP is encrypted', 'Small queries need speed more than a handshake', 'TCP cannot carry names', 'UDP uses port 443'], 1, 'One small request and reply does not need TCP’s setup cost.'],
    ['What does a VLAN provide?', ['Encryption', 'Logical separation into broadcast domains', 'Public IP addresses', 'Malware scanning'], 1, 'VLANs segment a switch into separate logical networks.']
  ],
  cheat: ['Total = 2^(32 − prefix) · Usable = total − 2', 'Wireshark: dns · tcp.port == 80 · http.request', 'Firewall: default deny, first match wins, log the final deny', 'IDS = alert (out of band) · IPS = block (inline)', 'Windows: ipconfig /all · arp -a · netstat -ano · Linux: ip addr · ip neigh · ss -tulpn'],
  next: 'Module 03 hardens the machines on the network: Linux and Windows users, permissions, services, logs and patching.'
};
