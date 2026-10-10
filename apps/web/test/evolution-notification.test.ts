import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPartyPokemon } from '../src/domain/party/party-state';
import { partyService } from '../src/domain/party/party-service';
import { inventoryService } from '../src/domain/inventory/inventory-service';
import {
  EvolutionNotificationManager,
  showEvolutionNotification,
  checkPartyEvolutionNotifications,
} from '../src/ui/evolution-notification';
import { EvolutionScreen } from '../src/ui/evolution-screen';

class MockElement {
  public id: string = '';
  public className: string = '';
  private _innerHTML: string = '';
  public src: string = '';
  public title: string = '';
  public textContent: string = '';
  public style: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  public eventListeners: Record<string, ((e: any) => void)[]> = {};

  constructor(public tagName: string) {}

  public get innerHTML(): string {
    return this._innerHTML;
  }

  public set innerHTML(val: string) {
    this._innerHTML = val;
    this.children = [];
    if (!val) return;

    if (val.includes('evo-notify-pk-icon')) {
      const img = new MockElement('IMG');
      img.className = 'evo-notify-pk-icon';
      const matchSrc = val.match(/src="([^"]+)"/);
      if (matchSrc) img.src = matchSrc[1];
      this.appendChild(img);
    }

    if (val.includes('evo-notify-shiny-star')) {
      const star = new MockElement('SPAN');
      star.className = 'evo-notify-shiny-star';
      star.textContent = '✦';
      this.appendChild(star);
    }

    if (val.includes('evo-notify-title')) {
      const title = new MockElement('DIV');
      title.className = 'evo-notify-title';
      title.textContent = 'TIẾN HÓA KHẢ DỤNG';
      this.appendChild(title);
    }

    if (val.includes('evo-notify-msg')) {
      const msg = new MockElement('DIV');
      msg.className = 'evo-notify-msg';
      // extract text content loosely
      const text = val.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      msg.textContent = text;
      this.appendChild(msg);
    }

    if (val.includes('btnEvoNotifyAction')) {
      const btn = new MockElement('BUTTON');
      btn.id = 'btnEvoNotifyAction';
      btn.className = 'evo-notify-btn-evolve';
      btn.textContent = val.includes('evo-key-hint') ? 'TIẾN HÓA R' : 'TIẾN HÓA';
      if (val.includes('evo-key-hint')) {
        const hint = new MockElement('SPAN');
        hint.className = 'evo-key-hint';
        hint.textContent = 'R';
        btn.appendChild(hint);
      }
      this.appendChild(btn);
    }

    if (val.includes('btnEvoNotifyClose')) {
      const btnClose = new MockElement('BUTTON');
      btnClose.id = 'btnEvoNotifyClose';
      btnClose.className = 'evo-notify-btn-close';
      btnClose.textContent = '✕';
      this.appendChild(btnClose);
    }

    if (val.includes('evoNotifyTimerBar')) {
      const bar = new MockElement('DIV');
      bar.id = 'evoNotifyTimerBar';
      bar.className = 'evo-notify-timer-bar';
      bar.style.width = '100%';
      this.appendChild(bar);
    }
  }

  public get classList() {
    return {
      contains: (cls: string): boolean => {
        return this.className.split(/\s+/).includes(cls);
      },
      add: (cls: string): void => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        set.add(cls);
        this.className = Array.from(set).join(' ');
      },
      remove: (cls: string): void => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        set.delete(cls);
        this.className = Array.from(set).join(' ');
      },
    };
  }

  public appendChild(child: MockElement): MockElement {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  public removeChild(child: MockElement): MockElement {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  public remove(): void {
    if (this.parentElement) {
      this.parentElement.removeChild(this);
    }
  }

  public addEventListener(event: string, handler: (e: any) => void): void {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(handler);
  }

  public dispatchEvent(event: any): boolean {
    const type = event.type || event;
    const handlers = this.eventListeners[type] || [];
    for (const h of handlers) {
      h(event);
    }
    return true;
  }

  public click(): void {
    this.dispatchEvent({ type: 'click', target: this, stopPropagation: () => {} });
  }

  public closest(selector: string): MockElement | null {
    if (selector.startsWith('#') && this.id === selector.slice(1)) return this;
    if (selector.startsWith('.') && this.classList.contains(selector.slice(1))) return this;
    return null;
  }

  public querySelector<T = MockElement>(selector: string): T | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) return this as unknown as T;
      for (const c of this.children) {
        const found = c.querySelector(selector);
        if (found) return found as unknown as T;
      }
    } else if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (this.classList.contains(cls)) return this as unknown as T;
      for (const c of this.children) {
        const found = c.querySelector(selector);
        if (found) return found as unknown as T;
      }
    }
    return null;
  }
}

