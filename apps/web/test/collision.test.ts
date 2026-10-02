import { describe, it, expect } from 'vitest';
import { checkAABB, getCharacterHitbox, isTileWalkable } from '../src/systems/collision';

describe('Collision System', () => {
  it('correctly detects overlapping bounding boxes', () => {
    const boxA = { x: 10, y: 10, w: 20, h: 20 };
    const boxB = { x: 25, y: 25, w: 20, h: 20 };
    expect(checkAABB(boxA, boxB)).toBe(true);
  });

  it('correctly rejects non-overlapping bounding boxes', () => {
    const boxA = { x: 0, y: 0, w: 10, h: 10 };
    const boxB = { x: 20, y: 20, w: 10, h: 10 };
    expect(checkAABB(boxA, boxB)).toBe(false);
  });

  it('calculates the precise character foot hitbox matching GBA dimensions', () => {
    const footBox = getCharacterHitbox(100, 200);
    expect(footBox).toEqual({
      x: 100 + 22,
      y: 200 + 48,
      w: 20,
      h: 14,
    });
  });

  it('correctly validates walkable tiles vs colliders', () => {
    const colliders = [
      { x: 32, y: 32, w: 32, h: 32 }, // Solid obstacle
    ];

    // Blocked by terrain function
    expect(isTileWalkable(0, 0, () => false, [])).toBe(false);

    // Blocked by collider
    // Target grid (1, 1) -> pixelX = 16, pixelY = 0 -> footBox: x = 38, y = 48 -> overlaps [32..64, 32..64]
    expect(isTileWalkable(1, 1, () => true, colliders)).toBe(false);

    // Free tile far away
    expect(isTileWalkable(5, 5, () => true, colliders)).toBe(true);
  });
});
