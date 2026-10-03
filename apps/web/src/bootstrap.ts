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
} from './ui';
import { initDesktopShell } from './shell/desktop';

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
  const assetLoader = new AssetLoader();
  try {
    await assetLoader.loadFromManifest('/assets/manifest.json', (loaded, total) => {
      const pct = Math.round((loaded / total) * 100);
      if (loadingText) {
        loadingText.innerText = `Đang nạp dữ liệu đồ họa Pokémon... (${pct}%)`;
      }
    });
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
  btnTestBattle?.addEventListener('click', () => {
    session.startTestBattle();
  });
  (window as any).startBattle = () => session.startTestBattle();

  // Top Right Menu Bar Buttons
  const btnMenuPokedex = document.querySelector<HTMLButtonElement>('#btnMenuPokedex');
  const btnMenuTrainer = document.querySelector<HTMLButtonElement>('#btnMenuTrainer');
  const btnMenuOptions = document.querySelector<HTMLButtonElement>('#btnMenuOptions');
  const btnMenuQuit = document.querySelector<HTMLButtonElement>('#btnMenuQuit');

  btnMenuPokedex?.addEventListener('click', () => {
    togglePokedex();
  });

  btnMenuTrainer?.addEventListener('click', () => {
    showBerryToast(
      `👤 Huấn luyện viên: Red | Vị trí: [${session.player.gx}, ${session.player.gy}] | Đang theo sau: Pikachu`,
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

    if (isPokedexOpen()) {
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
