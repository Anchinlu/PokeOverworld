import type { BattlerPokemon, BattleMove, BattlePhase, BattleEnvironment } from './types';
import { getTypeEffectiveness } from './type-chart';
import { defaultBattleRng, type BattleRng } from './battle-rng';

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
}

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

/** Official Pokémon stat stage multipliers (-6 to +6) */
export function getStatMultiplier(stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage));
  return clamped >= 0 ? (2 + clamped) / 2 : 2 / (2 - clamped);
}

/** Accuracy/Evasion stage multipliers */
export function getAccuracyMultiplier(accStage: number, evaStage: number): number {
  const diff = Math.max(-6, Math.min(6, accStage - evaStage));
  return diff >= 0 ? (3 + diff) / 3 : 3 / (3 - diff);
}

export function getMoveDisplayName(move: BattleMove): string {
  return (move.nameVi || move.name).replace(/^[^(]+\(([^)]+)\)$/, '$1').trim();
}

export class BattleEngine {
  public playerPokemon: BattlerPokemon;
  public enemyPokemon: BattlerPokemon;
  public environment: BattleEnvironment;
  public phase: BattlePhase = 'intro';
  public message: string = '';
  public ballsCount: number = 5;

  constructor(
    playerPokemon: BattlerPokemon,
    enemyPokemon: BattlerPokemon,
    environment: BattleEnvironment,
    public readonly rng: BattleRng = defaultBattleRng
  ) {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.environment = environment;
    this.message = `A wild ${enemyPokemon.name} appeared!`;

    this.ensureBattlerState(this.playerPokemon);
    this.ensureBattlerState(this.enemyPokemon);
  }

  public switchPlayerPokemon(newPokemon: BattlerPokemon): void {
    this.playerPokemon = newPokemon;
    this.ensureBattlerState(this.playerPokemon);
  }

  private ensureBattlerState(battler: BattlerPokemon): void {
    battler.statStages ??= {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    };
    battler.status ??= 'none';
    battler.sleepTurns ??= 0;
    battler.statusTurns ??= 0;
  }

  private getStatusImmunity(
    target: BattlerPokemon,
    condition: NonNullable<BattleMove['statusEffect']>['condition']
  ): string | null {
    if (condition === 'burn' && target.types.includes('Fire'))
      return 'Fire types cannot be burned.';
    if (condition === 'paralysis' && target.types.includes('Electric')) {
      return 'Electric types cannot be paralyzed.';
    }
    if (
      (condition === 'poison' || condition === 'toxic') &&
      (target.types.includes('Poison') || target.types.includes('Steel'))
    ) {
      return 'It does not affect this Pokémon.';
    }
    if (condition === 'freeze' && target.types.includes('Ice'))
      return 'Ice types cannot be frozen.';
    return null;
  }

  /** Applies persistent damage at the end of a completed turn. */
  public applyEndTurnEffects(target: BattlerPokemon): EndTurnResult | null {
    this.ensureBattlerState(target);
    if (target.currentHp <= 0 || target.isFainted) return null;

    let damage = 0;
    if (target.status === 'burn') {
      damage = Math.max(1, Math.floor(target.maxHp / 16));
    } else if (target.status === 'poison') {
      damage = Math.max(1, Math.floor(target.maxHp / 8));
    } else if (target.status === 'toxic') {
      target.statusTurns = Math.min(15, (target.statusTurns ?? 0) + 1);
      damage = Math.max(1, Math.floor((target.maxHp * target.statusTurns) / 16));
    }

    if (damage <= 0) return null;

    target.currentHp = Math.max(0, target.currentHp - damage);
    const defenderFainted = target.currentHp <= 0;
    if (defenderFainted) target.isFainted = true;

    const statusName =
      target.status === 'burn' ? 'burn' : target.status === 'toxic' ? 'toxic poison' : 'poison';
    return {
      damage,
      defenderFainted,
      message: `${target.name} was hurt by ${statusName}!`,
    };
  }

  public fleeAttempts: number = 0;

