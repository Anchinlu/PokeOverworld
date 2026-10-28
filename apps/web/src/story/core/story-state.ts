/**
 * Story State Intermediary
 * Unified boundary for reading and mutating story flags, quest progression,
 * defeated trainers, and checkpoints without directly coupling events to playerService.
 *
 * Implements namespace flag aliasing and atomic commit transactions per STORY_ARCHITECTURE_CONTRACT.md.
 */

import { playerService } from '../../domain';
import type { StoryAct, StoryCondition } from '../types';
import { StoryCheckpoint } from './story-checkpoint';

export const FLAG_ALIASES: Record<string, string> = {
  // Act 1
  'act1.pallet.prologue.completed': 'pallet_intro_completed',
  'act1.pallet.pokedex.received': 'pallet_lab_pokedex_received',
  'act1.pallet.starter_balls.received': 'received_starter_balls',
  'act1.pallet.starter_pikachu.received': 'received_starter_pikachu',
  'act1.pallet.lab_event.completed': 'pallet_lab_gate_event_done',
  'act1.pallet.crowd_farewell.completed': 'pallet_crowd_mom_farewell_done',
  'act1.pallet.exit_gate.passed': 'left_pallet_town',
  'act1.pallet.completed': 'act1_completed',
  // Act 2
  'act2.route1.spearow.defeated': 'route1_spearow_defeated',
  'act2.route1.flock.escaped': 'route1_flock_escaped',
  'act2.route1.completed': 'route1_act2_completed',
  'act2.route1.arrived_next_village': 'arrived_next_village',
};

// Build reverse alias map
const REVERSE_ALIASES: Record<string, string> = {};
for (const [canonical, legacy] of Object.entries(FLAG_ALIASES)) {
  REVERSE_ALIASES[legacy] = canonical;
}

export interface StoryTransaction {
  eventId: string;
  setFlag(key: string, value: boolean | number | string): StoryTransaction;
  giveItem(itemId: string, quantity: number): StoryTransaction;
  advanceQuest(questId: string, nextStage: number, completed?: boolean): StoryTransaction;
  commit(): Promise<void>;
  rollback(): void;
}

export class StoryState {
  private static instance: StoryState;

  public static getInstance(): StoryState {
    if (!StoryState.instance) {
      StoryState.instance = new StoryState();
    }
    return StoryState.instance;
  }

  // --- ACT MANAGEMENT ---

  public getCurrentAct(): StoryAct {
    const act = playerService.getFlag('story_act');
    if (typeof act === 'number' && act >= 1 && act <= 8) {
      return act as StoryAct;
    }
    return 1;
  }

  public setAct(act: StoryAct): void {
    playerService.setFlag('story_act', act);
  }

  // --- STORY FLAGS ---

  public hasFlag(key: string, expectedValue?: boolean | number | string): boolean {
    if (playerService.hasFlag(key, expectedValue)) {
      return true;
    }
    const legacyKey = FLAG_ALIASES[key];
    if (legacyKey && playerService.hasFlag(legacyKey, expectedValue)) {
      return true;
    }
    const canonicalKey = REVERSE_ALIASES[key];
    if (canonicalKey && playerService.hasFlag(canonicalKey, expectedValue)) {
      return true;
    }
    return false;
  }

  public getFlag(key: string): boolean | number | string | undefined {
    const val = playerService.getFlag(key);
    if (val !== undefined) return val;
    const legacyKey = FLAG_ALIASES[key];
    if (legacyKey) {
      const legacyVal = playerService.getFlag(legacyKey);
      if (legacyVal !== undefined) return legacyVal;
    }
    const canonicalKey = REVERSE_ALIASES[key];
    if (canonicalKey) {
      return playerService.getFlag(canonicalKey);
    }
    return undefined;
  }

  public setFlag(key: string, value: boolean | number | string): void {
    playerService.setFlag(key, value);
    const legacyKey = FLAG_ALIASES[key];
    if (legacyKey) {
      playerService.setFlag(legacyKey, value);
    }
    const canonicalKey = REVERSE_ALIASES[key];
    if (canonicalKey) {
      playerService.setFlag(canonicalKey, value);
    }
  }

