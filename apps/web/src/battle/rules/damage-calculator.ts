import type { BattlerPokemon, BattleMove, BattleEnvironment, PokemonType } from '../types';
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
  'scale_shot',
]);

export const MULTI_HIT_2_MOVE_IDS = new Set([
  'double_kick',
  'twineedle',
  'bonemerang',
  'dual_chop',
  'gear_grind',
  'dragon_darts',
  'double_hit',
  'double_iron_bash',
  'twin_beam',
  'dual_wingbeat',
  'tachyon_cutter',
]);

export const MULTI_HIT_3_MOVE_IDS = new Set([
  'triple_kick',
  'triple_axel',
  'triple_dive',
  'surging_strikes',
]);

import { HeldItemEngine, getFlingPower } from './held-item-engine';
import { AbilityEngine } from './ability-engine';
import {
  getEnvironmentDamageMultiplier,
  getWeatherMovePowerMultiplier,
  isGrounded,
} from './environment';
import { calculateEffectiveSpeed } from './turn-order';
import type { PokemonSpeciesData } from '@pokemon/shared-types';
import rawPokemonData from '@pokemon/game-data/pokemon-db.json';

const pokemonWeights = new Map<string, number>();
for (const p of Object.values(rawPokemonData.pokemon as Record<string, PokemonSpeciesData>)) {
  if (p.weight != null) {
    if (p.speciesKey) pokemonWeights.set(p.speciesKey.toUpperCase(), p.weight);
    if (p.id != null) pokemonWeights.set(String(p.id), p.weight);
    if (p.name) pokemonWeights.set(p.name.toUpperCase(), p.weight);
  }
}

