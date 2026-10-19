import { describe, expect, it } from 'vitest';
import { createTerrainField } from '../src/maps/terrain-field';
import { generateChunkTallGrass } from '../src/maps/chunk-objects';
import { generateChunkTerrain } from '../src/maps/chunk-terrain';

describe('Tall grass world-field continuity', () => {
  it('connects generated grass across adjacent chunk borders', () => {
    let connectedTiles = 0;

    for (let seed = 101; seed < 111 && connectedTiles === 0; seed++) {
      const field = createTerrainField(1, seed);
      for (let cy = -2; cy <= 2 && connectedTiles === 0; cy++) {
        const leftTerrain = generateChunkTerrain(0, cy, field, false, false, false, false);
        const rightTerrain = generateChunkTerrain(1, cy, field, false, false, false, false);
        const leftGrass = generateChunkTallGrass(
          0,
          cy,
          field,
          leftTerrain.terrainGrid,
          leftTerrain.tileIdGrid,
          []
        );
        const rightGrass = generateChunkTallGrass(
          1,
          cy,
          field,
          rightTerrain.terrainGrid,
          rightTerrain.tileIdGrid,
          []
        );
        const rightBorder = new Set(
          rightGrass.filter((grass) => grass.gx === 16).map((grass) => grass.gy)
        );
        connectedTiles = leftGrass.filter(
          (grass) => grass.gx === 15 && rightBorder.has(grass.gy)
        ).length;
      }
    }

    expect(connectedTiles).toBeGreaterThan(0);
  }, 15000);

  it('keeps border grass deterministic for the same world seed', () => {
    const fieldA = createTerrainField(1, 777);
    const fieldB = createTerrainField(1, 777);
    const terrainA = generateChunkTerrain(0, 0, fieldA, false, false, false, false);
    const terrainB = generateChunkTerrain(0, 0, fieldB, false, false, false, false);
    const grassA = generateChunkTallGrass(
      0,
      0,
      fieldA,
      terrainA.terrainGrid,
      terrainA.tileIdGrid,
      []
    );
    const grassB = generateChunkTallGrass(
      0,
      0,
      fieldB,
      terrainB.terrainGrid,
      terrainB.tileIdGrid,
      []
    );

    expect(grassA).toEqual(grassB);
  });
});
