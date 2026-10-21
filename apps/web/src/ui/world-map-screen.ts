/**
 * World Map Screen UI (Overview Map / Town Map)
 *
 * Fullscreen interactive panoramic map overlay for Pokémon Overworld.
 * Renders procedural terrain via TerrainField sampling with macro-tile LRU caching,
 * settlement/village POI markers, animated player radar pulse, and mouse pan/zoom.
 */

import type { GameSession } from '../game/game-session';
import type { TerrainField } from '../maps/terrain-field';
import { CHUNK_SIZE } from '@pokemon/game-data';
import { getSettlementForRegion } from '../maps/terrain-field/settlement-sites';
import { getStartVillagePlacement } from '../maps/terrain-field/start-village';
import type { VillagePlacement } from '../maps/village-rules';
import { V0_CONFIG } from '../maps/terrain-field/v0-config';
import { V3_CONFIG } from '../maps/terrain-field/v3-config';
import { WORLD_MAP_PALETTE } from './world-map/world-map-palette';
import { WorldMapRenderer } from './world-map/world-map-renderer';
import { resolveWorldBiome } from '../maps/ecology';

// ---------------------------------------------------------------------------
// Constants & Configuration
// ---------------------------------------------------------------------------
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 6.0;
const DEFAULT_ZOOM = 1.5;
const MAP_FRAME_INTERVAL_MS = 1000 / 30;

export interface MapHoverInfo {
  gx: number;
  gy: number;
  terrainName: string;
  biomeName?: string;
  villageName?: string;
  safetyLevel?: number;
  corridorInfluence?: number;
}

export class WorldMapScreen {
  private visible = false;
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private session: GameSession | null = null;
  private animationFrameId: number | null = null;
  private lastRenderTimestamp = -Infinity;

  // Static terrain/grid/settlement layer. Dynamic markers are rendered on top.
  private staticLayerCanvas: HTMLCanvasElement | null = null;
  private staticLayerCtx: CanvasRenderingContext2D | null = null;
  private staticLayerKey: string | null = null;
  private eventAbortController: AbortController | null = null;
  private visibilityListener?: (isOpen: boolean) => void;
  /** Stores only discovered coordinates; visual pixels are rebuilt on demand. */
  private readonly discoveredChunks = new Set<string>();
  private discoveredSeed: number | null = null;

  // Viewport camera (in world tile units)
  private centerX = 0;
  private centerY = 0;
  private zoom = DEFAULT_ZOOM;

  // Mouse pan state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragCenterStartX = 0;
  private dragCenterStartY = 0;

  // Hover state
  private hoverGX = 0;
  private hoverGY = 0;
  private isHovering = false;

  // Chunk-sized pixel-art cache. The renderer only generates terrain tiles;
  // it never creates gameplay entities or mutates ChunkManager.cache.
  private readonly mapRenderer = new WorldMapRenderer();

  // DOM Elements for dynamic HUD
  private coordsDisplayEl: HTMLElement | null = null;
  private hoverInfoEl: HTMLElement | null = null;
  private zoomDisplayEl: HTMLElement | null = null;

  // World Gen v3 Debug Overlay Toggle
  // Debug geometry is intentionally opt-in. Drawing the V3 envelopes over a
  // large unexplored area adds work and makes the minimal map harder to read.
  private showV3Debug = false;

  public isOpen(): boolean {
    return this.visible;
  }

  public setVisibilityListener(listener: (isOpen: boolean) => void): void {
    this.visibilityListener = listener;
  }

  public toggle(session: GameSession): void {
    if (this.visible) {
      this.close();
    } else {
      this.open(session);
    }
  }

  public open(session: GameSession): void {
    if (this.visible) return;

    this.session = session;
    this.visible = true;
    this.visibilityListener?.(true);

    // Reset center on player
    this.centerX = session.player.gx;
    this.centerY = session.player.gy;
    this.zoom = DEFAULT_ZOOM;

    if (this.discoveredSeed !== session.seed) {
      this.discoveredChunks.clear();
      this.mapRenderer.clear();
      this.discoveredSeed = session.seed;
    }

    this.mountDOM();
    this.staticLayerKey = null;
    this.lastRenderTimestamp = -Infinity;
    this.handleResize();
    this.startRenderLoop();
  }

  public close(): void {
    if (!this.visible) return;

    this.visible = false;
    this.visibilityListener?.(false);
    this.stopRenderLoop();
    this.lastRenderTimestamp = -Infinity;
    this.unmountDOM();
    this.session = null;
  }

  public recenterOnPlayer(): void {
    if (!this.session) return;
    this.centerX = this.session.player.gx;
    this.centerY = this.session.player.gy;
    this.updateHud();
  }

  public setZoom(newZoom: number, focusClientX?: number, focusClientY?: number): void {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    if (clampedZoom === this.zoom) return;

    if (focusClientX !== undefined && focusClientY !== undefined && this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseCanvasX = focusClientX - rect.left;
      const mouseCanvasY = focusClientY - rect.top;
      const canvasW = this.canvas.width;
      const canvasH = this.canvas.height;
      const tileSize = 2; // base tile unit

      // Tile under cursor before zoom
      const tileX = this.centerX + (mouseCanvasX - canvasW / 2) / (tileSize * this.zoom);
      const tileY = this.centerY + (mouseCanvasY - canvasH / 2) / (tileSize * this.zoom);

      this.zoom = clampedZoom;

      // Adjust center so cursor points to same world tile
      this.centerX = tileX - (mouseCanvasX - canvasW / 2) / (tileSize * this.zoom);
      this.centerY = tileY - (mouseCanvasY - canvasH / 2) / (tileSize * this.zoom);
    } else {
      this.zoom = clampedZoom;
    }

    this.updateHud();
  }

