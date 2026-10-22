import type { RuntimeBiomeId } from '../../../maps/ecology';

/**
 * Shared state and rendering contracts for the overworld mini-map.
 *
 * DOM and canvas ownership stays in the controller/renderer modules. These
 * types remain free of gameplay entity creation and render-loop concerns.
 */
export interface MinimapChunkKey {
  cx: number;
  cy: number;
}

export interface MinimapViewport {
  centerGX: number;
  centerGY: number;
  radiusChunks: number;
}

export interface MinimapTileSample {
  gx: number;
  gy: number;
  biome: RuntimeBiomeId;
  discovered: boolean;
  loaded: boolean;
  isOcean: boolean;
  isWater: boolean;
  isHill: boolean;
  isRoad: boolean;
  isSettlement: boolean;
}

export interface MinimapPlayerMarker {
  gx: number;
  gy: number;
  direction: number;
}

export interface MinimapSnapshot {
  seed: number;
  viewport: MinimapViewport;
  player: MinimapPlayerMarker;
  follower?: MinimapPlayerMarker;
  discoveredChunks: readonly MinimapChunkKey[];
  tiles: readonly MinimapTileSample[];
}

export interface MinimapState {
  enabled: boolean;
  visible: boolean;
  zoom: number;
  viewport: MinimapViewport;
  discoveredChunks: ReadonlySet<string>;
}

export type MinimapUpdateReason =
  | 'player_tile_changed'
  | 'chunk_loaded'
  | 'chunk_unloaded'
  | 'discovery_changed'
  | 'settings_changed';

export interface MinimapUpdateRequest {
  reason: MinimapUpdateReason;
  viewport: MinimapViewport;
}
