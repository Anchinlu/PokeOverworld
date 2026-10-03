import type { PokemonSpeciesData } from '@pokemon/shared-types';

export interface HabitatConfig {
  bg: string;
  base: string;
}

export const TYPE_HABITATS: Record<string, HabitatConfig> = {
  grass: { bg: 'Forest.png', base: 'ForestGrass.png' },
  bug: { bg: 'Forest.png', base: 'ForestGrass.png' },
  fire: { bg: 'Mountain.png', base: 'Mountain.png' },
  water: { bg: 'Water.png', base: 'Water.png' },
  electric: { bg: 'Field.png', base: 'FieldGrass.png' },
  ice: { bg: 'Snow.png', base: 'Snow.png' },
  rock: { bg: 'Mountain.png', base: 'Mountain.png' },
  ground: { bg: 'Cave.png', base: 'FieldSand.png' },
  poison: { bg: 'Forest.png', base: 'ForestMud.png' },
  ghost: { bg: 'CaveDark.png', base: 'CaveDark.png' },
  psychic: { bg: 'IndoorB.png', base: 'IndoorB.png' },
  fighting: { bg: 'Gym1.png', base: 'Gym1.png' },
  dragon: { bg: 'Champion.png', base: 'Champion.png' },
  flying: { bg: 'Mountain.png', base: 'MountainGrass.png' },
  normal: { bg: 'Field.png', base: 'FieldGrass.png' },
  steel: { bg: 'City.png', base: 'CityConcrete.png' },
  fairy: { bg: 'Field.png', base: 'FieldGrass.png' },
  dark: { bg: 'CaveDark.png', base: 'CaveDark.png' },
};

export function getPokemonHabitat(pokemon: PokemonSpeciesData): HabitatConfig {
  const name = pokemon.name.toLowerCase();

  // Deep water / Ocean Pokémon
  if (
    [
      'magikarp',
      'gyarados',
      'goldeen',
      'seaking',
      'shellder',
      'cloyster',
      'staryu',
      'starmie',
      'horsea',
      'seadra',
      'tentacool',
      'tentacruel',
      'lapras',
      'omanyte',
      'omastar',
      'kabuto',
      'kabutops',
    ].includes(name)
  ) {
    return { bg: 'Underwater.png', base: 'Underwater.png' };
  }

  // Cave dwellers
  if (
    ['zubat', 'golbat', 'diglett', 'dugtrio', 'geodude', 'graveler', 'golem', 'onix'].includes(name)
  ) {
    return { bg: 'Cave.png', base: 'Cave.png' };
  }

  // Ghost types
  if (pokemon.types.some((t) => t.toLowerCase() === 'ghost')) {
    return { bg: 'CaveDark.png', base: 'CaveDark.png' };
  }

  // Dragon types
  if (pokemon.types.some((t) => t.toLowerCase() === 'dragon')) {
    return { bg: 'Champion.png', base: 'Champion.png' };
  }

  // Ice types
  if (pokemon.types.some((t) => t.toLowerCase() === 'ice')) {
    return { bg: 'Snow.png', base: 'Snow.png' };
  }

  // Primary type mapping
  const primary = (pokemon.types[0] || 'normal').toLowerCase();
  return TYPE_HABITATS[primary] || { bg: 'Field.png', base: 'FieldGrass.png' };
}
