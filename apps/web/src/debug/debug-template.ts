export function createDebugOverlayHtml(): string {
  return `
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
        <button class="btn-action-secondary" id="btnReplayIntro" title="Phát lại đoạn Intro Game">🎬 Intro</button>
      </div>
      <div class="actions-row" style="margin-top: 6px; display: flex; gap: 6px;">
        <button class="btn-action-primary" id="btnTestBattle" style="flex: 1; background: linear-gradient(135deg, #ef4444, #dc2626); box-shadow: 0 2px 8px rgba(239,68,68,0.4);">⚔️ Đấu Thử</button>
        <select id="selectBattleShiny" style="flex: 0.95; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Dạng Pokémon hoang dã">
          <option value="normal">⚪ Địch Thường</option>
          <option value="shiny">🌟 Địch Shiny</option>
        </select>
        <select id="selectBattleOverlay" style="flex: 1.15; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chọn tiền cảnh chiến đấu">
          <option value="auto">🌿 Tự động theo map</option>
          <option value="grass_tall">🌾 Cỏ cao (Tall Grass)</option>
          <option value="grass_field">🌱 Cỏ thấp (Field Grass)</option>
          <option value="water_rough">🌊 Sóng lớn (Rough Sea)</option>
          <option value="water_calm">💧 Nước êm (Calm Water)</option>
          <option value="sand_dunes">🏜️ Cồn cát (Sand Dunes)</option>
          <option value="mountain_rocks">🪨 Mỏm đá (Mountain Rocks)</option>
        </select>
      </div>

      <!-- Custom Bot Battle Spawner (Bot Test Chiêu Thức) -->
      <div class="bot-debug-box" style="margin-top: 6px; padding: 10px; border-radius: var(--radius-sm); background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(239, 68, 68, 0.4); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 11px; font-weight: 700; color: #f87171;">🤖 Tạo Bot Đối Thủ (Test Chiêu Thức):</span>
          <span class="badge-fixed" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);">Bot Test</span>
        </div>

        <!-- Row 1: Species, Form, Level -->
        <div class="control-row" style="display: flex; gap: 6px;">
          <select id="selectBotSpecies" style="flex: 1.3; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chọn loài Pokémon cho Bot">
            <!-- Populated dynamically via controller -->
          </select>
          <select id="selectBotForm" style="flex: 0.9; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chọn dạng Pokémon">
            <option value="normal">⚪ Thường</option>
            <option value="shiny">🌟 Shiny</option>
          </select>
          <input type="number" id="inputBotLevel" min="1" max="100" value="50" style="width: 48px; padding: 4px; font-size: 11px; text-align: center; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Cấp độ (1-100)">
        </div>

        <!-- Row 2: Ability selection -->
        <div class="control-row" style="display: flex; gap: 6px; align-items: center;">
          <span style="font-size: 10.5px; color: #94a3b8; white-space: nowrap;">Đặc tính:</span>
          <select id="selectBotAbility" style="flex: 1; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Đặc tính kích hoạt">
            <option value="auto">🌟 Tự động theo loài</option>
            <!-- Populated dynamically via controller -->
          </select>
        </div>

        <!-- Row 3 & 4: 4 Custom Moves -->
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10.5px; font-weight: 600; color: #cbd5e1;">4 Chiêu thức tùy biến:</span>
            <span style="font-size: 9.5px; color: #94a3b8;">(Để trống = auto)</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <select id="selectBotMove1" style="padding: 4px; font-size: 10px; border-radius: 5px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chiêu thức 1"></select>
            <select id="selectBotMove2" style="padding: 4px; font-size: 10px; border-radius: 5px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chiêu thức 2"></select>
            <select id="selectBotMove3" style="padding: 4px; font-size: 10px; border-radius: 5px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chiêu thức 3"></select>
            <select id="selectBotMove4" style="padding: 4px; font-size: 10px; border-radius: 5px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chiêu thức 4"></select>
          </div>
        </div>

        <!-- Row 5: Quick Move Presets -->
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <button type="button" class="btn-action-secondary" id="btnPresetFlinch" style="flex: 1; font-size: 9.5px; padding: 3px 4px; white-space: nowrap;" title="Fake Out, Bite, Air Slash, Iron Head">⚡ Nao núng</button>
          <button type="button" class="btn-action-secondary" id="btnPresetConfusion" style="flex: 1; font-size: 9.5px; padding: 3px 4px; white-space: nowrap;" title="Confuse Ray, Sweet Kiss, Swagger, Water Pulse">🌀 Bối rối</button>
          <button type="button" class="btn-action-secondary" id="btnPresetStatus" style="flex: 1; font-size: 9.5px; padding: 3px 4px; white-space: nowrap;" title="Thunder Wave, Toxic, Spore, Protect">💤 Trạng thái</button>
          <button type="button" class="btn-action-secondary" id="btnPresetDamage" style="flex: 1; font-size: 9.5px; padding: 3px 4px; white-space: nowrap;" title="Thunderbolt, Flamethrower, Ice Beam, Earthquake">💥 Sát thương</button>
        </div>

        <!-- Row 6: Start Bot Battle Button -->
        <div class="actions-row">
          <button class="btn-action-primary" id="btnStartBotBattle" style="background: linear-gradient(135deg, #ef4444, #b91c1c); font-size: 11px; padding: 6px 10px; width: 100%; box-shadow: 0 2px 8px rgba(239,68,68,0.4);">⚔️ Chiến Đấu Với Bot Này</button>
        </div>
      </div>

      <!-- Party / Pokemon Debug & Test Section -->
      <div class="party-debug-box" style="margin-top: 6px; padding: 10px; border-radius: var(--radius-sm); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(59, 130, 246, 0.35); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 11px; font-weight: 700; color: #60a5fa;">🐾 Bổ sung Pokémon Đội hình:</span>
          <span id="lblPartyCount" style="font-size: 11px; font-family: monospace; color: #93c5fd; background: rgba(59,130,246,0.2); padding: 2px 6px; border-radius: 4px;">1 / 6</span>
        </div>

        <!-- Species, Form & Level Pickers -->
        <div class="control-row" style="display: flex; gap: 6px;">
          <select id="selectPartySpecies" style="flex: 1.3; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);">
            <!-- Populated dynamically via controller -->
          </select>
          <select id="selectPartyForm" style="flex: 0.95; padding: 4px 6px; font-size: 11px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chọn dạng Pokémon">
            <option value="normal">⚪ Thường</option>
            <option value="shiny">🌟 Shiny</option>
          </select>
          <input type="number" id="inputPartyLevel" min="1" max="100" value="25" style="width: 48px; padding: 4px; font-size: 11px; text-align: center; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Cấp độ (1-100)">
        </div>

        <!-- Action Row 1: Add Selected / Add Random -->
        <div class="actions-row">
          <button class="btn-action-primary" id="btnAddPartyPokemon" style="background: linear-gradient(135deg, #3b82f6, #2563eb); font-size: 11px; padding: 5px 8px;">➕ Thêm vào đội</button>
          <button class="btn-action-secondary" id="btnAddRandomPartyPokemon" style="font-size: 11px; padding: 5px 8px;">🎲 Ngẫu nhiên</button>
        </div>

        <!-- Action Row 2: Fill 6 / Reset -->
        <div class="actions-row">
          <button class="btn-action-primary" id="btnFillPartyPokemon" style="background: linear-gradient(135deg, #10b981, #059669); font-size: 11px; padding: 5px 8px;">⚡ Đầy 6 Slot</button>
          <button class="btn-action-secondary" id="btnResetPartyPokemon" style="font-size: 11px; padding: 5px 8px;">🗑️ Reset đội hình</button>
        </div>

        <!-- Action Row 3: Spawn Wild Shiny on Map for Testing -->
        <div class="actions-row">
          <button class="btn-action-primary" id="btnSpawnShinyWild" style="background: linear-gradient(135deg, #f59e0b, #d97706); font-size: 11px; padding: 5px 8px; width: 100%;" title="Tạo ngay 1 Pokémon Shiny hoang dã gần bạn trên map">✨ Thả Shiny Hoang Dã (Map Test)</button>
        </div>
      </div>

      <!-- Bag Debug Section -->
      <div class="bag-debug-box" style="margin-top: 6px; padding: 10px; border-radius: var(--radius-sm); background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(168, 85, 247, 0.35); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 11px; font-weight: 700; color: #c084fc;">🎒 Kiểm thử & Thêm Vật Phẩm:</span>
          <button id="btnOpenBagDirect" class="btn-action-primary" style="font-size: 10px; padding: 2px 8px; background: linear-gradient(135deg, #a855f7, #7c3aed);">Mở túi (B)</button>
        </div>

        <!-- Item Picker & Custom Amount -->
        <div class="control-row" style="display: flex; gap: 6px; align-items: center;">
          <select id="selectBagItem" style="flex: 1.5; padding: 4px 6px; font-size: 10.5px; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Chọn vật phẩm cần thêm">
            <!-- Populated dynamically via controller -->
          </select>
          <input type="number" id="inputBagItemCount" min="1" max="999" value="10" style="width: 48px; padding: 4px; font-size: 11px; text-align: center; border-radius: 6px; background: rgba(30, 41, 59, 0.85); color: #fff; border: 1px solid rgba(255,255,255,0.18);" title="Số lượng cần thêm (1-999)">
          <button class="btn-action-primary" id="btnAddCustomBagItem" style="font-size: 10.5px; padding: 4px 8px; background: linear-gradient(135deg, #10b981, #059669); white-space: nowrap;">➕ Thêm</button>
        </div>

        <!-- Quick Add Berry & Remedies for Status Testing -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
          <button type="button" class="btn-action-secondary" id="btnQuickAddPersim" style="font-size: 9.5px; padding: 3px 4px; text-align: left;" title="+10 Quả Persim Berry (Trị Rối Loạn)">🫐 +10 Persim Berry</button>
          <button type="button" class="btn-action-secondary" id="btnQuickAddLum" style="font-size: 9.5px; padding: 3px 4px; text-align: left;" title="+10 Quả Lum Berry (Trị Mọi Trạng Thái)">🍈 +10 Lum Berry</button>
          <button type="button" class="btn-action-secondary" id="btnQuickAddFullRestore" style="font-size: 9.5px; padding: 3px 4px; text-align: left;" title="+10 Full Restore (Hồi máu & giải trạng thái)">💊 +10 Full Restore</button>
          <button type="button" class="btn-action-secondary" id="btnQuickAddRareCandy" style="font-size: 9.5px; padding: 3px 4px; text-align: left;" title="+20 Rare Candy (Tăng cấp)">🍬 +20 Rare Candy</button>
        </div>

        <!-- Starter Item Packages -->
        <div class="actions-row">
          <button class="btn-action-secondary" id="btnAddStarterItems" style="font-size: 10px; padding: 4px 6px;">🎁 Nhận bộ mẫu 8 túi</button>
          <button class="btn-action-secondary" id="btnAddAllBalls" style="font-size: 10px; padding: 4px 6px;">⚾ Full Bóng bắt</button>
        </div>
      </div>
    </div>
  </aside>
  `;
}
