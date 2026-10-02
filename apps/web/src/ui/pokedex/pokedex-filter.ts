import type { PokemonSpeciesData } from '@pokemon/shared-types';

export function filterPokemon(
  pokemon: readonly PokemonSpeciesData[],
  query: string
): PokemonSpeciesData[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...pokemon];

  return pokemon.filter((entry) => {
    const id = String(entry.id);
    const paddedId = id.padStart(3, '0');
    return (
      id === normalized ||
      paddedId.includes(normalized) ||
      entry.name.toLowerCase().includes(normalized) ||
      entry.types.some((type) => type.toLowerCase().includes(normalized))
    );
  });
}
