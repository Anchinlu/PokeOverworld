import { RandomService } from '../core/rng';

/** Random source used by battle rules so outcomes can be replayed and tested. */
export interface BattleRng {
  next(): number;
  nextInt(min: number, max: number): number;
}

export class SeededBattleRng implements BattleRng {
  private readonly random: RandomService;

  constructor(seed: number) {
    this.random = new RandomService(seed);
  }

  public next(): number {
    return this.random.next();
  }

  public nextInt(min: number, max: number): number {
    return this.random.nextInt(min, max);
  }
}

export const defaultBattleRng: BattleRng = new SeededBattleRng(0xba771e);
