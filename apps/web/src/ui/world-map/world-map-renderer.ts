import {
  CHUNK_SIZE,
  isAutumnTile,
  isDarkLandTile,
  isFreshwaterTile,
  isRockyHighlandTile,
  isSnowTile,
  TERRAIN,
  TILE_IDS,
  TILE_SIZE,
} from '@pokemon/game-data';
import { seededHash } from '../../maps/noise';
import type { WorldChunk } from '../../maps/chunk';
import { generateChunkTerrain } from '../../maps/chunk-terrain';
import type { TerrainField } from '../../maps/terrain-field';
import { WORLD_MAP_PALETTE, type WorldMapTerrainClass } from './world-map-palette';

const CACHE_LIMIT = 96;

/**
 * Renders a compact, pixel-art representation of one already-loaded terrain chunk.
 *
 * This renderer intentionally generates terrain only. It does not construct a
 * World Map never creates a WorldChunk. This is important because opening or
 * panning the map must not generate wildlife, plants, colliders or terrain for
 * regions the player has not loaded yet.
 */
export class WorldMapRenderer {
  private readonly cache = new Map<string, HTMLCanvasElement>();

  public clear(): void {
    this.cache.clear();
  }

  public getOrCreateLoadedChunkCanvas(chunk: WorldChunk): HTMLCanvasElement {
    return this.getOrCreateTerrainCanvas(
      chunk.cx,
      chunk.cy,
      chunk.seed,
      chunk.version,
      chunk.terrainGrid,
      chunk.tileIdGrid
    );
  }

  /**
   * Rebuilds only the visual terrain for a chunk the player has already
   * discovered. It does not create a WorldChunk and therefore does not spawn
   * wildlife, plants, colliders, or other gameplay state.
   */
  public getOrCreateDiscoveredChunkCanvas(
    cx: number,
    cy: number,
    field: TerrainField
  ): HTMLCanvasElement {
    const terrain = generateChunkTerrain(cx, cy, field, true, true, true, true);
    return this.getOrCreateTerrainCanvas(
      cx,
      cy,
      field.seed,
      field.version,
      terrain.terrainGrid,
      terrain.tileIdGrid
    );
  }

