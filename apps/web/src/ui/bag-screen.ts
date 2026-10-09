/**
 * Bag Screen UI
 * Renders the authentic Pokémon Bag interface based on Graphics/Bag/ui2.png,
 * icon_pocket.png, bag icon.png, and Graphics/Items.
 */

import { inventoryService } from '../domain/inventory/inventory-service';
import { partyService } from '../domain/party/party-service';
import { applyItemToPartyPokemon } from '../domain/inventory/item-effects';
import { BAG_ASSETS } from '../assets';
import {
  BAG_POCKETS,
  findItem,
  type ItemData,
  isHoldableItem,
  isUsableItem,
  getItemUsageType,
} from '../data/items-db';
import { showBerryToast } from './toast';
import { battleSePlayer } from '../audio/battle-se';
import { PartyScreen } from './party-screen';

export interface BagItemEntry {
  rawId: string;
  count: number;
  item: ItemData;
  pocketIndex: number;
}

export interface BagOpenOptions {
  inBattle?: boolean;
  battleFilter?: (entry: BagItemEntry) => boolean;
  onUseItem?: (entry: BagItemEntry) => void;
  onCancel?: () => void;
  targetPokemonIndex?: number;
  targetPokemonName?: string;
  onItemGiven?: (entry: BagItemEntry, pokemonIndex: number) => void;
  filterHoldableOnly?: boolean;
}

export class BagScreen {
  private static instance: BagScreen | null = null;
  private backdropEl: HTMLElement | null = null;
  private isOpen = false;

  private activePocketIndex = 0;
  private selectedItemIndex = 0;
  private currentPocketItems: BagItemEntry[] = [];
  private openOptions: BagOpenOptions | null = null;
  private holdableFilterOnly = false;

  private constructor() {
    this.createDom();
    inventoryService.subscribe(() => {
      if (this.isOpen) {
        this.render();
      }
    });
  }

  public static getInstance(): BagScreen {
    if (!BagScreen.instance) {
      BagScreen.instance = new BagScreen();
    }
    return BagScreen.instance;
  }

  public isVisible(): boolean {
    return this.isOpen;
  }

  public open(options?: BagOpenOptions): void {
    if (!this.backdropEl) this.createDom();
    this.isOpen = true;
    this.openOptions = options ?? null;

    if (
      this.openOptions?.targetPokemonIndex !== undefined ||
      this.openOptions?.filterHoldableOnly
    ) {
      this.holdableFilterOnly = true;
      // Nếu đang ở các ngăn không có vật phẩm trang bị (Medicine, Pokéballs, Key, Battle), chuyển ngay sang ngăn Items (0) hoặc Berries (4)
      if (this.activePocketIndex !== 0 && this.activePocketIndex !== 4) {
        this.activePocketIndex = 0;
      }
    } else {
      this.holdableFilterOnly = false;
    }

    // Default to Pocket 0 (or Pocket 2 Pokéballs / Pocket 1 Medicine if opened in battle)
    if (this.openOptions?.inBattle) {
      this.activePocketIndex = 2; // Default to Poké Balls in battle
    }

    this.selectedItemIndex = 0;

    if (this.backdropEl) {
      this.backdropEl.style.display = 'flex';
    }
    this.render();
  }

  public openForBattleUse(onUseItem: (entry: BagItemEntry) => void, onCancel?: () => void): void {
    this.open({
      inBattle: true,
      onUseItem,
      onCancel,
    });
  }

