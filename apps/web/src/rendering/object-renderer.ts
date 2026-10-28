import type { ViewportBounds } from '../core/camera';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { ChunkManager } from '../maps/chunk-manager';
import {
  getPlantVisualSpec,
  getTreeVisualSpec,
} from '../maps/biome-entity-registry';
import type { AssetLoader } from './asset-loader';
import type { RenderItem } from './types';

export class ObjectRenderer {
  private loader: AssetLoader;

  constructor(loader: AssetLoader) {
    this.loader = loader;
  }

  public collectFoliage(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    now: number,
    list: RenderItem[]
  ): void {
    for (const chunk of chunkManager.renderChunks) {
      for (const plant of chunk.plants) {
        const spec = getPlantVisualSpec(plant.type);
        // Ground decals and leaf piles belong to ground layer (Layer 0), never entity layer unless solid
        if (spec.layer === 'ground') {
          continue;
        }

        if (
          plant.x + spec.width >= bounds.minX &&
          plant.x <= bounds.maxX &&
          plant.y + spec.height >= bounds.minY &&
          plant.y <= bounds.maxY
        ) {
          const img = this.loader.getImage(plant.type);
          if (img && img.complete) {
            if (!spec.animatedFrames) {
              list.push({
                ySort: plant.y + spec.ySortOffset,
                draw: (ctx) => {
                  ctx.drawImage(img, plant.x, plant.y);
                },
              });
            } else {
              const frame = Math.floor((now / 180 + plant.phase) % spec.animatedFrames);
              list.push({
                ySort: plant.y + spec.ySortOffset,
                draw: (ctx) => {
                  ctx.drawImage(
                    img,
                    frame * spec.width,
                    0,
                    spec.width,
                    spec.height,
                    plant.x,
                    plant.y,
                    spec.width,
                    spec.height
                  );
                },
              });
            }
          }
        }
      }
    }
  }

  public collectWaterFlora(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    now: number,
    list: RenderItem[]
  ): void {
    for (const chunk of chunkManager.renderChunks) {
      if (!chunk.waterFlora || chunk.waterFlora.length === 0) continue;
      for (const flora of chunk.waterFlora) {
        const isCrystal = flora.type.startsWith('crystal_');
        const h = isCrystal ? 64 : 32;
        if (
          flora.x + 32 >= bounds.minX &&
          flora.x <= bounds.maxX &&
          flora.y + h >= bounds.minY &&
          flora.y <= bounds.maxY
        ) {
          const img = this.loader.getImage(flora.type);
          if (img && img.complete) {
            // Crisp discrete aquatic bobbing on freshwater lake & river surfaces (ice crystals remain anchored)
            const bobY = isCrystal ? 0 : Math.round(Math.sin(now / 550 + flora.phase) * 1.2);
            const renderY = isCrystal ? flora.y - 32 : flora.y + bobY;
            list.push({
              ySort: isCrystal ? flora.y + 28 : flora.y + 12,
              draw: (ctx) => {
                ctx.drawImage(img, flora.x, renderY);
              },
            });
          }
        }
      }
    }
  }

