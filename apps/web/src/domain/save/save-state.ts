/**
 * Save Game Schema & State Definitions
 * Single unified representation of persisted game state across all systems.
 */

import type { PlayerProfile } from '../player/player-state';
import type { PartyPokemon } from '../party/party-state';

export const CURRENT_SAVE_VERSION = 2;
export const DEFAULT_SAVE_SLOT = 'slot_1';

export interface SaveGameMetadata {
  version: number;
  savedAt: number;
  slotId: string;
  playerName: string;
  money: number;
  badgesCount: number;
  partyCount: number;
  leaderName: string;
  leaderLevel: number;
  playTimeSeconds: number;
}

export interface SaveWorldData {
  seed?: number;
  position: {
    gx: number;
    gy: number;
    direction: number;
  };
}

export interface SaveGameData {
  metadata: SaveGameMetadata;
  player: PlayerProfile;
  party: PartyPokemon[];
  inventory: Record<string, number>;
  world?: SaveWorldData;
}
