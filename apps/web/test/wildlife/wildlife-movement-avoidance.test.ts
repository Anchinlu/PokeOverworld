import { describe, expect, it } from 'vitest';
import type { WildEntity } from '../../src/wildlife/model';
import type { WorldQuery } from '../../src/wildlife/ports/world-query';
import type { PlayerQuery } from '../../src/wildlife/ports/player-query';
import { chooseAvoidanceMove } from '../../src/wildlife/behavior/movement/obstacle-avoidance';
import { startWildStep, updateGridMovement } from '../../src/wildlife/behavior/movement/grid-mover';
import { WildlifeSimulator } from '../../src/wildlife/behavior/wildlife-simulator';
import {
  getWildAabb,
  getWildOccupiedAabbs,
  getWildSpriteAabb,
  hitboxesOverlap,
} from '../../src/wildlife/behavior/movement/wild-hitbox';

function createEntity(overrides?: Partial<WildEntity>): WildEntity {
  return {
    id: 'wild-test',
    gx: 10,
    gy: 10,
    x: 320,
    y: 320,
    speciesKey: 'PIDGEY',
    name: 'PIDGEY',
    level: 5,
    behavior: 'curious_rodent',
    dir: 0,
    homeGX: 10,
    homeGY: 10,
    wanderRadius: 4,
    state: 'wander',
    isMoving: false,
    fromX: 320,
    fromY: 320,
    targetGX: 10,
    targetGY: 10,
    targetX: 320,
    targetY: 320,
    stepProgress: 0,
    moveSpeed: 1,
    stepsRemaining: 0,
    currentDir: 0,
    lastMoveTime: 0,
    idleTimer: 0,
    frame: 0,
    seed: 17,
    chunkCx: 0,
    chunkCy: 0,
    ...overrides,
  };
}

const openWorld: WorldQuery = {
  isWalkable: () => true,
  contextAt: () => 'tall_grass',
  biomeAt: () => 'meadow',
  difficultyAt: () => 0,
  timeBand: () => 'day',
  weather: () => 'clear',
};

