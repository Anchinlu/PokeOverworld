import type { DebugBridge, DebugMonitorUpdate } from './types';
import { createDebugOverlayHtml } from './debug-template';
import { pokemonCatalog } from '../data';
import { getAllItems, getItemById, findItem } from '../data/items-db';
import { getAllMoves } from '../battle/moves-db';
import { ABILITY_NAMES_VI } from '../battle/rules/ability-engine';
import { showBerryToast } from '../ui/toast';
import { defaultRng } from '../core/rng';
import type { ChunkManager, BerryBushEntity } from '../maps';
import type { GameRenderer } from '../rendering';
import { TERRAIN } from '@pokemon/game-data';
import { sampleEcology, getEcologyZone } from '../maps/ecology';
import { BERRY_STAGES } from '../maps/berry-data';

const TERRAIN_NAMES: Record<number, string> = {
  [TERRAIN.GRASS]: 'Đồng cỏ',
  [TERRAIN.ROAD]: 'Đường mòn đất',
  [TERRAIN.BEACH_SAND]: 'Bãi cát biển',
  [TERRAIN.HILL]: 'Vách núi / Đồi',
  [TERRAIN.OCEAN_WATER]: 'Sông hồ / Nước',
};

export class DebugOverlayController {
  private bridge: DebugBridge;
  private overlayEl: HTMLElement | null = null;
  private cleanupFns: Array<() => void> = [];

  // DOM element caches
  private chkCollision: HTMLInputElement | null = null;
  private inputSeed: HTMLInputElement | null = null;
  private lblPlayerPos: HTMLElement | null = null;
  private lblChunkPos: HTMLElement | null = null;
  private lblActiveChunks: HTMLElement | null = null;
  private insCoords: HTMLElement | null = null;
  private insTerrain: HTMLElement | null = null;
  private insTileId: HTMLElement | null = null;
  private insEcologyZone: HTMLElement | null = null;
  private insEcologyMFD: HTMLElement | null = null;
  private insChunkStats: HTMLElement | null = null;
  private rowBerryInfo: HTMLElement | null = null;
  private insBerryVal: HTMLElement | null = null;
  private lblFps: HTMLElement | null = null;
  private lblPartyCount: HTMLElement | null = null;

  constructor(bridge: DebugBridge) {
    this.bridge = bridge;
  }

  public mount(container?: HTMLElement | null): void {
    const root = container ?? document.body;
    let el = root.querySelector<HTMLElement>('#testOverlay');
    if (!el) {
      root.insertAdjacentHTML('beforeend', createDebugOverlayHtml());
      el = root.querySelector<HTMLElement>('#testOverlay');
    }
    this.overlayEl = el;
    if (!this.overlayEl) return;

    this.cacheElements();
    this.populateSelectors();
    this.bindEvents();
    this.syncPartyCount();
  }

  private cacheElements(): void {
    if (!this.overlayEl) return;
    this.chkCollision = this.overlayEl.querySelector('#chkCollision');
    this.inputSeed = this.overlayEl.querySelector('#inputSeed');
    this.lblPlayerPos = this.overlayEl.querySelector('#lblPlayerPos');
    this.lblChunkPos = this.overlayEl.querySelector('#lblChunkPos');
    this.lblActiveChunks = this.overlayEl.querySelector('#lblActiveChunks');
    this.insCoords = this.overlayEl.querySelector('#insCoords');
    this.insTerrain = this.overlayEl.querySelector('#insTerrain');
    this.insTileId = this.overlayEl.querySelector('#insTileId');
    this.insEcologyZone = this.overlayEl.querySelector('#insEcologyZone');
    this.insEcologyMFD = this.overlayEl.querySelector('#insEcologyMFD');
    this.insChunkStats = this.overlayEl.querySelector('#insChunkStats');
    this.rowBerryInfo = this.overlayEl.querySelector('#rowBerryInfo');
    this.insBerryVal = this.overlayEl.querySelector('#insBerryVal');
    this.lblFps = this.overlayEl.querySelector('#lblFps');
    this.lblPartyCount = this.overlayEl.querySelector('#lblPartyCount');
  }

