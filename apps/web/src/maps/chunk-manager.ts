import { CHUNK_SIZE, TILE_SIZE, TERRAIN } from '@pokemon/game-data';
import type { TerrainId } from '@pokemon/shared-types';
import { WorldChunk } from './chunk';
import type { PlantEntity, TallGrassEntity, BerryBushEntity } from './chunk';
import { rescaleWildEntityLevel } from '../wildlife/spawn/level-model';
import type { ViewportBounds } from '../core/camera';
import type { TimeBand } from '../wildlife/ports/world-query';

const CHUNK_PIXELS = CHUNK_SIZE * TILE_SIZE; // 512px
const SPAWN_RADIUS = 2; // 5x5 chunks = 25 active chunks
const CRITICAL_RADIUS = 1; // 3x3 chunks are ready before gameplay resumes
const DEFAULT_CHUNK_BUDGET = 1; // At most one heavy chunk generation per frame
const WILDLIFE_REFRESH_AFTER_MS = 30_000;

export interface ChunkUpdateOptions {
  /** Spread outer-ring generation across game frames instead of blocking once. */
  progressive?: boolean;
  /** Maximum queued chunks to generate during this update. */
  maxChunksPerUpdate?: number;
}

export interface TileData {
  cx: number;
  cy: number;
  lx: number;
  ly: number;
  terrain: TerrainId;
  tileId: number;
  plant?: PlantEntity;
  tallGrass?: TallGrassEntity;
  berryBush?: BerryBushEntity;
}

import { createTerrainField, type TerrainField } from './terrain-field';

export class ChunkManager {
  public cache = new Map<string, WorldChunk>();
  /** Chunks kept ready for rendering/collision around the player. */
  public activeChunks: WorldChunk[] = [];
  /** Only this neighborhood is allowed to run wildlife simulation. */
  public simulationChunks: WorldChunk[] = [];
  /** Chunks intersecting the current camera viewport, refreshed once per frame. */
  public renderChunks: WorldChunk[] = [];
  public currentSeed = 101;
  public field: TerrainField;
  private readonly getPlayerMaxOwnedLevel: () => number;
  private readonly getTimeBand: () => TimeBand;
  private lastPlayerMaxOwnedLevel = -1;
  private lastTimeBand: TimeBand | null = null;

  private lastChunkX: number | null = null;
  private lastChunkY: number | null = null;
  private generationQueue: Array<{ cx: number; cy: number }> = [];
  private pendingChunkKeys = new Set<string>();
  private progressiveLoading = false;
  private readonly lastSimulationAt = new Map<string, number>();

  constructor(
    seedOrField: number | TerrainField = 101,
    getPlayerMaxOwnedLevel?: () => number,
    getTimeBand?: () => TimeBand
  ) {
    this.getPlayerMaxOwnedLevel = getPlayerMaxOwnedLevel ?? (() => 5);
    this.getTimeBand = getTimeBand ?? (() => 'day');
    if (typeof seedOrField === 'number') {
      this.currentSeed = seedOrField;
      this.field = createTerrainField(1, seedOrField);
    } else {
      this.field = seedOrField;
      this.currentSeed = seedOrField.seed;
    }
  }

  public reset(seedOrField: number | TerrainField): void {
    if (typeof seedOrField === 'number') {
      this.currentSeed = seedOrField;
      this.field = createTerrainField(1, seedOrField);
    } else {
      this.field = seedOrField;
      this.currentSeed = seedOrField.seed;
    }
    this.cache.clear();
    this.activeChunks = [];
    this.simulationChunks = [];
    this.renderChunks = [];
    this.lastChunkX = null;
    this.lastChunkY = null;
    this.lastPlayerMaxOwnedLevel = -1;
    this.lastTimeBand = null;
    this.generationQueue = [];
    this.pendingChunkKeys.clear();
    this.progressiveLoading = false;
    this.lastSimulationAt.clear();
  }

