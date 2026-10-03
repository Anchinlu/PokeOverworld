/**
 * Battle screen canvas renderer.
 * Pure rendering logic — reads state and assets, draws to canvas.
 * No input handling, no state mutation, no DOM creation.
 */

import type { BattleMove } from './types';
import type { BattleAssets } from './battle-assets';
import type { BattleState } from './battle-state';
import { isLoaded } from './battle-assets';
import { BattleEngine } from './battle-engine';
import { TypeBadgeRenderer } from './type-badge-renderer';

/** Canvas dimensions */
export const CANVAS_W = 512;
export const CANVAS_H = 384;

export class BattleRenderer {
  private ctx: CanvasRenderingContext2D;
  private assets: BattleAssets;
  private engine: BattleEngine;

  constructor(ctx: CanvasRenderingContext2D, assets: BattleAssets, engine: BattleEngine) {
    this.ctx = ctx;
    this.assets = assets;
    this.engine = engine;
  }

  /** Main render entry point — called every animation frame */
  render(state: BattleState): void {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    this.drawBackground(ctx);
    this.drawEnemyBattler(ctx, state);
    this.drawPlayerBattler(ctx, state);
    this.drawBallThrow(ctx, state);
    this.renderEnemyDatabox(ctx, 0, 41, state);
    this.renderPlayerDatabox(ctx, 252, 197, state);
    this.renderBottomPanel(ctx, state);
  }

