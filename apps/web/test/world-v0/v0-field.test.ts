import { describe, it, expect } from 'vitest';
import { TILE_IDS } from '@pokemon/game-data';
import { V0Field } from '../../src/maps/terrain-field/v0-field';
import { createTerrainField } from '../../src/maps/terrain-field';

describe('V0Field Infinite 2D Procedural Terrain (worldGenVersion = 2)', () => {
  it('creates V0Field through createTerrainField factory', () => {
    const field = createTerrainField(2, 101);
    expect(field.version).toBe(2);
    expect(field.seed).toBe(101);
    expect(field.getSpawn()).toEqual({ gx: -7, gy: -5 });
  });

  it('I1 Determinism: repeated queries yield identical results', () => {
    const field1 = new V0Field(101);
    const field2 = new V0Field(101);

    for (let gy = -50; gy <= 50; gy += 10) {
      for (let gx = -50; gx <= 50; gx += 10) {
        expect(field1.isOcean(gx, gy)).toBe(field2.isOcean(gx, gy));
        expect(field1.isSand(gx, gy)).toBe(field2.isSand(gx, gy));
        expect(field1.isHill(gx, gy)).toBe(field2.isHill(gx, gy));
      }
    }
  });

  it('I3 Forced Land Anchor: guarantees 100% solid land within r <= 330 of (0, 0)', () => {
    const field = new V0Field(101);

    // Sample across the forced land disk
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      for (const dist of [0, 50, 100, 200, 300, 320]) {
        const gx = Math.round(Math.cos(angle) * dist);
        const gy = Math.round(Math.sin(angle) * dist);
        expect(field.isOcean(gx, gy)).toBe(false);
        expect(field.isSand(gx, gy)).toBe(false);
      }
    }
  });

  it('I4 Calm Zone: guarantees 0 hills within r <= 120 of (0, 0)', () => {
    const field = new V0Field(101);

    for (let gy = -120; gy <= 120; gy += 15) {
      for (let gx = -120; gx <= 120; gx += 15) {
        if (Math.hypot(gx, gy) <= 120) {
          expect(field.isHill(gx, gy)).toBe(false);
        }
      }
    }
  });

  it('I5 Buffer: hills are separated from sand by at least 2 tiles', () => {
    const field = new V0Field(101);

    // Scan a large area
    for (let gy = 200; gy <= 400; gy += 5) {
      for (let gx = 200; gx <= 400; gx += 5) {
        if (field.isHill(gx, gy)) {
          // Check 2-tile radius around hill for sand
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              expect(field.isSand(gx + dx, gy + dy)).toBe(false);
            }
          }
        }
      }
    }
  });

  it('I6 Seed Diversity: different seeds produce different world geography', { timeout: 15000 }, () => {
    const fieldA = new V0Field(101);
    const fieldB = new V0Field(202);

    let diffCount = 0;
    for (let gy = 600; gy <= 800; gy += 40) {
      for (let gx = 600; gx <= 800; gx += 40) {
        if (fieldA.isOcean(gx, gy) !== fieldB.isOcean(gx, gy)) {
          diffCount++;
        }
      }
    }
    expect(diffCount).toBeGreaterThan(0);
  });

  it('I7 Shoreline Wave Autotiling: assigns wave tiles (731..735) at coastal contact and ocean_water (730) in deep ocean', () => {
    const field = new V0Field(101);

    // Search for coastline boundaries far enough from anchor (r > 330)
    let foundShoreContact = false;
    let foundDeepOcean = false;

    // Scan for coastline boundary
    for (let gy = 400; gy <= 600; gy += 4) {
      for (let gx = 400; gx <= 600; gx += 4) {
        if (field.isSand(gx, gy) && field.isOcean(gx + 1, gy)) {
          foundShoreContact = true;
          const contactId = field.getOceanTileId(gx + 1, gy);
          // Directly adjacent to sand on West must be shore_v or corner_in/corner_in_flip
          expect(contactId).toBeGreaterThanOrEqual(731);
          expect(contactId).toBeLessThanOrEqual(735);
        }
        if (field.isOcean(gx, gy) && !field.isSand(gx, gy) && !field.isSand(gx - 1, gy) && !field.isSand(gx + 1, gy)) {
          // Ocean tile away from immediate sand edge
          if (
            !field.isSand(gx, gy - 1) &&
            !field.isSand(gx, gy + 1) &&
            !field.isSand(gx - 1, gy - 1) &&
            !field.isSand(gx - 1, gy + 1) &&
            !field.isSand(gx + 1, gy - 1) &&
            !field.isSand(gx + 1, gy + 1)
          ) {
            foundDeepOcean = true;
            expect(field.getOceanTileId(gx, gy)).toBe(TILE_IDS.ocean_water);
          }
        }
      }
    }

    expect(foundShoreContact).toBe(true);
    expect(foundDeepOcean).toBe(true);
  });
});
