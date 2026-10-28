import type { PokemonType, PokemonLearnMove, PokemonSpeciesData } from '@pokemon/shared-types';
import type { BattleMove } from './types';
import rawMovesData from '@pokemon/game-data/moves-db.json';
import rawPokemonData from '@pokemon/game-data/pokemon-db.json';

export const MOVES_DB: Record<string, BattleMove> = (
  rawMovesData as unknown as { moves: Record<string, BattleMove> }
).moves;

/** Legacy learnset spellings kept for compatibility with imported data. */
export const MOVE_ID_ALIASES: Readonly<Record<string, string>> = {
  leechseed: 'leech_seed', sandattack: 'sand_attack', doubleslap: 'double_slap',
  featherdance: 'feather_dance', selfdestruct: 'self_destruct', highjumpkick: 'high_jump_kick',
  jumpkick: 'jump_kick', dragonbreath: 'dragon_breath', poisonpowder: 'poison_powder',
  sleeppowder: 'sleep_powder', thundershock: 'thunder_shock', extremespeed: 'extreme_speed',
  solarbeam: 'solar_beam', softboiled: 'soft_boiled', smellingsalts: 'smelling_salts',
  grasswhistle: 'grass_whistle',
};

export function normalizeMoveId(id: string): string {
  const normalized = id.toLowerCase().replace(/-/g, '_');
  return MOVE_ID_ALIASES[normalized] ?? normalized;
}

function resolveMove(id: string): BattleMove | undefined {
  const canonicalId = normalizeMoveId(id);
  const move = MOVES_DB[canonicalId] ?? MOVES_DB[id];
  return move ? { ...move, id: canonicalId } : undefined;
}

import regionalFormsRaw from '@pokemon/game-data/regional-forms.json';

const speciesMovesMap = new Map<string, PokemonLearnMove[]>();
for (const p of Object.values(rawPokemonData.pokemon as Record<string, PokemonSpeciesData>)) {
  if (p.speciesKey && p.moves) {
    speciesMovesMap.set(p.speciesKey.toUpperCase(), p.moves);
  }
}
for (const form of Object.values(((regionalFormsRaw as any).forms || {}) as Record<string, any>)) {
  if (form.formKey && form.moves) {
    speciesMovesMap.set(form.formKey.toUpperCase(), form.moves);
  }
  if (form.assetKey && form.moves) {
    speciesMovesMap.set(form.assetKey.toUpperCase(), form.moves);
  }
}

export const SPECIES_MOVESETS: Record<string, string[]> = {
  PIKACHU: ['thunderbolt', 'quick_attack', 'iron_tail', 'thunder_shock'],
  PIDGEY: ['gust', 'quick_attack', 'tackle', 'wing_attack'],
  RATTATA: ['tackle', 'quick_attack', 'bite', 'hyper_fang'],
  CATERPIE: ['tackle', 'string_shot', 'bug_bite'],
  METAPOD: ['tackle', 'string_shot', 'harden'],
  WEEDLE: ['poison_sting', 'string_shot', 'bug_bite'],
  KAKUNA: ['poison_sting', 'string_shot', 'harden'],
  SPEAROW: ['peck', 'growl', 'gust', 'wing_attack'],
  BULBASAUR: ['vine_whip', 'tackle', 'growl', 'razor_leaf'],
  CHARMANDER: ['ember', 'scratch', 'growl', 'flamethrower'],
  SQUIRTLE: ['water_gun', 'tackle', 'tail_whip', 'bubble'],
};

export function getMovesForSpecies(
  speciesKey?: string,
  types: PokemonType[] = ['Normal'],
  level: number = 50
): BattleMove[] {
  const normKey = (speciesKey || 'PIKACHU').replace(/^wild_/i, '').toUpperCase();
  let learnset = speciesMovesMap.get(normKey);
  if (!learnset) {
    const baseKey = normKey.split('_')[0];
    learnset = speciesMovesMap.get(baseKey);
  }

  if (learnset && learnset.length > 0) {
    const eligible = learnset.filter((m) => m.level <= level);
    const pool = eligible.length > 0 ? eligible : learnset.slice(0, 4);
    const chosen = pool.slice(-4);

    const resolved = chosen
      .map((entry) => resolveMove(entry.moveId))
      .filter((m): m is BattleMove => Boolean(m))
      .map((m) => ({ ...m }));

    if (resolved.length > 0) {
      return resolved;
    }
  }

  const moveIds = SPECIES_MOVESETS[normKey];
  if (moveIds && moveIds.length > 0) {
    return moveIds
      .map((id) => resolveMove(id))
      .filter((m): m is BattleMove => Boolean(m))
      .map((m) => ({ ...m }));
  }

  // Fallback moves based on types
  const list: BattleMove[] = [{ ...MOVES_DB['tackle'] }];
  const primaryType = types[0];
  if (primaryType === 'Fire' && MOVES_DB['ember']) list.push({ ...MOVES_DB['ember'] });
  else if (primaryType === 'Water' && MOVES_DB['water_gun'])
    list.push({ ...MOVES_DB['water_gun'] });
  else if (primaryType === 'Grass' && MOVES_DB['vine_whip'])
    list.push({ ...MOVES_DB['vine_whip'] });
  else if (primaryType === 'Electric' && MOVES_DB['thunder_shock'])
    list.push({ ...MOVES_DB['thunder_shock'] });
  else if (primaryType === 'Flying' && MOVES_DB['peck']) list.push({ ...MOVES_DB['peck'] });
  else if (primaryType === 'Bug' && MOVES_DB['bug_bite']) list.push({ ...MOVES_DB['bug_bite'] });
  else if (MOVES_DB['quick_attack']) list.push({ ...MOVES_DB['quick_attack'] });

  return list;
}

