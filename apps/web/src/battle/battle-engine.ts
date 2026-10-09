import type {
  BattlerPokemon,
  BattleMove,
  BattlePhase,
  BattleEnvironment,
  BattleEvent,
  BattlerSide,
} from './types';
import { defaultBattleRng, type BattleRng } from './battle-rng';
import { isTypeImmune } from './rules/type-effectiveness';
import { calculateDamage } from './rules/damage-calculator';
import {
  checkPreTurnStatus,
  processEndTurnEffects,
  getStatusImmunity,
} from './rules/status-engine';
import { determineTurnOrder } from './rules/turn-order';
import {
  checkMoveAccuracy,
  handleTwoTurnMoveCharge,
  checkSemiInvulnerableHit,
  applyStatusCategoryMove,
  NEVER_MISS_MOVE_IDS,
  RECHARGE_MOVE_IDS,
  PROTECT_MOVE_IDS,
  TWO_TURN_MOVE_IDS,
  STRUGGLE_MOVE,
} from './rules/move-effect-engine';
import { BattleEventFactory } from './state/battle-event-factory';
import { HeldItemEngine } from './rules/held-item-engine';
import {
  ensureBattlerState,
  applyStatStageChange,
  restoreHp,
  setStatusCondition,
  clearStatusCondition,
  getStatMultiplier,
  getAccuracyMultiplier,
  getMoveDisplayName,
  STAT_NAME_VI,
  STATUS_NAME_VI,
} from './state/battle-state-reducer';

export interface TurnResult {
  attackerName: string;
  moveName: string;
  damage: number;
  typeEffectiveness: number;
  isCritical: boolean;
  isMiss?: boolean;
  defenderFainted: boolean;
  attackerFainted?: boolean;
  hitsCount?: number;
  message: string;
  statChangeMessage?: string;
  statusEffectMessage?: string;
  healAmount?: number;
  events: BattleEvent[];
}

export interface CatchResult {
  caught: boolean;
  shakes: number;
  message: string;
}

export interface EndTurnResult {
  damage: number;
  defenderFainted: boolean;
  message: string;
  events: BattleEvent[];
}

// Re-export constants & helpers for external modules & backward compatibility
export {
  NEVER_MISS_MOVE_IDS,
  RECHARGE_MOVE_IDS,
  PROTECT_MOVE_IDS,
  TWO_TURN_MOVE_IDS,
  STAT_NAME_VI,
  STATUS_NAME_VI,
  STRUGGLE_MOVE,
  getStatMultiplier,
  getAccuracyMultiplier,
  getMoveDisplayName,
};

/**
 * BattleEngine acts as the central coordinator (Facade) orchestrating battle state,
 * rules, turn progression, and event publishing.
 */
export class BattleEngine {
  public playerPokemon: BattlerPokemon;
  public enemyPokemon: BattlerPokemon;
  public environment: BattleEnvironment;
  public phase: BattlePhase = 'intro';
  public message: string = '';
  public ballsCount: number = 5;
  public fleeAttempts: number = 0;

  constructor(
    playerPokemon: BattlerPokemon,
    enemyPokemon: BattlerPokemon,
    environment: BattleEnvironment,
    public readonly rng: BattleRng = defaultBattleRng
  ) {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.environment = environment;
    this.message = `${enemyPokemon.name} hoang dã xuất hiện!`;

    ensureBattlerState(this.playerPokemon);
    ensureBattlerState(this.enemyPokemon);
  }

  public switchPlayerPokemon(newPokemon: BattlerPokemon): void {
    this.playerPokemon = newPokemon;
    ensureBattlerState(this.playerPokemon);
  }

  /**
   * Applies persistent end-turn damage (burn, poison, toxic, leech seed).
   */
  public applyEndTurnEffects(
    target: BattlerPokemon,
    opponent?: BattlerPokemon
  ): EndTurnResult | null {
    const targetSide: BattlerSide = target === this.playerPokemon ? 'player' : 'enemy';
    const opponentSide: BattlerSide = targetSide === 'player' ? 'enemy' : 'player';
    return processEndTurnEffects(target, targetSide, opponent, opponentSide);
  }

