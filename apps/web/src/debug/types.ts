export interface CustomBotConfig {
  speciesKey: string;
  level: number;
  isShiny: boolean;
  ability?: string;
  moves?: string[];
  overlay?: string;
  weather?: string;
}

export interface DebugMonitorUpdate {
  playerGx: number;
  playerGy: number;
  playerX: number;
  playerY: number;
  chunkX: number;
  chunkY: number;
  activeChunksCount: number;
  fps: number;
}

/**
 * Remote Action Bridge for Debug Overlay.
 * Allows the debug overlay to interact with game systems remotely
 * without hard-coupling or bloating main game core modules.
 */
export interface DebugBridge {
  // Battle & Custom Bot Spawner
  startTestBattle(overlay?: string, isShiny?: boolean, weather?: string): void;
  startCustomBotBattle(config: CustomBotConfig): void;

  // Bag & Items
  addItemToBag(itemId: string, count: number): void;
  addStarterItems(): void;
  addAllBalls(): void;
  addAllMachines(): void;
  addFullItems(): void;
  openBag(): void;

  // Party Management
  addPartyPokemon(speciesKey: string, level: number, isShiny: boolean): void;
  addRandomPartyPokemon(isShiny: boolean): void;
  fillPartyPokemon(isShiny: boolean): void;
  resetPartyPokemon(): void;
  spawnShinyWild(speciesKey?: string): void;
  getPartySize(): number;
  subscribePartyChange?(cb: (size: number) => void): () => void;

  // World & Player Flow
  regenerateMap(seed: number): void;
  resetPlayerPosition(): void;
  replayIntro(): void;
  saveGame(): void;
  loadGame(): void;

  // Render & Simulation Options
  setRenderOption(key: string, value: boolean): void;
  setBerryCycle(seconds: number): void;
  setBerryStageOverride(stage: number | null): void;
  isCollisionEnabled(): boolean;
}
