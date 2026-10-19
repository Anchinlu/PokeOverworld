import { describe, it, expect } from 'vitest';
import { createTerrainField, type TerrainField } from '../src/maps/terrain-field';
import {
  isWaterTile,
  isHillTile,
  isRoadTile,
  isSandTile,
  isBridgeTile,
  isOceanTile,
  isNearWater,
  isNearCliffEdge,
  isValidTreePosGlobal,
  getRoadCenterX,
} from '../src/maps/terrain-rules';
import { WorldChunk } from '../src/maps/chunk';
import { ChunkManager } from '../src/maps/chunk-manager';

describe('TerrainField Interface & Abstraction Layer', () => {
  it('instantiates legacy field (version 1) via factory', () => {
    const field = createTerrainField(1, 101);
    expect(field.version).toBe(1);
    expect(field.seed).toBe(101);
  });

  it('guarantees 100% parity with legacy terrain-rules functions', () => {
    const seed = 101;
    const field = createTerrainField(1, seed);

    for (let gy = -20; gy <= 20; gy += 4) {
      for (let gx = -20; gx <= 20; gx += 4) {
        expect(field.isWater(gx, gy)).toBe(isWaterTile(gx, gy, seed));
        expect(field.isHill(gx, gy)).toBe(isHillTile(gx, gy, seed));
        expect(field.isRoad(gx, gy)).toBe(isRoadTile(gx, gy, seed));
        expect(field.isSand(gx, gy)).toBe(isSandTile(gx, gy, seed));
        expect(field.isBridge(gx, gy)).toBe(isBridgeTile(gx, gy, seed));
        expect(field.isOcean(gx, gy)).toBe(isOceanTile(gx, gy, seed));
        expect(field.isNearWater(gx, gy, 1)).toBe(isNearWater(gx, gy, seed, 1));
        expect(field.isNearCliffEdge(gx, gy)).toBe(isNearCliffEdge(gx, gy, seed));
      }
      expect(field.getRoadCenterX(gy)).toBe(getRoadCenterX(gy, seed));
    }

    // Tree positions
    for (let py = 0; py < 300; py += 50) {
      for (let px = 0; px < 300; px += 50) {
        expect(field.isValidTreePos(px, py)).toBe(isValidTreePosGlobal(px, py, seed));
      }
    }
  });

  it('allows WorldChunk to be constructed with custom TerrainField implementation', () => {
    // Custom flat grass terrain field with version 99
    const customField: TerrainField = {
      version: 99,
      seed: 42,
      isWater: () => false,
      isHill: () => false,
      isRoad: () => false,
      isSand: () => false,
      isBridge: () => false,
      isOcean: () => false,
      isNearWater: () => false,
      isNearCliffEdge: () => false,
      isValidTreePos: () => true,
      isValidPalmTreePos: () => false,
      getRoadCenterX: () => 0,
    };

    const chunk = new WorldChunk(0, 0, customField);
    expect(chunk.version).toBe(99);
    expect(chunk.seed).toBe(42);
    expect(chunk.field).toBe(customField);
    expect(chunk.terrainGrid.length).toBe(16);
    expect(chunk.tileIdGrid.length).toBe(16);
  });

  it('allows ChunkManager to operate seamlessly with TerrainField', () => {
    const field = createTerrainField(1, 202);
    const manager = new ChunkManager(field);
    expect(manager.field.version).toBe(1);
    expect(manager.currentSeed).toBe(202);

    const chunk = manager.getChunk(0, 0);
    expect(chunk.field.seed).toBe(202);
  });
});
