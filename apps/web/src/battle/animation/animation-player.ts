import type { BattleAnimationRequest, BattleAnimationInstance } from './types';
import { ANIMATION_REGISTRY } from './animation-registry';
import { ANIMATION_ASSETS } from './animation-assets';
import { CoordinateTransformer } from './coordinate-transformer';
import { CelRenderer } from './cel-renderer';
import { LayerManager } from './layer-manager';
import { TimingEventManager } from './timing-events';

export class BattleAnimationPlayer {
  private currentInstance: BattleAnimationInstance | null = null;
  private timingManager: TimingEventManager = new TimingEventManager();
  private hitTriggered = false;

  /**
   * Starts playing an animation request asynchronously.
   * Pre-resolves definition from registry and loads graphics safely without blocking.
   */
  public async play(request: BattleAnimationRequest): Promise<BattleAnimationInstance | null> {
    const isEnemy = request.userSide === 'enemy';
    const animId = ANIMATION_REGISTRY.resolveAnimationId(
      request.moveId,
      isEnemy,
      request.moveType,
      request.moveCategory
    );

    const definition = await ANIMATION_REGISTRY.getDefinition(animId);
    if (!definition || !definition.frames || definition.frames.length === 0) {
      console.warn(
        `[BattleAnimationPlayer] No frames found for animation ID: ${animId} (${request.moveId})`
      );
      request.onHit?.();
      request.onComplete?.();
      return null;
    }

    // Preload spritesheet if defined
    if (definition.graphic) {
      await ANIMATION_ASSETS.loadImage(definition.graphic);
    }

    const fps = definition.fps || 20;
    const totalDurationMs = (definition.frames.length / fps) * 1000;

    this.timingManager.reset();
    this.hitTriggered = false;

    const instance: BattleAnimationInstance = {
      id: `anim_${animId}_${Date.now()}`,
      definition,
      request,
      isPlaying: true,
      currentFrame: 0,
      elapsedMs: 0,
      totalDurationMs,
    };

    this.currentInstance = instance;

    // Trigger initial frame 0 timings
    this.timingManager.triggerFrameTimings(0, definition.timings);

    return instance;
  }

  /**
   * Time-based delta update, completely independent of display refresh rate (60/120/144Hz).
   */
  public update(dtMs: number): void {
    if (!this.currentInstance || !this.currentInstance.isPlaying) {
      return;
    }

    const inst = this.currentInstance;
    inst.elapsedMs += dtMs;

    const fps = inst.definition.fps || 20;
    const frameIndex = Math.floor((inst.elapsedMs / 1000) * fps);

    // Mid-animation hit trigger (~40% duration if not already triggered)
    if (!this.hitTriggered && inst.elapsedMs >= inst.totalDurationMs * 0.4) {
      this.hitTriggered = true;
      inst.request.onHit?.();
    }

    if (frameIndex >= inst.definition.frames.length) {
      // Completed animation
      inst.currentFrame = inst.definition.frames.length - 1;
      inst.isPlaying = false;
      if (!this.hitTriggered) {
        this.hitTriggered = true;
        inst.request.onHit?.();
      }
      inst.request.onComplete?.();
      this.currentInstance = null;
      return;
    }

    if (frameIndex !== inst.currentFrame) {
      inst.currentFrame = frameIndex;
      this.timingManager.updateFlashes();
      this.timingManager.triggerFrameTimings(frameIndex, inst.definition.timings);
    }
  }

  public isPlaying(): boolean {
    return this.currentInstance !== null && this.currentInstance.isPlaying;
  }

  public getCurrentInstance(): BattleAnimationInstance | null {
    return this.currentInstance;
  }

  public stop(): void {
    if (this.currentInstance) {
      this.currentInstance.isPlaying = false;
      this.currentInstance.request.onComplete?.();
      this.currentInstance = null;
    }
    this.timingManager.reset();
  }

  /**
   * Renders cels designated behind battlers (priority 0 and 2).
   */
  public renderBehind(
    ctx: CanvasRenderingContext2D,
    canvasWidth = CoordinateTransformer.DEFAULT_CANVAS_WIDTH,
    canvasHeight = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT
  ): void {
    if (!this.currentInstance || !this.currentInstance.isPlaying) {
      return;
    }

    const inst = this.currentInstance;
    const frame = inst.definition.frames[inst.currentFrame];
    if (!frame) return;

    const isEnemy = inst.request.userSide === 'enemy';
    const graphic = inst.definition.graphic;
    const { behindBattlers } = LayerManager.categorizeCels(frame.cels);

    for (const cel of behindBattlers) {
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.x,
        cel.y,
        cel.focus,
        inst.request.userPos,
        inst.request.targetPos,
        canvasWidth,
        canvasHeight,
        isEnemy,
        inst.request.selfTarget
      );
      CelRenderer.renderCel(ctx, cel, pos.x, pos.y, graphic, isEnemy, canvasWidth, canvasHeight);
    }
  }

  /**
   * Renders cels designated above battlers (priority 1 and 3) plus screen flashes.
   */
  public renderAbove(
    ctx: CanvasRenderingContext2D,
    canvasWidth = CoordinateTransformer.DEFAULT_CANVAS_WIDTH,
    canvasHeight = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT
  ): void {
    if (!this.currentInstance || !this.currentInstance.isPlaying) {
      return;
    }

    const inst = this.currentInstance;
    const frame = inst.definition.frames[inst.currentFrame];
    if (!frame) return;

    const isEnemy = inst.request.userSide === 'enemy';
    const graphic = inst.definition.graphic;
    const { aboveBattlers } = LayerManager.categorizeCels(frame.cels);

    for (const cel of aboveBattlers) {
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.x,
        cel.y,
        cel.focus,
        inst.request.userPos,
        inst.request.targetPos,
        canvasWidth,
        canvasHeight,
        isEnemy,
        inst.request.selfTarget
      );
      CelRenderer.renderCel(ctx, cel, pos.x, pos.y, graphic, isEnemy, canvasWidth, canvasHeight);
    }

    // Render screen flashes
    this.timingManager.renderScreenFlash(ctx, canvasWidth, canvasHeight);
  }

  /**
   * Renders the current animation frame to canvas context (both behind and above layers).
   */
  public render(
    ctx: CanvasRenderingContext2D,
    canvasWidth = CoordinateTransformer.DEFAULT_CANVAS_WIDTH,
    canvasHeight = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT
  ): void {
    this.renderBehind(ctx, canvasWidth, canvasHeight);
    this.renderAbove(ctx, canvasWidth, canvasHeight);
  }

  public dispose(): void {
    this.stop();
  }
}

export const battleAnimationPlayer = new BattleAnimationPlayer();
