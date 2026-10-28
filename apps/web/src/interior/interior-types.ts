export interface InteriorPropPlacement {
  id: string;
  assetKey: string;
  gx: number;
  gy: number;
  widthTiles: number;
  heightTiles: number;
  isSolid?: boolean;
  solidOffsetX?: number;
  solidOffsetY?: number;
  solidWidthTiles?: number;
  solidHeightTiles?: number;
  ySortOffset?: number;
  layer?: 'floor' | 'object' | 'overhead';
  interactText?: string;
  sourceX?: number;
  sourceY?: number;
  sourceWidth?: number;
  sourceHeight?: number;
}

import type { NPCEmoteType, NPCEventAction, NPCMovementMode } from '../npc/npc-types';

export type NPCIdleBehavior = 'stand' | 'turn_random' | 'turn_cycle';

export interface InteriorNPC {
  id: string;
  name: string;
  spriteKey: string;
  gx: number;
  gy: number;
  direction: 0 | 1 | 2 | 3; // 0=down, 1=left, 2=right, 3=up
  dialogue: string[];
  idleBehavior?: NPCIdleBehavior;
  movementMode?: NPCMovementMode;
  turnCycle?: Array<0 | 1 | 2 | 3>;
  turnIntervalMs?: number;
  initialDirection?: 0 | 1 | 2 | 3;
  wanderRadius?: number;
  patrolPath?: Array<{ gx: number; gy: number }>;
  lookAtPlayerRadius?: number;
  ambientEmotePool?: NPCEmoteType[];
  ySortOffset?: number;
  scriptId?: string;
  actionsOnComplete?: NPCEventAction[];
}

export interface InteriorWarp {
  gx: number;
  gy: number;
  label: string;
}

export interface InteriorCarpetRunner {
  gx: number;
  gy: number;
  widthTiles: number;
  heightTiles: number;
  color?: string;
}

export interface InteriorStairsWarp {
  gx: number;
  gy: number;
  targetRoomId: string;
  targetGX: number;
  targetGY: number;
  targetDir?: 0 | 1 | 2 | 3;
  label?: string;
}

export interface InteriorRoomConfig {
  id: string;
  name: string;
  widthTiles: number;
  heightTiles: number;
  floorAssetKey: string;
  floorBorderAssetKey?: string;
  wallAssetKey: string;
  wallHeightTiles: number;
  spawnGX: number;
  spawnGY: number;
  spawnDirection: 0 | 1 | 2 | 3;
  exitWarp?: InteriorWarp;
  stairsWarps?: InteriorStairsWarp[];
  carpetRunner?: InteriorCarpetRunner;
  props: InteriorPropPlacement[];
  npcs: InteriorNPC[];
}

export interface SavedInteriorState {
  roomId: string;
  returnCoords: {
    gx: number;
    gy: number;
    direction: 0 | 1 | 2 | 3;
  };
  playerGX: number;
  playerGY: number;
  playerDir: 0 | 1 | 2 | 3;
}
