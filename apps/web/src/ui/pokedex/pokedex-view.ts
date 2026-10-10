import type { PokemonSpeciesData } from '@pokemon/shared-types';
import type { BattleMove } from '../../battle/types';
import { MOVES_DB } from '../../battle/moves-db';
import type { ItemData } from '../../data/items-db';
import { TYPE_INDICES, TypeBadgeRenderer } from './pokedex-sprite';
import { getEvolutionChain } from './pokedex-evolution';
import { getPokemonHabitat } from './pokedex-habitat';
import { getMoveCategoryLabel } from './pokedex-moves';
import { getItemPocketName } from './pokedex-items';
import type { PokedexInfoSubTab, PokedexTab, PokedexViewMode } from './pokedex-state';
import { POKEDEX_ASSETS, MOVE_ASSETS, ITEM_ASSETS, HABITAT_ASSETS } from '../../assets';
import { getAbilityDisplay } from '../../battle/rules/ability-engine';

export interface PokedexViewElements {
  rootModal: HTMLElement;
  screenList: HTMLElement;
  screenInfo: HTMLElement;
  panelPokemon: HTMLElement;
  panelMoves: HTMLElement;
  panelItems: HTMLElement;
  searchInput: HTMLInputElement;
  clearSearchBtn: HTMLButtonElement;
  btnClose: HTMLButtonElement;
  btnInfoClose: HTMLButtonElement;
  btnInfoBack: HTMLButtonElement;
  btnInfoTabBio: HTMLButtonElement;
  btnInfoTabMoves: HTMLButtonElement;
  listPreviewBox: HTMLElement;
  listItemsContainer: HTMLElement;
  listSliderTrack: HTMLElement;
  listSliderHandle: HTMLElement;
  canvasListSprite: HTMLCanvasElement;
  canvasInfoSprite: HTMLCanvasElement;
  infoMovesList: HTMLElement;
}

export class PokedexView {
  public elements!: PokedexViewElements;
  private isCreated = false;

