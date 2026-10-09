import type {
  BattlerPokemon,
  BattlerSide,
  BattleEvent,
  BattleMove,
  BattleEnvironment,
} from '../types';
import type { BattleRng } from '../battle-rng';
import { BattleEventFactory } from '../state/battle-event-factory';
import {
  applyStatStageChange,
  resetStatStages,
  restoreHp,
  setStatusCondition,
  clearStatusCondition,
  getAccuracyMultiplier,
  STAT_NAME_VI,
  STATUS_NAME_VI,
} from '../state/battle-state-reducer';
import { getStatusImmunity } from './status-engine';
import { AbilityEngine } from './ability-engine';
import { getWeatherAccuracyOverride } from './environment';
import { getSideHazards } from './hazard-engine';
import { consumeBerry, isBerryItem, getHeldItemDisplayName } from './held-item-engine';

export const SOUND_BASED_MOVE_IDS = new Set([
  'growl',
  'roar',
  'sing',
  'supersonic',
  'screech',
  'snore',
  'uproar',
  'metal_sound',
  'grass_whistle',
  'hyper_voice',
  'relic_song',
  'round',
  'echoed_voice',
  'snarl',
  'disarming_voice',
  'boomburst',
  'clanging_scales',
  'clangorous_soul',
  'overdrive',
  'heal_bell',
  'bug_buzz',
  'chatter',
  'sparkling_aria',
]);

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

/** Move IDs that can cause target to flinch, with base chances */
export const FLINCH_MOVE_CHANCES: Record<string, number> = {
  fake_out: 1.0,
  air_slash: 0.3,
  astonish: 0.3,
  bite: 0.3,
  bone_club: 0.3,
  dark_pulse: 0.2,
  double_iron_bash: 0.3,
  dragon_rush: 0.2,
  extrasensory: 0.3,
  fiery_wrath: 0.3,
  fire_fang: 0.1,
  floaty_fall: 0.3,
  headbutt: 0.3,
  heart_stamp: 0.3,
  hyper_fang: 0.1,
  ice_fang: 0.1,
  icicle_crash: 0.3,
  iron_head: 0.3,
  needle_arm: 0.3,
  rock_slide: 0.3,
  rolling_kick: 0.3,
  sky_attack: 0.3,
  snore: 0.3,
  steamroller: 0.3,
  stomp: 0.3,
  thunder_fang: 0.1,
  twister: 0.2,
  waterfall: 0.2,
  zen_headbutt: 0.2,
  zing_zap: 0.3,
};

/** Move IDs that can cause target to become confused, with base chances */
export const CONFUSION_MOVE_CHANCES: Record<string, number> = {
  confuse_ray: 1.0,
  sweet_kiss: 1.0,
  supersonic: 1.0,
  teeter_dance: 1.0,
  swagger: 1.0,
  flatter: 1.0,
  dynamic_punch: 1.0,
  chatter: 1.0,
  hurricane: 0.3,
  axe_kick: 0.3,
  water_pulse: 0.2,
  rock_climb: 0.2,
  dizzy_punch: 0.2,
  strange_steam: 0.2,
  magical_torque: 0.2,
  confusion: 0.1,
  psybeam: 0.1,
  signal_beam: 0.1,
};

