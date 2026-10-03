/**
 * Battle screen input controller.
 * Handles mouse events, typing intervals, and dispatches actions.
 * Reads/writes BattleState, calls BattleEngine for game logic.
 */

import type { BattlerPokemon, BattleMove } from './types';
import type { BattleState } from './battle-state';
import { BattleEngine } from './battle-engine';


/** Callback when the battle ends */
export type BattleEndCallback = (result: {
  outcome: 'caught' | 'victory' | 'fled' | 'defeated';
  caughtPokemon?: BattlerPokemon;
}) => void;

export class BattleController {
  private state: BattleState;
  private engine: BattleEngine;
  private canvas: HTMLCanvasElement;
  private onEnd: BattleEndCallback;
  private typingTimer: ReturnType<typeof setInterval> | null = null;

  // Bound event handlers (for cleanup)
  private boundClick: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;

  constructor(
    state: BattleState,
    engine: BattleEngine,
    canvas: HTMLCanvasElement,
    onEnd: BattleEndCallback
  ) {
    this.state = state;
    this.engine = engine;
    this.canvas = canvas;
    this.onEnd = onEnd;

    this.boundClick = (e) => this.handleClick(e);
    this.boundMouseMove = (e) => this.handleMouseMove(e);

    canvas.addEventListener('click', this.boundClick);
    canvas.addEventListener('mousemove', this.boundMouseMove);
  }

  /** Remove all event listeners */
  destroy(): void {
    this.canvas.removeEventListener('click', this.boundClick);
    this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }

  /** Start the typing interval for state.advanceMessage() */
  startTyping(): void {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
    }

