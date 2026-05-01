import { describe, it, expect } from 'vitest';
import { generateCutList } from '../cutOptimizer';

describe('generateCutList', () => {
  it('returns empty result for empty input', () => {
    const result = generateCutList({ needed: [] });
    expect(result.totalBoards).toBe(0);
    expect(result.boards).toHaveLength(0);
  });

  it('fits one cut in one board', () => {
    const result = generateCutList({ needed: [48], stockLen: 96 });
    expect(result.totalBoards).toBe(1);
    expect(result.boards[0].cuts).toEqual([48]);
  });

  it('sums of cuts equals input (multiset)', () => {
    const needed = [12, 24, 36, 18, 9];
    const result = generateCutList({ needed, stockLen: 96 });
    const allCuts = result.boards.flatMap((b) => b.cuts).sort((a, b) => a - b);
    const sorted = [...needed].sort((a, b) => a - b);
    expect(allCuts).toEqual(sorted);
  });

  it('no board usedLen exceeds stockLen', () => {
    const needed = Array(20).fill(24);
    const result = generateCutList({ needed, stockLen: 96 });
    result.boards.forEach((b) => {
      expect(b.usedLen).toBeLessThanOrEqual(96);
    });
  });

  it('throws when cut exceeds stockLen', () => {
    expect(() => generateCutList({ needed: [120], stockLen: 96 })).toThrow();
  });

  it('100 cuts of 12" with stockLen 96 → pins board count', () => {
    const result = generateCutList({ needed: Array(100).fill(12), stockLen: 96, kerf: 0.125 });
    // 7 cuts per board: 12 + 6*(12.125) = 12 + 72.75 = 84.75 ≤ 96 ✓ ; 8th would be 84.75 + 12.125 = 96.875 > 96
    expect(result.totalBoards).toBe(Math.ceil(100 / 7));
  });
});
