import { TERRAIN } from '@pokemon/game-data';
import { describe, expect, it } from 'vitest';
import { ContinentService } from '../../src/continent';
import {
  getNearbySettlements,
  getV0VillageBuildingsForChunk,
  isV0RoadTile,
} from '../../src/maps/terrain-field/settlement-sites';
import { createTerrainField } from '../../src/maps/terrain-field';
import { generateChunkTerrain } from '../../src/maps/chunk-terrain';

function findVillagePathTile(seed: number): { gx: number; gy: number } {
  const plan = new ContinentService(seed).getPlan();
  const field = createTerrainField(4, seed);
  const settlement = plan.settlements.find((candidate) => {
    if (Math.hypot(candidate.gx, candidate.gy) < 160) return false;
    const nearby = getNearbySettlements(candidate.gx, candidate.gy, field);
    return nearby.some((v) => v.name === candidate.name);
  });
  if (!settlement) throw new Error('V4 plan did not produce a remote settlement');

  for (let gy = settlement.gy - 10; gy <= settlement.gy + 10; gy++) {
    for (let gx = settlement.gx - 14; gx <= settlement.gx + 14; gx++) {
      if (
        isV0RoadTile(gx, gy, field) &&
        !field.isHill(gx, gy) &&
        !field.isOcean(gx, gy) &&
        !field.isSand(gx, gy) &&
        !field.isWater(gx, gy)
      ) {
        return { gx, gy };
      }
    }
  }
  throw new Error('V4 settlement did not produce a visible internal path tile');
}

describe('World Gen v4 overworld integration', () => {
  it('projects internal settlement paths into generated chunk terrain', () => {
    const seed = 101;
    const field = createTerrainField(4, seed);
    const road = findVillagePathTile(seed);
    const cx = Math.floor(road.gx / 16);
    const cy = Math.floor(road.gy / 16);
    const generated = generateChunkTerrain(cx, cy, field);
    const lx = road.gx - cx * 16;
    const ly = road.gy - cy * 16;

    expect(field.isRoad(road.gx, road.gy)).toBe(true);
    expect(generated.terrainGrid[ly][lx]).toBe(TERRAIN.ROAD);
  }, 20000);

  it('projects a planned settlement into chunk buildings and keeps it deterministic', () => {
    const seed = 101;
    const plan = new ContinentService(seed).getPlan();
    const field = createTerrainField(4, seed);
    const settlement = plan.settlements.find((candidate) => {
      if (Math.hypot(candidate.gx, candidate.gy) < 160) return false;
      const nearby = getNearbySettlements(candidate.gx, candidate.gy, field);
      return nearby.some((v) => v.name === candidate.name);
    });
    expect(settlement).toBeDefined();
    const cx = Math.floor(settlement!.gx / 16);
    const cy = Math.floor(settlement!.gy / 16);
    const first = getV0VillageBuildingsForChunk(cx, cy, field);
    const second = getV0VillageBuildingsForChunk(cx, cy, field);

    expect(first.length).toBeGreaterThan(0);
    expect(first).toEqual(second);
    expect(first.some((building) => building.id.startsWith('v4_'))).toBe(true);
  });
});
