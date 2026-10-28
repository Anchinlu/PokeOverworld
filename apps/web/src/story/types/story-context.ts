/**
 * Story Context Contract
 * Provided to each StoryEventDefinition.run(context) to isolate engine dependencies.
 */

import type {
  StoryGamePort,
  StoryDialoguePort,
  StoryAudioPort,
  StoryCameraPort,
  StoryWorldPort,
} from '../ports';
import type { StoryState } from '../core/story-state';
import type { StoryLockManager } from '../core/story-lock-manager';

export interface StoryContext {
  game: StoryGamePort;
  dialogue: StoryDialoguePort;
  audio: StoryAudioPort;
  camera: StoryCameraPort;
  world?: StoryWorldPort;
  locks?: StoryLockManager;
  state: StoryState;
  abortSignal: AbortSignal;
  delay(ms: number): Promise<void>;
}
