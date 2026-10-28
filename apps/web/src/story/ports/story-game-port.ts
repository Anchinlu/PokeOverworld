/**
 * Story Game Port Interface
 * Abstraction layer for interacting with player, actors, world, and party.
 */

import type { Direction } from '@pokemon/shared-types';
import type { NPCEmoteType } from '../../npc/npc-types';

export interface StoryGamePort {
  getPlayerPosition(): { gx: number; gy: number; dir: Direction };
  snapPlayer(gx: number, gy: number, dir?: Direction): void;
  lockInput(): void;
  unlockInput(): void;
  isInputLocked(): boolean;
  setPlayerDirection(dir: Direction): void;
  setPlayerEmote(emote: NPCEmoteType | null, durationMs?: number): void;
  setActorEmote(actorId: string, emote: NPCEmoteType, durationMs?: number): void;
  setActorDirection(actorId: string, dir: Direction): void;
  setActorVisible(actorId: string, visible: boolean): void;
  snapActor(actorId: string, gx: number, gy: number, dir?: Direction): void;
  moveActor(actorId: string, steps: Direction[], speed?: number): Promise<void>;
  giveItem(itemId: string, count: number): void;
  giveStarterPokemon(species: string | number, level: number): boolean;
  setFollowerVisible(visible: boolean): void;
  snapFollower(gx: number, gy: number, dir?: Direction): void;
}
