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
    for (const chunk of chunkManager.renderChunks) {
      for (const plant of chunk.plants) {
        const isLog = plant.type === 'nature_fallen_log';
        const isWhiteBush = plant.type === 'bush_flowering_white';
        const isStump = plant.type === 'nature_tree_stump';
        const isCactusSmall = plant.type === 'cactus_small';
        const isRockSpires = plant.type === 'rock_dark_spires';
        const isDarkBush = plant.type.startsWith('bush_dark_');
        const isDarkSprout = plant.type === 'dark_sprout' || plant.type.startsWith('dark_sprout_');
        const isTall =
          isWhiteBush ||
          isDarkBush ||
          plant.type === 'bush_cone_autumn' ||
          plant.type === 'bush_cone_forest' ||
          plant.type === 'flower_purple_bell' ||
          plant.type === 'desert_dry_bush' ||
          plant.type === 'desert_succulent' ||
          plant.type === 'cactus_medium';
        const isVeryTall = isRockSpires || isDarkSprout;
        const isStaticNatural = isTall || isVeryTall || isLog || isStump || isCactusSmall;

        const w = isRockSpires ? 64 : isWhiteBush || isDarkBush || isLog ? 64 : 32;
        const h = isVeryTall ? 96 : isTall ? 64 : 32;

        if (
          plant.x + w >= bounds.minX &&
          plant.x <= bounds.maxX &&
          plant.y + h >= bounds.minY &&
          plant.y <= bounds.maxY
        ) {
          const img = this.loader.getImage(plant.type);
          if (img && img.complete) {
            if (isStaticNatural) {
              const ySort = isVeryTall
                ? plant.y + 90
                : isWhiteBush || isDarkBush
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
    for (const chunk of chunkManager.renderChunks) {
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
        const ySort = isPalm
          ? tree.y + 151
          : isDarkLarge
          ? tree.y + 118
          : isDarkForest
          ? tree.y + 88
          : isCactusLarge
          ? tree.y + 88
          : isDead || isBoulder
          ? tree.y + 58
          : tree.y + 112;

        if (
          tree.x + w >= bounds.minX &&
          tree.x <= bounds.maxX &&
          tree.y + h >= bounds.minY &&
          tree.y <= bounds.maxY
        ) {
          let imgKey = `tree_${tree.type}`;
          if (isCactusLarge) imgKey = 'cactus_large';
          else if (isBoulder) imgKey = 'rock_desert_boulder';
          const img = this.loader.getImage(imgKey);
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

              ctx.drawImage(imgTG, fIdx * 32, 0, 32, 32, bx, by, 32, grassHeight);
              ctx.restore();
            },
          });
        }
      }
    }
  }
}