  public executeAttack(
    attacker: BattlerPokemon,
    defender: BattlerPokemon,
    move: BattleMove
  ): TurnResult {
    this.ensureBattlerState(attacker);
    this.ensureBattlerState(defender);

    if (move.id !== 'struggle' && move.pp <= 0) {
      return {
        attackerName: attacker.name,
        moveName: move.name,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: `${attacker.name} tried to use ${getMoveDisplayName(move)}, but it has no PP left!`,
      };
    }

    // 1. Status hindrance check (Sleep, Freeze, Paralysis) - DO NOT deduct PP if unable to move
    let statusPrefix = '';
    if (attacker.status === 'sleep') {
      if ((attacker.sleepTurns ?? 0) > 0) {
        attacker.sleepTurns!--;
        return {
          attackerName: attacker.name,
          moveName: move.name,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: `${attacker.name} is fast asleep!`,
        };
      } else {
        attacker.status = 'none';
        statusPrefix = `${attacker.name} woke up! `;
      }
    }

    if (attacker.status === 'freeze') {
      if (this.rng.next() < 0.2) {
        attacker.status = 'none';
        statusPrefix = `${attacker.name} thawed out! `;
      } else {
        return {
          attackerName: attacker.name,
          moveName: move.name,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: `${attacker.name} is frozen solid!`,
        };
      }
    }

    if (attacker.status === 'paralysis') {
      if (this.rng.next() < 0.25) {
        return {
          attackerName: attacker.name,
          moveName: move.name,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: `${attacker.name} is fully paralyzed! It can't move!`,
        };
      }
    }

    // Deduct PP only when attacker is able to act (Struggle does not deduct PP)
    if (move.id !== 'struggle') {
      move.pp = Math.max(0, move.pp - 1);
    }

    // 2. Accuracy / Evasion Check
    // Self-targeted status moves and never-miss moves ignore accuracy/evasion check
    const isSelfTargetMove =
      move.category === 'status' &&
      (move.id === 'rest' ||
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

    const accStage = attacker.statStages!.accuracy;
    const evaStage = defender.statStages!.evasion;
    const requiresAccCheck =
      !isNeverMiss && (move.accuracy < 100 || accStage !== 0 || evaStage !== 0);

    if (requiresAccCheck) {
      const accMult = getAccuracyMultiplier(accStage, evaStage);
      const effectiveAcc = move.accuracy * accMult;
      if (this.rng.next() * 100 > effectiveAcc) {
        return {
          attackerName: attacker.name,
          moveName: getMoveDisplayName(move),
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          isMiss: true,
          defenderFainted: false,
          message: `${attacker.name} used ${getMoveDisplayName(move)}! But it missed!`,
        };
      }
    }

    // 3. Status move handling
    if (move.category === 'status') {
      // Type immunity check for opponent-targeted status moves (e.g. Thunder Wave vs Ground)
      if (!isSelfTargetMove) {
        const typeEff = getTypeEffectiveness(move.type, defender.types);
        if (typeEff === 0) {
          return {
            attackerName: attacker.name,
            moveName: getMoveDisplayName(move),
            damage: 0,
            typeEffectiveness: 0,
            isCritical: false,
            defenderFainted: false,
            message: `${statusPrefix}${attacker.name} used ${getMoveDisplayName(move)}! It had no effect on ${defender.name}!`,
          };
        }
      }

      let extraMsg = '';

      // Healing & Rest logic
      if (move.id === 'rest') {
        if (attacker.currentHp >= attacker.maxHp) {
          extraMsg += ` But it failed! ${attacker.name}'s HP is already full!`;
        } else {
          attacker.status = 'sleep';
          attacker.statusTurns = 0;
          attacker.sleepTurns = 2;
          attacker.currentHp = attacker.maxHp;
          extraMsg += ` ${attacker.name} slept and became healthy!`;
        }
      } else if (move.healPercent && move.healPercent > 0) {
        if (attacker.currentHp >= attacker.maxHp) {
          extraMsg += ` ${attacker.name}'s HP is already full!`;
        } else {
          const heal = Math.max(1, Math.floor(attacker.maxHp * move.healPercent));
          attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
          extraMsg += ` ${attacker.name} restored its HP!`;
        }
      }

      // Stat stages
      if (move.statChanges && move.statChanges.length > 0) {
        for (const sc of move.statChanges) {
          const chance = Math.max(0, Math.min(1, sc.chance ?? 1));
          if (this.rng.next() >= chance) continue;
          const target = sc.target === 'self' ? attacker : defender;
          const stages = target.statStages!;
          const prev = stages[sc.stat];
          stages[sc.stat] = Math.max(-6, Math.min(6, prev + sc.stages));
          const change = stages[sc.stat] - prev;

          if (change > 1) extraMsg += ` ${target.name}'s ${sc.stat} sharply rose!`;
          else if (change === 1) extraMsg += ` ${target.name}'s ${sc.stat} rose!`;
          else if (change === -1) extraMsg += ` ${target.name}'s ${sc.stat} fell!`;
          else if (change < -1) extraMsg += ` ${target.name}'s ${sc.stat} harshly fell!`;
          else
            extraMsg += ` ${target.name}'s ${sc.stat} won't go any ${sc.stages > 0 ? 'higher' : 'lower'}!`;
        }
      }

      // Status ailment
      if (move.statusEffect && move.id !== 'rest') {
        const target = move.statusEffect.target === 'self' ? attacker : defender;
        const chance = Math.max(0, Math.min(1, move.statusEffect.chance));
        const immunityMessage = this.getStatusImmunity(target, move.statusEffect.condition);
        if (target.status === 'none' && !immunityMessage && this.rng.next() < chance) {
          target.status = move.statusEffect.condition;
          target.statusTurns = 0;
          if (target.status === 'sleep') target.sleepTurns = this.rng.nextInt(1, 3);
          extraMsg += ` ${target.name} was inflicted with ${move.statusEffect.condition}!`;
        } else if (target.status !== 'none' && move.statusEffect.target !== 'self') {
          extraMsg += ` But it failed! ${target.name} already has a status condition!`;
        } else if (target.status === 'none' && immunityMessage) {
          extraMsg += ` ${immunityMessage}`;
        }
      }

      const moveDisplayName = getMoveDisplayName(move);
      const mainMsg = `${statusPrefix}${attacker.name} used ${moveDisplayName}!${extraMsg || ' It affected the battle!'}`;
      return {
        attackerName: attacker.name,
        moveName: moveDisplayName,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: mainMsg,
      };
    }

    // 4. Damaging attack handling
    const isStruggle = move.id === 'struggle';
    const typeEff = isStruggle ? 1.0 : getTypeEffectiveness(move.type, defender.types);

    if (typeEff === 0) {
      return {
        attackerName: attacker.name,
        moveName: getMoveDisplayName(move),
        damage: 0,
        typeEffectiveness: 0,
        isCritical: false,
        defenderFainted: false,
        message: `${statusPrefix}${attacker.name} used ${getMoveDisplayName(move)}! It had no effect on ${defender.name}!`,
      };
    }

    let damage = 0;
    let isCrit = false;
    let effText = '';
    let secMsg = '';
    let hitsCount = 1;

    // A. Special fixed-damage or unique calculation moves
    const moveId = move.id.toLowerCase();
    if (moveId === 'seismic_toss' || moveId === 'night_shade') {
      damage = Math.max(1, attacker.level);
    } else if (moveId === 'dragon_rage') {
      damage = 40;
    } else if (moveId === 'sonic_boom') {
      damage = 20;
    } else if (moveId === 'super_fang' || moveId === 'natures_madness') {
      damage = Math.max(1, Math.floor(defender.currentHp / 2));
    } else if (moveId === 'endeavor') {
      if (attacker.currentHp < defender.currentHp) {
        damage = defender.currentHp - attacker.currentHp;
      } else {
        return {
          attackerName: attacker.name,
          moveName: getMoveDisplayName(move),
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          defenderFainted: false,
          message: `${statusPrefix}${attacker.name} used ${getMoveDisplayName(move)}! But it failed!`,
        };
      }
    } else if (moveId === 'psywave') {
      const factor = 0.5 + this.rng.next() * 1.0;
      damage = Math.max(1, Math.floor(attacker.level * factor));
    } else if (
      moveId === 'fissure' ||
      moveId === 'guillotine' ||
      moveId === 'horn_drill' ||
      moveId === 'sheer_cold'
    ) {
      if (attacker.level < defender.level) {
        return {
          attackerName: attacker.name,
          moveName: getMoveDisplayName(move),
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          isMiss: true,
          defenderFainted: false,
          message: `${statusPrefix}${attacker.name} used ${getMoveDisplayName(move)}! But it failed!`,
        };
      }
      const ohkoAcc = 30 + (attacker.level - defender.level);
      if (this.rng.next() * 100 > ohkoAcc) {
        return {
          attackerName: attacker.name,
          moveName: getMoveDisplayName(move),
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          isMiss: true,
          defenderFainted: false,
          message: `${statusPrefix}${attacker.name} used ${getMoveDisplayName(move)}! But it missed!`,
        };
      }
      damage = defender.currentHp;
      secMsg += " It's a one-hit KO!";
    } else {
      // B. Standard damage calculation with Gen 7 official floor rule
      let effectivePower = move.power;

      // Dynamic power moves
      if (moveId === 'flail' || moveId === 'reversal') {
        const hpRatio = attacker.currentHp / Math.max(1, attacker.maxHp);
        if (hpRatio < 0.0417) effectivePower = 200;
        else if (hpRatio < 0.1042) effectivePower = 150;
        else if (hpRatio < 0.2083) effectivePower = 100;
        else if (hpRatio < 0.3542) effectivePower = 80;
        else if (hpRatio < 0.6875) effectivePower = 40;
        else effectivePower = 20;
      }

      const isSpecial = move.category === 'special';
      const rawAtk = isSpecial ? attacker.stats.spAtk : attacker.stats.attack;
      const rawDef = isSpecial ? defender.stats.spDef : defender.stats.defense;

      const atkStage = isSpecial ? attacker.statStages!.spAtk : attacker.statStages!.attack;
      const defStage = isSpecial ? defender.statStages!.spDef : defender.statStages!.defense;

      let atk = rawAtk * getStatMultiplier(atkStage);
      if (!isSpecial && attacker.status === 'burn') {
        atk *= 0.5; // Burn halves physical attack
      }
      const def = Math.max(1, rawDef * getStatMultiplier(defStage));

      const stab = !isStruggle && attacker.types.includes(move.type) ? 1.5 : 1.0;
      // Gen 7 official critical threshold (Stage 0: 1/24 ~4.17%, Stage 1: 1/8 12.5%)
      const critThreshold = move.highCrit ? 1 / 8 : 1 / 24;
      isCrit = this.rng.next() < critThreshold;
      const critMult = isCrit ? 1.5 : 1.0;
      const randomFactor = 0.85 + this.rng.next() * 0.15;

      // Gen 7 official floor: Math.floor(2 * L / 5) + 2
      const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
      const baseDmg = Math.floor((levelFactor * effectivePower * (atk / def)) / 50) + 2;
      damage = Math.max(1, Math.floor(baseDmg * stab * typeEff * critMult * randomFactor));

      // Multi-hit moves handling
      const isMultiHit2to5 = [
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
      ].includes(moveId);
      const isMultiHit2 = [
        'double_kick',
        'twineedle',
        'bonemerang',
        'dual_chop',
        'gear_grind',
      ].includes(moveId);

      if (isMultiHit2to5 || isMultiHit2) {
        let maxHits = 2;
        if (isMultiHit2to5) {
          const roll = this.rng.next();
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
          const hitRandom = 0.85 + this.rng.next() * 0.15;
          const hitDmg = Math.max(1, Math.floor(baseDmg * stab * typeEff * critMult * hitRandom));
          totalDmg += hitDmg;
          simDefenderHp -= hitDmg;
          hits++;
        }
        damage = totalDmg;
        hitsCount = hits;
        secMsg += ` Hit ${hits} time(s)!`;
      }

      if (typeEff > 1.5) effText = ' It was super effective!';
      else if (typeEff < 0.8) effText = ' It was not very effective...';

      if (isCrit) effText += ' A critical hit!';
    }

    // Apply damage and calculate actual damage dealt (capped at defender's current HP)
    const prevDefenderHp = defender.currentHp;
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    const actualDamage = prevDefenderHp - defender.currentHp;
    const defenderFainted = defender.currentHp <= 0;
    if (defenderFainted) {
      defender.isFainted = true;
    }

    // Fire moves thaw frozen defender if damage is dealt
    if (defender.status === 'freeze' && move.type === 'Fire' && actualDamage > 0) {
      defender.status = 'none';
      secMsg += ` ${defender.name} thawed out!`;
    }

    let attackerFainted = false;

    // Drain effect (capped to actual damage dealt)
    if (move.drainPercent && move.drainPercent > 0) {
      const drained = Math.max(1, Math.floor(actualDamage * move.drainPercent));
      attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + drained);
      secMsg += ` ${defender.name} had its energy drained!`;
    }

    // Recoil effect (capped to actual damage dealt, except Struggle which is 25% of max HP)
    if (isStruggle) {
      const recoil = Math.max(1, Math.floor(attacker.maxHp * 0.25));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      secMsg += ` ${attacker.name} is hit with recoil!`;
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        attackerFainted = true;
      }
    } else if (move.recoilPercent && move.recoilPercent > 0) {
      const recoil = Math.max(1, Math.floor(actualDamage * move.recoilPercent));
      attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
      secMsg += ` ${attacker.name} is hit with recoil!`;
      if (attacker.currentHp <= 0) {
        attacker.isFainted = true;
        attackerFainted = true;
      }
    } else if (moveId === 'explosion' || moveId === 'self_destruct') {
      attacker.currentHp = 0;
      attacker.isFainted = true;
      attackerFainted = true;
      secMsg += ` ${attacker.name} fainted!`;
    }

