/**
 * Interactive Door Entrance Prompt & Modal System
 *
 * When player approaches within 1 tile of a building door (e.g. Oak Lab):
 * - Renders a sleek floating interaction badge: "[Space / Enter] Cửa Viện Nghiên Cứu Oak"
 * - Pressing Space/Enter/KeyE opens the modal:
 *     "Bạn có muốn bước vào Viện Nghiên Cứu không?"
 *     [▶ Vào trong]   [Thoát]
 * - Allows seamless keyboard navigation (Arrow keys / Enter / Escape) and click.
 */

export interface DoorPromptOptions {
  buildingName: string;
  onEnter: () => void;
  onCancel?: () => void;
}

export function playDoorTransition(onMidpoint: () => void, onComplete?: () => void): void {
  if (typeof document === 'undefined') {
    onMidpoint();
    onComplete?.();
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'door-fade-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:#000;z-index:99999;opacity:0;transition:opacity 0.22s ease-in-out;pointer-events:none;';
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    setTimeout(() => {
      onMidpoint();
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        onComplete?.();
      }, 240);
    }, 240);
  });
}

export class DoorPromptModal {
  private static instance: DoorPromptModal | null = null;

  public static getInstance(): DoorPromptModal {
    if (!DoorPromptModal.instance) {
      DoorPromptModal.instance = new DoorPromptModal();
    }
    return DoorPromptModal.instance;
  }

  private indicatorEl: HTMLDivElement | null = null;
  private modalContainer: HTMLDivElement | null = null;
  private isOpen = false;
  private currentOptions: DoorPromptOptions | null = null;
  private selectedIndex = 0; // 0 = Enter, 1 = Cancel
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.createElements();
  }

  private createElements(): void {
    if (typeof document === 'undefined') return;

    // 1. Floating Prompt Badge (Clean modern floating pill, no icons)
    this.indicatorEl = document.createElement('div');
    this.indicatorEl.id = 'doorInteractBadge';
    this.indicatorEl.className = 'door-interact-badge';
    this.indicatorEl.style.display = 'none';
    this.indicatorEl.innerHTML = `
      <span class="badge-key">Space / Enter</span>
      <span class="badge-text" id="doorBadgeText">Vào trong</span>
    `;
    document.body.appendChild(this.indicatorEl);

    // 2. Interactive Modal Dialog (Clean modern glass card, no icons)
    this.modalContainer = document.createElement('div');
    this.modalContainer.id = 'doorModalContainer';
    this.modalContainer.className = 'door-modal-overlay';
    this.modalContainer.style.display = 'none';
    this.modalContainer.innerHTML = `
      <div class="door-modal-box" role="dialog" aria-modal="true">
        <div class="door-modal-header">
          <h3 class="door-modal-title" id="doorModalTitle">Viện Nghiên Cứu Oak</h3>
        </div>
        <p class="door-modal-desc" id="doorModalDesc">Bạn có muốn bước vào bên trong Viện Nghiên Cứu không?</p>
        <div class="door-modal-actions">
          <button class="door-btn door-btn-enter active" id="btnDoorEnter" tabindex="0">
            Vào trong
          </button>
          <button class="door-btn door-btn-cancel" id="btnDoorCancel" tabindex="0">
            Thoát
          </button>
        </div>
        <div class="door-modal-hint">Dùng phím mũi tên để chọn, Enter để xác nhận, Esc để thoát</div>
      </div>
    `;
    document.body.appendChild(this.modalContainer);

    this.bindEvents();
  }

  private bindEvents(): void {
    const btnEnter = this.modalContainer?.querySelector('#btnDoorEnter');
    const btnCancel = this.modalContainer?.querySelector('#btnDoorCancel');

    btnEnter?.addEventListener('click', () => {
      this.confirmEnter();
    });

    btnCancel?.addEventListener('click', () => {
      this.close();
    });

    // Also clicking badge directly opens modal
    this.indicatorEl?.addEventListener('click', () => {
      if (this.currentOptions && !this.isOpen) {
        this.open(this.currentOptions);
      }
    });
  }

  public showIndicator(buildingName: string, options: DoorPromptOptions): void {
    if (this.isOpen) return;
    this.currentOptions = options;
    if (this.indicatorEl) {
      const textEl = this.indicatorEl.querySelector('#doorBadgeText');
      if (textEl) textEl.textContent = buildingName;
      this.indicatorEl.style.display = 'flex';
      this.indicatorEl.style.opacity = '1';
    }
  }

  public hideIndicator(): void {
    if (this.indicatorEl) {
      this.indicatorEl.style.display = 'none';
      this.indicatorEl.style.opacity = '0';
    }
    if (!this.isOpen) {
      this.currentOptions = null;
    }
  }

  public isPromptOpen(): boolean {
    return this.isOpen;
  }

  public open(options: DoorPromptOptions): void {
    this.currentOptions = options;
    this.isOpen = true;
    this.selectedIndex = 0; // Default: 'Vào trong'
    this.hideIndicator();

    if (this.modalContainer) {
      const titleEl = this.modalContainer.querySelector('#doorModalTitle');
      const descEl = this.modalContainer.querySelector('#doorModalDesc');
      if (titleEl) titleEl.textContent = options.buildingName;
      if (descEl) descEl.textContent = `Bạn có muốn bước vào bên trong ${options.buildingName} không?`;
      this.modalContainer.style.display = 'flex';
      this.updateSelectionUi();
    }

    this.attachKeyboardListener();
  }

  public close(): void {
    this.isOpen = false;
    if (this.modalContainer) {
      this.modalContainer.style.display = 'none';
    }
    this.detachKeyboardListener();
    this.currentOptions?.onCancel?.();
  }

  private confirmEnter(): void {
    const opt = this.currentOptions;
    this.isOpen = false;
    if (this.modalContainer) {
      this.modalContainer.style.display = 'none';
    }
    this.detachKeyboardListener();
    if (opt?.onEnter) {
      opt.onEnter();
    }
  }

  private updateSelectionUi(): void {
    if (!this.modalContainer) return;
    const btnEnter = this.modalContainer.querySelector<HTMLButtonElement>('#btnDoorEnter');
    const btnCancel = this.modalContainer.querySelector<HTMLButtonElement>('#btnDoorCancel');

    if (this.selectedIndex === 0) {
      btnEnter?.classList.add('active');
      btnCancel?.classList.remove('active');
      btnEnter?.focus();
    } else {
      btnEnter?.classList.remove('active');
      btnCancel?.classList.add('active');
      btnCancel?.focus();
    }
  }

  private attachKeyboardListener(): void {
    this.detachKeyboardListener();
    this.keydownListener = (e: KeyboardEvent) => {
      if (!this.isOpen) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        e.stopPropagation();
        this.selectedIndex = 0;
        this.updateSelectionUi();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        e.stopPropagation();
        this.selectedIndex = 1;
        this.updateSelectionUi();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        if (this.selectedIndex === 0) {
          this.confirmEnter();
        } else {
          this.close();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.keydownListener, { capture: true });
    }
  }

  private detachKeyboardListener(): void {
    if (this.keydownListener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownListener, { capture: true });
      this.keydownListener = null;
    }
  }
}
