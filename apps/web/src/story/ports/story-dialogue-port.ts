/**
 * Story Dialogue Port Interface
 */

import type { DialogueOptions } from '../types/cutscene-types';

export interface StoryDialoguePort {
  showDialogue(speaker: string, lines: string[], options?: DialogueOptions): Promise<void>;
  hideDialogue(): void;
  isDialogueActive(): boolean;
}
