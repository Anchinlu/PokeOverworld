import type { ViewportBounds } from '../core/camera';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { ChunkManager } from '../maps/chunk-manager';
import type { AssetLoader } from './asset-loader';
import type { RenderItem } from './types';

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
          ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
          ctx.beginPath();
          ctx.ellipse(follower.x + 32, follower.y + 56, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          if (follower.isShiny) {
            const now = Date.now();
            const pulse = 0.5 + 0.5 * Math.sin(now * 0.005 + follower.gx * 3);
            const glowRadius = 14 + pulse * 6;
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(player.x + 32, player.y + 58, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    });
  }

  public collectFollower(follower: Follower, list: RenderItem[]): void {
    if (!follower.visible) return;

    const wildImg = this.getWildSprite(follower.speciesKey, follower.isShiny);
    const pikaImg = this.loader.getImage('char_pika_sheet');
    const img = wildImg && wildImg.complete && wildImg.naturalWidth > 0 ? wildImg : pikaImg;

    list.push({
      ySort: follower.y + 56,
      draw: (ctx) => {
        if (img && img.complete) {
          ctx.drawImage(
            img,
            follower.frame * 64,
            follower.direction * 64,
            64,
            64,
            follower.x,
            follower.y,
            64,
            64
          );
        }

        if (follower.isShiny) {
          this.drawOverworldShinySparkles(ctx, follower.x + 32, follower.y + 28, 42);
        }
      },
    });
  }

  public collectPlayer(player: Player, list: RenderItem[]): void {
    const img = this.loader.getImage('char_red_sheet');
    list.push({
      ySort: player.y + 58,
      draw: (ctx) => {
        if (img && img.complete) {
          ctx.drawImage(
            img,
            player.frame * 64,
            player.direction * 64,
            64,
            64,
            player.x,
            player.y,
            64,
            64
          );
        }
      },
    });
  }

  private wildSpriteCache = new Map<string, HTMLImageElement>();

  private getWildSprite(speciesKey: string, isShiny = false): HTMLImageElement | undefined {
    const keyUpper = speciesKey.toUpperCase();
    const cacheKey = `${keyUpper}_${isShiny ? 'shiny' : 'normal'}`;
    let img = this.wildSpriteCache.get(cacheKey);
    if (!img) {
      img = new Image();
      const folder = isShiny ? 'Followers shiny' : 'Followers';
      img.src = `/Graphics/Characters/${folder}/${keyUpper}.png`;
      this.wildSpriteCache.set(cacheKey, img);
    }
    return img.complete && img.naturalWidth > 0 ? img : undefined;
  }

  public collectWildPokemon(
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    list: RenderItem[]
  ): void {
    for (const chunk of chunkManager.activeChunks) {
      for (const wp of chunk.wildPokemon) {
        if (
          wp.x + 64 >= bounds.minX &&
          wp.x <= bounds.maxX &&
          wp.y + 64 >= bounds.minY &&
          wp.y <= bounds.maxY
        ) {
          const img =
            this.getWildSprite(wp.speciesKey, wp.isShiny) ||
            this.loader.getImage(`wild_${wp.speciesKey}`);

          if (img && img.complete) {
            const drawY = wp.y + (wp.bobY || 0);

            // Shadow (+ Shiny Golden Glow Aura)
            list.push({
              ySort: wp.y + 56,
              draw: (ctx) => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
                ctx.beginPath();
                ctx.ellipse(wp.x + 32, wp.y + 58, 10, 5, 0, 0, Math.PI * 2);
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

            // Sprite + Shiny Sparkles + Emote Bubble
            list.push({
              ySort: wp.y + 58,
              draw: (ctx) => {
                ctx.drawImage(img, wp.frame * 64, wp.dir * 64, 64, 64, wp.x, drawY, 64, 64);

                if (wp.isShiny) {
                  this.drawOverworldShinySparkles(ctx, wp.x + 32, drawY + 28, wp.seed);
                }

                if (wp.emote && wp.emote.timer > 0) {
                  this.drawEmoteBubble(ctx, wp.x + 32, drawY + 14, wp.emote);
                }
              },
            });
          }
        }
      }
    }
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
      ctx.font = 'bold 9px sans-serif';
      ctx.fillStyle = '#7f8c8d';
      ctx.fillText('…', cx, by - 1);
    }
    ctx.restore();
  }
}
