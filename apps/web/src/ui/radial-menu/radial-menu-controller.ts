/**
 * Radial Wheel Menu Controller (Menu Bánh Xe Tròn)
 * Modern circular pie menu dynamically partitioned by unlocked features.
 * Toggled via Middle Mouse Click or ESC.
 */

import { battleSePlayer } from '../../audio';
import { MENU_ASSETS } from '../../assets';
import { playerService } from '../../domain';

export interface RadialMenuItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  isSvgIcon?: boolean;
  hotkey?: string;
  onSelect: () => void;
  isUnlocked?: () => boolean;
}

export class RadialMenuController {
  private static instance: RadialMenuController | null = null;

  private overlayEl: HTMLDivElement | null = null;
  private isShowing = false;
  private registeredItems: RadialMenuItem[] = [];
  private activeItems: RadialMenuItem[] = [];
  private hoveredIndex = -1;
  private onToggleCallback?: (isOpen: boolean) => void;

  public static getInstance(): RadialMenuController {
    if (!RadialMenuController.instance) {
      RadialMenuController.instance = new RadialMenuController();
    }
    return RadialMenuController.instance;
  }

  public registerItem(item: RadialMenuItem): void {
    const existingIndex = this.registeredItems.findIndex((i) => i.id === item.id);
    if (existingIndex >= 0) {
      this.registeredItems[existingIndex] = item;
    } else {
      this.registeredItems.push(item);
    }
  }

  public setOnToggle(callback: (isOpen: boolean) => void): void {
    this.onToggleCallback = callback;
  }

  public isOpen(): boolean {
    return this.isShowing;
  }

  /**
   * Initializes the default game menu items if not already registered.
   */
  public setupDefaultItems(callbacks: {
    onParty: () => void;
    onBag: () => void;
    onPokedex: () => void;
    onMap: () => void;
    onTrainer: () => void;
    onPC: () => void;
    onOptions: () => void;
    onQuit: () => void;
  }): void {
    this.registeredItems = [
      {
        id: 'party',
        title: 'ĐỘI HÌNH',
        subtitle: 'Quản lý 6 Pokémon trong túi',
        icon: MENU_ASSETS.menuPokemon,
        hotkey: 'P',
        onSelect: callbacks.onParty,
        isUnlocked: () => true,
      },
      {
        id: 'bag',
        title: 'TÚI ĐỒ',
        subtitle: 'Vật phẩm, dược phẩm & bóng Pokéball',
        icon: MENU_ASSETS.menuBag,
        hotkey: 'B',
        onSelect: callbacks.onBag,
        isUnlocked: () => true,
      },
      {
        id: 'pokedex',
        title: 'POKÉDEX',
        subtitle: 'Tra cứu thông tin 175 loài Pokémon',
        icon: MENU_ASSETS.menuPokedex,
        hotkey: 'Q',
        onSelect: callbacks.onPokedex,
        isUnlocked: () => playerService.hasFlag('has_pokedex'),
      },
      {
        id: 'map',
        title: 'BẢN ĐỒ',
        subtitle: 'Toàn cảnh thế giới Kanto & thị trấn',
        icon: '🗺️',
        isSvgIcon: true,
        hotkey: 'M',
        onSelect: callbacks.onMap,
        isUnlocked: () => playerService.hasFlag('has_town_map'),
      },
      {
        id: 'trainer',
        title: 'HỒ SƠ HLV',
        subtitle: 'Huy hiệu & thông tin Huấn Luyện Viên',
        icon: MENU_ASSETS.menuTrainer,
        hotkey: 'T',
        onSelect: callbacks.onTrainer,
        isUnlocked: () => true,
      },
      {
        id: 'pc',
        title: 'KHO LƯU TRỮ',
        subtitle: 'Hệ thống lưu trữ 24 hộp PC Box',
        icon: MENU_ASSETS.menuPC,
        hotkey: 'C',
        onSelect: callbacks.onPC,
        isUnlocked: () => true,
      },
      {
        id: 'options',
        title: 'CÀI ĐẶT',
        subtitle: 'Tùy chỉnh âm thanh & giao diện',
        icon: MENU_ASSETS.menuOptions,
        hotkey: 'O',
        onSelect: callbacks.onOptions,
        isUnlocked: () => true,
      },
      {
        id: 'quit',
        title: 'THOÁT GAME',
        subtitle: 'Lưu tiến trình và về màn hình chờ',
        icon: MENU_ASSETS.menuQuit,
        hotkey: 'ESC',
        onSelect: callbacks.onQuit,
        isUnlocked: () => true,
      },
    ];
  }

