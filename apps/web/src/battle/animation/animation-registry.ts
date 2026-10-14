/// <reference types="vite/client" />
import moveMapData from '../../../../../packages/game-data/move-animation-map.json';
import moveExtensionData from '../../../../../packages/game-data/move-animation-extensions.json';
import fallbackData from '../../../../../packages/game-data/animation-fallbacks.json';
import manifestData from '../../../../../packages/game-data/animations/manifest.json';
import lastChanceManifestData from '../../../../../packages/game-data/last-chance-animation-manifest.json';
import lastChanceRejectionsData from '../../../../../packages/game-data/last-chance-animation-rejections.json';
import type { BattleAnimationDefinition } from './types';
import { ANIMATION_OVERRIDES } from './animation-overrides';

interface MoveMapPayload {
  moves: Record<string, number>;
  opponentMoves: Record<string, number>;
  replacedMoves?: Record<string, number>;
  replacedOpponentMoves?: Record<string, number>;
}

interface AnimationManifestPayload {
  [id: string]: unknown;
}

export class BattleAnimationRegistry {
  private static instance: BattleAnimationRegistry;
  private moveMap: MoveMapPayload = moveMapData as MoveMapPayload;
  private moveExtensions: MoveMapPayload = moveExtensionData as MoveMapPayload;
  private rejectedExtensionIds = new Set(
    (lastChanceRejectionsData as Array<{ sourceId: number }>).map((entry) =>
      String(6000 + entry.sourceId)
    )
  );
  private fallbacks: Record<string, Record<string, string>> = fallbackData as Record<
    string,
    Record<string, string>
  >;
  private definitionsCache: Map<string, BattleAnimationDefinition> = new Map();

