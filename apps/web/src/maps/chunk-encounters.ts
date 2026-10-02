import { CHUNK_SIZE, TILE_SIZE, TERRAIN } from '@pokemon/game-data';
import type { Collider, TerrainId } from '@pokemon/shared-types';
import { pokemonCatalog } from '../data';
import { seededHash } from './noise';

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
  terrainGrid: TerrainId[][],
  colliders: Collider[]
): WildPokemonEntity[] {
  const startGX = cx * CHUNK_SIZE;
  const startGY = cy * CHUNK_SIZE;

  const roster = pokemonCatalog.getEncounterRoster('ROUTE_1');

  const quotaRoll = seededHash(cx, cy, seed + 1313);
  const count = quotaRoll < 0.35 ? 1 : quotaRoll < 0.65 ? 2 : 0;
  const list: WildPokemonEntity[] = [];

  for (let i = 0; i < count; i++) {
    const lx = 2 + Math.floor(seededHash(cx * 10 + i, cy * 10, seed + 1414) * 12);
    const ly = 2 + Math.floor(seededHash(cx * 10, cy * 10 + i, seed + 1515) * 12);

    if (terrainGrid[ly]?.[lx] === TERRAIN.GRASS) {
      const gx = startGX + lx;
      const gy = startGY + ly;
      const px = gx * TILE_SIZE - 16;
      const py = gy * TILE_SIZE - 32;

      const collides = colliders.some(
        (c) => px + 24 > c.x && px + 8 < c.x + c.w && py + 24 > c.y && py + 8 < c.y + c.h
      );

      if (!collides) {
        const roll = Math.floor(seededHash(gx, gy, seed + 1616) * 100);
        let accum = 0;
        let chosen = roster[0];
        if (!chosen) continue;
        for (const sp of roster) {
          accum += sp.rate;
          if (roll < accum) {
            chosen = sp;
            break;
          }
        }

        const initialDir = Math.floor(seededHash(gx, gy, seed + 1717) * 4);

        list.push({
          gx,
          gy,
          x: px,
          y: py,
          speciesKey: chosen.speciesKey,
          name: pokemonCatalog.getBySpeciesKey(chosen.speciesKey)?.name ?? chosen.speciesKey,
          level: chosen.minLevel,
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
  }

  return list;
}
