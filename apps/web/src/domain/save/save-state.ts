/**
 * Save Game Schema & State Definitions (Version 3)
 * Single unified representation of persisted game state across all systems.
 * Supports partitioned PC storage to prevent frame drops and quota overflows.
 */

import type { PlayerProfile, PlayerPosition } from '../player/player-state';
import type { PartyPokemon } from '../party/party-state';
import type { PcStorageState } from '../pc/pc-storage-service';

export const CURRENT_SAVE_VERSION = 3;
export const DEFAULT_SAVE_SLOT = 'slot_1';

export interface SaveGameMetadata {
  version: number;
  savedAt: number;
  slotId: string;
  playerName: string;
  money: number;
  badgesCount: number;
  partyCount: number;
  pcCount: number; // Total Pokemon stored in PC
  leaderName: string;
  leaderLevel: number;
  playTimeSeconds: number;
  pcSavedAt?: number; // Timestamp when PC partition was last saved
  worldSeed?: number;
  worldGenVersion?: number;
}

import type { SavedInteriorState } from '../../interior/interior-types';

export interface StartTownData {
  name: string;
  gx: number;
  gy: number;
  tier: number;
  siteId?: string;
}

export interface SaveWorldData {
  seed?: number;
  worldGenVersion?: number;
  position?: PlayerPosition;
  startTown?: StartTownData;
  worldTimeMinutes?: number;
  worldDay?: number;
  lastWorldTimestamp?: number;
  interior?: SavedInteriorState;
}


/**
 * Main save payload for slot (~15-25KB).
 * Serialized frequently without causing any frame drops.
 */
export interface SaveGameData {
  metadata: SaveGameMetadata;
  player: PlayerProfile;
  party: PartyPokemon[];
  inventory: Record<string, number>;
  world?: SaveWorldData;
}

/**
 * Separate storage partition for PC Storage (~1.6MB when populated).
 * Only written when PC contents actually change!
 */
export interface SavePCData {
  slotId: string;
  version: number;
  savedAt: number;
  storage: PcStorageState;
}
