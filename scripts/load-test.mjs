// Load test: N requests per endpoint at a set concurrency; prints speed, latency and errors.
// Usage: node scripts/load-test.mjs http://localhost:5000 1000 50   (point it at a test copy, not live)
const BASE = process.argv[2] || 'http://localhost:5001';
const TOTAL = Number(process.argv[3] || 1000);
const CONC = Number(process.argv[4] || 50);
const endpoints = [
  ['GET', '/api/health'],
  ['GET', '/api/courses'],
  ['GET', '/api/courses/python-programming'],
  ['GET', '/api/referrals/promo'],
  ['GET', '/api/referrals/code/RIYAT497'],
  ['GET', '/api/certificates/verify/NOT-REAL'],
  ['POST', '/api/referrals/click', () => ({ code: 'RIYAT497', visitorId: `load-${Math.random().toString(36).slice(2, 8)}` })]
];
const pct = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];

for (const [method, path, body] of endpoints) {
  const times = []; let errors = 0; const codes = {};
  let next = 0;
  const t0 = performance.now();
  const worker = async () => {
    while (next < TOTAL) {
      next++;
      const s = performance.now();
      try {
        const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body()) : undefined });
        await r.arrayBuffer();
        codes[r.status] = (codes[r.status] || 0) + 1;
        if (r.status >= 500) errors++;
      } catch { errors++; }
      times.push(performance.now() - s);
    }
  };
  await Promise.all(Array.from({ length: CONC }, worker));
  const secs = (performance.now() - t0) / 1000;
  times.sort((a, b) => a - b);
  console.log(`${method} ${path.padEnd(36)} ${TOTAL} req  ${(TOTAL / secs).toFixed(0).padStart(5)} req/s  p50 ${pct(times, .5).toFixed(0).padStart(4)}ms  p95 ${pct(times, .95).toFixed(0).padStart(4)}ms  p99 ${pct(times, .99).toFixed(0).padStart(5)}ms  5xx/failed ${errors}  ${JSON.stringify(codes)}`);
}
