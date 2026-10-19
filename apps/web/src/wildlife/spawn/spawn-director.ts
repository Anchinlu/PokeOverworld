import { spawnConfigData } from '../data/data-loader';
import type { WildEntity } from '../model';
import type { WorldQuery } from '../ports/world-query';
import { calculateBaseLevel } from './level-model';
import { selectSpeciesTwoStep } from './species-pool';
import { composeHerd } from './herd-composer';
import { findGroupAnchors, placeHerdMembers } from './placement';
import { hashWildlife, isEntityShiny } from './shiny';

export interface SpawnDirectorOptions {
  seed: number;
  maxEntitiesPerChunk?: number;
  /** Highest level among all Pokémon owned by the player (Party + PC). */
  playerMaxOwnedLevel?: number;
}

function getDefaultBehaviorForSpecies(speciesKey: string): string {
  if (speciesKey === 'METAPOD' || speciesKey === 'KAKUNA') {
    return 'dormant_cocoon';
  }
  if (speciesKey === 'CATERPIE' || speciesKey === 'WEEDLE') {
    return 'slow_bug';
  }
  if (speciesKey === 'SPEAROW' || speciesKey === 'FEAROW') {
    return 'aggressive_bird';
  }
  if (
    speciesKey === 'PIDGEY' ||
    speciesKey === 'PIDGEOTTO' ||
    speciesKey === 'PIDGEOT' ||
    speciesKey === 'DODUO'
  ) {
    return 'skittish_bird';
  }
  return 'curious_rodent';
}

/**
 * Procedural Spawn Director (Section 4.3 & 8.2).
 * Fully deterministic generation of wild creature herds per chunk.
 */
export function populateChunkWildlife(
  cx: number,
  cy: number,
  world: WorldQuery,
  opts: SpawnDirectorOptions
): WildEntity[] {
  const seed = opts.seed;
  const maxBudget = opts.maxEntitiesPerChunk ?? spawnConfigData.maxEntitiesPerChunk ?? 8;
  const playerMaxOwnedLevel = Math.max(1, Math.min(100, Math.floor(opts.playerMaxOwnedLevel ?? 5)));

  // Use the chunk-center biome only to determine the rough group budget.
  // The actual species pool is resolved at each anchor below so boundary
  // chunks cannot leak inland species onto beaches or other habitats.
  const centerGX = cx * 16 + 8;
  const centerGY = cy * 16 + 8;
  const centerBiome = world.biomeAt(centerGX, centerGY);

  const groupBounds = spawnConfigData.groupsPerChunk[centerBiome] || [2, 4];
  const [minG, maxG] = groupBounds;
  const groupCountRoll = hashWildlife(seed, cx, cy, 0, 101);
  const targetGroupCount = minG + Math.floor(groupCountRoll * (maxG - minG + 1));

  const anchors = findGroupAnchors({
    cx,
    cy,
    world,
    count: targetGroupCount,
    seed: (seed ^ Math.imul(cx, 1337) ^ Math.imul(cy, 7331)) >>> 0,
  });

  if (anchors.length === 0) return [];

  const entities: WildEntity[] = [];
  let globalSlot = 0;

  for (let g = 0; g < anchors.length; g++) {
    if (entities.length >= maxBudget) break;

    const anchor = anchors[g];
    const biome = world.biomeAt(anchor.gx, anchor.gy);
    const context = world.contextAt(anchor.gx, anchor.gy);
    const distFromStart = Math.hypot(anchor.gx, anchor.gy);
    const difficulty = world.difficultyAt(anchor.gx, anchor.gy);
    const baseLevel = calculateBaseLevel(distFromStart);

    // Deterministic rolls for species selection
    const tierRoll = hashWildlife(seed, cx, cy, g, 201);
    const speciesRoll = hashWildlife(seed, cx, cy, g, 301);

    const selection = selectSpeciesTwoStep({
      biome,
      context,
      timeBand: world.timeBand(),
      weather: world.weather(),
      tierRoll01: tierRoll,
      speciesRoll01: speciesRoll,
    });

    if (!selection) continue;

    // Rolls for herd composition
    const sizeRoll = hashWildlife(seed, cx, cy, g, 401);
    const apexRoll = hashWildlife(seed, cx, cy, g, 501);
    const levelRolls = [
      hashWildlife(seed, cx, cy, g, 601),
      hashWildlife(seed, cx, cy, g, 602),
      hashWildlife(seed, cx, cy, g, 603),
      hashWildlife(seed, cx, cy, g, 604),
      hashWildlife(seed, cx, cy, g, 605),
      hashWildlife(seed, cx, cy, g, 606),
      hashWildlife(seed, cx, cy, g, 607),
      hashWildlife(seed, cx, cy, g, 608),
    ];

    const herd = composeHerd({
      speciesKey: selection.speciesKey,
      speciesDef: selection.definition,
      baseLevel,
      difficulty,
      distance: distFromStart,
      rarityTier: selection.tier,
      playerMaxOwnedLevel,
      sizeRoll01: sizeRoll,
      apexRoll01: apexRoll,
      levelRolls,
    });

    // Place individuals around the anchor
    const memberPositions = placeHerdMembers({
      anchor,
      count: herd.individuals.length,
      world,
      seed: hashWildlife(seed, cx, cy, g, 701) * 1000000,
    });

    const herdId = `herd:${cx}:${cy}:${g}`;

    for (let m = 0; m < herd.individuals.length; m++) {
      if (entities.length >= maxBudget) break;

      const ind = herd.individuals[m];
      const pos = memberPositions[m] ?? anchor;
      const slot = globalSlot++;

      const isShiny = isEntityShiny(seed, cx, cy, slot);
      const entityId = `wild:${seed}:${cx}:${cy}:${slot}`;
      const dirRoll = hashWildlife(seed, cx, cy, slot, 801);
      const dir = Math.floor(dirRoll * 4);
      const behavior = getDefaultBehaviorForSpecies(ind.speciesKey);
      const isWaterSurface =
        world.contextAt(pos.gx, pos.gy) === 'water_surface' || context === 'water_surface';

      const entity: WildEntity = {
        id: entityId,
        gx: pos.gx,
        gy: pos.gy,
        x: pos.gx * 32,
        y: pos.gy * 32,
        speciesKey: ind.speciesKey,
        name: ind.speciesKey,
        level: ind.level,
        role: ind.role,
        rarityTier: selection.tier,
        activeTime: [...selection.definition.activeTime] as WildEntity['activeTime'],
        herdId,
        isShiny,
        isWaterDweller: isWaterSurface,
        isSwimming: isWaterSurface && world.contextAt(pos.gx, pos.gy) === 'water_surface',
        behavior,
        dir,
        homeGX: anchor.gx,
        homeGY: anchor.gy,
        wanderRadius: ind.role === 'leader' || ind.role === 'apex' ? 5 : 3,
        state: 'idle',
        isMoving: false,
        fromX: pos.gx * 32,
        fromY: pos.gy * 32,
        targetGX: pos.gx,
        targetGY: pos.gy,
        targetX: pos.gx * 32,
        targetY: pos.gy * 32,
        stepProgress: 0,
        moveSpeed: 0.8,
        stepsRemaining: 0,
        currentDir: dir,
        lastMoveTime: 0,
        idleTimer: 1000 + Math.floor(hashWildlife(seed, cx, cy, slot, 901) * 2000),
        frame: 0,
        seed: hashWildlife(seed, cx, cy, slot, 1001) * 1000000,
        chunkCx: cx,
        chunkCy: cy,
      };

      entities.push(entity);
    }
  }

  return entities;
}
