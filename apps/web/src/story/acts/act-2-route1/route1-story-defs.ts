/**
 * Story Event Definitions for Act 2: Route 1 & Spearow Flock
 * Complies with STORY_ARCHITECTURE_CONTRACT.md:
 * - Uses functional anchor `route1.wild_marker` instead of hardcoded coordinates.
 * - Standard namespace flags with backward-compatible aliases.
 * - Full lifecycle: prepare, run, commit, cleanup, onAbort.
 */

import { storyEventRegistry } from '../../core/story-event-registry';
import type { StoryEventDefinition } from '../../types';
import { route1SpearowEventManager } from './route1-spearow-event';
import { storyLockManager } from '../../core/story-lock-manager';

export const route1SpearowEventDef: StoryEventDefinition = {
  id: 'act2.route1.spearow_encounter',
  act: 2,
  priority: 10,
  scene: 'Route 1 - Onisuzume Encounter, Flock Chase & Waterfall Plunge',
  trigger: {
    type: 'anchor_proximity',
    anchorId: 'route1.wild_marker',
    radius: 3,
  },
  prerequisites: [
    { flag: 'act1.pallet.crowd_farewell.completed' },
    { flagNotSet: 'act2.route1.flock.escaped' },
  ],
  checkpoint: 'act2_route1_spearow_escaped',
  prepare: async () => {
    storyLockManager.acquire('wildlife', 'act2.route1.spearow_encounter');
  },
  run: async (context) => {
    const session = (context.game as any)?.session;
    if (session) {
      await route1SpearowEventManager.triggerEncounter(session);
    }
  },
  cleanup: async () => {
    storyLockManager.releaseAllForOwner('act2.route1.spearow_encounter');
  },
  onAbort: () => {
    route1SpearowEventManager.reset();
  },
};

storyEventRegistry.register(route1SpearowEventDef);
