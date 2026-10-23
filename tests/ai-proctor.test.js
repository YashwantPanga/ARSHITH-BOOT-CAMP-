import { describe, it, expect } from 'vitest';
import { faceDistance, matchPercent, handNearFace, SAME_PERSON } from '../src/utils/aiProctor';

describe('AI proctoring helpers', () => {
  it('measures descriptor distance', () => {
    expect(faceDistance([0, 0, 0], [3, 4, 0])).toBe(5);
    expect(faceDistance([1, 2], [1, 2])).toBe(0);
  });

  it('turns distance into a 0-100 match score with the threshold near 55%', () => {
    expect(matchPercent(0)).toBe(100);
    expect(matchPercent(SAME_PERSON)).toBeGreaterThanOrEqual(50);
    expect(matchPercent(SAME_PERSON)).toBeLessThanOrEqual(60);
    expect(matchPercent(5)).toBe(0);
  });

  it('flags a hand overlapping the face area', () => {
    const face = { x: 100, y: 100, width: 100, height: 120 };
    expect(handNearFace({ x: 180, y: 150, width: 60, height: 60 }, face)).toBe(true);
    expect(handNearFace({ x: 400, y: 300, width: 60, height: 60 }, face)).toBe(false);
  });
});
