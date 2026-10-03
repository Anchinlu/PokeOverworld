import type { BattlerPokemon, BattleMove, BattlePhase, BattleEnvironment } from './types';
import { getTypeEffectiveness } from './type-chart';
import { defaultBattleRng, type BattleRng } from './battle-rng';

export interface TurnResult {
  attackerName: string;
  moveName: string;
  damage: number;
  typeEffectiveness: number;
  isCritical: boolean;
  defenderFainted: boolean;
  message: string;
}

export interface CatchResult {
  caught: boolean;
  shakes: number;
  message: string;
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
  }

  public executeAttack(
    attacker: BattlerPokemon,
    defender: BattlerPokemon,
    move: BattleMove
  ): TurnResult {
    if (move.pp > 0) {
      move.pp--;
    }

    if (move.category === 'status') {
      return {
        attackerName: attacker.name,
        moveName: move.name,
        damage: 0,
        typeEffectiveness: 1.0,
        isCritical: false,
        defenderFainted: false,
        message: `${attacker.name} used ${move.name}! ${defender.name}'s stats were affected!`,
      };
    }

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
    const atk = isSpecial ? attacker.stats.spAtk : attacker.stats.attack;
    const def = isSpecial ? defender.stats.spDef : defender.stats.defense;
    const stab = attacker.types.includes(move.type) ? 1.5 : 1.0;
    const isCrit = this.rng.next() < 0.08;
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
