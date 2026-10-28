import { describe, it, expect, beforeEach, vi } from 'vitest';
import { playerService } from '../src/domain/player/player-service';
import { route1SpearowEventManager } from '../src/story/acts/act-2-route1/route1-spearow-event';
import { spearowFlockDirector } from '../src/story/acts/act-2-route1/spearow-flock-director';

describe('Act 2: Route 1 Spearow & Flock Encounter (Scene 9)', () => {
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();
    playerService.setFlag('act1_completed', false);
    playerService.setFlag('route1_spearow_spotted', false);
    playerService.setFlag('route1_spearow_battle_done', false);
    playerService.setFlag('route1_spearow_flock_chase_done', false);
    playerService.setFlag('route1_flock_escaped', false);
    playerService.setFlag('route1_spearow_defeated', false);
    playerService.setFlag('route1_act2_completed', false);
    playerService.setFlag('arrived_next_village', false);
    route1SpearowEventManager.reset();
    spearowFlockDirector.reset();

    mockSession = {
      seed: 101,
      player: {
        gx: 120,
        gy: 85,
        x: 120 * 16,
        y: 85 * 16,
        direction: 0,
        snapTo: vi.fn((gx: number, gy: number, dir?: number) => {
          mockSession.player.gx = gx;
          mockSession.player.gy = gy;
          mockSession.player.x = gx * 16;
          mockSession.player.y = gy * 16;
          if (dir !== undefined) mockSession.player.direction = dir;
        }),
        setEmote: vi.fn(),
      },
      follower: {
        gx: 120,
        gy: 86,
        x: 120 * 16,
        y: 86 * 16,
        visible: true,
        jumpY: 0,
        snapTo: vi.fn((gx: number, gy: number) => {
          mockSession.follower.gx = gx;
          mockSession.follower.gy = gy;
          mockSession.follower.x = gx * 16;
          mockSession.follower.y = gy * 16;
        }),
      },
      camera: {
        snapTo: vi.fn(),
      },
      chunkManager: {
        field: {
          getGrassPatches: () => [{ x: 120 * 16, y: 85 * 16, width: 16, height: 16 }],
        },
        clearRoute1ClearingTrees: vi.fn(),
        update: vi.fn(),
      },
      isInputLocked: false,
      isBattling: false,
      worldClock: {
        pause: vi.fn(),
        resume: vi.fn(),
      },
      getWeather: () => 'clear',
      getDayPhase: () => 'day',
    };
  });

  it('does not trigger if Pallet farewell is not done', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', false);
    expect(route1SpearowEventManager.shouldTrigger(mockSession)).toBe(false);
  });

  it('triggers when Pallet farewell is done and player approaches solo Spearow on Route 1', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    const coords = route1SpearowEventManager.getTargetCoordinates(mockSession);
    mockSession.player.gx = coords.gx;
    mockSession.player.gy = coords.gy + 1;

    expect(route1SpearowEventManager.shouldTrigger(mockSession)).toBe(true);
  });

  it('initializes solo Spearow cutscene actor and activates encounter mode on trigger', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    const coords = route1SpearowEventManager.getTargetCoordinates(mockSession);
    mockSession.player.gx = coords.gx;
    mockSession.player.gy = coords.gy + 1;

    route1SpearowEventManager.trigger(mockSession);

    expect(route1SpearowEventManager.isRunning).toBe(true);
    expect(route1SpearowEventManager.phase).toBe('spearow_spotted');

    const spearow = route1SpearowEventManager.soloSpearowActor;
    expect(spearow).not.toBeNull();
    expect(spearow?.name).toBe('Onisuzume');
  });

  it('spawns a flock of 7 aggressive Spearows circling overhead with angry emotes', () => {
    spearowFlockDirector.spawnFlock(120, 85);

    expect(spearowFlockDirector.isActiveFlock()).toBe(true);
    const actors = spearowFlockDirector.getActors();
    expect(actors.length).toBe(7);

    actors.forEach((bird) => {
      expect(bird.id).toMatch(/^spearow_flock_/);
      expect(bird.activeEmote).toBe('angry');
      expect(bird.flightAltitude).toBeGreaterThan(0);
      expect(bird.flapSpeed).toBeGreaterThan(0);
    });
  });

  it('updates flock positions and tracks player escape steps', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    route1SpearowEventManager.trigger(mockSession);

    // Simulate stepping while being chased
    route1SpearowEventManager.phase = 'chase';
    mockSession.isInputLocked = false;
    spearowFlockDirector.spawnFlock(120, 85);

    // Player moves 1 tile south
    mockSession.player.gy = 86;
    route1SpearowEventManager.update(1.0, mockSession);
    expect(route1SpearowEventManager.escapeStepsTaken).toBe(1);

    // Player moves another tile
    mockSession.player.gy = 87;
    route1SpearowEventManager.update(1.0, mockSession);
    expect(route1SpearowEventManager.escapeStepsTaken).toBe(2);
  });

  it('unlocks player input during the chase phase so the player can escape', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    route1SpearowEventManager.trigger(mockSession);
    expect(route1SpearowEventManager.isInputLocked()).toBe(true);

    route1SpearowEventManager.phase = 'chase';
    expect(route1SpearowEventManager.isInputLocked()).toBe(false);

    route1SpearowEventManager.phase = 'pikachu_shock';
    expect(route1SpearowEventManager.isInputLocked()).toBe(true);
  });

  it('resolves the next settlement north of Route 1 (Verdant Town)', () => {
    const nextSettlement = route1SpearowEventManager.getNextSettlement(mockSession);
    expect(nextSettlement).toBeDefined();
    expect(nextSettlement.name).toBe('Verdant Town');
    expect(nextSettlement.buildings?.some((b) => b.type === 'city_pokecenter' || b.type === 'pokecenter')).toBe(true);
    expect(nextSettlement.entranceGX).toBeDefined();
    expect(nextSettlement.entranceGY).toBeDefined();
  });

  it('completes sprint and waterfall cutscene, shows 2 manga pages, and teleports player to next village', async () => {
    route1SpearowEventManager.phase = 'chase';
    spearowFlockDirector.spawnFlock(120, 85);

    await route1SpearowEventManager.runScene_SprintAndWaterfall(mockSession);

    // Completed flags
    expect(playerService.hasFlag('route1_spearow_defeated')).toBe(true);
    expect(playerService.hasFlag('route1_flock_escaped')).toBe(true);
    expect(playerService.hasFlag('route1_act2_completed')).toBe(true);
    expect(playerService.hasFlag('arrived_next_village')).toBe(true);

    // Spearow flock cleared
    expect(spearowFlockDirector.isActiveFlock()).toBe(false);
    expect(route1SpearowEventManager.phase).toBe('completed');
    expect(route1SpearowEventManager.isRunning).toBe(false);

    // Player and follower snapped to next city entrance
    const nextVillage = route1SpearowEventManager.getNextSettlement(mockSession);
    const targetGX = nextVillage.entranceGX ?? nextVillage.centerGX;
    const targetGY = nextVillage.entranceGY ?? nextVillage.centerGY;
    expect(mockSession.player.snapTo).toHaveBeenCalledWith(targetGX, targetGY, 3);
    expect(mockSession.follower.snapTo).toHaveBeenCalledWith(targetGX, targetGY + 1, 3);
    expect(mockSession.camera.snapTo).toHaveBeenCalledWith(mockSession.player);
    expect(mockSession.chunkManager.update).toHaveBeenCalled();
  });

  it('resets cleanly and restores all state', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    route1SpearowEventManager.trigger(mockSession);
    spearowFlockDirector.spawnFlock(120, 85);

    route1SpearowEventManager.reset();

    expect(route1SpearowEventManager.isRunning).toBe(false);
    expect(route1SpearowEventManager.phase).toBe('idle');
    expect(route1SpearowEventManager.soloSpearowActor).toBeNull();
    expect(route1SpearowEventManager.escapeStepsTaken).toBe(0);
    expect(spearowFlockDirector.isActiveFlock()).toBe(false);
    expect(spearowFlockDirector.getActors().length).toBe(0);
  });

  it('animates natural wandering, hopping and frame cycling while idle on Route 1', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    // Player is far away so wander can occur without triggering encounter
    mockSession.player.gx = 0;
    mockSession.player.gy = 0;

    const spearow = route1SpearowEventManager.ensureSoloSpearowSpawned(mockSession);
    expect(spearow).toBeDefined();
    const initialGX = spearow.gx;
    const initialGY = spearow.gy;

    // Simulate idle updates until Spearow initiates a step
    route1SpearowEventManager.wanderCooldownMs = 0;
    route1SpearowEventManager.update(1.0, mockSession);

    // Spearow should have picked a step and be moving
    expect(route1SpearowEventManager.isMoving).toBe(true);
    expect(route1SpearowEventManager.stepProgress).toBe(0);

    // Mid-step frame animation and bird hop arc
    route1SpearowEventManager.update(10.0, mockSession);
    expect(route1SpearowEventManager.stepProgress).toBeGreaterThan(0);
    expect(spearow.hopY).toBeLessThan(0); // Hop elevation
    expect(spearow.frame).toBeGreaterThanOrEqual(0);

    // Finish step
    route1SpearowEventManager.update(60.0, mockSession);
    expect(route1SpearowEventManager.isMoving).toBe(false);
    expect(spearow.hopY).toBe(0);
    expect(spearow.frame).toBe(0);
    // Position stayed within wanderRadius = 3
    expect(Math.abs(spearow.gx - initialGX)).toBeLessThanOrEqual(3);
    expect(Math.abs(spearow.gy - initialGY)).toBeLessThanOrEqual(3);
  });

  it('stops wandering, turns to face player and triggers encounter when approached', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    const spearow = route1SpearowEventManager.ensureSoloSpearowSpawned(mockSession);

    // Player approaches right in front of Spearow
    mockSession.player.gx = spearow.gx;
    mockSession.player.gy = spearow.gy + 1; // 1 tile below Spearow

    route1SpearowEventManager.update(1.0, mockSession);

    // Encounter starts, Spearow stops and turns toward player (direction 0 = down)
    expect(route1SpearowEventManager.isRunning).toBe(true);
    expect(route1SpearowEventManager.phase).toBe('spearow_spotted');
    expect(spearow.direction).toBe(0); // Faces down toward player
    expect(mockSession.player.direction).toBe(3); // Player faces up toward Spearow
  });

  it('enforces fail-safe face-to-face separation if player was on exact same tile', () => {
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    const spearow = route1SpearowEventManager.ensureSoloSpearowSpawned(mockSession);

    // Glitch simulation: player coordinates match Spearow exactly
    mockSession.player.gx = spearow.gx;
    mockSession.player.gy = spearow.gy;

    void route1SpearowEventManager.triggerEncounter(mockSession);

    // Fail-safe separation must place player 1 tile away and orient face-to-face
    expect(route1SpearowEventManager.phase).toBe('spearow_spotted');
    expect(mockSession.player.gx).toBe(spearow.gx);
    expect(mockSession.player.gy).toBe(spearow.gy + 1);
    expect(mockSession.player.direction).toBe(3); // Player faces UP toward Spearow
    expect(spearow.direction).toBe(0); // Spearow faces DOWN toward player

    // Follower Pikachu placed behind Satoshi
    expect(mockSession.follower.gx).toBe(spearow.gx);
    expect(mockSession.follower.gy).toBe(spearow.gy + 2);
    expect(mockSession.follower.direction).toBe(3);
  });
});