  public close(notifyCancel = true): void {
    const wasOptions = this.openOptions;
    this.isOpen = false;
    this.openOptions = null;
    if (this.backdropEl) {
      this.backdropEl.style.display = 'none';
    }
    if (notifyCancel && wasOptions?.onCancel) {
      wasOptions.onCancel();
    }
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private getInventoryEntries(): BagItemEntry[] {
    return inventoryService.getInventoryEntries();
  }

  private createDom(): void {
    if (this.backdropEl) return;

    this.backdropEl = document.createElement('div');
    this.backdropEl.id = 'bagScreenBackdrop';
    this.backdropEl.className = 'bag-screen-backdrop';
    this.backdropEl.style.display = 'none';

    this.backdropEl.innerHTML = `
      <div class="bag-screen-wrapper" id="bagScreenWrapper">
        <!-- Background Frame (512x384 ui2.png) -->
        <div class="bag-bg-layer" style="background-image: url('${BAG_ASSETS.bg}')"></div>

        <!-- Header: Title & 8 Pocket Tabs -->
        <div class="bag-header-bar">
          <div class="bag-title">Túi đồ</div>
          <div class="bag-pockets-strip" id="bagPocketsStrip">
            <!-- 8 pocket icons populated dynamically -->
          </div>
        </div>

        <!-- Left Column: Pocket Preview, Artwork & Info -->
        <div class="bag-left-col">
          <div class="bag-preview-box">
            <img id="bagBigIcon" class="bag-big-icon" src="${BAG_ASSETS.bagIcon}" alt="Bag Icon" />
            <img id="bagItemLargePreview" class="bag-item-large-preview" src="" alt="Item Preview" style="display: none;" />
          </div>
          <div class="bag-pocket-info">
            <div id="bagPocketName" class="bag-pocket-name">VẬT PHẨM</div>
            <div id="bagPocketCount" class="bag-pocket-count">0 vật phẩm</div>
          </div>
        </div>

        <!-- Right Column: Item List (Scrollable) -->
        <div class="bag-right-col">
          <div class="bag-filter-bar" id="bagFilterBar">
            <span id="bagFilterTitle" class="bag-filter-title">DANH SÁCH VẬT PHẨM</span>
            <button id="btnToggleHoldableFilter" class="bag-filter-toggle-btn" title="Lọc các vật phẩm có thể cho Pokémon cầm">
              <span class="filter-toggle-icon">◈</span>
              <span class="filter-toggle-text">Lọc đồ trao</span>
            </button>
          </div>
          <div class="bag-items-list" id="bagItemsList">
            <!-- Item rows rendered dynamically -->
          </div>
        </div>

        <!-- Bottom Bar: Selected Item Info & Actions -->
        <div class="bag-bottom-bar">
          <!-- White square box matching template -->
          <div class="bag-thumb-box">
            <img id="bagBottomThumb" class="bag-bottom-thumb" src="" alt="Item Sprite" />
          </div>

          <div class="bag-desc-content">
            <div class="bag-desc-header">
              <span id="bagSelectedItemName" class="bag-selected-item-name">--</span>
              <span id="bagSelectedItemCategory" class="bag-selected-item-cat">--</span>
              <span id="bagSelectedItemUsageTag" class="bag-item-tag" style="display: none;">--</span>
            </div>
            <div id="bagSelectedItemDesc" class="bag-selected-item-desc">
              Chọn một vật phẩm trong danh sách để xem chi tiết.
            </div>
          </div>

          <div class="bag-actions-box">
            <button id="btnBagUse" class="bag-btn-action primary" title="Sử dụng vật phẩm (Enter)">DÙNG</button>
            <button id="btnBagGive" class="bag-btn-action secondary" title="Cho Pokémon cầm">CHO GIỮ</button>
            <button id="btnBagClose" class="bag-btn-action cancel" title="Đóng túi (Esc / B)">THOÁT</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.backdropEl);

    // Bind Pocket Tab clicks & Action Buttons
    const btnClose = this.backdropEl.querySelector('#btnBagClose');
    btnClose?.addEventListener('click', () => this.close());

    const btnUse = this.backdropEl.querySelector('#btnBagUse');
    btnUse?.addEventListener('click', () => this.useSelectedItem());

    const btnGive = this.backdropEl.querySelector('#btnBagGive');
    btnGive?.addEventListener('click', () => this.giveSelectedItem());

    const btnToggleFilter = this.backdropEl.querySelector<HTMLButtonElement>(
      '#btnToggleHoldableFilter'
    );
    btnToggleFilter?.addEventListener('click', () => {
      this.holdableFilterOnly = !this.holdableFilterOnly;
      this.selectedItemIndex = 0;
      battleSePlayer.playSound('Audio/SE/Select.ogg', 0.6);
      this.render();
    });

    // Close on backdrop click outside
    this.backdropEl.addEventListener('click', (e) => {
      if (e.target === this.backdropEl) {
        this.close();
      }
    });

    // Keyboard handlers
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.code === 'Escape' || e.code === 'KeyB') {
        this.close();
        e.preventDefault();
        return;
      }

      if (e.code === 'ArrowLeft') {
        this.activePocketIndex = (this.activePocketIndex - 1 + 8) % 8;
        this.selectedItemIndex = 0;
        this.render();
        e.preventDefault();
      } else if (e.code === 'ArrowRight') {
        this.activePocketIndex = (this.activePocketIndex + 1) % 8;
        this.selectedItemIndex = 0;
        this.render();
        e.preventDefault();
      } else if (e.code === 'ArrowUp') {
        if (this.currentPocketItems.length > 0) {
          this.selectedItemIndex =
            (this.selectedItemIndex - 1 + this.currentPocketItems.length) %
            this.currentPocketItems.length;
          this.renderDetails();
          this.scrollSelectedIntoView();
          e.preventDefault();
        }
      } else if (e.code === 'ArrowDown') {
        if (this.currentPocketItems.length > 0) {
          this.selectedItemIndex = (this.selectedItemIndex + 1) % this.currentPocketItems.length;
          this.renderDetails();
          this.scrollSelectedIntoView();
          e.preventDefault();
        }
      } else if (e.code === 'Enter' || e.code === 'Space') {
        this.useSelectedItem();
        e.preventDefault();
      }
    });
  }

  private scrollSelectedIntoView(): void {
    if (!this.backdropEl) return;
    const selectedEl = this.backdropEl.querySelector<HTMLElement>('.bag-item-row.selected');
    selectedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  public render(): void {
    if (!this.backdropEl || !this.isOpen) return;

    // 1. Render 8 Pocket Tabs
    const pocketsStrip = this.backdropEl.querySelector<HTMLElement>('#bagPocketsStrip');
    if (pocketsStrip) {
      pocketsStrip.innerHTML = '';
      const POCKET_COLORS = [
        '#f472b6', // Items: Pink
        '#fb923c', // Medicine: Orange
        '#facc15', // Poké Balls: Amber / Gold
        '#a3e635', // TMs/HMs: Lime
        '#34d399', // Berries: Emerald
        '#38bdf8', // Mail: Sky / Cyan
        '#60a5fa', // Battle: Blue
        '#c084fc', // Key Items: Purple
      ];

      BAG_POCKETS.forEach((p, idx) => {
        const isSelected = idx === this.activePocketIndex;
        const tabEl = document.createElement('button');
        tabEl.className = `bag-pocket-tab ${isSelected ? 'active' : ''}`;
        tabEl.title = `${p.nameVi} (${p.name})`;
        tabEl.dataset.pocketIndex = String(idx);

        // Always use colored row (Y = 0px). Never use uncolored/gray row.
        tabEl.style.backgroundImage = `url('${BAG_ASSETS.pocketIcons}')`;
        tabEl.style.backgroundPosition = `-${idx * 28}px 0px`;
        tabEl.style.setProperty('--pocket-color', POCKET_COLORS[idx] || '#38bdf8');

        tabEl.addEventListener('click', () => {
          this.activePocketIndex = idx;
          this.selectedItemIndex = 0;
          this.render();
        });

        pocketsStrip.appendChild(tabEl);
      });
    }

    // 2. Filter items for current active pocket
    const allItems = this.getInventoryEntries();
    let pocketItems = allItems.filter(
      (entry) => entry.pocketIndex === this.activePocketIndex
    );

    // If opened in battle and filter supplied, filter accordingly
    if (this.openOptions?.battleFilter) {
      pocketItems = pocketItems.filter(this.openOptions.battleFilter);
    }

    // Filter holdable items if filter is active
    if (this.holdableFilterOnly) {
      pocketItems = pocketItems.filter((entry) => isHoldableItem(entry.item));
    }

    this.currentPocketItems = pocketItems;

    if (this.selectedItemIndex >= this.currentPocketItems.length) {
      this.selectedItemIndex = Math.max(0, this.currentPocketItems.length - 1);
    }

    // Update Filter Bar State
    const filterTitleEl = this.backdropEl.querySelector<HTMLElement>('#bagFilterTitle');
    const filterBtn = this.backdropEl.querySelector<HTMLButtonElement>('#btnToggleHoldableFilter');
    if (filterTitleEl) {
      if (this.openOptions?.targetPokemonName) {
        filterTitleEl.innerText = `🎁 TRAO CHO ${this.openOptions.targetPokemonName.toUpperCase()}`;
      } else {
        filterTitleEl.innerText = 'DANH SÁCH VẬT PHẨM';
      }
    }
    if (filterBtn) {
      filterBtn.className = `bag-filter-toggle-btn ${this.holdableFilterOnly ? 'active' : ''}`;
      filterBtn.innerHTML = `
        <span class="filter-toggle-icon">${this.holdableFilterOnly ? '✓' : '◈'}</span>
        <span class="filter-toggle-text">${this.holdableFilterOnly ? 'Đang lọc đồ trao' : 'Lọc đồ trao'}</span>
      `;
    }

    // 3. Update Left Column Pocket Info
    const currentPocketDef = BAG_POCKETS[this.activePocketIndex];
    const pocketNameEl = this.backdropEl.querySelector<HTMLElement>('#bagPocketName');
    const pocketCountEl = this.backdropEl.querySelector<HTMLElement>('#bagPocketCount');
    if (pocketNameEl) pocketNameEl.innerText = currentPocketDef.nameVi;
    if (pocketCountEl) {
      const totalCount = this.currentPocketItems.reduce((acc, cur) => acc + cur.count, 0);
      pocketCountEl.innerText = `${this.currentPocketItems.length} loại (${totalCount} cái)`;
    }

    // 4. Render Item List
    const itemsListEl = this.backdropEl.querySelector<HTMLElement>('#bagItemsList');
    if (itemsListEl) {
      itemsListEl.innerHTML = '';

      if (this.currentPocketItems.length === 0) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'bag-items-empty';
        emptyEl.innerText = this.holdableFilterOnly
          ? 'Không có vật phẩm nào có thể trao trong ngăn này.'
          : 'Ngăn túi này hiện đang trống.';
        itemsListEl.appendChild(emptyEl);
      } else {
        this.currentPocketItems.forEach((entry, idx) => {
          const isSelected = idx === this.selectedItemIndex;
          const rowEl = document.createElement('div');
          rowEl.className = `bag-item-row ${isSelected ? 'selected' : ''}`;
          rowEl.dataset.itemIndex = String(idx);

          const spriteUrl = entry.item.sprite ? `/${entry.item.sprite}` : '/Graphics/Items/000.png';

          rowEl.innerHTML = `
            <div class="bag-item-icon-box">
              <img src="${spriteUrl}" class="bag-item-mini-icon" alt="${entry.item.name}" />
            </div>
            <div class="bag-item-name">${entry.item.nameVi || entry.item.name}</div>
            <div class="bag-item-qty">×${entry.count}</div>
          `;

          rowEl.addEventListener('click', () => {
            this.selectedItemIndex = idx;
            this.renderDetails();
          });

          rowEl.addEventListener('dblclick', () => {
            this.selectedItemIndex = idx;
            this.useSelectedItem();
          });

          itemsListEl.appendChild(rowEl);
        });
      }
    }

    // 5. Update Details Bottom Bar
    this.renderDetails();
  }

  private renderDetails(): void {
    if (!this.backdropEl) return;

    // Update row selections
    const rows = this.backdropEl.querySelectorAll<HTMLElement>('.bag-item-row');
    rows.forEach((r, idx) => {
      if (idx === this.selectedItemIndex) {
        r.classList.add('selected');
      } else {
        r.classList.remove('selected');
      }
    });

    const selected = this.currentPocketItems[this.selectedItemIndex] as BagItemEntry | undefined;

    const thumbImg = this.backdropEl.querySelector<HTMLImageElement>('#bagBottomThumb');
    const itemNameEl = this.backdropEl.querySelector<HTMLElement>('#bagSelectedItemName');
    const itemCatEl = this.backdropEl.querySelector<HTMLElement>('#bagSelectedItemCategory');
    const usageTag = this.backdropEl.querySelector<HTMLElement>('#bagSelectedItemUsageTag');
    const itemDescEl = this.backdropEl.querySelector<HTMLElement>('#bagSelectedItemDesc');
    const bigIcon = this.backdropEl.querySelector<HTMLImageElement>('#bagBigIcon');
    const itemLarge = this.backdropEl.querySelector<HTMLImageElement>('#bagItemLargePreview');
    const btnUse = this.backdropEl.querySelector<HTMLButtonElement>('#btnBagUse');
    const btnGive = this.backdropEl.querySelector<HTMLButtonElement>('#btnBagGive');

    if (selected) {
      const spriteUrl = selected.item.sprite
        ? `/${selected.item.sprite}`
        : '/Graphics/Items/000.png';

      if (thumbImg) {
        thumbImg.src = spriteUrl;
        thumbImg.style.display = 'block';
      }
      if (itemNameEl) itemNameEl.innerText = selected.item.nameVi || selected.item.name;
      if (itemCatEl) itemCatEl.innerText = selected.item.categoryVi || selected.item.categoryName;

      // Usage badge
      const usageType = getItemUsageType(selected.item);
      const isHoldable = isHoldableItem(selected.item);
      const isUsable = isUsableItem(selected.item);

      if (usageTag) {
        usageTag.style.display = 'inline-block';
        usageTag.className = `bag-item-tag ${usageType}`;
        if (usageType === 'both') {
          usageTag.innerText = 'DÙNG & CHO GIỮ';
        } else if (usageType === 'hold_only') {
          usageTag.innerText = 'CHỈ CHO GIỮ';
        } else if (usageType === 'use_only') {
          usageTag.innerText = 'CHỈ DÙNG';
        } else {
          usageTag.innerText = 'KHÔNG DÙNG / BÁN';
        }
      }

      if (itemDescEl) {
        itemDescEl.innerText =
          selected.item.descriptionVi || selected.item.description || 'Không có mô tả chi tiết.';
      }

      // Left Column preview
      if (itemLarge && bigIcon) {
        itemLarge.src = spriteUrl;
        itemLarge.style.display = 'block';
        bigIcon.style.opacity = '0.35';
      }

      if (btnUse) {
        if (this.openOptions?.inBattle) {
          btnUse.disabled = false;
          btnUse.innerText = 'DÙNG TRẬN';
          btnUse.title = 'Sử dụng vật phẩm trong trận đấu';
        } else {
          btnUse.disabled = !isUsable;
          btnUse.innerText = 'DÙNG';
          btnUse.title = isUsable
            ? 'Sử dụng vật phẩm (Enter)'
            : 'Vật phẩm trang bị, không thể dùng trực tiếp! Hãy chọn CHO GIỮ để trao cho Pokémon.';
        }
      }

      if (btnGive) {
        btnGive.disabled = !isHoldable || Boolean(this.openOptions?.inBattle);
        if (this.openOptions?.targetPokemonName) {
          btnGive.innerText = `TRAO CHO ${this.openOptions.targetPokemonName.toUpperCase()}`;
          btnGive.title = isHoldable
            ? `Trao trực tiếp cho ${this.openOptions.targetPokemonName}`
            : 'Vật phẩm này không thể cho Pokémon cầm nắm!';
        } else {
          btnGive.innerText = 'CHO GIỮ';
          btnGive.title = isHoldable
            ? 'Cho Pokémon cầm'
            : 'Vật phẩm này không thể cho Pokémon cầm nắm!';
        }
      }
    } else {
      if (thumbImg) thumbImg.style.display = 'none';
      if (itemNameEl) itemNameEl.innerText = '--';
      if (itemCatEl) itemCatEl.innerText = '--';
      if (usageTag) usageTag.style.display = 'none';
      if (itemDescEl) {
        const pocketDef = BAG_POCKETS[this.activePocketIndex];
        itemDescEl.innerText = this.holdableFilterOnly
          ? `Ngăn ${pocketDef.nameVi} (chế độ lọc đồ có thể trao).`
          : pocketDef.descriptionVi;
      }
      if (itemLarge && bigIcon) {
        itemLarge.style.display = 'none';
        bigIcon.style.opacity = '1';
      }
      if (btnUse) btnUse.disabled = true;
      if (btnGive) btnGive.disabled = true;
    }
  }

  private useSelectedItem(): void {
    const selected = this.currentPocketItems[this.selectedItemIndex];
    if (!selected) return;

    // 1. If in battle mode: invoke onUseItem callback
    if (this.openOptions?.inBattle && this.openOptions.onUseItem) {
      const onUse = this.openOptions.onUseItem;
      this.close(false);
      onUse(selected);
      return;
    }

    // 2. Overworld Item Usage
    const cat = selected.item.category;

    // Poké Balls outside battle
    if (cat === 'pokeballs' || cat === 'ball') {
      showBerryToast(`Bóng Poké chỉ có thể dùng khi bắt Pokémon trong trận đấu!`, '#38bdf8');
      return;
    }

    // Key Items
    if (cat === 'key') {
      showBerryToast(
        selected.item.descriptionVi || selected.item.description || 'Vật phẩm quan trọng.',
        '#38bdf8'
      );
      return;
    }

    const isUsable = isUsableItem(selected.item);
    if (!isUsable) {
      showBerryToast(
        `⚠️ ${selected.item.nameVi || selected.item.name} là trang bị, không thể dùng trực tiếp! Hãy bấm [CHO GIỮ] để trao cho Pokémon.`,
        '#f59e0b'
      );
      return;
    }

    // Đóng túi đồ và mở trực tiếp Màn hình Đội hình (Party Screen) ở chế độ Dùng vật phẩm
    this.close(false);
    PartyScreen.getInstance().openForSelect({
      mode: 'use_item',
      item: selected,
      onSelect: (pk, _slotIndex) => {
        const result = applyItemToPartyPokemon(selected.item, pk);
        if (result.success) {
          // Trừ 1 số lượng vật phẩm khỏi túi đồ
          inventoryService.removeItem(selected.rawId, 1);
          battleSePlayer.playSound('Audio/SE/Battle catch click.ogg', 0.85);
          showBerryToast(result.message, '#22c55e');
          partyService.notify();

          const remaining = inventoryService.getItemCount(selected.rawId);
          if (remaining <= 0) {
            // Đã hết vật phẩm, đóng màn hình đội hình và trở về túi đồ
            PartyScreen.getInstance().close();
            this.open(this.openOptions ?? undefined);
          } else {
            selected.count = remaining;
            PartyScreen.getInstance().render();
          }
        } else {
          showBerryToast(`⚠️ ${result.message}`, '#ef4444');
        }
      },
      onCancel: () => {
        // Trở về túi đồ khi người chơi bấm THOÁT / Esc từ Party Screen
        this.open(this.openOptions ?? undefined);
      },
    });
  }

  private giveSelectedItem(): void {
    const selected = this.currentPocketItems[this.selectedItemIndex];
    if (!selected) return;

    if (!isHoldableItem(selected.item)) {
      showBerryToast(
        `⚠️ Không thể trao ${selected.item.nameVi || selected.item.name} cho Pokémon cầm!`,
        '#ef4444'
      );
      return;
    }

    // 1. Nếu mở từ Màn hình Đội hình cho một Pokémon cụ thể: Gán thẳng không cần hỏi lại
    if (this.openOptions?.targetPokemonIndex !== undefined) {
      this.giveItemToPokemon(selected, this.openOptions.targetPokemonIndex);
      return;
    }

    // 2. Mở trực tiếp Màn hình Đội hình (Party Screen) ở chế độ Trao vật phẩm
    this.close(false);
    PartyScreen.getInstance().openForSelect({
      mode: 'give_item',
      item: selected,
      onSelect: (_pk, slotIndex) => {
        this.giveItemToPokemon(selected, slotIndex);
        PartyScreen.getInstance().close();
        this.open(this.openOptions ?? undefined);
      },
      onCancel: () => {
        // Trở về túi đồ khi người chơi bấm THOÁT / Esc từ Party Screen
        this.open(this.openOptions ?? undefined);
      },
    });
  }

  private giveItemToPokemon(entry: BagItemEntry, pokemonIndex: number): void {
    const pk = partyService.getPokemon(pokemonIndex);
    if (!pk) return;

    // Trao vật phẩm qua partyService (tự động nhận lại món đồ cũ nếu có, lưu storage và notify subscriber)
    const result = partyService.giveHeldItem(pokemonIndex, entry.rawId);
    if (result.returnedItem) {
      // Cất món đồ cũ trước đó về túi đồ
      inventoryService.addItem(result.returnedItem, 1);
    }
    // Trừ 1 số lượng vật phẩm khỏi túi đồ
    inventoryService.removeItem(entry.rawId, 1);
    battleSePlayer.playSound('Audio/SE/PC access.ogg', 0.8);

    const givenDef = findItem(entry.rawId);
    const givenName = givenDef
      ? givenDef.nameVi || givenDef.name
      : entry.item.nameVi || entry.item.name;

    showBerryToast(
      `🎁 Đã trao ${givenName} cho ${pk.nickname || pk.name} nắm giữ!`,
      '#38bdf8'
    );

    if (this.openOptions?.onItemGiven) {
      this.openOptions.onItemGiven(entry, pokemonIndex);
    }

    // Nếu mở cho Pokémon này từ Party Screen: Tự động đóng túi đồ ngay để người chơi thấy thẻ Pokémon cập nhật tức thì!
    if (this.openOptions?.targetPokemonIndex !== undefined) {
      this.close();
      return;
    }

    this.render();
  }
}

// Global helpers
export function initBagScreen(): BagScreen {
  return BagScreen.getInstance();
}

export function openBagScreen(options?: BagOpenOptions): void {
  BagScreen.getInstance().open(options);
}

export function closeBagScreen(): void {
  BagScreen.getInstance().close();
}

export function toggleBagScreen(): void {
  BagScreen.getInstance().toggle();
}

export function isBagScreenOpen(): boolean {
  return BagScreen.getInstance().isVisible();
}
