import type { PokemonType } from '@pokemon/shared-types';
import type { BattleMove } from './types';
import rawMovesData from '@pokemon/game-data/moves-db.json';

export const MOVES_DB: Record<string, BattleMove> = (
  rawMovesData as { moves: Record<string, BattleMove> }
).moves;

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

export function getMovesForSpecies(speciesKey: string, types: PokemonType[]): BattleMove[] {
  const moveIds = SPECIES_MOVESETS[speciesKey.toUpperCase()];
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
