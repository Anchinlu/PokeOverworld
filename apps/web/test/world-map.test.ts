import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameSession } from '../src/game/game-session';
import { worldMapScreen } from '../src/ui/world-map-screen';
import { createTerrainField } from '../src/maps/terrain-field';

class MockDOMElement {
  public id: string = '';
  public className: string = '';
  public tagName: string = 'div';
  public children: MockDOMElement[] = [];
  public parentNode: MockDOMElement | null = null;
  public textContent: string = '';
  public style: Record<string, string> = {};
  public eventListeners: Record<string, ((e: any) => void)[]> = {};
  public width: number = 800;
  public height: number = 600;

  constructor(tagName = 'div') {
    this.tagName = tagName.toLowerCase();
  }

  private _innerHTML: string = '';
  get innerHTML(): string {
    return this._innerHTML;
  }
  set innerHTML(html: string) {
    this._innerHTML = html;
    this.children = [];
    const ids = [
      'worldMapBackdrop',
      'btnWorldMapClose',
      'worldMapCanvasContainer',
      'worldMapCanvas',
      'worldMapCoordsHud',
      'worldMapPlayerPos',
      'worldMapHoverRow',
      'worldMapHoverPos',
      'btnMapRecenter',
      'btnMapZoomIn',
      'btnMapZoomOut',
      'btnMapZoomReset',
      'mapZoomBadge',
    ];
    for (const id of ids) {
      if (html.includes(`id="${id}"`)) {
        const child = new MockDOMElement(id.includes('Canvas') ? 'canvas' : 'div');
        child.id = id;
        child.parentNode = this;
        this.children.push(child);
      }
    }
  }

  appendChild(child: MockDOMElement) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child: MockDOMElement) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
    }
    child.parentNode = null;
    return child;
  }

  querySelector(selector: string): MockDOMElement | null {
    const targetId = selector.startsWith('#') ? selector.slice(1) : selector;
    const findNode = (node: MockDOMElement): MockDOMElement | null => {
      if (node.id === targetId) return node;
      for (const child of node.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };
    return findNode(this);
  }

  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
    };
  }

  addEventListener(event: string, handler: (e: any) => void) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  getContext(type: string) {
    if (type === '2d') {
      return {
        canvas: this,
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        measureText: (text: string) => ({ width: text.length * 8 }),
        createImageData: (w: number, h: number) => ({
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4),
        }),
        putImageData: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
      };
    }
    return null;
  }
}

describe('World Map Screen (Overview Map / Town Map)', () => {
  let session: GameSession;
  let originalDocument: any;
  let originalWindow: any;
  let mockBody: MockDOMElement;

  beforeEach(() => {
    originalDocument = (globalThis as any).document;
    originalWindow = (globalThis as any).window;

    mockBody = new MockDOMElement('body');

    const mockDoc: any = {
      body: mockBody,
      createElement: (tagName: string) => new MockDOMElement(tagName),
      querySelector: (sel: string) => mockBody.querySelector(sel),
    };

    const mockWin: any = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      requestAnimationFrame: (cb: any) => setTimeout(cb, 16) as any,
      cancelAnimationFrame: (id: any) => clearTimeout(id),
    };

    (globalThis as any).document = mockDoc;
    (globalThis as any).window = mockWin;
    (globalThis as any).requestAnimationFrame = mockWin.requestAnimationFrame;
    (globalThis as any).cancelAnimationFrame = mockWin.cancelAnimationFrame;

    session = new GameSession(101, 2);
  });

  afterEach(() => {
    if (worldMapScreen.isOpen()) {
      worldMapScreen.close();
    }
    (globalThis as any).document = originalDocument;
    (globalThis as any).window = originalWindow;
    delete (globalThis as any).requestAnimationFrame;
    delete (globalThis as any).cancelAnimationFrame;
  });

  it('initially reports isOpen() as false', () => {
    expect(worldMapScreen.isOpen()).toBe(false);
  });

  it('opens and mounts overlay DOM, initializes center at player position', () => {
    worldMapScreen.open(session);
    expect(worldMapScreen.isOpen()).toBe(true);

    const overlay = document.querySelector('#worldMapOverlay');
    expect(overlay).not.toBeNull();

    const canvas = document.querySelector('#worldMapCanvas');
    expect(canvas).not.toBeNull();

    const playerPosEl = document.querySelector('#worldMapPlayerPos');
    expect(playerPosEl?.textContent).toContain(`X: ${session.player.gx}, Y: ${session.player.gy}`);
  });

  it('closes and unmounts overlay DOM on close()', () => {
    worldMapScreen.open(session);
    expect(worldMapScreen.isOpen()).toBe(true);

    worldMapScreen.close();
    expect(worldMapScreen.isOpen()).toBe(false);

    const overlay = document.querySelector('#worldMapOverlay');
    expect(overlay).toBeNull();
  });

  it('toggles open and close correctly', () => {
    expect(worldMapScreen.isOpen()).toBe(false);

    worldMapScreen.toggle(session);
    expect(worldMapScreen.isOpen()).toBe(true);

    worldMapScreen.toggle(session);
    expect(worldMapScreen.isOpen()).toBe(false);
  });

  it('inspectTile correctly identifies terrain classes and settlements', () => {
    const field = createTerrainField(2, 101);

    // Starter village origin (0, 0)
    const startTileInfo = worldMapScreen.inspectTile(0, 0, field);
    expect(startTileInfo.gx).toBe(0);
    expect(startTileInfo.gy).toBe(0);
    expect(startTileInfo.villageName).toBe('Pallet Town');

    // Sample deep ocean
    const oceanGX = 0;
    const oceanGY = 700;
    if (field.isOcean(oceanGX, oceanGY)) {
      const oceanInfo = worldMapScreen.inspectTile(oceanGX, oceanGY, field);
      expect(oceanInfo.terrainName).toMatch(/Đại dương|nước/);
    }
  });

  it('clamps zoom levels within [0.5, 6.0]', () => {
    worldMapScreen.open(session);

    // Excessively zoom in
    worldMapScreen.setZoom(100.0);
    const badgeEl = document.querySelector('#mapZoomBadge');
    expect(badgeEl?.textContent).toBe('600%');

    // Excessively zoom out
    worldMapScreen.setZoom(0.01);
    expect(badgeEl?.textContent).toBe('50%');

    // Normal zoom
    worldMapScreen.setZoom(2.0);
    expect(badgeEl?.textContent).toBe('200%');
  });

  it('recenters camera to player position on recenterOnPlayer()', () => {
    worldMapScreen.open(session);

    // Move player
    session.player.gx = 42;
    session.player.gy = -88;

    worldMapScreen.recenterOnPlayer();
    const playerPosEl = document.querySelector('#worldMapPlayerPos');
    expect(playerPosEl?.textContent).toBe('X: 42, Y: -88');
  });
});