  public init(): PokedexViewElements {
    if (this.isCreated) return this.elements;

    const backdrop = document.createElement('div');
    backdrop.id = 'pokedexRetroBackdrop';
    backdrop.className = 'pokedex-retro-backdrop';

    backdrop.innerHTML = `
      <div class="pokedex-retro-wrapper" id="pokedexRetroWrapper">
        <!-- 1. Screen List (bg_list.png - 512x384) -->
        <div class="pokedex-screen pokedex-screen-list" id="pokedexScreenList">
          <!-- Left Header Navigation Tabs (Pokémon, Chiêu thức, Vật phẩm) -->
          <div class="pokedex-header-nav-tabs" id="pokedexHeaderNavTabs">
            <button class="pokedex-nav-tab active" data-tab="pokemon" id="tabPokemon" title="Danh lục Pokémon">
              <img src="${POKEDEX_ASSETS.tabPokemon}" class="pokedex-tab-icon" alt="Pokémon" />
              <span class="pokedex-tab-label">Pokémon</span>
            </button>
            <button class="pokedex-nav-tab" data-tab="moves" id="tabMoves" title="Danh lục Chiêu thức">
              <img src="${POKEDEX_ASSETS.tabMoves}" class="pokedex-tab-icon" alt="Chiêu thức" />
              <span class="pokedex-tab-label">Chiêu thức</span>
            </button>
            <button class="pokedex-nav-tab" data-tab="items" id="tabItems" title="Danh lục Vật phẩm">
              <img src="${POKEDEX_ASSETS.tabItems}" class="pokedex-tab-icon" alt="Vật phẩm" />
              <span class="pokedex-tab-label">Vật phẩm</span>
            </button>
          </div>

          <!-- Integrated Search Bar in the top black header area -->
          <div class="pokedex-retro-search-bar" id="pokedexRetroSearchBar">
            <img src="${POKEDEX_ASSETS.searchIcon}" class="pokedex-search-icon-img" alt="Tìm kiếm" />
            <input type="text" id="inputPokedexSearch" placeholder="Tìm tên hoặc số hiệu..." autocomplete="off" />
            <button class="btn-clear-search" id="btnClearSearch" title="Xóa tìm kiếm">✕</button>
          </div>

          <!-- Integrated Close Button in the top black header area -->
          <button class="pokedex-retro-close" id="btnPokedexRetroClose" title="Đóng Pokédex (Esc)">✕</button>
          <!-- Left Panels Container -->
          <div class="list-left-panel" id="panelPokemon">
            <!-- Top Left Card: No. & Name (x: 28..195, y: 54..81) -->
            <div class="list-left-header" id="listLeftHeader">
              <img src="${POKEDEX_ASSETS.iconOwn}" class="list-own-icon" alt="Caught" />
              <span class="list-header-title" id="listLeftTitle">No. 001 Bulbasaur</span>
            </div>

            <!-- Middle Left: Sprite Canvas Preview on Watermark Grid (x: 10..223, y: 88..304) -->
            <div class="list-preview-box" id="listPreviewBox" title="Nhấn để xem chi tiết (Enter)">
              <canvas id="canvasListSprite" class="pokedex-canvas-sprite list-sprite-canvas"></canvas>
              <div class="list-pokemon-types" id="listPokemonTypes"></div>
            </div>

            <!-- Bottom Left Card: Seen & Caught Counters (x: 24..199, y: 310..369) -->
            <div class="list-counters-box" id="listCountersBox">
              <div class="counter-row">
                <div class="counter-left-group">
                  <img src="${POKEDEX_ASSETS.iconSeen}" class="counter-mini-icon" alt="Seen" />
                  <span class="counter-label">ĐÃ THẤY</span>
                </div>
                <strong class="counter-value" id="countSeen">151</strong>
              </div>
              <div class="counter-row">
                <div class="counter-left-group">
                  <img src="${POKEDEX_ASSETS.iconOwn}" class="counter-mini-icon" alt="Caught" />
                  <span class="counter-label">ĐÃ BẮT</span>
                </div>
                <strong class="counter-value" id="countCaught">151</strong>
              </div>
            </div>
          </div>

          <!-- Moves Left Panel (Display when Chiêu thức tab is active) -->
          <div class="list-left-panel" id="panelMoves" style="display: none;">
            <div class="list-left-header move-left-header" id="moveLeftHeader">
              <div class="move-header-name-group">
                <span class="move-header-title-vi" id="moveLeftTitleVi">Súng Phun Lửa</span>
                <span class="move-header-title-en" id="moveLeftTitleEn">Flamethrower</span>
              </div>
            </div>

            <div class="list-preview-box move-preview-box" id="movePreviewBox">
              <div class="move-disc-wrapper">
                <img id="moveMachineImg" class="move-machine-img" src="${MOVE_ASSETS.getMachineDisc('FIRE')}" alt="TM Disc" />
              </div>
              <div class="move-badges-row">
                <div class="move-badge-col">
                  <div class="move-badge-scaled-wrapper">
                    <canvas id="moveTypeCanvas" class="list-type-badge"></canvas>
                  </div>
                </div>
                <div class="move-badge-col">
                  <div class="move-badge-scaled-wrapper">
                    <div id="moveCategoryBadge" class="move-category-badge special" title="Đặc biệt"></div>
                  </div>
                  <span class="move-category-label special" id="moveCategoryLabel">Đặc biệt</span>
                </div>
              </div>
              <div class="move-specs-grid">
                <div class="move-spec-pill">
                  <span class="spec-k">UY LỰC</span>
                  <strong class="spec-v" id="movePower">90</strong>
                </div>
                <div class="move-spec-pill">
                  <span class="spec-k">CHÍNH XÁC</span>
                  <strong class="spec-v" id="moveAccuracy">100%</strong>
                </div>
                <div class="move-spec-pill">
                  <span class="spec-k">ĐIỂM PP</span>
                  <strong class="spec-v" id="movePP">15/15</strong>
                </div>
              </div>
            </div>

            <div class="list-counters-box move-desc-box" id="moveDescBox">
              <div class="move-desc-title">HIỆU ỨNG CHIÊU THỨC</div>
              <div class="move-desc-content" id="moveDescContent">
                Bắn ra ngọn lửa dữ dội thiêu đốt mục tiêu.
              </div>
            </div>
          </div>

          <!-- Items Left Panel (Display when Vật phẩm tab is active) -->
          <div class="list-left-panel" id="panelItems" style="display: none;">
            <div class="list-left-header item-left-header" id="itemLeftHeader">
              <div class="item-header-name-group">
                <span class="item-header-title-vi" id="itemLeftTitleVi">Thuốc Hồi Phục</span>
                <span class="item-header-title-en" id="itemLeftTitleEn">Potion</span>
              </div>
            </div>

            <div class="list-preview-box item-preview-box" id="itemPreviewBox">
              <div class="item-icon-wrapper">
                <img id="itemSpriteImg" class="item-preview-img" src="${ITEM_ASSETS.defaultPotion}" alt="Item Sprite" />
              </div>
              <div class="item-badges-row">
                <span class="item-category-tag" id="itemCategoryBadge">Dược phẩm & Hồi máu</span>
              </div>
              <div class="item-specs-grid">
                <div class="item-spec-pill">
                  <span class="spec-k">PHÂN LOẠI</span>
                  <strong class="spec-v" id="itemCategoryCode">Medicine</strong>
                </div>
                <div class="item-spec-pill">
                  <span class="spec-k">NGĂN CHỨA</span>
                  <strong class="spec-v" id="itemPocketName">Dược Phẩm</strong>
                </div>
              </div>
            </div>

            <div class="list-counters-box item-desc-box" id="itemDescBox">
              <div class="item-desc-title">CÔNG DỤNG & HIỆU QUẢ</div>
              <div class="item-desc-content" id="itemDescContent">
                Hồi phục 20 điểm HP cho một Pokémon đang bị thương.
              </div>
            </div>
          </div>

          <!-- Right: 7-Row List Items (x: 240..484, y: 58..366) -->
          <div class="list-items-container" id="listItemsContainer"></div>

          <!-- Right Scrollbar Slider (x: 478, y: 72..351, height: 279px) -->
          <div class="list-slider-track" id="listSliderTrack">
            <div class="list-slider-handle" id="listSliderHandle"></div>
          </div>
        </div>

        <!-- 2. Screen Info / Detail (bg_info.PNG - 512x384) -->
        <div class="pokedex-screen pokedex-screen-info" id="pokedexScreenInfo" style="display: none;">
          <!-- Top Tab Navigation Bar (advancedInfoBar.png - 512x32) -->
          <div class="info-top-bar">
            <button class="info-tab-btn" id="btnInfoBack">◀ Danh sách</button>
            <div class="info-mode-nav" id="infoModeNav">
              <button class="info-mode-tab active" id="btnInfoTabBio" data-tab="bio">Chỉ số & Sinh học</button>
              <button class="info-mode-tab" id="btnInfoTabMoves" data-tab="moves">Chiêu thức học được</button>
            </div>
            <button class="info-tab-btn" id="btnInfoClose">Đóng [✕]</button>
          </div>

          <!-- Top Meta Box (y: 40..104px, x: 20..492px) -->
          <div class="info-meta-box">
            <div class="info-meta-top-row">
              <div class="info-num-name">
                <span class="info-pkmn-id" id="infoPkmnId">No. 025</span>
                <span class="info-pkmn-name" id="infoPkmnName">PIKACHU</span>
              </div>
              <div class="info-evo-chain" id="infoEvoChain"></div>
            </div>
            <div class="info-types-row" id="infoTypesRow"></div>
          </div>

          <!-- Middle Left: Large Sprite with habitat backdrop and base (y: 60..212px, x: 18..190px) -->
          <div class="info-sprite-box">
            <img id="infoHabitatBg" class="info-habitat-bg" alt="Môi trường sống" />
            <img id="infoHabitatBase" class="info-habitat-base" alt="Nền môi trường" />
            <canvas id="canvasInfoSprite" class="pokedex-canvas-sprite"></canvas>
          </div>

          <!-- Middle Center: HW Icon (y: 124..185px, x: 212..273px) -->
          <div class="info-hw-box">
            <img src="${POKEDEX_ASSETS.iconHw}" class="icon-hw-img" alt="Height Weight" />
          </div>

          <!-- Middle Right: Physical Specs (y: 162..217px, x: 300..493px) -->
          <div class="info-specs-box">
            <div class="specs-text-column">
              <div class="spec-item">
                <span class="spec-label">Chiều cao:</span>
                <span class="spec-value" id="infoHeight">0.4 m</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Cân nặng:</span>
                <span class="spec-value" id="infoWeight">6.0 kg</span>
              </div>
            </div>
          </div>

          <!-- Bottom: Info & Stats (y: 242..365px, x: 36..475px) -->
          <div class="info-bottom-box">
            <!-- 1. Bio & Stats View -->
            <div class="info-bottom-split" id="infoTabContentBio">
              <!-- Left: Pokemon Research Info -->
              <div class="info-research-col">
                <div class="research-title">THÔNG TIN</div>
                <div class="research-item">
                  <span class="research-label">Hệ Gen:</span>
                  <span class="research-value">Gen 1 (Kanto)</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Loài:</span>
                  <span class="research-value" id="infoSpecies">Seed Pokémon</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Khả năng:</span>
                  <span class="research-value" id="infoAbility">Overgrow</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Tỉ lệ bắt:</span>
                  <span class="research-value" id="infoCatchRate">45</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Nhóm trứng:</span>
                  <span class="research-value" id="infoEggGroups">Monster, Grass</span>
                </div>
                <div class="research-item">
                  <span class="research-label">Giới tính:</span>
                  <span class="research-value" id="infoGender">♂87.5% ♀12.5%</span>
                </div>
              </div>
              <!-- Right: Vertical Stats -->
              <div class="info-stats-col">
                <div class="research-title">CHỈ SỐ (TỔNG: <span id="infoTotalStats" class="stat-bst-val">320</span>)</div>
                <div class="stat-row"><span class="stat-k">HP</span><div class="stat-bar"><div class="stat-fill" id="barHp"></div></div><strong id="statHp">35</strong></div>
                <div class="stat-row"><span class="stat-k">ATK</span><div class="stat-bar"><div class="stat-fill" id="barAtk"></div></div><strong id="statAtk">55</strong></div>
                <div class="stat-row"><span class="stat-k">DEF</span><div class="stat-bar"><div class="stat-fill" id="barDef"></div></div><strong id="statDef">40</strong></div>
                <div class="stat-row"><span class="stat-k">SP.A</span><div class="stat-bar"><div class="stat-fill" id="barSpAtk"></div></div><strong id="statSpAtk">50</strong></div>
                <div class="stat-row"><span class="stat-k">SP.D</span><div class="stat-bar"><div class="stat-fill" id="barSpDef"></div></div><strong id="statSpDef">50</strong></div>
                <div class="stat-row"><span class="stat-k">SPD</span><div class="stat-bar"><div class="stat-fill" id="barSpd"></div></div><strong id="statSpd">90</strong></div>
              </div>
            </div>

            <!-- 2. Learnset Moves View -->
            <div class="info-moves-content" id="infoTabContentMoves" style="display: none;">
              <div class="info-moves-header-row">
                <span class="im-col-lvl">CẤP</span>
                <span class="im-col-name">CHIÊU THỨC</span>
                <span class="im-col-type">HỆ</span>
                <span class="im-col-cat">LOẠI</span>
                <span class="im-col-pwr">LỰC</span>
                <span class="im-col-acc">CX</span>
                <span class="im-col-pp">PP</span>
              </div>
              <div class="info-moves-list" id="infoMovesList"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    this.elements = {
      rootModal: backdrop,
      screenList: backdrop.querySelector<HTMLElement>('#pokedexScreenList')!,
      screenInfo: backdrop.querySelector<HTMLElement>('#pokedexScreenInfo')!,
      panelPokemon: backdrop.querySelector<HTMLElement>('#panelPokemon')!,
      panelMoves: backdrop.querySelector<HTMLElement>('#panelMoves')!,
      panelItems: backdrop.querySelector<HTMLElement>('#panelItems')!,
      searchInput: backdrop.querySelector<HTMLInputElement>('#inputPokedexSearch')!,
      clearSearchBtn: backdrop.querySelector<HTMLButtonElement>('#btnClearSearch')!,
      btnClose: backdrop.querySelector<HTMLButtonElement>('#btnPokedexRetroClose')!,
      btnInfoClose: backdrop.querySelector<HTMLButtonElement>('#btnInfoClose')!,
      btnInfoBack: backdrop.querySelector<HTMLButtonElement>('#btnInfoBack')!,
      btnInfoTabBio: backdrop.querySelector<HTMLButtonElement>('#btnInfoTabBio')!,
      btnInfoTabMoves: backdrop.querySelector<HTMLButtonElement>('#btnInfoTabMoves')!,
      listPreviewBox: backdrop.querySelector<HTMLElement>('#listPreviewBox')!,
      listItemsContainer: backdrop.querySelector<HTMLElement>('#listItemsContainer')!,
      listSliderTrack: backdrop.querySelector<HTMLElement>('#listSliderTrack')!,
      listSliderHandle: backdrop.querySelector<HTMLElement>('#listSliderHandle')!,
      canvasListSprite: backdrop.querySelector<HTMLCanvasElement>('#canvasListSprite')!,
      canvasInfoSprite: backdrop.querySelector<HTMLCanvasElement>('#canvasInfoSprite')!,
      infoMovesList: backdrop.querySelector<HTMLElement>('#infoMovesList')!,
    };

    this.isCreated = true;
    return this.elements;
  }

  public show(): void {
    if (this.elements?.rootModal) {
      this.elements.rootModal.style.display = 'flex';
      this.updateResponsiveScale();
    }
  }

  public hide(): void {
    if (this.elements?.rootModal) {
      this.elements.rootModal.style.display = 'none';
    }
  }

  public updateResponsiveScale(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scaleX = (w - 32) / 512;
    const scaleY = (h - 32) / 384;
    const scale = Math.max(1, Math.min(scaleX, scaleY, 2.0));
    document.documentElement.style.setProperty('--pokedex-scale', scale.toFixed(2));
  }

  public setViewMode(mode: PokedexViewMode): void {
    if (!this.elements) return;
    this.elements.screenList.style.display = mode === 'list' ? 'block' : 'none';
    this.elements.screenInfo.style.display = mode === 'info' ? 'block' : 'none';
  }

  public setTab(tab: PokedexTab): void {
    if (!this.elements) return;

    const navTabs = this.elements.rootModal.querySelectorAll<HTMLButtonElement>('.pokedex-nav-tab');
    navTabs.forEach((t) => {
      if (t.dataset.tab === tab) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    this.elements.panelPokemon.style.display = tab === 'pokemon' ? 'block' : 'none';
    this.elements.panelMoves.style.display = tab === 'moves' ? 'block' : 'none';
    this.elements.panelItems.style.display = tab === 'items' ? 'block' : 'none';

    if (tab === 'pokemon') {
      this.elements.searchInput.placeholder = 'Tìm tên hoặc số hiệu...';
    } else if (tab === 'moves') {
      this.elements.searchInput.placeholder = 'Tìm chiêu thức (VD: Lửa, Surf, Tackle)...';
    } else {
      this.elements.searchInput.placeholder = 'Tìm vật phẩm (VD: Potion, Đá Lửa, Bóng)...';
    }
  }

  public setInfoSubTab(subTab: PokedexInfoSubTab): void {
    if (!this.elements) return;
    this.elements.btnInfoTabBio.classList.toggle('active', subTab === 'bio');
    this.elements.btnInfoTabMoves.classList.toggle('active', subTab === 'moves');

    const contentBio = this.elements.rootModal.querySelector<HTMLElement>('#infoTabContentBio');
    const contentMoves = this.elements.rootModal.querySelector<HTMLElement>('#infoTabContentMoves');

    if (contentBio) contentBio.style.display = subTab === 'bio' ? 'flex' : 'none';
    if (contentMoves) contentMoves.style.display = subTab === 'moves' ? 'flex' : 'none';
  }

  // --- Render Pokemon Tab ---
  public renderPokemonPreview(pokemon: PokemonSpeciesData | undefined, totalCount: number): void {
    if (!this.elements) return;

    const titleEl = this.elements.rootModal.querySelector<HTMLElement>('#listLeftTitle');
    if (titleEl) {
      titleEl.innerText = pokemon
        ? `No. ${String(pokemon.id).padStart(3, '0')} ${pokemon.name}`
        : 'Không tìm thấy';
    }

    const countSeen = this.elements.rootModal.querySelector<HTMLElement>('#countSeen');
    const countCaught = this.elements.rootModal.querySelector<HTMLElement>('#countCaught');
    if (countSeen) countSeen.innerText = String(totalCount);
    if (countCaught) countCaught.innerText = String(totalCount);

    const typesContainer = this.elements.rootModal.querySelector<HTMLElement>('#listPokemonTypes');
    if (typesContainer) {
      typesContainer.innerHTML = '';
      if (pokemon) {
        pokemon.types.forEach((type) => {
          const typeIndex = TYPE_INDICES[type] ?? 0;
          const badgeCanvas = document.createElement('canvas');
          badgeCanvas.className = 'list-type-badge';
          badgeCanvas.title = type;
          TypeBadgeRenderer.renderBadge(badgeCanvas, typeIndex);
          typesContainer.appendChild(badgeCanvas);
        });
      }
    }
  }

  public renderPokemonList(
    pokemonList: PokemonSpeciesData[],
    selectedIndex: number,
    scrollOffset: number,
    visibleCount: number,
    onSelect: (index: number) => void,
    onOpenDetail: (index: number) => void
  ): void {
    if (!this.elements) return;
    const container = this.elements.listItemsContainer;
    container.innerHTML = '';

    const visibleItems = pokemonList.slice(scrollOffset, scrollOffset + visibleCount);

    visibleItems.forEach((pkmn, idx) => {
      const realIndex = scrollOffset + idx;
      const isSelected = realIndex === selectedIndex;

      const itemEl = document.createElement('div');
      itemEl.className = `pokedex-list-row ${isSelected ? 'selected' : ''}`;
      itemEl.dataset.index = String(realIndex);

      const padId = String(pkmn.id).padStart(3, '0');

      itemEl.innerHTML = `
        <img src="${POKEDEX_ASSETS.iconOwn}" class="row-pokeball-icon" alt="Caught" />
        <div class="row-pkmn-icon" style="background-image: url('/${pkmn.sprites.icon}');"></div>
        <span class="row-num">No. ${padId}</span>
        <span class="row-name">${pkmn.name}</span>
      `;

      itemEl.addEventListener('click', () => onSelect(realIndex));
      itemEl.addEventListener('dblclick', () => onOpenDetail(realIndex));

      container.appendChild(itemEl);
    });

    this.updateSlider(scrollOffset, pokemonList.length, visibleCount);
  }

  // --- Render Moves Tab ---
  public renderMovePreview(move: BattleMove | undefined): void {
    if (!this.elements) return;

    const titleViEl = this.elements.rootModal.querySelector<HTMLElement>('#moveLeftTitleVi');
    const titleEnEl = this.elements.rootModal.querySelector<HTMLElement>('#moveLeftTitleEn');
    if (titleViEl) {
      if (move) {
        titleViEl.innerText = move.nameVi || move.nameEn || move.name;
        titleViEl.title = `${move.nameEn || move.name} (${move.type})`;
      } else {
        titleViEl.innerText = 'Không tìm thấy chiêu thức';
      }
    }
    if (titleEnEl) {
      titleEnEl.innerText = move ? move.nameEn || move.name : '';
    }

    const machineImg = this.elements.rootModal.querySelector<HTMLImageElement>('#moveMachineImg');
    if (machineImg && move) {
      machineImg.src = MOVE_ASSETS.getMachineDisc(move.type);
      machineImg.alt = `${move.type} TM`;
    }

    const moveTypeCanvas =
      this.elements.rootModal.querySelector<HTMLCanvasElement>('#moveTypeCanvas');
    if (moveTypeCanvas && move) {
      const typeIdx = TYPE_INDICES[move.type] ?? 0;
      TypeBadgeRenderer.renderBadge(moveTypeCanvas, typeIdx);
    }

    const moveCatBadge = this.elements.rootModal.querySelector<HTMLElement>('#moveCategoryBadge');
    const moveCatLabel = this.elements.rootModal.querySelector<HTMLElement>('#moveCategoryLabel');
    if (moveCatBadge && move) {
      const catKey = (move.category || 'physical').toLowerCase();
      moveCatBadge.className = `move-category-badge ${catKey}`;
      const labelText = getMoveCategoryLabel(catKey);
      moveCatBadge.title = labelText;
      if (moveCatLabel) {
        moveCatLabel.className = `move-category-label ${catKey}`;
        moveCatLabel.innerText = labelText;
      }
    }

    const movePower = this.elements.rootModal.querySelector<HTMLElement>('#movePower');
    if (movePower) {
      movePower.innerText = move ? (move.power > 0 ? String(move.power) : '—') : '—';
    }

    const moveAccuracy = this.elements.rootModal.querySelector<HTMLElement>('#moveAccuracy');
    if (moveAccuracy) {
      moveAccuracy.innerText = move ? (move.accuracy > 0 ? `${move.accuracy}%` : '—') : '—';
    }

    const movePP = this.elements.rootModal.querySelector<HTMLElement>('#movePP');
    if (movePP) {
      movePP.innerText = move ? `${move.pp}/${move.maxPp || move.pp}` : '—';
    }

    const moveDesc = this.elements.rootModal.querySelector<HTMLElement>('#moveDescContent');
    if (moveDesc) {
      moveDesc.innerText = move
        ? move.descriptionVi ||
          move.description ||
          move.descriptionEn ||
          'Không có mô tả cho chiêu thức này.'
        : 'Không tìm thấy chiêu thức nào phù hợp.';
    }
  }

  public renderMoveList(
    moveList: BattleMove[],
    selectedIndex: number,
    scrollOffset: number,
    visibleCount: number,
    onSelect: (index: number) => void
  ): void {
    if (!this.elements) return;
    const container = this.elements.listItemsContainer;
    container.innerHTML = '';

    const visibleItems = moveList.slice(scrollOffset, scrollOffset + visibleCount);

    visibleItems.forEach((move, idx) => {
      const realIndex = scrollOffset + idx;
      const isSelected = realIndex === selectedIndex;

      const itemEl = document.createElement('div');
      itemEl.className = `pokedex-list-row move-list-row ${isSelected ? 'selected' : ''}`;
      itemEl.dataset.index = String(realIndex);

      const discImg = document.createElement('img');
      discImg.className = 'move-row-disc';
      discImg.src = MOVE_ASSETS.getMachineDisc(move.type);
      discImg.alt = move.type;

      const nameGroup = document.createElement('div');
      nameGroup.className = 'move-row-name-group';

      const nameVi = document.createElement('span');
      nameVi.className = 'move-row-name-vi';
      nameVi.innerText = move.nameVi || move.nameEn || move.name;

      const nameEn = document.createElement('span');
      nameEn.className = 'move-row-name-en';
      nameEn.innerText = move.nameEn || move.name;

      nameGroup.appendChild(nameVi);
      nameGroup.appendChild(nameEn);

      const badgeCanvas = document.createElement('canvas');
      badgeCanvas.className = 'list-type-badge move-row-type-badge';
      const typeIdx = TYPE_INDICES[move.type] ?? 0;
      TypeBadgeRenderer.renderBadge(badgeCanvas, typeIdx);

      const statsEl = document.createElement('div');
      statsEl.className = 'move-row-stats';
      const pwrStr = move.power > 0 ? String(move.power) : '—';
      statsEl.innerHTML = `<span>PWR ${pwrStr}</span><span>PP ${move.pp}</span>`;

      itemEl.appendChild(discImg);
      itemEl.appendChild(nameGroup);
      itemEl.appendChild(badgeCanvas);
      itemEl.appendChild(statsEl);

      itemEl.addEventListener('click', () => onSelect(realIndex));

      container.appendChild(itemEl);
    });

    this.updateSlider(scrollOffset, moveList.length, visibleCount);
  }

  // --- Render Items Tab ---
  public renderItemPreview(item: ItemData | undefined): void {
    if (!this.elements) return;

    const titleViEl = this.elements.rootModal.querySelector<HTMLElement>('#itemLeftTitleVi');
    const titleEnEl = this.elements.rootModal.querySelector<HTMLElement>('#itemLeftTitleEn');
    if (titleViEl) {
      if (item) {
        titleViEl.innerText = item.nameVi || item.name;
        titleViEl.title = `${item.name} (${item.categoryVi || item.categoryName})`;
      } else {
        titleViEl.innerText = 'Không tìm thấy vật phẩm';
      }
    }
    if (titleEnEl) {
      titleEnEl.innerText = item ? item.name : '';
    }

    const spriteImg = this.elements.rootModal.querySelector<HTMLImageElement>('#itemSpriteImg');
    if (spriteImg && item) {
      spriteImg.src = `/${item.sprite}`;
      spriteImg.alt = item.name;
    }

    const categoryBadge = this.elements.rootModal.querySelector<HTMLElement>('#itemCategoryBadge');
    const categoryCode = this.elements.rootModal.querySelector<HTMLElement>('#itemCategoryCode');
    const pocketName = this.elements.rootModal.querySelector<HTMLElement>('#itemPocketName');

    if (categoryBadge && item) {
      categoryBadge.innerText = item.categoryVi || item.categoryName;
      categoryBadge.className = `item-category-tag cat-${item.category}`;
    }

    if (categoryCode && item) {
      categoryCode.innerText = item.categoryName || item.category.toUpperCase();
    }

    if (pocketName && item) {
      pocketName.innerText = getItemPocketName(item.category);
    }

    const descEl = this.elements.rootModal.querySelector<HTMLElement>('#itemDescContent');
    if (descEl) {
      descEl.innerText = item
        ? item.descriptionVi || item.description || 'Không có mô tả chi tiết cho vật phẩm này.'
        : 'Không tìm thấy vật phẩm nào phù hợp.';
    }
  }

  public renderItemList(
    itemList: ItemData[],
    selectedIndex: number,
    scrollOffset: number,
    visibleCount: number,
    onSelect: (index: number) => void
  ): void {
    if (!this.elements) return;
    const container = this.elements.listItemsContainer;
    container.innerHTML = '';

    const visibleItems = itemList.slice(scrollOffset, scrollOffset + visibleCount);

    visibleItems.forEach((item, idx) => {
      const realIndex = scrollOffset + idx;
      const isSelected = realIndex === selectedIndex;

      const itemEl = document.createElement('div');
      itemEl.className = `pokedex-list-row item-list-row ${isSelected ? 'selected' : ''}`;
      itemEl.dataset.index = String(realIndex);

      const iconImg = document.createElement('img');
      iconImg.className = 'item-row-icon';
      iconImg.src = `/${item.sprite}`;
      iconImg.alt = item.name;

      const nameGroup = document.createElement('div');
      nameGroup.className = 'item-row-name-group';

      const nameVi = document.createElement('span');
      nameVi.className = 'item-row-name-vi';
      nameVi.innerText = item.nameVi || item.name;

      const nameEn = document.createElement('span');
      nameEn.className = 'item-row-name-en';
      nameEn.innerText = item.name;

      nameGroup.appendChild(nameVi);
      nameGroup.appendChild(nameEn);

      const catBadge = document.createElement('span');
      catBadge.className = `item-row-cat-badge cat-${item.category}`;
      catBadge.innerText = item.categoryVi || item.categoryName;

      itemEl.appendChild(iconImg);
      itemEl.appendChild(nameGroup);
      itemEl.appendChild(catBadge);

      itemEl.addEventListener('click', () => onSelect(realIndex));

      container.appendChild(itemEl);
    });

    this.updateSlider(scrollOffset, itemList.length, visibleCount);
  }

  public updateSlider(scrollOffset: number, totalLength: number, visibleCount: number): void {
    if (!this.elements) return;
    const handle = this.elements.listSliderHandle;
    const maxScroll = Math.max(1, totalLength - visibleCount);
    const ratio = Math.max(0, Math.min(1, scrollOffset / maxScroll));
    const trackHeight = 279;
    const handleHeight = 30;
    const topPx = ratio * (trackHeight - handleHeight);
    handle.style.top = `${topPx}px`;
  }

  // --- Render Pokemon Info Screen ---
  public renderPokemonInfo(
    pokemon: PokemonSpeciesData,
    allPokemon: PokemonSpeciesData[],
    onSelectPokemon: (pokemonId: number) => void
  ): void {
    if (!this.elements) return;

    const padId = String(pokemon.id).padStart(3, '0');
    const idEl = this.elements.rootModal.querySelector<HTMLElement>('#infoPkmnId');
    const nameEl = this.elements.rootModal.querySelector<HTMLElement>('#infoPkmnName');
    if (idEl) idEl.innerText = `No. ${padId}`;
    if (nameEl) nameEl.innerText = pokemon.name.toUpperCase();

    // Evolution chain
    const evoChainEl = this.elements.rootModal.querySelector<HTMLElement>('#infoEvoChain');
    if (evoChainEl) {
      evoChainEl.innerHTML = '';
      const chain = getEvolutionChain(pokemon.id);

      chain.forEach((stageId, idx) => {
        if (idx > 0) {
          if (pokemon.id !== 133 || idx === 1) {
            const arrowImg = document.createElement('img');
            arrowImg.src = POKEDEX_ASSETS.iconEvoArrow;
            arrowImg.className = 'evo-stage-arrow';
            arrowImg.alt = '>';
            evoChainEl.appendChild(arrowImg);
          }
        }

        const stagePkmn = allPokemon.find((p) => p.id === stageId);
        if (!stagePkmn) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'evo-stage-wrapper';
        wrapper.title = `${stagePkmn.name} (No. ${String(stagePkmn.id).padStart(3, '0')})`;

        const isCurrent = stagePkmn.id === pokemon.id;
        if (isCurrent) {
          wrapper.classList.add('current');
          const pointer = document.createElement('img');
          pointer.src = POKEDEX_ASSETS.iconEvoPointer;
          pointer.className = 'evo-stage-pointer';
          pointer.alt = '▼';
          wrapper.appendChild(pointer);
        }

        const icon = document.createElement('div');
        icon.className = 'evo-stage-icon';
        icon.style.backgroundImage = `url('/${stagePkmn.sprites.icon}')`;
        wrapper.appendChild(icon);

        wrapper.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectPokemon(stagePkmn.id);
        });

        evoChainEl.appendChild(wrapper);
      });
    }

    // Type Badges
    const typesRow = this.elements.rootModal.querySelector<HTMLElement>('#infoTypesRow');
    if (typesRow) {
      typesRow.innerHTML = '';
      pokemon.types.forEach((type) => {
        const typeIndex = TYPE_INDICES[type] ?? 0;
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.className = 'info-type-badge';
        badgeCanvas.title = type;
        TypeBadgeRenderer.renderBadge(badgeCanvas, typeIndex);
        typesRow.appendChild(badgeCanvas);
      });
    }

    // Specs
    const heightEl = this.elements.rootModal.querySelector<HTMLElement>('#infoHeight');
    const weightEl = this.elements.rootModal.querySelector<HTMLElement>('#infoWeight');
    const totalEl = this.elements.rootModal.querySelector<HTMLElement>('#infoTotalStats');

    const displayHeight = pokemon.height
      ? `${pokemon.height} m`
      : `${(0.3 + (pokemon.stats.total / 600) * 1.5).toFixed(1)} m`;
    const displayWeight = pokemon.weight
      ? `${pokemon.weight} kg`
      : `${(3 + (pokemon.stats.total / 600) * 75).toFixed(1)} kg`;

    if (heightEl) heightEl.innerText = displayHeight;
    if (weightEl) weightEl.innerText = displayWeight;
    if (totalEl) totalEl.innerText = String(pokemon.stats.total);

    // Habitat Environment Background & Base
    const habitat = getPokemonHabitat(pokemon);
    const bgImg = this.elements.rootModal.querySelector<HTMLImageElement>('#infoHabitatBg');
    const baseImg = this.elements.rootModal.querySelector<HTMLImageElement>('#infoHabitatBase');
    if (bgImg) bgImg.src = HABITAT_ASSETS.getHabitatBg(habitat.bg);
    if (baseImg) baseImg.src = HABITAT_ASSETS.getHabitatBase(habitat.base);

    // Research fields
    const setResearch = (id: string, val: string) => {
      const el = this.elements.rootModal.querySelector<HTMLElement>(`#${id}`);
      if (el) el.innerText = val;
    };
    setResearch('infoSpecies', pokemon.species ?? '—');
    const abilityDisplay = getAbilityDisplay(pokemon.ability);
    setResearch('infoAbility', abilityDisplay.fullName);
    const abilityEl = this.elements.rootModal.querySelector<HTMLElement>('#infoAbility');
    if (abilityEl) abilityEl.title = abilityDisplay.descVi;
    setResearch('infoCatchRate', pokemon.catchRate != null ? String(pokemon.catchRate) : '—');
    setResearch('infoEggGroups', pokemon.eggGroups ?? '—');
    setResearch('infoGender', pokemon.genderRatio ?? '—');

