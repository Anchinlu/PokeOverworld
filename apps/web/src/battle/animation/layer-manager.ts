import type { AnimationCel } from './types';

export type CelRenderLayer = 'background' | 'behind_focus' | 'front';

export class LayerManager {
  /**
   * Sorts cels in an AnimationFrame into background, middle, and foreground layers.
   * Essentials priority codes:
   * 0 = back
   * 1 = front
   * 2 = behind focus
   * 3 = before focus / front
   */
  public static categorizeCels(cels: AnimationCel[]): {
    behindBattlers: AnimationCel[];
    aboveBattlers: AnimationCel[];
  } {
    const behindBattlers: AnimationCel[] = [];
    const aboveBattlers: AnimationCel[] = [];

    for (const cel of cels) {
      if (!cel.visible || cel.opacity <= 0) continue;

      if (cel.priority === 0 || cel.priority === 2) {
        behindBattlers.push(cel);
      } else {
        aboveBattlers.push(cel);
      }
    }

    return { behindBattlers, aboveBattlers };
  }
}
