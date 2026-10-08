import type { BattlerPokemon, BattlerSide, BattleEvent, BattleMove } from '../types';
import type { BattleRng } from '../battle-rng';
import { BattleEventFactory } from '../state/battle-event-factory';
import {
  applyStatStageChange,
  resetStatStages,
  restoreHp,
  setStatusCondition,
  getAccuracyMultiplier,
  STAT_NAME_VI,
  STATUS_NAME_VI,
} from '../state/battle-state-reducer';
import { getStatusImmunity } from './status-engine';

export const NEVER_MISS_MOVE_IDS = new Set([
  'swift',
  'aerial_ace',
  'faint_attack',
  'shadow_punch',
  'shock_wave',
  'magical_leaf',
  'aura_sphere',
  'magnet_bomb',
  'clear_smog',
  'disarming_voice',
  'vital_throw',
  'struggle',
]);

export const RECHARGE_MOVE_IDS = new Set([
  'hyper_beam',
  'giga_impact',
  'frenzy_plant',
  'blast_burn',
  'hydro_cannon',
  'roar_of_time',
  'rock_wrecker',
]);

export const PROTECT_MOVE_IDS = new Set([
  'protect',
  'detect',
  'spiky_shield',
  'baneful_bunker',
  'kings_shield',
]);

export const TWO_TURN_MOVE_IDS = new Set([
  'solar_beam',
  'solarbeam',
  'skull_bash',
  'fly',
  'dig',
  'dive',
  'bounce',
  'sky_attack',
  'razor_wind',
  'shadow_force',
  'phantom_force',
  'geomancy',
]);

export const STRUGGLE_MOVE: BattleMove = {
  id: 'struggle',
  name: 'Struggle (Vùng Vẫy)',
  nameVi: 'Vùng Vẫy',
  nameEn: 'Struggle',
  type: 'Normal',
  category: 'physical',
  power: 50,
  accuracy: 0,
  pp: 1,
  maxPp: 1,
  description: 'Vùng vẫy khi hết chiêu thức, gây sát thương và chịu phản đòn 25% máu tối đa.',
};

/**
 * Checks whether an attack hits or misses based on accuracy and evasion stages.
 */
export function checkMoveAccuracy(
  attacker: BattlerPokemon,
  defender: BattlerPokemon,
  move: BattleMove,
  rng: BattleRng
): boolean {
  const isSelfTargetMove =
    move.category === 'status' &&
    (move.id === 'rest' ||
      move.id === 'belly_drum' ||
      (move.healPercent !== undefined && move.healPercent > 0) ||
      (move.statChanges !== undefined &&
        move.statChanges.length > 0 &&
        move.statChanges.every((sc) => sc.target === 'self')) ||
      (move.statusEffect !== undefined && move.statusEffect.target === 'self'));

  const isNeverMiss =
    isSelfTargetMove ||
    NEVER_MISS_MOVE_IDS.has(move.id) ||
    move.accuracy <= 0 ||
    move.id === 'struggle';

  const accStage = attacker.statStages?.accuracy ?? 0;
  const evaStage = defender.statStages?.evasion ?? 0;
  const requiresAccCheck =
    !isNeverMiss && (move.accuracy < 100 || accStage !== 0 || evaStage !== 0);

  if (!requiresAccCheck) return true;

  const accMult = getAccuracyMultiplier(accStage, evaStage);
  const effectiveAcc = move.accuracy * accMult;
  return rng.next() * 100 <= effectiveAcc;
}

/**
 * Handles charging / semi-invulnerable stance on turn 1 of two-turn moves.
 * Returns true if charging started (turn ends immediately), false if releasing attack.
 */
