/**
 * Pallet Town Prologue Event: Oak Lab Gate Encounter (Scenes 1 - 4)
 *
 * Implements the in-engine cutscene event when Ash in green pajamas (char_ash_pajamas)
 * runs to Professor Oak's Lab and collides with Rival Gary Oak:
 * - Scene 1: Collision knockback and exclamation
 * - Scene 2: Gary's taunt, flaunting starter Pokéball, cheer squad chanting
 * - Scene 3: Gary & cheer squad departing Pallet Town, leaving Ash in silence (...)
 * - Scene 4: Lab door opening, Professor Oak stepping out in surprise (?) and greeting Ash
 */

import type { Direction } from '@pokemon/shared-types';
import { TILE_SIZE } from '@pokemon/game-data';
import type { CutsceneActor, NPCEmoteType } from '../../../npc/npc-types';
import { battleSePlayer } from '../../../audio';
import { playerService, partyService, createPartyPokemon } from '../../../domain';
import type { GameSession } from '../../../game/game-session';
import { getStartVillageBuildings } from '../../../maps/terrain-field/start-village';
import { STARTER_LAB_ASSETS } from '../../../assets/asset-registry';
import { InteriorManager, type InteriorNPC } from '../../../interior';
import { triggerNPCEmote, createNPCRuntimeState } from '../../../npc/npc-behavior-controller';
import { showBerryToast } from '../../../ui/toast';
import type { StoryEventDefinition } from '../../types';
import { storyEventRegistry } from '../../core/story-event-registry';

export interface PalletPrologueOptions {
  doorGX?: number;
  doorGY?: number;
  skipDelays?: boolean;
}

export class PalletPrologueEventManager {
  private static instance: PalletPrologueEventManager | null = null;

  public isRunning = false;
  public currentScene = 0; // 0: None, 1: Collision, 2: Taunt, 3: Departure, 4: Oak Appears, 5: Inside Lab (Starter Machine), 6: Finished
  public actors: CutsceneActor[] = [];
  public dialogueBoxEl: HTMLDivElement | null = null;
  public mangaModalEl: HTMLDivElement | null = null;
  public starterMachineModalEl: HTMLDivElement | null = null;
  public shockModalEl: HTMLDivElement | null = null;
  private resolveActiveDialogue: (() => void) | null = null;
  private resolveActiveManga: (() => void) | null = null;
  private resolveActiveStarterMachine: (() => void) | null = null;
  private resolveActiveShockCutscene: (() => void) | null = null;

  public static getInstance(): PalletPrologueEventManager {
    if (!PalletPrologueEventManager.instance) {
      PalletPrologueEventManager.instance = new PalletPrologueEventManager();
    }
    return PalletPrologueEventManager.instance;
  }

