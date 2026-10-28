import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  InteriorManager,
  InteriorRegistry,
  OAK_LAB_INTERIOR_CONFIG,
  DoorPromptModal,
  type OverworldReturnCoords,
} from '../src/interior';
import { Follower } from '../src/entities/follower';

describe('Oak Research Lab Interior & Door Interaction System', () => {
  let interior: InteriorManager;
  let registry: InteriorRegistry;

  beforeEach(() => {
    interior = InteriorManager.getInstance();
    interior.currentRoom = null;
    interior.returnCoords = null;
    interior.activeDialogue = null;
    registry = InteriorRegistry.getInstance();
  });

  it('1. verifies Oak Lab interior configuration and 17-asset layout specs', () => {
    expect(OAK_LAB_INTERIOR_CONFIG.id).toBe('oak_lab');
    expect(OAK_LAB_INTERIOR_CONFIG.name).toBe('Viện Nghiên Cứu Giáo Sư Oak');
    expect(OAK_LAB_INTERIOR_CONFIG.widthTiles).toBe(16);
    expect(OAK_LAB_INTERIOR_CONFIG.heightTiles).toBe(12);
    expect(OAK_LAB_INTERIOR_CONFIG.wallHeightTiles).toBe(2);

    // Verify key props exist
    const propKeys = OAK_LAB_INTERIOR_CONFIG.props.map((p) => p.assetKey);
    expect(propKeys).toContain('lab_window');
    expect(propKeys).toContain('lab_map');
    expect(propKeys).toContain('lab_info_board');
    expect(propKeys).toContain('lab_plant');
    expect(propKeys).toContain('lab_mainframe');
    expect(propKeys).toContain('lab_pc_desk');
    expect(propKeys).toContain('lab_cabinet');
    expect(propKeys).toContain('lab_table');
    expect(propKeys).toContain('lab_table_device');
    expect(propKeys).toContain('lab_books_stack');
    expect(propKeys).toContain('lab_sofa');
    expect(propKeys).toContain('lab_bookshelf');
    expect(propKeys).toContain('lab_bookshelf_wall');
    expect(propKeys).toContain('lab_device_pillar');

    // CRITICAL: verify 3 starter Poké Balls are NOT present on the table
    const ballProps = OAK_LAB_INTERIOR_CONFIG.props.filter(
      (p) => p.id.toLowerCase().includes('ball') || p.assetKey.toLowerCase().includes('ball')
    );
    expect(ballProps.length).toBe(0);

    // Verify NPCs (Oak, Assistant, Scientist)
    expect(OAK_LAB_INTERIOR_CONFIG.npcs.length).toBe(3);
    const oak = OAK_LAB_INTERIOR_CONFIG.npcs.find((n) => n.id === 'prof_oak');
    expect(oak).toBeDefined();
    expect(oak!.name).toBe('Giáo Sư Oak');
    expect(oak!.spriteKey).toBe('char_oak');
    expect(oak!.idleBehavior).toBe('turn_cycle');

    const aide = OAK_LAB_INTERIOR_CONFIG.npcs.find((n) => n.id === 'lab_aide');
    expect(aide).toBeDefined();
    expect(aide!.name).toBe('Trợ Lý Nghiên Cứu');
    expect(aide!.spriteKey).toBe('char_asistente');
    expect(aide!.idleBehavior).toBe('turn_cycle');

    const scientist = OAK_LAB_INTERIOR_CONFIG.npcs.find((n) => n.id === 'lab_scientist');
    expect(scientist).toBeDefined();
    expect(scientist!.name).toBe('Kỹ Sư Nghiên Cứu');
    expect(scientist!.spriteKey).toBe('char_cientifico');
    expect(scientist!.idleBehavior).toBe('turn_cycle');
  });

  it('2. verifies InteriorRegistry registers default rooms and building mappings', () => {
    expect(registry.getRoom('oak_lab')).toBeDefined();
    expect(registry.hasBuildingMapping('lab_okido')).toBe(true);

    const mapping = registry.getBuildingMapping('lab_okido');
    expect(mapping).toBeDefined();
    expect(mapping!.roomId).toBe('oak_lab');
    expect(mapping!.displayName).toBe('Viện Nghiên Cứu Giáo Sư Oak');
    expect(mapping!.config.widthTiles).toBe(16);
  });

  it('3. enters Oak Lab, sets up solid colliders and player position', () => {
    const returnPos: OverworldReturnCoords = { gx: 10, gy: 15, direction: 3 };
    interior.enterOakLab(returnPos);

    expect(interior.isInInterior()).toBe(true);
    expect(interior.roomPlayerGX).toBe(OAK_LAB_INTERIOR_CONFIG.spawnGX);
    expect(interior.roomPlayerGY).toBe(OAK_LAB_INTERIOR_CONFIG.spawnGY);

    // Walking into outer boundary wall should be blocked
    expect(interior.isWalkable(0, 5)).toBe(false); // Left wall
    expect(interior.isWalkable(15, 5)).toBe(false); // Right wall
    expect(interior.isWalkable(5, 0)).toBe(false); // Top wall
    expect(interior.isWalkable(5, 1)).toBe(false); // Top wall

    // Walking into solid props should be blocked
    expect(interior.isWalkable(3, 4)).toBe(false); // Mainframe
    expect(interior.isWalkable(7, 7)).toBe(false); // Research table
    expect(interior.isWalkable(1, 5)).toBe(false); // Pillar 1

    // Open floor should be walkable
    expect(interior.isWalkable(7, 9)).toBe(true);
    expect(interior.isWalkable(6, 9)).toBe(true);
  });

  it('4. initializes and synchronizes Follower Pokémon indoors', () => {
    const returnPos: OverworldReturnCoords = { gx: 10, gy: 15, direction: 3 };
    const follower = new Follower(0, 0, 3, 'PIKACHU');

    // Entering Oak lab facing north (3), follower should spawn at spawnGY + 1 (7, 11)
    interior.enterOakLab(returnPos, follower);
    expect(follower.gx).toBe(7);
    expect(follower.gy).toBe(11);
    expect(follower.visible).toBe(true);

    // Turn player to face follower south (0) and interact
    interior.roomPlayerGX = 7;
    interior.roomPlayerGY = 10;
    interior.roomPlayerDir = 0; // Facing down directly at Pikachu at (7, 11)

    const interacted = interior.handleInteract(follower);
    expect(interacted).toBe(true);
    expect(interior.activeDialogue).not.toBeNull();
    expect(interior.activeDialogue!.speaker).toBe('Pikachu');
  });

  it('5. enforces strict facing direction for NPC and prop interactions', () => {
    const returnPos: OverworldReturnCoords = { gx: 10, gy: 15, direction: 3 };
    interior.enterOakLab(returnPos);

    // Position player next to Professor Oak at (6, 5), but facing LEFT (1 - into empty floor tile at 5, 5)
    interior.roomPlayerGX = 6;
    interior.roomPlayerGY = 5;
    interior.roomPlayerDir = 1; // Facing left into empty tile away from Oak

    const awayInteracted = interior.handleInteract();
    expect(awayInteracted).toBe(false);
    expect(interior.activeDialogue).toBeNull();

    // Now turn to face UP (3 - directly toward Oak at 6, 4)
    interior.roomPlayerDir = 3;
    const directInteracted = interior.handleInteract();
    expect(directInteracted).toBe(true);
    expect(interior.activeDialogue).not.toBeNull();
    expect(interior.activeDialogue!.speaker).toBe('Giáo Sư Oak');

    // Finish dialogue
    while (interior.activeDialogue) {
      interior.handleInteract();
    }
    expect(interior.activeDialogue).toBeNull();
  });

  it('6. steps on exit door warp and returns to overworld', () => {
    const returnPos: OverworldReturnCoords = { gx: 12, gy: 18, direction: 0 };
    const exitCallback = vi.fn();
    interior.onExitRoomCallback = exitCallback;

    interior.enterOakLab(returnPos);
    expect(interior.isInInterior()).toBe(true);

    // Place player at exit warp (7, 11) and exit
    interior.exitCurrentRoom();

    expect(interior.isInInterior()).toBe(false);
    expect(exitCallback).toHaveBeenCalledWith(returnPos);
  });

  it('7. saves and restores interior room state', () => {
    const returnPos: OverworldReturnCoords = { gx: 14, gy: 22, direction: 1 };
    const follower = new Follower(0, 0, 0, 'PIKACHU');
    interior.enterOakLab(returnPos, follower);

    interior.roomPlayerGX = 4;
    interior.roomPlayerGY = 6;
    interior.roomPlayerDir = 2; // Right

    const saved = interior.getSaveState();
    expect(saved).not.toBeNull();
    expect(saved!.roomId).toBe('oak_lab');
    expect(saved!.playerGX).toBe(4);
    expect(saved!.playerGY).toBe(6);
    expect(saved!.playerDir).toBe(2);
    expect(saved!.returnCoords).toEqual(returnPos);

    // Clear state
    interior.exitCurrentRoom();
    expect(interior.isInInterior()).toBe(false);

    // Restore state
    const restored = interior.restoreSaveState(saved!, follower);
    expect(restored).toBe(true);
    expect(interior.isInInterior()).toBe(true);
    expect(interior.roomPlayerGX).toBe(4);
    expect(interior.roomPlayerGY).toBe(6);
    expect(interior.roomPlayerDir).toBe(2);
  });

  it('8. validates DoorPromptModal singleton and lifecycle', () => {
    const modal = DoorPromptModal.getInstance();
    expect(modal).toBeDefined();
    expect(modal.isPromptOpen()).toBe(false);

    const onEnterSpy = vi.fn();
    const onCancelSpy = vi.fn();

    modal.showIndicator('Viện Nghiên Cứu Oak', {
      buildingName: 'Viện Nghiên Cứu Giáo Sư Oak',
      onEnter: onEnterSpy,
      onCancel: onCancelSpy,
    });

    modal.open({
      buildingName: 'Viện Nghiên Cứu Giáo Sư Oak',
      onEnter: onEnterSpy,
      onCancel: onCancelSpy,
    });
    expect(modal.isPromptOpen()).toBe(true);

    modal.close();
    expect(modal.isPromptOpen()).toBe(false);
    expect(onCancelSpy).toHaveBeenCalled();
  });
});
