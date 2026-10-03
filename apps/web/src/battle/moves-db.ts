import type { PokemonType } from '@pokemon/shared-types';
import type { BattleMove } from './types';

export const MOVES_DB: Record<string, BattleMove> = {
  // Normal
  tackle: {
    id: 'tackle',
    name: 'Tackle',
    type: 'Normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'A physical attack in which the user charges.',
  },
  quick_attack: {
    id: 'quick_attack',
    name: 'Quick Attack',
    type: 'Normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 30,
    maxPp: 30,
    description: 'An almost invisibly fast strike.',
  },
  scratch: {
    id: 'scratch',
    name: 'Scratch',
    type: 'Normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'Scratches with sharp claws.',
  },
  tail_whip: {
    id: 'tail_whip',
    name: 'Tail Whip',
    type: 'Normal',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 30,
    maxPp: 30,
    description: "Lowers the target's Defense.",
  },
  growl: {
    id: 'growl',
    name: 'Growl',
    type: 'Normal',
    category: 'status',
    power: 0,
    accuracy: 100,
    pp: 40,
    maxPp: 40,
    description: "Lowers the target's Attack.",
  },
  hyper_fang: {
    id: 'hyper_fang',
    name: 'Hyper Fang',
    type: 'Normal',
    category: 'physical',
    power: 80,
    accuracy: 90,
    pp: 15,
    maxPp: 15,
    description: 'Bites hard with sharp front fangs.',
  },

  // Electric
  thundershock: {
    id: 'thundershock',
    name: 'Thunder Shock',
    type: 'Electric',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 30,
    maxPp: 30,
    description: 'An electric jolt that may paralyze.',
  },
  thunderbolt: {
    id: 'thunderbolt',
    name: 'Thunderbolt',
    type: 'Electric',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    description: 'A strong electrical blast.',
  },
  thunder_wave: {
    id: 'thunder_wave',
    name: 'Thunder Wave',
    type: 'Electric',
    category: 'status',
    power: 0,
    accuracy: 90,
    pp: 20,
    maxPp: 20,
    description: 'Causes immediate paralysis.',
  },
  spark: {
    id: 'spark',
    name: 'Spark',
    type: 'Electric',
    category: 'physical',
    power: 65,
    accuracy: 100,
    pp: 20,
    maxPp: 20,
    description: 'An electrified tackle.',
  },

  // Flying
  gust: {
    id: 'gust',
    name: 'Gust',
    type: 'Flying',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'Strikes with a gust of wind.',
  },
  peck: {
    id: 'peck',
    name: 'Peck',
    type: 'Flying',
    category: 'physical',
    power: 35,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'Jabs the target with a sharp beak.',
  },
  wing_attack: {
    id: 'wing_attack',
    name: 'Wing Attack',
    type: 'Flying',
    category: 'physical',
    power: 60,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'Strikes the target with wings.',
  },

  // Bug
  bug_bite: {
    id: 'bug_bite',
    name: 'Bug Bite',
    type: 'Bug',
    category: 'physical',
    power: 60,
    accuracy: 100,
    pp: 20,
    maxPp: 20,
    description: 'The user bites the target.',
  },
  string_shot: {
    id: 'string_shot',
    name: 'String Shot',
    type: 'Bug',
    category: 'status',
    power: 0,
    accuracy: 95,
    pp: 40,
    maxPp: 40,
    description: 'Blows silk to reduce Speed.',
  },

  // Grass
  vine_whip: {
    id: 'vine_whip',
    name: 'Vine Whip',
    type: 'Grass',
    category: 'physical',
    power: 45,
    accuracy: 100,
    pp: 25,
    maxPp: 25,
    description: 'Strikes with slender vines.',
  },
  razor_leaf: {
    id: 'razor_leaf',
    name: 'Razor Leaf',
    type: 'Grass',
    category: 'physical',
    power: 55,
    accuracy: 95,
    pp: 25,
    maxPp: 25,
    description: 'Cuts with sharp-edged leaves.',
  },

  // Fire
  ember: {
    id: 'ember',
    name: 'Ember',
    type: 'Fire',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 25,
    maxPp: 25,
    description: 'Attacks with small flames.',
  },
  flamethrower: {
    id: 'flamethrower',
    name: 'Flamethrower',
    type: 'Fire',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    description: 'Scorches all with intense fire.',
  },

  // Water
  water_gun: {
    id: 'water_gun',
    name: 'Water Gun',
    type: 'Water',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 25,
    maxPp: 25,
    description: 'Squirts water to attack.',
  },
  bubble: {
    id: 'bubble',
    name: 'Bubble',
    type: 'Water',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 30,
    maxPp: 30,
    description: 'Sprays bubbles to attack.',
  },

  // Dark / Poison
  bite: {
    id: 'bite',
    name: 'Bite',
    type: 'Dark',
    category: 'physical',
    power: 60,
    accuracy: 100,
    pp: 25,
    maxPp: 25,
    description: 'Bites with vicious fangs.',
  },
  poison_sting: {
    id: 'poison_sting',
    name: 'Poison Sting',
    type: 'Poison',
    category: 'physical',
    power: 15,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: 'Stabs with a poisonous stinger.',
  },
  iron_tail: {
    id: 'iron_tail',
    name: 'Iron Tail',
    type: 'Steel',
    category: 'physical',
    power: 100,
    accuracy: 75,
    pp: 15,
    maxPp: 15,
    description: 'Slams with a hard steel tail.',
  },
};

export const SPECIES_MOVESETS: Record<string, string[]> = {
  PIKACHU: ['thunderbolt', 'quick_attack', 'iron_tail', 'thundershock'],
  PIDGEY: ['gust', 'quick_attack', 'tackle', 'wing_attack'],
  RATTATA: ['tackle', 'quick_attack', 'bite', 'hyper_fang'],
  CATERPIE: ['tackle', 'string_shot', 'bug_bite'],
  METAPOD: ['tackle', 'string_shot', 'bug_bite'],
  WEEDLE: ['poison_sting', 'string_shot', 'bug_bite'],
  KAKUNA: ['poison_sting', 'string_shot', 'bug_bite'],
  SPEAROW: ['peck', 'growl', 'gust', 'wing_attack'],
  BULBASAUR: ['vine_whip', 'tackle', 'growl', 'razor_leaf'],
  CHARMANDER: ['ember', 'scratch', 'growl', 'flamethrower'],
  SQUIRTLE: ['water_gun', 'tackle', 'tail_whip', 'bubble'],
};

export function getMovesForSpecies(speciesKey: string, types: PokemonType[]): BattleMove[] {
  const moveIds = SPECIES_MOVESETS[speciesKey.toUpperCase()];
  if (moveIds && moveIds.length > 0) {
    return moveIds.map((id) => ({ ...MOVES_DB[id] }));
  }

  // Fallback moves based on types
  const list: BattleMove[] = [{ ...MOVES_DB.tackle }];
  const primaryType = types[0];
  if (primaryType === 'Fire') list.push({ ...MOVES_DB.ember });
  else if (primaryType === 'Water') list.push({ ...MOVES_DB.water_gun });
  else if (primaryType === 'Grass') list.push({ ...MOVES_DB.vine_whip });
  else if (primaryType === 'Electric') list.push({ ...MOVES_DB.thundershock });
  else if (primaryType === 'Flying') list.push({ ...MOVES_DB.peck });
  else if (primaryType === 'Bug') list.push({ ...MOVES_DB.bug_bite });
  else list.push({ ...MOVES_DB.quick_attack });

  return list;
}
