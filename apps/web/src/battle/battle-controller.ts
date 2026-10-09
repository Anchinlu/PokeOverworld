/**
 * Battle screen input controller.
 * Handles mouse events, typing intervals, and dispatches actions.
 * Reads/writes BattleState, calls BattleEngine for game logic.
 */

import type { BattlerPokemon, BattleMove } from './types';
import type { BattleState } from './battle-state';
import { BattleEngine, STRUGGLE_MOVE, type TurnResult } from './battle-engine';
import { getHoveredCommandIndex, type BattleRenderer } from './battle-renderer';
import { PartyScreen } from '../ui/party-screen';
import { BagScreen } from '../ui/bag-screen';
import type { ItemDef } from '../data/items-db';
import type { PartyPokemon } from '../domain/party/party-state';
import { partyPokemonToBattler } from '../domain/party/party-state';
import { partyService } from '../domain/party/party-service';
import { inventoryService } from '../domain/inventory/inventory-service';
import { applyItemToBattler, applyItemToPartyPokemon } from '../domain/inventory/item-effects';
import { getItemEffectDef } from '../domain/inventory/item-catalog-effects';
import { showBerryToast } from '../ui/toast';
import type { BagItemEntry } from '../ui/bag-screen';
import { normalizeBallKey } from '../assets';
import { moveAnimationManager } from './move-animation-manager';
import { getPokeballData, getBaseCatchRate } from './pokeball-db';
import { battleSePlayer, battleBgmPlayer } from '../audio';
import { pokemonCatalog } from '../data';
import { calculateExpYield as calculateCanonicalExpYield } from '../domain/pokemon/pokemon-exp';
import { HeldItemEngine } from './rules/held-item-engine';

/** Calculates unified official EXP yield */
export function calculateExpYield(enemySpeciesKey: string, enemyLevel: number): number {
  const data = pokemonCatalog.getBySpeciesKey(enemySpeciesKey);
  const total = data?.stats?.total ?? 300;
  return calculateCanonicalExpYield(enemyLevel, undefined, total);
}