  public getChunk(cx: number, cy: number): WorldChunk {
    const key = `${cx},${cy}`;
    this.pendingChunkKeys.delete(key);
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new WorldChunk(
          cx,
          cy,
          this.field,
          true,
          true,
          true,
          true,
          true,
          this.getPlayerMaxOwnedLevel(),
          this.getTimeBand
        )
      );
    }
    return this.cache.get(key)!;
  }

  /**
   * Updates the list of active chunks centered on player's position.
   * Evicts distant chunks via LRU policy when cache exceeds 48 chunks.
   */
  public update(
    playerPixelX: number,
    playerPixelY: number,
    options: ChunkUpdateOptions = {}
  ): { pChunkX: number; pChunkY: number } {
    const pChunkX = Math.floor((playerPixelX + 32) / CHUNK_PIXELS);
    const pChunkY = Math.floor((playerPixelY + 48) / CHUNK_PIXELS);
    const playerMaxOwnedLevel = this.getPlayerMaxOwnedLevel();
    const timeBand = this.getTimeBand();
    const timeBandChanged = this.lastTimeBand !== null && this.lastTimeBand !== timeBand;
    this.lastTimeBand = timeBand;

    if (playerMaxOwnedLevel !== this.lastPlayerMaxOwnedLevel) {
      this.rescaleCachedWildlife(playerMaxOwnedLevel);
      this.lastPlayerMaxOwnedLevel = playerMaxOwnedLevel;
    }

    const progressive = options.progressive ?? false;
    const maxChunksPerUpdate = Math.max(0, options.maxChunksPerUpdate ?? DEFAULT_CHUNK_BUDGET);

    // Continue filling the outer ring while the player remains in the same chunk.
    if (
      this.lastChunkX === pChunkX &&
      this.lastChunkY === pChunkY &&
      this.activeChunks.length > 0
    ) {
      if (progressive && this.progressiveLoading) {
        this.processGenerationQueue(maxChunksPerUpdate);
        this.refreshActiveChunks(pChunkX, pChunkY);
        this.refreshSimulationChunks(pChunkX, pChunkY);
      }
      this.refreshSimulationChunks(pChunkX, pChunkY);
      if (timeBandChanged) this.refreshSimulationWildlife(playerMaxOwnedLevel);
      return { pChunkX, pChunkY };
    }

    this.lastChunkX = pChunkX;
    this.lastChunkY = pChunkY;

    if (progressive) {
      this.progressiveLoading = true;
      // Keep the immediate gameplay neighborhood available for collision,
      // encounters and rendering before the next frame is presented.
      for (let dy = -CRITICAL_RADIUS; dy <= CRITICAL_RADIUS; dy++) {
        for (let dx = -CRITICAL_RADIUS; dx <= CRITICAL_RADIUS; dx++) {
          this.getChunk(pChunkX + dx, pChunkY + dy);
        }
      }
      this.enqueueMissingChunks(pChunkX, pChunkY);
      this.refreshActiveChunks(pChunkX, pChunkY);
      this.refreshSimulationChunks(pChunkX, pChunkY);
    } else {
      this.progressiveLoading = false;
      this.generationQueue = [];
      this.pendingChunkKeys.clear();

      for (let dy = -SPAWN_RADIUS; dy <= SPAWN_RADIUS; dy++) {
        for (let dx = -SPAWN_RADIUS; dx <= SPAWN_RADIUS; dx++) {
          this.getChunk(pChunkX + dx, pChunkY + dy);
        }
      }
      this.refreshActiveChunks(pChunkX, pChunkY);
      this.refreshSimulationChunks(pChunkX, pChunkY);
    }

    if (timeBandChanged) this.refreshSimulationWildlife(playerMaxOwnedLevel);

    // LRU Cache Eviction: purge chunks outside visible radius + buffer to prevent memory leaks
    if (this.cache.size > 48) {
      const maxDist = SPAWN_RADIUS + 2;
      for (const [key, chunk] of this.cache.entries()) {
        if (Math.abs(chunk.cx - pChunkX) > maxDist || Math.abs(chunk.cy - pChunkY) > maxDist) {
          this.cache.delete(key);
        }
      }
    }

    return { pChunkX, pChunkY };
  }

  public getPendingChunkCount(): number {
    return this.generationQueue.length;
  }

  private enqueueMissingChunks(centerX: number, centerY: number): void {
    this.generationQueue = [];
    this.pendingChunkKeys.clear();

    for (let dy = -SPAWN_RADIUS; dy <= SPAWN_RADIUS; dy++) {
      for (let dx = -SPAWN_RADIUS; dx <= SPAWN_RADIUS; dx++) {
        const cx = centerX + dx;
        const cy = centerY + dy;
        const key = `${cx},${cy}`;
        if (this.cache.has(key) || this.pendingChunkKeys.has(key)) continue;

        this.pendingChunkKeys.add(key);
        this.generationQueue.push({ cx, cy });
      }
    }

    // Prefer chunks nearest to the player. The critical 3x3 has already been
    // generated, so this fills the visible ring before distant corners.
    this.generationQueue.sort((a, b) => {
      const aDistance = Math.max(Math.abs(a.cx - centerX), Math.abs(a.cy - centerY));
      const bDistance = Math.max(Math.abs(b.cx - centerX), Math.abs(b.cy - centerY));
      return aDistance - bDistance;
    });
  }

  private processGenerationQueue(maxChunks: number): void {
    for (let i = 0; i < maxChunks && this.generationQueue.length > 0; i++) {
      const next = this.generationQueue.shift();
      if (!next) break;
      this.getChunk(next.cx, next.cy);
    }
  }

  private refreshActiveChunks(centerX: number, centerY: number): void {
    const active: WorldChunk[] = [];
    for (let dy = -SPAWN_RADIUS; dy <= SPAWN_RADIUS; dy++) {
      for (let dx = -SPAWN_RADIUS; dx <= SPAWN_RADIUS; dx++) {
        const chunk = this.cache.get(`${centerX + dx},${centerY + dy}`);
        if (chunk) active.push(chunk);
      }
    }
    this.activeChunks = active;
    // Keep a safe fallback for callers that render before the first camera pass.
    this.renderChunks = active;
  }

  private refreshSimulationChunks(centerX: number, centerY: number): void {
    const now = Date.now();
    const simulation: WorldChunk[] = [];

    for (let dy = -CRITICAL_RADIUS; dy <= CRITICAL_RADIUS; dy++) {
      for (let dx = -CRITICAL_RADIUS; dx <= CRITICAL_RADIUS; dx++) {
        const chunk = this.cache.get(`${centerX + dx},${centerY + dy}`);
        if (!chunk) continue;

        const key = `${chunk.cx},${chunk.cy}`;
        const previousSimulationAt = this.lastSimulationAt.get(key);
        if (
          previousSimulationAt !== undefined &&
          now - previousSimulationAt >= WILDLIFE_REFRESH_AFTER_MS
        ) {
          // Wildlife that has been asleep for a while gets a fresh deterministic
          // population when it becomes relevant again. This prevents stale,
          // far-away entities from consuming state indefinitely.
          chunk.refreshWildlife(this.getPlayerMaxOwnedLevel());
        }

        this.lastSimulationAt.set(key, now);
        simulation.push(chunk);
      }
    }

    this.simulationChunks = simulation;
  }

  private refreshSimulationWildlife(playerMaxOwnedLevel: number): void {
    for (const chunk of this.simulationChunks) {
      chunk.refreshWildlife(playerMaxOwnedLevel);
    }
  }

  /**
   * Selects only loaded chunks intersecting the camera bounds. The one-chunk
   * padding keeps overhanging trees and sprites from being clipped at edges.
   */
  public refreshRenderChunks(bounds: ViewportBounds, paddingChunks = 1): void {
    const minCx = Math.floor(bounds.minX / CHUNK_PIXELS) - paddingChunks;
    const maxCx = Math.floor(bounds.maxX / CHUNK_PIXELS) + paddingChunks;
    const minCy = Math.floor(bounds.minY / CHUNK_PIXELS) - paddingChunks;
    const maxCy = Math.floor(bounds.maxY / CHUNK_PIXELS) + paddingChunks;
    const visible: WorldChunk[] = [];

    for (const chunk of this.activeChunks) {
      if (chunk.cx >= minCx && chunk.cx <= maxCx && chunk.cy >= minCy && chunk.cy <= maxCy) {
        visible.push(chunk);
      }
    }
    this.renderChunks = visible;
  }

  private rescaleCachedWildlife(playerMaxOwnedLevel: number): void {
    for (const chunk of this.cache.values()) {
      for (const entity of chunk.wildPokemon) {
        entity.level = rescaleWildEntityLevel(
          entity,
          Math.hypot(entity.gx, entity.gy),
          playerMaxOwnedLevel
        );
      }
    }
  }

  /**
   * Retrieves tile information at global coordinates (gx, gy).
   */
  public getTileData(gx: number, gy: number): TileData {
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const chunk = this.getChunk(cx, cy);
    const localKey = ly * CHUNK_SIZE + lx;
    const plant = chunk.plantByTile.get(localKey);
    const tallGrass = chunk.tallGrassByTile.get(localKey);
    const berryBush = chunk.berryBushByTile.get(localKey);

    return {
      cx,
      cy,
      lx,
      ly,
      terrain: chunk.terrainGrid[ly][lx],
      tileId: chunk.tileIdGrid[ly][lx],
      plant,
      tallGrass,
      berryBush,
    };
  }

  /**
   * Checks whether global tile (gx, gy) is physically walkable by character feet.
   * If (fromGX, fromGY) is supplied, handles elevation differences:
   * - Flat to Hill: requires jump (isWalkable returns false for standard walking)
   * - Hill to Hill: walkable on the plateau
   * - Hill to Flat: walkable as a cliff drop
   */
  public isWalkable(gx: number, gy: number, fromGX?: number, fromGY?: number): boolean {
    const tileData = this.getTileData(gx, gy);
    // Empty voids and water bodies are impassable for feet
    if (tileData.terrain === TERRAIN.EMPTY || tileData.terrain === TERRAIN.OCEAN_WATER) {
      return false;
    }

    if (fromGX !== undefined && fromGY !== undefined) {
      const fromTile = this.getTileData(fromGX, fromGY);
      const fromHill = fromTile.terrain === TERRAIN.HILL;
      const toHill = tileData.terrain === TERRAIN.HILL;

      if (!fromHill && toHill) {
        // Flat ground to hill: blocked for standard walk (must jump with Space)
        return false;
      }
      // If fromHill && toHill: allowed on plateau
      // If fromHill && !toHill: allowed to drop down off cliff
    } else {
      // If no origin specified, default behavior: hills are impassable
      if (tileData.terrain === TERRAIN.HILL) {
        return false;
      }
    }

    // Check tree colliders in the target chunk
    const chunk = this.getChunk(tileData.cx, tileData.cy);
    const px = gx * TILE_SIZE - 16;
    const py = gy * TILE_SIZE - 32;
    const footX = px + 22;
    const footY = py + 48;
    const footW = 20;
    const footH = 14;

    for (const c of chunk.colliders) {
      if (footX < c.x + c.w && footX + footW > c.x && footY < c.y + c.h && footY + footH > c.y) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks whether global tile (gx, gy) is an elevated cliff/hill tile
   * that can be jumped onto with the Space key (not blocked by trees, ruins, or boulders).
   */
  public canJumpOntoCliff(gx: number, gy: number): boolean {
    const tileData = this.getTileData(gx, gy);
    if (tileData.terrain !== TERRAIN.HILL) {
      return false;
    }

    const chunk = this.getChunk(tileData.cx, tileData.cy);
    const px = gx * TILE_SIZE - 16;
    const py = gy * TILE_SIZE - 32;
    const footX = px + 22;
    const footY = py + 48;
    const footW = 20;
    const footH = 14;

    for (const c of chunk.colliders) {
      if (footX < c.x + c.w && footX + footW > c.x && footY < c.y + c.h && footY + footH > c.y) {
        return false;
      }
    }

    return true;
  }
}
