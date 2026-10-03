/**
 * Desktop Shell Management for PokeOverworld
 * Handles window fullscreen toggle, keyboard shortcuts (F11, Escape),
 * and desktop preview lifecycle without coupling with game domain logic.
 */

export function isFullscreen(): boolean {
  return !!document.fullscreenElement;
}

export async function toggleFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.warn('[DesktopShell] Fullscreen request error:', err);
  }
}

export async function exitFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch (err) {
    console.warn('[DesktopShell] Exit fullscreen error:', err);
  }
}

export function initDesktopShell(): {
  toggleFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  isFullscreen: () => boolean;
} {
  const btnToggleFullscreen = document.querySelector<HTMLButtonElement>('#btnToggleFullscreen');

  const updateFullscreenUI = (): void => {
    if (btnToggleFullscreen) {
      const active = isFullscreen();
      btnToggleFullscreen.title = active
        ? 'Thoát toàn màn hình (Esc hoặc F11)'
        : 'Toàn màn hình (F11)';
      btnToggleFullscreen.innerText = active ? '🗗' : '⛶';
    }
  };

  btnToggleFullscreen?.addEventListener('click', () => {
    void toggleFullscreen();
  });

  document.addEventListener('fullscreenchange', updateFullscreenUI);

  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // F11: Toggle fullscreen
    if (e.key === 'F11' || e.code === 'F11') {
      e.preventDefault();
      void toggleFullscreen();
      return;
    }

    // Escape: Exit fullscreen if active and not already handled by a modal/pokedex
    if ((e.key === 'Escape' || e.code === 'Escape') && isFullscreen()) {
      if (!e.defaultPrevented) {
        void exitFullscreen();
      }
    }
  });

  return {
    toggleFullscreen,
    exitFullscreen,
    isFullscreen,
  };
}
