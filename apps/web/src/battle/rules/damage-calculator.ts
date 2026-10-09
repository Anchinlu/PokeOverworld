import type { BattlerPokemon, BattleMove } from '../types';
import type { BattleRng } from '../battle-rng';
import { getTypeEffectiveness } from './type-effectiveness';
import { getStatMultiplier } from '../state/battle-state-reducer';

export interface DamageCalculationResult {
  damage: number;
  isCritical: boolean;
  typeEffectiveness: number;
  hitsCount: number;
  effText: string;
  secMsg: string;
  isMiss?: boolean;
  failed?: boolean;
  healedDefender?: boolean;
  healAmount?: number;
  attackerSelfFainted?: boolean;
}

export const MULTI_HIT_2_TO_5_MOVE_IDS = new Set([
  'fury_swipes',
  'double_slap',
  'comet_punch',
  'bullet_seed',
  'pin_missile',
  'rock_blast',
  'tail_slap',
  'water_shuriken',
  'icicle_spear',
  'arm_thrust',
  'bone_rush',
  'spike_cannon',
  'barrage',
  'fury_attack',
]);

export const MULTI_HIT_2_MOVE_IDS = new Set([
  'double_kick',
  'twineedle',
  'bonemerang',
  'dual_chop',
  'gear_grind',
  'dragon_darts',
]);

import { HeldItemEngine } from './held-item-engine';
import { AbilityEngine } from './ability-engine';

/**
 * Calculates raw base damage for a single hit under Gen 7 formula.
 */
export function calculateSingleHitBaseDamage(
  attacker: BattlerPokemon,
  defender: BattlerPokemon,
  move: BattleMove,
  effectivePower: number
): { baseDmg: number; atk: number; def: number } {
  const isSpecial = move.category === 'special';
  const rawAtk = isSpecial ? attacker.stats.spAtk : attacker.stats.attack;
  const rawDef = isSpecial ? defender.stats.spDef : defender.stats.defense;

  const atkStage = isSpecial
    ? (attacker.statStages?.spAtk ?? 0)
    : (attacker.statStages?.attack ?? 0);
  const defStage = isSpecial
    ? (defender.statStages?.spDef ?? 0)
    : (defender.statStages?.defense ?? 0);

  const atkItemMult = isSpecial
    ? HeldItemEngine.getStatMultiplier(attacker, 'spAtk')
    : HeldItemEngine.getStatMultiplier(attacker, 'attack');
  const defItemMult = isSpecial
    ? HeldItemEngine.getStatMultiplier(defender, 'spDef')
    : HeldItemEngine.getStatMultiplier(defender, 'defense');

  const atkAbilityMult = isSpecial
    ? AbilityEngine.getAttackerStatMultiplier(attacker, 'spAtk')
    : AbilityEngine.getAttackerStatMultiplier(attacker, 'attack');

  let atk = rawAtk * getStatMultiplier(atkStage) * atkItemMult * atkAbilityMult;
  if (!isSpecial && attacker.status === 'burn' && AbilityEngine.normalize(attacker.ability) !== 'guts') {
    atk *= 0.5;
  }
  const def = Math.max(1, rawDef * getStatMultiplier(defStage) * defItemMult);

  const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
  const baseDmg = Math.floor((levelFactor * effectivePower * (atk / def)) / 50) + 2;

  return { baseDmg, atk, def };
}

/**
 * Evaluates damage and multi-hit counts for an attacking move against a target.
 */
