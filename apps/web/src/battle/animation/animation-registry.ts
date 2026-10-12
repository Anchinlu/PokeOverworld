/// <reference types="vite/client" />
import moveMapData from '../../../../../packages/game-data/move-animation-map.json';
import fallbackData from '../../../../../packages/game-data/animation-fallbacks.json';
import manifestData from '../../../../../packages/game-data/animations/manifest.json';
import type { BattleAnimationDefinition } from './types';
import { ANIMATION_OVERRIDES } from './animation-overrides';

interface MoveMapPayload {
  moves: Record<string, number>;
  opponentMoves: Record<string, number>;
}

export class BattleAnimationRegistry {
  private static instance: BattleAnimationRegistry;
  private moveMap: MoveMapPayload = moveMapData as MoveMapPayload;
  private fallbacks: Record<string, Record<string, string>> = fallbackData as Record<
    string,
    Record<string, string>
  >;
  private definitionsCache: Map<string, BattleAnimationDefinition> = new Map();

  // Glob loader for on-demand lazy loading of individual animations (excluding manifest.json)
  private definitionLoaders: Record<string, () => Promise<unknown>> = import.meta.glob(
    '../../../../../packages/game-data/animations/[0-9]*.json'
  );

  private constructor() {}

  public static getInstance(): BattleAnimationRegistry {
    if (!BattleAnimationRegistry.instance) {
      BattleAnimationRegistry.instance = new BattleAnimationRegistry();
    }
    return BattleAnimationRegistry.instance;
  }

  /**
   * Normalizes move ID to standard key format (lowercase, underscores).
   */
  public normalizeMoveId(moveId: string): string {
    return moveId
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  /**
   * Resolves the animation ID for a given move request, handling:
   * 1. Opponent variants for enemy battlers.
   * 2. Direct regular move mappings.
   * 3. Fallbacks by move Type and Category from animation-fallbacks.
   * 4. Ultimate fallback to 'tackle' (anim ID 275).
   */
  public resolveAnimationId(
    moveId: string,
    isEnemy = false,
    moveType?: string,
    moveCategory: 'physical' | 'special' | 'status' = 'physical'
  ): number {
    const norm = this.normalizeMoveId(moveId);
    const noUnderscore = norm.replace(/_/g, '');

    // 1. Check opponent variant if enemy
    if (isEnemy) {
      if (this.moveMap.opponentMoves[norm] !== undefined) {
        return this.moveMap.opponentMoves[norm];
      }
      if (this.moveMap.opponentMoves[noUnderscore] !== undefined) {
        return this.moveMap.opponentMoves[noUnderscore];
      }
    }

    // 2. Check regular move mapping
    if (this.moveMap.moves[norm] !== undefined) {
      return this.moveMap.moves[norm];
    }
    if (this.moveMap.moves[noUnderscore] !== undefined) {
      return this.moveMap.moves[noUnderscore];
    }

    // 3. Check fallback by type and category
    if (moveType) {
      const typeKey = moveType.toUpperCase();
      const typeFallback = this.fallbacks[typeKey];
      if (typeFallback) {
        const catKey = `${moveCategory}move`;
        const fallbackMove = typeFallback[catKey] || typeFallback['physicalmove'];
        if (fallbackMove && this.moveMap.moves[fallbackMove] !== undefined) {
          return this.moveMap.moves[fallbackMove];
        }
      }
    }

    // 4. Default fallback: tackle (id 275)
    return this.moveMap.moves['tackle'] ?? 275;
  }

  /**
   * Asynchronously loads the animation definition by its numeric or string ID.
   */
  public async getDefinition(animId: number | string): Promise<BattleAnimationDefinition | null> {
    const key = String(animId);
    if (this.definitionsCache.has(key)) {
      return this.definitionsCache.get(key)!;
    }

    const override = ANIMATION_OVERRIDES[key];
    if (override) {
      this.definitionsCache.set(key, override);
      return override;
    }

    // Try glob loader
    const globPath = `../../../../../packages/game-data/animations/${key}.json`;
    const loader = this.definitionLoaders[globPath];
    if (loader) {
      try {
        const rawMod = await loader();
        const mod = rawMod as { default?: BattleAnimationDefinition } | BattleAnimationDefinition;
        const def = (
          'default' in mod && mod.default ? mod.default : mod
        ) as BattleAnimationDefinition;
        this.definitionsCache.set(key, def);
        return def;
      } catch (err) {
        console.warn(`[BattleAnimationRegistry] Failed to load animation ${key}:`, err);
      }
    }

    // Fallback: fetch via URL if dynamic import fails
    try {
      const res = await fetch(`/packages/game-data/animations/${key}.json`);
      if (res.ok) {
        const def = (await res.json()) as BattleAnimationDefinition;
        this.definitionsCache.set(key, def);
        return def;
      }
    } catch {
      // Ignored
    }

    return null;
  }

  /**
   * Synchronously inspects animation metadata from manifest.
   */
  public getManifestEntry(animId: number | string) {
    return (manifestData as Record<string, unknown>)[String(animId)];
  }

  /**
   * Pre-registers a custom in-memory animation definition (useful for testing or overrides).
   */
  public registerDefinition(id: string | number, definition: BattleAnimationDefinition): void {
    this.definitionsCache.set(String(id), definition);
  }

  public clearCache(): void {
    this.definitionsCache.clear();
  }
}

export const ANIMATION_REGISTRY = BattleAnimationRegistry.getInstance();
