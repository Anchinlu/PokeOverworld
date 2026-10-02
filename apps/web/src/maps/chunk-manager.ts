import { CHUNK_SIZE, TILE_SIZE, TERRAIN } from '@pokemon/game-data';
import type { TerrainId } from '@pokemon/shared-types';
import { WorldChunk } from './chunk';
import type { PlantEntity, TallGrassEntity, BerryBushEntity } from './chunk';

const CHUNK_PIXELS = CHUNK_SIZE * TILE_SIZE; // 512px
const SPAWN_RADIUS = 2; // 5x5 chunks = 25 active chunks

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

export class ChunkManager {
  public cache = new Map<string, WorldChunk>();
  public activeChunks: WorldChunk[] = [];
  public currentSeed = 101;

  private lastChunkX: number | null = null;
  private lastChunkY: number | null = null;

  constructor(seed = 101) {
    this.currentSeed = seed;
  }

  public reset(seed: number): void {
    this.currentSeed = seed;
    this.cache.clear();
    this.activeChunks = [];
    this.lastChunkX = null;
    this.lastChunkY = null;
  }

  public getChunk(cx: number, cy: number): WorldChunk {
    const key = `${cx},${cy}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new WorldChunk(cx, cy, this.currentSeed));
    }
    return this.cache.get(key)!;
  }

  /**
   * Updates the list of active chunks centered on player's position.
   * Evicts distant chunks via LRU policy when cache exceeds 48 chunks.
   */
  public update(playerPixelX: number, playerPixelY: number): { pChunkX: number; pChunkY: number } {
    const pChunkX = Math.floor((playerPixelX + 32) / CHUNK_PIXELS);
    const pChunkY = Math.floor((playerPixelY + 48) / CHUNK_PIXELS);

    // Skip reallocation if player stays inside the same chunk
    if (
      this.lastChunkX === pChunkX &&
      this.lastChunkY === pChunkY &&
      this.activeChunks.length > 0
    ) {
      return { pChunkX, pChunkY };
    }

    this.lastChunkX = pChunkX;
    this.lastChunkY = pChunkY;
    this.activeChunks = [];

    for (let dy = -SPAWN_RADIUS; dy <= SPAWN_RADIUS; dy++) {
      for (let dx = -SPAWN_RADIUS; dx <= SPAWN_RADIUS; dx++) {
        const cx = pChunkX + dx;
        const cy = pChunkY + dy;
        this.activeChunks.push(this.getChunk(cx, cy));
      }
    }

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

  /**
   * Retrieves tile information at global coordinates (gx, gy).
   */
  public getTileData(gx: number, gy: number): TileData {
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    const lx = ((gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    const chunk = this.getChunk(cx, cy);
    const plant = chunk.plants.find((p) => p.gx === gx && p.gy === gy);
    const tallGrass = chunk.tallGrass.find((tg) => tg.gx === gx && tg.gy === gy);
    const berryBush = chunk.berryBushes.find((b) => b.gx === gx && b.gy === gy);

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
   */
  public isWalkable(gx: number, gy: number): boolean {
    const tileData = this.getTileData(gx, gy);
    // Hills, empty voids, and water bodies are impassable
    if (
      tileData.terrain === TERRAIN.HILL ||
      tileData.terrain === TERRAIN.EMPTY ||
      tileData.terrain === TERRAIN.OCEAN_WATER
    ) {
      return false;
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
}
