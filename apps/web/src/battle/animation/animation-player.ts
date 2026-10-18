import type { BattleAnimationRequest, BattleAnimationInstance, AnimationViewport } from './types';
import { ANIMATION_REGISTRY } from './animation-registry';
import { ANIMATION_ASSETS } from './animation-assets';
import { CoordinateTransformer } from './coordinate-transformer';
import { CelRenderer } from './cel-renderer';
import { LayerManager } from './layer-manager';
import { TimingEventManager } from './timing-events';
import {
  isKnownDuplicateAnimationCel,
  shouldPreserveAnimationCurve,
  deduplicateAnimationCels,
} from './animation-overrides';
import { battleCameraManager } from './battle-camera';

export class BattleAnimationPlayer {
  private currentInstance: BattleAnimationInstance | null = null;
  private timingManager: TimingEventManager = new TimingEventManager();
  private hitTriggered = false;
  private completeTriggered = false;

  /**
   * Baneful Bunker pattern 11 is a full-cell green texture. BattleRenderer
   * renders it through the Pokémon alpha mask so the rectangle cannot leak
   * outside the battler silhouette.
   */
  private isBattlerMaskedCel(instance: BattleAnimationInstance, pattern: number): boolean {
    const moveId = instance.request.moveId.toLowerCase().replace(/[\s-]+/g, '_');
    return moveId === 'baneful_bunker' && pattern === 11;
  }

  private triggerHit(request: BattleAnimationRequest): void {
    if (!this.hitTriggered) {
      this.hitTriggered = true;
      try {
        const isPhysical = request.moveCategory === 'physical';
        battleCameraManager.triggerImpactShake(isPhysical ? 6 : 4);
        request.onHit?.();
      } catch (err) {
        console.error('[BattleAnimationPlayer] Error in onHit callback:', err);
      }
    }
  }

  private triggerComplete(request: BattleAnimationRequest): void {
    if (!this.completeTriggered) {
      this.completeTriggered = true;
      this.triggerHit(request);
      try {
        request.onComplete?.();
      } catch (err) {
        console.error('[BattleAnimationPlayer] Error in onComplete callback:', err);
      }
    }
  }

  /**
   * Starts playing an animation request asynchronously.
   * Pre-resolves definition from registry and loads graphics safely without blocking.
   */
  public async play(request: BattleAnimationRequest): Promise<BattleAnimationInstance | null> {
    const isEnemy = request.userSide === 'enemy';
    const animId =
      request.animId ??
      ANIMATION_REGISTRY.resolveAnimationId(
        request.moveId,
        isEnemy,
        request.moveType,
        request.moveCategory,
        request.hitNum ?? 0
      );

    const definition = await ANIMATION_REGISTRY.getDefinition(animId);
    if (!definition || !definition.frames || definition.frames.length === 0) {
      console.warn(
        `[BattleAnimationPlayer] No frames found for animation ID: ${animId} (${request.moveId})`
      );
      this.hitTriggered = false;
      this.completeTriggered = false;
      this.triggerComplete(request);
      return null;
    }

    // Preload spritesheet safely if defined (continue gracefully if asset is missing)
    const graphics = new Set<string>([
      definition.graphic,
      ...definition.frames.flatMap((frame) =>
        frame.cels.flatMap((cel) => (cel.graphic ? [cel.graphic] : []))
      ),
    ]);
    for (const graphic of graphics) {
      try {
        await ANIMATION_ASSETS.loadImage(graphic);
      } catch (err) {
        console.warn(`[BattleAnimationPlayer] Could not preload asset '${graphic}':`, err);
      }
    }

    const fps = definition.fps || 20;
    const totalDurationMs = (definition.frames.length / fps) * 1000;

    this.timingManager.reset();
    this.hitTriggered = false;
    this.completeTriggered = false;

    const isOppMove =
      isEnemy &&
      ANIMATION_REGISTRY.isOpponentAnimation(animId, definition.name);

    const instance: BattleAnimationInstance = {
      id: `anim_${animId}_${Date.now()}`,
      definition,
      request,
      isPlaying: true,
      currentFrame: 0,
      elapsedMs: 0,
      totalDurationMs,
      isOppMove,
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
      this.triggerHit(inst.request);
    }

    if (frameIndex >= inst.definition.frames.length) {
      // Completed animation
      inst.currentFrame = inst.definition.frames.length - 1;
      inst.isPlaying = false;
      this.triggerComplete(inst.request);
      this.currentInstance = null;
      return;
    }

    if (frameIndex > inst.currentFrame) {
      for (let f = inst.currentFrame + 1; f <= frameIndex; f++) {
        this.timingManager.triggerFrameTimings(f, inst.definition.timings);
      }
      inst.currentFrame = frameIndex;
      this.timingManager.updateFlashes();
    }
  }

