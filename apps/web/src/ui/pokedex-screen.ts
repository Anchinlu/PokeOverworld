import { PokedexController } from './pokedex/pokedex-controller';

export class PokedexUI {
  private static instance: PokedexUI | null = null;
  private readonly controller: PokedexController;

  private constructor() {
    this.controller = new PokedexController();
  }

  public static getInstance(): PokedexUI {
    if (!PokedexUI.instance) {
      PokedexUI.instance = new PokedexUI();
    }
    return PokedexUI.instance;
  }

  public open(initialPokemonId?: number): void {
    this.controller.open(initialPokemonId);
  }

  public close(): void {
    this.controller.close();
  }

  public toggle(): void {
    this.controller.toggle();
  }

  public isVisible(): boolean {
    return this.controller.isVisible();
  }

  public getController(): PokedexController {
    return this.controller;
  }
}

export function initPokedex(): PokedexUI {
  return PokedexUI.getInstance();
}

export function openPokedex(pokemonId?: number): void {
  PokedexUI.getInstance().open(pokemonId);
}

export function closePokedex(): void {
  PokedexUI.getInstance().close();
}

export function togglePokedex(): void {
  PokedexUI.getInstance().toggle();
}

export function isPokedexOpen(): boolean {
  return PokedexUI.getInstance().isVisible();
}

// Re-export submodules for direct consumer access
export * from './pokedex';
