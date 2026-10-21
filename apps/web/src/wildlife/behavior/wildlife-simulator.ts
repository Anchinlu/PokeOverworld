import { CHUNK_SIZE } from '@pokemon/game-data';
import type { WildEntity } from '../model';
import type { WorldQuery } from '../ports/world-query';
import type { PlayerQuery } from '../ports/player-query';
import { decideNextAction } from './brain/utility-brain';
import { startWildStep, updateGridMovement } from './movement/grid-mover';
import { chooseAvoidanceMove } from './movement/obstacle-avoidance';
import { AlarmNetwork } from './social/alarm';
import { getBehaviorProfileForSpecies } from './profiles/profile-registry';
import { getWeatherBehaviorModifiers } from './schedule/weather-response';

/** Keep the complete AI behavior active across the desktop's two-chunk view. */
export const WILDLIFE_FULL_SIMULATION_DISTANCE_TILES = CHUNK_SIZE * 2;
/** A small boundary beyond the full view prevents edge entities from thrashing. */
export const WILDLIFE_FREEZE_DISTANCE_TILES = WILDLIFE_FULL_SIMULATION_DISTANCE_TILES + 3;

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
  private entityCursor = 0;
  private frameBudgetMs: number;

  constructor(opts?: SimulatorOptions) {
    this.frameBudgetMs = opts?.frameBudgetMs ?? 1.5;
  }

  public setEntities(entities: WildEntity[]): void {
    if (entities === this.entities) return;
    this.entities = entities;
    const activeIds = new Set(
      entities.map((entity, index) => entity.id ?? `${entity.gx},${entity.gy},${index}`)
    );
    for (const timerId of this.entityTimers.keys()) {
      if (!activeIds.has(timerId)) this.entityTimers.delete(timerId);
    }
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
    let inspectedCount = 0;
    const startEntityIndex =
      this.entities.length > 0 ? this.entityCursor % this.entities.length : 0;

    for (let offset = 0; offset < this.entities.length; offset++) {
      const i = (startEntityIndex + offset) % this.entities.length;
      // Check performance budget
      if (startTime > 0 && typeof performance !== 'undefined') {
        if (performance.now() - startTime > this.frameBudgetMs) {
          budgetExceeded = true;
          break;
        }
      }
      inspectedCount++;

      const ent = this.entities[i];
      const entId = ent.id ?? `${ent.gx},${ent.gy}`;

      const isActive = !ent.activeTime || ent.activeTime.includes(world.timeBand());
      if (!isActive) {
        ent.state = 'rest_sleep';
        ent.isMoving = false;
        ent.frame = 0;
        ent.bobY = 0;
        ent.emote = { type: 'dots', timer: 1200, maxTime: 1200 };
        continue;
      }
      const justWoke = ent.state === 'rest_sleep';
      if (justWoke) {
        ent.state = 'idle';
        ent.emote = null;
        this.entityTimers.set(entId, 0);
      }

      const weather = getWeatherBehaviorModifiers(ent.speciesKey, world.weather());
      const baseMoveSpeed = ent.baseMoveSpeed ?? ent.moveSpeed;
      ent.baseMoveSpeed = baseMoveSpeed;
      ent.moveSpeed = Math.max(0.1, baseMoveSpeed * weather.moveSpeedMultiplier);

      // Update emote timer
      if (ent.emote) {
        ent.emote.timer -= dtMs;
        if (ent.emote.timer <= 0) {
          ent.emote = null;
        }
      }

      // LOD check (Section 7)
      const distToPlayer = Math.hypot(ent.gx - pPos.gx, ent.gy - pPos.gy);
      if (distToPlayer > WILDLIFE_FREEZE_DISTANCE_TILES) {
        // LOD Tier 3: Frozen outside active zone
        continue;
      }
      // Full simulation is intentionally preserved for the complete desktop
      // neighborhood. Only the three-tile boundary above is frozen, so
      // wildlife visible at the edge does not appear to move intermittently.
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

        // Give a creature one calm frame after waking before perception can
        // immediately turn the wake-up into a flee/chase transition.
        if (justWoke) {
          continue;
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

        const timerKey = entId;
        const elapsed = (this.entityTimers.get(timerKey) ?? 0) + dtMs;

        // Preserve the entity's deterministic idle pause before selecting a
        // new goal. The creature can still animate while it is resting.
        if (ent.state === 'idle' && elapsed < ent.idleTimer) {
          this.entityTimers.set(timerKey, elapsed);
          continue;
        }

        // Idle / Behavior Decision
        const profile = getBehaviorProfileForSpecies(ent.speciesKey);

        const leader = ent.herdId ? leadersByHerd.get(ent.herdId) : undefined;
        const decision = decideNextAction(ent, profile, world, player, elapsed, leader);

        if (decision.nextState !== ent.state) {
          const previousState = ent.state;
          ent.state = decision.nextState;
          this.entityTimers.set(timerKey, 0);

          if (decision.triggerEmote && !ent.emote) {
            ent.emote = { type: decision.triggerEmote, timer: 1200, maxTime: 1200 };
          }

          // A newly detected threat alerts the same herd once. Keeping this
          // on state entry avoids queuing duplicate alarms every frame.
          if (
            ent.herdId &&
            previousState !== 'flee' &&
            (decision.nextState === 'flee' || decision.nextState === 'alert')
          ) {
            const herdMembers = this.entities
              .filter((member) => member.herdId === ent.herdId)
              .map((member) => ({
                id: member.id ?? `${member.gx},${member.gy}`,
                gx: member.gx,
                gy: member.gy,
              }));
            this.alarmNetwork.broadcastAlarm(entId, { gx: ent.gx, gy: ent.gy }, herdMembers);
          }
        } else {
          this.entityTimers.set(timerKey, elapsed);
        }

        // Attempt movement step based on state
        if (
          ent.state === 'wander' ||
          ent.state === 'forage' ||
          ent.state === 'groom_play' ||
          ent.state === 'flee' ||
          ent.state === 'chase' ||
          ent.state === 'return_home' ||
          ent.state === 'curious'
        ) {
          let chosenDir = decision.suggestedDir;
          if (chosenDir === undefined) {
            // Random direction wander
            // Stable per-entity fallback direction; simulation never depends on
            // the browser's global random source.
            chosenDir = Math.abs(Math.floor(ent.seed + this.tickCount + i)) % 4;
          }

          const isDweller = ent.isWaterDweller ?? ent.isSwimming ?? false;
          const moveChoice = chooseAvoidanceMove(
            ent,
            chosenDir,
            world,
            {
              occupiedTiles,
              // The spatial hash limits hitbox checks to the local area and
              // keeps dense maps within the simulator's frame budget.
              nearbyEntities: this.spatialHash.queryNear(ent.gx, ent.gy, 3),
            },
            isDweller,
            Math.floor(Math.abs(ent.seed * 1000) + this.tickCount + i) % 2 === 0,
            ent.canJumpHills ?? false
          );
          if (moveChoice) {
            occupiedTiles.add(`${moveChoice.targetGX},${moveChoice.targetGY}`);
            startWildStep(ent, moveChoice.dir, moveChoice.jumpType);
          }
        }
      }
    }

    // If the budget cut the pass short, continue from the next entity on the
    // following frame instead of repeatedly simulating only the first group.
    if (budgetExceeded && this.entities.length > 0) {
      this.entityCursor = (startEntityIndex + inspectedCount) % this.entities.length;
    }

    return { simulatedCount, budgetExceeded };
  }
}
