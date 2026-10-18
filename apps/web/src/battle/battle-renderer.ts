/**
 * Battle screen canvas renderer.
 * Pure rendering logic — reads state and assets, draws to canvas.
 * No input handling, no state mutation, no DOM creation.
 */

import type { BattleMove, BattlerPokemon, StatStages } from './types';
import type { BattleAssets, BattleEnvironmentElementAssets } from './battle-assets';
import { INTRO_SHUTTER_PROGRESS, type BattleState } from './battle-state';
import { isLoaded } from './battle-assets';
import { BattleEngine } from './battle-engine';
import { TypeBadgeRenderer } from './type-badge-renderer';
import { getBattleStatusIconFrame } from './battle-status-icons';
import { TYPE_ICO_INDICES } from './type-chart';
import { BATTLE_ASSETS } from '../assets';
import { detectPresetFromEnvironment } from './battle-environment-presets';
import { clampMoveVfxCenter } from './move-vfx';
import {
  ANIMATION_ASSETS,
  battleAnimationPlayer,
  battleAtmosphereManager,
  battleCameraManager,
  CoordinateTransformer,
  DEFAULT_ENEMY_GEOMETRY,
  DEFAULT_PLAYER_GEOMETRY,
  type BattlerGeometry,
} from './animation';

export interface ForestScenePine {
  x: number;
  y: number;
  scale: number;
  depth: number; // 0: distant (0.55-0.70), 1: mid (0.78-0.95), 2: foreground framing (1.25-1.55)
  swaySpeed: number;
  swayPhase: number;
}

export interface ForestSceneRay {
  type: 'lightC1' | 'lightC2' | 'lightC3';
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export interface ForestSceneTuft {
  x: number;
  y: number;
  scale: number;
  swaySpeed: number;
  swayPhase: number;
}

export interface ForestSceneLayout {
  pines: ForestScenePine[];
  rays: ForestSceneRay[];
  tufts: ForestSceneTuft[];
}

/** Canvas dimensions */
export const CANVAS_W = 512;
export const CANVAS_H = 384;

/** Crisp bold retro pixel font with full native Vietnamese support and vibrant white contrast */
export const BATTLE_FONT = "'VT323', 'Tiny5', 'Power Green', 'Power Red and Blue', monospace";

/** Command action button dimensions: 128x38 (sleek elongated design fitting 96px box) */
export const COMMAND_BTN_W = 128;
export const COMMAND_BTN_H = 38;

/** Bottom panel top Y coordinate */
export const BOTTOM_PANEL_Y = 288;

/** Command action button layout coordinates [x, y] in the bottom panel */
export const COMMAND_BTN_COORDS = [
  { x: 236, y: 296 }, // 0: FIGHT (Top-Left)
  { x: 369, y: 296 }, // 1: BAG (Top-Right)
  { x: 236, y: 338 }, // 2: POKÉMON (Bottom-Left)
  { x: 369, y: 338 }, // 3: RUN (Bottom-Right)
] as const;

/** Check which command button (0..3) contains the canvas coordinate (x, y) */
export function getHoveredCommandIndex(x: number, y: number): number {
  for (let i = 0; i < COMMAND_BTN_COORDS.length; i++) {
    const c = COMMAND_BTN_COORDS[i];
    if (x >= c.x && x <= c.x + COMMAND_BTN_W && y >= c.y && y <= c.y + COMMAND_BTN_H) {
      return i;
    }
  }
  return -1;
}

export interface WeatherTheme {
  labelVi: string;
  badgeBorder: string;
  badgeGlow: string;
  textColor: string;
  bgGradient: [string, string];
}

export const WEATHER_THEMES: Record<string, WeatherTheme> = {
  sun: {
    labelVi: 'NẮNG',
    badgeBorder: '#f59e0b',
    badgeGlow: 'rgba(245, 158, 11, 0.45)',
    textColor: '#fde047',
    bgGradient: ['rgba(30, 20, 10, 0.92)', 'rgba(69, 26, 3, 0.88)'],
  },
  sunny: {
    labelVi: 'NẮNG',
    badgeBorder: '#f59e0b',
    badgeGlow: 'rgba(245, 158, 11, 0.45)',
    textColor: '#fde047',
    bgGradient: ['rgba(30, 20, 10, 0.92)', 'rgba(69, 26, 3, 0.88)'],
  },
  rain: {
    labelVi: 'MƯA',
    badgeBorder: '#3b82f6',
    badgeGlow: 'rgba(59, 130, 246, 0.45)',
    textColor: '#93c5fd',
    bgGradient: ['rgba(15, 23, 42, 0.92)', 'rgba(29, 78, 216, 0.88)'],
  },
  heavy_rain: {
    labelVi: 'MƯA LỚN',
    badgeBorder: '#2563eb',
    badgeGlow: 'rgba(37, 99, 235, 0.5)',
    textColor: '#60a5fa',
    bgGradient: ['rgba(15, 23, 42, 0.94)', 'rgba(30, 58, 138, 0.9)'],
  },
  heavyrain: {
    labelVi: 'MƯA LỚN',
    badgeBorder: '#2563eb',
    badgeGlow: 'rgba(37, 99, 235, 0.5)',
    textColor: '#60a5fa',
    bgGradient: ['rgba(15, 23, 42, 0.94)', 'rgba(30, 58, 138, 0.9)'],
  },
  storm: {
    labelVi: 'BÃO SẤM',
    badgeBorder: '#8b5cf6',
    badgeGlow: 'rgba(139, 92, 246, 0.45)',
    textColor: '#c4b5fd',
    bgGradient: ['rgba(24, 16, 45, 0.94)', 'rgba(76, 29, 149, 0.9)'],
  },
  thunderstorm: {
    labelVi: 'BÃO SẤM',
    badgeBorder: '#8b5cf6',
    badgeGlow: 'rgba(139, 92, 246, 0.45)',
    textColor: '#c4b5fd',
    bgGradient: ['rgba(24, 16, 45, 0.94)', 'rgba(76, 29, 149, 0.9)'],
  },
  sandstorm: {
    labelVi: 'BÃO CÁT',
    badgeBorder: '#d97706',
    badgeGlow: 'rgba(217, 119, 6, 0.45)',
    textColor: '#fcd34d',
    bgGradient: ['rgba(41, 29, 12, 0.92)', 'rgba(120, 53, 15, 0.88)'],
  },
  hail: {
    labelVi: 'MƯA ĐÁ',
    badgeBorder: '#06b6d4',
    badgeGlow: 'rgba(6, 182, 212, 0.45)',
    textColor: '#67e8f9',
    bgGradient: ['rgba(8, 30, 48, 0.92)', 'rgba(14, 116, 144, 0.88)'],
  },
  blizzard: {
    labelVi: 'BÃO TUYẾT',
    badgeBorder: '#38bdf8',
    badgeGlow: 'rgba(56, 189, 248, 0.45)',
    textColor: '#7dd3fc',
    bgGradient: ['rgba(12, 34, 56, 0.92)', 'rgba(3, 105, 161, 0.88)'],
  },
  snow: {
    labelVi: 'TUYẾT',
    badgeBorder: '#a5f3fc',
    badgeGlow: 'rgba(165, 243, 252, 0.45)',
    textColor: '#e0f2fe',
    bgGradient: ['rgba(15, 32, 45, 0.92)', 'rgba(8, 77, 107, 0.88)'],
  },
  fog: {
    labelVi: 'SƯƠNG MÙ',
    badgeBorder: '#94a3b8',
    badgeGlow: 'rgba(148, 163, 184, 0.35)',
    textColor: '#e2e8f0',
    bgGradient: ['rgba(30, 41, 59, 0.92)', 'rgba(51, 65, 85, 0.88)'],
  },
  clearing: {
    labelVi: 'TRONG LÀNH',
    badgeBorder: '#10b981',
    badgeGlow: 'rgba(16, 185, 129, 0.45)',
    textColor: '#6ee7b7',
    bgGradient: ['rgba(6, 44, 34, 0.92)', 'rgba(4, 120, 87, 0.88)'],
  },
  clear: {
    labelVi: 'TRONG LÀNH',
    badgeBorder: '#10b981',
    badgeGlow: 'rgba(16, 185, 129, 0.45)',
    textColor: '#6ee7b7',
    bgGradient: ['rgba(6, 44, 34, 0.92)', 'rgba(4, 120, 87, 0.88)'],
  },
};

export class BattleRenderer {
  private ctx: CanvasRenderingContext2D;
  private assets: BattleAssets;
  private engine: BattleEngine;
  private disableCanvasText: boolean;

  private weatherIconCache = new Map<string, HTMLImageElement>();

  private offscreenCanvas = document.createElement('canvas');
  private offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;

  /** Offscreen layers used to clip Baneful Bunker to the active Pokémon sprite. */
  private bunkerEffectCanvas = document.createElement('canvas');
  private bunkerEffectCtx = this.bunkerEffectCanvas.getContext('2d')!;
  private bunkerMaskCanvas = document.createElement('canvas');
  private bunkerMaskCtx = this.bunkerMaskCanvas.getContext('2d')!;

  private tintedCloudCanvas: HTMLCanvasElement | null = null;
  private tintedCloudSource: HTMLImageElement | null = null;

  private forestLayout: ForestSceneLayout | null = null;
  private tintedGrassCanvas: HTMLCanvasElement | null = null;
  private shadowGrassCanvas: HTMLCanvasElement | null = null;
  private tintedPineCanvas: HTMLCanvasElement | null = null;

  constructor(
    ctx: CanvasRenderingContext2D,
    assets: BattleAssets,
    engine: BattleEngine,
    disableCanvasText = true
  ) {
    this.ctx = ctx;
    this.assets = assets;
    this.engine = engine;
    this.disableCanvasText = disableCanvasText;

    const preset = detectPresetFromEnvironment(this.engine.environment);
    if (preset.id === 'forest') {
      const seed = (Math.floor(Math.random() * 1000000) ^ Date.now()) & 0x7fffffff;
      this.forestLayout = this.generateForestLayout(seed);
    }
  }

  /** Prepares an offscreen frame with a solid color fill (or tint overlay) without any glow */
  private prepareSilhouetteCanvas(
    img: HTMLImageElement,
    sx: number,
    frameW: number,
    frameH: number,
    fillColor: string,
    composite: GlobalCompositeOperation = 'source-in'
  ): HTMLCanvasElement {
    if (this.offscreenCanvas.width !== frameW || this.offscreenCanvas.height !== frameH) {
      this.offscreenCanvas.width = frameW;
      this.offscreenCanvas.height = frameH;
    }
    const octx = this.offscreenCtx;
    octx.clearRect(0, 0, frameW, frameH);
    octx.drawImage(img, sx, 0, frameW, frameH, 0, 0, frameW, frameH);
    octx.globalCompositeOperation = composite;
    octx.fillStyle = fillColor;
    octx.fillRect(0, 0, frameW, frameH);
    octx.globalCompositeOperation = 'source-over';
    return this.offscreenCanvas;
  }

  public updatePlayerSprite(backSpriteUrl: string): void {
    const img = new Image();
    img.src = backSpriteUrl;
    this.assets.playerSprite = img;
  }

  /**
   * Returns the live animation anchors used by the battler renderer.
   *
   * Battle sprites are horizontal strips whose frame height varies by species.
   * The animation layer must use the same frame height and scale as the sprite
   * renderer, otherwise effects drift vertically from the Pokémon they target.
   */
  public getBattlerAnimationGeometry(): { player: BattlerGeometry; enemy: BattlerGeometry } {
    const getLiveGeometry = (
      fallback: BattlerGeometry,
      sprite: HTMLImageElement
    ): BattlerGeometry => {
      const frameHeight = sprite.naturalHeight || sprite.height;
      if (!Number.isFinite(frameHeight) || frameHeight <= 0) {
        return { ...fallback };
      }

      return {
        ...fallback,
        // drawPlayerBattler/drawEnemyBattler render each source frame at 2x.
        spriteHeight: frameHeight * 2,
      };
    };

    return {
      player: getLiveGeometry(DEFAULT_PLAYER_GEOMETRY, this.assets.playerSprite),
      enemy: getLiveGeometry(DEFAULT_ENEMY_GEOMETRY, this.assets.enemySprite),
    };
  }

  public updatePlayerBall(ballType: string): void {
    const ballImg = new Image();
    ballImg.src = BATTLE_ASSETS.getBall(ballType);
    this.assets.ball = ballImg;

    const ballOpenImg = new Image();
    ballOpenImg.src = BATTLE_ASSETS.getBallOpen(ballType);
    this.assets.ballOpen = ballOpenImg;
  }

  public updateThrownBall(ballType: string): void {
    const ballImg = new Image();
    ballImg.src = BATTLE_ASSETS.getBall(ballType);
    this.assets.thrownBall = ballImg;

    const ballOpenImg = new Image();
    ballOpenImg.src = BATTLE_ASSETS.getBallOpen(ballType);
    this.assets.thrownBallOpen = ballOpenImg;

    const ballClosedImg = new Image();
    ballClosedImg.src = BATTLE_ASSETS.getBallClosed(ballType);
    this.assets.thrownBallClosed = ballClosedImg;
  }

  public setForegroundOverlay(overlayKey?: string): void {
    this.assets.overlayKey = overlayKey;
    if (!overlayKey) {
      this.assets.foregroundOverlay = undefined;
      return;
    }
    const img = new Image();
    img.src = BATTLE_ASSETS.getForegroundOverlay(overlayKey);
    this.assets.foregroundOverlay = img;
  }

