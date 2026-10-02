import { TILE_SIZE, TERRAIN } from '@pokemon/game-data';
import type { ViewportBounds } from '../core/camera';
import type { Player } from '../entities/player';
import type { ChunkManager } from '../maps/chunk-manager';

export class DebugRenderer {
  public renderHeatmap(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager
  ): void {
    ctx.save();
    for (const chunk of chunkManager.activeChunks) {
      for (let ly = 0; ly < 16; ly++) {
        for (let lx = 0; lx < 16; lx++) {
          const x = (chunk.cx * 16 + lx) * TILE_SIZE;
          const y = (chunk.cy * 16 + ly) * TILE_SIZE;
          if (x + 32 < bounds.minX || x > bounds.maxX || y + 32 < bounds.minY || y > bounds.maxY)
            continue;

          const tid = chunk.terrainGrid[ly][lx];
          if (tid === TERRAIN.GRASS) ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
          else if (tid === TERRAIN.ROAD) ctx.fillStyle = 'rgba(234, 179, 8, 0.45)';
          else if (tid === TERRAIN.BEACH_SAND) ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
          else if (tid === TERRAIN.HILL) ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
          else if (tid === TERRAIN.OCEAN_WATER) ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';

          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    ctx.restore();
  }

  public renderTileGrid(ctx: CanvasRenderingContext2D, bounds: ViewportBounds): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const startX = Math.floor(bounds.minX / TILE_SIZE) * TILE_SIZE;
    const endX = Math.ceil(bounds.maxX / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(bounds.minY / TILE_SIZE) * TILE_SIZE;
    const endY = Math.ceil(bounds.maxY / TILE_SIZE) * TILE_SIZE;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += TILE_SIZE) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += TILE_SIZE) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  public renderHitboxes(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager,
    player: Player
  ): void {
    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;

    for (const chunk of chunkManager.activeChunks) {
      for (const c of chunk.colliders) {
        if (
          c.x + c.w >= bounds.minX &&
          c.x <= bounds.maxX &&
          c.y + c.h >= bounds.minY &&
          c.y <= bounds.maxY
        ) {
          ctx.fillRect(c.x, c.y, c.w, c.h);
          ctx.strokeRect(c.x, c.y, c.w, c.h);
        }
      }
    }

    // Player foot hitbox
    ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.strokeStyle = '#3b82f6';
    ctx.fillRect(player.x + 22, player.y + 48, 20, 14);
    ctx.strokeRect(player.x + 22, player.y + 48, 20, 14);
    ctx.restore();
  }

  public renderChunkBoundaries(
    ctx: CanvasRenderingContext2D,
    bounds: ViewportBounds,
    chunkManager: ChunkManager
  ): void {
    const chunkSizePx = 16 * TILE_SIZE;

    ctx.save();
    for (const chunk of chunkManager.activeChunks) {
      const cPxX = chunk.cx * chunkSizePx;
      const cPxY = chunk.cy * chunkSizePx;

      if (
        cPxX + chunkSizePx < bounds.minX ||
        cPxX > bounds.maxX ||
        cPxY + chunkSizePx < bounds.minY ||
        cPxY > bounds.maxY
      ) {
        continue;
      }

      // Glowing Cyan Border
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cPxX + 1, cPxY + 1, chunkSizePx - 2, chunkSizePx - 2);

      // Coordinate Badge Box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(cPxX + 8, cPxY + 8, 96, 22);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cPxX + 8, cPxY + 8, 96, 22);

      // Coordinate Badge Text
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Chunk [${chunk.cx}, ${chunk.cy}]`, cPxX + 14, cPxY + 19);
    }
    ctx.restore();
  }
}