export const CONFUSION_STATUS_MOVE_IDS = new Set([
  'confuse_ray',
  'sweet_kiss',
  'supersonic',
  'teeter_dance',
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
 * Checks whether an attack hits or misses based on accuracy, evasion stages, and weather.
 */
export function checkMoveAccuracy(
  attacker: BattlerPokemon,
  defender: BattlerPokemon,
  move: BattleMove,
  rng: BattleRng,
  environment?: BattleEnvironment
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

  const weatherOverride = getWeatherAccuracyOverride(environment?.weather?.type, move.id);
  if (weatherOverride?.isNeverMiss) return true;

  const baseAcc = weatherOverride?.fixedAccuracy ?? move.accuracy;

  const isNeverMiss =
    isSelfTargetMove || NEVER_MISS_MOVE_IDS.has(move.id) || baseAcc <= 0 || move.id === 'struggle';

  const accStage = attacker.statStages?.accuracy ?? 0;
  const evaStage = defender.statStages?.evasion ?? 0;

  // Ability accuracy and evasion modifiers
  let abilityAccMult = 1.0;
  const attackerAbility = AbilityEngine.normalize(attacker.ability);
  const defenderAbility = AbilityEngine.normalize(defender.ability);

  if (attackerAbility === 'compoundeyes') {
    abilityAccMult *= 1.3;
  }
  if (defenderAbility === 'sandveil' && environment?.weather?.type === 'sandstorm') {
    abilityAccMult *= 0.8;
  }
  if (defenderAbility === 'snowcloak' && environment?.weather?.type === 'hail') {
    abilityAccMult *= 0.8;
  }

  const requiresAccCheck =
    !isNeverMiss && (baseAcc < 100 || accStage !== 0 || evaStage !== 0 || abilityAccMult !== 1.0);

  if (!requiresAccCheck) return true;

  const accMult = getAccuracyMultiplier(accStage, evaStage) * abilityAccMult;
  const effectiveAcc = baseAcc * accMult;
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
  events: BattleEvent[],
  environment?: BattleEnvironment
): { isCharging: boolean; chargeMessage?: string } {
  const moveId = move.id.toLowerCase();
  if (!TWO_TURN_MOVE_IDS.has(moveId)) {
    return { isCharging: false };
  }

  if (!attacker.chargingMove) {
    let chargeMsg = '';
    let stance: 'flying' | 'underground' | 'underwater' | 'high' | undefined = undefined;

    if (moveId === 'solar_beam' || moveId === 'solarbeam') {
      // In sun, Solar Beam fires in a single turn without charging
      if (environment?.weather?.type === 'sun') {
        return { isCharging: false };
      }
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
  events: BattleEvent[],
  environment?: BattleEnvironment
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
  } else if (moveId === 'aqua_ring') {
    if (attacker.hasAquaRing) {
      extraMsg += ` Nhưng ${attacker.name} đã được bao bọc bởi Vòng Nước rồi!`;
    } else {
      attacker.hasAquaRing = true;
      extraMsg += ` ${attacker.name} đã bao bọc bản thân trong một vòng nước!`;
    }
  } else if (moveId === 'ingrain') {
    if (attacker.isIngrained) {
      extraMsg += ` Nhưng ${attacker.name} đã cắm rễ sâu rồi!`;
    } else {
      attacker.isIngrained = true;
      extraMsg += ` ${attacker.name} đã cắm rễ vào lòng đất!`;
    }
  } else if (moveId === 'safeguard') {
    if ((attacker.safeguardTurns ?? 0) > 0) {
      extraMsg += ` Nhưng phe của ${attacker.name} đã được Màn Hộ Thể bảo vệ rồi!`;
    } else {
      attacker.safeguardTurns = 5;
      extraMsg += ` Màn Hộ Thể huyền bí bao bọc phe của ${attacker.name}!`;
    }
  } else if (moveId === 'heal_bell' || moveId === 'aromatherapy') {
    const isBell = moveId === 'heal_bell';
    const soundMsg = isBell ? 'Tiếng chuông thanh khiết' : 'Hương thơm thảo mộc';
    const prevStatus = attacker.status;
    if (prevStatus && prevStatus !== 'none') {
      clearStatusCondition(attacker);
      events.push(
        BattleEventFactory.statusCured(
          attackerSide,
          attacker.name,
          prevStatus,
          `${soundMsg} đã chữa lành trạng thái bất lợi cho ${attacker.name}!`
        )
      );
    }
    extraMsg += ` ${soundMsg} đã lan tỏa, chữa lành trạng thái bất lợi cho toàn đội!`;
  } else if (moveId === 'refresh') {
    if (
      attacker.status === 'paralysis' ||
      attacker.status === 'poison' ||
      attacker.status === 'toxic' ||
      attacker.status === 'burn'
    ) {
      const prevStatus = attacker.status;
      clearStatusCondition(attacker);
      events.push(
        BattleEventFactory.statusCured(
          attackerSide,
          attacker.name,
          prevStatus,
          `${attacker.name} đã được làm mới và giải trừ trạng thái!`
        )
      );
      extraMsg += ` ${attacker.name} đã được làm mới và giải trừ trạng thái!`;
    } else {
      extraMsg += ` Nhưng chiêu thức thất bại!`;
    }
  } else if (moveId === 'taunt') {
    if ((defender.tauntTurns ?? 0) > 0) {
      extraMsg += ` Nhưng ${defender.name} đã bị khiêu khích rồi!`;
    } else if (AbilityEngine.normalize(defender.ability) === 'oblivious') {
      extraMsg += ` Nhưng [Ngây Thơ] của ${defender.name} ngăn chặn sự khiêu khích!`;
    } else {
      defender.tauntTurns = 3;
      extraMsg += ` ${defender.name} đã bị khiêu khích và không thể dùng chiêu thức bổ trợ trong 3 lượt!`;
    }
  } else if (moveId === 'torment') {
    if (defender.isTormented) {
      extraMsg += ` Nhưng ${defender.name} đã bị dằn vặt rồi!`;
    } else {
      defender.isTormented = true;
      extraMsg += ` ${defender.name} đã bị dằn vặt, không thể sử dụng cùng một chiêu thức liên tiếp!`;
    }
  } else if (moveId === 'disable') {
    if (!defender.lastUsedMoveId) {
      extraMsg += ` Nhưng thất bại! ${defender.name} chưa sử dụng chiêu thức nào!`;
    } else if (defender.disabledMove && defender.disabledMove.turnsLeft > 0) {
      extraMsg += ` Nhưng một chiêu thức của ${defender.name} đã bị vô hiệu hóa rồi!`;
    } else {
      defender.disabledMove = {
        moveId: defender.lastUsedMoveId,
        turnsLeft: 4,
      };
      extraMsg += ` Chiêu thức [${defender.lastUsedMoveId}] của ${defender.name} đã bị vô hiệu hóa trong 4 lượt!`;
    }
  } else if (moveId === 'encore') {
    if (!defender.lastUsedMoveId) {
      extraMsg += ` Nhưng thất bại! ${defender.name} chưa sử dụng chiêu thức nào!`;
    } else if (defender.encore && defender.encore.turnsLeft > 0) {
      extraMsg += ` Nhưng ${defender.name} đã nhận lời tán dương rồi!`;
    } else {
      defender.encore = {
        moveId: defender.lastUsedMoveId,
        turnsLeft: 3,
      };
      extraMsg += ` ${defender.name} nhận được lời tán dương và phải lặp lại [${defender.lastUsedMoveId}] trong 3 lượt!`;
    }
  } else if (moveId === 'baton_pass') {
    extraMsg += ` ${attacker.name} chuẩn bị truyền lại sức mạnh và chuyển lượt cho đồng đội!`;
  } else if (moveId === 'roar' || moveId === 'whirlwind') {
    if (AbilityEngine.normalize(defender.ability) === 'suctioncups' || defender.isIngrained) {
      extraMsg += ` Nhưng ${defender.name} bám chặt vào mặt đất nên không bị thổi bay!`;
    } else {
      const verb = moveId === 'roar' ? 'gầm vang xua đuổi' : 'thổi bay';
      extraMsg += ` ${attacker.name} ${verb} ${defender.name} khỏi trận đấu!`;
    }
  } else if (moveId === 'sunny_day') {
    if (environment) environment.weather = { type: 'sun', turnsLeft: 5 };
    extraMsg += ' Ánh nắng mặt trời trở nên gay gắt!';
  } else if (moveId === 'rain_dance') {
    if (environment) environment.weather = { type: 'rain', turnsLeft: 5 };
    extraMsg += ' Trời bắt đầu đổ mưa rào lớn!';
  } else if (moveId === 'sandstorm') {
    if (environment) environment.weather = { type: 'sandstorm', turnsLeft: 5 };
    extraMsg += ' Cơn bão cát dữ dội bắt đầu hoành hành!';
  } else if (moveId === 'snowscape' || moveId === 'hail') {
    if (environment) environment.weather = { type: 'hail', turnsLeft: 5 };
    extraMsg += ' Mưa tuyết và mưa đá bắt đầu rơi dày đặc!';
  } else if (moveId === 'electric_terrain') {
    if (environment) environment.terrain = { type: 'electric', turnsLeft: 5 };
    extraMsg += ' Dòng điện bao phủ khắp mặt đất!';
  } else if (moveId === 'grassy_terrain') {
    if (environment) environment.terrain = { type: 'grassy', turnsLeft: 5 };
    extraMsg += ' Thảm cỏ xanh mướt bao phủ khắp mặt đất!';
  } else if (moveId === 'misty_terrain') {
    if (environment) environment.terrain = { type: 'misty', turnsLeft: 5 };
    extraMsg += ' Màn sương mù huyền bí bao phủ khắp mặt đất!';
  } else if (moveId === 'psychic_terrain') {
    if (environment) environment.terrain = { type: 'psychic', turnsLeft: 5 };
    extraMsg += ' Năng lượng tâm linh kỳ dị bao phủ khắp mặt đất!';
  } else if (moveId === 'stealth_rock') {
    const oppHazards = getSideHazards(environment, defenderSide);
    if (oppHazards.stealthRock) {
      extraMsg += ` Nhưng Đá Tàng Hình đã bao quanh phe đối thủ rồi!`;
    } else {
      oppHazards.stealthRock = true;
      extraMsg += ` Những viên đá nhọn tàng hình đã trôi nổi bao vây phe của ${defender.name}!`;
    }
  } else if (moveId === 'spikes') {
    const oppHazards = getSideHazards(environment, defenderSide);
    if ((oppHazards.spikes ?? 0) >= 3) {
      extraMsg += ` Gai nhọn không thể rải thêm được nữa!`;
    } else {
      oppHazards.spikes = (oppHazards.spikes ?? 0) + 1;
      extraMsg += ` Gai nhọn đã được rải quanh phe của ${defender.name}! (${oppHazards.spikes}/3 lớp)`;
    }
  } else if (moveId === 'toxic_spikes') {
    const oppHazards = getSideHazards(environment, defenderSide);
    if ((oppHazards.toxicSpikes ?? 0) >= 2) {
      extraMsg += ` Gai độc không thể rải thêm được nữa!`;
    } else {
      oppHazards.toxicSpikes = (oppHazards.toxicSpikes ?? 0) + 1;
      extraMsg += ` Gai độc đã được rải quanh phe của ${defender.name}! (${oppHazards.toxicSpikes}/2 lớp)`;
    }
  } else if (moveId === 'sticky_web') {
    const oppHazards = getSideHazards(environment, defenderSide);
    if (oppHazards.stickyWeb) {
      extraMsg += ` Nhưng Mạng Nhện Dính đã bao phủ phe đối thủ rồi!`;
    } else {
      oppHazards.stickyWeb = true;
      extraMsg += ` Mạng nhện dính đã được giăng khắp phe của ${defender.name}!`;
    }
  } else if (moveId === 'mean_look' || moveId === 'block' || moveId === 'spider_web') {
    if (defender.types.includes('Ghost')) {
      extraMsg += ` Nhưng ${defender.name} là hệ Ma nên không thể bị chặn đường!`;
    } else if (defender.isTrapped) {
      extraMsg += ` Nhưng ${defender.name} đã bị chặn đường thoát rồi!`;
    } else {
      defender.isTrapped = true;
      defender.trappedBy = attackerSide;
      extraMsg += ` ${defender.name} đã bị chặn đường, không thể chạy trốn hoặc đổi Pokémon!`;
    }
  } else if (moveId === 'trick' || moveId === 'switcheroo') {
    if (!attacker.heldItem && !defender.heldItem) {
      extraMsg += ` Nhưng không có vật phẩm nào để hoán đổi!`;
    } else if (
      AbilityEngine.normalize(attacker.ability) === 'stickyhold' ||
      AbilityEngine.normalize(defender.ability) === 'stickyhold'
    ) {
      extraMsg += ` Nhưng [Dính Chặt] ngăn cản việc hoán đổi vật phẩm!`;
    } else {
      const aItem = attacker.heldItem;
      const dItem = defender.heldItem;
      attacker.heldItem = dItem;
      defender.heldItem = aItem;
      const aName = getHeldItemDisplayName(dItem) || 'không có gì';
      const dName = getHeldItemDisplayName(aItem) || 'không có gì';
      extraMsg += ` ${attacker.name} và ${defender.name} đã hoán đổi vật phẩm cho nhau! ${attacker.name} nhận [${aName}], ${defender.name} nhận [${dName}]!`;
    }
  } else if (moveId === 'recycle') {
    if (attacker.heldItem) {
      extraMsg += ` Nhưng ${attacker.name} đã đang mang một vật phẩm rồi!`;
    } else if (!attacker.lastConsumedItem) {
      extraMsg += ` Nhưng ${attacker.name} chưa tiêu thụ vật phẩm nào để tái chế!`;
    } else {
      attacker.heldItem = attacker.lastConsumedItem;
      const recName = getHeldItemDisplayName(attacker.heldItem);
      attacker.lastConsumedItem = null;
      extraMsg += ` ${attacker.name} đã tái chế và nhận lại [${recName}]!`;
    }
  } else if (moveId === 'stuff_cheeks') {
    if (!isBerryItem(attacker.heldItem)) {
      extraMsg += ` Nhưng ${attacker.name} không mang theo quả Berry nào để nhét má!`;
    } else {
      const berryKey = attacker.heldItem!;
      const berryName = getHeldItemDisplayName(berryKey);
      attacker.lastConsumedItem = berryKey;
      attacker.heldItem = null;
      const berryMsg = consumeBerry(attacker, attackerSide, berryKey, events);
      const defChange = applyStatStageChange(attacker, 'defense', 2);
      extraMsg += ` ${attacker.name} nhét đầy [${berryName}] vào má và ăn ngấu nghiến! ${berryMsg} Chỉ số Phòng thủ tăng mạnh!`;
      events.push(
        BattleEventFactory.statStageChanged(
          attackerSide,
          attacker.name,
          'defense',
          defChange,
          attacker.statStages!.defense,
          `Chỉ số Phòng thủ của ${attacker.name} tăng mạnh!`
        )
      );
    }
  } else if (CONFUSION_STATUS_MOVE_IDS.has(moveId)) {
    if ((defender.safeguardTurns ?? 0) > 0) {
      extraMsg += ` Nhưng Màn Hộ Thể bảo vệ ${defender.name} khỏi bối rối!`;
    } else if ((defender.confusionTurns ?? 0) > 0) {
      extraMsg += ` Nhưng ${defender.name} đã bối rối rồi!`;
    } else if (AbilityEngine.normalize(defender.ability) === 'owntempo') {
      extraMsg += ` Nhưng [Nhịp Điệu Riêng] bảo vệ ${defender.name} khỏi bối rối!`;
    } else {
      defender.confusionTurns = rng.nextInt(2, 4);
      extraMsg += ` ${defender.name} đã rơi vào trạng thái bối rối!`;
      events.push(
        BattleEventFactory.statusInflicted(
          defenderSide,
          defender.name,
          'confusion',
          `${defender.name} đã rơi vào trạng thái bối rối!`
        )
      );
    }
  } else if (moveId === 'swagger') {
    const boost = applyStatStageChange(defender, 'attack', 2);
    extraMsg += ` Chỉ số Tấn công của ${defender.name} tăng mạnh!`;
    events.push(
      BattleEventFactory.statStageChanged(
        defenderSide,
        defender.name,
        'attack',
        2,
        boost,
        `Chỉ số Tấn công của ${defender.name} tăng mạnh!`
      )
    );
    if ((defender.safeguardTurns ?? 0) > 0) {
      extraMsg += ` Nhưng Màn Hộ Thể bảo vệ ${defender.name} khỏi bối rối!`;
    } else if ((defender.confusionTurns ?? 0) > 0) {
      extraMsg += ` Nhưng ${defender.name} đã bối rối rồi!`;
    } else if (AbilityEngine.normalize(defender.ability) === 'owntempo') {
      extraMsg += ` Nhưng [Nhịp Điệu Riêng] bảo vệ ${defender.name} khỏi bối rối!`;
    } else {
      defender.confusionTurns = rng.nextInt(2, 4);
      extraMsg += ` ${defender.name} đã rơi vào trạng thái bối rối!`;
      events.push(
        BattleEventFactory.statusInflicted(
          defenderSide,
          defender.name,
          'confusion',
          `${defender.name} đã rơi vào trạng thái bối rối!`
        )
      );
    }
  } else if (moveId === 'flatter') {
    const boost = applyStatStageChange(defender, 'spAtk', 1);
    extraMsg += ` Chỉ số Công ĐB của ${defender.name} tăng lên!`;
    events.push(
      BattleEventFactory.statStageChanged(
        defenderSide,
        defender.name,
        'spAtk',
        1,
        boost,
        `Chỉ số Công ĐB của ${defender.name} tăng lên!`
      )
    );
    if ((defender.safeguardTurns ?? 0) > 0) {
      extraMsg += ` Nhưng Màn Hộ Thể bảo vệ ${defender.name} khỏi bối rối!`;
    } else if ((defender.confusionTurns ?? 0) > 0) {
      extraMsg += ` Nhưng ${defender.name} đã bối rối rồi!`;
    } else if (AbilityEngine.normalize(defender.ability) === 'owntempo') {
      extraMsg += ` Nhưng [Nhịp Điệu Riêng] bảo vệ ${defender.name} khỏi bối rối!`;
    } else {
      defender.confusionTurns = rng.nextInt(2, 4);
      extraMsg += ` ${defender.name} đã rơi vào trạng thái bối rối!`;
      events.push(
        BattleEventFactory.statusInflicted(
          defenderSide,
          defender.name,
          'confusion',
          `${defender.name} đã rơi vào trạng thái bối rối!`
        )
      );
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
      const statVi = STAT_NAME_VI[sc.stat] ?? sc.stat;

      if (
        sc.stages < 0 &&
        target !== attacker &&
        AbilityEngine.isStatDropProtected(target, sc.stat, true)
      ) {
        const protName = AbilityEngine.getDisplayName(target.ability);
        extraMsg += ` Nhưng ${target.name} nhờ [${protName}] ngăn cản giảm ${statVi}!`;
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

      const change = applyStatStageChange(target, sc.stat, sc.stages);

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

      // Defiant & Competitive triggers on stat drops caused by opponent
      if (change < 0 && target !== attacker) {
        const targetAbilityKey = AbilityEngine.normalize(target.ability);
        if (targetAbilityKey === 'defiant') {
          const boost = applyStatStageChange(target, 'attack', 2);
          extraMsg += ` ${target.name} kích hoạt [${AbilityEngine.getDisplayName(target.ability)}] và tăng mạnh Tấn công!`;
          events.push(
            BattleEventFactory.statStageChanged(
              tSide,
              target.name,
              'attack',
              2,
              boost,
              `${target.name} tăng mạnh Tấn công!`
            )
          );
        } else if (targetAbilityKey === 'competitive') {
          const boost = applyStatStageChange(target, 'spAtk', 2);
          extraMsg += ` ${target.name} kích hoạt [${AbilityEngine.getDisplayName(target.ability)}] và tăng mạnh Công ĐB!`;
          events.push(
            BattleEventFactory.statStageChanged(
              tSide,
              target.name,
              'spAtk',
              2,
              boost,
              `${target.name} tăng mạnh Công ĐB!`
            )
          );
        }
      }
    }
  }

  // Status effect
  if (move.statusEffect && move.id !== 'rest') {
    const target = move.statusEffect.target === 'self' ? attacker : defender;
    const tSide: BattlerSide = target === attacker ? attackerSide : defenderSide;
    const oppSide: BattlerSide = tSide === 'player' ? 'enemy' : 'player';
    const chance = Math.max(0, Math.min(1, move.statusEffect.chance));
    const immunityMessage = getStatusImmunity(target, move.statusEffect.condition);
    const conditionVi = STATUS_NAME_VI[move.statusEffect.condition] ?? move.statusEffect.condition;

    // Overcoat blocks powder and spore moves
    const POWDER_MOVES = new Set([
      'spore',
      'sleep_powder',
      'poison_powder',
      'stun_spore',
      'cotton_spore',
      'powder',
    ]);
    const isOvercoatBlocked =
      target !== attacker &&
      AbilityEngine.normalize(target.ability) === 'overcoat' &&
      POWDER_MOVES.has(move.id.toLowerCase());

    if (isOvercoatBlocked) {
      extraMsg += ` Nhưng [Áo Khoác] của ${target.name} ngăn chặn các chiêu thức dạng bào tử!`;
      return { extraMsg };
    }

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

      // Trigger Synchronize if target reflected onto attacker
      if (target !== attacker) {
        const synchMsg = AbilityEngine.checkSynchronize(
          target,
          tSide,
          attacker,
          oppSide,
          move.statusEffect.condition,
          events
        );
        if (synchMsg) {
          extraMsg += ` ${synchMsg}`;
        }
      }
    } else if (target.status !== 'none' && move.statusEffect.target !== 'self') {
      extraMsg += ` Nhưng thất bại! ${target.name} đã mắc trạng thái bất thường rồi!`;
    } else if (target.status === 'none' && immunityMessage) {
      extraMsg += ` ${immunityMessage}`;
    }
  }

  return { extraMsg };
}
