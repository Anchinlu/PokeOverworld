import { AssetLoader, GameRenderer } from './rendering';
import { GameSession, GameLoop } from './game';
import { defaultRng } from './core';
import {
  createOverlayTemplate,
  bindOverlayToggle,
  getDebugPanelBindings,
  bindRenderOptions,
  updateMouseInspector,
  bindBerryPanel,
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
import { battleSePlayer } from './audio/battle-se';

declare global {
  interface Window {
    startBattle: (overlay?: string) => void;
    saveGame: () => SaveGameData;
    loadGame: () => SaveGameData | null;
  }
}

export async function bootstrap(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) {
    throw new Error('Application root element was not found.');
  }

  // 1. Scaffold UI
  app.innerHTML = createOverlayTemplate();
  bindOverlayToggle();
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

  // 4. Initialize Core Systems
  const debugBindings = getDebugPanelBindings();
  let currentSeed = parseInt(debugBindings.inputSeed.value, 10) || 101;

  const session = new GameSession(currentSeed);
  const renderer = new GameRenderer(canvas, assetLoader);

  // 5. Wire UI Panels
  bindRenderOptions(renderer, debugBindings);
  bindBerryPanel(renderer);

  // 6. Action Buttons
  debugBindings.btnRandomSeed.addEventListener('click', () => {
    currentSeed = defaultRng.nextInt(100, 99999);
    debugBindings.inputSeed.value = String(currentSeed);
    session.regenerate(currentSeed);
    renderer.clearCache();
  });

  debugBindings.btnRegenerate.addEventListener('click', () => {
    currentSeed = parseInt(debugBindings.inputSeed.value, 10) || 101;
    session.regenerate(currentSeed);
    renderer.clearCache();
  });

  debugBindings.btnResetPlayer.addEventListener('click', () => {
    session.resetPlayer();
  });

  const btnTestBattle = document.querySelector<HTMLButtonElement>('#btnTestBattle');
  const selectBattleShiny = document.querySelector<HTMLSelectElement>('#selectBattleShiny');
  const selectBattleOverlay = document.querySelector<HTMLSelectElement>('#selectBattleOverlay');
  btnTestBattle?.addEventListener('click', () => {
    const overlay = selectBattleOverlay?.value || 'auto';
    const isShiny = selectBattleShiny?.value === 'shiny';
    session.startTestBattle(overlay, isShiny);
  });
  window.startBattle = (overlay?: string, isShiny?: boolean) => {
    const chosenOverlay = overlay || selectBattleOverlay?.value || 'auto';
    const chosenShiny = isShiny !== undefined ? isShiny : selectBattleShiny?.value === 'shiny';
    session.startTestBattle(chosenOverlay, chosenShiny);
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

  // --- Party Debug & Testing Controls (Map Overlay) ---
  const selectPartySpecies = document.querySelector<HTMLSelectElement>('#selectPartySpecies');
  const selectPartyForm = document.querySelector<HTMLSelectElement>('#selectPartyForm');
  const inputPartyLevel = document.querySelector<HTMLInputElement>('#inputPartyLevel');
  const lblPartyCount = document.querySelector<HTMLElement>('#lblPartyCount');
  const btnAddPartyPokemon = document.querySelector<HTMLButtonElement>('#btnAddPartyPokemon');
  const btnAddRandomPartyPokemon = document.querySelector<HTMLButtonElement>(
    '#btnAddRandomPartyPokemon'
  );
  const btnFillPartyPokemon = document.querySelector<HTMLButtonElement>('#btnFillPartyPokemon');
  const btnResetPartyPokemon = document.querySelector<HTMLButtonElement>('#btnResetPartyPokemon');

  if (selectPartySpecies) {
    const allSpecies = [...pokemonCatalog.getAll()].sort((a, b) => a.id - b.id);
    selectPartySpecies.innerHTML = allSpecies
      .map(
        (p) =>
          `<option value="${p.speciesKey}" ${p.speciesKey === 'CHARIZARD' ? 'selected' : ''}>#${String(p.id).padStart(3, '0')} ${p.name}</option>`
      )
      .join('');
  }

  const updatePartyCountLabel = () => {
    if (lblPartyCount) {
      const size = partyService.getPartySize();
      lblPartyCount.innerText = `${size} / 6`;
      lblPartyCount.style.color = size >= 6 ? '#f87171' : '#93c5fd';
    }
  };
  updatePartyCountLabel();
  partyService.subscribe(updatePartyCountLabel);

  btnAddPartyPokemon?.addEventListener('click', () => {
    if (partyService.isPartyFull()) {
      showBerryToast('⚠️ Đội hình đã đầy (tối đa 6 Pokémon)! Hãy xóa bớt hoặc reset.', '#ef4444');
      return;
    }
    const speciesKey = selectPartySpecies?.value || 'PIKACHU';
    const level = Math.max(1, Math.min(100, parseInt(inputPartyLevel?.value || '25', 10) || 25));
    const isShiny = selectPartyForm?.value === 'shiny';
    const newPk = createPartyPokemon(speciesKey, level, { isShiny });
    partyService.addPokemon(newPk);
    showBerryToast(
      `🎉 Đã thêm ${newPk.name}${isShiny ? ' ★ Shiny' : ''} (Lv.${newPk.level}) vào đội hình!`,
      '#22c55e'
    );
  });

  btnAddRandomPartyPokemon?.addEventListener('click', () => {
    if (partyService.isPartyFull()) {
      showBerryToast('⚠️ Đội hình đã đầy (tối đa 6 Pokémon)!', '#ef4444');
      return;
    }
    const all = pokemonCatalog.getAll();
    const randomSpecies = defaultRng.choice(all);
    const randomLevel = defaultRng.nextInt(5, 50);
    const isShiny = selectPartyForm?.value === 'shiny';
    const newPk = createPartyPokemon(randomSpecies.speciesKey, randomLevel, { isShiny });
    partyService.addPokemon(newPk);
    showBerryToast(
      `🎲 Đã thêm ngẫu nhiên ${newPk.name}${isShiny ? ' ★ Shiny' : ''} (Lv.${newPk.level})!`,
      '#38bdf8'
    );
  });

  btnFillPartyPokemon?.addEventListener('click', () => {
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
    const isShiny = selectPartyForm?.value === 'shiny';
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
  });

  btnResetPartyPokemon?.addEventListener('click', () => {
    partyService.reset();
    showBerryToast('🗑️ Đã đặt lại đội hình (chỉ giữ Pikachu Lv.5)!', '#eab308');
  });

  const btnSpawnShinyWild = document.querySelector<HTMLButtonElement>('#btnSpawnShinyWild');
  btnSpawnShinyWild?.addEventListener('click', () => {
    const speciesKey = selectPartySpecies?.value;
    const shiny = session.spawnTestShinyWild(speciesKey);
    if (shiny) {
      showBerryToast(
        `✨ Đã xuất hiện Pokémon Shiny ${shiny.name} (Lv.${shiny.level}) gần bạn trên map! Hãy đến gần để lắng nghe âm thanh đặc trưng!`,
        '#f59e0b'
      );
    }
  });

  // Initialize Party, Bag Screens & Map Party HUD
  initPartyScreen((newLeader) => {
    showBerryToast(`👑 ${newLeader.name} đang dẫn đầu đội hình!`, '#38bdf8');
  });
  initBagScreen();

  // Synchronize initial overworld follower with active party follower
  const starterFollower = partyService.getActiveFollower() || partyService.getLeader();
  if (starterFollower) {
    session.follower.setPokemon(
      starterFollower.speciesKey,
      !!starterFollower.isShiny,
      starterFollower.nickname || starterFollower.name
    );
    session.follower.visible = true;
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
      showBerryToast(`💖 ${pokemon.nickname || pokemon.name} đang vui vẻ đi theo bạn!`, '#38bdf8');
      return;
    }

    partyService.setActiveFollowerUid(pokemon.uid);
    session.follower.setPokemon(
      pokemon.speciesKey,
      !!pokemon.isShiny,
      pokemon.nickname || pokemon.name
    );
    session.follower.visible = true;

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

  // Bag Debug Overlay Buttons
  const btnOpenBagDirect = document.querySelector<HTMLButtonElement>('#btnOpenBagDirect');
  const btnAddStarterItems = document.querySelector<HTMLButtonElement>('#btnAddStarterItems');
  const btnAddAllBalls = document.querySelector<HTMLButtonElement>('#btnAddAllBalls');

  btnOpenBagDirect?.addEventListener('click', () => {
    openBagScreen();
  });

  btnAddStarterItems?.addEventListener('click', () => {
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
  });

  btnAddAllBalls?.addEventListener('click', () => {
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
    const testOverlay = document.querySelector<HTMLElement>('#testOverlay');
    const btnToggle = document.querySelector<HTMLButtonElement>('#btnToggleOverlay');
    if (testOverlay && testOverlay.classList.contains('collapsed')) {
      testOverlay.classList.remove('collapsed');
      if (btnToggle) btnToggle.innerText = '✕';
    }
    showBerryToast('⚙️ Tùy chọn cài đặt & tham số thế giới Pokémon', '#a855f7');
  });

  btnMenuQuit?.addEventListener('click', () => {
    const testOverlay = document.querySelector<HTMLElement>('#testOverlay');
    const btnToggle = document.querySelector<HTMLButtonElement>('#btnToggleOverlay');
    if (testOverlay) {
      testOverlay.classList.toggle('collapsed');
      if (btnToggle) {
        btnToggle.innerText = testOverlay.classList.contains('collapsed') ? '⚙️' : '✕';
      }
      showBerryToast(
        testOverlay.classList.contains('collapsed')
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

    updateMouseInspector(gx, gy, session.chunkManager, renderer, debugBindings);
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

    if (isPokedexOpen() || isPartyScreenOpen() || isBagScreenOpen() || storageScreen.isVisible()) {
      return;
    }

    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
      session.interactInFront(renderer);
    }
  });

  // 9. Game Loop Setup
  let hudTick = 0;
  function onUpdate(dtScale: number): void {
    const collisionEnabled = debugBindings.chkCollision ? debugBindings.chkCollision.checked : true;
    const { pChunkX, pChunkY } = session.update(dtScale, collisionEnabled);

    hudTick++;
    if (hudTick % 6 === 0) {
      debugBindings.lblPlayerPos.innerText = `[${session.player.gx}, ${session.player.gy}] (${Math.round(session.player.x)}, ${Math.round(session.player.y)}px)`;
      debugBindings.lblChunkPos.innerText = `[${pChunkX}, ${pChunkY}]`;
      debugBindings.lblActiveChunks.innerText = `${session.chunkManager.activeChunks.length} chunks`;
    }
  }

  function onRender(): void {
    renderer.render(session.camera, session.player, session.follower, session.chunkManager);
  }

  const loop = new GameLoop(onUpdate, onRender);
  loop.start();

  setInterval(() => {
    debugBindings.lblFps.innerText = `${loop.getFps()} FPS`;
  }, 250);
}
