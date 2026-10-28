import { describe, expect, it } from 'vitest';
import { Player } from '../../src/entities/player';
import { Follower } from '../../src/entities/follower';
import { updateWildPokemon } from '../../src/ai/wild-pokemon';
import type { ChunkManager } from '../../src/maps/chunk-manager';
import type { WildEntity } from '../../src/wildlife/model';
import {
  getSpeciesCandidatesForTier,
  selectSpeciesTwoStep,
} from '../../src/wildlife/spawn/species-pool';
import { calculateSpeciesTier } from '../../src/wildlife/spawn/rarity';
import { speciesSpawnData } from '../../src/wildlife/data/data-loader';

function makeEntity(activeTime: WildEntity['activeTime']): WildEntity {
  return {
    gx: 2,
    gy: 2,
    x: 64,
    y: 64,
    speciesKey: 'ZUBAT',
    name: 'ZUBAT',
    level: 5,
    activeTime,
    behavior: 'curious_rodent',
    dir: 0,
    homeGX: 2,
    homeGY: 2,
    wanderRadius: 3,
    state: 'idle',
    isMoving: true,
    fromX: 64,
    fromY: 64,
    targetGX: 3,
    targetGY: 2,
    targetX: 96,
    targetY: 64,
    stepProgress: 8,
    moveSpeed: 0.8,
    stepsRemaining: 0,
    currentDir: 2,
    lastMoveTime: 0,
    idleTimer: 1000,
    frame: 0,
    emote: null,
    seed: 1,
    chunkCx: 0,
    chunkCy: 0,
  };
}

describe('Wildlife day/night runtime', () => {
  it('contains an explicit initial nocturnal roster instead of treating every species as all-day', () => {
    const nocturnal = Object.entries(speciesSpawnData)
      .filter(([, definition]) => definition.activeTime.length === 2)
      .map(([speciesKey]) => speciesKey);

    expect(nocturnal).toEqual([
      'RATTATA',
      'RATICATE',
      'CLEFAIRY',
      'CLEFABLE',
      'ZUBAT',
      'GOLBAT',
      'VILEPLUME',
      'MEOWTH',
      'PERSIAN',
      'GASTLY',
      'HAUNTER',
      'GENGAR',
      'DROWZEE',
      'HYPNO',
      'STARMIE',
      'CROBAT',
      'PORYGONZ',
      'ESPEON',
      'UMBREON',
    ]);
    expect(
      Object.entries(speciesSpawnData)
        .filter(([speciesKey, definition]) => !nocturnal.includes(speciesKey) && definition.activeTime.length !== 4)
        .every(([, definition]) => !definition.activeTime.includes('night'))
    ).toBe(true);
  });

  it('filters a nocturnal species out during the day but allows it at night', () => {
    const tier = calculateSpeciesTier('ZUBAT');
    expect(tier).not.toBeNull();

    const habitatCandidates = getSpeciesCandidatesForTier('hill_edge', 'rock', tier!);
    expect(habitatCandidates.some((candidate) => candidate.speciesKey === 'ZUBAT')).toBe(true);

    for (let roll = 0; roll < 100; roll++) {
      const species = selectSpeciesTwoStep({
        biome: 'hill_edge',
        context: 'rock',
        timeBand: 'day',
        tierRoll01: 0,
        speciesRoll01: roll / 100,
      });
      expect(species?.speciesKey).not.toBe('ZUBAT');
    }

    const nightResults = Array.from({ length: 100 }, (_, roll) =>
      selectSpeciesTwoStep({
        biome: 'hill_edge',
        context: 'rock',
        timeBand: 'night',
        tierRoll01: 0,
        speciesRoll01: roll / 100,
      })
    );
    expect(nightResults.some((species) => species?.speciesKey === 'ZUBAT')).toBe(true);
  });

  it('puts an inactive wild Pokémon to sleep and wakes it in its active band', () => {
    const entity = makeEntity(['night']);
    const chunkManager = {
      simulationChunks: [{ wildPokemon: [entity] }],
    } as unknown as ChunkManager;
    const player = new Player(0, 0, 0);
    const follower = new Follower(0, -1, 0);

    updateWildPokemon(chunkManager, player, follower, 1, 'day');
    expect(entity.state).toBe('rest_sleep');
    expect(entity.isMoving).toBe(false);

    updateWildPokemon(chunkManager, player, follower, 1, 'night');
    expect(entity.state).toBe('idle');
  });
});
