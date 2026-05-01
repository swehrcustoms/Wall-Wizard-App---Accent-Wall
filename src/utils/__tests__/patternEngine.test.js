import { describe, it, expect } from 'vitest';
import {
  generateChevron,
  generateShiplap,
  generateVerticalSlat,
  removePiecesInsideObstacles,
} from '../patternEngine';

const WALL = { width_in: 144, height_in: 96 };

describe('generateChevron', () => {
  it('produces pieces for a 12x8 wall', () => {
    const pieces = generateChevron(WALL, {});
    expect(pieces.length).toBeGreaterThan(0);
  });

  it('no piece is entirely outside wall bounds (after clip)', () => {
    const pieces = generateChevron(WALL, {});
    pieces.forEach((p) => {
      expect(p.x_in + p.w_in).toBeGreaterThan(0);
      expect(p.y_in + p.h_in).toBeGreaterThan(0);
      expect(p.x_in).toBeLessThan(WALL.width_in);
      expect(p.y_in).toBeLessThan(WALL.height_in);
    });
  });
});

describe('generateShiplap', () => {
  it('covers the full height with horizontal boards', () => {
    const pieces = generateShiplap(WALL, { board_w_in: 7.25, overlap_in: 1 });
    const totalH = pieces.reduce((s, p) => s + p.h_in, 0);
    expect(totalH).toBeGreaterThanOrEqual(WALL.height_in);
  });
});

describe('generateVerticalSlat', () => {
  it('all pieces have y_in = 0 and h_in = wall height', () => {
    const pieces = generateVerticalSlat(WALL, { slat_w_in: 1.5, gap_in: 1.5 });
    pieces.forEach((p) => {
      expect(p.y_in).toBe(0);
      expect(p.h_in).toBe(WALL.height_in);
    });
  });
});

describe('removePiecesInsideObstacles', () => {
  it('removes pieces fully inside an obstacle', () => {
    const pieces = [
      { id: '1', x_in: 10, y_in: 10, w_in: 4, h_in: 4, angle_deg: 0, layer: 'boards' },
      { id: '2', x_in: 50, y_in: 50, w_in: 4, h_in: 4, angle_deg: 0, layer: 'boards' },
    ];
    const obstacles = [{ type: 'outlet', x_in: 8, y_in: 8, w_in: 10, h_in: 10 }];
    const result = removePiecesInsideObstacles(pieces, obstacles);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('keeps pieces that overlap but are not fully inside obstacle', () => {
    const pieces = [
      { id: '1', x_in: 5, y_in: 5, w_in: 20, h_in: 4, angle_deg: 0, layer: 'boards' },
    ];
    const obstacles = [{ type: 'outlet', x_in: 8, y_in: 8, w_in: 10, h_in: 10 }];
    const result = removePiecesInsideObstacles(pieces, obstacles);
    expect(result).toHaveLength(1);
  });
});