  public isPlaying(): boolean {
    return this.currentInstance !== null && this.currentInstance.isPlaying;
  }

  /** Returns the active animation tint for the requested battler, if any. */
  public getBattlerFlashColor(isTarget: boolean): [number, number, number, number] | null {
    return this.timingManager.getActiveBattlerFlashes(isTarget);
  }

  /**
   * Returns the active animation tint for the specified side ('player' | 'enemy').
   * Dynamically resolves whether the side is the target or the user based on
   * instance.request.userSide and instance.request.selfTarget.
   */
  public getBattlerFlashColorForSide(side: 'player' | 'enemy'): [number, number, number, number] | null {
    if (!this.currentInstance || !this.currentInstance.isPlaying) {
      return null;
    }
    const req = this.currentInstance.request;
    const attackerSide = req.userSide ?? 'player';
    const isAttacker = side === attackerSide;
    const isDefender = !isAttacker;
    const isSelfTarget = Boolean(req.selfTarget);

    // If self-targeted move (e.g. Dragon Dance, Recover, Swords Dance):
    // Only the attacker receives the flashes (both scope 2 user flashes and scope 1 target flashes).
    if (isSelfTarget) {
      if (!isAttacker) return null;
      return (
        this.timingManager.getActiveBattlerFlashes(false) ??
        this.timingManager.getActiveBattlerFlashes(true)
      );
    }

    // Normal offensive / targeted move:
    // Defender receives scope 1 (target hit flashes)
    // Attacker receives scope 2 (user charge flashes)
    if (isDefender) {
      return this.timingManager.getActiveBattlerFlashes(true);
    } else {
      return this.timingManager.getActiveBattlerFlashes(false);
    }
  }

  public getCurrentInstance(): BattleAnimationInstance | null {
    return this.currentInstance;
  }

  public getProgress(): number {
    if (!this.currentInstance || !this.currentInstance.isPlaying || this.currentInstance.totalDurationMs <= 0) {
      return 0;
    }
    return Math.min(1, Math.max(0, this.currentInstance.elapsedMs / this.currentInstance.totalDurationMs));
  }

  public getActiveMoveType(): string | undefined {
    return this.currentInstance?.request.moveType;
  }

  public getActiveUserSide(): 'player' | 'enemy' | undefined {
    return this.currentInstance?.request.userSide;
  }

  public getActiveUserPos(): { x: number; y: number } | undefined {
    return this.currentInstance?.request.userPos;
  }

  public getActiveTargetPos(): { x: number; y: number } | undefined {
    return this.currentInstance?.request.targetPos;
  }

  public stop(): void {
    if (this.currentInstance) {
      this.currentInstance.isPlaying = false;
      this.triggerComplete(this.currentInstance.request);
      this.currentInstance = null;
    }
    this.timingManager.reset();
  }

  private resolveViewport(
    viewportOrWidth?: AnimationViewport | number,
    canvasHeight?: number
  ): AnimationViewport {
    if (typeof viewportOrWidth === 'object' && viewportOrWidth !== null) {
      return viewportOrWidth;
    }
    if (this.currentInstance?.request.viewport) {
      return this.currentInstance.request.viewport;
    }
    const width =
      typeof viewportOrWidth === 'number'
        ? viewportOrWidth
        : CoordinateTransformer.DEFAULT_CANVAS_WIDTH;
    const height =
      typeof canvasHeight === 'number' ? canvasHeight : CoordinateTransformer.DEFAULT_CANVAS_HEIGHT;
    return { x: 0, y: 0, width, height };
  }