  private populateSelectors(): void {
    if (!this.overlayEl) return;

    // 1. Species selectors (Party & Bot)
    const allSpecies = [...pokemonCatalog.getAll()].sort((a, b) => a.id - b.id);
    const selectPartySpecies =
      this.overlayEl.querySelector<HTMLSelectElement>('#selectPartySpecies');
    const selectBotSpecies = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotSpecies');

    const speciesOptions = allSpecies
      .map(
        (p) =>
          `<option value="${p.speciesKey}" ${p.speciesKey === 'CHARIZARD' ? 'selected' : ''}>#${String(p.id).padStart(3, '0')} ${p.name}</option>`
      )
      .join('');

    if (selectPartySpecies) selectPartySpecies.innerHTML = speciesOptions;
    if (selectBotSpecies) {
      selectBotSpecies.innerHTML = allSpecies
        .map(
          (p) =>
            `<option value="${p.speciesKey}" ${p.speciesKey === 'GENGAR' ? 'selected' : ''}>#${String(p.id).padStart(3, '0')} ${p.name}</option>`
        )
        .join('');
    }

    // 2. Bot Abilities
    const selectBotAbility = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotAbility');
    if (selectBotAbility) {
      const keyAbilities = [
        { id: 'innerfocus', label: 'innerfocus - Tinh Thần Bất Khuất (Chống Flinch)' },
        { id: 'owntempo', label: 'owntempo - Nhịp Điệu Riêng (Chống Rối Loạn)' },
        { id: 'steadfast', label: 'steadfast - Ý Chí Kiên Định (+Speed khi Flinch)' },
        { id: 'intimidate', label: 'intimidate - Đe Dọa (-Công đối thủ)' },
        { id: 'levitate', label: 'levitate - Bay Lượn (Miễn Đất)' },
        { id: 'static', label: 'static - Tĩnh Điện (Gây Tê Liệt)' },
        { id: 'flamebody', label: 'flamebody - Thân Bỏng (Gây Bỏng)' },
        { id: 'poisonpoint', label: 'poisonpoint - Gai Độc (Gây Độc)' },
        { id: 'wonderguard', label: 'wonderguard - Vệ Tinh Bí Ẩn' },
        { id: 'sturdy', label: 'sturdy - Vững Chãi (Sống sót 1 HP)' },
        { id: 'magicguard', label: 'magicguard - Lá Chắn Ma Thuật' },
        { id: 'technician', label: 'technician - Kỹ Thuật Viên' },
        { id: 'speedboost', label: 'speedboost - Tăng Tốc Độ' },
        { id: 'cutecharm', label: 'cutecharm - Quyến Rũ' },
      ];
      const otherAbilities = Object.entries(ABILITY_NAMES_VI)
        .filter(([k]) => !keyAbilities.some((ka) => ka.id === k))
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([id, vi]) => ({ id, label: `${id} - ${vi}` }));

      selectBotAbility.innerHTML = [
        `<option value="auto" selected>🌟 Tự động theo loài</option>`,
        `<optgroup label="Đặc tính quan trọng / Test">`,
        ...keyAbilities.map((a) => `<option value="${a.id}">${a.label}</option>`),
        `</optgroup>`,
        `<optgroup label="Tất cả đặc tính khác">`,
        ...otherAbilities.map((a) => `<option value="${a.id}">${a.label}</option>`),
        `</optgroup>`,
      ].join('');
    }

    // 3. Bot Moves (4 selects)
    const selectBotMove1 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove1');
    const selectBotMove2 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove2');
    const selectBotMove3 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove3');
    const selectBotMove4 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove4');
    const moveSelects = [selectBotMove1, selectBotMove2, selectBotMove3, selectBotMove4];

    const allMoves = getAllMoves().sort((a, b) =>
      (a.nameVi || a.name).localeCompare(b.nameVi || b.name)
    );
    const movesOptionsHtml = [
      `<option value="">-- Mặc định --</option>`,
      ...allMoves.map(
        (m) =>
          `<option value="${m.id}">${m.nameVi ? `${m.nameVi} (${m.name})` : m.name} [${m.type}]</option>`
      ),
    ].join('');

