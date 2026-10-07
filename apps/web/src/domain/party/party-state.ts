/**
 * Party Domain State
 * Represents Pokémon instances stored in the player's active party (up to 6 Pokémon).
 */

import type { PokemonType, PokemonStats } from '@pokemon/shared-types';
import type { BattleMove, StatusCondition, BattlerPokemon } from '../../battle/types';
import { pokemonCatalog } from '../../data';
import { getMovesForSpecies } from '../../battle/moves-db';
import { POKEMON_ASSETS, normalizeBallKey } from '../../assets';
import { defaultRng, type RandomService } from '../../core/rng';

export const MAX_PARTY_SIZE = 6;

export interface PartyPokemon {
  uid: string;
  speciesId: number;
  speciesKey: string;
  name: string;
  nickname?: string;
  isShiny?: boolean;
  level: number;
  exp: number;
  maxExp: number;
  currentHp: number;
  maxHp: number;
  stats: PokemonStats;
  status: StatusCondition;
  types: PokemonType[];
  gender: 'male' | 'female' | 'genderless';
  moves: BattleMove[];
  heldItem?: string | null;
  ballCaught: string;
  isFainted: boolean;
  caughtTime: number;
  caughtLevel: number;
}

export interface PartyState {
  pokemon: PartyPokemon[];
  selectedIndex: number;
  swapSourceIndex: number | null;
}

function calculateHp(base: number, level: number): number {
  return Math.floor(((2 * base + 31) * level) / 100) + level + 10;
}

function calculateStat(base: number, level: number): number {
  return Math.floor(((2 * base + 31) * level) / 100) + 5;
}

/**
 * Creates a brand new PartyPokemon instance from speciesKey and level.
 */
export function createPartyPokemon(
  speciesKey: string,
  level = 5,
  options?: {
    nickname?: string;
    isShiny?: boolean;
    gender?: 'male' | 'female' | 'genderless';
    ballCaught?: string;
    heldItem?: string | null;
    rng?: RandomService;
  }
): PartyPokemon {
  const data =
    pokemonCatalog.getBySpeciesKey(speciesKey) ?? pokemonCatalog.getBySpeciesKey('PIKACHU')!;
  const maxHp = calculateHp(data.stats.hp, level);

  const stats: PokemonStats = {
    hp: maxHp,
    attack: calculateStat(data.stats.attack, level),
    defense: calculateStat(data.stats.defense, level),
    spAtk: calculateStat(data.stats.spAtk, level),
    spDef: calculateStat(data.stats.spDef, level),
    speed: calculateStat(data.stats.speed, level),
    total: data.stats.total,
  };

  const moves = getMovesForSpecies(data.speciesKey, data.types, level);
  const activeRng = options?.rng ?? defaultRng;

  return {
    uid: `pk_${Date.now()}_${activeRng.nextInt(100000, 999999).toString(36)}`,
    speciesId: data.id,
    speciesKey: data.speciesKey,
    name: data.name,
    nickname: options?.nickname,
    isShiny: options?.isShiny ?? false,
    level,
    exp: 0,
    maxExp: level * level * 10,
    currentHp: maxHp,
    maxHp,
    stats,
    status: 'none',
    types: [...data.types],
    gender: options?.gender ?? (activeRng.next() < 0.5 ? 'male' : 'female'),
    moves,
    heldItem: options?.heldItem ?? null,
    ballCaught: options?.ballCaught ?? 'POKÉ BALL',
    isFainted: false,
    caughtTime: Date.now(),
    caughtLevel: level,
  };
}

/**
 * Converts a PartyPokemon into a BattlerPokemon ready for battle.
 */
export function partyPokemonToBattler(pokemon: PartyPokemon): BattlerPokemon {
  return {
    uid: pokemon.uid,
    id: pokemon.speciesId,
    name: pokemon.nickname || pokemon.name,
    speciesKey: pokemon.speciesKey,
    isShiny: pokemon.isShiny,
    types: [...pokemon.types],
    level: pokemon.level,
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    stats: { ...pokemon.stats },
    statStages: {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    status: pokemon.status,
    sleepTurns: pokemon.status === 'sleep' ? Math.max(1, Math.floor(Math.random() * 3) + 1) : 0,
    statusTurns: 0,
    moves: pokemon.moves.map((m) => ({ ...m })),
    frontSprite: POKEMON_ASSETS.getFrontSprite(pokemon.speciesKey, pokemon.isShiny),
    backSprite: POKEMON_ASSETS.getBackSprite(pokemon.speciesKey, pokemon.isShiny),
    iconSprite: POKEMON_ASSETS.getIconSprite(pokemon.speciesKey, pokemon.isShiny),
    gender: pokemon.gender,
    cry: pokemonCatalog.getBySpeciesKey(pokemon.speciesKey)?.sprites?.cry,
    isFainted: pokemon.currentHp <= 0,
    catchRate: 45,
    exp: pokemon.exp,
    maxExp: pokemon.maxExp,
    pokeball: normalizeBallKey(pokemon.ballCaught),
  };
}

/**
 * Creates default initial starter party (Pikachu Lv 5).
 */
export function createDefaultParty(): PartyPokemon[] {
  return [createPartyPokemon('PIKACHU', 5)];
}
