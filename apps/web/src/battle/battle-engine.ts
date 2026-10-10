import type {
  BattlerPokemon,
  BattleMove,
  BattlePhase,
  BattleEnvironment,
  BattleEvent,
  BattlerSide,
  BattleSideScreens,
} from './types';
import { MOVES_DB } from './moves-db';
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
  FLINCH_MOVE_CHANCES,
  CONFUSION_MOVE_CHANCES,
  SOUND_BASED_MOVE_IDS,
} from './rules/move-effect-engine';
import { BattleEventFactory } from './state/battle-event-factory';
import {
  HeldItemEngine,
  isBerryItem,
  consumeBerry,
  getHeldItemDisplayName,
  normalizeHeldItemKey,
} from './rules/held-item-engine';
import { AbilityEngine } from './rules/ability-engine';
import { canUsePriorityMoveInTerrain } from './rules/environment';
import {
  ensureBattlerState,
  applyStatStageChange,
  restoreHp,
  setStatusCondition,
  clearStatusCondition,
  resetRoundCombatFlags,
  getStatMultiplier,
  getAccuracyMultiplier,
  getMoveDisplayName,
  STAT_NAME_VI,
  STATUS_NAME_VI,
} from './state/battle-state-reducer';
import {
  getSideHazards,
  clearSideHazards,
  canSwitchOut,
  releaseTrapsFromSide,
  applyEntryHazards,
  BINDING_MOVE_IDS,
  TRAPPING_ATTACK_MOVE_IDS,
  HAZARD_CLEARING_MOVE_IDS,
} from './rules/hazard-engine';

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
  mustSwitch?: boolean;
  switchSide?: BattlerSide;
  batonPassData?: Partial<BattlerPokemon>;
  battleEnded?: boolean;
  battleEndReason?: 'fled' | 'roar';
  actionPrevented?: boolean;
  isCharging?: boolean;
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
  AbilityEngine,
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

  /**
   * Triggers switch-in abilities in speed priority order at the start of battle.
   */
  public triggerInitialAbilities(): { messages: string[]; events: BattleEvent[] } {
    const events: BattleEvent[] = [];
    const messages: string[] = [];

    const playerSpeed = this.playerPokemon.stats.speed;
    const enemySpeed = this.enemyPokemon.stats.speed;

    if (playerSpeed >= enemySpeed) {
      const pMsgs = AbilityEngine.onSwitchIn(
        this.playerPokemon,
        'player',
        this.enemyPokemon,
        'enemy',
        this.rng,
        events,
        this.environment
      );
      messages.push(...pMsgs);
      const eMsgs = AbilityEngine.onSwitchIn(
        this.enemyPokemon,
        'enemy',
        this.playerPokemon,
        'player',
        this.rng,
        events,
        this.environment
      );
      messages.push(...eMsgs);
    } else {
      const eMsgs = AbilityEngine.onSwitchIn(
        this.enemyPokemon,
        'enemy',
        this.playerPokemon,
        'player',
        this.rng,
        events,
        this.environment
      );
      messages.push(...eMsgs);
      const pMsgs = AbilityEngine.onSwitchIn(
        this.playerPokemon,
        'player',
        this.enemyPokemon,
        'enemy',
        this.rng,
        events,
        this.environment
      );
      messages.push(...pMsgs);
    }

    return { messages, events };
  }

  public canSwitchPokemon(pokemon: BattlerPokemon): { canSwitch: boolean; reason?: string } {
    return canSwitchOut(pokemon);
  }

  public switchPlayerPokemon(
    newPokemon: BattlerPokemon,
    batonPassData?: Partial<BattlerPokemon>
  ): {
    messages: string[];
    events: BattleEvent[];
  } {
    AbilityEngine.onSwitchOut(this.playerPokemon);
    // Release any traps player had maintained on enemy
    releaseTrapsFromSide('player', this.enemyPokemon);

    const oldSafeguard = this.playerPokemon.safeguardTurns ?? 0;
    this.playerPokemon = newPokemon;
    ensureBattlerState(this.playerPokemon);
    this.playerPokemon.isFlinched = false;
    this.playerPokemon.confusionTurns = batonPassData?.confusionTurns ?? 0;
    this.playerPokemon.hasActedThisRound = false;
    this.playerPokemon.firstTurnInBattle = true;
    this.playerPokemon.hasAquaRing = batonPassData?.hasAquaRing ?? false;
    this.playerPokemon.isIngrained = batonPassData?.isIngrained ?? false;
    this.playerPokemon.isSeeded = batonPassData?.isSeeded ?? false;
    this.playerPokemon.destinyBond = false;
    this.playerPokemon.isProtected = false;
    this.playerPokemon.safeguardTurns = oldSafeguard;
    this.playerPokemon.isTrapped = false;
    this.playerPokemon.trappedBy = undefined;
    this.playerPokemon.boundStatus = undefined;
    if (batonPassData?.statStages) {
      this.playerPokemon.statStages = { ...batonPassData.statStages };
    }

    const events: BattleEvent[] = [];
    const hazardMessages = applyEntryHazards(
      this.playerPokemon,
      'player',
      this.environment,
      events
    );

    let abilityMessages: string[] = [];
    if (!this.playerPokemon.isFainted) {
      abilityMessages = AbilityEngine.onSwitchIn(
        this.playerPokemon,
        'player',
        this.enemyPokemon,
        'enemy',
        this.rng,
        events,
        this.environment
      );
    }
    const messages = [...hazardMessages, ...abilityMessages];
    return { messages, events };
  }

  public switchEnemyPokemon(
    newPokemon: BattlerPokemon,
    batonPassData?: Partial<BattlerPokemon>
  ): {
    messages: string[];
    events: BattleEvent[];
  } {
    AbilityEngine.onSwitchOut(this.enemyPokemon);
    // Release any traps enemy had maintained on player
    releaseTrapsFromSide('enemy', this.playerPokemon);

    const oldSafeguard = this.enemyPokemon.safeguardTurns ?? 0;
    this.enemyPokemon = newPokemon;
    ensureBattlerState(this.enemyPokemon);
    this.enemyPokemon.isFlinched = false;
    this.enemyPokemon.confusionTurns = batonPassData?.confusionTurns ?? 0;
    this.enemyPokemon.hasActedThisRound = false;
    this.enemyPokemon.firstTurnInBattle = true;
    this.enemyPokemon.hasAquaRing = batonPassData?.hasAquaRing ?? false;
    this.enemyPokemon.isIngrained = batonPassData?.isIngrained ?? false;
    this.enemyPokemon.isSeeded = batonPassData?.isSeeded ?? false;
    this.enemyPokemon.destinyBond = false;
    this.enemyPokemon.isProtected = false;
    this.enemyPokemon.safeguardTurns = oldSafeguard;
    this.enemyPokemon.isTrapped = false;
    this.enemyPokemon.trappedBy = undefined;
    this.enemyPokemon.boundStatus = undefined;
    if (batonPassData?.statStages) {
      this.enemyPokemon.statStages = { ...batonPassData.statStages };
    }

    const events: BattleEvent[] = [];
    const hazardMessages = applyEntryHazards(this.enemyPokemon, 'enemy', this.environment, events);

    let abilityMessages: string[] = [];
    if (!this.enemyPokemon.isFainted) {
      abilityMessages = AbilityEngine.onSwitchIn(
        this.enemyPokemon,
        'enemy',
        this.playerPokemon,
        'player',
        this.rng,
        events,
        this.environment
      );
    }
    const messages = [...hazardMessages, ...abilityMessages];
    return { messages, events };
  }

  /**
   * Applies persistent end-turn damage (burn, poison, toxic, leech seed) and abilities (Speed Boost, Shed Skin).
   */
  public applyEndTurnEffects(
    target: BattlerPokemon,
    opponent?: BattlerPokemon
  ): EndTurnResult | null {
    const targetSide: BattlerSide = target === this.playerPokemon ? 'player' : 'enemy';
    const opponentSide: BattlerSide = targetSide === 'player' ? 'enemy' : 'player';
    const res = processEndTurnEffects(target, targetSide, opponent, opponentSide, this.environment);

    // End turn ability triggers (Speed Boost, Shed Skin, etc.)
    const abilityEvents: BattleEvent[] = [];
    const abilityMsgs = AbilityEngine.onEndTurn(target, targetSide, this.rng, abilityEvents);

    if (res) {
      if (abilityMsgs.length > 0) {
        res.message = res.message
          ? `${res.message} ${abilityMsgs.join(' ')}`
          : abilityMsgs.join(' ');
      }
      res.events.push(...abilityEvents);
      return res;
    }

    if (abilityEvents.length > 0) {
      return {
        damage: 0,
        defenderFainted: false,
        message: abilityMsgs.join(' '),
        events: abilityEvents,
      };
    }

    return null;
  }

  /**
   * Executes an attack move from attacker towards defender, evaluating rules and generating events.
   */
  public executeAttack(
    attacker: BattlerPokemon,
    defender: BattlerPokemon,
    move: BattleMove,
    bypassSleep?: boolean
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
    attacker.hasActedThisRound = true;

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
        actionPrevented: true,
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
        actionPrevented: true,
      };
    }

    // Pre-execution restrictions (Sleep-only moves, Taunt, Disable, Torment, Encore, Throat Chop)
    const isSleepMove = moveId === 'snore' || moveId === 'sleep_talk';
    if (isSleepMove && attacker.status !== 'sleep') {
      const failMsg = `${attacker.name} định dùng ${moveDisplayName}, nhưng chỉ có thể dùng khi đang ngủ!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: failMsg,
        events,
        actionPrevented: true,
      };
    }

    if ((attacker.tauntTurns ?? 0) > 0 && move.category === 'status') {
      const tauntBlockedMsg = `${attacker.name} bị khiêu khích nên không thể dùng ${moveDisplayName}!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: tauntBlockedMsg,
        events,
        actionPrevented: true,
      };
    }

    if (
      attacker.disabledMove &&
      attacker.disabledMove.turnsLeft > 0 &&
      attacker.disabledMove.moveId === moveId
    ) {
      const disableMsg = `${attacker.name} không thể sử dụng ${moveDisplayName} vì chiêu đã bị vô hiệu hóa!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: disableMsg,
        events,
        actionPrevented: true,
      };
    }

    if (attacker.isTormented && attacker.lastUsedMoveId === moveId) {
      const tormentBlockedMsg = `${attacker.name} không thể sử dụng ${moveDisplayName} hai lần liên tiếp do bị Dằn Vặt!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: tormentBlockedMsg,
        events,
        actionPrevented: true,
      };
    }

    if (attacker.encore && attacker.encore.turnsLeft > 0 && attacker.encore.moveId !== moveId) {
      const encoreBlockedMsg = `${attacker.name} phải tiếp tục lặp lại chiêu thức [${attacker.encore.moveId}] theo lời tán dương!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: encoreBlockedMsg,
        events,
        actionPrevented: true,
      };
    }

    if (attacker.rampage && attacker.rampage.turnsLeft > 0 && attacker.rampage.moveId !== moveId) {
      const rampageMoveName =
        attacker.moves.find((m) => m.id === attacker.rampage?.moveId)?.name ??
        attacker.rampage.moveId;
      const rampageBlockedMsg = `${attacker.name} đang trong cơn cuồng nộ và chỉ có thể sử dụng ${rampageMoveName}!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: rampageBlockedMsg,
        events,
        actionPrevented: true,
      };
    }

    if ((attacker.throatChopTurns ?? 0) > 0 && SOUND_BASED_MOVE_IDS.has(moveId)) {
      const throatMsg = `${attacker.name} bị chẹt họng nên không thể dùng chiêu thức âm thanh ${moveDisplayName}!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: throatMsg,
        events,
        actionPrevented: true,
      };
    }

    // 2. Status hindrance check (Sleep, Freeze, Paralysis)
    let statusPrefix = '';
    if (!bypassSleep && (!isSleepMove || attacker.status !== 'sleep')) {
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
          actionPrevented: true,
        };
      }
      statusPrefix = statusResult.statusPrefix;
    }

    // Deduct PP only when attacker is able to act and not on turn 2 of a charging move
    if (move.id !== 'struggle' && !attacker.chargingMove) {
      const isTargetingEnemy = defender && defender !== attacker;
      const hasPressure =
        isTargetingEnemy &&
        AbilityEngine.normalize(defender.ability) === 'pressure' &&
        defender.currentHp > 0;
      const ppCost = hasPressure ? 2 : 1;
      move.pp = Math.max(0, move.pp - ppCost);
      if (move.pp === 0) {
        const leppaEvents = HeldItemEngine.checkPpTriggeredBerry(attacker, attackerSide, move);
        if (leppaEvents.length > 0) {
          events.push(...leppaEvents);
        }
      }
    }

    // Sleep Talk handling (picks and executes another known move while asleep)
    if (moveId === 'sleep_talk') {
      const candidateMoves = attacker.moves.filter(
        (m) =>
          m.id.toLowerCase() !== 'sleep_talk' &&
          m.id.toLowerCase() !== 'snore' &&
          m.id.toLowerCase() !== 'rest' &&
          !TWO_TURN_MOVE_IDS.has(m.id.toLowerCase())
      );
      if (candidateMoves.length === 0) {
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: `${statusPrefix}${attacker.name} nói mớ nhưng không thể thi triển chiêu thức nào!`,
          events,
        };
      }
      const chosenMove = candidateMoves[this.rng.nextInt(0, candidateMoves.length - 1)];
      const chosenDisplayName = getMoveDisplayName(chosenMove);
      const subResult = this.executeAttack(attacker, defender, chosenMove, true);
      attacker.lastUsedMoveId = moveId;
      return {
        ...subResult,
        message: `${statusPrefix}${attacker.name} nói mớ và sử dụng ${chosenDisplayName}! ${subResult.message}`,
      };
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
      events,
      this.environment
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
        isCharging: true,
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

    // Metronome random move execution
    if (moveId === 'metronome') {
      const allMoveKeys = Object.keys(MOVES_DB).filter(
        (k) => k !== 'metronome' && k !== 'struggle'
      );
      if (allMoveKeys.length > 0) {
        const pickedKey = allMoveKeys[this.rng.nextInt(0, allMoveKeys.length - 1)];
        const pickedMove = MOVES_DB[pickedKey];
        if (pickedMove) {
          const metroIntro = `${statusPrefix}${attacker.name} vung Ngón Tay Ma Thuật! Chiêu thức được chọn là ${getMoveDisplayName(pickedMove)}!\n`;
          const subResult = this.executeAttack(attacker, defender, pickedMove, true);
          return {
            ...subResult,
            message: metroIntro + subResult.message,
          };
        }
      }
    }

    // Focus Punch lost focus check
    if (moveId === 'focus_punch' && attacker.damagedThisRound) {
      const failMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng bị mất tập trung do nhận sát thương và không thể tung đòn!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: failMsg,
        events,
        actionPrevented: true,
      };
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

    // Damp ability check for explosive moves
    if (moveId === 'explosion' || moveId === 'self_destruct') {
      const dampBattler =
        AbilityEngine.normalize(attacker.ability) === 'damp'
          ? attacker
          : AbilityEngine.normalize(defender.ability) === 'damp'
            ? defender
            : null;
      if (dampBattler) {
        const dampMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng [Ẩm Ướt] của ${dampBattler.name} ngăn chặn hoàn toàn vụ nổ!`;
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 0,
          isCritical: false,
          defenderFainted: false,
          message: dampMsg,
          events,
        };
      }
    }

    // Ability-based elemental type immunity checks (Levitate, Flash Fire, Water Absorb, Volt Absorb, Sap Sipper, Motor Drive, Lightning Rod)
    const isSelfTarget =
      move.category === 'status' &&
      (move.id === 'rest' ||
        move.id === 'belly_drum' ||
        (move.healPercent !== undefined && move.healPercent > 0) ||
        (move.statChanges !== undefined &&
          move.statChanges.length > 0 &&
          move.statChanges.every((sc) => sc.target === 'self')) ||
        (move.statusEffect !== undefined && move.statusEffect.target === 'self'));

    if (!isSelfTarget) {
      const itemImmunity = HeldItemEngine.checkTypeImmunity(defender, defenderSide, move, events);
      if (itemImmunity.isImmune) {
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 0,
          isCritical: false,
          defenderFainted: false,
          message: `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! ${itemImmunity.message}`,
          events,
        };
      }

      const abilityImmunity = AbilityEngine.checkTypeImmunity(
        attacker,
        defender,
        defenderSide,
        move,
        1.0,
        events
      );
      if (abilityImmunity.isImmune) {
        return {
          attackerName: attacker.name,
          moveName: moveDisplayName,
          damage: 0,
          typeEffectiveness: 0,
          isCritical: false,
          defenderFainted: false,
          message: `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! ${abilityImmunity.message}`,
          events,
        };
      }
    }

    // Psychic Terrain priority move block on grounded targets
    if (
      !isSelfTarget &&
      !canUsePriorityMoveInTerrain(this.environment.terrain?.type, move.priority, defender)
    ) {
      const terrainBlockedMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}! Nhưng Trường Tâm Linh bảo vệ ${defender.name} khỏi đòn ưu tiên!`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: terrainBlockedMsg,
        events,
      };
    }

    // 7. Accuracy / Evasion Check
    const hitsTarget = checkMoveAccuracy(attacker, defender, move, this.rng, this.environment);
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
      const SELF_OR_FIELD_STATUS_MOVES = new Set([
        'rest',
        'belly_drum',
        'safeguard',
        'aqua_ring',
        'ingrain',
        'protect',
        'detect',
        'splash',
        'haze',
        'clear_smog',
        'substitute',
        'endure',
        'destiny_bond',
        'light_screen',
        'reflect',
        'mist',
        'tailwind',
        'focus_energy',
        'stockpile',
        'swallow',
        'metronome',
        'teleport',
        'aromatherapy',
        'heal_bell',
        'sunny_day',
        'rain_dance',
        'sandstorm',
        'snowscape',
        'hail',
        'electric_terrain',
        'grassy_terrain',
        'misty_terrain',
        'psychic_terrain',
        'stealth_rock',
        'spikes',
        'toxic_spikes',
        'sticky_web',
        'mean_look',
        'block',
        'spider_web',
        'trick',
        'switcheroo',
        'recycle',
        'stuff_cheeks',
        'refresh',
        'baton_pass',
        'trick_room',
      ]);

      const isSelfTargetMove =
        SELF_OR_FIELD_STATUS_MOVES.has(moveId) ||
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
        events,
        this.environment
      );

      attacker.lastUsedMoveId = moveId;

      const mainMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}!${extraMsg || ' Đã tác động lên trận đấu!'}`;
      const statusRes: TurnResult = {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: mainMsg,
        events,
      };

      if (moveId === 'baton_pass') {
        statusRes.mustSwitch = true;
        statusRes.switchSide = attackerSide;
        statusRes.batonPassData = {
          statStages: {
            ...(attacker.statStages ?? {
              attack: 0,
              defense: 0,
              spAtk: 0,
              spDef: 0,
              speed: 0,
              accuracy: 0,
              evasion: 0,
            }),
          },
          confusionTurns: attacker.confusionTurns,
          hasAquaRing: attacker.hasAquaRing,
          isIngrained: attacker.isIngrained,
          isSeeded: attacker.isSeeded,
        };
      } else if (moveId === 'teleport') {
        statusRes.mustSwitch = true;
        statusRes.switchSide = attackerSide;
      } else if (moveId === 'roar' || moveId === 'whirlwind') {
        if (AbilityEngine.normalize(defender.ability) !== 'suctioncups' && !defender.isIngrained) {
          statusRes.battleEnded = true;
          statusRes.battleEndReason = 'roar';
        }
      }

      return statusRes;
    }

    // Pledge combination check
    if (moveId === 'grass_pledge' || moveId === 'fire_pledge' || moveId === 'water_pledge') {
      if (this.environment.lastPledgeMove && this.environment.lastPledgeMove !== moveId) {
        this.environment.pledgeCombo = true;
      } else {
        this.environment.lastPledgeMove = moveId;
      }
    }

    // 9. Damaging attack handling
    const dmgCalc = calculateDamage(
      attacker,
      defender,
      move,
      this.rng,
      this.environment,
      defenderSide
    );

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
      const failMsg = `${statusPrefix}${attacker.name} sử dụng ${moveDisplayName}!${dmgCalc.secMsg || ' Nhưng chiêu thức thất bại!'}`;
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

    // Apply damage and calculate actual damage dealt (with Substitute & Endure)
    let hitSubstitute = false;
    let damageDealtToSub = 0;
    let actualDamage: number;

    if ((defender.substituteHp ?? 0) > 0) {
      hitSubstitute = true;
      const prevSubHp = defender.substituteHp!;
      defender.substituteHp = Math.max(0, defender.substituteHp! - damage);
      damageDealtToSub = prevSubHp - defender.substituteHp;
      if (defender.substituteHp <= 0) {
        defender.substituteHp = 0;
        secMsg += ` Hình nhân thế thân của ${defender.name} đã bị phá hủy!`;
      } else {
        secMsg += ` Hình nhân thế thân nhận sát thương thay cho ${defender.name}!`;
      }
      actualDamage = 0;
    } else {
      const prevDefenderHp = defender.currentHp;
      let targetHp = defender.currentHp - damage;
      if (defender.isEndured && targetHp <= 0 && prevDefenderHp > 0) {
        targetHp = 1;
        secMsg += ` ${defender.name} kiên cường chịu đựng đòn đánh với 1 HP!`;
      }
      defender.currentHp = Math.max(0, targetHp);
      actualDamage = prevDefenderHp - defender.currentHp;
      if (actualDamage > 0) {
        defender.damagedThisRound = true;
      }
    }
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

    // Wake-Up Slap wakes sleeping defender on damage
    if (defender.status === 'sleep' && moveId === 'wake_up_slap' && actualDamage > 0) {
      clearStatusCondition(defender);
      secMsg += ` ${defender.name} đã tỉnh giấc!`;
      events.push(
        BattleEventFactory.statusCured(
          defenderSide,
          defender.name,
          'sleep',
          `${defender.name} đã tỉnh giấc!`
        )
      );
    }

    // Drain effect (blocked by Substitute)
    if (move.drainPercent && move.drainPercent > 0 && !hitSubstitute && actualDamage > 0) {
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
      if (AbilityEngine.isRecoilImmune(attacker, move)) {
        secMsg += ` ${attacker.name} nhờ [${AbilityEngine.getDisplayName(attacker.ability)}] không phải chịu phản lực!`;
      } else {
        const damageForRecoil = hitSubstitute ? damageDealtToSub : actualDamage;
        if (damageForRecoil > 0) {
          const recoil = Math.max(1, Math.floor(damageForRecoil * move.recoilPercent));
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
        }
      }
    } else if (moveId === 'explosion' || moveId === 'self_destruct') {
      attacker.currentHp = 0;
      attacker.isFainted = true;
      attackerFainted = true;
      secMsg += ` ${attacker.name} đã ngất xỉu!`;
    }

    // Contact abilities trigger on attacker
    if (actualDamage > 0 && !hitSubstitute) {
      const contactMsgs = AbilityEngine.onContact(
        attacker,
        attackerSide,
        defender,
        defenderSide,
        move,
        this.rng,
        events
      );
      if (contactMsgs.length > 0) {
        secMsg += ' ' + contactMsgs.join(' ');
      }
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        attackerFainted = true;
      }
    }

    // Defender fainted event
    if (defenderFainted) {
      releaseTrapsFromSide(defenderSide, attacker);
      events.push(
        BattleEventFactory.fainted(defenderSide, defender.name, `${defender.name} đã ngất xỉu!`)
      );

      // Moxie ability triggers when attacker knocks out defender
      if (!attackerFainted && AbilityEngine.normalize(attacker.ability) === 'moxie') {
        const boostStage = applyStatStageChange(attacker, 'attack', 1);
        const moxieMsg = `${attacker.name} kích hoạt [${AbilityEngine.getDisplayName(attacker.ability)}] và tăng Tấn công!`;
        secMsg += ' ' + moxieMsg;
        events.push(
          BattleEventFactory.abilityTriggered(
            attackerSide,
            attacker.name,
            attacker.ability || 'Moxie',
            'Tự Tin Chiến Thắng',
            'Tăng Attack khi hạ gục',
            moxieMsg
          )
        );
        events.push(
          BattleEventFactory.statStageChanged(
            attackerSide,
            attacker.name,
            'attack',
            1,
            boostStage,
            moxieMsg
          )
        );
      }
    }

    // Attacker fainted event
    if (attackerFainted) {
      releaseTrapsFromSide(attackerSide, defender);
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
    const hasShieldDust = AbilityEngine.normalize(defender.ability) === 'shielddust';
    if (!defenderFainted && !hasShieldDust && !hitSubstitute) {
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
          const statVi = STAT_NAME_VI[sc.stat] ?? sc.stat;

          if (sc.stages < 0 && target !== attacker) {
            const screens =
              tSide === 'player' ? this.environment.playerScreens : this.environment.enemyScreens;
            if (screens && (screens.mistTurns ?? 0) > 0) {
              secMsg += ` Nhưng Màn Sương Trắng bảo vệ ${target.name} khỏi bị giảm ${statVi}!`;
              continue;
            }

            if (AbilityEngine.isStatDropProtected(target, sc.stat, true)) {
              const protName = AbilityEngine.getDisplayName(target.ability);
              secMsg += ` Nhưng ${target.name} nhờ [${protName}] ngăn cản giảm ${statVi}!`;
              events.push(
                BattleEventFactory.abilityTriggered(
                  tSide,
                  target.name,
                  target.ability || 'Protected',
                  protName,
                  `Chặn giảm ${statVi}`,
                  `${target.name} nhờ [${protName}] ngăn cản giảm ${statVi}!`
                )
              );
              continue;
            }
          }

          const change = applyStatStageChange(target, sc.stat, sc.stages);
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

      // Secondary Confusion
      const confuseBaseChance = CONFUSION_MOVE_CHANCES[moveId];
      if (confuseBaseChance !== undefined) {
        const sereneMultiplier =
          AbilityEngine.normalize(attacker.ability) === 'serenegrace' ? 2 : 1;
        const confuseChance = Math.min(1.0, confuseBaseChance * sereneMultiplier);
        if (this.rng.next() < confuseChance) {
          if (AbilityEngine.normalize(defender.ability) === 'owntempo') {
            secMsg += ` Nhưng [Nhịp Điệu Riêng] của ${defender.name} ngăn chặn sự bối rối!`;
          } else if ((defender.confusionTurns ?? 0) <= 0) {
            defender.confusionTurns = this.rng.nextInt(2, 4);
            secMsg += ` ${defender.name} đã rơi vào trạng thái bối rối!`;
            events.push(
              BattleEventFactory.statusInflicted(
                defenderSide,
                defender.name,
                'confusion',
                `${defender.name} đã rơi vào trạng thái bối rối!`
              )
            );
          }
        }
      }

      // Secondary Flinch (only applies if attacker moved BEFORE defender in this round)
      const flinchBaseChance = FLINCH_MOVE_CHANCES[moveId];
      if (flinchBaseChance !== undefined) {
        const isFakeOut = moveId === 'fake_out';
        const canFakeOut = !isFakeOut || attacker.firstTurnInBattle !== false;
        const canFlinch = !defender.hasActedThisRound && canFakeOut;

        if (canFlinch) {
          const sereneMultiplier =
            AbilityEngine.normalize(attacker.ability) === 'serenegrace' ? 2 : 1;
          const flinchChance = Math.min(1.0, flinchBaseChance * sereneMultiplier);
          if (this.rng.next() < flinchChance) {
            if (AbilityEngine.normalize(defender.ability) === 'innerfocus') {
              secMsg += ` Nhưng [Tinh Thần Bất Khuất] của ${defender.name} ngăn cản sự nao núng!`;
            } else {
              defender.isFlinched = true;
              secMsg += ` ${defender.name} bị nao núng!`;
              events.push(
                BattleEventFactory.statusInflicted(
                  defenderSide,
                  defender.name,
                  'flinch',
                  `${defender.name} bị nao núng!`
                )
              );
            }
          }
        }
      }
    }

    // Post-damage special move effects (Stone Axe, Ceaseless Edge, Hazard Clearing, Trapping & Binding)
    const hitTarget = actualDamage > 0 || hitSubstitute;
    if (hitTarget) {
      if (moveId === 'stone_axe') {
        const oppHazards = getSideHazards(this.environment, defenderSide);
        if (!oppHazards.stealthRock) {
          oppHazards.stealthRock = true;
          secMsg += ` Những viên đá tàng hình trôi nổi bao vây phe của ${defender.name}!`;
        }
      } else if (moveId === 'ceaseless_edge') {
        const oppHazards = getSideHazards(this.environment, defenderSide);
        if ((oppHazards.spikes ?? 0) < 3) {
          oppHazards.spikes = (oppHazards.spikes ?? 0) + 1;
          secMsg += ` Gai nhọn đã được rải quanh phe của ${defender.name}! (${oppHazards.spikes}/3 lớp)`;
        }
      } else if (HAZARD_CLEARING_MOVE_IDS.has(moveId)) {
        clearSideHazards(this.environment, attackerSide);
        attacker.boundStatus = undefined;
        attacker.isSeeded = false;
        secMsg += ` ${attacker.name} đã thổi bay toàn bộ bẫy và trói buộc trên sân!`;
        if (moveId === 'mortal_spin' && !defenderFainted && !hitSubstitute) {
          const immunity = getStatusImmunity(defender, 'poison');
          if (defender.status === 'none' && !immunity) {
            setStatusCondition(defender, 'poison', 0);
            secMsg += ` ${defender.name} đã bị trúng độc!`;
            events.push(
              BattleEventFactory.statusInflicted(
                defenderSide,
                defender.name,
                'poison',
                `${defender.name} đã bị trúng độc!`
              )
            );
          }
        }
      }

      if (!defenderFainted && !hitSubstitute && !defender.types.includes('Ghost')) {
        if (TRAPPING_ATTACK_MOVE_IDS.has(moveId) && !defender.isTrapped) {
          defender.isTrapped = true;
          defender.trappedBy = attackerSide;
          secMsg += ` ${defender.name} đã bị khóa chặt, không thể đổi Pokémon!`;
        } else if (
          BINDING_MOVE_IDS.has(moveId) &&
          (!defender.boundStatus || defender.boundStatus.turnsLeft <= 0)
        ) {
          defender.boundStatus = {
            moveId,
            moveName: moveDisplayName,
            sourceSide: attackerSide,
            turnsLeft: this.rng.nextInt(4, 5),
          };
          secMsg += ` ${defender.name} đã bị giam giữ bởi ${moveDisplayName}!`;
        }
      }
    }

    // Spit Up resets stockpile count and stat boosts
    if (moveId === 'spit_up') {
      const count = attacker.stockpileCount ?? 0;
      if (count > 0) {
        applyStatStageChange(attacker, 'defense', -count);
        applyStatStageChange(attacker, 'spDef', -count);
        attacker.stockpileCount = 0;
        secMsg += ` Năng lượng tích trữ đã được giải phóng hoàn toàn!`;
      }
    }

    // Rampage moves (Outrage, Thrash, Petal Dance, Raging Fury) lock-in & fatigue confusion
    const RAMPAGE_MOVES = new Set(['outrage', 'thrash', 'petal_dance', 'raging_fury']);
    if (RAMPAGE_MOVES.has(moveId)) {
      if (!attacker.rampage) {
        attacker.rampage = { moveId, turnsLeft: this.rng.nextInt(2, 3) - 1 };
      } else {
        attacker.rampage.turnsLeft--;
        if (attacker.rampage.turnsLeft <= 0) {
          attacker.rampage = undefined;
          if (
            (attacker.confusionTurns ?? 0) <= 0 &&
            AbilityEngine.normalize(attacker.ability) !== 'owntempo'
          ) {
            attacker.confusionTurns = this.rng.nextInt(2, 4);
            secMsg += ` ${attacker.name} đã rơi vào trạng thái bối rối do mệt mỏi!`;
            events.push(
              BattleEventFactory.statusInflicted(
                attackerSide,
                attacker.name,
                'confusion',
                `${attacker.name} đã rơi vào trạng thái bối rối do mệt mỏi!`
              )
            );
          }
        }
      }
    }

    // Item interaction damaging moves (Knock Off, Fling, Poltergeist, Thief, Covet, Bug Bite, Pluck, Incinerate)
    if (actualDamage > 0) {
      if (moveId === 'knock_off') {
        if (defender.heldItem && AbilityEngine.normalize(defender.ability) !== 'stickyhold') {
          const itemDisplayName = getHeldItemDisplayName(defender.heldItem);
          defender.heldItem = null;
          secMsg += ` ${attacker.name} đã đánh rơi [${itemDisplayName}] của ${defender.name}!`;
        } else if (
          defender.heldItem &&
          AbilityEngine.normalize(defender.ability) === 'stickyhold'
        ) {
          secMsg += ` Nhưng ${defender.name} nhờ [Dính Chặt] giữ chặt vật phẩm của mình!`;
        }
      } else if (moveId === 'fling') {
        if (attacker.heldItem) {
          const flungItem = attacker.heldItem;
          const itemDisplayName = getHeldItemDisplayName(flungItem);
          attacker.lastConsumedItem = flungItem;
          attacker.heldItem = null;
          secMsg += ` ${attacker.name} đã ném mạnh [${itemDisplayName}] vào ${defender.name}!`;

          const flungKey = normalizeHeldItemKey(flungItem);
          if (
            flungKey === 'flame-orb' &&
            defender.status === 'none' &&
            !defender.types.includes('Fire')
          ) {
            setStatusCondition(defender, 'burn');
            secMsg += ` ${defender.name} đã bị bỏng!`;
            events.push(
              BattleEventFactory.statusInflicted(
                defenderSide,
                defender.name,
                'burn',
                `${defender.name} đã bị bỏng!`
              )
            );
          } else if (
            flungKey === 'toxic-orb' &&
            defender.status === 'none' &&
            !defender.types.includes('Poison') &&
            !defender.types.includes('Steel')
          ) {
            setStatusCondition(defender, 'toxic');
            secMsg += ` ${defender.name} đã bị nhiễm độc nặng!`;
            events.push(
              BattleEventFactory.statusInflicted(
                defenderSide,
                defender.name,
                'toxic',
                `${defender.name} đã bị nhiễm độc nặng!`
              )
            );
          } else if (flungKey === 'kings-rock' || flungKey === 'razor-fang') {
            if (!defender.hasActedThisRound) {
              defender.isFlinched = true;
              secMsg += ` ${defender.name} bị nao núng!`;
            }
          } else if (isBerryItem(flungItem) && !defenderFainted) {
            const bMsg = consumeBerry(defender, defenderSide, flungItem, events);
            secMsg += ` ${defender.name} nhận được quả Berry! ${bMsg}`;
          }
        }
      } else if (moveId === 'poltergeist') {
        if (defender.heldItem) {
          const itemDisplayName = getHeldItemDisplayName(defender.heldItem);
          secMsg += ` ${defender.name} bị tấn công bởi chính [${itemDisplayName}] của mình!`;
        }
      } else if (moveId === 'thief' || moveId === 'covet') {
        if (!attacker.heldItem && defender.heldItem) {
          if (AbilityEngine.normalize(defender.ability) === 'stickyhold') {
            secMsg += ` Nhưng ${defender.name} nhờ [Dính Chặt] ngăn cản bị cướp vật phẩm!`;
          } else {
            attacker.heldItem = defender.heldItem;
            const stolenName = getHeldItemDisplayName(defender.heldItem);
            defender.heldItem = null;
            secMsg += ` ${attacker.name} đã cướp lấy [${stolenName}] của ${defender.name}!`;
          }
        }
      } else if (moveId === 'bug_bite' || moveId === 'pluck') {
        if (isBerryItem(defender.heldItem)) {
          const berryKey = defender.heldItem!;
          const berryName = getHeldItemDisplayName(berryKey);
          defender.heldItem = null;
          const bMsg = consumeBerry(attacker, attackerSide, berryKey, events);
          secMsg += ` ${attacker.name} đã cướp lấy và ăn quả [${berryName}] của ${defender.name}! ${bMsg}`;
        }
      } else if (moveId === 'incinerate') {
        if (isBerryItem(defender.heldItem)) {
          const berryName = getHeldItemDisplayName(defender.heldItem);
          defender.heldItem = null;
          secMsg += ` Quả [${berryName}] của ${defender.name} đã bị thiêu rụi hoàn toàn!`;
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
        for (const ev of heldEffects) {
          if (ev.message) {
            secMsg += ` ${ev.message}`;
          }
        }
        if (attacker.currentHp <= 0) attackerFainted = true;
        if (defender.currentHp <= 0) defenderFainted = true;
      }
    }

    let mustSwitch = false;
    let switchSide: BattlerSide | undefined;

    if (actualDamage > 0) {
      if (moveId === 'throat_chop' && !defenderFainted) {
        defender.throatChopTurns = 2;
        secMsg += ` ${defender.name} bị chẹt họng, không thể sử dụng các chiêu thức âm thanh trong 2 lượt!`;
      } else if (moveId === 'uproar') {
        attacker.uproarTurns = 3;
        secMsg += ` ${attacker.name} làm loạn gây ồn ào náo loạn!`;
        if (attacker.status === 'sleep') {
          clearStatusCondition(attacker);
          events.push(
            BattleEventFactory.statusCured(
              attackerSide,
              attacker.name,
              'sleep',
              `${attacker.name} đã tỉnh giấc!`
            )
          );
        }
        if (defender.status === 'sleep') {
          clearStatusCondition(defender);
          secMsg += ` Tiếng náo loạn đã đánh thức ${defender.name}!`;
          events.push(
            BattleEventFactory.statusCured(
              defenderSide,
              defender.name,
              'sleep',
              `${defender.name} đã tỉnh giấc!`
            )
          );
        }
      } else if ((moveId === 'u_turn' || moveId === 'volt_switch') && !attackerFainted) {
        mustSwitch = true;
        switchSide = attackerSide;
        secMsg += ` ${attacker.name} quay về đội sau đòn đánh!`;
      }
    }

    attacker.lastUsedMoveId = moveId;

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
      mustSwitch,
      switchSide,
    };
  }

  public getFirstAttacker(playerMove: BattleMove, enemyMove: BattleMove): 'player' | 'enemy' {
    return determineTurnOrder(
      this.playerPokemon,
      playerMove,
      this.enemyPokemon,
      enemyMove,
      this.rng,
      this.environment
    );
  }

  public getForcedMove(battler: BattlerPokemon): BattleMove | null {
    if (battler.chargingMove) {
      return battler.chargingMove.move;
    }
    if (battler.rampage && battler.rampage.turnsLeft > 0) {
      const rampageMove = battler.moves.find(
        (m) => m.id.toLowerCase() === battler.rampage!.moveId.toLowerCase()
      );
      if (rampageMove) return rampageMove;
    }
    if (battler.encore && battler.encore.turnsLeft > 0) {
      const encoreMove = battler.moves.find(
        (m) => m.id.toLowerCase() === battler.encore!.moveId.toLowerCase() && m.pp > 0
      );
      if (encoreMove) return encoreMove;
    }
    return null;
  }

  public getEnemyAction(): BattleMove {
    const forcedMove = this.getForcedMove(this.enemyPokemon);
    if (forcedMove) {
      return forcedMove;
    }
    let validMoves = this.enemyPokemon.moves.filter((m) => m.pp > 0);
    // Disable filter
    if (this.enemyPokemon.disabledMove && this.enemyPokemon.disabledMove.turnsLeft > 0) {
      validMoves = validMoves.filter(
        (m) => m.id.toLowerCase() !== this.enemyPokemon.disabledMove!.moveId.toLowerCase()
      );
    }
    // Torment filter
    if (this.enemyPokemon.isTormented && this.enemyPokemon.lastUsedMoveId) {
      validMoves = validMoves.filter(
        (m) => m.id.toLowerCase() !== this.enemyPokemon.lastUsedMoveId!.toLowerCase()
      );
    }
    // Taunt filter
    if ((this.enemyPokemon.tauntTurns ?? 0) > 0) {
      validMoves = validMoves.filter((m) => m.category !== 'status');
    }
    // Throat chop filter
    if ((this.enemyPokemon.throatChopTurns ?? 0) > 0) {
      validMoves = validMoves.filter((m) => !SOUND_BASED_MOVE_IDS.has(m.id.toLowerCase()));
    }

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
    const switchCheck = canSwitchOut(this.playerPokemon);
    if (!switchCheck.canSwitch) return false;

    const pSpeed = this.playerPokemon.stats.speed;
    const eSpeed = this.enemyPokemon.stats.speed;
    if (pSpeed >= eSpeed) return true;

    this.fleeAttempts++;
    const odds = Math.floor((pSpeed * 128) / eSpeed + 30 * this.fleeAttempts) % 256;
    return odds >= 255 || this.rng.nextInt(0, 255) < odds;
  }

  public tickEnvironmentRound(): string[] {
    const messages: string[] = [];
    if (this.environment.weather && this.environment.weather.type !== 'none') {
      this.environment.weather.turnsLeft--;
      if (this.environment.weather.turnsLeft <= 0) {
        const wType = this.environment.weather.type;
        this.environment.weather = { type: 'none', turnsLeft: 0 };
        if (wType === 'sun') messages.push('Ánh nắng gay gắt đã dịu đi!');
        else if (wType === 'rain') messages.push('Cơn mưa rào lớn đã tạnh!');
        else if (wType === 'sandstorm') messages.push('Cơn bão cát đã tan biến!');
        else if (wType === 'hail') messages.push('Cơn mưa tuyết đã chấm dứt!');
      }
    }

    if (this.environment.terrain && this.environment.terrain.type !== 'none') {
      this.environment.terrain.turnsLeft--;
      if (this.environment.terrain.turnsLeft <= 0) {
        const tType = this.environment.terrain.type;
        this.environment.terrain = { type: 'none', turnsLeft: 0 };
        if (tType === 'electric') messages.push('Dòng điện trên mặt đất đã biến mất!');
        else if (tType === 'grassy') messages.push('Thảm cỏ xanh trên mặt đất đã biến mất!');
        else if (tType === 'misty') messages.push('Màn sương mù trên mặt đất đã tan biến!');
        else if (tType === 'psychic')
          messages.push('Năng lượng tâm linh trên mặt đất đã biến mất!');
      }
    }

    if (this.environment.trickRoomTurns && this.environment.trickRoomTurns > 0) {
      this.environment.trickRoomTurns--;
      if (this.environment.trickRoomTurns <= 0) {
        messages.push('Không gian bị bóp méo đã trở lại bình thường!');
      }
    }

    const tickScreens = (screens?: BattleSideScreens, isPlayer?: boolean) => {
      if (!screens) return;
      const targetLabel = isPlayer ? 'của bạn' : 'của đối thủ';
      if (screens.reflectTurns && screens.reflectTurns > 0) {
        screens.reflectTurns--;
        if (screens.reflectTurns <= 0) {
          messages.push(`Bức tường Phản Chiếu ${targetLabel} đã tan biến!`);
        }
      }
      if (screens.lightScreenTurns && screens.lightScreenTurns > 0) {
        screens.lightScreenTurns--;
        if (screens.lightScreenTurns <= 0) {
          messages.push(`Bức tường Màn Ánh Sáng ${targetLabel} đã tan biến!`);
        }
      }
      if (screens.mistTurns && screens.mistTurns > 0) {
        screens.mistTurns--;
        if (screens.mistTurns <= 0) {
          messages.push(`Màn Sương Trắng ${targetLabel} đã tan biến!`);
        }
      }
      if (screens.tailwindTurns && screens.tailwindTurns > 0) {
        screens.tailwindTurns--;
        if (screens.tailwindTurns <= 0) {
          messages.push(`Luồng Gió Thuận ${targetLabel} đã ngừng thổi!`);
        }
      }
    };
    tickScreens(this.environment.playerScreens, true);
    tickScreens(this.environment.enemyScreens, false);

    return messages;
  }

  public resetRound(): string[] {
    this.playerPokemon.isProtected = false;
    this.enemyPokemon.isProtected = false;
    resetRoundCombatFlags(this.playerPokemon, this.enemyPokemon);
    this.environment.pledgeCombo = false;
    this.environment.lastPledgeMove = undefined;
    return this.tickEnvironmentRound();
  }
}