  public removeFlag(key: string): void {
    this.setFlag(key, false);
  }

  // --- QUESTS ---

  public getQuestStage(questId: string): number {
    return playerService.getQuestStage(questId);
  }

  public advanceQuest(questId: string, nextStage: number, completed = false): void {
    playerService.advanceQuest(questId, nextStage, completed);
  }

  public isQuestCompleted(questId: string): boolean {
    return playerService.isQuestCompleted(questId);
  }

  // --- TRAINERS ---

  public isTrainerDefeated(trainerId: string): boolean {
    return playerService.isTrainerDefeated(trainerId);
  }

  public markTrainerDefeated(trainerId: string): void {
    playerService.markTrainerDefeated(trainerId);
  }

  // --- ATOMIC COMMIT TRANSACTIONS ---

  /**
   * Begins a new transaction for safely staging mutations before committing.
   */
  public beginTransaction(eventId: string): StoryTransaction {
    const pendingFlags: Array<{ key: string; value: boolean | number | string }> = [];
    const pendingItems: Array<{ itemId: string; count: number }> = [];
    const pendingQuests: Array<{ questId: string; stage: number; completed?: boolean }> = [];
    let isCommitted = false;

    const tx: StoryTransaction = {
      eventId,
      setFlag: (key, value) => {
        if (!isCommitted) {
          pendingFlags.push({ key, value });
        }
        return tx;
      },
      giveItem: (itemId, count) => {
        if (!isCommitted) {
          pendingItems.push({ itemId, count });
        }
        return tx;
      },
      advanceQuest: (questId, stage, completed) => {
        if (!isCommitted) {
          pendingQuests.push({ questId, stage, completed });
        }
        return tx;
      },
      commit: async () => {
        if (isCommitted) return;
        isCommitted = true;

        // Apply all staged mutations atomically
        for (const f of pendingFlags) {
          this.setFlag(f.key, f.value);
        }
        for (const it of pendingItems) {
          playerService.addItem(it.itemId, it.count);
        }
        for (const q of pendingQuests) {
          this.advanceQuest(q.questId, q.stage, q.completed);
        }
      },
      rollback: () => {
        pendingFlags.length = 0;
        pendingItems.length = 0;
        pendingQuests.length = 0;
        isCommitted = true;
      },
    };

    return tx;
  }

  // --- CHECKPOINTS ---

  public setCheckpoint(eventId: string, checkpointId: string, metadata?: Record<string, unknown>): void {
    StoryCheckpoint.setCheckpoint(eventId, checkpointId, this.getCurrentAct(), metadata);
  }

  public getCheckpoint(eventId: string) {
    return StoryCheckpoint.getCheckpoint(eventId);
  }

  public clearCheckpoint(eventId: string): void {
    StoryCheckpoint.clearCheckpoint(eventId);
  }

  // --- CONDITION EVALUATION ---

  public evaluateCondition(cond: StoryCondition): boolean {
    if (cond.flag && !this.hasFlag(cond.flag, cond.flagEquals)) {
      return false;
    }
    if (cond.flagNotSet && this.hasFlag(cond.flagNotSet)) {
      return false;
    }
    if (cond.questId) {
      const stage = this.getQuestStage(cond.questId);
      if (cond.questStageMin !== undefined && stage < cond.questStageMin) {
        return false;
      }
      if (cond.questStageMax !== undefined && stage > cond.questStageMax) {
        return false;
      }
    }
    if (cond.trainerDefeated && !this.isTrainerDefeated(cond.trainerDefeated)) {
      return false;
    }
    if (cond.trainerNotDefeated && this.isTrainerDefeated(cond.trainerNotDefeated)) {
      return false;
    }
    return true;
  }

  public evaluateAll(conditions?: StoryCondition[]): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((c) => this.evaluateCondition(c));
  }
}

export const storyState = StoryState.getInstance();
