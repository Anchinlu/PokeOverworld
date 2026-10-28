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

export interface QuestState {
  questId: string;
  stage: number;
  completed: boolean;
  updatedAt: number;
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
  pokedexSeenSpecies?: string[];
  pokedexCaughtSpecies?: string[];
  inventory: Record<string, number>;
  position: PlayerPosition;
  storyFlags?: Record<string, boolean | number | string>;
  quests?: Record<string, QuestState>;
  defeatedTrainers?: string[];
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
    pokedexSeenCount: 0,
    pokedexCaughtCount: 0,
    pokedexSeenSpecies: [],
    pokedexCaughtSpecies: [],
    inventory: {},
    position: {
      gx: 0,
      gy: 0,
      direction: 0,
    },
    storyFlags: {},
    quests: {},
    defeatedTrainers: [],
  };
}
