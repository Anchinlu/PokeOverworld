import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isFullscreen,
  toggleFullscreen,
  exitFullscreen,
  initDesktopShell,
} from '../src/shell/desktop';

describe('Desktop Shell & Fullscreen', () => {
  let listeners: Record<string, ((e: any) => void)[]> = {};
  let originalWindow: any;
  let originalDocument: any;

  beforeEach(() => {
    listeners = {};

    const mockElement = {
      title: '',
      innerText: '',
      addEventListener: vi.fn((type: string, handler: any) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(handler);
      }),
    };

    const mockDocument = {
      fullscreenElement: null as any,
      documentElement: {
        requestFullscreen: vi.fn().mockResolvedValue(undefined),
      },
      exitFullscreen: vi.fn().mockResolvedValue(undefined),
      querySelector: vi.fn((sel: string) => {
        if (sel === '#btnToggleFullscreen') return mockElement;
        return null;
      }),
      addEventListener: vi.fn((type: string, handler: any) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(handler);
      }),
    };

    const mockWindow = {
      addEventListener: vi.fn((type: string, handler: any) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(handler);
      }),
      dispatchEvent: vi.fn((event: any) => {
        const fns = listeners[event.type] || [];
        for (const fn of fns) fn(event);
      }),
    };

    originalWindow = (globalThis as any).window;
    originalDocument = (globalThis as any).document;

    (globalThis as any).window = mockWindow;
    (globalThis as any).document = mockDocument;
  });

  afterEach(() => {
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  });

  it('correctly reports initial fullscreen state', () => {
    expect(isFullscreen()).toBe(false);
  });

  it('calls requestFullscreen when entering fullscreen', async () => {
    await toggleFullscreen();
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('calls exitFullscreen when exiting fullscreen', async () => {
    (document as any).fullscreenElement = document.documentElement;

    await toggleFullscreen();
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('registers keyboard shortcuts for F11 and Escape', () => {
    const shell = initDesktopShell();
    expect(shell).toBeDefined();

    let prevented = false;
    const f11Event = {
      type: 'keydown',
      key: 'F11',
      code: 'F11',
      preventDefault: () => {
        prevented = true;
      },
    };

    window.dispatchEvent(f11Event as any);
    expect(prevented).toBe(true);
    expect(document.documentElement.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('handles Escape key to exit fullscreen only when active', () => {
    initDesktopShell();

    // When not in fullscreen
    const escEvent1 = {
      type: 'keydown',
      key: 'Escape',
      code: 'Escape',
      defaultPrevented: false,
    };
    window.dispatchEvent(escEvent1 as any);
    expect(document.exitFullscreen).not.toHaveBeenCalled();

    // When in fullscreen
    (document as any).fullscreenElement = document.documentElement;
    const escEvent2 = {
      type: 'keydown',
      key: 'Escape',
      code: 'Escape',
      defaultPrevented: false,
    };
    window.dispatchEvent(escEvent2 as any);
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });
});
