import { CHUNK_SIZE } from '@pokemon/game-data';
import type { WildEntity } from '../model';
import type { WorldQuery } from '../ports/world-query';
import type { PlayerQuery } from '../ports/player-query';
import { decideNextAction, getDirectionTowards } from './brain/utility-brain';
import { startWildStep, updateGridMovement } from './movement/grid-mover';
import { chooseAvoidanceMove } from './movement/obstacle-avoidance';
import { AlarmNetwork } from './social/alarm';
import {
  getBehaviorProfileForSpecies,
  getBehaviorProfile,
} from './profiles/profile-registry';
import { getWeatherBehaviorModifiers } from './schedule/weather-response';

/** Keep the complete AI behavior active across the desktop's two-chunk view. */
export const WILDLIFE_FULL_SIMULATION_DISTANCE_TILES = CHUNK_SIZE * 2;
/** A small boundary beyond the full view prevents edge entities from thrashing. */
export const WILDLIFE_FREEZE_DISTANCE_TILES = WILDLIFE_FULL_SIMULATION_DISTANCE_TILES + 3;
const REACTIVE_STATE_HOLD_MS = 900;
/**
 * Wildlife uses the same 32px grid as the player, so a legacy 0.8px/frame
 * base made normal creatures visibly sluggish (and even slower after the
 * profile multiplier was applied). Existing entities are normalized to this
 * floor at runtime so already-loaded chunks also recover without respawning.
 */
