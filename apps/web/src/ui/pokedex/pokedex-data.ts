import type { PokemonSpeciesData } from '@pokemon/shared-types';
import { pokemonCatalog } from '../../data';

export function getPokedexEntries(): PokemonSpeciesData[] {
  const main = [...pokemonCatalog.getAll()];
  const forms = [...pokemonCatalog.getRegionalForms()];

  const baseOrder = new Map<string, number>();
  for (const p of main) {
    baseOrder.set(p.speciesKey.toUpperCase(), p.id);
  }

  return [...main, ...forms].sort((left, right) => {
    const leftBaseKey =
      (left as any).baseSpeciesKey?.toUpperCase() || left.speciesKey.toUpperCase();
    const rightBaseKey =
      (right as any).baseSpeciesKey?.toUpperCase() || right.speciesKey.toUpperCase();

    const leftBaseId = baseOrder.get(leftBaseKey) ?? left.id;
    const rightBaseId = baseOrder.get(rightBaseKey) ?? right.id;

    if (leftBaseId !== rightBaseId) {
      return leftBaseId - rightBaseId;
    }

    const leftIsForm = Boolean((left as any).region);
    const rightIsForm = Boolean((right as any).region);
    if (leftIsForm !== rightIsForm) {
      return leftIsForm ? 1 : -1;
    }

    return (left.id || 0) - (right.id || 0);
  });
}

export function getPokemonById(id: number): PokemonSpeciesData | undefined {
  return pokemonCatalog.getById(id);
}
