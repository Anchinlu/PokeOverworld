/**
 * Quest Registry
 * Quản lý danh sách nhiệm vụ cốt truyện:
 * 1. Đi tới phòng Lab
 * 2. Ra ngoài và nói chuyện với mẹ
 */

import { playerService } from '../../domain';
import { palletPrologueEventManager } from '../../npc';
import { route1SpearowEventManager } from '../../story/acts/act-2-route1';
import type { QuestDefinition, QuestLocationTarget } from './types';

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  // =========================================================================
  // 1. ĐI TỚI PHÒNG LAB
  // =========================================================================
  {
    id: 'act1_pallet_meet_oak',
    category: 'event',
    act: 1,
    chapterTitle: 'HỒI 1: THỊ TRẤN PALLET',
    title: 'Đi Tới Phòng Lab',
    summary: 'Chạy đến thềm cửa Viện Nghiên Cứu Okido gặp Giáo sư.',
    detailedObjective: 'Tới thềm Viện Nghiên Cứu phía Bắc thị trấn gặp Giáo sư Okido nhận Starter và Pokédex.',
    autoWalkable: true,
    target: (session) => {
      const lab = session ? palletPrologueEventManager.findOakLab(session) : undefined;
      return {
        map: 'overworld',
        gx: lab?.doorGX ?? 48,
        gy: (lab?.doorGY ?? 38) + 1, // Đứng ngay trước thềm cửa Lab
        label: 'Phòng Lab Giáo Sư Okido',
      };
    },
    isActive: () => !playerService.hasFlag('pallet_lab_pokedex_received'),
    isCompleted: () => playerService.hasFlag('pallet_lab_pokedex_received'),
    getProgress: () => ({
      current: playerService.hasFlag('pallet_lab_pokedex_received') ? 1 : 0,
      total: 1,
    }),
  },

  // =========================================================================
  // 2. RA NGOÀI VÀ NÓI CHUYỆN VỚI MẸ
  // =========================================================================
  {
    id: 'act1_pallet_talk_to_mom',
    category: 'event',
    act: 1,
    chapterTitle: 'HỒI 1: THỊ TRẤN PALLET',
    title: 'Ra Ngoài Và Nói Chuyện Với Mẹ',
    summary: 'Bước ra thềm ngoài Viện Okido gặp Mẹ Delia và nhận hành trang lên đường.',
    detailedObjective: 'Rời khỏi phòng Lab ra sân ngoài, gặp Mẹ Delia để nhận Balo du hành, Giày chạy bộ và Găng tay cao su.',
    autoWalkable: true,
    target: (session) => {
      const isInterior = Boolean(session?.interiorManager?.isInInterior?.());
      if (isInterior) {
        return {
          map: 'oak_lab',
          gx: 7,
          gy: 11,
          label: 'Cửa Ra Khỏi Viện Nghiên Cứu',
        };
      }
      const lab = session ? palletPrologueEventManager.findOakLab(session) : undefined;
      return {
        map: 'overworld',
        gx: lab?.doorGX ?? 48,
        gy: (lab?.doorGY ?? 38) + 2, // Thềm ngoài nơi Mẹ Delia đứng cùng đám đông
        label: 'Thềm Viện Okido (Mẹ Delia)',
      };
    },
    isActive: () =>
      playerService.hasFlag('pallet_lab_pokedex_received') &&
      !playerService.hasFlag('pallet_crowd_mom_farewell_done'),
    isCompleted: () => playerService.hasFlag('pallet_crowd_mom_farewell_done'),
    getProgress: () => ({
      current: playerService.hasFlag('pallet_crowd_mom_farewell_done') ? 1 : 0,
      total: 1,
    }),
  },

  // =========================================================================
  // 3. TÌM KIẾM VÀ GẶP ONISUZUME (ACT 2 - ROUTE 1)
  // =========================================================================
  {
    id: 'act2_route1_find_spearow',
    category: 'event',
    act: 2,
    chapterTitle: 'HỒI 2: ĐƯỜNG SỐ 1 & BẦY ONISUZUME',
    title: 'Tìm Kiếm Onisuzume',
    summary: 'Tiến sâu vào thung lũng Route 1 phía Bắc để tìm kiếm Onisuzume.',
    detailedObjective: 'Tiến về phía Bắc Route 1, tìm kiếm chú Onisuzume hoang dã đứng một mình giữa đồng cỏ.',
    autoWalkable: true,
    target: (session) => {
      const spearow = route1SpearowEventManager.soloSpearowActor;
      if (spearow && spearow.visible) {
        return {
          map: 'overworld',
          gx: spearow.gx,
          gy: spearow.gy,
          label: 'Onisuzume Hoang Dã',
        };
      }
      const coords = session ? route1SpearowEventManager.getTargetCoordinates(session) : undefined;
      return {
        map: 'overworld',
        gx: coords?.gx ?? 12,
        gy: coords?.gy ?? -22,
        label: 'Vùng Thung Lũng Cỏ Route 1 (Onisuzume)',
      };
    },
    isActive: () =>
      playerService.hasFlag('pallet_crowd_mom_farewell_done') &&
      !playerService.hasFlag('route1_flock_escaped'),
    isCompleted: () => playerService.hasFlag('route1_flock_escaped'),
    getProgress: () => ({
      current: playerService.hasFlag('route1_spearow_defeated') ? 1 : 0,
      total: 2,
    }),
  },
];

export class QuestRegistry {
  private static instance: QuestRegistry;

  public static getInstance(): QuestRegistry {
    if (!QuestRegistry.instance) {
      QuestRegistry.instance = new QuestRegistry();
    }
    return QuestRegistry.instance;
  }

  public getAllQuests(): QuestDefinition[] {
    return QUEST_DEFINITIONS;
  }

  public getQuestById(id: string): QuestDefinition | undefined {
    return QUEST_DEFINITIONS.find((q) => q.id === id);
  }

  /**
   * Returns active Event Quests (nhiệm vụ sự kiện)
   */
  public getActiveEventQuests(_session?: any): QuestDefinition[] {
    return QUEST_DEFINITIONS.filter(
      (q) => q.category === 'event' && q.isActive() && !q.isCompleted()
    );
  }

  /**
   * Returns active Gathering Quests (nhiệm vụ thu thập)
   */
  public getActiveGatheringQuests(_session?: any): QuestDefinition[] {
    return QUEST_DEFINITIONS.filter(
      (q) => q.category === 'gathering' && q.isActive() && !q.isCompleted()
    );
  }

  /**
   * Backward compatibility helpers
   */
  public getActiveMainQuest(_session?: any): QuestDefinition | undefined {
    return this.getActiveEventQuests()[0];
  }

  public getActiveSideQuests(_session?: any): QuestDefinition[] {
    return this.getActiveGatheringQuests();
  }

  /**
   * Resolves target coordinates for a given quest definition in the active session.
   */
  public resolveTarget(quest: QuestDefinition, session?: any): QuestLocationTarget | undefined {
    if (!quest.target) return undefined;
    if (typeof quest.target === 'function') {
      return quest.target(session);
    }
    return quest.target;
  }
}

export const questRegistry = QuestRegistry.getInstance();
