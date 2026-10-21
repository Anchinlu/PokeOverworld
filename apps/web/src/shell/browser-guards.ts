/**
 * Browser-facing restrictions for the game shell.
 *
 * These are UX protections, not a security boundary: a user who controls the
 * browser can always inspect or modify a web application. The Tauri release
 * window disables its native web inspector separately.
 */
export function installBrowserGuards(): () => void {
  const blockDeveloperShortcuts = !import.meta.env.DEV;

  const onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!blockDeveloperShortcuts) return;

    const key = event.key.toLowerCase();
    const commandOrControl = event.ctrlKey || event.metaKey;
    const opensDeveloperTools =
      event.key === 'F12' || (commandOrControl && event.shiftKey && ['i', 'j', 'c'].includes(key));
    const opensViewSource = commandOrControl && key === 'u';

    if (opensDeveloperTools || opensViewSource) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  document.addEventListener('contextmenu', onContextMenu, true);
  window.addEventListener('keydown', onKeyDown, true);

  return () => {
    document.removeEventListener('contextmenu', onContextMenu, true);
    window.removeEventListener('keydown', onKeyDown, true);
  };
}
