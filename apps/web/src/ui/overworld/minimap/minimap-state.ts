import type { MinimapState } from './minimap-types';

/**
 * Generates a stable key for a chunk coordinate.
 */
export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

/**
 * Parses a stable chunk key back into chunk coordinates.
 */
export function parseChunkKey(key: string): { cx: number; cy: number } {
  const [cxStr, cyStr] = key.split(',');
  return { cx: Number(cxStr), cy: Number(cyStr) };
}

/**
 * Creates the initial default MinimapState.
 * Viewport radius of 2.5 chunks corresponds to 5 chunks across (80 tiles),
 * fitting an internal canvas of 160x160 at 2px per tile.
 */
export function createDefaultMinimapState(overrides?: Partial<MinimapState>): MinimapState {
  return {
    enabled: true,
    visible: true,
    zoom: 1,
    viewport: {
      centerGX: 0,
      centerGY: 0,
      radiusChunks: 2.5,
    },
    discoveredChunks: new Set<string>(),
    ...overrides,
  };
}

/**
 * Adds a chunk to discovered chunks immutably.
 */
export function markChunkDiscoveredInState(
  state: MinimapState,
  cx: number,
  cy: number
): MinimapState {
  const key = chunkKey(cx, cy);
  if (state.discoveredChunks.has(key)) {
    return state;
  }
  const nextSet = new Set(state.discoveredChunks);
  nextSet.add(key);
  return {
    ...state,
    discoveredChunks: nextSet,
  };
}

/**
 * Checks whether a chunk is discovered in the given state.
 */
export function isChunkDiscovered(state: MinimapState, cx: number, cy: number): boolean {
  return state.discoveredChunks.has(chunkKey(cx, cy));
}

/**
 * Updates the viewport center in the state.
 */
export function updateViewportInState(
  state: MinimapState,
  centerGX: number,
  centerGY: number
): MinimapState {
  if (state.viewport.centerGX === centerGX && state.viewport.centerGY === centerGY) {
    return state;
  }
  return {
    ...state,
    viewport: {
      ...state.viewport,
      centerGX,
      centerGY,
    },
  };
}
