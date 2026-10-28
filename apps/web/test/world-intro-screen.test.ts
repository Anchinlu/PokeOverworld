import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { playWorldIntro } from '../src/ui/world-intro-screen';

describe('World Creation Intro Screen', () => {
  let originalDocument: any;
  let originalWindow: any;
  let originalAudio: any;
  let mockBody: any;
  let eventListeners: Record<string, ((e: any) => void)[]>;

  class MockDOMElement {
    public id: string = '';
    public className: string = '';
    public tagName: string = 'div';
    public style: Record<string, string> = {};
    public dataset: Record<string, string> = {};
    public disabled: boolean = false;
    public volume: number = 1.0;
    public muted: boolean = false;
    public duration: number = 10.3;
    public currentTime: number = 0;
    public src: string = '';
    public textContent: string = '';
    public innerHTMLVal: string = '';
    public children: MockDOMElement[] = [];
    public parentNode: MockDOMElement | null = null;
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
      toggle: (cls: string, force?: boolean) => {
        if (force === undefined) {
          if (this.classList._classes.has(cls)) this.classList._classes.delete(cls);
          else this.classList._classes.add(cls);
        } else if (force) {
          this.classList._classes.add(cls);
        } else {
          this.classList._classes.delete(cls);
        }
        this.className = Array.from(this.classList._classes).join(' ');
      },
      contains: (cls: string) => this.classList._classes.has(cls),
    };

    private listeners: Record<string, ((e: any) => void)[]> = {};

    constructor(tagName: string = 'div') {
      this.tagName = tagName;
    }

    get innerHTML(): string {
      return this.innerHTMLVal;
    }

    set innerHTML(html: string) {
      this.innerHTMLVal = html;
      this.children = [];

      // Parse some mocked child elements
      const idMatches = [...html.matchAll(/id="([^"]+)"/g)];
      for (const m of idMatches) {
        const id = m[1];
        const el = new MockDOMElement('div');
        el.id = id;
        el.parentNode = this;
        this.children.push(el);
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
      if (selector.startsWith('#')) {
        const id = selector.slice(1);
        return this.findElementById(id);
      }
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        return this.findElementByClass(cls);
      }
      return null;
    }

    querySelectorAll(selector: string): MockDOMElement[] {
      const results: MockDOMElement[] = [];
      if (selector.startsWith('.')) {
        const cls = selector.slice(1);
        this.collectElementsByClass(cls, results);
      }
      return results;
    }

    private findElementById(id: string): MockDOMElement | null {
      for (const child of this.children) {
        if (child.id === id) return child;
        const found = child.findElementById(id);
        if (found) return found;
      }
      return null;
    }

    private findElementByClass(cls: string): MockDOMElement | null {
      for (const child of this.children) {
        if (child.classList.contains(cls)) return child;
        const found = child.findElementByClass(cls);
        if (found) return found;
      }
      return null;
    }

    private collectElementsByClass(cls: string, acc: MockDOMElement[]) {
      for (const child of this.children) {
        if (child.classList.contains(cls)) acc.push(child);
        child.collectElementsByClass(cls, acc);
      }
    }

    addEventListener(event: string, handler: (e: any) => void) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
    }

    removeEventListener(event: string, handler: (e: any) => void) {
      if (this.listeners[event]) {
        this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
      }
    }

    dispatchEvent(event: { type: string; [key: string]: any }) {
      const handlers = this.listeners[event.type] || [];
      for (const h of handlers) {
        h(event);
      }
    }

    play() {
      return Promise.resolve();
    }

    pause() {}
  }

  beforeEach(() => {
    vi.useFakeTimers();
    eventListeners = {};
    mockBody = new MockDOMElement('body');

    originalDocument = (global as any).document;
    originalWindow = (global as any).window;
    originalAudio = (global as any).Audio;

    (global as any).document = {
      body: mockBody,
      createElement: (tag: string) => new MockDOMElement(tag),
      getElementById: (id: string) => mockBody.querySelector(`#${id}`),
    };

    (global as any).window = {
      addEventListener: (evt: string, handler: any) => {
        if (!eventListeners[evt]) eventListeners[evt] = [];
        eventListeners[evt].push(handler);
      },
      removeEventListener: (evt: string, handler: any) => {
        if (eventListeners[evt]) {
          eventListeners[evt] = eventListeners[evt].filter((h) => h !== handler);
        }
      },
      setTimeout: (fn: any, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: any) => clearTimeout(id),
      setInterval: (fn: any, ms: number) => setInterval(fn, ms),
      clearInterval: (id: any) => clearInterval(id),
    };

    (global as any).Audio = class MockAudio {
      public volume = 1;
      play() {
        return Promise.resolve();
      }
      pause() {}
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    (global as any).document = originalDocument;
    (global as any).window = originalWindow;
    (global as any).Audio = originalAudio;
  });

  it('mounts World Intro overlay with video stage and story stage', () => {
    const onComplete = vi.fn();
    const ctrl = playWorldIntro({ onComplete });

    const overlay = mockBody.querySelector('#worldIntroOverlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.querySelector('#worldIntroVideo')).not.toBeNull();
    expect(overlay?.querySelector('#worldIntroStoryStage')).not.toBeNull();
    expect(overlay?.querySelector('#worldIntroFlash')).not.toBeNull();

    ctrl.destroy();
  });

  it('smoothly transitions from video to manga story stage with white flash and audio fade', () => {
    const onComplete = vi.fn();
    const ctrl = playWorldIntro({ onComplete });

    const videoStage = mockBody.querySelector('#worldIntroVideoStage');
    const storyStage = mockBody.querySelector('#worldIntroStoryStage');
    const flashEl = mockBody.querySelector('#worldIntroFlash');

    expect(videoStage?.classList.contains('fade-out')).toBe(false);
    expect(storyStage?.classList.contains('active')).toBe(false);

    // Trigger transition by clicking "Xem Truyện ▶"
    const btnSkipToStory = mockBody.querySelector('#btnIntroSkipToStory');
    btnSkipToStory?.dispatchEvent({ type: 'click', stopPropagation: () => {} });

    // Video begins fading out and flash activates
    expect(videoStage?.classList.contains('fade-out')).toBe(true);
    expect(flashEl?.classList.contains('flash-active')).toBe(true);

    // Advance timers for crossfade
    vi.advanceTimersByTime(450);
    expect(storyStage?.classList.contains('active')).toBe(true);

    ctrl.destroy();
  });

  it('navigates through 6 manga story pages and updates narration page indicator', () => {
    const onComplete = vi.fn();
    const ctrl = playWorldIntro({ onComplete });

    // Skip to story
    const btnSkipToStory = mockBody.querySelector('#btnIntroSkipToStory');
    btnSkipToStory?.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    vi.advanceTimersByTime(500);

    const btnNext = mockBody.querySelector('#btnStoryNext');
    const btnPrev = mockBody.querySelector('#btnStoryPrev');
    const indicator = mockBody.querySelector('#narrationPageIndicator');

    expect(indicator?.textContent).toContain('Trang 1 / 6');
    expect(btnPrev?.disabled).toBe(true);

    // Page 2
    btnNext?.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    vi.advanceTimersByTime(200);
    expect(indicator?.textContent).toContain('Trang 2 / 6');
    expect(btnPrev?.disabled).toBe(false);

    // Page 3
    btnNext?.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    vi.advanceTimersByTime(200);
    expect(indicator?.textContent).toContain('Trang 3 / 6');

    // Page 4
    btnNext?.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    vi.advanceTimersByTime(200);
    expect(indicator?.textContent).toContain('Trang 4 / 6');

    // Page 5
    btnNext?.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    vi.advanceTimersByTime(200);
    expect(indicator?.textContent).toContain('Trang 5 / 6');

    // Page 6
    btnNext?.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    vi.advanceTimersByTime(200);
    expect(indicator?.textContent).toContain('Trang 6 / 6');
    expect(btnNext?.innerHTML).toContain('Bắt Đầu Hành Trình');

    ctrl.destroy();
  });

  it('completes the intro and triggers transition curtain with "SAU LÚC ĐÓ..." to Pallet Town', () => {
    const onComplete = vi.fn();
    const ctrl = playWorldIntro({ onComplete });

    // Jump to story
    const btnSkipToStory = mockBody.querySelector('#btnIntroSkipToStory');
    btnSkipToStory?.dispatchEvent({ type: 'click', stopPropagation: () => {} });
    vi.advanceTimersByTime(500);

    // Advance to end of story (6 pages)
    ctrl.nextPage(); // Page 2
    ctrl.nextPage(); // Page 3
    ctrl.nextPage(); // Page 4
    ctrl.nextPage(); // Page 5
    ctrl.nextPage(); // Page 6
    ctrl.nextPage(); // Finish!

    const morningCurtain = mockBody.querySelector('#worldIntroMorning');
    const overlay = mockBody.querySelector('#worldIntroOverlay');
    expect(morningCurtain?.classList.contains('show')).toBe(true);
    expect(overlay?.innerHTML).toContain('SAU LÚC ĐÓ...');

    // Advance transition curtain timer
    vi.advanceTimersByTime(2600);
    expect(onComplete).toHaveBeenCalled();
  });

  it('skips immediately when Escape key or Skip button is pressed', () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    playWorldIntro({ onComplete, onSkip });

    // Press Escape
    const keyHandlers = eventListeners['keydown'] || [];
    for (const h of keyHandlers) {
      h({ key: 'Escape', preventDefault: () => {} });
    }

    expect(onSkip).toHaveBeenCalled();
    expect(mockBody.querySelector('#worldIntroOverlay')).toBeNull();
  });
});
