import { seededHash } from '../../../maps/noise';
import {
  TERRAIN,
  isAutumnTile,
  isDarkLandTile,
  isFreshwaterTile,
  isRockyHighlandTile,
  isSnowTile,
} from '@pokemon/game-data';
import type { TerrainField } from '../../../maps/terrain-field';
import { resolveWorldBiome } from '../../../maps/ecology';
import { isVillageArea } from '../../../maps/village-rules';
import { WORLD_MAP_PALETTE, type WorldMapTerrainClass } from '../../world-map/world-map-palette';
import type { MinimapTileSample } from './minimap-types';
import { chunkKey } from './minimap-state';

export interface MinimapChunkCacheEntry {
  key: string;
  seed: number;
  version: number;
  canvas: HTMLCanvasElement | OffscreenCanvas;
}

export const MINIMAP_CHUNK_TILES = 16;
export const MINIMAP_TILE_PIXELS = 2;
export const MINIMAP_CHUNK_PIXELS = MINIMAP_CHUNK_TILES * MINIMAP_TILE_PIXELS; // 32x32 px

/**
 * Creates an offscreen canvas supporting browser and headless test environments.
 */
export function createMinimapOffscreenCanvas(
  width: number,
  height: number
): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    return c;
  }
  // Headless test mock fallback
  const mockCanvas = {
    width,
    height,
    getContext: () => ({
      fillStyle: '',
      fillRect: () => {},
      drawImage: () => {},
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
    }),
  } as unknown as HTMLCanvasElement;
  return mockCanvas;
}

/**
 * Resolves the visual terrain class for a tile on the mini-map.
 * Prioritizes loaded chunk grids when available; falls back to deterministic TerrainField.
 */
export function getMinimapTerrainClass(
  gx: number,
  gy: number,
  field: TerrainField,
  tileId?: number,
  terrainId?: number
): WorldMapTerrainClass {
  // 1. Authoritative gameplay terrainId from loaded chunk
  if (terrainId !== undefined) {
    switch (terrainId) {
      case TERRAIN.OCEAN_WATER:
        return 'water';
      case TERRAIN.BEACH_SAND:
      case TERRAIN.DESERT:
        return 'sand';
      case TERRAIN.HILL:
        return tileId && isSnowTile(tileId)
          ? 'snow'
          : tileId && isDarkLandTile(tileId)
            ? 'dark_land'
            : tileId && isRockyHighlandTile(tileId) && !isFreshwaterTile(tileId)
              ? 'rocky_highland'
              : 'hill';
      case TERRAIN.ROCKY_HIGHLAND:
        return 'rocky_highland';
      case TERRAIN.ROAD:
        return 'road';
      case TERRAIN.DARK_LAND:
        return 'dark_land';
      case TERRAIN.AUTUMN:
        return 'autumn';
      case TERRAIN.SNOW:
        return 'snow';
      case TERRAIN.GRASS:
        return 'grass';
      default:
        break;
    }
  }

  // 2. Authoritative gameplay tileId ranges
  if (tileId !== undefined) {
    if (isSnowTile(tileId)) return 'snow';
    if (isAutumnTile(tileId)) return 'autumn';
    if (isDarkLandTile(tileId)) return 'dark_land';
    if (isFreshwaterTile(tileId) || (tileId >= 730 && tileId <= 742)) return 'water';
    if (isRockyHighlandTile(tileId)) return 'rocky_highland';
    if (tileId >= 400 && tileId < 500) return 'hill';
    if (tileId >= 300 && tileId < 400) return 'sand';
    if (tileId >= 200 && tileId < 300) return 'road';
  }

  // 3. Deterministic spatial queries from TerrainField (for unloaded or deterministic chunks)
  if (field.isOcean(gx, gy)) return 'water';
  if (field.isWater(gx, gy) || field.isLake?.(gx, gy)) return 'water';
  if (field.isRoad(gx, gy) || field.isBridge?.(gx, gy)) return 'road';
  if (field.isDarkLand?.(gx, gy)) return 'dark_land';
  if (field.isAutumn?.(gx, gy)) return 'autumn';
  if (field.isSnow?.(gx, gy)) return 'snow';
  if (field.isRockyHighland?.(gx, gy)) return 'rocky_highland';
  if (field.isDesert?.(gx, gy) || field.isSand(gx, gy)) return 'sand';
  if (field.isHill(gx, gy)) return 'hill';

  return 'grass';
}

/**
 * Deterministically determines the exact hex color for a tile using WORLD_MAP_PALETTE.
 */
export function getMinimapTileColour(
  terrainClass: WorldMapTerrainClass,
  gx: number,
  gy: number,
  seed: number
): string {
  const colours: Record<WorldMapTerrainClass, readonly string[]> = {
    grass: WORLD_MAP_PALETTE.grassPixels,
    sand: WORLD_MAP_PALETTE.sandPixels,
    water: WORLD_MAP_PALETTE.waterPixels,
    hill: WORLD_MAP_PALETTE.hillPixels,
    rocky_highland: WORLD_MAP_PALETTE.rockyPixels,
    road: WORLD_MAP_PALETTE.roadPixels,
    dark_land: WORLD_MAP_PALETTE.darkPixels,
    autumn: WORLD_MAP_PALETTE.autumnPixels,
    snow: WORLD_MAP_PALETTE.snowPixels,
  };
  const palette = colours[terrainClass] ?? WORLD_MAP_PALETTE.grassPixels;
  // 3x3 coarse cells match world map renderer and eliminate static noise
  const colourCellX = Math.floor(gx / 3);
  const colourCellY = Math.floor(gy / 3);
  const baseRoll = seededHash(colourCellX, colourCellY, seed + 101);
  return palette[Math.floor(baseRoll * palette.length)];
}

