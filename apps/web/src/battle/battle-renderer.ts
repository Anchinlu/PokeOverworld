/**
 * Battle screen canvas renderer.
 * Pure rendering logic — reads state and assets, draws to canvas.
 * No input handling, no state mutation, no DOM creation.
 */

import type { BattleMove, BattlerPokemon, StatStages } from './types';
import type { BattleAssets } from './battle-assets';
import { INTRO_SHUTTER_PROGRESS, type BattleState } from './battle-state';
import { isLoaded } from './battle-assets';
import { BattleEngine } from './battle-engine';
import { TypeBadgeRenderer } from './type-badge-renderer';
import { getBattleStatusIconFrame } from './battle-status-icons';
import { TYPE_ICO_INDICES } from './type-chart';
import { BATTLE_ASSETS } from '../assets';

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

export class BattleRenderer {
  private ctx: CanvasRenderingContext2D;
  private assets: BattleAssets;
  private engine: BattleEngine;
  private disableCanvasText: boolean;

  private offscreenCanvas = document.createElement('canvas');
  private offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;

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

    // Dynamic Cinematic Camera: Zoom in close on wild Pokémon initially, then smoothly pull back to standard 1.0x view
    let camScale = 1.0;
    let camPanX = 0;
    let camPanY = 0;

    if (state.isIntro) {
      const zoomStartP = 0.5; // starts zoom-out around the time Pokémon flashes radiant colors
      const zoomEndP = 0.92; // completes zoom-out right before intro finishes
      if (state.introProgress < zoomStartP) {
        camScale = 1.35;
        camPanX = -45;
        camPanY = 15;
      } else if (state.introProgress < zoomEndP) {
        const t = (state.introProgress - zoomStartP) / (zoomEndP - zoomStartP);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        camScale = 1.35 - eased * 0.35;
        camPanX = -45 * (1 - eased);
        camPanY = 15 * (1 - eased);
      } else {
        camScale = 1.0;
        camPanX = 0;
        camPanY = 0;
      }
    }

    // Capture zoom: smoothly zoom in when ball hits Pokemon and zoom out if capture fails
    if (state.captureZoomProgress > 0) {
      const t = state.captureZoomProgress;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      camScale = 1.0 + eased * 0.4; // Zoom from 1.0x to 1.4x
      camPanX = -45 * eased;
      camPanY = 15 * eased;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_W, BOTTOM_PANEL_Y);
    ctx.clip();

    // Subtle screen shake on Pokémon landing
    if (state.screenShakeX !== 0 || state.screenShakeY !== 0) {
      ctx.translate(state.screenShakeX, state.screenShakeY);
    }

    if (camScale !== 1.0 || camPanX !== 0 || camPanY !== 0) {
      const centerX = CANVAS_W / 2;
      const centerY = BOTTOM_PANEL_Y / 2;
      ctx.translate(centerX + camPanX, centerY + camPanY);
      ctx.scale(camScale, camScale);
      ctx.translate(-centerX, -centerY);
    }

    this.drawBackground(ctx);
    this.drawEnemyBase(ctx);
    this.drawEnemyBattler(ctx, state);
    this.drawPlayerBase(ctx);
    this.drawPlayerBattler(ctx, state);
    this.drawPlayerSendOut(ctx, state);
    this.drawBallThrow(ctx, state);

    // Shiny entrance sparkle effects (bursting stars & halo)
    if (state.enemyShinyTimer > 0) {
      this.drawBattleShinySparkles(ctx, 380, 115, state.enemyShinyTimer, state.enemyShinyMax);
    }
    if (state.playerShinyTimer > 0) {
      this.drawBattleShinySparkles(ctx, 130, 220, state.playerShinyTimer, state.playerShinyMax);
    }

    ctx.restore();

    if (state.isIntro) {
      this.drawIntroShutters(ctx, state);
    }

    this.renderEnemyDatabox(ctx, 0, 1, state);
    this.renderPlayerDatabox(ctx, 252, 197, state);
    this.renderBottomPanel(ctx, state);
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
    const anchorX = baseAnchorX + (isEnemyFainting ? 0 : state.enemyLungeX + state.enemyHitOffsetX);
    const anchorY = baseAnchorY + (isEnemyFainting ? 0 : state.enemyLungeY + state.enemyHitOffsetY);

