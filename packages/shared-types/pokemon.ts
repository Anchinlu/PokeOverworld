export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Grass'
  | 'Electric'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Steel'
  | 'Dark'
  | 'Fairy';

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  total: number;
}

export interface PokemonSprites {
  follower: string;
  front: string;
  back: string;
  icon: string;
}

export interface PokemonSpeciesData {
  id: number;
  name: string;
  speciesKey: string;
  types: PokemonType[];
  stats: PokemonStats;
  sprites: PokemonSprites;
  // Pokédex research data (optional, scraped from pokemondb.net)
  species?: string;
  height?: number;
  weight?: number;
  ability?: string;
  catchRate?: number;
  baseFriendship?: number;
  growthRate?: string;
  evYield?: string;
  eggGroups?: string;
  genderRatio?: string;
}

export interface PokemonDatabase {
  generation: number;
  count: number;
  source: string;
  pokemon: Record<string, PokemonSpeciesData>;
}

export type MoveCategory = 'physical' | 'special' | 'status';

export interface MoveStatChange {
  stat: 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed' | 'accuracy' | 'evasion';
  stages: number;
  target: 'self' | 'opponent';
  chance?: number;
}

export interface MoveStatusEffect {
  condition: 'paralysis' | 'burn' | 'poison' | 'toxic' | 'sleep' | 'freeze';
  target: 'self' | 'opponent';
  chance: number;
}

export interface MoveData {
  id: string;
  name: string;
  nameEn?: string;
  nameVi?: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  description: string;
  descriptionEn?: string;
  priority?: number;
  statChanges?: MoveStatChange[];
  statusEffect?: MoveStatusEffect;
  healPercent?: number;
  highCrit?: boolean;
}

export interface MovesDatabase {
  count: number;
  moves: Record<string, MoveData>;
}
