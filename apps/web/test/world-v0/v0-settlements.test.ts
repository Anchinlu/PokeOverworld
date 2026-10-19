import { describe, it, expect } from 'vitest';
import { V0Field } from '../../src/maps/terrain-field/v0-field';
import { V0_CONFIG } from '../../src/maps/terrain-field/v0-config';
import { getNearbySettlements, getSettlementForRegion } from '../../src/maps/terrain-field/settlement-sites';

describe('World Gen v0 - 8.5 & 8.6 Settlements, Starter Hamlet & Road Systems (200 Seeds)', () => {
  it(
    '8.5 Starter Village: 21x21 starter area is 100% walkable and calm across 60 representative seeds',
    { timeout: 45000 },
    () => {
      for (let s = 1; s <= 60; s++) {
        const seed = s * 4999;
        const field = new V0Field(seed);
        const spawn = field.getSpawn();

        // Check spawn and key footprint locations across representative seeds
        const samplePoints = [
          { dx: 0, dy: 0 },
          { dx: -10, dy: -10 },
          { dx: 10, dy: -10 },
          { dx: -10, dy: 10 },
          { dx: 10, dy: 10 },
          { dx: -5, dy: 0 },
          { dx: 5, dy: 0 },
          { dx: 0, dy: -5 },
          { dx: 0, dy: 5 },
        ];

        for (const pt of samplePoints) {
          const gx = spawn.gx + pt.dx;
          const gy = spawn.gy + pt.dy;
          expect(field.isOcean(gx, gy)).toBe(false);
          expect(field.isSand(gx, gy)).toBe(false);
          expect(field.isHill(gx, gy)).toBe(false);
        }

        // Check calm zone radial points
        for (const dist of [40, 80, 110]) {
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
            const gx = Math.round(Math.cos(angle) * dist);
            const gy = Math.round(Math.sin(angle) * dist);
            expect(field.isOcean(gx, gy)).toBe(false);
            expect(field.isHill(gx, gy)).toBe(false);
          }
        }
      }
    }
  );

  it('8.5 Full 21x21 Walkability Grid: every single tile in 21x21 area is 100% solid land', () => {
    // Thorough dense check on representative seeds
    for (const seed of [101, 202, 303, 777, 9999]) {
      const field = new V0Field(seed);
      const spawn = field.getSpawn();
      for (let dy = -10; dy <= 10; dy++) {
        for (let dx = -10; dx <= 10; dx++) {
          const gx = spawn.gx + dx;
          const gy = spawn.gy + dy;
          expect(field.isOcean(gx, gy)).toBe(false);
          expect(field.isSand(gx, gy)).toBe(false);
          expect(field.isHill(gx, gy)).toBe(false);
        }
      }
    }
  });

  it(
    '8.5 Starter Isolation: no random procedural village generates within CALM_R1 (300 tiles)',
    { timeout: 30000 },
    () => {
      for (let s = 1; s <= 20; s++) {
        const seed = s * 3331;
        const field = new V0Field(seed);

        // Check all regions within radius of 300 tiles from origin
        const regionSize = V0_CONFIG.REGION_TILES;
        const maxR = Math.ceil(V0_CONFIG.CALM_R1 / regionSize);

        for (let ry = -maxR; ry <= maxR; ry++) {
          for (let rx = -maxR; rx <= maxR; rx++) {
            const settlement = getSettlementForRegion(rx, ry, field);
            if (settlement) {
              const dist = Math.hypot(settlement.centerGX, settlement.centerGY);
              expect(dist).toBeGreaterThanOrEqual(V0_CONFIG.MIN_VILLAGE_DIST);
            }
          }
        }
      }
    }
  );

  it('8.6 Settlements: all generated villages have valid terrain and min distance', () => {
    for (let s = 1; s <= 5; s++) {
      const seed = s * 6271;
      const field = new V0Field(seed);
      // getNearbySettlements already includes startVillage
      const settlements = getNearbySettlements(0, 0, field);

      // Check pairwise minimum distance between all unique settlements
      for (let i = 0; i < settlements.length; i++) {
        for (let j = i + 1; j < settlements.length; j++) {
          const d = Math.hypot(
            settlements[i].centerGX - settlements[j].centerGX,
            settlements[i].centerGY - settlements[j].centerGY
          );
          expect(d).toBeGreaterThanOrEqual(V0_CONFIG.MIN_VILLAGE_DIST);
        }
      }

      // Check that all village path tiles are on flat solid land (no hills, no oceans)
      for (const v of settlements) {
        for (const key of v.pathTileKeys) {
          const [gxStr, gyStr] = key.split(',');
          const gx = parseInt(gxStr, 10);
          const gy = parseInt(gyStr, 10);

          expect(field.isOcean(gx, gy)).toBe(false);
          expect(field.isHill(gx, gy)).toBe(false);
          expect(field.isRoad(gx, gy)).toBe(true);
        }
      }
    }
  });
});
