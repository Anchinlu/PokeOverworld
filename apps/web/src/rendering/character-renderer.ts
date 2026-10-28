import type { ViewportBounds } from '../core/camera';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { ChunkManager } from '../maps/chunk-manager';
import type { AssetLoader } from './asset-loader';
import type { RenderItem } from './types';
import { drawWildOverheadIndicator } from './wildlife/wild-overlay';
import { pokemonCatalog } from '../data/pokemon-catalog';
import { regionalFormsRegistry } from '../domain/pokemon/regional-forms';
import type { TimeBand } from '../wildlife/ports/world-query';
import { createNPCRuntimeState, drawNPCEmoteBubble, type CutsceneActor } from '../npc';

export class CharacterRenderer {
  private loader: AssetLoader;

  constructor(loader: AssetLoader) {
    this.loader = loader;
  }

  public collectShadows(player: Player, follower: Follower, list: RenderItem[]): void {
    if (follower.visible) {
      list.push({
        ySort: follower.y + 55,
        draw: (ctx) => {
          const fJumpH = Math.max(0, -(follower.jumpY || 0));
          const fShadowScale = Math.max(0.55, 1 - fJumpH / 32);
          const fAlpha = (0.3 * Math.max(0.45, 1 - fJumpH / 36)).toFixed(2);
          ctx.fillStyle = `rgba(0, 0, 0, ${fAlpha})`;
          ctx.beginPath();
          ctx.ellipse(
            follower.x + 32,
            follower.y + 56,
            10 * fShadowScale,
            5 * fShadowScale,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          if (follower.isShiny) {
            const now = Date.now();
            const pulse = 0.5 + 0.5 * Math.sin(now * 0.005 + follower.gx * 3);
            const glowRadius = (14 + pulse * 6) * fShadowScale;
            const auraGrad = ctx.createRadialGradient(
              follower.x + 32,
              follower.y + 56,
              2,
              follower.x + 32,
              follower.y + 56,
              glowRadius
            );
            auraGrad.addColorStop(0, `rgba(253, 224, 71, ${(0.45 + pulse * 0.25).toFixed(2)})`);
            auraGrad.addColorStop(0.6, `rgba(234, 179, 8, ${(0.2 + pulse * 0.15).toFixed(2)})`);
            auraGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.ellipse(
              follower.x + 32,
              follower.y + 56,
              glowRadius * 1.2,
              glowRadius * 0.6,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        },
      });
    }

    list.push({
      ySort: player.y + 57,
      draw: (ctx) => {
        const jumpH = Math.max(0, -(player.jumpY || 0));
        const shadowScale = Math.max(0.55, 1 - jumpH / 36);
        const alpha = (0.35 * Math.max(0.45, 1 - jumpH / 40)).toFixed(2);
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(
          player.x + 32,
          player.y + 58,
          12 * shadowScale,
          6 * shadowScale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      },
    });
  }

  public collectFollower(follower: Follower, list: RenderItem[]): void {
    if (!follower.visible) return;

    const wildImg =
      (follower.isSwimming
        ? this.getWildSprite(follower.speciesKey, follower.isShiny, true)
        : undefined) || this.getWildSprite(follower.speciesKey, follower.isShiny, false);
    const pikaImg = this.loader.getImage('char_pika_sheet');
    const img = wildImg && wildImg.complete && wildImg.naturalWidth > 0 ? wildImg : pikaImg;
    const frameSize = img ? this.getOverworldFrameSize(img) : { width: 64, height: 64 };

    list.push({
      ySort: follower.y + 56,
      draw: (ctx) => {
        const drawY = follower.y + (follower.jumpY || 0);
        if (img && img.complete) {
          ctx.drawImage(
            img,
            follower.frame * frameSize.width,
            follower.direction * frameSize.height,
            frameSize.width,
            frameSize.height,
            follower.x,
            drawY,
            64,
            64
          );
        }

        if (follower.isShiny) {
          this.drawOverworldShinySparkles(ctx, follower.x + 32, drawY + 28, 42);
        }
      },
    });
  }

  public collectPlayer(player: Player, list: RenderItem[]): void {
    const defaultKey = player.isIdling ? 'char_red_idle' : 'char_red_sheet';
    const imgKey = player.spriteKey || defaultKey;
    const img = this.loader.getImage(imgKey) || this.loader.getImage('char_red_sheet');
    list.push({
      ySort: player.y + 58,
      draw: (ctx) => {
        const drawY = player.y + (player.jumpY || 0);
        if (img && img.complete) {
          const frameW = img.naturalWidth ? img.naturalWidth / 4 : 64;
          const frameH = img.naturalHeight ? img.naturalHeight / 4 : 64;
          ctx.drawImage(
            img,
            player.frame * frameW,
            player.direction * frameH,
            frameW,
            frameH,
            player.x,
            drawY,
            64,
            64
          );
        }

        if (player.activeEmote && player.emoteTimerMs > 0) {
          drawNPCEmoteBubble(ctx, player.x + 32, drawY + 8, player.activeEmote, player.emoteTimerMs);
        }
      },
    });
  }

  public collectCutsceneActors(actors: CutsceneActor[], list: RenderItem[]): void {
    for (const actor of actors) {
      if (!actor.visible) continue;
      let img = this.loader.getImage(actor.spriteKey);
      if (!img && !actor.spriteKey.startsWith('char_')) {
        img = this.loader.getImage(`char_${actor.spriteKey}`);
      }
      if (!img && (actor.spriteKey === 'mama' || actor.spriteKey === 'mom')) {
        img = this.loader.getImage('char_mom');
      }
      const drawY = actor.y + (actor.hopY || 0);

      list.push({
        ySort: actor.y + 58,
        draw: (ctx) => {
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(actor.x + 32, actor.y + 58, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          if (img && img.complete) {
            const frameW = img.naturalWidth ? img.naturalWidth / 4 : 64;
            const frameH = img.naturalHeight ? img.naturalHeight / 4 : 64;
            ctx.drawImage(
              img,
              actor.frame * frameW,
              actor.direction * frameH,
              frameW,
              frameH,
              actor.x,
              drawY,
              64,
              64
            );
          }

          if (actor.activeEmote) {
            drawNPCEmoteBubble(
              ctx,
              actor.x + 32,
              drawY + 8,
              actor.activeEmote,
              actor.emoteTimerMs || 1000
            );
          }
        },
      });
    }
  }

  private wildSpriteCache = new Map<string, HTMLImageElement>();

  private getWildSprite(
    speciesKey: string,
    isShiny = false,
    isWater = false
  ): HTMLImageElement | undefined {
    const keyUpper = speciesKey.replace(/^wild_/i, '').toUpperCase();
    const cacheKey = `${keyUpper}_${isShiny ? 'shiny' : 'normal'}_${isWater ? 'water' : 'land'}`;
    let img = this.wildSpriteCache.get(cacheKey);
    if (!img) {
      img = new Image();
      const reg =
        regionalFormsRegistry.getByFormKey(keyUpper) ||
        regionalFormsRegistry.getByAssetKey(keyUpper);
      const assetKey = reg ? reg.assetKey : keyUpper;
      const mon = pokemonCatalog.getBySpeciesKey(keyUpper);

      if (isWater) {
        const waterPath = isShiny
          ? mon?.sprites.swimmingShiny || mon?.sprites.swimming
          : mon?.sprites.swimming;
        if (waterPath) {
          img.src = `/${waterPath}`;
        } else {
          const folder = isShiny ? 'Followers shiny' : 'Followers';
          img.src = `/Graphics/Characters/${folder}/${assetKey}.png`;
        }
      } else {
        if (!isShiny && mon?.sprites.follower) {
          img.src = `/${mon.sprites.follower}`;
        } else {
          const folder = isShiny ? 'Followers shiny' : 'Followers';
          img.src = `/Graphics/Characters/${folder}/${assetKey}.png`;
        }
      }
      this.wildSpriteCache.set(cacheKey, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : undefined;
  }

  public collectWildPokemon(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    list: RenderItem[],
    playerPos?: { gx: number; gy: number },
    playerRefLevel = 5,
    timeBand: TimeBand = 'day'
  ): void {
    for (const chunk of chunkManager.renderChunks) {
      for (const wp of chunk.wildPokemon) {
        if (
          wp.activeTime &&
          !wp.activeTime.includes(timeBand) &&
          (wp.state !== 'rest_sleep' || Math.abs(Math.floor(wp.seed ?? 0)) % 3 !== 0)
        ) {
          continue;
        }
        if (
          wp.x + 64 >= bounds.minX &&
          wp.x <= bounds.maxX &&
          wp.y + 64 >= bounds.minY &&
          wp.y <= bounds.maxY
        ) {
          const isWildWater = wp.isSwimming === true;
          const img =
            (isWildWater ? this.getWildSprite(wp.speciesKey, wp.isShiny, true) : undefined) ||
            this.getWildSprite(wp.speciesKey, wp.isShiny, false) ||
            this.loader.getImage(`wild_${wp.speciesKey}`);

          if (img && img.complete) {
            const frameSize = this.getOverworldFrameSize(img);
            const drawY = wp.y + (wp.jumpY ?? wp.bobY ?? 0);
            const jumpHeight = Math.max(0, -(wp.jumpY ?? 0));
            const shadowScale = Math.max(0.55, 1 - jumpHeight / 44);

            // Shadow (+ Shiny Golden Glow Aura)
            list.push({
              ySort: wp.y + 56,
              draw: (ctx) => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
                ctx.beginPath();
                ctx.ellipse(
                  wp.x + 32,
                  wp.y + 58,
                  10 * shadowScale,
                  5 * shadowScale,
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.fill();

                if (wp.isShiny) {
                  const now = Date.now();
                  const pulse = 0.5 + 0.5 * Math.sin(now * 0.005 + wp.gx * 3);
                  const glowRadius = 14 + pulse * 6;
                  const auraGrad = ctx.createRadialGradient(
                    wp.x + 32,
                    wp.y + 56,
                    2,
                    wp.x + 32,
                    wp.y + 56,
                    glowRadius
                  );
                  auraGrad.addColorStop(
                    0,
                    `rgba(253, 224, 71, ${(0.45 + pulse * 0.25).toFixed(2)})`
                  );
                  auraGrad.addColorStop(
                    0.6,
                    `rgba(234, 179, 8, ${(0.2 + pulse * 0.15).toFixed(2)})`
                  );
                  auraGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
                  ctx.fillStyle = auraGrad;
                  ctx.beginPath();
                  ctx.ellipse(
                    wp.x + 32,
                    wp.y + 56,
                    glowRadius * 1.2,
                    glowRadius * 0.6,
                    0,
                    0,
                    Math.PI * 2
                  );
                  ctx.fill();
                }
              },
            });

            // Sprite + Shiny Sparkles + Emote Bubble + Wildlife Overhead Level Indicator
            list.push({
              ySort: wp.y + 58,
              draw: (ctx) => {
                ctx.drawImage(
                  img,
                  wp.frame * frameSize.width,
                  wp.dir * frameSize.height,
                  frameSize.width,
                  frameSize.height,
                  wp.x,
                  drawY,
                  64,
                  64
                );

                if (wp.isShiny) {
                  this.drawOverworldShinySparkles(ctx, wp.x + 32, drawY + 28, wp.seed);
                }

                if (wp.emote && wp.emote.timer > 0) {
                  this.drawEmoteBubble(ctx, wp.x + 32, drawY + 14, wp.emote);
                }

                if (playerPos) {
                  drawWildOverheadIndicator(ctx, wp, playerRefLevel, playerPos, {
                    showLowApexAsLevel: true,
                    lowApexGap: 10,
                  });
                }
              },
            });
          }
        }
      }
    }
  }

  /**
   * Follower sheets normally use 64px cells, but some regional-form assets
   * use 128px cells in the same 4x4 layout. Always crop one logical frame
   * from the actual sheet, then scale it to the standard overworld footprint.
   */
  private getOverworldFrameSize(img: HTMLImageElement): { width: number; height: number } {
    const width = img.naturalWidth > 0 ? Math.floor(img.naturalWidth / 4) : 64;
    const height = img.naturalHeight > 0 ? Math.floor(img.naturalHeight / 4) : 64;
    return {
      width: width > 0 ? width : 64,
      height: height > 0 ? height : 64,
    };
  }

  private drawOverworldShinySparkles(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    seed: number
  ): void {
    const now = Date.now() * 0.003;
    const numStars = 4;

    ctx.save();
    for (let i = 0; i < numStars; i++) {
      const phase = (now + (i * (Math.PI * 2)) / numStars + seed) % (Math.PI * 2);
      const orbitRx = 18 + (i % 2) * 4;
      const orbitRy = 14 + (i % 2) * 3;
      const starX = cx + Math.cos(phase) * orbitRx;
      const starY = cy + Math.sin(phase) * orbitRy - Math.abs(Math.sin(phase * 1.5)) * 6;

      const twinkle = Math.max(0, Math.sin(phase * 2));
      const size = 3 + twinkle * 3.5;
      const alpha = 0.4 + twinkle * 0.6;

      ctx.save();
      ctx.translate(starX, starY);
      ctx.rotate(now * 1.8 + i);
      ctx.globalAlpha = alpha;

      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.28, -size * 0.28);
      ctx.lineTo(size, 0);
      ctx.lineTo(size * 0.28, size * 0.28);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.28, size * 0.28);
      ctx.lineTo(-size, 0);
      ctx.lineTo(-size * 0.28, -size * 0.28);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  private drawEmoteBubble(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    emote: { type: string; timer: number; maxTime: number }
  ): void {
    const progress = 1 - emote.timer / emote.maxTime;
    const bounce = Math.sin(Math.min(progress * 3, 1) * Math.PI) * 5;
    const by = cy - 14 - bounce;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(cx, by, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 2, by + 6.5);
    ctx.lineTo(cx, by + 10.5);
    ctx.lineTo(cx + 2, by + 6.5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, by, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (emote.type === '!') {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#e74c3c';
      ctx.fillText('!', cx, by);
    } else if (emote.type === '?') {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#2980b9';
      ctx.fillText('?', cx, by);
    } else if (emote.type === 'sweat') {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#3498db';
      ctx.fillText('💧', cx, by);
    } else if (emote.type === 'dots') {
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = '#6366f1';
      ctx.fillText('Zzz', cx, by);
    } else if (emote.type === 'heart') {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#ec4899';
      ctx.fillText('❤️', cx, by + 0.5);
    } else if (emote.type === 'music') {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('♪', cx, by);
    } else if (emote.type === 'anger') {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#dc2626';
      ctx.fillText('💢', cx, by);
    } else if (emote.type === 'eat') {
      ctx.font = '9px sans-serif';
      ctx.fillStyle = '#16a34a';
      ctx.fillText('🍃', cx, by);
    } else if (emote.type === 'happy') {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#eab308';
      ctx.fillText('✨', cx, by);
    }
    ctx.restore();
  }

  public collectVillageNPCs(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    list: RenderItem[],
    activeDialogueSpeaker?: string | null
  ): void {
    for (const chunk of chunkManager.renderChunks) {
      if (!chunk.npcs) continue;
      for (const npc of chunk.npcs) {
        if (!npc.runtime) {
          npc.runtime = createNPCRuntimeState(npc, 32);
        }
        const state = npc.runtime;
        if (!state.visible) continue;

        const nx = state.x - 16;
        const ny = state.y - 32;

        if (
          nx + 64 < bounds.minX ||
          nx > bounds.maxX ||
          ny + 64 < bounds.minY ||
          ny > bounds.maxY
        ) {
          continue;
        }

        const isTalking = activeDialogueSpeaker === npc.name;
        const frame = isTalking ? 0 : state.frame;
        const dir = state.direction;
        const img = this.loader.getImage(npc.spriteKey);

        list.push({
          ySort: ny + 58,
          draw: (ctx) => {
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(nx + 32, ny + 58, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            if (img && img.complete) {
              const frameW = img.naturalWidth / 4;
              const frameH = img.naturalHeight / 4;
              ctx.drawImage(img, frame * frameW, dir * frameH, frameW, frameH, nx, ny, 64, 64);
            }

            if (state.activeEmote) {
              drawNPCEmoteBubble(ctx, nx + 32, ny + 8, state.activeEmote, state.emoteTimerMs);
            }
          },
        });
      }
    }
  }
}

