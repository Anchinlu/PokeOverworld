import { TILE_SIZE, TILE_IDS } from '@pokemon/game-data';
import type { ViewportBounds } from '../core/camera';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { ChunkManager } from '../maps/chunk-manager';
import type { WorldChunk } from '../maps/chunk';
import type { AssetLoader } from './asset-loader';
import { seededHash } from '../maps/noise';
import { TILE_KEY_BY_ID, type RenderOptions } from './types';

export class GroundRenderer {
  private loader: AssetLoader;
  private chunkCanvasCache = new Map<string, HTMLCanvasElement>();

  constructor(loader: AssetLoader) {
    this.loader = loader;
  }

  public clearCache(): void {
    this.chunkCanvasCache.clear();
  }

  public getOrCreateChunkGroundCanvas(
    chunk: WorldChunk,
    options: RenderOptions
  ): HTMLCanvasElement {
    const cacheKey = `${chunk.cx},${chunk.cy},${chunk.seed},${options.showHills},${options.showRoad},${options.showBeach},${options.showWater}`;
    const cached = this.chunkCanvasCache.get(cacheKey);
    if (cached) return cached;

    const offscreen = document.createElement('canvas');
    offscreen.width = 16 * TILE_SIZE; // 512px
    offscreen.height = 16 * TILE_SIZE;
    const gCtx = offscreen.getContext('2d')!;

    const startGX = chunk.cx * 16;
    const startGY = chunk.cy * 16;

    for (let ly = 0; ly < 16; ly++) {
      for (let lx = 0; lx < 16; lx++) {
        const gx = startGX + lx;
        const gy = startGY + ly;
        const px = lx * TILE_SIZE;
        const py = ly * TILE_SIZE;

        // 1. ALWAYS DRAW BASE 2x2 SEAMLESS GRASS FIRST
        const grassIdx = (((gy % 2) + 2) % 2) * 2 + (((gx % 2) + 2) % 2) + 1;
        const grassImg = this.loader.getImage(`grass_${grassIdx}`);
        if (grassImg && grassImg.complete) {
          gCtx.drawImage(grassImg, px, py, TILE_SIZE, TILE_SIZE);
        } else {
          gCtx.fillStyle = '#5c9e31';
          gCtx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Optional natural grass variant flower tufts
        if (seededHash(gx, gy, chunk.seed + 1) < 0.08) {
          const varImg = this.loader.getImage('grass_variant');
          if (varImg && varImg.complete) {
            gCtx.drawImage(varImg, px, py, TILE_SIZE, TILE_SIZE);
          }
        }

        // 2. OVERLAY TERRAIN (Sand, Road, Cliff, Water, Bridges) RESPECTING USER TOGGLE FLAGS
        const tileId = chunk.tileIdGrid[ly][lx];

        const isSand = tileId >= 300 && tileId < 400;
        const isRoad = tileId >= 200 && tileId < 300;
        const isCliff = tileId >= 400 && tileId < 500;
        const isWaterOrBridge = tileId >= 700 && tileId < 730;
        const isOceanOrShore = tileId >= 730 && tileId <= 735;

        if (isWaterOrBridge && options.showWater) {
          // Clear ground grass so live animated caustic water waves ripple underneath
          gCtx.clearRect(px, py, TILE_SIZE, TILE_SIZE);
          if (tileId !== TILE_IDS.water_pure) {
            const assetKey = TILE_KEY_BY_ID[tileId];
            if (assetKey) {
              const ovImg = this.loader.getImage(assetKey);
              if (ovImg && ovImg.complete) {
                gCtx.drawImage(ovImg, px, py, TILE_SIZE, TILE_SIZE);
              }
            }
          }
        } else if (isOceanOrShore && options.showBeach && options.showWater) {
          // Clear ground grass so live animated ocean water and crashing waves ripple in real-time
          gCtx.clearRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (
          (isSand && options.showBeach) ||
          (isRoad && options.showRoad) ||
          (isCliff && options.showHills)
        ) {
          const assetKey = TILE_KEY_BY_ID[tileId];
          if (assetKey) {
            const ovImg = this.loader.getImage(assetKey);
            if (ovImg && ovImg.complete) {
              gCtx.drawImage(ovImg, px, py, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    }

    // 3. PRE-BAKE TREE SHADOWS INTO CHUNK CANVAS
    if (options.showTrees) {
      gCtx.save();
      gCtx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (const tree of chunk.trees) {
        const bx = tree.x - startGX * TILE_SIZE + 32;
        const by = tree.y - startGY * TILE_SIZE + 112;
        gCtx.beginPath();
        gCtx.ellipse(bx, by, 20, 8, 0, 0, Math.PI * 2);
        gCtx.fill();
      }
      gCtx.restore();
    }

    this.chunkCanvasCache.set(cacheKey, offscreen);
    return offscreen;
  }

  public renderGroundTiles(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    options: RenderOptions
  ): void {
    const chunkSizePx = 16 * TILE_SIZE;

    for (const chunk of chunkManager.activeChunks) {
      const chunkPixelX = chunk.cx * chunkSizePx;
      const chunkPixelY = chunk.cy * chunkSizePx;

      if (
        chunkPixelX + chunkSizePx < bounds.minX ||
        chunkPixelX > bounds.maxX ||
        chunkPixelY + chunkSizePx < bounds.minY ||
        chunkPixelY > bounds.maxY
      ) {
        continue;
      }

      const groundCanvas = this.getOrCreateChunkGroundCanvas(chunk, options);
      ctx.drawImage(groundCanvas, chunkPixelX, chunkPixelY);
    }
  }

  public renderTallGrassPatches(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    player: Player,
    follower: Follower,
    now: number
  ): void {
    const imgTG = this.loader.getImage('tall_grass_strip');
    if (!imgTG || !imgTG.complete) return;

    for (const chunk of chunkManager.activeChunks) {
      for (const tg of chunk.tallGrass) {
        if (
          tg.x + 32 < bounds.minX ||
          tg.x > bounds.maxX ||
          tg.y + 32 < bounds.minY ||
          tg.y > bounds.maxY
        ) {
          continue;
        }

        const isRedMovingHere =
          ((player.gx === tg.gx && player.gy === tg.gy) ||
            (player.isMoving && player.targetGX === tg.gx && player.targetGY === tg.gy)) &&
          player.isMoving;
        const isPikaMovingHere =
          ((follower.gx === tg.gx && follower.gy === tg.gy) ||
            (follower.isMoving && follower.targetGX === tg.gx && follower.targetGY === tg.gy)) &&
          follower.isMoving;

        let isWildMovingHere = false;
        for (const wChunk of chunkManager.activeChunks) {
          for (const wp of wChunk.wildPokemon) {
            if (
              wp.isMoving &&
              ((wp.gx === tg.gx && wp.gy === tg.gy) ||
                (wp.targetGX === tg.gx && wp.targetGY === tg.gy))
            ) {
              isWildMovingHere = true;
              break;
            }
          }
          if (isWildMovingHere) break;
        }

        const isMovingActive = isRedMovingHere || isPikaMovingHere || isWildMovingHere;

        let fIdx = 0;
        if (isMovingActive) {
          fIdx = Math.floor((now / 120) % 4) + 1;
        } else {
          const wave = Math.sin(now * 0.0016 + tg.phase);
          if (wave > 0.45) {
            fIdx = Math.min(4, Math.floor(((wave - 0.45) / 0.55) * 4) + 1);
          } else {
            fIdx = 0;
          }
        }

        ctx.drawImage(imgTG, fIdx * 32, 0, 32, 32, tg.x, tg.y, 32, 32);
      }
    }
  }

  public renderWaterTiles(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    now: number,
    options: RenderOptions
  ): void {
    if (!options.showWater) return;

    const imgWater = this.loader.getImage('water_anim_strip');
    const imgOcean = this.loader.getImage('ocean_anim_strip');
    const imgShoreV = this.loader.getImage('shore_anim_vertical');
    const imgShoreCin = this.loader.getImage('shore_anim_corner_in');
    const imgShoreCout = this.loader.getImage('shore_anim_corner_out');
    const imgShoreCinFlip = this.loader.getImage('shore_anim_corner_in_flip');
    const imgShoreCoutFlip = this.loader.getImage('shore_anim_corner_out_flip');

    // 8-frame animated caustic water & shore wave cycle (280ms per frame)
    const fIdx = Math.floor((now / 280) % 8);
    const sx = fIdx * TILE_SIZE;

    for (const chunk of chunkManager.activeChunks) {
      const startGX = chunk.cx * 16;
      const startGY = chunk.cy * 16;

      for (let ly = 0; ly < 16; ly++) {
        for (let lx = 0; lx < 16; lx++) {
          const tileId = chunk.tileIdGrid[ly][lx];

          // 1. Inland river / lake water (700..729)
          if (tileId >= 700 && tileId < 730) {
            if (!imgWater || !imgWater.complete) continue;
            const px = (startGX + lx) * TILE_SIZE;
            const py = (startGY + ly) * TILE_SIZE;

            if (
              px + TILE_SIZE < bounds.minX ||
              px > bounds.maxX ||
              py + TILE_SIZE < bounds.minY ||
              py > bounds.maxY
            ) {
              continue;
            }

            ctx.drawImage(imgWater, sx, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
          }
          // 2. Open ocean water (730)
          else if (tileId === TILE_IDS.ocean_water && options.showBeach) {
            if (!imgOcean || !imgOcean.complete) continue;
            const px = (startGX + lx) * TILE_SIZE;
            const py = (startGY + ly) * TILE_SIZE;

            if (
              px + TILE_SIZE < bounds.minX ||
              px > bounds.maxX ||
              py + TILE_SIZE < bounds.minY ||
              py > bounds.maxY
            ) {
              continue;
            }

            ctx.drawImage(imgOcean, sx, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
          }
          // 3. Shoreline crashing waves (731..735)
          else if (tileId >= 731 && tileId <= 735 && options.showBeach) {
            let shoreImg = imgShoreV;
            if (tileId === TILE_IDS.shore_corner_in) {
              shoreImg = imgShoreCin;
            } else if (tileId === TILE_IDS.shore_corner_out) {
              shoreImg = imgShoreCout;
            } else if (tileId === TILE_IDS.shore_corner_in_flip) {
              shoreImg = imgShoreCinFlip ?? imgShoreCin;
            } else if (tileId === TILE_IDS.shore_corner_out_flip) {
              shoreImg = imgShoreCoutFlip ?? imgShoreCout;
            }

            if (!shoreImg || !shoreImg.complete) continue;
            const px = (startGX + lx) * TILE_SIZE;
            const py = (startGY + ly) * TILE_SIZE;

            if (
              px + TILE_SIZE < bounds.minX ||
              px > bounds.maxX ||
              py + TILE_SIZE < bounds.minY ||
              py > bounds.maxY
            ) {
              continue;
            }

            ctx.drawImage(shoreImg, sx, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }
}