  // ---- Background ----

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    if (isLoaded(this.assets.bg)) {
      ctx.drawImage(this.assets.bg, 0, 0, CANVAS_W, 288);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, 288);
    }
  }

  // ---- Enemy Battler ----

  private drawEnemyBattler(ctx: CanvasRenderingContext2D, state: BattleState): void {
    if (this.engine.enemyPokemon.currentHp <= 0 || state.isThrowingBall) return;

    const bobY = Math.sin(state.tick * 0.08) * 2;
    const shadowX = 380;
    const shadowY = 175;

    // Drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 32, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Animated sprite (EBS horizontal strip)
    const img = this.assets.enemySprite;
    if (state.enemyHurtFlash % 4 < 2 && isLoaded(img)) {
      const frameH = img.height;
      const frameW = frameH;
      const totalFrames = Math.max(1, Math.floor(img.width / frameH));
      const frameIdx = Math.floor(state.tick / 4) % totalFrames;
      const sx = frameIdx * frameW;
      const scale = 2.0;
      const dw = Math.round(frameW * scale);
      const dh = Math.round(frameH * scale);
      const dx = Math.round(shadowX - dw / 2);
      const dy = Math.round(shadowY - dh + bobY);
      ctx.drawImage(img, sx, 0, frameW, frameH, dx, dy, dw, dh);
    }
  }

  // ---- Player Battler ----

  private drawPlayerBattler(ctx: CanvasRenderingContext2D, state: BattleState): void {
    if (this.engine.playerPokemon.currentHp <= 0) return;

    const pBobY = Math.cos(state.tick * 0.08) * 2;
    const shadowX = 130;
    const shadowY = 295;

    // Drop shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(shadowX, shadowY, 44, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Animated sprite (EBS horizontal strip)
    const img = this.assets.playerSprite;
    if (state.playerHurtFlash % 4 < 2 && isLoaded(img)) {
      const frameH = img.height;
      const frameW = frameH;
      const totalFrames = Math.max(1, Math.floor(img.width / frameH));
      const frameIdx = Math.floor(state.tick / 4) % totalFrames;
      const sx = frameIdx * frameW;
      const scale = 2.2;
      const dw = Math.round(frameW * scale);
      const dh = Math.round(frameH * scale);
      const dx = Math.round(shadowX - dw / 2);
      const dy = Math.round(shadowY - dh + pBobY);
      ctx.drawImage(img, sx, 0, frameW, frameH, dx, dy, dw, dh);
    }
  }

  // ---- Ball Throw ----

  private drawBallThrow(ctx: CanvasRenderingContext2D, state: BattleState): void {
    if (!state.isThrowingBall) return;
    const shakeOffset = state.ballShakeTimer > 0 ? Math.sin(state.tick * 0.5) * 6 : 0;
    const bx = 365 + shakeOffset;
    const by = 155;
    if (isLoaded(this.assets.ball)) {
      ctx.drawImage(this.assets.ball, 0, 0, 32, 32, bx, by, 32, 32);
    }
  }

  // ---- Enemy Databox ----

  private renderEnemyDatabox(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    state: BattleState
  ): void {
    const enemy = this.engine.enemyPokemon;

    // Background databox (260 x 70)
    if (isLoaded(this.assets.databoxEnemy)) {
      ctx.drawImage(this.assets.databoxEnemy, dx, dy, 260, 70);
    }

    // Name
    ctx.font = 'bold 16px "Power Clear", "VT323", monospace, sans-serif';
    this.drawTextWithOutline(ctx, enemy.name, dx + 8, dy + 21, '#ffffff', '#000000', 3);

    // Gender symbol
    const genderSymbol = enemy.gender === 'male' ? '♂' : enemy.gender === 'female' ? '♀' : '';
    const genderColor = enemy.gender === 'male' ? '#3b82f6' : '#ef4444';
    if (genderSymbol) {
      this.drawTextWithOutline(ctx, genderSymbol, dx + 126, dy + 21, genderColor, '#000000', 3);
    }

    // Level
    this.drawTextWithOutline(ctx, `Lv.${enemy.level}`, dx + 142, dy + 21, '#ffffff', '#000000', 3);

    // Type Badges
    if (enemy.types.length > 0) {
      TypeBadgeRenderer.drawTypeIcon(ctx, enemy.types[0], 217, 43, 0.75);
    }
    if (enemy.types.length > 1) {
      TypeBadgeRenderer.drawTypeIcon(ctx, enemy.types[1], 217, 67, 0.75);
    }

    // HP Bar
    this.drawHpBar(ctx, dx + 118, dy + 40, 96, 6, state.enemyHpPct);
  }

  // ---- Player Databox ----

  private renderPlayerDatabox(
    ctx: CanvasRenderingContext2D,
    dx: number,
    dy: number,
    state: BattleState
  ): void {
    const player = this.engine.playerPokemon;

    // Background databox (260 x 84)
    if (isLoaded(this.assets.databoxPlayer)) {
      ctx.drawImage(this.assets.databoxPlayer, dx, dy, 260, 84);
    }

    // Type Badges
    if (player.types.length > 0) {
      TypeBadgeRenderer.drawTypeIcon(ctx, player.types[0], 280, 202, 0.75);
    }
    if (player.types.length > 1) {
      TypeBadgeRenderer.drawTypeIcon(ctx, player.types[1], 280, 226, 0.75);
    }

    // Name
    ctx.font = 'bold 16px "Power Clear", "VT323", monospace, sans-serif';
    this.drawTextWithOutline(ctx, player.name, 310, 218, '#ffffff', '#000000', 3);

    // Gender symbol
    const genderSymbol = player.gender === 'male' ? '♂' : player.gender === 'female' ? '♀' : '';
    const genderColor = player.gender === 'male' ? '#3b82f6' : '#ef4444';
    if (genderSymbol) {
      this.drawTextWithOutline(ctx, genderSymbol, 428, 218, genderColor, '#000000', 3);
    }

    // Level
    this.drawTextWithOutline(ctx, `Lv.${player.level}`, 444, 218, '#ffffff', '#000000', 3);

    // HP Bar
    this.drawHpBar(ctx, dx + 136, dy + 40, 96, 6, state.playerHpPct);

    // Numerical HP
    ctx.font = 'bold 14px "Power Clear", "VT323", monospace, sans-serif';
    ctx.textAlign = 'right';
    this.drawTextWithOutline(
      ctx,
      `${Math.round(player.currentHp)}/${player.maxHp}`,
      485,
      dy + 60,
      '#ffffff',
      '#000000',
      3
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
  }

  // ---- Bottom Panel ----

  private renderBottomPanel(ctx: CanvasRenderingContext2D, state: BattleState): void {
    const py = 288;

    // Message box background
    if (isLoaded(this.assets.messageBox)) {
      ctx.drawImage(this.assets.messageBox, 0, py, CANVAS_W, 96);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, py, CANVAS_W, 96);
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
    ctx.font = 'bold 18px "Power Clear", "VT323", monospace, sans-serif';
    this.drawTextWithOutline(ctx, state.currentDisplayedText, 28, py + 48, '#ffffff', '#000000', 3);

    // Blinking cursor arrow
    if (state.textTypingIndex >= state.messageText.length && state.tick % 30 < 15) {
      this.drawTextWithOutline(ctx, '▼', 475, py + 65, '#38bdf8', '#000000', 2);
    }
  }

  private renderCommandMode(ctx: CanvasRenderingContext2D, state: BattleState, py: number): void {
    // Left dialogue
    ctx.font = 'bold 18px "Power Clear", "VT323", monospace, sans-serif';
    this.drawTextWithOutline(ctx, 'What should', 28, py + 36, '#ffffff', '#000000', 3);
    this.drawTextWithOutline(
      ctx,
      `${this.engine.playerPokemon.name} do?`,
      28,
      py + 64,
      '#ffffff',
      '#000000',
      3
    );

    // 4 Action Buttons from cursor_command.png
    if (isLoaded(this.assets.cursorCommand)) {
      // FIGHT (Top-Left): Row 0
      const fightSx = state.hoveredCommandIdx === 0 ? 0 : 130;
      ctx.drawImage(this.assets.cursorCommand, fightSx, 0, 130, 46, 252, 296, 126, 42);

      // BAG (Top-Right): Row 2 (y=92)
      const bagSx = state.hoveredCommandIdx === 1 ? 0 : 130;
      ctx.drawImage(this.assets.cursorCommand, bagSx, 92, 130, 46, 381, 296, 126, 42);

      // POKÉMON (Bottom-Left): Row 1 (y=46)
      const pokeSx = state.hoveredCommandIdx === 2 ? 0 : 130;
      ctx.drawImage(this.assets.cursorCommand, pokeSx, 46, 130, 46, 252, 339, 126, 42);

      // RUN (Bottom-Right): Row 3 (y=138)
      const runSx = state.hoveredCommandIdx === 3 ? 0 : 130;
      ctx.drawImage(this.assets.cursorCommand, runSx, 138, 130, 46, 381, 339, 126, 42);
    } else {
      // Fallback pill buttons
      this.drawPillButton(ctx, 252, 296, 126, 42, '#dc2626', state.hoveredCommandIdx === 0);
      this.drawPillButton(ctx, 381, 296, 126, 42, '#d97706', state.hoveredCommandIdx === 1);
      this.drawPillButton(ctx, 252, 339, 126, 42, '#16a34a', state.hoveredCommandIdx === 2);
      this.drawPillButton(ctx, 381, 339, 126, 42, '#0284c7', state.hoveredCommandIdx === 3);
    }
  }

  private renderMovesMode(ctx: CanvasRenderingContext2D, _state: BattleState, py: number): void {
    // Draw overlay_fight.png if available
    if (isLoaded(this.assets.fightOverlay)) {
      ctx.drawImage(this.assets.fightOverlay, 0, py, CANVAS_W, 96);
    }

    const moves = this.engine.playerPokemon.moves;
    const coords = [
      { x: 20, y: py + 12 },
      { x: 195, y: py + 12 },
      { x: 20, y: py + 52 },
      { x: 195, y: py + 52 },
    ];

    for (let i = 0; i < 4; i++) {
      const m = moves[i];
      const c = coords[i];
      if (m) {
        this.drawMoveSlot(ctx, c.x, c.y, 165, 36, m);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('-', c.x + 30, c.y + 22);
      }
    }

    // Back Button
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(390, py + 30, 95, 36);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(390, py + 30, 95, 36);
    ctx.font = 'bold 14px "Power Clear", monospace';
    this.drawTextWithOutline(ctx, 'BACK', 420, py + 53, '#ffffff', '#000000', 2);
  }

  private renderBagMode(ctx: CanvasRenderingContext2D, _state: BattleState, py: number): void {
    ctx.font = 'bold 16px "Power Clear", monospace';
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

  // ---- Drawing Utilities ----

  drawTextWithOutline(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    fillColor: string,
    strokeColor = '#000000',
    strokeWidth = 3
  ): void {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(text, x, y);
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
    pct: number
  ): void {
    const fillW = Math.max(0, Math.round(bw * pct));
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
    move: BattleMove
  ): void {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);

    // Draw Type Icon
    TypeBadgeRenderer.drawTypeIcon(ctx, move.type, x + 6, y + 4, 1.0);

    // Move Name
    ctx.font = 'bold 13px "Power Clear", monospace';
    this.drawTextWithOutline(ctx, move.name, x + 36, y + 18, '#ffffff', '#000000', 2);

    // PP
    ctx.font = '11px "Power Clear", monospace';
    const ppColor = move.pp > 0 ? '#cbd5e1' : '#f87171';
    this.drawTextWithOutline(
      ctx,
      `PP ${move.pp}/${move.maxPp}`,
      x + 36,
      y + 31,
      ppColor,
      '#000000',
      2
    );
  }
}
