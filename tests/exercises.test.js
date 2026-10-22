import { describe, it, expect } from 'vitest';
import { verifyAll } from '../scripts/verify-exercises.mjs';

// Runs every runnable solution and worked example (Python via a local interpreter, SQL via sql.js,
// JavaScript via Node) and compares the real output with the stated expected output.
describe('exercise solutions produce their expected output', () => {
  it('all runnable items pass (items needing an unavailable runtime are skipped)', async () => {
    const results = await verifyAll({ quiet: true });
    const failures = results.filter(r => r.status === 'FAIL');
    expect(results.length).toBeGreaterThan(100);
    expect(failures).toEqual([]);
  });
});