    // Secondary effects on surviving defender
    if (!defenderFainted) {
      // Secondary status effect
      if (move.statusEffect) {
        const target = move.statusEffect.target === 'self' ? attacker : defender;
        const chance = Math.max(0, Math.min(1, move.statusEffect.chance));
        const immunityMessage = this.getStatusImmunity(target, move.statusEffect.condition);
        if (target.status === 'none' && !immunityMessage && this.rng.next() < chance) {
          target.status = move.statusEffect.condition;
          target.statusTurns = 0;
          if (target.status === 'sleep') target.sleepTurns = this.rng.nextInt(1, 3);
          secMsg += ` ${target.name} was inflicted with ${move.statusEffect.condition}!`;
        }
      }

      // Secondary stat changes
      if (move.statChanges && move.statChanges.length > 0) {
        for (const sc of move.statChanges) {
          const chance = Math.max(0, Math.min(1, sc.chance ?? 1));
          if (this.rng.next() >= chance) continue;
          const target = sc.target === 'self' ? attacker : defender;
          const stages = target.statStages!;
          const prev = stages[sc.stat];
          stages[sc.stat] = Math.max(-6, Math.min(6, prev + sc.stages));
          const change = stages[sc.stat] - prev;

          if (change > 1) secMsg += ` ${target.name}'s ${sc.stat} sharply rose!`;
          else if (change === 1) secMsg += ` ${target.name}'s ${sc.stat} rose!`;
          else if (change === -1) secMsg += ` ${target.name}'s ${sc.stat} fell!`;
          else if (change < -1) secMsg += ` ${target.name}'s ${sc.stat} harshly fell!`;
        }
      }
    }

