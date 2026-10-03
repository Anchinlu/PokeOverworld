/**
 * BattleScreen — Thin façade that wires together:
 *   - BattleState (data)
 *   - BattleAssets (images)
 *   - BattleRenderer (canvas drawing)
 *   - BattleController (input + game actions)
 *   - BattleEngine (game logic, already separate)
 *
 * Responsibilities limited to: DOM creation, game loop, teardown.
 * Per DEV_GUARDRAILS §2.1 & §9.
 */

import type { BattlerPokemon, BattleEnvironment } from './types';
import { BattleEngine } from './battle-engine';
import { BattleState } from './battle-state';
import { createBattleAssets } from './battle-assets';
import { BattleRenderer, CANVAS_W, CANVAS_H } from './battle-renderer';
import { BattleController } from './battle-controller';
import { TypeBadgeRenderer } from './type-badge-renderer';

export interface BattleScreenResult {
  outcome: 'caught' | 'victory' | 'fled' | 'defeated';
  caughtPokemon?: BattlerPokemon;
}

export class BattleScreen {
  private overlay: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private animFrameId: number | null = null;

  private state: BattleState;
  private engine: BattleEngine;
  private renderer: BattleRenderer;
  private controller: BattleController;
  private onComplete: (result: BattleScreenResult) => void;

  constructor(
    playerPokemon: BattlerPokemon,
    wildPokemon: BattlerPokemon,
    environment: BattleEnvironment,
    onComplete: (result: BattleScreenResult) => void
  ) {
    this.onComplete = onComplete;

    // 1. Engine (pure game logic)
    this.engine = new BattleEngine(playerPokemon, wildPokemon, environment);

    // 2. State
    this.state = new BattleState();
    this.state.enemyHpPct = wildPokemon.currentHp / wildPokemon.maxHp;
    this.state.targetEnemyHpPct = this.state.enemyHpPct;
    this.state.playerHpPct = playerPokemon.currentHp / playerPokemon.maxHp;
    this.state.targetPlayerHpPct = this.state.playerHpPct;

    // 3. Assets
    const assets = createBattleAssets(environment, wildPokemon.frontSprite, playerPokemon.backSprite);
    TypeBadgeRenderer.init();

    // 4. DOM
    this.overlay = document.createElement('div');
    this.overlay.id = 'battleScreenOverlay';
    this.overlay.className = 'battle-screen-overlay';

    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.canvas.className = 'battle-canvas';
    const ctx = this.canvas.getContext('2d')!;

    this.overlay.appendChild(this.canvas);
    document.body.appendChild(this.overlay);

    // 5. Renderer
    this.renderer = new BattleRenderer(ctx, assets, this.engine);

    // 6. Controller (input + actions)
    this.controller = new BattleController(this.state, this.engine, this.canvas, (result) => {
      this.teardown();
      this.onComplete(result);
    });

    // 7. Initial messages
    this.controller.queueMessage(`A wild ${wildPokemon.name} appeared!`, 'message', () => {
      this.controller.queueMessage(`Go! ${playerPokemon.name}!`, 'command');
    });

    // 8. Start loop
    this.loop();
  }

  private loop = (): void => {
    if (!this.state.isRunning) return;

    this.state.updateTick();
    this.renderer.render(this.state);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private teardown(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.controller.destroy();

    // Fade out overlay
    this.overlay.style.transition = 'opacity 0.6s ease';
    this.overlay.style.opacity = '0';
    setTimeout(() => {
      if (this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
    }, 600);
  }
}