    for (const sel of moveSelects) {
      if (sel) sel.innerHTML = movesOptionsHtml;
    }
    if (selectBotMove1) selectBotMove1.value = 'fake_out';
    if (selectBotMove2) selectBotMove2.value = 'confuse_ray';
    if (selectBotMove3) selectBotMove3.value = 'bite';
    if (selectBotMove4) selectBotMove4.value = 'thunderbolt';

    // 4. Bag Items selector
    const selectBagItem = this.overlayEl.querySelector<HTMLSelectElement>('#selectBagItem');
    if (selectBagItem) {
      const allItems = getAllItems().sort((a, b) =>
        (a.nameVi || a.name).localeCompare(b.nameVi || b.name)
      );
      selectBagItem.innerHTML = allItems
        .map(
          (it) =>
            `<option value="${it.id}" ${it.id === 'persim-berry' ? 'selected' : ''}>${it.nameVi ? `${it.nameVi} (${it.name})` : it.name}</option>`
        )
        .join('');
    }
  }

  private bindEvents(): void {
    if (!this.overlayEl) return;

    // Toggle / Fullscreen
    const btnToggle = this.overlayEl.querySelector<HTMLButtonElement>('#btnToggleOverlay');
    btnToggle?.addEventListener('click', () => {
      this.overlayEl?.classList.toggle('collapsed');
      btnToggle.innerText = this.overlayEl?.classList.contains('collapsed') ? '⚙️' : '✕';
    });

    const btnFullscreen = this.overlayEl.querySelector<HTMLButtonElement>('#btnToggleFullscreen');
    btnFullscreen?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // Seed & World action buttons
    const btnRandomSeed = this.overlayEl.querySelector<HTMLButtonElement>('#btnRandomSeed');
    btnRandomSeed?.addEventListener('click', () => {
      const nextSeed = defaultRng.nextInt(100, 99999);
      if (this.inputSeed) this.inputSeed.value = String(nextSeed);
      this.bridge.regenerateMap(nextSeed);
    });

    const btnRegenerate = this.overlayEl.querySelector<HTMLButtonElement>('#btnRegenerate');
    btnRegenerate?.addEventListener('click', () => {
      const seed = parseInt(this.inputSeed?.value || '101', 10) || 101;
      this.bridge.regenerateMap(seed);
    });

    const btnResetPlayer = this.overlayEl.querySelector<HTMLButtonElement>('#btnResetPlayer');
    btnResetPlayer?.addEventListener('click', () => {
      this.bridge.resetPlayerPosition();
    });

    const btnReplayIntro = this.overlayEl.querySelector<HTMLButtonElement>('#btnReplayIntro');
    btnReplayIntro?.addEventListener('click', () => {
      this.bridge.replayIntro();
    });

    // Layer checkboxes
    const layerCheckboxes = [
      { id: '#chkHills', key: 'showHills' },
      { id: '#chkRoad', key: 'showRoad' },
      { id: '#chkBeach', key: 'showBeach' },
      { id: '#chkTrees', key: 'showTrees' },
      { id: '#chkChunkGrid', key: 'showChunkGrid' },
      { id: '#chkCollision', key: 'showCollision' },
      { id: '#chkHitbox', key: 'showHitbox' },
      { id: '#chkGrid', key: 'showGrid' },
      { id: '#chkTallGrass', key: 'showTallGrass' },
      { id: '#chkPlants', key: 'showPlants' },
      { id: '#chkBerries', key: 'showBerries' },
      { id: '#chkHeatmap', key: 'showHeatmap' },
      { id: '#chkEcologyMoisture', key: 'showEcologyMoisture' },
      { id: '#chkEcologyFertility', key: 'showEcologyFertility' },
      { id: '#chkEcologyDensity', key: 'showEcologyDensity' },
      { id: '#chkEcologyZone', key: 'showEcologyZone' },
    ];
    for (const item of layerCheckboxes) {
      const chk = this.overlayEl.querySelector<HTMLInputElement>(item.id);
      chk?.addEventListener('change', () => {
        this.bridge.setRenderOption(item.key, chk.checked);
      });
    }

    // Berry cycle & Stage overrides
    const selectBerryCycle = this.overlayEl.querySelector<HTMLSelectElement>('#selectBerryCycle');
    selectBerryCycle?.addEventListener('change', () => {
      const sec = parseInt(selectBerryCycle.value, 10) || 60;
      this.bridge.setBerryCycle(sec);
    });

    const berryStageButtons =
      this.overlayEl.querySelectorAll<HTMLButtonElement>('.btn-berry-stage');
    berryStageButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        berryStageButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const st = btn.dataset.stage;
        this.bridge.setBerryStageOverride(st === 'auto' ? null : parseInt(st || '0', 10));
      });
    });

    // Battle trigger (standard test battle)
    const btnTestBattle = this.overlayEl.querySelector<HTMLButtonElement>('#btnTestBattle');
    const selectBattleShiny = this.overlayEl.querySelector<HTMLSelectElement>('#selectBattleShiny');
    const selectBattleOverlay =
      this.overlayEl.querySelector<HTMLSelectElement>('#selectBattleOverlay');
    btnTestBattle?.addEventListener('click', () => {
      const overlay = selectBattleOverlay?.value || 'auto';
      const isShiny = selectBattleShiny?.value === 'shiny';
      this.bridge.startTestBattle(overlay, isShiny);
    });

    // Custom Bot Battle Spawner
    this.bindBotControls();

    // Party Controls
    this.bindPartyControls();

    // Bag Controls
    this.bindBagControls();

    // Subscribe to party changes
    if (this.bridge.subscribePartyChange) {
      const unsub = this.bridge.subscribePartyChange(() => this.syncPartyCount());
      this.cleanupFns.push(unsub);
    }
  }

  private bindBotControls(): void {
    if (!this.overlayEl) return;
    const selectBotSpecies = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotSpecies');
    const selectBotForm = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotForm');
    const inputBotLevel = this.overlayEl.querySelector<HTMLInputElement>('#inputBotLevel');
    const selectBotAbility = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotAbility');
    const selectBotMove1 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove1');
    const selectBotMove2 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove2');
    const selectBotMove3 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove3');
    const selectBotMove4 = this.overlayEl.querySelector<HTMLSelectElement>('#selectBotMove4');
    const selectBattleOverlay =
      this.overlayEl.querySelector<HTMLSelectElement>('#selectBattleOverlay');

    const btnPresetFlinch = this.overlayEl.querySelector<HTMLButtonElement>('#btnPresetFlinch');
    const btnPresetConfusion = this.overlayEl.querySelector<HTMLButtonElement>('#btnPresetConfusion');
    const btnPresetStatus = this.overlayEl.querySelector<HTMLButtonElement>('#btnPresetStatus');
    const btnPresetDamage = this.overlayEl.querySelector<HTMLButtonElement>('#btnPresetDamage');
    const btnStartBotBattle = this.overlayEl.querySelector<HTMLButtonElement>('#btnStartBotBattle');

    btnPresetFlinch?.addEventListener('click', () => {
      if (selectBotMove1) selectBotMove1.value = 'fake_out';
      if (selectBotMove2) selectBotMove2.value = 'bite';
      if (selectBotMove3) selectBotMove3.value = 'air_slash';
      if (selectBotMove4) selectBotMove4.value = 'iron_head';
      showBerryToast(
        '⚡ Đã chọn bộ chiêu Nao núng (Fake Out, Bite, Air Slash, Iron Head)!',
        '#38bdf8'
      );
    });

    btnPresetConfusion?.addEventListener('click', () => {
      if (selectBotMove1) selectBotMove1.value = 'confuse_ray';
      if (selectBotMove2) selectBotMove2.value = 'sweet_kiss';
      if (selectBotMove3) selectBotMove3.value = 'swagger';
      if (selectBotMove4) selectBotMove4.value = 'water_pulse';
      showBerryToast(
        '🌀 Đã chọn bộ chiêu Rối loạn (Confuse Ray, Sweet Kiss, Swagger, Water Pulse)!',
        '#a855f7'
      );
    });

    btnPresetStatus?.addEventListener('click', () => {
      if (selectBotMove1) selectBotMove1.value = 'thunder_wave';
      if (selectBotMove2) selectBotMove2.value = 'toxic';
      if (selectBotMove3) selectBotMove3.value = 'spore';
      if (selectBotMove4) selectBotMove4.value = 'protect';
      showBerryToast(
        '💤 Đã chọn bộ chiêu Trạng thái (Thunder Wave, Toxic, Spore, Protect)!',
        '#10b981'
      );
    });

    btnPresetDamage?.addEventListener('click', () => {
      if (selectBotMove1) selectBotMove1.value = 'thunderbolt';
      if (selectBotMove2) selectBotMove2.value = 'flamethrower';
      if (selectBotMove3) selectBotMove3.value = 'ice_beam';
      if (selectBotMove4) selectBotMove4.value = 'earthquake';
      showBerryToast('💥 Đã chọn bộ chiêu Sát thương cao!', '#ef4444');
    });

    btnStartBotBattle?.addEventListener('click', () => {
      const speciesKey = selectBotSpecies?.value || 'GENGAR';
      const level = Math.max(1, Math.min(100, parseInt(inputBotLevel?.value || '50', 10) || 50));
      const isShiny = selectBotForm?.value === 'shiny';
      const abilityVal = selectBotAbility?.value;
      const ability = abilityVal && abilityVal !== 'auto' ? abilityVal : undefined;

      const moves = [
        selectBotMove1?.value,
        selectBotMove2?.value,
        selectBotMove3?.value,
        selectBotMove4?.value,
      ].filter(Boolean) as string[];

      const overlay = selectBattleOverlay?.value || 'auto';

      this.bridge.startCustomBotBattle({
        speciesKey,
        level,
        isShiny,
        ability,
        moves,
        overlay,
      });
    });
  }

  private bindPartyControls(): void {
    if (!this.overlayEl) return;
    const selectPartySpecies =
      this.overlayEl.querySelector<HTMLSelectElement>('#selectPartySpecies');
    const selectPartyForm = this.overlayEl.querySelector<HTMLSelectElement>('#selectPartyForm');
    const inputPartyLevel = this.overlayEl.querySelector<HTMLInputElement>('#inputPartyLevel');

    const btnAddPartyPokemon = this.overlayEl.querySelector<HTMLButtonElement>('#btnAddPartyPokemon');
    const btnAddRandomPartyPokemon = this.overlayEl.querySelector<HTMLButtonElement>(
      '#btnAddRandomPartyPokemon'
    );
    const btnFillPartyPokemon =
      this.overlayEl.querySelector<HTMLButtonElement>('#btnFillPartyPokemon');
    const btnResetPartyPokemon =
      this.overlayEl.querySelector<HTMLButtonElement>('#btnResetPartyPokemon');
    const btnSpawnShinyWild = this.overlayEl.querySelector<HTMLButtonElement>('#btnSpawnShinyWild');

    btnAddPartyPokemon?.addEventListener('click', () => {
      const speciesKey = selectPartySpecies?.value || 'PIKACHU';
      const level = Math.max(1, Math.min(100, parseInt(inputPartyLevel?.value || '25', 10) || 25));
      const isShiny = selectPartyForm?.value === 'shiny';
      this.bridge.addPartyPokemon(speciesKey, level, isShiny);
    });

    btnAddRandomPartyPokemon?.addEventListener('click', () => {
      const isShiny = selectPartyForm?.value === 'shiny';
      this.bridge.addRandomPartyPokemon(isShiny);
    });

    btnFillPartyPokemon?.addEventListener('click', () => {
      const isShiny = selectPartyForm?.value === 'shiny';
      this.bridge.fillPartyPokemon(isShiny);
    });

    btnResetPartyPokemon?.addEventListener('click', () => {
      this.bridge.resetPartyPokemon();
    });

    btnSpawnShinyWild?.addEventListener('click', () => {
      const speciesKey = selectPartySpecies?.value;
      this.bridge.spawnShinyWild(speciesKey);
    });
  }

  private bindBagControls(): void {
    if (!this.overlayEl) return;
    const btnOpenBagDirect = this.overlayEl.querySelector<HTMLButtonElement>('#btnOpenBagDirect');
    const btnAddStarterItems = this.overlayEl.querySelector<HTMLButtonElement>('#btnAddStarterItems');
    const btnAddAllBalls = this.overlayEl.querySelector<HTMLButtonElement>('#btnAddAllBalls');

    const selectBagItem = this.overlayEl.querySelector<HTMLSelectElement>('#selectBagItem');
    const inputBagItemCount = this.overlayEl.querySelector<HTMLInputElement>('#inputBagItemCount');
    const btnAddCustomBagItem =
      this.overlayEl.querySelector<HTMLButtonElement>('#btnAddCustomBagItem');
    const btnQuickAddPersim = this.overlayEl.querySelector<HTMLButtonElement>('#btnQuickAddPersim');
    const btnQuickAddLum = this.overlayEl.querySelector<HTMLButtonElement>('#btnQuickAddLum');
    const btnQuickAddFullRestore =
      this.overlayEl.querySelector<HTMLButtonElement>('#btnQuickAddFullRestore');
    const btnQuickAddRareCandy =
      this.overlayEl.querySelector<HTMLButtonElement>('#btnQuickAddRareCandy');

    btnOpenBagDirect?.addEventListener('click', () => {
      this.bridge.openBag();
    });

    btnAddStarterItems?.addEventListener('click', () => {
      this.bridge.addStarterItems();
    });

    btnAddAllBalls?.addEventListener('click', () => {
      this.bridge.addAllBalls();
    });

    btnAddCustomBagItem?.addEventListener('click', () => {
      const itemId = selectBagItem?.value;
      if (!itemId) return;
      const count = Math.max(1, Math.min(999, parseInt(inputBagItemCount?.value || '10', 10) || 10));
      this.bridge.addItemToBag(itemId, count);
      const itemDef = getItemById(itemId) || findItem(itemId);
      const itemName = itemDef?.nameVi || itemDef?.name || itemId;
      showBerryToast(`🎒 Đã thêm +${count} ${itemName} vào túi đồ!`, '#10b981');
    });

    btnQuickAddPersim?.addEventListener('click', () => {
      this.bridge.addItemToBag('persim-berry', 10);
      showBerryToast('🫐 Đã thêm +10 Quả Persim Berry (Trị Rối Loạn) vào túi đồ!', '#10b981');
    });

    btnQuickAddLum?.addEventListener('click', () => {
      this.bridge.addItemToBag('lum-berry', 10);
      showBerryToast('🍈 Đã thêm +10 Quả Lum Berry (Trị Mọi Trạng Thái) vào túi đồ!', '#10b981');
    });

    btnQuickAddFullRestore?.addEventListener('click', () => {
      this.bridge.addItemToBag('full-restore', 10);
      showBerryToast('💊 Đã thêm +10 Thuốc Full Restore vào túi đồ!', '#10b981');
    });

    btnQuickAddRareCandy?.addEventListener('click', () => {
      this.bridge.addItemToBag('rare-candy', 20);
      showBerryToast('🍬 Đã thêm +20 Kẹo Hiếm (Rare Candy) vào túi đồ!', '#10b981');
    });
  }

  public syncPartyCount(): void {
    if (!this.lblPartyCount) return;
    const size = this.bridge.getPartySize();
    this.lblPartyCount.innerText = `${size} / 6`;
    this.lblPartyCount.style.color = size >= 6 ? '#f87171' : '#93c5fd';
  }

  public setVisible(visible: boolean): void {
    if (this.overlayEl) {
      this.overlayEl.style.display = visible ? '' : 'none';
    }
  }

  public toggleCollapse(): void {
    if (!this.overlayEl) return;
    this.overlayEl.classList.toggle('collapsed');
    const btn = this.overlayEl.querySelector<HTMLButtonElement>('#btnToggleOverlay');
    if (btn) {
      btn.innerText = this.overlayEl.classList.contains('collapsed') ? '⚙️' : '✕';
    }
  }

  public isCollapsed(): boolean {
    return this.overlayEl?.classList.contains('collapsed') ?? false;
  }

  public isCollisionEnabled(): boolean {
    return this.chkCollision ? this.chkCollision.checked : true;
  }

  public updateTick(info: DebugMonitorUpdate): void {
    if (this.lblPlayerPos) {
      this.lblPlayerPos.innerText = `[${info.playerGx}, ${info.playerGy}] (${Math.round(info.playerX)}, ${Math.round(info.playerY)}px)`;
    }
    if (this.lblChunkPos) {
      this.lblChunkPos.innerText = `[${info.chunkX}, ${info.chunkY}]`;
    }
    if (this.lblActiveChunks) {
      this.lblActiveChunks.innerText = `${info.activeChunksCount} chunks`;
    }
    if (this.lblFps) {
      this.lblFps.innerText = `${info.fps} FPS`;
    }
  }

  public updateMouseInspector(
    gx: number,
    gy: number,
    chunkManager: ChunkManager,
    renderer: GameRenderer
  ): void {
    if (!this.overlayEl || this.overlayEl.style.display === 'none') return;
    const tile = chunkManager.getTileData(gx, gy);
    if (this.insCoords) this.insCoords.innerText = `[${gx}, ${gy}]`;
    if (this.insTerrain) {
      this.insTerrain.innerText = tile.tallGrass
        ? 'Bụi cỏ cao GBA'
        : TERRAIN_NAMES[tile.terrain] || 'Chưa rõ';
    }
    if (this.insTileId) this.insTileId.innerText = `#${tile.tileId}`;

    const sample = sampleEcology(gx, gy, chunkManager.currentSeed);
    const zone = getEcologyZone(sample);
    if (this.insEcologyZone) this.insEcologyZone.innerText = zone;
    if (this.insEcologyMFD) {
      this.insEcologyMFD.innerText = `M: ${sample.moisture.toFixed(2)} | F: ${sample.fertility.toFixed(2)} | D: ${sample.density.toFixed(2)}`;
    }

    const cx = Math.floor(gx / 16);
    const cy = Math.floor(gy / 16);
    const currentChunk =
      chunkManager.cache.get(`${cx},${cy}`) ||
      chunkManager.activeChunks.find((c) => c.cx === cx && c.cy === cy);
    if (this.insChunkStats) {
      if (currentChunk) {
        this.insChunkStats.innerText = `🌲 ${currentChunk.trees?.length ?? 0} | 🌸 ${currentChunk.plants?.length ?? 0} | 🫐 ${currentChunk.berryBushes?.length ?? 0} | 🌿 ${currentChunk.tallGrass?.length ?? 0} | 🐾 ${currentChunk.wildPokemon?.length ?? 0}`;
      } else {
        this.insChunkStats.innerText = '--';
      }
    }

    // Find hovered berry bush
    let hoveredBush: BerryBushEntity | null = null;
    for (const chunk of chunkManager.activeChunks) {
      if (!chunk.berryBushes) continue;
      for (const b of chunk.berryBushes) {
        if ((b.gx === gx && b.gy === gy) || (b.gx === gx && b.gy - 1 === gy)) {
          hoveredBush = b;
          break;
        }
      }
      if (hoveredBush) break;
    }

    if (hoveredBush && this.rowBerryInfo && this.insBerryVal) {
      const now = Date.now();
      const cycleSec = renderer.getBerryCycle();
      const cycleMs = cycleSec * 1000;
      const elapsedMs = (((now - hoveredBush.plantedAt) % cycleMs) + cycleMs) % cycleMs;
      const progress = elapsedMs / cycleMs;
      const override = renderer.getBerryStageOverride();
      const stage =
        override !== null ? override : (Math.min(3, Math.floor(progress * 4)) as 0 | 1 | 2 | 3);
      const stageInfo = BERRY_STAGES[stage];
      const elapsedSec = Math.floor(elapsedMs / 1000);

      this.rowBerryInfo.style.display = 'flex';
      this.insBerryVal.innerText = `${hoveredBush.viName} [${stageInfo.icon} ${stageInfo.name}] (${elapsedSec}s/${cycleSec}s)`;
      this.insBerryVal.style.color = hoveredBush.color;
    } else if (this.rowBerryInfo) {
      this.rowBerryInfo.style.display = 'none';
    }
  }

  public destroy(): void {
    for (const fn of this.cleanupFns) {
      try {
        fn();
      } catch {}
    }
    this.cleanupFns = [];
    if (this.overlayEl) {
      this.overlayEl.remove();
      this.overlayEl = null;
    }
  }
}