  /** Main render entry point — called every animation frame */
  render(state: BattleState): void {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // Dynamic Cinematic Camera Vector (EBDX Camera System)
    const isAnimPlaying = battleAnimationPlayer.isPlaying();
    const animProgress = battleAnimationPlayer.getProgress();
    const activeMoveType = battleAnimationPlayer.getActiveMoveType();
    const userPos = battleAnimationPlayer.getActiveUserPos();
    const targetPos = battleAnimationPlayer.getActiveTargetPos();

    const cam = battleCameraManager.getTransform(
      state.tick,
      state.isIntro,
      state.introProgress,
      state.captureZoomProgress,
      isAnimPlaying,
      animProgress,
      userPos,
      targetPos
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_W, BOTTOM_PANEL_Y);
    ctx.clip();

    // Screen shake: Combine Pokémon landing shake + dynamic impact screen shake
    const totalShakeX = (state.screenShakeX || 0) + cam.shakeX;
    const totalShakeY = (state.screenShakeY || 0) + cam.shakeY;
    if (totalShakeX !== 0 || totalShakeY !== 0) {
      ctx.translate(totalShakeX, totalShakeY);
    }

    if (cam.scale !== 1.0 || cam.panX !== 0 || cam.panY !== 0) {
      const centerX = CANVAS_W / 2;
      const centerY = BOTTOM_PANEL_Y / 2;
      ctx.translate(centerX + cam.panX, centerY + cam.panY);
      ctx.scale(cam.scale, cam.scale);
      ctx.translate(-centerX, -centerY);
    }

    this.drawBackground(ctx);
    this.drawEnvironmentSkyAndElements(ctx, state);
    this.drawEnemyBase(ctx);

    // EBDX Atmospheric Dimming (fp["bg"]) & Defocus Vignette behind battlers
    battleAtmosphereManager.renderBehind(
      ctx,
      CANVAS_W,
      BOTTOM_PANEL_Y,
      isAnimPlaying,
      activeMoveType,
      animProgress
    );

    // Timeline animation cels behind battlers (priority 0 & 2)
    battleAnimationPlayer.renderBehind(ctx, CANVAS_W, BOTTOM_PANEL_Y);

    this.drawEnemyBattler(ctx, state);
    this.drawPlayerBase(ctx);
    this.drawPlayerBattler(ctx, state);

    // Timeline animation cels above battlers (priority 1 & 3)
    battleAnimationPlayer.renderAbove(ctx, CANVAS_W, BOTTOM_PANEL_Y);
    this.drawBanefulBunkerMaskedOverlay(ctx, state);

    this.drawPlayerSendOut(ctx, state);
    this.drawBallThrow(ctx, state);
    this.drawEnvironmentOverlays(ctx, state);
    this.drawEnvironmentAmbientParticles(ctx, state);

    // Shiny entrance sparkle effects (bursting stars & halo)
    if (state.enemyShinyTimer > 0) {
      this.drawBattleShinySparkles(ctx, 380, 115, state.enemyShinyTimer, state.enemyShinyMax);
    }
    if (state.playerShinyTimer > 0) {
      this.drawBattleShinySparkles(ctx, 130, 220, state.playerShinyTimer, state.playerShinyMax);
    }

    // Move visual animation (legacy fallback VFX)
    this.drawMoveVfx(ctx, state);

    // Screen flash overlay
    if (state.screenFlashTimer > 0 && state.screenFlashColor) {
      ctx.save();
      ctx.fillStyle = state.screenFlashColor;
      ctx.fillRect(0, 0, CANVAS_W, BOTTOM_PANEL_Y);
      ctx.restore();
    }

    ctx.restore();

    if (state.isIntro) {
      this.drawIntroShutters(ctx, state);
    }

    this.renderEnemyDatabox(ctx, 0, 1, state);
    this.renderPlayerDatabox(ctx, 252, 197, state);
    this.drawWeatherIndicator(ctx, state);
    this.drawAbilityBanner(ctx, state);
    this.renderBottomPanel(ctx, state);
  }

  // ---- Move Visual Animation (VFX) ----

  private drawMoveVfx(ctx: CanvasRenderingContext2D, state: BattleState): void {
    // Skip ALL legacy VFX when timeline animation is playing to prevent overlap
    if (battleAnimationPlayer.isPlaying()) {
      return;
    }

    if (state.activeCustomMoveAnim) {
      state.activeCustomMoveAnim.render(ctx, state);
      return;
    }

    const vfx = state.activeMoveVfx;
    if (!vfx || !isLoaded(vfx.image)) return;

    const cellW = vfx.cellWidth > 0 ? vfx.cellWidth : 192;
    const cellH = vfx.cellHeight > 0 ? vfx.cellHeight : 192;
    const imgW = vfx.image.width || 960;
    const imgH = vfx.image.height || 192;

    const cols = vfx.columns > 0 ? vfx.columns : Math.max(1, Math.floor(imgW / cellW));
    const rows = Math.max(1, Math.floor(imgH / cellH));
    const totalCells = cols * rows;

    const frameIdx = vfx.currentFrame;
    const safeCellIdx = totalCells > 0 ? frameIdx % totalCells : 0;
    const col = safeCellIdx % cols;
    const row = Math.floor(safeCellIdx / cols);

    const sx = col * cellW;
    const sy = row * cellH;
    if (sx + cellW > imgW || sy + cellH > imgH) return;

    let posX = vfx.targetX;
    let posY = vfx.targetY;
    if (vfx.isProjectile) {
      const p = Math.min(
        1.0,
        (frameIdx + vfx.frameTick / vfx.ticksPerFrame) / Math.max(1, vfx.totalFrames)
      );
      posX = vfx.startX + (vfx.targetX - vfx.startX) * p;
      posY = vfx.startY + (vfx.targetY - vfx.startY) * p;
    }

    const dw = Math.round(cellW * vfx.scale);
    const dh = Math.round(cellH * vfx.scale);
    const safeCenter = clampMoveVfxCenter(posX, posY, dw, dh, CANVAS_W, BOTTOM_PANEL_Y);
    const dx = Math.round(safeCenter.x - dw / 2);
    const dy = Math.round(safeCenter.y - dh / 2);

    ctx.save();
    if (vfx.blendMode && vfx.blendMode !== 'source-over') {
      ctx.globalCompositeOperation = vfx.blendMode;
    }
    ctx.drawImage(vfx.image, sx, sy, cellW, cellH, dx, dy, dw, dh);
    ctx.restore();
  }

  /**
   * Clips Baneful Bunker's green texture to the active battler silhouette.
   * The source cel is a full opaque atlas cell, so drawing it directly would
   * expose its rectangular background over the entire battle field.
   */
  private drawBanefulBunkerMaskedOverlay(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const instance = battleAnimationPlayer.getCurrentInstance();
    if (!instance || !instance.isPlaying) return;

    const moveId = instance.request.moveId.toLowerCase().replace(/[\s-]+/g, '_');
    if (moveId !== 'baneful_bunker') return;

    const frame = instance.definition.frames[instance.currentFrame];
    const cel = frame?.cels.find((candidate) => candidate.pattern === 11 && candidate.visible);
    if (!cel || cel.opacity <= 0) return;

    const effectImage = ANIMATION_ASSETS.getImage(instance.definition.graphic);
    const atlas = ANIMATION_ASSETS.getAtlas(instance.definition.graphic);
    if (!effectImage || !isLoaded(effectImage) || !atlas) return;

    const attackerSide = instance.request.userSide;
    const sprite = attackerSide === 'player' ? this.assets.playerSprite : this.assets.enemySprite;
    if (!sprite || !isLoaded(sprite)) return;

    const viewport = { x: 0, y: 0, width: CANVAS_W, height: BOTTOM_PANEL_Y };
    const effectPosition = CoordinateTransformer.resolveCelPosition(
      cel.x,
      cel.y,
      cel.focus,
      instance.request.userPos,
      instance.request.targetPos,
      viewport,
      attackerSide === 'enemy',
      instance.request.selfTarget,
      false,
      false,
      false,
      instance.definition.id
    );

    const cellWidth = atlas.cellWidth;
    const cellHeight = atlas.cellHeight;
    const srcX = (cel.pattern % atlas.columns) * cellWidth;
    const srcY = Math.floor(cel.pattern / atlas.columns) * cellHeight;
    if (
      srcX + cellWidth > effectImage.naturalWidth ||
      srcY + cellHeight > effectImage.naturalHeight
    ) {
      return;
    }

    if (
      this.bunkerEffectCanvas.width !== CANVAS_W ||
      this.bunkerEffectCanvas.height !== BOTTOM_PANEL_Y
    ) {
      this.bunkerEffectCanvas.width = CANVAS_W;
      this.bunkerEffectCanvas.height = BOTTOM_PANEL_Y;
      this.bunkerMaskCanvas.width = CANVAS_W;
      this.bunkerMaskCanvas.height = BOTTOM_PANEL_Y;
    }

    const effectCtx = this.bunkerEffectCtx;
    const maskCtx = this.bunkerMaskCtx;
    effectCtx.clearRect(0, 0, CANVAS_W, BOTTOM_PANEL_Y);
    maskCtx.clearRect(0, 0, CANVAS_W, BOTTOM_PANEL_Y);

    // Draw the selected Baneful Bunker atlas cell onto the effect layer.
    effectCtx.save();
    effectCtx.translate(effectPosition.x, effectPosition.y);
    if (cel.angle !== 0) effectCtx.rotate((cel.angle * Math.PI) / 180);
    effectCtx.scale(cel.zoomX / 100, cel.zoomY / 100);
    effectCtx.globalAlpha = Math.max(0, Math.min(1, cel.opacity / 255));
    effectCtx.globalCompositeOperation = cel.blendMode === 'additive' ? 'lighter' : 'source-over';
    effectCtx.drawImage(
      effectImage,
      srcX,
      srcY,
      cellWidth,
      cellHeight,
      -cellWidth / 2,
      -cellHeight / 2,
      cellWidth,
      cellHeight
    );
    effectCtx.restore();

    // Recreate the exact active battler frame as the alpha mask.
    const frameHeight = sprite.naturalHeight || sprite.height;
    const frameWidth = frameHeight;
    if (frameWidth <= 0 || frameHeight <= 0) return;

    const pokemon =
      attackerSide === 'player' ? this.engine.playerPokemon : this.engine.enemyPokemon;
    const isShiny = pokemon.isShiny;
    const divisor = isShiny ? 8 : 4;
    const totalFrames = Math.max(1, Math.floor((sprite.naturalWidth || sprite.width) / frameWidth));
    const frameIndex = Math.floor(state.tick / divisor) % totalFrames;

    const isFainting =
      attackerSide === 'player'
        ? !state.isPlayerSendingOut &&
          (state.playerFaintPhase !== 'none' || this.engine.playerPokemon.currentHp <= 0)
        : state.enemyFaintPhase !== 'none' || this.engine.enemyPokemon.currentHp <= 0;
    const offsetX =
      attackerSide === 'player'
        ? isFainting
          ? 0
          : state.playerLungeX + state.playerHitOffsetX + state.allySwitchPlayerOffsetX
        : isFainting
          ? 0
          : state.enemyLungeX + state.enemyHitOffsetX + state.allySwitchEnemyOffsetX;
    const offsetY =
      attackerSide === 'player'
        ? isFainting
          ? 0
          : state.playerLungeY + state.playerHitOffsetY + state.allySwitchPlayerOffsetY
        : isFainting
          ? 0
          : state.enemyLungeY + state.enemyHitOffsetY + state.allySwitchEnemyOffsetY;
    const spriteCenterX = instance.request.userPos.x + offsetX;
    const spriteCenterY = instance.request.userPos.y + offsetY;
    const drawWidth = frameWidth * 2;
    const drawHeight = frameHeight * 2;
    const drawX = Math.round(spriteCenterX - drawWidth / 2);
    const drawY = Math.round(spriteCenterY - drawHeight / 2);

    maskCtx.drawImage(
      sprite,
      frameIndex * frameWidth,
      0,
      frameWidth,
      frameHeight,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );

    // Keep only the effect pixels whose location overlaps opaque sprite pixels.
    effectCtx.globalCompositeOperation = 'destination-in';
    effectCtx.drawImage(this.bunkerMaskCanvas, 0, 0);
    effectCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.bunkerEffectCanvas, 0, 0);
  }

