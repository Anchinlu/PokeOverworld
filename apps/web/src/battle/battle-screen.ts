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
import { BattleTextOverlay } from './battle-text-overlay';
import { pokemonCryPlayer } from '../ui/pokedex/pokemon-cry';
import { BATTLE_ASSETS } from '../assets';
import { battleBgmPlayer } from '../audio';

export interface BattleScreenResult {
  outcome: 'caught' | 'victory' | 'fled' | 'defeated';
  caughtPokemon?: BattlerPokemon;
  activePlayerPokemon?: BattlerPokemon;
}

export class BattleScreen {
  private overlay: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private textOverlay: BattleTextOverlay;
  private animFrameId: number | null = null;
  private introMessageQueued = false;

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
    this.state = new BattleState(this.engine.rng);
    this.state.enemyHpPct = wildPokemon.currentHp / wildPokemon.maxHp;
    this.state.targetEnemyHpPct = this.state.enemyHpPct;
    this.state.ghostEnemyHpPct = this.state.enemyHpPct;
    this.state.playerHpPct = playerPokemon.currentHp / playerPokemon.maxHp;
    this.state.targetPlayerHpPct = this.state.playerHpPct;
    this.state.ghostPlayerHpPct = this.state.playerHpPct;

    // 3. Assets
    const assets = createBattleAssets(
      environment,
      wildPokemon.frontSprite,
      playerPokemon.backSprite,
      playerPokemon.pokeball ?? 'POKEBALL'
    );
    TypeBadgeRenderer.init();

    // 4. DOM
    this.overlay = document.createElement('div');
    this.overlay.id = 'battleScreenOverlay';
    this.overlay.className = 'battle-screen-overlay';

    // Cinematic blurred ambient background (scaled-up copy of battle background)
    const ambientBg = document.createElement('div');
    ambientBg.className = 'battle-ambient-backdrop';
    const bgUrl = BATTLE_ASSETS.getBackground(environment.background);
    ambientBg.style.backgroundImage = `url("${bgUrl}")`;
    this.overlay.appendChild(ambientBg);

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'battle-wrapper';

    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.canvas.className = 'battle-canvas';
    const ctx = this.canvas.getContext('2d')!;

    this.wrapper.appendChild(this.canvas);
    this.textOverlay = new BattleTextOverlay(this.wrapper);
    this.overlay.appendChild(this.wrapper);
    document.body.appendChild(this.overlay);

    // 5. Renderer (canvas text disabled so high-DPI HTML overlay renders crisp text)
    this.renderer = new BattleRenderer(ctx, assets, this.engine, true);

    // 6. Controller (input + actions)
    this.controller = new BattleController(
      this.state,
      this.engine,
      this.canvas,
      (result) => {
        this.teardown();
        this.onComplete(result);
      },
      this.renderer
    );

    // 7. Start loop (messages queued when intro finishes)
    this.loop();
  }

  private loop = (): void => {
    if (!this.state.isRunning) return;

    this.state.updateTick();

    // Play wild Pokémon cry right when it flashes brightly in the intro (introProgress >= 0.55)
    if (this.state.isIntro && this.state.introProgress >= 0.55 && !this.state.wildCryPlayed) {
      this.state.wildCryPlayed = true;
      if (this.engine.enemyPokemon.cry) {
        pokemonCryPlayer.play(this.engine.enemyPokemon.cry);
      }
    }

    // Play player Pokémon cry when it impacts the ground on send-out
    if (this.state.pokemonLandCryTriggered) {
      this.state.pokemonLandCryTriggered = false;
      if (this.engine.playerPokemon.cry) {
        pokemonCryPlayer.play(this.engine.playerPokemon.cry);
      }
    }

    if (!this.introMessageQueued && !this.state.isIntro) {
      this.introMessageQueued = true;
      // Smoothly duck battle BGM volume to 60% as the wild Pokémon clearly appears
      battleBgmPlayer.reduceVolume(0.6, 800);

      this.controller.queueMessage(
        `A wild ${this.engine.enemyPokemon.name} appeared!`,
        'message',
        () => {
          this.state.startPlayerSendOut();
          this.controller.queueMessage(`Go! ${this.engine.playerPokemon.name}!`, 'command');
        }
      );
    }

    this.renderer.render(this.state);
    this.textOverlay.update(this.state, this.engine);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private teardown(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    pokemonCryPlayer.stop();
    battleBgmPlayer.stopBgm(600);
    this.textOverlay.destroy();
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
