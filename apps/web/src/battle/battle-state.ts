/**
 * Pure state container for the Battle Screen UI.
 * No DOM, no canvas, no input — only data.
 */

import { type BattleRng, defaultBattleRng } from './battle-rng';

export type BattleUIMode = 'message' | 'command' | 'moves' | 'bag';

/** Fraction of introProgress used to fully open the black shutters. */
export const INTRO_SHUTTER_PROGRESS = 0.65;

/**
 * Per-frame intro step so the shutter phase lasts 2.5s at ~60fps
 * (150 frames × this step = INTRO_SHUTTER_PROGRESS).
 */
export const INTRO_PROGRESS_STEP = INTRO_SHUTTER_PROGRESS / (2.5 * 60);

export interface MessageEntry {
  text: string;
  nextMode?: 'command' | 'message' | 'end';
  onFinish?: () => void;
}

export class BattleState {
  private rng: BattleRng;

  constructor(rng: BattleRng = defaultBattleRng) {
    this.rng = rng;
  }

  // HP visual state
  enemyHpPct = 1.0;
  targetEnemyHpPct = 1.0;
  ghostEnemyHpPct = 1.0;
  playerHpPct = 1.0;
  targetPlayerHpPct = 1.0;
  ghostPlayerHpPct = 1.0;

  // Hurt flash & hit knockback timers
  enemyHurtFlash = 0;
  playerHurtFlash = 0;
  playerHitTimer = 0;
  playerHitOffsetX = 0;
  playerHitOffsetY = 0;
  enemyHitTimer = 0;
  enemyHitOffsetX = 0;
  enemyHitOffsetY = 0;

  // Attack motion (physical lunge or in-place casting)
  playerAttackTick = 0;
  playerLungeActive = true;
  playerLungeX = 0;
  playerLungeY = 0;
  private onPlayerAttackHit?: () => void;

  enemyAttackTick = 0;
  enemyLungeActive = true;
  enemyLungeX = 0;
  enemyLungeY = 0;
  private onEnemyAttackHit?: () => void;

  // Wild Pokémon Faint (Red tint -> pure white -> top-to-bottom dust dissolve)
  enemyFaintPhase: 'none' | 'red_flash' | 'white_flash' | 'dissolving' | 'dead' = 'none';
  enemyFaintTick = 0;
  enemyDissolveProgress = 0; // 0..1
  enemyShadowAlpha = 1.0;
  enemyFrozenFrame: number | null = null;
  private onEnemyFaintComplete?: () => void;

  // Player Pokémon Faint (Turns white -> shrinks down into base -> disappears)
  playerFaintPhase: 'none' | 'white' | 'shrinking' | 'dead' = 'none';
  playerFaintTick = 0;
  playerFaintScale = 1.0;
  playerFrozenFrame: number | null = null;
  private onPlayerFaintComplete?: () => void;

  // Ball throw animation
  isThrowingBall = false;
  ballThrowPhase: 'throwing' | 'opening' | 'capturing' | 'falling' | 'shaking' = 'throwing';
  ballThrowTick = 0;
  ballThrowX = -30;
  ballThrowY = 90;
  ballThrowRotationFrame = 0;
  ballThrowType = 'POKEBALL'; // Type of ball being thrown
  ballShakeTimer = 0;
  ballShakeCount = 0;
  onBallHit?: () => void;
  onBallCapture?: () => void;
  onBallDrop?: () => void;

  // Pokemon capture animation
  captureFlashPhase: 'none' | 'white' | 'red' = 'none';
  captureShrinkScale = 1.0;
  captureAlpha = 1.0;
  captureSuccessEffect = false; // Sparkle burst when caught
  captureSuccessTick = 0;
  captureZooming = false; // Camera zoom when ball hits Pokemon
  captureZoomProgress = 0; // 0..1

  // UI mode
  uiMode: BattleUIMode = 'message';
  hoveredCommandIdx = 0; // 0: FIGHT, 1: BAG, 2: POKÉMON, 3: RUN
  hoveredMoveIdx = -1; // 0..3: Move index, -1: none
  hoveredCancel = false;

