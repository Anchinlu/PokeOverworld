import { describe, it, expect } from 'vitest';
import { TILE_IDS } from '@pokemon/game-data';
import { V0Field } from '../src/maps/terrain-field/v0-field';
import { V3Field } from '../src/maps/terrain-field/v3-field';
import { findGroupAnchors, placeHerdMembers } from '../src/wildlife/spawn/placement';
import { canWildEntityEnter } from '../src/wildlife/behavior/movement/grid-mover';
import type { WorldQuery } from '../src/wildlife/ports/world-query';

describe('Shore Autotiling & Wildlife Water Boundary Rules', () => {
  it('correctly autotiles all 4 inner corners and 4 outer diagonal corners', () => {
    // Test on both V0Field and V3Field
    for (const FieldClass of [V0Field, V3Field]) {
      const field = new FieldClass(101);

      // Helper to mock isSand on the field
      const originalIsSand = (field as any).isSand.bind(field);

      // 1. Dual cardinal sand contact (concave inner corners)
      // East & South sand contact -> shore_corner_in_es (739)
      (field as any).isSand = (x: number, y: number) => (x === 1 && y === 0) || (x === 0 && y === 1);
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_in_es);

      // East & North sand contact -> shore_corner_in_en (740)
      (field as any).isSand = (x: number, y: number) => (x === 1 && y === 0) || (x === 0 && y === -1);
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_in_en);

      // West & South sand contact -> shore_corner_in_flip (734)
      (field as any).isSand = (x: number, y: number) => (x === -1 && y === 0) || (x === 0 && y === 1);
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_in_flip);

      // West & North sand contact -> shore_corner_in (732)
      (field as any).isSand = (x: number, y: number) => (x === -1 && y === 0) || (x === 0 && y === -1);
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_in);

      // 2. Single cardinal sand contact (straight edges)
      (field as any).isSand = (x: number, y: number) => x === 1 && y === 0;
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_v_right);

      (field as any).isSand = (x: number, y: number) => x === -1 && y === 0;
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_v);

      (field as any).isSand = (x: number, y: number) => x === 0 && y === 1;
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_h);

      (field as any).isSand = (x: number, y: number) => x === 0 && y === -1;
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_h_top);

      // 3. Diagonal-only convex outer corners
      (field as any).isSand = (x: number, y: number) => x === 1 && y === 1; // South-East
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_out_se);

      (field as any).isSand = (x: number, y: number) => x === 1 && y === -1; // North-East
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_out_ne);

      (field as any).isSand = (x: number, y: number) => x === -1 && y === 1; // South-West
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_out_flip);

      (field as any).isSand = (x: number, y: number) => x === -1 && y === -1; // North-West
      expect(field.getOceanTileId(0, 0, true)).toBe(TILE_IDS.shore_corner_out);

      // Restore
      (field as any).isSand = originalIsSand;
    }
  });

  it('prohibits water wildlife from spawning near the shoreline/boundary', () => {
    // Map with land on West (x <= 5) and deep water on East (x > 5)
    // Shore boundary is at x = 6
    const mockWorld: WorldQuery = {
      isWalkable: (gx) => gx <= 5,
      contextAt: (gx) => {
        if (gx <= 5) return 'sand';
        if (gx === 6) return 'shore';
        return 'water_surface';
      },
      biomeAt: () => 'coast',
      difficultyAt: () => 0.1,
      timeBand: () => 'day',
      weather: () => 'clear',
    };

    const anchors = findGroupAnchors({
      cx: 0,
      cy: 0,
      world: mockWorld,
      count: 10,
      seed: 12345,
    });

    for (const a of anchors) {
      if (mockWorld.contextAt(a.gx, a.gy) === 'water_surface') {
        // Water anchors must NOT be on shore (gx !== 6) and must be at least 2 tiles away from land (gx >= 8)
        expect(a.gx).toBeGreaterThanOrEqual(8);
      }
    }

    // Placing herd members around a deep water anchor (gx = 10, gy = 10)
    const members = placeHerdMembers({
      anchor: { gx: 10, gy: 10 },
      count: 5,
      world: mockWorld,
      seed: 999,
      radius: 3,
    });

    for (const m of members) {
      // All water members must be in pure water_surface, never on shore
      expect(mockWorld.contextAt(m.gx, m.gy)).toBe('water_surface');
    }
  });

  it('considers water Pokemon on shoreline boundary as on ground (isSwimming = false)', () => {
    const mockWorld: WorldQuery = {
      isWalkable: (gx) => gx <= 5,
      contextAt: (gx) => {
        if (gx <= 5) return 'sand';
        if (gx === 6) return 'shore';
        return 'water_surface';
      },
      biomeAt: () => 'coast',
      difficultyAt: () => 0.1,
      timeBand: () => 'day',
      weather: () => 'clear',
    };

    // Water dweller can enter water_surface and shore
    expect(canWildEntityEnter(10, 5, mockWorld, undefined, true)).toBe(true); // open water
    expect(canWildEntityEnter(6, 5, mockWorld, undefined, true)).toBe(true);  // shore boundary
    expect(canWildEntityEnter(5, 5, mockWorld, undefined, true)).toBe(false); // inland sand
    expect(canWildEntityEnter(0, 0, mockWorld, undefined, true)).toBe(false); // inland ground

    // Land dweller cannot enter water_surface or shore
    expect(canWildEntityEnter(5, 5, mockWorld, undefined, false)).toBe(true); // inland sand
    expect(canWildEntityEnter(6, 5, mockWorld, undefined, false)).toBe(false); // shore
    expect(canWildEntityEnter(10, 5, mockWorld, undefined, false)).toBe(false); // open water
  });

  it('validates coastal shore corner overlays in manifest and assets on disk', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const manifestPath = path.resolve(__dirname, '../public/assets/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const cornerKeys = [
      'shore_corner_overlay_tl',
      'shore_corner_overlay_tr',
      'shore_corner_overlay_bl',
      'shore_corner_overlay_br',
      'shore_inner_sand_tl',
      'shore_inner_sand_tr',
      'shore_inner_sand_bl',
      'shore_inner_sand_br',
    ];

    for (const key of cornerKeys) {
      expect(manifest).toHaveProperty(key);
      expect(manifest[key]).toBe(`/assets/biomes/coastal/${key}.png`);
      const fullPath = path.resolve(__dirname, `../public${manifest[key]}`);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});

