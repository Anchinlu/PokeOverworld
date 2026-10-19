import { AssetLoader, GameRenderer } from './rendering';
import { GameSession, GameLoop } from './game';
import { defaultRng } from './core';
import {
  createOverlayTemplate,
  showBerryToast,
  togglePokedex,
  isPokedexOpen,
  togglePartyScreen,
  isPartyScreenOpen,
  initPartyScreen,
  toggleBagScreen,
  openBagScreen,
  isBagScreenOpen,
  initBagScreen,
  storageScreen,
  initPartyMapHud,
  playGameIntro,
  showTitleScreen,
  initEvolutionNotification,
  worldMapScreen,
  updateWorldTimeWidget,
} from './ui';
import { initDesktopShell } from './shell/desktop';
import type { Direction } from '@pokemon/shared-types';
import {
  partyService,
  playerService,
  inventoryService,
  pcStorageService,
  saveGameRepository,
  autosaveCoordinator,
  createPartyPokemon,
  type SaveGameData,
} from './domain';
import { pokemonCatalog } from './data';
import { getMoveById } from './battle/moves-db';
import { createBattler } from './battle/battle-factory';
import type { BattleMove, BattlerPokemon } from './battle/types';
import { battleSePlayer } from './audio/battle-se';
import { DebugOverlayController, type DebugBridge, type CustomBotConfig } from './debug';

declare global {
  interface Window {
    startBattle: (overlay?: string, isShiny?: boolean, weather?: string) => void;
    startCustomBattle: (customBattler: BattlerPokemon, overlay?: string, weather?: string) => void;
    saveGame: () => SaveGameData;
    loadGame: () => SaveGameData | null;
    replayIntro: () => void;
    showTitleScreen: () => void;
    launchGameWorld: (seed?: number, slotId?: string, isNewWorld?: boolean) => void;
    quitToTitleScreen?: () => void;
  }
}

