/**
 * Mulberry32 32-bit PRNG (Pseudo-Random Number Generator).
 * Fast, deterministic, and high quality for simulation and gameplay replay.
 */
export class RandomService {
  private state: number;

  constructor(seed = 101) {
    this.state = seed >>> 0;
  }

  public setSeed(seed: number): void {
    this.state = seed >>> 0;
  }

  /**
   * Generates a deterministic float in [0, 1).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer in [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a random element from an array.
   */
  public choice<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot choose from empty array.');
    }
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }
}

/** Default singleton instance for general runtime needs */
export const defaultRng = new RandomService(101);
