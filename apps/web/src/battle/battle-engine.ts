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
    private readonly rng: BattleRng = defaultBattleRng
  ) {
    this.playerPokemon = playerPokemon;
    this.enemyPokemon = enemyPokemon;
    this.environment = environment;
    this.message = `A wild ${enemyPokemon.name} appeared!`;

    this.ensureBattlerState(this.playerPokemon);
    this.ensureBattlerState(this.enemyPokemon);
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
  }

  public executeAttack(
    attacker: BattlerPokemon,
    defender: BattlerPokemon,
    move: BattleMove
  ): TurnResult {
    this.ensureBattlerState(attacker);
    this.ensureBattlerState(defender);

    if (move.pp > 0) {
      move.pp--;
    }

    // 1. Status hindrance check (Sleep, Freeze, Paralysis)
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
      }
    }

    if (attacker.status === 'freeze') {
      if (this.rng.next() < 0.2) {
        attacker.status = 'none';
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

    // 2. Accuracy / Evasion Check
    const accStage = attacker.statStages!.accuracy;
    const evaStage = defender.statStages!.evasion;
    const requiresAccCheck =
      move.accuracy > 0 && (move.accuracy < 100 || accStage !== 0 || evaStage !== 0);

    if (requiresAccCheck) {
      const accMult = getAccuracyMultiplier(accStage, evaStage);
      const effectiveAcc = move.accuracy * accMult;
      if (this.rng.next() * 100 > effectiveAcc) {
        return {
          attackerName: attacker.name,
          moveName: move.name,
          damage: 0,
          typeEffectiveness: 1.0,
          isCritical: false,
          isMiss: true,
          defenderFainted: false,
          message: `${attacker.name} used ${move.name}! But it missed!`,
        };
      }
    }

    // 3. Status move handling
    if (move.category === 'status') {
      let extraMsg = '';

      // Healing
      if (move.healPercent && move.healPercent > 0) {
        const heal = Math.floor(attacker.maxHp * move.healPercent);
        attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + heal);
        extraMsg += ` ${attacker.name} restored its HP!`;
      }

      // Stat stages
      if (move.statChanges && move.statChanges.length > 0) {
        for (const sc of move.statChanges) {
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
      if (move.statusEffect) {
        const target = move.statusEffect.target === 'self' ? attacker : defender;
        if (target.status === 'none') {
          target.status = move.statusEffect.condition;
          if (target.status === 'sleep') target.sleepTurns = this.rng.nextInt(1, 3);
          extraMsg += ` ${target.name} was inflicted with ${move.statusEffect.condition}!`;
        }
      }

      const mainMsg = `${attacker.name} used ${move.name}!${extraMsg || ' It affected the battle!'}`;
      return {
        attackerName: attacker.name,
        moveName: move.name,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: mainMsg,
      };
    }

    // 4. Damaging attack handling
    const typeEff = getTypeEffectiveness(move.type, defender.types);
    if (typeEff === 0) {
      return {
        attackerName: attacker.name,
        moveName: move.name,
        damage: 0,
        typeEffectiveness: 0,
        isCritical: false,
        defenderFainted: false,
        message: `${attacker.name} used ${move.name}! It had no effect on ${defender.name}!`,
      };
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

    const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
    const critRate = move.highCrit ? 0.25 : 0.08;
    const isCrit = this.rng.next() < critRate;
    const critMult = isCrit ? 1.5 : 1.0;
    const randomFactor = 0.85 + this.rng.next() * 0.15;

    const baseDmg = Math.floor(
      (((2 * attacker.level) / 5 + 2) * move.power * (atk / def)) / 50 + 2
    );
    const damage = Math.max(1, Math.floor(baseDmg * stab * typeEff * critMult * randomFactor));

    defender.currentHp = Math.max(0, defender.currentHp - damage);
    const defenderFainted = defender.currentHp <= 0;
    if (defenderFainted) {
      defender.isFainted = true;
    }

    let effText = '';
    if (typeEff > 1.5) effText = ' It was super effective!';
    else if (typeEff < 0.8) effText = ' It was not very effective...';

    const critText = isCrit ? ' A critical hit!' : '';

    return {
      attackerName: attacker.name,
      moveName: move.name,
      damage,
      typeEffectiveness: typeEff,
      isCritical: isCrit,
      defenderFainted,
      message: `${attacker.name} used ${move.name}!${effText}${critText}`,
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

    return pSpeed >= eSpeed ? 'player' : 'enemy';
  }

  public getEnemyAction(): BattleMove {
    const validMoves = this.enemyPokemon.moves.filter((m) => m.pp > 0);
    const moves = validMoves.length > 0 ? validMoves : this.enemyPokemon.moves;
    const idx = this.rng.nextInt(0, moves.length - 1);
    return moves[idx];
  }

  public tryCatchPokemon(): CatchResult {
    if (this.ballsCount <= 0) {
      return {
        caught: false,
        shakes: 0,
        message: 'You have no Poké Balls left!',
      };
    }

    this.ballsCount--;

    // Gen 3/4 catch rate calculation
    const maxHp = this.enemyPokemon.maxHp;
    const curHp = Math.max(1, this.enemyPokemon.currentHp);
    const rate = this.enemyPokemon.catchRate;
    // Poke Ball multiplier = 1.0
    const a = Math.floor(((3 * maxHp - 2 * curHp) * rate) / (3 * maxHp));

    if (a >= 255) {
      return {
        caught: true,
        shakes: 3,
        message: `Gotcha! ${this.enemyPokemon.name} was caught!`,
      };
    }

    const b = Math.floor(65536 / Math.pow(255 / Math.max(1, a), 0.1875));
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
        message: `Gotcha! ${this.enemyPokemon.name} was caught!`,
      };
    }

    const escapeMessages = [
      'Oh no! The Pokémon broke free!',
      'Aww! It appeared to be caught!',
      'Aargh! Almost had it!',
      'Gah! It was so close, too!',
    ];

    return {
      caught: false,
      shakes,
      message: escapeMessages[shakes],
    };
  }

  public tryFlee(): boolean {
    const pSpeed = this.playerPokemon.stats.speed;
    const eSpeed = this.enemyPokemon.stats.speed;
    if (pSpeed >= eSpeed) return true;
    const odds = Math.floor((pSpeed * 128) / eSpeed + 30);
    return this.rng.nextInt(0, 255) < odds;
  }
}
