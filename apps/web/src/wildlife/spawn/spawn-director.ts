import { spawnConfigData } from '../data/data-loader';
import { TILE_SIZE } from '@pokemon/game-data';
import type { WildEntity } from '../model';
import type { WorldQuery } from '../ports/world-query';
import { calculateBaseLevel } from './level-model';
import { selectSpeciesTwoStep } from './species-pool';
import { composeHerd } from './herd-composer';
import { findGroupAnchors, placeHerdMembers } from './placement';
import { hashWildlife, isEntityShiny } from './shiny';
import { getSpeciesBehaviorDefinition } from '../behavior/profiles/profile-registry';

export interface SpawnDirectorOptions {
  seed: number;
  maxEntitiesPerChunk?: number;
  /** Highest level among all Pokémon owned by the player (Party + PC). */
  playerMaxOwnedLevel?: number;
}

/**
 * Legacy runtime key retained for serialized chunk compatibility. The
 * simulator resolves the richer species profile from speciesKey at runtime.
 */
function getDefaultBehaviorForSpecies(speciesKey: string): string {
  if (speciesKey === 'METAPOD' || speciesKey === 'KAKUNA') return 'dormant_cocoon';
  if (speciesKey === 'CATERPIE' || speciesKey === 'WEEDLE') return 'slow_bug';
  if (speciesKey === 'SPEAROW' || speciesKey === 'FEAROW') return 'aggressive_bird';
  if (['PIDGEY', 'PIDGEOTTO', 'PIDGEOT', 'DODUO'].includes(speciesKey)) {
    return 'skittish_bird';
  }
  return 'curious_rodent';
}

const HILL_JUMP_TAGS = new Set(['flying', 'mountain', 'fighter']);

function canSpeciesJumpHills(speciesKey: string): boolean {
  const tags = getSpeciesBehaviorDefinition(speciesKey)?.tags ?? [];
  return tags.some((tag) => HILL_JUMP_TAGS.has(tag));
}

/**
 * Deterministically maps base Kanto species to their canonical Regional Forms
 * (Alola, Galar, Hisui, Paldea) based on local habitat biome/context and seed roll,
 * keeping species-spawn.json clean while making all regional lineages encounterable in the wild.
 */
