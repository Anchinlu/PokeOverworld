/**
 * Story Anchor Registry
 *
 * Implements functional topological anchors as required by STORY_ARCHITECTURE_CONTRACT.md:
 * - Decouples event triggers from hardcoded grid coordinates.
 * - Resolves anchors dynamically across different world seeds and terrain layouts.
 * - Standard anchors:
 *   - starter_village.player_house.door
 *   - starter_village.lab.front_door
 *   - starter_village.main_square
 *   - starter_village.exit_gate
 *   - route1.wild_marker
 *   - settlement.<name>.entrance / settlement.<name>.center
 */

import { getStartVillagePlacement } from '../../maps/terrain-field/start-village';
import type { VillagePlacement } from '../../maps/village-rules';

export interface StoryAnchorCoord {
  gx: number;
  gy: number;
}

export type AnchorResolver = () => StoryAnchorCoord | null;

export class StoryAnchorRegistry {
  private static instance: StoryAnchorRegistry | null = null;
  private customAnchors = new Map<string, StoryAnchorCoord | AnchorResolver>();
  private defaultSeed = 101;

  public static getInstance(): StoryAnchorRegistry {
    if (!StoryAnchorRegistry.instance) {
      StoryAnchorRegistry.instance = new StoryAnchorRegistry();
    }
    return StoryAnchorRegistry.instance;
  }

  /**
   * Sets world seed used for standard village anchor resolution.
   */
  public setSeed(seed: number): void {
    this.defaultSeed = seed;
  }

  /**
   * Registers a custom anchor or a dynamic resolver function.
   */
  public register(id: string, anchorOrResolver: StoryAnchorCoord | AnchorResolver): void {
    this.customAnchors.set(id, anchorOrResolver);
  }

  /**
   * Unregisters a custom anchor.
   */
  public unregister(id: string): void {
    this.customAnchors.delete(id);
  }

  /**
   * Resolves an anchor ID to global grid coordinates (gx, gy).
   */
  public resolve(id: string, seed = this.defaultSeed): StoryAnchorCoord | null {
    // 1. Check custom registry first
    const custom = this.customAnchors.get(id);
    if (custom) {
      if (typeof custom === 'function') {
        return custom();
      }
      return custom;
    }

    // 2. Resolve starter village standard anchors
    if (id.startsWith('starter_village.') || id === 'route1.wild_marker' || id === 'oak_lab.front_door') {
      const village = getStartVillagePlacement(seed);
      return this.resolveStartVillageAnchor(id, village);
    }

    return null;
  }

  private resolveStartVillageAnchor(id: string, village: VillagePlacement): StoryAnchorCoord | null {
    switch (id) {
      case 'starter_village.exit_gate':
        return {
          gx: village.centerGX,
          gy: village.bounds.minGY,
        };

      case 'route1.wild_marker':
        return {
          gx: village.centerGX,
          gy: village.bounds.minGY - 6,
        };

      case 'starter_village.main_square':
        return {
          gx: village.centerGX,
          gy: village.centerGY,
        };

      case 'starter_village.lab.front_door':
      case 'oak_lab.front_door': {
        const lab = village.buildings.find((b) => b.type === 'lab_okido');
        if (lab) {
          return { gx: lab.doorGX, gy: lab.doorGY };
        }
        return { gx: village.centerGX, gy: village.centerGY };
      }

      case 'starter_village.player_house.door': {
        const house = village.buildings.find((b) => b.type === 'house_player' || b.type === 'house_red');
        if (house) {
          return { gx: house.doorGX, gy: house.doorGY };
        }
        return { gx: village.centerGX, gy: village.centerGY };
      }

      default:
        return null;
    }
  }

  public clear(): void {
    this.customAnchors.clear();
  }
}

export const storyAnchorRegistry = StoryAnchorRegistry.getInstance();
