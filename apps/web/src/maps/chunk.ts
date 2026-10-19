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
import { populateChunkWildlife } from '../wildlife/spawn';
import type { WildPokemonEntity } from '../wildlife/model';
import { createWorldQueryAdapter } from '../wildlife/ports/world-query-adapter';
import type { TimeBand } from '../wildlife/ports/world-query';

import { createTerrainField, type TerrainField } from './terrain-field';

export * from './chunk-terrain';
export * from './chunk-objects';
export type { WildPokemonEntity } from '../wildlife/model';
export * from './village-rules';

export interface AnimatedWaterTile {
  gx: number;
  gy: number;
  tileId: number;
  isLake: boolean;
}

export class WorldChunk implements MapChunk {
  public readonly version: number;
  public readonly size = 16 as const;
  public readonly cx: number;
  public readonly cy: number;
  public readonly seed: number;
  public readonly field: TerrainField;
  private readonly getTimeBand: () => TimeBand;

  public terrainGrid: TerrainId[][] = [];
  public tileIdGrid: number[][] = [];
  /** Precomputed animated water/shore cells; avoids rescanning 256 tiles per frame. */
  public waterTiles: AnimatedWaterTile[] = [];
  public colliders: Collider[] = [];

  public trees: TreeEntity[] = [];
  public buildings: BuildingEntity[] = [];
  public plants: PlantEntity[] = [];
  public tallGrass: TallGrassEntity[] = [];
  public berryBushes: BerryBushEntity[] = [];
  public wildPokemon: WildPokemonEntity[] = [];
  public waterFlora: WaterFloraEntity[] = [];
  public readonly plantByTile = new Map<number, PlantEntity>();
  public readonly tallGrassByTile = new Map<number, TallGrassEntity>();
  public readonly berryBushByTile = new Map<number, BerryBushEntity>();

  constructor(
    cx: number,
    cy: number,
    seedOrField: number | TerrainField = 101,
    hasRoad = true,
    hasBeach = true,
    hasHills = true,
    hasTrees = true,
    hasWater = true,
    playerMaxOwnedLevel = 5,
    getTimeBand: () => TimeBand = () => 'day'
  ) {
    this.cx = cx;
    this.cy = cy;
    if (typeof seedOrField === 'number') {
      this.seed = seedOrField;
      this.field = createTerrainField(1, seedOrField);
    } else {
      this.field = seedOrField;
      this.seed = seedOrField.seed;
    }
    this.version = this.field.version;
    this.getTimeBand = getTimeBand;

    // 1. Generate Terrain
    const { terrainGrid, tileIdGrid } = generateChunkTerrain(
      cx,
      cy,
      this.field,
      hasRoad,
      hasBeach,
      hasHills,
      hasWater
    );
    this.terrainGrid = terrainGrid;
    this.tileIdGrid = tileIdGrid;
    this.waterTiles = this.buildAnimatedWaterTiles();

    // 1.5. Generate Village Buildings and Colliders (before trees/plants)
    this.buildings = generateChunkBuildings(cx, cy, this.field, this.colliders);

    // 2. Generate Trees & Natural Colliders
    if (hasTrees) {
      this.trees = generateChunkTrees(cx, cy, this.field, this.colliders);
    }

    // 3. Generate GBA Tall Grass Patches (pure encounter patches on grass terrain)
    this.tallGrass = generateChunkTallGrass(
      cx,
      cy,
      this.field,
      this.terrainGrid,
      this.tileIdGrid,
      this.colliders
    );

    // 4. Generate Berry Bushes (Strictly no overlap with trees, other bushes, OR tall grass)
    this.berryBushes = generateChunkBerryBushes(
      cx,
      cy,
      this.field,
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
      this.field,
      this.terrainGrid,
      this.tileIdGrid,
      this.tallGrass,
      this.berryBushes,
      this.colliders
    );
    this.indexTileEntities();

    // 5.5. Generate Freshwater Flora (Water lilies & lotus pads on lakes and rivers)
    if (hasWater) {
      this.waterFlora = generateChunkWaterFlora(cx, cy, this.field);
    }

    // 6. Generate Wild Pokémon Spawns through the single Wildlife System pipeline.
    const worldQuery = createWorldQueryAdapter(
      this.field,
      this.colliders,
      this.tallGrass,
      this.getTimeBand
    );
    this.wildPokemon = populateChunkWildlife(cx, cy, worldQuery, {
      seed: this.field.seed,
      playerMaxOwnedLevel,
    });
  }

  private buildAnimatedWaterTiles(): AnimatedWaterTile[] {
    const tiles: AnimatedWaterTile[] = [];
    const startGX = this.cx * 16;
    const startGY = this.cy * 16;

    for (let ly = 0; ly < 16; ly++) {
      for (let lx = 0; lx < 16; lx++) {
        const tileId = this.tileIdGrid[ly]?.[lx];
        if (
          tileId === undefined ||
          !((tileId >= 700 && tileId < 730) || (tileId >= 730 && tileId <= 742))
        ) {
          continue;
        }

        const gx = startGX + lx;
        const gy = startGY + ly;
        tiles.push({
          gx,
          gy,
          tileId,
          isLake: tileId >= 700 && tileId < 730 && this.field.isLake(gx, gy),
        });
      }
    }

    return tiles;
  }

  private indexTileEntities(): void {
    const localKey = (gx: number, gy: number): number =>
      (gy - this.cy * 16) * 16 + (gx - this.cx * 16);

    for (const plant of this.plants) {
      this.plantByTile.set(localKey(plant.gx, plant.gy), plant);
    }
    for (const tallGrass of this.tallGrass) {
      this.tallGrassByTile.set(localKey(tallGrass.gx, tallGrass.gy), tallGrass);
    }
    for (const berryBush of this.berryBushes) {
      this.berryBushByTile.set(localKey(berryBush.gx, berryBush.gy), berryBush);
    }
  }

  /** Rebuilds only transient wildlife while preserving terrain and objects. */
  public refreshWildlife(playerMaxOwnedLevel = 5): void {
    const worldQuery = createWorldQueryAdapter(
      this.field,
      this.colliders,
      this.tallGrass,
      this.getTimeBand
    );
    this.wildPokemon = populateChunkWildlife(this.cx, this.cy, worldQuery, {
      seed: this.field.seed,
      playerMaxOwnedLevel,
    });
  }
}
