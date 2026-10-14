import atlasData from '../../../../../packages/game-data/animation-atlas.json';
import lastChanceAtlasData from '../../../../../packages/game-data/last-chance-animation-atlas.json';
import type { AnimationAtlasEntry } from './types';

export class AnimationAssetRegistry {
  private static instance: AnimationAssetRegistry;
  private atlasMap: Map<string, AnimationAtlasEntry> = new Map();
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  private constructor() {
    for (const atlas of [atlasData, lastChanceAtlasData]) {
      for (const [key, entry] of Object.entries(atlas)) {
        this.atlasMap.set(key.toLowerCase(), entry as AnimationAtlasEntry);
      }
    }
  }

  public static getInstance(): AnimationAssetRegistry {
    if (!AnimationAssetRegistry.instance) {
      AnimationAssetRegistry.instance = new AnimationAssetRegistry();
    }
    return AnimationAssetRegistry.instance;
  }

  public getAtlas(graphicName: string): AnimationAtlasEntry | undefined {
    return this.atlasMap.get(graphicName.toLowerCase());
  }

  public hasAtlas(graphicName: string): boolean {
    return this.atlasMap.has(graphicName.toLowerCase());
  }

  public getImagePath(graphicName: string): string {
    const entry = this.getAtlas(graphicName);
    const fileName = entry ? entry.file : `${graphicName}.png`;
    return `/Graphics/Animations/${fileName}`;
  }

  public loadImage(graphicName: string): Promise<HTMLImageElement> {
    const key = graphicName.toLowerCase();
    if (this.imageCache.has(key)) {
      const img = this.imageCache.get(key)!;
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve(img);
      }
    }

    if (this.loadPromises.has(key)) {
      return this.loadPromises.get(key)!;
    }

    if (typeof Image === 'undefined') {
      const mockImg = {
        complete: true,
        naturalWidth: 960,
        naturalHeight: 960,
        src: '',
      } as unknown as HTMLImageElement;
      this.imageCache.set(key, mockImg);
      return Promise.resolve(mockImg);
    }

    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      const onReady = () => {
        this.imageCache.set(key, img);
        this.loadPromises.delete(key);
        resolve(img);
      };
      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().then(onReady).catch(onReady);
        } else {
          onReady();
        }
      };
      img.onerror = () => {
        this.loadPromises.delete(key);
        // Fallback or resolve with empty image to prevent battle freezing
        console.warn(`[AnimationAssetRegistry] Failed to load animation graphic: ${graphicName}`);
        resolve(img);
      };
      img.src = this.getImagePath(graphicName);
    });

    this.loadPromises.set(key, promise);
    return promise;
  }

  public getImage(graphicName: string): HTMLImageElement | undefined {
    return this.imageCache.get(graphicName.toLowerCase());
  }

  public preloadCommon(): Promise<HTMLImageElement[]> {
    const common = [
      'hit',
      'tackle',
      'normal',
      'claw',
      'bite',
      'fire',
      'water',
      'thunder',
      'ice',
      'grass',
    ];
    return Promise.all(common.map((g) => this.loadImage(g)));
  }

  public clearCache(): void {
    this.imageCache.clear();
    this.loadPromises.clear();
  }
}

export const ANIMATION_ASSETS = AnimationAssetRegistry.getInstance();