  private getOrCreateTerrainCanvas(
    cx: number,
    cy: number,
    seed: number,
    version: number,
    terrainGrid: number[][],
    tileIdGrid: number[][]
  ): HTMLCanvasElement {
    const key = `${cx},${cy},${seed},${version}`;
    const cached = this.cache.get(key);
    if (cached) {
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }

    const canvas = document.createElement('canvas');
    canvas.width = CHUNK_SIZE * TILE_SIZE;
    canvas.height = CHUNK_SIZE * TILE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const gx = cx * CHUNK_SIZE + lx;
        const gy = cy * CHUNK_SIZE + ly;
        const px = lx * TILE_SIZE;
        const py = ly * TILE_SIZE;
        const tileId = tileIdGrid[ly]?.[lx] ?? TILE_IDS.grass_01;
        const terrainClass = this.getTerrainClass(tileId, terrainGrid[ly]?.[lx]);

        // The overview map intentionally uses a tiny pixel-colour language,
        // not the full gameplay tile sprites. This keeps it readable and
        // avoids decoding/drawing hundreds of source images while panning.
        this.drawPixelTile(ctx, terrainClass, gx, gy, seed, px, py);
        this.drawTileDepth(ctx, terrainClass, tileId, px, py);
        this.drawNaturalDetail(ctx, terrainClass, gx, gy, seed, px, py);
      }
    }

    this.cache.set(key, canvas);
    while (this.cache.size > CACHE_LIMIT) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
    return canvas;
  }

  private getTerrainClass(tileId: number, terrainId?: number): WorldMapTerrainClass {
    // The terrain grid is authoritative. Tile-ID ranges also contain special
    // transition/decorative tiles, so classifying by range alone can turn a
    // colourful map into a mostly grey hill map.
    switch (terrainId) {
      case TERRAIN.OCEAN_WATER:
        return 'water';
      case TERRAIN.BEACH_SAND:
      case TERRAIN.DESERT:
        return 'sand';
      case TERRAIN.HILL:
        return isSnowTile(tileId)
          ? 'snow'
          : isDarkLandTile(tileId)
            ? 'dark_land'
            : isRockyHighlandTile(tileId) && !isFreshwaterTile(tileId)
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

    if (isSnowTile(tileId)) return 'snow';
    if (isAutumnTile(tileId)) return 'autumn';
    if (isDarkLandTile(tileId)) return 'dark_land';
    if (isFreshwaterTile(tileId) || (tileId >= 730 && tileId <= 742)) return 'water';
    if (isRockyHighlandTile(tileId)) return 'rocky_highland';
    if (tileId >= 400 && tileId < 500) return 'hill';
    if (tileId >= 300 && tileId < 400) return 'sand';
    if (tileId >= 200 && tileId < 300) return 'road';
    return 'grass';
  }

  private drawPixelTile(
    ctx: CanvasRenderingContext2D,
    terrainClass: WorldMapTerrainClass,
    gx: number,
    gy: number,
    seed: number,
    x: number,
    y: number
  ): void {
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
    const palette = colours[terrainClass];
    // Use coarse 3x3 world cells for colour variation. Per-tile noise makes
    // the overview map look like static when zoomed in.
    const colourCellX = Math.floor(gx / 3);
    const colourCellY = Math.floor(gy / 3);
    const baseRoll = seededHash(colourCellX, colourCellY, seed + 101);
    const base = palette[Math.floor(baseRoll * palette.length)];
    ctx.fillStyle = base;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    const pixelRoll = seededHash(colourCellX, colourCellY, seed + 102);
    const accent = palette[(Math.floor(pixelRoll * palette.length) + 1) % palette.length];
    if (terrainClass === 'water') {
      if (pixelRoll > 0.52) {
        ctx.fillStyle = accent;
        ctx.fillRect(x + 5, y + 9, 10, 2);
        if (pixelRoll > 0.76) ctx.fillRect(x + 16, y + 18, 7, 2);
      }
    } else if (terrainClass === 'hill' || terrainClass === 'rocky_highland') {
      if (pixelRoll > 0.62) {
        ctx.fillStyle = accent;
        ctx.fillRect(x + 4, y + 4, 3, 3);
      }
    } else if (terrainClass === 'sand') {
      if (pixelRoll > 0.62) {
        ctx.fillStyle = accent;
        ctx.fillRect(x + 6, y + 21, 3, 2);
      }
    } else if (terrainClass === 'road') {
      if (pixelRoll > 0.45) {
        ctx.fillStyle = accent;
        ctx.fillRect(x + 3, y + 15, 5, 2);
      }
    } else if (terrainClass === 'autumn') {
      if (pixelRoll > 0.48) {
        ctx.fillStyle = accent;
        ctx.fillRect(x + 5, y + 12, 4, 3);
      }
    }
  }

  private drawTileDepth(
    ctx: CanvasRenderingContext2D,
    terrainClass: WorldMapTerrainClass,
    tileId: number,
    x: number,
    y: number
  ): void {
    if (terrainClass === 'water') {
      if (tileId !== TILE_IDS.ocean_water && tileId !== TILE_IDS.water_pure) {
        ctx.fillStyle = WORLD_MAP_PALETTE.waterShallow;
        ctx.globalAlpha = 0.22;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1;
      }
      return;
    }

    if (terrainClass === 'hill' && tileId === TILE_IDS.cliff_pure) {
      ctx.fillStyle = WORLD_MAP_PALETTE.hillHighlight;
      ctx.globalAlpha = 0.16;
      ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, 3);
      ctx.globalAlpha = 1;
    }

    if (terrainClass === 'dark_land' && tileId === TILE_IDS.dark_cliff_pure) {
      ctx.fillStyle = '#5c4873';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, 3);
      ctx.globalAlpha = 1;
    }

    if (terrainClass === 'snow' && tileId === TILE_IDS.cliff_snow_pure) {
      ctx.fillStyle = '#a0d5e8';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, 3);
      ctx.globalAlpha = 1;
    }

    if (terrainClass === 'road' || terrainClass === 'sand') {
      ctx.fillStyle = WORLD_MAP_PALETTE.edgeShadow;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
      ctx.globalAlpha = 1;
    }
  }

  private drawNaturalDetail(
    ctx: CanvasRenderingContext2D,
    terrainClass: WorldMapTerrainClass,
    gx: number,
    gy: number,
    seed: number,
    x: number,
    y: number
  ): void {
    const roll = seededHash(gx, gy, seed + 401);
    if (terrainClass === 'water') {
      if (roll < 0.1) {
        ctx.fillStyle = WORLD_MAP_PALETTE.detailLight;
        ctx.fillRect(x + 5, y + 9, 12, 1);
        ctx.fillRect(x + 9, y + 14, 8, 1);
      }
      return;
    }

    if (terrainClass === 'grass' && roll < 0.045) {
      ctx.fillStyle = WORLD_MAP_PALETTE.grassDetail;
      ctx.fillRect(x + 7, y + 18, 2, 5);
      ctx.fillRect(x + 10, y + 20, 2, 3);
      ctx.fillRect(x + 19, y + 10, 2, 4);
    }

    if (terrainClass === 'sand' && roll < 0.035) {
      ctx.fillStyle = WORLD_MAP_PALETTE.sandDetail;
      ctx.fillRect(x + 11, y + 12, 5, 2);
      ctx.fillRect(x + 16, y + 14, 3, 2);
    }
  }
}