    this.typingTimer = setInterval(() => {
      const done = this.state.typeNextChar();
      if (done) {
        clearInterval(this.typingTimer!);
        this.typingTimer = null;
        setTimeout(() => {
          this.state.isTyping = false;
          const entry = this.state._currentMessageEntry;
          if (entry?.onFinish) {
            entry.onFinish();
          } else if (entry?.nextMode === 'command') {
            this.state.uiMode = 'command';
          } else if (entry?.nextMode === 'end') {
            // Battle ends — handled by onFinish callback
          } else {
            this.state.advanceMessage();
            if (this.state.isTyping) {
              this.startTyping();
            }
          }
        }, 1100);
      }
    }, 25);
  }

  /** Queue a message and start typing it */
  queueMessage(
    text: string,
    nextMode: 'command' | 'message' | 'end' = 'command',
    onFinish?: () => void
  ): void {
    const wasTyping = this.state.isTyping;
    this.state.queueMessage(text, nextMode, onFinish);
    if (!wasTyping && this.state.isTyping) {
      this.startTyping();
    }
  }

  // ---- Input Handling ----

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.state.uiMode !== 'command') return;
    const { x, y } = this.getCanvasCoords(e);

    if (x >= 252 && x <= 378 && y >= 296 && y <= 338) {
      this.state.hoveredCommandIdx = 0; // FIGHT
    } else if (x >= 381 && x <= 507 && y >= 296 && y <= 338) {
      this.state.hoveredCommandIdx = 1; // BAG
    } else if (x >= 252 && x <= 378 && y >= 339 && y <= 381) {
      this.state.hoveredCommandIdx = 2; // POKEMON
    } else if (x >= 381 && x <= 507 && y >= 339 && y <= 381) {
      this.state.hoveredCommandIdx = 3; // RUN
    }
  }

  private handleClick(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e);

    if (this.state.uiMode === 'message') {
      this.state.skipToEnd();
      return;
    }

    if (this.state.uiMode === 'command') {
      this.handleCommandClick(x, y);
      return;
    }

    if (this.state.uiMode === 'moves') {
      this.handleMovesClick(x, y);
      return;
    }

    if (this.state.uiMode === 'bag') {
      this.handleBagClick(x, y);
    }
  }

  private handleCommandClick(x: number, y: number): void {
    if (x >= 252 && x <= 378 && y >= 296 && y <= 338) {
      this.state.hoveredCommandIdx = 0;
      this.state.uiMode = 'moves';
    } else if (x >= 381 && x <= 507 && y >= 296 && y <= 338) {
      this.state.hoveredCommandIdx = 1;
      this.state.uiMode = 'bag';
    } else if (x >= 252 && x <= 378 && y >= 339 && y <= 381) {
      this.state.hoveredCommandIdx = 2;
      this.queueMessage(`${this.engine.playerPokemon.name} is ready for battle!`, 'command');
    } else if (x >= 381 && x <= 507 && y >= 339 && y <= 381) {
      this.state.hoveredCommandIdx = 3;
      this.handleRun();
    }
  }

  private handleMovesClick(x: number, y: number): void {
    // Back button
    if (x >= 380 && y >= 320) {
      this.state.uiMode = 'command';
      return;
    }

    let selectedMoveIdx = -1;
    if (x >= 20 && x <= 180 && y >= 295 && y <= 335) selectedMoveIdx = 0;
    else if (x >= 190 && x <= 350 && y >= 295 && y <= 335) selectedMoveIdx = 1;
    else if (x >= 20 && x <= 180 && y >= 340 && y <= 380) selectedMoveIdx = 2;
    else if (x >= 190 && x <= 350 && y >= 340 && y <= 380) selectedMoveIdx = 3;

    if (selectedMoveIdx >= 0 && selectedMoveIdx < this.engine.playerPokemon.moves.length) {
      const move = this.engine.playerPokemon.moves[selectedMoveIdx];
      this.handlePlayerMove(move);
    }
  }

  private handleBagClick(x: number, y: number): void {
    if (x >= 140 && x <= 360 && y >= 300 && y <= 345) {
      this.handleThrowBall();
    } else if (x >= 380 && y >= 330) {
      this.state.uiMode = 'command';
    }
  }

  // ---- Game Actions ----

  private handlePlayerMove(move: BattleMove): void {
    this.state.uiMode = 'message';
    const player = this.engine.playerPokemon;
    const enemy = this.engine.enemyPokemon;

    const result = this.engine.executeAttack(player, enemy, move);
    this.state.enemyHurtFlash = 12;
    this.state.targetEnemyHpPct = enemy.currentHp / enemy.maxHp;

    this.queueMessage(result.message, 'message', () => {
      if (result.defenderFainted) {
        this.queueMessage(`The wild ${enemy.name} fainted!`, 'message', () => {
          this.queueMessage(`${player.name} gained ${enemy.level * 35} EXP!`, 'end', () => {
            this.endBattle('victory');
          });
        });
      } else {
        setTimeout(() => {
          this.handleEnemyTurn();
        }, 400);
      }
    });
  }

  private handleEnemyTurn(): void {
    const enemy = this.engine.enemyPokemon;
    const player = this.engine.playerPokemon;
    const enemyMove = this.engine.getEnemyAction();

    const result = this.engine.executeAttack(enemy, player, enemyMove);
    this.state.playerHurtFlash = 12;
    this.state.targetPlayerHpPct = player.currentHp / player.maxHp;

    this.queueMessage(result.message, 'message', () => {
      if (result.defenderFainted) {
        this.queueMessage(`${player.name} fainted!`, 'end', () => {
          this.endBattle('defeated');
        });
      } else {
        this.state.uiMode = 'command';
      }
    });
  }

  private handleThrowBall(): void {
    if (this.engine.ballsCount <= 0) {
      this.queueMessage('You have no Poké Balls left!', 'command');
      return;
    }

    this.state.uiMode = 'message';
    this.state.isThrowingBall = true;

    this.queueMessage(`Red used one Poké Ball!`, 'message', () => {
      const catchRes = this.engine.tryCatchPokemon();

      let shakeCount = 0;
      const shakeInterval = setInterval(() => {
        if (shakeCount < catchRes.shakes) {
          this.state.ballShakeTimer = 15;
          shakeCount++;
        } else {
          clearInterval(shakeInterval);
          this.state.isThrowingBall = false;

          if (catchRes.caught) {
            this.queueMessage(catchRes.message, 'end', () => {
              this.endBattle('caught', this.engine.enemyPokemon);
            });
          } else {
            this.queueMessage(catchRes.message, 'message', () => {
              this.handleEnemyTurn();
            });
          }
        }
      }, 700);
    });
  }

  private handleRun(): void {
    this.state.uiMode = 'message';
    const escaped = this.engine.tryFlee();
    if (escaped) {
      this.queueMessage('Got away safely!', 'end', () => {
        this.endBattle('fled');
      });
    } else {
      this.queueMessage("Can't escape!", 'message', () => {
        this.handleEnemyTurn();
      });
    }
  }

  private endBattle(
    outcome: 'caught' | 'victory' | 'fled' | 'defeated',
    caughtPokemon?: BattlerPokemon
  ): void {
    this.state.isRunning = false;
    this.destroy();
    this.onEnd({ outcome, caughtPokemon });
  }
}