export function resolveRegionalWildVariant(
  speciesKey: string,
  biome: string,
  _context: string,
  roll01: number
): string {
  const key = speciesKey.toUpperCase();

  // 1. Snow biome -> Strictly 100% Alolan Ice/Steel & Galarian Ice/Psychic/Steel variants
  // (Never spawn Fire-type Kanto Vulpix or Desert Sandshrew in the snow!)
  if (biome === 'snow') {
    if (key === 'VULPIX') return 'VULPIX_ALOLAN';
    if (key === 'NINETALES') return 'NINETALES_ALOLAN';
    if (key === 'SANDSHREW') return 'SANDSHREW_ALOLAN';
    if (key === 'SANDSLASH') return 'SANDSLASH_ALOLAN';
    if (key === 'MRMIME') return 'MRMIME_GALARIAN';
    if (key === 'MEOWTH') return 'MEOWTH_GALARIAN';
    if (key === 'PERSIAN') return 'PERRSERKER';
  }

  // 2. Dark Land -> Strictly Alolan Dark/Ghost/Poison & Galarian Poison/Fairy variants
  if (biome === 'dark_land') {
    if (key === 'RATTATA') return 'RATTATA_ALOLAN';
    if (key === 'RATICATE') return 'RATICATE_ALOLAN';
    if (key === 'MEOWTH') return 'MEOWTH_ALOLAN';
    if (key === 'PERSIAN') return 'PERSIAN_ALOLAN';
    if (key === 'MAROWAK') return 'MAROWAK_ALOLAN';
    if (key === 'SLOWKING') return 'SLOWKING_GALARIAN';
    if (key === 'GRIMER' && roll01 < 0.75) return 'GRIMER_ALOLAN';
    if (key === 'MUK' && roll01 < 0.75) return 'MUK_ALOLAN';
    if (key === 'WEEZING' && roll01 < 0.75) return 'WEEZING_GALARIAN';
  }

  // 3. Autumn & Forests -> 100% Galarian Woodland Ponyta/Rapidash & Hisuian Apricorn Voltorb/Electrode
  if (biome === 'autumn' || biome === 'dense_forest' || biome === 'light_forest') {
    if (key === 'PONYTA') return 'PONYTA_GALARIAN';
    if (key === 'RAPIDASH') return 'RAPIDASH_GALARIAN';
    if (key === 'VOLTORB') return 'VOLTORB_HISUIAN';
    if (key === 'ELECTRODE') return 'ELECTRODE_HISUIAN';
    if (key === 'FARFETCHD' && roll01 < 0.6) return 'FARFETCHD_GALARIAN';
    if (key === 'EXEGGUTOR' && biome === 'light_forest' && roll01 < 0.5) return 'EXEGGUTOR_ALOLAN';
  }

  // 4. Hill Edge (Rocky Highland / Đồi Đá) -> 100% Hisuian Rock/Fire Growlithe, Paldean Combat Tauros, Kleavor Apex
  if (biome === 'hill_edge') {
    if (key === 'GROWLITHE') return 'GROWLITHE_HISUIAN';
    if (key === 'ARCANINE') return 'ARCANINE_HISUIAN';
    if (key === 'TAUROS') return 'TAUROS_PALDEAN_COMBAT';
    if (key === 'MEOWTH') return 'MEOWTH_GALARIAN';
    if (key === 'PERSIAN') return 'PERRSERKER';
    if (key === 'SCIZOR') return 'KLEAVOR';
    if (key === 'GEODUDE' && roll01 < 0.5) return 'GEODUDE_ALOLAN';
    if (key === 'GRAVELER' && roll01 < 0.5) return 'GRAVELER_ALOLAN';
    if (key === 'GOLEM' && roll01 < 0.5) return 'GOLEM_ALOLAN';
    if (key === 'DIGLETT' && roll01 < 0.5) return 'DIGLETT_ALOLAN';
    if (key === 'DUGTRIO' && roll01 < 0.5) return 'DUGTRIO_ALOLAN';
  }

  // 5. Dryland (Desert & Arid Badlands) -> 100% Paldean Blaze Tauros, Alolan Marowak/Diglett
  if (biome === 'dryland') {
    if (key === 'TAUROS') return 'TAUROS_PALDEAN_BLAZE';
    if (key === 'DIGLETT' && roll01 < 0.45) return 'DIGLETT_ALOLAN';
    if (key === 'DUGTRIO' && roll01 < 0.45) return 'DUGTRIO_ALOLAN';
    if (key === 'MAROWAK' && roll01 < 0.45) return 'MAROWAK_ALOLAN';
  }

  // 6. Coast & Wetland -> 100% Paldean Aqua Tauros, Coastal Galarian Slowpoke line & Alolan Raichu/Exeggutor
  if (biome === 'coast' || biome === 'wetland') {
    if (key === 'TAUROS') return 'TAUROS_PALDEAN_AQUA';
    if (biome === 'coast') {
      if (key === 'SLOWPOKE' && roll01 < 0.55) return 'SLOWPOKE_GALARIAN';
      if (key === 'SLOWBRO' && roll01 < 0.55) return 'SLOWBRO_GALARIAN';
      if (key === 'SLOWKING' && roll01 < 0.55) return 'SLOWKING_GALARIAN';
      if (key === 'RAICHU') return 'RAICHU_ALOLAN';
      if (key === 'EXEGGUTOR') return 'EXEGGUTOR_ALOLAN';
    }
  }

  return speciesKey;
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
    const regionalVariantRoll = hashWildlife(seed, cx, cy, g, 555);

    for (let m = 0; m < herd.individuals.length; m++) {
      if (entities.length >= maxBudget) break;

      const ind = herd.individuals[m];
      const resolvedSpeciesKey = resolveRegionalWildVariant(
        ind.speciesKey,
        biome,
        context,
        regionalVariantRoll
      );
      const pos = memberPositions[m] ?? anchor;
      const slot = globalSlot++;

      const isShiny = isEntityShiny(seed, cx, cy, slot);
      const entityId = `wild:${seed}:${cx}:${cy}:${slot}`;
      const dirRoll = hashWildlife(seed, cx, cy, slot, 801);
      const dir = Math.floor(dirRoll * 4);
      const behavior =
        biome === 'apricorn_plain' ? 'herd_grazer' : getDefaultBehaviorForSpecies(resolvedSpeciesKey);
      const isWaterSurface =
        world.contextAt(pos.gx, pos.gy) === 'water_surface' || context === 'water_surface';

      const entity: WildEntity = {
        id: entityId,
        gx: pos.gx,
        gy: pos.gy,
        x: pos.gx * TILE_SIZE - 16,
        y: pos.gy * TILE_SIZE - 32,
        speciesKey: resolvedSpeciesKey,
        name: resolvedSpeciesKey,
        level: ind.level,
        role: ind.role,
        rarityTier: selection.tier,
        activeTime: [...selection.definition.activeTime] as WildEntity['activeTime'],
        herdId,
        isShiny,
        isWaterDweller: isWaterSurface,
        isSwimming: isWaterSurface && world.contextAt(pos.gx, pos.gy) === 'water_surface',
        behavior,
        canJumpHills: canSpeciesJumpHills(resolvedSpeciesKey),
        dir,
        homeGX: anchor.gx,
        homeGY: anchor.gy,
        wanderRadius: ind.role === 'leader' || ind.role === 'apex' ? 5 : 3,
        state: 'idle',
        isMoving: false,
        fromX: pos.gx * TILE_SIZE - 16,
        fromY: pos.gy * TILE_SIZE - 32,
        targetGX: pos.gx,
        targetGY: pos.gy,
        targetX: pos.gx * TILE_SIZE - 16,
        targetY: pos.gy * TILE_SIZE - 32,
        stepProgress: 0,
        // Player walk speed is 2px/frame. Wildlife starts at a responsive
        // pace and species profiles apply the natural variation at runtime.
        moveSpeed: 1.35,
        stepsRemaining: 0,
        currentDir: dir,
        lastMoveTime: 0,
        idleTimer: 500 + Math.floor(hashWildlife(seed, cx, cy, slot, 901) * 900),
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
