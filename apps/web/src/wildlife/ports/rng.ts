export interface WildlifeRng {
  hash(seed: number, ...inputs: number[]): number;
}
