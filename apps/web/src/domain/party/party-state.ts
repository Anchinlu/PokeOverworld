/**
 * Party Domain State
 * Represents Pokémon instances stored in the player's active party (up to 6 Pokémon).
 */

import type {
  PokemonType,
  PokemonStats,
  PokemonStatValues,
  NatureName,
} from '@pokemon/shared-types';
import type { BattleMove, StatusCondition, BattlerPokemon } from '../../battle/types';
import { pokemonCatalog } from '../../data';
import { getMovesForSpecies } from '../../battle/moves-db';
import { POKEMON_ASSETS, normalizeBallKey } from '../../assets';
import { defaultRng, type RandomService } from '../../core/rng';
import {
  calculatePokemonStats,
  createDefaultIvs,
  createRandomIvs,
  createDefaultEvs,
  ALL_NATURES,
} from './pokemon-stats';
import { normalizeGrowthRate, getExpToNextLevel } from '../pokemon/pokemon-exp';

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
  ivs: PokemonStatValues;
  evs: PokemonStatValues;
  nature: NatureName;
  status: StatusCondition;
  types: PokemonType[];
  ability?: string;
  gender: 'male' | 'female' | 'genderless';
  moves: BattleMove[];
  heldItem?: string | null;
  ballCaught: string;
  isFainted: boolean;
  caughtTime: number;
  caughtLevel: number;
  taughtTmMoves?: string[];
}

export interface PartyState {
  pokemon: PartyPokemon[];
  selectedIndex: number;
  swapSourceIndex: number | null;
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
    ability?: string;
    rng?: RandomService;
    ivs?: Partial<PokemonStatValues> | 'perfect' | 'random';
    evs?: Partial<PokemonStatValues>;
    nature?: NatureName;
    taughtTmMoves?: string[];
  }
): PartyPokemon {
  const data =
    pokemonCatalog.getBySpeciesKey(speciesKey) ?? pokemonCatalog.getBySpeciesKey('PIKACHU')!;
  const activeRng = options?.rng ?? defaultRng;

  // 1. Resolve IVs
  let ivs: PokemonStatValues;
  if (options?.ivs === 'perfect') {
    ivs = createDefaultIvs(31);
  } else if (options?.ivs && typeof options.ivs === 'object') {
    ivs = { ...createRandomIvs(activeRng), ...options.ivs };
  } else {
    // Canonical Pokémon mechanic: wild/newly acquired Pokémon have random IVs (0–31) per stat!
    ivs = createRandomIvs(activeRng);
  }

  // 2. Resolve EVs
  const evs: PokemonStatValues = {
    ...createDefaultEvs(),
    ...(options?.evs ?? {}),
  };

  // 3. Resolve Nature
  const nature: NatureName =
    options?.nature ?? ALL_NATURES[activeRng.nextInt(0, ALL_NATURES.length - 1)];

  // 4. Calculate accurate core stats
  const stats = calculatePokemonStats(data.stats, level, ivs, evs, nature);
  const maxHp = stats.hp;

  const moves = getMovesForSpecies(data.speciesKey, data.types, level);
  const growthRate = normalizeGrowthRate(data.growthRate);
  const maxExp = getExpToNextLevel(growthRate, level);

  return {
    uid: `pk_${Date.now()}_${activeRng.nextInt(100000, 999999).toString(36)}`,
    speciesId: data.id,
    speciesKey: data.speciesKey,
    name: data.name,
    nickname: options?.nickname,
    isShiny: options?.isShiny ?? false,
    level,
    exp: 0,
    maxExp,
    currentHp: maxHp,
    maxHp,
    stats,
    ivs,
    evs,
    nature,
    status: 'none',
    types: [...data.types],
    ability: options?.ability ?? data.ability ?? 'none',
    gender: options?.gender ?? (activeRng.next() < 0.5 ? 'male' : 'female'),
    moves,
    heldItem: options?.heldItem ?? null,
    ballCaught: options?.ballCaught ?? 'POKÉ BALL',
    isFainted: false,
    caughtTime: Date.now(),
    caughtLevel: level,
    taughtTmMoves: options?.taughtTmMoves ? [...options.taughtTmMoves] : [],
  };
}

/**
 * Recalculates stats for a PartyPokemon using its current IVs, EVs, and Nature.
 * Used upon level-up, Rare Candy usage, and Vitamin stat boosting.
 */
export function recalculatePartyPokemonStats(
  pokemon: PartyPokemon,
  newLevel?: number
): { oldStats: PokemonStats; newStats: PokemonStats; hpGained: number } {
  const species =
    pokemonCatalog.getBySpeciesKey(pokemon.speciesKey) ??
    pokemonCatalog.getBySpeciesKey('PIKACHU')!;
  const oldStats = { ...pokemon.stats };
  const oldMaxHp = pokemon.maxHp;

  if (newLevel !== undefined) {
    pokemon.level = Math.max(1, Math.min(100, Math.floor(newLevel)));
    const growthRate = normalizeGrowthRate(species.growthRate);
    pokemon.maxExp = getExpToNextLevel(growthRate, pokemon.level);
  }

  // Ensure IVs/EVs/Nature exist (for migrated saves)
  if (!pokemon.ivs) pokemon.ivs = createRandomIvs(defaultRng);
  if (!pokemon.evs) pokemon.evs = createDefaultEvs();
  if (!pokemon.nature) pokemon.nature = ALL_NATURES[defaultRng.nextInt(0, ALL_NATURES.length - 1)];

  const newStats = calculatePokemonStats(
    species.stats,
    pokemon.level,
    pokemon.ivs,
    pokemon.evs,
    pokemon.nature
  );

  pokemon.stats = newStats;
  pokemon.maxHp = newStats.hp;

  const hpDiff = newStats.hp - oldMaxHp;
  if (hpDiff > 0) {
    pokemon.currentHp = Math.min(newStats.hp, pokemon.currentHp + hpDiff);
  } else if (pokemon.currentHp > newStats.hp) {
    pokemon.currentHp = newStats.hp;
  }

  return { oldStats, newStats, hpGained: Math.max(0, hpDiff) };
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
    ability:
      pokemon.ability ?? pokemonCatalog.getBySpeciesKey(pokemon.speciesKey)?.ability ?? 'none',
    isShiny: pokemon.isShiny,
    types: [...pokemon.types],
    level: pokemon.level,
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    stats: { ...pokemon.stats },
    ivs: pokemon.ivs ? { ...pokemon.ivs } : undefined,
    evs: pokemon.evs ? { ...pokemon.evs } : undefined,
    nature: pokemon.nature,
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
    heldItem: pokemon.heldItem ?? null,
  };
}

/**
 * Creates default initial starter party (Pikachu Lv 5).
 */
export function createDefaultParty(): PartyPokemon[] {
  return [createPartyPokemon('PIKACHU', 5)];
}