  // ---- Background ----

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    if (isLoaded(this.assets.bg)) {
      ctx.drawImage(this.assets.bg, 0, 0, CANVAS_W, BOTTOM_PANEL_Y);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, BOTTOM_PANEL_Y);
    }
  }

  // ---- Environment Rendering (Battlebacks) ----

  private getTintedCloudCanvas(cloudImg: HTMLImageElement): HTMLCanvasElement {
    if (this.tintedCloudCanvas && this.tintedCloudSource === cloudImg) {
      return this.tintedCloudCanvas;
    }
    const canvas = document.createElement('canvas');
    canvas.width = cloudImg.naturalWidth || cloudImg.width || 384;
    canvas.height = cloudImg.naturalHeight || cloudImg.height || 18;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(cloudImg, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.tintedCloudCanvas = canvas;
    this.tintedCloudSource = cloudImg;
    return canvas;
  }

  private drawEnvironmentSkyAndElements(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const preset = detectPresetFromEnvironment(this.engine.environment);
    const envEl = this.assets.envElements;
    if (!envEl) return;

    // 1. Sun (Field)
    if (preset.hasSun && envEl.sun && isLoaded(envEl.sun)) {
      const sun = envEl.sun;
      const cx = 413;
      const cy = 35;
      const coronaRadius = 36 + Math.sin(state.tick * 0.04) * 4;
      const sunGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, coronaRadius);
      sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.52)');
      sunGrad.addColorStop(0.5, 'rgba(254, 215, 170, 0.22)');
      sunGrad.addColorStop(1, 'rgba(254, 215, 170, 0)');

      ctx.save();
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coronaRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(sun, 390, 12);
      ctx.restore();
    }

    // 2. Mountain Ridge & Mist (Mountain)
    if (preset.hasMountainRidge && envEl.mountain && isLoaded(envEl.mountain)) {
      const mtn = envEl.mountain;
      const mtnH = Math.round(CANVAS_W * (mtn.naturalHeight / mtn.naturalWidth));
      ctx.save();
      ctx.drawImage(mtn, 0, 48, CANVAS_W, mtnH);
      if (envEl.fog && isLoaded(envEl.fog)) {
        const fog = envEl.fog;
        const fogW = fog.naturalWidth || 708;
        const fogX = ((state.tick * 0.15) % fogW) - 150;
        ctx.globalAlpha = 0.28;
        ctx.drawImage(fog, -fogX, 42, CANVAS_W, 80);
      }
      ctx.restore();
    }

    // 3. Clouds (Field, Water, Mountain)
    if (preset.hasClouds && envEl.cloud && isLoaded(envEl.cloud)) {
      const cloudCanvas = this.getTintedCloudCanvas(envEl.cloud);
      const cw = cloudCanvas.width;
      const ch = cloudCanvas.height;

      ctx.save();
      // Upper slow drift layer
      const cx1 = ((state.tick * 0.22) % (CANVAS_W + cw * 1.2)) - cw * 1.2;
      ctx.globalAlpha = 0.82;
      ctx.drawImage(cloudCanvas, Math.round(cx1), 22, Math.round(cw * 1.2), Math.round(ch * 1.2));

      // Lower secondary layer
      const cx2 = ((state.tick * 0.38 + 260) % (CANVAS_W + cw)) - cw;
      ctx.globalAlpha = 0.65;
      ctx.drawImage(cloudCanvas, Math.round(cx2), 38, Math.round(cw * 0.95), Math.round(ch * 0.95));
      ctx.restore();
    }

    // 4. Forest Horizon Pines, Mist & Sunbeams (Forest)
    if (preset.hasPineTrees && envEl.treePine && isLoaded(envEl.treePine)) {
      this.drawForestHorizonAndSky(ctx, state, envEl);
    }
  }

  private drawEnvironmentOverlays(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const preset = detectPresetFromEnvironment(this.engine.environment);
    const envEl = this.assets.envElements;
    if (!envEl) return;

    // 1. Forest: Foreground Framing Trees & Grass Tufts
    if (preset.hasPineTrees) {
      this.drawForestForegroundAndGrass(ctx, state, envEl);
    }

    // 2. Animated Water Wave Shimmer (Water)
    if (preset.hasWaterShimmer && envEl.water0 && isLoaded(envEl.water0)) {
      const w0 = envEl.water0;
      const w1 = envEl.water1;
      const waveCycle = (Math.sin(state.tick * 0.04) + 1) / 2;
      const driftX = Math.sin(state.tick * 0.02) * 8;
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.drawImage(w0, driftX, 110, CANVAS_W, 178);
      if (w1 && isLoaded(w1)) {
        ctx.globalAlpha = 0.72 * waveCycle;
        ctx.drawImage(w1, -driftX, 110, CANVAS_W, 178);
      }
      ctx.restore();
    }

    // 3. Ascending Bubbles (Water)
    if (preset.hasBubbles && envEl.bubble && isLoaded(envEl.bubble)) {
      const bubble = envEl.bubble;
      const numBubbles = 7;
      ctx.save();
      for (let i = 0; i < numBubbles; i++) {
        const seed = (i * 97 + 13) % 100;
        const startX = 60 + (seed / 100) * (CANVAS_W - 120);
        const cycleTicks = 220;
        const progress = ((state.tick + i * 35) % cycleTicks) / cycleTicks;
        const by = 275 - progress * 155;
        const bx = startX + Math.sin(state.tick * 0.07 + i * 2) * 8;
        const alpha =
          progress < 0.2 ? progress / 0.2 : progress > 0.85 ? (1 - progress) / 0.15 : 0.85;
        const scale = 0.7 + (i % 3) * 0.3;
        const bw = Math.round(bubble.naturalWidth * scale);
        const bh = Math.round(bubble.naturalHeight * scale);
        ctx.globalAlpha = alpha * 0.8;
        ctx.drawImage(bubble, Math.round(bx - bw / 2), Math.round(by - bh / 2), bw, bh);
      }
      ctx.restore();
    }

    // 4. Mountain Rocks (Mountain)
    if (preset.hasMountainRidge && envEl.rocks && isLoaded(envEl.rocks)) {
      const rocks = envEl.rocks;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(
        rocks,
        35,
        245,
        Math.round(rocks.naturalWidth * 1.1),
        Math.round(rocks.naturalHeight * 1.1)
      );
      ctx.drawImage(
        rocks,
        465,
        225,
        Math.round(rocks.naturalWidth * 0.95),
        Math.round(rocks.naturalHeight * 0.95)
      );
      ctx.restore();
    }
  }

  private drawEnvironmentAmbientParticles(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const preset = detectPresetFromEnvironment(this.engine.environment);

    if (preset.ambientParticleType === 'pollen') {
      // Gentle floating pollen / dandelion seeds in field
      ctx.save();
      for (let i = 0; i < 12; i++) {
        const speed = 0.4 + (i % 4) * 0.15;
        const px = ((state.tick * speed + i * 47) % (CANVAS_W + 20)) - 10;
        const py = 70 + ((i * 17) % 200) + Math.sin(state.tick * 0.04 + i) * 6;
        const alpha = 0.35 + Math.sin(state.tick * 0.05 + i * 1.5) * 0.25;
        ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0, alpha).toFixed(2)})`;
        ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
      }
      ctx.restore();
    } else if (preset.ambientParticleType === 'spores') {
      // Glowing forest spores / fireflies
      ctx.save();
      for (let i = 0; i < 10; i++) {
        const speedY = 0.3 + (i % 3) * 0.1;
        const py = 260 - ((state.tick * speedY + i * 31) % 180);
        const px = 50 + ((i * 45) % (CANVAS_W - 100)) + Math.sin(state.tick * 0.03 + i) * 10;
        const pulse = (Math.sin(state.tick * 0.06 + i * 2) + 1) / 2;
        const alpha = 0.2 + pulse * 0.65;
        ctx.fillStyle = `rgba(167, 243, 208, ${alpha.toFixed(2)})`;
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 1.5 + pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (preset.ambientParticleType === 'bubbles') {
      // Sparkling sunlight glints on ocean surface
      ctx.save();
      for (let i = 0; i < 8; i++) {
        const sx = 40 + ((i * 61) % (CANVAS_W - 80)) + Math.sin(state.tick * 0.02 + i) * 4;
        const sy = 125 + ((i * 23) % 140);
        const sparkle = (Math.sin(state.tick * 0.08 + i * 3) + 1) / 2;
        if (sparkle > 0.65) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(sparkle * 0.8).toFixed(2)})`;
          ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
        }
      }
      ctx.restore();
    } else if (preset.ambientParticleType === 'wind_dust') {
      // Mountain wind streaks
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const streakW = 20 + (i % 3) * 15;
        const wx = ((state.tick * 2.8 + i * 95) % (CANVAS_W + 100)) - 50;
        const wy = 55 + ((i * 35) % 170);
        ctx.fillStyle = 'rgba(254, 243, 199, 0.22)';
        ctx.fillRect(Math.round(wx), Math.round(wy), streakW, 1.2);
      }
      ctx.restore();
    }
  }

  // ---- Procedural Forest Environment ----

  private generateForestLayout(seed: number): ForestSceneLayout {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    const nextRng = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const rngRange = (min: number, max: number) => min + nextRng() * (max - min);

    const pines: ForestScenePine[] = [];

    // 1. Distant Pine Layer (depth 0, rất xa): smaller scale, misty, higher up along horizon
    const distantCount = Math.floor(rngRange(11, 14));
    for (let i = 0; i < distantCount; i++) {
      const x = -15 + (i / (distantCount - 1)) * 540 + rngRange(-12, 12);
      pines.push({
        x: Math.round(x),
        y: Math.round(rngRange(41, 46)),
        scale: rngRange(0.5, 0.62),
        depth: 0,
        swaySpeed: rngRange(0.035, 0.055),
        swayPhase: rngRange(0, Math.PI * 2),
      });
    }

    // 2. Mid-distant Pine Layer (depth 1, xa dọc chân trời): medium scale, staggered naturally
    const midCount = Math.floor(rngRange(10, 12));
    for (let i = 0; i < midCount; i++) {
      const x = -10 + (i / (midCount - 1)) * 530 + rngRange(-15, 15);
      pines.push({
        x: Math.round(x),
        y: Math.round(rngRange(48, 54)),
        scale: rngRange(0.68, 0.8),
        depth: 1,
        swaySpeed: rngRange(0.045, 0.065),
        swayPhase: rngRange(0, Math.PI * 2),
      });
    }

    // Sort pines by depth then y so deeper background trees render first
    pines.sort((a, b) => a.depth - b.depth || a.y - b.y);

    // 4. Sunbeams (tilted shafts from top-left with randomized placement & pulsing)
    const rayTypes: Array<'lightC1' | 'lightC2' | 'lightC3'> = ['lightC1', 'lightC2', 'lightC3'];
    const numRays = Math.floor(rngRange(5, 7));
    const rays: ForestSceneRay[] = [];
    const rayXs = [30, 95, 165, 240, 315, 385, 445];
    for (let i = 0; i < numRays; i++) {
      const rx = rayXs[i] + rngRange(-15, 15);
      const type = rayTypes[Math.floor(nextRng() * rayTypes.length)];
      rays.push({
        type,
        x: Math.round(rx),
        y: Math.round(rngRange(-15, 0)),
        scaleX: rngRange(1.35, 1.55),
        scaleY: rngRange(1.2, 1.38),
        baseAlpha: rngRange(0.45, 0.65),
        pulseSpeed: rngRange(0.035, 0.06),
        pulsePhase: rngRange(0, Math.PI * 2),
      });
    }

    // 5. Grass Tufts (STRICTLY OUTSIDE BASES)
    const tufts: ForestSceneTuft[] = [];
    const isOnBase = (x: number, y: number) => {
      const dEnemy = Math.pow((x - 380) / 118, 2) + Math.pow((y - 155) / 52, 2);
      if (dEnemy <= 1.15) return true;
      const dPlayer = Math.pow((x - 130) / 150, 2) + Math.pow((y - 255) / 68, 2);
      if (dPlayer <= 1.15) return true;
      return false;
    };

    const tuftCandidates = [
      { x: 225, y: 142, sc: 0.82 },
      { x: 258, y: 148, sc: 0.86 },
      { x: 285, y: 152, sc: 0.9 },
      { x: 238, y: 175, sc: 1.05 },
      { x: 275, y: 185, sc: 1.15 },
      { x: 255, y: 205, sc: 1.25 },
      { x: 455, y: 162, sc: 0.8 },
      { x: 475, y: 185, sc: 1.05 },
      { x: 460, y: 215, sc: 1.2 },
      { x: 435, y: 245, sc: 1.5 },
      { x: 465, y: 252, sc: 1.4 },
      { x: 35, y: 215, sc: 1.15 },
      { x: 22, y: 242, sc: 1.45 },
      { x: 48, y: 258, sc: 1.35 },
      { x: 175, y: 138, sc: 0.78 },
      { x: 485, y: 148, sc: 0.76 },
    ];

    for (const cand of tuftCandidates) {
      if (nextRng() > 0.25) {
        const jx = Math.round(cand.x + rngRange(-8, 8));
        const jy = Math.round(cand.y + rngRange(-5, 5));
        if (!isOnBase(jx + 15, jy + 15)) {
          tufts.push({
            x: jx,
            y: jy,
            scale: cand.sc,
            swaySpeed: rngRange(0.055, 0.085),
            swayPhase: rngRange(0, Math.PI * 2),
          });
        }
      }
    }

    tufts.sort((a, b) => a.y - b.y);

    return { pines, rays, tufts };
  }

  private getTintedGrassCanvases(
    grassImg: HTMLImageElement
  ): { grass: HTMLCanvasElement; shadow: HTMLCanvasElement } | null {
    if (typeof document === 'undefined') return null;
    if (this.tintedGrassCanvas && this.shadowGrassCanvas) {
      return { grass: this.tintedGrassCanvas, shadow: this.shadowGrassCanvas };
    }
    const gw = grassImg.naturalWidth || grassImg.width || 37;
    const gh = grassImg.naturalHeight || grassImg.height || 38;

    // Tinted grass canvas (gradient from root to tip)
    const gCanvas = document.createElement('canvas');
    gCanvas.width = gw;
    gCanvas.height = gh;
    const gctx = gCanvas.getContext('2d');
    if (!gctx) return null;
    gctx.drawImage(grassImg, 0, 0);
    gctx.globalCompositeOperation = 'source-in';
    const grad = gctx.createLinearGradient(0, gh, 0, 0);
    grad.addColorStop(0, '#224230');
    grad.addColorStop(0.5, '#38664a');
    grad.addColorStop(1, '#4e8a62');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, gw, gh);

    // Directional shadow canvas (silhouette flipped vertically for ground projection)
    const sCanvas = document.createElement('canvas');
    sCanvas.width = gw;
    sCanvas.height = gh;
    const sctx = sCanvas.getContext('2d');
    if (!sctx) return null;
    sctx.save();
    sctx.translate(0, gh);
    sctx.scale(1, -1);
    sctx.drawImage(grassImg, 0, 0);
    sctx.restore();
    sctx.globalCompositeOperation = 'source-in';
    sctx.fillStyle = 'rgba(8, 20, 14, 0.45)';
    sctx.fillRect(0, 0, gw, gh);

    this.tintedGrassCanvas = gCanvas;
    this.shadowGrassCanvas = sCanvas;
    return { grass: gCanvas, shadow: sCanvas };
  }

  private getTintedPineCanvas(pineImg: HTMLImageElement): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    if (this.tintedPineCanvas) return this.tintedPineCanvas;
    const pw = pineImg.naturalWidth || pineImg.width || 61;
    const ph = pineImg.naturalHeight || pineImg.height || 102;
    const pCanvas = document.createElement('canvas');
    pCanvas.width = pw;
    pCanvas.height = ph;
    const pctx = pCanvas.getContext('2d');
    if (!pctx) return null;
    pctx.drawImage(pineImg, 0, 0);
    pctx.globalCompositeOperation = 'source-in';
    pctx.fillStyle = '#12221a';
    pctx.fillRect(0, 0, pw, ph);
    this.tintedPineCanvas = pCanvas;
    return pCanvas;
  }

  private drawForestHorizonAndSky(
    ctx: CanvasRenderingContext2D,
    state: BattleState,
    envEl: BattleEnvironmentElementAssets
  ): void {
    if (!this.forestLayout || !envEl.treePine || !isLoaded(envEl.treePine)) return;
    const pineCanvas = this.getTintedPineCanvas(envEl.treePine);
    if (!pineCanvas) return;

    // 1. Distant Pine Trees with focal depth (only in the far background along horizon, NO tree shadow)
    for (const p of this.forestLayout.pines) {
      const pw = Math.round(pineCanvas.width * p.scale);
      const ph = Math.round(pineCanvas.height * p.scale);
      const swayAngle =
        Math.sin(state.tick * p.swaySpeed + p.swayPhase) * (p.scale > 0.7 ? 0.024 : 0.016);

      ctx.save();
      ctx.globalAlpha = p.depth === 0 ? 0.7 : 0.95;
      ctx.translate(p.x + pw / 2, p.y + ph);
      ctx.transform(1, 0, -swayAngle, 1, 0, 0);
      ctx.drawImage(pineCanvas, -pw / 2, -ph, pw, ph);
      ctx.restore();
    }

    // 2. Breathing Sunbeams (God Rays)
    for (const r of this.forestLayout.rays) {
      const rayImg = envEl[r.type];
      if (!rayImg || !isLoaded(rayImg)) continue;

      const pulse = (Math.sin(state.tick * r.pulseSpeed + r.pulsePhase) + 1) / 2;
      const currentAlpha = r.baseAlpha * (0.35 + pulse * 0.85);

      const rw = Math.round(rayImg.naturalWidth * r.scaleX);
      const rh = Math.round(rayImg.naturalHeight * r.scaleY);

      ctx.save();
      ctx.globalAlpha = Math.min(1.0, currentAlpha);
      ctx.drawImage(rayImg, r.x, r.y, rw, rh);
      ctx.restore();
    }
  }

  private drawForestForegroundAndGrass(
    ctx: CanvasRenderingContext2D,
    state: BattleState,
    envEl: BattleEnvironmentElementAssets
  ): void {
    if (!this.forestLayout) return;

    // Grass Tufts with Directional Cast Shadow & Wind-Bending Shear (ZERO grass on bases)
    if (envEl.tallGrass && isLoaded(envEl.tallGrass)) {
      const canvases = this.getTintedGrassCanvases(envEl.tallGrass);
      if (canvases) {
        const { grass: gCanvas, shadow: sCanvas } = canvases;

        for (const t of this.forestLayout.tufts) {
          const tw = Math.round(gCanvas.width * t.scale);
          const th = Math.round(gCanvas.height * t.scale);
          const swaySkew = Math.sin(state.tick * t.swaySpeed + t.swayPhase) * 0.12;

          // Directional Cast Shadow (projected to bottom-right along ground matching sunlight)
          ctx.save();
          ctx.translate(t.x, t.y + th - 2);
          ctx.transform(1, 0, 0.55 + swaySkew * 0.4, 0.32, 0, 0);
          ctx.drawImage(sCanvas, 0, 0, tw, th);
          ctx.restore();

          // Standing Grass (organic wind-bending shear from roots)
          ctx.save();
          ctx.translate(t.x + tw / 2, t.y + th);
          ctx.transform(1, 0, -swaySkew, 1, 0, 0);
          ctx.drawImage(gCanvas, -tw / 2, -th, tw, th);
          ctx.restore();
        }
      }
    }
  }

  // ---- Enemy Base Platform ----

  private drawEnemyBase(ctx: CanvasRenderingContext2D): void {
    const baseAnchorX = 380;
    const baseAnchorY = 175;
    const base = this.assets.enemyBase;
    if (isLoaded(base)) {
      const baseScale = 0.8;
      const bw = Math.round(base.width * baseScale);
      const bh = Math.round(base.height * baseScale);
      const bx = Math.round(baseAnchorX - bw / 2);
      const by = Math.round(baseAnchorY - bh * 0.55) - 10;
      ctx.drawImage(base, bx, by, bw, bh);
    }
  }

  // ---- Enemy Battler ----

  private drawEnemyBattler(ctx: CanvasRenderingContext2D, state: BattleState): void {
    // Hide enemy when captured or dead
    if (
      (this.engine.enemyPokemon.currentHp <= 0 && state.enemyFaintPhase === 'dead') ||
      state.enemyFaintPhase === 'dead' ||
      (state.isThrowingBall && state.captureAlpha <= 0) || // Fully absorbed into ball
      state.captureSuccessEffect // Keep hidden during success effect
    )
      return;

    // Fixed base coordinates
    const baseAnchorX = 380;
    const baseAnchorY = 175;

    // Dynamic sprite anchor (with attack lunge and hit knockback; frozen when fainting)
    const isEnemyFainting =
      state.enemyFaintPhase !== 'none' || this.engine.enemyPokemon.currentHp <= 0;
    const anchorX =
      baseAnchorX +
      (isEnemyFainting
        ? 0
        : state.enemyLungeX + state.enemyHitOffsetX + state.allySwitchEnemyOffsetX);
    const anchorY =
      baseAnchorY +
      (isEnemyFainting
        ? 0
        : state.enemyLungeY + state.enemyHitOffsetY + state.allySwitchEnemyOffsetY);

    // Animated sprite (EBS horizontal strip)
    const img = this.assets.enemySprite;
    if (isLoaded(img)) {
      const frameH = img.height;
      const frameW = frameH;
      const totalFrames = Math.max(1, Math.floor(img.width / frameH));
      const isShiny = this.engine.enemyPokemon.isShiny;
      const divisor = isShiny ? 8 : 4;
      // Freeze sprite animation completely when dead/fainting
      const frameIdx = isEnemyFainting
        ? state.enemyFrozenFrame !== null
          ? state.enemyFrozenFrame % totalFrames
          : 0
        : Math.floor(state.tick / divisor) % totalFrames;
      const sx = frameIdx * frameW;

      // Apply capture shrink scale
      // Apply capture shrink scale and EBDX battler dynamics (squash & stretch)
      const captureScale =
        state.isThrowingBall && state.ballThrowPhase === 'capturing'
          ? state.captureShrinkScale
          : 1.0;

      let enemyScaleMultiplierX = captureScale;
      let enemyScaleMultiplierY = captureScale;

      const isAnimPlaying = battleAnimationPlayer.isPlaying();
      const animProgress = battleAnimationPlayer.getProgress();
      const userSide = battleAnimationPlayer.getActiveUserSide();

      if (!isEnemyFainting && (!state.isThrowingBall || state.ballThrowPhase !== 'capturing')) {
        if (isAnimPlaying && userSide === 'enemy') {
          // Enemy attacking: windup squash -> strike stretch
          if (animProgress < 0.24) {
            const t = animProgress / 0.24;
            enemyScaleMultiplierX *= 1.0 + 0.06 * Math.sin(t * Math.PI);
            enemyScaleMultiplierY *= 1.0 - 0.07 * Math.sin(t * Math.PI);
          } else if (animProgress < 0.58) {
            const t = (animProgress - 0.24) / 0.34;
            enemyScaleMultiplierX *= 1.0 - 0.05 * Math.sin(t * Math.PI);
            enemyScaleMultiplierY *= 1.0 + 0.08 * Math.sin(t * Math.PI);
          }
        } else if (state.enemyHitTimer > 0) {
          // Enemy taking damage: impact compression squash
          const hitP = state.enemyHitTimer / 16;
          enemyScaleMultiplierX *= 1.0 + 0.07 * hitP;
          enemyScaleMultiplierY *= 1.0 - 0.08 * hitP;
        }
      }

      const dw = Math.round(frameW * 2.0 * enemyScaleMultiplierX);
      const dh = Math.round(frameH * 2.0 * enemyScaleMultiplierY);
      const dx = Math.round(anchorX - dw / 2);
      const dy = Math.round(anchorY - dh);

      // Sprite silhouette shadow (fades out as enemy dissolves or captured)
      const shadowAlpha =
        state.isThrowingBall && state.ballThrowPhase === 'capturing'
          ? state.captureAlpha * state.enemyShadowAlpha
          : state.enemyShadowAlpha;

      if (shadowAlpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = shadowAlpha;
        this.drawSpriteShadow(ctx, img, sx, frameW, frameH, anchorX, anchorY - 17, dw, dh);
        ctx.restore();
      }

      ctx.save();

      // Apply capture alpha
      if (state.isThrowingBall && state.ballThrowPhase === 'capturing') {
        ctx.globalAlpha = state.captureAlpha;
      }

      // 1. Capture Flash Animation (when being caught)
      if (state.isThrowingBall && state.captureFlashPhase === 'white') {
        // Pokemon turns white when being absorbed
        const can = this.prepareSilhouetteCanvas(img, sx, frameW, frameH, '#ffffff', 'source-in');
        ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
      } else if (state.isThrowingBall && state.captureFlashPhase === 'red') {
        // Pokemon turns red before disappearing
        const can = this.prepareSilhouetteCanvas(img, sx, frameW, frameH, '#ef4444', 'source-in');
        ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
      } else if (state.enemyFaintPhase === 'red_flash') {
        // 2. Faint Animation Stages (Wild Pokémon)
        // Soft red tint ("đỏ nhẹ") - clean overlay, NOT a glaring neon glow
        const can = this.prepareSilhouetteCanvas(
          img,
          sx,
          frameW,
          frameH,
          'rgba(239, 68, 68, 0.55)',
          'source-atop'
        );
        ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
      } else if (state.enemyFaintPhase === 'white_flash') {
        // Solid pure white silhouette ("thành màu trắng lun chứ ko phải phát sáng")
        const can = this.prepareSilhouetteCanvas(img, sx, frameW, frameH, '#ffffff', 'source-in');
        ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
      } else if (state.enemyFaintPhase === 'dissolving') {
        // Top-to-bottom organic dithered pixel dust dissolve on the solid white silhouette
        const can = this.prepareSilhouetteCanvas(img, sx, frameW, frameH, '#ffffff', 'source-in');
        const octx = this.offscreenCtx;
        const imgData = octx.getImageData(0, 0, frameW, frameH);
        const data = imgData.data;
        const cutoff = state.enemyDissolveProgress * (frameH + 12);
        const ditherBand = 10;

        for (let y = 0; y < frameH; y++) {
          if (y > cutoff) break;
          const isErase = y < cutoff - ditherBand;
          const threshold = (cutoff - y) / ditherBand;
          const rowOffset = y * frameW * 4;
          for (let x = 0; x < frameW; x++) {
            const aIdx = rowOffset + x * 4 + 3;
            if (data[aIdx] === 0) continue;
            if (isErase) {
              data[aIdx] = 0;
            } else {
              const hash = ((x * 17 + y * 31 + (x ^ y) * 7) & 0xff) / 255;
              if (hash < threshold) {
                data[aIdx] = 0;
              }
            }
          }
        }
        octx.putImageData(imgData, 0, 0);
        ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);

        // Emit delicate stardust particles rising from the dissolving line
        ctx.save();
        for (let i = 0; i < 40; i++) {
          const birthP = (i % 24) / 24;
          if (state.enemyDissolveProgress < birthP) continue;
          const age = (state.enemyDissolveProgress - birthP) * 45;
          if (age > 24) continue;

          const seedX = ((i * 37 + 19) % 100) / 100;
          const startX = dx + seedX * dw;
          const startY = dy + birthP * dh;

          const driftY = startY - age * 1.1;
          const driftX = startX + Math.sin(age * 0.22 + i * 1.7) * 4 + ((i % 5) - 2) * 0.6 * age;
          const alpha = Math.max(0, (1 - age / 24) * 0.85);
          const sz = age < 5 ? 2.0 : age < 14 ? 1.5 : 1.0;

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
          ctx.fillRect(Math.round(driftX), Math.round(driftY), sz, sz);
        }
        ctx.restore();
      } else {
        // Normal rendering & hit flash
        const animationFlash = battleAnimationPlayer.getBattlerFlashColorForSide('enemy');
        if (animationFlash) {
          const [r, g, b, a] = animationFlash;
          const can = this.prepareSilhouetteCanvas(
            img,
            sx,
            frameW,
            frameH,
            `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`,
            'source-atop'
          );
          ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
        } else if (state.enemyHurtFlash > 0) {
          if (state.enemyHurtFlash % 4 < 2) {
            ctx.filter = 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) saturate(3)';
          } else {
            ctx.filter = 'brightness(3.0)';
          }
        } else if (state.enemyHealFlash > 0) {
          if (state.enemyHealFlash % 4 < 2) {
            ctx.filter = 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.95)) saturate(2.5)';
          } else {
            ctx.filter = 'brightness(1.8) drop-shadow(0 0 6px rgba(134, 239, 172, 0.8))';
          }
        } else if (state.enemyStatusInflictFlash > 0) {
          const t = state.enemyStatusInflictFlash;
          if (t > 44) {
            // Phase 1 (frames 52→44): bright white burst
            ctx.filter = 'brightness(5.0)';
          } else {
            // Phase 2 (frames 44→0): status-colored glow pulsing every 6 frames
            const alpha = Math.min(1.0, t / 12);
            const pulsePhase = Math.floor(t / 6) % 2;
            const col = state.enemyStatusInflictColor.replace(/[\.\d]+\)$/, `${(alpha * 0.95).toFixed(2)})`);
            if (pulsePhase === 0) {
              ctx.filter = `drop-shadow(0 0 16px ${col}) saturate(2.2) brightness(1.6)`;
            } else {
              ctx.filter = `brightness(2.8)`;
            }
          }
        } else if (state.isIntro) {
          const flashStart = 0.55;
          const flashEnd = 0.84;
          if (state.introProgress < flashStart) {
            ctx.filter = 'brightness(0)';
          } else if (state.introProgress < flashEnd) {
            const t = (state.introProgress - flashStart) / (flashEnd - flashStart);
            const flash = t < 0.5 ? 1.0 + (t / 0.5) * 2.5 : 3.5 - ((t - 0.5) / 0.5) * 2.5;
            ctx.filter = `brightness(${flash.toFixed(2)})`;
          } else {
            ctx.filter = 'none';
          }
        } else {
          ctx.filter = 'none';
        }

        if (!animationFlash) {
          ctx.drawImage(img, sx, 0, frameW, frameH, dx, dy, dw, dh);
        }
      }

      ctx.restore();
    }
  }

  // ---- Player Base Platform ----

  private drawPlayerBase(ctx: CanvasRenderingContext2D): void {
    const anchorX = 130;
    const anchorY = 280;
    const base = this.assets.playerBase;
    if (isLoaded(base)) {
      const baseScale = 0.52;
      const bw = Math.round(base.width * baseScale);
      const bh = Math.round(base.height * baseScale);
      const bx = Math.round(anchorX - bw / 2);
      const by = Math.round(anchorY - bh * 0.5);
      ctx.drawImage(base, bx, by, bw, bh);
    }
  }

  // ---- Player Battler ----

  private drawPlayerBattler(ctx: CanvasRenderingContext2D, state: BattleState): void {
    if (this.engine.playerPokemon.currentHp <= 0 && state.playerFaintPhase === 'dead') return;

    const isVisibleInSendOut =
      state.isPlayerSendingOut &&
      (state.sendOutPhase === 'dropping' || state.sendOutPhase === 'landing');

    if (!state.isPlayerPokemonSentOut && !isVisibleInSendOut && state.playerFaintPhase === 'none')
      return;

    // Only consider player fainting if not currently in a send-out sequence
    const isPlayerFainting =
      !state.isPlayerSendingOut &&
      (state.playerFaintPhase !== 'none' || this.engine.playerPokemon.currentHp <= 0);

    if (isPlayerFainting && state.playerFaintPhase === 'dead') return;

    // Dynamic sprite anchor (with attack lunge and hit knockback; frozen when fainting)
    const baseAnchorX = 130;
    const baseAnchorY = isVisibleInSendOut ? state.pokemonDropY : 280;
    const anchorX =
      baseAnchorX +
      (isPlayerFainting
        ? 0
        : state.playerLungeX + state.playerHitOffsetX + state.allySwitchPlayerOffsetX);
    const currentY =
      baseAnchorY +
      (isPlayerFainting
        ? 0
        : state.playerLungeY + state.playerHitOffsetY + state.allySwitchPlayerOffsetY);

    // Base scale modified by send-out physics, faint shrinking, and EBDX battler dynamics (squash & stretch)
    let scaleMultiplierX = isVisibleInSendOut ? state.pokemonScaleX : 1.0;
    let scaleMultiplierY = isVisibleInSendOut ? state.pokemonScaleY : 1.0;

    const isAnimPlaying = battleAnimationPlayer.isPlaying();
    const animProgress = battleAnimationPlayer.getProgress();
    const userSide = battleAnimationPlayer.getActiveUserSide();

    if (!isPlayerFainting && !isVisibleInSendOut) {
      if (isAnimPlaying && userSide === 'player') {
        // Player attacking: windup squash -> strike stretch
        if (animProgress < 0.24) {
          const t = animProgress / 0.24;
          scaleMultiplierX *= 1.0 + 0.06 * Math.sin(t * Math.PI);
          scaleMultiplierY *= 1.0 - 0.07 * Math.sin(t * Math.PI);
        } else if (animProgress < 0.58) {
          const t = (animProgress - 0.24) / 0.34;
          scaleMultiplierX *= 1.0 - 0.05 * Math.sin(t * Math.PI);
          scaleMultiplierY *= 1.0 + 0.08 * Math.sin(t * Math.PI);
        }
      } else if (state.playerHitTimer > 0) {
        // Player taking damage: impact compression squash
        const hitP = state.playerHitTimer / 16;
        scaleMultiplierX *= 1.0 + 0.07 * hitP;
        scaleMultiplierY *= 1.0 - 0.08 * hitP;
      }
    }

    if (isPlayerFainting && state.playerFaintPhase === 'shrinking') {
      scaleMultiplierX *= state.playerFaintScale;
      scaleMultiplierY *= state.playerFaintScale;
    }

    const scaleX = 2.0 * scaleMultiplierX;
    const scaleY = 2.0 * scaleMultiplierY;

    // Animated sprite (EBS horizontal strip)
    let img = this.assets.playerSprite;
    const expectedSrc = this.engine.playerPokemon.backSprite;
    if (expectedSrc && (!img || !img.src.includes(expectedSrc))) {
      img = new Image();
      img.src = expectedSrc;
      this.assets.playerSprite = img;
    }

    if (isLoaded(img)) {
      const frameH = img.height;
      const frameW = frameH;
      const totalFrames = Math.max(1, Math.floor(img.width / frameH));
      const isShiny = this.engine.playerPokemon.isShiny;
      const divisor = isShiny ? 8 : 4;
      // Freeze sprite animation completely when dead/fainting
      const frameIdx = isPlayerFainting
        ? state.playerFrozenFrame !== null
          ? state.playerFrozenFrame % totalFrames
          : 0
        : Math.floor(state.tick / divisor) % totalFrames;
      const sx = frameIdx * frameW;
      const dw = Math.round(frameW * scaleX);
      const dh = Math.round(frameH * scaleY);
      const dx = Math.round(anchorX - dw / 2);
      const dy = Math.round(currentY - dh);

      // Sprite silhouette shadow on base platform (ground level = 280 - 20 = 260)
      if (isVisibleInSendOut) {
        const heightAboveGround = Math.max(0, 280 - currentY);
        const shadowScale = Math.max(0.35, 1.0 - heightAboveGround / 140);
        this.drawSpriteShadow(
          ctx,
          img,
          sx,
          frameW,
          frameH,
          anchorX,
          260,
          Math.round(frameW * 2.0 * shadowScale),
          Math.round(frameH * 2.0 * shadowScale)
        );
      } else if (state.playerFaintPhase === 'shrinking') {
        this.drawSpriteShadow(
          ctx,
          img,
          sx,
          frameW,
          frameH,
          anchorX,
          260,
          Math.round(dw * 0.9),
          Math.round(dh * 0.9)
        );
      } else {
        this.drawSpriteShadow(ctx, img, sx, frameW, frameH, anchorX, 260, dw, dh);
      }

      ctx.save();

      // Faint Animation Stages (Player Pokémon)
      if (state.playerFaintPhase === 'white') {
        // Solid pure white silhouette ("thành màu trắng lun chứ ko phải phát sáng")
        const can = this.prepareSilhouetteCanvas(img, sx, frameW, frameH, '#ffffff', 'source-in');
        ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
      } else if (state.playerFaintPhase === 'shrinking') {
        // Red/white energy recall beam converging down into base
        ctx.save();
        ctx.fillStyle = `rgba(239, 68, 68, ${(0.45 * state.playerFaintScale).toFixed(2)})`;
        ctx.fillRect(baseAnchorX - 2, currentY - 80, 4, 80);
        ctx.restore();

        // Shrunk solid pure white sprite
        const can = this.prepareSilhouetteCanvas(img, sx, frameW, frameH, '#ffffff', 'source-in');
        ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
      } else {
        // Normal rendering / send-out flash / hit flash
        const animationFlash = battleAnimationPlayer.getBattlerFlashColorForSide('player');
        if (animationFlash) {
          const [r, g, b, a] = animationFlash;
          const can = this.prepareSilhouetteCanvas(
            img,
            sx,
            frameW,
            frameH,
            `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`,
            'source-atop'
          );
          ctx.drawImage(can, 0, 0, frameW, frameH, dx, dy, dw, dh);
        } else if (state.playerHurtFlash > 0) {
          if (state.playerHurtFlash % 4 < 2) {
            ctx.filter = 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) saturate(3)';
          } else {
            ctx.filter = 'brightness(3.0)';
          }
        } else if (state.playerHealFlash > 0) {
          if (state.playerHealFlash % 4 < 2) {
            ctx.filter = 'drop-shadow(0 0 12px rgba(74, 222, 128, 0.95)) saturate(2.5)';
          } else {
            ctx.filter = 'brightness(1.8) drop-shadow(0 0 6px rgba(134, 239, 172, 0.8))';
          }
        } else if (state.playerStatusInflictFlash > 0) {
          const t = state.playerStatusInflictFlash;
          if (t > 44) {
            // Phase 1 (frames 52→44): bright white burst
            ctx.filter = 'brightness(5.0)';
          } else {
            // Phase 2 (frames 44→0): status-colored glow pulsing every 6 frames
            const alpha = Math.min(1.0, t / 12);
            const pulsePhase = Math.floor(t / 6) % 2;
            const col = state.playerStatusInflictColor.replace(/[\.\d]+\)$/, `${(alpha * 0.95).toFixed(2)})`);
            if (pulsePhase === 0) {
              ctx.filter = `drop-shadow(0 0 16px ${col}) saturate(2.2) brightness(1.6)`;
            } else {
              ctx.filter = `brightness(2.8)`;
            }
          }
        } else if (isVisibleInSendOut && state.pokemonEnergyFlash > 0.05) {
          ctx.filter = `brightness(${(1.0 + state.pokemonEnergyFlash * 4.5).toFixed(2)})`;
        } else {
          ctx.filter = 'none';
        }

        if (!animationFlash) {
          ctx.drawImage(img, sx, 0, frameW, frameH, dx, dy, dw, dh);
        }
      }

      ctx.restore();
    }
  }

  // ---- Player Send-Out Animation ----

  private drawPlayerSendOut(ctx: CanvasRenderingContext2D, state: BattleState): void {
    if (!state.isPlayerSendingOut) return;

    // 1. Thrown Ball Flight Arc
    if (state.sendOutPhase === 'throwing') {
      const ball = this.assets.ball;
      const t = Math.min(1.0, state.sendOutTick / 26);

      // Translucent shadow cast on the player base ground
      ctx.save();
      const shadowAlpha = 0.08 + t * 0.28;
      const shadowW = Math.round(8 + t * 14);
      const shadowH = Math.round(4 + t * 6);
      ctx.fillStyle = `rgba(10, 20, 25, ${shadowAlpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(Math.round(state.ballX), 275, shadowW, shadowH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Ball sprite (32x64 frame rotated)
      if (isLoaded(ball)) {
        const sx = state.ballRotationFrame * 32;
        const bx = Math.round(state.ballX - 16);
        const by = Math.round(state.ballY - 32);
        ctx.drawImage(ball, sx, 0, 32, 64, bx, by, 32, 64);
      }
      return;
    }

    // 2. Open Ball on Ground
    if (
      (state.sendOutPhase === 'opening' ||
        state.sendOutPhase === 'dropping' ||
        state.sendOutPhase === 'landing') &&
      state.ballAlpha > 0.01
    ) {
      const openBall = this.assets.ballOpen;
      if (isLoaded(openBall)) {
        ctx.save();
        ctx.globalAlpha = state.ballAlpha;
        const bx = Math.round(state.ballX - 16);
        const by = Math.round(state.ballY - 32);
        ctx.drawImage(openBall, 0, 0, 32, 64, bx, by, 32, 64);
        ctx.restore();
      }
    }

    // 3. Energy Burst Effects (during opening and early drop)
    const isBurstActive =
      state.sendOutPhase === 'opening' ||
      (state.sendOutPhase === 'dropping' && state.sendOutTick < 14);

    if (isBurstActive) {
      const burstAge = state.sendOutPhase === 'opening' ? state.sendOutTick : 8 + state.sendOutTick;
      const maxAge = 22;
      const p = Math.min(1.0, burstAge / maxAge);

      const cx = 130;
      const cy = 236;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Soft expanding radial glow
      const glowRadius = Math.max(1, Math.round(15 + p * 45));
      const glowAlpha = Math.max(0, 0.85 - p * 0.8);
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, glowRadius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha.toFixed(2)})`);
      grad.addColorStop(0.4, `rgba(220, 240, 255, ${(glowAlpha * 0.6).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(180, 220, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Rotating burst rays
      const ray = this.assets.ballBurstRay;
      if (isLoaded(ray)) {
        const rayAlpha = Math.max(0, 0.9 - p * 0.9);
        ctx.globalAlpha = rayAlpha;
        const numRays = 8;
        const rayLen = Math.round(20 + p * 55);
        for (let i = 0; i < numRays; i++) {
          const angle = (i * Math.PI * 2) / numRays + state.tick * 0.08;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);
          ctx.drawImage(ray, -6, -rayLen, 12, rayLen);
          ctx.restore();
        }
      }

      // Expanding burst ring
      const ring = this.assets.ballBurstRing;
      if (isLoaded(ring)) {
        const ringScale = 0.2 + p * 0.9;
        const ringAlpha = Math.max(0, 0.8 - p * 0.8);
        ctx.globalAlpha = ringAlpha;
        const rw = Math.round(128 * ringScale);
        const rh = Math.round(64 * ringScale);
        ctx.drawImage(ring, cx - rw / 2, cy - rh / 2, rw, rh);
      }

      // Upward sparkling particles
      const particleAlpha = Math.max(0, 1.0 - p * 0.9);
      ctx.globalAlpha = particleAlpha;
      for (let i = 0; i < 14; i++) {
        const seedAngle = (i / 14) * Math.PI * 2;
        const dist = p * 42 * (0.7 + (i % 4) * 0.15);
        const px = cx + Math.cos(seedAngle) * dist;
        const py = cy + Math.sin(seedAngle) * (dist * 0.5) - p * 35 - (i % 5) * 2;
        const sz = Math.max(1, Math.round(3.5 * (1.0 - p * 0.8)));
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#93c5fd';
        ctx.fillRect(Math.round(px - sz / 2), Math.round(py - sz / 2), sz, sz);
      }

      ctx.restore();
    }
  }

  // ---- Ball Throw ----

  private drawBallThrow(ctx: CanvasRenderingContext2D, state: BattleState): void {
    if (!state.isThrowingBall) return;

    ctx.save();
    // Enable high-quality smoothing specifically for the scaled ball sprite
    // to preserve rounded contours, fine details, and prevent pixel aliasing/distortion
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const ball = this.assets.thrownBall;
    const ballOpen = this.assets.thrownBallOpen;
    const ballClosed = this.assets.thrownBallClosed;

    // Scale Pokéball to 75% (24px x 48px) for authentic proportions against the Pokémon,
    // especially during camera 1.4x capture zoom
    const ballScale = 0.75;
    const ballW = Math.round(32 * ballScale); // 24px
    const ballH = Math.round(64 * ballScale); // 48px

    if (state.ballThrowPhase === 'throwing') {
      // Draw shadow on ground during flight
      ctx.save();
      const t = Math.min(1.0, state.ballThrowTick / 26);
      const shadowAlpha = 0.08 + t * 0.28;
      const shadowW = Math.round((8 + t * 14) * ballScale);
      const shadowH = Math.round((4 + t * 6) * ballScale);
      ctx.fillStyle = `rgba(10, 20, 25, ${shadowAlpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(
        Math.round(state.ballThrowX),
        Math.round(state.ballThrowY + 30 * ballScale),
        shadowW,
        shadowH,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // Draw rotating ball sprite (flying)
      if (isLoaded(ball)) {
        const sx = state.ballThrowRotationFrame * 32;
        const bx = Math.round(state.ballThrowX - ballW / 2);
        const by = Math.round(state.ballThrowY - ballH / 2);
        ctx.drawImage(ball, sx, 0, 32, 64, bx, by, ballW, ballH);
      }
    } else if (state.ballThrowPhase === 'opening') {
      // Draw open ball at enemy position
      if (isLoaded(ballOpen)) {
        const bx = Math.round(state.ballThrowX - ballW / 2);
        const by = Math.round(state.ballThrowY - ballH / 2);
        ctx.drawImage(ballOpen, 0, 0, 32, 64, bx, by, ballW, ballH);
      }
    } else if (state.ballThrowPhase === 'capturing') {
      // Ball stays open at enemy position during capture
      if (isLoaded(ballOpen)) {
        const bx = Math.round(state.ballThrowX - ballW / 2);
        const by = Math.round(state.ballThrowY - ballH / 2);
        ctx.drawImage(ballOpen, 0, 0, 32, 64, bx, by, ballW, ballH);
      }

      // Draw capture beam/energy from ball to Pokemon
      if (state.captureAlpha > 0.3) {
        ctx.save();
        ctx.globalAlpha = state.captureAlpha * 0.5;
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(state.ballThrowX, state.ballThrowY);
        ctx.lineTo(365, 100); // Enemy position
        ctx.stroke();
        ctx.restore();
      }
    } else if (state.ballThrowPhase === 'falling') {
      // Closed ball falling down
      if (isLoaded(ballClosed)) {
        const bx = Math.round(state.ballThrowX - ballW / 2);
        const by = Math.round(state.ballThrowY - ballH / 2);
        ctx.drawImage(ballClosed, 0, 0, 32, 64, bx, by, ballW, ballH);
      }
    } else if (state.ballThrowPhase === 'shaking') {
      // Closed ball on ground, rotating left and right (not moving horizontally)
      if (isLoaded(ballClosed)) {
        const bx = Math.round(state.ballThrowX - ballW / 2);
        const by = Math.round(state.ballThrowY - ballH / 2);

        // Calculate rotation angle when shaking
        const rotationAngle = state.ballShakeTimer > 0 ? Math.sin(state.tick * 0.4) * 0.25 : 0; // ~14 degrees max

        if (rotationAngle !== 0) {
          // Draw with rotation
          ctx.save();
          ctx.translate(state.ballThrowX, state.ballThrowY); // Move to ball center
          ctx.rotate(rotationAngle); // Rotate
          ctx.drawImage(ballClosed, 0, 0, 32, 64, -ballW / 2, -ballH / 2, ballW, ballH); // Draw centered
          ctx.restore();
        } else {
          // Draw normal (no rotation)
          ctx.drawImage(ballClosed, 0, 0, 32, 64, bx, by, ballW, ballH);
        }

        // Dark circular overlay on ball when capture is successful (stays until battle ends)
        if (state.captureSuccessEffect) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(state.ballThrowX, state.ballThrowY, 14 * ballScale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Sparkle burst effect when caught successfully
      if (state.captureSuccessEffect) {
        ctx.save();
        const t = state.captureSuccessTick / 40;
        const centerX = state.ballThrowX;
        const centerY = state.ballThrowY;

        // Multiple sparkle particles bursting out
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2;
          const dist = t * 50 * (0.8 + (i % 3) * 0.2);
          const px = centerX + Math.cos(angle) * dist;
          const py = centerY + Math.sin(angle) * dist;
          const alpha = Math.max(0, 1 - t);
          const size = 2 + (i % 3);

          ctx.globalAlpha = alpha;
          ctx.fillStyle = i % 2 === 0 ? '#ffff00' : '#ffffff'; // Yellow and white stars
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ---- Battle Intro Shutters (Opening from center + Looping Overlay) ----

  private drawIntroShutters(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const p = Math.min(1.0, Math.max(0, state.introProgress));

    // Phase 1: Shutters open during p: 0.0 -> INTRO_SHUTTER_PROGRESS (2.5s)
    const shutterP = Math.min(1.0, p / INTRO_SHUTTER_PROGRESS);
    const easedS =
      shutterP < 0.5 ? 2 * shutterP * shutterP : 1 - Math.pow(-2 * shutterP + 2, 2) / 2;

    const centerY = BOTTOM_PANEL_Y / 2; // 144
    const topY = Math.round(centerY * (1 - easedS));
    const bottomY = Math.round(centerY + easedS * (BOTTOM_PANEL_Y - centerY));

    // 1. Looping Overlay strip (drawn BEHIND the black shutters)
    // Sinks smoothly and continuously from Y=152 down to Y=290 (deep behind the bottom UI panel)
    const overlay = this.assets.foregroundOverlay;
    if (overlay && isLoaded(overlay)) {
      const scale = 0.5;
      const overlayW = Math.round(overlay.width * scale);
      const overlayH = Math.round(overlay.height * scale);

      // Smoothly and continuously lower the overlay from 146.1 all the way down to 290
      // Emerges at a small gap, stays higher through the shutter open, then sinks below the UI panel as intro finishes
      const overlayY = Math.round(146.1 + Math.pow(p, 2.7) * (BOTTOM_PANEL_Y + 2 - 146.1));

      if (overlayY < BOTTOM_PANEL_Y) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, CANVAS_W, BOTTOM_PANEL_Y);
        ctx.clip();

        // Infinite horizontal scroll loop at 50% scale (boosted loop speed to 12 for swift dynamic drift)
        const loopSpeed = 12;
        const loopX = Math.round((state.tick * loopSpeed) % overlayW);

        let startX = -loopX;
        while (startX < CANVAS_W) {
          ctx.drawImage(overlay, startX, overlayY, overlayW, overlayH);
          startX += overlayW;
        }
        ctx.restore();
      }
    }

    // 2. Black Shutters drawn IN FRONT of the overlay
    ctx.fillStyle = '#000000';
    // Top Shutter (moves UP from 144 to 0)
    if (topY > 0) {
      ctx.fillRect(0, 0, CANVAS_W, topY);
    }

    // Bottom Shutter (moves DOWN from 144 to 288)
    if (bottomY < BOTTOM_PANEL_Y) {
      ctx.fillRect(0, bottomY, CANVAS_W, BOTTOM_PANEL_Y - bottomY);
    }
  }

  // ---- Enemy Databox ----

  renderEnemyDatabox(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    state: BattleState
  ): void {
    if (state.enemyDataboxProgress <= 0) return;
    const enemy = this.engine.enemyPokemon;
    const scale = 0.9;

    const t = state.enemyDataboxProgress;
    const e = 1 - Math.pow(1 - t, 3);
    const introOffset = Math.round((1 - e) * -260);

    // Smoothly slide out to left edge during capture zoom
    const zoomT = state.captureZoomProgress;
    const zoomE = zoomT < 0.5 ? 2 * zoomT * zoomT : 1 - Math.pow(-2 * zoomT + 2, 2) / 2;
    const zoomOffset = Math.round(zoomE * -300);

    const slideOffset = introOffset + zoomOffset;
    if (dx + slideOffset < -280) return; // Completely off-screen

    ctx.save();
    ctx.translate(dx + slideOffset, dy);
    ctx.scale(scale, scale);

    // Background databox (260 x 70)
    if (isLoaded(this.assets.databoxEnemy)) {
      ctx.drawImage(this.assets.databoxEnemy, 0, 0, 260, 70);
    }

    // Name
    ctx.font = `16px ${BATTLE_FONT}`;
    this.drawTextWithOutline(ctx, enemy.name, 8, 31, '#ffffff');

    // Gender symbol
    const genderSymbol = enemy.gender === 'male' ? '♂' : enemy.gender === 'female' ? '♀' : '';
    const genderColor = enemy.gender === 'male' ? '#3b82f6' : '#ef4444';
    if (genderSymbol) {
      this.drawTextWithOutline(ctx, genderSymbol, 126, 31, genderColor);
    }

    // Level
    this.drawTextWithOutline(ctx, `Lv.${enemy.level}`, 142, 31, '#ffffff');

    // Shiny Icon
    if (enemy.isShiny && isLoaded(this.assets.shinyIcon)) {
      const lvTextW = ctx.measureText(`Lv.${enemy.level}`).width;
      ctx.drawImage(this.assets.shinyIcon, 142 + lvTextW + 4, 18, 14, 14);
    }

    // Tera Badge if Terastallized
    if (enemy.isTerastallized && enemy.teraType) {
      const lvTextW = ctx.measureText(`Lv.${enemy.level}`).width;
      const teraOffset = enemy.isShiny && isLoaded(this.assets.shinyIcon) ? 20 : 4;
      ctx.font = `bold 11px ${BATTLE_FONT}`;
      this.drawTextWithOutline(
        ctx,
        `💎${enemy.teraType.toUpperCase()}`,
        142 + lvTextW + teraOffset,
        31,
        '#38bdf8',
        '#000000',
        1
      );
    }

    // Type Badges (Horizontal in the black tab under HP bar, enlarged by 20%)
    const typeScale = 0.6;
    const typeIconW = 24 * typeScale;
    const typeGap = 3;
    const tabCenterX = 184;
    const typeY = 52;

    if (enemy.types.length === 1) {
      const typeX = Math.round(tabCenterX - typeIconW / 2);
      TypeBadgeRenderer.drawTypeIcon(ctx, enemy.types[0], typeX, typeY, typeScale);
    } else if (enemy.types.length >= 2) {
      const totalW = typeIconW * 2 + typeGap;
      const startX = Math.round(tabCenterX - totalW / 2);
      TypeBadgeRenderer.drawTypeIcon(ctx, enemy.types[0], startX, typeY, typeScale);
      TypeBadgeRenderer.drawTypeIcon(
        ctx,
        enemy.types[1],
        startX + typeIconW + typeGap,
        typeY,
        typeScale
      );
    }

    // HP Bar
    const isEnemyHealing =
      state.enemyHealFlash > 0 || state.enemyHpPct < state.targetEnemyHpPct - 0.005;
    this.drawHpBar(ctx, 118, 40, 96, 6, state.enemyHpPct, state.ghostEnemyHpPct, isEnemyHealing);
    // Status Icon (covers the PS tag directly in front of the HP bar at native 1:1 scale 44x16)
    this.drawStatusIcon(ctx, this.assets.statusIcons, enemy.status, 72, 35, 1);
    // Stat Stage Badges (under HP bar on the left of the type tab, pushed down 5px to y=56)
    this.drawStatBadges(ctx, enemy.statStages, 8, 56, 140);
    ctx.restore();
  }

  // ---- Player Databox ----

  renderPlayerDatabox(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    state: BattleState
  ): void {
    if (state.playerDataboxProgress <= 0) return;
    const player = this.engine.playerPokemon;

    const t = state.playerDataboxProgress;
    const e = 1 - Math.pow(1 - t, 3);
    const introOffset = Math.round((1 - e) * (CANVAS_W - dx));

    // Smoothly slide out to right edge during capture zoom
    const zoomT = state.captureZoomProgress;
    const zoomE = zoomT < 0.5 ? 2 * zoomT * zoomT : 1 - Math.pow(-2 * zoomT + 2, 2) / 2;
    const zoomOffset = Math.round(zoomE * (CANVAS_W - dx + 50));

    const slideOffset = introOffset + zoomOffset;
    if (dx + slideOffset > CANVAS_W + 50) return; // Completely off-screen

    ctx.save();
    ctx.translate(slideOffset, 0);

    // Background databox (260 x 84)
    if (isLoaded(this.assets.databoxPlayer)) {
      ctx.drawImage(this.assets.databoxPlayer, dx, dy, 260, 84);
    }

    // Type Badges
    if (player.types.length > 0) {
      TypeBadgeRenderer.drawTypeIcon(ctx, player.types[0], dx + 28, dy + 15, 0.75);
    }
    if (player.types.length > 1) {
      TypeBadgeRenderer.drawTypeIcon(ctx, player.types[1], dx + 28, dy + 39, 0.75);
    }

    // Name
    ctx.font = `16px ${BATTLE_FONT}`;
    this.drawTextWithOutline(ctx, player.name, dx + 58, dy + 31, '#ffffff', '#000000', 1);

    // Gender symbol
    const genderSymbol = player.gender === 'male' ? '♂' : player.gender === 'female' ? '♀' : '';
    const genderColor = player.gender === 'male' ? '#3b82f6' : '#ef4444';
    if (genderSymbol) {
      this.drawTextWithOutline(ctx, genderSymbol, dx + 176, dy + 31, genderColor, '#000000', 3);
    }

    // Level
    this.drawTextWithOutline(ctx, `Lv.${player.level}`, dx + 192, dy + 31, '#ffffff', '#000000', 1);

    // Shiny Icon
    if (player.isShiny && isLoaded(this.assets.shinyIcon)) {
      const lvTextW = ctx.measureText(`Lv.${player.level}`).width;
      ctx.drawImage(this.assets.shinyIcon, dx + 192 + lvTextW + 4, dy + 18, 14, 14);
    }

    // Tera Badge if Terastallized
    if (player.isTerastallized && player.teraType) {
      const lvTextW = ctx.measureText(`Lv.${player.level}`).width;
      const teraOffset = player.isShiny && isLoaded(this.assets.shinyIcon) ? 20 : 4;
      ctx.font = `bold 11px ${BATTLE_FONT}`;
      this.drawTextWithOutline(
        ctx,
        `💎${player.teraType.toUpperCase()}`,
        dx + 192 + lvTextW + teraOffset,
        dy + 31,
        '#38bdf8',
        '#000000',
        1
      );
    }

    // HP Bar
    const isPlayerHealing =
      state.playerHealFlash > 0 || state.playerHpPct < state.targetPlayerHpPct - 0.005;
    this.drawHpBar(
      ctx,
      dx + 136,
      dy + 40,
      96,
      6,
      state.playerHpPct,
      state.ghostPlayerHpPct,
      isPlayerHealing
    );
    // Status Icon (covers the PS tag directly in front of the HP bar at native 1:1 scale 44x16)
    this.drawStatusIcon(ctx, this.assets.statusIcons, player.status, dx + 90, dy + 35, 1);

    // Numerical HP
    ctx.font = `16px ${BATTLE_FONT}`;
    ctx.textAlign = 'right';
    this.drawTextWithOutline(
      ctx,
      `${Math.round(player.currentHp)}/${player.maxHp}`,
      485,
      dy + 60,
      '#ffffff',
      '#000000',
      1
    );
    ctx.textAlign = 'left';

    // EXP Bar
    const expPct = Math.max(0, Math.min(1, player.exp / Math.max(1, player.maxExp)));
    const fillExpW = Math.round(192 * expPct);
    if (isLoaded(this.assets.overlayExp) && fillExpW > 0) {
      ctx.drawImage(this.assets.overlayExp, 0, 0, fillExpW, 4, dx + 40, dy + 74, fillExpW, 4);
    } else if (fillExpW > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(dx + 40, dy + 74, fillExpW, 4);
    }

    // Stat Stage Badges (under HP bar on the left of numerical HP, pushed down 5px to dy+56)
    this.drawStatBadges(ctx, player.statStages, dx + 58, dy + 56, 122);

    ctx.restore();
  }

  private drawStatusIcon(
    ctx: CanvasRenderingContext2D,
    sheet: HTMLImageElement,
    status: BattlerPokemon['status'],
    dx: number,
    dy: number,
    scale: number
  ): void {
    const frame = getBattleStatusIconFrame(status);
    if (!frame || !isLoaded(sheet)) return;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet,
      frame.sx,
      frame.sy,
      frame.sw,
      frame.sh,
      dx,
      dy,
      frame.sw * scale,
      frame.sh * scale
    );
  }

  /** Render active stat stage boost/drop badges under the HP bar */
  private drawStatBadges(
    ctx: CanvasRenderingContext2D,
    stages: StatStages | undefined,
    startX: number,
    startY: number,
    maxWidth = 140
  ): void {
    if (!stages) return;

    const statDefs: Array<{ key: keyof StatStages; label: string }> = [
      { key: 'attack', label: 'ATK' },
      { key: 'defense', label: 'DEF' },
      { key: 'spAtk', label: 'SPA' },
      { key: 'spDef', label: 'SPD' },
      { key: 'speed', label: 'SPE' },
      { key: 'accuracy', label: 'ACC' },
      { key: 'evasion', label: 'EVA' },
    ];

    const activeStats = statDefs
      .map(({ key, label }) => ({ label, stage: stages[key] ?? 0 }))
      .filter((s) => s.stage !== 0);

    if (activeStats.length === 0) return;

    const count = activeStats.length;
    const gap = count > 3 ? 2 : 3;
    const badgeW = Math.max(18, Math.min(32, Math.floor((maxWidth - (count - 1) * gap) / count)));
    const badgeH = 14;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.font = `${badgeW < 28 ? 'bold 10px' : 'bold 12px'} ${BATTLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    activeStats.forEach((stat, i) => {
      const bx = Math.round(startX + i * (badgeW + gap));
      const by = Math.round(startY);

      const isBuff = stat.stage > 0;
      const stageStr = isBuff ? `+${stat.stage}` : `${stat.stage}`;
      const text = badgeW < 28 ? `${stageStr}${stat.label}` : `${stageStr} ${stat.label}`;

      // Solid Badge Background & Crisp Border (high contrast)
      ctx.fillStyle = isBuff ? '#14532d' : '#7f1d1d';
      ctx.strokeStyle = isBuff ? '#4ade80' : '#f87171';
      ctx.lineWidth = 1;

      // Draw rounded rectangle
      this.drawRoundedRect(ctx, bx, by, badgeW, badgeH, 2);
      ctx.fill();
      ctx.stroke();

      // Draw Badge Text with 1px black drop shadow for crisp readability
      const tx = Math.round(bx + badgeW / 2);
      const ty = Math.round(by + badgeH / 2 + 1);
      ctx.fillStyle = '#000000';
      ctx.fillText(text, tx + 1, ty + 1);
      ctx.fillStyle = isBuff ? '#ffffff' : '#ffffff';
      ctx.fillText(text, tx, ty);
    });

    ctx.restore();
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  // ---- Bottom Panel ----

  renderBottomPanel(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const py = BOTTOM_PANEL_Y;

    // Solid black backing for bottom UI panel
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, py, CANVAS_W, 96);

    // Message box frame (overlay_message_3.png: 512x96)
    if (isLoaded(this.assets.messageBox)) {
      ctx.drawImage(this.assets.messageBox, 0, py, CANVAS_W, 96);
    }

    if (state.uiMode === 'message') {
      this.renderMessageMode(ctx, state, py);
      return;
    }

    if (state.uiMode === 'command') {
      this.renderCommandMode(ctx, state, py);
      return;
    }

    if (state.uiMode === 'moves') {
      this.renderMovesMode(ctx, state, py);
      return;
    }

    if (state.uiMode === 'bag') {
      this.renderBagMode(ctx, state, py);
    }
  }

  private renderMessageMode(ctx: CanvasRenderingContext2D, state: BattleState, py: number): void {
    ctx.font = `20px ${BATTLE_FONT}`;
    this.drawTextWithOutline(ctx, state.currentDisplayedText, 28, py + 48, '#ffffff');

    // Blinking cursor arrow
    if (state.textTypingIndex >= state.messageText.length && state.tick % 30 < 15) {
      this.drawTextWithOutline(ctx, '▼', 475, py + 65, '#38bdf8');
    }
  }

  private renderCommandMode(ctx: CanvasRenderingContext2D, state: BattleState, py: number): void {
    // Left dialogue
    ctx.font = `20px ${BATTLE_FONT}`;
    this.drawTextWithOutline(ctx, 'What should', 28, py + 38, '#ffffff');
    this.drawTextWithOutline(ctx, `${this.engine.playerPokemon.name} do?`, 28, py + 66, '#ffffff');

    // 4 Action Buttons from command_buttons.png (260x460 sheet: 2 cols x 10 rows, 130x46 per cell)
    if (isLoaded(this.assets.commandButtons)) {
      // Spritesheet layout: 10 rows × 2 columns (col 0: normal, col 1: hover/selected)
      // Row indices:
      // 0: FIGHT
      // 1: POKÉMON
      // 2: BAG
      // 3: RUN
      const rowIndices = [
        0, // 0: FIGHT   (Top-Left)
        2, // 1: BAG     (Top-Right)
        1, // 2: POKÉMON (Bottom-Left)
        3, // 3: RUN     (Bottom-Right)
      ];

      for (let i = 0; i < 4; i++) {
        const c = COMMAND_BTN_COORDS[i];
        const isHovered = state.hoveredCommandIdx === i;
        const sx = isHovered ? 130 : 0;
        const sy = rowIndices[i] * 46;
        const sw = 130;
        const sh = 46;
        ctx.drawImage(
          this.assets.commandButtons,
          sx,
          sy,
          sw,
          sh,
          c.x,
          c.y,
          COMMAND_BTN_W,
          COMMAND_BTN_H
        );
      }
    } else {
      // Fallback pill buttons
      const colors = ['#dc2626', '#d97706', '#16a34a', '#0284c7'];
      for (let i = 0; i < 4; i++) {
        const c = COMMAND_BTN_COORDS[i];
        this.drawPillButton(
          ctx,
          c.x,
          c.y,
          COMMAND_BTN_W,
          COMMAND_BTN_H,
          colors[i],
          state.hoveredCommandIdx === i
        );
      }
    }
  }

  private renderMovesMode(ctx: CanvasRenderingContext2D, state: BattleState, py: number): void {
    const moves = this.engine.playerPokemon.moves;
    const btnW = 190;
    const btnH = 38;
    const coords = [
      { x: 12, y: py + 8 },
      { x: 206, y: py + 8 },
      { x: 12, y: py + 48 },
      { x: 206, y: py + 48 },
    ];

    for (let i = 0; i < 4; i++) {
      const m = moves[i];
      const c = coords[i];
      const isHovered = state.hoveredMoveIdx === i;
      if (m) {
        this.drawMoveSlot(ctx, c.x, c.y, btnW, btnH, m, isHovered);
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, btnW, btnH, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        if (!this.disableCanvasText) {
          ctx.fillText('-', c.x + btnW / 2, c.y + 24);
        }
        ctx.textAlign = 'left';
      }
    }

    // Right Column: CANCEL Button & TERASTAL Button
    const canTera = this.engine.canTerastallize('player');
    const isTerad = this.engine.playerPokemon.isTerastallized;

    if (canTera || isTerad) {
      const teraX = 402;
      const teraY = py + 8;
      const teraW = 102;
      const teraH = 36;

      ctx.save();
      if (isTerad) {
        // Already Terastallized badge
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(teraX, teraY, teraW, teraH, 6);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = `bold 12px ${BATTLE_FONT}`;
        ctx.textAlign = 'center';
        this.drawTextWithOutline(
          ctx,
          `💎 TERA ${this.engine.playerPokemon.teraType?.toUpperCase()}`,
          teraX + teraW / 2,
          teraY + 23,
          '#38bdf8',
          '#000000',
          1
        );
      } else {
        // Can Terastallize button
        const isHovered = state.hoveredTerastal;
        const isReq = state.terastalRequested;
        ctx.fillStyle = isReq
          ? isHovered
            ? '#0284c7'
            : '#0369a1'
          : isHovered
            ? '#334155'
            : '#1e293b';
        ctx.beginPath();
        ctx.roundRect(teraX, teraY, teraW, teraH, 6);
        ctx.fill();
        ctx.strokeStyle = isReq ? '#facc15' : isHovered ? '#7dd3fc' : '#38bdf8';
        ctx.lineWidth = isReq ? 2 : 1.5;
        ctx.stroke();
        ctx.font = `bold 12px ${BATTLE_FONT}`;
        ctx.textAlign = 'center';
        const label = isReq ? '💎 TERA ON' : '💎 TERASTAL';
        const textColor = isReq ? '#fef08a' : isHovered ? '#ffffff' : '#38bdf8';
        this.drawTextWithOutline(
          ctx,
          label,
          teraX + teraW / 2,
          teraY + 23,
          textColor,
          '#000000',
          1
        );
      }
      ctx.restore();

      // Cancel button below
      const cancelX = 402;
      const cancelY = py + 48;
      const cancelW = 102;
      const cancelH = 36;
      if (isLoaded(this.assets.commandButtons)) {
        const cancelSx = state.hoveredCancel ? 130 : 0;
        ctx.drawImage(
          this.assets.commandButtons,
          cancelSx,
          414,
          130,
          46,
          cancelX,
          cancelY,
          cancelW,
          cancelH
        );
      } else {
        this.drawPillButton(
          ctx,
          cancelX,
          cancelY,
          cancelW,
          cancelH,
          '#94a3b8',
          state.hoveredCancel
        );
        ctx.font = `16px ${BATTLE_FONT}`;
        this.drawTextWithOutline(
          ctx,
          'CANCEL',
          cancelX + 26,
          cancelY + 24,
          '#ffffff',
          '#000000',
          1
        );
      }
    } else {
      const cancelX = 402;
      const cancelY = py + 26;
      const cancelW = 102;
      const cancelH = 42;

      if (isLoaded(this.assets.commandButtons)) {
        const cancelSx = state.hoveredCancel ? 130 : 0;
        ctx.drawImage(
          this.assets.commandButtons,
          cancelSx,
          414,
          130,
          46,
          cancelX,
          cancelY,
          cancelW,
          cancelH
        );
      } else {
        this.drawPillButton(
          ctx,
          cancelX,
          cancelY,
          cancelW,
          cancelH,
          '#94a3b8',
          state.hoveredCancel
        );
        ctx.font = `18px ${BATTLE_FONT}`;
        this.drawTextWithOutline(
          ctx,
          'CANCEL',
          cancelX + 26,
          cancelY + 26,
          '#ffffff',
          '#000000',
          1
        );
      }
    }
  }

  private renderBagMode(ctx: CanvasRenderingContext2D, _state: BattleState, py: number): void {
    ctx.font = `16px ${BATTLE_FONT}`;
    this.drawTextWithOutline(
      ctx,
      `BÓNG POKÉ: x${this.engine.ballsCount}`,
      32,
      py + 48,
      '#ffffff',
      '#000000',
      3
    );

    // Use Ball Button
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(200, py + 25, 160, 45);
    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 2;
    ctx.strokeRect(200, py + 25, 160, 45);
    this.drawTextWithOutline(ctx, '⚾ NÉM BÓNG', 215, py + 53, '#ffffff', '#000000', 2);

    // Back Button
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(390, py + 30, 95, 36);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(390, py + 30, 95, 36);
    this.drawTextWithOutline(ctx, 'QUAY LẠI', 415, py + 53, '#ffffff', '#000000', 2);
  }

  // ---- Sprite Silhouette Shadow ----

  /** Offscreen canvas for shadow silhouette generation (reused to avoid GC) */
  private _shadowCanvas: HTMLCanvasElement | null = null;
  private _shadowCtx: CanvasRenderingContext2D | null = null;

  /**
   * Draws the Pokemon's own sprite as a flattened, dark silhouette shadow.
   * Uses the current animation frame so the shadow shape changes with the animation.
   *
   * Pipeline:
   * 1. Draw sprite frame to offscreen canvas
   * 2. Fill opaque pixels with black (globalCompositeOperation: 'source-in')
   * 3. Draw silhouette onto main canvas, flattened (scaleY ~0.3) and semi-transparent
   */
  private drawSpriteShadow(
    ctx: CanvasRenderingContext2D,
    spriteImg: HTMLImageElement,
    sx: number,
    frameW: number,
    frameH: number,
    anchorX: number,
    anchorY: number,
    drawW: number,
    drawH: number
  ): void {
    // Lazy-init offscreen canvas
    if (!this._shadowCanvas) {
      this._shadowCanvas = document.createElement('canvas');
      this._shadowCtx = this._shadowCanvas.getContext('2d');
    }
    const sc = this._shadowCanvas!;
    const sctx = this._shadowCtx!;

    // Size offscreen to fit one frame
    if (sc.width !== frameW || sc.height !== frameH) {
      sc.width = frameW;
      sc.height = frameH;
    }

    // 1. Draw current sprite frame
    sctx.clearRect(0, 0, frameW, frameH);
    sctx.globalCompositeOperation = 'source-over';
    sctx.drawImage(spriteImg, sx, 0, frameW, frameH, 0, 0, frameW, frameH);

    // 2. Convert to black silhouette (keeps alpha, replaces color with black)
    sctx.globalCompositeOperation = 'source-in';
    sctx.fillStyle = '#000000';
    sctx.fillRect(0, 0, frameW, frameH);
    sctx.globalCompositeOperation = 'source-over';

    // 3. Draw silhouette shadow on main canvas
    const shadowScaleY = 0.25; // Flatten vertically
    const shadowW = drawW;
    const shadowH = Math.round(drawH * shadowScaleY);

    // Position: centered at feet, directly under the sprite
    const shadowX = Math.round(anchorX - shadowW / 2);
    const shadowY = Math.round(anchorY - shadowH * 0.5);

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.drawImage(sc, 0, 0, frameW, frameH, shadowX, shadowY, shadowW, shadowH);
    ctx.restore();
  }

  // ---- Drawing Utilities ----

  drawTextWithOutline(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fillColor: string,
    _strokeColor?: string,
    _strokeWidth?: number
  ): void {
    if (this.disableCanvasText) return;
    ctx.save();
    // 1px retro drop shadow (crisp black at x+1, y+1) prevents anti-aliasing color wash and makes pure white pop
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x + 1, y + 1);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawHpBar(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    bw: number,
    bh: number,
    pct: number,
    ghostPct: number = pct,
    isHealing: boolean = false
  ): void {
    const fillW = Math.max(0, Math.round(bw * pct));
    const ghostW = Math.max(0, Math.round(bw * ghostPct));

    // Underlay ghost bar (amber damage indicator)
    if (ghostW > fillW) {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(bx + fillW, by, ghostW - fillW, bh);
    }

    if (fillW > 0) {
      let fillColor = '#22c55e'; // Green >= 50%
      if (pct < 0.2)
        fillColor = '#ef4444'; // Red < 20%
      else if (pct < 0.5) fillColor = '#eab308'; // Yellow 20-50%

      if (isHealing) {
        ctx.save();
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(bx, by, fillW, bh);
        ctx.restore();
      } else {
        ctx.fillStyle = fillColor;
        ctx.fillRect(bx, by, fillW, bh);
      }

      // Top 2px highlight
      ctx.fillStyle = isHealing ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(bx, by, fillW, 2);

      // Healing pulse line at the leading edge
      if (isHealing && fillW < bw) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + fillW - 2, by - 1, 3, bh + 2);
      }
    }
  }

  private drawPillButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    borderColor: string,
    isHovered: boolean
  ): void {
    ctx.save();
    ctx.fillStyle = isHovered ? '#334155' : '#1e293b';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawMoveSlot(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    move: BattleMove,
    isHovered: boolean
  ): void {
    // 1. Draw button base from battleFightButtons.png (slice 244 x 44)
    if (isLoaded(this.assets.fightButtons)) {
      const typeKey = move.type
        ? move.type.charAt(0).toUpperCase() + move.type.slice(1).toLowerCase()
        : 'Normal';
      const typeIdx = TYPE_ICO_INDICES[typeKey] ?? 0;
      const sx = isHovered ? 244 : 0;
      const sy = typeIdx * 44;
      ctx.drawImage(this.assets.fightButtons, sx, sy, 244, 44, x, y, w, h);
    } else {
      ctx.fillStyle = isHovered ? '#475569' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
    }

    // Right-side column center X: Category Icon (top) + Move Power (bottom)
    const rightColCenterX = x + w - 25;

    // 2. Move Name (left-aligned, vertically centered, auto-scaled to avoid icon overlap)
    const displayName = (move.nameVi || move.name).replace(/^[^(]+\(([^)]+)\)$/, '$1').trim();
    let fontSize = 18;
    ctx.font = `${fontSize}px ${BATTLE_FONT}`;
    const maxTextW = rightColCenterX - 18 - (x + 36);
    while (ctx.measureText(displayName).width > maxTextW && fontSize > 12) {
      fontSize--;
      ctx.font = `${fontSize}px ${BATTLE_FONT}`;
    }
    this.drawTextWithOutline(ctx, displayName, x + 36, y + 25, '#ffffff');

    // 3. Move Category Icon (top-right, above PP)
    if (isLoaded(this.assets.categoryIcon)) {
      const catIdx = move.category === 'special' ? 1 : move.category === 'status' ? 2 : 0;
      const catSy = catIdx * 28;
      const catW = 27;
      const catH = 12;
      const catX = Math.round(rightColCenterX - catW / 2);
      ctx.drawImage(this.assets.categoryIcon, 0, catSy, 64, 28, catX, y + 5, catW, catH);
    }

    // 4. Move PP (bottom-right, directly under category icon)
    const ppStr = `${move.pp}/${move.maxPp}`;
    const ppColor = move.pp === 0 ? '#ef4444' : '#ffffff';
    ctx.font = `14px ${BATTLE_FONT}`;
    ctx.textAlign = 'center';
    this.drawTextWithOutline(ctx, ppStr, rightColCenterX, y + 32, ppColor);
    ctx.textAlign = 'left';
  }

  /**
   * Authentic Shiny entrance sparkle effect in battle.
   * Features:
   * 1. Expanding brilliant radial glow flash at center.
   * 2. Circle of rotating 4-pointed radiant sparkle stars bursting outward.
   * 3. Diamond starburst rays radiating and floating starlight dust.
   */
  private drawBattleShinySparkles(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    timer: number,
    maxTimer: number
  ): void {
    const p = Math.min(1.0, Math.max(0, 1.0 - timer / maxTimer));

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 1. Central radiant glow burst (peaks early at p ~ 0.2, fades out)
    const glowRadius = Math.max(1, Math.round(18 + p * 62));
    const glowAlpha = Math.max(0, 0.9 - p * 1.1);
    if (glowAlpha > 0.01) {
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, glowRadius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha.toFixed(2)})`);
      grad.addColorStop(0.35, `rgba(254, 240, 138, ${(glowAlpha * 0.85).toFixed(2)})`);
      grad.addColorStop(0.7, `rgba(234, 179, 8, ${(glowAlpha * 0.45).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Starburst cross rays (flashing out from center)
    const rayAlpha = Math.max(0, 0.85 - p * 0.95);
    if (rayAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = rayAlpha;
      const numRays = 8;
      const rayLen = Math.round(25 + p * 65);
      const rayWidth = Math.max(1, Math.round(3 * (1.0 - p * 0.7)));
      for (let i = 0; i < numRays; i++) {
        const angle = (i * Math.PI * 2) / numRays + p * 1.2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const rayGrad = ctx.createLinearGradient(0, 0, 0, -rayLen);
        rayGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        rayGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.8)');
        rayGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = rayGrad;
        ctx.beginPath();
        ctx.moveTo(-rayWidth, 0);
        ctx.lineTo(0, -rayLen);
        ctx.lineTo(rayWidth, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // 3. Ring of 10 bursting sparkle stars expanding outward in a spiral
    const numStars = 10;
    const ringRadius = 14 + Math.pow(p, 0.85) * 82;
    const starAlpha = Math.max(0, 1.0 - Math.pow(p, 1.4));

    for (let i = 0; i < numStars; i++) {
      const baseAngle = (i * Math.PI * 2) / numStars;
      const angle = baseAngle + p * 1.4; // spinning expansion
      const sx = cx + Math.cos(angle) * ringRadius;
      const sy = cy + Math.sin(angle) * (ringRadius * 0.75); // slight perspective tilt

      // Star size scales up then tapers down
      const sizeFactor = Math.sin(p * Math.PI);
      const starSize = 5 + sizeFactor * 9;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle * 2.2);
      ctx.globalAlpha = starAlpha;

      // Draw 4-pointed radiant sparkle star
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fde047';
      ctx.beginPath();
      ctx.moveTo(0, -starSize);
      ctx.lineTo(starSize * 0.26, -starSize * 0.26);
      ctx.lineTo(starSize, 0);
      ctx.lineTo(starSize * 0.26, starSize * 0.26);
      ctx.lineTo(0, starSize);
      ctx.lineTo(-starSize * 0.26, starSize * 0.26);
      ctx.lineTo(-starSize, 0);
      ctx.lineTo(-starSize * 0.26, -starSize * 0.26);
      ctx.closePath();
      ctx.fill();

      // Golden center core
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, starSize * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Trailing micro-starlight dust particle
      const trailAngle = angle - 0.22;
      const trailDist = ringRadius * 0.84;
      const tx = cx + Math.cos(trailAngle) * trailDist;
      const ty = cy + Math.sin(trailAngle) * (trailDist * 0.75);
      ctx.save();
      ctx.globalAlpha = starAlpha * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tx, ty, Math.max(1, 2.5 * sizeFactor), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draws the in-battle ability activation banner sliding in from the screen edge.
   * Player side: uses top strip of ability_bar.png and slides from left edge (y ≈ 185).
   * Enemy side: uses bottom strip of ability_bar.png and slides from right edge (y ≈ 65).
   */
  private drawAbilityBanner(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const banner = state.currentAbilityBanner;
    if (!banner || banner.slideProgress <= 0 || !isLoaded(this.assets.abilityBar)) {
      return;
    }

    const BAR_W = 256;
    const BAR_H = 64;
    const { side, pokemonName, abilityNameVi, slideProgress } = banner;

    ctx.save();

    if (side === 'player') {
      // Top strip of ability_bar.png (sx: 0, sy: 0, sw: 256, sh: 64)
      // Slanted on the right; slides in from left edge
      const drawX = Math.round(-BAR_W + BAR_W * slideProgress);
      const drawY = 185;

      ctx.drawImage(this.assets.abilityBar, 0, 0, BAR_W, BAR_H, drawX, drawY, BAR_W, BAR_H);

      // Text positioned cleanly within the left portion of the banner
      const textX = drawX + 24;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Pokemon Name (sub-header)
      ctx.font = `bold 16px ${BATTLE_FONT}`;
      ctx.fillStyle = '#CBD5E1';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;
      ctx.fillText(pokemonName, textX, drawY + 22);

      // Ability Name (vibrant white header)
      ctx.font = `bold 22px ${BATTLE_FONT}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.fillText(abilityNameVi, textX, drawY + 44);
    } else {
      // Bottom strip of ability_bar.png (sx: 0, sy: 64, sw: 256, sh: 64)
      // Slanted on the left; slides in from right edge
      const drawX = Math.round(CANVAS_W - BAR_W * slideProgress);
      const drawY = 65;

      ctx.drawImage(this.assets.abilityBar, 0, 64, BAR_W, BAR_H, drawX, drawY, BAR_W, BAR_H);

      // Text positioned cleanly within the right portion of the banner
      const textX = drawX + BAR_W - 24;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      // Pokemon Name
      ctx.font = `bold 16px ${BATTLE_FONT}`;
      ctx.fillStyle = '#CBD5E1';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;
      ctx.fillText(pokemonName, textX, drawY + 22);

      // Ability Name
      ctx.font = `bold 22px ${BATTLE_FONT}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.fillText(abilityNameVi, textX, drawY + 44);
    }

    ctx.restore();
  }

  public getWeatherIconImage(weatherType: string): HTMLImageElement {
    const key = (weatherType || '').toLowerCase().trim().replace(/[\s-]/g, '_');
    let img = this.weatherIconCache.get(key);
    if (!img) {
      img = new Image();
      img.src = BATTLE_ASSETS.getWeatherIcon(key);
      this.weatherIconCache.set(key, img);
    }
    return img;
  }

  /**
   * Draws the active weather HUD indicator badge centered at the top edge of the battle screen.
   * Displays the authentic 50x50 weather icon and remaining turn count.
   */
  public drawWeatherIndicator(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const weather = this.engine.environment?.weather;
    if (!weather || !weather.type || weather.type === 'none' || weather.turnsLeft <= 0) {
      return;
    }

    // Hide during early intro before shutters open
    if (state.enemyDataboxProgress <= 0) {
      return;
    }

    const rawType = (weather.type || '').toLowerCase().trim().replace(/[\s-]/g, '_');
    const theme = WEATHER_THEMES[rawType] || WEATHER_THEMES.sun;

    // Intro slide & capture zoom animations
    const t = Math.max(0, Math.min(1, state.enemyDataboxProgress));
    const e = 1 - Math.pow(1 - t, 3);
    const introOffsetY = Math.round((1 - e) * -45);

    const zoomT = state.captureZoomProgress;
    const zoomE = zoomT < 0.5 ? 2 * zoomT * zoomT : 1 - Math.pow(-2 * zoomT + 2, 2) / 2;
    const zoomOffsetY = Math.round(zoomE * -45);

    const baseY = 6;
    const drawY = baseY + introOffsetY + zoomOffsetY;
    if (drawY < -35) return;

    const bw = 98;
    const bh = 28;
    const bx = Math.round(CANVAS_W / 2 - bw / 2); // 256 - 49 = 207

    ctx.save();

    // Expiring state (last turn alert pulse)
    const isExpiring = weather.turnsLeft <= 1;
    const pulseFactor = isExpiring ? 0.5 + 0.5 * Math.sin(state.tick * 0.25) : 1;

    // Badge Shadow & Outer Glow
    ctx.shadowColor = isExpiring
      ? `rgba(239, 68, 68, ${(0.45 * pulseFactor).toFixed(2)})`
      : theme.badgeGlow;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // Pill Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    this.drawRoundedRect(ctx, bx, drawY, bw, bh, 14);
    ctx.fill();

    // Subtle weather gradient fill
    const bgGrad = ctx.createLinearGradient(bx, drawY, bx + bw, drawY + bh);
    bgGrad.addColorStop(0, theme.bgGradient[0]);
    bgGrad.addColorStop(1, theme.bgGradient[1]);
    ctx.fillStyle = bgGrad;
    this.drawRoundedRect(ctx, bx, drawY, bw, bh, 14);
    ctx.fill();

    // Border
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isExpiring && pulseFactor > 0.6 ? '#ef4444' : theme.badgeBorder;
    this.drawRoundedRect(ctx, bx, drawY, bw, bh, 14);
    ctx.stroke();

    // Clear shadow for crisp inner elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Weather Icon (22x22 on left side)
    const iconImg = this.getWeatherIconImage(rawType);
    const ix = bx + 5;
    const iy = drawY + 3;
    if (isLoaded(iconImg)) {
      ctx.drawImage(iconImg, 0, 0, iconImg.width, iconImg.height, ix, iy, 22, 22);
    }

    // Weather Name (Header)
    const tx = bx + 32;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `bold 11px ${BATTLE_FONT}`;
    // 1px black drop shadow
    ctx.fillStyle = '#000000';
    ctx.fillText(theme.labelVi, tx + 1, drawY + 10);
    ctx.fillStyle = theme.textColor;
    ctx.fillText(theme.labelVi, tx, drawY + 9);

    // Turn Count (Sub-header)
    const turnsLabel = Number.isFinite(weather.turnsLeft) ? `${weather.turnsLeft} LƯỢT` : 'VÔ HẠN';
    ctx.font = `bold 12px ${BATTLE_FONT}`;
    ctx.fillStyle = '#000000';
    ctx.fillText(turnsLabel, tx + 1, drawY + 21);
    ctx.fillStyle = isExpiring && pulseFactor > 0.5 ? '#fca5a5' : '#ffffff';
    ctx.fillText(turnsLabel, tx, drawY + 20);

    ctx.restore();
  }
}
