/**
 * Battle screen input controller.
 * Handles mouse events, typing intervals, and dispatches actions.
 * Reads/writes BattleState, calls BattleEngine for game logic.
 */

import type { BattlerPokemon, BattleMove } from './types';
import type { BattleState } from './battle-state';
import { BattleEngine } from './battle-engine';
import { getHoveredCommandIndex, type BattleRenderer } from './battle-renderer';
import { PartyScreen } from '../ui/party-screen';
import { BagScreen } from '../ui/bag-screen';
import type { ItemDef } from '../data/items-db';
import type { PartyPokemon } from '../domain/party/party-state';
import { partyPokemonToBattler } from '../domain/party/party-state';
import { partyService } from '../domain/party/party-service';

/** Callback when the battle ends */
export type BattleEndCallback = (result: {
  outcome: 'caught' | 'victory' | 'fled' | 'defeated';
  caughtPokemon?: BattlerPokemon;
  activePlayerPokemon?: BattlerPokemon;
}) => void;

export class BattleController {
  private state: BattleState;
  private engine: BattleEngine;
  private canvas: HTMLCanvasElement;
  private onEnd: BattleEndCallback;
  private renderer?: BattleRenderer;
  private typingTimer: ReturnType<typeof setInterval> | null = null;

  // Bound event handlers (for cleanup)
  private boundClick: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;

