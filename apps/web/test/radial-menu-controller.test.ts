import { describe, it, expect, beforeEach } from 'vitest';
import { RadialMenuController } from '../src/ui/radial-menu/radial-menu-controller';
import { playerService } from '../src/domain';

describe('RadialMenuController (Menu Bánh Xe Tròn)', () => {
  let controller: RadialMenuController;

  beforeEach(() => {
    controller = RadialMenuController.getInstance();
    controller.close();

    // Reset player flags
    playerService.setFlag('has_pokedex', false);
    playerService.setFlag('has_town_map', false);
  });

  it('initializes as a singleton and is initially closed', () => {
    expect(controller).toBeDefined();
    expect(controller.isOpen()).toBe(false);
  });

  it('configures default items with unlocked filtering for pokedex and town map', () => {
    controller.setupDefaultItems({
      onParty: () => {},
      onBag: () => {},
      onPokedex: () => {},
      onMap: () => {},
      onTrainer: () => {},
      onPC: () => {},
      onOptions: () => {},
      onQuit: () => {},
    });

    // When neither pokedex nor town map is unlocked
    expect(playerService.hasFlag('has_pokedex')).toBe(false);
    expect(playerService.hasFlag('has_town_map')).toBe(false);

    controller.open();
    expect(controller.isOpen()).toBe(true);

    // Active items should exclude pokedex and map (6 items remaining)
    const active = (controller as any).activeItems;
    expect(active.length).toBe(6);
    expect(active.some((item: any) => item.id === 'party')).toBe(true);
    expect(active.some((item: any) => item.id === 'pokedex')).toBe(false);
    expect(active.some((item: any) => item.id === 'map')).toBe(false);

    controller.close();
    expect(controller.isOpen()).toBe(false);
  });

  it('unlocks pokedex sector dynamically after player receives pokedex in Scene 7', () => {
    controller.setupDefaultItems({
      onParty: () => {},
      onBag: () => {},
      onPokedex: () => {},
      onMap: () => {},
      onTrainer: () => {},
      onPC: () => {},
      onOptions: () => {},
      onQuit: () => {},
    });

    // Grant pokedex (Scene 7 reward)
    playerService.setFlag('has_pokedex', true);

    controller.open();
    const active = (controller as any).activeItems;
    expect(active.length).toBe(7);
    expect(active.some((item: any) => item.id === 'pokedex')).toBe(true);
    expect(active.some((item: any) => item.id === 'map')).toBe(false);

    controller.close();
  });

  it('unlocks town map sector when player acquires town map', () => {
    controller.setupDefaultItems({
      onParty: () => {},
      onBag: () => {},
      onPokedex: () => {},
      onMap: () => {},
      onTrainer: () => {},
      onPC: () => {},
      onOptions: () => {},
      onQuit: () => {},
    });

    // Grant both
    playerService.setFlag('has_pokedex', true);
    playerService.setFlag('has_town_map', true);

    controller.open();
    const active = (controller as any).activeItems;
    expect(active.length).toBe(8);
    expect(active.some((item: any) => item.id === 'pokedex')).toBe(true);
    expect(active.some((item: any) => item.id === 'map')).toBe(true);

    controller.close();
  });

  it('notifies onToggle callback when opening and closing', () => {
    const toggleStates: boolean[] = [];
    controller.setOnToggle((isOpen) => {
      toggleStates.push(isOpen);
    });

    controller.open();
    expect(toggleStates).toEqual([true]);

    controller.close();
    expect(toggleStates).toEqual([true, false]);

    controller.toggle();
    expect(toggleStates).toEqual([true, false, true]);

    controller.toggle();
    expect(toggleStates).toEqual([true, false, true, false]);
  });
});
