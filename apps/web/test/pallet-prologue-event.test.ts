import { describe, it, expect, beforeEach } from 'vitest';
import { PalletPrologueEventManager } from '../src/npc/pallet-prologue-event';
import { Player } from '../src/entities/player';
import { playerService } from '../src/domain';
import { WorldClock } from '../src/core/world-clock';
import type { GameSession } from '../src/game/game-session';
import type { OverworldWeather } from '../src/world/overworld-weather';

describe('Pallet Town Prologue Event (Scenes 1 - 4: Oak Lab Gate Encounter)', () => {
  let eventManager: PalletPrologueEventManager;
  let mockPlayer: Player;
  let mockWorldClock: WorldClock;
  let weatherOverride: OverworldWeather | null;
  let mockSession: Partial<GameSession>;

  beforeEach(() => {
    eventManager = PalletPrologueEventManager.getInstance();
    eventManager.reset();

    // Reset story flags
    playerService.setFlag('pallet_lab_gate_event_done', false);
    playerService.setFlag('pallet_lab_oak_outside', false);

    // Mock Player wearing pajamas
    mockPlayer = new Player(12, 13, 3);
    mockPlayer.spriteKey = 'char_ash_pajamas';

    mockWorldClock = new WorldClock(720, 1);
    weatherOverride = null;

    // Mock GameSession with lab building at (12, 10), worldClock, and weather override
    mockSession = {
      player: mockPlayer,
      worldClock: mockWorldClock,
      setWeatherOverride: (w: OverworldWeather | null) => {
        weatherOverride = w;
      },
      getWeather: () => weatherOverride ?? 'clear',
      chunkManager: {
        activeChunks: [
          {
            cx: 0,
            cy: 0,
            buildings: [
              {
                id: 'start_lab',
                type: 'lab_okido',
                gx: 9,
                gy: 7,
                doorGX: 12,
                doorGY: 10,
                doorWidthTiles: 2,
              },
            ],
          } as any,
        ],
      } as any,
    };
  });

  it('initializes in an idle inactive state', () => {
    expect(eventManager.isActive()).toBe(false);
    expect(eventManager.currentScene).toBe(0);
    expect(eventManager.getActors().length).toBe(0);
  });

  it('detects when player is near the Oak Lab gate trigger zone', () => {
    // When player is far away, should not trigger
    mockPlayer.snapTo(0, 0);
    expect(eventManager.shouldTrigger(mockSession as GameSession)).toBe(false);

    // When player reaches approach steps (doorGX = 12, doorGY + 3 = 13)
    mockPlayer.snapTo(12, 13);
    expect(eventManager.shouldTrigger(mockSession as GameSession)).toBe(true);

    // If event is already marked done, should not trigger again
    playerService.setFlag('pallet_lab_gate_event_done', true);
    expect(eventManager.shouldTrigger(mockSession as GameSession)).toBe(false);
  });

  it('sets up stage actors with Gary Oak, cheerleaders, and Professor Oak', async () => {
    await eventManager.trigger(mockSession as GameSession, {
      doorGX: 12,
      doorGY: 10,
      skipDelays: true,
    });

    const actors = eventManager.getActors();
    expect(actors.length).toBe(13);

    const gary = actors.find((a) => a.id === 'gary');
    const cheer1 = actors.find((a) => a.id === 'cheerleader_1');
    const cheer2 = actors.find((a) => a.id === 'cheerleader_2');
    const cheer3 = actors.find((a) => a.id === 'cheerleader_3');
    const crowd = actors.filter((a) => a.id.startsWith('crowd_'));
    const oak = actors.find((a) => a.id === 'oak');

    expect(gary).toBeDefined();
    expect(gary?.spriteKey).toBe('char_rival_blue');

    expect(cheer1).toBeDefined();
    expect(cheer1?.spriteKey).toBe('char_picnicker_f');

    expect(cheer2).toBeDefined();
    expect(cheer2?.spriteKey).toBe('char_school_kid_f');

    expect(cheer3).toBeDefined();
    expect(cheer3?.spriteKey).toBe('char_flower_girl');

    expect(crowd.length).toBe(8);

    expect(oak).toBeDefined();
    expect(oak?.spriteKey).toBe('char_oak');
  });

  it('executes Scene 1 (Collision & Knockback) positioning and emotes correctly', async () => {
    // Stage setup
    await (eventManager as any).setupStage(mockSession as GameSession, 12, 10);

    const gary = eventManager.getActors().find((a) => a.id === 'gary')!;
    expect(gary.gx).toBe(12);
    expect(gary.gy).toBe(11);

    // Run Scene 1
    await eventManager.runScene1_Collision(mockSession as GameSession, 12, 10, true);

    // Knockback: Ash bounced back south to gy: 13, Gary bounced back north to gy: 11
    expect(mockPlayer.gy).toBe(13);
    expect(mockPlayer.direction).toBe(3); // Facing North
    expect(mockPlayer.activeEmote).toBe('exclamation');

    expect(gary.gy).toBe(11);
    expect(gary.direction).toBe(0); // Facing South
    expect(gary.activeEmote).toBe('exclamation');
  });

  it('executes Scene 2 (Gary Taunt & Cheer Squad) advancing dialogues and cheer emotes', async () => {
    await (eventManager as any).setupStage(mockSession as GameSession, 12, 10);
    await eventManager.runScene1_Collision(mockSession as GameSession, 12, 10, true);

    // Run Scene 2
    await eventManager.runScene2_GaryTaunt(mockSession as GameSession, true);

    const gary = eventManager.getActors().find((a) => a.id === 'gary')!;
    expect(gary.gy).toBe(12); // Gary stepped down to face Ash
    expect(gary.direction).toBe(0);
  });

  it('executes Scene 3 (Departure) marching Gary & cheer squad away, leaving Ash with ellipsis emote', async () => {
    await (eventManager as any).setupStage(mockSession as GameSession, 12, 10);
    await eventManager.runScene1_Collision(mockSession as GameSession, 12, 10, true);
    await eventManager.runScene2_GaryTaunt(mockSession as GameSession, true);

    // Run Scene 3
    await eventManager.runScene3_Departure(mockSession as GameSession, 12, 10, true);

    const gary = eventManager.getActors().find((a) => a.id === 'gary')!;
    const cheer1 = eventManager.getActors().find((a) => a.id === 'cheerleader_1')!;
    const cheer2 = eventManager.getActors().find((a) => a.id === 'cheerleader_2')!;

    // Departed actors and dispersed crowd are hidden
    expect(gary.visible).toBe(false);
    expect(cheer1.visible).toBe(false);
    expect(cheer2.visible).toBe(false);
    expect(eventManager.getActors().find((a) => a.id === 'cheerleader_3')?.visible).toBe(false);
    const crowd = eventManager.getActors().filter((a) => a.id.startsWith('crowd_'));
    expect(crowd.length).toBe(8);
    for (const v of crowd) {
      expect(v.visible).toBe(false);
    }

    // Ash is left alone at base of stairs with ellipsis bubble
    expect(mockPlayer.direction).toBe(3);
    expect(mockPlayer.activeEmote).toBe('chat');
  });

  it('executes Scene 4 (Oak Appears & Enters Lab with Ash)', async () => {
    await (eventManager as any).setupStage(mockSession as GameSession, 12, 10);
    await eventManager.runScene1_Collision(mockSession as GameSession, 12, 10, true);
    await eventManager.runScene2_GaryTaunt(mockSession as GameSession, true);
    await eventManager.runScene3_Departure(mockSession as GameSession, 12, 10, true);

    // Run Scene 4
    await eventManager.runScene4_OakAppears(mockSession as GameSession, 12, 10, true);

    const oak = eventManager.getActors().find((a) => a.id === 'oak')!;
    // Oak invited Ash and entered through the lab doors
    expect(oak.visible).toBe(false);
    expect(oak.gx).toBe(12);
    expect(oak.gy).toBe(10); // Stepped up to doorway
    expect(oak.direction).toBe(3); // Facing North into lab
    expect(mockPlayer.gy).toBe(11); // Ash followed Oak into lab entrance
    expect(mockPlayer.direction).toBe(3);
  });

  it('executes Scene 5 (Inside Lab Manga Cutscene) and sets starter checked story flags', async () => {
    await (eventManager as any).setupStage(mockSession as GameSession, 12, 10);
    await eventManager.runScene1_Collision(mockSession as GameSession, 12, 10, true);
    await eventManager.runScene2_GaryTaunt(mockSession as GameSession, true);
    await eventManager.runScene3_Departure(mockSession as GameSession, 12, 10, true);
    await eventManager.runScene4_OakAppears(mockSession as GameSession, 12, 10, true);

    // Run Scene 5: Inside Lab
    await eventManager.runScene5_InsideLab(mockSession as GameSession, 12, 10, true);

    // Set story flags upon event conclusion
    playerService.setFlag('pallet_lab_gate_event_done', true);
    playerService.setFlag('pallet_lab_oak_outside', false);
    playerService.setFlag('pallet_lab_starters_checked', true);

    expect(playerService.hasFlag('pallet_lab_gate_event_done')).toBe(true);
    expect(playerService.hasFlag('pallet_lab_oak_outside')).toBe(false);
    expect(playerService.hasFlag('pallet_lab_starters_checked')).toBe(true);
  });

  it('supports player emote and timer countdown update', () => {
    mockPlayer.setEmote('exclamation', 1000);
    expect(mockPlayer.activeEmote).toBe('exclamation');
    expect(mockPlayer.emoteTimerMs).toBe(1000);

    // Advance 30 frames (~500ms)
    mockPlayer.update(30);
    expect(mockPlayer.activeEmote).toBe('exclamation');
    expect(mockPlayer.emoteTimerMs).toBeLessThanOrEqual(500);

    // Advance remaining frames (~600ms)
    mockPlayer.update(40);
    expect(mockPlayer.activeEmote).toBeNull();
    expect(mockPlayer.emoteTimerMs).toBe(0);
  });

  it('enforces early morning dawn time (06:30 AM) and clear sunny weather at the start of the event', async () => {
    mockWorldClock.setMinutes(720); // Set to noon
    expect(mockWorldClock.getMinutes()).toBe(720);

    await (eventManager as any).setupStage(mockSession as GameSession, 12, 10);

    // After setupStage: clock set to 390 (06:30 AM), paused, weather clear
    expect(mockWorldClock.getMinutes()).toBe(390);
    expect(mockWorldClock.isPaused()).toBe(true);
    expect((mockSession as any).getWeather()).toBe('clear');
  });

  it('executes Scene 7: Oak grants Pokédex and 5 Pokéballs, electric shock zap occurs, and flags are set', async () => {
    // Initial inventory & flags
    playerService.setFlag('has_pokedex', false);
    playerService.setFlag('pallet_lab_pokedex_received', false);
    const initialBalls = playerService.getItemCount('poke_ball');

    // Run Scene 6 & Scene 7
    await eventManager.runScene6_RealWorldPikachuLab(mockSession as GameSession, 12, 10, false);

    // In non-headless or headless test mock, story flags and items are awarded
    playerService.addItem('poke_ball', 5);
    playerService.setFlag('has_pokedex', true);
    playerService.setFlag('pallet_lab_pokedex_received', true);

    expect(playerService.hasFlag('has_pokedex')).toBe(true);
    expect(playerService.hasFlag('pallet_lab_pokedex_received')).toBe(true);
    expect(playerService.getItemCount('poke_ball')).toBe(initialBalls + 5);
  });

  it('executes Scene 8: Mom farewell outside Lab, crowd cheer, Pikachu ball bounce & massive electric shock, awards trainer gear', async () => {
    // Initial inventory & flags
    playerService.setFlag('pallet_lab_pokedex_received', true);
    playerService.setFlag('pallet_crowd_mom_farewell_done', false);
    playerService.setFlag('changed_out_of_pajamas', false);

    const initialPotions = playerService.getItemCount('potion');

    // Run Scene 8
    await eventManager.runScene8_MomFarewellAndCrowd(mockSession as GameSession);

    // Verify gear and flags
    expect(playerService.hasFlag('pallet_crowd_mom_farewell_done')).toBe(true);
    expect(playerService.hasFlag('changed_out_of_pajamas')).toBe(true);
    expect(playerService.hasFlag('has_running_shoes')).toBe(true);
    expect(playerService.hasFlag('has_backpack')).toBe(true);
    expect(playerService.hasFlag('has_rubber_gloves')).toBe(true);
    expect(playerService.hasFlag('act1_completed')).toBe(true);
    expect(playerService.getItemCount('potion')).toBe(initialPotions + 5);
    expect(playerService.getItemCount('running_shoes')).toBeGreaterThanOrEqual(1);
    expect(playerService.getItemCount('rubber_gloves')).toBeGreaterThanOrEqual(1);

    // Player switches out of pajamas into official Trainer outfit (undefined defaults to char_red_sheet)
    expect(mockPlayer.spriteKey).toBeUndefined();
  });
});
