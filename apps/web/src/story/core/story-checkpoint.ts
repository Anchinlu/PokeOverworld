/**
 * Story Checkpoint Manager
 * Manages persisting and recovering story checkpoints to prevent state inconsistency.
 */

import { playerService } from '../../domain';
import type { StoryAct, StoryCheckpointRecord } from '../types';

export class StoryCheckpoint {
  private static readonly CHECKPOINT_FLAG_PREFIX = 'story_chk_';

  /**
   * Saves a checkpoint for an event.
   */
  public static setCheckpoint(
    eventId: string,
    checkpointId: string,
    act: StoryAct,
    metadata?: Record<string, unknown>
  ): void {
    const record: StoryCheckpointRecord = {
      checkpointId,
      eventId,
      act,
      savedAtTimestamp: Date.now(),
      metadata,
    };
    playerService.setFlag(`${StoryCheckpoint.CHECKPOINT_FLAG_PREFIX}${eventId}`, JSON.stringify(record));
    playerService.setFlag('last_story_checkpoint', checkpointId);
  }

  /**
   * Retrieves the saved checkpoint for an event, if any.
   */
  public static getCheckpoint(eventId: string): StoryCheckpointRecord | null {
    const raw = playerService.getFlag(`${StoryCheckpoint.CHECKPOINT_FLAG_PREFIX}${eventId}`);
    if (typeof raw !== 'string') return null;
    try {
      return JSON.parse(raw) as StoryCheckpointRecord;
    } catch {
      return null;
    }
  }

  /**
   * Clears a checkpoint once the event has fully completed.
   */
  public static clearCheckpoint(eventId: string): void {
    playerService.setFlag(`${StoryCheckpoint.CHECKPOINT_FLAG_PREFIX}${eventId}`, '');
  }

  /**
   * Returns the last globally reached checkpoint ID.
   */
  public static getLastCheckpointId(): string {
    const raw = playerService.getFlag('last_story_checkpoint');
    return typeof raw === 'string' ? raw : '';
  }
}
