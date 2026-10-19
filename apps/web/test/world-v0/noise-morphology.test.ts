import { describe, it, expect } from 'vitest';
import { hash2, fade, valueNoise2, fbm2 } from '../../src/maps/terrain-field/noise';
import { dilate, erode, open, close } from '../../src/maps/terrain-field/morphology';

describe('Deterministic Noise Engine (noise.ts)', () => {
  it('hash2 produces deterministic values in [0, 1)', () => {
    for (let i = 0; i < 50; i++) {
      const val = hash2(i * 17 - 50, i * 29 + 100, 12345, 99);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
      expect(hash2(i * 17 - 50, i * 29 + 100, 12345, 99)).toBe(val);
    }
  });

  it('hash2 demonstrates full 32-bit seed entropy (no seed % 1000 collapse)', () => {
    const val1 = hash2(10, 20, 101, 1);
    const val2 = hash2(10, 20, 1101, 1);
    const val3 = hash2(10, 20, 2101, 1);
    expect(val1).not.toBe(val2);
    expect(val2).not.toBe(val3);
    expect(val1).not.toBe(val3);
  });

  it('fade curve produces smooth C2 interpolation values', () => {
    expect(fade(0)).toBe(0);
    expect(fade(1)).toBe(1);
    expect(fade(0.5)).toBe(0.5);
    expect(fade(0.2)).toBeCloseTo(0.05792, 4);
    expect(fade(0.8)).toBeCloseTo(0.94208, 4);
  });

  it('valueNoise2 is smooth and bounded in [0, 1]', () => {
    for (let y = 0; y < 10; y += 0.5) {
      for (let x = 0; x < 10; x += 0.5) {
        const n = valueNoise2(x, y, 42, 100);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThanOrEqual(1);
      }
    }
  });

  it('fbm2 combines octaves smoothly within [0, 1]', () => {
    for (let i = 0; i < 20; i++) {
      const v = fbm2(i * 0.1, i * 0.1, 777, 123, 4);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe('Binary Grid Morphology (morphology.ts)', () => {
  it('dilate expands 1s by Chebyshev radius', () => {
    const w = 5;
    const h = 5;
    const src = new Uint8Array(w * h);
    src[2 * w + 2] = 1; // Center 1

    const dilated = dilate(src, w, h, 1);
    // [1..3] x [1..3] should all be 1
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 3; x++) {
        expect(dilated[y * w + x]).toBe(1);
      }
    }
    // Corners should be 0
    expect(dilated[0 * w + 0]).toBe(0);
    expect(dilated[0 * w + 4]).toBe(0);
    expect(dilated[4 * w + 0]).toBe(0);
    expect(dilated[4 * w + 4]).toBe(0);
  });

  it('erode shrinks 1s by Chebyshev radius', () => {
    const w = 5;
    const h = 5;
    const src = new Uint8Array(w * h);
    // Fill a 3x3 block with 1s
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 3; x++) {
        src[y * w + x] = 1;
      }
    }

    const eroded = erode(src, w, h, 1);
    // Only the center cell survives
    expect(eroded[2 * w + 2]).toBe(1);
    expect(eroded[1 * w + 1]).toBe(0);
    expect(eroded[1 * w + 2]).toBe(0);
  });

  it('open removes isolated single-cell islands', () => {
    const w = 7;
    const h = 7;
    const src = new Uint8Array(w * h);
    src[3 * w + 3] = 1; // Single isolated 1

    const opened = open(src, w, h, 1);
    expect(opened[3 * w + 3]).toBe(0);
  });

  it('close fills isolated single-cell pinholes', () => {
    const w = 7;
    const h = 7;
    const src = new Uint8Array(w * h).fill(1);
    src[3 * w + 3] = 0; // Single hole in solid block

    const closed = close(src, w, h, 1);
    expect(closed[3 * w + 3]).toBe(1);
  });
});