  public collectBerryBushes(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    now: number,
    berryCycleSeconds: number,
    berryStageOverride: number | null,
    list: RenderItem[]
  ): void {
    const cycleMs = berryCycleSeconds * 1000;
    const animTime = now;

    for (const chunk of chunkManager.renderChunks) {
      if (!chunk.berryBushes) continue;
      for (const bush of chunk.berryBushes) {
        if (
          bush.x + 32 >= bounds.minX &&
          bush.x <= bounds.maxX &&
          bush.y + 64 >= bounds.minY &&
          bush.y <= bounds.maxY
        ) {
          const elapsedMs = (((Date.now() - bush.plantedAt) % cycleMs) + cycleMs) % cycleMs;
          const progress = elapsedMs / cycleMs;
          const stage =
            berryStageOverride !== null
              ? berryStageOverride
              : (Math.min(3, Math.floor(progress * 4)) as 0 | 1 | 2 | 3);
          const swayCol = Math.floor((animTime / 220 + bush.phase) % 4);
          const img = this.loader.getImage(`berry_${bush.type}`);

          list.push({
            ySort: bush.gy * 32 + 16,
            draw: (ctx) => {
              // Base shadow
              ctx.save();
              ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
              ctx.beginPath();
              ctx.ellipse(bush.x + 16, bush.y + 60, 11, 5, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();

              // Spritesheet frame
              if (img && img.complete) {
                ctx.drawImage(img, swayCol * 32, stage * 64, 32, 64, bush.x, bush.y, 32, 64);
              }

              // Stage 3 (Ripe): subtle sparkle glow
              if (stage === 3) {
                ctx.save();
                ctx.fillStyle = bush.color || '#38bdf8';
                ctx.shadowColor = bush.color || '#38bdf8';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(bush.x + 16, bush.y + 10, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            },
          });
        }
      }
    }
  }

  public collectBuildings(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    list: RenderItem[]
  ): void {
    const seenIds = new Set<string>();

    for (const chunk of chunkManager.renderChunks) {
      if (!chunk.buildings) continue;
      for (const b of chunk.buildings) {
        if (seenIds.has(b.id)) continue;
        seenIds.add(b.id);

        if (
          b.renderX + b.spriteWidth >= bounds.minX &&
          b.renderX <= bounds.maxX &&
          b.renderY + b.spriteHeight >= bounds.minY &&
          b.renderY <= bounds.maxY
        ) {
          const img = this.loader.getImage(b.type) || this.loader.getImage(`building_${b.type}`);
          if (img && img.complete) {
            list.push({
              ySort: b.ySort,
              draw: (ctx) => {
                ctx.drawImage(img, b.renderX, b.renderY);
              },
            });
          }
        }
      }
    }
  }

  public collectTrees(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    list: RenderItem[]
  ): void {
    for (const chunk of chunkManager.renderChunks) {
      for (const tree of chunk.trees) {
        const spec = getTreeVisualSpec(tree.type);

        if (
          tree.x + spec.width >= bounds.minX &&
          tree.x <= bounds.maxX &&
          tree.y + spec.height >= bounds.minY &&
          tree.y <= bounds.maxY
        ) {
          const img = this.loader.getImage(spec.assetKey);
          if (img && img.complete) {
            const isApricornAnim = spec.assetKey.startsWith('tree_apricorn_');
            list.push({
              ySort: tree.y + spec.ySortOffset,
              draw: (ctx) => {
                if (isApricornAnim && img.width > 300) {
                  const frameWidth = Math.floor(img.width / 16);
                  const frameHeight = img.height;
                  const frame = Math.floor((performance.now() / 85) % 16);
                  ctx.drawImage(
                    img,
                    frame * frameWidth,
                    0,
                    frameWidth,
                    frameHeight,
                    tree.x,
                    tree.y,
                    spec.width,
                    spec.height
                  );
                } else {
                  ctx.drawImage(img, tree.x, tree.y, spec.width, spec.height);
                }
              },
            });
          }
        }
      }
    }
  }

  public collectTallGrassForeground(
    chunkManager: ChunkManager,
    player: Player,
    follower: Follower,
    now: number,
    list: RenderItem[]
  ): void {
    const imgTG = this.loader.getImage('tall_grass_strip');
    const imgTGDark =
      this.loader.getImage('tall_grass_dark_strip') ?? this.loader.getImage('tall_grass_dark');
    const imgTGAutumn =
      this.loader.getImage('tall_grass_autumn_strip') ?? this.loader.getImage('tall_grass_autumn');
    const imgTGSnow =
      this.loader.getImage('tall_grass_snow_strip') ?? this.loader.getImage('tall_grass_snow');
    if (!imgTG?.complete && !imgTGDark?.complete && !imgTGAutumn?.complete && !imgTGSnow?.complete) return;

    // Index wildlife occupancy once. The old implementation scanned every
    // wild Pokémon for every tall-grass tile (O(grass * wildlife)).
    const wildOccupants = new Map<number, boolean>();
    const tileKey = (gx: number, gy: number): number => gx * 67108864 + gy;
    for (const chunk of chunkManager.renderChunks) {
      for (const wp of chunk.wildPokemon) {
        const currentKey = tileKey(wp.gx, wp.gy);
        wildOccupants.set(currentKey, (wildOccupants.get(currentKey) ?? false) || wp.isMoving);
        if (wp.isMoving) {
          wildOccupants.set(tileKey(wp.targetGX, wp.targetGY), true);
        }
      }
    }

    for (const chunk of chunkManager.renderChunks) {
      for (const tg of chunk.tallGrass) {
        const isRedHere =
          (player.gx === tg.gx && player.gy === tg.gy) ||
          (player.isMoving && player.targetGX === tg.gx && player.targetGY === tg.gy);
        const isPikaHere =
          (follower.gx === tg.gx && follower.gy === tg.gy) ||
          (follower.isMoving && follower.targetGX === tg.gx && follower.targetGY === tg.gy);

        const wildMoving = wildOccupants.get(tileKey(tg.gx, tg.gy));
        const isWildHere = wildMoving !== undefined;
        const isWildMoving = wildMoving === true;

        if (isRedHere || isPikaHere || isWildHere) {
          const tgY = tg.gy * 32 + 28;
          list.push({
            ySort: tgY,
            draw: (ctx) => {
              const isMovingAny =
                (isRedHere && player.isMoving) || (isPikaHere && follower.isMoving) || isWildMoving;

              let fIdx: number;
              if (isMovingAny) {
                fIdx = Math.floor((now / 120) % 4) + 1;
              } else {
                const wave = Math.sin(now * 0.0016 + tg.phase);
                if (wave > 0.45) {
                  fIdx = Math.min(4, Math.floor(((wave - 0.45) / 0.55) * 4) + 1);
                } else {
                  fIdx = 0;
                }
              }

              // Clip with natural serrated grass blade tips (tưa tưa lá cỏ)
              const bx = tg.x;
              const grassHeight = 32 * tg.heightScale;
              // Keep the feet anchored to the tile while allowing natural
              // height variation instead of stretching the whole field alike.
              const by = tg.y + 32 - grassHeight;

              ctx.save();
              ctx.beginPath();
              ctx.moveTo(bx, by + grassHeight * 0.53);
              ctx.lineTo(bx + 3, by + grassHeight * 0.38);
              ctx.lineTo(bx + 6, by + grassHeight * 0.5);
              ctx.lineTo(bx + 10, by + grassHeight * 0.34);
              ctx.lineTo(bx + 14, by + grassHeight * 0.5);
              ctx.lineTo(bx + 17, by + grassHeight * 0.4);
              ctx.lineTo(bx + 21, by + grassHeight * 0.53);
              ctx.lineTo(bx + 25, by + grassHeight * 0.34);
              ctx.lineTo(bx + 28, by + grassHeight * 0.47);
              ctx.lineTo(bx + 32, by + grassHeight * 0.56);
              ctx.lineTo(bx + 32, by + grassHeight);
              ctx.lineTo(bx, by + grassHeight);
              ctx.closePath();
              ctx.clip();

              const img =
                (tg.isSnow ? imgTGSnow : tg.isAutumn ? imgTGAutumn : tg.isDark ? imgTGDark : imgTG) ?? imgTG;
              if (img && img.complete) {
                ctx.drawImage(img, fIdx * 32, 0, 32, 32, bx, by, 32, grassHeight);
              }
              ctx.restore();
            },
          });
        }
      }
    }
  }
}
