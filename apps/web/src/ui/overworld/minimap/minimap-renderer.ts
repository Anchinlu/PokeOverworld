import { WORLD_MAP_PALETTE } from '../../world-map/world-map-palette';
import type { TerrainField } from '../../../maps/terrain-field';
import type { MinimapViewport, MinimapPlayerMarker } from './minimap-types';
import {
  MinimapCache,
  type ChunkReader,
  createMinimapOffscreenCanvas,
  MINIMAP_CHUNK_PIXELS,
} from './minimap-cache';
import { chunkKey } from './minimap-state';
import { MAP_ASSETS } from '../../../assets';

export const MINIMAP_CANVAS_SIZE = 160;
export const MINIMAP_TILE_SIZE = 2;
export const MINIMAP_HALF_SPAN_TILES = MINIMAP_CANVAS_SIZE / (2 * MINIMAP_TILE_SIZE); // 40 tiles

/**
 * MinimapRenderer
 *
 * Implements two-layer canvas rendering:
 * 1. Static layer: Discovered chunk terrain cached as bitmaps, redrawn only on chunk entry or seed change.
 * 2. Dynamic layer: Player and follower directional markers, drawn on top without redrawing terrain.
 */
export class MinimapRenderer {
  private displayCanvas: HTMLCanvasElement;
  private displayCtx: CanvasRenderingContext2D | null;
  private staticCanvas: HTMLCanvasElement | OffscreenCanvas;
  private staticCtx: CanvasRenderingContext2D | null;

  private cache: MinimapCache;
  private zoom = 1;
  private staticDirty = true;
  private lastRenderedCX: number | null = null;
  private lastRenderedCY: number | null = null;
  private lastDiscoveredCount: number = 0;

  private playerHeadImg: HTMLImageElement | null =
    typeof Image !== 'undefined'
      ? (() => {
          const img = new Image();
          img.src = MAP_ASSETS.playerHead;
          return img;
        })()
      : null;

  constructor(cache?: MinimapCache, existingCanvas?: HTMLCanvasElement) {
    this.cache = cache ?? new MinimapCache();

    if (existingCanvas) {
      this.displayCanvas = existingCanvas;
    } else if (typeof document !== 'undefined' && document.createElement) {
      this.displayCanvas = document.createElement('canvas');
    } else {
      this.displayCanvas = createMinimapOffscreenCanvas(
        MINIMAP_CANVAS_SIZE,
        MINIMAP_CANVAS_SIZE
      ) as unknown as HTMLCanvasElement;
    }

    this.displayCanvas.width = MINIMAP_CANVAS_SIZE;
    this.displayCanvas.height = MINIMAP_CANVAS_SIZE;
    this.displayCtx = this.displayCanvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (this.displayCtx) {
      this.displayCtx.imageSmoothingEnabled = false;
    }

    this.staticCanvas = createMinimapOffscreenCanvas(MINIMAP_CANVAS_SIZE, MINIMAP_CANVAS_SIZE);
    this.staticCtx = this.staticCanvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (this.staticCtx) {
      this.staticCtx.imageSmoothingEnabled = false;
    }
  }

  public getDisplayCanvas(): HTMLCanvasElement {
    return this.displayCanvas;
  }

