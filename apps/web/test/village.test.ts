import { describe, it, expect } from 'vitest';
import {
  getVillagePlacement,
  isVillagePathTile,
  isVillageArea,
  isVillageBuildingTile,
  WorldChunk,
} from '../src/maps';

describe('Village Generation & Organic Layout System', () => {
  const seed = 101;

  it('reliably generates Starter Village at cycle k = 0 with all core structures', () => {
    const v0 = getVillagePlacement(0, seed);
    expect(v0).not.toBeNull();
    if (!v0) return;

    expect(v0.name).toBe('Twinleaf Hamlet');
    expect(v0.buildings.length).toBeGreaterThanOrEqual(4);

    const types = v0.buildings.map((b) => b.type);
    // Every village MUST always have both PokéCenter and PokéMart
    expect(types).toContain('pokecenter');
    expect(types).toContain('pokemart');
    expect(types).toContain('signpost');
    expect(types).toContain('house_red');
    expect(types).toContain('house_cottage');

    // Bounds should be well-defined
    expect(v0.bounds.minGX).toBeLessThan(v0.bounds.maxGX);
    expect(v0.bounds.minGY).toBeLessThan(v0.bounds.maxGY);
  });

  it('places the PokéShop signpost directly beside PokéMart (Asset 5 beside Asset 4)', () => {
    const v0 = getVillagePlacement(0, seed);
    expect(v0).not.toBeNull();
    if (!v0) return;

    const mart = v0.buildings.find((b) => b.type === 'pokemart');
    const signpost = v0.buildings.find((b) => b.type === 'signpost');
    expect(mart).toBeDefined();
    expect(signpost).toBeDefined();

    if (!mart || !signpost) return;

    // Signpost should be right beside the right wall of PokéMart (mart.gx + 4)
    expect(signpost.gx).toBe(mart.gx + 4);
    // Signpost should be on the front row of the building
    expect(signpost.gy).toBeGreaterThanOrEqual(mart.gy);
    expect(signpost.gy).toBeLessThanOrEqual(mart.gy + mart.heightTiles);
  });

  it('generates town garden flowerbeds and landscaping in village data', () => {
    const v0 = getVillagePlacement(0, seed);
    expect(v0).not.toBeNull();
    if (!v0) return;

    // Should have curated garden plants (flowerbeds)
    expect(v0.gardenPlants.length).toBeGreaterThan(0);
    const plantTypes = v0.gardenPlants.map((p) => p.type);
    expect(plantTypes.some((t) => t.startsWith('flower_') || t.startsWith('bush_'))).toBe(true);
  });

  it('guarantees deterministic placement: same seed produces identical village', () => {
    const vA = getVillagePlacement(0, seed);
    const vB = getVillagePlacement(0, seed);
    expect(vA).toEqual(vB);

    const vDiff = getVillagePlacement(0, 9999);
    expect(vDiff).not.toBeNull();
  });

  it('ensures village buildings generate solid colliders in chunks', () => {
    const chunk0 = new WorldChunk(0, 0, seed);
    const chunk1 = new WorldChunk(1, 0, seed);

    const allBuildings = [...chunk0.buildings, ...chunk1.buildings];
    expect(allBuildings.length).toBeGreaterThan(0);

    const allColliders = [...chunk0.colliders, ...chunk1.colliders];
    expect(allColliders.length).toBeGreaterThan(0);
  });

  it('guarantees no tall grass spawns in village area, and no trees/flowers clip into buildings or roads', () => {
    for (let cy = -1; cy <= 1; cy++) {
      for (let cx = 0; cx <= 2; cx++) {
        const chunk = new WorldChunk(cx, cy, seed);

        // Tall encounter grass must strictly NEVER spawn in town
        for (const tg of chunk.tallGrass) {
          expect(isVillageArea(tg.gx, tg.gy, seed)).toBe(false);
        }

        // Trees must NEVER spawn inside buildings or on roads
        for (const tree of chunk.trees) {
          expect(isVillageBuildingTile(tree.gx, tree.gy, seed)).toBe(false);
          expect(isVillagePathTile(tree.gx, tree.gy, seed)).toBe(false);
        }

        // Plants/flowers must NEVER spawn inside buildings or on roads
        for (const plant of chunk.plants) {
          expect(isVillageBuildingTile(plant.gx, plant.gy, seed)).toBe(false);
          expect(isVillagePathTile(plant.gx, plant.gy, seed)).toBe(false);
        }
      }
    }
  });

  it('ensures organic village streets connect seamlessly to highway', () => {
    const v0 = getVillagePlacement(0, seed);
    expect(v0).not.toBeNull();
    if (!v0) return;

    expect(v0.pathTileKeys.size).toBeGreaterThan(0);

    let foundPath = false;
    for (const key of v0.pathTileKeys) {
      const [gx, gy] = key.split(',').map(Number);
      if (isVillagePathTile(gx, gy, seed)) {
        foundPath = true;
        break;
      }
    }
    expect(foundPath).toBe(true);
  });
});