export function calculateDamage(
  attacker: BattlerPokemon,
  defender: BattlerPokemon,
  move: BattleMove,
  rng: BattleRng
): DamageCalculationResult {
  const moveId = move.id.toLowerCase();
  const isStruggle = move.id === 'struggle';
  const typeEff = isStruggle ? 1.0 : getTypeEffectiveness(move.type, defender.types);

  if (typeEff === 0) {
    return {
      damage: 0,
      isCritical: false,
      typeEffectiveness: 0,
      hitsCount: 1,
      effText: '',
      secMsg: '',
    };
  }

  // Wonder Guard immunity for non-super-effective damaging moves
  if (AbilityEngine.normalize(defender.ability) === 'wonderguard' && move.category !== 'status' && typeEff <= 1.0) {
    return {
      damage: 0,
      isCritical: false,
      typeEffectiveness: typeEff,
      hitsCount: 1,
      effText: '',
      secMsg: ' Vệ Tinh Bí Ẩn chặn đứng đòn đánh!',
    };
  }

  let damage: number;
  let isCrit = false;
  let effText = '';
  let secMsg = '';
  let hitsCount = 1;

  // A. Special fixed-damage or unique calculation moves
  if (moveId === 'seismic_toss' || moveId === 'night_shade') {
    damage = Math.max(1, attacker.level);
  } else if (moveId === 'dragon_rage') {
    damage = 40;
  } else if (moveId === 'sonic_boom' || moveId === 'sonicboom') {
    damage = 20;
  } else if (moveId === 'super_fang' || moveId === 'natures_madness' || moveId === 'ruination') {
    damage = Math.max(1, Math.floor(defender.currentHp / 2));
  } else if (moveId === 'guardian_of_alola') {
    damage = Math.max(1, Math.floor(defender.currentHp * 0.75));
  } else if (moveId === 'endeavor') {
    if (attacker.currentHp < defender.currentHp) {
      damage = defender.currentHp - attacker.currentHp;
    } else {
      return {
        damage: 0,
        isCritical: false,
        typeEffectiveness: 1.0,
        hitsCount: 1,
        effText: '',
        secMsg: '',
        failed: true,
      };
    }
  } else if (moveId === 'psywave') {
    const factor = 0.5 + rng.next() * 1.0;
    damage = Math.max(1, Math.floor(attacker.level * factor));
  } else if (moveId === 'final_gambit') {
    damage = attacker.currentHp;
    return {
      damage,
      isCritical: false,
      typeEffectiveness: 1.0,
      hitsCount: 1,
      effText: '',
      secMsg: ` ${attacker.name} đã ngất xỉu!`,
      attackerSelfFainted: true,
    };
  } else if (
    moveId === 'fissure' ||
    moveId === 'guillotine' ||
    moveId === 'horn_drill' ||
    moveId === 'sheer_cold'
  ) {
    if (attacker.level < defender.level) {
      return {
        damage: 0,
        isCritical: false,
        typeEffectiveness: 1.0,
        hitsCount: 1,
        effText: '',
        secMsg: '',
        isMiss: true,
        failed: true,
      };
    }
    const ohkoAcc = 30 + (attacker.level - defender.level);
    if (rng.next() * 100 > ohkoAcc) {
      return {
        damage: 0,
        isCritical: false,
        typeEffectiveness: 1.0,
        hitsCount: 1,
        effText: '',
        secMsg: '',
        isMiss: true,
      };
    }
    damage = defender.currentHp;
    secMsg += ' Hạ gục đối thủ chỉ với một đòn duy nhất!';
  } else {
    // B. Standard & Dynamic damage calculation with Gen 7 floor rule
    let effectivePower = move.power;

    // Dynamic variable power moves
    if (moveId === 'flail' || moveId === 'reversal') {
      const hpRatio = attacker.currentHp / Math.max(1, attacker.maxHp);
      if (hpRatio < 0.0417) effectivePower = 200;
      else if (hpRatio < 0.1042) effectivePower = 150;
      else if (hpRatio < 0.2083) effectivePower = 100;
      else if (hpRatio < 0.3542) effectivePower = 80;
      else if (hpRatio < 0.6875) effectivePower = 40;
      else effectivePower = 20;
    } else if (moveId === 'crush_grip' || moveId === 'wring_out' || moveId === 'hard_press') {
      effectivePower = Math.max(
        1,
        Math.floor(120 * (defender.currentHp / Math.max(1, defender.maxHp)))
      );
    } else if (moveId === 'electro_ball') {
      const atkSpd = attacker.stats.speed * getStatMultiplier(attacker.statStages?.speed ?? 0);
      const defSpd = Math.max(
        1,
        defender.stats.speed * getStatMultiplier(defender.statStages?.speed ?? 0)
      );
      const ratio = atkSpd / defSpd;
      if (ratio >= 4) effectivePower = 150;
      else if (ratio >= 3) effectivePower = 120;
      else if (ratio >= 2) effectivePower = 80;
      else if (ratio >= 1) effectivePower = 60;
      else effectivePower = 40;
    } else if (moveId === 'gyro_ball') {
      const atkSpd = Math.max(
        1,
        attacker.stats.speed * getStatMultiplier(attacker.statStages?.speed ?? 0)
      );
      const defSpd = defender.stats.speed * getStatMultiplier(defender.statStages?.speed ?? 0);
      effectivePower = Math.min(150, Math.max(1, Math.floor(25 * (defSpd / atkSpd))));
    } else if (moveId === 'low_kick' || moveId === 'grass_knot') {
      effectivePower = 60;
    } else if (moveId === 'heavy_slam' || moveId === 'heat_crash') {
      effectivePower = 80;
    } else if (moveId === 'magnitude') {
      const roll = rng.next();
      let mag: number;
      let pwr: number;
      if (roll < 0.05) {
        mag = 4;
        pwr = 10;
      } else if (roll < 0.15) {
        mag = 5;
        pwr = 30;
      } else if (roll < 0.35) {
        mag = 6;
        pwr = 50;
      } else if (roll < 0.65) {
        mag = 7;
        pwr = 70;
      } else if (roll < 0.85) {
        mag = 8;
        pwr = 90;
      } else if (roll < 0.95) {
        mag = 9;
        pwr = 110;
      } else {
        mag = 10;
        pwr = 150;
      }
      effectivePower = pwr;
      secMsg += ` Địa chấn cấp ${mag}!`;
    } else if (
      moveId === 'return' ||
      moveId === 'frustration' ||
      moveId === 'pika_papow' ||
      moveId === 'veevee_volley'
    ) {
      effectivePower = 102;
    } else if (moveId === 'trump_card') {
      effectivePower = 80;
    } else if (moveId === 'punishment') {
      const posStages = Object.values(defender.statStages ?? {}).reduce(
        (sum, s) => sum + (s > 0 ? s : 0),
        0
      );
      effectivePower = Math.min(200, 60 + 20 * posStages);
    } else if (moveId === 'present') {
      const roll = rng.next();
      if (roll < 0.2) {
        const heal = Math.max(1, Math.floor(defender.maxHp * 0.25));
        return {
          damage: 0,
          isCritical: false,
          typeEffectiveness: 1.0,
          hitsCount: 1,
          effText: '',
          secMsg: '',
          healedDefender: true,
          healAmount: heal,
        };
      } else if (roll < 0.6) effectivePower = 40;
      else if (roll < 0.9) effectivePower = 80;
      else effectivePower = 120;
    } else if (moveId === 'beat_up') {
      effectivePower = 15;
    } else if (
      moveId === 'counter' ||
      moveId === 'mirror_coat' ||
      moveId === 'metal_burst' ||
      moveId === 'bide'
    ) {
      effectivePower = 90;
    } else if (moveId === 'spit_up') {
      effectivePower = 100;
    } else if (moveId === 'fling' || moveId === 'natural_gift') {
      effectivePower = 60;
    } else if (effectivePower === 0) {
      effectivePower = 120;
    }

    const { baseDmg } = calculateSingleHitBaseDamage(attacker, defender, move, effectivePower);

    const hasAdaptability = AbilityEngine.normalize(attacker.ability) === 'adaptability';
    const stab = !isStruggle && attacker.types.includes(move.type) ? (hasAdaptability ? 2.0 : 1.5) : 1.0;
    const hasSuperLuck = AbilityEngine.normalize(attacker.ability) === 'superluck';
    const totalCritStage = (attacker.critStage ?? 0) + (move.highCrit ? 1 : 0) + (hasSuperLuck ? 1 : 0);
    let critThreshold = 1 / 24;
    if (totalCritStage === 1) critThreshold = 1 / 8;
    else if (totalCritStage === 2) critThreshold = 1 / 2;
    else if (totalCritStage >= 3) critThreshold = 1.0;
    const rawIsCrit = rng.next() < critThreshold;
    const critResult = AbilityEngine.modifyCriticalHit(attacker, defender, rawIsCrit);
    isCrit = critResult.isCritical;
    const critMult = critResult.critMultiplier;
    const randomFactor = 0.85 + rng.next() * 0.15;

    const heldItemDamageMult = HeldItemEngine.getDamageMultiplier(
      attacker,
      defender,
      move,
      typeEff
    );

    const atkAbilityDamage = AbilityEngine.getAttackerDamageMultiplier(attacker, defender, move);
    const defAbilityDamage = AbilityEngine.getDefenderDamageMultiplier(attacker, defender, move, typeEff);
    const abilityDamageMult = atkAbilityDamage.multiplier * defAbilityDamage.multiplier;

    damage = Math.max(
      1,
      Math.floor(baseDmg * stab * typeEff * critMult * randomFactor * heldItemDamageMult * abilityDamageMult)
    );

    // Multi-hit moves
    const isMultiHit2to5 = MULTI_HIT_2_TO_5_MOVE_IDS.has(moveId);
    const isMultiHit2 = MULTI_HIT_2_MOVE_IDS.has(moveId);

    if (isMultiHit2to5 || isMultiHit2) {
      let maxHits = 2;
      if (isMultiHit2to5) {
        const roll = rng.next();
        if (roll < 0.35) maxHits = 2;
        else if (roll < 0.7) maxHits = 3;
        else if (roll < 0.85) maxHits = 4;
        else maxHits = 5;
      }

      let totalDmg = damage;
      let hits = 1;
      let simDefenderHp = defender.currentHp - damage;

      for (let i = 2; i <= maxHits; i++) {
        if (simDefenderHp <= 0) break;
        const hitRandom = 0.85 + rng.next() * 0.15;
        const hitDmg = Math.max(
          1,
          Math.floor(baseDmg * stab * typeEff * critMult * hitRandom * heldItemDamageMult * abilityDamageMult)
        );
        totalDmg += hitDmg;
        simDefenderHp -= hitDmg;
        hits++;
      }
      damage = totalDmg;
      hitsCount = hits;
      secMsg += ` Đánh trúng ${hits} lần!`;
    }

    if (typeEff > 1.5) effText = ' Đòn đánh cực kỳ hiệu quả!';
    else if (typeEff < 0.8) effText = ' Đòn đánh không mấy hiệu quả...';

    if (isCrit) effText += ' Đòn chí mạng!';
  }

  // Defensive Focus Sash Check
  const sashCheck = HeldItemEngine.checkFocusSash(defender, damage);
  if (sashCheck.triggered) {
    damage = sashCheck.damage;
    secMsg = secMsg ? `${secMsg} ${sashCheck.message}` : sashCheck.message;
  } else if (AbilityEngine.canSurviveWithSturdy(defender, damage)) {
    damage = Math.max(1, defender.currentHp - 1);
    const sturdyMsg = `${defender.name} kích hoạt [Vững Chãi] và giữ lại 1 HP!`;
    secMsg = secMsg ? `${secMsg} ${sturdyMsg}` : sturdyMsg;
  }

  return {
    damage,
    isCritical: isCrit,
    typeEffectiveness: typeEff,
    hitsCount,
    effText,
    secMsg,
  };
}