  // Typing state
  isTyping = false;
  messageText = '';
  messageQueue: MessageEntry[] = [];
  textTypingIndex = 0;
  currentDisplayedText = '';

  // Intro shutter transition state
  isIntro = true;
  introProgress = 0; // 0..1
  isPlayerPokemonSentOut = false;
  wildCryPlayed = false;

  // Player send-out animation state
  isPlayerSendingOut = false;
  sendOutPhase: 'none' | 'throwing' | 'opening' | 'dropping' | 'landing' | 'complete' = 'none';
  sendOutTick = 0;

  // Ball throw coordinates & animation
  ballX = -30;
  ballY = 90;
  ballRotationFrame = 0;
  ballAlpha = 1.0;

  // Pokemon drop physics
  pokemonDropY = 175;
  pokemonDropVy = 0;
  pokemonScaleX = 1.0;
  pokemonScaleY = 1.0;
  pokemonEnergyFlash = 1.0;
  pokemonLandCryTriggered = false;

  // Screen shake on Pokémon landing
  screenShakeTimer = 0;
  screenShakeAmp = 0;
  screenShakeX = 0;
  screenShakeY = 0;

  // Databox slide-in animation progress (0..1)
  enemyDataboxProgress = 0;
  playerDataboxProgress = 0;

  // Shiny entrance sparkle animation timers
  enemyShinyTimer = 0;
  enemyShinyMax = 44;
  playerShinyTimer = 0;
  playerShinyMax = 44;

  triggerEnemyShinySparkles(): void {
    this.enemyShinyTimer = this.enemyShinyMax;
  }

  triggerPlayerShinySparkles(): void {
    this.playerShinyTimer = this.playerShinyMax;
  }

  // Animation tick
  tick = 0;
  isRunning = true;

  // --- Methods ---

  /** Start the player's Pokémon send-out animation sequence */
  startPlayerSendOut(): void {
    this.isPlayerSendingOut = true;
    this.sendOutPhase = 'throwing';
    this.sendOutTick = 0;
    this.isPlayerPokemonSentOut = false;
    this.playerDataboxProgress = 0;
    this.ballX = -30;
    this.ballY = 90;
    this.ballRotationFrame = 0;
    this.ballAlpha = 1.0;
    this.pokemonDropY = 175;
    this.pokemonDropVy = 0;
    this.pokemonScaleX = 1.0;
    this.pokemonScaleY = 1.0;
    this.pokemonEnergyFlash = 1.0;
    this.pokemonLandCryTriggered = false;
    this.screenShakeTimer = 0;
    this.screenShakeAmp = 0;
    this.screenShakeX = 0;
    this.screenShakeY = 0;
  }

  /** Start ball throw animation toward enemy */
  startBallThrow(ballType: string = 'POKEBALL'): void {
    this.isThrowingBall = true;
    this.ballThrowPhase = 'throwing';
    this.ballThrowTick = 0;
    this.ballThrowX = -30;
    this.ballThrowY = 90;
    this.ballThrowRotationFrame = 0;
    this.ballThrowType = ballType;
    this.ballShakeTimer = 0;
    this.ballShakeCount = 0;
    this.captureFlashPhase = 'none';
    this.captureShrinkScale = 1.0;
    this.captureAlpha = 1.0;
    this.captureZooming = false;
    this.captureZoomProgress = 0;
  }

  /** Start player attack motion (lunge if physical, in-place casting if special/status) */
  startPlayerAttack(options?: { lunge?: boolean; onHit?: () => void } | (() => void)): void {
    if (typeof options === 'function') {
      this.playerLungeActive = true;
      this.onPlayerAttackHit = options;
    } else {
      this.playerLungeActive = options?.lunge ?? true;
      this.onPlayerAttackHit = options?.onHit;
    }
    this.playerAttackTick = 1;
    this.playerLungeX = 0;
    this.playerLungeY = 0;
  }

  /** Start enemy attack motion (lunge if physical, in-place casting if special/status) */
  startEnemyAttack(options?: { lunge?: boolean; onHit?: () => void } | (() => void)): void {
    if (typeof options === 'function') {
      this.enemyLungeActive = true;
      this.onEnemyAttackHit = options;
    } else {
      this.enemyLungeActive = options?.lunge ?? true;
      this.onEnemyAttackHit = options?.onHit;
    }
    this.enemyAttackTick = 1;
    this.enemyLungeX = 0;
    this.enemyLungeY = 0;
  }

