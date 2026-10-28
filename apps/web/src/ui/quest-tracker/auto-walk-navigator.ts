/**
 * Auto-Walk Navigator
 * Automatically steps the player character toward event quest locations.
 * Uses BFS pathfinding on walkable tiles to avoid obstacles, water, and buildings.
 * Player can cancel anytime by pressing any movement key (WASD/Arrows).
 */

import type { Direction } from '@pokemon/shared-types';
import { questRegistry } from './quest-registry';
import { battleSePlayer } from '../../audio';
import type { QuestDefinition, QuestLocationTarget } from './types';

export class AutoWalkNavigator {
  private static instance: AutoWalkNavigator;
  private activeQuestId: string | null = null;
  private isNavigating = false;
  private targetLocation: QuestLocationTarget | null = null;
  private lastPathRecalcTime = 0;
  private cachedPath: Direction[] = [];
  private consecutiveFailures = 0;

  public static getInstance(): AutoWalkNavigator {
    if (!AutoWalkNavigator.instance) {
      AutoWalkNavigator.instance = new AutoWalkNavigator();
    }
    return AutoWalkNavigator.instance;
  }

  public isAutoWalking(): boolean {
    return this.isNavigating && this.activeQuestId !== null;
  }

  public getActiveQuestId(): string | null {
    return this.activeQuestId;
  }

  public getTargetLocation(): QuestLocationTarget | null {
    return this.targetLocation;
  }

  /**
   * Starts auto-walking to the specified event quest.
   */
  public startAutoWalk(quest: QuestDefinition, session: any): boolean {
    if (!quest.autoWalkable) {
      battleSePlayer.playSound('Audio/SE/GUI sel buzzer.ogg', 0.5);
      return false;
    }

    const target = questRegistry.resolveTarget(quest, session);
    if (!target) {
      battleSePlayer.playSound('Audio/SE/GUI sel buzzer.ogg', 0.5);
      return false;
    }

    this.activeQuestId = quest.id;
    this.targetLocation = target;
    this.isNavigating = true;
    this.cachedPath = [];
    this.lastPathRecalcTime = 0;
    this.consecutiveFailures = 0;

    battleSePlayer.playSound('Audio/SE/GUI sel decision.ogg', 0.65);
    return true;
  }

  /**
   * Cancels the active auto-walk.
   */
  public cancel(silent = false): void {
    if (!this.isNavigating) return;

    this.isNavigating = false;
    this.activeQuestId = null;
    this.targetLocation = null;
    this.cachedPath = [];

    if (!silent) {
      battleSePlayer.playSound('Audio/SE/GUI sel cancel.ogg', 0.5);
    }
  }

  /**
   * Toggles auto-walking for an event quest.
   */
  public toggleAutoWalk(quest: QuestDefinition, session: any): boolean {
    if (this.activeQuestId === quest.id && this.isNavigating) {
      this.cancel();
      return false;
    } else {
      return this.startAutoWalk(quest, session);
    }
  }

  /**
   * Evaluates the next step direction for the player during GameSession.update.
   * Returns null if arrived or cancelled.
   */
  public getNextStepDirection(session: any): Direction | null {
    if (!this.isNavigating || !this.targetLocation || !session) return null;

    const player = session.player;
    if (!player) return null;

    const isInterior = Boolean(session.interiorManager?.isInInterior?.());
    const currentMap = isInterior
      ? (session.interiorManager?.getCurrentRoom?.()?.id ?? 'interior')
      : 'overworld';

    let destGX = this.targetLocation.gx;
    let destGY = this.targetLocation.gy;

    // Handle cross-map navigation (e.g. outside -> oak lab entrance)
    if (this.targetLocation.map !== currentMap) {
      if (!isInterior && this.targetLocation.map === 'oak_lab') {
        const lab = session.palletPrologueEventManager?.findOakLab?.(session);
        if (lab) {
          destGX = lab.doorGX;
          destGY = lab.doorGY + 1; // Stand in front of lab door
        }
      } else if (isInterior && this.targetLocation.map === 'overworld') {
        // Interior exit door
        destGX = 7;
        destGY = 11;
      }
    }

    const dx = destGX - player.gx;
    const dy = destGY - player.gy;
    const manhattanDist = Math.abs(dx) + Math.abs(dy);

    // If within 1 tile, we have arrived adjacent to the target!
    // Face directly toward the target tile (face-to-face)
    if (manhattanDist <= 1) {
      if (Math.abs(dy) >= Math.abs(dx)) {
        if (dy > 0) player.direction = 0; // Down
        else if (dy < 0) player.direction = 3; // Up
      } else {
        if (dx < 0) player.direction = 1; // Left
        else if (dx > 0) player.direction = 2; // Right
      }

      this.cancel(true);
      battleSePlayer.playSound('Audio/SE/GUI sel decision.ogg', 0.7);
      return null;
    }

    // Path calculation using BFS
    const now = performance.now();
    if (this.cachedPath.length === 0 || now - this.lastPathRecalcTime > 800) {
      this.lastPathRecalcTime = now;
      this.cachedPath = this.findPath(
        player.gx,
        player.gy,
        destGX,
        destGY,
        (gx, gy, fromGX, fromGY) => {
          if (isInterior) {
            return session.interiorManager?.isWalkable?.(gx, gy) ?? true;
          }
          // Do not treat cutscene actors like Spearow as walkable to avoid pathing onto them
          const spearow = session.route1SpearowEventManager?.soloSpearowActor;
          if (spearow?.visible && gx === spearow.gx && gy === spearow.gy) {
            return false;
          }
          return session.chunkManager?.isWalkable?.(gx, gy, fromGX, fromGY) ?? true;
        },
        220,
        true
      );
    }

    if (this.cachedPath.length > 0) {
      const nextDir = this.cachedPath.shift()!;

      // Safeguard: if next step would land directly on the destination tile, halt and face target
      let nextGX = player.gx;
      let nextGY = player.gy;
      if (nextDir === 0) nextGY += 1;
      else if (nextDir === 1) nextGX -= 1;
      else if (nextDir === 2) nextGX += 1;
      else if (nextDir === 3) nextGY -= 1;

      if (nextGX === destGX && nextGY === destGY) {
        if (Math.abs(dy) >= Math.abs(dx)) {
          if (dy > 0) player.direction = 0;
          else if (dy < 0) player.direction = 3;
        } else {
          if (dx < 0) player.direction = 1;
          else if (dx > 0) player.direction = 2;
        }
        this.cancel(true);
        battleSePlayer.playSound('Audio/SE/GUI sel decision.ogg', 0.7);
        return null;
      }

      this.consecutiveFailures = 0;
      return nextDir;
    } else {
      this.consecutiveFailures++;
      if (this.consecutiveFailures > 5) {
        battleSePlayer.playSound('Audio/SE/GUI sel buzzer.ogg', 0.5);
        this.cancel(true);
      }
      return null;
    }
  }

