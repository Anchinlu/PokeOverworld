/**
 * NPC Event Hook & Story Script Registry
 * Provides the extensible bridge between NPC entities and future Story / Quest / Event scripts
 * without hardcoding story plots into the core engine.
 */

import {
  partyService,
  playerService,
  createPartyPokemon,
  pcStorageService,
  autosaveCoordinator,
} from '../domain';
import { showBerryToast } from '../ui/toast';
import { battleSePlayer } from '../audio';
import type {
  NPCStoryCondition,
  NPCDialogueBranch,
  NPCEventAction,
  NPCStoryScript,
  NPCTrainerProfile,
  NPCRuntimeState,
} from './npc-types';
import { triggerNPCEmote } from './npc-behavior-controller';

export interface StoryExecutionCallbacks {
  onStartTrainerBattle?: (trainer: NPCTrainerProfile) => void;
  onRunCutscene?: (cutsceneId: string) => void;
  npcRuntimeState?: NPCRuntimeState;
}

const storyScriptRegistry = new Map<string, NPCStoryScript>();
const trainerProfileRegistry = new Map<string, NPCTrainerProfile>();

/**
 * Registers a story script that an NPC can reference via `scriptId`.
 */
export function registerNPCStoryScript(script: NPCStoryScript): void {
  storyScriptRegistry.set(script.scriptId, script);
}

export function getNPCStoryScript(scriptId: string): NPCStoryScript | undefined {
  return storyScriptRegistry.get(scriptId);
}

/**
 * Registers a trainer profile that an NPC or event can reference via `trainerId`.
 */
export function registerTrainerProfile(profile: NPCTrainerProfile): void {
  trainerProfileRegistry.set(profile.trainerId, profile);
}

export function getTrainerProfile(trainerId: string): NPCTrainerProfile | undefined {
  return trainerProfileRegistry.get(trainerId);
}

/**
 * Evaluates whether a story condition is satisfied by the player's current profile.
 */
export function evaluateStoryCondition(cond?: NPCStoryCondition): boolean {
  if (!cond) return true;

  if (cond.flag !== undefined) {
    if (cond.flagEquals !== undefined) {
      if (!playerService.hasFlag(cond.flag, cond.flagEquals)) return false;
    } else if (!playerService.hasFlag(cond.flag)) {
      return false;
    }
  }

  if (cond.flagNotSet !== undefined) {
    if (playerService.hasFlag(cond.flagNotSet)) return false;
  }

  if (cond.questId !== undefined) {
    const stage = playerService.getQuestStage(cond.questId);
    if (cond.questStageMin !== undefined && stage < cond.questStageMin) return false;
    if (cond.questStageMax !== undefined && stage > cond.questStageMax) return false;
  }

  if (cond.trainerDefeated !== undefined) {
    if (!playerService.isTrainerDefeated(cond.trainerDefeated)) return false;
  }

  if (cond.trainerNotDefeated !== undefined) {
    if (playerService.isTrainerDefeated(cond.trainerNotDefeated)) return false;
  }

  return true;
}

/**
 * Executes an array of NPC Event Actions (healing, items, Pokemon gifts, flags, quests, battles).
 */
export function executeNPCEventActions(
  actions: NPCEventAction[] | undefined,
  callbacks?: StoryExecutionCallbacks
): void {
  if (!actions || actions.length === 0) return;

  for (const action of actions) {
    switch (action.type) {
      case 'HEAL_PARTY': {
        partyService.healAll();
        battleSePlayer.playSound('Audio/SE/Pkmn move learnt.ogg', 0.85);
        showBerryToast(
          action.message || '💖 Toàn bộ Pokémon trong đội hình đã được hồi phục đầy HP & PP!',
          '#22c55e'
        );
        break;
      }

      case 'GIVE_ITEM': {
        if (action.flagToSet && playerService.hasFlag(action.flagToSet)) {
          break;
        }
        playerService.addItem(action.itemId, action.count);
        if (action.flagToSet) {
          playerService.setFlag(action.flagToSet, true);
        }
        battleSePlayer.playSound('Audio/SE/Pkmn get.ogg', 0.85);
        showBerryToast(
          action.message || `🎁 Nhận được ${action.count}x ${action.itemId}!`,
          '#38bdf8'
        );
        break;
      }

      case 'GIVE_POKEMON': {
        if (action.flagToSet && playerService.hasFlag(action.flagToSet)) {
          break;
        }
        const giftPk = createPartyPokemon(action.speciesKey, action.level, {
          isShiny: action.isShiny ?? false,
        });
        playerService.incrementCaught();
        if (action.flagToSet) {
          playerService.setFlag(action.flagToSet, true);
        }
        battleSePlayer.playSound('Audio/SE/Pkmn get.ogg', 0.9);
        if (!partyService.isPartyFull()) {
          partyService.addPokemon(giftPk);
          showBerryToast(
            action.message ||
              `🎉 Đã nhận Pokémon ${giftPk.name} (Lv.${giftPk.level}) vào Đội hình!`,
            '#22c55e'
          );
        } else {
          const res = pcStorageService.depositPokemon(giftPk);
          showBerryToast(
            action.message ||
              `🎉 Đã nhận Pokémon ${giftPk.name} (Lv.${giftPk.level})! Đã chuyển vào PC (${res.boxName})!`,
            '#38bdf8'
          );
        }
        break;
      }

      case 'GIVE_MONEY': {
        if (action.flagToSet && playerService.hasFlag(action.flagToSet)) {
          break;
        }
        playerService.addMoney(action.amount);
        if (action.flagToSet) {
          playerService.setFlag(action.flagToSet, true);
        }
        showBerryToast(
          action.message || `💰 Nhận được ₽${action.amount.toLocaleString()}!`,
          '#facc15'
        );
        break;
      }

      case 'SET_FLAG': {
        playerService.setFlag(action.key, action.value);
        break;
      }

      case 'ADVANCE_QUEST': {
        playerService.advanceQuest(action.questId, action.stage, action.completed ?? false);
        break;
      }

      case 'EMOTE': {
        if (callbacks?.npcRuntimeState) {
          triggerNPCEmote(callbacks.npcRuntimeState, action.emote, action.durationMs ?? 2200);
        }
        break;
      }

      case 'START_TRAINER_BATTLE': {
        const trainer = trainerProfileRegistry.get(action.trainerId);
        if (trainer && callbacks?.onStartTrainerBattle) {
          callbacks.onStartTrainerBattle(trainer);
        }
        break;
      }

      case 'RUN_CUTSCENE': {
        if (callbacks?.onRunCutscene) {
          callbacks.onRunCutscene(action.cutsceneId);
        }
        break;
      }
    }
  }

  autosaveCoordinator.flushImmediate('npc_story_event');
}

/**
 * Resolves the active dialogue branch for a given scriptId or falls back to default NPC dialogue.
 */
export function resolveNPCDialogueBranch(
  scriptId: string | undefined,
  fallbackLines: string[],
  fallbackActions?: NPCEventAction[]
): NPCDialogueBranch {
  if (scriptId) {
    const script = storyScriptRegistry.get(scriptId);
    if (script) {
      for (const branch of script.branches) {
        if (evaluateStoryCondition(branch.condition)) {
          return branch;
        }
      }
      return {
        lines: script.defaultLines.length > 0 ? script.defaultLines : fallbackLines,
        actionsOnComplete: fallbackActions,
      };
    }
  }
  return {
    lines: fallbackLines,
    actionsOnComplete: fallbackActions,
  };
}
