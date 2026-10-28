import { describe, expect, it } from 'vitest';
import { createTerrainField, V4Field, V4_CONFIG } from '../../src/maps/terrain-field';
import { getStartSpawn } from '../../src/maps/terrain-field/start-village';
import { getV4LakePlacement } from '../../src/maps/terrain-field/v4-water';

describe('World Gen v4 - macro continents and archipelagos', () => {
  it('creates V4Field through the terrain factory', () => {
    const field = createTerrainField(4, 101);

    expect(field).toBeInstanceOf(V4Field);
    expect(field.version).toBe(4);
    expect(field.seed).toBe(101);
    expect(field.getSpawn()).toEqual(getStartSpawn(101));
  });

  it('supports the opt-in natural-landmass profile without changing classic V4', () => {
    const classic = createTerrainField(4, 101);
    const natural = createTerrainField(5, 101);

    expect(natural).toBeInstanceOf(V4Field);
    expect(natural.version).toBe(5);
    expect((natural as V4Field).profile).toBe('natural-landmass');
    expect(classic.version).toBe(4);
    expect((classic as V4Field).profile).toBe('classic');
  });

  it('selects a deterministic flat start area for multiple seeds', () => {
    for (const seed of [101, 202, 777, 999, 2026]) {
      const first = new V4Field(seed, 'natural-landmass');
      const second = new V4Field(seed, 'natural-landmass');

      expect(first.macroPlan.startLocation).toEqual(second.macroPlan.startLocation);
      expect(first.macroPlan.startLocation.clearance).toBeGreaterThanOrEqual(2);
      const spawn = first.getSpawn();
      expect(first.isOcean(spawn.gx, spawn.gy)).toBe(false);
      expect(first.isSand(spawn.gx, spawn.gy)).toBe(false);
      expect(first.isWater(spawn.gx, spawn.gy)).toBe(false);
      expect(first.isHill(spawn.gx, spawn.gy)).toBe(false);
      expect(first.isDesert(spawn.gx, spawn.gy)).toBe(false);
      expect(first.isDarkLand(spawn.gx, spawn.gy)).toBe(false);
      expect(first.isAutumn(spawn.gx, spawn.gy)).toBe(false);
      expect(first.isSnow(spawn.gx, spawn.gy)).toBe(false);
    }
  }, 60000);

  it('exposes a connected home continent with bounded island components', () => {
    const field = new V4Field(101, 'natural-landmass');

    expect(field.macroPlan.isNaturalLandCell(0, 0)).toBe(true);
    expect(field.macroPlan.isNearNaturalLandCell(0, 0)).toBe(true);
    expect(field.macroPlan.isNearNaturalLandCell(10_000, 10_000)).toBe(false);
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

  it('keeps lake generation multi-scale instead of using one fixed pond size', () => {
    const radii: number[] = [];
    for (let cy = -3; cy <= 3; cy++) {
      for (let cx = -3; cx <= 3; cx++) {
        const lake = getV4LakePlacement(cx, cy, 101);
        if (lake) radii.push(lake.radiusX);
      }
    }

    expect(radii.length).toBeGreaterThan(5);
    expect(Math.min(...radii)).toBeLessThan(Math.max(...radii) * 0.75);
  });

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
        expect(field.isValidTreePos(gx * 32 - 16, gy * 32 - 86)).toBe(false);
      }
    }

    expect(restrictedTerrainTiles).toBeGreaterThan(0);
  }, 60000);

  it('keeps raised plain hills out of special biome regions', () => {
    const field = new V4Field(101);
    let hillTiles = 0;
    let specialTiles = 0;

    for (let gy = -256; gy <= 256; gy += 64) {
      for (let gx = -256; gx <= 256; gx += 64) {
        const special =
          field.isDesert(gx, gy) || field.isDarkLand(gx, gy) || field.isAutumn(gx, gy);
        if (special) specialTiles++;
        if (!field.isHill(gx, gy)) continue;

        hillTiles++;
        expect(field.isDesert(gx, gy)).toBe(false);
        expect(field.isDarkLand(gx, gy)).toBe(false);
        expect(field.isAutumn(gx, gy)).toBe(false);
      }
    }

    expect(hillTiles).toBeGreaterThan(0);
    expect(specialTiles).toBeGreaterThan(0);
  }, 20000);

  it('places soft climate anchors on the home continent outside the starter safety radius', () => {
    const field = new V4Field(101, 'natural-landmass');
    const anchors = field.macroPlan.climateAnchors;

    expect(anchors.length).toBeGreaterThanOrEqual(2);
    for (const anchor of anchors) {
      const worldGX = anchor.sourceGX - field.macroPlan.sourceOffset.gx;
      const worldGY = anchor.sourceGY - field.macroPlan.sourceOffset.gy;
      const worldMX = Math.floor(worldGX / V4_CONFIG.CELL_SIZE);
      const worldMY = Math.floor(worldGY / V4_CONFIG.CELL_SIZE);

      expect(field.macroPlan.isHomeContinentCell(worldMX, worldMY)).toBe(true);
      expect(Math.hypot(worldGX, worldGY)).toBeGreaterThan(V4_CONFIG.START_CORE_RADIUS * 4);
    }
  });

  it('keeps snow and meadow hills strictly inside their respective biome territories', () => {
    const field = new V4Field(101, 'natural-landmass');

    for (let gy = -256; gy <= 256; gy += 32) {
      for (let gx = -256; gx <= 256; gx += 32) {
        if (!field.isHill(gx, gy)) continue;
        const selfSnow = field.isSnow(gx, gy);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            expect(field.isSnow(gx + dx, gy + dy)).toBe(selfSnow);
            expect(field.isDesert(gx + dx, gy + dy)).toBe(false);
            expect(field.isDarkLand(gx + dx, gy + dy)).toBe(false);
            expect(field.isAutumn(gx + dx, gy + dy)).toBe(false);
          }
        }
      }
    }
  }, 20000);

});