  public getActors(): CutsceneActor[] {
    return this.actors;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public reset(): void {
    this.isRunning = false;
    this.currentScene = 0;
    this.actors = [];
    if (this.resolveActiveDialogue) {
      this.resolveActiveDialogue();
      this.resolveActiveDialogue = null;
    }
    if (this.resolveActiveManga) {
      this.resolveActiveManga();
      this.resolveActiveManga = null;
    }
    if (this.resolveActiveStarterMachine) {
      this.resolveActiveStarterMachine();
      this.resolveActiveStarterMachine = null;
    }
    if (this.resolveActiveShockCutscene) {
      this.resolveActiveShockCutscene();
      this.resolveActiveShockCutscene = null;
    }
    this.hideDialogueDom();
    this.hideMangaDom();
    this.hideStarterMachineDom();
    this.hideShockCutsceneDom();
  }

  /**
   * Checks if the event should trigger based on player position and story flags.
   */
  public shouldTrigger(session: GameSession): boolean {
    if (this.isRunning) return false;

    const lab = this.findOakLab(session);
    if (!lab) return false;

    const targetX = lab.doorGX;
    const triggerY = lab.doorGY + 3;

    // Check Scene 8: Mom farewell & Cheering Crowd outside Lab
    if (
      playerService.hasFlag('pallet_lab_pokedex_received') &&
      !playerService.hasFlag('pallet_crowd_mom_farewell_done')
    ) {
      const dx = Math.abs(session.player.gx - targetX);
      const dy = Math.abs(session.player.gy - triggerY);
      return dx <= 3 && dy <= 3;
    }

    if (playerService.hasFlag('pallet_lab_gate_event_done')) return false;

    // Trigger within 2 tiles horizontally and 2.5 tiles vertically of the approach steps
    const dx = Math.abs(session.player.gx - targetX);
    const dy = Math.abs(session.player.gy - triggerY);
    return dx <= 2 && dy <= 2.5;
  }

  /**
   * Finds the Oak Lab building placement in active chunks or town layout.
   */
  public findOakLab(session: GameSession): { doorGX: number; doorGY: number } | undefined {
    // 1. Try deterministic town layout buildings first
    if (session.seed !== undefined) {
      try {
        const villageBuildings = getStartVillageBuildings(session.seed);
        const lab = villageBuildings.find((b) => b.type === 'lab_okido' || b.id === 'start_lab');
        if (lab) {
          return { doorGX: lab.doorGX, doorGY: lab.doorGY };
        }
      } catch {
        // ignore if not yet generated
      }
    }

    // 2. Fallback to active chunk buildings
    if (session.chunkManager?.activeChunks) {
      for (const chunk of session.chunkManager.activeChunks) {
        if (!chunk.buildings) continue;
        for (const b of chunk.buildings) {
          if (b.type === 'lab_okido' || b.id === 'start_lab') {
            return { doorGX: b.doorGX, doorGY: b.doorGY };
          }
        }
      }
    }
    return undefined;
  }

  /**
   * Triggers the full 4-scene prologue sequence or Scene 8.
   */
  public async trigger(session: GameSession, options: PalletPrologueOptions = {}): Promise<boolean> {
    if (this.isRunning) return false;

    if (
      playerService.hasFlag('pallet_lab_pokedex_received') &&
      !playerService.hasFlag('pallet_crowd_mom_farewell_done')
    ) {
      await this.runScene8_MomFarewellAndCrowd(session);
      return true;
    }

    const lab = this.findOakLab(session);
    const doorGX = options.doorGX ?? lab?.doorGX ?? 12;
    const doorGY = options.doorGY ?? lab?.doorGY ?? 10;
    const skipDelays = options.skipDelays ?? false;

    this.isRunning = true;
    this.currentScene = 1;

    try {
      // 0. Setup stage and actors
      await this.setupStage(session, doorGX, doorGY);

      // Scene 1: Collision & Knockback
      await this.runScene1_Collision(session, doorGX, doorGY, skipDelays);

      // Scene 2: Gary's Taunt & Cheer Squad
      this.currentScene = 2;
      await this.runScene2_GaryTaunt(session, skipDelays);

      // Scene 3: The Departure
      this.currentScene = 3;
      await this.runScene3_Departure(session, doorGX, doorGY, skipDelays);

      // Scene 4: Professor Oak Appears
      this.currentScene = 4;
      await this.runScene4_OakAppears(session, doorGX, doorGY, skipDelays);

      // Scene 5: Inside Lab - 3 Empty Starter Pokéballs (Manga Cutscene)
      this.currentScene = 5;
      await this.runScene5_InsideLab(session, doorGX, doorGY, skipDelays);

      // Conclude Scenes 1 - 5
      playerService.setFlag('pallet_lab_gate_event_done', true);
      playerService.setFlag('pallet_lab_oak_outside', false);
      playerService.setFlag('pallet_lab_starters_checked', true);
      this.currentScene = 6;
      return true;
    } finally {
      this.isRunning = false;
      this.hideDialogueDom();
      this.hideMangaDom();
      this.hideStarterMachineDom();
      if (session.worldClock) {
        session.worldClock.resume('pallet_event');
      }
      if (typeof session.setWeatherOverride === 'function') {
        session.setWeatherOverride('clear'); // Duy trì thời tiết trong xanh nắng đẹp cho ngày đầu tiên tại Pallet Town
      }
    }
  }

  /**
   * Sets up player alignment and spawns Gary Oak, 3 cheerleaders, and crowd of villagers.
   */
  private async setupStage(session: GameSession, doorGX: number, doorGY: number): Promise<void> {
    // Enforce authentic early morning dawn weather: 06:30 AM, sunny clear skies
    if (session.worldClock) {
      session.worldClock.setMinutes(390); // 06:30 AM (Sáng sớm bình minh rạng rỡ)
      session.worldClock.pause('pallet_event');
    }
    if (typeof session.setWeatherOverride === 'function') {
      session.setWeatherOverride('clear'); // Sáng sớm trời trong xanh nắng đẹp
    }

    // Lock player input, equip green pajamas, and place at start of approach path
    session.player.isMoving = false;
    session.player.spriteKey = 'char_ash_pajamas';
    session.player.snapTo(doorGX, doorGY + 7, 3); // Facing North down the approach road
    session.camera?.snapTo(session.player);

    // 1. Cháu trai của Giáo Sư: Gary Oak (Rival Blue) at top of steps
    const gary: CutsceneActor = {
      id: 'gary',
      name: 'Gary Oak',
      spriteKey: 'char_rival_blue',
      gx: doorGX,
      gy: doorGY + 1,
      x: doorGX * TILE_SIZE - 16,
      y: (doorGY + 1) * TILE_SIZE - 32,
      direction: 0, // Facing South
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    // 2. Bộ 3 Cô Gái Cổ Vũ (Cheer Squad)
    const cheer1: CutsceneActor = {
      id: 'cheerleader_1',
      name: 'Cổ Động Viên 1',
      spriteKey: 'char_picnicker_f',
      gx: doorGX - 1,
      gy: doorGY + 2,
      x: (doorGX - 1) * TILE_SIZE - 16,
      y: (doorGY + 2) * TILE_SIZE - 32,
      direction: 2, // Facing East towards Gary/Ash
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const cheer2: CutsceneActor = {
      id: 'cheerleader_2',
      name: 'Cổ Động Viên 2',
      spriteKey: 'char_school_kid_f',
      gx: doorGX + 1,
      gy: doorGY + 2,
      x: (doorGX + 1) * TILE_SIZE - 16,
      y: (doorGY + 2) * TILE_SIZE - 32,
      direction: 1, // Facing West towards Gary/Ash
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const cheer3: CutsceneActor = {
      id: 'cheerleader_3',
      name: 'Cổ Động Viên 3',
      spriteKey: 'char_flower_girl',
      gx: doorGX + 1,
      gy: doorGY + 1,
      x: (doorGX + 1) * TILE_SIZE - 16,
      y: (doorGY + 1) * TILE_SIZE - 32,
      direction: 1, // Facing West towards Gary
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    // 3. Đoàn Người Dân Tụ Tập Đứng Hai Bên Đại Lộ (Crowd of Villagers)
    const crowdOldMan: CutsceneActor = {
      id: 'crowd_old_man',
      name: 'Cụ Ông',
      spriteKey: 'char_old_man',
      gx: doorGX - 2,
      gy: doorGY + 2,
      x: (doorGX - 2) * TILE_SIZE - 16,
      y: (doorGY + 2) * TILE_SIZE - 32,
      direction: 2, // Facing East
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const crowdFarmer: CutsceneActor = {
      id: 'crowd_farmer',
      name: 'Bác Nông Dân',
      spriteKey: 'char_farmer',
      gx: doorGX - 2,
      gy: doorGY + 3,
      x: (doorGX - 2) * TILE_SIZE - 16,
      y: (doorGY + 3) * TILE_SIZE - 32,
      direction: 2,
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const crowdTechGuy: CutsceneActor = {
      id: 'crowd_tech_guy',
      name: 'Bác Mê Công Nghệ',
      spriteKey: 'char_tech_guy',
      gx: doorGX - 2,
      gy: doorGY + 4,
      x: (doorGX - 2) * TILE_SIZE - 16,
      y: (doorGY + 4) * TILE_SIZE - 32,
      direction: 2,
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const crowdBugCatcher: CutsceneActor = {
      id: 'crowd_bug_catcher',
      name: 'Cậu Bé Bắt Bọ',
      spriteKey: 'char_bug_catcher',
      gx: doorGX - 2,
      gy: doorGY + 5,
      x: (doorGX - 2) * TILE_SIZE - 16,
      y: (doorGY + 5) * TILE_SIZE - 32,
      direction: 2,
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const crowdOldWoman: CutsceneActor = {
      id: 'crowd_old_woman',
      name: 'Cụ Bà',
      spriteKey: 'char_old_woman',
      gx: doorGX + 2,
      gy: doorGY + 2,
      x: (doorGX + 2) * TILE_SIZE - 16,
      y: (doorGY + 2) * TILE_SIZE - 32,
      direction: 1, // Facing West
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const crowdParasolLady: CutsceneActor = {
      id: 'crowd_parasol_lady',
      name: 'Quý Cô Che Ô',
      spriteKey: 'char_parasol_lady',
      gx: doorGX + 2,
      gy: doorGY + 3,
      x: (doorGX + 2) * TILE_SIZE - 16,
      y: (doorGY + 3) * TILE_SIZE - 32,
      direction: 1,
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const crowdSeaBoy: CutsceneActor = {
      id: 'crowd_sea_boy',
      name: 'Cậu Bé Làng',
      spriteKey: 'char_sea_boy',
      gx: doorGX + 2,
      gy: doorGY + 4,
      x: (doorGX + 2) * TILE_SIZE - 16,
      y: (doorGY + 4) * TILE_SIZE - 32,
      direction: 1,
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    const crowdCamper: CutsceneActor = {
      id: 'crowd_camper',
      name: 'Thanh Niên Cắm Trại',
      spriteKey: 'char_camper_m',
      gx: doorGX + 2,
      gy: doorGY + 5,
      x: (doorGX + 2) * TILE_SIZE - 16,
      y: (doorGY + 5) * TILE_SIZE - 32,
      direction: 1,
      frame: 0,
      visible: true,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    // 4. Giáo Sư Oak (bắt đầu ẩn trong Lab)
    const oak: CutsceneActor = {
      id: 'oak',
      name: 'Giáo Sư Oak',
      spriteKey: 'char_oak',
      gx: doorGX,
      gy: doorGY,
      x: doorGX * TILE_SIZE - 16,
      y: doorGY * TILE_SIZE - 32,
      direction: 0,
      frame: 0,
      visible: false,
      activeEmote: null,
      emoteTimerMs: 0,
    };

    this.actors = [
      gary,
      cheer1,
      cheer2,
      cheer3,
      crowdOldMan,
      crowdFarmer,
      crowdTechGuy,
      crowdBugCatcher,
      crowdOldWoman,
      crowdParasolLady,
      crowdSeaBoy,
      crowdCamper,
      oak,
    ];
  }

  /**
   * Scene 1: Collision & Knockback
   * Ash frantically runs from far down the road towards the lab steps,
   * colliding with Gary Oak as Gary descends the steps!
   */
  public async runScene1_Collision(
    session: GameSession,
    doorGX: number,
    doorGY: number,
    skipDelays = false
  ): Promise<void> {
    const gary = this.actors.find((a) => a.id === 'gary')!;
    const player = session.player;
    player.spriteKey = 'char_ash_pajamas';
    player.gx = doorGX;
    player.x = doorGX * TILE_SIZE - 16;
    const collideGY = doorGY + 2.3;

    if (!skipDelays) {
      // Ash sprints North from far down the village walkway (doorGY + 7) towards the steps
      const runStartGY = doorGY + 7;
      const runDuration = 850;
      const startTime = Date.now();

      player.direction = 3; // Facing North
      player.isMoving = true;
      let garyStarted = false;

      while (Date.now() - startTime < runDuration) {
        const p = Math.min(1, (Date.now() - startTime) / runDuration);
        player.gy = runStartGY - (runStartGY - collideGY) * p;
        player.x = doorGX * TILE_SIZE - 16;
        player.y = player.gy * TILE_SIZE - 32;

        // Fast run cycle
        const stepProgress = (p * 5) % 1;
        player.frame =
          stepProgress < 0.25 ? 1 : stepProgress < 0.5 ? 0 : stepProgress < 0.75 ? 3 : 0;

        // Camera tracks Ash running
        session.camera?.snapTo(player);

        // Gary steps down halfway through Ash's sprint
        if (p >= 0.45) {
          if (!garyStarted) garyStarted = true;
          const garyP = Math.min(1, (p - 0.45) / 0.45);
          gary.gy = doorGY + 1 + garyP;
          gary.y = gary.gy * TILE_SIZE - 32;
          const garyStep = (garyP * 2) % 1;
          gary.frame = garyStep < 0.25 ? 1 : garyStep < 0.5 ? 0 : garyStep < 0.75 ? 3 : 0;
        }

        await this.delay(16);
      }

      player.isMoving = false;
      player.frame = 0;
    } else {
      gary.gy = doorGY + 2;
      gary.y = gary.gy * TILE_SIZE - 32;
      player.gy = doorGY + 2.3;
      player.x = doorGX * TILE_SIZE - 16;
      player.y = player.gy * TILE_SIZE - 32;
    }

    // Impact! Bump Sound
    battleSePlayer.playSound('Audio/SE/Player bump.ogg', 0.85);

    // Knockback: Ash bounces south to (doorGY + 3), Gary bounces north to (doorGY + 1)
    if (!skipDelays) {
      const startMs = Date.now();
      const knockDuration = 160;
      while (Date.now() - startMs < knockDuration) {
        const progress = Math.min(1, (Date.now() - startMs) / knockDuration);
        gary.y = (doorGY + 2 - progress) * TILE_SIZE - 32;
        player.gy = collideGY + progress * 0.7;
        player.x = doorGX * TILE_SIZE - 16;
        player.y = player.gy * TILE_SIZE - 32;
        await this.delay(16);
      }
    }

    gary.gy = doorGY + 1;
    gary.y = gary.gy * TILE_SIZE - 32;
    gary.direction = 0;
    gary.frame = 0;

    player.snapTo(doorGX, doorGY + 3, 3);
    player.frame = 0;
    session.camera?.snapTo(player);

    // Emotion bubble '!' (exclamation) on both Gary and Ash
    gary.activeEmote = 'exclamation';
    gary.emoteTimerMs = 1500;
    player.setEmote('exclamation', 1500);

    // Nearby crowd members get startled
    const oldMan = this.actors.find((a) => a.id === 'crowd_old_man');
    if (oldMan) {
      oldMan.activeEmote = 'exclamation';
      oldMan.emoteTimerMs = 1200;
    }
    const oldWoman = this.actors.find((a) => a.id === 'crowd_old_woman');
    if (oldWoman) {
      oldWoman.activeEmote = 'question';
      oldWoman.emoteTimerMs = 1200;
    }

    battleSePlayer.playSound('Audio/SE/Exclaim.ogg', 0.85);

    if (!skipDelays) {
      await this.delay(900);
    }
  }

  /**
   * Scene 2: Gary's Taunt, 3 Cheerleaders & Gathering Crowd
   */
  public async runScene2_GaryTaunt(session: GameSession, skipDelays = false): Promise<void> {
    const gary = this.actors.find((a) => a.id === 'gary')!;
    const cheer1 = this.actors.find((a) => a.id === 'cheerleader_1')!;
    const cheer2 = this.actors.find((a) => a.id === 'cheerleader_2')!;
    const cheer3 = this.actors.find((a) => a.id === 'cheerleader_3')!;
    const crowd = this.actors.filter((a) => a.id.startsWith('crowd_'));
    const player = session.player;

    // Gary takes 1 confident step down to talk face-to-face
    if (!skipDelays) {
      await this.animateStepActor(gary, 0, 200);
    } else {
      gary.gy += 1;
      gary.y = gary.gy * TILE_SIZE - 32;
    }

    // Line 1: Gary mocks Ash's bumping
    await this.showDialogue('Gary', [
      'Này này, đi đứng kiểu gì đấy?!... Ô kìa, chẳng phải là Ash ngủ nướng sao?!',
    ]);

    // Line 2: Gary mocks the green pajamas
    gary.activeEmote = 'sparkle';
    gary.emoteTimerMs = 1500;
    await this.showDialogue('Gary', [
      'Cậu định mặc nguyên bộ đồ ngủ màu xanh lá này để đi bắt Pokémon đấy à? Buồn cười chết đi được!',
    ]);

    // Line 3: Ash protests angrily
    player.setEmote('sweat', 1800);
    await this.showDialogue('Ash', [
      'Gary! Cậu đừng có mà đắc ý! Tớ chỉ... lỡ ngủ quên một chút thôi!',
    ]);

    // Line 4: Gary flaunts his starter Pokéball
    battleSePlayer.playSound('Audio/SE/Select.ogg', 0.85);
    gary.activeEmote = 'sparkle';
    gary.emoteTimerMs = 1200;
    await this.showDialogue('Gary', [
      'Muộn một chút? Ha! Chậm một giây thôi cũng đủ để mất cơ hội rồi! Ta đã chọn được con Pokémon tuyệt vời nhất từ Giáo Sư Okido!',
    ]);

    // All 3 Cheerleaders jump with heart/music emotes
    cheer1.activeEmote = 'music';
    cheer1.emoteTimerMs = 1800;
    cheer2.activeEmote = 'heart';
    cheer2.emoteTimerMs = 1800;
    cheer3.activeEmote = 'music';
    cheer3.emoteTimerMs = 1800;
    cheer1.hopY = -6;
    cheer2.hopY = -6;
    cheer3.hopY = -6;

    // Crowd hops enthusiastically too
    for (const v of crowd) {
      v.hopY = -4;
      v.activeEmote = 'sparkle';
      v.emoteTimerMs = 1600;
    }

    // Line 5: 3 Cheerleaders chant
    await this.showDialogue('Đội Cổ Vũ (3 Cô Gái)', [
      'Gary! Gary! Anh là số một! Huấn luyện viên thiên tài của Thị trấn Masara! Vô địch Kanto! Cố lên anh Garyyy!',
    ]);
    cheer1.hopY = 0;
    cheer2.hopY = 0;
    cheer3.hopY = 0;
    for (const v of crowd) {
      v.hopY = 0;
    }

    // Line 6: Crowd of villagers applauds and cheers
    battleSePlayer.playSound('Audio/SE/Slots win.ogg', 0.75);
    await this.showDialogue('Đoàn Dân Làng Tụ Tập', [
      '[Toàn thể bà con thị trấn Pallet tụ tập reo hò, vỗ tay rộn rã chúc mừng Gary Oak lên đường trở thành nhà huấn luyện tài ba!]',
    ]);
  }

  /**
   * Scene 3: Gary & 3 Cheerleaders Departure
   */
  /**
   * Scene 3: Gary & 3 Cheerleaders Departure & Crowd Dispersal
   */
  public async runScene3_Departure(
    session: GameSession,
    doorGX: number,
    _doorGY: number,
    skipDelays = false
  ): Promise<void> {
    const gary = this.actors.find((a) => a.id === 'gary')!;
    const cheer1 = this.actors.find((a) => a.id === 'cheerleader_1')!;
    const cheer2 = this.actors.find((a) => a.id === 'cheerleader_2')!;
    const cheer3 = this.actors.find((a) => a.id === 'cheerleader_3')!;
    const crowd = this.actors.filter((a) => a.id.startsWith('crowd_'));
    const player = session.player;

    // Gary's parting remark
    await this.showDialogue('Gary', [
      'Chúc may mắn nhé Satoshi đồ ngủ! Cố mà nhặt nhạnh chút gì đó còn sót lại... nếu Giáo sư còn thừa thứ gì cho cậu! Tạm biệt bà con!',
    ]);

    // Gary and all 3 cheerleaders turn South and march in procession
    gary.direction = 0;
    cheer1.direction = 0;
    cheer2.direction = 0;
    cheer3.direction = 0;

    // Crowd turns to look towards the south parade
    for (const v of crowd) {
      v.direction = 0;
    }

    if (!skipDelays) {
      // 1. Gary and 3 cheerleaders march down past the player
      for (let step = 0; step < 5; step++) {
        await Promise.all([
          this.animateStepActor(gary, 0, 160),
          this.animateStepActor(cheer1, 0, 160),
          this.animateStepActor(cheer2, 0, 160),
          this.animateStepActor(cheer3, 0, 160),
        ]);
      }

      // 2. Crowd of villagers disperses outward and away
      const crowdSteps: Promise<void>[] = [];
      for (const v of crowd) {
        const isWest = v.gx < doorGX;
        const outDir: Direction = isWest ? 1 : 2; // West or East
        crowdSteps.push(
          (async () => {
            await this.animateStepActor(v, outDir, 180);
            await this.animateStepActor(v, 0, 180);
            await this.animateStepActor(v, outDir, 180);
          })()
        );
      }
      await Promise.all(crowdSteps);
    }

    // Hide all departed characters and dispersed crowd
    gary.visible = false;
    cheer1.visible = false;
    cheer2.visible = false;
    cheer3.visible = false;
    for (const v of crowd) {
      v.visible = false;
    }

    // Satoshi is left standing alone in the center of the walkway: silence & ellipsis emote (...)
    player.direction = 3; // Facing North towards lab
    player.setEmote('chat', 2000); // Ellipsis bubble

    if (!skipDelays) {
      await this.delay(1200);
    }
  }

  /**
   * Scene 4: Professor Oak Steps Out & Dialogue with Satoshi
   */
  public async runScene4_OakAppears(
    session: GameSession,
    _doorGX: number,
    doorGY: number,
    skipDelays = false
  ): Promise<void> {
    const oak = this.actors.find((a) => a.id === 'oak')!;
    const player = session.player;
    player.direction = 3; // Satoshi looks up at the lab doorway

    // 1. Lab door opens
    battleSePlayer.playSound('Audio/SE/Door enter.ogg', 0.85);
    if (!skipDelays) await this.delay(450);

    // 2. Oak steps out onto the threshold
    oak.visible = true;
    oak.direction = 0; // Facing South
    if (!skipDelays) {
      await this.animateStepActor(oak, 0, 220);
    } else {
      oak.gy = doorGY + 1;
      oak.y = oak.gy * TILE_SIZE - 32;
    }

    // Oak looks left and right, noticing crowd has dispersed
    if (!skipDelays) {
      oak.direction = 1; // Look West
      await this.delay(260);
      oak.direction = 2; // Look East
      await this.delay(260);
      oak.direction = 0; // Look South
      await this.delay(200);
    }

    // Oak spots Satoshi in pajamas! Surprise question bubble (?)
    oak.activeEmote = 'question';
    oak.emoteTimerMs = 1500;
    battleSePlayer.playSound('Audio/SE/Exclaim.ogg', 0.8);
    if (!skipDelays) await this.delay(650);

    // Oak walks down the steps to greet Satoshi
    if (!skipDelays) {
      await this.animateStepActor(oak, 0, 220);
    } else {
      oak.gy = doorGY + 2;
      oak.y = oak.gy * TILE_SIZE - 32;
    }

    // Dialogue with Professor Okido & Satoshi
    // Line 1: Giáo sư Okido
    await this.showDialogue('Giáo sư Okido', [
      'Không phải Satoshi sao?',
    ]);

    // Line 2: Satoshi
    player.setEmote('exclamation', 1500);
    await this.showDialogue('Satoshi', [
      'Giáo sư Okido, Pokemon của cháu đâu ạ?',
    ]);

    // Line 3: Giáo sư Okido
    oak.activeEmote = 'question';
    oak.emoteTimerMs = 1500;
    await this.showDialogue('Giáo sư Okido', [
      'Pokemon của cháu ư?',
    ]);

    // Line 4: Satoshi
    await this.showDialogue('Satoshi', [
      'Thì cháu nói rồi đấy, Pokemon của cháu.',
    ]);

    // Line 5: Giáo sư Okido
    oak.activeEmote = 'sweat';
    oak.emoteTimerMs = 1800;
    await this.showDialogue('Giáo sư Okido', [
      'Đúng vậy, ta nghe nói có bốn người sẽ đến. Nhưng cậu nhóc à, cháu định bắt đầu với bộ quần áo pijama đó sao?',
    ]);

    // Line 6: Satoshi
    player.setEmote('exclamation', 2000);
    await this.showDialogue('Satoshi', [
      'Pijama chỉ là một vấn đề nhỏ, cháu chỉ ngủ dậy muộn một chút thôi. Và đừng gọi cháu là nhóc nữa, cháu 10 tuổi rồi đấy! Vậy Pokemon của cháu đâu?',
    ]);

    // Line 7: Giáo sư Okido mời Satoshi vào phòng nghiên cứu
    await this.showDialogue('Giáo sư Okido', [
      'Được rồi, đi theo ta vào trong phòng nghiên cứu nào!',
    ]);

    // Cả hai cùng quay mặt hướng Bắc và bước vào phòng nghiên cứu
    oak.direction = 3;
    player.direction = 3;

    if (!skipDelays) {
      // Oak bước lên thềm cửa lab
      await this.animateStepActor(oak, 3, 200);
      await this.animateStepActor(oak, 3, 200);
      battleSePlayer.playSound('Audio/SE/Door enter.ogg', 0.85);
      oak.visible = false;
      await this.delay(200);

      // Satoshi bước theo sau vào cửa lab
      await this.animateStepPlayer(session.player, 3, 200);
      await this.animateStepPlayer(session.player, 3, 200);
      battleSePlayer.playSound('Audio/SE/Door enter.ogg', 0.85);
      await this.delay(400);
    } else {
      oak.gy = doorGY;
      oak.y = oak.gy * TILE_SIZE - 32;
      oak.visible = false;
      player.gy = doorGY + 1;
      player.y = player.gy * TILE_SIZE - 32;
    }
  }

  /**
   * Smoothly animates an actor taking 1 tile step in a given direction.
   */
  private async animateStepActor(
    actor: CutsceneActor,
    direction: Direction,
    durationMs = 200
  ): Promise<void> {
    actor.direction = direction;
    let dx = 0;
    let dy = 0;
    if (direction === 0) dy = 1;
    else if (direction === 1) dx = -1;
    else if (direction === 2) dx = 1;
    else if (direction === 3) dy = -1;

    const startX = actor.x;
    const startY = actor.y;
    const endX = (actor.gx + dx) * TILE_SIZE - 16;
    const endY = (actor.gy + dy) * TILE_SIZE - 32;
    const startTime = Date.now();

    while (Date.now() - startTime < durationMs) {
      const p = (Date.now() - startTime) / durationMs;
      actor.x = startX + (endX - startX) * p;
      actor.y = startY + (endY - startY) * p;
      // Walk frame cycle: 1 -> 0 -> 3 -> 0
      actor.frame = p < 0.25 ? 1 : p < 0.5 ? 0 : p < 0.75 ? 3 : 0;
      await this.delay(16);
    }

    actor.gx += dx;
    actor.gy += dy;
    actor.x = endX;
    actor.y = endY;
    actor.frame = 0;
  }

  /**
   * Smoothly animates the player taking 1 tile step in a given direction.
   */
  private async animateStepPlayer(
    player: GameSession['player'],
    direction: Direction,
    durationMs = 200
  ): Promise<void> {
    player.direction = direction;
    let dx = 0;
    let dy = 0;
    if (direction === 0) dy = 1;
    else if (direction === 1) dx = -1;
    else if (direction === 2) dx = 1;
    else if (direction === 3) dy = -1;

    const startX = player.x;
    const startY = player.y;
    const endX = (player.gx + dx) * TILE_SIZE - 16;
    const endY = (player.gy + dy) * TILE_SIZE - 32;
    const startTime = Date.now();
    player.isMoving = true;

    while (Date.now() - startTime < durationMs) {
      const p = (Date.now() - startTime) / durationMs;
      player.x = startX + (endX - startX) * p;
      player.y = startY + (endY - startY) * p;
      player.frame = p < 0.25 ? 1 : p < 0.5 ? 0 : p < 0.75 ? 3 : 0;
      await this.delay(16);
    }

    player.gx += dx;
    player.gy += dy;
    player.x = endX;
    player.y = endY;
    player.frame = 0;
    player.isMoving = false;
  }

  /**
   * Scene 5: Inside Professor Oak's Lab - Interactive Starter Machine & 3 Empty Pokéballs
   * Allows the player to freely click and open each of the 3 Pokéballs (Squirtle, Bulbasaur, Charmander),
   * revealing empty balls with character portraits (Satoshi & Professor Oak) on each line.
   */
  public async runScene5_InsideLab(
    session: GameSession,
    doorGX: number,
    doorGY: number,
    skipDelays = false
  ): Promise<void> {
    if (skipDelays || typeof document === 'undefined') {
      playerService.setFlag('received_starter_pikachu', true);
      playerService.setFlag('pallet_lab_starters_checked', true);
      return;
    }

    // Giai đoạn 1: Bệ máy 3 quả Pokéball rỗng trong Lab (Satoshi tự click mở)
    await this.showStarterMachineModal();

    // Giai đoạn 2: Tắt modal, quay lại phòng Lab trong Overworld (thế giới thật) để Pikachu xuất hiện
    await this.runScene6_RealWorldPikachuLab(session, doorGX, doorGY, skipDelays);
  }

  /**
   * Scene 6: Inside Real-World Oak Lab (Overworld Interior)
   * Turns off the 2D modal and returns to the real-world lab in the overworld:
   * Pikachu appears right in front of Satoshi & Professor Oak on the lab floor/table!
   * - Pikachu cry & exclamation emote
   * - Authentic retro dialogue between Pikachu, Oak & Satoshi
   * - Full-screen thunder shock zap shaking the screen
   * - Pikachu officially joins the party as follower Pokémon!
   */
  public async runScene6_RealWorldPikachuLab(
    session: GameSession,
    doorGX: number,
    doorGY: number,
    skipDelays = false
  ): Promise<void> {
    if (skipDelays || typeof document === 'undefined') {
      playerService.setFlag('received_starter_pikachu', true);
      playerService.setFlag('pallet_lab_starters_checked', true);
      return;
    }

    const interior = InteriorManager.getInstance();
    interior.playerSpriteKey = 'char_ash_pajamas';

    // 1. Tuyệt đối ẩn Follower trong suốt thời gian diễn ra sự kiện trong Lab
    if (session?.follower) {
      session.follower.visible = false;
    }

    // 2. Vào phòng Lab KHÔNG truyền follower để tránh follower tự động xuất hiện ở cửa
    interior.enterOakLab(
      {
        gx: doorGX,
        gy: doorGY + 1,
        direction: 0,
      },
      undefined
    );

    // 3. Trong lúc diễn ra sự kiện, ẩn TOÀN BỘ nhân viên / trợ lý nghiên cứu (cả lab_aide và lab_scientist)
    // đảm bảo không gian riêng tư đúng chuẩn nguyên tác anime chỉ có Giáo Sư Okido, Satoshi và Pikachu
    if (interior.currentRoom) {
      interior.currentRoom.npcs = interior.currentRoom.npcs.filter(
        (n) => n.id !== 'lab_aide' && n.id !== 'lab_scientist'
      );
      interior['npcStates']?.delete('lab_aide');
      interior['npcStates']?.delete('lab_scientist');
    }

    // 4. Định vị Satoshi đứng trước bàn nghiên cứu: gx: 7, gy: 8, mặt nhìn hướng Bắc (3)
    interior.snapPlayerTo(7, 8, 3);

    // 5. Định vị Giáo Sư Oak đứng đối diện Satoshi: gx: 7, gy: 5, mặt nhìn hướng Nam (0)
    const oakState = interior['npcStates']?.get('prof_oak');
    if (oakState) {
      oakState.gx = 7;
      oakState.gy = 5;
      oakState.x = 7 * TILE_SIZE;
      oakState.y = 5 * TILE_SIZE;
      oakState.direction = 0;
    }

    // 6. Tạo DUY NHẤT một NPC Pikachu xuất hiện trên bàn nghiên cứu giữa Satoshi và Giáo Sư Oak tại gx: 7, gy: 6
    const pikaNpc: InteriorNPC = {
      id: 'pikachu_starter',
      name: 'Pikachu',
      spriteKey: 'char_pikachu_overworld',
      gx: 7,
      gy: 6,
      direction: 0,
      dialogue: ['Pikachu.'],
      ySortOffset: 45, // Đảm bảo Pikachu hiển thị nổi bật trên mặt bàn nghiên cứu
    };

    if (interior.currentRoom) {
      if (!interior.currentRoom.npcs.some((n) => n.id === 'pikachu_starter')) {
        interior.currentRoom.npcs.push(pikaNpc);
      }
      interior['npcStates']?.set('pikachu_starter', createNPCRuntimeState(pikaNpc, TILE_SIZE));
    }

    // Hiệu ứng mở bóng xuất hiện Pikachu trong phòng Lab thế giới thật
    battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 0.9);
    await this.delay(350);
    // Tiếng kêu chính thức của Pikachu vang lên DUY NHẤT 1 lần khi Pikachu xuất hiện trên bàn
    battleSePlayer.playSound(STARTER_LAB_ASSETS.pikachuCry, 1.0);

    const pikaState = interior['npcStates']?.get('pikachu_starter');
    if (pikaState) {
      triggerNPCEmote(pikaState, 'music', 1200);
    }
    if (session?.player) {
      session.player.activeEmote = 'exclamation';
      session.player.emoteTimerMs = 1200;
    }
    await this.delay(650);

    const oakPortrait = STARTER_LAB_ASSETS.portraitOakLab;
    const ashReachPortrait = STARTER_LAB_ASSETS.portraitAshReachPikachu;
    const ashHugPortrait = STARTER_LAB_ASSETS.portraitAshHugPikachu;
    const ashEmptyPortrait = STARTER_LAB_ASSETS.portraitAshEmptyBall;

    // Line 1: Pikachu chào (không lặp lại tiếng kêu nữa, biểu cảm nốt nhạc đã kích hoạt)
    await this.showDialogue('Pikachu', ['Pikachu.']);

    // Line 2: Giáo sư Okido giới thiệu
    await this.showDialogue('Giáo sư Okido', ['Con Pokemon này gọi là Pikachu.'], oakPortrait);

    // Line 3: Satoshi mừng rỡ đưa hai tay đón Pikachu (hiển thị bên phải màn hình hướng về trung tâm)
    if (session?.player) {
      session.player.activeEmote = 'heart';
      session.player.emoteTimerMs = 1200;
    }
    await this.showDialogue('Satoshi', ['Dễ thương quá, nó là tuyệt nhất!'], ashReachPortrait, 'right');

    // Line 4: Giáo sư Okido hỏi lại
    if (oakState) triggerNPCEmote(oakState, 'question', 1000);
    await this.showDialogue('Giáo sư Okido', ['Thật ư?'], oakPortrait);

    // Line 5: Satoshi chào và bị giật điện khét lẹt ngay trong phòng lab thế giới thật!
    const canvasEl = document.querySelector('canvas') || document.body;
    const containerEl = document.querySelector('.canvas-container') || document.body;
    const bustWrapperEl = document.getElementById('palletPrologueBustWrapper');
    canvasEl.classList.add('canvas-zap-shake');
    containerEl.classList.add('lightning-zap');
    if (bustWrapperEl) bustWrapperEl.classList.add('zap-shake');
    battleSePlayer.playSound('Audio/SE/Anim/Thunder3.ogg', 1.0);

    if (session?.player) {
      session.player.activeEmote = 'exclamation';
      session.player.emoteTimerMs = 1500;
    }

    await this.showDialogue(
      'Satoshi',
      ['Rất vui được gặp cậu, Pikachu! (Bị giật điện) Gì đây?'],
      ashHugPortrait
    );

    canvasEl.classList.remove('canvas-zap-shake');
    containerEl.classList.remove('lightning-zap');
    if (bustWrapperEl) bustWrapperEl.classList.remove('zap-shake');

    // Line 6: Giáo sư Okido giải thích
    await this.showDialogue(
      'Giáo sư Okido',
      ['Nó là một Pokemon chuột điện. Nó cứ như vậy khi mà bị dọa bởi con người hay bị chạm vào.'],
      oakPortrait
    );

    // Line 7: Satoshi phản bác
    if (session?.player) {
      session.player.activeEmote = 'sweat';
      session.player.emoteTimerMs = 1500;
    }
    battleSePlayer.playSound('Audio/SE/Exclaim.ogg', 0.85);
    await this.showDialogue('Satoshi', ['Sao ông không bảo cháu trước?'], ashEmptyPortrait);

    // =========================================================================
    // CẢNH 7: TRAO TẶNG POKÉMON ZUKAN (POKÉDEX) & POKÉBALL & GIẬT ĐIỆN CẢ HAI
    // =========================================================================
    this.currentScene = 7;

    // Line 8: Giáo sư Okido trao tặng Pokédex và Pokéball
    await this.showDialogue(
      'Giáo sư Okido',
      ['Đúng nhỉ. Được rồi, cầm lấy những thứ này: một cái Pokemon Zukan và vài quả Pokemon.'],
      oakPortrait
    );

    // Trao tặng Pokédex & 5 Pokéball
    battleSePlayer.playSound('Audio/SE/Mining item get.ogg', 0.9);
    playerService.addItem('poke_ball', 5);
    playerService.setFlag('has_pokedex', true);
    playerService.setFlag('pallet_lab_pokedex_received', true);
    showBerryToast('Bạn nhận được POKÉMON ZUKAN & 5x POKÉ BALL từ Giáo Sư Okido!', '#3b82f6');

    // Line 9: Satoshi vui vẻ cảm ơn
    if (session?.player) {
      session.player.activeEmote = 'heart';
      session.player.emoteTimerMs = 1500;
    }
    await this.showDialogue('Satoshi', ['Cảm ơn ông rất nhiều!'], ashReachPortrait, 'right');

    // Line 10: CẢ HAI CÙNG BỊ GIẬT ĐIỆN TÉ KHÓI BỞI PIKACHU!
    if (session?.player) {
      session.player.activeEmote = 'exclamation';
      session.player.emoteTimerMs = 2500;
    }
    if (oakState) {
      triggerNPCEmote(oakState, 'exclamation', 2500);
    }

    // Line 11: HIỂN THỊ HÌNH ẢNH ANIME SATOSHI & GIÁO SƯ OKIDO BỊ PIKACHU GIẬT ĐIỆN TÉ KHÓI
    // Giáo sư Okido hốt hoảng kêu cho nó vào bóng trên nền hình ảnh giật điện kinh điển!
    await this.showShockCutscene(
      'Giáo sư Okido',
      ['Mau cho nó vào trong bóng đi!'],
      STARTER_LAB_ASSETS.cutsceneAshOakShocked
    );

    // Xóa NPC Pikachu trên bàn sau khi đối thoại kết thúc
    if (interior.currentRoom) {
      interior.currentRoom.npcs = interior.currentRoom.npcs.filter((n) => n.id !== 'pikachu_starter');
      interior['npcStates']?.delete('pikachu_starter');
    }

    // Cấp Pokémon Pikachu Lv 5 với Full 31 IVs vào Party
    const existingPikachu = partyService.getParty().find((p) => p.speciesKey.toUpperCase() === 'PIKACHU');
    if (!existingPikachu) {
      try {
        partyService.addPokemon(createPartyPokemon('PIKACHU', 5, { ivs: 'perfect' }));
      } catch {
        // ignore
      }
    } else {
      existingPikachu.ivs = { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 };
    }

    // CHỈ BÂY GIỜ Pikachu mới chính thức trở thành Follower Pokémon đi theo sau Satoshi!
    if (session?.follower) {
      session.follower.setPokemon('PIKACHU', false, 'Pikachu');
      session.follower.snapTo(7, 9, 3);
      session.follower.visible = true;
    }

    playerService.setFlag('received_starter_pikachu', true);
    playerService.setFlag('pallet_lab_starters_checked', true);
    playerService.setFlag('has_pokedex', true);
    playerService.setFlag('pallet_lab_pokedex_received', true);
  }

  /**
   * Scene 8: The farewell outside the Lab with Satoshi's Mom (Delia Ketchum) and the cheering crowd of Pallet Town.
   * Delia hands over the backpack, clothes, running shoes, rubber gloves.
   * Satoshi attempts to return Pikachu to Pokéball, Pikachu bats it away with its tail.
   * Delia calls Pikachu weird, Pikachu furiously shocks everyone with an epic lightning burst.
   * Oak advises wearing rubber gloves, Delia's parting words to wear pajamas to bed.
   * Satoshi equips his official Pokémon Trainer outfit.
   */
  public async runScene8_MomFarewellAndCrowd(session: GameSession): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.currentScene = 8;
    session.player.isMoving = false;

    const interior = InteriorManager.getInstance();
    const lab = this.findOakLab(session);
    const labDoorX = lab?.doorGX ?? 12;
    const labDoorY = lab?.doorGY ?? 10;

    // If currently inside Lab, exit to Overworld
    if (interior.isInInterior()) {
      interior.exitCurrentRoom();
    }

    session.player.snapTo(labDoorX, labDoorY + 2);
    session.player.direction = 0; // Facing south
    session.player.spriteKey = 'char_ash_pajamas';

    // Hide Follower during cutscene actor representation
    if (session.follower) {
      session.follower.visible = false;
    }
    session.camera?.snapTo(session.player);

    const makeActor = (
      id: string,
      name: string,
      spriteKey: string,
      gx: number,
      gy: number,
      direction: Direction,
      activeEmote: NPCEmoteType | null = null,
      emoteTimerMs = 0
    ): CutsceneActor => ({
      id,
      name,
      spriteKey,
      gx,
      gy,
      x: gx * TILE_SIZE - 16,
      y: gy * TILE_SIZE - 32,
      direction,
      frame: 0,
      visible: true,
      activeEmote,
      emoteTimerMs,
    });

    // Spawn Crowd Actors outside
    this.actors = [
      // Pikachu beside Satoshi
      makeActor('pikachu_starter_outside', 'Pikachu', 'char_pikachu_overworld', labDoorX - 1, labDoorY + 2, 0),
      // Delia (Mom)
      makeActor('delia_mom', 'Mẹ của Satoshi', 'char_mom', labDoorX, labDoorY + 4, 3, 'heart', 3000),
      // Prof Oak
      makeActor('prof_oak_outside', 'Giáo Sư Oak', 'char_oak', labDoorX + 1, labDoorY + 3, 1, 'sparkle', 2500),
      // Cheering villagers
      makeActor('crowd_girl_1', 'Cổ Động Viên 1', 'char_flower_girl', labDoorX - 2, labDoorY + 3, 2, 'sparkle', 3000),
      makeActor('crowd_girl_2', 'Cổ Động Viên 2', 'char_picnicker_f', labDoorX + 2, labDoorY + 3, 1, 'music', 3000),
      makeActor('crowd_boy_1', 'Dân Làng 1', 'char_school_kid_f', labDoorX - 2, labDoorY + 4, 2, 'heart', 3000),
      makeActor('crowd_boy_2', 'Dân Làng 2', 'char_sea_boy', labDoorX + 2, labDoorY + 4, 1, 'music', 3000),
      makeActor('crowd_villager_3', 'Bà Cụ', 'char_old_woman', labDoorX - 1, labDoorY + 5, 3, 'sparkle', 3000),
      makeActor('crowd_villager_4', 'Bác Nông Dân', 'char_farmer', labDoorX + 1, labDoorY + 5, 3, 'heart', 3000),
    ];

    const deliaTalkPortrait = STARTER_LAB_ASSETS.portraitDeliaTalk;
    const deliaBackpackPortrait = STARTER_LAB_ASSETS.portraitDeliaGiveBackpack;
    const oakPortrait = STARTER_LAB_ASSETS.portraitOakLab;
    const ashPortrait = STARTER_LAB_ASSETS.portraitAshReachPikachu;

    // Line 1: Đám đông & Mẹ của Satoshi
    await this.showDialogue(
      'Đám đông & Mẹ của Satoshi',
      ['Cố lên Satoshi! Cố lên mà Satoshi!'],
      deliaTalkPortrait,
      'left'
    );

    // Line 2: Satoshi
    session.player.activeEmote = 'exclamation';
    session.player.emoteTimerMs = 1500;
    await this.showDialogue(
      'Satoshi',
      ['Mẹ?'],
      ashPortrait,
      'right'
    );

    // Line 3: Mẹ của Satoshi
    await this.showDialogue(
      'Mẹ của Satoshi',
      ['Đến muộn là không tốt chút nào. Nhưng dù sao con cũng hiểu rồi ạ, con còn phải tiếp tục hành trình, và đến cuối cùng con phải rời xa mẹ.'],
      deliaTalkPortrait,
      'left'
    );

    // Line 4: Pikachu
    const pikaActor = this.actors.find((a) => a.id === 'pikachu_starter_outside');
    if (pikaActor) {
      pikaActor.activeEmote = 'question';
      pikaActor.emoteTimerMs = 1800;
    }
    battleSePlayer.playSound('Audio/SE/pikachu.mp3', 0.95);
    await this.showDialogue(
      'Pikachu',
      ['Pikachu?']
    );

    // Line 5: Mẹ của Satoshi trao đồ (dùng hình mẹ cầm balo du hành đưa đồ)
    battleSePlayer.playSound('Audio/SE/Item get.ogg', 0.9);
    playerService.addItem('running_shoes', 1);
    playerService.addItem('rubber_gloves', 1);
    playerService.addItem('potion', 5);
    playerService.setFlag('has_running_shoes', true);
    playerService.setFlag('has_backpack', true);
    playerService.setFlag('has_rubber_gloves', true);
    showBerryToast('Mẹ đã trao cho bạn: Balo du hành, Giày chạy bộ, Trang phục HLV & Găng tay cao su!', '#10b981');

    await this.showDialogue(
      'Mẹ của Satoshi',
      ['Đây là giày, quần áo, áo, quần lót, đồ ăn, găng tay cao su để lau rửa, dây phơi để hong khô quần áo. Đó là tất cả những gì mẹ phải làm rồi.'],
      deliaBackpackPortrait,
      'left'
    );

    // Line 6: Satoshi
    session.player.activeEmote = 'happy';
    session.player.emoteTimerMs = 1800;
    await this.showDialogue(
      'Satoshi',
      ['Đừng làm quá lên thế. Con sẽ trở thành nhà huấn luyện Pokemon khủng nhất, sau đó sẽ quay lại thị trấn này.'],
      ashPortrait,
      'right'
    );

    // Line 7: Mẹ của Satoshi
    await this.showDialogue(
      'Mẹ của Satoshi',
      ['Đúng thế. Con Pokemon đó là...'],
      deliaTalkPortrait,
      'left'
    );

    // Line 8: Pikachu
    if (pikaActor) {
      pikaActor.activeEmote = 'happy';
      pikaActor.emoteTimerMs = 1500;
    }
    battleSePlayer.playSound('Audio/SE/pikachu.mp3', 0.95);
    await this.showDialogue(
      'Pikachu',
      ['Pikachu.']
    );

    // Line 9: Satoshi
    session.player.activeEmote = 'sparkle';
    session.player.emoteTimerMs = 1800;
    await this.showDialogue(
      'Satoshi',
      ['Đó là Pokemon của con. Với Pikachu, con sẽ bắt tất cả Pokemon trên thế giới!'],
      ashPortrait,
      'right'
    );

    // Line 10: Mẹ của Satoshi
    const deliaActor = this.actors.find((a) => a.id === 'delia_mom');
    if (deliaActor) {
      deliaActor.activeEmote = 'question';
      deliaActor.emoteTimerMs = 1500;
    }
    await this.showDialogue(
      'Mẹ của Satoshi',
      ['Pokemon thường ở trong bóng mà phải không? Sao nó lại không như thế?'],
      deliaTalkPortrait,
      'left'
    );

    // Line 11: Satoshi ném bóng - Pikachu đánh trả lại!
    await this.showDialogue(
      'Satoshi',
      ['Đúng vậy. Pikachu, vào đi!'],
      ashPortrait,
      'right'
    );

    // Action: Ném bóng & Pikachu quất đuôi đánh trả bóng
    battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 0.85);
    await this.delay(350);
    battleSePlayer.playSound('Audio/SE/Player bump.ogg', 0.9);
    session.player.activeEmote = 'sweat';
    session.player.emoteTimerMs = 2000;
    if (pikaActor) {
      pikaActor.activeEmote = 'angry';
      pikaActor.emoteTimerMs = 2000;
    }

    // Line 12: Mẹ của Satoshi
    if (deliaActor) {
      deliaActor.activeEmote = 'heart';
      deliaActor.emoteTimerMs = 1800;
    }
    await this.showDialogue(
      'Mẹ của Satoshi',
      ['Nó đang chơi ném bóng, thật dễ thương!'],
      deliaTalkPortrait,
      'left'
    );

    // Line 13: Satoshi
    await this.showDialogue(
      'Satoshi',
      ['Vậy à?'],
      ashPortrait,
      'right'
    );

    // Line 14: Mẹ của Satoshi
    await this.showDialogue(
      'Mẹ của Satoshi',
      ['Pikachu và con là bạn phải không? Nhưng mà... nó là một Pokemon kỳ cục.'],
      deliaTalkPortrait,
      'left'
    );

    // Line 15: Satoshi
    session.player.activeEmote = 'question';
    session.player.emoteTimerMs = 1500;
    await this.showDialogue(
      'Satoshi',
      ['Kỳ cục à?'],
      ashPortrait,
      'right'
    );

    // Line 16: PIKACHU PHÓNG ĐIỆN VÀO TẤT CẢ MỌI NGƯỜI TRỰC TIẾP TRÊN OVERWORLD!
    if (pikaActor) {
      pikaActor.activeEmote = 'angry';
      pikaActor.emoteTimerMs = 1500;
    }
    battleSePlayer.playSound('Audio/SE/pikachu.mp3', 1.0);
    await this.delay(300);

    // Bão điện Overworld: Sấm sét rền vang, màn hình rung lắc và chớp điện
    const canvasEl = (typeof document !== 'undefined' ? document.querySelector('canvas') : null) || (typeof document !== 'undefined' ? document.body : null);
    const containerEl = (typeof document !== 'undefined' ? document.querySelector('.canvas-container') : null) || (typeof document !== 'undefined' ? document.body : null);
    if (canvasEl) canvasEl.classList.add('canvas-zap-shake');
    if (containerEl) containerEl.classList.add('lightning-zap');
    battleSePlayer.playSound('Audio/SE/Thunder3.ogg', 1.0);

    // Tất cả nhân vật trên Overworld cùng giật nảy và hiển thị biểu cảm giật mình
    if (session?.player) {
      session.player.activeEmote = 'exclamation';
      session.player.emoteTimerMs = 2500;
    }
    for (const actor of this.actors) {
      actor.activeEmote = 'exclamation';
      actor.emoteTimerMs = 2500;
    }

    // Hiệu ứng giật nảy liên hồi (jumpY / hopY) trên Overworld trong 1.5 giây
    const shockStart = Date.now();
    await new Promise<void>((resolve) => {
      const shockInterval = setInterval(() => {
        const elapsed = Date.now() - shockStart;
        if (elapsed >= 1500) {
          clearInterval(shockInterval);
          if (session?.player) session.player.jumpY = 0;
          for (const a of this.actors) {
            a.hopY = 0;
          }
          resolve();
          return;
        }
        const hop = Math.sin(elapsed * 0.04) > 0 ? -5 : 5;
        if (session?.player) session.player.jumpY = hop;
        for (const a of this.actors) {
          if (a.id !== 'pikachu_starter_outside') {
            a.hopY = hop;
          }
        }
      }, 35);
    });

    if (canvasEl) canvasEl.classList.remove('canvas-zap-shake');
    if (containerEl) containerEl.classList.remove('lightning-zap');

    // Sau khi dứt giật điện, mọi người kiệt sức toát mồ hôi bốc khói, riêng Pikachu tươi cười hả hê
    if (session?.player) {
      session.player.activeEmote = 'sweat';
      session.player.emoteTimerMs = 3500;
    }
    for (const actor of this.actors) {
      if (actor.id === 'pikachu_starter_outside') {
        actor.activeEmote = 'happy';
        actor.emoteTimerMs = 2500;
      } else {
        actor.activeEmote = 'sweat';
        actor.emoteTimerMs = 3500;
      }
    }

    // Line 16: Giáo sư Okido toát mồ hôi khuyên đeo găng tay (đối thoại trực tiếp trên Overworld)
    await this.showDialogue(
      'Giáo sư Okido',
      ['Đeo găng tay cao su vào là một ý kiến hay đấy!'],
      oakPortrait,
      'left'
    );

    // Line 17: Satoshi
    await this.showDialogue(
      'Satoshi',
      ['Tại sao?'],
      ashPortrait,
      'right'
    );

    // Line 18: Giáo sư Okido
    await this.showDialogue(
      'Giáo sư Okido',
      ['Cao su cách điện mà!'],
      oakPortrait,
      'left'
    );

    // Line 19: Satoshi
    await this.showDialogue(
      'Satoshi',
      ['Vậy hả?'],
      ashPortrait,
      'right'
    );

    // Line 20: Mẹ của Satoshi
    if (deliaActor) {
      deliaActor.activeEmote = 'sweat';
      deliaActor.emoteTimerMs = 3000;
    }
    await this.showDialogue(
      'Mẹ của Satoshi',
      ['Khi nào đi ngủ, con phải nhớ mặc pijama đấy...'],
      deliaTalkPortrait,
      'left'
    );

    // KẾT THÚC CẢNH 8:
    // Satoshi chính thức thay sang trang phục Huấn luyện viên chính thức (áo vest lam, nón đỏ)
    session.player.spriteKey = undefined; // defaults to char_red_sheet in character-renderer
    interior.playerSpriteKey = undefined;

    // Kích hoạt Follower Pikachu đi sau Satoshi
    if (session.follower) {
      session.follower.setPokemon('PIKACHU', false, 'Pikachu');
      session.follower.snapTo(session.player.gx, session.player.gy - 1);
      session.follower.visible = true;
    }

    // Dọn dẹp diễn viên đám đông
    this.actors = [];
    this.isRunning = false;

    // Ghi nhận cờ tiến trình
    playerService.setFlag('pallet_crowd_mom_farewell_done', true);
    playerService.setFlag('changed_out_of_pajamas', true);
    playerService.setFlag('pallet_lab_gate_event_done', true);
    playerService.setFlag('act1_completed', true);
    playerService.setFlag('story_wild_spawns_suppressed', true);

    showBerryToast('Bạn đã khoác lên Trang Phục Huấn Luyện Viên chính thức!', '#f59e0b');
  }

  /**
   * Updates actor emote timers and idle frames each frame.
   */
  public update(dtScale: number): void {
    const dtMs = (1000 / 60) * dtScale;
    for (const actor of this.actors) {
      if (actor.emoteTimerMs && actor.emoteTimerMs > 0) {
        actor.emoteTimerMs = Math.max(0, actor.emoteTimerMs - dtMs);
        if (actor.emoteTimerMs === 0) {
          actor.activeEmote = null;
        }
      }
    }
  }

  /**
   * Displays GBA typewriter dialogue and returns a Promise that resolves when lines are advanced.
   */
  public showDialogue(
    speaker: string,
    lines: string[],
    portraitSrc?: string,
    position: 'left' | 'right' = 'left'
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof document === 'undefined') {
        // In headless Node.js tests, resolve immediately
        resolve();
        return;
      }

      this.initDialogueDom();
      if (!this.dialogueBoxEl) {
        resolve();
        return;
      }

      const speakerEl = this.dialogueBoxEl.querySelector<HTMLElement>('#palletCutsceneSpeaker');
      const contentEl = this.dialogueBoxEl.querySelector<HTMLElement>('#palletCutsceneContent');
      const footerEl = this.dialogueBoxEl.querySelector<HTMLElement>('#palletCutsceneFooter');
      const bustWrapperEl = document.getElementById('palletPrologueBustWrapper');
      const bustImgEl = document.getElementById('palletPrologueBustImg') as HTMLImageElement | null;

      if (bustWrapperEl && bustImgEl) {
        if (portraitSrc) {
          bustImgEl.src = portraitSrc;
          if (position === 'right') {
            bustWrapperEl.classList.add('bust-align-right');
          } else {
            bustWrapperEl.classList.remove('bust-align-right');
          }
          bustWrapperEl.style.display = 'flex';
        } else {
          bustWrapperEl.style.display = 'none';
          bustWrapperEl.classList.remove('bust-align-right');
        }
      }

      if (speakerEl) speakerEl.textContent = speaker;
      if (footerEl) footerEl.textContent = '▼ [Space]';

      let lineIndex = 0;
      const renderCurrentLine = () => {
        if (contentEl) {
          contentEl.textContent = lines[lineIndex] ?? '';
        }
      };

      renderCurrentLine();
      this.dialogueBoxEl.style.display = 'block';

      const advance = () => {
        lineIndex++;
        if (lineIndex < lines.length) {
          renderCurrentLine();
        } else {
          window.removeEventListener('keydown', keyHandler);
          if (this.dialogueBoxEl) {
            this.dialogueBoxEl.removeEventListener('click', clickHandler);
            this.dialogueBoxEl.style.display = 'none';
          }
          if (bustWrapperEl) {
            bustWrapperEl.style.display = 'none';
            bustWrapperEl.classList.remove('zap-shake');
          }
          this.resolveActiveDialogue = null;
          resolve();
        }
      };

      const keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          e.preventDefault();
          advance();
        }
      };

      const clickHandler = () => {
        advance();
      };

      this.resolveActiveDialogue = () => {
        window.removeEventListener('keydown', keyHandler);
        if (this.dialogueBoxEl) {
          this.dialogueBoxEl.removeEventListener('click', clickHandler);
          this.dialogueBoxEl.style.display = 'none';
        }
        if (bustWrapperEl) {
          bustWrapperEl.style.display = 'none';
          bustWrapperEl.classList.remove('zap-shake');
        }
        resolve();
      };

      window.addEventListener('keydown', keyHandler);
      this.dialogueBoxEl.addEventListener('click', clickHandler);
    });
  }

  private initDialogueDom(): void {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('palletPrologueDialogueBox') as HTMLDivElement | null;
    if (existing) {
      this.dialogueBoxEl = existing;
      return;
    }

    const bustWrapper = document.createElement('div');
    bustWrapper.id = 'palletPrologueBustWrapper';
    bustWrapper.className = 'starter-char-bust-wrapper pallet-prologue-bust-wrapper';
    bustWrapper.style.display = 'none';
    bustWrapper.innerHTML = `
      <img id="palletPrologueBustImg" class="starter-char-bust-img" src="" alt="Character Bust" />
    `;
    document.body.appendChild(bustWrapper);

    const box = document.createElement('div');
    box.id = 'palletPrologueDialogueBox';
    box.className = 'interior-dialogue-box';
    box.style.display = 'none';
    box.innerHTML = `
      <div class="interior-dialogue-speaker" id="palletCutsceneSpeaker"></div>
      <div class="interior-dialogue-content" id="palletCutsceneContent"></div>
      <div class="interior-dialogue-footer" id="palletCutsceneFooter">▼ [Space]</div>
    `;
    document.body.appendChild(box);
    this.dialogueBoxEl = box;
  }

  private hideDialogueDom(): void {
    if (typeof document === 'undefined') return;
    if (this.dialogueBoxEl) {
      this.dialogueBoxEl.style.display = 'none';
    }
    const bustWrapperEl = document.getElementById('palletPrologueBustWrapper');
    if (bustWrapperEl) {
      bustWrapperEl.style.display = 'none';
      bustWrapperEl.classList.remove('zap-shake');
      bustWrapperEl.classList.remove('bust-align-right');
    }
  }

  /**
   * Displays an interactive manga cutscene page with dialogue and SFX.
   */
  public showMangaPage(page: {
    badge: string;
    imageSrc: string;
    lines: Array<{ speaker: string; text: string; sfx?: string }>;
  }): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      this.initMangaDom();
      if (!this.mangaModalEl) {
        resolve();
        return;
      }

      const badgeEl = this.mangaModalEl.querySelector<HTMLElement>('#palletMangaBadge');
      const imgEl = this.mangaModalEl.querySelector<HTMLImageElement>('#palletMangaImg');
      const speakerEl = this.mangaModalEl.querySelector<HTMLElement>('#palletMangaSpeaker');
      const contentEl = this.mangaModalEl.querySelector<HTMLElement>('#palletMangaContent');
      const footerEl = this.mangaModalEl.querySelector<HTMLElement>('#palletMangaFooter');

      if (badgeEl) badgeEl.textContent = page.badge;
      if (imgEl) imgEl.src = page.imageSrc;
      if (footerEl) footerEl.textContent = '[Space tiếp tục]';

      let lineIndex = 0;
      const playSfxForLine = (idx: number) => {
        const item = page.lines[idx];
        if (item?.sfx) {
          battleSePlayer.playSound(item.sfx, 0.85);
        }
      };

      const renderLine = () => {
        const current = page.lines[lineIndex];
        if (!current) return;
        if (speakerEl) speakerEl.textContent = current.speaker;
        if (contentEl) contentEl.textContent = current.text;
        playSfxForLine(lineIndex);
      };

      renderLine();
      this.mangaModalEl.style.display = 'flex';

      const advance = () => {
        lineIndex++;
        if (lineIndex < page.lines.length) {
          renderLine();
        } else {
          cleanup();
          resolve();
        }
      };

      const keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          e.preventDefault();
          advance();
        }
      };

      const clickHandler = () => {
        advance();
      };

      const cleanup = () => {
        window.removeEventListener('keydown', keyHandler);
        if (this.mangaModalEl) {
          this.mangaModalEl.removeEventListener('click', clickHandler);
          this.mangaModalEl.style.display = 'none';
        }
        this.resolveActiveManga = null;
      };

      this.resolveActiveManga = () => {
        cleanup();
        resolve();
      };

      window.addEventListener('keydown', keyHandler);
      this.mangaModalEl.addEventListener('click', clickHandler);
    });
  }

