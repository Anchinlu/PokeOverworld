/**
 * Story World Port Interface
 *
 * Provides safe world preparation, anchor lookups, and wildlife suppression
 * as required by STORY_ARCHITECTURE_CONTRACT.md.
 */

export interface PrepareAreaOptions {
  anchors?: string[];
  centerGX?: number;
  centerGY?: number;
  loadRadius?: number;
  suppressWildlife?: boolean;
  freezeTime?: boolean;
}

export interface StoryWorldPort {
  prepareArea(options: PrepareAreaOptions): Promise<void>;
  suppressWildlife(suppress: boolean): void;
  resolveAnchor(anchorId: string): { gx: number; gy: number } | null;
}
