import type { WildEntity } from '../model';
import type { WorldQuery } from '../ports/world-query';
import type { PlayerQuery } from '../ports/player-query';
import { getBehaviorProfile } from './profiles/profile-registry';
import { decideNextAction } from './brain/utility-brain';
import {
  canWildEntityEnter,
  startWildStep,
  updateGridMovement,
  DX_MAP,
  DY_MAP,
} from './movement/grid-mover';
import { AlarmNetwork } from './social/alarm';

export class SpatialHash {
  private cellSize: number;
  private map = new Map<string, WildEntity[]>();

  constructor(cellSize = 4) {
    this.cellSize = cellSize;
  }

  public clear(): void {
    this.map.clear();
  }

  public insert(entity: WildEntity): void {
    const key = `${Math.floor(entity.gx / this.cellSize)},${Math.floor(entity.gy / this.cellSize)}`;
    let bucket = this.map.get(key);
    if (!bucket) {
      bucket = [];
      this.map.set(key, bucket);
    }
    bucket.push(entity);
  }

  public queryNear(gx: number, gy: number, radiusTiles: number): WildEntity[] {
    const minX = Math.floor((gx - radiusTiles) / this.cellSize);
    const maxX = Math.floor((gx + radiusTiles) / this.cellSize);
    const minY = Math.floor((gy - radiusTiles) / this.cellSize);
    const maxY = Math.floor((gy + radiusTiles) / this.cellSize);

    const result: WildEntity[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const bucket = this.map.get(`${x},${y}`);
        if (bucket) {
          result.push(...bucket);
        }
      }
    }
    return result;
  }
}

export interface SimulatorOptions {
  frameBudgetMs?: number;
}

export class WildlifeSimulator {
  private entities: WildEntity[] = [];
  private spatialHash = new SpatialHash(4);
  private alarmNetwork = new AlarmNetwork();
  private entityTimers = new Map<string, number>();
  private tickCount = 0;
  private frameBudgetMs: number;

  constructor(opts?: SimulatorOptions) {
    this.frameBudgetMs = opts?.frameBudgetMs ?? 1.5;
  }

  public setEntities(entities: WildEntity[]): void {
    this.entities = entities;
    this.rebuildSpatialHash();
  }

  public getEntities(): readonly WildEntity[] {
    return this.entities;
  }

  public getSpatialHash(): SpatialHash {
    return this.spatialHash;
  }

  public getAlarmNetwork(): AlarmNetwork {
    return this.alarmNetwork;
  }

  public rebuildSpatialHash(): void {
    this.spatialHash.clear();
    for (const ent of this.entities) {
      this.spatialHash.insert(ent);
    }
  }

