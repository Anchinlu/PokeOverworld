import { describe, it, expect, beforeEach } from 'vitest';
import {
  storyLockManager,
  storyAnchorRegistry,
  StoryTriggerEvaluator,
  storyState,
  storyManager,
  type StoryEventDefinition,
} from '../src/story';
import { playerService } from '../src/domain';

describe('Story Architecture Contract Compliance', () => {
  beforeEach(() => {
    storyLockManager.clearAll();
    storyAnchorRegistry.clear();
    storyManager.reset();
  });

  describe('StoryLockManager (Resource Isolation & Ownership)', () => {
    it('acquires and releases locks cleanly with ownership tracking', () => {
      expect(storyLockManager.isLocked('input')).toBe(false);

      const lock = storyLockManager.acquire('input', 'event_act2_spearow');
      expect(storyLockManager.isLocked('input')).toBe(true);
      expect(storyLockManager.getOwner('input')).toBe('event_act2_spearow');

      // Unauthorized release should fail
      const unauthorized = storyLockManager.release('input', 'wrong_owner');
      expect(unauthorized).toBe(false);
      expect(storyLockManager.isLocked('input')).toBe(true);

      // Authorized release
      lock.release();
      expect(storyLockManager.isLocked('input')).toBe(false);
      expect(storyLockManager.getOwner('input')).toBeNull();
    });

    it('releases all locks owned by a specific event on cleanup', () => {
      storyLockManager.acquire('input', 'event_cutscene_1');
      storyLockManager.acquire('camera', 'event_cutscene_1');
      storyLockManager.acquire('wildlife', 'event_cutscene_2');

      expect(storyLockManager.isLocked('input')).toBe(true);
      expect(storyLockManager.isLocked('camera')).toBe(true);
      expect(storyLockManager.isLocked('wildlife')).toBe(true);

      storyLockManager.releaseAllForOwner('event_cutscene_1');

      expect(storyLockManager.isLocked('input')).toBe(false);
      expect(storyLockManager.isLocked('camera')).toBe(false);
      expect(storyLockManager.isLocked('wildlife')).toBe(true);
    });
  });

  describe('StoryAnchorRegistry (Functional Topological Anchors)', () => {
    it('resolves standard starter village anchors deterministically', () => {
      const exitGate = storyAnchorRegistry.resolve('starter_village.exit_gate', 101);
      expect(exitGate).toBeDefined();
      expect(typeof exitGate?.gx).toBe('number');
      expect(typeof exitGate?.gy).toBe('number');

      const labDoor = storyAnchorRegistry.resolve('starter_village.lab.front_door', 101);
      expect(labDoor).toBeDefined();

      const wildMarker = storyAnchorRegistry.resolve('route1.wild_marker', 101);
      expect(wildMarker).toBeDefined();
      // wildMarker is 6 tiles north of exit gate
      expect(wildMarker!.gy).toBe(exitGate!.gy - 6);
    });

    it('supports custom dynamic anchor registration and resolution', () => {
      storyAnchorRegistry.register('city.pokecenter.entrance', { gx: 16, gy: -112 });
      const anchor = storyAnchorRegistry.resolve('city.pokecenter.entrance');
      expect(anchor).toEqual({ gx: 16, gy: -112 });
    });
  });

  describe('StoryTriggerEvaluator (Anchor Proximity)', () => {
    it('matches anchor_proximity trigger rule within radius', () => {
      storyAnchorRegistry.register('test.marker', { gx: 10, gy: 20 });

      const trigger = {
        type: 'anchor_proximity' as const,
        anchorId: 'test.marker',
        radius: 2,
      };

      // Exactly at marker
      expect(
        StoryTriggerEvaluator.matchesTrigger(trigger, { playerGX: 10, playerGY: 20 })
      ).toBe(true);

      // Within radius 2
      expect(
        StoryTriggerEvaluator.matchesTrigger(trigger, { playerGX: 11, playerGY: 21 })
      ).toBe(true);

      // Outside radius 2
      expect(
        StoryTriggerEvaluator.matchesTrigger(trigger, { playerGX: 14, playerGY: 20 })
      ).toBe(false);
    });
  });

  describe('StoryState (Namespace Aliases & Atomic Transactions)', () => {
    it('supports bidirectional namespace and legacy flag aliasing', () => {
      // Setting canonical namespace flag
      storyState.setFlag('act2.route1.spearow.defeated', true);
      // Reads both canonical and legacy alias
      expect(storyState.hasFlag('act2.route1.spearow.defeated')).toBe(true);
      expect(storyState.hasFlag('route1_spearow_defeated')).toBe(true);
      expect(playerService.hasFlag('route1_spearow_defeated')).toBe(true);

      // Setting legacy alias
      storyState.setFlag('pallet_intro_completed', true);
      expect(storyState.hasFlag('act1.pallet.prologue.completed')).toBe(true);
      expect(storyState.hasFlag('pallet_intro_completed')).toBe(true);
    });

    it('stages mutations in beginTransaction and commits atomically', async () => {
      const tx = storyState.beginTransaction('test_event');
      tx.setFlag('act2.test.flag', true);
      tx.giveItem('poke_ball', 3);

      // Before commit, mutations are not yet applied
      expect(storyState.hasFlag('act2.test.flag')).toBe(false);

      await tx.commit();

      // After commit, mutations are applied
      expect(storyState.hasFlag('act2.test.flag')).toBe(true);
    });

    it('discards staged mutations on transaction rollback', async () => {
      const tx = storyState.beginTransaction('aborted_event');
      tx.setFlag('act2.aborted.flag', true);

      tx.rollback();
      await tx.commit(); // Should not apply after rollback

      expect(storyState.hasFlag('act2.aborted.flag')).toBe(false);
    });
  });

  describe('StoryManager (Lifecycle Execution: PREPARE -> RUN -> COMMIT -> CLEANUP)', () => {
    it('executes full lifecycle in strict sequence', async () => {
      const callOrder: string[] = [];

      const testEventDef: StoryEventDefinition = {
        id: 'test.lifecycle.event',
        act: 2,
        scene: 'Test Lifecycle',
        trigger: { type: 'condition_auto' },
        prepare: async () => {
          callOrder.push('prepare');
        },
        run: async () => {
          callOrder.push('run');
        },
        commit: async () => {
          callOrder.push('commit');
        },
        cleanup: async () => {
          callOrder.push('cleanup');
        },
      };

      const success = await storyManager.startEvent(testEventDef);
      expect(success).toBe(true);
      expect(callOrder).toEqual(['prepare', 'run', 'commit', 'cleanup']);
    });

    it('releases all locks owned by event during abort', async () => {
      storyLockManager.acquire('input', 'test.abort.event');
      storyLockManager.acquire('camera', 'test.abort.event');
      expect(storyLockManager.isLocked('input')).toBe(true);

      let abortCalled = false;
      const testEventDef: StoryEventDefinition = {
        id: 'test.abort.event',
        act: 2,
        scene: 'Abort Test',
        trigger: { type: 'condition_auto' },
        run: async (context) => {
          storyManager.abortEvent();
          await context.delay(500);
        },
        onAbort: () => {
          abortCalled = true;
        },
      };

      await storyManager.startEvent(testEventDef);
      expect(abortCalled).toBe(true);
      expect(storyLockManager.isLocked('input')).toBe(false);
      expect(storyLockManager.isLocked('camera')).toBe(false);
    });
  });
});