  /**
   * Renders cels designated behind battlers (priority 0 and 2).
   */
  public renderBehind(
    ctx: CanvasRenderingContext2D,
    viewportOrWidth: AnimationViewport | number = CoordinateTransformer.DEFAULT_CANVAS_WIDTH,
    canvasHeight = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT
  ): void {
    if (!this.currentInstance || !this.currentInstance.isPlaying) {
      return;
    }

    const inst = this.currentInstance;
    const frame = inst.definition.frames[inst.currentFrame];
    if (!frame) return;

    const viewport = this.resolveViewport(viewportOrWidth, canvasHeight);
    const isEnemy = inst.request.userSide === 'enemy';
    const { behindBattlers } = LayerManager.categorizeCels(
      deduplicateAnimationCels(inst.definition.id, frame.cels)
    );

    const isFlightReversed = CoordinateTransformer.isDirectionReversed(
      CoordinateTransformer.SRC_USER,
      CoordinateTransformer.SRC_TARGET,
      inst.request.userPos,
      inst.request.targetPos
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
    ctx.clip();

    for (const cel of behindBattlers) {
      if (this.isBattlerMaskedCel(inst, cel.pattern)) continue;
      if (isKnownDuplicateAnimationCel(inst.definition.id, cel)) continue;
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.mirrorPositionOnEnemy && isEnemy ? CoordinateTransformer.SRC_WIDTH - cel.x : cel.x,
        cel.mirrorPositionOnEnemy && isEnemy
          ? CoordinateTransformer.SRC_USER.y + CoordinateTransformer.SRC_TARGET.y - cel.y
          : cel.y,
        cel.focus,
        inst.request.userPos,
        inst.request.targetPos,
        viewport,
        isEnemy,
        inst.request.selfTarget,
        false,
        shouldPreserveAnimationCurve(inst.definition.id, cel),
        inst.isOppMove,
        inst.definition.id,
        cel.pattern
      );
      CelRenderer.renderCel(
        ctx,
        cel,
        pos.x,
        pos.y,
        cel.graphic ?? inst.definition.graphic,
        isFlightReversed && String(inst.definition.id) !== '351',
        viewport,
        undefined,
        isEnemy
      );
    }

    ctx.restore();
  }

  /**
   * Renders cels designated above battlers (priority 1 and 3) plus screen flashes.
   */
  public renderAbove(
    ctx: CanvasRenderingContext2D,
    viewportOrWidth: AnimationViewport | number = CoordinateTransformer.DEFAULT_CANVAS_WIDTH,
    canvasHeight = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT
  ): void {
    if (!this.currentInstance || !this.currentInstance.isPlaying) {
      return;
    }

    const inst = this.currentInstance;
    const frame = inst.definition.frames[inst.currentFrame];
    if (!frame) return;

    const viewport = this.resolveViewport(viewportOrWidth, canvasHeight);
    const isEnemy = inst.request.userSide === 'enemy';
    const { aboveBattlers } = LayerManager.categorizeCels(
      deduplicateAnimationCels(inst.definition.id, frame.cels)
    );

    const isFlightReversed = CoordinateTransformer.isDirectionReversed(
      CoordinateTransformer.SRC_USER,
      CoordinateTransformer.SRC_TARGET,
      inst.request.userPos,
      inst.request.targetPos
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
    ctx.clip();

    for (const cel of aboveBattlers) {
      if (this.isBattlerMaskedCel(inst, cel.pattern)) continue;
      if (isKnownDuplicateAnimationCel(inst.definition.id, cel)) continue;
      const pos = CoordinateTransformer.resolveCelPosition(
        cel.mirrorPositionOnEnemy && isEnemy ? CoordinateTransformer.SRC_WIDTH - cel.x : cel.x,
        cel.mirrorPositionOnEnemy && isEnemy
          ? CoordinateTransformer.SRC_USER.y + CoordinateTransformer.SRC_TARGET.y - cel.y
          : cel.y,
        cel.focus,
        inst.request.userPos,
        inst.request.targetPos,
        viewport,
        isEnemy,
        inst.request.selfTarget,
        false,
        shouldPreserveAnimationCurve(inst.definition.id, cel),
        inst.isOppMove,
        inst.definition.id,
        cel.pattern
      );
      CelRenderer.renderCel(
        ctx,
        cel,
        pos.x,
        pos.y,
        cel.graphic ?? inst.definition.graphic,
        isFlightReversed && String(inst.definition.id) !== '351',
        viewport,
        undefined,
        isEnemy
      );
    }

    // Render screen flashes
    this.timingManager.renderScreenFlash(ctx, viewport.width, viewport.height);

    ctx.restore();
  }

  /**
   * Renders the current animation frame to canvas context (both behind and above layers).
   */
  public render(
    ctx: CanvasRenderingContext2D,
    viewportOrWidth: AnimationViewport | number = CoordinateTransformer.DEFAULT_CANVAS_WIDTH,
    canvasHeight = CoordinateTransformer.DEFAULT_CANVAS_HEIGHT
  ): void {
    const viewport = this.resolveViewport(viewportOrWidth, canvasHeight);
    this.renderBehind(ctx, viewport);
    this.renderAbove(ctx, viewport);
  }

  public dispose(): void {
    this.stop();
  }
}

export const battleAnimationPlayer = new BattleAnimationPlayer();
