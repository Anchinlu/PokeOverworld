/**
 * Bag Screen UI
 * Renders the authentic Pokémon Bag interface based on Graphics/Bag/ui2.png,
 * icon_pocket.png, bag icon.png, and Graphics/Items.
 */

import { inventoryService } from '../domain/inventory/inventory-service';
import { partyService } from '../domain/party/party-service';
import { applyItemToPartyPokemon } from '../domain/inventory/item-effects';
import { BAG_ASSETS, POKEMON_ASSETS } from '../assets';
import { BAG_POCKETS, type ItemData } from '../data/items-db';
import { showBerryToast } from './toast';
import { battleSePlayer } from '../audio/battle-se';

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
}

export class BagScreen {
  private static instance: BagScreen | null = null;
  private backdropEl: HTMLElement | null = null;
  private isOpen = false;

  private activePocketIndex = 0;
  private selectedItemIndex = 0;
  private currentPocketItems: BagItemEntry[] = [];
  private openOptions: BagOpenOptions | null = null;

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

    // Default to Pocket 0 (or Pocket 2 Pokéballs / Pocket 1 Medicine if opened in battle)
    if (this.openOptions?.inBattle) {
      this.activePocketIndex = 2; // Default to Poké Balls in battle
    }

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

  public close(): void {
    const wasOptions = this.openOptions;
    this.closePartyPicker();
    this.isOpen = false;
    this.openOptions = null;
    if (this.backdropEl) {
      this.backdropEl.style.display = 'none';
    }
    if (wasOptions?.onCancel) {
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

        <!-- Party Picker Modal for applying items/held items directly to a party Pokémon -->
        <div class="bag-party-picker-modal" id="bagPartyPickerModal" style="display: none;">
          <div class="bag-party-picker-dialog">
            <div class="bag-party-picker-header">
              <span class="bag-party-picker-title" id="bagPartyPickerTitle">CHỌN POKÉMON</span>
              <button class="bag-party-picker-close" id="btnBagPartyPickerClose" title="Hủy bỏ">✕</button>
            </div>
            <div class="bag-party-picker-list" id="bagPartyPickerList"></div>
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
    this.currentPocketItems = allItems.filter(
      (entry) => entry.pocketIndex === this.activePocketIndex
    );

    // If opened in battle and filter supplied, filter accordingly
    if (this.openOptions?.battleFilter) {
      this.currentPocketItems = this.currentPocketItems.filter(this.openOptions.battleFilter);
    }

    if (this.selectedItemIndex >= this.currentPocketItems.length) {
      this.selectedItemIndex = Math.max(0, this.currentPocketItems.length - 1);
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
        emptyEl.innerText = 'Ngăn túi này hiện đang trống.';
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
        btnUse.disabled = false;
        btnUse.innerText = this.openOptions?.inBattle ? 'DÙNG TRẬN' : 'DÙNG';
      }
      if (btnGive) {
        btnGive.disabled = this.openOptions?.inBattle || selected.item.category === 'key';
      }
    } else {
      if (thumbImg) thumbImg.style.display = 'none';
      if (itemNameEl) itemNameEl.innerText = '--';
      if (itemCatEl) itemCatEl.innerText = '--';
      if (itemDescEl) {
        const pocketDef = BAG_POCKETS[this.activePocketIndex];
        itemDescEl.innerText = pocketDef.descriptionVi;
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
      this.close();
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

    // Open party picker to select which Pokémon to use the item on
    this.openPartyPicker(selected, 'use');
  }

  private giveSelectedItem(): void {
    const selected = this.currentPocketItems[this.selectedItemIndex];
    if (!selected) return;

    if (selected.item.category === 'key') {
      showBerryToast('Không thể trao vật phẩm quan trọng cho Pokémon cầm!', '#ef4444');
      return;
    }

    this.openPartyPicker(selected, 'give');
  }

  private openPartyPicker(entry: BagItemEntry, mode: 'use' | 'give'): void {
    if (!this.backdropEl) return;
    const modal = this.backdropEl.querySelector<HTMLElement>('#bagPartyPickerModal');
    const titleEl = this.backdropEl.querySelector<HTMLElement>('#bagPartyPickerTitle');
    const listEl = this.backdropEl.querySelector<HTMLElement>('#bagPartyPickerList');
    const btnClosePicker = this.backdropEl.querySelector<HTMLElement>('#btnBagPartyPickerClose');

    if (!modal || !titleEl || !listEl) return;

    const itemName = entry.item.nameVi || entry.item.name;
    titleEl.innerText =
      mode === 'use'
        ? `CHỌN POKÉMON ĐỂ DÙNG: ${itemName.toUpperCase()}`
        : `CHỌN POKÉMON ĐỂ TRAO: ${itemName.toUpperCase()}`;

    const closeHandler = () => {
      this.closePartyPicker();
    };
    btnClosePicker?.replaceWith(btnClosePicker.cloneNode(true));
    const newBtnClose = this.backdropEl.querySelector<HTMLElement>('#btnBagPartyPickerClose');
    newBtnClose?.addEventListener('click', closeHandler);

    listEl.innerHTML = '';
    const party = partyService.getParty();

    if (party.length === 0) {
      showBerryToast('Không có Pokémon nào trong đội hình!', '#ef4444');
      return;
    }

    party.forEach((pk) => {
      const card = document.createElement('div');
      const isFnt = pk.isFainted || pk.currentHp <= 0;
      card.className = `bag-picker-member-card ${isFnt ? 'is-fainted' : ''}`;

      const iconUrl = POKEMON_ASSETS.getIconSprite(pk.speciesKey, pk.isShiny);
      const hpPct = Math.max(0, Math.min(100, (pk.currentHp / pk.maxHp) * 100));
      const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 20 ? '#eab308' : '#ef4444';

      let statusBadge = '';
      if (isFnt) {
        statusBadge = '<span class="bag-picker-status-tag" style="background:#dc2626;">FNT</span>';
      } else if (pk.status === 'poison' || pk.status === 'toxic') {
        statusBadge = '<span class="bag-picker-status-tag" style="background:#a855f7;">ĐỘC</span>';
      } else if (pk.status === 'paralysis') {
        statusBadge = '<span class="bag-picker-status-tag" style="background:#eab308;">LIỆT</span>';
      } else if (pk.status === 'burn') {
        statusBadge = '<span class="bag-picker-status-tag" style="background:#f97316;">BỎNG</span>';
      } else if (pk.status === 'sleep') {
        statusBadge = '<span class="bag-picker-status-tag" style="background:#64748b;">NGỦ</span>';
      } else if (pk.status === 'freeze') {
        statusBadge = '<span class="bag-picker-status-tag" style="background:#06b6d4;">BĂNG</span>';
      }

      const heldInfo = pk.heldItem
        ? `<span style="font-size:9px; color:#38bdf8;">🎁 Đang giữ: ${pk.heldItem}</span>`
        : '';

      card.innerHTML = `
        <img src="${iconUrl}" class="bag-picker-pk-icon" alt="${pk.name}" />
        <div class="bag-picker-member-info">
          <div class="bag-picker-member-header">
            <span class="bag-picker-member-name">${pk.nickname || pk.name}</span>
            <div style="display:flex; align-items:center; gap:4px;">
              ${statusBadge}
              <span class="bag-picker-member-level">Lv.${pk.level}</span>
            </div>
          </div>
          <div class="bag-picker-hp-row">
            <div class="bag-picker-hp-track">
              <div class="bag-picker-hp-fill" style="width: ${hpPct}%; background-color: ${hpColor};"></div>
            </div>
            <span class="bag-picker-hp-val">${pk.currentHp}/${pk.maxHp}</span>
          </div>
          ${heldInfo}
        </div>
      `;

      card.addEventListener('click', () => {
        if (mode === 'use') {
          const result = applyItemToPartyPokemon(entry.item, pk);
          if (result.success) {
            // Deduct 1 item quantity from inventory!
            inventoryService.removeItem(entry.rawId, 1);
            battleSePlayer.playSound('Audio/SE/Battle catch click.ogg', 0.85);
            showBerryToast(result.message, '#22c55e');
            this.closePartyPicker();
            this.render();
          } else {
            showBerryToast(`⚠️ ${result.message}`, '#ef4444');
          }
        } else if (mode === 'give') {
          if (pk.heldItem) {
            // Return previously held item to inventory
            inventoryService.addItem(pk.heldItem, 1);
          }
          pk.heldItem = entry.item.nameVi || entry.item.name;
          // Deduct 1 item quantity from inventory!
          inventoryService.removeItem(entry.rawId, 1);
          battleSePlayer.playSound('Audio/SE/PC access.ogg', 0.8);
          showBerryToast(
            `🎁 Đã trao ${pk.heldItem} cho ${pk.nickname || pk.name} nắm giữ!`,
            '#38bdf8'
          );
          this.closePartyPicker();
          this.render();
        }
      });

      listEl.appendChild(card);
    });

    modal.style.display = 'flex';
  }

  private closePartyPicker(): void {
    if (!this.backdropEl) return;
    const modal = this.backdropEl.querySelector<HTMLElement>('#bagPartyPickerModal');
    if (modal) {
      modal.style.display = 'none';
    }
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
