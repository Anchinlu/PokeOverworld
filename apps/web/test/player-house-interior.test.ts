import { describe, it, expect, beforeEach } from 'vitest';
import { InteriorRegistry } from '../src/interior/interior-registry';
import { InteriorManager } from '../src/interior/interior-manager';
import { PLAYER_HOUSE_1F_CONFIG, PLAYER_HOUSE_2F_CONFIG } from '../src/interior/player-house-interior';

describe('Player House Interior System (1F & 2F)', () => {
  let registry: InteriorRegistry;
  let manager: InteriorManager;

  beforeEach(() => {
    registry = InteriorRegistry.getInstance();
    manager = InteriorManager.getInstance();
    manager.currentRoom = null;
    manager.returnCoords = null;
  });

  it('correctly configures Player House 1F according to the canonical reference layout', () => {
    expect(PLAYER_HOUSE_1F_CONFIG.id).toBe('player_house_1f');
    expect(PLAYER_HOUSE_1F_CONFIG.widthTiles).toBe(16);
    expect(PLAYER_HOUSE_1F_CONFIG.heightTiles).toBe(11);
    expect(PLAYER_HOUSE_1F_CONFIG.wallHeightTiles).toBe(2);
    expect(PLAYER_HOUSE_1F_CONFIG.floorAssetKey).toBe('house_floor');
    expect(PLAYER_HOUSE_1F_CONFIG.wallAssetKey).toBe('house_wall');
    expect(PLAYER_HOUSE_1F_CONFIG.spawnGX).toBe(3);
    expect(PLAYER_HOUSE_1F_CONFIG.spawnGY).toBe(9);

    // Stairs up to 2F
    expect(PLAYER_HOUSE_1F_CONFIG.stairsWarps).toBeDefined();
    expect(PLAYER_HOUSE_1F_CONFIG.stairsWarps?.length).toBeGreaterThan(0);
    const stairsUp = PLAYER_HOUSE_1F_CONFIG.stairsWarps?.[0];
    expect(stairsUp?.targetRoomId).toBe('player_house_2f');

    // Resident NPC Mom
    expect(PLAYER_HOUSE_1F_CONFIG.npcs.length).toBe(1);
    const mom = PLAYER_HOUSE_1F_CONFIG.npcs[0];
    expect(mom.id).toBe('char_mom');
    expect(mom.spriteKey).toBe('char_mom');
    expect(mom.dialogue.length).toBeGreaterThan(0);
  });

  it('correctly configures Player House 2F bedroom, PC workstation, and stairs down', () => {
    expect(PLAYER_HOUSE_2F_CONFIG.id).toBe('player_house_2f');
    expect(PLAYER_HOUSE_2F_CONFIG.widthTiles).toBe(14);
    expect(PLAYER_HOUSE_2F_CONFIG.heightTiles).toBe(11);
    expect(PLAYER_HOUSE_2F_CONFIG.wallHeightTiles).toBe(2);
    expect(PLAYER_HOUSE_2F_CONFIG.floorAssetKey).toBe('house_floor');
    expect(PLAYER_HOUSE_2F_CONFIG.wallAssetKey).toBe('house_wall');

    // Stairs down to 1F
    expect(PLAYER_HOUSE_2F_CONFIG.stairsWarps).toBeDefined();
    const stairsDown = PLAYER_HOUSE_2F_CONFIG.stairsWarps?.[0];
    expect(stairsDown?.targetRoomId).toBe('player_house_1f');

    // Key interactive bedroom props
    const propIds = PLAYER_HOUSE_2F_CONFIG.props.map((p) => p.id);
    expect(propIds).toContain('house_2f_pc');
    expect(propIds).toContain('house_2f_bed');
    expect(propIds).toContain('house_2f_tv');
    expect(propIds).toContain('house_2f_console');
    expect(propIds).toContain('house_2f_stairs_down');
  });

  it('registers Player House in InteriorRegistry and maps starter village building types', () => {
    expect(registry.getRoom('player_house_1f')).toBeDefined();
    expect(registry.getRoom('player_house_2f')).toBeDefined();

    expect(registry.hasBuildingMapping('house_player')).toBe(true);
    const mappingPlayer = registry.getBuildingMapping('house_player');
    expect(mappingPlayer?.roomId).toBe('player_house_1f');

    expect(registry.hasBuildingMapping('house_red')).toBe(true);
    const mappingRed = registry.getBuildingMapping('house_red');
    expect(mappingRed?.roomId).toBe('player_house_1f');
  });

  it('supports seamless stairs transitions between 1F and 2F in InteriorManager', () => {
    const returnCoords = { gx: 12, gy: 18, direction: 3 as const };

    // Enter 1F from outside
    manager.enterRoom(PLAYER_HOUSE_1F_CONFIG, returnCoords);
    expect(manager.isInInterior()).toBe(true);
    expect(manager.currentRoom?.id).toBe('player_house_1f');
    expect(manager.returnCoords).toEqual(returnCoords);

    // Transition up to 2F
    const transitionedUp = manager.transitionToRoom('player_house_2f', 8, 2, 0);
    expect(transitionedUp).toBe(true);
    expect(manager.currentRoom?.id).toBe('player_house_2f');
    expect(manager.roomPlayerGX).toBe(8);
    expect(manager.roomPlayerGY).toBe(2);
    // Overworld return coords are preserved across floor transitions
    expect(manager.returnCoords).toEqual(returnCoords);

    // Transition back down to 1F
    const transitionedDown = manager.transitionToRoom('player_house_1f', 7, 2, 0);
    expect(transitionedDown).toBe(true);
    expect(manager.currentRoom?.id).toBe('player_house_1f');
    expect(manager.roomPlayerGX).toBe(7);
    expect(manager.roomPlayerGY).toBe(2);

    // Stepping out onto the exit doormat
    let exited = false;
    manager.onExitRoomCallback = (coords) => {
      exited = true;
      expect(coords).toEqual(returnCoords);
    };
    manager.exitCurrentRoom();
    expect(exited).toBe(true);
    expect(manager.isInInterior()).toBe(false);
  });

  it('persists and restores save state correctly for both 1F and 2F rooms', () => {
    const returnCoords = { gx: 5, gy: 10, direction: 3 as const };

    // Save while on 2F
    manager.enterRoom(PLAYER_HOUSE_2F_CONFIG, returnCoords);
    manager.roomPlayerGX = 3;
    manager.roomPlayerGY = 5;
    manager.roomPlayerDir = 1;

    const saveState = manager.getSaveState();
    expect(saveState).not.toBeNull();
    expect(saveState?.roomId).toBe('player_house_2f');
    expect(saveState?.playerGX).toBe(3);
    expect(saveState?.playerGY).toBe(5);
    expect(saveState?.playerDir).toBe(1);

    // Clear and restore
    manager.currentRoom = null;
    manager.returnCoords = null;
    const restored = manager.restoreSaveState(saveState!);
    expect(restored).toBe(true);
    expect(manager.currentRoom?.id).toBe('player_house_2f');
    expect(manager.roomPlayerGX).toBe(3);
    expect(manager.roomPlayerGY).toBe(5);
  });

  it('strictly prevents walking inside dining table, chairs, and north wall on 1F', () => {
    manager.enterRoom(PLAYER_HOUSE_1F_CONFIG, { gx: 3, gy: 9, direction: 3 });

    // Table footprint: (6, 5), (7, 5), (8, 5) and (6, 6), (7, 6), (8, 6) MUST all be solid
    expect(manager.isWalkable(6, 5)).toBe(false);
    expect(manager.isWalkable(7, 5)).toBe(false);
    expect(manager.isWalkable(8, 5)).toBe(false);
    expect(manager.isWalkable(6, 6)).toBe(false);
    expect(manager.isWalkable(7, 6)).toBe(false);
    expect(manager.isWalkable(8, 6)).toBe(false);

    // Left chair footprint: hitbox is strictly 2 tiles at rows 5 and 6; row 4 behind backrest is walkable
    expect(manager.isWalkable(5, 4)).toBe(true);
    expect(manager.isWalkable(5, 5)).toBe(false);
    expect(manager.isWalkable(5, 6)).toBe(false);

    // Right chair footprint: hitbox is strictly 2 tiles at rows 5 and 6; row 4 behind backrest is walkable
    expect(manager.isWalkable(9, 4)).toBe(true);
    expect(manager.isWalkable(9, 5)).toBe(false);
    expect(manager.isWalkable(9, 6)).toBe(false);

    // Walkway behind dining set at row 4 is clear
    expect(manager.isWalkable(6, 4)).toBe(true);
    expect(manager.isWalkable(7, 4)).toBe(true);
    expect(manager.isWalkable(8, 4)).toBe(true);

    // Entire North wall (row 0 and row 1) MUST be completely impassable (Screenshot 2 fix)
    for (let x = 0; x < PLAYER_HOUSE_1F_CONFIG.widthTiles; x++) {
      expect(manager.isWalkable(x, 0)).toBe(false);
      expect(manager.isWalkable(x, 1)).toBe(false);
    }

    // 1F stair mat at (13, 2) is walkable floor leading into the stairs
    expect(manager.isWalkable(13, 2)).toBe(true);

    // Stairs bottom step at (14, 2) and (15, 2) are walkable warp triggers
    expect(manager.isWalkable(14, 2)).toBe(true);
    expect(manager.isWalkable(15, 2)).toBe(true);
  });

  it('strictly prevents walking inside bed, bookshelf, and north wall on 2F', () => {
    manager.enterRoom(PLAYER_HOUSE_2F_CONFIG, { gx: 3, gy: 2, direction: 0 });

    // Bed footprint: (1..4, 5..8) MUST all be solid
    for (let x = 1; x <= 4; x++) {
      for (let y = 5; y <= 8; y++) {
        expect(manager.isWalkable(x, y)).toBe(false);
      }
    }

    // Bookshelf at (4..5, 1..3) MUST be solid
    expect(manager.isWalkable(4, 2)).toBe(false);
    expect(manager.isWalkable(5, 2)).toBe(false);
    expect(manager.isWalkable(4, 3)).toBe(false);
    expect(manager.isWalkable(5, 3)).toBe(false);

    // Entire North wall (row 0 and row 1) MUST be completely impassable (Screenshot 4 fix)
    for (let x = 0; x < PLAYER_HOUSE_2F_CONFIG.widthTiles; x++) {
      expect(manager.isWalkable(x, 0)).toBe(false);
      expect(manager.isWalkable(x, 1)).toBe(false);
    }

    // 2F stair mat at (3, 2) is walkable floor where player lands after coming up stairs
    expect(manager.isWalkable(3, 2)).toBe(true);

    // Stairs top step at (1, 2) and (2, 2) are walkable warp triggers
    expect(manager.isWalkable(1, 2)).toBe(true);
    expect(manager.isWalkable(2, 2)).toBe(true);
  });

  it('ensures stairs sprites render UNDER the player (player renders ON TOP of stairs)', () => {
    // 1F stairs
    const stairs1F = PLAYER_HOUSE_1F_CONFIG.props.find((p) => p.id === 'house_1f_stairs_up');
    expect(stairs1F).toBeDefined();
    expect(stairs1F?.ySortOffset).toBeDefined();
    const stairs1FYSort = (stairs1F!.gy + stairs1F!.heightTiles) * 32 + stairs1F!.ySortOffset!;
    const playerYSortRow2 = 2 * 32 - 32 + 58; // 90
    expect(stairs1FYSort).toBeLessThan(playerYSortRow2);

    // 2F stairs
    const stairs2F = PLAYER_HOUSE_2F_CONFIG.props.find((p) => p.id === 'house_2f_stairs_down');
    expect(stairs2F).toBeDefined();
    expect(stairs2F?.ySortOffset).toBeDefined();
    const stairs2FYSort = (stairs2F!.gy + stairs2F!.heightTiles) * 32 + stairs2F!.ySortOffset!;
    expect(stairs2FYSort).toBeLessThan(playerYSortRow2);
  });
});