describe('Pixel Evolution Notification Toast (0.92)', () => {
  let manager: EvolutionNotificationManager;
  let mockBody: MockElement;
  let originalDocument: any;
  let originalWindow: any;

  beforeEach(() => {
    vi.useFakeTimers();

    mockBody = new MockElement('BODY');
    originalDocument = (globalThis as any).document;
    originalWindow = (globalThis as any).window;

    (globalThis as any).document = {
      body: mockBody,
      createElement: (tag: string) => new MockElement(tag.toUpperCase()),
      getElementById: (id: string) => mockBody.querySelector(`#${id}`),
      querySelector: (sel: string) => mockBody.querySelector(sel),
    };

    const windowEventListeners: Record<string, ((e: any) => void)[]> = {};
    (globalThis as any).window = {
      addEventListener: (evt: string, handler: (e: any) => void) => {
        if (!windowEventListeners[evt]) windowEventListeners[evt] = [];
        windowEventListeners[evt].push(handler);
      },
      removeEventListener: (evt: string, handler: (e: any) => void) => {
        if (!windowEventListeners[evt]) return;
        windowEventListeners[evt] = windowEventListeners[evt].filter((h) => h !== handler);
      },
      dispatchEvent: (evt: any) => {
        const list = windowEventListeners[evt.type] || [];
        for (const h of list) h(evt);
        return true;
      },
    };

    inventoryService.clear();
    partyService.clear();

    manager = EvolutionNotificationManager.getInstance();
    manager.resetNotified();
  });

  afterEach(() => {
    manager.destroy();
    (globalThis as any).document = originalDocument;
    (globalThis as any).window = originalWindow;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders a pixel notification toast with Pokemon avatar icon, clean title without extra symbols, names and timer bar', () => {
    const bulbasaur = createPartyPokemon('BULBASAUR', 16);
    showEvolutionNotification(bulbasaur);

    const toast = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    expect(toast).toBeTruthy();
    expect(toast?.classList.contains('evolution-notify-toast')).toBe(true);

    // Verify Pokemon avatar icon is present
    const icon = toast?.querySelector('.evo-notify-pk-icon') as unknown as MockElement;
    expect(icon).toBeTruthy();

    // Check title without extra symbols
    const title = toast?.querySelector('.evo-notify-title') as unknown as MockElement;
    expect(title?.textContent.trim()).toBe('TIẾN HÓA KHẢ DỤNG');

    const msg = toast?.querySelector('.evo-notify-msg') as unknown as MockElement;
    expect(msg?.textContent).toContain(bulbasaur.name);
    expect(msg?.textContent).toContain('Ivysaur');

    // Check action buttons with [R] keyboard shortcut hint badge
    const btnEvolve = toast?.querySelector('#btnEvoNotifyAction') as unknown as MockElement;
    expect(btnEvolve).toBeTruthy();
    expect(btnEvolve?.textContent).toContain('TIẾN HÓA');
    const keyHint = btnEvolve?.querySelector('.evo-key-hint') as unknown as MockElement;
    expect(keyHint).toBeTruthy();
    expect(keyHint?.textContent).toBe('R');

    const btnClose = toast?.querySelector('#btnEvoNotifyClose') as unknown as MockElement;
    expect(btnClose).toBeTruthy();

    // Check timer bar initialized at 100%
    const timerBar = toast?.querySelector('#evoNotifyTimerBar') as unknown as MockElement;
    expect(timerBar).toBeTruthy();
    expect(timerBar?.style.width).toBe('100%');
  });

  it('triggers evolution immediately upon pressing keyboard shortcut R', () => {
    const charmander = createPartyPokemon('CHARMANDER', 16);
    showEvolutionNotification(charmander);

    const openSpy = vi.spyOn(EvolutionScreen.getInstance(), 'open').mockImplementation(() => {});
    (globalThis as any).window.dispatchEvent({
      type: 'keydown',
      key: 'r',
      preventDefault: () => {},
      stopPropagation: () => {},
    });

    expect(openSpy).toHaveBeenCalled();
  });

  it('progressively depletes the timer bar and automatically dismisses upon timeout', () => {
    const bulbasaur = createPartyPokemon('BULBASAUR', 16);
    showEvolutionNotification(bulbasaur, undefined, 4000);

    const toast = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    expect(toast).toBeTruthy();

    const timerBar = toast?.querySelector('#evoNotifyTimerBar') as unknown as MockElement;

    // Advance 2000ms (50%)
    vi.advanceTimersByTime(2000);
    const midWidth = parseFloat(timerBar?.style.width || '100');
    expect(midWidth).toBeLessThan(70);
    expect(midWidth).toBeGreaterThan(30);

    // Advance to end of timer (remaining 2000ms + 300ms dismiss transition)
    vi.advanceTimersByTime(2300);
    const dismissedToast = document.getElementById('evolutionNotificationToast');
    expect(dismissedToast).toBeNull();
  });

  it('continues running the timer countdown steadily even when hovered', () => {
    const bulbasaur = createPartyPokemon('BULBASAUR', 16);
    showEvolutionNotification(bulbasaur, undefined, 4000);

    const toast = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    expect(toast).toBeTruthy();

    // Hover mouse over toast
    toast?.dispatchEvent({ type: 'mouseenter' });

    // Advance 2000ms while hovered (timer must continue running as requested)
    vi.advanceTimersByTime(2000);
    const timerBar = toast?.querySelector('#evoNotifyTimerBar') as unknown as MockElement;
    const widthDuringHover = parseFloat(timerBar?.style.width || '100');
    expect(widthDuringHover).toBeLessThan(70);
    expect(widthDuringHover).toBeGreaterThan(30);

    // Advance to end while hovered -> toast dismisses automatically
    vi.advanceTimersByTime(2300);
    expect(document.getElementById('evolutionNotificationToast')).toBeNull();
  });

  it('clicking close button immediately dismisses the notification', () => {
    const bulbasaur = createPartyPokemon('BULBASAUR', 16);
    showEvolutionNotification(bulbasaur);

    const toast = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    const btnClose = toast?.querySelector('#btnEvoNotifyClose') as unknown as MockElement;
    expect(btnClose).toBeTruthy();

    btnClose?.click();
    vi.advanceTimersByTime(300);

    expect(document.getElementById('evolutionNotificationToast')).toBeNull();
  });

  it('clicking [TIẾN HÓA] opens EvolutionScreen and dismisses toast', () => {
    const openSpy = vi.spyOn(EvolutionScreen.getInstance(), 'open').mockImplementation(() => {});

    const bulbasaur = createPartyPokemon('BULBASAUR', 16);
    showEvolutionNotification(bulbasaur);

    const toast = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    const btnEvolve = toast?.querySelector('#btnEvoNotifyAction') as unknown as MockElement;
    expect(btnEvolve).toBeTruthy();

    btnEvolve?.click();

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      bulbasaur,
      expect.objectContaining({ targetSpeciesKey: 'IVYSAUR' })
    );

    vi.advanceTimersByTime(300);
    expect(document.getElementById('evolutionNotificationToast')).toBeNull();
  });

  it('triggers evolution when clicking evolve on a stone-based evolution', () => {
    const openSpy = vi.spyOn(EvolutionScreen.getInstance(), 'open').mockImplementation(() => {});

    const pikachu = createPartyPokemon('PIKACHU', 25);
    pikachu.heldItem = 'thunder-stone';
    showEvolutionNotification(pikachu);

    const toast = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    const btnEvolve = toast?.querySelector('#btnEvoNotifyAction') as unknown as MockElement;
    btnEvolve?.click();

    expect(openSpy).toHaveBeenCalled();
  });

  it('automatically triggers notification when scanning party via checkPartyEvolutionNotifications', () => {
    const charmander = createPartyPokemon('CHARMANDER', 16);
    partyService.addPokemon(charmander);

    checkPartyEvolutionNotifications();

    const toast = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    expect(toast).toBeTruthy();
    const msg = toast?.querySelector('.evo-notify-msg') as unknown as MockElement;
    expect(msg?.textContent).toContain('Charmeleon');
  });

  it('does not duplicate notification for the same Pokémon at the same level', () => {
    const squirtle = createPartyPokemon('SQUIRTLE', 16);
    partyService.addPokemon(squirtle);

    checkPartyEvolutionNotifications();
    expect(document.getElementById('evolutionNotificationToast')).toBeTruthy();

    // Dismiss first toast
    manager.dismissCurrent(false);
    expect(document.getElementById('evolutionNotificationToast')).toBeNull();

    // Check again without level change -> should NOT trigger duplicate toast
    checkPartyEvolutionNotifications();
    expect(document.getElementById('evolutionNotificationToast')).toBeNull();
  });

  it('queues multiple eligible Pokémon and displays them sequentially', () => {
    const p1 = createPartyPokemon('CATERPIE', 7);
    const p2 = createPartyPokemon('WEEDLE', 7);

    manager.enqueue(p1, undefined, 2000);
    manager.enqueue(p2, undefined, 2000);

    // First toast should be Caterpie
    const toast1 = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    const msg1 = toast1?.querySelector('.evo-notify-msg') as unknown as MockElement;
    expect(msg1?.textContent).toContain(p1.name);

    // Let first toast expire
    vi.advanceTimersByTime(2300);

    // Advance queue transition
    vi.advanceTimersByTime(300);

    // Second toast should now appear with Weedle
    const toast2 = document.getElementById('evolutionNotificationToast') as unknown as MockElement;
    expect(toast2).toBeTruthy();
    const msg2 = toast2?.querySelector('.evo-notify-msg') as unknown as MockElement;
    expect(msg2?.textContent).toContain(p2.name);
  });
});