  /**
   * Mounts the Radial Menu DOM template to the document body.
   */
  public mount(): void {
    if (typeof document === 'undefined') return;
    if (this.overlayEl) return;

    const overlay = document.createElement('div');
    overlay.id = 'radialMenuOverlay';
    overlay.className = 'radial-menu-overlay';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="radial-menu-container" id="radialMenuContainer">
        <svg class="radial-menu-svg" id="radialMenuSvg" viewBox="0 0 420 420" width="420" height="420">
          <defs>
            <radialGradient id="radialBgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#0f172a" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#020617" stop-opacity="0.98" />
            </radialGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g id="radialSlicesGroup"></g>
          <!-- Decorative outer tick ring -->
          <circle cx="210" cy="210" r="195" fill="none" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.5" stroke-dasharray="4, 8" />
        </svg>

        <!-- Center Hub -->
        <div class="radial-center-hub" id="radialCenterHub">
          <div class="radial-hub-icon" id="radialHubIcon">
            <div class="radial-hub-pokeball"></div>
          </div>
          <div class="radial-hub-title" id="radialHubTitle">MENU NHANH</div>
          <div class="radial-hub-hotkey" id="radialHubHotkey">[ESC / Chuột Giữa]</div>
          <div class="radial-hub-desc" id="radialHubDesc">Chọn một chức năng</div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayEl = overlay;

    // Close on backdrop click (outside the wheel container)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    // Close on contextmenu (right-click)
    overlay.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.close();
    });
  }

  /**
   * Opens the Radial Menu.
   */
  public open(): void {
    if (this.isShowing) return;
    this.mount();

    // Filter unlocked items
    this.activeItems = this.registeredItems.filter(
      (item) => !item.isUnlocked || item.isUnlocked()
    );

    if (this.activeItems.length === 0) return;

    if (typeof document !== 'undefined') {
      this.renderSlices();
      this.resetCenterHub();

      if (this.overlayEl) {
        this.overlayEl.style.display = 'flex';
        // Force reflow for entrance transition
        void this.overlayEl.offsetHeight;
        this.overlayEl.classList.add('radial-menu-active');
      }
    }

    this.isShowing = true;
    battleSePlayer.playSound('Audio/SE/GUI menu open.ogg', 0.85);
    this.onToggleCallback?.(true);
  }

  /**
   * Closes the Radial Menu.
   */
  public close(): void {
    if (!this.isShowing) return;

    if (typeof document !== 'undefined' && this.overlayEl) {
      this.overlayEl.classList.remove('radial-menu-active');
      setTimeout(() => {
        if (!this.isShowing && this.overlayEl) {
          this.overlayEl.style.display = 'none';
        }
      }, 180);
    }

    this.isShowing = false;
    battleSePlayer.playSound('Audio/SE/GUI menu close.ogg', 0.7);
    this.onToggleCallback?.(false);
  }

  /**
   * Toggles the open/close state of the Radial Menu.
   */
  public toggle(): void {
    if (this.isShowing) {
      this.close();
    } else {
      this.open();
    }
  }

  private renderSlices(): void {
    const group = document.getElementById('radialSlicesGroup');
    if (!group) return;

    group.innerHTML = '';
    const N = this.activeItems.length;
    const cx = 210;
    const cy = 210;
    const R_out = 190;
    const R_in = 72;
    const R_icon = 128;
    const R_text = 162;

    const anglePerSlice = 360 / N;
    // Align so the first item is centered at the top (-90 degrees)
    const startAngleOffset = -90 - anglePerSlice / 2;

    this.activeItems.forEach((item, index) => {
      const a1 = startAngleOffset + index * anglePerSlice;
      const a2 = a1 + anglePerSlice;

      const rad1 = (a1 * Math.PI) / 180;
      const rad2 = (a2 * Math.PI) / 180;
      const radMid = ((a1 + a2) / 2 * Math.PI) / 180;

      const x1 = cx + R_out * Math.cos(rad1);
      const y1 = cy + R_out * Math.sin(rad1);
      const x2 = cx + R_out * Math.cos(rad2);
      const y2 = cy + R_out * Math.sin(rad2);

      const x3 = cx + R_in * Math.cos(rad2);
      const y3 = cy + R_in * Math.sin(rad2);
      const x4 = cx + R_in * Math.cos(rad1);
      const y4 = cy + R_in * Math.sin(rad1);

      // Large arc flag is 0 because anglePerSlice <= 180
      const largeArc = anglePerSlice > 180 ? 1 : 0;
      const d = `M ${x1} ${y1} A ${R_out} ${R_out} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${R_in} ${R_in} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      const sliceG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      sliceG.setAttribute('class', 'radial-slice-g');
      sliceG.setAttribute('data-index', String(index));

      // Path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', 'radial-slice-path');
      sliceG.appendChild(path);

      // Icon position
      const iconX = cx + R_icon * Math.cos(radMid);
      const iconY = cy + R_icon * Math.sin(radMid);

      if (item.isSvgIcon) {
        const textIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textIcon.setAttribute('x', String(iconX));
        textIcon.setAttribute('y', String(iconY + 6));
        textIcon.setAttribute('class', 'radial-slice-emoji-icon');
        textIcon.textContent = item.icon;
        sliceG.appendChild(textIcon);
      } else {
        const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        const imgSize = 30;
        img.setAttribute('x', String(iconX - imgSize / 2));
        img.setAttribute('y', String(iconY - imgSize / 2));
        img.setAttribute('width', String(imgSize));
        img.setAttribute('height', String(imgSize));
        img.setAttribute('href', item.icon);
        img.setAttribute('class', 'radial-slice-img');
        sliceG.appendChild(img);
      }

      // Small label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const textX = cx + R_text * Math.cos(radMid);
      const textY = cy + R_text * Math.sin(radMid) + 4;
      label.setAttribute('x', String(textX));
      label.setAttribute('y', String(textY));
      label.setAttribute('class', 'radial-slice-label');
      label.textContent = item.title;
      sliceG.appendChild(label);

      // Events
      sliceG.addEventListener('mouseenter', () => {
        this.highlightSlice(index);
      });

      sliceG.addEventListener('mouseleave', () => {
        this.resetCenterHub();
      });

      sliceG.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectSlice(index);
      });

      group.appendChild(sliceG);
    });
  }

  private highlightSlice(index: number): void {
    if (this.hoveredIndex !== index) {
      this.hoveredIndex = index;
      battleSePlayer.playSound('Audio/SE/GUI sel cursor.ogg', 0.55);
    }

    const item = this.activeItems[index];
    if (!item) return;

    // Update center hub
    const hubIcon = document.getElementById('radialHubIcon');
    const hubTitle = document.getElementById('radialHubTitle');
    const hubHotkey = document.getElementById('radialHubHotkey');
    const hubDesc = document.getElementById('radialHubDesc');

    if (hubIcon) {
      if (item.isSvgIcon) {
        hubIcon.innerHTML = `<span class="hub-emoji-large">${item.icon}</span>`;
      } else {
        hubIcon.innerHTML = `<img src="${item.icon}" alt="${item.title}" class="hub-icon-img" />`;
      }
    }

    if (hubTitle) {
      hubTitle.textContent = item.title;
      hubTitle.style.color = '#38bdf8';
    }

    if (hubHotkey) {
      hubHotkey.textContent = item.hotkey ? `[Phím ${item.hotkey}]` : '';
    }

    if (hubDesc) {
      hubDesc.textContent = item.subtitle;
    }
  }

  private resetCenterHub(): void {
    this.hoveredIndex = -1;
    const hubIcon = document.getElementById('radialHubIcon');
    const hubTitle = document.getElementById('radialHubTitle');
    const hubHotkey = document.getElementById('radialHubHotkey');
    const hubDesc = document.getElementById('radialHubDesc');

    if (hubIcon) {
      hubIcon.innerHTML = `<div class="radial-hub-pokeball"></div>`;
    }
    if (hubTitle) {
      hubTitle.textContent = 'MENU NHANH';
      hubTitle.style.color = '#f8fafc';
    }
    if (hubHotkey) {
      hubHotkey.textContent = '[ESC / Chuột Giữa]';
    }
    if (hubDesc) {
      hubDesc.textContent = 'Chọn một chức năng';
    }
  }

  private selectSlice(index: number): void {
    const item = this.activeItems[index];
    if (!item) return;

    battleSePlayer.playSound('Audio/SE/GUI sel decision.ogg', 0.85);
    this.close();

    // Trigger action after brief closing animation
    setTimeout(() => {
      item.onSelect();
    }, 60);
  }
}

export const radialMenuController = RadialMenuController.getInstance();