  /** Trigger hit reaction on player */
  startPlayerHit(): void {
    this.playerHurtFlash = 16;
    this.playerHitTimer = 16;
  }

  /** Trigger hit reaction on enemy */
  startEnemyHit(): void {
    this.enemyHurtFlash = 16;
    this.enemyHitTimer = 16;
  }

  /** Start wild Pokemon faint animation */
  startEnemyFaint(onComplete?: () => void): void {
    this.enemyFaintPhase = 'red_flash';
    this.enemyFaintTick = 0;
    this.enemyDissolveProgress = 0;
    this.enemyShadowAlpha = 1.0;
    this.enemyHurtFlash = 0;
    this.enemyHitTimer = 0;
    this.enemyHitOffsetX = 0;
    this.enemyHitOffsetY = 0;
    this.enemyAttackTick = 0;
    this.enemyLungeX = 0;
    this.enemyLungeY = 0;
    this.enemyFrozenFrame = Math.floor(this.tick / 4);
    this.onEnemyFaintComplete = onComplete;
  }

  /** Start player Pokemon faint animation */
  startPlayerFaint(onComplete?: () => void): void {
    this.playerFaintPhase = 'white';
    this.playerFaintTick = 0;
    this.playerFaintScale = 1.0;
    this.playerHurtFlash = 0;
    this.playerHitTimer = 0;
    this.playerHitOffsetX = 0;
    this.playerHitOffsetY = 0;
    this.playerAttackTick = 0;
    this.playerLungeX = 0;
    this.playerLungeY = 0;
    this.playerFrozenFrame = Math.floor(this.tick / 4);
    this.onPlayerFaintComplete = onComplete;
  }

  /** Advance tick and animate smooth HP bars + flash timers */
  update(): void {
    this.updateTick();
  }

