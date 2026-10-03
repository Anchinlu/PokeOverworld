import { pokemonCatalog } from '../data';
import type { BattlerPokemon, BattleEnvironment } from './types';
import { getMovesForSpecies } from './moves-db';
import type { EcologyZone } from '../maps/ecology';
import { defaultBattleRng, type BattleRng } from './battle-rng';

function calculateHp(base: number, level: number): number {
  return Math.floor(((2 * base + 31) * level) / 100) + level + 10;
}

function calculateStat(base: number, level: number): number {
  return Math.floor(((2 * base + 31) * level) / 100) + 5;
}

export function createBattler(
  speciesKey: string,
  level: number,
  isPlayer = false,
  rng: BattleRng = defaultBattleRng
): BattlerPokemon {
  const data =
    pokemonCatalog.getBySpeciesKey(speciesKey) ?? pokemonCatalog.getBySpeciesKey('PIKACHU')!;
  const maxHp = calculateHp(data.stats.hp, level);

  const stats = {
    hp: maxHp,
    attack: calculateStat(data.stats.attack, level),
    defense: calculateStat(data.stats.defense, level),
    spAtk: calculateStat(data.stats.spAtk, level),
    spDef: calculateStat(data.stats.spDef, level),
    speed: calculateStat(data.stats.speed, level),
    total: data.stats.total,
  };

  const moves = getMovesForSpecies(data.speciesKey, data.types);

  return {
    id: data.id,
    name: data.name,
    speciesKey: data.speciesKey,
    types: [...data.types],
    level,
    currentHp: maxHp,
    maxHp,
    stats,
    moves,
    frontSprite: `/Graphics/Pokemon/Front/${data.speciesKey}.png`,
    backSprite: `/Graphics/Pokemon/Back/${data.speciesKey}.png`,
    iconSprite: `/Graphics/Pokemon/Icons/${data.speciesKey}.png`,
    gender: isPlayer ? 'male' : rng.next() < 0.5 ? 'male' : 'female',
    isFainted: false,
    catchRate: data.catchRate ?? 45,
    exp: 0,
    maxExp: level * level * 10,
  };
}

export function getBattleEnvironment(zone: EcologyZone, isNearWater = false): BattleEnvironment {
  if (isNearWater || zone === 'wetland') {
    return {
      background: 'Water.png',
      enemyBase: 'Water.png',
      playerBase: 'Water.png',
    };
  }

  switch (zone) {
    case 'dense_forest':
      return {
        background: 'Forest.png',
        enemyBase: 'ForestGrass.png',
        playerBase: 'ForestGrass.png',
      };
    case 'hill_edge':
      return {
        background: 'Mountain.png',
        enemyBase: 'MountainGrass.png',
        playerBase: 'MountainGrass.png',
      };
    case 'dryland':
      return {
        background: 'Field.png',
        enemyBase: 'FieldDirt.png',
        playerBase: 'FieldDirt.png',
      };
    case 'meadow':
    default:
      return {
        background: 'Field.png',
        enemyBase: 'FieldGrass.png',
        playerBase: 'FieldGrass.png',
      };
  }
}
