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
          gCtx.fillStyle = '#aed97e';
          gCtx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Optional natural grass variant flower tufts & flora
        if (seededHash(gx, gy, chunk.seed + 1) < 0.08) {
          const varKeys = [
            'grass_variant',
            'flower_blue_bell',
            'flower_white_daisy',
            'flower_pink_white',
            'flower_scatter_daisy',
            'flower_pink_cluster',
            'flower_blue_cluster',
            'flower_dandelion',
            'plant_clover',
            'grass_white_dots',
            'grass_tuft_single',
            'grass_tuft_double',
          ];
          const varIdx = Math.floor(seededHash(gx, gy, chunk.seed + 7) * varKeys.length);
          const varImg =
            this.loader.getImage(varKeys[varIdx]) || this.loader.getImage('grass_variant');
          if (varImg && varImg.complete) {
            gCtx.drawImage(varImg, px, py, TILE_SIZE, TILE_SIZE);
          }
        }

        // 2. OVERLAY TERRAIN (Sand, Road, Cliff, Water, Bridges) RESPECTING USER TOGGLE FLAGS
        const tileId = chunk.tileIdGrid[ly][lx];

        const isSand = tileId >= 300 && tileId < 350;
        const isDesert = tileId >= 350 && tileId < 400;
        const isDarkLand = (tileId >= 440 && tileId < 460) || (tileId >= 460 && tileId < 475);
        const isRoad = tileId >= 200 && tileId < 300;
        const isCliff = tileId >= 400 && tileId < 500;
        const isWaterOrBridge = tileId >= 700 && tileId < 730;
        const isOceanOrShore = tileId >= 730 && tileId <= 742;

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
          isDesert ||
          isDarkLand ||
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

          // Coastal shore corner overlays: round outer sand corners touching ocean
          if (isSand && options.showBeach && options.showWater) {
            const isO = (x: number, y: number) => chunk.field.isOcean(x, y);
            const n = isO(gx, gy - 1);
            const s = isO(gx, gy + 1);
            const w = isO(gx - 1, gy);
            const e = isO(gx + 1, gy);

            if (n && e) {
              const trImg = this.loader.getImage('shore_corner_overlay_tr');
              if (trImg && trImg.complete) {
                gCtx.drawImage(trImg, px, py, TILE_SIZE, TILE_SIZE);
              }
            }
            if (n && w) {
              const tlImg = this.loader.getImage('shore_corner_overlay_tl');
              if (tlImg && tlImg.complete) {
                gCtx.drawImage(tlImg, px, py, TILE_SIZE, TILE_SIZE);
              }
            }
            if (s && e) {
              const brImg = this.loader.getImage('shore_corner_overlay_br');
              if (brImg && brImg.complete) {
                gCtx.drawImage(brImg, px, py, TILE_SIZE, TILE_SIZE);
              }
            }
            if (s && w) {
              const blImg = this.loader.getImage('shore_corner_overlay_bl');
              if (blImg && blImg.complete) {
                gCtx.drawImage(blImg, px, py, TILE_SIZE, TILE_SIZE);
              }
            }
          }

          // Optional natural beach decorations on sand
          if (tileId === TILE_IDS.sand_pure && seededHash(gx, gy, chunk.seed + 13) < 0.06) {
            const sandDecos = ['sand_grass', 'sand_mound', 'sand_shell'];
            const decoIdx = Math.floor(seededHash(gx, gy, chunk.seed + 17) * sandDecos.length);
            const decoImg = this.loader.getImage(sandDecos[decoIdx]);
            if (decoImg && decoImg.complete) {
              gCtx.drawImage(decoImg, px, py, TILE_SIZE, TILE_SIZE);
            }
          }

          // Optional natural desert decorations on pure desert sand (small pebbles and rocks)
          if (tileId === TILE_IDS.desert_pure && seededHash(gx, gy, chunk.seed + 47) < 0.08) {
            const desertDecos = [
              'rock_desert_small_orange',
              'rock_desert_pebbles_orange',
              'rock_desert_small_slate',
              'rock_desert_pebbles_slate',
            ];
            const decoIdx = Math.floor(seededHash(gx, gy, chunk.seed + 59) * desertDecos.length);
            const decoImg = this.loader.getImage(desertDecos[decoIdx]);
            if (decoImg && decoImg.complete) {
              gCtx.drawImage(decoImg, px, py, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    }

    this.chunkCanvasCache.set(cacheKey, offscreen);
    return offscreen;
  }

  /**
   * Renders tree and palm shadows seamlessly across chunk boundaries.
   * Draws directly to camera viewport canvas to prevent rectangular edge clipping.
   */
  public renderTreeShadows(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    const palmShadowImg = this.loader.getImage('tree_palm_shadow');

    for (const chunk of chunkManager.renderChunks) {
      for (const tree of chunk.trees) {
        const isPalm = tree.type === 'palm';
        const isDead = tree.type === 'dead_1' || tree.type === 'dead_2';
        const isCactusLarge = tree.type === 'cactus_large';
        const isBoulder = tree.type === 'desert_boulder';
        const isDarkLarge =
          tree.type === 'dark_large_1' ||
          tree.type === 'dark_large_2' ||
          tree.type === 'dark_dead';
        const isDarkForest = tree.type === 'dark_forest';
        const w = isPalm || isDarkLarge ? 128 : isDarkForest ? 96 : 64;
        const h = isPalm
          ? 200
          : isDarkLarge
          ? 128
          : isDarkForest
          ? 96
          : isCactusLarge
          ? 96
          : isDead || isBoulder
          ? 64
          : 120;

        if (
          tree.x + w < bounds.minX ||
          tree.x > bounds.maxX ||
          tree.y + h < bounds.minY ||
          tree.y > bounds.maxY
        ) {
          continue;
        }

        if (isPalm) {
          if (palmShadowImg && palmShadowImg.complete) {
            ctx.drawImage(palmShadowImg, tree.x, tree.y);
          }
        } else if (isDarkLarge) {
          ctx.beginPath();
          ctx.ellipse(tree.x + 64, tree.y + 118, 38, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (isDarkForest) {
          ctx.beginPath();
          ctx.ellipse(tree.x + 48, tree.y + 88, 28, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (isDead || isBoulder) {
          ctx.beginPath();
          ctx.ellipse(tree.x + 32, tree.y + 60, isBoulder ? 24 : 18, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (isCactusLarge) {
          ctx.beginPath();
          ctx.ellipse(tree.x + 32, tree.y + 90, 18, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(tree.x + 32, tree.y + 112, 20, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  public renderGroundTiles(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    options: RenderOptions
  ): void {
    const chunkSizePx = 16 * TILE_SIZE;

    for (const chunk of chunkManager.renderChunks) {
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

    // H2 Optimization: Pre-compute active moving entity tiles (O(1) lookup per patch)
    const movingTiles = new Set<number>();
    const tileKey = (gx: number, gy: number): number => gx * 67108864 + gy;

    if (player.isMoving) {
      movingTiles.add(tileKey(player.gx, player.gy));
      movingTiles.add(tileKey(player.targetGX, player.targetGY));
    }
    if (follower.isMoving) {
      movingTiles.add(tileKey(follower.gx, follower.gy));
      movingTiles.add(tileKey(follower.targetGX, follower.targetGY));
    }
    for (const chunk of chunkManager.renderChunks) {
      for (const wp of chunk.wildPokemon) {
        if (wp.isMoving) {
          movingTiles.add(tileKey(wp.gx, wp.gy));
          movingTiles.add(tileKey(wp.targetGX, wp.targetGY));
        }
      }
    }

    for (const chunk of chunkManager.renderChunks) {
      for (const tg of chunk.tallGrass) {
        const grassHeight = 32 * tg.heightScale;
        const grassY = tg.y + 32 - grassHeight;
        if (
          tg.x + 32 < bounds.minX ||
          tg.x > bounds.maxX ||
          grassY + grassHeight < bounds.minY ||
          grassY > bounds.maxY
        ) {
          continue;
        }

        const isMovingActive = movingTiles.has(tileKey(tg.gx, tg.gy));

        let fIdx: number;
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

        ctx.drawImage(imgTG, fIdx * 32, 0, 32, 32, tg.x, grassY, 32, grassHeight);
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

    const imgRiver = this.loader.getImage('river_anim_strip');
    const imgLake = this.loader.getImage('lake_anim_strip');
    const imgOcean = this.loader.getImage('ocean_anim_strip');
    const imgShoreV = this.loader.getImage('shore_anim_vertical');
    const imgShoreCin = this.loader.getImage('shore_anim_corner_in');
    const imgShoreCout = this.loader.getImage('shore_anim_corner_out');
    const imgShoreCinFlip = this.loader.getImage('shore_anim_corner_in_flip');
    const imgShoreCoutFlip = this.loader.getImage('shore_anim_corner_out_flip');

    // 8-frame animated caustic water & shore wave cycle (280ms per frame)
    const fIdx = Math.floor((now / 280) % 8);
    const sx = fIdx * TILE_SIZE;
    const CHUNK_PX = 16 * TILE_SIZE;

    for (const chunk of chunkManager.renderChunks) {
      const chunkPxX = chunk.cx * CHUNK_PX;
      const chunkPxY = chunk.cy * CHUNK_PX;

      // Cull the complete chunk before iterating its indexed animated cells.
      if (
        chunkPxX + CHUNK_PX < bounds.minX ||
        chunkPxX > bounds.maxX ||
        chunkPxY + CHUNK_PX < bounds.minY ||
        chunkPxY > bounds.maxY
      ) {
        continue;
      }

      // Water and shoreline cells are indexed once during chunk generation.
      for (const waterTile of chunk.waterTiles) {
        const { gx, gy, tileId } = waterTile;

        // 1. Inland river / lake water (700..729)
        if (tileId >= 700 && tileId < 730) {
          const imgToUse = waterTile.isLake && imgLake && imgLake.complete ? imgLake : imgRiver;
          if (!imgToUse || !imgToUse.complete) continue;
          const px = gx * TILE_SIZE;
          const py = gy * TILE_SIZE;

          if (
            px + TILE_SIZE < bounds.minX ||
            px > bounds.maxX ||
            py + TILE_SIZE < bounds.minY ||
            py > bounds.maxY
          ) {
            continue;
          }

          ctx.drawImage(imgToUse, sx, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
        }
        // 2. Open ocean water (730)
        else if (tileId === TILE_IDS.ocean_water && options.showBeach) {
          if (!imgOcean || !imgOcean.complete) continue;
          const px = gx * TILE_SIZE;
          const py = gy * TILE_SIZE;

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
        // 3. Shoreline crashing waves (731..742)
        else if (tileId >= 731 && tileId <= 742 && options.showBeach) {
          let shoreImg = imgShoreV;
          let rotation = 0; // default 0 for shore_v and corners

          if (tileId === TILE_IDS.shore_corner_in) {
            shoreImg = imgShoreCin;
          } else if (tileId === TILE_IDS.shore_corner_out) {
            shoreImg = imgShoreCout;
          } else if (tileId === TILE_IDS.shore_corner_in_flip) {
            shoreImg = imgShoreCinFlip ?? imgShoreCin;
          } else if (tileId === TILE_IDS.shore_corner_out_flip) {
            shoreImg = imgShoreCoutFlip ?? imgShoreCout;
          } else if (tileId === TILE_IDS.shore_corner_in_es) {
            // Sand on East & South -> rotate 180°
            shoreImg = imgShoreCin;
            rotation = Math.PI;
          } else if (tileId === TILE_IDS.shore_corner_in_en) {
            // Sand on East & North -> rotate 90°
            shoreImg = imgShoreCin;
            rotation = Math.PI / 2;
          } else if (tileId === TILE_IDS.shore_corner_out_se) {
            // Sand diagonal on South-East -> rotate 180°
            shoreImg = imgShoreCout;
            rotation = Math.PI;
          } else if (tileId === TILE_IDS.shore_corner_out_ne) {
            // Sand diagonal on North-East -> rotate 90°
            shoreImg = imgShoreCout;
            rotation = Math.PI / 2;
          } else if (tileId === TILE_IDS.shore_h) {
            // Sand on South, Ocean on North -> rotate -90° (-Math.PI / 2)
            shoreImg = imgShoreV;
            rotation = -Math.PI / 2;
          } else if (tileId === TILE_IDS.shore_h_top) {
            // Sand on North, Ocean on South -> rotate 90° (Math.PI / 2)
            shoreImg = imgShoreV;
            rotation = Math.PI / 2;
          } else if (tileId === TILE_IDS.shore_v_right) {
            // Sand on East, Ocean on West -> rotate 180° (Math.PI)
            shoreImg = imgShoreV;
            rotation = Math.PI;
          }

          if (!shoreImg || !shoreImg.complete) continue;
          const px = gx * TILE_SIZE;
          const py = gy * TILE_SIZE;

          if (
            px + TILE_SIZE < bounds.minX ||
            px > bounds.maxX ||
            py + TILE_SIZE < bounds.minY ||
            py > bounds.maxY
          ) {
            continue;
          }

          if (imgOcean && imgOcean.complete) {
            ctx.drawImage(imgOcean, sx, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
          }

          if (rotation !== 0) {
            ctx.save();
            ctx.translate(px + TILE_SIZE / 2, py + TILE_SIZE / 2);
            ctx.rotate(rotation);
            ctx.drawImage(
              shoreImg,
              sx,
              0,
              TILE_SIZE,
              TILE_SIZE,
              -TILE_SIZE / 2,
              -TILE_SIZE / 2,
              TILE_SIZE,
              TILE_SIZE
            );
            ctx.restore();
          } else {
            ctx.drawImage(shoreImg, sx, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
          }

          // Coastal shore inner corner overlays: smooth concave water corners touching sand
          if (tileId === TILE_IDS.shore_corner_in_flip) {
            const bl = this.loader.getImage('shore_inner_sand_bl');
            if (bl && bl.complete) ctx.drawImage(bl, px, py, TILE_SIZE, TILE_SIZE);
          } else if (tileId === TILE_IDS.shore_corner_in) {
            const tl = this.loader.getImage('shore_inner_sand_tl');
            if (tl && tl.complete) ctx.drawImage(tl, px, py, TILE_SIZE, TILE_SIZE);
          } else if (tileId === TILE_IDS.shore_corner_in_es) {
            const br = this.loader.getImage('shore_inner_sand_br');
            if (br && br.complete) ctx.drawImage(br, px, py, TILE_SIZE, TILE_SIZE);
          } else if (tileId === TILE_IDS.shore_corner_in_en) {
            const tr = this.loader.getImage('shore_inner_sand_tr');
            if (tr && tr.complete) ctx.drawImage(tr, px, py, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
  }
}
