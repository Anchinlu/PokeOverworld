import type { PokemonType, PokemonStats } from '@pokemon/shared-types';

export type MoveCategory = 'physical' | 'special' | 'status';

export interface BattleMove {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  description: string;
}

export interface BattlerPokemon {
  id: number;
  name: string;
  speciesKey: string;
  types: PokemonType[];
  level: number;
  currentHp: number;
  maxHp: number;
  stats: PokemonStats;
  moves: BattleMove[];
  frontSprite: string;
  backSprite: string;
  iconSprite: string;
  gender: 'male' | 'female' | 'genderless';
  isFainted: boolean;
  catchRate: number;
  exp: number;
  maxExp: number;
}

export type BattlePhase =
  | 'intro'
  | 'command_menu'
  | 'move_select'
  | 'player_attack'
  | 'enemy_attack'
  | 'throwing_ball'
  | 'ball_shaking'
  | 'caught'
  | 'fled'
  | 'player_fainted'
  | 'enemy_fainted'
  | 'victory'
  | 'ended';

export interface BattleEnvironment {
  background: string;
  enemyBase: string;
  playerBase: string;
}
