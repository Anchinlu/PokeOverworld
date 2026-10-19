import { describe, it, expect, beforeEach } from 'vitest';
import { Player } from '../src/entities/player';
import { Follower } from '../src/entities/follower';
import { ChunkManager } from '../src/maps/chunk-manager';
import { TERRAIN } from '@pokemon/game-data';

describe('Cliff Jump & Elevation Physics', () => {
  describe('Player Jump & Drop Physics', () => {
    let player: Player;

    beforeEach(() => {
      player = new Player(10, 10, 0);
    });

    it('correctly initializes jump up onto a cliff', () => {
      player.startJump(10, 9, 3, 'jump_up');

      expect(player.isJumping).toBe(true);
      expect(player.jumpType).toBe('jump_up');
      expect(player.isMoving).toBe(true);
      expect(player.targetGX).toBe(10);
      expect(player.targetGY).toBe(9);
      expect(player.jumpY).toBe(0);
    });

    it('clears high parabolic trajectory (22px) and maintains frame 1 during jump_up', () => {
      player.startJump(10, 9, 3, 'jump_up');

      // Advance halfway through step
      player.stepProgress = 0.5;
      player.update(0); // update positions without advancing progress

      expect(player.jumpY).toBeCloseTo(-22, 1);
      expect(player.frame).toBe(1); // Airborne action frame
    });

    it('clears gravity fall trajectory during drop_down and triggers landing squash', () => {
      player.startJump(10, 11, 0, 'drop_down');

      expect(player.isJumping).toBe(true);
      expect(player.jumpType).toBe('drop_down');

      // Advance halfway through drop
      player.stepProgress = 0.5;
      player.update(0);

      expect(player.jumpY).toBeLessThan(0);
      expect(player.frame).toBe(1);

      // Finish step to 1.0
      player.stepProgress = 1.0;
      const completed = player.update(1.0);
      expect(completed).toBe(true);
      expect(player.isJumping).toBe(false);
      expect(player.jumpType).toBeNull();

      // Check landing squash impact
      player.update(1.0);
      // jumpY should rebound (compression squash)
      expect(player.jumpY).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Follower Jump Synchronization', () => {
    let follower: Follower;

    beforeEach(() => {
      follower = new Follower(10, 11, 3);
    });

    it('synchronously follows jump up with airborne pose and arc', () => {
      follower.startFollow(10, 10, 10, 9, 1, 'jump_up');

      expect(follower.isJumping).toBe(true);
      expect(follower.jumpType).toBe('jump_up');

      follower.updateSync(0.5);
      expect(follower.jumpY).toBeCloseTo(-20, 1);
      expect(follower.frame).toBe(1);

      follower.updateSync(1.0);
      follower.completeStep();
      expect(follower.isJumping).toBe(false);
      expect(follower.jumpY).toBe(0);
    });

    it('synchronously follows drop down trajectory when descending cliff', () => {
      follower.startFollow(10, 10, 10, 11, 2, 'drop_down');

      expect(follower.isJumping).toBe(true);
      expect(follower.jumpType).toBe('drop_down');

      follower.updateSync(0.5);
      expect(follower.jumpY).toBeLessThan(0);
      expect(follower.frame).toBe(1);

      follower.completeStep();
      expect(follower.isJumping).toBe(false);
    });
  });

  describe('ChunkManager Elevation & Cliff Rules', () => {
    it('distinguishes walking vs jumping for cliff elevation transitions', () => {
      const chunkManager = new ChunkManager(101);

      // Mock getTileData to test elevation states deterministically
      const originalGetTileData = chunkManager.getTileData.bind(chunkManager);
      chunkManager.getTileData = (gx: number, gy: number) => {
        const base = originalGetTileData(gx, gy);
        if (gx === 20 && gy === 20) {
          return { ...base, terrain: TERRAIN.GRASS };
        }
        if (gx === 20 && gy === 19) {
          return { ...base, terrain: TERRAIN.HILL };
        }
        if (gx === 20 && gy === 18) {
          return { ...base, terrain: TERRAIN.HILL };
        }
        return base;
      };

      // 1. Moving from Grass (20,20) to Hill (20,19): standard walking is blocked
      const walkOntoCliff = chunkManager.isWalkable(20, 19, 20, 20);
      expect(walkOntoCliff).toBe(false);

      // But canJumpOntoCliff allows Space key jumping onto the cliff
      const jumpOntoCliff = chunkManager.canJumpOntoCliff(20, 19);
      expect(jumpOntoCliff).toBe(true);

      // 2. Moving across plateau: Hill (20,19) to Hill (20,18) is walkable!
      const walkOnPlateau = chunkManager.isWalkable(20, 18, 20, 19);
      expect(walkOnPlateau).toBe(true);

      // 3. Stepping down off cliff: Hill (20,19) to Grass (20,20) is walkable as drop
      const dropOffCliff = chunkManager.isWalkable(20, 20, 20, 19);
      expect(dropOffCliff).toBe(true);
    });
  });
});