  // Glob loader for on-demand lazy loading of individual animations (excluding manifest.json)
  private definitionLoaders: Record<string, () => Promise<unknown>> = import.meta.glob(
    '../../../../../packages/game-data/animations/[0-9]*.json'
  );
  private extensionDefinitionLoaders: Record<string, () => Promise<unknown>> = import.meta.glob(
    '../../../../../packages/game-data/animations/last-chance/[0-9]*.json'
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
   * Checks whether an animation definition exists (cached, override, manifest, or file glob).
   */
  public hasDefinition(animId: number | string): boolean {
    const key = String(animId);
    if (this.rejectedExtensionIds.has(key)) {
      return false;
    }
    if (this.definitionsCache.has(key) || ANIMATION_OVERRIDES[key] !== undefined) {
      return true;
    }
    const manifestEntry = (manifestData as AnimationManifestPayload)[key];
    const extensionManifestEntry = (lastChanceManifestData as AnimationManifestPayload)[key];
    if (manifestEntry !== undefined || extensionManifestEntry !== undefined) {
      return true;
    }
    const globPath = `../../../../../packages/game-data/animations/${key}.json`;
    const extensionGlobPath = `../../../../../packages/game-data/animations/last-chance/${key}.json`;
    return Boolean(
      this.definitionLoaders[globPath] || this.extensionDefinitionLoaders[extensionGlobPath]
    );
  }

  /**
   * Resolves the animation ID for a given move request, handling:
   * 1. Opponent variants for enemy battlers.
   * 2. Direct regular move mappings.
   * 3. Multi-hit variants (baseAnimationId + hitNum) when valid.
   * 4. Fallbacks by move Type and Category from animation-fallbacks.
   * 5. Ultimate fallback to 'tackle' (anim ID 275).
   */
  public resolveAnimationId(
    moveId: string,
    isEnemy = false,
    moveType?: string,
    moveCategory: 'physical' | 'special' | 'status' = 'physical',
    hitNum = 0
  ): number {
    const norm = this.normalizeMoveId(moveId);
    const noUnderscore = norm.replace(/_/g, '');

    let baseAnimId: number | undefined;

    // 1. Check opponent variant if enemy
    if (isEnemy) {
      if (this.moveExtensions.replacedOpponentMoves) {
        baseAnimId = this.lookupMove(this.moveExtensions.replacedOpponentMoves, norm, noUnderscore);
      }
      if (baseAnimId === undefined) {
        baseAnimId = this.lookupMove(this.moveMap.opponentMoves, norm, noUnderscore);
      }
      if (baseAnimId === undefined) {
        baseAnimId = this.lookupMove(this.moveExtensions.opponentMoves, norm, noUnderscore);
      }
    }

    // 2. Check regular move mapping (priority: replacedMoves > moveMap > moveExtensions)
    if (baseAnimId === undefined) {
      if (this.moveExtensions.replacedMoves) {
        baseAnimId = this.lookupMove(this.moveExtensions.replacedMoves, norm, noUnderscore);
      }
      if (baseAnimId === undefined) {
        baseAnimId = this.lookupMove(this.moveMap.moves, norm, noUnderscore);
      }
      if (baseAnimId === undefined) {
        baseAnimId = this.lookupMove(this.moveExtensions.moves, norm, noUnderscore);
      }
    }

    // If resolved from standard moves / opponentMoves / extensions, handle multi-hit hitNum
    if (baseAnimId !== undefined) {
      if (hitNum > 0) {
        const candidateId = baseAnimId + hitNum;
        if (this.hasDefinition(candidateId)) {
          return candidateId;
        }
        console.warn(
          `[BattleAnimationRegistry] Multi-hit variant ID ${candidateId} not found for move '${norm}' (hitNum: ${hitNum}). Falling back to base ID ${baseAnimId}.`
        );
      }
      return baseAnimId;
    }

    // 3. Check fallback by type and category (do NOT apply hitNum to generic type fallbacks)
    if (moveType) {
      const typeKey = moveType.toUpperCase();
      const typeFallback = this.fallbacks[typeKey];
      if (typeFallback) {
        const catKey = `${moveCategory}move`;
        const fallbackMove = typeFallback[catKey] || typeFallback['physicalmove'];
        if (fallbackMove) {
          const fallbackNorm = this.normalizeMoveId(fallbackMove);
          const fallbackNoUnderscore = fallbackNorm.replace(/_/g, '');
          const fallbackAnimId =
            (this.moveExtensions.replacedMoves
              ? this.lookupMove(
                  this.moveExtensions.replacedMoves,
                  fallbackNorm,
                  fallbackNoUnderscore
                )
              : undefined) ??
            this.lookupMove(this.moveMap.moves, fallbackNorm, fallbackNoUnderscore) ??
            this.lookupMove(this.moveExtensions.moves, fallbackNorm, fallbackNoUnderscore);
          if (fallbackAnimId !== undefined) {
            return fallbackAnimId;
          }
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
    if (this.rejectedExtensionIds.has(key)) {
      return null;
    }
    if (this.definitionsCache.has(key)) {
      return this.definitionsCache.get(key)!;
    }

    const override = ANIMATION_OVERRIDES[key];
    if (override) {
      this.definitionsCache.set(key, override);
      return override;
    }

    // Try the original pack first, then the namespaced Last Chance pack.
    const loaders = [
      this.definitionLoaders[`../../../../../packages/game-data/animations/${key}.json`],
      this.extensionDefinitionLoaders[
        `../../../../../packages/game-data/animations/last-chance/${key}.json`
      ],
    ];
    for (const loader of loaders) {
      if (!loader) continue;
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
    for (const url of [
      `/packages/game-data/animations/${key}.json`,
      `/packages/game-data/animations/last-chance/${key}.json`,
    ]) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const def = (await res.json()) as BattleAnimationDefinition;
          this.definitionsCache.set(key, def);
          return def;
        }
      } catch {
        // Try the next pack URL.
      }
    }

    return null;
  }

  /**
   * Synchronously inspects animation metadata from manifest.
   */
  public getManifestEntry(animId: number | string) {
    const key = String(animId);
    return (
      (manifestData as AnimationManifestPayload)[key] ??
      (lastChanceManifestData as AnimationManifestPayload)[key]
    );
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

  public isReplacedMove(moveId: string): boolean {
    const norm = this.normalizeMoveId(moveId);
    return Boolean(
      this.moveExtensions.replacedMoves?.[norm] ||
      this.moveExtensions.replacedMoves?.[norm.replace(/_/g, '')]
    );
  }

  public isExtensionMove(moveId: string): boolean {
    const norm = this.normalizeMoveId(moveId);
    return Boolean(
      this.moveExtensions.moves?.[norm] || this.moveExtensions.moves?.[norm.replace(/_/g, '')]
    );
  }

  private lookupMove(
    map: Record<string, number>,
    normalized: string,
    withoutUnderscores: string
  ): number | undefined {
    return map[normalized] ?? map[withoutUnderscores];
  }
}

export const ANIMATION_REGISTRY = BattleAnimationRegistry.getInstance();
