import type {
  PokemonType,
  PokemonStats,
  MoveCategory,
  MoveStatChange,
  MoveStatusEffect,
} from '@pokemon/shared-types';

export type { MoveCategory, MoveStatChange, MoveStatusEffect };

export interface BattleMove {
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
  drainPercent?: number;
  recoilPercent?: number;
  highCrit?: boolean;
}

export type StatusCondition =
  'none' | 'paralysis' | 'burn' | 'poison' | 'toxic' | 'sleep' | 'freeze';

export interface StatStages {
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
  accuracy: number;
  evasion: number;
}

export interface BattlerPokemon {
  uid?: string;
  id: number;
  name: string;
  speciesKey: string;
  isShiny?: boolean;
  types: PokemonType[];
  level: number;
  currentHp: number;
  maxHp: number;
  stats: PokemonStats;
  statStages?: StatStages;
  status?: StatusCondition;
  sleepTurns?: number;
  statusTurns?: number;
  moves: BattleMove[];
  frontSprite: string;
  backSprite: string;
  iconSprite: string;
  cry?: string;
  gender: 'male' | 'female' | 'genderless';
  isFainted: boolean;
  catchRate: number;
  exp: number;
  maxExp: number;
  pokeball?: string;
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
  foregroundOverlay?: string;
}
