import type { GameSession } from '../../../game/game-session';
import { resolveWorldBiome } from '../../../maps/ecology';
import type { MinimapState, MinimapPlayerMarker } from './minimap-types';
import {
  createDefaultMinimapState,
  markChunkDiscoveredInState,
  updateViewportInState,
} from './minimap-state';
import { MinimapRenderer } from './minimap-renderer';
import type { ChunkReader, MinimapCache } from './minimap-cache';

export interface MinimapControllerOptions {
  onOpenWorldMap?: () => void;
  renderer?: MinimapRenderer;
}

/**
 * MinimapController
 *
 * Coordinates lifecycle, DOM elements, player tracking and deterministic discovery
 * for the overworld mini-map HUD.
 */
export class MinimapController {
  private state: MinimapState;
  private renderer: MinimapRenderer;
  private session: GameSession | null = null;
  private host: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private coordsEl: HTMLElement | null = null;
  private biomeEl: HTMLElement | null = null;
  private onOpenWorldMap?: () => void;
  private temporarilyHidden = false;

  private lastGX: number = -999999;
  private lastGY: number = -999999;
  private lastDir: number = -1;
  private abortController: AbortController | null = null;

  constructor(options?: MinimapControllerOptions) {
    this.state = createDefaultMinimapState();
    this.renderer = options?.renderer ?? new MinimapRenderer();
    this.onOpenWorldMap = options?.onOpenWorldMap;
  }

  public getState(): MinimapState {
    return this.state;
  }

  public getRenderer(): MinimapRenderer {
    return this.renderer;
  }

  public getCache(): MinimapCache {
    return this.renderer.getCache();
  }

  public getHost(): HTMLElement | null {
    return this.host;
  }

  public setOnOpenWorldMap(callback: () => void): void {
    this.onOpenWorldMap = callback;
  }

  /**
   * Mounts the minimap DOM structure to the specified host.
   */
  public mount(host: HTMLElement): void {
    this.host = host;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const wrap = document.createElement('div');
    wrap.id = 'overworldMinimap';
    wrap.className = 'overworld-minimap';
    wrap.setAttribute('aria-label', 'Bản đồ thu nhỏ (Mini-map)');

    // Header bar with Biome Name, Coords, and Fullscreen Map button
    const header = document.createElement('div');
    header.className = 'minimap-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'minimap-title-wrap';

    const biomeSpan = document.createElement('span');
    biomeSpan.className = 'minimap-biome';
    biomeSpan.textContent = 'Khởi đầu';
    this.biomeEl = biomeSpan;

    const coordsSpan = document.createElement('span');
    coordsSpan.className = 'minimap-coords';
    coordsSpan.textContent = 'X: 0 Y: 0';
    this.coordsEl = coordsSpan;

    titleWrap.appendChild(biomeSpan);
    titleWrap.appendChild(coordsSpan);

    const btnExpand = document.createElement('button');
    btnExpand.id = 'btnMinimapExpand';
    btnExpand.className = 'minimap-expand-btn';
    btnExpand.title = 'Mở bản đồ thế giới (Phím M)';
    btnExpand.innerHTML = '🗺️';
    btnExpand.setAttribute('aria-label', 'Mở bản đồ toàn cảnh');

    btnExpand.addEventListener(
      'click',
      (e) => {
        e.stopPropagation();
        this.onOpenWorldMap?.();
      },
      { signal }
    );

    header.appendChild(titleWrap);
    header.appendChild(btnExpand);

    // Canvas container
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'minimap-canvas-wrap';

    const canvas = this.renderer.getDisplayCanvas();
    canvas.id = 'minimapCanvas';
    canvas.className = 'minimap-canvas';
    canvas.title = 'Nhấp để mở bản đồ thế giới';

    canvas.addEventListener(
      'click',
      () => {
        this.onOpenWorldMap?.();
      },
      { signal }
    );

    canvasWrap.appendChild(canvas);

    wrap.appendChild(header);
    wrap.appendChild(canvasWrap);

    host.appendChild(wrap);
    this.container = wrap;

    // Apply visibility state, including modal occlusion.
    this.updateDomVisibility();

    // Initial render if session is already bound
    if (this.session) {
      this.render();
    }
  }

  public setVisible(visible: boolean): void {
    this.state.visible = visible;
    this.updateDomVisibility();
    if (visible && !this.temporarilyHidden && this.session) {
      this.render();
    }
  }