const WILDLIFE_MIN_BASE_MOVE_SPEED = 1.35;
const WILDLIFE_MIN_MOVE_SPEED = 0.75;
const MIN_AI_INSPECTIONS_PER_FRAME = 6;

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
        // Keep already-started grid steps smooth even when the idle/decision
        // pass reaches its frame budget. Movement is cheap; perception and
        // utility scoring are the expensive part that should be time-sliced.
        const entityIsMoving = this.entities[i]?.isMoving === true;
        if (
          performance.now() - startTime > this.frameBudgetMs &&
          inspectedCount >= MIN_AI_INSPECTIONS_PER_FRAME
        ) {
          if (!entityIsMoving) {
            budgetExceeded = true;
            break;
          }
        }
      }
      inspectedCount++;

      const ent = this.entities[i];
      const entId = ent.id ?? `${ent.gx},${ent.gy}`;

      const distToPlayer = Math.hypot(ent.gx - pPos.gx, ent.gy - pPos.gy);
      const isActive = !ent.activeTime || ent.activeTime.includes(world.timeBand());
      if (!isActive) {
        ent.state = 'rest_sleep';
        ent.isMoving = false;
        ent.frame = 0;
        if (distToPlayer <= 1.5) {
          const dirToPlayer = getDirectionTowards(ent.gx, ent.gy, pPos.gx, pPos.gy);
          ent.dir = dirToPlayer;
          ent.currentDir = dirToPlayer;
          ent.bobY = -3;
          ent.emote = { type: '!', timer: 900, maxTime: 900 };
        } else {
          ent.bobY = -Math.abs(Math.sin(this.tickCount * 0.05 + i)) * 1.2;
          ent.emote = { type: 'dots', timer: 1200, maxTime: 1200 };
        }
        continue;
      }
      const justWoke = ent.state === 'rest_sleep';
      if (justWoke) {
        ent.state = 'idle';
        ent.emote = null;
        this.entityTimers.set(entId, 0);
      }

      const weather = getWeatherBehaviorModifiers(ent.speciesKey, world.weather());
      let profile = getBehaviorProfileForSpecies(ent.speciesKey);
      const isApricornPlain =
        typeof world.biomeAt === 'function' &&
        world.biomeAt(ent.gx, ent.gy) === 'apricorn_plain';
      if (isApricornPlain) {
        // Apricorn Plains are a calm sanctuary. Keep the species' presence and
        // herd movement, but remove the aggressive/territorial response to the
        // player that was previously forced on every Pokémon in this biome.
        profile = getBehaviorProfile('herd_grazer');
      } else if (ent.behavior === 'aggressive_bug') {
        const aggressiveBase = getBehaviorProfile('aggressive_bug');
        profile = {
          ...profile,
          ...aggressiveBase,
          temperament: 'aggressive',
        };
      }
      const baseMoveSpeed = Math.max(
        ent.baseMoveSpeed ?? ent.moveSpeed,
        WILDLIFE_MIN_BASE_MOVE_SPEED
      );
      ent.baseMoveSpeed = baseMoveSpeed;

      // Apply state-specific locomotion speed from archetype profile
      const baseArchetypeSpeed = profile.locomotion?.wanderSpeed ?? profile.moveSpeed ?? 1.0;
      let stateSpeedMult = baseArchetypeSpeed;
      if (ent.state === 'flee' || ent.state === 'fleeing') {
        stateSpeedMult = profile.locomotion?.fleeSpeed ?? Math.max(1.35, baseArchetypeSpeed * 1.45);
      } else if (ent.state === 'chase') {
        stateSpeedMult = profile.locomotion?.chaseSpeed ?? Math.max(1.45, baseArchetypeSpeed * 1.55);
      } else if (ent.state === 'curious' || ent.state === 'groom_play') {
        stateSpeedMult = baseArchetypeSpeed * 0.85;
      } else if (ent.state === 'return_home') {
        stateSpeedMult = Math.max(1.0, baseArchetypeSpeed * 1.1);
      }
      ent.moveSpeed = Math.max(
        WILDLIFE_MIN_MOVE_SPEED,
        baseMoveSpeed * stateSpeedMult * weather.moveSpeedMultiplier
      );

      // Update emote timer
      if (ent.emote) {
        ent.emote.timer -= dtMs;
        if (ent.emote.timer <= 0) {
          ent.emote = null;
        }
      }

      // LOD check (Section 7)
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
        ent.isPecking = false;
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

          // Natural Walk-and-Pause / Grazing / Social Herd Interaction cycle:
          // Calm states take 2-4 steps, then pause to graze, interact with a herd mate, or look around.
          if (
            ent.state === 'wander' ||
            ent.state === 'forage' ||
            ent.state === 'groom_play' ||
            ent.state === 'curious'
          ) {
            ent.stepsRemaining = Math.max(0, (ent.stepsRemaining ?? 1) - 1);
            if (ent.stepsRemaining <= 0) {
              const prevState = ent.state;
              const roll = Math.abs(Math.floor(ent.seed + this.tickCount * 31 + i)) % 100;

              // Check for a nearby herd mate to socialize with (face each other + heart/music emote)
              const nearbyMate = ent.herdId
                ? this.spatialHash
                    .queryNear(ent.gx, ent.gy, 2)
                    .find(
                      (other) =>
                        other !== ent &&
                        other.herdId === ent.herdId &&
                        !other.isMoving &&
                        Math.hypot(other.gx - ent.gx, other.gy - ent.gy) <= 2.2
                    )
                : undefined;

              ent.state = 'idle';
              this.entityTimers.set(entId, 0);

              if (nearbyMate && roll < 45) {
                const dirToMate = getDirectionTowards(ent.gx, ent.gy, nearbyMate.gx, nearbyMate.gy);
                const dirToMe = getDirectionTowards(nearbyMate.gx, nearbyMate.gy, ent.gx, ent.gy);
                ent.dir = dirToMate;
                ent.currentDir = dirToMate;
                ent.isPecking = true;
                ent.idleTimer = 700 + (roll % 4) * 100;
                const socialEmote = roll % 2 === 0 ? 'heart' : 'music';
                ent.emote = { type: socialEmote, timer: 1350, maxTime: 1350 };
                if (!nearbyMate.emote) {
                  nearbyMate.dir = dirToMe;
                  nearbyMate.currentDir = dirToMe;
                  nearbyMate.emote = {
                    type: socialEmote === 'heart' ? 'happy' : 'music',
                    timer: 1350,
                    maxTime: 1350,
                  };
                }
              } else if (prevState === 'forage' || world.contextAt(ent.gx, ent.gy) === 'tall_grass') {
                // Pause to graze / peck food on the ground or in tall grass
                ent.isPecking = true;
                ent.idleTimer = 600 + (roll % 4) * 100;
                if (roll < 65 && !ent.emote) {
                  ent.emote = {
                    type: roll < 45 ? 'eat' : 'happy',
                    timer: 1300,
                    maxTime: 1300,
                  };
                }
              } else {
                // Calm pause & look around
                ent.isPecking = false;
                ent.idleTimer = 500 + (roll % 4) * 100;
                if (roll < 25 && !ent.emote) {
                  ent.emote = {
                    type: weather.moveSpeedMultiplier > 1.05 ? 'happy' : 'music',
                    timer: 1250,
                    maxTime: 1250,
                  };
                }
              }
            }
          }
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
        // new goal. While resting/grazing, animate pecking hops or head turns.
        if (ent.state === 'idle' && elapsed < ent.idleTimer) {
          if (ent.isPecking) {
            ent.bobY = -Math.abs(Math.sin(elapsed * 0.012)) * 3.2;
          } else {
            ent.bobY = 0;
            // Turn head once midway through the idle pause to scan surroundings
            const halfIdle = ent.idleTimer * 0.5;
            if (elapsed >= halfIdle && elapsed - dtMs < halfIdle) {
              const turnDelta = (Math.abs(Math.floor(ent.seed + this.tickCount)) % 2) === 0 ? 1 : 2;
              ent.dir = (ent.dir + turnDelta) % 4;
              ent.currentDir = ent.dir;
            }
          }
          this.entityTimers.set(timerKey, elapsed);
          continue;
        }
        ent.isPecking = false;
        ent.bobY = 0;

        // Idle / Behavior Decision
        const leader = ent.herdId ? leadersByHerd.get(ent.herdId) : undefined;
        const decision = decideNextAction(ent, profile, world, player, elapsed, leader);

        if (decision.nextState !== ent.state) {
          const previousState = ent.state;
          ent.state = decision.nextState;
          this.entityTimers.set(timerKey, 0);

          if (decision.triggerEmote && !ent.emote) {
            const emoteType =
              decision.nextState === 'territorial' ||
              (decision.nextState === 'chase' && (ent.role === 'leader' || ent.role === 'apex'))
                ? 'anger'
                : decision.triggerEmote;
            ent.emote = { type: emoteType, timer: 1300, maxTime: 1300 };
          }

          // Assign step burst when entering a calm movement state
          if (
            decision.nextState === 'wander' ||
            decision.nextState === 'forage' ||
            decision.nextState === 'groom_play' ||
            decision.nextState === 'curious'
          ) {
            ent.stepsRemaining =
              2 + (Math.abs(Math.floor(ent.seed + this.tickCount + i)) % 3);
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

        // Reactive states briefly face the player before resuming their actual
        // locomotion. Previously alert/territorial always continued here, so
        // aggressive Pokémon could become permanently frozen after detecting
        // the player.
        let reactiveMovementDir: number | undefined;
        if (ent.state === 'alert' || ent.state === 'territorial') {
          if (decision.suggestedDir !== undefined) {
            ent.dir = decision.suggestedDir;
            ent.currentDir = decision.suggestedDir;
          }
          if (ent.state === 'territorial' || ent.role === 'leader' || ent.role === 'apex') {
            ent.bobY = -Math.abs(Math.sin(elapsed * 0.016)) * 3.5;
            if (!ent.emote && elapsed > 800) {
              ent.emote = { type: 'anger', timer: 1200, maxTime: 1200 };
            }
          }
          if (elapsed < REACTIVE_STATE_HOLD_MS) continue;

          const shouldChase =
            ent.state === 'territorial' &&
            (profile.temperament === 'aggressive' || profile.temperament === 'territorial');
          ent.state = shouldChase ? 'chase' : 'wander';
          this.entityTimers.set(timerKey, 0);
          ent.stepsRemaining = 2 + (Math.abs(Math.floor(ent.seed + this.tickCount + i)) % 3);
          reactiveMovementDir = shouldChase ? decision.suggestedDir : undefined;
        }

        // Curious creatures approach to 2 tiles, then stop and tilt/watch the player with '?'
        if (ent.state === 'curious' && distToPlayer <= 2.2) {
          if (decision.suggestedDir !== undefined) {
            ent.dir = decision.suggestedDir;
            ent.currentDir = decision.suggestedDir;
          }
          ent.bobY = -Math.abs(Math.sin(elapsed * 0.01)) * 2.5;
          if (!ent.emote) {
            ent.emote = { type: '?', timer: 1200, maxTime: 1200 };
          }
          continue;
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
          if ((ent.stepsRemaining ?? 0) <= 0) {
            ent.stepsRemaining =
              2 + (Math.abs(Math.floor(ent.seed + this.tickCount + i)) % 3);
          }
          let chosenDir = reactiveMovementDir ?? decision.suggestedDir;
          if (chosenDir === undefined) {
            // Random direction wander
            // Stable per-entity fallback direction; simulation never depends on
            // the browser's global random source.
            chosenDir = Math.abs(Math.floor(ent.seed + this.tickCount + i)) % 4;
          }

          const isDweller = ent.isWaterDweller ?? ent.isSwimming ?? false;
          const ownTileKey = `${ent.gx},${ent.gy}`;
          // The entity's current tile must not block its own reverse/turn
          // candidates. Other entities and their reserved destinations remain
          // protected in the shared reservation set.
          occupiedTiles.delete(ownTileKey);
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
          occupiedTiles.add(ownTileKey);
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
