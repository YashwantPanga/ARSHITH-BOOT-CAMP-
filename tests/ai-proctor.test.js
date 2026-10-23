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

import { gazeState, GAZE_LIMITS } from '../src/utils/aiProctor';

describe('eye and head tracking', () => {
  const base = { pitch: 0.35, yaw: 0, down: 0.15, side: 0.05 };
  const g = (over) => ({ pitch: 0.35, yaw: 0, down: 0.15, side: 0.05, closed: 0.1, irises: [], ...over });

  it('stays on screen at the calibrated pose and while reading the lower screen', () => {
    expect(gazeState(g({}), base)).toMatchObject({ down: false, away: false });
    expect(gazeState(g({ down: 0.15 + GAZE_LIMITS.eyesDown - 0.05 }), base).down).toBe(false);
  });

  it('flags the head tipping down or the eyes looking well below the screen', () => {
    expect(gazeState(g({ pitch: 0.35 + GAZE_LIMITS.headDown + 0.02 }), base).down).toBe(true);
    expect(gazeState(g({ down: 0.15 + GAZE_LIMITS.eyesDown + 0.05 }), base).down).toBe(true);
  });

  it('flags turning away, and ignores eye direction during a blink', () => {
    expect(gazeState(g({ yaw: GAZE_LIMITS.headTurn + 0.05 }), base).away).toBe(true);
    expect(gazeState(g({ down: 0.9, closed: 0.8 }), base).down).toBe(false);
  });
});