  private initMangaDom(): void {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('palletMangaModal') as HTMLDivElement | null;
    if (existing) {
      this.mangaModalEl = existing;
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'palletMangaModal';
    modal.className = 'pallet-manga-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="pallet-manga-content-wrap">
        <div class="pallet-manga-header">
          <span class="pallet-manga-badge" id="palletMangaBadge">Trang Truyện</span>
          <span style="font-size: 16px; color: #94a3b8; font-family: 'VT323', monospace;">Nhấn Space / Enter / Click để tiếp tục</span>
        </div>
        <div class="pallet-manga-img-box">
          <img id="palletMangaImg" class="pallet-manga-img" src="" alt="Manga Cutscene" />
        </div>
        <div id="palletMangaDialogueBox" class="interior-dialogue-box pallet-manga-dialogue-box">
          <div class="interior-dialogue-speaker" id="palletMangaSpeaker"></div>
          <div class="interior-dialogue-content" id="palletMangaContent"></div>
          <div class="interior-dialogue-footer" id="palletMangaFooter">▼ [Space]</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.mangaModalEl = modal;
  }

  private hideMangaDom(): void {
    if (this.mangaModalEl) {
      this.mangaModalEl.style.display = 'none';
    }
  }

  /**
   * Displays the interactive Lab Starter Machine with 3 clickable Pokéballs.
   * Player can freely click any of the 3 balls to open them, triggering
   * character portrait dialogue with Satoshi & Professor Oak for each empty ball.
   */
  public showStarterMachineModal(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      this.initStarterMachineDom();
      if (!this.starterMachineModalEl) {
        resolve();
        return;
      }

      const closedImg = STARTER_LAB_ASSETS.pokeballClosed;
      const openedImg = STARTER_LAB_ASSETS.pokeballOpenedEmpty;
      const oakPortrait = STARTER_LAB_ASSETS.portraitOakLab;
      const ashPortrait = STARTER_LAB_ASSETS.portraitAshEmptyBall;

      const balls: Array<{
        id: 'squirtle' | 'bulbasaur' | 'charmander';
        name: string;
        jpName: string;
        type: string;
        typeColor: string;
        opened: boolean;
        ashLine: string;
        oakLine: string;
      }> = [
        {
          id: 'squirtle',
          name: 'Zenigame',
          jpName: 'ゼニガメ',
          type: 'Hệ Nước',
          typeColor: '#38bdf8',
          opened: false,
          ashLine: 'Cháu đã suy nghĩ hồi lâu rồi và cháu quyết định: Zenigame, tớ chọn cậu! (Quả cầu rỗng) Cái gì?',
          oakLine: 'Cháu đến muộn quá, con đó được chọn đi rồi.',
        },
        {
          id: 'bulbasaur',
          name: 'Fushigidane',
          jpName: 'フシギダネ',
          type: 'Hệ Cỏ/Độc',
          typeColor: '#4ade80',
          opened: false,
          ashLine: 'Thật tồi tệ khi cháu đến muộn. Được rồi, Fushigidane, cậu là của tớ! (Quả cầu rỗng)',
          oakLine: 'Nếu cháu đến đúng giờ, cháu có thể nhận được nó rồi.',
        },
        {
          id: 'charmander',
          name: 'Hitokage',
          jpName: 'ヒトカゲ',
          type: 'Hệ Lửa',
          typeColor: '#f87171',
          opened: false,
          ashLine: 'Được rồi, vậy cháu lấy Hitokage, tớ chọn cậu! (Quả cầu rỗng)',
          oakLine: 'Tất cả Pokemon đều được lấy trước rồi, và cháu đã có thể có một con nếu đến sớm.',
        },
      ];

      const stageEl = this.starterMachineModalEl.querySelector<HTMLElement>('#starterMachineStage');
      const bustWrapperEl = this.starterMachineModalEl.querySelector<HTMLElement>('#starterCharBustWrapper');
      const bustImgEl = this.starterMachineModalEl.querySelector<HTMLImageElement>('#starterCharBustImg');
      const dialogueBoxEl = this.starterMachineModalEl.querySelector<HTMLElement>('#starterPortraitDialogue');
      const speakerEl = this.starterMachineModalEl.querySelector<HTMLElement>('#starterSpeaker');
      const contentEl = this.starterMachineModalEl.querySelector<HTMLElement>('#starterContent');
      const footerEl = this.starterMachineModalEl.querySelector<HTMLElement>('#starterFooter');

      if (!stageEl || !bustWrapperEl || !bustImgEl || !dialogueBoxEl || !speakerEl || !contentEl || !footerEl) {
        resolve();
        return;
      }

      dialogueBoxEl.style.display = 'none';
      bustWrapperEl.style.display = 'none';

      let isDialogueActive = false;
      let activeAdvance: (() => void) | null = null;

      const renderStage = () => {
        stageEl.innerHTML = '';
        balls.forEach((ball) => {
          const slot = document.createElement('div');
          slot.className = `starter-ball-slot ${ball.opened ? 'opened' : ''}`;
          slot.innerHTML = `
            <div class="starter-ball-name" style="color: ${ball.typeColor}">${ball.name}</div>
            <span class="starter-ball-type-badge" style="background: ${ball.typeColor}22; border: 1px solid ${ball.typeColor}; color: ${ball.typeColor}">${ball.type}</span>
            <div class="starter-ball-pod">
              <img class="starter-ball-img" src="${ball.opened ? openedImg : closedImg}" alt="${ball.name}" width="${ball.opened ? 96 : 84}" height="${ball.opened ? 120 : 84}" />
            </div>
            <button class="starter-ball-btn">${ball.opened ? '[ TRỐNG RỖNG ]' : '[ BẤM ĐỂ MỞ ]'}</button>
          `;

          if (!ball.opened) {
            slot.addEventListener('click', () => {
              if (isDialogueActive) return;
              openBall(ball);
            });
          }
          stageEl.appendChild(slot);
        });
      };

      const showDialogueLine = (
        speaker: string,
        text: string,
        portraitSrc: string,
        speakerType: 'ash' | 'oak' | 'pikachu',
        sfx?: string
      ): Promise<void> => {
        return new Promise<void>((lineResolve) => {
          speakerEl.textContent = speaker;
          speakerEl.className = `starter-dialogue-speaker ${speakerType}`;
          contentEl.textContent = text;
          bustImgEl.src = portraitSrc;
          bustWrapperEl.style.display = 'block';
          footerEl.textContent = '▼ [Space / Enter / Click]';
          dialogueBoxEl.style.display = 'flex';

          if (sfx) {
            battleSePlayer.playSound(sfx, 0.85);
          }

          const advance = () => {
            window.removeEventListener('keydown', keyHandler);
            dialogueBoxEl.removeEventListener('click', clickHandler);
            activeAdvance = null;
            lineResolve();
          };

          const keyHandler = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
              e.preventDefault();
              advance();
            }
          };

          const clickHandler = () => {
            advance();
          };

          activeAdvance = advance;
          window.addEventListener('keydown', keyHandler);
          dialogueBoxEl.addEventListener('click', clickHandler);
        });
      };

