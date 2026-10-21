import { describe, expect, it } from 'vitest';
import { createTerrainField, V4Field, V4_CONFIG } from '../../src/maps/terrain-field';

describe('World Gen v4 - macro continents and archipelagos', () => {
  it('creates V4Field through the terrain factory', () => {
    const field = createTerrainField(4, 101);

    expect(field).toBeInstanceOf(V4Field);
    expect(field.version).toBe(4);
    expect(field.seed).toBe(101);
    expect(field.getSpawn()).toEqual({ gx: -7, gy: -5 });
  });

  it('keeps the starter core walkable without imposing a global radial land mask', () => {
    const field = new V4Field(101);

    for (let gy = -V4_CONFIG.START_CORE_RADIUS; gy <= V4_CONFIG.START_CORE_RADIUS; gy += 4) {
      for (let gx = -V4_CONFIG.START_CORE_RADIUS; gx <= V4_CONFIG.START_CORE_RADIUS; gx += 4) {
        if (gx * gx + gy * gy <= V4_CONFIG.START_CORE_RADIUS ** 2) {
          expect(field.isOcean(gx, gy)).toBe(false);
          expect(field.isSand(gx, gy)).toBe(false);
          expect(field.isHill(gx, gy)).toBe(false);
        }
      }
    }

    const macro = field.getMacroStats();
    expect(macro.areaCells).toBeGreaterThan(0);
    expect(macro.cellSize).toBe(32);
  });

  it('is deterministic regardless of query order', () => {
    const first = new V4Field(4242);
    const second = new V4Field(4242);
    const coordinates = [
      [-700, -420],
      [-160, 96],
      [0, 0],
      [128, -224],
      [640, 480],
    ] as const;

    for (const [gx, gy] of coordinates) {
      expect(first.isOcean(gx, gy)).toBe(second.isOcean(gx, gy));
      expect(first.isSand(gx, gy)).toBe(second.isSand(gx, gy));
      expect(first.isHill(gx, gy)).toBe(second.isHill(gx, gy));
      expect(first.isDesert(gx, gy)).toBe(second.isDesert(gx, gy));
      expect(first.isDarkLand(gx, gy)).toBe(second.isDarkLand(gx, gy));
    }

    expect(first.getMacroStats()).toEqual(second.getMacroStats());
  });

  it('produces both land and water across multiple seeds', () => {
    for (const seed of [101, 202, 999, 2026]) {
      const field = new V4Field(seed);
      let land = 0;
      let water = 0;

      for (let gy = -512; gy <= 512; gy += 64) {
        for (let gx = -768; gx <= 768; gx += 64) {
          if (field.macroPlan.isMacroLandAtWorld(gx, gy)) land++;
          else water++;
        }
      }

      expect(land).toBeGreaterThan(0);
      expect(water).toBeGreaterThan(0);
    }
  });

  it('keeps terrain queries valid at chunk boundaries', () => {
    const field = new V4Field(101);
    for (const boundary of [-32, 0, 16, 32, 64]) {
      for (let offset = -24; offset <= 24; offset += 8) {
        const left = field.isOcean(boundary - 1, offset);
        const right = field.isOcean(boundary, offset);
        expect(typeof left).toBe('boolean');
        expect(typeof right).toBe('boolean');
      }
    }
  });

  it('restores deterministic freshwater rivers and lakes in V4', () => {
    const field = new V4Field(101);
    let riverTiles = 0;
    let lakeTiles = 0;

    for (let gy = -128; gy <= 128; gy += 2) {
      for (let gx = -128; gx <= 128; gx += 2) {
        if (!field.isWater(gx, gy) || field.isOcean(gx, gy)) continue;
        if (field.isLake(gx, gy)) lakeTiles++;
        else riverTiles++;
      }
    }

    expect(riverTiles).toBeGreaterThan(0);
    expect(lakeTiles).toBeGreaterThan(0);
  }, 20000);

  it('keeps freshwater out of desert and Dark Land terrain', () => {
    const field = new V4Field(101);
    let restrictedTerrainTiles = 0;
    for (let gy = -192; gy <= 192; gy += 8) {
      for (let gx = -192; gx <= 192; gx += 8) {
        const desertOrDarkLand = field.isDesert(gx, gy) || field.isDarkLand(gx, gy);
        if (desertOrDarkLand) restrictedTerrainTiles++;

        const freshwater = field.isWater(gx, gy) && !field.isOcean(gx, gy);
        if (!freshwater) continue;
        expect(field.isDesert(gx, gy)).toBe(false);
        expect(field.isDarkLand(gx, gy)).toBe(false);
      }
    }

    expect(restrictedTerrainTiles).toBeGreaterThan(0);
  }, 20000);
});
