import type { MapChunk, TerrainId, Collider } from '@pokemon/shared-types';
import { generateChunkTerrain } from './chunk-terrain';
import {
  generateChunkTrees,
  generateChunkFoliage,
  generateChunkTallGrass,
  generateChunkBerryBushes,
  generateChunkWaterFlora,
  generateChunkBuildings,
  type TreeEntity,
  type PlantEntity,
  type TallGrassEntity,
  type BerryBushEntity,
  type WaterFloraEntity,
  type BuildingEntity,
} from './chunk-objects';
import { generateChunkWildPokemon, type WildPokemonEntity } from './chunk-encounters';

export * from './chunk-terrain';
export * from './chunk-objects';
export * from './chunk-encounters';
export * from './village-rules';

export class WorldChunk implements MapChunk {
  public readonly version = 1;
  public readonly size = 16 as const;
  public readonly cx: number;
  public readonly cy: number;
  public readonly seed: number;

  public terrainGrid: TerrainId[][] = [];
  public tileIdGrid: number[][] = [];
  public colliders: Collider[] = [];

  public trees: TreeEntity[] = [];
  public buildings: BuildingEntity[] = [];
  public plants: PlantEntity[] = [];
  public tallGrass: TallGrassEntity[] = [];
  public berryBushes: BerryBushEntity[] = [];
  public wildPokemon: WildPokemonEntity[] = [];
  public waterFlora: WaterFloraEntity[] = [];

  constructor(
    cx: number,
    cy: number,
    seed: number,
    hasRoad = true,
    hasBeach = true,
    hasHills = true,
    hasTrees = true,
    hasWater = true
  ) {
    this.cx = cx;
    this.cy = cy;
    this.seed = seed;

    // 1. Generate Terrain
    const { terrainGrid, tileIdGrid } = generateChunkTerrain(
      cx,
      cy,
      seed,
      hasRoad,
      hasBeach,
      hasHills,
      hasWater
    );
    this.terrainGrid = terrainGrid;
    this.tileIdGrid = tileIdGrid;

    // 1.5. Generate Village Buildings and Colliders (before trees/plants)
    this.buildings = generateChunkBuildings(cx, cy, seed, this.colliders);

    // 2. Generate Trees & Natural Colliders
    if (hasTrees) {
      this.trees = generateChunkTrees(cx, cy, seed, this.colliders);
    }

    // 3. Generate GBA Tall Grass Patches (pure encounter patches on grass terrain)
    this.tallGrass = generateChunkTallGrass(
      cx,
      cy,
      seed,
      this.terrainGrid,
      this.tileIdGrid,
      this.colliders
    );

    // 4. Generate Berry Bushes (Strictly no overlap with trees, other bushes, OR tall grass)
    this.berryBushes = generateChunkBerryBushes(
      cx,
      cy,
      seed,
      this.terrainGrid,
      this.tileIdGrid,
      this.tallGrass,
      this.trees,
      this.colliders
    );

    // 5. Generate Foliage (Flowers & Sprouts: strictly no overlap with tall grass, berry bushes, trees, or other plants)
    this.plants = generateChunkFoliage(
      cx,
      cy,
      seed,
      this.terrainGrid,
      this.tileIdGrid,
      this.tallGrass,
      this.berryBushes,
      this.colliders
    );

    // 5.5. Generate Freshwater Flora (Water lilies & lotus pads on lakes and rivers)
    if (hasWater) {
      this.waterFlora = generateChunkWaterFlora(cx, cy, seed);
    }

    // 6. Generate Wild Pokémon Spawns
    this.wildPokemon = generateChunkWildPokemon(
      cx,
      cy,
      seed,
      this.terrainGrid,
      this.colliders,
      this.tallGrass,
      this.trees
    );
  }
}
