import type { PokemonSpeciesData } from '@pokemon/shared-types';
import { pokemonCatalog } from '../../data';

export function getPokedexEntries(): PokemonSpeciesData[] {
  return [...pokemonCatalog.getAll()].sort((left, right) => left.id - right.id);
}

export function getPokemonById(id: number): PokemonSpeciesData | undefined {
  return pokemonCatalog.getById(id);
}
