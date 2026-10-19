import { CHUNK_SIZE, isDarkLandTile, TILE_IDS, TILE_SIZE } from '@pokemon/game-data';
import { seededHash } from '../../maps/noise';
import type { WorldChunk } from '../../maps/chunk';
import { AssetLoader } from '../../rendering/asset-loader';
import { TILE_KEY_BY_ID } from '../../rendering/types';
import { WORLD_MAP_PALETTE, type WorldMapTerrainClass } from './world-map-palette';

const CACHE_LIMIT = 96;
const DETAIL_KEYS = ['grass_tuft_single', 'grass_white_dots', 'sand_shell', 'sand_mound'];

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

  public constructor(private readonly loader: AssetLoader) {}

  public clear(): void {
    this.cache.clear();
  }

  public getOrCreateLoadedChunkCanvas(chunk: WorldChunk): HTMLCanvasElement {
    const key = `${chunk.cx},${chunk.cy},${chunk.seed},${chunk.version}`;
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
        const gx = chunk.cx * CHUNK_SIZE + lx;
        const gy = chunk.cy * CHUNK_SIZE + ly;
        const px = lx * TILE_SIZE;
        const py = ly * TILE_SIZE;
        const tileId = chunk.tileIdGrid[ly]?.[lx] ?? TILE_IDS.grass_01;
        const terrainClass = this.getTerrainClass(tileId);

        this.drawFallbackTile(ctx, terrainClass, px, py);

        const assetKey = TILE_KEY_BY_ID[tileId];
        // Animated ocean/shore strips are intentionally represented by a
        // stable palette on the overview map; playing full strips per tile
        // would make the map noisy and expensive.
        if (assetKey && !this.isAnimatedWaterAsset(assetKey)) {
          const image = this.loader.getImage(assetKey);
          if (image && image.complete && image.naturalWidth > 0) {
            ctx.drawImage(image, px, py, TILE_SIZE, TILE_SIZE);
          }
        }

        this.drawTileDepth(ctx, terrainClass, tileId, px, py);
        this.drawNaturalDetail(ctx, terrainClass, gx, gy, chunk.seed, px, py);
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

  private getTerrainClass(tileId: number): WorldMapTerrainClass {
    if (isDarkLandTile(tileId)) return 'dark_land';
    if (tileId >= 700 && tileId <= 742) return 'water';
    if (tileId >= 400 && tileId < 500) return 'hill';
    if (tileId >= 300 && tileId < 400) return 'sand';
    if (tileId >= 200 && tileId < 300) return 'road';
    return 'grass';
  }

  private drawFallbackTile(
    ctx: CanvasRenderingContext2D,
    terrainClass: WorldMapTerrainClass,
    x: number,
    y: number
  ): void {
    const colours: Record<WorldMapTerrainClass, string> = {
      grass: WORLD_MAP_PALETTE.grassFallback,
      sand: WORLD_MAP_PALETTE.sandFallback,
      water: WORLD_MAP_PALETTE.waterDeep,
      hill: WORLD_MAP_PALETTE.hillFallback,
      road: WORLD_MAP_PALETTE.roadFallback,
      dark_land: WORLD_MAP_PALETTE.darkFallback,
    };
    ctx.fillStyle = colours[terrainClass];
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
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
      if (roll < 0.18) {
        ctx.fillStyle = WORLD_MAP_PALETTE.detailLight;
        ctx.fillRect(x + 5, y + 9, 12, 1);
        ctx.fillRect(x + 9, y + 14, 8, 1);
      }
      return;
    }

    if (terrainClass === 'grass' && roll < 0.075) {
      const key = DETAIL_KEYS[Math.floor(seededHash(gx, gy, seed + 402) * 2)];
      const image = this.loader.getImage(key);
      if (image && image.complete && image.naturalWidth > 0) {
        ctx.globalAlpha = 0.62;
        ctx.drawImage(image, x, y, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = WORLD_MAP_PALETTE.grassShadow;
        ctx.fillRect(x + 7, y + 19, 2, 2);
        ctx.fillRect(x + 19, y + 10, 1, 2);
      }
    }

    if (terrainClass === 'sand' && roll < 0.045) {
      const key = DETAIL_KEYS[2 + Math.floor(seededHash(gx, gy, seed + 403) * 2)];
      const image = this.loader.getImage(key);
      if (image && image.complete && image.naturalWidth > 0) {
        ctx.globalAlpha = 0.55;
        ctx.drawImage(image, x, y, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1;
      }
    }
  }

  private isAnimatedWaterAsset(assetKey: string): boolean {
    return assetKey === 'ocean_anim_strip' || assetKey.startsWith('shore_anim_');
  }
}