export interface AvailableMoveEntry {
  move: BattleMove;
  level: number;
  source?: 'level' | 'tm';
}

export function getAvailableLevelUpMoves(
  speciesKey: string,
  level: number = 100
): AvailableMoveEntry[] {
  const normKey = speciesKey.replace(/^wild_/i, '').toUpperCase();
  const learnset = speciesMovesMap.get(normKey);

  const seen = new Set<string>();
  const result: AvailableMoveEntry[] = [];

  if (learnset && learnset.length > 0) {
    const eligible = learnset.filter((m) => m.level <= level);
    for (const entry of eligible) {
      const canonicalId = normalizeMoveId(entry.moveId);
      if (!seen.has(canonicalId)) {
        seen.add(canonicalId);
        const moveData = resolveMove(entry.moveId);
        if (moveData) {
          result.push({
            move: { ...moveData },
            level: entry.level,
            source: 'level',
          });
        }
      }
    }
  }

  // Fallback to SPECIES_MOVESETS if none found
  if (result.length === 0) {
    const fallbackIds = SPECIES_MOVESETS[normKey] || ['tackle'];
    for (const id of fallbackIds) {
      const canonicalId = normalizeMoveId(id);
      const moveData = resolveMove(id);
      if (!seen.has(canonicalId) && moveData) {
        seen.add(canonicalId);
        result.push({
          move: { ...moveData },
          level: 1,
          source: 'level',
        });
      }
    }
  }

  result.sort((a, b) => a.level - b.level);
  return result;
}

/**
 * Returns all moves currently available for a Pokémon instance:
 * 1. All level-up moves eligible at its current level.
 * 2. All canonical moves taught to this specific Pokémon via TM/HM (permanently unlocked).
 * 3. Any active equipped move to prevent move loss when swapping.
 */
export function getAvailableMovesForPokemon(pokemon: {
  speciesKey: string;
  level: number;
  moves?: BattleMove[];
  taughtTmMoves?: string[];
}): AvailableMoveEntry[] {
  const pool: AvailableMoveEntry[] = getAvailableLevelUpMoves(
    pokemon.speciesKey,
    pokemon.level
  ).map((entry) => ({
    ...entry,
    source: 'level' as const,
  }));

  const seen = new Set<string>(pool.map((p) => normalizeMoveId(p.move.id)));

  // 1. Taught TM moves
  if (Array.isArray(pokemon.taughtTmMoves)) {
    for (const moveId of pokemon.taughtTmMoves) {
      const norm = normalizeMoveId(moveId);
      const moveData = resolveMove(moveId);
      if (moveData) {
        const existing = pool.find((p) => p.move.id.toLowerCase() === norm);
        if (existing) {
          existing.source = 'tm';
        } else if (!seen.has(norm)) {
          seen.add(norm);
          pool.push({
            move: { ...moveData },
            level: 0,
            source: 'tm',
          });
        }
      }
    }
  }

  // 2. Any currently equipped move not in pool (e.g. legacy/special moves)
  if (Array.isArray(pokemon.moves)) {
    for (const m of pokemon.moves) {
      if (m && m.id) {
        const norm = normalizeMoveId(m.id);
        if (!seen.has(norm)) {
          seen.add(norm);
          pool.push({
            move: { ...m },
            level: 0,
            source: 'tm',
          });
          if (pokemon.taughtTmMoves && !pokemon.taughtTmMoves.includes(m.id)) {
            pokemon.taughtTmMoves.push(m.id);
          }
        }
      }
    }
  }

  // Sort: Level-up moves first by level, then TM moves alphabetically by name
  pool.sort((a, b) => {
    const isTmA = a.source === 'tm';
    const isTmB = b.source === 'tm';
    if (!isTmA && !isTmB) {
      return a.level - b.level;
    }
    if (!isTmA && isTmB) {
      return -1;
    }
    if (isTmA && !isTmB) {
      return 1;
    }
    const nameA = a.move.nameVi || a.move.name;
    const nameB = b.move.nameVi || b.move.name;
    return nameA.localeCompare(nameB);
  });

  return pool;
}

export function getAllMoves(): BattleMove[] {
  return Object.values(MOVES_DB);
}

export function getMoveById(id: string): BattleMove | undefined {
  return resolveMove(id);
}

export function getMoveDisplayNames(move: {
  id?: string;
  name: string;
  nameVi?: string;
  nameEn?: string;
}): { nameVi: string; nameEn: string } {
  const db = (move.id && resolveMove(move.id)) || move;

  let vi = db.nameVi || move.nameVi || '';
  let en = db.nameEn || move.nameEn || '';

  // If vi is not set, check if db.name has "(...)" which usually contains the Vietnamese translation
  if (!vi) {
    const match = db.name.match(/\(([^)]+)\)/);
    if (match) {
      vi = match[1].trim();
    } else {
      vi = db.name.trim();
    }
  } else {
    // If vi itself has "(...)", strip it
    vi = vi.replace(/\s*\([^)]*\).*/, '').trim();
  }

  // If en is not set, extract from db.name by stripping whatever is inside "(...)"
  if (!en) {
    en = db.name.replace(/\s*\([^)]*\).*/, '').trim();
  } else {
    // If en still has "(...)", strip it
    en = en.replace(/\s*\([^)]*\).*/, '').trim();
  }

  // If en is identical to vi (case-insensitive), no need to display English
  if (en.toLowerCase() === vi.toLowerCase()) {
    en = '';
  }

  return { nameVi: vi, nameEn: en };
}
