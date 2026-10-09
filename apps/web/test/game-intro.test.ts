import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { playGameIntro } from '../src/ui/game-intro';

describe('Game Intro Cinematic', () => {
  let originalDocument: any;
  let originalWindow: any;
  let originalAudio: any;
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
      // Create sub-elements based on id
      const ids = [
        'introStage',
        'introLogo2',
        'introLogo1',
        'introRadiance',
        'introTypeRing',
        'introStartPrompt',
      ];
      for (const id of ids) {
        if (html.includes(`id="${id}"`)) {
          const child = new MockDOMElement('div');
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
    originalAudio = global.Audio;

    class MockAudio {
      src = '';
      loop = false;
      volume = 1;
      paused = true;
      currentTime = 0;
      constructor(src?: string) {
        if (src) this.src = src;
      }
      play = vi.fn().mockImplementation(() => {
        this.paused = false;
        return Promise.resolve();
      });
      pause = vi.fn().mockImplementation(() => {
        this.paused = true;
      });
    }

    (global as any).Audio = MockAudio;

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
      setInterval: (fn: (...args: unknown[]) => void, ms: number) => setInterval(fn, ms),
      clearInterval: (id: any) => clearInterval(id),
      location: { href: 'http://localhost:5173/' },
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
    } as any;
  });

  afterEach(() => {
    vi.useRealTimers();
    global.document = originalDocument;
    global.window = originalWindow;
    global.Audio = originalAudio;
  });

  it('initializes intro overlay in dark state with logos and glowing prompt', () => {
    const controller = playGameIntro();
    const overlay = document.getElementById('gameIntroOverlay') as unknown as MockDOMElement;

    expect(overlay).not.toBeNull();
    expect(overlay.id).toBe('gameIntroOverlay');
    expect(controller.isComplete).toBe(false);

    const stage = overlay.querySelector('#introStage');
    const logo2 = overlay.querySelector('#introLogo2');
    const logo1 = overlay.querySelector('#introLogo1');
    const prompt = overlay.querySelector('#introStartPrompt');

    expect(stage).not.toBeNull();
    expect(logo2).not.toBeNull();
    expect(logo1).not.toBeNull();
    expect(prompt).not.toBeNull();
  });

  it('progresses through timeline: radiance -> logo2 -> logo1 -> prompt -> auto-advance at 11th second', () => {
    const onComplete = vi.fn();
    const controller = playGameIntro(onComplete);
    const overlay = document.getElementById('gameIntroOverlay') as unknown as MockDOMElement;

    const radiance = overlay.querySelector('#introRadiance');
    const typeRing = overlay.querySelector('#introTypeRing');
    const logo2 = overlay.querySelector('#introLogo2');
    const logo1 = overlay.querySelector('#introLogo1');
    const startPrompt = overlay.querySelector('#introStartPrompt');

    // 0ms: Initial dark screen
    expect(radiance?.classList.contains('visible')).toBe(false);
    expect(typeRing?.classList.contains('visible')).toBe(false);
    expect(logo2?.classList.contains('visible')).toBe(false);
    expect(logo1?.classList.contains('visible')).toBe(false);
    expect(startPrompt?.classList.contains('visible')).toBe(false);

    // Advance 200ms: Radiance & Type Ring become visible
    vi.advanceTimersByTime(200);
    expect(radiance?.classList.contains('visible')).toBe(true);
    expect(typeRing?.classList.contains('visible')).toBe(true);
    expect(logo2?.classList.contains('visible')).toBe(false);

    // Advance to 650ms (total from start): logo2 (white outline) becomes visible
    vi.advanceTimersByTime(450);
    expect(logo2?.classList.contains('visible')).toBe(true);
    expect(logo1?.classList.contains('visible')).toBe(false);

    // Advance to 2200ms: logo1 (full-color Pokémon) reveals, logo2 dims
    vi.advanceTimersByTime(1550);
    expect(logo1?.classList.contains('visible')).toBe(true);
    expect(logo2?.classList.contains('dimmed')).toBe(true);

    // Advance to 3200ms: Glowing start prompt emerges
    vi.advanceTimersByTime(1000);
    expect(startPrompt?.classList.contains('visible')).toBe(true);

    // Advance to 10000ms: still displaying prompt and waiting for 11th second
    vi.advanceTimersByTime(6800);
    expect(controller.isComplete).toBe(false);
    expect(overlay.classList.contains('intro-fade-out')).toBe(false);

    // Advance to 11000ms (giây thứ 11): automatically triggers fade-out transition!
    vi.advanceTimersByTime(1000);
    expect(overlay.classList.contains('intro-fade-out')).toBe(true);

    // Advance 650ms: transition finishes, cleans up, invokes onComplete
    vi.advanceTimersByTime(650);
    expect(controller.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(document.getElementById('gameIntroOverlay')).toBeNull();
  });

  it('supports skip to immediately transition and finish before 11th second', () => {
    const onComplete = vi.fn();
    const controller = playGameIntro(onComplete);

    expect(controller.isComplete).toBe(false);

    // Trigger skip at 300ms
    vi.advanceTimersByTime(300);
    controller.skip();

    // Advance past fade-out transition duration
    vi.advanceTimersByTime(700);

    expect(controller.isComplete).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(document.getElementById('gameIntroOverlay')).toBeNull();
  });
});
