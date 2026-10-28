import { TERRAIN } from '@pokemon/game-data';
import type { ChunkManager } from '../maps/chunk-manager';
import type { Player } from '../entities/player';
import type { BattleOutcome, WildPokemonEntity } from './model';
import { createWildlifeSystem, type WildlifeSystem } from './index';
import type { WorldChunk } from '../maps/chunk';
import type { PlayerQuery } from './ports/player-query';
import type { TimeBand, WeatherType, WorldQuery } from './ports/world-query';
import { resolveWorldBiome } from '../maps/ecology';
import { resolveWorldTileContext } from './ports/world-context';
import { isVillageArea } from '../maps/village-rules';

interface RuntimeState {
  system: WildlifeSystem;
  timeBand: TimeBand;
  weather: WeatherType;
  referenceLevel: number;
  /**
   * The simulation neighborhood is stable for most frames. Keep the
   * collected entity array until a chunk population is actually replaced so
   * the AI system does not rebuild its spatial index every animation frame.
   */
  entitySnapshot: WildPokemonEntity[];
  snapshotChunks: readonly WorldChunk[];
  snapshotWildlifeArrays: readonly WildPokemonEntity[][];
}

const runtimes = new WeakMap<object, RuntimeState>();

/** Runs the sole production wildlife pipeline while preserving the old call signature. */
export function updateUnifiedWildlife(
  chunkManager: ChunkManager,
  player: Player,
  dtScale: number,
  timeBand: TimeBand,
  weather: WeatherType,
  referenceLevel: number
): boolean {
  const runtime = getRuntime(chunkManager, player);
  runtime.timeBand = timeBand;
  runtime.weather = weather;
  runtime.referenceLevel = referenceLevel;
  const entities = getEntitySnapshot(chunkManager, runtime);
  runtime.system.setEntities(entities);
  runtime.system.update(dtScale * (1000 / 60));
  return true;
}

/** Persists a battle result in the authoritative overworld wildlife runtime. */
export function resolveUnifiedWildlifeBattle(
  chunkManager: ChunkManager,
  entityId: string,
  outcome: BattleOutcome
): void {
  const runtime = runtimes.get(chunkManager);
  runtime?.system.onBattleResolved(entityId, outcome);
  chunkManager.resolveWildlifeEntity(entityId);
}

function getRuntime(chunkManager: ChunkManager, player: Player): RuntimeState {
  const existing = runtimes.get(chunkManager);
  if (existing) return existing;

  const state: RuntimeState = {
    system: undefined as unknown as WildlifeSystem,
    timeBand: 'day',
    weather: 'clear',
    referenceLevel: 10,
    entitySnapshot: [],
    snapshotChunks: [],
    snapshotWildlifeArrays: [],
  };

  const world: WorldQuery = {
    // Wildlife may roam on loaded highland plateaus. This is intentionally
    // separate from player foot movement, where entering a hill still
    // requires the jump/elevation rules in ChunkManager.isWalkable().
    isWalkable: (gx, gy, fromGX, fromGY, canJumpHills) =>
      typeof chunkManager.isLoadedWildlifeWalkable === 'function'
        ? chunkManager.isLoadedWildlifeWalkable(gx, gy, fromGX, fromGY, canJumpHills)
        : typeof chunkManager.isLoadedWalkable !== 'function' ||
          chunkManager.isLoadedWalkable(gx, gy),
    isElevated: (gx, gy) => chunkManager.getLoadedTileData?.(gx, gy)?.terrain === TERRAIN.HILL,
    isWildlifeRestricted: (gx, gy) => isVillageArea(gx, gy, chunkManager.field, 0),
    contextAt: (gx, gy) => getContextAt(chunkManager, gx, gy),
    biomeAt: (gx, gy) => getBiomeAt(chunkManager, gx, gy),
    difficultyAt: (gx, gy) => Math.min(1, Math.max(0, Math.hypot(gx, gy) / 500)),
    timeBand: () => state.timeBand,
    weather: () => state.weather,
  };

  const playerQuery: PlayerQuery = {
    position: () => ({ gx: player.gx, gy: player.gy }),
    isRunning: () => player.speedMode === 'run',
    inTallGrass: () => {
      if (typeof chunkManager.getLoadedTileData !== 'function') return false;
      return Boolean(chunkManager.getLoadedTileData(player.gx, player.gy)?.tallGrass);
    },
    referenceLevel: () => state.referenceLevel,
  };

  state.system = createWildlifeSystem({
    seed: chunkManager.currentSeed,
    world,
    player: playerQuery,
    frameBudgetMs: 1.5,
  });
  runtimes.set(chunkManager, state);
  return state;
}

function collectEntities(chunkManager: ChunkManager): WildPokemonEntity[] {
  const result: WildPokemonEntity[] = [];
  const seen = new Set<string>();

  for (const chunk of chunkManager.simulationChunks) {
    for (const entity of chunk.wildPokemon) {
      const key = entity.id ?? `${entity.chunkCx}:${entity.chunkCy}:${entity.gx}:${entity.gy}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(entity);
    }
  }

  return result;
}

function getEntitySnapshot(chunkManager: ChunkManager, runtime: RuntimeState): WildPokemonEntity[] {
  const chunks = chunkManager.simulationChunks;
  if (
    chunks.length === runtime.snapshotChunks.length &&
    chunks.every(
      (chunk, index) =>
        chunk === runtime.snapshotChunks[index] &&
        chunk.wildPokemon === runtime.snapshotWildlifeArrays[index]
    )
  ) {
    return runtime.entitySnapshot;
  }

  runtime.snapshotChunks = chunks.slice();
  runtime.snapshotWildlifeArrays = chunks.map((chunk) => chunk.wildPokemon);
  runtime.entitySnapshot = collectEntities(chunkManager);
  return runtime.entitySnapshot;
}

function getContextAt(
  chunkManager: ChunkManager,
  gx: number,
  gy: number
): ReturnType<WorldQuery['contextAt']> {
  if (typeof chunkManager.getLoadedTileData !== 'function') return 'walkable_ground';

  const tile = chunkManager.getLoadedTileData(gx, gy);
  if (!tile) return 'walkable_ground';
  return resolveWorldTileContext(chunkManager.field, gx, gy, {
    isTallGrass: () => Boolean(tile.tallGrass),
  });
}

function getBiomeAt(chunkManager: ChunkManager, gx: number, gy: number) {
  return resolveWorldBiome(chunkManager.field, gx, gy);
}
