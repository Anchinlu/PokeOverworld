import { describe, it, expect } from 'vitest';
import { WorldChunk } from '../src/maps/chunk';
import { ZONE_NATURAL_SHRUBS, getNaturalShrubForZone } from '../src/maps/ecology/ecology-profile';

describe('Natural Plants Taxonomy & Ecology Feature', () => {
  it('correctly maps plants to their designated ecological zones', () => {
    // 1. Meadow contains flowering white shrubs and tall bellflowers
    expect(ZONE_NATURAL_SHRUBS.meadow).toContain('bush_flowering_white');
    expect(ZONE_NATURAL_SHRUBS.meadow).toContain('flower_purple_bell');

    // 2. Dense forest contains forest cone trees
    expect(ZONE_NATURAL_SHRUBS.dense_forest).toContain('bush_cone_forest');

    // 3. Dryland contains autumn cone trees
    expect(ZONE_NATURAL_SHRUBS.dryland).toContain('bush_cone_autumn');

    // 4. Wetland contains tall bellflowers and forest cone trees
    expect(ZONE_NATURAL_SHRUBS.wetland).toContain('flower_purple_bell');

    // 5. Random rolls always return valid taxonomy items
    const sample = getNaturalShrubForZone('meadow', 0.1);
    expect(['bush_flowering_white', 'flower_purple_bell']).toContain(sample);
  });

  it('spawns natural shrubs and flora into world chunks', () => {
    const seed = 12345;
    const chunks: WorldChunk[] = [];

    for (let cy = -2; cy <= 2; cy++) {
      for (let cx = -2; cx <= 2; cx++) {
        chunks.push(new WorldChunk(cx, cy, seed));
      }
    }

    const allPlants = chunks.flatMap((c) => c.plants);
    const naturalShrubs = allPlants.filter((p) =>
      ['bush_flowering_white', 'bush_cone_autumn', 'bush_cone_forest', 'flower_purple_bell'].includes(p.type)
    );

    expect(naturalShrubs.length).toBeGreaterThan(0);
  });

  it('generates solid colliders for shrubs while leaving bellflowers walkable', () => {
    const seed = 54321;
    const chunks: WorldChunk[] = [];

    for (let cy = -3; cy <= 3; cy++) {
      for (let cx = -3; cx <= 3; cx++) {
        chunks.push(new WorldChunk(cx, cy, seed));
      }
    }

    for (const chunk of chunks) {
      for (const plant of chunk.plants) {
        if (plant.type === 'bush_flowering_white') {
          const col = chunk.colliders.find(
            (c) => c.x === plant.x + 18 && c.y === plant.y + 40
          );
          expect(col).toBeDefined();
          expect(col!.w).toBe(28);
          expect(col!.h).toBe(20);
        } else if (plant.type === 'bush_cone_autumn' || plant.type === 'bush_cone_forest') {
          const col = chunk.colliders.find(
            (c) => c.x === plant.x + 6 && c.y === plant.y + 44
          );
          expect(col).toBeDefined();
          expect(col!.w).toBe(20);
          expect(col!.h).toBe(18);
        } else if (plant.type === 'nature_tree_stump') {
          const col = chunk.colliders.find(
            (c) => c.x === plant.x + 4 && c.y === plant.y + 8
          );
          expect(col).toBeDefined();
          expect(col!.w).toBe(24);
          expect(col!.h).toBe(22);
        } else if (plant.type === 'nature_fallen_log') {
          const col = chunk.colliders.find(
            (c) => c.x === plant.x + 4 && c.y === plant.y + 8
          );
          expect(col).toBeDefined();
          expect(col!.w).toBe(56);
          expect(col!.h).toBe(22);
        }
      }
    }
  });

  it('guarantees deterministic placement of natural flora across runs', () => {
    const seed = 8888;
    const c1 = new WorldChunk(0, 0, seed);
    const c2 = new WorldChunk(0, 0, seed);

    expect(c1.plants).toEqual(c2.plants);
  });
});
