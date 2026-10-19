import { describe, it, expect } from 'vitest';
import { Follower } from '../src/entities/follower';
import { updateWildPokemon } from '../src/ai/wild-pokemon';
import type { ChunkManager } from '../src/maps/chunk-manager';
import { Player } from '../src/entities/player';
import type { WildPokemonEntity } from '../src/wildlife/model';

describe('Pokemon Continuous Overworld Animation', () => {
  describe('Follower Continuous Idle Animation', () => {
    it('cycles follower frame continuously through 0, 1, 2, 3 when stationary', () => {
      const follower = new Follower(5, 5, 0);
      expect(follower.frame).toBe(0);

      // Simulate ~180ms passage (approx 11 frames of 16.6ms at dtScale = 1.0)
      for (let i = 0; i < 11; i++) {
        follower.updateIdle(1.0);
      }
      expect(follower.frame).toBe(1);

      // Advance another 180ms -> frame 2
      for (let i = 0; i < 11; i++) {
        follower.updateIdle(1.0);
      }
      expect(follower.frame).toBe(2);

      // Advance another 180ms -> frame 3
      for (let i = 0; i < 11; i++) {
        follower.updateIdle(1.0);
      }
      expect(follower.frame).toBe(3);

      // Advance another 180ms -> wraps back to frame 0
      for (let i = 0; i < 11; i++) {
        follower.updateIdle(1.0);
      }
      expect(follower.frame).toBe(0);
    });

    it('smoothly preserves frame continuity upon step completion', () => {
      const follower = new Follower(5, 5, 0);
      follower.isMoving = true;
      follower.frame = 2; // Arrives at tile on frame 2

      follower.completeStep();
      expect(follower.isMoving).toBe(false);
      // idleAnimTimer starts at 2 * 180 = 360ms
      expect(follower.idleAnimTimer).toBe(360);
      expect(follower.frame).toBe(2);

      // Small tick keeps it on frame 2
      follower.updateIdle(0.5);
      expect(follower.frame).toBe(2);

      // After 180ms further, advances to frame 3
      for (let i = 0; i < 11; i++) {
        follower.updateIdle(1.0);
      }
      expect(follower.frame).toBe(3);
    });
  });

  describe('Wild Pokémon Continuous Overworld Animation', () => {
    function createMockWildPokemon(overrides?: Partial<WildPokemonEntity>): WildPokemonEntity {
      return {
        gx: 10,
        gy: 10,
        x: 320,
        y: 320,
        speciesKey: 'PIKACHU',
        name: 'Pikachu',
        level: 5,
        behavior: 'docile',
        dir: 0,
        homeGX: 10,
        homeGY: 10,
        wanderRadius: 4,
        state: 'idle',
        isMoving: false,
        fromX: 320,
        fromY: 320,
        targetGX: 10,
        targetGY: 10,
        targetX: 320,
        targetY: 320,
        stepProgress: 0,
        moveSpeed: 1.5,
        stepsRemaining: 0,
        currentDir: 0,
        lastMoveTime: 0,
        idleTimer: 2000,
        frame: 0,
        seed: 12345,
        chunkCx: 0,
        chunkCy: 0,
        ...overrides,
      };
    }

    it('cycles wild Pokemon frame continuously when stationary and awake', () => {
      const wp = createMockWildPokemon({ seed: 0 }); // seed 0 starts timer at 0
      const chunkManager = {
        simulationChunks: [{ wildPokemon: [wp] }],
      } as unknown as ChunkManager;
      const player = new Player(0, 0, 0);
      const follower = new Follower(0, -1, 0);

      // Initial tick
      updateWildPokemon(chunkManager, player, follower, 1.0, 'day');
      expect(wp.state).toBe('idle');

      // Advance ~180ms (11 ticks) -> frame advances to 1
      for (let i = 0; i < 11; i++) {
        updateWildPokemon(chunkManager, player, follower, 1.0, 'day');
      }
      expect(wp.frame).toBe(1);

      // Advance further -> frame 2 -> 3 -> 0
      for (let i = 0; i < 11; i++) {
        updateWildPokemon(chunkManager, player, follower, 1.0, 'day');
      }
      expect(wp.frame).toBe(2);

      for (let i = 0; i < 11; i++) {
        updateWildPokemon(chunkManager, player, follower, 1.0, 'day');
      }
      expect(wp.frame).toBe(3);

      for (let i = 0; i < 11; i++) {
        updateWildPokemon(chunkManager, player, follower, 1.0, 'day');
      }
      expect(wp.frame).toBe(0);
    });

    it('keeps sleeping wild Pokémon fixed at resting frame 0', () => {
      const wp = createMockWildPokemon({
        activeTime: ['night'], // Sleeping during day
        seed: 0,
      });
      const chunkManager = {
        simulationChunks: [{ wildPokemon: [wp] }],
      } as unknown as ChunkManager;
      const player = new Player(0, 0, 0);
      const follower = new Follower(0, -1, 0);

      // When inactive (daytime for night species), transitions to rest_sleep
      for (let i = 0; i < 20; i++) {
        updateWildPokemon(chunkManager, player, follower, 1.0, 'day');
        expect(wp.state).toBe('rest_sleep');
        expect(wp.frame).toBe(0);
      }
    });
  });
});
