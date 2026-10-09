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

export class FixedSequenceRng implements BattleRng {
  private index = 0;

  constructor(private readonly sequence: number[]) {}

  public next(): number {
    if (this.sequence.length === 0) return 0.5;
    const val = this.sequence[this.index % this.sequence.length];
    this.index++;
    return val;
  }

  public nextInt(min: number, max: number): number {
    const val = this.next();
    return Math.floor(min + val * (max - min + 1));
  }
}

export const defaultBattleRng: BattleRng = new SeededBattleRng(0xba771e);
