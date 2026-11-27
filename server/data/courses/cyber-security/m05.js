export default {
  n: 5,
  title: 'Cryptography & Data Security',
  description: 'Encoding vs hashing vs encryption, hash functions, symmetric encryption with AES and safe modes, asymmetric RSA/ECC and key exchange, digital signatures, certificates, PKI and TLS, password hashing with salts, key management, and protecting data at rest, in transit and in use.',
  intro: 'Cryptography turns security goals into mathematics: encryption gives confidentiality, hashes give integrity, and digital signatures give authenticity. It is what protects your UPI payment, your WhatsApp chats, the padlock in your browser and the password database of every website you use.\n\nYou do not need to invent algorithms; nobody should. You need to choose proven ones, use them correctly and manage keys well. Think of a bank locker: the steel door is strong, but the locker is only as safe as its key and the person holding it. Real systems almost never fail because AES was broken; they fail because of a reused nonce, a fast hash for passwords, an expired certificate or a key left in source code.\n\nThis module explains each idea in plain words first, then in technical detail. Then it lets you run hashes, encryption and signatures yourself with OpenSSL and Python using throwaway lab keys.',
  objectives: [
    'Distinguish encoding, hashing and encryption.',
    'Explain symmetric (AES) and asymmetric (RSA, ECC) cryptography and when each is used.',
    'Describe digital signatures, certificates, PKI and the TLS handshake.',
    'Store passwords safely with salts and slow hashes.',
    'Describe key management and protect data at rest and in transit.',
    'Avoid common cryptographic mistakes.'
  ],
  terms: [
    ['Plaintext / ciphertext', 'Readable data / the scrambled result of encryption.'],
    ['Cipher', 'The algorithm that encrypts and decrypts, such as AES or RSA.'],
    ['Key', 'The secret (or public) value that controls a cipher. Security depends on keeping private keys secret.'],
    ['Hash', 'A fixed-size, one-way fingerprint of data, such as SHA-256.'],
    ['Salt', 'A unique random value added to each password before hashing, so identical passwords hash differently.'],
    ['Nonce / IV', 'A value used once so identical messages encrypt differently. Never reuse one with the same key.'],
    ['Symmetric encryption', 'One shared key encrypts and decrypts (AES). Fast, but the key must be shared safely.'],
    ['Asymmetric encryption', 'A public key encrypts or verifies; the matching private key decrypts or signs (RSA, ECC).'],
    ['Digital signature', 'A hash signed with a private key; anyone with the public key can verify who signed and that nothing changed.'],
    ['Certificate', 'A document that binds a public key to an identity (such as a domain), signed by a Certificate Authority.'],
    ['PKI', 'Public Key Infrastructure: CAs, certificates, revocation and policies that make public keys trustworthy.'],
    ['Forward secrecy', 'Fresh session keys (ECDHE) so a stolen long-term key cannot decrypt past sessions.'],
    ['KMS / HSM', 'Key Management Service / Hardware Security Module: protected places to create, store and use keys.']
  ],
  diagramTitle: 'Hashing, encryption and signatures in one picture',
  ascii: ' ENCODING   "hi" --Base64--> "aGk="      reversible by anyone   (NOT security)\n HASHING    file --SHA-256--> 3a7bd3...  one-way fingerprint    (INTEGRITY)\n SYMMETRIC  data --AES-GCM + key K--> ciphertext --same K--> data  (CONFIDENTIALITY)\n ASYMMETRIC data --Bob PUBLIC key--> ciphertext --Bob PRIVATE key--> data\n SIGNATURE  hash(doc) --Alice PRIVATE key--> signature\n            verify with Alice PUBLIC key --> authentic + unchanged  (AUTHENTICITY)\n\n TLS 1.3 (hybrid):  ECDHE agrees a session key  +  certificate proves the server\n                    -->  AES-GCM / ChaCha20 encrypts the data',
  diagramExplain: 'Encoding only changes format. Hashing gives a fingerprint for integrity. Symmetric encryption is fast for bulk data but needs a shared key; asymmetric keys solve key sharing and enable signatures. Real protocols such as TLS combine them: asymmetric to authenticate and agree a key, symmetric to encrypt the data.',
  sections: [
    {
      h: '1. Fundamentals: encoding, hashing, encryption',
      t: 'Encoding, hashing and encryption are three different tools, and beginners often mix them up. Encoding changes the format of data so it can travel safely, like writing a message in Morse code: anyone who knows Morse can read it. Hashing makes a fixed-size fingerprint of data. Encryption locks data so that only someone with the right key can read it.\n\nBase64 and URL encoding are not security: anyone can reverse them. Base64 turns "hi" into "aGk=", and any decoder turns it straight back. URL encoding turns a space into %20. These formats exist so data survives email, web addresses and JSON, not to hide it. Hashing is one-way: you cannot get the input back from a SHA-256 hash. Encryption is two-way, but only with the key.\n\nA common mistake in real projects: a developer stores a database password “encrypted” in a config file, but it is only Base64-encoded. Anyone who reads the file decodes it in a second. If you see a value ending in = or == in a config file, check whether someone has confused encoding with encryption.\n\nKerckhoffs’s principle says a system should stay secure even if everything except the key is public. AES is published for the whole world to study, and it stays safe as long as the key stays secret. That is why secret, home-made algorithms are a red flag: their safety depends on nobody ever finding out how they work.',
      table: [
        ['', 'Encoding', 'Hashing', 'Encryption'],
        ['Purpose', 'Change format for transport', 'Fingerprint for integrity', 'Hide content (confidentiality)'],
        ['Reversible?', 'Yes, by anyone', 'No (one-way)', 'Yes, with the key'],
        ['Uses a key?', 'No', 'No (HMAC adds one)', 'Yes'],
        ['Example', 'Base64', 'SHA-256', 'AES-256-GCM, RSA']
      ]
    },
    {
      h: '2. Hashing',
      t: 'A hash function maps any input to a fixed-size output, called a hash or digest. Think of it as a fingerprint for data. A fingerprint identifies a person, but you cannot rebuild the person from it. SHA-256 always gives 256 bits, shown as 64 hex characters, whether the input is one word or a 4 GB movie.\n\nGood hashes are one-way, deterministic, avalanche-sensitive (one changed character gives a totally different output) and collision-resistant. One-way means you cannot work back from the hash to the input. Deterministic means the same input always gives the same hash. Collision-resistant means it is practically impossible to find two different inputs with the same hash. MD5 and SHA-1 have failed this last test, so they must not be used for security.\n\nRun the code. “Pay Ravi 500” and “Pay Ravi 900” differ by one digit, yet their SHA-256 hashes look completely unrelated. This is how download checks work. When you download an Ubuntu ISO, the site publishes its SHA-256 hash. You run sha256sum on the file (or Get-FileHash in PowerShell) and compare. If even one byte changed on the way, the hashes will not match.\n\nUses: integrity checks, digital signatures, password storage (with extra steps such as salts and slow algorithms) and deduplication, where storage systems spot identical files by comparing their hashes instead of their full contents.',
      table: [
        ['Algorithm', 'Status'],
        ['MD5, SHA-1', 'Broken for collisions; do not use for security'],
        ['SHA-256 / SHA-512 / SHA-3', 'Recommended for integrity and signatures'],
        ['bcrypt, scrypt, Argon2id, PBKDF2', 'Password hashing (slow by design)'],
        ['HMAC-SHA256', 'Message authentication with a secret key']
      ],
      code: 'import hashlib\n\nfor msg in ["Pay Ravi 500", "Pay Ravi 900"]:\n    print(f"{msg:14} {hashlib.sha256(msg.encode()).hexdigest()}")',
      lang: 'python'
    },
    {
      h: '3. Symmetric cryptography and AES',
      t: 'Symmetric cryptography uses the same key to lock and to open data. Think of an ordinary padlock with one key: the key that locks it also opens it, so anyone with a copy of that key can open the box. It is fast and simple, and the main challenge is keeping that one key secret.\n\nAES is the standard block cipher: 128-bit blocks with 128-, 192- or 256-bit keys. A block cipher also needs a mode, which says how to handle data longer than one block. Use an authenticated mode, AES-GCM (or ChaCha20-Poly1305), which gives confidentiality and integrity together: if anyone changes even one bit of the ciphertext, decryption fails instead of returning wrong data. ECB mode encrypts identical blocks into identical output, so it leaks patterns and must never be used. A nonce must never be reused with the same key; in GCM a reused nonce can reveal information about the messages and let attackers forge new ones.\n\nThe lab code encrypts a file with a passphrase using OpenSSL. -pbkdf2 turns the passphrase into a key with a slow function, and -salt makes every run different. Add -d to decrypt; a wrong passphrase fails with “bad decrypt”. The openssl enc command does not support GCM, so this quick lab uses CBC. In your own programs, use a library that offers AES-GCM.\n\nAES is fast and ideal for bulk data such as disks, files and network traffic. The challenge is getting the key to both sides safely. Emailing the key along with the encrypted file makes the encryption pointless. The next section shows how that problem is solved.',
      code: '# encrypt a file with a passphrase (lab only), then decrypt it\nopenssl enc -aes-256-cbc -pbkdf2 -salt -in notes.txt -out notes.enc\nopenssl enc -d -aes-256-cbc -pbkdf2 -in notes.enc -out notes.dec\n# a wrong passphrase fails with "bad decrypt"'
    },
    {
      h: '4. Asymmetric cryptography and key exchange',
      t: 'Asymmetric cryptography uses a pair of keys that work together. Think of a post box outside a post office. Anyone can drop a letter in through the slot, but only the postmaster with the key can open the box and read the letters. The slot is like the public key, and the postmaster’s key is the private key.\n\nEach party has a key pair. The public key can be shared; the private key never leaves its owner. Data encrypted with someone’s public key can be decrypted only with their private key. RSA (2048 bits minimum, 3072+ for long-term) relies on factoring: multiplying two huge primes is easy, but splitting the result back into those primes is extremely hard. ECC (P-256, Ed25519) gives similar strength with much smaller keys, which makes it faster on phones.\n\nAsymmetric methods are slow, so they are not used for bulk data. Their main job is solving the key-sharing problem. Diffie-Hellman / ECDHE lets two parties agree on a shared secret over an open network: each side sends a public value, both compute the same secret, and an eavesdropper who sees both values cannot. Fresh keys for every session give forward secrecy: even if the server’s long-term key is stolen next year, traffic recorded today stays safe.\n\nIn practice systems use hybrid encryption: asymmetric methods authenticate and agree a key, then AES encrypts the data. HTTPS, SSH and WhatsApp all work this way. The lab code generates a 3072-bit RSA key pair with OpenSSL, signs a file and verifies the signature.',
      code: '# generate a lab key pair, sign a file, verify it\nopenssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out lab_private.pem\nopenssl pkey -in lab_private.pem -pubout -out lab_public.pem\nopenssl dgst -sha256 -sign lab_private.pem -out report.sig report.txt\nopenssl dgst -sha256 -verify lab_public.pem -signature report.sig report.txt   # Verified OK\n# change one byte of report.txt and verify again -> Verification failure'
    },
    {
      h: '5. Digital signatures',
      t: 'A digital signature proves who sent a message and that nobody changed it. Think of a principal signing and stamping a bonafide certificate. The receiving office trusts the signature and the stamp, and if someone edits the marks on the paper, the document no longer matches what was signed. A digital signature does the same job with mathematics, and it is far harder to forge.\n\nTo sign, the sender hashes the message and encrypts that hash with their private key. (Strictly, this “encrypt with the private key” wording describes RSA; algorithms such as Ed25519 compute the signature differently, but the idea is the same.) The receiver hashes the message too and checks the signature with the sender’s public key. If it matches, the message came from the key owner (authenticity) and was not changed (integrity). Because only the owner holds the private key, it is also hard for them to deny signing later, which is called non-repudiation.\n\nTry it with the lab from the previous section. openssl dgst -sha256 -sign creates report.sig, and openssl dgst -sha256 -verify prints “Verified OK”. Change one byte in report.txt and verify again: it fails, because the new hash no longer matches the signed one.\n\nSignatures protect software updates, documents, emails (S/MIME) and code commits. Your phone checks the developer’s signature before installing an app update. The SolarWinds attack from Module 01 was so dangerous because the malicious update carried a valid signature, so signing keys and build systems need the strongest protection.'
    },
    {
      h: '6. Certificates, PKI and TLS',
      t: 'A public key alone does not say who owns it. An attacker could hand you their own public key and claim to be your bank. A certificate solves this problem. Think of an Aadhaar card: it links your photo and name to a number, and people trust it because a government authority issued it, not because you say so.\n\nA certificate binds a public key to an identity, such as the domain name www.example.com, and is signed by a Certificate Authority (CA). Browsers trust a small set of root CAs; roots sign intermediates, and intermediates sign website certificates: the chain of trust. Your browser checks each signature up the chain until it reaches a trusted root. It also checks that the name matches the site and that the certificate has not expired.\n\nYou can see this yourself. Click the padlock next to a website’s address and open the certificate details: you will see the domain, the issuer, the validity dates and the chain. On the command line, openssl s_client -connect example.com:443 shows the same details. Certificates expire, and an expired certificate causes browser warnings and even outages, so set up automatic renewal.\n\nSometimes a certificate must be cancelled early, for example when its private key leaks. Revocation uses CRLs (certificate revocation lists) and OCSP (an online status check), and Certificate Transparency logs make mis-issued certificates visible because they publicly record every certificate CAs issue. The table shows which TLS versions are safe, and the note walks through a TLS 1.3 handshake.',
      table: [
        ['Protocol', 'Year (approx.)', 'Status'],
        ['SSL 2.0 / 3.0', '1995 / 1996', 'Broken; disabled (POODLE attack on SSL 3.0)'],
        ['TLS 1.0 / 1.1', '1999 / 2006', 'Deprecated; do not use'],
        ['TLS 1.2', '2008', 'Acceptable with strong ciphers'],
        ['TLS 1.3', '2018', 'Recommended; faster and safer defaults']
      ],
      note: 'In a simplified TLS 1.3 handshake, the client sends supported ciphers and a key share; the server replies with its key share, certificate and a signature; both derive session keys with ECDHE, and the rest of the conversation is encrypted with AES-GCM or ChaCha20-Poly1305.'
    },
    {
      h: '7. Storing passwords safely',
      t: 'A website must check your password at login, but it should never be able to read it. The answer is to store a special hash of the password, not the password itself. Think of a college that keeps your fingerprint record instead of a copy of your house key: it can confirm you are you, without holding anything that opens your door.\n\nNever store passwords in plain text or with a plain fast hash such as SHA-256 alone. A fast hash lets an attacker with a stolen database try billions of guesses per second on a GPU. Use a unique random salt per user: it defeats rainbow tables (huge precomputed lists of hashes) and makes identical passwords look different. Then use a slow, memory-hard or iterated algorithm: Argon2id, bcrypt, scrypt or PBKDF2. Optionally add a pepper, a secret value kept outside the database.\n\nThe code uses PBKDF2 with SHA-256, a 16-byte random salt and 600,000 iterations. At login it recomputes the hash with the stored salt and compares the two in constant time with hmac.compare_digest, so the response time does not reveal how many bytes matched. The last line hashes “password” twice and prints two different results, because each call uses a new salt. In the same way, if Ravi and Priya both choose “cricket123”, their stored hashes still look completely different.\n\nNotice the opposite goals. A password hash must be slow so guessing is expensive, while a file checksum should be fast. Choosing the right kind of hash for each job is the real lesson here.',
      code: 'import hashlib, hmac, os\n\ndef hash_password(password, salt=None, iterations=600_000):\n    salt = salt or os.urandom(16)\n    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)\n    return salt, digest\n\nsalt, stored = hash_password("correct horse battery staple")\n\n# login: recompute with the stored salt and compare in constant time\n_, attempt = hash_password("correct horse battery staple", salt)\nprint("match:", hmac.compare_digest(stored, attempt))\n\n# same password, different salt -> different hash\nprint(hash_password("password")[1].hex()[:16], hash_password("password")[1].hex()[:16])',
      lang: 'python'
    },
    {
      h: '8. Key management',
      t: 'Encryption moves the problem from protecting data to protecting keys. A strong lock is useless if the key hangs on a nail next to the door. Key management is where real systems most often fail, far more often than the mathematics of AES or RSA.\n\nA key moves through a lifecycle: generate, store, distribute, use, rotate, revoke and destroy. Generate keys with a cryptographically secure random generator, never from a name or a date. Store them in an HSM (hardware security module) or a cloud KMS, which can use a key without ever revealing it. Give keys only to the systems that need them. Rotate them on a schedule and after any suspected exposure, revoke compromised keys, and destroy old ones when no data depends on them.\n\nA very common real incident: a developer pushes code to a public GitHub repository with a cloud access key inside a config file. Automated bots scan public repositories constantly, and within minutes the key can be used to start costly servers or copy data. Deleting the file afterwards is not enough, because it stays in the git history. The key must be revoked and replaced at once.\n\nThe bullets list the main rules. They are the same rules a bank uses for its vault keys: who may hold them, where they are kept, when they are changed, and a record of every use.',
      b: [
        'Generate keys with a cryptographically secure random generator.',
        'Store keys in an HSM or a cloud KMS; never in source code, chat messages or tickets.',
        'Separate keys by purpose, and rotate them on a schedule and after any suspected exposure.',
        'Back up keys securely, test recovery, and log every key use.'
      ]
    },
    {
      h: '9. Data at rest, in transit and in use',
      t: 'Data is always in one of three states: at rest (stored on a disk, in a database or in a backup), in transit (moving across a network) or in use (loaded in memory while a program works on it). Think of cash: it sits in a bank vault, travels in a cash van, or is counted at the counter. Each stage needs a different kind of protection.\n\nChoose controls by the state of the data. For data at rest, use full-disk encryption such as BitLocker or LUKS, database or field encryption, and encrypted backups, with keys held in a KMS. For data in transit, use TLS 1.2 or 1.3, HTTPS with HSTS, SSH, VPNs and mutual TLS (mTLS) between services. Data in use is the hardest, because it must be decrypted to be processed; access control, secrets managers and confidential computing reduce that risk.\n\nTake a lost office laptop. With BitLocker on, the thief gets only encrypted data. Without it, they can remove the disk and read every file. Now take a login form on public café Wi-Fi: HTTPS keeps the password safe in transit even if someone on the same network captures the traffic.\n\nThe table maps each state to its risks and controls. The note on post-quantum algorithms is a reminder that algorithms age, so build systems that can switch to new algorithms later without a full redesign.',
      table: [
        ['State', 'Risk', 'Controls'],
        ['At rest', 'Stolen disk, laptop, backup or database dump', 'Full-disk encryption (BitLocker, LUKS), database/field encryption, encrypted backups, KMS'],
        ['In transit', 'Eavesdropping and tampering on networks', 'TLS 1.2+/1.3, HTTPS with HSTS, SSH, VPN (IPsec/WireGuard), mTLS between services'],
        ['In use', 'Memory scraping, insider access', 'Access control, secrets managers, confidential computing']
      ],
      note: 'Plan for crypto-agility: NIST has standardized post-quantum algorithms (ML-KEM for key exchange and ML-DSA for signatures), and long-lived data should be migrated over time.'
    }
  ],
  lab: {
    title: 'Hands-on Lab 05: hash, encrypt and inspect certificates',
    steps: [
      ['Hash a file, change one character, and hash it again.', '# Linux\nsha256sum notes.txt\n# Windows PowerShell\nGet-FileHash notes.txt -Algorithm SHA256', 'The two hashes share nothing: the avalanche effect. This is how you verify a downloaded ISO against its published checksum.'],
      ['Encrypt and decrypt a file with OpenSSL, then try a wrong passphrase.', 'openssl enc -aes-256-cbc -pbkdf2 -salt -in notes.txt -out notes.enc\nhead -c 16 notes.enc | xxd     # starts with "Salted__"\nopenssl enc -d -aes-256-cbc -pbkdf2 -in notes.enc', 'The wrong passphrase gives “bad decrypt”. -pbkdf2 derives the key slowly from the passphrase.'],
      ['Sign a file with a lab RSA key, verify it, then tamper with it and verify again.', 'openssl dgst -sha256 -sign lab_private.pem -out r.sig report.txt\nopenssl dgst -sha256 -verify lab_public.pem -signature r.sig report.txt', 'Verified OK for the original; Verification failure after any change.'],
      ['Create a self-signed lab certificate and inspect it; then open a real site’s certificate in your browser.', 'openssl req -x509 -newkey rsa:2048 -nodes -keyout lab.key -out lab.crt -days 30 -subj "/CN=lab.local"\nopenssl x509 -in lab.crt -noout -subject -issuer -dates', 'Subject and issuer are the same, so no trusted CA vouches for it, and browsers warn. A real site shows an issuer from a CA chain.']
    ]
  },
  examples: [
    {
      title: 'Encoding is not encryption',
      lang: 'python',
      code: 'import base64\n\nsecret = "admin:Passw0rd!"\nencoded = base64.b64encode(secret.encode()).decode()\nprint("Base64:", encoded)\nprint("Anyone can decode it:", base64.b64decode(encoded).decode())',
      explanation: 'HTTP Basic authentication sends credentials Base64-encoded. Without TLS, anyone who captures the traffic can read them, which is why encoding must never be treated as protection.'
    },
    {
      title: 'Integrity with HMAC',
      lang: 'python',
      code: 'import hmac, hashlib\n\nkey = b"lab-shared-secret"          # in real systems, from a KMS\nmessage = b\'{"order": 1042, "amount": 499}\'\ntag = hmac.new(key, message, hashlib.sha256).hexdigest()\nprint("tag:", tag[:32], "...")\n\ntampered = b\'{"order": 1042, "amount": 1}\'\nok = hmac.compare_digest(tag, hmac.new(key, tampered, hashlib.sha256).hexdigest())\nprint("tampered message accepted?", ok)',
      explanation: 'An HMAC proves a message was not changed and came from someone with the shared key. Payment gateways use exactly this to sign webhook callbacks. compare_digest avoids timing leaks.'
    }
  ],
  best: [
    'Use well-reviewed libraries (libsodium, the cryptography package, OpenSSL); never invent algorithms.',
    'Prefer authenticated encryption: AES-GCM or ChaCha20-Poly1305.',
    'Hash passwords with Argon2id, bcrypt, scrypt or PBKDF2 and a unique salt.',
    'Use TLS everywhere with TLS 1.2+ (prefer 1.3); disable old protocols and weak ciphers; add HSTS.',
    'Keep keys in a KMS or HSM, rotate them, and never hard-code them.',
    'Automate certificate renewal and monitor expiry and Certificate Transparency logs.'
  ],
  mistakes: [
    'Treating Base64 or hex encoding as encryption.',
    'Storing passwords with MD5, SHA-1 or a single fast SHA-256.',
    'Using AES in ECB mode or reusing a nonce with the same key.',
    'Hard-coding keys in source code or sharing them in chat.',
    'Letting a certificate expire because renewal was manual.'
  ],
  exercise: {
    title: 'Practice exercises',
    problem: '1. Explain why encoding (Base64) is not encryption.\n2. Why must a password hash be slow, while a file checksum should be fast?\n3. Describe hybrid encryption and why TLS uses it.\n4. What is forward secrecy and which key exchange gives it?\n5. A site’s certificate expired yesterday. List the risks and how to stop it happening again.\n6. Design an encryption plan for a laptop fleet: disk, backups, email and file sharing.'
  },
  mini: {
    title: 'Mini project: secure notes app',
    objective: 'Build a command-line notes app that encrypts correctly.',
    requirements: [
      'Use a vetted library (for example cryptography with AES-GCM).',
      'Derive the key from a passphrase with Argon2id or scrypt.',
      'Store the salt and nonce with the ciphertext; never reuse a nonce.',
      'Write a one-page threat model: what it protects against and what it does not.'
    ],
    deliverable: 'A GitHub repository with the code, tests that show tampering is detected, and the threat model.'
  },
  takeaways: [
    'Hashing = integrity; encryption = confidentiality; signatures = authenticity.',
    'Use AES-GCM for data, ECDHE for key exchange and certificates for identity.',
    'Hash passwords with a salt and a slow algorithm.',
    'TLS 1.3 is the default for data in transit; disable SSL and TLS 1.0/1.1.',
    'Key management is usually where real systems fail.'
  ],
  quickRef: [
    'Integrity: SHA-256 · Passwords: Argon2id / bcrypt · MAC: HMAC-SHA256',
    'Data: AES-256-GCM · Key exchange: ECDHE · Signatures: Ed25519 / RSA-3072',
    'Never: MD5/SHA-1 for security · ECB mode · nonce reuse · keys in code',
    'TLS 1.3 recommended · TLS 1.2 with strong ciphers · SSL/TLS 1.0/1.1 off',
    'sha256sum · Get-FileHash · openssl enc / dgst / x509'
  ],
  refs: [
    ['NIST SP 800-57: Recommendation for Key Management', 'https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final'],
    ['RFC 8446: TLS 1.3', 'https://www.rfc-editor.org/rfc/rfc8446'],
    ['OWASP Password Storage Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html'],
    ['OWASP Cryptographic Storage Cheat Sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html'],
    ['Mozilla SSL Configuration Generator', 'https://ssl-config.mozilla.org/']
  ],
  quiz: [
    ['Which algorithm is appropriate for storing passwords?', ['MD5', 'SHA-1', 'Argon2id', 'Base64'], 2, 'Argon2id is slow and memory-hard; MD5 and SHA-1 are fast and broken; Base64 is only encoding.'],
    ['Data is encrypted with Bob’s public key. Which key decrypts it?', ['Alice’s public key', 'Bob’s private key', 'Bob’s public key', 'The CA’s key'], 1, 'Only the matching private key can decrypt.'],
    ['A digital signature provides:', ['Only confidentiality', 'Authenticity and integrity', 'Compression', 'Availability'], 1, 'It proves who signed and that the data has not changed.'],
    ['Which AES mode should be avoided?', ['GCM', 'ECB', 'CCM', 'CTR with a unique nonce'], 1, 'ECB encrypts identical blocks identically and reveals patterns.'],
    ['Which TLS version is recommended today?', ['SSL 3.0', 'TLS 1.0', 'TLS 1.1', 'TLS 1.3'], 3, 'TLS 1.3 has safer defaults; TLS 1.2 is acceptable with care.']
  ],

  skills: ['Choose hashing vs encryption vs signatures', 'Use OpenSSL for hashes, encryption and signatures', 'Store passwords with salts and slow hashes', 'Read certificates and TLS versions'],
  prereq: ['Module 02 (TLS in the network flow)', 'Module 04 (basic Python)'],
  analogy: 'A public key is an open padlock you hand out freely; anyone can snap it shut on a box, but only you hold the key that opens it. A signature is your wax seal: anyone can recognize it, nobody else can make it, and a broken seal shows tampering. A hash is a fingerprint: it identifies the document but you cannot rebuild the document from it.',
  why: 'Cryptography protects nearly every security control you will meet: HTTPS, VPNs, password databases, disk encryption, signed updates and tokens. Knowing what each tool guarantees, and what it does not, stops the expensive mistakes.',
  workflow: {
    title: 'How a website stores and checks your password',
    nodes: [
      ['input', 'Sign-up', 'User chooses a password', 'Password over HTTPS', 'Plain password in memory', 'The password travels to the server inside TLS, so it is not readable on the network. The server must never write it to logs or the database.'],
      ['salt', 'Add a salt', 'Random 16 bytes per user', 'Password', 'Password + salt', 'A unique random salt means two users with the same password get different hashes, and precomputed rainbow tables become useless.'],
      ['hash', 'Slow hash', 'Argon2id / bcrypt / PBKDF2', 'Password + salt', 'Password hash', 'A deliberately slow, memory-hard function makes each guess expensive. An attacker who steals the database can try only a few guesses per second per account instead of billions.'],
      ['store', 'Store', 'Salt + parameters + hash', 'Hash', 'Database row', 'Store the algorithm, its cost parameters, the salt and the hash together, so you can raise the cost later and re-hash on the next login.'],
      ['verify', 'Login check', 'Recompute and compare', 'Typed password', 'Allow or deny', 'At login, hash the typed password with the stored salt and parameters and compare with hmac.compare_digest (constant time). Add rate limiting and MFA on top.']
    ],
    explanation: 'Salt + slow hash + constant-time compare + rate limiting + MFA: each layer covers a different attack.'
  },
  caseStudy: {
    title: 'The DigiNotar CA breach (2011)',
    problem: 'Attackers broke into the Dutch certificate authority DigiNotar and issued fraudulent certificates for major domains.',
    data: 'Fraudulent certificates seen in the wild, CA server logs, browser trust stores.',
    steps: ['The CA’s systems were compromised.', 'Fake certificates for well-known domains were issued.', 'The certificates enabled man-in-the-middle interception of users who trusted them.', 'Browsers removed DigiNotar from their trust stores and the company went bankrupt.'],
    result: 'Trust in the whole PKI depends on CA security; Certificate Transparency was strengthened partly in response.',
    limitations: 'Simplified summary; read primary reports for details.'
  },
  exercises: [
    { title: 'Which key decrypts?', objective: 'Apply asymmetric rules.', problem: 'Priya encrypts a file for Arjun with Arjun’s public key. Who can decrypt it?', options: ['Anyone with Arjun’s public key', 'Only Arjun, with his private key', 'Priya, with her private key', 'The certificate authority'], answer: 1, hints: ['Public encrypts, private decrypts.'], solution: ['The matching private key is the only one that decrypts.', 'Arjun alone holds it.'], explanation: 'This is why private keys must never leave their owner.' },
    { title: 'Hex length of SHA-256', objective: 'Know hash sizes.', problem: 'SHA-256 outputs how many bits?', answer: 256, hints: ['It is in the name.'], solution: ['256 bits = 32 bytes = 64 hex characters.'], explanation: 'Fixed-size output, whatever the input length.' },
    { title: 'Spot the weak storage', objective: 'Recognize unsafe password storage.', problem: 'Which password storage is acceptable?', options: ['MD5(password)', 'SHA-256(password)', 'Base64(password)', 'Argon2id(password, unique salt)'], answer: 3, hints: ['It must be slow and salted.'], solution: ['MD5 and a single SHA-256 are fast to brute-force.', 'Base64 is reversible.', 'Argon2id with a salt is the modern choice.'], explanation: 'Slow + salted is the rule.' },
    { type: 'Short answer', title: 'Name the property', objective: 'Use precise vocabulary.', problem: 'A captured TLS session from last year stays safe even after the server’s private key is stolen today. What is this property called? (two words)', accept: ['forward secrecy', 'perfect forward secrecy'], hints: ['It comes from ephemeral (EC)DHE keys.'], solution: ['Each session used a fresh ephemeral key that was then discarded.'], explanation: 'TLS 1.3 requires forward secrecy.' }
  ],
  checks: [
    ['Why add a salt to each password hash?', ['To make hashing faster', 'So identical passwords get different hashes and rainbow tables fail', 'To encrypt the password', 'To shorten the hash'], 1, 'Salts make precomputed attacks useless.'],
    ['What does a certificate bind together?', ['A password and a username', 'A public key and an identity', 'Two private keys', 'A hash and a salt'], 1, 'A CA vouches that this public key belongs to this domain or organization.'],
    ['Which is symmetric?', ['RSA', 'ECDSA', 'AES', 'Ed25519'], 2, 'AES uses the same key to encrypt and decrypt.']
  ],
  cheat: ['Encode ≠ Encrypt ≠ Hash', 'AES-GCM · ChaCha20-Poly1305 · never ECB', 'Argon2id / bcrypt + salt for passwords', 'Sign with private · verify with public', 'TLS 1.3 · HSTS · auto-renew certificates'],
  next: 'Module 06 applies these ideas to web applications and APIs: the OWASP Top 10, sessions, tokens and secure headers.'
};
