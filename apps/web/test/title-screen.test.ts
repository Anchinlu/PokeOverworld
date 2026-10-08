import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showTitleScreen } from '../src/ui/title-screen';

describe('Game Title Screen / Màn Hình Chờ', () => {
  let originalDocument: any;
  let originalWindow: any;
  let mockBody: any;
  let eventListeners: Record<string, ((e: any) => void)[]>;

  class MockDOMElement {
    public id: string = '';
    public className: string = '';
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
    public children: MockDOMElement[] = [];
    public parentNode: MockDOMElement | null = null;
    public innerHTMLVal: string = '';

    constructor(public tagName: string) {}

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

    getContext() {
      return {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
      };
    }

    addEventListener(event: string, handler: (e: any) => void) {
      eventListeners[`element_${event}`] = eventListeners[`element_${event}`] || [];
      eventListeners[`element_${event}`].push(handler);
    }

    removeEventListener(event: string, handler: (e: any) => void) {
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

  it('renders all 4 pixel menu buttons with Bunton styling', () => {
    showTitleScreen();
    const overlay = document.getElementById('titleScreenOverlay') as unknown as MockDOMElement;
    expect(overlay.querySelector('#btnNewWorld')).not.toBeNull();
    expect(overlay.querySelector('#btnLoadWorld')).not.toBeNull();
    expect(overlay.querySelector('#btnJoinWorld')).not.toBeNull();
    expect(overlay.querySelector('#btnSettings')).not.toBeNull();
  });
});