describe('Wildlife hitboxes and local obstacle avoidance', () => {
  it('uses a compact logical hitbox and does not overlap adjacent tiles', () => {
    const first = createEntity({ gx: 10, gy: 10 });
    const adjacent = createEntity({ id: 'adjacent', gx: 11, gy: 10 });
    const sameTile = createEntity({ id: 'same-tile', gx: 10, gy: 10 });

    expect(hitboxesOverlap(getWildAabb(first, 10, 10), getWildAabb(adjacent, 11, 10))).toBe(false);
    expect(hitboxesOverlap(getWildAabb(first, 10, 10), getWildAabb(sameTile, 10, 10))).toBe(true);
  });

  it('anchors the hitbox to the visible 64px sprite centre', () => {
    const aabb = getWildAabb(createEntity(), 10, 10);

    expect((aabb.left + aabb.right) / 2).toBe(10.5);
    expect((aabb.top + aabb.bottom) / 2).toBe(10.5);
  });

  it('tracks the rendered sprite while the Pokémon is moving', () => {
    const aabb = getWildSpriteAabb(createEntity({ x: 336, y: 320 }));

    expect(aabb.left).toBe(10.5);
    expect(aabb.top).toBe(10);
    expect(aabb.right).toBe(12.5);
    expect(aabb.bottom).toBe(12);
  });

  it('takes a side step when the preferred direction is blocked by terrain', () => {
    const entity = createEntity();
    const world: WorldQuery = {
      ...openWorld,
      isWalkable: (gx, gy) => !(gx === 10 && gy === 11),
    };

    const choice = chooseAvoidanceMove(
      entity,
      0,
      world,
      { occupiedTiles: new Set(['10,10']), nearbyEntities: [entity] },
      false,
      true
    );

    expect(choice).toMatchObject({ dir: 1, targetGX: 9, targetGY: 10 });
  });

  it('does not climb from flat ground onto a hill without a jump move', () => {
    const entity = createEntity();
    const world: WorldQuery = {
      ...openWorld,
      isWalkable: (gx, gy, fromGX, fromGY) =>
        !(gx === 10 && gy === 11 && fromGX === 10 && fromGY === 10),
    };

    const choice = chooseAvoidanceMove(
      entity,
      0,
      world,
      { occupiedTiles: new Set(['10,10']), nearbyEntities: [entity] },
      false,
      true
    );

    expect(choice?.targetGX === 10 && choice.targetGY === 11).toBe(false);
  });

  it('marks a hill-capable Pokémon jump and animates its arc', () => {
    const entity = createEntity({ canJumpHills: true });
    const world: WorldQuery = {
      ...openWorld,
      isWalkable: (gx, gy, _fromGX, _fromGY, canJumpHills) =>
        !(gx === 10 && gy === 11) || canJumpHills === true,
      isElevated: (gx, gy) => gx === 10 && gy === 11,
    };

    const choice = chooseAvoidanceMove(
      entity,
      0,
      world,
      { occupiedTiles: new Set(['10,10']), nearbyEntities: [entity] },
      false,
      true,
      entity.canJumpHills
    );

    expect(choice).toMatchObject({ targetGX: 10, targetGY: 11, jumpType: 'jump_up' });

    startWildStep(entity, choice!.dir, choice!.jumpType);
    expect(entity.fromX).toBe(10 * 32 - 16);
    expect(entity.fromY).toBe(10 * 32 - 32);
    expect(entity.targetX).toBe(10 * 32 - 16);
    expect(entity.targetY).toBe(11 * 32 - 32);
    updateGridMovement(entity, 8);

    expect(entity.isJumping).toBe(true);
    expect(entity.jumpY).toBeLessThan(0);
    expect(entity.frame).toBe(1);
  });

  it('rejects a candidate that overlaps another Pokémon even if the tile set is incomplete', () => {
    const entity = createEntity();
    const other = createEntity({ id: 'other', gx: 9, gy: 10 });

    const choice = chooseAvoidanceMove(
      entity,
      1,
      openWorld,
      { occupiedTiles: new Set(['10,10']), nearbyEntities: [entity, other] },
      false,
      true
    );

    // Left is occupied by the other Pokémon, so the resolver takes the next
    // safe local option instead of starting an overlapping step.
    expect(choice?.targetGX === 9 && choice.targetGY === 10).toBe(false);
  });

  it('reserves the destination footprint of a Pokémon already moving', () => {
    const moving = createEntity({ isMoving: true, targetGX: 11, targetGY: 10 });
    const movingAabbs = getWildOccupiedAabbs(moving);

    expect(movingAabbs).toHaveLength(2);
    expect(hitboxesOverlap(getWildAabb(createEntity(), 11, 10), movingAabbs[1])).toBe(true);
  });

  it('keeps Pokémon active through 35 tiles and freezes them only beyond that radius', () => {
    const player: PlayerQuery = {
      position: () => ({ gx: 0, gy: 0 }),
      isRunning: () => false,
      inTallGrass: () => false,
      referenceLevel: () => 10,
    };
    const activeAtBoundary = createEntity({
      id: 'active-at-35',
      gx: 35,
      gy: 0,
      isMoving: true,
      targetGX: 36,
      targetGY: 0,
      fromX: 35 * 32,
      fromY: 0,
      targetX: 36 * 32,
      targetY: 0,
      stepProgress: 0,
    });
    const frozenBeyondBoundary = createEntity({
      id: 'frozen-at-36',
      gx: 36,
      gy: 0,
      isMoving: true,
      targetGX: 37,
      targetGY: 0,
      fromX: 36 * 32,
      fromY: 0,
      targetX: 37 * 32,
      targetY: 0,
      stepProgress: 0,
    });
    const sim = new WildlifeSimulator();
    sim.setEntities([activeAtBoundary, frozenBeyondBoundary]);

    sim.update(16.6, openWorld, player);

    expect(activeAtBoundary.stepProgress).toBeGreaterThan(0);
    expect(frozenBeyondBoundary.stepProgress).toBe(0);
  });
});