  /**
   * Breadth-First Search (BFS) pathfinder on grid coordinates.
   * If stopAdjacent is true, stops adjacent to goalGX, goalGY instead of stepping on it.
   */
  public findPath(
    startGX: number,
    startGY: number,
    goalGX: number,
    goalGY: number,
    isWalkable: (gx: number, gy: number, fromGX: number, fromGY: number) => boolean,
    maxSteps = 220,
    stopAdjacent = true
  ): Direction[] {
    if (startGX === goalGX && startGY === goalGY) return [];
    if (stopAdjacent && Math.abs(startGX - goalGX) + Math.abs(startGY - goalGY) <= 1) {
      return [];
    }

    const queue: Array<{ gx: number; gy: number; path: Direction[] }> = [
      { gx: startGX, gy: startGY, path: [] },
    ];
    const visited = new Set<string>();
    visited.add(`${startGX},${startGY}`);

    // Direction vectors: 0: Down (+Y), 1: Left (-X), 2: Right (+X), 3: Up (-Y)
    const DIRS: Array<{ dir: Direction; dx: number; dy: number }> = [
      { dir: 0, dx: 0, dy: 1 },
      { dir: 1, dx: -1, dy: 0 },
      { dir: 2, dx: 1, dy: 0 },
      { dir: 3, dx: 0, dy: -1 },
    ];

    let bestPath: Direction[] = [];
    let bestDist = Math.hypot(goalGX - startGX, goalGY - startGY);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.path.length >= maxSteps) continue;

      // Greedy sort: explore neighbor closest to goal first
      const sorted = [...DIRS].sort((a, b) => {
        const distA = Math.hypot(goalGX - (current.gx + a.dx), goalGY - (current.gy + a.dy));
        const distB = Math.hypot(goalGX - (current.gx + b.dx), goalGY - (current.gy + b.dy));
        return distA - distB;
      });

      for (const { dir, dx, dy } of sorted) {
        const nGX = current.gx + dx;
        const nGY = current.gy + dy;
        const key = `${nGX},${nGY}`;

        // If stopAdjacent is true, never step on the goal tile itself
        if (stopAdjacent && nGX === goalGX && nGY === goalGY) {
          continue;
        }

        // If stopAdjacent is true and this neighbor is adjacent to goal, we reached goal!
        if (stopAdjacent && Math.abs(nGX - goalGX) + Math.abs(nGY - goalGY) <= 1) {
          if (isWalkable(nGX, nGY, current.gx, current.gy)) {
            return [...current.path, dir];
          }
        }

        // Standard exact goal arrival
        if (!stopAdjacent && nGX === goalGX && nGY === goalGY) {
          return [...current.path, dir];
        }

        if (visited.has(key)) continue;

        if (isWalkable(nGX, nGY, current.gx, current.gy)) {
          visited.add(key);
          const newPath = [...current.path, dir];
          const distToGoal = Math.hypot(goalGX - nGX, goalGY - nGY);
          if (distToGoal < bestDist) {
            bestDist = distToGoal;
            bestPath = newPath;
          }
          queue.push({ gx: nGX, gy: nGY, path: newPath });
        }
      }
    }

    return bestPath;
  }
}

export const autoWalkNavigator = AutoWalkNavigator.getInstance();
