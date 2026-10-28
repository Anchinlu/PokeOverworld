import type { MapChunk, TerrainId, Collider } from '@pokemon/shared-types';
import { isAnimatedWaterOrShoreTile, TILE_SIZE } from '@pokemon/game-data';
import { generateChunkTerrain } from './chunk-terrain';
import {
  generateChunkTrees,
  generateChunkFoliage,
  generateChunkTallGrass,
  generateChunkBerryBushes,
  generateChunkWaterFlora,
  generateChunkBuildings,
  generateChunkVillageNPCs,
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
import type { TimeBand, WeatherType } from '../wildlife/ports/world-query';
import { isVillageArea, type VillageNPCEntity } from './village-rules';
import { playerService } from '../domain/player/player-service';

import { createTerrainField, type TerrainField } from './terrain-field';

export * from './chunk-terrain';
export * from './chunk-objects';
export * from './biome-entity-registry';
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
  private readonly getWeather: () => WeatherType;

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
  public npcs: VillageNPCEntity[] = [];
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
    getTimeBand: () => TimeBand = () => 'day',
    getWeather: () => WeatherType = () => 'clear'
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
    this.getWeather = getWeather;

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

    // 1.5. Generate Village Buildings, NPCs and Colliders (before trees/plants)
    this.buildings = generateChunkBuildings(cx, cy, this.field, this.colliders);
    this.npcs = generateChunkVillageNPCs(cx, cy, this.field, this.colliders);

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
      this.getTimeBand,
      this.getWeather
    );
    this.wildPokemon = playerService.hasFlag('story_wild_spawns_suppressed')
      ? []
      : this.filterVillageWildlife(
          populateChunkWildlife(cx, cy, worldQuery, {
            seed: this.field.seed,
            playerMaxOwnedLevel,
          })
        );
  }

  private buildAnimatedWaterTiles(): AnimatedWaterTile[] {
    const tiles: AnimatedWaterTile[] = [];
    const startGX = this.cx * 16;
    const startGY = this.cy * 16;

    for (let ly = 0; ly < 16; ly++) {
      for (let lx = 0; lx < 16; lx++) {
        const tileId = this.tileIdGrid[ly]?.[lx];
        if (tileId === undefined || !isAnimatedWaterOrShoreTile(tileId)) {
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
  public refreshWildlife(
    playerMaxOwnedLevel = 5,
    excludedWildlifeIds: ReadonlySet<string> = new Set()
  ): void {
    const worldQuery = createWorldQueryAdapter(
      this.field,
      this.colliders,
      this.tallGrass,
      this.getTimeBand,
      this.getWeather
    );
    if (playerService.hasFlag('story_wild_spawns_suppressed')) {
      this.wildPokemon = [];
      return;
    }
    const previousById = new Map(
      this.wildPokemon
        .filter((entity) => entity.id)
        .map((entity) => [entity.id as string, entity] as const)
    );
    const nextWildlife = populateChunkWildlife(this.cx, this.cy, worldQuery, {
      seed: this.field.seed,
      playerMaxOwnedLevel,
    }).filter((entity) => !excludedWildlifeIds.has(entity.id ?? ''));

    // Refresh the deterministic population when time/weather or chunk LOD
    // requires it, but preserve runtime state for entities that still exist.
    // This prevents visible teleporting, animation resets and lost AI timers.
    this.wildPokemon = this.filterVillageWildlife(
      nextWildlife.map((entity) => {
        const previous = entity.id ? previousById.get(entity.id) : undefined;
        if (!previous) return entity;
        return {
          ...entity,
          gx: previous.gx,
          gy: previous.gy,
          x: previous.x,
          y: previous.y,
          dir: previous.dir,
          state: previous.state,
          isMoving: previous.isMoving,
          fromX: previous.fromX,
          fromY: previous.fromY,
          targetGX: previous.targetGX,
          targetGY: previous.targetGY,
          targetX: previous.targetX,
          targetY: previous.targetY,
          stepProgress: previous.stepProgress,
          moveSpeed: previous.moveSpeed,
          baseMoveSpeed: previous.baseMoveSpeed,
          stepsRemaining: previous.stepsRemaining,
          currentDir: previous.currentDir,
          lastMoveTime: previous.lastMoveTime,
          idleTimer: previous.idleTimer,
          isPecking: previous.isPecking,
          peckStartTime: previous.peckStartTime,
          bobY: previous.bobY,
          isJumping: previous.isJumping,
          jumpType: previous.jumpType,
          jumpY: previous.jumpY,
          frame: previous.frame,
          idleAnimTimer: previous.idleAnimTimer,
          emote: previous.emote,
          isSwimming: previous.isSwimming,
        };
      })
    );
  }

  /**
   * Villages are safe social spaces: wild Pokémon must not be generated in
   * their bounds, including herd members placed around an anchor near the
   * village edge. Keep this filter at the chunk boundary so both initial
   * generation and later wildlife refreshes follow the same rule.
   */
  private filterVillageWildlife(entities: WildPokemonEntity[]): WildPokemonEntity[] {
    return entities.filter((entity) => !isVillageArea(entity.gx, entity.gy, this.field, 0));
  }

  /** Removes wildlife resolved by the player before a chunk is reused. */
  public removeWildlifeByIds(excludedWildlifeIds: ReadonlySet<string>): void {
    if (excludedWildlifeIds.size === 0) return;
    this.wildPokemon = this.wildPokemon.filter(
      (entity) => !excludedWildlifeIds.has(entity.id ?? '')
    );
  }

  /**
   * Removes tree entities matching a predicate, along with their associated
   * tree colliders, from this chunk.
   */
  public removeTreesInArea(predicate: (t: TreeEntity) => boolean): void {
    const toRemove = this.trees.filter(predicate);
    if (toRemove.length === 0) return;
    this.trees = this.trees.filter((t) => !predicate(t));
    for (const tree of toRemove) {
      const treeCenterX = tree.gx * TILE_SIZE + TILE_SIZE / 2;
      const treeCenterY = tree.gy * TILE_SIZE + TILE_SIZE / 2;
      this.colliders = this.colliders.filter((c) => {
        if (c.type !== 'tree') return true;
        const cCenterX = c.x + c.w / 2;
        const cCenterY = c.y + c.h / 2;
        return Math.hypot(cCenterX - treeCenterX, cCenterY - treeCenterY) > 50;
      });
    }
  }
}

