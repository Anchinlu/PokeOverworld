import { describe, it, expect } from 'vitest';
import { V3Field } from '../../src/maps/terrain-field/v3-field';
import { createTerrainField } from '../../src/maps/terrain-field';
import { V3_CONFIG } from '../../src/maps/terrain-field/v3-config';
import { getStartSpawn } from '../../src/maps/terrain-field/start-village';

describe('World Gen v3 - Asymmetric Valley & Organic Opening Corridors (worldGenVersion = 3)', () => {
  it('creates V3Field through createTerrainField factory with version = 3', () => {
    const field = createTerrainField(3, 101);
    expect(field.version).toBe(3);
    expect(field.seed).toBe(101);
    expect(field.getSpawn()).toEqual(getStartSpawn(101));
  });

  it('1. Safe Village Core: guarantees 100% solid flat land within SAFE_CORE_R = 36', () => {
    const field = new V3Field(101);

    // Scan all tiles in [-36, 36] x [-36, 36] within radius 36
    for (let gy = -36; gy <= 36; gy += 4) {
      for (let gx = -36; gx <= 36; gx += 4) {
        if (Math.hypot(gx, gy) <= V3_CONFIG.SAFE_CORE_R) {
          expect(field.isOcean(gx, gy)).toBe(false);
          expect(field.isSand(gx, gy)).toBe(false);
          expect(field.isHill(gx, gy)).toBe(false);
        }
      }
    }

    // Verify Twinleaf Hamlet footprint
    for (let gy = -8; gy <= 6; gy++) {
      for (let gx = -11; gx <= 8; gx++) {
        expect(field.isOcean(gx, gy)).toBe(false);
        expect(field.isSand(gx, gy)).toBe(false);
        expect(field.isHill(gx, gy)).toBe(false);
      }
    }

    // Spawn point must be completely walkable
    const spawn = field.getSpawn();
    expect(field.isOcean(spawn.gx, spawn.gy)).toBe(false);
    expect(field.isSand(spawn.gx, spawn.gy)).toBe(false);
    expect(field.isHill(spawn.gx, spawn.gy)).toBe(false);
  });

  it('2. Pure Determinism (Invariant I1): identical seed yields identical tiles', { timeout: 20000 }, () => {
    const field1 = new V3Field(101);
    const field2 = new V3Field(101);

    for (let gy = -100; gy <= 100; gy += 15) {
      for (let gx = -100; gx <= 100; gx += 15) {
        expect(field1.isOcean(gx, gy)).toBe(field2.isOcean(gx, gy));
        expect(field1.isSand(gx, gy)).toBe(field2.isSand(gx, gy));
        expect(field1.isHill(gx, gy)).toBe(field2.isHill(gx, gy));
        expect(field1.getSafetyLevel(gx, gy)).toBe(field2.getSafetyLevel(gx, gy));
      }
    }
  });

  it('3. Organic Non-Circular Boundary: land boundary variance proves it is NOT a circle', () => {
    const field = new V3Field(101);

    // Sample corridor and non-corridor directions around the village anchor
    const testDirections: { name: string; dirX: number; dirY: number }[] = [
      // 3 Natural Corridors (extend far into the world)
      { name: 'Corridor Route 1 (NE)', dirX: 0.6, dirY: -0.8 },
      { name: 'Corridor Wilds (WSW)', dirX: -0.8, dirY: 0.6 },
      { name: 'Corridor Frontier (SSE)', dirX: 0.28, dirY: 0.96 },
      // Non-corridor valleys / bays (transition to water/hills earlier)
      { name: 'East', dirX: 1, dirY: 0 },
      { name: 'North', dirX: 0, dirY: -1 },
      { name: 'West', dirX: -1, dirY: 0 },
      { name: 'South', dirX: 0, dirY: 1 },
      { name: 'North-West', dirX: -0.707, dirY: -0.707 },
    ];

    const rayDistances: number[] = [];

    for (const dir of testDirections) {
      // March along ray from r = 36 to 260 to find where land ends (first ocean)
      let landEndR = 260;
      for (let r = 36; r <= 260; r += 2) {
        const gx = Math.round(dir.dirX * r);
        const gy = Math.round(dir.dirY * r);
        if (field.isOcean(gx, gy)) {
          landEndR = r;
          break;
        }
      }
      rayDistances.push(landEndR);
    }

    // Calculate mean and standard deviation of land boundaries
    const mean = rayDistances.reduce((a, b) => a + b, 0) / rayDistances.length;
    const variance =
      rayDistances.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rayDistances.length;
    const stdDev = Math.sqrt(variance);

    // A circle would have stdDev close to 0. An organic valley with corridors has high stdDev (> 20 tiles)
    expect(stdDev).toBeGreaterThan(20);

    // Corridors extend significantly further than non-corridor directions (range > 40 tiles)
    const maxR = Math.max(...rayDistances);
    const minR = Math.min(...rayDistances);
    expect(maxR - minR).toBeGreaterThan(40);
  });

  it(
    '4. Continuous Walkable Corridor: Route 1 (North-East) has unbroken walkable route to distance >= 160',
    { timeout: 20000 },
    () => {
    const field = new V3Field(101);

    // Perform BFS flood-fill starting from spawn (0, 0), moving strictly on walkable land (!isOcean && !isHill)
    const queue: [number, number][] = [[0, 0]];
    const visited = new Set<string>();
    visited.add('0,0');

    let maxDistanceReached = 0;
    const targetDirectionX = 0.6; // Route 1 direction
    const targetDirectionY = -0.8;

    while (queue.length > 0) {
      const [curX, curY] = queue.shift()!;
      const d = Math.hypot(curX, curY);

      // Track how far we've progressed along the North-East corridor
      const dot = curX * targetDirectionX + curY * targetDirectionY;
      if (dot > maxDistanceReached) {
        maxDistanceReached = dot;
      }

      if (maxDistanceReached >= 160) {
        break; // Successfully reached outer route!
      }

      // Check 4-connected neighbors
      const neighbors: [number, number][] = [
        [curX + 1, curY],
        [curX - 1, curY],
        [curX, curY + 1],
        [curX, curY - 1],
      ];

      for (const [nx, ny] of neighbors) {
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;

        // Stay within corridor corridor envelope to keep BFS focused
        const perp = Math.abs(nx * 0.8 + ny * 0.6);
        if (perp > 24) continue; // within corridor half-width
        if (nx * targetDirectionX + ny * targetDirectionY < -10) continue; // forward progress

        if (!field.isOcean(nx, ny) && !field.isHill(nx, ny)) {
          visited.add(key);
          queue.push([nx, ny]);
        }
      }
    }

    expect(maxDistanceReached).toBeGreaterThanOrEqual(160);
  });

  it('5. Clean Morphology & Hill Calm: no hills near sand, calm starter core', () => {
    const field = new V3Field(101);

    // Hill Calm: zero hills within r <= 36
    for (let gy = -40; gy <= 40; gy += 4) {
      for (let gx = -40; gx <= 40; gx += 4) {
        if (Math.hypot(gx, gy) <= V3_CONFIG.SAFE_CORE_R) {
          expect(field.isHill(gx, gy)).toBe(false);
        }
      }
    }

    // Buffer: hill never touches or is within 2 tiles of sand
    for (let gy = 80; gy <= 160; gy += 5) {
      for (let gx = 80; gx <= 160; gx += 5) {
        if (field.isHill(gx, gy)) {
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              expect(field.isSand(gx + dx, gy + dy)).toBe(false);
            }
          }
        }
      }
    }
  });

  it('6. Seed Diversity (Invariant I4): distinct seeds generate distinct valley geography', () => {
    const fieldA = new V3Field(101);
    const fieldB = new V3Field(999);

    let differences = 0;
    for (let gy = 80; gy <= 150; gy += 10) {
      for (let gx = 80; gx <= 150; gx += 10) {
        if (fieldA.isOcean(gx, gy) !== fieldB.isOcean(gx, gy) || fieldA.isHill(gx, gy) !== fieldB.isHill(gx, gy)) {
          differences++;
        }
      }
    }

    expect(differences).toBeGreaterThan(0);
  });

  it('7. Diagnostics and Safety Metric', () => {
    const field = new V3Field(101);

    // Center is 100% safe
    expect(field.getSafetyLevel(0, 0)).toBe(1.0);

    // Distant outer point is 0% safe
    const distantSafety = field.getSafetyLevel(400, 400);
    expect(distantSafety).toBe(0.0);

    // Corridor influence is high along corridor rays
    const corridorInf = field.getCorridorInfluence(60, -80); // (0.6*100, -0.8*100)
    expect(corridorInf).toBeGreaterThan(0.5);

    // Corridor influence is 0 in opposite direction
    const oppositeInf = field.getCorridorInfluence(-60, -80);
    expect(oppositeInf).toBe(0);
  });
});