export function handleTwoTurnMoveCharge(
  attacker: BattlerPokemon,
  attackerSide: BattlerSide,
  move: BattleMove,
  moveDisplayName: string,
  events: BattleEvent[]
): { isCharging: boolean; chargeMessage?: string } {
  const moveId = move.id.toLowerCase();
  if (!TWO_TURN_MOVE_IDS.has(moveId)) {
    return { isCharging: false };
  }

  if (!attacker.chargingMove) {
    let chargeMsg = '';
    let stance: 'flying' | 'underground' | 'underwater' | 'high' | undefined = undefined;

    if (moveId === 'solar_beam' || moveId === 'solarbeam') {
      attacker.chargingMove = { move, turn: 1 };
      chargeMsg = `${attacker.name} đang hấp thụ ánh sáng mặt trời!`;
    } else if (moveId === 'skull_bash') {
      attacker.chargingMove = { move, turn: 1 };
      const change = applyStatStageChange(attacker, 'defense', 1);
      chargeMsg = `${attacker.name} thu đầu vào! Phòng thủ của ${attacker.name} tăng lên!`;
      events.push(
        BattleEventFactory.statStageChanged(
          attackerSide,
          attacker.name,
          'defense',
          change,
          attacker.statStages!.defense,
          `Phòng thủ của ${attacker.name} tăng lên!`
        )
      );
    } else if (moveId === 'fly') {
      stance = 'flying';
      attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'flying' };
      attacker.semiInvulnerable = 'flying';
      chargeMsg = `${attacker.name} bay vút lên không trung!`;
    } else if (moveId === 'dig') {
      stance = 'underground';
      attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'underground' };
      attacker.semiInvulnerable = 'underground';
      chargeMsg = `${attacker.name} đào sâu vào lòng đất!`;
    } else if (moveId === 'dive') {
      stance = 'underwater';
      attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'underwater' };
      attacker.semiInvulnerable = 'underwater';
      chargeMsg = `${attacker.name} lặn sâu vào lòng nước!`;
    } else if (moveId === 'bounce') {
      stance = 'high';
      attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'high' };
      attacker.semiInvulnerable = 'high';
      chargeMsg = `${attacker.name} bật nhảy lên rất cao!`;
    } else if (moveId === 'sky_attack') {
      attacker.chargingMove = { move, turn: 1 };
      chargeMsg = `${attacker.name} phát ra ánh sáng chói lọi!`;
    } else if (moveId === 'razor_wind') {
      attacker.chargingMove = { move, turn: 1 };
      chargeMsg = `${attacker.name} tạo ra một cơn cuồng phong!`;
    } else if (moveId === 'shadow_force' || moveId === 'phantom_force') {
      stance = 'flying';
      attacker.chargingMove = { move, turn: 1, semiInvulnerable: 'flying' };
      attacker.semiInvulnerable = 'flying';
      chargeMsg = `${attacker.name} biến mất vào bóng tối!`;
    } else if (moveId === 'geomancy') {
      attacker.chargingMove = { move, turn: 1 };
      chargeMsg = `${attacker.name} hấp thụ năng lượng trời đất!`;
    }

    events.push(
      BattleEventFactory.chargeBegin(
        attackerSide,
        attacker.name,
        move.id,
        moveDisplayName,
        chargeMsg
      )
    );

    if (stance) {
      events.push(
        BattleEventFactory.semiInvulnerableEnter(attackerSide, attacker.name, stance, chargeMsg)
      );
    }

    return { isCharging: true, chargeMessage: chargeMsg };
  } else {
    // Turn 2: Release
    attacker.chargingMove = undefined;
    attacker.semiInvulnerable = undefined;
    return { isCharging: false };
  }
}

/**
 * Checks if an attack can hit a semi-invulnerable defender.
 */
