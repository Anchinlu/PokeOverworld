import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PartyMapHud } from '../src/ui/party-map-hud';
import { partyService } from '../src/domain/party/party-service';
import { createPartyPokemon } from '../src/domain/party/party-state';

// Simple lightweight DOM node mock for testing
class MockElement {
  public id: string = '';
  public className: string = '';
  public innerHTML: string = '';
  public textContent: string = '';
  public title: string = '';
  public style: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public children: MockElement[] = [];
  public parentNode: MockElement | null = null;
  public eventListeners: Record<string, ((e: any) => void)[]> = {};

  constructor(public tagName: string) {}

  public setAttribute(name: string, value: string): void {
    if (name === 'id') this.id = value;
    if (name === 'class') this.className = value;
  }

  public get classList() {
    const self = this;
    return {
      contains(cls: string): boolean {
        return self.className.split(/\s+/).includes(cls);
      },
      add(cls: string): void {
        const classes = new Set(self.className.split(/\s+/).filter(Boolean));
        classes.add(cls);
        self.className = Array.from(classes).join(' ');
      },
      remove(cls: string): void {
        const classes = new Set(self.className.split(/\s+/).filter(Boolean));
        classes.delete(cls);
        self.className = Array.from(classes).join(' ');
      },
      toggle(cls: string, force?: boolean): boolean {
        const has = this.contains(cls);
        const shouldAdd = force !== undefined ? force : !has;
        if (shouldAdd) this.add(cls);
        else this.remove(cls);
        return shouldAdd;
      },
    };
  }

  public appendChild(child: MockElement): MockElement {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  public removeChild(child: MockElement): MockElement {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  public addEventListener(event: string, handler: (e: any) => void): void {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(handler);
  }

  public querySelector(selector: string): MockElement | null {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    } else if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (this.classList.contains(cls)) return this;
      for (const child of this.children) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  public querySelectorAll(selector: string): MockElement[] {
    const results: MockElement[] = [];
    const check = (node: MockElement) => {
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        if (node.classList.contains(cls)) results.push(node);
      }
      for (const child of node.children) {
        check(child);
      }
    };
    for (const child of this.children) {
      check(child);
    }
    return results;
  }
}

describe('Overworld Map Party HUD (databox_normal.png)', () => {
  let hud: PartyMapHud;
  let mockBody: MockElement;

  beforeEach(() => {
    mockBody = new MockElement('BODY');

    // Setup global document mock
    (global as any).document = {
      body: mockBody,
      createElement(tag: string) {
        return new MockElement(tag.toUpperCase());
      },
      querySelector(selector: string) {
        return mockBody.querySelector(selector);
      },
    };

    partyService.reset();
    hud = PartyMapHud.getInstance();
  });

  afterEach(() => {
    hud.destroy();
    delete (global as any).document;
  });

  it('supports toggle collapse functionality and state queries', () => {
    expect(hud.isHudCollapsed()).toBe(false);

    hud.toggleCollapse();
    expect(hud.isHudCollapsed()).toBe(true);

    hud.toggleCollapse();
    expect(hud.isHudCollapsed()).toBe(false);
  });

  it('supports setVisible and isHudVisible', () => {
    expect(hud.isHudVisible()).toBe(true);

    hud.setVisible(false);
    expect(hud.isHudVisible()).toBe(false);

    hud.setVisible(true);
    expect(hud.isHudVisible()).toBe(true);
  });

  it('safely handles party updates and destroy cleanup', () => {
    const bulbasaur = createPartyPokemon('BULBASAUR', 10);
    partyService.addPokemon(bulbasaur);

    expect(partyService.getParty().length).toBeGreaterThanOrEqual(1);

    // Call render explicitly
    hud.render();

    // Destroy
    expect(() => hud.destroy()).not.toThrow();
  });
});