  // ---------------------------------------------------------------------------
  // Settlement Querying for Visible Region
  // ---------------------------------------------------------------------------
  private getVillagesInBounds(
    field: TerrainField,
    minGX: number,
    maxGX: number,
    minGY: number,
    maxGY: number
  ): VillagePlacement[] {
    const regionSize = V0_CONFIG.REGION_TILES; // 96
    const minRX = Math.floor(minGX / regionSize) - 1;
    const maxRX = Math.floor(maxGX / regionSize) + 1;
    const minRY = Math.floor(minGY / regionSize) - 1;
    const maxRY = Math.floor(maxGY / regionSize) + 1;

    const list: VillagePlacement[] = [];
    const seenKeys = new Set<string>();

    // Starter village is always present at (0, 0)
    const starter = getStartVillagePlacement(field.seed);
    list.push(starter);
    seenKeys.add(`start_${field.seed}`);

    for (let ry = minRY; ry <= maxRY; ry++) {
      for (let rx = minRX; rx <= maxRX; rx++) {
        const v = getSettlementForRegion(rx, ry, field);
        if (v) {
          const vKey = `${v.centerGX},${v.centerGY}`;
          if (!seenKeys.has(vKey)) {
            seenKeys.add(vKey);
            list.push(v);
          }
        }
      }
    }

    return list;
  }