export function checkSemiInvulnerableHit(
  defender: BattlerPokemon,
  moveId: string
): { canHit: boolean; missMessage?: string } {
  if (!defender.semiInvulnerable) return { canHit: true };

  const stance = defender.semiInvulnerable;
  if (stance === 'flying' || stance === 'high') {
    const canHitFlying = [
      'gust',
      'thunder',
      'twister',
      'sky_uppercut',
      'hurricane',
      'smack_down',
    ].includes(moveId);
    if (!canHitFlying) {
      return { canHit: false, missMessage: `${defender.name} đang ở ngoài tầm đánh!` };
    }
  } else if (stance === 'underground') {
    const canHitUnderground = ['earthquake', 'magnitude', 'fissure'].includes(moveId);
    if (!canHitUnderground) {
      return { canHit: false, missMessage: `${defender.name} đang ở sâu dưới lòng đất!` };
    }
  } else if (stance === 'underwater') {
    const canHitUnderwater = ['surf', 'whirlpool'].includes(moveId);
    if (!canHitUnderwater) {
      return { canHit: false, missMessage: `${defender.name} đang ở sâu dưới nước!` };
    }
  }

  return { canHit: true };
}

/**
 * Applies effects of a non-damaging Status category move.
 */
export function applyStatusCategoryMove(
  attacker: BattlerPokemon,
  defender: BattlerPokemon,
  attackerSide: BattlerSide,
  defenderSide: BattlerSide,
  move: BattleMove,
  rng: BattleRng,
  events: BattleEvent[]
): { extraMsg: string; failed?: boolean } {
  const moveId = move.id.toLowerCase();
  let extraMsg = '';

  if (moveId === 'belly_drum') {
    const cost = Math.floor(attacker.maxHp / 2);
    if (attacker.currentHp > cost) {
      attacker.currentHp -= cost;
      attacker.statStages!.attack = 6;
      extraMsg += ` ${attacker.name} hi sinh HP và tối đa hóa Tấn công!`;
      events.push(
        BattleEventFactory.statStageChanged(
          attackerSide,
          attacker.name,
          'attack',
          6,
          6,
          `${attacker.name} tối đa hóa Tấn công!`
        )
      );
    } else {
      extraMsg += ` Nhưng chiêu thức thất bại! HP không đủ!`;
    }
  } else if (moveId === 'pain_split') {
    const avg = Math.max(1, Math.floor((attacker.currentHp + defender.currentHp) / 2));
    attacker.currentHp = Math.min(attacker.maxHp, avg);
    defender.currentHp = Math.min(defender.maxHp, avg);
    extraMsg += ` ${attacker.name} chia sẻ sinh lực với ${defender.name}!`;
    events.push(
      BattleEventFactory.hpRestored(
        attackerSide,
        attacker.name,
        avg,
        attacker.currentHp,
        attacker.maxHp,
        'move',
        `${attacker.name} chia sẻ sinh lực với ${defender.name}!`
      )
    );
  } else if (moveId === 'destiny_bond') {
    attacker.destinyBond = true;
    extraMsg += ` ${attacker.name} chuẩn bị đưa đối thủ đi cùng nếu ngất xỉu!`;
  } else if (moveId === 'haze' || moveId === 'clear_smog') {
    resetStatStages(attacker);
    resetStatStages(defender);
    extraMsg += ` Toàn bộ thay đổi chỉ số đã bị xóa bỏ!`;
  } else if (moveId === 'splash') {
    extraMsg += ` Nhưng không có gì xảy ra cả!`;
  } else if (moveId === 'leech_seed') {
    if (!defender.types.includes('Grass') && !defender.isSeeded) {
      defender.isSeeded = true;
      extraMsg += ` ${defender.name} đã bị gieo mầm hạt giống ký sinh!`;
    } else {
      extraMsg += ` Nhưng chiêu thức thất bại!`;
    }
  } else if (moveId === 'rest') {
    if (attacker.currentHp >= attacker.maxHp) {
      extraMsg += ` Nhưng thất bại! HP của ${attacker.name} đã đầy!`;
    } else {
      setStatusCondition(attacker, 'sleep', 2);
      attacker.currentHp = attacker.maxHp;
      extraMsg += ` ${attacker.name} chìm vào giấc ngủ và hồi phục hoàn toàn!`;
      events.push(
        BattleEventFactory.statusInflicted(
          attackerSide,
          attacker.name,
          'sleep',
          `${attacker.name} chìm vào giấc ngủ!`
        )
      );
      events.push(
        BattleEventFactory.hpRestored(
          attackerSide,
          attacker.name,
          attacker.maxHp,
          attacker.maxHp,
          attacker.maxHp,
          'move',
          `${attacker.name} hồi phục hoàn toàn HP!`
        )
      );
    }
  } else if (move.healPercent && move.healPercent > 0) {
    if (attacker.currentHp >= attacker.maxHp) {
      extraMsg += ` Nhưng thất bại! HP của ${attacker.name} đã đầy!`;
    } else {
      const heal = Math.max(1, Math.floor(attacker.maxHp * move.healPercent));
      const actualHealed = restoreHp(attacker, heal);
      extraMsg += ` ${attacker.name} đã hồi phục HP!`;
      events.push(
        BattleEventFactory.hpRestored(
          attackerSide,
          attacker.name,
          actualHealed,
          attacker.currentHp,
          attacker.maxHp,
          'move',
          `${attacker.name} đã hồi phục HP!`
        )
      );
    }
  }

  // Stat changes
  if (move.statChanges && move.statChanges.length > 0) {
    for (const sc of move.statChanges) {
      const chance = Math.max(0, Math.min(1, sc.chance ?? 1));
      if (rng.next() >= chance) continue;
      const target = sc.target === 'self' ? attacker : defender;
      const tSide: BattlerSide = target === attacker ? attackerSide : defenderSide;
      const change = applyStatStageChange(target, sc.stat, sc.stages);
      const statVi = STAT_NAME_VI[sc.stat] ?? sc.stat;

      if (change > 1) extraMsg += ` Chỉ số ${statVi} của ${target.name} tăng mạnh!`;
      else if (change === 1) extraMsg += ` Chỉ số ${statVi} của ${target.name} tăng lên!`;
      else if (change === -1) extraMsg += ` Chỉ số ${statVi} của ${target.name} giảm xuống!`;
      else if (change < -1) extraMsg += ` Chỉ số ${statVi} của ${target.name} giảm mạnh!`;
      else
        extraMsg += ` Chỉ số ${statVi} của ${target.name} không thể ${sc.stages > 0 ? 'tăng thêm' : 'giảm thêm'} nữa!`;

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

  // Status effect
  if (move.statusEffect && move.id !== 'rest') {
    const target = move.statusEffect.target === 'self' ? attacker : defender;
    const tSide: BattlerSide = target === attacker ? attackerSide : defenderSide;
    const chance = Math.max(0, Math.min(1, move.statusEffect.chance));
    const immunityMessage = getStatusImmunity(target, move.statusEffect.condition);
    const conditionVi = STATUS_NAME_VI[move.statusEffect.condition] ?? move.statusEffect.condition;

    if (target.status === 'none' && !immunityMessage && rng.next() < chance) {
      const initialSleepTurns = move.statusEffect.condition === 'sleep' ? rng.nextInt(1, 3) : 0;
      setStatusCondition(target, move.statusEffect.condition, initialSleepTurns);
      extraMsg += ` ${target.name} đã bị ${conditionVi}!`;
      events.push(
        BattleEventFactory.statusInflicted(
          tSide,
          target.name,
          move.statusEffect.condition,
          `${target.name} đã bị ${conditionVi}!`
        )
      );
    } else if (target.status !== 'none' && move.statusEffect.target !== 'self') {
      extraMsg += ` Nhưng thất bại! ${target.name} đã mắc trạng thái bất thường rồi!`;
    } else if (target.status === 'none' && immunityMessage) {
      extraMsg += ` ${immunityMessage}`;
    }
  }

  return { extraMsg };
}