  updateTick(): void {
    this.tick++;

    if (this.isIntro) {
      this.introProgress = Math.min(1.0, this.introProgress + INTRO_PROGRESS_STEP);
      if (this.introProgress >= 1.0) {
        this.isIntro = false;
      }
    }

    // Screen shake update
    if (this.screenShakeTimer > 0) {
      this.screenShakeTimer--;
      const angle = this.rng.next() * Math.PI * 2;
      this.screenShakeX = Math.cos(angle) * this.screenShakeAmp;
      this.screenShakeY = Math.sin(angle) * this.screenShakeAmp;
      this.screenShakeAmp *= 0.76;
    } else {
      this.screenShakeX = 0;
      this.screenShakeY = 0;
      this.screenShakeAmp = 0;
    }

    // 1. Player attack motion
    if (this.playerAttackTick > 0) {
      this.playerAttackTick++;
      if (this.playerLungeActive) {
        if (this.playerAttackTick <= 5) {
          const p = this.playerAttackTick / 5;
          this.playerLungeX = 22 * p;
          this.playerLungeY = -12 * p;
        } else if (this.playerAttackTick === 6) {
          this.playerLungeX = 22;
          this.playerLungeY = -12;
          if (this.onPlayerAttackHit) {
            const hitCb = this.onPlayerAttackHit;
            this.onPlayerAttackHit = undefined;
            hitCb();
          }
        } else if (this.playerAttackTick <= 9) {
          this.playerLungeX = 22;
          this.playerLungeY = -12;
        } else if (this.playerAttackTick <= 16) {
          const p = (this.playerAttackTick - 9) / 7;
          this.playerLungeX = 22 * (1 - p);
          this.playerLungeY = -12 * (1 - p);
        } else {
          this.playerAttackTick = 0;
          this.playerLungeX = 0;
          this.playerLungeY = 0;
        }
      } else {
        // In-place attack motion (Special / Status): stays firm without lunging forward
        this.playerLungeX = 0;
        this.playerLungeY = 0;
        if (this.playerAttackTick === 6) {
          if (this.onPlayerAttackHit) {
            const hitCb = this.onPlayerAttackHit;
            this.onPlayerAttackHit = undefined;
            hitCb();
          }
        } else if (this.playerAttackTick > 12) {
          this.playerAttackTick = 0;
        }
      }
    }

    // 2. Enemy attack motion
    if (this.enemyAttackTick > 0) {
      this.enemyAttackTick++;
      if (this.enemyLungeActive) {
        if (this.enemyAttackTick <= 5) {
          const p = this.enemyAttackTick / 5;
          this.enemyLungeX = -22 * p;
          this.enemyLungeY = 12 * p;
        } else if (this.enemyAttackTick === 6) {
          this.enemyLungeX = -22;
          this.enemyLungeY = 12;
          if (this.onEnemyAttackHit) {
            const hitCb = this.onEnemyAttackHit;
            this.onEnemyAttackHit = undefined;
            hitCb();
          }
        } else if (this.enemyAttackTick <= 9) {
          this.enemyLungeX = -22;
          this.enemyLungeY = 12;
        } else if (this.enemyAttackTick <= 16) {
          const p = (this.enemyAttackTick - 9) / 7;
          this.enemyLungeX = -22 * (1 - p);
          this.enemyLungeY = 12 * (1 - p);
        } else {
          this.enemyAttackTick = 0;
          this.enemyLungeX = 0;
          this.enemyLungeY = 0;
        }
      } else {
        // In-place attack motion (Special / Status): stays firm without lunging forward
        this.enemyLungeX = 0;
        this.enemyLungeY = 0;
        if (this.enemyAttackTick === 6) {
          if (this.onEnemyAttackHit) {
            const hitCb = this.onEnemyAttackHit;
            this.onEnemyAttackHit = undefined;
            hitCb();
          }
        } else if (this.enemyAttackTick > 12) {
          this.enemyAttackTick = 0;
        }
      }
    }

    // 3. Player Hit knockback & jitter
    if (this.playerHitTimer > 0) {
      this.playerHitTimer--;
      const knockback = (this.playerHitTimer / 16) * -10;
      const jitter = Math.sin(this.playerHitTimer * 2.8) * 5;
      this.playerHitOffsetX = knockback + jitter;
      this.playerHitOffsetY = -knockback * 0.4;
    } else {
      this.playerHitOffsetX = 0;
      this.playerHitOffsetY = 0;
    }

    // 4. Enemy Hit knockback & jitter
    if (this.enemyHitTimer > 0) {
      this.enemyHitTimer--;
      const knockback = (this.enemyHitTimer / 16) * 10;
      const jitter = Math.sin(this.enemyHitTimer * 2.8) * 5;
      this.enemyHitOffsetX = knockback + jitter;
      this.enemyHitOffsetY = -knockback * 0.4;
    } else {
      this.enemyHitOffsetX = 0;
      this.enemyHitOffsetY = 0;
    }

    // 5. HP Bar Drain/Heal + Ghost bar catch-up
    if (this.enemyHpPct > this.targetEnemyHpPct) {
      this.enemyHpPct = Math.max(this.targetEnemyHpPct, this.enemyHpPct - 0.016);
    } else if (this.enemyHpPct < this.targetEnemyHpPct) {
      this.enemyHpPct = Math.min(this.targetEnemyHpPct, this.enemyHpPct + 0.016);
    }

    if (this.ghostEnemyHpPct > this.enemyHpPct) {
      this.ghostEnemyHpPct = Math.max(this.enemyHpPct, this.ghostEnemyHpPct - 0.008);
    } else {
      this.ghostEnemyHpPct = this.enemyHpPct;
    }

    if (this.playerHpPct > this.targetPlayerHpPct) {
      this.playerHpPct = Math.max(this.targetPlayerHpPct, this.playerHpPct - 0.016);
    } else if (this.playerHpPct < this.targetPlayerHpPct) {
      this.playerHpPct = Math.min(this.targetPlayerHpPct, this.playerHpPct + 0.016);
    }

    if (this.ghostPlayerHpPct > this.playerHpPct) {
      this.ghostPlayerHpPct = Math.max(this.playerHpPct, this.ghostPlayerHpPct - 0.008);
    } else {
      this.ghostPlayerHpPct = this.playerHpPct;
    }

    // 6. Wild Pokémon Faint machine (Red tint -> solid white -> top-to-bottom dust dissolve)
    if (this.enemyFaintPhase !== 'none' && this.enemyFaintPhase !== 'dead') {
      this.enemyFaintTick++;
      if (this.enemyFaintTick <= 16) {
        this.enemyFaintPhase = 'red_flash';
      } else if (this.enemyFaintTick <= 32) {
        this.enemyFaintPhase = 'white_flash';
      } else if (this.enemyFaintTick <= 112) {
        this.enemyFaintPhase = 'dissolving';
        this.enemyDissolveProgress = Math.min(1.0, (this.enemyFaintTick - 32) / 80);
        this.enemyShadowAlpha = Math.max(0, 1.0 - this.enemyDissolveProgress * 1.2);
      } else {
        this.enemyFaintPhase = 'dead';
        this.enemyDissolveProgress = 1.0;
        this.enemyShadowAlpha = 0;
        if (this.onEnemyFaintComplete) {
          const cb = this.onEnemyFaintComplete;
          this.onEnemyFaintComplete = undefined;
          cb();
        }
      }
    }

    // 7. Player Pokémon Faint machine (Solid white -> shrinks down to ground -> disappears)
    if (this.playerFaintPhase !== 'none' && this.playerFaintPhase !== 'dead') {
      this.playerFaintTick++;
      if (this.playerFaintTick <= 16) {
        this.playerFaintPhase = 'white';
        this.playerFaintScale = 1.0;
      } else if (this.playerFaintTick <= 54) {
        this.playerFaintPhase = 'shrinking';
        const p = Math.min(1.0, (this.playerFaintTick - 16) / 38);
        this.playerFaintScale = Math.max(0, 1.0 - p);
      } else {
        this.playerFaintPhase = 'dead';
        this.playerFaintScale = 0;
        this.isPlayerPokemonSentOut = false;
        if (this.onPlayerFaintComplete) {
          const cb = this.onPlayerFaintComplete;
          this.onPlayerFaintComplete = undefined;
          cb();
        }
      }
    }

    // Player Pokémon send-out animation step
    if (this.isPlayerSendingOut) {
      this.sendOutTick++;

      if (this.sendOutPhase === 'throwing') {
        const totalThrowFrames = 26;
        const t = Math.min(1.0, this.sendOutTick / totalThrowFrames);
        const inv = 1 - t;
        // Parabolic arc from (-30, 90) via peak (50, 15) to landing on platform (130, 236)
        this.ballX = inv * inv * -30 + 2 * inv * t * 50 + t * t * 130;
        this.ballY = inv * inv * 90 + 2 * inv * t * 15 + t * t * 236;
        this.ballRotationFrame = Math.floor(t * 18) % 8;

        if (this.sendOutTick >= totalThrowFrames) {
          this.sendOutPhase = 'opening';
          this.sendOutTick = 0;
          this.ballX = 130;
          this.ballY = 236;
        }
      } else if (this.sendOutPhase === 'opening') {
        // Ball opens at (130, 236) and light burst begins
        if (this.sendOutTick >= 8) {
          this.sendOutPhase = 'dropping';
          this.pokemonDropY = 170;
          this.pokemonDropVy = -1.5; // slight upward emergence before falling
          this.pokemonEnergyFlash = 1.0;
          this.pokemonScaleX = 0.85;
          this.pokemonScaleY = 1.2;
        }
      } else if (this.sendOutPhase === 'dropping') {
        // Gravitational acceleration (g = 0.82 px/frame^2)
        this.pokemonDropVy += 0.82;
        this.pokemonDropY += this.pokemonDropVy;
        this.pokemonEnergyFlash = Math.max(0, this.pokemonEnergyFlash - 0.07);

        // Transition stretch back toward 1.0 as it falls
        this.pokemonScaleX += (1.0 - this.pokemonScaleX) * 0.15;
        this.pokemonScaleY += (1.0 - this.pokemonScaleY) * 0.15;

        // Ground touchdown at 280
        if (this.pokemonDropY >= 280) {
          this.pokemonDropY = 280;
          this.sendOutPhase = 'landing';
          this.sendOutTick = 0;
          this.pokemonDropVy = -3.5; // elastic rebound
          this.pokemonScaleX = 1.24; // squash on impact
          this.pokemonScaleY = 0.78;
          this.screenShakeTimer = 10;
          this.screenShakeAmp = 3.8;
          this.pokemonLandCryTriggered = true;
        }
      } else if (this.sendOutPhase === 'landing') {
        // Elastic rebound and settling
        if (this.pokemonDropVy < 0 || this.pokemonDropY < 280) {
          this.pokemonDropVy += 0.9;
          this.pokemonDropY += this.pokemonDropVy;
          if (this.pokemonDropY >= 280) {
            this.pokemonDropY = 280;
            this.pokemonDropVy = 0;
          }
        }
        // Squash-and-stretch spring back to 1.0
        this.pokemonScaleX += (1.0 - this.pokemonScaleX) * 0.28;
        this.pokemonScaleY += (1.0 - this.pokemonScaleY) * 0.28;

        // Open ball on ground fades away
        this.ballAlpha = Math.max(0, 1.0 - this.sendOutTick / 14);

        if (this.sendOutTick >= 16) {
          this.sendOutPhase = 'complete';
          this.isPlayerSendingOut = false;
          this.isPlayerPokemonSentOut = true;
          this.pokemonDropY = 280;
          this.pokemonScaleX = 1.0;
          this.pokemonScaleY = 1.0;
          this.ballAlpha = 0;
        }
      }
    }

    // Smooth slide-in for databoxes (takes ~20 frames / 0.33s)
    if (!this.isIntro && this.enemyDataboxProgress < 1.0) {
      this.enemyDataboxProgress = Math.min(1.0, this.enemyDataboxProgress + 0.05);
    }
    if (this.isPlayerPokemonSentOut && this.playerDataboxProgress < 1.0) {
      this.playerDataboxProgress = Math.min(1.0, this.playerDataboxProgress + 0.05);
    }

    if (this.enemyHurtFlash > 0) this.enemyHurtFlash--;
    if (this.playerHurtFlash > 0) this.playerHurtFlash--;
    if (this.ballShakeTimer > 0) this.ballShakeTimer--;
    if (this.enemyShinyTimer > 0) this.enemyShinyTimer--;
    if (this.playerShinyTimer > 0) this.playerShinyTimer--;

    // Capture success sparkle effect
    if (this.captureSuccessEffect) {
      this.captureSuccessTick++;
      if (this.captureSuccessTick > 40) {
        this.captureSuccessEffect = false;
        this.captureSuccessTick = 0;
      }
    }

    // Capture zoom (when ball hits Pokemon, smooth zoom in and out)
    if (this.captureZooming) {
      this.captureZoomProgress = Math.min(1.0, this.captureZoomProgress + 0.04);
    } else if (this.captureZoomProgress > 0) {
      this.captureZoomProgress = Math.max(0, this.captureZoomProgress - 0.04);
    }

    // Ball throw animation toward enemy
    if (this.isThrowingBall) {
      this.ballThrowTick++;

      if (this.ballThrowPhase === 'throwing') {
        const totalThrowFrames = 26;
        const t = Math.min(1.0, this.ballThrowTick / totalThrowFrames);
        const inv = 1 - t;
        // Parabolic arc from (-30, 90) via peak (170, 60) to enemy (365, 125)
        this.ballThrowX = inv * inv * -30 + 2 * inv * t * 170 + t * t * 365;
        this.ballThrowY = inv * inv * 90 + 2 * inv * t * 60 + t * t * 125;
        this.ballThrowRotationFrame = Math.floor(t * 18) % 8;

        if (this.ballThrowTick >= totalThrowFrames) {
          this.ballThrowPhase = 'opening';
          this.ballThrowTick = 0;
          this.ballThrowX = 365;
          this.ballThrowY = 125;
          // Start camera zoom when ball hits
          this.captureZooming = true;
          this.captureZoomProgress = 0;
          this.onBallHit?.();
        }
      } else if (this.ballThrowPhase === 'opening') {
        // Ball opens and starts capturing Pokemon
        if (this.ballThrowTick >= 8) {
          this.ballThrowPhase = 'capturing';
          this.ballThrowTick = 0;
          this.captureFlashPhase = 'white';
          this.captureShrinkScale = 1.0;
          this.captureAlpha = 1.0;
          // Keep ball at enemy position during capture
          this.ballThrowX = 365;
          this.ballThrowY = 125;
          this.onBallCapture?.();
        }
      } else if (this.ballThrowPhase === 'capturing') {
        // Pokemon gets absorbed into ball
        const CAPTURE_DURATION = 30; // ~0.5s
        const t = Math.min(1.0, this.ballThrowTick / CAPTURE_DURATION);

        // Flash: white (0-8 frames) -> red (8-20 frames) -> fade out
        if (this.ballThrowTick < 8) {
          this.captureFlashPhase = 'white';
        } else if (this.ballThrowTick < 20) {
          this.captureFlashPhase = 'red';
        } else {
          this.captureFlashPhase = 'none';
        }

        // Shrink Pokemon toward ball position
        this.captureShrinkScale = Math.max(0, 1.0 - t);
        this.captureAlpha = Math.max(0, 1.0 - t * 0.8);

        if (this.ballThrowTick >= CAPTURE_DURATION) {
          this.ballThrowPhase = 'falling';
          this.ballThrowTick = 0;
          this.captureAlpha = 0; // Pokemon fully absorbed
          // Ball closes and starts falling
          this.ballThrowX = 365;
          this.ballThrowY = 125; // Still at capture height
          this.onBallDrop?.();
        }
      } else if (this.ballThrowPhase === 'falling') {
        // Closed ball falls with bounce: drop -> bounce up -> settle down
        const FALL_DURATION = 20; // Longer for bounce effect
        const t = Math.min(1.0, this.ballThrowTick / FALL_DURATION);

        if (t < 0.4) {
          // First drop: 125 -> 160 (0-0.4)
          const dropT = t / 0.4;
          this.ballThrowY = 125 + dropT * (160 - 125);
        } else if (t < 0.7) {
          // Bounce up: 160 -> 145 (0.4-0.7)
          const bounceT = (t - 0.4) / 0.3;
          this.ballThrowY = 160 - bounceT * (160 - 145);
        } else {
          // Settle down: 145 -> 160 (0.7-1.0)
          const settleT = (t - 0.7) / 0.3;
          this.ballThrowY = 145 + settleT * (160 - 145);
        }

        if (this.ballThrowTick >= FALL_DURATION) {
          this.ballThrowPhase = 'shaking';
          this.ballThrowTick = 0;
          this.ballThrowY = 160; // Final ground position
        }
      } else if (this.ballThrowPhase === 'shaking') {
        // Ball on ground, waiting for shake logic from controller
      }
    }
  }

