import { defaultRng, type RandomService } from '../../core/rng';

export interface PlayerPosition {
  gx: number;
  gy: number;
  direction: number;
}

export interface PlayerInventoryItem {
  id: string;
  count: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  money: number;
  badges: string[];
  playTimeSeconds: number;
  pokedexSeenCount: number;
  pokedexCaughtCount: number;
  inventory: Record<string, number>;
  position: PlayerPosition;
}

export function createDefaultPlayerProfile(
  name = 'Red',
  gender: 'male' | 'female' = 'male',
  rng: RandomService = defaultRng
): PlayerProfile {
  return {
    id: `trainer_${Date.now()}_${rng.nextInt(1000, 9999)}`,
    name,
    gender,
    money: 3000,
    badges: [],
    playTimeSeconds: 0,
    pokedexSeenCount: 1,
    pokedexCaughtCount: 1,
    inventory: {
      POKEBALL: 20,
      GREATBALL: 5,
      ULTRABALL: 2,
      MASTERBALL: 1,
      POTION: 10,
      SUPERPOTION: 5,
      REVIVE: 3,
      RARECANDY: 3,
      ORANBERRY: 10,
      SITRUSBERRY: 5,
      BICYCLE: 1,
      TOWNMAP: 1,
      TM01: 1,
      XATTACK: 3,
    },
    position: {
      gx: 0,
      gy: 0,
      direction: 0,
    },
  };
}