    // Base stats
    const stats = pokemon.stats;
    const getStatRank = (val: number): number => {
      if (val < 30) return 1;
      if (val < 60) return 2;
      if (val < 80) return 3;
      if (val < 100) return 4;
      if (val < 130) return 5;
      return 6;
    };

    const updateStat = (idVal: string, idBar: string, val: number, max = 160) => {
      const vEl = this.elements.rootModal.querySelector<HTMLElement>(`#${idVal}`);
      const bEl = this.elements.rootModal.querySelector<HTMLElement>(`#${idBar}`);
      if (vEl) vEl.innerText = String(val);
      if (bEl) {
        const pct = Math.min(100, Math.round((val / max) * 100));
        bEl.style.width = `${pct}%`;
        bEl.className = `stat-fill stat-rank-${getStatRank(val)}`;
        const row = bEl.closest('.stat-row');
        if (row) row.className = `stat-row rank-${getStatRank(val)}`;
      }
    };

    updateStat('statHp', 'barHp', stats.hp);
    updateStat('statAtk', 'barAtk', stats.attack);
    updateStat('statDef', 'barDef', stats.defense);
    updateStat('statSpAtk', 'barSpAtk', stats.spAtk);
    updateStat('statSpDef', 'barSpDef', stats.spDef);
    updateStat('statSpd', 'barSpd', stats.speed);