    const moveDisplayName = getMoveDisplayName(move);
    return {
      attackerName: attacker.name,
      moveName: moveDisplayName,
      damage,
      typeEffectiveness: typeEff,
      isCritical: isCrit,
      defenderFainted,
      attackerFainted,
      hitsCount,
      message: `${statusPrefix}${attacker.name} used ${moveDisplayName}!${effText}${secMsg}`,
    };
  }

  public getFirstAttacker(playerMove: BattleMove, enemyMove: BattleMove): 'player' | 'enemy' {
    const pPri = playerMove.priority ?? 0;
    const ePri = enemyMove.priority ?? 0;
    if (pPri !== ePri) {
      return pPri > ePri ? 'player' : 'enemy';
    }

    const pSpeed =
      this.playerPokemon.stats.speed *
      getStatMultiplier(this.playerPokemon.statStages?.speed ?? 0) *
      (this.playerPokemon.status === 'paralysis' ? 0.5 : 1.0);

    const eSpeed =
      this.enemyPokemon.stats.speed *
      getStatMultiplier(this.enemyPokemon.statStages?.speed ?? 0) *
      (this.enemyPokemon.status === 'paralysis' ? 0.5 : 1.0);

    if (pSpeed === eSpeed) {
      // 50/50 random speed tie
      return this.rng.next() < 0.5 ? 'player' : 'enemy';
    }

    return pSpeed > eSpeed ? 'player' : 'enemy';
  }

  public getEnemyAction(): BattleMove {
    const validMoves = this.enemyPokemon.moves.filter((m) => m.pp > 0);
    if (validMoves.length > 0) {
      const idx = this.rng.nextInt(0, validMoves.length - 1);
      return validMoves[idx];
    }
    // All moves depleted: Struggle
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

    // Status condition catch bonus: Sleep/Freeze x2.0, Paralysis/Poison/Burn x1.5
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

    // Official catch rate formula with ballMultiplier & statusBonus
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

    // Gen 3/4/7 standard fourth root (power 0.25)
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