  public getStaticCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.staticCanvas;
  }

  public getCache(): MinimapCache {
    return this.cache;
  }

  public setZoom(zoom: number): void {
    this.zoom = Math.max(0.5, Math.min(3, zoom));
    this.markStaticDirty();
  }

  public markStaticDirty(): void {
    this.staticDirty = true;
  }

  public isStaticDirty(): boolean {
    return this.staticDirty;
  }

  /**
   * Renders the static terrain layer for discovered chunks within the viewport.
   * Undiscovered chunks remain covered in background/fog color.
   */
  public renderStatic(
    viewport: MinimapViewport,
    discoveredChunks: ReadonlySet<string>,
    seed: number,
    field: TerrainField,
    chunkReader?: ChunkReader
  ): void {
    if (!this.staticCtx) return;

    const sCtx = this.staticCtx;
    sCtx.imageSmoothingEnabled = false;

    // Fill entire static layer with dark background (undiscovered chunks)
    sCtx.fillStyle = WORLD_MAP_PALETTE.background;
    sCtx.fillRect(0, 0, MINIMAP_CANVAS_SIZE, MINIMAP_CANVAS_SIZE);

    const tileSize = MINIMAP_TILE_SIZE * this.zoom;
    const halfSpanTiles = MINIMAP_CANVAS_SIZE / (2 * tileSize);
    const viewStartGX = viewport.centerGX - halfSpanTiles;
    const viewStartGY = viewport.centerGY - halfSpanTiles;

    // Determine chunk bounding range visible in the viewport
    const minCX = Math.floor(viewStartGX / 16);
    const maxCX = Math.floor((viewStartGX + MINIMAP_HALF_SPAN_TILES * 2) / 16);
    const minCY = Math.floor(viewStartGY / 16);
    const maxCY = Math.floor((viewStartGY + MINIMAP_HALF_SPAN_TILES * 2) / 16);

    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const key = chunkKey(cx, cy);

        // Undiscovered chunks strictly do not render terrain.
        if (!discoveredChunks.has(key)) {
          continue;
        }

        // In the live game, an explored chunk must also still be present in
        // ChunkManager. Unloaded chunks remain fog/black instead of being
        // regenerated just for the mini-map.
        if (chunkReader && !chunkReader.getChunk(cx, cy)) {
          continue;
        }

        const chunkCanvas = this.cache.getOrCreateChunkCanvas(cx, cy, seed, field, chunkReader);

        const dx = (cx * 16 - viewStartGX) * tileSize;
        const dy = (cy * 16 - viewStartGY) * tileSize;

        sCtx.drawImage(
          chunkCanvas as CanvasImageSource,
          dx,
          dy,
          MINIMAP_CHUNK_PIXELS * this.zoom,
          MINIMAP_CHUNK_PIXELS * this.zoom
        );
      }
    }

    this.staticDirty = false;
    this.lastRenderedCX = Math.floor(viewport.centerGX / 16);
    this.lastRenderedCY = Math.floor(viewport.centerGY / 16);
    this.lastDiscoveredCount = discoveredChunks.size;
  }

  /**
   * Renders the dynamic layer on top:
   * Composites the static canvas then draws player and follower markers.
   */
  public renderDynamic(
    viewport: MinimapViewport,
    player: MinimapPlayerMarker,
    follower?: MinimapPlayerMarker
  ): void {
    if (!this.displayCtx) return;

    const ctx = this.displayCtx;
    ctx.imageSmoothingEnabled = false;

    // 1. Copy static terrain layer
    ctx.drawImage(this.staticCanvas as CanvasImageSource, 0, 0);

    const tileSize = MINIMAP_TILE_SIZE * this.zoom;
    const halfSpanTiles = MINIMAP_CANVAS_SIZE / (2 * tileSize);
    const viewStartGX = viewport.centerGX - halfSpanTiles;
    const viewStartGY = viewport.centerGY - halfSpanTiles;

    // 2. Draw Follower Marker (if active and visible)
    if (follower) {
      const fx = Math.round((follower.gx - viewStartGX) * tileSize);
      const fy = Math.round((follower.gy - viewStartGY) * tileSize);

      if (fx >= 0 && fx < MINIMAP_CANVAS_SIZE && fy >= 0 && fy < MINIMAP_CANVAS_SIZE) {
        // Crisp 4x4 follower dot in cyan with dark outline
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(fx - 1, fy - 1, 4, 4);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(fx, fy, 2, 2);
      }
    }

    // 3. Draw Player Marker (centered with directional arrow)
    const px = Math.round((player.gx - viewStartGX) * tileSize);
    const py = Math.round((player.gy - viewStartGY) * tileSize);

    if (px >= 0 && px < MINIMAP_CANVAS_SIZE && py >= 0 && py < MINIMAP_CANVAS_SIZE) {
      this.drawPlayerMarker(ctx, px + 1, py + 1, player.direction);
    }
  }

  /**
   * Draws a pixel-art directional arrow marker for the player.
   * Directions: 0 = Down, 1 = Left, 2 = Right, 3 = Up
   */
  private drawPlayerMarker(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    direction: number
  ): void {
    if (this.playerHeadImg && this.playerHeadImg.complete && this.playerHeadImg.naturalWidth > 0) {
      // Directional pointer tip anchored behind the head
      // Head center is (cx, cy), bounding box: x in [cx-9, cx+9], y in [cy-8, cy+7]
      ctx.fillStyle = '#ffffff'; // White border for high-contrast on any terrain
      switch (direction) {
        case 0: // Down (below chin)
          ctx.fillRect(cx - 2, cy + 8, 5, 3);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(cx - 1, cy + 8, 3, 2);
          ctx.fillRect(cx, cy + 10, 1, 1);
          break;
        case 1: // Left (left of hair)
          ctx.fillRect(cx - 12, cy - 2, 3, 5);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(cx - 11, cy - 1, 2, 3);
          ctx.fillRect(cx - 12, cy, 1, 1);
          break;
        case 2: // Right (right of hair)
          ctx.fillRect(cx + 10, cy - 2, 3, 5);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(cx + 10, cy - 1, 2, 3);
          ctx.fillRect(cx + 12, cy, 1, 1);
          break;
        case 3: // Up (above cap)
        default:
          ctx.fillRect(cx - 2, cy - 11, 5, 3);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(cx - 1, cy - 10, 3, 2);
          ctx.fillRect(cx, cy - 11, 1, 1);
          break;
      }

      ctx.drawImage(this.playerHeadImg, cx - 16, cy - 16, 32, 32);
      return;
    }

    // Fallback: 5x5 base marker with directional tip
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 3, cy - 3, 7, 7);

    ctx.fillStyle = '#ef4444'; // Red core
    ctx.fillRect(cx - 2, cy - 2, 5, 5);

    // Directional pointer tip
    ctx.fillStyle = '#fef08a'; // Golden tip
    switch (direction) {
      case 0: // Down
        ctx.fillRect(cx - 1, cy + 3, 3, 2);
        ctx.fillRect(cx, cy + 5, 1, 1);
        break;
      case 1: // Left
        ctx.fillRect(cx - 4, cy - 1, 2, 3);
        ctx.fillRect(cx - 5, cy, 1, 1);
        break;
      case 2: // Right
        ctx.fillRect(cx + 3, cy - 1, 2, 3);
        ctx.fillRect(cx + 5, cy, 1, 1);
        break;
      case 3: // Up
      default:
        ctx.fillRect(cx - 1, cy - 4, 3, 2);
        ctx.fillRect(cx, cy - 5, 1, 1);
        break;
    }
  }

  /**
   * Checks whether the static layer needs redrawing based on player position or discovery changes.
   */
  public shouldRedrawStatic(
    currentCX: number,
    currentCY: number,
    discoveredCount: number
  ): boolean {
    if (this.staticDirty) return true;
    if (this.lastRenderedCX !== currentCX || this.lastRenderedCY !== currentCY) return true;
    if (this.lastDiscoveredCount !== discoveredCount) return true;
    return false;
  }

  public destroy(): void {
    this.cache.clear();
    this.displayCtx = null;
    this.staticCtx = null;
  }
}