  /**
   * Main simulation step with LOD tiers (Section 7) and performance budget.
   */
  public update(
    dtMs: number,
    world: WorldQuery,
    player: PlayerQuery
  ): { simulatedCount: number; budgetExceeded: boolean } {
    const startTime = typeof performance !== 'undefined' ? performance.now() : 0;
    this.tickCount++;
    const dtScale = Math.min(dtMs / 16.666, 3.0);

    const pPos = player.position();
    const occupiedTiles = new Set<string>();
    occupiedTiles.add(`${pPos.gx},${pPos.gy}`);
    for (const ent of this.entities) {
      occupiedTiles.add(`${ent.gx},${ent.gy}`);
      if (ent.isMoving) {
        occupiedTiles.add(`${ent.targetGX},${ent.targetGY}`);
      }
    }

    // Process network alarms
    const alarmedIds = new Set(this.alarmNetwork.tick());

    // Build herd leaders lookup
    const leadersByHerd = new Map<string, WildEntity>();
    for (const ent of this.entities) {
      if ((ent.role === 'leader' || ent.role === 'apex') && ent.herdId) {
        leadersByHerd.set(ent.herdId, ent);
      }
    }

    let simulatedCount = 0;
    let budgetExceeded = false;

    for (let i = 0; i < this.entities.length; i++) {
      // Check performance budget
      if (startTime > 0 && typeof performance !== 'undefined') {
        if (performance.now() - startTime > this.frameBudgetMs) {
          budgetExceeded = true;
          break;
        }
      }

      const ent = this.entities[i];
      const entId = ent.id ?? `${ent.gx},${ent.gy}`;

      // Update emote timer
      if (ent.emote) {
        ent.emote.timer -= dtMs;
        if (ent.emote.timer <= 0) {
          ent.emote = null;
        }
      }

      // LOD check (Section 7)
      const distToPlayer = Math.hypot(ent.gx - pPos.gx, ent.gy - pPos.gy);
      if (distToPlayer > 24) {
        // LOD Tier 3: Frozen outside active zone
        continue;
      }
      if (distToPlayer > 12 && (this.tickCount + i) % 6 !== 0) {
        // LOD Tier 2: Sparse updates (every 6 frames)
        if (ent.isMoving) {
          updateGridMovement(ent, dtScale);
        }
        continue;
      }

      // LOD Tier 1: Full simulation
      simulatedCount++;

      // React to received herd alarm
      if (alarmedIds.has(entId)) {
        ent.state = 'alert';
        ent.emote = { type: '!', timer: 1200, maxTime: 1200 };
      }

      // Handle ongoing grid movement
      if (ent.isMoving) {
        const moveRes = updateGridMovement(ent, dtScale);
        if (moveRes.reachedTarget) {
          this.rebuildSpatialHash();
          if (ent.isWaterDweller) {
            // Shore / boundary tile counts as ground (isSwimming = false)
            ent.isSwimming = world.contextAt(ent.gx, ent.gy) === 'water_surface';
          }
          ent.idleAnimTimer = (ent.frame ?? 0) * 180;
        }
      } else {
        if (ent.isWaterDweller) {
          ent.isSwimming = world.contextAt(ent.gx, ent.gy) === 'water_surface';
        }

        // Continuous Idle Animation for stationary Pokémon
        if (ent.state !== 'rest_sleep') {
          if (ent.idleAnimTimer === undefined) {
            ent.idleAnimTimer = (Math.abs(ent.seed ?? 0) % 4) * 180;
          }
          ent.idleAnimTimer += dtMs;
          ent.frame = Math.floor(ent.idleAnimTimer / 180) % 4;
        } else {
          ent.frame = 0;
        }

        // Idle / Behavior Decision
        const profile = getBehaviorProfile(ent.behavior);
        const timerKey = entId;
        const elapsed = (this.entityTimers.get(timerKey) ?? 0) + dtMs;

        const leader = ent.herdId ? leadersByHerd.get(ent.herdId) : undefined;
        const decision = decideNextAction(ent, profile, world, player, elapsed, leader);

        if (decision.nextState !== ent.state) {
          ent.state = decision.nextState;
          this.entityTimers.set(timerKey, 0);

          if (decision.triggerEmote && !ent.emote) {
            ent.emote = { type: decision.triggerEmote, timer: 1200, maxTime: 1200 };
          }
        } else {
          this.entityTimers.set(timerKey, elapsed);
        }

        // Attempt movement step based on state
        if (ent.state === 'wander' || ent.state === 'flee' || ent.state === 'chase' || ent.state === 'return_home' || ent.state === 'curious') {
          let chosenDir = decision.suggestedDir;
          if (chosenDir === undefined) {
            // Random direction wander
            chosenDir = Math.floor(Math.random() * 4);
          }

          const targetGX = ent.gx + DX_MAP[chosenDir];
          const targetGY = ent.gy + DY_MAP[chosenDir];

          // Collision and boundary check
          const isDweller = ent.isWaterDweller ?? ent.isSwimming;
          if (canWildEntityEnter(targetGX, targetGY, world, occupiedTiles, isDweller)) {
            occupiedTiles.add(`${targetGX},${targetGY}`);
            startWildStep(ent, chosenDir);
          }
        }
      }
    }

    return { simulatedCount, budgetExceeded };
  }
}
