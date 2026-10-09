import { MENU_ASSETS } from '../assets';

export function createOverlayTemplate(): string {
  return `
  <!-- Fullscreen Canvas -->
  <div class="canvas-wrapper">
    <canvas id="gameCanvas" tabindex="0"></canvas>
  </div>

  <!-- Top Right Navigation Bar (Using Graphics/Icons/Blank.png) -->
  <header id="topRightBar" class="top-right-bar" aria-label="Thanh menu chức năng">
    <img src="${MENU_ASSETS.barBlank}" class="menu-bar-blank" alt="Menu Bar" draggable="false" />
    <div class="menu-bar-content" id="menuBarContent">
      <button class="menu-bar-btn" id="btnMenuPokedex" title="Pokédex (Phím Q)" aria-label="Pokédex">
        <img src="${MENU_ASSETS.menuPokedex}" alt="Pokédex" class="menu-bar-icon" />
        <span class="menu-bar-text">Pokédex</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuParty" title="Đội hình Pokémon (Phím P)" aria-label="Đội hình">
        <img src="${MENU_ASSETS.menuPokemon}" alt="Đội hình" class="menu-bar-icon" />
        <span class="menu-bar-text">Đội hình</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuBag" title="Túi đồ (Phím B)" aria-label="Túi đồ">
        <img src="${MENU_ASSETS.menuBag}" alt="Túi đồ" class="menu-bar-icon" />
        <span class="menu-bar-text">Túi đồ</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuPC" title="Kho lưu trữ PC (Phím C)" aria-label="Kho lưu trữ PC">
        <img src="${MENU_ASSETS.menuPC}" alt="PC Box" class="menu-bar-icon" />
        <span class="menu-bar-text">PC Box</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuTrainer" title="Huấn luyện viên (Trainer Card)" aria-label="Trainer Card">
        <img src="${MENU_ASSETS.menuTrainer}" alt="Hồ sơ" class="menu-bar-icon" />
        <span class="menu-bar-text">Hồ sơ</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuOptions" title="Tùy chọn cài đặt (Options)" aria-label="Cài đặt">
        <img src="${MENU_ASSETS.menuOptions}" alt="Cài đặt" class="menu-bar-icon" />
        <span class="menu-bar-text">Cài đặt</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuQuit" title="Thoát / Thu gọn (Quit)" aria-label="Thoát">
        <img src="${MENU_ASSETS.menuQuit}" alt="Thoát" class="menu-bar-icon" />
        <span class="menu-bar-text">Thoát</span>
      </button>
    </div>
  </header>

  <!-- Fullscreen Loading Screen -->
  <div id="loadingOverlay" class="loading-overlay">
    <div class="loading-spinner"></div>
    <div id="loadingText" class="loading-text">Đang nạp dữ liệu đồ họa Pokémon... (0%)</div>
  </div>
  `;
}

export function bindOverlayToggle(): void {
  const testOverlay = document.querySelector<HTMLElement>('#testOverlay');
  const btnToggle = document.querySelector<HTMLButtonElement>('#btnToggleOverlay');
  if (testOverlay && btnToggle) {
    btnToggle.addEventListener('click', () => {
      testOverlay.classList.toggle('collapsed');
      btnToggle.innerText = testOverlay.classList.contains('collapsed') ? '⚙️' : '✕';
    });
  }
}