/**
 * Samples tile data strictly according to MinimapTileSample contract.
 */
export function sampleMinimapTile(
  gx: number,
  gy: number,
  field: TerrainField,
  discovered: boolean,
  loaded: boolean
): MinimapTileSample {
  const biome = resolveWorldBiome(field, gx, gy);
  const isOcean = field.isOcean(gx, gy);
  const isWater = isOcean || field.isWater(gx, gy) || !!field.isLake?.(gx, gy);
  const isHill = field.isHill(gx, gy);
  const isRoad = field.isRoad(gx, gy) || field.isBridge?.(gx, gy);
  const isSettlement = isVillageArea(gx, gy, field, 0);

  return {
    gx,
    gy,
    biome,
    discovered,
    loaded,
    isOcean,
    isWater,
    isHill,
    isRoad,
    isSettlement,
  };
}

export interface ChunkReader {
  getChunk(
    cx: number,
    cy: number
  ):
    | {
        tileIdGrid: number[][];
        terrainGrid: number[][];
      }
    | undefined;
}

/**
 * Minimap cache managing rendered chunk bitmaps.
 * Guarantees zero gameplay generation or entity creation.
 */
export class MinimapCache {
  private cache = new Map<string, MinimapChunkCacheEntry>();
  private currentSeed: number = 0;
  private currentVersion: number = 5;
  private readonly maxEntries: number = 256;

  constructor(seed: number = 0, version: number = 5) {
    this.currentSeed = seed;
    this.currentVersion = version;
  }

  public setWorld(seed: number, version = 5): void {
    if (seed !== this.currentSeed || version !== this.currentVersion) {
      this.clear();
      this.currentSeed = seed;
      this.currentVersion = version;
    }
  }

  public getSeed(): number {
    return this.currentSeed;
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  public hasChunk(key: string): boolean {
    return this.cache.has(key);
  }

  public getChunk(key: string): MinimapChunkCacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Map insertion order is used for bounded LRU eviction.
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry;
  }

  /**
   * Retrieves or builds the bitmap for a chunk.
   * If the chunk is unloaded, deterministic data from TerrainField is used.
   * Never calls generateChunk() or creates any entities.
   */
  public getOrCreateChunkCanvas(
    cx: number,
    cy: number,
    seed: number,
    field: TerrainField,
    chunkReader?: ChunkReader
  ): HTMLCanvasElement | OffscreenCanvas {
    const key = chunkKey(cx, cy);
    const existing = this.getChunk(key);
    if (existing && existing.seed === seed && existing.version === this.currentVersion) {
      return existing.canvas;
    }

    const canvas = createMinimapOffscreenCanvas(MINIMAP_CHUNK_PIXELS, MINIMAP_CHUNK_PIXELS);
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;

    if (ctx) {
      ctx.imageSmoothingEnabled = false;

      // Safely inspect already-loaded chunk from memory ONLY (never generate)
      const loadedChunk = chunkReader?.getChunk(cx, cy);

      for (let ly = 0; ly < MINIMAP_CHUNK_TILES; ly++) {
        for (let lx = 0; lx < MINIMAP_CHUNK_TILES; lx++) {
          const gx = cx * MINIMAP_CHUNK_TILES + lx;
          const gy = cy * MINIMAP_CHUNK_TILES + ly;
          const tileId = loadedChunk?.tileIdGrid[ly]?.[lx];
          const terrainId = loadedChunk?.terrainGrid[ly]?.[lx];

          const terrainClass = getMinimapTerrainClass(gx, gy, field, tileId, terrainId);
          const color = getMinimapTileColour(terrainClass, gx, gy, seed);

          ctx.fillStyle = color;
          ctx.fillRect(
            lx * MINIMAP_TILE_PIXELS,
            ly * MINIMAP_TILE_PIXELS,
            MINIMAP_TILE_PIXELS,
            MINIMAP_TILE_PIXELS
          );

          // Subtle settlement footprint indicator (matches world map settlement accents)
          if (
            isVillageArea(gx, gy, field, 0) &&
            terrainClass !== 'road' &&
            terrainClass !== 'water'
          ) {
            ctx.fillStyle = WORLD_MAP_PALETTE.roadPixels[0];
            ctx.fillRect(
              lx * MINIMAP_TILE_PIXELS,
              ly * MINIMAP_TILE_PIXELS,
              MINIMAP_TILE_PIXELS,
              MINIMAP_TILE_PIXELS
            );
          }
        }
      }
    }

    const entry: MinimapChunkCacheEntry = {
      key,
      seed,
      version: this.currentVersion,
      canvas,
    };

    this.cache.set(key, entry);

    // Evict oldest entries when limit is exceeded
    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
    }

    return canvas;
  }
}
