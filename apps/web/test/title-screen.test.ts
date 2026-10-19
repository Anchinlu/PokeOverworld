import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showTitleScreen } from '../src/ui/title-screen';
import { createOverlayTemplate } from '../src/ui/game-overlay';

describe('Game Title Screen / Màn Hình Chờ', () => {
  let originalDocument: any;
  let originalWindow: any;
  let mockBody: any;
  let eventListeners: Record<string, ((e: any) => void)[]>;

  class MockDOMElement {
    public id: string = '';
    public className: string = '';
    public textContent: string = '';
    public dataset: Record<string, string> = {};
    public style: Record<string, string> = {};
    public classList = {
      _classes: new Set<string>(),
      add: (cls: string) => {
        this.classList._classes.add(cls);
        this.className = Array.from(this.classList._classes).join(' ');
      },
      remove: (cls: string) => {
        this.classList._classes.delete(cls);
        this.className = Array.from(this.classList._classes).join(' ');
      },
      contains: (cls: string) => this.classList._classes.has(cls),
    };
    public _value: string = '60';
    public children: MockDOMElement[] = [];
    public parentNode: MockDOMElement | null = null;
    public innerHTMLVal: string = '';
    public listeners: Record<string, ((e: any) => void)[]> = {};

    constructor(public tagName: string) {}

    get value(): string {
      if (this.tagName === 'select' && this.children.length > 0) {
        return this._value === '60' ? (this.children[0].value || 'slot_1') : this._value;
      }
      return this._value;
    }

    set value(v: string) {
      this._value = v;
    }

    get innerText(): string {
      return this.textContent;
    }

    set innerText(text: string) {
      this.textContent = text;
    }

    get innerHTML(): string {
      return this.innerHTMLVal;
    }

    set innerHTML(html: string) {
      this.innerHTMLVal = html;
      this.children = [];
      const ids = [
        'titleScreenCanvas',
        'titleScreenUi',
        'titleStartPrompt',
        'btnTitleDevQuick',
        'btnNewWorld',
        'btnLoadWorld',
        'btnJoinWorld',
        'btnSettings',
        'titleSettingsModal',
        'btnSettingsModalCloseX',
        'btnSettingsModalDone',
        'btnToggleSunsetTheme',
        'txtSunsetTheme',
        'sliderTitleBgm',
        'txtTitleBgmVol',
        'btnTitleBgmMute',
        // New World modal
        'titleNewWorldModal',
        'newWorldModalTitle',
        'btnNewWorldModalCloseX',
        'inputWorldSeed',
        'btnRerollSeed',
        'selectSaveSlot',
        'txtSlotStatus',
        'btnCancelCreateWorld',
        'btnConfirmCreateWorld',
        // Load World modal
        'titleLoadWorldModal',
        'loadWorldModalTitle',
        'btnLoadWorldModalCloseX',
        'titleSavedWorldsList',
        'btnLoadModalClose',
      ];
      for (const id of ids) {
        if (html.includes(`id="${id}"`)) {
          const child = new MockDOMElement(
            id.includes('Canvas')
              ? 'canvas'
              : id.includes('input')
                ? 'input'
                : id.includes('select')
                  ? 'select'
                  : 'div'
          );
          child.id = id;
          child.parentNode = this;
          this.children.push(child);
        }
      }

      // Parse buttons with data-slot
      const playMatches = html.matchAll(/class="[^"]*btn-slot-play[^"]*"[^>]*data-slot="([^"]+)"/g);
      for (const m of playMatches) {
        const btn = new MockDOMElement('button');
        btn.className = 'title-pixel-btn btn-slot-play';
        btn.dataset = { slot: m[1] };
        btn.parentNode = this;
        this.children.push(btn);
      }

      const delMatches = html.matchAll(/class="[^"]*btn-slot-delete[^"]*"[^>]*data-slot="([^"]+)"/g);
      for (const m of delMatches) {
        const btn = new MockDOMElement('button');
        btn.className = 'title-pixel-btn btn-slot-delete';
        btn.dataset = { slot: m[1] };
        btn.parentNode = this;
        this.children.push(btn);
      }
    }

    appendChild(child: MockDOMElement) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    remove() {
      if (this.parentNode) {
        const idx = this.parentNode.children.indexOf(this);
        if (idx !== -1) {
          this.parentNode.children.splice(idx, 1);
        }
        this.parentNode = null;
      }
    }

    querySelector(selector: string): MockDOMElement | null {
      const targetId = selector.startsWith('#') ? selector.slice(1) : selector;
      const findRecursive = (node: MockDOMElement): MockDOMElement | null => {
        if (node.id === targetId) return node;
        for (const c of node.children) {
          const res = findRecursive(c);
          if (res) return res;
        }
        return null;
      };
      return findRecursive(this);
    }

    querySelectorAll(selector: string): MockDOMElement[] {
      const results: MockDOMElement[] = [];
      const isClass = selector.startsWith('.');
      const target = isClass ? selector.slice(1) : selector;
      const collect = (node: MockDOMElement) => {
        if (isClass) {
          if (node.classList.contains(target) || node.className.split(' ').includes(target)) {
            results.push(node);
          }
        } else if (node.tagName.toLowerCase() === selector.toLowerCase()) {
          results.push(node);
        }
        for (const c of node.children) {
          collect(c);
        }
      };
      for (const c of this.children) {
        collect(c);
      }
      return results;
    }

    getContext() {
      return {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
      };
    }

    click() {
      const e = { stopPropagation: vi.fn(), target: this };
      for (const h of this.listeners['click'] || []) {
        h(e);
      }
    }

    addEventListener(event: string, handler: (e: any) => void) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(handler);
      eventListeners[`element_${event}`] = eventListeners[`element_${event}`] || [];
      eventListeners[`element_${event}`].push(handler);
    }

    removeEventListener(event: string, handler: (e: any) => void) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
      }
      if (eventListeners[`element_${event}`]) {
        eventListeners[`element_${event}`] = eventListeners[`element_${event}`].filter(
          (h) => h !== handler
        );
      }
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    eventListeners = {};
    mockBody = new MockDOMElement('body');

    originalDocument = global.document;
    originalWindow = global.window;

    class MockAudio {
      src = '';
      loop = false;
      volume = 0.6;
      paused = true;
      currentTime = 0;
      constructor(src?: string) {
        if (src) this.src = src;
      }
      play = vi.fn().mockResolvedValue(undefined);
      pause = vi.fn().mockImplementation(() => {
        this.paused = true;
      });
    }
    vi.stubGlobal('Audio', MockAudio);

    global.Image = class MockImage {
      src = '';
      complete = true;
      naturalWidth = 100;
      naturalHeight = 100;
    } as any;

    global.document = {
      body: mockBody,
      getElementById: (id: string) => {
        return mockBody.querySelector(`#${id}`);
      },
      createElement: (tag: string) => new MockDOMElement(tag),
    } as any;

    global.window = {
      setTimeout: (fn: (...args: unknown[]) => void, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: any) => clearTimeout(id),
      addEventListener: (event: string, handler: (e: any) => void) => {
        eventListeners[`window_${event}`] = eventListeners[`window_${event}`] || [];
        eventListeners[`window_${event}`].push(handler);
      },
      removeEventListener: (event: string, handler: (e: any) => void) => {
        if (eventListeners[`window_${event}`]) {
          eventListeners[`window_${event}`] = eventListeners[`window_${event}`].filter(
            (h) => h !== handler
          );
        }
      },
      requestAnimationFrame: (fn: (time: number) => void) => {
        return setTimeout(() => fn(Date.now()), 16) as any;
      },
      cancelAnimationFrame: (id: any) => {
        clearTimeout(id);
      },
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.document = originalDocument;
    global.window = originalWindow;
  });

  it('mounts title screen overlay with canvas, menu buttons, and dev button', () => {
    const controller = showTitleScreen();
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;

    expect(overlay).not.toBeNull();
    expect(overlay.querySelector('#titleScreenCanvas')).not.toBeNull();
    expect(overlay.querySelector('#btnNewWorld')).not.toBeNull();
    expect(overlay.querySelector('#btnTitleDevQuick')).not.toBeNull();

    controller.destroy();
    expect(document.getElementById('titleScreenOverlay')).toBeNull();
  });

  it('triggers start transition and invokes onStart callback', () => {
    const onStart = vi.fn();
    const controller = showTitleScreen({ onStart });

    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;
    expect(overlay).not.toBeNull();

    controller.start();
    expect(overlay.classList.contains('fade-out')).toBe(true);

    vi.advanceTimersByTime(500);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(document.getElementById('titleScreenOverlay')).toBeNull();
  });

  it('supports dev quick test button to immediately start world', () => {
    const onStart = vi.fn();
    showTitleScreen({ onStart });

    // Trigger dev button handler
    const devHandlers = eventListeners['element_click'] || [];
    const mockClickEvent = {
      stopPropagation: vi.fn(),
    };
    for (const h of devHandlers) {
      h(mockClickEvent);
    }

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(document.getElementById('titleScreenOverlay')).toBeNull();
  });

  it('renders all 4 procedural pixel menu buttons without external assets', () => {
    showTitleScreen();
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;
    expect(overlay.querySelector('#btnNewWorld')).not.toBeNull();
    expect(overlay.querySelector('#btnLoadWorld')).not.toBeNull();
    expect(overlay.querySelector('#btnJoinWorld')).not.toBeNull();
    expect(overlay.querySelector('#btnSettings')).not.toBeNull();
  });

  it('opens pixel settings modal and toggles sunset and night themes', () => {
    const controller = showTitleScreen({ initialTheme: 'day' });
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;
    const modal = overlay.querySelector('#titleSettingsModal') as unknown as MockDOMElement;
    expect(overlay.querySelector('#btnSettings')).not.toBeNull();
    expect(overlay.querySelector('#btnToggleSunsetTheme')).not.toBeNull();
    expect(overlay.querySelector('#btnSettingsModalDone')).not.toBeNull();

    expect(modal).not.toBeNull();
    expect(controller.getTheme()).toBe('day');

    // Simulate clicking Settings button
    const mockClickEvent = { stopPropagation: vi.fn() };
    const handlers = eventListeners['element_click'] || [];
    for (const h of handlers) {
      h(mockClickEvent);
    }

    // Toggle theme via controller & verify state for sunset and night
    controller.setTheme('sunset');
    expect(controller.getTheme()).toBe('sunset');

    controller.setTheme('night');
    expect(controller.getTheme()).toBe('night');

    controller.setTheme('day');
    expect(controller.getTheme()).toBe('day');

    controller.destroy();
  });

  it('configures and controls title screen background music volume', () => {
    const controller = showTitleScreen();
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;
    const slider = overlay.querySelector('#sliderTitleBgm') as unknown as MockDOMElement;
    const badge = overlay.querySelector('#txtTitleBgmVol') as unknown as MockDOMElement;
    const btnMute = overlay.querySelector('#btnTitleBgmMute') as unknown as MockDOMElement;

    expect(slider).not.toBeNull();
    expect(badge).not.toBeNull();
    expect(btnMute).not.toBeNull();

    // Adjust volume via controller
    controller.setBgmVolume(0.8);
    expect(controller.getBgmVolume()).toBe(0.8);

    controller.setBgmVolume(0);
    expect(controller.getBgmVolume()).toBe(0);

    controller.setBgmVolume(0.5);
    expect(controller.getBgmVolume()).toBe(0.5);

    controller.destroy();
  });

  it('opens New World modal, randomizes world seed, and invokes onNewWorld callback', () => {
    const onNewWorld = vi.fn();
    const controller = showTitleScreen({ onNewWorld });
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;

    const btnNewWorld = overlay.querySelector('#btnNewWorld') as unknown as MockDOMElement;
    const newWorldModal = overlay.querySelector('#titleNewWorldModal') as unknown as MockDOMElement;
    const inputSeed = overlay.querySelector('#inputWorldSeed') as unknown as MockDOMElement;
    const btnReroll = overlay.querySelector('#btnRerollSeed') as unknown as MockDOMElement;
    const btnConfirm = overlay.querySelector('#btnConfirmCreateWorld') as unknown as MockDOMElement;

    expect(btnNewWorld).not.toBeNull();
    expect(newWorldModal).not.toBeNull();
    expect(inputSeed).not.toBeNull();

    // 1. Click New World button -> modal opens with randomized seed
    btnNewWorld.click();
    expect(newWorldModal.style.display).toBe('flex');
    const initialSeed = parseInt(inputSeed.value, 10);
    expect(initialSeed).toBeGreaterThan(0);

    // 2. Click Reroll Seed -> generates a seed
    btnReroll.click();
    const rerolledSeed = parseInt(inputSeed.value, 10);
    expect(rerolledSeed).toBeGreaterThan(0);

    // 3. Confirm create world -> onNewWorld called with seed and slot
    btnConfirm.click();
    expect(overlay.classList.contains('fade-out')).toBe(true);
    vi.advanceTimersByTime(500);

    expect(onNewWorld).toHaveBeenCalledTimes(1);
    expect(onNewWorld).toHaveBeenCalledWith(rerolledSeed, 'slot_1');

    controller.destroy();
  });

  it('opens Load World modal, renders saved slots, and triggers onLoadWorld callback', () => {
    const onLoadWorld = vi.fn();
    const mockSaveRepo: any = {
      listSaves: vi.fn().mockReturnValue([
        {
          version: 3,
          savedAt: 1776510000000,
          slotId: 'slot_1',
          playerName: 'Ash',
          money: 3500,
          badgesCount: 2,
          partyCount: 3,
          pcCount: 4,
          leaderName: 'Pikachu',
          leaderLevel: 25,
          playTimeSeconds: 3665,
          worldSeed: 554433,
          worldGenVersion: 3,
        },
      ]),
      deleteSave: vi.fn().mockReturnValue(true),
    };

    const controller = showTitleScreen({
      onLoadWorld,
      saveRepository: mockSaveRepo,
    });
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;
    const btnLoadWorld = overlay.querySelector('#btnLoadWorld') as unknown as MockDOMElement;
    const loadWorldModal = overlay.querySelector('#titleLoadWorldModal') as unknown as MockDOMElement;
    const savedList = overlay.querySelector('#titleSavedWorldsList') as unknown as MockDOMElement;

    expect(btnLoadWorld).not.toBeNull();
    expect(loadWorldModal).not.toBeNull();

    // Click Load World -> opens modal and renders saves
    btnLoadWorld.click();
    expect(loadWorldModal.style.display).toBe('flex');
    expect(mockSaveRepo.listSaves).toHaveBeenCalled();

    // Verify card rendered with play and delete buttons
    const playButtons = savedList.querySelectorAll('.btn-slot-play');
    expect(playButtons.length).toBe(1);
    expect(playButtons[0].dataset.slot).toBe('slot_1');

    // Click Play on the slot card
    playButtons[0].click();
    expect(overlay.classList.contains('fade-out')).toBe(true);
    vi.advanceTimersByTime(500);

    expect(onLoadWorld).toHaveBeenCalledTimes(1);
    expect(onLoadWorld).toHaveBeenCalledWith('slot_1');

    controller.destroy();
  });

  it('displays empty state in Load World modal when repository has no saves', () => {
    const mockSaveRepo: any = {
      listSaves: vi.fn().mockReturnValue([]),
      deleteSave: vi.fn(),
    };

    const controller = showTitleScreen({ saveRepository: mockSaveRepo });
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;
    const btnLoadWorld = overlay.querySelector('#btnLoadWorld') as unknown as MockDOMElement;
    const loadWorldModal = overlay.querySelector('#titleLoadWorldModal') as unknown as MockDOMElement;
    const savedList = overlay.querySelector('#titleSavedWorldsList') as unknown as MockDOMElement;

    btnLoadWorld.click();
    expect(loadWorldModal.style.display).toBe('flex');
    expect(savedList.innerHTML).toContain('Chưa có bản thế giới nào được lưu');

    controller.destroy();
  });

  describe('In-game Quit Button (btnMenuQuit) -> Return to Title Screen', () => {
    it('renders btnMenuQuit in the game navigation bar with proper title and label', () => {
      const template = createOverlayTemplate();
      expect(template).toContain('id="btnMenuQuit"');
      expect(template).toContain('title="Thoát ra màn hình chờ (Quit to Title Screen)"');
      expect(template).toContain('aria-label="Thoát"');
    });

    it('cleans up active session and returns cleanly to title screen when quitting', () => {
      // Mock game state
      const mockSaveGame = vi.fn();
      const mockLoopStop = vi.fn();
      const mockAbort = vi.fn();
      const mockDebugDestroy = vi.fn();
      const mockCanvasClear = vi.fn();

      let isWorldLaunched = true;
      let titleScreenMounted = false;

      const mockSession = {
        isBattling: false,
      };

      const quitToTitleScreen = () => {
        if (mockSession.isBattling) return;

        // Auto-save
        mockSaveGame();

        // Loop stop & cleanup
        mockLoopStop();
        mockAbort();
        mockDebugDestroy();
        mockCanvasClear();
        isWorldLaunched = false;

        // Mount title screen
        titleScreenMounted = true;
      };

      // Battle guard test: Cannot quit while battling
      mockSession.isBattling = true;
      quitToTitleScreen();
      expect(mockSaveGame).not.toHaveBeenCalled();
      expect(mockLoopStop).not.toHaveBeenCalled();
      expect(isWorldLaunched).toBe(true);

      // Normal quit test: when not battling
      mockSession.isBattling = false;
      quitToTitleScreen();
      expect(mockSaveGame).toHaveBeenCalledTimes(1);
      expect(mockLoopStop).toHaveBeenCalledTimes(1);
      expect(mockAbort).toHaveBeenCalledTimes(1);
      expect(mockDebugDestroy).toHaveBeenCalledTimes(1);
      expect(mockCanvasClear).toHaveBeenCalledTimes(1);
      expect(isWorldLaunched).toBe(false);
      expect(titleScreenMounted).toBe(true);
    });
  });
});
