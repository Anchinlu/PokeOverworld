import { pokemonCatalog } from '../data';
import type { BattlerPokemon, BattleEnvironment } from './types';
import { getMovesForSpecies } from './moves-db';
import type { EcologyZone } from '../maps/ecology';
import { defaultBattleRng, type BattleRng } from './battle-rng';
import { POKEMON_ASSETS } from '../assets';

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

  const moves = getMovesForSpecies(data.speciesKey, data.types, level);

  return {
    id: data.id,
    name: data.name,
    speciesKey: data.speciesKey,
    types: [...data.types],
    level,
    currentHp: maxHp,
    maxHp,
    stats,
    statStages: {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    status: 'none',
    sleepTurns: 0,
    moves,
    frontSprite: POKEMON_ASSETS.getFrontSprite(data.speciesKey),
    backSprite: POKEMON_ASSETS.getBackSprite(data.speciesKey),
    iconSprite: POKEMON_ASSETS.getIconSprite(data.speciesKey),
    cry: data.sprites?.cry,
    gender: isPlayer ? 'male' : rng.next() < 0.5 ? 'male' : 'female',
    isFainted: false,
    catchRate: data.catchRate ?? 45,
    exp: 0,
    maxExp: level * level * 10,
    pokeball: 'POKEBALL',
  };
}

export function getBattleEnvironment(
  zone: EcologyZone,
  isNearWater = false,
  inTallGrass = false
): BattleEnvironment {
  if (isNearWater || zone === 'wetland') {
    return {
      background: 'Water.png',
      enemyBase: 'Water.png',
      playerBase: 'Water.png',
      foregroundOverlay: 'water_rough',
    };
  }

  switch (zone) {
    case 'dense_forest':
      return {
        background: 'Forest.png',
        enemyBase: 'ForestGrass.png',
        playerBase: 'ForestGrass.png',
        foregroundOverlay: 'grass_tall',
      };
    case 'hill_edge':
      return {
        background: 'Mountain.png',
        enemyBase: 'MountainGrass.png',
        playerBase: 'MountainGrass.png',
        foregroundOverlay: 'mountain_rocks',
      };
    case 'dryland':
      return {
        background: 'Field.png',
        enemyBase: 'FieldDirt.png',
        playerBase: 'FieldDirt.png',
        foregroundOverlay: 'sand_dunes',
      };
    case 'meadow':
    default:
      return {
        background: 'Field.png',
        enemyBase: 'FieldGrass.png',
        playerBase: 'FieldGrass.png',
        foregroundOverlay: inTallGrass ? 'grass_tall' : 'grass_field',
      };
  }
}