      const openBall = async (ball: typeof balls[0]) => {
        isDialogueActive = true;
        ball.opened = true;
        battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 0.85);
        renderStage();

        // 1. Câu của Satoshi kèm hình đại diện Satoshi to lớn bên ngoài khung chat
        await showDialogueLine('Satoshi', ball.ashLine, ashPortrait, 'ash', 'Audio/SE/Exclaim.ogg');

        // 2. Câu của Tiến sĩ Okido kèm hình đại diện Tiến sĩ to lớn bên ngoài khung chat
        await showDialogueLine('Giáo sư Okido', ball.oakLine, oakPortrait, 'oak');

        // Ẩn hộp thoại và hình nhân vật để tiếp tục chọn quả khác
        dialogueBoxEl.style.display = 'none';
        bustWrapperEl.style.display = 'none';
        isDialogueActive = false;

        // Nếu cả 3 quả đều đã được mở rỗng
        if (balls.every((b) => b.opened)) {
          await runEndingSequence();
        }
      };

      const runEndingSequence = async () => {
        isDialogueActive = true;
        // Satoshi hỏi không có Pokémon nào
        await showDialogueLine('Satoshi', 'Vậy cháu sẽ khởi hành mà không có Pokemon nào à?', ashPortrait, 'ash');

        // Giáo sư Okido nhắc còn 1 con nhưng mà...
        await showDialogueLine('Giáo sư Okido', 'Ta vẫn còn một con, nhưng mà...', oakPortrait, 'oak');

        // Satoshi khẩn cầu
        await showDialogueLine('Satoshi', 'Xin hãy đưa cho cháu!', ashPortrait, 'ash', 'Audio/SE/Exclaim.ogg');

        // Kịch bản mới: Cảnh báo trước khi trao Pokémon
        await showDialogueLine(
          'Giáo sư Okido',
          'Trước khi ta cho cháu Pokemon này, ta cảnh báo cho cháu rằng nó có chút vấn đề đấy.',
          oakPortrait,
          'oak'
        );

        // Satoshi: Cháu đến muộn là đã có vấn đề rồi.
        await showDialogueLine('Satoshi', 'Cháu đến muộn là đã có vấn đề rồi.', ashPortrait, 'ash');

        // Giáo sư Okido: Tốt lắm.
        await showDialogueLine('Giáo sư Okido', 'Tốt lắm.', oakPortrait, 'oak');

        // Ẩn hộp thoại và chân dung để tập trung hoàn toàn vào bệ máy
        dialogueBoxEl.style.display = 'none';
        bustWrapperEl.style.display = 'none';

        // Cập nhật chỉ dẫn: Giáo Sư Okido đem ra quả Pokéball thứ 4 đặc biệt chứa Pikachu!
        const promptEl = this.starterMachineModalEl?.querySelector<HTMLElement>('.starter-machine-prompt');
        if (promptEl) {
          promptEl.textContent = 'Giáo Sư Okido đem ra quả Pokéball thứ 4 đặc biệt chứa Pikachu!';
        }

        // Bệ máy chuyển sang hiển thị Quả Pokéball thứ 4 phát sáng sấm sét
        stageEl.innerHTML = `
          <div class="starter-ball-slot pikachu-ball-slot" id="pikachuSpecialSlot" style="
            border: 2px solid #eab308;
            background: radial-gradient(circle at center, rgba(234, 179, 8, 0.22) 0%, rgba(15, 23, 42, 0.95) 75%);
            box-shadow: 0 0 32px rgba(234, 179, 8, 0.55), inset 0 0 20px rgba(234, 179, 8, 0.25);
            transform: scale(1.08);
            cursor: pointer;
            transition: all 0.25s ease;
          ">
            <div class="starter-ball-name" style="color: #facc15; font-size: 16px; text-shadow: 0 0 8px rgba(250, 204, 21, 0.8);">
              ⚡ QUẢ CẦU THỨ 4: PIKACHU
            </div>
            <span class="starter-ball-type-badge" style="background: rgba(250, 204, 21, 0.2); border: 1px solid #facc15; color: #fef08a;">
              Hệ Điện • Chuột Điện
            </span>
            <div class="starter-ball-pod">
              <img id="pikachuBallImg" class="starter-ball-img" src="${closedImg}" alt="Pikachu Pokéball" width="96" height="96" />
            </div>
            <button id="btnOpenPikachuBall" class="starter-ball-btn" style="
              background: linear-gradient(180deg, #ca8a04 0%, #eab308 100%);
              color: #1e1b4b;
              font-weight: bold;
              border-color: #fef08a;
              box-shadow: 0 0 12px rgba(250, 204, 21, 0.6);
            ">[ BẤM ĐỂ MỞ QUẢ CẦU PIKACHU ]</button>
          </div>
        `;

        battleSePlayer.playSound('Audio/SE/Select.ogg', 0.9);

        // Chờ người chơi bấm hoặc tự động bật mở sau 1000ms
        await new Promise<void>((ballResolve) => {
          const pikachuSlot = stageEl.querySelector<HTMLElement>('#pikachuSpecialSlot');
          const pikaBallImg = stageEl.querySelector<HTMLImageElement>('#pikachuBallImg');
          const btnOpen = stageEl.querySelector<HTMLButtonElement>('#btnOpenPikachuBall');
          let opened = false;

          const openPikachuBall = async () => {
            if (opened) return;
            opened = true;
            window.removeEventListener('keydown', keyOpenHandler);
            if (pikaBallImg) {
              pikaBallImg.src = openedImg;
              pikaBallImg.width = 110;
              pikaBallImg.height = 138;
            }
            if (btnOpen) {
              btnOpen.textContent = '[ QUẢ CẦU ĐÃ MỞ - PIKACHU XUẤT HIỆN! ]';
              btnOpen.style.background = 'linear-gradient(180deg, #16a34a 0%, #22c55e 100%)';
              btnOpen.style.color = '#ffffff';
            }
            if (pikachuSlot) {
              pikachuSlot.classList.add('opened');
              pikachuSlot.style.boxShadow = '0 0 45px rgba(250, 204, 21, 0.95), inset 0 0 25px rgba(250, 204, 21, 0.55)';
            }

            battleSePlayer.playSound('Audio/SE/Battle jump to ball.ogg', 1.0);
            await this.delay(450);

            // Mượt mà chuyển cảnh: Fade out modal êm ái sang phòng Lab thế giới thật
            if (this.starterMachineModalEl) {
              this.starterMachineModalEl.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s ease';
              this.starterMachineModalEl.style.opacity = '0';
              this.starterMachineModalEl.style.transform = 'scale(1.03)';
            }
            await this.delay(600);
            ballResolve();
          };

          const keyOpenHandler = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
              e.preventDefault();
              openPikachuBall();
            }
          };

          window.addEventListener('keydown', keyOpenHandler);
          if (pikachuSlot) {
            pikachuSlot.addEventListener('click', () => openPikachuBall());
          }

          // Tự động mở nếu người chơi không bấm sau 1000ms
          setTimeout(() => {
            if (!opened) {
              openPikachuBall();
            }
          }, 1000);
        });

        // Tắt modal bệ máy để chuyển sang phòng Lab trong Overworld (thế giới thật) cho Pikachu xuất hiện
        cleanup();
        resolve();
      };

      const cleanup = () => {
        if (this.starterMachineModalEl) {
          this.starterMachineModalEl.style.display = 'none';
          this.starterMachineModalEl.style.opacity = '';
          this.starterMachineModalEl.style.transform = '';
          this.starterMachineModalEl.style.transition = '';
          this.starterMachineModalEl.classList.remove('lightning-zap');
        }
        if (bustWrapperEl) {
          bustWrapperEl.style.display = 'none';
          bustWrapperEl.classList.remove('zap-shake');
        }
        this.resolveActiveStarterMachine = null;
      };

      this.resolveActiveStarterMachine = () => {
        if (activeAdvance) activeAdvance();
        cleanup();
        resolve();
      };

      renderStage();
      this.starterMachineModalEl.style.display = 'flex';
      this.starterMachineModalEl.style.opacity = '1';
      this.starterMachineModalEl.style.transform = 'scale(1)';
    });
  }

  private initStarterMachineDom(): void {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('palletStarterMachineModal') as HTMLDivElement | null;
    if (existing) {
      this.starterMachineModalEl = existing;
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'palletStarterMachineModal';
    modal.className = 'pallet-starter-machine-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="starter-machine-header">
        <span class="starter-machine-badge">VIỆN NGHIÊN CỨU GIÁO SƯ OKIDO</span>
        <h2 class="starter-machine-title">Bệ Máy Phân Phát Pokémon Khởi Đầu</h2>
        <div class="starter-machine-prompt">Hãy chọn và nhấn vào quả Pokéball cháu muốn nhận!</div>
      </div>

      <div class="starter-machine-console" id="starterMachineStage"></div>

      <!-- Large Character Bust Outside Chat Box -->
      <div class="starter-char-bust-wrapper" id="starterCharBustWrapper" style="display: none;">
        <img id="starterCharBustImg" class="starter-char-bust-img" src="" alt="Character Bust" />
      </div>

      <!-- Retro GBA Pixel Dialogue Box -->
      <div class="starter-portrait-dialogue-box" id="starterPortraitDialogue" style="display: none;">
        <div class="starter-dialogue-speaker" id="starterSpeaker"></div>
        <div class="starter-dialogue-content" id="starterContent"></div>
        <div class="starter-dialogue-footer" id="starterFooter">▼ [Space / Enter / Click]</div>
      </div>
    `;
    document.body.appendChild(modal);
    this.starterMachineModalEl = modal;
  }

  /**
   * Displays the iconic anime shock cutscene with full illustration of Satoshi & Oak electrocuted by Pikachu.
   */
  public showShockCutscene(
    speaker: string,
    lines: string[],
    imageSrc: string
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof document === 'undefined') {
        resolve();
        return;
      }

      this.initShockCutsceneDom();
      if (!this.shockModalEl) {
        resolve();
        return;
      }

      const imgEl = this.shockModalEl.querySelector<HTMLImageElement>('#palletShockImg');
      const speakerEl = this.shockModalEl.querySelector<HTMLElement>('#palletShockSpeaker');
      const contentEl = this.shockModalEl.querySelector<HTMLElement>('#palletShockContent');
      const footerEl = this.shockModalEl.querySelector<HTMLElement>('#palletShockFooter');

      if (imgEl) imgEl.src = imageSrc;
      if (speakerEl) speakerEl.textContent = speaker;
      if (contentEl) contentEl.textContent = lines[0] ?? '';
      if (footerEl) footerEl.textContent = '▼ [Space / Enter / Click]';

      const canvasEl = document.querySelector('canvas') || document.body;
      const containerEl = document.querySelector('.canvas-container') || document.body;
      canvasEl.classList.add('canvas-zap-shake');
      containerEl.classList.add('lightning-zap');
      this.shockModalEl.classList.add('zap-shake');
      this.shockModalEl.style.display = 'flex';

      battleSePlayer.playSound('Audio/SE/Anim/Thunder3.ogg', 1.0);
      battleSePlayer.playSound('Audio/SE/pikachu.mp3', 0.95);

      let lineIndex = 0;
      const advance = () => {
        lineIndex++;
        if (lineIndex < lines.length) {
          if (contentEl) contentEl.textContent = lines[lineIndex];
        } else {
          cleanup();
          resolve();
        }
      };

      const cleanup = () => {
        window.removeEventListener('keydown', keyHandler);
        if (this.shockModalEl) {
          this.shockModalEl.removeEventListener('click', clickHandler);
          this.shockModalEl.style.display = 'none';
          this.shockModalEl.classList.remove('zap-shake');
        }
        canvasEl.classList.remove('canvas-zap-shake');
        containerEl.classList.remove('lightning-zap');
        this.resolveActiveShockCutscene = null;
      };

      this.resolveActiveShockCutscene = () => {
        cleanup();
        resolve();
      };

      const keyHandler = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyZ') {
          e.preventDefault();
          advance();
        }
      };

      const clickHandler = () => {
        advance();
      };

      window.addEventListener('keydown', keyHandler);
      this.shockModalEl.addEventListener('click', clickHandler);
    });
  }

  private initShockCutsceneDom(): void {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById('palletShockModal') as HTMLDivElement | null;
    if (existing) {
      this.shockModalEl = existing;
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'palletShockModal';
    modal.className = 'pallet-shock-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="pallet-shock-container">
        <div class="pallet-shock-art-wrapper">
          <img id="palletShockImg" class="pallet-shock-img" src="" alt="Satoshi and Professor Oak Electrocuted" />
        </div>
        <div class="pallet-shock-dialogue-box">
          <div class="pallet-shock-speaker" id="palletShockSpeaker">Giáo sư Okido</div>
          <div class="pallet-shock-content" id="palletShockContent">Mau cho nó vào trong bóng đi!</div>
          <div class="pallet-shock-footer" id="palletShockFooter">▼ [Space / Enter / Click]</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.shockModalEl = modal;
  }

  private hideShockCutsceneDom(): void {
    if (this.shockModalEl) {
      this.shockModalEl.style.display = 'none';
      this.shockModalEl.classList.remove('zap-shake');
    }
  }

  private hideStarterMachineDom(): void {
    if (this.starterMachineModalEl) {
      this.starterMachineModalEl.style.display = 'none';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export const palletPrologueEventManager = PalletPrologueEventManager.getInstance();

export const palletPrologueEventDef: StoryEventDefinition = {
  id: 'act1.pallet.prologue',
  act: 1,
  scene: 'Pallet Town - Oak Lab Gate Collision & Pikachu Starter',
  trigger: {
    type: 'step_proximity',
    targetGX: 12,
    targetGY: 13,
    radiusX: 2,
    radiusY: 3,
  },
  prerequisites: [
    { flagNotSet: 'pallet_lab_gate_event_done' },
  ],
  checkpoint: 'act1_pallet_lab_gate',
  run: async (_context) => {
    // Invoked by StoryManager; PalletPrologueEventManager coordinates the legacy sequence
    // until full fine-grained step migration.
  },
  onAbort: () => {
    palletPrologueEventManager.reset();
  },
};

storyEventRegistry.register(palletPrologueEventDef);

export const palletLabPokedexEventDef: StoryEventDefinition = {
  id: 'act1.pallet.lab_pokedex',
  act: 1,
  scene: 'Professor Oak Lab - Pokédex & Pokéballs Handover',
  trigger: {
    type: 'npc_interaction',
    npcId: 'oak',
  },
  prerequisites: [
    { flag: 'received_starter_pikachu' },
    { flagNotSet: 'pallet_lab_pokedex_received' },
  ],
  checkpoint: 'act1_pallet_lab_pokedex',
  run: async (_context) => {
    // Handled in sequence with prologue
  },
  onAbort: () => {
    palletPrologueEventManager.reset();
  },
};

storyEventRegistry.register(palletLabPokedexEventDef);

export const palletMomFarewellEventDef: StoryEventDefinition = {
  id: 'act1.pallet.mom_farewell',
  act: 1,
  scene: 'Pallet Town - Mom Farewell, Crowd & Pikachu Shock',
  trigger: {
    type: 'step_proximity',
    targetGX: 12,
    targetGY: 13,
    radiusX: 3,
    radiusY: 3,
  },
  prerequisites: [
    { flag: 'pallet_lab_pokedex_received' },
    { flagNotSet: 'pallet_crowd_mom_farewell_done' },
  ],
  checkpoint: 'act1_pallet_mom_farewell',
  run: async (context) => {
    const session = (context.game as any)?.session;
    if (session) {
      await palletPrologueEventManager.runScene8_MomFarewellAndCrowd(session);
    }
  },
  onAbort: () => {
    palletPrologueEventManager.reset();
  },
};

storyEventRegistry.register(palletMomFarewellEventDef);

