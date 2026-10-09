import type {
  PokemonType,
  PokemonStats,
  PokemonStatValues,
  NatureName,
  MoveCategory,
  MoveStatChange,
  MoveStatusEffect,
  BattleEvent,
  BattleEventType,
  BattlerSide,
  MoveDeclaredEvent,
  RechargeHinderedEvent,
  StatusHinderedEvent,
  StatusCuredEvent,
  ProtectActivatedEvent,
  ProtectBlockedEvent,
  ChargeBeginEvent,
  SemiInvulnerableEnterEvent,
  SemiInvulnerableMissEvent,
  AccuracyMissEvent,
  TypeImmuneEvent,
  DamageDealtEvent,
  MultiHitCompletedEvent,
  HpRestoredEvent,
  RecoilDamageEvent,
  StatStageChangedEvent,
  StatusInflictedEvent,
  FaintedEvent,
  DestinyBondTriggeredEvent,
  EndTurnDamageEvent,
  AbilityTriggeredEvent,
} from '@pokemon/shared-types';

export type {
  PokemonType,
  PokemonStats,
  PokemonStatValues,
  NatureName,
  MoveCategory,
  MoveStatChange,
  MoveStatusEffect,
  BattleEvent,
  BattleEventType,
  BattlerSide,
  MoveDeclaredEvent,
  RechargeHinderedEvent,
  StatusHinderedEvent,
  StatusCuredEvent,
  ProtectActivatedEvent,
  ProtectBlockedEvent,
  ChargeBeginEvent,
  SemiInvulnerableEnterEvent,
  SemiInvulnerableMissEvent,
  AccuracyMissEvent,
  TypeImmuneEvent,
  DamageDealtEvent,
  MultiHitCompletedEvent,
  HpRestoredEvent,
  RecoilDamageEvent,
  StatStageChangedEvent,
  StatusInflictedEvent,
  FaintedEvent,
  DestinyBondTriggeredEvent,
  EndTurnDamageEvent,
  AbilityTriggeredEvent,
};

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
  descriptionVi?: string;
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
  ability?: string;
  isShiny?: boolean;
  types: PokemonType[];
  level: number;
  currentHp: number;
  maxHp: number;
  stats: PokemonStats;
  ivs?: PokemonStatValues;
  evs?: PokemonStatValues;
  nature?: NatureName;
  statStages?: StatStages;
  status?: StatusCondition;
  critStage?: number;
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
  heldItem?: string | null;
  lastConsumedItem?: string | null;
  weight?: number;
  faintedAlliesCount?: number;
  flashFireBoost?: boolean;
  // Multi-turn, Protect & Status combat states
  chargingMove?: {
    move: BattleMove;
    turn: number;
    semiInvulnerable?: 'flying' | 'underground' | 'underwater' | 'high';
  };
  semiInvulnerable?: 'flying' | 'underground' | 'underwater' | 'high';
  mustRecharge?: boolean;
  isProtected?: boolean;
  protectSuccessiveUses?: number;
  isSeeded?: boolean;
  destinyBond?: boolean;
  // Volatile statuses & round flags
  isFlinched?: boolean;
  confusionTurns?: number;
  hasActedThisRound?: boolean;
  firstTurnInBattle?: boolean;
  hasAquaRing?: boolean;
  isIngrained?: boolean;
  safeguardTurns?: number;
  // Trapping & Binding
  isTrapped?: boolean;
  trappedBy?: BattlerSide;
  boundStatus?: BoundStatus;
  // Special move volatile statuses
  tauntTurns?: number;
  isTormented?: boolean;
  disabledMove?: {
    moveId: string;
    turnsLeft: number;
  };
  encore?: {
    moveId: string;
    turnsLeft: number;
  };
  throatChopTurns?: number;
  uproarTurns?: number;
  lastUsedMoveId?: string;
}

export interface BoundStatus {
  moveId: string;
  moveName: string;
  sourceSide: BattlerSide;
  turnsLeft: number;
}

export interface BattleSideHazards {
  stealthRock?: boolean;
  spikes?: number;
  toxicSpikes?: number;
  stickyWeb?: boolean;
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
  weather?: {
    type: 'none' | 'sun' | 'rain' | 'sandstorm' | 'hail';
    turnsLeft: number;
  };
  terrain?: {
    type: 'none' | 'electric' | 'grassy' | 'misty' | 'psychic';
    turnsLeft: number;
  };
  playerHazards?: BattleSideHazards;
  enemyHazards?: BattleSideHazards;
  pledgeCombo?: boolean;
}