export function getBattlerWeight(battler: BattlerPokemon): number {
  if (typeof battler.weight === 'number' && battler.weight > 0) {
    return battler.weight;
  }
  const byKey = battler.speciesKey ? pokemonWeights.get(battler.speciesKey.toUpperCase()) : undefined;
  if (byKey != null) return byKey;
  const byId = battler.id != null ? pokemonWeights.get(String(battler.id)) : undefined;
  if (byId != null) return byId;
  const byName = battler.name ? pokemonWeights.get(battler.name.toUpperCase()) : undefined;
  if (byName != null) return byName;
  return 50.0;
}

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
  if (
    !isSpecial &&
    attacker.status === 'burn' &&
    AbilityEngine.normalize(attacker.ability) !== 'guts' &&
    move.id.toLowerCase() !== 'facade'
  ) {
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
  rng: BattleRng,
  environment?: BattleEnvironment
): DamageCalculationResult {
  const moveId = move.id.toLowerCase();
  let effectiveMoveType: PokemonType = move.type;
  let effectivePower = move.power;

  if (moveId === 'weather_ball') {
    if (environment?.weather && environment.weather.type !== 'none') {
      effectivePower = 100;
      if (environment.weather.type === 'sun') effectiveMoveType = 'Fire';
      else if (environment.weather.type === 'rain') effectiveMoveType = 'Water';
      else if (environment.weather.type === 'sandstorm') effectiveMoveType = 'Rock';
      else if (environment.weather.type === 'hail') effectiveMoveType = 'Ice';
    }
  } else if (moveId === 'terrain_pulse') {
    if (environment?.terrain && environment.terrain.type !== 'none' && isGrounded(attacker)) {
      effectivePower = 100;
      if (environment.terrain.type === 'electric') effectiveMoveType = 'Electric';
      else if (environment.terrain.type === 'grassy') effectiveMoveType = 'Grass';
      else if (environment.terrain.type === 'misty') effectiveMoveType = 'Fairy';
      else if (environment.terrain.type === 'psychic') effectiveMoveType = 'Psychic';
    }
  } else if (moveId === 'rising_voltage') {
    if (environment?.terrain?.type === 'electric' && isGrounded(defender)) {
      effectivePower = 140;
    }
  } else if (moveId === 'expanding_force') {
    if (environment?.terrain?.type === 'psychic' && isGrounded(attacker)) {
      effectivePower = 120;
    }
  } else if (moveId === 'facade') {
    if (
      attacker.status === 'burn' ||
      attacker.status === 'poison' ||
      attacker.status === 'toxic' ||
      attacker.status === 'paralysis'
    ) {
      effectivePower = 140;
    }
  } else if (moveId === 'venoshock') {
    if (defender.status === 'poison' || defender.status === 'toxic') {
      effectivePower = 130;
    }
  } else if (moveId === 'wake_up_slap') {
    if (defender.status === 'sleep') {
      effectivePower = 140;
    }
  } else if (moveId === 'stored_power' || moveId === 'power_trip') {
    const stages = attacker.statStages ?? {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    };
    const trackedStats = [
      'attack',
      'defense',
      'spAtk',
      'spDef',
      'speed',
      'accuracy',
      'evasion',
    ] as const;
    let totalPositiveStages = 0;
    for (const s of trackedStats) {
      const val = stages[s] ?? 0;
      if (val > 0) {
        totalPositiveStages += val;
      }
    }
    effectivePower = 20 + 20 * totalPositiveStages;
  } else if (moveId === 'heavy_slam' || moveId === 'heat_crash') {
    const userWeight = getBattlerWeight(attacker);
    const targetWeight = Math.max(0.1, getBattlerWeight(defender));
    const ratio = userWeight / targetWeight;
    if (ratio >= 5.0) {
      effectivePower = 120;
    } else if (ratio >= 4.0) {
      effectivePower = 100;
    } else if (ratio >= 3.0) {
      effectivePower = 80;
    } else if (ratio >= 2.0) {
      effectivePower = 60;
    } else {
      effectivePower = 40;
    }
  } else if (moveId === 'low_kick' || moveId === 'grass_knot') {
    const targetWeight = getBattlerWeight(defender);
    if (targetWeight >= 200.0) {
      effectivePower = 120;
    } else if (targetWeight >= 100.0) {
      effectivePower = 100;
    } else if (targetWeight >= 50.0) {
      effectivePower = 80;
    } else if (targetWeight >= 25.0) {
      effectivePower = 60;
    } else if (targetWeight >= 10.0) {
      effectivePower = 40;
    } else {
      effectivePower = 20;
    }
  } else if (moveId === 'electro_ball') {
    const userSpeed = calculateEffectiveSpeed(attacker, environment);
    const targetSpeed = calculateEffectiveSpeed(defender, environment);
    const ratio = targetSpeed <= 0 ? 4 : userSpeed / targetSpeed;
    if (ratio >= 4.0) {
      effectivePower = 150;
    } else if (ratio >= 3.0) {
      effectivePower = 120;
    } else if (ratio >= 2.0) {
      effectivePower = 80;
    } else if (ratio >= 1.0) {
      effectivePower = 60;
    } else {
      effectivePower = 40;
    }
  } else if (moveId === 'gyro_ball') {
    const userSpeed = Math.max(1, calculateEffectiveSpeed(attacker, environment));
    const targetSpeed = calculateEffectiveSpeed(defender, environment);
    effectivePower = Math.min(150, Math.max(1, Math.floor((25 * targetSpeed) / userSpeed) + 1));
  } else if (moveId === 'last_respects') {
    const faintedCount = Math.max(0, attacker.faintedAlliesCount ?? 0);
    effectivePower = 50 + 50 * faintedCount;
  } else if (
    moveId === 'grass_pledge' ||
    moveId === 'fire_pledge' ||
    moveId === 'water_pledge'
  ) {
    if (environment?.pledgeCombo) {
      effectivePower = 150;
    }
  } else if (moveId === 'knock_off') {
    if (defender.heldItem && AbilityEngine.normalize(defender.ability) !== 'stickyhold') {
      effectivePower = Math.floor(move.power * 1.5);
    }
  } else if (moveId === 'fling') {
    if (!attacker.heldItem) {
      return {
        damage: 0,
        isCritical: false,
        typeEffectiveness: 1.0,
        hitsCount: 0,
        effText: '',
        secMsg: ' Nhưng không có vật phẩm nào để ném!',
        failed: true,
      };
    }
    effectivePower = getFlingPower(attacker.heldItem);
  } else if (moveId === 'poltergeist') {
    if (!defender.heldItem) {
      return {
        damage: 0,
        isCritical: false,
        typeEffectiveness: 1.0,
        hitsCount: 0,
        effText: '',
        secMsg: ` Nhưng ${defender.name} không mang vật phẩm nào!`,
        failed: true,
      };
    }
  }

  const effectiveMove: BattleMove = {
    ...move,
    type: effectiveMoveType,
    power: effectivePower,
  };

  const isStruggle = move.id === 'struggle';
  const typeEff = isStruggle ? 1.0 : getTypeEffectiveness(effectiveMove.type, defender.types);

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
  if (
    AbilityEngine.normalize(defender.ability) === 'wonderguard' &&
    effectiveMove.category !== 'status' &&
    typeEff <= 1.0
  ) {
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
    if (effectivePower === 0) {
      effectivePower = effectiveMove.power;
    }

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

    const weatherPowerMult = getWeatherMovePowerMultiplier(environment?.weather?.type, move.id);
    effectivePower = Math.max(1, Math.floor(effectivePower * weatherPowerMult));

    const { baseDmg } = calculateSingleHitBaseDamage(attacker, defender, effectiveMove, effectivePower);

    const hasAdaptability = AbilityEngine.normalize(attacker.ability) === 'adaptability';
    const stab =
      !isStruggle && attacker.types.includes(effectiveMove.type) ? (hasAdaptability ? 2.0 : 1.5) : 1.0;
    const hasSuperLuck = AbilityEngine.normalize(attacker.ability) === 'superluck';
    const totalCritStage =
      (attacker.critStage ?? 0) + (move.highCrit ? 1 : 0) + (hasSuperLuck ? 1 : 0);
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
      effectiveMove,
      typeEff
    );

    const atkAbilityDamage = AbilityEngine.getAttackerDamageMultiplier(attacker, defender, effectiveMove);
    const defAbilityDamage = AbilityEngine.getDefenderDamageMultiplier(
      attacker,
      defender,
      effectiveMove,
      typeEff
    );
    const abilityDamageMult = atkAbilityDamage.multiplier * defAbilityDamage.multiplier;
    const envDamageMult = getEnvironmentDamageMultiplier(environment, effectiveMove, attacker, defender);

    damage = Math.max(
      1,
      Math.floor(
        baseDmg *
          stab *
          typeEff *
          critMult *
          randomFactor *
          heldItemDamageMult *
          abilityDamageMult *
          envDamageMult
      )
    );

    // Multi-hit moves
    const isMultiHit2to5 = MULTI_HIT_2_TO_5_MOVE_IDS.has(moveId);
    const isMultiHit2 = MULTI_HIT_2_MOVE_IDS.has(moveId);
    const isMultiHit3 = MULTI_HIT_3_MOVE_IDS.has(moveId);

    if (isMultiHit2to5 || isMultiHit2 || isMultiHit3) {
      let maxHits = 2;
      if (isMultiHit2to5) {
        const hasSkillLink = AbilityEngine.normalize(attacker.ability) === 'skilllink';
        if (hasSkillLink) {
          maxHits = 5;
        } else {
          const roll = rng.next();
          if (roll < 0.35) maxHits = 2;
          else if (roll < 0.7) maxHits = 3;
          else if (roll < 0.85) maxHits = 4;
          else maxHits = 5;
        }
      } else if (isMultiHit3) {
        maxHits = 3;
      }

      let totalDmg = damage;
      let hits = 1;
      let simDefenderHp = defender.currentHp - damage;

      for (let i = 2; i <= maxHits; i++) {
        if (simDefenderHp <= 0) break;
        const hitRandom = 0.85 + rng.next() * 0.15;
        const hitDmg = Math.max(
          1,
          Math.floor(
            baseDmg * stab * typeEff * critMult * hitRandom * heldItemDamageMult * abilityDamageMult
          )
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
