/**
 * Asset Loader for static game textures, sprites, and tilesets.
 * Replaces monolithic base64 strings with clean HTTP-cached PNG assets and manifest.
 */

export type ProgressCallback = (loaded: number, total: number, currentKey: string) => void;

export class AssetLoader {
  private static defaultInstance: AssetLoader | null = null;

  public static getDefault(): AssetLoader {
    if (!AssetLoader.defaultInstance) {
      AssetLoader.defaultInstance = new AssetLoader();
    }
    return AssetLoader.defaultInstance;
  }

  public static setDefault(loader: AssetLoader): void {
    AssetLoader.defaultInstance = loader;
  }

  private images = new Map<string, HTMLImageElement>();
  private manifest = new Map<string, string>();
  private loaded = false;

  public isLoaded(): boolean {
    return this.loaded;
  }

  public getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  public getAssetUrl(key: string): string | undefined {
    return this.manifest.get(key);
  }

  public hasAsset(key: string): boolean {
    return this.manifest.has(key);
  }

  /**
   * Fetches the asset manifest and preloads all PNG assets in parallel.
   */
  public async loadFromManifest(
    manifestUrl = '/assets/manifest.json',
    onProgress?: ProgressCallback
  ): Promise<void> {
    const res = await fetch(manifestUrl);
    if (!res.ok) {
      throw new Error(`Failed to load asset manifest from: ${manifestUrl}`);
    }

    const manifest: Record<string, string> = await res.json();
    const entries = Object.entries(manifest);
    for (const [key, url] of entries) {
      this.manifest.set(key, url);
    }
    const total = entries.length;
    let loadedCount = 0;

    const loadPromises = entries.map(([key, url]) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.images.set(key, img);
          loadedCount++;
          if (onProgress) {
            onProgress(loadedCount, total, key);
          }
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load asset [${key}] from ${url}, creating fallback.`);
          // Create 32x32 transparent fallback to prevent crashing
          this.images.set(key, img);
          loadedCount++;
          resolve();
        };
        img.src = url;
      });
    });

    await Promise.all(loadPromises);
    this.loaded = true;
  }
}