    this.renderInfoMoves(pokemon);
  }

  public renderInfoMoves(pokemon: PokemonSpeciesData): void {
    if (!this.elements) return;
    const container = this.elements.infoMovesList;
    container.innerHTML = '';

    const moves = pokemon.moves || [];
    const tmMoves = pokemon.tmMoves || [];

    if (moves.length === 0 && tmMoves.length === 0) {
      container.innerHTML =
        '<div class="info-moves-empty">Chưa có dữ liệu chiêu thức theo cấp cho Pokémon này.</div>';
      return;
    }

    if (moves.length > 0) {
      const secHeader = document.createElement('div');
      secHeader.className = 'info-moves-section-header';
      secHeader.innerHTML = `<span>⬆️ CHIÊU THEO CẤP ĐỘ</span><span style="color:#64748b;font-size:11px;">(${moves.length})</span>`;
      container.appendChild(secHeader);

      moves.forEach((m) => {
        const moveDb = MOVES_DB[m.moveId];
        const row = document.createElement('div');
        row.className = 'info-move-row';
        const desc =
          moveDb?.descriptionVi ||
          moveDb?.description ||
          moveDb?.descriptionEn ||
          'Không có mô tả cho chiêu thức này.';
        row.title = `${m.nameVi} (${m.nameEn}) - Cấp độ: ${m.level}\n${desc}`;

        const lvlEl = document.createElement('span');
        lvlEl.className = 'im-col-lvl';
        lvlEl.innerText = m.level === 1 ? 'Lv. 1' : `Lv. ${m.level}`;

        const nameGroup = document.createElement('div');
        nameGroup.className = 'im-col-name';

        const nameVi = document.createElement('span');
        nameVi.className = 'info-move-name-vi';
        nameVi.innerText = m.nameVi || m.nameEn;

        const nameEn = document.createElement('span');
        nameEn.className = 'info-move-name-en';
        nameEn.innerText = m.nameEn;

        nameGroup.appendChild(nameVi);
        nameGroup.appendChild(nameEn);

        const typeCol = document.createElement('div');
        typeCol.className = 'im-col-type';
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.className = 'info-move-type-badge';
        const typeIdx = TYPE_INDICES[m.type] ?? 0;
        TypeBadgeRenderer.renderBadge(badgeCanvas, typeIdx);
        typeCol.appendChild(badgeCanvas);

        const catCol = document.createElement('div');
        catCol.className = 'im-col-cat';
        const catKey = (moveDb?.category || 'physical').toLowerCase();
        const catTitle = getMoveCategoryLabel(catKey);
        catCol.innerHTML = `<div class="info-move-cat-icon ${catKey}" title="${catTitle}"></div>`;

        const pwrCol = document.createElement('span');
        pwrCol.className = 'im-col-pwr';
        pwrCol.innerText = moveDb && moveDb.power > 0 ? String(moveDb.power) : '—';

        const accCol = document.createElement('span');
        accCol.className = 'im-col-acc';
        accCol.innerText = moveDb && moveDb.accuracy > 0 ? `${moveDb.accuracy}%` : '—';

        const ppCol = document.createElement('span');
        ppCol.className = 'im-col-pp';
        ppCol.innerText = moveDb ? String(moveDb.pp) : '—';

        row.appendChild(lvlEl);
        row.appendChild(nameGroup);
        row.appendChild(typeCol);
        row.appendChild(catCol);
        row.appendChild(pwrCol);
        row.appendChild(accCol);
        row.appendChild(ppCol);

        container.appendChild(row);
      });
    }

    if (tmMoves.length > 0) {
      const tmHeader = document.createElement('div');
      tmHeader.className = 'info-moves-section-header tm-header';
      tmHeader.innerHTML = `<span>💿 CHIÊU HỌC QUA ĐĨA KỸ THUẬT (TM/HM)</span><span style="color:#0284c7;font-size:11px;">(${tmMoves.length})</span>`;
      container.appendChild(tmHeader);

      tmMoves.forEach((tmId) => {
        const moveDb = MOVES_DB[tmId] || MOVES_DB[tmId.toLowerCase().replace(/-/g, '_')];
        if (!moveDb) return;

        const row = document.createElement('div');
        row.className = 'info-move-row tm-row';
        const desc =
          moveDb.descriptionVi ||
          moveDb.description ||
          moveDb.descriptionEn ||
          'Không có mô tả cho chiêu thức này.';
        row.title = `${moveDb.nameVi || moveDb.name} (${moveDb.nameEn || moveDb.name}) - Học qua Đĩa Kỹ Thuật TM/HM\n${desc}`;

        const lvlEl = document.createElement('span');
        lvlEl.className = 'im-col-lvl tm-col';
        lvlEl.innerText = 'TM';

        const nameGroup = document.createElement('div');
        nameGroup.className = 'im-col-name';

        const nameVi = document.createElement('span');
        nameVi.className = 'info-move-name-vi';
        nameVi.innerText = moveDb.nameVi || moveDb.name;

        const nameEn = document.createElement('span');
        nameEn.className = 'info-move-name-en';
        nameEn.innerText = moveDb.nameEn || moveDb.name;

        nameGroup.appendChild(nameVi);
        nameGroup.appendChild(nameEn);

        const typeCol = document.createElement('div');
        typeCol.className = 'im-col-type';
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.className = 'info-move-type-badge';
        const typeIdx = TYPE_INDICES[moveDb.type] ?? 0;
        TypeBadgeRenderer.renderBadge(badgeCanvas, typeIdx);
        typeCol.appendChild(badgeCanvas);

        const catCol = document.createElement('div');
        catCol.className = 'im-col-cat';
        const catKey = (moveDb.category || 'physical').toLowerCase();
        const catTitle = getMoveCategoryLabel(catKey);
        catCol.innerHTML = `<div class="info-move-cat-icon ${catKey}" title="${catTitle}"></div>`;

        const pwrCol = document.createElement('span');
        pwrCol.className = 'im-col-pwr';
        pwrCol.innerText = moveDb.power > 0 ? String(moveDb.power) : '—';

        const accCol = document.createElement('span');
        accCol.className = 'im-col-acc';
        accCol.innerText = moveDb.accuracy > 0 ? `${moveDb.accuracy}%` : '—';

        const ppCol = document.createElement('span');
        ppCol.className = 'im-col-pp';
        ppCol.innerText = String(moveDb.pp);

        row.appendChild(lvlEl);
        row.appendChild(nameGroup);
        row.appendChild(typeCol);
        row.appendChild(catCol);
        row.appendChild(pwrCol);
        row.appendChild(accCol);
        row.appendChild(ppCol);

        container.appendChild(row);
      });
    }
  }
}