/** Callback when the battle ends */
export type BattleEndCallback = (result: {
  outcome: 'caught' | 'victory' | 'fled' | 'defeated';
  caughtPokemon?: BattlerPokemon;
  activePlayerPokemon?: BattlerPokemon;
  expGained?: number;
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
  private partyUnsubscribe?: () => void;

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

    // Two-way synchronization: if PartyScreen or external service updates party HP/status, reflect immediately in battle
    this.partyUnsubscribe = partyService.subscribe(() => {
      const activeUid = this.engine.playerPokemon.uid;
      const member = partyService.getParty().find((p) => p.uid === activeUid);
      if (member) {
        if (
          this.engine.playerPokemon.currentHp !== member.currentHp ||
          this.engine.playerPokemon.maxHp !== member.maxHp ||
          this.engine.playerPokemon.status !== member.status
        ) {
          this.engine.playerPokemon.currentHp = member.currentHp;
          this.engine.playerPokemon.maxHp = member.maxHp;
          this.engine.playerPokemon.status = member.status;
          this.state.targetPlayerHpPct = member.currentHp / member.maxHp;
        }
      }
    });
  }

  /** Synchronize current active battler's HP, PP, and status into partyService */
  private syncActiveBattlerToParty(): void {
    partyService.syncBattleResult(this.engine.playerPokemon, 0);
  }

  /** Remove all event listeners */
  destroy(): void {
    this.canvas.removeEventListener('click', this.boundClick);
    this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.partyUnsubscribe) {
      this.partyUnsubscribe();
      this.partyUnsubscribe = undefined;
    }
    this.state.onBallHit = undefined;
    this.state.onBallCapture = undefined;
    this.state.onBallDrop = undefined;
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
    const player = this.engine.playerPokemon;
    if (player.chargingMove) {
      this.handlePlayerMove(player.chargingMove.move);
      return;
    }
    if (player.mustRecharge) {
      this.handlePlayerMove(player.moves[0] ?? STRUGGLE_MOVE);
      return;
    }

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
          this.handleThrowBall(item, entry.rawId);
        } else {
          this.handleUseMedicineInBattle(item, entry.rawId, entry);
        }
      },
      () => {
        this.state.uiMode = 'command';
      }
    );
  }

  private handleUseMedicineInBattle(item: ItemDef, rawId?: string, entry?: BagItemEntry): void {
    const slug = (item.id || rawId || '').toLowerCase().replace(/_/g, '-');
    const def = getItemEffectDef(slug);

    // 1. Revival Items: In battle, these revive a fainted Pokémon in the party!
    if (def?.reviveRatio !== undefined) {
      this.syncActiveBattlerToParty();
      const party = partyService.getParty();
      const hasFainted = party.some((p) => p.isFainted || p.currentHp <= 0);

      if (!hasFainted) {
        this.state.uiMode = 'message';
        this.queueMessage(
          'Toàn bộ đội hình đều đang khỏe mạnh, không có Pokémon nào cần hồi sinh!',
          'message',
          () => {
            this.handleBagCommand();
          }
        );
        return;
      }

      // Sacred Ash revives ALL fainted members
      if (def.reviveAllParty) {
        const result = applyItemToPartyPokemon(item, party[0], party);
        if (rawId && inventoryService.hasItem(rawId, 1)) {
          inventoryService.removeItem(rawId, 1);
        } else if (inventoryService.hasItem(item.id, 1)) {
          inventoryService.removeItem(item.id, 1);
        }
        battleSePlayer.playSound('Audio/SE/Battle catch click.ogg', 0.85);
        this.state.uiMode = 'message';
        this.queueMessage(result.message, 'message', () => {
          setTimeout(() => {
            this.handleEnemyTurn();
          }, 400);
        });
        return;
      }

      // Open Party Screen so player can pick which fainted Pokémon to revive!
      const bagEntry: BagItemEntry = entry || {
        rawId: rawId || item.id,
        count: 1,
        item,
        pocketIndex: 1,
      };

      PartyScreen.getInstance().openForSelect({
        mode: 'use_item',
        prompt: `Chọn Pokémon cần hồi sinh bằng ${item.nameVi || item.name}:`,
        item: bagEntry,
        onSelect: (selectedPk, _slotIndex) => {
          if (!selectedPk.isFainted && selectedPk.currentHp > 0) {
            showBerryToast(
              `⚠️ ${selectedPk.nickname || selectedPk.name} đang khỏe mạnh! Hãy chọn Pokémon đã ngất xỉu.`,
              '#ef4444'
            );
            return;
          }

          const result = applyItemToPartyPokemon(item, selectedPk, partyService.getParty());
          if (!result.success) {
            showBerryToast(`⚠️ ${result.message}`, '#ef4444');
            return;
          }

          // Deduct 1 item quantity
          if (rawId && inventoryService.hasItem(rawId, 1)) {
            inventoryService.removeItem(rawId, 1);
          } else if (inventoryService.hasItem(item.id, 1)) {
            inventoryService.removeItem(item.id, 1);
          }

          battleSePlayer.playSound('Audio/SE/Battle catch click.ogg', 0.85);
          PartyScreen.getInstance().close();

          // Sync if selected was the active battler
          if (selectedPk.uid === this.engine.playerPokemon.uid) {
            this.engine.playerPokemon.currentHp = selectedPk.currentHp;
            this.engine.playerPokemon.isFainted = false;
            this.engine.playerPokemon.status = 'none';
            this.state.targetPlayerHpPct =
              this.engine.playerPokemon.currentHp / this.engine.playerPokemon.maxHp;
          }

          this.state.uiMode = 'message';
          this.queueMessage(result.message, 'message', () => {
            setTimeout(() => {
              this.handleEnemyTurn();
            }, 400);
          });
        },
        onCancel: () => {
          this.handleBagCommand();
        },
      });
      return;
    }

    // 2. Direct Battler Medicine / Stat Booster
    const player = this.engine.playerPokemon;
    const result = applyItemToBattler(item, player);

    if (!result.success) {
      this.state.uiMode = 'message';
      this.queueMessage(result.message, 'message', () => {
        this.state.uiMode = 'command';
      });
      return;
    }

    // Deduct 1 item quantity from player's inventory!
    if (rawId && inventoryService.hasItem(rawId, 1)) {
      inventoryService.removeItem(rawId, 1);
    } else if (inventoryService.hasItem(item.id, 1)) {
      inventoryService.removeItem(item.id, 1);
    }

    this.state.targetPlayerHpPct = player.currentHp / player.maxHp;
    this.syncActiveBattlerToParty();

    this.state.uiMode = 'message';
    this.queueMessage(result.message, 'message', () => {
      setTimeout(() => {
        this.handleEnemyTurn();
      }, 400);
    });
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
      this.handleBagCommand();
    } else if (x >= 380 && y >= 330) {
      this.state.uiMode = 'command';
    }
  }

  // ---- Game Actions ----

  private resolveEndTurnEffects(
    target: BattlerPokemon,
    onSurvive: () => void,
    onFaint: () => void
  ): void {
    const effect = this.engine.applyEndTurnEffects(target);
    if (!effect) {
      onSurvive();
      return;
    }

    if (target === this.engine.enemyPokemon) {
      this.state.targetEnemyHpPct = target.currentHp / target.maxHp;
    } else {
      this.state.targetPlayerHpPct = target.currentHp / target.maxHp;
      this.syncActiveBattlerToParty();
    }

    this.queueMessage(effect.message, 'message', () => {
      if (effect.defenderFainted) onFaint();
      else onSurvive();
    });
  }

  private resolveRoundEndEffects(player: BattlerPokemon, enemy: BattlerPokemon): void {
    // 1. Player end-turn effects (burn, poison, toxic)
    this.resolveEndTurnEffects(
      player,
      () => {
        // 2. Enemy end-turn effects (burn, poison, toxic)
        this.resolveEndTurnEffects(
          enemy,
          () => {
            this.state.uiMode = 'command';
          },
          () => this.handleEnemyFainted(enemy, player)
        );
      },
      () => this.handlePlayerFainted(player)
    );
  }

  private handleEnemyFainted(enemy: BattlerPokemon, player: BattlerPokemon): void {
    this.state.startEnemyFaint(() => {
      const baseExp = calculateExpYield(enemy.speciesKey, enemy.level);
      const expMultiplier = HeldItemEngine.getExpMultiplier(player);
      const expGained = Math.floor(baseExp * expMultiplier);
      const luckyText = expMultiplier > 1 ? ' (Tăng cường bởi Lucky Egg!)' : '';
      this.queueMessage(`${enemy.name} hoang dã đã ngất xỉu!`, 'message', () => {
        this.queueMessage(`${player.name} nhận được ${expGained} EXP!${luckyText}`, 'end', () => {
          this.endBattle('victory', undefined, expGained);
        });
      });
    });
  }

  private handlePlayerFainted(player: BattlerPokemon): void {
    this.state.startPlayerFaint(() => {
      partyService.syncBattleResult(this.engine.playerPokemon, 0);
      const hasAlive = partyService.getParty().some((p) => p.currentHp > 0 && !p.isFainted);
      if (hasAlive) {
        this.queueMessage(`${player.name} đã ngất xỉu!`, 'message', () => this.handleForceSwitch());
      } else {
        this.queueMessage(`${player.name} đã ngất xỉu!`, 'end', () => this.endBattle('defeated'));
      }
    });
  }

  private executePlayerAttack(move: BattleMove, onDone: (result: TurnResult) => void): void {
    const player = this.engine.playerPokemon;
    const enemy = this.engine.enemyPokemon;

    const result = this.engine.executeAttack(player, enemy, move);
    const animPlan = moveAnimationManager.resolveAnimationPlan(move, result.damage > 0);
    this.syncActiveBattlerToParty();

    this.state.startPlayerAttack({
      lunge: animPlan.attackerLunges,
      onHit: () => {
        if (animPlan.defenderTakesHit) {
          this.state.startEnemyHit();
        }
      },
    });

    this.state.targetEnemyHpPct = enemy.currentHp / enemy.maxHp;
    this.state.targetPlayerHpPct = player.currentHp / player.maxHp;

    this.queueMessage(result.message, 'message', () => {
      onDone(result);
    });
  }

  private executeEnemyAttack(move: BattleMove, onDone: (result: TurnResult) => void): void {
    const enemy = this.engine.enemyPokemon;
    const player = this.engine.playerPokemon;

    const result = this.engine.executeAttack(enemy, player, move);
    const animPlan = moveAnimationManager.resolveAnimationPlan(move, result.damage > 0);
    this.syncActiveBattlerToParty();

    this.state.startEnemyAttack({
      lunge: animPlan.attackerLunges,
      onHit: () => {
        if (animPlan.defenderTakesHit) {
          this.state.startPlayerHit();
        }
      },
    });

    this.state.targetPlayerHpPct = player.currentHp / player.maxHp;
    this.state.targetEnemyHpPct = enemy.currentHp / enemy.maxHp;

    this.queueMessage(result.message, 'message', () => {
      onDone(result);
    });
  }

  private handlePlayerMove(move: BattleMove): void {
    this.state.uiMode = 'message';
    const player = this.engine.playerPokemon;
    const enemy = this.engine.enemyPokemon;

    // Struggle fallback if all player moves have 0 PP
    const hasAnyPp = player.moves.some((m) => m.pp > 0);
    const effectivePlayerMove = hasAnyPp ? move : STRUGGLE_MOVE;

    const enemyMove = this.engine.getEnemyAction();
    const firstSide = this.engine.getFirstAttacker(effectivePlayerMove, enemyMove);

    if (firstSide === 'player') {
      // 1. Player attacks first
      this.executePlayerAttack(effectivePlayerMove, (firstRes) => {
        if (firstRes.defenderFainted || enemy.currentHp <= 0) {
          this.handleEnemyFainted(enemy, player);
          return;
        }
        if (firstRes.attackerFainted || player.currentHp <= 0) {
          this.handlePlayerFainted(player);
          return;
        }

        // 2. Enemy attacks second
        setTimeout(() => {
          this.executeEnemyAttack(enemyMove, (secondRes) => {
            if (secondRes.defenderFainted || player.currentHp <= 0) {
              this.handlePlayerFainted(player);
              return;
            }
            if (secondRes.attackerFainted || enemy.currentHp <= 0) {
              this.handleEnemyFainted(enemy, player);
              return;
            }

            // Both survived: resolve persistent end-turn effects
            this.resolveRoundEndEffects(player, enemy);
          });
        }, 400);
      });
    } else {
      // 1. Enemy attacks first
      this.executeEnemyAttack(enemyMove, (firstRes) => {
        if (firstRes.defenderFainted || player.currentHp <= 0) {
          this.handlePlayerFainted(player);
          return;
        }
        if (firstRes.attackerFainted || enemy.currentHp <= 0) {
          this.handleEnemyFainted(enemy, player);
          return;
        }

        // 2. Player attacks second
        setTimeout(() => {
          this.executePlayerAttack(effectivePlayerMove, (secondRes) => {
            if (secondRes.defenderFainted || enemy.currentHp <= 0) {
              this.handleEnemyFainted(enemy, player);
              return;
            }
            if (secondRes.attackerFainted || player.currentHp <= 0) {
              this.handlePlayerFainted(player);
              return;
            }

            // Both survived: resolve persistent end-turn effects
            this.resolveRoundEndEffects(player, enemy);
          });
        }, 400);
      });
    }
  }

  private handleEnemyTurn(): void {
    const enemy = this.engine.enemyPokemon;
    const player = this.engine.playerPokemon;
    const enemyMove = this.engine.getEnemyAction();

    this.executeEnemyAttack(enemyMove, (res) => {
      if (res.defenderFainted || player.currentHp <= 0) {
        this.handlePlayerFainted(player);
      } else if (res.attackerFainted || enemy.currentHp <= 0) {
        this.handleEnemyFainted(enemy, player);
      } else {
        this.resolveRoundEndEffects(player, enemy);
      }
    });
  }

  private handleThrowBall(item?: ItemDef, rawId?: string): void {
    const ballId = item?.id || 'POKEBALL';
    const canonicalKey = normalizeBallKey(ballId);

    // Verify inventory has at least 1 ball!
    const available =
      (rawId && inventoryService.getItemCount(rawId)) ||
      inventoryService.getItemCount(ballId) ||
      inventoryService.getItemCount(canonicalKey);

    if (available <= 0) {
      this.state.uiMode = 'message';
      this.queueMessage('Bạn không còn quả bóng nào loại này trong túi!', 'message', () => {
        this.state.uiMode = 'command';
      });
      return;
    }

    // Deduct 1 ball from inventory!
    if (rawId && inventoryService.hasItem(rawId, 1)) {
      inventoryService.removeItem(rawId, 1);
    } else if (inventoryService.hasItem(ballId, 1)) {
      inventoryService.removeItem(ballId, 1);
    } else {
      inventoryService.removeItem(canonicalKey, 1);
    }

    const ballData = getPokeballData(ballId);
    const ballName = ballData?.nameVi || item?.nameVi || 'Bóng Poké';

    // Get catch rate from pokeball database
    const multiplier = getBaseCatchRate(ballId);

    this.state.uiMode = 'message';

    // Hook up audio callbacks for animation sequence
    this.state.onBallHit = () => battleSePlayer.playBallHit();
    this.state.onBallCapture = () => battleSePlayer.playJumpToBall();
    this.state.onBallDrop = () => battleSePlayer.playBallDrop();

    // Update thrown ball sprite and start animation
    if (this.renderer) {
      this.renderer.updateThrownBall(ballId);
    }
    this.state.startBallThrow(ballId);
    battleSePlayer.playBallThrow();

    this.queueMessage(`Huấn luyện viên đã ném ${ballName}!`, 'message', () => {
      // Wait for capture animation sequence:
      // 1. Throw (26 frames = 433ms)
      // 2. Opening (8 frames = 133ms)
      // 3. Capturing (30 frames = 500ms)
      // Total: ~1067ms (no falling animation)
      setTimeout(() => {
        const catchRes = this.engine.tryCatchPokemon(multiplier, ballName);

        // Ball on ground, start shaking
        this.state.ballThrowPhase = 'shaking';

        let shakeCount = 0;
        const shakeInterval = setInterval(() => {
          if (shakeCount < catchRes.shakes) {
            this.state.ballShakeTimer = 15;
            this.state.ballShakeCount = shakeCount + 1;
            shakeCount++;
            battleSePlayer.playBallShake();
          } else {
            clearInterval(shakeInterval);

            if (catchRes.caught) {
              // Keep ball and hide Pokemon permanently (don't reset isThrowingBall)
              // Trigger success sparkle effect
              this.state.captureSuccessEffect = true;
              this.state.captureSuccessTick = 0;
              battleBgmPlayer.stopBgm(300);
              battleSePlayer.playCatchSuccess();

              this.queueMessage(catchRes.message, 'end', () => {
                this.endBattle('caught', this.engine.enemyPokemon);
              });
            } else {
              // Failed capture - reset camera zoom, ball state and show Pokemon again
              this.state.isThrowingBall = false;
              this.state.captureAlpha = 1.0; // Reset alpha so Pokemon shows
              this.state.captureZooming = false;
              this.state.captureZoomProgress = 0;
              battleSePlayer.playBallBreak();

              this.queueMessage(catchRes.message, 'message', () => {
                this.handleEnemyTurn();
              });
            }
          }
        }, 700);
      }, 1400); // Wait for capture animation + bounce (30 frames capture + 20 frames bounce = 50 frames = ~833ms, rounded to 1400ms)
    });
  }

  private handleRun(): void {
    this.state.uiMode = 'message';
    const escaped = this.engine.tryFlee();
    if (escaped) {
      this.queueMessage('Đã chạy trốn an toàn!', 'end', () => {
        this.endBattle('fled');
      });
    } else {
      this.queueMessage('Không thể chạy trốn!', 'message', () => {
        this.handleEnemyTurn();
      });
    }
  }

  private handlePokemonCommand(): void {
    this.syncActiveBattlerToParty();
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
    this.syncActiveBattlerToParty();
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
    caughtPokemon?: BattlerPokemon,
    expGained?: number
  ): void {
    this.syncActiveBattlerToParty();
    this.state.isRunning = false;
    this.destroy();
    this.onEnd({
      outcome,
      caughtPokemon,
      activePlayerPokemon: this.engine.playerPokemon,
      expGained,
    });
  }
}
