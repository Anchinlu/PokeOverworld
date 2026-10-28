import type { PokemonSpeciesData } from '@pokemon/shared-types';
import { pokemonCatalog } from '../../data';

export function filterPokemon(
  pokemon: readonly PokemonSpeciesData[],
  query: string
): PokemonSpeciesData[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...pokemon];

  return pokemon.filter((entry) => {
    const id = String(entry.id);
    const paddedId = id.padStart(3, '0');
    const baseKey = (entry as any).baseSpeciesKey;
    const basePkmn = baseKey ? pokemonCatalog.getBySpeciesKey(baseKey) : undefined;
    const baseId = basePkmn ? String(basePkmn.id) : '';
    const basePaddedId = baseId ? baseId.padStart(3, '0') : '';
    const region = ((entry as any).region || '').toLowerCase();

    return (
      id === normalized ||
      paddedId.includes(normalized) ||
      baseId === normalized ||
      basePaddedId.includes(normalized) ||
      entry.name.toLowerCase().includes(normalized) ||
      entry.speciesKey?.toLowerCase().includes(normalized) ||
      region.includes(normalized) ||
      entry.types.some((type) => type.toLowerCase().includes(normalized))
    );
  });
}
