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
} from './ui';
import { initDesktopShell } from './shell/desktop';
import type { Direction } from '@pokemon/shared-types';
import {
  partyService,
  playerService,
  inventoryService,
  saveGameRepository,
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
    launchGameWorld: (seed?: number) => void;
  }
}

export async function bootstrap(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('Application root element was not found.');
  }

  // 1. Scaffold UI
  app.innerHTML = createOverlayTemplate();
  initDesktopShell();

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

  function setOverworldUiVisible(visible: boolean): void {
    const bar = document.querySelector<HTMLElement>('#topRightBar');
    if (bar) bar.style.display = visible ? '' : 'none';
    if (debugController) debugController.setVisible(visible);
  }

  function launchGameWorld(seedOverride?: number): void {
    if (isWorldLaunched) return;
    isWorldLaunched = true;

    let currentSeed = seedOverride ?? 101;
    const session = new GameSession(currentSeed);
    const renderer = new GameRenderer(canvas, assetLoader);

    // Wire Debug Overlay via decoupled Remote Action Bridge
    const debugBridge: DebugBridge = {
      startTestBattle: (overlay, isShiny, weather) => {
        session.startTestBattle(overlay, isShiny, weather);
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

    window.startBattle = (overlay?: string, isShiny?: boolean, weather?: string) => {
      session.startTestBattle(overlay || 'auto', isShiny ?? false, weather);
    };
    window.startCustomBattle = (
      customBattler: BattlerPokemon,
      overlay?: string,
      weather?: string
    ) => {
      session.startCustomBattle(customBattler, overlay || 'auto', weather);
    };
    window.saveGame = () => {
      const res = saveGameRepository.save('slot_1', {
        position: {
          gx: session.player.gx,
          gy: session.player.gy,
          direction: session.player.direction,
        },
      });
      showBerryToast(`💾 Đã lưu tiến trình game (Slot 1)!`, '#22c55e');
      return res;
    };
    window.loadGame = () => {
      const data = saveGameRepository.load('slot_1');
      if (data) {
        if (data.world?.position) {
          const dir = (data.world.position.direction ?? 0) as Direction;
          session.player.snapTo(data.world.position.gx, data.world.position.gy, dir);
        }
        showBerryToast(`📂 Đã nạp lại dữ liệu lưu game!`, '#38bdf8');
      } else {
        showBerryToast(`⚠️ Không tìm thấy bản lưu game nào!`, '#ef4444');
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

    // Top Right Menu Bar Buttons
    const btnMenuPokedex = document.querySelector<HTMLButtonElement>('#btnMenuPokedex');
    const btnMenuParty = document.querySelector<HTMLButtonElement>('#btnMenuParty');
    const btnMenuBag = document.querySelector<HTMLButtonElement>('#btnMenuBag');
    const btnMenuPC = document.querySelector<HTMLButtonElement>('#btnMenuPC');
    const btnMenuTrainer = document.querySelector<HTMLButtonElement>('#btnMenuTrainer');
    const btnMenuOptions = document.querySelector<HTMLButtonElement>('#btnMenuOptions');
    const btnMenuQuit = document.querySelector<HTMLButtonElement>('#btnMenuQuit');

    btnMenuPokedex?.addEventListener('click', () => {
      togglePokedex();
    });

    btnMenuParty?.addEventListener('click', () => {
      togglePartyScreen();
    });

    btnMenuBag?.addEventListener('click', () => {
      toggleBagScreen();
    });

    btnMenuPC?.addEventListener('click', () => {
      storageScreen.toggle();
    });

    btnMenuTrainer?.addEventListener('click', () => {
      const profile = playerService.getProfile();
      const leader = partyService.getLeader();
      showBerryToast(
        `👤 HLV: ${profile.name} | Tiền: $${profile.money} | Đội hình: ${partyService.getPartySize()}/6 (${leader?.name ?? 'Trống'})`,
        '#38bdf8'
      );
    });

    btnMenuOptions?.addEventListener('click', () => {
      debugController?.toggleCollapse();
      showBerryToast('⚙️ Tùy chọn cài đặt & tham số thế giới Pokémon', '#a855f7');
    });

    btnMenuQuit?.addEventListener('click', () => {
      if (debugController) {
        debugController.toggleCollapse();
        showBerryToast(
          debugController.isCollapsed()
            ? '🚪 Đã thu gọn bảng điều khiển'
            : '⚙️ Đã mở bảng điều khiển',
          '#f59e0b'
        );
      }
    });

    // 7. Mouse Inspector
    canvas.addEventListener('mousemove', (e) => {
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
    });

    // 8. Click and Keyboard Interactions
    canvas.addEventListener('click', (e) => {
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
    });

    window.addEventListener('keydown', (e) => {
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

      if (
        isPokedexOpen() ||
        isPartyScreenOpen() ||
        isBagScreenOpen() ||
        storageScreen.isVisible()
      ) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        session.interactInFront(renderer);
      }
    });

    // 9. Game Loop Setup
    let hudTick = 0;
    function onUpdate(dtScale: number): void {
      const collisionEnabled = debugController?.isCollisionEnabled() ?? true;
      const { pChunkX, pChunkY } = session.update(dtScale, collisionEnabled);

      hudTick++;
      if (hudTick % 6 === 0 && debugController) {
        debugController.updateTick({
          playerGx: session.player.gx,
          playerGy: session.player.gy,
          playerX: session.player.x,
          playerY: session.player.y,
          chunkX: pChunkX,
          chunkY: pChunkY,
          activeChunksCount: session.chunkManager.activeChunks.length,
          fps: loop.getFps(),
        });
      }
    }

    function onRender(): void {
      renderer.render(session.camera, session.player, session.follower, session.chunkManager);
    }

    const loop = new GameLoop(onUpdate, onRender);
    loop.start();
  }

  // 10. Global Diagnostic Hooks
  window.launchGameWorld = (seed?: number) => launchGameWorld(seed);
  window.replayIntro = () => {
    playGameIntro();
  };
  window.showTitleScreen = () => {
    showTitleScreen({
      onStart: () => launchGameWorld(),
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
    });

    // Play Cinematic Intro on top (split animation reveals title screen)
    playGameIntro();
  }
}
