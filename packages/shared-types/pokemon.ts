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