  /**
   * Executes an attack move from attacker towards defender, evaluating rules and generating events.
   */
  public executeAttack(
    attacker: BattlerPokemon,
    defender: BattlerPokemon,
    move: BattleMove
  ): TurnResult {
    ensureBattlerState(attacker);
    ensureBattlerState(defender);

    const attackerSide: BattlerSide = attacker === this.playerPokemon ? 'player' : 'enemy';
    const defenderSide: BattlerSide = defender === this.playerPokemon ? 'player' : 'enemy';
    const events: BattleEvent[] = [];

    const moveId = move.id.toLowerCase();
    const moveDisplayName = getMoveDisplayName(move);

    // 0. Round protection reset at the beginning of action
    attacker.isProtected = false;

    events.push(
      BattleEventFactory.moveDeclared(attackerSide, attacker.name, move.id, moveDisplayName)
    );

    // 1. Recharge turn check
    if (attacker.mustRecharge) {
      attacker.mustRecharge = false;
      const rechargeMsg = `${attacker.name} phải nạp lại năng lượng và không thể cử động!`;
      events.push(BattleEventFactory.rechargeHindered(attackerSide, attacker.name, rechargeMsg));
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: rechargeMsg,
        events,
      };
    }

    // PP Check
    if (move.id !== 'struggle' && move.pp <= 0 && !attacker.chargingMove) {
      const noPpMsg = `${attacker.name} định dùng ${moveDisplayName}, nhưng đã hết điểm PP!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: noPpMsg,
        events,
      };
    }

    // 2. Status hindrance check (Sleep, Freeze, Paralysis)
    const statusResult = checkPreTurnStatus(attacker, attackerSide, this.rng);
    events.push(...statusResult.events);
    if (!statusResult.canAct) {
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: statusResult.hinderedMessage || '',
        events,
      };
    }
    const statusPrefix = statusResult.statusPrefix;

    // Deduct PP only when attacker is able to act and not on turn 2 of a charging move
    if (move.id !== 'struggle' && !attacker.chargingMove) {
      move.pp = Math.max(0, move.pp - 1);
    }

    // 3. Protect / Detect move handling
    if (PROTECT_MOVE_IDS.has(moveId)) {
      const uses = attacker.protectSuccessiveUses ?? 0;
      const successChance = Math.pow(0.5, uses);
      if (this.rng.next() < successChance) {
        attacker.isProtected = true;
        attacker.protectSuccessiveUses = uses + 1;
        const protectMsg = `${statusPrefix}${attacker.name} đã dựng lá chắn tự bảo vệ mình!`;
        events.push(
          BattleEventFactory.protectActivated(attackerSide, attacker.name, true, protectMsg)
        );
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: protectMsg,
          events,
        };
      } else {
        attacker.protectSuccessiveUses = 0;
        const failMsg = `${statusPrefix}${attacker.name} định tự bảo vệ mình! Nhưng chiêu thức đã thất bại!`;
        events.push(
          BattleEventFactory.protectActivated(attackerSide, attacker.name, false, failMsg)
        );
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: failMsg,
          events,
        };
      }
    } else {
      attacker.protectSuccessiveUses = 0;
    }

    // 4. Two-turn moves handling (charging & semi-invulnerable)
    const chargeResult = handleTwoTurnMoveCharge(
      attacker,
      attackerSide,
      move,
      moveDisplayName,
      events
    );
    if (chargeResult.isCharging) {
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: `${statusPrefix}${chargeResult.chargeMessage}`,
        events,
      };
    }

    // 5. Defender Protect check
    if (defender.isProtected) {
      if (['feint', 'shadow_force', 'phantom_force', 'hyperspace_hole'].includes(moveId)) {
        defender.isProtected = false;
      } else {
        const blockedMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng ${defender.name} đã được bảo vệ hoàn toàn!`;
        events.push(
          BattleEventFactory.protectBlocked(
            defenderSide,
            defender.name,
            attacker.name,
            moveDisplayName,
            blockedMsg
          )
        );
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: blockedMsg,
          events,
        };
      }
    }

    // 6. Defender Semi-Invulnerable bypass check
    const semiInvCheck = checkSemiInvulnerableHit(defender, moveId);
    if (!semiInvCheck.canHit) {
      const invMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng ${semiInvCheck.missMessage}`;
      events.push(
        BattleEventFactory.semiInvulnerableMiss(
          defenderSide,
          defender.name,
          defender.semiInvulnerable!,
          invMsg
        )
      );
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        isMiss: true,
        defenderFainted: false,
        message: invMsg,
        events,
      };
    }

    // 7. Accuracy / Evasion Check
    const hitsTarget = checkMoveAccuracy(attacker, defender, move, this.rng);
    if (!hitsTarget) {
      const missMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng đã trượt!`;
      events.push(
        BattleEventFactory.accuracyMiss(attackerSide, attacker.name, moveDisplayName, missMsg)
      );
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        isMiss: true,
        defenderFainted: false,
        message: missMsg,
        events,
      };
    }

    // 8. Status move handling
    if (move.category === 'status') {
      const isSelfTargetMove =
        move.id === 'rest' ||
        move.id === 'belly_drum' ||
        (move.healPercent !== undefined && move.healPercent > 0) ||
        (move.statChanges !== undefined &&
          move.statChanges.length > 0 &&
          move.statChanges.every((sc) => sc.target === 'self')) ||
        (move.statusEffect !== undefined && move.statusEffect.target === 'self');

      if (!isSelfTargetMove && isTypeImmune(move.type, defender.types)) {
        const immuneMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Không có tác dụng lên ${defender.name}!`;
        events.push(
          BattleEventFactory.typeImmune(
            defenderSide,
            defender.name,
            attacker.name,
            moveDisplayName,
            immuneMsg
          )
        );
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 0,
          isCritical: false,
          defenderFainted: false,
          message: immuneMsg,
          events,
        };
      }

      const { extraMsg } = applyStatusCategoryMove(
        attacker,
        defender,
        attackerSide,
        defenderSide,
        move,
        this.rng,
        events
      );

      const mainMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}!${extraMsg || ' Đã tác động lên trận đấu!'}`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: mainMsg,
        events,
      };
    }

    // 9. Damaging attack handling
    const dmgCalc = calculateDamage(attacker, defender, move, this.rng);

    if (dmgCalc.typeEffectiveness === 0) {
      const immuneMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Không có tác dụng lên ${defender.name}!`;
      events.push(
        BattleEventFactory.typeImmune(
          defenderSide,
          defender.name,
          attacker.name,
          moveDisplayName,
          immuneMsg
        )
      );
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 0,
        isCritical: false,
        defenderFainted: false,
        message: immuneMsg,
        events,
      };
    }

    if (dmgCalc.failed) {
      const failMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng chiêu thức thất bại!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        isMiss: dmgCalc.isMiss,
        defenderFainted: false,
        message: failMsg,
        events,
      };
    }

    if (dmgCalc.isMiss) {
      const missMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng đã trượt!`;
      events.push(
        BattleEventFactory.accuracyMiss(attackerSide, attacker.name, moveDisplayName, missMsg)
      );
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        isMiss: true,
        defenderFainted: false,
        message: missMsg,
        events,
      };
    }

    if (dmgCalc.healedDefender) {
      const healMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Đã hồi phục HP cho ${defender.name}!`;
      events.push(
        BattleEventFactory.hpRestored(
          defenderSide,
          defender.name,
          dmgCalc.healAmount ?? 0,
          defender.currentHp,
          defender.maxHp,
          'move',
          healMsg
        )
      );
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: healMsg,
        events,
      };
    }

    const damage = dmgCalc.damage;
    let secMsg = dmgCalc.secMsg;
    let attackerFainted = false;

    if (dmgCalc.attackerSelfFainted) {
      attacker.currentHp = 0;
      attacker.isFainted = true;
      attackerFainted = true;
    }

    // Apply damage and calculate actual damage dealt
    const prevDefenderHp = defender.currentHp;
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    const actualDamage = prevDefenderHp - defender.currentHp;
    let defenderFainted = defender.currentHp <= 0;
    if (defenderFainted) {
      defender.isFainted = true;
    }

    // Push structured damage_dealt event
    events.push(
      BattleEventFactory.damageDealt(
        defenderSide,
        defender.name,
        actualDamage,
        defender.currentHp,
        defender.maxHp,
        dmgCalc.typeEffectiveness,
        dmgCalc.isCritical,
        dmgCalc.hitsCount,
        dmgCalc.effText
      )
    );

    if (dmgCalc.hitsCount > 1) {
      events.push(
        BattleEventFactory.multiHitCompleted(
          defenderSide,
          dmgCalc.hitsCount,
          `Đánh trúng ${dmgCalc.hitsCount} lần!`
        )
      );
    }

    // Fire moves thaw frozen defender
    if (defender.status === 'freeze' && move.type === 'Fire' && actualDamage > 0) {
      clearStatusCondition(defender);
      secMsg += ` ${defender.name} đã tan băng!`;
      events.push(
        BattleEventFactory.statusCured(
          defenderSide,
          defender.name,
          'freeze',
          `${defender.name} đã tan băng!`
        )
      );
    }

    // Drain effect
    if (move.drainPercent && move.drainPercent > 0) {
      const drained = Math.max(1, Math.floor(actualDamage * move.drainPercent));
      const actualHealed = restoreHp(attacker, drained);
      secMsg += ` ${defender.name} bị hút cạn sinh lực!`;
      events.push(
        BattleEventFactory.hpRestored(
          attackerSide,
          attacker.name,
          actualHealed,
          attacker.currentHp,
          attacker.maxHp,
          'drain',
          `${defender.name} bị hút cạn sinh lực!`
        )
      );
    }

    // Recoil effect
    const isStruggle = move.id === 'struggle';
    if (isStruggle) {
      const recoil = Math.max(1, Math.floor(attacker.maxHp * 0.25));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      secMsg += ` ${attacker.name} bị phản lực tổn thương!`;
      events.push(
        BattleEventFactory.recoilDamage(
          attackerSide,
          attacker.name,
          recoil,
          attacker.currentHp,
          `${attacker.name} bị phản lực tổn thương!`
        )
      );
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        attackerFainted = true;
      }
    } else if (move.recoilPercent && move.recoilPercent > 0) {
      const recoil = Math.max(1, Math.floor(actualDamage * move.recoilPercent));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      secMsg += ` ${attacker.name} bị phản lực tổn thương!`;
      events.push(
        BattleEventFactory.recoilDamage(
          attackerSide,
          attacker.name,
          recoil,
          attacker.currentHp,
          `${attacker.name} bị phản lực tổn thương!`
        )
      );
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        attackerFainted = true;
      }
    } else if (moveId === 'explosion' || moveId === 'self_destruct') {
      attacker.currentHp = 0;
      attacker.isFainted = true;
      attackerFainted = true;
      secMsg += ` ${attacker.name} đã ngất xỉu!`;
    }

    // Defender fainted event
    if (defenderFainted) {
      events.push(
        BattleEventFactory.fainted(defenderSide, defender.name, `${defender.name} đã ngất xỉu!`)
      );
    }

    // Attacker fainted event
    if (attackerFainted) {
      events.push(
        BattleEventFactory.fainted(attackerSide, attacker.name, `${attacker.name} đã ngất xỉu!`)
      );
    }

    // Destiny Bond retribution check
    if (defenderFainted && defender.destinyBond) {
      attacker.currentHp = 0;
      attacker.isFainted = true;
      attackerFainted = true;
      secMsg += ` ${defender.name} đã kéo ${attacker.name} ngất xỉu theo!`;
      events.push(
        BattleEventFactory.destinyBondTriggered(
          defenderSide,
          defender.name,
          attackerSide,
          attacker.name,
          `${defender.name} đã kéo ${attacker.name} ngất xỉu theo!`
        )
      );
      events.push(
        BattleEventFactory.fainted(attackerSide, attacker.name, `${attacker.name} đã ngất xỉu!`)
      );
    }

    // Secondary effects on surviving defender
    if (!defenderFainted) {
      // Secondary status effect
      if (move.statusEffect) {
        const target = move.statusEffect.target === 'self' ? attacker : defender;
        const tSide: BattlerSide = target === attacker ? attackerSide : defenderSide;
        const chance = Math.max(0, Math.min(1, move.statusEffect.chance));
        const immunityMessage = getStatusImmunity(target, move.statusEffect.condition);
        const conditionVi =
          STATUS_NAME_VI[move.statusEffect.condition] ?? move.statusEffect.condition;
        if (target.status === 'none' && !immunityMessage && this.rng.next() < chance) {
          const initialSleepTurns =
            move.statusEffect.condition === 'sleep' ? this.rng.nextInt(1, 3) : 0;
          setStatusCondition(target, move.statusEffect.condition, initialSleepTurns);
          secMsg += ` ${target.name} đã bị ${conditionVi}!`;
          events.push(
            BattleEventFactory.statusInflicted(
              tSide,
              target.name,
              move.statusEffect.condition,
              `${target.name} đã bị ${conditionVi}!`
            )
          );
        }
      }

      // Secondary stat changes
      if (move.statChanges && move.statChanges.length > 0) {
        for (const sc of move.statChanges) {
          const chance = Math.max(0, Math.min(1, sc.chance ?? 1));
          if (this.rng.next() >= chance) continue;
          const target = sc.target === 'self' ? attacker : defender;
          const tSide: BattlerSide = target === attacker ? attackerSide : defenderSide;
          const change = applyStatStageChange(target, sc.stat, sc.stages);
          const statVi = STAT_NAME_VI[sc.stat] ?? sc.stat;

          if (change > 1) secMsg += ` Chỉ số ${statVi} của ${target.name} tăng mạnh!`;
          else if (change === 1) secMsg += ` Chỉ số ${statVi} của ${target.name} tăng lên!`;
          else if (change === -1) secMsg += ` Chỉ số ${statVi} của ${target.name} giảm xuống!`;
          else if (change < -1) secMsg += ` Chỉ số ${statVi} của ${target.name} giảm mạnh!`;

          events.push(
            BattleEventFactory.statStageChanged(
              tSide,
              target.name,
              sc.stat,
              change,
              target.statStages![sc.stat],
              `Chỉ số ${statVi} của ${target.name} ${change > 0 ? 'tăng' : 'giảm'}!`
            )
          );
        }
      }
    }

    // Recharge move flag
    if (RECHARGE_MOVE_IDS.has(moveId) && actualDamage > 0) {
      attacker.mustRecharge = true;
    }

    // Post-attack held item effects (Life Orb recoil, Rocky Helmet counter, Defender Pinch Berries)
    if (actualDamage > 0) {
      const heldEffects = HeldItemEngine.checkPostAttackEffects(
        attacker,
        attackerSide,
        defender,
        defenderSide,
        move,
        actualDamage
      );
      if (heldEffects.length > 0) {
        events.push(...heldEffects);
        if (attacker.currentHp <= 0) attackerFainted = true;
        if (defender.currentHp <= 0) defenderFainted = true;
      }
    }

    return {
      attackerName: attacker.name,
      moveName: moveDisplayName,
      damage,
      typeEffectiveness: dmgCalc.typeEffectiveness,
      isCritical: dmgCalc.isCritical,
      defenderFainted,
      attackerFainted,
      hitsCount: dmgCalc.hitsCount,
      message: `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}!${dmgCalc.effText}${secMsg}`,
      events,
    };
  }

  public getFirstAttacker(playerMove: BattleMove, enemyMove: BattleMove): 'player' | 'enemy' {
    return determineTurnOrder(
      this.playerPokemon,
      playerMove,
      this.enemyPokemon,
      enemyMove,
      this.rng
    );
  }

  public getEnemyAction(): BattleMove {
    if (this.enemyPokemon.chargingMove) {
      return this.enemyPokemon.chargingMove.move;
    }
    const validMoves = this.enemyPokemon.moves.filter((m) => m.pp > 0);
    if (validMoves.length > 0) {
      const idx = this.rng.nextInt(0, validMoves.length - 1);
      return validMoves[idx];
    }
    return STRUGGLE_MOVE;
  }

  public tryCatchPokemon(
    ballMultiplier: number = 1.0,
    ballName: string = 'Poké Ball'
  ): CatchResult {
    if (this.ballsCount > 0) {
      this.ballsCount--;
    }

    if (ballMultiplier >= 255) {
      return {
        caught: true,
        shakes: 3,
        message: `Bắt được rồi! Đã thu phục ${this.enemyPokemon.name} bằng ${ballName}!`,
      };
    }

    let statusBonus = 1.0;
    if (this.enemyPokemon.status === 'sleep' || this.enemyPokemon.status === 'freeze') {
      statusBonus = 2.0;
    } else if (
      this.enemyPokemon.status === 'paralysis' ||
      this.enemyPokemon.status === 'poison' ||
      this.enemyPokemon.status === 'toxic' ||
      this.enemyPokemon.status === 'burn'
    ) {
      statusBonus = 1.5;
    }

    const maxHp = this.enemyPokemon.maxHp;
    const curHp = Math.max(1, this.enemyPokemon.currentHp);
    const rate = this.enemyPokemon.catchRate;
    const a = Math.floor(
      ((3 * maxHp - 2 * curHp) * rate * ballMultiplier * statusBonus) / (3 * maxHp)
    );

    if (a >= 255) {
      return {
        caught: true,
        shakes: 3,
        message: `Bắt được rồi! Đã thu phục ${this.enemyPokemon.name}!`,
      };
    }

    const b = Math.floor(65536 / Math.pow(255 / Math.max(1, a), 0.25));
    let shakes = 0;
    for (let i = 0; i < 3; i++) {
      const roll = this.rng.nextInt(0, 65535);
      if (roll < b) {
        shakes++;
      } else {
        break;
      }
    }

    if (shakes >= 3) {
      return {
        caught: true,
        shakes: 3,
        message: `Bắt được rồi! Đã thu phục ${this.enemyPokemon.name}!`,
      };
    }

    const escapeMessages = [
      `Ôi không! ${this.enemyPokemon.name} đã thoát ra!`,
      `Tiếc quá! Tưởng như đã bắt được rồi!`,
      `Suýt chút nữa là bắt được rồi!`,
      `Chết tiệt! Đã ở rất gần rồi!`,
    ];

    return {
      caught: false,
      shakes,
      message: escapeMessages[shakes] || escapeMessages[0],
    };
  }

  public tryFlee(): boolean {
    const pSpeed = this.playerPokemon.stats.speed;
    const eSpeed = this.enemyPokemon.stats.speed;
    if (pSpeed >= eSpeed) return true;

    this.fleeAttempts++;
    const odds = Math.floor((pSpeed * 128) / eSpeed + 30 * this.fleeAttempts) % 256;
    return odds >= 255 || this.rng.nextInt(0, 255) < odds;
  }
}
