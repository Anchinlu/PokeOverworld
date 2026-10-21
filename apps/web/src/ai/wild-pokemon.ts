import type { ChunkManager } from '../maps/chunk-manager';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { TimeBand, WeatherType } from '../wildlife/ports/world-query';
import { updateUnifiedWildlife } from '../wildlife/unified-runtime';

/**
 * Backwards-compatible entry point for callers that still import the former
 * AI module. Gameplay is driven exclusively by UnifiedWildlifeRuntime.
 */
export function updateWildPokemon(
  chunkManager: ChunkManager,
  player: Player,
  follower: Follower,
  dtScale = 1.0,
  timeBand: TimeBand = 'day',
  weather: WeatherType = 'clear',
  referenceLevel = 10
): void {
  void follower;
  updateUnifiedWildlife(chunkManager, player, dtScale, timeBand, weather, referenceLevel);
}
