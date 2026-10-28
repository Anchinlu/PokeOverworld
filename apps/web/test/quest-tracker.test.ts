import { describe, it, expect, beforeEach } from 'vitest';
import {
  questRegistry,
  autoWalkNavigator,
  questTrackerController,
} from '../src/ui/quest-tracker';
import { playerService } from '../src/domain/player/player-service';

describe('Quest Tracker & Auto-Walk System', () => {
  beforeEach(() => {
    playerService.reset();
    autoWalkNavigator.cancel(true);
  });

  describe('Quest Registry (Đi tới phòng Lab -> Ra ngoài nói chuyện với Mẹ)', () => {
    it('activates Lab quest first when player has not finished Lab events', () => {
      const activeEvents = questRegistry.getActiveEventQuests();
      expect(activeEvents.length).toBe(1);
      const meetOak = activeEvents[0];
      expect(meetOak.id).toBe('act1_pallet_meet_oak');
      expect(meetOak.title).toBe('Đi Tới Phòng Lab');
      expect(meetOak.autoWalkable).toBe(true);
    });

    it('transitions to "Ra Ngoài Và Nói Chuyện Với Mẹ" once Pokédex is received in Lab', () => {
      // Complete lab events (Scene 7)
      playerService.setFlag('pallet_lab_pokedex_received', true);

      const activeEvents = questRegistry.getActiveEventQuests();
      expect(activeEvents.length).toBe(1);
      const talkToMom = activeEvents[0];
      expect(talkToMom.id).toBe('act1_pallet_talk_to_mom');
      expect(talkToMom.title).toBe('Ra Ngoài Và Nói Chuyện Với Mẹ');
      expect(talkToMom.summary).toContain('Mẹ Delia');
      expect(talkToMom.autoWalkable).toBe(true);
    });

    it('resolves target for Mom quest depending on interior vs overworld', () => {
      playerService.setFlag('pallet_lab_pokedex_received', true);
      const talkToMom = questRegistry.getQuestById('act1_pallet_talk_to_mom')!;

      // Case A: Player is inside the Lab
      const interiorSession = {
        interiorManager: { isInInterior: () => true },
      };
      const interiorTarget = questRegistry.resolveTarget(talkToMom, interiorSession);
      expect(interiorTarget).toBeDefined();
      expect(interiorTarget?.map).toBe('oak_lab');
      expect(interiorTarget?.gx).toBe(7);
      expect(interiorTarget?.gy).toBe(11); // Door mat exit warp

      // Case B: Player is outside in the Overworld
      const overworldSession = {
        interiorManager: { isInInterior: () => false },
        palletPrologueEventManager: {
          findOakLab: () => ({ doorGX: 48, doorGY: 38 }),
        },
      };
      const overworldTarget = questRegistry.resolveTarget(talkToMom, overworldSession);
      expect(overworldTarget).toBeDefined();
      expect(overworldTarget?.map).toBe('overworld');
      expect(overworldTarget?.gx).toBe(48);
      expect(overworldTarget?.gy).toBe(40); // Outside porch
    });

    it('completes Mom quest once scene 8 farewell is finished', () => {
      playerService.setFlag('pallet_lab_pokedex_received', true);
      playerService.setFlag('pallet_crowd_mom_farewell_done', true);

      const momQuest = questRegistry.getQuestById('act1_pallet_talk_to_mom')!;
      expect(momQuest.isCompleted()).toBe(true);
      expect(momQuest.isActive()).toBe(false);

      const activeEvents = questRegistry.getActiveEventQuests();
      expect(activeEvents.length).toBe(1);
      expect(activeEvents[0].id).toBe('act2_route1_find_spearow');
    });
  });

  describe('AutoWalkNavigator (Nhân vật tự đi đến vùng sự kiện)', () => {
    it('starts auto-walk for the active quest and allows cancellation', () => {
      const mockSession = {
        player: { gx: 48, gy: 48, direction: 0 },
        interiorManager: { isInInterior: () => false },
        chunkManager: { isWalkable: () => true },
        palletPrologueEventManager: {
          findOakLab: () => ({ doorGX: 48, doorGY: 38 }),
        },
      };

      const eventQuest = questRegistry.getQuestById('act1_pallet_meet_oak')!;
      const eventStarted = autoWalkNavigator.startAutoWalk(eventQuest, mockSession);
      expect(eventStarted).toBe(true);
      expect(autoWalkNavigator.isAutoWalking()).toBe(true);
      expect(autoWalkNavigator.getActiveQuestId()).toBe('act1_pallet_meet_oak');

      // Cancel
      autoWalkNavigator.cancel(true);
      expect(autoWalkNavigator.isAutoWalking()).toBe(false);
    });

    it('navigates towards lab door or exit based on location', () => {
      const mockSession = {
        player: { gx: 48, gy: 48, direction: 0 },
        interiorManager: { isInInterior: () => false },
        chunkManager: { isWalkable: () => true },
        palletPrologueEventManager: {
          findOakLab: () => ({ doorGX: 48, doorGY: 38 }),
        },
      };

      const eventQuest = questRegistry.getQuestById('act1_pallet_meet_oak')!;
      autoWalkNavigator.startAutoWalk(eventQuest, mockSession);

      // Player is at gy: 48, target is gy: 39 (North). Next direction is Up (3).
      const nextDir = autoWalkNavigator.getNextStepDirection(mockSession);
      expect(nextDir).toBe(3);
    });

    it('stops auto-walking adjacent to target location and faces target face-to-face', () => {
      const mockSession = {
        player: { gx: 48, gy: 40, direction: 0 },
        interiorManager: { isInInterior: () => false },
        chunkManager: { isWalkable: () => true },
        palletPrologueEventManager: {
          findOakLab: () => ({ doorGX: 48, doorGY: 38 }),
        },
      };

      const eventQuest = questRegistry.getQuestById('act1_pallet_meet_oak')!;
      autoWalkNavigator.startAutoWalk(eventQuest, mockSession);

      // Player is at gy: 40, target is gy: 39 (1 tile adjacent North)
      // Auto-walk should immediately finish adjacent and orient player to face North (direction 3)
      const nextDir = autoWalkNavigator.getNextStepDirection(mockSession);
      expect(nextDir).toBeNull();
      expect(autoWalkNavigator.isAutoWalking()).toBe(false);
      expect(mockSession.player.direction).toBe(3); // Face UP toward target
    });
  });

  describe('QuestTrackerController', () => {
    it('manages initialization, session updates, and collapse/expand toggle', () => {
      const mockSession = {
        player: { gx: 48, gy: 48 },
        interiorManager: { isInInterior: () => false },
      };

      expect(questTrackerController).toBeDefined();
      expect(questTrackerController.isWidgetCollapsed()).toBe(false);

      questTrackerController.init(mockSession);

      // Toggle collapse
      questTrackerController.toggleCollapse();
      expect(questTrackerController.isWidgetCollapsed()).toBe(true);

      // Toggle back
      questTrackerController.toggleCollapse();
      expect(questTrackerController.isWidgetCollapsed()).toBe(false);
    });
  });
});
