import {
  TILE_SIZE,
  TILE_IDS,
  isBridgeTile,
  isFreshwaterTile,
} from '@pokemon/game-data';
import type { ViewportBounds } from '../core/camera';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { ChunkManager } from '../maps/chunk-manager';
import type { WorldChunk } from '../maps/chunk';
import type { AssetLoader } from './asset-loader';
import { seededHash } from '../maps/noise';
import {
  BIOME_GROUND_DECAL_RULES,
  classifyGroundTile,
  getPlantVisualSpec,
  getTreeVisualSpec,
  resolveGroundOverlayAssetKey,
} from '../maps/biome-entity-registry';
import { TILE_KEY_BY_ID, type RenderOptions } from './types';

export class GroundRenderer {
  private static readonly CHUNK_CANVAS_CACHE_LIMIT = 96;
  private loader: AssetLoader;
  private chunkCanvasCache = new Map<string, HTMLCanvasElement>();

  constructor(loader: AssetLoader) {
    this.loader = loader;
    if (typeof loader.onBackgroundBatchComplete === 'function') {
      loader.onBackgroundBatchComplete(() => {
        this.clearCache();
      });
    }
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
    if (cached) {
      // Map insertion order is used as a small LRU: recently visible chunks
      // stay cached while long-distance exploration cannot grow RAM forever.
      this.chunkCanvasCache.delete(cacheKey);
      this.chunkCanvasCache.set(cacheKey, cached);
      return cached;
    }

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
        const {
          isSand,
          isDesert,
          isDarkLand,
          isAutumn,
          isSnow,
          isRockyCliff,
          isRockyHighland,
          isRoad,
          isCliff,
          isWaterOrBridge,
          isBridge,
          isOceanOrShore,
        } = classifyGroundTile(tileId);

        if (isWaterOrBridge && options.showWater) {
          // Clear ground grass: lake/river tiles (bank + water) are drawn animated underneath
          gCtx.clearRect(px, py, TILE_SIZE, TILE_SIZE);
          if (isBridge) {
            // Bridges stay a static overlay above the animated water
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
          isAutumn ||
          isSnow ||
          isRockyHighland ||
          (isRoad && options.showRoad) ||
          (isCliff && options.showHills)
        ) {
          // Pre-draw pure rock ground for Rocky Highland cliff tiles to guarantee zero transparency leaks
          if (isRockyCliff || tileId === TILE_IDS.ground_rock_pure) {
            const rockGroundImg = this.loader.getImage('ground_rock_pure');
            if (rockGroundImg && rockGroundImg.complete) {
              gCtx.drawImage(rockGroundImg, px, py, TILE_SIZE, TILE_SIZE);
            }
          } else if (isRockyHighland && (options.showBeach ?? true)) {
            // When a Rocky Highland ground boundary tile borders beach sand, pre-draw pure sand
            // underneath instead of base grass so the outer transparent autotile fringe
            // blends seamlessly into the beach with zero meadow-green leaks.
            const touchesSand =
              Boolean(chunk.field.isSand && (
                chunk.field.isSand(gx - 1, gy) ||
                chunk.field.isSand(gx + 1, gy) ||
                chunk.field.isSand(gx, gy - 1) ||
                chunk.field.isSand(gx, gy + 1) ||
                chunk.field.isSand(gx - 1, gy - 1) ||
                chunk.field.isSand(gx + 1, gy - 1) ||
                chunk.field.isSand(gx - 1, gy + 1) ||
                chunk.field.isSand(gx + 1, gy + 1)
              ));
            if (touchesSand) {
              const sandImg = this.loader.getImage('sand_pure');
              if (sandImg && sandImg.complete) {
                gCtx.drawImage(sandImg, px, py, TILE_SIZE, TILE_SIZE);
              }
            }
          }

          const assetKey = resolveGroundOverlayAssetKey(tileId, TILE_KEY_BY_ID);

          if (assetKey) {
            const ovImg = this.loader.getImage(assetKey);
            if (ovImg && ovImg.complete) {
              gCtx.drawImage(ovImg, px, py, TILE_SIZE, TILE_SIZE);
            }
          }

          // Coastal shore corner overlays: round outer sand corners touching ocean
          if ((isSand || isDesert) && options.showBeach && options.showWater) {
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
        }
      }
    }

    // 3. PASS 2: DATA-DRIVEN BIOME GROUND DECALS (Beach, Desert, Autumn, Snow, Rocky Highland)
    // Executed after all 16x16 base ground and cliff tiles are drawn so multi-tile decals
    // are never clipped by subsequent tile iterations and never overwrite adjacent cliff walls.
    for (let ly = 0; ly < 16; ly++) {
      for (let lx = 0; lx < 16; lx++) {
        const gx = startGX + lx;
        const gy = startGY + ly;
        const px = lx * TILE_SIZE;
        const py = ly * TILE_SIZE;
        const tileId = chunk.tileIdGrid[ly][lx];

        if (chunk.field.isNearCliffEdge(gx, gy)) continue;

        for (const rule of BIOME_GROUND_DECAL_RULES) {
          if (!rule.matchesTile(tileId)) continue;
          const decorRoll = seededHash(gx, gy, chunk.seed + rule.rollSalt);
          if (rule.largeDecal && decorRoll < rule.largeDecal.threshold) {
            const minLX = Math.floor((px + rule.largeDecal.offsetX) / TILE_SIZE);
            const maxLX = Math.floor(
              (px + rule.largeDecal.offsetX + rule.largeDecal.width - 1) / TILE_SIZE
            );
            const minLY = Math.floor((py + rule.largeDecal.offsetY) / TILE_SIZE);
            const maxLY = Math.floor(
              (py + rule.largeDecal.offsetY + rule.largeDecal.height - 1) / TILE_SIZE
            );

            let footprintSafe = minLX >= 0 && maxLX < 16 && minLY >= 0 && maxLY < 16;
            if (footprintSafe) {
              for (let ty = minLY; ty <= maxLY && footprintSafe; ty++) {
                for (let tx = minLX; tx <= maxLX; tx++) {
                  const neighborTileId = chunk.tileIdGrid[ty]?.[tx];
                  if (
                    neighborTileId === undefined ||
                    !rule.matchesTile(neighborTileId) ||
                    chunk.field.isNearCliffEdge(startGX + tx, startGY + ty)
                  ) {
                    footprintSafe = false;
                    break;
                  }
                }
              }
            }

            if (footprintSafe) {
              const largeImg = this.loader.getImage(rule.largeDecal.assetKey);
              if (largeImg && largeImg.complete) {
                gCtx.drawImage(
                  largeImg,
                  px + rule.largeDecal.offsetX,
                  py + rule.largeDecal.offsetY,
                  rule.largeDecal.width,
                  rule.largeDecal.height
                );
              }
            }
          } else if (decorRoll < rule.smallDecal.threshold) {
            const assets = rule.smallDecal.assets;
            const decoIdx = Math.floor(
              seededHash(gx, gy, chunk.seed + rule.smallDecal.pickSalt) * assets.length
            );
            const decoImg = this.loader.getImage(assets[decoIdx]);
            if (decoImg && decoImg.complete) {
              gCtx.drawImage(decoImg, px, py, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }
    }

    // Bake any ground-level decals/leaf piles directly onto the ground canvas (Layer 0)
    if (chunk.plants && chunk.plants.length > 0) {
      for (const plant of chunk.plants) {
        const spec = getPlantVisualSpec(plant.type);
        if (spec.layer !== 'ground') continue;

        const pImg = this.loader.getImage(plant.type);
        if (pImg && pImg.complete) {
          const lx = plant.gx - chunk.cx * 16;
          const ly = plant.gy - chunk.cy * 16;
          const px = lx * TILE_SIZE;
          const py = ly * TILE_SIZE;
          gCtx.drawImage(
            pImg,
            px + spec.groundRenderOffsetX,
            py + spec.groundRenderOffsetY,
            spec.width,
            spec.height
          );
        }
      }
    }

    this.chunkCanvasCache.set(cacheKey, offscreen);
    while (this.chunkCanvasCache.size > GroundRenderer.CHUNK_CANVAS_CACHE_LIMIT) {
      const oldestKey = this.chunkCanvasCache.keys().next().value as string | undefined;
      if (oldestKey === undefined) break;
      this.chunkCanvasCache.delete(oldestKey);
    }
    return offscreen;
  }

  public getCacheStats(): { size: number; limit: number } {
    return {
      size: this.chunkCanvasCache.size,
      limit: GroundRenderer.CHUNK_CANVAS_CACHE_LIMIT,
    };
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

    for (const chunk of chunkManager.renderChunks) {
      for (const tree of chunk.trees) {
        const spec = getTreeVisualSpec(tree.type);

        if (
          tree.x + spec.width < bounds.minX ||
          tree.x > bounds.maxX ||
          tree.y + spec.height < bounds.minY ||
          tree.y > bounds.maxY
        ) {
          continue;
        }

        if (spec.shadow.kind === 'image') {
          const shadowImg = this.loader.getImage(spec.shadow.assetKey);
          if (shadowImg && shadowImg.complete) {
            ctx.drawImage(shadowImg, tree.x, tree.y);
          }
        } else {
          ctx.beginPath();
          ctx.ellipse(
            tree.x + spec.shadow.cx,
            tree.y + spec.shadow.cy,
            spec.shadow.rx,
            spec.shadow.ry,
            0,
            0,
            Math.PI * 2
          );
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
    const imgTGDark =
      this.loader.getImage('tall_grass_dark_strip') ?? this.loader.getImage('tall_grass_dark');
    const imgTGAutumn =
      this.loader.getImage('tall_grass_autumn_strip') ?? this.loader.getImage('tall_grass_autumn');
    const imgTGSnow =
      this.loader.getImage('tall_grass_snow_strip') ?? this.loader.getImage('tall_grass_snow');
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

        const img = (tg.isSnow ? imgTGSnow : tg.isAutumn ? imgTGAutumn : tg.isDark ? imgTGDark : imgTG) ?? imgTG;
        if (!img || !img.complete) continue;

        ctx.drawImage(img, fIdx * 32, 0, 32, 32, tg.x, grassY, 32, grassHeight);
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

    const imgOcean = this.loader.getImage('ocean_anim_strip');
    const imgShoreV = this.loader.getImage('shore_anim_vertical');
    const imgShoreCin = this.loader.getImage('shore_anim_corner_in');
    const imgShoreCout = this.loader.getImage('shore_anim_corner_out');
    const imgShoreCinFlip = this.loader.getImage('shore_anim_corner_in_flip');
    const imgShoreCoutFlip = this.loader.getImage('shore_anim_corner_out_flip');

    // 8-frame animated caustic water & shore wave cycle (280ms per frame)
    const fIdx = Math.floor((now / 280) % 8);
    const sx = fIdx * TILE_SIZE;
    // Freshwater (lake/river) strips are 4 frames at the same 280ms cadence
    const sxFresh = Math.floor((now / 280) % 4) * TILE_SIZE;
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

        // 1. Inland river / lake water (700..729, 750..763, 770..783): per-tile 4-frame strips (bank + water)
        if (isFreshwaterTile(tileId) || isBridgeTile(tileId)) {
          // Bridges (720/721) sit above plain animated water
          const key = isBridgeTile(tileId) ? 'water_pure' : TILE_KEY_BY_ID[tileId];
          const imgToUse = key ? this.loader.getImage(key) : undefined;
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

          ctx.drawImage(imgToUse, sxFresh, 0, TILE_SIZE, TILE_SIZE, px, py, TILE_SIZE, TILE_SIZE);
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

