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
    list.push({
      ySort: follower.y + 55,
      draw: (ctx) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
        ctx.beginPath();
        ctx.ellipse(follower.x + 32, follower.y + 56, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      },
    });

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
    const img = this.loader.getImage('char_pika_sheet');
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
          const img = this.loader.getImage(`wild_${wp.speciesKey}`);
          if (img && img.complete) {
            const drawY = wp.y + (wp.bobY || 0);

            // Shadow
            list.push({
              ySort: wp.y + 56,
              draw: (ctx) => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
                ctx.beginPath();
                ctx.ellipse(wp.x + 32, wp.y + 58, 10, 5, 0, 0, Math.PI * 2);
                ctx.fill();
              },
            });

            // Sprite + Emote Bubble
            list.push({
              ySort: wp.y + 58,
              draw: (ctx) => {
                ctx.drawImage(img, wp.frame * 64, wp.dir * 64, 64, 64, wp.x, drawY, 64, 64);

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
