import type { Camera } from '../core/camera';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { ChunkManager } from '../maps/chunk-manager';
import type { AssetLoader } from './asset-loader';
import { type RenderItem, type RenderOptions, DEFAULT_RENDER_OPTIONS } from './types';
import { GroundRenderer } from './ground-renderer';
import { ObjectRenderer } from './object-renderer';
import { CharacterRenderer } from './character-renderer';
import { DebugRenderer } from './debug-renderer';

export * from './types';
export * from './ground-renderer';
export * from './object-renderer';
export * from './character-renderer';
export * from './debug-renderer';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: RenderOptions = { ...DEFAULT_RENDER_OPTIONS };

  private groundRenderer: GroundRenderer;
  private objectRenderer: ObjectRenderer;
  private characterRenderer: CharacterRenderer;
  private debugRenderer: DebugRenderer;

  private berryCycleSeconds = 60;
  private berryStageOverride: number | null = null;

  constructor(canvas: HTMLCanvasElement, loader: AssetLoader) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.groundRenderer = new GroundRenderer(loader);
    this.objectRenderer = new ObjectRenderer(loader);
    this.characterRenderer = new CharacterRenderer(loader);
    this.debugRenderer = new DebugRenderer();
  }

  public setOptions(opts: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...opts };
    this.groundRenderer.clearCache();
  }

  public getOptions(): RenderOptions {
    return this.options;
  }

  public setBerryCycle(sec: number): void {
    this.berryCycleSeconds = sec;
  }

  public getBerryCycle(): number {
    return this.berryCycleSeconds;
  }

  public setBerryStageOverride(stage: number | null): void {
    this.berryStageOverride = stage;
  }

  public getBerryStageOverride(): number | null {
    return this.berryStageOverride;
  }

  public clearCache(): void {
    this.groundRenderer.clearCache();
  }

  public render(
    camera: Camera,
    player: Player,
    follower: Follower,
    chunkManager: ChunkManager
  ): void {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const now = performance.now();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    camera.applyTransform(ctx, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    const bounds = camera.getVisibleBounds(canvas.width, canvas.height);

    // 0. Render Live Animated Water Waves (Layer -0.1)
    if (this.options.showWater) {
      this.groundRenderer.renderWaterTiles(ctx, bounds, chunkManager, now, this.options);
    }

    // 1. Render Pre-baked Ground Tiles (Layer 0)
    this.groundRenderer.renderGroundTiles(ctx, bounds, chunkManager, this.options);

    // 1.5. Render Tree & Palm Shadows seamlessly across chunk boundaries (Layer 0.1)
    if (this.options.showTrees) {
      this.groundRenderer.renderTreeShadows(ctx, bounds, chunkManager);
    }

    // 2. Render Heatmap if enabled
    if (this.options.showHeatmap) {
      this.debugRenderer.renderHeatmap(ctx, bounds, chunkManager);
    }
    if (this.options.showEcologyMoisture) {
      this.debugRenderer.renderEcologyMoisture(ctx, bounds, chunkManager);
    }
    if (this.options.showEcologyFertility) {
      this.debugRenderer.renderEcologyFertility(ctx, bounds, chunkManager);
    }
    if (this.options.showEcologyDensity) {
      this.debugRenderer.renderEcologyDensity(ctx, bounds, chunkManager);
    }
    if (this.options.showEcologyZone) {
      this.debugRenderer.renderEcologyZone(ctx, bounds, chunkManager);
    }

    // 3. Render Tall Grass Patches (Layer 0.5)
    if (this.options.showTallGrass) {
      this.groundRenderer.renderTallGrassPatches(ctx, bounds, chunkManager, player, follower, now);
    }

    // 4. Render 32px Grid if enabled
    if (this.options.showGrid) {
      this.debugRenderer.renderTileGrid(ctx, bounds);
    }

    // 5. Collect 2.5D Entities for Y-Sorting (Layer 1)
    const renderList: RenderItem[] = [];

    // Animated Foliage
    if (this.options.showPlants) {
      this.objectRenderer.collectFoliage(bounds, chunkManager, now, renderList);
    }

    // Freshwater Surface Flora (Water Lilies & Floating Pads)
    if (this.options.showWater && this.options.showPlants) {
      this.objectRenderer.collectWaterFlora(bounds, chunkManager, now, renderList);
    }

    // Berry Bushes
    if (this.options.showBerries) {
      this.objectRenderer.collectBerryBushes(
        bounds,
        chunkManager,
        now,
        this.berryCycleSeconds,
        this.berryStageOverride,
        renderList
      );
    }

    // Trees
    if (this.options.showTrees) {
      this.objectRenderer.collectTrees(bounds, chunkManager, renderList);
    }

    // Village Buildings
    if (this.options.showVillages) {
      this.objectRenderer.collectBuildings(bounds, chunkManager, renderList);
    }

    // Shadows
    this.characterRenderer.collectShadows(player, follower, renderList);

    // Follower (Pikachu)
    this.characterRenderer.collectFollower(follower, renderList);

    // Player (Red)
    this.characterRenderer.collectPlayer(player, renderList);

    // Wild Pokemon
    this.characterRenderer.collectWildPokemon(bounds, chunkManager, renderList);

    // GBA Tall Grass Foot Wading
    if (this.options.showTallGrass) {
      this.objectRenderer.collectTallGrassForeground(
        chunkManager,
        player,
        follower,
        now,
        renderList
      );
    }

    // Sort by Y-coordinate and execute draw calls
    renderList.sort((a, b) => a.ySort - b.ySort);
    for (const item of renderList) {
      item.draw(ctx);
    }

    // 6. Hitboxes if enabled
    if (this.options.showHitbox) {
      this.debugRenderer.renderHitboxes(ctx, bounds, chunkManager, player);
    }

    // 7. Chunk Boundaries & Badges
    if (this.options.showChunkGrid) {
      this.debugRenderer.renderChunkBoundaries(ctx, bounds, chunkManager);
    }

    ctx.restore();
  }
}