  // ---------------------------------------------------------------------------
  // Rendering Loop
  // ---------------------------------------------------------------------------
  // Rendering Loop
  // ---------------------------------------------------------------------------
  private safeRequestAnimationFrame(cb: (t: number) => void): number {
    if (typeof requestAnimationFrame !== 'undefined') {
      return requestAnimationFrame(cb);
    }
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      return window.requestAnimationFrame(cb);
    }
    return setTimeout(() => cb(Date.now()), 16) as unknown as number;
  }

  private safeCancelAnimationFrame(id: number): void {
    if (typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(id);
    } else if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
      window.cancelAnimationFrame(id);
    } else {
      clearTimeout(id);
    }
  }

  private startRenderLoop(): void {
    if (this.animationFrameId !== null) return;

    const loop = (timestamp: number) => {
      if (!this.visible) return;
      if (timestamp - this.lastRenderTimestamp >= MAP_FRAME_INTERVAL_MS) {
        this.renderFrame(timestamp);
        this.lastRenderTimestamp = timestamp;
      }
      this.animationFrameId = this.safeRequestAnimationFrame(loop);
    };

    this.animationFrameId = this.safeRequestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      this.safeCancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private renderFrame(timestamp: number): void {
    if (!this.canvas || !this.ctx || !this.session) return;

    const canvas = this.canvas;
    const ctx = this.ctx;
    const width = canvas.width;
    const height = canvas.height;

    const tileSize = 2; // base pixel per tile
    const scale = tileSize * this.zoom;

    // Screen to world bounds
    const halfW = width / 2;
    const halfH = height / 2;
    const minGX = Math.floor(this.centerX - halfW / scale);
    const maxGX = Math.ceil(this.centerX + halfW / scale);
    const minGY = Math.floor(this.centerY - halfH / scale);
    const maxGY = Math.ceil(this.centerY + halfH / scale);

    const staticKey = [
      width,
      height,
      this.session.seed,
      this.centerX,
      this.centerY,
      this.zoom,
      minGX,
      maxGX,
      minGY,
      maxGY,
      this.getLoadedChunkSignature(minGX, maxGX, minGY, maxGY),
    ].join('|');

    if (this.staticLayerKey !== staticKey || !this.staticLayerCanvas || !this.staticLayerCtx) {
      this.renderStaticLayer(width, height, scale, halfW, halfH, minGX, maxGX, minGY, maxGY);
      this.staticLayerKey = staticKey;
    }

    // Copy the complete static background in one operation.
    ctx.clearRect(0, 0, width, height);
    if (this.staticLayerCanvas) {
      ctx.drawImage(this.staticLayerCanvas, 0, 0);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.showV3Debug) {
      this.drawV3DebugOverlay(ctx, scale, halfW, halfH);
    }

    if (this.session.follower) {
      const fGX = this.session.follower.gx;
      const fGY = this.session.follower.gy;
      const fsX = (fGX - this.centerX) * scale + halfW;
      const fsY = (fGY - this.centerY) * scale + halfH;
      this.drawFollowerMarker(ctx, fsX, fsY);
    }

    const pGX = this.session.player.gx;
    const pGY = this.session.player.gy;
    const psX = (pGX - this.centerX) * scale + halfW;
    const psY = (pGY - this.centerY) * scale + halfH;
    this.drawPlayerMarker(ctx, psX, psY, timestamp, this.session.player.direction);

    if (this.isHovering) {
      const hsX = (this.hoverGX - this.centerX) * scale + halfW;
      const hsY = (this.hoverGY - this.centerY) * scale + halfH;
      this.drawHoverCursor(ctx, hsX, hsY, scale);
    }

    ctx.restore();
  }

  private renderStaticLayer(
    width: number,
    height: number,
    scale: number,
    halfW: number,
    halfH: number,
    minGX: number,
    maxGX: number,
    minGY: number,
    maxGY: number
  ): void {
    if (!this.staticLayerCanvas) {
      this.staticLayerCanvas = document.createElement('canvas');
    }
    this.staticLayerCanvas.width = width;
    this.staticLayerCanvas.height = height;
    this.staticLayerCtx = this.staticLayerCanvas.getContext('2d');
    if (!this.staticLayerCtx) return;

    const ctx = this.staticLayerCtx;
    ctx.fillStyle = WORLD_MAP_PALETTE.background;
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Render only exact 16x16 chunks that already exist in the gameplay cache.
    // Any missing chunk remains the dark background painted above.
    const minCX = Math.floor(minGX / CHUNK_SIZE);
    const maxCX = Math.floor(maxGX / CHUNK_SIZE);
    const minCY = Math.floor(minGY / CHUNK_SIZE);
    const maxCY = Math.floor(maxGY / CHUNK_SIZE);

    const chunkDrawSize = CHUNK_SIZE * scale;

    const loadedChunks = this.session?.chunkManager.cache;
    if (loadedChunks) {
      // Register every gameplay chunk currently loaded, not just chunks in
      // the visible map window. This lets the player revisit the map later
      // even after the gameplay cache evicts distant chunks.
      for (const chunk of loadedChunks.values()) {
        const key = `${chunk.cx},${chunk.cy}`;
        this.mapRenderer.getOrCreateLoadedChunkCanvas(chunk);
        this.discoveredChunks.add(key);
      }
    }

    // Draw remembered terrain, leaving never-discovered areas as the dark
    // background painted above.
    for (const key of this.discoveredChunks) {
      const [cxText, cyText] = key.split(',');
      const cx = Number(cxText);
      const cy = Number(cyText);
      if (cx < minCX || cx > maxCX || cy < minCY || cy > maxCY) {
        continue;
      }

      const loadedChunk = loadedChunks?.get(key);
      const chunkCanvas = loadedChunk
        ? this.mapRenderer.getOrCreateLoadedChunkCanvas(loadedChunk)
        : this.mapRenderer.getOrCreateDiscoveredChunkCanvas(cx, cy, this.session!.field);
      const screenX = Math.round((cx * CHUNK_SIZE - this.centerX) * scale + halfW);
      const screenY = Math.round((cy * CHUNK_SIZE - this.centerY) * scale + halfH);

      ctx.drawImage(
        chunkCanvas,
        screenX,
        screenY,
        Math.ceil(chunkDrawSize),
        Math.ceil(chunkDrawSize)
      );
    }

    // Subtle region grid (only when zoomed in enough >= 1.2x).
    if (this.zoom >= 1.2) {
      this.drawSubtleGrid(ctx, minGX, maxGX, minGY, maxGY, scale, halfW, halfH);
    }

    // Render settlements (villages, towns, cities).
    const field = this.session?.field;
    if (field) {
      const villages = this.getVillagesInBounds(field, minGX, maxGX, minGY, maxGY).filter((v) =>
        this.isChunkLoadedAt(v.centerGX, v.centerGY)
      );
      this.drawVillages(ctx, villages, scale, halfW, halfH);
    }

    ctx.restore();
  }

  private getLoadedChunkSignature(
    minGX: number,
    maxGX: number,
    minGY: number,
    maxGY: number
  ): string {
    if (!this.session) return 'none';

    const minCX = Math.floor(minGX / CHUNK_SIZE);
    const maxCX = Math.floor(maxGX / CHUNK_SIZE);
    const minCY = Math.floor(minGY / CHUNK_SIZE);
    const maxCY = Math.floor(maxGY / CHUNK_SIZE);
    const keys: string[] = [];

    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const chunk = this.session.chunkManager.cache.get(`${cx},${cy}`);
        if (chunk) keys.push(`${cx},${cy},${chunk.version}`);
      }
    }

    return keys.join(';');
  }

  private isChunkLoadedAt(gx: number, gy: number): boolean {
    if (!this.session) return false;
    const cx = Math.floor(gx / CHUNK_SIZE);
    const cy = Math.floor(gy / CHUNK_SIZE);
    return this.session.chunkManager.cache.has(`${cx},${cy}`);
  }

  // ---------------------------------------------------------------------------
  // Canvas Overlays & Markers
  // ---------------------------------------------------------------------------
  private drawSubtleGrid(
    ctx: CanvasRenderingContext2D,
    minGX: number,
    maxGX: number,
    minGY: number,
    maxGY: number,
    scale: number,
    halfW: number,
    halfH: number
  ): void {
    const gridStep = CHUNK_SIZE; // Every terrain chunk boundary
    const startX = Math.floor(minGX / gridStep) * gridStep;
    const endX = Math.ceil(maxGX / gridStep) * gridStep;
    const startY = Math.floor(minGY / gridStep) * gridStep;
    const endY = Math.ceil(maxGY / gridStep) * gridStep;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = startX; x <= endX; x += gridStep) {
      const sx = Math.round((x - this.centerX) * scale + halfW);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, ctx.canvas.height);
    }

    for (let y = startY; y <= endY; y += gridStep) {
      const sy = Math.round((y - this.centerY) * scale + halfH);
      ctx.moveTo(0, sy);
      ctx.lineTo(ctx.canvas.width, sy);
    }

    ctx.stroke();
  }

  private drawVillages(
    ctx: CanvasRenderingContext2D,
    villages: VillagePlacement[],
    scale: number,
    halfW: number,
    halfH: number
  ): void {
    for (const v of villages) {
      const sx = (v.centerGX - this.centerX) * scale + halfW;
      const sy = (v.centerGY - this.centerY) * scale + halfH;

      // Draw boundary rectangle glow if available
      if (v.bounds) {
        const bMinX = (v.bounds.minGX - this.centerX) * scale + halfW;
        const bMinY = (v.bounds.minGY - this.centerY) * scale + halfH;
        const bW = (v.bounds.maxGX - v.bounds.minGX + 1) * scale;
        const bH = (v.bounds.maxGY - v.bounds.minGY + 1) * scale;

        ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
        ctx.fillStyle = 'rgba(234, 179, 8, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(bMinX, bMinY, bW, bH);
        ctx.strokeRect(bMinX, bMinY, bW, bH);
      }

      // Draw Icon Pin
      const isStart =
        v.bounds &&
        0 >= v.bounds.minGX &&
        0 <= v.bounds.maxGX &&
        0 >= v.bounds.minGY &&
        0 <= v.bounds.maxGY;
      const pinColor = isStart
        ? '#f59e0b'
        : v.tier === 2
          ? '#ec4899'
          : v.tier === 1
            ? '#38bdf8'
            : '#a855f7';

      ctx.save();

      // Pin circle
      ctx.shadowColor = pinColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(sx, sy, 8, 0, Math.PI * 2);
      ctx.fill();

      // Inner white star or dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, isStart ? 3.5 : 3, 0, Math.PI * 2);
      ctx.fill();

      // Label Badge
      ctx.shadowBlur = 0;
      const label = v.name;
      ctx.font = "bold 13px 'Power Green Narrow', 'VT323', sans-serif";
      const textMetrics = ctx.measureText(label);
      const badgeW = textMetrics.width + 16;
      const badgeH = 22;
      const badgeX = sx - badgeW / 2;
      const badgeY = sy - 32;

      // Badge pill background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = pinColor;
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      // Badge text
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, sx, badgeY + badgeH / 2);

      ctx.restore();
    }
  }

  private drawV3DebugOverlay(
    ctx: CanvasRenderingContext2D,
    scale: number,
    halfW: number,
    halfH: number
  ): void {
    if (!this.session || this.session.field.version !== 3) {
      return;
    }

    ctx.save();

    const anchorGX = V3_CONFIG.START_ANCHOR_GX;
    const anchorGY = V3_CONFIG.START_ANCHOR_GY;
    const anchorSX = (anchorGX - this.centerX) * scale + halfW;
    const anchorSY = (anchorGY - this.centerY) * scale + halfH;

    // 1. Safe Core Radius (R=20)
    const coreR = V3_CONFIG.SAFE_CORE_R * scale;
    ctx.strokeStyle = '#10b981'; // Emerald
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(anchorSX, anchorSY, coreR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.fill();

    // 2. Valley Transition Envelope (R=128)
    const valleyR = V3_CONFIG.VALLEY_R1 * scale;
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(anchorSX, anchorSY, valleyR, 0, Math.PI * 2);
    ctx.stroke();

    // Labels for Core & Valley
    ctx.setLineDash([]);
    ctx.font = "bold 11px 'Power Green Narrow', 'VT323', sans-serif";
    ctx.fillStyle = '#6ee7b7';
    ctx.textAlign = 'center';
    ctx.fillText('🛡️ LÕI AN TOÀN (R=20)', anchorSX, anchorSY - coreR - 6);

    ctx.fillStyle = '#fde68a';
    ctx.fillText('🌿 BIÊN THUNG LŨNG (R=128)', anchorSX, anchorSY - valleyR - 6);

    // 3. Directional Corridors (3 Natural Openings)
    for (const c of V3_CONFIG.CORRIDORS) {
      const endGX = anchorGX + c.dirX * c.maxLength;
      const endGY = anchorGY + c.dirY * c.maxLength;
      const endSX = (endGX - this.centerX) * scale + halfW;
      const endSY = (endGY - this.centerY) * scale + halfH;

      // Draw corridor boundary ribbon
      const hw = c.baseHalfWidth;
      const p1X = (anchorGX + c.perpX * hw - this.centerX) * scale + halfW;
      const p1Y = (anchorGY + c.perpY * hw - this.centerY) * scale + halfH;
      const p2X = (endGX + c.perpX * (hw * 0.6) - this.centerX) * scale + halfW;
      const p2Y = (endGY + c.perpY * (hw * 0.6) - this.centerY) * scale + halfH;
      const p3X = (endGX - c.perpX * (hw * 0.6) - this.centerX) * scale + halfW;
      const p3Y = (endGY - c.perpY * (hw * 0.6) - this.centerY) * scale + halfH;
      const p4X = (anchorGX - c.perpX * hw - this.centerX) * scale + halfW;
      const p4Y = (anchorGY - c.perpY * hw - this.centerY) * scale + halfH;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.beginPath();
      ctx.moveTo(p1X, p1Y);
      ctx.lineTo(p2X, p2Y);
      ctx.lineTo(p3X, p3Y);
      ctx.lineTo(p4X, p4Y);
      ctx.closePath();
      ctx.fill();

      // Corridor boundary dashed lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1X, p1Y);
      ctx.lineTo(p2X, p2Y);
      ctx.moveTo(p4X, p4Y);
      ctx.lineTo(p3X, p3Y);
      ctx.stroke();

      // Corridor center ray
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(anchorSX, anchorSY);
      ctx.lineTo(endSX, endSY);
      ctx.stroke();

      // Midpoint badge
      ctx.setLineDash([]);
      const midT = 90;
      const midSX = (anchorGX + c.dirX * midT - this.centerX) * scale + halfW;
      const midSY = (anchorGY + c.dirY * midT - this.centerY) * scale + halfH;

      const badgeText = `🧭 ${c.name}`;
      ctx.font = "bold 12px 'Power Green Narrow', 'VT323', sans-serif";
      const bw = ctx.measureText(badgeText).width + 12;
      const bh = 18;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      this.roundRect(ctx, midSX - bw / 2, midSY - bh / 2, bw, bh, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, midSX, midSY);
    }

    ctx.restore();
  }

  private drawFollowerMarker(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawPlayerMarker(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    timestamp: number,
    direction: number
  ): void {
    ctx.save();

    // 1. Expanding Pulse Radar Ring (period 1800ms)
    const pulseCycle = (timestamp % 1800) / 1800; // 0.0 -> 1.0
    const pulseRadius = 8 + pulseCycle * 28;
    const pulseAlpha = Math.max(0, 1 - pulseCycle);

    ctx.strokeStyle = `rgba(239, 68, 68, ${pulseAlpha * 0.85})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sx, sy, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary pulse
    const pulse2 = ((timestamp + 900) % 1800) / 1800;
    const pulseRadius2 = 8 + pulse2 * 28;
    const pulseAlpha2 = Math.max(0, 1 - pulse2);
    ctx.strokeStyle = `rgba(245, 158, 11, ${pulseAlpha2 * 0.6})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, pulseRadius2, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Player Marker Circle (Authentic Red & White Trainer Badge)
    ctx.shadowColor = 'rgba(239, 68, 68, 0.9)';
    ctx.shadowBlur = 12;

    // Red upper half
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(sx, sy, 9, Math.PI, 0, false);
    ctx.fill();

    // White lower half
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI, false);
    ctx.fill();

    // Outer border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, Math.PI * 2);
    ctx.stroke();

    // Center divider & core
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx - 9, sy - 1, 18, 2);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Direction Chevron Pointer (0: Down, 1: Left, 2: Right, 3: Up)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1;

    let rot = 0;
    if (direction === 0)
      rot = Math.PI / 2; // Down
    else if (direction === 1)
      rot = Math.PI; // Left
    else if (direction === 2)
      rot = 0; // Right
    else if (direction === 3) rot = -Math.PI / 2; // Up

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(8, -5);
    ctx.lineTo(10, 0);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. "BẠN / YOU" Pill Badge above player
    const badgeText = '👤 BẠN (YOU)';
    ctx.font = "bold 11px 'Power Green Narrow', 'VT323', sans-serif";
    const tw = ctx.measureText(badgeText).width;
    const bw = tw + 12;
    const bh = 18;
    const bx = sx - bw / 2;
    const by = sy - 26;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, sx, by + bh / 2);

    ctx.restore();
  }

  private drawHoverCursor(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    scale: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, Math.max(scale, 4), Math.max(scale, 4));

    // Crosshair ticks
    const tickLen = 6;
    ctx.beginPath();
    ctx.moveTo(sx - tickLen, sy + scale / 2);
    ctx.lineTo(sx, sy + scale / 2);

    ctx.moveTo(sx + scale, sy + scale / 2);
    ctx.lineTo(sx + scale + tickLen, sy + scale / 2);

    ctx.moveTo(sx + scale / 2, sy - tickLen);
    ctx.lineTo(sx + scale / 2, sy);

    ctx.moveTo(sx + scale / 2, sy + scale);
    ctx.lineTo(sx + scale / 2, sy + scale + tickLen);
    ctx.stroke();

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------------------------------------------------------------------------
  // DOM Mounting & UI Layout
  // ---------------------------------------------------------------------------
  private mountDOM(): void {
    this.unmountDOM();

    const container = document.createElement('div');
    container.id = 'worldMapOverlay';
    container.className = 'world-map-overlay';
    container.innerHTML = `
      <div class="world-map-backdrop" id="worldMapBackdrop"></div>
      
      <div class="world-map-window" role="dialog" aria-label="Bản đồ toàn cảnh Pokémon">
        <!-- Window Header -->
        <header class="world-map-header">
          <div class="world-map-header-left">
            <span class="world-map-compass-icon" aria-hidden="true">🧭</span>
            <div class="world-map-title-box">
              <h2 class="world-map-title">BẢN ĐỒ THẾ GIỚI</h2>
              <span class="world-map-subtitle">OVERWORLD TOWN MAP</span>
            </div>
            <div class="world-map-seed-pill">
              <span class="seed-icon">🌱</span>
              <span class="seed-text">Seed #${this.session?.seed ?? 101}</span>
            </div>
          </div>
          
          <div class="world-map-header-right">
            <button class="world-map-close-btn" id="btnWorldMapClose" title="Đóng bản đồ (ESC hoặc M)" aria-label="Đóng">
              ✕
            </button>
          </div>
        </header>

        <!-- Canvas Container -->
        <div class="world-map-canvas-container" id="worldMapCanvasContainer">
          <canvas id="worldMapCanvas" class="world-map-canvas"></canvas>

          <!-- Floating Top-Left HUD Card -->
          <div class="world-map-hud-card top-left" id="worldMapCoordsHud">
            <div class="hud-row primary">
              <span class="hud-icon">🚶</span>
              <span class="hud-label">Vị trí HLV:</span>
              <span class="hud-value" id="worldMapPlayerPos">X: ${this.session?.player.gx ?? 0}, Y: ${this.session?.player.gy ?? 0}</span>
            </div>
            <div class="hud-row secondary" id="worldMapHoverRow">
              <span class="hud-icon">🔍</span>
              <span class="hud-label">Con trỏ:</span>
              <span class="hud-value" id="worldMapHoverPos">Rê chuột lên bản đồ</span>
            </div>
          </div>

          <!-- Floating Top-Right Tools -->
          <div class="world-map-tools top-right">
            <button class="map-tool-btn" id="btnMapDebugV3" title="Bật/Tắt Hiển thị Vùng Thung Lũng & Hành Lang v3 (Phím V)" aria-label="V3 Debug">
              <span class="tool-icon">🧭</span>
              <span class="tool-text">V3 Debug</span>
            </button>
            <div class="tool-divider"></div>
            <button class="map-tool-btn" id="btnMapRecenter" title="Về vị trí người chơi (Phím H)" aria-label="Định vị">
              <span class="tool-icon">📍</span>
              <span class="tool-text">Vị trí</span>
            </button>
            <div class="tool-divider"></div>
            <button class="map-tool-btn icon-only" id="btnMapZoomIn" title="Phóng to (+)" aria-label="Phóng to">
              <span>+</span>
            </button>
            <span class="map-zoom-badge" id="mapZoomBadge">150%</span>
            <button class="map-tool-btn icon-only" id="btnMapZoomOut" title="Thu nhỏ (-)" aria-label="Thu nhỏ">
              <span>−</span>
            </button>
            <button class="map-tool-btn icon-only" id="btnMapZoomReset" title="Đặt lại 100%" aria-label="100%">
              <span>1x</span>
            </button>
          </div>

          <!-- Floating Bottom-Left Legend -->
          <div class="world-map-legend bottom-left">
            <div class="legend-title">CHÚ GIẢI ĐỊA HÌNH</div>
            <div class="legend-grid">
              <div class="legend-item"><span class="legend-color ocean-deep"></span> Đại dương</div>
              <div class="legend-item"><span class="legend-color ocean-shallow"></span> Vùng nước nông</div>
              <div class="legend-item"><span class="legend-color wetland"></span> Hồ & Sông nước ngọt</div>
              <div class="legend-item"><span class="legend-color sand"></span> Bãi cát vàng</div>
              <div class="legend-item"><span class="legend-color grass"></span> Đồng cỏ xanh</div>
              <div class="legend-item"><span class="legend-color hill"></span> Đồi đá / Vách núi</div>
              <div class="legend-item"><span class="legend-color road"></span> Đường mòn & Cầu</div>
              <div class="legend-item"><span class="legend-color village"></span> Điểm định cư</div>
              <div class="legend-item"><span class="legend-color v3-corridor"></span> Hành lang v3</div>
              <div class="legend-item"><span class="legend-color v3-core"></span> Lõi an toàn v3</div>
            </div>
          </div>

          <!-- Floating Bottom-Right Controls Hint -->
          <div class="world-map-hint bottom-right">
            <span>🖱️ Kéo để di chuyển • Cuộn để Zoom • [V] Bật/Tắt V3 Debug • [H] Về vị trí • [ESC/M] Đóng</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    this.container = container;

    this.canvas = container.querySelector<HTMLCanvasElement>('#worldMapCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.coordsDisplayEl = container.querySelector<HTMLElement>('#worldMapPlayerPos');
    this.hoverInfoEl = container.querySelector<HTMLElement>('#worldMapHoverPos');
    this.zoomDisplayEl = container.querySelector<HTMLElement>('#mapZoomBadge');

    this.bindEvents();
    this.updateHud();
  }

  private unmountDOM(): void {
    this.eventAbortController?.abort();
    this.eventAbortController = null;

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.staticLayerCanvas = null;
    this.staticLayerCtx = null;
    this.staticLayerKey = null;
    this.coordsDisplayEl = null;
    this.hoverInfoEl = null;
    this.zoomDisplayEl = null;
  }

  private handleResize = (): void => {
    if (!this.canvas || !this.container) return;
    const containerWrapper = this.container.querySelector('.world-map-canvas-container');
    if (!containerWrapper) return;

    const rect = containerWrapper.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width);
    this.canvas.height = Math.floor(rect.height);
    this.staticLayerKey = null;
  };

  private updateHud(): void {
    if (this.coordsDisplayEl && this.session) {
      this.coordsDisplayEl.textContent = `X: ${this.session.player.gx}, Y: ${this.session.player.gy}`;
    }

    if (this.zoomDisplayEl) {
      this.zoomDisplayEl.textContent = `${Math.round(this.zoom * 100)}%`;
    }

    if (this.hoverInfoEl && this.session) {
      if (!this.isHovering) {
        this.hoverInfoEl.textContent = 'Rê chuột lên bản đồ';
      } else {
        const info = this.inspectTile(this.hoverGX, this.hoverGY, this.session.field);
        let text = `X: ${info.gx}, Y: ${info.gy} • ${info.terrainName}${
          info.biomeName ? ` [${info.biomeName}]` : ''
        }${info.villageName ? ` (${info.villageName})` : ''}`;
        if (this.showV3Debug && info.safetyLevel !== undefined) {
          const sPct = Math.round(info.safetyLevel * 100);
          const cPct = Math.round((info.corridorInfluence ?? 0) * 100);
          text += ` • 🛡️ An toàn: ${sPct}% • 🧭 Hành lang: ${cPct}%`;
        }
        this.hoverInfoEl.textContent = text;
      }
    }
  }

  public inspectTile(gx: number, gy: number, field: TerrainField): MapHoverInfo {
    let terrainName = 'Đồng cỏ xanh';

    if (field.isHill(gx, gy)) {
      if (field.isDarkLand && field.isDarkLand(gx, gy)) {
        terrainName = field.isNearCliffEdge(gx, gy) ? 'Vách núi tối' : 'Đồi đất tối';
      } else if (field.isDesert && field.isDesert(gx, gy)) {
        terrainName = field.isNearCliffEdge(gx, gy) ? 'Vách cồn cát' : 'Cồn cát cao';
      } else {
        terrainName = field.isNearCliffEdge(gx, gy) ? 'Vách núi đá' : 'Đồi núi';
      }
    } else if (field.isOcean(gx, gy)) {
      terrainName = field.isNearWater(gx, gy, 2) ? 'Vùng nước ven bờ' : 'Đại dương sâu';
    } else if (field.isWater(gx, gy) || field.isLake(gx, gy)) {
      terrainName = field.isLake(gx, gy) ? 'Hồ nước ngọt' : 'Lòng sông nước ngọt';
    } else if (field.isSand(gx, gy)) {
      terrainName = 'Bờ cát vàng';
    } else if (field.isDesert && field.isDesert(gx, gy)) {
      terrainName = 'Sa mạc cằn cỗi';
    } else if (field.isDarkLand && field.isDarkLand(gx, gy)) {
      terrainName = 'Vùng đất tối hoang tàn';
    } else if (field.isBridge(gx, gy)) {
      terrainName = 'Cầu gỗ qua sông';
    } else if (field.isRoad(gx, gy)) {
      terrainName = 'Đường mòn đất nện';
    }

    const biomeKey = resolveWorldBiome(field, gx, gy);
    const biomeNames: Record<string, string> = {
      wetland: 'Hồ & Sông nước ngọt (Wetland)',
      coast: 'Vùng duyên hải (Coast)',
      dark_land: 'Vùng đất bóng tối (Dark Land)',
      dryland: 'Vùng cằn cỗi (Dryland)',
      desert: 'Sa mạc (Desert)',
      dense_forest: 'Rừng rậm (Dense Forest)',
      light_forest: 'Rừng thưa (Light Forest)',
      meadow: 'Đồng cỏ (Meadow)',
      hill_edge: 'Chân đồi / Vách đá (Hill Edge)',
    };
    const biomeName = biomeNames[biomeKey] ?? biomeKey;

    // Check if inside any known village
    const regionSize = V0_CONFIG.REGION_TILES;
    const rx = Math.floor(gx / regionSize);
    const ry = Math.floor(gy / regionSize);
    const candidateVillage = getSettlementForRegion(rx, ry, field);
    const starterVillage = getStartVillagePlacement(field.seed);

    let villageName: string | undefined;
    if (
      starterVillage.bounds &&
      gx >= starterVillage.bounds.minGX &&
      gx <= starterVillage.bounds.maxGX &&
      gy >= starterVillage.bounds.minGY &&
      gy <= starterVillage.bounds.maxGY
    ) {
      villageName = starterVillage.name;
    } else if (
      candidateVillage &&
      candidateVillage.bounds &&
      gx >= candidateVillage.bounds.minGX &&
      gx <= candidateVillage.bounds.maxGX &&
      gy >= candidateVillage.bounds.minGY &&
      gy <= candidateVillage.bounds.maxGY
    ) {
      villageName = candidateVillage.name;
    }

    let safetyLevel: number | undefined;
    let corridorInfluence: number | undefined;
    const v3Field = field as TerrainField & {
      getSafetyLevel?: (gx: number, gy: number) => number;
      getCorridorInfluence?: (gx: number, gy: number) => number;
    };
    if (
      field.version === 3 &&
      typeof v3Field.getSafetyLevel === 'function' &&
      typeof v3Field.getCorridorInfluence === 'function'
    ) {
      safetyLevel = v3Field.getSafetyLevel(gx, gy);
      corridorInfluence = v3Field.getCorridorInfluence(gx, gy);
    }

    return {
      gx,
      gy,
      terrainName,
      biomeName,
      villageName,
      safetyLevel,
      corridorInfluence,
    };
  }

  // ---------------------------------------------------------------------------
  // Event Bindings
  // ---------------------------------------------------------------------------
  private bindEvents(): void {
    if (!this.container || !this.canvas) return;

    this.eventAbortController?.abort();
    const controller = new AbortController();
    this.eventAbortController = controller;
    const listenerOptions: AddEventListenerOptions = { signal: controller.signal };

    // Close buttons & backdrop click
    const btnClose = this.container.querySelector('#btnWorldMapClose');
    btnClose?.addEventListener('click', () => this.close(), listenerOptions);

    const backdrop = this.container.querySelector('#worldMapBackdrop');
    backdrop?.addEventListener('click', () => this.close(), listenerOptions);

    // Tools
    const btnDebugV3 = this.container.querySelector('#btnMapDebugV3');
    btnDebugV3?.addEventListener('click', () => this.toggleV3Debug(), listenerOptions);

    const btnRecenter = this.container.querySelector('#btnMapRecenter');
    btnRecenter?.addEventListener('click', () => this.recenterOnPlayer(), listenerOptions);

    const btnZoomIn = this.container.querySelector('#btnMapZoomIn');
    btnZoomIn?.addEventListener('click', () => this.setZoom(this.zoom * 1.3), listenerOptions);

    const btnZoomOut = this.container.querySelector('#btnMapZoomOut');
    btnZoomOut?.addEventListener('click', () => this.setZoom(this.zoom / 1.3), listenerOptions);

    const btnZoomReset = this.container.querySelector('#btnMapZoomReset');
    btnZoomReset?.addEventListener('click', () => this.setZoom(1.0), listenerOptions);

    // Mouse Pan & Drag
    this.canvas.addEventListener(
      'mousedown',
      (e) => {
        if (e.button !== 0) return; // Only left click
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragCenterStartX = this.centerX;
        this.dragCenterStartY = this.centerY;
        if (this.canvas) this.canvas.style.cursor = 'grabbing';
      },
      listenerOptions
    );

    window.addEventListener(
      'mousemove',
      (e) => {
        if (this.isDragging && this.canvas) {
          const deltaX = e.clientX - this.dragStartX;
          const deltaY = e.clientY - this.dragStartY;
          const scale = 2 * this.zoom;

          this.centerX = this.dragCenterStartX - deltaX / scale;
          this.centerY = this.dragCenterStartY - deltaY / scale;
          this.updateHud();
        }

        // Compute hovered world tile
        if (this.canvas && this.visible) {
          const rect = this.canvas.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            this.isHovering = true;
            const mouseCanvasX = e.clientX - rect.left;
            const mouseCanvasY = e.clientY - rect.top;
            const scale = 2 * this.zoom;
            const halfW = this.canvas.width / 2;
            const halfH = this.canvas.height / 2;

            this.hoverGX = Math.floor(this.centerX + (mouseCanvasX - halfW) / scale);
            this.hoverGY = Math.floor(this.centerY + (mouseCanvasY - halfH) / scale);
            this.updateHud();
          } else {
            this.isHovering = false;
          }
        }
      },
      listenerOptions
    );

    window.addEventListener(
      'mouseup',
      () => {
        if (this.isDragging) {
          this.isDragging = false;
          if (this.canvas) this.canvas.style.cursor = 'grab';
        }
      },
      listenerOptions
    );

    // Zoom on wheel (Zoom-to-cursor)
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        this.setZoom(this.zoom * factor, e.clientX, e.clientY);
      },
      { passive: false, signal: controller.signal }
    );

    // Double click to zoom in at location
    this.canvas.addEventListener(
      'dblclick',
      (e) => {
        this.setZoom(this.zoom * 1.5, e.clientX, e.clientY);
      },
      listenerOptions
    );

    // Resize listener
    window.addEventListener('resize', this.handleResize, listenerOptions);

    // Keyboard handlers (Home, H to recenter)
    window.addEventListener('keydown', this.handleKeyDown, listenerOptions);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.visible) return;

    if (e.code === 'KeyM' || e.code === 'Escape') {
      this.close();
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (e.code === 'KeyV') {
      this.toggleV3Debug();
      e.preventDefault();
      return;
    }

    if (e.code === 'KeyH' || e.code === 'Home') {
      this.recenterOnPlayer();
      e.preventDefault();
      return;
    }

    // Keyboard panning
    const step = 16 / this.zoom;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.centerX -= step;
      this.updateHud();
      e.preventDefault();
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.centerX += step;
      this.updateHud();
      e.preventDefault();
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
      this.centerY -= step;
      this.updateHud();
      e.preventDefault();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.centerY += step;
      this.updateHud();
      e.preventDefault();
    } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      this.setZoom(this.zoom * 1.2);
      e.preventDefault();
    } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      this.setZoom(this.zoom / 1.2);
      e.preventDefault();
    }
  };

  public toggleV3Debug(): void {
    this.showV3Debug = !this.showV3Debug;
    const btn = this.container?.querySelector('#btnMapDebugV3');
    if (btn) {
      btn.classList.toggle('active', this.showV3Debug);
    }
    this.updateHud();
  }
}

export const worldMapScreen = new WorldMapScreen();
