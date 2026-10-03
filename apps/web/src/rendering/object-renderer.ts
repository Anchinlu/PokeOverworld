import type { ViewportBounds } from '../core/camera';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { ChunkManager } from '../maps/chunk-manager';
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
    for (const chunk of chunkManager.activeChunks) {
      for (const plant of chunk.plants) {
        const isLog = plant.type === 'nature_fallen_log';
        const isWhiteBush = plant.type === 'bush_flowering_white';
        const isStump = plant.type === 'nature_tree_stump';
        const isTall =
          isWhiteBush ||
          plant.type === 'bush_cone_autumn' ||
          plant.type === 'bush_cone_forest' ||
          plant.type === 'flower_purple_bell';
        const isStaticNatural = isTall || isLog || isStump;

        const w = isWhiteBush || isLog ? 64 : 32;
        const h = isTall ? 64 : 32;

        if (
          plant.x + w >= bounds.minX &&
          plant.x <= bounds.maxX &&
          plant.y + h >= bounds.minY &&
          plant.y <= bounds.maxY
        ) {
          const img = this.loader.getImage(plant.type);
          if (img && img.complete) {
            if (isStaticNatural) {
              const ySort = isWhiteBush
                ? plant.y + 56
                : isTall
                ? plant.y + 58
                : plant.y + 26;
              list.push({
                ySort,
                draw: (ctx) => {
                  ctx.drawImage(img, plant.x, plant.y);
                },
              });
            } else {
              const frame = Math.floor((now / 180 + plant.phase) % 5);
              list.push({
                ySort: plant.y + 16,
                draw: (ctx) => {
                  ctx.drawImage(img, frame * 32, 0, 32, 32, plant.x, plant.y, 32, 32);
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
    for (const chunk of chunkManager.activeChunks) {
      if (!chunk.waterFlora || chunk.waterFlora.length === 0) continue;
      for (const flora of chunk.waterFlora) {
        if (
          flora.x + 32 >= bounds.minX &&
          flora.x <= bounds.maxX &&
          flora.y + 32 >= bounds.minY &&
          flora.y <= bounds.maxY
        ) {
          const img = this.loader.getImage(flora.type);
          if (img && img.complete) {
            // Crisp discrete aquatic bobbing on freshwater lake & river surfaces (integer pixels only, no subpixel blur)
            const bobY = Math.round(Math.sin(now / 550 + flora.phase) * 1.2);
            list.push({
              ySort: flora.y + 12,
              draw: (ctx) => {
                ctx.drawImage(img, flora.x, flora.y + bobY);
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

    for (const chunk of chunkManager.activeChunks) {
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

    for (const chunk of chunkManager.activeChunks) {
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
          const img = this.loader.getImage(`building_${b.type}`);
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
    for (const chunk of chunkManager.activeChunks) {
      for (const tree of chunk.trees) {
        const isPalm = tree.type === 'palm';
        const w = isPalm ? 128 : 64;
        const h = isPalm ? 200 : 120;
        const ySort = isPalm ? tree.y + 151 : tree.y + 112;

        if (
          tree.x + w >= bounds.minX &&
          tree.x <= bounds.maxX &&
          tree.y + h >= bounds.minY &&
          tree.y <= bounds.maxY
        ) {
          const img = this.loader.getImage(`tree_${tree.type}`);
          if (img && img.complete) {
            list.push({
              ySort,
              draw: (ctx) => {
                ctx.drawImage(img, tree.x, tree.y);
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
    if (!imgTG || !imgTG.complete) return;

    for (const chunk of chunkManager.activeChunks) {
      for (const tg of chunk.tallGrass) {
        const isRedHere =
          (player.gx === tg.gx && player.gy === tg.gy) ||
          (player.isMoving && player.targetGX === tg.gx && player.targetGY === tg.gy);
        const isPikaHere =
          (follower.gx === tg.gx && follower.gy === tg.gy) ||
          (follower.isMoving && follower.targetGX === tg.gx && follower.targetGY === tg.gy);

        let isWildHere = false;
        let isWildMoving = false;
        for (const wChunk of chunkManager.activeChunks) {
          for (const wp of wChunk.wildPokemon) {
            if (
              (wp.gx === tg.gx && wp.gy === tg.gy) ||
              (wp.isMoving && wp.targetGX === tg.gx && wp.targetGY === tg.gy)
            ) {
              isWildHere = true;
              if (wp.isMoving) isWildMoving = true;
              break;
            }
          }
          if (isWildHere) break;
        }

        if (isRedHere || isPikaHere || isWildHere) {
          const tgY = tg.gy * 32 + 28;
          list.push({
            ySort: tgY,
            draw: (ctx) => {
              const isMovingAny =
                (isRedHere && player.isMoving) || (isPikaHere && follower.isMoving) || isWildMoving;

              let fIdx = 0;
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
              const by = tg.y;

              ctx.save();
              ctx.beginPath();
              ctx.moveTo(bx, by + 17);
              ctx.lineTo(bx + 3, by + 12);
              ctx.lineTo(bx + 6, by + 16);
              ctx.lineTo(bx + 10, by + 11);
              ctx.lineTo(bx + 14, by + 16);
              ctx.lineTo(bx + 17, by + 13);
              ctx.lineTo(bx + 21, by + 17);
              ctx.lineTo(bx + 25, by + 11);
              ctx.lineTo(bx + 28, by + 15);
              ctx.lineTo(bx + 32, by + 18);
              ctx.lineTo(bx + 32, by + 32);
              ctx.lineTo(bx, by + 32);
              ctx.closePath();
              ctx.clip();

              ctx.drawImage(imgTG, fIdx * 32, 0, 32, 32, bx, by, 32, 32);
              ctx.restore();
            },
          });
        }
      }
    }
  }
}
