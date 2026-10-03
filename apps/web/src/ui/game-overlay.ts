export function createOverlayTemplate(): string {
  return `
  <!-- Fullscreen Canvas -->
  <div class="canvas-wrapper">
    <canvas id="gameCanvas" tabindex="0"></canvas>
  </div>

  <!-- Top Right Navigation Bar (Using Graphics/Icons/Blank.png) -->
  <header id="topRightBar" class="top-right-bar" aria-label="Thanh menu chức năng">
    <img src="/Graphics/Icons/Blank.png" class="menu-bar-blank" alt="Menu Bar" draggable="false" />
    <div class="menu-bar-content" id="menuBarContent">
      <button class="menu-bar-btn" id="btnMenuPokedex" title="Pokédex (Phím D)" aria-label="Pokédex">
        <img src="/Graphics/Icons/menuPokedex.png" alt="Pokédex" class="menu-bar-icon" />
        <span class="menu-bar-text">Pokédex</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuTrainer" title="Huấn luyện viên (Trainer Card)" aria-label="Trainer Card">
        <img src="/Graphics/Icons/menuTrainer.png" alt="Hồ sơ" class="menu-bar-icon" />
        <span class="menu-bar-text">Hồ sơ</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuOptions" title="Tùy chọn cài đặt (Options)" aria-label="Cài đặt">
        <img src="/Graphics/Icons/menuOptions.png" alt="Cài đặt" class="menu-bar-icon" />
        <span class="menu-bar-text">Cài đặt</span>
      </button>
      <button class="menu-bar-btn" id="btnMenuQuit" title="Thoát / Thu gọn (Quit)" aria-label="Thoát">
        <img src="/Graphics/Icons/menuQuit.png" alt="Thoát" class="menu-bar-icon" />
        <span class="menu-bar-text">Thoát</span>
      </button>
    </div>
  </header>

  <!-- Floating Glassmorphic Overlay for Testing & Diagnostics -->
  <aside id="testOverlay" class="test-overlay">
    <header class="overlay-header">
      <div class="overlay-title">
        <span>🎮 Pokémon Map</span>
        <span class="badge-fixed">1.0x Cố định</span>
      </div>
      <div class="header-actions">
        <button class="btn-fullscreen" id="btnToggleFullscreen" title="Toàn màn hình (F11)">⛶</button>
        <button class="btn-toggle" id="btnToggleOverlay" title="Thu gọn / Mở rộng">✕</button>
      </div>
    </header>

    <div class="overlay-body">
      <!-- Seed & Biome -->
      <div class="control-row">
        <input type="number" id="inputSeed" value="101" title="Seed bản đồ">
        <button class="btn-icon" id="btnRandomSeed" title="Đổi seed ngẫu nhiên">🎲 Đổi</button>
        <select id="selectBiome" title="Hệ sinh thái">
          <option value="mixed" selected>🌟 Hỗn hợp</option>
          <option value="route">🌲 Nội địa</option>
          <option value="coastal">🏖️ Bờ biển</option>
          <option value="autumn">🍂 Lá thu</option>
        </select>
      </div>

      <!-- Testing Layer Checkboxes -->
      <div class="layers-grid">
        <label class="checkbox-item">
          <input type="checkbox" id="chkHills" checked> ⛰️ Núi / Đồi
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkRoad" checked> 🛣️ Đường mòn
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkBeach" checked> 🏖️ Bờ biển
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkTrees" checked> 🌲 Cây cối
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkChunkGrid" checked> 🔲 Ranh Chunk
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkCollision" checked> 🛑 Va chạm
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkHitbox"> 🎯 Hitbox
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkGrid"> 📐 Lưới 32px
        </label>
        <label class="checkbox-item" style="grid-column: span 2;">
          <input type="checkbox" id="chkTallGrass" checked> 🌿 Bãi Cỏ Cao GBA (Tall Grass)
        </label>
        <label class="checkbox-item" style="grid-column: span 2;">
          <input type="checkbox" id="chkPlants" checked> 🌸 Hoa & Cỏ hoa (Animated)
        </label>
        <label class="checkbox-item" style="grid-column: span 2;">
          <input type="checkbox" id="chkBerries" checked> 🫐 Bụi Berry Dại (Chu kỳ lớn)
        </label>
        <label class="checkbox-item" style="grid-column: span 2;">
          <input type="checkbox" id="chkHeatmap"> 🗺️ Bản đồ Heatmap ID
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkEcologyMoisture"> 💧 Sinh thái: Độ ẩm
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkEcologyFertility"> 🌱 Sinh thái: Độ phì
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkEcologyDensity"> 🌲 Sinh thái: Mật độ
        </label>
        <label class="checkbox-item">
          <input type="checkbox" id="chkEcologyZone"> 🗺️ Sinh thái: Vùng
        </label>
      </div>

      <!-- Berry Growth Cycle Controls -->
      <div class="berry-controls-box">
        <div class="control-row" style="margin-bottom: 6px; align-items: center;">
          <span style="font-size: 11px; font-weight: 600; color: #c084fc;">⏱️ Chu kỳ Berry:</span>
          <select id="selectBerryCycle" style="flex: 1; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);">
            <option value="60" selected>⚡ 1 phút (Test nhanh - 15s/giai đoạn)</option>
            <option value="180">⏱️ 3 phút (45s/giai đoạn)</option>
            <option value="600">⏱️ 10 phút (2.5m/giai đoạn)</option>
            <option value="1800">🌳 30 phút (Chuẩn Pokémon)</option>
          </select>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="btn-berry-stage" data-stage="0" title="Ép xem Mầm non">🌱 Mầm</button>
          <button class="btn-berry-stage" data-stage="1" title="Ép xem Cây non">🌿 Cây</button>
          <button class="btn-berry-stage" data-stage="2" title="Ép xem Ra hoa">🌸 Hoa</button>
          <button class="btn-berry-stage" data-stage="3" title="Ép xem Quả chín">🫐 Quả</button>
          <button class="btn-berry-stage active" data-stage="auto" title="Tự động phát triển theo thời gian">🔄 Tự động</button>
        </div>
      </div>

      <!-- Position & Testing Monitor -->
      <div class="info-box">
        <div class="info-line">
          <span>Vị trí Red:</span>
          <span id="lblPlayerPos">0, 0</span>
        </div>
        <div class="info-line">
          <span>Chunk nạp:</span>
          <span><span id="lblChunkPos">[0, 0]</span> (<span id="lblActiveChunks">0 chunks</span>)</span>
        </div>
        <div class="info-line">
          <span>Trỏ chuột:</span>
          <span><span id="insCoords">[0, 0]</span> | <span id="insTerrain">Đồng cỏ</span></span>
        </div>
        <div class="info-line">
          <span>Mã Tile:</span>
          <span id="insTileId">#101</span>
        </div>
        <div class="info-line">
          <span>Vùng sinh thái:</span>
          <span id="insEcologyZone">--</span>
        </div>
        <div class="info-line">
          <span>M / F / D:</span>
          <span id="insEcologyMFD">--</span>
        </div>
        <div class="info-line">
          <span>Stats chunk:</span>
          <span id="insChunkStats">--</span>
        </div>
        <div class="info-line" id="rowBerryInfo" style="display: none;">
          <span>Berry:</span>
          <span id="insBerryVal">--</span>
        </div>
        <div class="info-line">
          <span>Tốc độ:</span>
          <span id="lblFps">60 FPS</span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions-row">
        <button class="btn-action-primary" id="btnRegenerate">⚡ Tải lại Map</button>
        <button class="btn-action-secondary" id="btnResetPlayer">🚶 Gốc [0,0]</button>
      </div>
      <div class="actions-row" style="margin-top: 6px;">
        <button class="btn-action-primary" id="btnTestBattle" style="background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 2px 8px rgba(239,68,68,0.4);">⚔️ Thử nghiệm Trận đấu</button>
      </div>
    </div>
  </aside>

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