export async function bootstrap(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('Application root element was not found.');
  }

  // 1. Scaffold UI & Initialize Autosave Coordinator
  app.innerHTML = createOverlayTemplate();
  initDesktopShell();
  autosaveCoordinator.init();

  const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')!;
  const loadingOverlay = document.querySelector<HTMLDivElement>('#loadingOverlay');
  const loadingText = document.querySelector<HTMLDivElement>('#loadingText');

  // 2. Responsive Canvas Sizing
  function resizeCanvas(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 3. Preload Assets
  const assetLoader = AssetLoader.getDefault();
  try {
    await assetLoader.loadFromManifest('/assets/manifest.json', (loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      if (loadingText) {
        loadingText.innerText = `Đang nạp dữ liệu đồ họa Pokémon... (${pct}%)`;
      }
    });

    try {
      await Promise.all([
        document.fonts.load('16px "Power Green Narrow"'),
        document.fonts.load('16px "Power Red and Blue"'),
        document.fonts.load('16px "Tiny5"'),
      ]);
    } catch {
      // Font preload fallback
    }
  } catch (err) {
    console.warn('Asset loading warning, falling back to procedural textures:', err);
  }

  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }

  // 4. Overworld State Manager & Decoupled Launcher
  let isWorldLaunched = false;
  let debugController: DebugOverlayController | null = null;
  let activeSaveSlot = 'slot_1';

  function setOverworldUiVisible(visible: boolean): void {
    const bar = document.querySelector<HTMLElement>('#topRightBar');
    if (bar) bar.style.display = visible ? '' : 'none';
    const hud = document.querySelector<HTMLElement>('#partyMapHud');
    if (hud) hud.style.display = visible ? '' : 'none';
    const timeWidget = document.querySelector<HTMLElement>('#worldTimeWidget');
    if (timeWidget) timeWidget.style.display = visible ? '' : 'none';
    if (debugController) debugController.setVisible(visible);
  }

  function launchGameWorld(
    seedOverride?: number,
    slotIdOverride?: string,
    isNewWorld?: boolean
  ): void {
    if (isWorldLaunched) return;
    isWorldLaunched = true;

    const worldAbortController = new AbortController();
    const { signal } = worldAbortController;

    if (slotIdOverride) {
      activeSaveSlot = slotIdOverride;
    }

    let currentSeed = seedOverride ?? 101;
    let currentVersion = 3; // Default for new worlds is World Gen v3 (asymmetric valley & organic corridors)
    let savedPosition: { gx: number; gy: number; direction?: number } | null = null;
    let savedTimeMinutes: number | undefined;
    let savedDay: number | undefined;

    if (isNewWorld) {
      // 1. Reset domain services for clean new world state
      playerService.reset();
      partyService.reset();
      inventoryService.reset();
      pcStorageService.reset();
      currentSeed = seedOverride ?? Math.floor(Math.random() * 899999) + 100001;
      currentVersion = 3;
    } else {
      // 2. Load or continue existing world save
      const hasSave = saveGameRepository.hasSave(activeSaveSlot);
      if (hasSave) {
        const loadedData = saveGameRepository.load(activeSaveSlot);
        if (loadedData) {
          currentSeed = seedOverride ?? loadedData.world?.seed ?? 101;
          currentVersion = loadedData.world?.worldGenVersion ?? 3;
          if (loadedData.world?.position) {
            savedPosition = loadedData.world.position;
          }
          if (typeof loadedData.world?.worldTimeMinutes === 'number') {
            savedTimeMinutes = loadedData.world.worldTimeMinutes;
          }
          if (typeof loadedData.world?.worldDay === 'number') {
            savedDay = loadedData.world.worldDay;
          }
        }
      } else if (seedOverride !== undefined) {
        currentSeed = seedOverride;
      }
    }

    const session = new GameSession(currentSeed, currentVersion, {
      initialMinutes: savedTimeMinutes,
      initialDay: savedDay,
    });
    const renderer = new GameRenderer(canvas, assetLoader);

    // If loaded existing save position, restore it
    if (savedPosition) {
      const dir = (savedPosition.direction ?? 0) as Direction;
      session.player.snapTo(savedPosition.gx, savedPosition.gy, dir);
      session.follower.snapTo(savedPosition.gx, savedPosition.gy - 1, dir);
    }

    // Auto-save fresh world initial state
    if (isNewWorld) {
      playerService.updatePosition(session.player.gx, session.player.gy, session.player.direction);
      saveGameRepository.save(activeSaveSlot, {
        saveMain: true,
        savePc: true,
        worldData: {
          seed: session.seed,
          worldGenVersion: session.field.version,
          worldTimeMinutes: session.worldClock.getMinutes(),
          worldDay: session.worldClock.getDay(),
          lastWorldTimestamp: Date.now(),
          position: {
            gx: session.player.gx,
            gy: session.player.gy,
            direction: session.player.direction,
          },
          startTown: {
            name: 'Twinleaf Hamlet',
            gx: 0,
            gy: 0,
            tier: 0,
          },
        },
      });
    }

    // Wire Debug Overlay via decoupled Remote Action Bridge
    const debugBridge: DebugBridge = {
      getWorldTime: () => ({
        minutes: session.worldClock.getMinutes(),
        day: session.worldClock.getDay(),
        isPaused: session.worldClock.isPaused(),
        phase: session.getDayPhase(),
      }),
      setWorldTime: (minutes: number) => {
        session.worldClock.setMinutes(minutes);
        updateWorldTimeWidget(
          session.worldClock.getMinutes(),
          session.getDayPhase(),
          session.worldClock.getDay(),
          session.worldClock.isPaused()
        );
      },
      setWorldTimePhase: (phase: 'dawn' | 'day' | 'dusk' | 'night') => {
        const phaseMinutes: Record<string, number> = {
          dawn: 360,
          day: 720,
          dusk: 1080,
          night: 0,
        };
        session.worldClock.setMinutes(phaseMinutes[phase] ?? 720);
        updateWorldTimeWidget(
          session.worldClock.getMinutes(),
          session.getDayPhase(),
          session.worldClock.getDay(),
          session.worldClock.isPaused()
        );
        const phaseNames: Record<string, string> = {
          dawn: '🌅 Bình minh (06:00)',
          day: '☀️ Ban ngày (12:00)',
          dusk: '🌇 Hoàng hôn (18:00)',
          night: '🌙 Ban đêm (00:00)',
        };
        showBerryToast(`🕒 Đã chuyển sang ${phaseNames[phase]}!`, '#facc15');
      },
      toggleTimePause: () => {
        if (session.worldClock.isPaused()) {
          session.worldClock.resume('debug');
          showBerryToast('▶️ Đã tiếp tục dòng thời gian thế giới!', '#22c55e');
          updateWorldTimeWidget(
            session.worldClock.getMinutes(),
            session.getDayPhase(),
            session.worldClock.getDay(),
            false
          );
          return false;
        } else {
          session.worldClock.pause('debug');
          showBerryToast('⏸️ Đã đóng băng dòng thời gian thế giới!', '#ef4444');
          updateWorldTimeWidget(
            session.worldClock.getMinutes(),
            session.getDayPhase(),
            session.worldClock.getDay(),
            true
          );
          return true;
        }
      },
      setTimeSpeed: (multiplier: number) => {
        session.worldClock.setSpeedMultiplier(multiplier);
        showBerryToast(`⚡ Tốc độ thời gian: ${multiplier}x`, '#a855f7');
      },
      startTestBattle: (overlay, isShiny, weather, envPreset) => {
        session.startTestBattle(overlay, isShiny, weather, envPreset);
      },
      startCustomBotBattle: (config: CustomBotConfig) => {
        const customMoves = (config.moves || [])
          .map((id) => getMoveById(id))
          .filter((m): m is BattleMove => Boolean(m));

        const customBattler = createBattler(
          config.speciesKey,
          config.level,
          false,
          undefined,
          config.isShiny,
          undefined,
          undefined,
          config.ability,
          customMoves.length > 0 ? customMoves : undefined
        );

        session.startCustomBattle(customBattler, config.overlay, config.weather);
        showBerryToast(
          `🤖 Khởi động trận đấu với Bot ${customBattler.name} (Lv.${config.level})!`,
          '#ef4444'
        );
      },
      addItemToBag: (itemId, count) => {
        inventoryService.addItem(itemId, count);
      },
      addStarterItems: () => {
        const starterItems: Record<string, number> = {
          POKEBALL: 25,
          GREATBALL: 15,
          ULTRABALL: 10,
          MASTERBALL: 2,
          POTION: 15,
          SUPERPOTION: 10,
          HYPERPOTION: 5,
          MAXPOTION: 3,
          REVIVE: 10,
          MAXREVIVE: 3,
          FULLRESTORE: 5,
          RARECANDY: 10,
          ORANBERRY: 20,
          SITRUSBERRY: 15,
          LUMBERRY: 10,
          TM01: 1,
          TM13: 1,
          TM24: 1,
          HM01: 1,
          HM02: 1,
          XATTACK: 10,
          XDEFEND: 10,
          XSPEED: 10,
          BICYCLE: 1,
          TOWNMAP: 1,
          OLDROD: 1,
          SUPERROD: 1,
          RUNNINGSHOES: 1,
        };
        for (const [id, count] of Object.entries(starterItems)) {
          inventoryService.addItem(id, count);
        }
        showBerryToast('🎒 Đã thêm bộ vật phẩm khởi đầu đầy đủ vào tất cả 8 ngăn túi!', '#10b981');
      },
      addAllBalls: () => {
        const balls = [
          'POKEBALL',
          'GREATBALL',
          'ULTRABALL',
          'MASTERBALL',
          'QUICKBALL',
          'DUSKBALL',
          'NETBALL',
        ];
        for (const b of balls) {
          inventoryService.addItem(b, 50);
        }
        showBerryToast('⚾ Đã bổ sung 50x các loại Bóng Poké vào túi!', '#38bdf8');
      },
      addFullItems: () => {
        const total = inventoryService.addFullItems(1);
        showBerryToast(
          `💎 Đã cung cấp Full ${total} vật phẩm (x1 mỗi loại) vào toàn bộ 8 ngăn túi!`,
          '#a855f7'
        );
      },
      addAllMachines: () => {
        const total = inventoryService.addAllMachines(1);
        showBerryToast(
          `💿 Đã cung cấp Full ${total} Đĩa Kỹ Thuật (TM/HM) vào ngăn Đĩa Chiêu!`,
          '#0ea5e9'
        );
      },
      openBag: () => {
        openBagScreen();
      },
      addPartyPokemon: (speciesKey, level, isShiny) => {
        if (partyService.isPartyFull()) {
          showBerryToast(
            '⚠️ Đội hình đã đầy (tối đa 6 Pokémon)! Hãy xóa bớt hoặc reset.',
            '#ef4444'
          );
          return;
        }
        const newPk = createPartyPokemon(speciesKey, level, { isShiny });
        partyService.addPokemon(newPk);
        showBerryToast(
          `🎉 Đã thêm ${newPk.name}${isShiny ? ' ★ Shiny' : ''} (Lv.${newPk.level}) vào đội hình!`,
          '#22c55e'
        );
      },
      addRandomPartyPokemon: (isShiny) => {
        if (partyService.isPartyFull()) {
          showBerryToast('⚠️ Đội hình đã đầy (tối đa 6 Pokémon)!', '#ef4444');
          return;
        }
        const all = pokemonCatalog.getAll();
        const randomSpecies = defaultRng.choice(all);
        const randomLevel = defaultRng.nextInt(5, 50);
        const newPk = createPartyPokemon(randomSpecies.speciesKey, randomLevel, { isShiny });
        partyService.addPokemon(newPk);
        showBerryToast(
          `🎲 Đã thêm ngẫu nhiên ${newPk.name}${isShiny ? ' ★ Shiny' : ''} (Lv.${newPk.level})!`,
          '#38bdf8'
        );
      },
      fillPartyPokemon: (isShiny) => {
        if (partyService.isPartyFull()) {
          showBerryToast('⚠️ Đội hình đã có đủ 6 Pokémon rồi!', '#f59e0b');
          return;
        }
        const showcaseKeys = [
          'CHARIZARD',
          'BLASTOISE',
          'VENUSAUR',
          'GENGAR',
          'DRAGONITE',
          'LUCARIO',
          'EEVEE',
          'SNORLAX',
          'GYARADOS',
        ];
        let addedCount = 0;
        while (!partyService.isPartyFull()) {
          const currentKeys = partyService.getParty().map((p) => p.speciesKey);
          const candidates = showcaseKeys.filter((k) => !currentKeys.includes(k));
          const chosenKey =
            candidates.length > 0
              ? defaultRng.choice(candidates)
              : defaultRng.choice(pokemonCatalog.getAll()).speciesKey;
          const level = defaultRng.nextInt(20, 50);
          partyService.addPokemon(createPartyPokemon(chosenKey, level, { isShiny }));
          addedCount++;
        }
        showBerryToast(
          `⚡ Đã bổ sung thêm ${addedCount} Pokémon${isShiny ? ' ★ Shiny' : ''} để đủ 6 Slot!`,
          '#10b981'
        );
      },
      resetPartyPokemon: () => {
        partyService.reset();
        showBerryToast('🗑️ Đã đặt lại đội hình (chỉ giữ Pikachu Lv.5)!', '#eab308');
      },
      spawnShinyWild: (speciesKey) => {
        const shiny = session.spawnTestShinyWild(speciesKey);
        if (shiny) {
          showBerryToast(
            `✨ Đã xuất hiện Pokémon Shiny ${shiny.name} (Lv.${shiny.level}) gần bạn trên map! Hãy đến gần để lắng nghe âm thanh đặc trưng!`,
            '#f59e0b'
          );
        }
      },
      getPartySize: () => partyService.getPartySize(),
      subscribePartyChange: (cb) => partyService.subscribe(() => cb(partyService.getPartySize())),
      regenerateMap: (seed) => {
        currentSeed = seed;
        session.regenerate(seed);
        renderer.clearCache();
      },
      resetPlayerPosition: () => {
        session.resetPlayer();
      },
      replayIntro: () => {
        playGameIntro();
      },
      saveGame: () => {
        window.saveGame();
      },
      loadGame: () => {
        window.loadGame();
      },
      setRenderOption: (key, value) => {
        renderer.setOptions({ [key]: value } as Parameters<typeof renderer.setOptions>[0]);
      },
      setBerryCycle: (seconds) => {
        renderer.setBerryCycle(seconds);
      },
      setBerryStageOverride: (stage) => {
        renderer.setBerryStageOverride(stage);
      },
      isCollisionEnabled: () => debugController?.isCollisionEnabled() ?? true,
    };

    debugController = new DebugOverlayController(debugBridge);
    debugController.mount(app);
    setOverworldUiVisible(true);

    // Initial sync for on-screen world time widget
    updateWorldTimeWidget(
      session.worldClock.getMinutes(),
      session.getDayPhase(),
      session.worldClock.getDay(),
      session.worldClock.isPaused()
    );

    // Bind Quick Actions on world time widget
    const quickTimeButtons = document.querySelectorAll<HTMLButtonElement>('.btn-time-quick');
    quickTimeButtons.forEach((btn) => {
      btn.addEventListener(
        'click',
        (e) => {
          e.stopPropagation();
          const targetTime = parseInt(btn.dataset.time || '720', 10);
          session.worldClock.setMinutes(targetTime);
          const phaseNames: Record<number, string> = {
            360: '🌅 Bình minh (06:00)',
            720: '☀️ Ban ngày (12:00)',
            1080: '🌇 Hoàng hôn (18:00)',
            0: '🌙 Ban đêm (00:00)',
          };
          showBerryToast(
            `🕒 Đã chuyển sang ${phaseNames[targetTime] || session.worldClock.formatTime()}`,
            '#38bdf8'
          );
          updateWorldTimeWidget(
            session.worldClock.getMinutes(),
            session.getDayPhase(),
            session.worldClock.getDay(),
            session.worldClock.isPaused()
          );
          debugController?.refreshWorldTimeDisplay();
        },
        { signal }
      );
    });

    const worldTimePill = document.querySelector<HTMLElement>('#worldTimePill');
    worldTimePill?.addEventListener(
      'click',
      () => {
        const cycle = [360, 720, 1080, 0];
        const cur = session.worldClock.getMinutes();
        let nextM = cycle[0];
        for (const m of cycle) {
          if (m > cur) {
            nextM = m;
            break;
          }
        }
        session.worldClock.setMinutes(nextM);
        showBerryToast(
          `🕒 Đã chuyển sang ${session.worldClock.formatTime()} (${session.getDayPhase()})`,
          '#facc15'
        );
        updateWorldTimeWidget(
          session.worldClock.getMinutes(),
          session.getDayPhase(),
          session.worldClock.getDay(),
          session.worldClock.isPaused()
        );
        debugController?.refreshWorldTimeDisplay();
      },
      { signal }
    );

    window.startBattle = (
      overlay?: string,
      isShiny?: boolean,
      weather?: string,
      envPreset?: string
    ) => {
      session.startTestBattle(overlay || 'auto', isShiny ?? false, weather, envPreset);
    };
    window.startCustomBattle = (
      customBattler: BattlerPokemon,
      overlay?: string,
      weather?: string
    ) => {
      session.startCustomBattle(customBattler, overlay || 'auto', weather);
    };
    window.saveGame = () => {
      playerService.updatePosition(session.player.gx, session.player.gy, session.player.direction);
      const res = saveGameRepository.save(activeSaveSlot, {
        saveMain: true,
        savePc: true,
        worldData: {
          seed: session.seed,
          worldGenVersion: session.field.version,
          worldTimeMinutes: session.worldClock.getMinutes(),
          worldDay: session.worldClock.getDay(),
          lastWorldTimestamp: Date.now(),
          position: {
            gx: session.player.gx,
            gy: session.player.gy,
            direction: session.player.direction,
          },
          startTown:
            session.field.version >= 2
              ? {
                  name: 'Twinleaf Hamlet',
                  gx: 0,
                  gy: 0,
                  tier: 0,
                }
              : undefined,
        },
      });
      const slotNum = activeSaveSlot.replace('slot_', '');
      if (res.success) {
        showBerryToast(`💾 Đã lưu tiến trình thế giới (Slot ${slotNum})!`, '#22c55e');
      } else {
        showBerryToast(`⚠️ Lưu game thất bại! Bộ nhớ lưu trữ có thể đã đầy.`, '#ef4444');
      }
      return res;
    };
    window.loadGame = () => {
      const data = saveGameRepository.load(activeSaveSlot);
      const slotNum = activeSaveSlot.replace('slot_', '');
      if (data) {
        const targetSeed = data.world?.seed ?? session.seed;
        const targetVersion = data.world?.worldGenVersion ?? 1;
        if (targetSeed !== session.seed || targetVersion !== session.field.version) {
          session.regenerate(targetSeed, targetVersion);
          renderer.clearCache();
        }
        if (data.world?.position) {
          const dir = (data.world.position.direction ?? 0) as Direction;
          session.player.snapTo(data.world.position.gx, data.world.position.gy, dir);
          session.follower.snapTo(data.world.position.gx, data.world.position.gy - 1, dir);
        }
        if (typeof data.world?.worldTimeMinutes === 'number') {
          session.worldClock.setMinutes(data.world.worldTimeMinutes);
        }
        if (typeof data.world?.worldDay === 'number') {
          session.worldClock.setDay(data.world.worldDay);
        }
        showBerryToast(`📂 Đã nạp lại dữ liệu thế giới (Slot ${slotNum})!`, '#38bdf8');
      } else {
        showBerryToast(`⚠️ Không tìm thấy bản lưu thế giới nào (Slot ${slotNum})!`, '#ef4444');
      }
      return data;
    };

    // Initialize Party, Bag Screens & Map Party HUD
    initPartyScreen((newLeader) => {
      showBerryToast(`👑 ${newLeader.name} đang dẫn đầu đội hình!`, '#38bdf8');
    });
    initBagScreen();
    initEvolutionNotification();

    // Synchronize initial overworld follower with active party follower
    session.syncFollowerFromParty();
    const starterFollower = partyService.getActiveFollower() || partyService.getLeader();
    if (starterFollower) {
      partyService.setActiveFollowerUid(starterFollower.uid);
    }

    // Party Map HUD: Clicking a card summons the Pokémon to follow the player on the map
    initPartyMapHud((pokemon) => {
      if (pokemon.isFainted || pokemon.currentHp <= 0) {
        showBerryToast(
          `⚠️ ${pokemon.nickname || pokemon.name} đã kiệt sức, không thể đi theo bạn!`,
          '#ef4444'
        );
        return;
      }

      const currentFollower = partyService.getActiveFollower();
      if (currentFollower && currentFollower.uid === pokemon.uid && session.follower.visible) {
        battleSePlayer.playFollowerSummon(pokemon.speciesKey, !!pokemon.isShiny);
        showBerryToast(
          `💖 ${pokemon.nickname || pokemon.name} đang vui vẻ đi theo bạn!`,
          '#38bdf8'
        );
        return;
      }

      partyService.setActiveFollowerUid(pokemon.uid);
      session.syncFollowerFromParty();

      battleSePlayer.playFollowerSummon(pokemon.speciesKey, !!pokemon.isShiny);

      showBerryToast(
        pokemon.isShiny
          ? `✨ Đã gọi Pokémon Shiny ${pokemon.nickname || pokemon.name} (Lv.${pokemon.level}) đi theo bạn!`
          : `✨ Đã gọi ${pokemon.nickname || pokemon.name} (Lv.${pokemon.level}) đi theo bạn!`,
        pokemon.isShiny ? '#f59e0b' : '#38bdf8'
      );
    });

    // 6. Top Right Menu Bar Buttons & Exit Handler
    const quitToTitleScreen = () => {
      if (session.isBattling) {
        showBerryToast('⚠️ Không thể thoát game khi đang trong trận đấu!', '#ef4444');
        return;
      }

      if (typeof window !== 'undefined' && window.confirm) {
        const ok = window.confirm('Bạn có muốn lưu thế giới và thoát ra màn hình chờ không?');
        if (!ok) return;
      }

      // 1. Auto-save current progress
      window.saveGame();

      // 2. Close all active sub-screens
      if (isPokedexOpen()) togglePokedex();
      if (isPartyScreenOpen()) togglePartyScreen();
      if (isBagScreenOpen()) toggleBagScreen();
      if (storageScreen.isVisible()) storageScreen.close();
      if (worldMapScreen.isOpen()) worldMapScreen.close();

      // 3. Stop the game loop
      loop.stop();
      session.worldClock.pause('quit');
      session.destroy();

      // 4. Clean up overworld event listeners & debug controller
      worldAbortController.abort();
      if (debugController) {
        debugController.destroy();
        debugController = null;
      }

      // 5. Hide Overworld HUD & reset world launched state
      setOverworldUiVisible(false);
      isWorldLaunched = false;

      // 6. Clear the main game canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // 7. Mount and display Title Screen
      showTitleScreen({
        onStart: () => launchGameWorld(),
        onNewWorld: (seed, slotId) => launchGameWorld(seed, slotId, true),
        onLoadWorld: (slotId) => launchGameWorld(undefined, slotId, false),
      });

      showBerryToast('🚪 Đã lưu tiến trình và quay về màn hình chờ!', '#f59e0b');
    };

    window.quitToTitleScreen = () => quitToTitleScreen();

    const btnMenuPokedex = document.querySelector<HTMLButtonElement>('#btnMenuPokedex');
    const btnMenuParty = document.querySelector<HTMLButtonElement>('#btnMenuParty');
    const btnMenuBag = document.querySelector<HTMLButtonElement>('#btnMenuBag');
    const btnMenuPC = document.querySelector<HTMLButtonElement>('#btnMenuPC');
    const btnMenuMap = document.querySelector<HTMLButtonElement>('#btnMenuMap');
    const btnMenuTrainer = document.querySelector<HTMLButtonElement>('#btnMenuTrainer');
    const btnMenuOptions = document.querySelector<HTMLButtonElement>('#btnMenuOptions');
    const btnMenuQuit = document.querySelector<HTMLButtonElement>('#btnMenuQuit');

    btnMenuPokedex?.addEventListener(
      'click',
      () => {
        togglePokedex();
      },
      { signal }
    );

    btnMenuParty?.addEventListener(
      'click',
      () => {
        togglePartyScreen();
      },
      { signal }
    );

    btnMenuBag?.addEventListener(
      'click',
      () => {
        toggleBagScreen();
      },
      { signal }
    );

    btnMenuPC?.addEventListener(
      'click',
      () => {
        storageScreen.toggle();
      },
      { signal }
    );

    btnMenuMap?.addEventListener(
      'click',
      () => {
        if (
          !session.isBattling &&
          !isPokedexOpen() &&
          !isPartyScreenOpen() &&
          !isBagScreenOpen() &&
          !storageScreen.isVisible()
        ) {
          worldMapScreen.toggle(session);
        }
      },
      { signal }
    );

    btnMenuTrainer?.addEventListener(
      'click',
      () => {
        const profile = playerService.getProfile();
        const leader = partyService.getLeader();
        showBerryToast(
          `👤 HLV: ${profile.name} | Tiền: $${profile.money} | Đội hình: ${partyService.getPartySize()}/6 (${leader?.name ?? 'Trống'})`,
          '#38bdf8'
        );
      },
      { signal }
    );

    btnMenuOptions?.addEventListener(
      'click',
      () => {
        debugController?.toggleCollapse();
        showBerryToast('⚙️ Tùy chọn cài đặt & tham số thế giới Pokémon', '#a855f7');
      },
      { signal }
    );

    btnMenuQuit?.addEventListener(
      'click',
      () => {
        quitToTitleScreen();
      },
      { signal }
    );

    // 7. Mouse Inspector
    canvas.addEventListener(
      'mousemove',
      (e) => {
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const viewW = canvas.width / session.camera.zoom;
        const viewH = canvas.height / session.camera.zoom;

        const worldX = screenX + (session.camera.x - viewW / 2);
        const worldY = screenY + (session.camera.y - viewH / 2);

        const gx = Math.floor(worldX / 32);
        const gy = Math.floor(worldY / 32);

        debugController?.updateMouseInspector(gx, gy, session.chunkManager, renderer);
      },
      { signal }
    );

    // 8. Click and Keyboard Interactions
    canvas.addEventListener(
      'click',
      (e) => {
        canvas.focus();
        const rect = canvas.getBoundingClientRect();
        const screenX = (e.clientX - rect.left) / session.camera.zoom;
        const screenY = (e.clientY - rect.top) / session.camera.zoom;
        const viewW = canvas.width / session.camera.zoom;
        const viewH = canvas.height / session.camera.zoom;
        const worldX = screenX + (session.camera.x - viewW / 2);
        const worldY = screenY + (session.camera.y - viewH / 2);
        const clickGX = Math.floor(worldX / 32);
        const clickGY = Math.floor(worldY / 32);

        session.interactAt(clickGX, clickGY, renderer);
      },
      { signal }
    );

    window.addEventListener(
      'keydown',
      (e) => {
        const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea') {
          return;
        }

        if (e.code === 'KeyQ') {
          togglePokedex();
          e.preventDefault();
          return;
        }

        if (e.code === 'KeyP') {
          togglePartyScreen();
          e.preventDefault();
          return;
        }

        if (e.code === 'KeyB') {
          toggleBagScreen();
          e.preventDefault();
          return;
        }

        if (e.code === 'KeyC') {
          storageScreen.toggle();
          e.preventDefault();
          return;
        }

        if (e.code === 'KeyM') {
          if (
            !session.isBattling &&
            !isPokedexOpen() &&
            !isPartyScreenOpen() &&
            !isBagScreenOpen() &&
            !storageScreen.isVisible()
          ) {
            worldMapScreen.toggle(session);
          }
          e.preventDefault();
          return;
        }

        if (
          isPokedexOpen() ||
          isPartyScreenOpen() ||
          isBagScreenOpen() ||
          storageScreen.isVisible() ||
          worldMapScreen.isOpen()
        ) {
          return;
        }

        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
          session.interactInFront(renderer);
        }
      },
      { signal }
    );

    // 9. Game Loop Setup
    let hudTick = 0;
    function onUpdate(dtScale: number): void {
      if (worldMapScreen.isOpen()) {
        session.worldClock.pause('world_map');
        return;
      }

      const collisionEnabled = debugController?.isCollisionEnabled() ?? true;
      const { pChunkX, pChunkY } = session.update(dtScale, collisionEnabled);

      hudTick++;
      if (hudTick % 6 === 0) {
        if (debugController) {
          debugController.updateTick({
            playerGx: session.player.gx,
            playerGy: session.player.gy,
            playerX: session.player.x,
            playerY: session.player.y,
            chunkX: pChunkX,
            chunkY: pChunkY,
            activeChunksCount: session.chunkManager.activeChunks.length,
            fps: loop.getFps(),
            worldTimeStr: session.worldClock.formatTime(),
            dayPhase: session.getDayPhase(),
            worldDay: session.worldClock.getDay(),
            isTimePaused: session.worldClock.isPaused(),
          });
        }
        updateWorldTimeWidget(
          session.worldClock.getMinutes(),
          session.getDayPhase(),
          session.worldClock.getDay(),
          session.worldClock.isPaused()
        );
      }
    }

    function onRender(): void {
      if (worldMapScreen.isOpen() || session.isBattling) {
        return;
      }
      renderer.render(
        session.camera,
        session.player,
        session.follower,
        session.chunkManager,
        session.getAmbientLight(),
        session.getDayPhase()
      );
    }

    const loop = new GameLoop(onUpdate, onRender);
    worldMapScreen.setVisibilityListener((isOpen) => {
      if (isOpen) {
        loop.pause();
        session.worldClock.pause('world_map');
      } else {
        loop.resume();
        session.worldClock.resume('world_map');
      }
    });
    loop.start();
  }

  // 10. Global Diagnostic Hooks
  window.launchGameWorld = (seed?: number, slotId?: string, isNewWorld?: boolean) =>
    launchGameWorld(seed, slotId, isNewWorld);
  window.replayIntro = () => {
    playGameIntro();
  };
  window.showTitleScreen = () => {
    showTitleScreen({
      onStart: () => launchGameWorld(),
      onNewWorld: (seed, slotId) => launchGameWorld(seed, slotId, true),
      onLoadWorld: (slotId) => launchGameWorld(undefined, slotId, false),
    });
  };

  // 11. Initial Entry Flow: Quick Test vs Cinematic Start
  const isQuickMode =
    window.location.search.includes('quick') || window.location.search.includes('dev');
  if (isQuickMode) {
    // Immediate bypass for dev fast-iteration
    launchGameWorld();
  } else {
    // Hide Overworld HUD during Title Screen & Intro
    setOverworldUiVisible(false);

    // Mount Title Screen (Morning Sea, Drifting Clouds, Swaying Grass)
    showTitleScreen({
      onStart: () => {
        launchGameWorld();
      },
      onNewWorld: (seed, slotId) => {
        launchGameWorld(seed, slotId, true);
      },
      onLoadWorld: (slotId) => {
        launchGameWorld(undefined, slotId, false);
      },
    });

    // Play Cinematic Intro on top (split animation reveals title screen)
    playGameIntro();
  }
}