    // Animated sprite (EBS horizontal strip)
    const img = this.assets.enemySprite;
    if (isLoaded(img)) {
      const frameH = img.height;
      const frameW = frameH;
      const totalFrames = Math.max(1, Math.floor(img.width / frameH));
      // Freeze sprite animation completely when dead/fainting
      const frameIdx = isEnemyFainting
        ? state.enemyFrozenFrame !== null
          ? state.enemyFrozenFrame % totalFrames
          : 0
        : Math.floor(state.tick / 4) % totalFrames;
      const sx = frameIdx * frameW;

      // Apply capture shrink scale
      const captureScale =
        state.isThrowingBall && state.ballThrowPhase === 'capturing'
          ? state.captureShrinkScale
          : 1.0;
      const scale = 2.0 * captureScale;

      const dw = Math.round(frameW * scale);
      const dh = Math.round(frameH * scale);
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
        if (state.enemyHurtFlash > 0) {
          if (state.enemyHurtFlash % 4 < 2) {
            ctx.filter = 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) saturate(3)';
          } else {
            ctx.filter = 'brightness(3.0)';
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

        ctx.drawImage(img, sx, 0, frameW, frameH, dx, dy, dw, dh);
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

    if (state.playerFaintPhase === 'dead') return;

    // Dynamic sprite anchor (with attack lunge and hit knockback; frozen when fainting)
    const isPlayerFainting =
      state.playerFaintPhase !== 'none' || this.engine.playerPokemon.currentHp <= 0;
    const baseAnchorX = 130;
    const baseAnchorY = isVisibleInSendOut ? state.pokemonDropY : 280;
    const anchorX =
      baseAnchorX + (isPlayerFainting ? 0 : state.playerLungeX + state.playerHitOffsetX);
    const currentY =
      baseAnchorY + (isPlayerFainting ? 0 : state.playerLungeY + state.playerHitOffsetY);

    // Base scale modified by send-out physics and faint shrinking
    let scaleMultiplierX = isVisibleInSendOut ? state.pokemonScaleX : 1.0;
    let scaleMultiplierY = isVisibleInSendOut ? state.pokemonScaleY : 1.0;

    if (state.playerFaintPhase === 'shrinking') {
      scaleMultiplierX *= state.playerFaintScale;
      scaleMultiplierY *= state.playerFaintScale;
    }

    const scaleX = 2.0 * scaleMultiplierX;
    const scaleY = 2.0 * scaleMultiplierY;

    // Animated sprite (EBS horizontal strip)
    const img = this.assets.playerSprite;
    if (isLoaded(img)) {
      const frameH = img.height;
      const frameW = frameH;
      const totalFrames = Math.max(1, Math.floor(img.width / frameH));
      // Freeze sprite animation completely when dead/fainting
      const frameIdx = isPlayerFainting
        ? state.playerFrozenFrame !== null
          ? state.playerFrozenFrame % totalFrames
          : 0
        : Math.floor(state.tick / 4) % totalFrames;
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
        if (state.playerHurtFlash > 0) {
          if (state.playerHurtFlash % 4 < 2) {
            ctx.filter = 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9)) saturate(3)';
          } else {
            ctx.filter = 'brightness(3.0)';
          }
        } else if (isVisibleInSendOut && state.pokemonEnergyFlash > 0.05) {
          ctx.filter = `brightness(${(1.0 + state.pokemonEnergyFlash * 4.5).toFixed(2)})`;
        } else {
          ctx.filter = 'none';
        }

        ctx.drawImage(img, sx, 0, frameW, frameH, dx, dy, dw, dh);
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
    this.drawHpBar(ctx, 118, 40, 96, 6, state.enemyHpPct, state.ghostEnemyHpPct);
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

    // HP Bar
    this.drawHpBar(ctx, dx + 136, dy + 40, 96, 6, state.playerHpPct, state.ghostPlayerHpPct);
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

    // Right Column: CANCEL Button from command_buttons.png (Row 9: sy=414, sh=46, sw=130)
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
      this.drawPillButton(ctx, cancelX, cancelY, cancelW, cancelH, '#94a3b8', state.hoveredCancel);
      ctx.font = `18px ${BATTLE_FONT}`;
      this.drawTextWithOutline(ctx, 'CANCEL', cancelX + 26, cancelY + 26, '#ffffff', '#000000', 1);
    }
  }

  private renderBagMode(ctx: CanvasRenderingContext2D, _state: BattleState, py: number): void {
    ctx.font = `16px ${BATTLE_FONT}`;
    this.drawTextWithOutline(
      ctx,
      `POKÉ BALLS: x${this.engine.ballsCount}`,
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
    this.drawTextWithOutline(ctx, '⚾ THROW BALL', 215, py + 53, '#ffffff', '#000000', 2);

    // Back Button
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(390, py + 30, 95, 36);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(390, py + 30, 95, 36);
    this.drawTextWithOutline(ctx, 'BACK', 420, py + 53, '#ffffff', '#000000', 2);
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
    ghostPct: number = pct
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

      ctx.fillStyle = fillColor;
      ctx.fillRect(bx, by, fillW, bh);

      // Top 2px highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(bx, by, fillW, 2);
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
}