  /** Queue a message for the typewriter display */
  queueMessage(
    text: string,
    nextMode: 'command' | 'message' | 'end' = 'command',
    onFinish?: () => void
  ): void {
    this.messageQueue.push({ text, nextMode, onFinish });
    if (!this.isTyping) {
      this.advanceMessage();
    }
  }

  /** Advance to the next message in the queue (starts typewriter) */
  advanceMessage(): void {
    if (this.messageQueue.length === 0) {
      this.uiMode = 'command';
      this.isTyping = false;
      return;
    }

    const next = this.messageQueue.shift()!;
    this.messageText = next.text;
    this.textTypingIndex = 0;
    this.currentDisplayedText = '';
    this.uiMode = 'message';
    this.isTyping = true;

    // The actual typing interval is managed by BattleController
    // We store onFinish/nextMode on the _currentMessage so the controller can call it
    this._currentMessageEntry = next;
  }

  /** The message entry currently being typed (used by controller to call onFinish) */
  _currentMessageEntry: MessageEntry | null = null;

  /** Called each typing tick by the controller */
  typeNextChar(): boolean {
    if (this.textTypingIndex < this.messageText.length) {
      this.currentDisplayedText += this.messageText[this.textTypingIndex];
      this.textTypingIndex++;
      return false; // not done yet
    }
    return true; // done typing
  }

  /** Skip to end of current message */
  skipToEnd(): void {
    this.currentDisplayedText = this.messageText;
    this.textTypingIndex = this.messageText.length;
  }
}
