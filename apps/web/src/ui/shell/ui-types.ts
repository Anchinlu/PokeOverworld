/**
 * Shared contracts for overworld UI orchestration.
 *
 * These types deliberately contain no DOM implementation. Screens can adopt
 * the contract incrementally without changing their existing rendering code.
 */
export type UiMode = 'overworld' | 'screen' | 'modal' | 'battle' | 'transition';

export type UiScreenId =
  'pokedex' | 'party' | 'bag' | 'storage' | 'world_map' | 'settings' | 'trainer_card';

export interface UiScreenLifecycle {
  mount(): void;
  open(): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

export interface UiScreenRegistration {
  id: UiScreenId;
  pauseWorld: boolean;
  exclusive: boolean;
  getScreen(): UiScreenLifecycle;
}

export interface UiInputContext {
  mode: UiMode;
  activeScreen: UiScreenId | null;
  hasModal: boolean;
}

export interface UiInputRouter {
  setContext(context: UiInputContext): void;
  registerScreenHandler(
    screenId: UiScreenId,
    handler: (event: KeyboardEvent) => boolean
  ): () => void;
  handle(event: KeyboardEvent): boolean;
  destroy(): void;
}

export interface UiManagerContract {
  getMode(): UiMode;
  getActiveScreen(): UiScreenId | null;
  registerScreen(registration: UiScreenRegistration): void;
  openScreen(screenId: UiScreenId): boolean;
  closeScreen(screenId?: UiScreenId): boolean;
  closeAll(): void;
}
