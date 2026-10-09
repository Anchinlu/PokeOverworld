import type { PokemonType, PokemonLearnMove, PokemonSpeciesData } from '@pokemon/shared-types';
import type { BattleMove } from './types';
import rawMovesData from '@pokemon/game-data/moves-db.json';
import rawPokemonData from '@pokemon/game-data/pokemon-db.json';

export const MOVES_DB: Record<string, BattleMove> = (
  rawMovesData as { moves: Record<string, BattleMove> }
).moves;

const speciesMovesMap = new Map<string, PokemonLearnMove[]>();
for (const p of Object.values(rawPokemonData.pokemon as Record<string, PokemonSpeciesData>)) {
  if (p.speciesKey && p.moves) {
    speciesMovesMap.set(p.speciesKey.toUpperCase(), p.moves);
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
  speciesKey: string,
  types: PokemonType[],
  level: number = 50
): BattleMove[] {
  const normKey = speciesKey.replace(/^wild_/i, '').toUpperCase();
  const learnset = speciesMovesMap.get(normKey);

  if (learnset && learnset.length > 0) {
    const eligible = learnset.filter((m) => m.level <= level);
    const pool = eligible.length > 0 ? eligible : learnset.slice(0, 4);
    const chosen = pool.slice(-4);

    const resolved = chosen
      .map((entry) => MOVES_DB[entry.moveId])
      .filter((m): m is BattleMove => Boolean(m))
      .map((m) => ({ ...m }));

    if (resolved.length > 0) {
      return resolved;
    }
  }

  const moveIds = SPECIES_MOVESETS[normKey];
  if (moveIds && moveIds.length > 0) {
    return moveIds
      .map((id) => MOVES_DB[id])
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
      if (!seen.has(entry.moveId)) {
        seen.add(entry.moveId);
        const moveData = MOVES_DB[entry.moveId];
        if (moveData) {
          result.push({
            move: { ...moveData },
            level: entry.level,
          });
        }
      }
    }
  }

  // Fallback to SPECIES_MOVESETS if none found
  if (result.length === 0) {
    const fallbackIds = SPECIES_MOVESETS[normKey] || ['tackle'];
    for (const id of fallbackIds) {
      if (!seen.has(id) && MOVES_DB[id]) {
        seen.add(id);
        result.push({
          move: { ...MOVES_DB[id] },
          level: 1,
        });
      }
    }
  }

  result.sort((a, b) => a.level - b.level);
  return result;
}

export function getAllMoves(): BattleMove[] {
  return Object.values(MOVES_DB);
}

export function getMoveById(id: string): BattleMove | undefined {
  const norm = id.toLowerCase().replace(/-/g, '_');
  return MOVES_DB[norm] || MOVES_DB[id];
}