  constructor(
    state: BattleState,
    engine: BattleEngine,
    canvas: HTMLCanvasElement,
    onEnd: BattleEndCallback,
    renderer?: BattleRenderer
  ) {
    this.state = state;
    this.engine = engine;
    this.canvas = canvas;
    this.onEnd = onEnd;
    this.renderer = renderer;

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
    const { x, y } = this.getCanvasCoords(e);

    if (this.state.uiMode === 'command') {
      this.state.hoveredCommandIdx = getHoveredCommandIndex(x, y);
      return;
    }

    if (this.state.uiMode === 'moves') {
      if (x >= 12 && x <= 202 && y >= 296 && y <= 334) {
        this.state.hoveredMoveIdx = 0;
        this.state.hoveredCancel = false;
      } else if (x >= 206 && x <= 396 && y >= 296 && y <= 334) {
        this.state.hoveredMoveIdx = 1;
        this.state.hoveredCancel = false;
      } else if (x >= 12 && x <= 202 && y >= 336 && y <= 374) {
        this.state.hoveredMoveIdx = 2;
        this.state.hoveredCancel = false;
      } else if (x >= 206 && x <= 396 && y >= 336 && y <= 374) {
        this.state.hoveredMoveIdx = 3;
        this.state.hoveredCancel = false;
      } else if (x >= 398 && x <= 508 && y >= 300 && y <= 376) {
        this.state.hoveredCancel = true;
        this.state.hoveredMoveIdx = -1;
      } else {
        this.state.hoveredMoveIdx = -1;
        this.state.hoveredCancel = false;
      }
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
    const idx = getHoveredCommandIndex(x, y);
    if (idx === 0) {
      this.state.hoveredCommandIdx = 0;
      this.state.uiMode = 'moves';
    } else if (idx === 1) {
      this.state.hoveredCommandIdx = 1;
      this.handleBagCommand();
    } else if (idx === 2) {
      this.state.hoveredCommandIdx = 2;
      this.handlePokemonCommand();
    } else if (idx === 3) {
      this.state.hoveredCommandIdx = 3;
      this.handleRun();
    }
  }

  private handleBagCommand(): void {
    BagScreen.getInstance().openForBattleUse(
      (entry) => {
        const item = entry.item;
        const pocket = entry.pocketIndex;
        if (pocket === 2 || item.category === 'pokeball') {
          this.handleThrowBall(item);
        } else {
          this.handleUseMedicineInBattle(item);
        }
      },
      () => {
        this.state.uiMode = 'command';
      }
    );
  }

  private handleUseMedicineInBattle(item: ItemDef): void {
    const player = this.engine.playerPokemon;
    let healAmount = 20;
    if (item.id === 'SUPERPOTION') healAmount = 50;
    else if (item.id === 'HYPERPOTION') healAmount = 200;
    else if (item.id === 'MAXPOTION' || item.id === 'FULLRESTORE') healAmount = player.maxHp;

    const oldHp = player.currentHp;
    player.currentHp = Math.min(player.maxHp, player.currentHp + healAmount);
    const recovered = player.currentHp - oldHp;
    this.state.targetPlayerHpPct = player.currentHp / player.maxHp;

    this.state.uiMode = 'message';
    this.queueMessage(
      `Đã dùng ${item.name}! ${player.name} hồi phục ${recovered} HP!`,
      'message',
      () => {
        setTimeout(() => {
          this.handleEnemyTurn();
        }, 400);
      }
    );
  }

  private handleMovesClick(x: number, y: number): void {
    // Cancel button (right column: 398..508, 296..380)
    if (x >= 398 && y >= 296 && y <= 380) {
      this.state.uiMode = 'command';
      this.state.hoveredMoveIdx = -1;
      this.state.hoveredCancel = false;
      return;
    }

    let selectedMoveIdx = -1;
    if (x >= 12 && x <= 202 && y >= 296 && y <= 334) selectedMoveIdx = 0;
    else if (x >= 206 && x <= 396 && y >= 296 && y <= 334) selectedMoveIdx = 1;
    else if (x >= 12 && x <= 202 && y >= 336 && y <= 374) selectedMoveIdx = 2;
    else if (x >= 206 && x <= 396 && y >= 336 && y <= 374) selectedMoveIdx = 3;

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

    // Start player attack forward lunge
    this.state.startPlayerAttack(() => {
      // On impact: trigger enemy hit reaction (knockback jitter & hurt flash)
      this.state.startEnemyHit();
    });

    const result = this.engine.executeAttack(player, enemy, move);
    this.state.targetEnemyHpPct = enemy.currentHp / enemy.maxHp;

    this.queueMessage(result.message, 'message', () => {
      if (result.defenderFainted) {
        // Trigger wild Pokemon faint sequence: red flash -> pure white -> top-to-bottom particle dissolve
        this.state.startEnemyFaint(() => {
          this.queueMessage(`The wild ${enemy.name} fainted!`, 'message', () => {
            this.queueMessage(`${player.name} gained ${enemy.level * 35} EXP!`, 'end', () => {
              this.endBattle('victory');
            });
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

    // Start enemy attack forward lunge
    this.state.startEnemyAttack(() => {
      // On impact: trigger player hit reaction (knockback jitter & hurt flash)
      this.state.startPlayerHit();
    });

    const result = this.engine.executeAttack(enemy, player, enemyMove);
    this.state.targetPlayerHpPct = player.currentHp / player.maxHp;

    this.queueMessage(result.message, 'message', () => {
      if (result.defenderFainted) {
        // Trigger player Pokemon faint sequence: white energy -> shrinks down into base -> disappears
        this.state.startPlayerFaint(() => {
          partyService.syncBattleResult(this.engine.playerPokemon, 0);
          const hasAlive = partyService.getParty().some((p) => p.currentHp > 0 && !p.isFainted);
          if (hasAlive) {
            this.queueMessage(`${player.name} fainted!`, 'message', () => {
              this.handleForceSwitch();
            });
          } else {
            this.queueMessage(`${player.name} fainted!`, 'end', () => {
              this.endBattle('defeated');
            });
          }
        });
      } else {
        this.state.uiMode = 'command';
      }
    });
  }

  private handleThrowBall(item?: ItemDef): void {
    const ballName = item?.name || 'Poké Ball';
    let multiplier = 1.0;
    if (item?.id === 'GREATBALL') multiplier = 1.5;
    else if (item?.id === 'ULTRABALL') multiplier = 2.0;
    else if (item?.id === 'MASTERBALL') multiplier = 999.0;
    else if (item?.id === 'QUICKBALL') multiplier = 4.0;
    else if (item?.id === 'DUSKBALL' || item?.id === 'NETBALL') multiplier = 3.0;

    this.state.uiMode = 'message';
    this.state.isThrowingBall = true;

    this.queueMessage(`Huấn luyện viên đã ném ${ballName}!`, 'message', () => {
      const catchRes = this.engine.tryCatchPokemon(multiplier, ballName);

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

  private handlePokemonCommand(): void {
    PartyScreen.getInstance().openForBattleSelect({
      currentBattlerUid: this.engine.playerPokemon.uid,
      onSelect: (selectedPk) => {
        this.handleSwitchPokemon(selectedPk);
      },
      onCancel: () => {
        this.state.uiMode = 'command';
      },
    });
  }

  private handleSwitchPokemon(selectedPk: PartyPokemon): void {
    // 1. Sync current active battler back into party
    partyService.syncBattleResult(this.engine.playerPokemon, 0);

    // 2. Prepare new battler from selected party member
    const newBattler = partyPokemonToBattler(selectedPk);

    this.state.uiMode = 'message';
    const oldName = this.engine.playerPokemon.name;
    this.queueMessage(`${oldName}, quay lại!`, 'message', () => {
      // 3. Switch battler in engine & update renderer
      this.engine.switchPlayerPokemon(newBattler);
      if (this.renderer) {
        this.renderer.updatePlayerSprite(newBattler.backSprite);
        this.renderer.updatePlayerBall(newBattler.pokeball ?? 'POKEBALL');
      }
      this.state.playerHpPct = newBattler.currentHp / newBattler.maxHp;
      this.state.targetPlayerHpPct = this.state.playerHpPct;
      this.state.playerHurtFlash = 0;
      this.state.startPlayerSendOut();

      this.queueMessage(`Tiến lên! ${newBattler.name}!`, 'message', () => {
        // Switching takes the player's turn action -> enemy executes turn
        setTimeout(() => {
          this.handleEnemyTurn();
        }, 400);
      });
    });
  }

  private handleForceSwitch(): void {
    PartyScreen.getInstance().openForBattleSelect({
      currentBattlerUid: this.engine.playerPokemon.uid,
      onSelect: (selectedPk) => {
        const newBattler = partyPokemonToBattler(selectedPk);
        this.engine.switchPlayerPokemon(newBattler);
        if (this.renderer) {
          this.renderer.updatePlayerSprite(newBattler.backSprite);
          this.renderer.updatePlayerBall(newBattler.pokeball ?? 'POKEBALL');
        }
        this.state.playerHpPct = newBattler.currentHp / newBattler.maxHp;
        this.state.targetPlayerHpPct = this.state.playerHpPct;
        this.state.playerHurtFlash = 0;
        this.state.startPlayerSendOut();

        this.queueMessage(`Tiến lên! ${newBattler.name}!`, 'command');
      },
      onCancel: () => {
        const hasAlive = partyService.getParty().some((p) => p.currentHp > 0 && !p.isFainted);
        if (hasAlive) {
          setTimeout(() => this.handleForceSwitch(), 100);
        } else {
          this.endBattle('defeated');
        }
      },
    });
  }

  private endBattle(
    outcome: 'caught' | 'victory' | 'fled' | 'defeated',
    caughtPokemon?: BattlerPokemon
  ): void {
    this.state.isRunning = false;
    this.destroy();
    this.onEnd({
      outcome,
      caughtPokemon,
      activePlayerPokemon: this.engine.playerPokemon,
    });
  }
}