  public setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    this.updateDomVisibility();
  }

  public setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.5, Math.min(3, zoom));
    this.renderer.setZoom(this.state.zoom);
    this.renderer.markStaticDirty();
    this.render();
  }

  /** Temporarily hides the HUD while a higher-priority screen is active. */
  public setModalHidden(hidden: boolean): void {
    if (this.temporarilyHidden === hidden) return;
    this.temporarilyHidden = hidden;
    this.updateDomVisibility();
  }

  public toggle(): void {
    this.setVisible(!this.state.visible);
  }

  public forceRefresh(): void {
    this.lastGX = -999999;
    this.lastGY = -999999;
    this.lastDir = -1;
    this.renderer.markStaticDirty();
    this.render();
  }

  /**
   * Sets or updates the active GameSession.
   * Clears old seed cache and auto-discovers player's initial surroundings.
   */
  public setSession(session: GameSession | null): void {
    this.session = session;
    if (!session) {
      this.renderer.getCache().clear();
      this.state = createDefaultMinimapState({
        enabled: this.state.enabled,
        visible: this.state.visible,
        zoom: this.state.zoom,
      });
      return;
    }

    // Changing seed clears cache of the old seed
    this.renderer.getCache().setWorld(session.seed, session.field.version);

    // Reveal the gameplay chunks already held by ChunkManager. This gives the
    // player a useful local map without forcing generation of new chunks.
    const p = session.player;
    const startCX = Math.floor(p.gx / 16);
    const startCY = Math.floor(p.gy / 16);
    this.state = markChunkDiscoveredInState(this.state, startCX, startCY);
    this.discoverLoadedChunks();

    this.renderer.markStaticDirty();
    this.updatePlayer(p.gx, p.gy, p.direction);
  }

  /**
   * Explicitly marks a chunk as discovered.
   */
  public markChunkDiscovered(cx: number, cy: number): void {
    this.state = markChunkDiscoveredInState(this.state, cx, cy);
    this.renderer.markStaticDirty();
    if (this.state.visible && this.session) {
      this.render();
    }
  }

  /**
   * Updates player marker and handles discovery when player changes tile or direction.
   */
  public updatePlayer(gx: number, gy: number, direction: number): void {
    const tileChanged = gx !== this.lastGX || gy !== this.lastGY;
    const dirChanged = direction !== this.lastDir;

    if (!tileChanged && !dirChanged) {
      return;
    }

    this.lastGX = gx;
    this.lastGY = gy;
    this.lastDir = direction;

    this.state = updateViewportInState(this.state, gx, gy);

    // Include the nearby chunks already loaded by the gameplay stream.
    const cx = Math.floor(gx / 16);
    const cy = Math.floor(gy / 16);
    this.state = markChunkDiscoveredInState(this.state, cx, cy);
    this.discoverLoadedChunks();

    // Update HUD text if elements exist
    if (this.coordsEl) {
      this.coordsEl.textContent = `X: ${gx} Y: ${gy}`;
    }
    if (this.biomeEl && this.session) {
      const biomeKey = resolveWorldBiome(this.session.field, gx, gy);
      const biomeNames: Record<string, string> = {
        meadow: 'Đồng Cỏ',
        dense_forest: 'Rừng Rậm',
        light_forest: 'Rừng Thưa',
        autumn: 'Rừng Phong',
        dark_land: 'Vùng Tối',
        dryland: 'Sa Mạc',
        wetland: 'Vùng Đầm Lầy',
        coast: 'Bờ Biển',
      };
      this.biomeEl.textContent = biomeNames[biomeKey] ?? 'Đồng Quê';
    }

    if (this.state.visible && this.session) {
      this.render();
    }
  }

  /**
   * Performs render pass:
   * Redraws static layer if dirty or chunk changed, then dynamic markers.
   */
  public render(): void {
    if (!this.session) return;

    const currentCX = Math.floor(this.state.viewport.centerGX / 16);
    const currentCY = Math.floor(this.state.viewport.centerGY / 16);

    if (this.renderer.shouldRedrawStatic(currentCX, currentCY, this.state.discoveredChunks.size)) {
      this.renderer.renderStatic(
        this.state.viewport,
        this.state.discoveredChunks,
        this.session.seed,
        this.session.field,
        this.getLoadedChunkReader()
      );
    }

    const playerMarker: MinimapPlayerMarker = {
      gx: this.state.viewport.centerGX,
      gy: this.state.viewport.centerGY,
      direction: this.lastDir >= 0 ? this.lastDir : this.session.player.direction,
    };

    let followerMarker: MinimapPlayerMarker | undefined;
    if (this.session.follower && this.session.follower.visible) {
      followerMarker = {
        gx: this.session.follower.gx,
        gy: this.session.follower.gy,
        direction: 0,
      };
    }

    this.renderer.renderDynamic(this.state.viewport, playerMarker, followerMarker);
  }

  /**
   * Destroys the controller, removing listeners, DOM nodes, and cleaning references.
   */
  public destroy(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.host = null;
    this.coordsEl = null;
    this.biomeEl = null;

    this.renderer.destroy();
    this.session = null;
  }

  private updateDomVisibility(): void {
    if (this.container) {
      this.container.style.display =
        this.state.visible && this.state.enabled && !this.temporarilyHidden ? '' : 'none';
    }
  }

  private discoverLoadedChunks(): void {
    if (!this.session) return;

    let nextState = this.state;
    for (const chunk of this.session.chunkManager.cache.values()) {
      nextState = markChunkDiscoveredInState(nextState, chunk.cx, chunk.cy);
    }

    if (nextState !== this.state) {
      this.state = nextState;
      this.renderer.markStaticDirty();
    }
  }

  private getLoadedChunkReader(): ChunkReader {
    const loadedChunks = this.session?.chunkManager.cache;
    return {
      // Do not call ChunkManager.getChunk here: that method generates missing
      // gameplay chunks. The mini-map must inspect the cache only.
      getChunk: (cx, cy) => {
        const chunk = loadedChunks?.get(cx + ',' + cy);
        if (!chunk) return undefined;
        return {
          tileIdGrid: chunk.tileIdGrid,
          terrainGrid: chunk.terrainGrid,
        };
      },
    };
  }
}
