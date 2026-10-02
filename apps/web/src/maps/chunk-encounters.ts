import { TILE_SIZE } from '@pokemon/game-data';
import type { Collider, TerrainId } from '@pokemon/shared-types';
import { pokemonCatalog, type EncounterDefinition } from '../data';
import { seededHash } from './noise';
import { sampleEcology, getEcologyZone, LEVEL_SALT, type EcologyZone } from './ecology';
import type { TallGrassEntity, TreeEntity } from './chunk-objects';

export interface EncounterContext {
  zone: EcologyZone;
  onTallGrass: boolean;
  nearWater: boolean;
  nearTree: boolean;
  nearHill: boolean;
  timeOfDay: 'day' | 'night';
}

/**
 * Chooses an encounter roster based on the spawn tile's ecological context.
 * Roster definitions come directly from encounters.json via pokemonCatalog.
 */
export function getRosterForContext(context: EncounterContext): readonly EncounterDefinition[] {
  if (context.zone === 'dense_forest' || (context.nearTree && context.zone !== 'coast')) {
    return pokemonCatalog.getEncounterRoster('VIRIDIAN_FOREST');
  }
  if (context.zone === 'dryland' || context.zone === 'hill_edge' || context.nearHill) {
    return pokemonCatalog.getEncounterRoster('ROUTE_22');
  }
  return pokemonCatalog.getEncounterRoster('ROUTE_1');
}

export interface WildEmote {
  type: '!' | '?' | 'sweat' | 'dots';
  timer: number;
  maxTime: number;
}

export interface WildPokemonEntity {
  gx: number;
  gy: number;
  x: number;
  y: number;
  speciesKey: string;
  name: string;
  level: number;
  behavior: string;
  dir: number;
  homeGX: number;
  homeGY: number;
  wanderRadius: number;
  state: 'idle' | 'curious' | 'fleeing';
  isMoving: boolean;
  fromX: number;
  fromY: number;
  targetGX: number;
  targetGY: number;
  targetX: number;
  targetY: number;
  stepProgress: number;
  moveSpeed: number;
  stepsRemaining: number;
  currentDir: number;
  lastMoveTime: number;
  idleTimer: number;
  isPecking?: boolean;
  peckStartTime?: number;
  bobY?: number;
  frame: number;
  emote?: WildEmote | null;
  seed: number;
  chunkCx: number;
  chunkCy: number;
}

export function generateChunkWildPokemon(
  cx: number,
  cy: number,
  seed: number,
  _terrainGrid: TerrainId[][],
  colliders: Collider[],
  tallGrass: TallGrassEntity[] = [],
  trees: TreeEntity[] = []
): WildPokemonEntity[] {
  // Section 8.2: Standard encounters strictly require onTallGrass === true
  if (!tallGrass || tallGrass.length === 0) {
    return [];
  }

  const quotaRoll = seededHash(cx, cy, seed + 1313);
  const count = quotaRoll < 0.4 ? 0 : quotaRoll < 0.75 ? 1 : 2;
  const list: WildPokemonEntity[] = [];

  const availableGrass = [...tallGrass];
  for (let i = 0; i < count && availableGrass.length > 0; i++) {
    const grassIdx =
      Math.floor(seededHash(cx * 10 + i, cy * 10 + i, seed + 1414) * availableGrass.length) %
      availableGrass.length;
    const tg = availableGrass.splice(grassIdx, 1)[0];
    const gx = tg.gx;
    const gy = tg.gy;
    const px = gx * TILE_SIZE - 16;
    const py = gy * TILE_SIZE - 32;

    const collides = colliders.some(
      (c) => px + 24 > c.x && px + 8 < c.x + c.w && py + 24 > c.y && py + 8 < c.y + c.h
    );

    if (!collides) {
      const sample = sampleEcology(gx, gy, seed);
      const zone = getEcologyZone(sample);
      const nearTree = trees.some((t) => Math.hypot(t.gx - gx, t.gy - gy) <= 3);

      const context: EncounterContext = {
        zone,
        onTallGrass: true,
        nearWater: sample.nearWater,
        nearTree,
        nearHill: sample.nearHill,
        timeOfDay: 'day',
      };

      const roster = getRosterForContext(context);
      if (!roster || roster.length === 0) continue;

      const roll = Math.floor(seededHash(gx, gy, seed + 1616) * 100);
      let accum = 0;
      let chosen = roster[0];
      for (const sp of roster) {
        accum += sp.rate;
        if (roll < accum) {
          chosen = sp;
          break;
        }
      }

      const initialDir = Math.floor(seededHash(gx, gy, seed + 1717) * 4);

      // Section 8.3: Level deterministic in inclusive range [minLevel, maxLevel]
      const levelRoll = seededHash(gx, gy, seed + LEVEL_SALT);
      const level =
        chosen.minLevel + Math.floor(levelRoll * (chosen.maxLevel - chosen.minLevel + 1));

      list.push({
        gx,
        gy,
        x: px,
        y: py,
        speciesKey: chosen.speciesKey,
        name: pokemonCatalog.getBySpeciesKey(chosen.speciesKey)?.name ?? chosen.speciesKey,
        level,
        behavior: chosen.behavior,
        dir: initialDir,
        homeGX: gx,
        homeGY: gy,
        wanderRadius: 4,
        state: 'idle',
        isMoving: false,
        fromX: px,
        fromY: py,
        targetGX: gx,
        targetGY: gy,
        targetX: px,
        targetY: py,
        stepProgress: 0,
        moveSpeed: 1.6,
        stepsRemaining: 0,
        currentDir: initialDir,
        lastMoveTime: 0,
        idleTimer: 2000 + seededHash(gx, gy, seed + 1818) * 3000,
        frame: 0,
        emote: null,
        seed,
        chunkCx: cx,
        chunkCy: cy,
      });
    }
  }

  return list;
}
