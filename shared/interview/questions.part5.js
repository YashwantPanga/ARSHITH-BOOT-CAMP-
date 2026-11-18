// Interview Questions, questions 178-214: more Computer Networks, System Design & DevOps and the HR round.
// Same answer format as questions60.js; every snippet is unique and runs as written.

const Q = (n, topic, difficulty, title, answer, code, lang) => ({
  id: `iq-${n}`, n, topic, difficulty, title,
  answer: Array.isArray(answer) ? answer.join('\n\n') : answer,
  ...(code ? { code: code.replace(/^\n/, '') } : {}), ...(lang ? { lang } : {})
});
const L = (...items) => items.map(x => `- ${x}`).join('\n');
const N = (...items) => items.map((x, i) => `${i + 1}. ${x}`).join('\n');
const C = String.raw;

export const QUESTIONS_PART5 = [
  // ---------------- Computer Networks ----------------
  Q(178, 'Computer Networks', 'Medium', 'HTTP/1.1 vs HTTP/2 vs HTTP/3?', [
    "All three carry the same HTTP semantics (methods, headers, status codes). What changes is **how the bytes travel**, which mostly affects speed.",
    L("**HTTP/1.1** (1997): text-based, one request at a time per TCP connection. A slow response blocks those behind it (**head-of-line blocking**), so browsers open about six connections per domain. Keep-alive reuses connections, but sites still resorted to tricks such as bundling files and image sprites.",
      "**HTTP/2** (2015): a **binary** framing layer with **multiplexing**: many requests and responses share **one** TCP connection as interleaved streams. It adds **HPACK header compression** and stream prioritisation. The remaining problem: it still runs on TCP, so one lost packet stalls **every** stream until it is retransmitted (TCP-level head-of-line blocking).",
      "**HTTP/3** (2022): runs over **QUIC**, a transport built on **UDP**. Each stream is independent, so packet loss on one does not block the others. TLS 1.3 is built in, connection set-up takes 1 round trip (0 for repeat visits), and **connection migration** keeps a download alive when a phone switches from Wi-Fi to mobile data."),
    "All major browsers and CDNs support HTTP/2 and HTTP/3; servers advertise HTTP/3 support with the `Alt-Svc` header, and clients fall back automatically.",
    "Interview tip: tell the story as one problem solved per version: HTTP/2 fixed head-of-line blocking at the HTTP layer, HTTP/3 fixed it at the transport layer."
  ]),

  Q(179, 'Computer Networks', 'Hard', 'What happens during a TLS handshake? Symmetric vs asymmetric encryption?', [
    "TLS needs two kinds of cryptography, each used for what it is good at:",
    L("**Asymmetric** (public-key) cryptography, such as RSA or elliptic curves: a **public key** anyone can use and a **private key** only the owner has. It enables key exchange and digital signatures without a shared secret, but it is slow.",
      "**Symmetric** cryptography, such as AES-GCM or ChaCha20: the **same secret key** encrypts and decrypts. It is very fast, but both sides must somehow agree on the key first."),
    "So TLS uses asymmetric cryptography to **authenticate the server and agree on a key**, then symmetric encryption for all the data. A simplified TLS 1.3 handshake:",
    N("**ClientHello**: the client sends supported cipher suites, a random value and its **key share** (an ephemeral Diffie-Hellman public value).",
      "**ServerHello**: the server picks the cipher suite and sends its own key share. Both sides now compute the **same shared secret** with Diffie-Hellman, and an eavesdropper who saw both public values still cannot.",
      "The server sends its **certificate** and a **signature** made with its private key over the handshake so far. The client checks that the certificate chains up to a trusted **certificate authority**, matches the domain and has not expired, and verifies the signature.",
      "Both send **Finished** messages, which prove the handshake was not tampered with. Application data then flows, encrypted with symmetric keys derived from the shared secret."),
    "TLS 1.3 needs only **one round trip** (TLS 1.2 needed two) and always uses ephemeral keys, giving **forward secrecy**: stealing the server's private key later does not decrypt past sessions.",
    "Interview tip: say clearly that the certificate proves identity and Diffie-Hellman creates the key. Mixing those two roles up is the most common mistake."
  ]),

  Q(180, 'Computer Networks', 'Easy', 'Hashing vs encryption vs encoding?', [
    "All three transform data, but for completely different purposes. Confusing them is a classic security mistake.",
    L("**Encoding** changes the **format** so data can travel safely through a system, such as Base64 for binary data in JSON or email, URL encoding, or UTF-8. It uses no key and is **trivially reversible**. Encoding provides **no security**: Base64 is not encryption.",
      "**Encryption** protects **confidentiality**. With the right **key** the data can be decrypted back; without it, it cannot. Symmetric (AES) or asymmetric (RSA, ECC). Used for HTTPS, stored credit-card numbers and disk encryption.",
      "**Hashing** is a **one-way** function that maps any input to a fixed-size digest (SHA-256 gives 256 bits). It cannot be reversed, the same input always gives the same output, and a tiny change in input changes the output completely. Used for integrity checks (file checksums), digital signatures, deduplication and password storage."),
    "Passwords need a special kind of hashing. Fast hashes like SHA-256 let attackers try billions of guesses per second, so use a deliberately **slow, salted** password hash: **bcrypt**, **scrypt**, **Argon2** or PBKDF2. A random **salt** per user means identical passwords produce different hashes and defeats precomputed rainbow tables.",
    "**HMAC** combines a hash with a secret key to prove a message came from someone who knows the key and was not altered. Webhook signatures and JWT HS256 tokens use it.",
    "Interview tip: answer \"how do you store passwords?\" with \"a salted slow hash such as bcrypt or Argon2, never encryption and never plain SHA-256\"."
  ], C`
import base64
import hashlib
import hmac
import os

data = "pay 500 to Asha"

encoded = base64.b64encode(data.encode()).decode()          # encoding: no key, reversible
print(encoded, "->", base64.b64decode(encoded).decode())

digest = hashlib.sha256(data.encode()).hexdigest()           # hashing: one-way, fixed size
print(digest[:16], len(digest) * 4, "bits")
print(hashlib.sha256(b"pay 501 to Asha").hexdigest()[:16])   # tiny change, totally different

salt = os.urandom(16)                                        # password storage: salted + slow
stored = hashlib.pbkdf2_hmac("sha256", b"s3cret!", salt, 200_000)
attempt = hashlib.pbkdf2_hmac("sha256", b"s3cret!", salt, 200_000)
print("password ok:", hmac.compare_digest(stored, attempt))

signature = hmac.new(b"webhook-key", data.encode(), hashlib.sha256).hexdigest()   # HMAC
print("signature:", signature[:16])`),

  Q(181, 'Computer Networks', 'Medium', 'What is NAT, and why is it needed?', [
    "**Network Address Translation (NAT)** lets many devices on a private network share **one public IP address**. Your home router does it: your laptop and phone have private addresses such as `192.168.1.5`, but the internet sees only the router's single public address.",
    "Why it exists: there are only about 4.3 billion IPv4 addresses, far fewer than connected devices. Private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) can be reused inside every network, and NAT translates at the boundary.",
    "How the common form (**PAT**, port address translation, or NAT overload) works:",
    N("Your laptop `192.168.1.5:51000` sends a packet to a web server.",
      "The router rewrites the **source** to its public IP and a free port, say `203.0.113.7:62001`, and records the mapping in its **NAT table**.",
      "The reply comes back to `203.0.113.7:62001`; the router looks up the table and forwards it to `192.168.1.5:51000`."),
    "Side effects worth knowing:",
    L("Unsolicited inbound connections are dropped because there is no table entry, which acts as a basic (accidental) firewall.",
      "Hosting a server behind NAT needs **port forwarding** (a static mapping).",
      "Peer-to-peer apps such as video calls need **NAT traversal** techniques (STUN, TURN, ICE, hole punching).",
      "Mobile carriers often use **carrier-grade NAT**, so many customers share one public IP."),
    "IPv6 has enough addresses that NAT is generally unnecessary, though firewalls are still used.",
    "Interview tip: explain using the NAT table with a concrete IP and port example. It is much clearer than a definition."
  ]),

  Q(182, 'Computer Networks', 'Easy', 'What is DHCP? Explain the DORA process.', [
    "**DHCP (Dynamic Host Configuration Protocol)** automatically gives a device the network settings it needs when it joins a network: an **IP address**, the **subnet mask**, the **default gateway** (router) and the **DNS servers**. Without it, someone would configure each device by hand and must avoid duplicates.",
    "It works in four steps, remembered as **DORA**:",
    N("**Discover**: the new device has no IP yet, so it **broadcasts** \"is there a DHCP server?\" (from `0.0.0.0` to `255.255.255.255`, UDP port 67).",
      "**Offer**: a DHCP server replies with an available IP address and the settings.",
      "**Request**: the client broadcasts that it accepts this offer. Broadcasting tells any other servers that their offers were declined.",
      "**Acknowledge**: the server confirms, and the client starts using the address."),
    "Key details:",
    L("Addresses are **leased** for a period (such as 24 hours). The client tries to renew at half the lease time, so the address usually stays the same.",
      "**Reservations** always give a particular device (identified by its MAC address) the same IP, which is useful for printers and servers.",
      "Broadcasts do not cross routers, so large networks use a **DHCP relay agent** to forward requests to a central server.",
      "If no server answers, a device may give itself a link-local `169.254.x.x` address, a common sign of a DHCP problem."),
    "Interview tip: list the four DORA steps and mention that Discover and Request are broadcasts. The broadcast detail is often the follow-up."
  ]),

  Q(183, 'Computer Networks', 'Medium', 'What is ARP, and how does it work?', [
    "**ARP (Address Resolution Protocol)** finds the **MAC address** (hardware address) that belongs to an **IP address** on the local network. IP addresses route packets between networks, but on the local link, Ethernet and Wi-Fi frames are delivered by MAC address, so a device needs both.",
    "How it works:",
    N("A host wants to send to `192.168.1.20`. It first checks its **ARP cache**.",
      "If the address is not there, it **broadcasts** an ARP request to every device on the LAN: \"who has 192.168.1.20? Tell 192.168.1.5\".",
      "The owner of that IP replies **directly (unicast)** with its MAC address.",
      "The sender stores the mapping in its ARP cache for a few minutes and sends the frame."),
    "An important detail: for a destination **outside** the local subnet, the host does **not** ARP for the remote IP. It ARPs for the **default gateway's** MAC address and sends the frame to the router, which forwards it onwards. You can see your cache with `arp -a`.",
    "Security: ARP has **no authentication**, so an attacker on the same LAN can send fake replies claiming to be the gateway (**ARP spoofing or poisoning**) and intercept traffic in a man-in-the-middle attack. Defences include dynamic ARP inspection on switches, static entries for critical hosts, and encrypting traffic with TLS anyway.",
    "In IPv6, ARP is replaced by the **Neighbor Discovery Protocol (NDP)**.",
    "Interview tip: mention the default-gateway case. It shows you understand how ARP fits with routing."
  ]),

  Q(184, 'Computer Networks', 'Easy', 'Hub vs switch vs router? MAC address vs IP address?', [
    "Start with the two kinds of address:",
    L("A **MAC address** is a 48-bit hardware address burned into each network interface, such as `3C:22:FB:1A:9E:04`. It identifies a device **on the local network** (layer 2) and does not change as the device moves.",
      "An **IP address** is a logical address assigned by the network (layer 3), such as `192.168.1.5`. It identifies **where** a device is, so packets can be routed across networks, and it changes when you join a different network."),
    "Analogy: the MAC address is your name, the IP address is your current postal address.",
    "Now the devices:",
    L("**Hub** (layer 1): a simple repeater. Whatever arrives on one port is copied to **all** ports. Every device shares the bandwidth and sees every frame, and collisions are common. Obsolete today.",
      "**Switch** (layer 2): learns which MAC address is on which port (its MAC table) and forwards each frame **only to the right port**. Each port is its own collision domain, and many conversations happen at once. Connects devices **within** a LAN.",
      "**Router** (layer 3): forwards packets **between different networks** using IP addresses and a routing table, picking the next hop. It separates broadcast domains, and at home it also does NAT, DHCP and firewalling."),
    "A home \"Wi-Fi router\" usually combines a router, a switch, a wireless access point, a DHCP server and a firewall in one box. In data centres, **layer-3 switches** route at switch speed.",
    "Interview tip: map each device to its OSI layer: hub 1, switch 2, router 3. Most of the question is that mapping."
  ]),

  Q(185, 'Computer Networks', 'Hard', 'How does TCP provide reliable delivery? Explain flow and congestion control.', [
    "IP itself is best-effort: packets can be lost, duplicated or arrive out of order. TCP builds a **reliable, ordered byte stream** on top using several mechanisms:",
    L("**Sequence numbers**: every byte is numbered, so the receiver can reorder segments and discard duplicates.",
      "**Acknowledgements**: the receiver sends back the next byte number it expects (cumulative ACK). Selective ACKs (SACK) report exactly which blocks arrived.",
      "**Retransmission**: if no ACK arrives within the **retransmission timeout** (calculated from measured round-trip times), or after **three duplicate ACKs** (fast retransmit), the sender resends.",
      "**Checksums**: corrupted segments are detected and dropped, which leads to retransmission."),
    "**Flow control** protects the **receiver**. Each ACK advertises a **receive window**: how many bytes the receiver has buffer space for. The sender never has more unacknowledged data in flight than that window (the **sliding window**). A window of 0 pauses the sender.",
    "**Congestion control** protects the **network**. The sender keeps a **congestion window (cwnd)**, and the amount in flight is the smaller of cwnd and the receive window.",
    L("**Slow start**: cwnd starts small and **doubles** every round trip until it reaches a threshold.",
      "**Congestion avoidance**: after that, it grows by about one segment per round trip (additive increase).",
      "**On loss**: cwnd is cut, typically halved (multiplicative decrease), and growth starts again. This pattern is called **AIMD**.",
      "Modern algorithms: **CUBIC** (the Linux default) and Google's **BBR**, which models bandwidth and delay instead of waiting for loss."),
    "Interview tip: separate the two clearly: flow control means \"don't overwhelm the receiver\", congestion control means \"don't overwhelm the network\"."
  ]),

  Q(186, 'Computer Networks', 'Medium', 'What are WebSockets? How do they compare with polling and Server-Sent Events?', [
    "Plain HTTP is **request-response**: the server can only answer when the client asks. Real-time features such as chat, live scores, collaborative editing and trading dashboards need the server to **push** data as soon as it changes. The options:",
    L("**Short polling**: the client asks every few seconds (\"anything new?\"). Simple, but wasteful, and updates are late by up to the interval.",
      "**Long polling**: the client sends a request that the server **holds open** until there is news or a timeout, then the client immediately asks again. Near real-time, but each message costs a full HTTP request.",
      "**Server-Sent Events (SSE)**: one long-lived HTTP response through which the server streams text events. **One-way** (server to client), with automatic reconnection built in. Good for notifications and live feeds.",
      "**WebSockets**: a **full-duplex, persistent** connection. It starts as an HTTP request with `Upgrade: websocket`; the server answers `101 Switching Protocols`, and from then on both sides send small frames at any time over the same TCP connection, with very little overhead."),
    "WebSocket considerations: connections are **stateful**, so scaling across servers needs sticky sessions or a pub/sub backbone (such as Redis) to fan messages out; you need heartbeats (ping/pong) to detect dead connections, and reconnection logic. Use `wss://` (TLS) in production.",
    "Choose SSE for one-way updates, WebSockets for two-way interaction, and polling only when updates are rare.",
    "Interview tip: mention the `101 Switching Protocols` upgrade. It shows you know WebSockets start life as HTTP."
  ], C`
// Browser code (or Node 22+, which has a global WebSocket)
const socket = new WebSocket("wss://echo.websocket.org");

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ type: "join", room: "sql-doubts" }));
});

socket.addEventListener("message", (event) => {
  console.log("server pushed:", event.data);     // arrives without asking
  socket.close();
});

socket.addEventListener("close", () => console.log("connection closed"));

// For comparison, Server-Sent Events (one-way, server to browser):
// const feed = new EventSource("/api/live-scores");
// feed.onmessage = (e) => console.log("score update:", e.data);`),

  Q(187, 'Computer Networks', 'Medium', 'Forward proxy vs reverse proxy?', [
    "Both are servers that sit in the middle of a connection. The difference is **whom they act for**.",
    L("A **forward proxy** acts for the **clients**. Clients (for example all laptops in an office) send their requests to the proxy, which contacts the internet on their behalf. The websites see the proxy's IP, not the users'. Uses: company content filtering and logging, caching for many users, bypassing geographic restrictions, and anonymity.",
      "A **reverse proxy** acts for the **servers**. Clients think they are talking to the website, but they reach the proxy, which forwards each request to one of the real backend servers hidden behind it. Uses: **load balancing**, **TLS termination** (decrypt HTTPS once at the edge), caching static files, compression, rate limiting, a web application firewall, and serving many apps from one domain by path (`/api` to one service, `/` to another)."),
    "Common reverse proxies: **Nginx**, **HAProxy**, **Envoy**, **Traefik**, and managed versions such as AWS ALB and Cloudflare. An **API gateway** is a reverse proxy with extra API features (authentication, quotas, routing per service).",
    "Interview tip: the one-line answer is \"a forward proxy hides the clients, a reverse proxy hides the servers\"."
  ], C`
# /etc/nginx/conf.d/codelekho.conf: Nginx as a reverse proxy
upstream api_servers {
    least_conn;                          # load-balance to the least busy server
    server 10.0.0.11:5000;
    server 10.0.0.12:5000;
}

server {
    listen 443 ssl;                      # TLS terminates here
    server_name app.example.com;
    ssl_certificate     /etc/ssl/app.crt;
    ssl_certificate_key /etc/ssl/app.key;

    location /api/ {
        proxy_pass http://api_servers;   # clients never see the backend IPs
        proxy_set_header X-Forwarded-For $remote_addr;
    }
    location / {
        root /var/www/app;               # static files served directly
        try_files $uri /index.html;
    }
}`, 'nginx'),

  Q(188, 'Computer Networks', 'Medium', 'What is a socket? Show a simple client-server program.', [
    "A **socket** is one endpoint of a network conversation, identified by an **IP address and a port**. A TCP connection is uniquely identified by four values: source IP, source port, destination IP and destination port. That is how one web server on port 443 can talk to thousands of clients at once.",
    "The lifecycle of a TCP server and client:",
    L("**Server**: `socket()` creates it, `bind()` attaches it to an address and port, `listen()` marks it as accepting connections, and `accept()` waits for a client and returns a **new socket** dedicated to that client. Then `recv()` and `send()`, and finally `close()`.",
      "**Client**: `socket()`, then `connect()` to the server's address (this triggers the three-way handshake), then `send()` and `recv()`, then `close()`."),
    "UDP sockets skip `listen`, `accept` and `connect`: they simply `sendto()` and `recvfrom()` individual datagrams.",
    "Details interviewers like: TCP is a **byte stream**, not messages, so one `send()` may arrive as several `recv()` calls and the application needs framing (a length prefix or a delimiter); a server handles many clients with threads, processes, or an event loop using `select`/`epoll` (how Nginx and Node.js scale); and every HTTP library you use is built on these calls.",
    "Interview tip: point out that `accept()` returns a new socket per client. It explains how one listening port serves many connections."
  ], C`
import socket
import threading

ready = threading.Event()

def server():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as srv:
        srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        srv.bind(("127.0.0.1", 50007))
        srv.listen()
        ready.set()
        conn, addr = srv.accept()                # new socket for this client
        with conn:
            data = conn.recv(1024)
            conn.sendall(b"echo: " + data.upper())

t = threading.Thread(target=server)
t.start()
ready.wait()

with socket.create_connection(("127.0.0.1", 50007)) as client:   # connect = handshake
    client.sendall(b"hello from the client")
    print(client.recv(1024).decode())            # echo: HELLO FROM THE CLIENT
t.join()`),

  Q(189, 'Computer Networks', 'Easy', 'What do a firewall and a VPN do?', [
    "Both are network security tools, but they solve different problems.",
    "A **firewall** decides **which traffic is allowed** in or out, based on rules. Types:",
    L("**Packet-filtering (stateless)**: checks each packet's source and destination IP, port and protocol against rules, such as \"allow TCP 443, block everything else\".",
      "**Stateful**: remembers connections, so replies to traffic you started are allowed automatically while unsolicited inbound traffic is blocked. Most firewalls today work this way.",
      "**Application-layer / next-generation**: understands protocols such as HTTP and can block specific URLs, malware or applications. A **WAF** (web application firewall) protects websites from attacks such as SQL injection and XSS."),
    "Firewalls exist on hosts (Windows Defender Firewall, `iptables`/`nftables` on Linux), on network edges, and in the cloud as **security groups** in AWS or Azure. Good practice is **default deny**: block everything and allow only what is needed.",
    "A **VPN (Virtual Private Network)** creates an **encrypted tunnel** over an untrusted network such as the internet.",
    L("**Remote-access VPN**: an employee working from home connects to the company network as if they were in the office.",
      "**Site-to-site VPN**: links two offices' networks permanently.",
      "Consumer VPNs hide your traffic from the local Wi-Fi network or your ISP; the VPN provider can still see it."),
    "Common VPN protocols: **IPsec**, **OpenVPN** and **WireGuard** (modern, fast and simple). Many companies now move to **zero-trust** access, which verifies every user and device per application instead of trusting everyone inside the VPN.",
    "Interview tip: in one line each: a firewall filters traffic, a VPN encrypts and tunnels it."
  ]),

  // ---------------- System Design & DevOps ----------------
  Q(190, 'System Design & DevOps', 'Hard', 'What is consistent hashing, and why is it used?', [
    "Suppose you spread cache keys over N servers with `server = hash(key) % N`. It works until N changes: add or remove **one** server and almost **every** key maps to a different server, so the whole cache is effectively emptied at once and the database is flooded.",
    "**Consistent hashing** fixes this. Picture a ring of hash values from 0 to 2 to the 32nd:",
    N("Hash each **server** onto positions on the ring.",
      "Hash each **key** onto the ring too.",
      "A key belongs to the **first server clockwise** from its position."),
    "When a server is added, it takes over only the keys between it and the previous server; when one is removed, only its keys move to the next server. On average only **K / N keys move** (K keys, N servers) instead of nearly all of them.",
    "**Virtual nodes**: with few servers, positions on the ring are uneven and one server can get far more keys than others. Placing each physical server at many points on the ring (for example 100 virtual nodes each) evens out the load and lets bigger machines take more virtual nodes.",
    "Where it is used: distributed caches (Memcached clients), **Amazon DynamoDB** and **Cassandra** for partitioning data, CDNs, and load balancers that need session affinity.",
    "Interview tip: lead with the problem of `hash % N` when N changes, then show how the ring limits movement. The problem is what makes the solution meaningful."
  ], C`
import bisect
import hashlib

def h(value):
    return int(hashlib.md5(value.encode()).hexdigest(), 16) % (2 ** 32)

class HashRing:
    def __init__(self, servers, vnodes=100):
        self.ring = sorted((h(f"{s}#{i}"), s) for s in servers for i in range(vnodes))
        self.points = [p for p, _ in self.ring]

    def server_for(self, key):
        i = bisect.bisect(self.points, h(key)) % len(self.ring)   # first clockwise
        return self.ring[i][1]

keys = [f"user:{i}" for i in range(10_000)]

before = HashRing(["cache-a", "cache-b", "cache-c"])
after = HashRing(["cache-a", "cache-b", "cache-c", "cache-d"])
moved = sum(before.server_for(k) != after.server_for(k) for k in keys)
print(f"consistent hashing moved {moved / len(keys):.0%} of keys")      # roughly a quarter

modulo_moved = sum(h(k) % 3 != h(k) % 4 for k in keys)
print(f"hash % N moved {modulo_moved / len(keys):.0%} of keys")          # about 75%`),

  Q(191, 'System Design & DevOps', 'Hard', 'How would you design a rate limiter?', [
    "A **rate limiter** caps how many requests a client can make in a time window, such as 100 requests per minute per API key. It protects services from abuse, brute-force login attempts and accidental overload, and enforces pricing tiers. Over the limit, return **HTTP 429 Too Many Requests** with a `Retry-After` header.",
    "Common algorithms:",
    L("**Fixed window counter**: count requests per calendar minute. Simple, but allows bursts of twice the limit at a window boundary (100 at 0:59 and 100 at 1:00).",
      "**Sliding window log**: store each request's timestamp and count those in the last 60 seconds. Exact, but memory-hungry.",
      "**Sliding window counter**: blend the current and previous window counts by how far into the window you are. Accurate enough and cheap.",
      "**Token bucket**: a bucket holds up to `capacity` tokens and refills at a steady rate; each request spends one token. It allows **short bursts** while enforcing an average rate. Used by AWS and Stripe.",
      "**Leaky bucket**: requests queue and leave at a fixed rate, which smooths traffic completely."),
    "Design decisions:",
    L("**Where**: at the API gateway or reverse proxy, so bad traffic never reaches the services.",
      "**Key**: per user, per API key or per IP, often with different limits per endpoint.",
      "**Distributed state**: with many gateway servers the counters must be shared, typically in **Redis** using atomic operations (`INCR` with `EXPIRE`, or a Lua script for the token bucket).",
      "**Failure mode**: if Redis is down, decide whether to fail open (allow) or fail closed (block).",
      "Return headers such as `X-RateLimit-Remaining` so clients can slow down politely."),
    "Interview tip: pick the token bucket, explain why (bursts allowed, average enforced), then discuss Redis for the distributed case."
  ], C`
import time

class TokenBucket:
    def __init__(self, capacity, refill_per_second):
        self.capacity = capacity
        self.tokens = capacity
        self.rate = refill_per_second
        self.updated = time.monotonic()

    def allow(self):
        now = time.monotonic()
        self.tokens = min(self.capacity, self.tokens + (now - self.updated) * self.rate)
        self.updated = now
        if self.tokens >= 1:
            self.tokens -= 1
            return True
        return False                         # caller should answer HTTP 429

limiter = TokenBucket(capacity=5, refill_per_second=2)
burst = [limiter.allow() for _ in range(8)]
print("burst of 8:", burst)                  # first 5 allowed, then refused
time.sleep(1.0)                              # about 2 tokens refill
print("after 1s:", [limiter.allow() for _ in range(3)])   # [True, True, False]`),

  Q(192, 'System Design & DevOps', 'Medium', 'How do you design a system for high availability?', [
    "**Availability** is the percentage of time a system works. It is usually quoted in \"nines\":",
    L("99% allows about 3.65 days of downtime per year.",
      "99.9% (three nines) allows about 8.8 hours per year.",
      "99.99% (four nines) allows about 52 minutes per year.",
      "99.999% (five nines) allows about 5 minutes per year."),
    "An **SLA** is the promise to customers, an **SLO** is the internal target, and an **SLI** is the measured value, such as the percentage of successful requests.",
    "The core principle is **no single point of failure**:",
    L("**Redundancy**: run at least two instances of every component (web servers, databases, load balancers), ideally in different **availability zones**, and for critical systems, different regions.",
      "**Load balancing with health checks**, so traffic is automatically routed away from a failed instance.",
      "**Database replication with automatic failover**: a standby replica is promoted when the primary dies.",
      "**Stateless services**: session data lives in Redis or the database, so any instance can serve any user.",
      "**Graceful degradation**: if the recommendation service is down, show the page without recommendations instead of an error.",
      "**Resilience patterns**: timeouts on every call, retries with exponential backoff and jitter, **circuit breakers** that stop calling a failing dependency, and bulkheads that isolate resources.",
      "**Safe deployments**: canary releases and quick rollback, because bad deployments cause much of all downtime.",
      "**Monitoring and alerting**, plus backups that are actually tested by restoring them."),
    "Each extra nine costs a lot more, so match the target to the business need: a payments system needs more nines than an internal report.",
    "Interview tip: quote one number, such as \"three nines is about 8.8 hours a year\". It shows you think about availability quantitatively."
  ]),

  Q(193, 'System Design & DevOps', 'Medium', 'What is idempotency, and why does it matter for APIs and payments?', [
    "An operation is **idempotent** if doing it **many times has the same effect as doing it once**. Setting a value is idempotent; adding to a balance is not.",
    "Why it matters: networks fail in an ambiguous way. If a client sends \"charge Rs 500\" and the connection times out, it cannot tell whether the server never got the request or processed it and lost the reply. The safe reaction is to **retry**, but retrying a non-idempotent payment might charge the customer twice.",
    "HTTP methods: `GET`, `PUT` and `DELETE` are defined as idempotent; `POST` is not. So `PUT /users/7 {name: \"Asha\"}` can be retried freely, while `POST /payments` needs extra protection.",
    "The standard solution is an **idempotency key**:",
    N("The client generates a unique key (a UUID) for each logical operation and sends it in a header, such as `Idempotency-Key: 6f1c...`.",
      "The server checks whether it has already processed that key. If yes, it returns the **stored response** without doing the work again.",
      "If not, it processes the request and stores the key with the result, ideally in the same database transaction, so a crash cannot leave the work done but the key unsaved.",
      "Keys expire after a while (for example 24 hours)."),
    "Stripe, Razorpay and most payment APIs work exactly this way. The same idea appears in message processing: queues usually deliver **at least once**, so consumers must be idempotent (for example by recording processed message ids, or with a database unique constraint).",
    "Interview tip: tell the timeout story first. It explains why idempotency is needed better than the definition does."
  ], C`
import uuid

processed = {}        # idempotency key -> stored response (a DB table in real life)
balances = {"asha": 2000}

def charge(user, amount, idempotency_key):
    if idempotency_key in processed:
        return processed[idempotency_key]            # replay: no second charge
    if balances[user] < amount:
        response = {"status": "declined"}
    else:
        balances[user] -= amount
        response = {"status": "charged", "amount": amount, "balance": balances[user]}
    processed[idempotency_key] = response
    return response

key = str(uuid.uuid4())                              # one key per logical payment
print(charge("asha", 500, key))
print(charge("asha", 500, key))                      # client retried after a timeout
print("final balance:", balances["asha"])            # 1500, charged once`),

  Q(194, 'System Design & DevOps', 'Medium', 'What are an API gateway and service discovery?', [
    "Both appear as soon as a system is split into many microservices.",
    "An **API gateway** is the **single entry point** for all clients. Instead of the mobile app calling twenty services directly, it calls the gateway, which routes each request to the right service. Because every request passes through it, the gateway is where **cross-cutting concerns** live:",
    L("authentication and authorisation (validate the JWT once at the edge);",
      "rate limiting and quotas;",
      "TLS termination, request logging and metrics;",
      "request and response transformation, API versioning;",
      "aggregation: one client call fans out to several services and the results are combined (the **backend-for-frontend** pattern goes one step further, with a separate gateway per client type)."),
    "Examples: Kong, AWS API Gateway, Apigee, Nginx, Envoy-based gateways. The risk: it is a potential bottleneck and single point of failure, so it must be scaled and made redundant, and kept free of business logic.",
    "**Service discovery** answers \"where is the orders service right now?\". In the cloud, instances start, stop and move constantly, so hard-coded IP addresses do not work.",
    L("Each instance **registers** itself in a **service registry** (Consul, etcd, Eureka) on start-up, and health checks remove dead ones.",
      "**Client-side discovery**: the caller asks the registry and picks an instance itself.",
      "**Server-side discovery**: the caller hits a load balancer, which consults the registry.",
      "In **Kubernetes**, discovery is built in: a Service gets a stable DNS name (such as `orders.default.svc.cluster.local`) that always points to healthy pods."),
    "Interview tip: draw the gateway in front of the services and the registry beside them. A simple diagram earns more credit than a list of products."
  ]),

  Q(195, 'System Design & DevOps', 'Hard', 'How would you design a notification system?', [
    "A good system design answer has a structure: requirements, estimates, high-level design, deep dives, trade-offs. For notifications:",
    "**Requirements**: send push, SMS, email and in-app notifications; triggered by other services (order shipped) or scheduled campaigns; respect user preferences and quiet hours; at least about 10 million notifications per day; soft real-time (seconds, not milliseconds); no duplicates for important messages.",
    "**High-level design**:",
    N("Producer services call a **Notification API** with an event, such as `{user_id, type: \"order_shipped\", data}`.",
      "The **notification service** validates the event, loads the user's **preferences** and contact details (cached), renders the **template** in the user's language, and drops disallowed channels.",
      "It publishes one message per channel to a **message queue** (Kafka or RabbitMQ), with separate queues for push, SMS and email, so a slow SMS provider cannot delay push messages.",
      "Channel **workers** consume their queue and call the third-party providers: APNs and FCM for push, an SMS gateway, an email service such as SES.",
      "Every attempt is written to a **notification log** (status: sent, delivered, failed, opened) for retries, debugging and analytics."),
    "**Deep-dive points**:",
    L("**Reliability**: retries with exponential backoff, a **dead-letter queue** for messages that keep failing, and a fallback provider.",
      "**No duplicates**: an idempotency key per event and channel, checked before sending.",
      "**Rate limiting**: per user (no spamming) and per provider (respect their limits).",
      "**Priority**: one-time passwords and payment alerts go in a high-priority queue ahead of marketing.",
      "**Scale**: workers are stateless, so add more as queue depth grows."),
    "Interview tip: say the trade-off you chose, such as \"at-least-once delivery from the queue, made safe by idempotency keys\". Trade-offs are what interviewers grade."
  ]),

  Q(196, 'System Design & DevOps', 'Medium', 'Offset vs cursor (keyset) pagination: which scales better?', [
    "APIs return large lists one page at a time. There are two main ways to ask for the next page.",
    L("**Offset pagination**: `?page=50&size=20`, run as `LIMIT 20 OFFSET 980`. Easy to build and allows jumping to any page number. But the database must **read and throw away** all the skipped rows, so deep pages get slower and slower (OFFSET 1,000,000 reads a million rows). Results also **shift** when rows are inserted or deleted between requests, so users can see duplicates or miss items.",
      "**Cursor (keyset) pagination**: the response includes a cursor, the sort key of the last item, such as `next_cursor=2024-03-15|7`. The next query asks for rows **after** that key: `WHERE (order_date, order_id) > (?, ?) ORDER BY order_date, order_id LIMIT 20`. With an index on those columns, every page costs the same no matter how deep, and inserts do not shift pages."),
    "Rules for keyset pagination: the sort key must be **unique**, so add the id as a tie-breaker; the index must match the sort order; and cursors are usually encoded (for example Base64) so clients treat them as opaque.",
    "Trade-off: cursors cannot jump to \"page 50\" directly. That is fine for infinite scroll and feeds, which is why Twitter, Facebook, Slack and Stripe APIs all use cursors, while admin tables with page numbers often keep offset pagination.",
    "Interview tip: write both queries side by side. The WHERE clause on the last seen key is the whole idea."
  ], C`
-- Offset pagination: page 2 of orders, 4 per page (skips 4 rows every time)
SELECT order_id, order_date, amount
FROM orders
ORDER BY order_date, order_id
LIMIT 4 OFFSET 4;

-- Keyset pagination: the client sends the last row it saw ('2024-02-20', 5)
CREATE INDEX idx_orders_date_id ON orders(order_date, order_id);
SELECT order_id, order_date, amount
FROM orders
WHERE (order_date, order_id) > ('2024-02-20', 5)    -- seek, do not skip
ORDER BY order_date, order_id
LIMIT 4;`),

  Q(197, 'System Design & DevOps', 'Medium', 'What is observability? Logs vs metrics vs traces?', [
    "**Observability** is how well you can understand what a running system is doing, and why, from the data it emits, without shipping new code. **Monitoring** watches for known problems; observability lets you investigate **unknown** ones. It rests on three pillars:",
    L("**Logs**: timestamped records of individual events, such as \"payment 812 failed: card declined\". Best for detail and debugging. Use **structured logs** (JSON with fields such as `user_id` and `request_id`) so they can be searched, and never log passwords or card numbers. Tools: the ELK stack, Loki, CloudWatch.",
      "**Metrics**: numbers aggregated over time, such as requests per second, error rate, latency percentiles, CPU and queue depth. Cheap to store and ideal for **dashboards and alerts**. Tools: Prometheus with Grafana, Datadog.",
      "**Traces**: follow **one request across many services**, showing each hop (a span) and how long it took, so you can see that a slow checkout was caused by the inventory service's database query. A trace id is passed along in headers. Tools: OpenTelemetry, Jaeger, Zipkin."),
    "Good practices:",
    L("Alert on user-facing symptoms. The **four golden signals** are latency, traffic, errors and saturation; the **RED** method covers rate, errors and duration.",
      "Use **percentiles** (p95, p99), not averages: an average hides the 1% of users waiting 10 seconds.",
      "Put a **correlation id** on every log line so logs, metrics and traces for one request can be joined.",
      "**OpenTelemetry** is the vendor-neutral standard for producing all three."),
    "Interview tip: give the one-line role of each: metrics tell you **that** something is wrong, traces tell you **where**, logs tell you **why**."
  ], C`
import json
import logging
import time
import uuid

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger("checkout")
latencies_ms = []                                   # a metric, normally sent to Prometheus

def handle_checkout(user_id, amount):
    request_id = str(uuid.uuid4())[:8]              # correlation id for this request
    start = time.perf_counter()
    status = "ok" if amount < 50000 else "declined"
    elapsed = (time.perf_counter() - start) * 1000
    latencies_ms.append(elapsed)
    log.info(json.dumps({                           # structured log line
        "event": "checkout", "request_id": request_id, "user_id": user_id,
        "amount": amount, "status": status, "ms": round(elapsed, 3),
    }))

for uid, amt in [(7, 1200), (9, 64000), (7, 300)]:
    handle_checkout(uid, amt)
print("requests:", len(latencies_ms), "| max latency ms:", round(max(latencies_ms), 3))`),

  Q(198, 'System Design & DevOps', 'Medium', 'What is Kubernetes, and why do teams use it?', [
    "**Kubernetes (K8s)** is an open-source **container orchestration** platform. Docker packages an application into a container; Kubernetes runs **many containers across many machines** and keeps them in the state you asked for.",
    "You describe the **desired state** in YAML (\"run 3 copies of the orders API, version 2.4, with 512 MB of memory each\") and Kubernetes continuously works to make reality match:",
    L("**Self-healing**: a crashed container is restarted; if a whole machine dies, its pods are rescheduled elsewhere.",
      "**Scaling**: change the replica count, or let the **Horizontal Pod Autoscaler** scale on CPU or custom metrics.",
      "**Rolling updates and rollbacks** with no downtime.",
      "**Service discovery and load balancing** through Services with stable DNS names.",
      "**Configuration and secrets** injected at run time (ConfigMaps, Secrets).",
      "**Bin packing**: containers are placed efficiently across nodes based on their resource requests."),
    "Core objects: a **Pod** (one or more containers that share a network and storage, the smallest deployable unit), a **Deployment** (manages identical pods and their updates), a **Service** (a stable address for a set of pods), an **Ingress** (HTTP routing from outside), and a **Namespace** (isolation). The **control plane** (API server, scheduler, controllers, etcd) manages **worker nodes**, each running a kubelet.",
    "Trade-off: Kubernetes is powerful but complex. A small app is often better served by a simpler platform, while managed services (EKS, GKE, AKS) remove much of the operating burden.",
    "Interview tip: say \"declarative desired state plus control loops that reconcile it\". That is the idea behind every Kubernetes feature."
  ], C`
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders-api
spec:
  replicas: 3                       # desired state: always three pods
  selector:
    matchLabels: { app: orders-api }
  template:
    metadata:
      labels: { app: orders-api }
    spec:
      containers:
        - name: api
          image: registry.example.com/orders-api:2.4.0
          ports: [{ containerPort: 5000 }]
          resources:
            requests: { cpu: "250m", memory: "256Mi" }
            limits:   { cpu: "500m", memory: "512Mi" }
          readinessProbe:           # only send traffic once healthy
            httpGet: { path: /health, port: 5000 }
---
apiVersion: v1
kind: Service
metadata:
  name: orders-api                  # stable DNS name inside the cluster
spec:
  selector: { app: orders-api }
  ports: [{ port: 80, targetPort: 5000 }]`, 'yaml'),

  Q(199, 'System Design & DevOps', 'Medium', 'Blue-green vs canary vs rolling deployments?', [
    "These are strategies for releasing a new version with **little or no downtime** and a **safe way back** if something goes wrong.",
    L("**Rolling deployment**: replace instances a few at a time (for example 2 of 10), waiting for each batch to pass health checks before continuing. No extra infrastructure is needed and it is the Kubernetes default. During the rollout, old and new versions run **side by side**, so they must be compatible, and rolling back means rolling forward again.",
      "**Blue-green deployment**: keep two identical environments. **Blue** serves all live traffic; deploy the new version to **green**, test it there, then **switch the load balancer** to send everything to green. Rollback is instant: switch back to blue. It costs double the infrastructure during the release, and database schema changes need care, because both versions use the same data.",
      "**Canary release**: send a **small percentage** of real traffic (1%, then 5%, 25%, 100%) to the new version while watching error rates and latency. If the metrics get worse, route everything back. It limits the **blast radius**: a bug hits a few users, not all. It needs good monitoring and traffic-splitting tools (a service mesh, or a load balancer with weights)."),
    "Related techniques: **feature flags** separate deploying code from releasing a feature, so a feature can be turned on for 5% of users or switched off instantly without a redeploy; **A/B testing** splits traffic to compare business metrics rather than to check stability; and **shadow traffic** copies real requests to the new version without returning its answers.",
    "Database changes follow the **expand and contract** pattern: add new columns first (compatible with both versions), deploy, migrate, and only then remove the old columns.",
    "Interview tip: compare them on rollback speed and cost: blue-green has the fastest rollback, canary the smallest blast radius, rolling the lowest cost."
  ]),

  // ---------------- HR & Behavioural ----------------
  Q(200, 'HR & Behavioural', 'Easy', 'Why do you want to join our company?', [
    "The interviewer wants to know whether you have **researched the company** and whether your reasons will keep you there. A generic answer (\"it is a good company with a good salary\") signals neither.",
    "Prepare by spending 20 minutes on the company's website, recent news, products, engineering blog or LinkedIn posts, and the job description. Then build the answer from three parts:",
    N("**Something specific about the company**: its product, its customers, its technology, its growth or its values. Name it.",
      "**The fit with you**: connect that to your skills, projects or interests.",
      "**What you will contribute and learn**: show you are thinking about adding value, not only receiving it."),
    "Sample answer for a fresher at a fintech company: \"I have used your UPI app for two years, and I read your engineering blog post on how you handle peak traffic during festival sales. My final-year project was a payment reconciliation tool in Python and SQL, so building reliable financial systems at that scale is exactly the work I want to learn. I also noticed the role uses PostgreSQL and React, which I have practised, so I can contribute from the start while learning from an experienced team.\"",
    "Avoid: talking only about salary, location or benefits; reading the \"About us\" page back to them; saying anything you could say about every company.",
    "Interview tip: mention one concrete fact only an informed candidate would know. It instantly separates you from other applicants."
  ]),

  Q(201, 'HR & Behavioural', 'Medium', 'Tell me about a challenging project or problem you solved.', [
    "This is a behavioural question: the interviewer wants evidence of how you think, act under difficulty and learn. Use the **STAR** structure and keep it to about two minutes:",
    L("**Situation**: the context, in two sentences.",
      "**Task**: what you were responsible for and why it was hard.",
      "**Action**: the specific steps **you** took. This should be the longest part. Say \"I\", not only \"we\".",
      "**Result**: the outcome, measured if possible, and what you learned."),
    "Choose a story with a real technical or teamwork challenge, an action you personally drove, and a clear result. Projects, internships, hackathons and college events all count.",
    "Sample answer: \"In my internship (S), our report page took 40 seconds to load and users were complaining (T). I was asked to find out why. I profiled the API and found it ran one query per row, more than 2,000 queries per page load. I rewrote it as a single query with a join and added an index on the filter column, then wrote a test comparing the old and new results (A). Load time dropped to under two seconds, and my lead asked me to document the approach for the team. I learned to measure before optimising (R).\"",
    "Prepare two or three such stories in advance; one story can answer many questions (challenge, teamwork, learning something fast).",
    "Interview tip: include numbers in the result, such as \"40 seconds to 2 seconds\". Numbers make a story credible."
  ]),

  Q(202, 'HR & Behavioural', 'Medium', 'Tell me about a time you failed or made a mistake.', [
    "Everyone makes mistakes, so \"I can't think of one\" sounds either dishonest or lacking in self-awareness. The interviewer is checking **ownership**, **honesty** and **learning**.",
    "A strong structure:",
    N("**The mistake**, stated plainly, with no excuses or blaming others.",
      "**The impact**: what it affected.",
      "**What you did to fix it**, quickly and openly.",
      "**What you changed afterwards** so it would not happen again. This is the most important part."),
    "Pick a **real but recoverable** mistake: not something trivial (\"I work too hard\") and not something alarming (an ethical lapse).",
    "Sample answer: \"In a group project I said I'd finish the login module in two days without checking how the college server handled sessions. It took five days and delayed our demo rehearsal. I told the team as soon as I realised, asked a classmate who had done it before for help, and we still finished before the deadline. Since then I break tasks into smaller pieces and give estimates only after a quick investigation, and I raise risks early. In my next project my estimates were much more accurate.\"",
    "Interview tip: spend about 30% of the answer on the mistake and 70% on the fix and the lesson. That balance shows maturity."
  ]),

  Q(203, 'HR & Behavioural', 'Medium', 'How do you handle conflict or disagreement in a team?', [
    "Interviewers want to see that you can disagree **respectfully**, focus on the **problem rather than the person**, and still deliver. Answer with your approach plus one real example.",
    "A sound approach:",
    L("**Listen first** and make sure you understand the other person's view; ask why they prefer it.",
      "**Talk privately and calmly**, not in front of the group or over angry messages.",
      "**Use facts and shared goals**: data, requirements, a quick prototype or test, and \"what is best for the project?\".",
      "**Look for a middle path**, or agree on criteria for deciding.",
      "**Escalate** to a lead or mentor only if you truly cannot agree, and present both sides fairly.",
      "**Commit** to the final decision, even if it was not yours."),
    "Sample answer: \"In our final-year project, a teammate wanted to use MongoDB and I preferred PostgreSQL. Instead of arguing in the group chat, I suggested we each list what the project needed. Our data had orders, payments and refunds with strong relationships and we needed reports, so we agreed PostgreSQL fitted better, while his idea of storing flexible product attributes went into a JSON column. The discussion took 30 minutes, we stayed on good terms, and he later led the reporting module.\"",
    "Avoid stories where you were simply right and the other person was foolish, or where the conflict was never resolved.",
    "Interview tip: end with the relationship staying positive. The outcome for the team matters as much as the technical decision."
  ]),

  Q(204, 'HR & Behavioural', 'Easy', 'How do you handle pressure and tight deadlines?', [
    "Every job has busy periods, so the interviewer wants a **method**, not just \"I work well under pressure\". Describe what you actually do, then prove it with an example.",
    "A practical method:",
    L("**Clarify** what exactly is needed and by when; ask what \"done\" means.",
      "**Break the work down** into small tasks and estimate each.",
      "**Prioritise**: do the must-haves first, and agree on what can be dropped or delayed if time runs out.",
      "**Communicate early**: if the deadline is at risk, tell your lead while there is still time to adjust, rather than at the last minute.",
      "**Protect focus**: block distractions and work in focused sessions.",
      "**Stay calm and look after basics** such as sleep. Tired people make expensive mistakes."),
    "Sample answer: \"During our college tech fest, the registration site I built had to support online payments, and the requirement came only four days before launch. I listed the tasks, did the payment flow and confirmation email first, and told the organisers that the admin dashboard would come a day after launch, with exports by hand until then. I tested the payment flow with test cards every evening. We launched on time, handled about 1,200 registrations, and the dashboard followed the next day.\"",
    "Interview tip: show that you **negotiate scope and communicate**, not that you simply work all night. Companies value the first far more."
  ]),

  Q(205, 'HR & Behavioural', 'Easy', 'Are you willing to relocate or work in shifts?', [
    "Companies ask this because some roles involve client locations, multiple offices, or teams serving customers in other time zones. Your answer must be **honest**, because saying yes and refusing later damages trust and can cost you the offer.",
    "If you are fully flexible, say so with enthusiasm and a reason: \"Yes. I'm early in my career and moving to a new city is an opportunity to learn and grow. I'm comfortable with shifts as well if the project needs it.\"",
    "If you have preferences, express them positively and leave room for discussion:",
    L("\"My preference is Hyderabad because my family is there, but I'm open to relocating for the right role. Could you tell me which locations this team works from?\"",
      "\"I can work rotational shifts. I'd only like to understand the schedule in advance so I can plan.\""),
    "If you have a real constraint (health, family responsibility), state it briefly and professionally, without long explanations: \"I can't do permanent night shifts for family reasons, but occasional late calls or a rotation are fine.\"",
    "Also ask a clarifying question, such as how often relocation happens or whether the shift comes with allowances. It shows you are taking the question seriously.",
    "Interview tip: never give a vague \"maybe\". A clear answer, with any condition stated politely, is always better."
  ]),

  Q(206, 'HR & Behavioural', 'Medium', 'What are your salary expectations?', [
    "The goal is to give a figure that is **realistic for the market** without underselling yourself, and to show that the **role** matters to you too.",
    "Prepare first: check the typical range for this role, company type and city on sites such as Glassdoor, AmbitionBox and Levels.fyi, in campus placement data, and by talking to seniors. For freshers, many companies have a **fixed** package; it is perfectly fine to ask \"what is the range for this role?\"",
    "How to answer:",
    L("**Fresher with a fixed package**: \"I understand the package for this role is fixed, and I'm comfortable with it. My priority is learning and doing good work in my first job.\"",
      "**Asked for a number**: give a **range** based on research, with the bottom of the range being an amount you would genuinely accept: \"Based on my research for this role in Bengaluru, I'm looking at 6 to 7.5 lakh per annum, but I'm open to discussing the overall offer.\"",
      "**Experienced candidate**: anchor on the market and your current pay: \"I'm currently at 8 lakh. Considering the scope of this role and market rates, I'm expecting around 11 to 12 lakh, depending on the full package.\""),
    "Remember the **total compensation**: base pay, bonus, stock, joining bonus, insurance, learning budget and work-from-home policy all count.",
    "Avoid: naming a number with no basis, refusing to answer at all, or lying about your current salary (it is often verified).",
    "Interview tip: speak calmly and stop after giving your range. Over-justifying a number makes it sound uncertain."
  ]),

  Q(207, 'HR & Behavioural', 'Medium', 'Why are you leaving your current job?', [
    "The interviewer is checking two things: that you are not running away from a problem you would bring with you, and that you will speak professionally about past employers, because one day you will be talking about them.",
    "Focus on what you are moving **towards**, not what you are escaping:",
    L("growth: \"I've learned a lot in support engineering and now want to move into development full time\";",
      "scope: \"I want to work on products at a larger scale\";",
      "learning: \"I want to work with a modern cloud stack, which this role offers\";",
      "practical reasons, briefly: relocation, the end of a contract, or the company restructuring."),
    "Sample answer: \"I'm grateful for my two years at my current company; I learned how production systems are supported and I automated several reports with Python. But the role is mostly maintenance now, and I want to build new features and grow as a backend developer. This position works on new services with Python and PostgreSQL, which is exactly the direction I want.\"",
    "Avoid: criticising your manager, colleagues or company, even when it is deserved; complaining about workload; making salary the only reason (it can be one reason, stated briefly).",
    "If you were laid off, say so plainly; it is common and not a judgement of you: \"My team was part of a company-wide restructuring.\" Then move on to what you did next.",
    "Interview tip: keep it to three or four sentences and turn quickly to why this role fits. Long explanations sound defensive."
  ]),

  Q(208, 'HR & Behavioural', 'Medium', 'How do you explain a gap in your education or career?', [
    "Gaps are common: preparing for competitive exams, health, family responsibilities, a failed start-up, upskilling or simply searching for the right job. The interviewer mainly wants to know that you are **ready now** and that you used the time sensibly. Honesty works far better than a vague or invented story.",
    "Structure the answer in three short parts:",
    N("**The reason**, stated briefly and without apologising: \"I spent a year preparing for the GATE exam\" or \"I took eight months off to care for a family member.\"",
      "**What you did or learned during that time**: courses, certifications, projects, freelancing, open-source contributions, or skills such as responsibility and time management.",
      "**Why you are ready now**: the situation is resolved and you are focused on this career."),
    "Sample answer: \"After graduating, I prepared for government exams for about a year. It did not work out, but it improved my discipline and aptitude skills. In the last six months I completed a full-stack course, built two projects (a library management system with React and Node, and a SQL analytics dashboard), and practised data structures daily. I'm now fully committed to a software career, and this role matches the skills I've built.\"",
    "Support your story with evidence: a GitHub profile, certificates, or a project you can demo.",
    "Interview tip: spend one sentence on the gap and the rest on what you did and why you are ready. The focus should be on the future."
  ]),

  Q(209, 'HR & Behavioural', 'Medium', 'Tell me about a time you showed leadership.', [
    "Leadership does not require a job title. Interviewers look for **initiative**, **taking responsibility**, **helping others succeed** and **driving a result**. For freshers, college projects, clubs, events, sports teams and internships are all valid sources.",
    "Use STAR, and make your **own actions** clear:",
    L("**Situation and task**: what needed leading, and why it was difficult (no clear owner, a deadline, a demotivated team).",
      "**Action**: how you organised the work, divided tasks by people's strengths, kept everyone informed, removed blockers, handled disagreement, and supported a struggling teammate.",
      "**Result**: what the team achieved, with a number if possible, and what you learned about leading."),
    "Sample answer: \"In my third year, our five-person team for a hackathon had no plan two days before the event. I suggested we meet for an hour, listed the features, and split them by strength: two on the React front end, two on the Flask API, and I took the database and integration. I set up a shared board and short check-ins every few hours. When one teammate got stuck on authentication, I paired with him for an hour instead of taking it over. We submitted on time and came second out of 40 teams. I learned that leading is mostly about clarity and unblocking people.\"",
    "Interview tip: show that you **enabled others**, not that you did everyone's work yourself. That is the difference between a leader and a hero."
  ]),

  Q(210, 'HR & Behavioural', 'Easy', 'How do you keep your skills up to date?', [
    "Technology changes constantly, so companies want people who **learn on their own**. Show a real, specific habit, not just \"I read a lot\".",
    "Good things to mention, with concrete examples:",
    L("**Structured learning**: a course or certification you completed recently, and what you built with it.",
      "**Building projects**: the best way to learn; mention one recent project and the new skill it taught you.",
      "**Practice**: solving DSA problems or SQL exercises regularly.",
      "**Reading**: official documentation, engineering blogs of companies you admire, newsletters, or a book.",
      "**Community**: tech meetups, college clubs, hackathons, open-source contributions, or answering questions online.",
      "**Learning from work**: code reviews, asking seniors questions, and studying how production problems were solved."),
    "Sample answer: \"I set aside about an hour every day. Recently I learned React hooks from the official documentation, then rebuilt my portfolio site with them. I solve two or three DSA problems a week, and I read the engineering blogs of companies like Swiggy and Razorpay to see how real systems are built. Last month I learned Docker so that I could deploy my project, which also taught me the basics of environment variables and ports.\"",
    "Interview tip: connect what you are learning to the job you are applying for. It shows the learning is purposeful."
  ]),

  Q(211, 'HR & Behavioural', 'Easy', 'What is your greatest achievement?', [
    "The interviewer wants to see what **you** value, how you measure success, and whether you can describe your work with confidence but without arrogance.",
    "Pick an achievement that is:",
    L("**Recent and relevant**: ideally linked to the skills this job needs (a project, an internship result, a competition).",
      "**Your own**: you played a clear role, not just your team.",
      "**Measurable**: a rank, a number of users, a time saved, a score improved.",
      "**Earned through effort**: overcoming difficulty makes the story meaningful."),
    "Use a short STAR story and finish with why it matters to you.",
    "Sample answer: \"My greatest achievement so far is the attendance app I built for my college department. Faculty were spending about 10 minutes per class on paper registers. I built a web app with React and Node where they mark attendance in under a minute, with automatic monthly reports. I taught myself authentication and deployment to finish it, and after a two-week pilot the whole department adopted it, about 30 faculty and 900 students. It matters to me because it was the first time something I built was used every day by real people.\"",
    "Interview tip: an achievement that **helped others** usually lands better than a purely personal one, such as a high exam rank, because it shows impact."
  ]),

  Q(212, 'HR & Behavioural', 'Easy', 'Do you prefer working alone or in a team?', [
    "This is a fit question, and the best answer for almost every role is **both**, explained honestly: software development needs focused individual work and close collaboration.",
    "A balanced answer covers:",
    L("**Independent work**: you can take a task, research it, and finish it without needing constant guidance. Give an example.",
      "**Teamwork**: you value code reviews, discussing designs, helping teammates and learning from others. Give an example.",
      "**Knowing when to switch**: you work alone on clearly defined tasks, but you ask for help or discuss early when a decision affects others or you are stuck for too long."),
    "Sample answer: \"I'm comfortable with both, and good software needs both. When I have a clear task, like building an API endpoint, I like to work through it on my own, which is how I learned most of my Django skills. But I enjoy team work too. In my final-year project, our code reviews caught bugs I would have missed, and discussing the database design together gave us a much better schema. If I'm stuck for more than an hour or so, I ask instead of struggling silently.\"",
    "Avoid extremes: \"I only like working alone\" suggests poor collaboration, and \"I always need a team\" suggests you cannot work independently.",
    "Interview tip: research the role. If it is highly collaborative (agile teams, pair programming), lean towards teamwork examples, but keep the answer truthful."
  ]),

  Q(213, 'HR & Behavioural', 'Easy', 'How do you handle criticism and feedback?', [
    "Feedback is constant in software work: code reviews, design discussions and performance reviews. Interviewers want someone who **listens without becoming defensive**, **acts on** feedback and **asks for more**.",
    "Describe your approach:",
    L("**Listen fully** before responding, and thank the person.",
      "**Ask questions** to understand the point: \"Could you show me an example?\"",
      "**Separate the work from yourself**: a comment on your code is not a comment on your worth.",
      "**Act on it**, and follow up so the person sees the change.",
      "**Disagree respectfully** when you have good reasons, with facts, and accept the decision afterwards.",
      "**Seek feedback actively**, not only when it is given."),
    "Sample answer: \"During my internship, my mentor's code review said my functions were too long and hard to test. My first instinct was that the code worked, but I asked him to show me how he would split one function. I refactored it into smaller functions with unit tests, and it made fixing a bug the following week much easier. Since then I keep functions small, and I ask reviewers specifically what I could do better, not only whether the code is correct.\"",
    "Interview tip: choose an example where feedback produced a lasting change in how you work. The lasting change is the proof."
  ]),

  Q(214, 'HR & Behavioural', 'Medium', 'How should I explain my final-year or personal project?', [
    "For freshers, the project discussion is often the **most important part** of the interview, because it is the best evidence of what you can actually do. Interviewers dig deep, so prepare it like an exam.",
    "A clear structure that takes about two to three minutes:",
    N("**Problem**: what problem it solves and for whom, in one or two sentences.",
      "**Solution and features**: what the system does, focusing on the three most important features.",
      "**Architecture and tech stack**: front end, back end, database, hosting, and **why** you chose each.",
      "**Your role**: exactly which parts you built, especially in a team project.",
      "**A challenge**: one real technical problem and how you solved it.",
      "**Result and learning**: users, performance, marks or awards, and what you would improve next."),
    "Be ready for the follow-ups:",
    L("\"Draw the database schema\" or \"explain this table\": know your tables, keys and relationships.",
      "\"How does login work?\": sessions or JWT, password hashing.",
      "\"What happens if 10,000 users come at once?\": indexes, caching, scaling.",
      "\"Why this technology instead of X?\"",
      "\"Show me the code\": have the GitHub link and a live demo or screenshots ready."),
    "Never claim work you did not do or technologies you cannot explain; interviewers find out within two questions.",
    "Interview tip: practise saying the two-minute version aloud until it is smooth. Then keep a list of three improvements you would make, because \"what would you do differently?\" is almost always asked."
  ]),
];
