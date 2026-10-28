/**
 * Cutscene Engine Step Types & Directives
 */

import type { Direction } from '@pokemon/shared-types';
import type { NPCEmoteType } from '../../npc/npc-types';

export type BustPosition = 'left' | 'right';

export interface DialogueOptions {
  portraitSrc?: string;
  position?: BustPosition;
  sfx?: string;
  zapShake?: boolean;
}

export type CutsceneStep =
  | { type: 'LOCK_INPUT' }
  | { type: 'UNLOCK_INPUT' }
  | { type: 'WAIT'; durationMs: number }
  | { type: 'FACE'; targetId: string; direction: Direction }
  | { type: 'MOVE_STEPS'; targetId: string; steps: Direction[]; speed?: number }
  | { type: 'SNAP_POSITION'; targetId: string; gx: number; gy: number; direction?: Direction }
  | { type: 'SET_VISIBLE'; targetId: string; visible: boolean }
  | { type: 'EMOTE'; targetId: string; emote: NPCEmoteType; durationMs?: number }
  | { type: 'DIALOGUE'; speaker: string; lines: string[]; options?: DialogueOptions }
  | { type: 'PLAY_SOUND'; sfxPath: string; volume?: number }
  | { type: 'PLAY_CRY'; cryPath: string; volume?: number }
  | { type: 'CAMERA_PAN'; targetGX: number; targetGY: number; durationMs: number }
  | { type: 'SCREEN_FLASH'; color: string; durationMs: number }
  | { type: 'SCREEN_SHAKE'; intensity: number; durationMs: number }
  | { type: 'SET_FLAG'; flag: string; value: boolean | number | string }
  | { type: 'CUSTOM'; action: () => Promise<void> | void };
