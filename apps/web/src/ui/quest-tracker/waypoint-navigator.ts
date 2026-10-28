/**
 * Waypoint Navigator (Compatibility & Location Telemetry Layer)
 * Visual ground beacons and arrow pointers removed per user preference.
 */

import { questRegistry } from './quest-registry';
import { autoWalkNavigator } from './auto-walk-navigator';
import type { QuestDefinition } from './types';

export class WaypointNavigator {
  private static instance: WaypointNavigator;
  private customTrackedQuestId: string | null = null;
  private isNavigationEnabled = true;

  public static getInstance(): WaypointNavigator {
    if (!WaypointNavigator.instance) {
      WaypointNavigator.instance = new WaypointNavigator();
    }
    return WaypointNavigator.instance;
  }

  public setTrackedQuestId(questId: string | null): void {
    this.customTrackedQuestId = questId;
  }

  public getTrackedQuestId(): string | null {
    return this.customTrackedQuestId;
  }

  public toggleTrackedQuest(questId: string): boolean {
    if (this.customTrackedQuestId === questId) {
      this.customTrackedQuestId = null;
      return false;
    } else {
      this.customTrackedQuestId = questId;
      return true;
    }
  }

  public setNavigationEnabled(enabled: boolean): void {
    this.isNavigationEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.isNavigationEnabled;
  }

  public getActiveQuest(session?: any): QuestDefinition | undefined {
    if (this.customTrackedQuestId) {
      const q = questRegistry.getQuestById(this.customTrackedQuestId);
      if (q && q.isActive() && !q.isCompleted()) {
        return q;
      }
    }
    return questRegistry.getActiveEventQuests(session)[0];
  }

  /**
   * Visual beacon is disabled completely per user design preference.
   */
  public renderBeacon(
    _ctx: CanvasRenderingContext2D,
    _camera: any,
    _canvasWidth: number,
    _canvasHeight: number,
    _session: any,
    _now: number
  ): void {
    // Disabled: No yellow rings, no 3D arrows, no edge chevrons
  }
}

export const waypointNavigator = WaypointNavigator.getInstance();
export { autoWalkNavigator };
