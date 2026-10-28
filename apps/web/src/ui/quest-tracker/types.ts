/**
 * Quest Tracker & Navigation System - Types
 * Categorizes quests into:
 * 1. 'event' (Nhiệm vụ Sự kiện - tự động dẫn bước nhân vật đến điểm diễn ra sự kiện)
 * 2. 'gathering' (Nhiệm vụ Thu thập - người chơi tự khám phá và hoàn thành theo ghi chú)
 */

export type QuestCategory = 'event' | 'gathering';

export interface QuestLocationTarget {
  map: 'overworld' | 'oak_lab' | 'player_house' | string;
  gx: number;
  gy: number;
  label: string;
}

export interface QuestProgress {
  current: number;
  total: number;
  label?: string;
}

export interface QuestDefinition {
  id: string;
  category: QuestCategory;
  act: number;
  chapterTitle: string;
  title: string;
  summary: string;
  detailedObjective?: string;
  /** Detailed instructions / exploration notes for gathering quests */
  notes?: string;
  target?: QuestLocationTarget | ((session?: any) => QuestLocationTarget | undefined);
  /** Whether the player can auto-walk to this location (true for event quests) */
  autoWalkable?: boolean;
  /** Whether the quest is currently available and should appear in the tracker */
  isActive: (state?: any) => boolean;
  /** Whether the quest has been completed */
  isCompleted: (state?: any) => boolean;
  /** Optional progress calculator */
  getProgress?: (state?: any) => QuestProgress;
}

export interface NavigationStatus {
  isNavigating: boolean;
  questId: string | null;
  targetGX: number;
  targetGY: number;
  targetMap: string;
  label: string;
  remainingSteps: number;
  isArrived: boolean;
}
